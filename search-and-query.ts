import { chromium } from 'playwright'

async function main (): Promise<void> {
  const args = process.argv.slice(2)

  const website = args[0]
  const searchInputID = args[1]
  const queryInput = args.slice(2).join(' ')
  console.log(website, searchInputID, queryInput)

  await delay(5000)
  const context = await chromium.launchPersistentContext(
    '',
    {
      headless: false,
      channel: 'chrome'
    })
  const page = await context.newPage()
  await page.goto(website)

  await page.locator(`#${searchInputID}`).fill(queryInput)
  await delay(2000)
  await page.keyboard.press('Enter')
  await delay(5000)
  process.exit(0)
}

async function delay (ms: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, ms))
}

main()
