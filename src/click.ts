import { type BrowserContext } from 'playwright'
import { delay } from './delay'
import { getText, inspect } from './browse'

export async function click (context: BrowserContext, userInput: string, keywords: string[]): Promise<void> {
  const locators = await inspect(context, userInput, 'click', keywords)
  console.log(locators)
  let done = false
  for (const locator of locators) {
    try {
      const pages = context.pages()
      const page = pages[pages.length - 1]
      const elements = await page.locator(`${locator}`).all()
      if (elements.length === 0) {
        console.log(`No elements found for locator: ${locator}`)
        continue
      }
      for (const element of elements) {
        const innerText = await getText(element)

        for (const keyword of keywords) {
          if (innerText.toLowerCase().includes(keyword.toLowerCase())) {
            await element.scrollIntoViewIfNeeded()
            const boundingBox = await element.boundingBox()

            if (boundingBox != null) {
              await page.mouse.click(boundingBox.x, boundingBox.y)
              await delay(5000)
              done = true
              break
            }
          }
        }

        if (done) {
          break
        }
      }
    } catch (e) {
      console.log(e)
    }

    if (done) {
      break
    }
  }
}
