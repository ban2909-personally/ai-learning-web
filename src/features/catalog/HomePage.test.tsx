import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { HomePage } from './HomePage'

vi.mock('../../lib/api', () => ({
  apiRequest: vi.fn().mockResolvedValue({ items: [] }),
}))

describe('HomePage', () => {
  it('shows the primary learning proposition', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Học lập trình bằng cách hiểu',
    )
  })
})
