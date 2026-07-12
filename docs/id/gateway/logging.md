---
read_when:
    - Mengubah keluaran atau format pencatatan log
    - Men-debug output CLI atau Gateway
summary: Permukaan logging, log file, gaya log WS, dan pemformatan konsol
title: Pencatatan log Gateway
x-i18n:
    generated_at: "2026-07-12T14:14:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6717be5eac3dfc1acf36b2f21b049d46c7fc3678945295b10ae69781d89d35ad
    source_path: gateway/logging.md
    workflow: 16
---

# Pencatatan Log

Untuk ringkasan yang ditujukan bagi pengguna (CLI + UI Kontrol + konfigurasi), lihat [/logging](/id/logging).

OpenClaw memiliki dua media log:

- **Keluaran konsol** - yang Anda lihat di terminal / UI Debug.
- **Log file** - baris JSON yang ditulis oleh pencatat log Gateway.

Saat dimulai, Gateway mencatat model agen bawaan yang telah ditetapkan beserta bawaan mode yang memengaruhi sesi baru:

```text
agent model: openai/gpt-5.6-sol (thinking=medium, fast=on)
```

`thinking` berasal dari agen bawaan, parameter model, atau bawaan agen global; jika tidak ditetapkan, nilainya ditampilkan sebagai `medium`. `fast` berasal dari agen bawaan atau parameter `fastMode` model.

## Pencatat log berbasis file

- File log bergulir bawaan berada di bawah `/tmp/openclaw/` (satu file per hari): `openclaw-YYYY-MM-DD.log`, dengan tanggal berdasarkan zona waktu lokal hos Gateway. Jika direktori tersebut tidak aman atau tidak dapat ditulisi (pemilik salah, dapat ditulisi semua pengguna, atau merupakan symlink), OpenClaw beralih ke jalur `os.tmpdir()/openclaw-<uid>` yang tercakup bagi pengguna; pada Windows, OpenClaw selalu menggunakan jalur cadangan direktori sementara OS tersebut.
- File log aktif dirotasi saat mencapai `logging.maxFileBytes` (bawaan: 100 MB), dengan mempertahankan hingga lima arsip bernomor (`.1` hingga `.5`) dan melanjutkan penulisan ke file aktif baru.
- Konfigurasikan jalur dan tingkat file log melalui `~/.openclaw/openclaw.json`: `logging.file`, `logging.level`.
- Format file berisi satu objek JSON per baris.

Jalur kode percakapan, suara waktu nyata, dan ruang terkelola menggunakan pencatat log file bersama untuk catatan siklus hidup terbatas yang ditujukan bagi penelusuran kesalahan operasional dan ekspor log OTLP. Teks transkrip, muatan audio, ID giliran, ID panggilan, dan ID item penyedia tidak pernah disalin ke dalam catatan log.

Tab Log di UI Kontrol mengikuti file ini melalui Gateway (`logs.tail`). CLI melakukan hal yang sama:

```bash
openclaw logs --follow
```

### Verbose dibandingkan dengan tingkat log

- **Log file** dikendalikan secara eksklusif oleh `logging.level`.
- `--verbose` hanya memengaruhi **tingkat detail konsol** (dan gaya log WS) - opsi ini **tidak** menaikkan tingkat log file.
- Untuk merekam detail yang hanya tersedia dalam mode verbose ke log file, tetapkan `logging.level` ke `debug` atau `trace`.
- Pencatatan log trace juga menyertakan ringkasan waktu diagnostik untuk jalur penting tertentu, seperti persiapan pabrik alat Plugin. Lihat [/tools/plugin#slow-plugin-tool-setup](/id/tools/plugin#slow-plugin-tool-setup).

## Perekaman konsol

CLI merekam `console.log/info/warn/error/debug/trace`, menuliskannya ke log file, dan tetap mencetaknya ke stdout/stderr.

Sesuaikan tingkat detail konsol secara terpisah:

- `logging.consoleLevel` (bawaan `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`; bawaannya `pretty` pada TTY, dan `compact` jika bukan)

## Redaksi

OpenClaw menyamarkan token sensitif sebelum keluaran log atau transkrip meninggalkan proses. Kebijakan redaksi ini berlaku pada konsol, log file, catatan log OTLP, dan tujuan teks transkrip sesi, sehingga nilai rahasia yang cocok disamarkan sebelum baris JSONL atau pesan ditulis ke disk.

- `logging.redactSensitive`: `off` | `tools` (bawaan: `tools`)
- `logging.redactPatterns`: larik string regex (menggantikan bawaan)
  - Gunakan string regex mentah (`gi` otomatis), atau `/pattern/flags` untuk flag khusus.
  - Kecocokan disamarkan dengan mempertahankan 6 karakter pertama + 4 karakter terakhir (untuk nilai >= 18 karakter); nilai yang lebih pendek menjadi `***`.
  - Bawaan mencakup penetapan kunci umum, flag CLI, kolom JSON, header bearer, blok PEM, prefiks token vendor populer, serta nama kolom kredensial pembayaran (nomor kartu, CVC/CVV, token pembayaran bersama, kredensial pembayaran).

Beberapa batas keamanan selalu melakukan redaksi terlepas dari `logging.redactSensitive`: peristiwa pemanggilan alat UI Kontrol, keluaran alat `sessions_history`, ekspor dukungan diagnostik, pengamatan kesalahan penyedia, tampilan perintah persetujuan exec, dan log protokol WebSocket Gateway. Media ini tetap menerapkan `logging.redactPatterns` sebagai pola tambahan, tetapi `redactSensitive: "off"` tidak membuatnya mengeluarkan rahasia mentah.

## Log WebSocket Gateway

Gateway mencetak log protokol WebSocket dalam dua mode:

- **Mode normal (tanpa `--verbose`)**: hanya hasil RPC yang "menarik" yang dicetak - kesalahan (`ok=false`), panggilan lambat (ambang bawaan: `>= 50ms`), dan kesalahan penguraian.
- **Mode verbose (`--verbose`)**: mencetak semua lalu lintas permintaan/respons WS.

### Gaya log WS

`openclaw gateway` mendukung pengalihan gaya per Gateway:

- `--ws-log auto` (bawaan): mode normal dioptimalkan; mode verbose menggunakan keluaran ringkas.
- `--ws-log compact`: keluaran ringkas (permintaan/respons berpasangan) saat verbose.
- `--ws-log full`: keluaran lengkap per bingkai saat verbose.
- `--compact`: alias untuk `--ws-log compact`.

```bash
# dioptimalkan (hanya kesalahan/lambat)
openclaw gateway

# tampilkan semua lalu lintas WS (berpasangan)
openclaw gateway --verbose --ws-log compact

# tampilkan semua lalu lintas WS (metadata lengkap)
openclaw gateway --verbose --ws-log full
```

## Pemformatan konsol (pencatatan log subsistem)

Pemformat konsol **mengenali TTY** dan mencetak baris konsisten dengan prefiks. Pencatat log subsistem menjaga keluaran tetap terkelompok dan mudah dipindai:

- **Prefiks subsistem** pada setiap baris (misalnya `[gateway]`, `[canvas]`, `[tailscale]`).
- **Warna subsistem** (stabil per subsistem, di-hash dari namanya) beserta pewarnaan tingkat.
- **Warna saat keluaran merupakan TTY** atau lingkungan tampak seperti terminal kaya fitur (`TERM`/`COLORTERM`/`TERM_PROGRAM`); mematuhi `NO_COLOR` dan `FORCE_COLOR`.
- **Prefiks subsistem yang dipersingkat**: menghapus segmen awal `gateway/`, `channels/`, atau `providers/`, lalu mempertahankan paling banyak 2 segmen terakhir yang tersisa (misalnya `channels/turn/kernel` ditampilkan sebagai `turn/kernel`). Subsistem saluran yang dikenal (`telegram`, `whatsapp`, `slack`, dan sebagainya) selalu diringkas menjadi nama saluran saja.
- **Pencatat log turunan berdasarkan subsistem** (prefiks otomatis + kolom terstruktur `{ subsystem }`).
- **`logRaw()`** untuk keluaran QR/UX (tanpa prefiks, tanpa pemformatan).
- **Gaya konsol**: `pretty` | `compact` | `json`.
- **Tingkat log konsol** terpisah dari tingkat log file (file mempertahankan detail lengkap ketika `logging.level` bernilai `debug`/`trace`).
- **Isi pesan WhatsApp** dicatat pada tingkat `debug` (gunakan `--verbose` untuk melihatnya).

Hal ini menjaga kestabilan log file sekaligus membuat keluaran interaktif mudah dipindai.

## Terkait

- [Pencatatan Log](/id/logging)
- [Ekspor OpenTelemetry](/id/gateway/opentelemetry)
- [Ekspor diagnostik](/id/gateway/diagnostics)
