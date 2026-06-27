---
read_when:
    - Menjadwalkan pekerjaan latar belakang atau bangun ulang
    - Menghubungkan pemicu eksternal (webhook, Gmail) ke OpenClaw
    - Menentukan antara Heartbeat dan Cron untuk tugas terjadwal
sidebarTitle: Scheduled tasks
summary: Pekerjaan terjadwal, webhook, dan pemicu Gmail PubSub untuk penjadwal Gateway
title: Tugas terjadwal
x-i18n:
    generated_at: "2026-06-27T17:08:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 97097c9809afea699caa0c60d2ab5b71cd3794f90d9e002d35d25e76ca40d63c
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron adalah penjadwal bawaan Gateway. Cron mempertahankan job, membangunkan agen pada waktu yang tepat, dan dapat mengirimkan output kembali ke saluran chat atau endpoint Webhook.

## Mulai cepat

<Steps>
  <Step title="Tambahkan pengingat sekali jalan">
    ```bash
    openclaw cron create "2026-02-01T16:00:00Z" \
      --name "Reminder" \
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
- Definisi job, state runtime, dan riwayat eksekusi dipertahankan di database state SQLite bersama milik OpenClaw sehingga jadwal tidak hilang saat restart.
- Saat upgrade, jalankan `openclaw doctor --fix` untuk mengimpor file lama `~/.openclaw/cron/jobs.json`, `jobs-state.json`, dan `runs/*.jsonl` ke SQLite dan mengganti namanya dengan sufiks `.migrated`. Baris job yang rusak dilewati dari runtime dan disalin ke `jobs-quarantine.json` untuk diperbaiki atau ditinjau nanti.
- `cron.store` masih menamai kunci store cron logis dan jalur impor doctor. Setelah impor, mengedit file JSON tersebut tidak lagi mengubah job cron aktif; gunakan `openclaw cron add|edit|remove` atau metode RPC cron Gateway sebagai gantinya.
- Semua eksekusi cron membuat catatan [tugas latar belakang](/id/automation/tasks).
- Saat Gateway dimulai, job giliran agen terisolasi yang terlambat dijadwalkan ulang di luar jendela koneksi saluran, bukan diputar ulang seketika, sehingga startup Discord/Telegram dan penyiapan perintah native tetap responsif setelah restart.
- Job sekali jalan (`--at`) otomatis dihapus setelah berhasil secara default.
- Eksekusi cron terisolasi berupaya sebaik mungkin menutup tab/proses browser terlacak untuk sesi `cron:<jobId>` miliknya saat eksekusi selesai, sehingga otomatisasi browser yang terlepas tidak meninggalkan proses yatim.
- Eksekusi cron terisolasi yang menerima izin pembersihan mandiri cron yang sempit masih dapat membaca status penjadwal, daftar job saat ini miliknya yang difilter sendiri, dan riwayat eksekusi job tersebut, sehingga pemeriksaan status/Heartbeat dapat memeriksa jadwalnya sendiri tanpa memperoleh akses mutasi cron yang lebih luas.
- Eksekusi cron terisolasi juga melindungi dari balasan acknowledgement yang usang. Jika hasil pertama hanya pembaruan status sementara (`on it`, `pulling everything together`, dan petunjuk serupa) dan tidak ada eksekusi subagen turunan yang masih bertanggung jawab atas jawaban akhir, OpenClaw meminta ulang sekali untuk hasil sebenarnya sebelum pengiriman.
- Eksekusi cron terisolasi menggunakan metadata penolakan eksekusi terstruktur dari eksekusi tertanam, termasuk pembungkus node-host `UNAVAILABLE` yang pesan error bersarangnya dimulai dengan `SYSTEM_RUN_DENIED` atau `INVALID_REQUEST`, sehingga perintah yang diblokir tidak dilaporkan sebagai eksekusi hijau sementara prosa asisten biasa tidak diperlakukan sebagai penolakan.
- Eksekusi cron terisolasi juga memperlakukan kegagalan agen tingkat eksekusi sebagai error job meskipun tidak ada payload balasan yang dihasilkan, sehingga kegagalan model/provider menambah penghitung error dan memicu notifikasi kegagalan alih-alih membersihkan job sebagai berhasil.
- Saat job giliran agen terisolasi mencapai `timeoutSeconds`, cron membatalkan eksekusi agen yang mendasarinya dan memberinya jendela pembersihan singkat. Jika eksekusi tidak selesai mengalir, pembersihan milik Gateway membersihkan paksa kepemilikan sesi eksekusi tersebut sebelum cron mencatat timeout, sehingga pekerjaan chat yang mengantre tidak tertinggal di belakang sesi pemrosesan yang usang.
- Jika giliran agen terisolasi macet sebelum runner dimulai atau sebelum panggilan model pertama, cron mencatat timeout khusus fase seperti `setup timed out before runner start` atau `stalled before first model call (last phase: context-engine)`. Watchdog ini mencakup provider tertanam dan provider berbasis CLI sebelum proses CLI eksternalnya benar-benar dimulai, dan dibatasi secara independen dari nilai `timeoutSeconds` yang panjang sehingga kegagalan cold-start/auth/konteks muncul cepat alih-alih menunggu seluruh anggaran job.
- Jika Anda menggunakan cron sistem atau penjadwal eksternal lain untuk menjalankan `openclaw agent`, bungkus dengan eskalasi hard-kill meskipun CLI menangani `SIGTERM`/`SIGINT`. Eksekusi berbasis Gateway meminta Gateway membatalkan eksekusi yang diterima; eksekusi fallback lokal dan tertanam menerima sinyal pembatalan yang sama. Untuk GNU `timeout`, pilih `timeout -k 60 600 openclaw agent ...` daripada `timeout 600 ...` biasa; nilai `-k` adalah penahan akhir supervisor jika proses tidak dapat selesai mengalir. Untuk unit systemd, pertahankan bentuk yang sama dengan menggunakan sinyal stop `SIGTERM` plus jendela tenggang seperti `TimeoutStopSec` sebelum kill terakhir. Jika retry menggunakan ulang `--run-id` sementara eksekusi Gateway asli masih aktif, duplikat dilaporkan sebagai sedang berjalan alih-alih memulai eksekusi kedua.

<a id="maintenance"></a>

<Note>
Rekonsiliasi tugas untuk cron pertama-tama dimiliki runtime, lalu didukung riwayat tahan lama: tugas cron aktif tetap hidup selama runtime cron masih melacak job tersebut sebagai berjalan, meskipun baris sesi anak lama masih ada. Setelah runtime berhenti memiliki job dan jendela tenggang 5 menit berakhir, pemeliharaan memeriksa log eksekusi yang dipertahankan dan state job untuk eksekusi `cron:<jobId>:<startedAt>` yang cocok. Jika riwayat tahan lama tersebut menunjukkan hasil terminal, ledger tugas difinalisasi darinya; jika tidak, pemeliharaan milik Gateway dapat menandai tugas sebagai `lost`. Audit CLI offline dapat memulihkan dari riwayat tahan lama, tetapi tidak memperlakukan set job aktif dalam prosesnya sendiri yang kosong sebagai bukti bahwa eksekusi cron milik Gateway telah hilang.
</Note>

## Jenis jadwal

| Jenis   | Flag CLI  | Deskripsi                                               |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | Timestamp sekali jalan (ISO 8601 atau relatif seperti `20m`) |
| `every` | `--every` | Interval tetap                                          |
| `cron`  | `--cron`  | Ekspresi cron 5-field atau 6-field dengan `--tz` opsional |

Timestamp tanpa zona waktu diperlakukan sebagai UTC. Tambahkan `--tz America/New_York` untuk penjadwalan waktu dinding lokal.

Ekspresi berulang pada awal jam secara otomatis disebar hingga 5 menit untuk mengurangi lonjakan beban. Gunakan `--exact` untuk memaksa waktu yang presisi atau `--stagger 30s` untuk jendela eksplisit.

### Day-of-month dan day-of-week menggunakan logika OR

Ekspresi Cron diuraikan oleh [croner](https://github.com/Hexagon/croner). Saat field day-of-month dan day-of-week sama-sama bukan wildcard, croner cocok ketika **salah satu** field cocok — bukan keduanya. Ini adalah perilaku cron Vixie standar.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Ini berjalan ~5–6 kali per bulan, bukan 0–1 kali per bulan. OpenClaw menggunakan perilaku OR default Croner di sini. Untuk mewajibkan kedua kondisi, gunakan modifier hari-dalam-minggu `+` milik Croner (`0 9 15 * +1`) atau jadwalkan pada satu field dan batasi field lainnya di prompt atau perintah job Anda.

## Gaya eksekusi

| Gaya            | Nilai `--session`   | Berjalan di             | Terbaik untuk                         |
| --------------- | ------------------- | ----------------------- | ------------------------------------- |
| Sesi utama      | `main`              | Jalur wake cron khusus  | Pengingat, event sistem               |
| Terisolasi      | `isolated`          | `cron:<jobId>` khusus   | Laporan, tugas latar belakang         |
| Sesi saat ini   | `current`           | Diikat saat pembuatan   | Pekerjaan berulang sadar konteks      |
| Sesi khusus     | `session:custom-id` | Sesi bernama persisten  | Workflow yang dibangun dari riwayat   |

<AccordionGroup>
  <Accordion title="Main session vs isolated vs custom">
    Job **sesi utama** memasukkan event sistem ke antrean pada jalur run milik cron dan secara opsional membangunkan Heartbeat (`--wake now` atau `--wake next-heartbeat`). Job ini dapat menggunakan konteks pengiriman terakhir dari sesi utama target untuk balasan, tetapi tidak menambahkan giliran cron rutin ke jalur chat manusia dan tidak memperpanjang kesegaran reset harian/idle untuk sesi target. Job **terisolasi** menjalankan giliran agen khusus dengan sesi baru. **Sesi khusus** (`session:xxx`) mempertahankan konteks lintas run, memungkinkan workflow seperti standup harian yang dibangun dari ringkasan sebelumnya.

    Event cron sesi utama adalah pengingat event sistem yang mandiri. Event ini tidak
    otomatis menyertakan instruksi "Read HEARTBEAT.md" dari prompt Heartbeat
    default. Jika pengingat berulang harus membaca `HEARTBEAT.md`, nyatakan
    hal itu secara eksplisit dalam teks event cron atau dalam instruksi agen
    itu sendiri.

  </Accordion>
  <Accordion title="What 'fresh session' means for isolated jobs">
    Untuk job terisolasi, "sesi baru" berarti id transkrip/sesi baru untuk setiap run. OpenClaw dapat membawa preferensi aman seperti pengaturan thinking/fast/verbose, label, dan override model/auth yang dipilih pengguna secara eksplisit, tetapi tidak mewarisi konteks percakapan sekitar dari baris cron lama: perutean channel/grup, kebijakan kirim atau antre, elevasi, asal, atau binding runtime ACP. Gunakan `current` atau `session:<id>` saat job berulang harus dengan sengaja dibangun dari konteks percakapan yang sama.
  </Accordion>
  <Accordion title="Runtime cleanup">
    Untuk job terisolasi, teardown runtime kini mencakup pembersihan browser best-effort untuk sesi cron tersebut. Kegagalan pembersihan diabaikan sehingga hasil cron aktual tetap menjadi penentu.

    Run cron terisolasi juga membuang instance runtime MCP bundled yang dibuat untuk job melalui jalur pembersihan runtime bersama. Ini sesuai dengan cara klien MCP sesi utama dan sesi khusus di-teardown, sehingga job cron terisolasi tidak membocorkan proses anak stdio atau koneksi MCP berumur panjang lintas run.

  </Accordion>
  <Accordion title="Subagent and Discord delivery">
    Saat run cron terisolasi mengorkestrasi subagen, pengiriman juga lebih memilih output turunan final daripada teks sementara induk yang basi. Jika turunan masih berjalan, OpenClaw menekan pembaruan induk parsial tersebut alih-alih mengumumkannya.

    Untuk target pengumuman Discord khusus teks, OpenClaw mengirim teks asisten final kanonis satu kali alih-alih memutar ulang payload teks streaming/sementara sekaligus jawaban final. Payload media dan Discord terstruktur tetap dikirim sebagai payload terpisah agar lampiran dan komponen tidak hilang.

  </Accordion>
</AccordionGroup>

### Payload perintah

Gunakan payload perintah untuk skrip deterministik yang harus berjalan di dalam scheduler Gateway tanpa memulai giliran agen terisolasi berbasis model. Job perintah dijalankan pada host Gateway, menangkap stdout/stderr, mencatat run dalam riwayat cron, dan menggunakan ulang mode pengiriman `announce`, `webhook`, dan `none` yang sama seperti job terisolasi.

<Note>
Command cron adalah permukaan otomasi Gateway operator-admin, bukan panggilan
`tools.exec` agen. Membuat, memperbarui, menghapus, atau menjalankan job cron
secara manual memerlukan `operator.admin`; run perintah terjadwal kemudian
dijalankan di dalam proses Gateway sebagai otomasi yang ditulis admin tersebut.
Kebijakan exec agen seperti `tools.exec.mode`, prompt persetujuan, dan allowlist
tool per agen mengatur tool exec yang terlihat model, bukan payload command cron.
</Note>

```bash
openclaw cron create "*/15 * * * *" \
  --name "Queue depth probe" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` menyimpan `argv: ["sh", "-lc", <shell>]`. Gunakan `--command-argv '["node","scripts/report.mjs"]'` saat Anda menginginkan eksekusi argv persis tanpa parsing shell. Field opsional `--command-env KEY=VALUE`, `--command-input`, `--timeout-seconds`, `--no-output-timeout-seconds`, dan `--output-max-bytes` mengontrol environment proses, stdin, dan batas output.

Jika stdout tidak kosong, teks tersebut adalah hasil yang dikirimkan. Jika stdout kosong dan stderr tidak kosong, stderr dikirimkan. Jika kedua stream ada, cron mengirimkan blok kecil `stdout:` / `stderr:`. Kode keluar nol mencatat run sebagai `ok`; keluar non-nol, sinyal, timeout, atau timeout tanpa output mencatat `error` dan dapat memicu peringatan kegagalan. Perintah yang hanya mencetak `NO_REPLY` menggunakan penekanan token senyap cron normal dan tidak memposting apa pun kembali ke chat.

### Opsi payload untuk job terisolasi

<ParamField path="--message" type="string" required>
  Teks prompt (wajib untuk terisolasi).
</ParamField>
<ParamField path="--model" type="string">
  Override model; menggunakan model yang diizinkan dan dipilih untuk job.
</ParamField>
<ParamField path="--fallbacks" type="string">
  Daftar model fallback per job, misalnya `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`. Teruskan `--fallbacks ""` untuk run ketat tanpa fallback.
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  Pada `cron edit`, menghapus override fallback per job sehingga job mengikuti prioritas fallback yang dikonfigurasi. Tidak dapat digabungkan dengan `--fallbacks`.
</ParamField>
<ParamField path="--clear-model" type="boolean">
  Pada `cron edit`, menghapus override model per job sehingga job mengikuti prioritas pemilihan model cron normal (override cron-session tersimpan jika ditetapkan, jika tidak model agen/default). Tidak dapat digabungkan dengan `--model`.
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

`--model` menggunakan model yang diizinkan dan dipilih sebagai model utama job tersebut. Ini tidak sama dengan override `/model` sesi chat: rantai fallback yang dikonfigurasi tetap berlaku saat model utama job gagal. Jika model yang diminta tidak diizinkan atau tidak dapat di-resolve, cron menggagalkan run dengan error validasi eksplisit alih-alih diam-diam fallback ke pemilihan model agen/default milik job.

Job Cron juga dapat membawa `fallbacks` level payload. Jika ada, daftar tersebut menggantikan rantai fallback yang dikonfigurasi untuk job. Gunakan `fallbacks: []` dalam payload/API job saat Anda menginginkan run cron ketat yang hanya mencoba model yang dipilih. Jika job memiliki `--model` tetapi tidak memiliki fallback payload maupun fallback yang dikonfigurasi, OpenClaw meneruskan override fallback kosong eksplisit sehingga model utama agen tidak ditambahkan sebagai target percobaan ulang ekstra tersembunyi.

Pemeriksaan preflight penyedia lokal menelusuri fallback yang dikonfigurasi sebelum menandai run cron sebagai `skipped`; `fallbacks: []` menjaga jalur preflight tersebut tetap ketat.

Prioritas pemilihan model untuk job terisolasi adalah:

1. Override model hook Gmail (saat run berasal dari Gmail dan override tersebut diizinkan)
2. `model` payload per job
3. Override model sesi cron tersimpan yang dipilih pengguna
4. Pemilihan model agen/default

Mode cepat juga mengikuti pilihan live yang di-resolve. Jika konfigurasi model yang dipilih memiliki `params.fastMode`, cron terisolasi menggunakannya secara default. Override `fastMode` sesi tersimpan tetap menang atas konfigurasi ke arah mana pun. Mode otomatis menggunakan cutoff `params.fastAutoOnSeconds` milik model yang dipilih jika ada, dengan default 60 detik.

Jika run terisolasi mencapai handoff pengalihan model live, cron mencoba ulang dengan penyedia/model yang dialihkan dan menyimpan pilihan live tersebut untuk run aktif sebelum mencoba ulang. Saat pengalihan juga membawa profil auth baru, cron juga menyimpan override profil auth tersebut untuk run aktif. Percobaan ulang dibatasi: setelah upaya awal ditambah 2 percobaan ulang pengalihan, cron membatalkan alih-alih berulang selamanya.

Sebelum run cron terisolasi masuk ke runner agen, OpenClaw memeriksa endpoint penyedia lokal yang dapat dijangkau untuk penyedia `api: "ollama"` dan `api: "openai-completions"` yang dikonfigurasi dengan `baseUrl` berupa loopback, jaringan privat, atau `.local`. Jika endpoint tersebut tidak aktif, run dicatat sebagai `skipped` dengan error penyedia/model yang jelas alih-alih memulai panggilan model. Hasil endpoint di-cache selama 5 menit, sehingga banyak job jatuh tempo yang menggunakan server Ollama, vLLM, SGLang, atau LM Studio lokal mati yang sama berbagi satu probe kecil alih-alih membuat badai permintaan. Run preflight penyedia yang dilewati tidak menambah backoff error eksekusi; aktifkan `failureAlert.includeSkipped` saat Anda menginginkan notifikasi skip berulang.

## Pengiriman dan output

| Mode       | Yang terjadi                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Mengirimkan teks akhir fallback ke target jika agen tidak mengirim |
| `webhook`  | POST payload peristiwa selesai ke URL                                |
| `none`     | Tidak ada pengiriman fallback runner                                         |

Gunakan `--announce --channel telegram --to "-1001234567890"` untuk pengiriman channel. Untuk topik forum Telegram, gunakan `-1001234567890:topic:123`; OpenClaw juga menerima shorthand milik Telegram `-1001234567890:123`. Pemanggil RPC/konfigurasi langsung dapat meneruskan `delivery.threadId` sebagai string atau angka. Target Slack/Discord/Mattermost harus menggunakan prefiks eksplisit (`channel:<id>`, `user:<id>`). ID room Matrix peka huruf besar/kecil; gunakan ID room yang tepat atau bentuk `room:!room:server` dari Matrix.

Saat pengiriman announce menggunakan `channel: "last"` atau menghilangkan `channel`, target berprefiks penyedia seperti `telegram:123` dapat memilih channel sebelum cron fallback ke riwayat sesi atau satu channel yang dikonfigurasi. Hanya prefiks yang diiklankan oleh plugin yang dimuat yang menjadi pemilih penyedia. Jika `delivery.channel` eksplisit, prefiks target harus menamai penyedia yang sama; misalnya, `channel: "whatsapp"` dengan `to: "telegram:123"` ditolak alih-alih membiarkan WhatsApp menafsirkan ID Telegram sebagai nomor telepon. Prefiks jenis target dan layanan seperti `channel:<id>`, `user:<id>`, `imessage:<handle>`, dan `sms:<number>` tetap menjadi sintaks target milik channel, bukan pemilih penyedia.

Untuk job terisolasi, pengiriman chat dibagikan. Jika rute chat tersedia, agen dapat menggunakan tool `message` bahkan saat job menggunakan `--no-deliver`. Jika agen mengirim ke target yang dikonfigurasi/saat ini, OpenClaw melewati announce fallback. Jika tidak, `announce`, `webhook`, dan `none` hanya mengontrol apa yang dilakukan runner dengan balasan akhir setelah giliran agen.

Saat agen membuat pengingat terisolasi dari chat aktif, OpenClaw menyimpan target pengiriman live yang dipertahankan untuk rute announce fallback. Kunci sesi internal dapat berupa huruf kecil; target pengiriman penyedia tidak direkonstruksi dari kunci tersebut saat konteks chat saat ini tersedia.

Pengiriman announce implisit menggunakan allowlist channel yang dikonfigurasi untuk memvalidasi dan merutekan ulang target usang. Persetujuan penyimpanan pasangan DM bukan penerima otomatisasi fallback; tetapkan `delivery.to` atau konfigurasi entri `allowFrom` channel saat job terjadwal harus mengirim secara proaktif ke DM.

## Bahasa output

Job Cron tidak menyimpulkan bahasa balasan dari channel, locale, atau pesan
sebelumnya. Masukkan aturan bahasa ke pesan atau template terjadwal:

```bash
openclaw cron edit <jobId> \
  --message "Summarize the updates. Respond in Chinese; keep URLs, code, and product names unchanged."
```

Untuk file template, pertahankan instruksi bahasa dalam prompt yang dirender dan
verifikasi placeholder seperti `{{language}}` sudah terisi sebelum job berjalan. Jika
output mencampur bahasa, buat aturan eksplisit, misalnya: "Use Chinese
for narrative text and keep technical terms in English."

Notifikasi kegagalan mengikuti jalur tujuan terpisah:

- `cron.failureDestination` menetapkan default global untuk notifikasi kegagalan.
- `job.delivery.failureDestination` menimpa itu per job.
- Jika keduanya tidak ditetapkan dan job sudah mengirim melalui `announce`, notifikasi kegagalan kini fallback ke target announce utama tersebut.
- `delivery.failureDestination` hanya didukung pada job `sessionTarget="isolated"` kecuali mode pengiriman utama adalah `webhook`.
- `failureAlert.includeSkipped: true` memasukkan job atau kebijakan peringatan cron global ke dalam peringatan run yang dilewati secara berulang. Run yang dilewati menyimpan penghitung skip beruntun terpisah, sehingga tidak memengaruhi backoff error eksekusi.

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
    openclaw cron create "0 7 * * *" \
      "Summarize overnight updates." \
      --name "Morning brief" \
      --tz "America/Los_Angeles" \
      --session isolated \
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
  <Tab title="Output Webhook">
    ```bash
    openclaw cron create "0 18 * * 1-5" \
      "Summarize today's deploys as JSON." \
      --name "Deploy digest" \
      --webhook "https://example.invalid/openclaw/cron"
    ```
  </Tab>
  <Tab title="Output perintah">
    ```bash
    openclaw cron create "*/15 * * * *" \
      --name "Queue depth probe" \
      --command "scripts/check-queue.sh" \
      --command-cwd "/srv/app" \
      --announce \
      --channel telegram \
      --to "-1001234567890"
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

    Field: `message` (wajib), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Hook yang dipetakan (POST /hooks/<name>)">
    Nama hook kustom di-resolve melalui `hooks.mappings` dalam konfigurasi. Pemetaan dapat mengubah payload arbitrer menjadi tindakan `wake` atau `agent` dengan template atau transformasi kode.
  </Accordion>
</AccordionGroup>

<Warning>
Pertahankan endpoint hook di belakang loopback, tailnet, atau reverse proxy tepercaya.

- Gunakan token hook khusus; jangan gunakan ulang token auth gateway.
- Pertahankan `hooks.path` pada subpath khusus; `/` ditolak.
- Tetapkan `hooks.allowedAgentIds` untuk membatasi agen efektif mana yang dapat ditargetkan hook, termasuk agen default saat `agentId` dihilangkan.
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

Ketika `hooks.enabled=true` dan `hooks.gmail.account` diatur, Gateway memulai `gog gmail watch serve` saat boot dan memperbarui watch secara otomatis. Atur `OPENCLAW_SKIP_GMAIL_WATCHER=1` untuk tidak ikut serta.

### Penyiapan manual satu kali

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
# Cantumkan semua pekerjaan
openclaw cron list

# Ambil satu pekerjaan tersimpan sebagai JSON
openclaw cron get <jobId>

# Tampilkan satu pekerjaan, termasuk rute pengiriman yang diselesaikan
openclaw cron show <jobId>

# Edit pekerjaan
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Paksa jalankan pekerjaan sekarang
openclaw cron run <jobId>

# Paksa jalankan pekerjaan sekarang dan tunggu status terminalnya
openclaw cron run <jobId> --wait --wait-timeout 10m --poll-interval 2s

# Jalankan hanya jika sudah waktunya
openclaw cron run <jobId> --due

# Lihat riwayat eksekusi
openclaw cron runs --id <jobId> --limit 50

# Lihat satu eksekusi persis
openclaw cron runs --id <jobId> --run-id <runId>

# Hapus pekerjaan
openclaw cron remove <jobId>

# Pemilihan agen (penyiapan multi-agen)
openclaw cron create "0 6 * * *" "Check ops queue" --name "Ops sweep" --session isolated --agent ops
openclaw cron edit <jobId> --clear-agent
```

`openclaw cron run <jobId>` kembali setelah mengantrekan eksekusi manual. Gunakan `--wait` untuk hook shutdown, skrip pemeliharaan, atau otomasi lain yang harus memblokir hingga eksekusi yang diantrekan selesai. Mode tunggu melakukan polling pada `runId` persis yang dikembalikan; mode ini keluar dengan `0` untuk status `ok` dan non-nol untuk `error`, `skipped`, atau timeout tunggu.

Alat `cron` agen mengembalikan ringkasan pekerjaan ringkas (`id`, `name`, `enabled`, `nextRunAtMs`, `scheduleKind`, `lastRunStatus`) dari `cron(action: "list")`; gunakan `cron(action: "get", jobId: "...")` untuk satu definisi pekerjaan lengkap. Pemanggil Gateway langsung dapat meneruskan `compact: true` ke `cron.list`; jika dihilangkan, respons lengkap yang ada dengan pratinjau pengiriman dipertahankan.

`openclaw cron create` adalah alias untuk `openclaw cron add`, dan pekerjaan baru dapat menggunakan jadwal posisional (`"0 9 * * 1"`, `"every 1h"`, `"20m"`, atau timestamp ISO) diikuti prompt agen posisional. Gunakan `--webhook <url>` pada `cron add|create` atau `cron edit` untuk mengirim POST payload eksekusi selesai ke endpoint HTTP. Pengiriman Webhook tidak dapat digabungkan dengan flag pengiriman chat seperti `--announce`, `--channel`, `--to`, `--thread-id`, atau `--account`. Pada `cron edit`, `--clear-channel`, `--clear-to`, `--clear-thread-id`, dan `--clear-account` menghapus masing-masing field routing tersebut secara individual (masing-masing ditolak bersama flag set yang cocok), yang berbeda dari `--no-deliver` yang menonaktifkan pengiriman fallback runner.

<Note>
Catatan override model:

- `openclaw cron add|edit --model ...` mengubah model yang dipilih pekerjaan.
- Jika model diizinkan, provider/model persis tersebut mencapai eksekusi agen terisolasi.
- Jika tidak diizinkan atau tidak dapat diselesaikan, cron menggagalkan eksekusi dengan error validasi eksplisit.
- Patch payload API `cron.update` dapat mengatur `model: null` untuk menghapus override model pekerjaan tersimpan.
- `openclaw cron edit <job-id> --clear-model` menghapus override tersebut dari CLI (efek yang sama seperti patch `model: null`) dan tidak dapat digabungkan dengan `--model`.
- Rantai fallback yang dikonfigurasi tetap berlaku karena `--model` cron adalah primer pekerjaan, bukan override `/model` sesi.
- `openclaw cron add|edit --fallbacks ...` mengatur payload `fallbacks`, mengganti fallback yang dikonfigurasi untuk pekerjaan tersebut; `--fallbacks ""` menonaktifkan fallback dan membuat eksekusi menjadi ketat. `openclaw cron edit <job-id> --clear-fallbacks` menghapus override per pekerjaan.
- `--model` biasa tanpa daftar fallback eksplisit atau terkonfigurasi tidak jatuh ke primer agen sebagai target percobaan ulang ekstra yang diam-diam.

</Note>

## Konfigurasi

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 8,
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

`maxConcurrentRuns` membatasi dispatch cron terjadwal dan eksekusi agent-turn terisolasi, dan default-nya 8. Turn agen cron terisolasi menggunakan lane eksekusi khusus antrean `cron-nested` secara internal, jadi menaikkan nilai ini memungkinkan eksekusi LLM cron independen berjalan paralel alih-alih hanya memulai wrapper cron luarnya. Lane `nested` non-cron bersama tidak diperlebar oleh pengaturan ini.

`cron.store` adalah kunci store logis dan jalur impor doctor legacy. Jalankan `openclaw doctor --fix` untuk mengimpor store JSON yang ada ke SQLite dan mengarsipkannya; perubahan cron mendatang harus melalui CLI atau API Gateway.

Nonaktifkan cron: `cron.enabled: false` atau `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Perilaku percobaan ulang">
    **Percobaan ulang one-shot**: error sementara (rate limit, overload, jaringan, error server) dicoba ulang hingga 3 kali dengan backoff eksponensial. Error permanen langsung menonaktifkan.

    **Percobaan ulang berulang**: backoff eksponensial (30 dtk hingga 60 mnt) di antara percobaan ulang. Backoff direset setelah eksekusi sukses berikutnya.

  </Accordion>
  <Accordion title="Pemeliharaan">
    `cron.sessionRetention` (default `24h`) memangkas entri sesi eksekusi terisolasi. `cron.runLog.keepLines` membatasi baris riwayat eksekusi SQLite yang dipertahankan per pekerjaan; `maxBytes` dipertahankan untuk kompatibilitas konfigurasi dengan log eksekusi lama berbasis file.
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
    - Periksa var env `cron.enabled` dan `OPENCLAW_SKIP_CRON`.
    - Konfirmasi Gateway berjalan terus-menerus.
    - Untuk jadwal `cron`, verifikasi zona waktu (`--tz`) dibandingkan zona waktu host.
    - `reason: not-due` dalam output eksekusi berarti eksekusi manual diperiksa dengan `openclaw cron run <jobId> --due` dan pekerjaan belum waktunya dijalankan.

  </Accordion>
  <Accordion title="Cron berjalan tetapi tidak ada pengiriman">
    - Mode pengiriman `none` berarti tidak ada kiriman fallback runner yang diharapkan. Agen masih dapat mengirim langsung dengan alat `message` saat rute chat tersedia.
    - Target pengiriman hilang/tidak valid (`channel`/`to`) berarti outbound dilewati.
    - Untuk Matrix, pekerjaan yang disalin atau legacy dengan ID ruang `delivery.to` berhuruf kecil dapat gagal karena ID ruang Matrix peka huruf besar-kecil. Edit pekerjaan ke nilai persis `!room:server` atau `room:!room:server` dari Matrix.
    - Error auth kanal (`unauthorized`, `Forbidden`) berarti pengiriman diblokir oleh kredensial.
    - Jika eksekusi terisolasi hanya mengembalikan token senyap (`NO_REPLY` / `no_reply`), OpenClaw menekan pengiriman outbound langsung dan juga menekan jalur ringkasan antrean fallback, jadi tidak ada yang diposting kembali ke chat.
    - Jika agen harus mengirim pesan ke pengguna sendiri, periksa bahwa pekerjaan memiliki rute yang dapat digunakan (`channel: "last"` dengan chat sebelumnya, atau kanal/target eksplisit).

  </Accordion>
  <Accordion title="Cron atau heartbeat tampaknya mencegah rollover /new-style">
    - Kesegaran reset harian dan idle tidak didasarkan pada `updatedAt`; lihat [Manajemen sesi](/id/concepts/session#session-lifecycle).
    - Wakeup Cron, eksekusi Heartbeat, notifikasi exec, dan pembukuan gateway dapat memperbarui baris sesi untuk routing/status, tetapi tidak memperpanjang `sessionStartedAt` atau `lastInteractionAt`.
    - Untuk baris legacy yang dibuat sebelum field tersebut ada, OpenClaw dapat memulihkan `sessionStartedAt` dari header sesi JSONL transkrip saat file masih tersedia. Baris idle legacy tanpa `lastInteractionAt` menggunakan waktu mulai yang dipulihkan itu sebagai baseline idle.

  </Accordion>
  <Accordion title="Hal yang perlu diperhatikan tentang zona waktu">
    - Cron tanpa `--tz` menggunakan zona waktu host gateway.
    - Jadwal `at` tanpa zona waktu diperlakukan sebagai UTC.
    - `activeHours` Heartbeat menggunakan resolusi zona waktu yang dikonfigurasi.

  </Accordion>
</AccordionGroup>

## Terkait

- [Otomasi](/id/automation) — semua mekanisme otomasi secara ringkas
- [Tugas Latar Belakang](/id/automation/tasks) — ledger tugas untuk eksekusi cron
- [Heartbeat](/id/gateway/heartbeat) — turn sesi utama berkala
- [Zona Waktu](/id/concepts/timezone) — konfigurasi zona waktu
