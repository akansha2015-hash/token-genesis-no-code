import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, Key, Link as LinkIcon } from "lucide-react";

export default function Schema() {
  const tables = [
    {
      name: "merchants",
      desc: "Merchant account information",
      fields: [
        { name: "id", type: "UUID", constraint: "PRIMARY KEY" },
        { name: "name", type: "VARCHAR(255)", constraint: "NOT NULL" },
        { name: "api_key", type: "VARCHAR(64)", constraint: "UNIQUE" },
        { name: "status", type: "ENUM", constraint: "NOT NULL" },
        { name: "created_at", type: "TIMESTAMP", constraint: "DEFAULT NOW()" },
      ],
    },
    {
      name: "cards",
      desc: "Encrypted payment card details",
      fields: [
        { name: "id", type: "UUID", constraint: "PRIMARY KEY" },
        { name: "encrypted_number", type: "TEXT", constraint: "NOT NULL" },
        { name: "last_four", type: "VARCHAR(4)", constraint: "NOT NULL" },
        { name: "expiry_month", type: "INTEGER", constraint: "NOT NULL" },
        { name: "expiry_year", type: "INTEGER", constraint: "NOT NULL" },
        { name: "created_at", type: "TIMESTAMP", constraint: "DEFAULT NOW()" },
      ],
    },
    {
      name: "tokens",
      desc: "Payment tokens replacing card data",
      fields: [
        { name: "id", type: "UUID", constraint: "PRIMARY KEY" },
        { name: "token_value", type: "VARCHAR(32)", constraint: "UNIQUE" },
        { name: "card_id", type: "UUID", constraint: "FOREIGN KEY" },
        { name: "merchant_id", type: "UUID", constraint: "FOREIGN KEY" },
        { name: "device_id", type: "UUID", constraint: "FOREIGN KEY" },
        { name: "status", type: "ENUM", constraint: "NOT NULL" },
        { name: "expires_at", type: "TIMESTAMP", constraint: "NOT NULL" },
        { name: "created_at", type: "TIMESTAMP", constraint: "DEFAULT NOW()" },
      ],
    },
    {
      name: "devices",
      desc: "End-user device information",
      fields: [
        { name: "id", type: "UUID", constraint: "PRIMARY KEY" },
        { name: "device_fingerprint", type: "VARCHAR(128)", constraint: "UNIQUE" },
        { name: "device_type", type: "VARCHAR(50)", constraint: "" },
        { name: "os_version", type: "VARCHAR(50)", constraint: "" },
        { name: "last_seen", type: "TIMESTAMP", constraint: "" },
      ],
    },
    {
      name: "transactions",
      desc: "Payment transaction records",
      fields: [
        { name: "id", type: "UUID", constraint: "PRIMARY KEY" },
        { name: "token_id", type: "UUID", constraint: "FOREIGN KEY" },
        { name: "merchant_id", type: "UUID", constraint: "FOREIGN KEY" },
        { name: "amount", type: "DECIMAL(10,2)", constraint: "NOT NULL" },
        { name: "currency", type: "VARCHAR(3)", constraint: "NOT NULL" },
        { name: "status", type: "ENUM", constraint: "NOT NULL" },
        { name: "created_at", type: "TIMESTAMP", constraint: "DEFAULT NOW()" },
      ],
    },
    {
      name: "risk_events",
      desc: "Security and fraud monitoring",
      fields: [
        { name: "id", type: "UUID", constraint: "PRIMARY KEY" },
        { name: "event_type", type: "VARCHAR(50)", constraint: "NOT NULL" },
        { name: "severity", type: "ENUM", constraint: "NOT NULL" },
        { name: "token_id", type: "UUID", constraint: "FOREIGN KEY" },
        { name: "description", type: "TEXT", constraint: "" },
        { name: "created_at", type: "TIMESTAMP", constraint: "DEFAULT NOW()" },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Database Schema</h1>
          <p className="text-muted-foreground">Entity relationship model for tokenization system</p>
        </div>

        {/* ERD Overview */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Entity Relationships
            </CardTitle>
            <CardDescription>
              How entities connect in the tokenization flow
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline">merchants</Badge>
                <LinkIcon className="w-4 h-4 text-muted-foreground" />
                <Badge variant="outline">tokens</Badge>
                <span className="text-muted-foreground">(one-to-many)</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline">cards</Badge>
                <LinkIcon className="w-4 h-4 text-muted-foreground" />
                <Badge variant="outline">tokens</Badge>
                <span className="text-muted-foreground">(one-to-many)</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline">devices</Badge>
                <LinkIcon className="w-4 h-4 text-muted-foreground" />
                <Badge variant="outline">tokens</Badge>
                <span className="text-muted-foreground">(one-to-many)</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline">tokens</Badge>
                <LinkIcon className="w-4 h-4 text-muted-foreground" />
                <Badge variant="outline">transactions</Badge>
                <span className="text-muted-foreground">(one-to-many)</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline">tokens</Badge>
                <LinkIcon className="w-4 h-4 text-muted-foreground" />
                <Badge variant="outline">risk_events</Badge>
                <span className="text-muted-foreground">(one-to-many)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table Schemas */}
        <div className="grid gap-6">
          {tables.map((table) => (
            <Card key={table.name} className="shadow-card">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-primary" />
                  <CardTitle className="font-mono">{table.name}</CardTitle>
                </div>
                <CardDescription>{table.desc}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {table.fields.map((field, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-4 p-3 border border-border rounded-md bg-secondary/50"
                    >
                      <code className="text-sm font-semibold w-48">{field.name}</code>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {field.type}
                      </Badge>
                      {field.constraint && (
                        <span className="text-xs text-muted-foreground">{field.constraint}</span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
