---
read_when:
    - Menjadwalkan tugas latar belakang atau pemicu bangun
    - Menghubungkan pemicu eksternal (Webhook, Gmail) ke OpenClaw
    - Memilih antara Heartbeat dan Cron untuk tugas terjadwal
sidebarTitle: Scheduled tasks
summary: Tugas terjadwal, Webhook, dan pemicu Gmail PubSub untuk penjadwal Gateway
title: Tugas terjadwal
x-i18n:
    generated_at: "2026-04-30T09:32:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 021e623bdea786178e0948e9905360c897c26d31fdf866e9af8cfc9538968d60
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron adalah penjadwal bawaan Gateway. Cron menyimpan pekerjaan, membangunkan agen pada waktu yang tepat, dan dapat mengirimkan output kembali ke saluran chat atau endpoint Webhook.

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
- Definisi pekerjaan disimpan secara persisten di `~/.openclaw/cron/jobs.json` sehingga jadwal tidak hilang saat dimulai ulang.
- Status eksekusi runtime disimpan secara persisten di sampingnya dalam `~/.openclaw/cron/jobs-state.json`. Jika Anda melacak definisi cron di git, lacak `jobs.json` dan masukkan `jobs-state.json` ke gitignore.
- Setelah pemisahan, versi OpenClaw yang lebih lama dapat membaca `jobs.json` tetapi mungkin memperlakukan pekerjaan sebagai baru karena field runtime sekarang berada di `jobs-state.json`.
- Saat `jobs.json` diedit ketika Gateway sedang berjalan atau berhenti, OpenClaw membandingkan field jadwal yang berubah dengan metadata slot runtime tertunda dan menghapus nilai `nextRunAtMs` yang usang. Penulisan ulang yang hanya mengubah pemformatan atau urutan kunci mempertahankan slot tertunda.
- Semua eksekusi cron membuat catatan [tugas latar belakang](/id/automation/tasks).
- Saat Gateway dimulai, pekerjaan giliran agen terisolasi yang sudah melewati waktu dijadwalkan ulang keluar dari jendela koneksi saluran alih-alih diputar ulang segera, sehingga startup Discord/Telegram dan penyiapan perintah native tetap responsif setelah dimulai ulang.
- Pekerjaan satu kali (`--at`) otomatis dihapus setelah berhasil secara default.
- Eksekusi cron terisolasi berupaya menutup tab/proses browser yang dilacak untuk sesi `cron:<jobId>` mereka saat eksekusi selesai, sehingga otomasi browser yang terlepas tidak meninggalkan proses yatim.
- Eksekusi cron terisolasi juga melindungi dari balasan pengakuan yang usang. Jika hasil pertama hanya pembaruan status sementara (`on it`, `pulling everything together`, dan petunjuk serupa) dan tidak ada eksekusi subagen turunan yang masih bertanggung jawab atas jawaban akhir, OpenClaw meminta ulang satu kali untuk hasil sebenarnya sebelum pengiriman.
- Eksekusi cron terisolasi lebih memilih metadata penolakan eksekusi terstruktur dari eksekusi tertanam, lalu kembali ke penanda ringkasan/output akhir yang dikenal seperti `SYSTEM_RUN_DENIED` dan `INVALID_REQUEST`, sehingga perintah yang diblokir tidak dilaporkan sebagai eksekusi hijau.
- Eksekusi cron terisolasi juga memperlakukan kegagalan agen tingkat eksekusi sebagai error pekerjaan meskipun tidak ada payload balasan yang dihasilkan, sehingga kegagalan model/penyedia menaikkan penghitung error dan memicu notifikasi kegagalan alih-alih membersihkan pekerjaan sebagai berhasil.
- Saat pekerjaan giliran agen terisolasi mencapai `timeoutSeconds`, cron membatalkan eksekusi agen yang mendasarinya dan memberinya jendela pembersihan singkat. Jika eksekusi tidak selesai mengalir, pembersihan milik Gateway akan memaksa penghapusan kepemilikan sesi eksekusi tersebut sebelum cron mencatat timeout, sehingga pekerjaan chat yang mengantre tidak tertinggal di belakang sesi pemrosesan yang usang.

<a id="maintenance"></a>

<Note>
Rekonsiliasi tugas untuk cron pertama-tama dimiliki runtime, lalu didukung riwayat tahan lama: tugas cron aktif tetap live selama runtime cron masih melacak pekerjaan tersebut sebagai sedang berjalan, meskipun baris sesi anak lama masih ada. Setelah runtime berhenti memiliki pekerjaan dan jendela tenggang 5 menit berakhir, pemeriksaan pemeliharaan memeriksa log eksekusi tersimpan dan status pekerjaan untuk eksekusi `cron:<jobId>:<startedAt>` yang cocok. Jika riwayat tahan lama itu menunjukkan hasil terminal, buku besar tugas difinalisasi darinya; jika tidak, pemeliharaan milik Gateway dapat menandai tugas sebagai `lost`. Audit CLI offline dapat memulihkan dari riwayat tahan lama, tetapi audit tersebut tidak memperlakukan kumpulan pekerjaan aktif dalam prosesnya yang kosong sebagai bukti bahwa eksekusi cron milik Gateway telah hilang.
</Note>

## Jenis jadwal

| Jenis   | Flag CLI  | Deskripsi                                               |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | Timestamp satu kali (ISO 8601 atau relatif seperti `20m`) |
| `every` | `--every` | Interval tetap                                          |
| `cron`  | `--cron`  | Ekspresi cron 5-field atau 6-field dengan `--tz` opsional |

Timestamp tanpa zona waktu diperlakukan sebagai UTC. Tambahkan `--tz America/New_York` untuk penjadwalan waktu dinding lokal.

Ekspresi berulang di awal jam otomatis disebar hingga 5 menit untuk mengurangi lonjakan beban. Gunakan `--exact` untuk memaksa waktu presisi atau `--stagger 30s` untuk jendela eksplisit.

### Hari dalam bulan dan hari dalam minggu menggunakan logika OR

Ekspresi Cron diurai oleh [croner](https://github.com/Hexagon/croner). Saat field hari dalam bulan dan hari dalam minggu sama-sama bukan wildcard, croner mencocokkan ketika **salah satu** field cocok — bukan keduanya. Ini adalah perilaku cron Vixie standar.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Ini berjalan sekitar 5–6 kali per bulan, bukan 0–1 kali per bulan. OpenClaw menggunakan perilaku OR default Croner di sini. Untuk mensyaratkan kedua kondisi, gunakan modifier hari dalam minggu `+` milik Croner (`0 9 15 * +1`) atau jadwalkan pada satu field dan lindungi field lainnya di prompt atau perintah pekerjaan Anda.

## Gaya eksekusi

| Gaya          | Nilai `--session`   | Berjalan di              | Paling cocok untuk              |
| ------------- | ------------------- | ------------------------ | ------------------------------- |
| Sesi utama    | `main`              | Giliran Heartbeat berikutnya | Pengingat, peristiwa sistem     |
| Terisolasi    | `isolated`          | `cron:<jobId>` khusus    | Laporan, pekerjaan latar belakang |
| Sesi saat ini | `current`           | Diikat saat dibuat       | Pekerjaan berulang sadar konteks |
| Sesi kustom   | `session:custom-id` | Sesi bernama persisten   | Workflow yang dibangun di atas riwayat |

<AccordionGroup>
  <Accordion title="Main session vs isolated vs custom">
    Pekerjaan **sesi utama** mengantrekan peristiwa sistem dan secara opsional membangunkan Heartbeat (`--wake now` atau `--wake next-heartbeat`). Peristiwa sistem tersebut tidak memperpanjang kesegaran reset harian/idle untuk sesi target. Pekerjaan **terisolasi** menjalankan giliran agen khusus dengan sesi baru. **Sesi kustom** (`session:xxx`) mempertahankan konteks lintas eksekusi, memungkinkan workflow seperti standup harian yang dibangun di atas ringkasan sebelumnya.
  </Accordion>
  <Accordion title="What 'fresh session' means for isolated jobs">
    Untuk pekerjaan terisolasi, "sesi baru" berarti transcript/id sesi baru untuk setiap eksekusi. OpenClaw dapat membawa preferensi aman seperti pengaturan berpikir/cepat/verbose, label, dan override model/auth yang dipilih pengguna secara eksplisit, tetapi tidak mewarisi konteks percakapan sekitar dari baris cron yang lebih lama: routing saluran/grup, kebijakan kirim atau antre, elevasi, asal, atau binding runtime ACP. Gunakan `current` atau `session:<id>` saat pekerjaan berulang harus secara sengaja dibangun di atas konteks percakapan yang sama.
  </Accordion>
  <Accordion title="Runtime cleanup">
    Untuk pekerjaan terisolasi, teardown runtime sekarang mencakup pembersihan browser upaya-terbaik untuk sesi cron tersebut. Kegagalan pembersihan diabaikan sehingga hasil cron yang sebenarnya tetap menang.

    Eksekusi cron terisolasi juga membuang instance runtime MCP bawaan apa pun yang dibuat untuk pekerjaan melalui jalur pembersihan runtime bersama. Ini cocok dengan cara klien MCP sesi utama dan sesi kustom dibongkar, sehingga pekerjaan cron terisolasi tidak membocorkan proses anak stdio atau koneksi MCP berumur panjang lintas eksekusi.

  </Accordion>
  <Accordion title="Subagent and Discord delivery">
    Saat eksekusi cron terisolasi mengorkestrasi subagen, pengiriman juga lebih memilih output turunan akhir daripada teks sementara induk yang usang. Jika turunan masih berjalan, OpenClaw menekan pembaruan parsial induk tersebut alih-alih mengumumkannya.

    Untuk target pengumuman Discord hanya-teks, OpenClaw mengirim teks asisten akhir kanonis satu kali alih-alih memutar ulang payload teks streaming/sementara dan jawaban akhir sekaligus. Payload media dan Discord terstruktur tetap dikirim sebagai payload terpisah agar lampiran dan komponen tidak hilang.

  </Accordion>
</AccordionGroup>

### Opsi payload untuk pekerjaan terisolasi

<ParamField path="--message" type="string" required>
  Teks prompt (wajib untuk terisolasi).
</ParamField>
<ParamField path="--model" type="string">
  Override model; menggunakan model yang diizinkan dan dipilih untuk pekerjaan.
</ParamField>
<ParamField path="--thinking" type="string">
  Override tingkat berpikir.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Lewati injeksi file bootstrap workspace.
</ParamField>
<ParamField path="--tools" type="string">
  Batasi tool mana yang dapat digunakan pekerjaan, misalnya `--tools exec,read`.
</ParamField>

`--model` menggunakan model yang diizinkan dan dipilih sebagai model utama pekerjaan tersebut. Ini tidak sama dengan override `/model` sesi chat: rantai fallback yang dikonfigurasi tetap berlaku saat model utama pekerjaan gagal. Jika model yang diminta tidak diizinkan atau tidak dapat diselesaikan, cron menggagalkan eksekusi dengan error validasi eksplisit alih-alih diam-diam fallback ke pemilihan model agen/default pekerjaan.

Pekerjaan Cron juga dapat membawa `fallbacks` tingkat payload. Jika ada, daftar tersebut menggantikan rantai fallback yang dikonfigurasi untuk pekerjaan. Gunakan `fallbacks: []` dalam payload/API pekerjaan saat Anda menginginkan eksekusi cron ketat yang hanya mencoba model yang dipilih. Jika pekerjaan memiliki `--model` tetapi tidak ada fallback payload maupun fallback terkonfigurasi, OpenClaw meneruskan override fallback kosong eksplisit sehingga model utama agen tidak ditambahkan sebagai target coba ulang ekstra yang tersembunyi.

Prioritas pemilihan model untuk pekerjaan terisolasi adalah:

1. Override model hook Gmail (saat eksekusi berasal dari Gmail dan override tersebut diizinkan)
2. `model` payload per pekerjaan
3. Override model sesi cron tersimpan yang dipilih pengguna
4. Pemilihan model agen/default

Mode cepat juga mengikuti pilihan live yang diselesaikan. Jika konfigurasi model yang dipilih memiliki `params.fastMode`, cron terisolasi menggunakannya secara default. Override `fastMode` sesi tersimpan tetap menang atas konfigurasi ke arah mana pun.

Jika eksekusi terisolasi terkena handoff pengalihan model live, cron mencoba ulang dengan penyedia/model yang dialihkan dan menyimpan pilihan live tersebut untuk eksekusi aktif sebelum mencoba ulang. Saat pengalihan juga membawa profil auth baru, cron juga menyimpan override profil auth tersebut untuk eksekusi aktif. Percobaan ulang dibatasi: setelah percobaan awal ditambah 2 percobaan ulang pengalihan, cron membatalkan alih-alih berulang selamanya.

Sebelum eksekusi cron terisolasi masuk ke agent runner, OpenClaw memeriksa endpoint penyedia lokal yang dapat dijangkau untuk penyedia `api: "ollama"` dan `api: "openai-completions"` terkonfigurasi yang `baseUrl`-nya adalah local loopback, jaringan privat, atau `.local`. Jika endpoint tersebut down, eksekusi dicatat sebagai `skipped` dengan error penyedia/model yang jelas alih-alih memulai panggilan model. Hasil endpoint di-cache selama 5 menit, sehingga banyak pekerjaan jatuh tempo yang menggunakan server Ollama, vLLM, SGLang, atau LM Studio lokal mati yang sama berbagi satu probe kecil alih-alih membuat badai permintaan. Eksekusi provider-preflight yang dilewati tidak menaikkan backoff error eksekusi; aktifkan `failureAlert.includeSkipped` saat Anda menginginkan notifikasi skip berulang.

## Pengiriman dan output

| Mode       | Yang terjadi                                                       |
| ---------- | ------------------------------------------------------------------ |
| `announce` | Kirim teks akhir fallback ke target jika agen tidak mengirim       |
| `webhook`  | POST payload peristiwa selesai ke URL                              |
| `none`     | Tidak ada pengiriman fallback runner                               |

Gunakan `--announce --channel telegram --to "-1001234567890"` untuk pengiriman channel. Untuk topik forum Telegram, gunakan `-1001234567890:topic:123`; pemanggil RPC/config langsung juga dapat meneruskan `delivery.threadId` sebagai string atau angka. Target Slack/Discord/Mattermost sebaiknya menggunakan prefiks eksplisit (`channel:<id>`, `user:<id>`). ID ruang Matrix peka huruf besar-kecil; gunakan ID ruang persis atau bentuk `room:!room:server` dari Matrix.

Untuk job terisolasi, pengiriman chat dibagikan. Jika rute chat tersedia, agent dapat menggunakan alat `message` bahkan saat job menggunakan `--no-deliver`. Jika agent mengirim ke target yang dikonfigurasi/saat ini, OpenClaw melewati announce fallback. Jika tidak, `announce`, `webhook`, dan `none` hanya mengontrol apa yang dilakukan runner terhadap balasan final setelah giliran agent.

Saat agent membuat pengingat terisolasi dari chat aktif, OpenClaw menyimpan target pengiriman live yang dipertahankan untuk rute announce fallback. Kunci sesi internal dapat berupa huruf kecil; target pengiriman provider tidak direkonstruksi dari kunci tersebut saat konteks chat saat ini tersedia.

Notifikasi kegagalan mengikuti jalur tujuan terpisah:

- `cron.failureDestination` menetapkan default global untuk notifikasi kegagalan.
- `job.delivery.failureDestination` menimpanya per job.
- Jika keduanya tidak ditetapkan dan job sudah mengirim via `announce`, notifikasi kegagalan sekarang fallback ke target announce utama tersebut.
- `delivery.failureDestination` hanya didukung pada job `sessionTarget="isolated"` kecuali mode pengiriman utama adalah `webhook`.
- `failureAlert.includeSkipped: true` membuat job atau kebijakan alert cron global ikut menerima alert skip-run berulang. Run yang dilewati menyimpan penghitung skip beruntun terpisah, sehingga tidak memengaruhi backoff error eksekusi.

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
    Nama hook kustom diselesaikan melalui `hooks.mappings` di config. Mapping dapat mengubah payload arbitrer menjadi tindakan `wake` atau `agent` dengan template atau transformasi kode.
  </Accordion>
</AccordionGroup>

<Warning>
Letakkan endpoint hook di belakang loopback, tailnet, atau reverse proxy tepercaya.

- Gunakan token hook khusus; jangan gunakan ulang token auth gateway.
- Pertahankan `hooks.path` pada subpath khusus; `/` ditolak.
- Tetapkan `hooks.allowedAgentIds` untuk membatasi routing `agentId` eksplisit.
- Pertahankan `hooks.allowRequestSessionKey=false` kecuali Anda memerlukan sesi yang dipilih pemanggil.
- Jika Anda mengaktifkan `hooks.allowRequestSessionKey`, tetapkan juga `hooks.allowedSessionKeyPrefixes` untuk membatasi bentuk kunci sesi yang diizinkan.
- Payload hook dibungkus dengan batas keamanan secara default.

</Warning>

## Integrasi Gmail PubSub

Hubungkan pemicu inbox Gmail ke OpenClaw melalui Google PubSub.

<Note>
**Prasyarat:** CLI `gcloud`, `gog` (gogcli), hook OpenClaw aktif, Tailscale untuk endpoint HTTPS publik.
</Note>

### Penyiapan wizard (direkomendasikan)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Ini menulis config `hooks.gmail`, mengaktifkan preset Gmail, dan menggunakan Tailscale Funnel untuk endpoint push.

### Auto-start Gateway

Saat `hooks.enabled=true` dan `hooks.gmail.account` ditetapkan, Gateway memulai `gog gmail watch serve` saat boot dan memperpanjang watch otomatis. Tetapkan `OPENCLAW_SKIP_GMAIL_WATCHER=1` untuk tidak ikut.

### Penyiapan manual satu kali

<Steps>
  <Step title="Select the GCP project">
    Pilih project GCP yang memiliki klien OAuth yang digunakan oleh `gog`:

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

## Mengelola job

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

- `openclaw cron add|edit --model ...` mengubah model yang dipilih job.
- Jika model diizinkan, provider/model persis tersebut mencapai run agent terisolasi.
- Jika tidak diizinkan atau tidak dapat diselesaikan, cron menggagalkan run dengan error validasi eksplisit.
- Rantai fallback yang dikonfigurasi tetap berlaku karena `--model` cron adalah model utama job, bukan override `/model` sesi.
- Payload `fallbacks` menggantikan fallback yang dikonfigurasi untuk job tersebut; `fallbacks: []` menonaktifkan fallback dan membuat run ketat.
- `--model` polos tanpa daftar fallback eksplisit atau terkonfigurasi tidak jatuh ke model utama agent sebagai target retry tambahan diam-diam.

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

`maxConcurrentRuns` membatasi dispatch cron terjadwal dan eksekusi giliran agent terisolasi. Giliran agent cron terisolasi menggunakan lane eksekusi khusus `cron-nested` milik antrean secara internal, sehingga menaikkan nilai ini memungkinkan run LLM cron independen berjalan paralel, alih-alih hanya memulai wrapper cron luarnya. Lane `nested` non-cron bersama tidak diperlebar oleh setelan ini.

Sidecar status runtime diturunkan dari `cron.store`: store `.json` seperti `~/clawd/cron/jobs.json` menggunakan `~/clawd/cron/jobs-state.json`, sedangkan path store tanpa sufiks `.json` menambahkan `-state.json`.

Jika Anda mengedit `jobs.json` secara manual, jangan masukkan `jobs-state.json` ke kontrol sumber. OpenClaw menggunakan sidecar tersebut untuk slot tertunda, marker aktif, metadata last-run, dan identitas jadwal yang memberi tahu scheduler kapan job yang diedit secara eksternal memerlukan `nextRunAtMs` baru.

Nonaktifkan cron: `cron.enabled: false` atau `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Retry behavior">
    **Retry satu kali**: error sementara (rate limit, overload, jaringan, error server) dicoba ulang hingga 3 kali dengan backoff eksponensial. Error permanen langsung menonaktifkan.

    **Retry berulang**: backoff eksponensial (30 dtk hingga 60 mnt) di antara retry. Backoff direset setelah run sukses berikutnya.

  </Accordion>
  <Accordion title="Maintenance">
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
  <Accordion title="Cron not firing">
    - Periksa var env `cron.enabled` dan `OPENCLAW_SKIP_CRON`.
    - Pastikan Gateway berjalan terus-menerus.
    - Untuk jadwal `cron`, verifikasi zona waktu (`--tz`) dibandingkan zona waktu host.
    - `reason: not-due` dalam output run berarti run manual diperiksa dengan `openclaw cron run <jobId> --due` dan job belum jatuh tempo.

  </Accordion>
  <Accordion title="Cron fired but no delivery">
    - Mode pengiriman `none` berarti tidak ada pengiriman fallback runner yang diharapkan. Agent tetap dapat mengirim langsung dengan alat `message` saat rute chat tersedia.
    - Target pengiriman hilang/tidak valid (`channel`/`to`) berarti outbound dilewati.
    - Untuk Matrix, job yang disalin atau lama dengan ID ruang `delivery.to` yang diubah menjadi huruf kecil dapat gagal karena ID ruang Matrix peka huruf besar-kecil. Edit job ke nilai `!room:server` atau `room:!room:server` persis dari Matrix.
    - Error auth channel (`unauthorized`, `Forbidden`) berarti pengiriman diblokir oleh kredensial.
    - Jika run terisolasi hanya mengembalikan token silent (`NO_REPLY` / `no_reply`), OpenClaw menekan pengiriman outbound langsung dan juga menekan jalur ringkasan antrean fallback, sehingga tidak ada apa pun yang diposting kembali ke chat.
    - Jika agent harus mengirim pesan ke pengguna sendiri, periksa bahwa job memiliki rute yang dapat digunakan (`channel: "last"` dengan chat sebelumnya, atau channel/target eksplisit).

  </Accordion>
  <Accordion title="Cron atau heartbeat tampak mencegah rollover /new-style">
    - Kesegaran reset harian dan saat menganggur tidak didasarkan pada `updatedAt`; lihat [Manajemen sesi](/id/concepts/session#session-lifecycle).
    - Wakeup Cron, proses heartbeat, notifikasi exec, dan pembukuan gateway dapat memperbarui baris sesi untuk perutean/status, tetapi tidak memperpanjang `sessionStartedAt` atau `lastInteractionAt`.
    - Untuk baris legacy yang dibuat sebelum kolom tersebut ada, OpenClaw dapat memulihkan `sessionStartedAt` dari header sesi JSONL transkrip saat file masih tersedia. Baris idle legacy tanpa `lastInteractionAt` menggunakan waktu mulai yang dipulihkan tersebut sebagai baseline idle-nya.

  </Accordion>
  <Accordion title="Hal-hal yang perlu diperhatikan tentang zona waktu">
    - Cron tanpa `--tz` menggunakan zona waktu host gateway.
    - Jadwal `at` tanpa zona waktu diperlakukan sebagai UTC.
    - `activeHours` Heartbeat menggunakan resolusi zona waktu yang dikonfigurasi.

  </Accordion>
</AccordionGroup>

## Terkait

- [Otomatisasi & Tugas](/id/automation) — semua mekanisme otomatisasi secara ringkas
- [Tugas Latar Belakang](/id/automation/tasks) — ledger tugas untuk eksekusi cron
- [Heartbeat](/id/gateway/heartbeat) — giliran sesi utama berkala
- [Zona waktu](/id/concepts/timezone) — konfigurasi zona waktu
