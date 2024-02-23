import { type BrowserContext } from 'playwright'
import { type Response } from 'express'
import { delay } from './delay'

export async function clickLink (context: BrowserContext, resp: Response, link: string): Promise<void> {
  const pages = context.pages()
  const page = pages[pages.length - 1]
  const url = new URL(link, page.url())
  await page.goto(url.href)
  await delay(1000)
  resp.end()
}

export async function clickButton (context: BrowserContext, resp: Response, name: string, exact: boolean): Promise<void> {
  const pages = context.pages()
  const page = pages[pages.length - 1]
  await page.getByRole('button', { name, exact }).click()
  resp.end()
}
