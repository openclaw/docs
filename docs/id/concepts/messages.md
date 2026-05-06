---
read_when:
    - Menjelaskan bagaimana pesan masuk menjadi balasan
    - Mengklarifikasi sesi, mode antrean, atau perilaku streaming
    - Mendokumentasikan visibilitas penalaran dan implikasi penggunaan
summary: Alur pesan, sesi, pengantrean, dan visibilitas penalaran
title: Pesan
x-i18n:
    generated_at: "2026-05-06T09:07:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: e1cb21bb1ecfb90c91f5117c76378248f846ace16401c226986ab3cca40a3e33
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

Kenop utama berada di konfigurasi:

- `messages.*` untuk prefiks, antrean, dan perilaku grup.
- `agents.defaults.*` untuk default streaming blok dan pemotongan.
- Override channel (`channels.whatsapp.*`, `channels.telegram.*`, dll.) untuk batas dan toggle streaming.

Lihat [Konfigurasi](/id/gateway/configuration) untuk skema lengkap.

## Deduplikasi masuk

Channel dapat mengirim ulang pesan yang sama setelah tersambung kembali. OpenClaw menyimpan cache berumur pendek yang dikunci berdasarkan channel/akun/peer/sesi/id pesan sehingga pengiriman duplikat tidak memicu run agen lain.

## Debouncing masuk

Pesan beruntun yang cepat dari **pengirim yang sama** dapat digabungkan menjadi satu giliran agen melalui `messages.inbound`. Debouncing dibatasi per channel + percakapan dan menggunakan pesan terbaru untuk threading/ID balasan.

Konfigurasi (default global + override per channel):

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
- Perintah kontrol melewati debouncing agar tetap berdiri sendiri — **kecuali** saat channel secara eksplisit memilih penggabungan DM pengirim-sama (mis. [BlueBubbles `coalesceSameSenderDms`](/id/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)), di mana perintah DM menunggu di dalam jendela debounce agar payload split-send dapat bergabung dalam giliran agen yang sama.

## Sesi dan perangkat

Sesi dimiliki oleh Gateway, bukan oleh klien.

- Chat langsung disatukan ke dalam kunci sesi utama agen.
- Grup/channel mendapat kunci sesi sendiri.
- Penyimpanan sesi dan transkrip berada di host Gateway.

Beberapa perangkat/channel dapat dipetakan ke sesi yang sama, tetapi riwayat tidak sepenuhnya disinkronkan kembali ke setiap klien. Rekomendasi: gunakan satu perangkat utama untuk percakapan panjang agar konteks tidak menyimpang. Control UI dan TUI selalu menampilkan transkrip sesi yang didukung Gateway, sehingga keduanya menjadi sumber kebenaran.

Detail: [Manajemen sesi](/id/concepts/session).

## Metadata hasil alat

`content` hasil alat adalah hasil yang terlihat oleh model. `details` hasil alat adalah metadata runtime untuk rendering UI, diagnostik, pengiriman media, dan plugins.

OpenClaw menjaga batas itu tetap eksplisit:

- `toolResult.details` dihapus sebelum replay provider dan input compaction.
- Transkrip sesi yang dipersisten hanya menyimpan `details` yang dibatasi; metadata yang terlalu besar diganti dengan ringkasan ringkas bertanda `persistedDetailsTruncated: true`.
- Plugins dan alat harus menaruh teks yang perlu dibaca model di `content`, bukan hanya di `details`.

## Isi masuk dan konteks riwayat

OpenClaw memisahkan **isi prompt** dari **isi perintah**:

- `BodyForAgent`: teks utama yang menghadap model untuk pesan saat ini. Plugins channel harus menjaga ini tetap fokus pada teks pengirim saat ini yang membawa prompt.
- `Body`: fallback prompt lama. Ini dapat mencakup amplop channel dan pembungkus riwayat opsional, tetapi channel saat ini tidak boleh mengandalkannya sebagai input model utama saat `BodyForAgent` tersedia.
- `CommandBody`: teks pengguna mentah untuk parsing direktif/perintah.
- `RawBody`: alias lama untuk `CommandBody` (dipertahankan untuk kompatibilitas).

Saat channel menyediakan riwayat, channel menggunakan pembungkus bersama:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Untuk **chat non-langsung** (grup/channel/ruang), **isi pesan saat ini** diberi prefiks label pengirim (gaya yang sama dengan entri riwayat). Ini menjaga pesan real-time dan antrean/riwayat tetap konsisten dalam prompt agen.

Buffer riwayat bersifat **hanya tertunda**: buffer mencakup pesan grup yang _tidak_ memicu run (misalnya, pesan yang dibatasi penyebutan) dan **mengecualikan** pesan yang sudah ada di transkrip sesi.

Penghapusan direktif hanya berlaku pada bagian **pesan saat ini** sehingga riwayat tetap utuh. Channel yang membungkus riwayat harus mengatur `CommandBody` (atau `RawBody`) ke teks pesan asli dan menjaga `Body` sebagai prompt gabungan. Riwayat terstruktur, balasan, pesan diteruskan, dan metadata channel dirender sebagai blok konteks tidak tepercaya dengan peran pengguna selama penyusunan prompt.
Buffer riwayat dapat dikonfigurasi melalui `messages.groupChat.historyLimit` (default global) dan override per channel seperti `channels.slack.historyLimit` atau `channels.telegram.accounts.<id>.historyLimit` (atur `0` untuk menonaktifkan).

## Antrean dan tindak lanjut

Jika sebuah run sudah aktif, pesan masuk dapat dimasukkan ke antrean, diarahkan ke run saat ini, atau dikumpulkan untuk giliran tindak lanjut.

- Konfigurasikan melalui `messages.queue` (dan `messages.queue.byChannel`).
- Mode default adalah `steer`, dengan debounce tindak lanjut 500 md saat pengarahan kembali ke pengiriman tindak lanjut yang diantrekan.
- Mode: `steer`, `followup`, `collect`, `steer-backlog`, `interrupt`, dan mode lama satu-per-satu `queue`.

Detail: [Antrean perintah](/id/concepts/queue) dan [Antrean pengarahan](/id/concepts/queue-steering).

## Kepemilikan run channel

Plugins channel dapat mempertahankan urutan, melakukan debounce input, dan menerapkan backpressure transport sebelum pesan masuk ke antrean sesi. Plugins tidak boleh memberlakukan timeout terpisah di sekitar giliran agen itu sendiri. Setelah pesan dirutekan ke sesi, pekerjaan berjalan lama diatur oleh siklus hidup sesi, alat, dan runtime sehingga semua channel melaporkan dan pulih dari giliran yang lambat secara konsisten.

## Streaming, pemotongan, dan batching

Streaming blok mengirim balasan parsial saat model menghasilkan blok teks.
Pemotongan menghormati batas teks channel dan menghindari pemisahan kode berpagar.

Pengaturan utama:

- `agents.defaults.blockStreamingDefault` (`on|off`, default nonaktif)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (batching berbasis idle)
- `agents.defaults.humanDelay` (jeda mirip manusia di antara balasan blok)
- Override channel: `*.blockStreaming` dan `*.blockStreamingCoalesce` (channel non-Telegram memerlukan `*.blockStreaming: true` eksplisit)

Detail: [Streaming + pemotongan](/id/concepts/streaming).

## Visibilitas penalaran dan token

OpenClaw dapat mengekspos atau menyembunyikan penalaran model:

- `/reasoning on|off|stream` mengontrol visibilitas.
- Konten penalaran tetap dihitung terhadap penggunaan token saat dihasilkan oleh model.
- Telegram mendukung streaming penalaran ke gelembung draf sementara yang dihapus setelah pengiriman final; gunakan `/reasoning on` untuk output penalaran persisten.

Detail: [Direktif berpikir + penalaran](/id/tools/thinking) dan [Penggunaan token](/id/reference/token-use).

## Prefiks, threading, dan balasan

Pemformatan pesan keluar dipusatkan di `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix`, dan `channels.<channel>.accounts.<id>.responsePrefix` (cascade prefiks keluar), plus `channels.whatsapp.messagePrefix` (prefiks masuk WhatsApp)
- Threading balasan melalui `replyToMode` dan default per channel

Detail: [Konfigurasi](/id/gateway/config-agents#messages) dan dokumentasi channel.

## Balasan senyap

Token senyap persis `NO_REPLY` / `no_reply` berarti "jangan kirim balasan yang terlihat oleh pengguna".
Saat giliran juga memiliki media alat yang tertunda, seperti audio TTS yang dihasilkan, OpenClaw menghapus teks senyap tetapi tetap mengirim lampiran media.
OpenClaw menyelesaikan perilaku itu berdasarkan jenis percakapan:

- Percakapan langsung menolak kesenyapan secara default dan menulis ulang balasan senyap polos menjadi fallback singkat yang terlihat.
- Grup/channel mengizinkan kesenyapan secara default.
- Orkestrasi internal mengizinkan kesenyapan secara default.

OpenClaw juga menggunakan balasan senyap untuk kegagalan runner internal yang terjadi sebelum balasan asisten apa pun dalam chat non-langsung, sehingga grup/channel tidak melihat teks standar error Gateway. Chat langsung menampilkan salinan kegagalan ringkas secara default; detail runner mentah hanya ditampilkan saat `/verbose` bernilai `on` atau `full`.

Default berada di bawah `agents.defaults.silentReply` dan `agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` dan `surfaces.<id>.silentReplyRewrite` dapat menimpanya per surface.

Saat sesi induk memiliki satu atau lebih run subagen hasil spawn yang tertunda, balasan senyap polos dihapus di semua surface alih-alih ditulis ulang, sehingga induk tetap diam sampai event penyelesaian anak mengirim balasan sebenarnya.

## Terkait

- [Refaktor siklus hidup pesan](/id/concepts/message-lifecycle-refactor) - target desain kirim dan terima yang tahan lama
- [Streaming](/id/concepts/streaming) — pengiriman pesan real-time
- [Coba lagi](/id/concepts/retry) — perilaku coba lagi pengiriman pesan
- [Antrean](/id/concepts/queue) — antrean pemrosesan pesan
- [Channel](/id/channels) — integrasi platform perpesanan
