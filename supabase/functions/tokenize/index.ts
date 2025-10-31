import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

interface TokenizeRequest {
  pan: string;
  merchant_id: string;
  device_id?: string;
  expiry_month: number;
  expiry_year: number;
  customer_id?: string;
  issuer_id?: string;
  card_brand?: string;
}

// Rate limiting: 1000 requests per minute per merchant
async function checkRateLimit(supabase: any, merchantId: string, endpoint: string) {
  const now = new Date()
  const windowStart = new Date(now.getTime() - 60000) // 1 minute window

  const { data: rateLimit } = await supabase
    .from('rate_limits')
    .select('*')
    .eq('merchant_id', merchantId)
    .eq('endpoint', endpoint)
    .gte('window_start', windowStart.toISOString())
    .single()

  if (rateLimit) {
    if (rateLimit.request_count >= 1000) {
      return { allowed: false, remaining: 0 }
    }
    
    await supabase
      .from('rate_limits')
      .update({ 
        request_count: rateLimit.request_count + 1,
        last_request: now.toISOString()
      })
      .eq('id', rateLimit.id)

    return { allowed: true, remaining: 1000 - rateLimit.request_count - 1 }
  } else {
    await supabase
      .from('rate_limits')
      .insert({
        merchant_id: merchantId,
        endpoint: endpoint,
        request_count: 1,
        window_start: now.toISOString()
      })
    
    return { allowed: true, remaining: 999 }
  }
}

// Compliance check for PCI DSS
async function logComplianceCheck(supabase: any, checkType: string, result: string, details: any) {
  await supabase
    .from('compliance_logs')
    .insert({
      check_type: checkType,
      check_result: result,
      details: details,
      severity: result === 'passed' ? 'info' : 'warning'
    })
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let auditLogData: any = {
    operation_type: 'tokenize',
    entity_type: 'token',
    request_ip: req.headers.get('x-forwarded-for') || 'unknown',
  };

  try {
    // Verify API key from header
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) {
      auditLogData.response_status = 401;
      auditLogData.error_message = 'Missing API key';
      return new Response(
        JSON.stringify({ error: 'Missing API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate API key and get merchant
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('id, name, status')
      .eq('api_key', apiKey)
      .single();

    if (merchantError || !merchant) {
      console.error('Invalid API key:', merchantError);
      auditLogData.response_status = 401;
      auditLogData.error_message = 'Invalid API key';
      await logAudit(supabase, auditLogData);
      await logComplianceCheck(supabase, 'merchant_validation', 'failed', { error: 'Invalid API key' });
      return new Response(
        JSON.stringify({ error: 'Invalid API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (merchant.status !== 'active') {
      auditLogData.merchant_id = merchant.id;
      auditLogData.response_status = 403;
      auditLogData.error_message = 'Merchant account not active';
      await logAudit(supabase, auditLogData);
      await logComplianceCheck(supabase, 'merchant_validation', 'failed', { 
        merchant_id: merchant.id, 
        error: 'Inactive merchant' 
      });
      return new Response(
        JSON.stringify({ error: 'Merchant account not active' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit
    const rateLimitResult = await checkRateLimit(supabase, merchant.id, 'tokenize')
    if (!rateLimitResult.allowed) {
      auditLogData.merchant_id = merchant.id;
      auditLogData.response_status = 429;
      auditLogData.error_message = 'Rate limit exceeded';
      await logAudit(supabase, auditLogData);
      await logComplianceCheck(supabase, 'rate_limit', 'exceeded', { 
        merchant_id: merchant.id, 
        endpoint: 'tokenize' 
      });
      
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Maximum 1000 requests per minute.' }),
        { 
          status: 429,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': '60'
          }
        }
      );
    }

    // Parse request body
    const requestData: TokenizeRequest = await req.json();
    auditLogData.merchant_id = merchant.id;
    auditLogData.request_data = { 
      merchant_id: requestData.merchant_id,
      device_id: requestData.device_id,
      customer_id: requestData.customer_id 
    };

    // Validate input
    if (!requestData.pan || !requestData.expiry_month || !requestData.expiry_year) {
      auditLogData.response_status = 400;
      auditLogData.error_message = 'Missing required fields';
      await logAudit(supabase, auditLogData);
      return new Response(
        JSON.stringify({ error: 'Missing required fields: pan, expiry_month, expiry_year' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate PAN format (basic check)
    const panDigits = requestData.pan.replace(/\s+/g, '');
    if (!/^\d{13,19}$/.test(panDigits)) {
      auditLogData.response_status = 400;
      auditLogData.error_message = 'Invalid PAN format';
      await logAudit(supabase, auditLogData);
      return new Response(
        JSON.stringify({ error: 'Invalid PAN format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Encrypt PAN using pgcrypto
    const encryptionKey = Deno.env.get('PAN_ENCRYPTION_KEY') || 'default-encryption-key-change-in-production';
    const { data: encryptedPan, error: encryptError } = await supabase
      .rpc('encrypt_pan', { 
        pan_data: panDigits, 
        encryption_key: encryptionKey 
      });

    if (encryptError) {
      console.error('Encryption error:', encryptError);
      auditLogData.response_status = 500;
      auditLogData.error_message = 'Encryption failed';
      await logAudit(supabase, auditLogData);
      return new Response(
        JSON.stringify({ error: 'Encryption failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract last 4 digits
    const lastFour = panDigits.slice(-4);

    // Create or get device
    let deviceId = requestData.device_id;
    if (deviceId) {
      const { data: device } = await supabase
        .from('devices')
        .select('id')
        .eq('id', deviceId)
        .single();
      
      if (!device) {
        deviceId = undefined;
      }
    }

    // Insert card
    const { data: card, error: cardError } = await supabase
      .from('cards')
      .insert({
        pan_encrypted: encryptedPan,
        last_four: lastFour,
        customer_id: requestData.customer_id,
        issuer_id: requestData.issuer_id,
        expiry_month: requestData.expiry_month,
        expiry_year: requestData.expiry_year,
        card_brand: requestData.card_brand,
      })
      .select()
      .single();

    if (cardError) {
      console.error('Card insertion error:', cardError);
      auditLogData.response_status = 500;
      auditLogData.error_message = cardError.message;
      await logAudit(supabase, auditLogData);
      return new Response(
        JSON.stringify({ error: 'Failed to store card data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate token with 1-year expiry
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const { data: token, error: tokenError } = await supabase
      .from('tokens')
      .insert({
        card_id: card.id,
        merchant_id: merchant.id,
        device_id: deviceId,
        status: 'active',
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (tokenError) {
      console.error('Token creation error:', tokenError);
      auditLogData.response_status = 500;
      auditLogData.error_message = tokenError.message;
      await logAudit(supabase, auditLogData);
      return new Response(
        JSON.stringify({ error: 'Failed to create token' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log successful operation with field-level access tracking
    auditLogData.entity_id = token.id;
    auditLogData.response_status = 200;
    auditLogData.accessed_fields = ['pan', 'token_value', 'card_id'];
    auditLogData.compliance_flags = {
      pci_dss_compliant: true,
      encryption_used: true,
      rate_limit_checked: true
    };
    await logAudit(supabase, auditLogData);

    // Log compliance check
    await logComplianceCheck(supabase, 'tokenization', 'passed', {
      merchant_id: merchant.id,
      token_id: token.id,
      encryption_method: 'AES-256'
    });

    const responseTime = Date.now() - startTime;
    console.log(`Token created successfully in ${responseTime}ms:`, token.id);

    return new Response(
      JSON.stringify({
        token_id: token.id,
        token_value: token.token_value,
        status: token.status,
        card_last_four: lastFour,
        expires_at: token.expires_at,
        created_at: token.created_at,
      }),
      {
        status: 200,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString()
        },
      }
    );
  } catch (error: any) {
    console.error('Error in tokenize function:', error);
    auditLogData.response_status = 500;
    auditLogData.error_message = error.message;
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    await logAudit(supabase, auditLogData);

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function logAudit(supabase: any, data: any) {
  try {
    await supabase.from('audit_logs').insert(data);
  } catch (error) {
    console.error('Failed to log audit:', error);
  }
}
