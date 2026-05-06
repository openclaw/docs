---
read_when:
    - Menjadwalkan pekerjaan latar belakang atau pemicu bangun
    - Menghubungkan pemicu eksternal (Webhook, Gmail) ke OpenClaw
    - Memilih antara Heartbeat dan Cron untuk tugas terjadwal
sidebarTitle: Scheduled tasks
summary: Pekerjaan terjadwal, Webhook, dan pemicu Gmail PubSub untuk penjadwal Gateway
title: Tugas terjadwal
x-i18n:
    generated_at: "2026-05-06T17:52:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19c3505408ab7602775dc1168c2c7a626986fa2a15ef02a44dc864d5ec538bfe
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron adalah penjadwal bawaan Gateway. Cron mempertahankan job, membangunkan agen pada waktu yang tepat, dan dapat mengirimkan output kembali ke channel chat atau endpoint webhook.

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
- Definisi job dipertahankan di `~/.openclaw/cron/jobs.json` sehingga jadwal tidak hilang saat restart.
- Status eksekusi runtime dipertahankan di sebelahnya dalam `~/.openclaw/cron/jobs-state.json`. Jika Anda melacak definisi cron di git, lacak `jobs.json` dan masukkan `jobs-state.json` ke gitignore.
- Setelah pemisahan, versi OpenClaw yang lebih lama dapat membaca `jobs.json` tetapi mungkin memperlakukan job sebagai baru karena field runtime kini berada di `jobs-state.json`.
- Ketika `jobs.json` diedit saat Gateway sedang berjalan atau berhenti, OpenClaw membandingkan field jadwal yang berubah dengan metadata slot runtime yang tertunda dan menghapus nilai `nextRunAtMs` yang usang. Penulisan ulang yang hanya mengubah pemformatan atau urutan kunci mempertahankan slot yang tertunda.
- Semua eksekusi cron membuat catatan [tugas latar belakang](/id/automation/tasks).
- Saat Gateway dimulai, job giliran agen terisolasi yang terlambat dijadwalkan ulang keluar dari jendela koneksi channel alih-alih diputar ulang segera, sehingga startup Discord/Telegram dan penyiapan perintah native tetap responsif setelah restart.
- Job satu kali (`--at`) otomatis dihapus setelah berhasil secara default.
- Run cron terisolasi berusaha menutup tab/proses browser yang terlacak untuk sesi `cron:<jobId>` miliknya saat run selesai, sehingga otomasi browser yang terlepas tidak meninggalkan proses yatim.
- Run cron terisolasi yang menerima grant pembersihan mandiri cron yang sempit masih dapat membaca status penjadwal dan daftar job saat ini yang difilter untuk dirinya sendiri, sehingga pemeriksaan status/Heartbeat dapat memeriksa jadwalnya sendiri tanpa mendapatkan akses mutasi cron yang lebih luas.
- Run cron terisolasi juga melindungi dari balasan pengakuan yang usang. Jika hasil pertama hanyalah pembaruan status sementara (`on it`, `pulling everything together`, dan petunjuk serupa) dan tidak ada run subagen turunan yang masih bertanggung jawab atas jawaban akhir, OpenClaw meminta ulang satu kali untuk hasil sebenarnya sebelum pengiriman.
- Run cron terisolasi lebih mengutamakan metadata penolakan eksekusi terstruktur dari run tertanam, lalu fallback ke penanda ringkasan/output akhir yang dikenal seperti `SYSTEM_RUN_DENIED` dan `INVALID_REQUEST`, sehingga perintah yang diblokir tidak dilaporkan sebagai run yang berhasil.
- Run cron terisolasi juga memperlakukan kegagalan agen tingkat run sebagai error job meskipun tidak ada payload balasan yang dihasilkan, sehingga kegagalan model/provider menaikkan penghitung error dan memicu notifikasi kegagalan alih-alih menghapus job sebagai berhasil.
- Ketika job giliran agen terisolasi mencapai `timeoutSeconds`, cron membatalkan run agen yang mendasarinya dan memberinya jendela pembersihan singkat. Jika run tidak selesai mengalir, pembersihan milik Gateway menghapus paksa kepemilikan sesi run tersebut sebelum cron mencatat timeout, sehingga pekerjaan chat yang mengantre tidak tertinggal di balik sesi pemrosesan yang usang.

<a id="maintenance"></a>

<Note>
Rekonsiliasi tugas untuk cron pertama-tama dimiliki runtime, lalu didukung riwayat tahan lama: tugas cron aktif tetap hidup selama runtime cron masih melacak job tersebut sebagai sedang berjalan, meskipun baris sesi anak lama masih ada. Setelah runtime berhenti memiliki job dan jendela tenggang 5 menit berakhir, pemeliharaan memeriksa log run yang dipertahankan dan status job untuk run `cron:<jobId>:<startedAt>` yang cocok. Jika riwayat tahan lama itu menunjukkan hasil terminal, ledger tugas difinalisasi darinya; jika tidak, pemeliharaan milik Gateway dapat menandai tugas sebagai `lost`. Audit CLI offline dapat memulihkan dari riwayat tahan lama, tetapi tidak memperlakukan kumpulan job aktif dalam prosesnya sendiri yang kosong sebagai bukti bahwa run cron milik Gateway telah hilang.
</Note>

## Jenis jadwal

| Jenis   | Flag CLI  | Deskripsi                                               |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | Timestamp satu kali (ISO 8601 atau relatif seperti `20m`) |
| `every` | `--every` | Interval tetap                                          |
| `cron`  | `--cron`  | Ekspresi cron 5-field atau 6-field dengan `--tz` opsional |

Timestamp tanpa zona waktu diperlakukan sebagai UTC. Tambahkan `--tz America/New_York` untuk penjadwalan waktu dinding lokal.

Ekspresi berulang pada awal jam secara otomatis disebar hingga 5 menit untuk mengurangi lonjakan beban. Gunakan `--exact` untuk memaksa waktu yang presisi atau `--stagger 30s` untuk jendela eksplisit.

### Day-of-month dan day-of-week menggunakan logika OR

Ekspresi cron diparse oleh [croner](https://github.com/Hexagon/croner). Ketika field day-of-month dan day-of-week sama-sama bukan wildcard, croner cocok ketika **salah satu** field cocok — bukan keduanya. Ini adalah perilaku standar Vixie cron.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Ini berjalan sekitar 5–6 kali per bulan, bukan 0–1 kali per bulan. OpenClaw menggunakan perilaku OR default Croner di sini. Untuk mewajibkan kedua kondisi, gunakan modifier day-of-week `+` milik Croner (`0 9 15 * +1`) atau jadwalkan pada satu field dan jaga field lainnya dalam prompt atau perintah job Anda.

## Gaya eksekusi

| Gaya           | Nilai `--session`   | Berjalan di              | Paling cocok untuk             |
| -------------- | ------------------- | ------------------------ | ------------------------------ |
| Sesi utama     | `main`              | Giliran Heartbeat berikutnya | Pengingat, event sistem        |
| Terisolasi     | `isolated`          | `cron:<jobId>` khusus    | Laporan, pekerjaan latar belakang |
| Sesi saat ini  | `current`           | Diikat saat dibuat       | Pekerjaan berulang sadar konteks |
| Sesi kustom    | `session:custom-id` | Sesi bernama persisten   | Workflow yang dibangun dari riwayat |

<AccordionGroup>
  <Accordion title="Main session vs isolated vs custom">
    Job **sesi utama** mengantrekan event sistem dan secara opsional membangunkan Heartbeat (`--wake now` atau `--wake next-heartbeat`). Event sistem tersebut tidak memperpanjang kesegaran reset harian/idle untuk sesi target. Job **terisolasi** menjalankan giliran agen khusus dengan sesi baru. **Sesi kustom** (`session:xxx`) mempertahankan konteks antar-run, memungkinkan workflow seperti standup harian yang dibangun dari ringkasan sebelumnya.
  </Accordion>
  <Accordion title="What 'fresh session' means for isolated jobs">
    Untuk job terisolasi, "sesi baru" berarti id transkrip/sesi baru untuk setiap run. OpenClaw dapat membawa preferensi aman seperti pengaturan thinking/fast/verbose, label, dan override model/auth yang dipilih pengguna secara eksplisit, tetapi tidak mewarisi konteks percakapan sekitar dari baris cron lama: routing channel/grup, kebijakan kirim atau antre, elevasi, origin, atau binding runtime ACP. Gunakan `current` atau `session:<id>` ketika job berulang memang harus dibangun dari konteks percakapan yang sama.
  </Accordion>
  <Accordion title="Runtime cleanup">
    Untuk job terisolasi, teardown runtime kini mencakup pembersihan browser best-effort untuk sesi cron tersebut. Kegagalan pembersihan diabaikan sehingga hasil cron sebenarnya tetap menjadi penentu.

    Run cron terisolasi juga membuang instance runtime MCP bawaan yang dibuat untuk job melalui jalur pembersihan runtime bersama. Ini sesuai dengan cara klien MCP sesi utama dan sesi kustom di-teardown, sehingga job cron terisolasi tidak membocorkan proses anak stdio atau koneksi MCP jangka panjang antar-run.

  </Accordion>
  <Accordion title="Subagent and Discord delivery">
    Ketika run cron terisolasi mengorkestrasi subagen, pengiriman juga lebih mengutamakan output turunan akhir daripada teks sementara induk yang usang. Jika turunan masih berjalan, OpenClaw menahan pembaruan induk parsial tersebut alih-alih mengumumkannya.

    Untuk target pengumuman Discord yang hanya berupa teks, OpenClaw mengirim teks asisten akhir kanonis satu kali alih-alih memutar ulang payload teks streamed/sementara sekaligus jawaban akhir. Payload media dan Discord terstruktur tetap dikirim sebagai payload terpisah sehingga lampiran dan komponen tidak hilang.

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
  Batasi tool yang dapat digunakan job, misalnya `--tools exec,read`.
</ParamField>

`--model` menggunakan model yang diizinkan dan dipilih sebagai model utama job tersebut. Ini tidak sama dengan override `/model` sesi chat: rantai fallback yang dikonfigurasi tetap berlaku ketika model utama job gagal. Jika model yang diminta tidak diizinkan atau tidak dapat di-resolve, cron menggagalkan run dengan error validasi eksplisit alih-alih diam-diam fallback ke pemilihan model agen/default job.

Job cron juga dapat membawa `fallbacks` tingkat payload. Jika ada, daftar tersebut menggantikan rantai fallback yang dikonfigurasi untuk job. Gunakan `fallbacks: []` dalam payload/API job ketika Anda menginginkan run cron ketat yang hanya mencoba model yang dipilih. Jika sebuah job memiliki `--model` tetapi tidak memiliki fallback payload maupun yang dikonfigurasi, OpenClaw meneruskan override fallback kosong secara eksplisit sehingga model utama agen tidak ditambahkan sebagai target retry ekstra tersembunyi.

Prioritas pemilihan model untuk job terisolasi adalah:

1. Override model hook Gmail (ketika run berasal dari Gmail dan override tersebut diizinkan)
2. `model` payload per job
3. Override model sesi cron tersimpan yang dipilih pengguna
4. Pemilihan model agen/default

Mode cepat juga mengikuti pemilihan live yang di-resolve. Jika konfigurasi model yang dipilih memiliki `params.fastMode`, cron terisolasi menggunakan itu secara default. Override `fastMode` sesi tersimpan tetap menang atas konfigurasi ke arah mana pun.

Jika run terisolasi mengalami handoff peralihan model live, cron mencoba ulang dengan provider/model yang dialihkan dan mempertahankan pemilihan live tersebut untuk run aktif sebelum mencoba ulang. Ketika peralihan juga membawa profil auth baru, cron juga mempertahankan override profil auth tersebut untuk run aktif. Retry dibatasi: setelah percobaan awal ditambah 2 retry peralihan, cron membatalkan alih-alih melakukan loop tanpa akhir.

Sebelum run cron terisolasi masuk ke runner agen, OpenClaw memeriksa endpoint provider lokal yang dapat dijangkau untuk provider `api: "ollama"` dan `api: "openai-completions"` yang dikonfigurasi dengan `baseUrl` berupa local loopback, jaringan privat, atau `.local`. Jika endpoint tersebut down, run dicatat sebagai `skipped` dengan error provider/model yang jelas alih-alih memulai panggilan model. Hasil endpoint di-cache selama 5 menit, sehingga banyak job jatuh tempo yang menggunakan server Ollama, vLLM, SGLang, atau LM Studio lokal yang sama-sama mati berbagi satu probe kecil alih-alih membuat badai request. Run provider-preflight yang dilewati tidak menaikkan backoff error eksekusi; aktifkan `failureAlert.includeSkipped` ketika Anda menginginkan notifikasi skip berulang.

## Pengiriman dan output

| Mode       | Yang terjadi                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Fallback-kirim teks akhir ke target jika agen tidak mengirim        |
| `webhook`  | POST payload event selesai ke URL                                   |
| `none`     | Tidak ada pengiriman fallback runner                                |

Gunakan `--announce --channel telegram --to "-1001234567890"` untuk pengiriman channel. Untuk topik forum Telegram, gunakan `-1001234567890:topic:123`; pemanggil RPC/config langsung juga dapat meneruskan `delivery.threadId` sebagai string atau angka. Target Slack/Discord/Mattermost harus menggunakan prefiks eksplisit (`channel:<id>`, `user:<id>`). ID room Matrix peka huruf besar-kecil; gunakan ID room yang persis atau bentuk `room:!room:server` dari Matrix.

Saat pengiriman announce menggunakan `channel: "last"` atau menghilangkan `channel`, target berprefiks penyedia seperti `telegram:123` dapat memilih channel sebelum cron kembali ke riwayat sesi atau satu channel yang dikonfigurasi. Hanya prefiks yang diumumkan oleh Plugin yang dimuat yang menjadi pemilih penyedia. Jika `delivery.channel` eksplisit, prefiks target harus menamai penyedia yang sama; misalnya, `channel: "whatsapp"` dengan `to: "telegram:123"` ditolak alih-alih membiarkan WhatsApp menafsirkan ID Telegram sebagai nomor telepon. Prefiks jenis target dan layanan seperti `channel:<id>`, `user:<id>`, `imessage:<handle>`, dan `sms:<number>` tetap menjadi sintaks target milik channel, bukan pemilih penyedia.

Untuk job terisolasi, pengiriman chat dibagikan. Jika rute chat tersedia, agen dapat menggunakan tool `message` meskipun job menggunakan `--no-deliver`. Jika agen mengirim ke target yang dikonfigurasi/saat ini, OpenClaw melewati announce fallback. Jika tidak, `announce`, `webhook`, dan `none` hanya mengontrol apa yang dilakukan runner terhadap balasan akhir setelah giliran agen.

Saat agen membuat pengingat terisolasi dari chat aktif, OpenClaw menyimpan target pengiriman live yang dipertahankan untuk rute announce fallback. Kunci sesi internal dapat berupa huruf kecil; target pengiriman penyedia tidak direkonstruksi dari kunci tersebut saat konteks chat saat ini tersedia.

Pengiriman announce implisit menggunakan allowlist channel yang dikonfigurasi untuk memvalidasi dan merutekan ulang target yang sudah usang. Persetujuan pairing-store DM bukan penerima otomatisasi fallback; tetapkan `delivery.to` atau konfigurasikan entri `allowFrom` channel saat job terjadwal harus secara proaktif mengirim ke DM.

Notifikasi kegagalan mengikuti jalur tujuan terpisah:

- `cron.failureDestination` menetapkan default global untuk notifikasi kegagalan.
- `job.delivery.failureDestination` menggantinya per job.
- Jika keduanya tidak ditetapkan dan job sudah dikirim melalui `announce`, notifikasi kegagalan sekarang kembali ke target announce utama tersebut.
- `delivery.failureDestination` hanya didukung pada job `sessionTarget="isolated"` kecuali mode pengiriman utama adalah `webhook`.
- `failureAlert.includeSkipped: true` mengikutkan kebijakan alert job atau cron global ke dalam alert run yang dilewati secara berulang. Run yang dilewati menyimpan penghitung skip berturut-turut terpisah, sehingga tidak memengaruhi backoff error eksekusi.

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

    Field: `message` (wajib), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Hook yang dipetakan (POST /hooks/<name>)">
    Nama hook kustom di-resolve melalui `hooks.mappings` di config. Mapping dapat mengubah payload arbitrer menjadi aksi `wake` atau `agent` dengan templat atau transformasi kode.
  </Accordion>
</AccordionGroup>

<Warning>
Jaga endpoint hook tetap di belakang loopback, tailnet, atau reverse proxy tepercaya.

- Gunakan token hook khusus; jangan gunakan ulang token auth Gateway.
- Pertahankan `hooks.path` pada subpath khusus; `/` ditolak.
- Tetapkan `hooks.allowedAgentIds` untuk membatasi routing `agentId` eksplisit.
- Pertahankan `hooks.allowRequestSessionKey=false` kecuali Anda memerlukan sesi yang dipilih pemanggil.
- Jika Anda mengaktifkan `hooks.allowRequestSessionKey`, tetapkan juga `hooks.allowedSessionKeyPrefixes` untuk membatasi bentuk kunci sesi yang diizinkan.
- Payload hook dibungkus dengan batas keamanan secara default.

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

Ini menulis config `hooks.gmail`, mengaktifkan preset Gmail, dan menggunakan Tailscale Funnel untuk endpoint push.

### Mulai otomatis Gateway

Saat `hooks.enabled=true` dan `hooks.gmail.account` ditetapkan, Gateway memulai `gog gmail watch serve` saat boot dan memperpanjang watch secara otomatis. Tetapkan `OPENCLAW_SKIP_GMAIL_WATCHER=1` untuk keluar.

### Penyiapan manual sekali jalan

<Steps>
  <Step title="Pilih project GCP">
    Pilih project GCP yang memiliki klien OAuth yang digunakan oleh `gog`:

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="Buat topic dan berikan akses push Gmail">
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
# Daftar semua job
openclaw cron list

# Tampilkan satu job, termasuk rute pengiriman yang di-resolve
openclaw cron show <jobId>

# Edit job
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Paksa jalankan job sekarang
openclaw cron run <jobId>

# Jalankan hanya jika sudah jatuh tempo
openclaw cron run <jobId> --due

# Lihat riwayat run
openclaw cron runs --id <jobId> --limit 50

# Hapus job
openclaw cron remove <jobId>

# Pemilihan agen (penyiapan multi-agen)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

<Note>
Catatan override model:

- `openclaw cron add|edit --model ...` mengubah model yang dipilih job.
- Jika model diizinkan, penyedia/model persis tersebut mencapai run agen terisolasi.
- Jika tidak diizinkan atau tidak dapat di-resolve, cron menggagalkan run dengan error validasi eksplisit.
- Rantai fallback yang dikonfigurasi tetap berlaku karena `--model` cron adalah primary job, bukan override `/model` sesi.
- Payload `fallbacks` menggantikan fallback yang dikonfigurasi untuk job tersebut; `fallbacks: []` menonaktifkan fallback dan membuat run bersifat ketat.
- `--model` polos tanpa daftar fallback eksplisit atau terkonfigurasi tidak jatuh ke primary agen sebagai target retry tambahan senyap.

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

`maxConcurrentRuns` membatasi dispatch cron terjadwal dan eksekusi giliran agen terisolasi. Giliran agen cron terisolasi secara internal menggunakan lane eksekusi `cron-nested` khusus antrean, sehingga menaikkan nilai ini memungkinkan run LLM cron independen berjalan paralel alih-alih hanya memulai wrapper cron luarnya. Lane `nested` non-cron bersama tidak diperlebar oleh pengaturan ini.

Sidecar state runtime diturunkan dari `cron.store`: store `.json` seperti `~/clawd/cron/jobs.json` menggunakan `~/clawd/cron/jobs-state.json`, sedangkan path store tanpa sufiks `.json` menambahkan `-state.json`.

Jika Anda mengedit `jobs.json` secara manual, jangan masukkan `jobs-state.json` ke source control. OpenClaw menggunakan sidecar tersebut untuk slot tertunda, marker aktif, metadata run terakhir, dan identitas jadwal yang memberi tahu scheduler kapan job yang diedit secara eksternal memerlukan `nextRunAtMs` baru.

Nonaktifkan cron: `cron.enabled: false` atau `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Perilaku retry">
    **Retry sekali jalan**: error sementara (batas laju, overload, jaringan, error server) dicoba ulang hingga 3 kali dengan backoff eksponensial. Error permanen langsung menonaktifkan.

    **Retry berulang**: backoff eksponensial (30d hingga 60m) di antara retry. Backoff di-reset setelah run sukses berikutnya.

  </Accordion>
  <Accordion title="Pemeliharaan">
    `cron.sessionRetention` (default `24h`) memangkas entri sesi-run terisolasi. `cron.runLog.maxBytes` / `cron.runLog.keepLines` memangkas file run-log secara otomatis.
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
    - Untuk jadwal `cron`, verifikasi zona waktu (`--tz`) vs zona waktu host.
    - `reason: not-due` dalam output run berarti run manual diperiksa dengan `openclaw cron run <jobId> --due` dan job belum jatuh tempo.

  </Accordion>
  <Accordion title="Cron dipicu tetapi tidak ada pengiriman">
    - Mode pengiriman `none` berarti tidak ada pengiriman fallback runner yang diharapkan. Agen tetap dapat mengirim langsung dengan alat `message` ketika rute chat tersedia.
    - Target pengiriman hilang/tidak valid (`channel`/`to`) berarti outbound dilewati.
    - Untuk Matrix, pekerjaan yang disalin atau legacy dengan ID ruang `delivery.to` yang diubah menjadi huruf kecil dapat gagal karena ID ruang Matrix peka huruf besar-kecil. Edit pekerjaan ke nilai persis `!room:server` atau `room:!room:server` dari Matrix.
    - Kesalahan auth kanal (`unauthorized`, `Forbidden`) berarti pengiriman diblokir oleh kredensial.
    - Jika eksekusi terisolasi hanya mengembalikan token senyap (`NO_REPLY` / `no_reply`), OpenClaw menekan pengiriman outbound langsung dan juga menekan jalur ringkasan antrean fallback, sehingga tidak ada apa pun yang diposting kembali ke chat.
    - Jika agen seharusnya mengirim pesan kepada pengguna sendiri, periksa bahwa pekerjaan memiliki rute yang dapat digunakan (`channel: "last"` dengan chat sebelumnya, atau kanal/target eksplisit).

  </Accordion>
  <Accordion title="Cron atau Heartbeat tampak mencegah rollover /new-style">
    - Kesegaran reset harian dan idle tidak didasarkan pada `updatedAt`; lihat [Manajemen sesi](/id/concepts/session#session-lifecycle).
    - Wakeup Cron, eksekusi Heartbeat, notifikasi exec, dan pembukuan gateway dapat memperbarui baris sesi untuk routing/status, tetapi tidak memperpanjang `sessionStartedAt` atau `lastInteractionAt`.
    - Untuk baris legacy yang dibuat sebelum kolom tersebut ada, OpenClaw dapat memulihkan `sessionStartedAt` dari header sesi JSONL transkrip ketika file masih tersedia. Baris idle legacy tanpa `lastInteractionAt` menggunakan waktu mulai yang dipulihkan tersebut sebagai baseline idle.

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
- [Zona Waktu](/id/concepts/timezone) — konfigurasi zona waktu
