import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { isOnboardingComplete } from "@/utils/storage";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";
import Index from "./pages/Index";
import Home from "./pages/Home";
import PlaceDetail from "./pages/PlaceDetail";
import Profile from "./pages/Profile";
import RoutesPage from "./pages/Routes";
import RouteBuilder from "./pages/RouteBuilder";
import Expenses from "./pages/Expenses";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  return isOnboardingComplete() ? <>{children}</> : <Navigate to="/onboarding" />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/onboarding" element={<OnboardingFlow />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />
          <Route path="/place/:id" element={
            <ProtectedRoute>
              <PlaceDetail />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/routes" element={
            <ProtectedRoute>
              <RoutesPage />
            </ProtectedRoute>
          } />
          <Route path="/route-builder" element={
            <ProtectedRoute>
              <RouteBuilder />
            </ProtectedRoute>
          } />
          <Route path="/expenses" element={
            <ProtectedRoute>
              <Expenses />
            </ProtectedRoute>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;