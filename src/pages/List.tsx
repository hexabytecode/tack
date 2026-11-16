import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Navigate, useParams, useSearchParams } from 'react-router-dom'
import { useStore } from '../store'
import { STATUSES, type Issue } from '../data/mock'
import { TopBar, Crumb } from '../components/AppShell'
import { FilterRow, useFilteredIssues } from './Board'
import { ArrowDown } from 'lucide-react'
import { Avatar, IssueChips, StatusPill, cx, dueLabel, timeAgo } from '@/lib/ui'

type SortKey = 'updated' | 'status' | 'priority' | 'due'
const rank = { status: Object.fromEntries(STATUSES.map((s, n) => [s.id, n])), priority: { high: 0, medium: 1, low: 2 } } as const

function sorter(key: SortKey) {
  return (a: Issue, b: Issue) => {
    if (key === 'updated') return b.updatedAt - a.updatedAt
    if (key === 'status') return rank.status[a.status] - rank.status[b.status] || b.updatedAt - a.updatedAt
    if (key === 'priority') return rank.priority[a.priority] - rank.priority[b.priority] || b.updatedAt - a.updatedAt
    return (a.due ?? '9999').localeCompare(b.due ?? '9999')
  }
}

export default function List() {
  const { project = 'WEB' } = useParams()
  const { state, user } = useStore()
  const { issues } = useFilteredIssues(project)
  const [, setParams] = useSearchParams()
  const [sort, setSort] = useState<SortKey>('updated')

  if (!state.projects.some(p => p.key === project)) return <Navigate to="/app/WEB/list" replace />
  const rows = [...issues].sort(sorter(sort))
  const open = (key: string) => setParams(p => { p.set('issue', key); return p })

  const Th = ({ k, children, className }: { k?: SortKey; children: string; className?: string }) => (
    <TableHead className={cx('label-mono h-9 px-3 font-medium text-slate', className)}>
      {k ? (
        <Button variant="ghost" size="xs" onClick={() => setSort(k)} className={cx('-mx-1 h-6 gap-1 px-1 font-mono text-[11px] uppercase tracking-[0.08em] text-slate hover:bg-transparent hover:text-ink', sort === k && 'text-ink')}>
          {children}{sort === k && <ArrowDown className="size-3" />}
        </Button>
      ) : children}
    </TableHead>
  )

  return (
    <>
      <TopBar crumbs={<Crumb project={project} page="List" />} />
      <FilterRow project={project} count={issues.length} />
      <main className="min-h-0 flex-1 overflow-auto scrollbar-thin">
        <Table className="hidden md:table">
          <TableHeader className="sticky top-0 z-10 bg-[#F6F6F9]">
            <TableRow className="border-line hover:bg-transparent">
              <Th className="pl-6">Key</Th><Th>Title</Th><Th k="status">Status</Th><Th k="priority">Type · priority</Th>
              <Th>Assignee</Th><Th k="due">Due</Th><Th k="updated" className="pr-6">Updated</Th>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(i => {
              const due = dueLabel(i.due)
              const a = user(i.assignee)
              return (
                <TableRow key={i.key} onClick={() => open(i.key)} className={cx('h-11 cursor-pointer border-line hover:bg-[#F7F7FA]', state.flash === i.key && 'flash')}>
                  <TableCell className="pl-6 pr-3 font-mono text-[12px] text-slate">{i.key}</TableCell>
                  <TableCell className="max-w-[420px] px-3"><Button variant="link" className="block h-auto w-full shrink truncate p-0 text-left text-[13.5px] font-medium text-ink hover:no-underline" onClick={e => { e.stopPropagation(); open(i.key) }}>{i.title}</Button></TableCell>
                  <TableCell className="px-3"><StatusPill status={i.status} size="sm" /></TableCell>
                  <TableCell className="px-3"><span className="flex gap-1.5"><IssueChips issue={i} /></span></TableCell>
                  <TableCell className="px-3"><span className="flex items-center gap-2 text-[13px]"><Avatar user={a} />{a?.name.split(' ')[0] ?? <span className="text-slate">—</span>}</span></TableCell>
                  <TableCell className={cx('px-3 font-mono text-[12px]', due?.overdue && i.status !== 'done' ? 'text-warning' : 'text-slate')}>{due?.text ?? '—'}</TableCell>
                  <TableCell className="pl-3 pr-6 font-mono text-[12px] text-slate">{timeAgo(i.updatedAt)}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        <ul className="md:hidden">
          {rows.map(i => (
            <li key={i.key} className="border-b border-line">
              <Button variant="ghost" onClick={() => open(i.key)} className="h-auto w-full flex-col items-stretch gap-2 whitespace-normal rounded-none px-4 py-3 text-left font-normal">
                <span className="text-[14px] font-medium leading-snug">{i.title}</span>
                <span className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><span className="font-mono text-[11.5px] text-slate">{i.key}</span><StatusPill status={i.status} size="sm" /></span>
                  <Avatar user={user(i.assignee)} />
                </span>
              </Button>
            </li>
          ))}
        </ul>
        {rows.length === 0 && <p className="p-10 text-center text-[13.5px] text-slate">No issues match these filters.</p>}
      </main>
    </>
  )
}
