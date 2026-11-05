import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { Avatar, Button, Chip, Icon, Logo, LogoMark, StatusDot, cx, useReveal } from '../lib/ui'
import { STATUSES, USERS, type Status } from '../data/mock'

const u = (id: string) => USERS.find(x => x.id === id)

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
          <Link to="/" aria-label="Tack home"><Logo /></Link>
          <nav className="hidden items-center gap-7 text-[14px] text-ink md:flex">
            <a href="#product" className="link">Product</a>
            <a href="#why" className="link">Why Tack</a>
            <a href="#faq" className="link">FAQ</a>
          </nav>
        </div>
        <div className="flex items-center gap-5">
          <Link to="/login" className="link hidden text-[14px] sm:inline">Log in</Link>
          <Button onClick={open}>Open Tack</Button>
        </div>
      </div>
    </header>
  )
}

/* Hero board: cards rise in, then one card hops a column every few seconds. */
type Mini = { key: string; title: string; type: 'task' | 'bug'; who: string; high?: boolean }
const HERO: Record<Status, Mini[]> = {
  todo: [
    { key: 'WEB-145', title: 'Audit accessibility for billing flow', type: 'task', who: 'sk' },
    { key: 'WEB-148', title: 'Navigation drawer on tablet', type: 'task', who: 'al' },
  ],
  progress: [
    { key: 'WEB-142', title: 'Checkout button overlaps footer on mobile', type: 'bug', who: 'al', high: true },
    { key: 'WEB-139', title: 'Add VAT number to invoices', type: 'task', who: 'jd' },
  ],
  review: [{ key: 'WEB-135', title: 'Optimise hero illustration size', type: 'task', who: 'mr' }],
  done: [
    { key: 'WEB-131', title: 'Set up preview deployments', type: 'task', who: 'jd' },
    { key: 'WEB-132', title: 'Fix cookie banner overlap', type: 'bug', who: 'al' },
  ],
}

function MiniCard({ c, lifted, done, style, className }: { c: Mini; lifted?: boolean; done?: boolean; style?: React.CSSProperties; className?: string }) {
  return (
    <div style={style} className={cx('rounded-[4px] border bg-paper p-2.5 transition-[transform,box-shadow,border-color] duration-[450ms] ease-[var(--ease-out-soft)]', lifted ? '-translate-y-1 rotate-[-1.5deg] border-ink shadow-[0_8px_24px_rgba(0,0,0,.12)]' : 'border-line', className)}>
      <p className={cx('line-clamp-2 text-[12.5px] font-medium leading-snug', done && 'text-slate line-through decoration-slate/40')}>{c.title}</p>
      <div className="mt-2.5 flex items-center justify-between">
        <span className="flex min-w-0 items-center gap-1.5"><span className="whitespace-nowrap font-mono text-[10.5px] text-slate">{c.key}</span><span className="hidden sm:inline-flex"><Chip strong={c.type === 'bug'}>{c.type}</Chip></span>{c.high && <span className="hidden md:inline-flex"><Chip strong>High</Chip></span>}</span>
        <Avatar user={u(c.who)} size={20} />
      </div>
    </div>
  )
}

function HeroBoard() {
  const [cols, setCols] = useState(HERO)
  const [lifted, setLifted] = useState<string | null>(null)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let step = 0
    const tick = () => {
      // Alternate: WEB-139 hops To do → In review, then back, so the loop never drifts.
      const forward = step % 2 === 0
      setLifted('WEB-139')
      setTimeout(() => {
        setCols(c => {
          const card = [...c.progress, ...c.review].find(x => x.key === 'WEB-139')!
          return forward
            ? { ...c, progress: c.progress.filter(x => x.key !== 'WEB-139'), review: [card, ...c.review] }
            : { ...c, review: c.review.filter(x => x.key !== 'WEB-139'), progress: [...c.progress, card] }
        })
        setTimeout(() => setLifted(null), 160)
      }, 450)
      step++
    }
    const start = setTimeout(tick, 2200)
    const loop = setInterval(tick, 6000)
    return () => { clearTimeout(start); clearInterval(loop) }
  }, [])

  let n = 0
  return (
    <div className="overflow-hidden rounded-[4px] border border-line bg-paper text-left">
      <div className="flex items-center justify-between border-b border-line bg-cloud px-4 py-2.5">
        <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-line" /><span className="h-2.5 w-2.5 rounded-full bg-line" /><span className="h-2.5 w-2.5 rounded-full bg-line" /></div>
        <span className="font-mono text-[11px] text-slate">tack / website-relaunch / board</span>
        <span className="w-10" />
      </div>
      <div className="flex">
        <div className="hidden w-[200px] shrink-0 flex-col gap-5 border-r border-line p-4 lg:flex">
          <Logo sub="Engineering workspace" />
          <div className="flex flex-col gap-0.5">
            <div className="label-mono px-2 py-1 text-[10px] text-slate">Projects</div>
            <div className="flex items-center justify-between rounded-[4px] bg-tint px-2 py-1.5 text-[12.5px] font-medium text-accent"><span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-accent" />Website relaunch</span><span className="font-mono text-[10.5px]">14</span></div>
            <div className="flex items-center justify-between px-2 py-1.5 text-[12.5px]"><span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-line" />Mobile app</span><span className="font-mono text-[10.5px] text-slate">8</span></div>
            <div className="flex items-center justify-between px-2 py-1.5 text-[12.5px]"><span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-line" />Back office</span><span className="font-mono text-[10.5px] text-slate">5</span></div>
          </div>
          <div className="flex flex-col gap-0.5 border-t border-line pt-3">
            <div className="label-mono px-2 py-1 text-[10px] text-slate">Views</div>
            {[['view_kanban', 'Board', true], ['format_list_bulleted', 'List'], ['assignment_ind', 'My issues'], ['settings', 'Settings']].map(([i, l, on]) => (
              <div key={l as string} className={cx('flex items-center gap-2 rounded-[4px] px-2 py-1.5 text-[12.5px]', on ? 'bg-tint font-medium text-accent' : 'text-slate')}><Icon name={i as string} className="!text-[16px]" />{l}</div>
            ))}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex h-12 items-center justify-between border-b border-line px-4">
            <span className="text-[13px]"><span className="text-slate">Website relaunch</span><span className="mx-2 text-line">/</span><span className="font-medium">Board</span></span>
            <span className="flex h-7 items-center gap-1 rounded-[4px] bg-ink px-2.5 text-[12px] font-medium text-paper"><Icon name="add" className="!text-[14px]" />Create issue</span>
          </div>
          <div className="grid min-h-[320px] grid-cols-2 gap-3 bg-wash p-4 sm:grid-cols-4">
            {STATUSES.map(s => (
              <div key={s.id} className="flex flex-col gap-2 rounded-[4px] border border-line bg-cloud p-2">
                <div className="flex items-center gap-2 px-1 pb-1"><StatusDot status={s.id} size={7} /><span className="label-mono text-[10px]">{s.label}</span><span className="font-mono text-[10.5px] text-slate">{cols[s.id].length}</span></div>
                {cols[s.id].map(c => <MiniCard key={c.key} c={c} lifted={lifted === c.key} done={s.id === 'done'} className="hero-card" style={{ ['--d' as string]: `${300 + n++ * 80}ms` }} />)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <div className="label-mono text-slate">{children}</div>
}

function Feature({ n, eyebrow, title, body, extra, mock, flip }: { n: string; eyebrow: string; title: string; body: string; extra?: ReactNode; mock: ReactNode; flip?: boolean }) {
  return (
    <div className="reveal grid items-center gap-8 rounded-[4px] border border-line p-6 md:grid-cols-2 md:gap-12 md:p-8">
      <div className={cx('max-w-[460px]', flip && 'md:order-2')}>
        <Eyebrow>{n} / {eyebrow}</Eyebrow>
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
    <div className="rounded-[4px] border border-line bg-paper p-5 shadow-[0_8px_24px_rgba(0,0,0,.06)]">
      <div className="flex items-center justify-between border-b border-line pb-3">
        <span className="flex items-center gap-2 text-[13.5px] font-medium"><span className="h-1.5 w-1.5 rounded-full bg-accent" />New issue in Website relaunch</span>
        <span className="font-mono text-[10.5px] text-slate">ESC</span>
      </div>
      <div className="mt-4 flex h-10 items-center rounded-[4px] border border-accent px-3 text-[14px] outline outline-1 outline-accent">
        <span className="type-on">Checkout button overlaps footer on mobile</span><span className="ml-px h-4 w-px animate-pulse bg-ink" />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {[['bug_report', 'Bug'], ['person', 'Alex Lin'], ['flag', 'High'], ['event', 'Friday']].map(([i, l]) => (
          <span key={l} className="inline-flex h-7 items-center gap-1.5 rounded-[4px] border border-line bg-cloud px-2 font-mono text-[11px]"><Icon name={i} className="!text-[14px] text-slate" />{l}</span>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
        <span className="font-mono text-[11px] text-slate">Everything else is optional</span>
        <span className="inline-flex h-[34px] items-center rounded-[4px] bg-ink px-3.5 text-[13px] font-medium text-paper">Create issue</span>
      </div>
      <div className="after-type mt-4 rounded-[4px] border border-line bg-cloud p-2">
        <div className="mb-1.5 flex items-center gap-2 px-1"><StatusDot status="todo" size={7} /><span className="label-mono text-[10px]">To do</span></div>
        <MiniCard c={{ key: 'WEB-149', title: 'Checkout button overlaps footer on mobile', type: 'bug', who: 'al', high: true }} className="flash" />
      </div>
    </div>
  )
}

function MyWorkMock() {
  const rows: [string, string, Status, string][][] = [
    [['WEB-142', 'Checkout button overlaps footer', 'progress', 'High'], ['WEB-138', 'Move DNS to the new host', 'todo', 'Med']],
    [['APP-31', 'Push notifications fail on iOS 17.4', 'progress', 'High']],
    [['BO-12', 'Export audit log times out', 'review', 'Med']],
  ]
  const names = ['Website relaunch', 'Mobile app', 'Back office']
  return (
    <div className="overflow-hidden rounded-[4px] border border-line bg-paper">
      {rows.map((group, g) => (
        <div key={names[g]}>
          <div className="label-mono flex justify-between border-b border-line bg-cloud px-4 py-2 text-[10.5px]"><span>{names[g]}</span><span className="text-slate">{group.length} assigned</span></div>
          {group.map(([k, t, s, p]) => (
            <div key={k} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0">
              <StatusDot status={s} />
              <span className="w-14 shrink-0 font-mono text-[11px] text-slate">{k}</span>
              <span className="min-w-0 flex-1 truncate text-[13.5px]">{t}</span>
              <Chip strong={p === 'High'}>{p}</Chip>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function IssueMock() {
  return (
    <div className="rounded-[4px] border border-line bg-paper p-6 shadow-[0_8px_24px_rgba(0,0,0,.06)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
        <span className="flex items-center gap-2 font-mono text-[11.5px]"><span className="text-slate">WEB-142</span><span className="text-line">/</span><span className="flex items-center gap-1.5 font-medium uppercase text-accent"><StatusDot status="progress" size={7} />In progress</span></span>
        <Chip strong>High</Chip>
      </div>
      <h4 className="mt-4 text-[19px] font-medium leading-snug">Checkout button overlaps footer on mobile</h4>
      <div className="mt-4 rounded-[4px] bg-cloud p-4 text-[13px] leading-relaxed">
        <div className="label-mono mb-2 text-[10px] text-slate">Steps to reproduce</div>
        1. Open /checkout on a narrow phone<br />2. Scroll to the bottom<br />3. The Pay button sits under the footer
      </div>
      <div className="label-mono mb-3 mt-5 text-[10px] text-slate">Discussion (2)</div>
      {[['sk', '2h ago', 'Reproduced on iPhone 15 in Safari and Chrome.'], ['al', '45m ago', 'Taking this one. @Samira I’ll send it for review today.']].map(([w, t, b]) => (
        <div key={t} className="mb-3 flex gap-3">
          <Avatar user={u(w)} size={26} />
          <div><div className="text-[13px] font-medium">{u(w)?.name} <span className="ml-1 font-mono text-[10.5px] font-normal text-slate">{t}</span></div><p className="text-[13px] text-slate">{b}</p></div>
        </div>
      ))}
      <div className="mt-2 flex gap-2 border-t border-line pt-4">
        <div className="flex h-9 flex-1 items-center rounded-[4px] border border-line px-3 text-[13px] text-placeholder">Write a reply or @mention…</div>
        <span className="inline-flex h-9 items-center rounded-[4px] bg-ink px-3.5 text-[13px] font-medium text-paper">Comment</span>
      </div>
      <div className="mt-4 flex flex-col gap-1 font-mono text-[11px] text-slate">
        <span>Samira Khan assigned this to Alex Lin · 3h ago</span>
        <span>Alex Lin moved this to In progress · 2h ago</span>
      </div>
    </div>
  )
}

const FAQ: [string, string][] = [
  ['Can we bring our issues over from Jira?', 'Yes. We move your open issues over once, when we switch. Closed ones can stay where they are.'],
  ['Who can see our projects?', 'Only people signed in with a company Google account, and only the projects they’ve been added to.'],
  ['Does it work on my phone?', 'Yes, it works in your phone’s browser. The board scrolls sideways one column at a time.'],
  ['Do I have to use the AI features?', 'No. They’re off until someone connects an AI tool. Everything in Tack works with plain clicks.'],
  ['Where is our data kept?', 'In Tack’s own database, run by our team. Nothing is shared with AI tools unless you connect one.'],
]

export default function Landing() {
  const open = useOpen()
  const features = useReveal<HTMLDivElement>()
  const proof = useReveal<HTMLDivElement>()
  const issue = useReveal<HTMLDivElement>()
  const quote = useReveal<HTMLDivElement>()
  const ai = useReveal<HTMLDivElement>()
  const faq = useReveal<HTMLDivElement>()
  const cta = useReveal<HTMLDivElement>()
  const [openQ, setOpenQ] = useState<number | null>(null)

  return (
    <div className="min-h-dvh bg-paper">
      <Nav />

      <section className="mx-auto max-w-[1232px] px-4 pb-20 pt-16 text-center md:px-6 md:pt-24">
        <div className="anim-rise inline-flex items-center gap-2 rounded-[4px] border border-line bg-cloud px-2.5 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" /><span className="label-mono text-[10.5px] text-slate">Simple · free · yours</span>
        </div>
        <h1 className="anim-rise mx-auto mt-6 max-w-[760px] text-[40px] font-medium leading-[1.04] tracking-[-0.03em] [text-wrap:balance] md:text-[64px]" style={{ animationDelay: '60ms' }}>
          The issue tracker your team will actually use.
        </h1>
        <p className="anim-rise mx-auto mt-6 max-w-[560px] text-[17px] leading-relaxed text-slate md:text-[19px]" style={{ animationDelay: '120ms' }}>
          Four columns, a board and a list. Drag a card, leave a comment, move on. No setup, no training.
        </p>
        <div className="anim-rise mt-9 flex justify-center gap-3" style={{ animationDelay: '180ms' }}>
          <Button onClick={open} className="!h-11 !px-5 !text-[15px]">Open Tack</Button>
          <a href="#product" className="inline-flex h-11 items-center rounded-[4px] border border-line bg-cloud px-5 text-[15px] font-medium transition-colors hover:border-ink">See how it works</a>
        </div>
        <div className="anim-rise mx-auto mt-16 max-w-[1232px]" style={{ animationDelay: '240ms' }}>
          <HeroBoard />
        </div>
      </section>

      <div ref={proof} className="border-y border-line">
        <div className="mx-auto grid max-w-[1232px] grid-cols-2 md:grid-cols-4">
          {[['4 columns', 'To do · In progress · Review · Done'], ['7 screens', 'Everything, nothing extra'], ['0 training', 'Familiar in a minute'], ['$0 a seat', 'No licence fees']].map(([a, b], i) => (
            <div key={a} className={cx('reveal border-line px-6 py-8', i % 2 === 0 && 'border-r', i < 2 && 'border-b md:border-b-0', i === 1 && 'md:border-r', i === 2 && 'md:border-r')} style={{ ['--d' as string]: `${i * 100}ms` }}>
              <div className="font-mono text-[22px] font-medium uppercase tracking-tight">{a}</div>
              <div className="label-mono mt-2 text-[10.5px] text-slate">{b}</div>
            </div>
          ))}
        </div>
      </div>

      <section id="product" ref={features} className="mx-auto max-w-[1232px] scroll-mt-16 px-4 py-24 md:px-6">
        <div className="reveal max-w-[640px]">
          <Eyebrow>The whole product</Eyebrow>
          <h2 className="mt-3 text-[34px] font-medium leading-tight tracking-[-0.02em] [text-wrap:balance] md:text-[42px]">Everything you need. Nothing you don’t.</h2>
          <p className="mt-4 text-[16px] leading-relaxed text-slate">Built around how a small team actually works: a board to see everything, a quick way to add work, and one place for what’s on your plate.</p>
        </div>
        <div className="mt-12 flex flex-col gap-6">
          <Feature n="01" eyebrow="The board" title="Drag it, done."
            body="Four columns, every card in view. Move a card and everyone sees it. No workflows to configure, no fields to fill in first."
            mock={<div className="grid grid-cols-[1fr_1.1fr] gap-4">
              <div className="rounded-[4px] border border-line bg-cloud p-2.5">
                <div className="mb-2 flex items-center gap-2 px-1"><StatusDot status="progress" size={7} /><span className="label-mono text-[10px]">In progress</span></div>
                <div className="flex flex-col gap-2">
                  <MiniCard c={{ key: 'WEB-140', title: 'Password reset email lands in spam', type: 'bug', who: 'al', high: true }} lifted />
                  <MiniCard c={{ key: 'WEB-141', title: 'Update pricing page copy', type: 'task', who: 'sk' }} />
                </div>
              </div>
              <div className="flex items-center justify-center rounded-[4px] border border-line bg-paper p-2"><img src="/illustrations/board.webp" alt="Line drawing of a board with one card lifted, pinned by a blue tack" width={1200} height={800} loading="lazy" className="h-auto w-full" /></div>
            </div>} />
          <Feature n="02" eyebrow="Quick create" title="New issue in five seconds." flip
            body="Type a title and press Create. Assignee, priority and due date are there when you want them, not before."
            extra={<ul className="mt-5 flex flex-col gap-2 text-[14px] text-slate">{['Create from any screen', 'Lands at the top of To do'].map(t => <li key={t} className="flex items-center gap-2"><Icon name="check" className="!text-[16px] text-ink" />{t}</li>)}</ul>}
            mock={<CreateMock />} />
          <Feature n="03" eyebrow="My issues" title="Your work, in one place."
            body="Everything assigned to you, across every project, sorted by what’s due first. Open Tack in the morning and you know what to do."
            mock={<MyWorkMock />} />
        </div>
      </section>

      <section ref={issue} className="border-y border-line bg-wash">
        <div className="mx-auto grid max-w-[1232px] items-center gap-12 px-4 py-24 md:grid-cols-[1fr_1.15fr] md:px-6">
          <div className="reveal">
            <Eyebrow>Context and conversation</Eyebrow>
            <h2 className="mt-3 text-[34px] font-medium leading-tight tracking-[-0.02em] md:text-[42px]">Every decision, in the issue.</h2>
            <p className="mt-4 max-w-[480px] text-[16px] leading-relaxed text-slate">Stop losing decisions across chat threads and documents. The description, the discussion and the history of every change live on the issue itself.</p>
            <div className="mt-8 flex flex-col gap-3">
              {[['Clear descriptions', 'Steps, notes and links, written once and kept with the work.'], ['Comments with @mentions', 'Ask the right person right where the work is.'], ['A history you can trust', 'Who moved what, and when, recorded automatically.']].map(([a, b]) => (
                <div key={a} className="rounded-[4px] border border-line bg-paper px-4 py-3"><div className="text-[14px] font-medium">{a}</div><div className="text-[13.5px] text-slate">{b}</div></div>
              ))}
            </div>
          </div>
          <div className="reveal" style={{ ['--d' as string]: '120ms' }}><IssueMock /></div>
        </div>
      </section>

      <section id="why" className="scroll-mt-16 bg-ink text-paper">
        <div ref={quote} className="mx-auto max-w-[920px] px-4 py-24 text-center md:px-6">
          <p className="reveal text-[30px] font-medium leading-tight tracking-[-0.02em] [text-wrap:balance] md:text-[44px]">“We stopped paying for Jira. Nobody missed it.”</p>
          <p className="reveal label-mono mt-6 text-[#8E93A8]" style={{ ['--d' as string]: '100ms' }}>— The goal, for a 28-person team</p>
          <div className="reveal mx-auto mt-12 grid max-w-[560px] grid-cols-2 border-t border-white/15 pt-8" style={{ ['--d' as string]: '200ms' }}>
            <div className="border-r border-white/15">
              <div className="label-mono text-[#8E93A8]">Jira today</div>
              <div className="mt-2 font-mono text-[28px] text-[#8E93A8]"><span className="relative inline-block">$1,120 / mo<span className="strike-line" /></span></div>
            </div>
            <div>
              <div className="label-mono text-[#B6BACB]">With Tack</div>
              <div className="zero mt-2 font-mono text-[28px] text-paper">$0 / mo</div>
            </div>
          </div>
          <p className="reveal mt-8 text-[14px] text-[#B6BACB]" style={{ ['--d' as string]: '300ms' }}>Built in-house on free tools. Simple enough to run ourselves, polished enough to sell.</p>
        </div>
      </section>

      <section ref={ai} className="mx-auto max-w-[1232px] px-4 py-24 md:px-6">
        <div className="reveal max-w-[720px]">
          <div className="label-mono flex items-center gap-2 text-slate"><span className="h-1.5 w-1.5 rounded-full bg-slate" />Optional · nothing changes until you connect it</div>
          <h2 className="mt-3 text-[34px] font-medium leading-tight tracking-[-0.02em] md:text-[42px]">Works with your AI, if you want it.</h2>
          <p className="mt-4 text-[16px] leading-relaxed text-slate">Tack is made for people first. No bots tagging you, no summaries cluttering the screen. When someone does want help from Claude or Cursor, it can read and update issues the same way you do, and every change it makes is labelled.</p>
        </div>
        <div className="mt-12 grid gap-4 lg:grid-cols-[repeat(3,1fr)_1.25fr]">
          {[
            ['MCP', 'Connect Claude or Cursor', 'One command and a personal key. Four actions: search, read, create, update.', <code key="c" className="block rounded-[4px] bg-ink p-3 font-mono text-[11px] leading-relaxed text-accent-soft">claude mcp add tack …/mcp</code>],
            ['llms.txt', 'One file explains Tack', 'A short plain-text guide any AI can read to understand your projects and fields.', <code key="l" className="block rounded-[4px] bg-cloud p-3 font-mono text-[11px] leading-relaxed text-slate"># Tack<br />## Tools</code>],
            ['Copy for AI', 'Copy any issue for AI', 'One button turns an issue into clean text you can paste into any chat.', <span key="b" className="inline-flex h-8 items-center gap-1.5 rounded-[4px] border border-line bg-cloud px-2.5 font-mono text-[11px]"><Icon name="content_copy" className="!text-[14px]" />Copy for AI</span>],
          ].map(([e, t, b, x], i) => (
            <div key={e as string} className="reveal flex flex-col justify-between gap-6 rounded-[4px] border border-line p-5" style={{ ['--d' as string]: `${i * 100}ms` }}>
              <div><div className="label-mono text-slate">{e}</div><h3 className="mt-3 text-[17px] font-medium">{t}</h3><p className="mt-2 text-[13.5px] leading-relaxed text-slate">{b}</p></div>
              {x}
            </div>
          ))}
          <div className="reveal relative flex min-h-[260px] items-center justify-center overflow-hidden rounded-[4px] border border-line bg-paper p-4" style={{ ['--d' as string]: '300ms' }}>
            <img src="/illustrations/connector.webp" alt="Line drawing of an AI block plugged into Tack" width={1200} height={800} loading="lazy" className="h-auto w-full" />
          </div>
        </div>
      </section>

      <section id="faq" ref={faq} className="scroll-mt-16 border-t border-line bg-[#FAFAFA]">
        <div className="mx-auto max-w-[900px] px-4 py-24 md:px-6">
          <Eyebrow>Questions</Eyebrow>
          <h2 className="mt-3 text-[34px] font-medium tracking-[-0.02em]">Frequently asked questions.</h2>
          <div className="mt-10 border-t border-line">
            {FAQ.map(([q, a], i) => (
              <div key={q} className="border-b border-line">
                <button className="flex w-full items-center justify-between gap-4 py-5 text-left text-[16px] font-medium" aria-expanded={openQ === i} onClick={() => setOpenQ(openQ === i ? null : i)}>
                  {q}<Icon name={openQ === i ? 'remove' : 'add'} className="text-accent" />
                </button>
                {openQ === i && <p className="anim-rise -mt-1 max-w-[680px] pb-5 text-[15px] leading-relaxed text-slate">{a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section ref={cta} className="mx-auto max-w-[1232px] px-4 py-20 md:px-6">
        <div className="reveal rounded-[4px] border border-line bg-cloud px-6 py-16 text-center">
          <h2 className="text-[36px] font-medium tracking-[-0.02em] md:text-[48px]">Start with the board.</h2>
          <p className="mx-auto mt-4 max-w-[440px] text-[16px] text-slate">No credit card, no sales call. Open it and move your first card.</p>
          <Button onClick={open} className="mt-8 !h-11 !px-6 !text-[15px]">Open Tack</Button>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1232px] flex-wrap justify-between gap-10 px-4 py-12 md:px-6">
          <div>
            <span className="flex items-center gap-2.5"><LogoMark /><span className="text-[18px] font-medium">Tack</span></span>
            <p className="mt-3 text-[13.5px] text-slate">The calm issue tracker for small teams.</p>
          </div>
          <div className="flex gap-16">
            <div className="flex flex-col gap-2 text-[13.5px]"><div className="label-mono mb-1">Product</div><Link to="/app/WEB/board" className="link w-fit text-slate">Board</Link><Link to="/app/WEB/list" className="link w-fit text-slate">List</Link><Link to="/app/me" className="link w-fit text-slate">My issues</Link></div>
            <div className="flex flex-col gap-2 text-[13.5px]"><div className="label-mono mb-1">Tack</div><a href="#why" className="link w-fit text-slate">Why Tack</a><a href="#faq" className="link w-fit text-slate">FAQ</a><Link to="/login" className="link w-fit text-slate">Log in</Link></div>
          </div>
        </div>
        <div className="border-t border-line">
          <div className="mx-auto max-w-[1232px] px-4 py-5 font-mono text-[11px] text-slate md:px-6">© 2026 Tack. A product vision demo.</div>
        </div>
      </footer>
    </div>
  )
}
