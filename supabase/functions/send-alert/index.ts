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
    const { alert_type, severity, message, details } = await req.json();
    const slackWebhook = Deno.env.get('SLACK_WEBHOOK_URL');

    // Format alert message
    const timestamp = new Date().toISOString();
    const emoji = severity === 'critical' ? '🚨' : severity === 'high' ? '⚠️' : 'ℹ️';
    
    const alertPayload = {
      text: `${emoji} AETS Platform Alert`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${emoji} ${alert_type.toUpperCase()}`,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Severity:*\n${severity}`,
            },
            {
              type: 'mrkdwn',
              text: `*Time:*\n${timestamp}`,
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Message:*\n${message}`,
          },
        },
      ],
    };

    // Add details if provided
    if (details) {
      alertPayload.blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Details:*\n\`\`\`${JSON.stringify(details, null, 2)}\`\`\``,
        },
      });
    }

    // Send to Slack if webhook is configured
    if (slackWebhook) {
      const slackResponse = await fetch(slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alertPayload),
      });

      if (!slackResponse.ok) {
        console.error('Failed to send Slack alert:', await slackResponse.text());
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Failed to send Slack notification',
            logged: true,
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Alert sent to Slack',
          timestamp,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Log alert if Slack is not configured
      console.log('ALERT (Slack not configured):', JSON.stringify(alertPayload, null, 2));
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Alert logged (Slack webhook not configured)',
          logged: true,
          timestamp,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error in send-alert:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
