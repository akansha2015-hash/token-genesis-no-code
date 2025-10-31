import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, CheckCircle2, XCircle, AlertTriangle, RefreshCw, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface HealthStatus {
  status: string;
  timestamp: string;
  checks: {
    database: { status: string; latency_ms: number };
    edge_functions: { status: string; latency_ms: number };
    api: { status: string; response_time_ms: number };
  };
  environment: string;
  version: string;
}

interface ComplianceCheck {
  check_type: string;
  check_result: string;
  severity: string;
  details: any;
  created_at: string;
}

export default function Monitoring() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [complianceChecks, setComplianceChecks] = useState<ComplianceCheck[]>([]);
  const [isLoadingHealth, setIsLoadingHealth] = useState(false);
  const [isLoadingCompliance, setIsLoadingCompliance] = useState(false);

  useEffect(() => {
    fetchHealthStatus();
    fetchComplianceChecks();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchHealthStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchHealthStatus = async () => {
    setIsLoadingHealth(true);
    try {
      const { data, error } = await supabase.functions.invoke('health-check');
      
      if (error) throw error;
      setHealthStatus(data);
    } catch (error: any) {
      console.error('Failed to fetch health status:', error);
      toast.error('Failed to fetch health status');
    } finally {
      setIsLoadingHealth(false);
    }
  };

  const fetchComplianceChecks = async () => {
    setIsLoadingCompliance(true);
    try {
      const { data, error } = await supabase
        .from('compliance_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setComplianceChecks(data || []);
    } catch (error: any) {
      console.error('Failed to fetch compliance checks:', error);
      toast.error('Failed to fetch compliance checks');
    } finally {
      setIsLoadingCompliance(false);
    }
  };

  const runComplianceCheck = async () => {
    setIsLoadingCompliance(true);
    try {
      const { data, error } = await supabase.functions.invoke('compliance-check');
      
      if (error) throw error;
      toast.success('Compliance check completed');
      fetchComplianceChecks();
    } catch (error: any) {
      toast.error('Failed to run compliance check');
    } finally {
      setIsLoadingCompliance(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'pass':
        return <CheckCircle2 className="w-5 h-5 text-success" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-warning" />;
      case 'unhealthy':
      case 'fail':
        return <XCircle className="w-5 h-5 text-destructive" />;
      default:
        return <Activity className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'pass':
        return <Badge variant="default">Healthy</Badge>;
      case 'warning':
        return <Badge variant="secondary">Warning</Badge>;
      case 'degraded':
        return <Badge variant="secondary">Degraded</Badge>;
      case 'unhealthy':
      case 'fail':
        return <Badge variant="destructive">Unhealthy</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">System Monitoring</h1>
            <p className="text-muted-foreground">Real-time health checks and compliance monitoring</p>
          </div>
          <Button onClick={fetchHealthStatus} disabled={isLoadingHealth}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingHealth ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* System Health */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              System Health
            </CardTitle>
            <CardDescription>
              Current status of all platform services
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingHealth && !healthStatus ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : healthStatus ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(healthStatus.status)}
                    <div>
                      <p className="font-semibold">Overall Status</p>
                      <p className="text-sm text-muted-foreground">
                        Last checked: {new Date(healthStatus.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(healthStatus.status)}
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Database</span>
                      {getStatusIcon(healthStatus.checks.database.status)}
                    </div>
                    <p className="text-2xl font-bold">{healthStatus.checks.database.latency_ms}ms</p>
                    <p className="text-xs text-muted-foreground">Response Time</p>
                  </div>

                  <div className="p-4 border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Edge Functions</span>
                      {getStatusIcon(healthStatus.checks.edge_functions.status)}
                    </div>
                    <p className="text-2xl font-bold">{healthStatus.checks.edge_functions.latency_ms}ms</p>
                    <p className="text-xs text-muted-foreground">Latency</p>
                  </div>

                  <div className="p-4 border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">API</span>
                      {getStatusIcon(healthStatus.checks.api.status)}
                    </div>
                    <p className="text-2xl font-bold">{healthStatus.checks.api.response_time_ms}ms</p>
                    <p className="text-xs text-muted-foreground">Response Time</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t text-sm text-muted-foreground">
                  <span>Environment: <strong>{healthStatus.environment}</strong></span>
                  <span>Version: <strong>{healthStatus.version}</strong></span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No health data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Compliance Checks */}
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Compliance Checks
                </CardTitle>
                <CardDescription>
                  Recent automated compliance and security checks
                </CardDescription>
              </div>
              <Button onClick={runComplianceCheck} disabled={isLoadingCompliance}>
                Run Check
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingCompliance && complianceChecks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : complianceChecks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No compliance checks found. Run your first check!
              </div>
            ) : (
              <div className="space-y-3">
                {complianceChecks.map((check, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-4 p-4 border border-border rounded-lg hover:bg-secondary transition-colors"
                  >
                    {getStatusIcon(check.check_result)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">{check.check_type.replace(/_/g, ' ')}</p>
                        <Badge variant={
                          check.severity === 'high' ? 'destructive' :
                          check.severity === 'medium' ? 'secondary' : 'outline'
                        }>
                          {check.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {JSON.stringify(check.details)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(check.created_at).toLocaleString()}
                      </p>
                    </div>
                    {getStatusBadge(check.check_result)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
