---
read_when:
    - Anda ingin menghubungkan OpenClaw ke LINE
    - Anda memerlukan penyiapan Webhook + kredensial LINE
    - Anda menginginkan opsi pesan khusus LINE
summary: Penyiapan, konfigurasi, dan penggunaan Plugin LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-04-24T08:58:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: a8c3187486033ab01c243f1d44518cad2b28f744a9d0cde1de9117bd26452ed4
    source_path: channels/line.md
    workflow: 15
---

LINE terhubung ke OpenClaw melalui LINE Messaging API. Plugin ini berjalan sebagai penerima Webhook
di Gateway dan menggunakan token akses channel + secret channel Anda untuk
autentikasi.

Status: Plugin bawaan. Pesan langsung, chat grup, media, lokasi, pesan Flex,
pesan template, dan balasan cepat didukung. Reaksi dan thread
tidak didukung.

## Plugin bawaan

LINE tersedia sebagai Plugin bawaan di rilis OpenClaw saat ini, jadi build
paket normal tidak memerlukan instalasi terpisah.

Jika Anda menggunakan build lama atau instalasi kustom yang tidak menyertakan LINE, instal secara
manual:

```bash
openclaw plugins install @openclaw/line
```

Checkout lokal (saat berjalan dari repo git):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Penyiapan

1. Buat akun LINE Developers dan buka Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Buat (atau pilih) Provider dan tambahkan channel **Messaging API**.
3. Salin **Channel access token** dan **Channel secret** dari pengaturan channel.
4. Aktifkan **Use webhook** di pengaturan Messaging API.
5. Atur URL Webhook ke endpoint Gateway Anda (HTTPS wajib):

```
https://gateway-host/line/webhook
```

Gateway merespons verifikasi Webhook LINE (GET) dan peristiwa masuk (POST).
Jika Anda memerlukan path kustom, atur `channels.line.webhookPath` atau
`channels.line.accounts.<id>.webhookPath` lalu perbarui URL sesuai kebutuhan.

Catatan keamanan:

- Verifikasi signature LINE bergantung pada body (HMAC pada body mentah), jadi OpenClaw menerapkan batas body pra-autentikasi yang ketat dan timeout sebelum verifikasi.
- OpenClaw memproses peristiwa Webhook dari byte permintaan mentah yang telah diverifikasi. Nilai `req.body` yang ditransformasikan middleware upstream diabaikan demi keamanan integritas signature.

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

Variabel env (hanya akun default):

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

`tokenFile` dan `secretFile` harus menunjuk ke file biasa. Symlink ditolak.

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

Pesan langsung secara default menggunakan pairing. Pengirim yang tidak dikenal akan mendapatkan kode pairing dan
pesannya diabaikan sampai disetujui.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Allowlist dan kebijakan:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: ID pengguna LINE yang masuk allowlist untuk DM
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: ID pengguna LINE yang masuk allowlist untuk grup
- Override per grup: `channels.line.groups.<groupId>.allowFrom`
- Catatan runtime: jika `channels.line` tidak ada sama sekali, runtime akan kembali ke `groupPolicy="allowlist"` untuk pemeriksaan grup (bahkan jika `channels.defaults.groupPolicy` disetel).

ID LINE peka huruf besar/kecil. ID yang valid terlihat seperti:

- Pengguna: `U` + 32 karakter hex
- Grup: `C` + 32 karakter hex
- Room: `R` + 32 karakter hex

## Perilaku pesan

- Teks dipotong per 5000 karakter.
- Pemformatan Markdown dihapus; blok kode dan tabel dikonversi menjadi kartu Flex
  jika memungkinkan.
- Respons streaming dibuffer; LINE menerima potongan penuh dengan animasi
  loading saat agen bekerja.
- Unduhan media dibatasi oleh `channels.line.mediaMaxMb` (default 10).

## Data channel (pesan kaya)

Gunakan `channelData.line` untuk mengirim balasan cepat, lokasi, kartu Flex, atau
pesan template.

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

- `/acp spawn <agent> --bind here` mengikat chat LINE saat ini ke sesi ACP tanpa membuat thread anak.
- Binding ACP yang dikonfigurasi dan sesi ACP aktif yang terikat ke percakapan berfungsi di LINE seperti pada channel percakapan lainnya.

Lihat [agen ACP](/id/tools/acp-agents) untuk detailnya.

## Media keluar

Plugin LINE mendukung pengiriman file gambar, video, dan audio melalui tool pesan agen. Media dikirim melalui jalur pengiriman khusus LINE dengan penanganan pratinjau dan pelacakan yang sesuai:

- **Gambar**: dikirim sebagai pesan gambar LINE dengan pembuatan pratinjau otomatis.
- **Video**: dikirim dengan pratinjau eksplisit dan penanganan content-type.
- **Audio**: dikirim sebagai pesan audio LINE.

URL media keluar harus berupa URL HTTPS publik. OpenClaw memvalidasi hostname target sebelum menyerahkan URL ke LINE dan menolak target loopback, link-local, dan jaringan privat.

Pengiriman media generik kembali ke rute khusus gambar yang sudah ada saat jalur khusus LINE tidak tersedia.

## Pemecahan masalah

- **Verifikasi Webhook gagal:** pastikan URL Webhook menggunakan HTTPS dan
  `channelSecret` cocok dengan yang ada di console LINE.
- **Tidak ada peristiwa masuk:** pastikan path Webhook cocok dengan `channels.line.webhookPath`
  dan Gateway dapat dijangkau dari LINE.
- **Error unduhan media:** tingkatkan `channels.line.mediaMaxMb` jika media melebihi
  batas default.

## Terkait

- [Ikhtisar Channels](/id/channels) — semua channel yang didukung
- [Pairing](/id/channels/pairing) — autentikasi DM dan alur pairing
- [Grup](/id/channels/groups) — perilaku chat grup dan pembatasan mention
- [Perutean Channel](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) — model akses dan penguatan
