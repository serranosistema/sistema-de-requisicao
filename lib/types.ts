export type Role = "ADMIN" | "REPOSITOR" | "ESTOQUISTA";
export type RequisitionStatus = "PENDING" | "PICKING" | "COMPLETED";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Sector {
  id: string;
  name: string;
}

export interface Item {
  id: string;
  name: string;
  unit: string; // KG, UN, CX
  sectorIds: string[]; // itens disponíveis por setor
  cost?: number; // Custo opcional do insumo (adicionado agora)
}

export interface RequisitionItem {
  id: string;
  itemId: string;
  quantity: number;
  picked?: boolean;
}

export interface Requisition {
  id: string;
  sectorId: string;
  status: RequisitionStatus;
  createdAt: string;
  requesterName: string;
  items: RequisitionItem[];
}

export const STATUS_LABELS: Record<RequisitionStatus, string> = {
  PENDING: "Pendente",
  PICKING: "Em Separação",
  COMPLETED: "Concluído",
};

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrador",
  REPOSITOR: "Repositor",
  ESTOQUISTA: "Estoquista",
};
