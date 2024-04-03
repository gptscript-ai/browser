import { type BrowserContext } from 'playwright'
import { type Response } from 'express'

export async function select (context: BrowserContext, resp: Response, id: string, option: string): Promise<void> {
  const pages = context.pages()
  const page = pages[pages.length - 1]
  await page.locator(`#${id}`).selectOption(`${option}`)
  resp.end()
}
