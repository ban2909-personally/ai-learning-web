import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiRequest } from '../../lib/api'
import { useAuth } from '../auth/AuthContext'
import { LessonPlayerPage } from './LessonPlayerPage'

vi.mock('../../lib/api', async (original) => {
  const actual = await original<typeof import('../../lib/api')>()
  return { ...actual, apiRequest: vi.fn() }
})
vi.mock('../auth/AuthContext', () => ({ useAuth: vi.fn() }))

describe('LessonPlayerPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('restores and saves lesson progress', async () => {
    vi.mocked(apiRequest).mockResolvedValue({
      courseId: 'course-1', courseSlug: 'spring', courseTitle: 'Spring', sections: [{
        id: 'section-1', title: 'Khởi động', order: 0, lessons: [
          { id: 'lesson-1', title: 'Giới thiệu', durationSeconds: 90, preview: false, contentUrl: null, order: 0 },
        ],
      }],
    })
    const request = vi.fn()
      .mockResolvedValueOnce({ courseId: 'course-1', courseSlug: 'spring', sectionId: 'section-1',
        lessonId: 'lesson-1', title: 'Giới thiệu', contentUrl: 'https://video.test/1', durationSeconds: 90, preview: false })
      .mockResolvedValueOnce({ lessonId: 'lesson-1', positionSeconds: 12, completed: false, updatedAt: null })
      .mockResolvedValueOnce({ lessonId: 'lesson-1', positionSeconds: 30, completed: false, updatedAt: '2026-08-30T00:00:00Z' })
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'student-1', email: 'student@example.com', displayName: 'Student', roles: ['STUDENT'] },
      accessToken: 'token', isLoading: false, request, upload: vi.fn(),
      login: vi.fn(), register: vi.fn(), logout: vi.fn(),
    })

    render(<MemoryRouter initialEntries={['/learn/spring']}><Routes>
      <Route path="/learn/:slug" element={<LessonPlayerPage />} />
    </Routes></MemoryRouter>)

    expect(await screen.findByTitle('Giới thiệu')).toBeInTheDocument()
    const slider = screen.getByRole('slider')
    expect(slider).toHaveValue('12')
    fireEvent.change(slider, { target: { value: '30' } })
    screen.getByRole('button', { name: 'Lưu vị trí' }).click()

    await waitFor(() => expect(request).toHaveBeenLastCalledWith(
      '/me/courses/spring/lessons/lesson-1/progress',
      { method: 'PUT', body: JSON.stringify({ positionSeconds: 30, completed: false }) },
    ))
  })
})
