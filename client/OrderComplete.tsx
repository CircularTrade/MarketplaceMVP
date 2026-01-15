import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Package, Truck, MapPin, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function OrderComplete() {
  const [, params] = useRoute("/order/:id/complete");
  const orderId = params?.id;

  const { data: orderData, isLoading } = useQuery({
    queryKey: ['/api/orders', orderId],
    queryFn: async () => {
      const response = await fetch(`/api/orders/${orderId}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch order');
      }
      return response.json();
    },
    enabled: !!orderId,
  });

  if (isLoading || !orderData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const itemPrice = parseFloat(orderData.itemPrice);
  const deliveryFee = parseFloat(orderData.deliveryFee);
  const marketplaceFee = parseFloat(orderData.marketplaceFee);
  const totalAmount = parseFloat(orderData.totalAmount);

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Badge variant="outline" className="text-muted-foreground">1. Cart</Badge>
            <div className="h-px flex-1 bg-border" />
            <Badge variant="outline" className="text-muted-foreground">2. Payment</Badge>
            <div className="h-px flex-1 bg-border" />
            <Badge>3. Confirmation</Badge>
          </div>
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 mb-4">
            <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
          <p className="text-muted-foreground">
            Your order has been confirmed and payment received
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
            <p className="text-sm text-muted-foreground">Order ID: {orderData.id}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              {orderData.listing?.imageUrls?.[0] && (
                <img
                  src={orderData.listing.imageUrls[0]}
                  alt={orderData.listing.title}
                  className="w-24 h-24 rounded object-cover bg-muted"
                  data-testid="img-order-listing"
                />
              )}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold mb-1" data-testid="text-listing-title">
                      {orderData.listing?.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Package className="h-4 w-4" />
                      <span>{orderData.listing?.materialType}</span>
                      <span>•</span>
                      <span>{orderData.listing?.condition}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                    Paid
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <MapPin className="h-4 w-4" />
                  <span>{orderData.listing?.location}</span>
                </div>
              </div>
            </div>

            {orderData.deliveryQuote && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Delivery Information
                  </h4>
                  <div className="bg-muted rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{orderData.deliveryQuote.serviceName}</span>
                      <span className="text-sm text-muted-foreground">
                        ETA: {parseFloat(orderData.deliveryQuote.etaHours).toFixed(0)} hours
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>
                        From: {orderData.listing?.suburb}, {orderData.listing?.postcode}
                      </p>
                      <p>
                        To: {orderData.deliveryQuote.dropoffSuburb}, {orderData.deliveryQuote.dropoffPostcode}
                      </p>
                      <p>
                        Distance: {parseFloat(orderData.deliveryQuote.distanceKm).toFixed(1)} km
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            <Separator />

            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Payment Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Material price</span>
                  <span className="font-medium">${itemPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery fee</span>
                  <span className="font-medium">${deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platform fee (8%)</span>
                  <span className="font-medium">${marketplaceFee.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-base">
                  <span className="font-semibold">Total Paid</span>
                  <span className="font-bold" data-testid="text-total-paid">
                    ${totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <h4 className="font-semibold mb-2">What happens next?</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span>•</span>
                <span>The seller has been notified of your purchase</span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span>You can track your order status in your dashboard</span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span>Delivery will be arranged according to the selected service</span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span>You'll receive notifications about order updates</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <div className="flex gap-4 mt-8 justify-center">
          <Link href="/dashboard">
            <Button variant="outline" data-testid="link-dashboard">
              View My Orders
            </Button>
          </Link>
          <Link href="/">
            <Button data-testid="link-home">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
