import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Shield, AlertTriangle, CheckCircle2, Clock } from "lucide-react";

export default function Dashboard() {
  const metrics = [
    { label: "Active Tokens", value: "847,293", change: "+12.3%", trend: "up", icon: Shield },
    { label: "Today's Transactions", value: "143,291", change: "+8.7%", trend: "up", icon: TrendingUp },
    { label: "Failed Validations", value: "247", change: "-15.2%", trend: "down", icon: AlertTriangle },
    { label: "Avg Response Time", value: "42ms", change: "-5ms", trend: "down", icon: Clock },
  ];

  const recentTokens = [
    { id: "TKN-8829A", merchant: "Retail Corp", status: "active", created: "2 min ago" },
    { id: "TKN-8828B", merchant: "E-commerce Inc", status: "active", created: "5 min ago" },
    { id: "TKN-8827C", merchant: "Payment Hub", status: "pending", created: "8 min ago" },
    { id: "TKN-8826D", merchant: "Global Merchant", status: "active", created: "12 min ago" },
    { id: "TKN-8825E", merchant: "Tech Solutions", status: "revoked", created: "15 min ago" },
  ];

  const alerts = [
    { type: "info", message: "System maintenance scheduled for Sunday 2:00 AM UTC", time: "1h ago" },
    { type: "warning", message: "Elevated token creation requests detected", time: "3h ago" },
    { type: "success", message: "Security scan completed - no issues found", time: "5h ago" },
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
          {metrics.map((metric) => {
            const Icon = metric.icon;
            const isPositive = metric.trend === "up";
            const TrendIcon = isPositive ? TrendingUp : TrendingDown;
            return (
              <Card key={metric.label} className="shadow-card">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">{metric.label}</p>
                      <p className="text-3xl font-bold">{metric.value}</p>
                      <div className="flex items-center gap-1 text-sm">
                        <TrendIcon className={`w-4 h-4 ${isPositive ? 'text-success' : 'text-muted-foreground'}`} />
                        <span className={isPositive ? 'text-success' : 'text-muted-foreground'}>
                          {metric.change}
                        </span>
                      </div>
                    </div>
                    <Icon className="w-8 h-8 text-primary opacity-20" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
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
                {recentTokens.map((token) => (
                  <div key={token.id} className="flex items-center justify-between p-3 border border-border rounded-md hover:bg-secondary transition-colors">
                    <div className="flex items-center gap-3">
                      <Shield className="w-4 h-4 text-primary" />
                      <div>
                        <p className="font-mono text-sm font-semibold">{token.id}</p>
                        <p className="text-xs text-muted-foreground">{token.merchant}</p>
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
                      <span className="text-xs text-muted-foreground">{token.created}</span>
                    </div>
                  </div>
                ))}
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
