import { type BrowserContext } from 'playwright'
import { delay } from './delay'
import { inspect } from './browse'

// click navigates a link or clicks on an element matching the given keywords.
export async function click (context: BrowserContext, userInput: string, keywords: string[], allElements: boolean): Promise<void> {
  const locators = await inspect(context, userInput, 'click', keywords)
  console.log(locators)
  let done = false
  for (const locator of locators) {
    try {
      const pages = context.pages()
      const page = pages[pages.length - 1]
      const elements = await page.locator(`${locator}`).all()

      // Look in the iframes
      const frames = page.frames()
      for (const f of frames) {
        if (f.url() !== '' && f.url() !== 'about:blank') {
          elements.push(...await f.locator(`${locator}`).all())
        }
      }

      if (elements.length === 0) {
        console.log(`No elements found for locator: ${locator}`)
        continue
      }
      for (const element of elements) {
        try {
          await element.scrollIntoViewIfNeeded({ timeout: 5000 })
          const boundingBox = await element.boundingBox()
          if (boundingBox != null) {
            await page.mouse.click(boundingBox.x + boundingBox.width / 2, boundingBox.y + boundingBox.height / 2)
            await delay(5000)
            done = true
          } else {
            let parent = element.locator('..')
            while (true) {
              const boundingBox = await parent.boundingBox()
              if (boundingBox != null) {
                await page.mouse.click(boundingBox.x + boundingBox.width / 2, boundingBox.y + boundingBox.height / 2)
                await delay(5000)
                done = true
                break
              }
              parent = parent.locator('..')
            }
          }
        } catch (e) {
          console.error('failed to click element: ', e)
        }

        if (done && !allElements) {
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
