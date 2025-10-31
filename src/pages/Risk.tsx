import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, TrendingUp, Shield, XCircle, Search, Filter } from "lucide-react";
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
  const [filteredEvents, setFilteredEvents] = useState<RiskEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [decisionFilter, setDecisionFilter] = useState<string>("all");
  const [stats, setStats] = useState({
    totalEvents: 0,
    highRisk: 0,
    blocked: 0,
    flagged: 0,
  });

  useEffect(() => {
    fetchRiskEvents();
  }, []);

  useEffect(() => {
    let filtered = riskEvents;

    if (searchQuery) {
      filtered = filtered.filter(e =>
        e.event_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.token_id?.includes(searchQuery)
      );
    }

    if (severityFilter !== "all") {
      filtered = filtered.filter(e => e.severity === severityFilter);
    }

    if (decisionFilter !== "all") {
      filtered = filtered.filter(e => e.decision === decisionFilter);
    }

    setFilteredEvents(filtered);
  }, [riskEvents, searchQuery, severityFilter, decisionFilter]);

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

        {/* Filters */}
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by event type, token ID, or reason..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={decisionFilter} onValueChange={setDecisionFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Decision" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Decisions</SelectItem>
                  <SelectItem value="approve">Approve</SelectItem>
                  <SelectItem value="challenge">Challenge</SelectItem>
                  <SelectItem value="decline">Decline</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Risk Events List */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Risk Events</CardTitle>
            <CardDescription>Recent security and fraud detection events</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading events...</div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {riskEvents.length === 0 ? "No risk events found" : "No events match your filters"}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEvents.map((event) => (
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