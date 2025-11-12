
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import Index from "./pages/Index";
import SoilAnalyzer from "./pages/SoilAnalyzer";
import Recommendations from "./pages/Recommendations";
import SoilHealth from "./pages/SoilHealth";
import OrganicFarming from "./pages/OrganicFarming";
import FarmerHelpDesk from "./pages/FarmerHelpDesk";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/soil-analyzer" element={<SoilAnalyzer />} />
            <Route path="/recommendations" element={<Recommendations />} />
            <Route path="/soil-health" element={<SoilHealth />} />
            <Route path="/organic-farming" element={<OrganicFarming />} />
            <Route path="/farmer-help-desk" element={<FarmerHelpDesk />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
