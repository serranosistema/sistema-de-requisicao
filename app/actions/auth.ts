"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs"; // <-- Importamos a biblioteca

export async function loginComSenha(senhaDigitada: string) {
  try {
    // Busca o usuário padrão no banco
    const user = await prisma.user.findFirst();

    if (!user) {
      return {
        sucesso: false,
        erro: "Nenhum usuário encontrado no banco de dados.",
      };
    }

    // Compara a senha digitada em texto com o hash salvo no banco
    const senhaCorreta = await bcrypt.compare(senhaDigitada, user.password);

    if (senhaCorreta) {
      // Dica: Em um sistema real, você configuraria um Cookie de sessão aqui!
      return { sucesso: true };
    } else {
      return { sucesso: false, erro: "Senha incorreta. Tente novamente." };
    }
  } catch (error) {
    console.error("Erro ao conectar no banco:", error);
    return { sucesso: false, erro: "Erro interno no servidor." };
  }
}
