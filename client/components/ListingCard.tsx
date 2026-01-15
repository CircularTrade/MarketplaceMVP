import { MapPin, Calendar, Star, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ListingCardProps {
  id: string;
  title: string;
  price: number;
  image: string;
  location: string;
  pickupDeadline: string;
  condition: "New" | "Like New" | "Good" | "Fair";
  materialType: string;
  quantity: number;
  sellerName: string;
  sellerRating: number;
  sellerAvatar?: string;
  urgent?: boolean;
}

export default function ListingCard({
  id,
  title,
  price,
  image,
  location,
  pickupDeadline,
  condition,
  materialType,
  quantity,
  sellerName,
  sellerRating,
  sellerAvatar,
  urgent = false,
}: ListingCardProps) {
  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "New": return "bg-green-500/10 text-green-700 dark:text-green-400";
      case "Like New": return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
      case "Good": return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
      case "Fair": return "bg-orange-500/10 text-orange-700 dark:text-orange-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Card 
      className="overflow-hidden hover-elevate active-elevate-2 transition-all cursor-pointer group h-full flex flex-col"
      data-testid={`card-listing-${id}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={image}
          alt={title}
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
        />
        <Badge 
          className={`absolute top-3 right-3 ${getConditionColor(condition)}`}
          data-testid={`badge-condition-${id}`}
        >
          {condition}
        </Badge>
        {urgent && (
          <Badge className="absolute top-3 left-3 bg-destructive text-destructive-foreground">
            Urgent
          </Badge>
        )}
      </div>

      <CardContent className="p-4 flex-1 flex flex-col">
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-2 line-clamp-2" data-testid={`text-title-${id}`}>
            {title}
          </h3>

          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-2xl font-bold text-primary" data-testid={`text-price-${id}`}>
              ${price.toLocaleString()}
            </span>
            <span className="text-sm text-muted-foreground">
              {quantity} units
            </span>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{location}</span>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span>Pickup by {pickupDeadline}</span>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <Package className="h-4 w-4 flex-shrink-0" />
              <span>{materialType}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4 pt-4 border-t">
          <Avatar className="h-6 w-6">
            <AvatarImage src={sellerAvatar} />
            <AvatarFallback className="text-xs">{sellerName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium flex-1 truncate">{sellerName}</span>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{sellerRating.toFixed(1)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
