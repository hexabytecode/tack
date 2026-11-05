# Issues in Tack

An issue is one piece of work. It belongs to one project and has a key made of the project key and a number, like `WEB-142`.

## Fields

| Field | Values |
|---|---|
| title | Short sentence, required |
| description | Markdown, optional |
| status | `todo`, `progress`, `review`, `done` |
| type | `task`, `bug` |
| priority | `high`, `medium`, `low` |
| assignee | A team member, or none |
| due | A date, optional |
| labels | Short words, optional |

## Statuses

To do → In progress → In review → Done. An issue can move to any column at any time.

## Comments

Comments are Markdown. `@Name` mentions a teammate, and `WEB-142` links to another issue. Callouts use `> [!NOTE]`, `> [!TIP]`, `> [!WARNING]` or `> [!DONE]`.
