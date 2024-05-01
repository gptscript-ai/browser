import { type BrowserContext } from 'playwright'
import { delay } from './delay'

export async function scrollToBottom (context: BrowserContext): Promise<void> {
  const pages = context.pages()
  const page = pages[pages.length - 1]
  await page.keyboard.press('End')
  await delay(2000)
}
