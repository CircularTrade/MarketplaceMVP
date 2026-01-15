import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { MapPin, Calendar, Package, Ruler, Star, Shield, Truck, Loader2, MessageCircle } from "lucide-react";
import Header from "@/components/Header";
import ThemeToggle from "@/components/ThemeToggle";
import ImageCarousel from "@/components/ImageCarousel";
import DeliveryQuoteCard from "@/components/DeliveryQuoteCard";
import ReviewCard from "@/components/ReviewCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Listing } from "@shared/schema";
import { format, formatDistance } from "date-fns";

export default function ListingDetail() {
  const [, params] = useRoute("/listing/:id");
  const [, setLocation] = useLocation();
  const [selectedDeliveryQuoteId, setSelectedDeliveryQuoteId] = useState<string | null>(null);
  const { user } = useUser();
  const { toast } = useToast();

  const { data: listing, isLoading, error } = useQuery<Listing>({
    queryKey: ["/api/listings", params?.id],
  });

  const messageSellerMutation = useMutation({
    mutationFn: async (listingId: string) => {
      const res = await apiRequest("POST", "/api/messages/start", { listingId });
      return await res.json();
    },
    onSuccess: (thread) => {
      setLocation(`/messages/${thread.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to start conversation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleMessageSeller = () => {
    if (!user) {
      setLocation("/login");
      return;
    }
    
    if (!params?.id) return;
    
    messageSellerMutation.mutate(params.id);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        <Header />
        <div className="flex justify-center items-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        <Header />
        <div className="flex flex-col justify-center items-center py-24">
          <p className="text-destructive mb-2">Failed to load listing</p>
          <p className="text-sm text-muted-foreground mb-4">{(error as Error).message}</p>
          <Button onClick={() => setLocation("/")} className="mt-4">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-background">
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        <Header />
        <div className="flex flex-col justify-center items-center py-24">
          <p className="text-muted-foreground">Listing not found</p>
          <Button onClick={() => setLocation("/")} className="mt-4">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const images = listing.imageUrls.length > 0 ? listing.imageUrls : ["https://via.placeholder.com/800"];
  const deadline = new Date(listing.pickupDeadline);
  const now = new Date();
  const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isUrgent = daysUntil <= 7;

  const specs = [
    { label: "Material Type", value: listing.materialType },
    { label: "Dimensions", value: listing.dimensions || "Not specified" },
    { label: "Condition", value: listing.condition },
    { label: "Quantity", value: `${listing.quantity} units` },
    { label: "Forklift Available", value: listing.forkliftAvailable ? "Yes" : "No" },
    { label: "Status", value: listing.status },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <ImageCarousel images={images} alt={listing.title} />

            <div>
              <h1 className="text-3xl font-bold mb-4" data-testid="text-listing-title">
                {listing.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 mb-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-5 w-5" />
                  <span>{listing.location}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-5 w-5" />
                  <span>Pickup by {format(deadline, "MMM d, yyyy")}</span>
                </div>
                {isUrgent && (
                  <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">
                    Urgent - {daysUntil} {daysUntil === 1 ? "day" : "days"} left
                  </Badge>
                )}
              </div>

              <Tabs defaultValue="description" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="description" data-testid="tab-description">Description</TabsTrigger>
                  <TabsTrigger value="specifications" data-testid="tab-specifications">Specifications</TabsTrigger>
                </TabsList>

                <TabsContent value="description" className="space-y-4 mt-6">
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {listing.description}
                  </p>
                </TabsContent>

                <TabsContent value="specifications" className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {specs.map((spec, index) => (
                      <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-muted">
                        <span className="text-sm font-medium">{spec.label}</span>
                        <span className="text-sm text-muted-foreground">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <div className="text-3xl font-bold mb-1" data-testid="text-price">
                      ${parseFloat(listing.price).toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">per unit</div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {listing.quantity} units available
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Pickup: {formatDistance(deadline, now, { addSuffix: true })}
                      </span>
                    </div>
                  </div>


                  {user && listing.sellerId === user.id ? null : (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleMessageSeller}
                      disabled={messageSellerMutation.isPending}
                      data-testid="button-message-seller"
                    >
                      {messageSellerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Starting chat...
                        </>
                      ) : (
                        <>
                          <MessageCircle className="mr-2 h-4 w-4" />
                          Message Seller
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <DeliveryQuoteCard 
              listingId={params?.id!} 
              onQuoteSelected={(quoteId) => setSelectedDeliveryQuoteId(quoteId)}
            />

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Seller Information</h3>
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src="" />
                    <AvatarFallback>S</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium">Seller</div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>4.5 rating</span>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        <span>Verified seller</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        <span>Member since {format(new Date(listing.createdAt), "MMM yyyy")}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
