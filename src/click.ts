import { type BrowserContext } from 'playwright'
import { delay } from './delay'
import { getText, inspect } from './browse'
import path from 'path'

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
            // first, try to see if it is a link. If so, just go to the link
            const href = await element.getAttribute('href')
            if (href !== null) {
              if (href.toString().startsWith('/')) {
                await page.goto(path.join(page.url(), href.toString()))
                await delay(3000)
              } else {
                await page.goto(href.toString())
                await delay(3000)
              }
              done = true
              break
            } else {
              // if it is not a link, then try to click on the element on the bounding box
              const boundingBox = await element.boundingBox()
              if (boundingBox != null) {
                await page.mouse.click(boundingBox.x + boundingBox.width / 2, boundingBox.y + boundingBox.height / 2)
                await delay(5000)
                done = true
                break
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
