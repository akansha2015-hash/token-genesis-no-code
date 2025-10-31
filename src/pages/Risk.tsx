import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp, Shield, XCircle } from "lucide-react";
import { toast } from "sonner";

interface RiskEvent {
  id: string;
  event_type: string;
  severity: string;
  risk_score: number;
  decision: string;
  reason: string;
  created_at: string;
  token_id: string;
  transaction_id: string;
}

export default function Risk() {
  const [riskEvents, setRiskEvents] = useState<RiskEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEvents: 0,
    highRisk: 0,
    blocked: 0,
    flagged: 0,
  });

  useEffect(() => {
    fetchRiskEvents();
  }, []);

  const fetchRiskEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("risk_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      setRiskEvents(data || []);
      
      // Calculate stats
      const totalEvents = data?.length || 0;
      const highRisk = data?.filter(e => e.risk_score >= 70).length || 0;
      const blocked = data?.filter(e => e.decision === "decline").length || 0;
      const flagged = data?.filter(e => e.decision === "review" || e.decision === "challenge").length || 0;
      
      setStats({ totalEvents, highRisk, blocked, flagged });
    } catch (error: any) {
      toast.error("Failed to load risk events");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive";
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getDecisionIcon = (decision: string) => {
    if (decision === "decline" || decision === "review") {
      return <XCircle className="w-4 h-4 text-destructive" />;
    } else if (decision === "challenge") {
      return <AlertTriangle className="w-4 h-4 text-warning" />;
    } else {
      return <Shield className="w-4 h-4 text-success" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Risk Monitor</h1>
          <p className="text-muted-foreground">Real-time fraud detection and risk analysis</p>
        </div>

        {/* Risk Stats */}
        <div className="grid md:grid-cols-4 gap-6">
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Events</p>
                  <p className="text-3xl font-bold mt-2">{stats.totalEvents}</p>
                </div>
                <Shield className="w-8 h-8 text-primary opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">High Risk</p>
                  <p className="text-3xl font-bold mt-2">{stats.highRisk}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-destructive opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Blocked</p>
                  <p className="text-3xl font-bold mt-2">{stats.blocked}</p>
                </div>
                <XCircle className="w-8 h-8 text-destructive opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Flagged</p>
                  <p className="text-3xl font-bold mt-2">{stats.flagged}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-warning opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Risk Events List */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Risk Events</CardTitle>
            <CardDescription>Recent security and fraud detection events</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading events...</div>
            ) : riskEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No risk events found</div>
            ) : (
              <div className="space-y-3">
                {riskEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-4 p-4 border border-border rounded-lg hover:bg-secondary transition-colors"
                  >
                    {getDecisionIcon(event.decision)}
                    <div className="flex-1 grid grid-cols-5 gap-4 items-center">
                      <div>
                        <p className="font-semibold text-sm">{event.event_type}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {event.token_id?.substring(0, 8)}...
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Score: {event.risk_score}</p>
                        <Badge variant={getSeverityColor(event.severity)} className="mt-1">
                          {event.severity}
                        </Badge>
                      </div>
                      <div>
                        <Badge
                          variant={
                            event.decision === "decline" || event.decision === "review"
                              ? "destructive"
                              : event.decision === "challenge"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {event.decision}
                        </Badge>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm">{event.reason || "No reason provided"}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(event.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
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