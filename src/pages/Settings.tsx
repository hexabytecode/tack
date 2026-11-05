import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Archive, Bot, RotateCcw, Copy, Eye, EyeOff, FileText, KeyRound, Play, Plug, Save, Terminal, UserPlus, UserMinus } from 'lucide-react'
import { useStore } from '../store'
import { ME } from '../data/mock'
import { TopBar, Crumb } from '../components/AppShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Avatar, cx } from '@/lib/ui'

function Section({ label, icon: I, children, danger, aside }: { label: string; icon: typeof Plug; children: ReactNode; danger?: boolean; aside?: ReactNode }) {
  return (
    <section className="mt-10 first:mt-0">
      <div className={cx('label-mono mb-5 flex items-center justify-between border-b border-line pb-2', danger ? 'text-destructive' : 'text-slate')}>
        <span className="flex items-center gap-1.5"><I className="size-3.5" />{label}</span>{aside}
      </div>
      {children}
    </section>
  )
}

async function copy(text: string) { try { await navigator.clipboard.writeText(text); return true } catch { return false } }

export default function Settings() {
  const { project = 'WEB' } = useParams()
  const { state, dispatch, user, toast } = useStore()
  const navigate = useNavigate()
  const p = state.projects.find(x => x.key === project)
  const [name, setName] = useState(p?.name ?? '')
  const [invite, setInvite] = useState('')
  const [showKey, setShowKey] = useState(false)
  useEffect(() => { setName(p?.name ?? '') }, [p?.key, p?.name])

  if (!p) return <Navigate to="/app/WEB/settings" replace />
  const members = p.members.map(id => user(id)!).filter(Boolean)
  const command = 'claude mcp add --transport http tack https://tack.company.com/mcp \\\n  --header "Authorization: Bearer tk_••••••••"'
  const key = showKey ? 'tk_demo_7Hq2LmX9vR4bN8sK' : 'tk_••••••••••••••••••••'

  const agentDemo = () => {
    const target = state.issues.find(i => i.key === 'WEB-139' && i.status !== 'review')
      ?? state.issues.find(i => i.project === 'WEB' && i.status === 'progress')
    if (!target) { toast('Nothing left for the AI to move'); return }
    navigate('/app/WEB/board')
    setTimeout(() => {
      dispatch({ t: 'agent', key: target.key, status: 'review', note: 'Opened the change for review and moved this card.\n\n> [!NOTE] The fix is ready for someone to check.' })
      toast(`Claude moved ${target.key}`, { kind: 'agent', status: 'review', description: 'by agent' })
    }, 900)
  }

  return (
    <>
      <TopBar crumbs={<Crumb project={project} page="Settings" />} />
      <main className="min-h-0 flex-1 overflow-y-auto bg-wash">
        <div className="mx-auto max-w-[760px] px-4 py-8 md:px-8">
          <h1 className="text-[28px] font-medium leading-tight tracking-[-0.02em]">Project settings</h1>
          <p className="mb-10 mt-1 text-[14px] text-slate">Name, people and connections for {p.name}.</p>

          <Section label="General" icon={FileText}>
            <form className="flex flex-col gap-5" onSubmit={e => { e.preventDefault(); if (name.trim()) { dispatch({ t: 'project', key: p.key, patch: { name: name.trim() } }); toast('Project saved', { kind: 'success' }) } }}>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="project-name">Project name</Label>
                <Input id="project-name" value={name} onChange={e => setName(e.target.value)} className="h-[38px] bg-paper" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="project-key">Key</Label>
                <Input id="project-key" value={p.key} readOnly className="h-[38px] max-w-[120px] bg-cloud font-mono text-slate" />
                <span className="font-mono text-[11.5px] text-slate">Issues are numbered {p.key}-1, {p.key}-2…</span>
              </div>
              <div><Button type="submit" disabled={!name.trim() || name.trim() === p.name}><Save />Save changes</Button></div>
            </form>
          </Section>

          <Section label="Members" icon={UserPlus} aside={<Badge variant="secondary" className="rounded-[4px] text-[10px]">{members.length} total</Badge>}>
            <form className="mb-3 flex gap-2" onSubmit={e => { e.preventDefault(); if (/\S+@\S+\.\S+/.test(invite)) { dispatch({ t: 'invite', email: invite.trim(), project: p.key }); toast('Invite sent', { kind: 'success', description: invite.trim() }); setInvite('') } }}>
              <Input id="invite-email" value={invite} onChange={e => setInvite(e.target.value)} placeholder="colleague@company.com" type="email" className="h-[38px] bg-paper" />
              <Button type="submit" variant="secondary" className="h-[38px]" disabled={!invite}><UserPlus />Invite</Button>
            </form>
            <ul className="divide-y divide-line rounded-[4px] border border-line bg-paper">
              {members.map(u => (
                <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar user={u} size={30} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-[14px] font-medium">{u.name}{u.id === ME && <Badge variant="outline" className="h-4 rounded-[3px] px-1 font-mono text-[10px] font-normal text-slate">You</Badge>}</div>
                      <div className="truncate font-mono text-[11.5px] text-slate">{u.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={u.role} disabled={u.id === ME} onValueChange={v => { dispatch({ t: 'role', user: u.id, role: v as 'Admin' | 'Member' }); toast(`${u.name} is now ${v === 'Admin' ? 'an admin' : 'a member'}`) }}>
                      <SelectTrigger size="sm" className="h-8 w-[118px] text-[13px]" aria-label={`Role for ${u.name}`}><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="Admin">Admin</SelectItem><SelectItem value="Member">Member</SelectItem></SelectContent>
                    </Select>
                    {u.id === ME
                      ? <span className="w-[86px] text-right text-[13px] text-slate">Owner</span>
                      : <Button variant="ghost" size="sm" className="w-[86px] text-slate" onClick={() => { dispatch({ t: 'removeMember', user: u.id, project: p.key }); toast(`${u.name} removed from ${p.name}`) }}><UserMinus />Remove</Button>}
                  </div>
                </li>
              ))}
            </ul>
          </Section>

          <Section label="AI connections · optional" icon={Plug} aside={<span className="normal-case tracking-normal">Off until you connect it</span>}>
            <p className="mb-5 max-w-[60ch] text-[14px] leading-relaxed text-slate">
              Let Claude, Cursor or another AI tool read and update this project for you. It gets four actions: search, read, create and update issues. Everything it does is marked “by agent” in the history.
            </p>
            <div className="flex flex-col gap-4">
              <div className="rounded-[4px] border border-line bg-paper p-4">
                <div className="label-mono mb-2 flex items-center gap-1.5 text-slate"><KeyRound className="size-3.5" />Your personal key</div>
                <div className="flex flex-wrap items-center gap-2">
                  <code className="min-w-0 flex-1 truncate rounded-[4px] bg-cloud px-3 py-2 font-mono text-[12.5px]">{key}</code>
                  <Button size="sm" variant="secondary" onClick={() => setShowKey(s => !s)}>{showKey ? <EyeOff /> : <Eye />}{showKey ? 'Hide' : 'Show'}</Button>
                  <Button size="sm" variant="secondary" onClick={async () => toast(await copy('tk_demo_7Hq2LmX9vR4bN8sK') ? 'Key copied' : 'Copy blocked by the browser', { kind: 'copy' })}><Copy />Copy</Button>
                </div>
                <p className="mt-2 font-mono text-[11px] text-slate">Demo key. It doesn’t connect to anything.</p>
              </div>
              <div className="rounded-[4px] bg-ink p-4">
                <div className="label-mono mb-2 flex items-center justify-between text-[#8E93A8]">
                  <span className="flex items-center gap-1.5"><Terminal className="size-3.5" />Connect Claude Code</span>
                  <button className="flex items-center gap-1 normal-case tracking-normal hover:text-paper" onClick={async () => toast(await copy(command) ? 'Command copied' : 'Copy blocked by the browser', { kind: 'copy', description: 'Paste it into your terminal' })}><Copy className="size-3.5" />Copy</button>
                </div>
                <code className="block whitespace-pre-wrap break-all font-mono text-[12.5px] leading-relaxed text-brand-soft">{command}</code>
              </div>
              <div className="rounded-[4px] border border-line bg-paper">
                <div className="flex items-center justify-between border-b border-line px-4 py-2">
                  <span className="flex items-center gap-2 font-mono text-[12px]"><FileText className="size-4 text-slate" />llms.txt</span>
                  <span className="font-mono text-[11px] text-slate">The file your AI reads first</span>
                </div>
                <pre className="overflow-x-auto px-4 py-3 font-mono text-[12px] leading-[1.8] text-slate">{`# Tack
> A calm, simple issue tracker. People first; AI optional.

## Getting started
Connect to https://tack.company.com/mcp with your personal key.

## Tools
- search_issues · get_issue · create_issue · update_issue`}</pre>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[4px] border border-dashed border-brand/40 bg-tint px-4 py-3">
                <span className="flex items-center gap-2 text-[13.5px]"><Bot className="size-4 text-brand" />See what an AI update looks like on the board.</span>
                <Button size="sm" onClick={agentDemo}><Play />Show me</Button>
              </div>
            </div>
          </Section>

          <Section label="Danger zone" icon={Archive} danger>
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-[4px] border border-destructive/30 bg-paper p-5">
              <div>
                <div className="text-[14px] font-medium">Archive project</div>
                <p className="text-[13px] text-slate">Makes {p.name} read-only. Nobody can add or change issues.</p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive hover:text-paper"><Archive />Archive project</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[420px]">
                  <DialogHeader>
                    <DialogTitle>Archive {p.name}?</DialogTitle>
                    <DialogDescription>Everyone keeps read access, but nobody can add or change issues. You can undo this later.</DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                    <DialogClose asChild><Button variant="destructive" onClick={() => toast('Archiving is turned off in this demo')}>Yes, archive</Button></DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <div className="mt-8 flex items-center justify-between rounded-[4px] border border-dashed border-line px-4 py-3">
              <span className="text-[13px] text-slate">This is a demo. Changes are kept in your browser only.</span>
              <Button variant="ghost" size="sm" onClick={() => { dispatch({ t: 'reset' }); toast('Demo data reset', { kind: 'success', description: 'Back to the original sample issues' }) }}><RotateCcw />Reset demo data</Button>
            </div>
          </Section>
        </div>
      </main>
    </>
  )
}
