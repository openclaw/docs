---
read_when:
    - Anda sedang membangun atau memfaktorkan ulang jalur pengiriman Plugin saluran perpesanan
    - Anda memerlukan pengiriman balasan akhir yang andal, tanda terima, finalisasi pratinjau langsung, atau kebijakan konfirmasi penerimaan
    - Anda sedang bermigrasi dari pembantu pengiriman pesan kanal atau balasan lama
summary: 'API siklus hidup pesan keluar untuk plugin kanal: adaptor, tanda terima, pengiriman persisten, pratinjau langsung, dan pembantu pipeline balasan'
title: API keluar kanal
x-i18n:
    generated_at: "2026-07-20T03:53:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8edeca81d2e9261f33be1d538153caaea87caedb90dfccac33dd227c924501f1
    source_path: plugins/sdk-channel-outbound.md
    workflow: 16
---

Plugin saluran mengekspos perilaku pesan keluar dari
`openclaw/plugin-sdk/channel-outbound`. Gunakan
`openclaw/plugin-sdk/channel-inbound` untuk orkestrasi
penerimaan/konteks/dispatch.

Inti menangani antrean, durabilitas, **monitor ingress dan drain yang tahan lama**
(`createChannelIngressMonitor`, `createChannelIngressDrain`, dan
`openChannelIngressDrain`), kebijakan percobaan ulang generik, siklus hidup adopsi giliran
(`turnAdoptionLifecycle` / `bindIngressLifecycleToReplyOptions`), hook,
tanda terima, dan alat `message` bersama. Plugin menangani panggilan native
untuk mengirim/mengedit/menghapus, normalisasi target, threading platform, kutipan
yang dipilih, flag notifikasi, status akun, inspeksi ingress dan pengodean payload,
kunci lane, predikat yang tidak dapat dicoba ulang, otorisasi supersede opsional,
dan efek samping khusus platform.

## Monitor ingress yang tahan lama

Gunakan `createChannelIngressMonitor(...)` ketika saluran harus menyimpan peristiwa
transport yang diterima sebelum dispatch. Ini menggabungkan antrean ingress saluran dan drain
dengan siklus hidup penerimaan, polling, pemangkasan, pengiriman, dan penghentian bersama.
Gunakan `createChannelIngressDrain(...)` tingkat rendah hanya ketika transport
memiliki kontrak penerimaan atau pump yang berbeda secara substansial.

Opsi yang diperlukan adalah:

| Opsi                             | Kontrak                                                                                                                                                                                                                                                                                                         |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `queue`                          | Sebuah `ChannelIngressQueue`, atau factory lazy yang membuka antrean dengan cakupan akun.                                                                                                                                                                                                                                  |
| `inspect(raw, context)`          | Mengembalikan `eventId` yang stabil dan `laneKey` yang diserialisasi, atau `null` untuk peristiwa yang diabaikan. Fakta pada waktu klaim harus cocok dengan id dan lane yang disimpan.                                                                                                                                                                    |
| `payload`                        | Menyediakan versi payload beserta serialisasi/deserialisasi isi. Gunakan `storage: "raw-event"` untuk envelope string `{ version, rawEvent }` standar, atau sediakan callback encode/decode khusus untuk bentuk khusus saluran yang sudah ada. `createClaimError` mengklasifikasikan versi yang tidak valid atau identitas yang berubah. |
| `deliver(raw, lifecycle, claim)` | Melakukan dispatch terhadap satu peristiwa yang telah didekode dan menerima siklus hidup adopsi lengkap. Ini dapat mengembalikan `completed`, `deferred`, `failed-retryable`, atau tidak mengembalikan apa pun.                                                                                                                                                                |
| `pollIntervalMs`                 | Menjadwalkan polling pemulihan/drain saat monitor berjalan.                                                                                                                                                                                                                                                     |
| `retention`                      | Menyediakan interval pemangkasan serta TTL dan batas entri untuk status selesai/gagal.                                                                                                                                                                                                                                              |

Monitor menserialisasi penerimaan agar backoff append tidak dapat membalik urutan lane.
Delay append terbatas default adalah `0`, `100`, dan `300` ms; habisnya percobaan
menolak callback transport alih-alih melakukan dispatch terhadap peristiwa yang belum dibuat
tahan lama. Pada waktu klaim, monitor mendekode payload berversi, menjalankan ulang `inspect`, dan
menolak ketidakcocokan id atau lane sebelum pengiriman.

`deliver` menerima `onAdopted`, `onDeferred`, `onAdoptionFinalizing`,
`onAbandoned`, dan `abortSignal`. Kembali tanpa handoff eksplisit menandai
peristiwa terminal tanpa dispatch sebagai telah diadopsi. `admission` selalu `exclusive`. Handoff
tertunda mempertahankan klaim, sedangkan penghentian atau pembatalan membiarkan pekerjaan yang belum diadopsi
dapat dicoba ulang. Monitor melacak pengiriman secara terpisah dari penyelesaian klaim
karena adopsi dapat membuat tombstone pada baris sebelum promise pengiriman saluran
kembali.

Pengaturan opsional mencakup delay append khusus, blok opsi `drain` untuk
pengurutan/konkurensi/kebijakan percobaan ulang drain lanjutan, `abortSignal` eksternal,
clock, pelaporan kesalahan pump, factory kesalahan berhenti, dan kebijakan penerimaan.
Monitor yang dikembalikan mengekspos `admit`, `start`, `pause`, `stop`, `waitForIdle`,
`isRunning`, dan `isStopped`. `stop` pertama-tama menyelesaikan penerimaan yang diterima, lalu
membatalkan dan membuang drain, menunggu pump dan pengiriman aktif, kemudian
membuangnya lagi untuk menutup kondisi balapan pembuatan lazy.

Pertahankan redaksi khusus transport, validasi envelope mentah, klasifikasi
yang tidak dapat dicoba ulang, dan bentuk payload tersimpan di dalam plugin. Transport Webhook
harus memberikan acknowledgment hanya setelah `admit` selesai; transport yang tidak dapat diputar ulang harus
menampilkan habisnya percobaan append tahan lama alih-alih melakukan dispatch secara diam-diam.

## Adapter

Sebagian besar plugin mendefinisikan satu adapter `message`:

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

Hanya deklarasikan kapabilitas yang benar-benar dipertahankan oleh transport native. Cakup
setiap kapabilitas pengiriman, tanda terima, pratinjau langsung, dan acknowledgment penerimaan yang dideklarasikan dengan
helper kontrak yang diekspor dari subpath ini.

## Supresi echo keluar

Ketika platform mungkin mengirimkan kembali pesan keluar milik plugin sebagai pesan masuk, panggil `recordOutboundMessageIdentity(...)` dengan saluran, akun, percakapan, dan identitas pesan atau sumber platform yang stabil. Jalur giliran masuk bersama menghapus identitas yang cocok dalam jendela terbatas 30 detik sebelum perekaman sesi atau dispatch agen; identitas sumber dapat dicadangkan sebelum pengiriman atau disegarkan ketika rute saluran dihapus untuk menutup kondisi balapan pengiriman. `isRecentOutboundMessageIdentity(...)` mengekspos kueri yang sama untuk diagnostik dan pengujian saluran. Jangan memelihara cache TTL lokal saluran paralel untuk identitas stabil yang sama.

## Sanitasi teks biasa

Gunakan `sanitizeForPlainText(...)` ketika adapter keluar perlu mengonversi
tag pemformatan HTML yang didukung menjadi markup teks ringan. Default-nya mempertahankan
penanda tebal dan coret bergaya chat yang sudah ada. Teruskan
`{ style: "markdown" }` hanya ketika saluran mem-parsing ulang hasilnya sebagai Markdown:

```ts
import { sanitizeForPlainText } from "openclaw/plugin-sdk/channel-outbound";

const chatText = sanitizeForPlainText(text);
const markdownText = sanitizeForPlainText(text, { style: "markdown" });
```

Gaya Markdown menggunakan `**bold**` dan `~~strikethrough~~`; teks miring dan kode
inline mempertahankan `_italic_` dan penanda backtick dalam kedua gaya. Pilih gaya pada
batas saluran alih-alih menulis ulang teks penanda setelah sanitasi.

## Bukti Pengiriman

Sebuah `MessageReceipt` mencatat hasil yang dikembalikan oleh adapter saluran. Pengidentifikasi
pesan platform konkret menunjukkan bahwa jalur pengiriman platform menerima
pesan; hal tersebut tidak membuktikan bahwa perangkat penerima menampilkan atau membacanya.
Tanda terima tanpa pengidentifikasi pesan platform hanyalah metadata tanda terima lokal.
Saluran dengan tanda terima telah dibaca atau status pengiriman perangkat harus melacak fakta tersebut
melalui jalur khusus saluran yang terpisah.

Jika adapter saluran dapat membuktikan bahwa mencoba ulang kegagalan tidak dapat menduplikasi
pengiriman yang terlihat oleh penerima dan tidak ada panggilan yang mampu melakukan finalisasi yang dimulai, lempar
`new PlatformMessageNotDispatchedError("...", { cause: error })` dari
`openclaw/plugin-sdk/error-runtime`. Inti kemudian dapat menghapus bukti percobaan
pengiriman yang kedaluwarsa dan mencoba ulang intent yang diantrekan dengan aman. Hanya adapter yang menangani
batas dispatch akhir yang boleh membuat pernyataan ini. Jangan pernah menggunakan penanda setelah
panggilan finalisasi/pengiriman dimulai atau mengembalikan hasil ambigu; penandaan yang salah dapat
menduplikasi pesan.

## Adapter keluar yang sudah ada

Jika saluran sudah memiliki adapter `outbound` yang kompatibel, turunkan
adapter pesan alih-alih menduplikasi kode pengiriman:

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

## Pengiriman tahan lama

Helper pengiriman runtime juga tersedia di `channel-outbound`:

- `sendDurableMessageBatch(...)`
- `withDurableMessageSendContext(...)`
- `deliverInboundReplyWithMessageSendContext(...)`
- helper streaming/progres draf seperti `resolveChannelDraftStreamingChunking(...)`

`sendDurableMessageBatch(...)` mengembalikan satu hasil eksplisit:

| Hasil            | Arti                                                                                    |
| ---------------- | --------------------------------------------------------------------------------------- |
| `sent`           | setidaknya satu pesan platform yang terlihat diterima oleh jalur pengiriman platform    |
| `suppressed`     | tidak ada pesan platform yang harus dianggap hilang                                     |
| `partial_failed` | setidaknya satu pesan platform diterima sebelum payload atau efek samping berikutnya gagal |
| `failed`         | tidak ada tanda terima platform yang dihasilkan                                         |

Gunakan `payloadOutcomes` ketika sebuah batch mencampur payload yang dikirim, disupresi, dan gagal.
Jangan menyimpulkan pembatalan hook dari hasil pengiriman langsung
lama yang kosong.

## Penerimaan pengiriman tertunda

Gunakan `message.durableFinal.admitDeferredDelivery(...)` ketika akun yang telah di-resolve
tidak dapat menerima pengiriman keluar atau tertunda yang dikelola inti dengan aman. Inti memanggil
hook ini secara sinkron sebelum pekerjaan keluar langsung, termasuk jalur yang melewati
penyimpanan antrean, dan sekali lagi sebelum memutar ulang intent yang dipulihkan. Konteksnya
mencakup `cfg`, `channel`, `to`, `accountId`, dan `phase` berupa `live` atau
`recovery`.

Kembalikan `{ status: "allowed" }` untuk melanjutkan. Kembalikan
`{ status: "permanent_rejection", reason }` ketika pengiriman tidak boleh
disimpan, dikirim secara langsung, atau diputar ulang. Penolakan langsung gagal sebelum pembuatan
antrean, hook pesan, atau pekerjaan platform. Penolakan pemulihan menandai
rekaman yang diantrekan sebagai gagal dan melewati rekonsiliasi serta pemutaran ulang. Tidak menyertakan hook
berarti diizinkan.

Hook adalah keputusan penerimaan sinkron, bukan jalur pengiriman. Baca hanya
konfigurasi atau status runtime yang sudah dimuat; jangan melakukan I/O jaringan,
sistem berkas, atau I/O asinkron lainnya. Pengujian kontrak harus menjalankan kedua fase dan kedua
varian hasil melalui `ChannelMessageDurableFinalAdapter` dari
`openclaw/plugin-sdk/channel-outbound`.

## Pengiriman kompatibilitas

Susun pengiriman balasan masuk melalui `dispatchChannelInboundReply(...)`
dari `channel-inbound`. Pertahankan pengiriman platform di adaptor pengiriman; gunakan
`channel-outbound` untuk adaptor pesan, pengiriman tahan lama, tanda terima, pratinjau
langsung, dan opsi pipeline balasan.
