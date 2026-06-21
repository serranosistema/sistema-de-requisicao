"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Função auxiliar para obter a única loja existente de momento
async function getDefaultStoreId() {
  const store = await prisma.store.findFirst();
  if (!store) {
    throw new Error(
      "Nenhuma loja encontrada na base de dados. Crie uma loja primeiro.",
    );
  }
  return store.id;
}

export async function getSectors() {
  try {
    const storeId = await getDefaultStoreId();
    return await prisma.sector.findMany({
      where: { storeId },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("Erro ao procurar setores:", error);
    return [];
  }
}

export async function createSector(name: string) {
  try {
    const storeId = await getDefaultStoreId();
    const sector = await prisma.sector.create({
      data: { name, storeId },
    });
    revalidatePath("/admin");
    return { success: true, sector };
  } catch (error) {
    console.error("Erro ao criar setor:", error);
    return { success: false, error: "Não foi possível criar o setor." };
  }
}

export async function updateSector(id: string, name: string) {
  try {
    const sector = await prisma.sector.update({
      where: { id },
      data: { name },
    });
    revalidatePath("/admin");
    return { success: true, sector };
  } catch (error) {
    console.error("Erro ao atualizar setor:", error);
    return { success: false, error: "Não foi possível atualizar o setor." };
  }
}

export async function deleteSector(id: string) {
  try {
    await prisma.sector.delete({
      where: { id },
    });
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Erro ao eliminar setor:", error);
    return { success: false, error: "Não foi possível eliminar o setor." };
  }
}
