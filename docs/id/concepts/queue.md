---
read_when:
    - Mengubah eksekusi atau konkurensi balasan otomatis
    - Menjelaskan mode /queue atau perilaku pengarahan pesan
summary: Mode antrean balasan otomatis, nilai default, dan penggantian per sesi
title: Antrean perintah
x-i18n:
    generated_at: "2026-04-30T09:45:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ac0c0ded9558b080714fa4b8be0d552f985911bf19b427020f9654ae4955b2d
    source_path: concepts/queue.md
    workflow: 16
---

Kami menserialisasi eksekusi auto-reply masuk (semua kanal) melalui antrean kecil dalam proses untuk mencegah beberapa eksekusi agen saling bertabrakan, sambil tetap memungkinkan paralelisme yang aman di seluruh sesi.

## Mengapa

- Eksekusi auto-reply bisa mahal (panggilan LLM) dan dapat bertabrakan ketika beberapa pesan masuk tiba berdekatan.
- Serialisasi menghindari perebutan sumber daya bersama (file sesi, log, stdin CLI) dan mengurangi kemungkinan terkena batas laju upstream.

## Cara kerjanya

- Antrean FIFO yang sadar lajur mengosongkan setiap lajur dengan batas konkurensi yang dapat dikonfigurasi (default 1 untuk lajur yang tidak dikonfigurasi; main default ke 4, subagent ke 8).
- `runEmbeddedPiAgent` mengantrekan berdasarkan **kunci sesi** (lajur `session:<key>`) untuk menjamin hanya ada satu eksekusi aktif per sesi.
- Setiap eksekusi sesi kemudian diantrekan ke **lajur global** (`main` secara default) sehingga paralelisme keseluruhan dibatasi oleh `agents.defaults.maxConcurrent`.
- Ketika logging verbose diaktifkan, eksekusi yang diantrekan mengeluarkan pemberitahuan singkat jika menunggu lebih dari ~2 d sebelum mulai.
- Indikator mengetik tetap aktif segera saat masuk antrean (jika didukung oleh kanal) sehingga pengalaman pengguna tidak berubah saat kita menunggu giliran.

## Default

Jika tidak disetel, semua permukaan kanal masuk menggunakan:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

`steer` adalah default karena menjaga giliran model aktif tetap responsif tanpa
memulai eksekusi sesi kedua. Mode ini mengosongkan semua pesan pengarahan yang tiba
sebelum batas model berikutnya. Jika eksekusi saat ini tidak dapat menerima pengarahan,
OpenClaw beralih ke entri antrean tindak lanjut.

## Mode antrean

Pesan masuk dapat mengarahkan eksekusi saat ini, menunggu giliran tindak lanjut, atau melakukan keduanya:

- `steer`: antrekan pesan pengarahan ke runtime aktif. Pi mengirimkan semua pesan pengarahan tertunda **setelah giliran asisten saat ini selesai menjalankan pemanggilan tool**, sebelum panggilan LLM berikutnya; Codex app-server menerima satu `turn/steer` yang dibatch. Jika eksekusi tidak aktif melakukan streaming atau pengarahan tidak tersedia, OpenClaw beralih ke entri antrean tindak lanjut.
- `queue` (legacy): pengarahan satu per satu yang lama. Pi mengirimkan satu pesan pengarahan yang diantrekan pada setiap batas model; Codex app-server menerima permintaan `turn/steer` terpisah. Utamakan `steer` kecuali Anda memerlukan perilaku serial sebelumnya.
- `followup`: antrekan setiap pesan untuk giliran agen berikutnya setelah eksekusi saat ini berakhir.
- `collect`: gabungkan pesan yang diantrekan menjadi giliran tindak lanjut **tunggal** setelah jendela hening. Jika pesan menargetkan kanal/thread yang berbeda, pesan dikosongkan secara individual untuk mempertahankan routing.
- `steer-backlog` (alias `steer+backlog`): arahkan sekarang **dan** pertahankan pesan yang sama untuk giliran tindak lanjut.
- `interrupt` (legacy): batalkan eksekusi aktif untuk sesi tersebut, lalu jalankan pesan terbaru.

Steer-backlog berarti Anda bisa mendapatkan respons tindak lanjut setelah eksekusi yang diarahkan, sehingga
permukaan streaming dapat terlihat seperti duplikat. Utamakan `collect`/`steer` jika Anda menginginkan
satu respons per pesan masuk.

Untuk perilaku timing dan dependensi khusus runtime, lihat
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

Opsi berlaku untuk `followup`, `collect`, dan `steer-backlog` (serta untuk `steer` atau `queue` legacy ketika pengarahan beralih ke tindak lanjut):

- `debounceMs`: jendela hening sebelum mengosongkan tindak lanjut yang diantrekan. Angka polos adalah milidetik; satuan `ms`, `s`, `m`, `h`, dan `d` diterima oleh opsi `/queue`.
- `cap`: jumlah maksimum pesan yang diantrekan per sesi. Nilai di bawah `1` diabaikan.
- `drop: "summarize"`: default. Hapus entri antrean terlama sesuai kebutuhan, simpan ringkasan ringkas, dan injeksikan sebagai prompt tindak lanjut sintetis.
- `drop: "old"`: hapus entri antrean terlama sesuai kebutuhan, tanpa mempertahankan ringkasan.
- `drop: "new"`: tolak pesan terbaru ketika antrean sudah penuh.

Default: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Presedensi

Untuk pemilihan mode, OpenClaw menyelesaikan:

1. Override `/queue` inline atau tersimpan per sesi.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. Default `steer`.

Untuk opsi, opsi `/queue` inline atau tersimpan menang atas konfigurasi. Lalu
debounce khusus kanal (`messages.queue.debounceMsByChannel`), default debounce
Plugin, opsi global `messages.queue`, dan default bawaan
diterapkan. `cap` dan `drop` adalah opsi global/sesi, bukan kunci konfigurasi
per kanal.

## Override per sesi

- Kirim `/queue <mode>` sebagai perintah mandiri untuk menyimpan mode bagi sesi saat ini.
- Opsi dapat digabungkan: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` atau `/queue reset` menghapus override sesi.

## Cakupan dan jaminan

- Berlaku untuk eksekusi agen auto-reply di semua kanal masuk yang menggunakan pipeline balasan gateway (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat, dll.).
- Lajur default (`main`) berlaku di seluruh proses untuk inbound + heartbeat utama; setel `agents.defaults.maxConcurrent` untuk mengizinkan beberapa sesi berjalan paralel.
- Lajur tambahan mungkin ada (mis. `cron`, `cron-nested`, `nested`, `subagent`) sehingga job latar belakang dapat berjalan paralel tanpa memblokir balasan masuk. Giliran agen cron terisolasi menahan slot `cron` sementara eksekusi agen dalamnya menggunakan `cron-nested`; keduanya menggunakan `cron.maxConcurrentRuns`. Alur `nested` non-cron bersama mempertahankan perilaku lajurnya sendiri. Eksekusi terlepas ini dilacak sebagai [tugas latar belakang](/id/automation/tasks).
- Lajur per sesi menjamin bahwa hanya satu eksekusi agen menyentuh sesi tertentu pada satu waktu.
- Tanpa dependensi eksternal atau thread worker latar belakang; TypeScript + promise murni.

## Pemecahan masalah

- Jika perintah tampak macet, aktifkan log verbose dan cari baris “queued for …ms” untuk memastikan antrean sedang dikosongkan.
- Jika Anda memerlukan kedalaman antrean, aktifkan log verbose dan pantau baris timing antrean.
- Ketika diagnostik diaktifkan, sesi yang tetap berada di `processing` melewati `diagnostics.stuckSessionWarnMs` mencatat peringatan sesi macet. Eksekusi embedded aktif, operasi balasan aktif, dan tugas lajur aktif tetap hanya berupa peringatan secara default; pembukuan startup yang basi tanpa pekerjaan sesi aktif dapat melepas lajur sesi terdampak sehingga pekerjaan yang diantrekan dikosongkan.

## Terkait

- [Manajemen sesi](/id/concepts/session)
- [Antrean pengarahan](/id/concepts/queue-steering)
- [Kebijakan retry](/id/concepts/retry)
