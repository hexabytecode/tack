import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useStore } from '../store'
import { Avatar, Button, Icon, StatusDot, cx, dueLabel, issueMarkdown, timeAgo } from '../lib/ui'
import { ME, STATUSES, type Issue, type IssueType, type Priority, type Status } from '../data/mock'

const select = 'h-8 w-full rounded-[4px] border border-line bg-paper px-2 text-[13px] focus:outline-2 focus:outline-accent'

async function copy(text: string) {
  try { await navigator.clipboard.writeText(text); return true } catch { return false }
}

export default function IssuePanel() {
  const [params, setParams] = useSearchParams()
  const key = params.get('issue')
  const { state, dispatch, user, toast } = useStore()
  const issue = state.issues.find(i => i.key === key)
  const [editingDesc, setEditingDesc] = useState(false)
  const [desc, setDesc] = useState('')
  const [title, setTitle] = useState('')
  const [reply, setReply] = useState('')

  const close = () => setParams(p => { p.delete('issue'); return p })

  useEffect(() => {
    if (!issue) return
    setTitle(issue.title); setDesc(issue.description); setEditingDesc(false); setReply('')
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issue?.key])

  if (!issue) return null
  const project = state.projects.find(p => p.key === issue.project)!
  const members = state.users.filter(u => project.members.includes(u.id))
  const comments = state.comments.filter(c => c.issue === issue.key).sort((a, b) => a.at - b.at)
  const activity = state.activity.filter(a => a.issue === issue.key).sort((a, b) => b.at - a.at)
  const due = dueLabel(issue.due)
  const patch = (p: Partial<Issue>) => dispatch({ t: 'update', key: issue.key, patch: p })

  const sendReply = () => {
    if (!reply.trim()) return
    dispatch({ t: 'comment', key: issue.key, body: reply.trim() })
    setReply('')
  }

  return (
    <div className="fixed inset-0 z-40">
      <button className="anim-fade absolute inset-0 bg-ink/20" aria-label="Close issue" onClick={close} />
      <section
        role="dialog"
        aria-modal="true"
        aria-label={`${issue.key} ${issue.title}`}
        className="anim-slide absolute inset-y-0 right-0 flex w-full max-w-[720px] flex-col border-l border-line bg-paper shadow-[0_8px_24px_rgba(0,0,0,.12)]"
      >
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-line px-5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[13px] font-medium text-accent">{issue.key}</span>
            <span className="text-line">/</span>
            <span className="truncate text-[13px] text-slate">{project.name}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="secondary" onClick={async () => toast(await copy(issueMarkdown(issue, user(issue.assignee))) ? 'Copied for AI' : 'Copy blocked by the browser')}>
              <Icon name="content_copy" className="!text-[15px]" />Copy for AI
            </Button>
            <button className="rounded-[4px] p-1.5 text-slate hover:bg-cloud hover:text-ink" title="Copy link" aria-label="Copy link"
              onClick={async () => toast(await copy(window.location.href) ? 'Link copied' : 'Copy blocked by the browser')}><Icon name="link" /></button>
            <button className="rounded-[4px] p-1.5 text-slate hover:bg-cloud hover:text-ink" title="Close" aria-label="Close" onClick={close}><Icon name="close" /></button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto md:flex-row md:overflow-hidden">
          <div className="min-w-0 flex-1 px-5 py-5 md:overflow-y-auto">
            <textarea
              id="issue-title"
              value={title}
              rows={1}
              onChange={e => setTitle(e.target.value)}
              onBlur={() => title.trim() && title !== issue.title && patch({ title: title.trim() })}
              className="w-full resize-none rounded-[4px] border border-transparent px-1 py-0.5 text-[20px] font-medium leading-snug tracking-tight hover:border-line focus:border-line focus:outline-none [field-sizing:content]"
            />

            <div className="mt-5">
              <div className="label-mono mb-2 text-slate">Description</div>
              {editingDesc ? (
                <div className="flex flex-col gap-2">
                  <textarea id="issue-desc" autoFocus value={desc} onChange={e => setDesc(e.target.value)} rows={7}
                    className="w-full rounded-[4px] border border-line px-3 py-2 text-[13.5px] leading-relaxed focus:outline-2 focus:outline-accent" />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => { patch({ description: desc }); setEditingDesc(false) }}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => { setDesc(issue.description); setEditingDesc(false) }}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setEditingDesc(true)} className="block w-full rounded-[4px] border border-transparent p-1 text-left text-[13.5px] leading-relaxed hover:border-line">
                  {issue.description
                    ? <span className="whitespace-pre-wrap">{issue.description}</span>
                    : <span className="text-placeholder">Add a description…</span>}
                </button>
              )}
            </div>

            <div className="mt-7">
              <div className="label-mono mb-3 flex justify-between text-slate"><span>Comments</span><span>{comments.length}</span></div>
              <ul className="flex flex-col gap-4">
                {comments.map(c => {
                  const a = user(c.author)
                  return (
                    <li key={c.id} className="flex gap-3">
                      {c.agent
                        ? <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border border-accent bg-tint"><Icon name="smart_toy" className="!text-[14px] text-accent" /></span>
                        : <Avatar user={a} size={26} />}
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className="text-[13px] font-medium">{c.agent ? c.agent : a?.name}</span>
                          {c.agent && <span className="rounded-[3px] border border-accent px-1 font-mono text-[9.5px] uppercase text-accent">by agent · for {a?.name}</span>}
                          <span className="font-mono text-[11px] text-slate">{timeAgo(c.at)}</span>
                        </div>
                        <p className="mt-0.5 whitespace-pre-wrap text-[13.5px] leading-relaxed">{c.body}</p>
                      </div>
                    </li>
                  )
                })}
              </ul>
              <div className="mt-4 rounded-[4px] border border-line focus-within:outline-2 focus-within:outline-accent">
                <textarea
                  id="issue-reply"
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); sendReply() } }}
                  placeholder="Write a comment… use @ to mention someone"
                  rows={2}
                  className="w-full resize-none rounded-t-[4px] px-3 py-2 text-[13.5px] placeholder:text-placeholder focus:outline-none"
                />
                <div className="flex items-center justify-between border-t border-line px-2 py-1.5">
                  <button className="rounded-[4px] p-1 text-slate hover:bg-cloud hover:text-ink" title="Mention" aria-label="Mention someone" onClick={() => setReply(r => r + '@')}><Icon name="alternate_email" /></button>
                  <Button size="sm" onClick={sendReply} disabled={!reply.trim()}>Comment</Button>
                </div>
              </div>
            </div>

            <div className="mt-7 pb-4">
              <div className="label-mono mb-2 text-slate">History</div>
              <ul className="flex flex-col gap-1.5">
                {activity.map(a => (
                  <li key={a.id} className="flex items-start gap-2 font-mono text-[11.5px] leading-relaxed text-slate">
                    <span className={cx('mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full', a.agent ? 'bg-accent' : 'bg-line')} />
                    <span>
                      {a.agent ? <span className="text-accent">{a.agent} (agent)</span> : <span className="text-ink">{user(a.actor)?.name}</span>} {a.text} · {timeAgo(a.at)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <aside className="flex shrink-0 flex-col gap-4 border-t border-line px-5 py-5 md:w-[240px] md:overflow-y-auto md:border-l md:border-t-0">
            <Field label="Status">
              <div className="relative">
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2"><StatusDot status={issue.status} /></span>
                <select id="issue-status" value={issue.status} onChange={e => patch({ status: e.target.value as Status })} className={cx(select, 'pl-6')}>
                  {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
            </Field>
            <Field label="Assignee">
              <select id="issue-assignee" value={issue.assignee ?? ''} onChange={e => patch({ assignee: e.target.value || null })} className={select}>
                <option value="">Unassigned</option>
                {members.map(u => <option key={u.id} value={u.id}>{u.name}{u.id === ME ? ' (you)' : ''}</option>)}
              </select>
            </Field>
            <Field label="Priority">
              <select id="issue-priority" value={issue.priority} onChange={e => patch({ priority: e.target.value as Priority })} className={select}>
                <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
              </select>
            </Field>
            <Field label="Type">
              <select id="issue-type" value={issue.type} onChange={e => patch({ type: e.target.value as IssueType })} className={select}>
                <option value="task">Task</option><option value="bug">Bug</option>
              </select>
            </Field>
            <Field label="Due">
              <input id="issue-due" type="date" value={issue.due ?? ''} onChange={e => patch({ due: e.target.value || null })} className={cx(select, due?.overdue && 'text-warning')} />
            </Field>
            <Field label="Labels">
              <div className="flex flex-wrap gap-1.5">
                {issue.labels.length ? issue.labels.map(l => <span key={l} className="rounded-[3px] bg-cloud px-1.5 py-0.5 font-mono text-[11px]">{l}</span>) : <span className="text-[13px] text-placeholder">None</span>}
              </div>
            </Field>
            <Field label="Created"><span className="font-mono text-[11.5px] text-slate">{new Date(issue.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · updated {timeAgo(issue.updatedAt)}</span></Field>
          </aside>
        </div>
      </section>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><div className="label-mono mb-1.5 text-slate">{label}</div>{children}</div>
}
