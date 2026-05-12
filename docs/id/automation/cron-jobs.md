---
read_when:
    - Menjadwalkan pekerjaan latar belakang atau pemicu bangun
    - Menghubungkan pemicu eksternal (Webhook, Gmail) ke OpenClaw
    - Memilih antara Heartbeat dan Cron untuk tugas terjadwal
sidebarTitle: Scheduled tasks
summary: Pekerjaan terjadwal, Webhook, dan pemicu Gmail PubSub untuk penjadwal Gateway
title: Tugas terjadwal
x-i18n:
    generated_at: "2026-05-12T00:56:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: a713c6aa2467e3c0331fe94605ba83d542632e5e426e94019d6958ef91da1da3
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron adalah penjadwal bawaan Gateway. Cron mempertahankan job, membangunkan agent pada waktu yang tepat, dan dapat mengirimkan output kembali ke channel chat atau endpoint Webhook.

## Mulai cepat

<Steps>
  <Step title="Tambahkan pengingat sekali jalan">
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
- Definisi job dipertahankan di `~/.openclaw/cron/jobs.json` sehingga jadwal tidak hilang saat restart.
- Status eksekusi runtime dipertahankan di sebelahnya dalam `~/.openclaw/cron/jobs-state.json`. Jika Anda melacak definisi cron di git, lacak `jobs.json` dan masukkan `jobs-state.json` ke gitignore.
- Setelah pemisahan, versi OpenClaw lama dapat membaca `jobs.json` tetapi mungkin memperlakukan job sebagai baru karena field runtime kini berada di `jobs-state.json`.
- Saat `jobs.json` diedit ketika Gateway sedang berjalan atau berhenti, OpenClaw membandingkan field jadwal yang berubah dengan metadata slot runtime tertunda dan menghapus nilai `nextRunAtMs` yang usang. Penulisan ulang yang hanya mengubah format atau urutan key mempertahankan slot tertunda.
- Semua eksekusi cron membuat catatan [tugas latar belakang](/id/automation/tasks).
- Saat Gateway startup, job agent-turn terisolasi yang terlambat dijadwalkan ulang keluar dari jendela koneksi channel alih-alih diputar ulang seketika, sehingga startup Discord/Telegram dan setup perintah native tetap responsif setelah restart.
- Job sekali jalan (`--at`) otomatis dihapus setelah berhasil secara default.
- Eksekusi cron terisolasi menutup tab/proses browser terlacak secara upaya terbaik untuk sesi `cron:<jobId>` miliknya saat eksekusi selesai, sehingga otomatisasi browser yang terlepas tidak meninggalkan proses yatim.
- Eksekusi cron terisolasi yang menerima izin sempit pembersihan mandiri cron tetap dapat membaca status penjadwal, daftar yang difilter mandiri dari job mereka saat ini, dan riwayat eksekusi job tersebut, sehingga pemeriksaan status/heartbeat dapat memeriksa jadwalnya sendiri tanpa memperoleh akses mutasi cron yang lebih luas.
- Eksekusi cron terisolasi juga melindungi dari balasan pengakuan yang usang. Jika hasil pertama hanya pembaruan status sementara (`on it`, `pulling everything together`, dan petunjuk serupa) dan tidak ada eksekusi subagent turunan yang masih bertanggung jawab atas jawaban akhir, OpenClaw meminta ulang sekali untuk hasil sebenarnya sebelum pengiriman.
- Eksekusi cron terisolasi lebih memilih metadata penolakan eksekusi terstruktur dari eksekusi tertanam, lalu fallback ke penanda ringkasan/output akhir yang dikenal seperti `SYSTEM_RUN_DENIED` dan `INVALID_REQUEST`, sehingga perintah yang diblokir tidak dilaporkan sebagai eksekusi hijau.
- Eksekusi cron terisolasi juga memperlakukan kegagalan agent tingkat eksekusi sebagai error job meskipun tidak ada payload balasan yang dihasilkan, sehingga kegagalan model/provider menambah penghitung error dan memicu notifikasi kegagalan alih-alih membersihkan job sebagai berhasil.
- Saat job agent-turn terisolasi mencapai `timeoutSeconds`, cron membatalkan eksekusi agent yang mendasarinya dan memberinya jendela pembersihan singkat. Jika eksekusi tidak selesai mengalir, pembersihan milik Gateway menghapus paksa kepemilikan sesi eksekusi tersebut sebelum cron mencatat timeout, sehingga pekerjaan chat yang mengantre tidak tertinggal di balik sesi pemrosesan yang usang.
- Jika agent-turn terisolasi macet sebelum runner dimulai atau sebelum panggilan model pertama, cron mencatat timeout spesifik fase seperti `setup timed out before runner start` atau `stalled before first model call (last phase: context-engine)`. Watchdog ini mencakup provider tertanam dan provider berbasis CLI sebelum proses CLI eksternalnya benar-benar dimulai, dan dibatasi secara independen dari nilai `timeoutSeconds` yang panjang sehingga kegagalan cold-start/auth/context muncul cepat alih-alih menunggu seluruh anggaran job.

<a id="maintenance"></a>

<Note>
Rekonsiliasi tugas untuk cron pertama-tama dimiliki runtime, lalu didukung riwayat tahan lama: tugas cron aktif tetap live selama runtime cron masih melacak job tersebut sebagai berjalan, meskipun baris sesi child lama masih ada. Setelah runtime berhenti memiliki job dan jendela tenggang 5 menit berakhir, pemeliharaan memeriksa log eksekusi yang dipertahankan dan status job untuk eksekusi `cron:<jobId>:<startedAt>` yang cocok. Jika riwayat tahan lama tersebut menunjukkan hasil terminal, ledger tugas difinalisasi darinya; jika tidak, pemeliharaan milik Gateway dapat menandai tugas sebagai `lost`. Audit CLI offline dapat memulihkan dari riwayat tahan lama, tetapi tidak memperlakukan set active-job dalam prosesnya sendiri yang kosong sebagai bukti bahwa eksekusi cron milik Gateway sudah hilang.
</Note>

## Jenis jadwal

| Jenis   | Flag CLI  | Deskripsi                                                |
| ------- | --------- | -------------------------------------------------------- |
| `at`    | `--at`    | Timestamp sekali jalan (ISO 8601 atau relatif seperti `20m`) |
| `every` | `--every` | Interval tetap                                           |
| `cron`  | `--cron`  | Ekspresi cron 5-field atau 6-field dengan `--tz` opsional |

Timestamp tanpa zona waktu diperlakukan sebagai UTC. Tambahkan `--tz America/New_York` untuk penjadwalan waktu dinding lokal.

Ekspresi berulang di awal jam otomatis disebar hingga 5 menit untuk mengurangi lonjakan beban. Gunakan `--exact` untuk memaksa waktu yang presisi atau `--stagger 30s` untuk jendela eksplisit.

### Day-of-month dan day-of-week menggunakan logika OR

Ekspresi cron diurai oleh [croner](https://github.com/Hexagon/croner). Saat field day-of-month dan day-of-week sama-sama bukan wildcard, croner cocok ketika **salah satu** field cocok — bukan keduanya. Ini adalah perilaku cron Vixie standar.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Ini berjalan sekitar 5–6 kali per bulan alih-alih 0–1 kali per bulan. OpenClaw menggunakan perilaku OR default Croner di sini. Untuk mewajibkan kedua kondisi, gunakan modifier day-of-week `+` milik Croner (`0 9 15 * +1`) atau jadwalkan pada satu field dan lindungi field lainnya dalam prompt atau perintah job Anda.

## Gaya eksekusi

| Gaya           | Nilai `--session`  | Berjalan di              | Paling cocok untuk             |
| -------------- | ------------------ | ------------------------ | ------------------------------ |
| Sesi utama     | `main`             | Giliran Heartbeat berikutnya | Pengingat, event sistem        |
| Terisolasi     | `isolated`         | `cron:<jobId>` khusus    | Laporan, pekerjaan latar belakang |
| Sesi saat ini  | `current`          | Diikat saat pembuatan    | Pekerjaan berulang sadar konteks |
| Sesi kustom    | `session:custom-id` | Sesi bernama persisten  | Workflow yang membangun di atas riwayat |

<AccordionGroup>
  <Accordion title="Sesi utama vs terisolasi vs kustom">
    Job **sesi utama** mengantrekan event sistem dan secara opsional membangunkan Heartbeat (`--wake now` atau `--wake next-heartbeat`). Event sistem tersebut tidak memperpanjang kesegaran reset harian/idle untuk sesi target. Job **terisolasi** menjalankan agent turn khusus dengan sesi baru. **Sesi kustom** (`session:xxx`) mempertahankan konteks di seluruh eksekusi, memungkinkan workflow seperti standup harian yang membangun di atas ringkasan sebelumnya.
  </Accordion>
  <Accordion title="Arti 'sesi baru' untuk job terisolasi">
    Untuk job terisolasi, "sesi baru" berarti id transkrip/sesi baru untuk setiap eksekusi. OpenClaw dapat membawa preferensi aman seperti pengaturan thinking/fast/verbose, label, dan override model/auth yang dipilih pengguna secara eksplisit, tetapi tidak mewarisi konteks percakapan sekitar dari baris cron lama: routing channel/grup, kebijakan kirim atau antre, elevasi, origin, atau binding runtime ACP. Gunakan `current` atau `session:<id>` saat job berulang memang harus membangun di atas konteks percakapan yang sama.
  </Accordion>
  <Accordion title="Pembersihan runtime">
    Untuk job terisolasi, teardown runtime kini mencakup pembersihan browser upaya terbaik untuk sesi cron tersebut. Kegagalan pembersihan diabaikan sehingga hasil cron sebenarnya tetap menjadi penentu.

    Eksekusi cron terisolasi juga membuang instance runtime MCP bundel apa pun yang dibuat untuk job melalui jalur pembersihan runtime bersama. Ini sesuai dengan cara klien MCP sesi utama dan sesi kustom dibongkar, sehingga job cron terisolasi tidak membocorkan proses child stdio atau koneksi MCP berumur panjang antar eksekusi.

  </Accordion>
  <Accordion title="Pengiriman subagent dan Discord">
    Saat eksekusi cron terisolasi mengorkestrasi subagent, pengiriman juga lebih memilih output turunan akhir daripada teks sementara parent yang usang. Jika turunan masih berjalan, OpenClaw menahan pembaruan parent parsial tersebut alih-alih mengumumkannya.

    Untuk target pengumuman Discord teks saja, OpenClaw mengirim teks assistant akhir kanonis sekali alih-alih memutar ulang payload teks streamed/menengah sekaligus jawaban akhir. Payload media dan Discord terstruktur tetap dikirim sebagai payload terpisah sehingga lampiran dan komponen tidak hilang.

  </Accordion>
</AccordionGroup>

### Opsi payload untuk job terisolasi

<ParamField path="--message" type="string" required>
  Teks prompt (wajib untuk terisolasi).
</ParamField>
<ParamField path="--model" type="string">
  Override model; menggunakan model yang diizinkan dan dipilih untuk job.
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

`--model` menggunakan model yang diizinkan dan dipilih sebagai model utama job tersebut. Ini tidak sama dengan override `/model` sesi chat: chain fallback yang dikonfigurasi tetap berlaku saat model utama job gagal. Jika model yang diminta tidak diizinkan atau tidak dapat di-resolve, cron menggagalkan eksekusi dengan error validasi eksplisit alih-alih fallback diam-diam ke pemilihan model agent/default job.

Job cron juga dapat membawa `fallbacks` tingkat payload. Jika ada, daftar tersebut menggantikan chain fallback yang dikonfigurasi untuk job. Gunakan `fallbacks: []` dalam payload/API job saat Anda menginginkan eksekusi cron ketat yang hanya mencoba model yang dipilih. Jika job memiliki `--model` tetapi tidak memiliki fallback payload maupun yang dikonfigurasi, OpenClaw meneruskan override fallback kosong eksplisit sehingga model utama agent tidak ditambahkan sebagai target percobaan ulang ekstra tersembunyi.

Prioritas pemilihan model untuk job terisolasi adalah:

1. Override model hook Gmail (saat eksekusi berasal dari Gmail dan override tersebut diizinkan)
2. `model` payload per job
3. Override model sesi cron tersimpan yang dipilih pengguna
4. Pemilihan model agent/default

Mode cepat juga mengikuti pemilihan live yang di-resolve. Jika konfigurasi model yang dipilih memiliki `params.fastMode`, cron terisolasi menggunakannya secara default. Override `fastMode` sesi tersimpan tetap menang atas konfigurasi di kedua arah.

Jika eksekusi terisolasi terkena handoff pengalihan model live, cron mencoba ulang dengan provider/model yang dialihkan dan mempertahankan pemilihan live tersebut untuk eksekusi aktif sebelum mencoba ulang. Saat pengalihan juga membawa profil auth baru, cron juga mempertahankan override profil auth tersebut untuk eksekusi aktif. Percobaan ulang dibatasi: setelah upaya awal plus 2 percobaan ulang pengalihan, cron membatalkan alih-alih berulang selamanya.

Sebelum eksekusi cron terisolasi memasuki runner agen, OpenClaw memeriksa endpoint penyedia lokal yang dapat dijangkau untuk penyedia `api: "ollama"` dan `api: "openai-completions"` yang dikonfigurasi dengan `baseUrl` berupa loopback, jaringan privat, atau `.local`. Jika endpoint tersebut mati, eksekusi dicatat sebagai `skipped` dengan error penyedia/model yang jelas, bukan memulai panggilan model. Hasil endpoint di-cache selama 5 menit, sehingga banyak job jatuh tempo yang menggunakan server lokal Ollama, vLLM, SGLang, atau LM Studio yang sama-sama mati berbagi satu probe kecil alih-alih membuat badai permintaan. Eksekusi preflight penyedia yang dilewati tidak menambah backoff error eksekusi; aktifkan `failureAlert.includeSkipped` saat Anda menginginkan notifikasi skip berulang.

## Pengiriman dan keluaran

| Mode       | Yang terjadi                                                       |
| ---------- | ------------------------------------------------------------------ |
| `announce` | Mengirim teks akhir secara fallback ke target jika agen tidak mengirim |
| `webhook`  | POST payload peristiwa selesai ke sebuah URL                       |
| `none`     | Tidak ada pengiriman fallback runner                               |

Gunakan `--announce --channel telegram --to "-1001234567890"` untuk pengiriman channel. Untuk topik forum Telegram, gunakan `-1001234567890:topic:123`; pemanggil RPC/konfigurasi langsung juga dapat meneruskan `delivery.threadId` sebagai string atau angka. Target Slack/Discord/Mattermost sebaiknya menggunakan prefiks eksplisit (`channel:<id>`, `user:<id>`). ID ruang Matrix peka huruf besar-kecil; gunakan ID ruang persisnya atau bentuk `room:!room:server` dari Matrix.

Saat pengiriman announce menggunakan `channel: "last"` atau menghilangkan `channel`, target berprefiks penyedia seperti `telegram:123` dapat memilih channel sebelum cron kembali ke riwayat sesi atau satu channel terkonfigurasi. Hanya prefiks yang diiklankan oleh Plugin yang dimuat yang menjadi pemilih penyedia. Jika `delivery.channel` eksplisit, prefiks target harus menyebut penyedia yang sama; misalnya, `channel: "whatsapp"` dengan `to: "telegram:123"` ditolak alih-alih membiarkan WhatsApp menafsirkan ID Telegram sebagai nomor telepon. Prefiks jenis target dan layanan seperti `channel:<id>`, `user:<id>`, `imessage:<handle>`, dan `sms:<number>` tetap menjadi sintaks target yang dimiliki channel, bukan pemilih penyedia.

Untuk job terisolasi, pengiriman chat dibagikan. Jika rute chat tersedia, agen dapat menggunakan tool `message` bahkan saat job menggunakan `--no-deliver`. Jika agen mengirim ke target yang dikonfigurasi/saat ini, OpenClaw melewati announce fallback. Jika tidak, `announce`, `webhook`, dan `none` hanya mengontrol apa yang dilakukan runner dengan balasan akhir setelah giliran agen.

Saat agen membuat pengingat terisolasi dari chat aktif, OpenClaw menyimpan target pengiriman live yang dipertahankan untuk rute announce fallback. Kunci sesi internal dapat berupa huruf kecil; target pengiriman penyedia tidak direkonstruksi dari kunci tersebut saat konteks chat saat ini tersedia.

Pengiriman announce implisit menggunakan allowlist channel yang dikonfigurasi untuk memvalidasi dan mengalihkan target basi. Persetujuan pairing-store DM bukan penerima otomatisasi fallback; tetapkan `delivery.to` atau konfigurasikan entri channel `allowFrom` saat job terjadwal harus mengirim secara proaktif ke DM.

Notifikasi kegagalan mengikuti jalur tujuan terpisah:

- `cron.failureDestination` menetapkan default global untuk notifikasi kegagalan.
- `job.delivery.failureDestination` menimpanya per job.
- Jika keduanya tidak ditetapkan dan job sudah mengirim melalui `announce`, notifikasi kegagalan sekarang kembali ke target announce utama tersebut.
- `delivery.failureDestination` hanya didukung pada job `sessionTarget="isolated"` kecuali mode pengiriman utama adalah `webhook`.
- `failureAlert.includeSkipped: true` memasukkan job atau kebijakan peringatan cron global ke dalam peringatan eksekusi yang dilewati secara berulang. Eksekusi yang dilewati mempertahankan penghitung skip berurutan terpisah, sehingga tidak memengaruhi backoff error eksekusi.

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
  <Tab title="Job terisolasi berulang">
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
  <Tab title="Override model dan pemikiran">
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

    Field: `message` (wajib), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Hook yang dipetakan (POST /hooks/<name>)">
    Nama hook kustom diselesaikan melalui `hooks.mappings` di konfigurasi. Pemetaan dapat mengubah payload arbitrer menjadi tindakan `wake` atau `agent` dengan templat atau transformasi kode.
  </Accordion>
</AccordionGroup>

<Warning>
Simpan endpoint hook di balik loopback, tailnet, atau reverse proxy tepercaya.

- Gunakan token hook khusus; jangan gunakan ulang token autentikasi gateway.
- Simpan `hooks.path` pada subpath khusus; `/` ditolak.
- Tetapkan `hooks.allowedAgentIds` untuk membatasi perutean `agentId` eksplisit.
- Pertahankan `hooks.allowRequestSessionKey=false` kecuali Anda memerlukan sesi yang dipilih pemanggil.
- Jika Anda mengaktifkan `hooks.allowRequestSessionKey`, tetapkan juga `hooks.allowedSessionKeyPrefixes` untuk membatasi bentuk kunci sesi yang diizinkan.
- Payload hook dibungkus dengan batasan keselamatan secara default.

</Warning>

## Integrasi Gmail PubSub

Hubungkan pemicu inbox Gmail ke OpenClaw melalui Google PubSub.

<Note>
**Prasyarat:** CLI `gcloud`, `gog` (gogcli), hook OpenClaw diaktifkan, Tailscale untuk endpoint HTTPS publik.
</Note>

### Penyiapan wizard (direkomendasikan)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Ini menulis konfigurasi `hooks.gmail`, mengaktifkan preset Gmail, dan menggunakan Tailscale Funnel untuk endpoint push.

### Auto-start Gateway

Saat `hooks.enabled=true` dan `hooks.gmail.account` ditetapkan, Gateway memulai `gog gmail watch serve` saat boot dan memperbarui watch secara otomatis. Tetapkan `OPENCLAW_SKIP_GMAIL_WATCHER=1` untuk tidak ikut.

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

- `openclaw cron add|edit --model ...` mengubah model yang dipilih job.
- Jika model diizinkan, penyedia/model persis itu mencapai eksekusi agen terisolasi.
- Jika tidak diizinkan atau tidak dapat diselesaikan, cron menggagalkan eksekusi dengan error validasi eksplisit.
- Rantai fallback yang dikonfigurasi tetap berlaku karena cron `--model` adalah primer job, bukan override `/model` sesi.
- Payload `fallbacks` menggantikan fallback yang dikonfigurasi untuk job tersebut; `fallbacks: []` menonaktifkan fallback dan membuat eksekusi ketat.
- `--model` biasa tanpa daftar fallback eksplisit atau terkonfigurasi tidak jatuh ke primer agen sebagai target retry ekstra diam-diam.

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

`maxConcurrentRuns` membatasi dispatch cron terjadwal sekaligus eksekusi giliran agen terisolasi. Giliran agen cron terisolasi menggunakan lane eksekusi khusus antrean `cron-nested` secara internal, sehingga menaikkan nilai ini memungkinkan eksekusi LLM cron independen berjalan paralel alih-alih hanya memulai wrapper cron luarnya. Lane `nested` non-cron bersama tidak diperlebar oleh pengaturan ini.

Sidecar status runtime diturunkan dari `cron.store`: store `.json` seperti `~/clawd/cron/jobs.json` menggunakan `~/clawd/cron/jobs-state.json`, sedangkan path store tanpa sufiks `.json` menambahkan `-state.json`.

Jika Anda mengedit `jobs.json` secara manual, jangan masukkan `jobs-state.json` ke kontrol sumber. OpenClaw menggunakan sidecar tersebut untuk slot tertunda, penanda aktif, metadata eksekusi terakhir, dan identitas jadwal yang memberi tahu scheduler kapan job yang diedit secara eksternal memerlukan `nextRunAtMs` baru.

Nonaktifkan cron: `cron.enabled: false` atau `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Perilaku retry">
    **Retry sekali jalan**: error sementara (batas laju, overload, jaringan, error server) mencoba ulang hingga 3 kali dengan backoff eksponensial. Error permanen langsung menonaktifkan.

    **Retry berulang**: backoff eksponensial (30 dtk hingga 60 mnt) di antara retry. Backoff direset setelah eksekusi berhasil berikutnya.

  </Accordion>
  <Accordion title="Pemeliharaan">
    `cron.sessionRetention` (default `24h`) memangkas entri run-session terisolasi. `cron.runLog.maxBytes` / `cron.runLog.keepLines` memangkas otomatis file run-log.
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
    - Periksa `cron.enabled` dan env var `OPENCLAW_SKIP_CRON`.
    - Pastikan Gateway berjalan terus-menerus.
    - Untuk jadwal `cron`, verifikasi zona waktu (`--tz`) dibandingkan zona waktu host.
    - `reason: not-due` dalam output run berarti run manual diperiksa dengan `openclaw cron run <jobId> --due` dan job belum jatuh tempo.

  </Accordion>
  <Accordion title="Cron berjalan tetapi tidak ada pengiriman">
    - Mode pengiriman `none` berarti tidak ada pengiriman fallback runner yang diharapkan. Agent tetap dapat mengirim langsung dengan tool `message` ketika rute chat tersedia.
    - Target pengiriman tidak ada/tidak valid (`channel`/`to`) berarti outbound dilewati.
    - Untuk Matrix, job yang disalin atau legacy dengan ID room `delivery.to` berhuruf kecil dapat gagal karena ID room Matrix peka huruf besar-kecil. Edit job ke nilai `!room:server` atau `room:!room:server` yang persis dari Matrix.
    - Error auth channel (`unauthorized`, `Forbidden`) berarti pengiriman diblokir oleh kredensial.
    - Jika run terisolasi hanya mengembalikan token senyap (`NO_REPLY` / `no_reply`), OpenClaw menekan pengiriman outbound langsung dan juga menekan jalur ringkasan antrean fallback, sehingga tidak ada yang diposting kembali ke chat.
    - Jika agent seharusnya mengirim pesan ke pengguna sendiri, periksa bahwa job memiliki rute yang dapat digunakan (`channel: "last"` dengan chat sebelumnya, atau channel/target eksplisit).

  </Accordion>
  <Accordion title="Cron atau heartbeat tampaknya mencegah rollover /new-style">
    - Kesegaran reset harian dan idle tidak didasarkan pada `updatedAt`; lihat [Manajemen sesi](/id/concepts/session#session-lifecycle).
    - Wakeup Cron, run heartbeat, notifikasi exec, dan pembukuan gateway dapat memperbarui baris sesi untuk routing/status, tetapi tidak memperpanjang `sessionStartedAt` atau `lastInteractionAt`.
    - Untuk baris legacy yang dibuat sebelum field tersebut ada, OpenClaw dapat memulihkan `sessionStartedAt` dari header sesi transcript JSONL ketika file masih tersedia. Baris idle legacy tanpa `lastInteractionAt` menggunakan waktu mulai yang dipulihkan itu sebagai baseline idle-nya.

  </Accordion>
  <Accordion title="Hal-hal penting tentang zona waktu">
    - Cron tanpa `--tz` menggunakan zona waktu host gateway.
    - Jadwal `at` tanpa zona waktu diperlakukan sebagai UTC.
    - Heartbeat `activeHours` menggunakan resolusi zona waktu yang dikonfigurasi.

  </Accordion>
</AccordionGroup>

## Terkait

- [Automasi](/id/automation) — semua mekanisme automasi sekilas
- [Tugas Latar Belakang](/id/automation/tasks) — ledger tugas untuk eksekusi cron
- [Heartbeat](/id/gateway/heartbeat) — giliran sesi utama berkala
- [Zona Waktu](/id/concepts/timezone) — konfigurasi zona waktu
