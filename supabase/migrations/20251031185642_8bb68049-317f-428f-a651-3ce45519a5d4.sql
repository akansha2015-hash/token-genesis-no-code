-- Create webhooks table for merchant webhook subscriptions
CREATE TABLE public.webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  event_type VARCHAR NOT NULL CHECK (event_type IN ('token_issued', 'token_revoked', 'token_suspended', 'transaction_created')),
  url VARCHAR NOT NULL,
  secret VARCHAR NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create webhook_deliveries table to track webhook delivery attempts
CREATE TABLE public.webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES public.webhooks(id) ON DELETE CASCADE,
  event_type VARCHAR NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- RLS policies for webhooks
CREATE POLICY "Merchants can manage their own webhooks"
ON public.webhooks
FOR ALL
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Service role full access to webhooks"
ON public.webhooks
FOR ALL
USING ((auth.jwt() ->> 'role') = 'service_role');

-- RLS policies for webhook_deliveries
CREATE POLICY "Authenticated users can view webhook deliveries"
ON public.webhook_deliveries
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Service role full access to webhook_deliveries"
ON public.webhook_deliveries
FOR ALL
USING ((auth.jwt() ->> 'role') = 'service_role');

-- Add trigger for updated_at
CREATE TRIGGER update_webhooks_updated_at
BEFORE UPDATE ON public.webhooks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();