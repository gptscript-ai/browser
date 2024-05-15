import { type Page } from 'playwright'
import { inspectForSelect } from './browse'

export async function select (page: Page, userInput: string, option: string): Promise<void> {
  const selection = await inspectForSelect(page, option, userInput)

  try {
    await page.selectOption(`${selection.selector}`, selection.option, { timeout: 5000 })
  } catch (e) {
    console.error('failed to select option: ', e)
  }
}
