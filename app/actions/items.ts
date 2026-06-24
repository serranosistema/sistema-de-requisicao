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
          select: { id: true, code: true, name: true },
        },
      },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("Erro ao procurar itens:", error);
    return [];
  }
}

// Adicionamos o 'code' nos parâmetros e inteligência para "ressuscitar" itens
export async function createItem(data: {
  code: string;
  name: string;
  unit: string;
  cost?: number;
  sectorIds: string[];
}) {
  try {
    const storeId = await getDefaultStoreId();

    // 1. Verifica se o item já existe no banco (mesmo que esteja na lixeira / isActive: false)
    const existingItem = await prisma.item.findFirst({
      where: {
        code: data.code,
        storeId: storeId,
      },
    });

    let item;

    if (existingItem) {
      // 2. Se o item existe, nós "ressuscitamos" ele e atualizamos os dados
      item = await prisma.item.update({
        where: { id: existingItem.id },
        data: {
          name: data.name,
          unit: data.unit,
          cost: data.cost,
          isActive: true, // <-- Tira da lixeira!
          sectors: {
            set: data.sectorIds.map((id) => ({ id })), // Sobrescreve os setores
          },
        },
      });
    } else {
      // 3. Se não existe de jeito nenhum, cria do zero
      item = await prisma.item.create({
        data: {
          code: data.code,
          name: data.name,
          unit: data.unit,
          cost: data.cost,
          storeId,
          sectors: {
            connect: data.sectorIds.map((id) => ({ id })),
          },
        },
      });
    }

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

export async function deleteAllItems() {
  try {
    const storeId = await getDefaultStoreId();

    await prisma.item.updateMany({
      where: {
        storeId,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir todos os itens:", error);
    return {
      success: false,
      error: "Não foi possível excluir todos os itens.",
    };
  }
}
// NOVA FUNÇÃO: Importação em Lote (Bulk) para não derrubar o Banco de Dados
export async function bulkImportData(data: {
  items: {
    code: string;
    name: string;
    unit: string;
    cost?: number;
    sectorCodes: string[];
  }[];
  sectors: { code: string; name: string }[];
}) {
  try {
    const storeId = await getDefaultStoreId();

    // 1. Puxa os setores e cria um mapa na memória (MUITO mais rápido que ir no BD toda hora)
    const dbSectors = await prisma.sector.findMany({ where: { storeId } });
    const sectorCodeMap = new Map(
      dbSectors.map((s) => [s.code.toUpperCase(), s.id]),
    );

    // 2. Cria os setores que faltam em lote
    for (const sec of data.sectors) {
      if (!sectorCodeMap.has(sec.code.toUpperCase())) {
        const newSec = await prisma.sector.create({
          data: { code: sec.code, name: sec.name, storeId },
        });
        sectorCodeMap.set(newSec.code.toUpperCase(), newSec.id);
      }
    }

    // 3. Puxa os itens e cria um mapa na memória
    const dbItems = await prisma.item.findMany({
      where: { storeId },
      include: { sectors: true },
    });
    const itemCodeMap = new Map(dbItems.map((i) => [i.code.toUpperCase(), i]));

    let successCount = 0;
    let updatedCount = 0;

    // 4. Processa os itens usando os mapas de memória (Zero gargalo de rede)
    for (const csvItem of data.items) {
      const idsDosSetores = csvItem.sectorCodes
        .map((code) => sectorCodeMap.get(code.toUpperCase()))
        .filter(Boolean) as string[];

      const existingItem = itemCodeMap.get(csvItem.code.toUpperCase());

      if (existingItem) {
        const existingSectorIds = existingItem.sectors.map((s) => s.id);
        const mergedSectorIds = Array.from(
          new Set([...existingSectorIds, ...idsDosSetores]),
        );

        await prisma.item.update({
          where: { id: existingItem.id },
          data: {
            name: csvItem.name || existingItem.name,
            unit: csvItem.unit || existingItem.unit,
            isActive: true, // Ressuscita se estiver na lixeira
            sectors: { set: mergedSectorIds.map((id) => ({ id })) },
          },
        });
        updatedCount++;
      } else {
        await prisma.item.create({
          data: {
            code: csvItem.code,
            name: csvItem.name,
            unit: csvItem.unit,
            storeId,
            sectors: { connect: idsDosSetores.map((id) => ({ id })) },
          },
        });
        successCount++;
      }
    }

    revalidatePath("/admin");
    return { success: true, successCount, updatedCount };
  } catch (error) {
    console.error("Erro no Bulk Import:", error);
    return {
      success: false,
      error: "Falha catastrófica ao processar o lote no servidor.",
    };
  }
}
