import { skillLabels, type Skill } from '../practice/types'
import type { DraftQuestion, DraftSection } from './types'

type Props = {
  section: DraftSection
  index: number
  disabled: boolean
  busy: boolean
  totalQuestions: number
  onChange: (section: DraftSection) => void
  onRemove: () => void
}

export function ExamSectionEditor({
  section,
  index,
  disabled,
  busy,
  totalQuestions,
  onChange,
  onRemove,
}: Props) {
  const question = (position: number, change: Partial<DraftQuestion>) => {
    onChange({
      ...section,
      questions: section.questions.map((item, i) =>
        i === position ? { ...item, ...change } : item,
      ),
    })
  }
  const add = () => {
    const kind = section.skill === 'WRITING' ? 'WRITING' : 'CHOICE'
    onChange({
      ...section,
      questions: [
        ...section.questions,
        {
          kind,
          prompt: '',
          options: kind === 'CHOICE' ? ['', ''] : [],
          correctAnswer: kind === 'WRITING' ? null : '',
          explanation: '',
        },
      ],
    })
  }
  return (
    <section className="exam-section-editor">
      <div className="exam-section-heading">
        <div>
          <p className="exam-eyebrow">
            PHẦN {index + 1} · {skillLabels[section.skill].toUpperCase()}
          </p>
          <h2>Nội dung phần thi</h2>
        </div>
        {!disabled && (
          <button
            type="button"
            className="text-button"
            disabled={busy}
            onClick={onRemove}
          >
            Xóa phần
          </button>
        )}
      </div>
      <fieldset disabled={disabled || busy}>
        <div className="exam-field-grid">
          <label>
            Kỹ năng
            <select
              value={section.skill}
              onChange={(event) => {
                const skill = event.target.value as Skill
                if (
                  section.questions.length &&
                  !window.confirm(
                    'Đổi kỹ năng sẽ xóa câu hỏi trong phần này. Tiếp tục?',
                  )
                )
                  return
                onChange({ ...section, skill, questions: [], audioText: null })
              }}
            >
              {Object.entries(skillLabels).map(([skill, label]) => (
                <option key={skill} value={skill}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Tiêu đề phần
            <input
              value={section.title}
              maxLength={180}
              onChange={(event) =>
                onChange({ ...section, title: event.target.value })
              }
            />
          </label>
        </div>
        <label>
          Đoạn đọc / ngữ cảnh
          <textarea
            value={section.passage ?? ''}
            rows={5}
            maxLength={20000}
            onChange={(event) =>
              onChange({ ...section, passage: event.target.value })
            }
          />
        </label>
        {section.skill === 'LISTENING' && (
          <label>
            Lời đọc tiếng Anh cho audio demo
            <textarea
              value={section.audioText ?? ''}
              rows={4}
              maxLength={20000}
              onChange={(event) =>
                onChange({ ...section, audioText: event.target.value })
              }
            />
            <small>
              Hiện dùng giọng đọc của trình duyệt cho luyện tập. Upload audio
              thật và ẩn transcript khi thi là bước kế tiếp.
            </small>
          </label>
        )}
        {section.questions.map((item, position) => (
          <article className="exam-question-editor" key={position}>
            <div className="exam-question-heading">
              <h3>Câu {position + 1}</h3>
              {!disabled && (
                <button
                  type="button"
                  className="text-button"
                  onClick={() =>
                    onChange({
                      ...section,
                      questions: section.questions.filter(
                        (_, i) => i !== position,
                      ),
                    })
                  }
                >
                  Xóa câu
                </button>
              )}
            </div>
            {section.skill !== 'WRITING' && (
              <label>
                Loại câu hỏi
                <select
                  value={item.kind}
                  onChange={(event) => {
                    const kind = event.target.value as DraftQuestion['kind']
                    question(position, {
                      kind,
                      options: kind === 'CHOICE' ? ['', ''] : [],
                      correctAnswer: '',
                    })
                  }}
                >
                  <option value="CHOICE">Trắc nghiệm</option>
                  <option value="TEXT">Điền đáp án</option>
                </select>
              </label>
            )}
            <label>
              Đề bài / câu hỏi
              <textarea
                value={item.prompt}
                rows={3}
                maxLength={10000}
                onChange={(event) =>
                  question(position, { prompt: event.target.value })
                }
              />
            </label>
            {item.kind === 'CHOICE' && (
              <div className="exam-choices-editor">
                <p>Lựa chọn · chọn đáp án đúng bên dưới</p>
                {item.options.map((option, choice) => (
                  <div className="exam-choice-row" key={choice}>
                    <span>{String.fromCharCode(65 + choice)}</span>
                    <input
                      aria-label={
                        'Lựa chọn ' + (choice + 1) + ' câu ' + (position + 1)
                      }
                      value={option}
                      maxLength={500}
                      onChange={(event) =>
                        question(position, {
                          options: item.options.map((value, i) =>
                            i === choice ? event.target.value : value,
                          ),
                          correctAnswer:
                            option !== '' && item.correctAnswer === option
                              ? event.target.value
                              : item.correctAnswer,
                        })
                      }
                    />
                    {!disabled && (
                      <button
                        type="button"
                        className="text-button"
                        aria-label={
                          'Xóa lựa chọn ' +
                          (choice + 1) +
                          ' câu ' +
                          (position + 1)
                        }
                        disabled={item.options.length <= 2}
                        onClick={() =>
                          question(position, {
                            options: item.options.filter(
                              (_, i) => i !== choice,
                            ),
                            correctAnswer:
                              item.correctAnswer === option
                                ? ''
                                : item.correctAnswer,
                          })
                        }
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                {!disabled && (
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={item.options.length >= 10}
                    onClick={() =>
                      question(position, { options: [...item.options, ''] })
                    }
                  >
                    + Thêm lựa chọn
                  </button>
                )}
                <label>
                  Đáp án đúng
                  <select
                    value={item.correctAnswer ?? ''}
                    onChange={(event) =>
                      question(position, { correctAnswer: event.target.value })
                    }
                  >
                    <option value="">Chọn đáp án</option>
                    {item.options.map((option, choice) => (
                      <option
                        key={choice}
                        value={option}
                        disabled={!option.trim()}
                      >
                        {String.fromCharCode(65 + choice)} ·{' '}
                        {option || 'Chưa nhập'}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}
            {item.kind === 'TEXT' && (
              <label>
                Đáp án đúng
                <input
                  value={item.correctAnswer ?? ''}
                  maxLength={500}
                  onChange={(event) =>
                    question(position, { correctAnswer: event.target.value })
                  }
                />
              </label>
            )}
            {item.kind !== 'WRITING' && (
              <label>
                Giải thích đáp án
                <textarea
                  value={item.explanation}
                  rows={3}
                  maxLength={5000}
                  onChange={(event) =>
                    question(position, { explanation: event.target.value })
                  }
                />
              </label>
            )}
            {item.kind === 'WRITING' && (
              <p className="exam-writing-note">
                Bài viết được giảng viên chấm riêng theo 4 tiêu chí, mỗi tiêu
                chí 0–5 điểm. Không gộp vào số câu đúng Nghe/Đọc.
              </p>
            )}
          </article>
        ))}
        {!disabled && (
          <button
            type="button"
            className="secondary-button"
            disabled={totalQuestions >= 250}
            onClick={add}
          >
            + Thêm câu hỏi
          </button>
        )}
      </fieldset>
    </section>
  )
}
