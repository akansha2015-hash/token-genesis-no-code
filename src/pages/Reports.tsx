import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download, FileText, Mail, Calendar, TrendingUp, Shield, Clock, AlertTriangle } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface ReportMetrics {
  tokenIssuance: any[];
  latencyData: any[];
  riskDistribution: any[];
  complianceSummary: any[];
}

export default function Reports() {
  const [metrics, setMetrics] = useState<ReportMetrics>({
    tokenIssuance: [],
    latencyData: [],
    riskDistribution: [],
    complianceSummary: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("30");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchReportData();
  }, [selectedPeriod]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const daysAgo = parseInt(selectedPeriod);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      // Token issuance per merchant
      const { data: tokens } = await supabase
        .from("tokens")
        .select("created_at, merchant_id, merchants(name)")
        .gte("created_at", startDate.toISOString());

      const merchantCounts: { [key: string]: number } = {};
      tokens?.forEach((token: any) => {
        const name = token.merchants?.name || "Unknown";
        merchantCounts[name] = (merchantCounts[name] || 0) + 1;
      });

      const tokenIssuance = Object.entries(merchantCounts).map(([name, count]) => ({
        merchant: name,
        tokens: count
      }));

      // Average latency (simulated from transactions)
      const { data: transactions } = await supabase
        .from("transactions")
        .select("created_at, updated_at")
        .gte("created_at", startDate.toISOString())
        .limit(100);

      const latencyByDay: { [key: string]: number[] } = {};
      transactions?.forEach((txn: any) => {
        const day = new Date(txn.created_at).toLocaleDateString();
        const latency = Math.random() * 100 + 20; // Simulated latency
        if (!latencyByDay[day]) latencyByDay[day] = [];
        latencyByDay[day].push(latency);
      });

      const latencyData = Object.entries(latencyByDay).map(([day, latencies]) => ({
        date: day,
        avgLatency: Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
      }));

      // Risk score distribution
      const { data: riskEvents } = await supabase
        .from("risk_events")
        .select("risk_score, severity")
        .gte("created_at", startDate.toISOString());

      const riskBuckets = {
        "Low (0-30)": 0,
        "Medium (31-60)": 0,
        "High (61-80)": 0,
        "Critical (81-100)": 0
      };

      riskEvents?.forEach((event: any) => {
        const score = event.risk_score || 0;
        if (score <= 30) riskBuckets["Low (0-30)"]++;
        else if (score <= 60) riskBuckets["Medium (31-60)"]++;
        else if (score <= 80) riskBuckets["High (61-80)"]++;
        else riskBuckets["Critical (81-100)"]++;
      });

      const riskDistribution = Object.entries(riskBuckets).map(([range, count]) => ({
        range,
        count
      }));

      // Compliance event summary
      const { data: complianceLogs } = await supabase
        .from("compliance_logs")
        .select("check_result, severity")
        .gte("created_at", startDate.toISOString());

      const complianceStatus = {
        pass: 0,
        warning: 0,
        fail: 0
      };

      complianceLogs?.forEach((log: any) => {
        if (log.check_result === "pass") complianceStatus.pass++;
        else if (log.check_result === "warning") complianceStatus.warning++;
        else complianceStatus.fail++;
      });

      const complianceSummary = Object.entries(complianceStatus).map(([status, count]) => ({
        status,
        count
      }));

      setMetrics({
        tokenIssuance,
        latencyData,
        riskDistribution,
        complianceSummary
      });
    } catch (error) {
      console.error("Error fetching report data:", error);
      toast.error("Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async (format: "pdf" | "excel") => {
    setExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke("export-report", {
        body: {
          format,
          period: selectedPeriod,
          metrics
        }
      });

      if (error) throw error;

      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (error: any) {
      console.error("Export error:", error);
      toast.error("Failed to export report");
    } finally {
      setExporting(false);
    }
  };

  const handleScheduleReport = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("generate-report", {
        body: {
          schedule: "monthly",
          recipients: ["compliance@example.com"]
        }
      });

      if (error) throw error;

      toast.success("Monthly report scheduled successfully");
    } catch (error: any) {
      console.error("Schedule error:", error);
      toast.error("Failed to schedule report");
    }
  };

  const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--muted))"];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Reports & Analytics</h1>
            <p className="text-muted-foreground">Comprehensive usage and compliance reporting</p>
          </div>
          <div className="flex gap-3">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => handleExportReport("excel")} disabled={exporting}>
              <Download className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
            <Button variant="outline" onClick={() => handleExportReport("pdf")} disabled={exporting}>
              <FileText className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <Button variant="secondary" onClick={handleScheduleReport}>
              <Mail className="w-4 h-4 mr-2" />
              Schedule Email
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Total Tokens</p>
                  <p className="text-3xl font-bold">
                    {metrics.tokenIssuance.reduce((sum, m) => sum + m.tokens, 0)}
                  </p>
                </div>
                <Shield className="w-8 h-8 text-primary opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Avg Latency</p>
                  <p className="text-3xl font-bold">
                    {metrics.latencyData.length > 0
                      ? Math.round(
                          metrics.latencyData.reduce((sum, d) => sum + d.avgLatency, 0) /
                            metrics.latencyData.length
                        )
                      : 0}
                    ms
                  </p>
                </div>
                <Clock className="w-8 h-8 text-primary opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Risk Events</p>
                  <p className="text-3xl font-bold">
                    {metrics.riskDistribution.reduce((sum, r) => sum + r.count, 0)}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-warning opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Compliance Pass Rate</p>
                  <p className="text-3xl font-bold">
                    {metrics.complianceSummary.length > 0
                      ? Math.round(
                          (metrics.complianceSummary.find(c => c.status === "pass")?.count || 0) /
                            metrics.complianceSummary.reduce((sum, c) => sum + c.count, 0) *
                            100
                        )
                      : 0}
                    %
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-success opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Token Issuance by Merchant */}
          <Card>
            <CardHeader>
              <CardTitle>Token Issuance by Merchant</CardTitle>
              <CardDescription>Volume of tokens generated per merchant</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metrics.tokenIssuance}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="merchant" className="text-xs" />
                  <YAxis />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                  <Bar dataKey="tokens" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Average Authorization Latency */}
          <Card>
            <CardHeader>
              <CardTitle>Average Authorization Latency</CardTitle>
              <CardDescription>Response time trends over selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics.latencyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                  <Line type="monotone" dataKey="avgLatency" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Risk Score Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Risk Score Distribution</CardTitle>
              <CardDescription>Breakdown of transactions by risk level</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={metrics.riskDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ range, percent }) => `${range}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="hsl(var(--primary))"
                    dataKey="count"
                  >
                    {metrics.riskDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Compliance Event Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Compliance Event Summary</CardTitle>
              <CardDescription>Compliance check results breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metrics.complianceSummary}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                  <Bar dataKey="count" fill="hsl(var(--primary))">
                    {metrics.complianceSummary.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.status === "pass"
                            ? "hsl(var(--success))"
                            : entry.status === "warning"
                            ? "hsl(var(--warning))"
                            : "hsl(var(--destructive))"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Scheduled Reports Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Automated Report Delivery
            </CardTitle>
            <CardDescription>Configure scheduled reports for compliance and executive teams</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div>
                <p className="font-semibold">Monthly Executive Summary</p>
                <p className="text-sm text-muted-foreground">Comprehensive platform metrics and KPIs</p>
              </div>
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div>
                <p className="font-semibold">Weekly Compliance Report</p>
                <p className="text-sm text-muted-foreground">Automated compliance check results</p>
              </div>
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div>
                <p className="font-semibold">Daily Risk Summary</p>
                <p className="text-sm text-muted-foreground">High-risk transaction alerts and trends</p>
              </div>
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
