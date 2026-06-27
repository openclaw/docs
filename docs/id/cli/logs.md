---
read_when:
    - Anda perlu memantau log Gateway dari jarak jauh (tanpa SSH)
    - Anda menginginkan baris log JSON untuk tooling
summary: Referensi CLI untuk `openclaw logs` (mengikuti log Gateway melalui RPC)
title: Log
x-i18n:
    generated_at: "2026-06-27T17:19:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3835880c0919d4c0c67bd3b371f9f8b0f396b80a9456c545ea0caa064a6361c0
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

Ikuti bagian akhir log file Gateway melalui RPC (berfungsi dalam mode jarak jauh).

Terkait:

- Ikhtisar logging: [Logging](/id/logging)
- CLI Gateway: [gateway](/id/cli/gateway)

## Opsi

- `--limit <n>`: jumlah maksimum baris log yang akan dikembalikan (default `200`)
- `--max-bytes <n>`: jumlah maksimum byte yang akan dibaca dari file log (default `250000`)
- `--follow`: ikuti aliran log
- `--interval <ms>`: interval polling saat mengikuti (default `1000`)
- `--json`: hasilkan event JSON berbatas baris
- `--plain`: keluaran teks biasa tanpa pemformatan bergaya
- `--no-color`: nonaktifkan warna ANSI
- `--local-time`: render timestamp dalam zona waktu lokal Anda (default)
- `--utc`: render timestamp dalam UTC

## Opsi RPC Gateway bersama

`openclaw logs` juga menerima flag klien Gateway standar:

- `--url <url>`: URL WebSocket Gateway
- `--token <token>`: token Gateway
- `--timeout <ms>`: timeout dalam ms (default `30000`)
- `--expect-final`: tunggu respons final ketika panggilan Gateway didukung agen

Saat Anda meneruskan `--url`, CLI tidak otomatis menerapkan kredensial konfigurasi atau lingkungan. Sertakan `--token` secara eksplisit jika Gateway target memerlukan auth.

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
openclaw logs --utc
openclaw logs --follow --local-time
openclaw logs --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

## Catatan

- Timestamp dirender dalam zona waktu lokal Anda secara default. Gunakan `--utc` untuk keluaran UTC.
- Jika Gateway local loopback implisit meminta pairing, tertutup saat connect, atau timeout sebelum `logs.tail` menjawab, `openclaw logs` otomatis fallback ke log file Gateway yang dikonfigurasi. Target `--url` eksplisit tidak menggunakan fallback ini.
- `openclaw logs --follow` tidak mengikuti fallback file yang dikonfigurasi setelah kegagalan RPC Gateway lokal implisit. Di Linux, perintah ini menggunakan jurnal Gateway user-systemd aktif berdasarkan PID bila tersedia dan mencetak sumber log yang dipilih; jika tidak, perintah ini terus mencoba ulang Gateway live alih-alih mengikuti bagian akhir file berdampingan yang berpotensi usang.
- Saat menggunakan `--follow`, pemutusan gateway sementara (penutupan WebSocket, timeout, koneksi terputus) memicu reconnect otomatis dengan backoff eksponensial (hingga 8 percobaan ulang, dibatasi 30 dtk antarpercobaan). Peringatan dicetak ke stderr pada setiap percobaan ulang, dan pemberitahuan `[logs] gateway reconnected` dicetak setelah polling berhasil. Dalam mode `--json`, baik peringatan percobaan ulang maupun transisi reconnect dipancarkan sebagai record `{"type":"notice"}` di stderr. Error yang tidak dapat dipulihkan (kegagalan auth, konfigurasi buruk) tetap keluar segera.

## Terkait

- [Referensi CLI](/id/cli)
- [Logging Gateway](/id/gateway/logging)
