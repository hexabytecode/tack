import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight, AtSign, Bot, CalendarDays, Check, ClipboardCopy, FileText, Flag, History, KanbanSquare,
  List, MessageSquare, Plug, Plus, Settings, Sparkles, Terminal, UserRound, Zap,
} from 'lucide-react'
import { useStore } from '../store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Avatar, PriorityBadge, StatusIcon, TypeBadge, Wordmark, cx, useReveal } from '@/lib/ui'
import Markdown from '../components/Markdown'
import { STATUSES, USERS, type IssueType, type Priority, type Status } from '../data/mock'

const u = (id: string) => USERS.find(x => x.id === id)
const d = (ms: number) => ({ ['--d' as string]: `${ms}ms` }) as CSSProperties

function useOpen() {
  const { state } = useStore()
  const navigate = useNavigate()
  return () => navigate(state.signedIn ? '/app/WEB/board' : '/login')
}

function Nav() {
  const open = useOpen()
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1232px] items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-10">
          <Link to="/" aria-label="Tack home"><Wordmark height={26} /></Link>
          <nav className="hidden items-center gap-7 text-[14px] text-ink md:flex">
            <a href="#product" className="link">Product</a>
            <a href="#pricing" className="link">Pricing</a>
            <a href="#faq" className="link">FAQ</a>
          </nav>
        </div>
        <div className="flex items-center gap-5">
          <Link to="/login" className="link hidden text-[14px] sm:inline">Log in</Link>
          <Button onClick={open}>Open Tack<ArrowRight /></Button>
        </div>
      </div>
    </header>
  )
}

/* ── Hero board: cards rise in, then a card hops a column every few seconds (no tilt). */
type Mini = { key: string; title: string; type: IssueType; prio: Priority; who: string }
const HERO: Record<Status, Mini[]> = {
  todo: [
    { key: 'WEB-145', title: 'Audit accessibility for billing flow', type: 'task', prio: 'medium', who: 'sk' },
    { key: 'WEB-144', title: 'Safari flexbox gap bug', type: 'bug', prio: 'low', who: 'mr' },
  ],
  progress: [
    { key: 'WEB-142', title: 'Checkout button overlaps footer on mobile', type: 'bug', prio: 'high', who: 'al' },
    { key: 'WEB-139', title: 'Add VAT number to invoices', type: 'task', prio: 'high', who: 'jd' },
  ],
  review: [{ key: 'WEB-135', title: 'Optimise hero illustration size', type: 'task', prio: 'medium', who: 'mr' }],
  done: [
    { key: 'WEB-131', title: 'Set up preview deployments', type: 'task', prio: 'medium', who: 'jd' },
    { key: 'WEB-132', title: 'Fix cookie banner overlap', type: 'bug', prio: 'low', who: 'al' },
  ],
}
const HOPS: [string, Status, Status][] = [['WEB-139', 'progress', 'review'], ['WEB-135', 'review', 'done'], ['WEB-144', 'todo', 'progress'], ['WEB-142', 'progress', 'review']]

function MiniCard({ c, lifted, done, flash, style, className }: { c: Mini; lifted?: boolean; done?: boolean; flash?: boolean; style?: CSSProperties; className?: string }) {
  return (
    <div style={style} className={cx('rounded-[4px] border bg-paper p-2.5 transition-[transform,box-shadow,border-color] duration-300 ease-[var(--ease-out-soft)]',
      lifted ? '-translate-y-1 scale-[1.03] border-ink shadow-[0_12px_28px_rgba(0,0,0,.14)]' : 'border-line', flash && 'flash', className)}>
      <p className={cx('line-clamp-2 text-[12.5px] font-medium leading-snug', done && 'text-slate line-through decoration-slate/40')}>{c.title}</p>
      <div className="mt-2.5 flex items-center justify-between gap-1">
        <span className="flex min-w-0 items-center gap-1">
          <span className="whitespace-nowrap font-mono text-[10.5px] text-slate">{c.key}</span>
          <span className="hidden sm:inline-flex"><TypeBadge type={c.type} compact /></span>
          <span className="hidden md:inline-flex"><PriorityBadge priority={c.prio} compact /></span>
        </span>
        <Avatar user={u(c.who)} size={20} />
      </div>
    </div>
  )
}

function HeroBoard() {
  const [cols, setCols] = useState(HERO)
  const [lifted, setLifted] = useState<string | null>(null)
  const [landed, setLanded] = useState<string | null>(null)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let step = 0
    let timers: number[] = []
    const tick = () => {
      const [key, from, to] = HOPS[step % HOPS.length]
      const back = Math.floor(step / HOPS.length) % 2 === 1
      const [src, dst] = back ? [to, from] : [from, to]
      setLifted(key)
      timers.push(window.setTimeout(() => {
        setCols(c => {
          const card = c[src].find(x => x.key === key)
          if (!card) return c
          return { ...c, [src]: c[src].filter(x => x.key !== key), [dst]: [card, ...c[dst]] }
        })
        setLanded(key)
        timers.push(window.setTimeout(() => setLifted(null), 180))
        timers.push(window.setTimeout(() => setLanded(null), 1400))
      }, 420))
      step++
    }
    const start = window.setTimeout(tick, 1800)
    const loop = window.setInterval(tick, 3200)
    return () => { clearTimeout(start); clearInterval(loop); timers.forEach(clearTimeout); timers = [] }
  }, [])

  let n = 0
  return (
    <div className="overflow-hidden rounded-[6px] border border-line bg-paper text-left shadow-[0_24px_60px_-30px_rgba(0,0,0,.25)]">
      <div className="flex items-center justify-between border-b border-line bg-cloud px-4 py-2.5">
        <div className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-line" /><span className="size-2.5 rounded-full bg-line" /><span className="size-2.5 rounded-full bg-line" /></div>
        <span className="font-mono text-[11px] text-slate">tack.app / website-relaunch / board</span>
        <span className="flex items-center gap-1.5 font-mono text-[10px] text-success"><span className="relative flex size-1.5"><span className="absolute inset-0 animate-ping rounded-full bg-success opacity-60" /><span className="relative size-1.5 rounded-full bg-success" /></span>LIVE</span>
      </div>
      <div className="flex">
        <div className="hidden w-[200px] shrink-0 flex-col gap-5 border-r border-line p-4 lg:flex">
          <Wordmark height={22} />
          <div className="flex flex-col gap-0.5">
            <div className="label-mono px-2 py-1 text-[10px] text-slate">Projects</div>
            {[['WEB', 'Website relaunch', 14, true], ['APP', 'Mobile app', 8], ['BO', 'Back office', 5]].map(([k, l, c, on]) => (
              <div key={k as string} className={cx('flex items-center justify-between rounded-[4px] px-2 py-1.5 text-[12.5px]', on && 'bg-tint font-medium text-brand')}>
                <span className="flex items-center gap-1.5"><span className={cx('rounded-[3px] px-1 font-mono text-[9.5px]', on ? 'bg-brand text-paper' : 'bg-cloud text-slate')}>{k}</span>{l}</span>
                <span className="font-mono text-[10.5px] text-slate">{c}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-0.5 border-t border-line pt-3">
            <div className="label-mono px-2 py-1 text-[10px] text-slate">Views</div>
            {([[KanbanSquare, 'Board', true], [List, 'List'], [UserRound, 'My issues'], [Settings, 'Settings']] as const).map(([I, l, on]) => (
              <div key={l} className={cx('flex items-center gap-2 rounded-[4px] px-2 py-1.5 text-[12.5px]', on ? 'bg-tint font-medium text-brand' : 'text-slate')}><I className="size-3.5" />{l}</div>
            ))}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex h-12 items-center justify-between border-b border-line px-4">
            <span className="text-[13px]"><span className="text-slate">Website relaunch</span><span className="mx-2 text-line">/</span><span className="font-medium">Board</span></span>
            <span className="flex h-7 items-center gap-1 rounded-[4px] bg-ink px-2.5 text-[12px] font-medium text-paper"><Plus className="size-3.5" />Create issue</span>
          </div>
          <div className="grid min-h-[320px] grid-cols-2 gap-3 bg-wash p-4 sm:grid-cols-4">
            {STATUSES.map(s => (
              <div key={s.id} className="flex flex-col gap-2 rounded-[4px] border border-line bg-cloud p-2">
                <div className="flex items-center gap-1.5 px-1 pb-1"><StatusIcon status={s.id} className="size-3" /><span className="label-mono text-[10px]">{s.label}</span><span className="font-mono text-[10.5px] text-slate">{cols[s.id].length}</span></div>
                {cols[s.id].map(c => <MiniCard key={c.key} c={c} lifted={lifted === c.key} flash={landed === c.key} done={s.id === 'done'} className="hero-card" style={d(300 + n++ * 80)} />)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const TICKER = [
  ['pp', 'moved', 'WEB-142', 'to In review'], ['sk', 'commented on', 'APP-31', ''], ['jd', 'created', 'BO-14', ''],
  ['al', 'assigned', 'WEB-145', 'to Samira'], ['mr', 'moved', 'WEB-135', 'to Done'], ['cm', 'set priority on', 'APP-34', 'to High'],
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

/* ── Count-up for the proof strip */
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

/* ── Animated illustrations: a wipe-in reveal on scroll, a slow float, and live accents
   placed over the drawing (a pulsing tack head, dots along the cable, a blinking agent eye). */
function Illo({ src, alt, children, className }: { src: string; alt: string; children?: ReactNode; className?: string }) {
  return (
    <div className={cx('illo relative flex items-center justify-center overflow-hidden rounded-[4px] border border-line bg-paper', className)}>
      <div className="illo-float relative w-full">
        <img src={src} alt={alt} width={1200} height={800} loading="lazy" className="illo-img block h-auto w-full" />
        <svg viewBox="0 0 1200 800" className="pointer-events-none absolute inset-0 size-full" aria-hidden="true">{children}</svg>
      </div>
    </div>
  )
}
const Ping = ({ x, y, r = 16 }: { x: number; y: number; r?: number }) => (
  <g><circle cx={x} cy={y} r={r} className="illo-ping" fill="none" stroke="#183FD9" strokeWidth="3" /><circle cx={x} cy={y} r={r} className="illo-ping illo-ping-2" fill="none" stroke="#183FD9" strokeWidth="3" /></g>
)

function BoardIllo({ className }: { className?: string }) {
  return (
    <Illo src="/illustrations/board.webp" alt="Line drawing of a board with one card lifted off, pinned by a blue tack" className={className}>
      <Ping x={677} y={124} r={14} />
      <path d="M612 448 L 742 430" stroke="#183FD9" strokeWidth="6" strokeLinecap="round" className="illo-trace" fill="none" />
    </Illo>
  )
}
function ConnectorIllo({ className }: { className?: string }) {
  const cable = 'M452 400 C 500 440, 548 462, 600 480 S 680 505, 712 512'
  return (
    <Illo src="/illustrations/connector.webp" alt="Line drawing of an AI block plugged into Tack" className={className}>
      <path id="cable" d={cable} fill="none" stroke="none" />
      {[0, 0.66, 1.33].map(b => (
        <circle key={b} r="7" fill="#183FD9" className="illo-dot">
          <animateMotion dur="2s" begin={`${b}s`} repeatCount="indefinite" path={cable} keyPoints="0;1" keyTimes="0;1" calcMode="linear" />
        </circle>
      ))}
      <Ping x={442} y={392} r={18} />
    </Illo>
  )
}
function PeopleIllo({ className }: { className?: string }) {
  return (
    <Illo src="/illustrations/people-agents.webp" alt="Line drawing of a person and a small agent working on the same card" className={className}>
      <Ping x={664} y={482} r={14} />
      <ellipse cx="862" cy="279" rx="12" ry="12" fill="#183FD9" className="illo-blink" />
    </Illo>
  )
}

function Eyebrow({ children, icon: I }: { children: ReactNode; icon?: typeof Zap }) {
  return <div className="label-mono flex items-center gap-1.5 text-slate">{I && <I className="size-3.5" />}{children}</div>
}

function Feature({ n, eyebrow, icon, title, body, extra, mock, flip }: { n: string; eyebrow: string; icon: typeof Zap; title: string; body: string; extra?: ReactNode; mock: ReactNode; flip?: boolean }) {
  return (
    <div className="reveal grid items-center gap-8 rounded-[6px] border border-line p-6 md:grid-cols-2 md:gap-12 md:p-8">
      <div className={cx('max-w-[460px]', flip && 'md:order-2')}>
        <Eyebrow icon={icon}>{n} / {eyebrow}</Eyebrow>
        <h3 className="mt-3 text-[26px] font-medium leading-tight tracking-[-0.02em]">{title}</h3>
        <p className="mt-3 text-[15px] leading-relaxed text-slate">{body}</p>
        {extra}
      </div>
      <div className={cx('min-w-0', flip && 'md:order-1')}>{mock}</div>
    </div>
  )
}

function CreateMock() {
  return (
    <div className="rounded-[6px] border border-line bg-paper p-5 shadow-[0_8px_24px_rgba(0,0,0,.06)]">
      <div className="flex items-center justify-between border-b border-line pb-3">
        <span className="flex items-center gap-2 text-[13.5px] font-medium"><Plus className="size-4 text-brand" />New issue in Website relaunch</span>
        <span className="font-mono text-[10.5px] text-slate">ESC</span>
      </div>
      <div className="mt-4 flex h-10 items-center rounded-[4px] border border-brand px-3 text-[14px] outline outline-1 outline-brand">
        <span className="type-on">Checkout button overlaps footer on mobile</span><span className="ml-px h-4 w-px animate-pulse bg-ink" />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <TypeBadge type="bug" /><PriorityBadge priority="high" />
        <Badge variant="outline" className="h-[20px] gap-1 rounded-[4px] px-1.5 font-mono text-[10.5px] font-normal text-slate"><UserRound className="!size-3" />Alex Lin</Badge>
        <Badge variant="outline" className="h-[20px] gap-1 rounded-[4px] px-1.5 font-mono text-[10.5px] font-normal text-slate"><CalendarDays className="!size-3" />Friday</Badge>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
        <span className="font-mono text-[11px] text-slate">Everything else is optional</span>
        <span className="inline-flex h-[34px] items-center rounded-[4px] bg-ink px-3.5 text-[13px] font-medium text-paper">Create issue</span>
      </div>
      <div className="after-type mt-4 rounded-[4px] border border-line bg-cloud p-2">
        <div className="mb-1.5 flex items-center gap-1.5 px-1"><StatusIcon status="todo" className="size-3" /><span className="label-mono text-[10px]">To do</span></div>
        <MiniCard c={{ key: 'WEB-149', title: 'Checkout button overlaps footer on mobile', type: 'bug', prio: 'high', who: 'al' }} className="flash" />
      </div>
    </div>
  )
}

function MyWorkMock() {
  const rows: [string, string, Status, IssueType, Priority, string][][] = [
    [['WEB-142', 'Checkout button overlaps footer', 'progress', 'bug', 'high', 'Today'], ['WEB-138', 'Move DNS to the new host', 'todo', 'task', 'medium', 'Fri']],
    [['APP-31', 'Push notifications fail on iOS 17.4', 'progress', 'bug', 'high', '18 Nov']],
    [['BO-12', 'Export audit log times out', 'review', 'task', 'medium', '16 Nov']],
  ]
  const names = ['Website relaunch', 'Mobile app', 'Back office']
  return (
    <div className="overflow-hidden rounded-[6px] border border-line bg-paper">
      {rows.map((group, g) => (
        <div key={names[g]}>
          <div className="label-mono flex justify-between border-b border-line bg-cloud px-4 py-2 text-[10.5px]"><span>{names[g]}</span><span className="text-slate">{group.length} assigned</span></div>
          {group.map(([k, t, s, ty, p, due], i) => (
            <div key={k} className="reveal flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0" style={d(g * 120 + i * 80)}>
              <StatusIcon status={s} />
              <span className="w-14 shrink-0 font-mono text-[11px] text-slate">{k}</span>
              <span className="min-w-0 flex-1 truncate text-[13.5px]">{t}</span>
              <span className="hidden gap-1 sm:flex"><TypeBadge type={ty} compact /><PriorityBadge priority={p} compact /></span>
              <span className="w-12 text-right font-mono text-[11px] text-slate">{due}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

const RICH = `Reproduced on an **iPhone 15**. @Samira the fix is the same as WEB-132.

- [x] Add safe-area padding
- [ ] Check on Android

> [!WARNING] Blocks checkout on small phones. Ship this week.`

function IssueMock() {
  return (
    <div className="rounded-[6px] border border-line bg-paper p-6 shadow-[0_8px_24px_rgba(0,0,0,.06)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
        <span className="flex items-center gap-2 font-mono text-[11.5px]"><span className="text-slate">WEB-142</span><span className="text-line">/</span><span className="flex items-center gap-1.5 font-medium uppercase text-brand"><StatusIcon status="progress" className="size-3" />In progress</span></span>
        <span className="flex gap-1.5"><TypeBadge type="bug" /><PriorityBadge priority="high" /></span>
      </div>
      <h4 className="mt-4 text-[19px] font-medium leading-snug">Checkout button overlaps footer on mobile</h4>
      <div className="label-mono mb-3 mt-5 flex items-center gap-1.5 text-[10px] text-slate"><MessageSquare className="size-3" />Discussion</div>
      <div className="flex gap-3">
        <Avatar user={u('al')} size={26} />
        <div className="min-w-0 flex-1"><div className="text-[13px] font-medium">Alex Lin <span className="ml-1 font-mono text-[10.5px] font-normal text-slate">45m ago</span></div><Markdown>{RICH}</Markdown></div>
      </div>
      <div className="mt-4 rounded-[4px] border border-line">
        <div className="flex items-center gap-1 border-b border-line px-2 py-1.5 text-slate">
          {['B', 'I', '<>'].map(t => <span key={t} className="flex size-6 items-center justify-center rounded-[3px] font-mono text-[11px] font-semibold">{t}</span>)}
          <AtSign className="mx-1 size-3.5" /><Flag className="mx-1 size-3.5" />
        </div>
        <div className="flex items-center justify-between px-3 py-2"><span className="text-[13px] text-placeholder">Reply, @mention or add a callout…</span><span className="inline-flex h-7 items-center rounded-[4px] bg-ink px-2.5 text-[12px] font-medium text-paper">Comment</span></div>
      </div>
      <div className="mt-4 flex flex-col gap-1 font-mono text-[11px] text-slate">
        <span className="flex items-center gap-1.5"><History className="size-3" />Samira Khan assigned this to Alex Lin · 3h ago</span>
        <span className="flex items-center gap-1.5 text-brand"><Bot className="size-3" />Claude (agent) linked WEB-132 · 1h ago</span>
      </div>
    </div>
  )
}

const PLANS = [
  { name: 'Starter', price: 2, blurb: 'For small teams getting off spreadsheets.', features: ['Board, list and My issues', 'Up to 3 projects', 'Comments with Markdown and @mentions', 'Full history on every issue'] },
  { name: 'Team', price: 5, blurb: 'Everything a product team needs, nothing it doesn’t.', features: ['Everything in Starter', 'Unlimited projects', 'AI connections: Claude, Cursor, API', 'Help moving over from Jira'], featured: true },
  { name: 'Business', price: 10, blurb: 'For larger teams that need more control.', features: ['Everything in Team', 'Admin roles and member controls', 'Export history for audits', 'Priority support'] },
]

const FAQ: [string, string][] = [
  ['What does it cost?', 'From $2 per person per month. Most teams pick Team at $5, which includes the AI connections. That’s about an eighth of what we pay for Jira today.'],
  ['Can we bring our issues over from Jira?', 'Yes. We move your open issues over once, when you switch. Closed ones can stay where they are.'],
  ['Who can see our projects?', 'Only people signed in with your company Google account, and only the projects they’ve been added to.'],
  ['Does it work on my phone?', 'Yes, it works in your phone’s browser. The board scrolls sideways one column at a time.'],
  ['Do I have to use the AI features?', 'No. They’re off until someone connects an AI tool. Everything in Tack works with plain clicks.'],
]

export default function Landing() {
  const open = useOpen()
  const proof = useReveal<HTMLDivElement>()
  const features = useReveal<HTMLDivElement>()
  const issue = useReveal<HTMLDivElement>()
  const quote = useReveal<HTMLDivElement>()
  const pricing = useReveal<HTMLDivElement>()
  const ai = useReveal<HTMLDivElement>()
  const faq = useReveal<HTMLDivElement>()
  const cta = useReveal<HTMLDivElement>()

  return (
    <div className="min-h-dvh bg-paper">
      <Nav />

      <section className="mx-auto max-w-[1232px] px-4 pb-14 pt-16 text-center md:px-6 md:pt-24">
        <Badge variant="secondary" className="anim-rise gap-2 rounded-[4px] border border-line px-2.5 py-1">
          <Sparkles className="!size-3 text-brand" /><span className="label-mono text-[10.5px] text-slate">Simple · calm · $5 a seat</span>
        </Badge>
        <h1 className="anim-rise mx-auto mt-6 max-w-[760px] text-[40px] font-medium leading-[1.04] tracking-[-0.03em] [text-wrap:balance] md:text-[64px]" style={{ animationDelay: '60ms' }}>
          The issue tracker your team will actually use.
        </h1>
        <p className="anim-rise mx-auto mt-6 max-w-[560px] text-[17px] leading-relaxed text-slate md:text-[19px]" style={{ animationDelay: '120ms' }}>
          Four columns, a board and a list. Drag a card, leave a comment, move on. No setup, no training.
        </p>
        <div className="anim-rise mt-9 flex justify-center gap-3" style={{ animationDelay: '180ms' }}>
          <Button size="lg" onClick={open}>Open Tack<ArrowRight /></Button>
          <Button size="lg" variant="secondary" asChild><a href="#product">See how it works</a></Button>
        </div>
        <div className="anim-rise mx-auto mt-16 max-w-[1232px]" style={{ animationDelay: '240ms' }}><HeroBoard /></div>
      </section>

      <Ticker />

      <div ref={proof} className="border-b border-line">
        <div className="mx-auto grid max-w-[1232px] grid-cols-2 md:grid-cols-4">
          {([[<CountUp to={4} />, 'columns', 'To do · In progress · Review · Done'], [<CountUp to={7} />, 'screens', 'Everything, nothing extra'], [<CountUp to={1} />, 'minute', 'To learn the whole thing'], [<CountUp to={5} prefix="$" />, 'a seat', 'Per person, per month']] as const).map(([num, unit, sub], i) => (
            <div key={unit} className={cx('reveal border-line px-6 py-8', i % 2 === 0 && 'border-r', i < 2 && 'border-b md:border-b-0', i === 1 && 'md:border-r', i === 2 && 'md:border-r')} style={d(i * 100)}>
              <div className="font-mono text-[26px] font-medium uppercase tracking-tight">{num} <span className="text-[18px]">{unit}</span></div>
              <div className="label-mono mt-2 text-[10.5px] text-slate">{sub}</div>
            </div>
          ))}
        </div>
      </div>

      <section id="product" ref={features} className="mx-auto max-w-[1232px] scroll-mt-16 px-4 py-24 md:px-6">
        <div className="reveal max-w-[640px]">
          <Eyebrow icon={Zap}>The whole product</Eyebrow>
          <h2 className="mt-3 text-[34px] font-medium leading-tight tracking-[-0.02em] [text-wrap:balance] md:text-[42px]">Everything you need. Nothing you don’t.</h2>
          <p className="mt-4 text-[16px] leading-relaxed text-slate">Built around how a small team actually works: a board to see everything, a quick way to add work, and one place for what’s on your plate.</p>
        </div>
        <div className="mt-12 flex flex-col gap-6">
          <Feature n="01" eyebrow="The board" icon={KanbanSquare} title="Drag it, done."
            body="Four columns, every card in view. Bugs, tasks and priorities each have their own colour and icon, so you can read the board at a glance."
            extra={<div className="mt-5 flex flex-wrap gap-1.5"><TypeBadge type="bug" /><TypeBadge type="task" /><PriorityBadge priority="high" /><PriorityBadge priority="medium" /><PriorityBadge priority="low" /></div>}
            mock={<div className="grid grid-cols-[1fr_1.15fr] items-center gap-4">
              <div className="rounded-[4px] border border-line bg-cloud p-2.5">
                <div className="mb-2 flex items-center gap-1.5 px-1"><StatusIcon status="progress" className="size-3" /><span className="label-mono text-[10px]">In progress</span></div>
                <div className="flex flex-col gap-2">
                  <MiniCard c={{ key: 'WEB-140', title: 'Password reset email lands in spam', type: 'bug', prio: 'high', who: 'al' }} lifted />
                  <MiniCard c={{ key: 'WEB-141', title: 'Update pricing page copy', type: 'task', prio: 'low', who: 'sk' }} />
                </div>
              </div>
              <BoardIllo />
            </div>} />
          <Feature n="02" eyebrow="Quick create" icon={Plus} title="New issue in five seconds." flip
            body="Type a title and press Create. Type, assignee, priority and due date are there when you want them, not before."
            extra={<ul className="mt-5 flex flex-col gap-2 text-[14px] text-slate">{['Create from any screen', 'Lands at the top of To do', 'Markdown descriptions'].map(t => <li key={t} className="flex items-center gap-2"><Check className="size-4 text-ink" />{t}</li>)}</ul>}
            mock={<CreateMock />} />
          <Feature n="03" eyebrow="My issues" icon={UserRound} title="Your work, in one place."
            body="Everything assigned to you, across every project, sorted by what’s due first. Open Tack in the morning and you know what to do."
            mock={<MyWorkMock />} />
        </div>
      </section>

      <section ref={issue} className="border-y border-line bg-wash">
        <div className="mx-auto grid max-w-[1232px] items-center gap-12 px-4 py-24 md:grid-cols-[1fr_1.15fr] md:px-6">
          <div className="reveal">
            <Eyebrow icon={MessageSquare}>Context and conversation</Eyebrow>
            <h2 className="mt-3 text-[34px] font-medium leading-tight tracking-[-0.02em] md:text-[42px]">Every decision, in the issue.</h2>
            <p className="mt-4 max-w-[480px] text-[16px] leading-relaxed text-slate">Write comments the way you think: bold, checklists, code, @mentions and callout banners. The decision and its history stay with the work.</p>
            <div className="mt-8 flex flex-col gap-3">
              {([[FileText, 'Rich comments', 'Markdown, checklists and code, with a live preview.'], [AtSign, '@mentions and issue links', 'Ping a teammate or link WEB-132 right in the text.'], [Flag, 'Callout banners', 'Mark a note, a tip, a warning or a decision so it stands out.']] as const).map(([I, a, b], i) => (
                <div key={a} className="reveal flex gap-3 rounded-[4px] border border-line bg-paper px-4 py-3" style={d(i * 100)}>
                  <I className="mt-0.5 size-4 shrink-0 text-brand" />
                  <div><div className="text-[14px] font-medium">{a}</div><div className="text-[13.5px] text-slate">{b}</div></div>
                </div>
              ))}
            </div>
            <PeopleIllo className="reveal mt-6 hidden max-w-[420px] md:flex" />
          </div>
          <div className="reveal" style={d(120)}><IssueMock /></div>
        </div>
      </section>

      <section className="bg-ink text-paper">
        <div ref={quote} className="mx-auto max-w-[920px] px-4 py-24 text-center md:px-6">
          <p className="reveal text-[30px] font-medium leading-tight tracking-[-0.02em] [text-wrap:balance] md:text-[44px]">“We stopped paying for Jira. Nobody missed it.”</p>
          <p className="reveal label-mono mt-6 text-[#8E93A8]" style={d(100)}>— The goal, for a 28-person team</p>
          <div className="reveal mx-auto mt-12 grid max-w-[560px] grid-cols-2 border-t border-white/15 pt-8" style={d(200)}>
            <div className="border-r border-white/15">
              <div className="label-mono text-[#8E93A8]">Jira today</div>
              <div className="mt-2 font-mono text-[26px] text-[#8E93A8]"><span className="relative inline-block">$1,120 / mo<span className="strike-line" /></span></div>
            </div>
            <div>
              <div className="label-mono text-[#B6BACB]">Tack Team</div>
              <div className="zero mt-2 font-mono text-[26px] text-paper">$140 / mo</div>
            </div>
          </div>
          <p className="reveal mt-8 text-[14px] text-[#B6BACB]" style={d(300)}>28 people × $5. Simple enough to run ourselves, polished enough to sell.</p>
        </div>
      </section>

      <section id="pricing" ref={pricing} className="mx-auto max-w-[1232px] scroll-mt-16 px-4 py-24 md:px-6">
        <div className="reveal mx-auto max-w-[620px] text-center">
          <div className="flex justify-center"><Eyebrow>Pricing</Eyebrow></div>
          <h2 className="mt-3 text-[34px] font-medium leading-tight tracking-[-0.02em] md:text-[42px]">Priced per person. No surprises.</h2>
          <p className="mt-4 text-[16px] leading-relaxed text-slate">Pay for the people who use it. Change plans whenever you like.</p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {PLANS.map((p, i) => (
            <div key={p.name} className={cx('reveal relative flex flex-col rounded-[6px] border p-6 transition-transform duration-200 hover:-translate-y-1', p.featured ? 'border-ink shadow-[0_24px_60px_-30px_rgba(0,0,0,.3)]' : 'border-line')} style={d(i * 100)}>
              {p.featured && <Badge className="absolute -top-2.5 left-6 rounded-[4px] bg-brand font-mono text-[10px] uppercase tracking-[0.06em]">Most teams</Badge>}
              <div className="text-[16px] font-medium">{p.name}</div>
              <p className="mt-1 text-[13.5px] text-slate">{p.blurb}</p>
              <div className="mt-6 flex items-baseline gap-1.5"><span className="font-mono text-[40px] font-medium tracking-tight">${p.price}</span><span className="text-[13px] text-slate">per person / month</span></div>
              <ul className="mt-6 flex flex-1 flex-col gap-2.5 text-[14px]">
                {p.features.map(f => <li key={f} className="flex items-start gap-2"><Check className={cx('mt-0.5 size-4 shrink-0', p.featured ? 'text-brand' : 'text-ink')} />{f}</li>)}
              </ul>
              <Button className="mt-8 w-full" variant={p.featured ? 'default' : 'secondary'} onClick={open}>Try {p.name}</Button>
            </div>
          ))}
        </div>
        <p className="reveal mt-6 text-center font-mono text-[11px] text-slate">Proposed pricing for the pitch. Jira Standard and Premium cost far more per seat.</p>
      </section>

      <section ref={ai} className="border-t border-line bg-wash">
        <div className="mx-auto max-w-[1232px] px-4 py-24 md:px-6">
          <div className="reveal max-w-[720px]">
            <div className="label-mono flex items-center gap-2 text-slate"><span className="size-1.5 rounded-full bg-slate" />Optional · nothing changes until you connect it</div>
            <h2 className="mt-3 text-[34px] font-medium leading-tight tracking-[-0.02em] md:text-[42px]">Works with your AI, if you want it.</h2>
            <p className="mt-4 text-[16px] leading-relaxed text-slate">Tack is made for people first. No bots tagging you, no summaries cluttering the screen. When someone does want help from Claude or Cursor, it can read and update issues the same way you do, and every change it makes is labelled.</p>
          </div>
          <div className="mt-12 grid gap-4 lg:grid-cols-[repeat(3,1fr)_1.25fr]">
            {([
              [Plug, 'MCP', 'Connect Claude or Cursor', 'One command and a personal key. Four actions: search, read, create, update.', <code key="c" className="flex items-center gap-2 rounded-[4px] bg-ink p-3 font-mono text-[11px] text-brand-soft"><Terminal className="size-3.5 shrink-0" />claude mcp add tack …/mcp</code>],
              [FileText, 'llms.txt', 'One file explains Tack', 'A short plain-text guide any AI can read to understand your projects and fields.', <code key="l" className="block rounded-[4px] bg-cloud p-3 font-mono text-[11px] leading-relaxed text-slate"># Tack<br />## Tools</code>],
              [ClipboardCopy, 'Copy for AI', 'Copy any issue for AI', 'One button turns an issue into clean text you can paste into any chat.', <span key="b" className="inline-flex h-8 w-fit items-center gap-1.5 rounded-[4px] border border-line bg-paper px-2.5 font-mono text-[11px]"><ClipboardCopy className="size-3.5" />Copy for AI</span>],
            ] as const).map(([I, e, t, b, x], i) => (
              <div key={e} className="reveal flex flex-col justify-between gap-6 rounded-[6px] border border-line bg-paper p-5" style={d(i * 100)}>
                <div><div className="label-mono flex items-center gap-1.5 text-slate"><I className="size-3.5 text-brand" />{e}</div><h3 className="mt-3 text-[17px] font-medium">{t}</h3><p className="mt-2 text-[13.5px] leading-relaxed text-slate">{b}</p></div>
                {x}
              </div>
            ))}
            <ConnectorIllo className="reveal min-h-[240px]" />
          </div>
        </div>
      </section>

      <section id="faq" ref={faq} className="scroll-mt-16 border-t border-line">
        <div className="mx-auto max-w-[900px] px-4 py-24 md:px-6">
          <Eyebrow>Questions</Eyebrow>
          <h2 className="mt-3 text-[34px] font-medium tracking-[-0.02em]">Frequently asked questions.</h2>
          <Accordion type="single" collapsible className="mt-10 border-t border-line">
            {FAQ.map(([q, a], i) => (
              <AccordionItem key={q} value={`q${i}`} className="border-line">
                <AccordionTrigger className="py-5 text-[16px] font-medium hover:no-underline">{q}</AccordionTrigger>
                <AccordionContent className="max-w-[680px] pb-5 text-[15px] leading-relaxed text-slate">{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section ref={cta} className="mx-auto max-w-[1232px] px-4 pb-20 md:px-6">
        <div className="reveal rounded-[6px] border border-line bg-cloud px-6 py-16 text-center">
          <h2 className="text-[36px] font-medium tracking-[-0.02em] md:text-[48px]">Start with the board.</h2>
          <p className="mx-auto mt-4 max-w-[440px] text-[16px] text-slate">No credit card, no sales call. Open it and move your first card.</p>
          <Button size="lg" onClick={open} className="mt-8">Open Tack<ArrowRight /></Button>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1232px] flex-wrap justify-between gap-10 px-4 py-12 md:px-6">
          <div>
            <Wordmark height={26} />
            <p className="mt-3 text-[13.5px] text-slate">The calm issue tracker for small teams.</p>
          </div>
          <div className="flex gap-16">
            <div className="flex flex-col gap-2 text-[13.5px]"><div className="label-mono mb-1">Product</div><Link to="/app/WEB/board" className="link w-fit text-slate">Board</Link><Link to="/app/WEB/list" className="link w-fit text-slate">List</Link><Link to="/app/me" className="link w-fit text-slate">My issues</Link></div>
            <div className="flex flex-col gap-2 text-[13.5px]"><div className="label-mono mb-1">Tack</div><a href="#pricing" className="link w-fit text-slate">Pricing</a><a href="#faq" className="link w-fit text-slate">FAQ</a><Link to="/login" className="link w-fit text-slate">Log in</Link></div>
          </div>
        </div>
        <div className="border-t border-line">
          <div className="mx-auto max-w-[1232px] px-4 py-5 font-mono text-[11px] text-slate md:px-6">© 2026 Tack. A product vision demo.</div>
        </div>
      </footer>
    </div>
  )
}
