---
read_when:
    - Menjelaskan cara kerja streaming atau pemotongan menjadi beberapa bagian pada saluran
    - Mengubah perilaku streaming blok atau pemotongan kanal
    - Men-debug balasan blok yang duplikat/terlalu dini atau streaming pratinjau kanal
summary: Perilaku streaming + chunking (balasan blok, streaming pratinjau kanal, pemetaan mode)
title: Streaming dan pemotongan menjadi bagian-bagian
x-i18n:
    generated_at: "2026-07-16T18:02:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b91d2143e59d9eb0271732adf8bc87482ef0d18fe664bfa46ed375c20fdc3d93
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw memiliki dua lapisan streaming independen, dan saat ini **tidak ada
streaming delta-token yang sebenarnya** ke pesan saluran:

- **Streaming blok (saluran):** mengirimkan **blok** yang telah selesai saat asisten
  menulis. Ini adalah pesan saluran biasa, bukan delta token.
- **Streaming pratinjau (Telegram/Discord/Slack/Matrix/Mattermost/MS Teams):**
  memperbarui **pesan pratinjau** sementara selama pembuatan (kirim + edit/tambahkan).

## Streaming blok (pesan saluran)

Streaming blok mengirimkan keluaran asisten dalam potongan besar saat tersedia.

```text
Keluaran model
  └─ text_delta/peristiwa
       ├─ (blockStreamingBreak=text_end)
       │    └─ pemotong mengirimkan blok seiring bertambahnya buffer
       └─ (blockStreamingBreak=message_end)
            └─ pemotong mengosongkan buffer pada message_end
                   └─ pengiriman saluran (balasan blok)
```

- `text_delta/events`: peristiwa aliran model (mungkin jarang untuk model non-streaming).
- `chunker`: `EmbeddedBlockChunker` menerapkan batas min/maks + preferensi pemisahan.
- `channel send`: pesan keluar yang sebenarnya (balasan blok).

**Kontrol** (semuanya di bawah `agents.defaults` kecuali dinyatakan lain):

| Kunci                                                        | Nilai / bentuk                                                           | Default    |
| ------------------------------------------------------------ | ------------------------------------------------------------------------ | ---------- |
| `blockStreamingDefault`                                      | `"on"` / `"off"`                                                        | `"off"`    |
| `blockStreamingBreak`                                        | `"text_end"` / `"message_end"`                                          | -          |
| `blockStreamingChunk`                                        | `{ minChars, maxChars, breakPreference? }`                              | -          |
| `blockStreamingCoalesce`                                     | `{ minChars?, maxChars?, idleMs? }` (gabungkan blok yang dialirkan sebelum dikirim) | -          |
| `*.streaming.block.enabled` (penggantian saluran)               | `true` / `false`, memaksakan streaming blok per saluran (dan per akun)  | -          |
| `*.textChunkLimit` (mis. `channels.whatsapp.textChunkLimit`) | angka, batas mutlak                                                        | 4000       |
| `*.streaming.chunkMode`                                      | `"length"` / `"newline"`                                                | `"length"` |
| `channels.discord.maxLinesPerMessage`                        | angka, batas lunak baris yang memisahkan balasan tinggi untuk menghindari pemotongan UI | 17         |

`streaming.chunkMode: "newline"` memisahkan pada baris kosong (batas paragraf),
bukan setiap baris baru, sebelum beralih ke pemotongan berdasarkan panjang setelah teks
melampaui batas.

Saluran bawaan menuliskan penggantian ini sebagai
`channels.<id>.streaming.{chunkMode,block.enabled,block.coalesce}`. Penulisan datar
`*.chunkMode` / `*.blockStreaming` / `*.blockStreamingCoalesce` bersifat
lama pada setiap saluran bawaan: `openclaw doctor --fix` memigrasikannya ke
bentuk bertingkat, dan skema saluran menolaknya. Konfigurasi plugin SDK eksternal
yang masih menggunakan penulisan datar tetap berfungsi melalui mekanisme cadangan yang
sudah tidak disarankan (dengan peringatan saat runtime) hingga rangkaian rilis berikutnya.

**Semantik batas** untuk `blockStreamingBreak`:

- `text_end`: alirkan blok segera setelah pemotong mengirimkannya; kosongkan pada setiap `text_end`.
- `message_end`: tunggu hingga pesan asisten selesai, lalu kosongkan keluaran
  yang disangga. Tetap menggunakan pemotong jika teks yang disangga melampaui `maxChars`, sehingga
  dapat mengirimkan beberapa potongan di akhir.

### Pengiriman media dengan streaming blok

Media streaming harus menggunakan bidang payload terstruktur seperti `mediaUrl` atau
`mediaUrls`; teks yang dialirkan tidak diuraikan sebagai perintah lampiran. Saat streaming blok
mengirimkan media lebih awal, OpenClaw mengingat pengiriman tersebut untuk giliran itu. Jika
payload akhir asisten mengulangi URL media yang sama, pengiriman akhir menghapus
media duplikat tersebut alih-alih mengirimkan lampiran lagi.

Payload akhir yang sama persis tidak dikirimkan. Jika payload akhir menambahkan
teks berbeda di sekitar media yang telah dialirkan, OpenClaw tetap mengirimkan
teks baru sambil memastikan media hanya dikirim sekali. Hal ini mencegah duplikasi catatan
suara atau file pada saluran seperti Telegram.

## Algoritme pemotongan (batas rendah/tinggi)

Pemotongan blok diimplementasikan oleh `EmbeddedBlockChunker`:

- **Batas rendah:** jangan kirim hingga buffer >= `minChars` (kecuali dipaksakan).
- **Batas tinggi:** utamakan pemisahan sebelum `maxChars`; jika dipaksakan, pisahkan pada `maxChars`.
- **Rantai preferensi pemisahan:** `paragraph` -> `newline` -> `sentence` ->
  spasi kosong -> pemisahan paksa.
- **Pagar kode:** jangan pernah memisahkan di dalam pagar; saat dipaksakan pada `maxChars`, tutup
  dan buka kembali pagar agar Markdown tetap valid.

`maxChars` dibatasi ke `textChunkLimit` saluran, sehingga Anda tidak dapat melampaui
batas per saluran.

## Penggabungan (menggabungkan blok yang dialirkan)

Saat streaming blok diaktifkan, OpenClaw dapat **menggabungkan potongan blok
yang berurutan** sebelum mengirimkannya, sehingga mengurangi spam satu baris sambil tetap menyediakan
keluaran progresif.

- Penggabungan menunggu **jeda tidak aktif** (`idleMs`) sebelum mengosongkan buffer.
- Buffer dibatasi oleh `maxChars` dan dikosongkan jika melampauinya.
- `minChars` mencegah fragmen kecil dikirim hingga cukup banyak teks terkumpul
  (pengosongan akhir selalu mengirimkan teks yang tersisa).
- Pemisah gabungan berasal dari `blockStreamingChunk.breakPreference`: `paragraph` ->
  `\n\n`, `newline` -> `\n`, `sentence` -> spasi.
- Penggantian saluran tersedia melalui `*.streaming.block.coalesce` (termasuk
  konfigurasi per akun).
- Secara default, Discord, Signal, dan Slack menggabungkan hingga `{ minChars: 1500, idleMs: 1000 }`
  kecuali diganti.

## Jeda seperti manusia di antara blok

Saat streaming blok diaktifkan, tambahkan **jeda acak** di antara balasan
blok, setelah blok pertama, agar respons dengan beberapa gelembung terasa lebih alami.

| `agents.defaults.humanDelay.mode` | Perilaku                |
| --------------------------------- | ----------------------- |
| `off` (default)                   | Tanpa jeda                |
| `natural`                         | Jeda acak 800-2500ms |
| `custom`                          | `minMs`/`maxMs`         |

Ganti per agen melalui `agents.list[].humanDelay`. Hanya berlaku untuk **balasan
blok**, bukan balasan akhir atau ringkasan alat.

## "Alirkan potongan atau semuanya"

- **Alirkan potongan:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"`
  (kirim selagi berjalan). Saluran selain Telegram juga memerlukan
  `*.streaming.block.enabled: true`.
- **Alirkan semuanya di akhir:** `blockStreamingBreak: "message_end"` (kosongkan
  sekali, mungkin menjadi beberapa potongan jika sangat panjang).
- **Tanpa streaming blok:** `blockStreamingDefault: "off"` (hanya balasan akhir).

Streaming blok **dinonaktifkan kecuali** `*.streaming.block.enabled` secara eksplisit
ditetapkan ke `true` (pengecualian: QQ Bot tidak memiliki kunci `streaming.block` dan mengalirkan
balasan blok kecuali `channels.qqbot.streaming.mode` adalah `"off"`). Saluran dapat
mengalirkan pratinjau langsung (`channels.<channel>.streaming.mode`) tanpa balasan
blok. Default `blockStreaming*` berada di bawah `agents.defaults`, bukan di akar
konfigurasi.

## Mode streaming pratinjau

Kunci kanonis: `channels.<channel>.streaming` (`{ mode, ... }` bertingkat; penulisan boolean/string
tingkat atas yang lama ditulis ulang oleh `openclaw doctor --fix`).

| Mode       | Perilaku                                                              |
| ---------- | --------------------------------------------------------------------- |
| `off`      | Nonaktifkan streaming pratinjau                                             |
| `partial`  | Satu pratinjau diganti dengan teks terbaru                              |
| `block`    | Pratinjau diperbarui dalam langkah-langkah terpotong/ditambahkan                             |
| `progress` | Pratinjau progres/status selama pembuatan, jawaban akhir setelah selesai |

`streaming.mode: "block"` adalah mode streaming pratinjau untuk saluran yang mendukung pengeditan
seperti Discord dan Telegram; mode ini tidak dengan sendirinya mengaktifkan pengiriman blok
saluran di sana. Gunakan `streaming.block.enabled` untuk balasan blok biasa.
Microsoft Teams adalah
pengecualian: platform ini tidak memiliki transportasi blok pratinjau draf, sehingga `streaming.mode:
"block"` menonaktifkan streaming native sepenuhnya dan balasan dikirim sebagai
pengiriman blok biasa, bukan streaming parsial/progres native. Mattermost juga
berbeda: dalam mode `block`, platform ini merotasi pratinjau antara teks yang selesai dan
blok aktivitas alat, sehingga blok sebelumnya tetap terlihat sebagai kiriman terpisah,
alih-alih ditimpa dalam satu draf yang dapat diedit.

### Pemetaan saluran

| Saluran    | `off` | `partial` | `block` | `progress`              |
| ---------- | ----- | --------- | ------- | ----------------------- |
| Telegram   | Ya   | Ya       | Ya     | draf progres yang dapat diedit |
| Discord    | Ya   | Ya       | Ya     | draf progres yang dapat diedit |
| Slack      | Ya   | Ya       | Ya     | Ya                     |
| Mattermost | Ya   | Ya       | Ya     | Ya                     |
| MS Teams   | Ya   | Ya       | Ya     | aliran progres native  |

Konfigurasi potongan pratinjau (`streaming.preview.chunk.*`, mis. di bawah
`channels.discord.streaming` atau `channels.telegram.streaming`) secara default adalah
`minChars: 200`, `maxChars: 800` (dibatasi ke `textChunkLimit` saluran), dan
`breakPreference: "paragraph"`.

Khusus Slack:

- `channels.slack.streaming.nativeTransport` mengaktifkan atau menonaktifkan panggilan API streaming native Slack
  (`chat.startStream`/`chat.appendStream`/`chat.stopStream`) saat
  `channels.slack.streaming.mode="partial"` (default: `true`).
- Streaming native Slack dan status utas asisten Slack memerlukan target
  utas balasan. DM tingkat atas tidak menampilkan pratinjau bergaya utas tersebut, tetapi
  tetap dapat menggunakan kiriman pratinjau draf Slack dan pengeditannya.

### Migrasi kunci lama

| Saluran  | Kunci lama                                                 | Status                                                                                                                                               |
| -------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram | `streamMode`, `streaming` skalar/boolean                    | Ditulis ulang menjadi `streaming.mode` oleh `openclaw doctor --fix`; tidak dibaca saat runtime                                                                        |
| Discord  | `streamMode`, `streaming` boolean                           | Ditulis ulang menjadi `streaming.mode` oleh `openclaw doctor --fix`; tidak dibaca saat runtime                                                                        |
| Slack    | `streamMode`; `streaming` boolean; `nativeStreaming` lama | Ditulis ulang menjadi `streaming.mode` (dan `streaming.nativeTransport` untuk bentuk boolean/lama) oleh `openclaw doctor --fix`; tidak dibaca saat runtime         |
| Matrix   | `streaming` skalar/boolean                                  | Ditulis ulang menjadi `streaming.mode` (termasuk mode `"quiet"` Matrix) oleh `openclaw doctor --fix`; tidak dibaca saat runtime                                    |
| Feishu   | `streaming` boolean                                         | Ditulis ulang menjadi `streaming.mode` oleh `openclaw doctor --fix`; tidak dibaca saat runtime                                                                        |
| QQ Bot   | `streaming` boolean; `streaming.c2cStreamApi`               | Ditulis ulang menjadi `streaming.mode` (dan `streaming.nativeTransport` untuk bentuk boolean/`c2cStreamApi`) oleh `openclaw doctor --fix`; tidak dibaca saat runtime |

## Perilaku runtime

### Telegram

- Menggunakan pembaruan pratinjau `sendMessage` + `editMessageText` di seluruh DM dan
  grup/topik; teks akhir mengedit pratinjau aktif secara langsung. Draf "mengetik"
  sementara Telegram selama 30 detik (`sendMessageDraft`) tidak digunakan untuk
  streaming jawaban.
- Pratinjau awal yang singkat tetap diberi debounce untuk pengalaman pengguna notifikasi push, tetapi
  ditampilkan setelah penundaan terbatas agar proses aktif tidak tetap senyap secara visual.
- Hasil akhir yang panjang menggunakan kembali pesan pratinjau untuk potongan pertama dan hanya mengirim
  potongan sisanya.
- Mode `block` merotasi pratinjau menjadi pesan baru pada
  `streaming.preview.chunk.maxChars` (default 800, dibatasi pada batas pengeditan Telegram sebesar
  4096); mode lain memperpanjang satu pratinjau hingga 4096 karakter.
- Mode `progress` menyimpan progres alat dalam draf status yang dapat diedit, menampilkan
  label status saat streaming jawaban aktif tetapi belum ada baris alat,
  menghapus draf saat selesai, dan mengirim jawaban akhir
  melalui pengiriman normal.
- Jika pengeditan akhir gagal sebelum teks lengkap dikonfirmasi, OpenClaw menggunakan
  pengiriman akhir normal dan membersihkan pratinjau usang.
- Streaming pratinjau dilewati saat streaming blok Telegram diaktifkan secara eksplisit,
  untuk menghindari streaming ganda.
- `/reasoning stream` dapat menuliskan penalaran ke pratinjau sementara yang
  dihapus setelah pengiriman akhir.
- Balasan kutipan terpilih Telegram merupakan pengecualian: ketika `replyToMode` bukan
  `"off"` dan terdapat teks kutipan terpilih, OpenClaw melewati streaming
  pratinjau jawaban untuk giliran tersebut (jawaban akhir harus melalui jalur
  balasan kutipan native) sehingga baris pratinjau progres alat tidak dapat dirender. Balasan
  ke pesan saat ini tanpa teks kutipan terpilih tetap mempertahankan streaming pratinjau. Lihat
  [dokumentasi kanal Telegram](/id/channels/telegram) untuk detailnya.

### Discord

- Menggunakan pengiriman + pengeditan pesan pratinjau.
- Mode `block` menggunakan pemotongan draf (`draftChunk`).
- Streaming pratinjau dilewati saat streaming blok Discord diaktifkan secara eksplisit.
- Mode `progress` menambahkan tanda terima aktivitas `-#` kecil (jumlah pemikiran/panggilan
  alat dan waktu yang berlalu) ke jawaban akhir serta menghapus draf status
  setelah jawaban tersebut dikirim, sehingga kanal yang sibuk tidak menyisakan log alat yatim
  di atas balasan. Hasil akhir yang berupa galat mempertahankan draf sebagai catatan giliran
  yang gagal.
- Payload media akhir, galat, dan balasan eksplisit membatalkan pratinjau tertunda
  tanpa mengirim draf baru, lalu menggunakan pengiriman normal.

### Slack

- `partial` dapat menggunakan streaming native Slack (`chat.startStream`/`append`/`stop`)
  jika tersedia.
- `block` menggunakan pratinjau draf bergaya penambahan.
- `progress` menggunakan teks pratinjau status, lalu jawaban akhir.
- DM tingkat atas tanpa utas balasan menggunakan postingan dan pengeditan pratinjau draf
  alih-alih streaming native Slack.
- Streaming pratinjau native dan draf menekan balasan blok untuk giliran tersebut, sehingga
  balasan Slack hanya di-streaming melalui satu jalur pengiriman.
- Payload media/galat akhir dan hasil akhir progres tidak membuat pesan draf sementara;
  hanya hasil akhir teks/blok yang dapat mengedit pratinjau yang mengirim teks draf tertunda.

### Mattermost

- Dalam mode `partial`, melakukan streaming pemikiran dan teks balasan parsial ke satu postingan
  pratinjau draf yang diselesaikan secara langsung ketika jawaban akhir aman untuk dikirim.
- Dalam mode `progress`, melakukan streaming pemikiran dan aktivitas alat ke satu pratinjau
  status yang diselesaikan secara langsung ketika jawaban akhir aman untuk dikirim.
- Dalam mode `block`, merotasi antara teks lengkap dan postingan aktivitas alat;
  pembaruan alat paralel dan berurutan berbagi postingan aktivitas alat saat ini.
- Beralih ke pengiriman postingan akhir baru jika postingan pratinjau telah dihapus atau
  tidak tersedia saat finalisasi.
- Payload media/galat akhir membatalkan pembaruan pratinjau tertunda sebelum pengiriman
  normal, alih-alih mengirim postingan pratinjau sementara.

### Matrix

- Pratinjau draf diselesaikan secara langsung ketika teks akhir dapat menggunakan kembali peristiwa
  pratinjau.
- Hasil akhir khusus media, galat, dan ketidakcocokan target balasan membatalkan pembaruan pratinjau
  tertunda sebelum pengiriman normal; pratinjau usang yang sudah terlihat akan disunting.

## Pembaruan pratinjau progres alat

Streaming pratinjau juga dapat menyertakan pembaruan **progres alat**: baris status
singkat seperti "menelusuri web", "membaca file", atau "memanggil alat" yang muncul
dalam pesan pratinjau yang sama saat alat sedang berjalan, sebelum balasan akhir.
Dalam mode server aplikasi Codex, pesan pembuka/komentar Codex menggunakan jalur
pratinjau yang sama, sehingga catatan progres singkat "Saya sedang memeriksa..." dapat di-streaming ke
draf yang dapat diedit tanpa menjadi bagian dari jawaban akhir. Hal ini menjaga
giliran alat multi-langkah tetap aktif secara visual, alih-alih senyap antara
pratinjau pemikiran pertama dan jawaban akhir.

Alat yang berjalan lama dapat menghasilkan progres bertipe sebelum selesai. Misalnya,
`web_fetch` mengaktifkan pengatur waktu lima detik saat dimulai: jika pengambilan masih
tertunda, pratinjau menampilkan `Fetching page content...`; jika pengambilan selesai atau
dibatalkan sebelumnya, tidak ada baris progres yang dihasilkan. Hasil akhir alat
berikutnya tetap dikirimkan secara normal ke model.

Permukaan yang didukung:

- **Discord**, **Slack**, **Telegram**, dan **Matrix** melakukan streaming progres alat dan
  pembaruan pembuka Codex ke pengeditan pratinjau aktif secara default saat streaming
  pratinjau aktif. Microsoft Teams menggunakan streaming progres native-nya dalam
  obrolan pribadi.
- Telegram telah dikirimkan dengan pembaruan pratinjau progres alat yang diaktifkan sejak
  `v2026.4.22`; mempertahankannya tetap aktif menjaga perilaku yang telah dirilis tersebut.
- **Mattermost** menggabungkan aktivitas alat ke dalam satu postingan pratinjau dalam mode `partial` dan
  `progress`, atau satu postingan aktivitas alat di antara blok teks dalam mode `block`
  (lihat di atas).
- Pengeditan progres alat mengikuti mode streaming pratinjau aktif; pengeditan ini
  dilewati saat streaming pratinjau adalah `off` atau saat streaming blok telah
  mengambil alih pesan. Di Telegram, `streaming.mode: "off"` hanya untuk hasil akhir: percakapan
  progres generik juga ditekan alih-alih dikirimkan sebagai pesan status mandiri,
  sementara prompt persetujuan, payload media, dan galat tetap dirutekan
  secara normal.
- Untuk mempertahankan streaming pratinjau tetapi menyembunyikan baris progres alat, atur
  `streaming.preview.toolProgress` ke `false` untuk kanal tersebut (default
  `true`). Untuk mempertahankan baris progres alat tetap terlihat sembari menyembunyikan teks perintah/eksekusi,
  atur `streaming.preview.commandText` ke `"status"` atau
  `streaming.progress.commandText` ke `"status"`; default-nya adalah `"raw"` untuk
  mempertahankan perilaku yang telah dirilis. Kebijakan ini digunakan bersama oleh kanal draf/progres
  yang menggunakan perender progres ringkas OpenClaw, termasuk Discord, Matrix,
  Microsoft Teams, Mattermost, pratinjau draf Slack, dan Telegram. Untuk menonaktifkan
  pengeditan pratinjau sepenuhnya, atur `streaming.mode` ke `off`.

## Perenderan draf progres

Draf mode progres (`streaming.progress.*`) dibatasi dan dapat dikonfigurasi per
kanal:

| Kunci                             | Default       | Perilaku                                                       |
| --------------------------------- | ------------- | -------------------------------------------------------------- |
| `streaming.progress.maxLines`     | `8`           | Jumlah maksimum baris progres ringkas yang dipertahankan di bawah label draf |
| `streaming.progress.maxLineChars` | `120`         | Jumlah maksimum karakter per baris ringkas sebelum pemotongan (memperhatikan kata) |
| `streaming.progress.label`        | `"auto"`      | Judul draf; string khusus, atau `false` untuk menyembunyikannya |
| `streaming.progress.labels`       | kumpulan bawaan | Label kandidat yang digunakan saat `label: "auto"`          |

### Jalur progres komentar

Selain progres alat, perender progres ringkas dapat menampilkan satu jalur tambahan
dalam draf:

- **`streaming.progress.commentary`** - merender **komentar** model sebelum penggunaan alat
  (narasi singkat "Saya akan memeriksa... lalu...") secara berselang-seling dengan
  baris alat dalam draf progres. Pada Discord dan Telegram dalam mode progres,
  pembuka yang sama menyediakan judul status bahkan ketika jalur opsional ini
  dinonaktifkan; kanal lain mempertahankan perilaku progresnya yang ada. Lihat
  [Draf progres](/id/concepts/progress-drafts#status-headline).

```json
{
  "channels": {
    "discord": {
      "streaming": { "mode": "progress", "progress": { "commentary": true } }
    }
  }
}
```

Pertahankan baris progres tetap terlihat tetapi sembunyikan teks mentah perintah/eksekusi:

```json
{
  "channels": {
    "telegram": {
      "streaming": {
        "mode": "partial",
        "preview": {
          "toolProgress": true,
          "commandText": "status"
        }
      }
    }
  }
}
```

Gunakan bentuk yang sama di bawah kunci kanal progres ringkas lainnya, misalnya
`channels.discord`, `channels.matrix`, `channels.msteams`,
`channels.mattermost`, atau pratinjau draf Slack. Untuk mode draf progres, letakkan
kebijakan yang sama di bawah `streaming.progress`:

```json
{
  "channels": {
    "telegram": {
      "streaming": {
        "mode": "progress",
        "progress": {
          "toolProgress": true,
          "commandText": "status"
        }
      }
    }
  }
}
```

## Terkait

- [Refaktor siklus hidup pesan](/id/concepts/message-lifecycle-refactor) - desain bersama yang dituju untuk pratinjau, pengeditan, streaming, dan finalisasi
- [Draf progres](/id/concepts/progress-drafts) - pesan pekerjaan yang sedang berlangsung dan terlihat, yang diperbarui selama giliran panjang
- [Pesan](/id/concepts/messages) - siklus hidup dan pengiriman pesan
- [Percobaan ulang](/id/concepts/retry) - perilaku percobaan ulang saat pengiriman gagal
- [Kanal](/id/channels) - dukungan streaming per kanal
