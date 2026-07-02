---
read_when:
    - Menjadwalkan pekerjaan latar belakang atau wakeup
    - Menghubungkan pemicu eksternal (Webhook, Gmail) ke OpenClaw
    - Memutuskan antara Heartbeat dan Cron untuk tugas terjadwal
sidebarTitle: Scheduled tasks
summary: Pekerjaan terjadwal, Webhook, dan pemicu Gmail PubSub untuk penjadwal Gateway
title: Tugas terjadwal
x-i18n:
    generated_at: "2026-07-02T01:14:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 314b02ed3002843afe9d96e948de362b6111e648eb0e7106ec2ccc230cf50692
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron adalah penjadwal bawaan Gateway. Cron mempertahankan job, membangunkan agen pada waktu yang tepat, dan dapat mengirimkan output kembali ke saluran chat atau endpoint webhook.

## Mulai cepat

<Steps>
  <Step title="Tambahkan pengingat sekali jalan">
    ```bash
    openclaw cron create "2026-02-01T16:00:00Z" \
      --name "Reminder" \
      --session main \
      --system-event "Reminder: check the cron docs draft" \
      --wake now \
      --delete-after-run
    ```
  </Step>
  <Step title="Periksa job Anda">
    ```bash
    openclaw cron list
    openclaw cron get <job-id>
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="Lihat riwayat run">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## Cara kerja cron

- Cron berjalan **di dalam proses Gateway** (bukan di dalam model).
- Definisi job, status runtime, dan riwayat run dipertahankan di basis data status SQLite bersama milik OpenClaw sehingga restart tidak menghilangkan jadwal.
- Saat upgrade, jalankan `openclaw doctor --fix` untuk mengimpor file legacy `~/.openclaw/cron/jobs.json`, `jobs-state.json`, dan `runs/*.jsonl` ke SQLite dan mengganti namanya dengan sufiks `.migrated`. Baris job yang formatnya buruk dilewati dari runtime dan disalin ke `jobs-quarantine.json` untuk perbaikan atau peninjauan nanti.
- `cron.store` masih menamai kunci penyimpanan cron logis dan jalur impor doctor. Setelah impor, mengedit file JSON tersebut tidak lagi mengubah job cron aktif; gunakan `openclaw cron add|edit|remove` atau metode RPC cron Gateway sebagai gantinya.
- Semua eksekusi cron membuat catatan [tugas latar belakang](/id/automation/tasks).
- Saat startup Gateway, job agent-turn terisolasi yang sudah terlambat dijadwalkan ulang ke luar jendela koneksi saluran alih-alih diputar ulang segera, sehingga startup Discord/Telegram dan penyiapan perintah native tetap responsif setelah restart.
- Job sekali jalan (`--at`) otomatis dihapus setelah berhasil secara default.
- Run cron terisolasi berupaya sebaik mungkin menutup tab/proses browser yang terlacak untuk sesi `cron:<jobId>` miliknya ketika run selesai, sehingga otomatisasi browser yang terlepas tidak meninggalkan proses yatim.
- Run cron terisolasi yang menerima izin pembersihan mandiri cron yang sempit masih dapat membaca status penjadwal, daftar yang difilter untuk dirinya sendiri berisi job saat ini, dan riwayat run job tersebut, sehingga pemeriksaan status/Heartbeat dapat memeriksa jadwalnya sendiri tanpa memperoleh akses mutasi cron yang lebih luas.
- Run cron terisolasi juga melindungi dari balasan pengakuan yang kedaluwarsa. Jika hasil pertama hanya pembaruan status sementara (`on it`, `pulling everything together`, dan petunjuk serupa) dan tidak ada run subagen turunan yang masih bertanggung jawab atas jawaban akhir, OpenClaw meminta ulang sekali untuk hasil sebenarnya sebelum pengiriman.
- Run cron terisolasi menggunakan metadata penolakan eksekusi terstruktur dari run tertanam, termasuk wrapper node-host `UNAVAILABLE` yang pesan error bersarangnya dimulai dengan `SYSTEM_RUN_DENIED` atau `INVALID_REQUEST`, sehingga perintah yang diblokir tidak dilaporkan sebagai run hijau sementara prosa asisten biasa tidak diperlakukan sebagai penolakan.
- Run cron terisolasi juga memperlakukan kegagalan agen tingkat run sebagai error job meskipun tidak ada payload balasan yang dihasilkan, sehingga kegagalan model/penyedia menaikkan penghitung error dan memicu notifikasi kegagalan alih-alih menandai job sebagai berhasil.
- Ketika job agent-turn terisolasi mencapai `timeoutSeconds`, cron membatalkan run agen yang mendasarinya dan memberinya jendela pembersihan singkat. Jika run tidak selesai mengosongkan antrean, pembersihan milik Gateway memaksa penghapusan kepemilikan sesi run tersebut sebelum cron mencatat timeout, sehingga pekerjaan chat yang mengantre tidak tertinggal di belakang sesi pemrosesan yang kedaluwarsa.
- Jika agent-turn terisolasi macet sebelum runner dimulai atau sebelum panggilan model pertama, cron mencatat timeout khusus fase seperti `setup timed out before runner start` atau `stalled before first model call (last phase: context-engine)`. Watchdog ini mencakup penyedia tertanam dan penyedia berbasis CLI sebelum proses CLI eksternalnya benar-benar dimulai, dan dibatasi secara independen dari nilai `timeoutSeconds` yang panjang sehingga kegagalan cold-start/auth/konteks muncul cepat alih-alih menunggu seluruh anggaran job.
- Jika Anda menggunakan cron sistem atau penjadwal eksternal lain untuk menjalankan `openclaw agent`, bungkus dengan eskalasi hard-kill meskipun CLI menangani `SIGTERM`/`SIGINT`. Run berbasis Gateway meminta Gateway membatalkan run yang diterima; run fallback lokal dan tertanam menerima sinyal pembatalan yang sama. Untuk GNU `timeout`, pilih `timeout -k 60 600 openclaw agent ...` daripada `timeout 600 ...`; nilai `-k` adalah backstop supervisor jika proses tidak dapat selesai. Untuk unit systemd, pertahankan bentuk yang sama dengan menggunakan sinyal henti `SIGTERM` plus jendela tenggang seperti `TimeoutStopSec` sebelum kill akhir apa pun. Jika retry menggunakan ulang `--run-id` saat run Gateway asli masih aktif, duplikat dilaporkan sebagai sedang berjalan alih-alih memulai run kedua.

<a id="maintenance"></a>

<Note>
Rekonsiliasi tugas untuk cron pertama-tama dimiliki runtime, lalu didukung riwayat tahan lama: tugas cron aktif tetap live selama runtime cron masih melacak job tersebut sebagai sedang berjalan, meskipun baris sesi anak lama masih ada. Setelah runtime berhenti memiliki job dan jendela tenggang 5 menit berakhir, pemeriksaan pemeliharaan memeriksa log run yang dipertahankan dan status job untuk run `cron:<jobId>:<startedAt>` yang cocok. Jika riwayat tahan lama tersebut menunjukkan hasil terminal, ledger tugas difinalisasi darinya; jika tidak, pemeliharaan milik Gateway dapat menandai tugas sebagai `lost`. Audit CLI offline dapat memulihkan dari riwayat tahan lama, tetapi tidak memperlakukan set job aktif dalam prosesnya sendiri yang kosong sebagai bukti bahwa run cron milik Gateway telah hilang.
</Note>

## Jenis jadwal

| Jenis   | Flag CLI  | Deskripsi                                               |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | Timestamp sekali jalan (ISO 8601 atau relatif seperti `20m`) |
| `every` | `--every` | Interval tetap                                          |
| `cron`  | `--cron`  | Ekspresi cron 5-field atau 6-field dengan `--tz` opsional |

Timestamp tanpa zona waktu diperlakukan sebagai UTC. Tambahkan `--tz America/New_York` untuk penjadwalan jam dinding lokal.

Ekspresi berulang di awal jam otomatis digeser hingga 5 menit untuk mengurangi lonjakan beban. Gunakan `--exact` untuk memaksa waktu presisi atau `--stagger 30s` untuk jendela eksplisit.

### Day-of-month dan day-of-week menggunakan logika OR

Ekspresi cron diuraikan oleh [croner](https://github.com/Hexagon/croner). Ketika field day-of-month dan day-of-week sama-sama bukan wildcard, croner mencocokkan ketika **salah satu** field cocok — bukan keduanya. Ini adalah perilaku cron Vixie standar.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Ini berjalan sekitar 5–6 kali per bulan alih-alih 0–1 kali per bulan. OpenClaw menggunakan perilaku OR default Croner di sini. Untuk mewajibkan kedua kondisi, gunakan modifier day-of-week `+` milik Croner (`0 9 15 * +1`) atau jadwalkan pada satu field dan lindungi field lainnya dalam prompt atau perintah job Anda.

## Gaya eksekusi

| Gaya           | Nilai `--session`   | Berjalan di             | Paling cocok untuk             |
| -------------- | ------------------- | ----------------------- | ------------------------------ |
| Sesi utama     | `main`              | Lane wake cron khusus   | Pengingat, peristiwa sistem    |
| Terisolasi     | `isolated`          | `cron:<jobId>` khusus   | Laporan, pekerjaan latar belakang |
| Sesi saat ini  | `current`           | Run cron terlepas       | Pekerjaan berulang sadar konteks |
| Sesi kustom    | `session:custom-id` | Run cron terlepas       | Menargetkan chat/sesi yang diketahui |

<AccordionGroup>
  <Accordion title="Sesi utama vs terisolasi vs kustom">
    Job **Sesi utama** mengantrekan peristiwa sistem ke lane run milik cron dan secara opsional membangunkan Heartbeat (`--wake now` atau `--wake next-heartbeat`). Job ini dapat menggunakan konteks pengiriman terakhir sesi utama target untuk balasan, tetapi tidak menambahkan giliran cron rutin ke lane chat manusia dan tidak memperpanjang kesegaran reset harian/idle untuk sesi target. Job **Terisolasi** menjalankan agent turn khusus dengan sesi baru. Job sesi **Saat ini** dan **kustom** (`current`, `session:xxx`) dapat menggunakan chat/sesi terpilih untuk konteks pengiriman dan penyemaian preferensi yang aman, tetapi setiap run tetap dieksekusi dalam sesi cron terlepas sehingga pekerjaan terjadwal tidak memblokir atau mengotori transkrip percakapan live.

    Peristiwa cron sesi utama adalah pengingat peristiwa sistem yang berdiri sendiri. Peristiwa ini tidak
    otomatis menyertakan instruksi "Read HEARTBEAT.md" dari prompt Heartbeat
    default. Jika pengingat berulang harus merujuk ke
    `HEARTBEAT.md`, katakan itu secara eksplisit dalam teks peristiwa cron atau dalam
    instruksi agen sendiri.

  </Accordion>
  <Accordion title="Arti 'sesi baru' untuk job terlepas">
    Untuk job terisolasi, sesi saat ini, dan sesi kustom, "sesi baru" berarti id transkrip/sesi baru untuk setiap run. OpenClaw dapat membawa preferensi aman seperti pengaturan thinking/fast/verbose, label, serta override model/auth yang dipilih pengguna secara eksplisit. Run terlepas tidak mewarisi konteks percakapan sekitar dari baris cron yang lebih lama: routing saluran/grup, kebijakan kirim atau antre, elevasi, asal, atau binding runtime ACP. Letakkan status pekerjaan berulang yang tahan lama di prompt, file workspace, alat, atau sistem yang dioperasikan job alih-alih bergantung pada transkrip chat live sebagai memori cron.
  </Accordion>
  <Accordion title="Pembersihan runtime">
    Untuk job terisolasi, teardown runtime kini mencakup pembersihan browser sebaik mungkin untuk sesi cron tersebut. Kegagalan pembersihan diabaikan sehingga hasil cron sebenarnya tetap menang.

    Run cron terisolasi juga membuang instance runtime MCP bundled apa pun yang dibuat untuk job melalui jalur pembersihan runtime bersama. Ini sesuai dengan cara klien MCP sesi utama dan sesi kustom dibongkar, sehingga job cron terisolasi tidak membocorkan proses anak stdio atau koneksi MCP berumur panjang lintas run.

  </Accordion>
  <Accordion title="Pengiriman subagen dan Discord">
    Ketika run cron terisolasi mengorkestrasi subagen, pengiriman juga lebih memilih output turunan akhir daripada teks sementara induk yang kedaluwarsa. Jika turunan masih berjalan, OpenClaw menekan pembaruan induk parsial tersebut alih-alih mengumumkannya.

    Untuk target pengumuman Discord yang hanya teks, OpenClaw mengirim teks asisten akhir kanonis satu kali alih-alih memutar ulang payload teks streamed/sementara sekaligus jawaban akhir. Payload media dan Discord terstruktur tetap dikirim sebagai payload terpisah sehingga lampiran dan komponen tidak terhapus.

  </Accordion>
</AccordionGroup>

### Payload perintah

Gunakan payload perintah untuk skrip deterministik yang harus berjalan di dalam penjadwal Gateway tanpa memulai agent turn terisolasi berbasis model. Job perintah dieksekusi di host Gateway, menangkap stdout/stderr, mencatat run dalam riwayat cron, dan menggunakan ulang mode pengiriman `announce`, `webhook`, dan `none` yang sama seperti job terisolasi.

<Note>
Command cron adalah surface otomatisasi Gateway admin-operator, bukan panggilan
`tools.exec` agen. Membuat, memperbarui, menghapus, atau menjalankan job cron
secara manual memerlukan `operator.admin`; run perintah terjadwal nantinya dieksekusi di dalam
proses Gateway sebagai otomatisasi yang ditulis admin tersebut. Kebijakan exec agen seperti
`tools.exec.mode`, prompt persetujuan, dan allowlist alat per agen mengatur
alat exec yang terlihat model, bukan payload command cron.
</Note>

```bash
openclaw cron create "*/15 * * * *" \
  --name "Queue depth probe" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` menyimpan `argv: ["sh", "-lc", <shell>]`. Gunakan `--command-argv '["node","scripts/report.mjs"]'` ketika Anda ingin eksekusi argv persis tanpa parsing shell. Field opsional `--command-env KEY=VALUE`, `--command-input`, `--timeout-seconds`, `--no-output-timeout-seconds`, dan `--output-max-bytes` mengontrol lingkungan proses, stdin, dan batas output.

Jika stdout tidak kosong, teks tersebut adalah hasil yang dikirim. Jika stdout kosong dan stderr tidak kosong, stderr dikirim. Jika kedua stream ada, Cron mengirim blok kecil `stdout:` / `stderr:`. Kode keluar nol mencatat run sebagai `ok`; keluar non-nol, sinyal, batas waktu, atau batas waktu tanpa output mencatat `error` dan dapat memicu peringatan kegagalan. Perintah yang hanya mencetak `NO_REPLY` menggunakan penekanan token senyap Cron normal dan tidak mengirim apa pun kembali ke chat.

### Opsi payload untuk pekerjaan terisolasi

<ParamField path="--message" type="string" required>
  Teks prompt (wajib untuk terisolasi).
</ParamField>
<ParamField path="--model" type="string">
  Override model; menggunakan model yang diizinkan dan dipilih untuk pekerjaan.
</ParamField>
<ParamField path="--fallbacks" type="string">
  Daftar model cadangan per pekerjaan, misalnya `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`. Berikan `--fallbacks ""` untuk run ketat tanpa cadangan.
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  Pada `cron edit`, menghapus override cadangan per pekerjaan agar pekerjaan mengikuti prioritas cadangan yang dikonfigurasi. Tidak dapat digabungkan dengan `--fallbacks`.
</ParamField>
<ParamField path="--clear-model" type="boolean">
  Pada `cron edit`, menghapus override model per pekerjaan agar pekerjaan mengikuti prioritas pemilihan model Cron normal (override sesi Cron tersimpan jika ditetapkan, jika tidak model agen/default). Tidak dapat digabungkan dengan `--model`.
</ParamField>
<ParamField path="--thinking" type="string">
  Override tingkat berpikir.
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  Pada `cron edit`, menghapus override berpikir per pekerjaan agar pekerjaan mengikuti prioritas berpikir Cron normal. Tidak dapat digabungkan dengan `--thinking`.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Lewati injeksi file bootstrap workspace.
</ParamField>
<ParamField path="--tools" type="string">
  Batasi alat yang dapat digunakan pekerjaan, misalnya `--tools exec,read`.
</ParamField>

`--model` menggunakan model yang diizinkan dan dipilih sebagai model utama pekerjaan tersebut. Ini tidak sama dengan override `/model` sesi chat: rantai cadangan yang dikonfigurasi tetap berlaku ketika model utama pekerjaan gagal. Jika model yang diminta tidak diizinkan atau tidak dapat di-resolve, Cron menggagalkan run dengan kesalahan validasi eksplisit, bukan diam-diam kembali ke pemilihan model agen/default pekerjaan.

Pekerjaan Cron juga dapat membawa `fallbacks` tingkat payload. Jika ada, daftar itu menggantikan rantai cadangan yang dikonfigurasi untuk pekerjaan. Gunakan `fallbacks: []` dalam payload/API pekerjaan ketika Anda menginginkan run Cron ketat yang hanya mencoba model terpilih. Jika pekerjaan memiliki `--model` tetapi tidak memiliki cadangan payload maupun cadangan yang dikonfigurasi, OpenClaw meneruskan override cadangan kosong eksplisit agar model utama agen tidak ditambahkan sebagai target percobaan ulang ekstra yang tersembunyi.

Pemeriksaan awal penyedia lokal menelusuri cadangan yang dikonfigurasi sebelum menandai run Cron sebagai `skipped`; `fallbacks: []` membuat jalur pemeriksaan awal itu tetap ketat.

Prioritas pemilihan model untuk pekerjaan terisolasi adalah:

1. Override model kait Gmail (ketika run berasal dari Gmail dan override itu diizinkan)
2. `model` payload per pekerjaan
3. Override model sesi Cron tersimpan yang dipilih pengguna
4. Pemilihan model agen/default

Mode cepat juga mengikuti pilihan live yang sudah di-resolve. Jika konfigurasi model terpilih memiliki `params.fastMode`, Cron terisolasi menggunakannya secara default. Override `fastMode` sesi tersimpan tetap menang atas konfigurasi dalam kedua arah. Mode otomatis menggunakan batas `params.fastAutoOnSeconds` milik model terpilih jika ada, dengan default 60 detik.

Jika run terisolasi menemui serah-terima peralihan model live, Cron mencoba lagi dengan penyedia/model yang dialihkan dan menyimpan pilihan live tersebut untuk run aktif sebelum mencoba lagi. Ketika peralihan juga membawa profil autentikasi baru, Cron juga menyimpan override profil autentikasi itu untuk run aktif. Percobaan ulang dibatasi: setelah percobaan awal ditambah 2 percobaan ulang peralihan, Cron membatalkan alih-alih berulang selamanya.

Sebelum run Cron terisolasi memasuki runner agen, OpenClaw memeriksa endpoint penyedia lokal yang dapat dijangkau untuk penyedia `api: "ollama"` dan `api: "openai-completions"` yang dikonfigurasi dengan `baseUrl` berupa local loopback, jaringan privat, atau `.local`. Jika endpoint itu mati, run dicatat sebagai `skipped` dengan kesalahan penyedia/model yang jelas alih-alih memulai panggilan model. Hasil endpoint disimpan dalam cache selama 5 menit, sehingga banyak pekerjaan jatuh tempo yang menggunakan server lokal Ollama, vLLM, SGLang, atau LM Studio yang sama-sama mati berbagi satu probe kecil alih-alih membuat badai permintaan. Run pemeriksaan awal penyedia yang dilewati tidak menaikkan backoff kesalahan eksekusi; aktifkan `failureAlert.includeSkipped` ketika Anda menginginkan notifikasi skip berulang.

## Pengiriman dan output

| Mode       | Yang terjadi                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Kirim teks akhir lewat cadangan ke target jika agen tidak mengirim |
| `webhook`  | POST payload peristiwa selesai ke URL                               |
| `none`     | Tidak ada pengiriman cadangan runner                                |

Gunakan `--announce --channel telegram --to "-1001234567890"` untuk pengiriman channel. Untuk topik forum Telegram, gunakan `-1001234567890:topic:123`; OpenClaw juga menerima singkatan milik Telegram `-1001234567890:123`. Pemanggil RPC/config langsung dapat meneruskan `delivery.threadId` sebagai string atau angka. Target Slack/Discord/Mattermost harus menggunakan prefiks eksplisit (`channel:<id>`, `user:<id>`). ID ruang Matrix peka huruf besar-kecil; gunakan ID ruang persis atau bentuk `room:!room:server` dari Matrix.

Ketika pengiriman announce menggunakan `channel: "last"` atau menghilangkan `channel`, target berprefiks penyedia seperti `telegram:123` dapat memilih channel sebelum Cron kembali ke riwayat sesi atau satu channel yang dikonfigurasi. Hanya prefiks yang diiklankan oleh Plugin yang dimuat yang menjadi pemilih penyedia. Jika `delivery.channel` eksplisit, prefiks target harus menamai penyedia yang sama; misalnya, `channel: "whatsapp"` dengan `to: "telegram:123"` ditolak alih-alih membiarkan WhatsApp menafsirkan ID Telegram sebagai nomor telepon. Prefiks jenis target dan layanan seperti `channel:<id>`, `user:<id>`, `imessage:<handle>`, dan `sms:<number>` tetap merupakan sintaks target milik channel, bukan pemilih penyedia.

Untuk pekerjaan terisolasi, pengiriman chat dibagikan. Jika rute chat tersedia, agen dapat menggunakan alat `message` bahkan ketika pekerjaan menggunakan `--no-deliver`. Jika agen mengirim ke target yang dikonfigurasi/saat ini, OpenClaw melewati announce cadangan. Jika tidak, `announce`, `webhook`, dan `none` hanya mengontrol apa yang dilakukan runner dengan balasan akhir setelah giliran agen.

Ketika agen membuat pengingat terisolasi dari chat aktif, OpenClaw menyimpan target pengiriman live yang dipertahankan untuk rute announce cadangan. Kunci sesi internal dapat berupa huruf kecil; target pengiriman penyedia tidak direkonstruksi dari kunci tersebut ketika konteks chat saat ini tersedia.

Pengiriman announce implisit menggunakan allowlist channel yang dikonfigurasi untuk memvalidasi dan merutekan ulang target usang. Persetujuan penyimpanan pasangan DM bukan penerima otomatisasi cadangan; tetapkan `delivery.to` atau konfigurasikan entri `allowFrom` channel ketika pekerjaan terjadwal harus mengirim secara proaktif ke DM.

## Bahasa output

Pekerjaan Cron tidak menyimpulkan bahasa balasan dari channel, lokal, atau pesan sebelumnya. Letakkan aturan bahasa dalam pesan atau templat terjadwal:

```bash
openclaw cron edit <jobId> \
  --message "Summarize the updates. Respond in Chinese; keep URLs, code, and product names unchanged."
```

Untuk file templat, pertahankan instruksi bahasa dalam prompt yang dirender dan verifikasi placeholder seperti `{{language}}` terisi sebelum pekerjaan berjalan. Jika output mencampur bahasa, buat aturannya eksplisit, misalnya: "Use Chinese for narrative text and keep technical terms in English."

Notifikasi kegagalan mengikuti jalur tujuan terpisah:

- `cron.failureDestination` menetapkan default global untuk notifikasi kegagalan.
- `job.delivery.failureDestination` menimpa itu per pekerjaan.
- Jika keduanya tidak ditetapkan dan pekerjaan sudah mengirim melalui `announce`, notifikasi kegagalan kini kembali ke target announce utama tersebut.
- `delivery.failureDestination` hanya didukung pada pekerjaan `sessionTarget="isolated"` kecuali mode pengiriman utama adalah `webhook`.
- `failureAlert.includeSkipped: true` memasukkan pekerjaan atau kebijakan peringatan Cron global ke peringatan run yang dilewati berulang. Run yang dilewati mempertahankan penghitung skip beruntun terpisah, sehingga tidak memengaruhi backoff kesalahan eksekusi.

## Contoh CLI

<Tabs>
  <Tab title="Pengingat sekali jalan">
    ```bash
    openclaw cron add \
      --name "Calendar check" \
      --at "20m" \
      --session main \
      --system-event "Next heartbeat: check calendar." \
      --wake now
    ```
  </Tab>
  <Tab title="Pekerjaan terisolasi berulang">
    ```bash
    openclaw cron create "0 7 * * *" \
      "Summarize overnight updates." \
      --name "Morning brief" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --announce \
      --channel slack \
      --to "channel:C1234567890"
    ```
  </Tab>
  <Tab title="Override model dan berpikir">
    ```bash
    openclaw cron add \
      --name "Deep analysis" \
      --cron "0 6 * * 1" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --message "Weekly deep analysis of project progress." \
      --model "opus" \
      --thinking high \
      --announce
    ```
  </Tab>
  <Tab title="Output Webhook">
    ```bash
    openclaw cron create "0 18 * * 1-5" \
      "Summarize today's deploys as JSON." \
      --name "Deploy digest" \
      --webhook "https://example.invalid/openclaw/cron"
    ```
  </Tab>
  <Tab title="Output perintah">
    ```bash
    openclaw cron create "*/15 * * * *" \
      --name "Queue depth probe" \
      --command "scripts/check-queue.sh" \
      --command-cwd "/srv/app" \
      --announce \
      --channel telegram \
      --to "-1001234567890"
    ```
  </Tab>
</Tabs>

## Webhook

Gateway dapat mengekspos endpoint Webhook HTTP untuk pemicu eksternal. Aktifkan dalam config:

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
  },
}
```

### Autentikasi

Setiap permintaan harus menyertakan token kait melalui header:

- `Authorization: Bearer <token>` (direkomendasikan)
- `x-openclaw-token: <token>`

Token query-string ditolak.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    Antrekan peristiwa sistem untuk sesi utama:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/wake \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"text":"New email received","mode":"now"}'
    ```

    <ParamField path="text" type="string" required>
      Deskripsi peristiwa.
    </ParamField>
    <ParamField path="mode" type="string" default="now">
      `now` atau `next-heartbeat`.
    </ParamField>

  </Accordion>
  <Accordion title="POST /hooks/agent">
    Jalankan giliran agen terisolasi:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    Bidang: `message` (wajib), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Kait terpetakan (POST /hooks/<name>)">
    Nama kait kustom di-resolve melalui `hooks.mappings` dalam config. Pemetaan dapat mengubah payload arbitrer menjadi tindakan `wake` atau `agent` dengan templat atau transformasi kode.
  </Accordion>
</AccordionGroup>

<Warning>
Simpan endpoint kait di balik local loopback, tailnet, atau reverse proxy tepercaya.

- Gunakan token hook khusus; jangan gunakan ulang token autentikasi Gateway.
- Pertahankan `hooks.path` pada subjalur khusus; `/` ditolak.
- Atur `hooks.allowedAgentIds` untuk membatasi agen efektif mana yang dapat ditargetkan hook, termasuk agen default ketika `agentId` dihilangkan.
- Pertahankan `hooks.allowRequestSessionKey=false` kecuali Anda memerlukan sesi yang dipilih pemanggil.
- Jika Anda mengaktifkan `hooks.allowRequestSessionKey`, atur juga `hooks.allowedSessionKeyPrefixes` untuk membatasi bentuk kunci sesi yang diizinkan.
- Payload hook dibungkus dengan batas keamanan secara default.

</Warning>

## Integrasi Gmail PubSub

Hubungkan pemicu kotak masuk Gmail ke OpenClaw melalui Google PubSub.

<Note>
**Prasyarat:** CLI `gcloud`, `gog` (gogcli), hook OpenClaw diaktifkan, Tailscale untuk endpoint HTTPS publik.
</Note>

### Penyiapan wizard (direkomendasikan)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Ini menulis konfigurasi `hooks.gmail`, mengaktifkan preset Gmail, dan menggunakan Tailscale Funnel untuk endpoint push.

### Mulai otomatis Gateway

Ketika `hooks.enabled=true` dan `hooks.gmail.account` diatur, Gateway memulai `gog gmail watch serve` saat boot dan memperbarui watch secara otomatis. Atur `OPENCLAW_SKIP_GMAIL_WATCHER=1` untuk tidak menggunakannya.

### Penyiapan manual satu kali

<Steps>
  <Step title="Pilih proyek GCP">
    Pilih proyek GCP yang memiliki klien OAuth yang digunakan oleh `gog`:

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="Buat topik dan berikan akses push Gmail">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="Mulai watch">
    ```bash
    gog gmail watch start \
      --account openclaw@gmail.com \
      --label INBOX \
      --topic projects/<project-id>/topics/gog-gmail-watch
    ```
  </Step>
</Steps>

### Penggantian model Gmail

```json5
{
  hooks: {
    gmail: {
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

## Mengelola job

```bash
# List all jobs
openclaw cron list

# Get one stored job as JSON
openclaw cron get <jobId>

# Show one job, including resolved delivery route
openclaw cron show <jobId>

# Edit a job
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Force run a job now
openclaw cron run <jobId>

# Force run a job now and wait for its terminal status
openclaw cron run <jobId> --wait --wait-timeout 10m --poll-interval 2s

# Run only if due
openclaw cron run <jobId> --due

# View run history
openclaw cron runs --id <jobId> --limit 50

# View one exact run
openclaw cron runs --id <jobId> --run-id <runId>

# Delete a job
openclaw cron remove <jobId>

# Agent selection (multi-agent setups)
openclaw cron create "0 6 * * *" "Check ops queue" --name "Ops sweep" --session isolated --agent ops
openclaw cron edit <jobId> --clear-agent
```

`openclaw cron run <jobId>` kembali setelah mengantrekan eksekusi manual. Gunakan `--wait` untuk hook shutdown, skrip pemeliharaan, atau otomatisasi lain yang harus memblokir hingga eksekusi yang diantrekan selesai. Mode tunggu melakukan polling pada `runId` persis yang dikembalikan; mode ini keluar `0` untuk status `ok` dan non-nol untuk `error`, `skipped`, atau waktu tunggu habis.

Alat agen `cron` mengembalikan ringkasan job ringkas (`id`, `name`, `enabled`, `nextRunAtMs`, `scheduleKind`, `lastRunStatus`) dari `cron(action: "list")`; gunakan `cron(action: "get", jobId: "...")` untuk satu definisi job lengkap. Pemanggil Gateway langsung dapat meneruskan `compact: true` ke `cron.list`; menghilangkannya mempertahankan respons lengkap yang ada dengan pratinjau pengiriman.

`openclaw cron create` adalah alias untuk `openclaw cron add`, dan job baru dapat menggunakan jadwal posisional (`"0 9 * * 1"`, `"every 1h"`, `"20m"`, atau stempel waktu ISO) diikuti prompt agen posisional. Gunakan `--webhook <url>` pada `cron add|create` atau `cron edit` untuk melakukan POST payload eksekusi yang selesai ke endpoint HTTP. Pengiriman Webhook tidak dapat digabungkan dengan flag pengiriman chat seperti `--announce`, `--channel`, `--to`, `--thread-id`, atau `--account`. Pada `cron edit`, `--clear-channel`, `--clear-to`, `--clear-thread-id`, dan `--clear-account` menghapus bidang perutean tersebut satu per satu (masing-masing ditolak bersama flag set yang cocok), yang berbeda dari `--no-deliver` yang menonaktifkan pengiriman fallback runner.

<Note>
Catatan penggantian model:

- `openclaw cron add|edit --model ...` mengubah model yang dipilih job.
- Jika model diizinkan, provider/model persis tersebut mencapai eksekusi agen terisolasi.
- Jika tidak diizinkan atau tidak dapat diselesaikan, cron menggagalkan eksekusi dengan kesalahan validasi eksplisit.
- Patch payload API `cron.update` dapat mengatur `model: null` untuk menghapus penggantian model job yang tersimpan.
- `openclaw cron edit <job-id> --clear-model` menghapus penggantian tersebut dari CLI (efek yang sama seperti patch `model: null`) dan tidak dapat digabungkan dengan `--model`.
- Rantai fallback yang dikonfigurasi tetap berlaku karena cron `--model` adalah primer job, bukan penggantian `/model` sesi.
- `openclaw cron add|edit --fallbacks ...` mengatur payload `fallbacks`, menggantikan fallback yang dikonfigurasi untuk job tersebut; `--fallbacks ""` menonaktifkan fallback dan membuat eksekusi ketat. `openclaw cron edit <job-id> --clear-fallbacks` menghapus penggantian per job.
- `--model` biasa tanpa daftar fallback eksplisit atau terkonfigurasi tidak jatuh ke primer agen sebagai target percobaan ulang tambahan diam-diam.

</Note>

## Konfigurasi

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 8,
    retry: {
      maxAttempts: 3,
      backoffMs: [60000, 120000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "server_error"],
    },
    webhookToken: "replace-with-dedicated-webhook-token",
    sessionRetention: "24h",
    runLog: { maxBytes: "2mb", keepLines: 2000 },
  },
}
```

`maxConcurrentRuns` membatasi dispatch cron terjadwal dan eksekusi giliran agen terisolasi, dan defaultnya adalah 8. Giliran agen cron terisolasi menggunakan lane eksekusi khusus antrean `cron-nested` secara internal, sehingga menaikkan nilai ini memungkinkan eksekusi LLM cron independen berjalan paralel, bukan hanya memulai pembungkus cron luarnya. Lane bersama non-cron `nested` tidak diperlebar oleh pengaturan ini.

`cron.store` adalah kunci penyimpanan logis dan jalur impor doctor lama. Jalankan `openclaw doctor --fix` untuk mengimpor penyimpanan JSON yang ada ke SQLite dan mengarsipkannya; perubahan cron mendatang harus melalui CLI atau API Gateway.

Nonaktifkan cron: `cron.enabled: false` atau `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Perilaku percobaan ulang">
    **Percobaan ulang sekali jalan**: kesalahan sementara (batas laju, overload, jaringan, kesalahan server) dicoba ulang hingga 3 kali dengan backoff eksponensial. Kesalahan permanen langsung dinonaktifkan.

    **Percobaan ulang berulang**: backoff eksponensial (30 detik hingga 60 menit) antar percobaan ulang. Backoff direset setelah eksekusi berhasil berikutnya.

  </Accordion>
  <Accordion title="Pemeliharaan">
    `cron.sessionRetention` (default `24h`) memangkas entri sesi eksekusi terisolasi. `cron.runLog.keepLines` membatasi baris riwayat eksekusi SQLite yang dipertahankan per job; `maxBytes` dipertahankan untuk kompatibilitas konfigurasi dengan log eksekusi lama berbasis file.
  </Accordion>
</AccordionGroup>

## Pemecahan masalah

### Tangga perintah

```bash
openclaw status
openclaw gateway status
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
openclaw doctor
```

<AccordionGroup>
  <Accordion title="Cron tidak berjalan">
    - Periksa var env `cron.enabled` dan `OPENCLAW_SKIP_CRON`.
    - Pastikan Gateway berjalan terus-menerus.
    - Untuk jadwal `cron`, verifikasi zona waktu (`--tz`) dibandingkan zona waktu host.
    - `reason: not-due` dalam output eksekusi berarti eksekusi manual diperiksa dengan `openclaw cron run <jobId> --due` dan job belum jatuh tempo.

  </Accordion>
  <Accordion title="Cron berjalan tetapi tidak ada pengiriman">
    - Mode pengiriman `none` berarti tidak ada pengiriman fallback runner yang diharapkan. Agen masih dapat mengirim langsung dengan alat `message` ketika rute chat tersedia.
    - Target pengiriman hilang/tidak valid (`channel`/`to`) berarti outbound dilewati.
    - Untuk Matrix, job yang disalin atau lama dengan ID ruang `delivery.to` huruf kecil dapat gagal karena ID ruang Matrix peka huruf besar-kecil. Edit job ke nilai persis `!room:server` atau `room:!room:server` dari Matrix.
    - Kesalahan autentikasi channel (`unauthorized`, `Forbidden`) berarti pengiriman diblokir oleh kredensial.
    - Jika eksekusi terisolasi hanya mengembalikan token diam (`NO_REPLY` / `no_reply`), OpenClaw menekan pengiriman outbound langsung dan juga menekan jalur ringkasan antrean fallback, sehingga tidak ada yang diposting kembali ke chat.
    - Jika agen harus mengirim pesan kepada pengguna sendiri, periksa bahwa job memiliki rute yang dapat digunakan (`channel: "last"` dengan chat sebelumnya, atau channel/target eksplisit).

  </Accordion>
  <Accordion title="Cron atau Heartbeat tampaknya mencegah rollover gaya /new">
    - Kesegaran reset harian dan idle tidak didasarkan pada `updatedAt`; lihat [Manajemen sesi](/id/concepts/session#session-lifecycle).
    - Wakeup cron, eksekusi Heartbeat, notifikasi exec, dan pembukuan Gateway dapat memperbarui baris sesi untuk perutean/status, tetapi tidak memperpanjang `sessionStartedAt` atau `lastInteractionAt`.
    - Untuk baris lama yang dibuat sebelum bidang tersebut ada, OpenClaw dapat memulihkan `sessionStartedAt` dari header sesi JSONL transkrip ketika file masih tersedia. Baris idle lama tanpa `lastInteractionAt` menggunakan waktu mulai yang dipulihkan tersebut sebagai baseline idle-nya.

  </Accordion>
  <Accordion title="Hal yang perlu diperhatikan terkait zona waktu">
    - Cron tanpa `--tz` menggunakan zona waktu host Gateway.
    - Jadwal `at` tanpa zona waktu diperlakukan sebagai UTC.
    - Heartbeat `activeHours` menggunakan resolusi zona waktu yang dikonfigurasi.

  </Accordion>
</AccordionGroup>

## Terkait

- [Otomatisasi](/id/automation) — semua mekanisme otomatisasi secara sekilas
- [Tugas Latar Belakang](/id/automation/tasks) — ledger tugas untuk eksekusi cron
- [Heartbeat](/id/gateway/heartbeat) — giliran sesi utama berkala
- [Zona waktu](/id/concepts/timezone) — konfigurasi zona waktu
