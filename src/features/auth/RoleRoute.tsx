import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { hasRole } from './roles'

export function RoleRoute({ roles }: { roles: string[] }) {
  const { user, isLoading } = useAuth()
  if (isLoading)
    return (
      <main className="page-container">Đang kiểm tra phiên đăng nhập...</main>
    )
  if (!user) return <Navigate to="/login" replace />
  if (!hasRole(user.roles, roles))
    return (
      <main className="page-container">
        <div role="alert" className="notice">
          Tài khoản của bạn không có quyền truy cập khu vực này.
        </div>
      </main>
    )
  return <Outlet />
}
