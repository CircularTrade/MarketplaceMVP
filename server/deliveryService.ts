interface DeliveryQuoteParams {
  distanceKm: number;
  pickupSuburb: string;
  pickupPostcode: string;
  dropoffSuburb: string;
  dropoffPostcode: string;
}

interface DeliveryQuoteResult {
  serviceId: string;
  serviceName: string;
  price: number;
  etaHours: number;
}

async function getMockDeliveryQuotes(params: DeliveryQuoteParams): Promise<DeliveryQuoteResult[]> {
  const { distanceKm } = params;

  const quickVan = {
    serviceId: "quick_van",
    serviceName: "QuickVan (1T Van)",
    price: Math.round((50 + distanceKm * 1.20) * 100) / 100,
    etaHours: Math.max(2, Math.round((distanceKm / 20) * 10) / 10),
  };

  const metro3T = {
    serviceId: "metro_3t",
    serviceName: "Metro 3T Truck",
    price: Math.round((90 + distanceKm * 2.00) * 100) / 100,
    etaHours: Math.max(4, Math.round((distanceKm / 15) * 10) / 10),
  };

  const bulk6T = {
    serviceId: "bulk_6t",
    serviceName: "Bulk 6T Truck",
    price: Math.round((150 + distanceKm * 2.80) * 100) / 100,
    etaHours: Math.max(6, Math.round((distanceKm / 12) * 10) / 10),
  };

  return [quickVan, metro3T, bulk6T];
}

async function getRealDeliveryQuotes(params: DeliveryQuoteParams): Promise<DeliveryQuoteResult[]> {
  throw new Error("Not implemented: integrate iDlvr, Truckit, Loadshift later");
}

export async function getDeliveryQuotes(params: DeliveryQuoteParams): Promise<DeliveryQuoteResult[]> {
  const useRealAPI = process.env.USE_REAL_DELIVERY_API === "true";
  
  if (useRealAPI) {
    return await getRealDeliveryQuotes(params);
  } else {
    return await getMockDeliveryQuotes(params);
  }
}

function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const earthRadiusKm = 6371;

  const dLat = degreesToRadians(lat2 - lat1);
  const dLon = degreesToRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degreesToRadians(lat1)) *
      Math.cos(degreesToRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = earthRadiusKm * c;

  return Math.round(distance * 100) / 100;
}

export async function geocodeAddress(suburb: string, postcode: string): Promise<{ latitude: number; longitude: number } | null> {
  const mapboxToken = process.env.VITE_MAPBOX_TOKEN;
  if (!mapboxToken) {
    throw new Error("Mapbox token not configured");
  }

  const query = encodeURIComponent(`${suburb} ${postcode} Australia`);
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${mapboxToken}&country=AU`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const [longitude, latitude] = data.features[0].center;
      
      if (latitude < -44 || latitude > -10 || longitude < 113 || longitude > 154) {
        return null;
      }

      return { latitude, longitude };
    }

    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}
