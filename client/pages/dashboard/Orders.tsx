import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { format } from "date-fns";
import { ExternalLink, Package, TruckIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import type { Order, Listing, DeliveryQuote, User } from "@shared/schema";

interface OrderWithDetails extends Order {
  listing?: Listing;
  deliveryQuote?: DeliveryQuote;
  seller?: User;
  buyer?: User;
}

export default function Orders() {
  const [role, setRole] = useState<"seller" | "buyer">("seller");

  const { data: orders, isLoading } = useQuery<OrderWithDetails[]>({
    queryKey: ["/api/dashboard/orders", { role }],
    queryFn: async ({ queryKey }) => {
      const [url, params] = queryKey as [string, { role: string }];
      const response = await fetch(`${url}?role=${params.role}`);
      if (!response.ok) throw new Error("Failed to fetch orders");
      return response.json();
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "default";
      case "RESERVED":
        return "secondary";
      default:
        return "outline";
    }
  };

  const renderOrderCard = (order: OrderWithDetails) => {
    const counterparty = role === "seller" ? order.buyer : order.seller;
    
    return (
      <Card key={order.id} className="hover-elevate" data-testid={`order-card-${order.id}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base line-clamp-1" data-testid={`order-title-${order.id}`}>
                {order.listing?.title || "Unknown Listing"}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {role === "seller" ? "Buyer" : "Seller"}: {counterparty?.name || "Unknown"}
              </p>
            </div>
            <Badge variant={getStatusColor(order.status)} data-testid={`order-status-${order.id}`}>
              {order.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Package className="h-4 w-4" />
              <span>{order.listing?.materialType}</span>
            </div>
            {order.deliveryQuote && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <TruckIcon className="h-4 w-4" />
                <span>{order.deliveryQuote.serviceName}</span>
              </div>
            )}
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total Amount</p>
              <p className="text-2xl font-bold" data-testid={`order-total-${order.id}`}>
                ${parseFloat(order.totalAmount.toString()).toFixed(2)}
              </p>
            </div>
            {order.paidAt && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Paid</p>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  {format(new Date(order.paidAt), "MMM d, yyyy")}
                </p>
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Created {format(new Date(order.createdAt), "MMM d, yyyy")}
          </p>

          <Button asChild variant="outline" size="sm" className="w-full" data-testid={`button-view-order-${order.id}`}>
            <Link href={`/dashboard/orders/${order.id}`}>
              View Details
              <ExternalLink className="h-3 w-3 ml-2" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2" data-testid="heading-orders">
          Orders
        </h1>
        <p className="text-muted-foreground">
          View and manage your orders
        </p>
      </div>

      <Tabs value={role} onValueChange={(v) => setRole(v as "seller" | "buyer")}>
        <TabsList>
          <TabsTrigger value="seller" data-testid="tab-as-seller">
            As Seller
          </TabsTrigger>
          <TabsTrigger value="buyer" data-testid="tab-as-buyer">
            As Buyer
          </TabsTrigger>
        </TabsList>

        <TabsContent value={role} className="mt-6">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          ) : !orders || orders.length === 0 ? (
            <Card className="p-12 text-center">
              <CardContent>
                <p className="text-muted-foreground">
                  No orders found {role === "seller" ? "as seller" : "as buyer"}.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {orders.map(renderOrderCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
