---
read_when:
    - Anda menginginkan pekerjaan terjadwal dan pemicu bangun
    - Anda sedang melakukan debug pada eksekusi dan log cron
summary: Referensi CLI untuk `openclaw cron` (menjadwalkan dan menjalankan pekerjaan latar belakang)
title: Cron
x-i18n:
    generated_at: "2026-07-19T16:31:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0e6e56a465700eb42c1f0c0c7d5af9dddb390cd48c1f44c471d08b6a8c2c4c6a
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Kelola pekerjaan Cron untuk penjadwal Gateway.

<Tip>
Jalankan `openclaw cron --help` untuk melihat seluruh cakupan perintah. Lihat [Pekerjaan Cron](/id/automation/cron-jobs) untuk panduan konseptual.
</Tip>

<Note>
Semua mutasi Cron (`add`/`create`, `update`/`edit`, `remove`, `run`) memerlukan `operator.admin`. Eksekusi payload perintah dijalankan langsung dalam proses Gateway, bukan sebagai pemanggilan alat `tools.exec` oleh agen; `tools.exec.*` dan persetujuan eksekusi tetap mengatur alat eksekusi yang terlihat oleh model.
</Note>

## Buat pekerjaan dengan cepat

`openclaw cron create` adalah alias untuk `openclaw cron add`. Untuk pekerjaan baru, tempatkan jadwal terlebih dahulu dan prompt setelahnya:

```bash
openclaw cron create "0 7 * * *" \
  "Rangkum pembaruan semalam." \
  --name "Ringkasan pagi" \
  --agent ops
```

Gunakan `--webhook <url>` jika pekerjaan harus mengirim payload yang telah selesai melalui POST, bukan mengirimkannya ke target percakapan:

```bash
openclaw cron create "0 18 * * 1-5" \
  "Rangkum deployment hari ini sebagai JSON." \
  --name "Ringkasan deployment" \
  --webhook "https://example.invalid/openclaw/cron"
```

Gunakan `--command` untuk pekerjaan bergaya shell yang deterministik, yang berjalan di dalam Cron OpenClaw tanpa memulai eksekusi agen/model terisolasi:

```bash
openclaw cron create "*/15 * * * *" \
  --name "Pemeriksaan kedalaman antrean" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` menyimpan `argv: ["sh", "-lc", <shell>]`. Gunakan `--command-argv '["node","scripts/report.mjs"]'` untuk eksekusi argv yang persis. Pekerjaan perintah menangkap stdout/stderr, mencatat riwayat Cron normal, dan merutekan keluaran melalui mode pengiriman `announce`, `webhook`, atau `none` yang sama seperti pekerjaan terisolasi. Perintah yang hanya mencetak `NO_REPLY` akan disembunyikan.

## Sesi

`--session` menerima `main`, `isolated`, `current`, atau `session:<id>`.

<AccordionGroup>
  <Accordion title="Kunci sesi">
    - `main` terikat ke sesi utama agen.
    - `isolated` membuat transkrip dan ID sesi baru untuk setiap eksekusi.
    - `current` terikat ke sesi yang aktif pada saat pembuatan.
    - `session:<id>` menyematkan kunci sesi persisten yang ditentukan secara eksplisit.

  </Accordion>
  <Accordion title="Semantik sesi terisolasi">
    Eksekusi terisolasi mengatur ulang konteks percakapan sekitar. Perutean kanal dan grup, kebijakan pengiriman/antrean, elevasi, asal, dan pengikatan runtime ACP diatur ulang untuk eksekusi baru. Preferensi aman serta penggantian model atau autentikasi yang dipilih pengguna secara eksplisit dapat diteruskan antar-eksekusi.
  </Accordion>
</AccordionGroup>

## Pengiriman

`openclaw cron list` dan `openclaw cron show <job-id>` menampilkan pratinjau rute pengiriman yang telah ditetapkan. Untuk `channel: "last"`, pratinjau menunjukkan apakah rute ditetapkan dari sesi utama atau sesi saat ini, atau akan gagal secara tertutup.

Target dengan prefiks penyedia dapat memperjelas kanal pengumuman yang belum ditetapkan. Misalnya, `to: "telegram:123"` memilih Telegram ketika `delivery.channel` dihilangkan atau bernilai `last`. Hanya prefiks yang diiklankan oleh Plugin yang dimuat yang berfungsi sebagai pemilih penyedia. Jika `delivery.channel` ditentukan secara eksplisit, prefiks harus cocok dengan kanal tersebut; `channel: "whatsapp"` dengan `to: "telegram:123"` akan ditolak. Prefiks layanan seperti `imessage:` dan `sms:` tetap menjadi sintaks target yang dimiliki kanal.

<Note>
Pekerjaan `cron add` terisolasi secara default menggunakan pengiriman `--announce`. Gunakan `--no-deliver` agar keluaran tetap internal. `--deliver` tetap tersedia sebagai alias usang untuk `--announce`.
</Note>

### Kepemilikan pengiriman

Pengiriman percakapan Cron terisolasi ditangani bersama oleh agen dan runner:

- Agen dapat mengirim secara langsung menggunakan alat `message` ketika rute percakapan tersedia.
- `announce` mengirimkan balasan akhir sebagai fallback hanya jika agen tidak mengirim secara langsung ke target yang telah ditetapkan.
- `webhook` mengirim payload yang telah selesai ke sebuah URL.
- `none` menonaktifkan pengiriman fallback oleh runner.

Gunakan `cron add|create --webhook <url>` atau `cron edit <job-id> --webhook <url>` untuk menetapkan pengiriman Webhook. Jangan gabungkan `--webhook` dengan flag pengiriman percakapan seperti `--announce`, `--no-deliver`, `--channel`, `--to`, `--thread-id`, atau `--account`.

`cron edit <job-id>` dapat menghapus setiap bidang perutean pengiriman dengan `--clear-channel`, `--clear-to`, `--clear-thread-id`, dan `--clear-account` (masing-masing ditolak jika digabungkan dengan flag penetapan yang cocok). Berbeda dari `--no-deliver`, yang hanya menonaktifkan pengiriman fallback oleh runner, opsi-opsi ini menghapus bidang yang tersimpan sehingga pekerjaan kembali menetapkan bagian rute tersebut dari nilai default.

`--announce` adalah pengiriman fallback oleh runner untuk balasan akhir. `--no-deliver` menonaktifkan fallback tersebut, tetapi tidak menghapus alat `message` milik agen ketika rute percakapan tersedia.

Pengingat yang dibuat dari percakapan aktif mempertahankan target pengiriman percakapan langsung untuk pengiriman pengumuman fallback. Kunci sesi internal mungkin menggunakan huruf kecil; jangan gunakan kunci tersebut sebagai sumber kebenaran untuk ID penyedia yang peka huruf besar-kecil, seperti ID ruang Matrix.

### Pengiriman kegagalan

Notifikasi kegagalan ditetapkan dalam urutan berikut:

1. `delivery.failureDestination` pada pekerjaan.
2. `cron.failureDestination` global.
3. Target pengumuman utama pekerjaan (ketika kedua opsi di atas tidak ditetapkan ke tujuan konkret).

<Note>
Pekerjaan sesi utama hanya dapat menggunakan `delivery.failureDestination` ketika mode pengiriman utama adalah `webhook`. Pekerjaan terisolasi menerimanya dalam semua mode.
</Note>

Eksekusi Cron terisolasi memperlakukan kegagalan agen pada tingkat eksekusi sebagai kesalahan pekerjaan meskipun tidak ada payload balasan yang dihasilkan, sehingga kegagalan model/penyedia tetap menambah penghitung kesalahan dan memicu notifikasi kegagalan.

Pekerjaan perintah Cron tidak memulai giliran agen terisolasi. Kode keluar nol mencatat `ok`; kode keluar bukan nol, sinyal, batas waktu, atau batas waktu tanpa keluaran mencatat `error` dan dapat memicu jalur notifikasi kegagalan yang sama.

Jika eksekusi terisolasi mencapai batas waktu sebelum permintaan model pertama, `openclaw cron show` dan `openclaw cron runs` menyertakan kesalahan khusus fase seperti `setup timed out before runner start` atau pesan kemacetan yang menyebutkan fase permulaan terakhir yang diketahui (misalnya `context-engine`). Untuk penyedia berbasis CLI, pengawas pra-model tetap aktif hingga giliran CLI eksternal dimulai, sehingga kemacetan pada pencarian sesi, hook, autentikasi, prompt, dan penyiapan CLI dilaporkan sebagai kegagalan Cron pra-model.

## Penjadwalan

### Pekerjaan sekali jalan

`--at <datetime>` menjadwalkan eksekusi sekali jalan. Waktu tanggal tanpa offset diperlakukan sebagai UTC kecuali Anda juga meneruskan `--tz <iana>`, yang menafsirkan waktu jam dinding dalam zona waktu yang diberikan.

<Note>
Pekerjaan sekali jalan secara default dihapus setelah berhasil. Gunakan `--keep-after-run` untuk mempertahankannya.
</Note>

### Pekerjaan berulang

Pekerjaan berulang menggunakan backoff percobaan ulang eksponensial setelah kesalahan berturut-turut: 30s, 1m, 5m, 15m, 60m. Jadwal kembali normal setelah eksekusi berikutnya berhasil.

Eksekusi yang dilewati dilacak secara terpisah dari kesalahan eksekusi. Eksekusi tersebut tidak memengaruhi backoff percobaan ulang, tetapi `openclaw cron edit <job-id> --failure-alert-include-skipped` dapat mengikutsertakan peringatan kegagalan dalam notifikasi berulang untuk eksekusi yang dilewati.

Untuk pekerjaan terisolasi yang menargetkan penyedia model lokal yang dikonfigurasi (URL dasar pada loopback, jaringan privat, atau `.local`), Cron menjalankan pemeriksaan awal penyedia yang ringan sebelum memulai giliran agen: penyedia `api: "ollama"` diperiksa di `/api/tags`; penyedia lokal lain yang kompatibel dengan OpenAI (`api: "openai-completions"`, misalnya vLLM, SGLang, LM Studio) diperiksa di `/models`. Jika endpoint tidak dapat dijangkau, eksekusi dicatat sebagai `skipped` dan dicoba ulang pada jadwal berikutnya; hasil keterjangkauan disimpan dalam cache per endpoint selama 5 menit agar banyak pekerjaan yang menggunakan server lokal yang sama tidak membebaninya dengan pemeriksaan berulang.

Pekerjaan Cron, status runtime yang tertunda, dan riwayat eksekusi disimpan dalam basis data status SQLite bersama. File lama `jobs.json`, `<name>-state.json`, dan `runs/*.jsonl` diimpor satu kali dan diganti namanya dengan sufiks `.migrated`. Setelah diimpor, edit jadwal menggunakan `openclaw cron add|edit|remove`, bukan dengan mengedit file JSON.

### Eksekusi manual

`openclaw cron run <job-id>` secara default menjalankan secara paksa dan segera kembali setelah eksekusi manual masuk antrean. Respons yang berhasil menyertakan `{ ok: true, enqueued: true, runId }`. Gunakan `runId` yang dikembalikan untuk memeriksa hasilnya nanti:

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

Tambahkan `--wait` ketika skrip harus menunggu hingga eksekusi spesifik dalam antrean tersebut mencatat status terminal:

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

Dengan `--wait`, CLI tetap memanggil `cron.run` terlebih dahulu, lalu melakukan polling terhadap `cron.runs` untuk `runId` yang dikembalikan. Perintah keluar dengan `0` hanya ketika eksekusi selesai dengan status `ok`. Perintah keluar dengan kode bukan nol ketika eksekusi selesai dengan `error` atau `skipped`, ketika respons Gateway tidak menyertakan `runId`, atau ketika `--wait-timeout` kedaluwarsa (default `10m`, dengan polling setiap `2s` secara default). `--poll-interval` harus lebih besar dari nol.

<Note>
Gunakan `--due` jika Anda ingin perintah manual hanya berjalan ketika pekerjaan sedang jatuh tempo. Jika `--due --wait` tidak memasukkan eksekusi ke antrean, perintah mengembalikan respons normal tanpa eksekusi, bukan melakukan polling.
</Note>

## Model

`cron add|edit --model <ref>` memilih model yang diizinkan untuk pekerjaan. `cron add|edit --fallbacks <list>` menetapkan model fallback per pekerjaan, misalnya `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`; teruskan `--fallbacks ""` untuk eksekusi ketat tanpa fallback. `cron edit <job-id> --clear-fallbacks` menghapus penggantian fallback per pekerjaan. `cron edit <job-id> --clear-model` menghapus penggantian model per pekerjaan agar pekerjaan mengikuti urutan prioritas pemilihan model Cron normal (penggantian sesi Cron yang tersimpan jika ada, atau model agen/default); opsi ini tidak dapat digabungkan dengan `--model`. `cron add|edit --thinking <level>` menetapkan penggantian pemikiran per pekerjaan; `cron edit <job-id> --clear-thinking` menghapusnya agar pekerjaan mengikuti urutan prioritas pemikiran Cron normal, dan tidak dapat digabungkan dengan `--thinking`.

<Warning>
Jika model tidak diizinkan atau tidak dapat ditetapkan, Cron menggagalkan eksekusi dengan kesalahan validasi eksplisit, bukan beralih ke pemilihan model agen atau default pekerjaan.
</Warning>

`--model` Cron adalah **model utama pekerjaan**, bukan penggantian `/model` sesi percakapan. Artinya:

- Fallback model yang dikonfigurasi tetap berlaku ketika model pekerjaan yang dipilih gagal.
- `fallbacks` payload per pekerjaan menggantikan daftar fallback yang dikonfigurasi jika tersedia.
- Daftar fallback per pekerjaan yang kosong (`--fallbacks ""` atau `fallbacks: []` dalam payload/API pekerjaan) membuat eksekusi Cron menjadi ketat.
- Ketika pekerjaan memiliki `--model`, tetapi tidak ada daftar fallback yang dikonfigurasi, OpenClaw meneruskan penggantian fallback kosong secara eksplisit agar model utama agen tidak ditambahkan sebagai target percobaan ulang tersembunyi.
- Pemeriksaan awal penyedia lokal menelusuri fallback yang dikonfigurasi sebelum menandai eksekusi Cron sebagai `skipped`.

`openclaw doctor` melaporkan pekerjaan yang telah menetapkan `payload.model`, termasuk jumlah namespace penyedia dan ketidakcocokan dengan `agents.defaults.model`. Gunakan pemeriksaan tersebut ketika perilaku autentikasi, penyedia, atau penagihan terlihat berbeda antara percakapan langsung dan pekerjaan terjadwal.

### Urutan prioritas model Cron terisolasi

Cron terisolasi menetapkan model aktif dalam urutan berikut:

1. Penggantian hook Gmail.
2. `--model` per pekerjaan.
3. Penggantian model sesi Cron yang tersimpan (ketika pengguna memilihnya).
4. Pemilihan model agen atau default.

### Mode cepat

Mode cepat cron terisolasi mengikuti pemilihan model live yang telah diresolusi. Konfigurasi model `params.fastMode` diterapkan secara default, tetapi penggantian sesi tersimpan `fastMode` tetap mengungguli konfigurasi. Saat mode yang diresolusi adalah `auto`, batas waktu menggunakan nilai `params.fastAutoOnSeconds` dari model yang dipilih, dengan default 60 detik.

### Percobaan ulang peralihan model live

Jika proses terisolasi menghasilkan `LiveSessionModelSwitchError`, cron menyimpan penyedia dan model yang telah dialihkan (serta penggantian profil autentikasi yang telah dialihkan jika ada) untuk proses aktif sebelum mencoba ulang. Loop percobaan ulang luar dibatasi hingga dua percobaan ulang peralihan setelah upaya awal, lalu dibatalkan alih-alih terus berulang tanpa henti.

## Keluaran proses dan penolakan

### Penekanan konfirmasi usang

Giliran cron terisolasi menekan balasan usang yang hanya berisi konfirmasi. Jika hasil pertama hanya berupa pembaruan status sementara dan tidak ada proses subagen turunan yang bertanggung jawab atas jawaban akhir, cron meminta ulang satu kali untuk mendapatkan hasil sebenarnya sebelum pengiriman.

### Penekanan token senyap

Jika proses cron terisolasi hanya mengembalikan token senyap (`NO_REPLY` atau `no_reply`), cron menekan pengiriman keluar langsung maupun jalur ringkasan antrean cadangan, sehingga tidak ada yang dikirim kembali ke obrolan.

### Penolakan terstruktur

Proses cron terisolasi menggunakan metadata penolakan eksekusi terstruktur dari proses tertanam (kesalahan fatal alat eksekusi berkode `SYSTEM_RUN_DENIED` atau `INVALID_REQUEST`) sebagai sinyal penolakan otoritatif. Proses tersebut juga mengenali pembungkus `UNAVAILABLE` dari host Node di sekitar kesalahan terstruktur bertingkat yang membawa salah satu kode tersebut.

Cron tidak mengklasifikasikan prosa keluaran akhir atau frasa penolakan yang tampak seperti permintaan persetujuan sebagai penolakan, kecuali proses tertanam juga menyediakan metadata penolakan terstruktur, sehingga teks asisten biasa tidak dianggap sebagai perintah yang diblokir.

`cron list` dan riwayat proses menampilkan alasan penolakan alih-alih melaporkan perintah yang diblokir sebagai `ok`.

## Retensi

Perilaku retensi:

- `cron.sessionRetention` (default `24h`, atau `false` untuk menonaktifkan) memangkas sesi proses terisolasi yang telah selesai.
- Riwayat proses mempertahankan 2000 baris terminal terbaru per tugas cron. Baris yang hilang tetap menggunakan jendela pembersihan standar 24 jam untuk tugas yang hilang.

## Memigrasikan tugas lama

<Note>
Jika Anda memiliki tugas cron dari sebelum format penyimpanan dan pengiriman saat ini, jalankan `openclaw doctor --fix`. Doctor menormalisasi bidang cron lama (`jobId`, `schedule.cron`, bidang pengiriman tingkat atas termasuk `threadId` lama, alias pengiriman payload `provider`) dan memigrasikan tugas cadangan Webhook `notify: true` dari nilai mentah `cron.webhook` yang telah dihentikan ke pengiriman Webhook eksplisit sebelum menghapus kunci konfigurasi tersebut. Tugas yang sudah mengumumkan ke obrolan mempertahankan pengiriman tersebut dan mendapatkan tujuan Webhook penyelesaian. Tanpa Webhook lama, penanda tingkat atas `notify` yang tidak aktif dihapus untuk tugas tanpa target migrasi (pengiriman yang ada tetap dipertahankan tanpa perubahan), sehingga `doctor --fix` tidak lagi terus memperingatkan tentang tugas tersebut.
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
  "Ringkas pembaruan sepanjang malam." \
  --name "Ringkasan pagi ringan" \
  --session isolated \
  --light-context \
  --no-deliver
```

`--light-context` hanya diterapkan pada tugas giliran agen terisolasi. Untuk proses cron, mode ringan mempertahankan konteks bootstrap tetap kosong alih-alih menyuntikkan kumpulan bootstrap ruang kerja lengkap.

Buat tugas perintah dengan argv, cwd, env, stdin, dan batas keluaran yang tepat:

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

Proses dan pemeriksaan manual:

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

`openclaw cron list` menampilkan semua tugas yang cocok secara default. Berikan `--agent <id>` untuk hanya menampilkan tugas yang ID agen efektif ternormalisasinya cocok; tugas tanpa ID agen tersimpan dihitung sebagai agen default yang dikonfigurasi.

`openclaw cron get <job-id>` mengembalikan JSON tugas yang tersimpan secara langsung. Gunakan `cron show <job-id>` saat Anda menginginkan tampilan yang mudah dibaca manusia dengan pratinjau rute pengiriman.

`cron list --json` dan `cron show <job-id> --json` menyertakan bidang tingkat atas `status` pada setiap tugas, yang dihitung dari `enabled`, `state.runningAtMs`, dan `state.lastRunStatus`. Nilai: `disabled`, `running`, `ok`, `error`, `skipped`, atau `idle`. Status JSON tetap kanonis dan tanpa dekorasi agar alat eksternal dapat membaca status tugas tanpa menghitungnya kembali; keluaran untuk manusia dapat menghiasi status `error` yang berulang dengan jumlah kegagalan.

Entri `cron runs` menyertakan diagnostik pengiriman dengan target cron yang dimaksud, target yang diresolusi, pengiriman alat pesan, penggunaan cadangan, dan status terkirim.

Penargetan ulang agen dan sesi:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` memperingatkan ketika `--agent` tidak disertakan pada tugas giliran agen dan beralih ke agen default (`main`). Berikan `--agent <id>` pada saat pembuatan untuk menetapkan agen tertentu.

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
