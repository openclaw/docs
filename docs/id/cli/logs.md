---
read_when:
    - Anda perlu memantau log Gateway dari jarak jauh (tanpa SSH)
    - Anda memerlukan baris log JSON untuk perkakas
summary: Referensi CLI untuk `openclaw logs` (memantau log Gateway melalui RPC)
title: Log
x-i18n:
    generated_at: "2026-05-03T21:28:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89753a18e31cd643e19db80b6cef4ecac1aae0733e68d6c678e6419e28bd270e
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

Pantau log file Gateway melalui RPC (berfungsi dalam mode jarak jauh).

Terkait:

- Ikhtisar pencatatan log: [Pencatatan log](/id/logging)
- CLI Gateway: [gateway](/id/cli/gateway)

## Opsi

- `--limit <n>`: jumlah maksimum baris log yang akan dikembalikan (default `200`)
- `--max-bytes <n>`: jumlah maksimum byte yang akan dibaca dari file log (default `250000`)
- `--follow`: ikuti aliran log
- `--interval <ms>`: interval polling saat mengikuti (default `1000`)
- `--json`: keluarkan event JSON berbatas baris
- `--plain`: output teks biasa tanpa pemformatan bergaya
- `--no-color`: nonaktifkan warna ANSI
- `--local-time`: render timestamp dalam zona waktu lokal Anda

## Opsi RPC Gateway bersama

`openclaw logs` juga menerima flag klien Gateway standar:

- `--url <url>`: URL WebSocket Gateway
- `--token <token>`: token Gateway
- `--timeout <ms>`: timeout dalam ms (default `30000`)
- `--expect-final`: tunggu respons akhir saat panggilan Gateway didukung agen

Saat Anda meneruskan `--url`, CLI tidak otomatis menerapkan kredensial konfigurasi atau lingkungan. Sertakan `--token` secara eksplisit jika Gateway target memerlukan autentikasi.

## Contoh

```bash
openclaw logs
openclaw logs --follow
openclaw logs --follow --interval 2000
openclaw logs --limit 500 --max-bytes 500000
openclaw logs --json
openclaw logs --plain
openclaw logs --no-color
openclaw logs --limit 500
openclaw logs --local-time
openclaw logs --follow --local-time
openclaw logs --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

## Catatan

- Gunakan `--local-time` untuk merender timestamp dalam zona waktu lokal Anda.
- Jika Gateway local loopback implisit meminta pairing, menutup koneksi saat tersambung, atau mengalami timeout sebelum `logs.tail` menjawab, `openclaw logs` otomatis beralih ke log file Gateway yang dikonfigurasi. Target `--url` eksplisit tidak menggunakan fallback ini.
- Saat menggunakan `--follow`, pemutusan Gateway sementara (penutupan WebSocket, timeout, koneksi terputus) memicu koneksi ulang otomatis dengan exponential backoff (hingga 8 percobaan ulang, dibatasi 30 dtk di antara percobaan). Peringatan dicetak ke stderr pada setiap percobaan ulang, dan pemberitahuan `[logs] gateway reconnected` dicetak setelah polling berhasil. Dalam mode `--json`, peringatan percobaan ulang dan transisi koneksi ulang sama-sama dikeluarkan sebagai record `{"type":"notice"}` di stderr. Error yang tidak dapat dipulihkan (kegagalan autentikasi, konfigurasi buruk) tetap langsung keluar.

## Terkait

- [Referensi CLI](/id/cli)
- [Pencatatan log Gateway](/id/gateway/logging)
