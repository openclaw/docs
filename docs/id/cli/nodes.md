---
read_when:
    - Anda mengelola Node berpasangan (kamera, layar, kanvas)
    - Anda perlu menyetujui permintaan atau menjalankan perintah node
summary: Referensi CLI untuk `openclaw nodes` (status, penyandingan, pemanggilan, kamera/kanvas/layar)
title: Node
x-i18n:
    generated_at: "2026-05-06T17:54:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: f3eb0d23037c939e4022115a2d65e0e9cb25a872daed715b8652979ce6707cf7
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

Kelola node (perangkat) yang dipasangkan dan jalankan kapabilitas node.

Terkait:

- Ikhtisar node: [Node](/id/nodes)
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

`nodes list` mencetak tabel tertunda/terpasang. Baris yang terpasang menyertakan usia koneksi terbaru (Last Connect).
Gunakan `--connected` untuk hanya menampilkan node yang saat ini terhubung. Gunakan `--last-connected <duration>` untuk
memfilter node yang terhubung dalam suatu durasi (misalnya `24h`, `7d`).
Gunakan `nodes remove --node <id|name|ip>` untuk menghapus catatan pemasangan node milik gateway yang sudah usang.

Catatan persetujuan:

- `openclaw nodes pending` hanya memerlukan cakupan pemasangan.
- `gateway.nodes.pairing.autoApproveCidrs` dapat melewati langkah tertunda hanya untuk
  pemasangan perangkat `role: node` pertama kali yang secara eksplisit tepercaya. Fitur ini nonaktif secara
  default dan tidak menyetujui pemutakhiran.
- `openclaw nodes approve <requestId>` mewarisi persyaratan cakupan tambahan dari
  permintaan tertunda:
  - permintaan tanpa perintah: hanya pemasangan
  - perintah node non-exec: pemasangan + tulis
  - `system.run` / `system.run.prepare` / `system.which`: pemasangan + admin

## Panggil

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

Flag pemanggilan:

- `--params <json>`: string objek JSON (default `{}`).
- `--invoke-timeout <ms>`: batas waktu pemanggilan node (default `15000`).
- `--idempotency-key <key>`: kunci idempotensi opsional.
- `system.run` dan `system.run.prepare` diblokir di sini; gunakan tool `exec` dengan `host=node` untuk eksekusi shell.

Untuk eksekusi shell pada node, gunakan tool `exec` dengan `host=node`, bukan `openclaw nodes run`.
CLI `nodes` sekarang berfokus pada kapabilitas: RPC langsung melalui `nodes invoke`, ditambah pemasangan, kamera,
layar, lokasi, kanvas, dan notifikasi.

## Terkait

- [Referensi CLI](/id/cli)
- [Node](/id/nodes)
