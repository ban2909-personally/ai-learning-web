import assert from 'node:assert/strict'
import { Builder, By, until } from 'selenium-webdriver'
import chrome from 'selenium-webdriver/chrome.js'

const base = 'http://localhost:5173'
const browser = await new Builder()
  .forBrowser('chrome')
  .setChromeOptions(
    new chrome.Options().addArguments(
      '--headless=new',
      '--no-sandbox',
      '--disable-dev-shm-usage',
    ),
  )
  .build()

async function noOverflow(width, path) {
  await browser.manage().window().setRect({ width, height: 900 })
  await browser.sendDevToolsCommand('Emulation.setDeviceMetricsOverride', {
    width,
    height: 900,
    deviceScaleFactor: 1,
    mobile: width < 768,
  })
  await browser.get(base + path)
  await browser.wait(until.elementLocated(By.css('h1')), 10000)
  const dimensions = await browser.executeScript(
    'return { viewport: innerWidth, scroll: document.documentElement.scrollWidth }',
  )
  assert.ok(
    dimensions.scroll <= dimensions.viewport + 1,
    `${path} overflows at ${width}px: ${JSON.stringify(dimensions)}`,
  )
}

try {
  for (const width of [320, 390, 768, 1440]) {
    await noOverflow(width, '/')
    await browser.wait(
      until.elementLocated(By.css('article.community-post')),
      10000,
    )
    await noOverflow(width, '/community/spaces')
    await browser.wait(
      until.elementsLocated(By.css('.community-space-card')),
      10000,
    )
  }
  assert.equal(
    (await browser.findElements(By.css('.community-space-card'))).length,
    4,
  )
  await browser.get(base + '/community/spaces')
  const firstSpace = await browser.wait(
    until.elementLocated(By.css('.community-space-card')),
    10000,
  )
  await browser.get(await firstSpace.getAttribute('href'))
  await browser.wait(
    until.elementLocated(By.css('.community-space-cover')),
    10000,
  )
  await browser.get(base + '/login')
  await browser.wait(until.elementLocated(By.css('input[name="email"]')), 10000)
  await browser
    .findElement(By.css('input[name="email"]'))
    .sendKeys('guest@demo.local')
  await browser.findElement(By.css('input[name="password"]')).sendKeys('123456')
  await browser.findElement(By.css('form button[type="submit"]')).click()
  await browser.wait(until.urlIs(base + '/'), 10000)
  await browser.wait(
    until.elementLocated(By.css('form.community-composer')),
    10000,
  )
  process.stdout.write(
    'Community public feed, spaces, guest login and responsive layouts passed.\n',
  )
} finally {
  await browser.quit()
}
