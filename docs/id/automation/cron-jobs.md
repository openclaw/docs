---
read_when:
    - Menjadwalkan pekerjaan latar belakang atau pengaktifan
    - Menghubungkan pemicu eksternal (Webhook, Gmail) ke OpenClaw
    - Menentukan pilihan antara Heartbeat dan Cron untuk tugas terjadwal
sidebarTitle: Scheduled tasks
summary: Pekerjaan terjadwal, Webhook, dan pemicu Gmail PubSub untuk penjadwal Gateway
title: Tugas terjadwal
x-i18n:
    generated_at: "2026-05-11T20:20:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 56af55d8151b22dedb5ad02c2eb5e706711e1435c806dbc2e2ef71b13ebde3b9
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron adalah penjadwal bawaan Gateway. Cron mempertahankan job, membangunkan agen pada waktu yang tepat, dan dapat mengirim output kembali ke kanal chat atau endpoint Webhook.

## Mulai cepat

<Steps>
  <Step title="Tambahkan pengingat satu kali">
    ```bash
    openclaw cron add \
      --name "Reminder" \
      --at "2026-02-01T16:00:00Z" \
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
  <Step title="Lihat riwayat eksekusi">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## Cara kerja cron

- Cron berjalan **di dalam proses Gateway** (bukan di dalam model).
- Definisi job dipertahankan di `~/.openclaw/cron/jobs.json` sehingga jadwal tidak hilang saat dimulai ulang.
- Status eksekusi runtime dipertahankan di sampingnya dalam `~/.openclaw/cron/jobs-state.json`. Jika Anda melacak definisi cron di git, lacak `jobs.json` dan gitignore `jobs-state.json`.
- Setelah pemisahan, versi OpenClaw yang lebih lama dapat membaca `jobs.json` tetapi mungkin memperlakukan job sebagai baru karena field runtime sekarang berada di `jobs-state.json`.
- Saat `jobs.json` diedit ketika Gateway berjalan atau berhenti, OpenClaw membandingkan field jadwal yang berubah dengan metadata slot runtime tertunda dan menghapus nilai `nextRunAtMs` yang usang. Penulisan ulang yang hanya mengubah format atau urutan key mempertahankan slot tertunda.
- Semua eksekusi cron membuat catatan [tugas latar belakang](/id/automation/tasks).
- Saat Gateway dimulai, job giliran agen terisolasi yang terlambat dijadwalkan ulang ke luar jendela koneksi kanal, bukan langsung diputar ulang, sehingga startup Discord/Telegram dan penyiapan perintah native tetap responsif setelah restart.
- Job satu kali (`--at`) otomatis dihapus setelah berhasil secara default.
- Eksekusi cron terisolasi berupaya menutup tab/proses browser yang terlacak untuk sesi `cron:<jobId>` mereka saat eksekusi selesai, sehingga automasi browser yang terlepas tidak meninggalkan proses yatim.
- Eksekusi cron terisolasi yang menerima izin pembersihan mandiri cron yang sempit tetap dapat membaca status penjadwal, daftar terfilter mandiri untuk job mereka saat ini, dan riwayat eksekusi job tersebut, sehingga pemeriksaan status/Heartbeat dapat memeriksa jadwalnya sendiri tanpa mendapatkan akses mutasi cron yang lebih luas.
- Eksekusi cron terisolasi juga melindungi dari balasan pengakuan yang usang. Jika hasil pertama hanya pembaruan status sementara (`on it`, `pulling everything together`, dan petunjuk serupa) dan tidak ada eksekusi subagen turunan yang masih bertanggung jawab atas jawaban akhir, OpenClaw meminta ulang sekali untuk hasil sebenarnya sebelum pengiriman.
- Eksekusi cron terisolasi lebih memilih metadata penolakan eksekusi terstruktur dari eksekusi tertanam, lalu fallback ke penanda ringkasan/output akhir yang dikenal seperti `SYSTEM_RUN_DENIED` dan `INVALID_REQUEST`, sehingga perintah yang diblokir tidak dilaporkan sebagai eksekusi hijau.
- Eksekusi cron terisolasi juga memperlakukan kegagalan agen tingkat eksekusi sebagai error job meskipun tidak ada payload balasan yang dihasilkan, sehingga kegagalan model/provider menaikkan penghitung error dan memicu notifikasi kegagalan, bukan menandai job sebagai berhasil.
- Saat job giliran agen terisolasi mencapai `timeoutSeconds`, cron membatalkan eksekusi agen yang mendasarinya dan memberinya jendela pembersihan singkat. Jika eksekusi tidak selesai terkuras, pembersihan milik Gateway memaksa pembersihan kepemilikan sesi eksekusi tersebut sebelum cron mencatat timeout, sehingga pekerjaan chat yang mengantre tidak tertinggal di balik sesi pemrosesan yang usang.
- Jika giliran agen terisolasi macet sebelum runner dimulai atau sebelum panggilan model pertama, cron mencatat timeout khusus fase seperti `setup timed out before runner start` atau `stalled before first model call (last phase: context-engine)`. Watchdog ini mencakup provider tertanam dan provider berbasis CLI sebelum proses CLI eksternalnya benar-benar dimulai, dan dibatasi secara independen dari nilai `timeoutSeconds` yang panjang sehingga kegagalan cold-start/auth/context muncul dengan cepat, bukan menunggu seluruh anggaran job.

<a id="maintenance"></a>

<Note>
Rekonsiliasi tugas untuk cron pertama-tama dimiliki runtime, lalu didukung riwayat tahan lama: tugas cron aktif tetap live selama runtime cron masih melacak job tersebut sebagai berjalan, meskipun baris sesi turunan lama masih ada. Setelah runtime berhenti memiliki job dan jendela tenggang 5 menit berakhir, pemeriksaan pemeliharaan memeriksa log eksekusi yang dipertahankan dan status job untuk eksekusi `cron:<jobId>:<startedAt>` yang cocok. Jika riwayat tahan lama tersebut menunjukkan hasil terminal, ledger tugas difinalisasi darinya; jika tidak, pemeliharaan milik Gateway dapat menandai tugas sebagai `lost`. Audit CLI offline dapat memulihkan dari riwayat tahan lama, tetapi tidak memperlakukan kumpulan job aktif dalam prosesnya sendiri yang kosong sebagai bukti bahwa eksekusi cron milik Gateway telah hilang.
</Note>

## Jenis jadwal

| Jenis   | Flag CLI  | Deskripsi                                               |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | Timestamp satu kali (ISO 8601 atau relatif seperti `20m`) |
| `every` | `--every` | Interval tetap                                          |
| `cron`  | `--cron`  | Ekspresi cron 5-field atau 6-field dengan `--tz` opsional |

Timestamp tanpa zona waktu diperlakukan sebagai UTC. Tambahkan `--tz America/New_York` untuk penjadwalan waktu dinding lokal.

Ekspresi berulang pada awal jam secara otomatis disebar hingga 5 menit untuk mengurangi lonjakan beban. Gunakan `--exact` untuk memaksa waktu presisi atau `--stagger 30s` untuk jendela eksplisit.

### Hari dalam bulan dan hari dalam minggu menggunakan logika OR

Ekspresi Cron diurai oleh [croner](https://github.com/Hexagon/croner). Saat field hari dalam bulan dan hari dalam minggu sama-sama bukan wildcard, croner cocok saat **salah satu** field cocok — bukan keduanya. Ini adalah perilaku cron Vixie standar.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Ini berjalan sekitar 5–6 kali per bulan, bukan 0–1 kali per bulan. OpenClaw menggunakan perilaku OR default Croner di sini. Untuk mewajibkan kedua kondisi, gunakan modifier hari dalam minggu `+` dari Croner (`0 9 15 * +1`) atau jadwalkan pada satu field dan lindungi yang lain dalam prompt atau perintah job Anda.

## Gaya eksekusi

| Gaya           | Nilai `--session`    | Berjalan di              | Paling cocok untuk             |
| -------------- | -------------------- | ------------------------ | ------------------------------ |
| Sesi utama     | `main`               | Giliran Heartbeat berikutnya | Pengingat, peristiwa sistem |
| Terisolasi     | `isolated`           | `cron:<jobId>` khusus    | Laporan, pekerjaan latar belakang |
| Sesi saat ini  | `current`            | Diikat saat dibuat       | Pekerjaan berulang sadar konteks |
| Sesi kustom    | `session:custom-id`  | Sesi bernama persisten   | Workflow yang membangun dari riwayat |

<AccordionGroup>
  <Accordion title="Sesi utama vs terisolasi vs kustom">
    Job **sesi utama** mengantrekan peristiwa sistem dan secara opsional membangunkan Heartbeat (`--wake now` atau `--wake next-heartbeat`). Peristiwa sistem tersebut tidak memperpanjang kesegaran reset harian/idle untuk sesi target. Job **terisolasi** menjalankan giliran agen khusus dengan sesi baru. **Sesi kustom** (`session:xxx`) mempertahankan konteks lintas eksekusi, memungkinkan workflow seperti standup harian yang membangun dari ringkasan sebelumnya.
  </Accordion>
  <Accordion title="Makna 'sesi baru' untuk job terisolasi">
    Untuk job terisolasi, "sesi baru" berarti id transkrip/sesi baru untuk setiap eksekusi. OpenClaw dapat membawa preferensi aman seperti pengaturan thinking/fast/verbose, label, dan override model/auth yang dipilih pengguna secara eksplisit, tetapi tidak mewarisi konteks percakapan sekitar dari baris cron yang lebih lama: routing kanal/grup, kebijakan kirim atau antre, elevasi, asal, atau binding runtime ACP. Gunakan `current` atau `session:<id>` saat job berulang memang harus membangun dari konteks percakapan yang sama.
  </Accordion>
  <Accordion title="Pembersihan runtime">
    Untuk job terisolasi, teardown runtime sekarang mencakup pembersihan browser upaya terbaik untuk sesi cron tersebut. Kegagalan pembersihan diabaikan sehingga hasil cron sebenarnya tetap menang.

    Eksekusi cron terisolasi juga membuang instans runtime MCP bawaan apa pun yang dibuat untuk job melalui jalur pembersihan runtime bersama. Ini sesuai dengan cara client MCP sesi utama dan sesi kustom di-teardown, sehingga job cron terisolasi tidak membocorkan proses turunan stdio atau koneksi MCP berumur panjang lintas eksekusi.

  </Accordion>
  <Accordion title="Pengiriman subagen dan Discord">
    Saat eksekusi cron terisolasi mengorkestrasi subagen, pengiriman juga lebih memilih output turunan akhir daripada teks sementara induk yang usang. Jika turunan masih berjalan, OpenClaw menahan pembaruan induk parsial tersebut, bukan mengumumkannya.

    Untuk target pengumuman Discord khusus teks, OpenClaw mengirim teks asisten akhir kanonis sekali, bukan memutar ulang payload teks streaming/perantara sekaligus jawaban akhir. Media dan payload Discord terstruktur tetap dikirim sebagai payload terpisah sehingga lampiran dan komponen tidak terhapus.

  </Accordion>
</AccordionGroup>

### Opsi payload untuk job terisolasi

<ParamField path="--message" type="string" required>
  Teks prompt (wajib untuk terisolasi).
</ParamField>
<ParamField path="--model" type="string">
  Override model; menggunakan model yang diizinkan yang dipilih untuk job.
</ParamField>
<ParamField path="--thinking" type="string">
  Override level thinking.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Lewati injeksi file bootstrap workspace.
</ParamField>
<ParamField path="--tools" type="string">
  Batasi alat yang dapat digunakan job, misalnya `--tools exec,read`.
</ParamField>

`--model` menggunakan model yang diizinkan yang dipilih sebagai model utama job tersebut. Ini tidak sama dengan override `/model` sesi chat: rantai fallback yang dikonfigurasi tetap berlaku saat model utama job gagal. Jika model yang diminta tidak diizinkan atau tidak dapat di-resolve, cron menggagalkan eksekusi dengan error validasi eksplisit, bukan fallback diam-diam ke pilihan model agen/default job.

Job Cron juga dapat membawa `fallbacks` tingkat payload. Saat ada, daftar tersebut menggantikan rantai fallback yang dikonfigurasi untuk job. Gunakan `fallbacks: []` dalam payload/API job saat Anda menginginkan eksekusi cron ketat yang hanya mencoba model yang dipilih. Jika job memiliki `--model` tetapi tidak memiliki fallback payload maupun fallback yang dikonfigurasi, OpenClaw meneruskan override fallback kosong eksplisit sehingga model utama agen tidak ditambahkan sebagai target percobaan ulang ekstra tersembunyi.

Prioritas pemilihan model untuk job terisolasi adalah:

1. Override model hook Gmail (saat eksekusi berasal dari Gmail dan override tersebut diizinkan)
2. `model` payload per job
3. Override model sesi cron tersimpan yang dipilih pengguna
4. Pilihan model agen/default

Mode cepat juga mengikuti pilihan live yang di-resolve. Jika konfigurasi model yang dipilih memiliki `params.fastMode`, cron terisolasi menggunakannya secara default. Override `fastMode` sesi tersimpan tetap menang atas konfigurasi di kedua arah.

Jika eksekusi terisolasi mengalami handoff pergantian model live, cron mencoba ulang dengan provider/model yang dialihkan dan mempertahankan pilihan live tersebut untuk eksekusi aktif sebelum mencoba ulang. Saat pergantian juga membawa profil auth baru, cron juga mempertahankan override profil auth tersebut untuk eksekusi aktif. Percobaan ulang dibatasi: setelah upaya awal ditambah 2 percobaan ulang pergantian, cron membatalkan alih-alih berulang tanpa akhir.

Sebelum eksekusi cron terisolasi memasuki runner agen, OpenClaw memeriksa endpoint penyedia lokal yang dapat dijangkau untuk penyedia `api: "ollama"` dan `api: "openai-completions"` yang dikonfigurasi dengan `baseUrl` berupa loopback, jaringan privat, atau `.local`. Jika endpoint tersebut tidak aktif, eksekusi dicatat sebagai `skipped` dengan kesalahan penyedia/model yang jelas alih-alih memulai panggilan model. Hasil endpoint disimpan dalam cache selama 5 menit, sehingga banyak pekerjaan jatuh tempo yang menggunakan server lokal Ollama, vLLM, SGLang, atau LM Studio yang sama-sama mati berbagi satu probe kecil alih-alih membuat badai permintaan. Eksekusi preflight penyedia yang dilewati tidak menambah backoff kesalahan eksekusi; aktifkan `failureAlert.includeSkipped` bila Anda menginginkan notifikasi skip berulang.

## Pengiriman dan output

| Mode       | Yang terjadi                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Mengirim teks akhir sebagai fallback ke target jika agen tidak mengirim |
| `webhook`  | POST payload peristiwa selesai ke URL                                |
| `none`     | Tidak ada pengiriman fallback runner                                |

Gunakan `--announce --channel telegram --to "-1001234567890"` untuk pengiriman channel. Untuk topik forum Telegram, gunakan `-1001234567890:topic:123`; pemanggil RPC/konfigurasi langsung juga dapat meneruskan `delivery.threadId` sebagai string atau angka. Target Slack/Discord/Mattermost harus menggunakan prefiks eksplisit (`channel:<id>`, `user:<id>`). ID ruang Matrix peka huruf besar/kecil; gunakan ID ruang yang persis atau bentuk `room:!room:server` dari Matrix.

Saat pengiriman announce menggunakan `channel: "last"` atau menghilangkan `channel`, target berprefiks penyedia seperti `telegram:123` dapat memilih channel sebelum cron beralih ke riwayat sesi atau satu channel yang dikonfigurasi. Hanya prefiks yang diiklankan oleh plugin yang dimuat yang menjadi pemilih penyedia. Jika `delivery.channel` eksplisit, prefiks target harus menamai penyedia yang sama; misalnya, `channel: "whatsapp"` dengan `to: "telegram:123"` ditolak alih-alih membiarkan WhatsApp menafsirkan ID Telegram sebagai nomor telepon. Prefiks jenis target dan layanan seperti `channel:<id>`, `user:<id>`, `imessage:<handle>`, dan `sms:<number>` tetap menjadi sintaks target milik channel, bukan pemilih penyedia.

Untuk pekerjaan terisolasi, pengiriman chat dibagikan. Jika rute chat tersedia, agen dapat menggunakan alat `message` bahkan saat pekerjaan menggunakan `--no-deliver`. Jika agen mengirim ke target yang dikonfigurasi/saat ini, OpenClaw melewati announce fallback. Jika tidak, `announce`, `webhook`, dan `none` hanya mengontrol apa yang dilakukan runner terhadap balasan akhir setelah giliran agen.

Saat agen membuat pengingat terisolasi dari chat aktif, OpenClaw menyimpan target pengiriman live yang dipertahankan untuk rute announce fallback. Kunci sesi internal dapat berupa huruf kecil; target pengiriman penyedia tidak direkonstruksi dari kunci tersebut saat konteks chat saat ini tersedia.

Pengiriman announce implisit menggunakan allowlist channel yang dikonfigurasi untuk memvalidasi dan merutekan ulang target usang. Persetujuan penyimpanan pasangan DM bukan penerima otomatisasi fallback; tetapkan `delivery.to` atau konfigurasikan entri `allowFrom` channel saat pekerjaan terjadwal harus mengirim secara proaktif ke DM.

Notifikasi kegagalan mengikuti jalur tujuan terpisah:

- `cron.failureDestination` menetapkan default global untuk notifikasi kegagalan.
- `job.delivery.failureDestination` menimpanya per pekerjaan.
- Jika keduanya tidak disetel dan pekerjaan sudah mengirim melalui `announce`, notifikasi kegagalan kini beralih ke target announce utama tersebut.
- `delivery.failureDestination` hanya didukung pada pekerjaan `sessionTarget="isolated"` kecuali mode pengiriman utama adalah `webhook`.
- `failureAlert.includeSkipped: true` mengikutsertakan pekerjaan atau kebijakan peringatan cron global ke peringatan eksekusi yang dilewati secara berulang. Eksekusi yang dilewati menyimpan penghitung skip beruntun terpisah, sehingga tidak memengaruhi backoff kesalahan eksekusi.

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
    openclaw cron add \
      --name "Morning brief" \
      --cron "0 7 * * *" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --message "Summarize overnight updates." \
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
</Tabs>

## Webhook

Gateway dapat mengekspos endpoint Webhook HTTP untuk pemicu eksternal. Aktifkan di konfigurasi:

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

Setiap permintaan harus menyertakan token hook melalui header:

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

    Kolom: `message` (wajib), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Mapped hooks (POST /hooks/<name>)">
    Nama hook kustom diselesaikan melalui `hooks.mappings` di konfigurasi. Pemetaan dapat mengubah payload arbitrer menjadi tindakan `wake` atau `agent` dengan templat atau transformasi kode.
  </Accordion>
</AccordionGroup>

<Warning>
Jaga endpoint hook tetap berada di balik loopback, tailnet, atau proxy balik tepercaya.

- Gunakan token hook khusus; jangan gunakan ulang token auth gateway.
- Pertahankan `hooks.path` pada subpath khusus; `/` ditolak.
- Tetapkan `hooks.allowedAgentIds` untuk membatasi perutean `agentId` eksplisit.
- Pertahankan `hooks.allowRequestSessionKey=false` kecuali Anda memerlukan sesi yang dipilih pemanggil.
- Jika Anda mengaktifkan `hooks.allowRequestSessionKey`, tetapkan juga `hooks.allowedSessionKeyPrefixes` untuk membatasi bentuk kunci sesi yang diizinkan.
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

Saat `hooks.enabled=true` dan `hooks.gmail.account` disetel, Gateway memulai `gog gmail watch serve` saat boot dan memperbarui watch secara otomatis. Tetapkan `OPENCLAW_SKIP_GMAIL_WATCHER=1` untuk tidak ikut serta.

### Penyiapan manual satu kali

<Steps>
  <Step title="Select the GCP project">
    Pilih proyek GCP yang memiliki klien OAuth yang digunakan oleh `gog`:

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="Create topic and grant Gmail push access">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="Start the watch">
    ```bash
    gog gmail watch start \
      --account openclaw@gmail.com \
      --label INBOX \
      --topic projects/<project-id>/topics/gog-gmail-watch
    ```
  </Step>
</Steps>

### Override model Gmail

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

# Run only if due
openclaw cron run <jobId> --due

# View run history
openclaw cron runs --id <jobId> --limit 50

# Delete a job
openclaw cron remove <jobId>

# Agent selection (multi-agent setups)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

<Note>
Catatan override model:

- `openclaw cron add|edit --model ...` mengubah model yang dipilih pekerjaan.
- Jika model diizinkan, penyedia/model persis tersebut mencapai eksekusi agen terisolasi.
- Jika tidak diizinkan atau tidak dapat diselesaikan, cron menggagalkan eksekusi dengan kesalahan validasi eksplisit.
- Rantai fallback yang dikonfigurasi tetap berlaku karena cron `--model` adalah utama pekerjaan, bukan override `/model` sesi.
- Payload `fallbacks` mengganti fallback yang dikonfigurasi untuk pekerjaan tersebut; `fallbacks: []` menonaktifkan fallback dan membuat eksekusi menjadi ketat.
- `--model` biasa tanpa daftar fallback eksplisit atau terkonfigurasi tidak jatuh ke utama agen sebagai target percobaan ulang tambahan yang diam-diam.

</Note>

## Konfigurasi

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 1,
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

`maxConcurrentRuns` membatasi dispatch cron terjadwal dan eksekusi giliran agen terisolasi. Giliran agen cron terisolasi menggunakan lane eksekusi khusus `cron-nested` milik antrean secara internal, sehingga menaikkan nilai ini memungkinkan eksekusi LLM cron independen berjalan paralel alih-alih hanya memulai wrapper cron luarnya. Lane `nested` non-cron bersama tidak diperlebar oleh pengaturan ini.

Sidecar status runtime diturunkan dari `cron.store`: store `.json` seperti `~/clawd/cron/jobs.json` menggunakan `~/clawd/cron/jobs-state.json`, sementara path store tanpa sufiks `.json` menambahkan `-state.json`.

Jika Anda mengedit `jobs.json` secara manual, biarkan `jobs-state.json` di luar kontrol sumber. OpenClaw menggunakan sidecar tersebut untuk slot tertunda, penanda aktif, metadata eksekusi terakhir, dan identitas jadwal yang memberi tahu scheduler kapan pekerjaan yang diedit secara eksternal memerlukan `nextRunAtMs` baru.

Nonaktifkan cron: `cron.enabled: false` atau `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Retry behavior">
    **Percobaan ulang sekali jalan**: kesalahan sementara (batas laju, overload, jaringan, kesalahan server) dicoba ulang hingga 3 kali dengan backoff eksponensial. Kesalahan permanen langsung dinonaktifkan.

    **Percobaan ulang berulang**: backoff eksponensial (30 dtk hingga 60 mnt) di antara percobaan ulang. Backoff direset setelah eksekusi sukses berikutnya.

  </Accordion>
  <Accordion title="Pemeliharaan">
    `cron.sessionRetention` (default `24h`) memangkas entri run-session terisolasi. `cron.runLog.maxBytes` / `cron.runLog.keepLines` memangkas otomatis file run-log.
  </Accordion>
</AccordionGroup>

## Pemecahan Masalah

### Urutan perintah

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
  <Accordion title="Cron tidak terpicu">
    - Periksa `cron.enabled` dan variabel env `OPENCLAW_SKIP_CRON`.
    - Pastikan Gateway berjalan terus-menerus.
    - Untuk jadwal `cron`, verifikasi zona waktu (`--tz`) dibandingkan dengan zona waktu host.
    - `reason: not-due` dalam output run berarti run manual diperiksa dengan `openclaw cron run <jobId> --due` dan job belum jatuh tempo.

  </Accordion>
  <Accordion title="Cron terpicu tetapi tidak ada pengiriman">
    - Mode pengiriman `none` berarti pengiriman fallback runner tidak diharapkan. Agen tetap dapat mengirim langsung dengan tool `message` saat rute chat tersedia.
    - Target pengiriman hilang/tidak valid (`channel`/`to`) berarti outbound dilewati.
    - Untuk Matrix, job yang disalin atau legacy dengan ID room `delivery.to` yang diubah menjadi huruf kecil dapat gagal karena ID room Matrix peka huruf besar-kecil. Edit job ke nilai `!room:server` atau `room:!room:server` yang tepat dari Matrix.
    - Error auth kanal (`unauthorized`, `Forbidden`) berarti pengiriman diblokir oleh kredensial.
    - Jika run terisolasi hanya mengembalikan token senyap (`NO_REPLY` / `no_reply`), OpenClaw menekan pengiriman outbound langsung dan juga menekan jalur ringkasan antrean fallback, sehingga tidak ada apa pun yang diposting kembali ke chat.
    - Jika agen seharusnya mengirim pesan kepada pengguna sendiri, periksa bahwa job memiliki rute yang dapat digunakan (`channel: "last"` dengan chat sebelumnya, atau kanal/target eksplisit).

  </Accordion>
  <Accordion title="Cron atau heartbeat tampaknya mencegah pergantian /new-style">
    - Kesegaran reset harian dan idle tidak didasarkan pada `updatedAt`; lihat [Manajemen sesi](/id/concepts/session#session-lifecycle).
    - Bangun Cron, run heartbeat, notifikasi exec, dan pembukuan gateway dapat memperbarui baris sesi untuk perutean/status, tetapi tidak memperpanjang `sessionStartedAt` atau `lastInteractionAt`.
    - Untuk baris legacy yang dibuat sebelum field tersebut ada, OpenClaw dapat memulihkan `sessionStartedAt` dari header sesi JSONL transkrip saat file masih tersedia. Baris idle legacy tanpa `lastInteractionAt` menggunakan waktu mulai yang dipulihkan itu sebagai baseline idle.

  </Accordion>
  <Accordion title="Hal-hal penting tentang zona waktu">
    - Cron tanpa `--tz` menggunakan zona waktu host gateway.
    - Jadwal `at` tanpa zona waktu diperlakukan sebagai UTC.
    - Heartbeat `activeHours` menggunakan resolusi zona waktu yang dikonfigurasi.

  </Accordion>
</AccordionGroup>

## Terkait

- [Automation & Tasks](/id/automation) — semua mekanisme otomatisasi sekilas
- [Background Tasks](/id/automation/tasks) — ledger tugas untuk eksekusi cron
- [Heartbeat](/id/gateway/heartbeat) — giliran sesi utama berkala
- [Zona waktu](/id/concepts/timezone) — konfigurasi zona waktu
