import { chromium } from 'playwright'
import * as cheerio from 'cheerio'

async function main (): Promise<void> {
  const args = process.argv.slice(2)

  const website = args[0]

  const context = await chromium.launchPersistentContext(
    '',
    {
      headless: true,
      channel: 'chrome'
    })
  const page = await context.newPage()
  await page.goto(website)
  const html = await page.content()
  const $ = cheerio.load(html)

  // Keep only basic elements (body, head, title, meta, link, script)
  $('script').each((index, element) => {
    // You can replace the script tag with whatever you want here.
    // For example, you can remove it or replace it with some other content.
    $(element).remove() // This removes the script tag
  })

  $('meta').each((index, element) => {
    // You can replace the script tag with whatever you want here.
    // For example, you can remove it or replace it with some other content.
    $(element).remove() // This removes the script tag
  })

  $('link').each((index, element) => {
  // You can replace the script tag with whatever you want here.
  // For example, you can remove it or replace it with some other content.
    $(element).remove() // This removes the script tag
  })

  $('style').each((index, element) => {
    // You can replace the script tag with whatever you want here.
    // For example, you can remove it or replace it with some other content.
    $(element).remove() // This removes the script tag
  })

  $('link[rel="stylesheet"]').each((index, element) => {
    // You can replace the link tag with whatever you want here.
    // For example, you can remove it or replace it with some other content.
    $(element).remove() // This removes the link tag
  })

  $('noscript').each((index, element) => {
    // You can replace the link tag with whatever you want here.
    // For example, you can remove it or replace it with some other content.
    $(element).remove() // This removes the link tag
  })

  $('td').each((index, element) => {
    // You can replace the link tag with whatever you want here.
    // For example, you can remove it or replace it with some other content.
    $(element).remove() // This removes the link tag
  })

  $('a').each((index, element) => {
    // You can replace the link tag with whatever you want here.
    // For example, you can remove it or replace it with some other content.
    $(element).remove() // This removes the link tag
  })

  // Get the modified HTML
  const modifiedHTML = $.html()
  process.stdout.write(modifiedHTML)

  process.exit(0)
}

main()
