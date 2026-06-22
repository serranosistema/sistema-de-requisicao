"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LockClosedIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";
import { loginComSenha } from "@/app/actions/auth";

// Criamos uma tipagem rápida para o evento de instalação do Chrome
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function AuthForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Estados do PWA
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  useEffect(() => {
    // Escuta o evento nativo do Android/Chrome que diz "Estou pronto para ser instalado"
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      // Guarda o evento para disparar no clique do botão
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallBtn(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  async function handleInstallClick() {
    if (!deferredPrompt) return;

    // Dispara o popup nativo de instalação do Android
    await deferredPrompt.prompt();

    // Aguarda a resposta do usuário
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      // Se ele aceitou, escondemos o botão
      setShowInstallBtn(false);
    }

    // Limpa o evento salvo
    setDeferredPrompt(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const resultado = await loginComSenha(password);

    if (resultado.sucesso) {
      router.push("/dashboard");
    } else {
      setError(resultado.erro || "Erro ao fazer login");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-4 relative">
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

      {/* Botão Flutuante de Instalação (Aparece apenas se o evento for detectado) */}
      {showInstallBtn && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Button
            onClick={handleInstallClick}
            className="h-14 rounded-full px-8 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-primary/20 text-base font-semibold gap-2"
            size="lg"
          >
            <ArrowDownTrayIcon className="size-6" />
            Instalar App
          </Button>
        </div>
      )}
    </div>
  );
}
