# HomeSync Final Sprint Presentation Runbook

## Goal
Deliver a 10-minute presentation that shows why HomeSync matters, how the team built it, and what works today in the live product.

Core message:
- Home buying collaboration is fragmented across texts, email, listing sites, and personal notes.
- HomeSync centralizes listings, collaboration, and communication in one workflow.
- The current product already proves this with functional pages, persisted data, and live UI updates.

## Presentation Setup
- Target runtime: 9:00 to 9:30 minutes
- Hard cap: 10:00 minutes
- Team speaking roles: 6
- Recommended deck length: 7 slides plus live demo
- Live demo pages: Home, Listings, Board, Chat, Profile
- Backup auth pages: Login, Signup

## Slide And Speaker Plan

### Speaker 1: Problem And Stakes
Time: 1:00

Slide title:
`The Problem: Home Buying Collaboration Is Fragmented`

Talking points:
- Buyers, realtors, and collaborators often work across multiple disconnected tools.
- Important context gets lost between listings, task tracking, and conversations.
- That creates delays, duplicated work, and missed next steps.
- HomeSync solves this by keeping those activities in one shared workspace.

Suggested close:
`Our team focused on reducing friction in the most communication-heavy part of the home-buying process.`

### Speaker 2: Product Vision
Time: 1:15

Slide title:
`The Solution: One Shared Workspace`

Talking points:
- HomeSync is designed for buyers, realtors, and collaborators such as lenders.
- The app connects property discovery, collaboration tasks, and messaging.
- The home page positions the product and routes users into the working flows.

Live action:
- Start on the home page.
- Briefly show the navigation and product framing.

Suggested close:
`Instead of switching between tools, users can move through the buying workflow in one place.`

### Speaker 3: How We Built It
Time: 1:15

Slide title:
`How We Arrived At The Solution`

Talking points:
- The team used sprint-based delivery with EARS requirements and end-to-end vertical slices.
- The current stack is React and TypeScript on the frontend, Express and TypeScript on the backend, and PostgreSQL for persistence.
- We prioritized flows that stakeholders can see live: listings, board, chat, and profile management.
- The product is deployed and also runnable locally for demonstration.

Suggested close:
`Our focus this semester was not just design, but proving real product behavior across the full stack.`

### Speaker 4: Demo Part 1
Time: 2:00

Slide title:
`Live Demo: From Discovery To Action`

Live actions:
- Open Login if the session is not already active.
- Sign in with the seeded buyer account.
- Navigate to Listings.
- Open one listing detail view.
- If stable in the environment, use one of these actions:
  - `Add to collaboration board`
  - `Send to chat`

Talking points:
- Listings are loaded from the backend and rendered as functional cards.
- Users can inspect a property in more detail before deciding to act.
- The point is not just browsing listings, but turning listings into collaborative work.

### Speaker 5: Demo Part 2 And OKR Proof
Time: 2:00

Slide title:
`Live Demo: Collaboration And Measurable Progress`

Default OKR metric:
`Increase visible task completion for active home-buying workflows`

Live actions:
- Open Board.
- Point out the task counts and task statuses visible on screen.
- Toggle one task status to show a live UI update backed by persisted data.
- Show that the task count or status state changes immediately.
- Open Chat and show the conversation thread.
- If a listing was shared from Listings, point out the related chat context.

Talking points:
- This is the strongest live metric already supported by the product.
- The board turns home-buying work into visible, trackable progress.
- Chat keeps the conversation tied to the workflow instead of splitting it into another app.

If another teammate ships a stronger automatic metric before class:
- Replace this metric only if it updates live, is visible on screen, and is stable enough for class.

### Speaker 6: Profile, Accessibility, And Close
Time: 1:30

Slide title:
`Current State And Why It Matters`

Live actions:
- Open Profile.
- Show editable account information.
- If safe in the demo environment, update a field and save.

Talking points:
- The product already supports account management and personalized user state.
- Accessibility was treated as part of product quality, not as an afterthought.
- The team can show a Lighthouse Accessibility score on a core page as supporting evidence.
- HomeSync now demonstrates a real, working collaboration experience for home buying.

Suggested close:
`HomeSync proves that bringing listings, tasks, and communication together creates a more usable and accountable workflow.`

## Demo Run Order
Use this order unless the browser session is already authenticated:

1. Home
2. Login
3. Listings
4. Board
5. Chat
6. Profile

If login is already active:

1. Home
2. Listings
3. Board
4. Chat
5. Profile

## Demo Credentials
Source: `db/seed.sql`

- Buyer account: `alex.buyer@homesync.local`
- Realtor account: `sarah.realtor@homesync.local`
- Collaborator account: `michael.lender@homesync.local`
- Password for seeded users: `password123`

Recommended demo user:
- `alex.buyer@homesync.local`

## Product Evidence To Mention
- Live deployment: `https://jonescg0.net`
- Functional routes in the current app:
  - `/`
  - `/listings`
  - `/board`
  - `/chat`
  - `/profile`
- Seeded board data includes tasks, notes, documents, and chat messages.
- Board task toggling is a visible end-to-end flow through frontend, backend, and database.

## Accessibility Proof
Add one slide or one small callout with:
- Exact Lighthouse Accessibility score
- Page tested
- Date captured

Recommended wording:
`We validated accessibility on a core flow using Lighthouse and captured a score of __ on the __ page on March __, 2026.`

Keep the screenshot available in case the instructor asks for proof.

## Fallback Plan
If any live step fails, use this downgrade order:

1. Stay on the current page and explain the intended flow instead of refreshing repeatedly.
2. Use the board task toggle as the primary proof point because it is the clearest persisted interaction.
3. If chat is slow, show the conversation list and message thread without sending a new message.
4. If profile updates are risky, show the editable form and describe the account-management capability.
5. If login is unstable, start from an already-authenticated browser session.

## Rehearsal Checklist
- Run one timed practice with all 6 speakers.
- Confirm each speaker can finish within their assigned slot.
- Verify the seeded demo account still works.
- Verify Listings loads and a detail dialog opens.
- Verify Board loads with seeded tasks.
- Verify one task status can be toggled live.
- Verify Chat loads at least one conversation and message thread.
- Verify Profile renders correctly.
- Capture the Lighthouse screenshot before class.
- Keep one browser tab open to the deployed site and one local backup ready if needed.
