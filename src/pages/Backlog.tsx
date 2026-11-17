import { useEffect, useMemo, useState } from 'react'
import { Navigate, useParams, useSearchParams } from 'react-router-dom'
import {
  DndContext, DragOverlay, KeyboardSensor, PointerSensor, closestCorners, useDroppable, useSensor, useSensors,
  type DragEndEvent, type DragOverEvent, type DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ArrowUpRight, CalendarDays, CheckCircle2, ChevronDown, GripVertical, ListPlus, MoreVertical, Play, Plus } from 'lucide-react'
import { useStore } from '../store'
import { STATUSES, type Issue, type Sprint, type Status } from '../data/mock'
import { TopBar, Crumb } from '../components/AppShell'
import { FilterRow, daysLeft, useFilteredIssues } from './Board'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import DatePicker from '../components/DatePicker'
import { Avatar, PriorityBadge, StatusPill, TypeBadge, cx } from '@/lib/ui'

/* Backlog (Stitch, Gate 1 round 3): the running sprint's progress on top, then each sprint
   and the backlog as lists you can drag issues between. */

const BACKLOG = 'backlog'
type Lists = Record<string, string[]>
const pts = (list: Issue[]) => list.reduce((n, i) => n + (i.points ?? 0), 0)
const day = (d: string | null) => d ? new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''
const iso = (t: number) => new Date(t).toISOString().slice(0, 10)
const STATUS_BAR: Record<Status, string> = { done: 'bg-success', progress: 'bg-brand', review: 'bg-warning', todo: 'bg-slate/40' }

function Remaining({ end }: { end: string | null }) {
  const left = daysLeft(end)
  if (left === null) return null
  return <span className={cx('font-medium', left < 0 ? 'text-destructive' : 'text-brand')}>{left < 0 ? `${-left} days over` : left === 0 ? 'ends today' : `${left} days remaining`}</span>
}

function Row({ issue, picked, onPick }: { issue: Issue; picked: boolean; onPick: () => void }) {
  const { user } = useStore()
  const [, setParams] = useSearchParams()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: issue.key })
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cx('group flex h-[42px] items-center justify-between gap-3 bg-paper px-3 transition-colors hover:bg-wash md:px-4', isDragging && 'opacity-40', picked && 'bg-tint/60')}>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Button type="button" variant="ghost" size="icon-xs" className="hidden size-5 cursor-grab touch-none text-placeholder hover:bg-transparent group-hover:text-slate active:cursor-grabbing sm:inline-flex" aria-label={`Drag ${issue.key}`} {...attributes} {...listeners}>
          <GripVertical className="size-4" />
        </Button>
        <Checkbox checked={picked} onCheckedChange={onPick} aria-label={`Select ${issue.key}`} className="data-[state=checked]:border-brand data-[state=checked]:bg-brand" />
        <span className="w-[62px] shrink-0 font-mono text-[11px] text-slate">{issue.key}</span>
        <span className="hidden sm:inline-flex"><TypeBadge type={issue.type} compact /></span>
        <Button type="button" variant="link" onClick={() => setParams(p => { p.set('issue', issue.key); return p })}
          className={cx('block h-auto min-w-0 shrink truncate p-0 text-left text-[13px] font-medium text-ink hover:text-brand hover:no-underline', issue.status === 'done' && 'text-slate')}>{issue.title}</Button>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="hidden w-[104px] md:block"><StatusPill status={issue.status} size="sm" /></span>
        <span className="hidden sm:block"><PriorityBadge priority={issue.priority} compact /></span>
        <span className="w-6 text-right font-mono text-[12.5px] text-slate" title="Story points">{issue.points ?? '–'}</span>
        <Avatar user={user(issue.assignee)} size={22} />
      </div>
    </div>
  )
}

function Section({ id, keys, byKey, picked, onPick, header, goal, footer }: {
  id: string; keys: string[]; byKey: Map<string, Issue>; picked: Set<string>; onPick: (k: string) => void
  header: React.ReactNode; goal?: React.ReactNode; footer: React.ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({ id })
  const [open, setOpen] = useState(true)
  return (
    <section className={cx('overflow-hidden rounded-[6px] border bg-paper transition-colors', isOver ? 'border-brand/50' : 'border-line')}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-cloud/50 px-3 py-3 md:px-4">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <Button type="button" variant="ghost" size="icon-xs" onClick={() => setOpen(o => !o)} aria-expanded={open} aria-label={open ? 'Collapse' : 'Expand'} className="rounded-[3px] text-slate hover:text-ink">
            <ChevronDown className={cx('size-4 transition-transform', !open && '-rotate-90')} />
          </Button>
          {header}
        </div>
      </div>
      {open && (<>
        {goal}
        <SortableContext id={id} items={keys} strategy={verticalListSortingStrategy}>
          <div ref={setNodeRef} className="divide-y divide-line/60">
            {keys.map(k => byKey.get(k) && <Row key={k} issue={byKey.get(k)!} picked={picked.has(k)} onPick={() => onPick(k)} />)}
            {keys.length === 0 && <div className="flex h-12 items-center justify-center font-mono text-[11px] text-slate">Drag issues here</div>}
          </div>
        </SortableContext>
        {footer}
      </>)}
    </section>
  )
}

function Goal({ sprint }: { sprint: Sprint }) {
  const { dispatch } = useStore()
  const [v, setV] = useState(sprint.goal)
  useEffect(() => setV(sprint.goal), [sprint.goal])
  return (
    <div className="flex items-center gap-2 border-b border-line/70 bg-paper px-4 py-2 text-[13px]">
      <Label htmlFor={`goal-${sprint.id}`} className="label-mono shrink-0 text-slate">Goal</Label>
      <Input id={`goal-${sprint.id}`} value={v} onChange={e => setV(e.target.value)} onBlur={() => v !== sprint.goal && dispatch({ t: 'sprintUpdate', id: sprint.id, patch: { goal: v.trim() } })}
        onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
        placeholder="What should this sprint achieve?" className="h-7 min-w-0 flex-1 border-transparent bg-transparent px-2 text-[13px] shadow-none hover:border-line focus-visible:border-line focus-visible:ring-0" />
    </div>
  )
}

function SprintDialog({ sprint, mode, onClose }: { sprint: Sprint | null; mode: 'start' | 'edit'; onClose: () => void }) {
  const { dispatch, toast } = useStore()
  const [name, setName] = useState('')
  const [start, setStart] = useState(iso(Date.now()))
  const [weeks, setWeeks] = useState('2')
  const [goal, setGoal] = useState('')
  useEffect(() => {
    if (!sprint) return
    setName(sprint.name); setGoal(sprint.goal); setStart(sprint.start ?? iso(Date.now()))
    if (sprint.start && sprint.end) setWeeks(String(Math.max(1, Math.round((new Date(sprint.end).getTime() - new Date(sprint.start).getTime()) / (7 * 86400000)))))
  }, [sprint])
  const end = iso(new Date(start + 'T12:00:00').getTime() + Number(weeks) * 7 * 86400000 - 86400000)
  const submit = () => {
    if (!sprint) return
    const patch = { name: name.trim() || sprint.name, start, end, goal: goal.trim() }
    if (mode === 'start') { dispatch({ t: 'sprintStart', id: sprint.id, patch }); toast(`${patch.name} started`, { kind: 'create', description: `Runs ${day(start)} – ${day(end)}` }) }
    else dispatch({ t: 'sprintUpdate', id: sprint.id, patch })
    onClose()
  }
  return (
    <Dialog open={!!sprint} onOpenChange={o => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>{mode === 'start' ? `Start ${sprint?.name}` : `Edit ${sprint?.name}`}</DialogTitle>
          <DialogDescription>{mode === 'start' ? 'The board will show this sprint until you complete it.' : 'Change the name, dates or goal.'}</DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={e => { e.preventDefault(); submit() }}>
          <div className="flex flex-col gap-2"><Label htmlFor="sprint-name">Name</Label><Input id="sprint-name" value={name} onChange={e => setName(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2"><Label htmlFor="sprint-start">Starts</Label><DatePicker id="sprint-start" value={start} onChange={v => setStart(v ?? iso(Date.now()))} placeholder="Start date" className="h-9 w-full" /></div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="sprint-length">Length</Label>
              <Select value={weeks} onValueChange={setWeeks}>
                <SelectTrigger id="sprint-length" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{['1', '2', '3', '4'].map(w => <SelectItem key={w} value={w}>{w} {w === '1' ? 'week' : 'weeks'}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <p className="-mt-2 font-mono text-[11px] text-slate">Ends {day(end)}</p>
          <div className="flex flex-col gap-2"><Label htmlFor="sprint-goal">Goal</Label><Textarea id="sprint-goal" value={goal} onChange={e => setGoal(e.target.value)} rows={2} placeholder="What should this sprint achieve?" /></div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit">{mode === 'start' ? <><Play />Start sprint</> : 'Save'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function CompleteDialog({ sprint, onClose }: { sprint: Sprint | null; onClose: () => void }) {
  const { state, dispatch, toast } = useStore()
  const items = sprint ? state.issues.filter(i => i.sprint === sprint.id) : []
  const done = items.filter(i => i.status === 'done')
  const open = items.filter(i => i.status !== 'done')
  const planned = sprint ? state.sprints.filter(x => x.project === sprint.project && x.state === 'planned') : []
  const [to, setTo] = useState<string>(BACKLOG)
  useEffect(() => { setTo(planned[0]?.id ?? BACKLOG) }, [sprint]) // eslint-disable-line react-hooks/exhaustive-deps
  const submit = () => {
    if (!sprint) return
    dispatch({ t: 'sprintComplete', id: sprint.id, moveTo: to === BACKLOG ? null : to })
    const where = to === BACKLOG ? 'the backlog' : planned.find(x => x.id === to)?.name
    toast(`${sprint.name} completed`, { kind: 'create', status: 'done', description: `${done.length} done${open.length ? ` · ${open.length} moved to ${where}` : ''}` })
    onClose()
  }
  return (
    <Dialog open={!!sprint} onOpenChange={o => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Complete {sprint?.name}</DialogTitle>
          <DialogDescription>{done.length} done ({pts(done)} pts), {open.length} still open ({pts(open)} pts).</DialogDescription>
        </DialogHeader>
        {open.length > 0 && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="complete-to">Move the open issues to</Label>
            <Select value={to} onValueChange={setTo}>
              <SelectTrigger id="complete-to" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {planned.map(x => <SelectItem key={x.id} value={x.id}>{x.name}</SelectItem>)}
                <SelectItem value={BACKLOG}>Backlog</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}><CheckCircle2 />Complete sprint</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function Backlog() {
  const { project = 'WEB' } = useParams()
  const { state, dispatch, user, setCreateOpen, toast } = useStore()
  const { issues } = useFilteredIssues(project)
  const byKey = useMemo(() => new Map(state.issues.map(i => [i.key, i])), [state.issues])
  const sprints = useMemo(() => state.sprints.filter(x => x.project === project && x.state !== 'closed')
    .sort((a, b) => (a.state === 'active' ? 0 : 1) - (b.state === 'active' ? 0 : 1) || Number(a.name.match(/\d+/)?.[0]) - Number(b.name.match(/\d+/)?.[0])), [state.sprints, project])
  const active = sprints.find(x => x.state === 'active')
  const containers = useMemo(() => [...sprints.map(x => x.id), BACKLOG], [sprints])
  const fromStore = useMemo<Lists>(() => {
    const out: Lists = Object.fromEntries(containers.map(c => [c, []]))
    for (const i of [...issues].sort((a, b) => a.rank - b.rank)) {
      const c = i.sprint ?? BACKLOG
      if (out[c]) out[c].push(i.key)
    }
    return out
  }, [issues, containers])
  const [lists, setLists] = useState<Lists>(fromStore)
  const [dragging, setDragging] = useState<string | null>(null)
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [starting, setStarting] = useState<{ sprint: Sprint; mode: 'start' | 'edit' } | null>(null)
  const [completing, setCompleting] = useState<Sprint | null>(null)
  useEffect(() => { if (!dragging) setLists(fromStore) }, [fromStore, dragging])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  if (!state.projects.some(p => p.key === project)) return <Navigate to="/app/WEB/backlog" replace />

  const findList = (id: string) => containers.includes(id) ? id : containers.find(c => lists[c]?.includes(id))
  const onStart = (e: DragStartEvent) => setDragging(String(e.active.id))
  const onOver = ({ active: a, over }: DragOverEvent) => {
    if (!over) return
    const from = findList(String(a.id)); const to = findList(String(over.id))
    if (!from || !to || from === to) return
    setLists(l => {
      const target = l[to]; const at = target.indexOf(String(over.id))
      const i = at < 0 ? target.length : at
      return { ...l, [from]: l[from].filter(k => k !== a.id), [to]: [...target.slice(0, i), String(a.id), ...target.slice(i)] }
    })
  }
  const onEnd = ({ active: a, over }: DragEndEvent) => {
    const id = String(a.id)
    const c = findList(id)
    setDragging(null)
    if (!c || !over) { setLists(fromStore); return }
    let list = lists[c]
    const overIndex = list.indexOf(String(over.id)); const from = list.indexOf(id)
    if (overIndex >= 0 && overIndex !== from) list = arrayMove(list, from, overIndex)
    const sprint = c === BACKLOG ? null : c
    const next = list[list.indexOf(id) + 1]
    const full = state.issues.filter(i => i.project === project && i.sprint === sprint && i.key !== id).sort((x, y) => x.rank - y.rank)
    const index = next ? full.findIndex(i => i.key === next) : full.length
    const before = byKey.get(id)?.sprint ?? null
    setLists(l => ({ ...l, [c]: list }))
    dispatch({ t: 'plan', key: id, sprint, index: index < 0 ? full.length : index })
    if (before !== sprint) toast(`${id} moved`, { kind: 'info', description: `To ${sprint ? sprints.find(x => x.id === sprint)?.name : 'the backlog'}` })
  }

  const toggle = (k: string) => setPicked(p => { const n = new Set(p); if (n.has(k)) n.delete(k); else n.add(k); return n })
  const moveSelected = (from: string, to: string | null) => {
    const keys = lists[from].filter(k => picked.has(k))
    keys.forEach(k => dispatch({ t: 'plan', key: k, sprint: to, index: 1e6 }))
    setPicked(p => { const n = new Set(p); keys.forEach(k => n.delete(k)); return n })
    toast(`${keys.length} ${keys.length === 1 ? 'issue' : 'issues'} moved`, { kind: 'info', description: `To ${to ? sprints.find(x => x.id === to)?.name : 'the backlog'}` })
  }

  const all = (id: string) => state.issues.filter(i => i.project === project && (id === BACKLOG ? i.sprint === null : i.sprint === id))
  const activeItems = active ? all(active.id) : []
  const total = pts(activeItems)
  const donePts = pts(activeItems.filter(i => i.status === 'done'))
  const pct = total ? Math.round((donePts / total) * 100) : 0
  const backlogCount = all(BACKLOG).filter(i => i.status !== 'done').length

  const MoveMenu = ({ from }: { from: string }) => {
    const n = lists[from].filter(k => picked.has(k)).length
    if (!n) return null
    const targets = [...sprints.filter(x => x.id !== from).map(x => ({ id: x.id as string | null, name: x.name })), ...(from === BACKLOG ? [] : [{ id: null, name: 'Backlog' }])]
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button size="sm" variant="secondary"><ArrowUpRight />Move {n} to…</Button></DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel className="label-mono text-slate">Move to</DropdownMenuLabel>
          {targets.map(t => <DropdownMenuItem key={t.id ?? BACKLOG} onSelect={() => moveSelected(from, t.id)}>{t.name}</DropdownMenuItem>)}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  const sprintHeader = (x: Sprint) => {
    const items = all(x.id)
    const count = (s: Status) => items.filter(i => i.status === s).length
    return (
      <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <span className="text-[15px] font-semibold">{x.name}</span>
          <Badge variant={x.state === 'active' ? 'default' : 'outline'} className={cx('h-[18px] rounded-[3px] px-2 font-mono text-[10px] uppercase tracking-wider', x.state === 'active' ? 'border-brand bg-brand text-paper' : 'bg-paper text-slate')}>{x.state === 'active' ? 'Active' : 'Planned'}</Badge>
          <span className="hidden text-line sm:inline">|</span>
          {x.start ? (
            <Button type="button" variant="ghost" size="xs" onClick={() => setStarting({ sprint: x, mode: 'edit' })} className="gap-2 px-1 font-mono text-[11px] font-normal text-slate hover:text-ink has-[>svg]:px-1">
              <CalendarDays className="size-3.5" />{day(x.start)} – {day(x.end)}{x.state === 'active' && <> · <Remaining end={x.end} /></>}
            </Button>
          ) : (
            <Button type="button" variant="ghost" size="xs" onClick={() => setStarting({ sprint: x, mode: 'edit' })} className="gap-2 px-1 font-mono text-[11px] font-normal text-slate underline decoration-dotted underline-offset-2 hover:text-ink has-[>svg]:px-1">
              <CalendarDays className="size-3.5" />Set dates
            </Button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {x.state === 'active' && (
            <span className="hidden items-center gap-3 font-mono text-[11px] text-slate lg:flex">
              {STATUSES.filter(s => s.id !== 'done').map(s => <span key={s.id} className="flex items-center gap-2"><span className={cx('size-2 rounded-full', STATUS_BAR[s.id])} />{count(s.id)} {s.label}</span>)}
            </span>
          )}
          <Badge variant="outline" className="h-[20px] rounded-[3px] bg-paper px-2 font-mono text-[11px]">{items.length} issues · {pts(items)} pts</Badge>
          <MoveMenu from={x.id} />
          {x.state === 'active'
            ? <Button size="sm" variant="secondary" onClick={() => setCompleting(x)}>Complete</Button>
            : <Button size="sm" disabled={!!active} title={active ? `Complete ${active.name} first` : undefined} onClick={() => setStarting({ sprint: x, mode: 'start' })}><Play />Start {x.name}</Button>}
        </div>
      </div>
    )
  }

  const addRow = (label: string, sprint: string | null) => (
    <Button type="button" variant="ghost" onClick={() => setCreateOpen(true, project, 'todo', sprint)}
      className="h-9 w-full justify-start gap-2 rounded-none border-t border-line/60 bg-cloud/30 px-4 font-mono text-[11px] font-normal text-slate hover:bg-tint/50 hover:text-brand has-[>svg]:px-4">
      <Plus className="size-3.5" />{label}
    </Button>
  )

  const dragIssue = dragging ? byKey.get(dragging) : undefined

  return (
    <>
      <TopBar crumbs={<Crumb project={project} page="Backlog" />}
        actions={<Button variant="secondary" className="hidden md:inline-flex" onClick={() => { dispatch({ t: 'sprintCreate', project }); toast('Sprint created', { kind: 'create', description: 'Plan issues into it, then start it' }) }}><ListPlus />New sprint</Button>} />
      <FilterRow project={project} count={issues.length} />
      <main className="min-h-0 flex-1 overflow-y-auto bg-wash scrollbar-thin">
        <div className="flex flex-col gap-5 p-4 md:p-6">
          {active && (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-[6px] border border-line bg-paper p-4">
              <div className="flex items-center gap-3">
                <Badge className="size-9 justify-center rounded-[6px] border-brand bg-brand p-0 font-mono text-[11px] text-paper">S{active.name.match(/\d+/)?.[0]}</Badge>
                <div>
                  <div className="flex flex-wrap items-center gap-2"><span className="text-[15px] font-semibold">{active.name}</span><StatusPill status="progress" size="sm" /></div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 font-mono text-[11px] text-slate">{day(active.start)} – {day(active.end)}<span>·</span><Remaining end={active.end} /></div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-5">
                <div className="flex w-56 flex-col gap-1">
                  <div className="flex justify-between font-mono text-[11px]"><span className="text-slate">Progress: {donePts} / {total} pts</span><span className="font-medium">{pct}%</span></div>
                  <div className="flex h-2 w-full overflow-hidden rounded-full bg-cloud" role="img" aria-label={`${pct}% of points done`}>
                    {(['done', 'review', 'progress', 'todo'] as Status[]).map(s => {
                      const p = pts(activeItems.filter(i => i.status === s))
                      return p ? <div key={s} className={cx('h-full', STATUS_BAR[s])} style={{ width: `${(p / total) * 100}%` }} title={`${STATUSES.find(x => x.id === s)?.label}: ${p} pts`} /> : null
                    })}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={() => setCompleting(active)}><CheckCircle2 />Complete sprint</Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button size="icon" variant="secondary" aria-label="Sprint options"><MoreVertical /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => setStarting({ sprint: active, mode: 'edit' })}>Edit sprint</DropdownMenuItem></DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          )}

          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onStart} onDragOver={onOver} onDragEnd={onEnd} onDragCancel={() => { setDragging(null); setLists(fromStore) }}>
            {sprints.map(x => (
              <Section key={x.id} id={x.id} keys={lists[x.id] ?? []} byKey={byKey} picked={picked} onPick={toggle}
                header={sprintHeader(x)} goal={<Goal sprint={x} />} footer={addRow(`Add issue to ${x.name} or drag items here`, x.id)} />
            ))}
            <Section id={BACKLOG} keys={lists[BACKLOG] ?? []} byKey={byKey} picked={picked} onPick={toggle}
              header={
                <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-[15px] font-semibold">Backlog</span>
                    <Badge variant="outline" className="h-[20px] rounded-[3px] bg-paper px-2 font-mono text-[11px] font-normal text-slate">{backlogCount} issues</Badge>
                    <span className="hidden text-line sm:inline">|</span>
                    <span className="font-mono text-[11px] text-slate">Estimate: {pts(all(BACKLOG).filter(i => i.status !== 'done'))} pts</span>
                  </div>
                  <MoveMenu from={BACKLOG} />
                </div>
              }
              footer={addRow('Create issue in the backlog', null)} />
            <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }}>
              {dragIssue && (
                <div className="flex h-[42px] items-center gap-3 rounded-[4px] border border-ink bg-paper px-4 shadow-[0_12px_28px_-8px_rgba(0,0,0,.25)]">
                  <span className="font-mono text-[11px] text-slate">{dragIssue.key}</span>
                  <span className="truncate text-[13px] font-medium">{dragIssue.title}</span>
                  <span className="ml-auto"><Avatar user={user(dragIssue.assignee)} size={22} /></span>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </div>
      </main>
      <SprintDialog sprint={starting?.sprint ?? null} mode={starting?.mode ?? 'start'} onClose={() => setStarting(null)} />
      <CompleteDialog sprint={completing} onClose={() => setCompleting(null)} />
    </>
  )
}
