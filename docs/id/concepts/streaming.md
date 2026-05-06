---
read_when:
    - Menjelaskan cara kerja streaming atau pemecahan menjadi bagian-bagian pada saluran
    - Mengubah perilaku pengaliran blok atau pemecahan kanal menjadi potongan
    - Memecahkan masalah balasan blok duplikat/terlalu awal atau streaming pratinjau kanal
summary: Perilaku pengaliran + pemotongan (balasan blok, pengaliran pratinjau saluran, pemetaan mode)
title: Streaming dan pemecahan menjadi potongan
x-i18n:
    generated_at: "2026-05-06T09:09:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7ccf763c5904b9b01d127d6e9a914e73100137eba9d791654581a2ec7d4949ed
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw memiliki dua lapisan streaming terpisah:

- **Streaming blok (kanal):** memancarkan **blok** yang sudah selesai saat asisten menulis. Ini adalah pesan kanal normal (bukan delta token).
- **Streaming pratinjau (Telegram/Discord/Slack):** memperbarui **pesan pratinjau** sementara saat menghasilkan keluaran.

Saat ini **tidak ada streaming delta token sejati** ke pesan kanal. Streaming pratinjau berbasis pesan (kirim + edit/tambahkan).

## Streaming blok (pesan kanal)

Streaming blok mengirim keluaran asisten dalam potongan kasar saat tersedia.

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

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (default mati).
- Override kanal: `*.blockStreaming` (dan varian per akun) untuk memaksa `"on"`/`"off"` per kanal.
- `agents.defaults.blockStreamingBreak`: `"text_end"` atau `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (gabungkan blok yang di-stream sebelum dikirim).
- Batas keras kanal: `*.textChunkLimit` (misalnya, `channels.whatsapp.textChunkLimit`).
- Mode potongan kanal: `*.chunkMode` (`length` default, `newline` memisahkan pada baris kosong (batas paragraf) sebelum pemotongan berdasarkan panjang).
- Batas lunak Discord: `channels.discord.maxLinesPerMessage` (default 17) memisahkan balasan tinggi untuk menghindari pemotongan UI.

**Semantik batas:**

- `text_end`: stream blok segera setelah chunker memancarkan; flush pada setiap `text_end`.
- `message_end`: tunggu hingga pesan asisten selesai, lalu flush keluaran yang di-buffer.

`message_end` tetap menggunakan chunker jika teks yang di-buffer melebihi `maxChars`, sehingga dapat memancarkan beberapa potongan di akhir.

### Pengiriman media dengan streaming blok

Direktif `MEDIA:` adalah metadata pengiriman normal. Saat streaming blok mengirim blok media lebih awal, OpenClaw mengingat pengiriman itu untuk giliran tersebut. Jika payload asisten final mengulangi URL media yang sama, pengiriman final menghapus media duplikat alih-alih mengirim lampiran lagi.

Payload final yang benar-benar duplikat disupresi. Jika payload final menambahkan teks berbeda di sekitar media yang sudah di-stream, OpenClaw tetap mengirim teks baru sambil menjaga media hanya dikirim sekali. Ini mencegah duplikasi catatan suara atau file pada kanal seperti Telegram saat agen memancarkan `MEDIA:` selama streaming dan penyedia juga menyertakannya dalam balasan selesai.

## Algoritme pemotongan (batas rendah/tinggi)

Pemotongan blok diimplementasikan oleh `EmbeddedBlockChunker`:

- **Batas rendah:** jangan memancarkan hingga buffer >= `minChars` (kecuali dipaksa).
- **Batas tinggi:** utamakan pemisahan sebelum `maxChars`; jika dipaksa, pisahkan pada `maxChars`.
- **Preferensi jeda:** `paragraph` → `newline` → `sentence` → `whitespace` → jeda keras.
- **Code fence:** jangan pernah memisahkan di dalam fence; saat dipaksa pada `maxChars`, tutup + buka kembali fence agar Markdown tetap valid.

`maxChars` dibatasi ke `textChunkLimit` kanal, sehingga Anda tidak dapat melampaui batas per kanal.

## Koalesensi (menggabungkan blok yang di-stream)

Saat streaming blok diaktifkan, OpenClaw dapat **menggabungkan potongan blok berurutan** sebelum mengirimnya keluar. Ini mengurangi "spam satu baris" sambil tetap memberikan keluaran progresif.

- Koalesensi menunggu **jeda idle** (`idleMs`) sebelum flush.
- Buffer dibatasi oleh `maxChars` dan akan di-flush jika melampauinya.
- `minChars` mencegah fragmen kecil dikirim hingga teks yang terkumpul cukup (flush final selalu mengirim sisa teks).
- Penggabung diturunkan dari `blockStreamingChunk.breakPreference` (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → spasi).
- Override kanal tersedia melalui `*.blockStreamingCoalesce` (termasuk konfigurasi per akun).
- `minChars` koalesensi default dinaikkan menjadi 1500 untuk Signal/Slack/Discord kecuali dioverride.

## Jeda antarmanusia di antara blok

Saat streaming blok diaktifkan, Anda dapat menambahkan **jeda acak** di antara balasan blok (setelah blok pertama). Ini membuat respons multi-gelembung terasa lebih alami.

- Konfigurasi: `agents.defaults.humanDelay` (override per agen melalui `agents.list[].humanDelay`).
- Mode: `off` (default), `natural` (800-2500ms), `custom` (`minMs`/`maxMs`).
- Hanya berlaku untuk **balasan blok**, bukan balasan final atau ringkasan alat.

## "Stream potongan atau semuanya"

Ini dipetakan ke:

- **Stream potongan:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (pancarkan sambil berjalan). Kanal non-Telegram juga memerlukan `*.blockStreaming: true`.
- **Stream semuanya di akhir:** `blockStreamingBreak: "message_end"` (flush sekali, mungkin beberapa potongan jika sangat panjang).
- **Tanpa streaming blok:** `blockStreamingDefault: "off"` (hanya balasan final).

**Catatan kanal:** Streaming blok **mati kecuali**
`*.blockStreaming` secara eksplisit diatur ke `true`. Kanal dapat melakukan streaming pratinjau langsung
(`channels.<channel>.streaming`) tanpa balasan blok.

Pengingat lokasi konfigurasi: default `blockStreaming*` berada di bawah
`agents.defaults`, bukan konfigurasi root.

## Mode streaming pratinjau

Kunci kanonis: `channels.<channel>.streaming`

Mode:

- `off`: nonaktifkan streaming pratinjau.
- `partial`: satu pratinjau yang diganti dengan teks terbaru.
- `block`: pratinjau diperbarui dalam langkah yang dipotong/ditambahkan.
- `progress`: pratinjau progres/status selama pembuatan, jawaban final saat selesai.

`streaming.mode: "block"` adalah mode streaming pratinjau untuk kanal yang dapat diedit seperti Discord dan Telegram. Ini tidak mengaktifkan pengiriman blok kanal di sana. Gunakan `streaming.block.enabled` atau kunci kanal lama `blockStreaming` saat Anda menginginkan balasan blok normal. Microsoft Teams adalah pengecualian: tidak memiliki transport blok pratinjau draf, sehingga `streaming.mode: "block"` dipetakan ke pengiriman blok Teams alih-alih streaming parsial/progres native.

### Pemetaan kanal

| Kanal      | `off` | `partial` | `block` | `progress`              |
| ---------- | ----- | --------- | ------- | ----------------------- |
| Telegram   | ✅    | ✅        | ✅      | draf progres yang dapat diedit |
| Discord    | ✅    | ✅        | ✅      | draf progres yang dapat diedit |
| Slack      | ✅    | ✅        | ✅      | ✅                      |
| Mattermost | ✅    | ✅        | ✅      | ✅                      |
| MS Teams   | ✅    | ✅        | ✅      | stream progres native   |

Khusus Slack:

- `channels.slack.streaming.nativeTransport` mengaktifkan/menonaktifkan panggilan API streaming native Slack saat `channels.slack.streaming.mode="partial"` (default: `true`).
- Streaming native Slack dan status thread asisten Slack memerlukan target thread balasan. DM tingkat atas tidak menampilkan pratinjau bergaya thread itu, tetapi masih dapat menggunakan posting pratinjau draf Slack dan edit.

Migrasi kunci lama:

- Telegram: nilai lama `streamMode` dan nilai skalar/boolean `streaming` dideteksi dan dimigrasikan oleh jalur kompatibilitas doctor/config ke `streaming.mode`.
- Discord: `streamMode` + boolean `streaming` otomatis bermigrasi ke enum `streaming`.
- Slack: `streamMode` otomatis bermigrasi ke `streaming.mode`; boolean `streaming` otomatis bermigrasi ke `streaming.mode` plus `streaming.nativeTransport`; `nativeStreaming` lama otomatis bermigrasi ke `streaming.nativeTransport`.

### Perilaku runtime

Telegram:

- Menggunakan pembaruan pratinjau `sendMessage` + `editMessageText` di seluruh DM dan grup/topik.
- Teks final mengedit pratinjau aktif di tempat; final panjang menggunakan kembali pesan itu untuk potongan pertama dan hanya mengirim potongan sisanya.
- Mode `progress` menjaga progres alat dalam draf status yang dapat diedit, membersihkan draf itu saat selesai, dan mengirim jawaban final melalui pengiriman normal.
- Jika edit final gagal sebelum teks selesai dikonfirmasi, OpenClaw menggunakan pengiriman final normal dan membersihkan pratinjau usang.
- Streaming pratinjau dilewati saat streaming blok Telegram diaktifkan secara eksplisit (untuk menghindari streaming ganda).
- `/reasoning stream` dapat menulis penalaran ke pratinjau sementara yang dihapus setelah pengiriman final.

Discord:

- Menggunakan pesan pratinjau kirim + edit.
- Mode `block` menggunakan pemotongan draf (`draftChunk`).
- Streaming pratinjau dilewati saat streaming blok Discord diaktifkan secara eksplisit.
- Payload media final, error, dan balasan eksplisit membatalkan pratinjau tertunda tanpa mem-flush draf baru, lalu menggunakan pengiriman normal.

Slack:

- `partial` dapat menggunakan streaming native Slack (`chat.startStream`/`append`/`stop`) saat tersedia.
- `block` menggunakan pratinjau draf bergaya tambahan.
- `progress` menggunakan teks pratinjau status, lalu jawaban final.
- DM tingkat atas tanpa thread balasan menggunakan posting pratinjau draf dan edit alih-alih streaming native Slack.
- Streaming pratinjau native dan draf menekan balasan blok untuk giliran itu, sehingga balasan Slack di-stream hanya oleh satu jalur pengiriman.
- Payload media/error final dan final progres tidak membuat pesan draf sekali pakai; hanya final teks/blok yang dapat mengedit pratinjau yang mem-flush teks draf tertunda.

Mattermost:

- Men-stream pemikiran, aktivitas alat, dan teks balasan parsial ke dalam satu posting pratinjau draf yang difinalisasi di tempat saat jawaban final aman untuk dikirim.
- Kembali mengirim posting final baru jika posting pratinjau dihapus atau tidak tersedia saat waktu finalisasi.
- Payload media/error final membatalkan pembaruan pratinjau tertunda sebelum pengiriman normal alih-alih mem-flush posting pratinjau sementara.

Matrix:

- Pratinjau draf difinalisasi di tempat saat teks final dapat menggunakan kembali peristiwa pratinjau.
- Final hanya-media, error, dan ketidakcocokan target balasan membatalkan pembaruan pratinjau tertunda sebelum pengiriman normal; pratinjau usang yang sudah terlihat direda ksi.

### Pembaruan pratinjau progres alat

Streaming pratinjau juga dapat menyertakan pembaruan **progres alat** - baris status pendek seperti "mencari di web", "membaca file", atau "memanggil alat" - yang muncul di pesan pratinjau yang sama saat alat berjalan, sebelum balasan final. Ini menjaga giliran alat multi-langkah tetap terlihat hidup, bukan senyap di antara pratinjau pemikiran pertama dan jawaban final.

Permukaan yang didukung:

- **Discord**, **Slack**, **Telegram**, dan **Matrix** men-stream progres alat ke dalam edit pratinjau langsung secara default saat streaming pratinjau aktif. Microsoft Teams menggunakan stream progres native-nya di obrolan personal.
- Telegram telah dikirim dengan pembaruan pratinjau progres alat yang diaktifkan sejak `v2026.4.22`; membiarkannya aktif mempertahankan perilaku rilis tersebut.
- **Mattermost** sudah menggabungkan aktivitas alat ke dalam satu posting pratinjau drafnya (lihat di atas).
- Edit progres alat mengikuti mode streaming pratinjau aktif; edit dilewati saat streaming pratinjau bernilai `off` atau saat streaming blok telah mengambil alih pesan. Di Telegram, `streaming.mode: "off"` bersifat final-saja: obrolan progres generik juga ditekan alih-alih dikirim sebagai pesan status mandiri, sementara prompt persetujuan, payload media, dan error tetap dirutekan secara normal.
- Untuk mempertahankan streaming pratinjau tetapi menyembunyikan baris progres alat, atur `streaming.preview.toolProgress` ke `false` untuk saluran tersebut. Untuk membiarkan baris progres alat terlihat sambil menyembunyikan teks perintah/eksekusi, atur `streaming.preview.commandText` ke `"status"` atau `streaming.progress.commandText` ke `"status"`; default-nya adalah `"raw"` untuk mempertahankan perilaku rilis. Kebijakan ini dibagikan oleh saluran draf/progres yang menggunakan perender progres ringkas OpenClaw, termasuk Discord, Matrix, Microsoft Teams, Mattermost, pratinjau draf Slack, dan Telegram. Untuk menonaktifkan edit pratinjau sepenuhnya, atur `streaming.mode` ke `off`.
- Balasan kutipan terpilih Telegram adalah pengecualian: saat `replyToMode` bukan `"off"` dan teks kutipan terpilih ada, OpenClaw melewati stream pratinjau jawaban untuk giliran tersebut sehingga baris pratinjau progres alat tidak dapat dirender. Balasan pesan saat ini tanpa teks kutipan terpilih tetap mempertahankan streaming pratinjau. Lihat [dokumentasi saluran Telegram](/id/channels/telegram) untuk detail.

Biarkan baris progres terlihat tetapi sembunyikan teks perintah/eksekusi mentah:

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

Gunakan bentuk yang sama di bawah kunci saluran progres ringkas lain, misalnya `channels.discord`, `channels.matrix`, `channels.msteams`, `channels.mattermost`, atau pratinjau draf Slack. Untuk mode draf-progres, letakkan kebijakan yang sama di bawah `streaming.progress`:

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

- [Refaktor siklus hidup pesan](/id/concepts/message-lifecycle-refactor) - desain target bersama untuk pratinjau, edit, stream, dan finalisasi
- [Draf progres](/id/concepts/progress-drafts) - pesan pekerjaan yang sedang berlangsung yang terlihat dan diperbarui selama giliran panjang
- [Pesan](/id/concepts/messages) - siklus hidup dan pengiriman pesan
- [Coba lagi](/id/concepts/retry) - perilaku coba lagi saat kegagalan pengiriman
- [Saluran](/id/channels) - dukungan streaming per saluran
