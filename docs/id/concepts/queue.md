---
read_when:
    - Mengubah eksekusi atau konkurensi balasan otomatis
    - Menjelaskan mode /queue atau perilaku pengarah pesan
summary: Mode antrean balasan otomatis, nilai default, dan penggantian per sesi
title: Antrean perintah
x-i18n:
    generated_at: "2026-07-19T05:04:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 01a888217e8bcb9f379278d49943ce7b1d59e813a0f218c6b8c7f94c066b88d0
    source_path: concepts/queue.md
    workflow: 16
---

OpenClaw menserialkan proses balasan otomatis masuk (semua saluran) melalui antrean kecil dalam proses untuk mencegah beberapa proses agen bertabrakan, sekaligus tetap memungkinkan paralelisme yang aman antar-sesi.

## Mengapa

- Proses balasan otomatis dapat menghabiskan banyak sumber daya (panggilan LLM) dan dapat bertabrakan ketika beberapa pesan masuk tiba dalam waktu berdekatan.
- Serialisasi mencegah persaingan atas sumber daya bersama (file sesi, log, stdin CLI) dan mengurangi kemungkinan terkena batas laju upstream.

## Cara kerjanya

- Antrean FIFO yang mengenali jalur menguras setiap jalur dengan batas konkurensi yang dapat dikonfigurasi (default 1 untuk jalur yang belum dikonfigurasi; `main` secara default 4, `subagent` 8).
- `runEmbeddedAgent` mengantrekan berdasarkan **kunci sesi** (jalur `session:<key>`) untuk menjamin hanya ada satu proses aktif per sesi.
- Setiap proses sesi kemudian dimasukkan ke dalam **jalur global** (secara default `main`) sehingga paralelisme keseluruhan dibatasi oleh `agents.defaults.maxConcurrent`.
- Ketika pencatatan log verbose diaktifkan, proses yang mengantre mengeluarkan pemberitahuan singkat jika menunggu lebih dari ~2s sebelum dimulai.
- Indikator mengetik tetap langsung aktif saat proses dimasukkan ke antrean (jika didukung oleh saluran), sehingga pengalaman pengguna tidak berubah ketika proses menunggu gilirannya.

## Default

Jika tidak ditetapkan, semua permukaan saluran masuk menggunakan:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

Pengarahan pada giliran yang sama adalah default. Prompt yang tiba di tengah proses disuntikkan ke runtime aktif jika proses tersebut dapat menerima pengarahan, sehingga tidak ada proses sesi kedua yang dimulai. Jika proses aktif tidak dapat menerima pengarahan, OpenClaw menunggu proses aktif selesai sebelum memulai prompt.

## Mode antrean

`/queue` mengontrol tindakan terhadap pesan masuk normal ketika suatu sesi sudah memiliki proses aktif:

- `steer`: suntikkan pesan ke runtime aktif. OpenClaw mengirimkan semua pesan pengarahan yang tertunda **setelah giliran asisten saat ini selesai menjalankan panggilan alatnya**, sebelum panggilan LLM berikutnya; app-server Codex menerima satu `turn/steer` yang dibundel. Jika proses tidak sedang melakukan streaming secara aktif atau pengarahan tidak tersedia, OpenClaw menunggu hingga proses aktif berakhir sebelum memulai prompt.
- `followup`: jangan lakukan pengarahan. Antrekan setiap pesan untuk giliran agen berikutnya setelah proses saat ini berakhir.
- `collect`: jangan lakukan pengarahan. Gabungkan pesan yang mengantre menjadi **satu** giliran tindak lanjut setelah jendela hening. Jika pesan menargetkan saluran/utas yang berbeda, pesan tersebut dikuras secara terpisah untuk mempertahankan perutean.
- `interrupt`: batalkan proses aktif untuk sesi tersebut, lalu jalankan pesan terbaru.

Untuk perilaku waktu dan dependensi khusus runtime, lihat [Antrean pengarahan](/id/concepts/queue-steering). Untuk perintah eksplisit `/steer <message>`, lihat [Pengarahan](/id/tools/steer).

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

Opsi berlaku untuk pengiriman yang mengantre. `debounceMs` juga menetapkan jendela hening pengarahan Codex dalam mode `steer`:

- `debounceMs`: jendela hening sebelum menguras tindak lanjut yang mengantre atau bundel pengumpulan; dalam mode Codex `steer`, jendela hening sebelum mengirim `turn/steer` yang dibundel. Angka tanpa unit dianggap sebagai milidetik; unit `ms`, `s`, `m`, `h`, dan `d` diterima oleh opsi `/queue`.
- `cap`: jumlah maksimum pesan yang mengantre per sesi. Nilai di bawah `1` diabaikan.
- `drop: "summarize"` (default): hapus entri antrean terlama sesuai kebutuhan, pertahankan ringkasan ringkas, dan suntikkan sebagai prompt tindak lanjut sintetis.
- `drop: "old"`: hapus entri antrean terlama sesuai kebutuhan, tanpa mempertahankan ringkasan.
- `drop: "new"`: tolak pesan terbaru ketika antrean sudah penuh.

Default: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Pengarahan dan streaming

Ketika streaming saluran adalah `partial` atau `block`, pengarahan dapat terlihat seperti beberapa balasan singkat yang tampak saat proses aktif mencapai batas runtime:

- `partial`: pratinjau mungkin diselesaikan lebih awal, lalu pratinjau baru dimulai setelah pengarahan diterima.
- `block`: blok berukuran draf dapat menghasilkan tampilan berurutan yang sama.
- Tanpa streaming, pengarahan beralih ke tindak lanjut setelah proses aktif ketika runtime tidak dapat menerima pengarahan pada giliran yang sama.

`steer` tidak membatalkan alat yang sedang berjalan. Gunakan `/queue interrupt` ketika pesan terbaru harus membatalkan proses saat ini.

## Prioritas

Untuk pemilihan mode, OpenClaw menyelesaikannya dalam urutan berikut:

1. Pengesampingan `/queue` per sesi secara inline atau tersimpan.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. Default `steer`.

Untuk opsi, opsi `/queue` secara inline atau tersimpan mengungguli konfigurasi. Kemudian debounce khusus saluran (`messages.queue.debounceMsByChannel`), default debounce Plugin, opsi global `messages.queue`, dan default bawaan diterapkan dalam urutan tersebut. `cap` dan `drop` adalah opsi global/sesi, bukan kunci konfigurasi per saluran.

## Pengesampingan per sesi

- Kirim `/queue <steer|followup|collect|interrupt>` sebagai perintah mandiri untuk menyimpan mode antrean bagi sesi saat ini.
- Opsi dapat digabungkan: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` atau `/queue reset` menghapus pengesampingan sesi.

## Pembatalan giliran yang mengantre

Saat prompt berada dalam antrean tindak lanjut/pengumpulan (misalnya `chat.send` TUI atau
webchat yang tiba ketika giliran lain sedang aktif), Gateway menyimpan
**identitas pembatalan milik Gateway** untuk `runId` klien tersebut hingga konten yang mengantre
dijalankan atau dihapus. Identitas tersebut mengikuti konten yang digabungkan ke dalam
ringkasan luapan.

- `chat.abort` dengan `runId` tertentu membatalkan giliran tersebut selagi masih
  mengantre, jika pemohon memiliki otorisasi (aturan kepemilikan yang sama seperti proses aktif).
- `chat.abort` untuk sesi tanpa `runId` membatalkan **giliran mengantre yang diotorisasi
  terlebih dahulu**, lalu membatalkan proses aktif yang diotorisasi. Urutan ini mencegah pengurasan antrean
  menaikkan pekerjaan ke sesi yang baru dihentikan sebagian.
- Menghapus seluruh antrean sesi tanpa pemeriksaan per pemohon bukanlah
  jalur penghentian untuk sesi dengan banyak pemilik.
- Waktu tunggu dalam antrean tidak diproyeksikan sebagai proses agen aktif untuk `sessions.list` dan
  tidak memiliki semantik batas waktu proses aktif; hanya fase aktif yang memilikinya.

Klien berbasis Gateway (termasuk `openclaw tui`) meneruskan prompt di tengah proses dan
membiarkan Gateway menerapkan mode antrean. Esc/`/stop` menggunakan pembatalan dengan cakupan sesi
agar handle lokal yang hilang tidak membiarkan prompt yang masih mengantre tetap berjalan.

`openclaw chat` dan `openclaw tui --local` menerapkan empat mode yang sama dalam
runtime tertanam. `steer` lokal menyuntikkan ke proses tertanam aktif ketika
runtime tersebut menerima pengarahan dan, jika tidak, menjadi tindak lanjut; `followup` dan
`collect` tetap menjadi pekerjaan tertunda lokal; `interrupt` membatalkan proses lokal aktif
sebelum memulai pesan terbaru. Perintah eksplisit `/steer <message>`
bukan perintah mode lokal.

## Cakupan dan jaminan

- Berlaku untuk proses agen balasan otomatis di semua saluran masuk yang menggunakan pipeline balasan Gateway (web WhatsApp, Telegram, Slack, Discord, Signal, iMessage, webchat, dan sebagainya).
- Jalur default (`main`) berlaku di seluruh proses untuk pesan masuk + heartbeat utama; tetapkan `agents.defaults.maxConcurrent` agar beberapa sesi dapat berjalan secara paralel.
- Jalur tambahan dapat tersedia (misalnya `cron`, `cron-nested`, `nested`, `subagent`) sehingga tugas latar belakang dapat berjalan secara paralel tanpa memblokir balasan masuk. Giliran agen Cron yang terisolasi menahan slot `cron` sementara eksekusi agen di dalamnya menggunakan `cron-nested`; keduanya menggunakan `cron.maxConcurrentRuns`. Alur `nested` bersama yang bukan Cron mempertahankan perilaku jalurnya sendiri. Proses terpisah ini dilacak sebagai [tugas latar belakang](/id/automation/tasks).
- Jalur per sesi menjamin bahwa hanya satu proses agen yang menangani sesi tertentu pada satu waktu.
- Tidak ada dependensi eksternal atau utas pekerja latar belakang; hanya TypeScript + promise.

## Pemecahan masalah

- Jika perintah tampak macet, aktifkan log verbose dan cari baris "queued for ...ms" untuk memastikan antrean sedang dikuras.
- Proses app-server Codex yang menerima giliran lalu berhenti mengeluarkan progres diinterupsi oleh adaptor Codex agar jalur sesi aktif dapat dilepaskan alih-alih menunggu batas waktu proses luar.
- Ketika diagnostik diaktifkan, sesi yang tetap berada dalam `processing` melewati `diagnostics.stuckSessionWarnMs` tanpa teramati adanya balasan, alat, status, blok, atau progres ACP diklasifikasikan berdasarkan aktivitas saat ini:
  - Pekerjaan aktif dengan progres terbaru dicatat sebagai `session.long_running`. Panggilan model senyap yang memiliki pemilik juga tetap `session.long_running` hingga `diagnostics.stuckSessionAbortMs` agar penyedia yang lambat atau tidak melakukan streaming tidak dilaporkan macet terlalu dini.
  - Pekerjaan aktif tanpa progres terbaru dicatat sebagai `session.stalled`; panggilan model yang memiliki pemilik, panggilan alat yang terblokir, dan proses tertanam yang macet beralih menjadi `session.stalled` pada atau setelah ambang pembatalan. Aktivitas model/alat usang tanpa pemilik tidak disembunyikan sebagai proses yang berjalan lama.
  - `session.stuck` dicadangkan untuk pembukuan sesi usang yang dapat dipulihkan, termasuk sesi antrean yang tidak aktif dengan aktivitas model/alat usang tanpa pemilik.
  - `session.stuck` selalu memicu pemulihan yang dapat melepaskan jalur sesi terdampak. Klasifikasi `session.stalled` yang melewati `diagnostics.stuckSessionAbortMs` (panggilan alat yang terblokir, panggilan model yang macet, atau proses tertanam yang macet) juga dapat memicu pemulihan dengan pembatalan aktif, sehingga kedua klasifikasi dapat mengurai antrean yang macet, bukan hanya `session.stuck`.
  - Baris log peringatan `session.stuck` dan `session.long_running` yang berulang menerapkan jeda mundur secara eksponensial selama sesi tetap tidak berubah; upaya pemulihan tetap dijalankan pada setiap detak heartbeat tanpa memedulikan jeda mundur tersebut.

## Terkait

- [Manajemen sesi](/id/concepts/session)
- [Antrean pengarahan](/id/concepts/queue-steering)
- [Pengarahan](/id/tools/steer)
- [Kebijakan percobaan ulang](/id/concepts/retry)
