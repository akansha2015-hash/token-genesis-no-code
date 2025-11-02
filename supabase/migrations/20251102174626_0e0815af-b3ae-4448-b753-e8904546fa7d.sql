-- ============================================
-- CRITICAL SECURITY FIX: Multi-Tenant Data Isolation
-- ============================================
-- This migration fixes 10 critical/high security vulnerabilities
-- by implementing proper merchant-level data isolation

-- Step 1: Create helper function to get user's merchant_id
CREATE OR REPLACE FUNCTION public.get_user_merchant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT merchant_id 
  FROM public.profiles 
  WHERE id = auth.uid()
  LIMIT 1;
$$;

-- Step 2: Fix MERCHANTS table - Critical vulnerability #1
-- Users should ONLY see their own merchant data, not all merchants
DROP POLICY IF EXISTS "Merchants can view own data" ON public.merchants;
DROP POLICY IF EXISTS "Service role full access to merchants" ON public.merchants;

CREATE POLICY "Users can view their own merchant only"
ON public.merchants
FOR SELECT
TO authenticated
USING (id = public.get_user_merchant_id());

CREATE POLICY "Service role full access to merchants"
ON public.merchants
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Step 3: Fix TRANSACTIONS table - Critical vulnerability #2
-- Restrict to only transactions belonging to user's merchant
DROP POLICY IF EXISTS "Authenticated users can view transactions" ON public.transactions;
DROP POLICY IF EXISTS "Service role full access to transactions" ON public.transactions;

CREATE POLICY "Users can view their merchant's transactions"
ON public.transactions
FOR SELECT
TO authenticated
USING (merchant_id = public.get_user_merchant_id());

CREATE POLICY "Service role full access to transactions"
ON public.transactions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Step 4: Fix TOKENS table - Critical vulnerability #3
-- Isolate tokens by merchant
DROP POLICY IF EXISTS "Authenticated users can view tokens" ON public.tokens;
DROP POLICY IF EXISTS "Service role full access to tokens" ON public.tokens;

CREATE POLICY "Users can view their merchant's tokens"
ON public.tokens
FOR SELECT
TO authenticated
USING (merchant_id = public.get_user_merchant_id());

CREATE POLICY "Service role full access to tokens"
ON public.tokens
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Step 5: Fix WEBHOOKS table - Critical vulnerability #4
-- Most dangerous: webhook secrets were accessible to all users
DROP POLICY IF EXISTS "Merchants can manage their own webhooks" ON public.webhooks;
DROP POLICY IF EXISTS "Service role full access to webhooks" ON public.webhooks;

CREATE POLICY "Users can manage their merchant's webhooks"
ON public.webhooks
FOR ALL
TO authenticated
USING (merchant_id = public.get_user_merchant_id())
WITH CHECK (merchant_id = public.get_user_merchant_id());

CREATE POLICY "Service role full access to webhooks"
ON public.webhooks
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Step 6: Fix AUDIT_LOGS table - Critical vulnerability #5
-- Partition logs by merchant
DROP POLICY IF EXISTS "Authenticated users can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Service role full access to audit logs" ON public.audit_logs;

CREATE POLICY "Users can view their merchant's audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
  merchant_id = public.get_user_merchant_id() 
  OR user_id = auth.uid()
);

CREATE POLICY "Admins can view all audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role full access to audit logs"
ON public.audit_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Step 7: Fix WEBHOOK_DELIVERIES table - Critical vulnerability #6
-- Filter webhook deliveries by merchant ownership of the webhook
DROP POLICY IF EXISTS "Authenticated users can view webhook deliveries" ON public.webhook_deliveries;
DROP POLICY IF EXISTS "Service role full access to webhook_deliveries" ON public.webhook_deliveries;

CREATE POLICY "Users can view their merchant's webhook deliveries"
ON public.webhook_deliveries
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.webhooks 
    WHERE webhooks.id = webhook_deliveries.webhook_id 
    AND webhooks.merchant_id = public.get_user_merchant_id()
  )
);

CREATE POLICY "Service role full access to webhook_deliveries"
ON public.webhook_deliveries
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Step 8: Fix CARDS table - Critical vulnerability #7
-- Add merchant-level isolation via tokens
DROP POLICY IF EXISTS "Service role full access to cards" ON public.cards;

CREATE POLICY "Service role full access to cards"
ON public.cards
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Cards should only be accessible via tokens which are merchant-isolated
-- No direct user access needed, only service role for detokenization

-- Step 9: Fix DEVICES table - Medium vulnerability #8
-- Add merchant isolation via tokens/transactions
DROP POLICY IF EXISTS "Authenticated users can view devices" ON public.devices;
DROP POLICY IF EXISTS "Service role full access to devices" ON public.devices;

CREATE POLICY "Users can view devices linked to their merchant's tokens"
ON public.devices
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tokens 
    WHERE tokens.device_id = devices.id 
    AND tokens.merchant_id = public.get_user_merchant_id()
  )
);

CREATE POLICY "Service role full access to devices"
ON public.devices
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Step 10: Fix RISK_EVENTS table - Medium vulnerability #9
-- Isolate fraud detection data by merchant
DROP POLICY IF EXISTS "Authenticated users can view risk events" ON public.risk_events;
DROP POLICY IF EXISTS "Service role full access to risk_events" ON public.risk_events;

CREATE POLICY "Users can view their merchant's risk events"
ON public.risk_events
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.transactions 
    WHERE transactions.id = risk_events.transaction_id 
    AND transactions.merchant_id = public.get_user_merchant_id()
  )
  OR EXISTS (
    SELECT 1 FROM public.tokens 
    WHERE tokens.id = risk_events.token_id 
    AND tokens.merchant_id = public.get_user_merchant_id()
  )
);

CREATE POLICY "Admins can view all risk events"
ON public.risk_events
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role full access to risk_events"
ON public.risk_events
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Add index for performance on merchant lookups
CREATE INDEX IF NOT EXISTS idx_profiles_merchant_id ON public.profiles(merchant_id);
CREATE INDEX IF NOT EXISTS idx_tokens_merchant_id ON public.tokens(merchant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_merchant_id ON public.transactions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_merchant_id ON public.webhooks(merchant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_merchant_id ON public.audit_logs(merchant_id);

-- Add comment for security documentation
COMMENT ON FUNCTION public.get_user_merchant_id IS 'Security function: Returns the merchant_id for the authenticated user. Used in RLS policies to enforce multi-tenant isolation.';