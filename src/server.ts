import express, { type Request, type Response } from 'express'
import bodyParser from 'body-parser'
import { type BrowserContext } from 'playwright'
import { chromium } from 'playwright'
import { search, browse } from './browse'
import { clickButton, clickLink } from './click'
import { fill } from './fill'

async function main (): Promise<void> {
  const app = express()
  const port = 9080
  app.use(bodyParser.json())

  const contextMap: Record<string, BrowserContext> = {}

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  app.post('/', async (req: Request, res: Response) => {
    const data = req.body
    const action = data.action
    const website: string = data.website ?? ''
    const keyword: string = data.keyword ?? ''
    const id: string = data.id ?? ''
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    const sessionID: string = data.sessionID || new Date().getTime().toString()
    const storagePath: string = data.storagePath ?? ''

    let context: BrowserContext
    if (contextMap[sessionID] !== undefined) {
      context = contextMap[sessionID]
    } else {
      context = await chromium.launchPersistentContext(
        storagePath,
        {
          headless: false,
          viewport: null,
          channel: 'chrome',
          args: ['--start-maximized'],
          ignoreDefaultArgs: ['--enable-automation', '--use-mock-keychain']
        })
      contextMap[sessionID] = context
    }
    if (action === 'browse') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      res.send(await browse(context, website, sessionID, data.print ?? false))
    } else if (action === 'search') {
      res.send(await search(context, website, keyword))
    } else if (action === 'click-link') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await clickLink(context, res, data.link ?? '')
      res.end()
    } else if (action === 'click-button') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await clickButton(context, res, data.name ?? '', data.exact as boolean)
      res.end()
    } else if (action === 'fill') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await fill(context, website, id, data.content ?? '')
      res.end()
    } else {
      res.send('Invalid action')
    }
  })

  // Start the server
  app.listen(port, () => {
    console.log(`Server is listening on port ${port}`)
  })
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main()
