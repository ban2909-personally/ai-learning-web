import { Link } from 'react-router-dom'

const benefits = [
  ['Lộ trình có mục tiêu', 'Biết chính xác nên học gì tiếp theo và vì sao.'],
  ['Thực hành trong ngữ cảnh', 'Kết nối bài giảng với bài tập và dự án thực tế.'],
  ['AI Mentor gợi mở', 'Nhận gợi ý để tự tìm ra lời giải thay vì chép đáp án.'],
]

export function HomePage() {
  return (
    <main>
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top_right,_rgba(23,166,115,0.18),_transparent_58%)]" />
        <div className="relative mx-auto max-w-6xl px-5 py-24 sm:py-32">
          <div className="max-w-3xl">
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">AI-powered learning</p>
            <h1 className="text-5xl font-semibold leading-[1.08] tracking-[-0.04em] sm:text-7xl">
              Học lập trình bằng cách hiểu, không phải ghi nhớ.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600">
              Khóa học chuyên sâu, tiến độ rõ ràng và AI Mentor đồng hành trong từng bài học.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/register" className="rounded-xl bg-ink px-6 py-3 font-semibold text-white hover:bg-slate-700">Bắt đầu học</Link>
              <Link to="/courses" className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold hover:bg-slate-50">Xem khóa học</Link>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-5 py-20">
        <div className="grid gap-5 md:grid-cols-3">
          {benefits.map(([title, description], index) => (
            <article key={title} className="rounded-2xl border border-slate-200 bg-white p-7 shadow-card">
              <span className="text-sm font-bold text-brand-600">0{index + 1}</span>
              <h2 className="mt-5 text-xl font-semibold">{title}</h2>
              <p className="mt-3 leading-7 text-slate-600">{description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
