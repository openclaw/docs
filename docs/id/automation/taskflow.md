---
read_when:
    - Anda ingin memahami bagaimana hubungan Task Flow dengan tugas latar belakang
    - Anda menemukan Task Flow atau alur tugas openclaw di catatan rilis atau dokumentasi
    - Anda ingin memeriksa atau mengelola status alur tahan lama
summary: Lapisan orkestrasi alur Task Flow di atas tugas latar belakang
title: Alur tugas
x-i18n:
    generated_at: "2026-04-24T08:57:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 90286fb783db5417ab5e781377a85be76cd3f9e9b32da57558c2d8f02b813dba
    source_path: automation/taskflow.md
    workflow: 15
---

Task Flow adalah lapisan dasar orkestrasi alur yang berada di atas [tugas latar belakang](/id/automation/tasks). Ini mengelola alur tahan lama multi-langkah dengan status, pelacakan revisi, dan semantik sinkronisasinya sendiri, sementara masing-masing tugas tetap menjadi unit kerja yang terlepas.

## Kapan menggunakan Task Flow

Gunakan Task Flow ketika pekerjaan mencakup beberapa langkah berurutan atau bercabang dan Anda memerlukan pelacakan progres yang tahan lama di seluruh restart Gateway. Untuk operasi latar belakang tunggal, [task](/id/automation/tasks) biasa sudah cukup.

| Skenario                              | Gunakan               |
| ------------------------------------- | --------------------- |
| Pekerjaan latar belakang tunggal      | Task biasa            |
| Pipeline multi-langkah (A lalu B lalu C) | Task Flow (dikelola)  |
| Mengamati task yang dibuat secara eksternal | Task Flow (dicerminkan) |
| Pengingat sekali jalan                | Cron job              |

## Mode sinkronisasi

### Mode dikelola

Task Flow memiliki seluruh siklus hidup secara menyeluruh. Ini membuat task sebagai langkah alur, mendorongnya hingga selesai, dan memajukan status alur secara otomatis.

Contoh: alur laporan mingguan yang (1) mengumpulkan data, (2) menghasilkan laporan, dan (3) mengirimkannya. Task Flow membuat setiap langkah sebagai task latar belakang, menunggu hingga selesai, lalu berpindah ke langkah berikutnya.

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### Mode dicerminkan

Task Flow mengamati task yang dibuat secara eksternal dan menjaga agar status alur tetap sinkron tanpa mengambil alih pembuatan task. Ini berguna ketika task berasal dari Cron job, perintah CLI, atau sumber lain dan Anda menginginkan tampilan terpadu atas progresnya sebagai sebuah alur.

Contoh: tiga Cron job independen yang bersama-sama membentuk rutinitas "operasi pagi". Alur yang dicerminkan melacak progres gabungannya tanpa mengendalikan kapan atau bagaimana task tersebut berjalan.

## Status tahan lama dan pelacakan revisi

Setiap alur mempertahankan statusnya sendiri dan melacak revisi sehingga progres tetap bertahan saat Gateway di-restart. Pelacakan revisi memungkinkan deteksi konflik ketika beberapa sumber mencoba memajukan alur yang sama secara bersamaan.

## Perilaku pembatalan

`openclaw tasks flow cancel` menetapkan intent pembatalan yang persisten pada alur. Task aktif di dalam alur dibatalkan, dan tidak ada langkah baru yang dimulai. Intent pembatalan tetap bertahan setelah restart, sehingga alur yang dibatalkan tetap dibatalkan bahkan jika Gateway di-restart sebelum semua task turunannya berhenti.

## Perintah CLI

```bash
# List active and recent flows
openclaw tasks flow list

# Show details for a specific flow
openclaw tasks flow show <lookup>

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| Perintah                           | Deskripsi                                      |
| ---------------------------------- | ---------------------------------------------- |
| `openclaw tasks flow list`         | Menampilkan alur yang dilacak dengan status dan mode sinkronisasi |
| `openclaw tasks flow show <id>`    | Periksa satu alur berdasarkan id alur atau kunci lookup |
| `openclaw tasks flow cancel <id>`  | Membatalkan alur yang berjalan dan task aktifnya |

## Bagaimana alur berhubungan dengan task

Alur mengoordinasikan task, bukan menggantikannya. Satu alur dapat mendorong beberapa task latar belakang selama masa hidupnya. Gunakan `openclaw tasks` untuk memeriksa catatan tiap task dan `openclaw tasks flow` untuk memeriksa alur orkestrasinya.

## Terkait

- [Tugas Latar Belakang](/id/automation/tasks) — ledger pekerjaan terlepas yang dikoordinasikan oleh alur
- [CLI: tasks](/id/cli/tasks) — referensi perintah CLI untuk `openclaw tasks flow`
- [Ikhtisar Otomatisasi](/id/automation) — semua mekanisme otomatisasi secara sekilas
- [Cron Jobs](/id/automation/cron-jobs) — pekerjaan terjadwal yang dapat menjadi masukan ke alur
