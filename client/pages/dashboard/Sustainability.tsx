import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Leaf, DollarSign, Cloud, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface SustainabilityMetrics {
  summary: {
    totalTonnes: number;
    totalTippingFeesSaved: number;
    totalCO2Avoided: number;
  };
  byMaterial: Array<{
    materialType: string;
    tonnes: number;
    co2Avoided: number;
    orderCount: number;
  }>;
  recentOrders: Array<{
    orderId: string;
    listingTitle: string;
    materialType: string;
    tonnes: number;
    tippingFeesSaved: number;
    co2Avoided: number;
    createdAt: string;
  }>;
}

export default function Sustainability() {
  const { data: metrics, isLoading } = useQuery<SustainabilityMetrics>({
    queryKey: ["/api/dashboard/sustainability"],
  });

  if (isLoading) {
    return (
      <div className="p-8 space-y-8">
        <Skeleton className="h-10 w-96" />
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: "Material Diverted",
      value: `${metrics?.summary.totalTonnes.toFixed(2) || 0} tonnes`,
      description: "From landfill",
      icon: Leaf,
      color: "text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "Tipping Fees Saved",
      value: `$${metrics?.summary.totalTippingFeesSaved.toFixed(0) || 0}`,
      description: "Estimated savings",
      icon: DollarSign,
      color: "text-green-600 dark:text-green-400",
    },
    {
      title: "CO₂ Emissions Avoided",
      value: `${metrics?.summary.totalCO2Avoided.toFixed(2) || 0} tCO₂e`,
      description: "Carbon footprint reduction",
      icon: Cloud,
      color: "text-blue-600 dark:text-blue-400",
    },
  ];

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2" data-testid="heading-sustainability">
          Sustainability Metrics
        </h1>
        <p className="text-muted-foreground">
          Track your environmental impact through the circular economy
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
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
                <div className="text-2xl font-bold" data-testid={`metric-${stat.title.toLowerCase().replace(/ /g, "-")}`}>
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Impact by Material Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!metrics?.byMaterial || metrics.byMaterial.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No data available yet. Complete orders to see your impact!
            </p>
          ) : (
            <div className="space-y-4">
              {metrics.byMaterial.map((material) => (
                <div key={material.materialType} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{material.materialType}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {material.orderCount} {material.orderCount === 1 ? "order" : "orders"}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{material.tonnes.toFixed(2)}t</p>
                      <p className="text-xs text-muted-foreground">
                        {material.co2Avoided.toFixed(2)} tCO₂e
                      </p>
                    </div>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500"
                      style={{
                        width: `${(material.tonnes / (metrics?.summary.totalTonnes || 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Contributions</CardTitle>
        </CardHeader>
        <CardContent>
          {!metrics?.recentOrders || metrics.recentOrders.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No completed orders yet.
            </p>
          ) : (
            <div className="space-y-4">
              {metrics.recentOrders.map((order) => (
                <div
                  key={order.orderId}
                  className="flex items-start justify-between p-4 rounded-lg border"
                >
                  <div className="flex-1">
                    <h4 className="font-medium line-clamp-1">{order.listingTitle}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {order.materialType} • {format(new Date(order.createdAt), "MMM d, yyyy")}
                    </p>
                    <div className="flex gap-4 mt-2 text-sm">
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {order.tonnes.toFixed(2)}t diverted
                      </span>
                      <span className="text-green-600 dark:text-green-400">
                        ${order.tippingFeesSaved.toFixed(0)} saved
                      </span>
                      <span className="text-blue-600 dark:text-blue-400">
                        {order.co2Avoided.toFixed(2)} tCO₂e
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-emerald-100 dark:bg-emerald-900 p-3">
              <Leaf className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">
                Keep Up the Great Work!
              </h3>
              <p className="text-muted-foreground">
                You've helped keep {metrics?.summary.totalTonnes.toFixed(2) || 0} tonnes 
                of construction materials in circulation, preventing them from ending up 
                in landfills. This is a significant contribution to the circular economy!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
