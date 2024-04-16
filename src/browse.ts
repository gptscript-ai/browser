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
  resp += `sessionID: ${sessionID}\n`
  return resp
}

export async function inspect (context: BrowserContext, userInput: string, action: string, keywords?: string[]): Promise<string[]> {
  const pages = context.pages()
  const page = pages[pages.length - 1]

  const elementData = await summarize(page, keywords ?? [], action)
  const tool = new Tool({
    instructions: `you are an expert in understanding web pages, playwright library and HTML elements and can help me find the information I need.
     You will be given html content and asked to find specific elements or information. 
     Based html data provided below, return the locator that can be used to locate the element using playwright library page.locator(). 
     When asked about filling data, find all the element like input, form, textarea. return a list of possible locators you can find and concatnate by #.
     When asked about clicking button, find all the button elements. If you can't find button, find div instead. return a list of possible locators you can find and concatnate by #.
     When asked about clicking links, Only find link that are relevant to what user is looking for. Return exact one link that is the best match. 
     Use id or text based locator first. Validate the locator before returning.
     Provided data: '${elementData}'. 
     UserInput: ${userInput}
     
     Return the list of locators separated by #. Don't quote the output. De-duplicate the output.`
  })

  const output = (await exec(tool, {})).replace('\n', '').trim()

  if (output === 'NONE') {
    // If the user can't find any locator, try to find a scrollable element and scroll to it until we can find the element
    console.log('Scrolling to the bottom of the page')
    await page.evaluate(() => {
      window.scrollBy(0, window.innerHeight) // Horizontal scroll by one full screen width
    })
    return await inspect(context, userInput, action, keywords)
  }
  return output.split('#')
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

  if (action === 'select') {
    $('select').each(function () {
      resp += $.html(this)
    })
  }

  if (action === 'click') {
    $('a').each(function () {
      for (const keyword of keywords) {
        if ($(this).text().toLowerCase().includes(keyword.toLowerCase())) {
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
