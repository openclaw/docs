---
read_when:
    - Menjelaskan cara kerja pengaliran atau pemotongan data pada saluran
    - Mengubah perilaku streaming blok atau pemotongan saluran
    - Men-debug balasan blok duplikat/terlalu dini atau streaming pratinjau saluran
summary: Perilaku streaming + pemotongan bagian (balasan blok, streaming pratinjau saluran, pemetaan mode)
title: Pengaliran dan pemotongan
x-i18n:
    generated_at: "2026-05-03T21:30:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1335f4f5532060bd8bf839683a2b1fbab38f38887c5583135652b4753e0f6a50
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw memiliki dua lapisan streaming terpisah:

- **Streaming blok (kanal):** mengirim **blok** yang sudah selesai saat asisten menulis. Ini adalah pesan kanal normal (bukan delta token).
- **Streaming pratinjau (Telegram/Discord/Slack):** memperbarui **pesan pratinjau** sementara saat menghasilkan output.

Saat ini **tidak ada streaming delta token sejati** ke pesan kanal. Streaming pratinjau berbasis pesan (kirim + edit/tambah).

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

- `text_delta/events`: peristiwa stream model (bisa jarang untuk model non-streaming).
- `chunker`: `EmbeddedBlockChunker` yang menerapkan batas min/maks + preferensi pemutusan.
- `channel send`: pesan keluar aktual (balasan blok).

**Kontrol:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (default mati).
- Override kanal: `*.blockStreaming` (dan varian per akun) untuk memaksa `"on"`/`"off"` per kanal.
- `agents.defaults.blockStreamingBreak`: `"text_end"` atau `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (gabungkan blok yang di-stream sebelum dikirim).
- Batas keras kanal: `*.textChunkLimit` (misalnya, `channels.whatsapp.textChunkLimit`).
- Mode potongan kanal: `*.chunkMode` (`length` default, `newline` memecah pada baris kosong (batas paragraf) sebelum pemotongan berdasarkan panjang).
- Batas lunak Discord: `channels.discord.maxLinesPerMessage` (default 17) memecah balasan tinggi untuk menghindari pemotongan UI.

**Semantik batas:**

- `text_end`: stream blok segera setelah chunker mengeluarkan; flush pada setiap `text_end`.
- `message_end`: tunggu sampai pesan asisten selesai, lalu flush output yang dibuffer.

`message_end` tetap menggunakan chunker jika teks yang dibuffer melebihi `maxChars`, sehingga dapat mengeluarkan beberapa potongan di akhir.

### Pengiriman media dengan streaming blok

Direktif `MEDIA:` adalah metadata pengiriman normal. Saat streaming blok mengirim blok media lebih awal, OpenClaw mengingat pengiriman itu untuk giliran tersebut. Jika payload asisten final mengulangi URL media yang sama, pengiriman final menghapus media duplikat, bukan mengirim lampiran lagi.

Payload final yang merupakan duplikat persis akan ditekan. Jika payload final menambahkan teks berbeda di sekitar media yang sudah di-stream, OpenClaw tetap mengirim teks baru sambil menjaga media hanya dikirim sekali. Ini mencegah catatan suara atau file duplikat pada kanal seperti Telegram saat agen mengeluarkan `MEDIA:` selama streaming dan penyedia juga menyertakannya dalam balasan selesai.

## Algoritma pemotongan (batas rendah/tinggi)

Pemotongan blok diimplementasikan oleh `EmbeddedBlockChunker`:

- **Batas rendah:** jangan keluarkan sampai buffer >= `minChars` (kecuali dipaksa).
- **Batas tinggi:** utamakan pemisahan sebelum `maxChars`; jika dipaksa, pisahkan pada `maxChars`.
- **Preferensi pemutusan:** `paragraph` → `newline` → `sentence` → `whitespace` → pemutusan keras.
- **Fence kode:** jangan pernah memecah di dalam fence; saat dipaksa pada `maxChars`, tutup + buka kembali fence agar Markdown tetap valid.

`maxChars` dibatasi ke `textChunkLimit` kanal, jadi Anda tidak dapat melampaui batas per kanal.

## Koalesensi (menggabungkan blok yang di-stream)

Saat streaming blok diaktifkan, OpenClaw dapat **menggabungkan potongan blok berurutan** sebelum mengirimnya keluar. Ini mengurangi “spam satu baris” sambil tetap menyediakan output progresif.

- Koalesensi menunggu **jeda idle** (`idleMs`) sebelum flush.
- Buffer dibatasi oleh `maxChars` dan akan di-flush jika melampauinya.
- `minChars` mencegah fragmen kecil dikirim sampai cukup banyak teks terkumpul (flush final selalu mengirim teks yang tersisa).
- Penggabung diturunkan dari `blockStreamingChunk.breakPreference` (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → spasi).
- Override kanal tersedia melalui `*.blockStreamingCoalesce` (termasuk konfigurasi per akun).
- Default koalesensi `minChars` dinaikkan menjadi 1500 untuk Signal/Slack/Discord kecuali dioverride.

## Jeda antarmanusia antara blok

Saat streaming blok diaktifkan, Anda dapat menambahkan **jeda acak** antara balasan blok (setelah blok pertama). Ini membuat respons multi-gelembung terasa lebih alami.

- Konfigurasi: `agents.defaults.humanDelay` (override per agen melalui `agents.list[].humanDelay`).
- Mode: `off` (default), `natural` (800–2500ms), `custom` (`minMs`/`maxMs`).
- Hanya berlaku untuk **balasan blok**, bukan balasan final atau ringkasan alat.

## "Stream potongan atau semuanya"

Ini dipetakan ke:

- **Stream potongan:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (kirim saat berjalan). Kanal non-Telegram juga memerlukan `*.blockStreaming: true`.
- **Stream semuanya di akhir:** `blockStreamingBreak: "message_end"` (flush sekali, mungkin beberapa potongan jika sangat panjang).
- **Tanpa streaming blok:** `blockStreamingDefault: "off"` (hanya balasan final).

**Catatan kanal:** Streaming blok **mati kecuali**
`*.blockStreaming` secara eksplisit diatur ke `true`. Kanal dapat men-stream pratinjau langsung
(`channels.<channel>.streaming`) tanpa balasan blok.

Pengingat lokasi konfigurasi: default `blockStreaming*` berada di bawah
`agents.defaults`, bukan konfigurasi root.

## Mode streaming pratinjau

Kunci kanonis: `channels.<channel>.streaming`

Mode:

- `off`: nonaktifkan streaming pratinjau.
- `partial`: satu pratinjau yang diganti dengan teks terbaru.
- `block`: pratinjau diperbarui dalam langkah potongan/penambahan.
- `progress`: pratinjau kemajuan/status selama pembuatan, jawaban final saat selesai.

`streaming.mode: "block"` adalah mode streaming pratinjau untuk kanal yang mendukung edit
seperti Discord dan Telegram. Ini tidak mengaktifkan pengiriman blok kanal di sana.
Gunakan `streaming.block.enabled` atau kunci kanal lama `blockStreaming` saat
Anda menginginkan balasan blok normal. Microsoft Teams adalah pengecualian: ia tidak memiliki
transport blok pratinjau draf, jadi `streaming.mode: "block"` dipetakan ke pengiriman blok Teams
alih-alih streaming parsial/kemajuan native.

### Pemetaan kanal

| Kanal      | `off` | `partial` | `block` | `progress`              |
| ---------- | ----- | --------- | ------- | ----------------------- |
| Telegram   | ✅    | ✅        | ✅      | draf kemajuan yang dapat diedit |
| Discord    | ✅    | ✅        | ✅      | draf kemajuan yang dapat diedit |
| Slack      | ✅    | ✅        | ✅      | ✅                      |
| Mattermost | ✅    | ✅        | ✅      | ✅                      |
| MS Teams   | ✅    | ✅        | ✅      | stream kemajuan native  |

Khusus Slack:

- `channels.slack.streaming.nativeTransport` mengaktifkan/menonaktifkan panggilan API streaming native Slack saat `channels.slack.streaming.mode="partial"` (default: `true`).
- Streaming native Slack dan status thread asisten Slack memerlukan target thread balasan. DM tingkat atas tidak menampilkan pratinjau bergaya thread itu, tetapi tetap dapat menggunakan posting pratinjau draf Slack dan edit.

Migrasi kunci lama:

- Telegram: nilai lama `streamMode` dan nilai skalar/boolean `streaming` dideteksi dan dimigrasikan oleh jalur kompatibilitas doctor/config ke `streaming.mode`.
- Discord: `streamMode` + boolean `streaming` otomatis bermigrasi ke enum `streaming`.
- Slack: `streamMode` otomatis bermigrasi ke `streaming.mode`; boolean `streaming` otomatis bermigrasi ke `streaming.mode` plus `streaming.nativeTransport`; `nativeStreaming` lama otomatis bermigrasi ke `streaming.nativeTransport`.

### Perilaku runtime

Telegram:

- Menggunakan pembaruan pratinjau `sendMessage` + `editMessageText` di DM dan grup/topik.
- Mengirim pesan final baru alih-alih mengedit di tempat saat pratinjau telah terlihat sekitar satu menit, lalu membersihkan pratinjau agar timestamp Telegram mencerminkan penyelesaian balasan.
- Streaming pratinjau dilewati saat streaming blok Telegram diaktifkan secara eksplisit (untuk menghindari streaming ganda).
- `/reasoning stream` dapat menulis penalaran ke pratinjau.

Discord:

- Menggunakan pesan pratinjau kirim + edit.
- Mode `block` menggunakan pemotongan draf (`draftChunk`).
- Streaming pratinjau dilewati saat streaming blok Discord diaktifkan secara eksplisit.
- Media final, error, dan payload balasan eksplisit membatalkan pratinjau tertunda tanpa mem-flush draf baru, lalu menggunakan pengiriman normal.

Slack:

- `partial` dapat menggunakan streaming native Slack (`chat.startStream`/`append`/`stop`) saat tersedia.
- `block` menggunakan pratinjau draf bergaya append.
- `progress` menggunakan teks pratinjau status, lalu jawaban final.
- DM tingkat atas tanpa thread balasan menggunakan posting pratinjau draf dan edit alih-alih streaming native Slack.
- Streaming pratinjau native dan draf menekan balasan blok untuk giliran tersebut, sehingga balasan Slack di-stream hanya oleh satu jalur pengiriman.
- Payload media/error final dan final kemajuan tidak membuat pesan draf sekali pakai; hanya final teks/blok yang dapat mengedit pratinjau yang mem-flush teks draf tertunda.

Mattermost:

- Men-stream pemikiran, aktivitas alat, dan teks balasan parsial ke satu posting pratinjau draf yang difinalisasi di tempat saat jawaban final aman untuk dikirim.
- Beralih mengirim posting final baru jika posting pratinjau dihapus atau tidak tersedia saat finalisasi.
- Payload media/error final membatalkan pembaruan pratinjau tertunda sebelum pengiriman normal, bukan mem-flush posting pratinjau sementara.

Matrix:

- Pratinjau draf difinalisasi di tempat saat teks final dapat menggunakan kembali event pratinjau.
- Final khusus media, error, dan ketidakcocokan target balasan membatalkan pembaruan pratinjau tertunda sebelum pengiriman normal; pratinjau basi yang sudah terlihat akan direduksi.

### Pembaruan pratinjau kemajuan alat

Streaming pratinjau juga dapat menyertakan pembaruan **kemajuan alat** — baris status singkat seperti "mencari di web", "membaca file", atau "memanggil alat" — yang muncul dalam pesan pratinjau yang sama saat alat berjalan, sebelum balasan final. Ini membuat giliran alat multi-langkah tetap terlihat hidup, bukan diam antara pratinjau pemikiran pertama dan jawaban final.

Permukaan yang didukung:

- **Discord**, **Slack**, **Telegram**, dan **Matrix** men-stream kemajuan alat ke edit pratinjau langsung secara default saat streaming pratinjau aktif. Microsoft Teams menggunakan stream kemajuan native di obrolan personal.
- Telegram telah dikirim dengan pembaruan pratinjau kemajuan alat yang diaktifkan sejak `v2026.4.22`; menjaganya tetap aktif mempertahankan perilaku rilis tersebut.
- **Mattermost** sudah memasukkan aktivitas alat ke posting pratinjau draf tunggalnya (lihat di atas).
- Edit kemajuan alat mengikuti mode streaming pratinjau aktif; edit tersebut dilewati saat streaming pratinjau adalah `off` atau saat streaming blok telah mengambil alih pesan. Di Telegram, `streaming.mode: "off"` berarti hanya-final: obrolan kemajuan generik juga ditekan alih-alih dikirim sebagai pesan status mandiri, sementara prompt persetujuan, payload media, dan error tetap dirutekan secara normal.
- Untuk mempertahankan streaming pratinjau tetapi menyembunyikan baris kemajuan alat, atur `streaming.preview.toolProgress` ke `false` untuk kanal tersebut. Untuk menonaktifkan edit pratinjau sepenuhnya, atur `streaming.mode` ke `off`.
- Balasan kutipan terpilih Telegram adalah pengecualian: saat `replyToMode` bukan `"off"` dan teks kutipan terpilih ada, OpenClaw melewati stream pratinjau jawaban untuk giliran itu sehingga baris pratinjau kemajuan alat tidak dapat dirender. Balasan pesan saat ini tanpa teks kutipan terpilih tetap mempertahankan streaming pratinjau. Lihat [dokumentasi kanal Telegram](/id/channels/telegram) untuk detail.

Contoh:

```json
{
  "channels": {
    "telegram": {
      "streaming": {
        "mode": "partial",
        "preview": {
          "toolProgress": false
        }
      }
    }
  }
}
```

## Terkait

- [Draf kemajuan](/id/concepts/progress-drafts) — pesan pekerjaan yang sedang berlangsung yang terlihat dan diperbarui selama giliran panjang
- [Pesan](/id/concepts/messages) — siklus hidup dan pengiriman pesan
- [Coba lagi](/id/concepts/retry) — perilaku coba lagi saat pengiriman gagal
- [Kanal](/id/channels) — dukungan streaming per kanal
