---
read_when:
    - Anda menginginkan job terjadwal dan wakeup
    - Anda sedang men-debug eksekusi dan log cron
summary: Referensi CLI untuk `openclaw cron` (menjadwalkan dan menjalankan pekerjaan latar belakang)
title: Cron
x-i18n:
    generated_at: "2026-04-24T09:01:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: d3f5c262092b9b5b821ec824bc02dbbd806936d91f1d03ac6eb789f7e71ffc07
    source_path: cli/cron.md
    workflow: 15
---

# `openclaw cron`

Kelola job cron untuk penjadwal Gateway.

Terkait:

- Job cron: [Job cron](/id/automation/cron-jobs)

Tip: jalankan `openclaw cron --help` untuk permukaan perintah lengkap.

Catatan: `openclaw cron list` dan `openclaw cron show <job-id>` mempratinjau
rute pengiriman yang telah diselesaikan. Untuk `channel: "last"`, pratinjau
menunjukkan apakah rute diselesaikan dari sesi main/current atau akan gagal tertutup.

Catatan: job `cron add` terisolasi secara default menggunakan pengiriman `--announce`. Gunakan `--no-deliver` untuk menjaga
output tetap internal. `--deliver` tetap tersedia sebagai alias usang untuk `--announce`.

Catatan: pengiriman chat cron terisolasi bersifat bersama. `--announce` adalah pengiriman fallback runner
untuk balasan akhir; `--no-deliver` menonaktifkan fallback tersebut tetapi tidak
menghapus alat `message` agen saat rute chat tersedia.

Catatan: job sekali jalan (`--at`) dihapus setelah berhasil secara default. Gunakan `--keep-after-run` untuk mempertahankannya.

Catatan: `--session` mendukung `main`, `isolated`, `current`, dan `session:<id>`.
Gunakan `current` untuk mengikat ke sesi aktif saat waktu pembuatan, atau `session:<id>` untuk
kunci sesi persisten eksplisit.

Catatan: untuk job CLI sekali jalan, datetime `--at` tanpa offset diperlakukan sebagai UTC kecuali Anda juga memberikan
`--tz <iana>`, yang menafsirkan waktu wall-clock lokal tersebut dalam zona waktu yang diberikan.

Catatan: job berulang sekarang menggunakan exponential retry backoff setelah error berturut-turut (30d → 1m → 5m → 15m → 60m), lalu kembali ke jadwal normal setelah eksekusi sukses berikutnya.

Catatan: `openclaw cron run` sekarang mengembalikan hasil segera setelah eksekusi manual dimasukkan ke antrean untuk dijalankan. Respons yang berhasil menyertakan `{ ok: true, enqueued: true, runId }`; gunakan `openclaw cron runs --id <job-id>` untuk mengikuti hasil akhirnya.

Catatan: `openclaw cron run <job-id>` secara default memaksa eksekusi. Gunakan `--due` untuk mempertahankan
perilaku lama "jalankan hanya jika sudah jatuh tempo".

Catatan: giliran cron terisolasi menekan balasan usang yang hanya berupa konfirmasi. Jika
hasil pertama hanya berupa pembaruan status sementara dan tidak ada eksekusi subagen turunan yang
bertanggung jawab atas jawaban akhirnya, cron akan melakukan prompt ulang sekali untuk hasil yang sebenarnya
sebelum pengiriman.

Catatan: jika eksekusi cron terisolasi hanya mengembalikan token senyap (`NO_REPLY` /
`no_reply`), cron menekan pengiriman keluar langsung dan juga jalur ringkasan
antrean fallback, sehingga tidak ada apa pun yang diposting kembali ke chat.

Catatan: `cron add|edit --model ...` menggunakan model yang dipilih dan diizinkan tersebut untuk job.
Jika model tidak diizinkan, cron memperingatkan dan fallback ke pemilihan model agen/default
job sebagai gantinya. Rantai fallback yang dikonfigurasi tetap berlaku, tetapi override model
biasa tanpa daftar fallback per-job yang eksplisit tidak lagi menambahkan primary
agen sebagai target retry tambahan tersembunyi.

Catatan: prioritas model cron terisolasi adalah override hook Gmail terlebih dahulu, lalu `--model`
per-job, lalu override model sesi cron yang tersimpan, lalu pemilihan
agen/default normal.

Catatan: mode cepat cron terisolasi mengikuti pemilihan model live yang telah diselesaikan. Config
model `params.fastMode` berlaku secara default, tetapi override `fastMode` sesi yang tersimpan
tetap lebih diutamakan daripada config.

Catatan: jika eksekusi terisolasi melempar `LiveSessionModelSwitchError`, cron menyimpan
provider/model yang diganti (dan override auth profile yang diganti jika ada) sebelum
mencoba ulang. Loop retry luar dibatasi hingga 2 retry pergantian setelah percobaan
awal, lalu dibatalkan alih-alih berputar tanpa akhir.

Catatan: notifikasi kegagalan menggunakan `delivery.failureDestination` terlebih dahulu, lalu
`cron.failureDestination` global, dan terakhir fallback ke target
announce utama job saat tidak ada tujuan kegagalan eksplisit yang dikonfigurasi.

Catatan: retensi/pemangkasan dikendalikan dalam config:

- `cron.sessionRetention` (default `24h`) memangkas sesi eksekusi terisolasi yang selesai.
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` memangkas `~/.openclaw/cron/runs/<jobId>.jsonl`.

Catatan upgrade: jika Anda memiliki job cron lama dari sebelum format delivery/store saat ini, jalankan
`openclaw doctor --fix`. Doctor sekarang menormalkan field cron lama (`jobId`, `schedule.cron`,
field pengiriman tingkat atas termasuk `threadId` lama, alias pengiriman `provider` payload) dan memigrasikan job fallback Webhook
`notify: true` sederhana ke pengiriman Webhook eksplisit saat `cron.webhook`
dikonfigurasi.

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

Umumkan ke saluran tertentu:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Buat job terisolasi dengan konteks bootstrap ringan:

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` hanya berlaku untuk job giliran agen terisolasi. Untuk eksekusi cron, mode ringan menjaga konteks bootstrap tetap kosong alih-alih menyuntikkan seluruh set bootstrap workspace.

Catatan kepemilikan pengiriman:

- Pengiriman chat cron terisolasi bersifat bersama. Agen dapat mengirim langsung dengan alat
  `message` saat rute chat tersedia.
- `announce` mengirimkan balasan akhir sebagai fallback hanya saat agen tidak mengirim
  langsung ke target yang telah diselesaikan. `webhook` mem-POST payload selesai ke URL.
  `none` menonaktifkan pengiriman fallback runner.

## Perintah admin umum

Eksekusi manual:

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

Entri `cron runs` menyertakan diagnostik pengiriman dengan target cron yang dimaksud,
target yang telah diselesaikan, pengiriman alat message, penggunaan fallback, dan status terkirim.

Penargetan ulang agen/sesi:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

Penyesuaian pengiriman:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

Catatan pengiriman kegagalan:

- `delivery.failureDestination` didukung untuk job terisolasi.
- Job sesi main hanya dapat menggunakan `delivery.failureDestination` ketika mode
  pengiriman utama adalah `webhook`.
- Jika Anda tidak menetapkan tujuan kegagalan apa pun dan job sudah melakukan announce ke
  saluran, notifikasi kegagalan akan menggunakan kembali target announce yang sama.

## Terkait

- [Referensi CLI](/id/cli)
- [Tugas terjadwal](/id/automation/cron-jobs)
