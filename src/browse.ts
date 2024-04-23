import { type BrowserContext, type Page } from 'playwright'
import * as cheerio from 'cheerio'
import { delay } from './delay'
import { exec } from '@gptscript-ai/gptscript'
import { Tool } from '@gptscript-ai/gptscript/lib/tool'
import { type Locator } from '@playwright/test'

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
    await delay(5000)
  }

  let resp: string = ''
  if (print) {
    const html = await page.content()
    const $ = cheerio.load(html)
    $('body').each(function () {
      resp += $(this).text()
    })
  }
  resp += `sessionID: ${sessionID}\n`
  return resp
}

export async function inspect (context: BrowserContext, userInput: string, action: string, keywords?: string[]): Promise<string[]> {
  const pages = context.pages()
  const page = pages[pages.length - 1]

  let elementData = await summarize(page, keywords ?? [], action)
  while (elementData === '') {
    console.log('Scrolling to the bottom of the page')
    await page.evaluate(() => {
      const allElements = Array.from(document.querySelectorAll('div'))
      const scrollables = allElements.filter(e => ((e.getAttribute('style')?.includes('overflow: auto') ?? false) || (e.getAttribute('style')?.includes('overflow: scroll') ?? false)))
      console.log(scrollables.length)
      if (scrollables.length > 0) {
        scrollables[0].scrollBy(0, window.innerHeight)
      }
    })
    await delay(2000)
    elementData = await summarize(page, keywords ?? [], action)
  }
  const tool = new Tool({
    instructions: `you are an expert in understanding web pages, playwright library and HTML elements and can help me find the information I need.
     You will be given html content and asked to find specific elements or information. 
     Based html data provided below, return the locator that can be used to locate the element using playwright library page.locator(). 
     When asked about filling data, find all the element like input, form, textarea. return the most accurate locator you can find.
     When asked about clicking button, only find all the button elements. If you can't find button, find div instead. return the most accurate locator you can find.
     When asked about clicking links, Only find link that are relevant to what user is looking for. Return exact one link that is the best match. 
     Use id or text based locator first. Validate the locator before returning. Don't escape the locator with \\ unless it is necessary. Return exact one locator that is the best match
     Provided data: '${elementData}'. 
     UserInput: ${userInput}
     
     Don't quote the output.`
  })

  const output = (await exec(tool, {})).replace('\n', '').trim()

  return [output]
}

export async function summarize (page: Page, keywords: string[], action: string): Promise<string> {
  const htmlContent = await page.content()
  const $ = cheerio.load(htmlContent)

  let resp = ''
  // For search, we need to find all the input and textarea elements and figure that out
  if (action === 'fill') {
    $('textarea').each(function () {
      for (const keyword of keywords) {
        if ($.html(this).toLowerCase().includes(keyword.toLowerCase())) {
          resp += $.html(this)
        }
      }
    })
    $('input[id]').each(function () {
      for (const keyword of keywords) {
        if ($.html(this).toLowerCase().includes(keyword.toLowerCase())) {
          resp += $.html(this)
        }
      }
    })
    $('form').each(function () {
      for (const keyword of keywords) {
        if ($.html(this).toLowerCase().includes(keyword.toLowerCase())) {
          resp += $.html(this)
        }
      }
    })
    $('div').each(function () {
      if (keywords.length !== 0) {
        for (const keyword of keywords) {
          if ($(this).attr('contenteditable') === 'true' && $.html(this).toLowerCase().includes(keyword.toLowerCase())) {
            resp += $.html(this)
          }
        }
      }
    })
  }

  if (action === 'check') {
    $('input[type="checkbox"]').each(function () {
      // return parent element for more context
      const html = $(this).parent().html()?.toString() ?? ''
      for (const keyword of keywords) {
        if (html.toLowerCase().includes(keyword.toLowerCase())) {
          resp += html
        }
      }
    })
  }

  if (action === 'select') {
    $('select').each(function () {
      resp += $.html(this)
    })
  }

  if (action === 'click') {
    $('a').each(function () {
      for (const keyword of keywords) {
        if ($.html(this).toLowerCase().includes(keyword.toLowerCase())) {
          resp += $.html(this)
        }
      }
    })
    $('button').each(function () {
      for (const keyword of keywords) {
        if ($(this).text().toLowerCase().includes(keyword.toLowerCase())) {
          resp += $.html(this)
        }
      }
    })

    $('div').each(function () {
      for (const keyword of keywords) {
        if ($(this).children('div').length === 0 && $.html(this).toLowerCase().includes(keyword.toLowerCase())) {
          resp += $.html(this)
        }
      }
    })

    $('span').each(function () {
      for (const keyword of keywords) {
        if ($(this).children.length === 0 && $.html(this).toLowerCase().includes(keyword.toLowerCase())) {
          resp += $.html(this)
        }
      }
    })
  }

  if (action === 'scroll') {
    $('div').each(function () {
      for (const keyword of keywords) {
        if ($.html(this).toLowerCase().includes(keyword.toLowerCase())) {
          resp += $.html(this)
        }
      }
    })
  }
  return resp
}

export async function getText (locator: Locator): Promise<string> {
  let result = ''
  result += await locator.getAttribute('aria-label') ?? '' + ' '
  result += await locator.getAttribute('label') ?? '' + ' '

  result += await locator.innerText()

  return result
}
