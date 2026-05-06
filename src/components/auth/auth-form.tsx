"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { signInWithMagicLink, getGoogleOAuthUrl } from "@/app/actions/auth";

interface AuthFormProps {
  mode: "login" | "register";
}

export function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isGooglePending, startGoogleTransition] = useTransition();

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const label = mode === "login" ? "Iniciar sesión" : "Crear cuenta";
  const switchHref = mode === "login" ? "/register" : "/login";
  const switchLabel =
    mode === "login"
      ? "¿No tenés cuenta? Registrate"
      : "¿Ya tenés cuenta? Iniciá sesión";

  function handleGoogleLogin() {
    setError(null);
    startGoogleTransition(async () => {
      try {
        const url = await getGoogleOAuthUrl();
        if (url) window.location.href = url;
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  function handleSendLink() {
    if (!isEmailValid || isPending || sent) return;
    setError(null);
    startTransition(async () => {
      try {
        await signInWithMagicLink(email);
        setSent(true);
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
          {mode === "login" ? "Accedé a tu cuenta" : "Empezá a usar Argeninta"}
        </p>
      </div>

      <div className="space-y-3">
        <button
          onClick={handleGoogleLogin}
          disabled={isGooglePending}
          className="w-full h-10 flex items-center justify-center gap-2.5 rounded-lg border border-border bg-card text-[13.5px] font-medium text-foreground hover:bg-muted hover:border-border/80 transition-all duration-150 shadow-[0_1px_2px_rgba(0,0,0,0.05)] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isGooglePending ? <LoadingSpinner /> : <GoogleIcon />}
          Continuar con Google
        </button>

        <div className="flex items-center gap-3 py-1">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[12px] text-muted-foreground font-medium">o</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="space-y-2">
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setSent(false);
              setError(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSendLink()}
            placeholder="nombre@empresa.com"
            className="w-full h-10 px-3.5 rounded-lg border border-border bg-card text-[13.5px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10 transition-all duration-150 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
          />

          <button
            onClick={handleSendLink}
            disabled={!isEmailValid || isPending}
            className={cn(
              "w-full h-10 rounded-lg text-[13.5px] font-medium transition-all duration-200 flex items-center justify-center gap-2",
              isEmailValid && !isPending
                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_1px_2px_rgba(0,0,0,0.15)]"
                : "bg-muted text-muted-foreground cursor-not-allowed",
              sent && "bg-emerald-600 text-white hover:bg-emerald-600"
            )}
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <LoadingSpinner />
                Enviando...
              </span>
            ) : sent ? (
              <span className="flex items-center gap-2">
                <CheckIcon />
                Link enviado — revisá tu mail
              </span>
            ) : (
              "Enviar link de acceso"
            )}
          </button>
        </div>

        {error && (
          <p className="text-[12.5px] text-destructive text-center">{error}</p>
        )}
      </div>

      <p className="mt-6 text-center text-[12.5px] text-muted-foreground">
        <a
          href={switchHref}
          className="hover:text-foreground underline underline-offset-2 transition-colors duration-150"
        >
          {switchLabel}
        </a>
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
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

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
