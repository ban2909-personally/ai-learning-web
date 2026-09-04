import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiRequest } from '../../lib/api'
import { useAuth } from '../auth/AuthContext'
import { LessonMediaManagerPage } from './LessonMediaManagerPage'

vi.mock('../../lib/api', async (original) => {
  const actual = await original<typeof import('../../lib/api')>()
  return { ...actual, apiRequest: vi.fn() }
})
vi.mock('../auth/AuthContext', () => ({ useAuth: vi.fn() }))

describe('LessonMediaManagerPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('uploads a selected lesson video and reports progress', async () => {
    vi.mocked(apiRequest).mockResolvedValue({
      courseId: 'course-1', courseSlug: 'spring', courseTitle: 'Spring', sections: [{
        id: 'section-1', title: 'Khởi động', order: 0, lessons: [{
          id: 'lesson-1', title: 'Giới thiệu', durationSeconds: 90, preview: false, contentUrl: null, order: 0,
        }],
      }],
    })
    const upload = vi.fn().mockImplementation(async (_path, _body, onProgress) => {
      onProgress(60)
      return { lessonId: 'lesson-1' }
    })
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'instructor-1', email: 'teacher@example.com', displayName: 'Teacher', roles: ['INSTRUCTOR'] },
      accessToken: 'token', isLoading: false, request: vi.fn(), upload,
      getAccessToken: vi.fn().mockResolvedValue('token'),
      stream: vi.fn(), login: vi.fn(), register: vi.fn(), logout: vi.fn(),
    })

    render(<MemoryRouter initialEntries={['/instructor/courses/spring/media']}><Routes>
      <Route path="/instructor/courses/:slug/media" element={<LessonMediaManagerPage />} />
    </Routes></MemoryRouter>)

    const input = await screen.findByLabelText('Chọn video cho Giới thiệu')
    const file = new File(['video'], 'lesson.mp4', { type: 'video/mp4' })
    fireEvent.change(input, { target: { files: [file] } })
    screen.getByRole('button', { name: 'Tải lên' }).click()

    await waitFor(() => expect(upload).toHaveBeenCalledWith(
      '/instructor/courses/spring/lessons/lesson-1/media',
      expect.any(FormData),
      expect.any(Function),
    ))
    expect(await screen.findByText('Đã cập nhật video.')).toBeInTheDocument()
  })
})
