---
read_when:
    - Mengubah eksekusi atau konkurensi balasan otomatis
summary: Desain antrean perintah yang menserialkan proses balasan otomatis masuk
title: Antrean perintah
x-i18n:
    generated_at: "2026-04-24T09:05:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: aa442e9aa2f0d6d95770d43e987d19ce8d9343450b302ee448e1fa4ab3feeb15
    source_path: concepts/queue.md
    workflow: 15
---

# Antrean Perintah (2026-01-16)

Kami menserialkan proses balasan otomatis masuk (semua channel) melalui antrean kecil dalam proses untuk mencegah beberapa proses agen saling bertabrakan, sambil tetap memungkinkan paralelisme yang aman di berbagai sesi.

## Mengapa

- Proses balasan otomatis bisa mahal (pemanggilan LLM) dan dapat bertabrakan saat beberapa pesan masuk tiba dalam waktu berdekatan.
- Serialisasi menghindari persaingan atas sumber daya bersama (file sesi, log, stdin CLI) dan mengurangi kemungkinan terkena rate limit upstream.

## Cara kerjanya

- Antrean FIFO yang sadar lane menguras setiap lane dengan batas konkurensi yang dapat dikonfigurasi (default 1 untuk lane yang tidak dikonfigurasi; `main` default ke 4, `subagent` ke 8).
- `runEmbeddedPiAgent` melakukan enqueue berdasarkan **session key** (lane `session:<key>`) untuk menjamin hanya ada satu proses aktif per sesi.
- Setiap proses sesi kemudian diantrikan ke **lane global** (`main` secara default) sehingga paralelisme keseluruhan dibatasi oleh `agents.defaults.maxConcurrent`.
- Saat logging verbose diaktifkan, proses yang diantrikan mengeluarkan notifikasi singkat jika menunggu lebih dari ~2 detik sebelum mulai.
- Indikator mengetik tetap aktif segera saat enqueue (jika didukung oleh channel) sehingga pengalaman pengguna tidak berubah saat menunggu giliran.

## Mode antrean (per channel)

Pesan masuk dapat mengarahkan proses saat ini, menunggu giliran tindak lanjut, atau keduanya:

- `steer`: suntikkan segera ke proses saat ini (membatalkan pemanggilan tool yang tertunda setelah batas tool berikutnya). Jika tidak streaming, fallback ke followup.
- `followup`: antrekan untuk giliran agen berikutnya setelah proses saat ini berakhir.
- `collect`: gabungkan semua pesan yang diantrikan menjadi **satu** giliran followup (default). Jika pesan menargetkan channel/thread yang berbeda, pesan akan dikuras satu per satu untuk mempertahankan routing.
- `steer-backlog` (alias `steer+backlog`): arahkan sekarang **dan** pertahankan pesan untuk giliran followup.
- `interrupt` (lama): batalkan proses aktif untuk sesi tersebut, lalu jalankan pesan terbaru.
- `queue` (alias lama): sama dengan `steer`.

Steer-backlog berarti Anda bisa mendapatkan respons tindak lanjut setelah proses yang diarahkan, jadi
surface streaming bisa terlihat seperti duplikat. Gunakan `collect`/`steer` jika Anda ingin
satu respons per pesan masuk.
Kirim `/queue collect` sebagai perintah mandiri (per sesi) atau setel `messages.queue.byChannel.discord: "collect"`.

Default (saat tidak disetel di konfigurasi):

- Semua surface → `collect`

Konfigurasikan secara global atau per channel melalui `messages.queue`:

```json5
{
  messages: {
    queue: {
      mode: "collect",
      debounceMs: 1000,
      cap: 20,
      drop: "summarize",
      byChannel: { discord: "collect" },
    },
  },
}
```

## Opsi antrean

Opsi berlaku untuk `followup`, `collect`, dan `steer-backlog` (dan untuk `steer` saat fallback ke followup):

- `debounceMs`: tunggu sampai sunyi sebelum memulai giliran followup (mencegah “continue, continue”).
- `cap`: jumlah maksimum pesan yang diantrikan per sesi.
- `drop`: kebijakan overflow (`old`, `new`, `summarize`).

Summarize mempertahankan daftar poin singkat dari pesan yang dibuang dan menyuntikkannya sebagai prompt followup sintetis.
Default: `debounceMs: 1000`, `cap: 20`, `drop: summarize`.

## Override per sesi

- Kirim `/queue <mode>` sebagai perintah mandiri untuk menyimpan mode bagi sesi saat ini.
- Opsi dapat digabungkan: `/queue collect debounce:2s cap:25 drop:summarize`
- `/queue default` atau `/queue reset` menghapus override sesi.

## Cakupan dan jaminan

- Berlaku untuk proses agen balasan otomatis di semua channel masuk yang menggunakan pipeline balasan gateway (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat, dll.).
- Lane default (`main`) berlaku untuk seluruh proses bagi pesan masuk + Heartbeat utama; setel `agents.defaults.maxConcurrent` untuk mengizinkan beberapa sesi berjalan paralel.
- Lane tambahan dapat ada (misalnya `cron`, `subagent`) sehingga tugas latar belakang dapat berjalan paralel tanpa memblokir balasan masuk. Proses terlepas ini dilacak sebagai [tugas latar belakang](/id/automation/tasks).
- Lane per sesi menjamin bahwa hanya satu proses agen yang menyentuh sesi tertentu pada satu waktu.
- Tanpa dependensi eksternal atau worker thread latar belakang; murni TypeScript + promise.

## Pemecahan masalah

- Jika perintah tampak macet, aktifkan log verbose dan cari baris “queued for …ms” untuk memastikan antrean sedang dikuras.
- Jika Anda memerlukan kedalaman antrean, aktifkan log verbose dan perhatikan baris waktu antrean.

## Terkait

- [Pengelolaan sesi](/id/concepts/session)
- [Kebijakan retry](/id/concepts/retry)
