import { Link } from 'react-router-dom'
import type { CourseSummary } from '../../types/catalog'
import { formatCourseDuration, formatCourseLevel, formatCoursePrice } from './catalogFormatters'

export function CourseCard({ course }: { course: CourseSummary }) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card transition hover:-translate-y-1">
      <div className="grid aspect-[16/9] place-items-center bg-gradient-to-br from-slate-900 via-slate-800 to-brand-700 text-4xl font-bold text-white/90">
        {course.thumbnailUrl ? (
          <img src={course.thumbnailUrl} alt="" className="size-full object-cover" />
        ) : (
          <span>{course.category.name.slice(0, 2).toUpperCase()}</span>
        )}
      </div>
      <div className="p-6">
        <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wide text-brand-700">
          <span>{course.category.name}</span>
          <span className="text-slate-500">{formatCourseLevel(course.level)}</span>
        </div>
        <h2 className="mt-3 text-xl font-semibold leading-snug group-hover:text-brand-700">
          <Link to={`/courses/${course.slug}`}>{course.title}</Link>
        </h2>
        <p className="mt-3 line-clamp-2 min-h-12 text-sm leading-6 text-slate-600">{course.shortDescription}</p>
        <p className="mt-4 text-sm text-slate-500">{course.instructorName} · {formatCourseDuration(course.estimatedDurationMinutes)}</p>
        <p className="mt-5 text-lg font-bold text-ink">{formatCoursePrice(course.price, course.currency)}</p>
      </div>
    </article>
  )
}
