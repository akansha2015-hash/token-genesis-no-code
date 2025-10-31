import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

interface WebhookRequest {
  event_type: 'token_issued' | 'token_revoked' | 'token_suspended' | 'transaction_created';
  url: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle POST (register) and DELETE (unregister)
    if (req.method === 'POST') {
      // Authenticate merchant via API key
      const apiKey = req.headers.get('x-api-key');
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: 'Missing API key' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify merchant
      const { data: merchant, error: merchantError } = await supabase
        .from('merchants')
        .select('id, name, status')
        .eq('api_key', apiKey)
        .single();

      if (merchantError || !merchant) {
        console.error('Merchant verification failed:', merchantError);
        return new Response(
          JSON.stringify({ error: 'Invalid API key' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Parse request body
      const body: WebhookRequest = await req.json();
      const { event_type, url } = body;

      if (!event_type || !url) {
        return new Response(
          JSON.stringify({ error: 'event_type and url are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate URL
      try {
        new URL(url);
      } catch {
        return new Response(
          JSON.stringify({ error: 'Invalid URL format' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate webhook secret
      const secret = crypto.randomUUID();

      // Create webhook subscription
      const { data: webhook, error: webhookError } = await supabase
        .from('webhooks')
        .insert({
          merchant_id: merchant.id,
          event_type,
          url,
          secret,
          is_active: true,
        })
        .select()
        .single();

      if (webhookError) {
        console.error('Error creating webhook:', webhookError);
        return new Response(
          JSON.stringify({ error: 'Failed to register webhook' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          webhook_id: webhook.id,
          event_type: webhook.event_type,
          url: webhook.url,
          secret: webhook.secret,
          is_active: webhook.is_active,
          created_at: webhook.created_at,
        }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (req.method === 'DELETE') {
      // Delete webhook
      const url = new URL(req.url);
      const webhookId = url.searchParams.get('webhook_id');

      if (!webhookId) {
        return new Response(
          JSON.stringify({ error: 'webhook_id is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const apiKey = req.headers.get('x-api-key');
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: 'Missing API key' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: merchant, error: merchantError } = await supabase
        .from('merchants')
        .select('id')
        .eq('api_key', apiKey)
        .single();

      if (merchantError || !merchant) {
        return new Response(
          JSON.stringify({ error: 'Invalid API key' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Delete webhook
      const { error: deleteError } = await supabase
        .from('webhooks')
        .delete()
        .eq('id', webhookId)
        .eq('merchant_id', merchant.id);

      if (deleteError) {
        console.error('Error deleting webhook:', deleteError);
        return new Response(
          JSON.stringify({ error: 'Failed to delete webhook' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ message: 'Webhook deleted successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error in webhook-register:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
