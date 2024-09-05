import * as fs from 'node:fs'

export interface BrowserSettings {
  useDefaultSession?: boolean
  headless?: boolean
  lookForShadowRoot?: boolean
}

export function loadSettingsFile (): BrowserSettings {
  if (process.env.GPTSCRIPT_BROWSER_SETTINGS_FILE != null && process.env.GPTSCRIPT_BROWSER_SETTINGS_FILE !== '') {
    try {
      const contents = fs.readFileSync(process.env.GPTSCRIPT_BROWSER_SETTINGS_FILE)
      return JSON.parse(contents.toString())
    } catch (e) {
      return {}
    }
  }

  const file = process.env.GPTSCRIPT_WORKSPACE_DIR + '/browsersettings.json'
  try {
    const contents = fs.readFileSync(file)
    return JSON.parse(contents.toString())
  } catch (e) {
    return {}
  }
}
