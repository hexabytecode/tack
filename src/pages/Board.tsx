import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useParams, useSearchParams } from 'react-router-dom'
import {
  DndContext, DragOverlay, KeyboardSensor, PointerSensor, closestCorners, useDroppable, useSensor, useSensors,
  type DragEndEvent, type DragOverEvent, type DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ChevronDown, Filter, Plus, Star, X } from 'lucide-react'
import { useStore } from '../store'
import { STATUSES, type Issue, type Sprint, type Status } from '../data/mock'
import { TopBar, Crumb, sameQuery } from '../components/AppShell'
import { matchFilters } from '@/lib/filters'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import IssueCard from '../components/IssueCard'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Avatar, PRIORITY_META, StatusPill, TYPE_META, cx } from '@/lib/ui'

type Columns = Record<Status, string[]>

export { matchFilters } from '@/lib/filters'

export function useFilteredIssues(project: string | undefined) {
  const { state } = useStore()
  const [params] = useSearchParams()
  const key = params.toString()
  const q = (params.get('q') ?? '').toLowerCase()
  const who = params.get('who')
  const type = params.get('type')
  const issues = useMemo(() => {
    const p = new URLSearchParams(key)
    return state.issues.filter(i => (!project || i.project === project) && matchFilters(i, p))
  }, [state.issues, project, key])
  return { issues, q, who, type }
}

/* People filter (Stitch, Gate 1 round 2, option A): an overlapping stack of the first few people
   and a "+N" menu for the rest. Picked people fill in black, get a blue ring and lift above the stack. */
const STACK = 4
function PeopleFilter({ members, picked, toggle }: { members: string[]; picked: string[]; toggle: (id: string) => void }) {
  const { user } = useStore()
  const shown = members.slice(0, STACK)
  const rest = members.slice(STACK)
  const restPicked = rest.filter(id => picked.includes(id)).length
  return (
    <div className="flex items-center gap-3">
      <span className="label-mono hidden text-slate sm:inline">People</span>
      <div className="flex items-center -space-x-2" role="group" aria-label="Filter by person">
        {shown.map(id => {
          const u = user(id)
          const on = picked.includes(id)
          return (
            <Tooltip key={id}>
              <TooltipTrigger asChild>
                <Button type="button" variant="ghost" size="icon" onClick={() => toggle(id)} aria-pressed={on} aria-label={u?.name}
                  className={cx('relative size-7 rounded-full border-2 border-paper font-mono text-[10px] transition-[translate,box-shadow,background-color,border-color,color]',
                    on ? 'z-20 -translate-y-0.5 bg-ink font-semibold text-paper shadow-sm ring-2 ring-brand hover:bg-ink hover:text-paper'
                      : 'z-10 bg-cloud font-medium text-ink hover:z-30 hover:border-slate hover:bg-cloud')}>
                  {u?.initials}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{u?.name}</TooltipContent>
            </Tooltip>
          )
        })}
        {rest.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="sm" aria-label={`${rest.length} more people`}
                className={cx('relative z-0 h-7 gap-0.5 rounded-full border-2 border-paper pl-4 pr-2 font-mono text-[10px] font-medium shadow-sm has-[>svg]:pl-4 has-[>svg]:pr-2',
                  restPicked ? 'bg-tint text-brand hover:bg-tint hover:text-brand' : 'bg-wash text-slate hover:bg-cloud hover:text-ink')}>
                +{rest.length}<ChevronDown className="size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              {rest.map(id => {
                const u = user(id)
                return (
                  <DropdownMenuCheckboxItem key={id} checked={picked.includes(id)} onCheckedChange={() => toggle(id)} onSelect={e => e.preventDefault()}>
                    <Avatar user={u} size={20} />{u?.name}
                  </DropdownMenuCheckboxItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}

/* Star the current filtered view so it shows under Starred views (Stitch, Gate 1 round 4). */
function StarView({ project }: { project: string }) {
  const { state, dispatch, toast } = useStore()
  const [params] = useSearchParams()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const view = location.pathname.split('/').pop() as 'board' | 'list' | 'backlog'
  const query = (() => { const p = new URLSearchParams(params); p.delete('issue'); p.sort(); return p.toString() })()
  const existing = state.starred.find(v => v.project === project && v.view === view && sameQuery(v.query, query))
  if (existing) return (
    <Button type="button" variant="outline" size="sm" onClick={() => { dispatch({ t: 'unstar', id: existing.id }); toast('Removed from starred views', { kind: 'info', description: existing.name }) }}
      className="hidden h-7 gap-2 rounded-[4px] border-warning/40 bg-[#FDF6EA] px-2 font-mono text-[11px] uppercase tracking-wide text-[#93500A] hover:border-warning hover:bg-[#FDF6EA] sm:inline-flex has-[>svg]:px-2">
      <Star className="size-3.5 fill-warning text-warning" />Starred
    </Button>
  )
  if (!query) return null
  return (
    <Popover open={open} onOpenChange={o => { setOpen(o); if (o) setName('') }}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="hidden h-7 gap-2 rounded-[4px] px-2 font-mono text-[11px] uppercase tracking-wide text-slate hover:text-ink sm:inline-flex has-[>svg]:px-2">
          <Star className="size-3.5" />Star view
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-3">
        <form className="flex flex-col gap-2" onSubmit={e => { e.preventDefault(); const n = name.trim() || 'Starred view'; dispatch({ t: 'star', view: { name: n, project, view, query } }); toast('Starred', { kind: 'create', description: `${n} is in your sidebar` }); setOpen(false) }}>
          <Label htmlFor="star-name" className="label-mono text-slate">Name this view</Label>
          <Input id="star-name" autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="e.g. My high-priority bugs" />
          <Button type="submit" size="sm" className="self-end"><Star />Star</Button>
        </form>
      </PopoverContent>
    </Popover>
  )
}

export function FilterRow({ project, count, extra }: { project: string; count: number; extra?: React.ReactNode }) {
  const { state } = useStore()
  const [params, setParams] = useSearchParams()
  const who = params.get('who')
  const picked = who ? who.split(',') : []
  const toggle = (id: string) => {
    const next = picked.includes(id) ? picked.filter(x => x !== id) : [...picked, id]
    set('who', next.length ? next.join(',') : null)
  }
  const type = params.get('type') ?? 'all'
  const prio = params.get('prio') ?? 'all'
  const p = state.projects.find(x => x.key === project)
  const set = (k: string, v: string | null) => setParams(prev => { if (v && v !== 'all') prev.set(k, v); else prev.delete(k); return prev }, { replace: true })
  const active = who || params.get('type') || params.get('prio') || params.get('q')

  return (
    <div className="flex min-h-12 shrink-0 flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-2 md:px-6">
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        <PeopleFilter members={p?.members ?? []} picked={picked} toggle={toggle} />
        <span className="hidden h-4 w-px bg-line sm:block" />
        <Select value={type} onValueChange={v => set('type', v)}>
          <SelectTrigger size="sm" className="h-8 gap-2 text-[12.5px]" aria-label="Type"><Filter className="size-3.5 text-slate" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {(['task', 'bug'] as const).map(k => { const m = TYPE_META[k]; return <SelectItem key={k} value={k}><m.icon className={cx('size-3.5', m.iconCls)} />{m.label}s</SelectItem> })}
          </SelectContent>
        </Select>
        <Select value={prio} onValueChange={v => set('prio', v)}>
          <SelectTrigger size="sm" className="h-8 text-[12.5px]" aria-label="Priority"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any priority</SelectItem>
            {(['high', 'medium', 'low'] as const).map(k => { const m = PRIORITY_META[k]; return <SelectItem key={k} value={k}><m.icon className={cx('size-3.5', m.iconCls)} />{m.label}</SelectItem> })}
          </SelectContent>
        </Select>
        {active && <Button variant="ghost" size="sm" className="text-slate" onClick={() => setParams({}, { replace: true })}><X />Clear</Button>}
      </div>
      <span className="flex shrink-0 items-center gap-3">{extra}<StarView project={project} /><span className="label-mono text-slate">{count} issues</span></span>
    </div>
  )
}

function SortableCard({ issue }: { issue: Issue }) {
  const { user, state } = useStore()
  const [, setParams] = useSearchParams()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: issue.key })
  return (
    <IssueCard
      ref={setNodeRef}
      issue={issue}
      assignee={user(issue.assignee)}
      ghost={isDragging}
      flash={state.flash === issue.key}
      byAgent={state.flash === issue.key && state.activity.some(a => a.issue === issue.key && a.agent && Date.now() - a.at < 5000)}
      comments={state.comments.filter(c => c.issue === issue.key).length}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      onClick={() => setParams(p => { p.set('issue', issue.key); return p })}
      {...attributes}
      {...listeners}
    />
  )
}

function Column({ status, keys, byKey, onAdd }: { status: Status; keys: string[]; byKey: Map<string, Issue>; onAdd: () => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const meta = STATUSES.find(s => s.id === status)!
  return (
    <section className={cx('flex w-[85vw] max-w-[320px] shrink-0 snap-start flex-col rounded-[4px] border bg-cloud p-3 transition-colors md:w-auto md:max-w-none md:flex-1 md:shrink', isOver ? 'border-slate/50 bg-[#E8E8EE]' : 'border-line')}>
      <header className="mb-3 flex items-center justify-between px-1">
        <h2 className="flex items-center gap-2">
          <StatusPill status={status} />
          <span className="font-mono text-[12.5px] text-slate">{keys.length}</span>
        </h2>
        <Tooltip>
          <TooltipTrigger asChild><Button variant="ghost" size="icon-sm" className="size-6 text-slate" onClick={onAdd} aria-label={`Add issue to ${meta.label}`}><Plus /></Button></TooltipTrigger>
          <TooltipContent>New issue</TooltipContent>
        </Tooltip>
      </header>
      <SortableContext items={keys} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="flex min-h-24 flex-1 flex-col gap-2">
          {keys.map(k => byKey.get(k) && <SortableCard key={k} issue={byKey.get(k)!} />)}
          {keys.length === 0 && <div className="flex h-20 items-center justify-center rounded-[4px] border border-dashed border-line font-mono text-[11px] text-slate">Drop a card here</div>}
        </div>
      </SortableContext>
    </section>
  )
}

export function daysLeft(end: string | null) {
  if (!end) return null
  return Math.ceil((new Date(end + 'T23:59:59').getTime() - Date.now()) / 86400000)
}

function SprintTag({ sprint }: { sprint: Sprint }) {
  const left = daysLeft(sprint.end)
  return (
    <span className="hidden items-center gap-2 font-mono text-[11px] uppercase tracking-wide text-slate sm:flex">
      <span className="size-1.5 rounded-full bg-brand" />{sprint.name}
      {left !== null && <><span className="text-line">·</span><span className={left < 0 ? 'text-destructive' : ''}>{left < 0 ? `${-left} days over` : left === 0 ? 'Ends today' : `${left} days left`}</span></>}
    </span>
  )
}

export default function Board() {
  const { project = 'WEB' } = useParams()
  const { state, dispatch, user, setCreateOpen, toast } = useStore()
  const { issues: all } = useFilteredIssues(project)
  // The board shows the active sprint, like Jira; everything else lives in the backlog.
  const sprint = state.sprints.find(x => x.project === project && x.state === 'active')
  const issues = useMemo(() => all.filter(i => sprint && i.sprint === sprint.id), [all, sprint])
  const byKey = useMemo(() => new Map(state.issues.map(i => [i.key, i])), [state.issues])
  const fromStore = useMemo<Columns>(() => {
    const cols = { todo: [], progress: [], review: [], done: [] } as Columns
    for (const i of [...issues].sort((a, b) => a.order - b.order)) cols[i.status].push(i.key)
    return cols
  }, [issues])
  const [cols, setCols] = useState<Columns>(fromStore)
  const [active, setActive] = useState<string | null>(null)
  const [origin, setOrigin] = useState<{ status: Status; index: number } | null>(null)

  useEffect(() => { if (!active) setCols(fromStore) }, [fromStore, active])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  if (!state.projects.some(p => p.key === project)) return <Navigate to="/app/WEB/board" replace />

  const findCol = (id: string): Status | undefined =>
    (STATUSES.some(s => s.id === id) ? id as Status : (Object.keys(cols) as Status[]).find(s => cols[s].includes(id)))

  const onStart = (e: DragStartEvent) => {
    const id = String(e.active.id)
    const issue = byKey.get(id)
    setActive(id)
    if (issue) {
      const col = state.issues.filter(i => i.project === issue.project && i.status === issue.status).sort((a, b) => a.order - b.order)
      setOrigin({ status: issue.status, index: col.findIndex(i => i.key === id) })
    }
  }

  const onOver = ({ active: a, over }: DragOverEvent) => {
    if (!over) return
    const from = findCol(String(a.id)); const to = findCol(String(over.id))
    if (!from || !to || from === to) return
    setCols(c => {
      const target = c[to]
      const overIndex = target.indexOf(String(over.id))
      const at = overIndex < 0 ? target.length : overIndex
      return { ...c, [from]: c[from].filter(k => k !== a.id), [to]: [...target.slice(0, at), String(a.id), ...target.slice(at)] }
    })
  }

  const onEnd = ({ active: a, over }: DragEndEvent) => {
    const id = String(a.id)
    const col = findCol(id)
    setActive(null)
    if (!col || !over) { setCols(fromStore); return }
    let list = cols[col]
    const overIndex = list.indexOf(String(over.id))
    const from = list.indexOf(id)
    if (overIndex >= 0 && overIndex !== from) list = arrayMove(list, from, overIndex)
    // Translate the position in the (possibly filtered) column into the full column.
    const next = list[list.indexOf(id) + 1]
    const full = state.issues.filter(i => i.project === project && i.status === col && i.key !== id).sort((x, y) => x.order - y.order)
    const index = next ? full.findIndex(i => i.key === next) : full.length
    setCols(c => ({ ...c, [col]: list }))
    dispatch({ t: 'move', key: id, status: col, index: index < 0 ? full.length : index })
    if (origin && origin.status !== col) {
      const back = origin
      toast(`${id} moved`, { status: col, description: byKey.get(id)?.title, action: { label: 'Undo', onClick: () => dispatch({ t: 'move', key: id, status: back.status, index: back.index }) } })
    }
  }

  const activeIssue = active ? byKey.get(active) : undefined

  return (
    <>
      <TopBar crumbs={<Crumb project={project} page="Board" />} />
      <FilterRow project={project} count={issues.length} extra={sprint && <SprintTag sprint={sprint} />} />
      {!sprint ? (
        <main className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 bg-wash p-8 text-center">
          <p className="text-[15px] font-medium">No sprint is running</p>
          <p className="max-w-[40ch] text-[14px] text-slate">Plan issues into a sprint and start it from the backlog. The board shows the sprint while it runs.</p>
          <Button asChild variant="secondary"><Link to={`/app/${project}/backlog`}>Go to the backlog</Link></Button>
        </main>
      ) : (
      <main className="min-h-0 flex-1 overflow-auto bg-wash scrollbar-thin">
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onStart} onDragOver={onOver} onDragEnd={onEnd} onDragCancel={() => { setActive(null); setCols(fromStore) }}>
          <div className="flex min-h-full snap-x gap-3 p-4 md:gap-4 md:p-6">
            {STATUSES.map(s => <Column key={s.id} status={s.id} keys={cols[s.id]} byKey={byKey} onAdd={() => setCreateOpen(true, project, s.id)} />)}
          </div>
          <DragOverlay dropAnimation={{ duration: 220, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }}>
            {activeIssue && <IssueCard issue={activeIssue} assignee={user(activeIssue.assignee)} comments={state.comments.filter(c => c.issue === activeIssue.key).length} lifted />}
          </DragOverlay>
        </DndContext>
      </main>
      )}
    </>
  )
}
