---
read_when:
    - Mengubah eksekusi atau konkurensi balasan otomatis
    - Menjelaskan mode /queue atau perilaku pengarahan pesan
summary: Mode antrean balasan otomatis, default, dan penggantian per sesi
title: Antrean perintah
x-i18n:
    generated_at: "2026-05-06T09:09:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f182195b740d678044a203387da6368df77ac2a6bb0eb29653bb8ea45264aaf
    source_path: concepts/queue.md
    workflow: 16
---

Kami menserialkan eksekusi balasan otomatis masuk (semua channel) melalui antrean kecil dalam proses untuk mencegah beberapa eksekusi agent saling bertabrakan, sambil tetap memungkinkan paralelisme yang aman lintas sesi.

## Mengapa

- Eksekusi balasan otomatis bisa mahal (panggilan LLM) dan dapat bertabrakan ketika beberapa pesan masuk tiba berdekatan.
- Serialisasi menghindari perebutan sumber daya bersama (file sesi, log, stdin CLI) dan mengurangi kemungkinan batas laju upstream.

## Cara kerjanya

- Antrean FIFO sadar-lane menguras setiap lane dengan batas konkurensi yang dapat dikonfigurasi (default 1 untuk lane yang tidak dikonfigurasi; main default ke 4, subagent ke 8).
- `runEmbeddedPiAgent` mengantre berdasarkan **kunci sesi** (lane `session:<key>`) untuk menjamin hanya ada satu eksekusi aktif per sesi.
- Setiap eksekusi sesi kemudian diantrekan ke **lane global** (`main` secara default) sehingga paralelisme keseluruhan dibatasi oleh `agents.defaults.maxConcurrent`.
- Ketika logging verbose diaktifkan, eksekusi yang mengantre memancarkan pemberitahuan singkat jika menunggu lebih dari ~2 detik sebelum dimulai.
- Indikator mengetik tetap langsung menyala saat masuk antrean (jika didukung oleh channel) sehingga pengalaman pengguna tidak berubah saat kita menunggu giliran.

## Default

Saat tidak disetel, semua permukaan channel masuk menggunakan:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

`steer` adalah default karena menjaga giliran model aktif tetap responsif tanpa
memulai eksekusi sesi kedua. Ini menguras semua pesan steering yang tiba
sebelum batas model berikutnya. Jika eksekusi saat ini tidak dapat menerima steering,
OpenClaw kembali ke entri antrean followup.

## Mode antrean

Pesan masuk dapat men-steer eksekusi saat ini, menunggu giliran followup, atau melakukan keduanya:

- `steer`: antrekan pesan steering ke runtime aktif. Pi mengirim semua pesan steering tertunda **setelah giliran assistant saat ini selesai menjalankan panggilan tool-nya**, sebelum panggilan LLM berikutnya; app-server Codex menerima satu `turn/steer` yang dibatch. Jika eksekusi tidak aktif melakukan streaming atau steering tidak tersedia, OpenClaw kembali ke entri antrean followup.
- `queue` (lama): steering lama satu per satu. Pi mengirim satu pesan steering yang diantrekan pada setiap batas model; app-server Codex menerima permintaan `turn/steer` terpisah. Lebih pilih `steer` kecuali Anda membutuhkan perilaku serial sebelumnya.
- `followup`: antrekan setiap pesan untuk giliran agent nanti setelah eksekusi saat ini berakhir.
- `collect`: gabungkan pesan yang diantrekan menjadi **satu** giliran followup setelah jendela senyap. Jika pesan menargetkan channel/thread yang berbeda, pesan dikuras satu per satu untuk mempertahankan perutean.
- `steer-backlog` (alias `steer+backlog`): steer sekarang **dan** pertahankan pesan yang sama untuk giliran followup.
- `interrupt` (lama): batalkan eksekusi aktif untuk sesi tersebut, lalu jalankan pesan terbaru.

Steer-backlog berarti Anda bisa mendapatkan respons followup setelah eksekusi yang di-steer, sehingga
permukaan streaming dapat terlihat seperti duplikat. Lebih pilih `collect`/`steer` jika Anda menginginkan
satu respons per pesan masuk.

Untuk timing khusus runtime dan perilaku dependensi, lihat
[Antrean steering](/id/concepts/queue-steering). Untuk perintah eksplisit `/steer <message>`,
lihat [Steer](/id/tools/steer).

Konfigurasikan secara global atau per channel melalui `messages.queue`:

```json5
{
  messages: {
    queue: {
      mode: "steer",
      debounceMs: 500,
      cap: 20,
      drop: "summarize",
      byChannel: { discord: "collect" },
    },
  },
}
```

## Opsi antrean

Opsi berlaku untuk `followup`, `collect`, dan `steer-backlog` (dan untuk `steer` atau `queue` lama ketika steering kembali ke followup):

- `debounceMs`: jendela senyap sebelum menguras followup yang diantrekan. Angka polos adalah milidetik; unit `ms`, `s`, `m`, `h`, dan `d` diterima oleh opsi `/queue`.
- `cap`: jumlah maksimal pesan yang diantrekan per sesi. Nilai di bawah `1` diabaikan.
- `drop: "summarize"`: default. Hapus entri antrean paling lama sesuai kebutuhan, simpan ringkasan ringkas, dan injeksikan sebagai prompt followup sintetis.
- `drop: "old"`: hapus entri antrean paling lama sesuai kebutuhan, tanpa mempertahankan ringkasan.
- `drop: "new"`: tolak pesan terbaru ketika antrean sudah penuh.

Default: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Presedensi

Untuk pemilihan mode, OpenClaw menyelesaikan:

1. Override `/queue` inline atau tersimpan per sesi.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. Default `steer`.

Untuk opsi, opsi `/queue` inline atau tersimpan mengalahkan konfigurasi. Kemudian
debounce khusus channel (`messages.queue.debounceMsByChannel`), default debounce
Plugin, opsi global `messages.queue`, dan default bawaan diterapkan.
`cap` dan `drop` adalah opsi global/sesi, bukan kunci konfigurasi per channel.

## Override per sesi

- Kirim `/queue <mode>` sebagai perintah mandiri untuk menyimpan mode bagi sesi saat ini.
- Opsi dapat digabungkan: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` atau `/queue reset` menghapus override sesi.

## Cakupan dan jaminan

- Berlaku untuk eksekusi agent balasan otomatis di semua channel masuk yang menggunakan pipeline balasan Gateway (web WhatsApp, Telegram, Slack, Discord, Signal, iMessage, webchat, dll.).
- Lane default (`main`) berlaku di seluruh proses untuk inbound + Heartbeat utama; setel `agents.defaults.maxConcurrent` untuk mengizinkan beberapa sesi berjalan paralel.
- Lane tambahan mungkin ada (mis. `cron`, `cron-nested`, `nested`, `subagent`) sehingga pekerjaan latar belakang dapat berjalan paralel tanpa memblokir balasan masuk. Giliran agent cron terisolasi menahan slot `cron` sementara eksekusi agent dalamnya menggunakan `cron-nested`; keduanya menggunakan `cron.maxConcurrentRuns`. Alur `nested` non-cron bersama mempertahankan perilaku lane masing-masing. Eksekusi terlepas ini dilacak sebagai [tugas latar belakang](/id/automation/tasks).
- Lane per sesi menjamin hanya satu eksekusi agent yang menyentuh sesi tertentu pada satu waktu.
- Tidak ada dependensi eksternal atau thread worker latar belakang; TypeScript murni + promise.

## Pemecahan masalah

- Jika perintah tampak macet, aktifkan log verbose dan cari baris "queued for ...ms" untuk memastikan antrean sedang dikuras.
- Jika Anda membutuhkan kedalaman antrean, aktifkan log verbose dan amati baris timing antrean.
- Eksekusi app-server Codex yang menerima giliran lalu berhenti memancarkan progres diinterupsi oleh adapter Codex sehingga lane sesi aktif dapat dilepas alih-alih menunggu timeout eksekusi luar.
- Ketika diagnostik diaktifkan, sesi yang tetap berada dalam `processing` melewati `diagnostics.stuckSessionWarnMs` tanpa balasan, tool, status, blok, atau progres ACP yang teramati diklasifikasikan berdasarkan aktivitas saat ini. Pekerjaan aktif dicatat sebagai `session.long_running`; pekerjaan aktif tanpa progres terbaru dicatat sebagai `session.stalled`; `session.stuck` dicadangkan untuk pembukuan sesi basi tanpa pekerjaan aktif, dan hanya jalur itu yang dapat melepas lane sesi terdampak agar pekerjaan yang mengantre dikuras. Diagnostik `session.stuck` berulang melakukan backoff selama sesi tetap tidak berubah.

## Terkait

- [Manajemen sesi](/id/concepts/session)
- [Antrean steering](/id/concepts/queue-steering)
- [Steer](/id/tools/steer)
- [Kebijakan percobaan ulang](/id/concepts/retry)
