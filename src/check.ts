import { type BrowserContext } from 'playwright'
import { inspect } from './browse'

export async function check (context: BrowserContext, userInput: string): Promise<void> {
  const pages = context.pages()
  const page = pages[pages.length - 1]
  const locators = await inspect(context, userInput, 'check', [])
  for (const locator of locators) {
    try {
      await page.check(`${locator}`, { timeout: 5000 })
      break
    } catch (e) {
      try {
        await page.check(`[for=${locator}]`, { timeout: 5000 })
        break
      } catch (e) {
      }
    }
  }
}
