---
read_when:
    - Anda menginginkan pekerjaan dan wakeup terjadwal
    - Anda sedang men-debug eksekusi dan log cron
summary: Referensi CLI untuk `openclaw cron` (menjadwalkan dan menjalankan pekerjaan latar belakang)
title: cron
x-i18n:
    generated_at: "2026-04-05T13:45:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: f74ec8847835f24b3970f1b260feeb69c7ab6c6ec7e41615cbb73f37f14a8112
    source_path: cli/cron.md
    workflow: 15
---

# `openclaw cron`

Kelola pekerjaan cron untuk scheduler Gateway.

Terkait:

- Pekerjaan cron: [Pekerjaan cron](/automation/cron-jobs)

Tip: jalankan `openclaw cron --help` untuk permukaan perintah lengkap.

Catatan: pekerjaan `cron add` terisolasi secara default menggunakan pengiriman `--announce`. Gunakan `--no-deliver` agar
output tetap internal. `--deliver` tetap tersedia sebagai alias usang untuk `--announce`.

Catatan: eksekusi terisolasi yang dimiliki cron mengharapkan ringkasan teks biasa dan runner memiliki
jalur pengiriman akhir. `--no-deliver` menjaga eksekusi tetap internal; ini tidak
mengembalikan pengiriman ke message tool milik agen.

Catatan: pekerjaan sekali jalan (`--at`) dihapus setelah berhasil secara default. Gunakan `--keep-after-run` untuk menyimpannya.

Catatan: `--session` mendukung `main`, `isolated`, `current`, dan `session:<id>`.
Gunakan `current` untuk mengikat ke sesi aktif pada saat pembuatan, atau `session:<id>` untuk
session key persisten yang eksplisit.

Catatan: untuk pekerjaan CLI sekali jalan, datetime `--at` tanpa offset diperlakukan sebagai UTC kecuali Anda juga meneruskan
`--tz <iana>`, yang akan menafsirkan waktu lokal wall-clock tersebut dalam timezone yang diberikan.

Catatan: pekerjaan rekuren sekarang menggunakan retry backoff eksponensial setelah error berturut-turut (30d → 1m → 5m → 15m → 60m), lalu kembali ke jadwal normal setelah eksekusi berhasil berikutnya.

Catatan: `openclaw cron run` sekarang kembali segera setelah eksekusi manual dimasukkan ke antrean untuk dijalankan. Respons yang berhasil mencakup `{ ok: true, enqueued: true, runId }`; gunakan `openclaw cron runs --id <job-id>` untuk mengikuti hasil akhirnya.

Catatan: `openclaw cron run <job-id>` secara default memaksa eksekusi. Gunakan `--due` untuk mempertahankan
perilaku lama "hanya jalankan jika sudah jatuh tempo".

Catatan: giliran cron terisolasi menekan balasan usang yang hanya berupa tanda terima. Jika
hasil pertama hanya berupa pembaruan status sementara dan tidak ada eksekusi subagen turunan yang
bertanggung jawab atas jawaban akhirnya, cron akan meminta ulang sekali untuk hasil sebenarnya
sebelum pengiriman.

Catatan: jika eksekusi cron terisolasi hanya mengembalikan token senyap (`NO_REPLY` /
`no_reply`), cron menekan pengiriman keluar langsung dan juga jalur fallback
ringkasan antrean, sehingga tidak ada yang dikirim kembali ke chat.

Catatan: `cron add|edit --model ...` menggunakan model yang dipilih dan diizinkan untuk pekerjaan tersebut.
Jika model tidak diizinkan, cron memberi peringatan dan kembali ke pemilihan model agen/default
pekerjaan tersebut. Rantai fallback yang dikonfigurasi tetap berlaku, tetapi override model biasa
tanpa daftar fallback per pekerjaan yang eksplisit tidak lagi menambahkan model utama agen
sebagai target retry tambahan yang tersembunyi.

Catatan: prioritas model cron terisolasi adalah override hook Gmail terlebih dahulu, lalu `--model`
per pekerjaan, lalu override model cron-session tersimpan, lalu pemilihan
agen/default normal.

Catatan: mode cepat cron terisolasi mengikuti pemilihan model live yang sudah diselesaikan. Konfigurasi model
`params.fastMode` berlaku secara default, tetapi override `fastMode` sesi yang tersimpan
tetap lebih diutamakan daripada config.

Catatan: jika eksekusi terisolasi melempar `LiveSessionModelSwitchError`, cron menyimpan
penyedia/model yang dialihkan (dan override profil auth yang dialihkan jika ada) sebelum
mencoba ulang. Loop retry luar dibatasi hingga 2 retry perpindahan setelah percobaan
awal, lalu dibatalkan alih-alih berulang tanpa akhir.

Catatan: notifikasi kegagalan menggunakan `delivery.failureDestination` terlebih dahulu, lalu
`cron.failureDestination` global, dan terakhir fallback ke target
announce utama pekerjaan saat tidak ada tujuan kegagalan eksplisit yang dikonfigurasi.

Catatan: retensi/pemangkasan dikendalikan di config:

- `cron.sessionRetention` (default `24h`) memangkas sesi eksekusi terisolasi yang sudah selesai.
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` memangkas `~/.openclaw/cron/runs/<jobId>.jsonl`.

Catatan upgrade: jika Anda memiliki pekerjaan cron lama dari sebelum format delivery/store saat ini, jalankan
`openclaw doctor --fix`. Doctor sekarang menormalkan field cron lama (`jobId`, `schedule.cron`,
field delivery level atas termasuk `threadId` lama, alias delivery `provider` pada payload) dan memigrasikan pekerjaan fallback webhook sederhana
`notify: true` ke delivery webhook eksplisit saat `cron.webhook` telah
dikonfigurasi.

## Edit umum

Perbarui pengaturan delivery tanpa mengubah pesan:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Nonaktifkan delivery untuk pekerjaan terisolasi:

```bash
openclaw cron edit <job-id> --no-deliver
```

Aktifkan konteks bootstrap ringan untuk pekerjaan terisolasi:

```bash
openclaw cron edit <job-id> --light-context
```

Umumkan ke channel tertentu:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Buat pekerjaan terisolasi dengan konteks bootstrap ringan:

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` hanya berlaku untuk pekerjaan giliran agen terisolasi. Untuk eksekusi cron, mode ringan menjaga konteks bootstrap tetap kosong alih-alih menyuntikkan set bootstrap workspace lengkap.

Catatan kepemilikan delivery:

- Pekerjaan terisolasi yang dimiliki cron selalu merutekan delivery akhir yang terlihat pengguna melalui
  runner cron (`announce`, `webhook`, atau hanya internal `none`).
- Jika tugas menyebut pengiriman pesan ke penerima eksternal tertentu, agen harus
  menjelaskan tujuan yang dimaksud dalam hasilnya alih-alih mencoba mengirimnya
  langsung.

## Perintah admin umum

Eksekusi manual:

```bash
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

Pengalihan agen/sesi:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

Penyesuaian delivery:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

Catatan delivery kegagalan:

- `delivery.failureDestination` didukung untuk pekerjaan terisolasi.
- Pekerjaan sesi utama hanya dapat menggunakan `delivery.failureDestination` saat mode
  delivery utama adalah `webhook`.
- Jika Anda tidak menetapkan tujuan kegagalan apa pun dan pekerjaan sudah mengumumkan ke
  channel, notifikasi kegagalan akan menggunakan kembali target announce yang sama.
