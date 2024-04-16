import { delay } from './delay'
import { type BrowserContext } from 'playwright'
import { Mutex } from 'async-mutex'
import { inspect, getText } from './browse'

const mutex = new Mutex()

export async function fill (context: BrowserContext, userInput: string, content: string, keywords: string[]): Promise<void> {
  const release = await mutex.acquire()
  try {
    const locators = await inspect(context, userInput, 'fill', keywords)
    let done = false
    for (const locator of locators) {
      console.log(locator)
      try {
        const pages = context.pages()
        const page = pages[pages.length - 1]
        const elements = await page.locator(`${locator}`).all()
        for (const element of elements) {
          const innerText = await getText(element)
          for (const keyword of keywords) {
            if (innerText.toLowerCase().includes(keyword.toLowerCase())) {
              await element.fill(content)
              await delay(5000)
              done = true
              break
            }
          }
          if (done) {
            break
          }
        }
        if (done) {
          break
        }
      } catch (e) {
      }
    }
  } finally {
    release()
  }
}
