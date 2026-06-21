import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// A função agora deve se chamar 'proxy' em vez de 'middleware'
export function proxy(request: NextRequest) {
  // Verifica se o cookie de sessão existe
  const session = request.cookies.get("session_token");
  const { pathname } = request.nextUrl;

  // Se o usuário NÃO está logado e tenta acessar uma página protegida, manda para o /login
  if (!session && pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Se o usuário JÁ está logado e tenta acessar o /login, manda direto para o /dashboard
  if (session && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

// Configura quais caminhos vão acionar este proxy
export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/admin/:path*",
    "/requisicao/:path*",
    "/historico/:path*",
    "/login",
  ],
};
