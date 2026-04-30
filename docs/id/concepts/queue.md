---
read_when:
    - Mengubah eksekusi atau konkurensi balasan otomatis
    - Menjelaskan mode /queue atau perilaku pengarahan pesan
summary: Mode antrean balasan otomatis, nilai default, dan penggantian per sesi
title: Antrean perintah
x-i18n:
    generated_at: "2026-04-30T18:38:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: fbf1bb1ffd4ce06fa138f63e31651b8821226d9c95dd6b93d68326a5fb91fdd0
    source_path: concepts/queue.md
    workflow: 16
---

Kami menserialkan run balasan otomatis masuk (semua kanal) melalui antrean kecil dalam proses untuk mencegah beberapa run agent bertabrakan, sambil tetap memungkinkan paralelisme aman lintas sesi.

## Mengapa

- Run balasan otomatis bisa mahal (panggilan LLM) dan bisa bertabrakan ketika beberapa pesan masuk tiba berdekatan.
- Serialisasi menghindari persaingan untuk sumber daya bersama (file sesi, log, stdin CLI) dan mengurangi kemungkinan batas laju upstream.

## Cara kerjanya

- Antrean FIFO yang sadar lane mengosongkan setiap lane dengan batas konkurensi yang dapat dikonfigurasi (default 1 untuk lane yang tidak dikonfigurasi; main default ke 4, subagent ke 8).
- `runEmbeddedPiAgent` mengantre berdasarkan **kunci sesi** (lane `session:<key>`) untuk menjamin hanya ada satu run aktif per sesi.
- Setiap run sesi kemudian diantrekan ke **lane global** (`main` secara default) sehingga paralelisme keseluruhan dibatasi oleh `agents.defaults.maxConcurrent`.
- Ketika logging verbose diaktifkan, run yang mengantre memancarkan pemberitahuan singkat jika menunggu lebih dari ~2 detik sebelum mulai.
- Indikator mengetik tetap menyala segera saat masuk antrean (ketika didukung oleh kanal) sehingga pengalaman pengguna tidak berubah saat kita menunggu giliran.

## Default

Ketika tidak diatur, semua surface kanal masuk menggunakan:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

`steer` adalah default karena menjaga giliran model aktif tetap responsif tanpa
memulai run sesi kedua. Mode ini mengosongkan semua pesan pengarahan yang tiba
sebelum batas model berikutnya. Jika run saat ini tidak dapat menerima pengarahan,
OpenClaw kembali ke entri antrean followup.

## Mode antrean

Pesan masuk dapat mengarahkan run saat ini, menunggu giliran followup, atau melakukan keduanya:

- `steer`: antrekan pesan pengarahan ke runtime aktif. Pi mengirim semua pesan pengarahan tertunda **setelah giliran asisten saat ini selesai menjalankan panggilan tool-nya**, sebelum panggilan LLM berikutnya; Codex app-server menerima satu `turn/steer` yang dibatch. Jika run tidak aktif streaming atau pengarahan tidak tersedia, OpenClaw kembali ke entri antrean followup.
- `queue` (lama): pengarahan lama satu per satu. Pi mengirim satu pesan pengarahan yang diantrekan pada setiap batas model; Codex app-server menerima permintaan `turn/steer` terpisah. Lebih pilih `steer` kecuali Anda memerlukan perilaku terserialisasi sebelumnya.
- `followup`: antrekan setiap pesan untuk giliran agent berikutnya setelah run saat ini berakhir.
- `collect`: gabungkan pesan yang diantrekan menjadi giliran followup **tunggal** setelah jendela hening. Jika pesan menargetkan kanal/thread berbeda, pesan dikosongkan satu per satu untuk mempertahankan routing.
- `steer-backlog` (alias `steer+backlog`): arahkan sekarang **dan** pertahankan pesan yang sama untuk giliran followup.
- `interrupt` (lama): batalkan run aktif untuk sesi tersebut, lalu jalankan pesan terbaru.

Steer-backlog berarti Anda bisa mendapatkan respons followup setelah run yang diarahkan, sehingga
surface streaming dapat terlihat seperti duplikat. Lebih pilih `collect`/`steer` jika Anda menginginkan
satu respons per pesan masuk.

Untuk timing spesifik runtime dan perilaku dependensi, lihat
[Antrean pengarahan](/id/concepts/queue-steering).

Konfigurasikan secara global atau per kanal melalui `messages.queue`:

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

Opsi berlaku untuk `followup`, `collect`, dan `steer-backlog` (serta untuk `steer` atau `queue` lama ketika pengarahan kembali ke followup):

- `debounceMs`: jendela hening sebelum mengosongkan followup yang diantrekan. Angka polos adalah milidetik; satuan `ms`, `s`, `m`, `h`, dan `d` diterima oleh opsi `/queue`.
- `cap`: jumlah maksimum pesan yang diantrekan per sesi. Nilai di bawah `1` diabaikan.
- `drop: "summarize"`: default. Jatuhkan entri antrean tertua sesuai kebutuhan, simpan ringkasan padat, dan sisipkan sebagai prompt followup sintetis.
- `drop: "old"`: jatuhkan entri antrean tertua sesuai kebutuhan, tanpa mempertahankan ringkasan.
- `drop: "new"`: tolak pesan terbaru ketika antrean sudah penuh.

Default: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Presedensi

Untuk pemilihan mode, OpenClaw menyelesaikan:

1. Override `/queue` per sesi inline atau tersimpan.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. Default `steer`.

Untuk opsi, opsi `/queue` inline atau tersimpan menang atas konfigurasi. Lalu
debounce khusus kanal (`messages.queue.debounceMsByChannel`), default debounce
Plugin, opsi global `messages.queue`, dan default bawaan diterapkan. `cap` dan
`drop` adalah opsi global/sesi, bukan kunci konfigurasi per kanal.

## Override per sesi

- Kirim `/queue <mode>` sebagai perintah mandiri untuk menyimpan mode bagi sesi saat ini.
- Opsi dapat digabungkan: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` atau `/queue reset` menghapus override sesi.

## Cakupan dan jaminan

- Berlaku untuk run agent balasan otomatis di semua kanal masuk yang menggunakan pipeline balasan Gateway (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat, dll.).
- Lane default (`main`) berlaku di seluruh proses untuk inbound + Heartbeat utama; atur `agents.defaults.maxConcurrent` untuk mengizinkan beberapa sesi berjalan paralel.
- Lane tambahan mungkin ada (mis. `cron`, `cron-nested`, `nested`, `subagent`) sehingga pekerjaan latar belakang dapat berjalan paralel tanpa memblokir balasan masuk. Giliran agent Cron terisolasi memegang slot `cron` sementara eksekusi agent bagian dalamnya menggunakan `cron-nested`; keduanya menggunakan `cron.maxConcurrentRuns`. Alur `nested` non-cron bersama mempertahankan perilaku lane masing-masing. Run terlepas ini dilacak sebagai [tugas latar belakang](/id/automation/tasks).
- Lane per sesi menjamin bahwa hanya satu run agent menyentuh sesi tertentu pada satu waktu.
- Tanpa dependensi eksternal atau thread worker latar belakang; TypeScript murni + promise.

## Pemecahan masalah

- Jika perintah tampak macet, aktifkan log verbose dan cari baris “queued for …ms” untuk memastikan antrean sedang dikosongkan.
- Jika Anda memerlukan kedalaman antrean, aktifkan log verbose dan pantau baris timing antrean.
- Run Codex app-server yang menerima sebuah giliran lalu berhenti memancarkan progres diinterupsi oleh adapter Codex sehingga lane sesi aktif dapat dilepas alih-alih menunggu timeout run luar.
- Ketika diagnostik diaktifkan, sesi yang tetap berada dalam `processing` melewati `diagnostics.stuckSessionWarnMs` mencatat peringatan sesi macet. Run embedded aktif, operasi balasan aktif, dan tugas lane aktif tetap hanya berupa peringatan secara default; bookkeeping startup yang stale tanpa pekerjaan sesi aktif dapat melepas lane sesi yang terpengaruh sehingga pekerjaan yang diantrekan dapat dikosongkan.

## Terkait

- [Manajemen sesi](/id/concepts/session)
- [Antrean pengarahan](/id/concepts/queue-steering)
- [Kebijakan retry](/id/concepts/retry)
