import { delay } from './delay'
import { type BrowserContext } from 'playwright'
import { Mutex } from 'async-mutex'

const mutex = new Mutex()

export async function fill (context: BrowserContext, website: string, id: string, name: string, content: string): Promise<void> {
  const release = await mutex.acquire()
  try {
    const pages = context.pages()
    const page = pages[pages.length - 1]
    try {
      if (id !== '') {
        await page.fill(`#${id}`, content)
      } else {
        await page.fill(`name=${name}`, content)
      }
    } catch (e) {
      try {
        await page.getByRole('textbox').fill(content)
      } catch (e) {
        await page.getByRole('combobox').fill(content)
      }
    }

    await delay(1000)
  } finally {
    release()
  }
}
