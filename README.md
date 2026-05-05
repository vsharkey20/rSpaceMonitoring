# rSpace — Client Tracker

A co-working space client monitoring system built with **Vite + Vanilla JS + Appwrite**.

## Tech Stack
- **Frontend:** Vite + Vanilla JavaScript (ES Modules)
- **Backend:** Appwrite (sgp.cloud.appwrite.io)
- **Design:** Yellow/White/Black theme with Syne + DM Sans fonts

## Features

### Admin View
- 📊 **Dashboard** — Today's stats (clients, revenue, collections)
- 📋 **Monitoring Log** — Full CRUD table with filters by date/name
- 🔄 **Shift Report** — Start/end shift notes, expense logging, daily summary
- ⚙️ **Maintenance** — Manage Services, Client Types, and Billing Types

### Customer View
- Type name with **autocomplete** from existing records
- Displays **client type** and **rate breakdown** (1hr / 4hr / 8hr / 12hr)
- Shows correct rates: Student vs Regular

### Billing Logic
| Plan | Student | Regular |
|------|---------|---------|
| 1 Hour | ₱79 | ₱85 |
| 4 Hours | ₱225 | ₱250 |
| 8 Hours | ₱405 | ₱450 |
| 12 Hours | ₱612 | ₱680 |

> **Hour rounding:** If a customer exceeds 20 minutes past an hour, it counts as the next full hour.

## Setup

1. Create collections in Appwrite — see `APPWRITE_SETUP.md`
2. Install dependencies: `npm install`
3. Run dev server: `npm run dev`
4. Open: http://localhost:5173

## Appwrite Collections
- `tblRSpace` — Database
- `tblMonitoring` — Main tracking
- `tblServices` — Service types
- `tblClientTypes` — Client categories
- `tblBillingTypes` — Billing categories
