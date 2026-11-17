import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useSearchParams } from 'react-router-dom'
import { useStore } from '../store'
import { ME } from '../data/mock'
import { TopBar } from '../components/AppShell'
import { CalendarClock } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { PriorityBadge, StatusPill, TypeBadge, cx, dueLabel } from '@/lib/ui'

export default function MyIssues() {
  const { state } = useStore()
  const [params, setParams] = useSearchParams()
  const [tab, setTab] = useState<'open' | 'done'>('open')
  const q = (params.get('q') ?? '').toLowerCase()
  const mine = state.issues.filter(i => i.assignee === ME && (tab === 'done' ? i.status === 'done' : i.status !== 'done') && (!q || i.title.toLowerCase().includes(q)))
  const openCount = state.issues.filter(i => i.assignee === ME && i.status !== 'done').length

  return (
    <>
      <TopBar crumbs={<span className="font-medium">My issues</span>} />
      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="p-4 md:p-6">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[28px] font-medium leading-tight tracking-[-0.02em]">My issues</h1>
              <Badge variant="secondary" className="label-mono rounded-[4px] text-slate">{openCount} open, assigned to you</Badge>
            </div>
            <Tabs value={tab} onValueChange={v => setTab(v as 'open' | 'done')}>
              <TabsList>
                <TabsTrigger value="open" className="px-4">Open</TabsTrigger>
                <TabsTrigger value="done" className="px-4">Done</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {state.projects.map(p => {
            const rows = mine.filter(i => i.project === p.key).sort((a, b) => (a.due ?? '9999').localeCompare(b.due ?? '9999'))
            if (!rows.length) return null
            return (
              <section key={p.key} className="mt-8">
                <h2 className="label-mono mb-2 flex items-center gap-2 text-slate">{p.name}<Badge variant="secondary" className="h-[18px] rounded-[3px] px-2 font-mono text-[10px] font-normal">{rows.length}</Badge></h2>
                <ul className="border-t border-line">
                  {rows.map(i => {
                    const due = dueLabel(i.due)
                    return (
                      <li key={i.key}>
                        <Button variant="ghost" onClick={() => setParams(prm => { prm.set('issue', i.key); return prm })}
                          className={cx('grid h-auto w-full grid-cols-[72px_1fr_auto] items-center gap-3 rounded-none border-b border-line px-2 py-3 text-left font-normal hover:bg-[#F7F7FA] md:grid-cols-[80px_1fr_150px_120px_90px]', state.flash === i.key && 'flash')}>
                          <span className="font-mono text-[12.5px] text-slate">{i.key}</span>
                          <span className={cx('truncate text-[14px]', i.status === 'done' && 'text-slate')}>{i.title}</span>
                          <span className="hidden md:block"><StatusPill status={i.status} size="sm" /></span>
                          <span className="hidden gap-2 md:flex"><TypeBadge type={i.type} compact /><PriorityBadge priority={i.priority} /></span>
                          <span className={cx('inline-flex items-center justify-end gap-1 font-mono text-[12.5px]', due?.overdue && i.status !== 'done' ? 'text-[#B42318]' : 'text-slate')}>{due && <CalendarClock className="size-3" />}{due?.text ?? '—'}</span>
                        </Button>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )
          })}
          {mine.length === 0 && <p className="py-16 text-center text-[14px] text-slate">{tab === 'open' ? 'Nothing assigned to you. Enjoy it.' : 'Nothing finished yet.'}</p>}
        </div>
      </main>
    </>
  )
}
