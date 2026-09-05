import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../../lib/api'
import type { LearningAnalytics } from '../../types/analytics'
import type { Enrollment } from '../../types/learning'
import { useAuth } from '../auth/AuthContext'
import {
  formatCompletedLessons,
  formatLearningTimestamp,
  joinLearningAnalytics,
} from './learningAnalytics'

type InsightsState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; analytics: LearningAnalytics; enrollments: Enrollment[] }

export function LearningInsightsPage() {
  const { request, user } = useAuth()
  const [reloadVersion, setReloadVersion] = useState(0)
  const [state, setState] = useState<InsightsState>({ status: 'loading' })

  useEffect(() => {
    let active = true
    setState({ status: 'loading' })

    Promise.all([
      request<LearningAnalytics>('/me/learning-analytics?courseLimit=20'),
      request<Enrollment[]>('/me/enrollments'),
    ])
      .then(([analytics, enrollments]) => {
        if (active) setState({ status: 'ready', analytics, enrollments })
      })
      .catch((caught: unknown) => {
        if (!active) return
        setState({
          status: 'error',
          message: caught instanceof ApiError
            ? caught.message
            : 'Không thể tải tổng quan học tập lúc này.',
        })
      })

    return () => {
      active = false
    }
  }, [reloadVersion, request])

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-5 sm:py-12">
      <section className="overflow-hidden rounded-[2rem] bg-ink px-6 py-8 text-white shadow-card sm:px-10 sm:py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Tổng quan học tập</p>
        <div className="mt-3 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
              Chào {user?.displayName ?? 'bạn'}, hôm nay mình tiến thêm một bước nhé.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              Xem những bài đã hoàn thành, hoạt động gần nhất và quay lại đúng khóa học bạn đang theo đuổi.
            </p>
          </div>
          <Link
            to="/my-learning"
            className="inline-flex min-h-11 w-fit items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-emerald-50"
          >
            Mở khóa học của tôi
          </Link>
        </div>
      </section>

      {state.status === 'loading' && <InsightsLoading />}
      {state.status === 'error' && (
        <InsightsError
          message={state.message}
          onRetry={() => setReloadVersion((version) => version + 1)}
        />
      )}
      {state.status === 'ready' && <InsightsContent {...state} />}
    </main>
  )
}

function InsightsLoading() {
  return (
    <section className="mt-8" aria-live="polite" aria-busy="true">
      <p role="status" className="text-sm font-medium text-slate-600">Đang tổng hợp hoạt động học tập...</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-3" aria-hidden="true">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white" />
        ))}
      </div>
    </section>
  )
}

function InsightsError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <section role="alert" className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900">
      <h2 className="text-lg font-semibold">Chưa tải được tổng quan</h2>
      <p className="mt-2 text-sm leading-6 text-red-800">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 min-h-11 rounded-xl bg-red-700 px-5 py-2 text-sm font-semibold text-white hover:bg-red-800"
      >
        Thử tải lại
      </button>
    </section>
  )
}

function InsightsContent({
  analytics,
  enrollments,
}: Extract<InsightsState, { status: 'ready' }>) {
  if (analytics.completedLessons === 0) return <InsightsEmpty />

  const courses = joinLearningAnalytics(analytics, enrollments)
  return (
    <>
      <section className="mt-8 grid gap-4 sm:grid-cols-3" aria-label="Chỉ số học tập">
        <MetricCard
          label="Bài học đã hoàn thành"
          value={new Intl.NumberFormat('vi-VN').format(analytics.completedLessons)}
          detail="Tổng số lần hoàn thành đầu tiên"
        />
        <MetricCard
          label="Khóa học có hoạt động"
          value={new Intl.NumberFormat('vi-VN').format(analytics.coursesWithCompletions)}
          detail="Khóa học đã có ít nhất một bài hoàn thành"
        />
        <MetricCard
          label="Hoạt động gần nhất"
          value={formatLearningTimestamp(analytics.lastCompletedAt)}
          detail="Theo múi giờ trên thiết bị của bạn"
          compact
        />
      </section>

      <section className="mt-10" aria-labelledby="course-insights-title">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">Nhịp học gần đây</p>
            <h2 id="course-insights-title" className="mt-2 text-2xl font-semibold tracking-tight text-ink">
              Hoạt động theo khóa học
            </h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-slate-500">
            Hiển thị tối đa 20 khóa học, ưu tiên hoạt động mới nhất.
          </p>
        </div>

        {courses.length === 0 ? (
          <p className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
            Chi tiết theo khóa học đang được đồng bộ. Tổng số hoàn thành của bạn vẫn được bảo toàn.
          </p>
        ) : (
          <ol className="mt-5 grid gap-4" aria-label="Hoạt động hoàn thành theo khóa học">
            {courses.map((course, index) => (
              <li key={course.courseId}>
                <article className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-6">
                  <span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-sm font-bold text-brand-700" aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-semibold text-ink">{course.courseTitle}</h3>
                    <p className="mt-1 text-sm font-medium text-brand-700">
                      {formatCompletedLessons(course.completedLessons)}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      Gần nhất: <time dateTime={course.lastCompletedAt}>{formatLearningTimestamp(course.lastCompletedAt)}</time>
                    </p>
                    {!course.metadataAvailable && (
                      <p className="mt-2 text-xs text-amber-700">Thông tin khóa học đang được đồng bộ.</p>
                    )}
                  </div>
                  {course.courseSlug && (
                    <Link
                      to={`/learn/${encodeURIComponent(course.courseSlug)}`}
                      className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-ink hover:border-brand-500 hover:text-brand-700"
                    >
                      Tiếp tục học
                    </Link>
                  )}
                </article>
              </li>
            ))}
          </ol>
        )}
      </section>
    </>
  )
}

function MetricCard({
  label,
  value,
  detail,
  compact = false,
}: {
  label: string
  value: string
  detail: string
  compact?: boolean
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className={`mt-3 font-semibold text-ink ${compact ? 'text-lg leading-7' : 'text-3xl'}`}>{value}</p>
      <p className="mt-3 text-xs leading-5 text-slate-500">{detail}</p>
    </article>
  )
}

function InsightsEmpty() {
  return (
    <section className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center sm:px-10">
      <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand-50 text-xl" aria-hidden="true">✓</span>
      <h2 className="mt-4 text-xl font-semibold text-ink">Hoàn thành bài học đầu tiên để mở tổng quan</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">
        Khi bạn đánh dấu hoàn thành một bài, hoạt động sẽ xuất hiện tại đây để bạn theo dõi nhịp học của mình.
      </p>
      <Link to="/my-learning" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700">
        Đi tới khóa học của tôi
      </Link>
    </section>
  )
}
