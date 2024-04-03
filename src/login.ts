import { delay } from './delay'
import { type BrowserContext } from 'playwright'

export async function login (context: BrowserContext, website: string, sessionID: string): Promise<void> {
  const page = await context.newPage()
  await page.goto(website)
  await delay(50000)
}
