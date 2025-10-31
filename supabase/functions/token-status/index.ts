import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

interface TokenStatusRequest {
  token_id: string;
  status: 'active' | 'suspended' | 'revoked';
  reason?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let auditLogData: any = {
    operation_type: 'update_token_status',
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
      return new Response(
        JSON.stringify({ error: 'Merchant account not active' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const requestData: TokenStatusRequest = await req.json();
    auditLogData.merchant_id = merchant.id;
    auditLogData.entity_id = requestData.token_id;
    auditLogData.request_data = { 
      token_id: requestData.token_id,
      new_status: requestData.status,
      reason: requestData.reason 
    };

    // Validate input
    if (!requestData.token_id || !requestData.status) {
      auditLogData.response_status = 400;
      auditLogData.error_message = 'Missing required fields';
      await logAudit(supabase, auditLogData);
      return new Response(
        JSON.stringify({ error: 'Missing required fields: token_id, status' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate status value
    const validStatuses = ['active', 'suspended', 'revoked'];
    if (!validStatuses.includes(requestData.status)) {
      auditLogData.response_status = 400;
      auditLogData.error_message = 'Invalid status value';
      await logAudit(supabase, auditLogData);
      return new Response(
        JSON.stringify({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify token belongs to merchant
    const { data: token, error: tokenError } = await supabase
      .from('tokens')
      .select('id, merchant_id, status')
      .eq('id', requestData.token_id)
      .single();

    if (tokenError || !token) {
      console.error('Token not found:', tokenError);
      auditLogData.response_status = 404;
      auditLogData.error_message = 'Token not found';
      await logAudit(supabase, auditLogData);
      return new Response(
        JSON.stringify({ error: 'Token not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (token.merchant_id !== merchant.id) {
      auditLogData.response_status = 403;
      auditLogData.error_message = 'Token does not belong to this merchant';
      await logAudit(supabase, auditLogData);
      return new Response(
        JSON.stringify({ error: 'Unauthorized access to token' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update token status
    const { data: updatedToken, error: updateError } = await supabase
      .from('tokens')
      .update({ status: requestData.status })
      .eq('id', requestData.token_id)
      .select()
      .single();

    if (updateError) {
      console.error('Token update error:', updateError);
      auditLogData.response_status = 500;
      auditLogData.error_message = updateError.message;
      await logAudit(supabase, auditLogData);
      return new Response(
        JSON.stringify({ error: 'Failed to update token status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the status change
    if (requestData.reason) {
      await supabase.from('audit_logs').insert({
        operation_type: 'token_status_change',
        entity_type: 'token',
        entity_id: requestData.token_id,
        merchant_id: merchant.id,
        request_data: {
          old_status: token.status,
          new_status: requestData.status,
          reason: requestData.reason,
        },
        response_status: 200,
      });
    }

    // Log successful operation
    auditLogData.response_status = 200;
    await logAudit(supabase, auditLogData);

    // Trigger webhook in background for revoked/suspended tokens (fire and forget)
    if (requestData.status === 'revoked' || requestData.status === 'suspended') {
      fetch(`${supabaseUrl}/functions/v1/webhook-trigger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          merchant_id: merchant.id,
          event_type: `token_${requestData.status}`,
          payload: {
            token_id: updatedToken.id,
            token_value: updatedToken.token_value,
            old_status: token.status,
            new_status: requestData.status,
            reason: requestData.reason,
            updated_at: updatedToken.updated_at,
          },
        }),
      }).catch(err => console.error('Webhook trigger failed:', err));
    }

    const responseTime = Date.now() - startTime;
    console.log(`Token status updated successfully in ${responseTime}ms:`, updatedToken.id);

    return new Response(
      JSON.stringify({
        token_id: updatedToken.id,
        token_value: updatedToken.token_value,
        old_status: token.status,
        new_status: updatedToken.status,
        updated_at: updatedToken.updated_at,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in token-status function:', error);
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
