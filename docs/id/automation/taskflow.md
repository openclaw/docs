---
read_when:
    - Anda ingin memahami bagaimana Task Flow berhubungan dengan background tasks
    - Anda menemukan Task Flow atau openclaw tasks flow di catatan rilis atau dokumentasi
    - Anda ingin memeriksa atau mengelola status flow yang tahan lama
summary: Lapisan orkestrasi flow Task Flow di atas background tasks
title: Task Flow
x-i18n:
    generated_at: "2026-04-05T13:42:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 172871206b839845db807d9c627015890f7733b862e276853d5dbfbe29e03883
    source_path: automation/taskflow.md
    workflow: 15
---

# Task Flow

Task Flow adalah substrat orkestrasi flow yang berada di atas [background tasks](/automation/tasks). Fitur ini mengelola flow multi-langkah yang tahan lama dengan status, pelacakan revisi, dan semantik sinkronisasinya sendiri, sementara task individual tetap menjadi unit kerja terlepas.

## Kapan menggunakan Task Flow

Gunakan Task Flow saat pekerjaan mencakup beberapa langkah berurutan atau bercabang dan Anda memerlukan pelacakan progres yang tahan lama di seluruh restart gateway. Untuk operasi latar belakang tunggal, [task](/automation/tasks) biasa sudah memadai.

| Skenario                             | Penggunaan            |
| ------------------------------------ | --------------------- |
| Job latar belakang tunggal           | Task biasa            |
| Pipeline multi-langkah (A lalu B lalu C) | Task Flow (dikelola)  |
| Mengamati task yang dibuat secara eksternal | Task Flow (dicerminkan) |
| Pengingat sekali jalan               | Cron job              |

## Mode sinkronisasi

### Mode dikelola

Task Flow memiliki siklus hidup end-to-end. Fitur ini membuat task sebagai langkah flow, menjalankannya hingga selesai, dan memajukan status flow secara otomatis.

Contoh: flow laporan mingguan yang (1) mengumpulkan data, (2) membuat laporan, dan (3) mengirimkannya. Task Flow membuat setiap langkah sebagai background task, menunggu hingga selesai, lalu berpindah ke langkah berikutnya.

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### Mode dicerminkan

Task Flow mengamati task yang dibuat secara eksternal dan menjaga agar status flow tetap sinkron tanpa mengambil alih kepemilikan pembuatan task. Ini berguna ketika task berasal dari cron job, perintah CLI, atau sumber lain dan Anda menginginkan tampilan progresnya yang terpadu sebagai sebuah flow.

Contoh: tiga cron job independen yang bersama-sama membentuk rutinitas "operasi pagi". Flow yang dicerminkan melacak progres kolektifnya tanpa mengendalikan kapan atau bagaimana pekerjaan tersebut berjalan.

## Status tahan lama dan pelacakan revisi

Setiap flow menyimpan statusnya sendiri dan melacak revisi sehingga progres tetap bertahan setelah gateway direstart. Pelacakan revisi memungkinkan deteksi konflik saat beberapa sumber mencoba memajukan flow yang sama secara bersamaan.

## Perilaku pembatalan

`openclaw tasks flow cancel` menetapkan intent pembatalan lekat pada flow. Task aktif di dalam flow dibatalkan, dan tidak ada langkah baru yang dimulai. Intent pembatalan tetap bertahan setelah restart, sehingga flow yang dibatalkan tetap dibatalkan meskipun gateway direstart sebelum semua task turunan dihentikan.

## Perintah CLI

```bash
# List active and recent flows
openclaw tasks flow list

# Show details for a specific flow
openclaw tasks flow show <lookup>

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| Perintah                         | Deskripsi                                         |
| -------------------------------- | ------------------------------------------------- |
| `openclaw tasks flow list`        | Menampilkan flow yang dilacak beserta status dan mode sinkronisasi |
| `openclaw tasks flow show <id>`   | Periksa satu flow berdasarkan id flow atau kunci lookup |
| `openclaw tasks flow cancel <id>` | Batalkan flow yang sedang berjalan dan task aktifnya |

## Bagaimana flow berhubungan dengan task

Flow mengoordinasikan task, bukan menggantikannya. Satu flow dapat menjalankan beberapa background task selama masa berlakunya. Gunakan `openclaw tasks` untuk memeriksa catatan task individual dan `openclaw tasks flow` untuk memeriksa flow yang mengatur orkestrasi.

## Terkait

- [Background Tasks](/automation/tasks) — ledger pekerjaan terlepas yang dikoordinasikan oleh flow
- [CLI: tasks](/cli/index#tasks) — referensi perintah CLI untuk `openclaw tasks flow`
- [Ikhtisar Otomasi](/automation) — semua mekanisme otomasi secara sekilas
- [Cron Jobs](/automation/cron-jobs) — job terjadwal yang dapat menjadi masukan ke flow
