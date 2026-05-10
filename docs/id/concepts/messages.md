---
read_when:
    - Menjelaskan bagaimana pesan masuk menjadi balasan
    - Memperjelas sesi, mode antrean, atau perilaku pengaliran
    - Mendokumentasikan visibilitas penalaran dan implikasi penggunaan
summary: Alur pesan, sesi, antrean, dan visibilitas penalaran
title: Pesan
x-i18n:
    generated_at: "2026-05-10T19:31:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 053ff7b2ecca07e99057aed2f9ba199a6c1a07f15e865915045d25d128db984b
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

Kenop utama berada dalam konfigurasi:

- `messages.*` untuk prefiks, antrean, dan perilaku grup.
- `agents.defaults.*` untuk default streaming blok dan pemotongan.
- Override kanal (`channels.whatsapp.*`, `channels.telegram.*`, dll.) untuk batas dan toggle streaming.

Lihat [Konfigurasi](/id/gateway/configuration) untuk skema lengkap.

## Deduplikasi masuk

Kanal dapat mengirim ulang pesan yang sama setelah koneksi ulang. OpenClaw menyimpan cache berumur pendek dengan kunci kanal/akun/rekan/sesi/id pesan sehingga pengiriman duplikat tidak memicu run agen lain.

## Debouncing masuk

Pesan berurutan cepat dari **pengirim yang sama** dapat digabungkan menjadi satu giliran agen melalui `messages.inbound`. Debouncing dibatasi per kanal + percakapan dan menggunakan pesan terbaru untuk threading/id balasan.

Konfigurasi (default global + override per kanal):

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

- Debounce berlaku untuk pesan **hanya teks**; media/lampiran langsung di-flush.
- Perintah kontrol melewati debouncing agar tetap berdiri sendiri. Kanal yang secara eksplisit ikut serta dalam penggabungan DM dari pengirim yang sama dapat mempertahankan perintah DM di dalam jendela debounce sehingga payload yang dikirim terpisah dapat bergabung dalam giliran agen yang sama.

## Sesi dan perangkat

Sesi dimiliki oleh gateway, bukan oleh klien.

- Chat langsung diciutkan ke kunci sesi utama agen.
- Grup/kanal mendapatkan kunci sesi sendiri.
- Penyimpanan sesi dan transkrip berada di host gateway.

Beberapa perangkat/kanal dapat dipetakan ke sesi yang sama, tetapi riwayat tidak sepenuhnya disinkronkan kembali ke setiap klien. Rekomendasi: gunakan satu perangkat utama untuk percakapan panjang guna menghindari konteks yang menyimpang. UI Kontrol dan TUI selalu menampilkan transkrip sesi berbasis gateway, sehingga keduanya merupakan sumber kebenaran.

Detail: [Manajemen sesi](/id/concepts/session).

## Metadata hasil alat

`content` hasil alat adalah hasil yang terlihat oleh model. `details` hasil alat adalah metadata runtime untuk rendering UI, diagnostik, pengiriman media, dan plugin.

OpenClaw menjaga batas tersebut tetap eksplisit:

- `toolResult.details` dihapus sebelum replay provider dan input compaction.
- Transkrip sesi yang dipersisten hanya menyimpan `details` yang dibatasi; metadata yang terlalu besar diganti dengan ringkasan ringkas yang ditandai `persistedDetailsTruncated: true`.
- Plugin dan alat harus menaruh teks yang harus dibaca model di `content`, bukan hanya di `details`.

## Isi masuk dan konteks riwayat

OpenClaw memisahkan **isi prompt** dari **isi perintah**:

- `BodyForAgent`: teks utama yang menghadap model untuk pesan saat ini. Plugin kanal harus menjaga ini tetap fokus pada teks terkini pengirim yang memuat prompt.
- `Body`: fallback prompt lama. Ini dapat mencakup envelope kanal dan wrapper riwayat opsional, tetapi kanal saat ini tidak boleh mengandalkannya sebagai input model utama ketika `BodyForAgent` tersedia.
- `CommandBody`: teks pengguna mentah untuk parsing direktif/perintah.
- `RawBody`: alias lama untuk `CommandBody` (dipertahankan untuk kompatibilitas).

Ketika kanal menyediakan riwayat, kanal menggunakan wrapper bersama:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Untuk **chat non-langsung** (grup/kanal/ruang), **isi pesan saat ini** diberi prefiks label pengirim (gaya yang sama digunakan untuk entri riwayat). Ini menjaga pesan real-time dan pesan antrean/riwayat tetap konsisten dalam prompt agen.

Buffer riwayat bersifat **hanya pending**: buffer menyertakan pesan grup yang _tidak_ memicu run (misalnya, pesan yang dibatasi mention) dan **mengecualikan** pesan yang sudah ada dalam transkrip sesi.

Penghapusan direktif hanya berlaku pada bagian **pesan saat ini** sehingga riwayat tetap utuh. Kanal yang membungkus riwayat harus menyetel `CommandBody` (atau `RawBody`) ke teks pesan asli dan mempertahankan `Body` sebagai prompt gabungan. Riwayat terstruktur, balasan, pesan yang diteruskan, dan metadata kanal dirender sebagai blok konteks tidak tepercaya berperan pengguna selama perakitan prompt.
Buffer riwayat dapat dikonfigurasi melalui `messages.groupChat.historyLimit` (default global) dan override per kanal seperti `channels.slack.historyLimit` atau `channels.telegram.accounts.<id>.historyLimit` (setel `0` untuk menonaktifkan).

## Antrean dan tindak lanjut

Jika run sudah aktif, pesan masuk dapat diantrekan, diarahkan ke run saat ini, atau dikumpulkan untuk giliran tindak lanjut.

- Konfigurasikan melalui `messages.queue` (dan `messages.queue.byChannel`).
- Mode default adalah `steer`, dengan debounce tindak lanjut 500 md ketika pengarahan fallback ke pengiriman tindak lanjut yang diantrekan.
- Mode: `steer`, `followup`, `collect`, `steer-backlog`, `interrupt`, dan mode lama satu-per-satu `queue`.

Detail: [Antrean perintah](/id/concepts/queue) dan [Antrean pengarahan](/id/concepts/queue-steering).

## Kepemilikan run kanal

Plugin kanal dapat mempertahankan pengurutan, melakukan debounce input, dan menerapkan backpressure transport sebelum pesan memasuki antrean sesi. Plugin kanal tidak boleh menerapkan timeout terpisah di sekitar giliran agen itu sendiri. Setelah pesan dirutekan ke sesi, pekerjaan berdurasi panjang diatur oleh siklus hidup sesi, alat, dan runtime sehingga semua kanal melaporkan dan pulih dari giliran lambat secara konsisten.

## Streaming, pemotongan, dan batching

Streaming blok mengirim balasan parsial saat model menghasilkan blok teks. Pemotongan menghormati batas teks kanal dan menghindari pemisahan kode berpagar.

Pengaturan utama:

- `agents.defaults.blockStreamingDefault` (`on|off`, default mati)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (batching berbasis idle)
- `agents.defaults.humanDelay` (jeda mirip manusia di antara balasan blok)
- Override kanal: `*.blockStreaming` dan `*.blockStreamingCoalesce` (kanal non-Telegram memerlukan `*.blockStreaming: true` eksplisit)

Detail: [Streaming + pemotongan](/id/concepts/streaming).

## Visibilitas penalaran dan token

OpenClaw dapat mengekspos atau menyembunyikan penalaran model:

- `/reasoning on|off|stream` mengontrol visibilitas.
- Konten penalaran tetap dihitung terhadap penggunaan token ketika dihasilkan oleh model.
- Telegram mendukung streaming penalaran ke gelembung draf sementara yang dihapus setelah pengiriman final; gunakan `/reasoning on` untuk keluaran penalaran persisten.

Detail: [Direktif berpikir + penalaran](/id/tools/thinking) dan [Penggunaan token](/id/reference/token-use).

## Prefiks, threading, dan balasan

Pemformatan pesan keluar dipusatkan di `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix`, dan `channels.<channel>.accounts.<id>.responsePrefix` (kaskade prefiks keluar), ditambah `channels.whatsapp.messagePrefix` (prefiks masuk WhatsApp)
- Threading balasan melalui `replyToMode` dan default per kanal

Detail: [Konfigurasi](/id/gateway/config-agents#messages) dan dokumentasi kanal.

## Balasan senyap

Token senyap persis `NO_REPLY` / `no_reply` berarti "jangan kirim balasan yang terlihat oleh pengguna".
Ketika sebuah giliran juga memiliki media alat yang tertunda, seperti audio TTS yang dihasilkan, OpenClaw menghapus teks senyap tetapi tetap mengirim lampiran media.
OpenClaw menyelesaikan perilaku tersebut berdasarkan jenis percakapan:

- Percakapan langsung secara default tidak mengizinkan senyap dan menulis ulang balasan senyap polos menjadi fallback singkat yang terlihat.
- Grup/kanal secara default mengizinkan senyap.
- Orkestrasi internal secara default mengizinkan senyap.

OpenClaw juga menggunakan balasan senyap untuk kegagalan runner internal yang terjadi sebelum balasan asisten apa pun dalam chat non-langsung, sehingga grup/kanal tidak melihat boilerplate galat gateway. Chat langsung menampilkan salinan kegagalan ringkas secara default; detail runner mentah hanya ditampilkan ketika `/verbose` adalah `on` atau `full`.

Default berada di bawah `agents.defaults.silentReply` dan `agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` dan `surfaces.<id>.silentReplyRewrite` dapat meng-override keduanya per surface.

Ketika sesi induk memiliki satu atau beberapa run subagen yang dibuat dan tertunda, balasan senyap polos dibuang di semua surface alih-alih ditulis ulang, sehingga induk tetap diam hingga event penyelesaian anak mengirim balasan sebenarnya.

## Terkait

- [Refaktor siklus hidup pesan](/id/concepts/message-lifecycle-refactor) - target desain pengiriman dan penerimaan yang tahan lama
- [Streaming](/id/concepts/streaming) — pengiriman pesan real-time
- [Coba ulang](/id/concepts/retry) — perilaku coba ulang pengiriman pesan
- [Antrean](/id/concepts/queue) — antrean pemrosesan pesan
- [Kanal](/id/channels) — integrasi platform perpesanan
