# REST API

The same four actions over HTTP. Send your personal key as `Authorization: Bearer <key>`.

| Action | Request |
|---|---|
| Search | `GET /api/v1/issues?project=WEB&status=progress` |
| Read | `GET /api/v1/issues/WEB-142` |
| Create | `POST /api/v1/issues` |
| Update | `PATCH /api/v1/issues/WEB-142` |

## Example

```
curl -X PATCH https://tack.company.com/api/v1/issues/WEB-142 \
  -H "Authorization: Bearer <key>" \
  -H "Content-Type: application/json" \
  -d '{ "status": "review" }'
```
