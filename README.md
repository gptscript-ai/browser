# GPTScript Browser Tool

This tool enables GPTScript to browse websites, navigate through pages, and execute specific actions seamlessly in Google Chrome.

## Examples

Explore our examples to learn how to navigate between websites using the browser tool:

- [Generating a gaming newsletter from Reddit posts](https://github.com/gptscript-ai/browser/blob/main/examples/reddit-gaming-newsletter.gpt)
- [Summarizing top users' profiles on StackOverflow](https://github.com/gptscript-ai/browser/blob/main/examples/stackoverflow-user-summarizer.gpt)
- [Screenshotting stock data from Yahoo Finance](https://github.com/gptscript-ai/browser/blob/main/examples/yahoo-finance-screenshot.gpt)

Video Demonstrations:
- [Creating a GitHub Issue](https://www.loom.com/share/c75bc647192c48879762f586d36eacc9)
- [Approving a GitHub PR](https://www.loom.com/share/3af5eb84480049298e343bb01e10cd47)

## Reuse existing cookies and sessions

You can define a specific workspace directory on your system in order to persist your browser session and cookies across different scripts.

`gptscript --workspace /path/to/workspace my-script.gpt`

If you run other scripts with the same workspace, it should reuse the existing cookies and session.
