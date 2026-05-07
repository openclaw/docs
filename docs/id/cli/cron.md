---
read_when:
    - Anda menginginkan pekerjaan terjadwal dan pengaktifan
    - Anda sedang men-debug eksekusi Cron dan log
summary: Referensi CLI untuk `openclaw cron` (menjadwalkan dan menjalankan pekerjaan latar belakang)
title: Cron
x-i18n:
    generated_at: "2026-05-07T01:50:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4b6c894cc4f2a7d86b67b2b5bd7c6338dc442af09befed83117567b3a254fe9
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
    - `isolated` membuat transkrip baru dan id sesi untuk setiap eksekusi.
    - `current` mengikat ke sesi aktif pada waktu pembuatan.
    - `session:<id>` menyematkan ke kunci sesi persisten eksplisit.

  </Accordion>
  <Accordion title="Semantik sesi terisolasi">
    Eksekusi terisolasi mengatur ulang konteks percakapan sekitar. Perutean channel dan grup, kebijakan kirim/antre, elevasi, origin, dan pengikatan runtime ACP diatur ulang untuk eksekusi baru. Preferensi aman serta model atau override auth yang dipilih pengguna secara eksplisit dapat dibawa lintas eksekusi.
  </Accordion>
</AccordionGroup>

## Pengiriman

`openclaw cron list` dan `openclaw cron show <job-id>` menampilkan pratinjau rute pengiriman yang sudah diselesaikan. Untuk `channel: "last"`, pratinjau menunjukkan apakah rute diselesaikan dari sesi utama atau sesi saat ini, atau akan gagal tertutup.

Target berprefiks penyedia dapat memperjelas channel pengumuman yang belum terselesaikan. Misalnya, `to: "telegram:123"` memilih Telegram saat `delivery.channel` dihilangkan atau `last`. Hanya prefiks yang diiklankan oleh plugin yang dimuat yang menjadi pemilih penyedia. Jika `delivery.channel` eksplisit, prefiks harus cocok dengan channel tersebut; `channel: "whatsapp"` dengan `to: "telegram:123"` ditolak. Prefiks layanan seperti `imessage:` dan `sms:` tetap menjadi sintaks target milik channel.

<Note>
Tugas `cron add` terisolasi secara default memakai pengiriman `--announce`. Gunakan `--no-deliver` untuk menjaga keluaran tetap internal. `--deliver` tetap ada sebagai alias usang untuk `--announce`.
</Note>

### Kepemilikan pengiriman

Pengiriman chat Cron terisolasi dibagi antara agen dan runner:

- Agen dapat mengirim langsung menggunakan tool `message` saat rute chat tersedia.
- `announce` mengirim fallback balasan akhir hanya saat agen tidak mengirim langsung ke target yang diselesaikan.
- `webhook` memposting payload selesai ke URL.
- `none` menonaktifkan pengiriman fallback runner.

`--announce` adalah pengiriman fallback runner untuk balasan akhir. `--no-deliver` menonaktifkan fallback itu tetapi tidak menghapus tool `message` agen saat rute chat tersedia.

Pengingat yang dibuat dari chat aktif mempertahankan target pengiriman chat langsung untuk pengiriman fallback announce. Kunci sesi internal dapat berupa huruf kecil; jangan gunakan sebagai sumber kebenaran untuk ID penyedia yang peka huruf besar-kecil seperti ID ruang Matrix.

### Pengiriman kegagalan

Notifikasi kegagalan diselesaikan dalam urutan ini:

1. `delivery.failureDestination` pada tugas.
2. `cron.failureDestination` global.
3. Target announce utama tugas (saat tidak ada tujuan kegagalan eksplisit yang ditetapkan).

<Note>
Tugas sesi utama hanya boleh menggunakan `delivery.failureDestination` saat mode pengiriman utama adalah `webhook`. Tugas terisolasi menerimanya di semua mode.
</Note>

Catatan: eksekusi Cron terisolasi memperlakukan kegagalan agen tingkat eksekusi sebagai error tugas meskipun
tidak ada payload balasan yang dihasilkan, sehingga kegagalan model/penyedia tetap menaikkan
penghitung error dan memicu notifikasi kegagalan.

## Penjadwalan

### Tugas sekali jalan

`--at <datetime>` menjadwalkan eksekusi sekali jalan. Datetime tanpa offset diperlakukan sebagai UTC kecuali Anda juga meneruskan `--tz <iana>`, yang menafsirkan waktu jam dinding dalam zona waktu yang diberikan.

<Note>
Tugas sekali jalan dihapus setelah berhasil secara default. Gunakan `--keep-after-run` untuk mempertahankannya.
</Note>

### Tugas berulang

Tugas berulang menggunakan backoff percobaan ulang eksponensial setelah error beruntun: 30d, 1m, 5m, 15m, 60m. Jadwal kembali normal setelah eksekusi berhasil berikutnya.

Eksekusi yang dilewati dilacak terpisah dari error eksekusi. Eksekusi tersebut tidak memengaruhi backoff percobaan ulang, tetapi `openclaw cron edit <job-id> --failure-alert-include-skipped` dapat mengikutsertakan peringatan kegagalan ke notifikasi eksekusi-terlewat berulang.

Untuk tugas terisolasi yang menargetkan penyedia model lokal yang dikonfigurasi, Cron menjalankan preflight penyedia ringan sebelum memulai giliran agen. Penyedia local loopback, jaringan pribadi, dan `.local` `api: "ollama"` diprobe di `/api/tags`; penyedia lokal yang kompatibel dengan OpenAI seperti vLLM, SGLang, dan LM Studio diprobe di `/models`. Jika endpoint tidak dapat dijangkau, eksekusi dicatat sebagai `skipped` dan dicoba ulang pada jadwal berikutnya; endpoint mati yang cocok di-cache selama 5 menit untuk menghindari banyak tugas menghantam server lokal yang sama.

Catatan: definisi tugas Cron berada di `jobs.json`, sementara status runtime tertunda berada di `jobs-state.json`. Jika `jobs.json` diedit secara eksternal, Gateway memuat ulang jadwal yang berubah dan membersihkan slot tertunda yang usang; penulisan ulang yang hanya memformat tidak membersihkan slot tertunda.

### Eksekusi manual

`openclaw cron run` kembali segera setelah eksekusi manual diantrekan. Respons berhasil menyertakan `{ ok: true, enqueued: true, runId }`. Gunakan `openclaw cron runs --id <job-id>` untuk mengikuti hasil akhirnya.

<Note>
`openclaw cron run <job-id>` menjalankan paksa secara default. Gunakan `--due` untuk mempertahankan perilaku lama "hanya jalankan jika jatuh tempo".
</Note>

## Model

`cron add|edit --model <ref>` memilih model yang diizinkan untuk tugas.

<Warning>
Jika model tidak diizinkan atau tidak dapat diselesaikan, Cron menggagalkan eksekusi dengan error validasi eksplisit alih-alih fallback ke agen tugas atau pilihan model default.
</Warning>

Cron `--model` adalah **utama tugas**, bukan override `/model` sesi chat. Artinya:

- Fallback model yang dikonfigurasi tetap berlaku saat model tugas yang dipilih gagal.
- Payload per tugas `fallbacks` mengganti daftar fallback yang dikonfigurasi saat ada.
- Daftar fallback per tugas yang kosong (`fallbacks: []` dalam payload/API tugas) membuat eksekusi Cron ketat.
- Saat tugas memiliki `--model` tetapi tidak ada daftar fallback yang dikonfigurasi, OpenClaw meneruskan override fallback kosong eksplisit sehingga model utama agen tidak ditambahkan sebagai target percobaan ulang tersembunyi.

### Prioritas model Cron terisolasi

Cron terisolasi menyelesaikan model aktif dalam urutan ini:

1. Override Gmail-hook.
2. `--model` per tugas.
3. Override model sesi Cron tersimpan (saat pengguna memilihnya).
4. Pilihan model agen atau default.

### Mode cepat

Mode cepat Cron terisolasi mengikuti pilihan model langsung yang diselesaikan. Konfigurasi model `params.fastMode` berlaku secara default, tetapi override sesi tersimpan `fastMode` tetap mengalahkan konfigurasi.

### Percobaan ulang pergantian model langsung

Jika eksekusi terisolasi melempar `LiveSessionModelSwitchError`, Cron mempertahankan penyedia dan model yang diganti (serta override profil auth yang diganti saat ada) untuk eksekusi aktif sebelum mencoba ulang. Loop percobaan ulang luar dibatasi hingga dua percobaan ulang pergantian setelah upaya awal, lalu batal alih-alih berulang selamanya.

## Keluaran eksekusi dan penolakan

### Supresi pengakuan usang

Giliran Cron terisolasi menekan balasan khusus pengakuan yang usang. Jika hasil pertama hanyalah pembaruan status sementara dan tidak ada eksekusi subagen turunan yang bertanggung jawab atas jawaban akhir, Cron meminta ulang sekali untuk hasil sebenarnya sebelum pengiriman.

### Supresi token senyap

Jika eksekusi Cron terisolasi hanya mengembalikan token senyap (`NO_REPLY` atau `no_reply`), Cron menekan pengiriman keluar langsung dan jalur ringkasan antrean fallback, sehingga tidak ada yang diposting kembali ke chat.

### Penolakan terstruktur

Eksekusi Cron terisolasi lebih memilih metadata penolakan eksekusi terstruktur dari eksekusi tertanam, lalu fallback ke penanda penolakan yang dikenal dalam keluaran akhir, seperti `SYSTEM_RUN_DENIED`, `INVALID_REQUEST`, dan frasa penolakan pengikatan persetujuan.

`cron list` dan riwayat eksekusi menampilkan alasan penolakan alih-alih melaporkan perintah yang diblokir sebagai `ok`.

## Retensi

Retensi dan pruning dikendalikan dalam konfigurasi:

- `cron.sessionRetention` (default `24h`) memangkas sesi eksekusi terisolasi yang selesai.
- `cron.runLog.maxBytes` dan `cron.runLog.keepLines` memangkas `~/.openclaw/cron/runs/<jobId>.jsonl`.

## Memigrasikan tugas lama

<Note>
Jika Anda memiliki tugas Cron dari sebelum format pengiriman dan penyimpanan saat ini, jalankan `openclaw doctor --fix`. Doctor menormalkan field Cron lama (`jobId`, `schedule.cron`, field pengiriman tingkat atas termasuk `threadId` lama, alias pengiriman `provider` payload) dan memigrasikan tugas fallback webhook sederhana `notify: true` ke pengiriman webhook eksplisit saat `cron.webhook` dikonfigurasi.

Doctor juga menghapus sentinel `payload.model` Cron yang dipertahankan seperti `"default"`, `"null"`, string kosong, dan JSON `null`. Runtime Cron tetap memperlakukan string `payload.model` yang tidak kosong sebagai override model eksplisit dan memvalidasinya terhadap `agents.defaults.models`; hilangkan kunci model saat tugas harus menggunakan pilihan model agen/default.
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

`--light-context` hanya berlaku untuk tugas giliran-agen terisolasi. Untuk eksekusi Cron, mode ringan menjaga konteks bootstrap tetap kosong alih-alih menyuntikkan set bootstrap workspace lengkap.

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

`openclaw cron list` menampilkan semua tugas yang cocok secara default. Teruskan `--agent <id>` untuk hanya menampilkan tugas yang id agen ternormalisasi efektifnya cocok; tugas tanpa id agen tersimpan dihitung sebagai agen default yang dikonfigurasi.

Entri `cron runs` menyertakan diagnostik pengiriman dengan target Cron yang dimaksud, target yang diselesaikan, pengiriman tool pesan, penggunaan fallback, dan status terkirim.

Penargetan ulang agen dan sesi:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` memperingatkan saat `--agent` dihilangkan pada tugas giliran-agen dan fallback ke agen default (`main`). Teruskan `--agent <id>` saat pembuatan untuk menyematkan agen tertentu.

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
