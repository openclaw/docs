---
read_when:
    - Menjelaskan cara pesan masuk menjadi balasan
    - Memperjelas sesi, mode antrean, atau perilaku streaming
    - Mendokumentasikan visibilitas penalaran dan implikasi penggunaan
summary: Alur pesan, sesi, antrean, dan visibilitas penalaran
title: Pesan
x-i18n:
    generated_at: "2026-07-16T18:00:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e2982ebb1b82b90368263826ef8f42babab9c8a559cc1409a381893a011a0ad7
    source_path: concepts/messages.md
    workflow: 16
---

Pesan masuk bergerak melalui perutean, deduplikasi/debounce, proses agen, dan pengiriman keluar:

```text
Pesan masuk
  -> perutean/binding -> kunci sesi
  -> deduplikasi + debounce
  -> antrean (jika proses sudah aktif)
  -> proses agen (streaming + alat)
  -> balasan keluar (batas saluran + pemotongan)
```

Permukaan konfigurasi utama:

- `messages.*` untuk prefiks, pengantrean, debounce pesan masuk, dan perilaku grup.
- `agents.defaults.*` untuk streaming blok, pemotongan, dan nilai default balasan senyap.
- Penggantian saluran (`channels.telegram.*`, `channels.whatsapp.*`, dan sebagainya) untuk batas dan sakelar streaming per saluran.

Lihat [Konfigurasi](/id/gateway/configuration) untuk skema lengkapnya.

## Deduplikasi pesan masuk

Saluran dapat mengirimkan kembali pesan yang sama setelah tersambung ulang. OpenClaw menyimpan cache dalam memori yang dikunci berdasarkan cakupan agen, rute saluran (saluran + rekan + akun + utas), dan ID pesan, sehingga pesan yang dikirimkan kembali tidak memicu proses agen kedua. Entri cache kedaluwarsa setelah 20 menit atau setelah 5000 entri dilacak, mana pun yang terjadi lebih dahulu.

## Debounce pesan masuk

Pesan teks berurutan yang dikirim dengan cepat oleh pengirim yang sama dapat digabungkan menjadi satu giliran agen melalui `messages.inbound`. Debounce dicakup per saluran + percakapan dan menggunakan pesan terbaru untuk pengaitan utas/ID balasan.

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

- Debounce berlaku untuk pesan yang hanya berisi teks; media/lampiran langsung dikirim.
- Perintah kontrol (stop/abort/status, dan sebagainya) melewati debounce sehingga langsung dikirim.
- Dinonaktifkan secara default: `messages.inbound.debounceMs` tidak memiliki nilai default bawaan, sehingga debounce hanya aktif setelah Anda mengaturnya (secara global atau per saluran).
- Keikutsertaan `coalesceSameSenderDms` milik iMessage adalah satu-satunya pengecualian: fitur ini menahan semua teks DM dari pengirim yang sama (termasuk perintah) cukup lama agar pengiriman terpisah perintah+URL dari Apple tiba sebagai satu giliran. Percakapan grup selalu langsung dikirim terlepas dari pengaturan ini.

## Sesi dan perangkat

Sesi dimiliki oleh Gateway, bukan oleh klien.

- Percakapan langsung digabungkan ke kunci sesi utama agen.
- Grup/saluran mendapatkan kunci sesi masing-masing.
- Penyimpanan sesi dan transkrip berada di host Gateway.

Beberapa perangkat/saluran dapat dipetakan ke sesi yang sama, tetapi riwayat tidak sepenuhnya disinkronkan kembali ke setiap klien. Gunakan satu perangkat utama untuk percakapan panjang guna menghindari konteks yang menyimpang. UI Kontrol dan TUI selalu menampilkan transkrip sesi yang didukung Gateway, sehingga keduanya merupakan sumber kebenaran.

Detail: [Pengelolaan sesi](/id/concepts/session).

## Isi prompt dan konteks riwayat

Plugin saluran mengisi beberapa bidang teks pada konteks pesan masuk, dari yang paling hingga paling tidak diutamakan:

| Bidang             | Tujuan                                                                                                     |
| ----------------- | ----------------------------------------------------------------------------------------------------------- |
| `BodyForAgent`    | Teks yang ditujukan kepada model untuk giliran saat ini. Menggunakan `CommandBody` / `RawBody` / `Body` sebagai cadangan jika tidak diatur.        |
| `BodyForCommands` | Teks bersih yang digunakan untuk mengurai direktif/perintah. Menggunakan `CommandBody` / `RawBody` / `Body` sebagai cadangan jika tidak diatur. |
| `CommandBody`     | Isi perantara lama; utamakan `BodyForCommands`.                                                         |
| `RawBody`         | Alias usang untuk `CommandBody`.                                                                         |
| `Body`            | Isi prompt lama; dapat mencakup amplop saluran dan pembungkus riwayat.                                     |

Ketika saluran menyediakan riwayat, saluran membungkusnya dengan:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Untuk percakapan tidak langsung (grup/saluran/ruang), isi pesan saat ini diberi prefiks label pengirim, sesuai dengan gaya yang digunakan untuk entri riwayat. Penghapusan direktif hanya berlaku pada bagian pesan saat ini, sehingga riwayat tetap utuh. Saluran yang membungkus riwayat harus mengatur `BodyForCommands` (atau `CommandBody` / `RawBody` yang lama) ke teks pesan asli dan mempertahankan `Body` sebagai prompt gabungan.

Buffer riwayat hanya berisi yang tertunda: buffer tersebut mencakup pesan grup yang tidak memicu proses (misalnya, pesan yang dibatasi oleh penyebutan) dan mengecualikan pesan yang sudah ada dalam transkrip sesi. Riwayat terstruktur, balasan, penerusan, dan metadata saluran dirender sebagai blok konteks peran pengguna yang tidak tepercaya selama penyusunan prompt.

Konfigurasikan ukuran riwayat dengan `messages.groupChat.historyLimit` (nilai default global) atau penggantian per saluran seperti `channels.slack.historyLimit` dan `channels.telegram.accounts.<id>.historyLimit` (atur `0` untuk menonaktifkannya).

## Metadata hasil alat

`content` hasil alat adalah hasil yang terlihat oleh model; `details` adalah metadata runtime untuk perenderan UI, diagnostik, pengiriman media, dan Plugin.

- `toolResult.details` dihapus sebelum pemutaran ulang penyedia dan sebelum input Compaction.
- Transkrip sesi yang dipersistenkan hanya mempertahankan `details` yang dibatasi; metadata yang terlalu besar diganti dengan ringkasan ringkas bertanda `persistedDetailsTruncated: true`.
- Plugin dan alat harus menempatkan teks yang harus dibaca model di `content`, bukan hanya di `details`.

## Pengantrean dan tindak lanjut

Ketika proses sudah aktif, pesan masuk secara default diarahkan ke proses tersebut. `messages.queue` mengontrol modenya:

| Mode              | Perilaku                                            |
| ----------------- | --------------------------------------------------- |
| `steer` (default) | Masukkan prompt baru ke proses yang aktif.          |
| `followup`        | Jalankan pesan setelah proses aktif selesai.      |
| `collect`         | Gabungkan pesan yang kompatibel menjadi satu giliran berikutnya.      |
| `interrupt`       | Batalkan proses aktif, lalu mulai prompt terbaru. |

Nilai default: `messages.queue.debounceMs` adalah 500ms (berlaku sama untuk penggabungan steer, followup, dan collect), `messages.queue.cap` adalah 20 pesan dalam antrean, dan `messages.queue.drop` adalah `summarize` (`old` dan `new` juga tersedia). Konfigurasikan penggantian per saluran melalui `messages.queue.byChannel` dan `messages.queue.debounceMsByChannel`.

Detail: [Antrean perintah](/id/concepts/queue) dan [Antrean pengarahan](/id/concepts/queue-steering).

## Kepemilikan proses saluran

Plugin saluran dapat mempertahankan urutan, menerapkan debounce pada input, dan menerapkan tekanan balik transportasi sebelum pesan memasuki antrean sesi. Plugin tidak boleh memberlakukan batas waktu terpisah pada giliran agen itu sendiri. Setelah pesan dirutekan ke sesi, siklus hidup sesi, alat, dan runtime mengatur pekerjaan yang berjalan lama agar semua saluran melaporkan dan pulih dari giliran lambat secara konsisten.

## Streaming, pemotongan, dan penggabungan

Streaming blok mengirimkan balasan parsial saat model menghasilkan blok teks; pemotongan mematuhi batas teks saluran dan menghindari pemisahan kode berpagar.

- `agents.defaults.blockStreamingDefault` (`on|off`, default `off`)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (penggabungan berbasis waktu menganggur)
- `agents.defaults.humanDelay` (jeda menyerupai manusia di antara balasan blok)
- Penggantian saluran: `*.streaming.block.enabled` dan `*.streaming.block.coalesce` pada saluran terbundel; kunci datar yang usang dimigrasikan oleh `openclaw doctor --fix`. Streaming blok dinonaktifkan kecuali diaktifkan secara eksplisit, pada setiap saluran termasuk Telegram. QQ Bot adalah pengecualian: QQ Bot tidak memiliki kunci `streaming.block` dan melakukan streaming balasan blok kecuali jika `channels.qqbot.streaming.mode` adalah `"off"`.

Detail: [Streaming + pemotongan](/id/concepts/streaming).

## Visibilitas penalaran dan token

- `/reasoning on|off|stream` mengontrol visibilitas.
- Konten penalaran tetap dihitung dalam penggunaan token ketika model menghasilkannya.
- Telegram mendukung streaming penalaran ke gelembung draf sementara yang dihapus setelah pengiriman akhir; gunakan `/reasoning on` untuk keluaran penalaran persisten.

Detail: [Direktif pemikiran + penalaran](/id/tools/thinking) dan [Penggunaan token](/id/reference/token-use).

## Prefiks, utas, dan balasan

- Urutan prefiks keluar: `messages.responsePrefix`, `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`. WhatsApp juga memiliki `channels.whatsapp.messagePrefix` untuk prefiks pesan masuk.
- Pengaitan utas balasan melalui `replyToMode` dan nilai default per saluran.

Detail: [Konfigurasi](/id/gateway/config-agents#messages) dan dokumentasi saluran.

## Balasan senyap

Token senyap `NO_REPLY` (tidak peka huruf besar-kecil, sehingga `no_reply` juga cocok) berarti "jangan kirimkan balasan yang terlihat oleh pengguna." Ketika suatu giliran juga memiliki media alat yang tertunda, seperti audio TTS yang dihasilkan, OpenClaw menghapus teks senyap tetapi tetap mengirimkan lampiran media.

Kebijakan senyap ditentukan berdasarkan jenis percakapan:

- Percakapan langsung tidak pernah menerima panduan prompt `NO_REPLY`. Jika proses langsung secara tidak sengaja mengembalikan token senyap saja, OpenClaw menekannya alih-alih menulis ulang atau mengirimkannya.
- Grup/saluran mengizinkan senyap secara default. Dalam mode balasan terlihat `message_tool`, senyap berarti model tidak memanggil `message(action=send)`.
- Orkestrasi internal mengizinkan senyap secara default.

Nilai default berada di bawah `agents.defaults.silentReply`; `surfaces.<id>.silentReply` dapat mengganti kebijakan grup/internal per permukaan.

OpenClaw juga menggunakan balasan senyap untuk kegagalan runner internal generik dalam percakapan tidak langsung, sehingga grup/saluran tidak melihat teks standar kesalahan Gateway. Kegagalan yang diklasifikasikan dengan teks pemulihan yang ditujukan kepada pengguna, seperti pemberitahuan autentikasi yang tidak tersedia, batas laju, atau kelebihan beban, tetap dapat dikirimkan. Percakapan langsung menampilkan teks kegagalan ringkas secara default; detail mentah runner hanya ditampilkan ketika `/verbose full` diaktifkan.

Balasan yang hanya berisi token senyap dibuang di semua permukaan, sehingga sesi induk tetap senyap alih-alih menulis ulang teks sentinel menjadi obrolan cadangan.

## Terkait

- [Refaktor siklus hidup pesan](/id/concepts/message-lifecycle-refactor) - rancangan target pengiriman dan penerimaan yang tahan lama
- [Streaming](/id/concepts/streaming) - pengiriman pesan waktu nyata
- [Percobaan ulang](/id/concepts/retry) - perilaku percobaan ulang pengiriman pesan
- [Antrean](/id/concepts/queue) - antrean pemrosesan pesan
- [Saluran](/id/channels) - integrasi platform perpesanan
