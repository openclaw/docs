---
read_when:
    - Anda ingin menghubungkan OpenClaw ke WeChat atau Weixin
    - Anda sedang memasang atau memecahkan masalah Plugin kanal openclaw-weixin
    - Anda perlu memahami cara plugin saluran eksternal berjalan bersama Gateway
summary: Penyiapan kanal WeChat melalui plugin eksternal openclaw-weixin
title: WeChat
x-i18n:
    generated_at: "2026-07-12T14:01:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 98faf95f9fb76deedb7df9adf3092083722a77bdd793de98c41a6f715cc0d14a
    source_path: channels/wechat.md
    workflow: 16
---

OpenClaw terhubung ke WeChat melalui plugin saluran eksternal Tencent
`@tencent-weixin/openclaw-weixin`.

Status: plugin eksternal, dipelihara oleh tim Tencent Weixin. Percakapan langsung dan
media didukung. Percakapan grup tidak dinyatakan didukung oleh metadata kapabilitas
plugin (plugin hanya mendeklarasikan percakapan langsung).

## Penamaan

- **WeChat** adalah nama yang ditampilkan kepada pengguna dalam dokumentasi ini.
- **Weixin** adalah nama yang digunakan oleh paket Tencent dan id plugin.
- `openclaw-weixin` adalah id saluran OpenClaw (`weixin` dan `wechat` berfungsi sebagai alias).
- `@tencent-weixin/openclaw-weixin` adalah paket npm.

Gunakan `openclaw-weixin` dalam perintah CLI dan jalur konfigurasi.

## Cara kerjanya

Kode WeChat tidak berada di repositori inti OpenClaw. OpenClaw menyediakan
kontrak plugin saluran generik, sedangkan plugin eksternal menyediakan runtime
khusus WeChat:

1. `openclaw plugins install` menginstal `@tencent-weixin/openclaw-weixin`.
2. Gateway menemukan manifes plugin dan memuat titik masuk plugin.
3. Plugin mendaftarkan id saluran `openclaw-weixin`.
4. `openclaw channels login --channel openclaw-weixin` memulai proses masuk dengan QR.
5. Plugin menyimpan kredensial akun di bawah direktori status OpenClaw
   (`~/.openclaw` secara default).
6. Saat Gateway dimulai, plugin memulai pemantau Weixin untuk setiap
   akun yang dikonfigurasi.
7. Pesan WeChat yang masuk dinormalisasi melalui kontrak saluran, dirutekan ke
   agen OpenClaw yang dipilih, dan dikirim kembali melalui jalur keluar plugin.

Pemisahan tersebut penting: inti OpenClaw tetap tidak bergantung pada saluran tertentu. Proses masuk WeChat,
panggilan API Tencent iLink, pengunggahan/pengunduhan media, token konteks, dan
pemantauan akun dikelola oleh plugin eksternal.

## Instalasi

Instalasi cepat:

```bash
npx -y @tencent-weixin/openclaw-weixin-cli install
```

Instalasi manual:

```bash
openclaw plugins install "@tencent-weixin/openclaw-weixin"
openclaw config set plugins.entries.openclaw-weixin.enabled true
```

Mulai ulang Gateway setelah instalasi:

```bash
openclaw gateway restart
```

## Masuk

Jalankan proses masuk dengan QR pada mesin yang sama dengan mesin yang menjalankan Gateway:

```bash
openclaw channels login --channel openclaw-weixin
```

Pindai kode QR dengan WeChat di ponsel Anda dan konfirmasikan proses masuk. Plugin menyimpan
token akun secara lokal setelah pemindaian berhasil.

Untuk menambahkan akun WeChat lain, jalankan kembali perintah masuk yang sama. Untuk beberapa
akun, pisahkan sesi pesan langsung berdasarkan akun, saluran, dan pengirim:

```bash
openclaw config set session.dmScope per-account-channel-peer
```

## Kontrol akses

Pesan langsung menggunakan model pemasangan dan daftar izin OpenClaw yang lazim untuk plugin
saluran.

Setujui pengirim baru:

```bash
openclaw pairing list openclaw-weixin
openclaw pairing approve openclaw-weixin <CODE>
```

Untuk model kontrol akses selengkapnya, lihat [Pemasangan](/id/channels/pairing).

## Kompatibilitas

Plugin memeriksa versi OpenClaw host saat dimulai.

| Lini plugin | Versi OpenClaw                                                   | Tag npm  |
| ----------- | ---------------------------------------------------------------- | -------- |
| `2.x`       | `>=2026.5.12` (2.4.6 saat ini; 2.x awal menerima `>=2026.3.22`) | `latest` |
| `1.x`       | `>=2026.1.0 <2026.3.22`                                         | `legacy` |

Jika plugin melaporkan bahwa versi OpenClaw Anda terlalu lama, perbarui
OpenClaw atau instal lini plugin lama:

```bash
openclaw plugins install @tencent-weixin/openclaw-weixin@legacy
```

## Proses sidecar

Plugin WeChat dapat menjalankan proses pembantu di samping Gateway saat memantau
API Tencent iLink. Dalam isu #68451, jalur pembantu tersebut mengungkap bug pada
pembersihan Gateway usang generik milik OpenClaw: proses anak dapat mencoba membersihkan proses
Gateway induk, sehingga menyebabkan siklus mulai ulang di bawah pengelola proses seperti systemd.

Pembersihan saat OpenClaw dimulai saat ini mengecualikan proses aktif dan proses-proses leluhurnya,
sehingga proses pembantu saluran tidak dapat menghentikan Gateway yang menjalankannya. Perbaikan ini
bersifat generik; ini bukan jalur khusus WeChat dalam inti.

## Pemecahan masalah

Periksa instalasi dan status:

```bash
openclaw plugins list
openclaw channels status --probe
openclaw --version
```

Jika saluran ditampilkan sebagai terinstal tetapi tidak terhubung, pastikan plugin
diaktifkan lalu mulai ulang:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled true
openclaw gateway restart
```

Jika Gateway terus dimulai ulang setelah WeChat diaktifkan, perbarui OpenClaw dan
plugin:

```bash
npm view @tencent-weixin/openclaw-weixin version
openclaw plugins install "@tencent-weixin/openclaw-weixin" --force
openclaw gateway restart
```

Jika saat dimulai muncul laporan bahwa paket plugin yang terinstal `requires compiled runtime
output for TypeScript entry`, paket npm tersebut diterbitkan tanpa berkas runtime
JavaScript terkompilasi yang diperlukan OpenClaw. Perbarui/instal ulang setelah penerbit
plugin merilis paket yang telah diperbaiki, atau nonaktifkan/hapus instalasi plugin untuk sementara.

Penonaktifan sementara:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled false
openclaw gateway restart
```

## Dokumentasi terkait

- Ringkasan saluran: [Saluran Percakapan](/id/channels)
- Pemasangan: [Pemasangan](/id/channels/pairing)
- Perutean saluran: [Perutean Saluran](/id/channels/channel-routing)
- Arsitektur plugin: [Arsitektur Plugin](/id/plugins/architecture)
- SDK plugin saluran: [SDK Plugin Saluran](/id/plugins/sdk-channel-plugins)
- Paket eksternal: [@tencent-weixin/openclaw-weixin](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin)
