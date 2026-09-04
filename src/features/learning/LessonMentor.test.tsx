import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ServerSentEvent } from '../../lib/api'
import { useAuth } from '../auth/AuthContext'
import { LessonMentor } from './LessonMentor'

vi.mock('../auth/AuthContext', () => ({ useAuth: vi.fn() }))

describe('LessonMentor', () => {
  beforeEach(() => vi.clearAllMocks())

  it('loads history and renders the streamed answer', async () => {
    const request = vi.fn().mockResolvedValue([{
      id: 'assistant-old', role: 'ASSISTANT', content: 'Previous hint', createdAt: '2026-09-03T10:00:00Z',
    }])
    const stream = vi.fn().mockImplementation(async (
      _path: string,
      _init: RequestInit,
      onEvent: (event: ServerSentEvent) => void,
    ) => {
      onEvent({ event: 'message', data: JSON.stringify({
        message: { id: 'user-new', role: 'USER', content: 'How?', createdAt: '2026-09-03T10:01:00Z' },
        remainingQuota: 19,
      }) })
      onEvent({ event: 'delta', data: JSON.stringify({ text: 'Start ' }) })
      onEvent({ event: 'delta', data: JSON.stringify({ text: 'small.' }) })
      onEvent({ event: 'complete', data: JSON.stringify({
        message: { id: 'assistant-new', role: 'ASSISTANT', content: 'Start small.', createdAt: '2026-09-03T10:01:01Z' },
        remainingQuota: 19,
      }) })
    })
    vi.mocked(useAuth).mockReturnValue(authValue(request, stream))

    render(<LessonMentor courseSlug="clean-spring" lessonId="lesson-1" />)

    expect(await screen.findByText('Previous hint')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Câu hỏi cho AI Mentor'), { target: { value: 'How?' } })
    fireEvent.click(screen.getByRole('button', { name: 'Gửi câu hỏi' }))

    expect(await screen.findByText('Start small.')).toBeInTheDocument()
    expect(screen.getByLabelText('19 lượt hỏi còn lại')).toBeInTheDocument()
    expect(stream).toHaveBeenCalledWith(
      '/me/courses/clean-spring/lessons/lesson-1/mentor/messages',
      { method: 'POST', body: JSON.stringify({ question: 'How?' }) },
      expect.any(Function),
    )
  })

  it('shows a safe error sent through the stream', async () => {
    const request = vi.fn().mockResolvedValue([])
    const stream = vi.fn().mockImplementation(async (
      _path: string,
      _init: RequestInit,
      onEvent: (event: ServerSentEvent) => void,
    ) => onEvent({
      event: 'error',
      data: JSON.stringify({ code: 'mentor_quota_exceeded', detail: 'Bạn đã dùng hết lượt hỏi.' }),
    }))
    vi.mocked(useAuth).mockReturnValue(authValue(request, stream))

    render(<LessonMentor courseSlug="clean-spring" lessonId="lesson-1" />)
    await waitFor(() => expect(request).toHaveBeenCalled())
    fireEvent.change(screen.getByLabelText('Câu hỏi cho AI Mentor'), { target: { value: 'How?' } })
    fireEvent.click(screen.getByRole('button', { name: 'Gửi câu hỏi' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Bạn đã dùng hết lượt hỏi.')
  })
})

function authValue(
  request: ReturnType<typeof vi.fn>,
  stream: ReturnType<typeof vi.fn>,
): ReturnType<typeof useAuth> {
  return {
    user: { id: 'student-1', email: 'student@example.com', displayName: 'Student', roles: ['STUDENT'] },
    accessToken: 'token',
    getAccessToken: vi.fn().mockResolvedValue('token'),
    isLoading: false,
    request: request as ReturnType<typeof useAuth>['request'],
    stream: stream as ReturnType<typeof useAuth>['stream'],
    upload: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  }
}
