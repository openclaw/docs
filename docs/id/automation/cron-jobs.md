---
read_when:
    - Menjadwalkan pekerjaan latar belakang atau wakeup
    - Menghubungkan pemicu eksternal (Webhook, Gmail) ke OpenClaw
    - Menentukan antara Heartbeat dan Cron untuk tugas terjadwal
summary: Pekerjaan terjadwal, Webhook, dan pemicu Gmail PubSub untuk penjadwal Gateway
title: Tugas terjadwal
x-i18n:
    generated_at: "2026-04-24T08:57:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: a165c7d2c51ebd5625656690458a96b04b498de29ecadcefc65864cbc2c1b84b
    source_path: automation/cron-jobs.md
    workflow: 15
---

# Tugas Terjadwal (Cron)

Cron adalah penjadwal bawaan Gateway. Ini menyimpan job, membangunkan agen pada waktu yang tepat, dan dapat mengirimkan output kembali ke saluran chat atau endpoint Webhook.

## Mulai cepat

```bash
# Tambahkan pengingat sekali jalan
openclaw cron add \
  --name "Reminder" \
  --at "2026-02-01T16:00:00Z" \
  --session main \
  --system-event "Reminder: check the cron docs draft" \
  --wake now \
  --delete-after-run

# Periksa job Anda
openclaw cron list
openclaw cron show <job-id>

# Lihat riwayat eksekusi
openclaw cron runs --id <job-id>
```

## Cara kerja cron

- Cron berjalan **di dalam** proses Gateway (bukan di dalam model).
- Definisi job disimpan di `~/.openclaw/cron/jobs.json` sehingga restart tidak menghilangkan jadwal.
- Status eksekusi runtime disimpan di sebelahnya dalam `~/.openclaw/cron/jobs-state.json`. Jika Anda melacak definisi cron di git, lacak `jobs.json` dan gitignore `jobs-state.json`.
- Setelah pemisahan ini, versi OpenClaw yang lebih lama dapat membaca `jobs.json` tetapi mungkin menganggap job sebagai baru karena field runtime sekarang berada di `jobs-state.json`.
- Semua eksekusi cron membuat catatan [tugas latar belakang](/id/automation/tasks).
- Job sekali jalan (`--at`) otomatis dihapus setelah berhasil secara default.
- Eksekusi cron terisolasi sebisa mungkin menutup tab/proses browser yang dilacak untuk sesi `cron:<jobId>` mereka saat eksekusi selesai, sehingga otomatisasi browser yang terlepas tidak meninggalkan proses yatim.
- Eksekusi cron terisolasi juga melindungi dari balasan konfirmasi yang usang. Jika hasil pertama hanya berupa pembaruan status sementara (`on it`, `pulling everything together`, dan petunjuk serupa) dan belum ada eksekusi subagen turunan yang masih bertanggung jawab atas jawaban akhir, OpenClaw akan melakukan prompt ulang sekali untuk hasil sebenarnya sebelum pengiriman.

<a id="maintenance"></a>

Rekonsiliasi tugas untuk cron dimiliki oleh runtime: tugas cron aktif tetap hidup selama runtime cron masih melacak job itu sebagai sedang berjalan, bahkan jika baris sesi anak lama masih ada.
Setelah runtime tidak lagi memiliki job tersebut dan jendela tenggang 5 menit berakhir, pemeliharaan dapat menandai tugas sebagai `lost`.

## Jenis jadwal

| Jenis   | Flag CLI  | Deskripsi                                              |
| ------- | --------- | ------------------------------------------------------ |
| `at`    | `--at`    | Stempel waktu sekali jalan (ISO 8601 atau relatif seperti `20m`) |
| `every` | `--every` | Interval tetap                                         |
| `cron`  | `--cron`  | Ekspresi cron 5-field atau 6-field dengan `--tz` opsional |

Stempel waktu tanpa zona waktu diperlakukan sebagai UTC. Tambahkan `--tz America/New_York` untuk penjadwalan wall-clock lokal.

Ekspresi berulang tepat di awal jam secara otomatis di-stagger hingga 5 menit untuk mengurangi lonjakan beban. Gunakan `--exact` untuk memaksakan waktu yang presisi atau `--stagger 30s` untuk jendela eksplisit.

### Day-of-month dan day-of-week menggunakan logika OR

Ekspresi cron di-parse oleh [croner](https://github.com/Hexagon/croner). Ketika field day-of-month dan day-of-week keduanya bukan wildcard, croner akan cocok ketika **salah satu** field cocok — bukan keduanya. Ini adalah perilaku standar Vixie cron.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Ini akan berjalan ~5–6 kali per bulan, bukan 0–1 kali per bulan. OpenClaw menggunakan perilaku OR default Croner di sini. Untuk mensyaratkan kedua kondisi, gunakan modifier day-of-week `+` dari Croner (`0 9 15 * +1`) atau jadwalkan pada satu field dan lindungi field lainnya di prompt atau perintah job Anda.

## Gaya eksekusi

| Gaya            | nilai `--session`   | Berjalan di               | Paling cocok untuk              |
| --------------- | ------------------- | ------------------------- | ------------------------------- |
| Sesi utama      | `main`              | Giliran Heartbeat berikutnya | Pengingat, system event      |
| Terisolasi      | `isolated`          | `cron:<jobId>` khusus     | Laporan, pekerjaan latar belakang |
| Sesi saat ini   | `current`           | Terikat saat dibuat       | Pekerjaan berulang yang sadar konteks |
| Sesi kustom     | `session:custom-id` | Sesi bernama persisten    | Alur kerja yang dibangun dari riwayat |

Job **sesi utama** mengantrekan system event dan secara opsional membangunkan heartbeat (`--wake now` atau `--wake next-heartbeat`). Job **terisolasi** menjalankan giliran agen khusus dengan sesi baru. **Sesi kustom** (`session:xxx`) mempertahankan konteks antar eksekusi, memungkinkan alur kerja seperti standup harian yang dibangun dari ringkasan sebelumnya.

Untuk job terisolasi, teardown runtime sekarang mencakup pembersihan browser secara best-effort untuk sesi cron tersebut. Kegagalan pembersihan diabaikan agar hasil cron yang sebenarnya tetap diutamakan.

Eksekusi cron terisolasi juga membuang instance runtime MCP bawaan apa pun yang dibuat untuk job melalui jalur pembersihan runtime bersama. Ini sesuai dengan cara klien MCP sesi utama dan sesi kustom ditutup, sehingga job cron terisolasi tidak membocorkan proses anak stdio atau koneksi MCP jangka panjang antar eksekusi.

Ketika eksekusi cron terisolasi mengorkestrasi subagen, pengiriman juga lebih mengutamakan output turunan final daripada teks sementara induk yang usang. Jika turunan masih berjalan, OpenClaw menekan pembaruan induk parsial tersebut alih-alih mengumumkannya.

### Opsi payload untuk job terisolasi

- `--message`: teks prompt (wajib untuk terisolasi)
- `--model` / `--thinking`: override model dan tingkat thinking
- `--light-context`: lewati injeksi file bootstrap workspace
- `--tools exec,read`: batasi alat yang dapat digunakan job

`--model` menggunakan model yang diizinkan dan dipilih untuk job tersebut. Jika model yang diminta tidak diizinkan, cron mencatat peringatan dan kembali ke pemilihan model agen/default job tersebut. Rantai fallback yang dikonfigurasi tetap berlaku, tetapi override model biasa tanpa daftar fallback per-job yang eksplisit tidak lagi menambahkan primary agen sebagai target retry tambahan tersembunyi.

Prioritas pemilihan model untuk job terisolasi adalah:

1. Override model hook Gmail (ketika eksekusi berasal dari Gmail dan override itu diizinkan)
2. `model` payload per-job
3. Override model sesi cron yang disimpan
4. Pemilihan model agen/default

Mode cepat juga mengikuti pilihan live yang telah diselesaikan. Jika konfigurasi model yang dipilih memiliki `params.fastMode`, cron terisolasi menggunakan itu secara default. Override `fastMode` sesi yang disimpan tetap menang atas konfigurasi di kedua arah.

Jika eksekusi terisolasi mengalami handoff pergantian model live, cron mencoba lagi dengan provider/model yang telah diganti dan menyimpan pilihan live tersebut sebelum mencoba ulang. Ketika pergantian juga membawa auth profile baru, cron juga menyimpan override auth profile itu. Retry dibatasi: setelah percobaan awal ditambah 2 retry pergantian, cron membatalkan alih-alih berputar tanpa akhir.

## Pengiriman dan output

| Mode       | Yang terjadi                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Kirim final text secara fallback ke target jika agen tidak mengirim |
| `webhook`  | POST payload peristiwa selesai ke URL                               |
| `none`     | Tidak ada pengiriman fallback runner                                |

Gunakan `--announce --channel telegram --to "-1001234567890"` untuk pengiriman ke saluran. Untuk topik forum Telegram, gunakan `-1001234567890:topic:123`. Target Slack/Discord/Mattermost harus menggunakan prefiks eksplisit (`channel:<id>`, `user:<id>`).

Untuk job terisolasi, pengiriman chat bersifat bersama. Jika rute chat tersedia, agen dapat menggunakan alat `message` bahkan ketika job menggunakan `--no-deliver`. Jika agen mengirim ke target yang dikonfigurasi/saat ini, OpenClaw melewati announce fallback. Jika tidak, `announce`, `webhook`, dan `none` hanya mengontrol apa yang dilakukan runner dengan balasan akhir setelah giliran agen.

Notifikasi kegagalan mengikuti jalur tujuan terpisah:

- `cron.failureDestination` menetapkan default global untuk notifikasi kegagalan.
- `job.delivery.failureDestination` menimpanya per job.
- Jika keduanya tidak disetel dan job sudah mengirim melalui `announce`, notifikasi kegagalan sekarang fallback ke target announce utama tersebut.
- `delivery.failureDestination` hanya didukung pada job `sessionTarget="isolated"` kecuali mode pengiriman utama adalah `webhook`.

## Contoh CLI

Pengingat sekali jalan (sesi utama):

```bash
openclaw cron add \
  --name "Calendar check" \
  --at "20m" \
  --session main \
  --system-event "Next heartbeat: check calendar." \
  --wake now
```

Job terisolasi berulang dengan pengiriman:

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

Job terisolasi dengan override model dan thinking:

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

## Webhook

Gateway dapat mengekspos endpoint HTTP Webhook untuk pemicu eksternal. Aktifkan dalam config:

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

### POST /hooks/wake

Mengantrekan system event untuk sesi utama:

```bash
curl -X POST http://127.0.0.1:18789/hooks/wake \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"text":"New email received","mode":"now"}'
```

- `text` (wajib): deskripsi peristiwa
- `mode` (opsional): `now` (default) atau `next-heartbeat`

### POST /hooks/agent

Jalankan giliran agen terisolasi:

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
```

Field: `message` (wajib), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`.

### Hook terpetakan (POST /hooks/\<name\>)

Nama hook kustom diselesaikan melalui `hooks.mappings` dalam config. Mapping dapat mentransformasi payload arbitrer menjadi aksi `wake` atau `agent` dengan template atau transformasi kode.

### Keamanan

- Simpan endpoint hook di balik loopback, tailnet, atau reverse proxy tepercaya.
- Gunakan token hook khusus; jangan gunakan ulang token autentikasi gateway.
- Simpan `hooks.path` pada subpath khusus; `/` ditolak.
- Setel `hooks.allowedAgentIds` untuk membatasi routing `agentId` eksplisit.
- Biarkan `hooks.allowRequestSessionKey=false` kecuali Anda memerlukan sesi yang dipilih pemanggil.
- Jika Anda mengaktifkan `hooks.allowRequestSessionKey`, setel juga `hooks.allowedSessionKeyPrefixes` untuk membatasi bentuk session key yang diizinkan.
- Payload hook dibungkus dengan batas keamanan secara default.

## Integrasi Gmail PubSub

Hubungkan pemicu kotak masuk Gmail ke OpenClaw melalui Google PubSub.

**Prasyarat**: CLI `gcloud`, `gog` (gogcli), hook OpenClaw diaktifkan, Tailscale untuk endpoint HTTPS publik.

### Penyiapan wizard (disarankan)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Ini menulis config `hooks.gmail`, mengaktifkan preset Gmail, dan menggunakan Tailscale Funnel untuk endpoint push.

### Gateway auto-start

Saat `hooks.enabled=true` dan `hooks.gmail.account` disetel, Gateway memulai `gog gmail watch serve` saat boot dan memperbarui watch secara otomatis. Setel `OPENCLAW_SKIP_GMAIL_WATCHER=1` untuk memilih keluar.

### Penyiapan manual satu kali

1. Pilih project GCP yang memiliki klien OAuth yang digunakan oleh `gog`:

```bash
gcloud auth login
gcloud config set project <project-id>
gcloud services enable gmail.googleapis.com pubsub.googleapis.com
```

2. Buat topik dan berikan akses push Gmail:

```bash
gcloud pubsub topics create gog-gmail-watch
gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
  --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
  --role=roles/pubsub.publisher
```

3. Mulai watch:

```bash
gog gmail watch start \
  --account openclaw@gmail.com \
  --label INBOX \
  --topic projects/<project-id>/topics/gog-gmail-watch
```

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

# Tampilkan satu job, termasuk rute pengiriman yang telah diselesaikan
openclaw cron show <jobId>

# Edit job
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Paksa jalankan job sekarang
openclaw cron run <jobId>

# Jalankan hanya jika sudah jatuh tempo
openclaw cron run <jobId> --due

# Lihat riwayat eksekusi
openclaw cron runs --id <jobId> --limit 50

# Hapus job
openclaw cron remove <jobId>

# Pemilihan agen (penyiapan multi-agen)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

Catatan override model:

- `openclaw cron add|edit --model ...` mengubah model yang dipilih untuk job.
- Jika model diizinkan, provider/model yang persis itu mencapai eksekusi agen terisolasi.
- Jika tidak diizinkan, cron memperingatkan dan fallback ke pemilihan model agen/default job.
- Rantai fallback yang dikonfigurasi tetap berlaku, tetapi override `--model` biasa tanpa daftar fallback per-job yang eksplisit tidak lagi meneruskan ke primary agen sebagai target retry tambahan diam-diam.

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

Sidecar status runtime diturunkan dari `cron.store`: penyimpanan `.json` seperti `~/clawd/cron/jobs.json` menggunakan `~/clawd/cron/jobs-state.json`, sedangkan path penyimpanan tanpa sufiks `.json` menambahkan `-state.json`.

Nonaktifkan cron: `cron.enabled: false` atau `OPENCLAW_SKIP_CRON=1`.

**Retry sekali jalan**: error sementara (rate limit, overload, network, server error) mencoba ulang hingga 3 kali dengan exponential backoff. Error permanen langsung menonaktifkan.

**Retry berulang**: exponential backoff (30 dtk hingga 60 mnt) di antara retry. Backoff di-reset setelah eksekusi sukses berikutnya.

**Pemeliharaan**: `cron.sessionRetention` (default `24h`) memangkas entri sesi-eksekusi terisolasi. `cron.runLog.maxBytes` / `cron.runLog.keepLines` memangkas otomatis file log eksekusi.

## Pemecahan masalah

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

### Cron tidak berjalan

- Periksa `cron.enabled` dan variabel env `OPENCLAW_SKIP_CRON`.
- Pastikan Gateway berjalan terus-menerus.
- Untuk jadwal `cron`, verifikasi zona waktu (`--tz`) vs zona waktu host.
- `reason: not-due` pada output eksekusi berarti eksekusi manual diperiksa dengan `openclaw cron run <jobId> --due` dan job belum jatuh tempo.

### Cron berjalan tetapi tidak ada pengiriman

- Mode pengiriman `none` berarti tidak ada pengiriman fallback runner yang diharapkan. Agen masih dapat mengirim langsung dengan alat `message` saat rute chat tersedia.
- Target pengiriman hilang/tidak valid (`channel`/`to`) berarti pengiriman keluar dilewati.
- Error autentikasi saluran (`unauthorized`, `Forbidden`) berarti pengiriman diblokir oleh kredensial.
- Jika eksekusi terisolasi hanya mengembalikan token senyap (`NO_REPLY` / `no_reply`), OpenClaw menekan pengiriman keluar langsung dan juga menekan jalur ringkasan antrean fallback, sehingga tidak ada apa pun yang diposting kembali ke chat.
- Jika agen seharusnya mengirim pesan ke pengguna sendiri, periksa bahwa job memiliki rute yang dapat digunakan (`channel: "last"` dengan chat sebelumnya, atau saluran/target eksplisit).

### Hal yang perlu diperhatikan terkait zona waktu

- Cron tanpa `--tz` menggunakan zona waktu host gateway.
- Jadwal `at` tanpa zona waktu diperlakukan sebagai UTC.
- `activeHours` Heartbeat menggunakan resolusi zona waktu yang dikonfigurasi.

## Terkait

- [Otomasi & Tugas](/id/automation) — semua mekanisme otomasi secara ringkas
- [Tugas Latar Belakang](/id/automation/tasks) — ledger tugas untuk eksekusi cron
- [Heartbeat](/id/gateway/heartbeat) — giliran sesi utama berkala
- [Zona Waktu](/id/concepts/timezone) — konfigurasi zona waktu
