import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { apiRequest, ApiError } from '../../lib/api'
import type { CourseCurriculum, LessonPlayer, LessonProgress } from '../../types/learning'
import { useAuth } from '../auth/AuthContext'
import { CourseCurriculum as CurriculumList } from './CourseCurriculum'
import { LessonContentPlayer } from './LessonContentPlayer'
import { LessonMentor } from './LessonMentor'

export function LessonPlayerPage() {
  const { slug } = useParams()
  const { request } = useAuth()
  const [curriculum, setCurriculum] = useState<CourseCurriculum | null>(null)
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null)
  const [lesson, setLesson] = useState<LessonPlayer | null>(null)
  const [progress, setProgress] = useState<LessonProgress | null>(null)
  const [position, setPosition] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const lessons = useMemo(() => curriculum?.sections.flatMap((section) => section.lessons) ?? [], [curriculum])

  useEffect(() => {
    if (!slug) return
    apiRequest<CourseCurriculum>(`/courses/${encodeURIComponent(slug)}/curriculum`)
      .then((value) => {
        setCurriculum(value)
        setActiveLessonId(value.sections.flatMap((section) => section.lessons)[0]?.id ?? null)
      })
      .catch((caught: unknown) => setError(caught instanceof ApiError ? caught.message : 'Không thể tải giáo trình.'))
  }, [slug])

  useEffect(() => {
    if (!slug || !activeLessonId) return
    setLesson(null)
    setError(null)
    Promise.all([
      request<LessonPlayer>(`/me/courses/${encodeURIComponent(slug)}/lessons/${activeLessonId}`),
      request<LessonProgress>(`/me/courses/${encodeURIComponent(slug)}/lessons/${activeLessonId}/progress`),
    ]).then(([lessonValue, progressValue]) => {
      setLesson(lessonValue)
      setProgress(progressValue)
      setPosition(progressValue.positionSeconds)
    }).catch((caught: unknown) => setError(caught instanceof ApiError ? caught.message : 'Không thể mở bài học.'))
  }, [activeLessonId, request, slug])

  const saveProgress = async (completed = false) => {
    if (!slug || !activeLessonId) return
    const saved = await request<LessonProgress>(`/me/courses/${encodeURIComponent(slug)}/lessons/${activeLessonId}/progress`, {
      method: 'PUT', body: JSON.stringify({ positionSeconds: position, completed }),
    })
    setProgress(saved)
  }

  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      <Link to="/my-learning" className="text-sm font-semibold text-brand-700 hover:underline">← Không gian học</Link>
      <div className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section>
          <div className="aspect-video overflow-hidden rounded-2xl bg-ink shadow-card">
            {lesson?.contentUrl ? <LessonContentPlayer
              lesson={lesson}
              resumeAt={progress?.positionSeconds ?? 0}
              onPositionChange={setPosition}
            /> :
              <div className="grid h-full place-items-center text-slate-300">Đang tải bài học...</div>}
          </div>
          {error && <div role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-red-700">{error}</div>}
          {lesson && <>
            <h1 className="mt-6 text-3xl font-semibold">{lesson.title}</h1>
            <div className="mt-5 flex flex-wrap items-end gap-4 rounded-2xl border border-slate-200 bg-white p-5">
              <label className="flex-1 text-sm font-medium">Vị trí hiện tại: {position}s
                <input type="range" min="0" max={lesson.durationSeconds} value={position}
                  onChange={(event) => setPosition(Number(event.target.value))} className="mt-2 block w-full" />
              </label>
              <button onClick={() => void saveProgress(false)} className="rounded-xl border border-brand-600 px-4 py-2 font-semibold text-brand-700">Lưu vị trí</button>
              <button onClick={() => void saveProgress(true)} className="rounded-xl bg-brand-600 px-4 py-2 font-semibold text-white">Hoàn thành</button>
            </div>
            {progress?.completed && <p className="mt-3 font-medium text-emerald-700">Bạn đã hoàn thành bài học này.</p>}
          </>}
        </section>
        <aside className="space-y-7">
          {slug && lesson && <LessonMentor courseSlug={slug} lessonId={lesson.lessonId} />}
          <section>
            <h2 className="mb-4 text-xl font-semibold">{curriculum?.courseTitle ?? 'Nội dung khóa học'}</h2>
            {curriculum && <CurriculumList curriculum={curriculum} activeLessonId={activeLessonId ?? undefined} onSelectLesson={setActiveLessonId} />}
            {lessons.length === 0 && curriculum && <p className="text-sm text-slate-500">Giáo trình đang được cập nhật.</p>}
          </section>
        </aside>
      </div>
    </main>
  )
}
