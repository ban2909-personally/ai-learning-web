import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CommunityIcon } from './CommunityIcon'
import { useCommunityApi } from './useCommunityApi'
import type { DiscoveryPage } from './types'

export function CommunitySearch() {
  const { read } = useCommunityApi()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [filter, setFilter] = useState('ALL')
  const [result, setResult] = useState<DiscoveryPage | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const currentQuery = useRef(query)
  currentQuery.current = query
  useEffect(() => {
    const controller = new AbortController()
    const term = query.trim()
    setError('')
    if (page === 0) setResult(null)
    setLoading(Boolean(term))
    if (!term) return () => controller.abort()
    const timer = setTimeout(
      () => {
        void read<DiscoveryPage>(
          `/community/search?${new URLSearchParams({ q: term, page: String(page) })}`,
          { signal: controller.signal },
        )
          .then((found) => {
            if (controller.signal.aborted || currentQuery.current !== query)
              return
            setResult((previous) => ({
              ...found,
              spaces:
                page && previous
                  ? [
                      ...previous.spaces,
                      ...found.spaces.filter(
                        (space) =>
                          !previous.spaces.some((item) => item.id === space.id),
                      ),
                    ]
                  : found.spaces,
              people:
                page && previous
                  ? [
                      ...previous.people,
                      ...found.people.filter(
                        (person) =>
                          !previous.people.some(
                            (item) => item.id === person.id,
                          ),
                      ),
                    ]
                  : found.people,
            }))
          })
          .catch((cause: unknown) => {
            if (!controller.signal.aborted && currentQuery.current === query) {
              setError(
                cause instanceof Error
                  ? cause.message
                  : 'Chưa tìm được cộng đồng. Hãy thử lại.',
              )
            }
          })
          .finally(() => {
            if (!controller.signal.aborted && currentQuery.current === query)
              setLoading(false)
          })
      },
      page ? 0 : 300,
    )
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query, page, retry, read])
  const spaces =
    result?.spaces.filter(
      (space) => filter === 'ALL' || filter === space.kind,
    ) ?? []
  const people =
    filter === 'ALL' || filter === 'PERSON' ? (result?.people ?? []) : []
  const more =
    result &&
    page < 100 &&
    ((filter !== 'PERSON' && result.spacesHasMore) ||
      ((filter === 'ALL' || filter === 'PERSON') && result.peopleHasMore))
  return (
    <section className="community-discovery" aria-label="Tìm kiếm trên nền tảng">
      <label htmlFor="community-discovery-input">
        Tìm người cùng học & cộng đồng
      </label>
      <div className="community-discovery-field">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="10" cy="10" r="6" />
          <path d="m15 15 5 5" />
        </svg>
        <input
          id="community-discovery-input"
          type="search"
          value={query}
          maxLength={120}
          placeholder="Tên hội nhóm, page hoặc cá nhân…"
          autoComplete="off"
          onChange={(event) => {
            setQuery(event.target.value)
            setPage(0)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setQuery('')
              setPage(0)
            }
          }}
          aria-describedby="community-discovery-hint"
          aria-controls="community-discovery-results"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setPage(0)
            }}
            aria-label="Xóa từ khóa"
          >
            ×
          </button>
        )}
      </div>
      <small id="community-discovery-hint">
        Gõ từ 1 ký tự · Có hoặc không dấu · Từ khóa càng rõ, kết quả càng sát
      </small>
      {query.trim() && (
        <div
          id="community-discovery-results"
          className="community-discovery-results"
          aria-busy={loading}
        >
          <div className="community-discovery-filters" aria-label="Loại kết quả">
            {(
              [
                ['ALL', 'Tất cả'],
                ['GROUP', 'Hội nhóm'],
                ['PAGE', 'Page'],
                ['PERSON', 'Cá nhân'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <p role="status" className="community-muted">
            {loading
              ? 'Đang tìm kiếm…'
              : error
                ? ''
                : 'Kết quả cho “' + query.trim() + '”'}
          </p>
          {error && (
            <div role="alert">
              <p>{error}</p>
              <button
                type="button"
                className="community-more"
                onClick={() => setRetry((value) => value + 1)}
              >
                Thử tìm lại
              </button>
            </div>
          )}
          {spaces.map((space) => (
            <Link
              className="community-discovery-result"
              key={space.id}
              to={`/community/spaces/${space.id}`}
            >
              <CommunityIcon
                name={space.kind === 'GROUP' ? 'spaces' : 'page'}
              />
              <span>
                <strong>{space.name}</strong>
                <small>
                  {space.kind === 'GROUP' ? 'Hội nhóm' : 'Page'} ·{' '}
                  {space.visibility === 'PRIVATE'
                    ? 'Riêng tư · cần phê duyệt'
                    : 'Công khai'}
                </small>
              </span>
            </Link>
          ))}
          {people.map((person) => (
            <Link
              className="community-discovery-result"
              key={person.id}
              to={`/community/people/${person.id}`}
            >
              <span className="account-avatar" aria-hidden="true">
                {person.displayName.slice(0, 1).toUpperCase()}
              </span>
              <span>
                <strong>{person.displayName}</strong>
                <small>Cá nhân · Hồ sơ công khai</small>
              </span>
            </Link>
          ))}
          {!loading && !error && result && !spaces.length && !people.length && (
            <p className="community-muted">
              Chưa có kết quả phù hợp. Thử đổi từ khóa hoặc loại kết quả.
            </p>
          )}
          {more && !loading && !error && (
            <button
              className="community-more"
              type="button"
              onClick={() => setPage(page + 1)}
            >
              Xem thêm kết quả
            </button>
          )}
        </div>
      )}
    </section>
  )
}
