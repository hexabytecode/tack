import { useEffect, useMemo, useState } from 'react'
import { Navigate, useParams, useSearchParams } from 'react-router-dom'
import {
  DndContext, DragOverlay, KeyboardSensor, PointerSensor, closestCorners, useDroppable, useSensor, useSensors,
  type DragEndEvent, type DragOverEvent, type DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useStore } from '../store'
import { STATUSES, type Issue, type Status } from '../data/mock'
import { TopBar, Crumb } from '../components/AppShell'
import IssueCard from '../components/IssueCard'
import { Avatar, Icon, StatusDot, cx } from '../lib/ui'

type Columns = Record<Status, string[]>

export function useFilteredIssues(project: string | undefined) {
  const { state } = useStore()
  const [params] = useSearchParams()
  const q = (params.get('q') ?? '').toLowerCase()
  const who = params.get('who')
  const type = params.get('type')
  const issues = useMemo(() => state.issues.filter(i =>
    (!project || i.project === project) &&
    (!q || i.title.toLowerCase().includes(q) || i.key.toLowerCase().includes(q)) &&
    (!who || (who === 'none' ? !i.assignee : i.assignee === who)) &&
    (!type || i.type === type)), [state.issues, project, q, who, type])
  return { issues, q, who, type }
}

export function FilterRow({ project, count }: { project: string; count: number }) {
  const { state, user } = useStore()
  const [params, setParams] = useSearchParams()
  const who = params.get('who')
  const type = params.get('type')
  const p = state.projects.find(x => x.key === project)
  const set = (k: string, v: string | null) => setParams(prev => { if (v) prev.set(k, v); else prev.delete(k); return prev }, { replace: true })
  const active = who || type || params.get('q')

  return (
    <div className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-line px-4 md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex items-center -space-x-1" role="group" aria-label="Filter by person">
          {p?.members.slice(0, 6).map(id => {
            const on = who === id
            return (
              <button key={id} onClick={() => set('who', on ? null : id)} title={user(id)?.name} aria-pressed={on}
                className={cx('rounded-full ring-2 transition-transform hover:z-10 hover:-translate-y-0.5', on ? 'z-10 ring-accent' : 'ring-paper')}>
                <Avatar user={user(id)} size={24} />
              </button>
            )
          })}
        </div>
        <span className="h-4 w-px bg-line" />
        <label className="relative">
          <span className="sr-only">Type</span>
          <select value={type ?? ''} onChange={e => set('type', e.target.value || null)}
            className="h-8 appearance-none rounded-[4px] border border-line bg-cloud pl-2.5 pr-7 font-mono text-[11.5px] hover:border-ink focus:outline-2 focus:outline-accent">
            <option value="">All types</option><option value="task">Tasks</option><option value="bug">Bugs</option>
          </select>
          <Icon name="expand_more" className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 !text-[16px] text-slate" />
        </label>
        {active && <button onClick={() => setParams({}, { replace: true })} className="link text-[13px] text-slate hover:text-ink">Clear</button>}
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
      style={{ transform: CSS.Transform.toString(transform), transition }}
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
    <section className={cx('flex w-[85vw] max-w-[320px] shrink-0 snap-start flex-col rounded-[4px] border border-line bg-cloud p-2.5 md:w-auto md:max-w-none md:flex-1 md:shrink', isOver && 'border-slate/40')}>
      <header className="mb-2.5 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <StatusDot status={status} />
          <h2 className="label-mono text-ink">{meta.label}</h2>
          <span className="font-mono text-[12px] text-slate">{keys.length}</span>
        </div>
        {status === 'todo' && <button onClick={onAdd} className="rounded-[4px] p-0.5 text-slate hover:bg-paper hover:text-ink" aria-label="Add issue"><Icon name="add" className="!text-[16px]" /></button>}
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
  const [origin, setOrigin] = useState<Status | null>(null)

  useEffect(() => { if (!active) setCols(fromStore) }, [fromStore, active])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  if (!state.projects.some(p => p.key === project)) return <Navigate to="/app/WEB/board" replace />

  const findCol = (id: string): Status | undefined =>
    (STATUSES.some(s => s.id === id) ? id as Status : (Object.keys(cols) as Status[]).find(s => cols[s].includes(id)))

  const onStart = (e: DragStartEvent) => { setActive(String(e.active.id)); setOrigin(findCol(String(e.active.id)) ?? null) }

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
    if (origin && origin !== col) toast(`${id} → ${STATUSES.find(s => s.id === col)!.label}`)
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
          <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }}>
            {activeIssue && <IssueCard issue={activeIssue} assignee={user(activeIssue.assignee)} lifted />}
          </DragOverlay>
        </DndContext>
      </main>
    </>
  )
}
