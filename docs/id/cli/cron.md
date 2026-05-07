---
read_when:
    - Anda membutuhkan pekerjaan terjadwal dan pemicu bangun
    - Anda sedang melakukan debug eksekusi Cron dan log
summary: Referensi CLI untuk `openclaw cron` (menjadwalkan dan menjalankan pekerjaan latar belakang)
title: Cron
x-i18n:
    generated_at: "2026-05-07T13:13:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: de49599c3ebaba88b65dbb6b2b545c0f094575935d9fd0ce0b7bd34470f8e345
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Kelola tugas Cron untuk penjadwal Gateway.

<Tip>
Jalankan `openclaw cron --help` untuk permukaan perintah lengkap. Lihat [Tugas Cron](/id/automation/cron-jobs) untuk panduan konseptual.
</Tip>

## Sesi

`--session` menerima `main`, `isolated`, `current`, atau `session:<id>`.

<AccordionGroup>
  <Accordion title="Kunci sesi">
    - `main` mengikat ke sesi utama agen.
    - `isolated` membuat transkrip baru dan id sesi untuk setiap run.
    - `current` mengikat ke sesi aktif pada waktu pembuatan.
    - `session:<id>` menyematkan ke kunci sesi persisten eksplisit.

  </Accordion>
  <Accordion title="Semantik sesi terisolasi">
    Run terisolasi mengatur ulang konteks percakapan sekitar. Perutean channel dan grup, kebijakan kirim/antre, elevasi, origin, dan pengikatan runtime ACP diatur ulang untuk run baru. Preferensi aman serta penggantian model atau auth yang dipilih pengguna secara eksplisit dapat diteruskan antar-run.
  </Accordion>
</AccordionGroup>

## Pengiriman

`openclaw cron list` dan `openclaw cron show <job-id>` mempratinjau rute pengiriman yang diselesaikan. Untuk `channel: "last"`, pratinjau menampilkan apakah rute diselesaikan dari sesi utama atau sesi saat ini, atau akan gagal tertutup.

Target berprefiks provider dapat membedakan channel announce yang belum terselesaikan. Misalnya, `to: "telegram:123"` memilih Telegram saat `delivery.channel` dihilangkan atau `last`. Hanya prefiks yang diiklankan oleh plugin yang dimuat yang menjadi pemilih provider. Jika `delivery.channel` eksplisit, prefiks harus cocok dengan channel tersebut; `channel: "whatsapp"` dengan `to: "telegram:123"` ditolak. Prefiks layanan seperti `imessage:` dan `sms:` tetap menjadi sintaks target milik channel.

<Note>
Tugas `cron add` terisolasi default ke pengiriman `--announce`. Gunakan `--no-deliver` agar output tetap internal. `--deliver` tetap menjadi alias usang untuk `--announce`.
</Note>

### Kepemilikan pengiriman

Pengiriman chat Cron terisolasi dibagi antara agen dan runner:

- Agen dapat mengirim langsung menggunakan alat `message` saat rute chat tersedia.
- `announce` mengirim cadangan balasan akhir hanya saat agen tidak mengirim langsung ke target yang diselesaikan.
- `webhook` mengirim payload selesai ke URL.
- `none` menonaktifkan pengiriman cadangan runner.

`--announce` adalah pengiriman cadangan runner untuk balasan akhir. `--no-deliver` menonaktifkan cadangan tersebut tetapi tidak menghapus alat `message` agen saat rute chat tersedia.

Pengingat yang dibuat dari chat aktif mempertahankan target pengiriman chat live untuk pengiriman announce cadangan. Kunci sesi internal dapat berupa huruf kecil; jangan gunakan sebagai sumber kebenaran untuk ID provider yang peka huruf besar-kecil seperti ID room Matrix.

### Pengiriman kegagalan

Notifikasi kegagalan diselesaikan dalam urutan ini:

1. `delivery.failureDestination` pada tugas.
2. `cron.failureDestination` global.
3. Target announce utama tugas (saat tidak ada tujuan kegagalan eksplisit yang ditetapkan).

<Note>
Tugas sesi utama hanya boleh menggunakan `delivery.failureDestination` saat mode pengiriman utama adalah `webhook`. Tugas terisolasi menerimanya di semua mode.
</Note>

Catatan: run Cron terisolasi memperlakukan kegagalan agen tingkat run sebagai kesalahan tugas meskipun
tidak ada payload balasan yang dihasilkan, sehingga kegagalan model/provider tetap menaikkan penghitung
kesalahan dan memicu notifikasi kegagalan.

## Penjadwalan

### Tugas sekali jalan

`--at <datetime>` menjadwalkan run sekali jalan. Datetime tanpa offset diperlakukan sebagai UTC kecuali Anda juga meneruskan `--tz <iana>`, yang menafsirkan waktu jam dinding dalam zona waktu yang diberikan.

<Note>
Tugas sekali jalan dihapus setelah berhasil secara default. Gunakan `--keep-after-run` untuk mempertahankannya.
</Note>

### Tugas berulang

Tugas berulang menggunakan backoff retry eksponensial setelah kesalahan berturut-turut: 30d, 1m, 5m, 15m, 60m. Jadwal kembali normal setelah run berhasil berikutnya.

Run yang dilewati dilacak terpisah dari kesalahan eksekusi. Run tersebut tidak memengaruhi backoff retry, tetapi `openclaw cron edit <job-id> --failure-alert-include-skipped` dapat mengikutsertakan peringatan kegagalan ke notifikasi run yang dilewati berulang.

Untuk tugas terisolasi yang menargetkan provider model lokal terkonfigurasi, Cron menjalankan preflight provider ringan sebelum memulai giliran agen. Provider loopback, jaringan privat, dan `.local` `api: "ollama"` diperiksa di `/api/tags`; provider lokal yang kompatibel dengan OpenAI seperti vLLM, SGLang, dan LM Studio diperiksa di `/models`. Jika endpoint tidak dapat dijangkau, run dicatat sebagai `skipped` dan dicoba lagi pada jadwal berikutnya; endpoint mati yang cocok di-cache selama 5 menit untuk menghindari banyak tugas membanjiri server lokal yang sama.

Catatan: definisi tugas Cron berada di `jobs.json`, sedangkan state runtime tertunda berada di `jobs-state.json`. Jika `jobs.json` diedit secara eksternal, Gateway memuat ulang jadwal yang berubah dan membersihkan slot tertunda yang basi; penulisan ulang format saja tidak membersihkan slot tertunda.

### Run manual

`openclaw cron run` kembali segera setelah run manual diantrekan. Respons berhasil menyertakan `{ ok: true, enqueued: true, runId }`. Gunakan `openclaw cron runs --id <job-id>` untuk mengikuti hasil akhirnya.

<Note>
`openclaw cron run <job-id>` menjalankan paksa secara default. Gunakan `--due` untuk mempertahankan perilaku lama "hanya jalankan jika jatuh tempo".
</Note>

## Model

`cron add|edit --model <ref>` memilih model yang diizinkan untuk tugas.

<Warning>
Jika model tidak diizinkan atau tidak dapat diselesaikan, Cron menggagalkan run dengan kesalahan validasi eksplisit alih-alih kembali ke pilihan model agen tugas atau default.
</Warning>

Cron `--model` adalah **utama tugas**, bukan penggantian `/model` sesi chat. Artinya:

- Fallback model terkonfigurasi tetap berlaku saat model tugas yang dipilih gagal.
- `fallbacks` payload per tugas menggantikan daftar fallback terkonfigurasi saat ada.
- Daftar fallback per tugas kosong (`fallbacks: []` dalam payload/API tugas) membuat run Cron ketat.
- Saat tugas memiliki `--model` tetapi tidak ada daftar fallback yang dikonfigurasi, OpenClaw meneruskan penggantian fallback kosong eksplisit agar model utama agen tidak ditambahkan sebagai target retry tersembunyi.

### Prioritas model Cron terisolasi

Cron terisolasi menyelesaikan model aktif dalam urutan ini:

1. Penggantian hook Gmail.
2. `--model` per tugas.
3. Penggantian model sesi Cron tersimpan (saat pengguna memilihnya).
4. Pilihan model agen atau default.

### Mode cepat

Mode cepat Cron terisolasi mengikuti pilihan model live yang diselesaikan. Konfigurasi model `params.fastMode` berlaku secara default, tetapi penggantian `fastMode` sesi tersimpan tetap mengungguli konfigurasi.

### Retry peralihan model live

Jika run terisolasi melempar `LiveSessionModelSwitchError`, Cron mempertahankan provider dan model yang dialihkan (serta penggantian profil auth yang dialihkan saat ada) untuk run aktif sebelum mencoba lagi. Loop retry luar dibatasi hingga dua retry peralihan setelah percobaan awal, lalu dibatalkan alih-alih berulang selamanya.

## Output run dan penolakan

### Penekanan pengakuan basi

Giliran Cron terisolasi menekan balasan yang hanya berupa pengakuan basi. Jika hasil pertama hanya pembaruan status sementara dan tidak ada run subagen turunan yang bertanggung jawab atas jawaban akhirnya, Cron meminta ulang sekali untuk hasil sebenarnya sebelum pengiriman.

### Penekanan token senyap

Jika run Cron terisolasi hanya mengembalikan token senyap (`NO_REPLY` atau `no_reply`), Cron menekan pengiriman keluar langsung dan jalur ringkasan antrean cadangan, sehingga tidak ada yang diposting kembali ke chat.

### Penolakan terstruktur

Run Cron terisolasi lebih memilih metadata penolakan eksekusi terstruktur dari run tertanam, lalu kembali ke penanda penolakan yang dikenal dalam output akhir, seperti `SYSTEM_RUN_DENIED`, `INVALID_REQUEST`, dan frasa penolakan pengikatan persetujuan.

`cron list` dan riwayat run menampilkan alasan penolakan alih-alih melaporkan perintah yang diblokir sebagai `ok`.

## Retensi

Retensi dan pemangkasan dikontrol dalam konfigurasi:

- `cron.sessionRetention` (default `24h`) memangkas sesi run terisolasi yang selesai.
- `cron.runLog.maxBytes` dan `cron.runLog.keepLines` memangkas `~/.openclaw/cron/runs/<jobId>.jsonl`.

## Memigrasikan tugas lama

<Note>
Jika Anda memiliki tugas Cron dari sebelum format pengiriman dan penyimpanan saat ini, jalankan `openclaw doctor --fix`. Doctor menormalkan field Cron legacy (`jobId`, `schedule.cron`, field pengiriman tingkat atas termasuk `threadId` legacy, alias pengiriman `provider` payload) dan memigrasikan tugas fallback Webhook sederhana `notify: true` ke pengiriman Webhook eksplisit saat `cron.webhook` dikonfigurasi.
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

Announce ke channel tertentu:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Announce ke topik forum Telegram:

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

`--light-context` hanya berlaku untuk tugas giliran agen terisolasi. Untuk run Cron, mode ringan menjaga konteks bootstrap tetap kosong alih-alih menyuntikkan set bootstrap workspace lengkap.

## Perintah admin umum

Run manual dan inspeksi:

```bash
openclaw cron list
openclaw cron list --agent ops
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

`openclaw cron list` menampilkan semua tugas yang cocok secara default. Teruskan `--agent <id>` untuk hanya menampilkan tugas yang id agen ternormalisasi efektifnya cocok; tugas tanpa id agen tersimpan dihitung sebagai agen default terkonfigurasi.

`cron list --json` dan `cron show <job-id> --json` menyertakan field `status` tingkat atas pada setiap tugas, dihitung dari `enabled`, `state.runningAtMs`, dan `state.lastRunStatus`. Nilai: `disabled`, `running`, `ok`, `error`, `skipped`, atau `idle`. Ini mencerminkan kolom status yang dapat dibaca manusia sehingga tooling eksternal dapat membaca state tugas tanpa menghitung ulang.

Entri `cron runs` menyertakan diagnostik pengiriman dengan target Cron yang dimaksud, target yang diselesaikan, pengiriman alat pesan, penggunaan fallback, dan state terkirim.

Penargetan ulang agen dan sesi:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` memperingatkan saat `--agent` dihilangkan pada tugas giliran agen dan kembali ke agen default (`main`). Teruskan `--agent <id>` pada waktu pembuatan untuk menyematkan agen tertentu.

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
