---
read_when:
    - Menjelaskan cara kerja streaming atau chunking pada kanal
    - Mengubah perilaku block streaming atau chunking kanal
    - Men-debug balasan blok yang duplikat/terlalu awal atau pratinjau streaming kanal
summary: Perilaku streaming + chunking (balasan blok, pratinjau streaming kanal, pemetaan mode)
title: Streaming dan chunking
x-i18n:
    generated_at: "2026-04-24T09:05:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 48d0391644e410d08f81cc2fb2d02a4aeb836ab04f37ea34a6c94bec9bc16b07
    source_path: concepts/streaming.md
    workflow: 15
---

# Streaming + chunking

OpenClaw memiliki dua lapisan streaming yang terpisah:

- **Block streaming (kanal):** mengeluarkan **blok** yang sudah selesai saat asisten menulis. Ini adalah pesan kanal normal (bukan token delta).
- **Preview streaming (Telegram/Discord/Slack):** memperbarui **pesan pratinjau** sementara selama proses generasi.

Saat ini **tidak ada true token-delta streaming** ke pesan kanal. Preview streaming berbasis pesan (kirim + edit/tambahkan).

## Block streaming (pesan kanal)

Block streaming mengirim output asisten dalam potongan kasar saat output itu tersedia.

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

- `text_delta/events`: event stream model (dapat jarang untuk model non-streaming).
- `chunker`: `EmbeddedBlockChunker` yang menerapkan batas min/maks + preferensi pemutusan.
- `channel send`: pesan keluar aktual (balasan blok).

**Kontrol:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (default off).
- Override kanal: `*.blockStreaming` (dan varian per-akun) untuk memaksa `"on"`/`"off"` per kanal.
- `agents.defaults.blockStreamingBreak`: `"text_end"` atau `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (menggabungkan blok yang di-stream sebelum dikirim).
- Batas keras kanal: `*.textChunkLimit` (mis. `channels.whatsapp.textChunkLimit`).
- Mode chunk kanal: `*.chunkMode` (`length` default, `newline` membagi pada baris kosong (batas paragraf) sebelum chunking berdasarkan panjang).
- Batas lunak Discord: `channels.discord.maxLinesPerMessage` (default 17) membagi balasan tinggi agar terhindar dari clipping UI.

**Semantik batas:**

- `text_end`: stream blok segera saat chunker mengeluarkan blok; flush pada setiap `text_end`.
- `message_end`: tunggu hingga pesan asisten selesai, lalu flush output yang dibuffer.

`message_end` tetap menggunakan chunker jika teks yang dibuffer melebihi `maxChars`, sehingga tetap dapat mengeluarkan beberapa chunk pada akhir.

## Algoritma chunking (batas bawah/atas)

Block chunking diimplementasikan oleh `EmbeddedBlockChunker`:

- **Batas bawah:** jangan mengeluarkan apa pun hingga buffer >= `minChars` (kecuali dipaksa).
- **Batas atas:** utamakan pemisahan sebelum `maxChars`; jika dipaksa, pisahkan tepat di `maxChars`.
- **Preferensi pemutusan:** `paragraph` → `newline` → `sentence` → `whitespace` → hard break.
- **Code fence:** jangan pernah membagi di dalam fence; ketika dipaksa pada `maxChars`, tutup + buka kembali fence agar Markdown tetap valid.

`maxChars` dijepit ke `textChunkLimit` kanal, jadi Anda tidak dapat melebihi batas per kanal.

## Coalescing (menggabungkan blok yang di-stream)

Ketika block streaming diaktifkan, OpenClaw dapat **menggabungkan chunk blok berturut-turut**
sebelum mengirimkannya. Ini mengurangi “spam satu baris” sambil tetap memberikan
output progresif.

- Coalescing menunggu **jeda idle** (`idleMs`) sebelum flush.
- Buffer dibatasi oleh `maxChars` dan akan flush jika melebihinya.
- `minChars` mencegah fragmen kecil terkirim sampai teks cukup banyak terkumpul
  (flush akhir selalu mengirim teks yang tersisa).
- Joiner diturunkan dari `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → spasi).
- Override kanal tersedia melalui `*.blockStreamingCoalesce` (termasuk konfigurasi per-akun).
- `minChars` coalesce default dinaikkan menjadi 1500 untuk Signal/Slack/Discord kecuali dioverride.

## Tempo antarmanusia di antara blok

Ketika block streaming diaktifkan, Anda dapat menambahkan **jeda acak**
di antara balasan blok (setelah blok pertama). Ini membuat respons multi-bubble
terasa lebih alami.

- Konfigurasi: `agents.defaults.humanDelay` (override per agen melalui `agents.list[].humanDelay`).
- Mode: `off` (default), `natural` (800–2500ms), `custom` (`minMs`/`maxMs`).
- Berlaku hanya untuk **balasan blok**, bukan balasan akhir atau ringkasan tool.

## "Stream chunks or everything"

Ini dipetakan ke:

- **Stream chunks:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (keluarkan sambil berjalan). Kanal non-Telegram juga memerlukan `*.blockStreaming: true`.
- **Stream everything at end:** `blockStreamingBreak: "message_end"` (flush sekali, mungkin menjadi beberapa chunk jika sangat panjang).
- **No block streaming:** `blockStreamingDefault: "off"` (hanya balasan akhir).

**Catatan kanal:** Block streaming **nonaktif kecuali**
`*.blockStreaming` secara eksplisit disetel ke `true`. Kanal masih dapat melakukan stream pratinjau live
(`channels.<channel>.streaming`) tanpa balasan blok.

Pengingat lokasi konfigurasi: default `blockStreaming*` berada di bawah
`agents.defaults`, bukan root config.

## Mode preview streaming

Key kanonis: `channels.<channel>.streaming`

Mode:

- `off`: nonaktifkan preview streaming.
- `partial`: satu pratinjau yang diganti dengan teks terbaru.
- `block`: pratinjau diperbarui dalam langkah chunked/ditambahkan.
- `progress`: pratinjau progres/status selama generasi, jawaban akhir saat selesai.

### Pemetaan kanal

| Kanal      | `off` | `partial` | `block` | `progress`         |
| ---------- | ----- | --------- | ------- | ------------------ |
| Telegram   | ✅    | ✅        | ✅      | dipetakan ke `partial` |
| Discord    | ✅    | ✅        | ✅      | dipetakan ke `partial` |
| Slack      | ✅    | ✅        | ✅      | ✅                 |
| Mattermost | ✅    | ✅        | ✅      | ✅                 |

Khusus Slack:

- `channels.slack.streaming.nativeTransport` mengaktifkan/nonaktifkan pemanggilan API streaming native Slack saat `channels.slack.streaming.mode="partial"` (default: `true`).
- Streaming native Slack dan status thread asisten Slack memerlukan target thread balasan; DM level atas tidak menampilkan pratinjau bergaya thread tersebut.

Migrasi key legacy:

- Telegram: `streamMode` + boolean `streaming` dimigrasikan otomatis ke enum `streaming`.
- Discord: `streamMode` + boolean `streaming` dimigrasikan otomatis ke enum `streaming`.
- Slack: `streamMode` dimigrasikan otomatis ke `streaming.mode`; boolean `streaming` dimigrasikan otomatis ke `streaming.mode` plus `streaming.nativeTransport`; `nativeStreaming` legacy dimigrasikan otomatis ke `streaming.nativeTransport`.

### Perilaku runtime

Telegram:

- Menggunakan pembaruan pratinjau `sendMessage` + `editMessageText` di DM dan grup/topik.
- Preview streaming dilewati ketika block streaming Telegram diaktifkan secara eksplisit (untuk menghindari streaming ganda).
- `/reasoning stream` dapat menulis reasoning ke pratinjau.

Discord:

- Menggunakan pesan pratinjau kirim + edit.
- Mode `block` menggunakan draft chunking (`draftChunk`).
- Preview streaming dilewati ketika block streaming Discord diaktifkan secara eksplisit.
- Payload media akhir, error, dan explicit-reply membatalkan pratinjau tertunda tanpa mem-flush draf baru, lalu menggunakan pengiriman normal.

Slack:

- `partial` dapat menggunakan streaming native Slack (`chat.startStream`/`append`/`stop`) jika tersedia.
- `block` menggunakan pratinjau draf bergaya append.
- `progress` menggunakan teks pratinjau status, lalu jawaban akhir.
- Payload media/error akhir dan final progress tidak membuat pesan draf buangan; hanya final teks/blok yang dapat mengedit pratinjau yang mem-flush teks draf tertunda.

Mattermost:

- Men-stream thinking, aktivitas tool, dan teks balasan parsial ke satu post pratinjau draf yang difinalisasi di tempat saat jawaban akhir aman untuk dikirim.
- Fallback ke pengiriman post akhir baru jika post pratinjau telah dihapus atau tidak tersedia saat finalisasi.
- Payload media/error akhir membatalkan pembaruan pratinjau tertunda sebelum pengiriman normal alih-alih mem-flush post pratinjau sementara.

Matrix:

- Pratinjau draf difinalisasi di tempat saat teks akhir dapat menggunakan ulang event pratinjau.
- Final hanya-media, error, dan reply-target-mismatch membatalkan pembaruan pratinjau tertunda sebelum pengiriman normal; pratinjau lama yang sudah terlihat akan di-redact.

### Pembaruan pratinjau tool-progress

Preview streaming juga dapat menyertakan pembaruan **tool-progress** — baris status pendek seperti "searching the web", "reading file", atau "calling tool" — yang muncul dalam pesan pratinjau yang sama saat tool berjalan, mendahului balasan akhir. Ini menjaga giliran tool multi-langkah tetap terasa hidup secara visual alih-alih sunyi di antara pratinjau thinking pertama dan jawaban akhir.

Permukaan yang didukung:

- **Discord**, **Slack**, dan **Telegram** men-stream tool-progress ke edit pratinjau live.
- **Mattermost** sudah menggabungkan aktivitas tool ke dalam satu post pratinjau drafnya (lihat di atas).
- Edit tool-progress mengikuti mode preview streaming aktif; edit ini dilewati ketika preview streaming `off` atau ketika block streaming telah mengambil alih pesan.

## Terkait

- [Pesan](/id/concepts/messages) — siklus hidup dan pengiriman pesan
- [Retry](/id/concepts/retry) — perilaku retry saat pengiriman gagal
- [Channels](/id/channels) — dukungan streaming per kanal
