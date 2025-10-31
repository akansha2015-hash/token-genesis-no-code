import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import Overview from "./pages/Overview";
import Dashboard from "./pages/Dashboard";
import Tokens from "./pages/Tokens";
import ApiPortal from "./pages/ApiPortal";
import Schema from "./pages/Schema";
import Merchants from "./pages/Merchants";
import Compliance from "./pages/Compliance";
import Risk from "./pages/Risk";
import Monitoring from "./pages/Monitoring";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen bg-background">
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={
              <>
                <Navigation />
                <Overview />
              </>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Navigation />
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/tokens" element={
              <ProtectedRoute>
                <Navigation />
                <Tokens />
              </ProtectedRoute>
            } />
            <Route path="/risk" element={
              <ProtectedRoute>
                <Navigation />
                <Risk />
              </ProtectedRoute>
            } />
            <Route path="/api" element={
              <ProtectedRoute>
                <Navigation />
                <ApiPortal />
              </ProtectedRoute>
            } />
            <Route path="/schema" element={
              <ProtectedRoute>
                <Navigation />
                <Schema />
              </ProtectedRoute>
            } />
            <Route path="/merchants" element={
              <ProtectedRoute>
                <Navigation />
                <Merchants />
              </ProtectedRoute>
            } />
            <Route path="/compliance" element={
              <ProtectedRoute>
                <Navigation />
                <Compliance />
              </ProtectedRoute>
            } />
            <Route path="/monitoring" element={
              <ProtectedRoute>
                <Navigation />
                <Monitoring />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
