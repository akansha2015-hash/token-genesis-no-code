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
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { transaction_data } = await req.json();

    // Prepare transaction context for AI analysis
    const context = `
Transaction Analysis:
- Amount: $${transaction_data.amount}
- Merchant: ${transaction_data.merchant_name}
- Merchant Status: ${transaction_data.merchant_status}
- Device: ${transaction_data.device_type || 'Unknown'}
- Previous Transactions from Device: ${transaction_data.device_tx_count || 0}
- Time: ${new Date().toISOString()}

Analyze this transaction for potential fraud indicators and provide a risk assessment.
`;

    // Call Lovable AI for fraud analysis
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a fraud detection AI. Analyze transactions and identify risk factors. Be concise and specific.'
          },
          {
            role: 'user',
            content: context
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'assess_fraud_risk',
              description: 'Provide structured fraud risk assessment',
              parameters: {
                type: 'object',
                properties: {
                  risk_indicators: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'List of specific fraud indicators found'
                  },
                  confidence: {
                    type: 'string',
                    enum: ['low', 'medium', 'high'],
                    description: 'Confidence level in the assessment'
                  },
                  recommendation: {
                    type: 'string',
                    enum: ['approve', 'challenge', 'review', 'decline'],
                    description: 'Recommended action'
                  }
                },
                required: ['risk_indicators', 'confidence', 'recommendation'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'assess_fraud_risk' } }
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'AI rate limit exceeded' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error('AI API error');
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices[0].message.tool_calls?.[0];
    const analysis = toolCall ? JSON.parse(toolCall.function.arguments) : null;

    if (!analysis) {
      throw new Error('Failed to get AI analysis');
    }

    return new Response(
      JSON.stringify({
        ai_analysis: analysis,
        risk_indicators: analysis.risk_indicators,
        confidence: analysis.confidence,
        recommendation: analysis.recommendation,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-fraud-check:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
