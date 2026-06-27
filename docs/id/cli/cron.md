---
read_when:
    - Anda menginginkan pekerjaan terjadwal dan bangun otomatis
    - Anda sedang men-debug eksekusi dan log cron
summary: Referensi CLI untuk `openclaw cron` (menjadwalkan dan menjalankan pekerjaan latar belakang)
title: Cron
x-i18n:
    generated_at: "2026-06-27T17:17:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fa81e555d35b8982d1de9703c68dfb66aa9ad39407d46555eb0143e3cc5f52f5
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Kelola pekerjaan cron untuk penjadwal Gateway.

<Tip>
Jalankan `openclaw cron --help` untuk permukaan perintah lengkap. Lihat [Pekerjaan cron](/id/automation/cron-jobs) untuk panduan konseptual.
</Tip>

## Membuat pekerjaan dengan cepat

`openclaw cron create` adalah alias untuk `openclaw cron add`. Untuk pekerjaan baru, letakkan jadwal terlebih dahulu dan prompt di urutan kedua:

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Morning brief" \
  --agent ops
```

Gunakan `--webhook <url>` ketika pekerjaan harus melakukan POST payload selesai alih-alih mengirimkannya ke target chat:

```bash
openclaw cron create "0 18 * * 1-5" \
  "Summarize today's deploys as JSON." \
  --name "Deploy digest" \
  --webhook "https://example.invalid/openclaw/cron"
```

Gunakan `--command` untuk pekerjaan bergaya shell deterministik yang harus berjalan di dalam cron OpenClaw tanpa memulai eksekusi agen/model terisolasi:

<Note>
Pekerjaan cron perintah adalah otomatisasi Gateway yang dibuat admin. Membuat, mengedit,
menghapus, atau menjalankannya secara manual memerlukan `operator.admin`; eksekusi terjadwal
nantinya berjalan di proses Gateway, bukan sebagai pemanggilan alat `tools.exec` agen.
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

`--command <shell>` menyimpan `argv: ["sh", "-lc", <shell>]`. Gunakan `--command-argv '["node","scripts/report.mjs"]'` untuk eksekusi argv persis. Pekerjaan perintah menangkap stdout/stderr, mencatat riwayat cron normal, dan merutekan output melalui mode pengiriman `announce`, `webhook`, atau `none` yang sama seperti pekerjaan terisolasi. Perintah yang hanya mencetak `NO_REPLY` akan ditekan.

## Sesi

`--session` menerima `main`, `isolated`, `current`, atau `session:<id>`.

<AccordionGroup>
  <Accordion title="Kunci sesi">
    - `main` mengikat ke sesi utama agen.
    - `isolated` membuat transkrip baru dan id sesi baru untuk setiap eksekusi.
    - `current` mengikat ke sesi aktif pada saat pembuatan.
    - `session:<id>` menyematkan ke kunci sesi persisten eksplisit.

  </Accordion>
  <Accordion title="Semantik sesi terisolasi">
    Eksekusi terisolasi mereset konteks percakapan sekitar. Perutean channel dan grup, kebijakan kirim/antrean, elevasi, asal, dan pengikatan runtime ACP direset untuk eksekusi baru. Preferensi aman dan override model atau auth eksplisit yang dipilih pengguna dapat dibawa lintas eksekusi.
  </Accordion>
</AccordionGroup>

## Pengiriman

`openclaw cron list` dan `openclaw cron show <job-id>` mempratinjau rute pengiriman yang diselesaikan. Untuk `channel: "last"`, pratinjau menunjukkan apakah rute diselesaikan dari sesi utama atau sesi saat ini, atau akan gagal tertutup.

Target berprefiks penyedia dapat membedakan channel announce yang belum terselesaikan. Misalnya, `to: "telegram:123"` memilih Telegram ketika `delivery.channel` dihilangkan atau `last`. Hanya prefiks yang diiklankan oleh plugin yang dimuat yang menjadi pemilih penyedia. Jika `delivery.channel` eksplisit, prefiks harus cocok dengan channel tersebut; `channel: "whatsapp"` dengan `to: "telegram:123"` ditolak. Prefiks layanan seperti `imessage:` dan `sms:` tetap menjadi sintaks target milik channel.

<Note>
Pekerjaan `cron add` terisolasi secara default menggunakan pengiriman `--announce`. Gunakan `--no-deliver` untuk menjaga output tetap internal. `--deliver` tetap sebagai alias usang untuk `--announce`.
</Note>

### Kepemilikan pengiriman

Pengiriman chat cron terisolasi dibagi antara agen dan runner:

- Agen dapat mengirim langsung menggunakan alat `message` ketika rute chat tersedia.
- `announce` mengirim fallback balasan akhir hanya ketika agen tidak mengirim langsung ke target yang diselesaikan.
- `webhook` memposting payload selesai ke URL.
- `none` menonaktifkan pengiriman fallback runner.

Gunakan `cron add|create --webhook <url>` atau `cron edit <job-id> --webhook <url>` untuk mengatur pengiriman webhook. Jangan gabungkan `--webhook` dengan flag pengiriman chat seperti `--announce`, `--no-deliver`, `--channel`, `--to`, `--thread-id`, atau `--account`.

`cron edit <job-id>` dapat menghapus isian bidang perutean pengiriman individual dengan `--clear-channel`, `--clear-to`, `--clear-thread-id`, dan `--clear-account` (masing-masing ditolak ketika digabungkan dengan flag set yang cocok). Tidak seperti `--no-deliver`, yang hanya menonaktifkan pengiriman fallback runner, ini menghapus bidang tersimpan sehingga pekerjaan kembali menyelesaikan bagian rutenya dari default.

`--announce` adalah pengiriman fallback runner untuk balasan akhir. `--no-deliver` menonaktifkan fallback tersebut tetapi tidak menghapus alat `message` agen ketika rute chat tersedia.

Pengingat yang dibuat dari chat aktif mempertahankan target pengiriman chat live untuk pengiriman announce fallback. Kunci sesi internal boleh huruf kecil; jangan gunakan sebagai sumber kebenaran untuk ID penyedia yang peka huruf besar-kecil seperti ID ruang Matrix.

### Pengiriman kegagalan

Notifikasi kegagalan diselesaikan dalam urutan ini:

1. `delivery.failureDestination` pada pekerjaan.
2. `cron.failureDestination` global.
3. Target announce utama pekerjaan (ketika tidak ada tujuan kegagalan eksplisit yang diatur).

<Note>
Pekerjaan sesi utama hanya boleh menggunakan `delivery.failureDestination` ketika mode pengiriman utama adalah `webhook`. Pekerjaan terisolasi menerimanya di semua mode.
</Note>

Catatan: eksekusi cron terisolasi memperlakukan kegagalan agen tingkat eksekusi sebagai error pekerjaan bahkan ketika
tidak ada payload balasan yang dihasilkan, sehingga kegagalan model/penyedia tetap menaikkan
penghitung error dan memicu notifikasi kegagalan.

Pekerjaan cron perintah tidak memulai giliran agen terisolasi. Kode keluar nol mencatat
`ok`; exit bukan nol, sinyal, timeout, atau timeout tanpa output mencatat `error` dan
dapat memicu jalur notifikasi kegagalan yang sama.

Jika eksekusi terisolasi timeout sebelum permintaan model pertama, `openclaw cron show`
dan `openclaw cron runs` menyertakan error khusus fase seperti
`setup timed out before runner start` atau
`stalled before first model call (last phase: context-engine)`.
Untuk penyedia berbasis CLI, watchdog pra-model tetap aktif hingga giliran CLI eksternal
dimulai, sehingga stall pencarian sesi, hook, auth, prompt, dan penyiapan CLI
dilaporkan sebagai kegagalan cron pra-model.

## Penjadwalan

### Pekerjaan satu kali

`--at <datetime>` menjadwalkan eksekusi satu kali. Datetime tanpa offset diperlakukan sebagai UTC kecuali Anda juga meneruskan `--tz <iana>`, yang menginterpretasikan waktu jam dinding di zona waktu yang diberikan.

<Note>
Pekerjaan satu kali dihapus setelah berhasil secara default. Gunakan `--keep-after-run` untuk mempertahankannya.
</Note>

### Pekerjaan berulang

Pekerjaan berulang menggunakan backoff retry eksponensial setelah error berurutan: 30d, 1m, 5m, 15m, 60m. Jadwal kembali normal setelah eksekusi berhasil berikutnya.

Eksekusi yang dilewati dilacak terpisah dari error eksekusi. Eksekusi tersebut tidak memengaruhi backoff retry, tetapi `openclaw cron edit <job-id> --failure-alert-include-skipped` dapat mengikutsertakan peringatan kegagalan ke dalam notifikasi eksekusi-terlewati yang berulang.

Untuk pekerjaan terisolasi yang menargetkan penyedia model terkonfigurasi lokal, cron menjalankan preflight penyedia ringan sebelum memulai giliran agen. Penyedia `api: "ollama"` loopback, jaringan privat, dan `.local` diperiksa di `/api/tags`; penyedia kompatibel OpenAI lokal seperti vLLM, SGLang, dan LM Studio diperiksa di `/models`. Jika endpoint tidak dapat dijangkau, eksekusi dicatat sebagai `skipped` dan dicoba ulang pada jadwal berikutnya; endpoint mati yang cocok di-cache selama 5 menit untuk menghindari banyak pekerjaan membanjiri server lokal yang sama.

Catatan: pekerjaan cron, status runtime tertunda, dan riwayat eksekusi berada di database status SQLite bersama. File legacy `jobs.json`, `jobs-state.json`, dan `runs/*.jsonl` diimpor satu kali dan diganti namanya dengan sufiks `.migrated`. Setelah impor, edit jadwal dengan `openclaw cron add|edit|remove` alih-alih mengedit file JSON.

### Eksekusi manual

`openclaw cron run <job-id>` secara default menjalankan paksa dan kembali segera setelah eksekusi manual masuk antrean. Respons berhasil menyertakan `{ ok: true, enqueued: true, runId }`. Gunakan `runId` yang dikembalikan untuk memeriksa hasil berikutnya:

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

Tambahkan `--wait` ketika skrip harus memblokir hingga eksekusi antrean persis tersebut mencatat status terminal:

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

Dengan `--wait`, CLI tetap memanggil `cron.run` terlebih dahulu, lalu melakukan polling `cron.runs` untuk `runId` yang dikembalikan. Perintah keluar `0` hanya ketika eksekusi selesai dengan status `ok`. Perintah keluar bukan nol ketika eksekusi selesai dengan `error` atau `skipped`, ketika respons Gateway tidak menyertakan `runId`, atau ketika `--wait-timeout` kedaluwarsa. `--poll-interval` harus lebih besar dari nol.

<Note>
Gunakan `--due` ketika Anda ingin perintah manual berjalan hanya jika pekerjaan saat ini sudah jatuh tempo. Jika `--due --wait` tidak mengantrekan eksekusi, perintah mengembalikan respons non-eksekusi normal alih-alih melakukan polling.
</Note>

## Model

`cron add|edit --model <ref>` memilih model yang diizinkan untuk pekerjaan. `cron add|edit --fallbacks <list>` menetapkan model fallback per pekerjaan, misalnya `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`; teruskan `--fallbacks ""` untuk eksekusi ketat tanpa fallback. `cron edit <job-id> --clear-fallbacks` menghapus override fallback per pekerjaan. `cron edit <job-id> --clear-model` menghapus override model per pekerjaan sehingga pekerjaan mengikuti presedensi pemilihan model cron normal (override sesi-cron tersimpan jika ada, jika tidak model agen/default); ini tidak dapat digabungkan dengan `--model`.

<Warning>
Jika model tidak diizinkan atau tidak dapat diselesaikan, cron menggagalkan eksekusi dengan error validasi eksplisit alih-alih melakukan fallback ke pemilihan model agen pekerjaan atau default.
</Warning>

Cron `--model` adalah **primer pekerjaan**, bukan override `/model` sesi chat. Artinya:

- Fallback model terkonfigurasi tetap berlaku ketika model pekerjaan yang dipilih gagal.
- Payload per pekerjaan `fallbacks` menggantikan daftar fallback terkonfigurasi ketika ada.
- Daftar fallback per pekerjaan yang kosong (`--fallbacks ""` atau `fallbacks: []` dalam payload/API pekerjaan) membuat eksekusi cron menjadi ketat.
- Ketika pekerjaan memiliki `--model` tetapi tidak ada daftar fallback yang dikonfigurasi, OpenClaw meneruskan override fallback kosong eksplisit sehingga primer agen tidak ditambahkan sebagai target retry tersembunyi.
- Pemeriksaan preflight penyedia lokal menelusuri fallback terkonfigurasi sebelum menandai eksekusi cron sebagai `skipped`.

`openclaw doctor` melaporkan pekerjaan yang sudah memiliki `payload.model` diatur, termasuk jumlah namespace penyedia dan ketidakcocokan terhadap `agents.defaults.model`. Gunakan pemeriksaan tersebut ketika perilaku auth, penyedia, atau penagihan terlihat berbeda antara chat live dan pekerjaan terjadwal.

### Presedensi model cron terisolasi

Cron terisolasi menyelesaikan model aktif dalam urutan ini:

1. Override hook Gmail.
2. `--model` per pekerjaan.
3. Override model sesi-cron tersimpan (ketika pengguna memilihnya).
4. Pemilihan model agen atau default.

### Mode cepat

Mode cepat cron terisolasi mengikuti pemilihan model live yang diselesaikan. Konfigurasi model `params.fastMode` berlaku secara default, tetapi override sesi tersimpan `fastMode` tetap mengalahkan konfigurasi. Ketika mode yang diselesaikan adalah `auto`, cutoff menggunakan nilai `params.fastAutoOnSeconds` model yang dipilih, dengan default 60 detik.

### Retry pergantian model live

Jika eksekusi terisolasi melempar `LiveSessionModelSwitchError`, cron mempertahankan penyedia dan model yang dialihkan (serta override profil auth yang dialihkan ketika ada) untuk eksekusi aktif sebelum mencoba ulang. Loop retry luar dibatasi dua retry pergantian setelah percobaan awal, lalu dibatalkan alih-alih berulang selamanya.

## Output eksekusi dan penolakan

### Penekanan pengakuan usang

Giliran cron terisolasi menekan balasan usang yang hanya berupa pengakuan. Jika hasil pertama hanya pembaruan status sementara dan tidak ada eksekusi subagen turunan yang bertanggung jawab atas jawaban akhir, cron meminta ulang sekali untuk hasil sebenarnya sebelum pengiriman.

### Penekanan token senyap

Jika eksekusi cron terisolasi hanya mengembalikan token senyap (`NO_REPLY` atau `no_reply`), cron menekan pengiriman keluar langsung dan jalur ringkasan antrean fallback, sehingga tidak ada yang diposting kembali ke chat.

### Penolakan terstruktur

Eksekusi Cron terisolasi menggunakan metadata penolakan eksekusi terstruktur dari eksekusi tertanam sebagai sinyal penolakan otoritatif. Eksekusi ini juga menghormati pembungkus node-host `UNAVAILABLE` ketika pesan kesalahan terstruktur bertingkat dimulai dengan `SYSTEM_RUN_DENIED` atau `INVALID_REQUEST`.

Cron tidak mengklasifikasikan prosa keluaran akhir atau frasa penolakan yang tampak seperti persetujuan sebagai penolakan kecuali eksekusi tertanam juga menyediakan metadata penolakan terstruktur, sehingga teks asisten biasa tidak diperlakukan sebagai perintah yang diblokir.

`cron list` dan riwayat eksekusi menampilkan alasan penolakan, bukan melaporkan perintah yang diblokir sebagai `ok`.

## Retensi

Retensi dan pemangkasan dikendalikan dalam konfigurasi:

- `cron.sessionRetention` (default `24h`) memangkas sesi eksekusi terisolasi yang sudah selesai.
- `cron.runLog.keepLines` memangkas baris riwayat eksekusi SQLite yang dipertahankan per job. `cron.runLog.maxBytes` tetap diterima untuk kompatibilitas dengan log eksekusi lama yang berbasis file.

## Memigrasikan job lama

<Note>
Jika Anda memiliki job Cron dari sebelum format pengiriman dan penyimpanan saat ini, jalankan `openclaw doctor --fix`. Doctor menormalkan kolom Cron lama (`jobId`, `schedule.cron`, kolom pengiriman tingkat atas termasuk `threadId` lama, alias pengiriman payload `provider`) dan memigrasikan job fallback webhook `notify: true` dari `cron.webhook` ke pengiriman webhook eksplisit. Job yang sudah mengumumkan ke chat mempertahankan pengiriman tersebut dan mendapatkan tujuan webhook penyelesaian. Ketika `cron.webhook` tidak diatur, penanda tingkat atas `notify` yang inert dihapus untuk job tanpa target migrasi (pengiriman yang ada dipertahankan tanpa perubahan), sehingga `doctor --fix` tidak lagi terus memperingatkannya kembali.
</Note>

## Edit umum

Perbarui pengaturan pengiriman tanpa mengubah pesan:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Nonaktifkan pengiriman untuk job terisolasi:

```bash
openclaw cron edit <job-id> --no-deliver
```

Aktifkan konteks bootstrap ringan untuk job terisolasi:

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

Buat job terisolasi dengan konteks bootstrap ringan:

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Lightweight morning brief" \
  --session isolated \
  --light-context \
  --no-deliver
```

`--light-context` hanya berlaku untuk job giliran agen terisolasi. Untuk eksekusi Cron, mode ringan menjaga konteks bootstrap tetap kosong alih-alih menyuntikkan set bootstrap workspace lengkap.

Buat job perintah dengan argv, cwd, env, stdin, dan batas keluaran yang persis:

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

Eksekusi manual dan inspeksi:

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

`openclaw cron list` menampilkan semua job yang cocok secara default. Berikan `--agent <id>` untuk hanya menampilkan job dengan id agen ternormalisasi efektif yang cocok; job tanpa id agen tersimpan dihitung sebagai agen default yang dikonfigurasi.

`openclaw cron get <job-id>` mengembalikan JSON job tersimpan secara langsung. Gunakan `cron show <job-id>` saat Anda menginginkan tampilan yang mudah dibaca manusia dengan pratinjau rute pengiriman.

`cron list --json` dan `cron show <job-id> --json` menyertakan kolom `status` tingkat atas pada setiap job, dihitung dari `enabled`, `state.runningAtMs`, dan `state.lastRunStatus`. Nilai: `disabled`, `running`, `ok`, `error`, `skipped`, atau `idle`. Ini mencerminkan kolom status yang mudah dibaca manusia sehingga tooling eksternal dapat membaca status job tanpa menghitung ulang.

Entri `cron runs` menyertakan diagnostik pengiriman dengan target Cron yang dimaksud, target yang diselesaikan, pengiriman message-tool, penggunaan fallback, dan status terkirim.

Penargetan ulang agen dan sesi:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` memperingatkan ketika `--agent` dihilangkan pada job giliran agen dan melakukan fallback ke agen default (`main`). Berikan `--agent <id>` saat pembuatan untuk menyematkan agen tertentu.

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
