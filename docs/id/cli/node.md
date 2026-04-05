---
read_when:
    - Menjalankan host node headless
    - Memasangkan node non-macOS untuk system.run
summary: Referensi CLI untuk `openclaw node` (host node headless)
title: node
x-i18n:
    generated_at: "2026-04-05T13:49:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6123b33ec46f2b85f2c815947435ac91bbe84456165ff0e504453356da55b46d
    source_path: cli/node.md
    workflow: 15
---

# `openclaw node`

Jalankan **host node headless** yang terhubung ke Gateway WebSocket dan mengekspos
`system.run` / `system.which` di mesin ini.

## Mengapa menggunakan host node?

Gunakan host node ketika Anda ingin agen **menjalankan perintah di mesin lain** dalam
jaringan Anda tanpa memasang aplikasi pendamping macOS lengkap di sana.

Kasus penggunaan umum:

- Menjalankan perintah di mesin Linux/Windows jarak jauh (server build, mesin lab, NAS).
- Menjaga exec tetap **dalam sandbox** di gateway, tetapi mendelegasikan eksekusi yang disetujui ke host lain.
- Menyediakan target eksekusi yang ringan dan headless untuk otomasi atau node CI.

Eksekusi tetap dijaga oleh **persetujuan exec** dan allowlist per agen pada
host node, sehingga Anda dapat menjaga akses perintah tetap terbatas dan eksplisit.

## Browser proxy (konfigurasi nol)

Host node secara otomatis mengiklankan browser proxy jika `browser.enabled` tidak
dinonaktifkan pada node. Ini memungkinkan agen menggunakan otomasi browser pada node tersebut
tanpa konfigurasi tambahan.

Secara default, proxy mengekspos permukaan profil browser normal milik node. Jika Anda
menyetel `nodeHost.browserProxy.allowProfiles`, proxy menjadi restriktif:
penargetan profil yang tidak ada dalam allowlist akan ditolak, dan rute
pembuatan/penghapusan profil persisten diblokir melalui proxy.

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

- `--host <host>`: host Gateway WebSocket (default: `127.0.0.1`)
- `--port <port>`: port Gateway WebSocket (default: `18789`)
- `--tls`: gunakan TLS untuk koneksi gateway
- `--tls-fingerprint <sha256>`: fingerprint sertifikat TLS yang diharapkan (sha256)
- `--node-id <id>`: timpa id node (menghapus pairing token)
- `--display-name <name>`: timpa nama tampilan node

## Auth gateway untuk host node

`openclaw node run` dan `openclaw node install` menyelesaikan auth gateway dari config/env (tanpa flag `--token`/`--password` pada perintah node):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` diperiksa terlebih dahulu.
- Lalu fallback config lokal: `gateway.auth.token` / `gateway.auth.password`.
- Dalam mode lokal, host node secara sengaja tidak mewarisi `gateway.remote.token` / `gateway.remote.password`.
- Jika `gateway.auth.token` / `gateway.auth.password` secara eksplisit dikonfigurasi melalui SecretRef dan tidak terselesaikan, resolusi auth node gagal secara tertutup (tanpa fallback jarak jauh yang menutupi masalah).
- Dalam `gateway.mode=remote`, field klien jarak jauh (`gateway.remote.token` / `gateway.remote.password`) juga memenuhi syarat sesuai aturan prioritas remote.
- Resolusi auth host node hanya menghormati env var `OPENCLAW_GATEWAY_*`.

## Layanan (background)

Pasang host node headless sebagai layanan pengguna.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Opsi:

- `--host <host>`: host Gateway WebSocket (default: `127.0.0.1`)
- `--port <port>`: port Gateway WebSocket (default: `18789`)
- `--tls`: gunakan TLS untuk koneksi gateway
- `--tls-fingerprint <sha256>`: fingerprint sertifikat TLS yang diharapkan (sha256)
- `--node-id <id>`: timpa id node (menghapus pairing token)
- `--display-name <name>`: timpa nama tampilan node
- `--runtime <runtime>`: runtime layanan (`node` atau `bun`)
- `--force`: pasang ulang/timpa jika sudah terpasang

Kelola layanan:

```bash
openclaw node status
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Gunakan `openclaw node run` untuk host node foreground (tanpa layanan).

Perintah layanan menerima `--json` untuk output yang dapat dibaca mesin.

## Pairing

Koneksi pertama membuat permintaan pairing perangkat tertunda (`role: node`) pada Gateway.
Setujui melalui:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Jika node mencoba pairing ulang dengan detail auth yang berubah (role/scope/public key),
permintaan tertunda sebelumnya digantikan dan `requestId` baru dibuat.
Jalankan `openclaw devices list` lagi sebelum menyetujui.

Host node menyimpan id node, token, nama tampilan, dan info koneksi gateway di
`~/.openclaw/node.json`.

## Persetujuan exec

`system.run` dikendalikan oleh persetujuan exec lokal:

- `~/.openclaw/exec-approvals.json`
- [Persetujuan exec](/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (edit dari Gateway)

Untuk exec node async yang disetujui, OpenClaw menyiapkan `systemRunPlan` kanonis
sebelum meminta persetujuan. Forward `system.run` yang kemudian disetujui menggunakan kembali
rencana tersimpan tersebut, sehingga edit pada field command/cwd/session setelah permintaan persetujuan
dibuat akan ditolak alih-alih mengubah apa yang dieksekusi node.
