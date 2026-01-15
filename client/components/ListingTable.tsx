import { Eye, Edit, Trash2, MoreVertical } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Listing {
  id: string;
  title: string;
  thumbnail: string;
  price: number;
  views: number;
  status: "active" | "sold" | "expired";
}

interface ListingTableProps {
  listings: Listing[];
}

export default function ListingTable({ listings }: ListingTableProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500/10 text-green-700 dark:text-green-400";
      case "sold": return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
      case "expired": return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
      default: return "";
    }
  };

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Listing</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Views</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {listings.map((listing) => (
            <TableRow key={listing.id} data-testid={`row-listing-${listing.id}`}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <img
                    src={listing.thumbnail}
                    alt={listing.title}
                    className="w-12 h-12 rounded object-cover bg-muted"
                  />
                  <div>
                    <p className="font-medium line-clamp-1">{listing.title}</p>
                    <p className="text-sm text-muted-foreground">#{listing.id}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="font-semibold">${listing.price.toLocaleString()}</TableCell>
              <TableCell className="text-muted-foreground">{listing.views} views</TableCell>
              <TableCell>
                <Badge className={getStatusColor(listing.status)}>
                  {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => console.log("View listing", listing.id)}
                    data-testid={`button-view-${listing.id}`}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        data-testid={`button-more-${listing.id}`}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => console.log("Edit", listing.id)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => console.log("Delete", listing.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
