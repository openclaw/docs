---
read_when:
    - Menambahkan/mengubah titik akhir
    - Men-debug permintaan CLI ↔ registri
summary: Referensi API HTTP (publik + endpoint CLI + autentikasi).
x-i18n:
    generated_at: "2026-05-12T00:57:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c217e56a38d697d8cc6e1c7f0c6481fd762ecbadcf5629964c1f49781d5405b
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP API

URL dasar: `https://clawhub.ai` (default).

Semua path v1 berada di bawah `/api/v1/...`.
Legacy `/api/...` dan `/api/cli/...` tetap ada untuk kompatibilitas (lihat `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## Penggunaan ulang katalog publik

Direktori pihak ketiga dapat menggunakan endpoint baca publik untuk mencantumkan atau mencari Skills ClawHub. Harap cache hasil, hormati `429`/`Retry-After`, tautkan pengguna kembali ke listing ClawHub kanonis (`https://clawhub.ai/<owner>/<slug>`), dan hindari menyiratkan dukungan ClawHub terhadap situs pihak ketiga. Jangan mencoba mencerminkan konten tersembunyi, privat, atau diblokir moderasi di luar permukaan API publik.

Pintasan slug web diselesaikan lintas keluarga registry, tetapi klien API sebaiknya menggunakan
URL kanonis yang dikembalikan oleh endpoint baca alih-alih merekonstruksi presedensi
rute.

## Batas laju

Model penegakan:

- Permintaan anonim: ditegakkan per IP.
- Permintaan terautentikasi (token Bearer valid): ditegakkan per bucket pengguna.
- Jika token hilang/tidak valid, perilaku kembali ke penegakan berbasis IP.
- Endpoint tulis terautentikasi sebaiknya tidak mengembalikan `Unauthorized` polos saat
  server mengetahui alasannya. Token yang hilang, token tidak valid/dicabut, dan
  akun yang dihapus/dilarang/dinonaktifkan masing-masing sebaiknya mendapatkan teks yang dapat ditindaklanjuti agar klien
  CLI dapat memberi tahu pengguna apa yang memblokir mereka.

- Baca: 600/menit per IP, 2400/menit per kunci
- Tulis: 45/menit per IP, 180/menit per kunci
- Unduh: 30/menit per IP, 180/menit per kunci (`/api/v1/download`)

Header:

- Kompatibilitas legacy: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- Distandarkan: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`
- Pada `429`: `Retry-After`

Semantik header:

- `X-RateLimit-Reset`: detik epoch Unix absolut
- `RateLimit-Reset`: detik hingga reset (penundaan)
- `Retry-After`: detik untuk menunggu sebelum mencoba lagi (penundaan) pada `429`

Contoh respons `429`:

```http
HTTP/2 429
content-type: text/plain; charset=utf-8
x-ratelimit-limit: 20
x-ratelimit-remaining: 0
x-ratelimit-reset: 1771404540
ratelimit-limit: 20
ratelimit-remaining: 0
ratelimit-reset: 34
retry-after: 34

Rate limit exceeded
```

Panduan klien:

- Jika `Retry-After` ada, tunggu sejumlah detik tersebut sebelum mencoba lagi.
- Gunakan backoff dengan jitter untuk menghindari percobaan ulang tersinkronisasi.
- Jika `Retry-After` tidak ada, fallback ke `RateLimit-Reset` (atau hitung dari `X-RateLimit-Reset`).

Sumber IP:

- Menggunakan `cf-connecting-ip` (Cloudflare) untuk IP klien secara default.
- ClawHub menggunakan header penerusan tepercaya untuk mengidentifikasi IP klien di edge.
- Jika tidak ada IP klien tepercaya yang tersedia, permintaan unduhan anonim menggunakan bucket fallback yang dicakup per endpoint alih-alih satu bucket global `ip:unknown`. Permintaan baca/tulis anonim tetap menggunakan bucket unknown bersama agar routing tanpa IP tetap terlihat dan konservatif.

## Endpoint publik (tanpa autentikasi)

### `GET /api/v1/search`

Parameter kueri:

- `q` (wajib): string kueri
- `limit` (opsional): bilangan bulat
- `highlightedOnly` (opsional): `true` untuk memfilter ke Skills yang disorot
- `nonSuspiciousOnly` (opsional): `true` untuk menyembunyikan Skills mencurigakan (`flagged.suspicious`)
- `nonSuspicious` (opsional): alias legacy untuk `nonSuspiciousOnly`

Respons:

```json
{
  "results": [
    {
      "score": 0.123,
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "summary": "…",
      "version": "1.2.3",
      "updatedAt": 1730000000000
    }
  ]
}
```

Catatan:

- Hasil dikembalikan dalam urutan relevansi (kemiripan embedding + peningkatan token slug/nama persis + prior popularitas dari unduhan).
- Relevansi lebih kuat daripada popularitas. Kecocokan token slug atau nama tampilan yang presisi dapat mengungguli kecocokan yang lebih longgar dengan unduhan jauh lebih banyak.
- Teks ASCII ditokenisasi pada batas kata dan tanda baca. Misalnya, `personal-map` berisi token `map` mandiri, sedangkan `amap-jsapi-skill` berisi `amap`, `jsapi`, dan `skill`; karena itu pencarian `map` memberi `personal-map` kecocokan leksikal yang lebih kuat daripada `amap-jsapi-skill`.
- Unduhan digunakan sebagai prior kecil berskala log dan pemecah seri, bukan sebagai sinyal peringkat utama. Skills dengan unduhan tinggi dapat berperingkat lebih rendah saat teks kueri memiliki kecocokan yang lebih lemah.
- Status moderasi mencurigakan atau tersembunyi dapat menghapus Skills dari pencarian publik bergantung pada filter pemanggil dan status moderasi saat ini.

Panduan keterlihatan publisher:

- Letakkan istilah yang benar-benar akan dicari pengguna di nama tampilan, ringkasan, dan tag. Gunakan token slug mandiri hanya saat itu juga merupakan identitas stabil yang ingin Anda pertahankan.
- Jangan mengganti nama slug hanya untuk mengejar satu kueri kecuali slug baru adalah nama kanonis jangka panjang yang lebih baik. Slug lama menjadi alias pengalihan, tetapi URL kanonis, slug yang ditampilkan, dan digest pencarian masa depan menggunakan slug baru.
- Alias penggantian nama mempertahankan resolusi untuk URL lama dan instalasi yang diselesaikan melalui registry, tetapi peringkat pencarian didasarkan pada metadata Skills kanonis setelah penggantian nama diindeks. Statistik yang ada tetap bersama Skills tersebut.
- Jika Skills tiba-tiba tidak terlihat, periksa status moderasi terlebih dahulu dengan `clawhub inspect <slug>` saat sudah login sebelum mengubah metadata terkait peringkat.

### `GET /api/v1/skills`

Parameter kueri:

- `limit` (opsional): bilangan bulat (1–200)
- `cursor` (opsional): kursor paginasi untuk semua pengurutan non-`trending`
- `sort` (opsional): `updated` (default), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), `installsCurrent` (alias: `installs`), `installsAllTime`, `trending`
- `nonSuspiciousOnly` (opsional): `true` untuk menyembunyikan Skills mencurigakan (`flagged.suspicious`)
- `nonSuspicious` (opsional): alias legacy untuk `nonSuspiciousOnly`

Catatan:

- `trending` memberi peringkat berdasarkan instalasi dalam 7 hari terakhir (berbasis telemetri).
- `createdAt` stabil untuk crawl Skills baru; `updated` berubah saat Skills yang sudah ada dipublikasikan ulang.
- Saat `nonSuspiciousOnly=true`, pengurutan berbasis kursor dapat mengembalikan lebih sedikit dari `limit` item pada satu halaman karena Skills mencurigakan difilter setelah pengambilan halaman.
- Gunakan `nextCursor` untuk melanjutkan paginasi saat ada. Halaman pendek tidak dengan sendirinya berarti akhir hasil.

Respons:

```json
{
  "items": [
    {
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "summary": "…",
      "tags": { "latest": "1.2.3" },
      "stats": {},
      "createdAt": 0,
      "updatedAt": 0,
      "latestVersion": { "version": "1.2.3", "createdAt": 0, "changelog": "…" },
      "metadata": { "os": ["macos"], "systems": ["aarch64-darwin"] }
    }
  ],
  "nextCursor": null
}
```

### `GET /api/v1/skills/{slug}`

Respons:

```json
{
  "skill": {
    "slug": "gifgrep",
    "displayName": "GifGrep",
    "summary": "…",
    "tags": { "latest": "1.2.3" },
    "stats": {},
    "createdAt": 0,
    "updatedAt": 0
  },
  "latestVersion": { "version": "1.2.3", "createdAt": 0, "changelog": "…" },
  "metadata": { "os": ["macos"], "systems": ["aarch64-darwin"] },
  "owner": { "handle": "steipete", "displayName": "Peter", "image": null },
  "moderation": {
    "isSuspicious": false,
    "isMalwareBlocked": false,
    "verdict": "clean",
    "reasonCodes": [],
    "summary": null,
    "engineVersion": "v2.0.0",
    "updatedAt": 0
  }
}
```

Catatan:

- Slug lama yang dibuat oleh alur penggantian nama/penggabungan owner diselesaikan ke Skills kanonis.
- `metadata.os`: batasan OS yang dideklarasikan di frontmatter Skills (mis. `["macos"]`, `["linux"]`). `null` jika tidak dideklarasikan.
- `metadata.systems`: target sistem Nix (mis. `["aarch64-darwin", "x86_64-linux"]`). `null` jika tidak dideklarasikan.
- `metadata` adalah `null` jika Skills tidak memiliki metadata platform.
- `moderation` disertakan hanya saat Skills ditandai atau owner sedang melihatnya.

### `GET /api/v1/skills/{slug}/moderation`

Mengembalikan status moderasi terstruktur.

Respons:

```json
{
  "moderation": {
    "isSuspicious": true,
    "isMalwareBlocked": false,
    "verdict": "suspicious",
    "reasonCodes": ["suspicious.dynamic_code_execution"],
    "summary": "Detected: suspicious.dynamic_code_execution",
    "engineVersion": "v2.0.0",
    "updatedAt": 0,
    "legacyReason": null,
    "evidence": [
      {
        "code": "suspicious.dynamic_code_execution",
        "severity": "critical",
        "file": "index.ts",
        "line": 3,
        "message": "Dynamic code execution detected.",
        "evidence": ""
      }
    ]
  }
}
```

Catatan:

- Owner dan moderator dapat mengakses detail moderasi untuk Skills tersembunyi.
- Pemanggil publik hanya mendapatkan `200` untuk Skills terlihat yang sudah ditandai.
- Bukti disamarkan untuk pemanggil publik dan hanya menyertakan cuplikan mentah untuk owner/moderator.

### `POST /api/v1/skills/{slug}/report`

Laporkan Skills untuk ditinjau moderator. Laporan berada pada tingkat Skills, dapat ditautkan secara opsional
ke suatu versi, dan masuk ke antrean laporan Skills.

Autentikasi:

- Memerlukan token API.

Permintaan:

```json
{ "reason": "Suspicious install step", "version": "1.2.3" }
```

Respons:

```json
{
  "ok": true,
  "reported": true,
  "alreadyReported": false,
  "reportId": "skillReports:...",
  "skillId": "skills:...",
  "reportCount": 1
}
```

### `GET /api/v1/skills/-/reports`

Endpoint moderator/admin untuk penerimaan laporan Skills.

Parameter kueri:

- `status` (opsional): `open` (default), `confirmed`, `dismissed`, atau `all`
- `limit` (opsional): bilangan bulat (1-200)
- `cursor` (opsional): kursor paginasi

Respons:

```json
{
  "items": [
    {
      "reportId": "skillReports:...",
      "skillId": "skills:...",
      "skillVersionId": "skillVersions:...",
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "version": "1.2.3",
      "reason": "Suspicious install step",
      "status": "open",
      "createdAt": 1730000000000,
      "reporter": {
        "userId": "users:...",
        "handle": "reporter",
        "displayName": "Reporter"
      },
      "triagedAt": null,
      "triagedBy": null,
      "triageNote": null
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `POST /api/v1/skills/-/reports/{reportId}/triage`

Endpoint moderator/admin untuk menyelesaikan atau membuka kembali laporan Skills.

Permintaan:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` wajib untuk `confirmed` dan `dismissed`; ini dapat dihilangkan saat
mengatur `status` kembali ke `open`. Berikan `finalAction: "hide"` dengan laporan yang sudah ditriage
untuk menyembunyikan Skills dalam alur kerja yang sama dan dapat diaudit.

### `GET /api/v1/skills/{slug}/versions`

Parameter kueri:

- `limit` (opsional): bilangan bulat
- `cursor` (opsional): kursor paginasi

### `GET /api/v1/skills/{slug}/versions/{version}`

Mengembalikan metadata versi + daftar file.

- `version.security` menyertakan status verifikasi pemindaian yang dinormalisasi dan detail pemindai
  (VirusTotal + LLM), saat tersedia.

### `GET /api/v1/skills/{slug}/scan`

Mengembalikan detail verifikasi pemindaian keamanan untuk versi Skills.

Parameter kueri:

- `version` (opsional): string versi tertentu.
- `tag` (opsional): menyelesaikan versi bertag (misalnya `latest`).

Catatan:

- Jika `version` maupun `tag` tidak diberikan, menggunakan versi terbaru.
- Menyertakan status verifikasi yang dinormalisasi beserta detail khusus pemindai.
- `security.capabilityTags` menyertakan label kapabilitas/risiko deterministik seperti
  `crypto`, `requires-wallet`, `can-make-purchases`, `can-sign-transactions`,
  `requires-oauth-token`, dan `posts-externally` saat terdeteksi.
- `security.hasScanResult` adalah `true` hanya saat pemindai menghasilkan vonis definitif (`clean`, `suspicious`, atau `malicious`).
- `moderation` adalah snapshot moderasi tingkat Skills saat ini yang diturunkan dari versi terbaru.
- Saat mengkueri versi historis, periksa `moderation.matchesRequestedVersion` dan `moderation.sourceVersion` sebelum memperlakukan `moderation` dan `security` sebagai konteks versi yang sama.

### `GET /api/v1/skills/{slug}/file`

Mengembalikan konten teks mentah.

Parameter kueri:

- `path` (wajib)
- `version` (opsional)
- `tag` (opsional)

Catatan:

- Default ke versi terbaru.
- Batas ukuran file: 200KB.

### `GET /api/v1/packages`

Endpoint katalog terpadu untuk:

- skills
- Plugin kode
- Plugin bundle

Parameter kueri:

- `limit` (opsional): integer (1–100)
- `cursor` (opsional): kursor paginasi
- `family` (opsional): `skill`, `code-plugin`, atau `bundle-plugin`
- `channel` (opsional): `official`, `community`, atau `private`
- `isOfficial` (opsional): `true` atau `false`
- `executesCode` (opsional): `true` atau `false`
- `capabilityTag` (opsional): filter kemampuan untuk paket Plugin
- `target` / `hostTarget` (opsional): singkatan untuk `host:<target>`
- `os`, `arch`, `libc` (opsional): singkatan untuk filter kemampuan host
- `requiresBrowser`, `requiresDesktop`, `requiresNativeDeps`,
  `requiresExternalService`, `requiresBinary`, `requiresOsPermission`
  (opsional): singkatan `true`/`1` untuk tag persyaratan lingkungan
- `externalService`, `binary`, `osPermission` (opsional): singkatan untuk tag
  persyaratan lingkungan bernama
- `artifactKind` (opsional): `legacy-zip` atau `npm-pack`
- `npmMirror` (opsional): `true`/`1` untuk menampilkan versi paket yang didukung
  ClawPack yang tersedia melalui mirror npm

Catatan:

- `GET /api/v1/code-plugins` dan `GET /api/v1/bundle-plugins` tetap menjadi alias family tetap.
- Entri Skills tetap didukung oleh registry skill dan masih hanya dapat dipublikasikan melalui `POST /api/v1/skills`.
- `POST /api/v1/packages` masih hanya untuk rilis code-plugin dan bundle-plugin.
- Pemanggil anonim hanya melihat channel paket publik.
- Pemanggil yang terautentikasi dapat melihat paket privat untuk penerbit tempat mereka menjadi anggota dalam hasil daftar/pencarian.
- `channel=private` hanya mengembalikan paket yang dapat dibaca oleh pemanggil yang terautentikasi.

### `GET /api/v1/packages/search`

Pencarian katalog terpadu di seluruh skills + paket Plugin.

Parameter kueri:

- `q` (wajib): string kueri
- `limit` (opsional): integer (1–100)
- `family` (opsional): `skill`, `code-plugin`, atau `bundle-plugin`
- `channel` (opsional): `official`, `community`, atau `private`
- `isOfficial` (opsional): `true` atau `false`
- `executesCode` (opsional): `true` atau `false`
- `capabilityTag` (opsional): filter kemampuan untuk paket Plugin
- `target` / `hostTarget`, `os`, `arch`, `libc`, `requiresBrowser`,
  `requiresDesktop`, `requiresNativeDeps`, `requiresExternalService`,
  `requiresBinary`, `requiresOsPermission`, `externalService`, `binary`, dan
  `osPermission` diterima sebagai singkatan untuk tag kemampuan umum
- `artifactKind` (opsional): `legacy-zip` atau `npm-pack`
- `npmMirror` (opsional): `true`/`1` untuk mencari versi paket yang didukung
  ClawPack yang tersedia melalui mirror npm

Catatan:

- Pemanggil anonim hanya melihat channel paket publik.
- Pemanggil yang terautentikasi dapat mencari paket privat untuk penerbit tempat mereka menjadi anggota.
- `channel=private` hanya mengembalikan paket yang dapat dibaca oleh pemanggil yang terautentikasi.
- Filter artefak didukung oleh tag kemampuan terindeks:
  `artifact:legacy-zip`, `artifact:npm-pack`, dan `npm-mirror:available`.

### `GET /api/v1/packages/{name}`

Mengembalikan metadata detail paket.

Catatan:

- Skills juga dapat diselesaikan melalui rute ini dalam katalog terpadu.
- Paket privat mengembalikan `404` kecuali pemanggil dapat membaca penerbit pemiliknya.

### `DELETE /api/v1/packages/{name}`

Menghapus lunak paket dan semua rilis.

Catatan:

- Memerlukan token API untuk pemilik paket, pemilik/admin penerbit organisasi,
  moderator platform, atau admin platform.

### `GET /api/v1/packages/{name}/versions`

Mengembalikan riwayat versi.

Parameter kueri:

- `limit` (opsional): integer (1–100)
- `cursor` (opsional): kursor paginasi

Catatan:

- Paket privat mengembalikan `404` kecuali pemanggil dapat membaca penerbit pemiliknya.

### `GET /api/v1/packages/{name}/versions/{version}`

Mengembalikan satu versi paket, termasuk metadata file, kompatibilitas,
kemampuan, verifikasi, metadata artefak, dan data pemindaian.

Catatan:

- `version.artifact.kind` adalah `legacy-zip` untuk arsip paket dunia lama atau
  `npm-pack` untuk rilis yang didukung ClawPack.
- Rilis ClawPack menyertakan field `npmIntegrity`, `npmShasum`, dan
  `npmTarballName` yang kompatibel dengan npm.
- `version.sha256hash`, `version.vtAnalysis`, `version.llmAnalysis`, dan `version.staticScan` disertakan ketika data pemindaian ada.
- Paket privat mengembalikan `404` kecuali pemanggil dapat membaca penerbit pemiliknya.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Mengembalikan metadata resolver artefak eksplisit untuk versi paket.

Catatan:

- Versi paket lama mengembalikan artefak `legacy-zip` dan `downloadUrl` ZIP lama.
- Versi ClawPack mengembalikan artefak `npm-pack`, field integritas npm,
  `tarballUrl`, dan URL kompatibilitas ZIP lama.
- Ini adalah permukaan resolver OpenClaw; ini menghindari tebakan format arsip dari
  URL bersama.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Mengunduh artefak versi melalui jalur resolver eksplisit.

Catatan:

- Versi ClawPack mengalirkan byte `.tgz` npm-pack yang persis diunggah.
- Versi ZIP lama dialihkan ke `/api/v1/packages/{name}/download?version=`.
- Menggunakan bucket laju unduhan.

### `GET /api/v1/packages/{name}/readiness`

Mengembalikan kesiapan terhitung untuk konsumsi OpenClaw mendatang.

Pemeriksaan kesiapan mencakup:

- status channel resmi
- ketersediaan versi terbaru
- ketersediaan artefak npm-pack ClawPack
- digest artefak
- asal repo sumber dan commit
- metadata kompatibilitas OpenClaw
- target host
- status pemindaian

Respons:

```json
{
  "package": {
    "name": "@openclaw/example-plugin",
    "displayName": "Example Plugin",
    "family": "code-plugin",
    "isOfficial": true,
    "latestVersion": "1.2.3"
  },
  "ready": false,
  "checks": [
    {
      "id": "clawpack",
      "label": "ClawPack artifact",
      "status": "fail",
      "message": "Latest version is legacy ZIP-only."
    }
  ],
  "blockers": ["clawpack"]
}
```

### `GET /api/v1/packages/migrations`

Endpoint moderator untuk mencantumkan baris migrasi Plugin resmi OpenClaw.

Autentikasi:

- Memerlukan token API untuk pengguna moderator atau admin.

Parameter kueri:

- `phase` (opsional): `planned`, `published`, `clawpack-ready`,
  `legacy-zip-only`, `metadata-ready`, `blocked`, `ready-for-openclaw`, atau
  `all` (default).
- `limit` (opsional): integer (1-100)
- `cursor` (opsional): kursor paginasi

Respons:

```json
{
  "items": [
    {
      "migrationId": "officialPluginMigrations:...",
      "bundledPluginId": "core.search",
      "packageName": "@openclaw/search-plugin",
      "packageId": "packages:...",
      "owner": "platform",
      "sourceRepo": "openclaw/openclaw",
      "sourcePath": "plugins/search",
      "sourceCommit": "abc123",
      "phase": "blocked",
      "blockers": ["missing ClawPack"],
      "hostTargetsComplete": true,
      "scanClean": false,
      "moderationApproved": false,
      "runtimeBundlesReady": false,
      "notes": null,
      "createdAt": 1760000000000,
      "updatedAt": 1760000000000
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `POST /api/v1/packages/migrations`

Endpoint admin untuk membuat atau memperbarui baris migrasi Plugin resmi.

Autentikasi:

- Memerlukan token API untuk pengguna admin.

Isi permintaan:

```json
{
  "bundledPluginId": "core.search",
  "packageName": "@openclaw/search-plugin",
  "owner": "platform",
  "sourceRepo": "openclaw/openclaw",
  "sourcePath": "plugins/search",
  "sourceCommit": "abc123",
  "phase": "blocked",
  "blockers": ["missing ClawPack"],
  "hostTargetsComplete": true,
  "scanClean": false,
  "moderationApproved": false,
  "runtimeBundlesReady": false,
  "notes": "waiting on publisher upload"
}
```

Catatan:

- `bundledPluginId` dinormalisasi menjadi huruf kecil dan merupakan kunci upsert stabil.
- `packageName` dinormalisasi sebagai nama npm; paket dapat tidak ada untuk migrasi
  yang direncanakan.
- Ini hanya melacak kesiapan migrasi. Ini tidak mengubah OpenClaw atau menghasilkan
  ClawPack.

### `GET /api/v1/packages/moderation/queue`

Endpoint moderator/admin untuk antrean peninjauan rilis paket.

Autentikasi:

- Memerlukan token API untuk pengguna moderator atau admin.

Parameter kueri:

- `status` (opsional): `open` (default), `blocked`, `manual`, atau `all`
- `limit` (opsional): integer (1-100)
- `cursor` (opsional): kursor paginasi

Makna status:

- `open`: rilis yang mencurigakan, berbahaya, tertunda, dikarantina, dicabut, atau dilaporkan.
- `blocked`: rilis yang dikarantina, dicabut, atau berbahaya.
- `manual`: rilis apa pun dengan override moderasi manual.
- `all`: rilis apa pun dengan override manual, status pemindaian tidak bersih, atau laporan paket.

Respons:

```json
{
  "items": [
    {
      "packageId": "packages:...",
      "releaseId": "packageReleases:...",
      "name": "@openclaw/example-plugin",
      "displayName": "Example Plugin",
      "family": "code-plugin",
      "channel": "community",
      "isOfficial": false,
      "version": "1.2.3",
      "createdAt": 1730000000000,
      "artifactKind": "npm-pack",
      "scanStatus": "malicious",
      "moderationState": "quarantined",
      "moderationReason": "manual review",
      "sourceRepo": "openclaw/example-plugin",
      "sourceCommit": "abc123",
      "reportCount": 2,
      "lastReportedAt": 1730000001000,
      "reasons": ["manual:quarantined", "scan:malicious", "reports:2"]
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `POST /api/v1/packages/{name}/report`

Melaporkan paket untuk peninjauan moderator. Laporan berada di tingkat paket, secara opsional
ditautkan ke versi. Laporan ini memberi masukan ke antrean moderasi tetapi tidak otomatis menyembunyikan atau
memblokir unduhan dengan sendirinya; moderator harus menggunakan moderasi rilis untuk
menyetujui, mengarantina, atau mencabut artefak.

Autentikasi:

- Memerlukan token API.

Permintaan:

```json
{ "reason": "Suspicious native binary", "version": "1.2.3" }
```

Respons:

```json
{
  "ok": true,
  "reported": true,
  "alreadyReported": false,
  "packageId": "packages:...",
  "releaseId": "packageReleases:...",
  "reportCount": 1
}
```

### `GET /api/v1/packages/reports`

Endpoint moderator/admin untuk penerimaan laporan paket.

Autentikasi:

- Memerlukan token API untuk pengguna moderator atau admin.

Parameter kueri:

- `status` (opsional): `open` (default), `confirmed`, `dismissed`, atau `all`
- `limit` (opsional): integer (1-100)
- `cursor` (opsional): kursor paginasi

Respons:

```json
{
  "items": [
    {
      "reportId": "packageReports:...",
      "packageId": "packages:...",
      "releaseId": "packageReleases:...",
      "name": "@openclaw/example-plugin",
      "displayName": "Example Plugin",
      "family": "code-plugin",
      "version": "1.2.3",
      "reason": "Suspicious native binary",
      "status": "open",
      "createdAt": 1730000000000,
      "reporter": {
        "userId": "users:...",
        "handle": "reporter",
        "displayName": "Reporter"
      },
      "triagedAt": null,
      "triagedBy": null,
      "triageNote": null
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `GET /api/v1/packages/{name}/moderation`

Endpoint pemilik/moderator untuk visibilitas moderasi paket.

Autentikasi:

- Memerlukan token API untuk pemilik paket, anggota penerbit, moderator, atau
  pengguna admin.

Respons:

```json
{
  "package": {
    "packageId": "packages:...",
    "name": "@openclaw/example-plugin",
    "displayName": "Example Plugin",
    "family": "code-plugin",
    "channel": "community",
    "isOfficial": false,
    "reportCount": 2,
    "lastReportedAt": 1730000001000,
    "scanStatus": "malicious"
  },
  "latestRelease": {
    "releaseId": "packageReleases:...",
    "version": "1.2.3",
    "artifactKind": "npm-pack",
    "scanStatus": "malicious",
    "moderationState": "quarantined",
    "moderationReason": "manual review",
    "blockedFromDownload": true,
    "reasons": ["manual:quarantined", "scan:malicious", "reports:2"],
    "createdAt": 1730000000000
  }
}
```

### `POST /api/v1/packages/reports/{reportId}/triage`

Endpoint moderator/admin untuk menyelesaikan atau membuka kembali laporan paket.

Permintaan:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note` wajib untuk `confirmed` dan `dismissed`; dapat dihilangkan saat
mengatur `status` kembali ke `open`. Sertakan `finalAction: "quarantine"` atau
`finalAction: "revoke"` dengan laporan yang dikonfirmasi untuk menerapkan moderasi rilis dalam
alur kerja yang sama dan dapat diaudit.

Respons:

```json
{
  "ok": true,
  "reportId": "packageReports:...",
  "packageId": "packages:...",
  "status": "confirmed",
  "reportCount": 0
}
```

### `POST /api/v1/packages/{name}/versions/{version}/moderation`

Endpoint moderator/admin untuk peninjauan rilis paket.

Permintaan:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

Status yang didukung:

- `approved`: ditinjau secara manual dan diizinkan.
- `quarantined`: diblokir sambil menunggu tindak lanjut.
- `revoked`: diblokir setelah rilis sebelumnya dipercaya.

Rilis yang dikarantina dan dicabut mengembalikan `403` dari rute unduhan artefak.
Setiap perubahan menulis entri log audit.

### `POST /api/v1/packages/backfill/artifacts`

Endpoint pemeliharaan khusus admin untuk memberi label rilis paket lama dengan
metadata jenis artefak eksplisit.

Isi permintaan:

```json
{
  "cursor": null,
  "batchSize": 100,
  "dryRun": true
}
```

Respons:

```json
{
  "ok": true,
  "scanned": 100,
  "updated": 12,
  "nextCursor": "cursor...",
  "done": false,
  "dryRun": true
}
```

Catatan:

- Default ke dry-run.
- Rilis tanpa penyimpanan ClawPack diberi label `legacy-zip`.
- Baris berbasis ClawPack yang sudah ada tetapi tidak memiliki `artifactKind` diperbaiki sebagai
  `npm-pack`.
- Ini tidak menghasilkan ClawPack atau mengubah byte artefak.

### `GET /api/v1/packages/{name}/file`

Mengembalikan konten teks mentah untuk file paket.

Parameter kueri:

- `path` (wajib)
- `version` (opsional)
- `tag` (opsional)

Catatan:

- Default ke rilis terbaru.
- Menggunakan bucket laju baca, bukan bucket unduhan.
- File biner mengembalikan `415`.
- Batas ukuran file: 200KB.
- Pemindaian VirusTotal yang tertunda tidak memblokir pembacaan; rilis berbahaya masih dapat ditahan di tempat lain.
- Paket privat mengembalikan `404` kecuali pemanggil dapat membaca publisher pemilik.

### `GET /api/v1/packages/{name}/download`

Mengunduh arsip ZIP deterministik lama untuk rilis paket.

Parameter kueri:

- `version` (opsional)
- `tag` (opsional)

Catatan:

- Default ke rilis terbaru.
- Skills dialihkan ke `GET /api/v1/download`.
- Arsip Plugin/paket adalah file zip dengan root `package/` agar klien OpenClaw lama
  tetap berfungsi.
- Rute ini tetap hanya ZIP. Rute ini tidak mengalirkan file ClawPack `.tgz`.
- Respons menyertakan header `ETag`, `Digest`, `X-ClawHub-Artifact-Type`, dan
  `X-ClawHub-Artifact-Sha256` untuk pemeriksaan integritas resolver.
- Metadata khusus registry tidak disuntikkan ke arsip yang diunduh.
- Pemindaian VirusTotal yang tertunda tidak memblokir unduhan; rilis berbahaya mengembalikan `403`.
- Paket privat mengembalikan `404` kecuali pemanggil adalah pemilik.

### `GET /api/npm/{package}`

Mengembalikan packument yang kompatibel dengan npm untuk versi paket berbasis ClawPack.

Catatan:

- Hanya versi dengan tarball npm-pack ClawPack yang diunggah yang dicantumkan.
- Versi lama yang hanya ZIP sengaja dihilangkan.
- `dist.tarball`, `dist.integrity`, dan `dist.shasum` menggunakan field yang kompatibel dengan npm
  sehingga pengguna dapat mengarahkan npm ke mirror jika mereka memilih.
- Packument paket scoped mendukung jalur permintaan `/api/npm/@scope/name` dan jalur permintaan
  terenkode npm `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Mengalirkan byte tarball ClawPack persis seperti yang diunggah untuk klien mirror npm.

Catatan:

- Menggunakan bucket laju unduhan.
- Header unduhan menyertakan SHA-256 ClawHub plus metadata integritas/shasum npm.
- Pemeriksaan moderasi dan akses paket privat tetap berlaku.

### `GET /api/v1/resolve`

Digunakan oleh CLI untuk memetakan fingerprint lokal ke versi yang dikenal.

Parameter kueri:

- `slug` (wajib)
- `hash` (wajib): sha256 hex 64 karakter dari fingerprint bundel

Respons:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Mengunduh zip dari versi skill.

Parameter kueri:

- `slug` (wajib)
- `version` (opsional): string semver
- `tag` (opsional): nama tag (mis. `latest`)

Catatan:

- Jika `version` maupun `tag` tidak disediakan, versi terbaru digunakan.
- Versi yang dihapus sementara mengembalikan `410`.
- Statistik unduhan dihitung sebagai identitas unik per jam (`userId` saat token API valid, jika tidak IP).

## Endpoint autentikasi (token Bearer)

Semua endpoint memerlukan:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

Memvalidasi token dan mengembalikan handle pengguna.

### `POST /api/v1/skills`

Menerbitkan versi baru.

- Disarankan: `multipart/form-data` dengan JSON `payload` + blob `files[]`.
- Isi JSON dengan `files` (berbasis storageId) juga diterima.
- Field payload opsional: `ownerHandle`. Jika ada, API menyelesaikan
  publisher tersebut di sisi server dan mengharuskan aktor memiliki akses publisher.
- Field payload opsional: `migrateOwner`. Jika `true` dengan `ownerHandle`, sebuah
  skill yang sudah ada dapat dipindahkan ke pemilik tersebut jika aktor adalah admin/pemilik pada publisher
  saat ini dan target. Tanpa opt-in ini, perubahan pemilik
  ditolak.

### `POST /api/v1/packages`

Menerbitkan rilis code-plugin atau bundle-plugin.

- Memerlukan autentikasi token Bearer.
- Disarankan: `multipart/form-data` dengan JSON `payload` + blob `files[]`.
- Isi JSON dengan `files` (berbasis storageId) juga diterima.
- Field payload opsional: `ownerHandle`. Jika ada, hanya admin yang dapat menerbitkan atas nama pemilik tersebut.

Sorotan validasi:

- `family` harus berupa `code-plugin` atau `bundle-plugin`.
- Paket Plugin memerlukan `openclaw.plugin.json`. Unggahan ClawPack `.tgz` harus
  memuatnya di `package/openclaw.plugin.json`.
- Code plugin memerlukan `package.json`, metadata repo sumber, metadata commit
  sumber, metadata skema config, `openclaw.compat.pluginApi`, dan
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` dan `openclaw.environment` adalah metadata opsional.
- Hanya publisher tepercaya yang dapat menerbitkan ke channel `official`.
- Penerbitan atas nama pihak lain tetap memvalidasi kelayakan channel resmi terhadap akun pemilik target.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Menghapus sementara / memulihkan skill (pemilik, moderator, atau admin).

Isi JSON opsional:

```json
{ "reason": "Held for moderation pending legal review." }
```

Jika ada, `reason` disimpan sebagai catatan moderasi skill dan disalin ke log audit.
Penghapusan sementara yang dimulai pemilik mencadangkan slug selama 30 hari, lalu slug dapat diklaim oleh
publisher lain. Respons penghapusan menyertakan `slugReservedUntil` saat kedaluwarsa ini berlaku.
Penyembunyian oleh moderator/admin dan penghapusan keamanan tidak kedaluwarsa dengan cara ini.

Respons penghapusan:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

Kode status:

- `200`: ok
- `401`: tidak terotorisasi
- `403`: dilarang
- `404`: skill/pengguna tidak ditemukan
- `500`: kesalahan server internal

### `POST /api/v1/users/publisher`

Khusus admin. Memastikan publisher organisasi ada untuk sebuah handle. Jika handle masih mengarah ke
publisher pengguna/personal bersama lama, endpoint memigrasikannya ke publisher organisasi terlebih dahulu.

- Isi: `{ "handle": "openclaw", "displayName": "OpenClaw", "trusted": true }`
- Respons: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true }`

### `POST /api/v1/users/reserve`

Khusus admin. Mencadangkan slug root dan nama paket untuk pemilik yang berhak tanpa menerbitkan
rilis. Nama paket menjadi paket placeholder privat tanpa baris rilis, sehingga pemilik yang sama
nantinya dapat menerbitkan rilis code-plugin atau bundle-plugin nyata ke nama tersebut.

- Isi: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Respons: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### Endpoint pengelolaan slug pemilik

- `POST /api/v1/skills/{slug}/rename`
  - Isi: `{ "newSlug": "new-canonical-slug" }`
  - Respons: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - Isi: `{ "targetSlug": "canonical-target-slug" }`
  - Respons: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

Catatan:

- Kedua endpoint memerlukan autentikasi token API dan hanya berfungsi untuk pemilik skill.
- `rename` mempertahankan slug sebelumnya sebagai alias pengalihan.
- `merge` menyembunyikan listing sumber dan mengalihkan slug sumber ke listing target.

### Endpoint transfer kepemilikan

- `POST /api/v1/skills/{slug}/transfer`
  - Isi: `{ "toUserHandle": "target_handle", "message": "optional" }`
  - Respons: `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - Respons (accept/reject/cancel): `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - Bentuk respons: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

Memblokir pengguna dan menghapus permanen skill yang dimiliki (khusus moderator/admin).

Isi:

```json
{ "handle": "user_handle", "reason": "optional ban reason" }
```

atau

```json
{ "userId": "users_...", "reason": "optional ban reason" }
```

Respons:

```json
{ "ok": true, "alreadyBanned": false, "deletedSkills": 3 }
```

### `POST /api/v1/users/unban`

Membatalkan blokir pengguna dan memulihkan skill yang memenuhi syarat (khusus admin).

Isi:

```json
{ "handle": "user_handle", "reason": "optional unban reason" }
```

atau

```json
{ "userId": "users_...", "reason": "optional unban reason" }
```

Respons:

```json
{ "ok": true, "alreadyUnbanned": false, "restoredSkills": 3 }
```

### `POST /api/v1/users/role`

Mengubah peran pengguna (khusus admin).

Isi:

```json
{ "handle": "user_handle", "role": "moderator" }
```

atau

```json
{ "userId": "users_...", "role": "admin" }
```

Respons:

```json
{ "ok": true, "role": "moderator" }
```

### `GET /api/v1/users`

Mencantumkan atau mencari pengguna (khusus admin).

Parameter kueri:

- `q` (opsional): kueri pencarian
- `query` (opsional): alias untuk `q`
- `limit` (opsional): hasil maksimum (default 20, maks 200)

Respons:

```json
{
  "items": [
    {
      "userId": "users_...",
      "handle": "user_handle",
      "displayName": "User",
      "name": "User",
      "role": "moderator"
    }
  ],
  "total": 1
}
```

### `POST /api/v1/stars/{slug}` / `DELETE /api/v1/stars/{slug}`

Menambahkan/menghapus bintang (sorotan). Kedua endpoint bersifat idempoten.

Respons:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## Endpoint CLI lama (usang)

Masih didukung untuk versi CLI lama:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/sync`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

Lihat `DEPRECATIONS.md` untuk rencana penghapusan.

## Penemuan registry (`/.well-known/clawhub.json`)

CLI dapat menemukan pengaturan registry/autentikasi dari situs:

- `/.well-known/clawhub.json` (JSON, disarankan)
- `/.well-known/clawdhub.json` (lama)

Skema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Jika Anda melakukan self-host, sajikan file ini (atau atur `CLAWHUB_REGISTRY` secara eksplisit; `CLAWDHUB_REGISTRY` lama).
