import express, { type Request, type Response } from 'express'
import bodyParser from 'body-parser'
import { type BrowserContext, type Page } from 'playwright'
import { chromium } from 'playwright'
import { browse, close } from './browse'
import { click } from './click'
import { fill } from './fill'
import { enter } from './enter'
import { check } from './check'
import { select } from './select'
import { login } from './login'
import { scrollToBottom } from './scrollToBottom'
import { existsSync, mkdirSync } from 'fs'
import { randomBytes } from 'node:crypto'
import { Mutex } from 'async-mutex'
import { screenshot } from './screenshot'
import path from 'node:path'
import { loadSettingsFile } from './settings'
import * as os from 'node:os'

const mutex = new Mutex()

async function main (): Promise<void> {
  const settings = loadSettingsFile()

  const app = express()
  // Get port from the environment variable or use 9888 if it is not defined
  const port = process.env.PORT ?? 9888
  delete (process.env.GPTSCRIPT_INPUT)
  app.use(bodyParser.json())

  const contextMap: Record<string, BrowserContext> = {} // mapping of session ID => browser context
  const pageMap: Record<string, Record<string, Page>> = {} // mapping of session ID => page ID => page

  // gptscript requires "GET /" to return 200 status code
  app.get('/', (req: Request, res: Response) => {
    res.send('OK')
  })

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  app.post('/*', async (req: Request, res: Response) => {
    const data = req.body
    console.log(data)
    const website: string = data.website ?? ''
    const userInput: string = data.userInput ?? ''
    const keywords: string[] = (data.keywords ?? '').split(',')

    if (process.env.GPTSCRIPT_WORKSPACE_ID === undefined || process.env.GPTSCRIPT_WORKSPACE_DIR === undefined) {
      res.status(400).send('GPTScript workspace ID and directory are not set')
      return
    }

    let sessionID: string
    let sessionDir: string

    if (settings.useDefaultSession === true) {
      sessionID = 'default'
      switch (os.platform()) {
        case 'win32':
          sessionDir = path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data')
          break
        case 'darwin':
          sessionDir = path.join(os.homedir(), 'Library', 'Application Support', 'Google', 'Chrome')
          break
        case 'linux':
          sessionDir = path.join(os.homedir(), '.config', 'google-chrome')
          break
        default:
          throw new Error('unsupported OS: ' + os.platform())
      }
    } else {
      sessionID = process.env.GPTSCRIPT_WORKSPACE_ID
      sessionDir = path.resolve(process.env.GPTSCRIPT_WORKSPACE_DIR) + '/browser_session'

      if (!existsSync(sessionDir)) {
        mkdirSync(sessionDir)
      }
    }

    let pageID = randomBytes(8).toString('hex')
    let printPageID = true
    if (data.pageID !== undefined) {
      pageID = data.pageID
      printPageID = false
    }

    let context: BrowserContext
    if (contextMap[sessionID] !== undefined) {
      context = contextMap[sessionID]
    } else {
      context = await chromium.launchPersistentContext(
        sessionDir,
        {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          headless: data.headless === 'true',
          viewport: null,
          channel: 'chrome',
          args: ['--start-maximized', '--disable-blink-features=AutomationControlled'],
          ignoreDefaultArgs: ['--enable-automation', '--use-mock-keychain']
        })
      contextMap[sessionID] = context
    }

    context.on('close', () => {
      console.log('Closing the context')
      setTimeout(() => {
        process.exit(0)
      }, 3000)
    })

    // We lock the rest of this behind a mutex in order to use one tab at a time.
    const release = await mutex.acquire()

    let page: Page
    if (pageMap[sessionID]?.[pageID] !== undefined) {
      page = pageMap[sessionID][pageID]
      if (page.isClosed()) {
        page = await context.newPage()
        if (pageMap[sessionID] === undefined) {
          pageMap[sessionID] = {}
        }
        pageMap[sessionID][pageID] = page
      }
    } else {
      page = await context.newPage()
      if (pageMap[sessionID] === undefined) {
        pageMap[sessionID] = {}
      }
      pageMap[sessionID][pageID] = page
    }
    await page.bringToFront()

    let allElements = false
    if (data.allElements === 'true' || data.allElements === true) {
      allElements = true
    }

    let matchTextOnly = false
    if (data.matchTextOnly === 'true' || data.matchTextOnly === true) {
      matchTextOnly = true
    }

    if (req.path === '/browse') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      res.send(await browse(page, website, 'browse', pageID, printPageID))
    } else if (req.path === '/getPageContents') {
      res.send(await browse(page, website, 'getPageContents', pageID, printPageID))
    } else if (req.path === '/getPageLinks') {
      res.send(await browse(page, website, 'getPageLinks', pageID, printPageID))
    } else if (req.path === '/getPageImages') {
      res.send(await browse(page, website, 'getPageImages', pageID, printPageID))
    } else if (req.path === '/click') {
      await click(page, userInput, keywords.map((keyword) => keyword.trim()), allElements, matchTextOnly)
    } else if (req.path === '/fill') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await fill(page, userInput, data.content ?? '', keywords, matchTextOnly)
    } else if (req.path === '/enter') {
      await enter(page)
    } else if (req.path === '/check') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await check(page, userInput, keywords, matchTextOnly)
    } else if (req.path === '/select') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await select(page, userInput, data.option ?? '')
    } else if (req.path === '/login') {
      await login(context, website)
    } else if (req.path === '/scrollToBottom') {
      await scrollToBottom(page)
    } else if (req.path === '/close') {
      await close(page)
    } else if (req.path === '/screenshot') {
      await screenshot(page, userInput, keywords, (data.filename as string) ?? 'screenshot.png')
    }

    release()
    res.end()
  })

  // Start the server
  const server = app.listen(port, () => {
    console.log(`Server is listening on port ${port}`)
  })

  // stdin is used as a keep-alive mechanism. When the parent process dies the stdin will be closed and this process
  // will exit.
  process.stdin.resume()
  process.stdin.on('close', () => {
    console.log('Closing the server')
    server.close()
    process.exit(0)
  })

  process.on('SIGINT', () => {
    console.log('Closing the server')
    server.close()
    process.exit(0)
  })

  process.on('SIGTERM', () => {
    console.log('Closing the server')
    server.close()
    process.exit(0)
  })

  process.on('SIGHUP', () => {
    console.log('Closing the server')
    server.close()
    process.exit(0)
  })
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main()
