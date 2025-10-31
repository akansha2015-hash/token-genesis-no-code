import { Link, useLocation } from "react-router-dom";
import { Shield, LayoutDashboard, Database, FileCode, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", label: "Overview", icon: LayoutDashboard },
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/tokens", label: "Token Management", icon: Shield },
  { path: "/api", label: "API Portal", icon: FileCode },
  { path: "/schema", label: "Database Schema", icon: Database },
  { path: "/merchants", label: "Merchants", icon: Users },
];

export const Navigation = () => {
  const location = useLocation();

  return (
    <nav className="border-b border-border bg-card">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl">
              <Shield className="w-6 h-6 text-primary" />
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                AETS Platform
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
