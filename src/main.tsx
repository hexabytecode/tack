import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import './index.css'
import { StoreProvider } from './store'
import RouteProgress from './components/RouteProgress'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import AppShell from './components/AppShell'
import Landing from './pages/Landing'
import Login from './pages/Login'

const Board = lazy(() => import('./pages/Board'))
const List = lazy(() => import('./pages/List'))
const MyIssues = lazy(() => import('./pages/MyIssues'))
const Settings = lazy(() => import('./pages/Settings'))
const AiGuide = lazy(() => import('./pages/AiGuide'))

const TITLES: [RegExp, string][] = [
  [/^\/$/, 'Tack — the issue tracker your team will actually use'],
  [/^\/login/, 'Sign in · Tack'],
  [/^\/ai$/, 'Tack for AI'],
  [/\/board$/, 'Board · Tack'],
  [/\/list$/, 'List · Tack'],
  [/\/me$/, 'My issues · Tack'],
  [/\/settings$/, 'Settings · Tack'],
]

function ScrollAndTitle() {
  const { pathname } = useLocation()
  useEffect(() => {
    if (pathname === '/' || pathname === '/ai') window.scrollTo(0, 0)
    document.title = TITLES.find(([re]) => re.test(pathname))?.[1] ?? 'Tack'
  }, [pathname])
  return null
}

const app = (el: React.ReactNode) => <AppShell><Suspense fallback={<div className="flex-1 bg-wash" />}>{el}</Suspense></AppShell>

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <StoreProvider>
        <TooltipProvider delayDuration={300}>
        <RouteProgress />
        <ScrollAndTitle />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/ai" element={<Suspense fallback={null}><AiGuide /></Suspense>} />
          <Route path="/app" element={<Navigate to="/app/WEB/board" replace />} />
          <Route path="/app/me" element={app(<MyIssues />)} />
          <Route path="/app/:project/board" element={app(<Board />)} />
          <Route path="/app/:project/list" element={app(<List />)} />
          <Route path="/app/:project/settings" element={app(<Settings />)} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster theme="light" position="bottom-right" toastOptions={{ className: 'font-sans text-[13px]' }} />
        </TooltipProvider>
      </StoreProvider>
    </BrowserRouter>
  </StrictMode>,
)
