import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Plus, MoreVertical, CheckCircle2, Clock, XCircle } from "lucide-react";

export default function Merchants() {
  const merchants = [
    { id: "MCH-12345", name: "Retail Corp", apiKey: "sk_live_abc123...", status: "active", tokens: 45291, joined: "2024-01-15" },
    { id: "MCH-12346", name: "E-commerce Inc", apiKey: "sk_live_def456...", status: "active", tokens: 128493, joined: "2023-11-22" },
    { id: "MCH-12347", name: "Payment Hub", apiKey: "sk_test_ghi789...", status: "pending", tokens: 0, joined: "2025-10-28" },
    { id: "MCH-12348", name: "Global Merchant", apiKey: "sk_live_jkl012...", status: "active", tokens: 89234, joined: "2024-06-10" },
    { id: "MCH-12349", name: "Tech Solutions", apiKey: "sk_live_mno345...", status: "suspended", tokens: 12456, joined: "2024-08-03" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Merchants</h1>
            <p className="text-muted-foreground">Manage merchant accounts and integrations</p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Add Merchant
          </Button>
        </div>

        {/* Merchant Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { label: "Total Merchants", value: "2,547", icon: Users },
            { label: "Active", value: "2,489", icon: CheckCircle2 },
            { label: "Pending", value: "42", icon: Clock },
            { label: "Suspended", value: "16", icon: XCircle },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="shadow-card">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                    </div>
                    <Icon className="w-6 h-6 text-primary opacity-20" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Merchant List */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Merchant Accounts</CardTitle>
            <CardDescription>All registered merchants in the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {merchants.map((merchant) => (
                <div
                  key={merchant.id}
                  className="flex items-center gap-4 p-4 border border-border rounded-lg hover:bg-secondary transition-colors"
                >
                  <Users className="w-5 h-5 text-primary" />
                  <div className="flex-1 grid grid-cols-5 gap-4 items-center">
                    <div>
                      <p className="font-semibold">{merchant.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{merchant.id}</p>
                    </div>
                    <div>
                      <p className="font-mono text-sm">{merchant.apiKey}</p>
                      <p className="text-xs text-muted-foreground">API Key</p>
                    </div>
                    <div>
                      <Badge
                        variant={
                          merchant.status === "active"
                            ? "default"
                            : merchant.status === "pending"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {merchant.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{merchant.tokens.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Active Tokens</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm">{merchant.joined}</p>
                        <p className="text-xs text-muted-foreground">Joined</p>
                      </div>
                      <Button size="sm" variant="ghost">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
