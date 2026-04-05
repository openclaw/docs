---
read_when:
    - Menjadwalkan pekerjaan latar belakang atau wakeup
    - Menghubungkan pemicu eksternal (webhook, Gmail) ke OpenClaw
    - Memutuskan antara heartbeat dan cron untuk tugas terjadwal
summary: Pekerjaan terjadwal, webhook, dan pemicu Gmail PubSub untuk scheduler Gateway
title: Tugas Terjadwal
x-i18n:
    generated_at: "2026-04-05T13:42:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 43b906914461aba9af327e7e8c22aa856f65802ec2da37ed0c4f872d229cfde6
    source_path: automation/cron-jobs.md
    workflow: 15
---

# Tugas Terjadwal (Cron)

Cron adalah scheduler bawaan Gateway. Ini menyimpan pekerjaan, membangunkan agen pada waktu yang tepat, dan dapat mengirimkan output kembali ke channel chat atau endpoint webhook.

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

# Periksa pekerjaan Anda
openclaw cron list

# Lihat riwayat eksekusi
openclaw cron runs --id <job-id>
```

## Cara kerja cron

- Cron berjalan **di dalam** proses Gateway (bukan di dalam model).
- Pekerjaan disimpan di `~/.openclaw/cron/jobs.json` sehingga restart tidak menghilangkan jadwal.
- Semua eksekusi cron membuat catatan [tugas latar belakang](/automation/tasks).
- Pekerjaan sekali jalan (`--at`) otomatis dihapus setelah berhasil secara default.
- Eksekusi cron terisolasi akan menutup tab/proses browser yang terlacak untuk sesi `cron:<jobId>` mereka secara best-effort saat eksekusi selesai, sehingga otomasi browser yang terlepas tidak meninggalkan proses yatim.
- Eksekusi cron terisolasi juga melindungi dari balasan pengakuan yang kedaluwarsa. Jika
  hasil pertama hanya berupa pembaruan status sementara (`on it`, `pulling everything
together`, dan petunjuk serupa) dan tidak ada eksekusi subagen turunan yang masih
  bertanggung jawab atas jawaban akhir, OpenClaw akan meminta ulang sekali untuk hasil yang sebenarnya
  sebelum pengiriman.

Rekonsiliasi tugas untuk cron dimiliki oleh runtime: tugas cron aktif tetap hidup selama
runtime cron masih melacak pekerjaan tersebut sebagai sedang berjalan, meskipun baris sesi anak lama masih ada.
Setelah runtime berhenti memiliki pekerjaan itu dan jendela tenggang 5 menit berakhir, maintenance dapat
menandai tugas sebagai `lost`.

## Jenis jadwal

| Jenis   | Flag CLI  | Deskripsi                                                     |
| ------- | --------- | ------------------------------------------------------------- |
| `at`    | `--at`    | Stempel waktu sekali jalan (ISO 8601 atau relatif seperti `20m`) |
| `every` | `--every` | Interval tetap                                                |
| `cron`  | `--cron`  | Ekspresi cron 5-field atau 6-field dengan `--tz` opsional    |

Stempel waktu tanpa zona waktu diperlakukan sebagai UTC. Tambahkan `--tz America/New_York` untuk penjadwalan waktu lokal.

Ekspresi rekuren tepat di awal jam otomatis di-stagger hingga 5 menit untuk mengurangi lonjakan beban. Gunakan `--exact` untuk memaksa waktu yang presisi atau `--stagger 30s` untuk jendela eksplisit.

## Gaya eksekusi

| Gaya            | Nilai `--session`   | Berjalan di               | Paling cocok untuk                |
| --------------- | ------------------- | ------------------------- | --------------------------------- |
| Sesi utama      | `main`              | Giliran heartbeat berikutnya | Pengingat, peristiwa sistem     |
| Terisolasi      | `isolated`          | `cron:<jobId>` khusus     | Laporan, pekerjaan latar belakang |
| Sesi saat ini   | `current`           | Terikat saat pembuatan    | Pekerjaan rekuren yang sadar konteks |
| Sesi kustom     | `session:custom-id` | Sesi bernama persisten    | Workflow yang dibangun di atas riwayat |

Pekerjaan **sesi utama** mengantrikan peristiwa sistem dan secara opsional membangunkan heartbeat (`--wake now` atau `--wake next-heartbeat`). Pekerjaan **terisolasi** menjalankan giliran agen khusus dengan sesi baru. **Sesi kustom** (`session:xxx`) mempertahankan konteks antar eksekusi, memungkinkan workflow seperti standup harian yang dibangun dari ringkasan sebelumnya.

Untuk pekerjaan terisolasi, teardown runtime sekarang mencakup pembersihan browser secara best-effort untuk sesi cron tersebut. Kegagalan pembersihan diabaikan sehingga hasil cron yang sebenarnya tetap menjadi prioritas.

Saat eksekusi cron terisolasi mengorkestrasi subagen, pengiriman juga lebih mengutamakan
output turunan akhir daripada teks sementara induk yang sudah kedaluwarsa. Jika turunan masih
berjalan, OpenClaw menekan pembaruan induk parsial tersebut alih-alih mengumumkannya.

### Opsi payload untuk pekerjaan terisolasi

- `--message`: teks prompt (wajib untuk terisolasi)
- `--model` / `--thinking`: override model dan tingkat pemikiran
- `--light-context`: lewati injeksi file bootstrap workspace
- `--tools exec,read`: batasi alat mana yang dapat digunakan pekerjaan

`--model` menggunakan model yang dipilih dan diizinkan untuk pekerjaan tersebut. Jika model yang diminta
tidak diizinkan, cron mencatat peringatan dan kembali ke pemilihan model agen/default
untuk pekerjaan itu. Rantai fallback yang dikonfigurasi tetap berlaku, tetapi override model biasa
tanpa daftar fallback per pekerjaan yang eksplisit tidak lagi menambahkan model utama agen sebagai target retry tambahan yang tersembunyi.

Urutan prioritas pemilihan model untuk pekerjaan terisolasi adalah:

1. Override model hook Gmail (saat eksekusi berasal dari Gmail dan override itu diizinkan)
2. `model` payload per pekerjaan
3. Override model sesi cron yang tersimpan
4. Pemilihan model agen/default

Mode cepat juga mengikuti pemilihan live yang telah diselesaikan. Jika konfigurasi model terpilih
memiliki `params.fastMode`, cron terisolasi akan menggunakannya secara default. Override `fastMode`
sesi yang tersimpan tetap lebih diutamakan daripada config dalam kedua arah.

Jika eksekusi terisolasi mencapai handoff perpindahan model live, cron akan mencoba ulang dengan
penyedia/model yang telah dialihkan dan menyimpan pemilihan live tersebut sebelum mencoba ulang. Saat
perpindahan itu juga membawa profil auth baru, cron juga menyimpan override profil auth
tersebut. Retry dibatasi: setelah percobaan awal ditambah 2 retry perpindahan
, cron akan membatalkan alih-alih berulang tanpa akhir.

## Pengiriman dan output

| Mode      | Yang terjadi                                               |
| --------- | ---------------------------------------------------------- |
| `announce` | Kirim ringkasan ke channel target (default untuk terisolasi) |
| `webhook` | POST payload peristiwa selesai ke URL                      |
| `none`    | Internal saja, tanpa pengiriman                            |

Gunakan `--announce --channel telegram --to "-1001234567890"` untuk pengiriman ke channel. Untuk topik forum Telegram, gunakan `-1001234567890:topic:123`. Target Slack/Discord/Mattermost harus menggunakan prefiks eksplisit (`channel:<id>`, `user:<id>`).

Untuk pekerjaan terisolasi yang dimiliki cron, runner memiliki jalur pengiriman akhir. Agen
diprompt untuk mengembalikan ringkasan teks biasa, lalu ringkasan itu dikirim
melalui `announce`, `webhook`, atau tetap internal untuk `none`. `--no-deliver`
tidak mengembalikan pengiriman ke agen; ini membuat eksekusi tetap internal.

Jika tugas asli secara eksplisit mengatakan untuk mengirim pesan ke penerima eksternal tertentu, agen
harus mencatat kepada siapa/ke mana pesan itu harus dikirim dalam outputnya alih-alih
mencoba mengirimkannya langsung.

Notifikasi kegagalan mengikuti jalur tujuan terpisah:

- `cron.failureDestination` menetapkan default global untuk notifikasi kegagalan.
- `job.delivery.failureDestination` menimpa itu per pekerjaan.
- Jika keduanya tidak disetel dan pekerjaan sudah mengirim melalui `announce`, notifikasi kegagalan kini akan fallback ke target announce utama tersebut.
- `delivery.failureDestination` hanya didukung pada pekerjaan `sessionTarget="isolated"` kecuali mode pengiriman utama adalah `webhook`.

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

Pekerjaan terisolasi rekuren dengan pengiriman:

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

Pekerjaan terisolasi dengan override model dan thinking:

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

Gateway dapat mengekspos endpoint webhook HTTP untuk pemicu eksternal. Aktifkan di config:

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

Antrikan peristiwa sistem untuk sesi utama:

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
  -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4-mini"}'
```

Field: `message` (wajib), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`.

### Hook yang dipetakan (POST /hooks/\<name\>)

Nama hook kustom diselesaikan melalui `hooks.mappings` di config. Mapping dapat mentransformasi payload arbitrer menjadi aksi `wake` atau `agent` dengan template atau transformasi kode.

### Keamanan

- Simpan endpoint hook di balik loopback, tailnet, atau reverse proxy tepercaya.
- Gunakan token hook khusus; jangan gunakan ulang token auth gateway.
- Simpan `hooks.path` pada subpath khusus; `/` ditolak.
- Set `hooks.allowedAgentIds` untuk membatasi routing `agentId` eksplisit.
- Biarkan `hooks.allowRequestSessionKey=false` kecuali Anda memerlukan sesi yang dipilih pemanggil.
- Jika Anda mengaktifkan `hooks.allowRequestSessionKey`, set juga `hooks.allowedSessionKeyPrefixes` untuk membatasi bentuk session key yang diizinkan.
- Payload hook dibungkus dengan batas keamanan secara default.

## Integrasi Gmail PubSub

Hubungkan pemicu inbox Gmail ke OpenClaw melalui Google PubSub.

**Prasyarat**: `gcloud` CLI, `gog` (gogcli), hook OpenClaw diaktifkan, Tailscale untuk endpoint HTTPS publik.

### Setup wizard (disarankan)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Ini menulis config `hooks.gmail`, mengaktifkan preset Gmail, dan menggunakan Tailscale Funnel untuk endpoint push.

### Gateway auto-start

Saat `hooks.enabled=true` dan `hooks.gmail.account` disetel, Gateway memulai `gog gmail watch serve` saat boot dan memperbarui watch secara otomatis. Set `OPENCLAW_SKIP_GMAIL_WATCHER=1` untuk menonaktifkannya.

### Setup manual sekali saja

1. Pilih project GCP yang memiliki klien OAuth yang digunakan oleh `gog`:

```bash
gcloud auth login
gcloud config set project <project-id>
gcloud services enable gmail.googleapis.com pubsub.googleapis.com
```

2. Buat topic dan berikan akses push Gmail:

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

## Mengelola pekerjaan

```bash
# Daftar semua pekerjaan
openclaw cron list

# Edit pekerjaan
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Paksa jalankan pekerjaan sekarang
openclaw cron run <jobId>

# Jalankan hanya jika sudah jatuh tempo
openclaw cron run <jobId> --due

# Lihat riwayat eksekusi
openclaw cron runs --id <jobId> --limit 50

# Hapus pekerjaan
openclaw cron remove <jobId>

# Pemilihan agen (setup multi-agen)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

Catatan override model:

- `openclaw cron add|edit --model ...` mengubah model yang dipilih untuk pekerjaan.
- Jika model diizinkan, penyedia/model yang tepat itu akan mencapai eksekusi agen terisolasi.
- Jika tidak diizinkan, cron memberi peringatan dan kembali ke pemilihan model agen/default pekerjaan tersebut.
- Rantai fallback yang dikonfigurasi tetap berlaku, tetapi override `--model` biasa
  tanpa daftar fallback per pekerjaan yang eksplisit tidak lagi diteruskan ke model utama agen
  sebagai target retry tambahan diam-diam.

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

Nonaktifkan cron: `cron.enabled: false` atau `OPENCLAW_SKIP_CRON=1`.

**Retry sekali jalan**: error sementara (rate limit, overload, network, server error) akan dicoba ulang hingga 3 kali dengan exponential backoff. Error permanen langsung dinonaktifkan.

**Retry rekuren**: exponential backoff (30 detik hingga 60 menit) di antara retry. Backoff direset setelah eksekusi berhasil berikutnya.

**Maintenance**: `cron.sessionRetention` (default `24h`) memangkas entri sesi eksekusi terisolasi. `cron.runLog.maxBytes` / `cron.runLog.keepLines` memangkas file log eksekusi secara otomatis.

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
- Untuk jadwal `cron`, verifikasi zona waktu (`--tz`) dibandingkan zona waktu host.
- `reason: not-due` di output eksekusi berarti eksekusi manual diperiksa dengan `openclaw cron run <jobId> --due` dan pekerjaan belum jatuh tempo.

### Cron berjalan tetapi tidak ada pengiriman

- Mode pengiriman `none` berarti tidak ada pesan eksternal yang diharapkan.
- Target pengiriman hilang/tidak valid (`channel`/`to`) berarti pengiriman keluar dilewati.
- Error auth channel (`unauthorized`, `Forbidden`) berarti pengiriman diblokir oleh kredensial.
- Jika eksekusi terisolasi hanya mengembalikan token senyap (`NO_REPLY` / `no_reply`),
  OpenClaw menekan pengiriman keluar langsung dan juga menekan jalur fallback
  ringkasan antrean, sehingga tidak ada yang diposting kembali ke chat.
- Untuk pekerjaan terisolasi yang dimiliki cron, jangan mengharapkan agen menggunakan message tool
  sebagai fallback. Runner memiliki pengiriman akhir; `--no-deliver` membuatnya
  tetap internal alih-alih mengizinkan pengiriman langsung.

### Jebakan zona waktu

- Cron tanpa `--tz` menggunakan zona waktu host gateway.
- Jadwal `at` tanpa zona waktu diperlakukan sebagai UTC.
- `activeHours` heartbeat menggunakan resolusi zona waktu yang dikonfigurasi.

## Terkait

- [Otomasi & Tugas](/automation) — semua mekanisme otomasi secara ringkas
- [Tugas Latar Belakang](/automation/tasks) — ledger tugas untuk eksekusi cron
- [Heartbeat](/gateway/heartbeat) — giliran sesi utama periodik
- [Zona Waktu](/concepts/timezone) — konfigurasi zona waktu
