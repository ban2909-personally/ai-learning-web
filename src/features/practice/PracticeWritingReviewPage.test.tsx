import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PracticeWritingReviewPage } from './PracticeWritingReviewPage'

const request = vi.hoisted(() => vi.fn())
vi.mock('../auth/AuthContext', () => ({ useAuth: () => ({ request }) }))

describe('PracticeWritingReviewPage', () => {
  afterEach(() => vi.resetAllMocks())

  it('sends four rubric scores and feedback for a pending submission', async () => {
    request.mockImplementation(async (path: string) => {
      if (path === '/practice/reviews/pending')
        return [
          {
            attemptId: 'attempt-1',
            questionId: 'question-1',
            examTitle: 'English Workplace Starter',
            prompt: 'Write an email.',
            answer: 'I suggest an email workshop.',
            submittedAt: '2026-09-27T10:00:00Z',
          },
        ]
      return { feedback: 'Clear idea.' }
    })
    render(<PracticeWritingReviewPage />)

    expect(
      (await screen.findAllByText('I suggest an email workshop.')).length,
    ).toBe(2)
    const selectors = screen.getAllByRole('combobox')
    fireEvent.change(selectors[0], { target: { value: '4' } })
    fireEvent.change(selectors[1], { target: { value: '3' } })
    fireEvent.change(selectors[2], { target: { value: '4' } })
    fireEvent.change(selectors[3], { target: { value: '5' } })
    fireEvent.change(screen.getByLabelText('Nhận xét cho học viên'), {
      target: { value: 'Clear idea; improve transitions.' },
    })
    fireEvent.click(
      screen.getByRole('button', { name: /Lưu điểm và nhận xét/ }),
    )

    await waitFor(() =>
      expect(request).toHaveBeenCalledWith(
        '/practice/attempts/attempt-1/writing/question-1/review',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({
            taskScore: 4,
            coherenceScore: 3,
            vocabularyScore: 4,
            grammarScore: 5,
            feedback: 'Clear idea; improve transitions.',
          }),
        }),
      ),
    )
    expect(
      await screen.findByText('Không còn bài viết chờ chấm.'),
    ).toBeInTheDocument()
  })
})
