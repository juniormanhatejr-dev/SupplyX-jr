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
