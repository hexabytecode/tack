import { useEffect, useMemo, useState } from 'react'
import { Navigate, useParams, useSearchParams } from 'react-router-dom'
import {
  DndContext, DragOverlay, KeyboardSensor, PointerSensor, closestCorners, useDroppable, useSensor, useSensors,
  type DragEndEvent, type DragOverEvent, type DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Filter, Plus, X } from 'lucide-react'
import { useStore } from '../store'
import { STATUSES, type Issue, type Status } from '../data/mock'
import { TopBar, Crumb } from '../components/AppShell'
import IssueCard from '../components/IssueCard'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Avatar, PRIORITY_META, StatusPill, TYPE_META, cx } from '@/lib/ui'

type Columns = Record<Status, string[]>

export function useFilteredIssues(project: string | undefined) {
  const { state } = useStore()
  const [params] = useSearchParams()
  const q = (params.get('q') ?? '').toLowerCase()
  const who = params.get('who')
  const type = params.get('type')
  const prio = params.get('prio')
  const issues = useMemo(() => state.issues.filter(i =>
    (!project || i.project === project) &&
    (!q || i.title.toLowerCase().includes(q) || i.key.toLowerCase().includes(q)) &&
    (!who || i.assignee === who) &&
    (!type || i.type === type) &&
    (!prio || i.priority === prio)), [state.issues, project, q, who, type, prio])
  return { issues, q, who, type }
}

export function FilterRow({ project, count }: { project: string; count: number }) {
  const { state, user } = useStore()
  const [params, setParams] = useSearchParams()
  const who = params.get('who')
  const type = params.get('type') ?? 'all'
  const prio = params.get('prio') ?? 'all'
  const p = state.projects.find(x => x.key === project)
  const set = (k: string, v: string | null) => setParams(prev => { if (v && v !== 'all') prev.set(k, v); else prev.delete(k); return prev }, { replace: true })
  const active = who || params.get('type') || params.get('prio') || params.get('q')

  return (
    <div className="flex min-h-12 shrink-0 flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-2 md:px-6">
      <div className="flex min-w-0 flex-wrap items-center gap-2.5">
        <div className="flex items-center -space-x-1" role="group" aria-label="Filter by person">
          {p?.members.slice(0, 6).map(id => {
            const on = who === id
            return (
              <Tooltip key={id}>
                <TooltipTrigger asChild>
                  <button onClick={() => set('who', on ? null : id)} aria-pressed={on} aria-label={`Only ${user(id)?.name}`}
                    className={cx('rounded-full ring-2 transition-transform hover:z-10 hover:-translate-y-0.5', on ? 'z-10 ring-brand' : 'ring-paper')}>
                    <Avatar user={user(id)} size={24} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{user(id)?.name}</TooltipContent>
              </Tooltip>
            )
          })}
        </div>
        <span className="hidden h-4 w-px bg-line sm:block" />
        <Select value={type} onValueChange={v => set('type', v)}>
          <SelectTrigger size="sm" className="h-8 gap-1.5 text-[12.5px]" aria-label="Type"><Filter className="size-3.5 text-slate" /><SelectValue /></SelectTrigger>
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
      <span className="label-mono shrink-0 text-slate">{count} issues</span>
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
    <section className={cx('flex w-[85vw] max-w-[320px] shrink-0 snap-start flex-col rounded-[4px] border bg-cloud p-2.5 transition-colors md:w-auto md:max-w-none md:flex-1 md:shrink', isOver ? 'border-slate/50 bg-[#E8E8EE]' : 'border-line')}>
      <header className="mb-2.5 flex items-center justify-between px-1">
        <h2 className="flex items-center gap-2">
          <StatusPill status={status} />
          <span className="font-mono text-[12px] text-slate">{keys.length}</span>
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

export default function Board() {
  const { project = 'WEB' } = useParams()
  const { state, dispatch, user, setCreateOpen, toast } = useStore()
  const { issues } = useFilteredIssues(project)
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
      <FilterRow project={project} count={issues.length} />
      <main className="min-h-0 flex-1 overflow-auto bg-wash scrollbar-thin">
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onStart} onDragOver={onOver} onDragEnd={onEnd} onDragCancel={() => { setActive(null); setCols(fromStore) }}>
          <div className="flex min-h-full snap-x gap-3 p-4 md:gap-4 md:p-6">
            {STATUSES.map(s => <Column key={s.id} status={s.id} keys={cols[s.id]} byKey={byKey} onAdd={() => setCreateOpen(true, project)} />)}
          </div>
          <DragOverlay dropAnimation={{ duration: 220, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }}>
            {activeIssue && <IssueCard issue={activeIssue} assignee={user(activeIssue.assignee)} comments={state.comments.filter(c => c.issue === activeIssue.key).length} lifted />}
          </DragOverlay>
        </DndContext>
      </main>
    </>
  )
}
