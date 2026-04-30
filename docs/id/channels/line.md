---
read_when:
    - Anda ingin menghubungkan OpenClaw ke LINE
    - Anda perlu menyiapkan Webhook LINE + kredensial
    - Anda ingin opsi pesan khusus LINE
summary: Penyiapan, konfigurasi, dan penggunaan Plugin LINE Messaging API
title: BARIS
x-i18n:
    generated_at: "2026-04-30T09:34:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9f06d882f1e8d2a758e50459fadefd77796a68c28f63bef5790eb1b540c17d1
    source_path: channels/line.md
    workflow: 16
---

LINE terhubung ke OpenClaw melalui LINE Messaging API. Plugin berjalan sebagai penerima webhook
di Gateway dan menggunakan channel access token + channel secret Anda untuk
autentikasi.

Status: Plugin bawaan. Pesan langsung, obrolan grup, media, lokasi, Flex
messages, template messages, dan balasan cepat didukung. Reaksi dan utas
tidak didukung.

## Plugin bawaan

LINE disertakan sebagai Plugin bawaan dalam rilis OpenClaw saat ini, sehingga build
paket normal tidak memerlukan instalasi terpisah.

Jika Anda menggunakan build lama atau instalasi kustom yang mengecualikan LINE, instal
paket npm saat ini ketika sudah diterbitkan:

```bash
openclaw plugins install @openclaw/line
```

Jika npm melaporkan paket milik OpenClaw sebagai usang atau hilang, gunakan
build OpenClaw paket saat ini atau checkout lokal sampai rangkaian paket npm
menyusul.

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
5. Atur URL webhook ke endpoint Gateway Anda (HTTPS wajib):

```
https://gateway-host/line/webhook
```

Gateway merespons verifikasi webhook LINE (GET) dan event masuk (POST).
Jika Anda memerlukan path kustom, atur `channels.line.webhookPath` atau
`channels.line.accounts.<id>.webhookPath` dan perbarui URL sesuai kebutuhan.

Catatan keamanan:

- Verifikasi tanda tangan LINE bergantung pada body (HMAC atas body mentah), sehingga OpenClaw menerapkan batas body pra-autentikasi yang ketat dan timeout sebelum verifikasi.
- OpenClaw memproses event webhook dari byte permintaan mentah yang sudah diverifikasi. Nilai `req.body` yang ditransformasi middleware upstream diabaikan demi keamanan integritas tanda tangan.

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

`tokenFile` dan `secretFile` harus mengarah ke file biasa. Symlink ditolak.

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

Pesan langsung secara default menggunakan pairing. Pengirim tak dikenal menerima kode pairing dan pesan mereka
diabaikan sampai disetujui.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Allowlist dan kebijakan:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: ID pengguna LINE yang diizinkan untuk DM
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: ID pengguna LINE yang diizinkan untuk grup
- Override per grup: `channels.line.groups.<groupId>.allowFrom`
- Catatan runtime: jika `channels.line` sepenuhnya tidak ada, runtime kembali ke `groupPolicy="allowlist"` untuk pemeriksaan grup (meskipun `channels.defaults.groupPolicy` diatur).

ID LINE peka huruf besar-kecil. ID yang valid terlihat seperti:

- Pengguna: `U` + 32 karakter heksadesimal
- Grup: `C` + 32 karakter heksadesimal
- Ruang: `R` + 32 karakter heksadesimal

## Perilaku pesan

- Teks dipotong menjadi bagian berukuran 5000 karakter.
- Pemformatan Markdown dihapus; blok kode dan tabel dikonversi menjadi kartu Flex
  jika memungkinkan.
- Respons streaming dibuffer; LINE menerima potongan lengkap dengan animasi pemuatan
  saat agen bekerja.
- Unduhan media dibatasi oleh `channels.line.mediaMaxMb` (default 10).
- Media masuk disimpan di bawah `~/.openclaw/media/inbound/` sebelum diteruskan
  ke agen, selaras dengan penyimpanan media bersama yang digunakan oleh Plugin channel bawaan
  lainnya.

## Data channel (pesan kaya)

Gunakan `channelData.line` untuk mengirim balasan cepat, lokasi, kartu Flex, atau template
messages.

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

- `/acp spawn <agent> --bind here` mengikat obrolan LINE saat ini ke sesi ACP tanpa membuat utas anak.
- Binding ACP yang dikonfigurasi dan sesi ACP yang terikat percakapan aktif berfungsi di LINE seperti channel percakapan lainnya.

Lihat [agen ACP](/id/tools/acp-agents) untuk detail.

## Media keluar

Plugin LINE mendukung pengiriman gambar, video, dan file audio melalui alat pesan agen. Media dikirim melalui jalur pengiriman khusus LINE dengan penanganan pratinjau dan pelacakan yang sesuai:

- **Gambar**: dikirim sebagai pesan gambar LINE dengan pembuatan pratinjau otomatis.
- **Video**: dikirim dengan penanganan pratinjau dan jenis konten eksplisit.
- **Audio**: dikirim sebagai pesan audio LINE.

URL media keluar harus berupa URL HTTPS publik. OpenClaw memvalidasi hostname target sebelum menyerahkan URL ke LINE dan menolak target loopback, link-local, dan jaringan privat.

Pengiriman media generik kembali ke rute khusus gambar yang ada ketika jalur khusus LINE tidak tersedia.

## Pemecahan masalah

- **Verifikasi webhook gagal:** pastikan URL webhook menggunakan HTTPS dan
  `channelSecret` cocok dengan console LINE.
- **Tidak ada event masuk:** konfirmasi bahwa path webhook cocok dengan `channels.line.webhookPath`
  dan Gateway dapat dijangkau dari LINE.
- **Kesalahan unduhan media:** naikkan `channels.line.mediaMaxMb` jika media melebihi
  batas default.

## Terkait

- [Ikhtisar Channel](/id/channels) — semua channel yang didukung
- [Pairing](/id/channels/pairing) — autentikasi DM dan alur pairing
- [Grup](/id/channels/groups) — perilaku obrolan grup dan gating mention
- [Routing Channel](/id/channels/channel-routing) — routing sesi untuk pesan
- [Keamanan](/id/gateway/security) — model akses dan hardening
