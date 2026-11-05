import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight, Lock, PanelLeft, Plus, RotateCw, Share, Copy as Tabs } from 'lucide-react'
import { Scaled } from './DragBoard'

/* The laptop is a Figma render (public/illustrations/macbook-frame.webp) with its screen cut out.
   The live page sits behind that hole, drawn at a fixed design size and scaled to fit, so the
   frame and its contents always line up. Numbers below are pixel positions in the render. */
const FRAME = { w: 1493, h: 913, screen: { x: 122, y: 24, w: 1249, h: 775 } }
export const SCREEN_W = 1200
export const SCREEN_H = Math.round(SCREEN_W * FRAME.screen.h / FRAME.screen.w)
const CHROME_H = 24 + 44
export const APP_H = SCREEN_H - CHROME_H

const pct = (v: number, of: number) => `${(v / of) * 100}%`

export function MacBook({ children, url = 'tack.app/website-relaunch/board' }: { children: ReactNode; url?: string }) {
  const s = FRAME.screen
  return (
    <div className="relative mx-auto w-full" style={{ aspectRatio: `${FRAME.w} / ${FRAME.h}` }}>
      <div className="absolute overflow-hidden bg-paper" style={{ left: pct(s.x, FRAME.w), top: pct(s.y, FRAME.h), width: pct(s.w, FRAME.w), height: pct(s.h, FRAME.h) }}>
        <Scaled width={SCREEN_W} height={SCREEN_H}>
          <div className="flex h-[24px] items-center justify-between bg-[#ececee] px-4 pl-5 text-[11.5px] text-ink">
            <span className="flex items-center gap-4"><span className="font-semibold">Safari</span><span>File</span><span>Edit</span><span>View</span><span>History</span><span>Window</span></span>
            <span className="flex items-center gap-3 text-[11px]"><span>100%</span><span>Wed 5 Nov</span><span>9:41</span></span>
          </div>
          <SafariBar url={url} />
          <div className="bg-paper" style={{ height: APP_H }}>{children}</div>
        </Scaled>
      </div>
      <img src="/illustrations/macbook-frame.webp" alt="" aria-hidden="true" draggable={false} fetchPriority="high"
        className="pointer-events-none absolute inset-0 size-full select-none" />
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
