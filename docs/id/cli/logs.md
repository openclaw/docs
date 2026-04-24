---
read_when:
    - Anda perlu melakukan tail log Gateway dari jarak jauh (tanpa SSH)
    - Anda menginginkan baris log JSON untuk toolինգ
summary: Referensi CLI untuk `openclaw logs` (tail log gateway melalui RPC)
title: Log
x-i18n:
    generated_at: "2026-04-24T09:01:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 94dddb9fd507c2f1d885c5cf92b78fd381355481317bf6f56b794afbd387f402
    source_path: cli/logs.md
    workflow: 15
---

# `openclaw logs`

Tail log file Gateway melalui RPC (berfungsi dalam mode remote).

Terkait:

- Ikhtisar logging: [Logging](/id/logging)
- CLI Gateway: [gateway](/id/cli/gateway)

## Opsi

- `--limit <n>`: jumlah maksimum baris log yang dikembalikan (default `200`)
- `--max-bytes <n>`: jumlah byte maksimum yang dibaca dari file log (default `250000`)
- `--follow`: ikuti stream log
- `--interval <ms>`: interval polling saat mengikuti (default `1000`)
- `--json`: keluarkan peristiwa JSON yang dipisahkan per baris
- `--plain`: output teks biasa tanpa pemformatan bergaya
- `--no-color`: nonaktifkan warna ANSI
- `--local-time`: render stempel waktu dalam zona waktu lokal Anda

## Opsi RPC Gateway bersama

`openclaw logs` juga menerima flag klien Gateway standar:

- `--url <url>`: URL WebSocket Gateway
- `--token <token>`: token Gateway
- `--timeout <ms>`: timeout dalam ms (default `30000`)
- `--expect-final`: tunggu respons final saat panggilan Gateway didukung agen

Saat Anda memberikan `--url`, CLI tidak otomatis menerapkan kredensial config atau environment. Sertakan `--token` secara eksplisit jika Gateway target memerlukan auth.

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

- Gunakan `--local-time` untuk merender stempel waktu dalam zona waktu lokal Anda.
- Jika Gateway local loopback meminta pairing, `openclaw logs` secara otomatis kembali ke file log lokal yang dikonfigurasi. Target `--url` eksplisit tidak menggunakan fallback ini.

## Terkait

- [Referensi CLI](/id/cli)
- [Logging Gateway](/id/gateway/logging)
