# Progress Tracker - ECGO Battery Swap Dashboard

## Phase 1: Infrastructure ✅
- [x] Project scaffold Next.js 15 App Router
- [x] Tailwind CSS configuration
- [x] TypeScript strict mode (tsconfig.json)
- [x] Docker PostgreSQL configuration (docker-compose.yml)
- [x] Environment files (.env.example)
- [x] ESLint & Prettier configuration

## Phase 2: Database Setup ✅
- [x] Drizzle ORM configuration (drizzle.config.ts)
- [x] Database schema (cabinets, slots, transactions) - lib/schema.ts
- [x] Database connection - lib/db.ts
- [x] Initial migration (db:push ke Postgres lokal 5432)
- [x] Seeding data (50 cabinets, 600 slots, 20k transaksi)

## Phase 3: API Routes ✅
- [x] GET /api/cabinets (list with filter, search, sort, pagination)
- [x] GET /api/cabinets/[id] (detail with slots, transactions, chart)
- [x] Zod validation untuk semua endpoint
- [x] Error handling standar

## Phase 4: UI Components ✅
- [x] CabinetTable.tsx (daftar cabinet dengan pagination)
- [x] LoadingSpinner.tsx
- [x] ErrorMessage.tsx
- [x] SlotGrid.tsx (integrasi dalam page.tsx)
- [x] SwapChart.tsx (integrasi dalam page.tsx)
- [x] TransactionList.tsx (integrasi dalam page.tsx)

## Phase 5: Pages ✅
- [x] app/dashboard/page.tsx (overview - KPI dashboard)
- [x] app/dashboard/cabinets/page.tsx (daftar cabinet)
- [x] app/dashboard/cabinets/[id]/page.tsx (detail cabinet)
- [x] app/dashboard/transactions/page.tsx (riwayat transaksi)
- [x] app/layout.tsx
- [x] app/globals.css

## Phase 6: Quality & Testing ✅
- [x] Vitest configuration (vitest.config.ts)
- [x] Unit tests untuk schema & utils (62 tests: lib/validation.test.ts + lib/checkin/evaluateCheckin.test.ts + API routes + components)
- [x] Component tests (StatusBadge, CabinetTable, Sidebar, Topbar)
- [x] API route tests (cabinets, detail, export, transactions, dashboard — mock @/lib/db)
- [x] Code coverage ≥ 80% (All files: 96.9% statements, 86.11% branches, 92% functions)
- [x] Lint passing (bun run lint)
- [x] Type checking passing (bun run typecheck)
- [x] Build successful (bun run build)

## Phase 7: Deployment ⏳
- [x] Dockerize Next.js app (Dockerfile pakai oven/bun, COPY bun.lock, CMD bun run start)
- [x] Workflow CI/CD deploy.yml (lint, typecheck, test mock DB, build, validate compose)
- [x] Deploy ke VM via Cloudflare Tunnel: tulis .env.prod dari secrets → up postgres → build → migrate → seed (hanya saat DB kosong) → up dashboard
- [x] Verifikasi `docker compose build` lokal (image oven/bun sukses dengan flag streaming-install workaround)
- [ ] Deploy ke server staging
- [ ] Deploy ke server production

## Phase 8: Refactor & Cleanup ✅
- [x] Konsistensi package manager Bun (scripts bunx/bun, README, AGENTS, phase)
- [x] Dockerfile pindah ke base image oven/bun:1-alpine (build pakai bun.lock)
- [x] eslint.config.js tambah ignores (.next, coverage, drizzle, mockup, dll)
- [x] Alias script `seed` → `npm run seed` sesuai spek take-home
- [x] Postgres host mapping docker-compose 5432 (docker postgres dikhususkan untuk deploy VM; docs diselaraskan)

> Catatan: Docker postgres (host 5432) dikhususkan untuk deploy VM; dev memakai Postgres lokal 5432.

---

## Statistik
- **Total Tasks:** 46
- **Completed:** 44
- **In Progress:** 0
- **Pending:** 2