import { describe, expect, it } from 'vitest'
import type { LearningAnalytics } from '../../types/analytics'
import type { Enrollment } from '../../types/learning'
import {
  formatCompletedLessons,
  formatLearningTimestamp,
  joinLearningAnalytics,
} from './learningAnalytics'

const analytics: LearningAnalytics = {
  completedLessons: 5,
  coursesWithCompletions: 2,
  lastCompletedAt: '2026-09-04T10:00:00Z',
  courses: [
    { courseId: 'course-known', completedLessons: 3, lastCompletedAt: '2026-09-04T10:00:00Z' },
    { courseId: '12345678-aaaa-bbbb-cccc-123456789012', completedLessons: 2, lastCompletedAt: '2026-09-03T10:00:00Z' },
  ],
}

const enrollments: Enrollment[] = [{
  id: 'enrollment-1',
  status: 'ACTIVE',
  enrolledAt: '2026-09-01T00:00:00Z',
  course: {
    id: 'course-known',
    slug: 'clean-architecture',
    title: 'Clean Architecture thực chiến',
    shortDescription: 'Xây dựng hệ thống dễ bảo trì.',
    level: 'INTERMEDIATE',
    price: 0,
    currency: 'VND',
    thumbnailUrl: null,
    estimatedDurationMinutes: 180,
    instructorName: 'Giảng viên',
    category: { id: 'category-1', slug: 'backend', name: 'Backend', description: null },
  },
}]

describe('learning analytics presentation', () => {
  it('preserves backend ordering and joins available enrollment metadata', () => {
    const courses = joinLearningAnalytics(analytics, enrollments)

    expect(courses).toHaveLength(2)
    expect(courses[0]).toMatchObject({
      courseId: 'course-known',
      courseSlug: 'clean-architecture',
      courseTitle: 'Clean Architecture thực chiến',
      metadataAvailable: true,
    })
    expect(courses[1]).toMatchObject({
      courseId: '12345678-aaaa-bbbb-cccc-123456789012',
      courseSlug: null,
      courseTitle: 'Khóa học 12345678',
      metadataAvailable: false,
    })
  })

  it('formats counts and degrades missing or invalid timestamps safely', () => {
    expect(formatCompletedLessons(12)).toBe('12 bài học đã hoàn thành')
    expect(formatLearningTimestamp(null)).toBe('Chưa có hoạt động')
    expect(formatLearningTimestamp('not-a-date')).toBe('Không xác định')
    expect(formatLearningTimestamp('2026-09-04T10:00:00Z')).toContain('2026')
  })
})
