import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Nav } from './Landing'

export default function NotFound() {
  return (
    <div className="min-h-dvh bg-paper">
      <Nav />
      <main className="mx-auto flex max-w-[560px] flex-col items-center px-4 py-28 text-center">
        <span className="label-mono rounded-[4px] border border-line bg-wash px-2 py-1 text-[10.5px] text-slate">404</span>
        <h1 className="mt-5 text-[34px] font-medium leading-tight tracking-[-0.02em] md:text-[42px]">This page isn’t on the board.</h1>
        <p className="mt-3 text-[16px] leading-relaxed text-slate">The link may be old, or the address has a typo.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <Button size="lg" asChild><Link to="/">Back to home<ArrowRight /></Link></Button>
          <Button size="lg" variant="secondary" asChild><Link to="/app/WEB/board">Open the board</Link></Button>
        </div>
      </main>
    </div>
  )
}
