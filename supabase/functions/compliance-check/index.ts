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

    const checks = [];
    let overallResult = 'pass';

    // Check 1: Token expiry compliance (tokens shouldn't be expired but still active)
    const { data: expiredActiveTokens } = await supabase
      .from('tokens')
      .select('id, expires_at, status')
      .eq('status', 'active')
      .lt('expires_at', new Date().toISOString());

    if (expiredActiveTokens && expiredActiveTokens.length > 0) {
      checks.push({
        check_type: 'token_expiry_validation',
        check_result: 'fail',
        severity: 'high',
        details: { expired_active_tokens: expiredActiveTokens.length },
      });
      overallResult = 'fail';
    } else {
      checks.push({
        check_type: 'token_expiry_validation',
        check_result: 'pass',
        severity: 'info',
        details: { message: 'No expired active tokens found' },
      });
    }

    // Check 2: Merchant status verification
    const { data: suspendedMerchants } = await supabase
      .from('merchants')
      .select('id, name, status')
      .eq('status', 'suspended');

    checks.push({
      check_type: 'merchant_status_audit',
      check_result: 'pass',
      severity: 'info',
      details: { suspended_merchants: suspendedMerchants?.length || 0 },
    });

    // Check 3: High-risk transaction review
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: unreviewed } = await supabase
      .from('risk_events')
      .select('id, created_at, risk_score')
      .eq('decision', 'review')
      .gte('risk_score', 80)
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (unreviewed && unreviewed.length > 10) {
      checks.push({
        check_type: 'high_risk_review_backlog',
        check_result: 'warning',
        severity: 'medium',
        details: { pending_reviews: unreviewed.length },
      });
      if (overallResult === 'pass') overallResult = 'warning';
    } else {
      checks.push({
        check_type: 'high_risk_review_backlog',
        check_result: 'pass',
        severity: 'info',
        details: { pending_reviews: unreviewed?.length || 0 },
      });
    }

    // Check 4: Encryption key rotation compliance
    const { data: activeKeys } = await supabase
      .from('encryption_keys')
      .select('id, created_at, is_active')
      .eq('is_active', true);

    const keyAge = activeKeys?.[0] ? 
      Math.floor((Date.now() - new Date(activeKeys[0].created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0;

    if (keyAge > 30) {
      checks.push({
        check_type: 'encryption_key_rotation',
        check_result: 'warning',
        severity: 'medium',
        details: { key_age_days: keyAge, recommendation: 'Rotate encryption key' },
      });
      if (overallResult === 'pass') overallResult = 'warning';
    } else {
      checks.push({
        check_type: 'encryption_key_rotation',
        check_result: 'pass',
        severity: 'info',
        details: { key_age_days: keyAge },
      });
    }

    // Store compliance results
    for (const check of checks) {
      await supabase.from('compliance_logs').insert(check);
    }

    // Send alert if there are failures
    const failedChecks = checks.filter(c => c.check_result === 'fail');
    if (failedChecks.length > 0) {
      console.log('COMPLIANCE ALERT: Failed checks detected:', failedChecks);
      // TODO: Send Slack/Email notification when configured
    }

    return new Response(
      JSON.stringify({
        overall_result: overallResult,
        timestamp: new Date().toISOString(),
        checks,
        summary: {
          total: checks.length,
          passed: checks.filter(c => c.check_result === 'pass').length,
          warnings: checks.filter(c => c.check_result === 'warning').length,
          failed: checks.filter(c => c.check_result === 'fail').length,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in compliance-check:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
