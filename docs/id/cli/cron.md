---
read_when:
    - Anda menginginkan tugas terjadwal dan pemicu bangun
    - Anda sedang men-debug eksekusi dan log Cron
summary: Referensi CLI untuk `openclaw cron` (menjadwalkan dan menjalankan tugas latar belakang)
title: Cron
x-i18n:
    generated_at: "2026-07-12T14:01:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e16335b13f92229df0ba49c320e2714e39ab3e503e8e72f376ec2c5b0803cf7
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Kelola tugas Cron untuk penjadwal Gateway.

<Tip>
Jalankan `openclaw cron --help` untuk melihat seluruh cakupan perintah. Lihat [Tugas Cron](/id/automation/cron-jobs) untuk panduan konseptual.
</Tip>

<Note>
Semua mutasi Cron (`add`/`create`, `update`/`edit`, `remove`, `run`) memerlukan `operator.admin`. Proses dengan payload perintah dieksekusi secara langsung dalam proses Gateway, bukan sebagai pemanggilan alat `tools.exec` oleh agen; `tools.exec.*` dan persetujuan eksekusi tetap mengatur alat eksekusi yang terlihat oleh model.
</Note>

## Membuat tugas dengan cepat

`openclaw cron create` adalah alias untuk `openclaw cron add`. Untuk tugas baru, tempatkan jadwal terlebih dahulu dan prompt setelahnya:

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Morning brief" \
  --agent ops
```

Gunakan `--webhook <url>` jika tugas harus mengirim payload yang telah selesai melalui POST, alih-alih mengirimkannya ke target percakapan:

```bash
openclaw cron create "0 18 * * 1-5" \
  "Summarize today's deploys as JSON." \
  --name "Deploy digest" \
  --webhook "https://example.invalid/openclaw/cron"
```

Gunakan `--command` untuk tugas bergaya shell yang deterministik, yang berjalan di dalam Cron OpenClaw tanpa memulai proses agen/model terisolasi:

```bash
openclaw cron create "*/15 * * * *" \
  --name "Queue depth probe" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` menyimpan `argv: ["sh", "-lc", <shell>]`. Gunakan `--command-argv '["node","scripts/report.mjs"]'` untuk eksekusi argv yang persis. Tugas perintah menangkap stdout/stderr, mencatat riwayat Cron normal, dan merutekan keluaran melalui mode pengiriman `announce`, `webhook`, atau `none` yang sama seperti tugas terisolasi. Perintah yang hanya mencetak `NO_REPLY` akan disembunyikan.

## Sesi

`--session` menerima `main`, `isolated`, `current`, atau `session:<id>`.

<AccordionGroup>
  <Accordion title="Kunci sesi">
    - `main` mengikat ke sesi utama agen.
    - `isolated` membuat transkrip dan ID sesi baru untuk setiap proses.
    - `current` mengikat ke sesi aktif pada saat pembuatan.
    - `session:<id>` menyematkan ke kunci sesi persisten yang eksplisit.

  </Accordion>
  <Accordion title="Semantik sesi terisolasi">
    Proses terisolasi mereset konteks percakapan sekitar. Perutean kanal dan grup, kebijakan kirim/antrean, elevasi, asal, serta pengikatan runtime ACP direset untuk proses baru. Preferensi aman serta penggantian model atau autentikasi yang dipilih pengguna secara eksplisit dapat diteruskan antarproses.
  </Accordion>
</AccordionGroup>

## Pengiriman

`openclaw cron list` dan `openclaw cron show <job-id>` menampilkan pratinjau rute pengiriman yang telah diselesaikan. Untuk `channel: "last"`, pratinjau menunjukkan apakah rute diselesaikan dari sesi utama atau saat ini, atau akan gagal secara tertutup.

Target dengan prefiks penyedia dapat memperjelas kanal pengumuman yang belum diselesaikan. Contohnya, `to: "telegram:123"` memilih Telegram saat `delivery.channel` tidak dicantumkan atau bernilai `last`. Hanya prefiks yang diumumkan oleh Plugin yang dimuat yang menjadi pemilih penyedia. Jika `delivery.channel` ditentukan secara eksplisit, prefiks harus cocok dengan kanal tersebut; `channel: "whatsapp"` dengan `to: "telegram:123"` akan ditolak. Prefiks layanan seperti `imessage:` dan `sms:` tetap menjadi sintaks target yang dimiliki kanal.

<Note>
Tugas `cron add` terisolasi menggunakan pengiriman `--announce` secara default. Gunakan `--no-deliver` agar keluaran tetap internal. `--deliver` tetap tersedia sebagai alias usang untuk `--announce`.
</Note>

### Kepemilikan pengiriman

Pengiriman percakapan Cron terisolasi dibagi antara agen dan penjalan:

- Agen dapat mengirim secara langsung menggunakan alat `message` saat rute percakapan tersedia.
- `announce` mengirimkan balasan akhir sebagai cadangan hanya jika agen tidak mengirim langsung ke target yang telah diselesaikan.
- `webhook` mengirim payload yang telah selesai ke sebuah URL.
- `none` menonaktifkan pengiriman cadangan oleh penjalan.

Gunakan `cron add|create --webhook <url>` atau `cron edit <job-id> --webhook <url>` untuk mengatur pengiriman Webhook. Jangan gabungkan `--webhook` dengan flag pengiriman percakapan seperti `--announce`, `--no-deliver`, `--channel`, `--to`, `--thread-id`, atau `--account`.

`cron edit <job-id>` dapat menghapus masing-masing bidang perutean pengiriman dengan `--clear-channel`, `--clear-to`, `--clear-thread-id`, dan `--clear-account` (masing-masing ditolak jika digabungkan dengan flag pengaturan pasangannya). Berbeda dari `--no-deliver`, yang hanya menonaktifkan pengiriman cadangan oleh penjalan, opsi-opsi ini menghapus bidang yang tersimpan sehingga tugas kembali menyelesaikan bagian rutenya tersebut dari nilai default.

`--announce` adalah pengiriman cadangan oleh penjalan untuk balasan akhir. `--no-deliver` menonaktifkan cadangan tersebut, tetapi tidak menghapus alat `message` milik agen saat rute percakapan tersedia.

Pengingat yang dibuat dari percakapan aktif mempertahankan target pengiriman percakapan langsung untuk pengiriman pengumuman cadangan. Kunci sesi internal mungkin menggunakan huruf kecil; jangan menggunakannya sebagai sumber kebenaran untuk ID penyedia yang peka huruf besar-kecil, seperti ID ruang Matrix.

### Pengiriman kegagalan

Notifikasi kegagalan diselesaikan dalam urutan berikut:

1. `delivery.failureDestination` pada tugas.
2. `cron.failureDestination` global.
3. Target pengumuman utama tugas (jika kedua opsi di atas tidak menghasilkan tujuan konkret).

<Note>
Tugas sesi utama hanya boleh menggunakan `delivery.failureDestination` jika mode pengiriman utama adalah `webhook`. Tugas terisolasi menerimanya dalam semua mode.
</Note>

Proses Cron terisolasi memperlakukan kegagalan agen pada tingkat proses sebagai kesalahan tugas, bahkan ketika tidak ada payload balasan yang dihasilkan, sehingga kegagalan model/penyedia tetap meningkatkan penghitung kesalahan dan memicu notifikasi kegagalan.

Tugas Cron perintah tidak memulai giliran agen terisolasi. Kode keluar nol mencatat `ok`; kode keluar bukan nol, sinyal, batas waktu, atau batas waktu tanpa keluaran mencatat `error` dan dapat memicu jalur notifikasi kegagalan yang sama.

Jika proses terisolasi mencapai batas waktu sebelum permintaan model pertama, `openclaw cron show` dan `openclaw cron runs` menyertakan kesalahan khusus fase seperti `setup timed out before runner start` atau pesan macet yang menyebutkan fase awal terakhir yang diketahui (misalnya `context-engine`). Untuk penyedia berbasis CLI, pengawas pra-model tetap aktif hingga giliran CLI eksternal dimulai, sehingga kemacetan pencarian sesi, hook, autentikasi, prompt, dan penyiapan CLI dilaporkan sebagai kegagalan Cron pra-model.

## Penjadwalan

### Tugas sekali jalan

`--at <datetime>` menjadwalkan proses sekali jalan. Waktu tanggal tanpa offset diperlakukan sebagai UTC, kecuali jika Anda juga meneruskan `--tz <iana>`, yang menafsirkan waktu jam dinding dalam zona waktu yang diberikan.

<Note>
Secara default, tugas sekali jalan dihapus setelah berhasil. Gunakan `--keep-after-run` untuk mempertahankannya.
</Note>

### Tugas berulang

Tugas berulang menggunakan penundaan percobaan ulang eksponensial setelah kesalahan berturut-turut: 30 dtk, 1 mnt, 5 mnt, 15 mnt, 60 mnt. Jadwal kembali normal setelah proses berikutnya berhasil.

Proses yang dilewati dilacak secara terpisah dari kesalahan eksekusi. Proses tersebut tidak memengaruhi penundaan percobaan ulang, tetapi `openclaw cron edit <job-id> --failure-alert-include-skipped` dapat mengikutsertakan notifikasi proses yang dilewati berulang kali dalam peringatan kegagalan.

Untuk tugas terisolasi yang menargetkan penyedia model lokal yang dikonfigurasi (URL dasar pada local loopback, jaringan privat, atau `.local`), Cron menjalankan pemeriksaan awal penyedia ringan sebelum memulai giliran agen: penyedia `api: "ollama"` diperiksa di `/api/tags`; penyedia lokal kompatibel OpenAI lainnya (`api: "openai-completions"`, misalnya vLLM, SGLang, LM Studio) diperiksa di `/models`. Jika endpoint tidak dapat dijangkau, proses dicatat sebagai `skipped` dan dicoba kembali pada jadwal berikutnya; hasil keterjangkauan disimpan dalam cache per endpoint selama 5 menit agar banyak tugas yang menggunakan server lokal yang sama tidak membebaninya dengan pemeriksaan berulang.

Tugas Cron, status runtime tertunda, dan riwayat proses berada dalam basis data status SQLite bersama. Berkas lama `jobs.json`, `<name>-state.json`, dan `runs/*.jsonl` diimpor satu kali lalu diganti namanya dengan sufiks `.migrated`. Setelah impor, ubah jadwal dengan `openclaw cron add|edit|remove`, bukan dengan mengedit berkas JSON.

### Proses manual

`openclaw cron run <job-id>` secara default menjalankan secara paksa dan segera kembali setelah proses manual dimasukkan ke antrean. Respons yang berhasil menyertakan `{ ok: true, enqueued: true, runId }`. Gunakan `runId` yang dikembalikan untuk memeriksa hasilnya nanti:

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

Tambahkan `--wait` jika skrip harus terblokir hingga proses persis yang diantrekan tersebut mencatat status terminal:

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

Dengan `--wait`, CLI tetap memanggil `cron.run` terlebih dahulu, lalu melakukan polling terhadap `cron.runs` untuk `runId` yang dikembalikan. Perintah keluar dengan kode `0` hanya jika proses selesai dengan status `ok`. Perintah keluar dengan kode bukan nol jika proses selesai dengan `error` atau `skipped`, jika respons Gateway tidak menyertakan `runId`, atau jika `--wait-timeout` berakhir (default `10m`, dengan polling setiap `2s` secara default). `--poll-interval` harus lebih besar dari nol.

<Note>
Gunakan `--due` jika Anda ingin perintah manual berjalan hanya ketika tugas memang sudah waktunya dijalankan. Jika `--due --wait` tidak mengantrekan proses, perintah mengembalikan respons normal tanpa proses, alih-alih melakukan polling.
</Note>

## Model

`cron add|edit --model <ref>` memilih model yang diizinkan untuk tugas. `cron add|edit --fallbacks <list>` menetapkan model cadangan per tugas, misalnya `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`; teruskan `--fallbacks ""` untuk proses ketat tanpa cadangan. `cron edit <job-id> --clear-fallbacks` menghapus penggantian cadangan per tugas. `cron edit <job-id> --clear-model` menghapus penggantian model per tugas sehingga tugas mengikuti urutan prioritas pemilihan model Cron normal (penggantian sesi Cron tersimpan jika ada, atau model agen/default); opsi ini tidak dapat digabungkan dengan `--model`. `cron add|edit --thinking <level>` menetapkan penggantian tingkat pemikiran per tugas; `cron edit <job-id> --clear-thinking` menghapusnya sehingga tugas mengikuti urutan prioritas pemikiran Cron normal, dan opsi ini tidak dapat digabungkan dengan `--thinking`.

<Warning>
Jika model tidak diizinkan atau tidak dapat diselesaikan, Cron menggagalkan proses dengan kesalahan validasi eksplisit, alih-alih kembali ke pemilihan model agen tugas atau model default.
</Warning>

`--model` Cron adalah **model utama tugas**, bukan penggantian `/model` pada sesi percakapan. Artinya:

- Model cadangan yang dikonfigurasi tetap berlaku ketika model tugas yang dipilih gagal.
- Payload `fallbacks` per tugas menggantikan daftar cadangan yang dikonfigurasi jika tersedia.
- Daftar cadangan per tugas yang kosong (`--fallbacks ""` atau `fallbacks: []` dalam payload/API tugas) membuat proses Cron menjadi ketat.
- Jika tugas memiliki `--model` tetapi tidak ada daftar cadangan yang dikonfigurasi, OpenClaw meneruskan penggantian cadangan kosong secara eksplisit agar model utama agen tidak ditambahkan sebagai target percobaan ulang tersembunyi.
- Pemeriksaan awal penyedia lokal menelusuri cadangan yang dikonfigurasi sebelum menandai proses Cron sebagai `skipped`.

`openclaw doctor` melaporkan tugas yang telah menetapkan `payload.model`, termasuk jumlah namespace penyedia dan ketidakcocokan terhadap `agents.defaults.model`. Gunakan pemeriksaan tersebut ketika perilaku autentikasi, penyedia, atau penagihan tampak berbeda antara percakapan langsung dan tugas terjadwal.

### Urutan prioritas model Cron terisolasi

Cron terisolasi menyelesaikan model aktif dalam urutan berikut:

1. Penggantian hook Gmail.
2. `--model` per tugas.
3. Penggantian model sesi Cron tersimpan (jika pengguna memilihnya).
4. Pemilihan model agen atau model default.

### Mode cepat

Mode cepat Cron terisolasi mengikuti pemilihan model langsung yang telah diselesaikan. Konfigurasi model `params.fastMode` berlaku secara default, tetapi penggantian `fastMode` sesi tersimpan tetap mengungguli konfigurasi. Jika mode yang diselesaikan adalah `auto`, ambang batas menggunakan nilai `params.fastAutoOnSeconds` dari model yang dipilih, dengan nilai default 60 detik.

### Percobaan ulang peralihan model langsung

Jika proses terisolasi melempar `LiveSessionModelSwitchError`, Cron menyimpan penyedia dan model yang dialihkan (serta penggantian profil autentikasi yang dialihkan jika ada) untuk proses aktif sebelum mencoba kembali. Perulangan percobaan ulang luar dibatasi hingga dua percobaan ulang peralihan setelah percobaan awal, lalu dibatalkan agar tidak berulang selamanya.

## Keluaran proses dan penolakan

### Penyembunyian konfirmasi usang

Giliran Cron terisolasi menyembunyikan balasan usang yang hanya berisi konfirmasi. Jika hasil pertama hanya berupa pembaruan status sementara dan tidak ada proses subagen turunan yang bertanggung jawab atas jawaban akhir, Cron meminta kembali satu kali untuk mendapatkan hasil sebenarnya sebelum pengiriman.

### Penekanan token senyap

Jika suatu eksekusi cron terisolasi hanya mengembalikan token senyap (`NO_REPLY` atau `no_reply`), cron menekan pengiriman keluar langsung dan jalur ringkasan antrean cadangan, sehingga tidak ada yang dikirim kembali ke percakapan.

### Penolakan terstruktur

Eksekusi cron terisolasi menggunakan metadata penolakan eksekusi terstruktur dari eksekusi tertanam (kesalahan fatal alat eksekusi dengan kode `SYSTEM_RUN_DENIED` atau `INVALID_REQUEST`) sebagai sinyal penolakan yang berwenang. Eksekusi tersebut juga mengenali pembungkus `UNAVAILABLE` dari host Node di sekitar kesalahan terstruktur bertingkat yang memuat salah satu kode tersebut.

Cron tidak menggolongkan prosa keluaran akhir atau frasa penolakan yang tampak meminta persetujuan sebagai penolakan, kecuali eksekusi tertanam juga menyediakan metadata penolakan terstruktur, sehingga teks asisten biasa tidak diperlakukan sebagai perintah yang diblokir.

`cron list` dan riwayat eksekusi menampilkan alasan penolakan, alih-alih melaporkan perintah yang diblokir sebagai `ok`.

## Retensi

Retensi dan pemangkasan dikendalikan dalam konfigurasi:

- `cron.sessionRetention` (nilai bawaan `24h`, atau `false` untuk menonaktifkan) memangkas sesi eksekusi terisolasi yang telah selesai.
- `cron.runLog.keepLines` (nilai bawaan `2000`) memangkas baris riwayat eksekusi SQLite yang dipertahankan per tugas. `cron.runLog.maxBytes` (nilai bawaan `2000000`) tetap diterima untuk kompatibilitas dengan log eksekusi lama berbasis berkas; pemangkasan SQLite didasarkan pada jumlah baris.

## Memigrasikan tugas lama

<Note>
Jika Anda memiliki tugas cron dari masa sebelum format penyimpanan dan pengiriman saat ini, jalankan `openclaw doctor --fix`. Doctor menormalkan bidang cron lama (`jobId`, `schedule.cron`, bidang pengiriman tingkat teratas termasuk `threadId` lama, alias pengiriman `provider` muatan) dan memigrasikan tugas cadangan Webhook `notify: true` dari `cron.webhook` ke pengiriman Webhook eksplisit. Tugas yang sudah mengumumkan ke percakapan mempertahankan pengiriman tersebut dan mendapatkan tujuan Webhook penyelesaian. Jika `cron.webhook` tidak ditetapkan, penanda `notify` tingkat teratas yang tidak aktif dihapus dari tugas yang tidak memiliki target migrasi (pengiriman yang ada dipertahankan tanpa perubahan), sehingga `doctor --fix` tidak lagi terus memperingatkan tentang tugas tersebut.
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
  "Summarize overnight updates." \
  --name "Lightweight morning brief" \
  --session isolated \
  --light-context \
  --no-deliver
```

`--light-context` hanya berlaku untuk tugas giliran agen terisolasi. Untuk eksekusi cron, mode ringan membiarkan konteks bootstrap kosong, alih-alih menyisipkan kumpulan bootstrap ruang kerja lengkap.

Buat tugas perintah dengan argv, cwd, env, stdin, dan batas keluaran yang presisi:

```bash
openclaw cron create "*/30 * * * *" \
  --name "Position export" \
  --command-argv '["node","scripts/export-position.mjs"]' \
  --command-cwd "/srv/app" \
  --command-env "NODE_ENV=production" \
  --command-input '{"mode":"summary"}' \
  --timeout-seconds 120 \
  --no-output-timeout-seconds 30 \
  --output-max-bytes 65536 \
  --webhook "https://example.invalid/openclaw/cron"
```

## Perintah administrasi umum

Eksekusi dan pemeriksaan manual:

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

`openclaw cron list` secara bawaan menampilkan semua tugas yang cocok. Berikan `--agent <id>` untuk hanya menampilkan tugas dengan ID agen ternormalisasi efektif yang cocok; tugas tanpa ID agen tersimpan dianggap menggunakan agen bawaan yang dikonfigurasi.

`openclaw cron get <job-id>` mengembalikan JSON tugas tersimpan secara langsung. Gunakan `cron show <job-id>` jika Anda menginginkan tampilan yang mudah dibaca manusia dengan pratinjau rute pengiriman.

`cron list --json` dan `cron show <job-id> --json` menyertakan bidang `status` tingkat teratas pada setiap tugas, yang dihitung dari `enabled`, `state.runningAtMs`, dan `state.lastRunStatus`. Nilainya: `disabled`, `running`, `ok`, `error`, `skipped`, atau `idle`. Status JSON tetap kanonis dan tanpa hiasan agar perkakas eksternal dapat membaca keadaan tugas tanpa menghitungnya kembali; keluaran untuk manusia dapat menghias status `error` yang berulang dengan jumlah kegagalan.

Entri `cron runs` menyertakan diagnostik pengiriman dengan target cron yang dimaksud, target yang diselesaikan, pengiriman alat pesan, penggunaan cadangan, dan keadaan terkirim.

Penargetan ulang agen dan sesi:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` memperingatkan jika `--agent` dihilangkan pada tugas giliran agen dan menggunakan agen bawaan (`main`) sebagai cadangan. Berikan `--agent <id>` saat pembuatan untuk menetapkan agen tertentu.

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
