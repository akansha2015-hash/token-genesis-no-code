import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import Overview from "./pages/Overview";
import Dashboard from "./pages/Dashboard";
import Tokens from "./pages/Tokens";
import ApiPortal from "./pages/ApiPortal";
import Schema from "./pages/Schema";
import Merchants from "./pages/Merchants";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen bg-background">
          <Navigation />
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tokens" element={<Tokens />} />
            <Route path="/api" element={<ApiPortal />} />
            <Route path="/schema" element={<Schema />} />
            <Route path="/merchants" element={<Merchants />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
