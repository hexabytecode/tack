import { useState } from 'react'
import { Navigate, useParams, useSearchParams } from 'react-router-dom'
import { useStore } from '../store'
import { STATUSES, type Issue } from '../data/mock'
import { TopBar, Crumb } from '../components/AppShell'
import { FilterRow, useFilteredIssues } from './Board'
import { Avatar, IssueChips, Icon, StatusLabel, cx, dueLabel, timeAgo } from '../lib/ui'

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
    <th className={cx('label-mono h-9 whitespace-nowrap px-3 text-left font-medium text-slate', className)}>
      {k ? (
        <button onClick={() => setSort(k)} className={cx('inline-flex items-center gap-1 uppercase hover:text-ink', sort === k && 'text-ink')}>
          {children}{sort === k && <Icon name="arrow_downward" className="!text-[13px]" />}
        </button>
      ) : children}
    </th>
  )

  return (
    <>
      <TopBar crumbs={<Crumb project={project} page="List" />} />
      <FilterRow project={project} count={issues.length} />
      <main className="min-h-0 flex-1 overflow-auto scrollbar-thin">
        <table className="hidden w-full border-collapse md:table">
          <thead className="sticky top-0 z-10 border-b border-line bg-[#F6F6F9]">
            <tr>
              <Th className="pl-6">Key</Th><Th>Title</Th><Th k="status">Status</Th><Th k="priority">Type · priority</Th>
              <Th>Assignee</Th><Th k="due">Due</Th><Th k="updated" className="pr-6">Updated</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map(i => {
              const due = dueLabel(i.due)
              const a = user(i.assignee)
              return (
                <tr key={i.key} onClick={() => open(i.key)} className={cx('h-11 cursor-pointer border-b border-line transition-colors hover:bg-[#F7F7FA]', state.flash === i.key && 'flash')}>
                  <td className="whitespace-nowrap pl-6 pr-3 font-mono text-[12px] text-slate">{i.key}</td>
                  <td className="max-w-[420px] px-3"><button className="block w-full truncate text-left text-[13.5px] font-medium" onClick={e => { e.stopPropagation(); open(i.key) }}>{i.title}</button></td>
                  <td className="whitespace-nowrap px-3"><StatusLabel status={i.status} /></td>
                  <td className="whitespace-nowrap px-3"><span className="flex gap-1.5"><IssueChips issue={i} /></span></td>
                  <td className="whitespace-nowrap px-3"><span className="flex items-center gap-2 text-[13px]"><Avatar user={a} />{a?.name.split(' ')[0] ?? <span className="text-slate">—</span>}</span></td>
                  <td className={cx('whitespace-nowrap px-3 font-mono text-[12px]', due?.overdue && i.status !== 'done' ? 'text-warning' : 'text-slate')}>{due?.text ?? '—'}</td>
                  <td className="whitespace-nowrap pl-3 pr-6 font-mono text-[12px] text-slate">{timeAgo(i.updatedAt)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <ul className="md:hidden">
          {rows.map(i => (
            <li key={i.key} className="border-b border-line">
              <button onClick={() => open(i.key)} className="flex w-full flex-col gap-2 px-4 py-3 text-left">
                <span className="text-[14px] font-medium leading-snug">{i.title}</span>
                <span className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><span className="font-mono text-[11.5px] text-slate">{i.key}</span><StatusLabel status={i.status} /></span>
                  <Avatar user={user(i.assignee)} />
                </span>
              </button>
            </li>
          ))}
        </ul>
        {rows.length === 0 && <p className="p-10 text-center text-[13.5px] text-slate">No issues match these filters.</p>}
      </main>
    </>
  )
}
