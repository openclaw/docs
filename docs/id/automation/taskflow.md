---
read_when:
    - Anda ingin memahami bagaimana Alur Tugas berkaitan dengan tugas latar belakang
    - Anda menemukan Task Flow atau alur tugas openclaw dalam catatan rilis atau dokumentasi
    - Anda ingin memeriksa atau mengelola status alur yang persisten
summary: Alur Tugas lapisan orkestrasi alur di atas tugas latar belakang
title: Alur tugas
x-i18n:
    generated_at: "2026-04-30T09:32:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ab261dea0ec3beb10b53c641bd188288cada5345aef6ddbbc8071d37eb57bdc
    source_path: automation/taskflow.md
    workflow: 16
---

Alur Tugas adalah substrat orkestrasi alur yang berada di atas [tugas latar belakang](/id/automation/tasks). Ini mengelola alur multi-langkah yang tahan lama dengan status, pelacakan revisi, dan semantik sinkronisasinya sendiri, sementara tugas individual tetap menjadi unit kerja terlepas.

## Kapan menggunakan Alur Tugas

Gunakan Alur Tugas ketika pekerjaan mencakup beberapa langkah berurutan atau bercabang dan Anda membutuhkan pelacakan progres yang tahan lama di seluruh restart gateway. Untuk operasi latar belakang tunggal, [tugas](/id/automation/tasks) biasa sudah cukup.

| Skenario                             | Gunakan                  |
| ------------------------------------ | ------------------------ |
| Pekerjaan latar belakang tunggal     | Tugas biasa              |
| Pipeline multi-langkah (A lalu B lalu C) | Alur Tugas (terkelola)   |
| Mengamati tugas yang dibuat secara eksternal | Alur Tugas (dicerminkan) |
| Pengingat sekali jalan               | Pekerjaan Cron           |

## Pola alur kerja terjadwal yang andal

Untuk alur kerja berulang seperti briefing intelijen pasar, perlakukan jadwal, orkestrasi, dan pemeriksaan keandalan sebagai lapisan terpisah:

1. Gunakan [Tugas Terjadwal](/id/automation/cron-jobs) untuk penentuan waktu.
2. Gunakan sesi cron persisten ketika alur kerja perlu dibangun di atas konteks sebelumnya.
3. Gunakan [Lobster](/id/tools/lobster) untuk langkah deterministik, gerbang persetujuan, dan token lanjutkan.
4. Gunakan Alur Tugas untuk melacak eksekusi multi-langkah di seluruh tugas anak, penantian, percobaan ulang, dan restart gateway.

Contoh bentuk cron:

```bash
openclaw cron add \
  --name "Market intelligence brief" \
  --cron "0 7 * * 1-5" \
  --tz "America/New_York" \
  --session session:market-intel \
  --message "Run the market-intel Lobster workflow. Verify source freshness before summarizing." \
  --announce \
  --channel slack \
  --to "channel:C1234567890"
```

Gunakan `session:<id>` alih-alih `isolated` ketika alur kerja berulang membutuhkan riwayat yang disengaja, ringkasan eksekusi sebelumnya, atau konteks tetap. Gunakan `isolated` ketika setiap eksekusi harus dimulai dari awal dan semua status yang diperlukan bersifat eksplisit dalam alur kerja.

Di dalam alur kerja, letakkan pemeriksaan keandalan sebelum langkah ringkasan LLM:

```yaml
name: market-intel-brief
steps:
  - id: preflight
    command: market-intel check --json
  - id: collect
    command: market-intel collect --json
    stdin: $preflight.json
  - id: summarize
    command: market-intel summarize --json
    stdin: $collect.json
  - id: approve
    command: market-intel deliver --preview
    stdin: $summarize.json
    approval: required
  - id: deliver
    command: market-intel deliver --execute
    stdin: $summarize.json
    condition: $approve.approved
```

Pemeriksaan preflight yang direkomendasikan:

- Ketersediaan browser dan pilihan profil, misalnya `openclaw` untuk status terkelola atau `user` ketika sesi Chrome yang sudah masuk diperlukan. Lihat [Browser](/id/tools/browser).
- Kredensial API dan kuota untuk setiap sumber.
- Keterjangkauan jaringan untuk endpoint yang diperlukan.
- Alat yang diperlukan diaktifkan untuk agen, seperti `lobster`, `browser`, dan `llm-task`.
- Tujuan kegagalan dikonfigurasi untuk cron agar kegagalan preflight terlihat. Lihat [Tugas Terjadwal](/id/automation/cron-jobs#delivery-and-output).

Kolom asal-usul data yang direkomendasikan untuk setiap item yang dikumpulkan:

```json
{
  "sourceUrl": "https://example.com/report",
  "retrievedAt": "2026-04-24T12:00:00Z",
  "asOf": "2026-04-24",
  "title": "Example report",
  "content": "..."
}
```

Buat alur kerja menolak atau menandai item yang usang sebelum peringkasan. Langkah LLM sebaiknya hanya menerima JSON terstruktur dan diminta untuk mempertahankan `sourceUrl`, `retrievedAt`, dan `asOf` dalam keluarannya. Gunakan [Tugas LLM](/id/tools/llm-task) ketika Anda membutuhkan langkah model tervalidasi skema di dalam alur kerja.

Untuk alur kerja tim atau komunitas yang dapat digunakan ulang, paketkan CLI, file `.lobster`, dan catatan penyiapan apa pun sebagai skill atau Plugin lalu publikasikan melalui [ClawHub](/id/tools/clawhub). Pertahankan guardrail khusus alur kerja dalam paket tersebut kecuali API Plugin tidak memiliki kapabilitas generik yang diperlukan.

## Mode sinkronisasi

### Mode terkelola

Alur Tugas memiliki siklus hidup dari awal hingga akhir. Ini membuat tugas sebagai langkah alur, mendorongnya hingga selesai, dan memajukan status alur secara otomatis.

Contoh: alur laporan mingguan yang (1) mengumpulkan data, (2) menghasilkan laporan, dan (3) mengirimkannya. Alur Tugas membuat setiap langkah sebagai tugas latar belakang, menunggu penyelesaian, lalu beralih ke langkah berikutnya.

```
Alur: weekly-report
  Langkah 1: gather-data     → tugas dibuat → berhasil
  Langkah 2: generate-report → tugas dibuat → berhasil
  Langkah 3: deliver         → tugas dibuat → berjalan
```

### Mode dicerminkan

Alur Tugas mengamati tugas yang dibuat secara eksternal dan menjaga status alur tetap sinkron tanpa mengambil alih pembuatan tugas. Ini berguna ketika tugas berasal dari pekerjaan cron, perintah CLI, atau sumber lain dan Anda menginginkan tampilan terpadu atas progresnya sebagai alur.

Contoh: tiga pekerjaan cron independen yang bersama-sama membentuk rutinitas "operasi pagi". Alur yang dicerminkan melacak progres kolektifnya tanpa mengontrol kapan atau bagaimana semuanya berjalan.

## Status tahan lama dan pelacakan revisi

Setiap alur mempertahankan statusnya sendiri dan melacak revisi sehingga progres tetap bertahan melewati restart gateway. Pelacakan revisi memungkinkan deteksi konflik ketika beberapa sumber mencoba memajukan alur yang sama secara bersamaan.
Registri alur menggunakan SQLite dengan pemeliharaan write-ahead-log terbatas, termasuk
checkpoint berkala dan saat shutdown, sehingga gateway yang berjalan lama tidak mempertahankan
file sampingan `registry.sqlite-wal` tanpa batas.

## Perilaku pembatalan

`openclaw tasks flow cancel` menetapkan niat pembatalan melekat pada alur. Tugas aktif di dalam alur dibatalkan, dan tidak ada langkah baru yang dimulai. Niat pembatalan tetap ada setelah restart, sehingga alur yang dibatalkan tetap dibatalkan meskipun gateway restart sebelum semua tugas anak berakhir.

## Perintah CLI

```bash
# Daftar alur aktif dan terbaru
openclaw tasks flow list

# Tampilkan detail untuk alur tertentu
openclaw tasks flow show <lookup>

# Batalkan alur yang sedang berjalan dan tugas aktifnya
openclaw tasks flow cancel <lookup>
```

| Perintah                          | Deskripsi                                      |
| --------------------------------- | ---------------------------------------------- |
| `openclaw tasks flow list`        | Menampilkan alur yang dilacak dengan status dan mode sinkronisasi |
| `openclaw tasks flow show <id>`   | Periksa satu alur berdasarkan id alur atau kunci pencarian |
| `openclaw tasks flow cancel <id>` | Batalkan alur yang sedang berjalan dan tugas aktifnya |

## Bagaimana alur berhubungan dengan tugas

Alur mengoordinasikan tugas, bukan menggantikannya. Satu alur dapat menjalankan beberapa tugas latar belakang sepanjang masa hidupnya. Gunakan `openclaw tasks` untuk memeriksa catatan tugas individual dan `openclaw tasks flow` untuk memeriksa alur yang mengorkestrasi.

## Terkait

- [Tugas Latar Belakang](/id/automation/tasks) — buku besar kerja terlepas yang dikoordinasikan oleh alur
- [CLI: tugas](/id/cli/tasks) — referensi perintah CLI untuk `openclaw tasks flow`
- [Ikhtisar Otomatisasi](/id/automation) — semua mekanisme otomatisasi secara sekilas
- [Pekerjaan Cron](/id/automation/cron-jobs) — pekerjaan terjadwal yang dapat memberi masukan ke alur
