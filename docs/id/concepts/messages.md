---
read_when:
    - Menjelaskan bagaimana pesan masuk menjadi balasan
    - Menjelaskan sesi, mode antrean, atau perilaku streaming
    - Mendokumentasikan visibilitas penalaran dan implikasi penggunaan
summary: Alur pesan, sesi, pengantrean, dan visibilitas penalaran
title: Pesan
x-i18n:
    generated_at: "2026-05-04T07:03:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 15242e21fd17a9f2013561003e108d197204d834caf51bbcdc53ffb3f118b14f
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw menangani pesan masuk melalui pipeline resolusi sesi, antrean, streaming, eksekusi alat, dan visibilitas penalaran. Halaman ini memetakan jalur dari pesan masuk hingga balasan.

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

Saluran dapat mengirim ulang pesan yang sama setelah koneksi ulang. OpenClaw menyimpan cache berumur pendek dengan kunci saluran/akun/rekan/sesi/id pesan sehingga pengiriman duplikat tidak memicu run agen lain.

## Debouncing masuk

Pesan beruntun cepat dari **pengirim yang sama** dapat digabungkan menjadi satu giliran agen melalui `messages.inbound`. Debouncing dicakup per saluran + percakapan dan menggunakan pesan terbaru untuk threading/ID balasan.

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

- Debounce berlaku untuk pesan **hanya teks**; media/lampiran langsung mem-flush.
- Perintah kontrol melewati debouncing agar tetap berdiri sendiri — **kecuali** ketika saluran secara eksplisit ikut serta dalam penggabungan DM dari pengirim yang sama (mis. [BlueBubbles `coalesceSameSenderDms`](/id/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)), di mana perintah DM menunggu di dalam jendela debounce agar payload split-send dapat bergabung dengan giliran agen yang sama.

## Sesi dan perangkat

Sesi dimiliki oleh Gateway, bukan oleh klien.

- Chat langsung digabungkan ke kunci sesi utama agen.
- Grup/saluran mendapatkan kunci sesi masing-masing.
- Penyimpanan sesi dan transkrip berada di host Gateway.

Beberapa perangkat/saluran dapat dipetakan ke sesi yang sama, tetapi riwayat tidak sepenuhnya disinkronkan kembali ke setiap klien. Rekomendasi: gunakan satu perangkat utama untuk percakapan panjang agar menghindari konteks yang menyimpang. Control UI dan TUI selalu menampilkan transkrip sesi yang didukung Gateway, sehingga keduanya menjadi sumber kebenaran.

Detail: [Manajemen sesi](/id/concepts/session).

## Metadata hasil alat

`content` hasil alat adalah hasil yang terlihat oleh model. `details` hasil alat adalah metadata runtime untuk rendering UI, diagnostik, pengiriman media, dan Plugin.

OpenClaw menjaga batas itu tetap eksplisit:

- `toolResult.details` dihapus sebelum replay penyedia dan input Compaction.
- Transkrip sesi yang dipersistensi hanya menyimpan `details` yang dibatasi; metadata terlalu besar diganti dengan ringkasan ringkas bertanda `persistedDetailsTruncated: true`.
- Plugin dan alat harus menaruh teks yang harus dibaca model di `content`, bukan hanya di `details`.

## Isi masuk dan konteks riwayat

OpenClaw memisahkan **isi prompt** dari **isi perintah**:

- `BodyForAgent`: teks utama yang menghadap model untuk pesan saat ini. Plugin saluran harus menjaga ini tetap berfokus pada teks pengirim saat ini yang memuat prompt.
- `Body`: fallback prompt legacy. Ini dapat mencakup amplop saluran dan wrapper riwayat opsional, tetapi saluran saat ini tidak boleh mengandalkannya sebagai input model utama ketika `BodyForAgent` tersedia.
- `CommandBody`: teks pengguna mentah untuk parsing direktif/perintah.
- `RawBody`: alias legacy untuk `CommandBody` (dipertahankan untuk kompatibilitas).

Ketika saluran menyediakan riwayat, saluran menggunakan wrapper bersama:

- `[Pesan chat sejak balasan terakhir Anda - untuk konteks]`
- `[Pesan saat ini - tanggapi ini]`

Untuk **chat non-langsung** (grup/saluran/ruang), **isi pesan saat ini** diawali dengan label pengirim (gaya yang sama dengan entri riwayat). Ini menjaga pesan real-time dan antrean/riwayat tetap konsisten dalam prompt agen.

Buffer riwayat bersifat **hanya tertunda**: buffer menyertakan pesan grup yang _tidak_ memicu run (misalnya, pesan yang dibatasi mention) dan **mengecualikan** pesan yang sudah ada di transkrip sesi.

Penghapusan direktif hanya berlaku pada bagian **pesan saat ini** sehingga riwayat tetap utuh. Saluran yang membungkus riwayat harus mengatur `CommandBody` (atau `RawBody`) ke teks pesan asli dan menjaga `Body` sebagai prompt gabungan. Riwayat terstruktur, balasan, pesan yang diteruskan, dan metadata saluran dirender sebagai blok konteks tidak tepercaya berperan pengguna selama penyusunan prompt.
Buffer riwayat dapat dikonfigurasi melalui `messages.groupChat.historyLimit` (default global) dan override per saluran seperti `channels.slack.historyLimit` atau `channels.telegram.accounts.<id>.historyLimit` (atur `0` untuk menonaktifkan).

## Antrean dan tindak lanjut

Jika run sudah aktif, pesan masuk dapat dimasukkan ke antrean, diarahkan ke run saat ini, atau dikumpulkan untuk giliran tindak lanjut.

- Konfigurasikan melalui `messages.queue` (dan `messages.queue.byChannel`).
- Mode default adalah `steer`, dengan debounce tindak lanjut 500ms ketika pengarahan fallback ke pengiriman tindak lanjut yang diantrekan.
- Mode: `steer`, `followup`, `collect`, `steer-backlog`, `interrupt`, dan mode legacy satu-per-satu `queue`.

Detail: [Antrean perintah](/id/concepts/queue) dan [Antrean pengarahan](/id/concepts/queue-steering).

## Kepemilikan run saluran

Plugin saluran dapat mempertahankan urutan, melakukan debounce input, dan menerapkan backpressure transport sebelum pesan masuk ke antrean sesi. Plugin tidak boleh memberlakukan timeout terpisah di sekitar giliran agen itu sendiri. Setelah pesan dirutekan ke sesi, pekerjaan berjalan lama diatur oleh lifecycle sesi, alat, dan runtime sehingga semua saluran melaporkan dan memulihkan giliran lambat secara konsisten.

## Streaming, pemotongan, dan batching

Streaming blok mengirim balasan parsial saat model menghasilkan blok teks. Pemotongan menghormati batas teks saluran dan menghindari pemisahan kode berpagar.

Pengaturan utama:

- `agents.defaults.blockStreamingDefault` (`on|off`, default nonaktif)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (batching berbasis idle)
- `agents.defaults.humanDelay` (jeda seperti manusia di antara balasan blok)
- Override saluran: `*.blockStreaming` dan `*.blockStreamingCoalesce` (saluran non-Telegram memerlukan `*.blockStreaming: true` eksplisit)

Detail: [Streaming + pemotongan](/id/concepts/streaming).

## Visibilitas penalaran dan token

OpenClaw dapat mengekspos atau menyembunyikan penalaran model:

- `/reasoning on|off|stream` mengontrol visibilitas.
- Konten penalaran tetap dihitung terhadap penggunaan token ketika dihasilkan oleh model.
- Telegram mendukung stream penalaran ke gelembung draf sementara yang dihapus setelah pengiriman final; gunakan `/reasoning on` untuk output penalaran persisten.

Detail: [Direktif berpikir + penalaran](/id/tools/thinking) dan [Penggunaan token](/id/reference/token-use).

## Prefiks, threading, dan balasan

Pemformatan pesan keluar dipusatkan di `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix`, dan `channels.<channel>.accounts.<id>.responsePrefix` (kaskade prefiks keluar), plus `channels.whatsapp.messagePrefix` (prefiks masuk WhatsApp)
- Threading balasan melalui `replyToMode` dan default per saluran

Detail: [Konfigurasi](/id/gateway/config-agents#messages) dan dokumentasi saluran.

## Balasan senyap

Token senyap persis `NO_REPLY` / `no_reply` berarti “jangan kirim balasan yang terlihat pengguna”.
Ketika sebuah giliran juga memiliki media alat yang tertunda, seperti audio TTS yang dihasilkan, OpenClaw menghapus teks senyap tetapi tetap mengirim lampiran media.
OpenClaw menyelesaikan perilaku tersebut berdasarkan jenis percakapan:

- Percakapan langsung melarang kesenyapan secara default dan menulis ulang balasan senyap polos menjadi fallback pendek yang terlihat.
- Grup/saluran mengizinkan kesenyapan secara default.
- Orkestrasi internal mengizinkan kesenyapan secara default.

OpenClaw juga menggunakan balasan senyap untuk kegagalan runner internal yang terjadi sebelum balasan asisten apa pun dalam chat non-langsung, sehingga grup/saluran tidak melihat boilerplate error Gateway. Chat langsung menampilkan teks kegagalan ringkas secara default; detail runner mentah hanya ditampilkan ketika `/verbose` adalah `on` atau `full`.

Default berada di bawah `agents.defaults.silentReply` dan `agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` dan `surfaces.<id>.silentReplyRewrite` dapat meng-override keduanya per surface.

Ketika sesi induk memiliki satu atau beberapa run subagen yang di-spawn yang masih tertunda, balasan senyap polos dibuang di semua surface alih-alih ditulis ulang, sehingga induk tetap diam hingga event penyelesaian anak mengirim balasan sebenarnya.

## Terkait

- [Streaming](/id/concepts/streaming) — pengiriman pesan real-time
- [Coba lagi](/id/concepts/retry) — perilaku coba ulang pengiriman pesan
- [Antrean](/id/concepts/queue) — antrean pemrosesan pesan
- [Saluran](/id/channels) — integrasi platform perpesanan
