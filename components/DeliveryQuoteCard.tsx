import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Truck, Clock, DollarSign, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface DeliveryQuote {
  id: string;
  serviceId: string;
  serviceName: string;
  price: string;
  etaHours: string;
  distanceKm: string;
  dropoffSuburb: string;
  dropoffPostcode: string;
  listingId: string;
}

interface DeliveryQuoteCardProps {
  listingId: string;
  onQuoteSelected?: (quoteId: string) => void;
}

export default function DeliveryQuoteCard({ listingId, onQuoteSelected }: DeliveryQuoteCardProps) {
  const [dropoffSuburb, setDropoffSuburb] = useState("");
  const [dropoffPostcode, setDropoffPostcode] = useState("");
  const [quotes, setQuotes] = useState<DeliveryQuote[]>([]);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGetQuotes = async () => {
    if (!dropoffSuburb.trim() || !dropoffPostcode.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter both suburb and postcode",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/delivery/quote", {
        listingId,
        dropoffSuburb: dropoffSuburb.trim(),
        dropoffPostcode: dropoffPostcode.trim(),
      });
      const data = await response.json();
      setQuotes(data);
      setSelectedQuoteId(null);
    } catch (error: any) {
      toast({
        title: "Failed to get quotes",
        description: error.message || "Could not generate delivery quotes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectQuote = (quote: DeliveryQuote) => {
    setSelectedQuoteId(quote.id);
    if (onQuoteSelected) {
      onQuoteSelected(quote.id);
    }
    toast({
      title: "Delivery option selected",
      description: `${quote.serviceName} - $${parseFloat(quote.price).toFixed(2)} AUD`,
    });
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(parseFloat(amount));
  };

  const formatEta = (hours: string) => {
    const hoursNum = parseFloat(hours);
    if (hoursNum < 24) {
      return `${hoursNum.toFixed(1)} hours`;
    }
    const days = Math.ceil(hoursNum / 24);
    return `${days} day${days > 1 ? 's' : ''}`;
  };

  return (
    <Card data-testid="card-delivery-quote">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Delivery Quotes
        </CardTitle>
        <CardDescription>
          Get instant delivery quotes to your location
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dropoff-suburb">Dropoff Suburb</Label>
            <Input
              id="dropoff-suburb"
              type="text"
              placeholder="e.g., Parramatta"
              value={dropoffSuburb}
              onChange={(e) => setDropoffSuburb(e.target.value)}
              disabled={isLoading}
              data-testid="input-dropoff-suburb"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dropoff-postcode">Postcode</Label>
            <Input
              id="dropoff-postcode"
              type="text"
              placeholder="e.g., 2150"
              value={dropoffPostcode}
              onChange={(e) => setDropoffPostcode(e.target.value)}
              disabled={isLoading}
              data-testid="input-dropoff-postcode"
            />
          </div>
        </div>

        <Button
          onClick={handleGetQuotes}
          disabled={isLoading}
          className="w-full"
          data-testid="button-get-quotes"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Quotes...
            </>
          ) : (
            "Get Delivery Quote"
          )}
        </Button>

        {quotes.length > 0 && (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Distance: {parseFloat(quotes[0].distanceKm).toFixed(1)} km
            </div>
            <div className="grid gap-4">
              {quotes.map((quote) => (
                <Card
                  key={quote.id}
                  className={`transition-all ${
                    selectedQuoteId === quote.id
                      ? "ring-2 ring-primary"
                      : ""
                  }`}
                  data-testid={`card-quote-${quote.serviceId}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">{quote.serviceName}</h4>
                      {selectedQuoteId === quote.id && (
                        <Check className="h-5 w-5 text-primary" data-testid="icon-selected" />
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-lg">
                          {formatCurrency(quote.price)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          ETA: {formatEta(quote.etaHours)}
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleSelectQuote(quote)}
                      variant={selectedQuoteId === quote.id ? "default" : "outline"}
                      className="w-full"
                      data-testid={`button-select-${quote.serviceId}`}
                    >
                      {selectedQuoteId === quote.id ? "Selected" : "Select Delivery Option"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
