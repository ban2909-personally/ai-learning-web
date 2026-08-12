export type CourseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'

export type Category = {
  id: string
  slug: string
  name: string
  description: string | null
}

export type CourseSummary = {
  id: string
  slug: string
  title: string
  shortDescription: string
  level: CourseLevel
  price: number
  currency: string
  thumbnailUrl: string | null
  estimatedDurationMinutes: number
  category: Category
  instructorName: string
}

export type CourseDetail = CourseSummary & {
  description: string
  language: string
  instructorId: string
  publishedAt: string
}

export type PageResponse<T> = {
  items: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}
