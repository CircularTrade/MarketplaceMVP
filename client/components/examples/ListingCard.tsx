import ListingCard from '../ListingCard';
import steelImage from '@assets/generated_images/Steel_beams_product_photo_ca0784eb.png';

export default function ListingCardExample() {
  return (
    <div className="p-8 max-w-sm">
      <ListingCard
        id="1"
        title="Premium Steel I-Beams - Industrial Grade"
        price={850}
        image={steelImage}
        location="Sydney, NSW 2000"
        pickupDeadline="Dec 15"
        condition="Like New"
        materialType="Steel & Metal"
        quantity={50}
        sellerName="BuildCo Supplies"
        sellerRating={4.8}
        urgent={true}
      />
    </div>
  );
}
