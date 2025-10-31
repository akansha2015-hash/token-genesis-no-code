import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

interface TransactionRequest {
  token_value: string;
  amount: number;
  currency?: string;
  reference_number?: string;
}

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

    // Parse request body
    const body: TransactionRequest = await req.json();
    const { token_value, amount, currency = 'USD', reference_number } = body;

    if (!token_value || !amount) {
      return new Response(
        JSON.stringify({ error: 'token_value and amount are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Amount must be positive' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find token
    const { data: token, error: tokenError } = await supabase
      .from('tokens')
      .select('id, status, merchant_id, expires_at')
      .eq('token_value', token_value)
      .single();

    if (tokenError || !token) {
      console.error('Token not found:', tokenError);
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify token belongs to merchant
    if (token.merchant_id !== merchant.id) {
      return new Response(
        JSON.stringify({ error: 'Token does not belong to this merchant' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check token status
    if (token.status !== 'active') {
      return new Response(
        JSON.stringify({ error: `Token is ${token.status}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check expiration
    if (new Date(token.expires_at) <= new Date()) {
      return new Response(
        JSON.stringify({ error: 'Token has expired' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create transaction
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        token_id: token.id,
        merchant_id: merchant.id,
        amount,
        currency,
        reference_number,
        status: 'completed',
      })
      .select()
      .single();

    if (txError) {
      console.error('Error creating transaction:', txError);
      return new Response(
        JSON.stringify({ error: 'Failed to create transaction' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log audit
    await supabase.from('audit_logs').insert({
      merchant_id: merchant.id,
      entity_type: 'transaction',
      entity_id: transaction.id,
      operation_type: 'create',
      request_data: { token_value, amount, currency, reference_number },
      response_status: 201,
      request_ip: req.headers.get('x-forwarded-for') || 'unknown',
    });

    // Trigger webhook in background (fire and forget)
    fetch(`${supabaseUrl}/functions/v1/webhook-trigger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        merchant_id: merchant.id,
        event_type: 'transaction_created',
        payload: {
          transaction_id: transaction.id,
          token_id: token.id,
          amount,
          currency,
          reference_number,
          created_at: transaction.created_at,
        },
      }),
    }).catch(err => console.error('Webhook trigger failed:', err));

    return new Response(
      JSON.stringify({
        transaction_id: transaction.id,
        token_id: token.id,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
        reference_number: transaction.reference_number,
        created_at: transaction.created_at,
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in create-transaction:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
