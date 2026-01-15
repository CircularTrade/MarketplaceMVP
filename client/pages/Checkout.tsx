import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { CreditCard, Lock, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import Header from "@/components/Header";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

function CheckoutForm({ orderId, orderData }: { orderId: string; orderData: any }) {
  const stripe = useStripe();
  const elements = useElements();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/order/${orderId}/complete`,
        },
      });

      if (error) {
        toast({
          title: "Payment failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Payment error",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!orderData) {
    return null;
  }

  const itemPrice = parseFloat(orderData.itemPrice);
  const deliveryFee = parseFloat(orderData.deliveryFee);
  const marketplaceFee = parseFloat(orderData.marketplaceFee);
  const totalAmount = parseFloat(orderData.totalAmount);

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                {orderData.listing?.imageUrls?.[0] && (
                  <img
                    src={orderData.listing.imageUrls[0]}
                    alt={orderData.listing.title}
                    className="w-24 h-24 rounded object-cover bg-muted"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{orderData.listing?.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {orderData.listing?.location}
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <span>Quantity: {orderData.listing?.quantity} unit</span>
                    <span className="font-semibold">${itemPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {orderData.deliveryQuote && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Delivery Details</h4>
                    <div className="bg-muted rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{orderData.deliveryQuote.serviceName}</span>
                        <span className="font-semibold">${deliveryFee.toFixed(2)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        ETA: {parseFloat(orderData.deliveryQuote.etaHours).toFixed(0)} hours
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Distance: {parseFloat(orderData.deliveryQuote.distanceKm).toFixed(1)} km
                      </p>
                      <p className="text-sm text-muted-foreground">
                        To: {orderData.deliveryQuote.dropoffSuburb}, {orderData.deliveryQuote.dropoffPostcode}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <PaymentElement />

              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted rounded-lg p-3">
                <Lock className="h-4 w-4" />
                <span>Your payment information is secure and encrypted</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Material price</span>
                <span className="font-medium">${itemPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery fee</span>
                <span className="font-medium">${deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Platform fee (8%)</span>
                <span className="font-medium">${marketplaceFee.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-lg">${totalAmount.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <Button 
            type="submit"
            className="w-full" 
            size="lg" 
            disabled={!stripe || isProcessing}
            data-testid="button-complete-payment"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Pay $${totalAmount.toFixed(2)}`
            )}
          </Button>

          <div className="text-center text-xs text-muted-foreground space-y-1">
            <p>By completing this purchase, you agree to our</p>
            <p>Terms of Service and Privacy Policy</p>
          </div>
        </div>
      </div>
    </form>
  );
}

export default function Checkout() {
  const [, params] = useRoute("/checkout/:id");
  const orderId = params?.id;
  const [stripePromise, setStripePromise] = useState<any>(null);
  const [clientSecret, setClientSecret] = useState<string>("");
  const { toast } = useToast();

  const { data: publishableKeyData } = useQuery({
    queryKey: ['/api/stripe/publishable-key'],
    enabled: !stripePromise,
  });

  const { data: orderData, isLoading: orderLoading } = useQuery({
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

  const createPaymentIntentMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await apiRequest('POST', '/api/checkout/create', { orderId });
      return await response.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to initialize payment",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (publishableKeyData?.publishableKey && !stripePromise) {
      setStripePromise(loadStripe(publishableKeyData.publishableKey));
    }
  }, [publishableKeyData, stripePromise]);

  useEffect(() => {
    if (orderId && orderData && !clientSecret && !createPaymentIntentMutation.isPending) {
      createPaymentIntentMutation.mutate(orderId);
    }
  }, [orderId, orderData, clientSecret]);

  if (!orderId) {
    return <div>Invalid order</div>;
  }

  if (orderLoading || !orderData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Badge variant="outline" className="text-muted-foreground">1. Cart</Badge>
            <div className="h-px flex-1 bg-border" />
            <Badge>2. Payment</Badge>
            <div className="h-px flex-1 bg-border" />
            <Badge variant="outline" className="text-muted-foreground">3. Confirmation</Badge>
          </div>
          <h1 className="text-3xl font-bold">Checkout</h1>
        </div>

        {!clientSecret || !stripePromise ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm orderId={orderId} orderData={orderData} />
          </Elements>
        )}
      </main>
    </div>
  );
}
