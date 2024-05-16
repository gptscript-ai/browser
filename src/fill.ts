import { delay } from './delay'
import { type Page } from 'playwright'
import { inspect } from './browse'

export async function fill (page: Page, userInput: string, content: string, keywords: string[]): Promise<void> {
  const locators = await inspect(page, userInput, 'fill', keywords)
  for (const locator of locators) {
    console.log(locator)
    try {
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
}
