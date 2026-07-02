---
read_when:
    - Anda ingin memahami bagaimana Task Flow berkaitan dengan tugas latar belakang
    - Anda menemukan Task Flow atau openclaw tasks flow dalam catatan rilis atau dokumentasi
    - Anda ingin memeriksa atau mengelola keadaan alur persisten
summary: Lapisan orkestrasi TaskFlow di atas tugas latar belakang
title: Alur tugas
x-i18n:
    generated_at: "2026-07-02T01:15:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b74a773e34c02421d22ce11ae0aa29fed82664383f0680e7623787db7d79c8e
    source_path: automation/taskflow.md
    workflow: 16
---

Task Flow adalah substrat orkestrasi alur yang berada di atas [tugas latar belakang](/id/automation/tasks). Ini mengelola alur multi-langkah yang tahan lama dengan state, pelacakan revisi, dan semantik sinkronisasinya sendiri, sementara tugas individual tetap menjadi unit pekerjaan terlepas.

## Kapan menggunakan Task Flow

Gunakan Task Flow ketika pekerjaan mencakup beberapa langkah berurutan atau bercabang dan Anda memerlukan pelacakan progres yang tahan lama di seluruh restart Gateway. Untuk operasi latar belakang tunggal, [tugas](/id/automation/tasks) biasa sudah cukup.

| Skenario                              | Gunakan              |
| ------------------------------------- | -------------------- |
| Pekerjaan latar belakang tunggal      | Tugas biasa          |
| Pipeline multi-langkah (A lalu B lalu C) | Task Flow (terkelola) |
| Mengamati tugas yang dibuat secara eksternal | Task Flow (dicerminkan) |
| Pengingat sekali jalan                | Pekerjaan Cron       |

## Pola workflow terjadwal yang andal

Untuk workflow berulang seperti briefing intelijen pasar, perlakukan jadwal, orkestrasi, dan pemeriksaan keandalan sebagai lapisan terpisah:

1. Gunakan [Tugas Terjadwal](/id/automation/cron-jobs) untuk pengaturan waktu.
2. Simpan konteks sebelumnya dalam file, database, atau state alat milik workflow sendiri.
3. Gunakan [Lobster](/id/tools/lobster) untuk langkah deterministik, gerbang persetujuan, dan token resume.
4. Gunakan Task Flow untuk melacak eksekusi multi-langkah di seluruh tugas anak, penantian, percobaan ulang, dan restart Gateway.

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

Gunakan `session:<id>` ketika pekerjaan harus menargetkan chat/session yang diketahui untuk konteks pengiriman atau penyemaian preferensi yang aman. Cron tetap menjalankan setiap eksekusi dalam session terlepas, jadi letakkan ringkasan eksekusi sebelumnya dan state workflow tetap dalam penyimpanan eksplisit yang dapat dibaca pekerjaan.

Di dalam workflow, tempatkan pemeriksaan keandalan sebelum langkah ringkasan LLM:

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

- Ketersediaan browser dan pilihan profil, misalnya `openclaw` untuk state terkelola atau `user` ketika session Chrome yang sudah masuk diperlukan. Lihat [Browser](/id/tools/browser).
- Kredensial API dan kuota untuk setiap sumber.
- Keterjangkauan jaringan untuk endpoint yang diperlukan.
- Alat yang diperlukan diaktifkan untuk agen, seperti `lobster`, `browser`, dan `llm-task`.
- Tujuan kegagalan dikonfigurasi untuk cron agar kegagalan preflight terlihat. Lihat [Tugas Terjadwal](/id/automation/cron-jobs#delivery-and-output).

Field asal-usul data yang direkomendasikan untuk setiap item yang dikumpulkan:

```json
{
  "sourceUrl": "https://example.com/report",
  "retrievedAt": "2026-04-24T12:00:00Z",
  "asOf": "2026-04-24",
  "title": "Example report",
  "content": "..."
}
```

Buat workflow menolak atau menandai item basi sebelum peringkasan. Langkah LLM sebaiknya hanya menerima JSON terstruktur dan diminta mempertahankan `sourceUrl`, `retrievedAt`, dan `asOf` dalam outputnya. Gunakan [LLM Task](/id/tools/llm-task) ketika Anda memerlukan langkah model yang divalidasi skema di dalam workflow.

Untuk workflow tim atau komunitas yang dapat digunakan kembali, kemas CLI, file `.lobster`, dan catatan penyiapan apa pun sebagai skill atau plugin dan publikasikan melalui [ClawHub](/clawhub). Simpan guardrail khusus workflow dalam paket tersebut kecuali API plugin tidak memiliki kemampuan generik yang diperlukan.

## Mode sinkronisasi

### Mode terkelola

Task Flow memiliki siklus hidup dari awal hingga akhir. Ini membuat tugas sebagai langkah alur, mendorongnya hingga selesai, dan memajukan state alur secara otomatis.

Contoh: alur laporan mingguan yang (1) mengumpulkan data, (2) menghasilkan laporan, dan (3) mengirimkannya. Task Flow membuat setiap langkah sebagai tugas latar belakang, menunggu penyelesaian, lalu berpindah ke langkah berikutnya.

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### Mode dicerminkan

Task Flow mengamati tugas yang dibuat secara eksternal dan menjaga state alur tetap sinkron tanpa mengambil kepemilikan atas pembuatan tugas. Ini berguna ketika tugas berasal dari pekerjaan cron, perintah CLI, atau sumber lain dan Anda menginginkan tampilan terpadu atas progresnya sebagai alur.

Contoh: tiga pekerjaan cron independen yang bersama-sama membentuk rutinitas "morning ops". Alur yang dicerminkan melacak progres kolektifnya tanpa mengontrol kapan atau bagaimana tugas-tugas itu berjalan.

## State tahan lama dan pelacakan revisi

Setiap alur mempertahankan state-nya sendiri dan melacak revisi agar progres bertahan melewati restart Gateway. Pelacakan revisi memungkinkan deteksi konflik ketika beberapa sumber mencoba memajukan alur yang sama secara bersamaan.
Registry alur menggunakan SQLite dengan pemeliharaan write-ahead-log terbatas, termasuk
checkpoint berkala dan saat shutdown, sehingga Gateway yang berjalan lama tidak mempertahankan
file sidecar `registry.sqlite-wal` tanpa batas.

## Perilaku pembatalan

`openclaw tasks flow cancel` menetapkan intent pembatalan yang melekat pada alur. Tugas aktif di dalam alur dibatalkan, dan tidak ada langkah baru yang dimulai. Intent pembatalan tetap ada di seluruh restart, sehingga alur yang dibatalkan tetap dibatalkan meskipun Gateway restart sebelum semua tugas anak telah berakhir.

## Perintah CLI

```bash
# List active and recent flows
openclaw tasks flow list

# Show details for a specific flow
openclaw tasks flow show <lookup>

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| Perintah                          | Deskripsi                                     |
| --------------------------------- | --------------------------------------------- |
| `openclaw tasks flow list`        | Menampilkan alur yang dilacak dengan status dan mode sinkronisasi |
| `openclaw tasks flow show <id>`   | Memeriksa satu alur berdasarkan id alur atau kunci lookup |
| `openclaw tasks flow cancel <id>` | Membatalkan alur yang berjalan dan tugas aktifnya |

## Bagaimana alur terkait dengan tugas

Alur mengoordinasikan tugas, bukan menggantikannya. Satu alur dapat menjalankan beberapa tugas latar belakang selama masa hidupnya. Gunakan `openclaw tasks` untuk memeriksa record tugas individual dan `openclaw tasks flow` untuk memeriksa alur yang mengorkestrasi.

## Terkait

- [Tugas Latar Belakang](/id/automation/tasks) — ledger pekerjaan terlepas yang dikoordinasikan alur
- [CLI: tugas](/id/cli/tasks) — referensi perintah CLI untuk `openclaw tasks flow`
- [Ikhtisar Otomasi](/id/automation) — semua mekanisme otomasi secara sekilas
- [Pekerjaan Cron](/id/automation/cron-jobs) — pekerjaan terjadwal yang dapat masuk ke alur
