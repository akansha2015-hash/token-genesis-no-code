import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileCode, Copy, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function ApiPortal() {
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied to clipboard");
  };

  const endpoints = [
    {
      method: "POST",
      path: "/api/tokens/create",
      desc: "Generate a new payment token",
      request: `{
  "merchant_id": "MCH-12345",
  "card_number": "4111111111111111",
  "expiry": "12/26",
  "cvv": "123",
  "device_id": "DEV-98765"
}`,
      response: `{
  "token_id": "TKN-8829A",
  "status": "active",
  "created_at": "2025-10-30T10:30:00Z",
  "expires_at": "2026-10-30T10:30:00Z"
}`,
    },
    {
      method: "GET",
      path: "/api/tokens/{id}",
      desc: "Retrieve token details",
      request: null,
      response: `{
  "token_id": "TKN-8829A",
  "merchant_id": "MCH-12345",
  "card_last4": "1111",
  "status": "active",
  "device_id": "DEV-98765",
  "created_at": "2025-10-30T10:30:00Z"
}`,
    },
    {
      method: "POST",
      path: "/api/tokens/validate",
      desc: "Validate token for transaction",
      request: `{
  "token_id": "TKN-8829A",
  "amount": 99.99,
  "currency": "USD",
  "merchant_id": "MCH-12345"
}`,
      response: `{
  "valid": true,
  "transaction_id": "TXN-54321",
  "status": "approved",
  "timestamp": "2025-10-30T10:35:00Z"
}`,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">API Portal</h1>
          <p className="text-muted-foreground">Developer documentation and API reference</p>
        </div>

        {/* Quick Start */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCode className="w-5 h-5" />
              Quick Start
            </CardTitle>
            <CardDescription>Get started with AETS API in minutes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-success mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold mb-1">1. Get API Credentials</h3>
                <p className="text-sm text-muted-foreground">
                  Register your merchant account to receive API keys
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-success mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold mb-1">2. Make Your First Request</h3>
                <p className="text-sm text-muted-foreground">
                  Use the examples below to create your first token
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-success mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold mb-1">3. Test in Sandbox</h3>
                <p className="text-sm text-muted-foreground">
                  Use sandbox environment for testing before going live
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Endpoints */}
        <div className="space-y-6">
          {endpoints.map((endpoint, idx) => (
            <Card key={idx} className="shadow-card">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <Badge
                    variant={endpoint.method === "GET" ? "secondary" : "default"}
                    className="w-16 justify-center"
                  >
                    {endpoint.method}
                  </Badge>
                  <code className="text-lg font-mono">{endpoint.path}</code>
                </div>
                <CardDescription>{endpoint.desc}</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue={endpoint.request ? "request" : "response"}>
                  <TabsList>
                    {endpoint.request && <TabsTrigger value="request">Request</TabsTrigger>}
                    <TabsTrigger value="response">Response</TabsTrigger>
                  </TabsList>
                  {endpoint.request && (
                    <TabsContent value="request" className="space-y-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Request Body</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopyCode(endpoint.request!)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                        <code className="text-sm">{endpoint.request}</code>
                      </pre>
                    </TabsContent>
                  )}
                  <TabsContent value="response" className="space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Response Body</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopyCode(endpoint.response)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                      <code className="text-sm">{endpoint.response}</code>
                    </pre>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
