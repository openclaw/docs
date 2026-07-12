---
read_when:
    - Anda sedang membangun atau merombak jalur pengiriman Plugin saluran perpesanan
    - Anda memerlukan pengiriman balasan akhir yang andal, tanda terima, finalisasi pratinjau langsung, atau kebijakan konfirmasi penerimaan
    - Anda sedang bermigrasi dari pembantu pengiriman balasan `channel-message`, `channel-message-runtime`, atau versi lama
summary: 'API siklus hidup pesan keluar untuk Plugin kanal: adaptor, tanda terima, pengiriman persisten, pratinjau langsung, dan pembantu alur balasan'
title: API keluar kanal
x-i18n:
    generated_at: "2026-07-12T14:31:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ab3c38a0c2ae7d46f318604328b5ffdd6f375005150f09698b299cbd06e2f22
    source_path: plugins/sdk-channel-outbound.md
    workflow: 16
---

Plugin saluran mengekspos perilaku pesan keluar dari
`openclaw/plugin-sdk/channel-outbound`. Gunakan
`openclaw/plugin-sdk/channel-inbound` untuk orkestrasi
penerimaan/konteks/pengiriman.

Inti menangani antrean, durabilitas, kebijakan percobaan ulang generik, hook, tanda terima, dan
alat `message` bersama. Plugin menangani panggilan kirim/edit/hapus native,
normalisasi target, utas platform, kutipan terpilih, tanda
notifikasi, status akun, dan efek samping khusus platform.

## Adaptor

Sebagian besar plugin mendefinisikan satu adaptor `message`:

```ts
import {
  defineChannelMessageAdapter,
  createMessageReceiptFromOutboundResults,
} from "openclaw/plugin-sdk/channel-outbound";

export const demoMessageAdapter = defineChannelMessageAdapter({
  id: "demo",
  durableFinal: {
    capabilities: {
      text: true,
      replyTo: true,
      thread: true,
      messageSendingHooks: true,
    },
  },
  send: {
    text: async ({ cfg, to, text, accountId, replyToId, threadId, signal }) => {
      const sent = await sendDemoMessage({
        cfg,
        to,
        text,
        accountId: accountId ?? undefined,
        replyToId: replyToId ?? undefined,
        threadId: threadId == null ? undefined : String(threadId),
        signal,
      });

      return {
        receipt: createMessageReceiptFromOutboundResults({
          results: [{ channel: "demo", messageId: sent.id, conversationId: to }],
          kind: "text",
          threadId: threadId == null ? undefined : String(threadId),
          replyToId: replyToId ?? undefined,
        }),
      };
    },
  },
});
```

Nyatakan hanya kapabilitas yang benar-benar dipertahankan oleh transport native. Cakup
setiap kapabilitas pengiriman, tanda terima, pratinjau langsung, dan konfirmasi penerimaan yang dideklarasikan dengan
bantuan kontrak yang diekspor dari subjalur ini.

## Sanitasi teks biasa

Gunakan `sanitizeForPlainText(...)` saat adaptor keluar perlu mengonversi
tag pemformatan HTML yang didukung menjadi markup teks ringan. Pengaturan bawaan mempertahankan
penanda tebal dan coret bergaya percakapan yang sudah ada. Teruskan
`{ style: "markdown" }` hanya jika saluran mengurai ulang hasilnya sebagai Markdown:

```ts
import { sanitizeForPlainText } from "openclaw/plugin-sdk/channel-outbound";

const chatText = sanitizeForPlainText(text);
const markdownText = sanitizeForPlainText(text, { style: "markdown" });
```

Gaya Markdown menggunakan `**bold**` dan `~~strikethrough~~`; cetak miring dan kode
sebaris tetap menggunakan penanda `_italic_` dan tanda backtick dalam kedua gaya. Pilih gaya pada
batas saluran, bukan dengan menulis ulang teks penanda setelah sanitasi.

## Bukti pengiriman

`MessageReceipt` mencatat hasil yang dikembalikan oleh adaptor saluran. Pengidentifikasi
pesan platform yang konkret menunjukkan bahwa jalur pengiriman platform menerima
pesan tersebut; hal itu tidak membuktikan bahwa perangkat penerima menampilkan atau membacanya.
Tanda terima tanpa pengidentifikasi pesan platform hanyalah metadata tanda terima lokal.
Saluran dengan tanda terima baca atau status pengiriman perangkat harus melacak fakta tersebut
melalui jalur terpisah yang khusus untuk saluran.

Jika adaptor saluran dapat membuktikan bahwa mencoba ulang kegagalan tidak dapat menduplikasi
pengiriman yang terlihat oleh penerima dan tidak ada panggilan yang mampu melakukan finalisasi yang dimulai, lempar
`new PlatformMessageNotDispatchedError("...", { cause: error })` dari
`openclaw/plugin-sdk/error-runtime`. Inti kemudian dapat menghapus bukti percobaan
pengiriman yang kedaluwarsa dan mencoba ulang intensi dalam antrean dengan aman. Hanya adaptor yang menangani
batas pengiriman akhir yang boleh membuat pernyataan ini. Jangan pernah menggunakan penanda tersebut setelah
panggilan finalisasi/pengiriman dimulai atau mengembalikan hasil yang ambigu; penandaan yang keliru dapat
menduplikasi pesan.

## Adaptor keluar yang sudah ada

Jika saluran sudah memiliki adaptor `outbound` yang kompatibel, turunkan
adaptor pesan tersebut alih-alih menduplikasi kode pengiriman:

```ts
import { createChannelMessageAdapterFromOutbound } from "openclaw/plugin-sdk/channel-outbound";

export const messageAdapter = createChannelMessageAdapterFromOutbound({
  id: "demo",
  outbound,
  durableFinal: {
    capabilities: {
      text: true,
      media: true,
    },
  },
});
```

## Pengiriman durabel

Bantuan pengiriman runtime juga tersedia di `channel-outbound`:

- `sendDurableMessageBatch(...)`
- `withDurableMessageSendContext(...)`
- `deliverInboundReplyWithMessageSendContext(...)`
- bantuan streaming/progres draf seperti `resolveChannelDraftStreamingChunking(...)`

`sendDurableMessageBatch(...)` mengembalikan satu hasil eksplisit:

| Hasil            | Arti                                                                                    |
| ---------------- | --------------------------------------------------------------------------------------- |
| `sent`           | setidaknya satu pesan platform yang terlihat diterima oleh jalur pengiriman platform    |
| `suppressed`     | tidak ada pesan platform yang harus dianggap hilang                                     |
| `partial_failed` | setidaknya satu pesan platform diterima sebelum muatan atau efek samping berikutnya gagal |
| `failed`         | tidak ada tanda terima platform yang dihasilkan                                         |

Gunakan `payloadOutcomes` saat satu kelompok mencampurkan muatan yang terkirim, dibatalkan, dan
gagal. Jangan menyimpulkan pembatalan hook dari hasil pengiriman langsung
lama yang kosong.

## Penerimaan pengiriman tertunda

Gunakan `message.durableFinal.admitDeferredDelivery(...)` saat akun yang telah diuraikan
tidak dapat menerima pengiriman keluar atau tertunda yang dikelola inti dengan aman. Inti memanggil
hook ini secara sinkron sebelum pekerjaan keluar langsung, termasuk jalur yang melewati
persistensi antrean, dan sekali lagi sebelum memutar ulang intensi yang dipulihkan. Konteksnya
mencakup `cfg`, `channel`, `to`, `accountId`, dan `phase` bernilai `live` atau
`recovery`.

Kembalikan `{ status: "allowed" }` untuk melanjutkan. Kembalikan
`{ status: "permanent_rejection", reason }` saat pengiriman tidak boleh
dipersistenkan, dikirim langsung, atau diputar ulang. Penolakan langsung gagal sebelum pembuatan
antrean, hook pesan, atau pekerjaan platform. Penolakan pemulihan menandai
catatan dalam antrean sebagai gagal serta melewati rekonsiliasi dan pemutaran ulang. Tidak menyertakan hook
berarti diizinkan.

Hook ini adalah keputusan penerimaan sinkron, bukan jalur pengiriman. Baca hanya
konfigurasi atau status runtime yang sudah dimuat; jangan melakukan I/O jaringan, sistem berkas, atau
I/O asinkron lainnya. Pengujian kontrak harus mencakup kedua fase dan kedua
varian hasil melalui `ChannelMessageDurableFinalAdapter` dari
`openclaw/plugin-sdk/channel-outbound`.

## Pengiriman kompatibilitas

Susun pengiriman balasan masuk melalui `dispatchChannelInboundReply(...)`
dari `channel-inbound`. Pertahankan pengiriman platform di adaptor pengiriman; gunakan
`channel-outbound` untuk adaptor pesan, pengiriman durabel, tanda terima, pratinjau
langsung, dan opsi alur balasan.
