---
read_when:
    - Anda ingin menghubungkan OpenClaw ke LINE
    - Anda perlu mengonfigurasi Webhook LINE dan kredensial
    - Anda memerlukan parameter pesan khusus untuk LINE
summary: Pengaturan, konfigurasi, dan penggunaan Plugin LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-06-28T20:44:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9a6c76ea64b92b76dd2f6ab0d9fff7eb316e1940ba660d65262307796b5a6abc
    source_path: ru/channels/line.md
    workflow: 16
---

LINE terhubung ke OpenClaw melalui LINE Messaging API. Plugin bekerja sebagai penerima Webhook
di Gateway dan menggunakan channel access token + channel secret Anda untuk
autentikasi.

Status: Plugin yang dapat dimuat. Pesan pribadi, chat grup, media, lokasi, pesan Flex,
pesan template, dan balasan cepat didukung. Reaksi dan thread
tidak didukung.

## Instalasi

Instal LINE sebelum mengonfigurasi channel:

```bash
openclaw plugins install @openclaw/line
```

Salinan kerja lokal (saat dijalankan dari repositori git):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Konfigurasi Awal

1. Buat akun LINE Developers dan buka Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Buat (atau pilih) Provider dan tambahkan channel **Messaging API**.
3. Salin **Channel access token** dan **Channel secret** dari pengaturan channel.
4. Aktifkan **Use webhook** di pengaturan Messaging API.
5. Tetapkan URL Webhook untuk endpoint Gateway Anda (HTTPS diperlukan):

```
https://gateway-host/line/webhook
```

Gateway merespons verifikasi Webhook dari LINE (GET) dan mengakui event masuk yang ditandatangani
(POST) segera setelah verifikasi tanda tangan dan payload; pemrosesan
oleh agen berlanjut secara asinkron.
Jika Anda memerlukan path kustom, tetapkan `channels.line.webhookPath` atau
`channels.line.accounts.<id>.webhookPath` dan perbarui URL sesuai kebutuhan.

Catatan keamanan:

- Verifikasi tanda tangan LINE bergantung pada body permintaan (HMAC atas body mentah), sehingga OpenClaw menerapkan batas ukuran body dan timeout praautentikasi yang ketat sebelum verifikasi.
- OpenClaw memproses event Webhook dari byte permintaan mentah yang telah diverifikasi. Nilai `req.body` yang diubah oleh middleware hulu diabaikan untuk menjaga integritas tanda tangan.

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

`tokenFile` dan `secretFile` harus mengarah ke file biasa. Tautan simbolis ditolak.

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

Pesan pribadi secara default memerlukan pairing. Pengirim yang tidak dikenal menerima kode pairing, dan
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
- Override per grup: `channels.line.groups.<groupId>.allowFrom`
- Grup akses pengirim statis dapat direferensikan dari `allowFrom`, `groupAllowFrom`, dan `allowFrom` grup melalui `accessGroup:<name>`.
- Catatan runtime: jika `channels.line` sepenuhnya tidak ada, runtime kembali ke `groupPolicy="allowlist"` untuk pemeriksaan grup (meskipun `channels.defaults.groupPolicy` ditetapkan).

ID LINE peka huruf besar/kecil. ID yang valid berbentuk seperti ini:

- Pengguna: `U` + 32 karakter heksadesimal
- Grup: `C` + 32 karakter heksadesimal
- Ruang: `R` + 32 karakter heksadesimal

## Perilaku Pesan

- Teks dipecah menjadi fragmen 5000 karakter.
- Pemformatan Markdown dihapus; blok kode dan tabel dikonversi menjadi Flex
  cards jika memungkinkan.
- Respons streaming dibuffer; LINE menerima fragmen lengkap dengan animasi pemuatan
  saat agen berjalan.
- Unduhan media dibatasi oleh `channels.line.mediaMaxMb` (default 10).
- Media masuk disimpan di `~/.openclaw/media/inbound/` sebelum diteruskan
  ke agen, sesuai dengan penyimpanan media umum yang digunakan oleh Plugin
  channel bawaan lainnya.

## Data Channel (Pesan Lanjutan)

Gunakan `channelData.line` untuk mengirim balasan cepat, lokasi, Flex cards, atau pesan
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

Plugin LINE juga menyertakan perintah `/card` untuk preset pesan Flex:

```
/card info "Welcome" "Thanks for joining!"
```

## Dukungan ACP

LINE mendukung binding percakapan ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` mengikat chat LINE saat ini ke sesi ACP tanpa membuat thread turunan.
- Binding ACP yang dikonfigurasi dan sesi ACP aktif yang terikat ke percakapan bekerja di LINE seperti di channel percakapan lainnya.

Lihat [agen ACP](/id/tools/acp-agents) untuk detail.

## Media Keluar

Plugin LINE mendukung pengiriman gambar, video, dan file audio melalui alat pesan agen. Media dikirim melalui jalur pengiriman khusus LINE dengan penanganan pratinjau dan pelacakan yang sesuai:

- **Gambar**: dikirim sebagai pesan gambar LINE dengan pembuatan pratinjau otomatis.
- **Video**: dikirim dengan penanganan pratinjau dan tipe konten eksplisit.
- **Audio**: dikirim sebagai pesan audio LINE.

URL media keluar harus berupa URL HTTPS publik. OpenClaw memvalidasi nama host tujuan sebelum meneruskan URL ke LINE dan menolak local loopback, link-local, serta target jaringan privat.

Pengiriman media umum kembali ke rute khusus gambar yang ada saat jalur khusus LINE tidak tersedia.

## Pemecahan Masalah

- **Verifikasi Webhook gagal:** pastikan URL Webhook menggunakan HTTPS dan
  `channelSecret` cocok dengan console LINE.
- **Tidak ada event masuk:** pastikan path Webhook cocok dengan `channels.line.webhookPath`
  dan Gateway dapat diakses dari LINE.
- **Kesalahan unduhan media:** naikkan `channels.line.mediaMaxMb` jika media melebihi
  batas default.

## Lihat Juga

- [Ringkasan channel](/id/channels) — semua channel yang didukung
- [Pairing](/id/channels/pairing) — autentikasi pesan pribadi dan alur pairing
- [Grup](/id/channels/groups) — perilaku chat grup dan pembatasan berdasarkan mention
- [Routing channel](/id/channels/channel-routing) — routing sesi untuk pesan
- [Keamanan](/id/gateway/security) — model akses dan penguatan keamanan
