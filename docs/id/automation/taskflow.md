---
read_when:
    - Anda ingin memahami bagaimana Alur Tugas berkaitan dengan tugas latar belakang
    - Anda menjumpai Alur Tugas atau alur tugas openclaw dalam catatan rilis atau dokumentasi
    - Anda ingin memeriksa atau mengelola status flow yang tahan lama
summary: Lapisan orkestrasi alur tugas di atas tugas latar belakang
title: Alur tugas
x-i18n:
    generated_at: "2026-07-02T08:51:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e4f5ff3c9a68eb0408a180bc947a03b410568d7914cb1c1d7f31d6013e036096
    source_path: automation/taskflow.md
    workflow: 16
---

Task Flow adalah substrat orkestrasi alur yang berada di atas [tugas latar belakang](/id/automation/tasks). Ia mengelola alur multi-langkah yang durabel dengan status, pelacakan revisi, dan semantik sinkronisasinya sendiri, sementara tugas individual tetap menjadi unit pekerjaan terlepas.

## Kapan menggunakan Task Flow

Gunakan Task Flow ketika pekerjaan mencakup beberapa langkah berurutan atau bercabang dan Anda membutuhkan pelacakan progres yang durabel di seluruh restart gateway. Untuk operasi latar belakang tunggal, [tugas](/id/automation/tasks) biasa sudah memadai.

| Skenario                              | Penggunaan             |
| ------------------------------------- | ---------------------- |
| Pekerjaan latar belakang tunggal      | Tugas biasa            |
| Pipeline multi-langkah (A lalu B lalu C) | Task Flow (terkelola) |
| Mengamati tugas yang dibuat secara eksternal | Task Flow (tercermin) |
| Pengingat sekali jalan                | Cron job               |

## Pola alur kerja terjadwal yang andal

Untuk alur kerja berulang seperti ringkasan intelijen pasar, perlakukan jadwal, orkestrasi, dan pemeriksaan keandalan sebagai lapisan terpisah:

1. Gunakan [Tugas Terjadwal](/id/automation/cron-jobs) untuk pengaturan waktu.
2. Gunakan sesi cron persisten ketika alur kerja harus dibangun di atas konteks sebelumnya.
3. Gunakan [Lobster](/id/tools/lobster) untuk langkah deterministik, gerbang persetujuan, dan token lanjutkan.
4. Gunakan Task Flow untuk melacak eksekusi multi-langkah di seluruh tugas turunan, penantian, percobaan ulang, dan restart gateway.

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

Gunakan `session:<id>` alih-alih `isolated` ketika alur kerja berulang membutuhkan riwayat yang disengaja, ringkasan eksekusi sebelumnya, atau konteks tetap. Gunakan `isolated` ketika setiap eksekusi harus dimulai dari awal dan semua status yang diperlukan dinyatakan secara eksplisit dalam alur kerja.

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

Buat alur kerja menolak atau menandai item kedaluwarsa sebelum peringkasan. Langkah LLM sebaiknya hanya menerima JSON terstruktur dan diminta mempertahankan `sourceUrl`, `retrievedAt`, dan `asOf` dalam outputnya. Gunakan [LLM Task](/id/tools/llm-task) ketika Anda membutuhkan langkah model yang divalidasi skema di dalam alur kerja.

Untuk alur kerja tim atau komunitas yang dapat digunakan ulang, kemas CLI, file `.lobster`, dan catatan penyiapan apa pun sebagai skill atau plugin lalu terbitkan melalui [ClawHub](/clawhub). Simpan guardrail khusus alur kerja di paket tersebut kecuali API plugin tidak memiliki kemampuan generik yang diperlukan.

## Mode sinkronisasi

### Mode terkelola

Task Flow memiliki siklus hidup dari awal sampai akhir. Ia membuat tugas sebagai langkah alur, mendorongnya hingga selesai, dan memajukan status alur secara otomatis.

Contoh: alur laporan mingguan yang (1) mengumpulkan data, (2) menghasilkan laporan, dan (3) mengirimkannya. Task Flow membuat setiap langkah sebagai tugas latar belakang, menunggu penyelesaian, lalu berpindah ke langkah berikutnya.

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### Mode tercermin

Task Flow mengamati tugas yang dibuat secara eksternal dan menjaga status alur tetap sinkron tanpa mengambil alih kepemilikan pembuatan tugas. Ini berguna ketika tugas berasal dari cron job, perintah CLI, atau sumber lain dan Anda menginginkan tampilan terpadu atas progresnya sebagai alur.

Contoh: tiga cron job independen yang bersama-sama membentuk rutinitas "operasi pagi". Alur tercermin melacak progres kolektifnya tanpa mengontrol kapan atau bagaimana tugas tersebut berjalan.

## Status durabel dan pelacakan revisi

Setiap alur mempertahankan statusnya sendiri dan melacak revisi sehingga progres bertahan melewati restart gateway. Pelacakan revisi memungkinkan deteksi konflik ketika beberapa sumber mencoba memajukan alur yang sama secara bersamaan.
Registri alur menggunakan SQLite dengan pemeliharaan write-ahead-log terbatas, termasuk
checkpoint berkala dan saat shutdown, sehingga gateway yang berjalan lama tidak menyimpan
file sidecar `registry.sqlite-wal` tanpa batas.

## Perilaku pembatalan

`openclaw tasks flow cancel` menetapkan maksud pembatalan yang melekat pada alur. Tugas aktif di dalam alur dibatalkan, dan tidak ada langkah baru yang dimulai. Maksud pembatalan tetap ada melewati restart, sehingga alur yang dibatalkan tetap dibatalkan bahkan jika gateway dimulai ulang sebelum semua tugas turunan berakhir.

## Perintah CLI

```bash
# List active and recent flows
openclaw tasks flow list

# Show details for a specific flow
openclaw tasks flow show <lookup>

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| Perintah                          | Deskripsi                                      |
| --------------------------------- | ---------------------------------------------- |
| `openclaw tasks flow list`        | Menampilkan alur terlacak beserta status dan mode sinkronisasi |
| `openclaw tasks flow show <id>`   | Memeriksa satu alur berdasarkan id alur atau kunci pencarian |
| `openclaw tasks flow cancel <id>` | Membatalkan alur yang sedang berjalan dan tugas aktifnya |

## Hubungan alur dengan tugas

Alur mengoordinasikan tugas, bukan menggantikannya. Satu alur dapat menggerakkan beberapa tugas latar belakang sepanjang masa hidupnya. Gunakan `openclaw tasks` untuk memeriksa catatan tugas individual dan `openclaw tasks flow` untuk memeriksa alur yang mengorkestrasi.

## Terkait

- [Tugas Latar Belakang](/id/automation/tasks) — ledger pekerjaan terlepas yang dikoordinasikan oleh alur
- [CLI: tugas](/id/cli/tasks) — referensi perintah CLI untuk `openclaw tasks flow`
- [Ikhtisar Otomasi](/id/automation) — semua mekanisme otomasi secara sekilas
- [Cron Jobs](/id/automation/cron-jobs) — pekerjaan terjadwal yang dapat mengalir ke dalam alur
