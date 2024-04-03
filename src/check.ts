import { type BrowserContext } from 'playwright'
import { type Response } from 'express'

export async function check (context: BrowserContext, resp: Response, id: string): Promise<void> {
  const pages = context.pages()
  const page = pages[pages.length - 1]
  await page.click(`[for=${id}]`)
  resp.end()
}
