---
read_when:
    - Anda memerlukan ikhtisar pencatatan log OpenClaw yang mudah dipahami oleh pemula
    - Anda ingin mengonfigurasi tingkat log, format, atau penyamaran data sensitif
    - Anda sedang memecahkan masalah dan perlu menemukan log dengan cepat
summary: Log file, keluaran konsol, pemantauan langsung CLI, dan tab Log di UI Kontrol
title: Pencatatan log
x-i18n:
    generated_at: "2026-07-12T14:20:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: add41e125c22ca1b2343a3a1fb1e88e94ef9c81a07c48b9eb67f4d4b2510dd08
    source_path: logging.md
    workflow: 16
---

OpenClaw memiliki dua permukaan log utama:

- **Log berkas** (baris JSON) yang ditulis oleh Gateway.
- **Keluaran konsol** di terminal yang menjalankan Gateway.

Tab **Log** pada UI Kontrol mengikuti log berkas Gateway secara langsung. Halaman ini menjelaskan lokasi
log, cara membacanya, serta cara mengonfigurasi tingkat dan format log.

## Lokasi log

Secara default, Gateway menulis satu berkas log bergulir per hari:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

Tanggal menggunakan zona waktu lokal hos Gateway. Jika `/tmp/openclaw` tidak aman
atau tidak tersedia (dan selalu demikian di Windows), OpenClaw menggunakan direktori
`openclaw-<uid>` dengan cakupan pengguna di bawah direktori sementara OS. Berkas log
bertanggal dihapus setelah 24 jam.

Setiap berkas dirotasi ketika penulisan berikutnya akan melampaui `logging.maxFileBytes`
(default: 100 MB). OpenClaw menyimpan hingga lima arsip bernomor di samping
berkas aktif, seperti `openclaw-YYYY-MM-DD.1.log`, dan terus menulis ke log aktif
yang baru alih-alih menghentikan diagnostik.

Anda dapat mengganti jalurnya di `~/.openclaw/openclaw.json`:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## Cara membaca log

### CLI: ikuti langsung (disarankan)

Ikuti berkas log Gateway melalui RPC:

```bash
openclaw logs --follow
```

Opsi:

| Flag                | Default  | Perilaku                                                                              |
| ------------------- | -------- | ------------------------------------------------------------------------------------- |
| `--follow`          | nonaktif | Terus mengikuti; menyambung kembali dengan jeda bertahap saat koneksi terputus         |
| `--limit <n>`       | `200`    | Jumlah maksimum baris per pengambilan                                                  |
| `--max-bytes <n>`   | `250000` | Jumlah maksimum bita yang dibaca per pengambilan                                      |
| `--interval <ms>`   | `1000`   | Interval pemeriksaan saat mengikuti                                                   |
| `--json`            | nonaktif | JSON berbatas baris (satu peristiwa per baris)                                        |
| `--plain`           | nonaktif | Paksa teks biasa dalam sesi TTY                                                       |
| `--no-color`        | —        | Nonaktifkan warna ANSI                                                                |
| `--utc`             | nonaktif | Tampilkan stempel waktu dalam UTC (waktu lokal adalah default)                        |
| `--local-time`      | nonaktif | Ejaan kompatibilitas yang diterima untuk default waktu lokal; tidak memiliki efek lain |
| `--url` / `--token` | —        | Flag RPC Gateway standar                                                              |
| `--timeout <ms>`    | `30000`  | Batas waktu RPC Gateway                                                               |
| `--expect-final`    | nonaktif | Flag tunggu respons akhir RPC berbasis agen (diterima di sini melalui lapisan klien bersama) |

Mode keluaran:

- **Sesi TTY**: baris log terstruktur, berwarna, dan mudah dibaca.
- **Sesi non-TTY**: teks biasa.

Saat Anda memberikan `--url` secara eksplisit, CLI tidak otomatis menerapkan kredensial
dari konfigurasi atau lingkungan; sertakan sendiri `--token`, atau panggilan akan gagal dengan
`gateway url override requires explicit credentials`.

Dalam mode JSON, CLI mengeluarkan objek yang ditandai dengan `type`:

- `meta`: metadata aliran (berkas, sumber, jenis sumber, layanan, kursor, ukuran)
- `log`: entri log yang telah diurai
- `notice`: petunjuk pemotongan/rotasi
- `raw`: baris log yang belum diurai
- `error`: kegagalan koneksi Gateway (ditulis ke stderr)

Jika Gateway local loopback implisit meminta pemasangan, ditutup selama proses koneksi,
atau mengalami batas waktu sebelum `logs.tail` menjawab, `openclaw logs` secara otomatis
beralih ke log berkas Gateway yang dikonfigurasi. Target `--url` eksplisit tidak menggunakan
mekanisme pengalihan ini. `openclaw logs --follow` lebih ketat: di Linux, perintah ini menggunakan jurnal
Gateway user-systemd aktif berdasarkan PID jika tersedia, dan jika tidak, mencoba kembali
Gateway langsung dengan jeda bertahap alih-alih mengikuti berkas berdampingan yang mungkin
sudah kedaluwarsa.

Jika Gateway tidak dapat dijangkau, CLI menampilkan petunjuk singkat untuk menjalankan:

```bash
openclaw doctor
```

### UI Kontrol (web)

Tab **Log** pada UI Kontrol mengikuti berkas yang sama menggunakan `logs.tail`.
Lihat [UI Kontrol](/id/web/control-ui) untuk cara membukanya.

### Log khusus kanal

Untuk memfilter aktivitas kanal (WhatsApp/Telegram/dll.), gunakan:

```bash
openclaw channels logs --channel whatsapp
```

Default `--channel` adalah `all`; `--lines <n>` (default 200) dan `--json` juga
tersedia.

## Format log

### Log berkas (JSONL)

Setiap baris dalam berkas log adalah objek JSON. CLI dan UI Kontrol mengurai
entri ini untuk menampilkan keluaran terstruktur (waktu, tingkat, subsistem, pesan).

Rekaman JSONL log berkas juga menyertakan bidang tingkat atas yang dapat difilter mesin
jika tersedia:

- `hostname`: nama hos Gateway.
- `message`: teks pesan log yang diratakan untuk pencarian teks lengkap.
- `agent_id`: ID agen aktif ketika panggilan log membawa konteks agen.
- `session_id`: ID/kunci sesi aktif ketika panggilan log membawa konteks sesi.
- `channel`: kanal aktif ketika panggilan log membawa konteks kanal.

OpenClaw mempertahankan argumen log terstruktur asli bersama bidang-bidang ini
agar pengurai yang membaca kunci argumen tslog bernomor tetap berfungsi.

Aktivitas percakapan, suara waktu nyata, dan ruang terkelola menghasilkan rekaman log
siklus hidup terbatas melalui alur log berkas yang sama. Rekaman ini mencakup jenis peristiwa,
mode, transportasi, penyedia, dan pengukuran ukuran/waktu jika tersedia, tetapi menghilangkan
teks transkrip, muatan audio, ID giliran, ID panggilan, dan ID item penyedia.

### Keluaran konsol

Log konsol **peka terhadap TTY** dan diformat agar mudah dibaca:

- Prefiks subsistem (misalnya `gateway/channels/whatsapp`)
- Pewarnaan tingkat (info/peringatan/galat)
- Mode ringkas atau JSON opsional

Pemformatan konsol dikendalikan oleh `logging.consoleStyle`.

### Log WebSocket Gateway

`openclaw gateway` juga memiliki pencatatan protokol WebSocket untuk lalu lintas RPC:

- mode normal: hanya hasil yang penting (galat, galat penguraian, panggilan lambat)
- `--verbose`: seluruh lalu lintas permintaan/respons
- `--ws-log auto|compact|full`: pilih gaya tampilan verbose
- `--compact`: alias untuk `--ws-log compact`

Contoh:

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## Mengonfigurasi pencatatan log

Semua konfigurasi pencatatan log berada di bawah `logging` dalam `~/.openclaw/openclaw.json`.

```json
{
  "logging": {
    "level": "info",
    "file": "/tmp/openclaw/openclaw-YYYY-MM-DD.log",
    "consoleLevel": "info",
    "consoleStyle": "pretty",
    "redactSensitive": "tools",
    "redactPatterns": ["sk-.*"]
  }
}
```

### Tingkat log

Tingkat: `silent`, `fatal`, `error`, `warn`, `info`, `debug`, `trace`.

- `logging.level`: tingkat **log berkas** (JSONL) (default: `info`).
- `logging.consoleLevel`: tingkat verbositas **konsol**.

Anda dapat mengganti keduanya melalui variabel lingkungan **`OPENCLAW_LOG_LEVEL`** (misalnya `OPENCLAW_LOG_LEVEL=debug`). Variabel lingkungan lebih diprioritaskan daripada berkas konfigurasi, sehingga Anda dapat meningkatkan verbositas untuk satu kali proses tanpa mengedit `openclaw.json`. Anda juga dapat memberikan opsi CLI global **`--log-level <level>`** (misalnya, `openclaw --log-level debug gateway run`), yang mengganti variabel lingkungan untuk perintah tersebut.

`--verbose` hanya memengaruhi keluaran konsol dan verbositas log WS; opsi ini tidak mengubah
tingkat log berkas.

### Diagnostik transportasi model tertarget

Saat men-debug panggilan penyedia, gunakan flag lingkungan tertarget alih-alih meningkatkan
semua log menjadi `debug`:

```bash
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 openclaw gateway
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools OPENCLAW_DEBUG_SSE=events openclaw gateway
```

Flag yang tersedia:

- `OPENCLAW_DEBUG_MODEL_TRANSPORT=1`: menghasilkan awal permintaan, respons pengambilan, header
  SDK, peristiwa streaming pertama, penyelesaian aliran, dan galat transportasi pada
  tingkat `info`.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=summary`: menyertakan ringkasan muatan permintaan terbatas
  dalam log permintaan model.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=tools`: menyertakan semua nama alat yang terlihat oleh model dalam
  ringkasan muatan.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`: menyertakan cuplikan muatan JSON
  yang disunting dan dibatasi. Gunakan hanya saat men-debug; rahasia disunting, tetapi prompt
  dan teks pesan mungkin tetap ada.
- `OPENCLAW_DEBUG_SSE=events`: menghasilkan waktu peristiwa pertama dan penyelesaian aliran.
- `OPENCLAW_DEBUG_SSE=peek`: juga menghasilkan lima muatan peristiwa SSE pertama yang
  disunting, dengan batas per peristiwa.
- `OPENCLAW_DEBUG_CODE_MODE=1`: menghasilkan diagnostik permukaan model mode kode,
  termasuk saat alat penyedia native disembunyikan karena mode kode memiliki
  permukaan alat tersebut.

Flag ini mencatat melalui pencatatan OpenClaw biasa, sehingga `openclaw logs --follow`
dan tab Log UI Kontrol menampilkannya. Tanpa flag tersebut, diagnostik yang sama
tetap tersedia pada tingkat `debug`.

Metadata awal dan respons `[model-fetch]` (penyedia, API, model, status,
latensi, dan bidang permintaan seperti metode, URL, batas waktu, proksi, dan kebijakan)
selalu dihasilkan pada tingkat `info` terlepas dari
`OPENCLAW_DEBUG_MODEL_TRANSPORT`, sehingga kondisi dasar transportasi model dapat terlihat
tanpa flag debug.

### Korelasi pelacakan

Log berkas berformat JSONL. Ketika panggilan log membawa konteks jejak diagnostik yang valid,
OpenClaw menulis bidang jejak sebagai kunci JSON tingkat atas (`traceId`, `spanId`,
`parentSpanId`, `traceFlags`) agar pemroses log eksternal dapat mengorelasikan baris
dengan span OTEL dan propagasi `traceparent` penyedia.

Permintaan HTTP Gateway dan bingkai WebSocket Gateway menetapkan cakupan jejak permintaan
internal. Log dan peristiwa diagnostik yang dihasilkan di dalam cakupan asinkron tersebut mewarisi
jejak permintaan ketika tidak memberikan konteks jejak eksplisit. Jejak eksekusi agen dan
panggilan model menjadi turunan jejak permintaan aktif, sehingga log lokal,
cuplikan diagnostik, span OTEL, dan header `traceparent` penyedia tepercaya dapat
digabungkan berdasarkan `traceId` tanpa mencatat permintaan mentah atau konten model.

Rekaman log siklus hidup percakapan juga mengalir ke ekspor log diagnostics-otel ketika
ekspor log OpenTelemetry diaktifkan, menggunakan atribut terbatas yang sama seperti log
berkas. Konfigurasikan `diagnostics.otel.logsExporter` untuk memilih OTLP, JSONL stdout, atau
kedua tujuan.

### Ukuran dan waktu panggilan model

Diagnostik panggilan model mencatat pengukuran permintaan/respons terbatas tanpa
menangkap prompt mentah atau konten respons:

- `requestPayloadBytes`: ukuran bita UTF-8 dari muatan permintaan model akhir
- `responseStreamBytes`: ukuran bita UTF-8 dari muatan potongan respons model yang dialirkan.
  Peristiwa delta teks, pemikiran, dan panggilan alat berfrekuensi tinggi hanya menghitung
  bita `delta` inkremental, bukan cuplikan `partial` lengkap.
- `timeToFirstByteMs`: waktu berlalu sebelum peristiwa respons streaming pertama
- `durationMs`: total durasi panggilan model

Bidang-bidang ini tersedia untuk cuplikan diagnostik, hook Plugin panggilan model, serta
span/metrik panggilan model OTEL ketika ekspor diagnostik diaktifkan.

### Gaya konsol

`logging.consoleStyle`:

- `pretty`: ramah manusia, berwarna, dengan stempel waktu.
- `compact`: keluaran lebih padat (terbaik untuk sesi panjang).
- `json`: JSON per baris (untuk pemroses log).

### Penyuntingan

OpenClaw dapat menyunting token sensitif sebelum mencapai keluaran konsol, log berkas,
rekaman log OTLP, teks transkrip sesi yang disimpan, atau muatan peristiwa alat
UI Kontrol (argumen awal alat, muatan hasil parsial/akhir, keluaran eksekusi turunan,
dan ringkasan patch):

- `logging.redactSensitive`: `off` | `tools` (default: `tools`)
- `logging.redactPatterns`: daftar string regex yang menggantikan kumpulan default untuk keluaran log/transkrip. Untuk muatan alat UI Kontrol, pola khusus diterapkan di atas default bawaan, sehingga menambahkan pola tidak pernah melemahkan penyuntingan nilai yang telah terdeteksi oleh default.

Log berkas dan transkrip sesi tetap berformat JSONL, tetapi nilai rahasia yang cocok
disamarkan sebelum baris atau pesan ditulis ke cakram. Penyuntingan dilakukan dengan upaya terbaik:
ini diterapkan pada konten pesan yang berisi teks dan string log, bukan pada setiap
bidang pengenal atau muatan biner.

Default bawaan mencakup kredensial API umum dan nama kolom kredensial pembayaran
seperti nomor kartu, CVC/CVV, token pembayaran bersama, dan kredensial pembayaran
ketika muncul sebagai kolom JSON, parameter URL, flag CLI, atau penetapan nilai.

`logging.redactSensitive: "off"` hanya menonaktifkan kebijakan umum untuk
log/transkrip ini. OpenClaw tetap menyamarkan muatan batas keamanan yang dapat
ditampilkan kepada klien UI, bundel dukungan, pengamat diagnostik, permintaan
persetujuan, atau alat agen. Contohnya meliputi peristiwa pemanggilan alat Control
UI, keluaran `sessions_history`, ekspor dukungan diagnostik, pengamatan kesalahan
penyedia, tampilan perintah persetujuan eksekusi, dan log protokol WebSocket
Gateway. `logging.redactPatterns` kustom tetap dapat menambahkan pola khusus
proyek pada permukaan tersebut.

## Diagnostik dan OpenTelemetry

Diagnostik adalah peristiwa terstruktur yang dapat dibaca mesin untuk eksekusi
model dan telemetri alur pesan (Webhook, antrean, status sesi). Diagnostik
**tidak** menggantikan log—diagnostik memasok data ke metrik, jejak, dan
pengekspor. Secara default, peristiwa dipancarkan di dalam proses (atur
`diagnostics.enabled: false` untuk menonaktifkannya); pengeksporannya dilakukan
secara terpisah.

Dua permukaan yang saling berdekatan:

- **Ekspor OpenTelemetry** — kirim metrik, jejak, dan log melalui OTLP/HTTP ke
  pengumpul atau backend apa pun yang kompatibel dengan OpenTelemetry (Datadog,
  Grafana, Honeycomb, New Relic, Tempo, dan sebagainya). Konfigurasi lengkap,
  katalog sinyal, nama metrik/rentang, variabel lingkungan, dan model privasi
  tersedia di halaman khusus:
  [Ekspor OpenTelemetry](/id/gateway/opentelemetry).
- **Flag diagnostik** — flag log debug tertarget yang mengarahkan log tambahan
  ke `logging.file` tanpa menaikkan `logging.level`. Flag tidak membedakan huruf
  besar dan kecil serta mendukung karakter pengganti (`telegram.*`, `*`).
  Konfigurasikan melalui `diagnostics.flags` atau penggantian variabel lingkungan
  `OPENCLAW_DIAGNOSTICS=...`. Panduan lengkap:
  [Flag diagnostik](/id/diagnostics/flags).

Untuk mengekspor OTLP ke pengumpul, lihat [Ekspor OpenTelemetry](/id/gateway/opentelemetry).

## Kiat pemecahan masalah

- **Gateway tidak dapat dijangkau?** Jalankan `openclaw doctor` terlebih dahulu.
- **Log kosong?** Pastikan Gateway berjalan dan menulis ke jalur berkas yang
  ditentukan dalam `logging.file`.
- **Memerlukan detail lebih lanjut?** Atur `logging.level` ke `debug` atau `trace`, lalu coba lagi.

## Terkait

- [Ekspor OpenTelemetry](/id/gateway/opentelemetry) — ekspor OTLP/HTTP, katalog metrik/rentang, model privasi
- [Flag diagnostik](/id/diagnostics/flags) — flag log debug tertarget
- [Internal pencatatan Gateway](/id/gateway/logging) — gaya log WS, prefiks subsistem, dan perekaman konsol
- [Referensi konfigurasi](/id/gateway/configuration-reference#diagnostics) — referensi lengkap kolom `diagnostics.*`
