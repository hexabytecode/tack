import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useStore } from '../store'
import { ME } from '../data/mock'
import { TopBar } from '../components/AppShell'
import { Chip, StatusLabel, cx, dueLabel, priorityLabel } from '../lib/ui'

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
        <div className="mx-auto max-w-[1040px] px-4 py-8 md:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[28px] font-medium leading-tight tracking-[-0.02em]">My issues</h1>
              <span className="label-mono rounded-[3px] bg-cloud px-2 py-1 text-slate">{openCount} open, assigned to you</span>
            </div>
            <div className="flex rounded-[4px] border border-line p-0.5" role="tablist">
              {(['open', 'done'] as const).map(t => (
                <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
                  className={cx('rounded-[2px] px-4 py-1.5 text-[13px] capitalize transition-colors', tab === t ? 'bg-ink text-paper' : 'text-slate hover:text-ink')}>{t}</button>
              ))}
            </div>
          </div>

          {state.projects.map(p => {
            const rows = mine.filter(i => i.project === p.key).sort((a, b) => (a.due ?? '9999').localeCompare(b.due ?? '9999'))
            if (!rows.length) return null
            return (
              <section key={p.key} className="mt-8">
                <h2 className="label-mono mb-2 flex items-center gap-2 text-slate">{p.name}<span className="rounded-[3px] bg-cloud px-1.5 py-0.5 text-[10px]">{rows.length}</span></h2>
                <ul className="border-t border-line">
                  {rows.map(i => {
                    const due = dueLabel(i.due)
                    return (
                      <li key={i.key}>
                        <button onClick={() => setParams(prm => { prm.set('issue', i.key); return prm })}
                          className={cx('grid w-full grid-cols-[72px_1fr_auto] items-center gap-3 border-b border-line px-2 py-3 text-left transition-colors hover:bg-[#F7F7FA] md:grid-cols-[80px_1fr_150px_60px_70px]', state.flash === i.key && 'flash')}>
                          <span className="font-mono text-[12px] text-slate">{i.key}</span>
                          <span className={cx('truncate text-[14px]', i.status === 'done' && 'text-slate line-through decoration-slate/50')}>{i.title}</span>
                          <span className="hidden md:block"><StatusLabel status={i.status} /></span>
                          <span className="hidden md:block"><Chip strong={i.priority === 'high'}>{priorityLabel[i.priority]}</Chip></span>
                          <span className={cx('text-right font-mono text-[12px]', due?.overdue && i.status !== 'done' ? 'text-warning' : 'text-slate')}>{due?.text ?? '—'}</span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )
          })}
          {mine.length === 0 && <p className="py-16 text-center text-[13.5px] text-slate">{tab === 'open' ? 'Nothing assigned to you. Enjoy it.' : 'Nothing finished yet.'}</p>}
        </div>
      </main>
    </>
  )
}
