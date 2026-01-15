import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { format } from "date-fns";
import { Eye, Edit, Trash2, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Listing } from "@shared/schema";

export default function MyListings() {
  const { data: listings, isLoading } = useQuery<Listing[]>({
    queryKey: ["/api/dashboard/listings"],
  });

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2" data-testid="heading-my-listings">
            My Listings
          </h1>
          <p className="text-muted-foreground">
            Manage your construction material listings
          </p>
        </div>
        <Button asChild data-testid="button-create-listing">
          <Link href="/new">
            <Plus className="h-4 w-4 mr-2" />
            Create Listing
          </Link>
        </Button>
      </div>

      {!listings || listings.length === 0 ? (
        <Card className="p-12 text-center">
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              You haven't created any listings yet.
            </p>
            <Button asChild>
              <Link href="/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Listing
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <Card key={listing.id} className="overflow-hidden hover-elevate">
              <div className="aspect-video relative overflow-hidden bg-muted">
                {listing.imageUrls && listing.imageUrls[0] && (
                  <img
                    src={listing.imageUrls[0]}
                    alt={listing.title}
                    className="object-cover w-full h-full"
                  />
                )}
              </div>
              <CardContent className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-lg line-clamp-1" data-testid={`listing-title-${listing.id}`}>
                    {listing.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={listing.status === "active" ? "default" : "secondary"} data-testid={`listing-status-${listing.id}`}>
                      {listing.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {listing.materialType}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-2xl font-bold" data-testid={`listing-price-${listing.id}`}>
                      ${parseFloat(listing.price.toString()).toFixed(0)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {listing.suburb}, {listing.postcode}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Eye className="h-3 w-3" />
                    <span className="text-xs">{listing.views}</span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Created {format(new Date(listing.createdAt), "MMM d, yyyy")}
                </p>

                <div className="flex gap-2 pt-2">
                  <Button asChild variant="outline" size="sm" className="flex-1" data-testid={`button-edit-${listing.id}`}>
                    <Link href={`/dashboard/listings/${listing.id}/edit`}>
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="flex-1" data-testid={`button-view-${listing.id}`}>
                    <Link href={`/listing/${listing.id}`}>
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
