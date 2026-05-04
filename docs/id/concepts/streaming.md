---
read_when:
    - Menjelaskan cara kerja pengaliran atau pemecahan menjadi potongan pada saluran
    - Mengubah perilaku streaming blok atau pemecahan kanal
    - Men-debug balasan blok duplikat/terlalu awal atau streaming pratinjau saluran
summary: Perilaku streaming + chunking (balasan blok, streaming pratinjau saluran, pemetaan mode)
title: Streaming dan pemotongan
x-i18n:
    generated_at: "2026-05-04T07:04:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: ff7b6cd8127255352fe16fb746469e9828e7d5aea183d3799ab10cc768515bd1
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw memiliki dua lapisan streaming terpisah:

- **Streaming blok (saluran):** emit **blok** yang telah selesai saat asisten menulis. Ini adalah pesan saluran normal (bukan delta token).
- **Streaming pratinjau (Telegram/Discord/Slack):** perbarui **pesan pratinjau** sementara selama pembuatan.

Saat ini **belum ada streaming delta token sejati** ke pesan saluran. Streaming pratinjau berbasis pesan (kirim + edit/tambahkan).

## Streaming blok (pesan saluran)

Streaming blok mengirim output asisten dalam potongan kasar saat tersedia.

```
Model output
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ chunker emits blocks as buffer grows
       └─ (blockStreamingBreak=message_end)
            └─ chunker flushes at message_end
                   └─ channel send (block replies)
```

Legenda:

- `text_delta/events`: peristiwa stream model (mungkin jarang untuk model non-streaming).
- `chunker`: `EmbeddedBlockChunker` yang menerapkan batas min/maks + preferensi jeda.
- `channel send`: pesan keluar aktual (balasan blok).

**Kontrol:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (default nonaktif).
- Override saluran: `*.blockStreaming` (dan varian per akun) untuk memaksa `"on"`/`"off"` per saluran.
- `agents.defaults.blockStreamingBreak`: `"text_end"` atau `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (gabungkan blok yang di-stream sebelum dikirim).
- Batas keras saluran: `*.textChunkLimit` (misalnya, `channels.whatsapp.textChunkLimit`).
- Mode potongan saluran: `*.chunkMode` (`length` default, `newline` memecah pada baris kosong (batas paragraf) sebelum pemotongan berdasarkan panjang).
- Batas lunak Discord: `channels.discord.maxLinesPerMessage` (default 17) memecah balasan tinggi untuk menghindari pemotongan UI.

**Semantik batas:**

- `text_end`: stream blok segera setelah chunker emit; flush pada setiap `text_end`.
- `message_end`: tunggu hingga pesan asisten selesai, lalu flush output yang dibuffer.

`message_end` tetap menggunakan chunker jika teks yang dibuffer melebihi `maxChars`, sehingga dapat emit beberapa potongan di akhir.

### Pengiriman media dengan streaming blok

Direktif `MEDIA:` adalah metadata pengiriman normal. Saat streaming blok mengirim blok media lebih awal, OpenClaw mengingat pengiriman tersebut untuk giliran itu. Jika payload akhir asisten mengulang URL media yang sama, pengiriman akhir menghapus media duplikat alih-alih mengirim lampiran lagi.

Payload akhir yang merupakan duplikat persis akan ditekan. Jika payload akhir menambahkan teks berbeda di sekitar media yang sudah di-stream, OpenClaw tetap mengirim teks baru sambil menjaga media hanya dikirim sekali. Ini mencegah catatan suara atau file duplikat di saluran seperti Telegram ketika agen emit `MEDIA:` selama streaming dan penyedia juga menyertakannya dalam balasan selesai.

## Algoritme pemotongan (batas rendah/tinggi)

Pemotongan blok diimplementasikan oleh `EmbeddedBlockChunker`:

- **Batas rendah:** jangan emit hingga buffer >= `minChars` (kecuali dipaksa).
- **Batas tinggi:** prioritaskan pemisahan sebelum `maxChars`; jika dipaksa, pisah pada `maxChars`.
- **Preferensi jeda:** `paragraph` → `newline` → `sentence` → `whitespace` → jeda keras.
- **Code fence:** jangan pernah memisah di dalam fence; ketika dipaksa pada `maxChars`, tutup + buka kembali fence agar Markdown tetap valid.

`maxChars` dibatasi ke `textChunkLimit` saluran, sehingga Anda tidak dapat melampaui batas per saluran.

## Penggabungan (menggabungkan blok yang di-stream)

Saat streaming blok diaktifkan, OpenClaw dapat **menggabungkan potongan blok berurutan** sebelum mengirimnya keluar. Ini mengurangi “spam satu baris” sambil tetap memberikan output progresif.

- Penggabungan menunggu **celah idle** (`idleMs`) sebelum flush.
- Buffer dibatasi oleh `maxChars` dan akan flush jika melampauinya.
- `minChars` mencegah fragmen kecil dikirim hingga teks yang terkumpul cukup (flush akhir selalu mengirim teks yang tersisa).
- Penggabung diturunkan dari `blockStreamingChunk.breakPreference` (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → spasi).
- Override saluran tersedia melalui `*.blockStreamingCoalesce` (termasuk konfigurasi per akun).
- Default coalesce `minChars` dinaikkan menjadi 1500 untuk Signal/Slack/Discord kecuali dioverride.

## Jeda mirip manusia antar blok

Saat streaming blok diaktifkan, Anda dapat menambahkan **jeda acak** di antara balasan blok (setelah blok pertama). Ini membuat respons multi-gelembung terasa lebih alami.

- Konfigurasi: `agents.defaults.humanDelay` (override per agen melalui `agents.list[].humanDelay`).
- Mode: `off` (default), `natural` (800–2500ms), `custom` (`minMs`/`maxMs`).
- Hanya berlaku untuk **balasan blok**, bukan balasan akhir atau ringkasan alat.

## "Stream potongan atau semuanya"

Ini dipetakan ke:

- **Stream potongan:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (emit sambil berjalan). Saluran non-Telegram juga memerlukan `*.blockStreaming: true`.
- **Stream semuanya di akhir:** `blockStreamingBreak: "message_end"` (flush sekali, mungkin beberapa potongan jika sangat panjang).
- **Tanpa streaming blok:** `blockStreamingDefault: "off"` (hanya balasan akhir).

**Catatan saluran:** Streaming blok **nonaktif kecuali**
`*.blockStreaming` disetel secara eksplisit ke `true`. Saluran dapat melakukan streaming pratinjau langsung (`channels.<channel>.streaming`) tanpa balasan blok.

Pengingat lokasi konfigurasi: default `blockStreaming*` berada di bawah
`agents.defaults`, bukan konfigurasi root.

## Mode streaming pratinjau

Kunci kanonis: `channels.<channel>.streaming`

Mode:

- `off`: nonaktifkan streaming pratinjau.
- `partial`: satu pratinjau yang diganti dengan teks terbaru.
- `block`: pratinjau diperbarui dalam langkah yang dipotong/ditambahkan.
- `progress`: pratinjau progres/status selama pembuatan, jawaban akhir saat selesai.

`streaming.mode: "block"` adalah mode streaming pratinjau untuk saluran yang mendukung edit seperti Discord dan Telegram. Ini tidak mengaktifkan pengiriman blok saluran di sana. Gunakan `streaming.block.enabled` atau kunci saluran lama `blockStreaming` saat Anda menginginkan balasan blok normal. Microsoft Teams adalah pengecualian: saluran ini tidak memiliki transport blok pratinjau draf, sehingga `streaming.mode: "block"` dipetakan ke pengiriman blok Teams alih-alih streaming parsial/progres native.

### Pemetaan saluran

| Saluran    | `off` | `partial` | `block` | `progress`              |
| ---------- | ----- | --------- | ------- | ----------------------- |
| Telegram   | ✅    | ✅        | ✅      | draf progres yang dapat diedit |
| Discord    | ✅    | ✅        | ✅      | draf progres yang dapat diedit |
| Slack      | ✅    | ✅        | ✅      | ✅                      |
| Mattermost | ✅    | ✅        | ✅      | ✅                      |
| MS Teams   | ✅    | ✅        | ✅      | stream progres native   |

Khusus Slack:

- `channels.slack.streaming.nativeTransport` mengalihkan panggilan API streaming native Slack saat `channels.slack.streaming.mode="partial"` (default: `true`).
- Streaming native Slack dan status thread asisten Slack memerlukan target thread balasan. DM tingkat atas tidak menampilkan pratinjau bergaya thread tersebut, tetapi tetap dapat menggunakan posting pratinjau draf Slack dan edit.

Migrasi kunci lama:

- Telegram: `streamMode` lama dan nilai skalar/boolean `streaming` dideteksi dan dimigrasikan oleh jalur kompatibilitas doctor/konfigurasi ke `streaming.mode`.
- Discord: `streamMode` + boolean `streaming` otomatis bermigrasi ke enum `streaming`.
- Slack: `streamMode` otomatis bermigrasi ke `streaming.mode`; boolean `streaming` otomatis bermigrasi ke `streaming.mode` plus `streaming.nativeTransport`; `nativeStreaming` lama otomatis bermigrasi ke `streaming.nativeTransport`.

### Perilaku runtime

Telegram:

- Menggunakan pembaruan pratinjau `sendMessage` + `editMessageText` di DM dan grup/topik.
- Mengirim pesan akhir baru alih-alih mengedit di tempat ketika pratinjau telah terlihat sekitar satu menit, lalu membersihkan pratinjau agar timestamp Telegram mencerminkan penyelesaian balasan.
- Streaming pratinjau dilewati saat streaming blok Telegram diaktifkan secara eksplisit (untuk menghindari streaming ganda).
- `/reasoning stream` dapat menulis penalaran ke pratinjau sementara yang dihapus setelah pengiriman akhir.

Discord:

- Menggunakan pesan pratinjau kirim + edit.
- Mode `block` menggunakan pemotongan draf (`draftChunk`).
- Streaming pratinjau dilewati saat streaming blok Discord diaktifkan secara eksplisit.
- Payload media akhir, error, dan balasan eksplisit membatalkan pratinjau tertunda tanpa flush draf baru, lalu menggunakan pengiriman normal.

Slack:

- `partial` dapat menggunakan streaming native Slack (`chat.startStream`/`append`/`stop`) saat tersedia.
- `block` menggunakan pratinjau draf bergaya append.
- `progress` menggunakan teks pratinjau status, lalu jawaban akhir.
- DM tingkat atas tanpa thread balasan menggunakan posting pratinjau draf dan edit alih-alih streaming native Slack.
- Streaming pratinjau native dan draf menekan balasan blok untuk giliran itu, sehingga balasan Slack di-stream oleh satu jalur pengiriman saja.
- Payload media/error akhir dan final progres tidak membuat pesan draf sekali pakai; hanya final teks/blok yang dapat mengedit pratinjau yang mem-flush teks draf tertunda.

Mattermost:

- Men-stream pemikiran, aktivitas alat, dan teks balasan parsial ke satu posting pratinjau draf yang difinalisasi di tempat saat jawaban akhir aman untuk dikirim.
- Fallback ke pengiriman posting akhir baru jika posting pratinjau dihapus atau tidak tersedia pada waktu finalisasi.
- Payload media/error akhir membatalkan pembaruan pratinjau tertunda sebelum pengiriman normal alih-alih mem-flush posting pratinjau sementara.

Matrix:

- Pratinjau draf difinalisasi di tempat saat teks akhir dapat menggunakan ulang event pratinjau.
- Final media-saja, error, dan ketidakcocokan target balasan membatalkan pembaruan pratinjau tertunda sebelum pengiriman normal; pratinjau basi yang sudah terlihat direduksi.

### Pembaruan pratinjau progres alat

Streaming pratinjau juga dapat menyertakan pembaruan **progres alat** — baris status singkat seperti "searching the web", "reading file", atau "calling tool" — yang muncul di pesan pratinjau yang sama saat alat berjalan, sebelum balasan akhir. Ini membuat giliran alat multi-langkah tetap terlihat aktif alih-alih diam di antara pratinjau pemikiran pertama dan jawaban akhir.

Permukaan yang didukung:

- **Discord**, **Slack**, **Telegram**, dan **Matrix** men-stream progres alat ke edit pratinjau langsung secara default saat streaming pratinjau aktif. Microsoft Teams menggunakan stream progres native-nya dalam chat pribadi.
- Telegram telah dirilis dengan pembaruan pratinjau progres alat yang diaktifkan sejak `v2026.4.22`; mempertahankannya tetap aktif menjaga perilaku yang sudah dirilis tersebut.
- **Mattermost** sudah menggabungkan aktivitas alat ke dalam satu posting pratinjau drafnya (lihat di atas).
- Edit progres alat mengikuti mode streaming pratinjau aktif; edit ini dilewati saat streaming pratinjau `off` atau ketika streaming blok telah mengambil alih pesan. Di Telegram, `streaming.mode: "off"` bersifat hanya-final: obrolan progres generik juga ditekan alih-alih dikirim sebagai pesan status mandiri, sementara prompt persetujuan, payload media, dan error tetap dirutekan secara normal.
- Untuk mempertahankan streaming pratinjau tetapi menyembunyikan baris progres alat, setel `streaming.preview.toolProgress` ke `false` untuk saluran tersebut. Untuk mempertahankan baris progres alat tetap terlihat sambil menyembunyikan teks perintah/eksekusi, setel `streaming.preview.commandText` ke `"status"` atau `streaming.progress.commandText` ke `"status"`; defaultnya adalah `"raw"` untuk mempertahankan perilaku yang sudah dirilis. Kebijakan ini dibagikan oleh saluran draf/progres yang menggunakan perender progres ringkas OpenClaw, termasuk Discord, Matrix, Microsoft Teams, Mattermost, pratinjau draf Slack, dan Telegram. Untuk menonaktifkan edit pratinjau sepenuhnya, setel `streaming.mode` ke `off`.
- Balasan kutipan terpilih Telegram adalah pengecualian: saat `replyToMode` bukan `"off"` dan teks kutipan terpilih ada, OpenClaw melewati stream pratinjau jawaban untuk giliran itu sehingga baris pratinjau progres alat tidak dapat dirender. Balasan pesan saat ini tanpa teks kutipan terpilih tetap mempertahankan streaming pratinjau. Lihat [dokumentasi saluran Telegram](/id/channels/telegram) untuk detail.

Biarkan baris progres tetap terlihat tetapi sembunyikan teks perintah/eksekusi mentah:

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

Gunakan bentuk yang sama di bawah kunci kanal progres ringkas lainnya, misalnya `channels.discord`, `channels.matrix`, `channels.msteams`, `channels.mattermost`, atau pratinjau draf Slack. Untuk mode draf progres, letakkan kebijakan yang sama di bawah `streaming.progress`:

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

- [Draf progres](/id/concepts/progress-drafts) — pesan pekerjaan yang sedang berlangsung yang terlihat dan diperbarui selama giliran yang panjang
- [Pesan](/id/concepts/messages) — siklus hidup dan pengiriman pesan
- [Coba ulang](/id/concepts/retry) — perilaku percobaan ulang saat pengiriman gagal
- [Kanal](/id/channels) — dukungan pengaliran per kanal
