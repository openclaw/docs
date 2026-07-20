---
read_when:
    - Menjelaskan cara pesan masuk menjadi balasan
    - Memperjelas sesi, mode antrean, atau perilaku streaming
    - Mendokumentasikan visibilitas penalaran dan implikasi penggunaan
summary: Alur pesan, sesi, antrean, dan visibilitas penalaran
title: Pesan
x-i18n:
    generated_at: "2026-07-20T03:50:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 843b9defdd56f55b8cb43c366f247a740cf851fb86bbef66a422cf8efdebe059
    source_path: concepts/messages.md
    workflow: 16
---

Pesan masuk melewati perutean, deduplikasi/debounce, proses agen, dan pengiriman keluar:

```text
Pesan masuk
  -> perutean/pengikatan -> kunci sesi
  -> deduplikasi + debounce
  -> antrean (jika proses sudah aktif)
  -> proses agen (streaming + alat)
  -> balasan keluar (batas kanal + pemotongan)
```

Permukaan konfigurasi utama:

- `messages.*` untuk prefiks, pengantrean, debounce pesan masuk, dan perilaku grup.
- `agents.defaults.*` untuk streaming blok, pemotongan, dan nilai default balasan senyap.
- Penimpaan kanal (`channels.telegram.*`, `channels.whatsapp.*`, dll.) untuk batas dan pengaturan streaming per kanal.

Lihat [Konfigurasi](/id/gateway/configuration) untuk skema lengkap.

## Deduplikasi pesan masuk

Kanal dapat mengirimkan ulang pesan yang sama setelah tersambung kembali. OpenClaw menyimpan cache dalam memori yang dikunci berdasarkan cakupan agen, rute kanal (kanal + rekan + akun + utas), dan ID pesan, sehingga pesan yang dikirimkan ulang tidak memicu proses agen kedua. Entri cache kedaluwarsa setelah 20 menit atau setelah 5000 entri dilacak, mana pun yang terjadi lebih dahulu.

## Debounce pesan masuk

Pesan teks berurutan dengan cepat dari pengirim yang sama dapat dikumpulkan menjadi satu giliran agen melalui `messages.inbound`. Debounce dicakup per kanal + percakapan dan menggunakan pesan terbaru untuk pengutasan/ID balasan.

```json5
{
  messages: {
    inbound: {
      debounceMs: 2000,
      byChannel: {
        discord: 1500,
        slack: 1500,
        whatsapp: 5000,
      },
    },
  },
}
```

- Debounce berlaku hanya untuk pesan teks; media/lampiran langsung mengosongkan kumpulan.
- Perintah kontrol (stop/abort/status, dll.) melewati debounce agar langsung dikirim.
- Dinonaktifkan secara default: `messages.inbound.debounceMs` tidak memiliki nilai default bawaan, sehingga debounce hanya aktif setelah Anda mengaturnya (secara global atau per kanal).
- Pilihan keikutsertaan `coalesceSameSenderDms` milik iMessage adalah satu-satunya pengecualian: pengaturan ini menahan semua teks DM dari pengirim yang sama (termasuk perintah) cukup lama agar pengiriman terpisah perintah+URL dari Apple tiba sebagai satu giliran. Obrolan grup selalu dikirim seketika terlepas dari pengaturan ini.

## Sesi dan perangkat

Sesi dimiliki oleh Gateway, bukan oleh klien.

- Obrolan langsung digabungkan ke kunci sesi utama agen.
- Grup/kanal memiliki kunci sesi masing-masing.
- Penyimpanan sesi dan transkrip berada di host Gateway.

Beberapa perangkat/kanal dapat dipetakan ke sesi yang sama, tetapi riwayat tidak sepenuhnya disinkronkan kembali ke setiap klien. Gunakan satu perangkat utama untuk percakapan panjang agar konteks tidak menyimpang. UI Kontrol dan TUI selalu menampilkan transkrip sesi yang didukung Gateway, sehingga keduanya merupakan sumber kebenaran.

Detail: [Pengelolaan sesi](/id/concepts/session).

## Isi prompt dan konteks riwayat

Plugin kanal mengisi beberapa bidang teks pada konteks pesan masuk, dari yang paling hingga paling tidak diutamakan:

| Bidang            | Tujuan                                                                                                      |
| ----------------- | ----------------------------------------------------------------------------------------------------------- |
| `BodyForAgent`    | Teks yang ditampilkan kepada model untuk giliran saat ini. Beralih ke `CommandBody` / `RawBody` / `Body` jika tidak ditetapkan.        |
| `BodyForCommands` | Teks bersih yang digunakan untuk penguraian arahan/perintah. Beralih ke `CommandBody` / `RawBody` / `Body` jika tidak ditetapkan. |
| `CommandBody`     | Isi perantara lama; utamakan `BodyForCommands`.                                                         |
| `RawBody`         | Alias usang untuk `CommandBody`.                                                                         |
| `Body`            | Isi prompt lama; dapat menyertakan amplop kanal dan pembungkus riwayat.                                     |

Saat kanal menyediakan riwayat, kanal membungkusnya dengan:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Untuk obrolan nonlangsung (grup/kanal/ruang), isi pesan saat ini diawali dengan label pengirim, sesuai dengan gaya yang digunakan untuk entri riwayat. Penghapusan arahan hanya berlaku pada bagian pesan saat ini, sehingga riwayat tetap utuh. Kanal yang membungkus riwayat harus menetapkan `BodyForCommands` (atau `CommandBody` / `RawBody` yang lama) ke teks pesan asli dan mempertahankan `Body` sebagai prompt gabungan.

Buffer riwayat hanya berisi pesan tertunda: buffer ini mencakup pesan grup yang tidak memicu proses (misalnya, pesan yang memerlukan penyebutan) dan mengecualikan pesan yang sudah ada dalam transkrip sesi. Riwayat terstruktur, balasan, pesan yang diteruskan, dan metadata kanal dirender sebagai blok konteks peran pengguna yang tidak tepercaya selama penyusunan prompt.

Konfigurasikan ukuran riwayat dengan `messages.groupChat.historyLimit` (nilai default global) atau penimpaan per kanal seperti `channels.slack.historyLimit` dan `channels.telegram.accounts.<id>.historyLimit` (tetapkan `0` untuk menonaktifkannya).

## Metadata hasil alat

`content` pada hasil alat adalah hasil yang terlihat oleh model; `details` adalah metadata runtime untuk rendering UI, diagnostik, pengiriman media, dan Plugin.

- `toolResult.details` dihapus sebelum pemutaran ulang penyedia dan sebelum masukan Compaction.
- Transkrip sesi tersimpan hanya mempertahankan `details` yang dibatasi; metadata yang terlalu besar diganti dengan ringkasan ringkas bertanda `persistedDetailsTruncated: true`.
- Plugin dan alat harus menempatkan teks yang wajib dibaca model di `content`, bukan hanya di `details`.

## Pengantrean dan tindak lanjut

Saat proses sudah aktif, pesan masuk diarahkan ke dalamnya secara default. `messages.queue` mengontrol mode:

| Mode              | Perilaku                                            |
| ----------------- | --------------------------------------------------- |
| `steer` (default) | Suntikkan prompt baru ke proses aktif.          |
| `followup`        | Jalankan pesan setelah proses aktif selesai.      |
| `collect`         | Kumpulkan pesan yang kompatibel menjadi satu giliran berikutnya.      |
| `interrupt`       | Batalkan proses aktif, lalu mulai prompt terbaru. |

Antrean menggunakan debounce bawaan 500ms untuk pengumpulan steer, tindak lanjut, dan collect. `messages.queue.cap` memiliki nilai default 20 pesan dalam antrean, dan `messages.queue.drop` memiliki nilai default `summarize` (`old` dan `new` juga tersedia). Konfigurasikan penimpaan per kanal melalui `messages.queue.byChannel` dan `messages.queue.debounceMsByChannel`.

Detail: [Antrean perintah](/id/concepts/queue) dan [Antrean pengarah](/id/concepts/queue-steering).

## Kepemilikan proses kanal

Plugin kanal dapat mempertahankan urutan, menerapkan debounce pada masukan, dan menerapkan tekanan balik transportasi sebelum pesan memasuki antrean sesi. Plugin tidak boleh menetapkan batas waktu terpisah untuk giliran agen itu sendiri. Setelah pesan dirutekan ke sesi, siklus hidup sesi, alat, dan runtime mengatur pekerjaan yang berlangsung lama agar semua kanal melaporkan dan pulih dari giliran yang lambat secara konsisten.

## Streaming, pemotongan, dan pengumpulan

Streaming blok mengirimkan balasan parsial saat model menghasilkan blok teks; pemotongan mematuhi batas teks kanal dan menghindari pemisahan kode berpagar.

- `agents.defaults.blockStreamingDefault` (`on|off`, nilai default `off`)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (pengumpulan berdasarkan waktu tidak aktif)
- `agents.defaults.humanDelay` (jeda menyerupai manusia di antara balasan blok)
- Penimpaan kanal: `*.streaming.block.enabled` dan `*.streaming.block.coalesce` pada kanal bawaan; kunci datar usang dimigrasikan oleh `openclaw doctor --fix`. Streaming blok dinonaktifkan kecuali diaktifkan secara eksplisit, pada setiap kanal termasuk Telegram. QQ Bot adalah pengecualian: QQ Bot tidak memiliki kunci `streaming.block` dan men-streaming balasan blok kecuali `channels.qqbot.streaming.mode` bernilai `"off"`.

Detail: [Streaming + pemotongan](/id/concepts/streaming).

## Visibilitas penalaran dan token

- `/reasoning on|off|stream` mengontrol visibilitas.
- Konten penalaran tetap dihitung dalam penggunaan token saat model menghasilkannya.
- Telegram mendukung streaming penalaran ke gelembung draf sementara yang dihapus setelah pengiriman akhir; gunakan `/reasoning on` untuk keluaran penalaran persisten.

Detail: [Arahan pemikiran + penalaran](/id/tools/thinking) dan [Penggunaan token](/id/reference/token-use).

## Prefiks, pengutasan, dan balasan

- Urutan prefiks keluar: `messages.responsePrefix`, `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`. WhatsApp juga memiliki `channels.whatsapp.messagePrefix` untuk prefiks pesan masuk.
- Pengutasan balasan melalui `replyToMode` dan nilai default per kanal.

Detail: [Konfigurasi](/id/gateway/config-agents#messages) dan dokumentasi kanal.

## Balasan senyap

Token senyap `NO_REPLY` (tidak peka huruf besar/kecil, sehingga `no_reply` juga cocok) berarti "jangan kirimkan balasan yang terlihat oleh pengguna." Saat suatu giliran juga memiliki media alat yang tertunda, seperti audio TTS yang dihasilkan, OpenClaw menghapus teks senyap tetapi tetap mengirimkan lampiran media.

Kebijakan kesenyapan ditentukan berdasarkan jenis percakapan:

- Percakapan langsung tidak pernah menerima panduan prompt `NO_REPLY`. Jika proses langsung secara tidak sengaja mengembalikan token senyap saja, OpenClaw menekannya alih-alih menulis ulang atau mengirimkannya.
- Grup/kanal mengizinkan kesenyapan secara default. Dalam mode balasan terlihat `message_tool`, kesenyapan berarti model tidak memanggil `message(action=send)`.
- Orkestrasi internal mengizinkan kesenyapan secara default.

Nilai default berada di bawah `agents.defaults.silentReply`; `surfaces.<id>.silentReply` dapat menimpa kebijakan grup/internal per permukaan.

OpenClaw juga menggunakan balasan senyap untuk kegagalan runner internal generik dalam obrolan nonlangsung, sehingga grup/kanal tidak melihat teks standar kesalahan Gateway. Kegagalan yang diklasifikasikan dengan teks pemulihan untuk pengguna, seperti pemberitahuan autentikasi yang hilang, batas laju, atau beban berlebih, tetap dapat dikirimkan. Obrolan langsung menampilkan teks kegagalan ringkas secara default; detail mentah runner hanya ditampilkan saat `/verbose full` diaktifkan.

Balasan yang hanya berisi token senyap dibuang pada semua permukaan, sehingga sesi induk tetap senyap alih-alih menulis ulang teks sentinel menjadi percakapan cadangan.

## Terkait

- [Refaktor siklus hidup pesan](/id/concepts/message-lifecycle-refactor) - desain target pengiriman dan penerimaan yang tahan lama
- [Streaming](/id/concepts/streaming) - pengiriman pesan waktu nyata
- [Percobaan ulang](/id/concepts/retry) - perilaku percobaan ulang pengiriman pesan
- [Antrean](/id/concepts/queue) - antrean pemrosesan pesan
- [Kanal](/id/channels) - integrasi platform perpesanan
