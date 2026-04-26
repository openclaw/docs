---
read_when:
    - Menjalankan host Node headless
    - Melakukan pairing Node non-macOS untuk `system.run`
summary: Referensi CLI untuk `openclaw node` (host node headless)
title: Node
x-i18n:
    generated_at: "2026-04-26T11:26:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 40f623b163a3c3bcd2d3ff218c5e62a4acba45f7e3f16694d8da62a004b77706
    source_path: cli/node.md
    workflow: 15
---

# `openclaw node`

Jalankan **host Node headless** yang terhubung ke Gateway WebSocket dan mengekspos
`system.run` / `system.which` di mesin ini.

## Mengapa menggunakan host Node?

Gunakan host Node saat Anda ingin agen **menjalankan perintah di mesin lain** dalam
jaringan Anda tanpa memasang aplikasi pendamping macOS penuh di sana.

Kasus penggunaan umum:

- Menjalankan perintah di box Linux/Windows jarak jauh (server build, mesin lab, NAS).
- Menjaga exec tetap **tersandbox** di gateway, tetapi mendelegasikan eksekusi yang disetujui ke host lain.
- Menyediakan target eksekusi ringan dan headless untuk node otomasi atau CI.

Eksekusi tetap dijaga oleh **persetujuan exec** dan allowlist per agen pada
host Node, sehingga Anda dapat menjaga akses perintah tetap terbatas dan eksplisit.

## Proxy browser (tanpa konfigurasi)

Host Node secara otomatis mengiklankan proxy browser jika `browser.enabled` tidak
dinonaktifkan pada node. Ini memungkinkan agen menggunakan otomasi browser pada node
tersebut tanpa konfigurasi tambahan.

Secara default, proxy mengekspos permukaan profil browser normal milik node. Jika Anda
mengatur `nodeHost.browserProxy.allowProfiles`, proxy menjadi restriktif:
penargetan profil yang tidak ada di allowlist akan ditolak, dan rute
buat/hapus profil persisten diblokir melalui proxy.

Nonaktifkan di node jika diperlukan:

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

- `--host <host>`: host Gateway WebSocket (default: `127.0.0.1`)
- `--port <port>`: port Gateway WebSocket (default: `18789`)
- `--tls`: gunakan TLS untuk koneksi gateway
- `--tls-fingerprint <sha256>`: fingerprint sertifikat TLS yang diharapkan (sha256)
- `--node-id <id>`: timpa ID node (menghapus token pairing)
- `--display-name <name>`: timpa nama tampilan node

## Autentikasi Gateway untuk host Node

`openclaw node run` dan `openclaw node install` me-resolve autentikasi gateway dari config/env (tidak ada flag `--token`/`--password` pada perintah node):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` diperiksa terlebih dahulu.
- Lalu fallback config lokal: `gateway.auth.token` / `gateway.auth.password`.
- Dalam mode lokal, host Node sengaja tidak mewarisi `gateway.remote.token` / `gateway.remote.password`.
- Jika `gateway.auth.token` / `gateway.auth.password` secara eksplisit dikonfigurasi melalui SecretRef dan tidak ter-resolve, resolusi autentikasi node gagal tertutup (tanpa masking fallback jarak jauh).
- Dalam `gateway.mode=remote`, field klien jarak jauh (`gateway.remote.token` / `gateway.remote.password`) juga memenuhi syarat sesuai aturan prioritas jarak jauh.
- Resolusi autentikasi host Node hanya menghormati env var `OPENCLAW_GATEWAY_*`.

Untuk node yang terhubung ke Gateway `ws://` non-loopback pada jaringan privat
tepercaya, atur `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`. Tanpanya, startup node
gagal tertutup dan meminta Anda menggunakan `wss://`, tunnel SSH, atau Tailscale.
Ini adalah opt-in lingkungan proses, bukan kunci konfigurasi `openclaw.json`.
`openclaw node install` mempertahankannya ke layanan node yang diawasi ketika
variabel itu ada di lingkungan perintah install.

## Layanan (background)

Pasang host Node headless sebagai layanan pengguna.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Opsi:

- `--host <host>`: host Gateway WebSocket (default: `127.0.0.1`)
- `--port <port>`: port Gateway WebSocket (default: `18789`)
- `--tls`: gunakan TLS untuk koneksi gateway
- `--tls-fingerprint <sha256>`: fingerprint sertifikat TLS yang diharapkan (sha256)
- `--node-id <id>`: timpa ID node (menghapus token pairing)
- `--display-name <name>`: timpa nama tampilan node
- `--runtime <runtime>`: runtime layanan (`node` atau `bun`)
- `--force`: pasang ulang/timpa jika sudah terpasang

Kelola layanan:

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Gunakan `openclaw node run` untuk host Node foreground (tanpa layanan).

Perintah layanan menerima `--json` untuk output yang dapat dibaca mesin.

Host Node mencoba ulang restart Gateway dan penutupan jaringan di dalam proses. Jika
Gateway melaporkan jeda autentikasi token/password/bootstrap terminal, host Node
mencatat detail penutupan dan keluar non-zero agar launchd/systemd dapat memulainya ulang dengan
config dan kredensial baru. Jeda yang memerlukan pairing tetap berada dalam
alur foreground agar permintaan tertunda dapat disetujui.

## Pairing

Koneksi pertama membuat permintaan pairing perangkat tertunda (`role: node`) di Gateway.
Setujui melalui:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Pada jaringan node yang sangat terkontrol, operator Gateway dapat secara eksplisit ikut serta
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
tanpa scope yang diminta. Klien operator/browser, Control UI, WebChat, dan upgrade role,
scope, metadata, atau public key tetap memerlukan persetujuan manual.

Jika node mencoba ulang pairing dengan detail autentikasi yang berubah (role/scope/public key),
permintaan tertunda sebelumnya akan digantikan dan `requestId` baru akan dibuat.
Jalankan `openclaw devices list` lagi sebelum persetujuan.

Host Node menyimpan ID node, token, nama tampilan, dan info koneksi gateway di
`~/.openclaw/node.json`.

## Persetujuan exec

`system.run` dikendalikan oleh persetujuan exec lokal:

- `~/.openclaw/exec-approvals.json`
- [Persetujuan exec](/id/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (edit dari Gateway)

Untuk exec node async yang disetujui, OpenClaw menyiapkan `systemRunPlan`
kanonis sebelum prompt. Forward `system.run` yang kemudian disetujui menggunakan kembali
plan tersimpan tersebut, sehingga edit pada field command/cwd/session setelah permintaan persetujuan
dibuat akan ditolak alih-alih mengubah apa yang dijalankan node.

## Terkait

- [Referensi CLI](/id/cli)
- [Nodes](/id/nodes)
