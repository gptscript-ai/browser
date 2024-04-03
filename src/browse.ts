import { type BrowserContext, type Page } from 'playwright'
import * as cheerio from 'cheerio'
import { delay } from './delay'

export async function search (context: BrowserContext, website: string, sessionID: string, keywords: string[]): Promise<string> {
  let page: Page
  const pages = context.pages()
  if (pages.length > 1) {
    page = pages[pages.length - 1]
  } else {
    page = await context.newPage()
    await page.goto(website)
  }
  await delay(1000)
  const html = await page.content()
  let resp = summarize(html, keywords)
  resp += `sessionID: ${sessionID}\n`
  return resp
}

export async function browse (context: BrowserContext, website: string, sessionID: string, print: boolean): Promise<string> {
  let page: Page
  const pages = context.pages()
  if (pages.length > 1) {
    page = pages[pages.length - 1]
  } else {
    page = await context.newPage()
  }
  if (website !== '') {
    await page.goto(website)
  }

  await delay(1000)
  let resp: string = ''
  if (print) {
    const html = await page.content()
    const $ = cheerio.load(html)
    $('body').each(function () {
      resp += $(this).text()
    })
  }
  const html = await page.content()
  resp += summarize(html, [])
  resp += `sessionID: ${sessionID}\n`
  return resp
}

export function summarize (html: string, keywords: string[]): string {
  const $ = cheerio.load(html)
  let resp: string = ''
  // For search, we need to find all the input and textarea elements and figure that out
  $('textarea').each(function () {
    resp += $.html(this)
  })
  $('input[id]').each(function () {
    resp += $.html(this)
  })
  $('img').each(function () {
    resp += $.html(this)
  })
  $('label').each(function () {
    resp += $.html(this)
  })
  $('select').each(function () {
    resp += $.html(this)
  })
  $('a').each(function () {
    for (const keyword of keywords) {
      if ($(this).text().toLowerCase().includes(keyword.toLowerCase())) {
        resp += `description: ${$(this).text().trim()}\n href: ${$(this).attr('href')}\n\n`
      }
    }
  })
  $('button').each(function () {
    for (const keyword of keywords) {
      if ($(this).text().toLowerCase().includes(keyword.toLowerCase())) {
        resp += `description: ${$(this).text().trim()}\n`
      }
    }
  })
  return resp
}
