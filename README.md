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
$env:DATABASE_URL="postgresql://postgres:password@localhost:5432/ecgo_dashboard"; npm run db:migrate

# 5. Seed data awal (50 cabinets, 600 slots, 20k transaksi)
$env:DATABASE_URL="postgresql://postgres:password@localhost:5432/ecgo_dashboard"; npm run db:seed

# 6. Jalankan development server
npm run dev
# Buka http://localhost:3000
```

### Mode 2: Deploy VM (PostgreSQL via Docker)

`docker-compose.yml` menyediakan postgres internal di port 5432 (di-mapping ke host 5433 agar tidak bentrok dengan postgres dev). Dipakai saat deployment ke VM.

```bash
docker-compose up -d postgres
docker-compose build
docker-compose up -d
```

## Database Configuration

- **Dev:** PostgreSQL lokal `localhost:5432` (bukan Docker) — gunakan `postgres/password`
- **VM/Docker:** postgres container internal `postgres:5432`, di-mapping ke host `5433`

| Mode | Host | Port | Database | User | Password |
|------|------|------|----------|------|----------|
| Dev | localhost | 5432 | ecgo_dashboard | postgres | password |
| VM (Docker) | localhost (host mapping) | 5433 | ecgo_dashboard | postgres | postgres |

> Kedua mode memakai skema & seed script yang sama; perbedaan hanya di `DATABASE_URL`.

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

## Development Commands

```bash
# Quality checks
bun run lint         # ESLint
bun run typecheck    # TypeScript
bun run test         # Vitest (watch mode); gunakan "bunx vitest run" untuk sekali jalan / CI
bunx vitest run --coverage  # Coverage (target ≥80%; saat ini 96.9% statements, 92% functions)

# Database (butuh $env:DATABASE_URL inline di PowerShell)
npm run db:migrate   # Apply migration (drizzle/migrations)
npm run db:seed      # Seed 50 cabinets, 600 slots, 20k transaksi

# Build & Deploy
bun run build        # Build untuk production
bun run start        # Run production server
```

## CI/CD

`.github/workflows/test-ssh.yml` otomatis menjalankan lint, typecheck, test (coverage), dan build pada setiap push/PR ke `main`. Push ke `main` yang sukses juga memicu deploy ke VM via SSH (butuh secrets `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY`, `SSH_PORT`; lokasi app di VM via repo var `APP_DIR`, default `/opt/ecgo-dashboard`).

## Yang Belum Selesai

- [x] Unit testing (validasi Zod, logic check-in, API routes, components — 62 tests)
- [x] Code coverage ≥ 80% (All files: 96.9% statements, 86.11% branches, 92% functions)
- [x] CI/CD workflow auto-deploy (test-ssh.yml sudah di-upgrade)
- [ ] E2E testing
- [ ] Dark mode
- [ ] Deploy ke VM staging & production (workflow siap, tinggal set secrets & repo vars)

## AI Tools

- ChatGPT: Beberapa bagian dokumentasi
- Stich AI: Ide UX design
- Opencode: create Plan, code generation & debugging

## License

MIT