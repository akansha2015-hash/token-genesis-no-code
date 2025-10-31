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
      path: "/tokenize",
      desc: "Generate a new payment token from card data",
      isLive: true,
      requiresAuth: false,
      authType: "API Key (x-api-key header)",
      request: `{
  "pan": "4111111111111111",
  "expiry_month": 12,
  "expiry_year": 2026,
  "customer_id": "CUST-12345",
  "issuer_id": "VISA",
  "card_brand": "Visa"
}`,
      response: `{
  "token_id": "550e8400-e29b-41d4-a716-446655440000",
  "token_value": "7b3f8c9d2a1e4f6b8c0d1e2f3a4b5c6d",
  "status": "active",
  "card_last_four": "1111",
  "expires_at": "2026-10-30T10:30:00Z",
  "created_at": "2025-10-30T10:30:00Z"
}`,
    },
    {
      method: "POST",
      path: "/detokenize",
      desc: "Resolve token to original card data (Admin & Auditor Only)",
      isLive: true,
      requiresAuth: true,
      authType: "JWT Bearer Token (Admin/Auditor Role Required)",
      request: `{
  "token_value": "7b3f8c9d2a1e4f6b8c0d1e2f3a4b5c6d"
}`,
      response: `{
  "token_id": "550e8400-e29b-41d4-a716-446655440000",
  "pan": "4111111111111111",
  "last_four": "1111",
  "expiry_month": 12,
  "expiry_year": 2026,
  "card_brand": "Visa",
  "customer_id": "CUST-12345",
  "merchant_id": "...",
  "status": "active"
}`,
    },
    {
      method: "POST",
      path: "/token-status",
      desc: "Update token lifecycle status",
      isLive: true,
      requiresAuth: false,
      authType: "API Key (x-api-key header)",
      request: `{
  "token_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "suspended",
  "reason": "Suspected fraudulent activity"
}`,
      response: `{
  "token_id": "550e8400-e29b-41d4-a716-446655440000",
  "token_value": "7b3f8c9d2a1e4f6b8c0d1e2f3a4b5c6d",
  "old_status": "active",
  "new_status": "suspended",
  "updated_at": "2025-10-30T11:30:00Z"
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

        {/* Security & Compliance Section */}
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
              🔒 Security & Compliance
            </CardTitle>
            <CardDescription className="text-blue-800 dark:text-blue-200">
              Enterprise-grade security features and PCI DSS compliance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Role-Based Access Control
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Admin, Merchant, and Auditor roles with granular permissions
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Rate Limiting
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  1,000 requests/minute per merchant (HTTP 429 if exceeded)
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Restricted Detokenization
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Admin and auditor roles only with full audit logging
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Automated Key Rotation
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  30-day automatic encryption key rotation cycle
                </p>
              </div>
            </div>
            <Badge variant="outline" className="bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700">
              ✓ PCI DSS Level 1 Compliant
            </Badge>
          </CardContent>
        </Card>

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
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={endpoint.method === "GET" ? "secondary" : "default"}
                      className="w-16 justify-center"
                    >
                      {endpoint.method}
                    </Badge>
                    <code className="text-lg font-mono">{endpoint.path}</code>
                    {endpoint.isLive && (
                      <Badge variant="outline" className="text-success border-success">
                        ✓ Live
                      </Badge>
                    )}
                  </div>
                </div>
                <CardDescription className="flex items-start gap-2">
                  <span>{endpoint.desc}</span>
                  {endpoint.requiresAuth && (
                    <Badge variant="secondary" className="text-xs">
                      🔒 Auth: {endpoint.authType}
                    </Badge>
                  )}
                  {!endpoint.requiresAuth && (
                    <Badge variant="secondary" className="text-xs">
                      🔑 Auth: {endpoint.authType}
                    </Badge>
                  )}
                </CardDescription>
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
