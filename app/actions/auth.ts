// ARQUIVO: app/actions/auth.ts
"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

export async function loginComSenha(senhaDigitada: string) {
  try {
    const user = await prisma.user.findFirst();

    if (!user) {
      return {
        sucesso: false,
        erro: "Nenhum usuário encontrado no banco de dados.",
      };
    }

    const senhaCorreta = await bcrypt.compare(senhaDigitada, user.password);

    if (senhaCorreta) {
      const cookieStore = await cookies();
      cookieStore.set("session_token", "authenticated", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });

      return { sucesso: true };
    } else {
      return { sucesso: false, erro: "Senha incorreta. Tente novamente." };
    }
  } catch (error) {
    console.error("Erro ao conectar no banco:", error);
    return { sucesso: false, erro: "Erro interno no servidor." };
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("session_token");
}
