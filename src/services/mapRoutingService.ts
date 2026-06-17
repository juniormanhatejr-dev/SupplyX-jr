import { GoogleGenAI, Type } from "@google/genai";

export interface GeocodingResult {
  formattedAddress: string;
  lat: number;
  lng: number;
}

export interface RouteCalculationResult {
  originAddress: string;
  destinationAddress: string;
  distanceKm: number;
  durationMinutes: number;
  originLat: number;
  originLng: number;
  destinationLat: number;
  destinationLng: number;
  routeProvider: 'openstreetmap_osrm' | 'openrouteservice' | 'google_maps' | 'gemini_fallback';
  cached?: boolean;
  warnings?: string[];
}

/**
 * Polite user-agent headers required for OpenStreetMap Nominatim / OSRM and other public APIs
 */
const HEADERS = {
  'User-Agent': 'SupplyX-Logistics/1.0.0 (juniormanhate2@gmail.com; AI-Studio Applet Routing Integration)',
  'Accept': 'application/json'
};

/**
 * 1. OpenStreetMap (OSM) Nominatim Geocoder & OSRM Router Implementation (Default No-Key Provider)
 */
async function geocodeViaOSM(address: string): Promise<GeocodingResult> {
  const query = address.toLowerCase().includes('moçambique') || address.toLowerCase().includes('mozambique')
    ? address
    : `${address}, Moçambique`;
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
  console.log(`[RoutingService] OSM Geocoding query: "${query}" -> URL: ${url}`);
  
  const response = await fetch(url, { headers: HEADERS });
  if (!response.ok) {
    throw new Error(`OSM Nominatim Geocode error: ${response.status} ${response.statusText}`);
  }
  
  const data = (await response.json()) as any[];
  if (!data || data.length === 0) {
    throw new Error(`OSM Nominatim Geocoding returned empty results for: "${address}"`);
  }
  
  const first = data[0];
  return {
    formattedAddress: first.display_name || address,
    lat: parseFloat(first.lat),
    lng: parseFloat(first.lon)
  };
}

async function routeViaOSRM(origin: GeocodingResult, destination: GeocodingResult): Promise<RouteCalculationResult> {
  console.log(`[OSRM] --- INICIANDO CHAMADA DE ROTA OSRM ---`);
  console.log(`[OSRM] Endereço de Origem:`, origin.formattedAddress);
  console.log(`[OSRM] Coordenadas de Origem (Lat, Lng):`, origin.lat, origin.lng);
  console.log(`[OSRM] Endereço de Destino:`, destination.formattedAddress);
  console.log(`[OSRM] Coordenadas de Destino (Lat, Lng):`, destination.lat, destination.lng);

  const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=false`;
  console.log(`[OSRM] Efetuando requisição ao URL: ${url}`);
  
  const response = await fetch(url, { headers: HEADERS });
  if (!response.ok) {
    throw new Error(`OSRM Route calculation error: ${response.status} ${response.statusText}`);
  }
  
  const data = (await response.json()) as any;
  if (!data.routes || data.routes.length === 0) {
    throw new Error('OSRM Route not found between coordinates.');
  }
  
  const route = data.routes[0];
  const distanceKm = route.distance / 1000;
  const durationMinutes = Math.max(1, Math.round(route.duration / 60));
  
  console.log(`[OSRM] Rota calculada via OSRM com sucesso: Distância = ${distanceKm} km, Duração = ${durationMinutes} min`);

  return {
    originAddress: origin.formattedAddress,
    destinationAddress: destination.formattedAddress,
    distanceKm,
    durationMinutes,
    originLat: origin.lat,
    originLng: origin.lng,
    destinationLat: destination.lat,
    destinationLng: destination.lng,
    routeProvider: 'openstreetmap_osrm'
  };
}

/**
 * 2. OpenRouteService (ORS) Geocoder & Directions Implementation (Keys Optional)
 */
async function geocodeViaORS(address: string, apiKey: string): Promise<GeocodingResult> {
  const url = `https://api.openrouteservice.org/geocode/search?api_key=${encodeURIComponent(apiKey)}&text=${encodeURIComponent(address)}&size=1`;
  console.log(`[RoutingService] ORS Geocoding address: "${address}"`);
  
  const response = await fetch(url, { headers: HEADERS });
  if (!response.ok) {
    throw new Error(`ORS Geocoding error: ${response.status} ${response.statusText}`);
  }
  
  const data = (await response.json()) as any;
  if (!data.features || data.features.length === 0) {
    throw new Error(`ORS Geocoding returned no features for: "${address}"`);
  }
  
  const feat = data.features[0];
  const [lng, lat] = feat.geometry.coordinates;
  return {
    formattedAddress: feat.properties.label || address,
    lat,
    lng
  };
}

async function routeViaORS(origin: GeocodingResult, destination: GeocodingResult, apiKey: string): Promise<RouteCalculationResult> {
  const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${encodeURIComponent(apiKey)}&start=${origin.lng},${origin.lat}&end=${destination.lng},${destination.lat}`;
  console.log(`[RoutingService] ORS Route request`);
  
  const response = await fetch(url, { headers: HEADERS });
  if (!response.ok) {
    throw new Error(`ORS Directions error: ${response.status} ${response.statusText}`);
  }
  
  const data = (await response.json()) as any;
  if (!data.features || data.features.length === 0) {
    throw new Error('ORS Directions returned no routes.');
  }
  
  const route = data.features[0].properties.summary;
  const distanceKm = parseFloat((route.distance / 1000).toFixed(1));
  const durationMinutes = Math.max(1, Math.round(route.duration / 60));
  
  return {
    originAddress: origin.formattedAddress,
    destinationAddress: destination.formattedAddress,
    distanceKm,
    durationMinutes,
    originLat: origin.lat,
    originLng: origin.lng,
    destinationLat: destination.lat,
    destinationLng: destination.lng,
    routeProvider: 'openrouteservice'
  };
}

/**
 * 3. Google Maps API Geocoder & Routes compute Implementation (Keys Optional)
 */
async function geocodeViaGoogle(address: string, apiKey: string): Promise<GeocodingResult> {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
  console.log(`[RoutingService] Google Map Geocoding address: "${address}"`);
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Google Geocoding request failed: ${response.status}`);
  }
  const data = (await response.json()) as any;
  if (!data.results || data.results.length === 0) {
    throw new Error(`Google Maps was unable to geocode address: "${address}"`);
  }
  
  const loc = data.results[0].geometry.location;
  const formattedAddress = data.results[0].formatted_address;
  return {
    formattedAddress,
    lat: loc.lat,
    lng: loc.lng
  };
}

async function routeViaGoogle(origin: GeocodingResult, destination: GeocodingResult, apiKey: string): Promise<RouteCalculationResult> {
  const url = 'https://routes.googleapis.com/v1/routes:computeRoutes';
  console.log(`[RoutingService] Google Route computation request`);
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters',
    },
    body: JSON.stringify({
      origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
      destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
      travelMode: 'DRIVING'
    })
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google Routes API returned error: ${response.status} - ${text}`);
  }
  
  const data = (await response.json()) as any;
  if (!data.routes || data.routes.length === 0) {
    throw new Error('Google Routes found no active road route.');
  }
  
  const route = data.routes[0];
  const distanceKm = parseFloat(((route.distanceMeters || 0) / 1000).toFixed(1));
  const durationStr = route.duration || '0s';
  const seconds = parseInt(durationStr.replace('s', ''), 10) || 0;
  const durationMinutes = Math.max(1, Math.round(seconds / 60));
  
  return {
    originAddress: origin.formattedAddress,
    destinationAddress: destination.formattedAddress,
    distanceKm,
    durationMinutes,
    originLat: origin.lat,
    originLng: origin.lng,
    destinationLat: destination.lat,
    destinationLng: destination.lng,
    routeProvider: 'google_maps'
  };
}

/**
 * Global Consolidated Map Routing Service
 * Safe for multiple geocoding and routing providers with multiple fallbacks.
 */
export async function calculateRoute(originStr: string, destinationStr: string): Promise<RouteCalculationResult> {
  const normalizedOrigin = originStr ? originStr.trim() : '';
  const normalizedDest = destinationStr ? destinationStr.trim() : '';
  
  if (!normalizedOrigin || !normalizedDest) {
    throw new Error('Origin and destination are compulsory parameters.');
  }

  // Same Address Check to avoid useless remote API roundtrips
  if (normalizedOrigin.toLowerCase() === normalizedDest.toLowerCase()) {
    return {
      originAddress: normalizedOrigin,
      destinationAddress: normalizedDest,
      distanceKm: 0,
      durationMinutes: 0,
      originLat: -25.9692, // Default maputo region
      originLng: 32.5731,
      destinationLat: -25.9692,
      destinationLng: 32.5735,
      routeProvider: 'openstreetmap_osrm',
      warnings: ['Origem e destino informados idênticos.']
    };
  }

  // Priority Keys defined in environment secrets
  const googleKey = (typeof process !== 'undefined' ? (process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_PLATFORM_KEY) : undefined) || (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY;
  const orsKey = (typeof process !== 'undefined' ? process.env.OPEN_ROUTE_SERVICE_KEY : undefined) || (import.meta as any).env?.VITE_OPEN_ROUTE_SERVICE_KEY;

  // Strategy 1: OpenRouteService (if key is configured)
  if (orsKey) {
    try {
      console.log('[RoutingService] Using OpenRouteService strategy...');
      const originResult = await geocodeViaORS(normalizedOrigin, orsKey);
      const destinationResult = await geocodeViaORS(normalizedDest, orsKey);
      return await routeViaORS(originResult, destinationResult, orsKey);
    } catch (orsError: any) {
      console.warn(`[RoutingService] OpenRouteService strategy failed. Trying fallback... Error: ${orsError.message}`);
    }
  }

  // Strategy 2: Google Maps (if key is configured)
  if (googleKey) {
    try {
      console.log('[RoutingService] Using Google Maps strategy...');
      const originResult = await geocodeViaGoogle(normalizedOrigin, googleKey);
      const destinationResult = await geocodeViaGoogle(normalizedDest, googleKey);
      return await routeViaGoogle(originResult, destinationResult, googleKey);
    } catch (googleError: any) {
      console.warn(`[RoutingService] Google Maps strategy failed. Trying fallback... Error: ${googleError.message}`);
    }
  }

  // Strategy 3: OpenStreetMap Public Routing Service (Nominatim + OSRM) - NO API KEYS NEEDED!
  try {
    console.log('[RoutingService] Using OpenStreetMap (Nominatim + OSRM) strategy...');
    const originResult = await geocodeViaOSM(normalizedOrigin);
    const destinationResult = await geocodeViaOSM(normalizedDest);
    return await routeViaOSRM(originResult, destinationResult);
  } catch (osmError: any) {
    console.error(`[RoutingService] OpenStreetMap Public strategy failed:`, osmError);
    throw new Error(`Erro ao calcular rota via OpenStreetMap (OSRM): ${osmError.message || osmError}`);
  }
}

