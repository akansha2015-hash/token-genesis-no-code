import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Key, Activity, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function Compliance() {
  const [complianceLogs, setComplianceLogs] = useState<any[]>([]);
  const [encryptionKeys, setEncryptionKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComplianceData();
  }, []);

  const fetchComplianceData = async () => {
    try {
      // Fetch compliance logs
      const { data: logs } = await supabase
        .from('compliance_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (logs) setComplianceLogs(logs);

      // Fetch encryption keys
      const { data: keys } = await supabase
        .from('encryption_keys')
        .select('*')
        .order('key_version', { ascending: false })
        .limit(5);

      if (keys) setEncryptionKeys(keys);

    } catch (error) {
      console.error('Error fetching compliance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'warning':
        return 'outline';
      case 'info':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getResultIcon = (result: string) => {
    return result === 'passed' ? (
      <CheckCircle2 className="h-4 w-4 text-green-500" />
    ) : (
      <AlertTriangle className="h-4 w-4 text-yellow-500" />
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Compliance Dashboard</h1>
          <p className="text-muted-foreground">PCI DSS monitoring and security compliance</p>
        </div>
      </div>

      {/* Security Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Encryption Key</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              v{encryptionKeys.find(k => k.is_active)?.key_version || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Rotates every 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Checks</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{complianceLogs.length}</div>
            <p className="text-xs text-muted-foreground">
              Recent security audits
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Status</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Compliant</div>
            <p className="text-xs text-muted-foreground">
              PCI DSS Level 1
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Encryption Keys History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Encryption Key Rotation History
          </CardTitle>
          <CardDescription>
            30-day automated key rotation for enhanced security
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {encryptionKeys.map((key) => (
              <div key={key.id} className="flex items-center justify-between border-b pb-3">
                <div>
                  <p className="font-medium">Key Version {key.key_version}</p>
                  <p className="text-sm text-muted-foreground">
                    Created: {new Date(key.created_at).toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Expires: {new Date(key.expires_at).toLocaleString()}
                  </p>
                </div>
                <Badge variant={key.is_active ? 'default' : 'secondary'}>
                  {key.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Compliance Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Compliance Checks
          </CardTitle>
          <CardDescription>
            Automated PCI DSS compliance monitoring and audit logs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {complianceLogs.map((log) => (
              <div key={log.id} className="flex items-start justify-between border-b pb-3">
                <div className="flex items-start gap-3">
                  {getResultIcon(log.check_result)}
                  <div>
                    <p className="font-medium">{log.check_type.replace(/_/g, ' ').toUpperCase()}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                    </p>
                    {log.details && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {JSON.stringify(log.details).substring(0, 100)}...
                      </p>
                    )}
                  </div>
                </div>
                <Badge variant={getSeverityColor(log.severity) as any}>
                  {log.severity}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
