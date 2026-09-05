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
const preview = spawn(process.execPath,
  [viteCli, 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { stdio: 'pipe' })

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
      const response = await fetch(baseUrl, { signal: AbortSignal.timeout(1000) })
      if (response.ok) return
    } catch { /* server is still starting */ }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error('Vite preview did not start')
}

let driver
try {
  await waitForServer()
  const builder = new Builder().forBrowser('chrome')
    .setChromeOptions(new chrome.Options().addArguments('--headless=new', '--no-sandbox', '--disable-dev-shm-usage'))
  const localDriver = cachedWindowsDriver()
  if (localDriver) builder.setChromeService(new chrome.ServiceBuilder(localDriver))
  driver = await builder.build()

  for (const viewport of [{ width: 320, height: 700 }, { width: 768, height: 900 }, { width: 1440, height: 900 }]) {
    await driver.manage().window().setRect(viewport)
    await driver.get(baseUrl)
    await driver.wait(until.elementLocated(By.css('h1')), 5000)
    assert.match(await driver.findElement(By.css('h1')).getText(), /Học lập trình/)
    await assertNoHorizontalOverflow(driver, viewport.width, 'home')
  }

  await driver.findElement(By.linkText('Xem khóa học')).click()
  await driver.wait(until.urlContains('/courses'), 5000)
  assert.equal((await driver.getCurrentUrl()).endsWith('/courses'), true)

  await installAuthenticatedApiFixture(driver)
  for (const viewport of [{ width: 320, height: 700 }, { width: 768, height: 900 }, { width: 1440, height: 900 }]) {
    await driver.manage().window().setRect(viewport)
    await driver.get(`${baseUrl}/dashboard`)
    const heading = await driver.wait(until.elementLocated(By.css('h1')), 5000)
    assert.match(await heading.getText(), /Chào Học viên kiểm thử/)
    await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Clean Architecture thực chiến')]")), 5000)
    await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Hoạt động theo khóa học')]")), 5000)
    await assertNoHorizontalOverflow(driver, viewport.width, 'learning dashboard')
  }
} finally {
  if (driver) await driver.quit()
  preview.kill()
}

async function assertNoHorizontalOverflow(driver, viewportWidth, pageName) {
  const dimensions = await driver.executeScript(`return {
    scroll: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
    client: document.documentElement.clientWidth
  }`)
  assert.ok(dimensions.scroll <= dimensions.client + 1,
    `Horizontal overflow on ${pageName} at ${viewportWidth}px: ${dimensions.scroll}px > ${dimensions.client}px`)
}

async function installAuthenticatedApiFixture(driver) {
  const session = {
    accessToken: 'e30.eyJleHAiOjQxMDI0NDQ4MDB9.',
    tokenType: 'Bearer',
    expiresIn: 3600,
    user: {
      id: '8ec33d91-0cc4-445f-9266-5f44d7bca900',
      email: 'learner@example.com',
      displayName: 'Học viên kiểm thử',
      roles: ['STUDENT'],
    },
  }
  const analytics = {
    completedLessons: 12,
    coursesWithCompletions: 2,
    lastCompletedAt: '2026-09-04T10:00:00Z',
    courses: [{
      courseId: '8aff449f-cfa6-4ed8-a3e7-5461090ee101',
      completedLessons: 7,
      lastCompletedAt: '2026-09-04T10:00:00Z',
    }],
  }
  const enrollments = [{
    id: 'enrollment-1',
    status: 'ACTIVE',
    enrolledAt: '2026-09-01T00:00:00Z',
    course: {
      id: '8aff449f-cfa6-4ed8-a3e7-5461090ee101',
      slug: 'clean-architecture',
      title: 'Clean Architecture thực chiến',
      shortDescription: 'Thiết kế hệ thống dễ bảo trì.',
      level: 'INTERMEDIATE',
      price: 0,
      currency: 'VND',
      thumbnailUrl: null,
      estimatedDurationMinutes: 180,
      instructorName: 'Giảng viên',
      category: { id: 'category-1', slug: 'backend', name: 'Backend', description: null },
    },
  }]
  const fixtures = {
    '/api/v1/auth/refresh': session,
    '/api/v1/me/learning-analytics?courseLimit=20': analytics,
    '/api/v1/me/enrollments': enrollments,
    '/api/v1/me/notifications?limit=20': { content: [], nextCursor: null, unreadCount: 0 },
  }
  const fixtureSource = `
    const originalFetch = window.fetch.bind(window);
    const fixtures = ${JSON.stringify(fixtures)};
    window.fetch = (input, init) => {
      const requestUrl = typeof input === 'string' ? input : input.url;
      const url = new URL(requestUrl, window.location.origin);
      const fixture = fixtures[url.pathname + url.search];
      if (fixture !== undefined) {
        return Promise.resolve(new Response(JSON.stringify(fixture), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }));
      }
      return originalFetch(input, init);
    };
  `
  await driver.sendDevToolsCommand('Page.addScriptToEvaluateOnNewDocument', { source: fixtureSource })
}
