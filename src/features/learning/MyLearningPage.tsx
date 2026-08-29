import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../../lib/api'
import type { Enrollment } from '../../types/learning'
import { useAuth } from '../auth/AuthContext'
import { formatCourseDuration, formatCourseLevel } from '../catalog/catalogFormatters'

export function MyLearningPage() {
  const { user, request } = useAuth()
  const [enrollments, setEnrollments] = useState<Enrollment[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    request<Enrollment[]>('/me/enrollments')
      .then(setEnrollments)
      .catch((caught: unknown) => setError(
        caught instanceof ApiError ? caught.message : 'Không thể tải danh sách khóa học của bạn.',
      ))
  }, [request])

  return (
    <main className="mx-auto max-w-6xl px-5 py-12">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">Không gian học</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Khóa học của {user?.displayName}</h1>
      <p className="mt-3 text-slate-600">Tiếp tục từ nơi bạn đã dừng và theo dõi lộ trình học tập.</p>
      {error && <div role="alert" className="mt-8 rounded-2xl bg-red-50 p-5 text-red-700">{error}</div>}
      {!error && enrollments === null && <p className="mt-10 text-slate-500">Đang tải khóa học...</p>}
      {enrollments?.length === 0 && (
        <section className="mt-9 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="font-medium">Bạn chưa ghi danh khóa học nào.</p>
          <Link to="/courses" className="mt-4 inline-block font-semibold text-brand-700 hover:underline">Khám phá khóa học</Link>
        </section>
      )}
      {enrollments && enrollments.length > 0 && (
        <section className="mt-9 grid gap-5 md:grid-cols-2" aria-label="Khóa học đã ghi danh">
          {enrollments.map(({ id, course, status }) => (
            <article key={id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">{course.category.name}</p>
              <h2 className="mt-3 text-xl font-semibold">{course.title}</h2>
              <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{course.shortDescription}</p>
              <div className="mt-5 flex gap-4 text-xs text-slate-500">
                <span>{formatCourseLevel(course.level)}</span>
                <span>{formatCourseDuration(course.estimatedDurationMinutes)}</span>
              </div>
              <div className="mt-6 flex items-center justify-between gap-4">
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{status}</span>
                <span className="text-right text-sm text-slate-500">Bài học đang được chuẩn bị</span>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  )
}
