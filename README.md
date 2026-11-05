<p align="center">
  <a href="https://tack-issues.vercel.app"><img src="docs/banner.webp" alt="Tack landing page: the headline The issue tracker your team will actually use, above a laptop showing the Tack board" width="100%"></a>
</p>

<h1 align="center">Tack</h1>

<p align="center">
  A calm, simple issue tracker: a board, a list and four columns. A design experiment, built website and web app together in about two days.
  <br><br>
  <a href="https://tack-issues.vercel.app"><b>Visit the website →</b></a>
  &nbsp;&nbsp;·&nbsp;&nbsp;
  <a href="https://tack-issues.vercel.app/app/WEB/board"><b>Open the app →</b></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-183FD9?style=flat-square&logo=react&logoColor=white" alt="React 19">
  <img src="https://img.shields.io/badge/TypeScript-5.8-183FD9?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript 5.8">
  <img src="https://img.shields.io/badge/Tailwind-4-000000?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind 4">
  <img src="https://img.shields.io/badge/shadcn/ui-Radix-000000?style=flat-square&logo=shadcnui&logoColor=white" alt="shadcn/ui on Radix">
  <img src="https://img.shields.io/badge/Designed_in-Stitch_+_Figma-636A80?style=flat-square" alt="Designed in Stitch and Figma">
  <img src="https://img.shields.io/badge/Hosted_on-Vercel-000000?style=flat-square&logo=vercel" alt="Hosted on Vercel">
</p>

> [!NOTE]
> Everything runs on dummy data. Sign-in is a placeholder button, and any change you make stays in your own browser.

<br>

## The app

<table>
  <tr>
    <td width="50%"><img src="docs/board.webp" alt="The board: four columns with colour-coded bug, task and priority badges"></td>
    <td width="50%"><img src="docs/issue.webp" alt="An issue open on the side with Markdown comments, a callout and a checklist"></td>
  </tr>
  <tr>
    <td width="50%"><b>Drag it, done.</b> Four columns, every card in view, type and priority readable at a glance.</td>
    <td width="50%"><b>Every decision in the issue.</b> Comments with checklists, callouts, @mentions and issue links.</td>
  </tr>
  <tr>
    <td width="50%"><img src="docs/create.webp" alt="The New issue dialog with only the title required"></td>
    <td width="50%"><img src="docs/ai.webp" alt="The For AI page with one prompt to copy and four short guides"></td>
  </tr>
  <tr>
    <td width="50%"><b>New issue in five seconds.</b> Only the title is required.</td>
    <td width="50%"><b>Hand it to your AI, if you want.</b> A short <a href="https://tack-issues.vercel.app/llms.txt">llms.txt</a> index plus one guide per topic.</td>
  </tr>
</table>

## The website

<table>
  <tr>
    <td width="50%"><img src="docs/decision.webp" alt="Landing page section: Every decision, in the issue"></td>
    <td width="50%"><img src="docs/pricing.webp" alt="Pricing: Starter 2 dollars, Team 5 dollars, Business 10 dollars per person per month"></td>
  </tr>
</table>

<p align="center"><img src="docs/phones.webp" alt="Tack on three phone screens: the landing page, the board and an open issue" width="100%"></p>

<br>

## How it was designed

```mermaid
flowchart LR
  A["References<br/>Awwwards + Massive"] --> B["Scope<br/>screens + objects"]
  B --> C["Screens in Stitch<br/>one style for all"]
  C --> D["Assets in Figma AI<br/>illustrations"]
  D --> E["Built in React<br/>shadcn/ui themed"]
  E --> F["Checked headless<br/>desktop + phone + slow network"]
```

1. **Study, don't copy.** Took the feel from sites in the [Awwwards directory](https://www.awwwards.com/directory/), and from [Massive](https://massive.com/) the idea of a site your AI can read.
2. **Scope first.** Agreed the screens and the few objects (projects, issues, people) before drawing anything.
3. **Screens in Stitch.** Every screen was laid out in Google Stitch from one reference screen, so they share one look.
4. **Assets in Figma.** The illustrations came from Figma AI, then were animated frame by frame from those same drawings.
5. **Built for real.** React with shadcn/ui, themed so every menu, toast and dialog belongs to Tack.
6. **Checked like a release.** Every page on desktop and phone, every open menu, a slow-network test, and zero sideways scroll.

## Design principles

| | |
|---|---|
| **People first, AI optional** | Everything works with plain clicks. AI tools can connect, and every change they make is labelled. |
| **Simple yet elegant** | Four columns, one list, one place for your work. No setting that isn't needed. |
| **One style everywhere** | One focus ring, one tab style, one way menus look, on every screen. |
| **Motion that explains** | Cards glide when you drag them, the hero shows a real drag, nothing moves just to move. |
| **Readable at a glance** | Bugs, tasks and priorities each have their own colour and icon. |
| **Fast on bad networks** | A skeleton of the page in about a second, before the code has arrived. |

<p align="center"><img src="docs/palette.webp" alt="Palette: Ink 000000, Paper FFFFFF, Brand blue 183FD9, Wash F7F7F9, Cloud EEEEF2, Slate 636A80" width="100%"></p>

## Built with

| Part | Tools |
|---|---|
| Design | Google Stitch (screens), Figma AI (illustrations) |
| App | React 19, TypeScript 5.8, Vite 6, React Router 7 |
| UI | Tailwind CSS 4, shadcn/ui on Radix, Lucide icons, Sonner toasts |
| Interaction | dnd-kit (drag and drop), Motion 12 (animation), react-markdown + GFM (comments) |
| Type | Inter, JetBrains Mono |
| Hosting | Vercel, deploys on every push to `main` |

## Run it locally

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

<br>

<p align="center"><sub>Designed and built by <a href="https://github.com/hexabytecode">Aditya Uphade</a>. Tack is a design study, not a live product.</sub></p>
