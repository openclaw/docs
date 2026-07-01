---
read_when:
    - Menjadwalkan pekerjaan latar belakang atau pengaktifan
    - Menghubungkan pemicu eksternal (webhook, Gmail) ke OpenClaw
    - Memilih antara Heartbeat dan Cron untuk tugas terjadwal
sidebarTitle: Scheduled tasks
summary: Pekerjaan terjadwal, webhook, dan pemicu PubSub Gmail untuk penjadwal Gateway
title: Tugas terjadwal
x-i18n:
    generated_at: "2026-07-01T08:29:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2f75b8d1e5ac558a02b895e1cd1b92b05af549a2bd63d4ce3ddafcaf9e94b88e
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron adalah penjadwal bawaan Gateway. Cron menyimpan job, membangunkan agen pada waktu yang tepat, dan dapat mengirimkan keluaran kembali ke kanal chat atau endpoint webhook.

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

## Cara kerja Cron

- Cron berjalan **di dalam proses Gateway** (bukan di dalam model).
- Definisi job, status runtime, dan riwayat run disimpan di database status SQLite bersama milik OpenClaw sehingga jadwal tidak hilang saat restart.
- Saat upgrade, jalankan `openclaw doctor --fix` untuk mengimpor file legacy `~/.openclaw/cron/jobs.json`, `jobs-state.json`, dan `runs/*.jsonl` ke SQLite dan mengganti namanya dengan sufiks `.migrated`. Baris job yang tidak valid dilewati dari runtime dan disalin ke `jobs-quarantine.json` untuk perbaikan atau peninjauan nanti.
- `cron.store` masih menamai kunci penyimpanan Cron logis dan jalur impor doctor. Setelah impor, mengedit file JSON tersebut tidak lagi mengubah job Cron aktif; gunakan `openclaw cron add|edit|remove` atau metode RPC Cron Gateway sebagai gantinya.
- Semua eksekusi Cron membuat catatan [tugas latar belakang](/id/automation/tasks).
- Saat Gateway dimulai, job agent-turn terisolasi yang sudah terlambat dijadwalkan ulang keluar dari jendela koneksi kanal, bukan diputar ulang seketika, sehingga startup Discord/Telegram dan penyiapan perintah native tetap responsif setelah restart.
- Job sekali jalan (`--at`) otomatis dihapus setelah berhasil secara default.
- Run Cron terisolasi melakukan penutupan best-effort pada tab/proses browser yang dilacak untuk sesi `cron:<jobId>` saat run selesai, sehingga automasi browser yang terlepas tidak meninggalkan proses yatim.
- Run Cron terisolasi yang menerima grant sempit pembersihan mandiri Cron masih dapat membaca status penjadwal, daftar yang difilter sendiri dari job saat ini, dan riwayat run job tersebut, sehingga pemeriksaan status/heartbeat dapat memeriksa jadwalnya sendiri tanpa memperoleh akses mutasi Cron yang lebih luas.
- Run Cron terisolasi juga melindungi dari balasan pengakuan yang basi. Jika hasil pertama hanya pembaruan status sementara (`on it`, `pulling everything together`, dan petunjuk serupa) dan tidak ada run subagen turunan yang masih bertanggung jawab atas jawaban akhir, OpenClaw meminta ulang sekali untuk hasil sebenarnya sebelum pengiriman.
- Run Cron terisolasi menggunakan metadata penolakan eksekusi terstruktur dari run tersemat, termasuk wrapper node-host `UNAVAILABLE` yang pesan kesalahan bersarangnya dimulai dengan `SYSTEM_RUN_DENIED` atau `INVALID_REQUEST`, sehingga perintah yang diblokir tidak dilaporkan sebagai run hijau sementara prosa asisten biasa tidak diperlakukan sebagai penolakan.
- Run Cron terisolasi juga memperlakukan kegagalan agen tingkat run sebagai kesalahan job bahkan ketika tidak ada payload balasan yang dihasilkan, sehingga kegagalan model/provider menambah penghitung kesalahan dan memicu notifikasi kegagalan alih-alih menandai job sebagai berhasil.
- Ketika job agent-turn terisolasi mencapai `timeoutSeconds`, Cron membatalkan run agen yang mendasarinya dan memberinya jendela pembersihan singkat. Jika run tidak selesai mengalir, pembersihan milik Gateway secara paksa membersihkan kepemilikan sesi run tersebut sebelum Cron mencatat timeout, sehingga pekerjaan chat yang mengantre tidak tertinggal di balik sesi pemrosesan yang basi.
- Jika agent-turn terisolasi macet sebelum runner dimulai atau sebelum panggilan model pertama, Cron mencatat timeout khusus fase seperti `setup timed out before runner start` atau `stalled before first model call (last phase: context-engine)`. Watchdog ini mencakup provider tersemat dan provider berbasis CLI sebelum proses CLI eksternalnya benar-benar dimulai, dan dibatasi secara independen dari nilai `timeoutSeconds` yang panjang sehingga kegagalan cold-start/auth/konteks muncul cepat alih-alih menunggu seluruh anggaran job.
- Jika Anda menggunakan Cron sistem atau penjadwal eksternal lain untuk menjalankan `openclaw agent`, bungkus dengan eskalasi hard-kill meskipun CLI menangani `SIGTERM`/`SIGINT`. Run berbasis Gateway meminta Gateway membatalkan run yang diterima; run fallback lokal dan tersemat menerima sinyal pembatalan yang sama. Untuk GNU `timeout`, lebih pilih `timeout -k 60 600 openclaw agent ...` daripada `timeout 600 ...` biasa; nilai `-k` adalah backstop supervisor jika proses tidak dapat selesai mengalir. Untuk unit systemd, pertahankan bentuk yang sama dengan menggunakan sinyal stop `SIGTERM` plus jendela tenggang seperti `TimeoutStopSec` sebelum kill final. Jika retry menggunakan kembali `--run-id` sementara run Gateway asli masih aktif, duplikat dilaporkan sebagai sedang berjalan alih-alih memulai run kedua.

<a id="maintenance"></a>

<Note>
Rekonsiliasi tugas untuk Cron pertama-tama dimiliki runtime, lalu didukung riwayat tahan lama: tugas Cron aktif tetap hidup selama runtime Cron masih melacak job tersebut sebagai berjalan, bahkan jika baris sesi anak lama masih ada. Setelah runtime berhenti memiliki job dan jendela tenggang 5 menit berakhir, pemeriksaan pemeliharaan memeriksa log run tersimpan dan status job untuk run `cron:<jobId>:<startedAt>` yang cocok. Jika riwayat tahan lama tersebut menunjukkan hasil terminal, ledger tugas difinalisasi darinya; jika tidak, pemeliharaan milik Gateway dapat menandai tugas sebagai `lost`. Audit CLI offline dapat memulihkan dari riwayat tahan lama, tetapi tidak memperlakukan set job aktif dalam prosesnya sendiri yang kosong sebagai bukti bahwa run Cron milik Gateway sudah hilang.
</Note>

## Jenis jadwal

| Jenis   | Flag CLI  | Deskripsi                                               |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | Timestamp sekali jalan (ISO 8601 atau relatif seperti `20m`) |
| `every` | `--every` | Interval tetap                                          |
| `cron`  | `--cron`  | Ekspresi Cron 5-field atau 6-field dengan `--tz` opsional |

Timestamp tanpa zona waktu diperlakukan sebagai UTC. Tambahkan `--tz America/New_York` untuk penjadwalan waktu lokal.

Ekspresi berulang tepat awal jam secara otomatis disebar hingga 5 menit untuk mengurangi lonjakan beban. Gunakan `--exact` untuk memaksa waktu presisi atau `--stagger 30s` untuk jendela eksplisit.

### Day-of-month dan day-of-week menggunakan logika OR

Ekspresi Cron diurai oleh [croner](https://github.com/Hexagon/croner). Ketika field day-of-month dan day-of-week keduanya bukan wildcard, croner cocok ketika **salah satu** field cocok — bukan keduanya. Ini adalah perilaku standar Vixie cron.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Ini berjalan sekitar 5–6 kali per bulan, bukan 0–1 kali per bulan. OpenClaw menggunakan perilaku OR default Croner di sini. Untuk mensyaratkan kedua kondisi, gunakan modifier day-of-week `+` milik Croner (`0 9 15 * +1`) atau jadwalkan pada satu field dan jaga field lainnya di prompt atau perintah job Anda.

## Gaya eksekusi

| Gaya            | Nilai `--session`   | Berjalan di              | Paling cocok untuk             |
| --------------- | ------------------- | ------------------------ | ------------------------------ |
| Sesi utama      | `main`              | Lane wake Cron khusus    | Pengingat, event sistem        |
| Terisolasi      | `isolated`          | `cron:<jobId>` khusus    | Laporan, pekerjaan latar belakang |
| Sesi saat ini   | `current`           | Diikat saat pembuatan    | Pekerjaan berulang sadar konteks |
| Sesi kustom     | `session:custom-id` | Sesi bernama persisten   | Workflow yang membangun dari riwayat |

<AccordionGroup>
  <Accordion title="Sesi utama vs terisolasi vs kustom">
    Job **sesi utama** mengantrekan event sistem ke lane run milik Cron dan secara opsional membangunkan Heartbeat (`--wake now` atau `--wake next-heartbeat`). Job ini dapat menggunakan konteks pengiriman terakhir sesi utama target untuk balasan, tetapi tidak menambahkan turn Cron rutin ke lane chat manusia dan tidak memperpanjang kesegaran reset harian/idle untuk sesi target. Job **terisolasi** menjalankan agent turn khusus dengan sesi baru. **Sesi kustom** (`session:xxx`) mempertahankan konteks lintas run, memungkinkan workflow seperti standup harian yang membangun dari ringkasan sebelumnya.

    Event Cron sesi utama adalah pengingat event sistem yang mandiri. Event tersebut
    tidak otomatis menyertakan instruksi "Read
    HEARTBEAT.md" dari prompt Heartbeat default. Jika pengingat berulang harus memeriksa
    `HEARTBEAT.md`, katakan itu secara eksplisit dalam teks event Cron atau dalam
    instruksi agen itu sendiri.

  </Accordion>
  <Accordion title="Arti 'sesi baru' untuk job terisolasi">
    Untuk job terisolasi, "sesi baru" berarti id transkrip/sesi baru untuk setiap run. OpenClaw dapat membawa preferensi aman seperti pengaturan thinking/fast/verbose, label, dan override model/auth yang dipilih pengguna secara eksplisit, tetapi tidak mewarisi konteks percakapan sekitar dari baris Cron lama: routing kanal/grup, kebijakan kirim atau antre, elevasi, origin, atau binding runtime ACP. Gunakan `current` atau `session:<id>` ketika job berulang harus sengaja membangun dari konteks percakapan yang sama.
  </Accordion>
  <Accordion title="Pembersihan runtime">
    Untuk job terisolasi, teardown runtime kini mencakup pembersihan browser best-effort untuk sesi Cron tersebut. Kegagalan pembersihan diabaikan sehingga hasil Cron sebenarnya tetap berlaku.

    Run Cron terisolasi juga membuang setiap instance runtime MCP bawaan yang dibuat untuk job melalui jalur pembersihan runtime bersama. Ini sesuai dengan cara klien MCP sesi utama dan sesi kustom dibongkar, sehingga job Cron terisolasi tidak membocorkan proses anak stdio atau koneksi MCP berumur panjang lintas run.

  </Accordion>
  <Accordion title="Pengiriman subagen dan Discord">
    Ketika run Cron terisolasi mengorkestrasi subagen, pengiriman juga lebih memilih keluaran turunan akhir daripada teks sementara induk yang basi. Jika turunan masih berjalan, OpenClaw menekan pembaruan induk parsial tersebut alih-alih mengumumkannya.

    Untuk target pengumuman Discord khusus teks, OpenClaw mengirim teks asisten akhir kanonis sekali alih-alih memutar ulang payload teks streamed/perantara sekaligus jawaban akhir. Media dan payload Discord terstruktur tetap dikirim sebagai payload terpisah sehingga lampiran dan komponen tidak terhapus.

  </Accordion>
</AccordionGroup>

### Payload perintah

Gunakan payload perintah untuk skrip deterministik yang harus berjalan di dalam penjadwal Gateway tanpa memulai agent turn terisolasi berbasis model. Job perintah dieksekusi di host Gateway, menangkap stdout/stderr, mencatat run dalam riwayat Cron, dan menggunakan kembali mode pengiriman `announce`, `webhook`, dan `none` yang sama seperti job terisolasi.

<Note>
Cron perintah adalah permukaan automasi Gateway admin-operator, bukan panggilan
`tools.exec` agen. Membuat, memperbarui, menghapus, atau menjalankan job Cron
secara manual memerlukan `operator.admin`; run perintah terjadwal kemudian dieksekusi di dalam
proses Gateway sebagai automasi yang dibuat admin tersebut. Kebijakan exec agen seperti
`tools.exec.mode`, prompt persetujuan, dan allowlist tool per agen mengatur
tool exec yang terlihat model, bukan payload Cron perintah.
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

`--command <shell>` menyimpan `argv: ["sh", "-lc", <shell>]`. Gunakan `--command-argv '["node","scripts/report.mjs"]'` ketika Anda menginginkan eksekusi argv persis tanpa parsing shell. Field opsional `--command-env KEY=VALUE`, `--command-input`, `--timeout-seconds`, `--no-output-timeout-seconds`, dan `--output-max-bytes` mengontrol lingkungan proses, stdin, dan batas keluaran.

Jika stdout tidak kosong, teks tersebut adalah hasil yang dikirim. Jika stdout kosong dan stderr tidak kosong, stderr dikirim. Jika kedua stream ada, cron mengirim blok kecil `stdout:` / `stderr:`. Kode keluar nol mencatat run sebagai `ok`; keluar bukan nol, sinyal, timeout, atau timeout tanpa output mencatat `error` dan dapat memicu peringatan kegagalan. Perintah yang hanya mencetak `NO_REPLY` menggunakan penekanan token senyap cron normal dan tidak memposting apa pun kembali ke chat.

### Opsi payload untuk job terisolasi

<ParamField path="--message" type="string" required>
  Teks prompt (wajib untuk terisolasi).
</ParamField>
<ParamField path="--model" type="string">
  Override model; menggunakan model diizinkan yang dipilih untuk job.
</ParamField>
<ParamField path="--fallbacks" type="string">
  Daftar model fallback per job, misalnya `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`. Berikan `--fallbacks ""` untuk run ketat tanpa fallback.
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  Pada `cron edit`, menghapus override fallback per job sehingga job mengikuti prioritas fallback yang dikonfigurasi. Tidak dapat digabungkan dengan `--fallbacks`.
</ParamField>
<ParamField path="--clear-model" type="boolean">
  Pada `cron edit`, menghapus override model per job sehingga job mengikuti prioritas pemilihan model cron normal (override sesi cron tersimpan jika diatur, jika tidak model agent/default). Tidak dapat digabungkan dengan `--model`.
</ParamField>
<ParamField path="--thinking" type="string">
  Override level berpikir.
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  Pada `cron edit`, menghapus override berpikir per job sehingga job mengikuti prioritas berpikir cron normal. Tidak dapat digabungkan dengan `--thinking`.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Lewati injeksi file bootstrap workspace.
</ParamField>
<ParamField path="--tools" type="string">
  Batasi tool yang dapat digunakan job, misalnya `--tools exec,read`.
</ParamField>

`--model` menggunakan model diizinkan yang dipilih sebagai model utama job tersebut. Ini tidak sama dengan override `/model` sesi chat: rantai fallback yang dikonfigurasi tetap berlaku saat model utama job gagal. Jika model yang diminta tidak diizinkan atau tidak dapat di-resolve, cron menggagalkan run dengan galat validasi eksplisit alih-alih diam-diam fallback ke pilihan model agent/default job.

Job Cron juga dapat membawa `fallbacks` tingkat payload. Jika ada, daftar itu menggantikan rantai fallback yang dikonfigurasi untuk job. Gunakan `fallbacks: []` dalam payload/API job saat Anda menginginkan run cron ketat yang hanya mencoba model yang dipilih. Jika job memiliki `--model` tetapi tidak memiliki fallback payload maupun yang dikonfigurasi, OpenClaw meneruskan override fallback kosong eksplisit agar model utama agent tidak ditambahkan sebagai target percobaan ulang ekstra tersembunyi.

Pemeriksaan preflight penyedia lokal menelusuri fallback yang dikonfigurasi sebelum menandai run cron sebagai `skipped`; `fallbacks: []` menjaga jalur preflight itu tetap ketat.

Prioritas pemilihan model untuk job terisolasi adalah:

1. Override model hook Gmail (ketika run berasal dari Gmail dan override tersebut diizinkan)
2. Payload per job `model`
3. Override model sesi cron tersimpan yang dipilih pengguna
4. Pilihan model agent/default

Mode cepat juga mengikuti pilihan live yang di-resolve. Jika konfigurasi model yang dipilih memiliki `params.fastMode`, cron terisolasi menggunakannya secara default. Override `fastMode` sesi tersimpan tetap menang atas konfigurasi ke arah mana pun. Mode otomatis menggunakan ambang batas `params.fastAutoOnSeconds` model yang dipilih saat ada, dengan default 60 detik.

Jika run terisolasi mencapai handoff pergantian model live, cron mencoba ulang dengan penyedia/model yang diganti dan menyimpan pilihan live tersebut untuk run aktif sebelum mencoba ulang. Saat pergantian juga membawa profil auth baru, cron juga menyimpan override profil auth tersebut untuk run aktif. Percobaan ulang dibatasi: setelah upaya awal plus 2 percobaan ulang pergantian, cron berhenti alih-alih berulang tanpa akhir.

Sebelum run cron terisolasi masuk ke runner agent, OpenClaw memeriksa endpoint penyedia lokal yang dapat dijangkau untuk penyedia `api: "ollama"` dan `api: "openai-completions"` yang dikonfigurasi dengan `baseUrl` berupa loopback, jaringan privat, atau `.local`. Jika endpoint tersebut down, run dicatat sebagai `skipped` dengan galat penyedia/model yang jelas alih-alih memulai panggilan model. Hasil endpoint disimpan dalam cache selama 5 menit, sehingga banyak job jatuh tempo yang menggunakan server Ollama, vLLM, SGLang, atau LM Studio lokal mati yang sama berbagi satu probe kecil alih-alih menciptakan badai request. Run preflight penyedia yang dilewati tidak menambah backoff galat eksekusi; aktifkan `failureAlert.includeSkipped` jika Anda menginginkan notifikasi skip berulang.

## Pengiriman dan output

| Mode       | Yang terjadi                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Mengirim teks final lewat fallback ke target jika agent tidak mengirim |
| `webhook`  | POST payload event selesai ke URL                                   |
| `none`     | Tidak ada pengiriman fallback runner                                |

Gunakan `--announce --channel telegram --to "-1001234567890"` untuk pengiriman channel. Untuk topik forum Telegram, gunakan `-1001234567890:topic:123`; OpenClaw juga menerima singkatan milik Telegram `-1001234567890:123`. Pemanggil RPC/konfigurasi langsung dapat meneruskan `delivery.threadId` sebagai string atau angka. Target Slack/Discord/Mattermost harus menggunakan prefix eksplisit (`channel:<id>`, `user:<id>`). ID ruang Matrix peka huruf besar/kecil; gunakan ID ruang yang tepat atau bentuk `room:!room:server` dari Matrix.

Saat pengiriman announce menggunakan `channel: "last"` atau menghilangkan `channel`, target ber-prefix penyedia seperti `telegram:123` dapat memilih channel sebelum cron fallback ke riwayat sesi atau satu channel yang dikonfigurasi. Hanya prefix yang diumumkan oleh Plugin yang dimuat yang merupakan selector penyedia. Jika `delivery.channel` eksplisit, prefix target harus menyebutkan penyedia yang sama; misalnya, `channel: "whatsapp"` dengan `to: "telegram:123"` ditolak alih-alih membiarkan WhatsApp menafsirkan ID Telegram sebagai nomor telepon. Prefix jenis target dan layanan seperti `channel:<id>`, `user:<id>`, `imessage:<handle>`, dan `sms:<number>` tetap menjadi sintaks target milik channel, bukan selector penyedia.

Untuk job terisolasi, pengiriman chat dibagikan. Jika rute chat tersedia, agent dapat menggunakan tool `message` bahkan saat job menggunakan `--no-deliver`. Jika agent mengirim ke target yang dikonfigurasi/saat ini, OpenClaw melewati announce fallback. Jika tidak, `announce`, `webhook`, dan `none` hanya mengontrol apa yang dilakukan runner dengan balasan final setelah giliran agent.

Saat agent membuat pengingat terisolasi dari chat aktif, OpenClaw menyimpan target pengiriman live yang dipertahankan untuk rute announce fallback. Kunci sesi internal mungkin huruf kecil; target pengiriman penyedia tidak direkonstruksi dari kunci tersebut saat konteks chat saat ini tersedia.

Pengiriman announce implisit menggunakan daftar izin channel yang dikonfigurasi untuk memvalidasi dan merutekan ulang target usang. Persetujuan penyimpanan pasangan DM bukan penerima otomasi fallback; atur `delivery.to` atau konfigurasikan entri `allowFrom` channel saat job terjadwal harus secara proaktif mengirim ke DM.

## Bahasa output

Job Cron tidak menyimpulkan bahasa balasan dari channel, lokal, atau pesan sebelumnya. Letakkan aturan bahasa dalam pesan atau template terjadwal:

```bash
openclaw cron edit <jobId> \
  --message "Summarize the updates. Respond in Chinese; keep URLs, code, and product names unchanged."
```

Untuk berkas templat, pertahankan instruksi bahasa dalam prompt yang dirender dan
verifikasi placeholder seperti `{{language}}` sudah terisi sebelum job berjalan. Jika
output mencampur bahasa, buat aturannya eksplisit, misalnya: "Gunakan bahasa Tionghoa
untuk teks naratif dan pertahankan istilah teknis dalam bahasa Inggris."

Notifikasi kegagalan mengikuti jalur tujuan terpisah:

- `cron.failureDestination` menetapkan default global untuk notifikasi kegagalan.
- `job.delivery.failureDestination` menimpanya per job.
- Jika keduanya tidak disetel dan job sudah mengirim melalui `announce`, notifikasi kegagalan sekarang fallback ke target announce utama tersebut.
- `delivery.failureDestination` hanya didukung pada job `sessionTarget="isolated"` kecuali mode pengiriman utama adalah `webhook`.
- `failureAlert.includeSkipped: true` mengikutkan job atau kebijakan peringatan cron global ke dalam peringatan skipped-run yang berulang. Run yang dilewati mempertahankan penghitung skip berurutan terpisah, sehingga tidak memengaruhi backoff kesalahan eksekusi.

## Contoh CLI

<Tabs>
  <Tab title="One-shot reminder">
    ```bash
    openclaw cron add \
      --name "Calendar check" \
      --at "20m" \
      --session main \
      --system-event "Next heartbeat: check calendar." \
      --wake now
    ```
  </Tab>
  <Tab title="Recurring isolated job">
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
  <Tab title="Model and thinking override">
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
  <Tab title="Webhook output">
    ```bash
    openclaw cron create "0 18 * * 1-5" \
      "Summarize today's deploys as JSON." \
      --name "Deploy digest" \
      --webhook "https://example.invalid/openclaw/cron"
    ```
  </Tab>
  <Tab title="Command output">
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

Gateway dapat mengekspos endpoint HTTP webhook untuk pemicu eksternal. Aktifkan dalam config:

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

Setiap request harus menyertakan token hook melalui header:

- `Authorization: Bearer <token>` (direkomendasikan)
- `x-openclaw-token: <token>`

Token query-string ditolak.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    Antrekan event sistem untuk sesi utama:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/wake \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"text":"New email received","mode":"now"}'
    ```

    <ParamField path="text" type="string" required>
      Deskripsi event.
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

    Kolom: `message` (wajib), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Mapped hooks (POST /hooks/<name>)">
    Nama hook khusus diselesaikan melalui `hooks.mappings` dalam config. Mapping dapat mengubah payload arbitrer menjadi tindakan `wake` atau `agent` dengan templat atau transformasi kode.
  </Accordion>
</AccordionGroup>

<Warning>
Pertahankan endpoint hook di balik loopback, tailnet, atau reverse proxy tepercaya.

- Gunakan token hook khusus; jangan gunakan ulang token autentikasi gateway.
- Pertahankan `hooks.path` pada subpath khusus; `/` akan ditolak.
- Atur `hooks.allowedAgentIds` untuk membatasi agen efektif mana yang dapat ditargetkan oleh hook, termasuk agen default saat `agentId` dihilangkan.
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

Saat `hooks.enabled=true` dan `hooks.gmail.account` disetel, Gateway memulai `gog gmail watch serve` saat boot dan memperpanjang watch secara otomatis. Atur `OPENCLAW_SKIP_GMAIL_WATCHER=1` untuk keluar dari perilaku ini.

### Penyiapan manual sekali jalan

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

### Penimpaan model Gmail

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
# Cantumkan semua job
openclaw cron list

# Dapatkan satu job tersimpan sebagai JSON
openclaw cron get <jobId>

# Tampilkan satu job, termasuk rute pengiriman yang sudah di-resolve
openclaw cron show <jobId>

# Edit job
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Paksa jalankan job sekarang
openclaw cron run <jobId>

# Paksa jalankan job sekarang dan tunggu status terminalnya
openclaw cron run <jobId> --wait --wait-timeout 10m --poll-interval 2s

# Jalankan hanya jika sudah jatuh tempo
openclaw cron run <jobId> --due

# Lihat riwayat run
openclaw cron runs --id <jobId> --limit 50

# Lihat satu run persis
openclaw cron runs --id <jobId> --run-id <runId>

# Hapus job
openclaw cron remove <jobId>

# Pemilihan agen (penyiapan multi-agen)
openclaw cron create "0 6 * * *" "Check ops queue" --name "Ops sweep" --session isolated --agent ops
openclaw cron edit <jobId> --clear-agent
```

`openclaw cron run <jobId>` kembali setelah mengantrekan run manual. Gunakan `--wait` untuk hook penghentian, skrip pemeliharaan, atau otomatisasi lain yang harus memblokir hingga run yang diantrekan selesai. Mode tunggu melakukan polling pada `runId` yang dikembalikan secara persis; mode ini keluar `0` untuk status `ok` dan non-nol untuk `error`, `skipped`, atau waktu tunggu habis.

Alat agen `cron` mengembalikan ringkasan job ringkas (`id`, `name`, `enabled`, `nextRunAtMs`, `scheduleKind`, `lastRunStatus`) dari `cron(action: "list")`; gunakan `cron(action: "get", jobId: "...")` untuk satu definisi job lengkap. Pemanggil Gateway langsung dapat meneruskan `compact: true` ke `cron.list`; menghilangkannya mempertahankan respons lengkap yang ada dengan pratinjau pengiriman.

`openclaw cron create` adalah alias untuk `openclaw cron add`, dan job baru dapat menggunakan jadwal posisional (`"0 9 * * 1"`, `"every 1h"`, `"20m"`, atau stempel waktu ISO) diikuti prompt agen posisional. Gunakan `--webhook <url>` pada `cron add|create` atau `cron edit` untuk melakukan POST payload run yang selesai ke endpoint HTTP. Pengiriman Webhook tidak dapat digabungkan dengan flag pengiriman chat seperti `--announce`, `--channel`, `--to`, `--thread-id`, atau `--account`. Pada `cron edit`, `--clear-channel`, `--clear-to`, `--clear-thread-id`, dan `--clear-account` mengosongkan field routing tersebut satu per satu (masing-masing ditolak bersama flag setel yang cocok), yang berbeda dari `--no-deliver` yang menonaktifkan pengiriman fallback runner.

<Note>
Catatan penimpaan model:

- `openclaw cron add|edit --model ...` mengubah model yang dipilih job.
- Jika model diizinkan, provider/model persis tersebut mencapai run agen terisolasi.
- Jika tidak diizinkan atau tidak dapat di-resolve, cron menggagalkan run dengan galat validasi eksplisit.
- Patch payload API `cron.update` dapat mengatur `model: null` untuk menghapus penimpaan model job tersimpan.
- `openclaw cron edit <job-id> --clear-model` menghapus penimpaan tersebut dari CLI (efek yang sama dengan patch `model: null`) dan tidak dapat digabungkan dengan `--model`.
- Rantai fallback yang dikonfigurasi tetap berlaku karena `--model` cron adalah primer job, bukan penimpaan `/model` sesi.
- `openclaw cron add|edit --fallbacks ...` mengatur payload `fallbacks`, menggantikan fallback yang dikonfigurasi untuk job tersebut; `--fallbacks ""` menonaktifkan fallback dan membuat run ketat. `openclaw cron edit <job-id> --clear-fallbacks` menghapus penimpaan per job.
- `--model` biasa tanpa daftar fallback eksplisit atau terkonfigurasi tidak jatuh ke primer agen sebagai target coba ulang tambahan yang senyap.

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

`maxConcurrentRuns` membatasi dispatch cron terjadwal dan eksekusi giliran agen terisolasi, dan defaultnya adalah 8. Giliran agen cron terisolasi menggunakan jalur eksekusi khusus `cron-nested` milik antrean secara internal, sehingga menaikkan nilai ini memungkinkan run LLM cron independen berjalan paralel alih-alih hanya memulai pembungkus cron luarnya. Jalur `nested` non-cron bersama tidak diperlebar oleh pengaturan ini.

`cron.store` adalah kunci store logis dan jalur impor doctor lama. Jalankan `openclaw doctor --fix` untuk mengimpor store JSON yang ada ke SQLite dan mengarsipkannya; perubahan cron di masa mendatang harus melalui CLI atau API Gateway.

Nonaktifkan cron: `cron.enabled: false` atau `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Perilaku coba ulang">
    **Coba ulang sekali jalan**: galat sementara (batas laju, overload, jaringan, galat server) dicoba ulang hingga 3 kali dengan backoff eksponensial. Galat permanen langsung dinonaktifkan.

    **Coba ulang berulang**: backoff eksponensial (30d hingga 60m) di antara percobaan ulang. Backoff direset setelah run sukses berikutnya.

  </Accordion>
  <Accordion title="Pemeliharaan">
    `cron.sessionRetention` (default `24h`) memangkas entri sesi-run terisolasi. `cron.runLog.keepLines` membatasi baris riwayat run SQLite yang disimpan per job; `maxBytes` dipertahankan untuk kompatibilitas konfigurasi dengan log run berbasis file yang lebih lama.
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
    - Periksa `cron.enabled` dan variabel env `OPENCLAW_SKIP_CRON`.
    - Pastikan Gateway berjalan terus-menerus.
    - Untuk jadwal `cron`, verifikasi zona waktu (`--tz`) vs zona waktu host.
    - `reason: not-due` dalam output run berarti run manual diperiksa dengan `openclaw cron run <jobId> --due` dan job belum jatuh tempo.

  </Accordion>
  <Accordion title="Cron berjalan tetapi tidak ada pengiriman">
    - Mode pengiriman `none` berarti tidak ada pengiriman fallback runner yang diharapkan. Agen masih dapat mengirim langsung dengan alat `message` saat rute chat tersedia.
    - Target pengiriman hilang/tidak valid (`channel`/`to`) berarti outbound dilewati.
    - Untuk Matrix, job salinan atau lama dengan ID ruang `delivery.to` yang diubah ke huruf kecil dapat gagal karena ID ruang Matrix peka huruf besar-kecil. Edit job ke nilai `!room:server` atau `room:!room:server` yang persis dari Matrix.
    - Galat autentikasi channel (`unauthorized`, `Forbidden`) berarti pengiriman diblokir oleh kredensial.
    - Jika run terisolasi hanya mengembalikan token senyap (`NO_REPLY` / `no_reply`), OpenClaw menekan pengiriman outbound langsung dan juga menekan jalur ringkasan antrean fallback, sehingga tidak ada yang diposting kembali ke chat.
    - Jika agen harus mengirim pesan ke pengguna sendiri, periksa bahwa job memiliki rute yang dapat digunakan (`channel: "last"` dengan chat sebelumnya, atau channel/target eksplisit).

  </Accordion>
  <Accordion title="Cron atau Heartbeat tampaknya mencegah rollover gaya /new">
    - Kesegaran reset harian dan idle tidak didasarkan pada `updatedAt`; lihat [Manajemen sesi](/id/concepts/session#session-lifecycle).
    - Wakeup cron, run Heartbeat, notifikasi exec, dan pembukuan gateway dapat memperbarui baris sesi untuk routing/status, tetapi tidak memperpanjang `sessionStartedAt` atau `lastInteractionAt`.
    - Untuk baris lama yang dibuat sebelum field tersebut ada, OpenClaw dapat memulihkan `sessionStartedAt` dari header sesi JSONL transkrip saat file masih tersedia. Baris idle lama tanpa `lastInteractionAt` menggunakan waktu mulai yang dipulihkan tersebut sebagai baseline idle-nya.

  </Accordion>
  <Accordion title="Hal yang perlu diperhatikan tentang zona waktu">
    - Cron tanpa `--tz` menggunakan zona waktu host gateway.
    - Jadwal `at` tanpa zona waktu diperlakukan sebagai UTC.
    - `activeHours` Heartbeat menggunakan resolusi zona waktu yang dikonfigurasi.

  </Accordion>
</AccordionGroup>

## Terkait

- [Otomatisasi](/id/automation) — semua mekanisme otomatisasi secara sekilas
- [Tugas Latar Belakang](/id/automation/tasks) — ledger tugas untuk eksekusi cron
- [Heartbeat](/id/gateway/heartbeat) — giliran sesi utama berkala
- [Zona waktu](/id/concepts/timezone) — konfigurasi zona waktu
