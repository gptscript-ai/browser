import { type BrowserContext } from 'playwright'
import { inspectForSelect } from './browse'

export async function select (context: BrowserContext, userInput: string, option: string): Promise<void> {
  const pages = context.pages()
  const page = pages[pages.length - 1]
  const selection = await inspectForSelect(context, option, userInput)

  try {
    await page.selectOption(`${selection.locator}`, selection.option, { timeout: 5000 })
  } catch (e) {}
}
