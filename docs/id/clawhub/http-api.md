---
read_when:
    - Menambahkan/mengubah titik akhir
    - Men-debug permintaan CLI ↔ registri
summary: Referensi API HTTP (endpoint publik + endpoint CLI + autentikasi).
x-i18n:
    generated_at: "2026-05-10T19:25:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: d1580df58fe2342858dd2c86ebaf659993157b11508c0fc03530e541bd0118ae
    source_path: clawhub/http-api.md
    workflow: 16
---

# API HTTP

URL dasar: `https://clawhub.ai` (default).

Semua path v1 berada di bawah `/api/v1/...`.
Legacy `/api/...` dan `/api/cli/...` tetap ada untuk kompatibilitas (lihat `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## Penggunaan ulang katalog publik

Direktori pihak ketiga dapat menggunakan endpoint baca publik untuk mencantumkan atau mencari Skills ClawHub. Harap cache hasil, hormati `429`/`Retry-After`, tautkan pengguna kembali ke daftar ClawHub kanonis (`https://clawhub.ai/<owner>/<slug>`), dan hindari menyiratkan dukungan ClawHub terhadap situs pihak ketiga. Jangan mencoba mencerminkan konten tersembunyi, privat, atau diblokir moderasi di luar permukaan API publik.

Pintasan slug web diselesaikan lintas keluarga registry, tetapi klien API sebaiknya menggunakan
URL kanonis yang dikembalikan oleh endpoint baca, bukan merekonstruksi presedensi
rute.

## Batas laju

Model penegakan:

- Permintaan anonim: diberlakukan per IP.
- Permintaan terautentikasi (token Bearer valid): diberlakukan per bucket pengguna.
- Jika token hilang/tidak valid, perilaku kembali ke penegakan IP.
- Endpoint tulis terautentikasi tidak seharusnya mengembalikan `Unauthorized` mentah saat
  server mengetahui alasannya. Token yang hilang, token tidak valid/dicabut, dan
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
- `RateLimit-Reset`: detik hingga reset (delay)
- `Retry-After`: detik untuk menunggu sebelum mencoba ulang (delay) pada `429`

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

- Jika `Retry-After` ada, tunggu selama jumlah detik tersebut sebelum mencoba ulang.
- Gunakan backoff dengan jitter untuk menghindari percobaan ulang tersinkronisasi.
- Jika `Retry-After` tidak ada, fallback ke `RateLimit-Reset` (atau hitung dari `X-RateLimit-Reset`).

Sumber IP:

- Menggunakan `cf-connecting-ip` (Cloudflare) untuk IP klien secara default.
- ClawHub menggunakan header penerusan tepercaya untuk mengidentifikasi IP klien di edge.
- Jika tidak ada IP klien tepercaya yang tersedia, permintaan unduh anonim menggunakan bucket fallback berskala endpoint, bukan satu bucket global `ip:unknown`. Permintaan baca/tulis anonim tetap menggunakan bucket unknown bersama agar perutean IP hilang tetap terlihat dan konservatif.

## Endpoint publik (tanpa autentikasi)

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

- Hasil dikembalikan dalam urutan relevansi (kemiripan embedding + peningkatan token slug/nama persis + prior popularitas dari unduhan).
- Relevansi lebih kuat daripada popularitas. Kecocokan token slug atau nama tampilan yang presisi dapat mengungguli kecocokan yang lebih longgar dengan unduhan jauh lebih banyak.
- Teks ASCII ditokenisasi pada batas kata dan tanda baca. Misalnya, `personal-map` berisi token `map` mandiri, sedangkan `amap-jsapi-skill` berisi `amap`, `jsapi`, dan `skill`; karena itu pencarian untuk `map` memberi `personal-map` kecocokan leksikal yang lebih kuat daripada `amap-jsapi-skill`.
- Unduhan digunakan sebagai prior kecil berskala log dan pemecah seri, bukan sebagai sinyal peringkat utama. Skills dengan unduhan tinggi dapat berperingkat lebih rendah saat teks kueri memiliki kecocokan lebih lemah.
- Status moderasi mencurigakan atau tersembunyi dapat menghapus Skill dari pencarian publik bergantung pada filter pemanggil dan status moderasi saat ini.

Panduan keterlihatan penerbit:

- Letakkan istilah yang benar-benar akan dicari pengguna di nama tampilan, ringkasan, dan tag. Gunakan token slug mandiri hanya saat itu juga merupakan identitas stabil yang ingin Anda pertahankan.
- Jangan mengganti nama slug hanya untuk mengejar satu kueri kecuali slug baru adalah nama kanonis jangka panjang yang lebih baik. Slug lama menjadi alias pengalihan, tetapi URL kanonis, slug yang ditampilkan, dan digest pencarian mendatang menggunakan slug baru.
- Alias penggantian nama mempertahankan resolusi untuk URL lama dan instalasi yang diselesaikan melalui registry, tetapi peringkat pencarian didasarkan pada metadata Skill kanonis setelah penggantian nama terindeks. Statistik yang ada tetap bersama Skill.
- Jika suatu Skill tiba-tiba tidak terlihat, periksa status moderasi terlebih dahulu dengan `clawhub inspect <slug>` saat login sebelum mengubah metadata terkait peringkat.

### `GET /api/v1/skills`

Parameter kueri:

- `limit` (opsional): integer (1–200)
- `cursor` (opsional): kursor paginasi untuk sort non-`trending`
- `sort` (opsional): `updated` (default), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), `installsCurrent` (alias: `installs`), `installsAllTime`, `trending`
- `nonSuspiciousOnly` (opsional): `true` untuk menyembunyikan Skills mencurigakan (`flagged.suspicious`)
- `nonSuspicious` (opsional): alias legacy untuk `nonSuspiciousOnly`

Catatan:

- `trending` memberi peringkat berdasarkan instalasi dalam 7 hari terakhir (berbasis telemetri).
- `createdAt` stabil untuk crawl Skill baru; `updated` berubah saat Skill yang ada dipublikasikan ulang.
- Saat `nonSuspiciousOnly=true`, sort berbasis kursor dapat mengembalikan item lebih sedikit dari `limit` pada satu halaman karena Skill mencurigakan difilter setelah pengambilan halaman.
- Gunakan `nextCursor` untuk melanjutkan paginasi saat tersedia. Halaman pendek tidak dengan sendirinya berarti akhir hasil.

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

- Slug lama yang dibuat oleh alur penggantian nama/penggabungan owner diselesaikan ke Skill kanonis.
- `metadata.os`: Pembatasan OS yang dideklarasikan dalam frontmatter Skill (mis. `["macos"]`, `["linux"]`). `null` jika tidak dideklarasikan.
- `metadata.systems`: Target sistem Nix (mis. `["aarch64-darwin", "x86_64-linux"]`). `null` jika tidak dideklarasikan.
- `metadata` adalah `null` jika Skill tidak memiliki metadata platform.
- `moderation` disertakan hanya saat Skill ditandai atau owner sedang melihatnya.

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

- Owner dan moderator dapat mengakses detail moderasi untuk Skill tersembunyi.
- Pemanggil publik hanya mendapatkan `200` untuk Skill terlihat yang sudah ditandai.
- Bukti disunting untuk pemanggil publik dan hanya menyertakan cuplikan mentah untuk owner/moderator.

### `POST /api/v1/skills/{slug}/report`

Laporkan Skill untuk peninjauan moderator. Laporan berada pada level Skill, secara opsional ditautkan
ke versi, dan masuk ke antrean laporan Skill.

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

### `POST /api/v1/skills/{slug}/appeal`

Endpoint owner/penerbit Skill untuk mengajukan banding moderasi pada Skill.

Autentikasi:

- Memerlukan token API untuk owner Skill atau anggota penerbit.

Permintaan:

```json
{ "version": "1.2.3", "message": "The flagged command is documented setup." }
```

Banding diterima untuk hasil Skill yang tersembunyi, dihapus, mencurigakan, berbahaya, atau
ditandai pemindai. ClawHub menyimpan satu banding terbuka per Skill.

Respons:

```json
{
  "ok": true,
  "submitted": true,
  "alreadyOpen": false,
  "appealId": "skillAppeals:...",
  "skillId": "skills:...",
  "status": "open"
}
```

### `POST /api/v1/skills/{slug}/rescan`

Meminta pemindaian ulang keamanan untuk versi Skill terbaru yang dipublikasikan.

Autentikasi:

- Memerlukan token API untuk owner Skill, admin penerbit, moderator platform,
  atau admin platform.
- Owner dan admin penerbit tunduk pada batas pemulihan owner per versi.
  Moderator dan admin platform tidak, tetapi ClawHub tetap hanya mengizinkan
  satu pemindaian ulang aktif per versi.

Respons:

```json
{
  "ok": true,
  "targetKind": "skill",
  "name": "gifgrep",
  "version": "1.2.3",
  "status": "in_progress",
  "remainingRequests": 2,
  "maxRequests": 3,
  "pendingRequestId": "rescanRequests:..."
}
```

### `GET /api/v1/skills/-/reports`

Endpoint moderator/admin untuk penerimaan laporan Skill.

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

Endpoint moderator/admin untuk menyelesaikan atau membuka kembali laporan Skill.

Permintaan:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` wajib untuk `confirmed` dan `dismissed`; dapat dihilangkan saat
mengatur `status` kembali ke `open`. Berikan `finalAction: "hide"` dengan laporan
yang sudah ditriase untuk menyembunyikan Skill dalam workflow yang sama dan dapat diaudit.

### `GET /api/v1/skills/-/appeals`

Endpoint moderator/admin untuk penerimaan banding Skill.

Parameter kueri:

- `status` (opsional): `open` (default), `accepted`, `rejected`, atau `all`
- `limit` (opsional): integer (1-200)
- `cursor` (opsional): kursor paginasi

### `POST /api/v1/skills/-/appeals/{appealId}/resolve`

Endpoint moderator/admin untuk menerima, menolak, atau membuka kembali banding Skill.
`note` wajib untuk `accepted` dan `rejected`; dapat dihilangkan saat mengatur
`status` kembali ke `open`. Berikan `finalAction: "restore"` dengan banding yang diterima
untuk membuat Skill tersedia kembali.

### `GET /api/v1/skills/{slug}/versions`

Parameter kueri:

- `limit` (opsional): integer
- `cursor` (opsional): kursor paginasi

### `GET /api/v1/skills/{slug}/versions/{version}`

Mengembalikan metadata versi + daftar file.

- `version.security` menyertakan status verifikasi pemindaian yang dinormalisasi dan detail pemindai
  (VirusTotal + LLM), jika tersedia.

### `GET /api/v1/skills/{slug}/scan`

Mengembalikan detail verifikasi pemindaian keamanan untuk versi skill.

Parameter kueri:

- `version` (opsional): string versi tertentu.
- `tag` (opsional): menyelesaikan versi bertag (misalnya `latest`).

Catatan:

- Jika `version` maupun `tag` tidak diberikan, menggunakan versi terbaru.
- Menyertakan status verifikasi yang dinormalisasi beserta detail khusus pemindai.
- `security.capabilityTags` menyertakan label kemampuan/risiko deterministik seperti
  `crypto`, `requires-wallet`, `can-make-purchases`, `can-sign-transactions`,
  `requires-oauth-token`, dan `posts-externally` saat terdeteksi.
- `security.hasScanResult` bernilai `true` hanya ketika pemindai menghasilkan putusan definitif (`clean`, `suspicious`, atau `malicious`).
- `moderation` adalah snapshot moderasi tingkat skill saat ini yang diturunkan dari versi terbaru.
- Saat meminta versi historis, periksa `moderation.matchesRequestedVersion` dan `moderation.sourceVersion` sebelum memperlakukan `moderation` dan `security` sebagai konteks versi yang sama.

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

- skill
- plugin kode
- plugin bundle

Parameter kueri:

- `limit` (opsional): integer (1–100)
- `cursor` (opsional): kursor paginasi
- `family` (opsional): `skill`, `code-plugin`, atau `bundle-plugin`
- `channel` (opsional): `official`, `community`, atau `private`
- `isOfficial` (opsional): `true` atau `false`
- `executesCode` (opsional): `true` atau `false`
- `capabilityTag` (opsional): filter kemampuan untuk paket plugin
- `target` / `hostTarget` (opsional): singkatan untuk `host:<target>`
- `os`, `arch`, `libc` (opsional): singkatan untuk filter kemampuan host
- `requiresBrowser`, `requiresDesktop`, `requiresNativeDeps`,
  `requiresExternalService`, `requiresBinary`, `requiresOsPermission`
  (opsional): singkatan `true`/`1` untuk tag persyaratan lingkungan
- `externalService`, `binary`, `osPermission` (opsional): singkatan untuk tag
  persyaratan lingkungan bernama
- `artifactKind` (opsional): `legacy-zip` atau `npm-pack`
- `npmMirror` (opsional): `true`/`1` untuk menampilkan versi paket yang didukung ClawPack
  yang tersedia melalui mirror npm

Catatan:

- `GET /api/v1/code-plugins` dan `GET /api/v1/bundle-plugins` tetap menjadi alias keluarga tetap.
- Entri skill tetap didukung oleh registri skill dan masih hanya dapat dipublikasikan melalui `POST /api/v1/skills`.
- `POST /api/v1/packages` masih hanya untuk rilis code-plugin dan bundle-plugin.
- Pemanggil anonim hanya melihat kanal paket publik.
- Pemanggil terautentikasi dapat melihat paket privat untuk penerbit tempat mereka menjadi anggota dalam hasil daftar/pencarian.
- `channel=private` hanya mengembalikan paket yang dapat dibaca oleh pemanggil terautentikasi.

### `GET /api/v1/packages/search`

Pencarian katalog terpadu di seluruh skill + paket plugin.

Parameter kueri:

- `q` (wajib): string kueri
- `limit` (opsional): integer (1–100)
- `family` (opsional): `skill`, `code-plugin`, atau `bundle-plugin`
- `channel` (opsional): `official`, `community`, atau `private`
- `isOfficial` (opsional): `true` atau `false`
- `executesCode` (opsional): `true` atau `false`
- `capabilityTag` (opsional): filter kemampuan untuk paket plugin
- `target` / `hostTarget`, `os`, `arch`, `libc`, `requiresBrowser`,
  `requiresDesktop`, `requiresNativeDeps`, `requiresExternalService`,
  `requiresBinary`, `requiresOsPermission`, `externalService`, `binary`, dan
  `osPermission` diterima sebagai singkatan untuk tag kemampuan umum
- `artifactKind` (opsional): `legacy-zip` atau `npm-pack`
- `npmMirror` (opsional): `true`/`1` untuk mencari versi paket yang didukung ClawPack
  yang tersedia melalui mirror npm

Catatan:

- Pemanggil anonim hanya melihat kanal paket publik.
- Pemanggil terautentikasi dapat mencari paket privat untuk penerbit tempat mereka menjadi anggota.
- `channel=private` hanya mengembalikan paket yang dapat dibaca oleh pemanggil terautentikasi.
- Filter artefak didukung oleh tag kemampuan terindeks:
  `artifact:legacy-zip`, `artifact:npm-pack`, dan `npm-mirror:available`.

### `GET /api/v1/packages/{name}`

Mengembalikan metadata detail paket.

Catatan:

- Skill juga dapat diselesaikan melalui rute ini di katalog terpadu.
- Paket privat mengembalikan `404` kecuali pemanggil dapat membaca penerbit pemiliknya.

### `DELETE /api/v1/packages/{name}`

Menghapus paket dan semua rilis secara lunak.

Catatan:

- Memerlukan token API untuk pemilik paket, pemilik/admin penerbit org,
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
- Rilis ClawPack menyertakan field kompatibel npm `npmIntegrity`, `npmShasum`, dan
  `npmTarballName`.
- `version.sha256hash`, `version.vtAnalysis`, `version.llmAnalysis`, dan `version.staticScan` disertakan saat data pemindaian ada.
- Paket privat mengembalikan `404` kecuali pemanggil dapat membaca penerbit pemiliknya.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Mengembalikan metadata resolver artefak eksplisit untuk versi paket.

Catatan:

- Versi paket legacy mengembalikan artefak `legacy-zip` dan `downloadUrl` ZIP
  legacy.
- Versi ClawPack mengembalikan artefak `npm-pack`, field integritas npm,
  `tarballUrl`, dan URL kompatibilitas ZIP legacy.
- Ini adalah permukaan resolver OpenClaw; ini menghindari penebakan format arsip dari
  URL bersama.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Mengunduh artefak versi melalui jalur resolver eksplisit.

Catatan:

- Versi ClawPack melakukan stream byte `.tgz` `npm-pack` yang diunggah secara persis.
- Versi ZIP legacy mengalihkan ke `/api/v1/packages/{name}/download?version=`.
- Menggunakan bucket batas laju unduhan.

### `GET /api/v1/packages/{name}/readiness`

Mengembalikan kesiapan yang dihitung untuk konsumsi OpenClaw di masa depan.

Pemeriksaan kesiapan mencakup:

- status kanal resmi
- ketersediaan versi terbaru
- ketersediaan artefak npm-pack ClawPack
- digest artefak
- provenance repo sumber dan commit
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

Endpoint moderator untuk mencantumkan baris migrasi plugin OpenClaw resmi.

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

Endpoint admin untuk membuat atau memperbarui baris migrasi plugin resmi.

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
  yang direncanakan.
- Ini hanya melacak kesiapan migrasi. Ini tidak mengubah OpenClaw atau membuat
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

- `open`: rilis mencurigakan, berbahaya, tertunda, dikarantina, dicabut, atau dilaporkan.
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

Melaporkan paket untuk peninjauan moderator. Laporan berada pada tingkat paket, secara opsional
ditautkan ke versi. Laporan tersebut masuk ke antrean moderasi tetapi tidak secara otomatis menyembunyikan atau
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

### `POST /api/v1/packages/{name}/appeal`

Endpoint pemilik/penerbit paket untuk mengajukan banding moderasi pada rilis.

Autentikasi:

- Memerlukan token API untuk pemilik paket atau anggota penerbit.

Permintaan:

```json
{
  "version": "1.2.3",
  "message": "The native binary is signed and matches the linked source release."
}
```

Banding hanya diterima untuk rilis yang dikarantina, dicabut,
mencurigakan, atau berbahaya. ClawHub menyimpan satu banding terbuka per rilis.

Respons:

```json
{
  "ok": true,
  "submitted": true,
  "alreadyOpen": false,
  "appealId": "packageAppeals:...",
  "packageId": "packages:...",
  "releaseId": "packageReleases:...",
  "status": "open"
}
```

### `POST /api/v1/packages/{name}/rescan`

Meminta pemindaian ulang keamanan untuk rilis paket terbaru yang diterbitkan.

Autentikasi:

- Memerlukan token API untuk pemilik paket, admin penerbit, moderator platform,
  atau admin platform.
- Pemilik dan admin penerbit tunduk pada batas pemulihan pemilik per rilis.
  Moderator dan admin platform tidak, tetapi ClawHub tetap hanya mengizinkan
  satu pemindaian ulang aktif per rilis.

Respons:

```json
{
  "ok": true,
  "targetKind": "package",
  "name": "@openclaw/example-plugin",
  "version": "1.2.3",
  "status": "in_progress",
  "remainingRequests": 2,
  "maxRequests": 3,
  "pendingRequestId": "rescanRequests:..."
}
```

### `GET /api/v1/packages/appeals`

Endpoint moderator/admin untuk penerimaan banding paket.

Autentikasi:

- Memerlukan token API untuk pengguna moderator atau admin.

Parameter kueri:

- `status` (opsional): `open` (default), `accepted`, `rejected`, atau `all`
- `limit` (opsional): bilangan bulat (1-100)
- `cursor` (opsional): kursor paginasi

Respons:

```json
{
  "items": [
    {
      "appealId": "packageAppeals:...",
      "packageId": "packages:...",
      "releaseId": "packageReleases:...",
      "name": "@openclaw/example-plugin",
      "displayName": "Example Plugin",
      "family": "code-plugin",
      "version": "1.2.3",
      "message": "The native binary is signed.",
      "status": "open",
      "createdAt": 1730000000000,
      "submitter": {
        "userId": "users:...",
        "handle": "publisher",
        "displayName": "Publisher"
      },
      "resolvedAt": null,
      "resolvedBy": null,
      "resolutionNote": null
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `POST /api/v1/packages/appeals/{appealId}/resolve`

Endpoint moderator/admin untuk menerima, menolak, atau membuka kembali banding.

Permintaan:

```json
{ "status": "accepted", "note": "False positive confirmed.", "finalAction": "approve" }
```

`note` wajib untuk `accepted` dan `rejected`; dapat dihilangkan saat
mengatur `status` kembali ke `open`. Berikan `finalAction: "approve"` bersama
banding yang diterima untuk menyetujui rilis terdampak dalam alur kerja yang
sama dan dapat diaudit.

Respons:

```json
{
  "ok": true,
  "appealId": "packageAppeals:...",
  "packageId": "packages:...",
  "releaseId": "packageReleases:...",
  "status": "rejected"
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

`note` wajib untuk `confirmed` dan `dismissed`; dapat dihilangkan saat
mengatur `status` kembali ke `open`. Berikan `finalAction: "quarantine"` atau
`finalAction: "revoke"` bersama laporan yang dikonfirmasi untuk menerapkan
moderasi rilis dalam alur kerja yang sama dan dapat diaudit.

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

Rilis yang dikarantina dan dicabut mengembalikan `403` dari rute pengunduhan artefak.
Setiap perubahan menulis entri log audit.

### `POST /api/v1/packages/backfill/artifacts`

Endpoint pemeliharaan khusus admin untuk memberi label pada rilis paket lama
dengan metadata jenis artefak eksplisit.

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
- Baris lama yang didukung ClawPack tetapi tidak memiliki `artifactKind`
  diperbaiki sebagai `npm-pack`.
- Ini tidak menghasilkan ClawPack atau mengubah byte artefak.

### `GET /api/v1/packages/{name}/file`

Mengembalikan konten teks mentah untuk file paket.

Parameter kueri:

- `path` (wajib)
- `version` (opsional)
- `tag` (opsional)

Catatan:

- Default ke rilis terbaru.
- Menggunakan bucket batas laju baca, bukan bucket unduhan.
- File biner mengembalikan `415`.
- Batas ukuran file: 200KB.
- Pemindaian VirusTotal yang tertunda tidak memblokir pembacaan; rilis berbahaya masih dapat ditahan di tempat lain.
- Paket privat mengembalikan `404` kecuali pemanggil dapat membaca penerbit pemiliknya.

### `GET /api/v1/packages/{name}/download`

Mengunduh arsip ZIP deterministik lama untuk rilis paket.

Parameter kueri:

- `version` (opsional)
- `tag` (opsional)

Catatan:

- Default ke rilis terbaru.
- Skills mengalihkan ke `GET /api/v1/download`.
- Arsip Plugin/paket adalah file zip dengan root `package/` sehingga klien
  OpenClaw lama tetap berfungsi.
- Rute ini tetap hanya ZIP. Rute ini tidak mengalirkan file `.tgz` ClawPack.
- Respons menyertakan header `ETag`, `Digest`, `X-ClawHub-Artifact-Type`, dan
  `X-ClawHub-Artifact-Sha256` untuk pemeriksaan integritas resolver.
- Metadata khusus registri tidak disisipkan ke arsip yang diunduh.
- Pemindaian VirusTotal yang tertunda tidak memblokir unduhan; rilis berbahaya mengembalikan `403`.
- Paket privat mengembalikan `404` kecuali pemanggil adalah pemiliknya.

### `GET /api/npm/{package}`

Mengembalikan packument yang kompatibel dengan npm untuk versi paket yang didukung ClawPack.

Catatan:

- Hanya versi dengan tarball npm-pack ClawPack yang diunggah yang dicantumkan.
- Versi lama yang hanya ZIP sengaja dihilangkan.
- `dist.tarball`, `dist.integrity`, dan `dist.shasum` menggunakan bidang yang
  kompatibel dengan npm sehingga pengguna dapat mengarahkan npm ke mirror jika mereka memilih.
- Packument paket berscope mendukung jalur permintaan `/api/npm/@scope/name` dan
  jalur permintaan npm yang dienkode `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Mengalirkan byte tarball ClawPack persis seperti yang diunggah untuk klien mirror npm.

Catatan:

- Menggunakan bucket batas laju unduhan.
- Header unduhan menyertakan SHA-256 ClawHub beserta metadata integritas/shasum npm.
- Pemeriksaan moderasi dan akses paket privat tetap berlaku.

### `GET /api/v1/resolve`

Digunakan oleh CLI untuk memetakan sidik jari lokal ke versi yang dikenal.

Parameter kueri:

- `slug` (wajib)
- `hash` (wajib): sha256 heksadesimal 64 karakter dari sidik jari bundel

Respons:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Mengunduh zip dari versi Skills.

Parameter kueri:

- `slug` (wajib)
- `version` (opsional): string semver
- `tag` (opsional): nama tag (mis. `latest`)

Catatan:

- Jika `version` maupun `tag` tidak diberikan, versi terbaru digunakan.
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
- Bidang payload opsional: `ownerHandle`. Saat ada, API menyelesaikan penerbit
  tersebut di sisi server dan mengharuskan aktor memiliki akses penerbit.
- Bidang payload opsional: `migrateOwner`. Saat `true` dengan `ownerHandle`,
  Skills yang ada dapat dipindahkan ke pemilik tersebut jika aktor adalah admin/pemilik pada penerbit
  saat ini dan target. Tanpa opt-in ini, perubahan pemilik
  ditolak.

### `POST /api/v1/packages`

Menerbitkan rilis code-plugin atau bundle-plugin.

- Memerlukan autentikasi token Bearer.
- Disarankan: `multipart/form-data` dengan JSON `payload` + blob `files[]`.
- Isi JSON dengan `files` (berbasis storageId) juga diterima.
- Bidang payload opsional: `ownerHandle`. Saat ada, hanya admin yang dapat menerbitkan atas nama pemilik tersebut.

Sorotan validasi:

- `family` harus `code-plugin` atau `bundle-plugin`.
- Paket Plugin memerlukan `openclaw.plugin.json`. Unggahan `.tgz` ClawPack harus
  memuatnya di `package/openclaw.plugin.json`.
- Code Plugin memerlukan `package.json`, metadata repo sumber, metadata commit
  sumber, metadata skema konfigurasi, `openclaw.compat.pluginApi`, dan
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` dan `openclaw.environment` adalah metadata opsional.
- Hanya penerbit tepercaya yang dapat menerbitkan ke kanal `official`.
- Penerbitan atas nama tetap memvalidasi kelayakan kanal resmi terhadap akun pemilik target.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Menghapus lunak / memulihkan Skills (pemilik, moderator, atau admin).

Isi JSON opsional:

```json
{ "reason": "Held for moderation pending legal review." }
```

Saat ada, `reason` disimpan sebagai catatan moderasi Skills dan disalin ke log audit.
Penghapusan lunak yang dimulai oleh pemilik mencadangkan slug selama 30 hari, lalu slug dapat diklaim oleh
penerbit lain. Respons penghapusan menyertakan `slugReservedUntil` saat kedaluwarsa ini berlaku.
Penyembunyian oleh moderator/admin dan penghapusan keamanan tidak kedaluwarsa dengan cara ini.

Respons penghapusan:

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

Khusus admin. Memastikan penerbit org ada untuk sebuah handle. Jika handle masih menunjuk ke
penerbit pengguna bersama/pribadi lama, endpoint memigrasikannya ke penerbit org terlebih dahulu.

- Isi: `{ "handle": "openclaw", "displayName": "OpenClaw", "trusted": true }`
- Respons: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true }`

### `POST /api/v1/users/reserve`

Khusus admin. Mencadangkan slug root dan nama paket untuk pemilik yang sah tanpa menerbitkan sebuah
rilis. Nama paket menjadi paket placeholder privat tanpa baris rilis, sehingga pemilik yang sama
nantinya dapat menerbitkan rilis code-plugin atau bundle-plugin asli ke nama tersebut.

- Body: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Respons: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### Endpoint manajemen slug pemilik

- `POST /api/v1/skills/{slug}/rename`
  - Body: `{ "newSlug": "new-canonical-slug" }`
  - Respons: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - Body: `{ "targetSlug": "canonical-target-slug" }`
  - Respons: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

Catatan:

- Kedua endpoint memerlukan autentikasi token API dan hanya berfungsi untuk pemilik skill.
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

Blokir pengguna dan hapus permanen skill yang dimilikinya (hanya moderator/admin).

Body:

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

Buka blokir pengguna dan pulihkan skill yang memenuhi syarat (hanya admin).

Body:

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

Body:

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

Daftar atau cari pengguna (hanya admin).

Parameter query:

- `q` (opsional): kueri pencarian
- `query` (opsional): alias untuk `q`
- `limit` (opsional): hasil maksimum (default 20, maksimum 200)

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

Tambah/hapus bintang (sorotan). Kedua endpoint bersifat idempotent.

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

## Penemuan registry (`/.well-known/clawhub.json`)

CLI dapat menemukan pengaturan registry/autentikasi dari situs:

- `/.well-known/clawhub.json` (JSON, disarankan)
- `/.well-known/clawdhub.json` (warisan)

Skema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Jika Anda melakukan self-host, sajikan berkas ini (atau tetapkan `CLAWHUB_REGISTRY` secara eksplisit; `CLAWDHUB_REGISTRY` warisan).
