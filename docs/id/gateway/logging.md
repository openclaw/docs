---
read_when:
    - Mengubah keluaran atau format pencatatan log
    - Men-debug keluaran CLI atau Gateway
summary: Permukaan pencatatan log, log berkas, gaya log WS, dan pemformatan konsol
title: Pencatatan log Gateway
x-i18n:
    generated_at: "2026-05-06T17:56:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 16bce5763754d13f855a46777b4c3cc7a7c966e35e0cd08a15f359fd22623bcb
    source_path: gateway/logging.md
    workflow: 16
---

# Pencatatan Log

Untuk ringkasan yang berhadapan dengan pengguna (CLI + UI Kontrol + konfigurasi), lihat [/logging](/id/logging).

OpenClaw memiliki dua "permukaan" log:

- **Output konsol** (yang Anda lihat di terminal / UI Debug).
- **Log file** (baris JSON) yang ditulis oleh logger Gateway.

Saat startup, Gateway mencatat model agen default yang telah diselesaikan bersama dengan
default mode yang memengaruhi sesi baru, misalnya:

```text
agent model: openai-codex/gpt-5.5 (thinking=medium, fast=on)
```

`thinking` berasal dari agen default, parameter model, atau default agen global;
ketika belum diatur, ringkasan startup menampilkan `medium`. `fast` berasal dari
agen default atau parameter model `fastMode`.

## Logger berbasis file

- File log bergulir default berada di bawah `/tmp/openclaw/` (satu file per hari): `openclaw-YYYY-MM-DD.log`
  - Tanggal menggunakan zona waktu lokal host Gateway.
- File log aktif berotasi pada `logging.maxFileBytes` (default: 100 MB), menyimpan
  hingga lima arsip bernomor dan terus menulis file aktif baru.
- Jalur dan level file log dapat dikonfigurasi melalui `~/.openclaw/openclaw.json`:
  - `logging.file`
  - `logging.level`

Format file adalah satu objek JSON per baris.

Alur kode percakapan, suara realtime, dan ruang terkelola menggunakan logger file bersama untuk
catatan siklus hidup yang dibatasi. Catatan ini ditujukan untuk debug operasional
dan ekspor log OTLP; teks transkrip, payload audio, ID giliran, ID panggilan, dan
ID item penyedia tidak disalin ke catatan log.

Tab Log UI Kontrol mengikuti file ini melalui Gateway (`logs.tail`).
CLI dapat melakukan hal yang sama:

```bash
openclaw logs --follow
```

**Verbose vs. level log**

- **Log file** dikontrol sepenuhnya oleh `logging.level`.
- `--verbose` hanya memengaruhi **keterincian konsol** (dan gaya log WS); ini **tidak**
  menaikkan level log file.
- Untuk menangkap detail khusus verbose dalam log file, atur `logging.level` ke `debug` atau
  `trace`.
- Pencatatan trace juga mencakup ringkasan waktu diagnostik untuk jalur panas tertentu,
  seperti persiapan factory alat Plugin. Lihat
  [/tools/plugin#slow-plugin-tool-setup](/id/tools/plugin#slow-plugin-tool-setup).

## Penangkapan konsol

CLI menangkap `console.log/info/warn/error/debug/trace` dan menuliskannya ke log file,
sambil tetap mencetak ke stdout/stderr.

Anda dapat menyetel keterincian konsol secara independen melalui:

- `logging.consoleLevel` (default `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Redaksi

OpenClaw dapat menyamarkan token sensitif sebelum output log atau transkrip keluar dari
proses. Kebijakan redaksi pencatatan log ini diterapkan pada sink teks konsol, log file, catatan log OTLP,
dan transkrip sesi, sehingga nilai rahasia yang cocok
disamarkan sebelum baris JSONL atau pesan ditulis ke disk.

- `logging.redactSensitive`: `off` | `tools` (default: `tools`)
- `logging.redactPatterns`: array string regex (mengganti default)
  - Gunakan string regex mentah (otomatis `gi`), atau `/pattern/flags` jika Anda membutuhkan flag khusus.
  - Kecocokan disamarkan dengan mempertahankan 6 karakter pertama + 4 karakter terakhir (panjang >= 18), selain itu `***`.
  - Default mencakup penetapan kunci umum, flag CLI, field JSON, header bearer, blok PEM, prefiks token populer, dan nama field kredensial pembayaran seperti nomor kartu, CVC/CVV, token pembayaran bersama, dan kredensial pembayaran.

Beberapa batas keamanan selalu meredaksi terlepas dari `logging.redactSensitive`.
Ini mencakup event tool-call UI Kontrol, output alat `sessions_history`,
ekspor dukungan diagnostik, observasi error penyedia, tampilan perintah persetujuan exec,
dan log protokol WebSocket Gateway. Permukaan ini masih dapat menggunakan
`logging.redactPatterns` sebagai pola tambahan, tetapi `redactSensitive: "off"`
tidak membuatnya memancarkan rahasia mentah.

## Log WebSocket Gateway

Gateway mencetak log protokol WebSocket dalam dua mode:

- **Mode normal (tanpa `--verbose`)**: hanya hasil RPC yang "menarik" yang dicetak:
  - error (`ok=false`)
  - panggilan lambat (ambang default: `>= 50ms`)
  - error parse
- **Mode verbose (`--verbose`)**: mencetak semua lalu lintas permintaan/respons WS.

### Gaya log WS

`openclaw gateway` mendukung sakelar gaya per-Gateway:

- `--ws-log auto` (default): mode normal dioptimalkan; mode verbose menggunakan output ringkas
- `--ws-log compact`: output ringkas (permintaan/respons berpasangan) saat verbose
- `--ws-log full`: output penuh per-frame saat verbose
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

## Pemformatan konsol (pencatatan log subsistem)

Formatter konsol **sadar TTY** dan mencetak baris berprefiks yang konsisten.
Logger subsistem menjaga output tetap terkelompok dan mudah dipindai.

Perilaku:

- **Prefiks subsistem** pada setiap baris (mis. `[gateway]`, `[canvas]`, `[tailscale]`)
- **Warna subsistem** (stabil per subsistem) plus pewarnaan level
- **Warna ketika output adalah TTY atau lingkungan tampak seperti terminal kaya** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), menghormati `NO_COLOR`
- **Prefiks subsistem yang dipendekkan**: menghapus awalan `gateway/` + `channels/`, mempertahankan 2 segmen terakhir (mis. `whatsapp/outbound`)
- **Sub-logger berdasarkan subsistem** (prefiks otomatis + field terstruktur `{ subsystem }`)
- **`logRaw()`** untuk output QR/UX (tanpa prefiks, tanpa pemformatan)
- **Gaya konsol** (mis. `pretty | compact | json`)
- **Level log konsol** terpisah dari level log file (file mempertahankan detail penuh ketika `logging.level` diatur ke `debug`/`trace`)
- **Isi pesan WhatsApp** dicatat pada `debug` (gunakan `--verbose` untuk melihatnya)

Ini menjaga log file yang ada tetap stabil sekaligus membuat output interaktif mudah dipindai.

## Terkait

- [Pencatatan Log](/id/logging)
- [Ekspor OpenTelemetry](/id/gateway/opentelemetry)
- [Ekspor diagnostik](/id/gateway/diagnostics)
