import { spawn } from 'node:child_process'
import assert from 'node:assert/strict'
import { existsSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { Builder, By, until } from 'selenium-webdriver'
import chrome from 'selenium-webdriver/chrome.js'

const port = 4173
const baseUrl = `http://127.0.0.1:${port}`
const viteCli = join(process.cwd(), 'node_modules', 'vite', 'bin', 'vite.js')
const preview = spawn(
  process.execPath,
  [
    viteCli,
    'preview',
    '--host',
    '127.0.0.1',
    '--port',
    String(port),
    '--strictPort',
  ],
  { stdio: 'pipe' },
)

function cachedWindowsDriver() {
  if (process.platform !== 'win32') return undefined
  const root = join(homedir(), '.cache', 'selenium', 'chromedriver', 'win64')
  if (!existsSync(root)) return undefined
  const versions = readdirSync(root).sort().reverse()
  const executable = versions[0] && join(root, versions[0], 'chromedriver.exe')
  return executable && existsSync(executable) ? executable : undefined
}

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(baseUrl, {
        signal: AbortSignal.timeout(1000),
      })
      if (response.ok) return
    } catch {
      /* server is still starting */
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error('Vite preview did not start')
}

let driver
try {
  await waitForServer()
  const builder = new Builder()
    .forBrowser('chrome')
    .setChromeOptions(
      new chrome.Options().addArguments(
        '--headless=new',
        '--no-sandbox',
        '--disable-dev-shm-usage',
      ),
    )
  const localDriver = cachedWindowsDriver()
  if (localDriver)
    builder.setChromeService(new chrome.ServiceBuilder(localDriver))
  driver = await builder.build()
  await installPracticeApiFixture(driver)

  for (const viewport of [
    { width: 320, height: 700 },
    { width: 768, height: 900 },
    { width: 1440, height: 900 },
  ]) {
    await driver.manage().window().setRect(viewport)
    await driver.sendDevToolsCommand('Emulation.setDeviceMetricsOverride', {
      ...viewport,
      deviceScaleFactor: 1,
      mobile: viewport.width < 768,
    })
    await driver.get(baseUrl)
    await driver.wait(until.elementLocated(By.css('h1')), 5000)
    assert.match(
      await driver.findElement(By.css('h1')).getText(),
      /Học cùng nhau/,
    )
    await assertNoHorizontalOverflow(driver, viewport.width, 'home')
    await driver.get(`${baseUrl}/login`)
    await driver.wait(until.elementLocated(By.css('input[name="email"]')), 5000)
    await assertNoHorizontalOverflow(driver, viewport.width, 'login')
    await driver.get(`${baseUrl}/register`)
    await driver.wait(
      until.elementLocated(By.css('input[name="displayName"]')),
      5000,
    )
    await assertNoHorizontalOverflow(driver, viewport.width, 'register')
    await driver.get(`${baseUrl}/practice`)
    await driver.wait(until.elementLocated(By.css('.practice-exam-card')), 5000)
    await assertNoHorizontalOverflow(driver, viewport.width, 'practice catalog')
    await driver.get(`${baseUrl}/practice/exams/english-workplace-starter`)
    await driver.wait(until.elementLocated(By.css('.practice-intro h1')), 5000)
    await assertNoHorizontalOverflow(
      driver,
      viewport.width,
      'practice exam intro',
    )
  }

  await driver.get(baseUrl)
  const spacesLink = await driver.wait(
    until.elementLocated(By.css('.community-hero a[href="/community/spaces"]')),
    5000,
  )
  await driver.get(await spacesLink.getAttribute('href'))
  await driver.wait(until.urlContains('/community/spaces'), 5000)
  const spacesHeading = await driver.wait(
    until.elementLocated(By.css('h1')),
    5000,
  )
  assert.match(await spacesHeading.getText(), /Hội nhóm & trang/)

  await installAuthenticatedApiFixture(driver)
  for (const viewport of [
    { width: 320, height: 700 },
    { width: 768, height: 900 },
    { width: 1440, height: 900 },
  ]) {
    await driver.manage().window().setRect(viewport)
    await driver.sendDevToolsCommand('Emulation.setDeviceMetricsOverride', {
      ...viewport,
      deviceScaleFactor: 1,
      mobile: viewport.width < 768,
    })
    await driver.get(`${baseUrl}/dashboard`)
    await driver.get(baseUrl)
    await driver.wait(
      until.elementLocated(By.css('.community-comment-preview')),
      5000,
    )
    assert.equal(
      await driver.executeScript(`
      const head = document.querySelector('.community-post-head');
      return Boolean(head.querySelector('.community-post-space').compareDocumentPosition(head.querySelector('strong')) & Node.DOCUMENT_POSITION_FOLLOWING);
    `),
      true,
    )
    await assertNoHorizontalOverflow(
      driver,
      viewport.width,
      'social feed and comment preview',
    )
    await driver.findElement(By.id('community-discovery-input')).sendKeys('h')
    await driver.wait(
      until.elementLocated(By.css('.community-discovery-result')),
      5000,
    )
    const searchBox = await driver
      .findElement(By.id('community-discovery-input'))
      .getRect()
    assert.ok(
      searchBox.height < 80 && searchBox.width > 120,
      'Homepage search must stay horizontal and readable',
    )
    await assertNoHorizontalOverflow(
      driver,
      viewport.width,
      'live community search',
    )
    const person = await driver.findElement(
      By.css(
        '.community-discovery-result[href="/community/people/fixture-person"]',
      ),
    )
    await person.click()
    await driver.wait(
      until.elementLocated(By.css('.community-profile-hero h1')),
      5000,
    )
    await assertNoHorizontalOverflow(driver, viewport.width, 'public profile')
    await driver.get(`${baseUrl}/resources`)
    await driver.wait(
      until.elementLocated(By.css('.english-resource-card')),
      5000,
    )
    assert.equal(
      (await driver.findElements(By.css('.english-resource-card'))).length,
      10,
    )
    await driver
      .findElement(By.css('.english-resource-filters input'))
      .sendKeys('TOEIC')
    await driver.wait(
      async () =>
        (await driver.findElements(By.css('.english-resource-card'))).length ===
        1,
      5000,
    )
    await assertNoHorizontalOverflow(
      driver,
      viewport.width,
      'English resource filters',
    )
    await driver.get(baseUrl)
    await driver.wait(
      until.elementLocated(By.css('.community-comment-preview')),
      5000,
    )
    const reactionPicker = await driver.findElement(
      By.css('button[aria-label="Chọn cảm xúc"]'),
    )
    await driver.executeScript('arguments[0].click()', reactionPicker)
    await driver.wait(
      until.elementLocated(By.css('.community-reaction-picker')),
      5000,
    )
    await assertNoHorizontalOverflow(
      driver,
      viewport.width,
      'reaction picker and poll',
    )
    await driver
      .findElement(By.css('button[aria-label="Mở đoạn chat"]'))
      .click()
    const conversation = await driver.wait(
      until.elementLocated(By.css('.direct-conversation')),
      5000,
    )
    await driver.executeScript('arguments[0].click()', conversation)
    await driver.wait(until.elementLocated(By.css('.direct-bubble')), 5000)
    await assertNoHorizontalOverflow(
      driver,
      viewport.width,
      'private inbox and direct thread',
    )
    await driver
      .findElement(By.css('button[aria-label="Đóng cuộc trò chuyện"]'))
      .click()
    await driver
      .findElement(By.css('button[aria-label="Đóng hộp thư"]'))
      .click()
    await driver.get(`${baseUrl}/community/spaces/fixture-space`)
    await driver.wait(
      until.elementLocated(By.css('.community-review-item')),
      5000,
    )
    const chat = await driver.findElement(By.css('.community-chat-toggle'))
    await driver.executeScript('arguments[0].click()', chat)
    await driver.wait(
      until.elementLocated(By.css('.community-chat-message')),
      5000,
    )
    await assertNoHorizontalOverflow(
      driver,
      viewport.width,
      'space moderation and open chat',
    )
    await driver.get(`${baseUrl}/community/spaces/private-fixture-space`)
    await driver.wait(until.elementLocated(By.css('.community-empty')), 5000)
    assert.equal(
      (await driver.findElements(By.css('.community-chat-toggle'))).length,
      0,
    )
    assert.equal(
      (await driver.findElements(By.css('.community-post'))).length,
      0,
    )
    await assertNoHorizontalOverflow(
      driver,
      viewport.width,
      'private pending membership',
    )
    await driver.get(`${baseUrl}/dashboard`)
    const heading = await driver.wait(until.elementLocated(By.css('h1')), 5000)
    assert.match(await heading.getText(), /Chào Học viên kiểm thử/)
    await driver.wait(
      until.elementLocated(
        By.xpath(
          "//*[contains(text(), 'English for Workplace Communication')]",
        ),
      ),
      5000,
    )
    await driver.wait(
      until.elementLocated(
        By.xpath("//*[contains(text(), 'Hoạt động theo khóa học')]"),
      ),
      5000,
    )
    await assertNoHorizontalOverflow(
      driver,
      viewport.width,
      'learning dashboard',
    )
    await driver.get(`${baseUrl}/practice/attempts/multipart/result`)
    await driver.wait(
      until.elementLocated(By.css('.practice-result-tabs')),
      5000,
    )
    assert.equal(
      (await driver.findElements(By.css('.practice-result-tabs button')))
        .length,
      20,
    )
    assert.equal(
      (await driver.findElements(By.css('.practice-result-stats > div')))
        .length,
      1,
    )
    await assertNoHorizontalOverflow(
      driver,
      viewport.width,
      'multipart exam result',
    )
  }

  await installAuthenticatedApiFixture(driver, 'LECTURE')
  for (const viewport of [
    { width: 320, height: 700 },
    { width: 768, height: 900 },
    { width: 1440, height: 900 },
  ]) {
    await driver.manage().window().setRect(viewport)
    await driver.sendDevToolsCommand('Emulation.setDeviceMetricsOverride', {
      ...viewport,
      deviceScaleFactor: 1,
      mobile: viewport.width < 768,
    })
    await driver.get(`${baseUrl}/instructor/writing-reviews`)
    await driver.wait(
      until.elementLocated(By.css('.practice-reviewer-text')),
      5000,
    )
    assert.equal(
      await driver.findElement(By.css('h1')).getText(),
      'Chấm bài Viết',
    )
    assert.equal(
      (await driver.findElements(By.css('.practice-rubric select'))).length,
      4,
    )
    await assertNoHorizontalOverflow(driver, viewport.width, 'writing review')
    await driver.get(`${baseUrl}/instructor/exams`)
    await driver.wait(until.elementLocated(By.css('.exam-revision-card')), 5000)
    await assertNoHorizontalOverflow(driver, viewport.width, 'exam studio')
    await driver.get(`${baseUrl}/instructor/exams/exam-editor`)
    await driver.wait(
      until.elementLocated(By.css('.exam-question-editor')),
      5000,
    )
    assert.equal(
      (await driver.findElements(By.css('.exam-question-editor textarea')))
        .length,
      2,
    )
    await assertNoHorizontalOverflow(driver, viewport.width, 'exam editor')
  }
} finally {
  if (driver) await driver.quit()
  preview.kill()
}

async function assertNoHorizontalOverflow(driver, viewportWidth, pageName) {
  const dimensions = await driver.executeScript(`return {
    scroll: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
    client: document.documentElement.clientWidth,
    viewport: window.innerWidth
  }`)
  assert.ok(
    dimensions.scroll <= dimensions.client + 1,
    `Horizontal overflow on ${pageName} at ${viewportWidth}px: ${dimensions.scroll}px > ${dimensions.client}px`,
  )
  assert.equal(
    dimensions.viewport,
    viewportWidth,
    'Browser must use the requested viewport',
  )
}

async function installAuthenticatedApiFixture(driver, role = 'STUDENT') {
  const session = {
    accessToken: 'e30.eyJleHAiOjQxMDI0NDQ4MDB9.',
    tokenType: 'Bearer',
    expiresIn: 3600,
    user: {
      id: '8ec33d91-0cc4-445f-9266-5f44d7bca900',
      email: 'learner@example.com',
      displayName: 'Học viên kiểm thử',
      roles: [role],
    },
  }
  const analytics = {
    completedLessons: 12,
    coursesWithCompletions: 2,
    lastCompletedAt: '2026-09-04T10:00:00Z',
    courses: [
      {
        courseId: '8aff449f-cfa6-4ed8-a3e7-5461090ee101',
        completedLessons: 7,
        lastCompletedAt: '2026-09-04T10:00:00Z',
      },
    ],
  }
  const enrollments = [
    {
      id: 'enrollment-1',
      status: 'ACTIVE',
      enrolledAt: '2026-09-01T00:00:00Z',
      course: {
        id: '8aff449f-cfa6-4ed8-a3e7-5461090ee101',
        slug: 'english-workplace-communication',
        title: 'English for Workplace Communication',
        shortDescription: 'Luyện giao tiếp tiếng Anh nơi công sở.',
        level: 'INTERMEDIATE',
        price: 0,
        currency: 'VND',
        thumbnailUrl: null,
        estimatedDurationMinutes: 180,
        instructorName: 'Giảng viên',
        category: {
          id: 'category-1',
          slug: 'workplace-english',
          name: 'Tiếng Anh công sở',
          description: null,
        },
      },
    },
  ]
  const multipartSections = Array.from({ length: 20 }, (_, index) => ({
    id: `section-${index}`,
    skill: 'READING',
    title: `Reading part ${index + 1}`,
    passage: `Original reading passage ${index + 1}.`,
    audioText: null,
    questions: [
      {
        id: `question-${index}`,
        kind: 'TEXT',
        prompt: `Question ${index + 1}`,
        options: [],
      },
    ],
  }))
  const fixtures = {
    '/api/v1/community/direct/conversations?filter=all': {
      conversations: [
        {
          id: 'fixture-direct',
          peerId: 'peer',
          peerName: 'Người học tiếng Anh',
          initiatorId: 'peer',
          status: 'ACTIVE',
          lastMessage: 'Let us practice English!',
          updatedAt: '2026-09-28T08:00:00Z',
          unreadCount: 1,
          readSequence: 0,
        },
      ],
      totalUnread: 1,
      requestCount: 0,
      nextPage: null,
    },
    '/api/v1/community/direct/conversations/fixture-direct/messages': {
      messages: [
        {
          id: 'direct-message',
          sequence: 1,
          authorId: 'peer',
          body: 'Let us practice English!',
          createdAt: '2026-09-28T08:00:00Z',
        },
      ],
      oldestSequence: 1,
      newestSequence: 1,
      hasMore: false,
    },
    '/api/v1/community/direct/conversations/fixture-direct/read': null,
    '/api/v1/community/spaces': [
      {
        id: 'fixture-space',
        name: 'English Community',
        kind: 'GROUP',
        visibility: 'PUBLIC',
        description: 'Practice English together.',
        ownerId: session.user.id,
        ownerName: session.user.displayName,
        memberCount: 2,
        myRole: 'OWNER',
        myStatus: 'ACTIVE',
        createdAt: '2026-09-28T08:00:00Z',
      },
    ],
    '/api/v1/community/spaces/fixture-space': {
      id: 'fixture-space',
      name: 'English Community',
      kind: 'GROUP',
      visibility: 'PUBLIC',
      description: 'Practice English together.',
      ownerId: session.user.id,
      ownerName: session.user.displayName,
      memberCount: 2,
      myRole: 'OWNER',
      myStatus: 'ACTIVE',
      createdAt: '2026-09-28T08:00:00Z',
    },
    '/api/v1/community/spaces/private-fixture-space': {
      id: 'private-fixture-space',
      name: 'Private English Club',
      kind: 'PAGE',
      visibility: 'PRIVATE',
      description: 'Members only.',
      ownerId: 'owner',
      ownerName: 'Owner',
      memberCount: 2,
      myRole: 'MEMBER',
      myStatus: 'PENDING',
      createdAt: '2026-09-28T08:00:00Z',
    },
    '/api/v1/community/spaces/fixture-space/members?page=0': [],
    '/api/v1/community/spaces/fixture-space/posts/pending?page=0': [
      {
        id: 'pending',
        authorName: 'Thành viên',
        body: 'Please review my English learning tip.',
        status: 'PENDING',
      },
    ],
    '/api/v1/community/spaces/fixture-space/chat': {
      messages: [
        {
          id: 'message',
          sequence: 1,
          authorId: 'member',
          authorName: 'Người học',
          body: 'How do you practise listening every day?',
          removed: false,
          createdAt: '2026-09-28T08:00:00Z',
        },
      ],
      oldestSequence: 1,
      newestSequence: 1,
      hasMore: false,
    },
    '/api/v1/practice/attempts/multipart': {
      id: 'multipart',
      status: 'SUBMITTED',
      answers: {},
      exam: {
        id: 'multipart-exam',
        slug: 'multipart',
        title: 'Multipart English Practice',
        description: 'Twenty reading parts.',
        durationMinutes: 60,
        sections: multipartSections,
      },
    },
    '/api/v1/practice/attempts/multipart/result': {
      attemptId: 'multipart',
      examTitle: 'Multipart English Practice',
      correct: 0,
      total: 20,
      sections: multipartSections.map((part) => ({
        skill: part.skill,
        title: part.title,
        correct: 0,
        total: 1,
        questions: [
          {
            questionId: part.questions[0].id,
            answer: '',
            status: 'UNANSWERED',
            correct: false,
            correctAnswer: 'Tuesday',
            explanation: 'The passage names Tuesday.',
            writingFeedback: null,
          },
        ],
      })),
    },
    '/api/v1/auth/refresh': session,
    '/api/v1/me/learning-analytics?courseLimit=20': analytics,
    '/api/v1/me/enrollments': enrollments,
    '/api/v1/me/notifications?limit=20': {
      content: [],
      nextCursor: null,
      unreadCount: 0,
    },
    '/api/v1/practice/reviews/pending': [
      {
        attemptId: 'attempt-review',
        questionId: 'writing-question',
        examTitle: 'English Workplace Starter',
        prompt: 'Write a workplace email.',
        answer: 'I would suggest a workshop about clear and polite emails.',
        submittedAt: '2026-09-27T10:00:00Z',
      },
    ],
    '/api/v1/practice/authoring/exams?page=0': [
      {
        id: 'exam-editor',
        slug: 'english-email',
        title: 'English Email Practice',
        durationMinutes: 20,
        revision: 1,
        status: 'DRAFT',
        version: 0,
      },
    ],
    '/api/v1/practice/authoring/exams/exam-editor': {
      id: 'exam-editor',
      seriesId: 'series-editor',
      authorId: session.user.id,
      revision: 1,
      status: 'DRAFT',
      version: 0,
      exam: {
        id: 'exam-editor',
        slug: 'english-email',
        title: 'English Email Practice',
        description: 'Original workplace English questions.',
        durationMinutes: 20,
        sections: [
          {
            skill: 'READING',
            title: 'An email',
            passage: 'The meeting is Tuesday.',
            audioText: null,
            questions: [
              {
                kind: 'TEXT',
                prompt: 'When is the meeting?',
                options: [],
                correctAnswer: 'Tuesday',
                explanation: 'The email names Tuesday.',
              },
            ],
          },
        ],
      },
    },
  }
  const fixtureSource = `
    (() => {
    const originalFetch = window.fetch.bind(window);
    const fixtures = ${JSON.stringify(fixtures)};
    window.fetch = (input, init) => {
      const requestUrl = typeof input === 'string' ? input : input.url;
      const url = new URL(requestUrl, window.location.origin);
      let fixture = fixtures[url.pathname + url.search];
      if (url.pathname === '/api/v1/community/search') fixture = {spaces:[{id:'fixture-space',name:'Hội trí tuệ nhân tạo',kind:'GROUP',visibility:'PRIVATE'}],people:[{id:'fixture-person',displayName:'Hà Anh'}],spacesHasMore:false,peopleHasMore:false,page:0};
      if (url.pathname === '/api/v1/community/people/fixture-person') fixture = {id:'fixture-person',displayName:'Hà Anh'};
      if (url.pathname === '/api/v1/community/feed') fixture = {posts:[{
        id:'fixture-post',authorId:'member',authorName:'Người học',spaceId:'fixture-space',spaceName:'English Community',body:'A useful listening tip: '+ 'English'.repeat(60),
        sharedPostId:null,sharedBody:null,sharedAuthorName:null,createdAt:'2026-09-28T08:00:00Z',likeCount:3,commentCount:5,shareCount:2,likedByViewer:false,shareable:true,status:'ACTIVE',
        commentPreview:[{id:'comment',postId:'fixture-post',parentId:null,authorId:'other',authorName:'Bạn học',body:'Thanks for sharing your practice routine.',removed:false,createdAt:'2026-09-28T08:00:00Z'}],
        appearance:{attachmentUrl:'https://example.com/enroll',backgroundColor:'#173569',fontColor:'#ffffff'},
        poll:{kind:'POLL',question:'Which skill would you like to practice?',options:[{id:'reading',label:'Reading',votes:2},{id:'listening',label:'Listening',votes:1}],totalVotes:3,myOptionId:null,closesAt:null,closed:false},
        reactionCounts:{LIKE:2,LOVE:1},viewerReaction:null,
      }],nextCursor:null};
      if (fixture !== undefined) {
        return Promise.resolve(new Response(JSON.stringify(fixture), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }));
      }
      return originalFetch(input, init);
    };
    })();
  `
  await driver.sendDevToolsCommand('Page.addScriptToEvaluateOnNewDocument', {
    source: fixtureSource,
  })
}

async function installPracticeApiFixture(driver) {
  const exam = {
    slug: 'english-workplace-starter',
    title: 'English Workplace Starter',
    description: 'Luyện nghe, đọc và viết trong tình huống công việc.',
    durationMinutes: 35,
    sections: [
      {
        id: 'part-listening',
        skill: 'LISTENING',
        title: 'Workplace announcement',
        passage: null,
        audioText: 'The meeting starts at nine.',
        questions: [
          {
            id: 'question-1',
            kind: 'CHOICE',
            prompt: 'When?',
            options: ['Nine', 'Ten'],
          },
        ],
      },
      {
        id: 'part-reading',
        skill: 'READING',
        title: 'Email',
        passage: 'Please send your notes by Friday.',
        audioText: null,
        questions: [
          {
            id: 'question-2',
            kind: 'CHOICE',
            prompt: 'When?',
            options: ['Friday', 'Monday'],
          },
        ],
      },
      {
        id: 'part-writing',
        skill: 'WRITING',
        title: 'Reply',
        passage: 'Suggest a topic for a workshop.',
        audioText: null,
        questions: [
          {
            id: 'question-3',
            kind: 'WRITING',
            prompt: 'Write a short email.',
            options: [],
          },
        ],
      },
    ],
  }
  const fixtureSource = `
    (() => {
    const practiceFetch = window.fetch.bind(window);
    const practiceExam = ${JSON.stringify(exam)};
    window.fetch = (input, init) => {
      const url = new URL(typeof input === 'string' ? input : input.url, window.location.origin);
      if (url.pathname === '/api/v1/practice/exams') {
        return Promise.resolve(new Response(JSON.stringify([{...practiceExam, skills: ['LISTENING', 'READING', 'WRITING']}]), {status: 200}));
      }
      if (url.pathname === '/api/v1/practice/exams/english-workplace-starter') {
        return Promise.resolve(new Response(JSON.stringify(practiceExam), {status: 200}));
      }
      return practiceFetch(input, init);
    };
    })();
  `
  await driver.sendDevToolsCommand('Page.addScriptToEvaluateOnNewDocument', {
    source: fixtureSource,
  })
}
