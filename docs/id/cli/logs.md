---
read_when:
    - Anda perlu memantau log Gateway dari jarak jauh (tanpa SSH)
    - Anda menginginkan baris log JSON untuk alat bantu
summary: Referensi CLI untuk `openclaw logs` (menampilkan log Gateway secara berkelanjutan melalui RPC)
title: Log
x-i18n:
    generated_at: "2026-04-30T09:40:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0f9268fefa4d0e54297fd12c5cef30a1465bd735ae6a36292c279a438285f2b8
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

Tail log file Gateway melalui RPC (berfungsi dalam mode jarak jauh).

Terkait:

- Ikhtisar logging: [Logging](/id/logging)
- CLI Gateway: [gateway](/id/cli/gateway)

## Opsi

- `--limit <n>`: jumlah maksimum baris log yang dikembalikan (default `200`)
- `--max-bytes <n>`: byte maksimum yang dibaca dari file log (default `250000`)
- `--follow`: ikuti stream log
- `--interval <ms>`: interval polling saat mengikuti (default `1000`)
- `--json`: hasilkan event JSON berbatas baris
- `--plain`: output teks biasa tanpa pemformatan bergaya
- `--no-color`: nonaktifkan warna ANSI
- `--local-time`: tampilkan timestamp dalam zona waktu lokal Anda

## Opsi RPC Gateway bersama

`openclaw logs` juga menerima flag klien Gateway standar:

- `--url <url>`: URL WebSocket Gateway
- `--token <token>`: token Gateway
- `--timeout <ms>`: timeout dalam ms (default `30000`)
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
openclaw logs --follow --local-time
openclaw logs --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

## Catatan

- Gunakan `--local-time` untuk menampilkan timestamp dalam zona waktu lokal Anda.
- Jika Gateway local loopback implisit meminta pairing, tertutup saat tersambung, atau timeout sebelum `logs.tail` menjawab, `openclaw logs` otomatis beralih ke log file Gateway yang dikonfigurasi. Target `--url` eksplisit tidak menggunakan fallback ini.

## Terkait

- [Referensi CLI](/id/cli)
- [Logging Gateway](/id/gateway/logging)
