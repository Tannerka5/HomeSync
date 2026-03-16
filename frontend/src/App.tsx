import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import { AuthProvider } from "@/lib/auth";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import HomePage from "@/pages/home";
import ListingsPage from "@/pages/listings";
import BoardPage from "@/pages/board";
import ChatPage from "@/pages/chat";
import LoginPage from "@/pages/login";
import SignupPage from "@/pages/signup";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />

      <Route path="/signup" component={SignupPage} />

      {/* Public */}
      <Route path="/">
        <Layout>
          <HomePage />
        </Layout>
      </Route>

      {/* Protected */}
      <Route path="/listings">
        <ProtectedRoute>
          <Layout>
            <ListingsPage />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/board">
        <ProtectedRoute>
          <Layout>
            <BoardPage />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/chat">
        <ProtectedRoute>
          <Layout>
            <ChatPage />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
