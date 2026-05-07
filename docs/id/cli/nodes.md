---
read_when:
    - Anda sedang mengelola Node berpasangan (kamera, layar, kanvas)
    - Anda perlu menyetujui permintaan atau menjalankan perintah node
summary: Referensi CLI untuk `openclaw nodes` (status, pairing, invoke, camera/canvas/screen)
title: Node
x-i18n:
    generated_at: "2026-05-07T13:14:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 681c199462d5f58c3e4346713263a78e7513335f087c713877e3050e21c8e15f
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

Kelola node (perangkat) yang dipasangkan dan panggil kapabilitas node.

Terkait:

- Gambaran umum node: [Node](/id/nodes)
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
Gunakan `--connected` untuk hanya menampilkan node yang saat ini terhubung. Gunakan `--last-connected <duration>` untuk
memfilter node yang terhubung dalam suatu durasi (mis. `24h`, `7d`).
Gunakan `nodes remove --node <id|name|ip>` untuk menghapus catatan pemasangan node lama milik gateway.

Catatan persetujuan:

- `openclaw nodes pending` hanya memerlukan cakupan pemasangan.
- `gateway.nodes.pairing.autoApproveCidrs` dapat melewati langkah tertunda hanya untuk
  pemasangan perangkat `role: node` pertama kali yang dipercaya secara eksplisit. Ini nonaktif secara
  default dan tidak menyetujui peningkatan.
- `openclaw nodes approve <requestId>` mewarisi persyaratan cakupan tambahan dari
  permintaan tertunda:
  - permintaan tanpa perintah: hanya pemasangan
  - perintah node non-eksekusi: pemasangan + tulis
  - `system.run` / `system.run.prepare` / `system.which`: pemasangan + admin

## Panggil

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

Flag pemanggilan:

- `--params <json>`: string objek JSON (default `{}`).
- `--invoke-timeout <ms>`: batas waktu pemanggilan node (default `15000`).
- `--idempotency-key <key>`: kunci idempotensi opsional.
- `system.run` dan `system.run.prepare` diblokir di sini; gunakan alat `exec` dengan `host=node` untuk eksekusi shell.

Untuk eksekusi shell pada node, gunakan alat `exec` dengan `host=node`, bukan `openclaw nodes run`.
CLI `nodes` sekarang berfokus pada kapabilitas: RPC langsung melalui `nodes invoke`, ditambah pemasangan, kamera,
layar, lokasi, Canvas, dan notifikasi. Perintah Canvas diimplementasikan oleh plugin Canvas eksperimental yang dibundel; inti mempertahankan hook kompatibilitas agar perintah tersebut tetap berada di bawah `openclaw nodes canvas`.

## Terkait

- [Referensi CLI](/id/cli)
- [Node](/id/nodes)
