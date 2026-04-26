---
read_when:
    - Anda memerlukan ringkasan logging OpenClaw yang ramah untuk pemula
    - Anda ingin mengonfigurasi level log, format, atau redaksi
    - Anda sedang melakukan pemecahan masalah dan perlu menemukan log dengan cepat
summary: Log file, output konsol, tailing CLI, dan tab Logs di Control UI
title: Logging
x-i18n:
    generated_at: "2026-04-26T11:33:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6fa55caa65a2a06a757e37ad64c5fd030f958cf6827596db5c183c6c6db2ed9b
    source_path: logging.md
    workflow: 15
---

OpenClaw memiliki dua permukaan log utama:

- **Log file** (JSON lines) yang ditulis oleh Gateway.
- **Output konsol** yang ditampilkan di terminal dan UI Debug Gateway.

Tab **Logs** di Control UI melakukan tail pada log file gateway. Halaman ini menjelaskan di mana
log berada, cara membacanya, dan cara mengonfigurasi level serta format log.

## Lokasi log

Secara default, Gateway menulis file log rolling di bawah:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

Tanggal menggunakan zona waktu lokal host gateway.

Setiap file dirotasi saat mencapai `logging.maxFileBytes` (default: 100 MB).
OpenClaw menyimpan hingga lima arsip bernomor di samping file aktif, seperti
`openclaw-YYYY-MM-DD.1.log`, dan terus menulis ke log aktif baru alih-alih
menekan diagnostik.

Anda dapat menimpanya di `~/.openclaw/openclaw.json`:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## Cara membaca log

### CLI: live tail (disarankan)

Gunakan CLI untuk melakukan tail pada file log gateway melalui RPC:

```bash
openclaw logs --follow
```

Opsi saat ini yang berguna:

- `--local-time`: render timestamp dalam zona waktu lokal Anda
- `--url <url>` / `--token <token>` / `--timeout <ms>`: flag RPC Gateway standar
- `--expect-final`: flag tunggu respons akhir RPC berbasis agent (diterima di sini melalui shared client layer)

Mode output:

- **Sesi TTY**: baris log terstruktur yang rapi, berwarna, dan mudah dibaca.
- **Sesi non-TTY**: teks biasa.
- `--json`: JSON line-delimited (satu event log per baris).
- `--plain`: paksa teks biasa dalam sesi TTY.
- `--no-color`: nonaktifkan warna ANSI.

Saat Anda meneruskan `--url` eksplisit, CLI tidak otomatis menerapkan kredensial config atau
environment; sertakan `--token` sendiri jika target Gateway
memerlukan auth.

Dalam mode JSON, CLI mengeluarkan objek bertanda `type`:

- `meta`: metadata stream (file, cursor, size)
- `log`: entri log yang sudah diparse
- `notice`: petunjuk truncation / rotasi
- `raw`: baris log yang tidak diparse

Jika Gateway loopback lokal meminta pairing, `openclaw logs` akan fallback ke
file log lokal yang dikonfigurasi secara otomatis. Target `--url` eksplisit tidak
menggunakan fallback ini.

Jika Gateway tidak dapat dijangkau, CLI mencetak petunjuk singkat untuk menjalankan:

```bash
openclaw doctor
```

### Control UI (web)

Tab **Logs** di Control UI melakukan tail pada file yang sama menggunakan `logs.tail`.
Lihat [/web/control-ui](/id/web/control-ui) untuk cara membukanya.

### Log khusus channel

Untuk memfilter aktivitas channel (WhatsApp/Telegram/dll), gunakan:

```bash
openclaw channels logs --channel whatsapp
```

## Format log

### Log file (JSONL)

Setiap baris dalam file log adalah objek JSON. CLI dan Control UI mem-parse
entri-entri ini untuk merender output terstruktur (waktu, level, subsistem, pesan).

### Output konsol

Log konsol **sadar TTY** dan diformat agar mudah dibaca:

- Prefiks subsistem (misalnya `gateway/channels/whatsapp`)
- Pewarnaan level (info/warn/error)
- Mode compact atau JSON opsional

Pemformatan konsol dikendalikan oleh `logging.consoleStyle`.

### Log WebSocket Gateway

`openclaw gateway` juga memiliki logging protokol WebSocket untuk trafik RPC:

- mode normal: hanya hasil yang menarik (error, error parse, panggilan lambat)
- `--verbose`: semua trafik request/response
- `--ws-log auto|compact|full`: pilih gaya render verbose
- `--compact`: alias untuk `--ws-log compact`

Contoh:

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## Mengonfigurasi logging

Semua konfigurasi logging berada di bawah `logging` di `~/.openclaw/openclaw.json`.

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

### Level log

- `logging.level`: level **log file** (JSONL).
- `logging.consoleLevel`: level verbositas **konsol**.

Anda dapat menimpa keduanya melalui variabel environment **`OPENCLAW_LOG_LEVEL`** (misalnya `OPENCLAW_LOG_LEVEL=debug`). Variabel env ini didahulukan daripada file config, sehingga Anda dapat menaikkan verbositas untuk satu eksekusi tanpa mengedit `openclaw.json`. Anda juga dapat meneruskan opsi CLI global **`--log-level <level>`** (misalnya, `openclaw --log-level debug gateway run`), yang menimpa variabel environment untuk perintah tersebut.

`--verbose` hanya memengaruhi output konsol dan verbositas log WS; ini tidak mengubah
level log file.

### Gaya konsol

`logging.consoleStyle`:

- `pretty`: ramah manusia, berwarna, dengan timestamp.
- `compact`: output lebih rapat (terbaik untuk sesi panjang).
- `json`: JSON per baris (untuk pemroses log).

### Redaksi

Ringkasan tool dapat meredaksi token sensitif sebelum mencapai konsol:

- `logging.redactSensitive`: `off` | `tools` (default: `tools`)
- `logging.redactPatterns`: daftar string regex untuk menimpa set default

Redaksi diterapkan pada sink logging untuk **output konsol**, **diagnostik konsol
yang dirutekan ke stderr**, dan **log file**. Log file tetap JSONL, tetapi nilai
rahasia yang cocok disamarkan sebelum baris ditulis ke disk.

## Diagnostik dan OpenTelemetry

Diagnostik adalah event terstruktur yang dapat dibaca mesin untuk eksekusi model dan
telemetri alur pesan (Webhook, antrean, state sesi). Diagnostik **tidak**
menggantikan log — diagnostik memberi makan metric, trace, dan exporter. Event dikeluarkan
di dalam proses baik Anda mengekspornya maupun tidak.

Dua permukaan yang berdekatan:

- **Ekspor OpenTelemetry** — kirim metric, trace, dan log melalui OTLP/HTTP ke
  kolektor atau backend yang kompatibel dengan OpenTelemetry
  (Grafana, Datadog, Honeycomb, New Relic, Tempo, dll.). Konfigurasi lengkap,
  katalog sinyal, nama metric/span, variabel env, dan model privasi ada di halaman khusus:
  [Ekspor OpenTelemetry](/id/gateway/opentelemetry).
- **Flag diagnostik** — flag debug-log yang ditargetkan yang merutekan log tambahan ke
  `logging.file` tanpa menaikkan `logging.level`. Flag tidak peka huruf besar-kecil
  dan mendukung wildcard (`telegram.*`, `*`). Konfigurasikan di bawah `diagnostics.flags`
  atau melalui override env `OPENCLAW_DIAGNOSTICS=...`. Panduan lengkap:
  [Flag diagnostik](/id/diagnostics/flags).

Untuk mengaktifkan event diagnostik bagi Plugin atau sink kustom tanpa ekspor OTLP:

```json5
{
  diagnostics: { enabled: true },
}
```

Untuk ekspor OTLP ke kolektor, lihat [Ekspor OpenTelemetry](/id/gateway/opentelemetry).

## Tips pemecahan masalah

- **Gateway tidak dapat dijangkau?** Jalankan `openclaw doctor` terlebih dahulu.
- **Log kosong?** Periksa bahwa Gateway sedang berjalan dan menulis ke path file
  dalam `logging.file`.
- **Perlu detail lebih banyak?** Atur `logging.level` ke `debug` atau `trace` lalu coba lagi.

## Terkait

- [Ekspor OpenTelemetry](/id/gateway/opentelemetry) — ekspor OTLP/HTTP, katalog metric/span, model privasi
- [Flag diagnostik](/id/diagnostics/flags) — flag debug-log yang ditargetkan
- [Internal logging Gateway](/id/gateway/logging) — gaya log WS, prefiks subsistem, dan penangkapan konsol
- [Referensi konfigurasi](/id/gateway/configuration-reference#diagnostics) — referensi field `diagnostics.*` lengkap
