import ImageCarousel from '../ImageCarousel';
import steelImage from '@assets/generated_images/Steel_beams_product_photo_ca0784eb.png';
import timberImage from '@assets/generated_images/Reclaimed_timber_planks_3e3d3b19.png';
import concreteImage from '@assets/generated_images/Concrete_blocks_stack_11fecc0a.png';
import copperImage from '@assets/generated_images/Copper_pipes_bundle_5de28b89.png';
import scaffoldingImage from '@assets/generated_images/Scaffolding_components_f361f552.png';

export default function ImageCarouselExample() {
  const images = [steelImage, timberImage, concreteImage, copperImage, scaffoldingImage];

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <ImageCarousel images={images} alt="Construction materials" />
    </div>
  );
}
