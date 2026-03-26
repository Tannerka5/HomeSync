# HomeSync Final Sprint Upload Support Document

Use this file as the source for the document your product owner uploads. Replace placeholders where attendance or presentation participation is not known from the repository.

## Project
- Product: HomeSync
- Repository: HomeSync
- Live deployment: `https://jonescg0.net`
- Sprint evidence window used below: repository activity from March 16, 2026 through March 25, 2026

## Scrum Attendance And Presentation Participation
Replace the names below with the final official roster if needed. The repo confirms several contributors, but attendance cannot be derived from git history.

| Team Member | Daily Scrum 1 | Daily Scrum 2 | Daily Scrum 3 | Presented Today |
| --- | --- | --- | --- | --- |
| Team Member 1 |  |  |  |  |
| Team Member 2 |  |  |  |  |
| Team Member 3 |  |  |  |  |
| Team Member 4 |  |  |  |  |
| Team Member 5 |  |  |  |  |
| Team Member 6 |  |  |  |  |

## Sprint Commit History Summary
The entries below are grouped from the current repository history and phrased as sprint contributions rather than a raw commit dump.

### Tanner Atkinson
- `d094f3b` on 2026-03-23: functionality to save listings and send listings to chat; restructure of chat and collaboration board tables
- `e530a85` on 2026-03-22: listings with live update using Zillow API
- `73167a0` on 2026-03-19: board layout updates prioritizing tasks and adding document and note actions
- `2eaf5b6` on 2026-03-16: improved accessibility and semantics for core pages

### Augusto Freire
- `9f5ff70` on 2026-03-24: added scroll-to-section functionality for the Home page
- `7d005d8` on 2026-03-24: enhanced layout and home page account menus
- `32529fc` on 2026-03-24: updated EARS requirements in the README
- `efd87fb` on 2026-03-18: added signup first-name and last-name support and seeded database updates
- `1767c44` on 2026-03-18: added first-name and last-name signup flow and database migration
- `f0ee63d` on 2026-03-15: backend authentication endpoints, session management, frontend auth state, and functional login improvements

### Carson Jones
- `d0be98a` on 2026-03-18: edit users/profile page work
- `47d1d95` on 2026-03-18: database update adding `updated_at` to users
- `4305d2d` on 2026-03-16: added `DATABASE_URL` to SSH deployment workflow
- `821965e` on 2026-03-11: GitHub deployment to EC2 instance

### Additional Repository Activity
- `091f86f` on 2026-03-25 by `ansanger72`: added vision board image upload and delete functionality
- `54b8164` on 2026-03-12 by `ansanger72`: improved collaboration board and home page UX and fixed image issues
- `3ea5912` on 2026-03-14 by `etdurf`: added JWT auth with signup, login, logout, and protected routes

## Demo Credentials
Source: `db/seed.sql`

- Buyer: `alex.buyer@homesync.local`
- Realtor: `sarah.realtor@homesync.local`
- Collaborator: `michael.lender@homesync.local`
- Password: `password123`

## Demo Coverage For Class
Planned live demo pages:
- Home
- Listings
- Board
- Chat
- Profile

Planned automatic metric:
- Board task completion/status update shown live during the Board demo

Suggested wording:
`Our OKR proof point is visible task progress in the active home-buying workflow. When we update a task on the collaboration board, the UI reflects that change immediately and the state persists.`

## Accessibility Evidence
Add a screenshot and exact result before submission.

| Evidence Item | Value |
| --- | --- |
| Lighthouse Accessibility Score |  |
| Page Tested |  |
| Date Captured |  |
| Screenshot Included | Yes / No |

## Local Backup Run Steps
If the deployed site is unavailable during class, use the local fallback.

1. Ensure PostgreSQL is running and `.env` is configured.
2. Run `npm install` if dependencies are not already installed.
3. Run `npm run dev` from the repository root.
4. Open `http://localhost:5173`.
5. Sign in with the seeded buyer account.

## Notes For Product Owner
- Keep the attendance table factual. Do not infer scrum attendance from commit history.
- If you export this to PDF, include the Lighthouse screenshot as an appendix.
- If you need a raw git log appendix, generate it with:

```powershell
git log --since="2026-03-16" --pretty=format:"%h | %ad | %an | %s" --date=short
```
