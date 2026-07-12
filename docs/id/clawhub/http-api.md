---
read_when:
    - Menambahkan/mengubah endpoint
    - Men-debug permintaan CLI ↔ registry
summary: Referensi API HTTP (endpoint publik + CLI + autentikasi).
x-i18n:
    generated_at: "2026-07-12T13:59:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# API HTTP

URL dasar: `https://clawhub.ai` (default).

Semua jalur v1 berada di bawah `/api/v1/...`.
Jalur lama `/api/...` dan `/api/cli/...` tetap tersedia untuk kompatibilitas (lihat `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## Penggunaan ulang katalog publik

Direktori pihak ketiga dapat menggunakan endpoint baca publik untuk mencantumkan atau mencari Skills ClawHub. Harap cache hasil, patuhi `429`/`Retry-After`, arahkan pengguna kembali ke daftar kanonis ClawHub (`https://clawhub.ai/<owner>/skills/<slug>`), dan hindari memberi kesan bahwa ClawHub mendukung situs pihak ketiga tersebut. Jangan mencoba mencerminkan konten tersembunyi, privat, atau diblokir moderasi di luar permukaan API publik.

Pintasan slug web dapat diresolusikan di seluruh keluarga registri, tetapi klien API harus menggunakan
URL kanonis yang dikembalikan oleh endpoint baca, alih-alih merekonstruksi prioritas
rute.

## Batas laju

Model penerapan:

- Permintaan anonim: diterapkan per IP.
- Permintaan terautentikasi (token Bearer valid): diterapkan per kelompok pengguna.
- Jika token tidak ada/tidak valid, perilaku kembali ke penerapan berbasis IP.
- Endpoint tulis terautentikasi tidak boleh hanya mengembalikan `Unauthorized` ketika
  server mengetahui alasannya. Token yang tidak ada, token yang tidak valid/dicabut, serta
  akun yang dihapus/diblokir/dinonaktifkan masing-masing harus menerima teks yang dapat ditindaklanjuti agar klien
  CLI dapat memberi tahu pengguna apa yang menghalangi mereka.

- Baca: 3000/menit per IP, 12000/menit per kunci
- Tulis: 300/menit per IP, 3000/menit per kunci
- Unduh: 1200/menit per IP, 6000/menit per kunci (endpoint unduhan)

Header:

- Kompatibilitas lama: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- Terstandardisasi: `RateLimit-Limit`, `RateLimit-Reset`
- Saat `429`: `X-RateLimit-Remaining: 0` dan `RateLimit-Remaining: 0`
- Saat `429`: `Retry-After`

Semantik header:

- `X-RateLimit-Reset`: detik epoch Unix absolut
- `RateLimit-Reset`: detik hingga reset (jeda)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: sisa kuota persis jika tersedia.
  Permintaan terpartisi yang berhasil tidak menyertakan header ini, alih-alih mengembalikan nilai global perkiraan.
- `Retry-After`: detik yang harus ditunggu sebelum mencoba kembali (jeda) saat `429`

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

- Jika `Retry-After` tersedia, tunggu selama jumlah detik tersebut sebelum mencoba kembali.
- Gunakan penundaan mundur dengan jitter untuk menghindari percobaan ulang yang tersinkronisasi.
- Jika `Retry-After` tidak ada, kembali gunakan `RateLimit-Reset` (atau hitung dari `X-RateLimit-Reset`).

Sumber IP:

- Menggunakan header IP klien tepercaya, termasuk `cf-connecting-ip`, hanya ketika
  deployment secara eksplisit mengaktifkan header penerusan tepercaya.
- ClawHub menggunakan header penerusan tepercaya untuk mengidentifikasi IP klien di edge.
- Jika tidak tersedia IP klien tepercaya, permintaan anonim menggunakan kelompok cadangan
  yang cakupannya hanya berdasarkan jenis batas laju. Kelompok cadangan ini tidak menyertakan
  jalur, slug, nama paket, versi, string kueri, atau parameter
  artefak lain yang diberikan pemanggil.

## Respons kesalahan

Respons kesalahan v1 publik berupa teks biasa dengan `content-type: text/plain; charset=utf-8`.
Ini mencakup kegagalan validasi (`400`), sumber daya publik yang tidak ditemukan (`404`), kegagalan autentikasi dan
izin (`401`/`403`), batas laju (`429`), serta unduhan yang diblokir. Klien
harus membaca isi respons sebagai string yang dapat dibaca manusia. Parameter kueri yang tidak dikenal
diabaikan demi kompatibilitas, tetapi parameter kueri yang dikenali dengan nilai tidak valid mengembalikan
`400`.

## Endpoint publik (tanpa autentikasi)

### `GET /api/v1/search`

Parameter kueri:

- `q` (wajib): string kueri
- `limit` (opsional): bilangan bulat
- `highlightedOnly` (opsional): `true` untuk memfilter hanya Skills yang disorot
- `nonSuspiciousOnly` (opsional): `true` untuk menyembunyikan Skills mencurigakan (`flagged.suspicious`)
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

- Hasil dikembalikan dalam urutan relevansi (kemiripan embedding + peningkatan token slug/nama yang sama persis + sedikit prioritas popularitas).
- Relevansi lebih kuat daripada popularitas. Kecocokan token slug atau nama tampilan yang tepat dapat mengungguli kecocokan yang lebih longgar dengan keterlibatan jauh lebih tinggi.
- Teks ASCII ditokenisasi pada batas kata dan tanda baca. Sebagai contoh, `personal-map` berisi token `map` mandiri, sedangkan `amap-jsapi-skill` berisi `amap`, `jsapi`, dan `skill`; karena itu, pencarian `map` memberi `personal-map` kecocokan leksikal yang lebih kuat daripada `amap-jsapi-skill`.
- Popularitas diskalakan secara logaritmik dan dibatasi. Skills dengan keterlibatan tinggi dapat menempati peringkat lebih rendah ketika teks kueri memiliki kecocokan yang lebih lemah.
- Status moderasi mencurigakan atau tersembunyi dapat menghapus sebuah Skill dari pencarian publik, bergantung pada filter pemanggil dan status moderasi saat ini.

Panduan keterlihatan penerbit:

- Cantumkan istilah yang benar-benar akan dicari pengguna dalam nama tampilan, ringkasan, dan tag. Gunakan token slug mandiri hanya jika token tersebut juga merupakan identitas stabil yang ingin Anda pertahankan.
- Jangan mengganti nama slug hanya untuk mengejar satu kueri, kecuali slug baru merupakan nama kanonis jangka panjang yang lebih baik. Slug lama menjadi alias pengalihan, tetapi URL kanonis, slug yang ditampilkan, dan ringkasan pencarian mendatang menggunakan slug baru.
- Alias penggantian nama mempertahankan resolusi untuk URL lama dan instalasi yang diresolusikan melalui registri, tetapi peringkat pencarian didasarkan pada metadata Skill kanonis setelah penggantian nama diindeks. Statistik yang ada tetap terkait dengan Skill tersebut.
- Jika sebuah Skill secara tidak terduga tidak terlihat, periksa status moderasi terlebih dahulu dengan `clawhub inspect @owner/slug` saat sudah masuk sebelum mengubah metadata terkait peringkat.

### `GET /api/v1/skills`

Parameter kueri:

- `limit` (opsional): bilangan bulat (1–200)
- `cursor` (opsional): kursor paginasi untuk semua pengurutan selain `trending`
- `sort` (opsional): `updated` (default), `recommended` (alias: `default`), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), alias instalasi lama `installsCurrent`/`installs`/`installsAllTime` dipetakan ke `downloads`, `trending`
- `nonSuspiciousOnly` (opsional): `true` untuk menyembunyikan Skills mencurigakan (`flagged.suspicious`)
- `nonSuspicious` (opsional): alias lama untuk `nonSuspiciousOnly`

Nilai `sort` yang tidak valid mengembalikan `400`.

Catatan:

- `recommended` menggunakan sinyal keterlibatan dan kebaruan.
- `trending` memberi peringkat berdasarkan instalasi dalam 7 hari terakhir (berbasis telemetri).
- `createdAt` stabil untuk perayapan Skill baru; `updated` berubah saat Skills yang ada dipublikasikan ulang.
- Saat `nonSuspiciousOnly=true`, pengurutan berbasis kursor dapat mengembalikan item lebih sedikit daripada `limit` pada satu halaman karena Skills mencurigakan difilter setelah pengambilan halaman.
- Gunakan `nextCursor` untuk melanjutkan paginasi jika tersedia. Halaman pendek tidak dengan sendirinya berarti akhir hasil.

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

- Slug lama yang dibuat oleh alur penggantian nama/penggabungan pemilik diresolusikan ke Skill kanonis.
- `metadata.os`: batasan OS yang dideklarasikan dalam frontmatter Skill (misalnya `["macos"]`, `["linux"]`). `null` jika tidak dideklarasikan.
- `metadata.systems`: target sistem Nix (misalnya `["aarch64-darwin", "x86_64-linux"]`). `null` jika tidak dideklarasikan.
- `metadata` bernilai `null` jika Skill tidak memiliki metadata platform.
- `moderation` hanya disertakan ketika Skill ditandai atau pemilik sedang melihatnya.

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

- Pemilik dan moderator dapat mengakses detail moderasi untuk Skills tersembunyi.
- Pemanggil publik hanya mendapatkan `200` untuk Skills terlihat yang sudah ditandai.
- Bukti disunting untuk pemanggil publik dan hanya menyertakan cuplikan mentah bagi pemilik/moderator.

### `POST /api/v1/skills/{slug}/report`

Laporkan sebuah Skill untuk ditinjau moderator. Laporan berlaku pada tingkat Skill, secara opsional ditautkan
ke suatu versi, dan masuk ke antrean laporan Skill.

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

Endpoint moderator/admin untuk menerima laporan Skill.

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

Endpoint moderator/admin untuk menyelesaikan atau membuka kembali laporan Skill.

Permintaan:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` wajib untuk `confirmed` dan `dismissed`; nilai ini boleh dihilangkan saat
mengatur `status` kembali ke `open`. Teruskan `finalAction: "hide"` bersama laporan yang telah
ditriase untuk menyembunyikan Skill dalam alur kerja yang sama dan dapat diaudit.

### `GET /api/v1/skills/{slug}/versions`

Parameter kueri:

- `limit` (opsional): bilangan bulat
- `cursor` (opsional): kursor paginasi

### `GET /api/v1/skills/{slug}/versions/{version}`

Mengembalikan metadata versi + daftar berkas.

- `version.security` menyertakan status verifikasi pemindaian yang dinormalisasi dan detail pemindai
  (VirusTotal + LLM), jika tersedia.

### `GET /api/v1/skills/{slug}/scan`

Mengembalikan detail verifikasi pemindaian keamanan untuk suatu versi Skill.

Parameter kueri:

- `version` (opsional): string versi tertentu.
- `tag` (opsional): meresolusikan versi yang diberi tag (misalnya `latest`).

Catatan:

- Jika `version` maupun `tag` tidak diberikan, versi terbaru akan digunakan.
- Mencakup status verifikasi yang telah dinormalisasi beserta detail khusus pemindai.
- `security.hasScanResult` bernilai `true` hanya ketika pemindai menghasilkan keputusan definitif (`clean`, `suspicious`, atau `malicious`).
- `moderation` adalah cuplikan moderasi tingkat Skills saat ini yang berasal dari versi terbaru.
- Saat meminta versi historis, periksa `moderation.matchesRequestedVersion` dan `moderation.sourceVersion` sebelum menganggap `moderation` dan `security` berada dalam konteks versi yang sama.

### `POST /api/v1/skills/-/scan`

Endpoint pengiriman terautentikasi untuk tugas ClawScan baru.

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

- Payload permintaan pemindaian dan laporan yang dapat diunduh akan kedaluwarsa dari penyimpanan permintaan pemindaian setelah periode retensi.
- Pemindaian yang dipublikasikan memerlukan akses pengelolaan pemilik/penerbit atau wewenang moderator/admin platform.
- Pemindaian yang dipublikasikan hanya menulis kembali ketika `update: true` dan pemindaian berhasil diselesaikan.
- Responsnya adalah `202` dengan `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`.
- Tugas pemindaian berjalan secara asinkron. Permintaan pemindaian manual diprioritaskan sebelum pekerjaan publikasi/pengisian ulang biasa, tetapi penyelesaiannya tetap bergantung pada ketersediaan pekerja.

### `GET /api/v1/skills/-/scan/{scanId}`

Endpoint jajak pendapat terautentikasi untuk pemindaian yang telah dikirimkan.

- Mengembalikan status antre/berjalan/berhasil/gagal.
- Mengembalikan `queue.queuedAhead` dan `queue.position` selama berada dalam antrean agar klien dapat menampilkan jumlah pemindaian manual berprioritas yang berada di depan permintaan tersebut. Antrean yang sangat besar dibatasi dan dilaporkan dengan `queuedAheadIsEstimate: true`.
- Jika tersedia, `report` berisi bagian `clawscan`, `skillspector`, `staticAnalysis`, dan `virustotal`.
- Tugas pemindaian yang gagal mengembalikan `status: "failed"` dengan `lastError`.

### `GET /api/v1/skills/-/scan/{scanId}/download`

Endpoint arsip laporan terautentikasi.

- Memerlukan pemindaian yang berhasil; pemindaian yang belum mencapai status akhir mengembalikan `409`.
- Mengembalikan ZIP yang berisi `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json`, dan `README.md`.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

Endpoint arsip laporan tersimpan yang terautentikasi untuk versi yang dikirimkan.

- Memerlukan akses pengelolaan pemilik/penerbit atas Skills atau Plugin tersebut, atau wewenang moderator/admin platform.
- Mengembalikan hasil pemindaian tersimpan untuk versi persis yang dikirimkan, termasuk versi yang diblokir atau disembunyikan.
- Nilai bawaan `kind` adalah `skill`; gunakan `kind=plugin` untuk pemindaian Plugin/paket.
- Mengembalikan struktur ZIP yang sama dengan unduhan permintaan pemindaian.

### `POST /api/v1/skills/-/scan/batch`

Rute pemindaian ulang batch kanonis khusus admin. Rute ini menerima struktur payload yang sama dengan `POST /api/v1/skills/-/rescan-batch` lama.

### `POST /api/v1/skills/-/scan/batch/status`

Rute status batch kanonis khusus admin. Rute ini menerima `{ "jobIds": ["..."] }` dan mengembalikan penghitung agregat yang sama dengan `POST /api/v1/skills/-/rescan-batch/status` lama.

### `GET /api/v1/skills/{slug}/verify`

Mengembalikan amplop verifikasi Kartu Skills yang digunakan oleh `clawhub skill verify`.

Parameter kueri:

- `version` (opsional): string versi tertentu.
- `tag` (opsional): menyelesaikan versi bertanda (misalnya `latest`).

Catatan:

- `ok` bernilai `true` hanya ketika versi yang dipilih memiliki Kartu Skills yang telah dibuat, tidak diblokir sebagai perangkat perusak oleh moderasi, dan verifikasi ClawScan berstatus bersih.
- Identitas Skills, identitas penerbit, dan metadata versi yang dipilih merupakan bidang tingkat teratas pada amplop (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`) sehingga otomatisasi shell dapat membacanya tanpa membongkar pembungkus bersarang.
- `security` adalah keputusan ClawScan/keamanan tingkat teratas. Otomatisasi sebaiknya menggunakan `ok`, `decision`, `reasons`, dan `security.status` sebagai acuan.
- `security.signals` berisi bukti pendukung dari pemindai seperti `staticScan`, `virusTotal`, dan `skillSpector`.
- `security.signals.dependencyRegistry` dipertahankan untuk kompatibilitas respons v1, tetapi pemindai keberadaan registri dependensi telah dihentikan dan kunci ini selalu bernilai `null`.
- `provenance` bernilai `server-resolved-github-import` hanya ketika ClawHub menyelesaikan dan menyimpan repositori/referensi/commit/jalur GitHub selama publikasi atau impor; jika tidak, nilainya adalah `unavailable`.

### `POST /api/v1/skills/-/security-verdicts`

Mengembalikan keputusan keamanan ringkas terkini untuk versi Skills yang persis. Endpoint
koleksi ini ditujukan bagi klien yang telah mengetahui versi Skills ClawHub terpasang
yang perlu ditampilkan, seperti Antarmuka Kontrol OpenClaw.

Permintaan:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

Catatan:

- `items` harus berisi 1–100 pasangan unik `{ slug, version }`.
- Hasil diberikan per item; satu Skills atau versi yang tidak ditemukan tidak menggagalkan seluruh respons.
- Respons hanya berisi keamanan. Respons tidak menyertakan data Kartu Skills, status kartu yang dibuat, daftar berkas artefak, atau payload pemindai terperinci.
- `security.signals` hanya berisi bukti pendukung pada tingkat status; gunakan `/scan` atau halaman audit keamanan ClawHub untuk detail pemindai lengkap.
- `security.signals.dependencyRegistry` dipertahankan untuk kompatibilitas respons v1, tetapi pemindai keberadaan registri dependensi telah dihentikan dan kunci ini selalu bernilai `null`.
- Ketiadaan Kartu Skills tidak memengaruhi `ok`, `decision`, atau `reasons` pada endpoint ini; klien sebaiknya membaca `skill-card.md` yang terpasang secara lokal ketika memerlukan isi kartu.
- Gunakan `/verify` ketika memerlukan amplop verifikasi Kartu Skills untuk satu Skills, `/card` ketika memerlukan Markdown kartu yang dibuat, dan `/scan` ketika memerlukan data pemindai terperinci.

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

- Secara default menggunakan versi terbaru.
- Batas ukuran berkas: 200KB.

### `GET /api/v1/packages`

Titik akhir katalog terpadu untuk:

- Skills
- Plugin kode
- Plugin bundel

Parameter kueri:

- `limit` (opsional): bilangan bulat (1–100)
- `cursor` (opsional): kursor paginasi
- `family` (opsional): `skill`, `code-plugin`, atau `bundle-plugin`
- `channel` (opsional): `official`, `community`, atau `private`
- `isOfficial` (opsional): `true` atau `false`
- `sort` (opsional): `updated` (default), `recommended`, `trending`, `downloads`, alias lama `installs`
- `category` (opsional): filter kategori Plugin. Hanya didukung ketika
  permintaan dibatasi ke paket Plugin (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins`, atau titik akhir paket dengan
  `family=code-plugin`/`family=bundle-plugin`). Kategori yang dikendalikan dan
  alias filter v1 lama didokumentasikan pada `GET /api/v1/plugins`.

Catatan:

- Nilai yang tidak valid untuk `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly`, atau `sort` mengembalikan `400`. Parameter kueri yang tidak dikenal diabaikan.
- `GET /api/v1/code-plugins` dan `GET /api/v1/bundle-plugins` tetap menjadi alias dengan keluarga tetap.
- Entri Skills tetap didukung oleh registri Skills dan masih hanya dapat diterbitkan melalui `POST /api/v1/skills`.
- `POST /api/v1/packages` masih hanya untuk rilis Plugin kode dan Plugin bundel.
- Pemanggil anonim hanya dapat melihat kanal paket publik.
- Pemanggil terautentikasi dapat melihat paket privat milik penerbit yang mereka ikuti dalam hasil daftar/pencarian.
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
  permintaan dibatasi ke paket Plugin. Kategori yang dikendalikan dan alias filter
  v1 lama didokumentasikan pada `GET /api/v1/plugins`.

Catatan:

- Nilai yang tidak valid untuk `family`, `channel`, `isOfficial`, `featured`, atau
  `highlightedOnly` mengembalikan `400`. Parameter kueri yang tidak dikenal diabaikan.
- Pemanggil anonim hanya dapat melihat kanal paket publik.
- Pemanggil terautentikasi dapat mencari paket privat milik penerbit yang mereka ikuti.
- `channel=private` hanya mengembalikan paket yang dapat dibaca oleh pemanggil terautentikasi.

### `GET /api/v1/plugins`

Penelusuran katalog khusus Plugin di seluruh paket Plugin kode dan Plugin bundel.

Parameter kueri:

- `limit` (opsional): bilangan bulat (1-100)
- `cursor` (opsional): kursor paginasi
- `isOfficial` (opsional): `true` atau `false`
- `sort` (opsional): `recommended` (default), `trending`, `downloads`, `updated`, alias lama `installs`
- `category` (opsional): filter kategori Plugin. Nilai saat ini:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Alias filter v1 lama tetap diterima pada titik akhir baca:

- `mcp-tooling`, `data`, dan `automation` dipetakan ke `tools`.
- `observability` dan `deployment` dipetakan ke `gateway`.
- `dev-tools` dipetakan ke `runtime`.

`trending` adalah papan peringkat pemasangan/unduhan selama tujuh hari dan tidak menggunakan total sepanjang waktu.
Pada titik akhir terpadu `/api/v1/packages`, opsi ini hanya berlaku untuk Plugin; gunakan
`/api/v1/skills?sort=trending` untuk katalog Skills.

Alias lama tidak diterima sebagai nilai kategori yang disimpan atau dideklarasikan oleh pembuat.

### `GET /api/v1/skills/export`

Ekspor massal Skills publik terbaru untuk analisis luring.

Autentikasi:

- Token API wajib digunakan.

Parameter kueri:

- `startDate` (wajib): batas bawah milidetik Unix untuk `updatedAt` Skills.
- `endDate` (wajib): batas atas milidetik Unix untuk `updatedAt` Skills.
- `limit` (opsional): bilangan bulat (1-250), default `250`.
- `cursor` (opsional): kursor paginasi dari respons sebelumnya.

Respons:

- Isi: arsip ZIP.
- Setiap Skills yang diekspor berakar di `{publisher}/{slug}/`.
- Skills yang dihosting menyertakan berkas versi tersimpan terbaru dan dicantumkan dalam
  `_manifest.json` dengan `sourceRef: "public-clawhub"`.
- Skills berbasis GitHub saat ini dengan pemindaian `clean` atau `suspicious` menyertakan
  `_source_handoff.json` dengan `sourceRef: "public-github"`, repositori, commit, jalur,
  hash konten, dan URL arsip. Skills tersebut tidak menyertakan berkas sumber yang dihosting ClawHub.
- Setiap Skills menyertakan `_export_skill_meta.json`.
- `_manifest.json` selalu disertakan di akar ZIP.
- `_errors.json` disertakan ketika Skills atau berkas tertentu tidak dapat
  diekspor.

Header:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

Ekspor massal rilis Plugin publik terbaru untuk analisis luring.

Autentikasi:

- Token API wajib digunakan.

Parameter kueri:

- `startDate` (wajib): batas bawah milidetik Unix untuk `updatedAt` Plugin.
- `endDate` (wajib): batas atas milidetik Unix untuk `updatedAt` Plugin.
- `limit` (opsional): bilangan bulat (1-250), nilai bawaan `250`.
- `cursor` (opsional): kursor paginasi dari respons sebelumnya.
- `family` (opsional): `code-plugin` atau `bundle-plugin`. Jika tidak ditentukan, berarti kedua
  keluarga Plugin.

Respons:

- Isi: arsip ZIP.
- Setiap Plugin yang diekspor berakar di `{family}/{packageName}/`.
- Setiap Plugin yang diekspor menyertakan berkas tersimpan dari rilis terbaru.
- Metadata ekspor per Plugin disimpan di
  `__clawhub_export/{family}/{packageName}/plugin_meta.json`.
- `_manifest.json` selalu disertakan di akar ZIP.
- `_errors.json` disertakan jika masing-masing Plugin atau berkas tidak dapat
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
- `limit` (opsional): bilangan bulat (1-100)
- `isOfficial` (opsional): `true` atau `false`
- `category` (opsional): filter kategori Plugin. Nilai saat ini:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Catatan:

- Alias filter v1 lama yang didokumentasikan di bagian `GET /api/v1/plugins` juga
  diterima.
- Pemfilteran kategori adalah filter API sebenarnya yang didukung oleh baris intisari
  kategori Plugin, bukan penulisan ulang kueri pencarian.
- Hasil dikembalikan berdasarkan urutan relevansi dan saat ini tidak menggunakan paginasi.
- Kontrol pengurutan UI peramban untuk pencarian Plugin mengurutkan ulang hasil relevansi yang dimuat,
  sesuai dengan perilaku penelusuran `/skills` saat ini.

### `GET /api/v1/packages/{name}`

Mengembalikan metadata detail paket.

Catatan:

- Skills juga dapat diresolusikan melalui rute ini dalam katalog terpadu.
- Paket privat mengembalikan `404` kecuali pemanggil dapat membaca penerbit pemiliknya.

### `DELETE /api/v1/packages/{name}`

Menghapus secara lunak sebuah paket dan semua rilisnya.

Catatan:

- Memerlukan token API untuk pemilik paket, pemilik/admin penerbit organisasi,
  moderator platform, atau admin platform.

### `GET /api/v1/packages/{name}/versions`

Mengembalikan riwayat versi.

Parameter kueri:

- `limit` (opsional): bilangan bulat (1–100)
- `cursor` (opsional): kursor paginasi

Catatan:

- Paket privat mengembalikan `404` kecuali pemanggil dapat membaca penerbit pemiliknya.

### `GET /api/v1/packages/{name}/versions/{version}`

Mengembalikan satu versi paket, termasuk metadata berkas, kompatibilitas,
verifikasi, metadata artefak, dan data pemindaian.

Catatan:

- `version.artifact.kind` bernilai `legacy-zip` untuk arsip paket model lama atau
  `npm-pack` untuk rilis yang didukung ClawPack.
- Rilis ClawPack menyertakan bidang `npmIntegrity`, `npmShasum`, dan
  `npmTarballName` yang kompatibel dengan npm.
- `version.sha256hash` adalah metadata kompatibilitas usang untuk klien lama. Bidang ini
  menghitung hash dari byte ZIP persis yang dikembalikan oleh `/api/v1/packages/{name}/download`.
  Klien modern sebaiknya menggunakan `version.artifact.sha256`, yang mengidentifikasi
  artefak rilis kanonis.
- `version.vtAnalysis`, `version.llmAnalysis`, dan `version.staticScan`
  disertakan jika data pemindaian tersedia.
- Paket privat mengembalikan `404` kecuali pemanggil dapat membaca penerbit pemiliknya.

### `GET /api/v1/packages/{name}/versions/{version}/security`

Mengembalikan ringkasan keamanan dan kepercayaan yang tepat untuk rilis paket bagi
klien instalasi. Ini adalah permukaan konsumsi publik OpenClaw untuk menentukan apakah
rilis yang diresolusikan dapat diinstal.

Autentikasi:

- Endpoint baca publik. Token pemilik, penerbit, moderator, atau admin tidak
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
  paket registri yang diresolusikan.
- `release.releaseId`, `release.version`, dan `release.createdAt` mengidentifikasi
  rilis persis yang dievaluasi.
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum`, dan `release.npmTarballName` tersedia jika diketahui untuk
  artefak rilis.
- `trust.scanStatus` adalah status kepercayaan efektif yang diperoleh dari masukan pemindai
  dan moderasi rilis manual.
- `trust.moderationState` dapat bernilai null. Nilainya `null` jika tidak ada moderasi
  rilis manual.
- `trust.blockedFromDownload` adalah sinyal pemblokiran instalasi. OpenClaw dan
  klien instalasi lainnya sebaiknya memblokir instalasi ketika nilai ini `true`, alih-alih
  menurunkan ulang aturan pemblokiran dari bidang pemindai atau moderasi.
- `trust.reasons` adalah daftar penjelasan untuk pengguna dan audit. Kode alasan
  adalah string ringkas dan stabil seperti `manual:quarantined`, `scan:malicious`,
  dan `package:malicious`.
- `trust.pending` berarti satu atau beberapa masukan kepercayaan masih menunggu penyelesaian.
- `trust.stale` berarti ringkasan kepercayaan dihitung dari masukan usang dan
  harus dianggap memerlukan penyegaran sebelum keputusan izin berkeyakinan tinggi.

Catatan:

- Endpoint ini bersifat spesifik versi. Klien sebaiknya memanggilnya setelah meresolusikan
  versi paket yang hendak diinstal, bukan hanya setelah membaca metadata paket
  terbaru.
- Paket privat mengembalikan `404` kecuali pemanggil dapat membaca penerbit pemiliknya.
- Endpoint ini sengaja lebih sempit daripada endpoint moderasi pemilik/moderator.
  Endpoint ini menampilkan keputusan instalasi dan penjelasan publik, bukan
  identitas pelapor, isi laporan, bukti privat, atau lini waktu peninjauan
  internal.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Mengembalikan metadata resolver artefak eksplisit untuk sebuah versi paket.

Catatan:

- Versi paket lama mengembalikan artefak `legacy-zip` dan
  `downloadUrl` ZIP lama.
- Versi ClawPack mengembalikan artefak `npm-pack`, bidang integritas npm,
  `tarballUrl`, dan URL kompatibilitas ZIP lama.
- Ini adalah permukaan resolver OpenClaw; pendekatan ini menghindari penebakan format arsip dari
  URL bersama.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Mengunduh artefak versi melalui jalur resolver eksplisit.

Catatan:

- Versi ClawPack mengalirkan byte `.tgz` npm-pack yang diunggah secara persis.
- Versi ZIP lama mengalihkan ke `/api/v1/packages/{name}/download?version=`.
- Menggunakan kelompok batas laju unduhan.

### `GET /api/v1/packages/{name}/readiness`

Mengembalikan kesiapan yang dihitung untuk konsumsi OpenClaw mendatang.

Pemeriksaan kesiapan mencakup:

- status kanal resmi
- ketersediaan versi terbaru
- ketersediaan artefak npm-pack ClawPack
- intisari artefak
- asal-usul repositori sumber dan commit
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
  `all` (nilai bawaan).
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
- `packageName` dinormalisasi sebagai nama npm; paket boleh tidak tersedia untuk migrasi
  yang direncanakan.
- Ini hanya melacak kesiapan migrasi. Ini tidak mengubah OpenClaw atau menghasilkan
  ClawPack.

### `GET /api/v1/packages/moderation/queue`

Endpoint moderator/admin untuk antrean peninjauan rilis paket.

Autentikasi:

- Memerlukan token API untuk pengguna moderator atau admin.

Parameter kueri:

- `status` (opsional): `open` (nilai bawaan), `blocked`, `manual`, atau `all`
- `limit` (opsional): bilangan bulat (1-100)
- `cursor` (opsional): kursor paginasi

Arti status:

- `open`: rilis yang mencurigakan, berbahaya, tertunda, dikarantina, dicabut, atau dilaporkan.
- `blocked`: rilis yang dikarantina, dicabut, atau berbahaya.
- `manual`: setiap rilis dengan penggantian moderasi manual.
- `all`: setiap rilis dengan penggantian manual, status pemindaian tidak bersih, atau laporan paket.

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

Melaporkan paket untuk ditinjau moderator. Laporan berlaku pada tingkat paket dan secara opsional
ditautkan ke versi. Laporan memasok antrean moderasi, tetapi tidak secara otomatis menyembunyikan atau
memblokir unduhan; moderator harus menggunakan moderasi rilis untuk
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

Endpoint moderator/admin untuk menerima laporan paket.

Autentikasi:

- Memerlukan token API untuk pengguna moderator atau admin.

Parameter kueri:

- `status` (opsional): `open` (bawaan), `confirmed`, `dismissed`, atau `all`
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
mengatur `status` kembali ke `open`. Berikan `finalAction: "quarantine"` atau
`finalAction: "revoke"` bersama laporan yang dikonfirmasi untuk menerapkan moderasi rilis dalam
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
- `revoked`: diblokir setelah suatu rilis sebelumnya dipercaya.

Rilis yang dikarantina dan dicabut mengembalikan `403` dari rute pengunduhan artefak.
Setiap perubahan menulis entri log audit.

### `GET /api/v1/packages/{name}/file`

Mengembalikan konten teks mentah untuk sebuah berkas paket.

Parameter kueri:

- `path` (wajib)
- `version` (opsional)
- `tag` (opsional)

Catatan:

- Secara bawaan menggunakan rilis terbaru.
- Menggunakan kelompok batas laju baca, bukan kelompok pengunduhan.
- Berkas biner mengembalikan `415`.
- Batas ukuran berkas: 200KB.
- Pemindaian VirusTotal yang tertunda tidak memblokir pembacaan; rilis berbahaya mungkin tetap ditahan di tempat lain.
- Paket privat mengembalikan `404` kecuali pemanggil dapat membaca penerbit pemiliknya.

### `GET /api/v1/packages/{name}/download`

Mengunduh arsip ZIP deterministik lama untuk sebuah rilis paket.

Parameter kueri:

- `version` (opsional)
- `tag` (opsional)

Catatan:

- Secara bawaan menggunakan rilis terbaru.
- Skills dialihkan ke `GET /api/v1/download`.
- Arsip Plugin/paket adalah berkas zip dengan root `package/` agar klien OpenClaw
  lama tetap berfungsi.
- Rute ini tetap hanya mendukung ZIP. Rute ini tidak mengalirkan berkas ClawPack `.tgz`.
- Respons menyertakan header `ETag`, `Digest`, `X-ClawHub-Artifact-Type`, dan
  `X-ClawHub-Artifact-Sha256` untuk pemeriksaan integritas resolver.
- Metadata khusus registri tidak disisipkan ke dalam arsip yang diunduh.
- Pemindaian VirusTotal yang tertunda tidak memblokir pengunduhan; rilis berbahaya mengembalikan `403`.
- Paket privat mengembalikan `404` kecuali pemanggil adalah pemiliknya.

### `GET /api/npm/{package}`

Mengembalikan packument yang kompatibel dengan npm untuk versi paket berbasis ClawPack.

Catatan:

- Hanya versi dengan tarball npm-pack ClawPack yang telah diunggah yang dicantumkan.
- Versi lama yang hanya menggunakan ZIP sengaja dihilangkan.
- `dist.tarball`, `dist.integrity`, dan `dist.shasum` menggunakan bidang yang kompatibel dengan npm
  sehingga pengguna dapat mengarahkan npm ke mirror jika memilih demikian.
- Packument paket bercakupan mendukung jalur permintaan `/api/npm/@scope/name` dan
  `/api/npm/@scope%2Fname` yang dikodekan oleh npm.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Mengalirkan byte tarball ClawPack yang diunggah secara persis untuk klien mirror npm.

Catatan:

- Menggunakan kelompok batas laju pengunduhan.
- Header pengunduhan menyertakan SHA-256 ClawHub serta metadata integritas/shasum npm.
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

Mengunduh ZIP versi skill yang dihosting, atau mengembalikan pengalihan sumber GitHub untuk
skill berbasis GitHub terkini dengan pemindaian `clean` atau `suspicious` dan tanpa versi
yang dihosting.

Parameter kueri:

- `slug` (wajib)
- `version` (opsional): string semver
- `tag` (opsional): nama tag (misalnya `latest`)

Catatan:

- Jika `version` maupun `tag` tidak diberikan, versi terbaru digunakan.
- Versi yang dihapus secara lunak mengembalikan `410`.
- Pengalihan skill berbasis GitHub tidak memproksi atau mencerminkan byte. Respons JSON
  menyertakan `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`,
  dan `archiveUrl`; status pemindaian/terkini merupakan gerbang dan tidak disertakan sebagai metadata
  payload keberhasilan.
- Statistik pengunduhan dihitung sebagai identitas unik per hari UTC (`userId` ketika token API valid, jika tidak alamat IP).

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
- Bidang payload opsional: `ownerHandle`. Jika ada, API menyelesaikan
  penerbit tersebut di sisi server dan mengharuskan pelaku memiliki akses penerbit.
- Bidang payload opsional: `migrateOwner`. Jika `true` bersama `ownerHandle`, sebuah
  skill yang sudah ada dapat dipindahkan ke pemilik tersebut jika pelaku adalah admin/pemilik pada
  penerbit saat ini maupun tujuan. Tanpa persetujuan eksplisit ini, perubahan pemilik
  ditolak.

### `POST /api/v1/packages`

Menerbitkan rilis code-plugin atau bundle-plugin.

- Memerlukan autentikasi token Bearer.
- Memerlukan `multipart/form-data`.
- Bidang formulir yang diizinkan adalah `payload`, blob `files` berulang, atau satu referensi tarball
  `clawpack`. `clawpack` dapat berupa blob `.tgz` atau ID penyimpanan yang dikembalikan oleh
  alur URL unggahan. Penerbitan ID penyimpanan yang dipersiapkan juga harus menyertakan
  `clawpackUploadTicket` yang dikembalikan bersama URL unggahan tersebut.
- Gunakan `files` atau `clawpack`, jangan pernah keduanya dalam permintaan yang sama.
- Isi JSON serta metadata `payload.files` / `payload.artifact` yang diberikan pemanggil
  ditolak.
- Permintaan penerbitan multipart langsung dibatasi hingga 18MB. Tarball ClawPack dapat
  menggunakan alur URL unggahan hingga batas tarball 120MB.
- Bidang payload opsional: `ownerHandle`. Jika ada, hanya admin yang dapat menerbitkan atas nama pemilik tersebut.

Sorotan validasi:

- `family` harus berupa `code-plugin` atau `bundle-plugin`.
- Paket Plugin memerlukan `openclaw.plugin.json`. Unggahan `.tgz` ClawPack harus
  memuatnya di `package/openclaw.plugin.json`.
- Plugin kode memerlukan `package.json`, metadata repositori sumber, metadata commit
  sumber, metadata skema konfigurasi, `openclaw.compat.pluginApi`, dan
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` dan `openclaw.environment` merupakan metadata opsional.
- Hanya penerbit organisasi `openclaw` dan penerbit pribadi milik anggota organisasi `openclaw`
  saat ini yang dapat menerbitkan ke saluran `official`.
- Penerbitan atas nama pihak lain tetap memvalidasi kelayakan saluran resmi terhadap akun pemilik tujuan.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Menghapus secara lunak / memulihkan sebuah skill (pemilik, moderator, atau admin).

Isi JSON opsional:

```json
{ "reason": "Held for moderation pending legal review." }
```

Jika ada, `reason` disimpan sebagai catatan moderasi skill dan disalin ke log audit.
Penghapusan lunak yang diprakarsai pemilik mencadangkan slug selama 30 hari, lalu slug dapat diklaim oleh
penerbit lain. Respons penghapusan menyertakan `slugReservedUntil` ketika masa kedaluwarsa ini berlaku.
Penyembunyian oleh moderator/admin dan penghapusan keamanan tidak kedaluwarsa dengan cara ini.

Respons penghapusan:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

Kode status:

- `200`: berhasil
- `401`: tidak terautentikasi
- `403`: dilarang
- `404`: skill/pengguna tidak ditemukan
- `500`: kesalahan server internal

### `POST /api/v1/users/publisher`

Khusus admin. Memastikan penerbit organisasi tersedia untuk suatu handle. Jika handle masih mengarah ke
pengguna bersama lama/penerbit pribadi, endpoint terlebih dahulu memigrasikannya menjadi penerbit organisasi.
Untuk organisasi yang baru dibuat, berikan `memberHandle`; admin yang bertindak tidak ditambahkan sebagai anggota.
`memberRole` secara bawaan adalah `owner`.

- Isi: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Respons: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

Pembuatan penerbit organisasi mandiri yang terautentikasi. Membuat penerbit organisasi baru dan menambahkan
pemanggil sebagai pemilik. Endpoint ini tidak memigrasikan handle pengguna/pribadi yang sudah ada dan
tidak menandai penerbit sebagai tepercaya/resmi.

- Isi: `{ "handle": "opik", "displayName": "Opik" }`
- Respons: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- Mengembalikan `409` ketika handle sudah digunakan oleh penerbit, pengguna, atau penerbit pribadi.

### `POST /api/v1/users/reserve`

Khusus admin. Mencadangkan slug root dan nama paket untuk pemilik yang berhak tanpa menerbitkan
rilis. Nama paket menjadi paket placeholder privat tanpa baris rilis, sehingga pemilik yang sama
nantinya dapat menerbitkan rilis code-plugin atau bundle-plugin yang sebenarnya dengan nama tersebut.

- Isi: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Respons: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

Khusus admin. Memulihkan penerbit pribadi untuk prinsipal pengganti GitHub OAuth yang telah diverifikasi
tanpa mengedit baris akun Convex Auth. Permintaan harus menyebutkan kedua ID akun penyedia GitHub
yang tidak dapat diubah; handle yang dapat diubah hanya digunakan sebagai pengaman yang ditujukan bagi operator.

Endpoint secara default menggunakan dry-run. Penerapan pemulihan memerlukan `dryRun: false` dan
`confirmIdentityVerified: true` setelah staf secara independen memverifikasi kesinambungan antara kedua
identitas utama GitHub. Pemulihan gagal secara tertutup ketika penerbit pribadi pengguna tujuan saat ini
memiliki skill, paket, atau sumber skill GitHub.
Pemulihan juga memigrasikan bidang `ownerUserId` lama untuk skill milik penerbit yang dipulihkan,
alias slug skill, paket, peringatan pemeriksa paket, dan baris digest pencarian turunan agar
jalur pemilik langsung sesuai dengan otoritas penerbit yang baru. Reservasi handle terlindungi yang aktif
untuk handle yang dipulihkan juga dialihkan kepada pengguna pengganti agar sinkronisasi profil berikutnya
tidak dapat memulihkan kembali otoritas pengguna sebelumnya yang bersaing. Setiap tabel utama dibatasi hingga
100 baris per transaksi penerapan; pemulihan yang lebih besar harus terlebih dahulu menggunakan migrasi pemilik yang dapat dilanjutkan.
Sumber skill GitHub memiliki cakupan per penerbit dan dilaporkan sebagai telah diperiksa, bukan ditulis ulang.

- Isi: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- Respons: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

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
- `merge` menyembunyikan daftar sumber dan mengalihkan slug sumber ke daftar tujuan.

### Endpoint pengalihan kepemilikan

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

Blokir pengguna dan hapus permanen skill yang dimilikinya (khusus moderator/admin).

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

Batalkan pemblokiran pengguna dan pulihkan skill yang memenuhi syarat (khusus admin).

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

Ubah alasan tersimpan untuk pemblokiran yang sudah ada tanpa membatalkan pemblokiran atau memulihkan
konten (khusus admin). Secara default menggunakan dry-run kecuali `dryRun` bernilai `false`.

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

Ubah peran pengguna (khusus admin).

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

Tampilkan daftar atau cari pengguna (khusus admin).

Parameter kueri:

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
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

Lihat `DEPRECATIONS.md` untuk rencana penghapusan.

`POST /api/cli/upload-url` mengembalikan `uploadUrl` dan `uploadTicket`. Publikasi
paket yang melakukan staging tarball ClawPack harus mengirim ID penyimpanan yang dihasilkan sebagai
`clawpack` dan tiket yang dikembalikan sebagai `clawpackUploadTicket`.

## Penemuan registri (`/.well-known/clawhub.json`)

CLI dapat menemukan pengaturan registri/autentikasi dari situs:

- `/.well-known/clawhub.json` (JSON, diutamakan)
- `/.well-known/clawdhub.json` (lama)

Skema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Jika Anda menghosting sendiri, sajikan berkas ini (atau tetapkan `CLAWHUB_REGISTRY` secara eksplisit; `CLAWDHUB_REGISTRY` adalah variabel lama).
