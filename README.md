# ✦ Vedic Cosmos — Admin Dashboard

A production-grade Vedic Astrology Admin Portal built with **Next.js 14**, **TypeScript**, and **Zod** validation.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev

# 3. Open http://localhost:3000
```

---

## 🔐 Login Credentials

| Field    | Value                        |
|----------|------------------------------|
| Email    | `admin@vediccosmos.com`      |
| Password | `Admin@1234`                 |
| 2FA Code | `123456`                     |

The login flow:
1. Enter email + password → validated with Zod
2. Redirected to 2FA step → enter 6-digit OTP
3. On success → redirected to `/dashboard`

---

## 📁 Project Structure

```
src/
├── app/
│   ├── login/page.tsx              # Login + 2FA page
│   ├── dashboard/
│   │   ├── layout.tsx              # Auth guard + sidebar + header
│   │   ├── page.tsx                # Overview with charts & stats
│   │   ├── users/page.tsx          # All registered users
│   │   ├── customers/page.tsx      # Paid plan customers
│   │   ├── transactions/page.tsx   # Payment history
│   │   ├── reports/page.tsx        # All reports
│   │   └── create-report/page.tsx  # Report editor
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── ui/                         # Badge, Button, Input, Select, Modal
│   ├── layout/                     # Sidebar, Header
│   ├── dashboard/                  # StatCard, UserDetailModal, ReportPreviewModal
│   └── editor/                     # RichEditor (contentEditable + toolbar)
├── lib/
│   ├── schemas.ts                  # All Zod schemas
│   ├── utils.ts                    # Formatters, colour helpers
│   ├── mock-data.ts                # Realistic sample data
│   └── pdf-generator.ts            # jsPDF report generator
├── store/
│   └── auth-store.ts               # Zustand auth state
└── types/
    └── index.ts                    # All TypeScript types
```

---

## ✨ Features

### 🔐 Authentication
- Email + password login (Zod-validated)
- 2FA with 6-digit OTP input (tab/backspace navigation)
- Zustand persisted auth state
- Route guard on all `/dashboard/*` pages

### 📊 Dashboard Overview
- 4 KPI stat cards (users, customers, revenue, reports)
- Area chart — monthly revenue (Recharts)
- Pie chart — plan distribution
- Recent transactions + recent reports tables

### 👥 Users List
- Table with: name, email, phone, birth date/time, birth place, primary concern, plan, status, last login
- Zod-validated filters: search, plan, status
- Click "View" to open a full-detail modal with all fields

### 🛍️ Customers List
- Shows paid plan subscribers with subscription dates and amount paid
- Summary cards: total customers, revenue, reports issued
- Full detail modal with birth info

### 💳 Transactions
- Shows all payment transactions with gateway (Razorpay / Stripe / PayPal)
- Status badges: success / pending / failed / refunded
- Filters: search, status, gateway
- Revenue summary cards

### 📝 All Reports
- Card-grid view of all reports with template and status badges
- Preview modal: renders HTML content, shows client info
- Download as PDF (jsPDF)
- "Send to Client" simulates email dispatch

### ✍️ Create Report
- **Template selector**: Free / Modern / Premium (with auto-fills starter content)
- **Client picker**: Dropdown with all customers, shows birth details preview
- **Rich Text Editor**: Custom contentEditable with toolbar
  - Bold, Italic, Underline
  - H2, H3 headings
  - Bullet list, Numbered list
  - Blockquote, Divider
- **Zod validation**: title (3-120 chars), content (50-50000 chars), userId required
- **Create Report** → opens preview modal
- **Download PDF** → generates branded A4 PDF with jsPDF
- **Send to Client** → simulates email send

---

## 🎨 Design System

| Aspect       | Choice                                              |
|--------------|-----------------------------------------------------|
| Theme        | Dark cosmic — deep ink blacks with cosmos purples & gold |
| Display Font | Cormorant Garamond (serif, elegant)                 |
| Body Font    | DM Sans (clean, readable)                           |
| Mono Font    | JetBrains Mono (transaction refs, IDs)              |
| Colors       | cosmos (purple), gold, jade (green), ember (red)    |
| Charts       | Recharts with custom tooltips                       |
| Animations   | CSS float, spin-slow, shimmer; hover transitions    |

---

## 🛠 Tech Stack

| Package              | Purpose                      |
|----------------------|------------------------------|
| Next.js 14           | App Router, RSC               |
| TypeScript           | Full type safety              |
| Zod                  | Schema validation             |
| React Hook Form      | Form state + validation       |
| Zustand              | Auth state management         |
| Recharts             | Charts                        |
| jsPDF                | PDF generation                |
| Tailwind CSS         | Styling                       |
| Lucide React         | Icons                         |

---

## 📌 Notes

- All data is **mock/in-memory** — no backend required
- PDF generation runs entirely client-side
- "Send to Client" is simulated (shows success after 1.8s)
- To connect a real backend: replace `src/lib/mock-data.ts` with API calls
- To enable real 2FA: integrate `otplib` + `speakeasy` on the server
