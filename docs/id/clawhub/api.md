---
read_when:
    - Membangun klien API
    - Menambahkan titik akhir atau skema
summary: Ikhtisar dan konvensi REST API publik (v1).
x-i18n:
    generated_at: "2026-05-10T19:24:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: ca750027e4077f907a5590e4e28bde896c1f74b65a9ca39a79274b97e5de6148
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

Basis: `https://clawhub.ai`

OpenAPI: `/api/v1/openapi.json`

## Penggunaan ulang katalog publik

Anda dapat membangun katalog, direktori, atau permukaan pencarian pihak ketiga di atas API baca publik ClawHub. Metadata skill publik dan berkas skill diterbitkan berdasarkan aturan lisensi skill ClawHub, sementara API itu sendiri dibatasi lajunya dan harus dikonsumsi secara bertanggung jawab.

Panduan:

- Gunakan endpoint baca publik seperti `GET /api/v1/skills`, `GET /api/v1/search`, dan `GET /api/v1/skills/{slug}` untuk daftar katalog.
- Cache respons dan hormati `429`, `Retry-After`, serta header batas laju alih-alih melakukan polling secara agresif.
- Tautkan kembali ke URL skill ClawHub kanonis saat menampilkan daftar agar pengguna dapat memeriksa rekaman registri sumber.
- Gunakan URL halaman kanonis dalam bentuk `https://clawhub.ai/<owner>/<slug>`.
- Jangan menyiratkan bahwa ClawHub mendukung, memverifikasi, atau mengoperasikan situs pihak ketiga tersebut.
- Jangan menyalin konten tersembunyi, privat, atau diblokir moderasi dengan melewati filter API publik atau batas autentikasi.

## Auth

- Baca publik: tidak memerlukan token.
- Tulis + akun: `Authorization: Bearer clh_...`.

## Batas laju

Penegakan yang sadar auth:

- Permintaan anonim: per IP.
- Permintaan terautentikasi (token Bearer valid): per bucket pengguna.
- Token yang hilang/tidak valid kembali ke penegakan IP.

- Baca: 600/menit per IP, 2400/menit per kunci
- Tulis: 45/menit per IP, 180/menit per kunci

Header: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`, `Retry-After` (pada 429).

Semantik:

- `X-RateLimit-Reset`: detik epoch Unix (waktu reset absolut)
- `RateLimit-Reset`: detik penundaan hingga reset
- `Retry-After`: detik penundaan untuk menunggu pada `429`

Contoh `429`:

```http
HTTP/2 429
x-ratelimit-limit: 20
x-ratelimit-remaining: 0
x-ratelimit-reset: 1771404540
ratelimit-limit: 20
ratelimit-remaining: 0
ratelimit-reset: 34
retry-after: 34
```

Penanganan klien:

- Utamakan `Retry-After` jika ada.
- Jika tidak, gunakan `RateLimit-Reset` atau turunkan penundaan dari `X-RateLimit-Reset`.
- Tambahkan jitter ke percobaan ulang.

## Endpoint

Baca publik:

- `GET /api/v1/search?q=...`
  - Filter opsional: `highlightedOnly=true`, `nonSuspiciousOnly=true`
  - Alias lama: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated` (default), `createdAt` (`newest`), `downloads`, `stars` (`rating`), `installsCurrent` (`installs`), `installsAllTime`, `trending`
  - `cursor` berlaku untuk pengurutan non-`trending`
  - Filter opsional: `nonSuspiciousOnly=true`
  - Alias lama: `nonSuspicious=true`
  - Dengan `nonSuspiciousOnly=true`, halaman berbasis kursor dapat berisi lebih sedikit item daripada `limit`; gunakan `nextCursor` untuk melanjutkan.
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
- `GET /api/v1/packages/{name}/versions/{version}/artifact`
- `GET /api/v1/packages/{name}/versions/{version}/artifact/download`
- `GET /api/npm/{package}`
- `GET /api/npm/{package}/-/{tarball}.tgz`

Memerlukan auth:

- `POST /api/v1/skills` (publikasikan, multipart lebih disukai)
- `DELETE /api/v1/skills/{slug}`
- `DELETE /api/v1/packages/{name}`
- `POST /api/v1/skills/{slug}/undelete`
- `POST /api/v1/skills/{slug}/rename`
- `POST /api/v1/skills/{slug}/merge`
- `POST /api/v1/skills/{slug}/transfer`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
- `GET /api/v1/whoami`

Hanya admin:

- `POST /api/v1/users/reserve` mencadangkan slug root dan placeholder paket privat tanpa rilis untuk handle pemilik.

## Legacy

Legacy `/api/*` dan `/api/cli/*` masih tersedia. Lihat `DEPRECATIONS.md`.
