---
read_when:
    - Anda ingin menghubungkan OpenClaw ke LINE
    - Anda memerlukan penyiapan Webhook LINE + kredensial
    - Anda menginginkan opsi pesan khusus LINE
summary: Penyiapan, konfigurasi, dan penggunaan Plugin LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-06-27T17:11:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c27572d1db71d1f46b4e6ee68aa03bdbec8f90ed7fb0884f0185ea4aa877468a
    source_path: channels/line.md
    workflow: 16
---

LINE terhubung ke OpenClaw melalui LINE Messaging API. Plugin berjalan sebagai penerima Webhook
di Gateway dan menggunakan token akses channel + rahasia channel Anda untuk
autentikasi.

Status: Plugin yang dapat diunduh. Pesan langsung, obrolan grup, media, lokasi, pesan Flex,
pesan template, dan balasan cepat didukung. Reaksi dan utas
tidak didukung.

## Instal

Instal LINE sebelum mengonfigurasi channel:

```bash
openclaw plugins install @openclaw/line
```

Checkout lokal (saat menjalankan dari repo git):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Penyiapan

1. Buat akun LINE Developers dan buka Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Buat (atau pilih) Penyedia dan tambahkan channel **Messaging API**.
3. Salin **Token akses channel** dan **Rahasia channel** dari pengaturan channel.
4. Aktifkan **Gunakan webhook** di pengaturan Messaging API.
5. Atur URL Webhook ke endpoint Gateway Anda (HTTPS wajib):

```
https://gateway-host/line/webhook
```

Gateway merespons verifikasi Webhook LINE (GET) dan mengakui peristiwa masuk bertanda tangan
(POST) segera setelah validasi tanda tangan dan payload; pemrosesan agen
berlanjut secara asinkron.
Jika Anda memerlukan path khusus, atur `channels.line.webhookPath` atau
`channels.line.accounts.<id>.webhookPath` dan perbarui URL sesuai kebutuhan.

Catatan keamanan:

- Verifikasi tanda tangan LINE bergantung pada body (HMAC atas body mentah), jadi OpenClaw menerapkan batas body pra-autentikasi yang ketat dan timeout sebelum verifikasi.
- OpenClaw memproses peristiwa Webhook dari byte permintaan mentah yang telah diverifikasi. Nilai `req.body` yang ditransformasi middleware upstream diabaikan demi keamanan integritas tanda tangan.

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

Konfigurasi DM publik:

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

Variabel env (hanya akun default):

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

File token/rahasia:

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

`tokenFile` dan `secretFile` harus mengarah ke file reguler. Symlink ditolak.

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

Pesan langsung default ke pairing. Pengirim yang tidak dikenal mendapatkan kode pairing dan
pesan mereka diabaikan hingga disetujui.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Allowlist dan kebijakan:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: ID pengguna LINE yang masuk allowlist untuk DM; `dmPolicy: "open"` memerlukan `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: ID pengguna LINE yang masuk allowlist untuk grup
- Override per grup: `channels.line.groups.<groupId>.allowFrom`
- Grup akses pengirim statis dapat dirujuk dari `allowFrom`, `groupAllowFrom`, dan `allowFrom` per grup dengan `accessGroup:<name>`.
- Catatan runtime: jika `channels.line` sepenuhnya tidak ada, runtime fallback ke `groupPolicy="allowlist"` untuk pemeriksaan grup (meskipun `channels.defaults.groupPolicy` diatur).

ID LINE peka huruf besar-kecil. ID yang valid terlihat seperti:

- Pengguna: `U` + 32 karakter hex
- Grup: `C` + 32 karakter hex
- Ruang: `R` + 32 karakter hex

## Perilaku pesan

- Teks dipecah pada 5000 karakter.
- Pemformatan Markdown dihapus; blok kode dan tabel dikonversi menjadi kartu Flex
  jika memungkinkan.
- Respons streaming dibuffer; LINE menerima chunk lengkap dengan animasi pemuatan
  saat agen bekerja.
- Unduhan media dibatasi oleh `channels.line.mediaMaxMb` (default 10).
- Media masuk disimpan di bawah `~/.openclaw/media/inbound/` sebelum diteruskan
  ke agen, sesuai dengan penyimpanan media bersama yang digunakan oleh Plugin channel
  bawaan lainnya.

## Data channel (pesan kaya)

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

Plugin LINE juga menyertakan perintah `/card` untuk preset pesan Flex:

```
/card info "Welcome" "Thanks for joining!"
```

## Dukungan ACP

LINE mendukung binding percakapan ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` mengikat obrolan LINE saat ini ke sesi ACP tanpa membuat utas turunan.
- Binding ACP yang dikonfigurasi dan sesi ACP aktif yang terikat percakapan bekerja di LINE seperti channel percakapan lainnya.

Lihat [Agen ACP](/id/tools/acp-agents) untuk detail.

## Media keluar

Plugin LINE mendukung pengiriman gambar, video, dan file audio melalui alat pesan agen. Media dikirim melalui jalur pengiriman khusus LINE dengan penanganan pratinjau dan pelacakan yang sesuai:

- **Gambar**: dikirim sebagai pesan gambar LINE dengan pembuatan pratinjau otomatis.
- **Video**: dikirim dengan penanganan pratinjau dan tipe konten eksplisit.
- **Audio**: dikirim sebagai pesan audio LINE.

URL media keluar harus berupa URL HTTPS publik. OpenClaw memvalidasi hostname target sebelum menyerahkan URL ke LINE dan menolak target loopback, link-local, dan jaringan privat.

Pengiriman media generik fallback ke rute khusus gambar yang sudah ada jika jalur khusus LINE tidak tersedia.

## Pemecahan masalah

- **Verifikasi Webhook gagal:** pastikan URL Webhook menggunakan HTTPS dan
  `channelSecret` cocok dengan konsol LINE.
- **Tidak ada peristiwa masuk:** konfirmasi path Webhook cocok dengan `channels.line.webhookPath`
  dan Gateway dapat dijangkau dari LINE.
- **Kesalahan unduhan media:** naikkan `channels.line.mediaMaxMb` jika media melebihi
  batas default.

## Terkait

- [Ikhtisar Channel](/id/channels) — semua channel yang didukung
- [Pairing](/id/channels/pairing) — autentikasi DM dan alur pairing
- [Grup](/id/channels/groups) — perilaku obrolan grup dan gating mention
- [Perutean Channel](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) — model akses dan hardening
