---
read_when:
    - Menjadwalkan pekerjaan latar belakang atau wakeup
    - Menghubungkan pemicu eksternal (webhook, Gmail) ke OpenClaw
    - Memilih antara Heartbeat dan Cron untuk tugas terjadwal
sidebarTitle: Scheduled tasks
summary: Pekerjaan terjadwal, webhook, dan pemicu Gmail PubSub untuk penjadwal Gateway
title: Tugas terjadwal
x-i18n:
    generated_at: "2026-07-02T08:49:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2f75b8d1e5ac558a02b895e1cd1b92b05af549a2bd63d4ce3ddafcaf9e94b88e
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron adalah penjadwal bawaan Gateway. Cron menyimpan job, membangunkan agent pada waktu yang tepat, dan dapat mengirimkan output kembali ke channel chat atau endpoint webhook.

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
- Definisi job, status runtime, dan riwayat run disimpan di database status SQLite bersama OpenClaw sehingga jadwal tidak hilang saat restart.
- Saat upgrade, jalankan `openclaw doctor --fix` untuk mengimpor file legacy `~/.openclaw/cron/jobs.json`, `jobs-state.json`, dan `runs/*.jsonl` ke SQLite dan mengganti namanya dengan akhiran `.migrated`. Baris job yang rusak dilewati dari runtime dan disalin ke `jobs-quarantine.json` untuk diperbaiki atau ditinjau nanti.
- `cron.store` tetap menamai kunci penyimpanan cron logis dan jalur impor doctor. Setelah impor, mengedit file JSON tersebut tidak lagi mengubah job cron aktif; gunakan `openclaw cron add|edit|remove` atau metode RPC cron Gateway sebagai gantinya.
- Semua eksekusi cron membuat catatan [tugas latar belakang](/id/automation/tasks).
- Saat Gateway dimulai, job agent-turn terisolasi yang terlambat dijadwalkan ulang keluar dari jendela koneksi channel alih-alih diputar ulang segera, sehingga startup Discord/Telegram dan penyiapan perintah native tetap responsif setelah restart.
- Job sekali jalan (`--at`) otomatis dihapus setelah berhasil secara default.
- Run cron terisolasi berupaya menutup tab/proses browser yang dilacak untuk sesi `cron:<jobId>` saat run selesai, sehingga otomasi browser yang terlepas tidak meninggalkan proses yatim.
- Run cron terisolasi yang menerima grant pembersihan mandiri cron yang sempit tetap dapat membaca status penjadwal, daftar job saat ini yang difilter untuk dirinya sendiri, dan riwayat run job tersebut, sehingga pemeriksaan status/heartbeat dapat memeriksa jadwalnya sendiri tanpa memperoleh akses mutasi cron yang lebih luas.
- Run cron terisolasi juga melindungi dari balasan pengakuan yang basi. Jika hasil pertama hanya pembaruan status sementara (`on it`, `pulling everything together`, dan petunjuk serupa) dan tidak ada run subagent turunan yang masih bertanggung jawab atas jawaban akhir, OpenClaw meminta ulang satu kali untuk hasil sebenarnya sebelum pengiriman.
- Run cron terisolasi menggunakan metadata penolakan eksekusi terstruktur dari run tertanam, termasuk pembungkus node-host `UNAVAILABLE` yang pesan error bertingkatnya dimulai dengan `SYSTEM_RUN_DENIED` atau `INVALID_REQUEST`, sehingga perintah yang diblokir tidak dilaporkan sebagai run hijau sementara prosa assistant biasa tidak diperlakukan sebagai penolakan.
- Run cron terisolasi juga memperlakukan kegagalan agent tingkat run sebagai error job meskipun tidak ada payload balasan yang dihasilkan, sehingga kegagalan model/provider menaikkan penghitung error dan memicu notifikasi kegagalan alih-alih membersihkan job sebagai berhasil.
- Saat job agent-turn terisolasi mencapai `timeoutSeconds`, cron membatalkan run agent yang mendasarinya dan memberinya jendela pembersihan singkat. Jika run tidak selesai mengosongkan antrean, pembersihan milik Gateway secara paksa membersihkan kepemilikan sesi run tersebut sebelum cron mencatat timeout, sehingga pekerjaan chat yang mengantre tidak tertinggal di balik sesi pemrosesan yang basi.
- Jika agent-turn terisolasi macet sebelum runner dimulai atau sebelum panggilan model pertama, cron mencatat timeout khusus fase seperti `setup timed out before runner start` atau `stalled before first model call (last phase: context-engine)`. Watchdog ini mencakup provider tertanam dan provider berbasis CLI sebelum proses CLI eksternalnya benar-benar dimulai, dan dibatasi secara independen dari nilai `timeoutSeconds` yang panjang sehingga kegagalan cold-start/auth/context muncul cepat alih-alih menunggu seluruh anggaran job.
- Jika Anda menggunakan system cron atau penjadwal eksternal lain untuk menjalankan `openclaw agent`, bungkus dengan eskalasi hard-kill meskipun CLI menangani `SIGTERM`/`SIGINT`. Run berbasis Gateway meminta Gateway untuk membatalkan run yang diterima; run fallback lokal dan tertanam menerima sinyal pembatalan yang sama. Untuk GNU `timeout`, lebih baik gunakan `timeout -k 60 600 openclaw agent ...` daripada `timeout 600 ...` biasa; nilai `-k` adalah penahan supervisor jika proses tidak dapat selesai mengosongkan antrean. Untuk unit systemd, pertahankan bentuk yang sama dengan menggunakan sinyal stop `SIGTERM` plus jendela tenggang seperti `TimeoutStopSec` sebelum kill akhir apa pun. Jika percobaan ulang menggunakan kembali `--run-id` saat run Gateway asli masih aktif, duplikat dilaporkan sebagai sedang berjalan alih-alih memulai run kedua.

<a id="maintenance"></a>

<Note>
Rekonsiliasi tugas untuk cron pertama-tama dimiliki runtime, lalu didukung riwayat tahan lama: tugas cron aktif tetap live selama runtime cron masih melacak job tersebut sebagai berjalan, meskipun baris sesi anak lama masih ada. Setelah runtime berhenti memiliki job dan jendela tenggang 5 menit berakhir, pemeliharaan memeriksa log run tersimpan dan status job untuk run `cron:<jobId>:<startedAt>` yang cocok. Jika riwayat tahan lama tersebut menunjukkan hasil terminal, ledger tugas diselesaikan darinya; jika tidak, pemeliharaan milik Gateway dapat menandai tugas sebagai `lost`. Audit CLI offline dapat memulihkan dari riwayat tahan lama, tetapi tidak memperlakukan set job aktif dalam prosesnya sendiri yang kosong sebagai bukti bahwa run cron milik Gateway telah hilang.
</Note>

## Jenis jadwal

| Jenis   | Flag CLI  | Deskripsi                                               |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | Timestamp sekali jalan (ISO 8601 atau relatif seperti `20m`) |
| `every` | `--every` | Interval tetap                                          |
| `cron`  | `--cron`  | Ekspresi cron 5-field atau 6-field dengan `--tz` opsional |

Timestamp tanpa zona waktu diperlakukan sebagai UTC. Tambahkan `--tz America/New_York` untuk penjadwalan waktu dinding lokal.

Ekspresi berulang pada awal jam secara otomatis disebar hingga 5 menit untuk mengurangi lonjakan beban. Gunakan `--exact` untuk memaksa waktu presisi atau `--stagger 30s` untuk jendela eksplisit.

### Hari dalam bulan dan hari dalam minggu menggunakan logika OR

Ekspresi cron diurai oleh [croner](https://github.com/Hexagon/croner). Saat field hari dalam bulan dan hari dalam minggu sama-sama bukan wildcard, croner cocok ketika **salah satu** field cocok — bukan keduanya. Ini adalah perilaku cron Vixie standar.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Ini berjalan sekitar 5–6 kali per bulan, bukan 0–1 kali per bulan. OpenClaw menggunakan perilaku OR default Croner di sini. Untuk mensyaratkan kedua kondisi, gunakan modifier hari dalam minggu `+` milik Croner (`0 9 15 * +1`) atau jadwalkan pada satu field dan jaga field lainnya di prompt atau perintah job Anda.

## Gaya eksekusi

| Gaya            | Nilai `--session`   | Berjalan di              | Paling cocok untuk              |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| Sesi utama      | `main`              | Jalur wake cron khusus   | Pengingat, event sistem         |
| Terisolasi      | `isolated`          | `cron:<jobId>` khusus    | Laporan, pekerjaan latar belakang |
| Sesi saat ini   | `current`           | Diikat saat pembuatan    | Pekerjaan berulang sadar konteks |
| Sesi kustom     | `session:custom-id` | Sesi bernama persisten   | Workflow yang dibangun di atas riwayat |

<AccordionGroup>
  <Accordion title="Sesi utama vs terisolasi vs kustom">
    Job **sesi utama** mengantrekan event sistem ke jalur run milik cron dan secara opsional membangunkan heartbeat (`--wake now` atau `--wake next-heartbeat`). Job ini dapat menggunakan konteks pengiriman terakhir sesi utama target untuk balasan, tetapi tidak menambahkan giliran cron rutin ke jalur chat manusia dan tidak memperpanjang kesegaran reset harian/idle untuk sesi target. Job **terisolasi** menjalankan giliran agent khusus dengan sesi baru. **Sesi kustom** (`session:xxx`) mempertahankan konteks lintas run, memungkinkan workflow seperti standup harian yang dibangun di atas ringkasan sebelumnya.

    Event cron sesi utama adalah pengingat event sistem yang mandiri. Event ini
    tidak secara otomatis menyertakan instruksi "Read HEARTBEAT.md" dari prompt
    heartbeat default. Jika pengingat berulang harus membaca
    `HEARTBEAT.md`, nyatakan itu secara eksplisit di teks event cron atau di
    instruksi agent itu sendiri.

  </Accordion>
  <Accordion title="Arti 'sesi baru' untuk job terisolasi">
    Untuk job terisolasi, "sesi baru" berarti id transkrip/sesi baru untuk setiap run. OpenClaw dapat membawa preferensi aman seperti pengaturan thinking/fast/verbose, label, dan override model/auth yang dipilih pengguna secara eksplisit, tetapi tidak mewarisi konteks percakapan ambien dari baris cron lama: routing channel/grup, kebijakan kirim atau antre, elevasi, asal, atau binding runtime ACP. Gunakan `current` atau `session:<id>` saat job berulang memang harus dibangun di atas konteks percakapan yang sama.
  </Accordion>
  <Accordion title="Pembersihan runtime">
    Untuk job terisolasi, pembongkaran runtime sekarang mencakup pembersihan browser best-effort untuk sesi cron tersebut. Kegagalan pembersihan diabaikan sehingga hasil cron sebenarnya tetap menang.

    Run cron terisolasi juga membuang instance runtime MCP bundel apa pun yang dibuat untuk job melalui jalur pembersihan runtime bersama. Ini cocok dengan cara klien MCP sesi utama dan sesi kustom dibongkar, sehingga job cron terisolasi tidak membocorkan proses anak stdio atau koneksi MCP jangka panjang lintas run.

  </Accordion>
  <Accordion title="Subagent dan pengiriman Discord">
    Saat run cron terisolasi mengorkestrasi subagent, pengiriman juga lebih memilih output turunan akhir daripada teks sementara induk yang basi. Jika turunan masih berjalan, OpenClaw menekan pembaruan induk parsial tersebut alih-alih mengumumkannya.

    Untuk target pengumuman Discord khusus teks, OpenClaw mengirim teks assistant final kanonis satu kali alih-alih memutar ulang payload teks streaming/perantara dan jawaban akhir. Media dan payload Discord terstruktur tetap dikirim sebagai payload terpisah sehingga lampiran dan komponen tidak hilang.

  </Accordion>
</AccordionGroup>

### Payload perintah

Gunakan payload perintah untuk skrip deterministik yang harus berjalan di dalam penjadwal Gateway tanpa memulai giliran agent terisolasi berbasis model. Job perintah dieksekusi pada host Gateway, menangkap stdout/stderr, mencatat run di riwayat cron, dan menggunakan kembali mode pengiriman `announce`, `webhook`, dan `none` yang sama seperti job terisolasi.

<Note>
Command cron adalah permukaan otomasi Gateway operator-admin, bukan panggilan
`tools.exec` agent. Membuat, memperbarui, menghapus, atau menjalankan job cron
secara manual memerlukan `operator.admin`; run perintah terjadwal nantinya
dieksekusi di dalam proses Gateway sebagai otomasi yang dibuat admin tersebut.
Kebijakan exec agent seperti `tools.exec.mode`, prompt persetujuan, dan
allowlist tool per agent mengatur tool exec yang terlihat model, bukan payload
command cron.
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

`--command <shell>` menyimpan `argv: ["sh", "-lc", <shell>]`. Gunakan `--command-argv '["node","scripts/report.mjs"]'` saat Anda menginginkan eksekusi argv persis tanpa penguraian shell. Field opsional `--command-env KEY=VALUE`, `--command-input`, `--timeout-seconds`, `--no-output-timeout-seconds`, dan `--output-max-bytes` mengontrol environment proses, stdin, dan batas output.

Jika stdout tidak kosong, teks tersebut adalah hasil yang dikirimkan. Jika stdout kosong dan stderr tidak kosong, stderr dikirimkan. Jika kedua stream ada, Cron mengirimkan blok kecil `stdout:` / `stderr:`. Kode keluar nol mencatat run sebagai `ok`; keluar non-nol, sinyal, timeout, atau timeout tanpa output mencatat `error` dan dapat memicu peringatan kegagalan. Perintah yang hanya mencetak `NO_REPLY` menggunakan supresi token senyap Cron normal dan tidak memposting apa pun kembali ke chat.

### Opsi payload untuk pekerjaan terisolasi

<ParamField path="--message" type="string" required>
  Teks prompt (wajib untuk isolated).
</ParamField>
<ParamField path="--model" type="string">
  Pengesampingan model; menggunakan model yang diizinkan dan dipilih untuk pekerjaan.
</ParamField>
<ParamField path="--fallbacks" type="string">
  Daftar model fallback per pekerjaan, misalnya `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`. Berikan `--fallbacks ""` untuk run ketat tanpa fallback.
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  Pada `cron edit`, menghapus pengesampingan fallback per pekerjaan sehingga pekerjaan mengikuti prioritas fallback yang dikonfigurasi. Tidak dapat digabungkan dengan `--fallbacks`.
</ParamField>
<ParamField path="--clear-model" type="boolean">
  Pada `cron edit`, menghapus pengesampingan model per pekerjaan sehingga pekerjaan mengikuti prioritas pemilihan model Cron normal (pengesampingan sesi Cron tersimpan jika disetel, jika tidak model agent/default). Tidak dapat digabungkan dengan `--model`.
</ParamField>
<ParamField path="--thinking" type="string">
  Pengesampingan level thinking.
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  Pada `cron edit`, menghapus pengesampingan thinking per pekerjaan sehingga pekerjaan mengikuti prioritas thinking Cron normal. Tidak dapat digabungkan dengan `--thinking`.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Lewati injeksi file bootstrap workspace.
</ParamField>
<ParamField path="--tools" type="string">
  Batasi alat yang dapat digunakan pekerjaan, misalnya `--tools exec,read`.
</ParamField>

`--model` menggunakan model yang diizinkan dan dipilih sebagai model utama pekerjaan tersebut. Ini tidak sama dengan pengesampingan `/model` sesi chat: rantai fallback yang dikonfigurasi tetap berlaku ketika model utama pekerjaan gagal. Jika model yang diminta tidak diizinkan atau tidak dapat di-resolve, Cron menggagalkan run dengan error validasi eksplisit, alih-alih diam-diam fallback ke pemilihan model agent/default pekerjaan.

Pekerjaan Cron juga dapat membawa `fallbacks` pada level payload. Jika ada, daftar tersebut menggantikan rantai fallback yang dikonfigurasi untuk pekerjaan. Gunakan `fallbacks: []` dalam payload/API pekerjaan saat Anda menginginkan run Cron ketat yang hanya mencoba model yang dipilih. Jika pekerjaan memiliki `--model` tetapi tidak ada fallback payload maupun fallback terkonfigurasi, OpenClaw meneruskan pengesampingan fallback kosong eksplisit sehingga model utama agent tidak ditambahkan sebagai target percobaan ulang ekstra tersembunyi.

Pemeriksaan preflight penyedia lokal menelusuri fallback yang dikonfigurasi sebelum menandai run Cron sebagai `skipped`; `fallbacks: []` menjaga jalur preflight tersebut tetap ketat.

Prioritas pemilihan model untuk pekerjaan terisolasi adalah:

1. Pengesampingan model hook Gmail (ketika run berasal dari Gmail dan pengesampingan tersebut diizinkan)
2. `model` payload per pekerjaan
3. Pengesampingan model sesi Cron tersimpan yang dipilih pengguna
4. Pemilihan model agent/default

Mode cepat juga mengikuti pilihan live yang sudah di-resolve. Jika konfigurasi model yang dipilih memiliki `params.fastMode`, Cron terisolasi menggunakannya secara default. Pengesampingan `fastMode` sesi tersimpan tetap menang atas konfigurasi ke arah mana pun. Mode otomatis menggunakan batas `params.fastAutoOnSeconds` model yang dipilih jika ada, dengan default 60 detik.

Jika run terisolasi mengalami handoff pergantian model live, Cron mencoba ulang dengan penyedia/model yang dialihkan dan mempertahankan pilihan live tersebut untuk run aktif sebelum mencoba ulang. Ketika pergantian juga membawa profil autentikasi baru, Cron juga mempertahankan pengesampingan profil autentikasi tersebut untuk run aktif. Percobaan ulang dibatasi: setelah percobaan awal ditambah 2 percobaan ulang pergantian, Cron membatalkan alih-alih berputar selamanya.

Sebelum run Cron terisolasi memasuki runner agent, OpenClaw memeriksa endpoint penyedia lokal yang dapat dijangkau untuk penyedia `api: "ollama"` dan `api: "openai-completions"` yang dikonfigurasi dengan `baseUrl` berupa loopback, jaringan privat, atau `.local`. Jika endpoint tersebut mati, run dicatat sebagai `skipped` dengan error penyedia/model yang jelas, alih-alih memulai panggilan model. Hasil endpoint di-cache selama 5 menit, sehingga banyak pekerjaan jatuh tempo yang menggunakan server Ollama, vLLM, SGLang, atau LM Studio lokal mati yang sama berbagi satu probe kecil, alih-alih membuat badai request. Run preflight penyedia yang dilewati tidak menambah backoff error eksekusi; aktifkan `failureAlert.includeSkipped` saat Anda menginginkan notifikasi skip berulang.

## Pengiriman dan output

| Mode       | Yang terjadi                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Kirim fallback teks final ke target jika agent tidak mengirim       |
| `webhook`  | POST payload event selesai ke URL                                   |
| `none`     | Tidak ada pengiriman fallback runner                                |

Gunakan `--announce --channel telegram --to "-1001234567890"` untuk pengiriman channel. Untuk topik forum Telegram, gunakan `-1001234567890:topic:123`; OpenClaw juga menerima shorthand milik Telegram `-1001234567890:123`. Pemanggil RPC/konfigurasi langsung dapat meneruskan `delivery.threadId` sebagai string atau angka. Target Slack/Discord/Mattermost harus menggunakan prefix eksplisit (`channel:<id>`, `user:<id>`). ID ruang Matrix peka huruf besar-kecil; gunakan ID ruang persis atau bentuk `room:!room:server` dari Matrix.

Ketika pengiriman announce menggunakan `channel: "last"` atau menghilangkan `channel`, target ber-prefix penyedia seperti `telegram:123` dapat memilih channel sebelum Cron fallback ke riwayat sesi atau satu channel yang dikonfigurasi. Hanya prefix yang diiklankan oleh plugin yang dimuat yang menjadi selector penyedia. Jika `delivery.channel` eksplisit, prefix target harus menamai penyedia yang sama; misalnya, `channel: "whatsapp"` dengan `to: "telegram:123"` ditolak alih-alih membiarkan WhatsApp menafsirkan ID Telegram sebagai nomor telepon. Prefix jenis target dan layanan seperti `channel:<id>`, `user:<id>`, `imessage:<handle>`, dan `sms:<number>` tetap menjadi sintaks target milik channel, bukan selector penyedia.

Untuk pekerjaan terisolasi, pengiriman chat dibagikan. Jika rute chat tersedia, agent dapat menggunakan alat `message` bahkan ketika pekerjaan menggunakan `--no-deliver`. Jika agent mengirim ke target yang dikonfigurasi/saat ini, OpenClaw melewati announce fallback. Jika tidak, `announce`, `webhook`, dan `none` hanya mengontrol apa yang dilakukan runner dengan balasan final setelah giliran agent.

Ketika agent membuat pengingat terisolasi dari chat aktif, OpenClaw menyimpan target pengiriman live yang dipertahankan untuk rute announce fallback. Kunci sesi internal dapat berupa huruf kecil; target pengiriman penyedia tidak direkonstruksi dari kunci tersebut ketika konteks chat saat ini tersedia.

Pengiriman announce implisit menggunakan allowlist channel yang dikonfigurasi untuk memvalidasi dan merutekan ulang target basi. Persetujuan store pemasangan DM bukan penerima otomatisasi fallback; setel `delivery.to` atau konfigurasikan entri `allowFrom` channel ketika pekerjaan terjadwal harus mengirim secara proaktif ke DM.

## Bahasa output

Pekerjaan Cron tidak menyimpulkan bahasa balasan dari channel, locale, atau pesan sebelumnya. Letakkan aturan bahasa dalam pesan atau template terjadwal:

```bash
openclaw cron edit <jobId> \
  --message "Summarize the updates. Respond in Chinese; keep URLs, code, and product names unchanged."
```

Untuk file template, pertahankan instruksi bahasa dalam prompt yang dirender dan verifikasi placeholder seperti `{{language}}` sudah terisi sebelum pekerjaan berjalan. Jika output mencampur bahasa, buat aturannya eksplisit, misalnya: "Gunakan bahasa Mandarin untuk teks naratif dan pertahankan istilah teknis dalam bahasa Inggris."

Notifikasi kegagalan mengikuti jalur tujuan terpisah:

- `cron.failureDestination` menetapkan default global untuk notifikasi kegagalan.
- `job.delivery.failureDestination` mengesampingkannya per pekerjaan.
- Jika keduanya tidak disetel dan pekerjaan sudah mengirim via `announce`, notifikasi kegagalan kini fallback ke target announce utama tersebut.
- `delivery.failureDestination` hanya didukung pada pekerjaan `sessionTarget="isolated"` kecuali mode pengiriman utama adalah `webhook`.
- `failureAlert.includeSkipped: true` mengikutsertakan pekerjaan atau kebijakan peringatan Cron global ke peringatan run yang dilewati secara berulang. Run yang dilewati mempertahankan penghitung skip berturut-turut terpisah, sehingga tidak memengaruhi backoff error eksekusi.

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

Gateway dapat mengekspos endpoint Webhook HTTP untuk pemicu eksternal. Aktifkan dalam konfigurasi:

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
    Jalankan giliran agent terisolasi:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    Field: `message` (wajib), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Mapped hooks (POST /hooks/<name>)">
    Nama hook kustom di-resolve melalui `hooks.mappings` dalam konfigurasi. Mapping dapat mengubah payload arbitrer menjadi aksi `wake` atau `agent` dengan template atau transformasi kode.
  </Accordion>
</AccordionGroup>

<Warning>
Jaga endpoint hook tetap berada di balik loopback, tailnet, atau reverse proxy tepercaya.

- Gunakan token hook khusus; jangan gunakan kembali token autentikasi gateway.
- Pertahankan `hooks.path` pada subpath khusus; `/` ditolak.
- Atur `hooks.allowedAgentIds` untuk membatasi agen efektif mana yang dapat ditargetkan hook, termasuk agen default saat `agentId` dihilangkan.
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

Saat `hooks.enabled=true` dan `hooks.gmail.account` diatur, Gateway memulai `gog gmail watch serve` saat boot dan memperbarui watch secara otomatis. Atur `OPENCLAW_SKIP_GMAIL_WATCHER=1` untuk tidak ikut serta.

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

## Mengelola pekerjaan

```bash
# Cantumkan semua pekerjaan
openclaw cron list

# Dapatkan satu pekerjaan tersimpan sebagai JSON
openclaw cron get <jobId>

# Tampilkan satu pekerjaan, termasuk rute pengiriman yang di-resolve
openclaw cron show <jobId>

# Edit pekerjaan
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Paksa jalankan pekerjaan sekarang
openclaw cron run <jobId>

# Paksa jalankan pekerjaan sekarang dan tunggu status terminalnya
openclaw cron run <jobId> --wait --wait-timeout 10m --poll-interval 2s

# Jalankan hanya jika sudah jatuh tempo
openclaw cron run <jobId> --due

# Lihat riwayat run
openclaw cron runs --id <jobId> --limit 50

# Lihat satu run yang tepat
openclaw cron runs --id <jobId> --run-id <runId>

# Hapus pekerjaan
openclaw cron remove <jobId>

# Pemilihan agen (penyiapan multi-agen)
openclaw cron create "0 6 * * *" "Check ops queue" --name "Ops sweep" --session isolated --agent ops
openclaw cron edit <jobId> --clear-agent
```

`openclaw cron run <jobId>` kembali setelah memasukkan run manual ke antrean. Gunakan `--wait` untuk hook pematian, skrip pemeliharaan, atau otomatisasi lain yang harus memblokir hingga run yang diantrekan selesai. Mode tunggu melakukan polling pada `runId` persis yang dikembalikan; mode ini keluar `0` untuk status `ok` dan bukan nol untuk `error`, `skipped`, atau timeout tunggu.

Tool `cron` agen mengembalikan ringkasan pekerjaan ringkas (`id`, `name`, `enabled`, `nextRunAtMs`, `scheduleKind`, `lastRunStatus`) dari `cron(action: "list")`; gunakan `cron(action: "get", jobId: "...")` untuk satu definisi pekerjaan lengkap. Pemanggil Gateway langsung dapat meneruskan `compact: true` ke `cron.list`; menghilangkannya mempertahankan respons lengkap yang ada dengan pratinjau pengiriman.

`openclaw cron create` adalah alias untuk `openclaw cron add`, dan pekerjaan baru dapat menggunakan jadwal posisional (`"0 9 * * 1"`, `"every 1h"`, `"20m"`, atau timestamp ISO) diikuti prompt agen posisional. Gunakan `--webhook <url>` pada `cron add|create` atau `cron edit` untuk melakukan POST payload run yang selesai ke endpoint HTTP. Pengiriman Webhook tidak dapat digabungkan dengan flag pengiriman chat seperti `--announce`, `--channel`, `--to`, `--thread-id`, atau `--account`. Pada `cron edit`, `--clear-channel`, `--clear-to`, `--clear-thread-id`, dan `--clear-account` menghapus masing-masing field perutean tersebut (masing-masing ditolak bersama flag set yang cocok), yang berbeda dari `--no-deliver` yang menonaktifkan pengiriman fallback runner.

<Note>
Catatan penggantian model:

- `openclaw cron add|edit --model ...` mengubah model yang dipilih pekerjaan.
- Jika model diizinkan, provider/model persis tersebut mencapai run agen terisolasi.
- Jika tidak diizinkan atau tidak dapat di-resolve, cron menggagalkan run dengan galat validasi eksplisit.
- Patch payload API `cron.update` dapat mengatur `model: null` untuk menghapus penggantian model pekerjaan tersimpan.
- `openclaw cron edit <job-id> --clear-model` menghapus penggantian tersebut dari CLI (efek yang sama dengan patch `model: null`) dan tidak dapat digabungkan dengan `--model`.
- Rantai fallback yang dikonfigurasi tetap berlaku karena cron `--model` adalah primary pekerjaan, bukan penggantian `/model` sesi.
- `openclaw cron add|edit --fallbacks ...` mengatur payload `fallbacks`, mengganti fallback yang dikonfigurasi untuk pekerjaan tersebut; `--fallbacks ""` menonaktifkan fallback dan membuat run menjadi ketat. `openclaw cron edit <job-id> --clear-fallbacks` menghapus penggantian per pekerjaan.
- `--model` biasa tanpa daftar fallback eksplisit atau yang dikonfigurasi tidak beralih ke primary agen sebagai target retry tambahan diam-diam.

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

`maxConcurrentRuns` membatasi dispatch cron terjadwal dan eksekusi giliran agen terisolasi, dan default-nya 8. Giliran agen cron terisolasi menggunakan lane eksekusi khusus antrean `cron-nested` secara internal, sehingga menaikkan nilai ini memungkinkan run LLM cron independen berjalan paralel alih-alih hanya memulai pembungkus cron luarnya. Lane bersama non-cron `nested` tidak diperlebar oleh pengaturan ini.

`cron.store` adalah kunci penyimpanan logis dan jalur impor doctor legacy. Jalankan `openclaw doctor --fix` untuk mengimpor penyimpanan JSON yang ada ke SQLite dan mengarsipkannya; perubahan cron mendatang harus melalui CLI atau API Gateway.

Nonaktifkan cron: `cron.enabled: false` atau `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Perilaku retry">
    **Retry sekali jalan**: galat sementara (batas laju, overload, jaringan, galat server) dicoba ulang hingga 3 kali dengan backoff eksponensial. Galat permanen langsung dinonaktifkan.

    **Retry berulang**: backoff eksponensial (30 dtk hingga 60 mnt) antar-retry. Backoff direset setelah run berhasil berikutnya.

  </Accordion>
  <Accordion title="Pemeliharaan">
    `cron.sessionRetention` (default `24h`) memangkas entri sesi run terisolasi. `cron.runLog.keepLines` membatasi baris riwayat run SQLite yang dipertahankan per pekerjaan; `maxBytes` dipertahankan untuk kompatibilitas konfigurasi dengan log run lama yang didukung file.
  </Accordion>
</AccordionGroup>

## Pemecahan Masalah

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
    - Untuk jadwal `cron`, verifikasi zona waktu (`--tz`) dibandingkan zona waktu host.
    - `reason: not-due` dalam output run berarti run manual diperiksa dengan `openclaw cron run <jobId> --due` dan pekerjaan belum jatuh tempo.

  </Accordion>
  <Accordion title="Cron berjalan tetapi tidak ada pengiriman">
    - Mode pengiriman `none` berarti tidak ada pengiriman fallback runner yang diharapkan. Agen masih dapat mengirim langsung dengan tool `message` saat rute chat tersedia.
    - Target pengiriman hilang/tidak valid (`channel`/`to`) berarti outbound dilewati.
    - Untuk Matrix, pekerjaan yang disalin atau legacy dengan ID ruang `delivery.to` yang diubah ke huruf kecil dapat gagal karena ID ruang Matrix peka huruf besar-kecil. Edit pekerjaan ke nilai `!room:server` atau `room:!room:server` persis dari Matrix.
    - Galat autentikasi channel (`unauthorized`, `Forbidden`) berarti pengiriman diblokir oleh kredensial.
    - Jika run terisolasi hanya mengembalikan token senyap (`NO_REPLY` / `no_reply`), OpenClaw menekan pengiriman outbound langsung dan juga menekan jalur ringkasan antrean fallback, sehingga tidak ada yang diposting kembali ke chat.
    - Jika agen harus mengirim pesan ke pengguna sendiri, periksa apakah pekerjaan memiliki rute yang dapat digunakan (`channel: "last"` dengan chat sebelumnya, atau channel/target eksplisit).

  </Accordion>
  <Accordion title="Cron atau Heartbeat tampaknya mencegah rollover gaya /new">
    - Kesegaran reset harian dan idle tidak didasarkan pada `updatedAt`; lihat [Manajemen sesi](/id/concepts/session#session-lifecycle).
    - Wakeup Cron, run Heartbeat, notifikasi exec, dan pembukuan Gateway dapat memperbarui baris sesi untuk perutean/status, tetapi tidak memperpanjang `sessionStartedAt` atau `lastInteractionAt`.
    - Untuk baris legacy yang dibuat sebelum field tersebut ada, OpenClaw dapat memulihkan `sessionStartedAt` dari header sesi JSONL transkrip saat file masih tersedia. Baris idle legacy tanpa `lastInteractionAt` menggunakan waktu mulai yang dipulihkan tersebut sebagai baseline idle-nya.

  </Accordion>
  <Accordion title="Hal yang perlu diperhatikan tentang zona waktu">
    - Cron tanpa `--tz` menggunakan zona waktu host gateway.
    - Jadwal `at` tanpa zona waktu diperlakukan sebagai UTC.
    - Heartbeat `activeHours` menggunakan resolusi zona waktu yang dikonfigurasi.

  </Accordion>
</AccordionGroup>

## Terkait

- [Otomatisasi](/id/automation) — semua mekanisme otomatisasi sekilas
- [Tugas Latar Belakang](/id/automation/tasks) — ledger tugas untuk eksekusi cron
- [Heartbeat](/id/gateway/heartbeat) — giliran sesi utama berkala
- [Zona Waktu](/id/concepts/timezone) — konfigurasi zona waktu
