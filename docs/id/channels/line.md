---
read_when:
    - Anda ingin menghubungkan OpenClaw ke LINE
    - Anda perlu menyiapkan Webhook LINE dan kredensial
    - Anda menginginkan opsi pesan khusus LINE
summary: Penyiapan, konfigurasi, dan penggunaan Plugin LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-07-12T13:59:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ee5931c2bfca4a67a8b390f300907cd31a074988b10c6c0540444cff0bfde334
    source_path: channels/line.md
    workflow: 16
---

LINE terhubung ke OpenClaw melalui LINE Messaging API. Plugin ini berjalan sebagai penerima Webhook
pada Gateway dan menggunakan token akses saluran + rahasia saluran Anda untuk
autentikasi.

Status: Plugin resmi, diinstal secara terpisah. Pesan langsung, obrolan grup, media,
lokasi, pesan Flex, pesan templat, dan balasan cepat didukung.
Reaksi dan utas tidak didukung.

## Instalasi

Instal LINE sebelum mengonfigurasi saluran:

```bash
openclaw plugins install @openclaw/line
```

Checkout lokal (saat menjalankan dari repositori git):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Penyiapan

1. Buat akun LINE Developers dan buka Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Buat (atau pilih) Provider dan tambahkan saluran **Messaging API**.
3. Salin **Channel access token** dan **Channel secret** dari pengaturan saluran.
4. Aktifkan **Use webhook** di pengaturan Messaging API.
5. Atur URL Webhook ke endpoint Gateway Anda (HTTPS wajib):

```text
https://gateway-host/line/webhook
```

Gateway menjawab verifikasi Webhook LINE (GET) dan langsung mengakui peristiwa
masuk yang ditandatangani (POST) setelah validasi tanda tangan dan payload; pemrosesan
agen berlanjut secara asinkron.
Jika memerlukan jalur khusus, atur `channels.line.webhookPath` atau
`channels.line.accounts.<id>.webhookPath`, lalu perbarui URL sebagaimana mestinya.

Catatan keamanan:

- Verifikasi tanda tangan LINE bergantung pada isi body (HMAC atas body mentah), sehingga OpenClaw menerapkan batas body praautentikasi yang ketat (64 KB) dan batas waktu pembacaan sebelum verifikasi.
- OpenClaw memproses peristiwa Webhook dari byte permintaan mentah yang telah diverifikasi. Nilai `req.body` yang diubah oleh middleware hulu diabaikan demi menjaga integritas tanda tangan.

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

Konfigurasi pesan langsung publik:

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

Berkas token/rahasia:

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

`tokenFile` dan `secretFile` harus menunjuk ke berkas biasa. Tautan simbolis ditolak.
Nilai konfigurasi sebaris lebih diprioritaskan daripada berkas; variabel lingkungan menjadi pilihan terakhir untuk akun default.

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

## Kontrol akses

Pesan langsung secara default menggunakan pemasangan. Pengirim yang tidak dikenal menerima kode pemasangan dan
pesan mereka diabaikan sampai disetujui:

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Daftar izin dan kebijakan:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled` (default `pairing`)
- `channels.line.allowFrom`: ID pengguna LINE yang masuk daftar izin untuk pesan langsung; `dmPolicy: "open"` memerlukan `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled` (default `allowlist`)
- `channels.line.groupAllowFrom`: ID pengguna LINE yang masuk daftar izin untuk grup
- Penggantian per grup: `channels.line.groups.<groupId>.allowFrom` (beserta `enabled`, `requireMention`, `systemPrompt`, `skills`)
- Grup akses pengirim statis dapat dirujuk dari `allowFrom`, `groupAllowFrom`, dan `allowFrom` per grup menggunakan `accessGroup:<name>`; lihat [Grup akses](/id/channels/access-groups).
- Catatan waktu proses: jika `channels.line` sama sekali tidak ada, waktu proses menggunakan `groupPolicy="allowlist"` sebagai nilai cadangan untuk pemeriksaan grup (meskipun `channels.defaults.groupPolicy` telah diatur).

ID LINE peka huruf besar-kecil. ID yang valid berbentuk:

- Pengguna: `U` + 32 karakter heksadesimal
- Grup: `C` + 32 karakter heksadesimal
- Ruang: `R` + 32 karakter heksadesimal

## Perilaku pesan

- Teks dibagi menjadi potongan sepanjang 5.000 karakter.
- Pemformatan Markdown dihapus; blok kode dan tabel dikonversi menjadi kartu Flex
  jika memungkinkan.
- Respons streaming ditampung; LINE menerima potongan lengkap dengan animasi
  pemuatan selama agen bekerja.
- Unduhan media dibatasi oleh `channels.line.mediaMaxMb` (default 10).
- Media masuk disimpan di `~/.openclaw/media/inbound/` sebelum diteruskan
  kepada agen, sesuai dengan penyimpanan media bersama yang digunakan Plugin saluran lain.

## Data saluran (pesan kaya)

Gunakan `channelData.line` untuk mengirim balasan cepat, lokasi, kartu Flex, atau pesan
templat.

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
        contents: {/* Flex payload */},
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

Plugin LINE juga menyertakan perintah `/card` untuk preset pesan Flex:

```text
/card info "Welcome" "Thanks for joining!"
```

## Dukungan ACP

LINE mendukung pengikatan percakapan ACP (Protokol Komunikasi Agen):

- `/acp spawn <agent> --bind here` mengikat obrolan LINE saat ini ke sesi ACP tanpa membuat utas anak.
- Pengikatan ACP yang dikonfigurasi dan sesi ACP aktif yang terikat pada percakapan berfungsi di LINE seperti pada saluran percakapan lainnya.

Lihat [Agen ACP](/id/tools/acp-agents) untuk detail.

## Media keluar

Plugin LINE mengirim gambar, video, dan audio melalui alat pesan agen:

- **Gambar**: dikirim sebagai pesan gambar LINE; gambar pratinjau secara default menggunakan URL media.
- **Video**: memerlukan gambar pratinjau; atur `channelData.line.previewImageUrl` ke URL gambar.
- **Audio**: dikirim sebagai pesan audio LINE; durasi secara default adalah 60 detik kecuali `channelData.line.durationMs` diatur.

Jenis media diambil dari `channelData.line.mediaKind` jika diatur; jika tidak, jenis tersebut disimpulkan
dari opsi LINE lainnya atau akhiran berkas URL, dengan gambar sebagai pilihan cadangan.

URL media keluar harus berupa URL HTTPS publik dengan panjang maksimal 2.000 karakter. OpenClaw
memvalidasi nama host tujuan sebelum menyerahkan URL kepada LINE dan menolak tujuan
local loopback, link-local, dan jaringan privat.

Pengiriman media generik tanpa opsi khusus LINE menggunakan rute gambar.

## Pemecahan masalah

- **Verifikasi Webhook gagal:** pastikan URL Webhook menggunakan HTTPS dan
  `channelSecret` cocok dengan Console LINE.
- **Tidak ada peristiwa masuk:** pastikan jalur Webhook cocok dengan `channels.line.webhookPath`
  dan Gateway dapat dijangkau dari LINE.
- **Kesalahan pengunduhan media:** naikkan `channels.line.mediaMaxMb` jika ukuran media melebihi
  batas default.

## Terkait

- [Ikhtisar saluran](/id/channels) — semua saluran yang didukung
- [Pemasangan](/id/channels/pairing) — autentikasi pesan langsung dan alur pemasangan
- [Grup](/id/channels/groups) — perilaku obrolan grup dan pembatasan berdasarkan penyebutan
- [Perutean saluran](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) — model akses dan penguatan
