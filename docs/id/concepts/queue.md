---
read_when:
    - Mengubah eksekusi atau konkurensi balasan otomatis
    - Menjelaskan mode /queue atau perilaku pengarahan pesan
summary: Mode antrean balasan otomatis, default, dan penggantian per sesi
title: Antrean perintah
x-i18n:
    generated_at: "2026-05-04T02:23:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 085aebe7059020f027eb08bb382cce2d253ea117eed0ca77d6ffd208f295acb1
    source_path: concepts/queue.md
    workflow: 16
---

Kami menserialkan run balasan otomatis masuk (semua saluran) melalui antrean kecil dalam proses untuk mencegah beberapa run agen saling bertabrakan, sambil tetap memungkinkan paralelisme yang aman di seluruh sesi.

## Mengapa

- Run balasan otomatis dapat memakan biaya besar (panggilan LLM) dan dapat bertabrakan ketika beberapa pesan masuk tiba berdekatan.
- Serialisasi menghindari perebutan sumber daya bersama (file sesi, log, stdin CLI) dan mengurangi kemungkinan terkena batas laju upstream.

## Cara kerjanya

- Antrean FIFO sadar-lane menguras setiap lane dengan batas konkurensi yang dapat dikonfigurasi (default 1 untuk lane yang tidak dikonfigurasi; main default ke 4, subagen ke 8).
- `runEmbeddedPiAgent` mengantre berdasarkan **kunci sesi** (lane `session:<key>`) untuk menjamin hanya ada satu run aktif per sesi.
- Setiap run sesi kemudian diantrekan ke **lane global** (`main` secara default) sehingga paralelisme keseluruhan dibatasi oleh `agents.defaults.maxConcurrent`.
- Ketika logging verbose diaktifkan, run yang mengantre memancarkan pemberitahuan singkat jika menunggu lebih dari ~2 dtk sebelum dimulai.
- Indikator mengetik tetap langsung aktif saat masuk antrean (jika didukung oleh saluran) sehingga pengalaman pengguna tidak berubah saat menunggu giliran.

## Default

Jika belum diatur, semua permukaan saluran masuk menggunakan:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

`steer` adalah default karena menjaga giliran model aktif tetap responsif tanpa
memulai run sesi kedua. Mode ini menguras semua pesan pengarah yang tiba
sebelum batas model berikutnya. Jika run saat ini tidak dapat menerima pengarahan,
OpenClaw kembali ke entri antrean tindak lanjut.

## Mode antrean

Pesan masuk dapat mengarahkan run saat ini, menunggu giliran tindak lanjut, atau melakukan keduanya:

- `steer`: mengantrekan pesan pengarah ke runtime aktif. Pi mengirim semua pesan pengarah tertunda **setelah giliran asisten saat ini selesai mengeksekusi panggilan tool**, sebelum panggilan LLM berikutnya; app-server Codex menerima satu `turn/steer` yang dibundel. Jika run tidak sedang aktif streaming atau pengarahan tidak tersedia, OpenClaw kembali ke entri antrean tindak lanjut.
- `queue` (legacy): pengarahan lama satu per satu. Pi mengirim satu pesan pengarah yang diantrekan pada setiap batas model; app-server Codex menerima permintaan `turn/steer` terpisah. Utamakan `steer` kecuali Anda membutuhkan perilaku terserialisasi sebelumnya.
- `followup`: mengantrekan setiap pesan untuk giliran agen nanti setelah run saat ini berakhir.
- `collect`: menggabungkan pesan yang diantrekan menjadi **satu** giliran tindak lanjut setelah jendela hening. Jika pesan menargetkan saluran/thread berbeda, pesan dikuras secara terpisah untuk mempertahankan perutean.
- `steer-backlog` (alias `steer+backlog`): arahkan sekarang **dan** pertahankan pesan yang sama untuk giliran tindak lanjut.
- `interrupt` (legacy): membatalkan run aktif untuk sesi tersebut, lalu menjalankan pesan terbaru.

Steer-backlog berarti Anda bisa mendapatkan respons tindak lanjut setelah run yang diarahkan, sehingga
permukaan streaming dapat terlihat seperti duplikat. Utamakan `collect`/`steer` jika Anda menginginkan
satu respons per pesan masuk.

Untuk timing dan perilaku dependensi khusus runtime, lihat
[Antrean pengarahan](/id/concepts/queue-steering). Untuk perintah eksplisit `/steer <message>`,
lihat [Arahkan](/tools/steer).

Konfigurasikan secara global atau per saluran melalui `messages.queue`:

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

Opsi berlaku untuk `followup`, `collect`, dan `steer-backlog` (serta untuk `steer` atau `queue` legacy ketika pengarahan kembali ke tindak lanjut):

- `debounceMs`: jendela hening sebelum menguras tindak lanjut yang diantrekan. Angka polos adalah milidetik; unit `ms`, `s`, `m`, `h`, dan `d` diterima oleh opsi `/queue`.
- `cap`: maksimum pesan yang diantrekan per sesi. Nilai di bawah `1` diabaikan.
- `drop: "summarize"`: default. Hapus entri antrean tertua sesuai kebutuhan, simpan ringkasan ringkas, dan sisipkan sebagai prompt tindak lanjut sintetis.
- `drop: "old"`: hapus entri antrean tertua sesuai kebutuhan, tanpa mempertahankan ringkasan.
- `drop: "new"`: tolak pesan terbaru ketika antrean sudah penuh.

Default: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Presedensi

Untuk pemilihan mode, OpenClaw menyelesaikan:

1. Override `/queue` per sesi yang inline atau tersimpan.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. Default `steer`.

Untuk opsi, opsi `/queue` inline atau tersimpan mengalahkan konfigurasi. Kemudian
debounce khusus saluran (`messages.queue.debounceMsByChannel`), default debounce
Plugin, opsi `messages.queue` global, dan default bawaan
diterapkan. `cap` dan `drop` adalah opsi global/sesi, bukan kunci konfigurasi
per saluran.

## Override per sesi

- Kirim `/queue <mode>` sebagai perintah mandiri untuk menyimpan mode bagi sesi saat ini.
- Opsi dapat digabungkan: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` atau `/queue reset` menghapus override sesi.

## Cakupan dan jaminan

- Berlaku untuk run agen balasan otomatis di semua saluran masuk yang menggunakan pipeline balasan Gateway (web WhatsApp, Telegram, Slack, Discord, Signal, iMessage, webchat, dll.).
- Lane default (`main`) berlaku di seluruh proses untuk Heartbeat masuk + utama; atur `agents.defaults.maxConcurrent` untuk mengizinkan beberapa sesi berjalan paralel.
- Lane tambahan mungkin ada (mis. `cron`, `cron-nested`, `nested`, `subagent`) sehingga pekerjaan latar belakang dapat berjalan paralel tanpa memblokir balasan masuk. Giliran agen cron terisolasi menahan slot `cron` sementara eksekusi agen dalamnya menggunakan `cron-nested`; keduanya menggunakan `cron.maxConcurrentRuns`. Alur `nested` non-cron bersama mempertahankan perilaku lane masing-masing. Run terlepas ini dilacak sebagai [tugas latar belakang](/id/automation/tasks).
- Lane per sesi menjamin hanya satu run agen menyentuh sesi tertentu pada satu waktu.
- Tidak ada dependensi eksternal atau thread worker latar belakang; TypeScript murni + promise.

## Pemecahan masalah

- Jika perintah tampak macet, aktifkan log verbose dan cari baris “queued for …ms” untuk mengonfirmasi antrean sedang dikuras.
- Jika Anda membutuhkan kedalaman antrean, aktifkan log verbose dan amati baris timing antrean.
- Run app-server Codex yang menerima giliran lalu berhenti memancarkan progres diinterupsi oleh adapter Codex sehingga lane sesi aktif dapat dilepas alih-alih menunggu timeout run luar.
- Ketika diagnostik diaktifkan, sesi yang tetap berada dalam `processing` melewati `diagnostics.stuckSessionWarnMs` tanpa balasan, tool, status, blok, atau progres ACP yang teramati diklasifikasikan berdasarkan aktivitas saat ini. Pekerjaan aktif dicatat sebagai `session.long_running`; pekerjaan aktif tanpa progres terbaru dicatat sebagai `session.stalled`; `session.stuck` dicadangkan untuk pembukuan sesi usang tanpa pekerjaan aktif, dan hanya jalur tersebut yang dapat melepas lane sesi terdampak agar pekerjaan yang diantrekan terkuras. Diagnostik `session.stuck` berulang akan mundur sementara sesi tetap tidak berubah.

## Terkait

- [Manajemen sesi](/id/concepts/session)
- [Antrean pengarahan](/id/concepts/queue-steering)
- [Arahkan](/tools/steer)
- [Kebijakan coba ulang](/id/concepts/retry)
