import { useAuth } from '../auth/AuthContext'

export function DashboardPage() {
  const { user } = useAuth()

  return (
    <main className="mx-auto max-w-6xl px-5 py-12">
      <p className="text-sm font-semibold text-brand-700">KHÔNG GIAN HỌC</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Xin chào, {user?.displayName}</h1>
      <p className="mt-3 text-slate-600">Khóa học và tiến độ của bạn sẽ xuất hiện tại đây trong Phase Course Platform.</p>
      <section className="mt-9 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <p className="font-medium">Bạn chưa ghi danh khóa học nào.</p>
        <p className="mt-2 text-sm text-slate-500">Danh mục khóa học đang được xây dựng.</p>
      </section>
    </main>
  )
}
