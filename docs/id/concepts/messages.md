---
read_when:
    - Menjelaskan bagaimana pesan masuk menjadi balasan
    - Mengklarifikasi sesi, mode antrean, atau perilaku streaming
    - Mendokumentasikan visibilitas penalaran dan implikasi penggunaan
summary: Alur pesan, sesi, pengantrean, dan visibilitas penalaran
title: Pesan
x-i18n:
    generated_at: "2026-04-30T09:44:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: dcfcc995995516b627993755b255a779c681b4976d2d724c0c11e87875e37b1e
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw menangani pesan masuk melalui pipeline resolusi sesi, antrean, streaming, eksekusi alat, dan visibilitas penalaran. Halaman ini memetakan alur dari pesan masuk hingga balasan.

## Alur pesan (tingkat tinggi)

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

Knob utama berada di konfigurasi:

- `messages.*` untuk prefiks, antrean, dan perilaku grup.
- `agents.defaults.*` untuk default streaming blok dan pemotongan.
- Override saluran (`channels.whatsapp.*`, `channels.telegram.*`, dll.) untuk batas dan toggle streaming.

Lihat [Konfigurasi](/id/gateway/configuration) untuk skema lengkap.

## Deduplikasi masuk

Saluran dapat mengirim ulang pesan yang sama setelah koneksi ulang. OpenClaw menyimpan cache berumur pendek yang dikunci berdasarkan saluran/akun/peer/sesi/id pesan agar pengiriman duplikat tidak memicu run agen lain.

## Debouncing masuk

Pesan beruntun yang cepat dari **pengirim yang sama** dapat digabungkan menjadi satu giliran agen melalui `messages.inbound`. Debouncing dibatasi per saluran + percakapan dan menggunakan pesan terbaru untuk threading/ID balasan.

Konfigurasi (default global + override per saluran):

```json5
{
  messages: {
    inbound: {
      debounceMs: 2000,
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
        discord: 1500,
      },
    },
  },
}
```

Catatan:

- Debounce berlaku untuk pesan **hanya teks**; media/lampiran langsung dikirim.
- Perintah kontrol melewati debouncing agar tetap berdiri sendiri — **kecuali** ketika saluran secara eksplisit memilih ikut penggabungan DM dari pengirim yang sama (mis. [BlueBubbles `coalesceSameSenderDms`](/id/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)), tempat perintah DM menunggu di dalam jendela debounce agar payload kirim-terpisah dapat bergabung ke giliran agen yang sama.

## Sesi dan perangkat

Sesi dimiliki oleh Gateway, bukan oleh klien.

- Chat langsung digabungkan ke kunci sesi utama agen.
- Grup/saluran mendapatkan kunci sesi sendiri.
- Penyimpanan sesi dan transkrip berada di host Gateway.

Beberapa perangkat/saluran dapat dipetakan ke sesi yang sama, tetapi riwayat tidak disinkronkan penuh kembali ke setiap klien. Rekomendasi: gunakan satu perangkat utama untuk percakapan panjang guna menghindari konteks yang menyimpang. Control UI dan TUI selalu menampilkan transkrip sesi yang didukung Gateway, sehingga keduanya menjadi sumber kebenaran.

Detail: [Manajemen sesi](/id/concepts/session).

## Metadata hasil alat

`content` hasil alat adalah hasil yang terlihat oleh model. `details` hasil alat adalah metadata runtime untuk rendering UI, diagnostik, pengiriman media, dan plugin.

OpenClaw menjaga batas tersebut tetap eksplisit:

- `toolResult.details` dihapus sebelum replay penyedia dan input Compaction.
- Transkrip sesi yang dipersistenkan hanya menyimpan `details` yang dibatasi; metadata yang terlalu besar diganti dengan ringkasan ringkas bertanda `persistedDetailsTruncated: true`.
- Plugin dan alat harus menaruh teks yang wajib dibaca model di `content`, bukan hanya di `details`.

## Isi masuk dan konteks riwayat

OpenClaw memisahkan **isi prompt** dari **isi perintah**:

- `Body`: teks prompt yang dikirim ke agen. Ini dapat mencakup envelope saluran dan wrapper riwayat opsional.
- `CommandBody`: teks mentah pengguna untuk parsing direktif/perintah.
- `RawBody`: alias lama untuk `CommandBody` (dipertahankan untuk kompatibilitas).

Ketika saluran menyediakan riwayat, saluran menggunakan wrapper bersama:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Untuk **chat non-langsung** (grup/saluran/ruang), **isi pesan saat ini** diberi prefiks dengan label pengirim (gaya yang sama digunakan untuk entri riwayat). Ini menjaga pesan real-time dan antrean/riwayat tetap konsisten dalam prompt agen.

Buffer riwayat bersifat **hanya-tertunda**: buffer ini mencakup pesan grup yang _tidak_ memicu run (misalnya, pesan yang dibatasi mention) dan **mengecualikan** pesan yang sudah ada dalam transkrip sesi.

Penghapusan direktif hanya berlaku pada bagian **pesan saat ini** sehingga riwayat tetap utuh. Saluran yang membungkus riwayat harus menetapkan `CommandBody` (atau `RawBody`) ke teks pesan asli dan menjaga `Body` sebagai prompt gabungan. Buffer riwayat dapat dikonfigurasi melalui `messages.groupChat.historyLimit` (default global) dan override per saluran seperti `channels.slack.historyLimit` atau `channels.telegram.accounts.<id>.historyLimit` (atur `0` untuk menonaktifkan).

## Antrean dan tindak lanjut

Jika run sudah aktif, pesan masuk dapat diantrekan, diarahkan ke run saat ini, atau dikumpulkan untuk giliran tindak lanjut.

- Konfigurasikan melalui `messages.queue` (dan `messages.queue.byChannel`).
- Mode default adalah `steer`, dengan debounce tindak lanjut 500 md ketika pengarahan fallback ke pengiriman tindak lanjut yang diantrekan.
- Mode: `steer`, `followup`, `collect`, `steer-backlog`, `interrupt`, dan mode lama satu-per-satu `queue`.

Detail: [Antrean perintah](/id/concepts/queue) dan [Antrean pengarahan](/id/concepts/queue-steering).

## Kepemilikan run saluran

Plugin saluran dapat mempertahankan urutan, men-debounce input, dan menerapkan backpressure transport sebelum pesan masuk ke antrean sesi. Plugin tersebut tidak boleh memberlakukan timeout terpisah di sekitar giliran agen itu sendiri. Setelah pesan dirutekan ke sebuah sesi, pekerjaan yang berjalan lama diatur oleh siklus hidup sesi, alat, dan runtime sehingga semua saluran melaporkan serta pulih dari giliran lambat secara konsisten.

## Streaming, pemotongan, dan batching

Streaming blok mengirim balasan parsial saat model menghasilkan blok teks. Pemotongan mematuhi batas teks saluran dan menghindari pemisahan kode berpagar.

Pengaturan utama:

- `agents.defaults.blockStreamingDefault` (`on|off`, default nonaktif)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (batching berbasis idle)
- `agents.defaults.humanDelay` (jeda seperti manusia antar balasan blok)
- Override saluran: `*.blockStreaming` dan `*.blockStreamingCoalesce` (saluran non-Telegram memerlukan `*.blockStreaming: true` eksplisit)

Detail: [Streaming + pemotongan](/id/concepts/streaming).

## Visibilitas penalaran dan token

OpenClaw dapat mengekspos atau menyembunyikan penalaran model:

- `/reasoning on|off|stream` mengontrol visibilitas.
- Konten penalaran tetap dihitung dalam penggunaan token ketika dihasilkan oleh model.
- Telegram mendukung stream penalaran ke bubble draf.

Detail: [Direktif berpikir + penalaran](/id/tools/thinking) dan [Penggunaan token](/id/reference/token-use).

## Prefiks, threading, dan balasan

Pemformatan pesan keluar dipusatkan di `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix`, dan `channels.<channel>.accounts.<id>.responsePrefix` (cascade prefiks keluar), ditambah `channels.whatsapp.messagePrefix` (prefiks masuk WhatsApp)
- Threading balasan melalui `replyToMode` dan default per saluran

Detail: [Konfigurasi](/id/gateway/config-agents#messages) dan dokumentasi saluran.

## Balasan senyap

Token senyap persis `NO_REPLY` / `no_reply` berarti “jangan kirim balasan yang terlihat pengguna”.
Ketika sebuah giliran juga memiliki media alat yang tertunda, seperti audio TTS yang dihasilkan, OpenClaw menghapus teks senyap tetapi tetap mengirim lampiran media.
OpenClaw menyelesaikan perilaku tersebut berdasarkan jenis percakapan:

- Percakapan langsung tidak mengizinkan kesenyapan secara default dan menulis ulang balasan senyap polos menjadi fallback pendek yang terlihat.
- Grup/saluran mengizinkan kesenyapan secara default.
- Orkestrasi internal mengizinkan kesenyapan secara default.

OpenClaw juga menggunakan balasan senyap untuk kegagalan runner internal yang terjadi sebelum balasan asisten apa pun dalam chat non-langsung, sehingga grup/saluran tidak melihat boilerplate kesalahan Gateway. Chat langsung menampilkan salinan kegagalan ringkas secara default; detail runner mentah hanya ditampilkan ketika `/verbose` bernilai `on` atau `full`.

Default berada di bawah `agents.defaults.silentReply` dan `agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` dan `surfaces.<id>.silentReplyRewrite` dapat meng-override-nya per surface.

Ketika sesi induk memiliki satu atau beberapa run subagen hasil spawn yang tertunda, balasan senyap polos dihapus pada semua surface alih-alih ditulis ulang, sehingga induk tetap diam sampai event penyelesaian anak mengirim balasan sebenarnya.

## Terkait

- [Streaming](/id/concepts/streaming) — pengiriman pesan real-time
- [Coba lagi](/id/concepts/retry) — perilaku coba lagi pengiriman pesan
- [Antrean](/id/concepts/queue) — antrean pemrosesan pesan
- [Saluran](/id/channels) — integrasi platform perpesanan
