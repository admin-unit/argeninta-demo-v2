'use client'

import { useRouter } from 'next/navigation'

export default function Login() {
  const router = useRouter()

  function entrar(role: 'externo' | 'interno') {
    document.cookie = `role=${role}; path=/; max-age=${60 * 60 * 24 * 7}`
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary rounded-2xl shadow-lg mb-5">
            <span className="text-primary-foreground font-bold text-lg tracking-tight">A</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Argeninta</h1>
          <p className="text-muted-foreground mt-2 text-[15px]">Plataforma de gestión de expedientes</p>
        </div>

        <p className="text-center text-sm font-medium text-muted-foreground mb-5 uppercase tracking-widest text-[11px]">
          ¿Cómo querés ingresar?
        </p>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => entrar('externo')}
            className="group bg-white border border-border rounded-2xl p-7 text-left hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center mb-5 group-hover:bg-primary/10 transition-colors">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <p className="font-semibold text-foreground text-[17px] mb-1.5 tracking-tight">Organismo externo</p>
            <p className="text-[13.5px] text-muted-foreground leading-relaxed">
              Enviá nuevas solicitudes y hacé seguimiento del estado de tus gestiones.
            </p>
            <div className="mt-6 flex items-center gap-1.5 text-[13px] font-semibold text-primary group-hover:gap-2.5 transition-all">
              Ingresar como organismo
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>
          </button>

          <button
            onClick={() => entrar('interno')}
            className="group bg-white border border-border rounded-2xl p-7 text-left hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center mb-5 group-hover:bg-primary/10 transition-colors">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <p className="font-semibold text-foreground text-[17px] mb-1.5 tracking-tight">Equipo Argeninta</p>
            <p className="text-[13.5px] text-muted-foreground leading-relaxed">
              Gestioná las bandejas de solicitudes y procesá los expedientes recibidos.
            </p>
            <div className="mt-6 flex items-center gap-1.5 text-[13px] font-semibold text-primary group-hover:gap-2.5 transition-all">
              Ingresar como Argeninta
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>
          </button>
        </div>

        <p className="text-center text-[12px] text-muted-foreground/50 mt-8">
          Demo — sin autenticación real
        </p>
      </div>
    </div>
  )
}
