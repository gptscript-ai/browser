import * as fs from 'node:fs'

export interface BrowserSettings {
  useDefaultSession?: boolean
  headless?: boolean
}

export function loadSettingsFile (): BrowserSettings {
  const file = process.env.GPTSCRIPT_WORKSPACE_DIR + '/browsersettings.json'
  try {
    const contents = fs.readFileSync(file)
    return JSON.parse(contents.toString())
  } catch (e) {
    return {}
  }
}
