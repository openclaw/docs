---
read_when:
    - Menjelaskan bagaimana pesan masuk menjadi balasan
    - Mengklarifikasi sesi, mode antrean, atau perilaku streaming
    - Mendokumentasikan visibilitas reasoning dan implikasi penggunaannya
summary: Alur pesan, sesi, antrean, dan visibilitas reasoning
title: Pesan
x-i18n:
    generated_at: "2026-04-26T11:27:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7b77d344ed0cab80566582f43127c91ec987e892eeed788aeb9988b377a96e06
    source_path: concepts/messages.md
    workflow: 15
---

Halaman ini menghubungkan cara OpenClaw menangani pesan masuk, sesi, antrean,
streaming, dan visibilitas reasoning.

## Alur pesan (tingkat tinggi)

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

Kontrol utama ada dalam konfigurasi:

- `messages.*` untuk prefiks, antrean, dan perilaku grup.
- `agents.defaults.*` untuk default block streaming dan chunking.
- Override saluran (`channels.whatsapp.*`, `channels.telegram.*`, dll.) untuk batas dan toggle streaming.

Lihat [Konfigurasi](/id/gateway/configuration) untuk skema lengkap.

## Dedupe masuk

Saluran dapat mengirim ulang pesan yang sama setelah reconnect. OpenClaw menyimpan
cache berumur pendek yang di-key berdasarkan channel/account/peer/session/message id agar pengiriman
duplikat tidak memicu eksekusi agen lain.

## Debouncing masuk

Pesan cepat berurutan dari **pengirim yang sama** dapat dibatch menjadi satu
giliran agen melalui `messages.inbound`. Debouncing dicakup per channel + conversation
dan menggunakan pesan terbaru untuk threading/ID balasan.

Konfigurasi (default global + override per-saluran):

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
  }
}
```

Catatan:

- Debounce berlaku untuk pesan **hanya teks**; media/lampiran langsung flush.
- Perintah kontrol melewati debouncing agar tetap berdiri sendiri — **kecuali** ketika sebuah saluran secara eksplisit mengaktifkan coalescing DM pengirim yang sama (mis. [BlueBubbles `coalesceSameSenderDms`](/id/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)), di mana perintah DM menunggu di dalam jendela debounce agar payload split-send dapat bergabung ke giliran agen yang sama.

## Sesi dan perangkat

Sesi dimiliki oleh gateway, bukan oleh klien.

- Obrolan langsung digabung ke key sesi utama agen.
- Grup/saluran mendapatkan key sesi masing-masing.
- Penyimpanan sesi dan transkrip berada di host gateway.

Beberapa perangkat/saluran dapat dipetakan ke sesi yang sama, tetapi riwayat tidak sepenuhnya
disinkronkan kembali ke setiap klien. Rekomendasi: gunakan satu perangkat utama untuk
percakapan panjang agar tidak terjadi divergensi konteks. UI Kontrol dan TUI selalu menampilkan
transkrip sesi yang didukung gateway, jadi keduanya adalah sumber kebenaran.

Detail: [Manajemen sesi](/id/concepts/session).

## Metadata hasil tool

`content` hasil tool adalah hasil yang terlihat oleh model. `details` hasil tool adalah
metadata runtime untuk rendering UI, diagnostik, pengiriman media, dan Plugin.

OpenClaw menjaga batas ini tetap eksplisit:

- `toolResult.details` dihapus sebelum replay provider dan input Compaction.
- Transkrip sesi yang disimpan hanya menyimpan `details` yang dibatasi; metadata yang terlalu besar
  diganti dengan ringkasan ringkas yang ditandai `persistedDetailsTruncated: true`.
- Plugin dan tool harus menempatkan teks yang harus dibaca model di `content`, bukan hanya
  di `details`.

## Body masuk dan konteks riwayat

OpenClaw memisahkan **body prompt** dari **body perintah**:

- `Body`: teks prompt yang dikirim ke agen. Ini dapat mencakup envelope saluran dan
  wrapper riwayat opsional.
- `CommandBody`: teks pengguna mentah untuk parsing directive/perintah.
- `RawBody`: alias lama untuk `CommandBody` (dipertahankan demi kompatibilitas).

Saat sebuah saluran menyediakan riwayat, saluran itu menggunakan wrapper bersama:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Untuk **obrolan non-langsung** (grup/saluran/room), **body pesan saat ini** diberi prefiks dengan
label pengirim (gaya yang sama yang digunakan untuk entri riwayat). Ini menjaga konsistensi antara
pesan real-time dan pesan antrean/riwayat dalam prompt agen.

Buffer riwayat bersifat **pending-only**: buffer ini mencakup pesan grup yang _tidak_
memicu eksekusi (misalnya, pesan yang dibatasi mention) dan **mengecualikan** pesan
yang sudah ada di transkrip sesi.

Directive stripping hanya berlaku pada bagian **pesan saat ini** sehingga riwayat
tetap utuh. Saluran yang membungkus riwayat harus menetapkan `CommandBody` (atau
`RawBody`) ke teks pesan asli dan mempertahankan `Body` sebagai prompt gabungan.
Buffer riwayat dapat dikonfigurasi melalui `messages.groupChat.historyLimit` (default
global) dan override per-saluran seperti `channels.slack.historyLimit` atau
`channels.telegram.accounts.<id>.historyLimit` (set `0` untuk menonaktifkan).

## Antrean dan followup

Jika sebuah eksekusi sudah aktif, pesan masuk dapat diantrikan, diarahkan ke
eksekusi saat ini, atau dikumpulkan untuk giliran followup.

- Konfigurasikan melalui `messages.queue` (dan `messages.queue.byChannel`).
- Mode: `interrupt`, `steer`, `followup`, `collect`, plus varian backlog.

Detail: [Antrean](/id/concepts/queue).

## Streaming, chunking, dan batching

Block streaming mengirim balasan parsial saat model menghasilkan blok teks.
Chunking menghormati batas teks saluran dan menghindari pemecahan fenced code.

Pengaturan utama:

- `agents.defaults.blockStreamingDefault` (`on|off`, default off)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (batching berbasis idle)
- `agents.defaults.humanDelay` (jeda seperti manusia di antara balasan blok)
- Override saluran: `*.blockStreaming` dan `*.blockStreamingCoalesce` (saluran non-Telegram memerlukan `*.blockStreaming: true` secara eksplisit)

Detail: [Streaming + chunking](/id/concepts/streaming).

## Visibilitas reasoning dan token

OpenClaw dapat mengekspos atau menyembunyikan reasoning model:

- `/reasoning on|off|stream` mengontrol visibilitas.
- Konten reasoning tetap dihitung terhadap penggunaan token saat dihasilkan oleh model.
- Telegram mendukung streaming reasoning ke dalam draft bubble.

Detail: [Directive thinking + reasoning](/id/tools/thinking) dan [Penggunaan token](/id/reference/token-use).

## Prefiks, threading, dan balasan

Pemformatan pesan keluar dipusatkan di `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix`, dan `channels.<channel>.accounts.<id>.responsePrefix` (cascade prefiks keluar), plus `channels.whatsapp.messagePrefix` (prefiks masuk WhatsApp)
- Reply threading melalui `replyToMode` dan default per-saluran

Detail: [Konfigurasi](/id/gateway/config-agents#messages) dan dokumen saluran.

## Balasan senyap

Token senyap persis `NO_REPLY` / `no_reply` berarti “jangan kirim balasan yang terlihat oleh pengguna”.
Saat sebuah giliran juga memiliki media tool yang tertunda, seperti audio TTS yang dihasilkan, OpenClaw
menghapus teks senyap tetapi tetap mengirim lampiran medianya.
OpenClaw me-resolve perilaku itu berdasarkan jenis percakapan:

- Percakapan langsung tidak mengizinkan senyap secara default dan menulis ulang balasan
  senyap polos menjadi fallback pendek yang terlihat.
- Grup/saluran mengizinkan senyap secara default.
- Orkestrasi internal mengizinkan senyap secara default.

OpenClaw juga menggunakan balasan senyap untuk kegagalan runner internal yang terjadi
sebelum ada balasan asisten dalam obrolan non-langsung, sehingga grup/saluran tidak melihat
boilerplate error gateway. Obrolan langsung menampilkan salinan kegagalan ringkas secara default;
detail runner mentah hanya ditampilkan saat `/verbose` bernilai `on` atau `full`.

Default ada di bawah `agents.defaults.silentReply` dan
`agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` dan
`surfaces.<id>.silentReplyRewrite` dapat meng-override per surface.

Saat sesi induk memiliki satu atau lebih eksekusi subagen yang di-spawn dan masih tertunda, balasan
senyap polos dibuang di semua surface alih-alih ditulis ulang, sehingga induk tetap diam sampai
event penyelesaian anak mengirim balasan sebenarnya.

## Terkait

- [Streaming](/id/concepts/streaming) — pengiriman pesan real-time
- [Retry](/id/concepts/retry) — perilaku retry pengiriman pesan
- [Antrean](/id/concepts/queue) — antrean pemrosesan pesan
- [Saluran](/id/channels) — integrasi platform pesan
