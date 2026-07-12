---
read_when:
    - Menjalankan host Node tanpa antarmuka grafis
    - Memasangkan node non-macOS untuk system.run
summary: Referensi CLI untuk `openclaw node` (host Node tanpa antarmuka)
title: Node
x-i18n:
    generated_at: "2026-07-12T14:02:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 076449123d8b3e9cb092a2bd7de311b87b27a128cb381fc343c68d18aeb634a0
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

Jalankan **host node tanpa antarmuka** yang terhubung ke WebSocket Gateway dan mengekspos
`system.run` / `system.which` pada mesin ini.

## Mengapa menggunakan host node?

Gunakan host node saat Anda ingin agen **menjalankan perintah pada mesin lain** di
jaringan Anda tanpa memasang aplikasi pendamping macOS lengkap di sana.

Kasus penggunaan umum:

- Menjalankan perintah pada mesin Linux/Windows jarak jauh (server build, mesin laboratorium, NAS).
- Menjaga exec tetap **terisolasi** di Gateway, tetapi mendelegasikan eksekusi yang disetujui ke host lain.
- Menyediakan target eksekusi ringan tanpa antarmuka untuk otomatisasi atau node CI.

Eksekusi tetap dilindungi oleh **persetujuan exec** dan daftar izin per agen pada
host node, sehingga Anda dapat menjaga akses perintah tetap terbatas dan eksplisit.

`openclaw node run` dapat memublikasikan alat berbasis Plugin atau MCP setelah terhubung.
Secara default, Gateway memercayai deskriptor dari node yang dipasangkan, dengan tetap
mengharuskan perintah setiap deskriptor berada dalam cakupan perintah node yang disetujui. Agen
melihat setiap deskriptor yang diterima sebagai alat Plugin biasa, tetapi eksekusi tetap
berlangsung melalui `node.invoke`, sehingga pemutusan koneksi node menghapus alat tersebut dari
eksekusi agen baru. Operator Gateway dapat menonaktifkan publikasi dengan
`gateway.nodes.pluginTools.enabled: false`.

Untuk alat MCP deklaratif, tambahkan struktur server MCP biasa di bawah
`nodeHost.mcp.servers` dalam `openclaw.json` pada mesin node, lalu mulai ulang
host node. Node mendeklarasikan kelompok perintah `mcp.tools.call.v1` yang memerlukan
persetujuan dan memublikasikan alat yang tercantum setelah terhubung; mengubah daftar server
kemudian tidak memerlukan pemasangan ulang. Lihat
[Server MCP yang dihost di node](/id/nodes#node-hosted-mcp-servers).

## Proksi peramban (tanpa konfigurasi)

Host node secara otomatis mengiklankan proksi peramban jika `browser.enabled` tidak
dinonaktifkan pada node. Hal ini memungkinkan agen menggunakan otomatisasi peramban pada node tersebut
tanpa konfigurasi tambahan.

Secara default, proksi mengekspos cakupan profil peramban normal milik node. Jika Anda
menetapkan `nodeHost.browserProxy.allowProfiles`, proksi menjadi terbatas:
penargetan profil yang tidak tercantum dalam daftar izin ditolak, dan rute pembuatan/penghapusan
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

## Menjalankan (latar depan)

```bash
openclaw node run --host <gateway-host> --port 18789
```

Opsi:

- `--host <host>`: Host WebSocket Gateway (default: `127.0.0.1`)
- `--port <port>`: Porta WebSocket Gateway (default: `18789`)
- `--context-path <path>`: Jalur konteks WebSocket Gateway (misalnya `/openclaw-gw`). Ditambahkan ke URL WebSocket.
- `--tls`: Menggunakan TLS untuk koneksi Gateway
- `--no-tls`: Memaksakan koneksi Gateway teks biasa meskipun konfigurasi Gateway lokal mengaktifkan TLS
- `--tls-fingerprint <sha256>`: Sidik jari sertifikat TLS yang diharapkan (sha256)
- `--node-id <id>`: Mengganti ID instans klien lama yang disimpan dalam `node.json` (tidak mereset pemasangan)
- `--display-name <name>`: Mengganti nama tampilan node

## Autentikasi Gateway untuk host node

`openclaw node run` dan `openclaw node install` menentukan autentikasi Gateway dari konfigurasi/variabel lingkungan (tidak ada flag `--token`/`--password` pada perintah node):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` diperiksa terlebih dahulu.
- Kemudian cadangan konfigurasi lokal: `gateway.auth.token` / `gateway.auth.password`.
- Dalam mode lokal, host node secara sengaja tidak mewarisi `gateway.remote.token` / `gateway.remote.password`.
- Jika `gateway.auth.token` / `gateway.auth.password` dikonfigurasi secara eksplisit melalui SecretRef dan tidak dapat ditentukan, penentuan autentikasi node gagal secara tertutup (tanpa cadangan jarak jauh yang menyamarkan kegagalan).
- Dalam `gateway.mode=remote`, kolom klien jarak jauh (`gateway.remote.token` / `gateway.remote.password`) juga dapat digunakan sesuai aturan prioritas jarak jauh.
- Penentuan autentikasi host node hanya mematuhi variabel lingkungan `OPENCLAW_GATEWAY_*`.

Untuk node yang terhubung ke Gateway `ws://` teks biasa, local loopback, literal IP
privat, `.local`, dan host Tailnet `*.ts.net` diterima. Untuk nama DNS privat
tepercaya lainnya, tetapkan `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`; tanpanya,
proses awal node gagal secara tertutup dan meminta Anda menggunakan `wss://`, terowongan SSH, atau
Tailscale. Ini adalah pilihan eksplisit melalui lingkungan proses, bukan kunci konfigurasi
`openclaw.json`.
`openclaw node install` menyimpannya dalam layanan node yang diawasi jika variabel tersebut
ada dalam lingkungan perintah pemasangan.

## Layanan (latar belakang)

Pasang host node tanpa antarmuka sebagai layanan pengguna (launchd pada macOS, systemd pada
Linux, Windows Task Scheduler pada Windows).

```bash
openclaw node install --host <gateway-host> --port 18789
```

Opsi:

- `--host <host>`: Host WebSocket Gateway (default: `127.0.0.1`)
- `--port <port>`: Porta WebSocket Gateway (default: `18789`)
- `--context-path <path>`: Jalur konteks WebSocket Gateway (misalnya `/openclaw-gw`). Ditambahkan ke URL WebSocket.
- `--tls`: Menggunakan TLS untuk koneksi Gateway
- `--tls-fingerprint <sha256>`: Sidik jari sertifikat TLS yang diharapkan (sha256)
- `--node-id <id>`: Mengganti ID instans klien lama yang disimpan dalam `node.json` (tidak mereset pemasangan)
- `--display-name <name>`: Mengganti nama tampilan node
- `--runtime <runtime>`: Runtime layanan (`node` atau `bun`)
- `--force`: Memasang ulang/menimpa jika sudah terpasang

Kelola layanan:

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Gunakan `openclaw node run` untuk host node latar depan (tanpa layanan).

Perintah layanan menerima `--json` untuk keluaran yang dapat dibaca mesin.

Host node mencoba kembali ketika Gateway dimulai ulang atau koneksi jaringan ditutup, dalam proses yang sama. Jika
Gateway melaporkan jeda autentikasi token/kata sandi/bootstrap yang bersifat terminal, host node
mencatat detail penutupan dan keluar dengan status bukan nol agar launchd/systemd/Task Scheduler dapat
memulai ulang dengan konfigurasi dan kredensial baru. Jeda yang memerlukan pemasangan tetap berada dalam
alur latar depan agar permintaan yang tertunda dapat disetujui.

## Pemasangan

Koneksi pertama membuat permintaan pemasangan perangkat yang tertunda (`role: node`) pada Gateway.

Saat host Gateway dapat menggunakan SSH ke host node secara noninteraktif (pengguna yang sama,
kunci host tepercaya), permintaan tertunda disetujui secara otomatis: Gateway
menjalankan `openclaw node identity --json` pada host node melalui SSH dan menyetujui jika
kunci perangkat cocok persis. Ini aktif secara default; lihat
[Persetujuan otomatis perangkat yang diverifikasi SSH](/id/gateway/pairing#ssh-verified-device-auto-approval-default)
untuk persyaratan dan cara menonaktifkannya (`gateway.nodes.pairing.sshVerify: false`).

Jika tidak, setujui secara manual melalui:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Periksa identitas node lokal yang diverifikasi oleh Gateway:

```bash
openclaw node identity --json
```

Perintah ini mencetak ID perangkat dan kunci publik dari `identity/device.json` dan tidak pernah
membuat atau mengubah berkas identitas.

Pada jaringan node yang dikontrol secara ketat, operator Gateway dapat secara eksplisit memilih untuk
menyetujui secara otomatis pemasangan node pertama kali dari CIDR tepercaya:

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

Fitur ini dinonaktifkan secara default (`autoApproveCidrs` tidak ditetapkan). Fitur ini hanya berlaku untuk
pemasangan `role: node` baru tanpa cakupan yang diminta, dari IP klien yang
dipercayai Gateway. Klien operator/peramban, Control UI, WebChat, serta peningkatan
peran, cakupan, metadata, atau kunci publik tetap memerlukan persetujuan manual.

Jika node mencoba kembali pemasangan dengan detail autentikasi yang berubah (peran/cakupan/kunci publik),
permintaan tertunda sebelumnya digantikan dan `requestId` baru dibuat.
Jalankan kembali `openclaw devices list` sebelum memberikan persetujuan.

### Status identitas dan pemasangan

Node tanpa antarmuka memisahkan ID instans klien lamanya dari identitas perangkat
bertanda tangan yang digunakan Gateway untuk pemasangan dan perutean. Berkas-berkas ini berada di
direktori status OpenClaw (`~/.openclaw` secara default, atau `$OPENCLAW_STATE_DIR`
jika ditetapkan):

| Berkas                      | Tujuan                                                                                                                                                |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `node.json`                 | ID instans klien di bawah kunci lama `nodeId`, nama tampilan, dan metadata koneksi Gateway. Klien mengirim nilai ini sebagai `instanceId`.             |
| `identity/device.json`      | Pasangan kunci Ed25519 bertanda tangan dan ID perangkat turunannya. Untuk koneksi bertanda tangan, ID perangkat ini menjadi ID node yang dirutekan dan identitas pemasangan. |
| `identity/device-auth.json` | Token perangkat yang dipasangkan, dengan kunci berdasarkan ID perangkat kriptografis dan peran.                                                       |

`--node-id` hanya mengubah ID instans klien dalam `node.json`. Flag ini tidak
mengubah ID perangkat kriptografis atau menghapus autentikasi pemasangan. Demikian pula, hanya menghapus
`node.json` tidak mereset pemasangan. Untuk mencabut dan memasangkan ulang node:

1. Pada Gateway, jalankan `openclaw nodes remove --node <id|name|ip>`.
2. Pada node, mulai ulang layanan yang terpasang dengan `openclaw node restart`, atau
   hentikan dan jalankan kembali perintah latar depan `openclaw node run`. Ini memulai
   alur pemasangan perangkat. Jika `openclaw devices list` tidak menampilkan permintaan
   dan node melaporkan `AUTH_DEVICE_TOKEN_MISMATCH`, mulai ulang atau jalankan kembali sekali
   lagi. Percobaan yang ditolak menghapus token lokal yang kini telah dicabut; percobaan
   berikutnya dapat meminta pemasangan.
3. Pada Gateway, jalankan `openclaw devices list`, lalu
   `openclaw devices approve <deviceRequestId>`.
4. Mulai ulang atau jalankan kembali node sekali lagi. Klien yang dijeda untuk pemasangan tidak dilanjutkan
   secara otomatis setelah persetujuan; koneksi ulang ini membuat permintaan
   cakupan perintah yang terpisah.
5. Pada Gateway, jalankan `openclaw nodes pending`, lalu
   `openclaw nodes approve <nodeRequestId>`.

Kedua ID permintaan tersebut berbeda. Kebijakan CIDR tepercaya yang berlaku dapat
menyetujui secara otomatis langkah pemasangan perangkat pertama kali; persetujuan cakupan perintah tetap
menjadi pemeriksaan terpisah.

Rilis OpenClaw lama dapat meninggalkan kolom `token` lama dalam `node.json`.
OpenClaw saat ini tidak menggunakan kolom tersebut dan menghapusnya saat host node
menyimpan berkas itu lagi. Jaga kerahasiaan kedua berkas di bawah `identity/`; berkas tersebut berisi
pasangan kunci perangkat dan token autentikasi.

## Persetujuan exec

`system.run` dibatasi oleh persetujuan exec lokal:

- `$OPENCLAW_STATE_DIR/exec-approvals.json`, atau
  `~/.openclaw/exec-approvals.json` jika variabel tidak ditetapkan
- [Persetujuan exec](/id/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (sunting dari Gateway)

Untuk exec node asinkron yang disetujui, OpenClaw menyiapkan `systemRunPlan` kanonis
sebelum meminta persetujuan. Penerusan `system.run` yang kemudian disetujui menggunakan kembali
rencana tersimpan tersebut, sehingga perubahan pada kolom perintah/cwd/sesi setelah permintaan persetujuan
dibuat akan ditolak alih-alih mengubah apa yang dijalankan node.

## Terkait

- [Referensi CLI](/id/cli)
- [Node](/id/nodes)
