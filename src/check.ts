import { type BrowserContext } from 'playwright'
import { inspect } from './browse'
import { Mutex } from 'async-mutex'
import { delay } from './delay'

const mutex = new Mutex()

export async function check (context: BrowserContext, userInput: string, keywords: string[]): Promise<void> {
  const release = await mutex.acquire()
  try {
    const pages = context.pages()
    const page = pages[pages.length - 1]
    const locators = await inspect(context, userInput, 'check', keywords)
    console.log(locators)
    for (const locator of locators) {
      try {
        await page.check(`${locator}`, { timeout: 5000 })
        await delay(3000)
        break
      } catch (e) {
        try {
          await page.check(`[for=${locator}]`, { timeout: 5000 })
          break
        } catch (e) {
        }
      }
    }
  } finally {
    release()
  }
}
