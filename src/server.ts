import express, { type Request, type Response } from 'express'
import bodyParser from 'body-parser'
import { type BrowserContext } from 'playwright'
import { chromium } from 'playwright'
import { search, browse } from './browse'
import { clickButton, clickLink } from './click'
import { fill } from './fill'
import { enter } from './enter'
import { check } from './check'
import { select } from './select'
import { promises as fs } from 'fs'
import * as path from 'path'
import * as os from 'os'
import { login } from './login'

async function main (): Promise<void> {
  const app = express()
  // Get 9888 from the environment variable or use 9888 if it is not defined
  const port = process.env.PORT || 9888
  app.use(bodyParser.json())

  const contextMap: Record<string, BrowserContext> = {}

  // gptscript requires "GET /" to return 200 status code
  app.get('/', (req: Request, res: Response) => {
    res.send('OK')
  })

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  app.post('/', async (req: Request, res: Response) => {
    const data = req.body
    console.log(data)
    const action = data.action
    const website: string = data.website ?? ''
    const keywords: string[] = (data.keyword ?? '').split(',')
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    const sessionID: string = data.sessionID || new Date().getTime().toString()
    const cacheDir = getGlobalCacheDir(sessionID)
    const storagePath: string = data.storagePath ?? cacheDir
    console.log(`Using storage path: ${storagePath}`)

    let context: BrowserContext
    if (contextMap[sessionID] !== undefined) {
      context = contextMap[sessionID]
    } else {
      context = await chromium.launchPersistentContext(
        storagePath,
        {
          headless: data.headless === 'true',
          viewport: null,
          channel: 'chrome',
          args: ['--start-maximized'],
          ignoreDefaultArgs: ['--enable-automation', '--use-mock-keychain']
        })
      contextMap[sessionID] = context
    }
    if (action === 'browse') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      res.send(await browse(context, website, sessionID, data.print === 'true'))
    } else if (action === 'search') {
      res.send(await search(context, website, sessionID, keywords))
    } else if (action === 'inspect') {
      res.send(await search(context, website, sessionID, []))
    } else if (action === 'click-link') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await clickLink(context, res, data.link ?? '')
      res.end()
    } else if (action === 'click-button') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await clickButton(context, res, data.name ?? '', data.exact === 'true', sessionID)
      res.end()
    } else if (action === 'fill') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await fill(context, website, data.id ?? '', data.name ?? '', data.content ?? '')
      res.end()
    } else if (action === 'enter') {
      await enter(context, res, data.input as string)
    } else if (action === 'check') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await check(context, res, data.id ?? '')
    } else if (action === 'select') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await select(context, res, data.id ?? '', data.option ?? '')
    } else if (action === 'login') {
      await login(context, website, sessionID)
    } else {
      res.send('Invalid action')
    }

    await fs.mkdir(sessionID, { recursive: true })
    const pages = context.pages()
    await pages[pages.length - 1].screenshot({ path: path.join(sessionID, `${Math.floor(Date.now() / 1000)}.png`) })
  })

  // stdin is used as a keep-alive mechanism. When the parent process dies the stdin will be closed and this process
  // will exit.
  process.stdin.resume()
  process.stdin.on('close', () => {
    console.log('Closing the server')
    process.exit(0)
  })

  // Start the server
  app.listen(port, () => {
    console.log(`Server is listening on port ${port}`)
  })
}

function getGlobalCacheDir (name: string): string {
  const homedir = os.homedir()
  if (process.platform === 'darwin') {
    return path.join(homedir, 'Library', 'Caches', name)
  }

  if (process.platform === 'win32') {
    return path.join(process.env.APPDATA ?? path.join(homedir, 'AppData', 'Local'), name, 'Cache')
  }

  return path.join(process.env.XDG_CACHE_HOME ?? path.join(homedir, '.cache'), name)
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main()
