import { useEffect, useState, type FormEvent } from 'react'
import { apiRequest, ApiError } from '../../lib/api'
import type { Category, CourseLevel, CourseSummary, PageResponse } from '../../types/catalog'
import { CourseCard } from './CourseCard'

type Filters = { search: string; category: string; level: '' | CourseLevel }

const initialFilters: Filters = { search: '', category: '', level: '' }

export function CourseCatalogPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [filters, setFilters] = useState<Filters>(initialFilters)
  const [activeFilters, setActiveFilters] = useState<Filters>(initialFilters)
  const [result, setResult] = useState<PageResponse<CourseSummary> | null>(null)
  const [isLoading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiRequest<Category[]>('/categories').then(setCategories).catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    const params = new URLSearchParams()
    if (activeFilters.search) params.set('search', activeFilters.search)
    if (activeFilters.category) params.set('category', activeFilters.category)
    if (activeFilters.level) params.set('level', activeFilters.level)
    params.set('size', '12')
    setLoading(true)
    setError(null)
    apiRequest<PageResponse<CourseSummary>>(`/courses?${params}`)
      .then(setResult)
      .catch((caught: unknown) => setError(
        caught instanceof ApiError ? caught.message : 'Không thể tải danh mục khóa học.',
      ))
      .finally(() => setLoading(false))
  }, [activeFilters])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setActiveFilters(filters)
  }

  return (
    <main>
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">Course catalog</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Chọn kỹ năng tiếp theo của bạn</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">Khóa học thực hành, có lộ trình rõ và AI Mentor đồng hành theo ngữ cảnh bài học.</p>

          <form onSubmit={submit} className="mt-8 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[1fr_220px_180px_auto]">
            <label className="sr-only" htmlFor="catalog-search">Tìm kiếm khóa học</label>
            <input id="catalog-search" className="field mt-0" placeholder="Tìm theo tên hoặc nội dung..." value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
            <select aria-label="Danh mục" className="field mt-0" value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })}>
              <option value="">Mọi danh mục</option>
              {categories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}
            </select>
            <select aria-label="Trình độ" className="field mt-0" value={filters.level} onChange={(event) => setFilters({ ...filters, level: event.target.value as Filters['level'] })}>
              <option value="">Mọi trình độ</option>
              <option value="BEGINNER">Cơ bản</option>
              <option value="INTERMEDIATE">Trung cấp</option>
              <option value="ADVANCED">Nâng cao</option>
            </select>
            <button className="rounded-xl bg-ink px-6 py-3 font-semibold text-white hover:bg-slate-700">Tìm kiếm</button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12">
        {!isLoading && !error && <p className="mb-6 text-sm text-slate-500">{result?.totalElements ?? 0} khóa học phù hợp</p>}
        {isLoading && <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500">Đang tải khóa học...</div>}
        {error && <div role="alert" className="rounded-2xl bg-red-50 p-6 text-red-700">{error}</div>}
        {!isLoading && !error && result?.items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <h2 className="text-xl font-semibold">Chưa có khóa học phù hợp</h2>
            <p className="mt-2 text-slate-500">Thử thay đổi từ khóa hoặc bộ lọc.</p>
          </div>
        )}
        {!isLoading && !error && result && result.items.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {result.items.map((course) => <CourseCard key={course.id} course={course} />)}
          </div>
        )}
      </section>
    </main>
  )
}
