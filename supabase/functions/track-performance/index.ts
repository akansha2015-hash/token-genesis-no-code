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

    const { endpoint, method, status_code, response_time_ms, merchant_id, error_message } = await req.json();

    // Validate required fields
    if (!endpoint || !method || status_code === undefined || response_time_ms === undefined) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: endpoint, method, status_code, response_time_ms' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert performance metric
    const { data, error } = await supabase
      .from('api_performance_metrics')
      .insert({
        endpoint,
        method,
        status_code,
        response_time_ms,
        merchant_id: merchant_id || null,
        error_message: error_message || null,
      })
      .select()
      .single();

    if (error) throw error;

    console.log('Performance metric tracked:', {
      endpoint,
      method,
      status_code,
      response_time_ms,
    });

    // Alert on high error rates
    if (status_code >= 500) {
      console.warn('Server error detected:', {
        endpoint,
        method,
        status_code,
        error_message,
      });

      // Check error rate for this endpoint
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data: recentMetrics, error: metricsError } = await supabase
        .from('api_performance_metrics')
        .select('status_code')
        .eq('endpoint', endpoint)
        .gte('created_at', oneHourAgo);

      if (!metricsError && recentMetrics) {
        const totalRequests = recentMetrics.length;
        const errorRequests = recentMetrics.filter(m => m.status_code >= 500).length;
        const errorRate = totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0;

        if (errorRate > 10 && totalRequests > 10) {
          console.error('HIGH ERROR RATE ALERT:', {
            endpoint,
            errorRate: `${errorRate.toFixed(2)}%`,
            totalRequests,
            errorRequests,
          });

          // Trigger alert
          await supabase.functions.invoke('send-alert', {
            body: {
              type: 'performance_degradation',
              severity: 'high',
              title: `High Error Rate on ${endpoint}`,
              message: `Endpoint ${method} ${endpoint} has ${errorRate.toFixed(2)}% error rate (${errorRequests}/${totalRequests} requests failed in the last hour)`,
              metadata: {
                endpoint,
                method,
                error_rate: errorRate,
                total_requests: totalRequests,
                error_requests: errorRequests,
              },
            },
          });
        }
      }
    }

    // Alert on slow response times
    if (response_time_ms > 5000) {
      console.warn('Slow response detected:', {
        endpoint,
        method,
        response_time_ms,
      });

      await supabase.functions.invoke('send-alert', {
        body: {
          type: 'performance_degradation',
          severity: 'medium',
          title: `Slow Response on ${endpoint}`,
          message: `Endpoint ${method} ${endpoint} responded in ${response_time_ms}ms (threshold: 5000ms)`,
          metadata: {
            endpoint,
            method,
            response_time_ms,
          },
        },
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Performance metric tracked',
        data 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error tracking performance:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});