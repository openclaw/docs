---
read_when:
    - Menjadwalkan pekerjaan latar belakang atau pemicu bangun
    - Menghubungkan pemicu eksternal (webhook, Gmail) ke OpenClaw
    - Memilih antara Heartbeat dan Cron untuk tugas terjadwal
sidebarTitle: Scheduled tasks
summary: Pekerjaan terjadwal, Webhook, dan pemicu Gmail PubSub untuk penjadwal Gateway
title: Tugas terjadwal
x-i18n:
    generated_at: "2026-07-16T17:47:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9a419d4376fa08df1c429c167ead6918262cc34b986a85ffec024023f6da1eef
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron adalah penjadwal bawaan Gateway. Cron menyimpan tugas, membangunkan agen pada waktu yang tepat, dan dapat mengirimkan keluaran ke kanal obrolan, Webhook, atau tidak ke mana pun.

## Mulai cepat

<Steps>
  <Step title="Tambahkan pengingat sekali jalan">
    ```bash
    openclaw cron create "2027-02-01T16:00:00Z" \
      --name "Reminder" \
      --session main \
      --system-event "Reminder: check the cron docs draft" \
      --wake now \
      --delete-after-run
    ```
  </Step>
  <Step title="Periksa tugas Anda">
    ```bash
    openclaw cron list
    openclaw cron get <job-id>
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="Lihat riwayat eksekusi">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## Cara kerja cron

- Cron berjalan **di dalam proses Gateway**, bukan di dalam model. Gateway harus berjalan agar jadwal dapat dipicu.
- Definisi tugas, status runtime, dan riwayat eksekusi disimpan dalam basis data status SQLite bersama milik OpenClaw, sehingga jadwal tidak hilang saat dimulai ulang.
- Setiap eksekusi cron membuat catatan [tugas latar belakang](/id/automation/tasks).
- Tugas sekali jalan (`--at`) secara default dihapus otomatis setelah berhasil; teruskan `--keep-after-run` untuk mempertahankannya.
- Batas waktu nyata per eksekusi: `--timeout-seconds` jika ditetapkan. Jika tidak, tugas giliran agen yang terisolasi/terlepas dibatasi oleh pengawas 60 menit milik cron sebelum batas waktu giliran agen yang mendasarinya (`agents.defaults.timeoutSeconds`, default 48 jam) dapat berlaku; tugas perintah secara default dibatasi hingga 10 menit.
- Saat Gateway dimulai, tugas giliran agen terisolasi yang terlambat dijadwalkan ulang alih-alih langsung diputar ulang, sehingga pekerjaan bootstrap model/alat tidak dilakukan selama jendela penyambungan kanal.
- Jika Anda menjalankan `openclaw agent` dari cron sistem atau penjadwal eksternal lain, bungkus dengan eskalasi penghentian paksa meskipun CLI sudah menangani `SIGTERM`/`SIGINT`. Eksekusi yang didukung Gateway meminta Gateway membatalkan eksekusi yang diterima; eksekusi fallback lokal dan tertanam menerima sinyal pembatalan yang sama. Untuk GNU `timeout`, pilih `timeout -k 60 600 openclaw agent ...` daripada `timeout 600 ...` biasa — nilai `-k` menjadi pengaman terakhir jika proses tidak dapat diselesaikan tepat waktu. Untuk unit systemd, gunakan sinyal penghentian `SIGTERM` dengan jendela tenggang (`TimeoutStopSec`) sebelum penghentian akhir. Penggunaan ulang `--run-id` saat eksekusi Gateway asli masih aktif akan melaporkan duplikat tersebut sebagai sedang berlangsung alih-alih memulai eksekusi kedua.

<AccordionGroup>
  <Accordion title="Penguatan eksekusi terisolasi">
    - Eksekusi terisolasi berupaya sebaik mungkin untuk menutup tab/proses peramban yang dilacak bagi sesi `cron:<jobId>` miliknya setelah selesai, serta membuang semua instans runtime MCP bawaan yang dibuat untuk tugas melalui jalur pembongkaran bersama yang sama dengan yang digunakan oleh eksekusi sesi utama dan sesi khusus. Kegagalan pembersihan diabaikan agar hasil cron tetap berlaku.
    - Eksekusi terisolasi dengan izin pembersihan mandiri cron yang terbatas dapat membaca status penjadwal, daftar yang difilter mandiri dan hanya berisi tugasnya sendiri, serta riwayat eksekusi tugas tersebut, dan hanya boleh menghapus tugasnya sendiri.
    - Eksekusi terisolasi melindungi dari balasan pengakuan yang kedaluwarsa: jika hasil pertama hanya berupa pembaruan status sementara (`on it`, `pulling everything together`, dan petunjuk serupa) dan tidak ada subagen turunan yang masih bertanggung jawab atas jawaban akhir, OpenClaw memberikan prompt ulang satu kali untuk memperoleh hasil sebenarnya sebelum pengiriman.
    - Metadata penolakan eksekusi terstruktur (termasuk pembungkus `UNAVAILABLE` host Node yang galat bertingkatnya diawali dengan `SYSTEM_RUN_DENIED` atau `INVALID_REQUEST`) dikenali agar perintah yang diblokir tidak dilaporkan sebagai eksekusi berhasil, sementara prosa biasa dari asisten tidak disalahartikan sebagai penolakan.
    - Kegagalan agen pada tingkat eksekusi dihitung sebagai galat tugas meskipun tanpa muatan balasan, sehingga kegagalan model/penyedia meningkatkan penghitung galat dan memicu notifikasi kegagalan alih-alih menandai tugas sebagai berhasil.
    - Ketika tugas mencapai `timeoutSeconds`, cron membatalkan eksekusi dan memberinya jendela pembersihan singkat. Jika eksekusi tidak selesai, pembersihan milik Gateway secara paksa menghapus kepemilikan sesi eksekusi tersebut sebelum cron mencatat batas waktu, sehingga pekerjaan obrolan dalam antrean tidak tertahan oleh sesi pemrosesan yang kedaluwarsa.
    - Kemacetan penyiapan/mulai memiliki batas waktu khusus fase (misalnya `cron: isolated agent setup timed out before runner start` atau `cron: isolated agent run stalled before execution start (last phase: context-engine)`). Pengawas ini mencakup penyedia tertanam dan yang didukung CLI bahkan sebelum proses CLI eksternalnya dimulai, serta dibatasi secara independen dari nilai `timeoutSeconds` yang panjang agar kegagalan mulai dingin/autentikasi/konteks segera muncul.

  </Accordion>
  <Accordion title="Rekonsiliasi tugas">
    Rekonsiliasi tugas Cron pertama-tama dimiliki runtime, kemudian didukung riwayat persisten: tugas cron aktif tetap berjalan selama runtime cron masih melacak tugas tersebut sebagai sedang berjalan, meskipun baris sesi turunan lama masih ada. Setelah runtime berhenti memiliki tugas dan jendela tenggang 5 menit berakhir, pemeriksaan pemeliharaan memeriksa log eksekusi tersimpan dan status tugas untuk eksekusi `cron:<jobId>:<startedAt>` yang sesuai. Hasil terminal di sana menyelesaikan buku besar tugas; jika tidak, pemeliharaan milik Gateway dapat menandai tugas sebagai `lost`. Audit CLI luring dapat memulihkan dari riwayat persisten, tetapi kumpulan tugas aktif dalam proses miliknya yang kosong bukanlah bukti bahwa eksekusi milik Gateway telah berakhir.
  </Accordion>
</AccordionGroup>

## Jenis jadwal

| Jenis     | Flag CLI    | Deskripsi                                                                                                |
| --------- | ----------- | -------------------------------------------------------------------------------------------------------- |
| `at`      | `--at`      | Stempel waktu sekali jalan (ISO 8601 atau relatif seperti `20m`)                                          |
| `every`   | `--every`   | Interval tetap (`10m`, `1h`, `1d`)                                                                    |
| `cron`    | `--cron`    | Ekspresi cron 5 bidang atau 6 bidang dengan `--tz` opsional                                            |
| `on-exit` | `--on-exit` | Dipicu sekali saat perintah yang dipantau selesai (pemicu peristiwa; tetap bertahan setelah pembongkaran giliran; `--on-exit-cwd` opsional) |

Stempel waktu tanpa zona waktu diperlakukan sebagai UTC. Tambahkan `--tz America/New_York` untuk menafsirkan tanggal dan waktu `--at` tanpa offset, atau untuk mengevaluasi ekspresi cron, dalam zona waktu IANA tersebut. Ekspresi cron tanpa `--tz` menggunakan zona waktu host Gateway. `--tz` tidak valid dengan `--every` atau `--on-exit`.

Ekspresi berulang pada awal jam (menit `0` dengan bidang jam wildcard) secara otomatis disebar hingga 5 menit untuk mengurangi lonjakan beban. Gunakan `--exact` untuk memaksakan waktu yang tepat, atau `--stagger 30s` untuk jendela eksplisit (khusus jadwal cron).

### Hari dalam bulan dan hari dalam minggu menggunakan logika OR

Ekspresi cron diurai oleh [croner](https://github.com/Hexagon/croner). Jika bidang hari dalam bulan dan hari dalam minggu sama-sama bukan wildcard, croner mencocokkan ketika **salah satu** bidang cocok, bukan keduanya. Ini adalah perilaku standar cron Vixie.

```bash
# Tujuan: "Pukul 9 pagi pada tanggal 15, hanya jika hari Senin"
# Aktual: "Pukul 9 pagi setiap tanggal 15, DAN pukul 9 pagi setiap hari Senin"
0 9 15 * 1
```

Ini dipicu sekitar 5-6 kali sebulan, bukan 0-1 kali sebulan. Untuk mewajibkan kedua kondisi, gunakan pengubah hari dalam minggu `+` milik croner (`0 9 15 * +1`), atau jadwalkan berdasarkan satu bidang dan validasi bidang lainnya dalam prompt atau perintah tugas Anda.

## Pemicu peristiwa (pemantau kondisi)

Pemicu peristiwa menambahkan skrip kondisi tanpa antarmuka ke jadwal `every` atau `cron`. Cron mengevaluasi skrip saat tugas jatuh tempo dan menjalankan muatan normal hanya jika skrip mengembalikan `fire: true`:

```json5
{
  schedule: { kind: "every", everyMs: 30000 },
  trigger: {
    // Hanya dipicu ketika status yang diamati berbeda dari evaluasi terakhir.
    script: "const res = await tools.call('exec', { command: 'gh pr checks 123 --json state -q \\'.[].state\\' | sort -u' }); const status = String(res?.result?.details?.aggregated ?? '').trim(); json({ fire: status !== trigger.state?.status, message: `PR 123 CI: ${trigger.state?.status ?? 'unknown'} -> ${status}`, state: { status } });",
    once: false,
  },
  payload: { kind: "agentTurn", message: "Investigate the CI status change." },
}
```

Skrip harus mengembalikan `{ fire, message?, state? }`. Status JSON sebelumnya tersedia sebagai `trigger.state` yang dibekukan secara mendalam; kembalikan nilai `state` baru untuk menyimpannya. Status dibatasi hingga 16 KB. Jika hasil pemicuan menyertakan `message`, cron menambahkannya ke teks peristiwa sistem atau pesan giliran agen sebelum eksekusi. `once: true` menonaktifkan tugas setelah muatan yang dipicu pertama berhasil.

`fire: false` menyimpan status evaluasi dan penghitung, lalu menjadwalkan ulang tanpa membuat riwayat eksekusi. Jika eksekusi muatan yang dipicu gagal, `state` yang dikembalikan **tidak** disimpan — evaluasi berikutnya melihat status sebelumnya dan dapat dipicu lagi, jadi tulis skrip sebagai pemeriksaan hanya-baca dan simpan tindakan di dalam muatan. Jadwal pemicu memiliki interval minimum yang dapat dikonfigurasi (default 30 detik). Setiap evaluasi memiliki batas waktu nyata 30 detik dan hingga 5 panggilan alat.

<Warning>
Mengaktifkan `cron.triggers.enabled` memungkinkan skrip buatan agen berjalan tanpa antarmuka dengan **kebijakan alat penuh milik agen tersebut, termasuk `exec`**. Perlakukan ini sebagai eksekusi kode tanpa pengawasan dengan izin agen tersebut; biarkan dinonaktifkan kecuali setiap agen yang diizinkan membuat tugas cron dipercaya untuk hal tersebut.
</Warning>

Buat pemantau dari berkas skrip lokal (`-` membaca skrip dari stdin):

```bash
openclaw cron add \
  --name "PR CI watcher" \
  --every 30s \
  --trigger-script ./watch-pr-ci.js \
  --message "Respond to the CI status change" \
  --session isolated
```

## Muatan

Setiap tugas membawa tepat satu jenis muatan, yang dipilih berdasarkan flag:

| Muatan        | Flag                                           | Eksekusi                                                |
| ------------- | ---------------------------------------------- | ------------------------------------------------------- |
| Peristiwa sistem | `--system-event <text>`                        | Dimasukkan ke antrean sesi utama, tanpa panggilan model secara langsung |
| Pesan agen    | `--message <text>`                             | Giliran agen yang didukung model                        |
| Perintah      | `--command <shell>` atau `--command-argv <json>` | Shell/proses pada host Gateway, tanpa panggilan model   |

### Opsi giliran agen

<ParamField path="--message" type="string" required>
  Teks prompt (diperlukan untuk tugas sesi terisolasi/saat ini/kustom).
</ParamField>
<ParamField path="--model" type="string">
  Penggantian model; harus dapat diresolusi ke model yang diizinkan atau proses akan gagal dengan kesalahan validasi.
</ParamField>
<ParamField path="--fallbacks" type="string">
  Daftar model fallback per tugas, misalnya `--fallbacks openai/gpt-5.6-sol,openrouter/meta-llama/llama-3.3-70b-instruct:free`. Teruskan `--fallbacks ""` untuk proses ketat tanpa fallback.
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  Pada `cron edit`, menghapus penggantian fallback per tugas sehingga tugas mengikuti urutan prioritas fallback yang dikonfigurasi. Tidak dapat digabungkan dengan `--fallbacks`.
</ParamField>
<ParamField path="--clear-model" type="boolean">
  Pada `cron edit`, menghapus penggantian model per tugas sehingga tugas mengikuti urutan prioritas model cron normal (penggantian sesi cron tersimpan, atau model agen/default). Tidak dapat digabungkan dengan `--model`.
</ParamField>
<ParamField path="--thinking" type="string">
  Penggantian tingkat penalaran (`off|minimal|low|medium|high|xhigh|adaptive|max|ultra`). Tingkat yang tersedia tetap bergantung pada model dan runtime agen yang dipilih.
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  Pada `cron edit`, menghapus penggantian penalaran per tugas. Tidak dapat digabungkan dengan `--thinking`.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Lewati injeksi file bootstrap ruang kerja.
</ParamField>
<ParamField path="--tools" type="string">
  Batasi alat yang dapat digunakan oleh tugas, misalnya `--tools exec,read`.
</ParamField>

`--model` menetapkan model utama tugas; ini tidak menggantikan penggantian `/model` sesi, sehingga rantai fallback yang dikonfigurasi tetap berlaku di atasnya. Model yang tidak dapat diresolusi atau tidak diizinkan menyebabkan proses gagal dengan kesalahan validasi eksplisit, bukan diam-diam beralih ke default. Jika tugas memiliki `--model` tetapi tidak memiliki daftar fallback eksplisit atau terkonfigurasi, OpenClaw meneruskan penggantian fallback kosong, bukan diam-diam menambahkan model utama agen sebagai target percobaan ulang tersembunyi.

Urutan prioritas pemilihan model untuk tugas terisolasi, dari tertinggi:

1. Payload per tugas `model` (konfigurasi eksplisit; model yang tidak diizinkan menyebabkan proses gagal)
2. Penggantian model hook Gmail (hanya ketika proses berasal dari Gmail dan penggantian tersebut diizinkan)
3. Penggantian model sesi cron tersimpan yang dipilih pengguna
4. Pemilihan model agen/default

Mode cepat mengikuti pilihan aktif yang telah diresolusi. Jika konfigurasi model yang dipilih memiliki `params.fastMode`, cron terisolasi menggunakannya secara default; penggantian `fastMode` sesi tersimpan (kemudian `fastModeDefault` agen) tetap mengungguli konfigurasi model dalam kedua arah. Mode otomatis menggunakan ambang batas `params.fastAutoOnSeconds` model, dengan default 60 detik.

Jika proses mengalami serah terima pergantian model aktif, cron mencoba ulang dengan penyedia/model yang telah diganti dan menyimpan pilihan tersebut (serta profil autentikasi baru apa pun) untuk proses aktif. Percobaan ulang dibatasi: setelah percobaan awal ditambah 2 percobaan ulang pergantian, cron berhenti alih-alih terus berulang.

Sebelum proses terisolasi dimulai, OpenClaw memeriksa endpoint lokal yang dapat dijangkau untuk penyedia `api: "ollama"` dan `api: "openai-completions"` terkonfigurasi yang `baseUrl`-nya berupa loopback, jaringan privat, atau `.local`. Pemeriksaan awal ini menelusuri rantai fallback yang dikonfigurasi untuk tugas dan hanya menandai proses sebagai `skipped` setelah setiap kandidat tidak dapat dijangkau; `--fallbacks ""` membatasi penelusuran tersebut secara ketat hanya pada model utama. Endpoint yang tidak aktif mencatat proses sebagai `skipped` dengan kesalahan yang jelas, bukan memulai panggilan model. Hasilnya disimpan dalam cache selama 5 menit per endpoint (bukan per tugas atau model), sehingga banyak tugas jatuh tempo yang menggunakan server lokal Ollama/vLLM/SGLang/LM Studio yang tidak aktif hanya memerlukan satu pemeriksaan, bukan membanjiri server dengan permintaan. Proses yang dilewati oleh pemeriksaan awal tidak menambah backoff kesalahan eksekusi; tetapkan `failureAlert.includeSkipped` untuk mengaktifkan peringatan berulang atas proses yang dilewati.

### Payload perintah

Payload perintah menjalankan skrip deterministik di dalam penjadwal Gateway tanpa memulai giliran yang didukung model. Payload tersebut dieksekusi pada host Gateway, menangkap stdout/stderr, mencatat proses dalam riwayat cron, dan menggunakan kembali mode pengiriman `announce`, `webhook`, dan `none` yang sama seperti tugas giliran agen.

<Note>
Cron perintah adalah permukaan otomatisasi Gateway untuk admin operator, bukan panggilan `tools.exec` agen. Membuat, memperbarui, menghapus, atau menjalankan tugas cron secara manual memerlukan `operator.admin`; proses perintah terjadwal kemudian dieksekusi di dalam proses Gateway sebagai otomatisasi yang dibuat admin tersebut. Kebijakan eksekusi agen (`tools.exec.mode`, prompt persetujuan, daftar alat yang diizinkan per agen) mengatur alat eksekusi yang terlihat oleh model, bukan payload cron perintah.
</Note>

```bash
openclaw cron create "*/15 * * * *" \
  --name "Queue depth probe" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` menyimpan `argv: ["sh", "-lc", <shell>]`. Gunakan `--command-argv '["node","scripts/report.mjs"]'` untuk eksekusi argv persis tanpa penguraian shell. `--command-env KEY=VALUE` opsional (dapat diulang), `--command-input`, `--timeout-seconds` (default 10 menit), `--no-output-timeout-seconds`, dan `--output-max-bytes` mengendalikan lingkungan proses, stdin, dan batas keluaran.

Teks yang dikirim berasal dari keluaran proses: stdout yang tidak kosong diprioritaskan; jika stdout kosong dan stderr tidak kosong, stderr akan dikirim; jika keduanya tersedia, cron mengirim blok kecil `stdout:` / `stderr:`. Kode keluar `0` mencatat proses sebagai `ok`; kode keluar bukan nol, sinyal, batas waktu, atau batas waktu tanpa keluaran mencatat `error` dan dapat memicu peringatan kegagalan. Perintah yang hanya mencetak `NO_REPLY` menggunakan penyembunyian token senyap cron normal dan tidak mengirim apa pun kembali ke obrolan.

## Gaya eksekusi

| Gaya           | Nilai `--session`   | Berjalan di                  | Paling sesuai untuk                        |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| Sesi utama    | `main`              | Jalur bangun cron khusus | Pengingat, peristiwa sistem        |
| Terisolasi        | `isolated`          | `cron:<jobId>` khusus | Laporan, tugas latar belakang      |
| Sesi saat ini | `current`           | Diikat saat pembuatan   | Pekerjaan berulang yang mempertimbangkan konteks    |
| Sesi kustom  | `session:custom-id` | Sesi bernama persisten | Alur kerja yang dibangun berdasarkan riwayat |

<AccordionGroup>
  <Accordion title="Sesi utama vs terisolasi vs kustom">
    Tugas **sesi utama** mengantrekan peristiwa sistem ke jalur proses milik cron dan secara opsional membangunkan heartbeat (`--wake now` atau `--wake next-heartbeat`). Tugas tersebut dapat menggunakan konteks pengiriman terakhir sesi utama target untuk balasan, tetapi tidak menambahkan giliran cron rutin ke jalur obrolan manusia dan tidak memperpanjang kebaruan reset harian/menganggur untuk sesi target. Tugas **terisolasi** menjalankan giliran agen khusus dengan sesi baru. **Sesi kustom** (`session:xxx`) mempertahankan konteks di antara proses, sehingga memungkinkan alur kerja seperti rapat singkat harian yang dibangun berdasarkan ringkasan sebelumnya.

    Peristiwa cron sesi utama adalah pengingat peristiwa sistem yang mandiri. Peristiwa tersebut tidak secara otomatis menyertakan instruksi "Read HEARTBEAT.md" dari prompt heartbeat default; nyatakan instruksi tersebut secara eksplisit dalam teks peristiwa cron jika pengingat perlu merujuk ke `HEARTBEAT.md`.

  </Accordion>
  <Accordion title="Arti 'sesi baru' untuk tugas terisolasi">
    ID transkrip/sesi baru untuk setiap proses. OpenClaw membawa preferensi yang aman (pengaturan penalaran/cepat/verbose, label, penggantian model/autentikasi eksplisit yang dipilih pengguna), tetapi tidak mewarisi konteks percakapan sekitar dari baris cron lama: perutean kanal/grup, kebijakan kirim atau antre, elevasi, asal, atau pengikatan runtime ACP. Gunakan `current` atau `session:<id>` ketika tugas berulang sengaja perlu dibangun berdasarkan konteks percakapan yang sama.
  </Accordion>
  <Accordion title="Pengiriman subagen dan Discord">
    Ketika proses cron terisolasi mengorkestrasi subagen, pengiriman memprioritaskan keluaran turunan terakhir daripada teks sementara induk yang sudah usang. Jika turunan masih berjalan, OpenClaw menyembunyikan pembaruan parsial induk tersebut alih-alih mengumumkannya.

    Untuk target pengumuman Discord khusus teks, OpenClaw mengirim teks asisten akhir kanonis satu kali, bukan memutar ulang teks streaming/perantara sekaligus jawaban akhir. Media dan payload Discord terstruktur tetap dikirim secara terpisah agar lampiran dan komponen tidak terlewat.

  </Accordion>
</AccordionGroup>

## Pengiriman dan keluaran

| Mode       | Yang terjadi                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Kirim teks akhir sebagai fallback ke target jika agen tidak mengirim |
| `webhook`  | POST payload peristiwa selesai ke URL                                |
| `none`     | Tidak ada pengiriman fallback dari runner                                         |

Gunakan `--announce --channel telegram --to "-1001234567890"` untuk pengiriman kanal. Untuk topik forum Telegram, gunakan `-1001234567890:topic:123`; OpenClaw juga menerima bentuk singkat milik Telegram, `-1001234567890:123`. Pemanggil RPC/konfigurasi langsung dapat meneruskan `delivery.threadId` sebagai string atau angka. Target Slack/Discord/Mattermost menggunakan prefiks eksplisit (`channel:<id>`, `user:<id>`). ID ruang Matrix peka huruf besar-kecil; gunakan ID ruang yang tepat atau bentuk `room:!room:server` dari Matrix.

Ketika pengiriman pengumuman menggunakan `channel: "last"` atau menghilangkan `channel`, target berprefiks penyedia seperti `telegram:123` dapat memilih kanal sebelum cron beralih ke riwayat sesi atau satu kanal yang dikonfigurasi. Hanya prefiks yang diiklankan oleh Plugin yang dimuat yang berfungsi sebagai pemilih penyedia. Jika `delivery.channel` ditentukan secara eksplisit, prefiks target harus menyebutkan penyedia yang sama; `channel: "whatsapp"` dengan `to: "telegram:123"` ditolak alih-alih membiarkan WhatsApp menafsirkan ID Telegram sebagai nomor telepon. Prefiks jenis target dan layanan (`channel:<id>`, `user:<id>`, `imessage:<handle>`, `sms:<number>`) tetap merupakan sintaks target milik kanal, bukan pemilih penyedia.

Untuk tugas terisolasi, pengiriman obrolan digunakan bersama: jika rute obrolan tersedia, agen dapat menggunakan alat `message` bahkan dengan `--no-deliver`. Jika agen mengirim ke target yang dikonfigurasi/saat ini, OpenClaw melewati pengumuman fallback. Jika tidak, `announce`, `webhook`, dan `none` hanya mengendalikan tindakan runner terhadap balasan akhir setelah giliran agen.

Ketika agen membuat pengingat terisolasi dari obrolan aktif, OpenClaw menyimpan target pengiriman aktif yang dipertahankan untuk rute pengumuman fallback. Kunci sesi internal mungkin menggunakan huruf kecil; target pengiriman penyedia tidak direkonstruksi dari kunci tersebut ketika konteks obrolan saat ini tersedia.

Pengiriman pengumuman implisit menggunakan daftar kanal yang diizinkan dan telah dikonfigurasi untuk memvalidasi serta merutekan ulang target usang. Persetujuan penyimpanan pemasangan DM bukan penerima otomatisasi fallback; tetapkan `delivery.to` atau konfigurasikan entri `allowFrom` kanal ketika tugas terjadwal harus secara proaktif mengirim ke DM.

### Notifikasi kegagalan

Notifikasi kegagalan mengikuti jalur tujuan terpisah:

- `cron.failureDestination` menetapkan nilai default global untuk notifikasi kegagalan.
- `job.delivery.failureDestination` menggantikannya untuk setiap tugas.
- Jika keduanya tidak ditetapkan dan tugas sudah mengirim melalui `announce`, notifikasi kegagalan akan menggunakan target pengumuman utama tersebut sebagai fallback.
- `delivery.failureDestination` hanya didukung pada tugas `sessionTarget="isolated"`, kecuali mode pengiriman utamanya adalah `webhook`.
- `failureAlert.includeSkipped: true` mengikutsertakan tugas atau kebijakan peringatan Cron global dalam peringatan berulang untuk proses yang dilewati. Proses yang dilewati memiliki penghitung lompatan berturut-turut yang terpisah sehingga tidak memengaruhi backoff kesalahan eksekusi.
- `openclaw cron edit` menyediakan penyesuaian peringatan per tugas: `--failure-alert`/`--no-failure-alert`, `--failure-alert-after <n>`, `--failure-alert-channel`, `--failure-alert-to`, `--failure-alert-cooldown`, `--failure-alert-include-skipped`/`--failure-alert-exclude-skipped`, `--failure-alert-mode`, dan `--failure-alert-account-id`.

### Bahasa keluaran

Tugas Cron tidak menyimpulkan bahasa balasan dari saluran, lokal, atau pesan sebelumnya. Cantumkan aturan bahasa dalam pesan atau templat terjadwal:

```bash
openclaw cron edit <jobId> \
  --message "Ringkas pembaruan. Berikan respons dalam bahasa Tionghoa; jangan ubah URL, kode, dan nama produk."
```

Untuk berkas templat, pertahankan instruksi bahasa dalam prompt yang dirender dan pastikan placeholder seperti `{{language}}` telah diisi sebelum tugas dijalankan. Jika keluaran mencampur bahasa, nyatakan aturannya secara eksplisit, misalnya: "Gunakan bahasa Tionghoa untuk teks naratif dan pertahankan istilah teknis dalam bahasa Inggris."

## Contoh CLI

<Tabs>
  <Tab title="Pengingat sekali jalan">
    ```bash
    openclaw cron add \
      --name "Pemeriksaan kalender" \
      --at "20m" \
      --session main \
      --system-event "Heartbeat berikutnya: periksa kalender." \
      --wake now
    ```
  </Tab>
  <Tab title="Tugas terisolasi berulang">
    ```bash
    openclaw cron create "0 7 * * *" \
      "Ringkas pembaruan semalam." \
      --name "Ringkasan pagi" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --announce \
      --channel slack \
      --to "channel:C1234567890"
    ```
  </Tab>
  <Tab title="Penggantian model dan penalaran">
    ```bash
    openclaw cron add \
      --name "Analisis mendalam" \
      --cron "0 6 * * 1" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --message "Analisis mendalam mingguan mengenai kemajuan proyek." \
      --model "opus" \
      --thinking high \
      --announce
    ```
  </Tab>
  <Tab title="Keluaran Webhook">
    ```bash
    openclaw cron create "0 18 * * 1-5" \
      "Ringkas deployment hari ini sebagai JSON." \
      --name "Rangkuman deployment" \
      --webhook "https://example.invalid/openclaw/cron"
    ```
  </Tab>
  <Tab title="Keluaran perintah">
    ```bash
    openclaw cron create "*/15 * * * *" \
      --name "Probe kedalaman antrean" \
      --command "scripts/check-queue.sh" \
      --command-cwd "/srv/app" \
      --announce \
      --channel telegram \
      --to "-1001234567890"
    ```
  </Tab>
</Tabs>

## Mengelola tugas

```bash
# Cantumkan semua tugas
openclaw cron list

# Dapatkan satu tugas tersimpan sebagai JSON
openclaw cron get <jobId>

# Tampilkan satu tugas, termasuk rute pengiriman yang telah ditentukan
openclaw cron show <jobId>

# Aktifkan/nonaktifkan tanpa menghapus
openclaw cron enable <jobId>
openclaw cron disable <jobId>

# Edit tugas
openclaw cron edit <jobId> --message "Prompt yang diperbarui" --model "opus"

# Paksa jalankan tugas sekarang
openclaw cron run <jobId>

# Paksa jalankan tugas sekarang dan tunggu status akhirnya
openclaw cron run <jobId> --wait --wait-timeout 10m --poll-interval 2s

# Jalankan hanya jika sudah waktunya
openclaw cron run <jobId> --due

# Lihat riwayat proses
openclaw cron runs --id <jobId> --limit 50

# Lihat satu proses tertentu
openclaw cron runs --id <jobId> --run-id <runId>

# Hapus tugas
openclaw cron remove <jobId>

# Pemilihan agen (penyiapan multiagen)
openclaw cron create "0 6 * * *" "Periksa antrean operasi" --name "Penyisiran operasi" --session isolated --agent ops
openclaw cron edit <jobId> --clear-agent
```

Mengarsipkan sesi (Control UI, atau `sessions.patch { archived: true }` dari pemanggil operator-admin) akan menonaktifkan setiap tugas Cron aktif yang terikat ke sesi tersebut: sesi `cron:<jobId>` terisolasinya, target `session:<key>`, atau jalur pengiriman/pengaktifan `sessionKey`. Memulihkan sesi tidak mengaktifkan kembali tugas tersebut; gunakan `openclaw cron enable <jobId>`. Sesi yang memiliki tugas terikat aktif menampilkan lencana jam di bilah samping Control UI.

`openclaw cron run <jobId>` kembali setelah proses manual dimasukkan ke antrean. Gunakan `--wait` untuk hook penonaktifan, skrip pemeliharaan, atau otomatisasi lain yang harus memblokir hingga proses dalam antrean selesai; perintah ini melakukan polling terhadap `runId` yang dikembalikan (batas waktu default `10m`, interval polling `2s`) dan keluar dengan `0` untuk status `ok`, atau nilai bukan nol untuk `error`, `skipped`, atau jika waktu tunggu habis.

Alat agen `cron` mengembalikan ringkasan tugas yang ringkas (`id`, `name`, `enabled`, `nextRunAtMs`, `scheduleKind`, `lastRunStatus`) dari `cron(action: "list")`; gunakan `cron(action: "get", jobId: "...")` untuk satu definisi tugas lengkap. Pemanggil Gateway langsung dapat meneruskan `compact: true` ke `cron.list`; menghilangkannya mempertahankan respons lengkap beserta pratinjau pengiriman.

`openclaw cron create` adalah alias untuk `openclaw cron add`. Tugas baru dapat menggunakan jadwal posisional (`"0 9 * * 1"`, `"every 1h"`, `"20m"`, atau stempel waktu ISO) yang diikuti prompt agen posisional. Gunakan `--webhook <url>` pada `cron add|create` atau `cron edit` untuk melakukan POST terhadap payload proses yang telah selesai ke endpoint HTTP; pengiriman Webhook tidak dapat digabungkan dengan flag pengiriman chat (`--announce`, `--channel`, `--to`, `--thread-id`, `--account`). Pada `cron edit`, `--clear-channel`, `--clear-to`, `--clear-thread-id`, dan `--clear-account`, hapus penetapan bidang perutean tersebut satu per satu (masing-masing ditolak jika digunakan bersama flag penetapan pasangannya) — berbeda dengan `--no-deliver`, yang hanya menonaktifkan pengiriman fallback runner.

<Note>
Catatan penggantian model:

- `openclaw cron add|edit --model ...` mengubah model yang dipilih untuk tugas.
- Jika model diizinkan, provider/model tersebut secara persis digunakan dalam proses agen terisolasi.
- Jika tidak diizinkan atau tidak dapat ditentukan, Cron menggagalkan proses dengan kesalahan validasi eksplisit.
- Patch payload API `cron.update` dapat menetapkan `model: null` untuk menghapus penggantian model tugas yang tersimpan.
- `openclaw cron edit <job-id> --clear-model` menghapus penggantian tersebut dari CLI (efeknya sama dengan patch `model: null`) dan tidak dapat digabungkan dengan `--model`.
- Rantai fallback yang dikonfigurasi tetap berlaku karena `--model` Cron adalah model utama tugas, bukan penggantian `/model` sesi.
- `openclaw cron add|edit --fallbacks ...` menetapkan `fallbacks` payload, menggantikan fallback yang dikonfigurasi untuk tugas tersebut; `--fallbacks ""` menonaktifkan fallback dan membuat proses menjadi ketat. `openclaw cron edit <job-id> --clear-fallbacks` menghapus penggantian per tugas.
- `--model` biasa tanpa daftar fallback eksplisit atau terkonfigurasi tidak akan diteruskan ke model utama agen sebagai target percobaan ulang tambahan secara diam-diam.

</Note>

## Webhook

Gateway dapat menyediakan endpoint Webhook HTTP untuk pemicu eksternal. Aktifkan dalam konfigurasi:

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
  },
}
```

### Autentikasi

Setiap permintaan harus menyertakan token hook melalui header:

- `Authorization: Bearer <token>` (disarankan)
- `x-openclaw-token: <token>`

Token string kueri ditolak.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    Masukkan peristiwa sistem ke antrean untuk sesi utama:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/wake \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"text":"Email baru diterima","mode":"now"}'
    ```

    <ParamField path="text" type="string" required>
      Deskripsi peristiwa.
    </ParamField>
    <ParamField path="mode" type="string" default="now">
      `now` atau `next-heartbeat`.
    </ParamField>

  </Accordion>
  <Accordion title="POST /hooks/agent">
    Jalankan satu giliran agen terisolasi:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Ringkas kotak masuk","name":"Email","model":"openai/gpt-5.6-sol"}'
    ```

    Bidang: `message` (wajib), `name`, `agentId`, `sessionKey` (memerlukan `hooks.allowRequestSessionKey=true`), `idempotencyKey`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Hook yang dipetakan (POST /hooks/<name>)">
    Nama hook khusus ditentukan melalui `hooks.mappings` dalam konfigurasi. Pemetaan dapat mengubah payload arbitrer menjadi tindakan `wake` atau `agent` dengan templat atau transformasi kode.
  </Accordion>
</AccordionGroup>

<Warning>
Tempatkan endpoint hook di balik loopback, tailnet, atau reverse proxy tepercaya.

- Gunakan token hook khusus; jangan gunakan kembali token autentikasi Gateway.
- Pertahankan `hooks.path` pada subjalur khusus; `/` ditolak.
- Tetapkan `hooks.allowedAgentIds` untuk membatasi agen efektif yang dapat ditargetkan oleh hook, termasuk agen default ketika `agentId` dihilangkan.
- Pertahankan `hooks.allowRequestSessionKey=false`, kecuali Anda memerlukan sesi yang dipilih pemanggil.
- Jika Anda mengaktifkan `hooks.allowRequestSessionKey`, tetapkan juga `hooks.allowedSessionKeyPrefixes` untuk membatasi bentuk kunci sesi yang diizinkan.
- Secara default, payload hook dibungkus dengan batas keamanan.

</Warning>

## Integrasi Gmail PubSub

Hubungkan pemicu kotak masuk Gmail ke OpenClaw melalui Google PubSub.

<Note>
**Prasyarat:** CLI `gcloud`, `gog` (gogcli), hook OpenClaw diaktifkan, Tailscale untuk endpoint HTTPS publik.
</Note>

### Penyiapan dengan wizard (disarankan)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Perintah ini menulis konfigurasi `hooks.gmail`, mengaktifkan preset Gmail, dan secara default menggunakan Tailscale Funnel untuk endpoint push (`--tailscale funnel|serve|off`).

<Warning>
Sesi per pesan pada preset Gmail memisahkan konteks percakapan; sesi tersebut tidak membatasi alat atau ruang kerja agen target. Tanpa pemetaan khusus yang menetapkan `agentId`, hook Gmail dijalankan sebagai agen default.

Untuk kotak masuk yang tidak tepercaya, rutekan hook ke agen pembaca khusus, berikan agen tersebut akses hanya-baca atau tanpa akses ruang kerja, serta tolak alat tulis sistem berkas, shell, browser, dan alat lain yang tidak diperlukan. Jika perlu memberi tahu agen utama, izinkan hanya serah terima antaragen yang diperlukan. Lihat [Injeksi prompt](/id/gateway/security#prompt-injection), [Sandbox dan alat multiagen](/id/tools/multi-agent-sandbox-tools), dan [`tools.agentToAgent`](/id/gateway/config-tools#toolsagenttoagent).
</Warning>

### Mulai otomatis Gateway

Ketika `hooks.enabled=true` dan `hooks.gmail.account` ditetapkan, Gateway memulai `gog gmail watch serve` saat boot dan memperpanjang watch secara otomatis. Tetapkan `OPENCLAW_SKIP_GMAIL_WATCHER=1` untuk menonaktifkannya.

### Penyiapan manual satu kali

<Steps>
  <Step title="Pilih proyek GCP">
    Pilih proyek GCP yang memiliki klien OAuth yang digunakan oleh `gog`:

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="Buat topik dan berikan akses push Gmail">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="Mulai pemantauan">
    ```bash
    gog gmail watch start \
      --account openclaw@gmail.com \
      --label INBOX \
      --topic projects/<project-id>/topics/gog-gmail-watch
    ```
  </Step>
</Steps>

### Penggantian model Gmail

```json5
{
  hooks: {
    gmail: {
      model: "openai/gpt-5.6-sol",
      thinking: "high",
    },
  },
}
```

Gunakan model generasi terbaru dengan tingkat terbaik yang tersedia dari penyedia Anda untuk kotak masuk yang tidak tepercaya. Nilai di atas adalah contoh; model tersebut harus tersedia dalam katalog dan daftar izin yang telah Anda konfigurasi.

## Konfigurasi

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 8,
    triggers: {
      enabled: false,
      minIntervalMs: 30000,
    },
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
    webhookToken: "replace-with-dedicated-webhook-token",
    sessionRetention: "24h",
  },
}
```

Nilai `retry` di atas adalah nilai default: hingga 3 percobaan ulang dengan backoff `30s/60s/5m`, dengan mencoba ulang kelima kategori kegagalan sementara. `webhookToken` dikirim sebagai `Authorization: Bearer <token>` pada POST Webhook cron.

`maxConcurrentRuns` membatasi pengiriman cron terjadwal dan eksekusi giliran agen terisolasi, dengan nilai default 8. Giliran agen cron terisolasi menggunakan jalur eksekusi `cron-nested` khusus milik antrean secara internal, sehingga menaikkan nilai ini memungkinkan proses LLM cron yang independen berjalan secara paralel, alih-alih hanya memulai pembungkus cron luarnya. Jalur `nested` bersama non-cron tidak diperlebar oleh pengaturan ini.

`cron.store` adalah kunci penyimpanan logis dan jalur migrasi doctor, bukan file JSON aktif yang dapat diedit secara manual. Data pekerjaan disimpan di SQLite; gunakan CLI atau API Gateway untuk melakukan perubahan.

Nonaktifkan cron: `cron.enabled: false` atau `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Perilaku percobaan ulang">
    **Percobaan ulang satu kali**: kesalahan sementara (batas laju, kelebihan beban, jaringan, batas waktu, kesalahan server) dicoba ulang hingga `retry.maxAttempts` kali (default 3) menggunakan `retry.backoffMs` (default 30s, 60s, 5m). Kesalahan permanen langsung menonaktifkan pekerjaan.

    **Percobaan ulang berulang**: kesalahan eksekusi berturut-turut menggunakan backoff dengan jadwal yang diperpanjang (30s, 60s, 5m, 15m, 60m). Backoff direset setelah eksekusi berikutnya berhasil.

  </Accordion>
  <Accordion title="Pemeliharaan">
    `cron.sessionRetention` (default `24h`, `false` menonaktifkan) memangkas entri sesi eksekusi terisolasi. Riwayat eksekusi menyimpan 2000 baris terminal terbaru per pekerjaan; baris yang hilang tetap mempertahankan jangka waktu pembersihan 24 jam.
  </Accordion>
  <Accordion title="Migrasi penyimpanan lama">
    Saat melakukan peningkatan, jalankan `openclaw doctor --fix` untuk mengimpor file `~/.openclaw/cron/jobs.json`, `jobs-state.json`, dan `runs/*.jsonl` lama ke SQLite serta mengganti namanya dengan akhiran `.migrated`. Baris pekerjaan yang tidak valid dilewati oleh runtime dan disalin ke `jobs-quarantine.json` untuk diperbaiki atau ditinjau nanti.
  </Accordion>
</AccordionGroup>

## Pemecahan masalah

### Urutan perintah

```bash
openclaw status
openclaw gateway status
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
openclaw doctor
```

<AccordionGroup>
  <Accordion title="Cron tidak terpicu">
    - Periksa `cron.enabled` dan variabel lingkungan `OPENCLAW_SKIP_CRON`.
    - Pastikan Gateway terus berjalan.
    - Untuk jadwal `cron`, verifikasi zona waktu (`--tz`) terhadap zona waktu host.
    - `reason: not-due` dalam keluaran eksekusi berarti eksekusi manual diperiksa dengan `openclaw cron run <jobId> --due` dan pekerjaan tersebut belum waktunya dijalankan.

  </Accordion>
  <Accordion title="Cron terpicu tetapi tidak ada pengiriman">
    - Mode pengiriman `none` berarti tidak ada pengiriman fallback dari runner yang diharapkan. Agen tetap dapat mengirim secara langsung dengan alat `message` ketika rute percakapan tersedia.
    - Target pengiriman yang tidak ada/tidak valid (`channel`/`to`) berarti pengiriman keluar dilewati.
    - Untuk Matrix, pekerjaan yang disalin atau pekerjaan lama dengan ID ruang `delivery.to` berhuruf kecil dapat gagal karena ID ruang Matrix peka huruf besar-kecil. Edit pekerjaan tersebut agar menggunakan nilai `!room:server` atau `room:!room:server` yang tepat dari Matrix.
    - Kesalahan autentikasi kanal (`unauthorized`, `Forbidden`) berarti pengiriman diblokir oleh kredensial.
    - Jika eksekusi terisolasi hanya mengembalikan token senyap (`NO_REPLY` / `no_reply`), OpenClaw menekan pengiriman keluar langsung dan jalur ringkasan antrean fallback, sehingga tidak ada yang dikirim kembali ke percakapan.
    - Jika agen harus mengirim pesan sendiri kepada pengguna, pastikan pekerjaan memiliki rute yang dapat digunakan (`channel: "last"` dengan percakapan sebelumnya, atau kanal/target eksplisit).

  </Accordion>
  <Accordion title="Cron atau Heartbeat tampaknya mencegah peralihan bergaya /new">
    - Kesegaran reset harian dan saat menganggur tidak didasarkan pada `updatedAt`; lihat [Pengelolaan sesi](/id/concepts/session#session-lifecycle).
    - Aktivasi cron, eksekusi Heartbeat, notifikasi exec, dan pembukuan Gateway dapat memperbarui baris sesi untuk perutean/status, tetapi tidak memperpanjang `sessionStartedAt` atau `lastInteractionAt`.
    - Untuk baris lama yang dibuat sebelum bidang tersebut tersedia, OpenClaw dapat memulihkan `sessionStartedAt` dari header sesi transkrip JSONL ketika file masih tersedia. Baris menganggur lama tanpa `lastInteractionAt` menggunakan waktu mulai yang dipulihkan tersebut sebagai acuan waktu menganggurnya.

  </Accordion>
  <Accordion title="Hal yang perlu diperhatikan terkait zona waktu">
    - Cron tanpa `--tz` menggunakan zona waktu host Gateway.
    - Jadwal `at` tanpa zona waktu dianggap sebagai UTC.
    - `activeHours` Heartbeat menggunakan resolusi zona waktu yang dikonfigurasi.

  </Accordion>
</AccordionGroup>

## Terkait

- [Otomatisasi](/id/automation) — sekilas tentang semua mekanisme otomatisasi
- [Tugas Latar Belakang](/id/automation/tasks) — buku besar tugas untuk eksekusi cron
- [Heartbeat](/id/gateway/heartbeat) — giliran sesi utama berkala
- [Zona waktu](/id/concepts/timezone) — konfigurasi zona waktu
