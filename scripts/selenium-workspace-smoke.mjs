import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { Builder, By, until } from 'selenium-webdriver'
import chrome from 'selenium-webdriver/chrome.js'

async function createBrowser() {
  return new Builder()
    .forBrowser('chrome')
    .setChromeOptions(
      new chrome.Options().addArguments(
        '--headless=new',
        '--no-sandbox',
        '--disable-dev-shm-usage',
      ),
    )
    .build()
}
let browser = await createBrowser()
const base = 'http://localhost:5173'

async function nextRole() {
  await browser.quit()
  browser = await createBrowser()
  await size(1440, 900)
}

async function size(width, height) {
  if (width >= 768) {
    await browser.sendDevToolsCommand(
      'Emulation.clearDeviceMetricsOverride',
      {},
    )
    await browser.sendDevToolsCommand('Emulation.setTouchEmulationEnabled', {
      enabled: false,
    })
    await browser.manage().window().setRect({ width, height })
    return
  }
  await browser.manage().window().setRect({ width, height })
  await browser.sendDevToolsCommand('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 768,
  })
}

async function noHorizontalOverflow() {
  const dimensions = await browser.executeScript(`return {
    viewport: innerWidth,
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }`)
  assert.ok(
    dimensions.scroll <= dimensions.client + 1,
    `Horizontal overflow: ${JSON.stringify(dimensions)}`,
  )
}

async function login(role, destination) {
  await browser.get(base + '/login')
  await browser.wait(until.elementLocated(By.css('input[name="email"]')), 10000)
  await browser
    .findElement(By.css('input[name="email"]'))
    .sendKeys(role + '@demo.local')
  await browser.findElement(By.css('input[name="password"]')).sendKeys('123456')
  await browser.findElement(By.css('form button[type="submit"]')).click()
  await browser.wait(until.urlContains(destination), 10000)
  await browser.wait(until.elementLocated(By.css('h1')), 10000)
  await noHorizontalOverflow()
  process.stdout.write(role + ' → ' + destination + '\n')
}

try {
  await size(1440, 900)
  await login('admin', '/admin')
  assert.match(
    await browser.findElement(By.css('h1')).getText(),
    /Bảng điều khiển hệ thống/,
  )
  await browser.wait(
    until.elementLocated(
      By.xpath('//*[contains(text(), "Khóa học cập nhật gần đây")]'),
    ),
    10000,
  )
  writeFileSync(
    'E:/ai-learning-api/target/workspace-admin-desktop.png',
    Buffer.from(await browser.takeScreenshot(), 'base64'),
  )
  await nextRole()
  await login('lecture', '/instructor/courses')
  assert.match(await browser.findElement(By.css('h1')).getText(), /khóa học/i)
  await browser.wait(until.elementLocated(By.css('.studio-card')), 10000)
  const createLink = await browser.findElement(
    By.xpath('//a[contains(., "Đăng khóa học")]'),
  )
  assert.equal(
    await createLink.getAttribute('href'),
    base + '/instructor/courses?new=1',
  )
  await browser.get(base + '/instructor/courses?new=1')
  await browser.wait(
    until.elementLocated(By.css('form input[name="title"]')),
    10000,
  )
  assert.equal(
    await browser
      .findElement(
        By.css('form select[name="categoryId"] option:not([disabled])'),
      )
      .isDisplayed(),
    true,
  )
  await browser.get(base + '/instructor/courses')
  await nextRole()
  await login('leader', '/instructor/courses')
  await nextRole()
  await login('student', '/dashboard')
  await browser.get(base + '/flashcards')
  await browser.wait(
    until.elementLocated(
      By.xpath('//*[contains(text(), "Lập trình · Kiến thức cốt lõi")]'),
    ),
    10000,
  )
  await noHorizontalOverflow()
  const studyButton = await browser.findElement(
    By.xpath('//button[contains(., "Ôn tập")]'),
  )
  await browser.executeScript('arguments[0].click()', studyButton)
  const flashcard = await browser.wait(
    until.elementLocated(By.css('[role="dialog"] .study-card')),
    10000,
  )
  assert.match(await flashcard.getText(), /JVM là gì/)
  await browser.executeScript('arguments[0].click()', flashcard)
  assert.match(await flashcard.getText(), /Java Virtual Machine/)
  const closeStudy = await browser.findElement(
    By.xpath('//button[normalize-space()="Đóng"]'),
  )
  await browser.executeScript('arguments[0].click()', closeStudy)
  await browser.wait(until.stalenessOf(flashcard), 10000)
  writeFileSync(
    'E:/ai-learning-api/target/workspace-flashcards.png',
    Buffer.from(await browser.takeScreenshot(), 'base64'),
  )
  await nextRole()
  await login('guest', '/courses')
  assert.match(
    await browser.findElement(By.css('h1')).getText(),
    /Chọn kỹ năng/,
  )
  await nextRole()
  await login('admin', '/admin')
  await size(390, 844)
  await browser.get(base + '/admin')
  await browser.wait(until.elementLocated(By.css('h1')), 10000)
  await noHorizontalOverflow()
  writeFileSync(
    'E:/ai-learning-api/target/workspace-admin-mobile.png',
    Buffer.from(await browser.takeScreenshot(), 'base64'),
  )
} finally {
  await browser.quit()
}
