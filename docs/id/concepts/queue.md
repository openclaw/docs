---
read_when:
    - Mengubah eksekusi atau konkurensi balasan otomatis
    - Menjelaskan mode /queue atau perilaku pengarahan pesan
summary: Mode antrean balasan otomatis, nilai default, dan penggantian per sesi
title: Antrean perintah
x-i18n:
    generated_at: "2026-07-20T03:51:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 69b40f67146226b0315492b27fc9d2218cace8bbd1eaff6514f7efb33b69d763
    source_path: concepts/queue.md
    workflow: 16
---

OpenClaw menserialkan proses balasan otomatis masuk (semua kanal) melalui antrean kecil dalam proses untuk mencegah beberapa proses agen bertabrakan, sekaligus tetap memungkinkan paralelisme yang aman antar-sesi.

## Mengapa

- Proses balasan otomatis dapat memerlukan banyak sumber daya (panggilan LLM) dan dapat bertabrakan ketika beberapa pesan masuk tiba dalam waktu berdekatan.
- Serialisasi mencegah perebutan sumber daya bersama (file sesi, log, stdin CLI) dan mengurangi kemungkinan terkena batas laju dari layanan hulu.

## Cara kerjanya

- Antrean FIFO yang mengenali lane menguras setiap lane dengan batas konkurensi yang dapat dikonfigurasi (default 1 untuk lane yang tidak dikonfigurasi; `main` secara default bernilai 4, `subagent` bernilai 8).
- `runEmbeddedAgent` memasukkan ke antrean berdasarkan **kunci sesi** (lane `session:<key>`) untuk menjamin hanya ada satu proses aktif per sesi.
- Setiap proses sesi kemudian dimasukkan ke **lane global** (`main` secara default) sehingga paralelisme keseluruhan dibatasi oleh `agents.defaults.maxConcurrent`.
- Saat pencatatan log mendetail diaktifkan, proses yang masuk antrean mengeluarkan pemberitahuan singkat jika menunggu lebih dari ~2s sebelum dimulai.
- Indikator pengetikan tetap langsung aktif saat pesan dimasukkan ke antrean (jika didukung oleh kanal), sehingga pengalaman pengguna tidak berubah selama proses menunggu gilirannya.

## Default

Jika tidak ditetapkan, semua permukaan kanal masuk menggunakan:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

Pengarahan dalam giliran yang sama merupakan default. Prompt yang tiba saat proses berlangsung disuntikkan ke runtime aktif jika proses tersebut dapat menerima pengarahan, sehingga proses sesi kedua tidak dimulai. Jika proses aktif tidak dapat menerima pengarahan, OpenClaw menunggu proses aktif selesai sebelum memulai prompt.

## Mode antrean

`/queue` mengontrol tindakan pesan masuk normal saat suatu sesi sudah memiliki proses aktif:

- `steer`: suntikkan pesan ke runtime aktif. OpenClaw mengirimkan semua pesan pengarahan yang tertunda **setelah giliran asisten saat ini selesai menjalankan panggilan alatnya**, sebelum panggilan LLM berikutnya; app-server Codex menerima satu `turn/steer` yang digabungkan. Jika proses tidak sedang melakukan streaming secara aktif atau pengarahan tidak tersedia, OpenClaw menunggu hingga proses aktif berakhir sebelum memulai prompt.
- `followup`: jangan lakukan pengarahan. Masukkan setiap pesan ke antrean untuk giliran agen berikutnya setelah proses saat ini berakhir.
- `collect`: jangan lakukan pengarahan. Gabungkan pesan yang mengantre menjadi **satu** giliran lanjutan setelah jendela tenang. Jika pesan menargetkan kanal/utas yang berbeda, pesan dikuras satu per satu untuk mempertahankan perutean.
- `interrupt`: batalkan proses aktif untuk sesi tersebut, lalu jalankan pesan terbaru.

Untuk pengaturan waktu dan perilaku dependensi khusus runtime, lihat [Antrean pengarahan](/id/concepts/queue-steering). Untuk perintah eksplisit `/steer <message>`, lihat [Arahkan](/id/tools/steer).

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

Opsi berlaku untuk pengiriman yang mengantre. `debounceMs` juga menetapkan jendela tenang pengarahan Codex dalam mode `steer`:

- `debounceMs`: jendela tenang sebelum menguras tindak lanjut yang mengantre atau batch pengumpulan; dalam mode Codex `steer`, jendela tenang sebelum mengirim `turn/steer` yang digabungkan. Angka tanpa satuan dianggap sebagai milidetik; satuan `ms`, `s`, `m`, `h`, dan `d` diterima oleh opsi `/queue`.
- `cap`: jumlah maksimum pesan yang mengantre per sesi. Nilai di bawah `1` diabaikan.
- `drop: "summarize"` (default): hapus entri antrean terlama sesuai kebutuhan, simpan ringkasan ringkas, dan suntikkan sebagai prompt lanjutan sintetis.
- `drop: "old"`: hapus entri antrean terlama sesuai kebutuhan, tanpa menyimpan ringkasan.
- `drop: "new"`: tolak pesan terbaru ketika antrean sudah penuh.

Default: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Pengarahan dan streaming

Saat streaming kanal bernilai `partial` atau `block`, pengarahan dapat terlihat seperti beberapa balasan singkat yang tampak ketika proses aktif mencapai batas runtime:

- `partial`: pratinjau dapat diselesaikan lebih awal, lalu pratinjau baru dimulai setelah pengarahan diterima.
- `block`: blok berukuran draf dapat menghasilkan tampilan berurutan yang sama.
- Tanpa streaming, pengarahan beralih menjadi tindak lanjut setelah proses aktif ketika runtime tidak dapat menerima pengarahan dalam giliran yang sama.

`steer` tidak membatalkan alat yang sedang berjalan. Gunakan `/queue interrupt` ketika pesan terbaru harus membatalkan proses saat ini.

## Prioritas

Untuk pemilihan mode, OpenClaw menentukan:

1. Penggantian `/queue` per sesi yang ditentukan secara inline atau disimpan.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. Default `steer`.

Untuk opsi, opsi `/queue` yang ditentukan secara inline atau disimpan lebih diprioritaskan daripada konfigurasi. Kemudian debounce khusus kanal (`messages.queue.debounceMsByChannel`), default debounce Plugin, opsi global `messages.queue`, dan default bawaan diterapkan sesuai urutan tersebut. `cap` dan `drop` adalah opsi global/sesi, bukan kunci konfigurasi per kanal.

## Penggantian per sesi

- Kirim `/queue <steer|followup|collect|interrupt>` sebagai perintah mandiri untuk menyimpan mode antrean bagi sesi saat ini.
- Opsi dapat digabungkan: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` atau `/queue reset` menghapus penggantian sesi.

## Pembatalan giliran yang mengantre

Saat prompt berada dalam antrean tindak lanjut/pengumpulan (misalnya `chat.send` TUI atau
webchat yang tiba saat giliran lain aktif), Gateway menyimpan
**identitas pembatalan milik Gateway** untuk `runId` klien tersebut hingga konten yang mengantre
dijalankan atau dihapus. Identitas mengikuti konten yang digabungkan ke dalam
ringkasan luapan.

- `chat.abort` dengan `runId` tertentu membatalkan giliran tersebut saat masih
  mengantre, jika pemohon berwenang (aturan kepemilikan yang sama dengan proses aktif).
- `chat.abort` untuk sesi tanpa `runId` membatalkan **giliran mengantre yang diizinkan
  terlebih dahulu**, lalu membatalkan proses aktif yang diizinkan. Urutan tersebut mencegah pengurasan antrean
  menaikkan pekerjaan ke dalam sesi yang dihentikan sebagian.
- Menghapus seluruh antrean sesi tanpa pemeriksaan per pemohon bukan merupakan
  jalur penghentian untuk sesi dengan beberapa pemilik.
- Waktu tunggu antrean tidak diproyeksikan sebagai proses agen aktif untuk `sessions.list` dan
  tidak memiliki semantik batas waktu proses aktif; hanya fase aktif yang memilikinya.

Klien yang didukung Gateway (termasuk `openclaw tui`) meneruskan prompt saat proses berlangsung dan
membiarkan Gateway menerapkan mode antrean. Esc/`/stop` menggunakan pembatalan bercakupan sesi
agar hilangnya handel lokal tidak menyebabkan prompt yang masih mengantre tetap berjalan.

`openclaw chat` dan `openclaw tui --local` menerapkan empat mode yang sama dalam
runtime tertanam. `steer` lokal menyuntikkan ke proses tertanam yang aktif saat
runtime tersebut menerima pengarahan dan jika tidak akan menjadi tindak lanjut; `followup` dan
`collect` tetap menjadi pekerjaan lokal yang tertunda; `interrupt` membatalkan proses lokal aktif
sebelum memulai pesan terbaru. Perintah eksplisit `/steer <message>`
bukan perintah mode lokal.

## Cakupan dan jaminan

- Berlaku untuk proses agen balasan otomatis di semua kanal masuk yang menggunakan pipeline balasan Gateway (web WhatsApp, Telegram, Slack, Discord, Signal, iMessage, webchat, dan sebagainya).
- Lane default (`main`) berlaku di seluruh proses untuk pesan masuk + heartbeat utama; tetapkan `agents.defaults.maxConcurrent` agar beberapa sesi dapat berjalan secara paralel.
- Lane tambahan mungkin tersedia (misalnya `cron`, `cron-nested`, `nested`, `subagent`) agar pekerjaan latar belakang dapat berjalan secara paralel tanpa memblokir balasan masuk. Giliran agen Cron terisolasi menahan satu slot `cron` sementara eksekusi agen internalnya menggunakan `cron-nested`. Alur `nested` bersama yang bukan Cron mempertahankan perilaku lane masing-masing. Proses terpisah ini dilacak sebagai [tugas latar belakang](/id/automation/tasks).
- Lane per sesi menjamin bahwa hanya satu proses agen yang menyentuh sesi tertentu pada satu waktu.
- Tanpa dependensi eksternal atau utas pekerja latar belakang; hanya TypeScript + promise.

## Pemecahan masalah

- Jika perintah tampak macet, aktifkan log mendetail dan cari baris "queued for ...ms" untuk memastikan antrean sedang dikuras.
- Proses app-server Codex yang menerima suatu giliran lalu berhenti mengeluarkan progres akan diinterupsi oleh adaptor Codex agar lane sesi aktif dapat dilepaskan alih-alih menunggu batas waktu proses luar.
- Saat diagnostik diaktifkan, sesi yang tetap berada dalam `processing` melewati ambang peringatan bawaan tanpa balasan, alat, status, blok, atau progres ACP yang teramati diklasifikasikan berdasarkan aktivitas saat ini:
  - Pekerjaan aktif dengan progres terbaru dicatat sebagai `session.long_running`. Panggilan model senyap yang memiliki pemilik juga tetap berstatus `session.long_running` hingga ambang pembatalan bawaan agar penyedia yang lambat atau tidak melakukan streaming tidak dilaporkan macet terlalu dini.
  - Pekerjaan aktif tanpa progres terbaru dicatat sebagai `session.stalled`; panggilan model yang memiliki pemilik, panggilan alat yang terblokir, dan proses tertanam yang macet beralih ke `session.stalled` pada atau setelah ambang pembatalan. Aktivitas model/alat usang tanpa pemilik tidak disembunyikan sebagai proses jangka panjang.
  - `session.stuck` dicadangkan untuk pembukuan sesi usang yang dapat dipulihkan, termasuk sesi antrean menganggur dengan aktivitas model/alat usang tanpa pemilik.
  - `session.stuck` selalu memicu pemulihan yang dapat melepaskan lane sesi yang terdampak. Klasifikasi `session.stalled` setelah ambang pembatalan (panggilan alat terblokir, panggilan model macet, atau proses tertanam macet) juga dapat memicu pemulihan melalui pembatalan aktif, sehingga kedua klasifikasi dapat melepaskan antrean yang macet, bukan hanya `session.stuck`.
  - Baris log peringatan `session.stuck` dan `session.long_running` yang berulang meningkatkan interval secara eksponensial selama sesi tetap tidak berubah; upaya pemulihan tetap berjalan pada setiap tick heartbeat tanpa dipengaruhi peningkatan interval tersebut.

## Terkait

- [Manajemen sesi](/id/concepts/session)
- [Antrean pengarahan](/id/concepts/queue-steering)
- [Arahkan](/id/tools/steer)
- [Kebijakan percobaan ulang](/id/concepts/retry)
