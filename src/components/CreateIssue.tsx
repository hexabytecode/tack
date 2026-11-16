import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CornerDownLeft, Eye, Paperclip, Plus, Tag, X } from 'lucide-react'
import { useStore } from '../store'
import { ME, STATUSES, type Attachment, type IssueType, type Priority, type Status } from '../data/mock'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import DatePicker from './DatePicker'
import MarkdownEditor from './MarkdownEditor'
import { Avatar, PRIORITY_META, StatusPill, TYPE_META } from '@/lib/ui'
import { cn } from '@/lib/utils'

export const POINT_STEPS = [1, 2, 3, 5, 8, 13]

function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: React.ReactNode }) {
  return <div className="flex flex-col gap-1.5"><Label htmlFor={htmlFor} className="label-mono text-slate">{label}</Label>{children}</div>
}

const kb = (n: number) => n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`

/* New issue opens as a side panel, in the same place and shape as an open issue
   (Stitch, Gate 1 round 2): writing on the left, the fields in a rail on the right. */
export default function CreateIssue() {
  const { createOpen, setCreateOpen, createProject, createStatus, state, create, toast } = useStore()
  const navigate = useNavigate()
  const [project, setProject] = useState('WEB')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<IssueType>('task')
  const [priority, setPriority] = useState<Priority>('medium')
  const [assignee, setAssignee] = useState<string>(ME)
  const [due, setDue] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>('todo')
  const [sprint, setSprint] = useState<string>('backlog')
  const [points, setPoints] = useState<string>('none')
  const [labels, setLabels] = useState<string[]>([])
  const [labelDraft, setLabelDraft] = useState<string | null>(null)
  const [files, setFiles] = useState<Attachment[]>([])
  const titleRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const addLabelRef = useRef<HTMLButtonElement>(null)

  const sprints = state.sprints.filter(s => s.project === project && s.state !== 'closed')
  const active = sprints.find(s => s.state === 'active')

  useEffect(() => {
    if (!createOpen) return
    const key = createProject && state.projects.some(p => p.key === createProject) ? createProject : 'WEB'
    setProject(key)
    setStatus(createStatus)
    setSprint(state.sprints.find(s => s.project === key && s.state === 'active')?.id ?? 'backlog')
  }, [createOpen, createProject, createStatus, state.projects, state.sprints])

  const p = state.projects.find(x => x.key === project)!
  const members = state.users.filter(u => p.members.includes(u.id))

  const reset = () => { setTitle(''); setDescription(''); setDue(null); setLabels([]); setFiles([]); setPoints('none'); setLabelDraft(null) }

  const submit = () => {
    if (!title.trim()) { titleRef.current?.focus(); return }
    const issue = create({
      project, title: title.trim(), description: description.trim(), type, priority, due, status,
      assignee: assignee === 'none' ? null : assignee,
      sprint: sprint === 'backlog' ? null : sprint,
      points: points === 'none' ? null : Number(points),
      labels, attachments: files,
    })
    const where = issue.sprint ? state.sprints.find(s => s.id === issue.sprint)?.name : 'Backlog'
    toast(`Created ${issue.key}`, { kind: 'create', status: issue.status, description: `${issue.title} · ${where}` })
    reset()
    setCreateOpen(false)
    navigate(`/app/${project}/board`)
  }

  const addLabel = () => {
    const v = (labelDraft ?? '').trim().toLowerCase().replace(/\s+/g, '-')
    if (v && !labels.includes(v)) setLabels([...labels, v])
    setLabelDraft(null)
    requestAnimationFrame(() => addLabelRef.current?.focus())
  }

  const trigger = 'h-9 w-full px-2.5 text-[13px]'

  return (
    <Sheet open={createOpen} onOpenChange={setCreateOpen}>
      <SheetContent side="right" className="w-full gap-0 p-0 outline-none sm:max-w-[760px] [&>button.absolute]:hidden" onOpenAutoFocus={e => { e.preventDefault(); titleRef.current?.focus() }}>
        <form className="flex min-h-0 flex-1 flex-col" onSubmit={e => { e.preventDefault(); submit() }} onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); submit() } }}>
          <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-line px-5">
            <div className="flex min-w-0 items-center gap-2.5">
              <SheetTitle className="label-mono rounded-[3px] border border-line bg-cloud px-2 py-0.5 text-ink">New issue</SheetTitle>
              <span className="text-line">/</span>
              <Select value={project} onValueChange={v => { setProject(v); setSprint(state.sprints.find(s => s.project === v && s.state === 'active')?.id ?? 'backlog') }}>
                <SelectTrigger size="sm" className="h-7 gap-1.5 border-0 px-1.5 text-[12.5px] shadow-none" aria-label="Project"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {state.projects.map(x => <SelectItem key={x.key} value={x.key}><span className="font-mono text-[11px] font-medium">{x.key}</span><span className="text-slate">·</span>{x.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <SheetDescription className="sr-only">Create an issue. Only the title is required.</SheetDescription>
            </div>
            <div className="flex items-center gap-1.5">
              <kbd className="hidden rounded-[3px] border border-line bg-cloud px-1.5 py-0.5 font-mono text-[10.5px] text-slate sm:inline">Esc</kbd>
              <Tooltip><TooltipTrigger asChild>
                <Button type="button" size="icon-sm" variant="ghost" aria-label="Close" onClick={() => setCreateOpen(false)}><X /></Button>
              </TooltipTrigger><TooltipContent>Close · Esc</TooltipContent></Tooltip>
            </div>
          </header>

          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto md:flex-row md:overflow-hidden">
            <div className="flex min-w-0 flex-1 flex-col gap-4 px-5 py-5 md:overflow-y-auto">
              <Label htmlFor="new-title" className="sr-only">Title</Label>
              <Input id="new-title" ref={titleRef} value={title} onChange={e => setTitle(e.target.value)} placeholder="Issue title"
                className="h-auto border-transparent px-1 py-0.5 text-[20px] font-medium tracking-tight shadow-none placeholder:font-normal hover:border-line focus-visible:border-line focus-visible:ring-0 md:text-[20px]" />
              <MarkdownEditor id="new-description" value={description} onChange={setDescription} people={members} placeholder="Add a description (optional)" rows={7} open />

              <div>
                <input ref={fileRef} type="file" multiple className="sr-only" aria-label="Attach files"
                  onChange={e => { const list = Array.from(e.target.files ?? []).map(f => ({ name: f.name, size: f.size })); setFiles(fs => [...fs, ...list]); e.target.value = '' }} />
                <button type="button" onClick={() => fileRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); const list = Array.from(e.dataTransfer.files).map(f => ({ name: f.name, size: f.size })); setFiles(fs => [...fs, ...list]) }}
                  className="flex w-full items-center justify-between rounded-[4px] border border-dashed border-line bg-wash px-3 py-3 text-left text-slate transition-colors hover:border-slate/50 hover:text-ink">
                  <span className="flex items-center gap-2 text-[13px]"><Paperclip className="size-4" />Attach files or drop screenshots here</span>
                  <span className="font-mono text-[10.5px] uppercase tracking-wide">Max 25 MB</span>
                </button>
                {files.length > 0 && (
                  <ul className="mt-2 flex flex-col gap-1">
                    {files.map((f, i) => (
                      <li key={i} className="flex items-center justify-between rounded-[4px] border border-line px-2.5 py-1.5 text-[12.5px]">
                        <span className="flex min-w-0 items-center gap-2"><Paperclip className="size-3.5 shrink-0 text-slate" /><span className="truncate">{f.name}</span><span className="font-mono text-[11px] text-slate">{kb(f.size)}</span></span>
                        <Button type="button" size="icon-sm" variant="ghost" className="size-6" aria-label={`Remove ${f.name}`} onClick={() => setFiles(fs => fs.filter((_, j) => j !== i))}><X /></Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <aside className="flex shrink-0 flex-col gap-4 border-t border-line px-5 py-5 md:w-[248px] md:overflow-y-auto md:border-l md:border-t-0">
              <Field label="Status" htmlFor="new-status">
                <Select value={status} onValueChange={v => setStatus(v as Status)}>
                  <SelectTrigger id="new-status" className={trigger}><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map(s => <SelectItem key={s.id} value={s.id}><StatusPill status={s.id} size="sm" /></SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Sprint" htmlFor="new-sprint">
                <Select value={sprint} onValueChange={setSprint}>
                  <SelectTrigger id="new-sprint" className={trigger}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {active && <SelectItem value={active.id}>{active.name}<span className="rounded-[3px] bg-tint px-1 font-mono text-[9.5px] font-medium uppercase tracking-wide text-brand">Active</span></SelectItem>}
                    {sprints.filter(s => s.state === 'planned').map(s => <SelectItem key={s.id} value={s.id}>{s.name}<span className="rounded-[3px] bg-cloud px-1 font-mono text-[9.5px] font-medium uppercase tracking-wide text-slate">Planned</span></SelectItem>)}
                    <SelectItem value="backlog">Backlog</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Story points" htmlFor="new-points">
                <Select value={points} onValueChange={setPoints}>
                  <SelectTrigger id="new-points" className={cn(trigger, 'font-mono')}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not estimated</SelectItem>
                    {POINT_STEPS.map(n => <SelectItem key={n} value={String(n)} className="font-mono">{n} {n === 1 ? 'pt' : 'pts'}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Assignee" htmlFor="new-assignee">
                <Select value={assignee} onValueChange={setAssignee}>
                  <SelectTrigger id="new-assignee" className={trigger}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {members.map(u => <SelectItem key={u.id} value={u.id}><Avatar user={u} size={18} />{u.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Priority" htmlFor="new-priority">
                <Select value={priority} onValueChange={v => setPriority(v as Priority)}>
                  <SelectTrigger id="new-priority" className={trigger}><SelectValue /></SelectTrigger>
                  <SelectContent>{(['high', 'medium', 'low'] as Priority[]).map(k => { const m = PRIORITY_META[k]; return <SelectItem key={k} value={k}><m.icon className={cn('size-3.5', m.iconCls)} />{m.label}</SelectItem> })}</SelectContent>
                </Select>
              </Field>
              <Field label="Type" htmlFor="new-type">
                <Select value={type} onValueChange={v => setType(v as IssueType)}>
                  <SelectTrigger id="new-type" className={trigger}><SelectValue /></SelectTrigger>
                  <SelectContent>{(['task', 'bug'] as IssueType[]).map(k => { const m = TYPE_META[k]; return <SelectItem key={k} value={k}><m.icon className={cn('size-3.5', m.iconCls)} />{m.label}</SelectItem> })}</SelectContent>
                </Select>
              </Field>
              <Field label="Due date" htmlFor="new-due">
                <DatePicker id="new-due" value={due} onChange={setDue} className="w-full" />
              </Field>
              <Field label="Labels">
                <div className="flex flex-wrap items-center gap-1.5">
                  {labels.map(l => (
                    <span key={l} className="flex items-center gap-1 rounded-[3px] border border-line bg-cloud py-0.5 pl-1.5 pr-0.5 font-mono text-[11px]">
                      <Tag className="size-3 text-slate" />{l}
                      <button type="button" className="rounded-[2px] p-0.5 text-slate hover:bg-paper hover:text-ink" aria-label={`Remove label ${l}`} onClick={() => setLabels(labels.filter(x => x !== l))}><X className="size-3" /></button>
                    </span>
                  ))}
                  {labelDraft === null ? (
                    <button ref={addLabelRef} type="button" onClick={() => setLabelDraft('')} className="flex h-6 items-center gap-0.5 rounded-[3px] border border-dashed border-line px-1.5 font-mono text-[10.5px] text-slate hover:border-slate hover:text-ink">
                      <Plus className="size-3" />Add
                    </button>
                  ) : (
                    <Input autoFocus aria-label="New label" value={labelDraft} onChange={e => setLabelDraft(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); addLabel() } if (e.key === 'Escape') { e.stopPropagation(); setLabelDraft(null) } }}
                      onBlur={addLabel} placeholder="label" className="h-6 w-24 px-1.5 font-mono text-[11px]" />
                  )}
                </div>
              </Field>
            </aside>
          </div>

          <footer className="flex h-14 shrink-0 items-center justify-between gap-3 border-t border-line px-5">
            <span className="hidden min-w-0 items-center gap-1.5 truncate text-[12.5px] text-slate sm:flex"><Eye className="size-3.5 shrink-0" />Visible to everyone in {p.name}</span>
            <div className="ml-auto flex shrink-0 items-center gap-2">
              <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit">Create issue <span className="hidden items-center gap-0.5 rounded-[3px] bg-white/15 px-1 font-mono text-[10px] sm:inline-flex">⌘<CornerDownLeft className="!size-2.5" /></span></Button>
            </div>
          </footer>
        </form>
      </SheetContent>
    </Sheet>
  )
}
