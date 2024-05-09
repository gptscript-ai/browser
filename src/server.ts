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
import { login } from './login'
import { scrollToBottom } from './scrollToBottom'
import { existsSync, mkdirSync } from 'fs'

async function main (): Promise<void> {
  const app = express()
  // Get port from the environment variable or use 9888 if it is not defined
  const port = process.env.PORT ?? 9888
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

    if (process.env.GPTSCRIPT_WORKSPACE_ID === undefined || process.env.GPTSCRIPT_WORKSPACE_DIR === undefined) {
      res.status(400).send('GPTScript workspace ID and directory are not set')
      return
    }

    const sessionID: string = process.env.GPTSCRIPT_WORKSPACE_ID
    const sessionDir: string = process.env.GPTSCRIPT_WORKSPACE_DIR + '/browser_session'
    if (!existsSync(sessionDir)) {
      mkdirSync(sessionDir)
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

    let allElements = false
    if (data.allElements === 'true' || data.allElements === true) {
      allElements = true
    }

    if (req.path === '/browse') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      res.send(await browse(context, website, 'browse'))
    } else if (req.path === '/getPageContents') {
      res.send(await browse(context, website, 'getPageContents'))
    } else if (req.path === '/getPageLinks') {
      res.send(await browse(context, website, 'getPageLinks'))
    } else if (req.path === '/getPageImages') {
      res.send(await browse(context, website, 'getPageImages'))
    } else if (req.path === '/click') {
      await click(context, userInput, keywords.map((keyword) => keyword.trim()), allElements)
    } else if (req.path === '/fill') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await fill(context, userInput, data.content ?? '', keywords)
    } else if (req.path === '/enter') {
      await enter(context)
    } else if (req.path === '/check') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await check(context, userInput, keywords)
    } else if (req.path === '/select') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await select(context, userInput, data.option ?? '')
    } else if (req.path === '/login') {
      await login(context, website)
    } else if (req.path === '/scrollToBottom') {
      await scrollToBottom(context)
    }

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
