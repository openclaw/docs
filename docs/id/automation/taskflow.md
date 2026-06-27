---
read_when:
    - Anda ingin memahami bagaimana Alur Tugas berkaitan dengan tugas latar belakang
    - Anda menjumpai Task Flow atau openclaw tasks flow dalam catatan rilis atau dokumentasi
    - Anda ingin memeriksa atau mengelola status alur yang persisten
summary: Lapisan orkestrasi TaskFlow di atas tugas latar belakang
title: Alur tugas
x-i18n:
    generated_at: "2026-06-27T17:09:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e4f5ff3c9a68eb0408a180bc947a03b410568d7914cb1c1d7f31d6013e036096
    source_path: automation/taskflow.md
    workflow: 16
---

Task Flow adalah substrat orkestrasi alur yang berada di atas [tugas latar belakang](/id/automation/tasks). Ini mengelola alur multi-langkah yang tahan lama dengan status, pelacakan revisi, dan semantik sinkronisasinya sendiri, sementara tugas individual tetap menjadi unit kerja terlepas.

## Kapan menggunakan Task Flow

Gunakan Task Flow saat pekerjaan mencakup beberapa langkah berurutan atau bercabang dan Anda memerlukan pelacakan progres yang tahan lama lintas restart gateway. Untuk operasi latar belakang tunggal, [tugas](/id/automation/tasks) biasa sudah cukup.

| Skenario                              | Gunakan              |
| ------------------------------------- | -------------------- |
| Job latar belakang tunggal            | Tugas biasa          |
| Pipeline multi-langkah (A lalu B lalu C) | Task Flow (terkelola) |
| Mengamati tugas yang dibuat secara eksternal | Task Flow (dicerminkan) |
| Pengingat sekali jalan                | Cron job             |

## Pola alur kerja terjadwal yang andal

Untuk alur kerja berulang seperti briefing intelijen pasar, perlakukan jadwal, orkestrasi, dan pemeriksaan keandalan sebagai lapisan terpisah:

1. Gunakan [Tugas Terjadwal](/id/automation/cron-jobs) untuk pengaturan waktu.
2. Gunakan sesi cron persisten saat alur kerja perlu dibangun di atas konteks sebelumnya.
3. Gunakan [Lobster](/id/tools/lobster) untuk langkah deterministik, gerbang persetujuan, dan token lanjutkan.
4. Gunakan Task Flow untuk melacak eksekusi multi-langkah lintas tugas anak, penantian, percobaan ulang, dan restart gateway.

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

Gunakan `session:<id>` alih-alih `isolated` saat alur kerja berulang memerlukan riwayat yang disengaja, ringkasan eksekusi sebelumnya, atau konteks tetap. Gunakan `isolated` saat setiap eksekusi harus dimulai dari awal dan semua status yang diperlukan eksplisit di dalam alur kerja.

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

- Ketersediaan browser dan pilihan profil, misalnya `openclaw` untuk status terkelola atau `user` saat sesi Chrome yang sudah masuk diperlukan. Lihat [Browser](/id/tools/browser).
- Kredensial API dan kuota untuk setiap sumber.
- Keterjangkauan jaringan untuk endpoint yang diperlukan.
- Alat yang diperlukan diaktifkan untuk agen, seperti `lobster`, `browser`, dan `llm-task`.
- Tujuan kegagalan dikonfigurasi untuk cron agar kegagalan preflight terlihat. Lihat [Tugas Terjadwal](/id/automation/cron-jobs#delivery-and-output).

Kolom provenans data yang direkomendasikan untuk setiap item yang dikumpulkan:

```json
{
  "sourceUrl": "https://example.com/report",
  "retrievedAt": "2026-04-24T12:00:00Z",
  "asOf": "2026-04-24",
  "title": "Example report",
  "content": "..."
}
```

Buat alur kerja menolak atau menandai item usang sebelum peringkasan. Langkah LLM hanya boleh menerima JSON terstruktur dan harus diminta mempertahankan `sourceUrl`, `retrievedAt`, dan `asOf` dalam keluarannya. Gunakan [LLM Task](/id/tools/llm-task) saat Anda memerlukan langkah model yang divalidasi skema di dalam alur kerja.

Untuk alur kerja tim atau komunitas yang dapat digunakan ulang, kemas CLI, file `.lobster`, dan catatan penyiapan apa pun sebagai skill atau plugin dan publikasikan melalui [ClawHub](/id/clawhub). Simpan guardrail khusus alur kerja di dalam paket tersebut kecuali API plugin tidak memiliki kapabilitas generik yang diperlukan.

## Mode sinkronisasi

### Mode terkelola

Task Flow memiliki siklus hidup dari awal hingga akhir. Ini membuat tugas sebagai langkah alur, mendorongnya hingga selesai, dan memajukan status alur secara otomatis.

Contoh: alur laporan mingguan yang (1) mengumpulkan data, (2) menghasilkan laporan, dan (3) mengirimkannya. Task Flow membuat setiap langkah sebagai tugas latar belakang, menunggu penyelesaian, lalu berpindah ke langkah berikutnya.

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### Mode dicerminkan

Task Flow mengamati tugas yang dibuat secara eksternal dan menjaga status alur tetap sinkron tanpa mengambil kepemilikan atas pembuatan tugas. Ini berguna saat tugas berasal dari cron job, perintah CLI, atau sumber lain dan Anda menginginkan tampilan terpadu atas progresnya sebagai alur.

Contoh: tiga cron job independen yang bersama-sama membentuk rutinitas "morning ops". Alur dicerminkan melacak progres kolektifnya tanpa mengontrol kapan atau bagaimana tugas tersebut berjalan.

## Status tahan lama dan pelacakan revisi

Setiap alur mempertahankan statusnya sendiri dan melacak revisi agar progres bertahan melewati restart gateway. Pelacakan revisi memungkinkan deteksi konflik saat beberapa sumber mencoba memajukan alur yang sama secara bersamaan.
Registri alur menggunakan SQLite dengan pemeliharaan write-ahead-log terbatas, termasuk
checkpoint berkala dan saat shutdown, sehingga gateway yang berjalan lama tidak menyimpan
file sidecar `registry.sqlite-wal` tanpa batas.

## Perilaku pembatalan

`openclaw tasks flow cancel` menetapkan intensi batal yang melekat pada alur. Tugas aktif di dalam alur dibatalkan, dan tidak ada langkah baru yang dimulai. Intensi batal bertahan lintas restart, sehingga alur yang dibatalkan tetap batal bahkan jika gateway restart sebelum semua tugas anak dihentikan.

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
| `openclaw tasks flow list`        | Menampilkan alur yang dilacak beserta status dan mode sinkronisasi |
| `openclaw tasks flow show <id>`   | Memeriksa satu alur berdasarkan id alur atau kunci lookup |
| `openclaw tasks flow cancel <id>` | Membatalkan alur yang berjalan dan tugas aktifnya |

## Bagaimana alur berhubungan dengan tugas

Alur mengoordinasikan tugas, bukan menggantikannya. Satu alur dapat menjalankan beberapa tugas latar belakang selama masa hidupnya. Gunakan `openclaw tasks` untuk memeriksa catatan tugas individual dan `openclaw tasks flow` untuk memeriksa alur yang mengorkestrasi.

## Terkait

- [Tugas Latar Belakang](/id/automation/tasks) — ledger kerja terlepas yang dikoordinasikan oleh alur
- [CLI: tugas](/id/cli/tasks) — referensi perintah CLI untuk `openclaw tasks flow`
- [Ikhtisar Otomasi](/id/automation) — semua mekanisme otomasi secara sekilas
- [Cron Job](/id/automation/cron-jobs) — job terjadwal yang dapat memasok data ke alur
