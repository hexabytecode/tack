import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useStore } from '../store'
import { Avatar, Button, Icon, Logo, cx } from '../lib/ui'
import CreateIssue from './CreateIssue'
import IssuePanel from './IssuePanel'
import Toasts from './Toasts'
import { ME } from '../data/mock'

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { state, user, dispatch } = useStore()
  const { project = 'WEB' } = useParams()
  const navigate = useNavigate()
  const me = user(ME)
  const counts = (key: string) => state.issues.filter(i => i.project === key && i.status !== 'done').length

  const views = [
    { to: `/app/${project}/board`, label: 'Board', icon: 'view_kanban' },
    { to: `/app/${project}/list`, label: 'List', icon: 'format_list_bulleted' },
    { to: '/app/me', label: 'My issues', icon: 'assignment_ind' },
    { to: `/app/${project}/settings`, label: 'Settings', icon: 'settings' },
  ]

  return (
    <div className="flex h-full flex-col justify-between p-4">
      <div className="flex flex-col gap-6">
        <Link to="/" className="px-1 py-1" onClick={onNavigate} aria-label="Tack home"><Logo sub="Engineering workspace" /></Link>
        <nav className="flex flex-col gap-0.5" aria-label="Projects">
          <div className="label-mono px-2 py-1 text-slate">Projects</div>
          {state.projects.map(p => {
            const active = p.key === project
            return (
              <Link
                key={p.key}
                to={`/app/${p.key}/board`}
                onClick={onNavigate}
                className={cx('flex items-center justify-between rounded-[4px] px-2.5 py-1.5 text-[13px] transition-colors duration-150',
                  active ? 'bg-tint font-medium text-accent' : 'text-ink hover:bg-tint-hover')}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className={cx('h-1.5 w-1.5 shrink-0 rounded-full', active ? 'bg-accent' : 'bg-line')} />
                  <span className="truncate">{p.name}</span>
                </span>
                <span className={cx('font-mono text-[11px]', active ? 'text-accent' : 'text-slate')}>{counts(p.key)}</span>
              </Link>
            )
          })}
        </nav>
        <nav className="flex flex-col gap-0.5 border-t border-line pt-4" aria-label="Views">
          <div className="label-mono px-2 py-1 text-slate">Views</div>
          {views.map(v => (
            <NavLink
              key={v.label}
              to={v.to}
              onClick={onNavigate}
              className={({ isActive }) => cx('flex items-center gap-2.5 rounded-[4px] px-2.5 py-1.5 text-[13px] transition-colors duration-150',
                isActive ? 'bg-tint font-medium text-accent' : 'text-slate hover:bg-tint-hover hover:text-ink')}
            >
              <Icon name={v.icon} />
              {v.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="flex items-center justify-between border-t border-line pt-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar user={me} size={28} />
          <div className="min-w-0">
            <div className="truncate text-[13px] font-medium leading-tight">{me?.name}</div>
            <div className="flex items-center gap-1 font-mono text-[10px] text-slate"><span className="h-1.5 w-1.5 rounded-full bg-success" />Online</div>
          </div>
        </div>
        <button
          className="rounded-[4px] p-1 text-slate transition-colors hover:bg-cloud hover:text-ink"
          title="Sign out"
          aria-label="Sign out"
          onClick={() => { dispatch({ t: 'signOut' }); navigate('/login') }}
        >
          <Icon name="logout" />
        </button>
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
            <Icon name="search" className="pointer-events-none absolute left-2.5 text-placeholder" />
            <input
              value={q}
              onChange={e => { const v = e.target.value; setParams(p => { if (v) p.set('q', v); else p.delete('q'); return p }, { replace: true }) }}
              placeholder="Search issues…"
              className="h-[34px] w-full rounded-[4px] border border-line bg-paper pl-8 pr-3 text-[13px] placeholder:text-placeholder focus:outline-2 focus:outline-accent"
            />
          </label>
        )}
        <Button onClick={() => setCreateOpen(true, project)}><Icon name="add" className="!text-[16px]" /><span className="hidden sm:inline">Create issue</span></Button>
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
      <aside className="hidden w-[232px] shrink-0 border-r border-line md:block">
        <Sidebar />
      </aside>
      {menu && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button className="anim-fade absolute inset-0 bg-ink/25" aria-label="Close menu" onClick={() => setMenu(false)} />
          <aside className="anim-slide absolute inset-y-0 left-0 w-[260px] border-r border-line bg-paper" style={{ animationName: 'none' }}>
            <Sidebar onNavigate={() => setMenu(false)} />
          </aside>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-12 items-center justify-between border-b border-line px-4 md:hidden">
          <button className="flex items-center gap-2 rounded-[4px] p-1 hover:bg-cloud" onClick={() => setMenu(true)} aria-label="Open menu">
            <Icon name="menu" />
          </button>
          <Logo />
          <span className="w-7" />
        </div>
        {children}
      </div>
      <IssuePanel />
      <CreateIssue />
      <Toasts />
    </div>
  )
}
