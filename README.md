# Express + mysql2 REST API Skeleton (No ORM)

REST API skeleton menggunakan **Node.js + Express**, **MySQL via mysql2** (tanpa Sequelize/ORM apapun, raw SQL dengan parameterized query), autentikasi **JWT**, CRUD lengkap, dan **graceful shutdown**.

## Struktur Folder

```
config/         -> config/database.js (mysql2 connection pool singleton)
controllers/    -> logic request/response (authController, itemController)
middleware/     -> auth middleware (protect, authorize), error handler (kode error MySQL), validator (lebih lengkap krn tanpa ORM)
models/         -> User.js, Item.js: raw SQL query (parameterized) + reshape hasil JOIN
routes/         -> route definitions (authRoutes, itemRoutes, index.js)
sql/            -> schema.sql (DDL tabel) + migrate.js (runner sederhana)
utils/          -> jwt, response, pagination (LIMIT/OFFSET), password helper
app.js          -> setup express app (middleware & routes)
server.js       -> entrypoint: connect DB pool, listen, graceful shutdown
```

> Catatan: Karena tidak pakai ORM, **tidak ada Model class** seperti Sequelize.
> Folder `models/` berisi fungsi yang menjalankan **raw SQL** (selalu parameterized
> query `?` — bukan string concatenation, supaya aman dari SQL injection) terhadap
> tabel `users` dan `items`. Semua hal yang biasanya otomatis di Sequelize —
> validasi, JOIN/include, exclude password, migration — dikerjakan secara eksplisit.

## Instalasi

```bash
npm install
cp .env.example .env
# sesuaikan DB_HOST, DB_NAME, DB_USER, DB_PASS, JWT_SECRET di .env
```

Jalankan migration (membuat database kalau belum ada, lalu membuat tabel `users` & `items` dari `sql/schema.sql`):

```bash
npm run db:migrate
```

Jalankan server:

```bash
npm run dev   # development, pakai nodemon
npm start     # production
```

## Autentikasi

Semua endpoint kecuali `/api/auth/register`, `/api/auth/login`, dan `/api/health` membutuhkan header:

```
Authorization: Bearer <token>
```

## Endpoints

### Auth

| Method | Endpoint             | Auth | Deskripsi                   |
| ------ | -------------------- | ---- | --------------------------- |
| POST   | `/api/auth/register` | ❌   | Daftar user baru            |
| POST   | `/api/auth/login`    | ❌   | Login, return JWT token     |
| GET    | `/api/auth/me`       | ✅   | Data user yang sedang login |

**Register**

```json
POST /api/auth/register
{
  "name": "Romi",
  "email": "romi@example.com",
  "password": "secret123"
}
```

**Login**

```json
POST /api/auth/login
{
  "email": "romi@example.com",
  "password": "secret123"
}
```

### Items (CRUD)

| Method | Endpoint         | Auth | Deskripsi                              |
| ------ | ---------------- | ---- | -------------------------------------- |
| GET    | `/api/items`     | ✅   | List item (pagination, search, filter) |
| GET    | `/api/items/:id` | ✅   | Detail item                            |
| POST   | `/api/items`     | ✅   | Buat item baru (owner = user login)    |
| PUT    | `/api/items/:id` | ✅   | Update item (hanya owner / admin)      |
| DELETE | `/api/items/:id` | ✅   | Hapus item (hanya owner / admin)       |

**Query params untuk GET /api/items**

- `page` (default 1)
- `limit` (default 10, max 100)
- `search` (cari berdasarkan `name`, pakai `LIKE %keyword%`)
- `category`
- `status` (`active` | `inactive`)

**Create Item**

```json
POST /api/items
{
  "name": "Kaos Polos",
  "description": "Kaos katun combed 30s",
  "category": "Fashion",
  "price": 75000,
  "stock": 50,
  "status": "active"
}
```

## Format Response

Sukses:

```json
{
  "success": true,
  "message": "Items fetched successfully",
  "data": [...],
  "meta": { "page": 1, "limit": 10, "total": 25, "totalPages": 3, "hasNextPage": true, "hasPrevPage": false }
}
```

Gagal:

```json
{
    "success": false,
    "message": "Validation error",
    "errors": [{ "field": "status", "message": "status must be one of: active, inactive" }]
}
```

## Hal-hal yang dikerjakan manual (karena tanpa ORM)

- **Password excluded** — di Sequelize cukup `attributes: { exclude: ['password'] }`; di sini `User.findById()` memakai daftar kolom eksplisit (`SAFE_COLUMNS`) yang tidak menyertakan `password`. `User.findByEmail()` tetap select semua kolom (termasuk password) karena dipakai khusus saat login untuk dicocokkan, lalu dibuang manual lewat `User.toSafeUser()`.
- **JOIN owner** — di Sequelize cukup `include: [{ model: User, as: 'owner' }]`; di sini pakai `INNER JOIN users` manual di `BASE_SELECT`, lalu hasil kolom `owner_*` di-reshape jadi nested object (`reshapeItemRow()`).
- **Validasi field (required, enum, min, minLength)** — di Sequelize bagian dari schema; di sini dijalankan lewat `middleware/validate.js` (`validateBody()`) di layer route.
- **Migration/DDL tabel** — di Sequelize bisa `sync()`; di sini didefinisikan eksplisit di `sql/schema.sql` dan dijalankan manual lewat `npm run db:migrate` (`sql/migrate.js`).
- **Update parsial** — `Item.update()` membangun `SET` clause secara dinamis, hanya menyertakan kolom yang benar-benar dikirim di body request.

## Penanganan Error MySQL

`middleware/errorMiddleware.js` menangani kode error mysql2 yang umum muncul dari raw query:

- `ER_DUP_ENTRY` — duplicate entry (mis. email sudah terdaftar) → `409 Conflict`
- `ER_NO_REFERENCED_ROW` / `ER_NO_REFERENCED_ROW_2` — foreign key constraint gagal → `400 Bad Request`
- `ER_DATA_TOO_LONG` — data melebihi panjang kolom → `422 Unprocessable Entity`
- `ER_TRUNCATED_WRONG_VALUE_FOR_FIELD` — nilai tidak sesuai ENUM kolom → `422 Unprocessable Entity`

## Graceful Shutdown

`server.js` menangani `SIGTERM`, `SIGINT`, `unhandledRejection`, dan `uncaughtException`:

1. Berhenti menerima koneksi baru (`server.close`)
2. Menunggu request yang sedang berjalan selesai
3. Menutup connection pool mysql2 (`pool.end()` — menunggu semua koneksi aktif di pool selesai, baru menutup semuanya)
4. Exit process (force-exit setelah 10 detik jika macet)

Berguna terutama saat deploy di Docker/Kubernetes agar tidak ada request yang terputus paksa saat pod di-restart.
