import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { AlertTriangle, CheckCircle, Clock, TrendingUp, MessageSquare, FileText } from "lucide-react";

interface FeatureBacklog {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  performance_impact: any;
  estimated_effort: number;
  created_at: string;
}

interface APIMetric {
  endpoint: string;
  method: string;
  status_code: number;
  response_time_ms: number;
  error_message: string;
  created_at: string;
}

interface UserFeedback {
  id: string;
  category: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  created_at: string;
}

export default function Governance() {
  const [features, setFeatures] = useState<FeatureBacklog[]>([]);
  const [apiMetrics, setApiMetrics] = useState<APIMetric[]>([]);
  const [feedback, setFeedback] = useState<UserFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Feedback form state
  const [feedbackForm, setFeedbackForm] = useState({
    category: "feature_request",
    title: "",
    description: "",
    priority: "medium"
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [featuresRes, metricsRes, feedbackRes] = await Promise.all([
        supabase.from("feature_backlog").select("*").order("created_at", { ascending: false }),
        supabase.from("api_performance_metrics").select("*").order("created_at", { ascending: false }).limit(1000),
        supabase.from("user_feedback").select("*").order("created_at", { ascending: false })
      ]);

      if (featuresRes.error) throw featuresRes.error;
      if (metricsRes.error) throw metricsRes.error;
      if (feedbackRes.error) throw feedbackRes.error;

      setFeatures(featuresRes.data || []);
      setApiMetrics(metricsRes.data || []);
      setFeedback(feedbackRes.data || []);
    } catch (error: any) {
      toast({
        title: "Error loading data",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const submitFeedback = async () => {
    if (!feedbackForm.title || !feedbackForm.description) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from("user_feedback").insert({
        user_id: user?.id,
        category: feedbackForm.category,
        title: feedbackForm.title,
        description: feedbackForm.description,
        priority: feedbackForm.priority
      });

      if (error) throw error;

      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback!"
      });

      setFeedbackForm({
        category: "feature_request",
        title: "",
        description: "",
        priority: "medium"
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error submitting feedback",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Calculate API performance metrics
  const endpointFailures = apiMetrics
    .filter(m => m.status_code >= 400)
    .reduce((acc, curr) => {
      const key = `${curr.method} ${curr.endpoint}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const failureData = Object.entries(endpointFailures)
    .map(([endpoint, count]) => ({ endpoint, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const avgResponseTime = apiMetrics.length > 0
    ? Math.round(apiMetrics.reduce((sum, m) => sum + m.response_time_ms, 0) / apiMetrics.length)
    : 0;

  const statusDistribution = [
    { name: "Success (2xx)", value: apiMetrics.filter(m => m.status_code >= 200 && m.status_code < 300).length },
    { name: "Client Error (4xx)", value: apiMetrics.filter(m => m.status_code >= 400 && m.status_code < 500).length },
    { name: "Server Error (5xx)", value: apiMetrics.filter(m => m.status_code >= 500).length }
  ].filter(d => d.value > 0);

  const COLORS = ["hsl(var(--primary))", "hsl(var(--destructive))", "hsl(var(--warning))"];

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      low: "secondary",
      medium: "default",
      high: "destructive",
      critical: "destructive"
    };
    return <Badge variant={variants[priority] || "default"}>{priority}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      proposed: "secondary",
      approved: "default",
      in_progress: "default",
      completed: "outline",
      rejected: "secondary",
      open: "default",
      reviewing: "default",
      planned: "outline",
      closed: "secondary"
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Governance Dashboard</h1>
          <p className="text-muted-foreground">System optimization, feature tracking & continuous improvement</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Features</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{features.filter(f => f.status === "in_progress").length}</div>
            <p className="text-xs text-muted-foreground">In development</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgResponseTime}ms</div>
            <p className="text-xs text-muted-foreground">Last 1000 requests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Requests</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{apiMetrics.filter(m => m.status_code >= 400).length}</div>
            <p className="text-xs text-muted-foreground">Errors detected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Feedback</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{feedback.filter(f => f.status === "open").length}</div>
            <p className="text-xs text-muted-foreground">Open items</p>
          </CardContent>
        </Card>
      </div>

      {/* API Performance Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Failed Endpoints</CardTitle>
            <CardDescription>Endpoints with most 4xx/5xx errors</CardDescription>
          </CardHeader>
          <CardContent>
            {failureData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={failureData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="endpoint" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--destructive))" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                <CheckCircle className="mr-2" />
                No failed requests detected
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Response Status Distribution</CardTitle>
            <CardDescription>HTTP status code breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {statusDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No API metrics available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Feature Backlog */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2" />
            Feature Backlog
          </CardTitle>
          <CardDescription>Proposed enhancements and performance improvements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {features.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No features in backlog</p>
            ) : (
              features.map((feature) => (
                <div key={feature.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{feature.description}</p>
                    </div>
                    <div className="flex gap-2">
                      {getPriorityBadge(feature.priority)}
                      {getStatusBadge(feature.status)}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {feature.estimated_effort && (
                      <span>Effort: {feature.estimated_effort} days</span>
                    )}
                    <span>Created: {new Date(feature.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* User Feedback Form */}
      <Card>
        <CardHeader>
          <CardTitle>Submit Feedback</CardTitle>
          <CardDescription>Help us improve the platform</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={feedbackForm.category}
                onValueChange={(value) => setFeedbackForm({ ...feedbackForm, category: value })}
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bug">Bug Report</SelectItem>
                  <SelectItem value="feature_request">Feature Request</SelectItem>
                  <SelectItem value="improvement">Improvement</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={feedbackForm.priority}
                onValueChange={(value) => setFeedbackForm({ ...feedbackForm, priority: value })}
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Brief summary of your feedback"
              value={feedbackForm.title}
              onChange={(e) => setFeedbackForm({ ...feedbackForm, title: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Provide detailed information..."
              rows={4}
              value={feedbackForm.description}
              onChange={(e) => setFeedbackForm({ ...feedbackForm, description: e.target.value })}
            />
          </div>

          <Button onClick={submitFeedback}>Submit Feedback</Button>
        </CardContent>
      </Card>

      {/* Recent Feedback */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Feedback</CardTitle>
          <CardDescription>User submissions and status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {feedback.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No feedback submitted yet</p>
            ) : (
              feedback.slice(0, 10).map((item) => (
                <div key={item.id} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{item.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(item.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">{item.category}</Badge>
                      {getPriorityBadge(item.priority)}
                      {getStatusBadge(item.status)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}