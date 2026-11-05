import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, Lock } from 'lucide-react'
import { useStore } from '../store'
import { Button } from '@/components/ui/button'
import { Avatar, PriorityBadge, StatusPill, TypeBadge, Wordmark } from '@/lib/ui'
import { USERS, type IssueType, type Priority, type Status } from '../data/mock'

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  )
}

const PREVIEW: [string, string, Status, IssueType, Priority, string][] = [
  ['WEB-142', 'Checkout button overlaps footer on mobile', 'progress', 'bug', 'high', 'al'],
  ['WEB-139', 'Add VAT number to invoices', 'review', 'task', 'high', 'jd'],
  ['APP-31', 'Push notifications fail on iOS 17.4', 'todo', 'bug', 'medium', 'cm'],
]

export default function Login() {
  const { dispatch } = useStore()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)

  const signIn = () => {
    setBusy(true)
    setTimeout(() => { dispatch({ t: 'signIn' }); navigate('/app/WEB/board') }, 600)
  }

  return (
    <div className="grid min-h-dvh bg-paper lg:grid-cols-[1fr_1.1fr]">
      <div className="flex flex-col px-6 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Link to="/" aria-label="Tack home"><Wordmark height={26} /></Link>
          <Button variant="ghost" size="sm" asChild className="text-slate"><Link to="/"><ArrowLeft />Back to site</Link></Button>
        </div>
        <main className="flex flex-1 items-center justify-center py-12">
          <div className="anim-rise w-full max-w-[360px]">
            <h1 className="text-[32px] font-medium leading-tight tracking-[-0.02em]">Welcome back.</h1>
            <p className="mt-2 text-[15px] text-slate">Sign in with your company Google account to open your team’s board.</p>
            <Button variant="outline" size="lg" onClick={signIn} disabled={busy} className="mt-8 w-full gap-3 text-[14.5px] font-medium">
              {busy ? <Loader2 className="animate-spin" /> : <GoogleG />}
              {busy ? 'Signing you in…' : 'Continue with Google'}
            </Button>
            <p className="mt-4 flex items-center gap-1.5 text-[12.5px] text-slate"><Lock className="size-3.5" />Only company accounts can sign in.</p>
            <div className="mt-10 rounded-[4px] border border-dashed border-line px-4 py-3 text-[12.5px] text-slate">
              <span className="font-medium text-ink">Demo:</span> no account needed. The button signs you in as Alex Lin.
            </div>
          </div>
        </main>
        <footer className="font-mono text-[11px] text-slate">© 2026 Tack</footer>
      </div>

      <aside className="relative hidden overflow-hidden border-l border-line bg-wash lg:flex lg:flex-col lg:justify-center lg:px-14">
        <div className="absolute inset-0 [background-image:radial-gradient(#E2E3E9_1px,transparent_1px)] [background-size:20px_20px] opacity-70" aria-hidden="true" />
        <div className="relative mx-auto w-full max-w-[460px]">
          <div className="label-mono text-slate">Website relaunch · this week</div>
          <p className="mt-3 text-[28px] font-medium leading-tight tracking-[-0.02em]">One calm board for the whole team.</p>
          <div className="mt-8 flex flex-col gap-3">
            {PREVIEW.map(([k, t, s, ty, p, w], i) => (
              <div key={k} className="hero-card rounded-[6px] border border-line bg-paper p-4 shadow-[0_8px_24px_-12px_rgba(0,0,0,.12)]" style={{ ['--d' as string]: `${200 + i * 120}ms`, marginLeft: i * 18 }}>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[14px] font-medium leading-snug">{t}</p>
                  <Avatar user={USERS.find(u => u.id === w)} size={24} />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className="font-mono text-[11px] text-slate">{k}</span>
                  <TypeBadge type={ty} /><PriorityBadge priority={p} />
                  <span className="ml-auto"><StatusPill status={s} size="sm" /></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  )
}
