import { toast as sonner } from 'sonner'
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react'
import { ME, PROJECTS, USERS, nextNumber, seed, STATUSES, type Activity, type Comment, type Issue, type IssueType, type Priority, type Project, type Status, type User } from './data/mock'

const KEY = 'tack-demo-v2'

interface State {
  signedIn: boolean
  users: User[]
  projects: Project[]
  issues: Issue[]
  comments: Comment[]
  activity: Activity[]
  flash: string | null
}

type NewIssue = { project: string; title: string; description: string; type: IssueType; priority: Priority; assignee: string | null; due: string | null }

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
      const issues = s.issues.map(i => i.project === a.issue.project && i.status === 'todo' ? { ...i, order: i.order + 1 } : i)
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
  }
}

interface Ctx {
  state: State
  dispatch: (a: Action) => void
  user: (id: string | null) => User | undefined
  create: (n: NewIssue) => Issue
  toast: (text: string) => void
  createOpen: boolean
  setCreateOpen: (open: boolean, project?: string) => void
  createProject: string | null
}

const StoreCtx = createContext<Ctx | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load)
  const [createOpen, setOpen] = useState(false)
  const [createProject, setCreateProject] = useState<string | null>(null)
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

  const toast = useCallback((text: string) => { sonner(text) }, [])

  const create = useCallback((n: NewIssue) => {
    const now = Date.now()
    const issue: Issue = {
      ...n, key: `${n.project}-${nextNumber(stateRef.current.issues, n.project)}`,
      status: 'todo', labels: [], order: 0, createdAt: now, updatedAt: now,
    }
    dispatch({ t: 'create', issue })
    return issue
  }, [])

  const value = useMemo<Ctx>(() => ({
    state, dispatch, toast, create,
    user: (id) => state.users.find(u => u.id === id),
    createOpen,
    setCreateOpen: (open, project) => { setOpen(open); if (project) setCreateProject(project) },
    createProject,
  }), [state, toast, create, createOpen, createProject])

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>
}

export function useStore() {
  const ctx = useContext(StoreCtx)
  if (!ctx) throw new Error('useStore outside StoreProvider')
  return ctx
}
