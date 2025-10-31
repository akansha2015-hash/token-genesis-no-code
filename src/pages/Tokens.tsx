import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Shield, Search, Plus, MoreVertical, Copy, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Tokens() {
  const [searchQuery, setSearchQuery] = useState("");

  const tokens = [
    { id: "TKN-8829A", merchant: "Retail Corp", card: "****4532", device: "iPhone 14", status: "active", created: "2025-10-30", expiry: "2026-10-30" },
    { id: "TKN-8828B", merchant: "E-commerce Inc", card: "****7891", device: "Galaxy S23", status: "active", created: "2025-10-29", expiry: "2026-10-29" },
    { id: "TKN-8827C", merchant: "Payment Hub", card: "****2341", device: "Pixel 8", status: "pending", created: "2025-10-29", expiry: "2026-10-29" },
    { id: "TKN-8826D", merchant: "Global Merchant", card: "****9876", device: "iPhone 15", status: "active", created: "2025-10-28", expiry: "2026-10-28" },
    { id: "TKN-8825E", merchant: "Tech Solutions", card: "****1234", device: "OnePlus 11", status: "revoked", created: "2025-10-27", expiry: "2026-10-27" },
  ];

  const handleCopyToken = (tokenId: string) => {
    navigator.clipboard.writeText(tokenId);
    toast.success("Token ID copied to clipboard");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Token Management</h1>
            <p className="text-muted-foreground">Manage and monitor payment tokens</p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Generate Token
          </Button>
        </div>

        {/* Search & Filters */}
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search tokens by ID, merchant, or device..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button variant="outline">Filter</Button>
            </div>
          </CardContent>
        </Card>

        {/* Token List */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Active Tokens</CardTitle>
            <CardDescription>All payment tokens in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tokens.map((token) => (
                <div
                  key={token.id}
                  className="flex items-center gap-4 p-4 border border-border rounded-lg hover:bg-secondary transition-colors"
                >
                  <Shield className="w-5 h-5 text-primary" />
                  <div className="flex-1 grid grid-cols-6 gap-4 items-center">
                    <div>
                      <p className="font-mono text-sm font-semibold">{token.id}</p>
                      <p className="text-xs text-muted-foreground">{token.merchant}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{token.card}</p>
                      <p className="text-xs text-muted-foreground">Card Number</p>
                    </div>
                    <div>
                      <p className="text-sm">{token.device}</p>
                      <p className="text-xs text-muted-foreground">Device</p>
                    </div>
                    <div>
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
                    </div>
                    <div>
                      <p className="text-sm">{token.created}</p>
                      <p className="text-xs text-muted-foreground">Created</p>
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopyToken(token.id)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
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

        {/* Token Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { label: "Total Tokens", value: "847,293" },
            { label: "Active", value: "842,891" },
            { label: "Pending", value: "3,156" },
            { label: "Revoked", value: "1,246" },
          ].map((stat) => (
            <Card key={stat.label} className="shadow-card">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
