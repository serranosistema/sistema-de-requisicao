"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LockClosedIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";
import { loginComSenha } from "@/app/actions/auth"; // <-- Importamos a Server Action

export function AuthForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Chamamos a função do servidor passando a senha
    const resultado = await loginComSenha(password);

    if (resultado.sucesso) {
      // Se a senha bateu com o banco, vai pro dashboard
      router.push("/dashboard");
    } else {
      // Se não, mostra o erro que veio do banco
      setError(resultado.erro || "Erro ao fazer login");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-black p-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Código de Acesso</Label>
            <div className="relative">
              <LockClosedIcon className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="Insira a senha"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 pl-10"
                autoFocus
              />
            </div>
            {error && <p className="text-sm text-destructive mt-1">{error}</p>}
          </div>

          <Button
            type="submit"
            size="lg"
            className="h-12 w-full text-base"
            disabled={loading || !password}
          >
            {loading ? "Acessando..." : "Entrar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
