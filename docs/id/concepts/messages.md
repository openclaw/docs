---
read_when:
    - Menjelaskan bagaimana pesan masuk menjadi balasan
    - Menjelaskan sesi, mode antrean, atau perilaku streaming
    - Mendokumentasikan visibilitas reasoning dan implikasi penggunaan
summary: Alur pesan, sesi, antrean, dan visibilitas reasoning
title: Pesan
x-i18n:
    generated_at: "2026-04-05T13:51:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 475f892bd534fdb10a2ee5d3c57a3d4a7fb8e1ab68d695189ba186004713f6f3
    source_path: concepts/messages.md
    workflow: 15
---

# Pesan

Halaman ini menyatukan cara OpenClaw menangani pesan masuk, sesi, antrean,
streaming, dan visibilitas reasoning.

## Alur pesan (tingkat tinggi)

```
Pesan masuk
  -> routing/bindings -> kunci sesi
  -> antrean (jika ada run yang aktif)
  -> run agen (streaming + alat)
  -> balasan keluar (batas channel + chunking)
```

Kontrol utama ada di konfigurasi:

- `messages.*` untuk prefiks, antrean, dan perilaku grup.
- `agents.defaults.*` untuk default block streaming dan chunking.
- Override channel (`channels.whatsapp.*`, `channels.telegram.*`, dll.) untuk batas dan toggle streaming.

Lihat [Konfigurasi](/gateway/configuration) untuk skema lengkap.

## Deduplikasi pesan masuk

Channel dapat mengirim ulang pesan yang sama setelah reconnect. OpenClaw menyimpan
cache berumur pendek yang dikunci berdasarkan channel/account/peer/session/message id sehingga pengiriman
duplikat tidak memicu run agen lain.

## Debouncing pesan masuk

Pesan cepat yang berurutan dari **pengirim yang sama** dapat digabungkan menjadi satu
giliran agen melalui `messages.inbound`. Debouncing dicakup per channel + percakapan
dan menggunakan pesan terbaru untuk threading/ID balasan.

Konfigurasi (default global + override per channel):

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

- Debounce berlaku untuk pesan **teks saja**; media/lampiran langsung di-flush.
- Perintah control melewati debouncing agar tetap mandiri.

## Sesi dan perangkat

Sesi dimiliki oleh gateway, bukan oleh klien.

- Chat langsung digabungkan ke kunci sesi utama agen.
- Grup/channel mendapatkan kunci sesinya sendiri.
- Session store dan transkrip berada di host gateway.

Beberapa perangkat/channel dapat dipetakan ke sesi yang sama, tetapi riwayat tidak sepenuhnya
disinkronkan kembali ke setiap klien. Rekomendasi: gunakan satu perangkat utama untuk percakapan panjang
agar konteks tidak menyimpang. UI Control dan TUI selalu menampilkan
transkrip sesi yang didukung gateway, jadi keduanya adalah sumber kebenaran.

Detail: [Manajemen sesi](/concepts/session).

## Body pesan masuk dan konteks riwayat

OpenClaw memisahkan **body prompt** dari **body perintah**:

- `Body`: teks prompt yang dikirim ke agen. Ini dapat mencakup envelope channel dan
  wrapper riwayat opsional.
- `CommandBody`: teks pengguna mentah untuk parsing directive/perintah.
- `RawBody`: alias lama untuk `CommandBody` (dipertahankan demi kompatibilitas).

Saat sebuah channel menyediakan riwayat, channel tersebut menggunakan wrapper bersama:

- `[Pesan chat sejak balasan terakhir Anda - untuk konteks]`
- `[Pesan saat ini - balas ini]`

Untuk **chat non-langsung** (grup/channel/room), **body pesan saat ini** diawali dengan
label pengirim (gaya yang sama seperti yang digunakan untuk entri riwayat). Ini menjaga konsistensi
pesan real-time dan pesan antrean/riwayat dalam prompt agen.

Buffer riwayat bersifat **hanya pending**: buffer ini mencakup pesan grup yang _tidak_
memicu run (misalnya, pesan yang dibatasi mention) dan **tidak mencakup** pesan
yang sudah ada dalam transkrip sesi.

Penghapusan directive hanya berlaku untuk bagian **pesan saat ini** sehingga riwayat
tetap utuh. Channel yang membungkus riwayat harus menetapkan `CommandBody` (atau
`RawBody`) ke teks pesan asli dan mempertahankan `Body` sebagai prompt gabungan.
Buffer riwayat dapat dikonfigurasi melalui `messages.groupChat.historyLimit` (default global)
dan override per channel seperti `channels.slack.historyLimit` atau
`channels.telegram.accounts.<id>.historyLimit` (setel `0` untuk menonaktifkan).

## Antrean dan followup

Jika sebuah run sudah aktif, pesan masuk dapat dimasukkan ke antrean, diarahkan ke
run saat ini, atau dikumpulkan untuk giliran followup.

- Konfigurasikan melalui `messages.queue` (dan `messages.queue.byChannel`).
- Mode: `interrupt`, `steer`, `followup`, `collect`, plus varian backlog.

Detail: [Antrean](/concepts/queue).

## Streaming, chunking, dan batching

Block streaming mengirim balasan parsial saat model menghasilkan blok teks.
Chunking mengikuti batas teks channel dan menghindari pemisahan fenced code.

Pengaturan utama:

- `agents.defaults.blockStreamingDefault` (`on|off`, default off)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (batching berbasis jeda)
- `agents.defaults.humanDelay` (jeda mirip manusia di antara balasan blok)
- Override channel: `*.blockStreaming` dan `*.blockStreamingCoalesce` (channel non-Telegram memerlukan `*.blockStreaming: true` eksplisit)

Detail: [Streaming + chunking](/concepts/streaming).

## Visibilitas reasoning dan token

OpenClaw dapat menampilkan atau menyembunyikan reasoning model:

- `/reasoning on|off|stream` mengontrol visibilitas.
- Konten reasoning tetap dihitung terhadap penggunaan token saat dihasilkan oleh model.
- Telegram mendukung stream reasoning ke bubble draf.

Detail: [Directive thinking + reasoning](/tools/thinking) dan [Penggunaan token](/reference/token-use).

## Prefiks, threading, dan balasan

Pemformatan pesan keluar dipusatkan di `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix`, dan `channels.<channel>.accounts.<id>.responsePrefix` (kaskade prefiks keluar), serta `channels.whatsapp.messagePrefix` (prefiks masuk WhatsApp)
- Reply threading melalui `replyToMode` dan default per channel

Detail: [Konfigurasi](/gateway/configuration-reference#messages) dan dokumentasi channel.

## Terkait

- [Streaming](/concepts/streaming) — pengiriman pesan real-time
- [Retry](/concepts/retry) — perilaku percobaan ulang pengiriman pesan
- [Antrean](/concepts/queue) — antrean pemrosesan pesan
- [Channels](/id/channels) — integrasi platform pesan
