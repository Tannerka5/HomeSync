# HomeSync (PERN Monorepo)

**Live deployment:** `https://jonescg0.net`

## App Summary

HomeSync solves a common real estate pain point: buyers, agents, and collaborators often communicate across disconnected tools, which causes lost context and missed updates. The primary user is a home buyer who needs one place to view listings, collaborate with an agent, and track tasks. This application provides a single web experience where collaboration and communication happen directly in the buying workflow. The frontend offers pages for listings, chat, and a collaboration board, while the backend exposes API routes for data operations. PostgreSQL stores persistent records for users, listings, conversations, messages, and board items. A working vertical slice is implemented: toggling a task from the collaboration board updates PostgreSQL and immediately reflects in the UI. The repo is organized as a minimal beginner-friendly monorepo so frontend and backend can run together with one command.

## Project Status (Sprint 1 of 3)

We are currently in **Sprint 1 of 3**. Sprint 1 focuses on delivering a working vertical slice that runs end‑to‑end (User → Frontend → Backend → Database) with polished core pages and basic UX:

- Home, login, and signup flows are implemented and visually aligned with the HomeSync brand.
- Listings, Collaboration Board, and Chat pages are wired to backend APIs where needed.
- One core interaction (toggling a task on the Collaboration Board) is fully implemented through the stack and persisted in PostgreSQL.

### Sprint Plan (High Level)

- **Sprint 1 – Vertical Slice & Core UX**

  - Implement core pages (Home, Listings, Board, Chat, Auth shell).
  - Deliver at least one fully working end‑to‑end feature (task toggle on Collaboration Board).
  - Establish basic visual identity and responsive layout for key screens.

- **Sprint 2 – Depth, Reliability & Accessibility**

  - Expand functionality on existing pages (richer board interactions, listings and chat behaviors).
  - Harden error handling and loading states.
  - Improve responsiveness and achieve or approach the target Lighthouse Accessibility score.

- **Sprint 3 – Polish, Production Readiness & Deployment**
  - Finalize UX polish across pages and devices.
  - Close gaps against the Definition of Done (accessibility, docs, deployment).
  - Ensure main is production‑ready and deployed with a clear feature list in this README.

## Definition of Done

For a feature or sprint to be considered **Done**, all of the following must be true:

- **Responsive UI**: Pages are responsive and look good on both desktop and mobile screens.
- **End‑to‑end flow**: Functionality works end‑to‑end (User → Frontend → Backend → Database).
- **Accessibility**: Lighthouse reports an Accessibility score **≥ 85%** on key flows.
- **Documentation**: This `README` is updated with an accurate list of working features.
- **Code integration**: Changes are merged into the `main` branch.
- **Deployment**: Changes are deployed to the production environment.

Sprint 1 aims to deliver a shippable vertical slice that already respects the Definition of Done for at least one core flow (Collaboration Board task toggling), and to lay the groundwork for sprints 2 and 3 to bring the whole product up to these standards.

## Tech Stack

- **Frontend framework:** React + TypeScript
- **Frontend tooling:** Vite, npm workspaces, Tailwind CSS, shadcn/ui-style components
- **Backend framework:** Express + TypeScript (`tsx` for dev runtime)
- **Database:** PostgreSQL (local), SQL schema/seed files in `db/`
- **Authentication:** Not implemented yet (planned)
- **External services/APIs:** None required for current infrastructure/vertical slice

## Architecture Diagram

```mermaid
flowchart LR
  U[User Browser]
  F[Frontend\nReact + Vite]
  B[Backend API\nExpress + TypeScript]
  D[(PostgreSQL)]
  E[Environment Variables\nDATABASE_URL]

  U -->|HTTP:5173| F
  F -->|/api requests| B
  B -->|SQL queries| D
  E -->|Connection string| B
```

## Prerequisites

Install the following software locally:

- **Node.js 20+** (includes npm): https://nodejs.org/en/download
- **PostgreSQL 16+**: https://www.postgresql.org/download/
- **psql in PATH** (usually installed with PostgreSQL): https://www.postgresql.org/docs/current/app-psql.html
- **Git**: https://git-scm.com/downloads

Verify installations:

```bash
node -v
npm -v
psql --version
git --version
```

## Installation and Setup

1. **Clone and enter the repo**

   ```bash
   git clone <your-repo-url>
   cd HomeSync
   ```

2. **Install dependencies (root + workspaces)**

   ```bash
   npm install
   ```

3. **Create your local environment file**

   - Copy `.env.example` to `.env`
   - Set `DATABASE_URL` to your local Postgres credentials.
   - Example:
     ```env
     DATABASE_URL=postgresql://postgres:<your_password>@localhost:5432/homesync
     ```

4. **Create the database**

   ```bash
   createdb -U postgres homesync
   ```

   If it already exists, this command can be skipped.

5. **Run schema and seed SQL**

   ```bash
   psql -U postgres -d homesync -f db/schema.sql
   psql -U postgres -d homesync -f db/seed.sql
   ```

6. **Optional: confirm seed worked**
   ```bash
   psql -U postgres -d homesync -c "select count(*) as users from app_user;"
   psql -U postgres -d homesync -c "select count(*) as tasks from collab_item where item_type='task';"
   ```

## Running the Application

From the repo root:

```bash
npm run dev
```

This starts both services:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:4000`

Open `http://localhost:5173` in your browser.

## Verifying the Vertical Slice

The implemented slice is: **task toggle on Collaboration Board -> backend API -> PostgreSQL update -> updated status shown in UI**.

1. Start the app with `npm run dev`.
2. Open `http://localhost:5173/board`.
3. In the **Tasks** column, click the circle/check icon next to a task.
4. Confirm the task status changes in the UI immediately.
5. Refresh the page and confirm the new status persists.
6. Verify directly in SQL:
   ```bash
   psql -U postgres -d homesync -c "select collab_item_id, title, status from collab_item where item_type='task' order by collab_item_id;"
   ```
   You should see the toggled task status updated (for example `todo` <-> `done`).

## Current Working Features

These features are currently implemented and participate in the vertical slice to varying degrees:

- **Home Page**

  - Marketing overview of HomeSync with hero, value proposition, and calls‑to‑action.
  - Navigation entry point to Listings, Collaboration Board, Chat, and Auth flows.

- **Authentication Shell (Login & Signup)**

  - Login and signup forms with validation using `react-hook-form` + `zod`.
  - Basic “remember me” behavior on login.
  - Role selection on signup (`buyer`, `realtor`, `collaborator`) to personalize future flows.

- **Listings Page**

  - Fetches listings from the backend (`/api/listings`) and renders responsive listing cards.
  - Each card shows price, address, key stats (beds, baths, square footage), and status badge.
  - Listing details open in a dialog with richer information (description, stats, actions).

- **Collaboration Board**

  - Vision board section with draggable inspiration cards.
  - Notes, Tasks, and Documents columns backed by `/api/board/items`.
  - **Task toggle**: Clicking the status icon sends a PATCH to `/api/board/items/:id/toggle`, updates PostgreSQL, and immediately updates the UI (our main vertical slice).

- **Chat Page**
  - Chat list sidebar that loads conversations from `/api/chats`.
  - Message window that fetches and displays messages for the selected chat from `/api/chats/:id/messages`.
  - Ability to send a message via POST to `/api/chats/:id/messages`, appending it to the current thread.

> **Note:** Some features may not yet fully meet the Definition of Done for accessibility score, production deployment, or all edge cases. Those gaps are expected to be closed in sprints 2 and 3.

## End Goal / Product Vision

When all three sprints are complete, HomeSync should feel like:

- **One shared workspace** for buyers, agents, and collaborators to coordinate listings, tasks, documents, and messages in a single place.
- A clear **journey from initial search through closing**, represented in the UI with timelines, task lists, and communication threads.
- A **production‑ready PERN application** with a cohesive visual identity, responsive layouts, and solid accessibility (Lighthouse Accessibility score ≥ 85% on key flows).
- A project that is easy for new contributors to set up, understand, and extend, thanks to a clean architecture and up‑to‑date documentation.

This repo is intentionally structured as a simple monorepo so that the entire HomeSync experience (frontend, backend, database) can be run, tested, and evolved as a single unit.

## Requirements (EARS Format)

The following requirements use EARS‑style phrasing and are grouped by feature area.

### Collaboration Board

- **The system shall** display a Collaboration Board containing sections for vision items, notes, tasks, and documents for the current user.
- **When** the user loads the Collaboration Board page, **the system shall** fetch all board items for that user from the backend and render them in the appropriate columns.
- **When** the user clicks the task status icon on a board item, **the system shall** toggle the task status between `To Do`, `In Progress`, and `Done` (as defined by the backend) and persist the change in PostgreSQL.
- **When** a task status is successfully updated in the database, **the system shall** immediately reflect the new status in the UI without requiring a full page reload.
- **When** the backend cannot be reached or returns an error while loading or updating board items, **the system shall** show a clear, non‑technical error message on the Board page.

### Listings

- **The system shall** allow the user to browse a grid of property listings with price, address, beds, baths, square footage, and status.
- **When** the user opens the Listings page, **the system shall** request listings from the `/api/listings` endpoint and render them in a responsive grid.
- **When** the user clicks on a listing card, **the system shall** display a details view with richer information and calls‑to‑action (e.g. “Add to Board”, “Message Agent”).
- **When** the user changes the sort order, **the system shall** update the listings view to reflect the selected sort option.
- **When** the backend is unavailable or returns an error while loading listings, **the system shall** show an appropriate message instead of an empty grid.

### Chat

- **The system shall** present a list of chat conversations for the current user, showing name, role, last message, and unread status.
- **When** the user selects a conversation from the chat list, **the system shall** load and display the message history for that conversation.
- **When** the user sends a new message in an active conversation, **the system shall** post the message to the backend and append the confirmed message to the message list.
- **When** there is no selected conversation on small screens, **the system shall** prioritize showing the conversation list and hide the message window until a chat is selected.

### Navigation and Auth

- **The system shall** provide global navigation links to Home, Listings, Collaboration Board, Chat, and Auth pages.
- **When** the user submits valid login credentials, **the system shall** authenticate the user and navigate to the main Home or Dashboard experience.
- **When** the user submits valid signup information including a role, **the system shall** create a new account and navigate to the main experience with that role associated.
- **When** the user logs out, **the system shall** clear any session state in the frontend and redirect to the login page.

### Cross‑cutting Quality Requirements

- **The system shall** render core pages (Home, Listings, Collaboration Board, Chat, Auth) responsively on common desktop and mobile viewports.
- **When** Lighthouse is run against key flows (Home, Listings, Collaboration Board, Auth), **the system shall** achieve an Accessibility score of at least **85%** once all sprints are complete.
- **The system shall** support running the full stack locally via `npm run dev`, ensuring that user interactions flow from browser to frontend to backend to PostgreSQL without manual wiring.
- **When** a feature is considered Done, **the system shall** have its behavior described in the `Current Working Features` section and be deployed to the production environment from the `main` branch.

## Repository Notes for GitHub

- `.env` and other environment files are ignored by `.gitignore`.
- `.env.example` is committed as the template.
- IDE-local folders like `.vscode/` are ignored.
- ERD is committed at `db/erd.png`.
