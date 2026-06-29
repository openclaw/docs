---
read_when:
    - Anda ingin menghubungkan OpenClaw ke LINE
    - Anda perlu mengonfigurasi Webhook LINE dan kredensial
    - Anda memerlukan parameter pesan khusus LINE
summary: Penyiapan, konfigurasi, dan penggunaan Plugin LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-06-28T22:33:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9a6c76ea64b92b76dd2f6ab0d9fff7eb316e1940ba660d65262307796b5a6abc
    source_path: ru/channels/line.md
    workflow: 16
---

LINE terhubung ke OpenClaw melalui LINE Messaging API. Plugin berfungsi sebagai penerima Webhook
di Gateway dan menggunakan channel access token + channel secret Anda untuk
autentikasi.

Status: Plugin yang dapat dimuat. Pesan pribadi, obrolan grup, media, lokasi, pesan Flex,
pesan template, dan balasan cepat didukung. Reaksi dan utas
tidak didukung.

## Instalasi

Instal LINE sebelum mengonfigurasi channel:

```bash
openclaw plugins install @openclaw/line
```

Salinan kerja lokal (saat menjalankan dari repositori git):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Konfigurasi

1. Buat akun LINE Developers dan buka Konsol:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Buat (atau pilih) Penyedia dan tambahkan channel **Messaging API**.
3. Salin **Channel access token** dan **Channel secret** dari pengaturan channel.
4. Aktifkan **Use webhook** di pengaturan Messaging API.
5. Tetapkan URL Webhook untuk endpoint Gateway Anda (HTTPS wajib):

```
https://gateway-host/line/webhook
```

Gateway merespons verifikasi Webhook dari LINE (GET) dan mengakui peristiwa masuk
yang ditandatangani (POST) segera setelah tanda tangan dan payload diverifikasi; pemrosesan
oleh agen berlanjut secara asinkron.
Jika Anda memerlukan jalur khusus, tetapkan `channels.line.webhookPath` atau
`channels.line.accounts.<id>.webhookPath` lalu perbarui URL sesuai dengan itu.

Catatan keamanan:

- Verifikasi tanda tangan LINE bergantung pada isi permintaan (HMAC pada isi mentah), sehingga OpenClaw menerapkan batas ukuran isi yang ketat dan batas waktu sebelum autentikasi sebelum verifikasi.
- OpenClaw memproses peristiwa Webhook dari byte permintaan mentah yang telah diverifikasi. Nilai `req.body` yang diubah oleh middleware di upstream diabaikan untuk menjaga integritas tanda tangan.

## Konfigurasi

Konfigurasi minimal:

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "pairing",
    },
  },
}
```

Konfigurasi pesan pribadi terbuka:

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "open",
      allowFrom: ["*"],
    },
  },
}
```

Variabel lingkungan (hanya akun default):

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

File token/secret:

```json5
{
  channels: {
    line: {
      tokenFile: "/path/to/line-token.txt",
      secretFile: "/path/to/line-secret.txt",
    },
  },
}
```

`tokenFile` dan `secretFile` harus mengarah ke file biasa. Tautan simbolik ditolak.

Beberapa akun:

```json5
{
  channels: {
    line: {
      accounts: {
        marketing: {
          channelAccessToken: "...",
          channelSecret: "...",
          webhookPath: "/line/marketing",
        },
      },
    },
  },
}
```

## Kontrol Akses

Pesan pribadi secara default memerlukan pemasangan. Pengirim yang tidak dikenal menerima kode pemasangan, dan
pesan mereka diabaikan hingga disetujui.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Daftar izin dan kebijakan:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: ID pengguna LINE yang diizinkan untuk pesan pribadi; `dmPolicy: "open"` memerlukan `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: ID pengguna LINE yang diizinkan untuk grup
- Penggantian per grup: `channels.line.groups.<groupId>.allowFrom`
- Grup akses pengirim statis dapat dirujuk dari `allowFrom`, `groupAllowFrom`, dan `allowFrom` grup melalui `accessGroup:<name>`.
- Catatan runtime: jika `channels.line` tidak ada sepenuhnya, runtime kembali ke `groupPolicy="allowlist"` untuk pemeriksaan grup (meskipun `channels.defaults.groupPolicy` ditetapkan).

ID LINE peka huruf besar-kecil. ID yang valid terlihat seperti ini:

- Pengguna: `U` + 32 karakter heksadesimal
- Grup: `C` + 32 karakter heksadesimal
- Ruang: `R` + 32 karakter heksadesimal

## Perilaku Pesan

- Teks dipecah menjadi potongan berukuran 5000 karakter.
- Pemformatan Markdown dihapus; blok kode dan tabel diubah menjadi kartu Flex
  jika memungkinkan.
- Respons streaming dibuffer; LINE menerima potongan lengkap dengan animasi pemuatan
  saat agen berjalan.
- Unduhan media dibatasi oleh `channels.line.mediaMaxMb` (default 10).
- Media masuk disimpan di `~/.openclaw/media/inbound/` sebelum diteruskan
  ke agen, sesuai dengan penyimpanan media bersama yang digunakan oleh Plugin
  channel bawaan lainnya.

## Data Channel (Pesan Lanjutan)

Gunakan `channelData.line` untuk mengirim balasan cepat, lokasi, kartu Flex, atau pesan
template.

```json5
{
  text: "Here you go",
  channelData: {
    line: {
      quickReplies: ["Status", "Help"],
      location: {
        title: "Office",
        address: "123 Main St",
        latitude: 35.681236,
        longitude: 139.767125,
      },
      flexMessage: {
        altText: "Status card",
        contents: {
          /* Flex payload */
        },
      },
      templateMessage: {
        type: "confirm",
        text: "Proceed?",
        confirmLabel: "Yes",
        confirmData: "yes",
        cancelLabel: "No",
        cancelData: "no",
      },
    },
  },
}
```

Plugin LINE juga dilengkapi perintah `/card` untuk preset pesan Flex:

```
/card info "Welcome" "Thanks for joining!"
```

## Dukungan ACP

LINE mendukung pengikatan percakapan ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` mengikat obrolan LINE saat ini ke sesi ACP tanpa membuat utas turunan.
- Pengikatan ACP yang dikonfigurasi dan sesi ACP aktif yang terikat ke percakapan bekerja di LINE sama seperti di channel percakapan lainnya.

Lihat [agen ACP](/id/tools/acp-agents) untuk detail.

## Media Keluar

Plugin LINE mendukung pengiriman gambar, video, dan file audio melalui alat pesan agen. Media dikirim melalui jalur pengiriman khusus LINE dengan penanganan pratinjau dan pelacakan yang sesuai:

- **Gambar**: dikirim sebagai pesan gambar LINE dengan pembuatan pratinjau otomatis.
- **Video**: dikirim dengan penanganan pratinjau dan jenis konten secara eksplisit.
- **Audio**: dikirim sebagai pesan audio LINE.

URL media keluar harus berupa URL HTTPS publik. OpenClaw memeriksa nama host target sebelum meneruskan URL ke LINE dan menolak local loopback, link-local, serta target di jaringan privat.

Pengiriman media umum kembali ke rute khusus gambar yang ada ketika jalur khusus LINE tidak tersedia.

## Pemecahan Masalah

- **Verifikasi Webhook gagal:** pastikan URL Webhook menggunakan HTTPS dan
  `channelSecret` cocok dengan konsol LINE.
- **Tidak ada peristiwa masuk:** pastikan jalur Webhook cocok dengan `channels.line.webhookPath`
  dan Gateway dapat dijangkau dari LINE.
- **Kesalahan unduhan media:** tingkatkan `channels.line.mediaMaxMb` jika media melebihi
  batas default.

## Lihat Juga

- [Ikhtisar channel](/id/channels) — semua channel yang didukung
- [Pemasangan](/id/channels/pairing) — autentikasi pesan pribadi dan alur pemasangan
- [Grup](/id/channels/groups) — perilaku obrolan grup dan pembatasan berdasarkan sebutan
- [Perutean channel](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) — model akses dan penguatan keamanan
