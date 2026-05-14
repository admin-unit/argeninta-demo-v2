"use client";

import { useState, useEffect } from "react";
import { Sidebar, type SidebarUser } from "./sidebar";
import type { Role } from "@/types";

interface AppShellProps {
  children: React.ReactNode;
  role: Role;
  user: SidebarUser;
  isSuperAdmin: boolean;
  canAccessInbox: boolean;
}

export function AppShell({ children, role, user, isSuperAdmin, canAccessInbox }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed");
    if (stored === "true") setCollapsed(true);
  }, []);

  function toggle() {
    setCollapsed((v) => {
      localStorage.setItem("sidebar-collapsed", String(!v));
      return !v;
    });
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        collapsed={collapsed}
        onToggle={toggle}
        role={role}
        user={user}
        isSuperAdmin={isSuperAdmin}
        canAccessInbox={canAccessInbox}
      />
      <main className="flex-1 overflow-y-auto min-w-0">{children}</main>
    </div>
  );
}
