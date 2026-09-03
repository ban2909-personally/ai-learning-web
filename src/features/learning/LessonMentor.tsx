import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ApiError, type ServerSentEvent } from '../../lib/api'
import type {
  MentorAcceptedEvent,
  MentorCompletedEvent,
  MentorDeltaEvent,
  MentorErrorEvent,
  MentorMessage,
} from '../../types/learning'
import { useAuth } from '../auth/AuthContext'

type LessonMentorProps = {
  courseSlug: string
  lessonId: string
}

export function LessonMentor({ courseSlug, lessonId }: LessonMentorProps) {
  const { request, stream } = useAuth()
  const [messages, setMessages] = useState<MentorMessage[]>([])
  const [question, setQuestion] = useState('')
  const [draftAnswer, setDraftAnswer] = useState('')
  const [remainingQuota, setRemainingQuota] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const path = `/me/courses/${encodeURIComponent(courseSlug)}/lessons/${lessonId}/mentor/messages`

  useEffect(() => {
    let active = true
    setLoading(true)
    setMessages([])
    setDraftAnswer('')
    setError(null)
    request<MentorMessage[]>(path)
      .then((history) => {
        if (active) setMessages(history)
      })
      .catch((caught: unknown) => {
        if (active) setError(messageOf(caught, 'Không thể tải lịch sử AI Mentor.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [path, request])

  useEffect(() => {
    if (typeof endRef.current?.scrollIntoView === 'function') {
      endRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [draftAnswer, messages])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const normalized = question.trim()
    if (!normalized || sending) return
    setSending(true)
    setError(null)
    setDraftAnswer('')
    try {
      let streamFailed = false
      await stream(path, {
        method: 'POST',
        body: JSON.stringify({ question: normalized }),
      }, (streamEvent) => {
        if (streamEvent.event === 'error') streamFailed = true
        handleEvent(streamEvent)
      })
      if (!streamFailed) setQuestion('')
    } catch (caught: unknown) {
      setError(messageOf(caught, 'Không thể nhận câu trả lời từ AI Mentor.'))
    } finally {
      setSending(false)
    }
  }

  const handleEvent = ({ event, data }: ServerSentEvent) => {
    if (event === 'message') {
      const accepted = JSON.parse(data) as MentorAcceptedEvent
      setMessages((current) => [...current, accepted.message])
      setRemainingQuota(accepted.remainingQuota)
      return
    }
    if (event === 'delta') {
      const delta = JSON.parse(data) as MentorDeltaEvent
      setDraftAnswer((current) => current + delta.text)
      return
    }
    if (event === 'complete') {
      const completed = JSON.parse(data) as MentorCompletedEvent
      setMessages((current) => [...current, completed.message])
      setDraftAnswer('')
      setRemainingQuota(completed.remainingQuota)
      return
    }
    if (event === 'error') {
      const failed = JSON.parse(data) as MentorErrorEvent
      setDraftAnswer('')
      setError(failed.detail)
    }
  }

  return (
    <section aria-labelledby="mentor-title" className="overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm">
      <header className="bg-gradient-to-r from-indigo-700 to-violet-600 px-5 py-4 text-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-100">Đồng hành theo bài học</p>
            <h2 id="mentor-title" className="mt-1 text-xl font-semibold">AI Mentor</h2>
          </div>
          {remainingQuota !== null && (
            <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium" aria-label={`${remainingQuota} lượt hỏi còn lại`}>
              {remainingQuota} lượt
            </span>
          )}
        </div>
        <p className="mt-2 text-sm leading-5 text-indigo-100">Gợi mở hướng giải quyết, không làm bài thay bạn.</p>
      </header>

      <div aria-live="polite" className="max-h-[26rem] min-h-56 space-y-3 overflow-y-auto bg-slate-50 px-4 py-4">
        {loading && <p className="text-sm text-slate-500">Đang tải cuộc trò chuyện...</p>}
        {!loading && messages.length === 0 && !draftAnswer && (
          <div className="rounded-xl border border-dashed border-indigo-200 bg-white p-4 text-sm leading-6 text-slate-600">
            Hỏi về khái niệm, cách tiếp cận hoặc đoạn code bạn đang vướng trong bài này.
          </div>
        )}
        {messages.map((message) => (
          <article key={message.id} className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-6 ${
            message.role === 'USER'
              ? 'ml-auto bg-indigo-700 text-white'
              : 'border border-slate-200 bg-white text-slate-700'
          }`}>
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          </article>
        ))}
        {draftAnswer && (
          <article className="max-w-[90%] rounded-2xl border border-indigo-100 bg-white px-4 py-3 text-sm leading-6 text-slate-700">
            <p className="whitespace-pre-wrap break-words">{draftAnswer}</p>
            <span className="mt-2 inline-block h-2 w-2 animate-pulse rounded-full bg-indigo-500" aria-label="AI Mentor đang trả lời" />
          </article>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={(event) => void submit(event)} className="border-t border-slate-200 p-4">
        {error && <p role="alert" className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <label htmlFor="mentor-question" className="sr-only">Câu hỏi cho AI Mentor</label>
        <textarea
          id="mentor-question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          maxLength={4000}
          rows={3}
          disabled={sending}
          placeholder="Bạn đang vướng ở đâu?"
          className="block w-full resize-none rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-100"
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-xs text-slate-400">{question.length}/4000</span>
          <button
            type="submit"
            disabled={sending || !question.trim()}
            className="rounded-xl bg-indigo-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? 'Đang suy nghĩ...' : 'Gửi câu hỏi'}
          </button>
        </div>
      </form>
    </section>
  )
}

function messageOf(caught: unknown, fallback: string) {
  return caught instanceof ApiError ? caught.message : fallback
}
