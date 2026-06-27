---
read_when:
    - Mengubah eksekusi atau konkurensi balasan otomatis
    - Menjelaskan mode /queue atau perilaku pengarahan pesan
summary: Mode antrean balasan otomatis, nilai default, dan penggantian per sesi
title: Antrean perintah
x-i18n:
    generated_at: "2026-06-27T17:26:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e518b018a85ddbc7afa3925180cc2329eb1d249316d81907ba51cfb3c692375
    source_path: concepts/queue.md
    workflow: 16
---

Kami menserialkan eksekusi balasan otomatis masuk (semua channel) melalui antrean kecil dalam proses untuk mencegah beberapa eksekusi agen bertabrakan, sambil tetap memungkinkan paralelisme yang aman antar sesi.

## Mengapa

- Eksekusi balasan otomatis bisa mahal (panggilan LLM) dan dapat bertabrakan ketika beberapa pesan masuk tiba berdekatan.
- Serialisasi menghindari perebutan sumber daya bersama (file sesi, log, stdin CLI) dan mengurangi kemungkinan batas laju upstream.

## Cara kerjanya

- Antrean FIFO yang sadar lane menguras setiap lane dengan batas konkurensi yang dapat dikonfigurasi (default 1 untuk lane yang tidak dikonfigurasi; main default ke 4, subagent ke 8).
- `runEmbeddedAgent` mengantre berdasarkan **kunci sesi** (lane `session:<key>`) untuk menjamin hanya satu eksekusi aktif per sesi.
- Setiap eksekusi sesi kemudian diantrekan ke **lane global** (`main` secara default) sehingga paralelisme keseluruhan dibatasi oleh `agents.defaults.maxConcurrent`.
- Ketika pencatatan log verbose diaktifkan, eksekusi yang mengantre memancarkan pemberitahuan singkat jika menunggu lebih dari ~2 dtk sebelum dimulai.
- Indikator mengetik tetap langsung aktif saat masuk antrean (ketika didukung oleh channel) sehingga pengalaman pengguna tidak berubah saat kita menunggu giliran.

## Default

Saat tidak diatur, semua permukaan channel masuk menggunakan:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

Pengarahan dalam giliran yang sama adalah default. Prompt yang tiba di tengah eksekusi disuntikkan
ke runtime aktif ketika eksekusi dapat menerima pengarahan, sehingga tidak ada eksekusi sesi kedua
yang dimulai. Jika eksekusi aktif tidak dapat menerima pengarahan, OpenClaw menunggu
eksekusi aktif selesai sebelum memulai prompt.

## Mode antrean

`/queue` mengontrol apa yang dilakukan pesan masuk normal saat sesi sudah memiliki
eksekusi aktif:

- `steer`: menyuntikkan pesan ke runtime aktif. OpenClaw mengirim semua pesan pengarahan yang tertunda **setelah giliran asisten saat ini selesai mengeksekusi panggilan tool-nya**, sebelum panggilan LLM berikutnya; Codex app-server menerima satu `turn/steer` yang dibatch. Jika eksekusi tidak sedang streaming aktif atau pengarahan tidak tersedia, OpenClaw menunggu sampai eksekusi aktif berakhir sebelum memulai prompt.
- `followup`: jangan mengarahkan. Antrekan setiap pesan untuk giliran agen berikutnya setelah eksekusi saat ini berakhir.
- `collect`: jangan mengarahkan. Gabungkan pesan yang diantrekan menjadi **satu** giliran tindak lanjut setelah jendela senyap. Jika pesan menargetkan channel/thread yang berbeda, pesan dikuras satu per satu untuk mempertahankan routing.
- `interrupt`: batalkan eksekusi aktif untuk sesi tersebut, lalu jalankan pesan terbaru.

Untuk pengaturan waktu spesifik runtime dan perilaku dependensi, lihat
[Antrean pengarahan](/id/concepts/queue-steering). Untuk perintah eksplisit `/steer <message>`,
lihat [Arahkan](/id/tools/steer).

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

Opsi berlaku untuk pengiriman yang diantrekan. `debounceMs` juga menetapkan jendela senyap
pengarahan Codex dalam mode `steer`:

- `debounceMs`: jendela senyap sebelum menguras tindak lanjut atau batch collect yang diantrekan; dalam mode Codex `steer`, jendela senyap sebelum mengirim `turn/steer` yang dibatch. Angka polos adalah milidetik; unit `ms`, `s`, `m`, `h`, dan `d` diterima oleh opsi `/queue`.
- `cap`: pesan antrean maksimum per sesi. Nilai di bawah `1` diabaikan.
- `drop: "summarize"`: default. Buang entri antrean paling lama sesuai kebutuhan, simpan ringkasan ringkas, dan suntikkan sebagai prompt tindak lanjut sintetis.
- `drop: "old"`: buang entri antrean paling lama sesuai kebutuhan, tanpa mempertahankan ringkasan.
- `drop: "new"`: tolak pesan terbaru ketika antrean sudah penuh.

Default: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Pengarahan dan streaming

Ketika streaming channel adalah `partial` atau `block`, pengarahan dapat terlihat seperti beberapa
balasan singkat yang terlihat saat eksekusi aktif mencapai batas runtime:

- `partial`: pratinjau dapat difinalisasi lebih awal, lalu pratinjau baru dimulai setelah
  pengarahan diterima.
- `block`: blok seukuran draf dapat menciptakan tampilan berurutan yang sama.
- Tanpa streaming, pengarahan kembali ke tindak lanjut setelah eksekusi aktif ketika
  runtime tidak dapat menerima pengarahan dalam giliran yang sama.

`steer` tidak membatalkan tool yang sedang berjalan. Gunakan `/queue interrupt` ketika pesan
terbaru harus membatalkan eksekusi saat ini.

## Presedensi

Untuk pemilihan mode, OpenClaw menyelesaikan:

1. Override `/queue` per sesi yang inline atau tersimpan.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. Default `steer`.

Untuk opsi, opsi `/queue` inline atau tersimpan menang atas konfigurasi. Kemudian
debounce khusus channel (`messages.queue.debounceMsByChannel`), default debounce
Plugin, opsi global `messages.queue`, dan default bawaan diterapkan. `cap` dan `drop`
adalah opsi global/sesi, bukan kunci konfigurasi per channel.

## Override per sesi

- Kirim `/queue <steer|followup|collect|interrupt>` sebagai perintah mandiri untuk menyimpan mode antrean bagi sesi saat ini.
- Opsi dapat digabungkan: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` atau `/queue reset` menghapus override sesi.

## Cakupan dan jaminan

- Berlaku untuk eksekusi agen balasan otomatis di semua channel masuk yang menggunakan pipeline balasan Gateway (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, obrolan web, dll.).
- Lane default (`main`) berlaku seluruh proses untuk inbound + Heartbeat utama; atur `agents.defaults.maxConcurrent` untuk memungkinkan beberapa sesi berjalan paralel.
- Lane tambahan dapat ada (mis. `cron`, `cron-nested`, `nested`, `subagent`) sehingga pekerjaan latar belakang dapat berjalan paralel tanpa memblokir balasan masuk. Giliran agen Cron terisolasi menahan slot `cron` sementara eksekusi agen dalamnya menggunakan `cron-nested`; keduanya menggunakan `cron.maxConcurrentRuns`. Alur `nested` non-cron bersama mempertahankan perilaku lane-nya sendiri. Eksekusi terlepas ini dilacak sebagai [tugas latar belakang](/id/automation/tasks).
- Lane per sesi menjamin hanya satu eksekusi agen menyentuh sesi tertentu pada satu waktu.
- Tanpa dependensi eksternal atau thread pekerja latar belakang; TypeScript + promise murni.

## Pemecahan masalah

- Jika perintah tampak macet, aktifkan log verbose dan cari baris "queued for ...ms" untuk mengonfirmasi antrean sedang dikuras.
- Jika Anda membutuhkan kedalaman antrean, aktifkan log verbose dan pantau baris waktu antrean.
- Eksekusi Codex app-server yang menerima giliran lalu berhenti memancarkan progres diinterupsi oleh adapter Codex sehingga lane sesi aktif dapat dilepas alih-alih menunggu timeout eksekusi luar.
- Ketika diagnostik diaktifkan, sesi yang tetap berada dalam `processing` melewati `diagnostics.stuckSessionWarnMs` tanpa balasan, tool, status, blok, atau progres ACP yang teramati diklasifikasikan berdasarkan aktivitas saat ini. Pekerjaan aktif dicatat sebagai `session.long_running`; panggilan model senyap yang dimiliki juga tetap `session.long_running` hingga `diagnostics.stuckSessionAbortMs` sehingga penyedia yang lambat atau tidak streaming tidak dilaporkan macet terlalu dini. Pekerjaan aktif tanpa progres terbaru dicatat sebagai `session.stalled`; panggilan model yang dimiliki beralih ke `session.stalled` pada atau setelah ambang pembatalan, dan aktivitas model/tool usang tanpa pemilik tidak disembunyikan sebagai berjalan lama. `session.stuck` dicadangkan untuk pembukuan sesi usang yang dapat dipulihkan, termasuk sesi mengantre yang idle dengan aktivitas model/tool usang tanpa pemilik, dan hanya jalur tersebut yang dapat melepas lane sesi yang terdampak sehingga pekerjaan antrean terkuras. Diagnostik `session.stuck` berulang melakukan backoff selama sesi tetap tidak berubah.

## Terkait

- [Manajemen sesi](/id/concepts/session)
- [Antrean pengarahan](/id/concepts/queue-steering)
- [Arahkan](/id/tools/steer)
- [Kebijakan coba ulang](/id/concepts/retry)
