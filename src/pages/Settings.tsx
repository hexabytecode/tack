import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../store'
import { ME } from '../data/mock'
import { TopBar, Crumb } from '../components/AppShell'
import { Avatar, Button, Icon, cx } from '../lib/ui'

const input = 'h-[38px] w-full rounded-[4px] border border-line bg-paper px-3 text-[14px] focus:outline-2 focus:outline-accent'

function Section({ label, children, danger, aside }: { label: string; children: ReactNode; danger?: boolean; aside?: ReactNode }) {
  return (
    <section className="mt-10 first:mt-0">
      <div className={cx('label-mono mb-5 flex items-center justify-between border-b border-line pb-2', danger ? 'text-danger' : 'text-slate')}>
        <span>{label}</span>{aside}
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
  const [confirm, setConfirm] = useState(false)
  const [showKey, setShowKey] = useState(false)
  useEffect(() => { setName(p?.name ?? ''); setConfirm(false) }, [p?.key, p?.name])

  if (!p) return <Navigate to="/app/WEB/settings" replace />
  const members = p.members.map(id => user(id)!).filter(Boolean)
  const command = 'claude mcp add --transport http tack https://tack.company.com/mcp --header "Authorization: Bearer tk_••••••••"'
  const key = showKey ? 'tk_demo_7Hq2LmX9vR4bN8sK' : 'tk_••••••••••••••••••••'

  const agentDemo = () => {
    const target = state.issues.find(i => i.key === 'WEB-139' && i.status !== 'review')
      ?? state.issues.find(i => i.project === 'WEB' && i.status === 'progress')
    if (!target) { toast('Nothing left for the AI to move'); return }
    navigate('/app/WEB/board')
    setTimeout(() => {
      dispatch({ t: 'agent', key: target.key, status: 'review', note: 'Opened the change for review and moved this card. The fix is ready for someone to check.' })
      toast(`Claude moved ${target.key} → In review`)
    }, 900)
  }

  return (
    <>
      <TopBar crumbs={<Crumb project={project} page="Settings" />} />
      <main className="min-h-0 flex-1 overflow-y-auto bg-wash">
        <div className="mx-auto max-w-[760px] px-4 py-8 md:px-8">
          <h1 className="text-[28px] font-medium leading-tight tracking-[-0.02em]">Project settings</h1>
          <p className="mb-10 mt-1 text-[14px] text-slate">Name, people and connections for {p.name}.</p>

          <Section label="General">
            <form className="flex flex-col gap-5" onSubmit={e => { e.preventDefault(); if (name.trim()) { dispatch({ t: 'project', key: p.key, patch: { name: name.trim() } }); toast('Saved') } }}>
              <label className="flex flex-col gap-1.5">
                <span className="text-[13px] font-medium">Project name</span>
                <input id="project-name" value={name} onChange={e => setName(e.target.value)} className={input} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[13px] font-medium">Key</span>
                <input id="project-key" value={p.key} readOnly className={cx(input, 'max-w-[120px] bg-cloud font-mono text-slate')} />
                <span className="font-mono text-[11.5px] text-slate">Issues are numbered {p.key}-1, {p.key}-2…</span>
              </label>
              <div><Button type="submit" disabled={!name.trim() || name.trim() === p.name}>Save changes</Button></div>
            </form>
          </Section>

          <Section label="Members" aside={<span className="rounded-[3px] bg-cloud px-1.5 py-0.5 text-[10px]">{members.length} total</span>}>
            <form className="mb-3 flex gap-2" onSubmit={e => { e.preventDefault(); if (/\S+@\S+\.\S+/.test(invite)) { dispatch({ t: 'invite', email: invite.trim(), project: p.key }); toast(`Invite sent to ${invite.trim()}`); setInvite('') } }}>
              <input id="invite-email" value={invite} onChange={e => setInvite(e.target.value)} placeholder="colleague@company.com" type="email" className={input} />
              <Button type="submit" variant="secondary" disabled={!invite}>Invite</Button>
            </form>
            <ul className="divide-y divide-line rounded-[4px] border border-line bg-paper">
              {members.map(u => (
                <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar user={u} size={28} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-[14px] font-medium">{u.name}{u.id === ME && <span className="rounded-[3px] border border-line px-1 font-mono text-[10px] font-normal text-slate">You</span>}</div>
                      <div className="truncate font-mono text-[11.5px] text-slate">{u.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <select id={`role-${u.id}`} aria-label={`Role for ${u.name}`} value={u.role} disabled={u.id === ME}
                      onChange={e => dispatch({ t: 'role', user: u.id, role: e.target.value as 'Admin' | 'Member' })}
                      className="h-8 w-[110px] rounded-[4px] border border-line bg-paper px-2 text-[13px] disabled:bg-cloud disabled:text-slate">
                      <option>Admin</option><option>Member</option>
                    </select>
                    {u.id === ME
                      ? <span className="w-[54px] text-right text-[13px] text-slate">Owner</span>
                      : <button className="link w-[54px] text-right text-[13px] text-slate hover:text-ink" onClick={() => { dispatch({ t: 'removeMember', user: u.id, project: p.key }); toast(`${u.name} removed`) }}>Remove</button>}
                  </div>
                </li>
              ))}
            </ul>
          </Section>

          <Section label="AI connections · optional" aside={<span className="normal-case tracking-normal">Off until you connect it</span>}>
            <p className="mb-5 max-w-[60ch] text-[14px] leading-relaxed text-slate">
              Let Claude, Cursor or another AI tool read and update this project for you. It gets four actions: search, read, create and update issues. Everything it does is marked “by agent” in the history.
            </p>
            <div className="flex flex-col gap-4">
              <div className="rounded-[4px] border border-line bg-paper p-4">
                <div className="label-mono mb-2 text-slate">Your personal key</div>
                <div className="flex flex-wrap items-center gap-2">
                  <code className="min-w-0 flex-1 truncate rounded-[4px] bg-cloud px-3 py-2 font-mono text-[12.5px]">{key}</code>
                  <Button size="sm" variant="secondary" onClick={() => setShowKey(s => !s)}>{showKey ? 'Hide' : 'Show'}</Button>
                  <Button size="sm" variant="secondary" onClick={async () => toast(await copy('tk_demo_7Hq2LmX9vR4bN8sK') ? 'Key copied' : 'Copy blocked by the browser')}>Copy</Button>
                </div>
                <p className="mt-2 font-mono text-[11px] text-slate">Demo key. It doesn’t connect to anything.</p>
              </div>
              <div className="rounded-[4px] bg-ink p-4">
                <div className="label-mono mb-2 flex items-center justify-between text-[#8E93A8]">
                  <span>Connect Claude Code</span>
                  <button className="flex items-center gap-1 normal-case tracking-normal hover:text-paper" onClick={async () => toast(await copy(command) ? 'Command copied' : 'Copy blocked by the browser')}><Icon name="content_copy" className="!text-[14px]" />Copy</button>
                </div>
                <code className="block whitespace-pre-wrap break-all font-mono text-[12.5px] leading-relaxed text-accent-soft">{command}</code>
              </div>
              <div className="rounded-[4px] border border-line bg-paper">
                <div className="flex items-center justify-between border-b border-line px-4 py-2">
                  <span className="flex items-center gap-2 font-mono text-[12px]"><Icon name="description" className="!text-[16px] text-slate" />llms.txt</span>
                  <span className="font-mono text-[11px] text-slate">The file your AI reads first</span>
                </div>
                <pre className="overflow-x-auto px-4 py-3 font-mono text-[12px] leading-[1.8] text-slate">{`# Tack
> A calm, simple issue tracker. People first; AI optional.

## Getting started
Connect to https://tack.company.com/mcp with your personal key.

## Tools
- search_issues · get_issue · create_issue · update_issue`}</pre>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[4px] border border-dashed border-accent/40 bg-tint px-4 py-3">
                <span className="text-[13.5px]">See what an AI update looks like on the board.</span>
                <Button size="sm" onClick={agentDemo}><Icon name="play_arrow" className="!text-[16px]" />Show me</Button>
              </div>
            </div>
          </Section>

          <Section label="Danger zone" danger>
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-[4px] border border-danger/30 bg-paper p-5">
              <div>
                <div className="text-[14px] font-medium">Archive project</div>
                <p className="text-[13px] text-slate">Makes {p.name} read-only. Nobody can add or change issues.</p>
              </div>
              {confirm ? (
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setConfirm(false)}>Cancel</Button>
                  <button className="h-7 rounded-[4px] border border-danger bg-danger px-2.5 text-[12.5px] font-medium text-paper" onClick={() => { setConfirm(false); toast('Archiving is turned off in this demo') }}>Yes, archive</button>
                </div>
              ) : (
                <button className="h-[34px] rounded-[4px] border border-danger px-3.5 text-[13px] font-medium text-danger transition-colors hover:bg-danger hover:text-paper" onClick={() => setConfirm(true)}>Archive project</button>
              )}
            </div>
            <button className="link mt-6 text-[13px] text-slate hover:text-ink" onClick={() => { dispatch({ t: 'reset' }); toast('Demo data reset') }}>Reset demo data</button>
          </Section>
        </div>
      </main>
    </>
  )
}
