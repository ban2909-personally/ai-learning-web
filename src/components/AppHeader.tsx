import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'

export function AppHeader() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const signOut = async () => {
    await logout()
    navigate('/')
  }

  return (
    <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight text-ink">
          <span className="grid size-9 place-items-center rounded-xl bg-brand-600 text-sm font-bold text-white">AI</span>
          Learning
        </Link>
        <nav className="flex items-center gap-3 text-sm" aria-label="Điều hướng chính">
          <NavLink to="/" className="hidden text-slate-600 hover:text-ink sm:block">Khóa học</NavLink>
          {user ? (
            <>
              <NavLink to="/dashboard" className="rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100">
                Không gian học
              </NavLink>
              <button onClick={signOut} className="rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50">
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100">Đăng nhập</NavLink>
              <NavLink to="/register" className="rounded-lg bg-ink px-4 py-2 font-medium text-white hover:bg-slate-700">
                Học miễn phí
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
