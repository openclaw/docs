---
read_when:
    - Membangun klien API
    - Menambahkan endpoint atau skema
summary: Ikhtisar dan konvensi REST API publik (v1).
x-i18n:
    generated_at: "2026-07-19T04:59:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 31b0051506912d2aa0d724ed7b6542e09ef16dc92998ddbdd3e379f783954436
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

Dasar: `https://clawhub.ai`

OpenAPI: `/api/v1/openapi.json`

## Penggunaan ulang katalog publik

Anda dapat membangun katalog, direktori, atau sarana pencarian pihak ketiga berdasarkan API baca publik ClawHub. Metadata Skills publik dan file Skills dipublikasikan berdasarkan aturan lisensi Skills ClawHub, sedangkan API itu sendiri memiliki batas laju dan harus digunakan secara bertanggung jawab.

Pedoman:

- Gunakan endpoint baca publik seperti `GET /api/v1/skills`, `GET /api/v1/search`, dan `GET /api/v1/skills/{slug}` untuk daftar katalog.
- Simpan respons dalam cache dan patuhi `429`, `Retry-After`, serta header batas laju, alih-alih melakukan polling secara agresif.
- Tautkan kembali ke URL Skills ClawHub kanonis saat menampilkan daftar agar pengguna dapat memeriksa rekaman registri sumber.
- Gunakan URL halaman kanonis dalam bentuk `https://clawhub.ai/<owner>/skills/<slug>`.
- Jangan menyiratkan bahwa ClawHub mendukung, memverifikasi, atau mengoperasikan situs pihak ketiga tersebut.
- Jangan mencerminkan konten tersembunyi, privat, atau yang diblokir moderasi dengan melewati filter API publik atau batas autentikasi.

## Autentikasi

- Baca publik: tidak memerlukan token.
- Tulis + akun: `Authorization: Bearer clh_...`.

## Batas laju

Penerapan yang memperhitungkan autentikasi:

- Permintaan anonim: per IP.
- Permintaan terautentikasi (token Bearer yang valid): per bucket pengguna.
- Token yang tidak ada/tidak valid kembali menggunakan penerapan per IP.

- Baca: 3000/menit per IP, 12000/menit per kunci
- Tulis: 300/menit per IP, 3000/menit per kunci
- Unduh: 1200/menit per IP, 6000/menit per kunci

Header: `X-RateLimit-Limit`, `X-RateLimit-Reset`, `RateLimit-Limit`, `RateLimit-Reset`;
`X-RateLimit-Remaining`, `RateLimit-Remaining`, dan `Retry-After` disertakan pada `429`.

Semantik:

- `X-RateLimit-Reset`: detik epoch Unix (waktu reset absolut)
- `RateLimit-Reset`: penundaan dalam detik hingga reset
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: anggaran tersisa yang tepat jika
  tersedia; permintaan ter-shard yang berhasil tidak menyertakannya alih-alih mengembalikan
  nilai global perkiraan
- `Retry-After`: penundaan dalam detik yang harus ditunggu pada `429`

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

- Utamakan `Retry-After` jika tersedia.
- Jika tidak, gunakan `RateLimit-Reset` atau hitung penundaan dari `X-RateLimit-Reset`.
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
  - `sort`: `updated` (bawaan), `recommended` (`default`), `createdAt` (`newest`), `downloads`, `stars` (`rating`), alias instalasi lama `installsCurrent`/`installs`/`installsAllTime` dipetakan ke `downloads`, `trending`
  - Nilai `sort` yang tidak valid mengembalikan `400`
  - `cursor` berlaku untuk pengurutan selain `trending`
  - Filter opsional: `nonSuspiciousOnly=true`
  - Alias lama: `nonSuspicious=true`
  - Dengan `nonSuspiciousOnly=true`, halaman berbasis kursor dapat memuat lebih sedikit dari `limit` item; gunakan `nextCursor` untuk melanjutkan.
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
  - Skills berbasis GitHub saat ini dengan pemindaian `clean` atau `suspicious` mengembalikan
    deskriptor serah terima JSON `public-github`, bukan byte ClawHub.
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
  - Skills yang dihosting diekspor sebagai file yang tersimpan.
  - Skills berbasis GitHub saat ini dengan pemindaian `clean` atau `suspicious` diekspor
    sebagai deskriptor serah terima `public-github`.
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

Memerlukan autentikasi:

- `POST /api/v1/skills` (publikasi, multipart lebih diutamakan)
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
