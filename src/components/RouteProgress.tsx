import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

const bar = () => document.getElementById('route-bar')

function run(waitFor: Promise<unknown>) {
  const el = bar()
  const fill = el?.querySelector('i') as HTMLElement | null
  if (!el || !fill) return
  el.classList.add('on')
  fill.style.width = '66.667%'
  const started = performance.now()
  waitFor.finally(() => {
    // Let the jump to two-thirds read before completing.
    const wait = Math.max(0, 260 - (performance.now() - started))
    setTimeout(() => {
      fill.style.width = '100%'
      setTimeout(() => {
        el.classList.remove('on')
        setTimeout(() => { fill.style.width = '0' }, 220)
      }, 340)
    }, wait)
  })
}

export default function RouteProgress() {
  const { pathname } = useLocation()
  const first = useRef(true)

  useEffect(() => {
    if (first.current) {
      first.current = false
      const loaded = new Promise(r => document.readyState === 'complete' ? r(null) : window.addEventListener('load', () => r(null), { once: true }))
      run(Promise.all([document.fonts?.ready ?? Promise.resolve(), loaded]))
      return
    }
    run(new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))))
  }, [pathname])

  return null
}
