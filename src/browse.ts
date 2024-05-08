import { type BrowserContext, type Page } from 'playwright'
import * as cheerio from 'cheerio'
import { delay } from './delay'
import { exec } from '@gptscript-ai/gptscript'
import { Tool } from '@gptscript-ai/gptscript/lib/tool'
import { type Locator } from '@playwright/test'
import { URL } from 'url'
import TurndownService from 'turndown'

// browse navigates to the website and returns the text content of the page (if print is true)
export async function browse (context: BrowserContext, website: string, sessionID: string, mode: string): Promise<string> {
  let page: Page
  const pages = context.pages()
  if (pages.length > 1) {
    page = pages[pages.length - 1]
  } else {
    page = await context.newPage()
  }

  if (website !== '' && page.url() !== website) {
    try {
      await page.goto(website)
    } catch (e) {} // choke the exception because we don't care
    await delay(5000)
  } else {
    await delay(5000)
  }

  let resp: string = ''
  if (mode === 'getPageContents') {
    const html = await page.content()
    const $ = cheerio.load(html)

    $('script').remove()
    $('style').remove()
    $('[style]').removeAttr('style')
    $('[onclick]').removeAttr('onclick')
    $('[onload]').removeAttr('onload')
    $('[onerror]').removeAttr('onerror')

    // Remove empty divs and spans
    $('div').each(function () {
      if ($(this).text() === '' && $(this).children().length === 0) {
        $(this).remove()
      }
    })
    $('span').each(function () {
      if ($(this).text() === '' && $(this).children().length === 0) {
        $(this).remove()
      }
    })

    const turndownService = new TurndownService()
    $('body').each(function () {
      resp += turndownService.turndown($.html(this))
    })
  } else if (mode === 'getPageLinks') {
    const html = await page.content()
    const $ = cheerio.load(html)
    $('a').each(function () {
      const link = new URL($(this).attr('href') ?? '', page.url()).toString()
      resp += `[${$(this).text().trim()}](${link.trim()})\n`
    })
  } else if (mode === 'getPageImages') {
    const html = await page.content()
    const $ = cheerio.load(html)
    $('img').each(function () {
      resp += `${Object.entries($(this).attr() ?? '').toString()}\n`
    })
  }
  resp += `sessionID: ${sessionID}\n`
  return resp.split('\n').filter(line => line.trim() !== '').join('\n')
}

// inspect inspects a webpage and returns a locator for a specific element based on the user's input and action.
export async function inspect (context: BrowserContext, userInput: string, action: string, keywords?: string[]): Promise<string[]> {
  const pages = context.pages()
  const page = pages[pages.length - 1]

  let elementData = await summarize(page, keywords ?? [], action)
  // If no data found, try to find the element without keywords first
  if (elementData === '' && keywords == null) {
    elementData = await summarize(page, [], action)
  }
  // Scroll the page to get more data and try to find the element
  // Retry 60 times also to give user time to sign in if the landing page requires sign in
  let retry = 0
  while (elementData === '' && retry < 60) {
    await page.evaluate(() => {
      const allElements = Array.from(document.querySelectorAll('div'))
      const scrollables = allElements.filter(e => ((e.getAttribute('style')?.includes('overflow: auto') ?? false) || (e.getAttribute('style')?.includes('overflow: scroll') ?? false)))
      if (scrollables.length > 0) {
        scrollables[0].scrollBy(0, window.innerHeight)
      }
    })
    await delay(2000)
    elementData = await summarize(page, keywords ?? [], action)
    retry++
  }

  const instructions: string = `You are an expert with deep knowledge of web pages, the Playwright library, and HTML elements.
    Based on the provided HTML below, return the locator that can be used to locate the element described by the user input.
    Use an ID or text-based locator if possible. Do not use ARIA-related things.
    Validate the locator before you return it. Do not escape the locator unless necessary.
    Return exactly one locator that is the best match, and don't quote the output.

    User Input: ${userInput}

    HTML:
    ${elementData}`

  const tool = new Tool({ instructions })

  const output = (await exec(tool, {})).replace('\n', '').trim()

  return [output]
}

export async function inspectForSelect (context: BrowserContext, userInput: string, userSelection: string, keywords?: string[]): Promise<{ locator: string, option: string }> {
  const pages = context.pages()
  const page = pages[pages.length - 1]

  let elementData = await summarize(page, keywords ?? [], 'select')
  if (elementData === '' && keywords == null) {
    elementData = await summarize(page, [], 'select')
  }

  let retry = 0
  while (elementData === '' && retry < 15) {
    await page.evaluate(() => {
      const allElements = Array.from(document.querySelectorAll('div'))
      const scrollables = allElements.filter(e => ((e.getAttribute('style')?.includes('overflow: auto') ?? false) || (e.getAttribute('style')?.includes('overflow: scroll') ?? false)))
      if (scrollables.length > 0) {
        scrollables[0].scrollBy(0, window.innerHeight)
      }
    })
    await delay(2000)
    elementData = await summarize(page, keywords ?? [], 'select')
    retry++
  }

  const instructions: string = `You are an expert with deep knowledge of web pages, the Playwright library, and HTML elements.
    Based on the provided HTML below, return the locator that can be used to locate the select element described by the user input.
    Use an ID or text-based locator if possible. Validate the locator before you return it. Do not escape the locator unless necessary.
    Also determine which of the options in the select element should be selected based on the user selection.
    Return a JSON object with the keys 'locator' and 'option'.
    
    User Input: ${userInput}
    User Selection: ${userSelection}
    
    HTML:
    ${elementData}
    
    
    Example output: {"locator":"[data-testid='SearchForm-sortBy']","option":"newest"}`

  const tool = new Tool({ instructions })

  const output = (await exec(tool, {})).replace('\n', '').trim()
  console.log(output)

  return JSON.parse(output)
}

// summarize returns relevant HTML elements for the given keywords and action
export async function summarize (page: Page, keywords: string[], action: string): Promise<string> {
  const htmlContent = await page.content()
  const $ = cheerio.load(htmlContent)

  let resp = ''
  // For search, we need to find all the input and textarea elements and figure that out
  if (action === 'fill') {
    $('textarea').each(function () {
      if (keywords.length !== 0) {
        for (const keyword of keywords) {
          if ($.html(this).toLowerCase().includes(keyword.toLowerCase())) {
            resp += $.html(this)
            break
          }
        }
      } else {
        resp += $.html(this)
      }
    })
    $('input[id]').each(function () {
      if (keywords.length !== 0) {
        for (const keyword of keywords) {
          if ($.html(this).toLowerCase().includes(keyword.toLowerCase())) {
            resp += $.html(this)
            break
          }
        }
      } else {
        resp += $.html(this)
      }
    })
    $('input').each(function () {
      if (keywords.length !== 0) {
        for (const keyword of keywords) {
          if ($.html(this).toLowerCase().includes(keyword.toLowerCase())) {
            resp += $.html(this)
            break
          }
        }
      } else {
        resp += $.html(this)
      }
    })
    $('form').each(function () {
      if (keywords.length !== 0) {
        for (const keyword of keywords) {
          if ($.html(this).toLowerCase().includes(keyword.toLowerCase())) {
            resp += $.html(this)
            break
          }
        }
      } else {
        resp += $.html(this)
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
      if (keywords.length !== 0) {
        for (const keyword of keywords) {
          if ($.html(this).toLowerCase().includes(keyword.toLowerCase())) {
            resp += '<a '
            for (const attr of this.attributes) {
              resp += ` ${attr.name}="${attr.value}"`
            }
            resp += ' />'
            break
          }
        }
      } else {
        resp += '<a '
        for (const attr of this.attributes) {
          resp += ` ${attr.name}="${attr.value}"`
        }
        resp += ' />'
      }
    })
    $('button').each(function () {
      if (keywords.length !== 0) {
        for (const keyword of keywords) {
          if ($.html(this).toLowerCase().includes(keyword.toLowerCase())) {
            resp += '<button '
            for (const attr of this.attributes) {
              resp += ` ${attr.name}="${attr.value}"`
            }
            resp += ' />'
            break
          }
        }
      } else {
        resp += '<button '
        for (const attr of this.attributes) {
          resp += ` ${attr.name}="${attr.value}"`
        }
        resp += ' />'
      }
    })

    $('div').each(function () {
      if (keywords.length !== 0) {
        for (const keyword of keywords) {
          if ($(this).children('div').length === 0 && $.html(this).toLowerCase().includes(keyword.toLowerCase())) {
            resp += '<div '
            for (const attr of this.attributes) {
              resp += ` ${attr.name}="${attr.value}"`
            }
            resp += ' />'
            break
          }
        }
      } else {
        resp += '<div '
        for (const attr of this.attributes) {
          resp += ` ${attr.name}="${attr.value}"`
        }
        resp += ' />'
      }
    })

    $('span').each(function () {
      if (keywords.length !== 0) {
        for (const keyword of keywords) {
          if ($(this).children.length === 0 && $.html(this).toLowerCase().includes(keyword.toLowerCase())) {
            resp += '<span '
            for (const attr of this.attributes) {
              resp += ` ${attr.name}="${attr.value}"`
            }
            resp += ' />'
            break
          }
        }
      } else {
        resp += '<span '
        for (const attr of this.attributes) {
          resp += ` ${attr.name}="${attr.value}"`
        }
        resp += ' />'
      }
    })
  }

  // Remove duplicate newlines and return
  return resp.replace(/\n+/g, '\n')
}

export async function getText (locator: Locator): Promise<string> {
  let result = ''
  result += await locator.getAttribute('aria-label') ?? '' + ' '
  result += await locator.getAttribute('label') ?? '' + ' '
  result += await locator.getAttribute('href') ?? '' + ' '
  result += await locator.getAttribute('placeholder') ?? '' + ' '

  result += await locator.innerText()

  return result
}
