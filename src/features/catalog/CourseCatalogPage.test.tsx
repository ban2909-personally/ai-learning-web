import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CourseCatalogPage } from './CourseCatalogPage'

describe('CourseCatalogPage', () => {
  afterEach(() => vi.restoreAllMocks())

  it('renders courses loaded from the API', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            items: [
              {
                id: 'course-1',
                slug: 'spring-boot',
                title: 'Spring Boot thực chiến',
                shortDescription: 'Xây API production-ready.',
                level: 'INTERMEDIATE',
                price: 799000,
                currency: 'VND',
                thumbnailUrl: null,
                estimatedDurationMinutes: 600,
                instructorName: 'Giảng viên Java',
                category: {
                  id: 'category-1',
                  slug: 'backend',
                  name: 'Backend',
                  description: null,
                },
              },
            ],
            page: 0,
            size: 12,
            totalElements: 1,
            totalPages: 1,
          }),
          { status: 200 },
        ),
      )

    render(
      <MemoryRouter>
        <CourseCatalogPage />
      </MemoryRouter>,
    )

    expect(
      await screen.findByRole('heading', { name: 'Spring Boot thực chiến' }),
    ).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByText('1 khóa học phù hợp')).toBeInTheDocument(),
    )
  })

  it('applies a category passed by the home page link', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(
        async (input) =>
          new Response(
            String(input).includes('/categories')
              ? JSON.stringify([])
              : JSON.stringify({
                  items: [],
                  page: 0,
                  size: 12,
                  totalElements: 0,
                  totalPages: 0,
                }),
            { status: 200 },
          ),
      )
    render(
      <MemoryRouter initialEntries={['/courses?category=backend']}>
        <CourseCatalogPage />
      </MemoryRouter>,
    )
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/courses?category=backend&size=12'),
        expect.anything(),
      ),
    )
  })
})
