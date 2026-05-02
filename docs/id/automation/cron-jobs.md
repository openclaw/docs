---
read_when:
    - Menjadwalkan pekerjaan latar belakang atau pemicu bangun
    - Menghubungkan pemicu eksternal (Webhook, Gmail) ke OpenClaw
    - Memilih antara Heartbeat dan Cron untuk tugas terjadwal
sidebarTitle: Scheduled tasks
summary: Pekerjaan terjadwal, Webhook, dan pemicu Gmail PubSub untuk penjadwal Gateway
title: Tugas terjadwal
x-i18n:
    generated_at: "2026-05-02T09:12:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: d7c70042c28b08140d664678ef42146942158512dce1f41c988be0f2dd9bedf5
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron adalah penjadwal bawaan Gateway. Cron mempertahankan job, membangunkan agent pada waktu yang tepat, dan dapat mengirimkan output kembali ke channel chat atau endpoint webhook.

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
- Definisi job dipertahankan di `~/.openclaw/cron/jobs.json` sehingga restart tidak menghilangkan jadwal.
- Status eksekusi runtime dipertahankan di sebelahnya dalam `~/.openclaw/cron/jobs-state.json`. Jika Anda melacak definisi cron di git, lacak `jobs.json` dan gitignore `jobs-state.json`.
- Setelah pemisahan, versi OpenClaw yang lebih lama dapat membaca `jobs.json` tetapi mungkin memperlakukan job sebagai baru karena field runtime kini berada di `jobs-state.json`.
- Saat `jobs.json` diedit ketika Gateway sedang berjalan atau berhenti, OpenClaw membandingkan field jadwal yang berubah dengan metadata slot runtime yang tertunda dan menghapus nilai `nextRunAtMs` yang usang. Perubahan format murni atau penulisan ulang yang hanya mengubah urutan key mempertahankan slot tertunda.
- Semua eksekusi cron membuat catatan [tugas latar belakang](/id/automation/tasks).
- Saat Gateway dimulai, job agent-turn terisolasi yang terlambat dijadwalkan ulang keluar dari jendela koneksi channel alih-alih diputar ulang segera, sehingga startup Discord/Telegram dan penyiapan native-command tetap responsif setelah restart.
- Job sekali jalan (`--at`) otomatis dihapus setelah berhasil secara default.
- Run cron terisolasi melakukan best-effort untuk menutup tab/proses browser yang dilacak untuk sesi `cron:<jobId>` mereka saat run selesai, sehingga otomatisasi browser yang terlepas tidak meninggalkan proses yatim.
- Run cron terisolasi juga melindungi dari balasan acknowledgement yang usang. Jika hasil pertama hanya berupa pembaruan status sementara (`on it`, `pulling everything together`, dan petunjuk serupa) dan tidak ada run subagent turunan yang masih bertanggung jawab atas jawaban akhir, OpenClaw meminta ulang sekali untuk hasil sebenarnya sebelum pengiriman.
- Run cron terisolasi lebih memilih metadata penolakan eksekusi terstruktur dari run tertanam, lalu fallback ke penanda ringkasan/output akhir yang dikenal seperti `SYSTEM_RUN_DENIED` dan `INVALID_REQUEST`, sehingga perintah yang diblokir tidak dilaporkan sebagai run hijau.
- Run cron terisolasi juga memperlakukan kegagalan agent tingkat run sebagai error job meskipun tidak ada payload balasan yang dihasilkan, sehingga kegagalan model/provider menaikkan penghitung error dan memicu notifikasi kegagalan alih-alih menandai job berhasil.
- Saat job agent-turn terisolasi mencapai `timeoutSeconds`, cron membatalkan run agent yang mendasarinya dan memberinya jendela pembersihan singkat. Jika run tidak selesai dibersihkan, pembersihan milik Gateway memaksa penghapusan kepemilikan sesi run tersebut sebelum cron mencatat timeout, sehingga pekerjaan chat yang mengantre tidak tertinggal di belakang sesi pemrosesan yang usang.

<a id="maintenance"></a>

<Note>
Rekonsiliasi tugas untuk cron terlebih dahulu dimiliki runtime, lalu didukung riwayat tahan lama: tugas cron aktif tetap live selama runtime cron masih melacak job tersebut sebagai berjalan, meskipun baris sesi anak lama masih ada. Setelah runtime berhenti memiliki job dan jendela toleransi 5 menit kedaluwarsa, pemeliharaan memeriksa log run yang dipertahankan dan status job untuk run `cron:<jobId>:<startedAt>` yang cocok. Jika riwayat tahan lama tersebut menunjukkan hasil terminal, ledger tugas difinalisasi darinya; jika tidak, pemeliharaan milik Gateway dapat menandai tugas sebagai `lost`. Audit CLI offline dapat memulihkan dari riwayat tahan lama, tetapi tidak memperlakukan set job aktif dalam prosesnya sendiri yang kosong sebagai bukti bahwa run cron milik Gateway telah hilang.
</Note>

## Jenis jadwal

| Jenis   | Flag CLI  | Deskripsi                                               |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | Timestamp sekali jalan (ISO 8601 atau relatif seperti `20m`) |
| `every` | `--every` | Interval tetap                                          |
| `cron`  | `--cron`  | Ekspresi cron 5-field atau 6-field dengan `--tz` opsional |

Timestamp tanpa zona waktu diperlakukan sebagai UTC. Tambahkan `--tz America/New_York` untuk penjadwalan waktu lokal.

Ekspresi berulang di awal jam secara otomatis disebar hingga 5 menit untuk mengurangi lonjakan beban. Gunakan `--exact` untuk memaksa waktu presisi atau `--stagger 30s` untuk jendela eksplisit.

### Hari dalam bulan dan hari dalam minggu menggunakan logika OR

Ekspresi Cron diuraikan oleh [croner](https://github.com/Hexagon/croner). Saat field hari dalam bulan dan hari dalam minggu sama-sama bukan wildcard, croner cocok ketika **salah satu** field cocok — bukan keduanya. Ini adalah perilaku standar Vixie cron.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Ini berjalan sekitar 5–6 kali per bulan, bukan 0–1 kali per bulan. OpenClaw menggunakan perilaku OR default Croner di sini. Untuk mewajibkan kedua kondisi, gunakan modifier hari-dalam-minggu `+` milik Croner (`0 9 15 * +1`) atau jadwalkan pada satu field dan lindungi field lainnya di prompt atau perintah job Anda.

## Gaya eksekusi

| Gaya           | Nilai `--session`   | Berjalan di              | Terbaik untuk                  |
| -------------- | ------------------- | ------------------------ | ------------------------------ |
| Sesi utama     | `main`              | Giliran heartbeat berikutnya | Pengingat, system event     |
| Terisolasi     | `isolated`          | `cron:<jobId>` khusus    | Laporan, tugas latar belakang |
| Sesi saat ini  | `current`           | Diikat saat pembuatan    | Pekerjaan berulang sadar konteks |
| Sesi kustom    | `session:custom-id` | Sesi bernama persisten   | Workflow yang dibangun di atas riwayat |

<AccordionGroup>
  <Accordion title="Sesi utama vs terisolasi vs kustom">
    Job **sesi utama** mengantrekan system event dan secara opsional membangunkan heartbeat (`--wake now` atau `--wake next-heartbeat`). System event tersebut tidak memperpanjang freshness reset harian/idle untuk sesi target. Job **terisolasi** menjalankan giliran agent khusus dengan sesi baru. **Sesi kustom** (`session:xxx`) mempertahankan konteks lintas run, memungkinkan workflow seperti standup harian yang dibangun di atas ringkasan sebelumnya.
  </Accordion>
  <Accordion title="Arti 'sesi baru' untuk job terisolasi">
    Untuk job terisolasi, "sesi baru" berarti id transkrip/sesi baru untuk setiap run. OpenClaw dapat membawa preferensi aman seperti pengaturan thinking/fast/verbose, label, dan override model/auth yang dipilih pengguna secara eksplisit, tetapi tidak mewarisi konteks percakapan sekitar dari baris cron yang lebih lama: routing channel/grup, kebijakan kirim atau antre, elevasi, asal, atau binding runtime ACP. Gunakan `current` atau `session:<id>` saat job berulang memang harus dibangun di atas konteks percakapan yang sama.
  </Accordion>
  <Accordion title="Pembersihan runtime">
    Untuk job terisolasi, teardown runtime kini menyertakan pembersihan browser best-effort untuk sesi cron tersebut. Kegagalan pembersihan diabaikan sehingga hasil cron yang sebenarnya tetap menjadi penentu.

    Run cron terisolasi juga membuang instance runtime MCP bawaan yang dibuat untuk job melalui jalur pembersihan runtime bersama. Ini sesuai dengan cara client MCP sesi utama dan sesi kustom dirobohkan, sehingga job cron terisolasi tidak membocorkan proses anak stdio atau koneksi MCP berumur panjang lintas run.

  </Accordion>
  <Accordion title="Pengiriman subagent dan Discord">
    Saat run cron terisolasi mengorkestrasi subagent, pengiriman juga lebih memilih output turunan akhir daripada teks sementara induk yang usang. Jika turunan masih berjalan, OpenClaw menekan pembaruan induk parsial tersebut alih-alih mengumumkannya.

    Untuk target announce Discord khusus teks, OpenClaw mengirim teks assistant akhir kanonis satu kali alih-alih memutar ulang payload teks streaming/sementara sekaligus jawaban akhir. Payload media dan Discord terstruktur tetap dikirim sebagai payload terpisah agar attachment dan komponen tidak hilang.

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
  Override tingkat thinking.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Lewati injeksi file bootstrap workspace.
</ParamField>
<ParamField path="--tools" type="string">
  Batasi tools yang dapat digunakan job, misalnya `--tools exec,read`.
</ParamField>

`--model` menggunakan model yang diizinkan dan dipilih sebagai model utama job tersebut. Ini tidak sama dengan override `/model` sesi chat: rantai fallback yang dikonfigurasi tetap berlaku saat model utama job gagal. Jika model yang diminta tidak diizinkan atau tidak dapat diselesaikan, cron menggagalkan run dengan error validasi eksplisit alih-alih diam-diam fallback ke pilihan model agent/default milik job.

Job Cron juga dapat membawa `fallbacks` tingkat payload. Jika ada, daftar tersebut menggantikan rantai fallback yang dikonfigurasi untuk job. Gunakan `fallbacks: []` dalam payload/API job saat Anda menginginkan run cron ketat yang hanya mencoba model yang dipilih. Jika job memiliki `--model` tetapi tidak memiliki fallback payload maupun terkonfigurasi, OpenClaw meneruskan override fallback kosong eksplisit sehingga model utama agent tidak ditambahkan sebagai target retry ekstra tersembunyi.

Prioritas pemilihan model untuk job terisolasi adalah:

1. Override model hook Gmail (saat run berasal dari Gmail dan override tersebut diizinkan)
2. `model` payload per job
3. Override model sesi cron tersimpan yang dipilih pengguna
4. Pilihan model agent/default

Mode cepat juga mengikuti pilihan live yang terselesaikan. Jika konfigurasi model yang dipilih memiliki `params.fastMode`, cron terisolasi menggunakannya secara default. Override `fastMode` sesi tersimpan tetap menang atas konfigurasi ke arah mana pun.

Jika run terisolasi menemui handoff peralihan model live, cron mencoba ulang dengan provider/model yang dialihkan dan mempertahankan pilihan live tersebut untuk run aktif sebelum mencoba ulang. Saat peralihan juga membawa profil auth baru, cron juga mempertahankan override profil auth tersebut untuk run aktif. Retry dibatasi: setelah percobaan awal ditambah 2 retry peralihan, cron membatalkan alih-alih berulang selamanya.

Sebelum run cron terisolasi masuk ke agent runner, OpenClaw memeriksa endpoint provider lokal yang dapat dijangkau untuk provider `api: "ollama"` dan `api: "openai-completions"` terkonfigurasi yang `baseUrl`-nya adalah local loopback, jaringan privat, atau `.local`. Jika endpoint tersebut down, run dicatat sebagai `skipped` dengan error provider/model yang jelas alih-alih memulai panggilan model. Hasil endpoint di-cache selama 5 menit, sehingga banyak job jatuh tempo yang menggunakan server Ollama, vLLM, SGLang, atau LM Studio lokal yang sama dan mati berbagi satu probe kecil alih-alih membuat badai request. Run provider-preflight yang dilewati tidak menaikkan backoff error eksekusi; aktifkan `failureAlert.includeSkipped` saat Anda menginginkan notifikasi skip berulang.

## Pengiriman dan output

| Mode       | Yang terjadi                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Fallback-mengirim teks akhir ke target jika agent tidak mengirim    |
| `webhook`  | POST payload event selesai ke URL                                   |
| `none`     | Tidak ada pengiriman fallback runner                                |

Gunakan `--announce --channel telegram --to "-1001234567890"` untuk pengiriman kanal. Untuk topik forum Telegram, gunakan `-1001234567890:topic:123`; pemanggil RPC/config langsung juga dapat meneruskan `delivery.threadId` sebagai string atau angka. Target Slack/Discord/Mattermost harus menggunakan prefiks eksplisit (`channel:<id>`, `user:<id>`). ID ruang Matrix peka huruf besar-kecil; gunakan ID ruang yang tepat atau bentuk `room:!room:server` dari Matrix.

Saat pengiriman announce menggunakan `channel: "last"` atau menghilangkan `channel`, target berprefiks penyedia seperti `telegram:123` dapat memilih kanal sebelum cron beralih ke riwayat sesi atau satu kanal yang dikonfigurasi. Hanya prefiks yang diiklankan oleh plugin yang dimuat yang menjadi pemilih penyedia. Jika `delivery.channel` eksplisit, prefiks target harus menamai penyedia yang sama; misalnya, `channel: "whatsapp"` dengan `to: "telegram:123"` ditolak alih-alih membiarkan WhatsApp menafsirkan ID Telegram sebagai nomor telepon. Prefiks jenis target dan layanan seperti `channel:<id>`, `user:<id>`, `imessage:<handle>`, dan `sms:<number>` tetap menjadi sintaks target milik kanal, bukan pemilih penyedia.

Untuk tugas terisolasi, pengiriman chat dibagikan. Jika rute chat tersedia, agen dapat menggunakan alat `message` bahkan ketika tugas menggunakan `--no-deliver`. Jika agen mengirim ke target yang dikonfigurasi/saat ini, OpenClaw melewati announce fallback. Jika tidak, `announce`, `webhook`, dan `none` hanya mengontrol apa yang dilakukan runner dengan balasan final setelah giliran agen.

Saat agen membuat pengingat terisolasi dari chat aktif, OpenClaw menyimpan target pengiriman live yang dipertahankan untuk rute announce fallback. Kunci sesi internal dapat berupa huruf kecil; target pengiriman penyedia tidak direkonstruksi dari kunci tersebut saat konteks chat saat ini tersedia.

Pengiriman announce implisit menggunakan allowlist kanal yang dikonfigurasi untuk memvalidasi dan merutekan ulang target basi. Persetujuan pairing-store DM bukan penerima otomatisasi fallback; tetapkan `delivery.to` atau konfigurasikan entri kanal `allowFrom` saat tugas terjadwal harus mengirim secara proaktif ke DM.

Notifikasi kegagalan mengikuti jalur tujuan terpisah:

- `cron.failureDestination` menetapkan default global untuk notifikasi kegagalan.
- `job.delivery.failureDestination` menimpanya per tugas.
- Jika keduanya tidak ditetapkan dan tugas sudah mengirim melalui `announce`, notifikasi kegagalan sekarang fallback ke target announce utama tersebut.
- `delivery.failureDestination` hanya didukung pada tugas `sessionTarget="isolated"` kecuali mode pengiriman utama adalah `webhook`.
- `failureAlert.includeSkipped: true` memilih tugas atau kebijakan peringatan cron global ke peringatan run yang dilewati secara berulang. Run yang dilewati mempertahankan penghitung lewati berurutan terpisah, sehingga tidak memengaruhi backoff kesalahan eksekusi.

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

Gateway dapat mengekspos endpoint Webhook HTTP untuk pemicu eksternal. Aktifkan di config:

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

Token query string ditolak.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    Masukkan event sistem ke antrean untuk sesi utama:

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
    Nama hook kustom diselesaikan melalui `hooks.mappings` dalam config. Mapping dapat mengubah payload arbitrer menjadi aksi `wake` atau `agent` dengan templat atau transformasi kode.
  </Accordion>
</AccordionGroup>

<Warning>
Letakkan endpoint hook di belakang loopback, tailnet, atau reverse proxy tepercaya.

- Gunakan token hook khusus; jangan gunakan ulang token autentikasi gateway.
- Simpan `hooks.path` pada subpath khusus; `/` ditolak.
- Tetapkan `hooks.allowedAgentIds` untuk membatasi routing `agentId` eksplisit.
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

Ini menulis config `hooks.gmail`, mengaktifkan preset Gmail, dan menggunakan Tailscale Funnel untuk endpoint push.

### Mulai otomatis Gateway

Saat `hooks.enabled=true` dan `hooks.gmail.account` ditetapkan, Gateway menjalankan `gog gmail watch serve` saat boot dan memperbarui watch secara otomatis. Tetapkan `OPENCLAW_SKIP_GMAIL_WATCHER=1` untuk keluar.

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

## Mengelola tugas

```bash
# List all jobs
openclaw cron list

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

- `openclaw cron add|edit --model ...` mengubah model yang dipilih tugas.
- Jika model diizinkan, penyedia/model persis itu mencapai run agen terisolasi.
- Jika tidak diizinkan atau tidak dapat diselesaikan, cron menggagalkan run dengan kesalahan validasi eksplisit.
- Rantai fallback yang dikonfigurasi tetap berlaku karena `--model` cron adalah utama tugas, bukan override `/model` sesi.
- Payload `fallbacks` menggantikan fallback yang dikonfigurasi untuk tugas tersebut; `fallbacks: []` menonaktifkan fallback dan membuat run menjadi ketat.
- `--model` biasa tanpa daftar fallback eksplisit atau terkonfigurasi tidak jatuh ke utama agen sebagai target retry tambahan diam-diam.

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

`maxConcurrentRuns` membatasi dispatch cron terjadwal dan eksekusi giliran agen terisolasi. Giliran agen cron terisolasi menggunakan lane eksekusi khusus antrean `cron-nested` secara internal, sehingga menaikkan nilai ini memungkinkan run LLM cron independen berjalan paralel, alih-alih hanya memulai wrapper cron luarnya. Lane bersama non-cron `nested` tidak diperlebar oleh pengaturan ini.

Sidecar status runtime diturunkan dari `cron.store`: store `.json` seperti `~/clawd/cron/jobs.json` menggunakan `~/clawd/cron/jobs-state.json`, sementara jalur store tanpa sufiks `.json` menambahkan `-state.json`.

Jika Anda mengedit `jobs.json` secara manual, jangan sertakan `jobs-state.json` dalam kontrol sumber. OpenClaw menggunakan sidecar tersebut untuk slot tertunda, penanda aktif, metadata run terakhir, dan identitas jadwal yang memberi tahu penjadwal kapan tugas yang diedit secara eksternal memerlukan `nextRunAtMs` baru.

Nonaktifkan cron: `cron.enabled: false` atau `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Retry behavior">
    **Retry sekali jalan**: kesalahan sementara (batas laju, overload, jaringan, kesalahan server) di-retry hingga 3 kali dengan backoff eksponensial. Kesalahan permanen langsung menonaktifkan.

    **Retry berulang**: backoff eksponensial (30d hingga 60m) di antara retry. Backoff direset setelah run berhasil berikutnya.

  </Accordion>
  <Accordion title="Maintenance">
    `cron.sessionRetention` (default `24h`) memangkas entri sesi-run terisolasi. `cron.runLog.maxBytes` / `cron.runLog.keepLines` memangkas file log-run secara otomatis.
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
  <Accordion title="Cron not firing">
    - Periksa `cron.enabled` dan variabel env `OPENCLAW_SKIP_CRON`.
    - Pastikan Gateway berjalan terus-menerus.
    - Untuk jadwal `cron`, verifikasi zona waktu (`--tz`) vs zona waktu host.
    - `reason: not-due` dalam output run berarti run manual diperiksa dengan `openclaw cron run <jobId> --due` dan tugas belum jatuh tempo.

  </Accordion>
  <Accordion title="Cron dipicu tetapi tidak ada pengiriman">
    - Mode pengiriman `none` berarti tidak ada pengiriman cadangan oleh runner yang diharapkan. Agen tetap dapat mengirim langsung dengan alat `message` saat rute chat tersedia.
    - Target pengiriman hilang/tidak valid (`channel`/`to`) berarti pengiriman keluar dilewati.
    - Untuk Matrix, pekerjaan yang disalin atau lama dengan ID ruang `delivery.to` yang diubah menjadi huruf kecil dapat gagal karena ID ruang Matrix peka huruf besar-kecil. Edit pekerjaan ke nilai persis `!room:server` atau `room:!room:server` dari Matrix.
    - Kesalahan autentikasi saluran (`unauthorized`, `Forbidden`) berarti pengiriman diblokir oleh kredensial.
    - Jika eksekusi terisolasi hanya mengembalikan token senyap (`NO_REPLY` / `no_reply`), OpenClaw menekan pengiriman keluar langsung dan juga menekan jalur ringkasan antrean cadangan, sehingga tidak ada apa pun yang diposting kembali ke chat.
    - Jika agen harus mengirim pesan kepada pengguna sendiri, periksa apakah pekerjaan memiliki rute yang dapat digunakan (`channel: "last"` dengan chat sebelumnya, atau saluran/target eksplisit).

  </Accordion>
  <Accordion title="Cron atau Heartbeat tampaknya mencegah rollover /new-style">
    - Kesegaran reset harian dan idle tidak didasarkan pada `updatedAt`; lihat [Manajemen sesi](/id/concepts/session#session-lifecycle).
    - Pemicu bangun Cron, eksekusi Heartbeat, notifikasi exec, dan pencatatan Gateway dapat memperbarui baris sesi untuk perutean/status, tetapi tidak memperpanjang `sessionStartedAt` atau `lastInteractionAt`.
    - Untuk baris lama yang dibuat sebelum kolom tersebut ada, OpenClaw dapat memulihkan `sessionStartedAt` dari header sesi JSONL transkrip saat file masih tersedia. Baris idle lama tanpa `lastInteractionAt` menggunakan waktu mulai yang dipulihkan tersebut sebagai baseline idle-nya.

  </Accordion>
  <Accordion title="Hal yang perlu diwaspadai terkait zona waktu">
    - Cron tanpa `--tz` menggunakan zona waktu host Gateway.
    - Jadwal `at` tanpa zona waktu diperlakukan sebagai UTC.
    - `activeHours` Heartbeat menggunakan resolusi zona waktu yang dikonfigurasi.

  </Accordion>
</AccordionGroup>

## Terkait

- [Otomatisasi & Tugas](/id/automation) — semua mekanisme otomatisasi secara sekilas
- [Tugas Latar Belakang](/id/automation/tasks) — ledger tugas untuk eksekusi cron
- [Heartbeat](/id/gateway/heartbeat) — giliran sesi utama berkala
- [Zona Waktu](/id/concepts/timezone) — konfigurasi zona waktu
