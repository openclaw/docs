---
read_when:
    - Mendiagnosis kesalahan skema basis data yang lebih baru
    - Memeriksa kompatibilitas basis data sebelum pembaruan atau penurunan versi
    - Memulihkan basis data untuk rilis OpenClaw yang lebih lama
summary: Lokasi database SQLite OpenClaw, versi skema, pemeriksaan integritas, dan pemulihan downgrade
title: Skema basis data
x-i18n:
    generated_at: "2026-07-19T05:18:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 73993e2c593ba460784108aedef70bbfb499e525c709d6d6bdd956ccf93e0ddc
    source_path: reference/database-schemas.md
    workflow: 16
---

OpenClaw menyimpan status bidang kontrol dalam basis data SQLite global dan data agen dalam satu basis data SQLite per agen. Migrasi skema dijalankan maju saat basis data dibuka. Build OpenClaw lama menolak basis data yang ditulis oleh skema yang lebih baru.

## Tata letak basis data

| Cakupan              | Jalur default                                               | Isi                                                                                                   |
| -------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Bidang kontrol global | `~/.openclaw/state/openclaw.sqlite`                        | Status konfigurasi bersama, registri, persetujuan, status plugin, dan status runtime bersama           |
| Bidang data per agen | `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite` | Sesi, transkrip, indeks memori, status autentikasi, status percakapan, dan status runtime dalam cakupan agen |

Beberapa fitur bervolume tinggi atau khusus siklus hidup menggunakan penyimpanan SQLite khusus, termasuk registri tugas dan data lintasan.

## Kontrak pembuatan versi

Setiap basis data mencatat skemanya di dua tempat:

- `PRAGMA user_version` adalah versi skema SQLite.
- Baris `schema_meta` utama mencatat `role`, `agent_id`, `schema_version`, dan `app_version`. `app_version` adalah build OpenClaw yang terakhir menulis metadata skema.

OpenClaw menerapkan migrasi hanya-maju saat membuka basis data lama yang didukung. OpenClaw menolak basis data yang `user_version`-nya lebih baru daripada build yang berjalan dan melaporkan galat `newer schema version`. Gateway memeriksa semua basis data terdaftar sebelum dimulai. `openclaw update` juga menolak paket atau target sumber yang dukungan skemanya dinyatakan lebih lama daripada basis data pada disk. Paket target yang diterbitkan sebelum metadata skema ditambahkan tidak dapat diperiksa sebelumnya.

Menginstal OpenClaw secara manual melalui npm melewati pengaman pemutakhiran. Pemeriksaan saat membuka basis data tetap menolak build yang tidak kompatibel.

## Riwayat skema agen

| Versi | Perubahan                                                                                                                                                                                                                                                      | Rilis pertama                                   |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| 1       | Penyimpanan per agen awal ([#88349](https://github.com/openclaw/openclaw/pull/88349))                                                                                                                                                                          | `v2026.5.30-beta.1`, stabil hingga `v2026.7.1` |
| 2       | Identitas indeks memori ([#104449](https://github.com/openclaw/openclaw/pull/104449))                                                                                                                                                                          | `v2026.7.2-beta.1`                              |
| 4       | Sesi dan transkrip dipindahkan ke SQLite ([#98236](https://github.com/openclaw/openclaw/pull/98236))                                                                                                                                                           | `v2026.7.2-beta.1`                              |
| 5-6     | Kesegaran terminal dan siklus hidup status ([#104859](https://github.com/openclaw/openclaw/pull/104859))                                                                                                                                                       | `v2026.7.2-beta.1`                              |
| 7       | Proyeksi status siklus hidup per entri ([#106151](https://github.com/openclaw/openclaw/pull/106151))                                                                                                                                                           | `v2026.7.2-beta.1`                              |
| 8       | Asal sesi per transkrip ([#106766](https://github.com/openclaw/openclaw/pull/106766))                                                                                                                                                                          | `v2026.7.2-beta.2`                              |
| 9       | Tabel `STRICT` ([#108663](https://github.com/openclaw/openclaw/pull/108663))                                                                                                                                                                         | `v2026.7.2-beta.2`                              |
| 10      | Jalur transkrip aktif yang dimaterialisasi ([#108851](https://github.com/openclaw/openclaw/pull/108851))                                                                                                                                                       | Belum dirilis                                   |
| 11      | Sewa, pengiriman tahan lama, alamat percakapan, dan hasil heartbeat ([#109636](https://github.com/openclaw/openclaw/pull/109636), [#95838](https://github.com/openclaw/openclaw/pull/95838), [#109999](https://github.com/openclaw/openclaw/pull/109999)) | Belum dirilis                                   |

Versi 3 adalah tahap pengembangan yang tidak pernah dirilis dan digabungkan ke dalam versi 4.

## Riwayat skema status

| Versi | Perubahan                                                                                                          | Rilis pertama       |
| ------- | ------------------------------------------------------------------------------------------------------------------ | ------------------- |
| 1       | Basis data status bersama awal                                                                                     | `v2026.5.30-beta.1` |
| 2       | Peristiwa audit pesan khusus metadata ([#103903](https://github.com/openclaw/openclaw/pull/103903))                | `v2026.7.2-beta.1`  |
| 3       | Tabel `STRICT` dan penguatan terhadap penyimpangan skema ([#108663](https://github.com/openclaw/openclaw/pull/108663)) | `v2026.7.2-beta.2`  |
| 4       | Asal pemantauan sesi menggantikan baris sentinel yang dikodekan                                                    | Belum dirilis       |

## Pemeriksaan integritas

| Waktu                                       | Pemeriksaan                                                     |
| ------------------------------------------- | --------------------------------------------------------------- |
| Setiap kali dibuka                          | Validasi tabel `schema_meta` dan baris metadata utama       |
| Sebelum migrasi yang tertunda               | Jalankan pemindaian lengkap integritas, kunci asing, peran, skema, dan indeks |
| Pemverifikasi latar belakang Gateway        | Jalankan pemindaian lengkap sekitar sekali sehari dan catat hasilnya |
| Doctor, verifikasi cadangan, dan Compaction | Jalankan pemindaian lengkap sebelum menerima atau menulis ulang basis data |

Pemeriksaan awal Gateway hanya membaca header skema. Pemverifikasi latar belakang menangani pemindaian lengkap yang lebih lambat untuk basis data yang tidak memerlukan migrasi.
Keputusan karantina hanya disimpan dalam penyimpanan `openclaw-quarantine.sqlite` khusus, sehingga tetap bertahan meskipun basis data yang dikarantina rusak. Hasil verifikasi dicatat.

## Pemecahan masalah

### Mengapa Anda tidak dapat kembali setelah memperbarui ke 2026.7.2

Setiap rilis hingga `v2026.7.1` menggunakan skema agen 1 dan skema status 1. Rangkaian rilis 2026.7.2 (dimulai dengan `v2026.7.2-beta.1`) memigrasikan basis data Anda ke versi yang lebih baru saat pertama kali dimulai. Migrasi tersebut bersifat satu arah: data ditulis ulang ke skema yang lebih baru, dan menginstal OpenClaw yang lebih lama setelahnya tidak membatalkannya. Build lama menolak untuk dimulai dengan galat `newer schema version` yang menyebutkan build pemilik basis data.

Menurunkan versi biner tidak pernah menurunkan versi data. Jika Anda harus menjalankan rilis yang lebih lama daripada 2026.7.2 setelah memperbarui, tersedia tiga opsi:

1. Pulihkan cadangan yang dibuat sebelum pemutakhiran. [Buat dan verifikasi cadangan](/id/cli/backup) sebelum pemutakhiran besar.
2. Jalankan build lama dengan direktori status terpisah (`OPENCLAW_STATE_DIR`). Build tersebut dimulai dari awal; data Anda yang telah dimigrasikan tetap tidak tersentuh saat Anda kembali ke build yang lebih baru.
3. Ikuti prosedur penurunan versi manual di bawah. Prosedur ini tidak didukung dan berisiko menyebabkan kehilangan data tanpa cadangan yang telah diverifikasi.

Sejak 2026.7.2, `openclaw update` menolak menginstal rilis yang tidak dapat membuka basis data Anda saat ini, sehingga pemutakhir tidak akan menempatkan Anda dalam situasi ini. Menginstal versi lama secara manual melalui npm melewati pengaman tersebut; basis data tetap menolak biner lama, tetapi hanya setelah biner tersebut diinstal.

### Gateway menolak dimulai karena galat versi skema yang lebih baru

Build OpenClaw yang lebih baru menulis basis data Anda, dan build yang sedang berjalan lebih lama. Galat dan log awal Gateway menyebutkan build pemilik basis data (`app_version`). Instal versi tersebut atau yang lebih baru, atau gunakan salah satu opsi di atas. Jangan mengedit basis data untuk membungkam galat tersebut.

### Basis data dikarantina setelah verifikasi integritas gagal

Pemverifikasi latar belakang membuktikan bahwa berkas tersebut rusak, dan setiap pembukaan kini langsung gagal alih-alih memindai ulang. Pulihkan basis data dari cadangan atau perbaiki, lalu jalankan `openclaw doctor --fix` untuk menghapus catatan karantina. Doctor melaporkan galat eksplisit jika catatan karantina itu sendiri tidak dapat dihapus; jalankan ulang hingga Doctor melaporkan kondisi bersih.

## Penurunan versi tidak didukung

Penurunan versi skema manual ditujukan bagi agen dan operator yang menerima risikonya. [Buat dan verifikasi cadangan](/id/cli/backup) sebelum mengedit basis data apa pun. Hentikan Gateway dan setiap proses yang dapat membuka basis data.

Prosedur umumnya adalah:

1. Baca skema dan migrasi rilis target.
2. Dalam satu transaksi, hapus setiap tabel, indeks, pemicu, dan kolom yang diperkenalkan setelah versi target.
3. Tetapkan `PRAGMA user_version` dan `schema_meta.schema_version` ke versi target.
4. Jalankan verifikasi basis data lengkap dari rilis target sebelum memulai Gateway.

### Contoh: skema agen 11 ke 9

Skema 10 menambahkan proyeksi transkrip aktif. Skema 11 menambahkan sewa, pengiriman tahan lama, status alamat percakapan, dan hasil heartbeat. Koordinasi QMD menggunakan baris dalam `state_leases`; tidak ada tabel QMD terpisah yang perlu dipertahankan.

Jalankan SQL yang setara terhadap setiap basis data per agen yang terpengaruh setelah memeriksa skema persis yang menulisnya:

```sql
BEGIN IMMEDIATE;

DROP TABLE IF EXISTS heartbeat_outcomes;
DROP TABLE IF EXISTS conversation_deliveries;
DROP TABLE IF EXISTS state_leases;
DROP TABLE IF EXISTS session_transcript_active_events;

ALTER TABLE session_transcript_index_state DROP COLUMN active_event_count;
ALTER TABLE session_transcript_index_state DROP COLUMN active_message_count;
ALTER TABLE conversations DROP COLUMN delivery_target;

PRAGMA user_version = 9;
UPDATE schema_meta
SET schema_version = 9,
    updated_at = unixepoch('now') * 1000
WHERE meta_key = 'primary';

COMMIT;
```

Tindakan ini membuang status versi 10-11, termasuk operasi pengiriman yang sedang berlangsung, sewa, hasil heartbeat, dan proyeksi transkrip aktif turunan. Jika penurunan versi gagal, pulihkan dari cadangan yang telah diverifikasi.
