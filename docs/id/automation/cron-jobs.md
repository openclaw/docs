---
read_when:
    - Menjadwalkan tugas latar belakang atau pengaktifan
    - Menghubungkan pemicu eksternal (Webhook, Gmail) ke OpenClaw
    - Memutuskan antara Heartbeat dan Cron untuk tugas terjadwal
sidebarTitle: Scheduled tasks
summary: Pekerjaan terjadwal, Webhook, dan pemicu Gmail PubSub untuk penjadwal Gateway
title: Tugas terjadwal
x-i18n:
    generated_at: "2026-05-07T13:13:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19c3505408ab7602775dc1168c2c7a626986fa2a15ef02a44dc864d5ec538bfe
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron adalah penjadwal bawaan Gateway. Cron menyimpan tugas, membangunkan agent pada waktu yang tepat, dan dapat mengirimkan output kembali ke channel chat atau endpoint webhook.

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
  <Step title="Periksa tugas Anda">
    ```bash
    openclaw cron list
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
- Definisi tugas disimpan secara persisten di `~/.openclaw/cron/jobs.json` sehingga jadwal tidak hilang saat restart.
- Status eksekusi runtime disimpan di sebelahnya dalam `~/.openclaw/cron/jobs-state.json`. Jika Anda melacak definisi cron di git, lacak `jobs.json` dan masukkan `jobs-state.json` ke gitignore.
- Setelah pemisahan tersebut, versi OpenClaw yang lebih lama dapat membaca `jobs.json` tetapi mungkin memperlakukan tugas sebagai baru karena field runtime kini berada di `jobs-state.json`.
- Saat `jobs.json` diedit ketika Gateway berjalan atau berhenti, OpenClaw membandingkan field jadwal yang berubah dengan metadata slot runtime yang tertunda dan menghapus nilai `nextRunAtMs` yang sudah usang. Penulisan ulang yang hanya mengubah pemformatan atau urutan kunci mempertahankan slot yang tertunda.
- Semua eksekusi cron membuat catatan [background task](/id/automation/tasks).
- Saat Gateway dimulai, tugas agent-turn terisolasi yang terlambat dijadwalkan ulang keluar dari jendela koneksi channel alih-alih diputar ulang seketika, sehingga startup Discord/Telegram dan penyiapan native-command tetap responsif setelah restart.
- Tugas satu kali (`--at`) otomatis dihapus setelah berhasil secara default.
- Eksekusi cron terisolasi berupaya sebaik mungkin menutup tab/proses browser yang dilacak untuk sesi `cron:<jobId>` saat eksekusi selesai, sehingga otomasi browser terlepas tidak meninggalkan proses yatim.
- Eksekusi cron terisolasi yang menerima izin pembersihan mandiri cron yang sempit masih dapat membaca status penjadwal dan daftar yang difilter sendiri untuk tugas saat ini, sehingga pemeriksaan status/heartbeat dapat memeriksa jadwalnya sendiri tanpa memperoleh akses mutasi cron yang lebih luas.
- Eksekusi cron terisolasi juga menjaga terhadap balasan pengakuan yang sudah usang. Jika hasil pertama hanya pembaruan status sementara (`on it`, `pulling everything together`, dan petunjuk serupa) dan tidak ada eksekusi subagent turunan yang masih bertanggung jawab atas jawaban akhir, OpenClaw meminta ulang satu kali untuk hasil sebenarnya sebelum pengiriman.
- Eksekusi cron terisolasi lebih memilih metadata penolakan eksekusi terstruktur dari eksekusi tertanam, lalu fallback ke penanda ringkasan/output akhir yang dikenal seperti `SYSTEM_RUN_DENIED` dan `INVALID_REQUEST`, sehingga perintah yang diblokir tidak dilaporkan sebagai eksekusi hijau.
- Eksekusi cron terisolasi juga memperlakukan kegagalan agent tingkat eksekusi sebagai error tugas meskipun tidak ada payload balasan yang dihasilkan, sehingga kegagalan model/provider menambah penghitung error dan memicu notifikasi kegagalan alih-alih membersihkan tugas sebagai berhasil.
- Saat tugas agent-turn terisolasi mencapai `timeoutSeconds`, cron membatalkan eksekusi agent yang mendasarinya dan memberinya jendela pembersihan singkat. Jika eksekusi tidak selesai menguras, pembersihan milik Gateway memaksa penghapusan kepemilikan sesi eksekusi tersebut sebelum cron mencatat timeout, sehingga pekerjaan chat yang mengantre tidak tertinggal di balik sesi pemrosesan yang sudah usang.

<a id="maintenance"></a>

<Note>
Rekonsiliasi tugas untuk cron pertama-tama dimiliki runtime, lalu didukung riwayat durabel: tugas cron aktif tetap hidup selama runtime cron masih melacak tugas tersebut sebagai berjalan, meskipun baris sesi anak lama masih ada. Setelah runtime berhenti memiliki tugas dan jendela tenggang 5 menit berakhir, pemeliharaan memeriksa log eksekusi yang disimpan dan status tugas untuk eksekusi `cron:<jobId>:<startedAt>` yang cocok. Jika riwayat durabel tersebut menunjukkan hasil terminal, ledger tugas difinalisasi darinya; jika tidak, pemeliharaan milik Gateway dapat menandai tugas sebagai `lost`. Audit CLI offline dapat memulihkan dari riwayat durabel, tetapi tidak memperlakukan set tugas aktif dalam prosesnya sendiri yang kosong sebagai bukti bahwa eksekusi cron milik Gateway telah hilang.
</Note>

## Jenis jadwal

| Jenis   | Flag CLI  | Deskripsi                                               |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | Timestamp satu kali (ISO 8601 atau relatif seperti `20m`) |
| `every` | `--every` | Interval tetap                                          |
| `cron`  | `--cron`  | Ekspresi cron 5-field atau 6-field dengan `--tz` opsional |

Timestamp tanpa zona waktu diperlakukan sebagai UTC. Tambahkan `--tz America/New_York` untuk penjadwalan waktu dinding lokal.

Ekspresi berulang di awal jam otomatis disebar hingga 5 menit untuk mengurangi lonjakan beban. Gunakan `--exact` untuk memaksa waktu presisi atau `--stagger 30s` untuk jendela eksplisit.

### Day-of-month dan day-of-week menggunakan logika OR

Ekspresi Cron diurai oleh [croner](https://github.com/Hexagon/croner). Saat field day-of-month dan day-of-week sama-sama bukan wildcard, croner cocok ketika **salah satu** field cocok — bukan keduanya. Ini adalah perilaku cron Vixie standar.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Ini berjalan sekitar 5–6 kali per bulan, bukan 0–1 kali per bulan. OpenClaw menggunakan perilaku OR default Croner di sini. Untuk mewajibkan kedua kondisi, gunakan modifier day-of-week `+` milik Croner (`0 9 15 * +1`) atau jadwalkan pada satu field dan jaga field lainnya di prompt atau perintah tugas Anda.

## Gaya eksekusi

| Gaya           | Nilai `--session`   | Berjalan di              | Paling cocok untuk             |
| -------------- | ------------------- | ------------------------ | ------------------------------ |
| Sesi utama     | `main`              | Giliran heartbeat berikutnya | Pengingat, event sistem        |
| Terisolasi     | `isolated`          | `cron:<jobId>` khusus    | Laporan, pekerjaan latar belakang |
| Sesi saat ini  | `current`           | Diikat saat dibuat       | Pekerjaan berulang yang sadar konteks |
| Sesi kustom    | `session:custom-id` | Sesi bernama persisten   | Workflow yang dibangun di atas riwayat |

<AccordionGroup>
  <Accordion title="Sesi utama vs terisolasi vs kustom">
    Tugas **sesi utama** mengantrekan event sistem dan secara opsional membangunkan heartbeat (`--wake now` atau `--wake next-heartbeat`). Event sistem tersebut tidak memperpanjang kesegaran reset harian/idle untuk sesi target. Tugas **terisolasi** menjalankan giliran agent khusus dengan sesi baru. **Sesi kustom** (`session:xxx`) mempertahankan konteks lintas eksekusi, memungkinkan workflow seperti standup harian yang dibangun di atas ringkasan sebelumnya.
  </Accordion>
  <Accordion title="Arti 'sesi baru' untuk tugas terisolasi">
    Untuk tugas terisolasi, "sesi baru" berarti id transkrip/sesi baru untuk setiap eksekusi. OpenClaw dapat membawa preferensi aman seperti pengaturan thinking/fast/verbose, label, dan override model/auth yang dipilih pengguna secara eksplisit, tetapi tidak mewarisi konteks percakapan sekitar dari baris cron yang lebih lama: perutean channel/grup, kebijakan kirim atau antre, elevation, origin, atau binding runtime ACP. Gunakan `current` atau `session:<id>` saat tugas berulang sengaja harus dibangun di atas konteks percakapan yang sama.
  </Accordion>
  <Accordion title="Pembersihan runtime">
    Untuk tugas terisolasi, teardown runtime kini mencakup pembersihan browser sebaik mungkin untuk sesi cron tersebut. Kegagalan pembersihan diabaikan sehingga hasil cron sebenarnya tetap menang.

    Eksekusi cron terisolasi juga membuang instance runtime MCP bundel apa pun yang dibuat untuk tugas melalui jalur pembersihan runtime bersama. Ini sesuai dengan cara klien MCP sesi utama dan sesi kustom dibongkar, sehingga tugas cron terisolasi tidak membocorkan proses anak stdio atau koneksi MCP berumur panjang lintas eksekusi.

  </Accordion>
  <Accordion title="Pengiriman subagent dan Discord">
    Saat eksekusi cron terisolasi mengorkestrasi subagent, pengiriman juga lebih memilih output turunan akhir daripada teks sementara induk yang sudah usang. Jika turunan masih berjalan, OpenClaw menekan pembaruan parsial induk tersebut alih-alih mengumumkannya.

    Untuk target announce Discord hanya teks, OpenClaw mengirim teks assistant akhir kanonis satu kali alih-alih memutar ulang payload teks streamed/intermediate dan jawaban akhir. Payload media dan Discord terstruktur tetap dikirim sebagai payload terpisah sehingga lampiran dan komponen tidak terhapus.

  </Accordion>
</AccordionGroup>

### Opsi payload untuk tugas terisolasi

<ParamField path="--message" type="string" required>
  Teks prompt (wajib untuk terisolasi).
</ParamField>
<ParamField path="--model" type="string">
  Override model; menggunakan model yang diizinkan terpilih untuk tugas.
</ParamField>
<ParamField path="--thinking" type="string">
  Override tingkat thinking.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Lewati injeksi file bootstrap workspace.
</ParamField>
<ParamField path="--tools" type="string">
  Batasi alat yang dapat digunakan tugas, misalnya `--tools exec,read`.
</ParamField>

`--model` menggunakan model yang diizinkan terpilih sebagai model utama tugas tersebut. Ini tidak sama dengan override `/model` sesi chat: rantai fallback yang dikonfigurasi tetap berlaku saat model utama tugas gagal. Jika model yang diminta tidak diizinkan atau tidak dapat di-resolve, cron menggagalkan eksekusi dengan error validasi eksplisit alih-alih fallback diam-diam ke pilihan model agent/default tugas.

Tugas Cron juga dapat membawa `fallbacks` tingkat payload. Jika ada, daftar tersebut menggantikan rantai fallback yang dikonfigurasi untuk tugas. Gunakan `fallbacks: []` dalam payload/API tugas saat Anda menginginkan eksekusi cron ketat yang hanya mencoba model terpilih. Jika tugas memiliki `--model` tetapi tidak memiliki fallback payload maupun yang dikonfigurasi, OpenClaw meneruskan override fallback kosong eksplisit sehingga agent utama tidak ditambahkan sebagai target retry ekstra tersembunyi.

Prioritas pemilihan model untuk tugas terisolasi adalah:

1. Override model hook Gmail (saat eksekusi berasal dari Gmail dan override tersebut diizinkan)
2. `model` payload per tugas
3. Override model sesi cron tersimpan yang dipilih pengguna
4. Pilihan model agent/default

Mode cepat juga mengikuti pilihan live yang di-resolve. Jika konfigurasi model terpilih memiliki `params.fastMode`, cron terisolasi menggunakannya secara default. Override `fastMode` sesi tersimpan tetap menang atas konfigurasi di kedua arah.

Jika eksekusi terisolasi terkena handoff live model-switch, cron mencoba ulang dengan provider/model yang dialihkan dan menyimpan pilihan live tersebut untuk eksekusi aktif sebelum mencoba ulang. Saat pengalihan juga membawa profil auth baru, cron juga menyimpan override profil auth tersebut untuk eksekusi aktif. Retry dibatasi: setelah upaya awal plus 2 retry pengalihan, cron membatalkan alih-alih berputar selamanya.

Sebelum eksekusi cron terisolasi memasuki runner agent, OpenClaw memeriksa endpoint provider lokal yang dapat dijangkau untuk provider `api: "ollama"` dan `api: "openai-completions"` yang dikonfigurasi dengan `baseUrl` berupa loopback, jaringan privat, atau `.local`. Jika endpoint tersebut mati, eksekusi dicatat sebagai `skipped` dengan error provider/model yang jelas alih-alih memulai panggilan model. Hasil endpoint di-cache selama 5 menit, sehingga banyak tugas jatuh tempo yang menggunakan server Ollama, vLLM, SGLang, atau LM Studio lokal yang sama dan mati berbagi satu probe kecil alih-alih membuat badai permintaan. Eksekusi provider-preflight yang dilewati tidak menambah backoff error eksekusi; aktifkan `failureAlert.includeSkipped` saat Anda menginginkan notifikasi skip berulang.

## Pengiriman dan output

| Mode       | Yang terjadi                                                       |
| ---------- | ------------------------------------------------------------------ |
| `announce` | Mengirimkan teks akhir secara fallback ke target jika agent tidak mengirim |
| `webhook`  | POST payload event selesai ke URL                                  |
| `none`     | Tidak ada pengiriman fallback runner                               |

Gunakan `--announce --channel telegram --to "-1001234567890"` untuk pengiriman channel. Untuk topik forum Telegram, gunakan `-1001234567890:topic:123`; pemanggil RPC/konfigurasi langsung juga dapat meneruskan `delivery.threadId` sebagai string atau angka. Target Slack/Discord/Mattermost harus menggunakan prefiks eksplisit (`channel:<id>`, `user:<id>`). ID ruang Matrix peka huruf besar-kecil; gunakan ID ruang persisnya atau bentuk `room:!room:server` dari Matrix.

Ketika pengiriman announce menggunakan `channel: "last"` atau menghilangkan `channel`, target berprefiks penyedia seperti `telegram:123` dapat memilih channel sebelum cron kembali ke riwayat sesi atau satu channel terkonfigurasi. Hanya prefiks yang diumumkan oleh plugin yang dimuat yang menjadi pemilih penyedia. Jika `delivery.channel` eksplisit, prefiks target harus menamai penyedia yang sama; misalnya, `channel: "whatsapp"` dengan `to: "telegram:123"` ditolak alih-alih membiarkan WhatsApp menafsirkan ID Telegram sebagai nomor telepon. Prefiks jenis-target dan layanan seperti `channel:<id>`, `user:<id>`, `imessage:<handle>`, dan `sms:<number>` tetap menjadi sintaks target milik channel, bukan pemilih penyedia.

Untuk pekerjaan terisolasi, pengiriman chat dibagikan. Jika rute chat tersedia, agen dapat menggunakan alat `message` bahkan ketika pekerjaan menggunakan `--no-deliver`. Jika agen mengirim ke target yang dikonfigurasi/saat ini, OpenClaw melewati announce fallback. Jika tidak, `announce`, `webhook`, dan `none` hanya mengontrol apa yang dilakukan runner terhadap balasan akhir setelah giliran agen.

Ketika agen membuat pengingat terisolasi dari chat aktif, OpenClaw menyimpan target pengiriman live yang dipertahankan untuk rute announce fallback. Kunci sesi internal dapat berupa huruf kecil; target pengiriman penyedia tidak direkonstruksi dari kunci tersebut ketika konteks chat saat ini tersedia.

Pengiriman announce implisit menggunakan allowlist channel terkonfigurasi untuk memvalidasi dan merutekan ulang target lama. Persetujuan penyimpanan pasangan DM bukan penerima otomatisasi fallback; atur `delivery.to` atau konfigurasikan entri `allowFrom` channel ketika pekerjaan terjadwal harus mengirim secara proaktif ke DM.

Notifikasi kegagalan mengikuti jalur tujuan terpisah:

- `cron.failureDestination` menetapkan default global untuk notifikasi kegagalan.
- `job.delivery.failureDestination` menimpa itu per pekerjaan.
- Jika tidak ada yang diatur dan pekerjaan sudah mengirim melalui `announce`, notifikasi kegagalan kini kembali ke target announce utama tersebut.
- `delivery.failureDestination` hanya didukung pada pekerjaan `sessionTarget="isolated"` kecuali mode pengiriman utama adalah `webhook`.
- `failureAlert.includeSkipped: true` mengikutsertakan pekerjaan atau kebijakan peringatan cron global ke peringatan run yang dilewati berulang. Run yang dilewati mempertahankan penghitung lewati beruntun terpisah, sehingga tidak memengaruhi backoff kesalahan eksekusi.

## Contoh CLI

<Tabs>
  <Tab title="Pengingat satu kali">
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

- `Authorization: Bearer <token>` (disarankan)
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

    Bidang: `message` (wajib), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Hook yang dipetakan (POST /hooks/<name>)">
    Nama hook kustom diresolusikan melalui `hooks.mappings` dalam konfigurasi. Pemetaan dapat mentransformasikan payload arbitrer menjadi tindakan `wake` atau `agent` dengan templat atau transformasi kode.
  </Accordion>
</AccordionGroup>

<Warning>
Simpan endpoint hook di balik loopback, tailnet, atau reverse proxy tepercaya.

- Gunakan token hook khusus; jangan gunakan ulang token auth gateway.
- Simpan `hooks.path` pada subpath khusus; `/` ditolak.
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

### Penyiapan wizard (disarankan)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Ini menulis konfigurasi `hooks.gmail`, mengaktifkan preset Gmail, dan menggunakan Tailscale Funnel untuk endpoint push.

### Mulai otomatis Gateway

Ketika `hooks.enabled=true` dan `hooks.gmail.account` diatur, Gateway memulai `gog gmail watch serve` saat boot dan memperbarui watch secara otomatis. Atur `OPENCLAW_SKIP_GMAIL_WATCHER=1` untuk tidak ikut serta.

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
- Jika model diizinkan, penyedia/model persis itu mencapai run agen terisolasi.
- Jika tidak diizinkan atau tidak dapat diresolusikan, cron menggagalkan run dengan kesalahan validasi eksplisit.
- Rantai fallback terkonfigurasi tetap berlaku karena `--model` cron adalah primer pekerjaan, bukan override `/model` sesi.
- Payload `fallbacks` menggantikan fallback terkonfigurasi untuk pekerjaan tersebut; `fallbacks: []` menonaktifkan fallback dan membuat run ketat.
- `--model` biasa tanpa daftar fallback eksplisit atau terkonfigurasi tidak beralih ke primer agen sebagai target coba ulang tambahan senyap.

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

`maxConcurrentRuns` membatasi dispatch cron terjadwal dan eksekusi giliran agen terisolasi. Giliran agen cron terisolasi menggunakan lane eksekusi khusus `cron-nested` milik antrean secara internal, sehingga menaikkan nilai ini memungkinkan run LLM cron independen berjalan paralel alih-alih hanya memulai wrapper cron luarnya. Lane `nested` non-cron bersama tidak diperlebar oleh pengaturan ini.

Sidecar status runtime diturunkan dari `cron.store`: store `.json` seperti `~/clawd/cron/jobs.json` menggunakan `~/clawd/cron/jobs-state.json`, sementara path store tanpa akhiran `.json` menambahkan `-state.json`.

Jika Anda mengedit `jobs.json` secara manual, jangan masukkan `jobs-state.json` ke kontrol sumber. OpenClaw menggunakan sidecar itu untuk slot tertunda, penanda aktif, metadata run terakhir, dan identitas jadwal yang memberi tahu scheduler kapan pekerjaan yang diedit secara eksternal memerlukan `nextRunAtMs` baru.

Nonaktifkan cron: `cron.enabled: false` atau `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Perilaku coba ulang">
    **Coba ulang satu kali**: kesalahan sementara (batas laju, overload, jaringan, kesalahan server) dicoba ulang hingga 3 kali dengan backoff eksponensial. Kesalahan permanen langsung menonaktifkan.

    **Coba ulang berulang**: backoff eksponensial (30d hingga 60m) di antara coba ulang. Backoff direset setelah run sukses berikutnya.

  </Accordion>
  <Accordion title="Pemeliharaan">
    `cron.sessionRetention` (default `24h`) memangkas entri sesi-run terisolasi. `cron.runLog.maxBytes` / `cron.runLog.keepLines` memangkas otomatis file log-run.
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
    - Periksa `cron.enabled` dan env var `OPENCLAW_SKIP_CRON`.
    - Pastikan Gateway berjalan terus-menerus.
    - Untuk jadwal `cron`, verifikasi zona waktu (`--tz`) dibandingkan zona waktu host.
    - `reason: not-due` dalam output run berarti run manual diperiksa dengan `openclaw cron run <jobId> --due` dan pekerjaan belum jatuh tempo.

  </Accordion>
  <Accordion title="Cron aktif tetapi tidak ada pengiriman">
    - Mode pengiriman `none` berarti tidak ada pengiriman fallback runner yang diharapkan. Agen masih dapat mengirim langsung dengan alat `message` ketika rute chat tersedia.
    - Target pengiriman hilang/tidak valid (`channel`/`to`) berarti outbound dilewati.
    - Untuk Matrix, job yang disalin atau lama dengan ID ruang `delivery.to` dalam huruf kecil dapat gagal karena ID ruang Matrix peka huruf besar/kecil. Edit job ke nilai `!room:server` atau `room:!room:server` yang persis dari Matrix.
    - Kesalahan autentikasi channel (`unauthorized`, `Forbidden`) berarti pengiriman diblokir oleh kredensial.
    - Jika proses terisolasi hanya mengembalikan token diam (`NO_REPLY` / `no_reply`), OpenClaw menekan pengiriman outbound langsung dan juga menekan jalur ringkasan fallback yang diantrekan, sehingga tidak ada yang dikirim kembali ke chat.
    - Jika agen harus mengirim pesan kepada pengguna sendiri, periksa bahwa job memiliki rute yang dapat digunakan (`channel: "last"` dengan chat sebelumnya, atau channel/target eksplisit).

  </Accordion>
  <Accordion title="Cron atau Heartbeat tampaknya mencegah rollover /new-style">
    - Kesegaran reset harian dan idle tidak didasarkan pada `updatedAt`; lihat [Manajemen sesi](/id/concepts/session#session-lifecycle).
    - Wakeup Cron, eksekusi Heartbeat, notifikasi exec, dan pembukuan Gateway dapat memperbarui baris sesi untuk routing/status, tetapi tidak memperpanjang `sessionStartedAt` atau `lastInteractionAt`.
    - Untuk baris lama yang dibuat sebelum field tersebut ada, OpenClaw dapat memulihkan `sessionStartedAt` dari header sesi JSONL transkrip ketika file masih tersedia. Baris idle lama tanpa `lastInteractionAt` menggunakan waktu mulai yang dipulihkan tersebut sebagai baseline idle.

  </Accordion>
  <Accordion title="Hal yang perlu diperhatikan terkait zona waktu">
    - Cron tanpa `--tz` menggunakan zona waktu host Gateway.
    - Jadwal `at` tanpa zona waktu diperlakukan sebagai UTC.
    - `activeHours` Heartbeat menggunakan resolusi zona waktu yang dikonfigurasi.

  </Accordion>
</AccordionGroup>

## Terkait

- [Automasi & Tugas](/id/automation) — semua mekanisme automasi sekilas
- [Tugas Latar Belakang](/id/automation/tasks) — ledger tugas untuk eksekusi cron
- [Heartbeat](/id/gateway/heartbeat) — giliran sesi utama berkala
- [Zona waktu](/id/concepts/timezone) — konfigurasi zona waktu
