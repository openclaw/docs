---
read_when:
    - Anda menginginkan pekerjaan terjadwal dan pemicu bangun.
    - Anda sedang men-debug eksekusi dan log cron
summary: Referensi CLI untuk `openclaw cron` (menjadwalkan dan menjalankan tugas latar belakang)
title: Cron
x-i18n:
    generated_at: "2026-07-22T01:22:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0368a02283b0a3e107e6f41b71110d571e097461877ed6aea494614feaa092ca
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Kelola tugas Cron untuk penjadwal Gateway.

<Tip>
Jalankan `openclaw cron --help` untuk melihat seluruh cakupan perintah. Lihat [Tugas Cron](/id/automation/cron-jobs) untuk panduan konseptual.
</Tip>

<Note>
Semua mutasi Cron (`add`/`create`, `update`/`edit`, `remove`, `run`) memerlukan `operator.admin`. Eksekusi payload perintah dijalankan secara langsung dalam proses Gateway, bukan sebagai pemanggilan alat `tools.exec` oleh agen; `tools.exec.*` dan persetujuan eksekusi tetap mengatur alat eksekusi yang terlihat oleh model.
</Note>

## Membuat tugas dengan cepat

`openclaw cron create` adalah alias untuk `openclaw cron add`. Untuk tugas baru, letakkan jadwal terlebih dahulu dan prompt setelahnya:

```bash
openclaw cron create "0 7 * * *" \
  "Ringkas pembaruan semalam." \
  --name "Ringkasan pagi" \
  --agent ops
```

Gunakan `--webhook <url>` ketika tugas harus melakukan POST terhadap payload yang telah selesai, alih-alih mengirimkannya ke target obrolan:

```bash
openclaw cron create "0 18 * * 1-5" \
  "Ringkas deployment hari ini sebagai JSON." \
  --name "Ringkasan deployment" \
  --webhook "https://example.invalid/openclaw/cron"
```

Gunakan `--command` untuk tugas deterministik bergaya shell yang berjalan di dalam Cron OpenClaw tanpa memulai eksekusi agen/model terisolasi:

```bash
openclaw cron create "*/15 * * * *" \
  --name "Pemeriksaan kedalaman antrean" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` menyimpan `argv: ["sh", "-lc", <shell>]`. Gunakan `--command-argv '["node","scripts/report.mjs"]'` untuk eksekusi argv yang persis. Tugas perintah menangkap stdout/stderr, mencatat riwayat Cron normal, dan merutekan keluaran melalui mode pengiriman `announce`, `webhook`, atau `none` yang sama dengan tugas terisolasi. Perintah yang hanya mencetak `NO_REPLY` akan disembunyikan.

## Sesi

`--session` menerima `main`, `isolated`, `current`, atau `session:<id>`.

<AccordionGroup>
  <Accordion title="Kunci sesi">
    - `main` terikat ke sesi utama agen.
    - `isolated` membuat transkrip dan ID sesi baru untuk setiap eksekusi.
    - `current` terikat ke sesi aktif pada saat pembuatan.
    - `session:<id>` disematkan ke kunci sesi persisten yang eksplisit.

  </Accordion>
  <Accordion title="Semantik sesi terisolasi">
    Eksekusi terisolasi mereset konteks percakapan sekitar. Perutean kanal dan grup, kebijakan pengiriman/antrean, elevasi, asal, dan pengikatan runtime ACP direset untuk eksekusi baru. Preferensi aman serta penggantian model atau autentikasi yang dipilih pengguna secara eksplisit dapat diteruskan antar-eksekusi.
  </Accordion>
</AccordionGroup>

## Pengiriman

`openclaw cron list` dan `openclaw cron show <job-id>` menampilkan pratinjau rute pengiriman yang telah diselesaikan. Untuk `channel: "last"`, pratinjau menunjukkan apakah rute diselesaikan dari sesi utama atau sesi saat ini, atau akan gagal secara tertutup.

Target dengan awalan penyedia dapat memperjelas kanal pengumuman yang belum diselesaikan. Misalnya, `to: "telegram:123"` memilih Telegram ketika `delivery.channel` dihilangkan atau `last`. Hanya awalan yang diumumkan oleh Plugin yang dimuat yang merupakan pemilih penyedia. Jika `delivery.channel` ditentukan secara eksplisit, awalan harus cocok dengan kanal tersebut; `channel: "whatsapp"` dengan `to: "telegram:123"` akan ditolak. Awalan layanan seperti `imessage:` dan `sms:` tetap merupakan sintaks target yang dimiliki kanal.

<Note>
Tugas `cron add` terisolasi secara default menggunakan pengiriman `--announce`. Gunakan `--no-deliver` agar keluaran tetap internal. `--deliver` tetap tersedia sebagai alias usang untuk `--announce`.
</Note>

### Kepemilikan pengiriman

Pengiriman obrolan Cron terisolasi digunakan bersama oleh agen dan runner:

- Agen dapat mengirim secara langsung menggunakan alat `message` ketika rute obrolan tersedia.
- `announce` mengirimkan balasan akhir sebagai fallback hanya ketika agen tidak mengirim secara langsung ke target yang telah diselesaikan.
- `webhook` mengirimkan payload yang telah selesai ke URL.
- `none` menonaktifkan pengiriman fallback oleh runner.

Gunakan `cron add|create --webhook <url>` atau `cron edit <job-id> --webhook <url>` untuk mengatur pengiriman Webhook. Jangan gabungkan `--webhook` dengan flag pengiriman obrolan seperti `--announce`, `--no-deliver`, `--channel`, `--to`, `--thread-id`, atau `--account`.

`cron edit <job-id>` dapat membatalkan pengaturan masing-masing bidang perutean pengiriman dengan `--clear-channel`, `--clear-to`, `--clear-thread-id`, dan `--clear-account` (masing-masing ditolak ketika digabungkan dengan flag pengaturan yang sesuai). Tidak seperti `--no-deliver`, yang hanya menonaktifkan pengiriman fallback oleh runner, opsi ini menghapus bidang yang tersimpan sehingga tugas kembali menyelesaikan bagian rutenya tersebut dari nilai default.

`--announce` adalah pengiriman fallback oleh runner untuk balasan akhir. `--no-deliver` menonaktifkan fallback tersebut, tetapi tidak menghapus alat `message` milik agen ketika rute obrolan tersedia.

Pengingat yang dibuat dari obrolan aktif mempertahankan target pengiriman obrolan langsung untuk pengiriman pengumuman fallback. Kunci sesi internal dapat menggunakan huruf kecil; jangan menggunakannya sebagai sumber kebenaran untuk ID penyedia yang peka terhadap kapitalisasi, seperti ID ruang Matrix.

### Pengiriman kegagalan

Notifikasi kegagalan diselesaikan dalam urutan berikut:

1. `delivery.failureDestination` pada tugas.
2. `cron.failureDestination` global.
3. Target pengumuman utama tugas (ketika tidak satu pun dari kedua opsi di atas diselesaikan menjadi tujuan konkret).

<Note>
Tugas sesi utama hanya dapat menggunakan `delivery.failureDestination` ketika mode pengiriman utama adalah `webhook`. Tugas terisolasi menerimanya dalam semua mode.
</Note>

Eksekusi Cron terisolasi memperlakukan kegagalan agen pada tingkat eksekusi sebagai kesalahan tugas meskipun tidak ada payload balasan yang dihasilkan, sehingga kegagalan model/penyedia tetap meningkatkan penghitung kesalahan dan memicu notifikasi kegagalan.

Tugas perintah Cron tidak memulai giliran agen terisolasi. Kode keluar nol mencatat `ok`; kode keluar bukan nol, sinyal, batas waktu, atau batas waktu tanpa keluaran mencatat `error` dan dapat memicu jalur notifikasi kegagalan yang sama.

Jika eksekusi terisolasi mencapai batas waktu sebelum permintaan model pertama, `openclaw cron show` dan `openclaw cron runs` menyertakan kesalahan khusus fase seperti `setup timed out before runner start` atau pesan kemacetan yang menyebutkan fase mulai terakhir yang diketahui (misalnya `context-engine`). Untuk penyedia berbasis CLI, pengawas pra-model tetap aktif hingga giliran CLI eksternal dimulai, sehingga kemacetan pencarian sesi, hook, autentikasi, prompt, dan penyiapan CLI dilaporkan sebagai kegagalan Cron pra-model.

## Penjadwalan

### Tugas sekali jalan

`--at <datetime>` menjadwalkan eksekusi sekali jalan. Nilai tanggal dan waktu tanpa offset dianggap sebagai UTC kecuali jika Anda juga meneruskan `--tz <iana>`, yang menafsirkan waktu jam dinding dalam zona waktu yang diberikan.

<Note>
Secara default, tugas sekali jalan dihapus setelah berhasil. Gunakan `--keep-after-run` untuk mempertahankannya.
</Note>

### Tugas berulang

Tugas berulang menggunakan backoff percobaan ulang eksponensial setelah kesalahan berturut-turut: 30s, 1m, 5m, 15m, 60m. Jadwal kembali normal setelah eksekusi berikutnya berhasil.

Eksekusi yang dilewati dilacak secara terpisah dari kesalahan eksekusi. Eksekusi tersebut tidak memengaruhi backoff percobaan ulang, tetapi `openclaw cron edit <job-id> --failure-alert-include-skipped` dapat mengaktifkan notifikasi eksekusi yang dilewati berulang kali dalam peringatan kegagalan.

Untuk tugas terisolasi yang menargetkan penyedia model lokal terkonfigurasi (URL dasar pada loopback, jaringan privat, atau `.local`), Cron menjalankan pemeriksaan awal penyedia ringan sebelum memulai giliran agen: penyedia `api: "ollama"` diperiksa di `/api/tags`; penyedia lokal lain yang kompatibel dengan OpenAI (`api: "openai-completions"`, misalnya vLLM, SGLang, LM Studio) diperiksa di `/models`. Jika titik akhir tidak dapat dijangkau, eksekusi dicatat sebagai `skipped` dan dicoba kembali pada jadwal berikutnya; hasil keterjangkauan disimpan dalam cache per titik akhir selama 5 menit agar banyak tugas yang menggunakan server lokal yang sama tidak membebaninya dengan pemeriksaan berulang.

Tugas Cron, status runtime tertunda, dan riwayat eksekusi berada di basis data status SQLite bersama. File lama `jobs.json`, `<name>-state.json`, dan `runs/*.jsonl` diimpor satu kali dan diganti namanya dengan akhiran `.migrated`. Setelah impor, edit jadwal dengan `openclaw cron add|edit|remove`, bukan dengan mengedit file JSON.

### Eksekusi manual

`openclaw cron run <job-id>` secara default menjalankan secara paksa dan segera kembali setelah eksekusi manual dimasukkan ke antrean. Respons yang berhasil menyertakan `{ ok: true, enqueued: true, runId }`. Gunakan `runId` yang dikembalikan untuk memeriksa hasilnya nanti:

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

Tambahkan `--wait` ketika skrip harus diblokir hingga eksekusi dalam antrean tersebut mencatat status terminal:

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

Dengan `--wait`, CLI tetap memanggil `cron.run` terlebih dahulu, lalu melakukan polling `cron.runs` untuk `runId` yang dikembalikan. Perintah keluar dengan `0` hanya ketika eksekusi selesai dengan status `ok`. Perintah keluar dengan nilai bukan nol ketika eksekusi selesai dengan `error` atau `skipped`, ketika respons Gateway tidak menyertakan `runId`, atau ketika `--wait-timeout` berakhir (default `10m`, dengan polling setiap `2s` secara default). `--poll-interval` harus lebih besar dari nol.

<Note>
Gunakan `--due` ketika Anda ingin perintah manual berjalan hanya jika tugas saat ini sudah waktunya dijalankan. Jika `--due --wait` tidak memasukkan eksekusi ke antrean, perintah mengembalikan respons normal tanpa eksekusi, alih-alih melakukan polling.
</Note>

## Model

`cron add|edit --model <ref>` memilih model yang diizinkan untuk tugas. `cron add|edit --fallbacks <list>` mengatur model fallback per tugas, misalnya `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`; teruskan `--fallbacks ""` untuk eksekusi ketat tanpa fallback. `cron edit <job-id> --clear-fallbacks` menghapus penggantian fallback per tugas. `cron edit <job-id> --clear-model` menghapus penggantian model per tugas sehingga tugas mengikuti prioritas pemilihan model Cron normal (penggantian sesi Cron tersimpan jika ada, atau model agen/default); opsi ini tidak dapat digabungkan dengan `--model`. `cron add|edit --thinking <level>` mengatur penggantian proses berpikir per tugas; `cron edit <job-id> --clear-thinking` menghapusnya sehingga tugas mengikuti prioritas proses berpikir Cron normal, dan tidak dapat digabungkan dengan `--thinking`.

<Warning>
Jika model tidak diizinkan atau tidak dapat diselesaikan, Cron menggagalkan eksekusi dengan kesalahan validasi eksplisit, alih-alih melakukan fallback ke pemilihan model agen tugas atau model default.
</Warning>

`--model` Cron adalah **model utama tugas**, bukan penggantian `/model` sesi obrolan. Artinya:

- Fallback model yang dikonfigurasi tetap berlaku ketika model tugas yang dipilih gagal.
- `fallbacks` payload per tugas menggantikan daftar fallback terkonfigurasi ketika tersedia.
- Daftar fallback per tugas yang kosong (`--fallbacks ""` atau `fallbacks: []` dalam payload/API tugas) membuat eksekusi Cron menjadi ketat.
- Ketika tugas memiliki `--model` tetapi tidak ada daftar fallback yang dikonfigurasi, OpenClaw meneruskan penggantian fallback kosong secara eksplisit agar model utama agen tidak ditambahkan sebagai target percobaan ulang tersembunyi.
- Pemeriksaan awal penyedia lokal menelusuri fallback terkonfigurasi sebelum menandai eksekusi Cron sebagai `skipped`.

`openclaw doctor` melaporkan tugas yang telah memiliki `payload.model`, termasuk jumlah namespace penyedia dan ketidakcocokan terhadap `agents.defaults.model`. Gunakan pemeriksaan tersebut ketika perilaku autentikasi, penyedia, atau penagihan tampak berbeda antara obrolan langsung dan tugas terjadwal.

### Prioritas model Cron terisolasi

Cron terisolasi menyelesaikan model aktif dalam urutan berikut:

1. Penggantian hook Gmail.
2. `--model` per tugas.
3. Penggantian model sesi Cron tersimpan (ketika pengguna memilihnya).
4. Pemilihan model agen atau model default.

### Mode cepat

Mode cepat cron terisolasi mengikuti pemilihan model live yang telah di-resolve. Konfigurasi model `params.fastMode` berlaku secara default, tetapi override sesi tersimpan `fastMode` tetap mengalahkan konfigurasi. Ketika mode yang di-resolve adalah `auto`, batas waktu menggunakan nilai `params.fastAutoOnSeconds` dari model yang dipilih, dengan default 60 detik.

### Percobaan ulang peralihan model live

Jika proses terisolasi menghasilkan `LiveSessionModelSwitchError`, cron menyimpan penyedia dan model yang telah dialihkan (serta override profil autentikasi yang dialihkan jika ada) untuk proses aktif sebelum mencoba ulang. Perulangan percobaan ulang terluar dibatasi hingga dua percobaan ulang peralihan setelah upaya awal, lalu dibatalkan agar tidak berulang selamanya.

## Output proses dan penolakan

### Penekanan konfirmasi usang

Giliran cron terisolasi menekan balasan usang yang hanya berisi konfirmasi. Jika hasil pertama hanya berupa pembaruan status sementara dan tidak ada proses subagen turunan yang bertanggung jawab atas jawaban akhir, cron meminta ulang satu kali untuk mendapatkan hasil sebenarnya sebelum pengiriman.

### Penekanan token senyap

Jika proses cron terisolasi hanya mengembalikan token senyap (`NO_REPLY` atau `no_reply`), cron menekan pengiriman keluar langsung dan jalur ringkasan antrean fallback, sehingga tidak ada yang dikirim kembali ke percakapan.

### Penolakan terstruktur

Proses cron terisolasi menggunakan metadata penolakan eksekusi terstruktur dari proses tersemat (kesalahan fatal alat eksekusi dengan kode `SYSTEM_RUN_DENIED` atau `INVALID_REQUEST`) sebagai sinyal penolakan yang otoritatif. Proses tersebut juga mengenali wrapper `UNAVAILABLE` host Node yang membungkus kesalahan terstruktur bertingkat dengan salah satu kode tersebut.

Cron tidak mengklasifikasikan prosa output akhir atau frasa penolakan yang tampak seperti permintaan persetujuan sebagai penolakan, kecuali proses tersemat juga memberikan metadata penolakan terstruktur, sehingga teks asisten biasa tidak dianggap sebagai perintah yang diblokir.

`cron list` dan riwayat proses menampilkan alasan penolakan alih-alih melaporkan perintah yang diblokir sebagai `ok`.

## Retensi

Perilaku retensi:

- `cron.sessionRetention` (default `24h`, atau `false` untuk menonaktifkan) memangkas sesi proses terisolasi yang telah selesai.
- Riwayat proses menyimpan 2000 baris terminal terbaru per tugas cron. Baris yang hilang tetap menggunakan jangka waktu pembersihan tugas hilang standar selama 24 jam.

## Memigrasikan tugas lama

<Note>
Jika Anda memiliki tugas cron dari sebelum format penyimpanan dan pengiriman saat ini, jalankan `openclaw doctor --fix`. Doctor menormalkan bidang cron lama (`jobId`, `schedule.cron`, bidang pengiriman tingkat atas termasuk `threadId` lama, serta alias pengiriman payload `provider`) dan memigrasikan tugas fallback Webhook `notify: true` dari nilai mentah `cron.webhook` yang telah dihentikan ke pengiriman Webhook eksplisit sebelum menghapus kunci konfigurasi tersebut. Tugas yang sudah mengumumkan ke percakapan mempertahankan pengiriman tersebut dan mendapatkan tujuan Webhook penyelesaian. Tanpa Webhook lama, penanda tingkat atas `notify` yang tidak aktif dihapus dari tugas yang tidak memiliki target migrasi (pengiriman yang ada dipertahankan tanpa perubahan), sehingga `doctor --fix` tidak lagi terus memberikan peringatan tentang tugas tersebut.
</Note>

## Pengeditan umum

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

Umumkan ke topik forum Telegram:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

Buat tugas terisolasi dengan konteks bootstrap ringan:

```bash
openclaw cron create "0 7 * * *" \
  "Ringkas pembaruan semalam." \
  --name "Ringkasan pagi ringan" \
  --session isolated \
  --light-context \
  --no-deliver
```

`--light-context` hanya berlaku untuk tugas giliran agen terisolasi. Untuk proses cron, mode ringan mempertahankan konteks bootstrap tetap kosong alih-alih memasukkan kumpulan bootstrap ruang kerja lengkap.

Buat tugas perintah dengan argv, cwd, env, stdin, dan batas output yang tepat:

```bash
openclaw cron create "*/30 * * * *" \
  --name "Ekspor posisi" \
  --command-argv '["node","scripts/export-position.mjs"]' \
  --command-cwd "/srv/app" \
  --command-env "NODE_ENV=production" \
  --command-input '{"mode":"summary"}' \
  --timeout-seconds 120 \
  --no-output-timeout-seconds 30 \
  --output-max-bytes 65536 \
  --webhook "https://example.invalid/openclaw/cron"
```

## Perintah admin umum

Proses manual dan pemeriksaan:

```bash
openclaw cron list
openclaw cron list --agent ops
openclaw cron get <job-id>
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron run <job-id> --wait --wait-timeout 10m
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
openclaw cron runs --id <job-id> --limit 50
openclaw cron runs --id <job-id> --run-id <run-id>
```

`openclaw cron list` menampilkan tugas yang diaktifkan secara default. Teruskan `--all` untuk menyertakan tugas yang dinonaktifkan, atau `--agent <id>` untuk hanya menampilkan tugas yang ID agen ternormalisasi efektifnya cocok; tugas tanpa ID agen tersimpan dianggap menggunakan agen default yang dikonfigurasi.

`openclaw cron get <job-id>` mengembalikan JSON tugas tersimpan secara langsung. Gunakan `cron show <job-id>` jika Anda menginginkan tampilan yang mudah dibaca manusia dengan pratinjau rute pengiriman.

`cron list --json` dan `cron show <job-id> --json` menyertakan bidang tingkat atas `status` pada setiap tugas, yang dihitung dari `enabled`, `state.runningAtMs`, dan `state.lastRunStatus`. Nilai: `disabled`, `running`, `ok`, `error`, `skipped`, atau `idle`. Status JSON tetap kanonis dan tanpa dekorasi agar alat eksternal dapat membaca status tugas tanpa menghitungnya kembali; output manusia dapat menghias status `error` yang berulang dengan jumlah kegagalan.

Entri `cron runs` menyertakan diagnostik pengiriman dengan target cron yang dimaksud, target yang di-resolve, pengiriman alat pesan, penggunaan fallback, dan status terkirim.

Penargetan ulang agen dan sesi:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` memberikan peringatan ketika `--agent` tidak dicantumkan pada tugas giliran agen dan menggunakan agen default (`main`) sebagai fallback. Teruskan `--agent <id>` saat pembuatan untuk menetapkan agen tertentu.

Penyesuaian pengiriman:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --webhook "https://example.invalid/openclaw/cron"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## Terkait

- [Referensi CLI](/id/cli)
- [Tugas terjadwal](/id/automation/cron-jobs)
