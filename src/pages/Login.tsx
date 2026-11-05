import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, ShieldCheck } from 'lucide-react'
import { useStore } from '../store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Logo } from '@/lib/ui'

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

export default function Login() {
  const { dispatch } = useStore()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)

  const signIn = () => {
    setBusy(true)
    setTimeout(() => { dispatch({ t: 'signIn' }); navigate('/app/WEB/board') }, 500)
  }

  return (
    <div className="flex min-h-dvh flex-col bg-paper px-4">
      <main className="flex flex-1 items-center justify-center py-16">
        <div className="anim-rise flex w-full max-w-[380px] flex-col items-center">
          <Link to="/" className="mb-8" aria-label="Tack home"><Logo size="lg" /></Link>
          <Card className="w-full rounded-[4px] py-0 shadow-none">
            <CardContent className="p-8 text-center">
              <h1 className="text-[28px] font-medium leading-tight tracking-[-0.02em]">Sign in to Tack</h1>
              <p className="mt-2 text-[14px] text-slate">Use your company Google account.</p>
              <Button variant="secondary" size="lg" onClick={signIn} disabled={busy} className="mt-7 w-full text-[14px]">
                {busy ? <Loader2 className="animate-spin" /> : <GoogleG />}
                {busy ? 'Signing you in…' : 'Continue with Google'}
              </Button>
              <div className="mt-6 border-t border-line pt-5">
                <span className="label-mono inline-flex items-center gap-1.5 text-slate"><ShieldCheck className="size-3.5" />Company accounts only</span>
              </div>
            </CardContent>
          </Card>
          <p className="mt-5 text-center font-mono text-[11px] text-slate">Demo: no account needed, any click signs you in.</p>
        </div>
      </main>
      <footer className="label-mono pb-6 text-center text-slate">Tack · Internal</footer>
    </div>
  )
}
