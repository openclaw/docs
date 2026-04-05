---
read_when:
    - Anda ingin menghubungkan OpenClaw ke LINE
    - Anda memerlukan penyiapan webhook + kredensial LINE
    - Anda menginginkan opsi pesan khusus LINE
summary: Penyiapan, config, dan penggunaan plugin LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-04-05T13:43:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: b4782b2aa3e8654505d7f1fd6fc112adf125b5010fc84d655d033688ded37414
    source_path: channels/line.md
    workflow: 15
---

# LINE

LINE terhubung ke OpenClaw melalui LINE Messaging API. Plugin berjalan sebagai
penerima webhook di gateway dan menggunakan token akses channel + rahasia channel Anda untuk
autentikasi.

Status: plugin bawaan. Direct message, obrolan grup, media, lokasi, pesan Flex,
pesan template, dan quick reply didukung. Reactions dan thread
tidak didukung.

## Plugin bawaan

LINE dikirim sebagai plugin bawaan dalam rilis OpenClaw saat ini, jadi build
terpaket normal tidak memerlukan instalasi terpisah.

Jika Anda menggunakan build lama atau instalasi kustom yang tidak menyertakan LINE, instal
secara manual:

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
5. Atur URL webhook ke endpoint gateway Anda (HTTPS wajib):

```
https://gateway-host/line/webhook
```

Gateway merespons verifikasi webhook LINE (GET) dan peristiwa masuk (POST).
Jika Anda memerlukan path kustom, atur `channels.line.webhookPath` atau
`channels.line.accounts.<id>.webhookPath` dan perbarui URL sesuai kebutuhan.

Catatan keamanan:

- Verifikasi signature LINE bergantung pada body (HMAC atas body mentah), jadi OpenClaw menerapkan batas body pra-autentikasi yang ketat dan timeout sebelum verifikasi.
- OpenClaw memproses peristiwa webhook dari byte permintaan mentah yang telah diverifikasi. Nilai `req.body` yang diubah oleh middleware upstream diabaikan demi keamanan integritas signature.

## Konfigurasi

Config minimal:

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

`tokenFile` dan `secretFile` harus menunjuk ke file reguler. Symlink ditolak.

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

Direct message secara default menggunakan pairing. Pengirim yang tidak dikenal akan mendapatkan kode pairing dan
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
- Catatan runtime: jika `channels.line` tidak ada sama sekali, runtime akan fallback ke `groupPolicy="allowlist"` untuk pemeriksaan grup (bahkan jika `channels.defaults.groupPolicy` diatur).

ID LINE peka huruf besar/kecil. ID yang valid terlihat seperti:

- Pengguna: `U` + 32 karakter hex
- Grup: `C` + 32 karakter hex
- Room: `R` + 32 karakter hex

## Perilaku pesan

- Teks dipotong per 5000 karakter.
- Format Markdown dihapus; blok kode dan tabel dikonversi menjadi kartu Flex
  jika memungkinkan.
- Respons streaming dibuffer; LINE menerima potongan penuh dengan animasi
  loading saat agen bekerja.
- Unduhan media dibatasi oleh `channels.line.mediaMaxMb` (default 10).

## Data channel (pesan kaya)

Gunakan `channelData.line` untuk mengirim quick reply, lokasi, kartu Flex, atau pesan
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

- `/acp spawn <agent> --bind here` mengikat obrolan LINE saat ini ke sesi ACP tanpa membuat child thread.
- Binding ACP yang dikonfigurasi dan sesi ACP aktif yang terikat percakapan bekerja di LINE seperti di channel percakapan lainnya.

Lihat [ACP agents](/tools/acp-agents) untuk detail.

## Media keluar

Plugin LINE mendukung pengiriman file gambar, video, dan audio melalui alat pesan agen. Media dikirim melalui jalur pengiriman khusus LINE dengan penanganan pratinjau dan pelacakan yang sesuai:

- **Gambar**: dikirim sebagai pesan gambar LINE dengan pembuatan pratinjau otomatis.
- **Video**: dikirim dengan pratinjau eksplisit dan penanganan content-type.
- **Audio**: dikirim sebagai pesan audio LINE.

Pengiriman media generik akan fallback ke rute khusus gambar yang sudah ada saat jalur khusus LINE tidak tersedia.

## Pemecahan masalah

- **Verifikasi webhook gagal:** pastikan URL webhook menggunakan HTTPS dan
  `channelSecret` cocok dengan console LINE.
- **Tidak ada peristiwa masuk:** pastikan path webhook cocok dengan `channels.line.webhookPath`
  dan gateway dapat dijangkau dari LINE.
- **Error unduhan media:** tingkatkan `channels.line.mediaMaxMb` jika media melebihi
  batas default.

## Terkait

- [Ikhtisar Channels](/channels) — semua channel yang didukung
- [Pairing](/channels/pairing) — autentikasi DM dan alur pairing
- [Groups](/channels/groups) — perilaku obrolan grup dan pembatasan mention
- [Channel Routing](/channels/channel-routing) — perutean sesi untuk pesan
- [Security](/gateway/security) — model akses dan penguatan
