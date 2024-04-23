import express, { type Request, type Response } from 'express'
import bodyParser from 'body-parser'
import { type BrowserContext } from 'playwright'
import { chromium } from 'playwright'
import { browse } from './browse'
import { click } from './click'
import { fill } from './fill'
import { enter } from './enter'
import { check } from './check'
import { select } from './select'
import * as path from 'path'
import * as os from 'os'
import { login } from './login'
import * as fs from 'fs'

async function main (): Promise<void> {
  const app = express()
  // Get 9888 from the environment variable or use 9888 if it is not defined
  const port = process.env.PORT || 9888
  delete (process.env.GPTSCRIPT_INPUT)
  app.use(bodyParser.json())

  const contextMap: Record<string, BrowserContext> = {}

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
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    let sessionID = ''
    if (data.sessionID !== undefined) {
      sessionID = data.sessionID
    } else {
      const sessionFile = path.join(os.homedir(), '/.gptscript/session')
      if (!fs.existsSync(sessionFile)) {
        fs.mkdirSync(path.dirname(sessionFile), { recursive: true })
        fs.writeFileSync(sessionFile, new Date().getTime().toString())
      }
      sessionID = fs.readFileSync(sessionFile, 'utf8').toString()
    }

    const cacheDir = getGlobalCacheDir(sessionID)
    const storagePath: string = data.storagePath ?? cacheDir

    let context: BrowserContext
    if (contextMap[sessionID] !== undefined) {
      context = contextMap[sessionID]
    } else {
      context = await chromium.launchPersistentContext(
        storagePath,
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

    if (req.path === '/browse') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      res.send(await browse(context, website, sessionID, false))
    } else if (req.path === '/summarize') {
      res.send(await browse(context, website, sessionID, true))
    } else if (req.path === '/click') {
      await click(context, userInput, keywords.map((keyword) => keyword.trim()))
    } else if (req.path === '/fill') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await fill(context, userInput, data.content ?? '', keywords)
    } else if (req.path === '/enter') {
      await enter(context, data.input as string)
    } else if (req.path === '/check') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await check(context, userInput, keywords)
    } else if (req.path === '/select') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await select(context, userInput, data.option ?? '')
    } else if (req.path === '/login') {
      await login(context, website, sessionID)
    }

    res.end()
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
