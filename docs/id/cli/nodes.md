---
read_when:
    - Anda sedang mengelola node berpasangan (kamera, layar, canvas)
    - Anda perlu menyetujui permintaan atau memanggil perintah node
summary: Referensi CLI untuk `openclaw nodes` (status, pairing, invoke, kamera/canvas/layar)
title: nodes
x-i18n:
    generated_at: "2026-04-05T13:49:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1ce3095591c4623ad18e3eca8d8083e5c10266fbf94afea2d025f0ba8093a175
    source_path: cli/nodes.md
    workflow: 15
---

# `openclaw nodes`

Kelola node (perangkat) yang berpasangan dan panggil kapabilitas node.

Terkait:

- Gambaran umum node: [Nodes](/nodes)
- Kamera: [Camera nodes](/nodes/camera)
- Gambar: [Image nodes](/nodes/images)

Opsi umum:

- `--url`, `--token`, `--timeout`, `--json`

## Perintah umum

```bash
openclaw nodes list
openclaw nodes list --connected
openclaw nodes list --last-connected 24h
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes rename --node <id|name|ip> --name <displayName>
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
```

`nodes list` mencetak tabel tertunda/berpasangan. Baris berpasangan menyertakan usia koneksi terbaru (Last Connect).
Gunakan `--connected` untuk hanya menampilkan node yang sedang terhubung. Gunakan `--last-connected <duration>` untuk
memfilter node yang terhubung dalam suatu durasi (misalnya `24h`, `7d`).

Catatan persetujuan:

- `openclaw nodes pending` hanya memerlukan cakupan pairing.
- `openclaw nodes approve <requestId>` mewarisi persyaratan cakupan tambahan dari
  permintaan tertunda:
  - permintaan tanpa perintah: hanya pairing
  - perintah node non-exec: pairing + write
  - `system.run` / `system.run.prepare` / `system.which`: pairing + admin

## Invoke

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

Flag invoke:

- `--params <json>`: string objek JSON (default `{}`).
- `--invoke-timeout <ms>`: batas waktu invoke node (default `15000`).
- `--idempotency-key <key>`: kunci idempotensi opsional.
- `system.run` dan `system.run.prepare` diblokir di sini; gunakan tool `exec` dengan `host=node` untuk eksekusi shell.

Untuk eksekusi shell pada node, gunakan tool `exec` dengan `host=node` alih-alih `openclaw nodes run`.
CLI `nodes` sekarang berfokus pada kapabilitas: RPC langsung melalui `nodes invoke`, ditambah pairing, kamera,
layar, lokasi, canvas, dan notifikasi.
