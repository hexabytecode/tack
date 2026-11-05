import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Bot, ClipboardCopy, History, Link2, MessageSquare, PenLine, Tag, X } from 'lucide-react'
import { useStore } from '../store'
import { ME, STATUSES, type Issue, type IssueType, type Priority, type Status } from '../data/mock'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import DatePicker from './DatePicker'
import Markdown from './Markdown'
import MarkdownEditor from './MarkdownEditor'
import { Avatar, PRIORITY_META, StatusPill, TYPE_META, dueLabel, issueMarkdown, timeAgo } from '@/lib/ui'
import { cn } from '@/lib/utils'

async function copy(text: string) {
  try { await navigator.clipboard.writeText(text); return true } catch { return false }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex flex-col gap-1.5"><div className="label-mono text-slate">{label}</div>{children}</div>
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issue?.key])

  const project = issue && state.projects.find(p => p.key === issue.project)
  const members = project ? state.users.filter(u => project.members.includes(u.id)) : []
  const comments = issue ? state.comments.filter(c => c.issue === issue.key).sort((a, b) => a.at - b.at) : []
  const activity = issue ? state.activity.filter(a => a.issue === issue.key).sort((a, b) => b.at - a.at) : []
  const patch = (p: Partial<Issue>) => issue && dispatch({ t: 'update', key: issue.key, patch: p })

  const sendReply = () => {
    if (!issue || !reply.trim()) return
    dispatch({ t: 'comment', key: issue.key, body: reply.trim() })
    setReply('')
  }

  return (
    <Sheet open={!!issue} onOpenChange={o => { if (!o) close() }}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-[760px] [&>button.absolute]:hidden" onOpenAutoFocus={e => e.preventDefault()}>
        {issue && project && (
          <>
            <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-line px-5">
              <div className="flex min-w-0 items-center gap-2">
                <SheetTitle className="whitespace-nowrap font-mono text-[13px] font-medium text-brand">{issue.key}</SheetTitle>
                <span className="hidden text-line sm:inline">/</span>
                <span className="hidden truncate text-[13px] text-slate sm:inline">{project.name}</span>
                <SheetDescription className="sr-only">{issue.title}</SheetDescription>
              </div>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="secondary" onClick={async () => toast(await copy(issueMarkdown(issue, user(issue.assignee))) ? 'Copied for AI' : 'Copy blocked by the browser', { kind: 'copy', description: `${issue.key} as Markdown, ready to paste` })}>
                  <ClipboardCopy /><span className="hidden sm:inline">Copy for AI</span>
                </Button>
                <Tooltip><TooltipTrigger asChild>
                  <Button size="icon-sm" variant="ghost" aria-label="Copy link" onClick={async () => toast(await copy(window.location.href) ? 'Link copied' : 'Copy blocked by the browser', { kind: 'copy', description: issue.key })}><Link2 /></Button>
                </TooltipTrigger><TooltipContent>Copy link</TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild>
                  <Button size="icon-sm" variant="ghost" aria-label="Close" onClick={close}><X /></Button>
                </TooltipTrigger><TooltipContent>Close · Esc</TooltipContent></Tooltip>
              </div>
            </header>

            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto md:flex-row md:overflow-hidden">
              <div className="min-w-0 flex-1 px-5 py-5 md:overflow-y-auto">
                <Textarea
                  id="issue-title"
                  aria-label="Title"
                  value={title}
                  rows={1}
                  onChange={e => setTitle(e.target.value)}
                  onBlur={() => title.trim() && title !== issue.title && patch({ title: title.trim() })}
                  className="min-h-0 w-full resize-none rounded-[4px] border-transparent px-1 py-0.5 text-[20px] font-medium leading-snug tracking-tight shadow-none [field-sizing:content] hover:border-line focus-visible:border-line focus-visible:ring-0 md:text-[20px]"
                />
                <div className="mt-2 flex flex-wrap gap-1.5 px-1">
                  {issue.labels.map(l => <Badge key={l} variant="secondary" className="gap-1 rounded-[4px] font-mono text-[11px] font-normal"><Tag className="!size-3 text-slate" />{l}</Badge>)}
                </div>

                <section className="mt-5">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="label-mono text-slate">Description</span>
                    {!editingDesc && <Button size="sm" variant="ghost" className="text-slate" onClick={() => setEditingDesc(true)}><PenLine />Edit</Button>}
                  </div>
                  {editingDesc ? (
                    <MarkdownEditor id="issue-desc" open value={desc} onChange={setDesc} people={members} rows={7} submitLabel="Save" placeholder="Describe the issue…"
                      onSubmit={() => { patch({ description: desc }); setEditingDesc(false) }}
                      onCancel={() => { setDesc(issue.description); setEditingDesc(false) }} />
                  ) : (
                    <div className="rounded-[4px] px-1">
                      {issue.description ? <Markdown>{issue.description}</Markdown> : <button className="text-[13.5px] text-placeholder" onClick={() => setEditingDesc(true)}>Add a description…</button>}
                    </div>
                  )}
                </section>

                <Separator className="my-6" />

                <section>
                  <div className="label-mono mb-3 flex items-center gap-1.5 text-slate"><MessageSquare className="size-3.5" />Comments<span className="ml-auto">{comments.length}</span></div>
                  <ul className="flex flex-col gap-4">
                    {comments.map(c => {
                      const a = user(c.author)
                      return (
                        <li key={c.id} className="flex gap-3">
                          {c.agent
                            ? <span className="flex size-[26px] shrink-0 items-center justify-center rounded-full border border-brand bg-tint"><Bot className="size-3.5 text-brand" /></span>
                            : <Avatar user={a} size={26} />}
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-baseline gap-2">
                              <span className="text-[13px] font-medium">{c.agent ?? a?.name}</span>
                              {c.agent && <Badge variant="outline" className="h-4 rounded-[3px] border-brand px-1 font-mono text-[9.5px] uppercase text-brand">by agent · for {a?.name}</Badge>}
                              <span className="font-mono text-[11px] text-slate">{timeAgo(c.at)}</span>
                            </div>
                            <Markdown className="mt-0.5">{c.body}</Markdown>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                  <div className="mt-4">
                    <MarkdownEditor id="issue-reply" value={reply} onChange={setReply} onSubmit={sendReply} people={members}
                      placeholder="Leave a comment…" />
                  </div>
                </section>

                <Separator className="my-6" />

                <section className="pb-4">
                  <div className="label-mono mb-2 flex items-center gap-1.5 text-slate"><History className="size-3.5" />History</div>
                  <ul className="flex flex-col gap-1.5">
                    {activity.map(a => (
                      <li key={a.id} className="flex items-start gap-2 font-mono text-[11.5px] leading-relaxed text-slate">
                        <span className={cn('mt-1.5 size-1.5 shrink-0 rounded-full', a.agent ? 'bg-brand' : 'bg-line')} />
                        <span>{a.agent ? <span className="text-brand">{a.agent} (agent)</span> : <span className="text-ink">{user(a.actor)?.name}</span>} {a.text} · {timeAgo(a.at)}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>

              <aside className="flex shrink-0 flex-col gap-4 border-t border-line px-5 py-5 md:w-[248px] md:overflow-y-auto md:border-l md:border-t-0">
                <Field label="Status">
                  <Select value={issue.status} onValueChange={v => {
                    const before = issue.status
                    patch({ status: v as Status })
                    toast(`${issue.key} moved`, { status: v as Status, description: issue.title, action: { label: 'Undo', onClick: () => patch({ status: before }) } })
                  }}>
                    <SelectTrigger id="issue-status" className="h-9 w-full px-2 text-[13px]"><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUSES.map(s => <SelectItem key={s.id} value={s.id}><StatusPill status={s.id} size="sm" /></SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Assignee">
                  <Select value={issue.assignee ?? 'none'} onValueChange={v => patch({ assignee: v === 'none' ? null : v })}>
                    <SelectTrigger id="issue-assignee" className="h-8 w-full text-[13px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {members.map(u => <SelectItem key={u.id} value={u.id}><Avatar user={u} size={18} />{u.name}{u.id === ME ? ' (you)' : ''}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Priority">
                  <Select value={issue.priority} onValueChange={v => patch({ priority: v as Priority })}>
                    <SelectTrigger id="issue-priority" className="h-8 w-full text-[13px]"><SelectValue /></SelectTrigger>
                    <SelectContent>{(['high', 'medium', 'low'] as Priority[]).map(k => { const m = PRIORITY_META[k]; return <SelectItem key={k} value={k}><m.icon className={cn('size-3.5', m.iconCls)} />{m.label}</SelectItem> })}</SelectContent>
                  </Select>
                </Field>
                <Field label="Type">
                  <Select value={issue.type} onValueChange={v => patch({ type: v as IssueType })}>
                    <SelectTrigger id="issue-type" className="h-8 w-full text-[13px]"><SelectValue /></SelectTrigger>
                    <SelectContent>{(['task', 'bug'] as IssueType[]).map(k => { const m = TYPE_META[k]; return <SelectItem key={k} value={k}><m.icon className={cn('size-3.5', m.iconCls)} />{m.label}</SelectItem> })}</SelectContent>
                  </Select>
                </Field>
                <Field label="Due">
                  <DatePicker id="issue-due" value={issue.due} onChange={v => patch({ due: v })} className="w-full" warn={dueLabel(issue.due)?.overdue && issue.status !== 'done'} />
                </Field>
                <Field label="Created">
                  <span className="font-mono text-[11.5px] text-slate">{new Date(issue.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · updated {timeAgo(issue.updatedAt)}</span>
                </Field>
              </aside>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
