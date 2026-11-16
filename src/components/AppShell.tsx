import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ChevronDown, KanbanSquare, List, ListTodo, LogOut, Menu, MoreHorizontal, Plus, Rocket, Search, Settings, Star, UserRound, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useStore } from '../store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar, Logo, LogoMark, cx } from '@/lib/ui'
import CreateIssue from './CreateIssue'
import IssuePanel from './IssuePanel'
import CommandPalette from './CommandPalette'
import { matchFilters } from '@/lib/filters'
import { ME } from '../data/mock'

/* Sidebar (Stitch, Gate 1 round 3, option 2): Create and Search at the top, then your own work,
   then every project as an accordion; the open project lists its planning views and settings. */
function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { state, user, dispatch, setCreateOpen } = useStore()
  const { project = 'WEB' } = useParams()
  const navigate = useNavigate()
  const me = user(ME)
  const location = useLocation()
  const [starOpen, setStarOpen] = useState(true)
  const starCount = (v: { project: string; view: string; query: string }) => {
    const p = new URLSearchParams(v.query)
    const sprint = state.sprints.find(x => x.project === v.project && x.state === 'active')?.id
    return state.issues.filter(i => i.project === v.project && (v.view !== 'board' || i.sprint === sprint) && matchFilters(i, p)).length
  }
  const open = (i: { status: string }) => i.status !== 'done'
  const mine = state.issues.filter(i => i.assignee === ME && open(i)).length
  const active = (key: string) => state.sprints.find(x => x.project === key && x.state === 'active')?.id
  const counts = (key: string) => {
    const all = state.issues.filter(i => i.project === key)
    return {
      backlog: all.filter(i => i.sprint === null && open(i)).length,
      board: all.filter(i => i.sprint !== null && i.sprint === active(key) && open(i)).length,
      list: all.filter(open).length,
    }
  }
  const row = 'flex items-center justify-between rounded-[4px] px-2 py-1.5 text-[13px] transition-colors duration-150'
  const idle = 'text-slate hover:bg-cloud hover:text-ink'
  const on = 'border border-brand/20 bg-tint font-medium text-brand'
  const views = (key: string) => {
    const c = counts(key)
    return [
      { to: `/app/${key}/backlog`, label: 'Backlog', icon: ListTodo, count: c.backlog },
      { to: `/app/${key}/board`, label: 'Board', icon: KanbanSquare, count: c.board },
      { to: `/app/${key}/list`, label: 'List', icon: List, count: c.list },
      { to: `/app/${key}/releases`, label: 'Releases', icon: Rocket },
    ]
  }

  return (
    <div className="flex h-full flex-col justify-between gap-4 overflow-y-auto p-3">
      <div className="flex flex-col gap-3">
        <Link to="/" className="px-1 pt-1" onClick={onNavigate} aria-label="Tack home"><Logo sub="Engineering workspace" /></Link>

        <div className="flex flex-col gap-1.5">
          <Button className="h-8 w-full" onClick={() => { onNavigate?.(); setCreateOpen(true, project) }}><Plus />Create issue</Button>
          <button type="button" onClick={() => { onNavigate?.(); openPalette() }}
            className="relative flex h-7 w-full items-center rounded-[4px] border border-line bg-cloud/60 pl-7 pr-9 text-left text-[12px] text-placeholder transition-colors hover:bg-cloud">
            <Search className="absolute left-2 size-3.5 text-slate" />Search / jump to…
            <kbd className="absolute right-1.5 rounded-[3px] border border-line bg-paper px-1 font-mono text-[9px] leading-[14px] text-slate">⌘K</kbd>
          </button>
        </div>

        <nav className="flex flex-col gap-0.5 pt-1" aria-label="Personal">
          <div className="label-mono px-2 py-0.5 text-slate">Personal</div>
          <NavLink to="/app/me" onClick={onNavigate} className={({ isActive }) => cx(row, isActive ? on : idle)}>
            <span className="flex items-center gap-2"><UserRound className="size-4" strokeWidth={1.75} />My issues</span>
            <span className="rounded-[3px] border border-line bg-cloud px-1.5 font-mono text-[11px] text-slate">{mine}</span>
          </NavLink>
          <button type="button" onClick={() => setStarOpen(o => !o)} aria-expanded={starOpen} className={cx(row, idle)}>
            <span className="flex items-center gap-2"><Star className="size-4" strokeWidth={1.75} />Starred views</span>
            <ChevronDown className={cx('size-3.5 transition-transform', !starOpen && '-rotate-90')} />
          </button>
          {starOpen && (
            <div className="ml-3 flex flex-col gap-0.5 border-l border-line pl-2">
              {state.starred.map(v => {
                const here = location.pathname === `/app/${v.project}/${v.view}` && sameQuery(location.search, v.query)
                return (
                  <div key={v.id} className="group relative">
                    <Link to={`/app/${v.project}/${v.view}?${v.query}`} onClick={onNavigate} className={cx(row, 'pr-7', here ? on : idle)}>
                      <span className="flex min-w-0 items-center gap-2"><Star className={cx('size-3.5 shrink-0', here ? 'fill-warning text-warning' : 'fill-warning/80 text-warning/80')} /><span className="truncate">{v.name}</span></span>
                      <span className="font-mono text-[11px] text-slate group-hover:invisible">{starCount(v)}</span>
                    </Link>
                    <button type="button" aria-label={`Unstar ${v.name}`} onClick={() => dispatch({ t: 'unstar', id: v.id })}
                      className="absolute right-1.5 top-1/2 hidden -translate-y-1/2 rounded-[3px] p-0.5 text-slate hover:bg-paper hover:text-ink group-hover:block"><X className="size-3.5" /></button>
                  </div>
                )
              })}
              {!state.starred.length && <p className="px-2 py-1.5 text-[12px] text-slate">Filter a board or list, then star it to keep it here.</p>}
            </div>
          )}
        </nav>

        <nav className="flex flex-col gap-1 border-t border-line pt-1.5" aria-label="Projects">
          <div className="label-mono px-2 py-0.5 text-slate">Projects</div>
          {state.projects.map(p => p.key === project ? (
            <div key={p.key} className="overflow-hidden rounded-[4px] border border-line bg-paper">
              <Link to={`/app/${p.key}/board`} onClick={onNavigate} className="flex items-center justify-between border-b border-line/60 px-2.5 py-2 transition-colors hover:bg-wash">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="size-2 shrink-0 rounded-full bg-brand ring-2 ring-brand/20" />
                  <span className="truncate text-[12.5px] font-semibold">{p.name}</span>
                </span>
                <span className="flex shrink-0 items-center gap-1"><span className="rounded-[3px] border border-line bg-cloud px-1 font-mono text-[9px] text-slate">{p.key}</span><ChevronDown className="size-3.5 text-slate" /></span>
              </Link>
              <div className="flex flex-col gap-0.5 bg-wash/40 p-1">
                {views(p.key).map(v => (
                  <NavLink key={v.label} to={v.to} onClick={onNavigate} className={({ isActive }) => cx(row, isActive ? on : idle)}>
                    {({ isActive }) => (<>
                      <span className="flex items-center gap-2"><v.icon className="size-4" strokeWidth={1.75} />{v.label}</span>
                      {v.count !== undefined && <span className={cx('font-mono text-[11px]', isActive ? 'font-medium text-brand' : 'text-slate')}>{v.count}</span>}
                    </>)}
                  </NavLink>
                ))}
                <NavLink to={`/app/${p.key}/settings`} onClick={onNavigate} className={({ isActive }) => cx(row, 'mt-0.5 justify-start gap-2 border-t border-line/50', isActive ? on : idle)}>
                  <Settings className="size-4" strokeWidth={1.75} />Project settings
                </NavLink>
              </div>
            </div>
          ) : (
            <Link key={p.key} to={`/app/${p.key}/board`} onClick={onNavigate}
              className="group flex items-center justify-between rounded-[4px] border border-transparent px-2.5 py-1.5 transition-colors hover:border-line hover:bg-cloud/60">
              <span className="flex min-w-0 items-center gap-2">
                <span className="size-1.5 shrink-0 rounded-full bg-slate/40 group-hover:bg-slate" />
                <span className="truncate text-[13px] font-medium">{p.name}</span>
              </span>
              <span className="flex shrink-0 items-center gap-1.5">
                <span className="rounded-[3px] border border-line bg-cloud px-1 font-mono text-[9px] text-slate">{p.key}</span>
                <span className="font-mono text-[11px] text-slate">{counts(p.key).list}</span>
              </span>
            </Link>
          ))}
        </nav>
      </div>

      <div className="border-t border-line pt-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-auto w-full justify-between gap-2 px-1.5 py-1.5 data-[state=open]:bg-tint">
              <span className="flex min-w-0 items-center gap-2">
                <Avatar user={me} size={24} />
                <span className="min-w-0 text-left">
                  <span className="block truncate text-[12px] font-medium leading-tight">{me?.name}</span>
                  <span className="block truncate font-mono text-[10px] font-normal text-slate">{me?.title}</span>
                </span>
              </span>
              <MoreHorizontal className="size-4 text-slate" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" sideOffset={8} className="w-[232px] p-1.5">
            <DropdownMenuLabel className="flex items-center gap-3 px-2 py-2 font-normal">
              <Avatar user={me} size={36} />
              <span className="min-w-0">
                <span className="block truncate text-[13.5px] font-medium">{me?.name}</span>
                <span className="block truncate font-mono text-[11px] text-slate">{me?.email}</span>
              </span>
            </DropdownMenuLabel>
            <div className="mx-2 mb-1.5 flex items-center gap-1.5">
              <Badge variant="outline" className="h-5 rounded-[4px] border-[#C9D3F6] bg-[#EEF2FD] font-mono text-[10px] text-brand">{me?.role}</Badge>
              <Badge variant="outline" className="h-5 gap-1 rounded-[4px] font-mono text-[10px] font-normal text-slate"><span className="size-1.5 rounded-full bg-success" />Online</Badge>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate('/app/me')}><UserRound />My issues</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate(`/app/${project}/settings`)}><Settings />Project settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => { dispatch({ t: 'signOut' }); navigate('/login') }}><LogOut />Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

/** Same filters, ignoring order and the open issue. */
export function sameQuery(search: string, query: string) {
  const norm = (q: string) => { const p = new URLSearchParams(q); p.delete('issue'); p.sort(); return p.toString() }
  return norm(search) === norm(query)
}

/* The command palette listens for this; anything can open it. */
export const openPalette = () => window.dispatchEvent(new Event('tack:palette'))

export function TopBar({ crumbs, actions }: { crumbs: ReactNode; actions?: ReactNode }) {
  const { setCreateOpen } = useStore()
  const { project } = useParams()
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const location = useLocation()
  const searchable = /\/(board|list|backlog)$|\/me$/.test(location.pathname)

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-line bg-paper px-4 md:px-6">
      <div className="flex min-w-0 items-center gap-2 text-[13px]">{crumbs}</div>
      <div className="flex items-center gap-2">
        {searchable && (
          <label className="relative hidden w-[300px] items-center lg:flex">
            <Search className="pointer-events-none absolute left-2.5 size-4 text-placeholder" />
            <Input
              id="search"
              value={q}
              onChange={e => { const v = e.target.value; setParams(p => { if (v) p.set('q', v); else p.delete('q'); return p }, { replace: true }) }}
              placeholder="Search issues…"
              className="h-[34px] pl-8 text-[13px]"
            />
          </label>
        )}
        {actions}
        <Button className="md:hidden" size="icon" onClick={() => setCreateOpen(true, project)} aria-label="Create issue"><Plus /></Button>
      </div>
    </header>
  )
}

export function Crumb({ project, page }: { project?: string; page: string }) {
  const { state } = useStore()
  const p = state.projects.find(x => x.key === project)
  return (
    <>
      {p && <><span className="truncate text-slate">{p.name}</span><span className="text-line">/</span></>}
      <span className="truncate font-medium">{page}</span>
    </>
  )
}

export default function AppShell({ children }: { children: ReactNode }) {
  const { state } = useStore()
  const [menu, setMenu] = useState(false)
  const location = useLocation()
  useEffect(() => setMenu(false), [location.pathname])

  if (!state.signedIn) return <Navigate to="/login" replace />

  return (
    <div className="flex h-dvh overflow-hidden bg-paper">
      <aside className="hidden w-[240px] shrink-0 border-r border-line md:block"><Sidebar /></aside>
      <Sheet open={menu} onOpenChange={setMenu}>
        <SheetContent side="left" className="w-[270px] p-0">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SheetDescription className="sr-only">Projects and views</SheetDescription>
          <Sidebar onNavigate={() => setMenu(false)} />
        </SheetContent>
      </Sheet>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-12 items-center justify-between border-b border-line px-3 md:hidden">
          <Button variant="ghost" size="icon-sm" onClick={() => setMenu(true)} aria-label="Open menu"><Menu /></Button>
          <LogoMark size={22} />
          <span className="w-8" />
        </div>
        {children}
      </div>
      <IssuePanel />
      <CreateIssue />
      <CommandPalette />
    </div>
  )
}
