---
read_when:
    - Anda ingin menghubungkan OpenClaw ke WeChat atau Weixin
    - Anda sedang menginstal atau memecahkan masalah Plugin saluran openclaw-weixin
    - Anda perlu memahami bagaimana Plugin saluran eksternal berjalan berdampingan dengan Gateway
summary: Penyiapan saluran WeChat melalui Plugin eksternal openclaw-weixin
title: WeChat
x-i18n:
    generated_at: "2026-05-06T09:04:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 803557a4fc92056c63053a3388100a451b2d85d4e892877707b3c2e3a677c0b0
    source_path: channels/wechat.md
    workflow: 16
---

OpenClaw terhubung ke WeChat melalui Plugin channel eksternal
`@tencent-weixin/openclaw-weixin` dari Tencent.

Status: Plugin eksternal. Chat langsung dan media didukung. Chat grup tidak
diiklankan oleh metadata kemampuan Plugin saat ini.

## Penamaan

- **WeChat** adalah nama yang ditampilkan kepada pengguna dalam dokumen ini.
- **Weixin** adalah nama yang digunakan oleh paket Tencent dan oleh id Plugin.
- `openclaw-weixin` adalah id channel OpenClaw.
- `@tencent-weixin/openclaw-weixin` adalah paket npm.

Gunakan `openclaw-weixin` dalam perintah CLI dan path konfigurasi.

## Cara kerjanya

Kode WeChat tidak berada di repo inti OpenClaw. OpenClaw menyediakan kontrak
Plugin channel generik, dan Plugin eksternal menyediakan runtime khusus WeChat:

1. `openclaw plugins install` menginstal `@tencent-weixin/openclaw-weixin`.
2. Gateway menemukan manifes Plugin dan memuat entrypoint Plugin.
3. Plugin mendaftarkan id channel `openclaw-weixin`.
4. `openclaw channels login --channel openclaw-weixin` memulai login QR.
5. Plugin menyimpan kredensial akun di bawah direktori status OpenClaw.
6. Saat Gateway dimulai, Plugin memulai monitor Weixin untuk setiap
   akun yang dikonfigurasi.
7. Pesan WeChat masuk dinormalisasi melalui kontrak channel, dirutekan ke
   agen OpenClaw yang dipilih, dan dikirim kembali melalui jalur keluar Plugin.

Pemisahan itu penting: inti OpenClaw harus tetap agnostik terhadap channel. Login WeChat,
panggilan API Tencent iLink, unggah/unduh media, token konteks, dan pemantauan akun
dimiliki oleh Plugin eksternal.

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

## Login

Jalankan login QR pada mesin yang sama dengan yang menjalankan Gateway:

```bash
openclaw channels login --channel openclaw-weixin
```

Pindai kode QR dengan WeChat di ponsel Anda dan konfirmasi login. Plugin menyimpan
token akun secara lokal setelah pemindaian berhasil.

Untuk menambahkan akun WeChat lain, jalankan perintah login yang sama lagi. Untuk beberapa
akun, isolasi sesi pesan langsung berdasarkan akun, channel, dan pengirim:

```bash
openclaw config set session.dmScope per-account-channel-peer
```

## Kontrol akses

Pesan langsung menggunakan model pairing dan allowlist OpenClaw normal untuk Plugin
channel.

Setujui pengirim baru:

```bash
openclaw pairing list openclaw-weixin
openclaw pairing approve openclaw-weixin <CODE>
```

Untuk model kontrol akses lengkap, lihat [Pairing](/id/channels/pairing).

## Kompatibilitas

Plugin memeriksa versi host OpenClaw saat startup.

| Baris Plugin | Versi OpenClaw          | tag npm  |
| ------------ | ----------------------- | -------- |
| `2.x`        | `>=2026.3.22`           | `latest` |
| `1.x`        | `>=2026.1.0 <2026.3.22` | `legacy` |

Jika Plugin melaporkan bahwa versi OpenClaw Anda terlalu lama, perbarui
OpenClaw atau instal baris Plugin legacy:

```bash
openclaw plugins install @tencent-weixin/openclaw-weixin@legacy
```

## Proses sidecar

Plugin WeChat dapat menjalankan pekerjaan helper di samping Gateway saat memantau
API Tencent iLink. Dalam issue #68451, jalur helper tersebut mengekspos bug dalam
pembersihan Gateway usang generik OpenClaw: proses turunan dapat mencoba membersihkan proses
Gateway induk, sehingga menyebabkan loop mulai ulang di bawah process manager seperti systemd.

Pembersihan startup OpenClaw saat ini mengecualikan proses saat ini dan leluhurnya,
sehingga helper channel tidak boleh mematikan Gateway yang meluncurkannya. Perbaikan ini
bersifat generik; ini bukan jalur khusus WeChat di inti.

## Pemecahan masalah

Periksa instalasi dan status:

```bash
openclaw plugins list
openclaw channels status --probe
openclaw --version
```

Jika channel ditampilkan sebagai terinstal tetapi tidak tersambung, konfirmasikan bahwa Plugin
diaktifkan dan mulai ulang:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled true
openclaw gateway restart
```

Jika Gateway mulai ulang berulang kali setelah mengaktifkan WeChat, perbarui OpenClaw dan
Plugin:

```bash
npm view @tencent-weixin/openclaw-weixin version
openclaw plugins install "@tencent-weixin/openclaw-weixin" --force
openclaw gateway restart
```

Jika startup melaporkan bahwa paket Plugin terinstal `requires compiled runtime
output for TypeScript entry`, paket npm dipublikasikan tanpa file runtime
JavaScript terkompilasi yang diperlukan OpenClaw. Perbarui/instal ulang setelah penerbit
Plugin mengirimkan paket yang sudah diperbaiki, atau nonaktifkan/hapus instalasi Plugin untuk sementara.

Nonaktifkan sementara:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled false
openclaw gateway restart
```

## Dokumen terkait

- Ikhtisar channel: [Channel Chat](/id/channels)
- Pairing: [Pairing](/id/channels/pairing)
- Perutean channel: [Perutean Channel](/id/channels/channel-routing)
- Arsitektur Plugin: [Arsitektur Plugin](/id/plugins/architecture)
- SDK Plugin channel: [SDK Plugin Channel](/id/plugins/sdk-channel-plugins)
- Paket eksternal: [@tencent-weixin/openclaw-weixin](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin)
