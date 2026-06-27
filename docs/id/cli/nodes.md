---
read_when:
    - Anda mengelola node berpasangan (kamera, layar, kanvas)
    - Anda perlu menyetujui permintaan atau memanggil perintah Node
summary: Referensi CLI untuk `openclaw nodes` (status, pemasangan, pemanggilan, kamera/kanvas/layar)
title: Node
x-i18n:
    generated_at: "2026-06-27T17:20:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e752e4a5809e01ee7970204c84d9f1008f146d8a55954f6ed5de527a6a124bc7
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

Kelola node (perangkat) yang dipasangkan dan panggil kapabilitas node.

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

`nodes list` mencetak tabel tertunda/dipasangkan. Baris yang dipasangkan menyertakan usia koneksi terbaru (Koneksi Terakhir).
Gunakan `--connected` untuk hanya menampilkan node yang saat ini terhubung. Gunakan `--last-connected <duration>` untuk
memfilter ke node yang terhubung dalam suatu durasi (mis. `24h`, `7d`).
Gunakan `nodes remove --node <id|name|ip>` untuk menghapus pemasangan node. Untuk
node yang didukung perangkat, ini mencabut peran `node` milik perangkat di `devices/paired.json`
dan memutus sesi peran-node miliknya (perangkat dengan peran campuran mempertahankan barisnya dan
hanya kehilangan peran `node`; perangkat khusus node dihapus); ini juga membersihkan setiap
catatan pemasangan node lama milik Gateway yang cocok. `operator.pairing` dapat menghapus
baris node non-operator; pemanggil token-perangkat yang mencabut peran node miliknya sendiri pada
perangkat dengan peran campuran juga memerlukan `operator.admin`.

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
- `--invoke-timeout <ms>`: timeout pemanggilan node (default `15000`).
- `--idempotency-key <key>`: kunci idempotensi opsional.
- `system.run` dan `system.run.prepare` diblokir di sini; gunakan alat `exec` dengan `host=node` untuk eksekusi shell.

Untuk eksekusi shell pada node, gunakan alat `exec` dengan `host=node`, bukan `openclaw nodes run`.
CLI `nodes` kini berfokus pada kapabilitas: RPC langsung melalui `nodes invoke`, plus pemasangan, kamera,
layar, lokasi, Canvas, dan notifikasi. Perintah Canvas diimplementasikan oleh Plugin Canvas eksperimental bawaan; core mempertahankan hook kompatibilitas agar perintah tersebut tetap berada di bawah `openclaw nodes canvas`.

## Terkait

- [Referensi CLI](/id/cli)
- [Node](/id/nodes)
