---
read_when:
    - Menjalankan host Node tanpa antarmuka grafis
    - Memasangkan Node non-macOS untuk system.run
summary: Referensi CLI untuk `openclaw node` (host simpul tanpa antarmuka grafis)
title: Node
x-i18n:
    generated_at: "2026-06-27T17:19:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 03a1b02e90f8f5f7edcfb2e7fd75ef0cbbdeae79dc0ce91339f31a80daeaaa92
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

Jalankan **host Node headless** yang terhubung ke Gateway WebSocket dan mengekspos
`system.run` / `system.which` di mesin ini.

## Mengapa menggunakan host Node?

Gunakan host Node ketika Anda ingin agen **menjalankan perintah di mesin lain** dalam
jaringan Anda tanpa memasang aplikasi pendamping macOS lengkap di sana.

Kasus penggunaan umum:

- Menjalankan perintah di mesin Linux/Windows jarak jauh (server build, mesin lab, NAS).
- Menjaga eksekusi tetap **tersandbox** di gateway, tetapi mendelegasikan eksekusi yang disetujui ke host lain.
- Menyediakan target eksekusi headless yang ringan untuk otomatisasi atau node CI.

Eksekusi tetap dijaga oleh **persetujuan eksekusi** dan daftar izin per agen pada
host Node, sehingga Anda dapat menjaga akses perintah tetap terbatas dan eksplisit.

## Proxy browser (konfigurasi nol)

Host Node secara otomatis mengiklankan proxy browser jika `browser.enabled` tidak
dinonaktifkan pada node. Ini memungkinkan agen menggunakan otomatisasi browser pada node tersebut
tanpa konfigurasi tambahan.

Secara default, proxy mengekspos permukaan profil browser normal milik node. Jika Anda
mengatur `nodeHost.browserProxy.allowProfiles`, proxy menjadi restriktif:
penargetan profil yang tidak ada dalam daftar izin akan ditolak, dan rute
buat/hapus profil persisten diblokir melalui proxy.

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
- `--tls`: Gunakan TLS untuk koneksi gateway
- `--tls-fingerprint <sha256>`: Sidik jari sertifikat TLS yang diharapkan (sha256)
- `--node-id <id>`: Timpa id node (menghapus token pairing)
- `--display-name <name>`: Timpa nama tampilan node

## Autentikasi Gateway untuk host Node

`openclaw node run` dan `openclaw node install` menyelesaikan autentikasi gateway dari config/env (tidak ada flag `--token`/`--password` pada perintah node):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` diperiksa terlebih dahulu.
- Lalu fallback konfigurasi lokal: `gateway.auth.token` / `gateway.auth.password`.
- Dalam mode lokal, host Node sengaja tidak mewarisi `gateway.remote.token` / `gateway.remote.password`.
- Jika `gateway.auth.token` / `gateway.auth.password` dikonfigurasi secara eksplisit melalui SecretRef dan tidak terselesaikan, resolusi autentikasi node gagal tertutup (tanpa masking fallback jarak jauh).
- Dalam `gateway.mode=remote`, field klien jarak jauh (`gateway.remote.token` / `gateway.remote.password`) juga memenuhi syarat sesuai aturan prioritas jarak jauh.
- Resolusi autentikasi host Node hanya menghormati variabel env `OPENCLAW_GATEWAY_*`.

Untuk node yang terhubung ke Gateway `ws://` plaintext, loopback, literal IP privat,
`.local`, dan host Tailnet `*.ts.net` diterima. Untuk nama private-DNS tepercaya lainnya,
atur `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`; tanpa itu, startup node gagal tertutup
dan meminta Anda menggunakan `wss://`, tunnel SSH, atau Tailscale. Ini adalah opt-in
lingkungan proses, bukan kunci konfigurasi `openclaw.json`.
`openclaw node install` mempertahankannya ke dalam layanan node yang diawasi ketika
nilai tersebut ada di lingkungan perintah instalasi.

## Layanan (background)

Pasang host Node headless sebagai layanan pengguna.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Opsi:

- `--host <host>`: Host Gateway WebSocket (default: `127.0.0.1`)
- `--port <port>`: Port Gateway WebSocket (default: `18789`)
- `--tls`: Gunakan TLS untuk koneksi gateway
- `--tls-fingerprint <sha256>`: Sidik jari sertifikat TLS yang diharapkan (sha256)
- `--node-id <id>`: Timpa id node (menghapus token pairing)
- `--display-name <name>`: Timpa nama tampilan node
- `--runtime <runtime>`: Runtime layanan (`node` atau `bun`)
- `--force`: Pasang ulang/timpa jika sudah terpasang

Kelola layanan:

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Gunakan `openclaw node run` untuk host Node foreground (tanpa layanan).

Perintah layanan menerima `--json` untuk keluaran yang dapat dibaca mesin.

Host Node mencoba ulang restart Gateway dan penutupan jaringan dalam proses. Jika
Gateway melaporkan jeda autentikasi token/kata sandi/bootstrap terminal, host Node
mencatat detail penutupan dan keluar dengan nilai non-nol agar launchd/systemd dapat memulai ulangnya dengan
konfigurasi dan kredensial baru. Jeda yang memerlukan pairing tetap berada di alur
foreground agar permintaan tertunda dapat disetujui.

## Pairing

Koneksi pertama membuat permintaan pairing perangkat tertunda (`role: node`) pada Gateway.
Setujui melalui:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Pada jaringan node yang dikontrol ketat, operator Gateway dapat secara eksplisit opt-in
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

Ini dinonaktifkan secara default. Ini hanya berlaku untuk pairing `role: node` baru
tanpa cakupan yang diminta. Klien operator/browser, Control UI, WebChat, dan peningkatan peran,
cakupan, metadata, atau kunci publik tetap memerlukan persetujuan manual.

Jika node mencoba ulang pairing dengan detail autentikasi yang berubah (peran/cakupan/kunci publik),
permintaan tertunda sebelumnya digantikan dan `requestId` baru dibuat.
Jalankan `openclaw devices list` lagi sebelum persetujuan.

Host Node menyimpan id node, token, nama tampilan, dan informasi koneksi gateway di
`~/.openclaw/node.json`.

## Persetujuan eksekusi

`system.run` dikendalikan oleh persetujuan eksekusi lokal:

- `$OPENCLAW_STATE_DIR/exec-approvals.json`, atau
  `~/.openclaw/exec-approvals.json` ketika variabel tidak disetel
- [Persetujuan eksekusi](/id/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (edit dari Gateway)

Untuk eksekusi node async yang disetujui, OpenClaw menyiapkan `systemRunPlan` kanonis
sebelum meminta konfirmasi. Forward `system.run` yang disetujui kemudian menggunakan kembali
rencana tersimpan tersebut, sehingga edit pada field command/cwd/session setelah permintaan
persetujuan dibuat akan ditolak, alih-alih mengubah apa yang dieksekusi node.

## Terkait

- [Referensi CLI](/id/cli)
- [Node](/id/nodes)
