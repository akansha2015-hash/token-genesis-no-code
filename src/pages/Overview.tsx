import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, Zap, Globe, CheckCircle2, Database } from "lucide-react";

export default function Overview() {
  const entities = [
    { name: "Merchant", desc: "Business entities using tokenization" },
    { name: "Card", desc: "Payment card details (PCI-compliant)" },
    { name: "Token", desc: "Secure payment tokens replacing card data" },
    { name: "Device", desc: "End-user devices for token provisioning" },
    { name: "Transaction", desc: "Payment transaction records" },
    { name: "RiskEvent", desc: "Security and fraud monitoring events" },
  ];

  const features = [
    { icon: Shield, title: "Enterprise Security", desc: "Bank-grade encryption and tokenization" },
    { icon: Lock, title: "PCI-DSS Compliant", desc: "Full compliance with payment standards" },
    { icon: Zap, title: "Real-time Processing", desc: "Instant token generation and validation" },
    { icon: Globe, title: "Global Scale", desc: "Multi-region deployment ready" },
  ];

  const endpoints = [
    { method: "POST", path: "/api/tokens/create", desc: "Generate new payment token" },
    { method: "GET", path: "/api/tokens/{id}", desc: "Retrieve token details" },
    { method: "POST", path: "/api/tokens/validate", desc: "Validate token for transaction" },
    { method: "DELETE", path: "/api/tokens/{id}", desc: "Revoke token" },
    { method: "POST", path: "/api/merchants/register", desc: "Onboard new merchant" },
    { method: "GET", path: "/api/transactions", desc: "Query transaction history" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12 space-y-12">
        {/* Hero Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-sm">v1.0</Badge>
            <Badge variant="outline" className="text-sm">Production Ready</Badge>
          </div>
          <h1 className="text-5xl font-bold tracking-tight">
            AmEx Token Service Clone
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl">
            Enterprise-grade payment tokenization platform built with no-code tools.
            Secure, scalable, and compliant tokenization service for modern payment systems.
          </p>
        </div>

        {/* Architecture Overview */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-2xl">Platform Architecture</CardTitle>
            <CardDescription>
              A comprehensive tokenization service with secure token lifecycle management
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {features.map((feature) => (
                <div key={feature.title} className="flex items-start gap-3 p-4 bg-secondary rounded-lg">
                  <feature.icon className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-sm">{feature.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Entity Relationship */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Data Model Entities
            </CardTitle>
            <CardDescription>
              Core entities in the tokenization system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {entities.map((entity) => (
                <div key={entity.name} className="p-4 border border-border rounded-lg hover:border-primary transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    <h3 className="font-semibold">{entity.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{entity.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* API Endpoints */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>API Endpoints</CardTitle>
            <CardDescription>
              RESTful API for token lifecycle management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {endpoints.map((endpoint, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 p-3 border border-border rounded-md hover:bg-secondary transition-colors"
                >
                  <Badge
                    variant={endpoint.method === "GET" ? "secondary" : endpoint.method === "POST" ? "default" : "destructive"}
                    className="w-16 justify-center"
                  >
                    {endpoint.method}
                  </Badge>
                  <code className="text-sm font-mono flex-1">{endpoint.path}</code>
                  <span className="text-sm text-muted-foreground hidden md:block">{endpoint.desc}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { label: "Uptime", value: "99.99%" },
            { label: "Avg Response", value: "45ms" },
            { label: "Tokens/sec", value: "10K+" },
            { label: "Merchants", value: "2,500+" },
          ].map((stat) => (
            <Card key={stat.label} className="shadow-card">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
