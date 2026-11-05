import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bot, Check, ChevronDown, Copy, ExternalLink, FileText, Plug, Terminal, ListTodo } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Nav } from './Landing'
import Markdown from '../components/Markdown'
import { notify } from '@/lib/notify'
import { cn } from '@/lib/utils'

const GUIDES = [
  { file: 'getting-started.md', title: 'Getting started', icon: Plug, blurb: 'Connect Claude, Cursor or another AI tool in one step.' },
  { file: 'issues.md', title: 'Issues', icon: ListTodo, blurb: 'What an issue is: its fields, statuses, keys and comments.' },
  { file: 'mcp.md', title: 'MCP tools', icon: Bot, blurb: 'The four actions an AI can take, with an example for each.' },
  { file: 'api.md', title: 'REST API', icon: Terminal, blurb: 'The same four actions over plain HTTP, for scripts.' },
]

async function copyText(text: string, what: string) {
  try { await navigator.clipboard.writeText(text); notify(`${what} copied`, { kind: 'copy', description: 'Paste it into your AI tool' }) }
  catch { notify('Copy blocked by the browser', { kind: 'info' }) }
}

function GuideCard({ g }: { g: typeof GUIDES[number] }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState<string | null>(null)
  const url = `/ai/${g.file}`
  const load = async (): Promise<string> => {
    if (text !== null) return text
    const t = await fetch(url).then(r => r.text())
    setText(t)
    return t
  }
  return (
    <div className="flex flex-col rounded-[6px] border border-line bg-paper">
      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-[6px] border border-[#C9D3F6] bg-[#EEF2FD]"><g.icon className="size-4 text-brand" /></span>
            <div>
              <h3 className="text-[16px] font-medium">{g.title}</h3>
              <span className="font-mono text-[11.5px] text-slate">{url}</span>
            </div>
          </div>
        </div>
        <p className="text-[14px] leading-relaxed text-slate">{g.blurb}</p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={async () => copyText(await load(), g.title)}><Copy />Copy</Button>
          <Button size="sm" variant="ghost" asChild><a href={url} target="_blank" rel="noreferrer"><ExternalLink />Open .md</a></Button>
          <Button size="sm" variant="ghost" className="ml-auto text-slate" onClick={async () => { await load(); setOpen(o => !o) }} aria-expanded={open}>
            {open ? 'Hide' : 'Read here'}<ChevronDown className={cn('transition-transform duration-200', open && 'rotate-180')} />
          </Button>
        </div>
      </div>
      {open && text && <div className="anim-rise border-t border-line bg-wash px-5 py-4"><Markdown>{text}</Markdown></div>}
    </div>
  )
}

export default function AiGuide() {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://tack.app'
  const prompt = `Read ${origin}/llms.txt, then show me what's assigned to me this week.`
  const [copied, setCopied] = useState(false)
  return (
    <div className="min-h-dvh bg-paper">
      <Nav />
      <section className="border-b border-line bg-wash">
        <div className="mx-auto max-w-[960px] px-4 py-16 md:px-6 md:py-20">
          <Badge variant="outline" className="gap-1.5 rounded-[4px] bg-paper font-mono text-[10.5px] uppercase tracking-[0.06em] text-slate"><span className="size-1.5 rounded-full bg-slate" />Optional</Badge>
          <h1 className="mt-5 text-[38px] font-medium leading-[1.08] tracking-[-0.03em] md:text-[52px]">Hand Tack to your AI.</h1>
          <p className="mt-4 max-w-[600px] text-[17px] leading-relaxed text-slate">If you use Claude, Cursor or ChatGPT, give it this one line. It reads a short index, then only the guide it needs.</p>
          <div className="mt-8 flex flex-col gap-3 rounded-[6px] border border-line bg-paper p-2 pl-4 sm:flex-row sm:items-center">
            <code className="min-w-0 flex-1 py-2 font-mono text-[13px] leading-relaxed text-ink">{prompt}</code>
            <div className="flex shrink-0 gap-2">
              <Button variant="ghost" asChild><a href="/llms.txt" target="_blank" rel="noreferrer"><FileText />llms.txt</a></Button>
              <Button onClick={async () => { await copyText(prompt, 'Prompt'); setCopied(true); setTimeout(() => setCopied(false), 1500) }}>
                {copied ? <Check /> : <Copy />}{copied ? 'Copied' : 'Copy prompt'}
              </Button>
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-[960px] px-4 py-14 md:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="label-mono text-slate">The guides</div>
            <h2 className="mt-2 text-[26px] font-medium tracking-[-0.02em]">Four short files, one topic each.</h2>
          </div>
          <Link to="/app/WEB/settings" className="link text-[14px] text-slate">Get your personal key in Settings</Link>
        </div>
        <div className="mt-8 grid items-start gap-4 md:grid-cols-2">
          {GUIDES.map(g => <GuideCard key={g.file} g={g} />)}
        </div>
        <p className="mt-8 font-mono text-[11.5px] text-slate">Demo: addresses and keys on this page are examples.</p>
      </section>
    </div>
  )
}
