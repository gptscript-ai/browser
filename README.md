# Gptscript browser tool

This tool enables Gptscript to browse websites, navigate through pages, and execute specific actions seamlessly.

## Quick start

To get started, execute the following commands:

```
git clone https://github.com/gptscript-ai/browser

cd browser

npm install

npm run server

gptscript ./examples/coachella-browse.gpt
```

## Examples

Explore our built-in examples to learn how to navigate between websites using the browser tool:

- [Creating a GitHub Issue](https://github.com/gptscript-ai/browser/blob/main/examples/github-create-issue.gpt)
- [Approving a GitHub PR](https://github.com/gptscript-ai/browser/blob/main/examples/github-approve-pr.gpt)
- [Clicking a GitHub Repository](https://github.com/gptscript-ai/browser/blob/main/examples/github-click-repo.gpt)

Video Demonstrations:
- [Creating a GitHub Issue](https://www.loom.com/share/c75bc647192c48879762f586d36eacc9)
- [Approving a GitHub PR](https://www.loom.com/share/3af5eb84480049298e343bb01e10cd47)

## Reuse existing cookies and sessions

To reuse your existing browser user data and cookies, use the following prompt:

```
Reuse existing browser userdata and session.
```

This action will terminate any existing Chrome processes and launch a new browser session with your saved data.

## How it works

The tool operates as an HTTP server running in the background, managing browser actions and sessions.

Each Gptscript command is linked to a unique session associated with the context, ensuring that all actions are performed within a single page.

Reusing browser sessions will close any active Chrome processes.
