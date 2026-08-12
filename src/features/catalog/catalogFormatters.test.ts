import { describe, expect, it } from 'vitest'
import { formatCourseDuration, formatCourseLevel, formatCoursePrice } from './catalogFormatters'

describe('catalog formatters', () => {
  it('formats Vietnamese price and free courses', () => {
    expect(formatCoursePrice(0, 'VND')).toBe('Miễn phí')
    expect(formatCoursePrice(799000, 'VND')).toContain('799.000')
  })

  it('formats duration and level', () => {
    expect(formatCourseDuration(150)).toBe('2 giờ 30 phút')
    expect(formatCourseLevel('INTERMEDIATE')).toBe('Trung cấp')
  })
})
