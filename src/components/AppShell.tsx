import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ChevronsUpDown, KanbanSquare, List, LogOut, Menu, Plus, Search, Settings, UserRound } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useStore } from '../store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar, Logo, LogoMark, cx } from '@/lib/ui'
import CreateIssue from './CreateIssue'
import IssuePanel from './IssuePanel'
import { ME } from '../data/mock'

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { state, user, dispatch } = useStore()
  const { project = 'WEB' } = useParams()
  const navigate = useNavigate()
  const me = user(ME)
  const counts = (key: string) => state.issues.filter(i => i.project === key && i.status !== 'done').length

  const views = [
    { to: `/app/${project}/board`, label: 'Board', icon: KanbanSquare },
    { to: `/app/${project}/list`, label: 'List', icon: List },
    { to: '/app/me', label: 'My issues', icon: UserRound },
    { to: `/app/${project}/settings`, label: 'Settings', icon: Settings },
  ]

  return (
    <div className="flex h-full flex-col justify-between p-4">
      <div className="flex flex-col gap-6">
        <Link to="/" className="px-1 pt-1" onClick={onNavigate} aria-label="Tack home"><Logo sub="Engineering workspace" /></Link>
        <nav className="flex flex-col gap-0.5" aria-label="Projects">
          <div className="label-mono px-2 py-1 text-slate">Projects</div>
          {state.projects.map(p => {
            const active = p.key === project
            return (
              <Link key={p.key} to={`/app/${p.key}/board`} onClick={onNavigate}
                className={cx('flex items-center justify-between rounded-[4px] px-2.5 py-1.5 text-[13px] transition-colors duration-150',
                  active ? 'bg-tint font-medium text-brand' : 'text-ink hover:bg-tint-hover')}>
                <span className="flex min-w-0 items-center gap-2">
                  <span className={cx('rounded-[3px] px-1 font-mono text-[10px]', active ? 'bg-brand text-paper' : 'bg-cloud text-slate')}>{p.key}</span>
                  <span className="truncate">{p.name}</span>
                </span>
                <span className={cx('font-mono text-[11px]', active ? 'text-brand' : 'text-slate')}>{counts(p.key)}</span>
              </Link>
            )
          })}
        </nav>
        <nav className="flex flex-col gap-0.5 border-t border-line pt-4" aria-label="Views">
          <div className="label-mono px-2 py-1 text-slate">Views</div>
          {views.map(v => (
            <NavLink key={v.label} to={v.to} onClick={onNavigate}
              className={({ isActive }) => cx('flex items-center gap-2.5 rounded-[4px] px-2.5 py-1.5 text-[13px] transition-colors duration-150',
                isActive ? 'bg-tint font-medium text-brand' : 'text-slate hover:bg-tint-hover hover:text-ink')}>
              <v.icon className="size-4" strokeWidth={1.75} />
              {v.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="border-t border-line pt-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-auto w-full justify-between gap-2 px-2 py-1.5 data-[state=open]:bg-tint">
              <span className="flex min-w-0 items-center gap-2.5">
                <Avatar user={me} size={30} />
                <span className="min-w-0 text-left">
                  <span className="block truncate text-[13px] font-medium leading-tight">{me?.name}</span>
                  <span className="block truncate text-[11.5px] font-normal text-slate">{me?.title}</span>
                </span>
              </span>
              <ChevronsUpDown className="size-4 text-slate" />
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

export function TopBar({ crumbs }: { crumbs: ReactNode }) {
  const { setCreateOpen } = useStore()
  const { project } = useParams()
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const location = useLocation()
  const searchable = /\/(board|list)$|\/me$/.test(location.pathname)

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
        <Button onClick={() => setCreateOpen(true, project)}><Plus /><span className="hidden sm:inline">Create issue</span></Button>
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
    </div>
  )
}
