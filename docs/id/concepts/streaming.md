---
read_when:
    - Menjelaskan cara kerja pengaliran atau pemecahan menjadi potongan pada kanal
    - Mengubah perilaku streaming blok atau pemotongan kanal
    - Men-debug balasan blok duplikat/awal atau streaming pratinjau kanal
summary: Perilaku streaming + chunking (balasan blok, streaming pratinjau channel, pemetaan mode)
title: Streaming dan pemotongan
x-i18n:
    generated_at: "2026-07-01T08:31:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2724c21414dd470780f0c7f634380bef3feeb54a08bd0da3e944173340df1c80
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw memiliki dua lapisan streaming terpisah:

- **Streaming blok (kanal):** memancarkan **blok** yang sudah selesai saat asisten menulis. Ini adalah pesan kanal normal (bukan delta token).
- **Streaming pratinjau (Telegram/Discord/Slack):** memperbarui **pesan pratinjau** sementara proses pembuatan berlangsung.

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
- `chunker`: `EmbeddedBlockChunker` yang menerapkan batas min/maks + preferensi pemutusan.
- `channel send`: pesan keluar aktual (balasan blok).

**Kontrol:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (default mati).
- Override kanal: `*.blockStreaming` (dan varian per-akun) untuk memaksa `"on"`/`"off"` per kanal.
- `agents.defaults.blockStreamingBreak`: `"text_end"` atau `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (gabungkan blok yang di-stream sebelum dikirim).
- Batas keras kanal: `*.textChunkLimit` (misalnya, `channels.whatsapp.textChunkLimit`).
- Mode potongan kanal: `*.chunkMode` (`length` default, `newline` memecah pada baris kosong (batas paragraf) sebelum pemotongan berdasarkan panjang).
- Batas lunak Discord: `channels.discord.maxLinesPerMessage` (default 17) memecah balasan tinggi untuk menghindari pemotongan UI.

**Semantik batas:**

- `text_end`: stream blok segera setelah chunker memancarkannya; flush pada setiap `text_end`.
- `message_end`: tunggu sampai pesan asisten selesai, lalu flush output yang dibuffer.

`message_end` tetap menggunakan chunker jika teks yang dibuffer melebihi `maxChars`, sehingga dapat memancarkan beberapa potongan di akhir.

### Pengiriman media dengan streaming blok

Media streaming harus menggunakan field payload terstruktur seperti `mediaUrl` atau
`mediaUrls`; teks yang di-stream tidak diurai sebagai perintah lampiran. Saat streaming
blok mengirim media lebih awal, OpenClaw mengingat pengiriman itu untuk giliran tersebut. Jika
payload asisten final mengulang URL media yang sama, pengiriman final
menghapus media duplikat alih-alih mengirim lampiran lagi.

Payload final yang merupakan duplikat persis akan ditekan. Jika payload final menambahkan
teks berbeda di sekitar media yang sudah di-stream, OpenClaw tetap mengirim
teks baru sambil mempertahankan media sebagai satu pengiriman. Ini mencegah duplikasi catatan suara
atau file pada kanal seperti Telegram.

## Algoritma pemotongan (batas rendah/tinggi)

Pemotongan blok diimplementasikan oleh `EmbeddedBlockChunker`:

- **Batas rendah:** jangan pancarkan sampai buffer >= `minChars` (kecuali dipaksa).
- **Batas tinggi:** utamakan pemisahan sebelum `maxChars`; jika dipaksa, pisahkan pada `maxChars`.
- **Preferensi pemutusan:** `paragraph` → `newline` → `sentence` → `whitespace` → pemutusan keras.
- **Code fences:** jangan pernah memisahkan di dalam fence; saat dipaksa pada `maxChars`, tutup + buka kembali fence agar Markdown tetap valid.

`maxChars` dibatasi ke `textChunkLimit` kanal, sehingga Anda tidak dapat melebihi batas per-kanal.

## Koalesensi (gabungkan blok yang di-stream)

Saat streaming blok diaktifkan, OpenClaw dapat **menggabungkan potongan blok berurutan**
sebelum mengirimnya keluar. Ini mengurangi "spam satu baris" sambil tetap menyediakan
output progresif.

- Koalesensi menunggu **jeda idle** (`idleMs`) sebelum flush.
- Buffer dibatasi oleh `maxChars` dan akan di-flush jika melebihinya.
- `minChars` mencegah fragmen kecil dikirim sampai teks yang terkumpul cukup
  (flush final selalu mengirim sisa teks).
- Joiner diturunkan dari `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → spasi).
- Override kanal tersedia melalui `*.blockStreamingCoalesce` (termasuk konfigurasi per-akun).
- Default coalesce `minChars` dinaikkan menjadi 1500 untuk Signal/Slack/Discord kecuali di-override.

## Penjedaan seperti manusia antarblok

Saat streaming blok diaktifkan, Anda dapat menambahkan **jeda acak** antara
balasan blok (setelah blok pertama). Ini membuat respons multi-balon terasa
lebih alami.

- Konfigurasi: `agents.defaults.humanDelay` (override per agen melalui `agents.list[].humanDelay`).
- Mode: `off` (default), `natural` (800-2500ms), `custom` (`minMs`/`maxMs`).
- Hanya berlaku untuk **balasan blok**, bukan balasan final atau ringkasan alat.

## "Stream chunks or everything"

Ini dipetakan ke:

- **Streaming potongan:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (pancarkan seiring proses berjalan). Channel non-Telegram juga memerlukan `*.blockStreaming: true`.
- **Streaming semuanya di akhir:** `blockStreamingBreak: "message_end"` (flush sekali, mungkin beberapa potongan jika sangat panjang).
- **Tanpa streaming blok:** `blockStreamingDefault: "off"` (hanya balasan akhir).

**Catatan channel:** Streaming blok **nonaktif kecuali**
`*.blockStreaming` secara eksplisit diatur ke `true`. Channel dapat melakukan streaming pratinjau langsung
(`channels.<channel>.streaming`) tanpa balasan blok.

Pengingat lokasi konfigurasi: default `blockStreaming*` berada di bawah
`agents.defaults`, bukan konfigurasi akar.

## Mode streaming pratinjau

Kunci kanonis: `channels.<channel>.streaming`

Mode:

- `off`: nonaktifkan streaming pratinjau.
- `partial`: satu pratinjau yang diganti dengan teks terbaru.
- `block`: pratinjau diperbarui dalam langkah berbentuk potongan/ditambahkan.
- `progress`: pratinjau progres/status selama pembuatan, jawaban akhir saat selesai.

`streaming.mode: "block"` adalah mode streaming pratinjau untuk channel yang mendukung pengeditan
seperti Discord dan Telegram. Ini tidak mengaktifkan pengiriman blok channel di sana.
Gunakan `streaming.block.enabled` atau kunci channel lama `blockStreaming` saat
Anda menginginkan balasan blok normal. Microsoft Teams adalah pengecualian: ia tidak memiliki
transport blok pratinjau draf, sehingga `streaming.mode: "block"` dipetakan ke pengiriman blok Teams
alih-alih streaming parsial/progres native.

### Pemetaan channel

| Channel    | `off` | `partial` | `block` | `progress`              |
| ---------- | ----- | --------- | ------- | ----------------------- |
| Telegram   | ✅    | ✅        | ✅      | draf progres yang dapat diedit |
| Discord    | ✅    | ✅        | ✅      | draf progres yang dapat diedit |
| Slack      | ✅    | ✅        | ✅      | ✅                      |
| Mattermost | ✅    | ✅        | ✅      | ✅                      |
| MS Teams   | ✅    | ✅        | ✅      | aliran progres native  |

Khusus Slack:

- `channels.slack.streaming.nativeTransport` mengaktifkan/menonaktifkan panggilan API streaming native Slack saat `channels.slack.streaming.mode="partial"` (default: `true`).
- Streaming native Slack dan status thread asisten Slack memerlukan target thread balasan. DM tingkat atas tidak menampilkan pratinjau bergaya thread tersebut, tetapi masih dapat menggunakan posting pratinjau draf Slack dan pengeditannya.

Migrasi kunci lama:

- Telegram: nilai lama `streamMode` dan nilai skalar/boolean `streaming` dideteksi dan dimigrasikan oleh jalur kompatibilitas doctor/konfigurasi ke `streaming.mode`.
- Discord: `streamMode` + boolean `streaming` tetap menjadi alias saat berjalan untuk enum `streaming`; jalankan `openclaw doctor --fix` untuk menulis ulang konfigurasi yang tersimpan.
- Slack: `streamMode` tetap menjadi alias saat berjalan untuk `streaming.mode`; boolean `streaming` tetap menjadi alias saat berjalan untuk `streaming.mode` plus `streaming.nativeTransport`; `nativeStreaming` lama tetap menjadi alias saat berjalan untuk `streaming.nativeTransport`. Jalankan `openclaw doctor --fix` untuk menulis ulang konfigurasi yang tersimpan.

### Perilaku saat berjalan

Telegram:

- Menggunakan pembaruan pratinjau `sendMessage` + `editMessageText` di DM dan grup/topik.
- Pratinjau awal yang pendek masih di-debounce untuk UX notifikasi push, tetapi Telegram sekarang mewujudkannya setelah jeda berbatas agar proses aktif tidak tetap senyap secara visual.
- Teks akhir mengedit pratinjau aktif di tempat; hasil akhir panjang menggunakan ulang pesan itu untuk potongan pertama dan hanya mengirim potongan yang tersisa.
- Mode `block` memutar pratinjau menjadi pesan baru pada `streaming.preview.chunk.maxChars` (default 800, dibatasi oleh batas edit Telegram 4096); mode lain menumbuhkan satu pratinjau hingga 4096 karakter.
- Mode `progress` mempertahankan progres alat dalam draf status yang dapat diedit, mewujudkan label status saat streaming jawaban aktif tetapi belum ada baris alat yang tersedia, menghapus draf itu saat selesai, dan mengirim jawaban akhir melalui pengiriman normal.
- Jika edit akhir gagal sebelum teks selesai dikonfirmasi, OpenClaw menggunakan pengiriman akhir normal dan membersihkan pratinjau usang.
- Streaming pratinjau dilewati saat streaming blok Telegram diaktifkan secara eksplisit (untuk menghindari streaming ganda).
- `/reasoning stream` dapat menulis penalaran ke pratinjau sementara yang dihapus setelah pengiriman akhir.

Discord:

- Menggunakan pesan pratinjau kirim + edit.
- Mode `block` menggunakan pemotongan draf (`draftChunk`).
- Streaming pratinjau dilewati saat streaming blok Discord diaktifkan secara eksplisit.
- Payload media akhir, error, dan balasan eksplisit membatalkan pratinjau tertunda tanpa melakukan flush draf baru, lalu menggunakan pengiriman normal.

Slack:

- `partial` dapat menggunakan streaming native Slack (`chat.startStream`/`append`/`stop`) saat tersedia.
- `block` menggunakan pratinjau draf bergaya tambah.
- `progress` menggunakan teks pratinjau status, lalu jawaban akhir.
- DM tingkat atas tanpa thread balasan menggunakan posting pratinjau draf dan pengeditan, bukan streaming native Slack.
- Streaming pratinjau native dan draf menekan balasan blok untuk giliran tersebut, sehingga balasan Slack di-streaming hanya oleh satu jalur pengiriman.
- Payload media/error akhir dan hasil akhir progres tidak membuat pesan draf sekali pakai; hanya hasil akhir teks/blok yang dapat mengedit pratinjau yang melakukan flush teks draf tertunda.

Mattermost:

- Melakukan streaming pemikiran, aktivitas alat, dan teks balasan parsial ke dalam satu posting pratinjau draf yang diselesaikan di tempat saat jawaban akhir aman untuk dikirim.
- Beralih mengirim posting akhir baru jika posting pratinjau dihapus atau tidak tersedia saat waktu penyelesaian.
- Payload media/error akhir membatalkan pembaruan pratinjau tertunda sebelum pengiriman normal alih-alih melakukan flush posting pratinjau sementara.

Matrix:

- Pratinjau draf diselesaikan di tempat saat teks akhir dapat menggunakan ulang event pratinjau.
- Hasil akhir khusus media, error, dan ketidakcocokan target balasan membatalkan pembaruan pratinjau tertunda sebelum pengiriman normal; pratinjau usang yang sudah terlihat akan disensor.

### Pembaruan pratinjau progres alat

Streaming pratinjau juga dapat menyertakan pembaruan **progres alat** - baris status pendek seperti "mencari di web", "membaca file", atau "memanggil alat" - yang muncul di pesan pratinjau yang sama saat alat berjalan, sebelum balasan akhir. Dalam mode server aplikasi Codex, pesan pembukaan/komentar Codex menggunakan jalur pratinjau yang sama, sehingga catatan progres pendek "Saya sedang memeriksa..." dapat di-streaming ke draf yang dapat diedit tanpa menjadi bagian dari jawaban akhir. Ini menjaga giliran alat multi-langkah tetap hidup secara visual, bukan senyap di antara pratinjau pemikiran pertama dan jawaban akhir.

Alat yang berjalan lama dapat memancarkan progres bertipe sebelum kembali. Misalnya,
`web_fetch` memasang timer lima detik saat dimulai: jika fetch masih
tertunda, pratinjau dapat menampilkan `Fetching page content...`; jika fetch selesai
atau dibatalkan sebelumnya, tidak ada baris progres yang dipancarkan. Hasil alat akhir
selanjutnya tetap dikirimkan secara normal ke model.

Permukaan yang didukung:

- **Discord**, **Slack**, **Telegram**, dan **Matrix** mengalirkan progres alat dan pembaruan pembuka Codex ke edit pratinjau langsung secara default saat streaming pratinjau aktif. Microsoft Teams menggunakan aliran progres native-nya dalam obrolan pribadi.
- Telegram telah dirilis dengan pembaruan pratinjau progres alat yang diaktifkan sejak `v2026.4.22`; mempertahankannya tetap aktif menjaga perilaku rilis tersebut.
- **Mattermost** sudah menggabungkan aktivitas alat ke dalam satu posting pratinjau drafnya (lihat di atas).
- Edit progres alat mengikuti mode streaming pratinjau aktif; edit tersebut dilewati saat streaming pratinjau `off` atau saat streaming blok telah mengambil alih pesan. Di Telegram, `streaming.mode: "off"` bersifat hanya-final: obrolan progres generik juga ditekan alih-alih dikirim sebagai pesan status mandiri, sementara prompt persetujuan, payload media, dan kesalahan tetap dirutekan seperti biasa.
- Untuk mempertahankan streaming pratinjau tetapi menyembunyikan baris progres alat, atur `streaming.preview.toolProgress` ke `false` untuk saluran tersebut. Untuk membuat baris progres alat tetap terlihat sambil menyembunyikan teks command/exec, atur `streaming.preview.commandText` ke `"status"` atau `streaming.progress.commandText` ke `"status"`; defaultnya adalah `"raw"` untuk mempertahankan perilaku rilis. Kebijakan ini digunakan bersama oleh saluran draf/progres yang memakai perender progres ringkas OpenClaw, termasuk Discord, Matrix, Microsoft Teams, Mattermost, pratinjau draf Slack, dan Telegram. Untuk menonaktifkan edit pratinjau sepenuhnya, atur `streaming.mode` ke `off`.
- Balasan kutipan terpilih Telegram adalah pengecualian: saat `replyToMode` bukan `"off"` dan teks kutipan terpilih ada, OpenClaw melewati aliran pratinjau jawaban untuk giliran tersebut sehingga baris pratinjau progres alat tidak dapat dirender. Balasan pesan saat ini tanpa teks kutipan terpilih tetap mempertahankan streaming pratinjau. Lihat [dokumentasi saluran Telegram](/id/channels/telegram) untuk detail.

### Jalur progres commentary

Di luar progres alat, perender progres ringkas dapat menampilkan satu jalur lagi dalam draf:

- **`streaming.progress.commentary`** — render **commentary** pra-alat model (💬) — narasi singkat "Saya akan memeriksa… lalu…" — disisipkan di antara baris alat dalam draf progres.

```json
{
  "channels": {
    "discord": {
      "streaming": { "mode": "progress", "progress": { "commentary": true } }
    }
  }
}
```

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

- [Refaktor siklus hidup pesan](/id/concepts/message-lifecycle-refactor) - target desain bersama untuk pratinjau, edit, aliran, dan finalisasi
- [Draf progres](/id/concepts/progress-drafts) - pesan pekerjaan yang sedang berlangsung yang terlihat dan diperbarui selama giliran panjang
- [Pesan](/id/concepts/messages) - siklus hidup dan pengiriman pesan
- [Coba lagi](/id/concepts/retry) - perilaku coba lagi saat pengiriman gagal
- [Saluran](/id/channels) - dukungan streaming per saluran
