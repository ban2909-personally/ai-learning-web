import { useState } from 'react'
import {
  englishResources,
  resourcesVerifiedAt,
  type EnglishSkill,
} from './englishResources'

function fold(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
}

export function EnglishResourcesPage() {
  const [query, setQuery] = useState('')
  const [skill, setSkill] = useState<EnglishSkill | ''>('')
  const [format, setFormat] = useState('')
  const found = englishResources.filter(
    (resource) =>
      (!skill || resource.skills.includes(skill)) &&
      (!format || resource.format === format) &&
      fold(
        [
          resource.title,
          resource.provider,
          resource.description,
          resource.level,
          ...resource.skills,
        ].join(' '),
      ).includes(fold(query.trim())),
  )
  return (
    <main className="english-resources-page">
      <section className="english-resources-hero">
        <small>HỌC LIỆU MỞ · NGUỒN GỐC UY TÍN</small>
        <h1>
          Một chút mỗi ngày.
          <br />
          <em>Tiếng Anh tốt hơn.</em>
        </h1>
        <p>
          Bài học, video và đề mẫu miễn phí từ các tổ chức giáo dục và kênh
          chính thức. Chọn kỹ năng, mở nguồn gốc và bắt đầu học.
        </p>
        <span>
          Đã kiểm tra nguồn: {resourcesVerifiedAt} · {englishResources.length}{' '}
          tài nguyên
        </span>
      </section>
      <section className="english-resource-filters" aria-label="Lọc học liệu">
        <label>
          Tìm học liệu
          <input
            type="search"
            value={query}
            maxLength={120}
            placeholder="TOEIC, Cambridge, ngữ pháp…"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <label>
          Kỹ năng
          <select
            value={skill}
            onChange={(event) =>
              setSkill(event.target.value as EnglishSkill | '')
            }
          >
            <option value="">Tất cả kỹ năng</option>
            {(['Nghe', 'Đọc', 'Viết', 'Ngữ pháp', 'Luyện thi'] as const).map(
              (value) => (
                <option key={value}>{value}</option>
              ),
            )}
          </select>
        </label>
        <label>
          Loại học liệu
          <select
            value={format}
            onChange={(event) => setFormat(event.target.value)}
          >
            <option value="">Tất cả loại</option>
            {['Bài học', 'Video', 'Bài tập', 'Đề mẫu'].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <button
          className="community-more"
          onClick={() => {
            setQuery('')
            setSkill('')
            setFormat('')
          }}
        >
          Xóa bộ lọc
        </button>
      </section>
      <p role="status">{found.length} học liệu phù hợp</p>
      <div className="english-resource-grid">
        {found.map((resource) => (
          <article className="english-resource-card" key={resource.id}>
            <div className="english-resource-top">
              <span>{resource.provider}</span>
              <small>{resource.format}</small>
            </div>
            <h2>{resource.title}</h2>
            <p>{resource.description}</p>
            <div className="english-resource-tags">
              <span>{resource.level}</span>
              {resource.skills.map((value) => (
                <span key={value}>{value}</span>
              ))}
            </div>
            <small className="english-resource-access">
              {resource.accessNote}
            </small>
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Mở ${resource.title} tại nguồn gốc (tab mới)`}
            >
              Học tại nguồn gốc <span aria-hidden="true">↗</span>
            </a>
          </article>
        ))}
      </div>
      {!found.length && (
        <p className="community-empty">
          Không có học liệu phù hợp. Thử đổi từ khóa hoặc xóa bộ lọc.
        </p>
      )}
      <p className="english-resource-disclaimer">
        Liên kết bên ngoài, không lưu điểm học tại đây. Nội dung thuộc nhà cung
        cấp; miễn phí truy cập không đồng nghĩa được phép sao chép. Điều kiện
        truy cập có thể thay đổi. Các bài thi chứng chỉ, khóa trả phí và phần
        Speaking không nằm trong danh mục này.
      </p>
    </main>
  )
}
