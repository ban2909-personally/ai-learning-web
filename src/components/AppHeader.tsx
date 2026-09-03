import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'

export function AppHeader() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const canManageCourses = user?.roles.some((role) => role === 'INSTRUCTOR' || role === 'ADMIN') ?? false

  const signOut = async () => {
    await logout()
    navigate('/')
  }

  return (
    <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight text-ink">
          <span className="grid size-9 place-items-center rounded-xl bg-brand-600 text-sm font-bold text-white">AI</span>
          <span className="hidden sm:inline">Learning</span>
        </Link>
        <nav className="flex items-center gap-3 text-sm" aria-label="Điều hướng chính">
          <NavLink to="/courses" className="hidden text-slate-600 hover:text-ink md:block">Khóa học</NavLink>
          {user ? (
            <>
              <NavLink to="/my-learning" className="rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100">
                Không gian học
              </NavLink>
              {canManageCourses && (
                <NavLink to="/courses" className="hidden rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100 lg:block">
                  Quản lý nội dung
                </NavLink>
              )}
              <button onClick={signOut} className="rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50">
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="rounded-lg px-2 py-2 text-slate-700 hover:bg-slate-100 sm:px-3">Đăng nhập</NavLink>
              <NavLink to="/register" className="rounded-lg bg-ink px-3 py-2 font-medium text-white hover:bg-slate-700 sm:px-4">
                <span className="sm:hidden">Bắt đầu</span><span className="hidden sm:inline">Học miễn phí</span>
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
