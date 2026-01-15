import OrderTable from '../OrderTable';
import steelImage from '@assets/generated_images/Steel_beams_product_photo_ca0784eb.png';
import timberImage from '@assets/generated_images/Reclaimed_timber_planks_3e3d3b19.png';

export default function OrderTableExample() {
  const mockOrders = [
    {
      id: "ORD-001",
      listingTitle: "Premium Steel I-Beams - Industrial Grade",
      thumbnail: steelImage,
      amount: 850,
      status: "IN_TRANSIT" as const,
      date: "Nov 15, 2024",
      otherParty: "BuildCo Supplies",
    },
    {
      id: "ORD-002",
      listingTitle: "Reclaimed Timber Planks",
      thumbnail: timberImage,
      amount: 450,
      status: "COMPLETED" as const,
      date: "Nov 10, 2024",
      otherParty: "Eco Materials Ltd",
    },
  ];

  return (
    <div className="p-8">
      <OrderTable orders={mockOrders} userType="buyer" />
    </div>
  );
}
