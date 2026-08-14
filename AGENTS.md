# AGENTS.md — ECGO Battery Swap Dashboard

## 🎯 TUJUAN
Buat dashboard internal untuk tim operasional ECGO memantau cabinet battery swap.

**Stack Wajib:**
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- PostgreSQL 16 (Docker)
- Drizzle ORM
- Zod (validasi API)
- Recharts / Chart.js (grafik)
- @faker-js/faker (seed data)

---

## 📁 STRUKTUR FOLDER

app/
├── api/
│   ├── cabinets/route.ts          # GET list cabinets (filter, search, sort, pagination)
│   └── cabinets/[id]/route.ts      # GET detail cabinet
├── page.tsx                         # Halaman utama (Daftar Cabinet)
└── cabinets/[id]/page.tsx          # Halaman detail cabinet
components/
├── ui/
│   ├── CabinetTable.tsx
│   ├── SlotGrid.tsx
│   ├── SwapChart.tsx
│   └── TransactionList.tsx
├── shared/
│   ├── LoadingSpinner.tsx
│   └── ErrorMessage.tsx
lib/
├── db.ts                          # Koneksi database (Drizzle)
└── schema.ts                      # Schema Drizzle
drizzle/
├── migrations/
└── seed.ts                        # Seed script
types/
└── index.ts
.docker/
├── Dockerfile
├── docker-compose.yml
.env.local
drizzle.config.ts
next.config.ts
tailwind.config.ts
vitest.config.ts
package.json
README.md
AGENTS.md
todo.md
phase.md

---

## 🗄️ DATABASE SCHEMA

### Status Enum
- ONLINE, OFFLINE, MAINTENANCE

### Slot State Enum
- EMPTY, CHARGING, FULL, LOCKED, FAULT

---

## 📡 API ENDPOINTS

### GET /api/cabinets
Query params: `search`, `status`, `page`, `limit`, `sortBy`, `sortOrder`
Response: `{ id, code, branch, status, filledSlots, totalSlots, swapCount24h, lastHeartbeat }[]` + pagination

### GET /api/cabinets/:id
Response: Cabinet detail with slots, 24h transactions, chart data

---

## 🚀 DEVELOPMENT COMMANDS

```bash
# Setup
docker-compose up -d postgres
cp .env.example .env.local
npm install
npm run db:push        # Initial migration
npm run db:seed        # Seed 20k transactions

# Development
npm run dev            # http://localhost:3000

# Quality checks
npm run lint
npm run typecheck
npm run test           # vitest

# Build & Start
npm run build
npm run start
```

---

## 🔑 KONFINAN DATABASE

PostgreSQL via Docker:
- Host: localhost
- Port: 5432
- Database: ecgo_dashboard
- User: postgres
- Password: postgres

---

## 🧪 TESTING

```bash
npm run test              # Run tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
```

---

## 📋 IMPLEMENTATION ORDER

1. Docker + PostgreSQL setup
2. Drizzle ORM + migrations
3. API routes (cabinets, transactions)
4. UI components
5. Seeding data
6. Testing & lint

---

## ⚠️ PENTING DARI SOAL

- **Sorting di Halaman 1:** Sorting berdasarkan swapCount24h (default desc)
- **filledSlots:** Slot dengan state FULL atau CHARGING
- **swap 24h:** Rolling 24 jam dari waktu request
- **Last Heartbeat:** null = OFFLINE
- **Offset Pagination:** Backend, alasan di README.md

---

## 📦 DEPENDENCIES

```json
{
  "dependencies": {
    "@faker-js/faker": "^8.0.2",
    "drizzle-orm": "^0.31.1",
    "next": "15.2.4",
    "react": "18.3.3",
    "react-dom": "18.3.3",
    "recharts": "^2.12.7",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "typescript": "^5.5.3",
    "tailwindcss": "^3.4.21",
    "drizzle-kit": "^0.31.1",
    "vitest": "^1.6.0",
    "jsdom": "^26.0.0"
  }
}
```

---

## 🚀 CI/CD

Update `.github/workflows/test-ssh.yml` untuk deployment vm setelah selesai.