---
read_when:
    - Anda menginginkan tugas terjadwal dan pemicu bangun
    - Anda sedang men-debug eksekusi Cron dan log
summary: Referensi CLI untuk `openclaw cron` (menjadwalkan dan menjalankan tugas latar belakang)
title: Cron
x-i18n:
    generated_at: "2026-04-30T09:39:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03d79e0e2c71f673c900b84eb2beeab705662c1d016e1d0567323c8da73060bb
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Kelola pekerjaan Cron untuk penjadwal Gateway.

<Tip>
Jalankan `openclaw cron --help` untuk permukaan perintah lengkap. Lihat [pekerjaan Cron](/id/automation/cron-jobs) untuk panduan konseptual.
</Tip>

## Sesi

`--session` menerima `main`, `isolated`, `current`, atau `session:<id>`.

<AccordionGroup>
  <Accordion title="Kunci sesi">
    - `main` mengikat ke sesi utama agen.
    - `isolated` membuat transkrip baru dan id sesi untuk setiap eksekusi.
    - `current` mengikat ke sesi aktif pada waktu pembuatan.
    - `session:<id>` menyematkan ke kunci sesi persisten eksplisit.

  </Accordion>
  <Accordion title="Semantik sesi terisolasi">
    Eksekusi terisolasi mengatur ulang konteks percakapan ambien. Perutean channel dan grup, kebijakan kirim/antre, elevasi, asal, dan pengikatan runtime ACP diatur ulang untuk eksekusi baru. Preferensi aman dan penggantian model atau autentikasi yang dipilih pengguna secara eksplisit dapat dibawa antar eksekusi.
  </Accordion>
</AccordionGroup>

## Pengiriman

`openclaw cron list` dan `openclaw cron show <job-id>` menampilkan pratinjau rute pengiriman yang diselesaikan. Untuk `channel: "last"`, pratinjau menampilkan apakah rute diselesaikan dari sesi utama atau saat ini, atau akan gagal tertutup.

<Note>
Pekerjaan `cron add` terisolasi menggunakan pengiriman `--announce` secara default. Gunakan `--no-deliver` untuk menjaga output tetap internal. `--deliver` tetap menjadi alias usang untuk `--announce`.
</Note>

### Kepemilikan pengiriman

Pengiriman chat cron terisolasi dibagi antara agen dan runner:

- Agen dapat mengirim langsung menggunakan alat `message` saat rute chat tersedia.
- `announce` mengirim cadangan balasan akhir hanya saat agen tidak mengirim langsung ke target yang diselesaikan.
- `webhook` memposting payload yang sudah selesai ke URL.
- `none` menonaktifkan pengiriman cadangan runner.

`--announce` adalah pengiriman cadangan runner untuk balasan akhir. `--no-deliver` menonaktifkan cadangan tersebut tetapi tidak menghapus alat `message` milik agen saat rute chat tersedia.

Pengingat yang dibuat dari chat aktif mempertahankan target pengiriman chat langsung untuk pengiriman announce cadangan. Kunci sesi internal dapat berupa huruf kecil; jangan gunakan sebagai sumber kebenaran untuk ID penyedia yang peka huruf besar-kecil seperti ID ruang Matrix.

### Pengiriman kegagalan

Notifikasi kegagalan diselesaikan dalam urutan ini:

1. `delivery.failureDestination` pada pekerjaan.
2. `cron.failureDestination` global.
3. Target announce utama pekerjaan (saat tidak ada tujuan kegagalan eksplisit yang ditetapkan).

<Note>
Pekerjaan sesi utama hanya boleh menggunakan `delivery.failureDestination` saat mode pengiriman utama adalah `webhook`. Pekerjaan terisolasi menerimanya di semua mode.
</Note>

Catatan: eksekusi cron terisolasi memperlakukan kegagalan agen tingkat eksekusi sebagai kesalahan pekerjaan meskipun
tidak ada payload balasan yang dihasilkan, sehingga kegagalan model/penyedia tetap menaikkan penghitung
kesalahan dan memicu notifikasi kegagalan.

## Penjadwalan

### Pekerjaan sekali jalan

`--at <datetime>` menjadwalkan eksekusi sekali jalan. Datetime tanpa offset diperlakukan sebagai UTC kecuali Anda juga meneruskan `--tz <iana>`, yang menafsirkan waktu jam dinding dalam zona waktu yang diberikan.

<Note>
Pekerjaan sekali jalan dihapus setelah berhasil secara default. Gunakan `--keep-after-run` untuk mempertahankannya.
</Note>

### Pekerjaan berulang

Pekerjaan berulang menggunakan backoff percobaan ulang eksponensial setelah kesalahan berturut-turut: 30d, 1m, 5m, 15m, 60m. Jadwal kembali normal setelah eksekusi berikutnya berhasil.

Eksekusi yang dilewati dilacak terpisah dari kesalahan eksekusi. Eksekusi tersebut tidak memengaruhi backoff percobaan ulang, tetapi `openclaw cron edit <job-id> --failure-alert-include-skipped` dapat memilih agar peringatan kegagalan menyertakan notifikasi berulang untuk eksekusi yang dilewati.

Untuk pekerjaan terisolasi yang menargetkan penyedia model lokal yang dikonfigurasi, cron menjalankan preflight penyedia ringan sebelum memulai giliran agen. Penyedia local loopback, jaringan privat, dan `.local` `api: "ollama"` diperiksa di `/api/tags`; penyedia lokal yang kompatibel dengan OpenAI seperti vLLM, SGLang, dan LM Studio diperiksa di `/models`. Jika endpoint tidak dapat dijangkau, eksekusi dicatat sebagai `skipped` dan dicoba ulang pada jadwal berikutnya; endpoint mati yang cocok di-cache selama 5 menit untuk mencegah banyak pekerjaan membanjiri server lokal yang sama.

Catatan: definisi pekerjaan cron berada di `jobs.json`, sedangkan status runtime tertunda berada di `jobs-state.json`. Jika `jobs.json` diedit secara eksternal, Gateway memuat ulang jadwal yang berubah dan membersihkan slot tertunda yang usang; penulisan ulang yang hanya mengubah pemformatan tidak membersihkan slot tertunda.

### Eksekusi manual

`openclaw cron run` kembali segera setelah eksekusi manual diantrekan. Respons berhasil menyertakan `{ ok: true, enqueued: true, runId }`. Gunakan `openclaw cron runs --id <job-id>` untuk mengikuti hasil akhirnya.

<Note>
`openclaw cron run <job-id>` menjalankan paksa secara default. Gunakan `--due` untuk mempertahankan perilaku lama "hanya jalankan jika sudah jatuh tempo".
</Note>

## Model

`cron add|edit --model <ref>` memilih model yang diizinkan untuk pekerjaan.

<Warning>
Jika model tidak diizinkan atau tidak dapat diselesaikan, cron menggagalkan eksekusi dengan kesalahan validasi eksplisit alih-alih kembali ke pilihan model agen atau default milik pekerjaan.
</Warning>

Cron `--model` adalah **utama pekerjaan**, bukan penggantian `/model` sesi chat. Artinya:

- Fallback model yang dikonfigurasi tetap berlaku saat model pekerjaan yang dipilih gagal.
- Payload per pekerjaan `fallbacks` menggantikan daftar fallback yang dikonfigurasi saat ada.
- Daftar fallback per pekerjaan yang kosong (`fallbacks: []` dalam payload/API pekerjaan) membuat eksekusi cron ketat.
- Saat pekerjaan memiliki `--model` tetapi tidak ada daftar fallback yang dikonfigurasi, OpenClaw meneruskan penggantian fallback kosong eksplisit sehingga model utama agen tidak ditambahkan sebagai target percobaan ulang tersembunyi.

### Presedensi model cron terisolasi

Cron terisolasi menyelesaikan model aktif dalam urutan ini:

1. Penggantian hook Gmail.
2. `--model` per pekerjaan.
3. Penggantian model sesi cron tersimpan (saat pengguna memilihnya).
4. Pilihan model agen atau default.

### Mode cepat

Mode cepat cron terisolasi mengikuti pilihan model langsung yang diselesaikan. Konfigurasi model `params.fastMode` berlaku secara default, tetapi penggantian `fastMode` sesi tersimpan tetap mengungguli konfigurasi.

### Percobaan ulang pergantian model langsung

Jika eksekusi terisolasi melempar `LiveSessionModelSwitchError`, cron mempertahankan penyedia dan model yang dialihkan (serta penggantian profil autentikasi yang dialihkan saat ada) untuk eksekusi aktif sebelum mencoba ulang. Loop percobaan ulang luar dibatasi hingga dua percobaan ulang pergantian setelah upaya awal, lalu dibatalkan alih-alih berulang selamanya.

## Output eksekusi dan penolakan

### Supresi pengakuan usang

Giliran cron terisolasi menekan balasan yang hanya berupa pengakuan usang. Jika hasil pertama hanya pembaruan status sementara dan tidak ada eksekusi subagen turunan yang bertanggung jawab atas jawaban akhir, cron meminta ulang satu kali untuk hasil sebenarnya sebelum pengiriman.

### Supresi token senyap

Jika eksekusi cron terisolasi hanya mengembalikan token senyap (`NO_REPLY` atau `no_reply`), cron menekan pengiriman keluar langsung dan jalur ringkasan antrean cadangan, sehingga tidak ada yang diposting kembali ke chat.

### Penolakan terstruktur

Eksekusi cron terisolasi lebih memilih metadata penolakan eksekusi terstruktur dari eksekusi tertanam, lalu kembali ke penanda penolakan yang dikenal dalam output akhir, seperti `SYSTEM_RUN_DENIED`, `INVALID_REQUEST`, dan frasa penolakan pengikatan persetujuan.

`cron list` dan riwayat eksekusi menampilkan alasan penolakan alih-alih melaporkan perintah yang diblokir sebagai `ok`.

## Retensi

Retensi dan pemangkasan dikontrol dalam konfigurasi:

- `cron.sessionRetention` (default `24h`) memangkas sesi eksekusi terisolasi yang selesai.
- `cron.runLog.maxBytes` dan `cron.runLog.keepLines` memangkas `~/.openclaw/cron/runs/<jobId>.jsonl`.

## Memigrasikan pekerjaan lama

<Note>
Jika Anda memiliki pekerjaan cron dari sebelum format pengiriman dan penyimpanan saat ini, jalankan `openclaw doctor --fix`. Doctor menormalkan kolom cron lama (`jobId`, `schedule.cron`, kolom pengiriman tingkat atas termasuk `threadId` lama, alias pengiriman `provider` payload) dan memigrasikan pekerjaan fallback webhook sederhana `notify: true` ke pengiriman webhook eksplisit saat `cron.webhook` dikonfigurasi.
</Note>

## Edit umum

Perbarui pengaturan pengiriman tanpa mengubah pesan:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Nonaktifkan pengiriman untuk pekerjaan terisolasi:

```bash
openclaw cron edit <job-id> --no-deliver
```

Aktifkan konteks bootstrap ringan untuk pekerjaan terisolasi:

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

`--light-context` hanya berlaku untuk pekerjaan giliran agen terisolasi. Untuk eksekusi cron, mode ringan menjaga konteks bootstrap tetap kosong alih-alih menyuntikkan set bootstrap workspace penuh.

## Perintah admin umum

Eksekusi manual dan inspeksi:

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

Entri `cron runs` menyertakan diagnostik pengiriman dengan target cron yang dimaksud, target yang diselesaikan, pengiriman alat pesan, penggunaan fallback, dan status terkirim.

Penargetan ulang agen dan sesi:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` memperingatkan saat `--agent` dihilangkan pada pekerjaan giliran agen dan kembali ke agen default (`main`). Teruskan `--agent <id>` saat pembuatan untuk menyematkan agen tertentu.

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
