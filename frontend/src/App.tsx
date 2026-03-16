import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import { AuthProvider } from "@/lib/auth";

import HomePage from "@/pages/home";
import ListingsPage from "@/pages/listings";
import BoardPage from "@/pages/board";
import ChatPage from "@/pages/chat";
import LoginPage from "@/pages/login";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />

      <Route path="/">
        <Layout>
          <HomePage />
        </Layout>
      </Route>
      <Route path="/listings">
        <Layout>
          <ListingsPage />
        </Layout>
      </Route>
      <Route path="/board">
        <Layout>
          <BoardPage />
        </Layout>
      </Route>
      <Route path="/chat">
        <Layout>
          <ChatPage />
        </Layout>
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