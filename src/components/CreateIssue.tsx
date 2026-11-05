import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { Button, Icon, cx } from '../lib/ui'
import { ME, type IssueType, type Priority } from '../data/mock'

const field = 'h-8 rounded-[4px] border border-line bg-paper px-2 text-[12.5px] text-ink focus:outline-2 focus:outline-accent'

export default function CreateIssue() {
  const { createOpen, setCreateOpen, createProject, state, create, toast } = useStore()
  const navigate = useNavigate()
  const [project, setProject] = useState('WEB')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<IssueType>('task')
  const [priority, setPriority] = useState<Priority>('medium')
  const [assignee, setAssignee] = useState<string>(ME)
  const [due, setDue] = useState('')
  const [another, setAnother] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!createOpen) return
    setProject(createProject && state.projects.some(p => p.key === createProject) ? createProject : 'WEB')
    setTimeout(() => titleRef.current?.focus(), 30)
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setCreateOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [createOpen, createProject, setCreateOpen, state.projects])

  if (!createOpen) return null
  const p = state.projects.find(x => x.key === project)!
  const members = state.users.filter(u => p.members.includes(u.id))

  const submit = () => {
    if (!title.trim()) { titleRef.current?.focus(); return }
    const issue = create({ project, title: title.trim(), description: description.trim(), type, priority, assignee: assignee || null, due: due || null })
    toast(`Created ${issue.key}`)
    setTitle(''); setDescription(''); setDue('')
    if (another) { titleRef.current?.focus(); return }
    setCreateOpen(false)
    navigate(`/app/${project}/board`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 pt-[12vh] pb-8">
      <button className="anim-fade fixed inset-0 bg-ink/35" aria-label="Close" onClick={() => setCreateOpen(false)} />
      <form
        role="dialog"
        aria-modal="true"
        aria-label="New issue"
        onSubmit={e => { e.preventDefault(); submit() }}
        onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); submit() } }}
        className="anim-pop relative w-full max-w-[560px] rounded-[8px] border border-line bg-paper shadow-[0_8px_24px_rgba(0,0,0,.12)]"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <div className="flex items-center gap-3">
            <h2 className="text-[16px] font-medium">New issue</h2>
            <label className="flex items-center gap-1.5 rounded-[4px] bg-cloud py-0.5 pl-1.5 pr-1 text-[12.5px] text-slate">
              <span className="rounded-[3px] bg-paper px-1 font-mono text-[10.5px] text-ink">{project}</span>
              <select value={project} onChange={e => setProject(e.target.value)} className="bg-transparent text-[12.5px] text-slate focus:outline-none" aria-label="Project">
                {state.projects.map(x => <option key={x.key} value={x.key}>{x.name}</option>)}
              </select>
            </label>
          </div>
          <button type="button" onClick={() => setCreateOpen(false)} className="rounded-[4px] p-1 text-slate hover:bg-cloud hover:text-ink" aria-label="Close"><Icon name="close" /></button>
        </div>
        <div className="flex flex-col gap-3 px-5 py-4">
          <input
            id="new-title"
            ref={titleRef}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Issue title"
            className="h-10 w-full rounded-[4px] border border-line px-3 text-[15px] font-medium placeholder:font-normal placeholder:text-placeholder focus:outline-2 focus:outline-accent"
          />
          <textarea
            id="new-description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Add a description (optional)"
            rows={4}
            className="w-full resize-none rounded-[4px] border border-line px-3 py-2 text-[13px] placeholder:text-placeholder focus:outline-2 focus:outline-accent"
          />
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-[4px] border border-line p-0.5" role="radiogroup" aria-label="Type">
              {(['task', 'bug'] as IssueType[]).map(t => (
                <button key={t} type="button" role="radio" aria-checked={type === t} onClick={() => setType(t)}
                  className={cx('rounded-[2px] px-2.5 py-1 font-mono text-[11.5px] capitalize transition-colors', type === t ? 'bg-ink text-paper' : 'text-slate hover:text-ink')}>{t}</button>
              ))}
            </div>
            <select id="new-assignee" aria-label="Assignee" value={assignee} onChange={e => setAssignee(e.target.value)} className={field}>
              <option value="">Unassigned</option>
              {members.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <select id="new-priority" aria-label="Priority" value={priority} onChange={e => setPriority(e.target.value as Priority)} className={field}>
              <option value="high">High priority</option>
              <option value="medium">Medium priority</option>
              <option value="low">Low priority</option>
            </select>
            <input id="new-due" aria-label="Due date" type="date" value={due} onChange={e => setDue(e.target.value)} className={field} />
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-line px-5 py-3">
          <label className="flex cursor-pointer items-center gap-2 text-[13px] text-slate">
            <input id="new-another" type="checkbox" checked={another} onChange={e => setAnother(e.target.checked)} className="h-3.5 w-3.5 accent-ink" />
            Create another
          </label>
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit">Create issue <span className="hidden rounded-[3px] bg-white/15 px-1 font-mono text-[10px] sm:inline">⌘ Enter</span></Button>
          </div>
        </div>
      </form>
    </div>
  )
}
