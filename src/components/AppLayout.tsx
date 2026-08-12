import { Outlet } from 'react-router-dom'
import { AppHeader } from './AppHeader'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-[#f8faf9] text-ink">
      <AppHeader />
      <Outlet />
    </div>
  )
}
