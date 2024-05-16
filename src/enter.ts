import { type Page } from 'playwright'
import { delay } from './delay'

// enter presses the enter key.
export async function enter (page: Page): Promise<void> {
  await page.keyboard.press('Enter')
  await delay(2000)
}
