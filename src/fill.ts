import { delay } from './delay'
import { type BrowserContext } from 'playwright'

export async function fill (context: BrowserContext, website: string, id: string, content: string): Promise<void> {
  const pages = context.pages()
  const page = pages[pages.length - 1]
  const locator = page.locator(`#${id}`)
  await locator.fill(content)
  await delay(1000)
}
