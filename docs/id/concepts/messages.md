---
read_when:
    - Menjelaskan cara pesan masuk menjadi balasan
    - Memperjelas sesi, mode antrean, atau perilaku streaming
    - Mendokumentasikan visibilitas penalaran dan implikasi penggunaan
summary: Alur pesan, sesi, pengantrean, dan visibilitas penalaran
title: Pesan
x-i18n:
    generated_at: "2026-04-30T16:27:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: fdeee014d92767a725501691fbe0c4ee6b631acc9a2ab5cbbcf321bfee9679b9
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw menangani pesan masuk melalui pipeline yang mencakup resolusi sesi, antrean, streaming, eksekusi tool, dan visibilitas penalaran. Halaman ini memetakan alur dari pesan masuk hingga balasan.

## Alur pesan (tingkat tinggi)

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

Pengaturan utama berada dalam konfigurasi:

- `messages.*` untuk prefiks, antrean, dan perilaku grup.
- `agents.defaults.*` untuk default streaming blok dan chunking.
- Override saluran (`channels.whatsapp.*`, `channels.telegram.*`, dll.) untuk batas dan toggle streaming.

Lihat [Konfigurasi](/id/gateway/configuration) untuk skema lengkap.

## Deduplikasi masuk

Saluran dapat mengirim ulang pesan yang sama setelah koneksi ulang. OpenClaw menyimpan
cache berumur pendek yang dikunci berdasarkan saluran/akun/peer/sesi/id pesan sehingga
pengiriman duplikat tidak memicu agent run lain.

## Debouncing masuk

Pesan berurutan yang cepat dari **pengirim yang sama** dapat digabungkan menjadi satu
giliran agent melalui `messages.inbound`. Debouncing dibatasi per saluran + percakapan
dan menggunakan pesan terbaru untuk threading/ID balasan.

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

- Debounce berlaku untuk pesan **hanya teks**; media/lampiran langsung di-flush.
- Perintah kontrol melewati debouncing agar tetap berdiri sendiri — **kecuali** ketika suatu saluran secara eksplisit ikut serta dalam penggabungan DM dari pengirim yang sama (mis. [BlueBubbles `coalesceSameSenderDms`](/id/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)), di mana perintah DM menunggu di dalam jendela debounce sehingga payload split-send dapat bergabung dalam giliran agent yang sama.

## Sesi dan perangkat

Sesi dimiliki oleh Gateway, bukan oleh klien.

- Chat langsung dilebur ke dalam kunci sesi utama agent.
- Grup/saluran mendapatkan kunci sesinya sendiri.
- Penyimpanan sesi dan transkrip berada di host Gateway.

Beberapa perangkat/saluran dapat dipetakan ke sesi yang sama, tetapi riwayat tidak sepenuhnya
disinkronkan kembali ke setiap klien. Rekomendasi: gunakan satu perangkat utama untuk
percakapan panjang agar konteks tidak bercabang. Control UI dan TUI selalu menampilkan
transkrip sesi yang didukung Gateway, sehingga keduanya adalah sumber kebenaran.

Detail: [Manajemen sesi](/id/concepts/session).

## Metadata hasil tool

`content` hasil tool adalah hasil yang terlihat oleh model. `details` hasil tool adalah
metadata runtime untuk rendering UI, diagnostik, pengiriman media, dan Plugin.

OpenClaw menjaga batas tersebut tetap eksplisit:

- `toolResult.details` dihapus sebelum replay provider dan input compaction.
- Transkrip sesi yang dipersistenkan hanya menyimpan `details` yang dibatasi; metadata yang terlalu besar
  diganti dengan ringkasan ringkas yang ditandai `persistedDetailsTruncated: true`.
- Plugin dan tool harus menaruh teks yang harus dibaca model di `content`, bukan hanya
  di `details`.

## Isi masuk dan konteks riwayat

OpenClaw memisahkan **isi prompt** dari **isi perintah**:

- `BodyForAgent`: teks utama yang menghadap model untuk pesan saat ini. Plugin saluran
  harus menjaga ini tetap terfokus pada teks pembawa prompt saat ini dari pengirim.
- `Body`: fallback prompt lama. Ini dapat mencakup envelope saluran dan
  wrapper riwayat opsional, tetapi saluran saat ini tidak boleh mengandalkannya sebagai
  input model utama ketika `BodyForAgent` tersedia.
- `CommandBody`: teks pengguna mentah untuk parsing direktif/perintah.
- `RawBody`: alias lama untuk `CommandBody` (dipertahankan untuk kompatibilitas).

Ketika saluran menyediakan riwayat, saluran tersebut menggunakan wrapper bersama:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Untuk **chat tidak langsung** (grup/saluran/ruang), **isi pesan saat ini** diawali dengan
label pengirim (gaya yang sama dengan entri riwayat). Ini menjaga pesan real-time dan pesan
antrean/riwayat tetap konsisten dalam prompt agent.

Buffer riwayat bersifat **hanya tertunda**: mencakup pesan grup yang _tidak_
memicu run (misalnya, pesan yang dibatasi oleh mention) dan **mengecualikan** pesan
yang sudah ada dalam transkrip sesi.

Penghapusan direktif hanya berlaku pada bagian **pesan saat ini** sehingga riwayat
tetap utuh. Saluran yang membungkus riwayat harus mengatur `CommandBody` (atau
`RawBody`) ke teks pesan asli dan menjaga `Body` sebagai prompt gabungan.
Riwayat terstruktur, balasan, pesan yang diteruskan, dan metadata saluran dirender sebagai
blok konteks tidak tepercaya dengan peran pengguna saat perakitan prompt.
Buffer riwayat dapat dikonfigurasi melalui `messages.groupChat.historyLimit` (default
global) dan override per saluran seperti `channels.slack.historyLimit` atau
`channels.telegram.accounts.<id>.historyLimit` (atur `0` untuk menonaktifkan).

## Antrean dan tindak lanjut

Jika suatu run sudah aktif, pesan masuk dapat dimasukkan ke antrean, diarahkan ke
run saat ini, atau dikumpulkan untuk giliran tindak lanjut.

- Konfigurasikan melalui `messages.queue` (dan `messages.queue.byChannel`).
- Mode default adalah `steer`, dengan debounce tindak lanjut 500 ms ketika pengarahan
  kembali ke pengiriman tindak lanjut yang diantrekan.
- Mode: `steer`, `followup`, `collect`, `steer-backlog`, `interrupt`, dan mode lama
  `queue` satu per satu.

Detail: [Antrean perintah](/id/concepts/queue) dan [Antrean pengarahan](/id/concepts/queue-steering).

## Kepemilikan run saluran

Plugin saluran dapat mempertahankan urutan, melakukan debounce input, dan menerapkan
backpressure transport sebelum pesan masuk ke antrean sesi. Plugin tidak boleh memaksakan
timeout terpisah di sekitar giliran agent itu sendiri. Setelah pesan dirutekan ke suatu
sesi, pekerjaan berdurasi panjang diatur oleh siklus hidup sesi, tool, dan runtime
agar semua saluran melaporkan dan pulih dari giliran lambat secara konsisten.

## Streaming, chunking, dan batching

Streaming blok mengirim balasan parsial saat model menghasilkan blok teks.
Chunking menghormati batas teks saluran dan menghindari pemecahan kode berpagar.

Pengaturan utama:

- `agents.defaults.blockStreamingDefault` (`on|off`, default nonaktif)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (batching berbasis idle)
- `agents.defaults.humanDelay` (jeda seperti manusia antarbalasan blok)
- Override saluran: `*.blockStreaming` dan `*.blockStreamingCoalesce` (saluran non-Telegram memerlukan `*.blockStreaming: true` eksplisit)

Detail: [Streaming + chunking](/id/concepts/streaming).

## Visibilitas penalaran dan token

OpenClaw dapat mengekspos atau menyembunyikan penalaran model:

- `/reasoning on|off|stream` mengontrol visibilitas.
- Konten penalaran tetap dihitung dalam penggunaan token ketika diproduksi oleh model.
- Telegram mendukung stream penalaran ke dalam gelembung draf.

Detail: [Direktif berpikir + penalaran](/id/tools/thinking) dan [Penggunaan token](/id/reference/token-use).

## Prefiks, threading, dan balasan

Pemformatan pesan keluar dipusatkan di `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix`, dan `channels.<channel>.accounts.<id>.responsePrefix` (kaskade prefiks keluar), plus `channels.whatsapp.messagePrefix` (prefiks masuk WhatsApp)
- Threading balasan melalui `replyToMode` dan default per saluran

Detail: [Konfigurasi](/id/gateway/config-agents#messages) dan dokumentasi saluran.

## Balasan senyap

Token senyap persis `NO_REPLY` / `no_reply` berarti “jangan kirim balasan yang terlihat pengguna”.
Ketika suatu giliran juga memiliki media tool yang tertunda, seperti audio TTS yang dihasilkan, OpenClaw
menghapus teks senyap tetapi tetap mengirim lampiran media.
OpenClaw menyelesaikan perilaku tersebut berdasarkan jenis percakapan:

- Percakapan langsung tidak mengizinkan senyap secara default dan menulis ulang balasan
  senyap polos menjadi fallback singkat yang terlihat.
- Grup/saluran mengizinkan senyap secara default.
- Orkestrasi internal mengizinkan senyap secara default.

OpenClaw juga menggunakan balasan senyap untuk kegagalan runner internal yang terjadi
sebelum balasan asisten apa pun dalam chat tidak langsung, sehingga grup/saluran tidak melihat
boilerplate error Gateway. Chat langsung menampilkan salinan kegagalan yang ringkas secara default;
detail runner mentah hanya ditampilkan ketika `/verbose` adalah `on` atau `full`.

Default berada di bawah `agents.defaults.silentReply` dan
`agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` dan
`surfaces.<id>.silentReplyRewrite` dapat meng-override-nya per surface.

Ketika sesi induk memiliki satu atau lebih spawned subagent run yang tertunda, balasan
senyap polos dibuang di semua surface alih-alih ditulis ulang, sehingga induk
tetap diam sampai event penyelesaian anak mengirim balasan sebenarnya.

## Terkait

- [Streaming](/id/concepts/streaming) — pengiriman pesan real-time
- [Coba ulang](/id/concepts/retry) — perilaku coba ulang pengiriman pesan
- [Antrean](/id/concepts/queue) — antrean pemrosesan pesan
- [Saluran](/id/channels) — integrasi platform pesan
