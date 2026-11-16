import { notify, type NotifyOptions } from './lib/notify'
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react'
import { ME, PROJECTS, USERS, nextNumber, seed, STATUSES, type Activity, type Comment, type Issue, type IssueType, type Priority, type Project, type Release, type Sprint, type StarredView, type Status, type User } from './data/mock'

const KEY = 'tack-demo-v4'

interface State {
  signedIn: boolean
  users: User[]
  projects: Project[]
  issues: Issue[]
  sprints: Sprint[]
  releases: Release[]
  starred: StarredView[]
  comments: Comment[]
  activity: Activity[]
  flash: string | null
}

type NewIssue = { project: string; title: string; description: string; type: IssueType; priority: Priority; assignee: string | null; due: string | null; status?: Status; sprint?: string | null; points?: number | null; labels?: string[]; attachments?: { name: string; size: number }[] }

type Action =
  | { t: 'signIn' } | { t: 'signOut' } | { t: 'reset' }
  | { t: 'move'; key: string; status: Status; index: number }
  | { t: 'update'; key: string; patch: Partial<Issue> }
  | { t: 'create'; issue: Issue }
  | { t: 'comment'; key: string; body: string }
  | { t: 'agent'; key: string; status: Status; note: string }
  | { t: 'clearFlash' }
  | { t: 'project'; key: string; patch: Partial<Project> }
  | { t: 'role'; user: string; role: User['role'] }
  | { t: 'invite'; email: string; project: string }
  | { t: 'removeMember'; user: string; project: string }
  | { t: 'plan'; key: string; sprint: string | null; index: number }
  | { t: 'sprintCreate'; project: string }
  | { t: 'sprintUpdate'; id: string; patch: Partial<Sprint> }
  | { t: 'sprintStart'; id: string; patch: Pick<Sprint, 'name' | 'start' | 'end' | 'goal'> }
  | { t: 'sprintComplete'; id: string; moveTo: string | null }
  | { t: 'releaseCreate'; release: Omit<Release, 'id' | 'state' | 'shippedAt' | 'notes'> }
  | { t: 'releaseUpdate'; id: string; patch: Partial<Release> }
  | { t: 'releaseShip'; id: string; undo?: boolean }
  | { t: 'star'; view: Omit<StarredView, 'id'> }
  | { t: 'unstar'; id: string }

function fresh(): State {
  return { signedIn: false, users: USERS, projects: PROJECTS, ...seed(), flash: null }
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...fresh(), ...JSON.parse(raw), flash: null }
  } catch { /* storage blocked: fall back to fresh data */ }
  return fresh()
}

const label = (s: Status) => STATUSES.find(x => x.id === s)!.label
const uid = () => Math.random().toString(36).slice(2, 9)

function reorder(issues: Issue[], key: string, status: Status, index: number) {
  const moving = issues.find(i => i.key === key)
  if (!moving) return issues
  const project = moving.project
  const column = issues.filter(i => i.project === project && i.status === status && i.key !== key).sort((a, b) => a.order - b.order)
  column.splice(Math.max(0, Math.min(index, column.length)), 0, moving)
  const orders = new Map(column.map((i, n) => [i.key, n + 1]))
  return issues.map(i => {
    if (i.key === key) return { ...i, status, order: orders.get(key)!, updatedAt: i.status === status ? i.updatedAt : Date.now() }
    return orders.has(i.key) ? { ...i, order: orders.get(i.key)! } : i
  })
}

/* Put an issue into a sprint (or the backlog when sprint is null) at a position, renumbering that list. */
function plan(issues: Issue[], key: string, sprint: string | null, index: number) {
  const moving = issues.find(i => i.key === key)
  if (!moving) return issues
  const list = issues.filter(i => i.project === moving.project && i.sprint === sprint && i.key !== key).sort((a, b) => a.rank - b.rank)
  list.splice(Math.max(0, Math.min(index, list.length)), 0, moving)
  const ranks = new Map(list.map((i, n) => [i.key, n]))
  return issues.map(i => i.key === key ? { ...i, sprint, rank: ranks.get(key)!, updatedAt: i.sprint === sprint ? i.updatedAt : Date.now() }
    : ranks.has(i.key) ? { ...i, rank: ranks.get(i.key)! } : i)
}

const sprintNumber = (name: string) => Number(name.match(/\d+/)?.[0] ?? 0)
function nextSprint(sprints: Sprint[], project: string): Sprint {
  const n = Math.max(0, ...sprints.filter(x => x.project === project).map(x => sprintNumber(x.name))) + 1
  return { id: `${project}-${uid()}`, project, name: `Sprint ${n}`, goal: '', start: null, end: null, state: 'planned' }
}

function reducer(s: State, a: Action): State {
  const now = Date.now()
  switch (a.t) {
    case 'signIn': return { ...s, signedIn: true }
    case 'signOut': return { ...s, signedIn: false }
    case 'reset': return { ...fresh(), signedIn: true }
    case 'move': {
      const before = s.issues.find(i => i.key === a.key)
      const issues = reorder(s.issues, a.key, a.status, a.index)
      const activity = before && before.status !== a.status
        ? [...s.activity, { id: uid(), issue: a.key, actor: ME, text: `moved this to ${label(a.status)}`, at: now }]
        : s.activity
      return { ...s, issues, activity }
    }
    case 'update': {
      const before = s.issues.find(i => i.key === a.key)
      if (!before) return s
      const issues = s.issues.map(i => i.key === a.key ? { ...i, ...a.patch, updatedAt: now } : i)
      const notes: Activity[] = []
      if (a.patch.status && a.patch.status !== before.status) notes.push({ id: uid(), issue: a.key, actor: ME, text: `moved this to ${label(a.patch.status)}`, at: now })
      if (a.patch.assignee !== undefined && a.patch.assignee !== before.assignee) {
        const who = s.users.find(u => u.id === a.patch.assignee)
        notes.push({ id: uid(), issue: a.key, actor: ME, text: who ? `assigned this to ${who.name}` : 'removed the assignee', at: now })
      }
      if (a.patch.priority && a.patch.priority !== before.priority) notes.push({ id: uid(), issue: a.key, actor: ME, text: `set priority to ${a.patch.priority}`, at: now })
      return { ...s, issues, activity: [...s.activity, ...notes] }
    }
    case 'create': {
      const issues = s.issues.map(i => i.project === a.issue.project && i.status === a.issue.status ? { ...i, order: i.order + 1 } : i)
      return { ...s, issues: [...issues, a.issue], activity: [...s.activity, { id: uid(), issue: a.issue.key, actor: ME, text: 'created this issue', at: now }], flash: a.issue.key }
    }
    case 'comment':
      return { ...s, comments: [...s.comments, { id: uid(), issue: a.key, author: ME, body: a.body, at: now }], issues: s.issues.map(i => i.key === a.key ? { ...i, updatedAt: now } : i) }
    case 'agent': {
      const issues = reorder(s.issues, a.key, a.status, 0)
      return {
        ...s, issues, flash: a.key,
        comments: [...s.comments, { id: uid(), issue: a.key, author: ME, body: a.note, at: now, agent: 'Claude' }],
        activity: [...s.activity, { id: uid(), issue: a.key, actor: ME, text: `moved this to ${label(a.status)}`, at: now, agent: 'Claude' }],
      }
    }
    case 'clearFlash': return { ...s, flash: null }
    case 'project': return { ...s, projects: s.projects.map(p => p.key === a.key ? { ...p, ...a.patch } : p) }
    case 'role': return { ...s, users: s.users.map(u => u.id === a.user ? { ...u, role: a.role } : u) }
    case 'invite': {
      const id = uid()
      const name = a.email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
      return {
        ...s,
        users: [...s.users, { id, name, initials, email: a.email, role: 'Member', title: 'Invited' }],
        projects: s.projects.map(p => p.key === a.project ? { ...p, members: [...p.members, id] } : p),
      }
    }
    case 'removeMember': return { ...s, projects: s.projects.map(p => p.key === a.project ? { ...p, members: p.members.filter(m => m !== a.user) } : p) }
    case 'plan': {
      const before = s.issues.find(i => i.key === a.key)
      const issues = plan(s.issues, a.key, a.sprint, a.index)
      if (!before || before.sprint === a.sprint) return { ...s, issues }
      const to = a.sprint ? s.sprints.find(x => x.id === a.sprint)?.name : 'the backlog'
      return { ...s, issues, activity: [...s.activity, { id: uid(), issue: a.key, actor: ME, text: `moved this to ${to}`, at: now }] }
    }
    case 'releaseCreate': return { ...s, releases: [...s.releases, { ...a.release, id: `${a.release.project}-${uid()}`, state: 'planned', shippedAt: null, notes: '' }] }
    case 'releaseUpdate': return { ...s, releases: s.releases.map(r => r.id === a.id ? { ...r, ...a.patch } : r) }
    case 'releaseShip': return { ...s, releases: s.releases.map(r => r.id === a.id ? (a.undo ? { ...r, state: 'active', shippedAt: null } : { ...r, state: 'shipped', shippedAt: new Date().toISOString().slice(0, 10) }) : r) }
    case 'star': return { ...s, starred: [...s.starred, { ...a.view, id: uid() }] }
    case 'unstar': return { ...s, starred: s.starred.filter(v => v.id !== a.id) }
    case 'sprintCreate': return { ...s, sprints: [...s.sprints, nextSprint(s.sprints, a.project)] }
    case 'sprintUpdate': return { ...s, sprints: s.sprints.map(x => x.id === a.id ? { ...x, ...a.patch } : x) }
    case 'sprintStart': {
      const sp = s.sprints.find(x => x.id === a.id)
      if (!sp || s.sprints.some(x => x.project === sp.project && x.state === 'active')) return s
      return { ...s, sprints: s.sprints.map(x => x.id === a.id ? { ...x, ...a.patch, state: 'active' } : x) }
    }
    case 'sprintComplete': {
      const sp = s.sprints.find(x => x.id === a.id)
      if (!sp) return s
      let sprints = s.sprints.map(x => x.id === a.id ? { ...x, state: 'closed' as const } : x)
      let issues = s.issues
      for (const i of s.issues.filter(i => i.sprint === a.id && i.status !== 'done').sort((x, y) => x.rank - y.rank)) issues = plan(issues, i.key, a.moveTo, 1e6)
      if (!sprints.some(x => x.project === sp.project && x.state === 'planned')) sprints = [...sprints, nextSprint(sprints, sp.project)]
      return { ...s, sprints, issues }
    }
  }
}

interface Ctx {
  state: State
  dispatch: (a: Action) => void
  user: (id: string | null) => User | undefined
  create: (n: NewIssue) => Issue
  toast: (text: string, opts?: NotifyOptions) => void
  createOpen: boolean
  setCreateOpen: (open: boolean, project?: string, status?: Status, sprint?: string | null) => void
  createProject: string | null
  createStatus: Status
  /** Sprint to preset in New issue; undefined means the active sprint, null the backlog. */
  createSprint: string | null | undefined
}

const StoreCtx = createContext<Ctx | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load)
  const [createOpen, setOpen] = useState(false)
  const [createProject, setCreateProject] = useState<string | null>(null)
  const [createStatus, setCreateStatus] = useState<Status>('todo')
  const [createSprint, setCreateSprint] = useState<string | null | undefined>(undefined)
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => {
    try {
      const { flash: _flash, ...rest } = state
      localStorage.setItem(KEY, JSON.stringify(rest))
    } catch { /* storage blocked: the demo still works for this visit */ }
  }, [state])

  useEffect(() => {
    if (!state.flash) return
    const t = setTimeout(() => dispatch({ t: 'clearFlash' }), 1800)
    return () => clearTimeout(t)
  }, [state.flash])

  const toast = useCallback((text: string, opts?: NotifyOptions) => { notify(text, opts) }, [])

  const create = useCallback((n: NewIssue) => {
    const now = Date.now()
    const issue: Issue = {
      ...n, key: `${n.project}-${nextNumber(stateRef.current.issues, n.project)}`,
      status: n.status ?? 'todo', labels: n.labels ?? [], sprint: n.sprint ?? null, points: n.points ?? null,
      rank: Math.max(0, ...stateRef.current.issues.map(i => i.rank)) + 1, release: null, order: 0, createdAt: now, updatedAt: now,
    }
    dispatch({ t: 'create', issue })
    return issue
  }, [])

  const value = useMemo<Ctx>(() => ({
    state, dispatch, toast, create,
    user: (id) => state.users.find(u => u.id === id),
    createOpen,
    setCreateOpen: (open, project, status, sprint) => { if (open) { setCreateStatus(status ?? 'todo'); setCreateSprint(sprint) } setOpen(open); if (project) setCreateProject(project) },
    createProject,
    createStatus,
    createSprint,
  }), [state, toast, create, createOpen, createProject, createStatus, createSprint])

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>
}

export function useStore() {
  const ctx = useContext(StoreCtx)
  if (!ctx) throw new Error('useStore outside StoreProvider')
  return ctx
}
