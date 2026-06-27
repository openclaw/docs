---
read_when:
    - Menjelaskan bagaimana pesan masuk menjadi balasan
    - Memperjelas sesi, mode antrean, atau perilaku streaming
    - Mendokumentasikan visibilitas penalaran dan implikasi penggunaan
summary: Alur pesan, sesi, pengantrean, dan visibilitas penalaran
title: Pesan
x-i18n:
    generated_at: "2026-06-27T17:24:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d5585ae95fc65cb64240e4bf5d0bbe2eb54f55461b9fa4ee331d4d703d62e76f
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

Saluran dapat mengirim ulang pesan yang sama setelah koneksi ulang. OpenClaw menyimpan cache
berumur singkat yang dikunci berdasarkan saluran/akun/peer/sesi/id pesan agar pengiriman
duplikat tidak memicu proses agen lain.

## Debouncing masuk

Pesan beruntun cepat dari **pengirim yang sama** dapat digabungkan menjadi satu
giliran agen melalui `messages.inbound`. Debouncing dicakup per saluran + percakapan
dan menggunakan pesan terbaru untuk threading/id balasan.

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
- Perintah kontrol melewati debouncing agar tetap berdiri sendiri. Saluran yang secara eksplisit memilih ikut dalam penggabungan DM dari pengirim yang sama dapat mempertahankan perintah DM di dalam jendela debounce sehingga payload kirim-terpisah dapat bergabung ke giliran agen yang sama.

## Sesi dan perangkat

Sesi dimiliki oleh Gateway, bukan oleh klien.

- Chat langsung diringkas ke kunci sesi utama agen.
- Grup/saluran mendapatkan kunci sesinya sendiri.
- Penyimpanan sesi dan transkrip berada di host Gateway.

Beberapa perangkat/saluran dapat dipetakan ke sesi yang sama, tetapi riwayat tidak sepenuhnya
disinkronkan kembali ke setiap klien. Rekomendasi: gunakan satu perangkat utama untuk
percakapan panjang agar konteks tidak bercabang. UI Kontrol dan TUI selalu menampilkan
transkrip sesi yang didukung Gateway, sehingga keduanya menjadi sumber kebenaran.

Detail: [Manajemen sesi](/id/concepts/session).

## Metadata hasil alat

`content` hasil alat adalah hasil yang terlihat oleh model. `details` hasil alat adalah
metadata runtime untuk rendering UI, diagnostik, pengiriman media, dan Plugin.

OpenClaw menjaga batas tersebut tetap eksplisit:

- `toolResult.details` dihapus sebelum replay penyedia dan input Compaction.
- Transkrip sesi yang dipersistenkan hanya menyimpan `details` yang berbatas; metadata terlalu besar
  diganti dengan ringkasan ringkas bertanda `persistedDetailsTruncated: true`.
- Plugin dan alat harus menaruh teks yang harus dibaca model di `content`, bukan hanya
  di `details`.

## Isi masuk dan konteks riwayat

OpenClaw memisahkan **isi prompt** dari **isi perintah**:

- `BodyForAgent`: teks utama yang menghadap model untuk pesan saat ini. Plugin
  saluran harus menjaga ini tetap berfokus pada teks pengirim saat ini yang memuat prompt.
- `Body`: fallback prompt lama. Ini dapat mencakup amplop saluran dan
  wrapper riwayat opsional, tetapi saluran saat ini tidak boleh mengandalkannya sebagai
  input model utama ketika `BodyForAgent` tersedia.
- `CommandBody`: teks pengguna mentah untuk penguraian direktif/perintah.
- `RawBody`: alias lama untuk `CommandBody` (dipertahankan untuk kompatibilitas).

Ketika saluran menyediakan riwayat, saluran menggunakan wrapper bersama:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Untuk **chat non-langsung** (grup/saluran/ruang), **isi pesan saat ini** diberi prefiks dengan
label pengirim (gaya yang sama digunakan untuk entri riwayat). Ini menjaga pesan real-time dan
antrean/riwayat tetap konsisten dalam prompt agen.

Buffer riwayat bersifat **hanya tertunda**: buffer menyertakan pesan grup yang _tidak_
memicu proses jalan (misalnya, pesan yang dibatasi oleh mention) dan **mengecualikan** pesan
yang sudah ada di transkrip sesi.

Penghapusan direktif hanya berlaku untuk bagian **pesan saat ini** sehingga riwayat
tetap utuh. Saluran yang membungkus riwayat harus menetapkan `CommandBody` (atau
`RawBody`) ke teks pesan asli dan mempertahankan `Body` sebagai prompt gabungan.
Riwayat terstruktur, balasan, pesan yang diteruskan, dan metadata saluran dirender sebagai
blok konteks tidak tepercaya berperan pengguna selama penyusunan prompt.
Buffer riwayat dapat dikonfigurasi melalui `messages.groupChat.historyLimit` (default
global) dan override per saluran seperti `channels.slack.historyLimit` atau
`channels.telegram.accounts.<id>.historyLimit` (atur `0` untuk menonaktifkan).

## Antrean dan tindak lanjut

Jika proses jalan sudah aktif, pesan masuk diarahkan ke proses saat ini secara
default. `messages.queue` memilih apakah pesan proses-aktif diarahkan, diantrekan untuk
nanti, dikumpulkan menjadi satu giliran nanti, atau menginterupsi proses aktif.

- Konfigurasikan melalui `messages.queue` (dan `messages.queue.byChannel`).
- Mode default adalah `steer`, dengan debounce 500 md untuk batch pengarahan Codex dan
  antrean tindak lanjut/kumpulkan.
- Mode: `steer`, `followup`, `collect`, dan `interrupt`.

Detail: [Antrean perintah](/id/concepts/queue) dan [Antrean pengarahan](/id/concepts/queue-steering).

## Kepemilikan proses saluran

Plugin saluran dapat mempertahankan urutan, men-debounce input, dan menerapkan backpressure
transport sebelum pesan masuk ke antrean sesi. Plugin tidak boleh memberlakukan
timeout terpisah di sekitar giliran agen itu sendiri. Setelah pesan dirutekan ke
sesi, pekerjaan berjalan lama diatur oleh siklus hidup sesi, alat, dan runtime
sehingga semua saluran melaporkan dan pulih dari giliran lambat secara konsisten.

## Streaming, pemotongan, dan batching

Streaming blok mengirim balasan parsial saat model menghasilkan blok teks.
Pemotongan menghormati batas teks saluran dan menghindari pemisahan kode berpagar.

Pengaturan utama:

- `agents.defaults.blockStreamingDefault` (`on|off`, default nonaktif)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (batching berbasis idle)
- `agents.defaults.humanDelay` (jeda seperti manusia di antara balasan blok)
- Override saluran: `*.blockStreaming` dan `*.blockStreamingCoalesce` (saluran non-Telegram memerlukan `*.blockStreaming: true` eksplisit)

Detail: [Streaming + pemotongan](/id/concepts/streaming).

## Visibilitas dan token penalaran

OpenClaw dapat menampilkan atau menyembunyikan penalaran model:

- `/reasoning on|off|stream` mengontrol visibilitas.
- Konten penalaran tetap dihitung terhadap penggunaan token saat diproduksi oleh model.
- Telegram mendukung stream penalaran ke gelembung draf sementara yang dihapus setelah pengiriman final; gunakan `/reasoning on` untuk output penalaran persisten.

Detail: [Direktif berpikir + penalaran](/id/tools/thinking) dan [Penggunaan token](/id/reference/token-use).

## Prefiks, threading, dan balasan

Pemformatan pesan keluar dipusatkan di `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix`, dan `channels.<channel>.accounts.<id>.responsePrefix` (kaskade prefiks keluar), plus `channels.whatsapp.messagePrefix` (prefiks masuk WhatsApp)
- Threading balasan melalui `replyToMode` dan default per saluran

Detail: [Konfigurasi](/id/gateway/config-agents#messages) dan dokumentasi saluran.

## Balasan senyap

Token senyap persis `NO_REPLY` / `no_reply` berarti "jangan kirim balasan yang terlihat pengguna".
Ketika giliran juga memiliki media alat tertunda, seperti audio TTS yang dihasilkan, OpenClaw
menghapus teks senyap tetapi tetap mengirim lampiran media.
OpenClaw menyelesaikan perilaku itu berdasarkan jenis percakapan:

- Percakapan langsung tidak pernah menerima panduan prompt `NO_REPLY`. Jika proses langsung
  secara tidak sengaja mengembalikan token senyap polos, OpenClaw menekannya alih-alih
  menulis ulang atau mengirimnya.
- Grup/saluran mengizinkan senyap secara default hanya untuk balasan grup otomatis.
  Dalam mode balasan-terlihat `message_tool`, senyap berarti model tidak memanggil
  `message(action=send)`.
- Orkestrasi internal mengizinkan senyap secara default.

OpenClaw juga menggunakan balasan senyap untuk kegagalan runner internal generik di
chat non-langsung, sehingga grup/saluran tidak melihat boilerplate kesalahan Gateway.
Kegagalan terklasifikasi dengan salinan pemulihan yang menghadap pengguna, seperti auth hilang,
rate limit, atau pemberitahuan overload, tetap dapat dikirim. Chat langsung menampilkan
salinan kegagalan ringkas secara default; detail runner mentah hanya ditampilkan saat
`/verbose full` diaktifkan.

Default berada di bawah `agents.defaults.silentReply`; `surfaces.<id>.silentReply`
dapat meng-override kebijakan grup/internal per surface.

Balasan senyap polos dibuang di semua surface, sehingga sesi induk tetap diam
alih-alih menulis ulang teks sentinel menjadi obrolan fallback.

## Terkait

- [Refaktor siklus hidup pesan](/id/concepts/message-lifecycle-refactor) - target desain kirim dan terima yang tahan lama
- [Streaming](/id/concepts/streaming) — pengiriman pesan real-time
- [Coba lagi](/id/concepts/retry) — perilaku percobaan ulang pengiriman pesan
- [Antrean](/id/concepts/queue) — antrean pemrosesan pesan
- [Saluran](/id/channels) — integrasi platform perpesanan
