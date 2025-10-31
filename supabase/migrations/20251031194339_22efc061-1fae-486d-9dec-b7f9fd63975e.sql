-- Create feature_backlog table
CREATE TABLE public.feature_backlog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR NOT NULL,
  description TEXT,
  priority VARCHAR NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status VARCHAR NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'approved', 'in_progress', 'completed', 'rejected')),
  performance_impact JSONB,
  estimated_effort INTEGER,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create api_performance_metrics table
CREATE TABLE public.api_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint VARCHAR NOT NULL,
  method VARCHAR NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER NOT NULL,
  merchant_id UUID,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create user_feedback table
CREATE TABLE public.user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  category VARCHAR NOT NULL CHECK (category IN ('bug', 'feature_request', 'improvement', 'other')),
  title VARCHAR NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status VARCHAR NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewing', 'planned', 'completed', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.feature_backlog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for feature_backlog
CREATE POLICY "Admins can manage feature backlog"
ON public.feature_backlog
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view feature backlog"
ON public.feature_backlog
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- RLS Policies for api_performance_metrics
CREATE POLICY "Admins and auditors can view performance metrics"
ON public.api_performance_metrics
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'auditor'::app_role));

CREATE POLICY "Service role can insert performance metrics"
ON public.api_performance_metrics
FOR INSERT
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- RLS Policies for user_feedback
CREATE POLICY "Users can submit their own feedback"
ON public.user_feedback
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view their own feedback"
ON public.user_feedback
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all feedback"
ON public.user_feedback
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for performance
CREATE INDEX idx_api_performance_endpoint ON public.api_performance_metrics(endpoint);
CREATE INDEX idx_api_performance_created_at ON public.api_performance_metrics(created_at);
CREATE INDEX idx_api_performance_status ON public.api_performance_metrics(status_code);
CREATE INDEX idx_feature_backlog_status ON public.feature_backlog(status);
CREATE INDEX idx_user_feedback_status ON public.user_feedback(status);

-- Trigger for updated_at on feature_backlog
CREATE TRIGGER update_feature_backlog_updated_at
BEFORE UPDATE ON public.feature_backlog
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on user_feedback
CREATE TRIGGER update_user_feedback_updated_at
BEFORE UPDATE ON public.user_feedback
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();