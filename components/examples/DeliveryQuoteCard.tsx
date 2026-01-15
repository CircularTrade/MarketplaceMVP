import { useState } from 'react';
import DeliveryQuoteCard from '../DeliveryQuoteCard';

export default function DeliveryQuoteCardExample() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DeliveryQuoteCard
          provider="QuickVan"
          vehicleType="Small van"
          basePrice={50}
          pricePerKm={1.2}
          distance={15}
          etaWindow="2-4 hours"
          selected={selected === 'quickvan'}
          onSelect={() => setSelected('quickvan')}
        />
        <DeliveryQuoteCard
          provider="Metro3T"
          vehicleType="3T truck"
          basePrice={90}
          pricePerKm={2.0}
          distance={15}
          etaWindow="4-6 hours"
          selected={selected === 'metro3t'}
          onSelect={() => setSelected('metro3t')}
        />
        <DeliveryQuoteCard
          provider="Bulk6T"
          vehicleType="6T truck"
          basePrice={150}
          pricePerKm={2.8}
          distance={15}
          etaWindow="Next day"
          selected={selected === 'bulk6t'}
          onSelect={() => setSelected('bulk6t')}
        />
      </div>
    </div>
  );
}
