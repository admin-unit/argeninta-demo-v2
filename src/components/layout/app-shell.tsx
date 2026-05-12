"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "./sidebar";
import type { Role } from "@/types";

export function AppShell({ children, role }: { children: React.ReactNode; role: Role }) {
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
      <Sidebar collapsed={collapsed} onToggle={toggle} role={role} />
      <main className="flex-1 overflow-y-auto min-w-0">{children}</main>
    </div>
  );
}
