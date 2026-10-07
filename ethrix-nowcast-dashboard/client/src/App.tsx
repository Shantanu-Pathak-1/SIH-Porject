// GeoAlert-NER style: editorial climate-tech command surface with forest-green calm, ochre signal accents, and serif-led narrative hierarchy.
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import MapViewPage from "./pages/MapViewPage";
import HistoryPage from "./pages/HistoryPage";
import BroadcastsPage from "./pages/BroadcastsPage";
import AdminControlPage from "./pages/AdminControlPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={LoginPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/admin" component={AdminControlPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/map" component={MapViewPage} />
      <Route path="/history" component={HistoryPage} />
      <Route path="/broadcasts" component={BroadcastsPage} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable={false}>
        <TooltipProvider>
          <Toaster position="bottom-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
