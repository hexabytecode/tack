import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import type { IssueType, Priority, Status } from '../data/mock'
import { USERS } from '../data/mock'
import { Avatar, PriorityBadge, StatusPill, TypeBadge, cx } from '@/lib/ui'
import { ArrowCursor, GrabCursor } from './Cursors'

export type DemoCard = { key: string; title: string; type: IssueType; prio: Priority; who: string; col: Status }
type Hop = [key: string, to: Status]

/* A demo board drawn at a fixed design size and scaled to fit, so every card has a
   calculated position. Cards glide between positions with plain CSS transitions:
   nothing is re-measured, so scrolling or other animations on the page can't knock it off. */

export function Scaled({ width, height, children, className }: { width: number; height: number; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [width])
  return (
    <div ref={ref} className={cx('relative w-full', className)} style={{ height: height * scale }}>
      <div className="absolute left-0 top-0 origin-top-left" style={{ width, height, transform: `scale(${scale})` }}>{children}</div>
    </div>
  )
}

const CARD_H = 84
const GAP = 8
const PAD = 12
const COL_GAP = 12
const HEAD = 36
const INNER = 8
export const boardHeight = (rows: number) => PAD * 2 + HEAD + INNER + rows * (CARD_H + GAP)
const EASE = 'cubic-bezier(0.22, 0.9, 0.24, 1)'

function Card({ c, lifted, landed, done }: { c: DemoCard; lifted: boolean; landed: boolean; done: boolean }) {
  return (
    <div className={cx('flex h-full flex-col justify-between rounded-[4px] border bg-paper p-2.5 transition-[box-shadow,border-color] duration-200',
      lifted ? 'border-ink shadow-[0_16px_32px_-6px_rgba(0,0,0,.22)]' : 'border-line', landed && 'flash')}>
      <p className={cx('line-clamp-2 text-[12.5px] font-medium leading-snug', done && 'text-slate')}>{c.title}</p>
      <div className="flex items-center justify-between gap-1">
        <span className="flex min-w-0 items-center gap-1">
          <span className="whitespace-nowrap font-mono text-[10.5px] text-slate">{c.key}</span>
          <TypeBadge type={c.type} compact /><PriorityBadge priority={c.prio} compact />
        </span>
        <Avatar user={USERS.find(u => u.id === c.who)} size={20} />
      </div>
    </div>
  )
}

export function DragBoard({ columns, initial, hops, width, rows, interval = 3400, startDelay = 1400, className }: {
  columns: Status[]; initial: DemoCard[]; hops: Hop[]; width: number; rows: number; interval?: number; startDelay?: number; className?: string
}) {
  const n = columns.length
  const colW = (width - 2 * PAD - (n - 1) * COL_GAP) / n
  const height = boardHeight(rows)
  const [cards, setCards] = useState(() => initial.map((c, i) => ({ ...c, order: i })))
  const [lifted, setLifted] = useState<string | null>(null)
  const [landed, setLanded] = useState<string | null>(null)
  const [arrow, setArrow] = useState({ x: width * 0.6, y: height * 0.6, show: false, jump: true })
  const cardsRef = useRef(cards)
  cardsRef.current = cards
  const boxRef = useRef<HTMLDivElement>(null)

  const place = (list: typeof cards) => {
    const pos: Record<string, { x: number; y: number }> = {}
    columns.forEach((col, ci) => {
      list.filter(c => c.col === col).sort((a, b) => a.order - b.order).forEach((c, i) => {
        pos[c.key] = { x: PAD + ci * (colW + COL_GAP) + INNER, y: PAD + HEAD + i * (CARD_H + GAP) }
      })
    })
    return pos
  }
  const pos = place(cards)
  const grip = (p: { x: number; y: number }) => ({ x: p.x + (colW - 2 * INNER) * 0.62, y: p.y + CARD_H * 0.48 })

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let timers: number[] = []
    let step = 0
    let visible = false
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting }, { threshold: 0.1 })
    if (boxRef.current) io.observe(boxRef.current)
    const later = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms))
    const tick = () => {
      if (!visible || document.hidden) return
      const [key, to] = hops[step % hops.length]
      const card = cardsRef.current.find(c => c.key === key)
      step++
      if (!card || card.col === to) return
      const dest = to
      const start = place(cardsRef.current)[key]
      if (!start) return
      setArrow(a => ({ ...grip(start), show: true, jump: !a.show }))
      later(700, () => { setArrow(a => ({ ...a, show: false })); setLifted(key) })
      later(860, () => setCards(cs => {
        const top = Math.min(0, ...cs.filter(c => c.col === dest).map(c => c.order)) - 1
        return cs.map(c => c.key === key ? { ...c, col: dest, order: top } : c)
      }))
      later(1640, () => {
        const end = place(cardsRef.current)[key]
        setLifted(null); setLanded(key)
        if (end) setArrow({ ...grip(end), show: true, jump: true })
      })
      later(1720, () => setArrow(a => ({ ...a, jump: false })))
      later(1900, () => setArrow(a => ({ ...a, x: a.x + 38, y: a.y + 30 })))
      later(2900, () => setLanded(null))
    }
    const first = window.setTimeout(tick, startDelay)
    const loop = window.setInterval(tick, interval)
    return () => { clearTimeout(first); clearInterval(loop); timers.forEach(clearTimeout); timers = []; io.disconnect() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const cardStyle = (key: string): CSSProperties => {
    const p = pos[key]
    const up = lifted === key
    return {
      width: colW - 2 * INNER, height: CARD_H,
      transform: `translate3d(${p.x}px, ${p.y - (up ? 6 : 0)}px, 0) scale(${up ? 1.035 : 1})`,
      transition: `transform ${up ? 760 : 520}ms ${EASE}`,
      zIndex: up ? 30 : 1,
    }
  }

  return (
    <div ref={boxRef} className={cx('relative bg-wash', className)} style={{ width, height }}>
      {columns.map((col, ci) => (
        <div key={col} className="absolute rounded-[4px] border border-line bg-cloud" style={{ left: PAD + ci * (colW + COL_GAP), top: PAD, width: colW, height: height - 2 * PAD }}>
          <div className="flex h-[36px] items-center gap-1.5 px-2"><StatusPill status={col} size="sm" /><span className="font-mono text-[10.5px] text-slate">{cards.filter(c => c.col === col).length}</span></div>
        </div>
      ))}
      {cards.map(c => (
        <div key={c.key} className="absolute left-0 top-0 will-change-transform" style={cardStyle(c.key)}>
          <Card c={c} lifted={lifted === c.key} landed={landed === c.key} done={c.col === 'done'} />
          <span className={cx('pointer-events-none absolute left-[62%] top-[48%] -translate-x-1/2 -translate-y-1/2 transition-opacity duration-150', lifted === c.key ? 'opacity-100' : 'opacity-0')}><GrabCursor /></span>
        </div>
      ))}
      <div aria-hidden="true" className="pointer-events-none absolute left-0 top-0 z-40 will-change-transform"
        style={{ transform: `translate3d(${arrow.x}px, ${arrow.y}px, 0)`, opacity: arrow.show ? 1 : 0,
          transition: arrow.jump ? 'opacity 120ms ease' : `transform 650ms ${EASE}, opacity 120ms ease` }}>
        <ArrowCursor />
      </div>
    </div>
  )
}
