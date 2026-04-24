---
read_when:
    - Menjalankan host Node tanpa antarmuka
    - Melakukan pairing node non-macOS untuk system.run
summary: Referensi CLI untuk `openclaw node` (host Node tanpa antarmuka)
title: Node
x-i18n:
    generated_at: "2026-04-24T09:02:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9f2bd6d61ee87d36f7691207d03a91c914e6460549256e0cc6ea7bebfa713923
    source_path: cli/node.md
    workflow: 15
---

# `openclaw node`

Jalankan **host Node tanpa antarmuka** yang terhubung ke Gateway WebSocket dan mengekspos
`system.run` / `system.which` di mesin ini.

## Mengapa menggunakan host node?

Gunakan host node saat Anda ingin agen **menjalankan perintah di mesin lain** dalam
jaringan Anda tanpa memasang aplikasi pendamping macOS penuh di sana.

Kasus penggunaan umum:

- Menjalankan perintah di mesin Linux/Windows jarak jauh (server build, mesin lab, NAS).
- Menjaga exec tetap **tersandbox** di gateway, tetapi mendelegasikan eksekusi yang disetujui ke host lain.
- Menyediakan target eksekusi ringan tanpa antarmuka untuk otomasi atau node CI.

Eksekusi tetap dilindungi oleh **persetujuan exec** dan allowlist per agen di
host node, sehingga Anda dapat menjaga akses perintah tetap terbatas dan eksplisit.

## Proxy browser (zero-config)

Host node secara otomatis mengiklankan proxy browser jika `browser.enabled` tidak
dinonaktifkan di node. Ini memungkinkan agen menggunakan otomatisasi browser di node
tersebut tanpa konfigurasi tambahan.

Secara default, proxy mengekspos permukaan profil browser normal node. Jika Anda
menyetel `nodeHost.browserProxy.allowProfiles`, proxy menjadi restriktif:
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
- `--node-id <id>`: override id node (menghapus token pairing)
- `--display-name <name>`: override nama tampilan node

## Autentikasi Gateway untuk host node

`openclaw node run` dan `openclaw node install` menyelesaikan autentikasi gateway dari config/env (tanpa flag `--token`/`--password` pada perintah node):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` diperiksa terlebih dahulu.
- Lalu fallback config lokal: `gateway.auth.token` / `gateway.auth.password`.
- Dalam mode lokal, host node sengaja tidak mewarisi `gateway.remote.token` / `gateway.remote.password`.
- Jika `gateway.auth.token` / `gateway.auth.password` secara eksplisit dikonfigurasi melalui SecretRef dan tidak terselesaikan, resolusi autentikasi node gagal tertutup (tanpa fallback remote yang menutupi).
- Dalam `gateway.mode=remote`, field klien remote (`gateway.remote.token` / `gateway.remote.password`) juga memenuhi syarat sesuai aturan prioritas remote.
- Resolusi autentikasi host node hanya menghormati variabel env `OPENCLAW_GATEWAY_*`.

Untuk node yang terhubung ke Gateway `ws://` non-loopback pada jaringan privat
tepercaya, setel `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`. Tanpanya, startup node
gagal tertutup dan meminta Anda menggunakan `wss://`, tunnel SSH, atau Tailscale.
Ini adalah opt-in process-environment, bukan kunci config `openclaw.json`.
`openclaw node install` akan menyimpannya ke layanan node yang diawasi saat variabel tersebut
ada dalam environment perintah install.

## Layanan (background)

Pasang host node tanpa antarmuka sebagai layanan pengguna.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Opsi:

- `--host <host>`: host Gateway WebSocket (default: `127.0.0.1`)
- `--port <port>`: port Gateway WebSocket (default: `18789`)
- `--tls`: gunakan TLS untuk koneksi gateway
- `--tls-fingerprint <sha256>`: fingerprint sertifikat TLS yang diharapkan (sha256)
- `--node-id <id>`: override id node (menghapus token pairing)
- `--display-name <name>`: override nama tampilan node
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

Koneksi pertama membuat permintaan pairing perangkat tertunda (`role: node`) di Gateway.
Setujui melalui:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Jika node mencoba pairing ulang dengan detail auth yang berubah (role/scopes/public key),
permintaan tertunda sebelumnya digantikan dan `requestId` baru dibuat.
Jalankan `openclaw devices list` lagi sebelum menyetujui.

Host node menyimpan id node, token, nama tampilan, dan info koneksi gateway di
`~/.openclaw/node.json`.

## Persetujuan exec

`system.run` dibatasi oleh persetujuan exec lokal:

- `~/.openclaw/exec-approvals.json`
- [Persetujuan exec](/id/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (edit dari Gateway)

Untuk exec node async yang disetujui, OpenClaw menyiapkan `systemRunPlan`
kanonis sebelum meminta persetujuan. Forward `system.run` yang kemudian disetujui menggunakan kembali
plan tersimpan tersebut, sehingga edit pada field command/cwd/session setelah permintaan persetujuan
dibuat akan ditolak alih-alih mengubah apa yang dieksekusi node.

## Terkait

- [Referensi CLI](/id/cli)
- [Nodes](/id/nodes)
