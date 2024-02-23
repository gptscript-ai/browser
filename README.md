# Gptscript browser tool

This is a tool for gptscript to be able to browser website, navigate pages and perform certain actions.

## Quick start

```
git clone https://github.com/gptscript-ai/browser

cd gptscript-browser-tool

npm install

npm run server

gptscript ./examples/coachella-browse.gpt
```

## Examples

There are some built-in [examples](./examples/) to show you how to ask browser tool to navigate between websites.

[Github Issue creation](./examples/github-create-issue.gpt)

[Github PR approval](./examples/github-approve-pr.gpt)

[Github Click repo](./examples/github-click-repo.gpt)

Video examples

[Github Issue creation](https://www.loom.com/share/c75bc647192c48879762f586d36eacc9)

[Github PR approval](https://www.loom.com/share/3af5eb84480049298e343bb01e10cd47)

## Reuse existing cookies and sessions

If you want to reuse your existing browser user data and cookies, give prompt like

```
Reuse existing browser userdata and session.
```

The tool will kill existing chrome process and launch a new browser with your existing session.

## How it works

The tool itself will be running as a http server served as daemon, controlling browser action and maintain sessions. 

Each gptscript invoke will be assigned to a speficic session that belong to the context, so all the actions will happen in one single page.

If you reuse existing browser sessions, it will quit existing chrome processes.
