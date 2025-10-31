import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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

    if (merchant.status !== 'active') {
      return new Response(
        JSON.stringify({ error: 'Merchant account is not active' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse query parameters
    const url = new URL(req.url);
    const status = url.searchParams.get('status') || 'active';
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Fetch tokens for merchant
    let query = supabase
      .from('tokens')
      .select('id, token_value, status, created_at, expires_at, updated_at, card_id')
      .eq('merchant_id', merchant.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: tokens, error: tokensError } = await query;

    if (tokensError) {
      console.error('Error fetching tokens:', tokensError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch tokens' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get card details for each token
    const enrichedTokens = await Promise.all(
      tokens.map(async (token) => {
        const { data: card } = await supabase
          .from('cards')
          .select('last_four, card_brand, expiry_month, expiry_year')
          .eq('id', token.card_id)
          .single();

        return {
          token_id: token.id,
          token_value: token.token_value,
          status: token.status,
          card_last_four: card?.last_four,
          card_brand: card?.card_brand,
          expires_at: token.expires_at,
          created_at: token.created_at,
          updated_at: token.updated_at,
        };
      })
    );

    // Log audit
    await supabase.from('audit_logs').insert({
      merchant_id: merchant.id,
      entity_type: 'token',
      entity_id: null,
      operation_type: 'list',
      request_data: { status, limit, offset },
      response_status: 200,
      request_ip: req.headers.get('x-forwarded-for') || 'unknown',
    });

    return new Response(
      JSON.stringify({
        tokens: enrichedTokens,
        count: tokens.length,
        offset,
        limit,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in list-tokens:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
