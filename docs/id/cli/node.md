---
read_when:
    - Menjalankan host Node tanpa antarmuka
    - Memasangkan node non-macOS untuk system.run
summary: Referensi CLI untuk `openclaw node` (host node tanpa antarmuka)
title: Node
x-i18n:
    generated_at: "2026-05-06T17:53:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: af4735ac4961dc36fd3f11299eb3ec4e156835e7257b21a79bb1d4b467445faa
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

Jalankan **host node headless** yang terhubung ke WebSocket Gateway dan mengekspos
`system.run` / `system.which` di mesin ini.

## Mengapa menggunakan host node?

Gunakan host node ketika Anda ingin agen **menjalankan perintah di mesin lain** dalam
jaringan Anda tanpa menginstal aplikasi pendamping macOS lengkap di sana.

Kasus penggunaan umum:

- Jalankan perintah di mesin Linux/Windows jarak jauh (server build, mesin lab, NAS).
- Pertahankan exec tetap **tersandbox** di gateway, tetapi delegasikan eksekusi yang disetujui ke host lain.
- Sediakan target eksekusi headless yang ringan untuk otomatisasi atau node CI.

Eksekusi tetap dijaga oleh **persetujuan exec** dan allowlist per agen pada
host node, sehingga Anda dapat menjaga akses perintah tetap terbatas dan eksplisit.

## Proksi browser (zero-config)

Host node secara otomatis mengiklankan proksi browser jika `browser.enabled` tidak
dinonaktifkan pada node. Ini memungkinkan agen menggunakan otomatisasi browser pada node tersebut
tanpa konfigurasi tambahan.

Secara default, proksi mengekspos permukaan profil browser normal milik node. Jika Anda
menetapkan `nodeHost.browserProxy.allowProfiles`, proksi menjadi restriktif:
penargetan profil yang tidak masuk allowlist ditolak, dan rute pembuatan/penghapusan
profil persisten diblokir melalui proksi.

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

- `--host <host>`: Host WebSocket Gateway (default: `127.0.0.1`)
- `--port <port>`: Port WebSocket Gateway (default: `18789`)
- `--tls`: Gunakan TLS untuk koneksi gateway
- `--tls-fingerprint <sha256>`: Sidik jari sertifikat TLS yang diharapkan (sha256)
- `--node-id <id>`: Timpa id node (menghapus token pairing)
- `--display-name <name>`: Timpa nama tampilan node

## Autentikasi Gateway untuk host node

`openclaw node run` dan `openclaw node install` menyelesaikan autentikasi gateway dari config/env (tidak ada flag `--token`/`--password` pada perintah node):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` diperiksa terlebih dahulu.
- Lalu fallback config lokal: `gateway.auth.token` / `gateway.auth.password`.
- Dalam mode lokal, host node sengaja tidak mewarisi `gateway.remote.token` / `gateway.remote.password`.
- Jika `gateway.auth.token` / `gateway.auth.password` dikonfigurasi secara eksplisit melalui SecretRef dan tidak terselesaikan, resolusi autentikasi node gagal secara tertutup (tanpa masking fallback jarak jauh).
- Dalam `gateway.mode=remote`, field klien jarak jauh (`gateway.remote.token` / `gateway.remote.password`) juga memenuhi syarat sesuai aturan prioritas jarak jauh.
- Resolusi autentikasi host node hanya menghormati env var `OPENCLAW_GATEWAY_*`.

Untuk node yang terhubung ke Gateway `ws://` non-loopback pada jaringan privat
tepercaya, tetapkan `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`. Tanpanya, startup node
gagal secara tertutup dan meminta Anda menggunakan `wss://`, tunnel SSH, atau Tailscale.
Ini adalah opt-in lingkungan proses, bukan kunci config `openclaw.json`.
`openclaw node install` mempertahankannya ke dalam layanan node yang disupervisi ketika
hadir di lingkungan perintah install.

## Layanan (background)

Instal host node headless sebagai layanan pengguna.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Opsi:

- `--host <host>`: Host WebSocket Gateway (default: `127.0.0.1`)
- `--port <port>`: Port WebSocket Gateway (default: `18789`)
- `--tls`: Gunakan TLS untuk koneksi gateway
- `--tls-fingerprint <sha256>`: Sidik jari sertifikat TLS yang diharapkan (sha256)
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
Gateway melaporkan jeda autentikasi token/kata sandi/bootstrap terminal, host node
mencatat detail penutupan dan keluar dengan status non-nol agar launchd/systemd dapat memulai ulang dengan
config dan kredensial baru. Jeda yang membutuhkan pairing tetap berada dalam alur
foreground agar permintaan tertunda dapat disetujui.

## Pairing

Koneksi pertama membuat permintaan pairing perangkat tertunda (`role: node`) pada Gateway.
Setujui melalui:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Pada jaringan node yang dikontrol ketat, operator Gateway dapat secara eksplisit melakukan opt-in
untuk menyetujui pairing node pertama kali secara otomatis dari CIDR tepercaya:

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
tanpa scope yang diminta. Klien operator/browser, Control UI, WebChat, serta peningkatan role,
scope, metadata, atau public-key tetap memerlukan persetujuan manual.

Jika node mencoba ulang pairing dengan detail autentikasi yang berubah (role/scopes/public key),
permintaan tertunda sebelumnya digantikan dan `requestId` baru dibuat.
Jalankan `openclaw devices list` lagi sebelum persetujuan.

Host node menyimpan id node, token, nama tampilan, dan info koneksi gateway di
`~/.openclaw/node.json`.

## Persetujuan exec

`system.run` dijaga oleh persetujuan exec lokal:

- `~/.openclaw/exec-approvals.json`
- [Persetujuan exec](/id/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (edit dari Gateway)

Untuk exec node async yang disetujui, OpenClaw menyiapkan `systemRunPlan` kanonis
sebelum meminta persetujuan. Forward `system.run` yang kemudian disetujui menggunakan kembali
rencana tersimpan tersebut, sehingga edit pada field command/cwd/session setelah permintaan persetujuan
dibuat akan ditolak alih-alih mengubah apa yang dijalankan node.

## Terkait

- [Referensi CLI](/id/cli)
- [Node](/id/nodes)
