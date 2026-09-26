import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ApiError } from '../../lib/api'
import { useAuth } from './AuthContext'

type AuthPageProps = { mode: 'login' | 'register' }

export function AuthPage({ mode }: AuthPageProps) {
  const isRegister = mode === 'register'
  const { user, login, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isSubmitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (user) return <Navigate to="/" replace />

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    const data = new FormData(event.currentTarget)
    try {
      const credentials = {
        email: String(data.get('email')),
        password: String(data.get('password')),
      }
      if (isRegister) {
        await register({
          ...credentials,
          displayName: String(data.get('displayName')),
        })
      } else {
        await login(credentials)
      }
      const destination =
        (location.state as { from?: string } | null)?.from ?? '/'
      navigate(destination, { replace: true })
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Đã có lỗi xảy ra. Vui lòng thử lại.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-story">
        <span className="auth-story-tag">
          <i /> CỘNG ĐỒNG HỌC TẬP DÀNH CHO BẠN
        </span>
        <h1>
          Học hỏi, kết nối và <em>tiến bộ mỗi ngày.</em>
        </h1>
        <p>
          Từ một câu hỏi nhỏ đến một kỹ năng mới — hành trình học tập thú vị hơn
          khi có người đồng hành.
        </p>
        <div className="auth-story-card" aria-hidden="true">
          <span className="auth-story-avatar">A</span>
          <div>
            <strong>Mỗi ngày một điều mới</strong>
            <small>Khám phá câu chuyện từ cộng đồng</small>
          </div>
          <span className="auth-story-spark">✦</span>
        </div>
        <div className="auth-story-benefits">
          <span>✓ Chia sẻ kiến thức</span>
          <span>✓ Học theo lộ trình</span>
          <span>✓ Kết nối hội nhóm</span>
        </div>
      </section>

      <section className="auth-form-card">
        <span className="auth-form-eyebrow">AI LEARNING</span>
        <h2 className="text-2xl font-semibold">
          {isRegister ? 'Tạo tài khoản học viên' : 'Chào mừng bạn quay lại'}
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          {isRegister
            ? 'Bắt đầu lộ trình học đầu tiên của bạn.'
            : 'Tiếp tục từ nơi bạn đã dừng lại.'}
        </p>

        <form className="mt-7 space-y-5" onSubmit={submit}>
          {isRegister && (
            <label className="block text-sm font-medium">
              Tên hiển thị
              <input
                name="displayName"
                required
                minLength={2}
                maxLength={120}
                autoComplete="name"
                className="field"
              />
            </label>
          )}
          <label className="block text-sm font-medium">
            Email
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="field"
            />
          </label>
          <label className="block text-sm font-medium">
            Mật khẩu
            <input
              name="password"
              type="password"
              required
              minLength={isRegister ? 8 : undefined}
              maxLength={72}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              className="field"
            />
            {isRegister && (
              <span className="mt-2 block text-xs font-normal text-slate-500">
                8–72 ký tự, có chữ và số.
              </span>
            )}
          </label>
          {error && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-brand-600 px-4 py-3 font-semibold text-white hover:bg-brand-700 disabled:cursor-wait disabled:opacity-60"
          >
            {isSubmitting
              ? 'Đang xử lý...'
              : isRegister
                ? 'Tạo tài khoản'
                : 'Đăng nhập'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          {isRegister ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}{' '}
          <Link
            className="font-semibold text-brand-700 hover:underline"
            to={isRegister ? '/login' : '/register'}
          >
            {isRegister ? 'Đăng nhập' : 'Đăng ký ngay'}
          </Link>
        </p>
      </section>
    </main>
  )
}
