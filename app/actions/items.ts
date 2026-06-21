"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function getDefaultStoreId() {
  const store = await prisma.store.findFirst();
  if (!store) throw new Error("Nenhuma loja encontrada.");
  return store.id;
}

export async function getItems() {
  try {
    const storeId = await getDefaultStoreId();
    return await prisma.item.findMany({
      where: { storeId, isActive: true },
      include: {
        sectors: {
          select: { id: true, name: true },
        },
      },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("Erro ao procurar itens:", error);
    return [];
  }
}

// Adicionamos o 'code' nos parâmetros
export async function createItem(data: {
  code: string;
  name: string;
  unit: string;
  cost?: number;
  sectorIds: string[];
}) {
  try {
    const storeId = await getDefaultStoreId();
    const item = await prisma.item.create({
      data: {
        code: data.code, // <-- Inserindo o código
        name: data.name,
        unit: data.unit,
        cost: data.cost,
        storeId,
        sectors: {
          connect: data.sectorIds.map((id) => ({ id })),
        },
      },
    });
    revalidatePath("/admin");
    return { success: true, item };
  } catch (error) {
    console.error("Erro ao criar item:", error);
    return {
      success: false,
      error: "Não foi possível criar o item. Verifique se o código já existe.",
    };
  }
}

// Adicionamos o 'code' na atualização também
export async function updateItem(
  id: string,
  data: {
    code: string;
    name: string;
    unit: string;
    cost?: number;
    sectorIds: string[];
  },
) {
  try {
    const item = await prisma.item.update({
      where: { id },
      data: {
        code: data.code, // <-- Atualizando o código
        name: data.name,
        unit: data.unit,
        cost: data.cost,
        sectors: {
          set: data.sectorIds.map((id) => ({ id })),
        },
      },
    });
    revalidatePath("/admin");
    return { success: true, item };
  } catch (error) {
    console.error("Erro ao atualizar item:", error);
    return { success: false, error: "Não foi possível atualizar o item." };
  }
}

export async function deleteItem(id: string) {
  try {
    await prisma.item.update({
      where: { id },
      data: { isActive: false },
    });
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Erro ao desativar item:", error);
    return { success: false, error: "Não foi possível eliminar o item." };
  }
}
