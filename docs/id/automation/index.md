---
read_when:
    - Menentukan cara mengotomatiskan pekerjaan dengan OpenClaw
    - Memilih antara Heartbeat, Cron, komitmen, kait, dan instruksi tetap
    - Mencari titik masuk otomatisasi yang tepat
summary: 'Gambaran umum mekanisme otomatisasi: tugas, Cron, pengait, instruksi tetap, dan Task Flow'
title: Automasi dan tugas
x-i18n:
    generated_at: "2026-05-06T09:02:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: ee7f34fa4840c0e43e50d09e415b2529ef0c8bc3ccb6e3546b8a873c9458832d
    source_path: automation/index.md
    workflow: 16
---

OpenClaw menjalankan pekerjaan di latar belakang melalui tugas, pekerjaan terjadwal, komitmen yang disimpulkan, hook peristiwa, dan instruksi tetap. Halaman ini membantu Anda memilih mekanisme yang tepat dan memahami bagaimana semuanya saling terhubung.

## Panduan keputusan cepat

```mermaid
flowchart TD
    START([What do you need?]) --> Q1{Schedule work?}
    START --> Q2{Track detached work?}
    START --> Q3{Orchestrate multi-step flows?}
    START --> Q4{React to lifecycle events?}
    START --> Q5{Give the agent persistent instructions?}
    START --> Q6{Remember a natural follow-up?}

    Q1 -->|Yes| Q1a{Exact timing or flexible?}
    Q1a -->|Exact| CRON["Scheduled Tasks (Cron)"]
    Q1a -->|Flexible| HEARTBEAT[Heartbeat]

    Q2 -->|Yes| TASKS[Background Tasks]
    Q3 -->|Yes| FLOW[Task Flow]
    Q4 -->|Yes| HOOKS[Hooks]
    Q5 -->|Yes| SO[Standing Orders]
    Q6 -->|Yes| COMMITMENTS[Inferred Commitments]
```

| Kasus penggunaan                                    | Rekomendasi              | Alasan                                                    |
| --------------------------------------------------- | ------------------------ | --------------------------------------------------------- |
| Kirim laporan harian tepat pukul 9 pagi             | Tugas Terjadwal (Cron)   | Waktu yang presisi, eksekusi terisolasi                   |
| Ingatkan saya dalam 20 menit                        | Tugas Terjadwal (Cron)   | Sekali jalan dengan waktu presisi (`--at`)                |
| Jalankan analisis mendalam mingguan                 | Tugas Terjadwal (Cron)   | Tugas mandiri, dapat menggunakan model berbeda            |
| Periksa kotak masuk setiap 30 menit                 | Heartbeat                | Dibundel dengan pemeriksaan lain, sadar konteks           |
| Pantau kalender untuk acara mendatang               | Heartbeat                | Cocok secara alami untuk kesadaran berkala                |
| Tindak lanjuti setelah wawancara yang disebutkan    | Komitmen yang Disimpulkan | Tindak lanjut seperti memori, tanpa permintaan pengingat pasti |
| Pemeriksaan kepedulian ringan setelah konteks pengguna | Komitmen yang Disimpulkan | Dicakup ke agen dan saluran yang sama                     |
| Periksa status subagen atau eksekusi ACP            | Tugas Latar Belakang     | Buku besar tugas melacak semua pekerjaan terlepas         |
| Audit apa yang berjalan dan kapan                   | Tugas Latar Belakang     | `openclaw tasks list` dan `openclaw tasks audit`          |
| Riset multi-langkah lalu rangkum                    | Task Flow                | Orkestrasi tahan lama dengan pelacakan revisi             |
| Jalankan skrip saat sesi direset                    | Hook                     | Berbasis peristiwa, dipicu pada peristiwa siklus hidup    |
| Eksekusi kode pada setiap pemanggilan alat          | Hook Plugin              | Hook dalam proses dapat mencegat pemanggilan alat         |
| Selalu periksa kepatuhan sebelum membalas           | Perintah Tetap           | Disuntikkan ke setiap sesi secara otomatis                |

### Tugas Terjadwal (Cron) vs Heartbeat

| Dimensi        | Tugas Terjadwal (Cron)              | Heartbeat                              |
| -------------- | ----------------------------------- | -------------------------------------- |
| Waktu          | Presisi (ekspresi cron, sekali jalan) | Perkiraan (bawaan setiap 30 menit)     |
| Konteks sesi   | Baru (terisolasi) atau bersama      | Konteks sesi utama penuh               |
| Catatan tugas  | Selalu dibuat                       | Tidak pernah dibuat                    |
| Pengiriman     | Saluran, webhook, atau senyap       | Sejajar dalam sesi utama               |
| Paling cocok untuk | Laporan, pengingat, pekerjaan latar belakang | Pemeriksaan kotak masuk, kalender, notifikasi |

Gunakan Tugas Terjadwal (Cron) saat Anda membutuhkan waktu yang presisi atau eksekusi terisolasi. Gunakan Heartbeat saat pekerjaan mendapat manfaat dari konteks sesi penuh dan waktu perkiraan sudah memadai.

## Konsep inti

### Tugas terjadwal (cron)

Cron adalah penjadwal bawaan Gateway untuk waktu yang presisi. Cron menyimpan pekerjaan, membangunkan agen pada waktu yang tepat, dan dapat mengirimkan keluaran ke saluran chat atau endpoint Webhook. Mendukung pengingat sekali jalan, ekspresi berulang, dan pemicu Webhook masuk.

Lihat [Tugas Terjadwal](/id/automation/cron-jobs).

### Tugas

Buku besar tugas latar belakang melacak semua pekerjaan terlepas: eksekusi ACP, pemunculan subagen, eksekusi cron terisolasi, dan operasi CLI. Tugas adalah catatan, bukan penjadwal. Gunakan `openclaw tasks list` dan `openclaw tasks audit` untuk memeriksanya.

Lihat [Tugas Latar Belakang](/id/automation/tasks).

### Komitmen yang disimpulkan

Komitmen adalah memori tindak lanjut yang ikut serta dan berumur pendek. OpenClaw menyimpulkannya dari percakapan normal, mencakupnya ke agen dan saluran yang sama, dan mengirimkan check-in yang jatuh tempo melalui Heartbeat. Pengingat presisi yang diminta pengguna tetap berada di cron.

Lihat [Komitmen yang Disimpulkan](/id/concepts/commitments).

### Task Flow

Task Flow adalah substrat orkestrasi alur di atas tugas latar belakang. Task Flow mengelola alur multi-langkah yang tahan lama dengan mode sinkronisasi terkelola dan tercermin, pelacakan revisi, serta `openclaw tasks flow list|show|cancel` untuk inspeksi.

Lihat [Task Flow](/id/automation/taskflow).

### Perintah tetap

Perintah tetap memberi agen wewenang operasi permanen untuk program yang ditentukan. Perintah ini berada dalam file workspace (biasanya `AGENTS.md`) dan disuntikkan ke setiap sesi. Gabungkan dengan cron untuk penegakan berbasis waktu.

Lihat [Perintah Tetap](/id/automation/standing-orders).

### Hook

Hook internal adalah skrip berbasis peristiwa yang dipicu oleh peristiwa siklus hidup agen (`/new`, `/reset`, `/stop`), Compaction sesi, startup Gateway, dan alur pesan. Hook ditemukan secara otomatis dari direktori dan dapat dikelola dengan `openclaw hooks`. Untuk pencegatan pemanggilan alat dalam proses, gunakan [Hook Plugin](/id/plugins/hooks).

Lihat [Hook](/id/automation/hooks).

### Heartbeat

Heartbeat adalah giliran sesi utama berkala (bawaan setiap 30 menit). Heartbeat membundel beberapa pemeriksaan (kotak masuk, kalender, notifikasi) dalam satu giliran agen dengan konteks sesi penuh. Giliran Heartbeat tidak membuat catatan tugas dan tidak memperpanjang kesegaran reset sesi harian/menganggur. Gunakan `HEARTBEAT.md` untuk daftar periksa kecil, atau blok `tasks:` saat Anda menginginkan pemeriksaan berkala hanya yang jatuh tempo di dalam Heartbeat itu sendiri. File Heartbeat kosong dilewati sebagai `empty-heartbeat-file`; mode tugas hanya-jatuh-tempo dilewati sebagai `no-tasks-due`. Heartbeat ditunda saat pekerjaan cron aktif atau mengantre, dan `heartbeat.skipWhenBusy` juga dapat menundanya saat jalur subagen atau bertingkat sedang sibuk.

Lihat [Heartbeat](/id/gateway/heartbeat).

## Cara semuanya bekerja bersama

- **Cron** menangani jadwal presisi (laporan harian, tinjauan mingguan) dan pengingat sekali jalan. Semua eksekusi cron membuat catatan tugas.
- **Heartbeat** menangani pemantauan rutin (kotak masuk, kalender, notifikasi) dalam satu giliran yang dibundel setiap 30 menit.
- **Hook** bereaksi terhadap peristiwa tertentu (reset sesi, Compaction, alur pesan) dengan skrip khusus. Hook Plugin mencakup pemanggilan alat.
- **Perintah tetap** memberi agen konteks persisten dan batas wewenang.
- **Task Flow** mengoordinasikan alur multi-langkah di atas tugas individual.
- **Tugas** secara otomatis melacak semua pekerjaan terlepas sehingga Anda dapat memeriksa dan mengauditnya.

## Terkait

- [Tugas Terjadwal](/id/automation/cron-jobs) — penjadwalan presisi dan pengingat sekali jalan
- [Komitmen yang Disimpulkan](/id/concepts/commitments) — check-in tindak lanjut seperti memori
- [Tugas Latar Belakang](/id/automation/tasks) — buku besar tugas untuk semua pekerjaan terlepas
- [Task Flow](/id/automation/taskflow) — orkestrasi alur multi-langkah yang tahan lama
- [Hook](/id/automation/hooks) — skrip siklus hidup berbasis peristiwa
- [Hook Plugin](/id/plugins/hooks) — hook alat, prompt, pesan, dan siklus hidup dalam proses
- [Perintah Tetap](/id/automation/standing-orders) — instruksi agen persisten
- [Heartbeat](/id/gateway/heartbeat) — giliran sesi utama berkala
- [Referensi Konfigurasi](/id/gateway/configuration-reference) — semua kunci konfigurasi
