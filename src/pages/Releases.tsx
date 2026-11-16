import { useEffect, useMemo, useState } from 'react'
import { Navigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowDown, ArrowUp, CalendarDays, CheckCircle2, FileText, ListChecks, Plus, Rocket, ScrollText, Search, SlidersHorizontal, Sparkles } from 'lucide-react'
import { useStore } from '../store'
import { STATUSES, type Issue, type Release, type Status } from '../data/mock'
import { TopBar, Crumb } from '../components/AppShell'
import Markdown from '../components/Markdown'
import { daysLeft } from './Board'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import DatePicker from '../components/DatePicker'
import { Avatar, PriorityBadge, StatusPill, TypeBadge, cx } from '@/lib/ui'

/* Releases (Stitch, Gate 1 round 4): each version with its target date, lead, progress and the
   issues in it; release notes can be written by hand or generated from the finished issues. */

const pts = (list: Issue[]) => list.reduce((n, i) => n + (i.points ?? 0), 0)
const day = (d: string | null) => d ? new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No date'
const BAR: Record<Status, string> = { done: 'bg-success', progress: 'bg-brand', review: 'bg-warning', todo: 'bg-slate/30' }
const STATE: Record<Release['state'], { label: string; cls: string; dot: string }> = {
  active: { label: 'In progress', cls: 'border-brand/25 bg-tint text-brand', dot: 'bg-brand' },
  planned: { label: 'Planned', cls: 'border-line bg-cloud text-slate', dot: 'bg-slate' },
  shipped: { label: 'Shipped', cls: 'border-success/25 bg-[#E7F4EE] text-success', dot: 'bg-success' },
}

/** Draft release notes from the release's issues: finished work by type, then what's still open. */
export function draftNotes(r: Release, issues: Issue[]) {
  const done = issues.filter(i => i.status === 'done')
  const open = issues.filter(i => i.status !== 'done')
  const line = (i: Issue) => `- ${i.title} (${i.key})`
  const parts = [`# ${r.version}: ${r.title}`]
  const tasks = done.filter(i => i.type === 'task'); const bugs = done.filter(i => i.type === 'bug')
  if (tasks.length) parts.push('## Improvements\n' + tasks.map(line).join('\n'))
  if (bugs.length) parts.push('## Fixes\n' + bugs.map(line).join('\n'))
  if (!done.length) parts.push('_Nothing finished yet._')
  if (open.length && r.state !== 'shipped') parts.push(`> [!NOTE] Still open: ${open.length} ${open.length === 1 ? 'issue' : 'issues'} (${open.map(i => i.key).join(', ')}).`)
  return parts.join('\n\n')
}

function IssueRow({ issue }: { issue: Issue }) {
  const { user } = useStore()
  const [, setParams] = useSearchParams()
  const u = user(issue.assignee)
  return (
    <Button type="button" variant="ghost" onClick={() => setParams(p => { p.set('issue', issue.key); return p })}
      className="h-[42px] w-full shrink justify-between gap-3 rounded-none px-4 text-left font-normal hover:bg-wash">
      <span className="flex min-w-0 items-center gap-2.5">
        <TypeBadge type={issue.type} compact />
        <span className="w-[62px] shrink-0 font-mono text-[11.5px] text-slate">{issue.key}</span>
        <span className={cx('truncate text-[13px] font-medium', issue.status === 'done' && 'text-slate')}>{issue.title}</span>
      </span>
      <span className="flex shrink-0 items-center gap-3">
        <span className="hidden w-[104px] md:block"><StatusPill status={issue.status} size="sm" /></span>
        <span className="hidden sm:block"><PriorityBadge priority={issue.priority} compact /></span>
        <span className="hidden w-12 text-right font-mono text-[11.5px] text-slate sm:block">{issue.points ?? '–'} pts</span>
        <span className="flex items-center gap-1.5"><Avatar user={u} size={22} /><span className="hidden w-[92px] truncate text-[12.5px] lg:block">{u?.name ?? 'Unassigned'}</span></span>
      </span>
    </Button>
  )
}

function ReleaseDialog({ open, release, project, onClose }: { open: boolean; release: Release | null; project: string; onClose: () => void }) {
  const { state, dispatch, toast } = useStore()
  const p = state.projects.find(x => x.key === project)!
  const members = state.users.filter(u => p.members.includes(u.id))
  const [version, setVersion] = useState(''); const [title, setTitle] = useState('')
  const [target, setTarget] = useState(''); const [lead, setLead] = useState('none')
  useEffect(() => {
    if (!open) return
    setVersion(release?.version ?? ''); setTitle(release?.title ?? ''); setTarget(release?.target ?? ''); setLead(release?.lead ?? 'none')
  }, [open, release])
  const submit = () => {
    if (!version.trim()) return
    const data = { project, version: version.trim(), title: title.trim(), target: target || null, lead: lead === 'none' ? null : lead }
    if (release) dispatch({ t: 'releaseUpdate', id: release.id, patch: data })
    else { dispatch({ t: 'releaseCreate', release: data }); toast(`${data.version} created`, { kind: 'create', description: 'Add issues to it from here or from an issue' }) }
    onClose()
  }
  return (
    <Dialog open={open} onOpenChange={o => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>{release ? `Edit ${release.version}` : 'New release'}</DialogTitle>
          <DialogDescription>A version you plan to ship, with a target date and a lead.</DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={e => { e.preventDefault(); submit() }}>
          <div className="grid grid-cols-[110px_1fr] gap-3">
            <div className="flex flex-col gap-1.5"><Label htmlFor="rel-version">Version</Label><Input id="rel-version" value={version} onChange={e => setVersion(e.target.value)} placeholder="v1.6" className="font-mono" /></div>
            <div className="flex flex-col gap-1.5"><Label htmlFor="rel-title">Name</Label><Input id="rel-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="What it brings" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5"><Label htmlFor="rel-target">Target date</Label><DatePicker id="rel-target" value={target || null} onChange={v => setTarget(v ?? '')} placeholder="Target date" className="h-9 w-full" /></div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rel-lead">Lead</Label>
              <Select value={lead} onValueChange={setLead}>
                <SelectTrigger id="rel-lead" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="none">No lead</SelectItem>{members.map(u => <SelectItem key={u.id} value={u.id}><Avatar user={u} size={18} />{u.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={!version.trim()}>{release ? 'Save' : 'Create release'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ManageDialog({ release, onClose }: { release: Release | null; onClose: () => void }) {
  const { state, dispatch } = useStore()
  const [q, setQ] = useState('')
  const issues = release ? state.issues.filter(i => i.project === release.project) : []
  const shown = issues.filter(i => !q || i.title.toLowerCase().includes(q.toLowerCase()) || i.key.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (a.release === release?.id ? 0 : 1) - (b.release === release?.id ? 0 : 1) || a.key.localeCompare(b.key))
  const inCount = issues.filter(i => i.release === release?.id).length
  return (
    <Dialog open={!!release} onOpenChange={o => { if (!o) { setQ(''); onClose() } }}>
      <DialogContent className="gap-3 sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Issues in {release?.version}</DialogTitle>
          <DialogDescription>{inCount} included. Tick an issue to add it; an issue belongs to one release at a time.</DialogDescription>
        </DialogHeader>
        <div className="relative flex items-center"><Search className="pointer-events-none absolute left-2.5 size-4 text-placeholder" /><Input value={q} onChange={e => setQ(e.target.value)} aria-label="Find an issue" placeholder="Find an issue…" className="pl-8" /></div>
        <div className="max-h-[50vh] overflow-y-auto rounded-[4px] border border-line">
          {shown.map(i => {
            const other = i.release && i.release !== release?.id ? state.releases.find(r => r.id === i.release)?.version : null
            return (
              <Label key={i.key} className="flex h-10 cursor-pointer items-center gap-2.5 border-b border-line/60 px-3 font-normal last:border-b-0 hover:bg-wash">
                <Checkbox checked={i.release === release?.id} onCheckedChange={c => dispatch({ t: 'update', key: i.key, patch: { release: c ? release!.id : null } })} className="data-[state=checked]:border-brand data-[state=checked]:bg-brand" />
                <span className="w-[62px] shrink-0 font-mono text-[11.5px] text-slate">{i.key}</span>
                <span className="min-w-0 flex-1 truncate text-[13px]">{i.title}</span>
                {other && <Badge variant="outline" className="h-[18px] shrink-0 rounded-[3px] px-1 font-mono text-[10px] font-normal text-slate">in {other}</Badge>}
                <StatusPill status={i.status} size="sm" />
              </Label>
            )
          })}
        </div>
        <DialogFooter><Button onClick={onClose}>Done</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function NotesDialog({ release, mode, onClose }: { release: Release | null; mode: 'notes' | 'changelog' | 'generate'; onClose: () => void }) {
  const { state, dispatch, toast } = useStore()
  const issues = release ? state.issues.filter(i => i.release === release.id) : []
  const [text, setText] = useState('')
  const [editing, setEditing] = useState(false)
  useEffect(() => {
    if (!release) return
    const draft = mode === 'generate' || !release.notes
    setText(draft ? draftNotes(release, issues) : release.notes)
    setEditing(mode === 'generate' || (!release.notes && release.state !== 'shipped'))
  }, [release, mode]) // eslint-disable-line react-hooks/exhaustive-deps
  const changelog = useMemo(() => {
    const done = issues.filter(i => i.status === 'done')
    return [...done.filter(i => i.type === 'task'), ...done.filter(i => i.type === 'bug')]
  }, [issues])
  const save = () => { if (!release) return; dispatch({ t: 'releaseUpdate', id: release.id, patch: { notes: text.trim() } }); toast(`Release notes saved for ${release.version}`, { kind: 'create' }); onClose() }
  return (
    <Dialog open={!!release} onOpenChange={o => { if (!o) onClose() }}>
      <DialogContent className="gap-3 sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>{mode === 'changelog' ? `Changelog · ${release?.version}` : `Release notes · ${release?.version}`}</DialogTitle>
          <DialogDescription>{mode === 'changelog' ? 'Every finished issue in this release.' : mode === 'generate' ? 'Drafted from the finished issues. Edit before saving.' : release?.title}</DialogDescription>
        </DialogHeader>
        {mode === 'changelog' ? (
          <ul className="max-h-[55vh] divide-y divide-line/60 overflow-y-auto rounded-[4px] border border-line">
            {changelog.map(i => (
              <li key={i.key} className="flex items-center gap-2.5 px-3 py-2.5 text-[13px]">
                <TypeBadge type={i.type} compact /><span className="w-[62px] shrink-0 font-mono text-[11.5px] text-slate">{i.key}</span><span className="min-w-0 truncate">{i.title}</span>
              </li>
            ))}
            {!changelog.length && <li className="px-3 py-6 text-center text-[13px] text-slate">Nothing finished in this release yet.</li>}
          </ul>
        ) : editing ? (
          <Textarea value={text} onChange={e => setText(e.target.value)} rows={14} className="font-mono text-[12.5px] leading-relaxed" aria-label="Release notes" />
        ) : (
          <div className="max-h-[55vh] overflow-y-auto rounded-[4px] border border-line px-4 py-3"><Markdown>{text}</Markdown></div>
        )}
        <DialogFooter className="items-center sm:justify-between">
          {mode !== 'changelog' && release && (
            <Button type="button" variant="ghost" className="text-slate" onClick={() => { setText(draftNotes(release, issues)); setEditing(true) }}><Sparkles />Draft from issues</Button>
          )}
          <span className="flex gap-2">
            {mode !== 'changelog' && !editing && <Button variant="secondary" onClick={() => setEditing(true)}>Edit</Button>}
            {mode !== 'changelog' && editing ? <Button onClick={save}>Save notes</Button> : <Button variant={mode === 'changelog' ? 'default' : 'secondary'} onClick={onClose}>Close</Button>}
          </span>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ReleaseCard({ r, onEdit, onManage, onNotes }: { r: Release; onEdit: () => void; onManage: () => void; onNotes: (m: 'notes' | 'changelog' | 'generate') => void }) {
  const { state, user, dispatch, toast } = useStore()
  const [all, setAll] = useState(false)
  const issues = state.issues.filter(i => i.release === r.id).sort((a, b) => STATUSES.findIndex(s => s.id === a.status) - STATUSES.findIndex(s => s.id === b.status))
  const done = issues.filter(i => i.status === 'done')
  const pct = issues.length ? Math.round((done.length / issues.length) * 100) : 0
  const total = pts(issues)
  const meta = STATE[r.state]
  const left = daysLeft(r.target)
  const lead = user(r.lead)
  const shown = all ? issues : issues.slice(0, 5)
  const ship = () => {
    dispatch({ t: 'releaseShip', id: r.id })
    toast(`${r.version} shipped`, { kind: 'create', status: 'done', description: r.title, action: { label: 'Undo', onClick: () => dispatch({ t: 'releaseShip', id: r.id, undo: true }) } })
  }
  return (
    <section className="overflow-hidden rounded-[6px] border border-line bg-paper">
      <div className="flex flex-col gap-4 p-4 md:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5 font-mono text-[11.5px] text-slate">
              <Badge variant="outline" className={cx('h-[18px] gap-1.5 rounded-[3px] px-1.5 font-mono text-[10px] uppercase tracking-wider', meta.cls)}><span className={cx('size-1.5 rounded-full', meta.dot)} />{meta.label}</Badge>
              <span className="text-[13px] font-medium text-ink">{r.version}</span>
              <span className="text-line">|</span>
              {r.state === 'shipped'
                ? <span className="flex items-center gap-1"><CheckCircle2 className="size-3.5 text-success" />Shipped {day(r.shippedAt)}</span>
                : <span className="flex items-center gap-1"><CalendarDays className="size-3.5" />Target {day(r.target)}{left !== null && <span className={cx(left < 0 ? 'text-destructive' : r.state === 'active' && 'text-brand')}>({left < 0 ? `${-left} days late` : `${left} days left`})</span>}</span>}
              {lead && <><span className="text-line">|</span><span className="flex items-center gap-1.5">Lead <Avatar user={lead} size={18} /><span className="text-ink">{lead.name}</span></span></>}
            </div>
            <h2 className="mt-1.5 text-[18px] font-medium tracking-[-0.01em]">{r.version}: {r.title}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {r.state === 'shipped' ? (<>
              <Button size="sm" variant="secondary" onClick={() => onNotes('notes')}><FileText />View release notes</Button>
              <Button size="sm" variant="secondary" onClick={() => onNotes('changelog')}><ScrollText />Changelog</Button>
            </>) : (<>
              <Button size="sm" variant="secondary" onClick={() => onNotes('notes')}><FileText />Release notes</Button>
              <Button size="sm" variant="secondary" onClick={onManage}>{r.state === 'planned' ? <><Plus />Add issues</> : <><ListChecks />Manage issues</>}</Button>
              {r.state === 'planned'
                ? <Button size="sm" variant="secondary" onClick={onEdit}><SlidersHorizontal />Edit</Button>
                : <Button size="sm" onClick={ship}><Rocket />Ship {r.version}</Button>}
            </>)}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11.5px]">
            <span className="flex flex-wrap items-center gap-2 text-slate">
              <span className="text-ink">{done.length} / {issues.length} issues done</span><span>·</span>
              <span className={cx('font-medium', r.state === 'shipped' ? 'text-success' : 'text-brand')}>{pct}%</span><span>·</span>
              <span>{pts(done)} / {total} pts</span>
            </span>
            {r.state !== 'shipped' && (
              <span className="flex flex-wrap items-center gap-3 text-slate">
                {STATUSES.map(s => { const n = issues.filter(i => i.status === s.id).length; return n ? <span key={s.id} className="flex items-center gap-1.5"><span className={cx('size-2 rounded-full', BAR[s.id])} />{n} {s.label}</span> : null })}
              </span>
            )}
          </div>
          <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-cloud" role="img" aria-label={`${pct}% of issues done`}>
            {(['done', 'review', 'progress'] as Status[]).map(s => { const n = issues.filter(i => i.status === s).length; return n ? <div key={s} className={cx('h-full', BAR[s])} style={{ width: `${(n / issues.length) * 100}%` }} /> : null })}
          </div>
        </div>
      </div>
      {r.state !== 'shipped' && (
        <div className="border-t border-line">
          <div className="flex items-center justify-between bg-cloud/40 px-4 py-2">
            <span className="label-mono text-slate">{r.state === 'planned' ? 'Planned issues' : 'Included issues'} ({shown.length} of {issues.length})</span>
            {issues.length > 5 && <Button type="button" variant="link" size="xs" className="h-auto p-0 font-mono text-[11px] font-normal text-brand" onClick={() => setAll(a => !a)}>{all ? 'Show fewer' : `View all ${issues.length}`}</Button>}
          </div>
          <div className="divide-y divide-line/60">
            {shown.map(i => <IssueRow key={i.key} issue={i} />)}
            {!issues.length && <Button type="button" variant="ghost" onClick={onManage} className="h-12 w-full gap-1.5 rounded-none font-mono text-[11px] font-normal text-slate hover:text-brand"><Plus className="size-3.5" />Add issues to this release</Button>}
          </div>
        </div>
      )}
    </section>
  )
}

export default function Releases() {
  const { project = 'WEB' } = useParams()
  const { state } = useStore()
  const [tab, setTab] = useState('all')
  const [asc, setAsc] = useState(true)
  const [editing, setEditing] = useState<{ release: Release | null } | null>(null)
  const [managing, setManaging] = useState<Release | null>(null)
  const [notes, setNotes] = useState<{ release: Release; mode: 'notes' | 'changelog' | 'generate' } | null>(null)
  const [genOpen, setGenOpen] = useState(false)

  if (!state.projects.some(p => p.key === project)) return <Navigate to="/app/WEB/releases" replace />
  const releases = state.releases.filter(r => r.project === project)
  const counts = { active: releases.filter(r => r.state === 'active').length, planned: releases.filter(r => r.state === 'planned').length, shipped: releases.filter(r => r.state === 'shipped').length }
  const order = { active: 0, planned: 1, shipped: 2 }
  const shown = releases.filter(r => tab === 'all' || (tab === 'open' ? r.state !== 'shipped' : r.state === 'shipped'))
    .sort((a, b) => order[a.state] - order[b.state] || (asc ? 1 : -1) * (a.target ?? '9999').localeCompare(b.target ?? '9999'))
  const tracked = state.issues.filter(i => i.project === project && i.release).length
  const unshipped = releases.filter(r => r.state !== 'shipped')

  return (
    <>
      <TopBar crumbs={<Crumb project={project} page="Releases" />}
        actions={<Button variant="secondary" className="hidden md:inline-flex" onClick={() => setEditing({ release: null })}><Plus />New release</Button>} />
      <main className="min-h-0 flex-1 overflow-y-auto bg-wash scrollbar-thin">
        <div className="flex flex-col gap-5 p-4 md:p-6">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
            <div>
              <div className="flex items-center gap-3"><h1 className="text-[28px] font-medium leading-tight tracking-[-0.02em]">Releases</h1><Badge variant="outline" className="h-[20px] rounded-[3px] border-brand/25 bg-tint px-1.5 font-mono text-[11px] font-normal text-brand">{project}</Badge></div>
              <p className="mt-1 font-mono text-[12px] text-slate">{counts.active} in progress · {counts.planned} planned · {counts.shipped} shipped · {tracked} issues tracked</p>
            </div>
            <Button variant="secondary" disabled={!unshipped.length} onClick={() => setGenOpen(true)}><Sparkles />Release notes generator</Button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList>
                <TabsTrigger value="all">All releases <span className="font-mono text-[11px] opacity-70">{releases.length}</span></TabsTrigger>
                <TabsTrigger value="open">In progress &amp; planned <span className="font-mono text-[11px] opacity-70">{counts.active + counts.planned}</span></TabsTrigger>
                <TabsTrigger value="shipped">Shipped <span className="font-mono text-[11px] opacity-70">{counts.shipped}</span></TabsTrigger>
              </TabsList>
            </Tabs>
            <Button type="button" variant="ghost" size="xs" onClick={() => setAsc(a => !a)} className="gap-1 font-mono text-[11.5px] font-normal text-slate hover:text-ink">
              Sort: <span className="text-ink">Target date</span>{asc ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />}
            </Button>
          </div>
          {shown.map(r => <ReleaseCard key={r.id} r={r} onEdit={() => setEditing({ release: r })} onManage={() => setManaging(r)} onNotes={mode => setNotes({ release: r, mode })} />)}
          {!shown.length && (
            <div className="flex flex-col items-center gap-3 rounded-[6px] border border-dashed border-line py-14 text-center">
              <p className="text-[14px] font-medium">No releases here yet</p>
              <Button variant="secondary" onClick={() => setEditing({ release: null })}><Plus />New release</Button>
            </div>
          )}
        </div>
      </main>
      <ReleaseDialog open={!!editing} release={editing?.release ?? null} project={project} onClose={() => setEditing(null)} />
      <ManageDialog release={managing} onClose={() => setManaging(null)} />
      <NotesDialog release={notes?.release ?? null} mode={notes?.mode ?? 'notes'} onClose={() => setNotes(null)} />
      <Dialog open={genOpen} onOpenChange={setGenOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Release notes generator</DialogTitle>
            <DialogDescription>Pick a release. Tack drafts its notes from the finished issues; you edit before saving.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            {unshipped.map(r => (
              <Button key={r.id} type="button" variant="outline" onClick={() => { setGenOpen(false); setNotes({ release: r, mode: 'generate' }) }}
                className="h-auto justify-between rounded-[4px] px-3 py-2.5 font-normal has-[>svg]:px-3">
                <span className="text-[13.5px]"><span className="font-mono font-medium">{r.version}</span> · {r.title}</span>
                <Sparkles className="size-4 text-slate" />
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
