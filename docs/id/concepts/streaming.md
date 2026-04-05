---
read_when:
    - Menjelaskan cara kerja streaming atau chunking di channel
    - Mengubah perilaku block streaming atau channel chunking
    - Men-debug balasan blok yang duplikat/terlalu awal atau preview streaming channel
summary: Perilaku streaming + chunking (balasan blok, preview streaming channel, pemetaan mode)
title: Streaming dan Chunking
x-i18n:
    generated_at: "2026-04-05T13:52:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 44b0d08c7eafcb32030ef7c8d5719c2ea2d34e4bac5fdad8cc8b3f4e9e9fad97
    source_path: concepts/streaming.md
    workflow: 15
---

# Streaming + chunking

OpenClaw memiliki dua lapisan streaming yang terpisah:

- **Block streaming (channel):** mengirim **blok** yang sudah selesai saat asisten menulis. Ini adalah pesan channel biasa (bukan delta token).
- **Preview streaming (Telegram/Discord/Slack):** memperbarui **pesan preview** sementara selama proses pembuatan.

Saat ini **tidak ada true token-delta streaming** ke pesan channel. Preview streaming berbasis pesan (kirim + edit/tambahkan).

## Block streaming (pesan channel)

Block streaming mengirim output asisten dalam potongan besar saat tersedia.

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
- `chunker`: `EmbeddedBlockChunker` yang menerapkan batas min/maks + preferensi pemisahan.
- `channel send`: pesan keluar yang sebenarnya (balasan blok).

**Kontrol:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (default off).
- Override channel: `*.blockStreaming` (dan varian per akun) untuk memaksa `"on"`/`"off"` per channel.
- `agents.defaults.blockStreamingBreak`: `"text_end"` atau `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (gabungkan blok yang di-stream sebelum dikirim).
- Hard cap channel: `*.textChunkLimit` (misalnya, `channels.whatsapp.textChunkLimit`).
- Mode chunk channel: `*.chunkMode` (`length` sebagai default, `newline` memisahkan pada baris kosong (batas paragraf) sebelum chunking berdasarkan panjang).
- Soft cap Discord: `channels.discord.maxLinesPerMessage` (default 17) memisahkan balasan yang tinggi untuk menghindari pemotongan UI.

**Semantik batas:**

- `text_end`: stream blok segera setelah chunker mengeluarkan hasil; flush pada setiap `text_end`.
- `message_end`: tunggu hingga pesan asisten selesai, lalu flush output yang dibuffer.

`message_end` tetap menggunakan chunker jika teks dalam buffer melebihi `maxChars`, sehingga bisa mengeluarkan beberapa chunk di akhir.

## Algoritma chunking (batas rendah/tinggi)

Block chunking diimplementasikan oleh `EmbeddedBlockChunker`:

- **Batas rendah:** jangan emit sampai buffer >= `minChars` (kecuali dipaksa).
- **Batas tinggi:** prioritaskan pemisahan sebelum `maxChars`; jika dipaksa, pisahkan di `maxChars`.
- **Preferensi pemisahan:** `paragraph` → `newline` → `sentence` → `whitespace` → hard break.
- **Code fence:** jangan pernah memisahkan di dalam fence; ketika dipaksa di `maxChars`, tutup + buka kembali fence agar Markdown tetap valid.

`maxChars` dijepit ke `textChunkLimit` channel, sehingga Anda tidak bisa melebihi batas per channel.

## Coalescing (menggabungkan blok yang di-stream)

Saat block streaming diaktifkan, OpenClaw dapat **menggabungkan block chunk yang berurutan**
sebelum mengirimkannya. Ini mengurangi “spam satu baris” sambil tetap memberikan
output progresif.

- Coalescing menunggu **jeda idle** (`idleMs`) sebelum flush.
- Buffer dibatasi oleh `maxChars` dan akan flush jika melebihinya.
- `minChars` mencegah fragmen kecil dikirim sampai cukup banyak teks yang terkumpul
  (flush akhir selalu mengirim sisa teks).
- Joiner diturunkan dari `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → spasi).
- Override channel tersedia melalui `*.blockStreamingCoalesce` (termasuk konfigurasi per akun).
- Default coalesce `minChars` dinaikkan menjadi 1500 untuk Signal/Slack/Discord kecuali dioverride.

## Tempo seperti manusia di antara blok

Saat block streaming diaktifkan, Anda dapat menambahkan **jeda acak** di antara
balasan blok (setelah blok pertama). Ini membuat respons multi-bubble terasa
lebih alami.

- Konfigurasi: `agents.defaults.humanDelay` (override per agen melalui `agents.list[].humanDelay`).
- Mode: `off` (default), `natural` (800–2500ms), `custom` (`minMs`/`maxMs`).
- Hanya berlaku untuk **balasan blok**, bukan balasan akhir atau ringkasan tool.

## "Stream chunks or everything"

Ini dipetakan ke:

- **Stream chunks:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (emit sambil berjalan). Channel non-Telegram juga memerlukan `*.blockStreaming: true`.
- **Stream everything at end:** `blockStreamingBreak: "message_end"` (flush sekali, mungkin beberapa chunk jika sangat panjang).
- **No block streaming:** `blockStreamingDefault: "off"` (hanya balasan akhir).

**Catatan channel:** Block streaming **nonaktif kecuali**
`*.blockStreaming` secara eksplisit disetel ke `true`. Channel dapat men-stream preview langsung
(`channels.<channel>.streaming`) tanpa balasan blok.

Pengingat lokasi konfigurasi: default `blockStreaming*` berada di bawah
`agents.defaults`, bukan konfigurasi root.

## Mode preview streaming

Kunci kanonis: `channels.<channel>.streaming`

Mode:

- `off`: nonaktifkan preview streaming.
- `partial`: satu preview yang diganti dengan teks terbaru.
- `block`: preview diperbarui dalam langkah bertahap yang di-chunk/ditambahkan.
- `progress`: preview status/kemajuan selama pembuatan, jawaban akhir saat selesai.

### Pemetaan channel

| Channel  | `off` | `partial` | `block` | `progress`        |
| -------- | ----- | --------- | ------- | ----------------- |
| Telegram | ✅    | ✅        | ✅      | dipetakan ke `partial` |
| Discord  | ✅    | ✅        | ✅      | dipetakan ke `partial` |
| Slack    | ✅    | ✅        | ✅      | ✅                |

Khusus Slack:

- `channels.slack.nativeStreaming` mengaktifkan/nonaktifkan panggilan API native streaming Slack ketika `streaming=partial` (default: `true`).

Migrasi kunci lama:

- Telegram: `streamMode` + boolean `streaming` dimigrasikan otomatis ke enum `streaming`.
- Discord: `streamMode` + boolean `streaming` dimigrasikan otomatis ke enum `streaming`.
- Slack: `streamMode` dimigrasikan otomatis ke enum `streaming`; boolean `streaming` dimigrasikan otomatis ke `nativeStreaming`.

### Perilaku runtime

Telegram:

- Menggunakan update preview `sendMessage` + `editMessageText` di DM serta grup/topik.
- Preview streaming dilewati ketika Telegram block streaming diaktifkan secara eksplisit (untuk menghindari streaming ganda).
- `/reasoning stream` dapat menulis reasoning ke preview.

Discord:

- Menggunakan pesan preview send + edit.
- Mode `block` menggunakan draft chunking (`draftChunk`).
- Preview streaming dilewati ketika Discord block streaming diaktifkan secara eksplisit.

Slack:

- `partial` dapat menggunakan API native streaming Slack (`chat.startStream`/`append`/`stop`) jika tersedia.
- `block` menggunakan preview draf bergaya append.
- `progress` menggunakan teks preview status, lalu jawaban akhir.

## Terkait

- [Messages](/concepts/messages) — siklus hidup dan pengiriman pesan
- [Retry](/concepts/retry) — perilaku retry saat pengiriman gagal
- [Channels](/id/channels) — dukungan streaming per channel
