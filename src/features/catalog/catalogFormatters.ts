import type { CourseLevel } from '../../types/catalog'

const levelLabels: Record<CourseLevel, string> = {
  BEGINNER: 'Cơ bản',
  INTERMEDIATE: 'Trung cấp',
  ADVANCED: 'Nâng cao',
}

export function formatCourseLevel(level: CourseLevel) {
  return levelLabels[level]
}

export function formatCoursePrice(price: number, currency: string) {
  if (price === 0) return 'Miễn phí'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(price)
}

export function formatCourseDuration(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (hours === 0) return `${remainingMinutes} phút`
  if (remainingMinutes === 0) return `${hours} giờ`
  return `${hours} giờ ${remainingMinutes} phút`
}
