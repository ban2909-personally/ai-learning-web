export type EnglishSkill = 'Nghe' | 'Đọc' | 'Viết' | 'Ngữ pháp' | 'Luyện thi'
export type EnglishResource = {
  id: string
  title: string
  provider: string
  url: string
  skills: EnglishSkill[]
  level: string
  format: 'Bài học' | 'Video' | 'Bài tập' | 'Đề mẫu'
  description: string
  accessNote: string
}

export const resourcesVerifiedAt = '29/09/2026'
// Curated outbound links only: do not import, mirror or embed publisher content.
export const englishResources: EnglishResource[] = [
  {
    id: 'bc-listening',
    title: 'Listening theo trình độ',
    provider: 'British Council',
    url: 'https://learnenglish.britishcouncil.org/free-resources/listening',
    skills: ['Nghe'],
    level: 'A1–C1',
    format: 'Bài học',
    description:
      'Luyện nghe qua tình huống đời sống và công việc, chọn bài theo trình độ CEFR.',
    accessNote:
      'Phần tài nguyên miễn phí; một số tính năng cần tài khoản miễn phí. Các khóa học khác trên website có thể trả phí.',
  },
  {
    id: 'bc-reading',
    title: 'Reading theo trình độ',
    provider: 'British Council',
    url: 'https://learnenglish.britishcouncil.org/free-resources/reading',
    skills: ['Đọc'],
    level: 'A1–C1',
    format: 'Bài học',
    description:
      'Đọc văn bản thực tế và làm bài tập hiểu nội dung, từ email đến bài báo.',
    accessNote:
      'Phần tài nguyên miễn phí; một số tính năng cần tài khoản miễn phí.',
  },
  {
    id: 'bc-writing',
    title: 'Writing theo trình độ',
    provider: 'British Council',
    url: 'https://learnenglish.britishcouncil.org/free-resources/writing',
    skills: ['Viết'],
    level: 'A1–C1',
    format: 'Bài học',
    description:
      'Học cách tổ chức bài viết qua mẫu email, báo cáo và các dạng văn bản.',
    accessNote:
      'Phần tài nguyên miễn phí; không phải khóa IELTS trả phí của nhà cung cấp.',
  },
  {
    id: 'bc-grammar',
    title: 'Nền tảng ngữ pháp tiếng Anh',
    provider: 'British Council',
    url: 'https://learnenglish.britishcouncil.org/free-resources/grammar',
    skills: ['Ngữ pháp'],
    level: 'Theo trình độ',
    format: 'Bài tập',
    description:
      'Ôn kiến thức ngữ pháp với giải thích và bài tập theo nhóm trình độ.',
    accessNote:
      'Tài nguyên ngữ pháp miễn phí; website cũng giới thiệu các khóa trả phí.',
  },
  {
    id: 'cambridge-activities',
    title: 'Hoạt động luyện tiếng Anh miễn phí',
    provider: 'Cambridge English',
    url: 'https://www.cambridgeenglish.org/learning-english/activities-for-learners/',
    skills: ['Nghe', 'Đọc', 'Viết', 'Ngữ pháp'],
    level: 'A1–C2',
    format: 'Bài tập',
    description: 'Chọn bài tập ngắn theo kỹ năng, trình độ và thời gian học.',
    accessNote:
      'Các hoạt động trên trang này miễn phí; không bao gồm toàn bộ sách luyện thi thương mại.',
  },
  {
    id: 'cambridge-writing',
    title: 'Write & Improve — luyện viết có phản hồi',
    provider: 'Cambridge',
    url: 'https://writeandimprove.com/',
    skills: ['Viết'],
    level: 'Nhiều trình độ',
    format: 'Bài tập',
    description:
      'Viết theo đề bài và nhận phản hồi tự động để sửa, viết lại và tiến bộ.',
    accessNote:
      'Công cụ cơ bản miễn phí, có thể dùng không đăng ký. Test Zone IELTS/B2 và Class View là các dịch vụ khác, có thể trả phí.',
  },
  {
    id: 'ets-toeic',
    title: 'TOEIC Listening & Reading — đề mẫu chính thức',
    provider: 'ETS',
    url: 'https://www.ets.org/toeic/test-takers/prepare.html',
    skills: ['Nghe', 'Đọc', 'Luyện thi'],
    level: 'TOEIC',
    format: 'Đề mẫu',
    description:
      'Trang gốc để tải sample test và handbook của đơn vị phát triển bài thi TOEIC.',
    accessNote:
      'Sample Tests/Handbook tải miễn phí. Official Learning and Preparation Course và sách luyện thi không được gắn nhãn miễn phí. Không phải bài thi chứng chỉ trên nền tảng này.',
  },
  {
    id: 'bbc-video',
    title: '6 Minute English — Learning a new food culture',
    provider: 'BBC Learning English',
    url: 'https://www.youtube.com/watch?v=5kr5ADrMeYU',
    skills: ['Nghe'],
    level: 'Tự chọn theo khả năng',
    format: 'Video',
    description:
      'Một bài học nghe và từ vựng về văn hóa ẩm thực từ kênh BBC Learning English.',
    accessNote:
      'Xem miễn phí trên YouTube; có thể có quảng cáo hoặc giới hạn theo khu vực.',
  },
  {
    id: 'bbc-channel',
    title: 'BBC Learning English trên YouTube',
    provider: 'BBC Learning English',
    url: 'https://www.youtube.com/@bbclearningenglish',
    skills: ['Nghe', 'Ngữ pháp'],
    level: 'Nhiều trình độ',
    format: 'Video',
    description:
      'Khám phá các video học từ vựng, ngữ pháp và tiếng Anh qua chủ đề thực tế.',
    accessNote:
      'Liên kết kênh gốc, không tải lại video. YouTube có thể hiển thị quảng cáo.',
  },
  {
    id: 'voa-course',
    title: "Let's Learn English — Level 1",
    provider: 'VOA Learning English',
    url: 'https://learningenglish.voanews.com/p/5644.html',
    skills: ['Nghe', 'Đọc'],
    level: 'Người mới bắt đầu',
    format: 'Bài học',
    description:
      'Chuỗi bài học tiếng Anh Mỹ qua video và tài liệu đi kèm cho người mới học.',
    accessNote:
      'Bài học công khai trên website gốc; khả năng truy cập tùy khu vực.',
  },
]
