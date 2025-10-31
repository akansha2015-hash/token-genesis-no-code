import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, CheckCircle2, Clock, XCircle, Copy, Eye, EyeOff, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface Merchant {
  id: string;
  name: string;
  api_key: string;
  status: string;
  created_at: string;
}

export default function Merchants() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    suspended: 0,
  });

  useEffect(() => {
    fetchMerchants();
  }, []);

  const fetchMerchants = async () => {
    try {
      const { data, error } = await supabase
        .from("merchants")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setMerchants(data || []);

      // Calculate stats
      const total = data?.length || 0;
      const active = data?.filter(m => m.status === "active").length || 0;
      const pending = data?.filter(m => m.status === "pending").length || 0;
      const suspended = data?.filter(m => m.status === "suspended").length || 0;

      setStats({ total, active, pending, suspended });
    } catch (error: any) {
      console.error("Error fetching merchants:", error);
      toast.error("Failed to load merchants");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleKeyVisibility = (merchantId: string) => {
    setVisibleKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(merchantId)) {
        newSet.delete(merchantId);
      } else {
        newSet.add(merchantId);
      }
      return newSet;
    });
  };

  const copyApiKey = (apiKey: string) => {
    navigator.clipboard.writeText(apiKey);
    toast.success("API key copied to clipboard");
  };

  const regenerateApiKey = async (merchantId: string) => {
    try {
      const newKey = `sk_live_${Math.random().toString(36).substring(2)}`;
      const { error } = await supabase
        .from("merchants")
        .update({ api_key: newKey })
        .eq("id", merchantId);

      if (error) throw error;

      toast.success("API key regenerated successfully");
      fetchMerchants();
    } catch (error: any) {
      toast.error("Failed to regenerate API key");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Merchants</h1>
            <p className="text-muted-foreground">Manage merchant accounts and integrations</p>
          </div>
        </div>

        {/* Merchant Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-sm text-muted-foreground mt-1">Total Merchants</div>
                </div>
                <Users className="w-6 h-6 text-primary opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-2xl font-bold">{stats.active}</div>
                  <div className="text-sm text-muted-foreground mt-1">Active</div>
                </div>
                <CheckCircle2 className="w-6 h-6 text-success opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-2xl font-bold">{stats.pending}</div>
                  <div className="text-sm text-muted-foreground mt-1">Pending</div>
                </div>
                <Clock className="w-6 h-6 text-warning opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-2xl font-bold">{stats.suspended}</div>
                  <div className="text-sm text-muted-foreground mt-1">Suspended</div>
                </div>
                <XCircle className="w-6 h-6 text-destructive opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Merchant List */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Merchant Accounts</CardTitle>
            <CardDescription>All registered merchants in the platform</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading merchants...</div>
            ) : merchants.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No merchants found</div>
            ) : (
              <div className="space-y-3">
                {merchants.map((merchant) => {
                  const isVisible = visibleKeys.has(merchant.id);
                  const displayKey = isVisible
                    ? merchant.api_key
                    : merchant.api_key.substring(0, 12) + "...";

                  return (
                    <div
                      key={merchant.id}
                      className="flex items-center gap-4 p-4 border border-border rounded-lg hover:bg-secondary transition-colors"
                    >
                      <Users className="w-5 h-5 text-primary" />
                      <div className="flex-1 grid grid-cols-4 gap-4 items-center">
                        <div>
                          <p className="font-semibold">{merchant.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {merchant.id.substring(0, 13)}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <div className="flex items-center gap-2">
                            <p className="font-mono text-sm">{displayKey}</p>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleKeyVisibility(merchant.id)}
                            >
                              {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyApiKey(merchant.api_key)}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => regenerateApiKey(merchant.id)}
                            >
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">API Key Management</p>
                        </div>
                        <div className="flex items-center justify-between">
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
                          <div className="text-right">
                            <p className="text-sm">{new Date(merchant.created_at).toLocaleDateString()}</p>
                            <p className="text-xs text-muted-foreground">Joined</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
