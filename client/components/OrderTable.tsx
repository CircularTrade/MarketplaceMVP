import { Eye, MessageSquare, Star } from "lucide-react";
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
import OrderStatusBadge from "./OrderStatusBadge";

interface Order {
  id: string;
  listingTitle: string;
  thumbnail: string;
  amount: number;
  status: "RESERVED" | "PAID" | "IN_TRANSIT" | "COMPLETED" | "CANCELLED";
  date: string;
  otherParty: string;
}

interface OrderTableProps {
  orders: Order[];
  userType: "buyer" | "seller";
}

export default function OrderTable({ orders, userType }: OrderTableProps) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>{userType === "buyer" ? "Seller" : "Buyer"}</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id} data-testid={`row-order-${order.id}`}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <img
                    src={order.thumbnail}
                    alt={order.listingTitle}
                    className="w-12 h-12 rounded object-cover bg-muted"
                  />
                  <div>
                    <p className="font-medium line-clamp-1">{order.listingTitle}</p>
                    <p className="text-sm text-muted-foreground">#{order.id}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>{order.otherParty}</TableCell>
              <TableCell className="font-semibold">${order.amount.toLocaleString()}</TableCell>
              <TableCell>
                <OrderStatusBadge status={order.status} />
              </TableCell>
              <TableCell className="text-muted-foreground">{order.date}</TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => console.log("View order", order.id)}
                    data-testid={`button-view-${order.id}`}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => console.log("Message", order.otherParty)}
                    data-testid={`button-message-${order.id}`}
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                  {order.status === "COMPLETED" && (
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => console.log("Review", order.id)}
                      data-testid={`button-review-${order.id}`}
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
