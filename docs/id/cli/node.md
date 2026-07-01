---
read_when:
    - Menjalankan host node headless
    - Memasangkan node non-macOS untuk system.run
summary: Referensi CLI untuk `openclaw node` (host node tanpa antarmuka)
title: Node
x-i18n:
    generated_at: "2026-07-01T13:22:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b7e68602cb655a6852544f055b9b6c26f2e9cfe1b4d7933e7c27e67011c7cd55
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

Jalankan **host node tanpa kepala** yang terhubung ke Gateway WebSocket dan mengekspos
`system.run` / `system.which` pada mesin ini.

## Mengapa menggunakan host node?

Gunakan host node ketika Anda ingin agen **menjalankan perintah di mesin lain** dalam
jaringan Anda tanpa menginstal aplikasi pendamping macOS lengkap di sana.

Kasus penggunaan umum:

- Menjalankan perintah di mesin Linux/Windows jarak jauh (server build, mesin lab, NAS).
- Menjaga exec tetap **ter-sandbox** di Gateway, tetapi mendelegasikan eksekusi yang disetujui ke host lain.
- Menyediakan target eksekusi ringan tanpa kepala untuk otomasi atau node CI.

Eksekusi tetap dijaga oleh **persetujuan exec** dan allowlist per agen pada
host node, sehingga Anda dapat menjaga akses perintah tetap terbatas dan eksplisit.

## Proksi browser (tanpa konfigurasi)

Host node secara otomatis mengiklankan proksi browser jika `browser.enabled` tidak
dinonaktifkan pada node. Ini memungkinkan agen menggunakan otomasi browser pada node tersebut
tanpa konfigurasi tambahan.

Secara default, proksi mengekspos permukaan profil browser normal milik node. Jika Anda
mengatur `nodeHost.browserProxy.allowProfiles`, proksi menjadi restriktif:
penargetan profil yang tidak ada di allowlist ditolak, dan rute buat/hapus profil
persisten diblokir melalui proksi.

Nonaktifkan pada node jika diperlukan:

```json5
{
  nodeHost: {
    browserProxy: {
      enabled: false,
    },
  },
}
```

## Jalankan (foreground)

```bash
openclaw node run --host <gateway-host> --port 18789
```

Opsi:

- `--host <host>`: Host Gateway WebSocket (default: `127.0.0.1`)
- `--port <port>`: Port Gateway WebSocket (default: `18789`)
- `--context-path <path>`: Jalur konteks Gateway WebSocket (mis. `/openclaw-gw`). Ditambahkan ke URL WebSocket.
- `--tls`: Gunakan TLS untuk koneksi Gateway
- `--tls-fingerprint <sha256>`: Fingerprint sertifikat TLS yang diharapkan (sha256)
- `--node-id <id>`: Timpa id node (menghapus token pairing)
- `--display-name <name>`: Timpa nama tampilan node

## Autentikasi Gateway untuk host node

`openclaw node run` dan `openclaw node install` menyelesaikan autentikasi Gateway dari config/env (tidak ada flag `--token`/`--password` pada perintah node):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` diperiksa lebih dulu.
- Lalu fallback konfigurasi lokal: `gateway.auth.token` / `gateway.auth.password`.
- Dalam mode lokal, host node sengaja tidak mewarisi `gateway.remote.token` / `gateway.remote.password`.
- Jika `gateway.auth.token` / `gateway.auth.password` dikonfigurasi secara eksplisit melalui SecretRef dan tidak terselesaikan, penyelesaian autentikasi node gagal tertutup (tanpa masking fallback jarak jauh).
- Dalam `gateway.mode=remote`, field klien jarak jauh (`gateway.remote.token` / `gateway.remote.password`) juga memenuhi syarat sesuai aturan prioritas jarak jauh.
- Penyelesaian autentikasi host node hanya menghormati variabel env `OPENCLAW_GATEWAY_*`.

Untuk node yang terhubung ke Gateway `ws://` plaintext, loopback, literal IP privat,
`.local`, dan host Tailnet `*.ts.net` diterima. Untuk nama private-DNS tepercaya
lainnya, atur `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`; tanpa itu,
startup node gagal tertutup dan meminta Anda menggunakan `wss://`, tunnel SSH, atau
Tailscale. Ini adalah opt-in lingkungan proses, bukan kunci konfigurasi `openclaw.json`.
`openclaw node install` mempertahankannya ke layanan node yang diawasi ketika variabel tersebut
ada di lingkungan perintah install.

## Layanan (background)

Instal host node tanpa kepala sebagai layanan pengguna.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Opsi:

- `--host <host>`: Host Gateway WebSocket (default: `127.0.0.1`)
- `--port <port>`: Port Gateway WebSocket (default: `18789`)
- `--context-path <path>`: Jalur konteks Gateway WebSocket (mis. `/openclaw-gw`). Ditambahkan ke URL WebSocket.
- `--tls`: Gunakan TLS untuk koneksi Gateway
- `--tls-fingerprint <sha256>`: Fingerprint sertifikat TLS yang diharapkan (sha256)
- `--node-id <id>`: Timpa id node (menghapus token pairing)
- `--display-name <name>`: Timpa nama tampilan node
- `--runtime <runtime>`: Runtime layanan (`node` atau `bun`)
- `--force`: Instal ulang/timpa jika sudah terinstal

Kelola layanan:

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Gunakan `openclaw node run` untuk host node foreground (tanpa layanan).

Perintah layanan menerima `--json` untuk output yang dapat dibaca mesin.

Host node mencoba ulang restart Gateway dan penutupan jaringan dalam proses. Jika
Gateway melaporkan jeda autentikasi token/password/bootstrap terminal, host node
mencatat detail penutupan dan keluar non-zero sehingga launchd/systemd dapat memulai ulang dengan
konfigurasi dan kredensial baru. Jeda yang memerlukan pairing tetap berada dalam
alur foreground agar permintaan tertunda dapat disetujui.

## Pairing

Koneksi pertama membuat permintaan pairing perangkat tertunda (`role: node`) pada Gateway.
Setujui melalui:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Pada jaringan node yang dikontrol ketat, operator Gateway dapat secara eksplisit opt in
untuk menyetujui otomatis pairing node pertama kali dari CIDR tepercaya:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

Ini dinonaktifkan secara default. Ini hanya berlaku untuk pairing `role: node` baru dengan
tanpa cakupan yang diminta. Klien operator/browser, Control UI, WebChat, serta peningkatan role,
cakupan, metadata, atau public-key tetap memerlukan persetujuan manual.

Jika node mencoba ulang pairing dengan detail autentikasi yang berubah (role/scopes/public key),
permintaan tertunda sebelumnya digantikan dan `requestId` baru dibuat.
Jalankan `openclaw devices list` lagi sebelum persetujuan.

Host node menyimpan id node, token, nama tampilan, dan info koneksi gateway di
`~/.openclaw/node.json`.

## Persetujuan exec

`system.run` dijaga oleh persetujuan exec lokal:

- `$OPENCLAW_STATE_DIR/exec-approvals.json`, atau
  `~/.openclaw/exec-approvals.json` ketika variabel tidak diatur
- [Persetujuan exec](/id/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (edit dari Gateway)

Untuk exec node async yang disetujui, OpenClaw menyiapkan `systemRunPlan` kanonis
sebelum meminta konfirmasi. Forward `system.run` yang disetujui kemudian menggunakan kembali
plan tersimpan tersebut, sehingga perubahan pada field command/cwd/session setelah permintaan
persetujuan dibuat ditolak, bukan mengubah apa yang dieksekusi node.

## Terkait

- [Referensi CLI](/id/cli)
- [Node](/id/nodes)
