
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
  requestedItems: string[],
  suppliers: Array<{
    id: string;
    location: Location;
    catalogItems: string[]; // List of product names or categories they have
  }>
): SupplierRanking[] {
  return suppliers.map(supplier => {
    // Calculate how many of the requested items this supplier has
    const matchedItems = requestedItems.filter(item => 
      supplier.catalogItems.some(catItem => 
        catItem.toLowerCase().includes(item.toLowerCase()) || 
        item.toLowerCase().includes(catItem.toLowerCase())
      )
    );
    
    const productMatch = requestedItems.length > 0 ? matchedItems.length / requestedItems.length : 0;
    const distanceKm = calculateDistance(buyerLocation, supplier.location);
    
    // Scoring logic:
    // Higher product match is very important (90% target)
    // Lower distance is better
    // Weighted formula: (ProductMatch * 70%) + (InverseDistanceScore * 30%)
    
    const maxDistance = 2500; // Roughly length of Moz
    const distanceScore = Math.max(0, 1 - (distanceKm / maxDistance));
    const score = (productMatch * 0.7) + (distanceScore * 0.3);
    
    return {
      supplierId: supplier.id,
      productMatch,
      distanceKm,
      score
    };
  }).sort((a, b) => b.score - a.score);
}
