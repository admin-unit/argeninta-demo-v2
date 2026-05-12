import { cookies } from 'next/headers'
import { HomeExterno } from './home-externo'
import { HomeInterno } from './home-interno'
import type { Role } from '@/types'

export default async function Dashboard() {
  const cookieStore = await cookies()
  const role = (cookieStore.get('role')?.value ?? 'externo') as Role
  return role === 'externo' ? <HomeExterno /> : <HomeInterno />
}
