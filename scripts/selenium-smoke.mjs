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
    const dimensions = await driver.executeScript(`return {
      scroll: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
      client: document.documentElement.clientWidth
    }`)
    assert.ok(dimensions.scroll <= dimensions.client + 1,
      `Horizontal overflow at ${viewport.width}px: ${dimensions.scroll}px > ${dimensions.client}px`)
  }

  await driver.findElement(By.linkText('Xem khóa học')).click()
  await driver.wait(until.urlContains('/courses'), 5000)
  assert.equal((await driver.getCurrentUrl()).endsWith('/courses'), true)
} finally {
  if (driver) await driver.quit()
  preview.kill()
}
