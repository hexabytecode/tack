import type { Issue } from '../data/mock'

/** Does an issue pass the board/list filters in a query string (who, type, prio, q)? */
export function matchFilters(i: Issue, params: URLSearchParams) {
  const q = (params.get('q') ?? '').toLowerCase()
  const who = params.get('who'); const type = params.get('type'); const prio = params.get('prio')
  const people = who ? who.split(',') : []
  return (!q || i.title.toLowerCase().includes(q) || i.key.toLowerCase().includes(q)) &&
    (!people.length || (i.assignee !== null && people.includes(i.assignee))) &&
    (!type || i.type === type) && (!prio || i.priority === prio)
}
