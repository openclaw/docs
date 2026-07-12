---
read_when:
    - Anda ingin memahami hubungan Task Flow dengan tugas latar belakang
    - Anda menemukan Task Flow atau alur tugas OpenClaw dalam catatan rilis atau dokumentasi
    - Anda ingin memeriksa atau mengelola status alur yang persisten
summary: Lapisan orkestrasi Task Flow di atas tugas latar belakang
title: Alur tugas
x-i18n:
    generated_at: "2026-07-12T13:58:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5ccc6acf58b4b44c2989e3061bff08dabce8ef385706102360c756a1286ddd1b
    source_path: automation/taskflow.md
    workflow: 16
---

Alur Tugas adalah lapisan orkestrasi di atas [tugas latar belakang](/id/automation/tasks). Alur merupakan catatan persisten untuk pekerjaan bertahap dengan status, state JSON, penghitung revisi, dan catatan tugas tertautnya sendiri. Alur tetap bertahan setelah Gateway dimulai ulang; setiap tugas tetap menjadi unit pekerjaan terpisah.

## Kapan menggunakan Alur Tugas

| Skenario                                    | Gunakan                                      |
| ------------------------------------------- | -------------------------------------------- |
| Satu pekerjaan latar belakang               | Tugas biasa                                  |
| Pipeline bertahap yang digerakkan kode Plugin | Alur Tugas (terkelola)                     |
| Peluncuran ACP atau subagen secara terpisah | Alur Tugas (dicerminkan, dibuat otomatis)    |
| Pengingat sekali jalan                      | Pekerjaan Cron                               |

## Mode sinkronisasi

### Mode terkelola

Alur terkelola memiliki pengontrol: kode Plugin yang membuat alur melalui API Alur Tugas runtime Plugin dengan tujuan dan ID pengontrol wajib, lalu menggerakkannya secara eksplisit.

- Setiap langkah berjalan sebagai tugas latar belakang yang dibuat di bawah alur; kunci pemilik dan asal peminta alur diteruskan ke tugas anak.
- Pengontrol memajukan alur di antara status `running`, `waiting`, dan status terminal, serta menyimpan state langkah JSON arbitrer pada catatan alur.
- Setiap mutasi menyertakan revisi yang diharapkan dari alur. Penulisan dengan revisi usang ditolak sebagai konflik revisi alih-alih menimpa state yang lebih baru.
- Setelah pembatalan diminta, tugas anak baru ditolak, dan alur diselesaikan sebagai `cancelled` ketika tidak ada tugas anak yang masih aktif.

Contoh: alur laporan mingguan yang (1) mengumpulkan data, (2) membuat laporan, dan (3) mengirimkannya, dengan satu tugas latar belakang per langkah:

```
Alur: laporan-mingguan
  Langkah 1: kumpulkan-data → tugas dibuat → berhasil
  Langkah 2: buat-laporan   → tugas dibuat → berhasil
  Langkah 3: kirim          → tugas dibuat → berjalan
```

### Mode pencerminan

OpenClaw secara otomatis membuat alur satu tugas yang dicerminkan ketika proses ACP atau subagen terpisah dimulai (tugas dalam cakupan sesi dengan penyelesaian yang dapat dikirimkan). Catatan alur mencerminkan satu tugas pendukungnya—status, tujuan, dan waktu—sehingga peluncuran terpisah memperoleh pegangan alur yang stabil untuk antarmuka status dan percobaan ulang tanpa pengontrol. Alur yang dicerminkan menampilkan mode sinkronisasi `task_mirrored` di CLI.

## Status alur

| Status      | Arti                                                                                  |
| ----------- | ------------------------------------------------------------------------------------- |
| `queued`    | Dibuat, belum mulai diproses                                                          |
| `running`   | Alur sedang diproses secara aktif                                                     |
| `waiting`   | Alur terkelola dijeda berdasarkan metadata tunggu (pewaktu, peristiwa eksternal)      |
| `blocked`   | Sebuah langkah selesai tanpa hasil yang dapat digunakan; `blockedTaskId`/ringkasan menunjukkan tugasnya |
| `succeeded` | Selesai dengan sukses                                                                 |
| `failed`    | Selesai dengan kesalahan                                                              |
| `cancelled` | Pembatalan diminta dan semua tugas anak telah mencapai status akhir                   |
| `lost`      | Alur kehilangan state pendukung otoritatifnya                                         |

## State persisten dan pelacakan revisi

Catatan alur disimpan dalam basis data state SQLite bersama (`~/.openclaw/state/openclaw.sqlite`, tabel `flow_runs`) bersama catatan tugas, sehingga kemajuan tetap bertahan setelah Gateway dimulai ulang. Setiap penulisan menaikkan `revision` alur; penulis bersamaan yang menyertakan revisi usang akan menerima konflik dan harus membaca ulang. Pertumbuhan WAL dibatasi oleh pemeriksaan titik otomatis SQLite ditambah pemeriksaan titik pasif berkala, dengan pemeriksaan titik pemangkasan saat penghentian. Sidecar lama `flows/registry.sqlite` dari instalasi terdahulu diimpor oleh `openclaw doctor`.

## Perilaku pembatalan

`openclaw tasks flow cancel` menetapkan niat pembatalan yang persisten pada alur, membatalkan tugas anak yang aktif, dan menolak tugas anak terkelola yang baru. Setelah tidak ada tugas anak yang masih aktif, alur diselesaikan sebagai `cancelled`—segera, atau melalui penyisiran pemeliharaan jika tugas anak memerlukan waktu lebih lama untuk mencapai status akhir. Niat tersebut disimpan, sehingga alur yang dibatalkan tetap dibatalkan meskipun Gateway dimulai ulang sebelum semua tugas anak dihentikan.

## Perintah CLI

```bash
# List active and recent flows
openclaw tasks flow list [--status <status>] [--json]

# Show details for a specific flow
openclaw tasks flow show <lookup> [--json]

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| Perintah                          | Deskripsi                                                                        |
| --------------------------------- | -------------------------------------------------------------------------------- |
| `openclaw tasks flow list`        | Alur yang dilacak beserta mode sinkronisasi, status, revisi, pengontrol, dan jumlah tugas |
| `openclaw tasks flow show <id>`   | Memeriksa satu alur berdasarkan ID alur atau kunci pemilik, termasuk tugas tertaut |
| `openclaw tasks flow cancel <id>` | Membatalkan alur yang berjalan beserta tugas aktifnya                             |

Alur juga dicakup oleh `openclaw tasks audit` (temuan alur usang atau rusak) dan `openclaw tasks maintenance` (menyelesaikan pembatalan yang macet serta memangkas alur terminal setelah 7 hari).

## Pola alur kerja terjadwal yang andal

Untuk alur kerja berulang seperti laporan intelijen pasar, perlakukan jadwal, orkestrasi, dan pemeriksaan keandalan sebagai lapisan terpisah:

1. Gunakan [Tugas Terjadwal](/id/automation/cron-jobs) untuk pengaturan waktu.
2. Gunakan sesi Cron persisten ketika alur kerja harus melanjutkan konteks sebelumnya.
3. Gunakan [Lobster](/id/tools/lobster) untuk langkah deterministik, gerbang persetujuan, dan token pelanjutan.
4. Gunakan Alur Tugas untuk melacak proses bertahap di seluruh tugas anak, penantian, percobaan ulang, dan mulai ulang Gateway.

Contoh struktur Cron:

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

Gunakan `--session session:<id>` alih-alih `isolated` ketika alur kerja berulang memerlukan riwayat yang disengaja, ringkasan proses sebelumnya, atau konteks tetap. Gunakan `isolated` ketika setiap proses harus dimulai dari awal dan semua state yang diperlukan dinyatakan secara eksplisit dalam alur kerja.

Di dalam alur kerja, tempatkan pemeriksaan keandalan sebelum langkah ringkasan LLM:

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

Pemeriksaan praproses yang disarankan:

- Ketersediaan peramban dan pilihan profil, misalnya `openclaw` untuk state terkelola atau `user` ketika sesi Chrome yang sudah masuk diperlukan. Lihat [Peramban](/id/tools/browser).
- Kredensial API dan kuota untuk setiap sumber.
- Keterjangkauan jaringan untuk endpoint yang diperlukan.
- Alat yang diperlukan telah diaktifkan untuk agen, seperti `lobster`, `browser`, dan `llm-task`.
- Tujuan kegagalan telah dikonfigurasi untuk Cron agar kegagalan praproses terlihat. Lihat [Tugas Terjadwal](/id/automation/cron-jobs#delivery-and-output).

Kolom asal-usul data yang disarankan untuk setiap item yang dikumpulkan:

```json
{
  "sourceUrl": "https://example.com/report",
  "retrievedAt": "2026-04-24T12:00:00Z",
  "asOf": "2026-04-24",
  "title": "Example report",
  "content": "..."
}
```

Atur alur kerja agar menolak atau menandai item usang sebelum peringkasan. Langkah LLM hanya boleh menerima JSON terstruktur dan harus diminta mempertahankan `sourceUrl`, `retrievedAt`, dan `asOf` dalam keluarannya. Gunakan [Tugas LLM](/id/tools/llm-task) ketika Anda memerlukan langkah model yang divalidasi berdasarkan skema di dalam alur kerja.

Untuk alur kerja tim atau komunitas yang dapat digunakan kembali, kemas CLI, berkas `.lobster`, dan catatan penyiapan apa pun sebagai skill atau Plugin, lalu publikasikan melalui [ClawHub](/clawhub). Simpan pembatas khusus alur kerja dalam paket tersebut, kecuali API Plugin belum menyediakan kemampuan generik yang diperlukan.

## Hubungan alur dengan tugas

Alur mengoordinasikan tugas, bukan menggantikannya. Satu alur dapat menggerakkan beberapa tugas latar belakang selama masa aktifnya. Gunakan `openclaw tasks` untuk memeriksa setiap catatan tugas dan `openclaw tasks flow` untuk memeriksa alur yang mengorkestrasikannya.

## Terkait

- [Tugas Latar Belakang](/id/automation/tasks) - buku besar pekerjaan terpisah yang dikoordinasikan oleh alur
- [CLI: tugas](/id/cli/tasks) - referensi perintah CLI untuk `openclaw tasks flow`
- [Ikhtisar Otomatisasi](/id/automation) - sekilas tentang semua mekanisme otomatisasi
- [Pekerjaan Cron](/id/automation/cron-jobs) - pekerjaan terjadwal yang dapat memasok tugas ke dalam alur
