---
read_when:
    - Anda sedang mengelola Node yang dipasangkan (kamera, layar, canvas)
    - Anda perlu menyetujui permintaan atau menjalankan perintah Node
summary: Referensi CLI untuk `openclaw nodes` (status, pairing, invoke, kamera/canvas/layar)
title: Node
x-i18n:
    generated_at: "2026-04-24T09:02:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: a1f1b440b3113b71338ae9cab5e1ded607dba79b9429f5c0b1b5f9e758b9f73e
    source_path: cli/nodes.md
    workflow: 15
---

# `openclaw nodes`

Kelola Node (perangkat) yang dipasangkan dan jalankan kapabilitas Node.

Terkait:

- Ikhtisar Node: [Node](/id/nodes)
- Kamera: [Node kamera](/id/nodes/camera)
- Gambar: [Node gambar](/id/nodes/images)

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

`nodes list` mencetak tabel pending/paired. Baris paired menyertakan usia koneksi terbaru (Last Connect).
Gunakan `--connected` untuk hanya menampilkan Node yang sedang terhubung. Gunakan `--last-connected <duration>` untuk
memfilter Node yang terhubung dalam suatu durasi (misalnya `24h`, `7d`).

Catatan persetujuan:

- `openclaw nodes pending` hanya memerlukan cakupan pairing.
- `openclaw nodes approve <requestId>` mewarisi persyaratan cakupan tambahan dari
  permintaan pending:
  - permintaan tanpa perintah: hanya pairing
  - perintah Node non-exec: pairing + write
  - `system.run` / `system.run.prepare` / `system.which`: pairing + admin

## Invoke

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

Flag invoke:

- `--params <json>`: string objek JSON (default `{}`).
- `--invoke-timeout <ms>`: batas waktu invoke Node (default `15000`).
- `--idempotency-key <key>`: kunci idempotensi opsional.
- `system.run` dan `system.run.prepare` diblokir di sini; gunakan alat `exec` dengan `host=node` untuk eksekusi shell.

Untuk eksekusi shell di Node, gunakan alat `exec` dengan `host=node`, bukan `openclaw nodes run`.
CLI `nodes` sekarang berfokus pada kapabilitas: RPC langsung melalui `nodes invoke`, ditambah pairing, kamera,
layar, lokasi, canvas, dan notifikasi.

## Terkait

- [Referensi CLI](/id/cli)
- [Node](/id/nodes)
