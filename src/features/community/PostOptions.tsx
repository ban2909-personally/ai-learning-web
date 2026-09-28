import { CommunityIcon } from './CommunityIcon'

export type PostDraftOptions = {
  link: string
  background: string | null
  font: string | null
  poll: {
    kind: 'POLL' | 'ELECTION'
    question: string
    labels: string[]
    closesAt: string
  } | null
}
export const emptyPostOptions: PostDraftOptions = {
  link: '',
  background: null,
  font: null,
  poll: null,
}
export function PostOptions({
  value,
  onChange,
  disabled,
}: {
  value: PostDraftOptions
  onChange: (value: PostDraftOptions) => void
  disabled: boolean
}) {
  const change = (patch: Partial<PostDraftOptions>) =>
    onChange({ ...value, ...patch })
  return (
    <fieldset className="community-post-options" disabled={disabled}>
      <legend>Thêm vào bài viết</legend>
      <div className="community-option-tools">
        <button
          type="button"
          aria-pressed={Boolean(value.poll)}
          onClick={() =>
            change({
              poll: value.poll
                ? null
                : {
                    kind: 'POLL',
                    question: '',
                    labels: ['', ''],
                    closesAt: '',
                  },
            })
          }
        >
          <CommunityIcon name="poll" /> Bình chọn / bầu chọn
        </button>
        <button
          type="button"
          aria-pressed={Boolean(value.background)}
          onClick={() =>
            change(
              value.background
                ? { background: null, font: null }
                : { background: '#173569', font: '#ffffff' },
            )
          }
        >
          <CommunityIcon name="palette" /> Màu bài viết
        </button>
      </div>
      <label className="community-link-input">
        <CommunityIcon name="link" />
        <span>Link đính kèm</span>
        <input
          type="url"
          value={value.link}
          onChange={(event) => change({ link: event.target.value })}
          maxLength={2048}
          placeholder="https://... (tuyển học viên, tài liệu…)"
        />
      </label>
      {value.background && (
        <div className="community-color-options">
          <div className="community-color-presets">
            {['#173569', '#5b2776', '#16705e', '#95333f', '#ffffff'].map(
              (background) => (
                <button
                  key={background}
                  type="button"
                  aria-label={`Chọn nền ${background}`}
                  aria-pressed={value.background === background}
                  style={{ backgroundColor: background }}
                  onClick={() =>
                    change({
                      background,
                      font: background === '#ffffff' ? '#142445' : '#ffffff',
                    })
                  }
                />
              ),
            )}
          </div>
          <label>
            Màu nền{' '}
            <input
              type="color"
              value={value.background}
              onChange={(event) => change({ background: event.target.value })}
            />
          </label>
          <label>
            Màu chữ{' '}
            <input
              type="color"
              value={value.font!}
              onChange={(event) => change({ font: event.target.value })}
            />
          </label>
          <p
            className="community-color-preview"
            style={{ backgroundColor: value.background, color: value.font! }}
          >
            Chia sẻ điều bạn đang học ✨
          </p>
          <small>
            Màu chữ/nền cần độ tương phản 4.5:1. Hệ thống sẽ kiểm tra trước khi
            lưu.
          </small>
        </div>
      )}
      {value.poll && (
        <div className="community-poll-editor">
          <label>
            Loại bình chọn
            <select
              value={value.poll.kind}
              onChange={(event) =>
                change({
                  poll: {
                    ...value.poll!,
                    kind: event.target.value as 'POLL' | 'ELECTION',
                  },
                })
              }
            >
              <option value="POLL">Khảo sát / thảo luận</option>
              <option value="ELECTION">Bầu chọn ứng viên / phương án</option>
            </select>
          </label>
          <label>
            Câu hỏi bình chọn
            <input
              value={value.poll.question}
              onChange={(event) =>
                change({
                  poll: { ...value.poll!, question: event.target.value },
                })
              }
              maxLength={300}
              placeholder="Bạn đang gặp khó khăn ở kỹ năng nào?"
            />
          </label>
          {value.poll.labels.map((label, index) => (
            <div className="community-poll-edit-option" key={index}>
              <label>
                Lựa chọn {index + 1}
                <input
                  value={label}
                  maxLength={160}
                  onChange={(event) =>
                    change({
                      poll: {
                        ...value.poll!,
                        labels: value.poll!.labels.map((item, position) =>
                          position === index ? event.target.value : item,
                        ),
                      },
                    })
                  }
                />
              </label>
              {value.poll!.labels.length > 2 && (
                <button
                  type="button"
                  aria-label={`Bỏ lựa chọn ${index + 1}`}
                  onClick={() =>
                    change({
                      poll: {
                        ...value.poll!,
                        labels: value.poll!.labels.filter(
                          (_, position) => position !== index,
                        ),
                      },
                    })
                  }
                >
                  <CommunityIcon name="close" />
                </button>
              )}
            </div>
          ))}
          {value.poll.labels.length < 8 && (
            <button
              type="button"
              onClick={() =>
                change({
                  poll: { ...value.poll!, labels: [...value.poll!.labels, ''] },
                })
              }
            >
              + Thêm lựa chọn
            </button>
          )}
          <label>
            Đóng bình chọn lúc (không bắt buộc)
            <input
              type="datetime-local"
              value={value.poll.closesAt}
              onChange={(event) =>
                change({
                  poll: { ...value.poll!, closesAt: event.target.value },
                })
              }
            />
          </label>
          <small>
            Mỗi người chọn một phương án; có thể đổi hoặc rút phiếu khi bình
            chọn còn mở.
          </small>
        </div>
      )}
    </fieldset>
  )
}
