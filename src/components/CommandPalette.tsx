import { Fragment, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { KanbanSquare, List, ListTodo, Rocket, Settings, Star, UserRound, X } from 'lucide-react'
import { useStore } from '../store'
import { STATUSES, type Issue } from '../data/mock'
import { matchFilters } from '@/lib/filters'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Kbd } from '@/components/ui/kbd'
import { PRIORITY_META, TYPE_META, cx } from '@/lib/ui'

/* Search / jump to (Stitch, Gate 1 round 4): one ⌘K box for issues, project pages and starred views.
   Enter goes to the issue in its project; ⌘Enter opens it in the side panel over the current page. */

const DOT: Record<Issue['status'], string> = { todo: 'bg-slate', progress: 'bg-brand', review: 'bg-warning', done: 'bg-success' }

function Highlight({ text, q }: { text: string; q: string }) {
  if (!q) return <>{text}</>
  const i = text.toLowerCase().indexOf(q.toLowerCase())
  if (i < 0) return <>{text}</>
  return <>{text.slice(0, i)}<span className="font-semibold text-brand">{text.slice(i, i + q.length)}</span>{text.slice(i + q.length)}</>
}

export default function CommandPalette() {
  const { state, user } = useStore()
  const navigate = useNavigate()
  const location = useLocation()
  const { project = 'WEB' } = useParams()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [value, setValue] = useState('')

  useEffect(() => {
    const show = () => setOpen(true)
    const key = (e: KeyboardEvent) => { if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setOpen(o => !o) } }
    window.addEventListener('tack:palette', show)
    window.addEventListener('keydown', key)
    return () => { window.removeEventListener('tack:palette', show); window.removeEventListener('keydown', key) }
  }, [])
  useEffect(() => { if (!open) setQ('') }, [open])

  const needle = q.trim().toLowerCase()
  const issues = useMemo(() => {
    const list = needle
      ? state.issues.filter(i => i.key.toLowerCase().includes(needle) || i.title.toLowerCase().includes(needle))
      : [...state.issues].sort((a, b) => b.updatedAt - a.updatedAt)
    return list.slice(0, needle ? 8 : 5)
  }, [state.issues, needle])

  const pages = useMemo(() => {
    const out: { id: string; label: string; sub: string; to: string; icon: typeof List }[] = []
    for (const p of state.projects) {
      const views = [
        { v: 'Backlog', sub: 'Sprints and unplanned work', icon: ListTodo, to: 'backlog' },
        { v: 'Board', sub: 'Active sprint', icon: KanbanSquare, to: 'board' },
        { v: 'List', sub: 'Every issue', icon: List, to: 'list' },
        { v: 'Releases', sub: 'Versions and release notes', icon: Rocket, to: 'releases' },
        { v: 'Settings', sub: 'Project settings', icon: Settings, to: 'settings' },
      ]
      for (const v of views) out.push({ id: `${p.key}-${v.to}`, label: `${p.name} → ${v.v}`, sub: v.sub, to: `/app/${p.key}/${v.to}`, icon: v.icon })
    }
    out.push({ id: 'me', label: 'My issues', sub: 'Everything assigned to you', to: '/app/me', icon: UserRound })
    const list = needle ? out.filter(o => o.label.toLowerCase().includes(needle)) : out.filter(o => o.id.startsWith(project + '-') || o.id === 'me')
    return list.slice(0, 6)
  }, [state.projects, needle, project])

  const starred = useMemo(() => state.starred.filter(v => !needle || v.name.toLowerCase().includes(needle)), [state.starred, needle])
  const count = (query: string, p: string, view: string) => {
    const params = new URLSearchParams(query)
    const active = state.sprints.find(x => x.project === p && x.state === 'active')?.id
    return state.issues.filter(i => i.project === p && (view !== 'board' || i.sprint === active) && matchFilters(i, params)).length
  }

  const go = (to: string) => { setOpen(false); navigate(to) }
  const openIssue = (i: Issue, here: boolean) => {
    setOpen(false)
    if (here && location.pathname.startsWith('/app')) { const p = new URLSearchParams(location.search); p.set('issue', i.key); navigate(`${location.pathname}?${p}`); return }
    const active = state.sprints.find(x => x.project === i.project && x.state === 'active')?.id
    navigate(`/app/${i.project}/${i.sprint && i.sprint === active ? 'board' : 'backlog'}?issue=${i.key}`)
  }
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && value.startsWith('issue:')) {
      e.preventDefault()
      const i = state.issues.find(x => x.key === value.slice(6))
      if (i) openIssue(i, true)
    }
  }

  const item = 'cursor-pointer gap-3 rounded-[4px] border-l-2 border-transparent px-3 py-2 data-[selected=true]:border-brand'

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="top-[14%] block w-[calc(100%-2rem)] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-[640px] [&>button.absolute]:hidden">
        <DialogTitle className="sr-only">Search or jump to</DialogTitle>
        <DialogDescription className="sr-only">Find an issue by key or title, or jump to a page or starred view.</DialogDescription>
        <Command shouldFilter={false} value={value} onValueChange={setValue} onKeyDown={onKeyDown} loop className="w-full min-w-0 rounded-none [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.06em] [&_[cmdk-group-heading]]:text-slate">
          <div className="flex items-center gap-2 border-b border-line pr-4 [&_[data-slot=command-input-wrapper]]:h-14 [&_[data-slot=command-input-wrapper]]:flex-1 [&_[data-slot=command-input-wrapper]]:border-0 [&_[data-slot=command-input-wrapper]]:px-4 [&_[data-slot=command-input-wrapper]_svg]:size-[18px] [&_[data-slot=command-input-wrapper]_svg]:opacity-100 [&_[data-slot=command-input-wrapper]_svg]:text-slate">
            <CommandInput value={q} onValueChange={setQ} placeholder="Search issues, pages and starred views…" className="h-14 text-[16px] placeholder:text-placeholder" />
            {q && <Button variant="ghost" size="icon-sm" onClick={() => setQ('')} aria-label="Clear" className="text-slate"><X /></Button>}
            <Kbd>Esc</Kbd>
          </div>
          <CommandList className="max-h-[min(60vh,440px)] px-1.5 pb-2 scrollbar-thin">
            <CommandEmpty className="px-4 py-10 text-center text-[13.5px] text-slate">Nothing matches “{q}”.</CommandEmpty>
            {issues.length > 0 && (
              <CommandGroup heading={needle ? `Issues (${issues.length})` : 'Recent issues'}>
                {issues.map(i => {
                  const T = TYPE_META[i.type]; const P = PRIORITY_META[i.priority]; const u = user(i.assignee)
                  return (
                    <CommandItem key={i.key} value={`issue:${i.key}`} onSelect={() => openIssue(i, false)} className={cx(item, 'group')}>
                      <span className={cx('size-1.5 shrink-0 rounded-full', DOT[i.status])} />
                      <span className="w-[62px] shrink-0 font-mono text-[12px] text-ink group-data-[selected=true]:text-brand">{i.key}</span>
                      <span className="min-w-0 flex-1 truncate text-[14px]"><Highlight text={i.title} q={q.trim()} /></span>
                      <span className="hidden shrink-0 items-center gap-1.5 sm:flex">
                        <Badge variant="outline" className={cx('h-[18px] rounded-[3px] px-1 font-mono text-[10px] uppercase', T.cls)}>{T.label}</Badge>
                        <Badge variant="outline" className={cx('h-[18px] rounded-[3px] px-1 font-mono text-[10px] uppercase', P.cls)}>{P.short}</Badge>
                        <span className="hidden w-[78px] font-mono text-[10.5px] uppercase text-slate md:inline">{STATUSES.find(s => s.id === i.status)?.label}</span>
                        <Badge variant="outline" className="size-5 justify-center rounded-[3px] p-0 font-mono text-[9.5px]">{u?.initials ?? '–'}</Badge>
                      </span>
                      <Badge variant="outline" className="hidden h-[20px] shrink-0 rounded-[3px] border-brand/30 bg-paper px-1.5 font-mono text-[10.5px] text-brand group-data-[selected=true]:inline-flex">↵ to open</Badge>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}
            {pages.length > 0 && (
              <CommandGroup heading="Projects & views">
                {pages.map(p => (
                  <CommandItem key={p.id} value={`page:${p.id}`} onSelect={() => go(p.to)} className={item}>
                    <p.icon className="size-4 shrink-0 text-slate" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px]">{p.label.split(' → ').map((part, n, all) => <Fragment key={n}>{n === all.length - 1 && all.length > 1 ? <span className="text-brand">{part}</span> : part}{n < all.length - 1 && ' → '}</Fragment>)}</span>
                      <span className="block truncate font-mono text-[11px] text-slate">{p.sub}</span>
                    </span>
                    <Badge variant="outline" className="h-[18px] shrink-0 rounded-[3px] px-1 font-mono text-[10px] text-slate">VIEW</Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {starred.length > 0 && (
              <CommandGroup heading="Starred views">
                {starred.map(v => {
                  const p = state.projects.find(x => x.key === v.project)
                  const n = count(v.query, v.project, v.view)
                  return (
                    <CommandItem key={v.id} value={`star:${v.id}`} onSelect={() => go(`/app/${v.project}/${v.view}?${v.query}`)} className={item}>
                      <Star className="size-4 shrink-0 fill-warning text-warning" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px]">{v.name}</span>
                        <span className="block truncate font-mono text-[11px] capitalize text-slate">{v.view} · {p?.name}</span>
                      </span>
                      <Badge variant="secondary" className="h-[20px] shrink-0 rounded-[3px] px-1.5 font-mono text-[10.5px] text-slate">{n} {n === 1 ? 'issue' : 'issues'}</Badge>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}
          </CommandList>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line bg-wash px-4 py-2.5 text-[11.5px] text-slate">
            <span className="flex items-center gap-1.5"><Kbd>↑↓</Kbd>Navigate</span>
            <span className="flex items-center gap-1.5"><Kbd>↵</Kbd>Open</span>
            <span className="flex items-center gap-1.5"><Kbd>⌘↵</Kbd>Open in side panel</span>
            <span className="ml-auto flex items-center gap-1.5"><Kbd>Esc</Kbd>Close</span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
