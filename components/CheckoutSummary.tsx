import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface CheckoutSummaryProps {
  itemPrice: number;
  deliveryFee: number;
  marketplaceFeePercent?: number;
}

export default function CheckoutSummary({
  itemPrice,
  deliveryFee,
  marketplaceFeePercent = 8,
}: CheckoutSummaryProps) {
  const marketplaceFee = (itemPrice * marketplaceFeePercent) / 100;
  const total = itemPrice + deliveryFee + marketplaceFee;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Item price</span>
            <span className="font-medium" data-testid="text-item-price">
              ${itemPrice.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Delivery fee</span>
            <span className="font-medium" data-testid="text-delivery-fee">
              ${deliveryFee.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Marketplace fee ({marketplaceFeePercent}%)
            </span>
            <span className="font-medium" data-testid="text-marketplace-fee">
              ${marketplaceFee.toFixed(2)}
            </span>
          </div>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <span className="font-semibold text-lg">Total</span>
          <span className="text-2xl font-bold text-primary" data-testid="text-total">
            ${total.toFixed(2)}
          </span>
        </div>

        <div className="bg-muted rounded-lg p-3 text-xs text-muted-foreground space-y-1">
          <p>• Seller receives: ${(itemPrice - marketplaceFee).toFixed(2)}</p>
          <p>• Secure payment via Stripe</p>
          <p>• Funds released after successful delivery</p>
        </div>
      </CardContent>
    </Card>
  );
}
