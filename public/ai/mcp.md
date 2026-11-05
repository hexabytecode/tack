# MCP tools

Tack gives an AI tool four actions. Nothing else is exposed.

## search_issues

Find issues by text, project, status, assignee or priority.

```json
{ "project": "WEB", "status": "progress", "assignee": "me" }
```

## get_issue

Read one issue with its description, comments and history.

```json
{ "key": "WEB-142" }
```

## create_issue

Create an issue. Only `project` and `title` are required.

```json
{ "project": "WEB", "title": "Checkout button overlaps footer on mobile", "type": "bug", "priority": "high" }
```

## update_issue

Change fields, move columns or add a comment.

```json
{ "key": "WEB-142", "status": "review", "comment": "Fix is ready for review." }
```
