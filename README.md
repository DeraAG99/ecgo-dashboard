# ECGO Battery Swap Dashboard

Dashboard internal untuk memantau status cabinet battery swap secara real-time.

## Setup

Ada dua mode database:

### Mode 1: Dev (PostgreSQL lokal, default)

PostgreSQL sudah terpasang di mesin dev pada port 5432.

```bash
# 1. Buat database (sekali saja)
createdb -U postgres ecgo_dashboard

# 2. Salin file environment
cp .env.example .env.local

# 3. Install dependencies (package manager: **Bun**)
bun install

# 4. Buat tabel database via migration
# PowerShell: set DATABASE_URL inline karena drizzle-kit tidak membaca .env.local
$env:DATABASE_URL="postgresql://postgres:password@localhost:5432/ecgo_dashboard"; bun run db:migrate

# 5. Seed data awal (50 cabinets, 600 slots, 20k transaksi)
$env:DATABASE_URL="postgresql://postgres:password@localhost:5432/ecgo_dashboard"; bun run db:seed

# 6. Jalankan development server
bun run dev
# Buka http://localhost:3000
```

### Mode 2: Deploy VM (PostgreSQL via Docker)

`docker-compose.yml` menyediakan postgres internal di port 5432, di-mapping ke host `5432:5432`. Mode ini dipakai saat deployment ke VM (di VM tidak ada Postgres lokal, jadi aman). Untuk tes Docker lokal di mesin dev yang sudah memakai Postgres di 5432, stop dulu Postgres lokalnya.

Credential dibaca **hanya dari file `.env.prod`** (gitignored, tidak di-commit). File ini disiapkan **manual sekali di VM** (`cp .env.example .env.prod` lalu isi credential); workflow `deploy.yml` hanya memakainya, tidak menulis.

Untuk testing lokal (urutan sama dengan deploy workflow: postgres → build → migrate → seed → app):
```bash
# 1. Buat .env.prod dari template, lalu sesuaikan POSTGRES_PASSWORD & DATABASE_URL
cp .env.example .env.prod

# 2. Jalankan sesuai urutan
docker compose --env-file .env.prod up -d postgres
docker compose --env-file .env.prod build
docker compose --env-file .env.prod run --rm -T dashboard bun run db:migrate
docker compose --env-file .env.prod run --rm -T dashboard bun run db:seed
docker compose --env-file .env.prod up -d
```

> **PowerShell** (Windows): `cp` diganti `Copy-Item .env.example .env.prod`. Nilai `.env.prod` ditulis manual di file tsb.

> `docker compose up` akan **error** jika `POSTGRES_PASSWORD` / `DATABASE_URL` kosong (guard `:?`). Jangan pernah commit nilai asli credential ke repo.

> Saat **deploy ke VM**, workflow `deploy.yml` hanya butuh `.env.prod` sudah ada di VM (disiapkan manual sekali). Urutan: `up postgres` → `build` → `db:migrate` → `db:seed` (**hanya** saat database masih kosong, first deploy) → `up dashboard` → health check.

## Database Configuration

- **Dev:** PostgreSQL lokal `localhost:5432` (bukan Docker) — gunakan `postgres/password`
- **VM/Docker:** postgres container internal `postgres:5432`, di-mapping ke host `5432`

| Mode | Host | Port | Database | User | Password |
|------|------|------|----------|------|----------|
| Dev | localhost | 5432 | ecgo_dashboard | postgres | password |
| VM (Docker) | localhost (host mapping) | 5432 | ecgo_dashboard | postgres | dari `.env.prod` |

> Kedua mode memakai skema & seed script yang sama; perbedaan hanya di `DATABASE_URL`.

## Timezone

Zona waktu tunggal: **WIB (Asia/Jakarta)**.

- Kolom waktu di DB memakai `timestamp` tanpa timezone, disimpan sebagai wall time WIB.
- `docker-compose.yml` menyetel `TZ: Asia/Jakarta` (+ `PGTZ`) di service `postgres` dan `TZ: Asia/Jakarta` di service `dashboard`.
- UI merender waktu via `formatJakarta()` dari `lib/time.ts` (eksplisit `timeZone: "Asia/Jakarta"`, bukan default browser).
- Filter tanggal di `/api/transactions` + export diinterpretasikan sebagai **WIB** (helper `jakartaDayStart`/`jakartaDayEndExclusive`; `endDate` inclusive).
- KPI "swap hari ini" & label grafik weekly pakai `jakartaTodayStart()`/`jakartaDateKey()` — tidak bergantung timezone host.
- ⚠️ Perubahan TZ mengharuskan re-seed data (offset lama akan tergeser).

## API Endpoints

### GET /api/cabinets
Daftar semua cabinet dengan filter & pagination.

**Query Params:**
- `search` - Cari kode cabinet atau nama cabang
- `status` - Filter: ONLINE, OFFLINE, MAINTENANCE
- `page` - Nomor halaman (default: 1)
- `limit` - Items per page (default: 10, max: 100)
- `sortBy` - sort: swapCount24h, code, lastHeartbeat (default: swapCount24h)
- `sortOrder` - asc atau desc (default: desc)

**Response:**
```json
{
  "data": [
    {
      "id": "CB-001",
      "code": "CB-001",
      "branch": "Kemayoran",
      "status": "ONLINE",
      "filledSlots": 8,
      "totalSlots": 12,
      "swapCount24h": 42,
      "lastHeartbeat": "2026-08-14T10:30:00Z"
    }
  ],
  "total": 50,
  "page": 1,
  "totalPages": 5
}
```

### GET /api/cabinets/:id
Detail cabinet dengan slot, transaksi, dan grafik.

### POST /api/checkins
Check-in lokasi staf/user terhadap radius cabang (geofence). Body: `{ userId, lat, lng, accuracyM }`.

Logika `lib/checkin/evaluateCheckin.ts`:
- `REJECTED LOW_ACCURACY` jika `accuracyM > 100`
- `REJECTED INVALID_COORDINATE` jika koordinat tidak valid
- `REJECTED NO_BRANCH_ASSIGNED` jika tidak ada cabang aktif (`status != MAINTENANCE`)
- `VALID` jika dalam radius cabang + tolerance; else `OUT_OF_RANGE` (dengan cabang terdekat)

**Response:** `{ checkIn, result }` (201). Seluruh check-in disimpan ke tabel `checkins`.

### GET /api/checkins
Riwayat check-in dengan filter `userId`, `result` dan pagination `page`/`limit`.
Response: `{ data, total, page, totalPages }`.

### POST /api/swaps
Eksekusi swap baterai, **di-gate ketat** oleh check-in:
- `403` jika tidak ada check-in `VALID` dalam **15 menit** terakhir untuk user tsb
- `403` jika cabang cabinet ≠ cabang lokasi check-in
- `404` jika cabinet tidak ditemukan
- `409` jika slot tidak tersedia (butuh ≥1 `FULL` & ≥1 `EMPTY`)
- Sukses (`201`): INSERT transaksi (`tx-...`, battery `BATT-XXXXXXXX`) + update slot `FULL→EMPTY` dan `EMPTY→CHARGING`. Response: `{ transaction, slotChanges }`.

## Asumsi

1. **Swap 24 jam terakhir**: Rolling 24 jam dari waktu request, bukan dari tengah malam
2. **filledSlots**: Slot dengan state `FULL` atau `CHARGING`
3. **Cabinet OFFLINE**: Tampilkan slot state terakhir dengan indikasi stale data
4. **Last Heartbeat null**: Diartikan sebagai status OFFLINE
5. **Pagination**: Menggunakan offset pagination (bukan cursor) karena dataset relatif kecil dan memungkinkan pencarian gratis

## Trade-off

**Mengapa Offset Pagination?**
- Simpler implementation
- Client dapat melakukan jump ke halaman manapun
- Dataset hanya 50 cabinets, overhead query tidak signifikan
- Untuk skala besar (ribuan-plus), cursor pagination lebih optimal

## Optimasi Kinerja (Anti N+1)

- **`GET /api/cabinets`** dieksekusi dalam **satu query SQL**: CTE `filtered_cabinets` + `LEFT JOIN LATERAL` untuk `filledSlots` & `swapCount24h`, plus `COUNT(*) OVER()` untuk total. Tidak ada N+1 query per-cabinet.
- **`GET /api/cabinets/:id`** chart data 24 jam di-agregasi di database (`GROUP BY` jam dari `swappedAt`), bukan fetch semua transaksi lalu dihitung di JavaScript.
- Filter, search, sort, dan offset pagination sepenuhnya di database.

## Struktur Data

### Cabinets
- `id`: string (primary key, kode cabinet)
- `code`: string (unik)
- `branch`: string (nama lokasi)
- `status`: ENUM ('ONLINE', 'OFFLINE', 'MAINTENANCE')
- `totalSlots`: integer (default: 12)
- `lastHeartbeat`: timestamp

### Slots
- `id`: string (primary key)
- `cabinetId`: string (foreign key)
- `slotNumber`: integer (1-12)
- `state`: ENUM ('EMPTY', 'CHARGING', 'FULL', 'LOCKED', 'FAULT')
- `soc`: integer (0-100, null untuk EMPTY)
- `lastUpdated`: timestamp

### Transactions
- `id`: string (primary key)
- `cabinetId`: string (foreign key)
- `userId`: string
- `oldBatteryId`: string
- `newBatteryId`: string
- `swappedAt`: timestamp

### Check-ins
- `id`: string (primary key, `ci-...`)
- `userId`: string
- `lat`/`lng`: koordinat user saat check-in
- `accuracyM`: akurasi GPS (meter)
- `result`: ENUM ('VALID', 'OUT_OF_RANGE', 'REJECTED')
- `reason`: ENUM ('LOW_ACCURACY', 'INVALID_COORDINATE', 'NO_BRANCH_ASSIGNED'), null selain REJECTED
- `branchId`: string (FK ke cabinets; cabang valid/terdekat)
- `distanceM`: jarak ke cabang (null saat REJECTED)
- `createdAt`: timestamp

> Cabang (cabinet) kini memiliki `lat`, `lng`, `radiusM` (meter) sebagai target geofence check-in.

## Development Commands

```bash
# Quality checks
bun run lint         # ESLint
bun run typecheck    # TypeScript
bun run test         # Vitest (watch mode); gunakan "bunx vitest run" untuk sekali jalan / CI
bunx vitest run --coverage  # Coverage (target ≥80%; saat ini 96.9% statements, 92% functions)

# Database (butuh $env:DATABASE_URL inline di PowerShell)
bun run db:migrate   # Apply migration (drizzle/migrations)
bun run db:seed      # Seed 50 cabinets, 600 slots, 20k transaksi
npm run seed         # Alias sama dengan db:seed (sesuai spek take-home)

# Build & Deploy
bun run build        # Build untuk production
bun run start        # Run production server
```

## CI/CD

`.github/workflows/deploy.yml` menjalankan lint, typecheck, test (coverage), dan build pada setiap push/PR ke `main`. Test memakai mock (`vi.mock("@/lib/db")`), jadi **tidak butuh Postgres** di CI.

Push ke `main` yang sukses memicu deploy ke VM via Cloudflare Tunnel dengan urutan: `up postgres` → `build` → `db:migrate` → `db:seed` (hanya saat DB kosong) → `up dashboard` → health check. `.env.prod` dibaca dari VM (disiapkan manual sekali).

Butuh secrets: `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY`, `SSH_PRIVATE_KEY_FILENAME`, `SSH_PORT`. Lokasi app di VM via repo var `APP_DIR` (default `/opt/ecgo-dashboard`). Credential DB tidak lewat GitHub — semua di `.env.prod` VM.

## Yang Belum Selesai

- [x] Unit testing (validasi Zod, logic check-in, API routes, components — 62 tests)
- [x] Code coverage ≥ 80% (All files: 96.9% statements, 86.2% branches, 92% functions)
- [x] CI/CD workflow auto-deploy (deploy.yml: migrate + seed saat first deploy; .env.prod manual di VM)
- [x] Stale indicator visual untuk cabinet OFFLINE di slot grid (Asumsi #3 — grid redup + banner "Cabinet OFFLINE", via `components/ui/SlotGrid`)
- [x] Verifikasi `docker compose build` lokal (image oven/bun sukses dengan flag streaming-install workaround)
- [ ] E2E testing
- [ ] Dark mode
- [ ] Deploy ke VM staging & production (workflow siap, tinggal set secrets & repo vars)

## AI Tools

- ChatGPT: Beberapa bagian dokumentasi
- Stich AI: Ide UX design
- Opencode: create Plan, code generation & debugging

## License

MIT