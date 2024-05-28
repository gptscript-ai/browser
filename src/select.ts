import { type Page } from 'playwright'
import { inspectForSelect } from './browse'
import { type BrowserSettings } from './settings'

export async function select (page: Page, userInput: string, option: string, settings: BrowserSettings): Promise<void> {
  const selection = await inspectForSelect(page, option, userInput, settings)

  try {
    await page.selectOption(`${selection.selector}`, selection.option, { timeout: 5000 })
  } catch (e) {
    console.error('failed to select option: ', e)
  }
}
