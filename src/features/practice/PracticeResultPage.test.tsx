import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PracticeResultPage } from './PracticeResultPage'

const request = vi.hoisted(() => vi.fn())
vi.mock('../auth/AuthContext', () => ({ useAuth: () => ({ request }) }))

describe('PracticeResultPage', () => {
  afterEach(() => vi.resetAllMocks())

  it('does not label an unanswered writing prompt as waiting for review', async () => {
    request.mockImplementation(async (path: string) =>
      path.endsWith('/result')
        ? {
            attemptId: 'a',
            examTitle: 'English practice',
            correct: 0,
            total: 0,
            sections: [
              {
                skill: 'WRITING',
                title: 'Writing',
                correct: 0,
                total: 0,
                questions: [
                  {
                    questionId: 'q',
                    answer: '',
                    status: 'UNANSWERED',
                    correct: null,
                    writingFeedback: null,
                  },
                ],
              },
            ],
          }
        : {
            id: 'a',
            status: 'SUBMITTED',
            answers: {},
            exam: {
              sections: [
                {
                  title: 'Writing',
                  passage: 'Write an email.',
                  questions: [{ id: 'q', prompt: 'Write an email.' }],
                },
              ],
            },
          },
    )
    render(
      <MemoryRouter initialEntries={['/practice/attempts/a/result']}>
        <Routes>
          <Route
            path="/practice/attempts/:id/result"
            element={<PracticeResultPage />}
          />
        </Routes>
      </MemoryRouter>,
    )
    expect(await screen.findByText('Chưa làm')).toBeInTheDocument()
    expect(screen.queryByText('Chờ chấm')).not.toBeInTheDocument()
  })

  it('shows reviewed writing rubric without mixing it into objective score', async () => {
    request.mockImplementation(async (path: string) =>
      path.endsWith('/result')
        ? {
            attemptId: 'a',
            examTitle: 'English Workplace Starter',
            correct: 1,
            total: 2,
            sections: [
              {
                skill: 'READING',
                title: 'Reading',
                correct: 1,
                total: 2,
                questions: [],
              },
              {
                skill: 'WRITING',
                title: 'Writing',
                correct: 0,
                total: 0,
                questions: [
                  {
                    questionId: 'q',
                    answer: 'My email',
                    correct: null,
                    correctAnswer: null,
                    explanation: null,
                    status: 'REVIEWED',
                    writingFeedback: {
                      taskScore: 4,
                      coherenceScore: 3,
                      vocabularyScore: 5,
                      grammarScore: 4,
                      totalScore: 16,
                      feedback: 'Strong ideas; improve linking words.',
                    },
                  },
                ],
              },
            ],
          }
        : {
            id: 'a',
            status: 'SUBMITTED',
            answers: { q: 'My email' },
            exam: {
              slug: 'sample',
              title: 'English Workplace Starter',
              description: '',
              durationMinutes: 20,
              sections: [
                {
                  id: 'r',
                  skill: 'READING',
                  title: 'Reading',
                  passage: 'A passage.',
                  audioText: null,
                  questions: [],
                },
                {
                  id: 'w',
                  skill: 'WRITING',
                  title: 'Writing',
                  passage: 'Write an email.',
                  audioText: null,
                  questions: [
                    {
                      id: 'q',
                      kind: 'WRITING',
                      prompt: 'Write an email.',
                      options: [],
                    },
                  ],
                },
              ],
            },
          },
    )

    render(
      <MemoryRouter initialEntries={['/practice/attempts/a/result']}>
        <Routes>
          <Route
            path="/practice/attempts/:id/result"
            element={<PracticeResultPage />}
          />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('1/2')).toBeInTheDocument()
    expect(screen.getByText('16/20')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: 'Viết' }))
    expect(
      screen.getByText('Strong ideas; improve linking words.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Đáp ứng đề bài: 4/5')).toBeInTheDocument()
  })
})
