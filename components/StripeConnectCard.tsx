import { AlertCircle, CheckCircle2, CreditCard } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface StripeConnectCardProps {
  isConnected: boolean;
  accountStatus?: "active" | "pending" | "restricted";
  earnings?: number;
  onConnect?: () => void;
}

export default function StripeConnectCard({
  isConnected = false,
  accountStatus = "active",
  earnings = 0,
  onConnect,
}: StripeConnectCardProps) {
  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Connect Payouts
          </CardTitle>
          <CardDescription>
            Set up your payout account to receive payments from buyers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Action Required</AlertTitle>
            <AlertDescription>
              You need to connect a Stripe account to receive payments for your listings.
              This is required before buyers can complete checkout.
            </AlertDescription>
          </Alert>

          <Button 
            onClick={() => {
              console.log("Connecting Stripe account...");
              onConnect?.();
            }}
            className="w-full"
            data-testid="button-connect-stripe"
          >
            Connect with Stripe
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Powered by Stripe • Secure & encrypted
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          Payout Account Connected
        </CardTitle>
        <CardDescription>
          Your Stripe account is {accountStatus}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Earnings</p>
            <p className="text-2xl font-bold" data-testid="text-earnings">
              ${earnings.toLocaleString()}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Available Balance</p>
            <p className="text-2xl font-bold">
              ${(earnings * 0.92).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => console.log("View Stripe dashboard")}
            data-testid="button-view-dashboard"
          >
            View Dashboard
          </Button>
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => console.log("Manage account")}
            data-testid="button-manage-account"
          >
            Manage Account
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Marketplace fee: 8% • Payouts: Weekly
        </p>
      </CardContent>
    </Card>
  );
}
