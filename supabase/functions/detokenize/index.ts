import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DetokenizeRequest {
  token_value: string;
}

// Role-based access control: Only admin and auditor roles can detokenize
async function checkUserRole(supabase: any, userId: string, allowedRoles: string[]) {
  const { data: roles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)

  if (!roles || roles.length === 0) {
    return { hasAccess: false, userRole: null }
  }

  const userRole = roles[0].role
  return { hasAccess: allowedRoles.includes(userRole), userRole }
}

// Compliance check for detokenization
async function logComplianceCheck(supabase: any, checkType: string, result: string, details: any) {
  await supabase
    .from('compliance_logs')
    .insert({
      check_type: checkType,
      check_result: result,
      details: details,
      severity: result === 'passed' ? 'info' : 'critical'
    })
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let auditLogData: any = {
    operation_type: 'detokenize',
    entity_type: 'token',
    request_ip: req.headers.get('x-forwarded-for') || 'unknown',
  };

  try {
    // This endpoint requires authentication (JWT)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      auditLogData.response_status = 401;
      auditLogData.error_message = 'Missing authorization header';
      await logComplianceCheck(null, 'detokenization_auth', 'failed', { error: 'Missing authorization' });
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role for internal operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user session and role
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      auditLogData.response_status = 401;
      auditLogData.error_message = 'Invalid user session';
      await logAudit(supabase, auditLogData);
      await logComplianceCheck(supabase, 'detokenization_auth', 'failed', { error: 'Invalid user session' });
      
      return new Response(
        JSON.stringify({ error: 'Invalid user session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has admin or auditor role
    const roleCheck = await checkUserRole(supabase, user.id, ['admin', 'auditor'])
    if (!roleCheck.hasAccess) {
      auditLogData.user_id = user.id;
      auditLogData.response_status = 403;
      auditLogData.error_message = 'Insufficient privileges';
      await logAudit(supabase, auditLogData);
      await logComplianceCheck(supabase, 'detokenization_authorization', 'failed', { 
        user_id: user.id,
        required_roles: ['admin', 'auditor'],
        error: 'Insufficient privileges'
      });
      
      return new Response(
        JSON.stringify({ error: 'Access denied. Only admin and auditor roles can detokenize.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    auditLogData.user_id = user.id;

    // Parse request body
    const requestData: DetokenizeRequest = await req.json();
    auditLogData.request_data = { token_value: requestData.token_value?.substring(0, 8) + '...' };

    if (!requestData.token_value) {
      auditLogData.response_status = 400;
      auditLogData.error_message = 'Missing token_value';
      await logAudit(supabase, auditLogData);
      return new Response(
        JSON.stringify({ error: 'Missing token_value' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find token
    const { data: tokenData, error: tokenError } = await supabase
      .from('tokens')
      .select(`
        id,
        token_value,
        status,
        expires_at,
        merchant_id,
        card_id
      `)
      .eq('token_value', requestData.token_value)
      .single();

    if (tokenError || !tokenData) {
      console.error('Token not found:', tokenError);
      auditLogData.response_status = 404;
      auditLogData.error_message = 'Token not found';
      await logAudit(supabase, auditLogData);
      return new Response(
        JSON.stringify({ error: 'Token not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get card data separately
    const { data: card, error: cardError } = await supabase
      .from('cards')
      .select('pan_encrypted, last_four, expiry_month, expiry_year, card_brand, customer_id, issuer_id')
      .eq('id', tokenData.card_id)
      .single();

    if (cardError || !card) {
      console.error('Card not found:', cardError);
      auditLogData.response_status = 404;
      auditLogData.error_message = 'Card not found';
      await logAudit(supabase, auditLogData);
      return new Response(
        JSON.stringify({ error: 'Card not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    auditLogData.entity_id = tokenData.id;
    auditLogData.merchant_id = tokenData.merchant_id;

    // Check token status
    if (tokenData.status !== 'active') {
      auditLogData.response_status = 403;
      auditLogData.error_message = `Token is ${tokenData.status}`;
      await logAudit(supabase, auditLogData);
      return new Response(
        JSON.stringify({ error: `Token is ${tokenData.status}` }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check token expiry
    if (new Date(tokenData.expires_at) < new Date()) {
      auditLogData.response_status = 403;
      auditLogData.error_message = 'Token expired';
      await logAudit(supabase, auditLogData);
      return new Response(
        JSON.stringify({ error: 'Token expired' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Decrypt PAN
    const encryptionKey = Deno.env.get('PAN_ENCRYPTION_KEY') || 'default-encryption-key-change-in-production';
    const { data: decryptedPan, error: decryptError } = await supabase
      .rpc('decrypt_pan', { 
        encrypted_data: card.pan_encrypted, 
        encryption_key: encryptionKey 
      });

    if (decryptError) {
      console.error('Decryption error:', decryptError);
      auditLogData.response_status = 500;
      auditLogData.error_message = 'Decryption failed';
      await logAudit(supabase, auditLogData);
      return new Response(
        JSON.stringify({ error: 'Decryption failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log successful operation with field-level access tracking
    auditLogData.response_status = 200;
    auditLogData.accessed_fields = ['pan', 'card_brand', 'expiry_month', 'expiry_year'];
    auditLogData.compliance_flags = {
      pci_dss_compliant: true,
      role_verified: true,
      user_role: roleCheck.userRole,
      decryption_used: true
    };
    await logAudit(supabase, auditLogData);

    // Log compliance check for PAN access
    await logComplianceCheck(supabase, 'pan_access', 'passed', {
      user_id: user.id,
      user_role: roleCheck.userRole,
      token_id: tokenData.id,
      merchant_id: tokenData.merchant_id,
      access_method: 'detokenization'
    });

    const responseTime = Date.now() - startTime;
    console.log(`Token detokenized successfully in ${responseTime}ms:`, tokenData.id, 'by user:', user.id);

    return new Response(
      JSON.stringify({
        token_id: tokenData.id,
        pan: decryptedPan,
        last_four: card.last_four,
        expiry_month: card.expiry_month,
        expiry_year: card.expiry_year,
        card_brand: card.card_brand,
        customer_id: card.customer_id,
        issuer_id: card.issuer_id,
        merchant_id: tokenData.merchant_id,
        status: tokenData.status,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in detokenize function:', error);
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
