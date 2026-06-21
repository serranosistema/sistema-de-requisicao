import type { Sector, Item, Requisition, User } from "./types";

export const mockUser: User = {
  id: "u1",
  name: "Ana Repositora",
  email: "ana@empresa.com",
  role: "ADMIN",
};

export const seedSectors: Sector[] = [
  { id: "s1", name: "Cozinha" },
  { id: "s2", name: "Padaria" },
  { id: "s3", name: "Confeitaria" },
  { id: "s4", name: "Pizzaria" },
  { id: "s5", name: "Açougue" },
];

export const seedItems: Item[] = [
  {
    id: "i1",
    name: "Farinha de Trigo",
    unit: "KG",
    sectorIds: ["s2", "s3", "s4"],
    cost: 5.49,
  },
  {
    id: "i2",
    name: "Queijo Mussarela",
    unit: "KG",
    sectorIds: ["s1", "s4"],
    cost: 32.9,
  },
  {
    id: "i3",
    name: "Açúcar Refinado",
    unit: "KG",
    sectorIds: ["s2", "s3"],
    cost: 4.2,
  },
  {
    id: "i4",
    name: "Ovos",
    unit: "CX",
    sectorIds: ["s2", "s3", "s1"],
    cost: 18.5,
  },
  {
    id: "i5",
    name: "Fermento Biológico",
    unit: "UN",
    sectorIds: ["s2", "s4"],
    cost: 1.25,
  },
  {
    id: "i6",
    name: "Molho de Tomate",
    unit: "CX",
    sectorIds: ["s1", "s4"],
    cost: 45.0,
  },
  {
    id: "i7",
    name: "Manteiga",
    unit: "KG",
    sectorIds: ["s1", "s2", "s3"],
    cost: 42.0,
  },
  {
    id: "i8",
    name: "Chocolate em Pó",
    unit: "KG",
    sectorIds: ["s3"],
    cost: 28.9,
  },
  {
    id: "i9",
    name: "Carne Moída",
    unit: "KG",
    sectorIds: ["s1", "s5"],
    cost: 29.9,
  },
  {
    id: "i10",
    name: "Frango",
    unit: "KG",
    sectorIds: ["s1", "s5"],
    cost: 14.5,
  },
  {
    id: "i11",
    name: "Óleo de Soja",
    unit: "CX",
    sectorIds: ["s1", "s4"],
    cost: 115.0,
  },
  {
    id: "i12",
    name: "Sal Refinado",
    unit: "KG",
    sectorIds: ["s1", "s2", "s4", "s5"],
    cost: 2.1,
  },
  {
    id: "i13",
    name: "Leite Integral",
    unit: "CX",
    sectorIds: ["s3", "s2"],
    cost: 55.0,
  },
  {
    id: "i14",
    name: "Creme de Leite",
    unit: "CX",
    sectorIds: ["s1", "s3"],
    cost: 72.5,
  },
];

export const seedRequisitions: Requisition[] = [
  {
    id: "r1",
    sectorId: "s2",
    status: "PENDING",
    createdAt: "2026-06-10T08:30:00",
    requesterName: "Ana Repositora",
    items: [
      { id: "ri1", itemId: "i1", quantity: 25 },
      { id: "ri2", itemId: "i3", quantity: 10 },
      { id: "ri3", itemId: "i5", quantity: 4 },
    ],
  },
  {
    id: "r2",
    sectorId: "s4",
    status: "PICKING",
    createdAt: "2026-06-10T07:15:00",
    requesterName: "Carlos Pizza",
    items: [
      { id: "ri4", itemId: "i2", quantity: 8, picked: true },
      { id: "ri5", itemId: "i6", quantity: 3 },
      { id: "ri6", itemId: "i1", quantity: 15 },
    ],
  },
  {
    id: "r3",
    sectorId: "s1",
    status: "COMPLETED",
    createdAt: "2026-06-09T16:45:00",
    requesterName: "Marina Chef",
    items: [
      { id: "ri7", itemId: "i9", quantity: 12, picked: true },
      { id: "ri8", itemId: "i10", quantity: 10, picked: true },
    ],
  },
  {
    id: "r4",
    sectorId: "s3",
    status: "PENDING",
    createdAt: "2026-06-10T09:05:00",
    requesterName: "Beatriz Doces",
    items: [
      { id: "ri9", itemId: "i8", quantity: 6 },
      { id: "ri10", itemId: "i14", quantity: 5 },
      { id: "ri11", itemId: "i4", quantity: 3 },
    ],
  },
  {
    id: "r5",
    sectorId: "s5",
    status: "COMPLETED",
    createdAt: "2026-06-09T11:20:00",
    requesterName: "João Carnes",
    items: [{ id: "ri12", itemId: "i9", quantity: 20, picked: true }],
  },
];
