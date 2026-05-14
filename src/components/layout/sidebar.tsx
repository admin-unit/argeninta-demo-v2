"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/actions/auth";
import type { Role } from "@/types";

type ShortcutKey =
  | "organismos"
  | "convenios"
  | "facturas"
  | "bandeja-mails"
  | "nacional"
  | "internacional";

const SHORTCUT_DEFS: Record<
  ShortcutKey,
  { href: string; label: string; icon: React.ReactNode; requiresInbox?: boolean }
> = {
  organismos: { href: "/organismos", label: "Organismos", icon: <BuildingIcon /> },
  convenios: { href: "/convenios", label: "Convenios", icon: <FileTextIcon /> },
  facturas: { href: "/facturas", label: "Facturas", icon: <ReceiptIcon /> },
  "bandeja-mails": {
    href: "/bandeja/mails",
    label: "Bandeja de mails",
    icon: <MailIcon />,
    requiresInbox: true,
  },
  nacional: { href: "/bandeja-nacional", label: "Nacional", icon: <DocIcon /> },
  internacional: { href: "/bandeja-internacional", label: "Internacional", icon: <GlobeIcon /> },
};

const DEFAULT_ORDER: ShortcutKey[] = [
  "organismos",
  "convenios",
  "facturas",
  "bandeja-mails",
  "nacional",
  "internacional",
];

const PREFS_KEY = "sidebar-shortcuts-v1";

interface SidebarShortcutPrefs {
  visible: ShortcutKey[];
  hidden: ShortcutKey[];
}

function loadPrefs(): SidebarShortcutPrefs {
  if (typeof window === "undefined") {
    return { visible: DEFAULT_ORDER, hidden: [] };
  }
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return { visible: DEFAULT_ORDER, hidden: [] };
    const parsed = JSON.parse(raw) as Partial<SidebarShortcutPrefs>;
    const allKeys = Object.keys(SHORTCUT_DEFS) as ShortcutKey[];
    const visible = (parsed.visible ?? []).filter((k): k is ShortcutKey => allKeys.includes(k));
    const hidden = (parsed.hidden ?? []).filter((k): k is ShortcutKey => allKeys.includes(k));
    const seen = new Set([...visible, ...hidden]);
    for (const k of DEFAULT_ORDER) if (!seen.has(k)) visible.push(k);
    return { visible, hidden };
  } catch {
    return { visible: DEFAULT_ORDER, hidden: [] };
  }
}

function savePrefs(prefs: SidebarShortcutPrefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {}
}

export interface SidebarUser {
  /** Nombre real desde profiles.full_name (fallback: email) */
  full_name: string;
  /** Iniciales calculadas (1-2 chars) */
  initials: string;
  /** Lo que se muestra debajo del nombre — área o organismo según role */
  subtitle: string;
  /** Lo que va arriba del sidebar (corto) */
  organization_short: string;
  /** Texto largo del header */
  organization_long: string;
}

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  role: Role;
  user: SidebarUser;
  isSuperAdmin: boolean;
  canAccessInbox: boolean;
}

export function Sidebar({ collapsed, onToggle, role, user, isSuperAdmin, canAccessInbox }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [orgOpen, setOrgOpen] = useState(() => pathname.startsWith("/mi-organismo"));
  const [, startTransition] = useTransition();
  const [prefs, setPrefs] = useState<SidebarShortcutPrefs>({ visible: DEFAULT_ORDER, hidden: [] });
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    setPrefs(loadPrefs());
  }, []);

  function updatePrefs(next: SidebarShortcutPrefs) {
    setPrefs(next);
    savePrefs(next);
  }

  function toggleVisible(key: ShortcutKey) {
    if (prefs.visible.includes(key)) {
      updatePrefs({
        visible: prefs.visible.filter((k) => k !== key),
        hidden: [...prefs.hidden, key],
      });
    } else {
      updatePrefs({
        visible: [...prefs.visible, key],
        hidden: prefs.hidden.filter((k) => k !== key),
      });
    }
  }

  function moveVisible(key: ShortcutKey, dir: -1 | 1) {
    const idx = prefs.visible.indexOf(key);
    const target = idx + dir;
    if (idx === -1 || target < 0 || target >= prefs.visible.length) return;
    const next = [...prefs.visible];
    [next[idx], next[target]] = [next[target], next[idx]];
    updatePrefs({ visible: next, hidden: prefs.hidden });
  }

  function resetPrefs() {
    updatePrefs({ visible: DEFAULT_ORDER, hidden: [] });
  }

  function handleSignOut() {
    startTransition(async () => {
      await signOut();
      router.push("/login");
      router.refresh();
    });
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <aside
      className={cn(
        "shrink-0 flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-[width] duration-200 ease-in-out overflow-hidden",
        collapsed ? "w-14" : "w-[220px]"
      )}
    >
      {/* Logo + toggle */}
      <div
        className={cn(
          "flex items-center border-b border-sidebar-border shrink-0",
          collapsed ? "justify-center px-0 py-4" : "justify-between px-4 py-4"
        )}
      >
        {!collapsed && (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <span className="text-primary-foreground text-xs font-bold tracking-tight">
                {user.organization_short[0]}
              </span>
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-sidebar-accent-foreground tracking-tight truncate leading-tight">
                {user.organization_short}
              </div>
              <div className="text-[10px] text-sidebar-foreground/40 truncate leading-tight">
                {user.organization_long}
              </div>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-bold tracking-tight">
              {user.organization_short[0]}
            </span>
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
        {role === "externo" ? (
          <>
            <NavItem
              href="/mis-solicitudes"
              label="Mis solicitudes"
              icon={<DocIcon />}
              collapsed={collapsed}
              active={isActive("/mis-solicitudes")}
            />

            {!collapsed ? (
              <div>
                <button
                  onClick={() => setOrgOpen((v) => !v)}
                  className={cn(
                    "w-full flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-md text-[13px] font-medium transition-colors duration-100",
                    isActive("/mi-organismo")
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    <BuildingIcon
                      className={cn(
                        "shrink-0 w-[15px] h-[15px]",
                        !isActive("/mi-organismo") && "opacity-60"
                      )}
                    />
                    Mi Organismo
                  </span>
                  <ChevronDownIcon
                    size={12}
                    className={cn("transition-transform shrink-0", orgOpen && "rotate-180")}
                  />
                </button>
                {orgOpen && (
                  <div className="mt-0.5 ml-4 pl-3 border-l border-sidebar-border space-y-0.5">
                    <SubNavItem
                      href="/mi-organismo"
                      label="Convenios"
                      active={pathname === "/mi-organismo"}
                    />
                    <SubNavItem
                      href="/mi-organismo/facturas"
                      label="Facturas"
                      active={isActive("/mi-organismo/facturas")}
                    />
                    <SubNavItem
                      href="/mi-organismo/solicitudes"
                      label="Solicitudes"
                      active={isActive("/mi-organismo/solicitudes")}
                    />
                    <SubNavItem
                      href="/mi-organismo/mails"
                      label="Mails"
                      active={isActive("/mi-organismo/mails")}
                    />
                  </div>
                )}
              </div>
            ) : (
              <NavItem
                href="/mi-organismo"
                label="Mi Organismo"
                icon={<BuildingIcon />}
                collapsed={collapsed}
                active={isActive("/mi-organismo")}
              />
            )}
          </>
        ) : (
          <>
            <NavItem
              href="/dashboard"
              label="Bandeja de entrada"
              icon={<InboxIcon />}
              collapsed={collapsed}
              active={isActive("/dashboard")}
            />

            {!collapsed && (
              <div className="flex items-center justify-between px-2.5 pt-3 pb-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                  Accesos directos
                </span>
                <button
                  onClick={() => setEditMode((v) => !v)}
                  className="text-[10px] font-medium text-sidebar-foreground/50 hover:text-sidebar-accent-foreground transition-colors"
                  title={editMode ? "Listo" : "Editar"}
                >
                  {editMode ? "Listo" : "Editar"}
                </button>
              </div>
            )}

            {editMode && !collapsed
              ? (Object.keys(SHORTCUT_DEFS) as ShortcutKey[])
                  .filter((k) => !SHORTCUT_DEFS[k].requiresInbox || canAccessInbox)
                  .sort((a, b) => {
                    const ia = prefs.visible.indexOf(a);
                    const ib = prefs.visible.indexOf(b);
                    if (ia !== -1 && ib !== -1) return ia - ib;
                    if (ia !== -1) return -1;
                    if (ib !== -1) return 1;
                    return 0;
                  })
                  .map((key) => {
                    const def = SHORTCUT_DEFS[key];
                    const visible = prefs.visible.includes(key);
                    const idx = prefs.visible.indexOf(key);
                    return (
                      <EditRow
                        key={key}
                        label={def.label}
                        icon={def.icon}
                        visible={visible}
                        canMoveUp={visible && idx > 0}
                        canMoveDown={visible && idx < prefs.visible.length - 1}
                        onToggle={() => toggleVisible(key)}
                        onMoveUp={() => moveVisible(key, -1)}
                        onMoveDown={() => moveVisible(key, 1)}
                      />
                    );
                  })
              : prefs.visible
                  .filter((k) => !SHORTCUT_DEFS[k].requiresInbox || canAccessInbox)
                  .map((key) => {
                    const def = SHORTCUT_DEFS[key];
                    return (
                      <NavItem
                        key={key}
                        href={def.href}
                        label={def.label}
                        icon={def.icon}
                        collapsed={collapsed}
                        active={isActive(def.href)}
                      />
                    );
                  })}

            {editMode && !collapsed && (
              <button
                onClick={resetPrefs}
                className="w-full mt-2 px-2.5 py-1.5 text-[11px] font-medium text-sidebar-foreground/50 hover:text-sidebar-accent-foreground transition-colors text-left"
              >
                Restablecer
              </button>
            )}
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
            <Link
              href="/perfil"
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-sidebar-accent/60 transition-colors group"
            >
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/30 transition-colors">
                <span className="text-primary text-xs font-bold">{user.initials}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <div className="text-[12.5px] font-semibold text-sidebar-accent-foreground truncate leading-tight">
                    {user.full_name}
                  </div>
                  {isSuperAdmin && (
                    <span
                      title="Super admin"
                      className="shrink-0 text-[9px] font-bold uppercase tracking-wider px-1 py-px rounded bg-amber-100 text-amber-700 border border-amber-200"
                    >
                      admin
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-sidebar-foreground/40 truncate leading-tight">
                  {user.subtitle}
                </div>
              </div>
            </Link>
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

function EditRow({
  label,
  icon,
  visible,
  canMoveUp,
  canMoveDown,
  onToggle,
  onMoveUp,
  onMoveDown,
}: {
  label: string;
  icon: React.ReactNode;
  visible: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onToggle: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[13px] font-medium text-sidebar-accent-foreground"
      )}
    >
      <button
        onClick={onToggle}
        className={cn(
          "shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors",
          visible
            ? "bg-primary border-primary text-primary-foreground hover:opacity-90"
            : "bg-sidebar border-dashed border-sidebar-foreground/40 hover:border-sidebar-foreground/70"
        )}
        title={visible ? "Ocultar" : "Mostrar"}
      >
        {visible && (
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>
      <span className={cn("shrink-0 w-[15px] h-[15px]", !visible && "opacity-50")}>{icon}</span>
      <span className={cn("flex-1 truncate", !visible && "text-sidebar-foreground/70")}>
        {label}
      </span>
      <button
        onClick={onMoveUp}
        disabled={!canMoveUp}
        className="shrink-0 w-5 h-5 flex items-center justify-center rounded text-sidebar-foreground/50 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/60 transition-colors disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed"
        title="Subir"
      >
        <ArrowUpIcon size={11} />
      </button>
      <button
        onClick={onMoveDown}
        disabled={!canMoveDown}
        className="shrink-0 w-5 h-5 flex items-center justify-center rounded text-sidebar-foreground/50 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/60 transition-colors disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed"
        title="Bajar"
      >
        <ArrowDownIcon size={11} />
      </button>
    </div>
  );
}

function ArrowUpIcon({ size = 12 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}

function ArrowDownIcon({ size = 12 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function NavItem({
  href,
  label,
  icon,
  collapsed,
  active,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  collapsed: boolean;
  active: boolean;
}) {
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

function MailIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}
function InboxIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
    </svg>
  );
}
function DocIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}
function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15 15 0 010 20M12 2a15 15 0 000 20" />
    </svg>
  );
}
function BuildingIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}
function FileTextIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}
function ReceiptIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  );
}
function LogOutIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
function ChevronLeftIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
function ChevronRightIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
function ChevronDownIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
