
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import ScrollToTop from "./components/ScrollToTop";
import Index from "./pages/Index";
import SoilAnalyzer from "./pages/SoilAnalyzer";
import Recommendations from "./pages/Recommendations";
import SoilHealth from "./pages/SoilHealth";
import OrganicFarming from "./pages/OrganicFarming";
import FarmerHelpDesk from "./pages/FarmerHelpDesk";
import CropDiseaseIdentifier from "./pages/CropDiseaseIdentifier";
import WeatherAlerts from "./pages/WeatherAlerts";
import CropGrowthMonitor from "./pages/CropGrowthMonitor";
import MarketPrices from "./pages/MarketPrices";
import IrrigationScheduler from "./pages/IrrigationScheduler";
import FarmingCalendar from "./pages/FarmingCalendar";
import FertilizerCostCalculator from "./pages/FertilizerCostCalculator";
import SoilHealthPrediction from "./pages/SoilHealthPrediction";
import FarmerCommunity from "./pages/FarmerCommunity";
import ExpertConsultation from "./pages/ExpertConsultation";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/soil-analyzer" element={<SoilAnalyzer />} />
            <Route path="/recommendations" element={<Recommendations />} />
            <Route path="/soil-health" element={<SoilHealth />} />
            <Route path="/organic-farming" element={<OrganicFarming />} />
            <Route path="/farmer-help-desk" element={<FarmerHelpDesk />} />
            <Route path="/crop-disease" element={<CropDiseaseIdentifier />} />
            <Route path="/weather-alerts" element={<WeatherAlerts />} />
            <Route path="/crop-growth" element={<CropGrowthMonitor />} />
            <Route path="/market-prices" element={<MarketPrices />} />
            <Route path="/irrigation-scheduler" element={<IrrigationScheduler />} />
            <Route path="/farming-calendar" element={<FarmingCalendar />} />
            <Route path="/fertilizer-cost" element={<FertilizerCostCalculator />} />
            <Route path="/soil-health-prediction" element={<SoilHealthPrediction />} />
            <Route path="/farmer-community" element={<FarmerCommunity />} />
            <Route path="/expert-consultation" element={<ExpertConsultation />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
