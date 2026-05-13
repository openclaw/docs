---
read_when:
    - Menambahkan/mengubah endpoint
    - Pemecahan masalah permintaan CLI ↔ registri
summary: Referensi API HTTP (endpoint publik + endpoint CLI + autentikasi).
x-i18n:
    generated_at: "2026-05-13T04:17:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1ea3f398107dd3a59fd870a3320ff8d76863a0b7995904e0e61b48d59f35a7d4
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP API

URL dasar: `https://clawhub.ai` (default).

Semua jalur v1 berada di bawah `/api/v1/...`.
Legacy `/api/...` dan `/api/cli/...` tetap ada untuk kompatibilitas (lihat `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## Penggunaan ulang katalog publik

Direktori pihak ketiga dapat menggunakan endpoint baca publik untuk mencantumkan atau mencari Skills ClawHub. Harap cache hasil, patuhi `429`/`Retry-After`, tautkan pengguna kembali ke listing ClawHub kanonis (`https://clawhub.ai/<owner>/<slug>`), dan hindari menyiratkan dukungan ClawHub terhadap situs pihak ketiga. Jangan mencoba mencerminkan konten tersembunyi, privat, atau diblokir moderasi di luar permukaan API publik.

Pintasan slug web diselesaikan lintas keluarga registry, tetapi klien API sebaiknya menggunakan
URL kanonis yang dikembalikan oleh endpoint baca alih-alih merekonstruksi prioritas
rute.

## Batas laju

Model penegakan:

- Permintaan anonim: ditegakkan per IP.
- Permintaan terautentikasi (token Bearer valid): ditegakkan per bucket pengguna.
- Jika token hilang/tidak valid, perilaku kembali ke penegakan IP.
- Endpoint tulis terautentikasi tidak boleh mengembalikan `Unauthorized` mentah saat
  server mengetahui alasannya. Token hilang, token tidak valid/dicabut, dan
  akun yang dihapus/diblokir/dinonaktifkan masing-masing harus mendapatkan teks yang dapat ditindaklanjuti agar klien
  CLI dapat memberi tahu pengguna apa yang memblokir mereka.

- Baca: 600/menit per IP, 2400/menit per key
- Tulis: 45/menit per IP, 180/menit per key
- Unduh: 30/menit per IP, 180/menit per key (`/api/v1/download`)

Header:

- Kompatibilitas legacy: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- Terstandardisasi: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`
- Pada `429`: `Retry-After`

Semantik header:

- `X-RateLimit-Reset`: detik epoch Unix absolut
- `RateLimit-Reset`: detik hingga reset (delay)
- `Retry-After`: detik untuk menunggu sebelum mencoba lagi (delay) pada `429`

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

- Jika `Retry-After` ada, tunggu sebanyak itu dalam detik sebelum mencoba lagi.
- Gunakan backoff dengan jitter untuk menghindari percobaan ulang tersinkronisasi.
- Jika `Retry-After` tidak ada, fallback ke `RateLimit-Reset` (atau hitung dari `X-RateLimit-Reset`).

Sumber IP:

- Menggunakan `cf-connecting-ip` (Cloudflare) untuk IP klien secara default.
- ClawHub menggunakan header forwarding tepercaya untuk mengidentifikasi IP klien di edge.
- Jika tidak ada IP klien tepercaya yang tersedia, permintaan unduhan anonim menggunakan bucket fallback yang dibatasi endpoint alih-alih satu bucket global `ip:unknown`. Permintaan baca/tulis anonim tetap menggunakan bucket unknown bersama agar perutean tanpa-IP tetap terlihat dan konservatif.

## Endpoint publik (tanpa auth)

### `GET /api/v1/search`

Parameter kueri:

- `q` (wajib): string kueri
- `limit` (opsional): integer
- `highlightedOnly` (opsional): `true` untuk memfilter ke skill yang disorot
- `nonSuspiciousOnly` (opsional): `true` untuk menyembunyikan skill mencurigakan (`flagged.suspicious`)
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

- Hasil dikembalikan dalam urutan relevansi (kemiripan embedding + peningkat token slug/nama persis + prior popularitas dari unduhan).
- Relevansi lebih kuat daripada popularitas. Kecocokan token slug atau nama tampilan yang presisi dapat mengungguli kecocokan yang lebih longgar dengan unduhan jauh lebih banyak.
- Teks ASCII ditokenisasi pada batas kata dan tanda baca. Misalnya, `personal-map` berisi token `map` yang berdiri sendiri, sedangkan `amap-jsapi-skill` berisi `amap`, `jsapi`, dan `skill`; karena itu, pencarian `map` memberi `personal-map` kecocokan leksikal yang lebih kuat daripada `amap-jsapi-skill`.
- Unduhan digunakan sebagai prior kecil berskala log dan pemecah seri, bukan sebagai sinyal peringkat utama. Skill dengan unduhan tinggi dapat berada di peringkat lebih rendah saat teks kueri memiliki kecocokan yang lebih lemah.
- Status moderasi mencurigakan atau tersembunyi dapat menghapus skill dari pencarian publik bergantung pada filter pemanggil dan status moderasi saat ini.

Panduan discoverability penerbit:

- Letakkan istilah yang benar-benar akan dicari pengguna di nama tampilan, ringkasan, dan tag. Gunakan token slug yang berdiri sendiri hanya ketika itu juga merupakan identitas stabil yang ingin Anda pertahankan.
- Jangan mengganti nama slug hanya untuk mengejar satu kueri kecuali slug baru adalah nama kanonis jangka panjang yang lebih baik. Slug lama menjadi alias pengalihan, tetapi URL kanonis, slug yang ditampilkan, dan digest pencarian mendatang menggunakan slug baru.
- Alias rename mempertahankan resolusi untuk URL lama dan instalasi yang diselesaikan melalui registry, tetapi peringkat pencarian didasarkan pada metadata skill kanonis setelah rename telah terindeks. Statistik yang ada tetap bersama skill tersebut.
- Jika sebuah skill tiba-tiba tidak terlihat, periksa status moderasi terlebih dahulu dengan `clawhub inspect <slug>` saat login sebelum mengubah metadata terkait peringkat.

### `GET /api/v1/skills`

Parameter kueri:

- `limit` (opsional): integer (1–200)
- `cursor` (opsional): kursor paginasi untuk sort non-`trending` apa pun
- `sort` (opsional): `updated` (default), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), `installsCurrent` (alias: `installs`), `installsAllTime`, `trending`
- `nonSuspiciousOnly` (opsional): `true` untuk menyembunyikan skill mencurigakan (`flagged.suspicious`)
- `nonSuspicious` (opsional): alias legacy untuk `nonSuspiciousOnly`

Catatan:

- `trending` memberi peringkat berdasarkan instalasi dalam 7 hari terakhir (berbasis telemetry).
- `createdAt` stabil untuk crawl skill baru; `updated` berubah saat skill yang ada dipublikasikan ulang.
- Saat `nonSuspiciousOnly=true`, sort berbasis kursor dapat mengembalikan item lebih sedikit dari `limit` pada sebuah halaman karena skill mencurigakan difilter setelah pengambilan halaman.
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

- Slug lama yang dibuat oleh alur rename/merge owner diselesaikan ke skill kanonis.
- `metadata.os`: pembatasan OS yang dideklarasikan dalam frontmatter skill (mis. `["macos"]`, `["linux"]`). `null` jika tidak dideklarasikan.
- `metadata.systems`: target sistem Nix (mis. `["aarch64-darwin", "x86_64-linux"]`). `null` jika tidak dideklarasikan.
- `metadata` adalah `null` jika skill tidak memiliki metadata platform.
- `moderation` disertakan hanya saat skill ditandai atau owner sedang melihatnya.

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

- Owner dan moderator dapat mengakses detail moderasi untuk skill tersembunyi.
- Pemanggil publik hanya mendapatkan `200` untuk skill terlihat yang sudah ditandai.
- Bukti disunting untuk pemanggil publik dan hanya menyertakan cuplikan mentah untuk owner/moderator.

### `POST /api/v1/skills/{slug}/report`

Laporkan skill untuk peninjauan moderator. Laporan berada pada level skill, secara opsional ditautkan
ke versi, dan masuk ke antrean laporan skill.

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

`note` wajib untuk `confirmed` dan `dismissed`; dapat dihilangkan saat
mengatur `status` kembali ke `open`. Sertakan `finalAction: "hide"` dengan laporan
yang sudah ditriage untuk menyembunyikan skill dalam workflow yang sama dan dapat diaudit.

### `GET /api/v1/skills/{slug}/versions`

Parameter kueri:

- `limit` (opsional): integer
- `cursor` (opsional): kursor paginasi

### `GET /api/v1/skills/{slug}/versions/{version}`

Mengembalikan metadata versi + daftar file.

- `version.security` menyertakan status verifikasi pemindaian yang dinormalisasi dan detail scanner
  (VirusTotal + LLM), saat tersedia.

### `GET /api/v1/skills/{slug}/scan`

Mengembalikan detail verifikasi pemindaian keamanan untuk versi skill.

Parameter kueri:

- `version` (opsional): string versi tertentu.
- `tag` (opsional): menyelesaikan versi bertag (misalnya `latest`).

Catatan:

- Jika `version` maupun `tag` tidak diberikan, menggunakan versi terbaru.
- Menyertakan status verifikasi yang dinormalisasi plus detail khusus scanner.
- `security.capabilityTags` menyertakan label kemampuan/risiko deterministik seperti
  `crypto`, `requires-wallet`, `can-make-purchases`, `can-sign-transactions`,
  `requires-oauth-token`, dan `posts-externally` saat terdeteksi.
- `security.hasScanResult` adalah `true` hanya saat scanner menghasilkan verdict definitif (`clean`, `suspicious`, atau `malicious`).
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

- skills
- code plugins
- bundle plugins

Parameter kueri:

- `limit` (opsional): integer (1–100)
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
- `npmMirror` (opsional): `true`/`1` untuk menampilkan versi paket yang didukung
  ClawPack yang tersedia melalui mirror npm

Catatan:

- `GET /api/v1/code-plugins` dan `GET /api/v1/bundle-plugins` tetap menjadi alias family tetap.
- Entri Skills tetap didukung oleh registri skill dan masih hanya dapat dipublikasikan melalui `POST /api/v1/skills`.
- `POST /api/v1/packages` tetap hanya untuk rilis code-plugin dan bundle-plugin.
- Pemanggil anonim hanya melihat channel paket publik.
- Pemanggil terautentikasi dapat melihat paket privat untuk publisher yang mereka ikuti dalam hasil daftar/pencarian.
- `channel=private` hanya mengembalikan paket yang dapat dibaca oleh pemanggil terautentikasi.

### `GET /api/v1/packages/search`

Pencarian katalog terpadu di seluruh Skills + paket Plugin.

Parameter kueri:

- `q` (wajib): string kueri
- `limit` (opsional): integer (1–100)
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
- `npmMirror` (opsional): `true`/`1` untuk mencari versi paket yang didukung
  ClawPack yang tersedia melalui mirror npm

Catatan:

- Pemanggil anonim hanya melihat channel paket publik.
- Pemanggil terautentikasi dapat mencari paket privat untuk publisher yang mereka ikuti.
- `channel=private` hanya mengembalikan paket yang dapat dibaca oleh pemanggil terautentikasi.
- Filter artefak didukung oleh tag kapabilitas terindeks:
  `artifact:legacy-zip`, `artifact:npm-pack`, dan `npm-mirror:available`.

### `GET /api/v1/packages/{name}`

Mengembalikan metadata detail paket.

Catatan:

- Skills juga dapat di-resolve melalui rute ini dalam katalog terpadu.
- Paket privat mengembalikan `404` kecuali pemanggil dapat membaca publisher pemiliknya.

### `DELETE /api/v1/packages/{name}`

Menghapus sementara sebuah paket dan semua rilisnya.

Catatan:

- Memerlukan token API untuk pemilik paket, pemilik/admin publisher organisasi,
  moderator platform, atau admin platform.

### `GET /api/v1/packages/{name}/versions`

Mengembalikan riwayat versi.

Parameter kueri:

- `limit` (opsional): integer (1–100)
- `cursor` (opsional): kursor paginasi

Catatan:

- Paket privat mengembalikan `404` kecuali pemanggil dapat membaca publisher pemiliknya.

### `GET /api/v1/packages/{name}/versions/{version}`

Mengembalikan satu versi paket, termasuk metadata file, kompatibilitas,
kapabilitas, verifikasi, metadata artefak, dan data pemindaian.

Catatan:

- `version.artifact.kind` adalah `legacy-zip` untuk arsip paket dunia lama atau
  `npm-pack` untuk rilis yang didukung ClawPack.
- Rilis ClawPack menyertakan field kompatibel npm `npmIntegrity`, `npmShasum`, dan
  `npmTarballName`.
- `version.sha256hash`, `version.vtAnalysis`, `version.llmAnalysis`, dan `version.staticScan` disertakan saat data pemindaian ada.
- Paket privat mengembalikan `404` kecuali pemanggil dapat membaca publisher pemiliknya.

### `GET /api/v1/packages/{name}/versions/{version}/security`

Mengembalikan ringkasan keamanan dan kepercayaan rilis paket yang persis untuk klien
instalasi. Ini adalah permukaan konsumsi OpenClaw publik untuk memutuskan apakah
rilis yang di-resolve dapat diinstal.

Autentikasi:

- Endpoint baca publik. Tidak diperlukan token pemilik, publisher, moderator, atau admin.

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
  paket registry yang di-resolve.
- `release.releaseId`, `release.version`, dan `release.createdAt` mengidentifikasi
  rilis persis yang dievaluasi.
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum`, dan `release.npmTarballName` ada saat diketahui untuk
  artefak rilis.
- `trust.scanStatus` adalah status kepercayaan efektif yang diturunkan dari input pemindai
  dan moderasi rilis manual.
- `trust.moderationState` dapat null. Nilainya `null` saat tidak ada moderasi rilis
  manual.
- `trust.blockedFromDownload` adalah sinyal blokir instalasi. OpenClaw dan klien
  instalasi lain harus memblokir instalasi saat nilai ini adalah `true` alih-alih
  menurunkan ulang aturan pemblokiran dari field pemindai atau moderasi.
- `trust.reasons` adalah daftar penjelasan yang ditujukan kepada pengguna dan untuk audit. Kode alasan
  adalah string stabil dan ringkas seperti `manual:quarantined`, `scan:malicious`,
  `static:malicious`, `vt:suspicious`, dan `package:malicious`.
- `trust.pending` berarti satu atau beberapa input kepercayaan masih menunggu penyelesaian.
- `trust.stale` berarti ringkasan kepercayaan dihitung dari input yang kedaluwarsa dan
  harus diperlakukan sebagai memerlukan penyegaran sebelum keputusan izin dengan keyakinan tinggi.

Catatan:

- Endpoint ini spesifik versi. Klien harus memanggilnya setelah me-resolve
  versi paket yang ingin mereka instal, bukan hanya setelah membaca metadata paket terbaru.
- Paket privat mengembalikan `404` kecuali pemanggil dapat membaca publisher pemiliknya.
- Endpoint ini sengaja lebih sempit daripada endpoint moderasi pemilik/moderator.
  Endpoint ini mengekspos keputusan instalasi dan penjelasan publik, bukan
  identitas pelapor, isi laporan, bukti privat, atau linimasa peninjauan internal.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Mengembalikan metadata resolver artefak eksplisit untuk sebuah versi paket.

Catatan:

- Versi paket legacy mengembalikan artefak `legacy-zip` dan `downloadUrl` ZIP
  legacy.
- Versi ClawPack mengembalikan artefak `npm-pack`, field integritas npm, sebuah
  `tarballUrl`, dan URL kompatibilitas ZIP legacy.
- Ini adalah permukaan resolver OpenClaw; ini menghindari penebakan format arsip dari
  URL bersama.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Mengunduh artefak versi melalui path resolver eksplisit.

Catatan:

- Versi ClawPack mengalirkan byte `.tgz` npm-pack unggahan yang persis.
- Versi ZIP legacy mengalihkan ke `/api/v1/packages/{name}/download?version=`.
- Menggunakan bucket laju unduhan.

### `GET /api/v1/packages/{name}/readiness`

Mengembalikan kesiapan yang dihitung untuk konsumsi OpenClaw di masa mendatang.

Pemeriksaan kesiapan mencakup:

- status channel resmi
- ketersediaan versi terbaru
- ketersediaan artefak npm-pack ClawPack
- digest artefak
- repositori sumber dan asal-usul commit
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

Endpoint moderator untuk mencantumkan baris migrasi Plugin OpenClaw resmi.

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

Laporkan paket untuk ditinjau moderator. Laporan bersifat tingkat paket, opsional
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
- `quarantined`: diblokir menunggu tindak lanjut.
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
- Paket privat mengembalikan `404` kecuali pemanggil dapat membaca penerbit pemilik.

### `GET /api/v1/packages/{name}/download`

Mengunduh arsip ZIP deterministik lama untuk rilis paket.

Parameter kueri:

- `version` (opsional)
- `tag` (opsional)

Catatan:

- Default ke rilis terbaru.
- Skills mengalihkan ke `GET /api/v1/download`.
- Arsip Plugin/paket adalah file zip dengan root `package/` sehingga klien OpenClaw
  lama tetap berfungsi.
- Rute ini tetap hanya ZIP. Rute ini tidak melakukan streaming file ClawPack `.tgz`.
- Respons menyertakan header `ETag`, `Digest`, `X-ClawHub-Artifact-Type`, dan
  `X-ClawHub-Artifact-Sha256` untuk pemeriksaan integritas resolver.
- Metadata khusus registri tidak disisipkan ke dalam arsip yang diunduh.
- Pemindaian VirusTotal yang tertunda tidak memblokir unduhan; rilis berbahaya mengembalikan `403`.
- Paket privat mengembalikan `404` kecuali pemanggil adalah pemilik.

### `GET /api/npm/{package}`

Mengembalikan packument yang kompatibel dengan npm untuk versi paket berbasis ClawPack.

Catatan:

- Hanya versi dengan tarball ClawPack npm-pack yang diunggah yang dicantumkan.
- Versi lama yang hanya ZIP sengaja dihilangkan.
- `dist.tarball`, `dist.integrity`, dan `dist.shasum` menggunakan field yang kompatibel dengan npm
  sehingga pengguna dapat mengarahkan npm ke mirror jika mereka memilih.
- Packument paket berscope mendukung jalur permintaan `/api/npm/@scope/name` dan
  jalur request terenkripsi npm `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Melakukan streaming byte tarball ClawPack yang persis diunggah untuk klien mirror npm.

Catatan:

- Menggunakan bucket laju unduhan.
- Header unduhan menyertakan SHA-256 ClawHub serta metadata integrity/shasum npm.
- Pemeriksaan moderasi dan akses paket privat tetap berlaku.

### `GET /api/v1/resolve`

Digunakan oleh CLI untuk memetakan fingerprint lokal ke versi yang dikenal.

Parameter kueri:

- `slug` (wajib)
- `hash` (wajib): sha256 heksadesimal 64 karakter dari fingerprint bundle

Respons:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Mengunduh zip versi Skills.

Parameter kueri:

- `slug` (wajib)
- `version` (opsional): string semver
- `tag` (opsional): nama tag (mis. `latest`)

Catatan:

- Jika `version` maupun `tag` tidak diberikan, versi terbaru digunakan.
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
- Body JSON dengan `files` (berbasis storageId) juga diterima.
- Field payload opsional: `ownerHandle`. Saat ada, API me-resolve
  penerbit tersebut di sisi server dan mengharuskan aktor memiliki akses penerbit.
- Field payload opsional: `migrateOwner`. Saat `true` dengan `ownerHandle`, Skills
  yang sudah ada dapat dipindahkan ke pemilik tersebut jika aktor adalah admin/pemilik pada
  penerbit saat ini maupun target. Tanpa opt-in ini, perubahan pemilik
  ditolak.

### `POST /api/v1/packages`

Menerbitkan rilis code-plugin atau bundle-plugin.

- Memerlukan autentikasi token Bearer.
- Disarankan: `multipart/form-data` dengan JSON `payload` + blob `files[]`.
- Body JSON dengan `files` (berbasis storageId) juga diterima.
- Field payload opsional: `ownerHandle`. Saat ada, hanya admin yang dapat menerbitkan atas nama pemilik tersebut.

Sorotan validasi:

- `family` harus berupa `code-plugin` atau `bundle-plugin`.
- Paket Plugin memerlukan `openclaw.plugin.json`. Unggahan ClawPack `.tgz` harus
  memuatnya di `package/openclaw.plugin.json`.
- Plugin kode memerlukan `package.json`, metadata repo sumber, metadata commit sumber,
  metadata skema config, `openclaw.compat.pluginApi`, dan
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` dan `openclaw.environment` adalah metadata opsional.
- Hanya penerbit tepercaya yang dapat menerbitkan ke kanal `official`.
- Penerbitan atas nama tetap memvalidasi kelayakan kanal resmi terhadap akun pemilik target.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Menghapus sementara / memulihkan Skills (pemilik, moderator, atau admin).

Body JSON opsional:

```json
{ "reason": "Held for moderation pending legal review." }
```

Saat ada, `reason` disimpan sebagai catatan moderasi Skills dan disalin ke log audit.
Penghapusan sementara yang diprakarsai pemilik mencadangkan slug selama 30 hari, lalu slug dapat diklaim oleh
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
- `404`: Skills/pengguna tidak ditemukan
- `500`: kesalahan server internal

### `POST /api/v1/users/publisher`

Khusus admin. Memastikan penerbit org ada untuk sebuah handle. Jika handle masih mengarah ke
penerbit pengguna/pribadi bersama lama, endpoint terlebih dahulu memigrasikannya menjadi penerbit org.

- Body: `{ "handle": "openclaw", "displayName": "OpenClaw", "trusted": true }`
- Respons: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true }`

### `POST /api/v1/users/reserve`

Khusus admin. Mencadangkan slug root dan nama paket untuk pemilik yang berhak tanpa menerbitkan
rilis. Nama paket menjadi paket placeholder privat tanpa baris rilis, sehingga pemilik yang sama
nantinya dapat menerbitkan rilis code-plugin atau bundle-plugin asli ke nama tersebut.

- Body: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Respons: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### Endpoint pengelolaan slug pemilik

- `POST /api/v1/skills/{slug}/rename`
  - Body: `{ "newSlug": "new-canonical-slug" }`
  - Respons: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - Body: `{ "targetSlug": "canonical-target-slug" }`
  - Respons: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

Catatan:

- Kedua endpoint memerlukan autentikasi token API dan hanya berfungsi untuk pemilik Skills.
- `rename` mempertahankan slug sebelumnya sebagai alias pengalihan.
- `merge` menyembunyikan listing sumber dan mengalihkan slug sumber ke listing target.

### Endpoint transfer kepemilikan

- `POST /api/v1/skills/{slug}/transfer`
  - Body: `{ "toUserHandle": "target_handle", "message": "optional" }`
  - Respons: `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - Respons (terima/tolak/batalkan): `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - Bentuk respons: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

Blokir pengguna dan hapus permanen Skills miliknya (hanya moderator/admin).

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

Buka blokir pengguna dan pulihkan Skills yang memenuhi syarat (hanya admin).

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
- `limit` (opsional): hasil maksimum (default 20, maks. 200)

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

## Endpoint CLI legacy (tidak digunakan lagi)

Masih didukung untuk versi CLI yang lebih lama:

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
- `/.well-known/clawdhub.json` (legacy)

Skema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Jika Anda meng-host sendiri, layankan file ini (atau atur `CLAWHUB_REGISTRY` secara eksplisit; legacy `CLAWDHUB_REGISTRY`).
