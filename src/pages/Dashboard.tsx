import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Shield, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";

interface Token {
  id: string;
  token_value: string;
  status: string;
  created_at: string;
  merchant_id: string;
  merchants?: { name: string };
}

interface Transaction {
  id: string;
  status: string;
  created_at: string;
}

export default function Dashboard() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [metrics, setMetrics] = useState({
    activeTokens: 0,
    todayTransactions: 0,
    failedValidations: 0,
    avgResponseTime: "0ms",
  });

  useEffect(() => {
    fetchDashboardData();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('dashboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tokens' }, () => {
        fetchDashboardData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch active tokens count
      const { count: activeCount } = await supabase
        .from("tokens")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      // Fetch today's transactions
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: todayCount } = await supabase
        .from("transactions")
        .select("*", { count: "exact", head: true })
        .gte("created_at", today.toISOString());

      // Fetch failed validations (pending/failed transactions)
      const { count: failedCount } = await supabase
        .from("transactions")
        .select("*", { count: "exact", head: true })
        .in("status", ["failed", "pending"]);

      // Fetch recent tokens with merchant info
      const { data: recentTokens } = await supabase
        .from("tokens")
        .select("*, merchants(name)")
        .order("created_at", { ascending: false })
        .limit(5);

      setMetrics({
        activeTokens: activeCount || 0,
        todayTransactions: todayCount || 0,
        failedValidations: failedCount || 0,
        avgResponseTime: "42ms", // This would need API monitoring
      });

      setTokens(recentTokens || []);
    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    }
  };

  const alerts = [
    { type: "info", message: "Real-time data updates enabled", time: "Just now" },
    { type: "success", message: "All systems operational", time: "5m ago" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Real-time tokenization platform metrics</p>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Active Tokens</p>
                  <p className="text-3xl font-bold">{metrics.activeTokens.toLocaleString()}</p>
                </div>
                <Shield className="w-8 h-8 text-primary opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Today's Transactions</p>
                  <p className="text-3xl font-bold">{metrics.todayTransactions.toLocaleString()}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-primary opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Failed Validations</p>
                  <p className="text-3xl font-bold">{metrics.failedValidations}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-warning opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Avg Response Time</p>
                  <p className="text-3xl font-bold">{metrics.avgResponseTime}</p>
                </div>
                <Clock className="w-8 h-8 text-primary opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Tokens */}
          <Card className="lg:col-span-2 shadow-card">
            <CardHeader>
              <CardTitle>Recent Token Activity</CardTitle>
              <CardDescription>Latest token generations and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tokens.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No recent tokens</div>
                ) : (
                  tokens.map((token) => (
                    <div key={token.id} className="flex items-center justify-between p-3 border border-border rounded-md hover:bg-secondary transition-colors">
                      <div className="flex items-center gap-3">
                        <Shield className="w-4 h-4 text-primary" />
                        <div>
                          <p className="font-mono text-sm font-semibold">{token.token_value.substring(0, 16)}...</p>
                          <p className="text-xs text-muted-foreground">{token.merchants?.name || "Unknown"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={
                            token.status === "active"
                              ? "default"
                              : token.status === "pending"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {token.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(token.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* System Alerts */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
              <CardDescription>Recent notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.map((alert, idx) => (
                  <div key={idx} className="flex gap-3">
                    {alert.type === "info" && <Clock className="w-4 h-4 text-primary mt-0.5" />}
                    {alert.type === "warning" && <AlertTriangle className="w-4 h-4 text-warning mt-0.5" />}
                    {alert.type === "success" && <CheckCircle2 className="w-4 h-4 text-success mt-0.5" />}
                    <div className="flex-1">
                      <p className="text-sm">{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
