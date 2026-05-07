---
read_when:
    - Menjadwalkan pekerjaan latar belakang atau pemicu bangun
    - Menghubungkan pemicu eksternal (Webhook, Gmail) ke OpenClaw
    - Memutuskan antara Heartbeat dan Cron untuk tugas terjadwal
sidebarTitle: Scheduled tasks
summary: Pekerjaan terjadwal, Webhook, dan pemicu Gmail PubSub untuk penjadwal Gateway
title: Tugas terjadwal
x-i18n:
    generated_at: "2026-05-07T01:50:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4771847517f526ec537a940773c70141e056bdc5a7b735099f40c6ea10e18162
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron adalah penjadwal bawaan Gateway. Cron mempertahankan job, membangunkan agen pada waktu yang tepat, dan dapat mengirimkan output kembali ke kanal chat atau endpoint Webhook.

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
- Status eksekusi runtime dipertahankan di sebelahnya dalam `~/.openclaw/cron/jobs-state.json`. Jika Anda melacak definisi cron di git, lacak `jobs.json` dan masukkan `jobs-state.json` ke gitignore.
- Setelah pemisahan, versi OpenClaw yang lebih lama dapat membaca `jobs.json` tetapi mungkin memperlakukan job sebagai baru karena kolom runtime kini berada di `jobs-state.json`.
- Saat `jobs.json` diedit ketika Gateway berjalan atau berhenti, OpenClaw membandingkan kolom jadwal yang berubah dengan metadata slot runtime yang tertunda dan menghapus nilai `nextRunAtMs` yang kedaluwarsa. Penulisan ulang yang hanya mengubah format atau urutan kunci mempertahankan slot tertunda.
- Semua eksekusi cron membuat catatan [tugas latar belakang](/id/automation/tasks).
- Saat Gateway dimulai, job giliran agen terisolasi yang sudah lewat jadwal dijadwalkan ulang keluar dari jendela koneksi kanal alih-alih diputar ulang segera, sehingga startup Discord/Telegram dan penyiapan perintah native tetap responsif setelah restart.
- Job sekali jalan (`--at`) otomatis dihapus setelah berhasil secara default.
- Run cron terisolasi secara best-effort menutup tab/proses browser yang dilacak untuk sesi `cron:<jobId>` miliknya saat run selesai, sehingga otomasi browser yang terlepas tidak meninggalkan proses yatim.
- Run cron terisolasi yang menerima grant pembersihan mandiri cron yang sempit tetap dapat membaca status penjadwal dan daftar job saat ini yang difilter untuk dirinya sendiri, sehingga pemeriksaan status/Heartbeat dapat memeriksa jadwalnya sendiri tanpa memperoleh akses mutasi cron yang lebih luas.
- Run cron terisolasi juga melindungi dari balasan pengakuan yang kedaluwarsa. Jika hasil pertama hanya pembaruan status sementara (`on it`, `pulling everything together`, dan petunjuk serupa) dan tidak ada run subagen turunan yang masih bertanggung jawab atas jawaban akhir, OpenClaw meminta ulang sekali untuk hasil sebenarnya sebelum pengiriman.
- Run cron terisolasi lebih memilih metadata penolakan eksekusi terstruktur dari run tertanam, lalu fallback ke penanda ringkasan/output akhir yang dikenal seperti `SYSTEM_RUN_DENIED` dan `INVALID_REQUEST`, sehingga perintah yang diblokir tidak dilaporkan sebagai run hijau.
- Run cron terisolasi juga memperlakukan kegagalan agen tingkat run sebagai error job meskipun tidak ada payload balasan yang dihasilkan, sehingga kegagalan model/provider menambah penghitung error dan memicu notifikasi kegagalan alih-alih menghapus job sebagai berhasil.
- Saat job giliran agen terisolasi mencapai `timeoutSeconds`, cron membatalkan run agen yang mendasarinya dan memberinya jendela pembersihan singkat. Jika run tidak selesai dikosongkan, pembersihan milik Gateway menghapus paksa kepemilikan sesi run tersebut sebelum cron mencatat timeout, sehingga pekerjaan chat yang diantrekan tidak tertinggal di belakang sesi pemrosesan yang kedaluwarsa.

<a id="maintenance"></a>

<Note>
Rekonsiliasi tugas untuk cron pertama-tama dimiliki runtime, lalu didukung riwayat tahan lama: tugas cron aktif tetap live selama runtime cron masih melacak job tersebut sebagai berjalan, meskipun baris sesi anak lama masih ada. Setelah runtime berhenti memiliki job dan jendela toleransi 5 menit berakhir, pemeliharaan memeriksa log run yang dipertahankan dan status job untuk run `cron:<jobId>:<startedAt>` yang cocok. Jika riwayat tahan lama tersebut menunjukkan hasil terminal, ledger tugas diselesaikan darinya; jika tidak, pemeliharaan milik Gateway dapat menandai tugas sebagai `lost`. Audit CLI offline dapat memulihkan dari riwayat tahan lama, tetapi audit itu tidak memperlakukan set job aktif dalam prosesnya sendiri yang kosong sebagai bukti bahwa run cron milik Gateway telah hilang.
</Note>

## Jenis jadwal

| Jenis   | Flag CLI  | Deskripsi                                               |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | Timestamp sekali jalan (ISO 8601 atau relatif seperti `20m`) |
| `every` | `--every` | Interval tetap                                          |
| `cron`  | `--cron`  | Ekspresi cron 5 kolom atau 6 kolom dengan `--tz` opsional |

Timestamp tanpa zona waktu diperlakukan sebagai UTC. Tambahkan `--tz America/New_York` untuk penjadwalan waktu dinding lokal.

Ekspresi berulang tepat di awal jam otomatis disebar hingga 5 menit untuk mengurangi lonjakan beban. Gunakan `--exact` untuk memaksa waktu presisi atau `--stagger 30s` untuk jendela eksplisit.

### Hari-dalam-bulan dan hari-dalam-minggu menggunakan logika OR

Ekspresi cron diurai oleh [croner](https://github.com/Hexagon/croner). Saat kolom hari-dalam-bulan dan hari-dalam-minggu sama-sama bukan wildcard, croner cocok ketika **salah satu** kolom cocok — bukan keduanya. Ini adalah perilaku cron Vixie standar.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Ini berjalan sekitar 5–6 kali per bulan, bukan 0–1 kali per bulan. OpenClaw menggunakan perilaku OR default Croner di sini. Untuk mewajibkan kedua kondisi, gunakan modifier hari-dalam-minggu `+` milik Croner (`0 9 15 * +1`) atau jadwalkan pada satu kolom dan lindungi kolom lainnya dalam prompt atau perintah job Anda.

## Gaya eksekusi

| Gaya           | Nilai `--session`   | Berjalan di              | Paling cocok untuk             |
| -------------- | ------------------- | ------------------------ | ------------------------------ |
| Sesi utama     | `main`              | Giliran Heartbeat berikutnya | Pengingat, peristiwa sistem    |
| Terisolasi     | `isolated`          | `cron:<jobId>` khusus    | Laporan, pekerjaan latar belakang |
| Sesi saat ini  | `current`           | Diikat saat pembuatan    | Pekerjaan berulang yang sadar konteks |
| Sesi kustom    | `session:custom-id` | Sesi bernama persisten   | Workflow yang membangun berdasarkan riwayat |

<AccordionGroup>
  <Accordion title="Sesi utama vs terisolasi vs kustom">
    Job **sesi utama** mengantrekan peristiwa sistem dan secara opsional membangunkan Heartbeat (`--wake now` atau `--wake next-heartbeat`). Peristiwa sistem tersebut tidak memperpanjang freshness reset harian/idle untuk sesi target. Job **terisolasi** menjalankan giliran agen khusus dengan sesi baru. **Sesi kustom** (`session:xxx`) mempertahankan konteks lintas run, memungkinkan workflow seperti standup harian yang membangun berdasarkan ringkasan sebelumnya.
  </Accordion>
  <Accordion title="Apa arti 'sesi baru' untuk job terisolasi">
    Untuk job terisolasi, "sesi baru" berarti id transcript/sesi baru untuk setiap run. OpenClaw dapat membawa preferensi aman seperti pengaturan thinking/fast/verbose, label, dan override model/auth yang dipilih pengguna secara eksplisit, tetapi tidak mewarisi konteks percakapan sekitar dari baris cron yang lebih lama: routing kanal/grup, kebijakan kirim atau antre, elevation, asal, atau binding runtime ACP. Gunakan `current` atau `session:<id>` saat job berulang harus sengaja membangun berdasarkan konteks percakapan yang sama.
  </Accordion>
  <Accordion title="Pembersihan runtime">
    Untuk job terisolasi, teardown runtime kini mencakup pembersihan browser best-effort untuk sesi cron tersebut. Kegagalan pembersihan diabaikan sehingga hasil cron sebenarnya tetap menang.

    Run cron terisolasi juga membuang setiap instance runtime MCP bundled yang dibuat untuk job melalui jalur pembersihan runtime bersama. Ini sesuai dengan cara klien MCP sesi utama dan sesi kustom di-teardown, sehingga job cron terisolasi tidak membocorkan proses anak stdio atau koneksi MCP berumur panjang lintas run.

  </Accordion>
  <Accordion title="Pengiriman subagen dan Discord">
    Saat run cron terisolasi mengorkestrasi subagen, pengiriman juga lebih memilih output turunan akhir daripada teks sementara induk yang kedaluwarsa. Jika turunan masih berjalan, OpenClaw menekan pembaruan induk parsial tersebut alih-alih mengumumkannya.

    Untuk target pengumuman Discord teks saja, OpenClaw mengirim teks asisten akhir kanonis sekali alih-alih memutar ulang payload teks streaming/perantara dan jawaban akhir sekaligus. Payload media dan Discord terstruktur tetap dikirim sebagai payload terpisah sehingga lampiran dan komponen tidak dibuang.

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
  Batasi tool yang dapat digunakan job, misalnya `--tools exec,read`.
</ParamField>

`--model` menggunakan model yang diizinkan dan dipilih sebagai model utama job tersebut. Ini tidak sama dengan override `/model` sesi chat: rantai fallback terkonfigurasi tetap berlaku saat model utama job gagal. Jika model yang diminta tidak diizinkan atau tidak dapat di-resolve, cron menggagalkan run dengan error validasi eksplisit alih-alih diam-diam fallback ke pemilihan model agen/default job.

Jika entri `jobs.json` lama atau yang diedit manual menyimpan `payload.model` sebagai `"default"`, `"null"`, string kosong, atau JSON `null`, jalankan `openclaw doctor --fix`. Doctor menghapus sentinel override tersimpan yang tidak valid tersebut; runtime tidak mendukungnya sebagai alias fallback. Hilangkan kolom model untuk menggunakan pemilihan model agen/default normal.

Job cron juga dapat membawa `fallbacks` tingkat payload. Jika ada, daftar tersebut menggantikan rantai fallback terkonfigurasi untuk job. Gunakan `fallbacks: []` dalam payload/API job saat Anda menginginkan run cron ketat yang hanya mencoba model yang dipilih. Jika job memiliki `--model` tetapi tidak memiliki fallback payload maupun terkonfigurasi, OpenClaw meneruskan override fallback kosong eksplisit sehingga model utama agen tidak ditambahkan sebagai target percobaan ulang ekstra yang tersembunyi.

Prioritas pemilihan model untuk job terisolasi adalah:

1. Override model hook Gmail (saat run berasal dari Gmail dan override tersebut diizinkan)
2. `model` payload per job
3. Override model sesi cron tersimpan yang dipilih pengguna
4. Pemilihan model agen/default

Mode cepat juga mengikuti pilihan live yang di-resolve. Jika konfigurasi model yang dipilih memiliki `params.fastMode`, cron terisolasi menggunakannya secara default. Override `fastMode` sesi tersimpan tetap menang atas konfigurasi di kedua arah.

Jika run terisolasi mengalami handoff pergantian model live, cron mencoba ulang dengan provider/model yang diganti dan mempertahankan pilihan live tersebut untuk run aktif sebelum mencoba ulang. Saat pergantian juga membawa profil auth baru, cron juga mempertahankan override profil auth tersebut untuk run aktif. Percobaan ulang dibatasi: setelah upaya awal ditambah 2 percobaan ulang pergantian, cron membatalkan alih-alih berulang selamanya.

Sebelum run cron terisolasi masuk ke runner agen, OpenClaw memeriksa endpoint provider lokal yang dapat dijangkau untuk provider `api: "ollama"` dan `api: "openai-completions"` terkonfigurasi yang `baseUrl`-nya adalah loopback, jaringan privat, atau `.local`. Jika endpoint tersebut down, run dicatat sebagai `skipped` dengan error provider/model yang jelas alih-alih memulai panggilan model. Hasil endpoint di-cache selama 5 menit, sehingga banyak job jatuh tempo yang menggunakan server Ollama, vLLM, SGLang, atau LM Studio lokal mati yang sama berbagi satu probe kecil alih-alih membuat badai permintaan. Run provider-preflight yang dilewati tidak menambah backoff error eksekusi; aktifkan `failureAlert.includeSkipped` saat Anda menginginkan notifikasi skip berulang.

## Pengiriman dan output

| Mode       | Yang terjadi                                                       |
| ---------- | ------------------------------------------------------------------ |
| `announce` | Mengirim teks akhir cadangan ke target jika agen tidak mengirim    |
| `webhook`  | POST payload peristiwa selesai ke sebuah URL                       |
| `none`     | Tidak ada pengiriman cadangan oleh penjalan                        |

Gunakan `--announce --channel telegram --to "-1001234567890"` untuk pengiriman kanal. Untuk topik forum Telegram, gunakan `-1001234567890:topic:123`; pemanggil RPC/konfigurasi langsung juga dapat meneruskan `delivery.threadId` sebagai string atau angka. Target Slack/Discord/Mattermost harus menggunakan prefiks eksplisit (`channel:<id>`, `user:<id>`). ID ruang Matrix peka huruf besar-kecil; gunakan ID ruang persisnya atau bentuk `room:!room:server` dari Matrix.

Ketika pengiriman announce menggunakan `channel: "last"` atau menghilangkan `channel`, target berprefiks penyedia seperti `telegram:123` dapat memilih kanal sebelum cron kembali ke riwayat sesi atau satu kanal yang dikonfigurasi. Hanya prefiks yang diiklankan oleh Plugin yang dimuat yang menjadi pemilih penyedia. Jika `delivery.channel` eksplisit, prefiks target harus menamai penyedia yang sama; misalnya, `channel: "whatsapp"` dengan `to: "telegram:123"` ditolak alih-alih membiarkan WhatsApp menafsirkan ID Telegram sebagai nomor telepon. Prefiks jenis target dan layanan seperti `channel:<id>`, `user:<id>`, `imessage:<handle>`, dan `sms:<number>` tetap merupakan sintaks target milik kanal, bukan pemilih penyedia.

Untuk pekerjaan terisolasi, pengiriman chat dibagikan. Jika rute chat tersedia, agen dapat menggunakan alat `message` bahkan ketika pekerjaan menggunakan `--no-deliver`. Jika agen mengirim ke target yang dikonfigurasi/saat ini, OpenClaw melewati announce cadangan. Jika tidak, `announce`, `webhook`, dan `none` hanya mengontrol apa yang dilakukan penjalan dengan balasan akhir setelah giliran agen.

Ketika agen membuat pengingat terisolasi dari chat aktif, OpenClaw menyimpan target pengiriman live yang dipertahankan untuk rute announce cadangan. Kunci sesi internal mungkin huruf kecil; target pengiriman penyedia tidak direkonstruksi dari kunci tersebut ketika konteks chat saat ini tersedia.

Pengiriman announce implisit menggunakan allowlist kanal yang dikonfigurasi untuk memvalidasi dan merutekan ulang target usang. Persetujuan toko pemasangan DM bukan penerima otomasi cadangan; atur `delivery.to` atau konfigurasikan entri `allowFrom` kanal ketika pekerjaan terjadwal harus secara proaktif mengirim ke DM.

Notifikasi kegagalan mengikuti jalur tujuan terpisah:

- `cron.failureDestination` menetapkan default global untuk notifikasi kegagalan.
- `job.delivery.failureDestination` menimpanya per pekerjaan.
- Jika keduanya tidak ditetapkan dan pekerjaan sudah mengirim melalui `announce`, notifikasi kegagalan kini kembali ke target announce utama tersebut.
- `delivery.failureDestination` hanya didukung pada pekerjaan `sessionTarget="isolated"` kecuali mode pengiriman utama adalah `webhook`.
- `failureAlert.includeSkipped: true` mengikutsertakan pekerjaan atau kebijakan peringatan cron global ke peringatan eksekusi yang dilewati secara berulang. Eksekusi yang dilewati mempertahankan penghitung lewati beruntun yang terpisah, sehingga tidak memengaruhi backoff kesalahan eksekusi.

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

    Bidang: `message` (wajib), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Hook yang dipetakan (POST /hooks/<name>)">
    Nama hook kustom diselesaikan melalui `hooks.mappings` dalam konfigurasi. Pemetaan dapat mengubah payload apa pun menjadi tindakan `wake` atau `agent` dengan templat atau transformasi kode.
  </Accordion>
</AccordionGroup>

<Warning>
Jaga endpoint hook tetap berada di balik loopback, tailnet, atau proxy balik tepercaya.

- Gunakan token hook khusus; jangan gunakan ulang token autentikasi Gateway.
- Pertahankan `hooks.path` pada subpath khusus; `/` ditolak.
- Atur `hooks.allowedAgentIds` untuk membatasi perutean `agentId` eksplisit.
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

Ketika `hooks.enabled=true` dan `hooks.gmail.account` ditetapkan, Gateway memulai `gog gmail watch serve` saat boot dan memperpanjang watch secara otomatis. Atur `OPENCLAW_SKIP_GMAIL_WATCHER=1` untuk keluar.

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
- Jika model diizinkan, penyedia/model persis tersebut mencapai eksekusi agen terisolasi.
- Jika tidak diizinkan atau tidak dapat diselesaikan, cron menggagalkan eksekusi dengan kesalahan validasi eksplisit.
- Rantai fallback yang dikonfigurasi tetap berlaku karena `--model` cron adalah primer pekerjaan, bukan override `/model` sesi.
- Payload `fallbacks` mengganti fallback yang dikonfigurasi untuk pekerjaan tersebut; `fallbacks: []` menonaktifkan fallback dan membuat eksekusi ketat.
- `--model` biasa tanpa daftar fallback eksplisit atau yang dikonfigurasi tidak jatuh ke primer agen sebagai target percobaan ulang tambahan diam-diam.

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

`maxConcurrentRuns` membatasi pengiriman cron terjadwal sekaligus eksekusi giliran agen terisolasi. Giliran agen cron terisolasi menggunakan jalur eksekusi khusus `cron-nested` milik antrean secara internal, sehingga menaikkan nilai ini memungkinkan eksekusi LLM cron independen berjalan secara paralel alih-alih hanya memulai pembungkus cron luarnya. Jalur bersama non-cron `nested` tidak diperluas oleh pengaturan ini.

Sidecar status runtime diturunkan dari `cron.store`: store `.json` seperti `~/clawd/cron/jobs.json` menggunakan `~/clawd/cron/jobs-state.json`, sedangkan path store tanpa sufiks `.json` menambahkan `-state.json`.

Jika Anda mengedit `jobs.json` secara manual, jangan masukkan `jobs-state.json` ke kontrol sumber. OpenClaw menggunakan sidecar tersebut untuk slot tertunda, penanda aktif, metadata eksekusi terakhir, dan identitas jadwal yang memberi tahu scheduler kapan pekerjaan yang diedit secara eksternal memerlukan `nextRunAtMs` baru.

Nonaktifkan cron: `cron.enabled: false` atau `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Perilaku percobaan ulang">
    **Percobaan ulang sekali jalan**: kesalahan sementara (batas laju, overload, jaringan, kesalahan server) dicoba ulang hingga 3 kali dengan backoff eksponensial. Kesalahan permanen langsung menonaktifkan.

    **Percobaan ulang berulang**: backoff eksponensial (30 dtk hingga 60 mnt) antar percobaan ulang. Backoff direset setelah eksekusi berhasil berikutnya.

  </Accordion>
  <Accordion title="Pemeliharaan">
    `cron.sessionRetention` (default `24h`) memangkas entri sesi eksekusi terisolasi. `cron.runLog.maxBytes` / `cron.runLog.keepLines` memangkas file log eksekusi secara otomatis.
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
    - `reason: not-due` dalam output eksekusi berarti eksekusi manual diperiksa dengan `openclaw cron run <jobId> --due` dan pekerjaan belum jatuh tempo.

  </Accordion>
  <Accordion title="Cron aktif tetapi tidak ada pengiriman">
    - Mode pengiriman `none` berarti tidak ada pengiriman fallback runner yang diharapkan. Agen tetap dapat mengirim langsung dengan alat `message` ketika rute chat tersedia.
    - Target pengiriman tidak ada/tidak valid (`channel`/`to`) berarti outbound dilewati.
    - Untuk Matrix, job yang disalin atau legacy dengan ID ruang `delivery.to` berhuruf kecil dapat gagal karena ID ruang Matrix peka huruf besar-kecil. Edit job ke nilai persis `!room:server` atau `room:!room:server` dari Matrix.
    - Kesalahan autentikasi channel (`unauthorized`, `Forbidden`) berarti pengiriman diblokir oleh kredensial.
    - Jika run terisolasi hanya mengembalikan token senyap (`NO_REPLY` / `no_reply`), OpenClaw menekan pengiriman outbound langsung dan juga menekan jalur ringkasan antrean fallback, sehingga tidak ada yang diposting kembali ke chat.
    - Jika agen harus mengirim pesan kepada pengguna sendiri, periksa bahwa job memiliki rute yang dapat digunakan (`channel: "last"` dengan chat sebelumnya, atau channel/target eksplisit).

  </Accordion>
  <Accordion title="Cron atau heartbeat tampaknya mencegah rollover /new-style">
    - Kesegaran reset harian dan idle tidak didasarkan pada `updatedAt`; lihat [Manajemen sesi](/id/concepts/session#session-lifecycle).
    - Wakeup Cron, run heartbeat, notifikasi exec, dan pembukuan gateway dapat memperbarui baris sesi untuk routing/status, tetapi tidak memperpanjang `sessionStartedAt` atau `lastInteractionAt`.
    - Untuk baris legacy yang dibuat sebelum field tersebut ada, OpenClaw dapat memulihkan `sessionStartedAt` dari header sesi JSONL transkrip ketika file masih tersedia. Baris idle legacy tanpa `lastInteractionAt` menggunakan waktu mulai yang dipulihkan itu sebagai baseline idle mereka.

  </Accordion>
  <Accordion title="Kendala zona waktu">
    - Cron tanpa `--tz` menggunakan zona waktu host gateway.
    - Jadwal `at` tanpa zona waktu diperlakukan sebagai UTC.
    - Heartbeat `activeHours` menggunakan resolusi zona waktu yang dikonfigurasi.

  </Accordion>
</AccordionGroup>

## Terkait

- [Automasi & Tugas](/id/automation) — semua mekanisme automasi secara sekilas
- [Tugas Latar Belakang](/id/automation/tasks) — ledger tugas untuk eksekusi cron
- [Heartbeat](/id/gateway/heartbeat) — giliran sesi utama berkala
- [Zona Waktu](/id/concepts/timezone) — konfigurasi zona waktu
