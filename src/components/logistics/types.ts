export interface CargoRequest {
  id: string;
  tipoCarga: string;
  quantidade: string;
  peso: string;
  volume: string;
  origem: string;
  destino: string;
  dataColeta: string;
  prazoEntrega: string;
  observacoes: string;
  requester: 'Client' | 'Supplier' | string;
  requesterName?: string;
  freightResponsibility: 'Client' | 'Supplier' | 'Shared' | string;
  deliveryMode: string;
  status: 'Pendente' | 'Em concurso' | 'Atribuído' | 'Em recolha' | 'Em trânsito' | 'Entregue' | 'Cancelado' | string;
  proposalsCount: number;
  rating: number;
  targetPrice?: string;
  dimensions?: string;
  fragile?: boolean;
  assignedCarrier?: string;
  feedbackClient?: { rating: number; comment: string };
  feedbackCarrier?: { rating: number; comment: string };
  podSignature?: string;
  podPhoto?: string;
  hasUserBid?: boolean;
  logisticsReplies?: any[];
  buyerId?: string;
  supplierId?: string;
  trackProgress?: number;
  trackSpeed?: number;
  trackTemp?: number;
  trackFuel?: number;
  trackStatusText?: string;
  driverName?: string;
  items?: { name: string; quantity: string; weight?: string; volume?: string; }[];
  originAddress?: string;
  destinationAddress?: string;
  distanceKm?: number;
  durationMinutes?: number;
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
  routeCalculatedAt?: string;
  cacheVersion?: number;
  estimatedFreight?: number;
  routeStatus?: 'verified_google' | 'estimated_offline' | 'pending_verification' | 'invalid_route' | string;
  recommendedVehicle?: string;
  alternativeVehicles?: string[];
  utilizationWeightPercent?: number;
  utilizationVolumePercent?: number;
  vehicleCompatibilityScore?: number;
  vehicleWarningMsg?: string;
  userId?: string;
  isDirectAssignment?: boolean;
  crtCode?: string;
  officialDocCode?: string;
}

export function getOfficialCrtCode(id?: string, existingCrtCode?: string): string {
  const source = existingCrtCode || id || '';
  if (!source) return 'CRT-MZ-TR-2026-0000';

  let clean = source.trim();

  // Strip duplicate prefixes recursively if present
  while (
    clean.startsWith('CRT-MZ-TR-2026-') ||
    clean.startsWith('CRT-MZ-TR-2025-') ||
    clean.startsWith('CRT-MZ-TR-2024-') ||
    clean.startsWith('CRT-MZ-') ||
    clean.startsWith('CRT-') ||
    clean.startsWith('TR-2026-') ||
    clean.startsWith('TR-2025-') ||
    clean.startsWith('TR-2024-')
  ) {
    if (clean.startsWith('CRT-MZ-TR-2026-')) clean = clean.substring('CRT-MZ-TR-2026-'.length);
    else if (clean.startsWith('CRT-MZ-TR-2025-')) clean = clean.substring('CRT-MZ-TR-2025-'.length);
    else if (clean.startsWith('CRT-MZ-TR-2024-')) clean = clean.substring('CRT-MZ-TR-2024-'.length);
    else if (clean.startsWith('CRT-MZ-')) clean = clean.substring('CRT-MZ-'.length);
    else if (clean.startsWith('CRT-')) clean = clean.substring('CRT-'.length);
    else if (clean.startsWith('TR-2026-')) clean = clean.substring('TR-2026-'.length);
    else if (clean.startsWith('TR-2025-')) clean = clean.substring('TR-2025-'.length);
    else if (clean.startsWith('TR-2024-')) clean = clean.substring('TR-2024-'.length);
  }

  if (!clean) {
    return 'CRT-MZ-TR-2026-0000';
  }

  return `CRT-MZ-TR-2026-${clean}`;
}

export interface CarrierProposal {
  id: string;
  cargoId: string;
  name: string;
  rating: number;
  price: number;
  deliverTime: string;
  conditions: string;
  insurance: string;
  trips: number;
  userId?: string;
}

export interface Occurrence {
  id: string;
  cargoId: string;
  cargoName: string;
  description: string;
  category: 'Atrasos' | 'Danos na mercadoria' | 'Falha de entrega' | 'Outros incidentes' | string;
  dateTime: string;
  responsible: string;
  status: 'Aberta' | 'Resolvida' | string;
}

export interface CommercialDriver {
  id: string;
  name: string;
  licenseId: string;
  vehicle: string;
  capacity: string;
  location: string;
  status: 'Disponível' | 'Em Trânsito' | 'Em Descanso' | string;
  rating: number;
  trips: number;
  avatar?: string;
  phone?: string;
}

export interface StorageWarehouse {
  id: string;
  name: string;
  location: string;
  capacityTotal: string;
  capacityUsed: string;
  percentage: number;
  manager: string;
  contact: string;
  itemsCount: number;
}

export interface FinancialLedger {
  id: string;
  cargoId: string;
  cargoName: string;
  client: string;
  carrier: string;
  totalFreight: number;
  feeSupplyX: number;
  netPayout: number;
  status: 'Faturado' | 'Pendente' | 'Pago' | string;
  dueDate: string;
}
