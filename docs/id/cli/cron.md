---
read_when:
    - Anda menginginkan tugas terjadwal dan pemicu bangun
    - Anda sedang memecahkan masalah eksekusi Cron dan log
summary: Referensi CLI untuk `openclaw cron` (menjadwalkan dan menjalankan pekerjaan latar belakang)
title: Cron
x-i18n:
    generated_at: "2026-05-11T20:25:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: ad261871e48704061be7147f0a2722001cdc7e95156c0dc44f46c41d7e415cc6
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Kelola tugas cron untuk penjadwal Gateway.

<Tip>
Jalankan `openclaw cron --help` untuk permukaan perintah lengkap. Lihat [Tugas cron](/id/automation/cron-jobs) untuk panduan konseptual.
</Tip>

## Sesi

`--session` menerima `main`, `isolated`, `current`, atau `session:<id>`.

<AccordionGroup>
  <Accordion title="Kunci sesi">
    - `main` mengikat ke sesi utama agen.
    - `isolated` membuat transkrip baru dan id sesi baru untuk setiap proses.
    - `current` mengikat ke sesi aktif pada waktu pembuatan.
    - `session:<id>` menyematkan ke kunci sesi persisten yang eksplisit.

  </Accordion>
  <Accordion title="Semantik sesi terisolasi">
    Proses terisolasi mengatur ulang konteks percakapan sekitar. Perutean channel dan grup, kebijakan kirim/antre, elevasi, asal, dan pengikatan runtime ACP diatur ulang untuk proses baru. Preferensi aman dan model yang dipilih pengguna secara eksplisit atau override autentikasi dapat dibawa antarproses.
  </Accordion>
</AccordionGroup>

## Pengiriman

`openclaw cron list` dan `openclaw cron show <job-id>` meninjau rute pengiriman yang diselesaikan. Untuk `channel: "last"`, pratinjau menunjukkan apakah rute diselesaikan dari sesi utama atau saat ini, atau akan gagal tertutup.

Target berprefiks penyedia dapat memperjelas channel pengumuman yang belum terselesaikan. Misalnya, `to: "telegram:123"` memilih Telegram saat `delivery.channel` dihilangkan atau `last`. Hanya prefiks yang diiklankan oleh plugin yang dimuat yang menjadi pemilih penyedia. Jika `delivery.channel` eksplisit, prefiks harus cocok dengan channel tersebut; `channel: "whatsapp"` dengan `to: "telegram:123"` ditolak. Prefiks layanan seperti `imessage:` dan `sms:` tetap menjadi sintaks target yang dimiliki channel.

<Note>
Tugas `cron add` terisolasi secara default menggunakan pengiriman `--announce`. Gunakan `--no-deliver` untuk menjaga keluaran tetap internal. `--deliver` tetap menjadi alias usang untuk `--announce`.
</Note>

### Kepemilikan pengiriman

Pengiriman chat cron terisolasi dibagi antara agen dan runner:

- Agen dapat mengirim langsung menggunakan alat `message` saat rute chat tersedia.
- `announce` mengirim fallback balasan akhir hanya saat agen tidak mengirim langsung ke target yang diselesaikan.
- `webhook` memposting payload yang selesai ke URL.
- `none` menonaktifkan pengiriman fallback runner.

`--announce` adalah pengiriman fallback runner untuk balasan akhir. `--no-deliver` menonaktifkan fallback tersebut tetapi tidak menghapus alat `message` agen saat rute chat tersedia.

Pengingat yang dibuat dari chat aktif mempertahankan target pengiriman chat langsung untuk pengiriman pengumuman fallback. Kunci sesi internal mungkin huruf kecil; jangan gunakan sebagai sumber kebenaran untuk ID penyedia yang peka huruf besar/kecil seperti ID ruang Matrix.

### Pengiriman kegagalan

Notifikasi kegagalan diselesaikan dalam urutan ini:

1. `delivery.failureDestination` pada tugas.
2. `cron.failureDestination` global.
3. Target pengumuman utama tugas (saat tidak ada tujuan kegagalan eksplisit yang ditetapkan).

<Note>
Tugas sesi utama hanya boleh menggunakan `delivery.failureDestination` saat mode pengiriman utama adalah `webhook`. Tugas terisolasi menerimanya di semua mode.
</Note>

Catatan: proses cron terisolasi memperlakukan kegagalan agen tingkat proses sebagai error tugas bahkan saat
tidak ada payload balasan yang dihasilkan, sehingga kegagalan model/penyedia tetap menambah penghitung
error dan memicu notifikasi kegagalan.

Jika proses terisolasi habis waktu sebelum permintaan model pertama, `openclaw cron show`
dan `openclaw cron runs` menyertakan error khusus fase seperti
`setup timed out before runner start` atau
`stalled before first model call (last phase: context-engine)`.
Untuk penyedia berbasis CLI, watchdog pra-model tetap aktif hingga giliran CLI eksternal
dimulai, sehingga kemacetan pencarian sesi, hook, autentikasi, prompt, dan penyiapan CLI
dilaporkan sebagai kegagalan cron pra-model.

## Penjadwalan

### Tugas satu kali

`--at <datetime>` menjadwalkan proses satu kali. Datetime tanpa offset diperlakukan sebagai UTC kecuali Anda juga meneruskan `--tz <iana>`, yang menafsirkan waktu jam-dinding dalam zona waktu yang diberikan.

<Note>
Tugas satu kali dihapus setelah berhasil secara default. Gunakan `--keep-after-run` untuk mempertahankannya.
</Note>

### Tugas berulang

Tugas berulang menggunakan backoff percobaan ulang eksponensial setelah error berturut-turut: 30d, 1m, 5m, 15m, 60m. Jadwal kembali normal setelah proses berikutnya berhasil.

Proses yang dilewati dilacak terpisah dari error eksekusi. Proses tersebut tidak memengaruhi backoff percobaan ulang, tetapi `openclaw cron edit <job-id> --failure-alert-include-skipped` dapat mengikutsertakan peringatan kegagalan ke notifikasi proses dilewati yang berulang.

Untuk tugas terisolasi yang menargetkan penyedia model terkonfigurasi lokal, cron menjalankan preflight penyedia ringan sebelum memulai giliran agen. Penyedia `api: "ollama"` local loopback, jaringan privat, dan `.local` diperiksa di `/api/tags`; penyedia kompatibel OpenAI lokal seperti vLLM, SGLang, dan LM Studio diperiksa di `/models`. Jika endpoint tidak dapat dijangkau, proses dicatat sebagai `skipped` dan dicoba ulang pada jadwal berikutnya; endpoint mati yang cocok di-cache selama 5 menit untuk menghindari banyak tugas menghantam server lokal yang sama.

Catatan: definisi tugas cron berada di `jobs.json`, sementara status runtime yang tertunda berada di `jobs-state.json`. Jika `jobs.json` diedit secara eksternal, Gateway memuat ulang jadwal yang berubah dan membersihkan slot tertunda yang usang; penulisan ulang format saja tidak membersihkan slot tertunda.

### Proses manual

`openclaw cron run` kembali segera setelah proses manual dimasukkan ke antrean. Respons berhasil menyertakan `{ ok: true, enqueued: true, runId }`. Gunakan `openclaw cron runs --id <job-id>` untuk mengikuti hasil akhirnya.

<Note>
`openclaw cron run <job-id>` menjalankan paksa secara default. Gunakan `--due` untuk mempertahankan perilaku lama "hanya jalankan jika jatuh tempo".
</Note>

## Model

`cron add|edit --model <ref>` memilih model yang diizinkan untuk tugas.

<Warning>
Jika model tidak diizinkan atau tidak dapat diselesaikan, cron menggagalkan proses dengan error validasi eksplisit alih-alih fallback ke pemilihan model agen tugas atau default.
</Warning>

Cron `--model` adalah **utama tugas**, bukan override `/model` sesi chat. Artinya:

- Fallback model terkonfigurasi tetap berlaku saat model tugas yang dipilih gagal.
- Payload per tugas `fallbacks` menggantikan daftar fallback terkonfigurasi saat ada.
- Daftar fallback per tugas kosong (`fallbacks: []` dalam payload/API tugas) membuat proses cron ketat.
- Saat tugas memiliki `--model` tetapi tidak ada daftar fallback yang dikonfigurasi, OpenClaw meneruskan override fallback kosong eksplisit sehingga model utama agen tidak ditambahkan sebagai target percobaan ulang tersembunyi.

### Prioritas model cron terisolasi

Cron terisolasi menyelesaikan model aktif dalam urutan ini:

1. Override hook Gmail.
2. `--model` per tugas.
3. Override model sesi cron tersimpan (saat pengguna memilihnya).
4. Pemilihan model agen atau default.

### Mode cepat

Mode cepat cron terisolasi mengikuti pemilihan model langsung yang diselesaikan. Konfigurasi model `params.fastMode` berlaku secara default, tetapi override `fastMode` sesi tersimpan tetap mengalahkan konfigurasi.

### Percobaan ulang peralihan model langsung

Jika proses terisolasi melempar `LiveSessionModelSwitchError`, cron mempertahankan penyedia dan model yang dialihkan (serta override profil autentikasi yang dialihkan saat ada) untuk proses aktif sebelum mencoba ulang. Loop percobaan ulang luar dibatasi dua percobaan ulang peralihan setelah percobaan awal, lalu membatalkan alih-alih berulang selamanya.

## Keluaran proses dan penolakan

### Penekanan pengakuan usang

Giliran cron terisolasi menekan balasan yang hanya berupa pengakuan usang. Jika hasil pertama hanya pembaruan status sementara dan tidak ada proses subagen turunan yang bertanggung jawab atas jawaban akhirnya, cron melakukan prompt ulang sekali untuk hasil nyata sebelum pengiriman.

### Penekanan token senyap

Jika proses cron terisolasi hanya mengembalikan token senyap (`NO_REPLY` atau `no_reply`), cron menekan pengiriman keluar langsung dan jalur ringkasan antrean fallback, sehingga tidak ada yang diposting kembali ke chat.

### Penolakan terstruktur

Proses cron terisolasi mengutamakan metadata penolakan eksekusi terstruktur dari proses tertanam, lalu fallback ke penanda penolakan yang dikenal dalam keluaran akhir, seperti `SYSTEM_RUN_DENIED`, `INVALID_REQUEST`, dan frasa penolakan pengikatan persetujuan.

`cron list` dan riwayat proses menampilkan alasan penolakan alih-alih melaporkan perintah yang diblokir sebagai `ok`.

## Retensi

Retensi dan pemangkasan dikontrol dalam konfigurasi:

- `cron.sessionRetention` (default `24h`) memangkas sesi proses terisolasi yang selesai.
- `cron.runLog.maxBytes` dan `cron.runLog.keepLines` memangkas `~/.openclaw/cron/runs/<jobId>.jsonl`.

## Memigrasikan tugas lama

<Note>
Jika Anda memiliki tugas cron dari sebelum format pengiriman dan penyimpanan saat ini, jalankan `openclaw doctor --fix`. Doctor menormalkan kolom cron lama (`jobId`, `schedule.cron`, kolom pengiriman tingkat atas termasuk `threadId` lama, alias pengiriman `provider` payload) dan memigrasikan tugas fallback webhook sederhana `notify: true` ke pengiriman webhook eksplisit saat `cron.webhook` dikonfigurasi.
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
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` hanya berlaku untuk tugas giliran agen terisolasi. Untuk proses cron, mode ringan menjaga konteks bootstrap tetap kosong alih-alih menyuntikkan set bootstrap workspace penuh.

## Perintah admin umum

Proses manual dan inspeksi:

```bash
openclaw cron list
openclaw cron list --agent ops
openclaw cron get <job-id>
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

`openclaw cron list` menampilkan semua tugas yang cocok secara default. Teruskan `--agent <id>` untuk menampilkan hanya tugas yang id agen ternormalisasi efektifnya cocok; tugas tanpa id agen tersimpan dihitung sebagai agen default yang dikonfigurasi.

`openclaw cron get <job-id>` mengembalikan JSON tugas tersimpan secara langsung. Gunakan `cron show <job-id>` saat Anda menginginkan tampilan yang mudah dibaca manusia dengan pratinjau rute pengiriman.

`cron list --json` dan `cron show <job-id> --json` menyertakan kolom `status` tingkat atas pada setiap tugas, dihitung dari `enabled`, `state.runningAtMs`, dan `state.lastRunStatus`. Nilai: `disabled`, `running`, `ok`, `error`, `skipped`, atau `idle`. Ini mencerminkan kolom status yang mudah dibaca manusia sehingga alat eksternal dapat membaca status tugas tanpa menghitung ulang.

Entri `cron runs` menyertakan diagnostik pengiriman dengan target cron yang dimaksud, target yang diselesaikan, pengiriman alat pesan, penggunaan fallback, dan status terkirim.

Penargetan ulang agen dan sesi:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` memperingatkan saat `--agent` dihilangkan pada tugas giliran agen dan fallback ke agen default (`main`). Teruskan `--agent <id>` pada waktu pembuatan untuk menyematkan agen tertentu.

Penyesuaian pengiriman:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## Terkait

- [Referensi CLI](/id/cli)
- [Tugas terjadwal](/id/automation/cron-jobs)
