import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight, Bot, Check, ChevronDown, ClipboardCopy, FileText, KanbanSquare, ListChecks, Lock,
  MessageSquare, Plug, Plus, Rocket, Search, Star, Terminal, UserRound,
} from 'lucide-react'
import { useStore } from '../store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Kbd } from '@/components/ui/kbd'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar, GoogleG, LogoMark, PriorityBadge, StatusPill, TypeBadge, Wordmark, cx, useReveal } from '@/lib/ui'
import { DragBoard, boardHeight, type DemoCard } from '../components/DragBoard'
import { APP_H, MacBook, SCREEN_W, useScrollScale } from '../components/MacBook'
import { USERS, type Status } from '../data/mock'

const u = (id: string) => USERS.find(x => x.id === id)
const d = (ms: number) => ({ ['--d' as string]: `${ms}ms` }) as CSSProperties

function useOpen() {
  const { state } = useStore()
  const navigate = useNavigate()
  return () => navigate(state.signedIn ? '/app/WEB/board' : '/login')
}

const PRODUCT_MENU: [typeof KanbanSquare, string, string, string][] = [
  [KanbanSquare, 'Board', 'Drag and drop, with a people filter', '#sprints'],
  [ListChecks, 'Backlog & sprints', 'Plan sprints with story points', '#sprints'],
  [Rocket, 'Releases', 'Versions, progress and release notes', '#releases'],
  [Search, '⌘K search & starred views', 'Jump anywhere, save your filters', '#search'],
]

export function Nav() {
  const open = useOpen()
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1232px] items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-10">
          <Link to="/" aria-label="Tack home"><Wordmark height={26} /></Link>
          <nav className="hidden items-center gap-7 text-[14px] text-ink md:flex">
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-auto gap-1 p-0 text-[14px] font-normal hover:bg-transparent data-[state=open]:[&>svg]:rotate-180">Product<ChevronDown className="size-3.5 transition-transform" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[300px] p-1.5">
                {PRODUCT_MENU.map(([I, t, s, href]) => (
                  <DropdownMenuItem key={t} asChild className="items-start gap-3 px-2.5 py-2">
                    <a href={`/${href}`}><I className="mt-0.5 size-4 text-brand" /><span><span className="block text-[13.5px] font-medium text-ink">{t}</span><span className="block text-[12.5px] text-slate">{s}</span></span></a>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Link to="/ai" className="link flex items-center gap-1.5">For AI<Badge variant="outline" className="h-[18px] rounded-[4px] px-1 font-mono text-[9.5px] font-normal uppercase tracking-[0.06em] text-slate">Optional</Badge></Link>
            <a href="/#pricing" className="link">Pricing</a>
            <a href="/#faq" className="link">FAQ</a>
          </nav>
        </div>
        <div className="flex items-center gap-5">
          <Link to="/login" className="link hidden text-[14px] sm:inline">Sign in</Link>
          <Button onClick={open}>Open Tack<ArrowRight /></Button>
        </div>
      </div>
    </header>
  )
}

function Announcement() {
  return (
    <div className="bg-ink text-paper">
      <div className="mx-auto flex max-w-[1232px] flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 text-center text-[13px] md:px-6">
        <Badge className="rounded-[4px] bg-paper px-1.5 font-mono text-[10px] uppercase tracking-[0.06em] text-ink">New</Badge>
        <span className="text-[#B6BACB]">Sprints, releases with release notes, and ⌘K search are now in Tack.</span>
        <a href="#sprints" className="link inline-flex items-center gap-1 font-medium">See what’s new<ArrowRight className="size-3.5" /></a>
      </div>
    </div>
  )
}

/* Email box with a Google option. Sign-in is a demo, so both lead to the sign-in page. */
function SignUp({ dark, cta = 'Start free' }: { dark?: boolean; cta?: string }) {
  const navigate = useNavigate()
  const go = (e?: FormEvent) => { e?.preventDefault(); navigate('/login') }
  return (
    <form onSubmit={go} className={cx('mx-auto flex w-full max-w-[460px] flex-col gap-2 rounded-[8px] border p-1.5 sm:flex-row', dark ? 'border-white/15 bg-white/5' : 'border-line bg-wash')}>
      <Input type="email" aria-label="Work email" placeholder="you@company.com"
        className={cx('h-10 flex-1 border-0 shadow-none focus-visible:ring-0', dark ? 'text-paper placeholder:text-[#8E93A8]' : 'bg-paper')} />
      <Button type="submit" size="lg" className={cx('h-10', dark && 'bg-brand hover:bg-brand/90')}>{cta}<ArrowRight /></Button>
    </form>
  )
}

/* ── Hero board: the app's board drawn at a fixed size inside the laptop, where a cursor
   picks a card up and carries it to the next column every few seconds. */
const HERO_CARDS: DemoCard[] = [
  { key: 'WEB-145', title: 'Audit accessibility for billing flow', type: 'task', prio: 'medium', who: 'sk', col: 'todo' },
  { key: 'WEB-144', title: 'Safari flexbox gap bug', type: 'bug', prio: 'low', who: 'mr', col: 'todo' },
  { key: 'WEB-142', title: 'Checkout button overlaps footer on mobile', type: 'bug', prio: 'high', who: 'al', col: 'progress' },
  { key: 'WEB-139', title: 'Add VAT number to invoices', type: 'task', prio: 'high', who: 'jd', col: 'progress' },
  { key: 'WEB-135', title: 'Optimise hero illustration size', type: 'task', prio: 'medium', who: 'mr', col: 'review' },
  { key: 'WEB-131', title: 'Set up preview deployments', type: 'task', prio: 'medium', who: 'jd', col: 'done' },
  { key: 'WEB-132', title: 'Fix cookie banner overlap', type: 'bug', prio: 'low', who: 'al', col: 'done' },
  { key: 'WEB-146', title: 'Dark mode for email templates', type: 'task', prio: 'low', who: 'jd', col: 'todo' },
  { key: 'WEB-147', title: 'Search ignores archived projects', type: 'bug', prio: 'medium', who: 'sk', col: 'todo' },
  { key: 'WEB-143', title: 'Translate onboarding into Spanish', type: 'task', prio: 'medium', who: 'mr', col: 'progress' },
  { key: 'WEB-136', title: 'Invoice PDF cuts off long addresses', type: 'bug', prio: 'high', who: 'sk', col: 'review' },
  { key: 'WEB-128', title: 'Move status emails to a weekly digest', type: 'task', prio: 'low', who: 'jd', col: 'done' },
  { key: 'WEB-127', title: 'Login page logo is blurry on retina', type: 'bug', prio: 'low', who: 'mr', col: 'done' },
]
const HERO_HOPS: [string, Status][] = [
  ['WEB-139', 'review'], ['WEB-135', 'done'], ['WEB-144', 'progress'], ['WEB-142', 'review'],
  ['WEB-142', 'progress'], ['WEB-144', 'todo'], ['WEB-135', 'review'], ['WEB-139', 'progress'],
]
const BOARD_W = SCREEN_W - 210
const HERO_ROWS = Math.floor((APP_H - 48 - boardHeight(0)) / (boardHeight(1) - boardHeight(0)))

function SideRow({ icon: I, label, count, on }: { icon: typeof Star; label: string; count?: ReactNode; on?: boolean }) {
  return (
    <div className={cx('flex items-center justify-between rounded-[4px] px-2 py-1.5 text-[12.5px]', on ? 'bg-tint font-medium text-brand' : 'text-slate')}>
      <span className="flex items-center gap-2"><I className="size-3.5" />{label}</span>
      {count != null && <span className="font-mono text-[10.5px] text-slate">{count}</span>}
    </div>
  )
}

function HeroBoard() {
  return (
    <MacBook show={0.56}>
      <div className="flex h-full text-left">
        <div className="flex w-[210px] shrink-0 flex-col gap-4 border-r border-line p-4">
          <Wordmark height={22} />
          <div className="flex flex-col gap-0.5">
            <div className="label-mono px-2 py-1 text-[10px] text-slate">Personal</div>
            <SideRow icon={UserRound} label="My issues" count={12} />
            <SideRow icon={Star} label="Starred views" count={2} />
          </div>
          <div className="flex flex-col gap-0.5 border-t border-line pt-3">
            <div className="label-mono px-2 py-1 text-[10px] text-slate">Projects</div>
            <div className="rounded-[6px] border border-line p-1">
              <div className="flex items-center gap-1.5 px-1.5 py-1 text-[12.5px] font-medium"><span className="rounded-[3px] bg-brand px-1 font-mono text-[9.5px] text-paper">WEB</span>Website relaunch</div>
              <SideRow icon={KanbanSquare} label="Board" on />
              <SideRow icon={ListChecks} label="Backlog" count={9} />
              <SideRow icon={Rocket} label="Releases" count="v1.4" />
            </div>
            {[['APP', 'Mobile app', 8], ['BO', 'Back office', 5]].map(([k, l, c]) => (
              <div key={k} className="flex items-center justify-between px-2 py-1.5 text-[12.5px]">
                <span className="flex items-center gap-1.5"><span className="rounded-[3px] bg-cloud px-1 font-mono text-[9.5px] text-slate">{k}</span>{l}</span>
                <span className="font-mono text-[10.5px] text-slate">{c}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex h-12 items-center justify-between border-b border-line px-4">
            <span className="flex items-center gap-2 text-[13px]"><span className="text-slate">Website relaunch</span><span className="text-line">/</span><span className="font-medium">Board</span><Badge variant="outline" className="h-[18px] rounded-[4px] border-line px-1.5 font-mono text-[10px] font-normal text-slate">Sprint 14</Badge></span>
            <span className="flex h-7 items-center gap-1 rounded-[4px] bg-ink px-2.5 text-[12px] font-medium text-paper"><Plus className="size-3.5" />Create issue</span>
          </div>
          <div className="h-[calc(100%-48px)] bg-wash"><DragBoard columns={['todo', 'progress', 'review', 'done']} initial={HERO_CARDS} hops={HERO_HOPS} width={BOARD_W} rows={HERO_ROWS} interval={3600} startDelay={1200} /></div>
        </div>
      </div>
    </MacBook>
  )
}

/* Badges beside the laptop. They grow as you scroll, like the laptop, from the side that faces it. */
function HeroTag({ side, children }: { side: 'left' | 'right'; children: ReactNode }) {
  const ref = useScrollScale<HTMLDivElement>(0.85, 1.15)
  return (
    <div ref={ref} className={cx('pointer-events-none absolute z-10 hidden items-center gap-2 rounded-full border border-line bg-paper px-3 py-1.5 text-[12.5px] shadow-[0_8px_24px_rgba(0,0,0,.08)] will-change-transform md:flex',
      side === 'left' ? 'left-[3%] top-[6%] origin-right' : 'right-[3%] top-[2%] origin-left')}>
      {children}
    </div>
  )
}

const TICKER = [
  ['pp', 'moved', 'WEB-142', 'to In review'], ['sk', 'started', 'Sprint 14', ''], ['jd', 'created', 'BO-14', ''],
  ['al', 'assigned', 'WEB-145', 'to Samira'], ['mr', 'shipped', 'WEB v1.3', ''], ['cm', 'set priority on', 'APP-34', 'to High'],
  ['agent', 'moved', 'WEB-139', 'to In review'], ['pp', 'mentioned you on', 'WEB-140', ''],
]
function Ticker() {
  const row = TICKER.map(([who, verb, key, rest], i) => (
    <span key={i} className="flex shrink-0 items-center gap-2 px-6 font-mono text-[12px] text-slate">
      {who === 'agent'
        ? <span className="flex items-center gap-1 text-brand"><Bot className="size-3.5" />Claude</span>
        : <span className="flex items-center gap-1.5 text-ink"><Avatar user={u(who)} size={18} />{u(who)?.name.split(' ')[0]}</span>}
      {verb} <span className="text-ink">{key}</span> {rest}
      <span className="pl-6 text-line">·</span>
    </span>
  ))
  return (
    <div className="ticker relative overflow-hidden border-y border-line bg-paper py-3" aria-label="Recent activity">
      <div className="ticker-track flex w-max">{row}{row}</div>
    </div>
  )
}

/* ── Count-up for the facts strip */
function CountUp({ to, prefix = '', suffix = '' }: { to: number; prefix?: string; suffix?: string }) {
  const [v, setV] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setV(to); return }
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      const t0 = performance.now()
      const step = (t: number) => {
        const p = Math.min(1, (t - t0) / 900)
        setV(Math.round(to * (1 - Math.pow(1 - p, 3))))
        if (p < 1) requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    }, { threshold: 0.5 })
    io.observe(el)
    return () => io.disconnect()
  }, [to])
  return <span ref={ref}>{prefix}{v}{suffix}</span>
}

function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('label-mono text-brand', className)}>{children}</div>
}

function Tag({ children }: { children: ReactNode }) {
  return <Badge variant="outline" className="rounded-[4px] border-line bg-wash px-1.5 font-mono text-[10px] font-normal uppercase tracking-[0.06em] text-slate">{children}</Badge>
}

/* ── Feature mocks. They reuse the app's own chips; buttons inside them are pictures, not controls. */
function SprintMock() {
  const rows: [string, string, Status, number][] = [
    ['WEB-142', 'Checkout button overlaps footer on mobile', 'progress', 5],
    ['WEB-139', 'Add VAT number to invoices', 'review', 3],
  ]
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-[6px] border border-line bg-paper p-4 shadow-[0_8px_24px_rgba(0,0,0,.05)]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-[13.5px]"><Badge className="rounded-[4px] bg-brand px-1.5 font-mono text-[10px]">S14</Badge><span className="font-medium">Sprint 14</span><span className="font-mono text-[11px] text-slate">6 days left</span></span>
          <span className="flex items-center gap-2"><span className="font-mono text-[11px] text-slate">14 / 24 pts</span><Button size="sm" tabIndex={-1} aria-hidden className="pointer-events-none h-7 text-[12px]">Complete sprint</Button></span>
        </div>
        <div className="mt-3 flex h-1.5 overflow-hidden rounded-full bg-cloud">
          <span className="grow h-full w-[42%] bg-success" style={d(200)} />
          <span className="grow h-full w-[17%] bg-brand" style={d(500)} />
          <span className="grow h-full w-[12%] bg-warning" style={d(800)} />
        </div>
        <div className="mt-3 flex flex-col divide-y divide-line border-t border-line">
          {rows.map(([k, t, s, pts], i) => (
            <div key={k} className="reveal flex items-center gap-3 py-2.5" style={d(300 + i * 120)}>
              <span className="w-14 shrink-0 font-mono text-[11px] text-slate">{k}</span>
              <span className="min-w-0 flex-1 truncate text-[13px]">{t}</span>
              <span className="hidden sm:inline-flex"><StatusPill status={s} size="sm" /></span>
              <span className="w-10 text-right font-mono text-[11px] text-slate">{pts} pts</span>
            </div>
          ))}
        </div>
      </div>
      <div className="reveal flex items-center justify-between gap-2 rounded-[6px] border border-dashed border-line bg-paper px-4 py-3" style={d(600)}>
        <span className="flex items-center gap-2 text-[13px]"><Badge variant="outline" className="rounded-[4px] px-1.5 font-mono text-[10px] text-slate">S15</Badge><span className="whitespace-nowrap">Sprint 15</span><span className="hidden font-mono text-[11px] text-slate sm:inline">planned · 2 issues · 4 pts</span></span>
        <Button size="sm" variant="secondary" tabIndex={-1} aria-hidden className="pointer-events-none h-7 text-[12px]">Start sprint</Button>
      </div>
    </div>
  )
}

function ReleaseMock() {
  return (
    <div className="rounded-[6px] border border-line bg-paper p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-[13.5px]"><span className="size-1.5 rounded-full bg-brand" /><span className="font-mono font-medium">v1.4</span><span className="font-mono text-[11px] text-slate">target 28 Nov</span></span>
        <Button size="sm" tabIndex={-1} aria-hidden className="pointer-events-none h-7 text-[12px]"><Rocket />Ship v1.4</Button>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-cloud"><span className="grow block h-full w-3/4 bg-success" style={d(200)} /></div>
      <div className="mt-3 rounded-[4px] border border-line bg-wash p-3">
        <div className="label-mono flex items-center gap-1.5 text-[10px] text-slate"><FileText className="size-3" />Release notes</div>
        <ul className="mt-2 flex flex-col gap-1 font-mono text-[11.5px]">
          {['Improvements · Multi-currency checkout (WEB-145)', 'Fixes · Checkout button on small phones (WEB-142)', 'Note · 2 issues still open'].map((t, i) => (
            <li key={t} className="reveal" style={d(400 + i * 150)}>• {t}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function SearchMock() {
  return (
    <div className="overflow-hidden rounded-[6px] border border-line bg-paper">
      <div className="flex h-11 items-center gap-2 border-b border-line px-3 text-[13.5px]">
        <Search className="size-4 text-slate" />
        <span className="type-on">checkout</span><span className="h-4 w-px animate-pulse bg-ink" />
        <Kbd className="ml-auto">Esc</Kbd>
      </div>
      <div className="after-type p-1.5">
        <div className="label-mono px-2 py-1 text-[10px] text-slate">Issues</div>
        <div className="flex items-center gap-2 rounded-[4px] bg-tint px-2 py-2 text-[13px]"><span className="font-mono text-[11px] text-brand">WEB-142</span><span className="min-w-0 flex-1 truncate">Checkout button overlaps footer</span><Kbd>↵</Kbd></div>
        <div className="flex items-center gap-2 px-2 py-2 text-[13px]"><span className="font-mono text-[11px] text-slate">WEB-145</span><span className="min-w-0 flex-1 truncate">Multi-currency checkout</span><TypeBadge type="task" compact /></div>
        <div className="label-mono mt-1 px-2 py-1 text-[10px] text-slate">Starred views</div>
        <div className="flex items-center gap-2 px-2 py-2 text-[13px]"><Star className="size-3.5 fill-warning text-warning" /><span className="flex-1">My high-priority bugs</span><span className="font-mono text-[11px] text-slate">4 issues</span></div>
      </div>
    </div>
  )
}

/* People filter: picks one teammate after another, the way you would in a standup. */
function PeopleMock() {
  const ids = ['sk', 'jd', 'al', 'mr']
  const [on, setOn] = useState(0)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setInterval(() => setOn(x => (x + 1) % ids.length), 1800)
    return () => clearInterval(t)
  }, [ids.length])
  return (
    <div className="flex items-center gap-3">
      <span className="label-mono text-[10px] text-slate">People</span>
      <span className="flex">
        {ids.map((id, i) => (
          <span key={id} className={cx('-ml-1.5 rounded-full ring-2 ring-paper transition-transform duration-300 first:ml-0', i === on && 'z-10 -translate-y-0.5 ring-brand')}><Avatar user={u(id)} size={28} /></span>
        ))}
      </span>
    </div>
  )
}

function PanelMock() {
  return (
    <div className="w-full max-w-[280px] rounded-[6px] border border-line bg-paper p-3 text-left shadow-[0_8px_24px_rgba(0,0,0,.06)]">
      <div className="flex items-center justify-between"><span className="font-mono text-[11px] text-brand">WEB-142</span><PriorityBadge priority="high" compact /></div>
      <div className="mt-1.5 text-[13px] font-medium">Checkout button overlaps footer</div>
      <div className="mt-2 flex items-center gap-1.5 font-mono text-[11px] text-slate"><MessageSquare className="size-3" />2 comments · @Samira</div>
    </div>
  )
}

function SmallCard({ title, body, mock, delay }: { title: string; body: string; mock: ReactNode; delay: number }) {
  return (
    <div className="reveal flex flex-col rounded-[8px] border border-line bg-paper p-4" style={d(delay)}>
      <div className="flex h-[132px] items-center justify-center rounded-[6px] bg-wash px-4">{mock}</div>
      <h3 className="mt-4 text-[16px] font-medium">{title}</h3>
      <p className="mt-1 text-[13.5px] leading-relaxed text-slate">{body}</p>
    </div>
  )
}

const AI_CARDS: [typeof Plug, string, string, string, string][] = [
  [Plug, '01 / MCP', 'Connect Claude or Cursor', 'One command and a personal key. Your AI can search, read, create and update issues.', 'claude mcp add tack …/mcp'],
  [FileText, '02 / llms.txt', 'Short guides your AI can read', 'A tiny index plus one file per topic, so your AI reads only what it needs.', '/llms.txt'],
  [Terminal, '03 / API', 'A plain REST API', 'Create issues from your build pipeline or a script, with the same rules as the app.', 'POST /api/issues'],
  [ClipboardCopy, '04 / Copy for AI', 'Copy any issue for AI', 'One button turns an issue into clean text you can paste into any chat.', 'Copy for AI'],
]

const PLANS = [
  { name: 'Starter', price: 2, blurb: 'For small teams getting off spreadsheets.', features: ['Board, list and My issues', 'Backlog, sprints and story points', '⌘K search', 'Comments with Markdown and @mentions'] },
  { name: 'Team', price: 5, blurb: 'Everything a product team needs, nothing it doesn’t.', features: ['Everything in Starter', 'Releases and release notes', 'Starred views', 'AI connections: Claude, Cursor, API', 'Help moving over from Jira'], featured: true },
  { name: 'Business', price: 10, blurb: 'For larger teams that need more control.', features: ['Everything in Team', 'Admin roles and member controls', 'Export history for audits', 'Priority support'] },
]

const FAQ: [string, string][] = [
  ['What does it cost?', 'From $2 per person per month. Most teams pick Team at $5, which adds releases, starred views and the AI connections. That’s about an eighth of what we pay for Jira today.'],
  ['Can we bring our issues over from Jira?', 'Yes. We move your open issues over once, when you switch. Closed ones can stay where they are.'],
  ['Who can see our projects?', 'Only people signed in with your company Google account, and only the projects they’ve been added to.'],
  ['Does it work on my phone?', 'Yes, it works in your phone’s browser. The board scrolls sideways one column at a time.'],
  ['Do I have to use the AI features?', 'No. They’re off until someone connects an AI tool. Everything in Tack works with plain clicks.'],
]

export default function Landing() {
  const open = useOpen()
  const facts = useReveal<HTMLDivElement>()
  const product = useReveal<HTMLDivElement>()
  const ai = useReveal<HTMLDivElement>()
  const pricing = useReveal<HTMLDivElement>()
  const why = useReveal<HTMLDivElement>()
  const faq = useReveal<HTMLDivElement>()
  const cta = useReveal<HTMLDivElement>()

  return (
    <div className="min-h-dvh bg-paper">
      <Announcement />
      <Nav />

      <section className="relative mx-auto max-w-[1232px] overflow-hidden px-4 pt-14 text-center md:px-6 md:pt-20">
        <Badge variant="outline" className="anim-rise gap-2 rounded-full border-line px-3 py-1 font-normal">
          <span className="size-1.5 rounded-full bg-brand" /><span className="label-mono text-[10.5px] text-ink">Tack</span><span className="text-line">|</span><span className="text-[12.5px] text-slate">A calm alternative to Jira</span>
        </Badge>
        <h1 className="anim-rise mx-auto mt-6 max-w-[860px] text-[40px] font-medium leading-[1.04] tracking-[-0.03em] [text-wrap:balance] md:text-[64px]" style={{ animationDelay: '60ms' }}>
          All the engineering rigor.<br className="hidden sm:inline" /> None of the Jira ceremony.
        </h1>
        <p className="anim-rise mx-auto mt-6 max-w-[580px] text-[17px] leading-relaxed text-slate md:text-[19px]" style={{ animationDelay: '120ms' }}>
          A board, a backlog with sprints, releases and ⌘K search, in one calm workspace. Sign in with your company Google account and start.
        </p>
        <div className="anim-rise mt-9" style={{ animationDelay: '180ms' }}>
          <SignUp />
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[13px] text-slate">
            <span>or</span>
            <Button variant="secondary" size="sm" onClick={open} className="gap-2"><GoogleG />Continue with Google</Button>
            <span className="font-mono text-[11px]">No card required</span>
          </div>
        </div>
        <div className="anim-rise relative mx-auto mt-14 max-w-[1180px]" style={{ animationDelay: '240ms' }}>
          <HeroBoard />
          <HeroTag side="left"><span className="size-1.5 animate-pulse rounded-full bg-brand" /><span className="font-medium">Sprint 14</span><span className="font-mono text-[11px] text-slate">6 days left</span></HeroTag>
          <HeroTag side="right"><Kbd>⌘K</Kbd><span className="text-slate">Jump to any issue, release or view</span></HeroTag>
        </div>
      </section>

      <Ticker />

      <section ref={facts} className="mx-auto max-w-[1232px] px-4 py-20 md:px-6">
        <div className="reveal text-center">
          <Eyebrow>Simple by design</Eyebrow>
          <h2 className="mt-3 text-[28px] font-medium tracking-[-0.02em] md:text-[34px]">Built for teams tired of enterprise bloat.</h2>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
          {([
            [<CountUp to={4} />, 'board columns', 'To do · In progress · Review · Done'],
            [<CountUp to={1} />, 'click to sign in', 'Your company Google account'],
            [<CountUp to={0} />, 'AI unless you ask', 'People first, AI off by default'],
            [<CountUp to={2} prefix="$" />, 'per person', 'A month, on the Starter plan'],
          ] as const).map(([num, unit, sub], i) => (
            <div key={unit} className="reveal rounded-[8px] border border-line bg-paper px-5 py-6 text-center" style={d(i * 100)}>
              <div className="font-mono text-[34px] font-medium tracking-tight">{num}</div>
              <div className="label-mono mt-1 text-[10.5px] text-ink">{unit}</div>
              <p className="mt-2 text-[13px] text-slate">{sub}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="product" ref={product} className="scroll-mt-16 border-t border-line bg-wash">
        <div className="mx-auto max-w-[1232px] px-4 py-24 md:px-6">
          <div className="reveal max-w-[680px]">
            <Eyebrow>Core workflow</Eyebrow>
            <h2 className="mt-3 text-[34px] font-medium leading-tight tracking-[-0.02em] [text-wrap:balance] md:text-[42px]">Everything you need to ship. Nothing to distract from it.</h2>
            <p className="mt-4 text-[16px] leading-relaxed text-slate">From sprint planning to release notes, Tack keeps the work in view and the tool out of the way.</p>
          </div>

          <div id="sprints" className="reveal mt-12 grid scroll-mt-24 grid-cols-[minmax(0,1fr)] items-center gap-8 rounded-[10px] border border-line bg-paper p-6 md:grid-cols-2 md:gap-12 md:p-8">
            <div className="max-w-[460px]">
              <Tag>Backlog & sprints</Tag>
              <h3 className="mt-4 text-[26px] font-medium leading-tight tracking-[-0.02em]">Plan the sprint, point the work, ship it.</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-slate">Drag issues from the backlog into the next sprint, give them story points, and start it. The board shows only what’s in the running sprint.</p>
              <ul className="mt-5 flex flex-col gap-2 text-[14px]">
                {['Running sprint with days left and a points bar', 'Drag to plan, or move many issues at once', 'Complete a sprint and carry open work over'].map(t => <li key={t} className="flex items-start gap-2"><Check className="mt-0.5 size-4 shrink-0 text-brand" />{t}</li>)}
              </ul>
            </div>
            <SprintMock />
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div id="releases" className="reveal flex scroll-mt-24 flex-col rounded-[10px] border border-line bg-paper p-6" style={d(100)}>
              <Tag>Releases</Tag>
              <h3 className="mt-4 text-[22px] font-medium tracking-[-0.01em]">Versions with release notes written for you.</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-slate">Group finished work into a version with a target date and a lead. When you ship, Tack drafts the notes from the issues inside.</p>
              <div className="mt-6 flex-1"><ReleaseMock /></div>
              <div className="mt-5 flex justify-between border-t border-line pt-4 font-mono text-[11px] text-slate"><span>Ship with undo</span><span>Changelog for every version</span></div>
            </div>
            <div id="search" className="reveal flex scroll-mt-24 flex-col rounded-[10px] border border-line bg-paper p-6" style={d(200)}>
              <Tag>Search & starred views</Tag>
              <h3 className="mt-4 text-[22px] font-medium tracking-[-0.01em]">⌘K to jump anywhere. Star the views you use.</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-slate">Find any issue, project or view from the keyboard. Save a filter, like your high-priority bugs, and it sits in the sidebar with a live count.</p>
              <div className="mt-6 flex-1"><SearchMock /></div>
              <div className="mt-5 flex justify-between border-t border-line pt-4 font-mono text-[11px] text-slate"><span>↑ ↓ to move, ↵ to open</span><span>⌘↵ opens beside you</span></div>
            </div>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <SmallCard delay={100} title="Issues open beside the board" body="Click a card and its details slide in from the side: Markdown comments, @mentions and history, without losing your place." mock={<PanelMock />} />
            <SmallCard delay={200} title="Filter by people" body="Tap one or more faces to see only their work. Handy for standups and one-to-ones." mock={<PeopleMock />} />
            <SmallCard delay={300} title="Company Google sign-in" body="No passwords to forget. Your team signs in with their work Google account, and only they can get in." mock={<span className="flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-1.5 text-[13px]"><GoogleG />you@company.com<span className="size-1.5 rounded-full bg-success" /></span>} />
          </div>
        </div>
      </section>

      <section id="ai" ref={ai} className="scroll-mt-16 bg-ink text-paper">
        <div className="mx-auto max-w-[1232px] px-4 py-24 text-center md:px-6">
          <Badge variant="outline" className="reveal gap-2 rounded-full border-white/15 px-3 py-1 font-mono text-[10.5px] font-normal uppercase tracking-[0.06em] text-[#B6BACB]"><span className="size-1.5 rounded-full bg-brand" />Optional · people come first</Badge>
          <h2 className="reveal mx-auto mt-5 max-w-[760px] font-mono text-[30px] font-medium leading-tight tracking-[-0.02em] md:text-[44px]" style={d(80)}>Works with your AI,<br /><span className="text-[#8E93A8]">if and when you want it.</span></h2>
          <p className="reveal mx-auto mt-5 max-w-[560px] text-[16px] leading-relaxed text-[#B6BACB]" style={d(160)}>No bots tagging you, no summaries cluttering the screen. When someone does want help from Claude or Cursor, it reads and updates issues the way you do, and every change it makes is labelled.</p>
          <div className="mt-12 grid gap-4 text-left sm:grid-cols-2 lg:grid-cols-4">
            {AI_CARDS.map(([I, e, t, b, code], i) => (
              <div key={e} className="reveal flex flex-col justify-between gap-6 rounded-[8px] border border-white/10 bg-white/[0.04] p-5" style={d(200 + i * 100)}>
                <div>
                  <div className="label-mono flex items-center gap-1.5 text-[#8E93A8]"><I className="size-3.5 text-brand-soft" />{e}</div>
                  <h3 className="mt-3 text-[17px] font-medium">{t}</h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-[#B6BACB]">{b}</p>
                </div>
                <code className="truncate border-t border-white/10 pt-3 font-mono text-[11px] text-brand-soft">{code}</code>
              </div>
            ))}
          </div>
          <div className="reveal mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-white/10 px-5 py-3 text-left text-[13px] text-[#B6BACB]" style={d(600)}>
            <span className="flex items-center gap-2"><Lock className="size-3.5 shrink-0" />Nothing is shared with an AI tool unless someone on your team connects one.</span>
            <Link to="/ai" className="link inline-flex items-center gap-1 text-paper">Read the AI guide<ArrowRight className="size-3.5" /></Link>
          </div>
        </div>
      </section>

      <section id="pricing" ref={pricing} className="mx-auto max-w-[1232px] scroll-mt-16 px-4 py-24 md:px-6">
        <div className="reveal mx-auto max-w-[620px] text-center">
          <Eyebrow>Pricing</Eyebrow>
          <h2 className="mt-3 text-[34px] font-medium leading-tight tracking-[-0.02em] md:text-[42px]">A fraction of Jira’s bill.</h2>
          <p className="mt-4 text-[16px] leading-relaxed text-slate">Pay for the people who use it, billed monthly. Change plans whenever you like.</p>
        </div>
        <div className="mx-auto mt-12 grid max-w-[1040px] gap-4 md:grid-cols-3">
          {PLANS.map((p, i) => (
            <div key={p.name} className={cx('reveal relative flex flex-col rounded-[8px] border bg-paper p-6 transition-transform duration-200 hover:-translate-y-1', p.featured ? 'border-ink shadow-[0_24px_60px_-30px_rgba(0,0,0,.3)]' : 'border-line')} style={d(i * 100)}>
              {p.featured && <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-ink font-mono text-[10px] uppercase tracking-[0.06em]">Most teams</Badge>}
              <div className={cx('label-mono', p.featured ? 'text-brand' : 'text-slate')}>{p.name}</div>
              <div className="mt-3 flex items-baseline gap-1.5"><span className="font-mono text-[40px] font-medium tracking-tight">${p.price}</span><span className="text-[13px] text-slate">per person / month</span></div>
              <p className="mt-2 text-[13.5px] text-slate">{p.blurb}</p>
              <ul className="mt-6 flex flex-1 flex-col gap-2.5 border-t border-line pt-5 text-[14px]">
                {p.features.map(f => <li key={f} className="flex items-start gap-2"><Check className={cx('mt-0.5 size-4 shrink-0', p.featured ? 'text-brand' : 'text-ink')} />{f}</li>)}
              </ul>
              <Button className="mt-8 w-full" variant={p.featured ? 'default' : 'secondary'} onClick={open}>Try {p.name}</Button>
            </div>
          ))}
        </div>

        <div className="reveal mx-auto mt-6 grid max-w-[1040px] grid-cols-[minmax(0,1fr)] items-center gap-6 rounded-[8px] border border-line bg-wash p-6 md:grid-cols-[minmax(0,1fr)_auto]" style={d(300)}>
          <div>
            <div className="label-mono text-ink">Switching from Jira</div>
            <p className="mt-2 max-w-[520px] text-[14.5px] leading-relaxed text-slate">We move your open issues over once, when you switch. Closed ones can stay where they are. For a 28-person team, here’s the difference:</p>
          </div>
          <div className="grid grid-cols-2 gap-6 border-line md:border-l md:pl-6">
            <div>
              <div className="label-mono text-[10.5px] text-slate">Jira today</div>
              <div className="mt-1 font-mono text-[20px] text-slate sm:text-[24px]"><span className="relative inline-block whitespace-nowrap">$1,120 / mo<span className="strike-line" /></span></div>
            </div>
            <div>
              <div className="label-mono text-[10.5px] text-brand">Tack Team</div>
              <div className="zero mt-1 whitespace-nowrap font-mono text-[20px] text-ink sm:text-[24px]">$140 / mo</div>
            </div>
          </div>
        </div>
        <p className="reveal mt-6 text-center font-mono text-[11px] text-slate">Proposed pricing for the pitch. Jira Standard and Premium cost far more per seat.</p>
      </section>

      <section ref={why} className="border-y border-line bg-wash">
        <div className="mx-auto max-w-[1232px] px-4 py-24 md:px-6">
          <div className="reveal mx-auto max-w-[880px] rounded-[10px] border border-line bg-paper p-8 md:p-12">
            <Eyebrow>Why we built it</Eyebrow>
            <p className="mt-4 text-[26px] font-medium leading-tight tracking-[-0.02em] [text-wrap:balance] md:text-[34px]">“Issue trackers got slow when they turned into admin consoles.”</p>
            <div className="mt-6 grid gap-6 text-[15px] leading-relaxed text-slate md:grid-cols-2">
              <p>Most teams use a fraction of what Jira offers, and still pay for all of it in money, setup and clicks. Workflows, schemes and required fields pile up until moving a card feels like paperwork.</p>
              <p>Tack keeps what a product team actually uses: a board, a backlog with sprints, releases and a fast way to find things. Everything else stays out of the way.</p>
            </div>
            <div className="mt-8 flex items-center gap-3 border-t border-line pt-6">
              <LogoMark size={32} />
              <div><div className="text-[14px] font-medium">Tack</div><div className="text-[12.5px] text-slate">The calm issue tracker</div></div>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" ref={faq} className="scroll-mt-16">
        <div className="mx-auto max-w-[760px] px-4 py-24 md:px-6">
          <div className="reveal text-center">
            <h2 className="text-[34px] font-medium tracking-[-0.02em]">Common questions</h2>
            <p className="mt-2 text-[15px] text-slate">Straight answers about features, switching and AI.</p>
          </div>
          <Accordion type="single" collapsible className="reveal mt-10 flex flex-col gap-3">
            {FAQ.map(([q, a], i) => (
              <AccordionItem key={q} value={`q${i}`} className="rounded-[8px] border border-line px-5 last:border-b">
                <AccordionTrigger className="py-4 text-[15.5px] font-medium hover:no-underline">{q}</AccordionTrigger>
                <AccordionContent className="pb-4 text-[14.5px] leading-relaxed text-slate">{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section ref={cta} className="bg-ink text-paper">
        <div className="mx-auto max-w-[1232px] px-4 py-20 text-center md:px-6">
          <div className="reveal label-mono text-[#8E93A8]">Ready in a minute · <span className="text-brand-soft">no setup</span></div>
          <h2 className="reveal mt-4 text-[34px] font-medium tracking-[-0.02em] [text-wrap:balance] md:text-[48px]" style={d(80)}>Give your team back its focus.</h2>
          <p className="reveal mx-auto mt-4 max-w-[480px] text-[16px] text-[#B6BACB]" style={d(160)}>A board, sprints and releases, without Jira’s weight. Open it and move your first card.</p>
          <div className="reveal mt-8" style={d(240)}><SignUp dark cta="Get started" /></div>
          <div className="reveal mt-4 flex flex-wrap justify-center gap-x-5 gap-y-1 text-[13px] text-[#B6BACB]" style={d(300)}>
            <span className="flex items-center gap-1.5"><Check className="size-3.5 text-brand-soft" />Google sign-in</span>
            <span className="flex items-center gap-1.5"><Check className="size-3.5 text-brand-soft" />No card required</span>
          </div>
        </div>
      </section>

      <footer className="bg-wash px-4 py-10 md:px-6">
        <div className="mx-auto grid max-w-[1232px] gap-10 rounded-[10px] border border-line bg-paper p-8 md:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
          <div>
            <Wordmark height={26} />
            <p className="mt-3 max-w-[300px] text-[13.5px] text-slate">The calm issue tracker for product teams.</p>
          </div>
          <div className="flex flex-col gap-2 text-[13.5px]"><div className="label-mono mb-1">Product</div><Link to="/app/WEB/board" className="link w-fit text-slate">Board</Link><Link to="/app/WEB/backlog" className="link w-fit text-slate">Backlog & sprints</Link><Link to="/app/WEB/releases" className="link w-fit text-slate">Releases</Link><Link to="/app/me" className="link w-fit text-slate">My issues</Link></div>
          <div className="flex flex-col gap-2 text-[13.5px]"><div className="label-mono mb-1">AI</div><Link to="/ai" className="link w-fit text-slate">AI guide</Link><a href="/llms.txt" className="link w-fit text-slate">llms.txt</a><a href="#ai" className="link w-fit text-slate">MCP and API</a></div>
          <div className="flex flex-col gap-2 text-[13.5px]"><div className="label-mono mb-1">Tack</div><a href="#pricing" className="link w-fit text-slate">Pricing</a><a href="#faq" className="link w-fit text-slate">FAQ</a><Link to="/login" className="link w-fit text-slate">Sign in</Link></div>
        </div>
        <div className="mx-auto mt-5 max-w-[1232px] px-2 font-mono text-[11px] text-slate">© 2026 Tack. A product vision demo.</div>
      </footer>
    </div>
  )
}
