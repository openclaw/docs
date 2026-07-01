---
read_when:
    - Anda menginginkan pekerjaan terjadwal dan wakeup
    - Anda sedang men-debug eksekusi cron dan log
summary: Referensi CLI untuk `openclaw cron` (menjadwalkan dan menjalankan pekerjaan latar belakang)
title: Cron
x-i18n:
    generated_at: "2026-07-01T08:30:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aed39843e183b3d441908ad4ac0578d44b6f0d482905871efc3421fd9820a1cc
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Kelola pekerjaan Cron untuk penjadwal Gateway.

<Tip>
Jalankan `openclaw cron --help` untuk permukaan perintah lengkap. Lihat [Pekerjaan Cron](/id/automation/cron-jobs) untuk panduan konseptual.
</Tip>

## Buat pekerjaan dengan cepat

`openclaw cron create` adalah alias untuk `openclaw cron add`. Untuk pekerjaan baru, letakkan jadwal terlebih dahulu dan prompt kedua:

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Morning brief" \
  --agent ops
```

Gunakan `--webhook <url>` ketika pekerjaan harus melakukan POST payload selesai, bukan mengirimkannya ke target chat:

```bash
openclaw cron create "0 18 * * 1-5" \
  "Summarize today's deploys as JSON." \
  --name "Deploy digest" \
  --webhook "https://example.invalid/openclaw/cron"
```

Gunakan `--command` untuk pekerjaan bergaya shell deterministik yang harus berjalan di dalam OpenClaw cron tanpa memulai eksekusi agen/model terisolasi:

<Note>
Pekerjaan Cron perintah adalah otomatisasi Gateway yang ditulis admin. Membuat, mengedit,
menghapus, atau menjalankannya secara manual memerlukan `operator.admin`; eksekusi terjadwal
nantinya berjalan dalam proses Gateway, bukan sebagai pemanggilan alat `tools.exec` agen.
`tools.exec.*` dan persetujuan exec tetap mengatur alat exec yang terlihat oleh model.
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

`--command <shell>` menyimpan `argv: ["sh", "-lc", <shell>]`. Gunakan `--command-argv '["node","scripts/report.mjs"]'` untuk eksekusi argv persis. Pekerjaan perintah menangkap stdout/stderr, mencatat riwayat Cron normal, dan merutekan output melalui mode pengiriman `announce`, `webhook`, atau `none` yang sama seperti pekerjaan terisolasi. Perintah yang hanya mencetak `NO_REPLY` akan disembunyikan.

## Sesi

`--session` menerima `main`, `isolated`, `current`, atau `session:<id>`.

<AccordionGroup>
  <Accordion title="Kunci sesi">
    - `main` mengikat ke sesi utama agen.
    - `isolated` membuat transkrip baru dan ID sesi baru untuk setiap eksekusi.
    - `current` mengikat ke sesi aktif pada waktu pembuatan.
    - `session:<id>` menyematkan ke kunci sesi persisten eksplisit.

  </Accordion>
  <Accordion title="Semantik sesi terisolasi">
    Eksekusi terisolasi mengatur ulang konteks percakapan sekitar. Perutean kanal dan grup, kebijakan kirim/antre, elevasi, asal, dan pengikatan runtime ACP diatur ulang untuk eksekusi baru. Preferensi aman dan penggantian model atau autentikasi yang dipilih pengguna secara eksplisit dapat dibawa lintas eksekusi.
  </Accordion>
</AccordionGroup>

## Pengiriman

`openclaw cron list` dan `openclaw cron show <job-id>` mempratinjau rute pengiriman yang diselesaikan. Untuk `channel: "last"`, pratinjau menunjukkan apakah rute diselesaikan dari sesi utama atau sesi saat ini, atau akan gagal tertutup.

Target berprefiks penyedia dapat memperjelas kanal announce yang belum terselesaikan. Misalnya, `to: "telegram:123"` memilih Telegram ketika `delivery.channel` dihilangkan atau `last`. Hanya prefiks yang diiklankan oleh Plugin yang dimuat yang menjadi pemilih penyedia. Jika `delivery.channel` eksplisit, prefiks harus cocok dengan kanal tersebut; `channel: "whatsapp"` dengan `to: "telegram:123"` akan ditolak. Prefiks layanan seperti `imessage:` dan `sms:` tetap menjadi sintaks target milik kanal.

<Note>
Pekerjaan `cron add` terisolasi menggunakan pengiriman `--announce` secara default. Gunakan `--no-deliver` untuk menjaga output tetap internal. `--deliver` tetap ada sebagai alias usang untuk `--announce`.
</Note>

### Kepemilikan pengiriman

Pengiriman chat Cron terisolasi dibagi antara agen dan runner:

- Agen dapat mengirim langsung menggunakan alat `message` ketika rute chat tersedia.
- `announce` mengirim fallback balasan akhir hanya ketika agen tidak mengirim langsung ke target yang diselesaikan.
- `webhook` memposting payload selesai ke URL.
- `none` menonaktifkan pengiriman fallback runner.

Gunakan `cron add|create --webhook <url>` atau `cron edit <job-id> --webhook <url>` untuk mengatur pengiriman Webhook. Jangan gabungkan `--webhook` dengan flag pengiriman chat seperti `--announce`, `--no-deliver`, `--channel`, `--to`, `--thread-id`, atau `--account`.

`cron edit <job-id>` dapat menghapus pengaturan field perutean pengiriman individual dengan `--clear-channel`, `--clear-to`, `--clear-thread-id`, dan `--clear-account` (masing-masing ditolak ketika digabungkan dengan flag set yang cocok). Tidak seperti `--no-deliver`, yang hanya menonaktifkan pengiriman fallback runner, ini menghapus field tersimpan sehingga pekerjaan menyelesaikan bagian rute tersebut dari default lagi.

`--announce` adalah pengiriman fallback runner untuk balasan akhir. `--no-deliver` menonaktifkan fallback tersebut tetapi tidak menghapus alat `message` milik agen ketika rute chat tersedia.

Pengingat yang dibuat dari chat aktif mempertahankan target pengiriman chat langsung untuk pengiriman announce fallback. Kunci sesi internal dapat berupa huruf kecil; jangan gunakan sebagai sumber kebenaran untuk ID penyedia yang peka huruf besar/kecil seperti ID ruang Matrix.

### Pengiriman kegagalan

Notifikasi kegagalan diselesaikan dalam urutan ini:

1. `delivery.failureDestination` pada pekerjaan.
2. `cron.failureDestination` global.
3. Target announce utama pekerjaan (ketika tidak ada tujuan kegagalan eksplisit yang ditetapkan).

<Note>
Pekerjaan sesi utama hanya dapat menggunakan `delivery.failureDestination` ketika mode pengiriman utama adalah `webhook`. Pekerjaan terisolasi menerimanya dalam semua mode.
</Note>

Catatan: eksekusi Cron terisolasi memperlakukan kegagalan agen tingkat eksekusi sebagai kesalahan pekerjaan meskipun
tidak ada payload balasan yang dihasilkan, sehingga kegagalan model/penyedia tetap menaikkan
penghitung kesalahan dan memicu notifikasi kegagalan.

Pekerjaan Cron perintah tidak memulai giliran agen terisolasi. Kode keluar nol mencatat
`ok`; keluar non-nol, sinyal, timeout, atau timeout tanpa output mencatat `error` dan
dapat memicu jalur notifikasi kegagalan yang sama.

Jika eksekusi terisolasi mengalami timeout sebelum permintaan model pertama, `openclaw cron show`
dan `openclaw cron runs` menyertakan kesalahan spesifik fase seperti
`setup timed out before runner start` atau
`stalled before first model call (last phase: context-engine)`.
Untuk penyedia berbasis CLI, watchdog pra-model tetap aktif sampai giliran CLI eksternal
dimulai, sehingga jeda pencarian sesi, hook, autentikasi, prompt, dan setup CLI
dilaporkan sebagai kegagalan Cron pra-model.

## Penjadwalan

### Pekerjaan sekali jalan

`--at <datetime>` menjadwalkan eksekusi sekali jalan. Datetime tanpa offset diperlakukan sebagai UTC kecuali Anda juga meneruskan `--tz <iana>`, yang menafsirkan waktu jam dinding dalam zona waktu yang diberikan.

<Note>
Pekerjaan sekali jalan dihapus setelah berhasil secara default. Gunakan `--keep-after-run` untuk mempertahankannya.
</Note>

### Pekerjaan berulang

Pekerjaan berulang menggunakan backoff percobaan ulang eksponensial setelah kesalahan berturut-turut: 30d, 1m, 5m, 15m, 60m. Jadwal kembali normal setelah eksekusi berhasil berikutnya.

Eksekusi yang dilewati dilacak terpisah dari kesalahan eksekusi. Eksekusi tersebut tidak memengaruhi backoff percobaan ulang, tetapi `openclaw cron edit <job-id> --failure-alert-include-skipped` dapat mengikutsertakan peringatan kegagalan ke dalam notifikasi eksekusi-dilewati berulang.

Untuk pekerjaan terisolasi yang menargetkan penyedia model lokal yang dikonfigurasi, Cron menjalankan preflight penyedia ringan sebelum memulai giliran agen. Penyedia `api: "ollama"` Loopback, jaringan privat, dan `.local` diperiksa di `/api/tags`; penyedia lokal yang kompatibel dengan OpenAI seperti vLLM, SGLang, dan LM Studio diperiksa di `/models`. Jika endpoint tidak dapat dijangkau, eksekusi dicatat sebagai `skipped` dan dicoba ulang pada jadwal berikutnya; endpoint mati yang cocok di-cache selama 5 menit untuk mencegah banyak pekerjaan membanjiri server lokal yang sama.

Catatan: pekerjaan Cron, status runtime tertunda, dan riwayat eksekusi berada di database status SQLite bersama. File lama `jobs.json`, `jobs-state.json`, dan `runs/*.jsonl` diimpor sekali dan diganti namanya dengan sufiks `.migrated`. Setelah impor, edit jadwal dengan `openclaw cron add|edit|remove`, bukan dengan mengedit file JSON.

### Eksekusi manual

`openclaw cron run <job-id>` menjalankan paksa secara default dan kembali segera setelah eksekusi manual diantrekan. Respons berhasil menyertakan `{ ok: true, enqueued: true, runId }`. Gunakan `runId` yang dikembalikan untuk memeriksa hasil nanti:

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

Tambahkan `--wait` ketika skrip harus memblokir sampai eksekusi antrean persis itu mencatat status terminal:

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

Dengan `--wait`, CLI tetap memanggil `cron.run` terlebih dahulu, lalu melakukan polling `cron.runs` untuk `runId` yang dikembalikan. Perintah keluar `0` hanya ketika eksekusi selesai dengan status `ok`. Perintah keluar non-nol ketika eksekusi selesai dengan `error` atau `skipped`, ketika respons Gateway tidak menyertakan `runId`, atau ketika `--wait-timeout` kedaluwarsa. `--poll-interval` harus lebih besar dari nol.

<Note>
Gunakan `--due` ketika Anda ingin perintah manual berjalan hanya jika pekerjaan saat ini sudah jatuh tempo. Jika `--due --wait` tidak mengantrekan eksekusi, perintah mengembalikan respons normal tanpa eksekusi, bukan melakukan polling.
</Note>

## Model

`cron add|edit --model <ref>` memilih model yang diizinkan untuk pekerjaan. `cron add|edit --fallbacks <list>` menetapkan model fallback per pekerjaan, misalnya `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`; teruskan `--fallbacks ""` untuk eksekusi ketat tanpa fallback. `cron edit <job-id> --clear-fallbacks` menghapus penggantian fallback per pekerjaan. `cron edit <job-id> --clear-model` menghapus penggantian model per pekerjaan sehingga pekerjaan mengikuti presedensi pemilihan model Cron normal (penggantian sesi-Cron tersimpan jika ada, jika tidak model agen/default); ini tidak dapat digabungkan dengan `--model`. `cron add|edit --thinking <level>` menetapkan penggantian thinking per pekerjaan; `cron edit <job-id> --clear-thinking` menghapusnya sehingga pekerjaan mengikuti presedensi thinking Cron normal, dan ini tidak dapat digabungkan dengan `--thinking`.

<Warning>
Jika model tidak diizinkan atau tidak dapat diselesaikan, Cron menggagalkan eksekusi dengan kesalahan validasi eksplisit alih-alih fallback ke pilihan agen atau model default pekerjaan.
</Warning>

Cron `--model` adalah **utama pekerjaan**, bukan penggantian `/model` sesi-chat. Artinya:

- Fallback model yang dikonfigurasi tetap berlaku ketika model pekerjaan yang dipilih gagal.
- Payload per pekerjaan `fallbacks` menggantikan daftar fallback yang dikonfigurasi ketika ada.
- Daftar fallback per pekerjaan kosong (`--fallbacks ""` atau `fallbacks: []` dalam payload/API pekerjaan) membuat eksekusi Cron ketat.
- Ketika pekerjaan memiliki `--model` tetapi tidak ada daftar fallback yang dikonfigurasi, OpenClaw meneruskan penggantian fallback kosong eksplisit sehingga model utama agen tidak ditambahkan sebagai target percobaan ulang tersembunyi.
- Pemeriksaan preflight penyedia lokal menelusuri fallback yang dikonfigurasi sebelum menandai eksekusi Cron sebagai `skipped`.

`openclaw doctor` melaporkan pekerjaan yang sudah memiliki `payload.model` ditetapkan, termasuk jumlah namespace penyedia dan ketidakcocokan terhadap `agents.defaults.model`. Gunakan pemeriksaan tersebut ketika perilaku autentikasi, penyedia, atau penagihan tampak berbeda antara chat langsung dan pekerjaan terjadwal.

### Presedensi model Cron terisolasi

Cron terisolasi menyelesaikan model aktif dalam urutan ini:

1. Penggantian hook Gmail.
2. `--model` per pekerjaan.
3. Penggantian model sesi-Cron tersimpan (ketika pengguna memilihnya).
4. Pilihan model agen atau default.

### Mode cepat

Mode cepat Cron terisolasi mengikuti pilihan model langsung yang diselesaikan. Konfigurasi model `params.fastMode` berlaku secara default, tetapi penggantian sesi `fastMode` tersimpan tetap menang atas konfigurasi. Ketika mode yang diselesaikan adalah `auto`, batas waktu menggunakan nilai `params.fastAutoOnSeconds` model yang dipilih, dengan default 60 detik.

### Percobaan ulang peralihan model langsung

Jika eksekusi terisolasi melempar `LiveSessionModelSwitchError`, Cron mempertahankan penyedia dan model yang dialihkan (serta penggantian profil autentikasi yang dialihkan ketika ada) untuk eksekusi aktif sebelum mencoba ulang. Loop percobaan ulang luar dibatasi pada dua percobaan ulang peralihan setelah upaya awal, lalu dibatalkan alih-alih berulang selamanya.

## Output eksekusi dan penolakan

### Penekanan pengakuan basi

Giliran Cron terisolasi menekan balasan hanya-pengakuan yang basi. Jika hasil pertama hanya pembaruan status sementara dan tidak ada eksekusi subagen turunan yang bertanggung jawab atas jawaban akhirnya, Cron mem-prompt ulang sekali untuk hasil sebenarnya sebelum pengiriman.

### Penekanan token senyap

Jika sebuah proses cron terisolasi hanya mengembalikan token senyap (`NO_REPLY` atau `no_reply`), cron menekan pengiriman keluar langsung dan jalur ringkasan antrean fallback, sehingga tidak ada apa pun yang diposting kembali ke chat.

### Penolakan terstruktur

Proses cron terisolasi menggunakan metadata penolakan eksekusi terstruktur dari proses tertanam sebagai sinyal penolakan otoritatif. Proses ini juga menghormati pembungkus node-host `UNAVAILABLE` ketika pesan kesalahan terstruktur bersarang dimulai dengan `SYSTEM_RUN_DENIED` atau `INVALID_REQUEST`.

Cron tidak mengklasifikasikan prosa keluaran akhir atau frasa penolakan yang tampak seperti persetujuan sebagai penolakan kecuali proses tertanam juga menyediakan metadata penolakan terstruktur, sehingga teks asisten biasa tidak diperlakukan sebagai perintah yang diblokir.

`cron list` dan riwayat proses menampilkan alasan penolakan alih-alih melaporkan perintah yang diblokir sebagai `ok`.

## Retensi

Retensi dan pemangkasan dikendalikan dalam konfigurasi:

- `cron.sessionRetention` (default `24h`) memangkas sesi proses terisolasi yang sudah selesai.
- `cron.runLog.keepLines` memangkas baris riwayat proses SQLite yang dipertahankan per tugas. `cron.runLog.maxBytes` tetap diterima untuk kompatibilitas dengan log proses lama yang berbasis file.

## Memigrasikan tugas lama

<Note>
Jika Anda memiliki tugas cron dari sebelum format pengiriman dan penyimpanan saat ini, jalankan `openclaw doctor --fix`. Doctor menormalkan field cron legacy (`jobId`, `schedule.cron`, field pengiriman tingkat atas termasuk `threadId` legacy, alias pengiriman payload `provider`) dan memigrasikan tugas fallback Webhook `notify: true` dari `cron.webhook` ke pengiriman Webhook eksplisit. Tugas yang sudah mengumumkan ke chat mempertahankan pengiriman tersebut dan mendapatkan tujuan Webhook penyelesaian. Ketika `cron.webhook` tidak disetel, penanda tingkat atas `notify` yang inert dihapus untuk tugas tanpa target migrasi (pengiriman yang ada dipertahankan tanpa perubahan), sehingga `doctor --fix` tidak lagi terus memberi peringatan ulang tentangnya.
</Note>

## Edit umum

Perbarui pengaturan pengiriman tanpa mengubah pesan:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Nonaktifkan pengiriman untuk tugas terisolasi:

```bash
openclaw cron edit <job-id> --no-deliver
```

Aktifkan konteks bootstrap ringan untuk tugas terisolasi:

```bash
openclaw cron edit <job-id> --light-context
```

Umumkan ke channel tertentu:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Umumkan ke topik forum Telegram:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

Buat tugas terisolasi dengan konteks bootstrap ringan:

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Lightweight morning brief" \
  --session isolated \
  --light-context \
  --no-deliver
```

`--light-context` hanya berlaku untuk tugas giliran agen terisolasi. Untuk proses cron, mode ringan membuat konteks bootstrap tetap kosong alih-alih menyuntikkan set bootstrap workspace lengkap.

Buat tugas perintah dengan argv, cwd, env, stdin, dan batas keluaran yang tepat:

```bash
openclaw cron create "*/30 * * * *" \
  --name "Position export" \
  --command-argv '["node","scripts/export-position.mjs"]' \
  --command-cwd "/srv/app" \
  --command-env "NODE_ENV=production" \
  --command-input '{"mode":"summary"}' \
  --timeout-seconds 120 \
  --no-output-timeout-seconds 30 \
  --output-max-bytes 65536 \
  --webhook "https://example.invalid/openclaw/cron"
```

## Perintah admin umum

Proses manual dan inspeksi:

```bash
openclaw cron list
openclaw cron list --agent ops
openclaw cron get <job-id>
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron run <job-id> --wait --wait-timeout 10m
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
openclaw cron runs --id <job-id> --limit 50
openclaw cron runs --id <job-id> --run-id <run-id>
```

`openclaw cron list` menampilkan semua tugas yang cocok secara default. Berikan `--agent <id>` untuk hanya menampilkan tugas yang id agen ternormalisasi efektifnya cocok; tugas tanpa id agen tersimpan dihitung sebagai agen default yang dikonfigurasi.

`openclaw cron get <job-id>` mengembalikan JSON tugas tersimpan secara langsung. Gunakan `cron show <job-id>` ketika Anda menginginkan tampilan yang mudah dibaca manusia dengan pratinjau rute pengiriman.

`cron list --json` dan `cron show <job-id> --json` menyertakan field tingkat atas `status` pada setiap tugas, yang dihitung dari `enabled`, `state.runningAtMs`, dan `state.lastRunStatus`. Nilai: `disabled`, `running`, `ok`, `error`, `skipped`, atau `idle`. Ini mencerminkan kolom status yang mudah dibaca manusia sehingga alat eksternal dapat membaca status tugas tanpa menghitungnya ulang.

Entri `cron runs` menyertakan diagnostik pengiriman dengan target cron yang dimaksud, target yang diselesaikan, pengiriman alat pesan, penggunaan fallback, dan status terkirim.

Penargetan ulang agen dan sesi:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` memberi peringatan ketika `--agent` dihilangkan pada tugas giliran agen dan fallback ke agen default (`main`). Berikan `--agent <id>` saat pembuatan untuk menyematkan agen tertentu.

Penyesuaian pengiriman:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --webhook "https://example.invalid/openclaw/cron"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## Terkait

- [Referensi CLI](/id/cli)
- [Tugas terjadwal](/id/automation/cron-jobs)
