---
read_when:
    - Menjadwalkan pekerjaan latar belakang atau wakeup
    - Menghubungkan pemicu eksternal (webhook, Gmail) ke OpenClaw
    - Memutuskan antara Heartbeat dan Cron untuk tugas terjadwal
sidebarTitle: Scheduled tasks
summary: Pekerjaan terjadwal, webhook, dan pemicu Gmail PubSub untuk scheduler Gateway
title: Tugas terjadwal
x-i18n:
    generated_at: "2026-04-26T11:22:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 41908a34ddec3359e414ff4fbca128cc30db53273ee96a6dd12026da950b95ec
    source_path: automation/cron-jobs.md
    workflow: 15
---

Cron adalah scheduler bawaan Gateway. Cron menyimpan job secara persisten, membangunkan agen pada waktu yang tepat, dan dapat mengirimkan output kembali ke kanal chat atau endpoint Webhook.

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
  <Step title="Lihat riwayat eksekusi">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## Cara kerja cron

- Cron berjalan **di dalam** proses Gateway (bukan di dalam model).
- Definisi job disimpan secara persisten di `~/.openclaw/cron/jobs.json` sehingga restart tidak menghilangkan jadwal.
- Status eksekusi runtime disimpan secara persisten di sampingnya dalam `~/.openclaw/cron/jobs-state.json`. Jika Anda melacak definisi cron di git, lacak `jobs.json` dan tambahkan `jobs-state.json` ke gitignore.
- Setelah pemisahan, versi OpenClaw yang lebih lama dapat membaca `jobs.json` tetapi mungkin memperlakukan job sebagai baru karena field runtime sekarang berada di `jobs-state.json`.
- Semua eksekusi cron membuat catatan [background task](/id/automation/tasks).
- Job sekali jalan (`--at`) akan otomatis dihapus setelah berhasil secara default.
- Eksekusi cron terisolasi akan, sebisa mungkin, menutup tab/proses browser yang dilacak untuk sesi `cron:<jobId>` mereka saat eksekusi selesai, sehingga otomasi browser yang dilepas tidak meninggalkan proses yatim.
- Eksekusi cron terisolasi juga melindungi dari balasan pengakuan yang basi. Jika hasil pertama hanya berupa pembaruan status sementara (`on it`, `pulling everything together`, dan petunjuk serupa) dan tidak ada eksekusi subagen turunan yang masih bertanggung jawab atas jawaban akhir, OpenClaw akan mem-prompt ulang sekali untuk hasil yang sebenarnya sebelum dikirimkan.

<a id="maintenance"></a>

<Note>
Rekonsiliasi tugas untuk cron dimiliki runtime terlebih dahulu, didukung riwayat tahan lama kedua: tugas cron yang aktif tetap berjalan selama runtime cron masih melacak job tersebut sebagai sedang berjalan, meskipun baris sesi anak lama masih ada. Setelah runtime berhenti memiliki job tersebut dan jendela grace 5 menit berakhir, pemeriksaan pemeliharaan memeriksa log eksekusi yang disimpan dan status job untuk eksekusi `cron:<jobId>:<startedAt>` yang cocok. Jika riwayat tahan lama itu menunjukkan hasil terminal, ledger tugas diselesaikan darinya; jika tidak, pemeliharaan milik Gateway dapat menandai tugas sebagai `lost`. Audit CLI offline dapat memulihkan dari riwayat tahan lama, tetapi tidak menganggap kumpulan job aktif in-process miliknya sendiri yang kosong sebagai bukti bahwa eksekusi cron milik Gateway telah hilang.
</Note>

## Jenis jadwal

| Jenis   | Flag CLI  | Deskripsi                                               |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | Timestamp sekali jalan (ISO 8601 atau relatif seperti `20m`) |
| `every` | `--every` | Interval tetap                                          |
| `cron`  | `--cron`  | Ekspresi cron 5-field atau 6-field dengan `--tz` opsional |

Timestamp tanpa zona waktu diperlakukan sebagai UTC. Tambahkan `--tz America/New_York` untuk penjadwalan waktu lokal berdasarkan jam dinding.

Ekspresi berulang tepat di awal jam akan secara otomatis di-stagger hingga 5 menit untuk mengurangi lonjakan beban. Gunakan `--exact` untuk memaksa waktu yang presisi atau `--stagger 30s` untuk jendela eksplisit.

### Gunakan logika OR untuk hari dalam bulan dan hari dalam minggu

Ekspresi cron diurai oleh [croner](https://github.com/Hexagon/croner). Ketika field hari dalam bulan dan hari dalam minggu keduanya bukan wildcard, croner akan cocok jika **salah satu** field cocok — bukan keduanya. Ini adalah perilaku cron Vixie standar.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Ini memicu ~5–6 kali per bulan alih-alih 0–1 kali per bulan. OpenClaw menggunakan perilaku OR default Croner di sini. Untuk mewajibkan kedua kondisi, gunakan modifier hari-dalam-minggu `+` milik Croner (`0 9 15 * +1`) atau jadwalkan pada satu field dan lindungi field lainnya dalam prompt atau perintah job Anda.

## Gaya eksekusi

| Gaya           | Nilai `--session`   | Berjalan di               | Paling cocok untuk              |
| -------------- | ------------------- | ------------------------- | ------------------------------- |
| Sesi utama     | `main`              | Giliran heartbeat berikutnya | Pengingat, system event      |
| Terisolasi     | `isolated`          | `cron:<jobId>` khusus     | Laporan, tugas latar belakang   |
| Sesi saat ini  | `current`           | Terikat saat pembuatan    | Pekerjaan berulang sadar konteks |
| Sesi kustom    | `session:custom-id` | Sesi bernama persisten    | Workflow yang dibangun di atas riwayat |

<AccordionGroup>
  <Accordion title="Sesi utama vs terisolasi vs kustom">
    Job **sesi utama** mengantrikan system event dan secara opsional membangunkan Heartbeat (`--wake now` atau `--wake next-heartbeat`). System event tersebut tidak memperpanjang kesegaran reset harian/idle untuk sesi target. Job **terisolasi** menjalankan giliran agen khusus dengan sesi baru. **Sesi kustom** (`session:xxx`) mempertahankan konteks antar eksekusi, memungkinkan workflow seperti standup harian yang dibangun dari ringkasan sebelumnya.
  </Accordion>
  <Accordion title="Apa arti 'sesi baru' untuk job terisolasi">
    Untuk job terisolasi, "sesi baru" berarti transcript/session id baru untuk setiap eksekusi. OpenClaw dapat membawa preferensi aman seperti pengaturan thinking/fast/verbose, label, dan override model/auth yang dipilih pengguna secara eksplisit, tetapi tidak mewarisi konteks percakapan sekitar dari baris cron yang lebih lama: routing kanal/grup, kebijakan kirim atau antrean, elevasi, origin, atau binding runtime ACP. Gunakan `current` atau `session:<id>` ketika job berulang memang seharusnya dibangun di atas konteks percakapan yang sama.
  </Accordion>
  <Accordion title="Pembersihan runtime">
    Untuk job terisolasi, teardown runtime sekarang mencakup pembersihan browser secara best-effort untuk sesi cron tersebut. Kegagalan pembersihan diabaikan sehingga hasil cron yang sebenarnya tetap menang.

    Eksekusi cron terisolasi juga membuang setiap instance runtime MCP bawaan yang dibuat untuk job melalui jalur pembersihan runtime bersama. Ini sesuai dengan cara klien MCP sesi utama dan sesi kustom dihentikan, sehingga job cron terisolasi tidak membocorkan proses anak stdio atau koneksi MCP jangka panjang antar eksekusi.

  </Accordion>
  <Accordion title="Pengiriman subagen dan Discord">
    Saat eksekusi cron terisolasi mengorkestrasi subagen, pengiriman juga memprioritaskan output turunan akhir dibanding teks sementara induk yang basi. Jika turunan masih berjalan, OpenClaw menekan pembaruan induk parsial tersebut alih-alih mengumumkannya.

    Untuk target pengumuman Discord khusus teks, OpenClaw mengirim teks asisten akhir kanonis satu kali alih-alih memutar ulang payload teks yang di-stream/intermediate dan jawaban akhir. Payload Discord media dan terstruktur tetap dikirim sebagai payload terpisah agar lampiran dan komponen tidak terbuang.

  </Accordion>
</AccordionGroup>

### Opsi payload untuk job terisolasi

<ParamField path="--message" type="string" required>
  Teks prompt (wajib untuk job terisolasi).
</ParamField>
<ParamField path="--model" type="string">
  Override model; menggunakan model yang dipilih dan diizinkan untuk job tersebut.
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

`--model` menggunakan model yang dipilih dan diizinkan untuk job tersebut. Jika model yang diminta tidak diizinkan, cron akan mencatat peringatan dan kembali ke pemilihan model agen/default milik job sebagai gantinya. Rantai fallback yang dikonfigurasi tetap berlaku, tetapi override model biasa tanpa daftar fallback per-job yang eksplisit tidak lagi menambahkan primary agen sebagai target percobaan ulang tambahan tersembunyi.

Prioritas pemilihan model untuk job terisolasi adalah:

1. Override model hook Gmail (ketika eksekusi berasal dari Gmail dan override tersebut diizinkan)
2. Payload `model` per job
3. Override model sesi cron tersimpan yang dipilih pengguna
4. Pemilihan model agen/default

Mode cepat juga mengikuti pilihan live yang telah diselesaikan. Jika konfigurasi model yang dipilih memiliki `params.fastMode`, cron terisolasi akan menggunakannya secara default. Override `fastMode` sesi yang tersimpan tetap menang atas konfigurasi di kedua arah.

Jika eksekusi terisolasi mengenai handoff pergantian model live, cron akan mencoba ulang dengan provider/model yang sudah dialihkan dan menyimpan pilihan live itu untuk eksekusi aktif sebelum mencoba ulang. Saat pergantian juga membawa profil auth baru, cron juga menyimpan override profil auth itu untuk eksekusi aktif. Percobaan ulang dibatasi: setelah percobaan awal ditambah 2 percobaan ulang karena pergantian, cron akan membatalkan alih-alih berulang tanpa henti.

## Pengiriman dan output

| Mode       | Yang terjadi                                                       |
| ---------- | ------------------------------------------------------------------ |
| `announce` | Kirim final text ke target sebagai fallback jika agen tidak mengirim |
| `webhook`  | POST payload peristiwa selesai ke URL                              |
| `none`     | Tidak ada pengiriman fallback oleh runner                          |

Gunakan `--announce --channel telegram --to "-1001234567890"` untuk pengiriman ke kanal. Untuk topik forum Telegram, gunakan `-1001234567890:topic:123`. Target Slack/Discord/Mattermost harus menggunakan prefix eksplisit (`channel:<id>`, `user:<id>`). ID room Matrix peka huruf besar-kecil; gunakan ID room yang tepat atau bentuk `room:!room:server` dari Matrix.

Untuk job terisolasi, pengiriman chat digunakan bersama. Jika rute chat tersedia, agen dapat menggunakan alat `message` bahkan saat job menggunakan `--no-deliver`. Jika agen mengirim ke target yang dikonfigurasi/saat ini, OpenClaw akan melewati fallback announce. Jika tidak, `announce`, `webhook`, dan `none` hanya mengontrol apa yang dilakukan runner terhadap balasan akhir setelah giliran agen.

Saat agen membuat pengingat terisolasi dari chat aktif, OpenClaw menyimpan target pengiriman live yang dipertahankan untuk rute fallback announce. Kunci sesi internal mungkin huruf kecil; target pengiriman provider tidak direkonstruksi dari kunci tersebut saat konteks chat saat ini tersedia.

Notifikasi kegagalan mengikuti jalur tujuan terpisah:

- `cron.failureDestination` menetapkan default global untuk notifikasi kegagalan.
- `job.delivery.failureDestination` menimpa itu per job.
- Jika keduanya tidak diatur dan job sudah mengirim melalui `announce`, notifikasi kegagalan sekarang akan fallback ke target announce utama tersebut.
- `delivery.failureDestination` hanya didukung pada job `sessionTarget="isolated"` kecuali mode pengiriman utama adalah `webhook`.

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

- `Authorization: Bearer <token>` (disarankan)
- `x-openclaw-token: <token>`

Token query-string ditolak.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    Mengantrikan system event untuk sesi utama:

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

    Field: `message` (wajib), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Hook yang dipetakan (POST /hooks/<name>)">
    Nama hook kustom diselesaikan melalui `hooks.mappings` di config. Mapping dapat mentransformasikan payload arbitrer menjadi aksi `wake` atau `agent` dengan template atau transformasi kode.
  </Accordion>
</AccordionGroup>

<Warning>
Simpan endpoint hook di balik loopback, tailnet, atau reverse proxy tepercaya.

- Gunakan token hook khusus; jangan gunakan ulang token auth gateway.
- Simpan `hooks.path` pada subpath khusus; `/` ditolak.
- Atur `hooks.allowedAgentIds` untuk membatasi routing `agentId` eksplisit.
- Pertahankan `hooks.allowRequestSessionKey=false` kecuali Anda memerlukan sesi yang dipilih pemanggil.
- Jika Anda mengaktifkan `hooks.allowRequestSessionKey`, atur juga `hooks.allowedSessionKeyPrefixes` untuk membatasi bentuk session key yang diizinkan.
- Payload hook dibungkus dengan batas keamanan secara default.

</Warning>

## Integrasi Gmail PubSub

Hubungkan pemicu inbox Gmail ke OpenClaw melalui Google PubSub.

<Note>
**Prasyarat:** CLI `gcloud`, `gog` (gogcli), hook OpenClaw diaktifkan, Tailscale untuk endpoint HTTPS publik.
</Note>

### Penyiapan wizard (disarankan)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Ini menulis config `hooks.gmail`, mengaktifkan preset Gmail, dan menggunakan Tailscale Funnel untuk endpoint push.

### Start otomatis Gateway

Saat `hooks.enabled=true` dan `hooks.gmail.account` diatur, Gateway memulai `gog gmail watch serve` saat boot dan memperbarui watch secara otomatis. Atur `OPENCLAW_SKIP_GMAIL_WATCHER=1` untuk menonaktifkannya.

### Penyiapan manual satu kali

<Steps>
  <Step title="Pilih project GCP">
    Pilih project GCP yang memiliki klien OAuth yang digunakan oleh `gog`:

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

<Note>
Catatan override model:

- `openclaw cron add|edit --model ...` mengubah model yang dipilih job.
- Jika model diizinkan, provider/model yang tepat itu akan diteruskan ke eksekusi agen terisolasi.
- Jika tidak diizinkan, cron memperingatkan dan kembali ke pemilihan model agen/default milik job.
- Rantai fallback yang dikonfigurasi tetap berlaku, tetapi override `--model` biasa tanpa daftar fallback per-job yang eksplisit tidak lagi diteruskan ke primary agen sebagai target percobaan ulang tambahan diam-diam.

</Note>

## Config

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

Sidecar status runtime diturunkan dari `cron.store`: store `.json` seperti `~/clawd/cron/jobs.json` menggunakan `~/clawd/cron/jobs-state.json`, sedangkan path store tanpa sufiks `.json` menambahkan `-state.json`.

Nonaktifkan cron: `cron.enabled: false` atau `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Perilaku percobaan ulang">
    **Percobaan ulang sekali jalan**: error sementara (batas laju, overload, jaringan, server error) akan dicoba ulang hingga 3 kali dengan exponential backoff. Error permanen akan langsung dinonaktifkan.

    **Percobaan ulang berulang**: exponential backoff (30d hingga 60m) di antara percobaan ulang. Backoff direset setelah eksekusi sukses berikutnya.

  </Accordion>
  <Accordion title="Pemeliharaan">
    `cron.sessionRetention` (default `24h`) memangkas entri run-session terisolasi. `cron.runLog.maxBytes` / `cron.runLog.keepLines` memangkas file run-log secara otomatis.
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
    - Untuk jadwal `cron`, verifikasi zona waktu (`--tz`) terhadap zona waktu host.
    - `reason: not-due` dalam output eksekusi berarti eksekusi manual diperiksa dengan `openclaw cron run <jobId> --due` dan job belum jatuh tempo.

  </Accordion>
  <Accordion title="Cron berjalan tetapi tidak ada pengiriman">
    - Mode pengiriman `none` berarti tidak ada pengiriman fallback runner yang diharapkan. Agen masih dapat mengirim langsung dengan alat `message` saat rute chat tersedia.
    - Target pengiriman hilang/tidak valid (`channel`/`to`) berarti outbound dilewati.
    - Untuk Matrix, job yang disalin atau lama dengan ID room `delivery.to` huruf kecil dapat gagal karena ID room Matrix peka huruf besar-kecil. Edit job ke nilai `!room:server` atau `room:!room:server` yang tepat dari Matrix.
    - Error auth kanal (`unauthorized`, `Forbidden`) berarti pengiriman diblokir oleh kredensial.
    - Jika eksekusi terisolasi hanya mengembalikan token senyap (`NO_REPLY` / `no_reply`), OpenClaw menekan pengiriman outbound langsung dan juga menekan jalur ringkasan antrean fallback, sehingga tidak ada yang diposting kembali ke chat.
    - Jika agen seharusnya mengirim pesan ke pengguna sendiri, periksa bahwa job memiliki rute yang dapat digunakan (`channel: "last"` dengan chat sebelumnya, atau channel/target eksplisit).

  </Accordion>
  <Accordion title="Cron atau heartbeat tampaknya mencegah rollover gaya /new">
    - Kesegaran reset harian dan idle tidak didasarkan pada `updatedAt`; lihat [Manajemen sesi](/id/concepts/session#session-lifecycle).
    - Wakeup cron, eksekusi heartbeat, notifikasi exec, dan pembukuan gateway dapat memperbarui baris sesi untuk routing/status, tetapi tidak memperpanjang `sessionStartedAt` atau `lastInteractionAt`.
    - Untuk baris lama yang dibuat sebelum field tersebut ada, OpenClaw dapat memulihkan `sessionStartedAt` dari header sesi transcript JSONL ketika file masih tersedia. Baris idle lama tanpa `lastInteractionAt` menggunakan waktu mulai yang dipulihkan itu sebagai baseline idle.

  </Accordion>
  <Accordion title="Hal-hal yang perlu diperhatikan terkait zona waktu">
    - Cron tanpa `--tz` menggunakan zona waktu host gateway.
    - Jadwal `at` tanpa zona waktu diperlakukan sebagai UTC.
    - Heartbeat `activeHours` menggunakan resolusi zona waktu yang dikonfigurasi.

  </Accordion>
</AccordionGroup>

## Terkait

- [Otomasi & Tugas](/id/automation) — semua mekanisme otomasi secara ringkas
- [Background Tasks](/id/automation/tasks) — ledger tugas untuk eksekusi cron
- [Heartbeat](/id/gateway/heartbeat) — giliran sesi utama berkala
- [Zona waktu](/id/concepts/timezone) — konfigurasi zona waktu
