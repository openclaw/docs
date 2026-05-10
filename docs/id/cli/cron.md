---
read_when:
    - Anda menginginkan tugas terjadwal dan pemicu bangun
    - Anda sedang menelusuri masalah eksekusi Cron dan log
summary: Referensi CLI untuk `openclaw cron` (menjadwalkan dan menjalankan pekerjaan latar belakang)
title: Cron
x-i18n:
    generated_at: "2026-05-10T19:28:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1575213cfcc6cb9991e0aed48722e737d930570ce8527532188b345810982892
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Kelola pekerjaan Cron untuk penjadwal Gateway.

<Tip>
Jalankan `openclaw cron --help` untuk permukaan perintah lengkap. Lihat [Pekerjaan Cron](/id/automation/cron-jobs) untuk panduan konseptual.
</Tip>

## Sesi

`--session` menerima `main`, `isolated`, `current`, atau `session:<id>`.

<AccordionGroup>
  <Accordion title="Kunci sesi">
    - `main` mengikat ke sesi utama agen.
    - `isolated` membuat transkrip baru dan id sesi untuk setiap eksekusi.
    - `current` mengikat ke sesi aktif pada waktu pembuatan.
    - `session:<id>` menetapkan kunci sesi persisten eksplisit.

  </Accordion>
  <Accordion title="Semantik sesi terisolasi">
    Eksekusi terisolasi mereset konteks percakapan sekitar. Perutean kanal dan grup, kebijakan kirim/antre, elevasi, asal, dan pengikatan runtime ACP direset untuk eksekusi baru. Preferensi aman dan model atau penggantian autentikasi yang dipilih pengguna secara eksplisit dapat dibawa melintasi eksekusi.
  </Accordion>
</AccordionGroup>

## Pengiriman

`openclaw cron list` dan `openclaw cron show <job-id>` mempratinjau rute pengiriman yang telah diselesaikan. Untuk `channel: "last"`, pratinjau menunjukkan apakah rute diselesaikan dari sesi utama atau saat ini, atau akan gagal tertutup.

Target berprefiks penyedia dapat memperjelas kanal pengumuman yang belum terselesaikan. Misalnya, `to: "telegram:123"` memilih Telegram saat `delivery.channel` dihilangkan atau `last`. Hanya prefiks yang diiklankan oleh plugin yang dimuat yang menjadi pemilih penyedia. Jika `delivery.channel` eksplisit, prefiks harus cocok dengan kanal tersebut; `channel: "whatsapp"` dengan `to: "telegram:123"` ditolak. Prefiks layanan seperti `imessage:` dan `sms:` tetap menjadi sintaks target milik kanal.

<Note>
Pekerjaan `cron add` terisolasi secara default menggunakan pengiriman `--announce`. Gunakan `--no-deliver` untuk menjaga keluaran tetap internal. `--deliver` tetap tersedia sebagai alias usang untuk `--announce`.
</Note>

### Kepemilikan pengiriman

Pengiriman chat Cron terisolasi dibagi antara agen dan runner:

- Agen dapat mengirim langsung menggunakan alat `message` saat rute chat tersedia.
- `announce` melakukan pengiriman fallback untuk balasan akhir hanya saat agen tidak mengirim langsung ke target yang telah diselesaikan.
- `webhook` memposting payload selesai ke URL.
- `none` menonaktifkan pengiriman fallback runner.

`--announce` adalah pengiriman fallback runner untuk balasan akhir. `--no-deliver` menonaktifkan fallback tersebut tetapi tidak menghapus alat `message` milik agen saat rute chat tersedia.

Pengingat yang dibuat dari chat aktif mempertahankan target pengiriman chat langsung untuk pengiriman pengumuman fallback. Kunci sesi internal dapat berupa huruf kecil; jangan gunakan sebagai sumber kebenaran untuk ID penyedia peka huruf besar-kecil seperti ID ruangan Matrix.

### Pengiriman kegagalan

Notifikasi kegagalan diselesaikan dalam urutan ini:

1. `delivery.failureDestination` pada pekerjaan.
2. `cron.failureDestination` global.
3. Target pengumuman utama pekerjaan (saat tidak ada tujuan kegagalan eksplisit yang ditetapkan).

<Note>
Pekerjaan sesi utama hanya boleh menggunakan `delivery.failureDestination` saat mode pengiriman utama adalah `webhook`. Pekerjaan terisolasi menerimanya di semua mode.
</Note>

Catatan: eksekusi Cron terisolasi memperlakukan kegagalan agen tingkat eksekusi sebagai kesalahan pekerjaan bahkan saat
tidak ada payload balasan yang dihasilkan, sehingga kegagalan model/penyedia tetap menambah penghitung kesalahan
dan memicu notifikasi kegagalan.

Jika eksekusi terisolasi kehabisan waktu sebelum permintaan model pertama, `openclaw cron show`
dan `openclaw cron runs` menyertakan kesalahan spesifik fase seperti
`setup timed out before runner start` atau
`stalled before first model call (last phase: context-engine)`.
Untuk penyedia berbasis CLI, watchdog pra-model tetap aktif sampai giliran CLI eksternal
dimulai, sehingga hambatan pencarian sesi, hook, autentikasi, prompt, dan penyiapan CLI
dilaporkan sebagai kegagalan Cron pra-model.

## Penjadwalan

### Pekerjaan satu kali

`--at <datetime>` menjadwalkan eksekusi satu kali. Datetime tanpa offset diperlakukan sebagai UTC kecuali Anda juga meneruskan `--tz <iana>`, yang menafsirkan waktu jam-dinding dalam zona waktu yang diberikan.

<Note>
Pekerjaan satu kali dihapus setelah berhasil secara default. Gunakan `--keep-after-run` untuk mempertahankannya.
</Note>

### Pekerjaan berulang

Pekerjaan berulang menggunakan backoff percobaan ulang eksponensial setelah kesalahan berturut-turut: 30d, 1m, 5m, 15m, 60m. Jadwal kembali normal setelah eksekusi berikutnya berhasil.

Eksekusi yang dilewati dilacak terpisah dari kesalahan eksekusi. Eksekusi tersebut tidak memengaruhi backoff percobaan ulang, tetapi `openclaw cron edit <job-id> --failure-alert-include-skipped` dapat mengikutsertakan peringatan kegagalan ke notifikasi eksekusi-terlewati berulang.

Untuk pekerjaan terisolasi yang menargetkan penyedia model lokal yang dikonfigurasi, Cron menjalankan preflight penyedia ringan sebelum memulai giliran agen. Penyedia `api: "ollama"` loopback, jaringan privat, dan `.local` diprobe di `/api/tags`; penyedia kompatibel OpenAI lokal seperti vLLM, SGLang, dan LM Studio diprobe di `/models`. Jika endpoint tidak dapat dijangkau, eksekusi dicatat sebagai `skipped` dan dicoba lagi pada jadwal berikutnya; endpoint mati yang cocok di-cache selama 5 menit untuk menghindari banyak pekerjaan membanjiri server lokal yang sama.

Catatan: definisi pekerjaan Cron berada di `jobs.json`, sedangkan status runtime tertunda berada di `jobs-state.json`. Jika `jobs.json` diedit secara eksternal, Gateway memuat ulang jadwal yang berubah dan membersihkan slot tertunda yang usang; penulisan ulang yang hanya mengubah format tidak membersihkan slot tertunda.

### Eksekusi manual

`openclaw cron run` kembali segera setelah eksekusi manual diantrekan. Respons berhasil menyertakan `{ ok: true, enqueued: true, runId }`. Gunakan `openclaw cron runs --id <job-id>` untuk mengikuti hasil akhirnya.

<Note>
`openclaw cron run <job-id>` melakukan eksekusi paksa secara default. Gunakan `--due` untuk mempertahankan perilaku lama "hanya jalankan jika sudah waktunya".
</Note>

## Model

`cron add|edit --model <ref>` memilih model yang diizinkan untuk pekerjaan.

<Warning>
Jika model tidak diizinkan atau tidak dapat diselesaikan, Cron menggagalkan eksekusi dengan kesalahan validasi eksplisit alih-alih fallback ke agen pekerjaan atau pemilihan model default.
</Warning>

`--model` Cron adalah **utama pekerjaan**, bukan penggantian `/model` sesi chat. Artinya:

- Fallback model yang dikonfigurasi tetap berlaku saat model pekerjaan yang dipilih gagal.
- Payload per pekerjaan `fallbacks` menggantikan daftar fallback yang dikonfigurasi saat ada.
- Daftar fallback per pekerjaan kosong (`fallbacks: []` dalam payload/API pekerjaan) membuat eksekusi Cron ketat.
- Saat pekerjaan memiliki `--model` tetapi tidak ada daftar fallback yang dikonfigurasi, OpenClaw meneruskan penggantian fallback kosong eksplisit agar model utama agen tidak ditambahkan sebagai target percobaan ulang tersembunyi.

### Prioritas model Cron terisolasi

Cron terisolasi menyelesaikan model aktif dalam urutan ini:

1. Penggantian hook Gmail.
2. `--model` per pekerjaan.
3. Penggantian model sesi Cron tersimpan (saat pengguna memilihnya).
4. Pemilihan model agen atau default.

### Mode cepat

Mode cepat Cron terisolasi mengikuti pemilihan model live yang telah diselesaikan. Konfigurasi model `params.fastMode` berlaku secara default, tetapi penggantian `fastMode` sesi tersimpan tetap mengungguli konfigurasi.

### Percobaan ulang pergantian model live

Jika eksekusi terisolasi melempar `LiveSessionModelSwitchError`, Cron mempertahankan penyedia dan model yang dialihkan (serta penggantian profil autentikasi yang dialihkan saat ada) untuk eksekusi aktif sebelum mencoba ulang. Loop percobaan ulang luar dibatasi hingga dua percobaan ulang pergantian setelah percobaan awal, lalu dibatalkan alih-alih berulang selamanya.

## Keluaran eksekusi dan penolakan

### Penekanan pengakuan usang

Giliran Cron terisolasi menekan balasan yang hanya berupa pengakuan usang. Jika hasil pertama hanyalah pembaruan status sementara dan tidak ada eksekusi subagen turunan yang bertanggung jawab atas jawaban akhir, Cron meminta ulang sekali untuk hasil sebenarnya sebelum pengiriman.

### Penekanan token senyap

Jika eksekusi Cron terisolasi hanya mengembalikan token senyap (`NO_REPLY` atau `no_reply`), Cron menekan pengiriman keluar langsung maupun jalur ringkasan antrean fallback, sehingga tidak ada yang diposting kembali ke chat.

### Penolakan terstruktur

Eksekusi Cron terisolasi lebih memilih metadata penolakan eksekusi terstruktur dari eksekusi tertanam, lalu fallback ke penanda penolakan yang dikenal dalam keluaran akhir, seperti `SYSTEM_RUN_DENIED`, `INVALID_REQUEST`, dan frasa penolakan pengikatan persetujuan.

`cron list` dan riwayat eksekusi menampilkan alasan penolakan alih-alih melaporkan perintah yang diblokir sebagai `ok`.

## Retensi

Retensi dan pemangkasan dikontrol dalam konfigurasi:

- `cron.sessionRetention` (default `24h`) memangkas sesi eksekusi terisolasi yang selesai.
- `cron.runLog.maxBytes` dan `cron.runLog.keepLines` memangkas `~/.openclaw/cron/runs/<jobId>.jsonl`.

## Memigrasikan pekerjaan lama

<Note>
Jika Anda memiliki pekerjaan Cron dari sebelum format pengiriman dan penyimpanan saat ini, jalankan `openclaw doctor --fix`. Doctor menormalkan bidang Cron lama (`jobId`, `schedule.cron`, bidang pengiriman tingkat atas termasuk `threadId` lama, alias pengiriman `provider` payload) dan memigrasikan pekerjaan fallback webhook sederhana `notify: true` ke pengiriman webhook eksplisit saat `cron.webhook` dikonfigurasi.
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

Umumkan ke kanal tertentu:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Umumkan ke topik forum Telegram:

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

`--light-context` hanya berlaku untuk pekerjaan giliran-agen terisolasi. Untuk eksekusi Cron, mode ringan menjaga konteks bootstrap tetap kosong alih-alih menyuntikkan set bootstrap workspace lengkap.

## Perintah admin umum

Eksekusi manual dan inspeksi:

```bash
openclaw cron list
openclaw cron list --agent ops
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

`openclaw cron list` menampilkan semua pekerjaan yang cocok secara default. Teruskan `--agent <id>` untuk hanya menampilkan pekerjaan yang id agen ternormalisasi efektifnya cocok; pekerjaan tanpa id agen tersimpan dihitung sebagai agen default yang dikonfigurasi.

`cron list --json` dan `cron show <job-id> --json` menyertakan bidang `status` tingkat atas pada setiap pekerjaan, dihitung dari `enabled`, `state.runningAtMs`, dan `state.lastRunStatus`. Nilai: `disabled`, `running`, `ok`, `error`, `skipped`, atau `idle`. Ini mencerminkan kolom status yang dapat dibaca manusia sehingga tooling eksternal dapat membaca status pekerjaan tanpa menghitungnya ulang.

Entri `cron runs` menyertakan diagnostik pengiriman dengan target Cron yang dimaksud, target yang diselesaikan, pengiriman alat pesan, penggunaan fallback, dan status terkirim.

Penargetan ulang agen dan sesi:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` memperingatkan saat `--agent` dihilangkan pada pekerjaan giliran-agen dan fallback ke agen default (`main`). Teruskan `--agent <id>` pada waktu pembuatan untuk menetapkan agen tertentu.

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
