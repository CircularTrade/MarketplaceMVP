import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import FilterBar from "@/components/FilterBar";
import ListingCard from "@/components/ListingCard";
import ThemeToggle from "@/components/ThemeToggle";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Listing } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { formatDistance } from "date-fns";

export default function Home() {
  const { data: listings, isLoading, error } = useQuery<Listing[]>({
    queryKey: ["/api/listings"],
  });

  const formatListingForCard = (listing: Listing) => {
    const deadline = new Date(listing.pickupDeadline);
    const now = new Date();
    const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      id: listing.id,
      title: listing.title,
      price: parseFloat(listing.price),
      image: listing.imageUrls[0] || "https://via.placeholder.com/400",
      location: listing.location,
      pickupDeadline: formatDistance(deadline, now, { addSuffix: true }),
      condition: listing.condition as "New" | "Like New" | "Good" | "Fair",
      materialType: listing.materialType,
      quantity: listing.quantity,
      sellerName: "Seller",
      sellerRating: 4.5,
      urgent: daysUntil <= 7,
    };
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      <Header />
      
      <HeroSection />
      
      <FilterBar />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive mb-2">Failed to load listings</p>
            <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
          </div>
        ) : listings && listings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <Link key={listing.id} href={`/listing/${listing.id}`}>
                <ListingCard {...formatListingForCard(listing)} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No listings available yet</p>
          </div>
        )}
      </main>
    </div>
  );
}
