---
read_when:
    - Menjalankan host Node tanpa antarmuka grafis
    - Memasangkan node non-macOS untuk system.run
summary: Referensi CLI untuk `openclaw node` (host node tanpa antarmuka grafis)
title: Node
x-i18n:
    generated_at: "2026-07-16T18:01:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d17b96b8829bef4202ff220d9b20e04c183702f997f669120cb16aa7191235b6
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

Jalankan **host node headless** yang terhubung ke WebSocket Gateway dan mengekspos
`system.run` / `system.which` pada mesin ini.

Di macOS, aplikasi bilah menu sudah menyematkan runtime host node ini ke dalam
koneksi node-nya sendiri dan menambahkan kemampuan native Mac. Gunakan `openclaw node run` pada
Mac hanya jika Anda memang menginginkan node headless tanpa aplikasi. Menjalankan
keduanya akan membuat dua identitas node untuk mesin yang sama.

## Mengapa menggunakan host node?

Gunakan host node jika Anda ingin agen **menjalankan perintah pada mesin lain** di
jaringan Anda tanpa menginstal aplikasi pendamping macOS lengkap di sana.

Kasus penggunaan umum:

- Jalankan perintah pada mesin Linux/Windows jarak jauh (server build, mesin lab, NAS).
- Pertahankan exec tetap **terisolasi dalam sandbox** di Gateway, tetapi delegasikan eksekusi yang disetujui ke host lain.
- Sediakan target eksekusi headless yang ringan untuk otomatisasi atau node CI.

Eksekusi tetap dilindungi oleh **persetujuan exec** dan daftar izin per agen pada
host node, sehingga Anda dapat menjaga akses perintah tetap terbatas dan eksplisit.

`openclaw node run` dapat memublikasikan alat yang didukung plugin atau MCP setelah terhubung.
Gateway memercayai deskriptor dari node yang telah dipasangkan secara default, sembari mewajibkan
perintah setiap deskriptor tetap berada dalam cakupan perintah yang disetujui pada node.
Agen melihat setiap deskriptor yang diterima sebagai alat plugin biasa, tetapi eksekusi tetap
melewati `node.invoke`, sehingga memutuskan koneksi node akan menghapus alat tersebut dari
eksekusi agen baru. Operator Gateway dapat menonaktifkan publikasi dengan
`gateway.nodes.pluginTools.enabled: false`.

Untuk alat MCP deklaratif, tambahkan struktur server MCP normal di bawah
`nodeHost.mcp.servers` dalam `openclaw.json` pada mesin node, lalu mulai ulang
host node. Node mendeklarasikan keluarga perintah `mcp.tools.call.v1` yang memerlukan persetujuan
dan memublikasikan alat yang tercantum setelah terhubung; mengubah daftar server
kemudian tidak memerlukan pemasangan ulang. Lihat
[Server MCP yang dihosting node](/id/nodes#node-hosted-mcp-servers).

## Proksi browser (tanpa konfigurasi)

Host node secara otomatis mengiklankan proksi browser jika `browser.enabled` tidak
dinonaktifkan pada node. Ini memungkinkan agen menggunakan otomatisasi browser pada node tersebut
tanpa konfigurasi tambahan.

Secara default, proksi mengekspos cakupan profil browser normal milik node. Jika Anda
mengatur `nodeHost.browserProxy.allowProfiles`, proksi menjadi restriktif:
penargetan profil yang tidak ada dalam daftar izin ditolak, dan rute pembuatan/penghapusan
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

## Jalankan (latar depan)

```bash
openclaw node run --host <gateway-host> --port 18789
```

Opsi:

- `--host <host>`: Host WebSocket Gateway (default: `127.0.0.1`)
- `--port <port>`: Port WebSocket Gateway (default: `18789`)
- `--context-path <path>`: Jalur konteks WebSocket Gateway (misalnya `/openclaw-gw`). Ditambahkan ke URL WebSocket.
- `--tls`: Gunakan TLS untuk koneksi Gateway
- `--no-tls`: Paksa koneksi Gateway teks biasa meskipun konfigurasi Gateway lokal mengaktifkan TLS
- `--tls-fingerprint <sha256>`: Sidik jari sertifikat TLS yang diharapkan (sha256)
- `--node-id <id>`: Timpa ID instans klien yang disimpan dalam status SQLite bersama (tidak mengatur ulang pemasangan)
- `--display-name <name>`: Timpa nama tampilan node

## Autentikasi Gateway untuk host node

`openclaw node run` dan `openclaw node install` menentukan autentikasi Gateway dari konfigurasi/lingkungan (tanpa flag `--token`/`--password` pada perintah node):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` diperiksa terlebih dahulu.
- Kemudian fallback ke konfigurasi lokal: `gateway.auth.token` / `gateway.auth.password`.
- Dalam mode lokal, host node sengaja tidak mewarisi `gateway.remote.token` / `gateway.remote.password`.
- Jika `gateway.auth.token` / `gateway.auth.password` dikonfigurasi secara eksplisit melalui SecretRef dan tidak dapat diresolusikan, resolusi autentikasi node gagal secara tertutup (tidak ada fallback jarak jauh yang menyamarkannya).
- Dalam `gateway.mode=remote`, bidang klien jarak jauh (`gateway.remote.token` / `gateway.remote.password`) juga memenuhi syarat sesuai aturan prioritas jarak jauh.
- Resolusi autentikasi host node hanya menerima variabel lingkungan `OPENCLAW_GATEWAY_*`.

Untuk node yang terhubung ke Gateway `ws://` teks biasa, loopback, literal IP
privat, `.local`, dan host Tailnet `*.ts.net` diterima. Untuk nama
DNS privat tepercaya lainnya, atur `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`; tanpanya,
proses awal node gagal secara tertutup dan meminta Anda menggunakan `wss://`, tunnel SSH, atau
Tailscale. Ini adalah keikutsertaan eksplisit melalui lingkungan proses, bukan kunci konfigurasi
`openclaw.json`.
`openclaw node install` mempertahankannya dalam layanan node yang diawasi ketika
variabel tersebut ada dalam lingkungan perintah instalasi.

## Layanan (latar belakang)

Instal host node headless sebagai layanan pengguna (launchd di macOS, systemd di
Linux, Windows Task Scheduler di Windows).

```bash
openclaw node install --host <gateway-host> --port 18789
```

Opsi:

- `--host <host>`: Host WebSocket Gateway (default: `127.0.0.1`)
- `--port <port>`: Port WebSocket Gateway (default: `18789`)
- `--context-path <path>`: Jalur konteks WebSocket Gateway (misalnya `/openclaw-gw`). Ditambahkan ke URL WebSocket.
- `--tls`: Gunakan TLS untuk koneksi Gateway
- `--tls-fingerprint <sha256>`: Sidik jari sertifikat TLS yang diharapkan (sha256)
- `--node-id <id>`: Timpa ID instans klien yang disimpan dalam status SQLite bersama (tidak mengatur ulang pemasangan)
- `--display-name <name>`: Timpa nama tampilan node
- `--runtime <runtime>`: Runtime layanan (`node`)
- `--force`: Instal ulang/timpa jika sudah terinstal

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

Host node mencoba kembali saat Gateway dimulai ulang dan saat koneksi jaringan ditutup
di dalam proses. Jika Gateway melaporkan jeda autentikasi terminal akibat token/kata sandi/bootstrap,
host node mencatat detail penutupan dan keluar dengan kode bukan nol agar
launchd/systemd/Task Scheduler dapat memulai ulang dengan konfigurasi dan kredensial baru.
Jeda yang memerlukan pemasangan tetap berada dalam alur latar depan agar permintaan yang tertunda
dapat disetujui.

## Pemasangan

Koneksi pertama membuat permintaan pemasangan perangkat yang tertunda (`role: node`) pada Gateway.

Jika host Gateway dapat terhubung melalui SSH ke host node secara noninteraktif (pengguna yang sama,
kunci host tepercaya), permintaan yang tertunda disetujui secara otomatis: Gateway
menjalankan `openclaw node identity --json` pada host node melalui SSH dan memberikan persetujuan jika
kunci perangkat sama persis. Fitur ini aktif secara default; lihat
[Persetujuan otomatis perangkat yang diverifikasi SSH](/id/gateway/pairing#ssh-verified-device-auto-approval-default)
untuk persyaratan dan cara menonaktifkannya (`gateway.nodes.pairing.sshVerify: false`).

Jika tidak, setujui secara manual melalui:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Periksa identitas node lokal yang digunakan Gateway untuk verifikasi:

```bash
openclaw node identity --json
```

Perintah ini mencetak ID perangkat dan kunci publik dari `identity/device.json` dan tidak pernah
membuat atau mengubah berkas identitas.

Pada jaringan node yang dikontrol ketat, operator Gateway dapat secara eksplisit mengaktifkan
persetujuan otomatis untuk pemasangan node pertama kali dari CIDR tepercaya:

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

Fitur ini dinonaktifkan secara default (`autoApproveCidrs` tidak diatur). Fitur ini hanya berlaku untuk
pemasangan `role: node` baru tanpa cakupan yang diminta, dari IP klien yang
dipercayai Gateway. Klien operator/browser, Control UI, WebChat, serta peningkatan
peran, cakupan, metadata, atau kunci publik tetap memerlukan persetujuan manual.

Jika node mencoba kembali pemasangan dengan detail autentikasi yang berubah (peran/cakupan/kunci publik),
permintaan tertunda sebelumnya digantikan dan `requestId` baru dibuat.
Jalankan kembali `openclaw devices list` sebelum memberikan persetujuan.

### Status identitas dan pemasangan

Node headless memisahkan ID instans kliennya dari identitas perangkat bertanda tangan
yang digunakan Gateway untuk pemasangan dan perutean. Status ini berada di direktori
status OpenClaw (`~/.openclaw` secara default, atau `$OPENCLAW_STATE_DIR`
jika diatur):

| Status                                        | Tujuan                                                                                                                          |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `state/openclaw.sqlite` (`node_host_config`) | ID instans klien, nama tampilan, dan metadata koneksi Gateway. Klien mengirim ID ini sebagai `instanceId`.                     |
| `identity/device.json`                       | Pasangan kunci Ed25519 bertanda tangan dan ID perangkat turunannya. Untuk koneksi bertanda tangan, ID perangkat ini adalah ID node yang dirutekan dan identitas pemasangan. |
| `identity/device-auth.json`                  | Token perangkat yang dipasangkan, dengan kunci berupa ID perangkat kriptografis dan peran.                                                                 |

`--node-id` hanya mengubah ID instans klien dalam status SQLite bersama. Perintah ini
tidak mengubah ID perangkat kriptografis atau menghapus autentikasi pemasangan. Memigrasikan
`node.json` yang telah dihentikan dengan `openclaw doctor --fix` juga tidak mengatur ulang pemasangan. Untuk
mencabut dan memasangkan ulang node:

1. Pada Gateway, jalankan `openclaw nodes remove --node <id|name|ip>`.
2. Pada node, mulai ulang layanan yang terinstal dengan `openclaw node restart`, atau
   hentikan dan jalankan kembali perintah latar depan `openclaw node run`. Ini memulai
   alur pemasangan perangkat. Jika `openclaw devices list` tidak menampilkan permintaan
   dan node melaporkan `AUTH_DEVICE_TOKEN_MISMATCH`, mulai ulang atau jalankan kembali sekali
   lagi. Percobaan yang ditolak akan menghapus token lokal yang kini telah dicabut; percobaan
   berikutnya dapat meminta pemasangan.
3. Pada Gateway, jalankan `openclaw devices list`, lalu
   `openclaw devices approve <deviceRequestId>`.
4. Mulai ulang atau jalankan kembali node sekali lagi. Klien yang dijeda untuk pemasangan tidak melanjutkan
   secara otomatis setelah persetujuan; koneksi ulang ini membuat permintaan
   cakupan perintah yang terpisah.
5. Pada Gateway, jalankan `openclaw nodes pending`, lalu
   `openclaw nodes approve <nodeRequestId>`.

Kedua ID permintaan tersebut berbeda. Kebijakan CIDR tepercaya yang berlaku dapat
menyetujui secara otomatis langkah pemasangan perangkat pertama kali; persetujuan cakupan perintah tetap
merupakan pemeriksaan terpisah.

Rilis OpenClaw lama menyimpan status host node di `node.json` dan dapat meninggalkan
bidang `token` yang usang di sana. Hentikan host node dan jalankan `openclaw doctor --fix`
satu kali; Doctor mengimpor bidang identitas dan koneksi yang didukung ke SQLite,
membuang bidang token yang tidak digunakan, memverifikasi baris, dan menghapus berkas yang telah dihentikan.
Perintah node normal gagal secara tertutup dengan instruksi perbaikan ini selama berkas atau
klaim Doctor yang terinterupsi masih ada. Jaga kedua berkas di bawah `identity/` tetap privat;
berkas tersebut berisi pasangan kunci perangkat dan token autentikasi.

## Persetujuan exec

`system.run` dikontrol oleh persetujuan exec lokal:

- `$OPENCLAW_STATE_DIR/exec-approvals.json`, atau
  `~/.openclaw/exec-approvals.json` jika variabel tidak diatur
- [Persetujuan exec](/id/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (edit dari Gateway)

Untuk exec node asinkron yang disetujui, OpenClaw menyiapkan `systemRunPlan` kanonis
sebelum meminta persetujuan. Penerusan `system.run` yang kemudian disetujui menggunakan kembali
rencana tersimpan tersebut, sehingga perubahan pada bidang perintah/cwd/sesi setelah permintaan
persetujuan dibuat akan ditolak alih-alih mengubah apa yang dijalankan node.

## Terkait

- [Referensi CLI](/id/cli)
- [Node](/id/nodes)
