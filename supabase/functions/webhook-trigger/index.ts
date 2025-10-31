import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { createHmac } from 'https://deno.land/std@0.177.0/node/crypto.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookTriggerRequest {
  merchant_id: string;
  event_type: string;
  payload: Record<string, any>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // This function is internal only, verify service role
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.includes(supabaseKey)) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: WebhookTriggerRequest = await req.json();
    const { merchant_id, event_type, payload } = body;

    if (!merchant_id || !event_type || !payload) {
      return new Response(
        JSON.stringify({ error: 'merchant_id, event_type, and payload are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find active webhooks for this merchant and event type
    const { data: webhooks, error: webhooksError } = await supabase
      .from('webhooks')
      .select('*')
      .eq('merchant_id', merchant_id)
      .eq('event_type', event_type)
      .eq('is_active', true);

    if (webhooksError) {
      console.error('Error fetching webhooks:', webhooksError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch webhooks' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!webhooks || webhooks.length === 0) {
      console.log(`No active webhooks found for merchant ${merchant_id} and event ${event_type}`);
      return new Response(
        JSON.stringify({ message: 'No active webhooks to trigger' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Trigger all webhooks
    const deliveryPromises = webhooks.map(async (webhook) => {
      try {
        // Create HMAC signature
        const hmac = createHmac('sha256', webhook.secret);
        hmac.update(JSON.stringify(payload));
        const signature = hmac.digest('hex');

        // Send webhook
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signature,
            'X-Webhook-Event': event_type,
          },
          body: JSON.stringify(payload),
        });

        const responseBody = await response.text();

        // Log delivery
        await supabase.from('webhook_deliveries').insert({
          webhook_id: webhook.id,
          event_type,
          payload,
          response_status: response.status,
          response_body: responseBody.substring(0, 1000), // Limit to 1000 chars
          delivered_at: new Date().toISOString(),
        });

        console.log(`Webhook delivered to ${webhook.url}: ${response.status}`);
        return { webhook_id: webhook.id, status: response.status, success: response.ok };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Error delivering webhook to ${webhook.url}:`, errorMessage);
        
        // Log failed delivery
        await supabase.from('webhook_deliveries').insert({
          webhook_id: webhook.id,
          event_type,
          payload,
          response_status: 0,
          response_body: errorMessage,
        });

        return { webhook_id: webhook.id, status: 0, success: false, error: errorMessage };
      }
    });

    const results = await Promise.all(deliveryPromises);

    return new Response(
      JSON.stringify({
        message: 'Webhooks triggered',
        results,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in webhook-trigger:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
