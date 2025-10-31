import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Shield, Search, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Token {
  id: string;
  token_value: string;
  status: string;
  created_at: string;
  expires_at: string;
  merchant_id: string;
  device_id: string | null;
  card_id: string;
  merchants?: { name: string };
  cards?: { last_four: string; card_brand: string };
  devices?: { device_type: string };
}

export default function Tokens() {
  const [searchQuery, setSearchQuery] = useState("");
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    revoked: 0,
  });

  useEffect(() => {
    fetchTokens();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('tokens-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tokens' }, () => {
        fetchTokens();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTokens = async () => {
    try {
      const { data, error } = await supabase
        .from("tokens")
        .select(`
          *,
          merchants(name),
          cards(last_four, card_brand),
          devices(device_type)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      setTokens(data || []);

      // Calculate stats
      const total = data?.length || 0;
      const active = data?.filter(t => t.status === "active").length || 0;
      const pending = data?.filter(t => t.status === "pending").length || 0;
      const revoked = data?.filter(t => t.status === "revoked").length || 0;

      setStats({ total, active, pending, revoked });
    } catch (error: any) {
      console.error("Error fetching tokens:", error);
      toast.error("Failed to load tokens");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTokens = tokens.filter(token =>
    token.token_value.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.merchants?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.cards?.last_four.includes(searchQuery)
  );

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
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              </div>
            ) : filteredTokens.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {searchQuery ? "No tokens match your search" : "No tokens found"}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTokens.map((token) => (
                  <div
                    key={token.id}
                    className="flex items-center gap-4 p-4 border border-border rounded-lg hover:bg-secondary transition-colors"
                  >
                    <Shield className="w-5 h-5 text-primary" />
                    <div className="flex-1 grid grid-cols-6 gap-4 items-center">
                      <div>
                        <p className="font-mono text-sm font-semibold">
                          {token.token_value.substring(0, 16)}...
                        </p>
                        <p className="text-xs text-muted-foreground">{token.merchants?.name || "Unknown"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">****{token.cards?.last_four || "****"}</p>
                        <p className="text-xs text-muted-foreground">{token.cards?.card_brand || "Unknown"}</p>
                      </div>
                      <div>
                        <p className="text-sm">{token.devices?.device_type || "N/A"}</p>
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
                        <p className="text-sm">{new Date(token.created_at).toLocaleDateString()}</p>
                        <p className="text-xs text-muted-foreground">Created</p>
                      </div>
                      <div className="flex items-center gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            navigator.clipboard.writeText(token.token_value);
                            toast.success("Token copied to clipboard");
                          }}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Token Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground mt-1">Total Tokens</div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.active.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground mt-1">Active</div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.pending.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground mt-1">Pending</div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.revoked.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground mt-1">Revoked</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
