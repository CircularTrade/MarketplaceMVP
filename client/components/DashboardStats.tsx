import { Package, ShoppingCart, DollarSign, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
}

function StatCard({ title, value, icon: Icon, trend }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" data-testid={`stat-${title.toLowerCase().replace(/\s+/g, '-')}`}>
          {value}
        </div>
        {trend && (
          <p className="text-xs text-muted-foreground mt-1">{trend}</p>
        )}
      </CardContent>
    </Card>
  );
}

interface DashboardStatsProps {
  userType: "seller" | "buyer";
}

export default function DashboardStats({ userType }: DashboardStatsProps) {
  if (userType === "seller") {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Listings"
          value="12"
          icon={Package}
          trend="+2 this week"
        />
        <StatCard
          title="Total Sales"
          value="48"
          icon={ShoppingCart}
          trend="+8 this month"
        />
        <StatCard
          title="Revenue"
          value="$24,500"
          icon={DollarSign}
          trend="+12% from last month"
        />
        <StatCard
          title="Average Rating"
          value="4.8"
          icon={Star}
          trend="Based on 42 reviews"
        />
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Active Orders"
        value="3"
        icon={ShoppingCart}
        trend="2 in transit"
      />
      <StatCard
        title="Completed"
        value="15"
        icon={Package}
        trend="All time"
      />
      <StatCard
        title="Total Spent"
        value="$8,750"
        icon={DollarSign}
        trend="This year"
      />
      <StatCard
        title="Saved"
        value="$1,200"
        icon={Star}
        trend="vs. retail prices"
      />
    </div>
  );
}
