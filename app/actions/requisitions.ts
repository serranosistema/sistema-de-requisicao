"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function getDefaultStoreId() {
  const store = await prisma.store.findFirst();
  if (!store) throw new Error("Nenhuma loja encontrada na base de dados.");
  return store.id;
}

export async function createRequisition(
  sectorId: string,
  items: { itemId: string; quantity: number }[],
) {
  try {
    const storeId = await getDefaultStoreId();

    const requisition = await prisma.requisition.create({
      data: {
        storeId,
        sectorId,
        items: {
          create: items.map((it) => ({
            itemId: it.itemId,
            quantity: it.quantity,
          })),
        },
      },
    });

    revalidatePath("/historico");
    return { success: true, requisition };
  } catch (error) {
    console.error("Erro ao criar requisição:", error);
    return { success: false, error: "Não foi possível salvar a requisição." };
  }
}

export async function getRequisitions() {
  try {
    const storeId = await getDefaultStoreId();

    const reqs = await prisma.requisition.findMany({
      where: { storeId },
      include: {
        sector: {
          select: { id: true, name: true, code: true },
        },
        items: {
          include: {
            item: {
              select: { id: true, name: true, code: true, unit: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return reqs;
  } catch (error) {
    console.error("Erro ao buscar requisições:", error);
    return [];
  }
}
