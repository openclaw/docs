---
read_when:
    - Anda ingin menghubungkan OpenClaw ke LINE
    - Anda perlu menyiapkan Webhook LINE + kredensial
    - Anda menginginkan opsi pesan khusus LINE
summary: Penyiapan, konfigurasi, dan penggunaan plugin LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-07-19T04:44:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: aa160970278e0899637307136139f7d2fc83bf57defc30771d77649060f77274
    source_path: channels/line.md
    workflow: 16
---

LINE terhubung ke OpenClaw melalui LINE Messaging API. Plugin berjalan sebagai penerima webhook
di Gateway dan menggunakan token akses channel + secret channel Anda untuk
autentikasi.

Status: plugin resmi, dipasang secara terpisah. Pesan langsung, obrolan grup, media,
lokasi, pesan Flex, pesan templat, dan balasan cepat didukung.
Reaksi dan utas tidak didukung.

## Instalasi

Instal LINE sebelum mengonfigurasi channel:

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
2. Buat (atau pilih) Provider dan tambahkan channel **Messaging API**.
3. Salin **Channel access token** dan **Channel secret** dari pengaturan channel.
4. Aktifkan **Use webhook** di pengaturan Messaging API.
5. Tetapkan URL webhook ke endpoint gateway Anda (HTTPS wajib):

```text
https://gateway-host/line/webhook
```

Gateway menjawab verifikasi webhook LINE (GET). Untuk peristiwa masuk bertanda tangan
(POST), Gateway menulis setiap peristiwa ke antrean ingress persisten sebelum mengembalikan `200`;
pemrosesan agen berlanjut secara asinkron. Pengiriman yang gagal dicoba ulang dari
antrean, termasuk setelah Gateway dimulai ulang, dan peristiwa bermasalah menjadi catatan antrean
gagal setelah percobaan ulang terbatas. Jika persistensi tahan lama gagal, permintaan mengembalikan
`500` alih-alih mengakui peristiwa yang dapat hilang.
Pengiriman dilakukan setidaknya sekali pada batas antrean-ke-agen: penghentian atau
crash Gateway selama pengiriman aktif dapat memutar ulang giliran. Peristiwa pesan dideduplikasi berdasarkan
ID pesan LINE; jenis peristiwa lainnya menggunakan `webhookEventId`. Catatan penyelesaian yang dipertahankan
mencegah webhook duplikat biasa, tetapi penangan yang melakukan efek samping eksternal
tetap harus idempoten.
Jika memerlukan path khusus, tetapkan `channels.line.webhookPath` atau
`channels.line.accounts.<id>.webhookPath` dan perbarui URL sebagaimana mestinya.

Catatan keamanan:

- Verifikasi tanda tangan LINE bergantung pada isi body (HMAC atas body mentah), sehingga OpenClaw menerapkan batas body praautentikasi yang ketat (64 KB) dan batas waktu baca sebelum verifikasi.
- OpenClaw memproses peristiwa webhook dari byte permintaan mentah yang telah diverifikasi. Nilai `req.body` yang ditransformasi middleware upstream diabaikan demi keamanan integritas tanda tangan.

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

`tokenFile` dan `secretFile` harus menunjuk ke file reguler. Symlink ditolak.
Nilai konfigurasi inline lebih diutamakan daripada file; variabel lingkungan merupakan fallback terakhir untuk akun default.

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

Pesan langsung secara default menggunakan pemasangan. Pengirim yang tidak dikenal mendapatkan kode pemasangan dan
pesan mereka diabaikan hingga disetujui:

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Daftar izin dan kebijakan:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled` (default `pairing`)
- `channels.line.allowFrom`: ID pengguna LINE yang masuk daftar izin untuk DM; `dmPolicy: "open"` memerlukan `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled` (default `allowlist`)
- `channels.line.groupAllowFrom`: ID pengguna LINE yang masuk daftar izin untuk grup; entri DM `allowFrom` tidak mengizinkan pengirim grup
- Penimpaan per grup: `channels.line.groups.<groupId>.allowFrom` (serta `enabled`, `requireMention`, `systemPrompt`, `skills`). Dengan
  `groupPolicy: "allowlist"`, tetapkan `groupAllowFrom` atau `allowFrom` per grup; daftar izin grup yang kosong memblokir pesan grup meskipun DM terbuka.
- Grup akses pengirim statis dapat dirujuk dari `allowFrom`, `groupAllowFrom`, dan `allowFrom` per grup dengan `accessGroup:<name>`; lihat [Grup akses](/id/channels/access-groups).
- Catatan runtime: jika `channels.line` sama sekali tidak ada, runtime kembali menggunakan `groupPolicy="allowlist"` untuk pemeriksaan grup (meskipun `channels.defaults.groupPolicy` ditetapkan).

ID LINE peka huruf besar-kecil. ID yang valid terlihat seperti:

- Pengguna: `U` + 32 karakter heksadesimal
- Grup: `C` + 32 karakter heksadesimal
- Ruang: `R` + 32 karakter heksadesimal

## Perilaku pesan

- Teks dipecah menjadi potongan berukuran 5000 karakter.
- Pemformatan Markdown dihapus; blok kode dan tabel dikonversi menjadi kartu Flex
  jika memungkinkan.
- Respons streaming dibuffer; LINE menerima potongan lengkap dengan animasi pemuatan
  selagi agen bekerja.
- Unduhan media dibatasi oleh `channels.line.mediaMaxMb` (default 10).
- Media masuk disimpan di bawah `~/.openclaw/media/inbound/` sebelum diteruskan
  ke agen, sesuai dengan penyimpanan media bersama yang digunakan oleh plugin channel lainnya.

## Data channel (pesan kaya)

Gunakan `channelData.line` untuk mengirim balasan cepat, lokasi, kartu Flex, atau pesan
templat.

```json5
{
  text: "Ini dia",
  channelData: {
    line: {
      quickReplies: ["Status", "Bantuan"],
      location: {
        title: "Kantor",
        address: "123 Main St",
        latitude: 35.681236,
        longitude: 139.767125,
      },
      flexMessage: {
        altText: "Kartu status",
        contents: {/* Muatan Flex */},
      },
      templateMessage: {
        type: "confirm",
        text: "Lanjutkan?",
        confirmLabel: "Ya",
        confirmData: "yes",
        cancelLabel: "Tidak",
        cancelData: "no",
      },
    },
  },
}
```

Plugin LINE juga menyediakan perintah `/card` untuk preset pesan Flex:

```text
/card info "Selamat datang" "Terima kasih telah bergabung!"
```

## Dukungan ACP

LINE mendukung pengikatan percakapan ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` mengikat obrolan LINE saat ini ke sesi ACP tanpa membuat utas turunan.
- Pengikatan ACP yang dikonfigurasi dan sesi ACP aktif yang terikat ke percakapan berfungsi di LINE seperti pada channel percakapan lainnya.

Lihat [Agen ACP](/id/tools/acp-agents) untuk detailnya.

## Media keluar

Plugin LINE mengirim gambar, video, dan audio melalui alat pesan agen:

- **Gambar**: dikirim sebagai pesan gambar LINE; gambar pratinjau secara default menggunakan URL media.
- **Video**: memerlukan gambar pratinjau; tetapkan `channelData.line.previewImageUrl` ke URL gambar.
- **Audio**: dikirim sebagai pesan audio LINE; durasi defaultnya 60 detik kecuali `channelData.line.durationMs` ditetapkan.

Jenis media diambil dari `channelData.line.mediaKind` jika ditetapkan, jika tidak akan disimpulkan
dari opsi LINE lainnya atau sufiks file URL, dengan gambar sebagai fallback.

URL media keluar harus berupa URL HTTPS publik dengan panjang maksimal 2000 karakter. OpenClaw
memvalidasi nama host tujuan sebelum menyerahkan URL ke LINE dan menolak tujuan loopback,
link-local, serta jaringan privat.

Pengiriman media generik tanpa opsi khusus LINE menggunakan rute gambar.

## Pemecahan masalah

- **Verifikasi webhook gagal:** pastikan URL webhook menggunakan HTTPS dan
  `channelSecret` cocok dengan console LINE.
- **Tidak ada peristiwa masuk:** pastikan path webhook cocok dengan `channels.line.webhookPath`
  dan gateway dapat dijangkau dari LINE.
- **Kesalahan pengunduhan media:** naikkan `channels.line.mediaMaxMb` jika media melampaui
  batas default.

## Terkait

- [Ikhtisar Channel](/id/channels) — semua channel yang didukung
- [Pemasangan](/id/channels/pairing) — autentikasi DM dan alur pemasangan
- [Grup](/id/channels/groups) — perilaku obrolan grup dan pembatasan penyebutan
- [Perutean Channel](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) — model akses dan penguatan
