import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { transaction_id, amount, merchant_id, device_id } = await req.json();

    // Fetch merchant risk tier
    const { data: merchant } = await supabase
      .from('merchants')
      .select('status')
      .eq('id', merchant_id)
      .single();

    // Fetch device reputation (count of previous transactions)
    const { count: deviceTxCount } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('device_id', device_id);

    // Calculate risk score (0-100)
    let riskScore = 0;
    let riskFactors = [];

    // Amount risk (40% weight) - high amounts = higher risk
    const amountRisk = Math.min((Number(amount) / 10000) * 40, 40);
    riskScore += amountRisk;
    if (amountRisk > 20) riskFactors.push(`High transaction amount: $${amount}`);

    // Merchant risk (30% weight)
    if (merchant?.status === 'pending') {
      riskScore += 30;
      riskFactors.push('Merchant account pending verification');
    } else if (merchant?.status === 'suspended') {
      riskScore += 40;
      riskFactors.push('Merchant account suspended');
    }

    // Device reputation (30% weight) - new devices = higher risk
    const deviceRisk = deviceTxCount ? Math.max(30 - deviceTxCount * 2, 0) : 30;
    riskScore += deviceRisk;
    if (deviceRisk > 15) riskFactors.push('New or unverified device');

    // Determine decision
    let decision = 'approve';
    let severity = 'low';
    if (riskScore >= 80) {
      decision = 'review';
      severity = 'critical';
    } else if (riskScore >= 60) {
      decision = 'challenge';
      severity = 'high';
    } else if (riskScore >= 40) {
      decision = 'challenge';
      severity = 'medium';
    }

    // Create risk event
    const { data: riskEvent, error: riskError } = await supabase
      .from('risk_events')
      .insert({
        transaction_id,
        token_id: null,
        event_type: 'transaction_risk_assessment',
        risk_score: Math.round(riskScore),
        severity,
        decision,
        reason: riskFactors.join('; ') || 'Standard transaction assessment',
      })
      .select()
      .single();

    if (riskError) throw riskError;

    // If high risk, trigger notification (placeholder for Slack)
    if (riskScore >= 80) {
      console.log(`HIGH RISK ALERT: Transaction ${transaction_id} scored ${Math.round(riskScore)}`);
      // TODO: Integrate with Slack webhook when configured
    }

    return new Response(
      JSON.stringify({
        risk_score: Math.round(riskScore),
        decision,
        severity,
        risk_event_id: riskEvent.id,
        factors: riskFactors,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in risk-score:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
