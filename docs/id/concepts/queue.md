---
read_when:
    - Mengubah eksekusi atau konkurensi balasan otomatis
    - Menjelaskan mode /queue atau perilaku pengarahan pesan
summary: Mode antrean balasan otomatis, nilai bawaan, dan penggantian per sesi
title: Antrean perintah
x-i18n:
    generated_at: "2026-05-02T09:18:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: c59ea6802d8bf526f4005db3b1baa87d96a23d561c916f91520e8e641fbaf74f
    source_path: concepts/queue.md
    workflow: 16
---

Kami menserialisasi eksekusi balasan otomatis masuk (semua kanal) melalui antrean kecil dalam proses untuk mencegah beberapa eksekusi agen bertabrakan, sambil tetap mengizinkan paralelisme yang aman lintas sesi.

## Mengapa

- Eksekusi balasan otomatis bisa mahal (panggilan LLM) dan dapat bertabrakan saat beberapa pesan masuk tiba berdekatan.
- Serialisasi menghindari perebutan sumber daya bersama (file sesi, log, stdin CLI) dan mengurangi kemungkinan batas laju upstream.

## Cara kerjanya

- Antrean FIFO yang sadar jalur menguras setiap jalur dengan batas konkurensi yang dapat dikonfigurasi (default 1 untuk jalur yang tidak dikonfigurasi; main default ke 4, subagent ke 8).
- `runEmbeddedPiAgent` mengantrekan berdasarkan **kunci sesi** (jalur `session:<key>`) untuk menjamin hanya ada satu eksekusi aktif per sesi.
- Setiap eksekusi sesi lalu diantrekan ke **jalur global** (`main` secara default) sehingga paralelisme keseluruhan dibatasi oleh `agents.defaults.maxConcurrent`.
- Saat pencatatan log verbose diaktifkan, eksekusi yang mengantre memancarkan pemberitahuan singkat jika menunggu lebih dari ~2 dtk sebelum dimulai.
- Indikator mengetik tetap langsung menyala saat masuk antrean (jika didukung oleh kanal) sehingga pengalaman pengguna tidak berubah saat menunggu giliran.

## Nilai bawaan

Saat tidak disetel, semua permukaan kanal masuk menggunakan:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

`steer` adalah default karena menjaga giliran model aktif tetap responsif tanpa
memulai eksekusi sesi kedua. Mode ini menguras semua pesan pengarahan yang tiba
sebelum batas model berikutnya. Jika eksekusi saat ini tidak dapat menerima pengarahan,
OpenClaw kembali ke entri antrean tindak lanjut.

## Mode antrean

Pesan masuk dapat mengarahkan eksekusi saat ini, menunggu giliran tindak lanjut, atau melakukan keduanya:

- `steer`: antrekan pesan pengarahan ke runtime aktif. Pi mengirim semua pesan pengarahan tertunda **setelah giliran asisten saat ini selesai mengeksekusi panggilan alatnya**, sebelum panggilan LLM berikutnya; app-server Codex menerima satu `turn/steer` yang dibundel. Jika eksekusi tidak sedang streaming aktif atau pengarahan tidak tersedia, OpenClaw kembali ke entri antrean tindak lanjut.
- `queue` (legacy): pengarahan lama satu per satu. Pi mengirim satu pesan pengarahan yang diantrekan pada setiap batas model; app-server Codex menerima permintaan `turn/steer` terpisah. Pilih `steer` kecuali Anda membutuhkan perilaku terserialisasi sebelumnya.
- `followup`: antrekan setiap pesan untuk giliran agen berikutnya setelah eksekusi saat ini berakhir.
- `collect`: gabungkan pesan yang diantrekan menjadi **satu** giliran tindak lanjut setelah jendela tenang. Jika pesan menargetkan kanal/thread yang berbeda, pesan dikuras secara individual untuk mempertahankan perutean.
- `steer-backlog` (alias `steer+backlog`): arahkan sekarang **dan** pertahankan pesan yang sama untuk giliran tindak lanjut.
- `interrupt` (legacy): batalkan eksekusi aktif untuk sesi tersebut, lalu jalankan pesan terbaru.

Steer-backlog berarti Anda bisa mendapatkan respons tindak lanjut setelah eksekusi yang diarahkan, sehingga
permukaan streaming dapat terlihat seperti duplikat. Pilih `collect`/`steer` jika Anda menginginkan
satu respons per pesan masuk.

Untuk pengaturan waktu khusus runtime dan perilaku dependensi, lihat
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

Opsi berlaku untuk `followup`, `collect`, dan `steer-backlog` (serta untuk `steer` atau `queue` legacy saat pengarahan kembali ke tindak lanjut):

- `debounceMs`: jendela tenang sebelum menguras tindak lanjut yang diantrekan. Angka polos adalah milidetik; unit `ms`, `s`, `m`, `h`, dan `d` diterima oleh opsi `/queue`.
- `cap`: pesan maksimum yang diantrekan per sesi. Nilai di bawah `1` diabaikan.
- `drop: "summarize"`: default. Hapus entri antrean tertua sesuai kebutuhan, simpan ringkasan ringkas, dan sisipkan sebagai prompt tindak lanjut sintetis.
- `drop: "old"`: hapus entri antrean tertua sesuai kebutuhan, tanpa mempertahankan ringkasan.
- `drop: "new"`: tolak pesan terbaru saat antrean sudah penuh.

Default: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Prioritas

Untuk pemilihan mode, OpenClaw menyelesaikan:

1. Penimpaan `/queue` inline atau tersimpan per sesi.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. Default `steer`.

Untuk opsi, opsi `/queue` inline atau tersimpan menang atas konfigurasi. Lalu
debounce khusus kanal (`messages.queue.debounceMsByChannel`), default debounce plugin,
opsi global `messages.queue`, dan default bawaan diterapkan.
`cap` dan `drop` adalah opsi global/sesi, bukan kunci konfigurasi per kanal.

## Penimpaan per sesi

- Kirim `/queue <mode>` sebagai perintah mandiri untuk menyimpan mode bagi sesi saat ini.
- Opsi dapat digabungkan: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` atau `/queue reset` menghapus penimpaan sesi.

## Cakupan dan jaminan

- Berlaku untuk eksekusi agen balasan otomatis di semua kanal masuk yang menggunakan pipeline balasan gateway (web WhatsApp, Telegram, Slack, Discord, Signal, iMessage, webchat, dll.).
- Jalur default (`main`) berlaku di seluruh proses untuk masuk + heartbeat utama; setel `agents.defaults.maxConcurrent` untuk mengizinkan beberapa sesi berjalan paralel.
- Jalur tambahan mungkin ada (mis. `cron`, `cron-nested`, `nested`, `subagent`) sehingga pekerjaan latar belakang dapat berjalan paralel tanpa memblokir balasan masuk. Giliran agen cron terisolasi menahan slot `cron` sementara eksekusi agen bagian dalamnya menggunakan `cron-nested`; keduanya menggunakan `cron.maxConcurrentRuns`. Alur `nested` non-cron bersama mempertahankan perilaku jalurnya sendiri. Eksekusi terlepas ini dilacak sebagai [tugas latar belakang](/id/automation/tasks).
- Jalur per sesi menjamin bahwa hanya satu eksekusi agen menyentuh sesi tertentu pada satu waktu.
- Tanpa dependensi eksternal atau thread pekerja latar belakang; TypeScript + promise murni.

## Pemecahan masalah

- Jika perintah tampak macet, aktifkan log verbose dan cari baris “queued for …ms” untuk memastikan antrean sedang dikuras.
- Jika Anda membutuhkan kedalaman antrean, aktifkan log verbose dan perhatikan baris waktu antrean.
- Eksekusi app-server Codex yang menerima giliran lalu berhenti memancarkan progres diinterupsi oleh adaptor Codex sehingga jalur sesi aktif dapat dilepaskan alih-alih menunggu timeout eksekusi luar.
- Saat diagnostik diaktifkan, sesi yang tetap berada di `processing` melewati `diagnostics.stuckSessionWarnMs` tanpa balasan, alat, status, blok, atau progres ACP yang teramati diklasifikasikan berdasarkan aktivitas saat ini. Pekerjaan aktif dicatat sebagai `session.long_running`; pekerjaan aktif tanpa progres terbaru dicatat sebagai `session.stalled`; `session.stuck` disediakan untuk pembukuan sesi basi tanpa pekerjaan aktif, dan hanya jalur itu yang dapat melepaskan jalur sesi yang terdampak agar pekerjaan yang diantrekan terkuras. Diagnostik `session.stuck` berulang melakukan backoff selama sesi tetap tidak berubah.

## Terkait

- [Manajemen sesi](/id/concepts/session)
- [Antrean pengarahan](/id/concepts/queue-steering)
- [Kebijakan percobaan ulang](/id/concepts/retry)
