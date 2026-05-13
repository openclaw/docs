---
read_when:
    - Menambahkan/mengubah titik akhir
    - Men-debug permintaan CLI ↔ registri
summary: Referensi API HTTP (endpoint publik + CLI + autentikasi).
x-i18n:
    generated_at: "2026-05-13T05:32:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1ea3f398107dd3a59fd870a3320ff8d76863a0b7995904e0e61b48d59f35a7d4
    source_path: clawhub/http-api.md
    workflow: 16
---

# API HTTP

URL dasar: `https://clawhub.ai` (default).

Semua path v1 berada di bawah `/api/v1/...`.
Legacy `/api/...` dan `/api/cli/...` tetap ada untuk kompatibilitas (lihat `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## Penggunaan ulang katalog publik

Direktori pihak ketiga dapat menggunakan endpoint baca publik untuk mencantumkan atau mencari Skills ClawHub. Harap cache hasil, patuhi `429`/`Retry-After`, tautkan pengguna kembali ke daftar ClawHub kanonis (`https://clawhub.ai/<owner>/<slug>`), dan hindari menyiratkan dukungan ClawHub terhadap situs pihak ketiga. Jangan mencoba mencerminkan konten tersembunyi, privat, atau diblokir moderasi di luar permukaan API publik.

Pintasan slug web diselesaikan lintas keluarga registry, tetapi klien API sebaiknya menggunakan
URL kanonis yang dikembalikan oleh endpoint baca, bukan merekonstruksi prioritas
rute.

## Batas laju

Model penegakan:

- Permintaan anonim: ditegakkan per IP.
- Permintaan terautentikasi (token Bearer valid): ditegakkan per bucket pengguna.
- Jika token hilang/tidak valid, perilaku kembali ke penegakan IP.
- Endpoint tulis terautentikasi sebaiknya tidak mengembalikan `Unauthorized` polos ketika
  server mengetahui alasannya. Token yang hilang, token yang tidak valid/dicabut, dan
  akun yang dihapus/diblokir/dinonaktifkan masing-masing harus mendapatkan teks yang dapat ditindaklanjuti agar klien
  CLI dapat memberi tahu pengguna apa yang memblokir mereka.

- Baca: 600/menit per IP, 2400/menit per kunci
- Tulis: 45/menit per IP, 180/menit per kunci
- Unduh: 30/menit per IP, 180/menit per kunci (`/api/v1/download`)

Header:

- Kompatibilitas legacy: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- Terstandardisasi: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`
- Pada `429`: `Retry-After`

Semantik header:

- `X-RateLimit-Reset`: detik epoch Unix absolut
- `RateLimit-Reset`: detik hingga reset (penundaan)
- `Retry-After`: detik untuk menunggu sebelum mencoba ulang (penundaan) pada `429`

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

- Jika `Retry-After` ada, tunggu sejumlah detik tersebut sebelum mencoba ulang.
- Gunakan backoff dengan jitter untuk menghindari percobaan ulang tersinkronisasi.
- Jika `Retry-After` hilang, fallback ke `RateLimit-Reset` (atau hitung dari `X-RateLimit-Reset`).

Sumber IP:

- Menggunakan `cf-connecting-ip` (Cloudflare) untuk IP klien secara default.
- ClawHub menggunakan header penerusan tepercaya untuk mengidentifikasi IP klien di edge.
- Jika tidak ada IP klien tepercaya yang tersedia, permintaan unduhan anonim menggunakan bucket fallback yang dicakup endpoint, bukan satu bucket global `ip:unknown`. Permintaan baca/tulis anonim tetap menggunakan bucket unknown bersama sehingga perutean IP yang hilang tetap terlihat dan konservatif.

## Endpoint publik (tanpa auth)

### `GET /api/v1/search`

Parameter kueri:

- `q` (wajib): string kueri
- `limit` (opsional): integer
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

- Hasil dikembalikan dalam urutan relevansi (kemiripan embedding + boost token slug/nama persis + prior popularitas dari unduhan).
- Relevansi lebih kuat daripada popularitas. Kecocokan token slug atau nama tampilan yang presisi dapat mengungguli kecocokan yang lebih longgar dengan unduhan jauh lebih banyak.
- Teks ASCII ditokenisasi pada batas kata dan tanda baca. Misalnya, `personal-map` berisi token `map` yang berdiri sendiri, sedangkan `amap-jsapi-skill` berisi `amap`, `jsapi`, dan `skill`; karena itu, pencarian `map` memberi `personal-map` kecocokan leksikal yang lebih kuat daripada `amap-jsapi-skill`.
- Unduhan digunakan sebagai prior kecil berskala log dan pemecah seri, bukan sebagai sinyal peringkat utama. Skills dengan unduhan tinggi dapat memiliki peringkat lebih rendah ketika teks kueri merupakan kecocokan yang lebih lemah.
- Status moderasi mencurigakan atau tersembunyi dapat menghapus sebuah skill dari pencarian publik tergantung pada filter pemanggil dan status moderasi saat ini.

Panduan keterlihatan publisher:

- Letakkan istilah yang secara harfiah akan dicari pengguna di nama tampilan, ringkasan, dan tag. Gunakan token slug yang berdiri sendiri hanya ketika token itu juga merupakan identitas stabil yang ingin Anda pertahankan.
- Jangan mengganti nama slug hanya untuk mengejar satu kueri kecuali slug baru tersebut adalah nama kanonis jangka panjang yang lebih baik. Slug lama menjadi alias pengalihan, tetapi URL kanonis, slug yang ditampilkan, dan digest pencarian masa depan menggunakan slug baru.
- Alias penggantian nama mempertahankan penyelesaian untuk URL lama dan instalasi yang diselesaikan melalui registry, tetapi peringkat pencarian didasarkan pada metadata skill kanonis setelah penggantian nama diindeks. Statistik yang ada tetap bersama skill tersebut.
- Jika sebuah skill tiba-tiba tidak terlihat, periksa status moderasi terlebih dahulu dengan `clawhub inspect <slug>` saat sudah masuk sebelum mengubah metadata terkait peringkat.

### `GET /api/v1/skills`

Parameter kueri:

- `limit` (opsional): integer (1–200)
- `cursor` (opsional): kursor paginasi untuk sort apa pun selain `trending`
- `sort` (opsional): `updated` (default), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), `installsCurrent` (alias: `installs`), `installsAllTime`, `trending`
- `nonSuspiciousOnly` (opsional): `true` untuk menyembunyikan Skills mencurigakan (`flagged.suspicious`)
- `nonSuspicious` (opsional): alias legacy untuk `nonSuspiciousOnly`

Catatan:

- `trending` memberi peringkat berdasarkan instalasi dalam 7 hari terakhir (berbasis telemetri).
- `createdAt` stabil untuk crawl skill baru; `updated` berubah ketika Skills yang ada dipublikasikan ulang.
- Ketika `nonSuspiciousOnly=true`, sort berbasis kursor dapat mengembalikan item lebih sedikit daripada `limit` pada sebuah halaman karena Skills mencurigakan difilter setelah pengambilan halaman.
- Gunakan `nextCursor` untuk melanjutkan paginasi ketika tersedia. Halaman pendek tidak dengan sendirinya berarti akhir hasil.

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

- Slug lama yang dibuat oleh alur penggantian nama/penggabungan owner diselesaikan ke skill kanonis.
- `metadata.os`: pembatasan OS yang dideklarasikan dalam frontmatter skill (mis. `["macos"]`, `["linux"]`). `null` jika tidak dideklarasikan.
- `metadata.systems`: target sistem Nix (mis. `["aarch64-darwin", "x86_64-linux"]`). `null` jika tidak dideklarasikan.
- `metadata` adalah `null` jika skill tidak memiliki metadata platform.
- `moderation` disertakan hanya ketika skill ditandai atau owner sedang melihatnya.

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
- Bukti disunting untuk pemanggil publik dan hanya menyertakan snippet mentah untuk owner/moderator.

### `POST /api/v1/skills/{slug}/report`

Laporkan sebuah skill untuk peninjauan moderator. Laporan berada pada level skill, secara opsional ditautkan
ke sebuah versi, dan mengisi antrean laporan skill.

Auth:

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

Endpoint moderator/admin untuk penerimaan laporan skill.

Parameter kueri:

- `status` (opsional): `open` (default), `confirmed`, `dismissed`, atau `all`
- `limit` (opsional): integer (1-200)
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

Endpoint moderator/admin untuk menyelesaikan atau membuka kembali laporan skill.

Permintaan:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` wajib untuk `confirmed` dan `dismissed`; ini dapat dihilangkan ketika
mengatur `status` kembali ke `open`. Teruskan `finalAction: "hide"` dengan laporan yang telah ditriase
untuk menyembunyikan skill dalam alur kerja yang sama dan dapat diaudit.

### `GET /api/v1/skills/{slug}/versions`

Parameter kueri:

- `limit` (opsional): integer
- `cursor` (opsional): kursor paginasi

### `GET /api/v1/skills/{slug}/versions/{version}`

Mengembalikan metadata versi + daftar file.

- `version.security` menyertakan status verifikasi scan yang dinormalisasi dan detail scanner
  (VirusTotal + LLM), ketika tersedia.

### `GET /api/v1/skills/{slug}/scan`

Mengembalikan detail verifikasi scan keamanan untuk sebuah versi skill.

Parameter kueri:

- `version` (opsional): string versi spesifik.
- `tag` (opsional): selesaikan versi bertag (misalnya `latest`).

Catatan:

- Jika `version` maupun `tag` tidak disediakan, gunakan versi terbaru.
- Menyertakan status verifikasi yang dinormalisasi beserta detail khusus scanner.
- `security.capabilityTags` menyertakan label kapabilitas/risiko deterministik seperti
  `crypto`, `requires-wallet`, `can-make-purchases`, `can-sign-transactions`,
  `requires-oauth-token`, dan `posts-externally` ketika terdeteksi.
- `security.hasScanResult` adalah `true` hanya ketika scanner menghasilkan verdict definitif (`clean`, `suspicious`, atau `malicious`).
- `moderation` adalah snapshot moderasi level skill saat ini yang diturunkan dari versi terbaru.
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

- Skills
- Plugin kode
- Plugin bundle

Parameter kueri:

- `limit` (opsional): bilangan bulat (1–100)
- `cursor` (opsional): kursor paginasi
- `family` (opsional): `skill`, `code-plugin`, atau `bundle-plugin`
- `channel` (opsional): `official`, `community`, atau `private`
- `isOfficial` (opsional): `true` atau `false`
- `executesCode` (opsional): `true` atau `false`
- `capabilityTag` (opsional): filter kapabilitas untuk paket Plugin
- `target` / `hostTarget` (opsional): singkatan untuk `host:<target>`
- `os`, `arch`, `libc` (opsional): singkatan untuk filter kapabilitas host
- `requiresBrowser`, `requiresDesktop`, `requiresNativeDeps`,
  `requiresExternalService`, `requiresBinary`, `requiresOsPermission`
  (opsional): singkatan `true`/`1` untuk tag persyaratan lingkungan
- `externalService`, `binary`, `osPermission` (opsional): singkatan untuk tag
  persyaratan lingkungan bernama
- `artifactKind` (opsional): `legacy-zip` atau `npm-pack`
- `npmMirror` (opsional): `true`/`1` untuk menampilkan versi paket berbasis ClawPack
  yang tersedia melalui mirror npm

Catatan:

- `GET /api/v1/code-plugins` dan `GET /api/v1/bundle-plugins` tetap menjadi alias family tetap.
- Entri Skill tetap didukung oleh registri skill dan masih hanya dapat diterbitkan melalui `POST /api/v1/skills`.
- `POST /api/v1/packages` masih hanya untuk rilis code-plugin dan bundle-plugin.
- Pemanggil anonim hanya melihat channel paket publik.
- Pemanggil terautentikasi dapat melihat paket privat untuk penerbit yang mereka ikuti dalam hasil daftar/pencarian.
- `channel=private` hanya mengembalikan paket yang dapat dibaca oleh pemanggil terautentikasi.

### `GET /api/v1/packages/search`

Pencarian katalog terpadu di seluruh skill + paket Plugin.

Parameter kueri:

- `q` (wajib): string kueri
- `limit` (opsional): bilangan bulat (1–100)
- `family` (opsional): `skill`, `code-plugin`, atau `bundle-plugin`
- `channel` (opsional): `official`, `community`, atau `private`
- `isOfficial` (opsional): `true` atau `false`
- `executesCode` (opsional): `true` atau `false`
- `capabilityTag` (opsional): filter kapabilitas untuk paket Plugin
- `target` / `hostTarget`, `os`, `arch`, `libc`, `requiresBrowser`,
  `requiresDesktop`, `requiresNativeDeps`, `requiresExternalService`,
  `requiresBinary`, `requiresOsPermission`, `externalService`, `binary`, dan
  `osPermission` diterima sebagai singkatan untuk tag kapabilitas umum
- `artifactKind` (opsional): `legacy-zip` atau `npm-pack`
- `npmMirror` (opsional): `true`/`1` untuk mencari versi paket berbasis ClawPack
  yang tersedia melalui mirror npm

Catatan:

- Pemanggil anonim hanya melihat channel paket publik.
- Pemanggil terautentikasi dapat mencari paket privat untuk penerbit yang mereka ikuti.
- `channel=private` hanya mengembalikan paket yang dapat dibaca oleh pemanggil terautentikasi.
- Filter artefak didukung oleh tag kapabilitas terindeks:
  `artifact:legacy-zip`, `artifact:npm-pack`, dan `npm-mirror:available`.

### `GET /api/v1/packages/{name}`

Mengembalikan metadata detail paket.

Catatan:

- Skills juga dapat diresolusi melalui rute ini dalam katalog terpadu.
- Paket privat mengembalikan `404` kecuali pemanggil dapat membaca penerbit pemiliknya.

### `DELETE /api/v1/packages/{name}`

Menghapus lunak sebuah paket dan semua rilis.

Catatan:

- Memerlukan token API untuk pemilik paket, pemilik/admin penerbit org,
  moderator platform, atau admin platform.

### `GET /api/v1/packages/{name}/versions`

Mengembalikan riwayat versi.

Parameter kueri:

- `limit` (opsional): bilangan bulat (1–100)
- `cursor` (opsional): kursor paginasi

Catatan:

- Paket privat mengembalikan `404` kecuali pemanggil dapat membaca penerbit pemiliknya.

### `GET /api/v1/packages/{name}/versions/{version}`

Mengembalikan satu versi paket, termasuk metadata file, kompatibilitas,
kapabilitas, verifikasi, metadata artefak, dan data pemindaian.

Catatan:

- `version.artifact.kind` adalah `legacy-zip` untuk arsip paket lama atau
  `npm-pack` untuk rilis berbasis ClawPack.
- Rilis ClawPack menyertakan field kompatibel npm `npmIntegrity`, `npmShasum`, dan
  `npmTarballName`.
- `version.sha256hash`, `version.vtAnalysis`, `version.llmAnalysis`, dan `version.staticScan` disertakan saat data pemindaian ada.
- Paket privat mengembalikan `404` kecuali pemanggil dapat membaca penerbit pemiliknya.

### `GET /api/v1/packages/{name}/versions/{version}/security`

Mengembalikan ringkasan keamanan dan kepercayaan rilis paket yang persis untuk klien
instalasi. Ini adalah permukaan konsumsi publik OpenClaw untuk memutuskan apakah
rilis yang diresolusi dapat diinstal.

Autentikasi:

- Endpoint baca publik. Tidak diperlukan token pemilik, penerbit, moderator, atau admin.

Respons:

```json
{
  "package": {
    "name": "@openclaw/example-plugin",
    "displayName": "Example Plugin",
    "family": "code-plugin"
  },
  "release": {
    "releaseId": "packageReleases:...",
    "version": "1.2.3",
    "artifactKind": "npm-pack",
    "artifactSha256": "0123456789abcdef...",
    "npmIntegrity": "sha512-...",
    "npmShasum": "0123456789abcdef0123456789abcdef01234567",
    "npmTarballName": "example-plugin-1.2.3.tgz",
    "createdAt": 1730000000000
  },
  "trust": {
    "scanStatus": "malicious",
    "moderationState": "quarantined",
    "blockedFromDownload": true,
    "reasons": ["manual:quarantined", "scan:malicious"],
    "pending": false,
    "stale": false
  }
}
```

Field respons:

- `package.name`, `package.displayName`, dan `package.family` mengidentifikasi
  paket registri yang diresolusi.
- `release.releaseId`, `release.version`, dan `release.createdAt` mengidentifikasi
  rilis persis yang dievaluasi.
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum`, dan `release.npmTarballName` hadir saat diketahui untuk
  artefak rilis.
- `trust.scanStatus` adalah status kepercayaan efektif yang diturunkan dari input pemindai
  dan moderasi rilis manual.
- `trust.moderationState` dapat null. Nilainya `null` saat tidak ada moderasi rilis
  manual.
- `trust.blockedFromDownload` adalah sinyal blok instalasi. OpenClaw dan klien
  instalasi lain sebaiknya memblokir instalasi saat nilai ini `true`, alih-alih
  menurunkan ulang aturan pemblokiran dari field pemindai atau moderasi.
- `trust.reasons` adalah daftar penjelasan yang ditampilkan kepada pengguna dan untuk audit. Kode alasan
  adalah string ringkas dan stabil seperti `manual:quarantined`, `scan:malicious`,
  `static:malicious`, `vt:suspicious`, dan `package:malicious`.
- `trust.pending` berarti satu atau lebih input kepercayaan masih menunggu penyelesaian.
- `trust.stale` berarti ringkasan kepercayaan dihitung dari input usang dan
  sebaiknya diperlakukan sebagai memerlukan penyegaran sebelum keputusan izinkan dengan keyakinan tinggi.

Catatan:

- Endpoint ini presisi terhadap versi. Klien sebaiknya memanggilnya setelah meresolusi
  versi paket yang akan mereka instal, bukan hanya setelah membaca metadata paket
  terbaru.
- Paket privat mengembalikan `404` kecuali pemanggil dapat membaca penerbit pemiliknya.
- Endpoint ini sengaja lebih sempit daripada endpoint moderasi pemilik/moderator.
  Endpoint ini mengekspos keputusan instalasi dan penjelasan publik, bukan
  identitas pelapor, isi laporan, bukti privat, atau linimasa tinjauan internal.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Mengembalikan metadata resolver artefak eksplisit untuk sebuah versi paket.

Catatan:

- Versi paket legacy mengembalikan artefak `legacy-zip` dan
  `downloadUrl` ZIP legacy.
- Versi ClawPack mengembalikan artefak `npm-pack`, field integritas npm,
  `tarballUrl`, dan URL kompatibilitas ZIP legacy.
- Ini adalah permukaan resolver OpenClaw; ini menghindari penebakan format arsip dari
  URL bersama.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Mengunduh artefak versi melalui jalur resolver eksplisit.

Catatan:

- Versi ClawPack melakukan stream byte `.tgz` npm-pack yang persis diunggah.
- Versi ZIP legacy mengalihkan ke `/api/v1/packages/{name}/download?version=`.
- Menggunakan bucket batas laju unduhan.

### `GET /api/v1/packages/{name}/readiness`

Mengembalikan kesiapan terhitung untuk konsumsi OpenClaw di masa mendatang.

Pemeriksaan kesiapan mencakup:

- status channel official
- ketersediaan versi terbaru
- ketersediaan artefak npm-pack ClawPack
- digest artefak
- provenans repo sumber dan commit
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

Endpoint moderator untuk mencantumkan baris migrasi Plugin official OpenClaw.

Autentikasi:

- Memerlukan token API untuk pengguna moderator atau admin.

Parameter kueri:

- `phase` (opsional): `planned`, `published`, `clawpack-ready`,
  `legacy-zip-only`, `metadata-ready`, `blocked`, `ready-for-openclaw`, atau
  `all` (default).
- `limit` (opsional): bilangan bulat (1-100)
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

Endpoint admin untuk membuat atau memperbarui baris migrasi Plugin official.

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

- `bundledPluginId` dinormalisasi ke huruf kecil dan merupakan kunci upsert stabil.
- `packageName` dinormalisasi sebagai nama npm; paket dapat tidak ada untuk migrasi
  terencana.
- Ini hanya melacak kesiapan migrasi. Ini tidak memutasi OpenClaw atau menghasilkan
  ClawPack.

### `GET /api/v1/packages/moderation/queue`

Endpoint moderator/admin untuk antrean tinjauan rilis paket.

Autentikasi:

- Memerlukan token API untuk pengguna moderator atau admin.

Parameter kueri:

- `status` (opsional): `open` (default), `blocked`, `manual`, atau `all`
- `limit` (opsional): bilangan bulat (1-100)
- `cursor` (opsional): kursor paginasi

Arti status:

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

Laporkan paket untuk peninjauan moderator. Laporan berlaku pada tingkat paket, secara opsional
ditautkan ke sebuah versi. Laporan masuk ke antrean moderasi tetapi tidak otomatis menyembunyikan atau
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
- `limit` (opsional): bilangan bulat (1-100)
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

`note` wajib untuk `confirmed` dan `dismissed`; ini dapat dihilangkan saat
mengatur `status` kembali ke `open`. Teruskan `finalAction: "quarantine"` atau
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

- `approved`: ditinjau manual dan diizinkan.
- `quarantined`: diblokir sambil menunggu tindak lanjut.
- `revoked`: diblokir setelah rilis sebelumnya dipercaya.

Rilis yang dikarantina dan dicabut mengembalikan `403` dari rute unduhan artefak.
Setiap perubahan menulis entri log audit.

### `POST /api/v1/packages/backfill/artifacts`

Endpoint pemeliharaan khusus admin untuk memberi label pada rilis paket lama dengan
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
- Baris lama berbasis ClawPack yang tidak memiliki `artifactKind` diperbaiki sebagai
  `npm-pack`.
- Ini tidak membuat ClawPack atau mengubah byte artefak.

### `GET /api/v1/packages/{name}/file`

Mengembalikan konten teks mentah untuk sebuah berkas paket.

Parameter kueri:

- `path` (wajib)
- `version` (opsional)
- `tag` (opsional)

Catatan:

- Default ke rilis terbaru.
- Menggunakan bucket laju baca, bukan bucket unduhan.
- Berkas biner mengembalikan `415`.
- Batas ukuran berkas: 200KB.
- Pemindaian VirusTotal yang tertunda tidak memblokir pembacaan; rilis berbahaya mungkin tetap ditahan di tempat lain.
- Paket privat mengembalikan `404` kecuali pemanggil dapat membaca penerbit pemiliknya.

### `GET /api/v1/packages/{name}/download`

Mengunduh arsip ZIP deterministik lama untuk rilis paket.

Parameter kueri:

- `version` (opsional)
- `tag` (opsional)

Catatan:

- Default ke rilis terbaru.
- Skills mengalihkan ke `GET /api/v1/download`.
- Arsip Plugin/paket adalah berkas zip dengan root `package/` sehingga klien OpenClaw
  lama tetap berfungsi.
- Rute ini tetap hanya ZIP. Rute ini tidak men-stream berkas ClawPack `.tgz`.
- Respons menyertakan header `ETag`, `Digest`, `X-ClawHub-Artifact-Type`, dan
  `X-ClawHub-Artifact-Sha256` untuk pemeriksaan integritas resolver.
- Metadata khusus registry tidak disuntikkan ke arsip yang diunduh.
- Pemindaian VirusTotal yang tertunda tidak memblokir unduhan; rilis berbahaya mengembalikan `403`.
- Paket privat mengembalikan `404` kecuali pemanggil adalah pemiliknya.

### `GET /api/npm/{package}`

Mengembalikan packument yang kompatibel dengan npm untuk versi paket berbasis ClawPack.

Catatan:

- Hanya versi dengan tarball npm-pack ClawPack yang diunggah yang dicantumkan.
- Versi lama yang hanya ZIP sengaja dihilangkan.
- `dist.tarball`, `dist.integrity`, dan `dist.shasum` menggunakan kolom yang kompatibel dengan npm
  sehingga pengguna dapat mengarahkan npm ke mirror jika mereka memilih.
- Packument paket scoped mendukung jalur permintaan `/api/npm/@scope/name` dan
  `/api/npm/@scope%2Fname` terenkode milik npm.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Men-stream byte tarball ClawPack persis seperti yang diunggah untuk klien mirror npm.

Catatan:

- Menggunakan bucket laju unduhan.
- Header unduhan menyertakan SHA-256 ClawHub plus metadata integritas/shasum npm.
- Pemeriksaan moderasi dan akses paket privat tetap berlaku.

### `GET /api/v1/resolve`

Digunakan oleh CLI untuk memetakan fingerprint lokal ke versi yang diketahui.

Parameter kueri:

- `slug` (wajib)
- `hash` (wajib): sha256 heksadesimal 64 karakter dari fingerprint bundel

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
- Versi yang dihapus lunak mengembalikan `410`.
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
- Kolom payload opsional: `ownerHandle`. Jika ada, API menyelesaikan
  penerbit tersebut di sisi server dan mewajibkan aktor memiliki akses penerbit.
- Kolom payload opsional: `migrateOwner`. Jika `true` dengan `ownerHandle`, sebuah
  skill yang ada dapat dipindahkan ke pemilik tersebut jika aktor adalah admin/pemilik pada
  penerbit saat ini dan target. Tanpa opt-in ini, perubahan pemilik
  ditolak.

### `POST /api/v1/packages`

Menerbitkan rilis code-plugin atau bundle-plugin.

- Memerlukan autentikasi token Bearer.
- Disarankan: `multipart/form-data` dengan JSON `payload` + blob `files[]`.
- Isi JSON dengan `files` (berbasis storageId) juga diterima.
- Kolom payload opsional: `ownerHandle`. Jika ada, hanya admin yang dapat menerbitkan atas nama pemilik tersebut.

Sorotan validasi:

- `family` harus berupa `code-plugin` atau `bundle-plugin`.
- Paket Plugin memerlukan `openclaw.plugin.json`. Unggahan ClawPack `.tgz` harus
  memuatnya di `package/openclaw.plugin.json`.
- Plugin kode memerlukan `package.json`, metadata repo sumber, metadata commit sumber,
  metadata skema config, `openclaw.compat.pluginApi`, dan
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` dan `openclaw.environment` adalah metadata opsional.
- Hanya penerbit tepercaya yang dapat menerbitkan ke channel `official`.
- Penerbitan atas nama tetap memvalidasi kelayakan channel resmi terhadap akun pemilik target.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Menghapus lunak / memulihkan skill (pemilik, moderator, atau admin).

Isi JSON opsional:

```json
{ "reason": "Held for moderation pending legal review." }
```

Jika ada, `reason` disimpan sebagai catatan moderasi skill dan disalin ke log audit.
Penghapusan lunak yang dimulai pemilik mencadangkan slug selama 30 hari, lalu slug dapat diklaim oleh
penerbit lain. Respons hapus menyertakan `slugReservedUntil` saat kedaluwarsa ini berlaku.
Penyembunyian oleh moderator/admin dan penghapusan keamanan tidak kedaluwarsa dengan cara ini.

Respons hapus:

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

Khusus admin. Memastikan penerbit org ada untuk sebuah handle. Jika handle masih menunjuk ke
penerbit pengguna/pribadi bersama lama, endpoint terlebih dahulu memigrasikannya ke penerbit org.

- Isi: `{ "handle": "openclaw", "displayName": "OpenClaw", "trusted": true }`
- Respons: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true }`

### `POST /api/v1/users/reserve`

Khusus admin. Mencadangkan slug root dan nama paket untuk pemilik yang berhak tanpa menerbitkan
rilis. Nama paket menjadi paket placeholder privat tanpa baris rilis, sehingga pemilik yang sama
nantinya dapat menerbitkan rilis code-plugin atau bundle-plugin sebenarnya ke nama tersebut.

- Isi: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Respons: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### Endpoint manajemen slug pemilik

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
  - Respons (terima/tolak/batalkan): `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - Bentuk respons: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

Blokir pengguna dan hapus permanen Skills yang dimiliki (hanya moderator/admin).

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

Batalkan pemblokiran pengguna dan pulihkan Skills yang memenuhi syarat (hanya admin).

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

Ubah peran pengguna (hanya admin).

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

Cantumkan atau cari pengguna (hanya admin).

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

Tambahkan/hapus bintang (sorotan). Kedua endpoint bersifat idempoten.

Respons:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## Endpoint CLI lama (tidak digunakan lagi)

Masih didukung untuk versi CLI yang lebih lama:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/sync`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

Lihat `DEPRECATIONS.md` untuk rencana penghapusan.

## Penemuan registri (`/.well-known/clawhub.json`)

CLI dapat menemukan pengaturan registri/autentikasi dari situs:

- `/.well-known/clawhub.json` (JSON, lebih disukai)
- `/.well-known/clawdhub.json` (lama)

Skema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Jika Anda melakukan hosting sendiri, sajikan file ini (atau tetapkan `CLAWHUB_REGISTRY` secara eksplisit; `CLAWDHUB_REGISTRY` lama).
