import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../lib/api'
import { useAuth } from '../auth/AuthContext'
import { LearningInsightsPage } from './LearningInsightsPage'

vi.mock('../auth/AuthContext', () => ({ useAuth: vi.fn() }))
const mockedUseAuth = vi.mocked(useAuth)
type AuthValue = ReturnType<typeof useAuth>

const user: NonNullable<AuthValue['user']> = {
  id: 'student-1',
  email: 'student@example.com',
  displayName: 'Bản Test',
  roles: ['STUDENT'],
}

function authValue(request: ReturnType<typeof vi.fn>): AuthValue {
  return {
    user,
    accessToken: 'token',
    isLoading: false,
    request: request as AuthValue['request'],
    getAccessToken: vi.fn().mockResolvedValue('token'),
    stream: vi.fn(),
    upload: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  }
}

describe('LearningInsightsPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders bounded learner analytics joined with enrollment metadata', async () => {
    const request = vi.fn((path: string) => Promise.resolve(path.includes('learning-analytics') ? {
      completedLessons: 4,
      coursesWithCompletions: 1,
      lastCompletedAt: '2026-09-04T10:00:00Z',
      courses: [{ courseId: 'course-1', completedLessons: 4, lastCompletedAt: '2026-09-04T10:00:00Z' }],
    } : [{
      id: 'enrollment-1', status: 'ACTIVE', enrolledAt: '2026-09-01T00:00:00Z',
      course: {
        id: 'course-1', slug: 'clean-architecture', title: 'Clean Architecture thực chiến',
        shortDescription: 'Xây dựng hệ thống dễ bảo trì.', level: 'INTERMEDIATE', price: 0,
        currency: 'VND', thumbnailUrl: null, estimatedDurationMinutes: 180,
        instructorName: 'Giảng viên',
        category: { id: 'category-1', slug: 'backend', name: 'Backend', description: null },
      },
    }]))
    mockedUseAuth.mockReturnValue(authValue(request))

    render(<MemoryRouter><LearningInsightsPage /></MemoryRouter>)

    expect(await screen.findByRole('heading', { name: 'Clean Architecture thực chiến' })).toBeInTheDocument()
    expect(screen.getByText('4 bài học đã hoàn thành')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Tiếp tục học' })).toHaveAttribute('href', '/learn/clean-architecture')
    expect(request).toHaveBeenCalledWith('/me/learning-analytics?courseLimit=20')
    expect(request).toHaveBeenCalledWith('/me/enrollments')
  })

  it('shows a learner-safe empty state', async () => {
    const request = vi.fn((path: string) => Promise.resolve(path.includes('learning-analytics') ? {
      completedLessons: 0,
      coursesWithCompletions: 0,
      lastCompletedAt: null,
      courses: [],
    } : []))
    mockedUseAuth.mockReturnValue(authValue(request))

    render(<MemoryRouter><LearningInsightsPage /></MemoryRouter>)

    expect(await screen.findByRole('heading', { name: 'Hoàn thành bài học đầu tiên để mở tổng quan' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Đi tới khóa học của tôi' })).toHaveAttribute('href', '/my-learning')
  })

  it('allows an explicit retry after a safe API error', async () => {
    const request = vi.fn()
      .mockRejectedValueOnce(new ApiError('Dịch vụ tạm thời bận.', 503))
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce({ completedLessons: 0, coursesWithCompletions: 0, lastCompletedAt: null, courses: [] })
      .mockResolvedValueOnce([])
    mockedUseAuth.mockReturnValue(authValue(request))

    render(<MemoryRouter><LearningInsightsPage /></MemoryRouter>)

    expect(await screen.findByRole('alert')).toHaveTextContent('Dịch vụ tạm thời bận.')
    fireEvent.click(screen.getByRole('button', { name: 'Thử tải lại' }))

    await waitFor(() => expect(request).toHaveBeenCalledTimes(4))
    expect(await screen.findByRole('heading', { name: 'Hoàn thành bài học đầu tiên để mở tổng quan' })).toBeInTheDocument()
  })
})
