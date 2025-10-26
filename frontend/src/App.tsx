import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import BottomNavigation from "@/components/navigation/BottomNavigation";
import Index from "./pages/Index";
import Home from "./pages/Home";
import PlaceDetail from "./pages/PlaceDetail";
import Profile from "./pages/Profile";
import RoutesPage from "./pages/Routes";
import RouteBuilder from "./pages/RouteBuilder";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-col h-screen">
      <main className="flex-1 overflow-y-auto pb-16">
        {children}
      </main>
      <BottomNavigation />
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={
            <AppLayout>
              <Home />
            </AppLayout>
          } />
          <Route path="/place/:id" element={
            <AppLayout>
              <PlaceDetail />
            </AppLayout>
          } />
          <Route path="/profile" element={
            <AppLayout>
              <Profile />
            </AppLayout>
          } />
          <Route path="/routes" element={
            <AppLayout>
              <RoutesPage />
            </AppLayout>
          } />
          <Route path="/route-builder" element={
            <AppLayout>
              <RouteBuilder />
            </AppLayout>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;