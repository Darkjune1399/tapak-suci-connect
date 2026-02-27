import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Members from "./pages/Members";
import UserManagement from "./pages/UserManagement";
import UktEvents from "./pages/UktEvents";
import UktDetail from "./pages/UktDetail";
import CompetitionEvents from "./pages/CompetitionEvents";
import CompetitionDetail from "./pages/CompetitionDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/members"
              element={
                <ProtectedRoute>
                  <Members />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute allowedRoles={["super_admin"]}>
                  <UserManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ukt"
              element={
                <ProtectedRoute>
                  <UktEvents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ukt/:id"
              element={
                <ProtectedRoute>
                  <UktDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/kompetisi"
              element={
                <ProtectedRoute>
                  <CompetitionEvents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/kompetisi/:id"
              element={
                <ProtectedRoute>
                  <CompetitionDetail />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
