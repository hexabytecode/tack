import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CornerDownLeft, FolderKanban } from 'lucide-react'
import { useStore } from '../store'
import { ME, type IssueType, type Priority } from '../data/mock'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import DatePicker from './DatePicker'
import MarkdownEditor from './MarkdownEditor'
import { Avatar, PRIORITY_META, TYPE_META } from '@/lib/ui'
import { cn } from '@/lib/utils'

export default function CreateIssue() {
  const { createOpen, setCreateOpen, createProject, state, create, toast } = useStore()
  const navigate = useNavigate()
  const [project, setProject] = useState('WEB')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<IssueType>('task')
  const [priority, setPriority] = useState<Priority>('medium')
  const [assignee, setAssignee] = useState<string>(ME)
  const [due, setDue] = useState<string | null>(null)
  const [another, setAnother] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (createOpen) setProject(createProject && state.projects.some(p => p.key === createProject) ? createProject : 'WEB')
  }, [createOpen, createProject, state.projects])

  const p = state.projects.find(x => x.key === project)!
  const members = state.users.filter(u => p.members.includes(u.id))

  const submit = () => {
    if (!title.trim()) { titleRef.current?.focus(); return }
    const issue = create({ project, title: title.trim(), description: description.trim(), type, priority, assignee: assignee === 'none' ? null : assignee, due })
    toast(`Created ${issue.key} · ${issue.title}`)
    setTitle(''); setDescription(''); setDue(null)
    if (another) { titleRef.current?.focus(); return }
    setCreateOpen(false)
    navigate(`/app/${project}/board`)
  }

  return (
    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
      <DialogContent className="gap-0 p-0 sm:max-w-[600px]" onOpenAutoFocus={e => { e.preventDefault(); titleRef.current?.focus() }}>
        <form onSubmit={e => { e.preventDefault(); submit() }} onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); submit() } }}>
          <DialogHeader className="flex-row items-center gap-3 space-y-0 border-b border-line px-5 py-3.5">
            <DialogTitle className="text-[16px] font-medium">New issue</DialogTitle>
            <DialogDescription className="sr-only">Create an issue. Only the title is required.</DialogDescription>
            <Select value={project} onValueChange={setProject}>
              <SelectTrigger size="sm" className="h-7 gap-1.5 border-0 bg-cloud px-2 text-[12.5px]" aria-label="Project">
                <FolderKanban className="size-3.5 text-slate" /><SelectValue />
              </SelectTrigger>
              <SelectContent>
                {state.projects.map(x => <SelectItem key={x.key} value={x.key}><span className="font-mono text-[11px] text-slate">{x.key}</span>{x.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </DialogHeader>

          <div className="flex flex-col gap-3 px-5 py-4">
            <Label htmlFor="new-title" className="sr-only">Title</Label>
            <Input id="new-title" ref={titleRef} value={title} onChange={e => setTitle(e.target.value)} placeholder="Issue title"
              className="h-10 text-[15px] font-medium placeholder:font-normal" />
            <MarkdownEditor id="new-description" value={description} onChange={setDescription} people={members} placeholder="Add a description (optional). Markdown works." rows={4} />

            <div className="flex flex-wrap items-center gap-2">
              <ToggleGroup type="single" value={type} onValueChange={v => v && setType(v as IssueType)} variant="outline" size="sm" aria-label="Type">
                {(['task', 'bug'] as IssueType[]).map(t => {
                  const m = TYPE_META[t]
                  return (
                    <ToggleGroupItem key={t} value={t} className={cn('h-8 gap-1.5 px-2.5 text-[12.5px]', type === t && m.cls)}>
                      <m.icon className={cn('size-3.5', m.iconCls)} />{m.label}
                    </ToggleGroupItem>
                  )
                })}
              </ToggleGroup>

              <Select value={assignee} onValueChange={setAssignee}>
                <SelectTrigger size="sm" className="h-8 text-[12.5px]" aria-label="Assignee"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {members.map(u => <SelectItem key={u.id} value={u.id}><Avatar user={u} size={18} />{u.name}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={priority} onValueChange={v => setPriority(v as Priority)}>
                <SelectTrigger size="sm" className="h-8 text-[12.5px]" aria-label="Priority"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(['high', 'medium', 'low'] as Priority[]).map(k => {
                    const m = PRIORITY_META[k]
                    return <SelectItem key={k} value={k}><m.icon className={cn('size-3.5', m.iconCls)} />{m.label} priority</SelectItem>
                  })}
                </SelectContent>
              </Select>

              <DatePicker id="new-due" value={due} onChange={setDue} />
            </div>
          </div>

          <DialogFooter className="flex-row items-center justify-between border-t border-line px-5 py-3 sm:justify-between">
            <label className="flex cursor-pointer items-center gap-2 text-[13px] text-slate">
              <Checkbox id="new-another" checked={another} onCheckedChange={v => setAnother(v === true)} />
              Create another
            </label>
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit">Create issue <span className="hidden items-center gap-0.5 rounded-[3px] bg-white/15 px-1 font-mono text-[10px] sm:inline-flex">⌘<CornerDownLeft className="!size-2.5" /></span></Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
