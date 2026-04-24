---
read_when:
    - Menjelaskan bagaimana pesan masuk menjadi balasan
    - Memperjelas sesi, mode antrean, atau perilaku streaming
    - Mendokumentasikan visibilitas penalaran dan implikasi penggunaan
summary: Alur pesan, sesi, antrean, dan visibilitas penalaran
title: Pesan
x-i18n:
    generated_at: "2026-04-24T09:04:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 22a154246f47b5841dc9d4b9f8e3c5698e5e56bc0b2dbafe19fec45799dbbba9
    source_path: concepts/messages.md
    workflow: 15
---

Halaman ini merangkum bagaimana OpenClaw menangani pesan masuk, sesi, antrean,
streaming, dan visibilitas penalaran.

## Alur pesan (tingkat tinggi)

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

Knob utama berada di konfigurasi:

- `messages.*` untuk prefix, antrean, dan perilaku grup.
- `agents.defaults.*` untuk default block streaming dan chunking.
- Override channel (`channels.whatsapp.*`, `channels.telegram.*`, dll.) untuk batas dan toggle streaming.

Lihat [Configuration](/id/gateway/configuration) untuk skema lengkap.

## Deduplikasi pesan masuk

Channel dapat mengirim ulang pesan yang sama setelah reconnect. OpenClaw menyimpan
cache berumur pendek yang dikunci berdasarkan channel/account/peer/session/message id sehingga pengiriman duplikat
tidak memicu run agen lain.

## Debounce pesan masuk

Pesan berurutan cepat dari **pengirim yang sama** dapat dibatch menjadi satu
giliran agen melalui `messages.inbound`. Debounce dibatasi per channel + percakapan
dan menggunakan pesan terbaru untuk threading/ID balasan.

Config (default global + override per-channel):

```json5
{
  messages: {
    inbound: {
      debounceMs: 2000,
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
        discord: 1500,
      },
    },
  },
}
```

Catatan:

- Debounce berlaku untuk pesan **hanya teks**; media/lampiran langsung flush.
- Perintah kontrol melewati debounce agar tetap berdiri sendiri — **kecuali** ketika suatu channel secara eksplisit memilih koalescing DM pengirim yang sama (misalnya [BlueBubbles `coalesceSameSenderDms`](/id/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)), di mana perintah DM menunggu di dalam jendela debounce agar payload split-send dapat bergabung dalam giliran agen yang sama.

## Sesi dan perangkat

Sesi dimiliki oleh gateway, bukan oleh klien.

- Chat langsung digabungkan ke kunci sesi utama agen.
- Grup/channel mendapatkan kunci sesi mereka sendiri.
- Penyimpanan sesi dan transkrip berada di host gateway.

Beberapa perangkat/channel dapat dipetakan ke sesi yang sama, tetapi riwayat tidak sepenuhnya
disinkronkan kembali ke setiap klien. Rekomendasi: gunakan satu perangkat utama untuk percakapan panjang
agar terhindar dari konteks yang menyimpang. UI Control dan TUI selalu menampilkan
transkrip sesi yang didukung gateway, sehingga keduanya menjadi sumber kebenaran.

Detail: [Session management](/id/concepts/session).

## Body masuk dan konteks riwayat

OpenClaw memisahkan **body prompt** dari **body perintah**:

- `Body`: teks prompt yang dikirim ke agen. Ini dapat menyertakan envelope channel dan
  wrapper riwayat opsional.
- `CommandBody`: teks pengguna mentah untuk parsing directive/perintah.
- `RawBody`: alias legacy untuk `CommandBody` (dipertahankan demi kompatibilitas).

Saat suatu channel menyediakan riwayat, channel tersebut menggunakan wrapper bersama:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Untuk **chat non-langsung** (grup/channel/room), **body pesan saat ini** diberi prefiks dengan
label pengirim (gaya yang sama yang digunakan untuk entri riwayat). Ini menjaga pesan real-time dan yang diantrikan/riwayat
tetap konsisten dalam prompt agen.

Buffer riwayat bersifat **pending-only**: buffer ini mencakup pesan grup yang _tidak_
memicu run (misalnya, pesan yang dibatasi mention) dan **tidak menyertakan** pesan
yang sudah ada dalam transkrip sesi.

Penghapusan directive hanya berlaku pada bagian **pesan saat ini** sehingga riwayat
tetap utuh. Channel yang membungkus riwayat harus menyetel `CommandBody` (atau
`RawBody`) ke teks pesan asli dan menjaga `Body` sebagai prompt gabungan.
Buffer riwayat dapat dikonfigurasi melalui `messages.groupChat.historyLimit` (default
global) dan override per-channel seperti `channels.slack.historyLimit` atau
`channels.telegram.accounts.<id>.historyLimit` (setel `0` untuk menonaktifkan).

## Antrean dan followup

Jika sebuah run sudah aktif, pesan masuk dapat diantrikan, diarahkan ke
run saat ini, atau dikumpulkan untuk giliran followup.

- Konfigurasikan melalui `messages.queue` (dan `messages.queue.byChannel`).
- Mode: `interrupt`, `steer`, `followup`, `collect`, plus varian backlog.

Detail: [Queueing](/id/concepts/queue).

## Streaming, chunking, dan batching

Block streaming mengirim balasan parsial saat model menghasilkan blok teks.
Chunking mematuhi batas teks channel dan menghindari pemisahan kode berpagar.

Pengaturan utama:

- `agents.defaults.blockStreamingDefault` (`on|off`, default off)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (batching berbasis idle)
- `agents.defaults.humanDelay` (jeda mirip manusia antarbalasan blok)
- Override channel: `*.blockStreaming` dan `*.blockStreamingCoalesce` (channel non-Telegram memerlukan `*.blockStreaming: true` yang eksplisit)

Detail: [Streaming + chunking](/id/concepts/streaming).

## Visibilitas penalaran dan token

OpenClaw dapat menampilkan atau menyembunyikan penalaran model:

- `/reasoning on|off|stream` mengontrol visibilitas.
- Konten penalaran tetap dihitung terhadap penggunaan token saat dihasilkan oleh model.
- Telegram mendukung stream penalaran ke bubble draf.

Detail: [Thinking + reasoning directives](/id/tools/thinking) dan [Token use](/id/reference/token-use).

## Prefix, threading, dan balasan

Pemformatan pesan keluar dipusatkan di `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix`, dan `channels.<channel>.accounts.<id>.responsePrefix` (cascade prefix keluar), plus `channels.whatsapp.messagePrefix` (prefix masuk WhatsApp)
- Threading balasan melalui `replyToMode` dan default per-channel

Detail: [Configuration](/id/gateway/config-agents#messages) dan dokumentasi channel.

## Balasan senyap

Token senyap persis `NO_REPLY` / `no_reply` berarti “jangan kirim balasan yang terlihat oleh pengguna”.
OpenClaw meresolusikan perilaku itu berdasarkan jenis percakapan:

- Percakapan langsung tidak mengizinkan senyap secara default dan menulis ulang balasan senyap polos
  menjadi fallback terlihat yang singkat.
- Grup/channel mengizinkan senyap secara default.
- Orkestrasi internal mengizinkan senyap secara default.

Default berada di bawah `agents.defaults.silentReply` dan
`agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` dan
`surfaces.<id>.silentReplyRewrite` dapat mengoverridenya per surface.

Saat sesi induk memiliki satu atau lebih run subagen yang dipicu tertunda, balasan
senyap polos dibuang di semua surface alih-alih ditulis ulang, sehingga
induk tetap diam sampai event penyelesaian child mengirim balasan sebenarnya.

## Terkait

- [Streaming](/id/concepts/streaming) — pengiriman pesan real-time
- [Retry](/id/concepts/retry) — perilaku retry pengiriman pesan
- [Queue](/id/concepts/queue) — antrean pemrosesan pesan
- [Channels](/id/channels) — integrasi platform pesan
