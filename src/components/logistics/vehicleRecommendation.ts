export interface VehicleProfile {
  vehicleType: string;
  maxPayloadKg: number;
  maxVolumeM3: number;
  maxLengthM: number;
  maxWidthM: number;
  maxHeightM: number;
  availabilityStatus: 'Available' | 'Full' | 'Maintenance' | string;
}

export interface RecommendationResult {
  recommendedVehicle: string;
  alternativeVehicles: string[];
  utilizationWeightPercent: number;
  utilizationVolumePercent: number;
  vehicleCompatibilityScore: number;
  warnings: string[];
  remainingPayloadKg: number;
  remainingVolumeM3: number;
  selectedVehicleProfile?: VehicleProfile;
}

export const DEFAULT_VEHICLES: VehicleProfile[] = [
  { vehicleType: 'Pickup', maxPayloadKg: 1000, maxVolumeM3: 3, maxLengthM: 2.0, maxWidthM: 1.4, maxHeightM: 1.2, availabilityStatus: 'Available' },
  { vehicleType: 'Light Truck', maxPayloadKg: 3000, maxVolumeM3: 10, maxLengthM: 4.2, maxWidthM: 2.0, maxHeightM: 1.8, availabilityStatus: 'Available' },
  { vehicleType: 'Box Truck', maxPayloadKg: 5000, maxVolumeM3: 20, maxLengthM: 5.0, maxWidthM: 2.2, maxHeightM: 2.0, availabilityStatus: 'Available' },
  { vehicleType: 'Medium Truck', maxPayloadKg: 7000, maxVolumeM3: 25, maxLengthM: 6.2, maxWidthM: 2.4, maxHeightM: 2.2, availabilityStatus: 'Available' },
  { vehicleType: 'Flatbed', maxPayloadKg: 15000, maxVolumeM3: 45, maxLengthM: 8.5, maxWidthM: 2.5, maxHeightM: 2.5, availabilityStatus: 'Available' },
  { vehicleType: 'Heavy Truck', maxPayloadKg: 18000, maxVolumeM3: 50, maxLengthM: 9.6, maxWidthM: 2.5, maxHeightM: 2.6, availabilityStatus: 'Available' },
  { vehicleType: 'Semi-Trailer', maxPayloadKg: 28000, maxVolumeM3: 80, maxLengthM: 13.6, maxWidthM: 2.5, maxHeightM: 2.7, availabilityStatus: 'Available' },
  { vehicleType: 'Container Truck', maxPayloadKg: 32000, maxVolumeM3: 85, maxLengthM: 13.6, maxWidthM: 2.5, maxHeightM: 2.8, availabilityStatus: 'Available' }
];

// Helper to reliably parse user-input weight to custom standard kg format
export function parseWeightToKg(weightStr: string): number {
  if (!weightStr) return 0;
  const cleaned = weightStr.toLowerCase().replace(',', '.');
  const match = cleaned.match(/([\d.]+)/);
  if (!match) return 0;
  
  const num = parseFloat(match[1]);
  if (isNaN(num)) return 0;

  // Check of standard Mozambiquan terms (Tonelada, Ton, t, mil, kg)
  if (cleaned.includes('tonelada') || cleaned.includes('tonne') || cleaned.includes('ton') || (cleaned.includes('t') && !cleaned.includes('kg') && !cleaned.includes('net'))) {
    return num * 1000;
  }
  return num;
}

// Helper to obtain volume number
export function parseVolumeToM3(volumeStr: string): number {
  if (!volumeStr) return 0;
  const cleaned = volumeStr.toLowerCase().replace(',', '.');
  const match = cleaned.match(/([\d.]+)/);
  if (!match) return 0;
  const num = parseFloat(match[1]);
  return isNaN(num) ? 0 : num;
}

// Helper to extract dimensions (Length x Width x Height) in meters
export function parseDimensions(dimsStr: string): { length: number; width: number; height: number } {
  if (!dimsStr) return { length: 0, width: 0, height: 0 };
  
  // Normalize string separators (e.g. "12m x 2.4m x 2.2m" -> "12 2.4 2.2")
  const cleaned = dimsStr.toLowerCase().replace(/m/g, '').replace(/,/g, '.');
  const numbers = cleaned.match(/([\d.]+)/g);
  
  if (numbers && numbers.length >= 3) {
    const l = parseFloat(numbers[0]);
    const w = parseFloat(numbers[1]);
    const h = parseFloat(numbers[2]);
    return {
      length: isNaN(l) ? 0 : l,
      width: isNaN(w) ? 0 : w,
      height: isNaN(h) ? 0 : h
    };
  } else if (numbers && numbers.length === 1) {
    // If only one number given, we assume it is volume or a single parameter, default general bounds
    const single = parseFloat(numbers[0]);
    return { length: Math.pow(single, 1/3), width: Math.pow(single, 1/3), height: Math.pow(single, 1/3) };
  }
  
  return { length: 0, width: 0, height: 0 };
}

// Robust offline transport compatibility calculation engine
export function calculateVehicleRecommendation(
  weightStr: string,
  volumeStr: string,
  dimensionsStr: string,
  customVehicles?: VehicleProfile[]
): RecommendationResult {
  const vehicles = customVehicles && customVehicles.length > 0 ? customVehicles : DEFAULT_VEHICLES;
  
  const cargoWeightKg = parseWeightToKg(weightStr);
  const cargoVolumeM3 = parseVolumeToM3(volumeStr);
  const cargoDims = parseDimensions(dimensionsStr);

  const warnings: string[] = [];

  // 1. Filter out candidate vehicles that fit physical payload, volume and dimensions
  const matchingVehicles = vehicles.filter(v => {
    if (v.availabilityStatus !== 'Available') return false;
    
    const fitsWeight = cargoWeightKg <= v.maxPayloadKg;
    const fitsVolume = cargoVolumeM3 <= v.maxVolumeM3;
    
    // Dimension capability check (permissive orientation check)
    // The cargo can be positioned. We compare sorted dimensions of cargo and vehicle
    const cargoSorted = [cargoDims.length, cargoDims.width, cargoDims.height].sort((a, b) => a - b);
    const vehicleSorted = [v.maxLengthM, v.maxWidthM, v.maxHeightM].sort((a, b) => a - b);
    
    const fitsDimensions = cargoSorted[0] <= vehicleSorted[0] && 
                           cargoSorted[1] <= vehicleSorted[1] && 
                           cargoSorted[2] <= vehicleSorted[2];

    return fitsWeight && fitsVolume && fitsDimensions;
  });

  // Sort matching vehicles by capacity (maxPayloadKg) to find the smallest suitable option
  const sortedMatching = [...matchingVehicles].sort((a, b) => a.maxPayloadKg - b.maxPayloadKg);

  let recommendedVehicle = 'Nenhum veículo disponível';
  let selectedVehicleProfile: VehicleProfile | undefined = undefined;
  const alternativeVehicles: string[] = [];

  if (sortedMatching.length > 0) {
    selectedVehicleProfile = sortedMatching[0];
    recommendedVehicle = selectedVehicleProfile.vehicleType;
    
    // Alternative options are other compatible vehicles
    sortedMatching.slice(1).forEach(v => {
      alternativeVehicles.push(v.vehicleType);
    });
  }

  // 2. Compute utilization details based on selected or best theoretical limits
  const targetVehicle = selectedVehicleProfile || vehicles[vehicles.length - 1]; // Fallback to largest for metrics
  
  const utilizationWeightPercent = targetVehicle ? Math.min(100, Math.round((cargoWeightKg / targetVehicle.maxPayloadKg) * 100)) : 0;
  const utilizationVolumePercent = targetVehicle ? Math.min(100, Math.round((cargoVolumeM3 / targetVehicle.maxVolumeM3) * 100)) : 0;
  
  const remainingPayloadKg = targetVehicle ? Math.max(0, targetVehicle.maxPayloadKg - cargoWeightKg) : 0;
  const remainingVolumeM3 = targetVehicle ? Math.max(0, targetVehicle.maxVolumeM3 - cargoVolumeM3) : 0;

  // 3. Generate warning flags
  const maxSystemPayload = Math.max(...vehicles.map(v => v.maxPayloadKg));
  const maxSystemVolume = Math.max(...vehicles.map(v => v.maxVolumeM3));
  
  if (cargoWeightKg > maxSystemPayload) {
    warnings.push('Overweight cargo: Carga excede o limite máximo de qualquer veículo do sistema.');
  } else if (selectedVehicleProfile && cargoWeightKg > selectedVehicleProfile.maxPayloadKg) {
    warnings.push('Overweight cargo: Carga excede a capacidade do veículo selecionado.');
  }

  // Checking dimensional max bounds
  const maxSystemLength = Math.max(...vehicles.map(v => v.maxLengthM));
  const maxSystemWidth = Math.max(...vehicles.map(v => v.maxWidthM));
  const maxSystemHeight = Math.max(...vehicles.map(v => v.maxHeightM));

  if (cargoVolumeM3 > maxSystemVolume || 
      cargoDims.length > maxSystemLength || 
      cargoDims.width > maxSystemWidth || 
      cargoDims.height > maxSystemHeight) {
    warnings.push('Oversized cargo: Dimensões físicas superam os limites espaciais da frota.');
  }

  if (sortedMatching.length === 0) {
    warnings.push('Incompatible vehicle selection: Nenhum veículo atende a todas as restrições de peso, volume e dimensões.');
  }

  // Excess unused capacity when weight and volume are both below 12% in a large vehicle
  if (selectedVehicleProfile && utilizationWeightPercent < 15 && utilizationVolumePercent < 15) {
    warnings.push('Excess unused capacity: Baixa ocupação de carga útil. Considere consolidar.');
  }

  // 4. Calculate final compatibility score
  // Ideal score is close to 85% utilization, penalized if overloading or empty
  let compatibilityScore = 0;
  if (selectedVehicleProfile) {
    const avgUtilization = (utilizationWeightPercent + utilizationVolumePercent) / 2;
    // High score when utilization is high but under limits, low if vehicle is nearly empty or oversized
    compatibilityScore = Math.max(10, Math.round(100 - (100 - avgUtilization) * 0.4));
    
    // Penalize if there's an unused warning
    if (utilizationWeightPercent < 15 && utilizationVolumePercent < 15) {
      compatibilityScore = Math.max(20, compatibilityScore - 30);
    }
  } else {
    compatibilityScore = 0;
  }

  return {
    recommendedVehicle,
    alternativeVehicles,
    utilizationWeightPercent,
    utilizationVolumePercent,
    vehicleCompatibilityScore: compatibilityScore,
    warnings,
    remainingPayloadKg,
    remainingVolumeM3,
    selectedVehicleProfile
  };
}
