---
read_when:
    - Mengubah eksekusi atau konkurensi balasan otomatis
    - Menjelaskan mode /queue atau perilaku pengarahan pesan
summary: Mode antrean balasan otomatis, nilai default, dan penggantian per sesi
title: Antrean perintah
x-i18n:
    generated_at: "2026-07-12T14:06:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 309d149545aaba91d2248dd6354d82e3cb7ddd489817a5f84acbb0269a0815ec
    source_path: concepts/queue.md
    workflow: 16
---

OpenClaw menserialkan proses balasan otomatis masuk (semua saluran) melalui antrean kecil dalam proses untuk mencegah beberapa proses agen bertabrakan, sekaligus tetap memungkinkan paralelisme yang aman antar-sesi.

## Mengapa

- Proses balasan otomatis dapat memerlukan banyak sumber daya (panggilan LLM) dan dapat bertabrakan ketika beberapa pesan masuk hampir bersamaan.
- Serialisasi menghindari persaingan atas sumber daya bersama (berkas sesi, log, stdin CLI) dan mengurangi kemungkinan terkena pembatasan laju dari layanan hulu.

## Cara kerjanya

- Antrean FIFO berbasis jalur menguras setiap jalur dengan batas konkurensi yang dapat dikonfigurasi (bawaan 1 untuk jalur yang belum dikonfigurasi; `main` secara bawaan bernilai 4, `subagent` bernilai 8).
- `runEmbeddedAgent` memasukkan proses ke antrean berdasarkan **kunci sesi** (jalur `session:<key>`) untuk menjamin hanya ada satu proses aktif per sesi.
- Setiap proses sesi kemudian dimasukkan ke **jalur global** (`main` secara bawaan) sehingga paralelisme keseluruhan dibatasi oleh `agents.defaults.maxConcurrent`.
- Saat pencatatan log mendetail diaktifkan, proses dalam antrean mengeluarkan pemberitahuan singkat jika menunggu lebih dari sekitar 2 detik sebelum dimulai.
- Indikator pengetikan tetap langsung aktif saat proses dimasukkan ke antrean (jika didukung oleh saluran), sehingga pengalaman pengguna tidak berubah selama proses menunggu gilirannya.

## Nilai bawaan

Jika tidak ditetapkan, semua permukaan saluran masuk menggunakan:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

Pengarahan dalam giliran yang sama merupakan perilaku bawaan. Prompt yang masuk saat proses sedang berjalan disisipkan ke runtime aktif jika proses tersebut dapat menerima pengarahan, sehingga proses sesi kedua tidak dimulai. Jika proses aktif tidak dapat menerima pengarahan, OpenClaw menunggu hingga proses aktif selesai sebelum menjalankan prompt.

## Mode antrean

`/queue` mengontrol tindakan terhadap pesan masuk biasa saat suatu sesi sudah memiliki proses aktif:

- `steer`: menyisipkan pesan ke runtime aktif. OpenClaw mengirimkan semua pesan pengarahan yang tertunda **setelah giliran asisten saat ini selesai menjalankan panggilan alatnya**, sebelum panggilan LLM berikutnya; server aplikasi Codex menerima satu `turn/steer` gabungan. Jika proses tidak sedang melakukan streaming secara aktif atau pengarahan tidak tersedia, OpenClaw menunggu hingga proses aktif berakhir sebelum menjalankan prompt.
- `followup`: jangan arahkan. Masukkan setiap pesan ke antrean untuk giliran agen berikutnya setelah proses saat ini berakhir.
- `collect`: jangan arahkan. Gabungkan pesan yang diantrekan menjadi **satu** giliran lanjutan setelah jendela hening. Jika pesan ditujukan ke saluran/utas yang berbeda, pesan dikuras satu per satu untuk mempertahankan perutean.
- `interrupt`: batalkan proses aktif untuk sesi tersebut, lalu jalankan pesan terbaru.

Untuk waktu spesifik runtime dan perilaku dependensi, lihat [Antrean pengarahan](/id/concepts/queue-steering). Untuk perintah eksplisit `/steer <message>`, lihat [Arahkan](/id/tools/steer).

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

Opsi berlaku untuk pengiriman yang diantrekan. `debounceMs` juga menetapkan jendela hening pengarahan Codex dalam mode `steer`:

- `debounceMs`: jendela hening sebelum menguras tindak lanjut yang diantrekan atau kumpulan gabungan; dalam mode `steer` Codex, jendela hening sebelum mengirim `turn/steer` gabungan. Angka tanpa satuan dianggap sebagai milidetik; satuan `ms`, `s`, `m`, `h`, dan `d` diterima oleh opsi `/queue`.
- `cap`: jumlah maksimum pesan yang diantrekan per sesi. Nilai di bawah `1` diabaikan.
- `drop: "summarize"` (bawaan): hapus entri antrean terlama sesuai kebutuhan, pertahankan ringkasan ringkas, dan sisipkan ringkasan tersebut sebagai prompt lanjutan sintetis.
- `drop: "old"`: hapus entri antrean terlama sesuai kebutuhan tanpa mempertahankan ringkasan.
- `drop: "new"`: tolak pesan terbaru ketika antrean sudah penuh.

Nilai bawaan: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Pengarahan dan streaming

Saat streaming saluran bernilai `partial` atau `block`, pengarahan dapat terlihat seperti beberapa balasan singkat yang tampak berurutan ketika proses aktif mencapai batas runtime:

- `partial`: pratinjau dapat diselesaikan lebih awal, lalu pratinjau baru dimulai setelah pengarahan diterima.
- `block`: blok seukuran draf dapat menimbulkan tampilan berurutan yang sama.
- Tanpa streaming, pengarahan beralih ke tindak lanjut setelah proses aktif jika runtime tidak dapat menerima pengarahan dalam giliran yang sama.

`steer` tidak membatalkan alat yang sedang berjalan. Gunakan `/queue interrupt` jika pesan terbaru harus membatalkan proses saat ini.

## Urutan prioritas

Untuk pemilihan mode, OpenClaw menyelesaikannya dengan urutan:

1. Penggantian `/queue` per sesi secara langsung atau yang tersimpan.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. `steer` bawaan.

Untuk opsi, opsi `/queue` langsung atau tersimpan lebih diprioritaskan daripada konfigurasi. Kemudian debounce khusus saluran (`messages.queue.debounceMsByChannel`), nilai bawaan debounce Plugin, opsi global `messages.queue`, dan nilai bawaan bawaan diterapkan sesuai urutan tersebut. `cap` dan `drop` merupakan opsi global/sesi, bukan kunci konfigurasi per saluran.

## Penggantian per sesi

- Kirim `/queue <steer|followup|collect|interrupt>` sebagai perintah mandiri untuk menyimpan mode antrean bagi sesi saat ini.
- Opsi dapat digabungkan: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` atau `/queue reset` menghapus penggantian sesi.

## Pembatalan giliran yang diantrekan

Selama prompt berada dalam antrean tindak lanjut/gabungan (misalnya `chat.send` dari TUI atau
obrolan web yang masuk saat giliran lain sedang aktif), Gateway mempertahankan
**identitas pembatalan milik Gateway** untuk `runId` klien tersebut sampai konten
yang diantrekan dijalankan atau dihapus. Identitas ini mengikuti konten yang digabungkan ke dalam
ringkasan luapan.

- `chat.abort` dengan `runId` tertentu membatalkan giliran tersebut selama masih
  diantrekan, jika peminta memiliki otorisasi (aturan kepemilikan yang sama seperti proses aktif).
- `chat.abort` untuk sesi tanpa `runId` membatalkan **giliran antrean yang diotorisasi
  terlebih dahulu**, lalu membatalkan proses aktif yang diotorisasi. Urutan ini mencegah pengurasan antrean
  menaikkan pekerjaan ke sesi yang baru dihentikan sebagian.
- Menghapus seluruh antrean sesi tanpa pemeriksaan per peminta bukan merupakan
  jalur penghentian untuk sesi dengan banyak pemilik.
- Waktu tunggu dalam antrean tidak diproyeksikan sebagai proses agen aktif untuk `sessions.list` dan
  tidak memiliki semantik batas waktu proses aktif; hanya fase aktif yang memilikinya.

Klien (termasuk TUI) meneruskan prompt yang masuk di tengah proses dan membiarkan Gateway menerapkan
mode antrean. Esc/`/stop` menggunakan pembatalan dalam cakupan sesi agar hilangnya handel lokal
tidak menyebabkan prompt yang masih diantrekan tetap berjalan.

## Cakupan dan jaminan

- Berlaku untuk proses agen balasan otomatis di semua saluran masuk yang menggunakan alur balasan Gateway (web WhatsApp, Telegram, Slack, Discord, Signal, iMessage, obrolan web, dan sebagainya).
- Jalur bawaan (`main`) berlaku untuk seluruh proses bagi pesan masuk + Heartbeat utama; tetapkan `agents.defaults.maxConcurrent` agar beberapa sesi dapat berjalan secara paralel.
- Jalur tambahan mungkin tersedia (misalnya `cron`, `cron-nested`, `nested`, `subagent`) sehingga pekerjaan latar belakang dapat berjalan secara paralel tanpa memblokir balasan masuk. Giliran agen Cron terisolasi menempati slot `cron` sementara eksekusi agen internalnya menggunakan `cron-nested`; keduanya menggunakan `cron.maxConcurrentRuns`. Alur `nested` bersama non-Cron mempertahankan perilaku jalurnya sendiri. Proses terlepas ini dilacak sebagai [tugas latar belakang](/id/automation/tasks).
- Jalur per sesi menjamin hanya satu proses agen yang menyentuh sesi tertentu pada satu waktu.
- Tidak ada dependensi eksternal atau utas pekerja latar belakang; hanya TypeScript + promise.

## Pemecahan masalah

- Jika perintah tampak macet, aktifkan log mendetail dan cari baris "queued for ...ms" untuk memastikan antrean sedang dikuras.
- Proses server aplikasi Codex yang menerima giliran lalu berhenti mengeluarkan kemajuan akan diinterupsi oleh adaptor Codex agar jalur sesi aktif dapat dilepaskan tanpa menunggu batas waktu proses luar.
- Saat diagnostik diaktifkan, sesi yang tetap dalam status `processing` melewati `diagnostics.stuckSessionWarnMs` tanpa balasan, alat, status, blok, atau kemajuan ACP yang teramati diklasifikasikan berdasarkan aktivitas saat ini:
  - Pekerjaan aktif dengan kemajuan terkini dicatat sebagai `session.long_running`. Panggilan model senyap yang memiliki pemilik juga tetap berstatus `session.long_running` hingga `diagnostics.stuckSessionAbortMs` agar penyedia yang lambat atau tidak melakukan streaming tidak dilaporkan sebagai terhenti terlalu dini.
  - Pekerjaan aktif tanpa kemajuan terkini dicatat sebagai `session.stalled`; panggilan model yang memiliki pemilik, panggilan alat yang terblokir, dan proses tertanam yang terhenti beralih menjadi `session.stalled` pada atau setelah ambang pembatalan. Aktivitas model/alat usang tanpa pemilik tidak disembunyikan sebagai proses yang berjalan lama.
  - `session.stuck` dikhususkan untuk pembukuan sesi usang yang dapat dipulihkan, termasuk sesi antrean yang menganggur dengan aktivitas model/alat usang tanpa pemilik.
  - `session.stuck` selalu memicu pemulihan yang dapat melepaskan jalur sesi yang terdampak. Klasifikasi `session.stalled` setelah `diagnostics.stuckSessionAbortMs` (panggilan alat terblokir, panggilan model terhenti, atau proses tertanam terhenti) juga dapat memicu pemulihan pembatalan aktif, sehingga kedua klasifikasi dapat membebaskan antrean yang macet, bukan hanya `session.stuck`.
  - Baris log peringatan `session.stuck` dan `session.long_running` yang berulang menerapkan jeda eksponensial selama sesi tetap tidak berubah; upaya pemulihan tetap berjalan pada setiap ketukan Heartbeat terlepas dari jeda tersebut.

## Terkait

- [Pengelolaan sesi](/id/concepts/session)
- [Antrean pengarahan](/id/concepts/queue-steering)
- [Arahkan](/id/tools/steer)
- [Kebijakan percobaan ulang](/id/concepts/retry)
