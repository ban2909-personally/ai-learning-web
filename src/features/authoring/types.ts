export type ManagedCourse = {
  id: string
  instructorId: string
  categoryId: string
  slug: string
  title: string
  shortDescription: string
  description: string
  level: string
  price: number
  status: string
  lessonCount: number
  updatedAt: string
}
export type ManagedLesson = {
  id: string
  sectionTitle: string
  title: string
  contentUrl: string
  durationSeconds: number
  preview: boolean
}
export type CourseWorkspace = {
  course: ManagedCourse
  lessons: ManagedLesson[]
}
