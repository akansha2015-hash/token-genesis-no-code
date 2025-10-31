-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for encryption functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enum types for status fields
CREATE TYPE merchant_status AS ENUM ('active', 'pending', 'suspended', 'inactive');
CREATE TYPE token_status AS ENUM ('active', 'pending', 'expired', 'revoked', 'suspended');
CREATE TYPE transaction_status AS ENUM ('pending', 'approved', 'declined', 'failed', 'reversed');
CREATE TYPE risk_decision AS ENUM ('approve', 'decline', 'review', 'challenge');

-- Merchants table
CREATE TABLE public.merchants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    api_key VARCHAR(64) UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    status merchant_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Cards table (stores encrypted PAN data)
CREATE TABLE public.cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Encrypted PAN using pgcrypto - in production this would use a secure key management system
    pan_encrypted TEXT NOT NULL,
    -- Last 4 digits for display purposes
    last_four VARCHAR(4) NOT NULL,
    customer_id VARCHAR(255),
    issuer_id VARCHAR(50),
    expiry_month INTEGER NOT NULL CHECK (expiry_month >= 1 AND expiry_month <= 12),
    expiry_year INTEGER NOT NULL CHECK (expiry_year >= 2025),
    card_brand VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Devices table
CREATE TABLE public.devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_fingerprint VARCHAR(128) UNIQUE NOT NULL,
    device_type VARCHAR(50),
    device_model VARCHAR(100),
    os_version VARCHAR(50),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Tokens table (core tokenization mapping)
CREATE TABLE public.tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_value VARCHAR(32) UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
    card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    device_id UUID REFERENCES public.devices(id) ON DELETE SET NULL,
    status token_status NOT NULL DEFAULT 'pending',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    -- Ensure token scoping: one active token per card-merchant-device combination
    CONSTRAINT unique_active_token UNIQUE (card_id, merchant_id, device_id, status)
);

-- Transactions table
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_id UUID NOT NULL REFERENCES public.tokens(id) ON DELETE RESTRICT,
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE RESTRICT,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status transaction_status NOT NULL DEFAULT 'pending',
    reference_number VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Risk Events table
CREATE TABLE public.risk_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
    token_id UUID REFERENCES public.tokens(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL,
    risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
    decision risk_decision NOT NULL,
    reason TEXT,
    severity VARCHAR(20) DEFAULT 'medium',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_merchants_status ON public.merchants(status);
CREATE INDEX idx_merchants_api_key ON public.merchants(api_key);

CREATE INDEX idx_cards_customer ON public.cards(customer_id);
CREATE INDEX idx_cards_issuer ON public.cards(issuer_id);

CREATE INDEX idx_tokens_card ON public.tokens(card_id);
CREATE INDEX idx_tokens_merchant ON public.tokens(merchant_id);
CREATE INDEX idx_tokens_status ON public.tokens(status);
CREATE INDEX idx_tokens_expiry ON public.tokens(expires_at);

CREATE INDEX idx_transactions_token ON public.transactions(token_id);
CREATE INDEX idx_transactions_merchant ON public.transactions(merchant_id);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_transactions_created ON public.transactions(created_at);

CREATE INDEX idx_risk_events_transaction ON public.risk_events(transaction_id);
CREATE INDEX idx_risk_events_token ON public.risk_events(token_id);
CREATE INDEX idx_risk_events_decision ON public.risk_events(decision);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_merchants_updated_at
    BEFORE UPDATE ON public.merchants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cards_updated_at
    BEFORE UPDATE ON public.cards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tokens_updated_at
    BEFORE UPDATE ON public.tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to auto-expire tokens
CREATE OR REPLACE FUNCTION check_token_expiry()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.expires_at <= NOW() AND NEW.status = 'active' THEN
        NEW.status = 'expired';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_expire_tokens
    BEFORE INSERT OR UPDATE ON public.tokens
    FOR EACH ROW
    EXECUTE FUNCTION check_token_expiry();

-- Enable Row Level Security on all tables
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for merchants (merchants can view their own data)
CREATE POLICY "Merchants can view own data"
    ON public.merchants FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Service role full access to merchants"
    ON public.merchants FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for cards (restrict access to card data)
CREATE POLICY "Service role full access to cards"
    ON public.cards FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for devices
CREATE POLICY "Authenticated users can view devices"
    ON public.devices FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Service role full access to devices"
    ON public.devices FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for tokens (merchants can view their tokens)
CREATE POLICY "Authenticated users can view tokens"
    ON public.tokens FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Service role full access to tokens"
    ON public.tokens FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for transactions
CREATE POLICY "Authenticated users can view transactions"
    ON public.transactions FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Service role full access to transactions"
    ON public.transactions FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for risk_events
CREATE POLICY "Authenticated users can view risk events"
    ON public.risk_events FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Service role full access to risk_events"
    ON public.risk_events FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Insert sample merchants for testing
INSERT INTO public.merchants (name, status) VALUES
    ('Retail Corp', 'active'),
    ('E-commerce Inc', 'active'),
    ('Payment Hub', 'pending'),
    ('Global Merchant', 'active'),
    ('Tech Solutions', 'suspended');