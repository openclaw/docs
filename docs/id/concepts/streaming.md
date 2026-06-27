---
read_when:
    - Menjelaskan cara kerja pengaliran atau pemecahan menjadi bagian-bagian pada kanal
    - Mengubah perilaku streaming blok atau pemotongan kanal
    - Men-debug balasan blok duplikat/awal atau streaming pratinjau channel
summary: Perilaku streaming + pemotongan menjadi potongan (balasan blok, streaming pratinjau kanal, pemetaan mode)
title: Streaming dan pemotongan
x-i18n:
    generated_at: "2026-06-27T17:27:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6667e95a1ed89e6bd8990a1b8784edb73885c59c7a3905eabc14184270efcfe1
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw memiliki dua lapisan streaming terpisah:

- **Streaming blok (kanal):** memancarkan **blok** yang sudah selesai saat asisten menulis. Ini adalah pesan kanal normal (bukan delta token).
- **Streaming pratinjau (Telegram/Discord/Slack):** memperbarui **pesan pratinjau** sementara proses pembuatan berlangsung.

Saat ini **belum ada streaming delta-token sejati** ke pesan kanal. Streaming pratinjau berbasis pesan (kirim + pengeditan/penambahan).

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
- `chunker`: `EmbeddedBlockChunker` yang menerapkan batas min/maks + preferensi jeda.
- `channel send`: pesan keluar yang sebenarnya (balasan blok).

**Kontrol:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (bawaan nonaktif).
- Override kanal: `*.blockStreaming` (dan varian per akun) untuk memaksa `"on"`/`"off"` per kanal.
- `agents.defaults.blockStreamingBreak`: `"text_end"` atau `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (gabungkan blok yang di-stream sebelum dikirim).
- Batas keras kanal: `*.textChunkLimit` (misalnya, `channels.whatsapp.textChunkLimit`).
- Mode potongan kanal: `*.chunkMode` (`length` bawaan, `newline` memecah pada baris kosong (batas paragraf) sebelum pemotongan berdasarkan panjang).
- Batas lunak Discord: `channels.discord.maxLinesPerMessage` (bawaan 17) memecah balasan tinggi untuk menghindari pemotongan UI.

**Semantik batas:**

- `text_end`: stream blok segera setelah chunker memancarkan; flush pada setiap `text_end`.
- `message_end`: tunggu sampai pesan asisten selesai, lalu flush output yang di-buffer.

`message_end` tetap menggunakan chunker jika teks yang di-buffer melebihi `maxChars`, sehingga dapat memancarkan beberapa potongan di akhir.

### Pengiriman media dengan streaming blok

Media streaming harus menggunakan field payload terstruktur seperti `mediaUrl` atau
`mediaUrls`; teks yang di-stream tidak diurai sebagai perintah lampiran. Saat streaming
blok mengirim media lebih awal, OpenClaw mengingat pengiriman tersebut untuk giliran itu. Jika
payload asisten akhir mengulang URL media yang sama, pengiriman akhir
menghapus media duplikat alih-alih mengirim lampiran lagi.

Payload akhir yang benar-benar duplikat ditekan. Jika payload akhir menambahkan
teks berbeda di sekitar media yang sudah di-stream, OpenClaw tetap mengirim
teks baru sambil menjaga media hanya dikirim sekali. Ini mencegah duplikasi catatan suara
atau file di kanal seperti Telegram.

## Algoritme pemotongan (batas rendah/tinggi)

Pemotongan blok diimplementasikan oleh `EmbeddedBlockChunker`:

- **Batas rendah:** jangan pancarkan hingga buffer >= `minChars` (kecuali dipaksa).
- **Batas tinggi:** utamakan pemecahan sebelum `maxChars`; jika dipaksa, pecah pada `maxChars`.
- **Preferensi jeda:** `paragraph` → `newline` → `sentence` → `whitespace` → jeda keras.
- **Code fence:** jangan pernah memecah di dalam fence; saat dipaksa pada `maxChars`, tutup + buka ulang fence agar Markdown tetap valid.

`maxChars` dibatasi ke `textChunkLimit` kanal, sehingga Anda tidak bisa melebihi batas per kanal.

## Penggabungan (gabungkan blok yang di-stream)

Saat streaming blok diaktifkan, OpenClaw dapat **menggabungkan potongan blok berurutan**
sebelum mengirimnya keluar. Ini mengurangi "spam satu baris" sambil tetap menyediakan
output progresif.

- Penggabungan menunggu **celah idle** (`idleMs`) sebelum melakukan flush.
- Buffer dibatasi oleh `maxChars` dan akan di-flush jika melebihinya.
- `minChars` mencegah fragmen kecil dikirim hingga cukup teks terkumpul
  (flush akhir selalu mengirim teks yang tersisa).
- Penggabung diturunkan dari `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → spasi).
- Override kanal tersedia melalui `*.blockStreamingCoalesce` (termasuk konfigurasi per akun).
- `minChars` penggabungan bawaan dinaikkan menjadi 1500 untuk Signal/Slack/Discord kecuali dioverride.

## Jeda mirip manusia antarblok

Saat streaming blok diaktifkan, Anda dapat menambahkan **jeda acak** antara
balasan blok (setelah blok pertama). Ini membuat respons multi-gelembung terasa
lebih alami.

- Konfigurasi: `agents.defaults.humanDelay` (override per agen melalui `agents.list[].humanDelay`).
- Mode: `off` (bawaan), `natural` (800-2500ms), `custom` (`minMs`/`maxMs`).
- Hanya berlaku untuk **balasan blok**, bukan balasan akhir atau ringkasan tool.

## "Stream potongan atau semuanya"

Ini dipetakan ke:

- **Stream potongan:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (pancarkan sambil berjalan). Kanal non-Telegram juga memerlukan `*.blockStreaming: true`.
- **Stream semuanya di akhir:** `blockStreamingBreak: "message_end"` (flush sekali, mungkin beberapa potongan jika sangat panjang).
- **Tidak ada streaming blok:** `blockStreamingDefault: "off"` (hanya balasan akhir).

**Catatan kanal:** Streaming blok **nonaktif kecuali**
`*.blockStreaming` secara eksplisit diatur ke `true`. Kanal dapat men-stream pratinjau langsung
(`channels.<channel>.streaming`) tanpa balasan blok.

Pengingat lokasi konfigurasi: default `blockStreaming*` berada di bawah
`agents.defaults`, bukan konfigurasi root.

## Mode streaming pratinjau

Kunci kanonis: `channels.<channel>.streaming`

Mode:

- `off`: nonaktifkan streaming pratinjau.
- `partial`: satu pratinjau yang diganti dengan teks terbaru.
- `block`: pratinjau diperbarui dalam langkah yang dipotong/ditambahkan.
- `progress`: pratinjau progres/status selama pembuatan, jawaban akhir saat selesai.

`streaming.mode: "block"` adalah mode streaming pratinjau untuk kanal yang mendukung pengeditan
seperti Discord dan Telegram. Ini tidak mengaktifkan pengiriman blok kanal di sana.
Gunakan `streaming.block.enabled` atau kunci kanal lama `blockStreaming` saat
Anda menginginkan balasan blok normal. Microsoft Teams adalah pengecualian: kanal ini tidak memiliki
transport blok pratinjau draf, sehingga `streaming.mode: "block"` dipetakan ke pengiriman blok Teams
alih-alih streaming parsial/progres native.

### Pemetaan kanal

| Kanal      | `off` | `partial` | `block` | `progress`             |
| ---------- | ----- | --------- | ------- | ---------------------- |
| Telegram   | ✅    | ✅        | ✅      | draf progres yang dapat diedit |
| Discord    | ✅    | ✅        | ✅      | draf progres yang dapat diedit |
| Slack      | ✅    | ✅        | ✅      | ✅                     |
| Mattermost | ✅    | ✅        | ✅      | ✅                     |
| MS Teams   | ✅    | ✅        | ✅      | stream progres native  |

Khusus Slack:

- `channels.slack.streaming.nativeTransport` mengaktifkan/menonaktifkan panggilan API streaming native Slack saat `channels.slack.streaming.mode="partial"` (bawaan: `true`).
- Streaming native Slack dan status thread asisten Slack memerlukan target thread balasan. DM tingkat atas tidak menampilkan pratinjau bergaya thread tersebut, tetapi tetap dapat menggunakan posting pratinjau draf Slack dan pengeditan.

Migrasi kunci lama:

- Telegram: `streamMode` lama dan nilai `streaming` skalar/boolean dideteksi dan dimigrasikan oleh jalur kompatibilitas doctor/konfigurasi ke `streaming.mode`.
- Discord: `streamMode` + `streaming` boolean tetap menjadi alias runtime untuk enum `streaming`; jalankan `openclaw doctor --fix` untuk menulis ulang konfigurasi persisten.
- Slack: `streamMode` tetap menjadi alias runtime untuk `streaming.mode`; `streaming` boolean tetap menjadi alias runtime untuk `streaming.mode` plus `streaming.nativeTransport`; `nativeStreaming` lama tetap menjadi alias runtime untuk `streaming.nativeTransport`. Jalankan `openclaw doctor --fix` untuk menulis ulang konfigurasi persisten.

### Perilaku runtime

Telegram:

- Menggunakan pembaruan pratinjau `sendMessage` + `editMessageText` di seluruh DM dan grup/topik.
- Pratinjau awal yang pendek tetap di-debounce untuk UX notifikasi push, tetapi Telegram sekarang mematerialisasikannya setelah jeda terbatas sehingga run aktif tidak tetap senyap secara visual.
- Teks akhir mengedit pratinjau aktif di tempat; final panjang menggunakan ulang pesan itu untuk potongan pertama dan hanya mengirim potongan yang tersisa.
- Mode `block` memutar pratinjau menjadi pesan baru pada `streaming.preview.chunk.maxChars` (bawaan 800, dibatasi pada batas edit Telegram 4096); mode lain menumbuhkan satu pratinjau hingga 4096 karakter.
- Mode `progress` mempertahankan progres tool dalam draf status yang dapat diedit, mematerialisasikan label status saat streaming jawaban aktif tetapi belum ada baris tool yang tersedia, membersihkan draf itu saat selesai, dan mengirim jawaban akhir melalui pengiriman normal.
- Jika pengeditan akhir gagal sebelum teks lengkap dikonfirmasi, OpenClaw menggunakan pengiriman akhir normal dan membersihkan pratinjau usang.
- Streaming pratinjau dilewati saat streaming blok Telegram diaktifkan secara eksplisit (untuk menghindari streaming ganda).
- `/reasoning stream` dapat menulis reasoning ke pratinjau sementara yang dihapus setelah pengiriman akhir.

Discord:

- Menggunakan pesan pratinjau kirim + edit.
- Mode `block` menggunakan pemotongan draf (`draftChunk`).
- Streaming pratinjau dilewati saat streaming blok Discord diaktifkan secara eksplisit.
- Media akhir, error, dan payload balasan eksplisit membatalkan pratinjau tertunda tanpa melakukan flush draf baru, lalu menggunakan pengiriman normal.

Slack:

- `partial` dapat menggunakan streaming native Slack (`chat.startStream`/`append`/`stop`) saat tersedia.
- `block` menggunakan pratinjau draf bergaya append.
- `progress` menggunakan teks pratinjau status, lalu jawaban akhir.
- DM tingkat atas tanpa thread balasan menggunakan posting pratinjau draf dan pengeditan alih-alih streaming native Slack.
- Streaming pratinjau native dan draf menekan balasan blok untuk giliran itu, sehingga balasan Slack di-stream oleh satu jalur pengiriman saja.
- Payload media/error akhir dan final progres tidak membuat pesan draf sekali pakai; hanya final teks/blok yang dapat mengedit pratinjau yang melakukan flush teks draf tertunda.

Mattermost:

- Men-stream pemikiran, aktivitas tool, dan teks balasan parsial ke satu posting pratinjau draf yang difinalisasi di tempat saat jawaban akhir aman untuk dikirim.
- Melakukan fallback ke pengiriman posting akhir baru jika posting pratinjau dihapus atau tidak tersedia pada waktu finalisasi.
- Payload media/error akhir membatalkan pembaruan pratinjau tertunda sebelum pengiriman normal alih-alih melakukan flush posting pratinjau sementara.

Matrix:

- Pratinjau draf difinalisasi di tempat saat teks akhir dapat menggunakan ulang event pratinjau.
- Final khusus media, error, dan ketidakcocokan target balasan membatalkan pembaruan pratinjau tertunda sebelum pengiriman normal; pratinjau usang yang sudah terlihat akan disunting.

### Pembaruan pratinjau progres tool

Streaming pratinjau juga dapat menyertakan pembaruan **progres tool** - baris status pendek seperti "menelusuri web", "membaca file", atau "memanggil tool" - yang muncul dalam pesan pratinjau yang sama saat tool berjalan, sebelum balasan akhir. Dalam mode app-server Codex, pesan preamble/commentary Codex menggunakan jalur pratinjau yang sama, sehingga catatan progres pendek "Saya sedang memeriksa..." dapat di-stream ke draf yang dapat diedit tanpa menjadi bagian dari jawaban akhir. Ini membuat giliran tool multi-langkah tetap hidup secara visual alih-alih senyap antara pratinjau pemikiran pertama dan jawaban akhir.

Tool yang berjalan lama dapat memancarkan progres bertipe sebelum kembali. Misalnya,
`web_fetch` memasang timer lima detik saat dimulai: jika fetch masih
tertunda, pratinjau dapat menampilkan `Fetching page content...`; jika fetch selesai
atau dibatalkan sebelum itu, tidak ada baris progres yang dipancarkan. Hasil tool akhir
berikutnya tetap dikirim secara normal ke model.

Permukaan yang didukung:

- **Discord**, **Slack**, **Telegram**, dan **Matrix** mengalirkan progres alat dan pembaruan pembuka Codex ke dalam edit pratinjau langsung secara default saat streaming pratinjau aktif. Microsoft Teams menggunakan stream progres native-nya dalam chat pribadi.
- Telegram telah dirilis dengan pembaruan pratinjau progres alat diaktifkan sejak `v2026.4.22`; membiarkannya tetap aktif mempertahankan perilaku rilis tersebut.
- **Mattermost** sudah menggabungkan aktivitas alat ke dalam satu posting pratinjau drafnya (lihat di atas).
- Edit progres alat mengikuti mode streaming pratinjau aktif; edit ini dilewati saat streaming pratinjau `off` atau saat streaming blok telah mengambil alih pesan. Di Telegram, `streaming.mode: "off"` bersifat hanya-final: obrolan progres generik juga ditekan alih-alih dikirim sebagai pesan status mandiri, sementara prompt persetujuan, payload media, dan error tetap dirutekan secara normal.
- Untuk mempertahankan streaming pratinjau tetapi menyembunyikan baris progres alat, atur `streaming.preview.toolProgress` ke `false` untuk channel tersebut. Untuk menjaga baris progres alat tetap terlihat sambil menyembunyikan teks command/exec, atur `streaming.preview.commandText` ke `"status"` atau `streaming.progress.commandText` ke `"status"`; default-nya adalah `"raw"` untuk mempertahankan perilaku rilis. Kebijakan ini digunakan bersama oleh channel draf/progres yang memakai perender progres ringkas OpenClaw, termasuk Discord, Matrix, Microsoft Teams, Mattermost, pratinjau draf Slack, dan Telegram. Untuk menonaktifkan edit pratinjau sepenuhnya, atur `streaming.mode` ke `off`.
- Balasan kutipan terpilih Telegram adalah pengecualian: saat `replyToMode` bukan `"off"` dan teks kutipan terpilih ada, OpenClaw melewati stream pratinjau jawaban untuk giliran tersebut sehingga baris pratinjau progres alat tidak dapat dirender. Balasan pesan saat ini tanpa teks kutipan terpilih tetap mempertahankan streaming pratinjau. Lihat [dokumentasi channel Telegram](/id/channels/telegram) untuk detail.

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

- [Refaktor siklus hidup pesan](/id/concepts/message-lifecycle-refactor) - menargetkan desain bersama untuk pratinjau, edit, stream, dan finalisasi
- [Draf progres](/id/concepts/progress-drafts) - pesan pekerjaan yang sedang berlangsung yang terlihat dan diperbarui selama giliran panjang
- [Pesan](/id/concepts/messages) - siklus hidup dan pengiriman pesan
- [Coba lagi](/id/concepts/retry) - perilaku coba lagi saat pengiriman gagal
- [Channel](/id/channels) - dukungan streaming per channel
