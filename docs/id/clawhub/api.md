---
read_when:
    - Membangun klien API
    - Menambahkan endpoint atau skema
summary: Gambaran umum dan konvensi REST API publik (v1).
x-i18n:
    generated_at: "2026-07-01T08:29:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31b0051506912d2aa0d724ed7b6542e09ef16dc92998ddbdd3e379f783954436
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

Basis: `https://clawhub.ai`

OpenAPI: `/api/v1/openapi.json`

## Penggunaan ulang katalog publik

Anda dapat membangun katalog, direktori, atau permukaan pencarian pihak ketiga di atas API baca publik ClawHub. Metadata Skills publik dan berkas Skills diterbitkan berdasarkan aturan lisensi Skills ClawHub, sedangkan API itu sendiri dibatasi lajunya dan harus digunakan secara bertanggung jawab.

Panduan:

- Gunakan endpoint baca publik seperti `GET /api/v1/skills`, `GET /api/v1/search`, dan `GET /api/v1/skills/{slug}` untuk daftar katalog.
- Simpan respons dalam cache dan hormati header `429`, `Retry-After`, dan batas laju, alih-alih melakukan polling secara agresif.
- Tautkan kembali ke URL Skills ClawHub kanonis saat menampilkan daftar agar pengguna dapat memeriksa catatan registri sumber.
- Gunakan URL halaman kanonis dalam bentuk `https://clawhub.ai/<owner>/skills/<slug>`.
- Jangan menyiratkan bahwa ClawHub mendukung, memverifikasi, atau mengoperasikan situs pihak ketiga tersebut.
- Jangan mencerminkan konten tersembunyi, privat, atau diblokir moderasi dengan melewati filter API publik atau batas autentikasi.

## Autentikasi

- Baca publik: tidak memerlukan token.
- Tulis + akun: `Authorization: Bearer clh_...`.

## Batas laju

Penegakan sadar autentikasi:

- Permintaan anonim: per IP.
- Permintaan terautentikasi (token Bearer valid): per bucket pengguna.
- Token yang hilang/tidak valid kembali ke penegakan IP.

- Baca: 3000/menit per IP, 12000/menit per kunci
- Tulis: 300/menit per IP, 3000/menit per kunci
- Unduh: 1200/menit per IP, 6000/menit per kunci

Header: `X-RateLimit-Limit`, `X-RateLimit-Reset`, `RateLimit-Limit`, `RateLimit-Reset`;
`X-RateLimit-Remaining`, `RateLimit-Remaining`, dan `Retry-After` disertakan pada `429`.

Semantik:

- `X-RateLimit-Reset`: detik epoch Unix (waktu reset absolut)
- `RateLimit-Reset`: detik penundaan hingga reset
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: anggaran tersisa yang tepat saat
  ada; permintaan berhasil yang di-shard menghilangkannya alih-alih mengembalikan
  nilai global perkiraan
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

- Utamakan `Retry-After` saat ada.
- Jika tidak, gunakan `RateLimit-Reset` atau turunkan penundaan dari `X-RateLimit-Reset`.
- Tambahkan jitter pada percobaan ulang.

## Kesalahan

- Kesalahan v1 berupa teks biasa (`text/plain; charset=utf-8`), termasuk `400`,
  `401`, `403`, `404`, `429`, dan respons unduhan yang diblokir.
- Parameter kueri yang tidak dikenal diabaikan demi kompatibilitas.
- Parameter kueri yang dikenal dengan nilai tidak valid mengembalikan `400`.

## Endpoint

Baca publik:

- `GET /api/v1/search?q=...`
  - Filter opsional: `highlightedOnly=true`, `nonSuspiciousOnly=true`
  - Alias lama: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated` (bawaan), `recommended` (`default`), `createdAt` (`newest`), `downloads`, `stars` (`rating`), alias pemasangan lama `installsCurrent`/`installs`/`installsAllTime` dipetakan ke `downloads`, `trending`
  - Nilai `sort` yang tidak valid mengembalikan `400`
  - `cursor` berlaku untuk pengurutan selain `trending`
  - Filter opsional: `nonSuspiciousOnly=true`
  - Alias lama: `nonSuspicious=true`
  - Dengan `nonSuspiciousOnly=true`, halaman berbasis kursor dapat berisi lebih sedikit item daripada `limit`; gunakan `nextCursor` untuk melanjutkan.
  - `recommended` menggunakan sinyal keterlibatan dan keterkinian.
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
  - Skills yang dihosting mengembalikan byte ZIP deterministik.
  - Skills saat ini yang didukung GitHub dengan pemindaian `clean` atau `suspicious` mengembalikan
    deskriptor serah-terima JSON `public-github` alih-alih byte ClawHub.
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
  - Skills yang dihosting diekspor sebagai berkas tersimpan.
  - Skills saat ini yang didukung GitHub dengan pemindaian `clean` atau `suspicious` diekspor
    sebagai deskriptor serah-terima `public-github`.
- `GET /api/v1/packages?limit=&cursor=&sort=`
  - `sort`: `updated` (bawaan), `recommended`, `downloads`, alias lama `installs`
  - Nilai `sort` yang tidak valid mengembalikan `400`
- `GET /api/v1/plugins?limit=&cursor=&sort=`
  - `sort`: `recommended` (bawaan), `downloads`, `updated`, alias lama `installs`
- `GET /api/v1/plugins/search?q=...`
- `GET /api/v1/packages/{name}/versions/{version}/artifact`
- `GET /api/v1/packages/{name}/versions/{version}/security`
- `GET /api/v1/packages/{name}/versions/{version}/artifact/download`
- `GET /api/npm/{package}`
- `GET /api/npm/{package}/-/{tarball}.tgz`

Autentikasi diperlukan:

- `POST /api/v1/skills` (publikasikan, multipart lebih disukai)
- `DELETE /api/v1/skills/{slug}`
- `DELETE /api/v1/packages/{name}`
- `POST /api/v1/skills/{slug}/undelete`
- `POST /api/v1/packages/{name}/undelete`
- `POST /api/v1/skills/{slug}/rename`
- `POST /api/v1/skills/{slug}/merge`
- `POST /api/v1/skills/{slug}/transfer`
- `POST /api/v1/packages/{name}/transfer`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
- `GET /api/v1/plugins/export?startDate=&endDate=&limit=&cursor=&family=`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
- `GET /api/v1/whoami`

Khusus admin:

- `POST /api/v1/users/reserve` mencadangkan slug root dan placeholder paket privat tanpa rilis untuk handle pemilik.

## Lama

`/api/*` dan `/api/cli/*` lama masih tersedia. Lihat `DEPRECATIONS.md`.
