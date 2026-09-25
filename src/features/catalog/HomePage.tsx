import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiRequest } from '../../lib/api'
import type { CourseSummary, PageResponse } from '../../types/catalog'
import { CourseCard } from './CourseCard'

export function HomePage() {
  const [courses, setCourses] = useState<CourseSummary[]>([])
  useEffect(() => {
    let active = true
    apiRequest<PageResponse<CourseSummary>>('/courses?size=3')
      .then((page) => {
        if (active) setCourses(page.items)
      })
      .catch(() => {
        /* Discovery remains available through the catalog page. */
      })
    return () => {
      active = false
    }
  }, [])
  return (
    <main>
      <section className="public-hero">
        <div className="public-hero-grid">
          <div>
            <p className="eyebrow">HỌC CHỦ ĐỘNG · XÂY DỰNG TƯƠNG LAI</p>
            <h1>
              Học lập trình bằng cách hiểu,
              <br />
              <span>không phải ghi nhớ.</span>
            </h1>
            <p className="hero-description">
              Biến kiến thức thành sản phẩm. Khóa học có lộ trình, thực hành
              trong từng bài và AI Mentor đồng hành khi bạn cần gợi ý.
            </p>
            <div className="form-actions mt-8">
              <Link to="/courses" className="primary-button px-6 py-3.5">
                Khám phá khóa học →
              </Link>
              <Link to="/register" className="secondary-button px-6 py-3.5">
                Bắt đầu học
              </Link>
            </div>
            <div className="hero-topics">
              <span>Java & Spring</span>
              <span>React & TypeScript</span>
              <span>AI & DevOps</span>
            </div>
          </div>
          <div
            className="hero-learning-art"
            aria-label="Hành trình từ kiến thức đến sản phẩm"
          >
            <div className="code-window">
              <div className="code-window-bar">
                <i />
                <i />
                <i />
                <span>your-learning-path.ts</span>
              </div>
              <pre>
                <span className="text-violet-300">const</span> journey = {'{'}
                <br /> goal:{' '}
                <span className="text-emerald-300">
                  'Build something meaningful'
                </span>
                ,<br /> steps: [<br />{' '}
                <span className="text-blue-300">'Hiểu bản chất'</span>,<br />{' '}
                <span className="text-blue-300">'Thực hành từng bước'</span>,
                <br />{' '}
                <span className="text-blue-300">'Tạo sản phẩm của bạn'</span>
                <br /> ]<br />
                {'}'}
              </pre>
            </div>
            <div className="learning-art-note">
              <span>✦</span>
              <div>
                <strong>Hiểu sâu hơn trong mỗi bài học</strong>
                <p>Gợi mở tư duy · Thực hành · Ôn tập flashcard</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="page-container py-14">
        <div className="page-heading">
          <div>
            <p className="eyebrow">LỘ TRÌNH DÀNH CHO BẠN</p>
            <h2>Bắt đầu từ điều bạn muốn xây dựng</h2>
          </div>
          <Link className="text-button" to="/courses">
            Xem khóa học →
          </Link>
        </div>
        {courses.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="quick-link-grid">
            {[
              [
                'backend',
                'Backend vững chắc',
                'Java, API và kiến trúc ứng dụng',
              ],
              [
                'frontend',
                'Giao diện có trải nghiệm',
                'React, TypeScript và responsive',
              ],
              [
                'data-ai',
                'Khám phá ứng dụng AI',
                'Ngữ cảnh, dữ liệu và trợ lý thông minh',
              ],
            ].map(([slug, title, text]) => (
              <Link
                className="quick-link"
                key={slug}
                to={'/courses?category=' + slug}
              >
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
                <span>→</span>
              </Link>
            ))}
          </div>
        )}
      </section>
      <section className="learning-method">
        <div className="page-container py-14">
          <p className="eyebrow">MỘT CÁCH HỌC RÕ RÀNG HƠN</p>
          <h2 className="text-3xl font-bold tracking-tight">
            Từ “biết” đến “làm được”.
          </h2>
          <div className="quick-link-grid mt-8">
            {[
              [
                '01',
                'Lộ trình có mục tiêu',
                'Biết nên học gì tiếp theo và theo dõi tiến độ qua từng bài.',
              ],
              [
                '02',
                'Thực hành trong ngữ cảnh',
                'Kết nối kiến thức với ví dụ và những vấn đề thực tế.',
              ],
              [
                '03',
                'Ghi nhớ có chủ đích',
                'Tự tạo flashcard, lật thẻ và kiểm tra điều mình đã hiểu.',
              ],
            ].map(([number, title, description]) => (
              <article className="method-card" key={number}>
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <footer className="site-footer">
        <strong>AI Learning.</strong>
        <span>Học sâu. Thực hành thật. Tiến bộ mỗi ngày.</span>
        <Link to="/courses">Khám phá khóa học →</Link>
      </footer>
    </main>
  )
}
