---
read_when:
    - Menambahkan/mengubah endpoint
    - Men-debug permintaan CLI ↔ registry
summary: Referensi API HTTP (publik + endpoint CLI + autentikasi).
x-i18n:
    generated_at: "2026-07-04T20:42:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# API HTTP

URL dasar: `https://clawhub.ai` (default).

Semua path v1 berada di bawah `/api/v1/...`.
`/api/...` dan `/api/cli/...` lama tetap tersedia untuk kompatibilitas (lihat `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## Penggunaan ulang katalog publik

Direktori pihak ketiga dapat menggunakan endpoint baca publik untuk mencantumkan atau mencari skill ClawHub. Harap cache hasil, patuhi `429`/`Retry-After`, tautkan pengguna kembali ke listing ClawHub kanonis (`https://clawhub.ai/<owner>/skills/<slug>`), dan hindari memberi kesan bahwa ClawHub mendukung situs pihak ketiga tersebut. Jangan mencoba mencerminkan konten tersembunyi, privat, atau diblokir moderasi di luar permukaan API publik.

Pintasan slug web di-resolve lintas keluarga registry, tetapi klien API sebaiknya menggunakan
URL kanonis yang dikembalikan oleh endpoint baca alih-alih merekonstruksi prioritas
route.

## Batas laju

Model penegakan:

- Permintaan anonim: diberlakukan per IP.
- Permintaan terautentikasi (token Bearer valid): diberlakukan per bucket pengguna.
- Jika token hilang/tidak valid, perilaku fallback ke penegakan IP.
- Endpoint tulis terautentikasi sebaiknya tidak mengembalikan `Unauthorized` kosong ketika
  server mengetahui alasannya. Token yang hilang, token tidak valid/dicabut, dan
  akun yang dihapus/diblokir/dinonaktifkan masing-masing harus mendapatkan teks yang dapat ditindaklanjuti agar klien
  CLI dapat memberi tahu pengguna apa yang memblokir mereka.

- Baca: 3000/menit per IP, 12000/menit per kunci
- Tulis: 300/menit per IP, 3000/menit per kunci
- Unduh: 1200/menit per IP, 6000/menit per kunci (endpoint unduhan)

Header:

- Kompatibilitas lama: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- Terstandarkan: `RateLimit-Limit`, `RateLimit-Reset`
- Pada `429`: `X-RateLimit-Remaining: 0` dan `RateLimit-Remaining: 0`
- Pada `429`: `Retry-After`

Semantik header:

- `X-RateLimit-Reset`: detik epoch Unix absolut
- `RateLimit-Reset`: detik hingga reset (jeda)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: anggaran tersisa yang tepat saat ada.
  Permintaan berhasil yang di-shard menghilangkan header ini alih-alih mengembalikan nilai global perkiraan.
- `Retry-After`: detik untuk menunggu sebelum mencoba lagi (jeda) pada `429`

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

- Jika `Retry-After` ada, tunggu sebanyak itu detik sebelum mencoba lagi.
- Gunakan backoff dengan jitter untuk menghindari percobaan ulang yang tersinkronisasi.
- Jika `Retry-After` tidak ada, fallback ke `RateLimit-Reset` (atau hitung dari `X-RateLimit-Reset`).

Sumber IP:

- Menggunakan header IP klien tepercaya, termasuk `cf-connecting-ip`, hanya ketika
  deployment secara eksplisit mengaktifkan header diteruskan tepercaya.
- ClawHub menggunakan header penerusan tepercaya untuk mengidentifikasi IP klien di edge.
- Jika tidak ada IP klien tepercaya yang tersedia, permintaan anonim menggunakan bucket fallback
  yang dicakup hanya berdasarkan jenis batas laju. Bucket fallback ini tidak menyertakan
  path, slug, nama paket, versi, string kueri, atau parameter
  artefak lain yang disediakan pemanggil.

## Respons kesalahan

Respons kesalahan v1 publik berupa teks biasa dengan `content-type: text/plain; charset=utf-8`.
Ini mencakup kegagalan validasi (`400`), sumber daya publik yang hilang (`404`), kegagalan autentikasi dan
izin (`401`/`403`), batas laju (`429`), dan unduhan yang diblokir. Klien
sebaiknya membaca body respons sebagai string yang dapat dibaca manusia. Parameter kueri yang tidak dikenal
diabaikan untuk kompatibilitas, tetapi parameter kueri yang dikenali dengan nilai tidak valid mengembalikan
`400`.

## Endpoint publik (tanpa autentikasi)

### `GET /api/v1/search`

Parameter kueri:

- `q` (wajib): string kueri
- `limit` (opsional): bilangan bulat
- `highlightedOnly` (opsional): `true` untuk memfilter ke skill yang disorot
- `nonSuspiciousOnly` (opsional): `true` untuk menyembunyikan skill mencurigakan (`flagged.suspicious`)
- `nonSuspicious` (opsional): alias lama untuk `nonSuspiciousOnly`

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
      "updatedAt": 1730000000000,
      "ownerHandle": "openclaw",
      "owner": {
        "handle": "openclaw",
        "displayName": "OpenClaw",
        "image": "https://example.com/avatar.png"
      }
    }
  ]
}
```

Catatan:

- Hasil dikembalikan dalam urutan relevansi (kemiripan embedding + peningkatan token slug/nama eksak + prior popularitas kecil).
- Relevansi lebih kuat daripada popularitas. Kecocokan token slug atau nama tampilan yang tepat dapat mengungguli kecocokan yang lebih longgar dengan engagement yang jauh lebih kuat.
- Teks ASCII ditokenisasi pada batas kata dan tanda baca. Misalnya, `personal-map` berisi token mandiri `map`, sedangkan `amap-jsapi-skill` berisi `amap`, `jsapi`, dan `skill`; karena itu pencarian `map` memberi `personal-map` kecocokan leksikal yang lebih kuat daripada `amap-jsapi-skill`.
- Popularitas diskalakan log dan dibatasi. Skill dengan engagement tinggi dapat berperingkat lebih rendah ketika teks kueri memiliki kecocokan yang lebih lemah.
- Status moderasi mencurigakan atau tersembunyi dapat menghapus skill dari pencarian publik bergantung pada filter pemanggil dan status moderasi saat ini.

Panduan keterlihatan penerbit:

- Letakkan istilah yang benar-benar akan dicari pengguna di nama tampilan, ringkasan, dan tag. Gunakan token slug mandiri hanya ketika itu juga merupakan identitas stabil yang ingin Anda pertahankan.
- Jangan mengganti nama slug hanya untuk mengejar satu kueri kecuali slug baru adalah nama kanonis jangka panjang yang lebih baik. Slug lama menjadi alias redirect, tetapi URL kanonis, slug yang ditampilkan, dan digest pencarian mendatang menggunakan slug baru.
- Alias penggantian nama mempertahankan resolution untuk URL lama dan instalasi yang di-resolve melalui registry, tetapi peringkat pencarian didasarkan pada metadata skill kanonis setelah penggantian nama terindeks. Statistik yang ada tetap bersama skill.
- Jika skill tiba-tiba tidak terlihat, periksa status moderasi terlebih dahulu dengan `clawhub inspect @owner/slug` saat sudah masuk sebelum mengubah metadata terkait peringkat.

### `GET /api/v1/skills`

Parameter kueri:

- `limit` (opsional): bilangan bulat (1–200)
- `cursor` (opsional): cursor pagination untuk sort non-`trending` apa pun
- `sort` (opsional): `updated` (default), `recommended` (alias: `default`), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), alias instalasi lama `installsCurrent`/`installs`/`installsAllTime` dipetakan ke `downloads`, `trending`
- `nonSuspiciousOnly` (opsional): `true` untuk menyembunyikan skill mencurigakan (`flagged.suspicious`)
- `nonSuspicious` (opsional): alias lama untuk `nonSuspiciousOnly`

Nilai `sort` tidak valid mengembalikan `400`.

Catatan:

- `recommended` menggunakan sinyal engagement dan kebaruan.
- `trending` memberi peringkat berdasarkan instalasi dalam 7 hari terakhir (berbasis telemetri).
- `createdAt` stabil untuk crawl skill baru; `updated` berubah ketika skill yang ada dipublikasikan ulang.
- Ketika `nonSuspiciousOnly=true`, sort berbasis cursor dapat mengembalikan item lebih sedikit daripada `limit` pada satu halaman karena skill mencurigakan difilter setelah pengambilan halaman.
- Gunakan `nextCursor` untuk melanjutkan pagination saat ada. Halaman pendek tidak dengan sendirinya berarti hasil telah berakhir.

Respons:

```json
{
  "items": [
    {
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "summary": "…",
      "topics": ["Productivity"],
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
    "topics": ["Productivity"],
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

- Slug lama yang dibuat oleh alur penggantian nama/penggabungan owner di-resolve ke skill kanonis.
- `metadata.os`: batasan OS yang dideklarasikan dalam frontmatter skill (mis. `["macos"]`, `["linux"]`). `null` jika tidak dideklarasikan.
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

- Owner dan moderator dapat mengakses detail moderasi untuk skill tersembunyi.
- Pemanggil publik hanya mendapatkan `200` untuk skill terlihat yang sudah ditandai.
- Bukti disunting untuk pemanggil publik dan hanya menyertakan cuplikan mentah untuk owner/moderator.

### `POST /api/v1/skills/{slug}/report`

Laporkan skill untuk peninjauan moderator. Laporan berada pada tingkat skill, dapat secara opsional ditautkan
ke versi, dan masuk ke antrean laporan skill.

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

Endpoint moderator/admin untuk penerimaan laporan skill.

Parameter kueri:

- `status` (opsional): `open` (default), `confirmed`, `dismissed`, atau `all`
- `limit` (opsional): bilangan bulat (1-200)
- `cursor` (opsional): cursor pagination

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

Endpoint moderator/admin untuk menyelesaikan atau membuka ulang laporan skill.

Permintaan:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` wajib untuk `confirmed` dan `dismissed`; ini dapat dihilangkan ketika
mengatur `status` kembali ke `open`. Kirim `finalAction: "hide"` dengan laporan yang telah ditriage
untuk menyembunyikan skill dalam workflow yang sama dan dapat diaudit.

### `GET /api/v1/skills/{slug}/versions`

Parameter kueri:

- `limit` (opsional): bilangan bulat
- `cursor` (opsional): cursor pagination

### `GET /api/v1/skills/{slug}/versions/{version}`

Mengembalikan metadata versi + daftar file.

- `version.security` menyertakan status verifikasi pemindaian yang dinormalisasi dan detail scanner
  (VirusTotal + LLM), saat tersedia.

### `GET /api/v1/skills/{slug}/scan`

Mengembalikan detail verifikasi pemindaian keamanan untuk versi skill.

Parameter kueri:

- `version` (opsional): string versi tertentu.
- `tag` (opsional): resolve versi bertag (misalnya `latest`).

Catatan:

- Jika `version` maupun `tag` tidak diberikan, menggunakan versi terbaru.
- Menyertakan status verifikasi yang dinormalisasi beserta detail khusus pemindai.
- `security.hasScanResult` bernilai `true` hanya ketika pemindai menghasilkan putusan definitif (`clean`, `suspicious`, atau `malicious`).
- `moderation` adalah snapshot moderasi tingkat skill saat ini yang berasal dari versi terbaru.
- Saat mengkueri versi historis, periksa `moderation.matchesRequestedVersion` dan `moderation.sourceVersion` sebelum memperlakukan `moderation` dan `security` sebagai konteks versi yang sama.

### `POST /api/v1/skills/-/scan`

Endpoint pengiriman terautentikasi untuk pekerjaan ClawScan baru.

Pemindaian unggahan lokal tidak lagi didukung. Permintaan yang menggunakan
`multipart/form-data` atau `{ "source": { "kind": "upload" } }` mengembalikan `410`.

Pemindaian yang dipublikasikan menggunakan JSON:

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

Catatan:

- Payload permintaan pemindaian dan laporan yang dapat diunduh kedaluwarsa dari penyimpanan permintaan pemindaian setelah jendela retensi.
- Pemindaian yang dipublikasikan memerlukan akses manajemen pemilik/penerbit, atau kewenangan moderator/admin platform.
- Pemindaian yang dipublikasikan menulis balik hanya ketika `update: true` dan pemindaian berhasil selesai.
- Respons adalah `202` dengan `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`.
- Pekerjaan pemindaian bersifat asinkron. Permintaan pemindaian manual diprioritaskan di depan pekerjaan publikasi/backfill normal, tetapi penyelesaian tetap bergantung pada ketersediaan worker.

### `GET /api/v1/skills/-/scan/{scanId}`

Endpoint polling terautentikasi untuk pemindaian yang dikirimkan.

- Mengembalikan status queued/running/succeeded/failed.
- Mengembalikan `queue.queuedAhead` dan `queue.position` saat dalam antrean sehingga klien dapat menampilkan berapa banyak pemindaian manual yang diprioritaskan berada di depan permintaan. Antrean yang sangat besar dibatasi dan dilaporkan dengan `queuedAheadIsEstimate: true`.
- Jika tersedia, `report` berisi bagian `clawscan`, `skillspector`, `staticAnalysis`, dan `virustotal`.
- Pekerjaan pemindaian yang gagal mengembalikan `status: "failed"` dengan `lastError`.

### `GET /api/v1/skills/-/scan/{scanId}/download`

Endpoint arsip laporan terautentikasi.

- Memerlukan pemindaian yang berhasil; pemindaian non-terminal mengembalikan `409`.
- Mengembalikan ZIP dengan `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json`, dan `README.md`.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

Endpoint arsip laporan tersimpan terautentikasi untuk versi yang dikirimkan.

- Memerlukan akses manajemen pemilik/penerbit ke skill atau Plugin, atau kewenangan moderator/admin platform.
- Mengembalikan hasil pemindaian tersimpan untuk versi persis yang dikirimkan, termasuk versi yang diblokir atau disembunyikan.
- `kind` default ke `skill`; gunakan `kind=plugin` untuk pemindaian Plugin/paket.
- Mengembalikan bentuk ZIP yang sama seperti unduhan permintaan pemindaian.

### `POST /api/v1/skills/-/scan/batch`

Rute pemindaian ulang batch kanonis khusus admin. Rute ini menerima bentuk payload yang sama seperti `POST /api/v1/skills/-/rescan-batch` legacy.

### `POST /api/v1/skills/-/scan/batch/status`

Rute status batch kanonis khusus admin. Rute ini menerima `{ "jobIds": ["..."] }` dan mengembalikan penghitung agregat yang sama seperti `POST /api/v1/skills/-/rescan-batch/status` legacy.

### `GET /api/v1/skills/{slug}/verify`

Mengembalikan amplop verifikasi Skill Card yang digunakan oleh `clawhub skill verify`.

Parameter kueri:

- `version` (opsional): string versi tertentu.
- `tag` (opsional): menyelesaikan versi bertag (misalnya `latest`).

Catatan:

- `ok` bernilai `true` hanya ketika versi yang dipilih memiliki Skill Card yang dihasilkan, tidak diblokir malware oleh moderasi, dan verifikasi ClawScan bersih.
- Identitas skill, identitas penerbit, dan metadata versi yang dipilih adalah field amplop tingkat atas (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`) sehingga otomatisasi shell dapat membacanya tanpa membongkar wrapper bertingkat.
- `security` adalah putusan ClawScan/keamanan tingkat atas. Otomatisasi sebaiknya berpatokan pada `ok`, `decision`, `reasons`, dan `security.status`.
- `security.signals` berisi bukti pemindai pendukung seperti `staticScan`, `virusTotal`, dan `skillSpector`.
- `security.signals.dependencyRegistry` dipertahankan untuk kompatibilitas respons v1, tetapi pemindai keberadaan registri dependensi telah dihentikan dan kunci ini selalu `null`.
- `provenance` adalah `server-resolved-github-import` hanya ketika ClawHub menyelesaikan dan menyimpan repo/ref/commit/path GitHub selama publikasi atau impor; jika tidak, nilainya `unavailable`.

### `POST /api/v1/skills/-/security-verdicts`

Mengembalikan putusan keamanan ringkas saat ini untuk versi skill yang persis. Endpoint
koleksi ini ditujukan untuk klien yang sudah mengetahui versi skill
ClawHub terinstal mana yang perlu mereka tampilkan, seperti OpenClaw Control UI.

Permintaan:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

Catatan:

- `items` harus berisi 1-100 pasangan `{ slug, version }` yang unik.
- Hasil diberikan per item; satu skill atau versi yang hilang tidak menggagalkan seluruh respons.
- Respons hanya berisi keamanan. Respons ini tidak menyertakan data Skill Card, status kartu yang dihasilkan, daftar file artefak, atau payload pemindai terperinci.
- `security.signals` hanya berisi bukti pendukung tingkat status; gunakan `/scan` atau halaman audit keamanan ClawHub untuk detail pemindai lengkap.
- `security.signals.dependencyRegistry` dipertahankan untuk kompatibilitas respons v1, tetapi pemindai keberadaan registri dependensi telah dihentikan dan kunci ini selalu `null`.
- Ketiadaan Skill Card tidak memengaruhi `ok`, `decision`, atau `reasons` endpoint ini; klien sebaiknya membaca `skill-card.md` terinstal secara lokal saat membutuhkan konten kartu.
- Gunakan `/verify` saat Anda membutuhkan amplop verifikasi Skill Card untuk satu skill, `/card` saat Anda membutuhkan markdown kartu yang dihasilkan, dan `/scan` saat Anda membutuhkan data pemindai terperinci.

Respons:

```json
{
  "schema": "clawhub.skill.security-verdicts.v1",
  "items": [
    {
      "ok": true,
      "decision": "pass",
      "reasons": [],
      "requestedSlug": "gifgrep",
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "publisherHandle": "steipete",
      "publisherDisplayName": "Peter",
      "requestedVersion": "1.2.3",
      "version": "1.2.3",
      "createdAt": 0,
      "checkedAt": 0,
      "skillUrl": "https://clawhub.ai/steipete/skills/gifgrep",
      "securityAuditUrl": "https://clawhub.ai/steipete/skills/gifgrep/security-audit?version=1.2.3",
      "security": {
        "status": "clean",
        "passed": true,
        "signals": {
          "staticScan": { "status": "clean", "reasonCodes": [] },
          "virusTotal": null,
          "skillSpector": null,
          "dependencyRegistry": null
        }
      }
    },
    {
      "ok": false,
      "decision": "fail",
      "reasons": ["version.not_found"],
      "requestedSlug": "missing-version",
      "requestedVersion": "1.0.0",
      "error": { "code": "version_not_found", "message": "Version not found" },
      "security": null
    }
  ]
}
```

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

- `limit` (opsional): bilangan bulat (1–100)
- `cursor` (opsional): kursor paginasi
- `family` (opsional): `skill`, `code-plugin`, atau `bundle-plugin`
- `channel` (opsional): `official`, `community`, atau `private`
- `isOfficial` (opsional): `true` atau `false`
- `sort` (opsional): `updated` (default), `recommended`, `trending`, `downloads`, alias lama `installs`
- `category` (opsional): filter kategori Plugin. Hanya didukung ketika
  permintaan dibatasi ke paket Plugin (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins`, atau endpoint paket dengan
  `family=code-plugin`/`family=bundle-plugin`). Kategori terkontrol dan
  alias filter v1 lama didokumentasikan di bawah `GET /api/v1/plugins`.

Catatan:

- Nilai tidak valid untuk `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly`, atau `sort` mengembalikan `400`. Parameter kueri yang tidak dikenal diabaikan.
- `GET /api/v1/code-plugins` dan `GET /api/v1/bundle-plugins` tetap menjadi alias keluarga tetap.
- Entri Skills tetap didukung oleh registri Skills dan masih hanya dapat dipublikasikan melalui `POST /api/v1/skills`.
- `POST /api/v1/packages` masih hanya untuk rilis code-plugin dan bundle-plugin.
- Pemanggil anonim hanya melihat channel paket publik.
- Pemanggil terautentikasi dapat melihat paket privat untuk penerbit tempat mereka menjadi anggota di hasil daftar/pencarian.
- `channel=private` hanya mengembalikan paket yang dapat dibaca oleh pemanggil terautentikasi.

### `GET /api/v1/packages/search`

Pencarian katalog terpadu di seluruh Skills + paket Plugin.

Parameter kueri:

- `q` (wajib): string kueri
- `limit` (opsional): bilangan bulat (1–100)
- `family` (opsional): `skill`, `code-plugin`, atau `bundle-plugin`
- `channel` (opsional): `official`, `community`, atau `private`
- `isOfficial` (opsional): `true` atau `false`
- `category` (opsional): filter kategori Plugin. Hanya didukung ketika
  permintaan dibatasi ke paket Plugin. Kategori terkontrol dan alias filter
  v1 lama didokumentasikan di bawah `GET /api/v1/plugins`.

Catatan:

- Nilai tidak valid untuk `family`, `channel`, `isOfficial`, `featured`, atau
  `highlightedOnly` mengembalikan `400`. Parameter kueri yang tidak dikenal diabaikan.
- Pemanggil anonim hanya melihat channel paket publik.
- Pemanggil terautentikasi dapat mencari paket privat untuk penerbit tempat mereka menjadi anggota.
- `channel=private` hanya mengembalikan paket yang dapat dibaca oleh pemanggil terautentikasi.

### `GET /api/v1/plugins`

Penelusuran katalog khusus Plugin di seluruh paket code-plugin dan bundle-plugin.

Parameter kueri:

- `limit` (opsional): bilangan bulat (1-100)
- `cursor` (opsional): kursor paginasi
- `isOfficial` (opsional): `true` atau `false`
- `sort` (opsional): `recommended` (default), `trending`, `downloads`, `updated`, alias lama `installs`
- `category` (opsional): filter kategori Plugin. Nilai saat ini:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Alias filter v1 lama tetap diterima pada endpoint baca:

- `mcp-tooling`, `data`, dan `automation` di-resolve ke `tools`.
- `observability` dan `deployment` di-resolve ke `gateway`.
- `dev-tools` di-resolve ke `runtime`.

`trending` adalah papan peringkat instalasi/unduhan tujuh hari dan tidak menggunakan total sepanjang waktu.
Pada endpoint terpadu `/api/v1/packages`, nilai ini khusus Plugin; gunakan
`/api/v1/skills?sort=trending` untuk katalog Skills.

Alias lama tidak diterima sebagai nilai kategori yang disimpan atau dideklarasikan penulis.

### `GET /api/v1/skills/export`

Ekspor massal Skills publik terbaru untuk analisis offline.

Auth:

- Token API wajib.

Parameter kueri:

- `startDate` (wajib): batas bawah milidetik Unix untuk `updatedAt` Skills.
- `endDate` (wajib): batas atas milidetik Unix untuk `updatedAt` Skills.
- `limit` (opsional): bilangan bulat (1-250), default `250`.
- `cursor` (opsional): kursor paginasi dari respons sebelumnya.

Respons:

- Body: arsip ZIP.
- Setiap Skills yang diekspor berakar di `{publisher}/{slug}/`.
- Skills yang di-host mencakup file versi tersimpan terbaru dan tercantum dalam
  `_manifest.json` dengan `sourceRef: "public-clawhub"`.
- Skills saat ini yang didukung GitHub dengan pemindaian `clean` atau `suspicious` mencakup
  `_source_handoff.json` dengan `sourceRef: "public-github"`, repo, commit, jalur,
  hash konten, dan URL arsip. File ini tidak mencakup file sumber yang di-host ClawHub.
- Setiap Skills mencakup `_export_skill_meta.json`.
- `_manifest.json` selalu disertakan di root ZIP.
- `_errors.json` disertakan ketika Skills atau file individual tidak dapat
  diekspor.

Header:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

Ekspor massal rilis Plugin publik terbaru untuk analisis offline.

Autentikasi:

- Token API wajib.

Parameter kueri:

- `startDate` (wajib): batas bawah milidetik Unix untuk `updatedAt` Plugin.
- `endDate` (wajib): batas atas milidetik Unix untuk `updatedAt` Plugin.
- `limit` (opsional): integer (1-250), default `250`.
- `cursor` (opsional): kursor paginasi dari respons sebelumnya.
- `family` (opsional): `code-plugin` atau `bundle-plugin`. Jika dihilangkan, berarti kedua
  keluarga Plugin.

Respons:

- Isi: arsip ZIP.
- Setiap Plugin yang diekspor berakar di `{family}/{packageName}/`.
- Setiap Plugin yang diekspor menyertakan berkas tersimpan dari rilis terbaru.
- Metadata ekspor per Plugin disimpan di
  `__clawhub_export/{family}/{packageName}/plugin_meta.json`.
- `_manifest.json` selalu disertakan di akar ZIP.
- `_errors.json` disertakan ketika Plugin atau berkas individual tidak dapat
  diekspor.

Header:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

Pencarian khusus Plugin di seluruh paket code-plugin dan bundle-plugin.

Parameter kueri:

- `q` (wajib): string kueri
- `limit` (opsional): integer (1-100)
- `isOfficial` (opsional): `true` atau `false`
- `category` (opsional): filter kategori Plugin. Nilai saat ini:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Catatan:

- Alias filter v1 lama yang didokumentasikan di bawah `GET /api/v1/plugins` juga
  diterima.
- Pemfilteran kategori adalah filter API nyata yang didukung oleh baris digest kategori Plugin,
  bukan penulisan ulang kueri pencarian.
- Hasil dikembalikan dalam urutan relevansi dan saat ini tidak menggunakan paginasi.
- Kontrol pengurutan UI browser untuk pencarian Plugin mengurutkan ulang hasil relevansi yang dimuat,
  sesuai dengan perilaku penjelajahan `/skills` saat ini.

### `GET /api/v1/packages/{name}`

Mengembalikan metadata detail paket.

Catatan:

- Skills juga dapat diresolusikan melalui rute ini di katalog terpadu.
- Paket privat mengembalikan `404` kecuali pemanggil dapat membaca publisher pemiliknya.

### `DELETE /api/v1/packages/{name}`

Menghapus lunak paket dan semua rilis.

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

Mengembalikan satu versi paket, termasuk metadata berkas, kompatibilitas,
verifikasi, metadata artefak, dan data pemindaian.

Catatan:

- `version.artifact.kind` adalah `legacy-zip` untuk arsip paket dunia lama atau
  `npm-pack` untuk rilis yang didukung ClawPack.
- Rilis ClawPack menyertakan bidang `npmIntegrity`, `npmShasum`, dan
  `npmTarballName` yang kompatibel dengan npm.
- `version.sha256hash` adalah metadata kompatibilitas usang untuk klien lama. Ini
  meng-hash byte ZIP persis yang dikembalikan oleh `/api/v1/packages/{name}/download`.
  Klien modern sebaiknya menggunakan `version.artifact.sha256`, yang mengidentifikasi
  artefak rilis kanonis.
- `version.vtAnalysis`, `version.llmAnalysis`, dan `version.staticScan`
  disertakan ketika data pemindaian ada.
- Paket privat mengembalikan `404` kecuali pemanggil dapat membaca publisher pemiliknya.

### `GET /api/v1/packages/{name}/versions/{version}/security`

Mengembalikan ringkasan keamanan dan kepercayaan rilis paket yang persis untuk klien
instalasi. Ini adalah permukaan konsumsi publik OpenClaw untuk menentukan apakah
rilis yang diresolusikan dapat diinstal.

Autentikasi:

- Endpoint baca publik. Token pemilik, publisher, moderator, atau admin tidak
  diperlukan.

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

Bidang respons:

- `package.name`, `package.displayName`, dan `package.family` mengidentifikasi
  paket registry yang diresolusikan.
- `release.releaseId`, `release.version`, dan `release.createdAt` mengidentifikasi
  rilis persis yang dievaluasi.
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum`, dan `release.npmTarballName` ada ketika diketahui untuk
  artefak rilis.
- `trust.scanStatus` adalah status kepercayaan efektif yang diturunkan dari masukan pemindai
  dan moderasi rilis manual.
- `trust.moderationState` dapat bernilai null. Nilainya `null` ketika tidak ada moderasi rilis
  manual.
- `trust.blockedFromDownload` adalah sinyal blokir instalasi. OpenClaw dan klien
  instalasi lainnya sebaiknya memblokir instalasi ketika nilai ini `true`, alih-alih
  menurunkan ulang aturan pemblokiran dari bidang pemindai atau moderasi.
- `trust.reasons` adalah daftar penjelasan untuk pengguna dan audit. Kode alasan
  adalah string stabil dan ringkas seperti `manual:quarantined`, `scan:malicious`,
  dan `package:malicious`.
- `trust.pending` berarti satu atau beberapa masukan kepercayaan masih menunggu penyelesaian.
- `trust.stale` berarti ringkasan kepercayaan dihitung dari masukan usang dan
  sebaiknya diperlakukan sebagai memerlukan penyegaran sebelum keputusan izinkan dengan keyakinan tinggi.

Catatan:

- Endpoint ini persis versi. Klien sebaiknya memanggilnya setelah meresolusikan
  versi paket yang ingin mereka instal, bukan hanya setelah membaca metadata paket terbaru.
- Paket privat mengembalikan `404` kecuali pemanggil dapat membaca publisher pemiliknya.
- Endpoint ini sengaja lebih sempit daripada endpoint moderasi pemilik/moderator.
  Endpoint ini mengekspos keputusan instalasi dan penjelasan publik, bukan
  identitas pelapor, isi laporan, bukti privat, atau lini masa tinjauan internal.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Mengembalikan metadata resolver artefak eksplisit untuk sebuah versi paket.

Catatan:

- Versi paket lama mengembalikan artefak `legacy-zip` dan `downloadUrl` ZIP
  lama.
- Versi ClawPack mengembalikan artefak `npm-pack`, bidang integritas npm,
  `tarballUrl`, dan URL kompatibilitas ZIP lama.
- Ini adalah permukaan resolver OpenClaw; ini menghindari penebakan format arsip dari
  URL bersama.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Mengunduh artefak versi melalui jalur resolver eksplisit.

Catatan:

- Versi ClawPack melakukan streaming byte `.tgz` `npm-pack` yang diunggah secara persis.
- Versi ZIP lama mengalihkan ke `/api/v1/packages/{name}/download?version=`.
- Menggunakan bucket laju unduhan.

### `GET /api/v1/packages/{name}/readiness`

Mengembalikan kesiapan yang dihitung untuk konsumsi OpenClaw di masa mendatang.

Pemeriksaan kesiapan mencakup:

- status kanal resmi
- ketersediaan versi terbaru
- ketersediaan artefak ClawPack npm-pack
- digest artefak
- sumber repo dan asal commit
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

- `bundledPluginId` dinormalisasi menjadi huruf kecil dan merupakan kunci upsert yang stabil.
- `packageName` dinormalisasi sebagai nama npm; paket dapat tidak ada untuk migrasi yang direncanakan.
- Ini hanya melacak kesiapan migrasi. Ini tidak mengubah OpenClaw atau menghasilkan
  ClawPack.

### `GET /api/v1/packages/moderation/queue`

Endpoint moderator/admin untuk antrean tinjauan rilis paket.

Autentikasi:

- Memerlukan token API untuk pengguna moderator atau admin.

Parameter kueri:

- `status` (opsional): `open` (default), `blocked`, `manual`, atau `all`
- `limit` (opsional): integer (1-100)
- `cursor` (opsional): kursor paginasi

Arti status:

- `open`: rilis mencurigakan, berbahaya, tertunda, dikarantina, dicabut, atau dilaporkan.
- `blocked`: rilis yang dikarantina, dicabut, atau berbahaya.
- `manual`: rilis apa pun dengan penggantian moderasi manual.
- `all`: rilis apa pun dengan penggantian manual, status pemindaian tidak bersih, atau laporan paket.

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

Laporkan paket untuk tinjauan moderator. Laporan berada di tingkat paket, opsional
ditautkan ke versi. Laporan ini memasok antrean moderasi tetapi tidak otomatis menyembunyikan atau
memblokir unduhan dengan sendirinya; moderator sebaiknya menggunakan moderasi rilis untuk
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
mengatur `status` kembali ke `open`. Kirim `finalAction: "quarantine"` atau
`finalAction: "revoke"` dengan laporan terkonfirmasi untuk menerapkan moderasi rilis dalam
alur kerja yang dapat diaudit yang sama.

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
- Arsip Plugin/paket adalah file zip dengan root `package/` agar klien OpenClaw lama
  tetap berfungsi.
- Rute ini tetap hanya ZIP. Rute ini tidak men-stream file ClawPack `.tgz`.
- Respons menyertakan header `ETag`, `Digest`, `X-ClawHub-Artifact-Type`, dan
  `X-ClawHub-Artifact-Sha256` untuk pemeriksaan integritas resolver.
- Metadata khusus registri tidak disisipkan ke dalam arsip yang diunduh.
- Pemindaian VirusTotal yang tertunda tidak memblokir unduhan; rilis berbahaya mengembalikan `403`.
- Paket privat mengembalikan `404` kecuali pemanggil adalah pemilik.

### `GET /api/npm/{package}`

Mengembalikan packument yang kompatibel dengan npm untuk versi paket yang didukung ClawPack.

Catatan:

- Hanya versi dengan tarball npm-pack ClawPack yang diunggah yang dicantumkan.
- Versi lama yang hanya ZIP sengaja dihilangkan.
- `dist.tarball`, `dist.integrity`, dan `dist.shasum` menggunakan field yang kompatibel dengan npm
  sehingga pengguna dapat mengarahkan npm ke mirror jika mereka memilih.
- Packument paket ber-scope mendukung jalur permintaan `/api/npm/@scope/name` dan
  `/api/npm/@scope%2Fname` terenkripsi milik npm.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Men-stream byte tarball ClawPack persis seperti yang diunggah untuk klien mirror npm.

Catatan:

- Menggunakan bucket laju unduhan.
- Header unduhan menyertakan SHA-256 ClawHub plus metadata integrity/shasum npm.
- Pemeriksaan moderasi dan akses paket privat tetap berlaku.

### `GET /api/v1/resolve`

Digunakan oleh CLI untuk memetakan fingerprint lokal ke versi yang dikenal.

Parameter kueri:

- `slug` (wajib)
- `hash` (wajib): sha256 hex 64 karakter dari fingerprint bundle

Respons:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Mengunduh ZIP versi skill yang di-host, atau mengembalikan handoff sumber GitHub untuk
skill berbasis GitHub saat ini dengan pemindaian `clean` atau `suspicious` dan tanpa
versi yang di-host.

Parameter kueri:

- `slug` (wajib)
- `version` (opsional): string semver
- `tag` (opsional): nama tag (mis. `latest`)

Catatan:

- Jika `version` maupun `tag` tidak diberikan, versi terbaru digunakan.
- Versi yang dihapus lunak mengembalikan `410`.
- Handoff skill berbasis GitHub tidak mem-proxy atau me-mirror byte. Respons JSON
  menyertakan `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`,
  dan `archiveUrl`; status pemindaian/saat ini adalah gate dan tidak disertakan sebagai metadata
  payload sukses.
- Statistik unduhan dihitung sebagai identitas unik per hari UTC (`userId` saat token API valid, jika tidak IP).

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
- Field payload opsional: `ownerHandle`. Jika ada, API menyelesaikan
  penerbit tersebut di sisi server dan mengharuskan aktor memiliki akses penerbit.
- Field payload opsional: `migrateOwner`. Jika `true` dengan `ownerHandle`,
  skill yang ada dapat dipindahkan ke pemilik tersebut jika aktor adalah admin/pemilik pada
  penerbit saat ini dan target. Tanpa opt-in ini, perubahan pemilik
  ditolak.

### `POST /api/v1/packages`

Menerbitkan rilis code-plugin atau bundle-plugin.

- Memerlukan autentikasi token Bearer.
- Memerlukan `multipart/form-data`.
- Field formulir yang diizinkan adalah `payload`, blob `files` berulang, atau satu referensi tarball
  `clawpack`. `clawpack` dapat berupa blob `.tgz` atau id penyimpanan yang dikembalikan oleh
  alur upload-url. Publikasi storage-id bertahap juga harus menyertakan
  `clawpackUploadTicket` yang dikembalikan dengan URL unggahan tersebut.
- Gunakan `files` atau `clawpack`, jangan pernah keduanya dalam permintaan yang sama.
- Body JSON dan metadata `payload.files` / `payload.artifact` yang disediakan pemanggil
  ditolak.
- Permintaan publikasi multipart langsung dibatasi hingga 18MB. Tarball ClawPack dapat
  menggunakan alur upload-url hingga batas tarball 120MB.
- Field payload opsional: `ownerHandle`. Jika ada, hanya admin yang dapat menerbitkan atas nama pemilik tersebut.

Sorotan validasi:

- `family` harus `code-plugin` atau `bundle-plugin`.
- Paket Plugin memerlukan `openclaw.plugin.json`. Unggahan `.tgz` ClawPack harus
  memuatnya di `package/openclaw.plugin.json`.
- Code plugin memerlukan `package.json`, metadata repo sumber, metadata commit sumber,
  metadata skema config, `openclaw.compat.pluginApi`, dan
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` dan `openclaw.environment` adalah metadata opsional.
- Hanya penerbit org `openclaw` dan penerbit personal milik anggota org `openclaw` saat ini
  yang dapat menerbitkan ke channel `official`.
- Publikasi atas nama pihak lain tetap memvalidasi kelayakan channel resmi terhadap akun pemilik target.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Hapus lunak / pulihkan skill (pemilik, moderator, atau admin).

Body JSON opsional:

```json
{ "reason": "Held for moderation pending legal review." }
```

Jika ada, `reason` disimpan sebagai catatan moderasi skill dan disalin ke log audit.
Hapus lunak yang dimulai pemilik mencadangkan slug selama 30 hari, lalu slug dapat diklaim oleh
penerbit lain. Respons hapus menyertakan `slugReservedUntil` saat kedaluwarsa ini berlaku.
Penyembunyian moderator/admin dan penghapusan keamanan tidak kedaluwarsa dengan cara ini.

Respons hapus:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

Kode status:

- `200`: ok
- `401`: tidak terautentikasi
- `403`: dilarang
- `404`: skill/pengguna tidak ditemukan
- `500`: kesalahan server internal

### `POST /api/v1/users/publisher`

Khusus admin. Memastikan penerbit org ada untuk sebuah handle. Jika handle masih mengarah ke
pengguna bersama lama/penerbit personal, endpoint memigrasikannya terlebih dahulu menjadi penerbit org.
Untuk org yang baru dibuat, berikan `memberHandle`; admin yang bertindak tidak ditambahkan sebagai anggota.
`memberRole` default ke `owner`.

- Body: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Respons: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

Pembuatan penerbit org mandiri yang terautentikasi. Membuat penerbit org baru dan menambahkan
pemanggil sebagai pemilik. Endpoint ini tidak memigrasikan handle pengguna/personal yang ada dan
tidak menandai penerbit sebagai tepercaya/resmi.

- Body: `{ "handle": "opik", "displayName": "Opik" }`
- Respons: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- Mengembalikan `409` saat handle sudah digunakan oleh penerbit, pengguna, atau penerbit personal.

### `POST /api/v1/users/reserve`

Khusus admin. Mencadangkan slug root dan nama paket untuk pemilik yang sah tanpa menerbitkan
rilis. Nama paket menjadi paket placeholder privat tanpa baris rilis, sehingga pemilik yang sama
dapat nanti menerbitkan rilis code-plugin atau bundle-plugin yang sebenarnya ke nama tersebut.

- Body: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Respons: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

Khusus admin. Memulihkan penerbit personal untuk principal GitHub OAuth pengganti yang diverifikasi
tanpa mengedit baris akun Convex Auth. Permintaan harus menyebutkan kedua id akun provider GitHub
yang immutable; handle yang mutable hanya digunakan sebagai guard yang terlihat operator.

Titik akhir default-nya adalah dry-run. Menerapkan pemulihan memerlukan `dryRun: false` dan
`confirmIdentityVerified: true` setelah staf memverifikasi secara independen kontinuitas antara kedua
prinsipal GitHub. Pemulihan gagal tertutup ketika penerbit personal saat ini milik pengguna tujuan
memiliki skills, paket, atau sumber skill GitHub.
Pemulihan juga memigrasikan field `ownerUserId` lama untuk skills milik penerbit yang dipulihkan,
alias slug skill, paket, peringatan pemeriksa paket, dan baris digest pencarian turunan sehingga
jalur pemilik langsung sesuai dengan otoritas penerbit yang baru. Reservasi protected-handle aktif
untuk handle yang dipulihkan juga dialihkan ke pengguna pengganti sehingga sinkronisasi profil berikutnya
tidak dapat memulihkan otoritas pesaing milik pengguna sebelumnya. Setiap tabel primer dibatasi hingga
100 baris per transaksi penerapan; pemulihan yang lebih besar harus terlebih dahulu menggunakan migrasi pemilik yang dapat dilanjutkan.
Sumber skill GitHub berskala penerbit dan dilaporkan sebagai diperiksa, bukan ditulis ulang.

- Isi: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- Respons: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### Titik akhir pengelolaan slug pemilik

- `POST /api/v1/skills/{slug}/rename`
  - Isi: `{ "newSlug": "new-canonical-slug" }`
  - Respons: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - Isi: `{ "targetSlug": "canonical-target-slug" }`
  - Respons: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

Catatan:

- Kedua titik akhir memerlukan autentikasi token API dan hanya berfungsi untuk pemilik skill.
- `rename` mempertahankan slug sebelumnya sebagai alias pengalihan.
- `merge` menyembunyikan listing sumber dan mengalihkan slug sumber ke listing target.

### Titik akhir transfer kepemilikan

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

Blokir pengguna dan hapus permanen skills yang dimiliki (hanya moderator/admin).

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

Cabut pemblokiran pengguna dan pulihkan skills yang memenuhi syarat (hanya admin).

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

### `POST /api/v1/users/reclassify-ban`

Ubah alasan yang tersimpan untuk pemblokiran yang ada tanpa mencabut pemblokiran atau memulihkan
konten (hanya admin). Default-nya dry-run kecuali `dryRun` adalah `false`.

Isi:

```json
{ "handle": "user_handle", "reason": "bulk publishing spam", "dryRun": true }
```

atau

```json
{ "userId": "users_...", "reason": "bulk publishing spam", "dryRun": false }
```

Respons:

```json
{
  "ok": true,
  "dryRun": false,
  "userId": "users_...",
  "handle": "user_handle",
  "previousReason": "malware auto-ban",
  "nextReason": "bulk publishing spam",
  "changed": true
}
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

Daftar atau cari pengguna (hanya admin).

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

Tambahkan/hapus bintang (sorotan). Kedua titik akhir bersifat idempoten.

Respons:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## Titik akhir CLI lama (tidak digunakan lagi)

Masih didukung untuk versi CLI yang lebih lama:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

Lihat `DEPRECATIONS.md` untuk rencana penghapusan.

`POST /api/cli/upload-url` mengembalikan `uploadUrl` dan `uploadTicket`. Penerbitan paket
yang menyiapkan tarball ClawPack harus mengirim ID penyimpanan yang dihasilkan sebagai
`clawpack` dan tiket yang dikembalikan sebagai `clawpackUploadTicket`.

## Penemuan registry (`/.well-known/clawhub.json`)

CLI dapat menemukan pengaturan registry/auth dari situs:

- `/.well-known/clawhub.json` (JSON, lebih disukai)
- `/.well-known/clawdhub.json` (lama)

Skema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Jika Anda melakukan self-host, sajikan file ini (atau tetapkan `CLAWHUB_REGISTRY` secara eksplisit; `CLAWDHUB_REGISTRY` lama).
