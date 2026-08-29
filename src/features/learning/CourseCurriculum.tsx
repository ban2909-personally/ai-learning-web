import type { CourseCurriculum as Curriculum } from '../../types/learning'

type Props = {
  curriculum: Curriculum
  activeLessonId?: string
  onSelectLesson?: (lessonId: string) => void
}

export function CourseCurriculum({ curriculum, activeLessonId, onSelectLesson }: Props) {
  return (
    <div className="space-y-4">
      {curriculum.sections.map((section) => (
        <section key={section.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <h3 className="border-b border-slate-100 bg-slate-50 px-5 py-4 font-semibold">{section.title}</h3>
          <ol className="divide-y divide-slate-100">
            {section.lessons.map((lesson) => (
              <li key={lesson.id}>
                <button type="button" disabled={!onSelectLesson}
                  onClick={() => onSelectLesson?.(lesson.id)}
                  className={`flex w-full items-center justify-between gap-4 px-5 py-4 text-left ${activeLessonId === lesson.id ? 'bg-brand-50' : 'hover:bg-slate-50'} disabled:cursor-default`}>
                  <span>
                    <span className="font-medium text-ink">{lesson.title}</span>
                    {lesson.preview && <span className="ml-2 rounded-full bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-700">Xem thử</span>}
                  </span>
                  <span className="shrink-0 text-xs text-slate-500">{Math.ceil(lesson.durationSeconds / 60)} phút</span>
                </button>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  )
}
