---
read_when:
    - Anda mengelola Node yang dipasangkan (kamera, layar, kanvas)
    - Anda perlu menyetujui permintaan atau menjalankan perintah node
summary: Referensi CLI untuk `openclaw nodes` (status, pemasangan, pemanggilan, kamera/kanvas/layar/lokasi/notifikasi)
title: Node
x-i18n:
    generated_at: "2026-07-16T17:55:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5b57235006d803fe09f626a65157dfb1f620d3d3c6f337e33132bcffdf4f1e37
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

Kelola node (perangkat) yang dipasangkan dan panggil kemampuan node.

Terkait: [Ikhtisar node](/id/nodes) - [Kehadiran komputer aktif](/nodes/presence) - [Node kamera](/id/nodes/camera) - [Node gambar](/id/nodes/images)

Opsi umum pada setiap subperintah: `--url <url>`, `--token <token>`, `--timeout <ms>` (bawaan `10000`), `--json`.

## Status

```bash
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
openclaw nodes list
openclaw nodes describe --node <idOrNameOrIp>
```

`status` dan `list` sama-sama menerima `--connected` (hanya node yang terhubung) dan `--last-connected <duration>` (misalnya `24h`, `7d`; hanya node yang terhubung dalam durasi tersebut). `list` menampilkan node yang tertunda dan dipasangkan dalam tabel terpisah, dengan baris yang dipasangkan menyertakan usia koneksi terbaru (Last Connect); `status` menampilkan satu tabel gabungan dengan detail kemampuan, versi, dan input terakhir per node. Node macOS yang terhubung melaporkan input terakhir hanya selama izin Accessibility diberikan, dan baris terbaru ditandai `active`; lihat [Kehadiran komputer aktif](/nodes/presence). `describe` menampilkan kemampuan, izin, aktivitas, serta perintah pemanggilan efektif/tertunda dari satu node.

## Pemasangan

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name <displayName>
```

Perintah ini mengelola penyimpanan `node.pair.*` milik Gateway, yang terpisah dari pemasangan perangkat (`openclaw devices approve`) yang mengendalikan handshake `connect` WS node. Lihat [Node](/id/nodes) untuk mengetahui hubungan keduanya.

- `remove` mencabut entri peran berpasangan milik node. Untuk node berbasis perangkat, tindakan ini mencabut peran `node` dalam penyimpanan pemasangan perangkat dan memutus sesi peran node-nya: perangkat dengan peran campuran mempertahankan barisnya dan hanya kehilangan peran `node`, sedangkan baris perangkat khusus node dihapus. Tindakan ini juga menghapus setiap catatan pemasangan node lama milik Gateway yang cocok.
- `pending` hanya memerlukan cakupan `operator.pairing`.
- `gateway.nodes.pairing.autoApproveCidrs` dapat melewati langkah tertunda untuk pemasangan perangkat `role: node` pertama kali yang dipercaya secara eksplisit. Dinonaktifkan secara bawaan; tidak menyetujui peningkatan peran.
- `gateway.nodes.pairing.sshVerify` (diaktifkan secara bawaan) secara otomatis menyetujui pemasangan perangkat `role: node` pertama kali ketika Gateway dapat memverifikasi kunci perangkat melalui SSH ke host node; permukaan kemampuan pertama disetujui dalam langkah yang sama. Lihat [Pemasangan node](/id/gateway/pairing#ssh-verified-device-auto-approval-default).
- Persyaratan cakupan `approve` mengikuti perintah yang dideklarasikan oleh permintaan tertunda:
  - permintaan tanpa perintah: `operator.pairing`
  - perintah node biasa: `operator.pairing` + `operator.write`
  - perintah sensitif bagi admin (`system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `fs.listDir`, dan `system.execApprovals.get/set`): `operator.pairing` + `operator.admin`
- Cakupan `remove`: `operator.pairing` dapat menghapus baris node nonoperator; pemanggil dengan token perangkat yang mencabut peran node-nya sendiri pada perangkat dengan peran campuran juga memerlukan `operator.admin`.

## Pemanggilan

```bash
openclaw nodes invoke --node <id> --command system.which --params '{"bins":["uname"]}'
```

Flag:

- `--command <command>` (wajib): misalnya `canvas.eval`.
- `--params <json>`: string objek JSON (bawaan `{}`).
- `--invoke-timeout <ms>`: batas waktu pemanggilan node (bawaan `15000`).
- `--idempotency-key <key>`: kunci idempotensi opsional.

`system.run` dan `system.run.prepare` diblokir di sini; sebagai gantinya, gunakan alat `exec` dengan `host=node` untuk eksekusi shell. `system.which` diizinkan melalui `invoke`.

## Notifikasi, push, lokasi, layar

```bash
openclaw nodes notify --node <id> --title "Build" --body "Done" --priority timeSensitive
openclaw nodes push --node <id> --title "OpenClaw" --environment sandbox
openclaw nodes location get --node <id> --accuracy precise
openclaw nodes screen record --node <id> --duration 10s --fps 10 --out ./clip.mp4
```

- `notify` mengirim notifikasi lokal pada node yang mendeklarasikan `system.notify`, termasuk node macOS, iOS, Android, dan watchOS langsung. Pengiriman langsung ke watchOS mengharuskan OpenClaw aktif. Memerlukan `--title` atau `--body`. Opsi: `--sound <name>`, `--priority <passive|active|timeSensitive>`, `--delivery <system|overlay|auto>` (bawaan `system`), `--invoke-timeout <ms>` (bawaan `15000`).
- `push` mengirim push pengujian APNs ke node iOS. Opsi: `--title <text>` (bawaan `OpenClaw`), `--body <text>`, `--environment <sandbox|production>` untuk mengganti lingkungan APNs yang terdeteksi.
- `location get` mengambil lokasi node saat ini. Opsi: `--max-age <ms>` (gunakan kembali penentuan lokasi yang disimpan dalam cache), `--accuracy <coarse|balanced|precise>`, `--location-timeout <ms>` (bawaan `10000`), `--invoke-timeout <ms>` (bawaan `20000`).
- `screen record` merekam klip singkat dan menampilkan jalur penyimpanannya (atau menulis JSON dengan `--json`). Opsi: `--screen <index>` (bawaan `0`), `--duration <ms|10s>` (bawaan `10000`), `--fps <fps>` (bawaan `10`), `--no-audio`, `--out <path>`, `--invoke-timeout <ms>` (bawaan `120000`).

Perintah Kamera dan Canvas memiliki dokumentasinya sendiri: [Node kamera](/id/nodes/camera), [Canvas](/id/platforms/mac/canvas). Canvas diimplementasikan oleh Plugin Canvas eksperimental yang dibundel; inti mempertahankan `openclaw nodes canvas` sebagai titik pemasangan kompatibilitas.

## Terkait

- [Referensi CLI](/id/cli)
- [Node](/id/nodes)
