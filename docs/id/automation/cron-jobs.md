---
read_when:
    - Menjadwalkan pekerjaan latar belakang atau pengaktifan
    - Menghubungkan pemicu eksternal (Webhook, Gmail) ke OpenClaw
    - Memilih antara Heartbeat dan Cron untuk tugas terjadwal
sidebarTitle: Scheduled tasks
summary: Pekerjaan terjadwal, Webhook, dan pemicu Gmail PubSub untuk penjadwal Gateway
title: Tugas terjadwal
x-i18n:
    generated_at: "2026-05-10T19:21:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: b837fc5c4cd2647bdab98b0421d2f89a528164c8eb93e7851428c73f8f59dccb
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron adalah penjadwal bawaan Gateway. Cron menyimpan job, membangunkan agen pada waktu yang tepat, dan dapat mengirimkan output kembali ke saluran chat atau endpoint Webhook.

## Mulai cepat

<Steps>
  <Step title="Add a one-shot reminder">
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
  <Step title="Check your jobs">
    ```bash
    openclaw cron list
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="See run history">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## Cara kerja cron

- Cron berjalan **di dalam proses Gateway** (bukan di dalam model).
- Definisi job disimpan secara persisten di `~/.openclaw/cron/jobs.json` sehingga jadwal tidak hilang saat restart.
- Status eksekusi runtime disimpan secara persisten di sebelahnya dalam `~/.openclaw/cron/jobs-state.json`. Jika Anda melacak definisi cron di git, lacak `jobs.json` dan gitignore `jobs-state.json`.
- Setelah pemisahan, versi OpenClaw lama dapat membaca `jobs.json` tetapi mungkin memperlakukan job sebagai baru karena field runtime sekarang berada di `jobs-state.json`.
- Ketika `jobs.json` diedit saat Gateway berjalan atau berhenti, OpenClaw membandingkan field jadwal yang berubah dengan metadata slot runtime yang tertunda dan menghapus nilai `nextRunAtMs` yang kedaluwarsa. Penulisan ulang yang hanya mengubah format atau urutan key mempertahankan slot yang tertunda.
- Semua eksekusi cron membuat catatan [tugas latar belakang](/id/automation/tasks).
- Saat Gateway dimulai, job giliran agen terisolasi yang sudah lewat jadwal dijadwalkan ulang ke luar jendela koneksi saluran alih-alih diputar ulang segera, sehingga startup Discord/Telegram dan penyiapan perintah native tetap responsif setelah restart.
- Job satu kali (`--at`) otomatis dihapus setelah berhasil secara default.
- Eksekusi cron terisolasi berupaya sebaik mungkin menutup tab/proses browser yang dilacak untuk sesi `cron:<jobId>` ketika eksekusi selesai, sehingga otomatisasi browser yang terlepas tidak meninggalkan proses yatim.
- Eksekusi cron terisolasi yang menerima grant pembersihan mandiri cron yang sempit tetap dapat membaca status penjadwal, daftar job mereka saat ini yang difilter untuk diri sendiri, dan riwayat eksekusi job tersebut, sehingga pemeriksaan status/Heartbeat dapat memeriksa jadwalnya sendiri tanpa mendapatkan akses mutasi cron yang lebih luas.
- Eksekusi cron terisolasi juga menjaga dari balasan pengakuan yang kedaluwarsa. Jika hasil pertama hanyalah pembaruan status sementara (`on it`, `pulling everything together`, dan petunjuk serupa) dan tidak ada eksekusi subagen turunan yang masih bertanggung jawab atas jawaban akhir, OpenClaw meminta ulang satu kali untuk hasil aktual sebelum pengiriman.
- Eksekusi cron terisolasi lebih memilih metadata penolakan eksekusi terstruktur dari eksekusi tertanam, lalu fallback ke marker ringkasan/output akhir yang dikenal seperti `SYSTEM_RUN_DENIED` dan `INVALID_REQUEST`, sehingga perintah yang diblokir tidak dilaporkan sebagai eksekusi hijau.
- Eksekusi cron terisolasi juga memperlakukan kegagalan agen tingkat eksekusi sebagai error job meskipun tidak ada payload balasan yang dihasilkan, sehingga kegagalan model/provider menaikkan penghitung error dan memicu notifikasi kegagalan alih-alih menandai job berhasil.
- Ketika job giliran agen terisolasi mencapai `timeoutSeconds`, cron membatalkan eksekusi agen yang mendasarinya dan memberinya jendela pembersihan singkat. Jika eksekusi tidak selesai mengalir, pembersihan milik Gateway menghapus paksa kepemilikan sesi eksekusi tersebut sebelum cron mencatat timeout, sehingga pekerjaan chat yang antre tidak tertinggal di balik sesi pemrosesan yang kedaluwarsa.
- Jika giliran agen terisolasi macet sebelum runner dimulai atau sebelum pemanggilan model pertama, cron mencatat timeout spesifik fase seperti `setup timed out before runner start` atau `stalled before first model call (last phase: context-engine)`. Watchdog ini mencakup provider tertanam dan provider berbasis CLI sebelum proses CLI eksternalnya benar-benar dimulai, dan dibatasi secara independen dari nilai `timeoutSeconds` yang panjang sehingga kegagalan cold-start/auth/context muncul cepat alih-alih menunggu seluruh anggaran job.

<a id="maintenance"></a>

<Note>
Rekonsiliasi tugas untuk cron pertama-tama dimiliki runtime, lalu didukung riwayat tahan lama: tugas cron aktif tetap live selama runtime cron masih melacak job tersebut sebagai berjalan, meskipun row sesi anak lama masih ada. Setelah runtime berhenti memiliki job dan jendela tenggang 5 menit berakhir, pemeriksaan pemeliharaan memeriksa log eksekusi persisten dan status job untuk eksekusi `cron:<jobId>:<startedAt>` yang cocok. Jika riwayat tahan lama tersebut menunjukkan hasil terminal, ledger tugas difinalisasi darinya; jika tidak, pemeliharaan milik Gateway dapat menandai tugas sebagai `lost`. Audit CLI offline dapat memulihkan dari riwayat tahan lama, tetapi tidak memperlakukan set job aktif dalam prosesnya sendiri yang kosong sebagai bukti bahwa eksekusi cron milik Gateway telah hilang.
</Note>

## Jenis jadwal

| Jenis   | Flag CLI  | Deskripsi                                               |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | Timestamp satu kali (ISO 8601 atau relatif seperti `20m`) |
| `every` | `--every` | Interval tetap                                          |
| `cron`  | `--cron`  | Ekspresi cron 5-field atau 6-field dengan `--tz` opsional |

Timestamp tanpa zona waktu diperlakukan sebagai UTC. Tambahkan `--tz America/New_York` untuk penjadwalan jam dinding lokal.

Ekspresi berulang di awal jam secara otomatis disebar hingga 5 menit untuk mengurangi lonjakan beban. Gunakan `--exact` untuk memaksa waktu presisi atau `--stagger 30s` untuk jendela eksplisit.

### Day-of-month dan day-of-week menggunakan logika OR

Ekspresi cron diurai oleh [croner](https://github.com/Hexagon/croner). Ketika field day-of-month dan day-of-week sama-sama bukan wildcard, croner cocok ketika **salah satu** field cocok — bukan keduanya. Ini adalah perilaku cron Vixie standar.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Ini berjalan sekitar 5–6 kali per bulan, bukan 0–1 kali per bulan. OpenClaw menggunakan perilaku OR default Croner di sini. Untuk mensyaratkan kedua kondisi, gunakan modifier day-of-week `+` milik Croner (`0 9 15 * +1`) atau jadwalkan pada satu field dan jaga field lainnya dalam prompt atau perintah job Anda.

## Gaya eksekusi

| Gaya            | Nilai `--session`  | Berjalan di              | Paling cocok untuk             |
| --------------- | ------------------- | ------------------------ | ------------------------------ |
| Sesi utama      | `main`              | Giliran Heartbeat berikutnya | Pengingat, event sistem      |
| Terisolasi      | `isolated`          | `cron:<jobId>` khusus    | Laporan, pekerjaan latar belakang |
| Sesi saat ini   | `current`           | Diikat saat pembuatan    | Pekerjaan berulang sadar konteks |
| Sesi kustom     | `session:custom-id` | Sesi bernama persisten   | Workflow yang dibangun di atas riwayat |

<AccordionGroup>
  <Accordion title="Main session vs isolated vs custom">
    Job **sesi utama** mengantrekan event sistem dan secara opsional membangunkan Heartbeat (`--wake now` atau `--wake next-heartbeat`). Event sistem tersebut tidak memperpanjang kesegaran reset harian/idle untuk sesi target. Job **terisolasi** menjalankan giliran agen khusus dengan sesi baru. **Sesi kustom** (`session:xxx`) mempertahankan konteks lintas eksekusi, memungkinkan workflow seperti standup harian yang dibangun di atas ringkasan sebelumnya.
  </Accordion>
  <Accordion title="What 'fresh session' means for isolated jobs">
    Untuk job terisolasi, "fresh session" berarti transcript/session id baru untuk setiap eksekusi. OpenClaw dapat membawa preferensi aman seperti pengaturan thinking/fast/verbose, label, dan override model/auth yang dipilih pengguna secara eksplisit, tetapi tidak mewarisi konteks percakapan ambien dari row cron yang lebih lama: routing saluran/grup, kebijakan kirim atau antre, elevasi, origin, atau binding runtime ACP. Gunakan `current` atau `session:<id>` ketika job berulang harus sengaja dibangun di atas konteks percakapan yang sama.
  </Accordion>
  <Accordion title="Runtime cleanup">
    Untuk job terisolasi, teardown runtime sekarang mencakup pembersihan browser sebaik mungkin untuk sesi cron tersebut. Kegagalan pembersihan diabaikan sehingga hasil cron aktual tetap menang.

    Eksekusi cron terisolasi juga membuang instance runtime MCP bundled apa pun yang dibuat untuk job melalui jalur pembersihan runtime bersama. Ini cocok dengan cara klien MCP sesi utama dan sesi kustom dibongkar, sehingga job cron terisolasi tidak membocorkan proses anak stdio atau koneksi MCP berumur panjang lintas eksekusi.

  </Accordion>
  <Accordion title="Subagent and Discord delivery">
    Ketika eksekusi cron terisolasi mengorkestrasi subagen, pengiriman juga lebih memilih output turunan final daripada teks sementara parent yang kedaluwarsa. Jika turunan masih berjalan, OpenClaw menekan pembaruan parent parsial tersebut alih-alih mengumumkannya.

    Untuk target pengumuman Discord hanya teks, OpenClaw mengirim teks asisten final kanonis satu kali alih-alih memutar ulang payload teks streamed/intermediate dan jawaban akhir sekaligus. Payload media dan Discord terstruktur tetap dikirim sebagai payload terpisah sehingga lampiran dan komponen tidak terhapus.

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
  Batasi tools yang dapat digunakan job, misalnya `--tools exec,read`.
</ParamField>

`--model` menggunakan model yang diizinkan dan dipilih sebagai model utama job tersebut. Ini tidak sama dengan override `/model` sesi chat: rantai fallback yang dikonfigurasi tetap berlaku ketika primary job gagal. Jika model yang diminta tidak diizinkan atau tidak dapat di-resolve, cron menggagalkan eksekusi dengan error validasi eksplisit alih-alih diam-diam fallback ke pemilihan model agen/default job.

Job cron juga dapat membawa `fallbacks` tingkat payload. Jika ada, daftar tersebut menggantikan rantai fallback yang dikonfigurasi untuk job. Gunakan `fallbacks: []` dalam payload/API job ketika Anda menginginkan eksekusi cron ketat yang hanya mencoba model yang dipilih. Jika job memiliki `--model` tetapi tidak ada fallback payload maupun yang dikonfigurasi, OpenClaw meneruskan override fallback kosong eksplisit sehingga primary agen tidak ditambahkan sebagai target retry ekstra tersembunyi.

Prioritas pemilihan model untuk job terisolasi adalah:

1. Override model hook Gmail (ketika eksekusi berasal dari Gmail dan override tersebut diizinkan)
2. `model` payload per job
3. Override model sesi cron tersimpan yang dipilih pengguna
4. Pemilihan model agen/default

Mode fast juga mengikuti pilihan live yang di-resolve. Jika config model yang dipilih memiliki `params.fastMode`, cron terisolasi menggunakannya secara default. Override `fastMode` sesi tersimpan tetap menang atas config di kedua arah.

Jika eksekusi terisolasi mengalami handoff pengalihan model live, cron mencoba ulang dengan provider/model yang dialihkan dan menyimpan pilihan live tersebut untuk eksekusi aktif sebelum mencoba ulang. Ketika pengalihan juga membawa profil auth baru, cron juga menyimpan override profil auth tersebut untuk eksekusi aktif. Retry dibatasi: setelah upaya awal plus 2 retry pengalihan, cron membatalkan alih-alih berulang selamanya.

Sebelum cron terisolasi masuk ke runner agen, OpenClaw memeriksa endpoint penyedia lokal yang dapat dijangkau untuk penyedia `api: "ollama"` dan `api: "openai-completions"` yang dikonfigurasi dengan `baseUrl` berupa loopback, jaringan privat, atau `.local`. Jika endpoint tersebut tidak aktif, run dicatat sebagai `skipped` dengan galat penyedia/model yang jelas alih-alih memulai panggilan model. Hasil endpoint di-cache selama 5 menit, sehingga banyak pekerjaan jatuh tempo yang menggunakan server Ollama, vLLM, SGLang, atau LM Studio lokal yang sama-sama mati berbagi satu probe kecil alih-alih membuat badai permintaan. Run preflight penyedia yang dilewati tidak menambah backoff galat eksekusi; aktifkan `failureAlert.includeSkipped` saat Anda menginginkan notifikasi lewati yang berulang.

## Pengiriman dan keluaran

| Mode       | Yang terjadi                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Kirim fallback teks akhir ke target jika agen tidak mengirim        |
| `webhook`  | POST payload peristiwa selesai ke URL                               |
| `none`     | Tidak ada pengiriman fallback runner                                |

Gunakan `--announce --channel telegram --to "-1001234567890"` untuk pengiriman kanal. Untuk topik forum Telegram, gunakan `-1001234567890:topic:123`; pemanggil RPC/konfigurasi langsung juga dapat meneruskan `delivery.threadId` sebagai string atau angka. Target Slack/Discord/Mattermost sebaiknya menggunakan prefiks eksplisit (`channel:<id>`, `user:<id>`). ID ruang Matrix peka huruf besar-kecil; gunakan ID ruang yang tepat atau bentuk `room:!room:server` dari Matrix.

Saat pengiriman announce menggunakan `channel: "last"` atau menghilangkan `channel`, target berprefiks penyedia seperti `telegram:123` dapat memilih kanal sebelum cron beralih fallback ke riwayat sesi atau satu kanal yang dikonfigurasi. Hanya prefiks yang diiklankan oleh plugin yang dimuat yang menjadi pemilih penyedia. Jika `delivery.channel` eksplisit, prefiks target harus menamai penyedia yang sama; misalnya, `channel: "whatsapp"` dengan `to: "telegram:123"` ditolak alih-alih membiarkan WhatsApp menafsirkan ID Telegram sebagai nomor telepon. Prefiks jenis target dan layanan seperti `channel:<id>`, `user:<id>`, `imessage:<handle>`, dan `sms:<number>` tetap menjadi sintaks target milik kanal, bukan pemilih penyedia.

Untuk pekerjaan terisolasi, pengiriman chat dibagikan. Jika rute chat tersedia, agen dapat menggunakan tool `message` bahkan ketika pekerjaan menggunakan `--no-deliver`. Jika agen mengirim ke target yang dikonfigurasi/saat ini, OpenClaw melewati announce fallback. Jika tidak, `announce`, `webhook`, dan `none` hanya mengontrol apa yang dilakukan runner terhadap balasan akhir setelah giliran agen.

Saat agen membuat pengingat terisolasi dari chat aktif, OpenClaw menyimpan target pengiriman live yang dipertahankan untuk rute announce fallback. Kunci sesi internal dapat berupa huruf kecil; target pengiriman penyedia tidak direkonstruksi dari kunci tersebut saat konteks chat saat ini tersedia.

Pengiriman announce implisit menggunakan allowlist kanal yang dikonfigurasi untuk memvalidasi dan merutekan ulang target usang. Persetujuan pairing-store DM bukan penerima otomasi fallback; tetapkan `delivery.to` atau konfigurasikan entri `allowFrom` kanal saat pekerjaan terjadwal harus mengirim secara proaktif ke DM.

Notifikasi kegagalan mengikuti jalur tujuan terpisah:

- `cron.failureDestination` menetapkan default global untuk notifikasi kegagalan.
- `job.delivery.failureDestination` menimpanya per pekerjaan.
- Jika keduanya tidak ditetapkan dan pekerjaan sudah mengirim melalui `announce`, notifikasi kegagalan kini fallback ke target announce utama tersebut.
- `delivery.failureDestination` hanya didukung pada pekerjaan `sessionTarget="isolated"` kecuali mode pengiriman utama adalah `webhook`.
- `failureAlert.includeSkipped: true` membuat pekerjaan atau kebijakan peringatan cron global menerima peringatan run yang dilewati secara berulang. Run yang dilewati menyimpan penghitung lewati berurutan yang terpisah, sehingga tidak memengaruhi backoff galat eksekusi.

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
  <Tab title="Override model dan thinking">
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
  <Accordion title="Hook yang dipetakan (POST /hooks/<name>)">
    Nama hook kustom diselesaikan melalui `hooks.mappings` dalam konfigurasi. Pemetaan dapat mengubah payload arbitrer menjadi tindakan `wake` atau `agent` dengan templat atau transformasi kode.
  </Accordion>
</AccordionGroup>

<Warning>
Jaga endpoint hook tetap berada di balik loopback, tailnet, atau reverse proxy tepercaya.

- Gunakan token hook khusus; jangan gunakan ulang token auth Gateway.
- Pertahankan `hooks.path` pada subpath khusus; `/` ditolak.
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

Ini menulis konfigurasi `hooks.gmail`, mengaktifkan preset Gmail, dan menggunakan Tailscale Funnel untuk endpoint push.

### Mulai otomatis Gateway

Saat `hooks.enabled=true` dan `hooks.gmail.account` ditetapkan, Gateway memulai `gog gmail watch serve` saat boot dan memperpanjang watch secara otomatis. Tetapkan `OPENCLAW_SKIP_GMAIL_WATCHER=1` untuk opt out.

### Penyiapan satu kali manual

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

## Mengelola pekerjaan

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

- `openclaw cron add|edit --model ...` mengubah model yang dipilih pekerjaan.
- Jika model diizinkan, penyedia/model persis tersebut mencapai run agen terisolasi.
- Jika tidak diizinkan atau tidak dapat diselesaikan, cron menggagalkan run dengan galat validasi eksplisit.
- Rantai fallback yang dikonfigurasi tetap berlaku karena `--model` cron adalah model utama pekerjaan, bukan override `/model` sesi.
- Payload `fallbacks` menggantikan fallback yang dikonfigurasi untuk pekerjaan tersebut; `fallbacks: []` menonaktifkan fallback dan membuat run menjadi ketat.
- `--model` polos tanpa daftar fallback eksplisit atau terkonfigurasi tidak berlanjut ke model utama agen sebagai target coba ulang ekstra yang senyap.

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

`maxConcurrentRuns` membatasi dispatch cron terjadwal sekaligus eksekusi giliran agen terisolasi. Giliran agen cron terisolasi menggunakan lane eksekusi khusus antrean `cron-nested` secara internal, sehingga menaikkan nilai ini memungkinkan run LLM cron independen berjalan paralel alih-alih hanya memulai wrapper cron luarnya. Lane `nested` non-cron bersama tidak diperlebar oleh pengaturan ini.

Sidecar status runtime diturunkan dari `cron.store`: store `.json` seperti `~/clawd/cron/jobs.json` menggunakan `~/clawd/cron/jobs-state.json`, sementara path store tanpa sufiks `.json` menambahkan `-state.json`.

Jika Anda mengedit `jobs.json` secara manual, jangan masukkan `jobs-state.json` ke source control. OpenClaw menggunakan sidecar tersebut untuk slot tertunda, penanda aktif, metadata run terakhir, dan identitas jadwal yang memberi tahu scheduler kapan pekerjaan yang diedit secara eksternal memerlukan `nextRunAtMs` baru.

Nonaktifkan cron: `cron.enabled: false` atau `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Perilaku coba ulang">
    **Coba ulang sekali jalan**: galat sementara (batas laju, overload, jaringan, galat server) dicoba ulang hingga 3 kali dengan backoff eksponensial. Galat permanen langsung menonaktifkan.

    **Coba ulang berulang**: backoff eksponensial (30 dtk hingga 60 mnt) antar coba ulang. Backoff direset setelah run sukses berikutnya.

  </Accordion>
  <Accordion title="Pemeliharaan">
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
  <Accordion title="Cron tidak berjalan">
    - Periksa `cron.enabled` dan variabel env `OPENCLAW_SKIP_CRON`.
    - Pastikan Gateway berjalan terus-menerus.
    - Untuk jadwal `cron`, verifikasi zona waktu (`--tz`) dibandingkan zona waktu host.
    - `reason: not-due` dalam output run berarti run manual diperiksa dengan `openclaw cron run <jobId> --due` dan job belum jatuh tempo.

  </Accordion>
  <Accordion title="Cron berjalan tetapi tidak ada pengiriman">
    - Mode pengiriman `none` berarti tidak ada pengiriman fallback runner yang diharapkan. Agen tetap dapat mengirim langsung dengan tool `message` saat rute chat tersedia.
    - Target pengiriman hilang/tidak valid (`channel`/`to`) berarti outbound dilewati.
    - Untuk Matrix, job yang disalin atau legacy dengan ID ruang `delivery.to` yang diubah menjadi huruf kecil dapat gagal karena ID ruang Matrix peka huruf besar-kecil. Edit job ke nilai `!room:server` atau `room:!room:server` yang persis dari Matrix.
    - Kesalahan auth channel (`unauthorized`, `Forbidden`) berarti pengiriman diblokir oleh kredensial.
    - Jika run terisolasi hanya mengembalikan token senyap (`NO_REPLY` / `no_reply`), OpenClaw menekan pengiriman outbound langsung dan juga menekan jalur ringkasan antrean fallback, sehingga tidak ada yang diposting kembali ke chat.
    - Jika agen seharusnya mengirim pesan kepada pengguna sendiri, periksa bahwa job memiliki rute yang dapat digunakan (`channel: "last"` dengan chat sebelumnya, atau channel/target eksplisit).

  </Accordion>
  <Accordion title="Cron atau Heartbeat tampak mencegah rollover /new-style">
    - Kesegaran reset harian dan idle tidak didasarkan pada `updatedAt`; lihat [Manajemen sesi](/id/concepts/session#session-lifecycle).
    - Wakeup Cron, run Heartbeat, notifikasi exec, dan pembukuan gateway dapat memperbarui baris sesi untuk routing/status, tetapi tidak memperpanjang `sessionStartedAt` atau `lastInteractionAt`.
    - Untuk baris legacy yang dibuat sebelum field tersebut ada, OpenClaw dapat memulihkan `sessionStartedAt` dari header sesi JSONL transkrip saat file masih tersedia. Baris idle legacy tanpa `lastInteractionAt` menggunakan waktu mulai yang dipulihkan itu sebagai baseline idle.

  </Accordion>
  <Accordion title="Hal yang perlu diperhatikan tentang zona waktu">
    - Cron tanpa `--tz` menggunakan zona waktu host gateway.
    - Jadwal `at` tanpa zona waktu diperlakukan sebagai UTC.
    - `activeHours` Heartbeat menggunakan resolusi zona waktu yang dikonfigurasi.

  </Accordion>
</AccordionGroup>

## Terkait

- [Otomasi & Tugas](/id/automation) — semua mekanisme otomasi secara sekilas
- [Tugas Latar Belakang](/id/automation/tasks) — ledger tugas untuk eksekusi cron
- [Heartbeat](/id/gateway/heartbeat) — giliran sesi utama berkala
- [Zona waktu](/id/concepts/timezone) — konfigurasi zona waktu
