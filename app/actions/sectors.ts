"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function getDefaultStoreId() {
  const store = await prisma.store.findFirst();
  if (!store) throw new Error("Nenhuma loja encontrada na base de dados.");
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

// Atualizado para receber 'code'
export async function createSector(data: { code: string; name: string }) {
  try {
    const storeId = await getDefaultStoreId();
    const sector = await prisma.sector.create({
      data: { code: data.code, name: data.name, storeId },
    });
    revalidatePath("/admin");
    return { success: true, sector };
  } catch (error) {
    console.error("Erro ao criar setor:", error);
    return {
      success: false,
      error: "Não foi possível criar. Verifique se o código já existe.",
    };
  }
}

// Atualizado para receber 'code'
export async function updateSector(
  id: string,
  data: { code: string; name: string },
) {
  try {
    const sector = await prisma.sector.update({
      where: { id },
      data: { code: data.code, name: data.name },
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
