import type { LearningAnalytics } from '../../types/analytics'
import type { Enrollment } from '../../types/learning'

export type LearningInsightCourse = {
  courseId: string
  courseSlug: string | null
  courseTitle: string
  completedLessons: number
  lastCompletedAt: string
  metadataAvailable: boolean
}

export function joinLearningAnalytics(
  analytics: LearningAnalytics,
  enrollments: Enrollment[],
): LearningInsightCourse[] {
  const enrolledCourses = new Map(enrollments.map(({ course }) => [course.id, course]))

  return analytics.courses.map((courseAnalytics) => {
    const course = enrolledCourses.get(courseAnalytics.courseId)
    return {
      ...courseAnalytics,
      courseSlug: course?.slug ?? null,
      courseTitle: course?.title ?? fallbackCourseTitle(courseAnalytics.courseId),
      metadataAvailable: course !== undefined,
    }
  })
}

export function formatCompletedLessons(count: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(count)} bài học đã hoàn thành`
}

export function formatLearningTimestamp(value: string | null): string {
  if (!value) return 'Chưa có hoạt động'
  const timestamp = new Date(value)
  if (Number.isNaN(timestamp.getTime())) return 'Không xác định'
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(timestamp)
}

function fallbackCourseTitle(courseId: string): string {
  const compactId = courseId.replaceAll('-', '').slice(0, 8)
  return compactId ? `Khóa học ${compactId}` : 'Khóa học không xác định'
}
