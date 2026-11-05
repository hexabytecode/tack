export type Status = 'todo' | 'progress' | 'review' | 'done'
export type IssueType = 'task' | 'bug'
export type Priority = 'high' | 'medium' | 'low'

export interface User { id: string; name: string; initials: string; email: string; role: 'Admin' | 'Member'; title: string }
export interface Project { key: string; name: string; members: string[]; archived?: boolean }
export interface Issue {
  key: string
  project: string
  title: string
  description: string
  status: Status
  type: IssueType
  priority: Priority
  assignee: string | null
  due: string | null
  labels: string[]
  order: number
  createdAt: number
  updatedAt: number
}
export interface Comment { id: string; issue: string; author: string; body: string; at: number; agent?: string }
export interface Activity { id: string; issue: string; actor: string; text: string; at: number; agent?: string }

export const STATUSES: { id: Status; label: string; color: string }[] = [
  { id: 'todo', label: 'To do', color: 'var(--color-slate)' },
  { id: 'progress', label: 'In progress', color: 'var(--color-accent)' },
  { id: 'review', label: 'In review', color: 'var(--color-warning)' },
  { id: 'done', label: 'Done', color: 'var(--color-success)' },
]

export const ME = 'al'

export const USERS: User[] = [
  { id: 'al', name: 'Alex Lin', initials: 'AL', email: 'alex@company.com', role: 'Admin', title: 'Engineering lead' },
  { id: 'sk', name: 'Samira Khan', initials: 'SK', email: 'samira@company.com', role: 'Admin', title: 'Frontend' },
  { id: 'mr', name: 'Marcus Reid', initials: 'MR', email: 'marcus@company.com', role: 'Member', title: 'Design' },
  { id: 'jd', name: 'Jane Doe', initials: 'JD', email: 'jane@company.com', role: 'Member', title: 'Backend' },
  { id: 'cm', name: 'Carlos Mendez', initials: 'CM', email: 'carlos@company.com', role: 'Member', title: 'Mobile' },
  { id: 'pp', name: 'Priya Patel', initials: 'PP', email: 'priya@company.com', role: 'Member', title: 'Product' },
]

export const PROJECTS: Project[] = [
  { key: 'WEB', name: 'Website relaunch', members: ['al', 'sk', 'mr', 'jd', 'cm', 'pp'] },
  { key: 'APP', name: 'Mobile app', members: ['al', 'cm', 'pp', 'mr'] },
  { key: 'BO', name: 'Back office', members: ['al', 'jd', 'pp'] },
]

const H = 3600_000
const D = 24 * H

type Seed = [num: number, title: string, status: Status, type: IssueType, priority: Priority, assignee: string | null, dueInDays: number | null, labels: string[], ageHours: number, description?: string]

const SEED: Record<string, Seed[]> = {
  WEB: [
    [142, 'Checkout button overlaps footer on mobile', 'todo', 'bug', 'high', 'al', 9, ['checkout', 'mobile'], 4,
      'On small phones the sticky checkout bar sits on top of the footer and hides the Pay button.\n\nSteps to reproduce:\n1. Open /checkout on a phone narrower than 390px\n2. Add an item and scroll to the bottom\n3. The Pay button is covered by the footer\n\nExpected: the bar sits above the footer with enough room to tap.'],
    [138, 'Move DNS to the new host', 'todo', 'task', 'medium', 'al', 2, ['infra'], 26],
    [144, 'Safari flexbox gap calculation bug', 'todo', 'bug', 'low', 'mr', null, ['safari'], 30],
    [145, 'Refactor auth token refresh', 'todo', 'task', 'medium', 'jd', 5, ['auth'], 52],
    [146, 'Audit bundle size for landing page', 'todo', 'task', 'low', 'al', 12, ['performance'], 70],
    [139, 'Add VAT number to invoices', 'progress', 'task', 'high', 'jd', 3, ['billing'], 7],
    [140, 'Password reset email lands in spam', 'progress', 'bug', 'high', 'al', -1, ['email'], 2,
      'Several people report the reset email going to spam in Gmail and Outlook. Check the sender setup and the email content.'],
    [141, 'Update pricing page copy', 'progress', 'task', 'medium', 'sk', 6, ['content'], 20],
    [135, 'Optimise hero illustration file size', 'review', 'task', 'medium', 'mr', 4, ['performance'], 5],
    [136, 'Handle repeated payment notifications', 'review', 'task', 'high', 'sk', 1, ['billing'], 28],
    [131, 'Set up preview deployments', 'done', 'task', 'medium', 'jd', null, ['infra'], 96],
    [132, 'Fix cookie banner overlapping the menu', 'done', 'bug', 'low', 'al', null, ['ui'], 120],
    [133, 'Add social preview images', 'done', 'task', 'low', 'mr', null, ['seo'], 140],
    [134, 'Upgrade styling library', 'done', 'task', 'medium', 'sk', null, ['tech'], 170],
  ],
  APP: [
    [31, 'Push notifications fail on iOS 17.4', 'progress', 'bug', 'high', 'al', 13, ['ios'], 6],
    [28, 'Fallback screen when Face ID fails', 'review', 'task', 'medium', 'al', 15, ['auth'], 18],
    [22, 'Deep links open the wrong screen', 'todo', 'bug', 'low', 'al', 20, ['navigation'], 40],
    [33, 'Offline banner design', 'todo', 'task', 'medium', 'mr', 10, ['design'], 12],
    [34, 'Reduce app start time', 'todo', 'task', 'high', 'cm', 8, ['performance'], 33],
    [29, 'Dark splash screen flicker', 'progress', 'bug', 'medium', 'cm', 4, ['android'], 22],
    [25, 'Rename tabs to match the website', 'done', 'task', 'low', 'pp', null, ['content'], 90],
    [26, 'Crash when photo access is denied', 'done', 'bug', 'high', 'cm', null, ['ios'], 110],
  ],
  BO: [
    [12, 'Export audit log CSV times out', 'progress', 'bug', 'high', 'al', 11, ['reports'], 9],
    [9, 'Cache the role permissions table', 'todo', 'task', 'medium', 'al', 17, ['performance'], 50],
    [14, 'Add refund reason dropdown', 'todo', 'task', 'low', 'pp', 9, ['payments'], 15],
    [11, 'Show who approved a refund', 'review', 'task', 'medium', 'jd', 3, ['payments'], 30],
    [8, 'Fix date filter in payments list', 'done', 'bug', 'medium', 'jd', null, ['payments'], 130],
  ],
}

export function seed(now = Date.now()) {
  const issues: Issue[] = []
  const comments: Comment[] = []
  const activity: Activity[] = []
  for (const [project, rows] of Object.entries(SEED)) {
    const orderBy: Record<string, number> = {}
    for (const [num, title, status, type, priority, assignee, dueIn, labels, ageH, description] of rows) {
      const key = `${project}-${num}`
      orderBy[status] = (orderBy[status] ?? 0) + 1
      const updatedAt = now - ageH * H
      issues.push({
        key, project, title, status, type, priority, assignee, labels,
        description: description ?? '',
        due: dueIn === null ? null : new Date(now + dueIn * D).toISOString().slice(0, 10),
        order: orderBy[status],
        createdAt: updatedAt - 3 * D,
        updatedAt,
      })
      activity.push({ id: `a-${key}-c`, issue: key, actor: assignee ?? 'pp', text: 'created this issue', at: updatedAt - 3 * D })
    }
  }
  comments.push(
    { id: 'c1', issue: 'WEB-142', author: 'sk', body: 'Reproduced on an iPhone 15 in Safari and Chrome. The bottom safe area isn’t taken into account.', at: now - 3 * H },
    { id: 'c2', issue: 'WEB-142', author: 'al', body: 'Taking this one. @Samira I’ll add the safe-area padding and send it for review today.', at: now - 1 * H },
    { id: 'c3', issue: 'WEB-140', author: 'jd', body: 'Sender records look fine. I think it’s the wording in the subject line.', at: now - 5 * H },
    { id: 'c4', issue: 'APP-31', author: 'cm', body: 'Only happens on 17.4. Older versions are fine.', at: now - 8 * H },
  )
  activity.push(
    { id: 'a1', issue: 'WEB-142', actor: 'sk', text: 'assigned this to Alex Lin', at: now - 3 * H },
    { id: 'a2', issue: 'WEB-140', actor: 'al', text: 'moved this to In progress', at: now - 2 * H },
    { id: 'a3', issue: 'WEB-139', actor: 'jd', text: 'moved this to In progress', at: now - 7 * H },
  )
  return { issues, comments, activity }
}

export function nextNumber(issues: Issue[], project: string) {
  return Math.max(0, ...issues.filter(i => i.project === project).map(i => Number(i.key.split('-')[1]))) + 1
}
