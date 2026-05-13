"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { signInAsDemo } from "@/app/actions/auth";

interface AuthFormProps {
  mode: "login" | "register";
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const label = mode === "login" ? "Iniciar sesión" : "Crear cuenta";

  function handleSubmit() {
    if (!isEmailValid || isPending) return;
    setError(null);
    startTransition(async () => {
      try {
        await signInAsDemo(email);
        router.replace("/dashboard");
        router.refresh();
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  return (
    <div className="w-full max-w-[380px]">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 mb-6">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-semibold tracking-tight">
              A
            </span>
          </div>
          <span className="text-[15px] font-semibold text-foreground tracking-tight">
            Argeninta
          </span>
        </div>
        <h1 className="text-[22px] font-semibold text-foreground tracking-tight leading-tight">
          {label}
        </h1>
        <p className="text-[13px] text-muted-foreground mt-1.5">
          Demo — ingresá con tu email
        </p>
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="nombre@empresa.com"
            autoFocus
            className="w-full h-10 px-3.5 rounded-lg border border-border bg-card text-[13.5px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10 transition-all duration-150 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
          />

          <button
            onClick={handleSubmit}
            disabled={!isEmailValid || isPending}
            className={cn(
              "w-full h-10 rounded-lg text-[13.5px] font-medium transition-all duration-200 flex items-center justify-center gap-2",
              isEmailValid && !isPending
                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_1px_2px_rgba(0,0,0,0.15)]"
                : "bg-muted text-muted-foreground cursor-not-allowed",
            )}
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <LoadingSpinner />
                Entrando...
              </span>
            ) : (
              "Entrar"
            )}
          </button>
        </div>

        {error && (
          <p className="text-[12.5px] text-destructive text-center">{error}</p>
        )}

        <p className="text-[11.5px] text-muted-foreground text-center pt-2">
          Modo demo · acceso sin verificación
        </p>
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <svg
      className="animate-spin"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

