# Getting started with Tack and AI

Tack works without AI. If you want help from an AI tool, connect it once with your personal key.

## 1. Get your personal key

Open **Settings → AI connections** in Tack and copy your key. It only acts as you, and you can revoke it at any time.

## 2. Connect your tool

**Claude Code**

```
claude mcp add --transport http tack https://tack.company.com/mcp --header "Authorization: Bearer <your key>"
```

**Cursor**: Settings → MCP → Add server, with the same address and header.

## 3. Try a first prompt

> Read https://tack.company.com/llms.txt, then show me what's assigned to me this week.

Every change the AI makes is labelled "by agent" on the issue and in its history.
