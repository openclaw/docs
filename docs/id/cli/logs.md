---
read_when:
    - Anda perlu memantau log Gateway secara jarak jauh (tanpa SSH)
    - Anda menginginkan baris log JSON untuk alat
summary: Referensi CLI untuk `openclaw logs` (mengikuti log gateway melalui RPC)
title: Log
x-i18n:
    generated_at: "2026-07-01T15:31:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c2cc14132d46b60fd323b40dad3c524b6eef40b940bb98d4b445d03782e0ea07
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

Ikuti log file Gateway melalui RPC (berfungsi dalam mode jarak jauh).

Terkait:

- Ikhtisar pencatatan: [Pencatatan](/id/logging)
- CLI Gateway: [gateway](/id/cli/gateway)

## Opsi

- `--limit <n>`: jumlah maksimum baris log yang akan dikembalikan (default `200`)
- `--max-bytes <n>`: byte maksimum yang akan dibaca dari file log (default `250000`)
- `--follow`: ikuti aliran log
- `--interval <ms>`: interval polling saat mengikuti (default `1000`)
- `--json`: hasilkan peristiwa JSON berbatas baris
- `--plain`: keluaran teks biasa tanpa pemformatan bergaya
- `--no-color`: nonaktifkan warna ANSI
- `--local-time`: render stempel waktu dalam zona waktu lokal Anda (default)
- `--utc`: render stempel waktu dalam UTC

## Opsi RPC Gateway Bersama

`openclaw logs` juga menerima flag klien Gateway standar:

- `--url <url>`: URL WebSocket Gateway
- `--token <token>`: token Gateway
- `--timeout <ms>`: batas waktu dalam ms (default `30000`)
- `--expect-final`: tunggu respons final saat panggilan Gateway didukung agen

Saat Anda meneruskan `--url`, CLI tidak menerapkan kredensial konfigurasi atau lingkungan secara otomatis. Sertakan `--token` secara eksplisit jika Gateway target memerlukan autentikasi.

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

- Stempel waktu dirender dalam zona waktu lokal Anda secara default. Gunakan `--utc` untuk keluaran UTC.
- Jika Gateway local loopback implisit meminta pairing, tertutup saat tersambung, atau kehabisan waktu sebelum `logs.tail` menjawab, `openclaw logs` secara otomatis beralih ke log file Gateway yang dikonfigurasi. Target `--url` eksplisit tidak menggunakan fallback ini.
- `openclaw logs --follow` tidak mengikuti fallback file yang dikonfigurasi setelah kegagalan RPC Gateway lokal implisit. Di Linux, ini menggunakan jurnal Gateway user-systemd aktif berdasarkan PID jika tersedia dan mencetak sumber log yang dipilih; jika tidak, ini terus mencoba ulang Gateway langsung alih-alih mengikuti file berdampingan yang berpotensi kedaluwarsa.
- Saat menggunakan `--follow`, pemutusan gateway sementara (penutupan WebSocket, batas waktu, koneksi terputus) memicu penyambungan ulang otomatis dengan backoff eksponensial (hingga 8 percobaan ulang, dibatasi 30 dtk antarpercobaan). Peringatan dicetak ke stderr pada setiap percobaan ulang, dan pemberitahuan `[logs] gateway reconnected` dicetak setelah polling berhasil. Dalam mode `--json`, baik peringatan percobaan ulang maupun transisi penyambungan ulang dipancarkan sebagai record `{"type":"notice"}` pada stderr. Kesalahan yang tidak dapat dipulihkan (kegagalan autentikasi, konfigurasi buruk) tetap keluar segera.
- Dalam mode `--follow --json`, transisi sumber log dipancarkan sebagai record `{"type":"meta"}`. Konsumen harus melacak kursor per `sourceKind`: sebuah aliran dapat berpindah dari keluaran file Gateway (`sourceKind: "file"`) ke fallback jurnal lokal (`sourceKind: "journal"`, `localFallback: true`, dengan `service.pid`/`service.unit`) dan kembali ke keluaran file Gateway setelah pemulihan. Jangan mengasumsikan satu sumber atau kursor stabil untuk seluruh sesi follow, dan toleransi baris yang tumpang tindih saat pemulihan memutar ulang kursor file Gateway.

## Terkait

- [Referensi CLI](/id/cli)
- [Pencatatan Gateway](/id/gateway/logging)
