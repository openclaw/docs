---
read_when:
    - Anda menginginkan pekerjaan terjadwal dan pemicu bangun
    - Anda sedang men-debug eksekusi dan log Cron
summary: Referensi CLI untuk `openclaw cron` (menjadwalkan dan menjalankan pekerjaan latar belakang)
title: Cron
x-i18n:
    generated_at: "2026-05-05T06:16:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 804efac75b8653b03cec197247be847498e084b50b00fb7bd3fbd94067ef25d4
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
    - `isolated` membuat transkrip dan id sesi baru untuk setiap eksekusi.
    - `current` mengikat ke sesi aktif pada waktu pembuatan.
    - `session:<id>` menyematkan ke kunci sesi persisten eksplisit.

  </Accordion>
  <Accordion title="Semantik sesi terisolasi">
    Eksekusi terisolasi mereset konteks percakapan sekitar. Perutean saluran dan grup, kebijakan kirim/antre, elevasi, asal, dan pengikatan runtime ACP direset untuk eksekusi baru. Preferensi aman dan penggantian model atau auth yang dipilih pengguna secara eksplisit dapat dibawa lintas eksekusi.
  </Accordion>
</AccordionGroup>

## Pengiriman

`openclaw cron list` dan `openclaw cron show <job-id>` mempratinjau rute pengiriman yang diselesaikan. Untuk `channel: "last"`, pratinjau menampilkan apakah rute diselesaikan dari sesi utama atau saat ini, atau akan gagal tertutup.

Target berprefiks penyedia dapat membedakan saluran pengumuman yang belum terselesaikan. Misalnya, `to: "telegram:123"` memilih Telegram ketika `delivery.channel` dihilangkan atau `last`. Hanya prefiks yang diiklankan oleh plugin yang dimuat yang menjadi pemilih penyedia. Jika `delivery.channel` eksplisit, prefiks harus cocok dengan saluran tersebut; `channel: "whatsapp"` dengan `to: "telegram:123"` ditolak. Prefiks layanan seperti `imessage:` dan `sms:` tetap menjadi sintaks target milik saluran.

<Note>
Pekerjaan `cron add` terisolasi default ke pengiriman `--announce`. Gunakan `--no-deliver` agar output tetap internal. `--deliver` tetap ada sebagai alias yang tidak digunakan lagi untuk `--announce`.
</Note>

### Kepemilikan pengiriman

Pengiriman chat Cron terisolasi dibagi antara agen dan runner:

- Agen dapat mengirim langsung menggunakan alat `message` ketika rute chat tersedia.
- `announce` mengirim fallback balasan akhir hanya ketika agen tidak mengirim langsung ke target yang diselesaikan.
- `webhook` memposting payload yang selesai ke URL.
- `none` menonaktifkan pengiriman fallback runner.

`--announce` adalah pengiriman fallback runner untuk balasan akhir. `--no-deliver` menonaktifkan fallback tersebut tetapi tidak menghapus alat `message` agen ketika rute chat tersedia.

Pengingat yang dibuat dari chat aktif mempertahankan target pengiriman chat langsung untuk pengiriman pengumuman fallback. Kunci sesi internal mungkin huruf kecil; jangan menggunakannya sebagai sumber kebenaran untuk ID penyedia yang peka huruf besar-kecil seperti ID room Matrix.

### Pengiriman kegagalan

Notifikasi kegagalan diselesaikan dalam urutan ini:

1. `delivery.failureDestination` pada pekerjaan.
2. `cron.failureDestination` global.
3. Target pengumuman utama pekerjaan (ketika tidak ada tujuan kegagalan eksplisit yang ditetapkan).

<Note>
Pekerjaan sesi utama hanya boleh menggunakan `delivery.failureDestination` ketika mode pengiriman utama adalah `webhook`. Pekerjaan terisolasi menerimanya di semua mode.
</Note>

Catatan: eksekusi Cron terisolasi memperlakukan kegagalan agen tingkat eksekusi sebagai kesalahan pekerjaan meskipun
tidak ada payload balasan yang dihasilkan, sehingga kegagalan model/penyedia tetap menaikkan penghitung
kesalahan dan memicu notifikasi kegagalan.

## Penjadwalan

### Pekerjaan satu kali

`--at <datetime>` menjadwalkan eksekusi satu kali. Datetime tanpa offset diperlakukan sebagai UTC kecuali Anda juga meneruskan `--tz <iana>`, yang menafsirkan waktu jam dinding di zona waktu yang diberikan.

<Note>
Pekerjaan satu kali dihapus setelah berhasil secara default. Gunakan `--keep-after-run` untuk mempertahankannya.
</Note>

### Pekerjaan berulang

Pekerjaan berulang menggunakan backoff retry eksponensial setelah kesalahan berurutan: 30d, 1m, 5m, 15m, 60m. Jadwal kembali normal setelah eksekusi berhasil berikutnya.

Eksekusi yang dilewati dilacak terpisah dari kesalahan eksekusi. Eksekusi tersebut tidak memengaruhi backoff retry, tetapi `openclaw cron edit <job-id> --failure-alert-include-skipped` dapat mengikutsertakan peringatan kegagalan ke notifikasi eksekusi yang dilewati berulang.

Untuk pekerjaan terisolasi yang menargetkan penyedia model lokal yang dikonfigurasi, Cron menjalankan preflight penyedia ringan sebelum memulai giliran agen. Penyedia `api: "ollama"` local loopback, jaringan privat, dan `.local` diperiksa di `/api/tags`; penyedia kompatibel OpenAI lokal seperti vLLM, SGLang, dan LM Studio diperiksa di `/models`. Jika endpoint tidak dapat dijangkau, eksekusi dicatat sebagai `skipped` dan dicoba ulang pada jadwal berikutnya; endpoint mati yang cocok di-cache selama 5 menit untuk menghindari banyak pekerjaan membanjiri server lokal yang sama.

Catatan: definisi pekerjaan Cron berada di `jobs.json`, sementara status runtime tertunda berada di `jobs-state.json`. Jika `jobs.json` diedit secara eksternal, Gateway memuat ulang jadwal yang berubah dan membersihkan slot tertunda yang usang; penulisan ulang khusus pemformatan tidak membersihkan slot tertunda.

### Eksekusi manual

`openclaw cron run` kembali segera setelah eksekusi manual diantrekan. Respons berhasil menyertakan `{ ok: true, enqueued: true, runId }`. Gunakan `openclaw cron runs --id <job-id>` untuk mengikuti hasil akhirnya.

<Note>
`openclaw cron run <job-id>` menjalankan paksa secara default. Gunakan `--due` untuk mempertahankan perilaku lama "hanya jalankan jika jatuh tempo".
</Note>

## Model

`cron add|edit --model <ref>` memilih model yang diizinkan untuk pekerjaan.

<Warning>
Jika model tidak diizinkan atau tidak dapat diselesaikan, Cron menggagalkan eksekusi dengan kesalahan validasi eksplisit alih-alih fallback ke agen pekerjaan atau pemilihan model default.
</Warning>

Cron `--model` adalah **utama pekerjaan**, bukan penggantian `/model` sesi chat. Artinya:

- Fallback model yang dikonfigurasi tetap berlaku ketika model pekerjaan yang dipilih gagal.
- Payload per pekerjaan `fallbacks` menggantikan daftar fallback yang dikonfigurasi ketika ada.
- Daftar fallback per pekerjaan kosong (`fallbacks: []` dalam payload/API pekerjaan) membuat eksekusi Cron ketat.
- Ketika pekerjaan memiliki `--model` tetapi tidak ada daftar fallback yang dikonfigurasi, OpenClaw meneruskan penggantian fallback kosong eksplisit sehingga model utama agen tidak ditambahkan sebagai target retry tersembunyi.

### Prioritas model Cron terisolasi

Cron terisolasi menyelesaikan model aktif dalam urutan ini:

1. Penggantian hook Gmail.
2. `--model` per pekerjaan.
3. Penggantian model sesi-Cron tersimpan (ketika pengguna memilihnya).
4. Pemilihan model agen atau default.

### Mode cepat

Mode cepat Cron terisolasi mengikuti pemilihan model langsung yang diselesaikan. Konfigurasi model `params.fastMode` berlaku secara default, tetapi penggantian `fastMode` sesi tersimpan tetap menang atas konfigurasi.

### Retry pengalihan model langsung

Jika eksekusi terisolasi melempar `LiveSessionModelSwitchError`, Cron mempertahankan penyedia dan model yang dialihkan (serta penggantian profil auth yang dialihkan ketika ada) untuk eksekusi aktif sebelum mencoba ulang. Loop retry luar dibatasi hingga dua retry pengalihan setelah percobaan awal, lalu dibatalkan alih-alih berulang selamanya.

## Output eksekusi dan penolakan

### Penekanan pengakuan usang

Giliran Cron terisolasi menekan balasan usang yang hanya berupa pengakuan. Jika hasil pertama hanya pembaruan status sementara dan tidak ada eksekusi subagen turunan yang bertanggung jawab atas jawaban akhirnya, Cron meminta ulang satu kali untuk hasil nyata sebelum pengiriman.

### Penekanan token senyap

Jika eksekusi Cron terisolasi hanya mengembalikan token senyap (`NO_REPLY` atau `no_reply`), Cron menekan pengiriman keluar langsung dan jalur ringkasan antrean fallback, sehingga tidak ada yang diposting kembali ke chat.

### Penolakan terstruktur

Eksekusi Cron terisolasi mengutamakan metadata penolakan eksekusi terstruktur dari eksekusi tertanam, lalu fallback ke penanda penolakan yang dikenal dalam output akhir, seperti `SYSTEM_RUN_DENIED`, `INVALID_REQUEST`, dan frasa penolakan pengikatan persetujuan.

`cron list` dan riwayat eksekusi menampilkan alasan penolakan alih-alih melaporkan perintah yang diblokir sebagai `ok`.

## Retensi

Retensi dan pemangkasan dikendalikan dalam konfigurasi:

- `cron.sessionRetention` (default `24h`) memangkas sesi eksekusi terisolasi yang selesai.
- `cron.runLog.maxBytes` dan `cron.runLog.keepLines` memangkas `~/.openclaw/cron/runs/<jobId>.jsonl`.

## Memigrasikan pekerjaan lama

<Note>
Jika Anda memiliki pekerjaan Cron dari sebelum format pengiriman dan penyimpanan saat ini, jalankan `openclaw doctor --fix`. Doctor menormalkan bidang Cron lama (`jobId`, `schedule.cron`, bidang pengiriman tingkat atas termasuk `threadId` lama, alias pengiriman `provider` payload) dan memigrasikan pekerjaan fallback webhook sederhana `notify: true` ke pengiriman webhook eksplisit ketika `cron.webhook` dikonfigurasi.
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

Umumkan ke saluran tertentu:

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

`--light-context` hanya berlaku untuk pekerjaan giliran-agen terisolasi. Untuk eksekusi Cron, mode ringan menjaga konteks bootstrap kosong alih-alih menyuntikkan set bootstrap ruang kerja lengkap.

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

Entri `cron runs` menyertakan diagnostik pengiriman dengan target Cron yang dimaksud, target yang diselesaikan, pengiriman alat pesan, penggunaan fallback, dan status terkirim.

Penargetan ulang agen dan sesi:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` memperingatkan ketika `--agent` dihilangkan pada pekerjaan giliran-agen dan fallback ke agen default (`main`). Teruskan `--agent <id>` pada waktu pembuatan untuk menyematkan agen tertentu.

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
