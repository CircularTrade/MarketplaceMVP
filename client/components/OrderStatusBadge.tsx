import { Badge } from "@/components/ui/badge";
import { Clock, CreditCard, Truck, CheckCircle2, XCircle } from "lucide-react";

type OrderStatus = "RESERVED" | "PAID" | "IN_TRANSIT" | "COMPLETED" | "CANCELLED";

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

export default function OrderStatusBadge({ status, className = "" }: OrderStatusBadgeProps) {
  const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
      case "RESERVED":
        return {
          label: "Reserved",
          icon: Clock,
          className: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
        };
      case "PAID":
        return {
          label: "Paid",
          icon: CreditCard,
          className: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
        };
      case "IN_TRANSIT":
        return {
          label: "In Transit",
          icon: Truck,
          className: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
        };
      case "COMPLETED":
        return {
          label: "Completed",
          icon: CheckCircle2,
          className: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
        };
      case "CANCELLED":
        return {
          label: "Cancelled",
          icon: XCircle,
          className: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <Badge className={`gap-1.5 ${config.className} ${className}`} data-testid={`badge-status-${status.toLowerCase()}`}>
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </Badge>
  );
}
