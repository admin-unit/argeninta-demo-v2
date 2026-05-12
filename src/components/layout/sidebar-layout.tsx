'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from './sidebar'

export function SidebarLayout({
  role,
  children,
}: {
  role: 'externo' | 'interno'
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed')
    if (stored === 'true') setCollapsed(true)
  }, [])

  function toggle() {
    setCollapsed(prev => {
      localStorage.setItem('sidebar-collapsed', String(!prev))
      return !prev
    })
  }

  return (
    <div className="flex h-full">
      <Sidebar role={role} collapsed={collapsed} onToggle={toggle} />
      <main
        className="flex-1 min-h-full bg-muted/40 transition-[margin] duration-200"
        style={{ marginLeft: collapsed ? 60 : 224 }}
      >
        {children}
      </main>
    </div>
  )
}
