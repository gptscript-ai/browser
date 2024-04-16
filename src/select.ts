import { type BrowserContext } from 'playwright'
import { inspect } from './browse'

export async function select (context: BrowserContext, userInput: string, option: string): Promise<void> {
  const pages = context.pages()
  const page = pages[pages.length - 1]
  const locators = await inspect(context, 'select', userInput)
  for (const locator of locators) {
    try {
      await page.selectOption(`${locator}`, option, { timeout: 5000 })
      break
    } catch (e) {
    }
  }
}
