import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import ListingDetail from "@/pages/ListingDetail";
import DashboardLayout from "@/components/DashboardLayout";
import Overview from "@/pages/dashboard/Overview";
import MyListings from "@/pages/dashboard/MyListings";
import Orders from "@/pages/dashboard/Orders";
import Sustainability from "@/pages/dashboard/Sustainability";
import Settings from "@/pages/dashboard/Settings";
import Checkout from "@/pages/Checkout";
import OrderComplete from "@/pages/OrderComplete";
import NewListing from "@/pages/NewListing";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import MapPage from "@/pages/Map";
import MessageInbox from "@/pages/MessageInbox";
import MessageThread from "@/pages/MessageThread";
import NotFound from "@/pages/not-found";

// Wrapper components for dashboard pages
const DashboardOverview = () => <DashboardLayout><Overview /></DashboardLayout>;
const DashboardListings = () => <DashboardLayout><MyListings /></DashboardLayout>;
const DashboardOrders = () => <DashboardLayout><Orders /></DashboardLayout>;
const DashboardSustainability = () => <DashboardLayout><Sustainability /></DashboardLayout>;
const DashboardSettings = () => <DashboardLayout><Settings /></DashboardLayout>;

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/map" component={MapPage} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/listing/:id" component={ListingDetail} />
      <Route path="/dashboard" component={DashboardOverview} />
      <Route path="/dashboard/listings" component={DashboardListings} />
      <Route path="/dashboard/orders" component={DashboardOrders} />
      <Route path="/dashboard/sustainability" component={DashboardSustainability} />
      <Route path="/dashboard/settings" component={DashboardSettings} />
      <Route path="/checkout/:id" component={Checkout} />
      <Route path="/order/:id/complete" component={OrderComplete} />
      <Route path="/new" component={NewListing} />
      <Route path="/messages/:threadId" component={MessageThread} />
      <Route path="/messages" component={MessageInbox} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
