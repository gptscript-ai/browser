import { delay } from './delay'
import { type BrowserContext } from 'playwright'
import { Mutex } from 'async-mutex'
import { inspect } from './browse'

const mutex = new Mutex()

export async function fill (context: BrowserContext, userInput: string, content: string, keywords: string[]): Promise<void> {
  const release = await mutex.acquire()
  try {
    const locators = await inspect(context, userInput, 'fill', keywords)
    for (const locator of locators) {
      console.log(locator)
      try {
        const pages = context.pages()
        const page = pages[pages.length - 1]
        const elements = await page.locator(locator).all()
        if (elements.length === 0) {
          continue
        }

        await elements[0].fill(content)
        await delay(5000)
        break
      } catch (e) {
        console.error(e)
      }
    }
  } finally {
    release()
  }
}
