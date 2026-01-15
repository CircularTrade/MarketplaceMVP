import type { Listing, Order } from "@shared/schema";

/**
 * Material weight estimation (kg per unit) - fallback when estimatedWeightKg not provided
 */
const MATERIAL_WEIGHT_KG: Record<string, number> = {
  steel: 50,
  timber: 25,
  concrete: 100,
  bricks: 3,
  plasterboard: 10,
  gyprock: 10,
  insulation: 5,
  default: 20,
};

/**
 * CO₂ emissions avoided (tCO₂ per tonne of material reused)
 */
const CO2_FACTOR: Record<string, number> = {
  steel: 1.8,
  timber: 0.9,
  concrete: 0.15,
  plasterboard: 0.25,
  gyprock: 0.25,
  insulation: 0.5,
  default: 0.3,
};

/**
 * Tipping fee (AUD per tonne) - Australian construction waste
 */
const TIPPING_FEE_PER_TONNE = 250;

/**
 * Get weight per unit for a material type
 */
export function getWeightPerUnit(materialType: string): number {
  const normalizedType = materialType.toLowerCase();
  return MATERIAL_WEIGHT_KG[normalizedType] || MATERIAL_WEIGHT_KG.default;
}

/**
 * Get CO₂ emissions factor for a material type
 */
export function getCO2Factor(materialType: string): number {
  const normalizedType = materialType.toLowerCase();
  return CO2_FACTOR[normalizedType] || CO2_FACTOR.default;
}

/**
 * Calculate total weight in kg for a listing/order
 */
export function calculateWeightKg(
  listing: Pick<Listing, "estimatedWeightKg" | "materialType" | "quantity">
): number {
  // Prefer seller-provided weight if available (this is total weight for the listing)
  if (listing.estimatedWeightKg) {
    return parseFloat(listing.estimatedWeightKg.toString());
  }
  
  // Fall back to material type estimation (weight per unit × quantity)
  const weightPerUnit = getWeightPerUnit(listing.materialType);
  return weightPerUnit * listing.quantity;
}

/**
 * Convert kg to tonnes
 */
export function kgToTonnes(kg: number): number {
  return kg / 1000;
}

/**
 * Calculate tipping fees saved for a given weight
 */
export function calculateTippingFeesSaved(tonnes: number): number {
  return tonnes * TIPPING_FEE_PER_TONNE;
}

/**
 * Calculate CO₂ emissions avoided for a listing
 */
export function calculateCO2Avoided(
  tonnes: number,
  materialType: string
): number {
  const factor = getCO2Factor(materialType);
  return tonnes * factor;
}

/**
 * Calculate complete sustainability metrics for a single order
 */
export function calculateOrderMetrics(
  listing: Pick<Listing, "estimatedWeightKg" | "materialType" | "quantity">
) {
  const weightKg = calculateWeightKg(listing);
  const tonnes = kgToTonnes(weightKg);
  const tippingFeesSaved = calculateTippingFeesSaved(tonnes);
  const co2Avoided = calculateCO2Avoided(tonnes, listing.materialType);

  return {
    weightKg,
    tonnes,
    tippingFeesSaved,
    co2Avoided,
  };
}

/**
 * Aggregate sustainability metrics across multiple orders
 */
export interface SustainabilityMetrics {
  totalTonnes: number;
  totalTippingFeesSaved: number;
  totalCO2Avoided: number;
  byMaterial: {
    materialType: string;
    tonnes: number;
    co2Avoided: number;
    orderCount: number;
  }[];
}

export function aggregateMetrics(
  ordersWithListings: Array<{
    order: Order;
    listing: Listing;
  }>
): SustainabilityMetrics {
  const byMaterial = new Map<
    string,
    { tonnes: number; co2Avoided: number; orderCount: number }
  >();
  
  let totalTonnes = 0;
  let totalCO2Avoided = 0;

  for (const { listing } of ordersWithListings) {
    const metrics = calculateOrderMetrics(listing);
    
    totalTonnes += metrics.tonnes;
    totalCO2Avoided += metrics.co2Avoided;

    const existing = byMaterial.get(listing.materialType) || {
      tonnes: 0,
      co2Avoided: 0,
      orderCount: 0,
    };
    
    byMaterial.set(listing.materialType, {
      tonnes: existing.tonnes + metrics.tonnes,
      co2Avoided: existing.co2Avoided + metrics.co2Avoided,
      orderCount: existing.orderCount + 1,
    });
  }

  return {
    totalTonnes,
    totalTippingFeesSaved: calculateTippingFeesSaved(totalTonnes),
    totalCO2Avoided,
    byMaterial: Array.from(byMaterial.entries()).map(([materialType, data]) => ({
      materialType,
      ...data,
    })),
  };
}
