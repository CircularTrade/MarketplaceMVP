import ListingTable from '../ListingTable';
import steelImage from '@assets/generated_images/Steel_beams_product_photo_ca0784eb.png';
import timberImage from '@assets/generated_images/Reclaimed_timber_planks_3e3d3b19.png';
import concreteImage from '@assets/generated_images/Concrete_blocks_stack_11fecc0a.png';

export default function ListingTableExample() {
  const mockListings = [
    {
      id: "LST-001",
      title: "Premium Steel I-Beams - Industrial Grade",
      thumbnail: steelImage,
      price: 850,
      views: 142,
      status: "active" as const,
    },
    {
      id: "LST-002",
      title: "Reclaimed Timber Planks",
      thumbnail: timberImage,
      price: 450,
      views: 89,
      status: "sold" as const,
    },
    {
      id: "LST-003",
      title: "Concrete Blocks - Grey",
      thumbnail: concreteImage,
      price: 120,
      views: 34,
      status: "active" as const,
    },
  ];

  return (
    <div className="p-8">
      <ListingTable listings={mockListings} />
    </div>
  );
}
