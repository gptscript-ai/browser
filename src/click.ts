import { type Page } from 'playwright'
import { delay } from './delay'
import { inspect } from './browse'

// click navigates a link or clicks on an element matching the given keywords.
export async function click (page: Page, userInput: string, keywords: string[], allElements: boolean, matchTextOnly: boolean): Promise<void> {
  const locators = await inspect(page, userInput, 'click', matchTextOnly, keywords)
  console.log(locators)
  let done = false
  for (const locator of locators) {
    try {
      const elements = await page.locator(`css=${locator}`).all()

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
          // First, if the element is not visible, see if it is an anchor with an href.
          if (!await element.isVisible()) {
            const tagName = await element.evaluate((el) => el.tagName)
            if (tagName.toLowerCase() === 'a') {
              const href = await element.evaluate((el) => el.getAttribute('href'))
              if (href !== null && href !== undefined && href !== '' && !href.startsWith('#')) {
                console.log('click link bypass: ', new URL(href, page.url()).href)
                await page.goto(new URL(href, page.url()).href)
                done = true
                break
              }
            }
          }

          await element.scrollIntoViewIfNeeded({ timeout: 5000 })
          const boundingBox = await element.boundingBox()
          if (boundingBox != null) {
            await element.click()
            await delay(5000)
            done = true
          } else {
            let parent = element.locator('..')
            while (true) {
              const boundingBox = await parent.boundingBox()
              if (boundingBox != null) {
                await parent.click()
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
