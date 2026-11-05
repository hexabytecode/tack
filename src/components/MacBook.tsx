import { useEffect, useRef, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, Lock, PanelLeft, Plus, RotateCw, Share, Copy as Tabs } from 'lucide-react'
import { Scaled } from './DragBoard'

/* The laptop is the vector MacBook Pro from the MakPay hero mockup (public/illustrations/macbook.svg),
   with its screen left open. The live page sits behind that opening, drawn at a fixed design size and
   scaled to fit, so frame and contents always line up. Numbers are positions in the SVG's viewBox. */
const FRAME = { w: 1400, h: 790, screen: { x: 156, y: 26, w: 1111, h: 674 } }
export const SCREEN_W = 1200
export const SCREEN_H = Math.round(SCREEN_W * FRAME.screen.h / FRAME.screen.w)
const CHROME_H = 24 + 44
export const APP_H = SCREEN_H - CHROME_H

const pct = (v: number, of: number) => `${(v / of) * 100}%`

/** `show` is how much of the laptop's height is visible; the rest is cut off below.
    While the laptop scrolls into view it grows from slightly smaller to full size. */
export function MacBook({ children, show = 1, url = 'tack.app/website-relaunch/board' }: { children: ReactNode; show?: number; url?: string }) {
  const s = FRAME.screen
  const lid = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = lid.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    const update = () => {
      raf = 0
      const r = el.getBoundingClientRect()
      const vh = window.innerHeight
      const p = Math.min(1, Math.max(0, 1 - (r.top - vh * 0.15) / (vh * 0.6)))
      const e = 1 - (1 - p) ** 2
      el.style.transform = `scale(${0.86 + 0.14 * e})`
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(raf) }
  }, [])
  return (
    <div className="relative mx-auto w-full overflow-hidden" style={{ aspectRatio: `${FRAME.w} / ${FRAME.h * show}` }}>
      <div ref={lid} className="absolute inset-x-0 top-0 origin-top will-change-transform" style={{ aspectRatio: `${FRAME.w} / ${FRAME.h}` }}>
        <div className="absolute overflow-hidden rounded-[0.6%] bg-paper" style={{ left: pct(s.x, FRAME.w), top: pct(s.y, FRAME.h), width: pct(s.w, FRAME.w), height: pct(s.h, FRAME.h) }}>
          <Scaled width={SCREEN_W} height={SCREEN_H}>
            <div className="flex h-[24px] items-center justify-between bg-[#ececee] px-4 pl-5 text-[11.5px] text-ink">
              <span className="flex items-center gap-4"><span className="font-semibold">Safari</span><span>File</span><span>Edit</span><span>View</span><span>History</span><span>Window</span></span>
              <span className="flex items-center gap-3 text-[11px]"><span>100%</span><span>Wed 5 Nov</span><span>9:41</span></span>
            </div>
            <SafariBar url={url} />
            <div className="bg-paper" style={{ height: APP_H }}>{children}</div>
          </Scaled>
        </div>
        <img src="/illustrations/macbook.svg" alt="" aria-hidden="true" draggable={false}
          className="pointer-events-none absolute inset-0 size-full select-none" />
      </div>
    </div>
  )
}

function SafariBar({ url }: { url: string }) {
  const icon = 'size-[15px] text-[#7a7c83]'
  return (
    <div className="flex h-[44px] items-center gap-3 border-b border-[#dcdce0] bg-[#f6f6f8] px-4">
      <span className="flex items-center gap-[7px]">
        <span className="size-[12px] rounded-full bg-[#ff5f57] ring-1 ring-black/10" />
        <span className="size-[12px] rounded-full bg-[#febc2e] ring-1 ring-black/10" />
        <span className="size-[12px] rounded-full bg-[#28c840] ring-1 ring-black/10" />
      </span>
      <span className="flex items-center gap-3"><PanelLeft className={icon} /><ChevronLeft className={icon} /><ChevronRight className="size-[15px] text-[#c2c3c8]" /></span>
      <div className="mx-auto flex h-[28px] w-full max-w-[460px] items-center justify-center gap-1.5 rounded-[7px] bg-[#e9e9ec] px-3 text-[12px] text-[#3a3b40]">
        <Lock className="size-[11px] text-[#7a7c83]" /><span className="truncate">{url}</span>
        <RotateCw className="ml-auto size-[12px] text-[#7a7c83]" />
      </div>
      <span className="flex items-center gap-3"><Share className={icon} /><Plus className={icon} /><Tabs className={icon} /></span>
    </div>
  )
}
