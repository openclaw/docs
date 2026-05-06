---
read_when:
    - Mengubah keluaran atau format log
    - Men-debug keluaran CLI atau Gateway
summary: Permukaan logging, log berkas, gaya log WS, dan pemformatan konsol
title: Pencatatan log Gateway
x-i18n:
    generated_at: "2026-05-06T09:12:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 078b4196ef1c5af5f7f0a4253f704d90d474a3ff668ec555559cab56cbcb15c6
    source_path: gateway/logging.md
    workflow: 16
---

# Logging

Untuk ringkasan yang berorientasi pengguna (CLI + Control UI + konfigurasi), lihat [/logging](/id/logging).

OpenClaw memiliki dua "permukaan" log:

- **Output konsol** (yang Anda lihat di terminal / Debug UI).
- **Log file** (baris JSON) yang ditulis oleh logger Gateway.

Saat startup, Gateway mencatat model agen default yang sudah di-resolve bersama dengan
default mode yang memengaruhi sesi baru, misalnya:

```text
agent model: openai-codex/gpt-5.5 (thinking=medium, fast=on)
```

`thinking` berasal dari agen default, parameter model, atau default agen global;
ketika tidak disetel, ringkasan startup menampilkan `medium`. `fast` berasal dari
agen default atau parameter `fastMode` model.

## Logger berbasis file

- File log rolling default berada di bawah `/tmp/openclaw/` (satu file per hari): `openclaw-YYYY-MM-DD.log`
  - Tanggal menggunakan zona waktu lokal host gateway.
- File log aktif dirotasi pada `logging.maxFileBytes` (default: 100 MB), dengan menyimpan
  hingga lima arsip bernomor dan terus menulis file aktif baru.
- Path dan level file log dapat dikonfigurasi melalui `~/.openclaw/openclaw.json`:
  - `logging.file`
  - `logging.level`

Format file adalah satu objek JSON per baris.

Tab Log Control UI mengikuti ekor file ini melalui gateway (`logs.tail`).
CLI dapat melakukan hal yang sama:

```bash
openclaw logs --follow
```

**Verbose vs. level log**

- **Log file** dikontrol secara eksklusif oleh `logging.level`.
- `--verbose` hanya memengaruhi **verbose konsol** (dan gaya log WS); ini **tidak**
  menaikkan level log file.
- Untuk menangkap detail yang hanya verbose di log file, setel `logging.level` ke `debug` atau
  `trace`.
- Logging trace juga menyertakan ringkasan timing diagnostik untuk hot path tertentu,
  seperti persiapan factory tool Plugin. Lihat
  [/tools/plugin#slow-plugin-tool-setup](/id/tools/plugin#slow-plugin-tool-setup).

## Penangkapan konsol

CLI menangkap `console.log/info/warn/error/debug/trace` dan menuliskannya ke log file,
sambil tetap mencetak ke stdout/stderr.

Anda dapat menyesuaikan verbose konsol secara independen melalui:

- `logging.consoleLevel` (default `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Redaksi

OpenClaw dapat menyamarkan token sensitif sebelum output log atau transkrip keluar dari
proses. Kebijakan redaksi logging ini diterapkan pada sink teks konsol, log file, rekaman log OTLP,
dan transkrip sesi, sehingga nilai rahasia yang cocok disamarkan
sebelum baris JSONL atau pesan ditulis ke disk.

- `logging.redactSensitive`: `off` | `tools` (default: `tools`)
- `logging.redactPatterns`: array string regex (mengganti default)
  - Gunakan string regex mentah (otomatis `gi`), atau `/pattern/flags` jika Anda membutuhkan flag khusus.
  - Kecocokan disamarkan dengan mempertahankan 6 karakter pertama + 4 karakter terakhir (panjang >= 18), jika tidak `***`.
  - Default mencakup assignment kunci umum, flag CLI, field JSON, header bearer, blok PEM, prefiks token populer, dan nama field kredensial pembayaran seperti nomor kartu, CVC/CVV, token pembayaran bersama, dan kredensial pembayaran.

Beberapa batas keamanan selalu melakukan redaksi terlepas dari `logging.redactSensitive`.
Itu mencakup event pemanggilan tool Control UI, output tool `sessions_history`,
ekspor dukungan diagnostik, observasi error provider, tampilan perintah persetujuan exec,
dan log protokol WebSocket Gateway. Permukaan ini tetap dapat menggunakan
`logging.redactPatterns` sebagai pola tambahan, tetapi `redactSensitive: "off"`
tidak membuatnya memancarkan rahasia mentah.

## Log WebSocket Gateway

Gateway mencetak log protokol WebSocket dalam dua mode:

- **Mode normal (tanpa `--verbose`)**: hanya hasil RPC yang "menarik" yang dicetak:
  - error (`ok=false`)
  - panggilan lambat (ambang default: `>= 50ms`)
  - error parse
- **Mode verbose (`--verbose`)**: mencetak seluruh traffic request/response WS.

### Gaya log WS

`openclaw gateway` mendukung switch gaya per-gateway:

- `--ws-log auto` (default): mode normal dioptimalkan; mode verbose menggunakan output ringkas
- `--ws-log compact`: output ringkas (request/response berpasangan) saat verbose
- `--ws-log full`: output lengkap per-frame saat verbose
- `--compact`: alias untuk `--ws-log compact`

Contoh:

```bash
# optimized (only errors/slow)
openclaw gateway

# show all WS traffic (paired)
openclaw gateway --verbose --ws-log compact

# show all WS traffic (full meta)
openclaw gateway --verbose --ws-log full
```

## Pemformatan konsol (logging subsistem)

Formatter konsol **sadar TTY** dan mencetak baris berprefiks yang konsisten.
Logger subsistem menjaga output tetap terkelompok dan mudah dipindai.

Perilaku:

- **Prefiks subsistem** pada setiap baris (mis. `[gateway]`, `[canvas]`, `[tailscale]`)
- **Warna subsistem** (stabil per subsistem) ditambah pewarnaan level
- **Warna ketika output adalah TTY atau lingkungan terlihat seperti terminal kaya** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), menghormati `NO_COLOR`
- **Prefiks subsistem yang dipendekkan**: menghapus awalan `gateway/` + `channels/`, mempertahankan 2 segmen terakhir (mis. `whatsapp/outbound`)
- **Sub-logger berdasarkan subsistem** (prefiks otomatis + field terstruktur `{ subsystem }`)
- **`logRaw()`** untuk output QR/UX (tanpa prefiks, tanpa pemformatan)
- **Gaya konsol** (mis. `pretty | compact | json`)
- **Level log konsol** terpisah dari level log file (file mempertahankan detail penuh ketika `logging.level` disetel ke `debug`/`trace`)
- **Body pesan WhatsApp** dicatat pada `debug` (gunakan `--verbose` untuk melihatnya)

Ini menjaga log file yang ada tetap stabil sambil membuat output interaktif mudah dipindai.

## Terkait

- [Logging](/id/logging)
- [Ekspor OpenTelemetry](/id/gateway/opentelemetry)
- [Ekspor diagnostik](/id/gateway/diagnostics)
