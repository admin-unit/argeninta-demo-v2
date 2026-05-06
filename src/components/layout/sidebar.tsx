"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/actions/auth";
import { useTransition } from "react";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const NAV_ITEMS = [
  { label: "Expedientes", href: "/expedientes", icon: FolderIcon },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSignOut() {
    startTransition(async () => {
      await signOut();
      router.push("/login");
      router.refresh();
    });
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
                A
              </span>
            </div>
            <span className="text-[14px] font-semibold text-sidebar-accent-foreground tracking-tight truncate">
              Argeninta
            </span>
          </div>
        )}

        {collapsed && (
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-bold tracking-tight">
              A
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
        {!collapsed && (
          <p className="px-2.5 mb-1.5 text-[10.5px] font-semibold uppercase tracking-widest text-sidebar-foreground/40 whitespace-nowrap">
            Principal
          </p>
        )}

        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center rounded-md text-[13px] font-medium transition-colors duration-100",
                collapsed
                  ? "justify-center w-10 h-10 mx-auto"
                  : "gap-2.5 px-2.5 py-2",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon
                size={15}
                className={cn("shrink-0", !isActive && "opacity-60")}
              />
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        className={cn(
          "border-t border-sidebar-border shrink-0",
          collapsed ? "px-2 py-3" : "px-2 py-3"
        )}
      >
        {/* Expand button when collapsed */}
        {collapsed && (
          <button
            onClick={onToggle}
            title="Expandir"
            className="w-10 h-10 mx-auto flex items-center justify-center rounded-md text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 transition-colors"
          >
            <ChevronRightIcon size={14} />
          </button>
        )}

        {!collapsed && (
          <button
            onClick={handleSignOut}
            disabled={isPending}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] font-medium text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground transition-colors duration-100 disabled:opacity-50"
          >
            <LogOutIcon size={15} className="opacity-60 shrink-0" />
            Cerrar sesión
          </button>
        )}
      </div>
    </aside>
  );
}

function FolderIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function LogOutIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function ChevronLeftIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRightIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
