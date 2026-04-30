---
read_when:
    - Menjelaskan cara kerja streaming atau pemecahan menjadi potongan pada saluran
    - Mengubah perilaku pengaliran blok atau pemecahan saluran
    - Menelusuri kesalahan pada balasan blok duplikat/terlalu awal atau streaming pratinjau saluran
summary: Perilaku streaming + pemenggalan (balasan blok, streaming pratinjau kanal, pemetaan mode)
title: Pengaliran dan pemenggalan
x-i18n:
    generated_at: "2026-04-30T09:46:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: d428355e1a0dbd426c4807add2b15fcfb09776849681bfeb2293173a2d31ee4f
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw memiliki dua lapisan streaming terpisah:

- **Streaming blok (kanal):** memancarkan **blok** yang selesai saat asisten menulis. Ini adalah pesan kanal normal (bukan delta token).
- **Streaming pratinjau (Telegram/Discord/Slack):** memperbarui **pesan pratinjau** sementara saat menghasilkan.

Saat ini **tidak ada streaming delta token sejati** ke pesan kanal. Streaming pratinjau berbasis pesan (kirim + edit/tambahan).

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

- `text_delta/events`: event stream model (bisa jarang untuk model non-streaming).
- `chunker`: `EmbeddedBlockChunker` menerapkan batas min/maks + preferensi pemisahan.
- `channel send`: pesan keluar aktual (balasan blok).

**Kontrol:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (default mati).
- Override kanal: `*.blockStreaming` (dan varian per akun) untuk memaksa `"on"`/`"off"` per kanal.
- `agents.defaults.blockStreamingBreak`: `"text_end"` atau `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (gabungkan blok yang di-stream sebelum dikirim).
- Batas keras kanal: `*.textChunkLimit` (mis., `channels.whatsapp.textChunkLimit`).
- Mode potongan kanal: `*.chunkMode` (`length` default, `newline` memisahkan pada baris kosong (batas paragraf) sebelum pemotongan berdasarkan panjang).
- Batas lunak Discord: `channels.discord.maxLinesPerMessage` (default 17) memisahkan balasan tinggi untuk menghindari pemotongan UI.

**Semantik batas:**

- `text_end`: stream blok segera setelah chunker memancarkan; flush pada setiap `text_end`.
- `message_end`: tunggu sampai pesan asisten selesai, lalu flush output yang dibuffer.

`message_end` tetap menggunakan chunker jika teks yang dibuffer melebihi `maxChars`, sehingga dapat memancarkan beberapa potongan di akhir.

### Pengiriman media dengan streaming blok

Direktif `MEDIA:` adalah metadata pengiriman normal. Ketika streaming blok mengirim blok media lebih awal, OpenClaw mengingat pengiriman itu untuk giliran tersebut. Jika payload final asisten mengulang URL media yang sama, pengiriman final menghapus media duplikat alih-alih mengirim lampiran lagi.

Payload final yang persis duplikat akan ditekan. Jika payload final menambahkan teks berbeda di sekitar media yang sudah di-stream, OpenClaw tetap mengirim teks baru sambil menjaga media dikirim satu kali. Ini mencegah duplikasi catatan suara atau file pada kanal seperti Telegram ketika agen memancarkan `MEDIA:` selama streaming dan penyedia juga menyertakannya dalam balasan yang selesai.

## Algoritme pemotongan (batas rendah/tinggi)

Pemotongan blok diimplementasikan oleh `EmbeddedBlockChunker`:

- **Batas rendah:** jangan pancarkan sampai buffer >= `minChars` (kecuali dipaksa).
- **Batas tinggi:** utamakan pemisahan sebelum `maxChars`; jika dipaksa, pisahkan pada `maxChars`.
- **Preferensi pemisahan:** `paragraph` → `newline` → `sentence` → `whitespace` → pemisahan keras.
- **Fence kode:** jangan pernah memisahkan di dalam fence; ketika dipaksa pada `maxChars`, tutup + buka kembali fence agar Markdown tetap valid.

`maxChars` dibatasi ke `textChunkLimit` kanal, sehingga Anda tidak dapat melebihi batas per kanal.

## Koalesensi (menggabungkan blok yang di-stream)

Ketika streaming blok diaktifkan, OpenClaw dapat **menggabungkan potongan blok berurutan** sebelum mengirimkannya. Ini mengurangi “spam satu baris” sambil tetap menyediakan output progresif.

- Koalesensi menunggu **jeda menganggur** (`idleMs`) sebelum flush.
- Buffer dibatasi oleh `maxChars` dan akan di-flush jika melebihinya.
- `minChars` mencegah fragmen sangat kecil dikirim sampai teks yang terkumpul cukup (flush final selalu mengirim sisa teks).
- Penggabung diturunkan dari `blockStreamingChunk.breakPreference` (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → spasi).
- Override kanal tersedia melalui `*.blockStreamingCoalesce` (termasuk konfigurasi per akun).
- Default coalesce `minChars` dinaikkan menjadi 1500 untuk Signal/Slack/Discord kecuali di-override.

## Jeda mirip manusia antarblok

Ketika streaming blok diaktifkan, Anda dapat menambahkan **jeda acak** di antara balasan blok (setelah blok pertama). Ini membuat respons multi-gelembung terasa lebih alami.

- Konfigurasi: `agents.defaults.humanDelay` (override per agen melalui `agents.list[].humanDelay`).
- Mode: `off` (default), `natural` (800–2500ms), `custom` (`minMs`/`maxMs`).
- Berlaku hanya untuk **balasan blok**, bukan balasan final atau ringkasan alat.

## "Stream potongan atau semuanya"

Ini dipetakan ke:

- **Stream potongan:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (pancarkan sambil berjalan). Kanal non-Telegram juga memerlukan `*.blockStreaming: true`.
- **Stream semuanya di akhir:** `blockStreamingBreak: "message_end"` (flush sekali, mungkin beberapa potongan jika sangat panjang).
- **Tanpa streaming blok:** `blockStreamingDefault: "off"` (hanya balasan final).

**Catatan kanal:** Streaming blok **mati kecuali**
`*.blockStreaming` secara eksplisit diatur ke `true`. Kanal dapat men-stream pratinjau langsung (`channels.<channel>.streaming`) tanpa balasan blok.

Pengingat lokasi konfigurasi: default `blockStreaming*` berada di bawah
`agents.defaults`, bukan konfigurasi root.

## Mode streaming pratinjau

Kunci kanonis: `channels.<channel>.streaming`

Mode:

- `off`: nonaktifkan streaming pratinjau.
- `partial`: satu pratinjau yang diganti dengan teks terbaru.
- `block`: pembaruan pratinjau dalam langkah yang dipotong/ditambahkan.
- `progress`: pratinjau progres/status selama pembuatan, jawaban final saat selesai.

### Pemetaan kanal

| Kanal      | `off` | `partial` | `block` | `progress`        |
| ---------- | ----- | --------- | ------- | ----------------- |
| Telegram   | ✅    | ✅        | ✅      | dipetakan ke `partial` |
| Discord    | ✅    | ✅        | ✅      | dipetakan ke `partial` |
| Slack      | ✅    | ✅        | ✅      | ✅                |
| Mattermost | ✅    | ✅        | ✅      | ✅                |

Khusus Slack:

- `channels.slack.streaming.nativeTransport` mengaktifkan/menonaktifkan panggilan API streaming native Slack ketika `channels.slack.streaming.mode="partial"` (default: `true`).
- Streaming native Slack dan status thread asisten Slack memerlukan target thread balasan; DM tingkat atas tidak menampilkan pratinjau bergaya thread tersebut.

Migrasi kunci lama:

- Telegram: `streamMode` lama dan nilai `streaming` skalar/boolean dideteksi dan dimigrasikan oleh jalur kompatibilitas doctor/konfigurasi ke `streaming.mode`.
- Discord: `streamMode` + `streaming` boolean otomatis bermigrasi ke enum `streaming`.
- Slack: `streamMode` otomatis bermigrasi ke `streaming.mode`; `streaming` boolean otomatis bermigrasi ke `streaming.mode` plus `streaming.nativeTransport`; `nativeStreaming` lama otomatis bermigrasi ke `streaming.nativeTransport`.

### Perilaku runtime

Telegram:

- Menggunakan pembaruan pratinjau `sendMessage` + `editMessageText` di seluruh DM dan grup/topik.
- Mengirim pesan final baru alih-alih mengedit di tempat ketika pratinjau telah terlihat sekitar satu menit, lalu membersihkan pratinjau agar timestamp Telegram mencerminkan penyelesaian balasan.
- Streaming pratinjau dilewati ketika streaming blok Telegram secara eksplisit diaktifkan (untuk menghindari streaming ganda).
- `/reasoning stream` dapat menulis penalaran ke pratinjau.

Discord:

- Menggunakan pesan pratinjau kirim + edit.
- Mode `block` menggunakan pemotongan draf (`draftChunk`).
- Streaming pratinjau dilewati ketika streaming blok Discord secara eksplisit diaktifkan.
- Payload media final, error, dan balasan eksplisit membatalkan pratinjau tertunda tanpa flush draf baru, lalu menggunakan pengiriman normal.

Slack:

- `partial` dapat menggunakan streaming native Slack (`chat.startStream`/`append`/`stop`) ketika tersedia.
- `block` menggunakan pratinjau draf bergaya tambahan.
- `progress` menggunakan teks pratinjau status, lalu jawaban final.
- Streaming pratinjau native dan draf menekan balasan blok untuk giliran tersebut, sehingga balasan Slack di-stream hanya melalui satu jalur pengiriman.
- Payload media/error final dan final progres tidak membuat pesan draf sekali pakai; hanya final teks/blok yang dapat mengedit pratinjau yang melakukan flush teks draf tertunda.

Mattermost:

- Men-stream pemikiran, aktivitas alat, dan teks balasan parsial ke dalam satu posting pratinjau draf yang difinalisasi di tempat ketika jawaban final aman untuk dikirim.
- Beralih ke pengiriman posting final baru jika posting pratinjau dihapus atau tidak tersedia saat waktu finalisasi.
- Payload media/error final membatalkan pembaruan pratinjau tertunda sebelum pengiriman normal alih-alih melakukan flush posting pratinjau sementara.

Matrix:

- Pratinjau draf difinalisasi di tempat ketika teks final dapat menggunakan ulang event pratinjau.
- Final khusus media, error, dan ketidakcocokan target balasan membatalkan pembaruan pratinjau tertunda sebelum pengiriman normal; pratinjau lama yang sudah terlihat akan diredaaksi.

### Pembaruan pratinjau progres alat

Streaming pratinjau juga dapat menyertakan pembaruan **progres alat** — baris status pendek seperti "mencari di web", "membaca file", atau "memanggil alat" — yang muncul dalam pesan pratinjau yang sama saat alat berjalan, sebelum balasan final. Ini menjaga giliran alat multi-langkah tetap terlihat aktif, bukan senyap di antara pratinjau pemikiran pertama dan jawaban final.

Surface yang didukung:

- **Discord**, **Slack**, **Telegram**, dan **Matrix** men-stream progres alat ke edit pratinjau langsung secara default ketika streaming pratinjau aktif.
- Telegram telah dikirim dengan pembaruan pratinjau progres alat yang diaktifkan sejak `v2026.4.22`; membiarkannya aktif mempertahankan perilaku rilis tersebut.
- **Mattermost** sudah menggabungkan aktivitas alat ke dalam satu posting pratinjau drafnya (lihat di atas).
- Edit progres alat mengikuti mode streaming pratinjau aktif; edit dilewati ketika streaming pratinjau `off` atau ketika streaming blok telah mengambil alih pesan. Di Telegram, `streaming.mode: "off"` berarti hanya-final: obrolan progres generik juga ditekan alih-alih dikirim sebagai pesan "Sedang bekerja..." mandiri, sementara prompt persetujuan, payload media, dan error tetap dirutekan normal.
- Untuk mempertahankan streaming pratinjau tetapi menyembunyikan baris progres alat, atur `streaming.preview.toolProgress` ke `false` untuk kanal tersebut. Untuk menonaktifkan edit pratinjau sepenuhnya, atur `streaming.mode` ke `off`.

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
- [Coba Lagi](/id/concepts/retry) — perilaku coba lagi saat kegagalan pengiriman
- [Kanal](/id/channels) — dukungan streaming per kanal
