import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError, apiRequest } from '../../lib/api'
import type { CourseCurriculum, LessonMedia } from '../../types/learning'
import { useAuth } from '../auth/AuthContext'

type UploadState = {
  file?: File
  progress: number
  uploading: boolean
  completed: boolean
  error?: string
}

export function LessonMediaManagerPage() {
  const { slug } = useParams()
  const { user, upload } = useAuth()
  const [curriculum, setCurriculum] = useState<CourseCurriculum | null>(null)
  const [pageError, setPageError] = useState<string | null>(null)
  const [uploads, setUploads] = useState<Record<string, UploadState>>({})
  const canManage = user?.roles.some((role) => role === 'INSTRUCTOR' || role === 'ADMIN') ?? false

  useEffect(() => {
    if (!slug || !canManage) return
    apiRequest<CourseCurriculum>(`/courses/${encodeURIComponent(slug)}/curriculum`)
      .then(setCurriculum)
      .catch((caught: unknown) => setPageError(
        caught instanceof ApiError ? caught.message : 'Không thể tải giáo trình khóa học.',
      ))
  }, [canManage, slug])

  if (!canManage) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-16">
        <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
          Tài khoản của bạn không có quyền quản lý nội dung khóa học.
        </div>
      </main>
    )
  }

  const updateState = (lessonId: string, patch: Partial<UploadState>) => {
    setUploads((current) => ({
      ...current,
      [lessonId]: {
        ...(current[lessonId] ?? { progress: 0, uploading: false, completed: false }),
        ...patch,
      },
    }))
  }

  const submit = async (lessonId: string) => {
    if (!slug) return
    const file = uploads[lessonId]?.file
    if (!file) return
    const form = new FormData()
    form.append('file', file)
    updateState(lessonId, { uploading: true, completed: false, error: undefined, progress: 0 })
    try {
      await upload<LessonMedia>(
        `/instructor/courses/${encodeURIComponent(slug)}/lessons/${lessonId}/media`,
        form,
        (progress) => updateState(lessonId, { progress }),
      )
      updateState(lessonId, { uploading: false, completed: true, progress: 100 })
    } catch (caught) {
      updateState(lessonId, {
        uploading: false,
        error: caught instanceof ApiError ? caught.message : 'Không thể tải video lên.',
      })
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-10 sm:py-14">
      <Link to={slug ? `/courses/${slug}` : '/courses'} className="text-sm font-semibold text-brand-700 hover:underline">
        ← Quay lại khóa học
      </Link>
      <div className="mt-7 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">Nội dung giảng dạy</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Video bài học
        </h1>
        <p className="mt-4 leading-7 text-slate-600">
          Tải video MP4 hoặc WebM, tối đa 2 GB. Video mới chỉ được công bố cho học viên có quyền truy cập bài học.
        </p>
      </div>

      {pageError && <div role="alert" className="mt-8 rounded-xl bg-red-50 p-4 text-red-700">{pageError}</div>}
      {!curriculum && !pageError && <p className="mt-10 text-slate-500">Đang tải danh sách bài học...</p>}

      <div className="mt-10 space-y-8">
        {curriculum?.sections.map((section) => (
          <section key={section.id} aria-labelledby={`section-${section.id}`}>
            <h2 id={`section-${section.id}`} className="text-xl font-semibold">{section.title}</h2>
            <div className="mt-4 space-y-3">
              {section.lessons.map((lesson) => {
                const state = uploads[lesson.id]
                return (
                  <article key={lesson.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="font-semibold text-ink">{lesson.title}</h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {lesson.preview ? 'Bài học xem trước' : 'Chỉ dành cho học viên đã ghi danh'}
                        </p>
                      </div>
                      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
                        <label className="min-w-0 cursor-pointer rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50">
                          <span className="block max-w-56 truncate">{state?.file?.name ?? 'Chọn video'}</span>
                          <input
                            type="file"
                            accept="video/mp4,video/webm"
                            className="sr-only"
                            aria-label={`Chọn video cho ${lesson.title}`}
                            onChange={(event) => updateState(lesson.id, {
                              file: event.target.files?.[0], completed: false, error: undefined, progress: 0,
                            })}
                          />
                        </label>
                        <button
                          type="button"
                          disabled={!state?.file || state.uploading}
                          onClick={() => void submit(lesson.id)}
                          className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {state?.uploading ? `${state.progress}%` : 'Tải lên'}
                        </button>
                      </div>
                    </div>
                    {state?.uploading && (
                      <progress className="mt-4 h-2 w-full accent-brand-600" max="100" value={state.progress}>
                        {state.progress}%
                      </progress>
                    )}
                    {state?.completed && <p className="mt-3 text-sm font-medium text-emerald-700">Đã cập nhật video.</p>}
                    {state?.error && <p role="alert" className="mt-3 text-sm text-red-700">{state.error}</p>}
                  </article>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  )
}
