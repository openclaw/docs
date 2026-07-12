---
permalink: /security/formal-verification/
read_when:
    - Meninjau jaminan atau batasan model keamanan formal
    - Mereproduksi atau memperbarui pemeriksaan model keamanan TLA+/TLC
summary: Model keamanan yang diverifikasi mesin untuk jalur OpenClaw dengan risiko tertinggi.
title: Verifikasi formal (model keamanan)
x-i18n:
    generated_at: "2026-07-12T14:40:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 86342f6e2f54c08d5e0f8a08d0d488459650a6ace35e985ff886f847540202c9
    source_path: security/formal-verification.md
    workflow: 16
---

Model keamanan formal OpenClaw (saat ini TLA+/TLC) memberikan argumen yang diperiksa mesin bahwa jalur tertentu dengan risiko tertinggi — otorisasi, isolasi sesi, pembatasan alat, dan keamanan terhadap kesalahan konfigurasi — menegakkan kebijakan yang dimaksud, berdasarkan asumsi yang dinyatakan secara eksplisit.

> Catatan: beberapa tautan lama mungkin merujuk pada nama proyek sebelumnya.

## Apa ini

Rangkaian pengujian regresi keamanan yang dapat dijalankan dan digerakkan oleh penyerang:

- Setiap klaim memiliki pemeriksaan model yang dapat dijalankan pada ruang keadaan terbatas.
- Banyak klaim memiliki pasangan model negatif yang menghasilkan jejak contoh tandingan untuk kelas bug yang realistis.

Ini **bukan** bukti bahwa OpenClaw aman dalam segala aspek, dan tidak memverifikasi keseluruhan implementasi TypeScript.

## Lokasi model

Model dikelola dalam repositori terpisah: [vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models).

<Note>
Repositori tersebut saat ini tidak dapat diakses (GitHub menampilkan "Repository not found" pada saat dokumen ini ditulis). Jika repositori tersebut masih tidak dapat diakses oleh Anda, tanyakan lokasi terbarunya melalui kanal pengelola OpenClaw sebelum menganggap model telah dihapus.
</Note>

## Catatan penting

- Ini adalah model, bukan keseluruhan implementasi TypeScript — ketidaksesuaian antara model dan kode mungkin terjadi.
- Hasil dibatasi oleh ruang keadaan yang dieksplorasi TLC. Hasil hijau tidak menyiratkan keamanan di luar asumsi dan batas yang dimodelkan.
- Beberapa klaim bergantung pada asumsi lingkungan yang eksplisit (misalnya, deployment dan masukan konfigurasi yang benar).

## Mereproduksi hasil

Kloning repositori model dan jalankan TLC:

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# Memerlukan Java 11+ (TLC berjalan pada JVM).
# Repositori menyertakan tla2tools.jar dengan versi yang dikunci serta menyediakan bin/tlc dan target Make.

make <target>
```

Belum ada integrasi CI kembali ke repositori ini; iterasi mendatang dapat menambahkan model yang dijalankan oleh CI dengan artefak publik (jejak contoh tandingan, log eksekusi) atau alur kerja "jalankan model ini" yang dihosting untuk pemeriksaan terbatas berskala kecil.

## Klaim dan target

### Paparan Gateway dan kesalahan konfigurasi Gateway terbuka

**Klaim:** pengikatan di luar loopback tanpa autentikasi dapat memungkinkan penyusupan jarak jauh dan meningkatkan paparan; token/kata sandi memblokir penyerang yang tidak terautentikasi, berdasarkan asumsi model.

| Hasil          | Target                                                           |
| -------------- | ---------------------------------------------------------------- |
| Hijau          | `make gateway-exposure-v2`, `make gateway-exposure-v2-protected` |
| Merah (sesuai perkiraan) | `make gateway-exposure-v2-negative`                     |

Lihat juga `docs/gateway-exposure-matrix.md` dalam repositori model.

### Alur eksekusi Node (kapabilitas dengan risiko tertinggi)

**Klaim:** `exec host=node` memerlukan (a) daftar izin perintah Node beserta perintah yang dideklarasikan dan (b) persetujuan langsung ketika dikonfigurasi; dalam model, persetujuan diberi token untuk mencegah pemutaran ulang.

| Hasil          | Target                                                          |
| -------------- | --------------------------------------------------------------- |
| Hijau          | `make nodes-pipeline`, `make approvals-token`                   |
| Merah (sesuai perkiraan) | `make nodes-pipeline-negative`, `make approvals-token-negative` |

### Penyimpanan pemasangan (pembatasan DM)

**Klaim:** permintaan pemasangan mematuhi TTL dan batas permintaan tertunda.

| Hasil          | Target                                               |
| -------------- | ---------------------------------------------------- |
| Hijau          | `make pairing`, `make pairing-cap`                   |
| Merah (sesuai perkiraan) | `make pairing-negative`, `make pairing-cap-negative` |

### Pembatasan masukan (penyebutan dan pengelakan perintah kontrol)

**Klaim:** dalam konteks grup yang mewajibkan penyebutan, perintah kontrol yang tidak diotorisasi tidak dapat mengelakkan pembatasan penyebutan.

| Hasil          | Target                         |
| -------------- | ------------------------------ |
| Hijau          | `make ingress-gating`          |
| Merah (sesuai perkiraan) | `make ingress-gating-negative` |

### Perutean dan isolasi kunci sesi

**Klaim:** DM dari rekan yang berbeda tidak digabungkan ke dalam sesi yang sama kecuali ditautkan atau dikonfigurasi secara eksplisit.

| Hasil          | Target                            |
| -------------- | --------------------------------- |
| Hijau          | `make routing-isolation`          |
| Merah (sesuai perkiraan) | `make routing-isolation-negative` |

## Model v1++: konkurensi, percobaan ulang, dan ketepatan jejak

Model lanjutan yang meningkatkan ketepatan seputar mode kegagalan di dunia nyata: pembaruan nonatomik, percobaan ulang, dan penyebaran pesan.

### Konkurensi dan idempotensi penyimpanan pemasangan

**Klaim:** penyimpanan pemasangan menegakkan `MaxPending` dan idempotensi bahkan dalam kondisi operasi yang saling berselang-seling — pemeriksaan-lalu-penulisan harus bersifat atomik/dikunci, dan penyegaran tidak boleh membuat duplikat. Secara konkret: permintaan bersamaan tidak dapat melampaui `MaxPending` untuk suatu kanal, dan permintaan/penyegaran berulang untuk `(channel, sender)` yang sama tidak membuat baris tertunda aktif yang duplikat.

| Hasil          | Target                                                                                                                                                                      |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hijau          | `make pairing-race` (pemeriksaan batas atomik/terkunci), `make pairing-idempotency`, `make pairing-refresh`, `make pairing-refresh-race`                                    |
| Merah (sesuai perkiraan) | `make pairing-race-negative` (kondisi balapan batas begin/commit nonatomik), `make pairing-idempotency-negative`, `make pairing-refresh-negative`, `make pairing-refresh-race-negative` |

### Korelasi jejak dan idempotensi masukan

**Klaim:** proses pemasukan mempertahankan korelasi jejak selama penyebaran dan bersifat idempoten ketika penyedia melakukan percobaan ulang. Ketika satu peristiwa eksternal menjadi beberapa pesan internal, setiap bagian mempertahankan identitas jejak/peristiwa yang sama; percobaan ulang tidak menyebabkan pemrosesan ganda; jika ID peristiwa penyedia tidak tersedia, deduplikasi beralih ke kunci yang aman (misalnya ID jejak) untuk menghindari penghapusan peristiwa yang berbeda.

| Hasil          | Target                                                                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Hijau          | `make ingress-trace`, `make ingress-trace2`, `make ingress-idempotency`, `make ingress-dedupe-fallback`                                     |
| Merah (sesuai perkiraan) | `make ingress-trace-negative`, `make ingress-trace2-negative`, `make ingress-idempotency-negative`, `make ingress-dedupe-fallback-negative` |

### Prioritas `dmScope` perutean dan `identityLinks`

**Klaim:** perutean menjaga sesi DM tetap terisolasi secara default dan hanya menggabungkan sesi ketika dikonfigurasi secara eksplisit, melalui prioritas kanal dan tautan identitas. Penggantian `dmScope` khusus kanal lebih diprioritaskan daripada nilai default global; `identityLinks` menggabungkan sesi hanya di dalam grup tertaut yang eksplisit, bukan di antara rekan yang tidak berkaitan.

| Hasil          | Target                                                                    |
| -------------- | ------------------------------------------------------------------------- |
| Hijau          | `make routing-precedence`, `make routing-identitylinks`                   |
| Merah (sesuai perkiraan) | `make routing-precedence-negative`, `make routing-identitylinks-negative` |

## Terkait

- [Model ancaman](/id/security/THREAT-MODEL-ATLAS)
- [Berkontribusi pada model ancaman](/id/security/CONTRIBUTING-THREAT-MODEL)
- [Respons insiden](/id/security/incident-response)
