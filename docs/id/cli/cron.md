---
read_when:
    - Anda menginginkan tugas terjadwal dan pengaktifan
    - Anda sedang men-debug eksekusi Cron dan log
summary: Referensi CLI untuk `openclaw cron` (menjadwalkan dan menjalankan pekerjaan latar belakang)
title: Cron
x-i18n:
    generated_at: "2026-05-02T09:15:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 298ac3fc868462eb301febbc1aa5296d8087cad7fdc466870487081444c5856f
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
  <Accordion title="Session keys">
    - `main` mengikat ke sesi utama agen.
    - `isolated` membuat transkrip dan id sesi baru untuk setiap eksekusi.
    - `current` mengikat ke sesi aktif pada waktu pembuatan.
    - `session:<id>` menyematkan ke kunci sesi persisten eksplisit.

  </Accordion>
  <Accordion title="Isolated session semantics">
    Eksekusi terisolasi mengatur ulang konteks percakapan sekitar. Perutean kanal dan grup, kebijakan kirim/antre, elevasi, asal, dan pengikatan runtime ACP diatur ulang untuk eksekusi baru. Preferensi aman dan model yang dipilih pengguna secara eksplisit atau penggantian auth dapat dibawa lintas eksekusi.
  </Accordion>
</AccordionGroup>

## Pengiriman

`openclaw cron list` dan `openclaw cron show <job-id>` mempratinjau rute pengiriman yang diselesaikan. Untuk `channel: "last"`, pratinjau menampilkan apakah rute diselesaikan dari sesi utama atau sesi saat ini, atau akan gagal tertutup.

Target berprefiks penyedia dapat membedakan kanal pengumuman yang belum terselesaikan. Misalnya, `to: "telegram:123"` memilih Telegram saat `delivery.channel` dihilangkan atau `last`. Hanya prefiks yang diiklankan oleh plugin yang dimuat yang menjadi pemilih penyedia. Jika `delivery.channel` eksplisit, prefiks harus cocok dengan kanal tersebut; `channel: "whatsapp"` dengan `to: "telegram:123"` ditolak. Prefiks layanan seperti `imessage:` dan `sms:` tetap menjadi sintaks target milik kanal.

<Note>
Pekerjaan `cron add` terisolasi secara default menggunakan pengiriman `--announce`. Gunakan `--no-deliver` untuk menjaga keluaran tetap internal. `--deliver` tetap ada sebagai alias yang tidak digunakan lagi untuk `--announce`.
</Note>

### Kepemilikan pengiriman

Pengiriman chat Cron terisolasi dibagi antara agen dan runner:

- Agen dapat mengirim langsung menggunakan alat `message` saat rute chat tersedia.
- `announce` mengirim cadangan balasan akhir hanya saat agen tidak mengirim langsung ke target yang diselesaikan.
- `webhook` memposting payload selesai ke URL.
- `none` menonaktifkan pengiriman cadangan runner.

`--announce` adalah pengiriman cadangan runner untuk balasan akhir. `--no-deliver` menonaktifkan cadangan tersebut tetapi tidak menghapus alat `message` agen saat rute chat tersedia.

Pengingat yang dibuat dari chat aktif mempertahankan target pengiriman chat langsung untuk pengiriman pengumuman cadangan. Kunci sesi internal dapat berupa huruf kecil; jangan gunakan sebagai sumber kebenaran untuk ID penyedia yang peka huruf besar/kecil seperti ID ruang Matrix.

### Pengiriman kegagalan

Notifikasi kegagalan diselesaikan dalam urutan ini:

1. `delivery.failureDestination` pada pekerjaan.
2. `cron.failureDestination` global.
3. Target pengumuman utama pekerjaan (saat tidak ada tujuan kegagalan eksplisit yang diatur).

<Note>
Pekerjaan sesi utama hanya dapat menggunakan `delivery.failureDestination` saat mode pengiriman utama adalah `webhook`. Pekerjaan terisolasi menerimanya dalam semua mode.
</Note>

Catatan: eksekusi Cron terisolasi memperlakukan kegagalan agen tingkat eksekusi sebagai kesalahan pekerjaan meskipun
tidak ada payload balasan yang dihasilkan, sehingga kegagalan model/penyedia tetap menambah penghitung
kesalahan dan memicu notifikasi kegagalan.

## Penjadwalan

### Pekerjaan sekali jalan

`--at <datetime>` menjadwalkan eksekusi sekali jalan. Datetime tanpa offset diperlakukan sebagai UTC kecuali Anda juga meneruskan `--tz <iana>`, yang menafsirkan waktu jam-dinding di zona waktu yang diberikan.

<Note>
Pekerjaan sekali jalan dihapus setelah berhasil secara default. Gunakan `--keep-after-run` untuk mempertahankannya.
</Note>

### Pekerjaan berulang

Pekerjaan berulang menggunakan backoff percobaan ulang eksponensial setelah kesalahan beruntun: 30d, 1m, 5m, 15m, 60m. Jadwal kembali normal setelah eksekusi berhasil berikutnya.

Eksekusi yang dilewati dilacak terpisah dari kesalahan eksekusi. Eksekusi tersebut tidak memengaruhi backoff percobaan ulang, tetapi `openclaw cron edit <job-id> --failure-alert-include-skipped` dapat mengikutsertakan peringatan kegagalan dalam notifikasi eksekusi dilewati berulang.

Untuk pekerjaan terisolasi yang menargetkan penyedia model lokal yang dikonfigurasi, Cron menjalankan preflight penyedia ringan sebelum memulai giliran agen. Penyedia loopback, jaringan privat, dan `.local` `api: "ollama"` diperiksa di `/api/tags`; penyedia kompatibel OpenAI lokal seperti vLLM, SGLang, dan LM Studio diperiksa di `/models`. Jika endpoint tidak dapat dijangkau, eksekusi dicatat sebagai `skipped` dan dicoba lagi pada jadwal berikutnya; endpoint mati yang cocok disimpan dalam cache selama 5 menit untuk menghindari banyak pekerjaan menghantam server lokal yang sama.

Catatan: definisi pekerjaan Cron berada di `jobs.json`, sedangkan status runtime tertunda berada di `jobs-state.json`. Jika `jobs.json` diedit secara eksternal, Gateway memuat ulang jadwal yang berubah dan membersihkan slot tertunda yang basi; penulisan ulang hanya pemformatan tidak membersihkan slot tertunda.

### Eksekusi manual

`openclaw cron run` kembali segera setelah eksekusi manual diantrekan. Respons berhasil menyertakan `{ ok: true, enqueued: true, runId }`. Gunakan `openclaw cron runs --id <job-id>` untuk mengikuti hasil akhirnya.

<Note>
`openclaw cron run <job-id>` menjalankan paksa secara default. Gunakan `--due` untuk mempertahankan perilaku lama "hanya jalankan jika jatuh tempo".
</Note>

## Model

`cron add|edit --model <ref>` memilih model yang diizinkan untuk pekerjaan.

<Warning>
Jika model tidak diizinkan atau tidak dapat diselesaikan, Cron menggagalkan eksekusi dengan kesalahan validasi eksplisit alih-alih beralih ke pemilihan model agen atau default pekerjaan.
</Warning>

Cron `--model` adalah **utama pekerjaan**, bukan penggantian `/model` sesi chat. Artinya:

- Fallback model yang dikonfigurasi tetap berlaku saat model pekerjaan yang dipilih gagal.
- Payload per pekerjaan `fallbacks` menggantikan daftar fallback yang dikonfigurasi saat ada.
- Daftar fallback per pekerjaan kosong (`fallbacks: []` dalam payload/API pekerjaan) membuat eksekusi Cron ketat.
- Saat pekerjaan memiliki `--model` tetapi tidak ada daftar fallback yang dikonfigurasi, OpenClaw meneruskan penggantian fallback kosong eksplisit sehingga agen utama tidak ditambahkan sebagai target percobaan ulang tersembunyi.

### Prioritas model Cron terisolasi

Cron terisolasi menyelesaikan model aktif dalam urutan ini:

1. Penggantian hook Gmail.
2. `--model` per pekerjaan.
3. Penggantian model sesi Cron tersimpan (saat pengguna memilihnya).
4. Pemilihan model agen atau default.

### Mode cepat

Mode cepat Cron terisolasi mengikuti pemilihan model langsung yang diselesaikan. Konfigurasi model `params.fastMode` berlaku secara default, tetapi penggantian `fastMode` sesi tersimpan tetap mengalahkan konfigurasi.

### Percobaan ulang penggantian model langsung

Jika eksekusi terisolasi melempar `LiveSessionModelSwitchError`, Cron mempertahankan penyedia dan model yang dialihkan (serta penggantian profil auth yang dialihkan saat ada) untuk eksekusi aktif sebelum mencoba lagi. Loop percobaan ulang luar dibatasi hingga dua percobaan ulang penggantian setelah upaya awal, lalu dibatalkan alih-alih berulang tanpa akhir.

## Keluaran eksekusi dan penolakan

### Supresi pengakuan basi

Giliran Cron terisolasi menekan balasan hanya-pengakuan yang basi. Jika hasil pertama hanyalah pembaruan status sementara dan tidak ada eksekusi subagen turunan yang bertanggung jawab atas jawaban akhirnya, Cron meminta ulang satu kali untuk hasil nyata sebelum pengiriman.

### Supresi token senyap

Jika eksekusi Cron terisolasi hanya mengembalikan token senyap (`NO_REPLY` atau `no_reply`), Cron menekan pengiriman keluar langsung dan jalur ringkasan antrean cadangan, sehingga tidak ada yang diposting kembali ke chat.

### Penolakan terstruktur

Eksekusi Cron terisolasi lebih memilih metadata penolakan eksekusi terstruktur dari eksekusi tertanam, lalu beralih ke penanda penolakan yang dikenal dalam keluaran akhir, seperti `SYSTEM_RUN_DENIED`, `INVALID_REQUEST`, dan frasa penolakan pengikatan persetujuan.

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

`--light-context` hanya berlaku untuk pekerjaan giliran agen terisolasi. Untuk eksekusi Cron, mode ringan menjaga konteks bootstrap tetap kosong alih-alih menyuntikkan set bootstrap ruang kerja lengkap.

## Perintah admin umum

Eksekusi manual dan inspeksi:

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

Entri `cron runs` menyertakan diagnostik pengiriman dengan target Cron yang dimaksud, target yang diselesaikan, pengiriman alat pesan, penggunaan fallback, dan status terkirim.

Penargetan ulang agen dan sesi:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` memperingatkan saat `--agent` dihilangkan pada pekerjaan giliran agen dan beralih ke agen default (`main`). Teruskan `--agent <id>` saat pembuatan untuk menyematkan agen tertentu.

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
