---
read_when:
    - Menjelaskan cara kerja streaming atau pemotongan menjadi bagian-bagian pada saluran
    - Mengubah perilaku streaming blok atau pemotongan kanal
    - Men-debug balasan blok duplikat/awal atau streaming pratinjau saluran
summary: Perilaku streaming + chunking (balasan blok, streaming pratinjau saluran, pemetaan mode)
title: Pengaliran dan pemecahan menjadi potongan
x-i18n:
    generated_at: "2026-05-03T09:15:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85f6cb33031a6c818bb709e0ed14d8dd0f8c30a3dd90468a40396b3a515b5e65
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw memiliki dua lapisan streaming terpisah:

- **Streaming blok (saluran):** memancarkan **blok** yang selesai saat asisten menulis. Ini adalah pesan saluran normal (bukan delta token).
- **Streaming pratinjau (Telegram/Discord/Slack):** memperbarui **pesan pratinjau** sementara saat menghasilkan.

Saat ini **tidak ada streaming delta token sejati** ke pesan saluran. Streaming pratinjau berbasis pesan (kirim + edit/tambahkan).

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

- `text_delta/events`: peristiwa stream model (bisa jarang untuk model non-streaming).
- `chunker`: `EmbeddedBlockChunker` yang menerapkan batas min/maks + preferensi pemisahan.
- `channel send`: pesan keluar aktual (balasan blok).

**Kontrol:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (default mati).
- Override saluran: `*.blockStreaming` (dan varian per akun) untuk memaksa `"on"`/`"off"` per saluran.
- `agents.defaults.blockStreamingBreak`: `"text_end"` atau `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (gabungkan blok yang di-stream sebelum dikirim).
- Batas keras saluran: `*.textChunkLimit` (misalnya, `channels.whatsapp.textChunkLimit`).
- Mode potongan saluran: `*.chunkMode` (`length` default, `newline` memisahkan pada baris kosong (batas paragraf) sebelum pemotongan berdasarkan panjang).
- Batas lunak Discord: `channels.discord.maxLinesPerMessage` (default 17) memisahkan balasan tinggi untuk menghindari pemotongan UI.

**Semantik batas:**

- `text_end`: stream blok segera setelah chunker memancarkan; flush pada setiap `text_end`.
- `message_end`: tunggu hingga pesan asisten selesai, lalu flush output yang dibuffer.

`message_end` tetap menggunakan chunker jika teks yang dibuffer melebihi `maxChars`, sehingga dapat memancarkan beberapa potongan di akhir.

### Pengiriman media dengan streaming blok

Direktif `MEDIA:` adalah metadata pengiriman normal. Saat streaming blok mengirim blok media lebih awal, OpenClaw mengingat pengiriman itu untuk giliran tersebut. Jika payload akhir asisten mengulang URL media yang sama, pengiriman akhir menghapus media duplikat alih-alih mengirim lampiran lagi.

Payload akhir yang persis duplikat akan ditekan. Jika payload akhir menambahkan teks berbeda di sekitar media yang sudah di-stream, OpenClaw tetap mengirim teks baru sambil menjaga media hanya dikirim sekali. Ini mencegah catatan suara atau file duplikat pada saluran seperti Telegram saat agen memancarkan `MEDIA:` selama streaming dan provider juga menyertakannya dalam balasan selesai.

## Algoritma pemotongan (batas rendah/tinggi)

Pemotongan blok diimplementasikan oleh `EmbeddedBlockChunker`:

- **Batas rendah:** jangan pancarkan hingga buffer >= `minChars` (kecuali dipaksa).
- **Batas tinggi:** utamakan pemisahan sebelum `maxChars`; jika dipaksa, pisahkan pada `maxChars`.
- **Preferensi pemisahan:** `paragraph` → `newline` → `sentence` → `whitespace` → pemisahan keras.
- **Code fence:** jangan pernah memisahkan di dalam fence; saat dipaksa pada `maxChars`, tutup + buka ulang fence agar Markdown tetap valid.

`maxChars` dibatasi ke `textChunkLimit` saluran, sehingga Anda tidak dapat melebihi batas per saluran.

## Koalesensi (menggabungkan blok yang di-stream)

Saat streaming blok diaktifkan, OpenClaw dapat **menggabungkan potongan blok berurutan** sebelum mengirimnya. Ini mengurangi “spam satu baris” sambil tetap menyediakan output progresif.

- Koalesensi menunggu **jeda idle** (`idleMs`) sebelum flush.
- Buffer dibatasi oleh `maxChars` dan akan di-flush jika melebihinya.
- `minChars` mencegah fragmen kecil dikirim hingga cukup teks terkumpul (flush akhir selalu mengirim teks tersisa).
- Penggabung diturunkan dari `blockStreamingChunk.breakPreference` (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → spasi).
- Override saluran tersedia melalui `*.blockStreamingCoalesce` (termasuk konfigurasi per akun).
- `minChars` koalesensi default dinaikkan menjadi 1500 untuk Signal/Slack/Discord kecuali dioverride.

## Jeda antarblok yang terasa manusiawi

Saat streaming blok diaktifkan, Anda dapat menambahkan **jeda acak** di antara balasan blok (setelah blok pertama). Ini membuat respons multi-gelembung terasa lebih alami.

- Konfigurasi: `agents.defaults.humanDelay` (override per agen melalui `agents.list[].humanDelay`).
- Mode: `off` (default), `natural` (800–2500ms), `custom` (`minMs`/`maxMs`).
- Hanya berlaku untuk **balasan blok**, bukan balasan akhir atau ringkasan alat.

## "Stream potongan atau semuanya"

Ini dipetakan ke:

- **Stream potongan:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (pancarkan saat berjalan). Saluran non-Telegram juga memerlukan `*.blockStreaming: true`.
- **Stream semuanya di akhir:** `blockStreamingBreak: "message_end"` (flush sekali, mungkin beberapa potongan jika sangat panjang).
- **Tanpa streaming blok:** `blockStreamingDefault: "off"` (hanya balasan akhir).

**Catatan saluran:** Streaming blok **mati kecuali**
`*.blockStreaming` secara eksplisit disetel ke `true`. Saluran dapat men-stream pratinjau langsung (`channels.<channel>.streaming`) tanpa balasan blok.

Pengingat lokasi konfigurasi: default `blockStreaming*` berada di bawah
`agents.defaults`, bukan konfigurasi root.

## Mode streaming pratinjau

Kunci kanonis: `channels.<channel>.streaming`

Mode:

- `off`: nonaktifkan streaming pratinjau.
- `partial`: satu pratinjau yang diganti dengan teks terbaru.
- `block`: pratinjau diperbarui dalam langkah-langkah dipotong/ditambahkan.
- `progress`: pratinjau progres/status selama pembuatan, jawaban akhir saat selesai.

### Pemetaan saluran

| Saluran    | `off` | `partial` | `block` | `progress`        |
| ---------- | ----- | --------- | ------- | ----------------- |
| Telegram   | ✅    | ✅        | ✅      | dipetakan ke `partial` |
| Discord    | ✅    | ✅        | ✅      | dipetakan ke `partial` |
| Slack      | ✅    | ✅        | ✅      | ✅                |
| Mattermost | ✅    | ✅        | ✅      | ✅                |

Khusus Slack:

- `channels.slack.streaming.nativeTransport` mengalihkan panggilan API streaming native Slack saat `channels.slack.streaming.mode="partial"` (default: `true`).
- Streaming native Slack dan status thread asisten Slack memerlukan target thread balasan. DM tingkat atas tidak menampilkan pratinjau bergaya thread tersebut, tetapi tetap dapat menggunakan posting pratinjau draf Slack dan edit.

Migrasi kunci lama:

- Telegram: `streamMode` lama dan nilai `streaming` skalar/boolean dideteksi dan dimigrasikan oleh jalur kompatibilitas doctor/config ke `streaming.mode`.
- Discord: `streamMode` + `streaming` boolean otomatis dimigrasikan ke enum `streaming`.
- Slack: `streamMode` otomatis dimigrasikan ke `streaming.mode`; `streaming` boolean otomatis dimigrasikan ke `streaming.mode` plus `streaming.nativeTransport`; `nativeStreaming` lama otomatis dimigrasikan ke `streaming.nativeTransport`.

### Perilaku runtime

Telegram:

- Menggunakan pembaruan pratinjau `sendMessage` + `editMessageText` di DM dan grup/topik.
- Mengirim pesan akhir baru alih-alih mengedit di tempat saat pratinjau sudah terlihat sekitar satu menit, lalu membersihkan pratinjau agar timestamp Telegram mencerminkan penyelesaian balasan.
- Streaming pratinjau dilewati saat streaming blok Telegram diaktifkan secara eksplisit (untuk menghindari streaming ganda).
- `/reasoning stream` dapat menulis penalaran ke pratinjau.

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
- Streaming pratinjau native dan draf menekan balasan blok untuk giliran tersebut, sehingga balasan Slack di-stream hanya oleh satu jalur pengiriman.
- Payload media/error akhir dan final progres tidak membuat pesan draf sementara; hanya final teks/blok yang dapat mengedit pratinjau yang mem-flush teks draf tertunda.

Mattermost:

- Men-stream pemikiran, aktivitas alat, dan teks balasan parsial ke satu posting pratinjau draf yang difinalisasi di tempat saat jawaban akhir aman untuk dikirim.
- Fallback ke pengiriman posting akhir baru jika posting pratinjau dihapus atau tidak tersedia saat finalisasi.
- Payload media/error akhir membatalkan pembaruan pratinjau tertunda sebelum pengiriman normal alih-alih mem-flush posting pratinjau sementara.

Matrix:

- Pratinjau draf difinalisasi di tempat saat teks akhir dapat menggunakan ulang peristiwa pratinjau.
- Final media-saja, error, dan ketidakcocokan target balasan membatalkan pembaruan pratinjau tertunda sebelum pengiriman normal; pratinjau basi yang sudah terlihat akan disunting.

### Pembaruan pratinjau progres alat

Streaming pratinjau juga dapat mencakup pembaruan **progres alat** — baris status singkat seperti "menelusuri web", "membaca file", atau "memanggil alat" — yang muncul dalam pesan pratinjau yang sama saat alat berjalan, sebelum balasan akhir. Ini membuat giliran alat multi-langkah tetap hidup secara visual alih-alih senyap di antara pratinjau pemikiran pertama dan jawaban akhir.

Permukaan yang didukung:

- **Discord**, **Slack**, **Telegram**, dan **Matrix** men-stream progres alat ke edit pratinjau langsung secara default saat streaming pratinjau aktif.
- Telegram telah dirilis dengan pembaruan pratinjau progres alat aktif sejak `v2026.4.22`; mempertahankannya aktif menjaga perilaku yang sudah dirilis tersebut.
- **Mattermost** sudah melipat aktivitas alat ke dalam satu posting pratinjau drafnya (lihat di atas).
- Edit progres alat mengikuti mode streaming pratinjau aktif; edit tersebut dilewati saat streaming pratinjau `off` atau saat streaming blok telah mengambil alih pesan. Di Telegram, `streaming.mode: "off"` bersifat hanya-final: obrolan progres generik juga ditekan alih-alih dikirim sebagai pesan "Working..." mandiri, sementara prompt persetujuan, payload media, dan error tetap dirutekan secara normal.
- Untuk mempertahankan streaming pratinjau tetapi menyembunyikan baris progres alat, setel `streaming.preview.toolProgress` ke `false` untuk saluran tersebut. Untuk menonaktifkan edit pratinjau sepenuhnya, setel `streaming.mode` ke `off`.

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

- [Pesan](/id/concepts/messages) — siklus hidup dan pengiriman pesan
- [Coba ulang](/id/concepts/retry) — perilaku coba ulang saat pengiriman gagal
- [Saluran](/id/channels) — dukungan streaming per saluran
