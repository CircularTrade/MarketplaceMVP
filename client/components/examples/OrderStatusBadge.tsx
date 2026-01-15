import OrderStatusBadge from '../OrderStatusBadge';

export default function OrderStatusBadgeExample() {
  return (
    <div className="p-8 flex flex-wrap gap-4">
      <OrderStatusBadge status="RESERVED" />
      <OrderStatusBadge status="PAID" />
      <OrderStatusBadge status="IN_TRANSIT" />
      <OrderStatusBadge status="COMPLETED" />
      <OrderStatusBadge status="CANCELLED" />
    </div>
  );
}
