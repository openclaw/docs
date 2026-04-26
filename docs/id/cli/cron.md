---
read_when:
    - Anda menginginkan tugas terjadwal dan wakeup
    - Anda sedang men-debug eksekusi dan log Cron
summary: Referensi CLI untuk `openclaw cron` (menjadwalkan dan menjalankan tugas latar belakang)
title: Cron
x-i18n:
    generated_at: "2026-04-26T11:25:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55cadcf73550367d399b7ca78e842f12a8113f2ec8749f59dadf2bbb5f8417ae
    source_path: cli/cron.md
    workflow: 15
---

# `openclaw cron`

Kelola tugas Cron untuk scheduler Gateway.

Terkait:

- Tugas Cron: [Tugas Cron](/id/automation/cron-jobs)

Tip: jalankan `openclaw cron --help` untuk permukaan perintah lengkap.

Catatan: `openclaw cron list` dan `openclaw cron show <job-id>` mempratinjau
rute pengiriman yang sudah di-resolve. Untuk `channel: "last"`, pratinjau menunjukkan apakah
rute di-resolve dari sesi utama/saat ini atau akan gagal secara tertutup.

Catatan: tugas `cron add` terisolasi default ke pengiriman `--announce`. Gunakan `--no-deliver` untuk menjaga
output tetap internal. `--deliver` tetap tersedia sebagai alias usang untuk `--announce`.

Catatan: pengiriman obrolan cron terisolasi bersifat bersama. `--announce` adalah pengiriman fallback
runner untuk balasan final; `--no-deliver` menonaktifkan fallback tersebut tetapi
tidak menghapus tool `message` milik agen ketika rute obrolan tersedia.

Catatan: tugas sekali jalan (`--at`) dihapus setelah sukses secara default. Gunakan `--keep-after-run` untuk menyimpannya.

Catatan: `--session` mendukung `main`, `isolated`, `current`, dan `session:<id>`.
Gunakan `current` untuk mengikat ke sesi aktif saat pembuatan, atau `session:<id>` untuk
key sesi persisten yang eksplisit.

Catatan: `--session isolated` membuat id transkrip/sesi baru untuk setiap eksekusi.
Preferensi aman dan override model/auth yang dipilih pengguna secara eksplisit dapat dibawa,
tetapi konteks percakapan sekitar tidak: perutean saluran/grup, kebijakan kirim/antrian,
elevation, origin, dan pengikatan runtime ACP direset untuk eksekusi terisolasi yang baru.

Catatan: untuk tugas CLI sekali jalan, datetime `--at` tanpa offset diperlakukan sebagai UTC kecuali Anda juga memberikan
`--tz <iana>`, yang menafsirkan waktu wall-clock lokal tersebut dalam zona waktu yang diberikan.

Catatan: tugas berulang sekarang menggunakan retry backoff eksponensial setelah error berturut-turut (30d → 1m → 5m → 15m → 60m), lalu kembali ke jadwal normal setelah eksekusi sukses berikutnya.

Catatan: `openclaw cron run` sekarang mengembalikan hasil segera setelah eksekusi manual diantrikan untuk dijalankan. Respons yang sukses mencakup `{ ok: true, enqueued: true, runId }`; gunakan `openclaw cron runs --id <job-id>` untuk mengikuti hasil akhirnya.

Catatan: `openclaw cron run <job-id>` secara default melakukan force-run. Gunakan `--due` untuk mempertahankan
perilaku lama "hanya jalankan jika sudah jatuh tempo".

Catatan: cron terisolasi menekan balasan lama yang hanya berupa acknowledgment. Jika
hasil pertama hanya pembaruan status sementara dan tidak ada eksekusi subagen turunan yang
bertanggung jawab atas jawaban akhirnya, cron akan melakukan prompt ulang sekali untuk hasil
sebenarnya sebelum pengiriman.

Catatan: jika eksekusi cron terisolasi hanya mengembalikan token senyap (`NO_REPLY` /
`no_reply`), cron menekan pengiriman keluar langsung dan jalur ringkasan antrean fallback
juga, sehingga tidak ada yang diposting kembali ke obrolan.

Catatan: `cron add|edit --model ...` menggunakan model yang dipilih dan diizinkan tersebut untuk tugas.
Jika model tidak diizinkan, cron memperingatkan dan fallback ke pemilihan model agen/default milik tugas.
Rantai fallback yang dikonfigurasi tetap berlaku, tetapi override model biasa tanpa daftar fallback per-tugas yang eksplisit tidak lagi menambahkan
primary agen sebagai target retry ekstra tersembunyi.

Catatan: prioritas model cron terisolasi adalah override Gmail-hook terlebih dahulu, lalu per-tugas
`--model`, lalu override model sesi-cron tersimpan yang dipilih pengguna, lalu
pemilihan agen/default normal.

Catatan: mode cepat cron terisolasi mengikuti pemilihan model langsung yang telah di-resolve. Konfigurasi model
`params.fastMode` berlaku secara default, tetapi override `fastMode` sesi tersimpan tetap menang atas konfigurasi.

Catatan: jika eksekusi terisolasi melempar `LiveSessionModelSwitchError`, cron mempertahankan
provider/model yang sudah diganti (dan override profil auth yang diganti jika ada) untuk
eksekusi aktif sebelum melakukan retry. Loop retry luar dibatasi hingga 2 retry pergantian
setelah upaya awal, lalu dibatalkan alih-alih berputar tanpa akhir.

Catatan: notifikasi kegagalan menggunakan `delivery.failureDestination` terlebih dahulu, lalu
`cron.failureDestination` global, dan akhirnya fallback ke target announce utama tugas saat tidak ada tujuan kegagalan eksplisit yang dikonfigurasi.

Catatan: retensi/pruning dikendalikan dalam konfigurasi:

- `cron.sessionRetention` (default `24h`) memangkas sesi eksekusi terisolasi yang selesai.
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` memangkas `~/.openclaw/cron/runs/<jobId>.jsonl`.

Catatan upgrade: jika Anda memiliki tugas cron lama dari sebelum format pengiriman/penyimpanan saat ini, jalankan
`openclaw doctor --fix`. Doctor sekarang menormalkan field cron lama (`jobId`, `schedule.cron`,
field pengiriman level atas termasuk `threadId` lama, alias pengiriman `provider` pada payload) dan memigrasikan tugas fallback webhook `notify: true`
sederhana ke pengiriman webhook eksplisit ketika `cron.webhook` dikonfigurasi.

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

Umumkan ke saluran tertentu:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Buat tugas terisolasi dengan konteks bootstrap ringan:

```bash
openclaw cron add \
  --name "Ringkasan pagi ringan" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Ringkas pembaruan semalam." \
  --light-context \
  --no-deliver
```

`--light-context` hanya berlaku untuk tugas giliran agen yang terisolasi. Untuk eksekusi cron, mode ringan menjaga konteks bootstrap tetap kosong alih-alih menyuntikkan set bootstrap workspace penuh.

Catatan kepemilikan pengiriman:

- Pengiriman obrolan cron terisolasi bersifat bersama. Agen dapat mengirim langsung dengan
  tool `message` saat rute obrolan tersedia.
- `announce` melakukan pengiriman fallback untuk balasan final hanya saat agen tidak mengirim
  langsung ke target yang sudah di-resolve. `webhook` mem-posting payload yang selesai ke URL.
  `none` menonaktifkan pengiriman fallback runner.
- Pengingat yang dibuat dari obrolan aktif mempertahankan target pengiriman obrolan langsung
  untuk pengiriman announce fallback. Key sesi internal dapat berupa huruf kecil; jangan
  gunakan sebagai sumber kebenaran untuk ID provider yang peka huruf besar/kecil seperti ID room Matrix.

## Perintah admin umum

Eksekusi manual:

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

Entri `cron runs` mencakup diagnostik pengiriman dengan target cron yang dimaksud,
target yang di-resolve, pengiriman tool message, penggunaan fallback, dan status terkirim.

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

- `delivery.failureDestination` didukung untuk tugas terisolasi.
- Tugas sesi utama hanya dapat menggunakan `delivery.failureDestination` ketika
  mode pengiriman utama adalah `webhook`.
- Jika Anda tidak menetapkan tujuan kegagalan apa pun dan tugas sudah melakukan announce ke
  saluran, notifikasi kegagalan menggunakan kembali target announce yang sama tersebut.

## Terkait

- [Referensi CLI](/id/cli)
- [Tugas terjadwal](/id/automation/cron-jobs)
