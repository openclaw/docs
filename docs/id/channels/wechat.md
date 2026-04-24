---
read_when:
    - Anda ingin menghubungkan OpenClaw ke WeChat atau Weixin
    - Anda sedang memasang atau memecahkan masalah plugin channel openclaw-weixin
    - Anda perlu memahami bagaimana plugin channel eksternal berjalan berdampingan dengan Gateway
summary: Penyiapan channel WeChat melalui plugin eksternal openclaw-weixin
title: WeChat
x-i18n:
    generated_at: "2026-04-24T09:00:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: ea7c815a364c2ae087041bf6de5b4182334c67377e18b9bedfa0f9d949afc09c
    source_path: channels/wechat.md
    workflow: 15
---

OpenClaw terhubung ke WeChat melalui plugin channel eksternal Tencent
`@tencent-weixin/openclaw-weixin`.

Status: plugin eksternal. Chat langsung dan media didukung. Chat grup tidak
diiklankan oleh metadata kapabilitas plugin saat ini.

## Penamaan

- **WeChat** adalah nama yang ditampilkan kepada pengguna dalam dokumentasi ini.
- **Weixin** adalah nama yang digunakan oleh paket Tencent dan oleh id plugin.
- `openclaw-weixin` adalah id channel OpenClaw.
- `@tencent-weixin/openclaw-weixin` adalah paket npm.

Gunakan `openclaw-weixin` dalam perintah CLI dan path config.

## Cara kerjanya

Kode WeChat tidak berada di repo inti OpenClaw. OpenClaw menyediakan kontrak plugin
channel generik, dan plugin eksternal menyediakan runtime khusus
WeChat:

1. `openclaw plugins install` memasang `@tencent-weixin/openclaw-weixin`.
2. Gateway menemukan manifest plugin dan memuat entrypoint plugin.
3. Plugin mendaftarkan id channel `openclaw-weixin`.
4. `openclaw channels login --channel openclaw-weixin` memulai login QR.
5. Plugin menyimpan kredensial akun di bawah direktori status OpenClaw.
6. Saat Gateway dimulai, plugin memulai monitor Weixin untuk setiap
   akun yang dikonfigurasi.
7. Pesan WeChat masuk dinormalisasi melalui kontrak channel, diarahkan ke
   agen OpenClaw yang dipilih, lalu dikirim kembali melalui path keluar plugin.

Pemisahan itu penting: inti OpenClaw harus tetap agnostik terhadap channel. Login WeChat,
panggilan API Tencent iLink, unggah/unduh media, token konteks, dan pemantauan akun
dimiliki oleh plugin eksternal.

## Pasang

Pemasangan cepat:

```bash
npx -y @tencent-weixin/openclaw-weixin-cli install
```

Pemasangan manual:

```bash
openclaw plugins install "@tencent-weixin/openclaw-weixin"
openclaw config set plugins.entries.openclaw-weixin.enabled true
```

Mulai ulang Gateway setelah pemasangan:

```bash
openclaw gateway restart
```

## Login

Jalankan login QR pada mesin yang sama yang menjalankan Gateway:

```bash
openclaw channels login --channel openclaw-weixin
```

Pindai kode QR dengan WeChat di ponsel Anda dan konfirmasikan login. Plugin menyimpan
token akun secara lokal setelah pemindaian berhasil.

Untuk menambahkan akun WeChat lain, jalankan perintah login yang sama lagi. Untuk beberapa
akun, isolasikan sesi pesan langsung berdasarkan akun, channel, dan pengirim:

```bash
openclaw config set session.dmScope per-account-channel-peer
```

## Kontrol akses

Pesan langsung menggunakan model pairing dan allowlist OpenClaw normal untuk plugin
channel.

Setujui pengirim baru:

```bash
openclaw pairing list openclaw-weixin
openclaw pairing approve openclaw-weixin <CODE>
```

Untuk model kontrol akses lengkap, lihat [Pairing](/id/channels/pairing).

## Kompatibilitas

Plugin memeriksa versi host OpenClaw saat startup.

| Baris plugin | Versi OpenClaw          | Tag npm  |
| ------------ | ----------------------- | -------- |
| `2.x`        | `>=2026.3.22`           | `latest` |
| `1.x`        | `>=2026.1.0 <2026.3.22` | `legacy` |

Jika plugin melaporkan bahwa versi OpenClaw Anda terlalu lama, perbarui
OpenClaw atau pasang baris plugin legacy:

```bash
openclaw plugins install @tencent-weixin/openclaw-weixin@legacy
```

## Proses sidecar

Plugin WeChat dapat menjalankan pekerjaan pembantu di samping Gateway saat memantau
API Tencent iLink. Dalam issue #68451, path pembantu itu mengekspos bug dalam
pembersihan Gateway usang generik OpenClaw: sebuah proses anak dapat mencoba membersihkan proses
Gateway induk, menyebabkan loop restart di bawah pengelola proses seperti systemd.

Pembersihan startup OpenClaw saat ini mengecualikan proses saat ini dan leluhurnya,
jadi pembantu channel tidak boleh mematikan Gateway yang meluncurkannya. Perbaikan ini
bersifat generik; ini bukan path khusus WeChat di inti.

## Pemecahan masalah

Periksa pemasangan dan status:

```bash
openclaw plugins list
openclaw channels status --probe
openclaw --version
```

Jika channel terlihat terpasang tetapi tidak terhubung, pastikan plugin
diaktifkan dan mulai ulang:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled true
openclaw gateway restart
```

Jika Gateway mulai ulang berulang kali setelah mengaktifkan WeChat, perbarui OpenClaw dan
plugin:

```bash
npm view @tencent-weixin/openclaw-weixin version
openclaw plugins install "@tencent-weixin/openclaw-weixin" --force
openclaw gateway restart
```

Nonaktifkan sementara:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled false
openclaw gateway restart
```

## Dokumen terkait

- Ikhtisar channel: [Chat Channels](/id/channels)
- Pairing: [Pairing](/id/channels/pairing)
- Perutean channel: [Channel Routing](/id/channels/channel-routing)
- Arsitektur plugin: [Arsitektur Plugin](/id/plugins/architecture)
- SDK plugin channel: [SDK Plugin Channel](/id/plugins/sdk-channel-plugins)
- Paket eksternal: [@tencent-weixin/openclaw-weixin](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin)
