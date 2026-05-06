---
read_when:
    - Menjelaskan cara kerja pengaliran atau pemotongan per bagian pada saluran
    - Mengubah perilaku streaming blok atau pemecahan saluran menjadi potongan
    - Men-debug balasan blok duplikat/terlalu awal atau streaming pratinjau kanal
summary: Perilaku pengaliran + pemecahan menjadi potongan (balasan blok, pengaliran pratinjau saluran, pemetaan mode)
title: Pengaliran dan pemecahan menjadi potongan
x-i18n:
    generated_at: "2026-05-06T17:55:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: e43dc87211e764f9721c4e6c0aa69088441344e1f7c34084fd711a780a852a17
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw memiliki dua lapisan streaming terpisah:

- **Streaming blok (kanal):** memancarkan **blok** yang sudah selesai saat asisten menulis. Ini adalah pesan kanal normal (bukan delta token).
- **Streaming pratinjau (Telegram/Discord/Slack):** memperbarui **pesan pratinjau** sementara saat menghasilkan respons.

Saat ini **tidak ada streaming delta token yang sebenarnya** ke pesan kanal. Streaming pratinjau berbasis pesan (kirim + edit/tambahkan).

## Streaming blok (pesan kanal)

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
- `chunker`: `EmbeddedBlockChunker` yang menerapkan batas min/maks + preferensi pemisahan.
- `channel send`: pesan keluar aktual (balasan blok).

**Kontrol:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (default nonaktif).
- Override kanal: `*.blockStreaming` (dan varian per akun) untuk memaksa `"on"`/`"off"` per kanal.
- `agents.defaults.blockStreamingBreak`: `"text_end"` atau `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (menggabungkan blok yang di-stream sebelum dikirim).
- Batas keras kanal: `*.textChunkLimit` (misalnya, `channels.whatsapp.textChunkLimit`).
- Mode potongan kanal: `*.chunkMode` (`length` default, `newline` memisahkan pada baris kosong (batas paragraf) sebelum pemotongan berdasarkan panjang).
- Batas lunak Discord: `channels.discord.maxLinesPerMessage` (default 17) memecah balasan tinggi untuk menghindari pemotongan UI.

**Semantik batas:**

- `text_end`: stream blok segera setelah chunker memancarkannya; flush pada setiap `text_end`.
- `message_end`: tunggu sampai pesan asisten selesai, lalu flush output yang dibuffer.

`message_end` tetap menggunakan chunker jika teks yang dibuffer melebihi `maxChars`, sehingga dapat memancarkan beberapa potongan di akhir.

### Pengiriman media dengan streaming blok

Direktif `MEDIA:` adalah metadata pengiriman normal. Saat streaming blok mengirim blok media lebih awal, OpenClaw mengingat pengiriman itu untuk giliran tersebut. Jika payload asisten final mengulangi URL media yang sama, pengiriman final menghapus media duplikat alih-alih mengirim lampiran lagi.

Payload final yang merupakan duplikat persis akan ditekan. Jika payload final menambahkan teks berbeda di sekitar media yang sudah di-stream, OpenClaw tetap mengirim teks baru sambil menjaga media hanya dikirim sekali. Ini mencegah duplikasi catatan suara atau file pada kanal seperti Telegram saat agen memancarkan `MEDIA:` selama streaming dan provider juga menyertakannya dalam balasan yang selesai.

## Algoritma pemotongan (batas rendah/tinggi)

Pemotongan blok diimplementasikan oleh `EmbeddedBlockChunker`:

- **Batas rendah:** jangan pancarkan sampai buffer >= `minChars` (kecuali dipaksa).
- **Batas tinggi:** prioritaskan pemisahan sebelum `maxChars`; jika dipaksa, pisahkan pada `maxChars`.
- **Preferensi pemisahan:** `paragraph` → `newline` → `sentence` → `whitespace` → pemisahan keras.
- **Code fence:** jangan pernah pisahkan di dalam fence; saat dipaksa pada `maxChars`, tutup + buka kembali fence agar Markdown tetap valid.

`maxChars` dibatasi ke `textChunkLimit` kanal, sehingga Anda tidak dapat melampaui batas per kanal.

## Koalesensi (menggabungkan blok yang di-stream)

Saat streaming blok diaktifkan, OpenClaw dapat **menggabungkan potongan blok berurutan** sebelum mengirimnya keluar. Ini mengurangi "spam satu baris" sambil tetap menyediakan output progresif.

- Koalesensi menunggu **jeda idle** (`idleMs`) sebelum flush.
- Buffer dibatasi oleh `maxChars` dan akan di-flush jika melebihinya.
- `minChars` mencegah fragmen kecil dikirim sampai teks yang terakumulasi cukup (flush final selalu mengirim teks yang tersisa).
- Joiner diturunkan dari `blockStreamingChunk.breakPreference` (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → spasi).
- Override kanal tersedia melalui `*.blockStreamingCoalesce` (termasuk konfigurasi per akun).
- `minChars` koalesensi default dinaikkan menjadi 1500 untuk Signal/Slack/Discord kecuali dioverride.

## Jeda seperti manusia antarblok

Saat streaming blok diaktifkan, Anda dapat menambahkan **jeda acak** antara balasan blok (setelah blok pertama). Ini membuat respons multi-bubble terasa lebih alami.

- Konfigurasi: `agents.defaults.humanDelay` (override per agen melalui `agents.list[].humanDelay`).
- Mode: `off` (default), `natural` (800-2500 ms), `custom` (`minMs`/`maxMs`).
- Hanya berlaku untuk **balasan blok**, bukan balasan final atau ringkasan tool.

## "Stream potongan atau semuanya"

Ini dipetakan ke:

- **Stream potongan:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (pancarkan seiring berjalan). Kanal non-Telegram juga memerlukan `*.blockStreaming: true`.
- **Stream semuanya di akhir:** `blockStreamingBreak: "message_end"` (flush sekali, mungkin beberapa potongan jika sangat panjang).
- **Tanpa streaming blok:** `blockStreamingDefault: "off"` (hanya balasan final).

**Catatan kanal:** Streaming blok **nonaktif kecuali**
`*.blockStreaming` secara eksplisit disetel ke `true`. Kanal dapat men-stream pratinjau langsung (`channels.<channel>.streaming`) tanpa balasan blok.

Pengingat lokasi konfigurasi: default `blockStreaming*` berada di bawah `agents.defaults`, bukan konfigurasi root.

## Mode streaming pratinjau

Kunci kanonis: `channels.<channel>.streaming`

Mode:

- `off`: menonaktifkan streaming pratinjau.
- `partial`: satu pratinjau yang diganti dengan teks terbaru.
- `block`: pembaruan pratinjau dalam langkah berpotongan/ditambahkan.
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

- `channels.slack.streaming.nativeTransport` mengalihkan panggilan API streaming native Slack saat `channels.slack.streaming.mode="partial"` (default: `true`).
- Streaming native Slack dan status thread asisten Slack memerlukan target thread balasan. DM level atas tidak menampilkan pratinjau bergaya thread itu, tetapi tetap dapat menggunakan posting pratinjau draf Slack dan edit.

Migrasi kunci lama:

- Telegram: `streamMode` lama dan nilai `streaming` skalar/boolean terdeteksi dan dimigrasikan oleh jalur kompatibilitas doctor/config ke `streaming.mode`.
- Discord: `streamMode` + `streaming` boolean tetap menjadi alias runtime untuk enum `streaming`; jalankan `openclaw doctor --fix` untuk menulis ulang konfigurasi yang tersimpan.
- Slack: `streamMode` tetap menjadi alias runtime untuk `streaming.mode`; `streaming` boolean tetap menjadi alias runtime untuk `streaming.mode` plus `streaming.nativeTransport`; `nativeStreaming` lama tetap menjadi alias runtime untuk `streaming.nativeTransport`. Jalankan `openclaw doctor --fix` untuk menulis ulang konfigurasi yang tersimpan.

### Perilaku runtime

Telegram:

- Menggunakan pembaruan pratinjau `sendMessage` + `editMessageText` di DM dan grup/topik.
- Teks final mengedit pratinjau aktif di tempat; final panjang menggunakan kembali pesan itu untuk potongan pertama dan hanya mengirim potongan yang tersisa.
- Mode `progress` menjaga progres tool dalam draf status yang dapat diedit, menghapus draf itu saat selesai, dan mengirim jawaban final melalui pengiriman normal.
- Jika edit final gagal sebelum teks selesai dikonfirmasi, OpenClaw menggunakan pengiriman final normal dan membersihkan pratinjau yang sudah usang.
- Streaming pratinjau dilewati saat streaming blok Telegram diaktifkan secara eksplisit (untuk menghindari streaming ganda).
- `/reasoning stream` dapat menulis penalaran ke pratinjau sementara yang dihapus setelah pengiriman final.

Discord:

- Menggunakan pesan pratinjau kirim + edit.
- Mode `block` menggunakan pemotongan draf (`draftChunk`).
- Streaming pratinjau dilewati saat streaming blok Discord diaktifkan secara eksplisit.
- Payload media final, error, dan balasan eksplisit membatalkan pratinjau tertunda tanpa mem-flush draf baru, lalu menggunakan pengiriman normal.

Slack:

- `partial` dapat menggunakan streaming native Slack (`chat.startStream`/`append`/`stop`) saat tersedia.
- `block` menggunakan pratinjau draf bergaya append.
- `progress` menggunakan teks pratinjau status, lalu jawaban final.
- DM level atas tanpa thread balasan menggunakan posting pratinjau draf dan edit alih-alih streaming native Slack.
- Streaming pratinjau native dan draf menekan balasan blok untuk giliran itu, sehingga balasan Slack di-stream hanya oleh satu jalur pengiriman.
- Payload media/error final dan final progres tidak membuat pesan draf sekali pakai; hanya final teks/blok yang dapat mengedit pratinjau yang mem-flush teks draf tertunda.

Mattermost:

- Men-stream pemikiran, aktivitas tool, dan teks balasan parsial ke dalam satu posting pratinjau draf yang difinalisasi di tempat saat jawaban final aman untuk dikirim.
- Fallback dengan mengirim posting final baru jika posting pratinjau dihapus atau tidak tersedia saat finalisasi.
- Payload media/error final membatalkan pembaruan pratinjau tertunda sebelum pengiriman normal alih-alih mem-flush posting pratinjau sementara.

Matrix:

- Pratinjau draf difinalisasi di tempat saat teks final dapat menggunakan kembali peristiwa pratinjau.
- Final media-saja, error, dan ketidakcocokan target balasan membatalkan pembaruan pratinjau tertunda sebelum pengiriman normal; pratinjau usang yang sudah terlihat diredaaksi.

### Pembaruan pratinjau progres tool

Streaming pratinjau juga dapat menyertakan pembaruan **progres tool** - baris status pendek seperti "menelusuri web", "membaca file", atau "memanggil tool" - yang muncul dalam pesan pratinjau yang sama saat tool berjalan, sebelum balasan final. Ini membuat giliran tool multi-langkah tetap tampak hidup secara visual alih-alih senyap antara pratinjau pemikiran pertama dan jawaban final.

Permukaan yang didukung:

- **Discord**, **Slack**, **Telegram**, dan **Matrix** mengalirkan progres alat ke pengeditan pratinjau langsung secara default saat streaming pratinjau aktif. Microsoft Teams menggunakan streaming progres native-nya dalam obrolan pribadi.
- Telegram telah dirilis dengan pembaruan pratinjau progres alat diaktifkan sejak `v2026.4.22`; membiarkannya aktif mempertahankan perilaku yang telah dirilis tersebut.
- **Mattermost** sudah melipat aktivitas alat ke dalam satu posting pratinjau drafnya (lihat di atas).
- Pengeditan progres alat mengikuti mode streaming pratinjau yang aktif; pengeditan tersebut dilewati saat streaming pratinjau bernilai `off` atau saat streaming blok telah mengambil alih pesan. Di Telegram, `streaming.mode: "off"` bersifat hanya final: obrolan progres generik juga ditekan alih-alih dikirim sebagai pesan status mandiri, sementara prompt persetujuan, muatan media, dan kesalahan tetap dirutekan secara normal.
- Untuk mempertahankan streaming pratinjau tetapi menyembunyikan baris progres alat, atur `streaming.preview.toolProgress` ke `false` untuk channel tersebut. Untuk menjaga baris progres alat tetap terlihat sambil menyembunyikan teks command/exec, atur `streaming.preview.commandText` ke `"status"` atau `streaming.progress.commandText` ke `"status"`; default-nya adalah `"raw"` untuk mempertahankan perilaku yang telah dirilis. Kebijakan ini digunakan bersama oleh channel draf/progres yang memakai perender progres ringkas OpenClaw, termasuk Discord, Matrix, Microsoft Teams, Mattermost, pratinjau draf Slack, dan Telegram. Untuk menonaktifkan pengeditan pratinjau sepenuhnya, atur `streaming.mode` ke `off`.
- Balasan kutipan terpilih Telegram adalah pengecualian: saat `replyToMode` bukan `"off"` dan teks kutipan terpilih ada, OpenClaw melewati streaming pratinjau jawaban untuk giliran tersebut sehingga baris pratinjau progres alat tidak dapat dirender. Balasan pesan saat ini tanpa teks kutipan terpilih tetap mempertahankan streaming pratinjau. Lihat [dokumentasi channel Telegram](/id/channels/telegram) untuk detail.

Pertahankan baris progres tetap terlihat tetapi sembunyikan teks command/exec mentah:

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

Gunakan bentuk yang sama di bawah kunci channel progres ringkas lain, misalnya `channels.discord`, `channels.matrix`, `channels.msteams`, `channels.mattermost`, atau pratinjau draf Slack. Untuk mode draf-progres, letakkan kebijakan yang sama di bawah `streaming.progress`:

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

- [Refaktor siklus hidup pesan](/id/concepts/message-lifecycle-refactor) - menargetkan desain bersama untuk pratinjau, pengeditan, streaming, dan finalisasi
- [Draf progres](/id/concepts/progress-drafts) - pesan pekerjaan yang sedang berlangsung yang terlihat dan diperbarui selama giliran panjang
- [Pesan](/id/concepts/messages) - siklus hidup dan pengiriman pesan
- [Coba ulang](/id/concepts/retry) - perilaku coba ulang saat pengiriman gagal
- [Channel](/id/channels) - dukungan streaming per channel
