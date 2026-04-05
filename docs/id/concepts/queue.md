---
read_when:
    - Mengubah eksekusi balas otomatis atau konkurensi
summary: Desain antrean perintah yang menserialisasi eksekusi balas otomatis masuk
title: Antrean Perintah
x-i18n:
    generated_at: "2026-04-05T13:52:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 36e1d004e9a2c21ad1470517a249285216114dd4cf876681cc860e992c73914f
    source_path: concepts/queue.md
    workflow: 15
---

# Antrean Perintah (2026-01-16)

Kami menserialisasi eksekusi balas otomatis masuk (semua kanal) melalui antrean kecil dalam proses untuk mencegah beberapa eksekusi agen saling bertabrakan, sambil tetap memungkinkan paralelisme yang aman di seluruh sesi.

## Mengapa

- Eksekusi balas otomatis bisa mahal (panggilan LLM) dan dapat bertabrakan ketika beberapa pesan masuk tiba dalam waktu berdekatan.
- Serialisasi menghindari persaingan atas sumber daya bersama (file sesi, log, stdin CLI) dan mengurangi kemungkinan terkena rate limit dari upstream.

## Cara kerjanya

- Antrean FIFO yang sadar jalur menguras setiap jalur dengan batas konkurensi yang dapat dikonfigurasi (default 1 untuk jalur yang tidak dikonfigurasi; `main` default 4, `subagent` 8).
- `runEmbeddedPiAgent` memasukkan ke antrean berdasarkan **kunci sesi** (jalur `session:<key>`) untuk menjamin hanya satu eksekusi aktif per sesi.
- Setiap eksekusi sesi kemudian dimasukkan ke antrean ke **jalur global** (`main` secara default) sehingga paralelisme keseluruhan dibatasi oleh `agents.defaults.maxConcurrent`.
- Saat logging verbose diaktifkan, eksekusi yang masuk antrean memancarkan pemberitahuan singkat jika menunggu lebih dari ~2 detik sebelum dimulai.
- Indikator mengetik tetap dipicu segera saat dimasukkan ke antrean (bila didukung oleh kanal) sehingga pengalaman pengguna tidak berubah saat menunggu giliran.

## Mode antrean (per kanal)

Pesan masuk dapat mengarahkan eksekusi saat ini, menunggu giliran tindak lanjut, atau melakukan keduanya:

- `steer`: suntikkan segera ke eksekusi saat ini (membatalkan panggilan tool yang tertunda setelah batas tool berikutnya). Jika tidak sedang streaming, kembali ke followup.
- `followup`: masukkan ke antrean untuk giliran agen berikutnya setelah eksekusi saat ini berakhir.
- `collect`: gabungkan semua pesan yang masuk antrean menjadi **satu** giliran followup (default). Jika pesan menargetkan kanal/thread yang berbeda, pesan dikuras secara terpisah untuk mempertahankan routing.
- `steer-backlog` (alias `steer+backlog`): steer sekarang **dan** simpan pesan untuk giliran followup.
- `interrupt` (lama): batalkan eksekusi aktif untuk sesi tersebut, lalu jalankan pesan terbaru.
- `queue` (alias lama): sama dengan `steer`.

Steer-backlog berarti Anda bisa mendapatkan respons followup setelah eksekusi yang di-steer, sehingga
permukaan streaming bisa terlihat seperti duplikat. Pilih `collect`/`steer` jika Anda ingin
satu respons per pesan masuk.
Kirim `/queue collect` sebagai perintah mandiri (per sesi) atau setel `messages.queue.byChannel.discord: "collect"`.

Default (saat tidak disetel di config):

- Semua permukaan → `collect`

Konfigurasikan secara global atau per kanal melalui `messages.queue`:

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

Opsi berlaku untuk `followup`, `collect`, dan `steer-backlog` (serta untuk `steer` saat kembali ke followup):

- `debounceMs`: tunggu hingga hening sebelum memulai giliran followup (mencegah “lanjutkan, lanjutkan”).
- `cap`: jumlah maksimum pesan yang masuk antrean per sesi.
- `drop`: kebijakan overflow (`old`, `new`, `summarize`).

Summarize menyimpan daftar bullet singkat dari pesan yang dibuang dan menyuntikkannya sebagai prompt followup sintetis.
Default: `debounceMs: 1000`, `cap: 20`, `drop: summarize`.

## Override per sesi

- Kirim `/queue <mode>` sebagai perintah mandiri untuk menyimpan mode bagi sesi saat ini.
- Opsi dapat digabungkan: `/queue collect debounce:2s cap:25 drop:summarize`
- `/queue default` atau `/queue reset` menghapus override sesi.

## Cakupan dan jaminan

- Berlaku untuk eksekusi agen balas otomatis di seluruh kanal masuk yang menggunakan pipeline balasan gateway (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat, dll.).
- Jalur default (`main`) berlaku untuk seluruh proses bagi lalu lintas masuk + heartbeat utama; setel `agents.defaults.maxConcurrent` untuk mengizinkan beberapa sesi berjalan paralel.
- Jalur tambahan dapat ada (misalnya `cron`, `subagent`) sehingga pekerjaan latar belakang dapat berjalan paralel tanpa memblokir balasan masuk. Eksekusi terlepas ini dilacak sebagai [tugas latar belakang](/id/automation/tasks).
- Jalur per sesi menjamin bahwa hanya satu eksekusi agen yang menyentuh sesi tertentu pada satu waktu.
- Tidak ada dependensi eksternal atau thread worker latar belakang; murni TypeScript + promise.

## Pemecahan masalah

- Jika perintah tampak macet, aktifkan log verbose dan cari baris “queued for …ms” untuk memastikan antrean sedang dikuras.
- Jika Anda memerlukan kedalaman antrean, aktifkan log verbose dan perhatikan baris waktu antrean.
