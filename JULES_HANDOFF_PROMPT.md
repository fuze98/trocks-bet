# Jules Context Handoff Prompt

**To the next Jules Agent:** You are continuing the development of "TrocksBet," a modern, world-class sportsbook web application built for entertainment among friends. The currency used is a fictional currency called "Social Credit Capital" (SCC). Read this document carefully to get up to speed with the repository's current state and all the massive upgrades that have been implemented recently.

## Tech Stack
- Next.js 14 (App Router)
- React, Tailwind CSS, TypeScript
- Prisma ORM with PostgreSQL (hosted on Neon)
- NextAuth (Credentials provider)
- Zustand (State Management)
- framer-motion (Animations)
- react-hot-toast (Notifications)

## Recent Database Schema Enhancements (Prisma)
- **User:** Added `limitMultiplier` (float, e.g., 1.0 = 100%, 0.5 = 50% bet limits), and `lastSpinTime` (for the daily wheel).
- **Market:** Added `type` (e.g., Spread, Moneyline, Total), `userLimit` (max bet per user), and `totalLimit` (max global pool risk).
- **MarketTemplate:** Created a system to dynamically generate markets. Fields include `type`, `allowOnlySingles`, `outcomesFormat` (array of strings with placeholders), `defaultUserLimit`, and `defaultTotalLimit`.
- **Team:** Added a `Team` model relating to `League` and `Match` (`homeTeam`, `awayTeam`) to replace hardcoded match string names.
- **Bonus:** Added a table to track non-monetary prizes won by users (e.g., "Gym Jones Haircut").
- **Message:** Added a ticketing/support system table for user-to-admin communication.

## Customer-Facing Features Implemented
1. **Flawless Mobile UX:** Implemented a clean hamburger menu on mobile that slides out and hides the header cleanly. Odds now format correctly and Market Outcomes on match cards automatically sort from lowest odds (favorite) to highest odds (underdog).
2. **The "Coal Roller" Animation:** Upon a successful bet placement, a custom CSS/framer-motion animation of an F-150 truck driving across the screen and "rolling coal" plays.
3. **Daily Spin Wheel:** A visually perfect, SVG-based spinning wheel (`/spin`) utilizing `framer-motion`. Users can spin every 24 hours. There is a 50% chance to lose SCC (-2500, -5000) and a 50% chance to win positive items (+5000 SCC, Meet & Greets, VIP Access). Prizes update the DB balance or insert into the `Bonus` table.
4. **Joke Cashout:** In the "My Bets" history, pending tickets have a cashout button. As a joke, it *always* offers exactly 10% of their initial wager and algorithmically settles their ticket as "Cashed Out".
5. **My Bonuses & Support:** Added `/bonuses` to view non-monetary Spin Wheel prizes, and `/support` to send messages to the Admin.
6. **Short Bet IDs:** Added an 8-character hex `#B-XXXX` ID display to tickets for easy searching.

## Admin Back-Office Power-Tools
The Admin layout (`/admin`) was completely refactored into clean sections: Live Action, Bookmaking, Accounting, and Other.
1. **Live Ticket Feed:** A real-time feed (`/admin/tickets`) showing only "Pending" tickets as they come in, displaying the user, risk, payout, and full leg details.
2. **Stats & P&L Dashboard:** A highly advanced accounting page (`/admin/stats`). Allows time filtering (Today, Week, Month, All Time). It shows total volume (handle), payouts, sportsbook net profit, and payback %. It includes an expandable table to drill down from Sport -> League -> Match -> individual bet tickets.
3. **Liabilities & Exposure:** Shows the Net Book Profit (Total Market Pool - Outcome Liability) for every specific outcome on the board, coloring it green/red based on sportsbook exposure.
4. **Market Templates & Spread Logic:** The `/admin/templates` allows the creation of dynamic markets using placeholders like `{home}`, `{away}`, `{player}`, `{line}`, and `{inverse_line}`. When an admin enters `-1.5` as a `{line}`, the system accurately parses `{inverse_line}` as `+1.5` when writing to the DB.
5. **Matches Grader:** The `/admin/matches` page now features "Active" and "Completed" tabs. Admins can one-click "Mark Completed" to hide graded matches from the active view. Also includes inline odds editors and start time editors.
6. **Market Alarms:** (`/admin/alarms`) Triggers when a market's `totalLimit` is reached, automatically suspending it and notifying the admin.
7. **User CRM & Support:** The Users tab allows editing of limits (`limitMultiplier`), and the Support Hub allows admins to reply to user tickets.

## Known Architecture Details
- Because of Next.js App Router requirements, Server Actions used inside client forms (e.g., in `AddMarketFromTemplate.tsx`) are statically imported at the top of the file to prevent runtime dynamic import crashes.
- Database pushes require `prisma generate && prisma db push` during build times. Vercel is connected via `POSTGRES_PRISMA_URL` and `POSTGRES_URL_NON_POOLING`.

**Your Goal:** Read the current user's instructions and continue building upon this robust foundation. Do not overwrite or regress any of the features listed above. Maintain the dark-mode aesthetic and the sarcastic/joking "Gym Jones" sportsbook persona where applicable.