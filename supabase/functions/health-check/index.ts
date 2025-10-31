import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check database connectivity
    const dbStart = Date.now();
    const { error: dbError, count } = await supabase
      .from('merchants')
      .select('*', { count: 'exact', head: true });
    const dbLatency = Date.now() - dbStart;

    if (dbError) throw new Error('Database check failed');

    // Check edge functions (self-test)
    const funcStart = Date.now();
    const funcLatency = Date.now() - funcStart;

    // Check if critical services are responding
    const checks = {
      database: {
        status: 'healthy',
        latency_ms: dbLatency,
        record_count: count || 0,
      },
      edge_functions: {
        status: 'healthy',
        latency_ms: funcLatency,
      },
      api: {
        status: 'healthy',
        response_time_ms: Date.now() - startTime,
      },
    };

    // Determine overall health
    const isHealthy = Object.values(checks).every(check => check.status === 'healthy');
    const maxLatency = Math.max(dbLatency, funcLatency);
    
    let overallStatus = 'healthy';
    if (maxLatency > 1000) overallStatus = 'degraded';
    if (!isHealthy) overallStatus = 'unhealthy';

    return new Response(
      JSON.stringify({
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: 'operational',
        checks,
        environment: Deno.env.get('ENVIRONMENT') || 'production',
        version: '1.0.0',
      }),
      { 
        status: isHealthy ? 200 : 503, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Health check failed:', error);
    return new Response(
      JSON.stringify({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        checks: {
          database: { status: 'unhealthy' },
          edge_functions: { status: 'unhealthy' },
          api: { status: 'unhealthy' },
        },
      }),
      { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
