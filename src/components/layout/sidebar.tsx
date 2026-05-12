"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Role } from "@/types";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  role: Role;
}

const DEMO_USER = {
  externo: { nombre: 'María García', area: 'Administración', inicial: 'M', org: 'INTA', orgFull: 'Instituto Nac. de Tecnología Agropecuaria' },
  interno: { nombre: 'René Castro', area: 'Administración', inicial: 'R', org: 'Argeninta', orgFull: 'Asociación Argentina de Recursos Naturales' },
}

export function Sidebar({ collapsed, onToggle, role }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [orgOpen, setOrgOpen] = useState(() => pathname.startsWith('/mi-organismo'));
  const user = DEMO_USER[role];

  function handleSignOut() {
    document.cookie = 'role=; path=/; max-age=0';
    router.push('/login');
    router.refresh();
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/');
  }

  return (
    <aside
      className={cn(
        "shrink-0 flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-[width] duration-200 ease-in-out overflow-hidden",
        collapsed ? "w-14" : "w-[220px]"
      )}
    >
      {/* Logo + toggle */}
      <div className={cn(
        "flex items-center border-b border-sidebar-border shrink-0",
        collapsed ? "justify-center px-0 py-4" : "justify-between px-4 py-4"
      )}>
        {!collapsed && (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <span className="text-primary-foreground text-xs font-bold tracking-tight">
                {user.org[0]}
              </span>
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-sidebar-accent-foreground tracking-tight truncate leading-tight">
                {user.org}
              </div>
              <div className="text-[10px] text-sidebar-foreground/40 truncate leading-tight">{user.orgFull}</div>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-bold tracking-tight">{user.org[0]}</span>
          </div>
        )}
        {!collapsed && (
          <button
            onClick={onToggle}
            className="w-6 h-6 flex items-center justify-center rounded-md text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 transition-colors shrink-0"
            title="Contraer"
          >
            <ChevronLeftIcon size={14} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {role === 'externo' ? (
          <>
            <NavItem href="/mis-solicitudes" label="Mis solicitudes" icon={<DocIcon />} collapsed={collapsed} active={isActive('/mis-solicitudes')} />

            {/* Mi Organismo dropdown */}
            {!collapsed ? (
              <div>
                <button
                  onClick={() => setOrgOpen(v => !v)}
                  className={cn(
                    "w-full flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-md text-[13px] font-medium transition-colors duration-100",
                    isActive('/mi-organismo')
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    <BuildingIcon className={cn("shrink-0 w-[15px] h-[15px]", !isActive('/mi-organismo') && "opacity-60")} />
                    Mi Organismo
                  </span>
                  <ChevronDownIcon size={12} className={cn("transition-transform shrink-0", orgOpen && "rotate-180")} />
                </button>
                {orgOpen && (
                  <div className="mt-0.5 ml-4 pl-3 border-l border-sidebar-border space-y-0.5">
                    <SubNavItem href="/mi-organismo" label="Convenios" active={pathname === '/mi-organismo'} />
                    <SubNavItem href="/mi-organismo/facturas" label="Facturas" active={isActive('/mi-organismo/facturas')} />
                    <SubNavItem href="/mi-organismo/solicitudes" label="Solicitudes" active={isActive('/mi-organismo/solicitudes')} />
                    <SubNavItem href="/mi-organismo/mails" label="Mails" active={isActive('/mi-organismo/mails')} />
                  </div>
                )}
              </div>
            ) : (
              <NavItem href="/mi-organismo" label="Mi Organismo" icon={<BuildingIcon />} collapsed={collapsed} active={isActive('/mi-organismo')} />
            )}
          </>
        ) : (
          <>
            <NavItem href="/dashboard" label="Bandeja de entrada" icon={<InboxIcon />} collapsed={collapsed} active={isActive('/dashboard')} />
            <NavItem href="/organismos" label="Organismos" icon={<BuildingIcon />} collapsed={collapsed} active={isActive('/organismos')} />
            <NavItem href="/convenios" label="Convenios" icon={<FileTextIcon />} collapsed={collapsed} active={isActive('/convenios')} />
            <NavItem href="/facturas" label="Facturas" icon={<ReceiptIcon />} collapsed={collapsed} active={isActive('/facturas')} />
            <NavItem href="/bandeja-nacional" label="Solicitudes" icon={<DocIcon />} collapsed={collapsed} active={isActive('/bandeja-nacional') || isActive('/bandeja-internacional')} />
          </>
        )}
      </nav>

      {/* Footer: user + sign out */}
      <div className={cn("border-t border-sidebar-border shrink-0 px-2 py-3")}>
        {collapsed ? (
          <button
            onClick={onToggle}
            title="Expandir"
            className="w-10 h-10 mx-auto flex items-center justify-center rounded-md text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 transition-colors"
          >
            <ChevronRightIcon size={14} />
          </button>
        ) : (
          <div className="space-y-0.5">
            <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-md">
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <span className="text-primary text-xs font-bold">{user.inicial}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[12.5px] font-semibold text-sidebar-accent-foreground truncate leading-tight">{user.nombre}</div>
                <div className="text-[11px] text-sidebar-foreground/40 truncate leading-tight">{user.area}</div>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] font-medium text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground transition-colors duration-100"
            >
              <LogOutIcon size={15} className="opacity-60 shrink-0" />
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

function NavItem({ href, label, icon, collapsed, active }: { href: string; label: string; icon: React.ReactNode; collapsed: boolean; active: boolean }) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        "flex items-center rounded-md text-[13px] font-medium transition-colors duration-100",
        collapsed ? "justify-center w-10 h-10 mx-auto" : "gap-2.5 px-2.5 py-2",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
      )}
    >
      <span className={cn("shrink-0 w-[15px] h-[15px]", !active && "opacity-60")}>{icon}</span>
      {!collapsed && label}
    </Link>
  );
}

function SubNavItem({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "block px-2.5 py-1.5 rounded-md text-[12.5px] font-medium transition-colors duration-100",
        active
          ? "text-sidebar-accent-foreground bg-sidebar-accent/60"
          : "text-sidebar-foreground/60 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/40"
      )}
    >
      {label}
    </Link>
  );
}

function InboxIcon({ className }: { className?: string }) {
  return <svg className={className} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" /></svg>;
}
function DocIcon({ className }: { className?: string }) {
  return <svg className={className} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
}
function BuildingIcon({ className }: { className?: string }) {
  return <svg className={className} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
}
function FileTextIcon({ className }: { className?: string }) {
  return <svg className={className} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>;
}
function ReceiptIcon({ className }: { className?: string }) {
  return <svg className={className} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
}
function LogOutIcon({ size = 16, className }: { size?: number; className?: string }) {
  return <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>;
}
function ChevronLeftIcon({ size = 16, className }: { size?: number; className?: string }) {
  return <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>;
}
function ChevronRightIcon({ size = 16, className }: { size?: number; className?: string }) {
  return <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>;
}
function ChevronDownIcon({ size = 16, className }: { size?: number; className?: string }) {
  return <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>;
}
