---
read_when:
    - Anda sedang mengelola Node yang dipasangkan (kamera, layar, kanvas)
    - Anda perlu menyetujui permintaan atau menjalankan perintah node
summary: Referensi CLI untuk `openclaw nodes` (status, penyandingan, pemanggilan, kamera/kanvas/layar)
title: Node
x-i18n:
    generated_at: "2026-04-30T09:40:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3229db91d7e64b0d37bee29bd51895d90796f5fd33b67e3d900fd8bda2b6e7e9
    source_path: cli/nodes.md
    workflow: 16
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
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name <displayName>
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
```

`nodes list` mencetak tabel tertunda/terpasang. Baris yang terpasang menyertakan usia koneksi terbaru (Koneksi Terakhir).
Gunakan `--connected` untuk hanya menampilkan Node yang saat ini terhubung. Gunakan `--last-connected <duration>` untuk
memfilter ke Node yang terhubung dalam suatu durasi (misalnya `24h`, `7d`).
Gunakan `nodes remove --node <id|name|ip>` untuk menghapus catatan pemasangan Node usang milik Gateway.

Catatan persetujuan:

- `openclaw nodes pending` hanya memerlukan cakupan pemasangan.
- `gateway.nodes.pairing.autoApproveCidrs` dapat melewati langkah tertunda hanya untuk
  pemasangan perangkat `role: node` pertama kali yang secara eksplisit dipercaya. Ini nonaktif secara
  default dan tidak menyetujui peningkatan.
- `openclaw nodes approve <requestId>` mewarisi persyaratan cakupan tambahan dari
  permintaan tertunda:
  - permintaan tanpa perintah: hanya pemasangan
  - perintah Node non-exec: pemasangan + tulis
  - `system.run` / `system.run.prepare` / `system.which`: pemasangan + admin

## Jalankan

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

Flag eksekusi:

- `--params <json>`: string objek JSON (default `{}`).
- `--invoke-timeout <ms>`: batas waktu eksekusi Node (default `15000`).
- `--idempotency-key <key>`: kunci idempotensi opsional.
- `system.run` dan `system.run.prepare` diblokir di sini; gunakan alat `exec` dengan `host=node` untuk eksekusi shell.

Untuk eksekusi shell pada Node, gunakan alat `exec` dengan `host=node`, bukan `openclaw nodes run`.
CLI `nodes` kini berfokus pada kapabilitas: RPC langsung melalui `nodes invoke`, ditambah pemasangan, kamera,
layar, lokasi, canvas, dan notifikasi.

## Terkait

- [Referensi CLI](/id/cli)
- [Node](/id/nodes)
