import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '../auth/AuthContext'
import { MyLearningPage } from './MyLearningPage'

vi.mock('../auth/AuthContext', () => ({ useAuth: vi.fn() }))
const mockedUseAuth = vi.mocked(useAuth)

describe('MyLearningPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders the current student enrollments', async () => {
    const request = vi.fn().mockResolvedValue([{
      id: 'enrollment-1', status: 'ACTIVE', enrolledAt: '2026-08-13T00:00:00Z',
      course: {
        id: 'course-1', slug: 'java-free', title: 'Java miễn phí',
        shortDescription: 'Học Java theo dự án.', level: 'BEGINNER', price: 0,
        currency: 'VND', thumbnailUrl: null, estimatedDurationMinutes: 120,
        instructorName: 'Giảng viên Java',
        category: { id: 'category-1', slug: 'backend', name: 'Backend', description: null },
      },
    }])
    mockedUseAuth.mockReturnValue({
      user: { id: 'student-1', email: 'student@example.com', displayName: 'Bản Test', roles: ['STUDENT'] },
      accessToken: 'token', isLoading: false, request,
      login: vi.fn(), register: vi.fn(), logout: vi.fn(),
    })

    render(<MemoryRouter><MyLearningPage /></MemoryRouter>)

    expect(await screen.findByRole('heading', { name: 'Java miễn phí' })).toBeInTheDocument()
    expect(request).toHaveBeenCalledWith('/me/enrollments')
    expect(screen.getByText('ACTIVE')).toBeInTheDocument()
  })
})
