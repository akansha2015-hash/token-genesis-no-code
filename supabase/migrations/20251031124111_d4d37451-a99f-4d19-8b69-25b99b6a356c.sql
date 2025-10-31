-- Create audit logs table for tracking all token operations
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operation_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    merchant_id UUID REFERENCES public.merchants(id) ON DELETE SET NULL,
    user_id UUID,
    request_ip VARCHAR(50),
    request_data JSONB,
    response_status INTEGER,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for audit logs
CREATE INDEX idx_audit_logs_operation ON public.audit_logs(operation_type);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_merchant ON public.audit_logs(merchant_id);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at);

-- Enable RLS on audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS policy for audit logs (read-only for authenticated users)
CREATE POLICY "Authenticated users can view audit logs"
    ON public.audit_logs FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Service role full access to audit logs"
    ON public.audit_logs FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Create function to encrypt PAN data
CREATE OR REPLACE FUNCTION encrypt_pan(pan_data TEXT, encryption_key TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN encode(encrypt(pan_data::bytea, encryption_key, 'aes'), 'base64');
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

-- Create function to decrypt PAN data
CREATE OR REPLACE FUNCTION decrypt_pan(encrypted_data TEXT, encryption_key TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN convert_from(decrypt(decode(encrypted_data, 'base64'), encryption_key, 'aes'), 'UTF8');
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;