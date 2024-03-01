import { type BrowserContext } from 'playwright'
import { type Response } from 'express'

export async function enter (context: BrowserContext, resp: Response, input: string): Promise<void> {
  const pages = context.pages()
  const page = pages[pages.length - 1]
  await page.keyboard.press(input)
  resp.end()
}
