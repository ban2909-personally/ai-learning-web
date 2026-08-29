import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { apiRequest, ApiError } from '../../lib/api'
import type { CourseDetail } from '../../types/catalog'
import { formatCourseDuration, formatCourseLevel, formatCoursePrice } from './catalogFormatters'
import { EnrollmentButton } from '../learning/EnrollmentButton'

export function CourseDetailPage() {
  const { slug } = useParams()
  const [course, setCourse] = useState<CourseDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    apiRequest<CourseDetail>(`/courses/${encodeURIComponent(slug)}`)
      .then(setCourse)
      .catch((caught: unknown) => setError(
        caught instanceof ApiError ? caught.message : 'Không thể tải thông tin khóa học.',
      ))
  }, [slug])

  if (error) {
    return <main className="mx-auto max-w-4xl px-5 py-20"><div role="alert" className="rounded-2xl bg-red-50 p-6 text-red-700">{error}</div></main>
  }
  if (!course) {
    return <main className="grid min-h-[60vh] place-items-center text-slate-500">Đang tải khóa học...</main>
  }

  return (
    <main>
      <section className="bg-ink text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 lg:grid-cols-[1fr_340px] lg:items-center">
          <div>
            <Link to="/courses" className="text-sm font-medium text-brand-100 hover:text-white">← Danh mục khóa học</Link>
            <p className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-brand-100">{course.category.name}</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">{course.title}</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">{course.shortDescription}</p>
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-300">
              <span>{formatCourseLevel(course.level)}</span>
              <span>{formatCourseDuration(course.estimatedDurationMinutes)}</span>
              <span>Giảng viên {course.instructorName}</span>
            </div>
          </div>
          <aside className="rounded-2xl bg-white p-7 text-ink shadow-2xl">
            <p className="text-3xl font-bold">{formatCoursePrice(course.price, course.currency)}</p>
            <EnrollmentButton courseSlug={course.slug} price={course.price} />
            <p className="mt-4 text-center text-xs text-slate-500">Ghi danh miễn phí ngay; khóa trả phí cần hoàn tất checkout.</p>
          </aside>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-semibold">Bạn sẽ học được gì?</h2>
          <p className="mt-5 whitespace-pre-line text-lg leading-8 text-slate-600">{course.description}</p>
        </div>
      </section>
    </main>
  )
}
