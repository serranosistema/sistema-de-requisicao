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

    // Verifica se já existe uma requisição ABERTA para este mesmo setor
    const existingRequisition = await prisma.requisition.findFirst({
      where: {
        storeId,
        sectorId,
        status: "ABERTA", // Busca a requisição que ainda não foi concluída
      },
      include: {
        items: true,
      },
    });

    if (existingRequisition) {
      // Faz o merge dos itens novos na requisição aberta
      for (const incomingItem of items) {
        const existingDbItem = existingRequisition.items.find(
          (i) => i.itemId === incomingItem.itemId,
        );

        if (existingDbItem) {
          // Se o insumo já está na requisição, SOMA a quantidade
          await prisma.requisitionItem.update({
            where: { id: existingDbItem.id },
            data: { quantity: existingDbItem.quantity + incomingItem.quantity },
          });
        } else {
          // Se é um insumo novo, adiciona à requisição existente
          await prisma.requisitionItem.create({
            data: {
              requisitionId: existingRequisition.id,
              itemId: incomingItem.itemId,
              quantity: incomingItem.quantity,
            },
          });
        }
      }

      // Atualiza a data de modificação
      await prisma.requisition.update({
        where: { id: existingRequisition.id },
        data: { updatedAt: new Date() },
      });

      revalidatePath("/historico");
      return { success: true, requisition: existingRequisition };
    } else {
      // Se não tem requisição aberta, cria uma NOVA com o status ABERTA
      const requisition = await prisma.requisition.create({
        data: {
          storeId,
          sectorId,
          status: "ABERTA", // Força o status para ABERTA
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
    }
  } catch (error) {
    console.error("Erro ao criar/atualizar requisição:", error);
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

export async function updateRequisitionStatus(
  requisitionId: string,
  status: string,
) {
  try {
    const updated = await prisma.requisition.update({
      where: { id: requisitionId },
      data: { status },
    });

    revalidatePath("/historico");
    return { success: true, requisition: updated };
  } catch (error) {
    console.error("Erro ao atualizar status da requisição:", error);
    return { success: false, error: "Falha ao atualizar o status." };
  }
}

// ==========================================
// NOVAS FUNÇÕES PARA O PASSO 4 (EDIÇÃO)
// ==========================================

export async function deleteRequisition(requisitionId: string) {
  try {
    // O Prisma deleta os itens automaticamente por causa do onDelete: Cascade
    await prisma.requisition.delete({
      where: { id: requisitionId },
    });

    revalidatePath("/historico");
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir requisição:", error);
    return { success: false, error: "Falha ao excluir a requisição inteira." };
  }
}

export async function deleteRequisitionItem(itemId: string) {
  try {
    await prisma.requisitionItem.delete({
      where: { id: itemId },
    });

    revalidatePath("/historico");
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir item da requisição:", error);
    return { success: false, error: "Falha ao excluir o item." };
  }
}

export async function updateRequisitionDate(
  requisitionId: string,
  newDate: Date,
) {
  try {
    const updated = await prisma.requisition.update({
      where: { id: requisitionId },
      data: { createdAt: newDate }, // Editamos a data de criação base
    });

    revalidatePath("/historico");
    return { success: true, requisition: updated };
  } catch (error) {
    console.error("Erro ao atualizar data da requisição:", error);
    return { success: false, error: "Falha ao atualizar a data." };
  }
}
