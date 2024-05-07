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

You can define a specific session ID in order to persist cookies and login information across multiple GPTScript executions.

```
Tools: github.com/gptscript-ai/browser

Use session `linkedin`.

Log in to `www.linkedin.com`.
```

If you run other scripts with the same session ID, it should keep you logged in with the cookie you have.

```
Tools: github.com/gptscript-ai/browser

Use session id `linkedin`.

Go to `https://www.linkedin.com/in/ibuildthecloud/`, give me a list of companies Darren has worked at recently as well as his job title at each one.
```
