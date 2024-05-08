# GPTScript Browser Tool

This tool enables GPTScript to browse websites, navigate through pages, and execute specific actions seamlessly in the browser.

## Examples

Explore our built-in examples to learn how to navigate between websites using the browser tool:

- [Creating a GitHub Issue](https://github.com/gptscript-ai/browser/blob/main/examples/github-create-issue.gpt)
- [Approving a GitHub PR](https://github.com/gptscript-ai/browser/blob/main/examples/github-approve-pr.gpt)
- [Clicking a GitHub Repository](https://github.com/gptscript-ai/browser/blob/main/examples/github-click-repo.gpt)

Video Demonstrations:
- [Creating a GitHub Issue](https://www.loom.com/share/c75bc647192c48879762f586d36eacc9)
- [Approving a GitHub PR](https://www.loom.com/share/3af5eb84480049298e343bb01e10cd47)

## Reuse existing cookies and sessions

You can define a specific workspace directory in order to persist your browser session and cookies across different scripts.

`gptscript --workspace /path/to/workspace my-script.gpt`

If you run other scripts with the same workspace, it should reuse the existing cookies and session.
