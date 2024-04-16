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

To use a specific session id and login to that session, first try to log in to the website with specific session id. For example:

```
Tools: github.com/gptscript-ai/browser

Use sesssion `linkedin`.

Login to `www.linkedin.com`.
```

Once you are logged in, close the browser tab. If you run other gptscripts with the same session id, it should keep you logged in with the cookie you have.

```
Tools: github.com/gptscript-ai/browser

Use sesssion id `linkedin`.

Go to `https://www.linkedin.com/in/ibuildthecloud/`, give me a list of company darren has worked recently and how long he has worked, what did he do for each job.
```