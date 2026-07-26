
interface Location {
  lat: number;
  lng: number;
}

// Coordinates for Mozambique Provinces (approximations)
export const PROVINCE_COORDINATES: Record<string, Location> = {
  'Maputo Cidade': { lat: -25.9692, lng: 32.5732 },
  'Maputo Província': { lat: -25.9692, lng: 32.5732 },
  'Gaza': { lat: -25.0447, lng: 33.6406 },
  'Inhambane': { lat: -23.8650, lng: 35.3833 },
  'Sofala': { lat: -19.8333, lng: 34.8500 },
  'Manica': { lat: -18.9167, lng: 33.4500 },
  'Tete': { lat: -16.1564, lng: 33.5867 },
  'Zambézia': { lat: -17.8786, lng: 36.8883 },
  'Nampula': { lat: -15.1167, lng: 39.2667 },
  'Niassa': { lat: -13.3125, lng: 35.2422 },
  'Cabo Delgado': { lat: -12.9667, lng: 40.5500 },
};

export interface SupplierRanking {
  supplierId: string;
  productMatch: number; // 0 to 1
  distanceKm: number;
  priceTotal: number;
  score: number; // Weighted combined score
}

export function calculateDistance(loc1: Location, loc2: Location): number {
  const R = 6371; // Earth's radius in km
  const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
  const dLng = (loc2.lng - loc1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export function rankSuppliers(
  buyerLocation: Location,
  requestedItems: Array<{ material: string; quantity: number }>,
  suppliers: Array<{
    id: string;
    location: Location;
    catalog: Array<{ name: string; price: number; onSale?: boolean; salePrice?: number }>;
  }>
): SupplierRanking[] {
  // First calculate totals to find min/max for normalization
  const calculatedSuppliers = suppliers.map(supplier => {
    let priceTotal = 0;
    let matchedCount = 0;

    requestedItems.forEach(req => {
      const match = supplier.catalog.find(cat => 
        cat.name.toLowerCase().includes(req.material.toLowerCase()) || 
        req.material.toLowerCase().includes(cat.name.toLowerCase())
      );
      if (match) {
        const price = (match.onSale && (match.salePrice !== undefined && match.salePrice !== null)) ? match.salePrice : match.price;
        priceTotal += price * req.quantity;
        matchedCount++;
      } else {
        // Penalty for missing items - estimate a high price
        priceTotal += 5000 * req.quantity; 
      }
    });

    const productMatch = requestedItems.length > 0 ? matchedCount / requestedItems.length : 0;
    const distanceKm = calculateDistance(buyerLocation, supplier.location);

    return {
      supplierId: supplier.id,
      productMatch,
      distanceKm,
      priceTotal
    };
  });

  const minPrice = Math.min(...calculatedSuppliers.map(s => s.priceTotal)) || 1;
  const maxPrice = Math.max(...calculatedSuppliers.map(s => s.priceTotal)) || 2;
  const maxDistance = 2500;

  return calculatedSuppliers.map(s => {
    // Normalization (0 to 1 where 1 is best)
    const priceScore = maxPrice === minPrice ? 1 : 1 - ((s.priceTotal - minPrice) / (maxPrice - minPrice));
    const distanceScore = Math.max(0, 1 - (s.distanceKm / maxDistance));
    
    // Scoring logic (Weighted):
    // 1. Availability (95% target requirement) - 50%
    // 2. Price - 30%
    // 3. Proximity - 20%
    
    // Bonus / Gate for hitting the 95% availability target
    const coverageScore = s.productMatch >= 0.95 ? 1.0 : (s.productMatch * 0.5);
    
    const score = (coverageScore * 0.5) + (priceScore * 0.3) + (distanceScore * 0.2);

    return {
      ...s,
      score: Math.min(1, score)
    };
  }).sort((a, b) => b.score - a.score);
}
