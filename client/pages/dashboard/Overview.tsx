import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Package, ShoppingCart, DollarSign, Leaf, Plus, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardSummary {
  totalListings: number;
  activeListings: number;
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  sustainability: {
    totalTonnes: number;
    totalTippingFeesSaved: number;
    totalCO2Avoided: number;
  };
}

export default function Overview() {
  const { data: summary, isLoading } = useQuery<DashboardSummary>({
    queryKey: ["/api/dashboard/summary"],
  });

  if (isLoading) {
    return (
      <div className="p-8 space-y-8">
        <div>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: "Active Listings",
      value: summary?.activeListings || 0,
      icon: Package,
      description: `${summary?.totalListings || 0} total`,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Total Orders",
      value: summary?.totalOrders || 0,
      icon: ShoppingCart,
      description: `${summary?.paidOrders || 0} paid`,
      color: "text-green-600 dark:text-green-400",
    },
    {
      title: "Pending Orders",
      value: summary?.pendingOrders || 0,
      icon: DollarSign,
      description: "Awaiting payment",
      color: "text-amber-600 dark:text-amber-400",
    },
    {
      title: "Material Diverted",
      value: `${summary?.sustainability.totalTonnes.toFixed(1) || 0}t`,
      icon: Leaf,
      description: "From landfill",
      color: "text-emerald-600 dark:text-emerald-400",
    },
  ];

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2" data-testid="heading-overview">
          Dashboard Overview
        </h1>
        <p className="text-muted-foreground">
          Welcome back! Here's a summary of your seller activity.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid={`stat-${stat.title.toLowerCase().replace(" ", "-")}`}>
                  {stat.value}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full justify-start" data-testid="button-create-listing">
              <Link href="/new">
                <Plus className="h-4 w-4 mr-2" />
                Create New Listing
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start" data-testid="button-view-listings">
              <Link href="/dashboard/listings">
                <Eye className="h-4 w-4 mr-2" />
                View My Listings
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start" data-testid="button-view-orders">
              <Link href="/dashboard/orders">
                <ShoppingCart className="h-4 w-4 mr-2" />
                View Orders
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sustainability Impact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-muted-foreground">Tonnes Diverted</span>
                <span className="text-lg font-semibold" data-testid="text-tonnes-diverted">
                  {summary?.sustainability.totalTonnes.toFixed(2) || 0}t
                </span>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-muted-foreground">Tipping Fees Saved</span>
                <span className="text-lg font-semibold text-green-600 dark:text-green-400" data-testid="text-fees-saved">
                  ${summary?.sustainability.totalTippingFeesSaved.toFixed(0) || 0}
                </span>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-muted-foreground">CO₂ Avoided</span>
                <span className="text-lg font-semibold text-emerald-600 dark:text-emerald-400" data-testid="text-co2-avoided">
                  {summary?.sustainability.totalCO2Avoided.toFixed(2) || 0} tCO₂e
                </span>
              </div>
            </div>
            <Link href="/dashboard/sustainability" className="text-sm text-primary hover:underline block text-center mt-2" data-testid="link-sustainability">
              View Detailed Metrics →
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
