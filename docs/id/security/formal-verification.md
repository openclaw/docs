---
permalink: /security/formal-verification/
read_when:
    - Meninjau jaminan atau batasan model keamanan formal
    - Mereproduksi atau memperbarui pemeriksaan model keamanan TLA+/TLC
summary: Model keamanan yang diperiksa mesin untuk jalur OpenClaw dengan risiko tertinggi.
title: Verifikasi formal (model keamanan)
x-i18n:
    generated_at: "2026-07-19T05:36:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 185ee5c1cff7325f10827330c0c7e55ddc3ca40caf6088d4c930ae5e090d6b27
    source_path: security/formal-verification.md
    workflow: 16
---

Model keamanan formal OpenClaw (TLA+/TLC saat ini) memberikan argumen yang diperiksa mesin bahwa jalur tertentu dengan risiko tertinggi — otorisasi, isolasi sesi, pembatasan alat, dan keamanan terhadap kesalahan konfigurasi — menegakkan kebijakan yang dimaksud, berdasarkan asumsi eksplisit yang dinyatakan.

> Catatan: beberapa tautan lama mungkin merujuk pada nama proyek sebelumnya.

## Apa ini

Rangkaian regresi keamanan yang dapat dieksekusi dan digerakkan oleh penyerang:

- Setiap klaim memiliki pemeriksaan model yang dapat dijalankan pada ruang keadaan terbatas.
- Banyak klaim memiliki pasangan model negatif yang menghasilkan jejak contoh tandingan untuk kelas bug yang realistis.

Ini **bukan** bukti bahwa OpenClaw aman dalam segala aspek, dan tidak memverifikasi keseluruhan implementasi TypeScript.

## Lokasi model

Model dipelihara dalam repositori terpisah: [vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models).

<Note>
Repositori tersebut saat ini tidak dapat diakses (GitHub menampilkan "Repository not found" pada saat penulisan ini). Jika masih tidak dapat diakses oleh Anda, tanyakan lokasi terkini di kanal pengelola OpenClaw sebelum menganggap model tersebut telah dihapus.
</Note>

## Batasan

- Ini adalah model, bukan keseluruhan implementasi TypeScript — perbedaan antara model dan kode mungkin terjadi.
- Hasil dibatasi oleh ruang keadaan yang dijelajahi TLC. Status hijau tidak menyiratkan keamanan di luar asumsi dan batas yang dimodelkan.
- Beberapa klaim bergantung pada asumsi lingkungan yang eksplisit (misalnya, penerapan dan masukan konfigurasi yang benar).

## Mereproduksi hasil

Kloning repositori model dan jalankan TLC:

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# Memerlukan Java 11+ (TLC berjalan pada JVM).
# Repositori menyertakan tla2tools.jar dengan versi yang dipatok serta menyediakan bin/tlc dan target Make.

make <target>
```

Belum ada integrasi Pipeline CI kembali ke repositori ini; iterasi mendatang dapat menambahkan model yang dijalankan melalui CI dengan artefak publik (jejak contoh tandingan, log eksekusi) atau alur kerja "jalankan model ini" yang dihosting untuk pemeriksaan terbatas berskala kecil.

## Klaim dan target

### Paparan Gateway dan kesalahan konfigurasi Gateway terbuka

**Klaim:** pengikatan di luar loopback tanpa autentikasi dapat memungkinkan kompromi jarak jauh dan meningkatkan paparan; token/kata sandi memblokir penyerang yang tidak terautentikasi, berdasarkan asumsi model.

| Hasil          | Target                                                           |
| -------------- | ---------------------------------------------------------------- |
| Hijau          | `make gateway-exposure-v2`, `make gateway-exposure-v2-protected` |
| Merah (sesuai perkiraan) | `make gateway-exposure-v2-negative`                              |

Lihat juga `docs/gateway-exposure-matrix.md` dalam repositori model.

### Pipeline eksekusi Node (kapabilitas dengan risiko tertinggi)

**Klaim:** `exec host=node` memerlukan (a) daftar izin perintah Node beserta perintah yang dideklarasikan dan (b) persetujuan langsung jika dikonfigurasi; dalam model, persetujuan diberi token untuk mencegah pemutaran ulang.

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

### Pembatasan ingress (penyebutan dan penerobosan perintah kontrol)

**Klaim:** dalam konteks grup yang mewajibkan penyebutan, perintah kontrol yang tidak diotorisasi tidak dapat menerobos pembatasan penyebutan.

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

Model lanjutan yang meningkatkan kesesuaian terhadap mode kegagalan dunia nyata: pembaruan nonatomik, percobaan ulang, dan fan-out pesan.

### Konkurensi dan idempotensi penyimpanan pemasangan

**Klaim:** penyimpanan pemasangan menegakkan `MaxPending` dan idempotensi bahkan dalam operasi yang berselang-seling — periksa-lalu-tulis harus bersifat atomik/terkunci, dan penyegaran tidak boleh membuat duplikat. Secara konkret: permintaan serentak tidak dapat melampaui `MaxPending` untuk suatu kanal, dan permintaan/penyegaran berulang untuk `(channel, sender)` yang sama tidak membuat baris tertunda aktif yang duplikat.

| Hasil          | Target                                                                                                                                                                      |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hijau          | `make pairing-race` (pemeriksaan batas atomik/terkunci), `make pairing-idempotency`, `make pairing-refresh`, `make pairing-refresh-race`                                              |
| Merah (sesuai perkiraan) | `make pairing-race-negative` (kondisi balapan batas begin/commit nonatomik), `make pairing-idempotency-negative`, `make pairing-refresh-negative`, `make pairing-refresh-race-negative` |

### Korelasi jejak dan idempotensi ingress

**Klaim:** proses ingest mempertahankan korelasi jejak selama fan-out dan bersifat idempoten saat penyedia melakukan percobaan ulang. Ketika satu peristiwa eksternal menjadi beberapa pesan internal, setiap bagian mempertahankan identitas jejak/peristiwa yang sama; percobaan ulang tidak menyebabkan pemrosesan ganda; jika ID peristiwa penyedia tidak tersedia, deduplikasi menggunakan kunci aman sebagai cadangan (misalnya ID jejak) agar tidak membuang peristiwa yang berbeda.

| Hasil          | Target                                                                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Hijau          | `make ingress-trace`, `make ingress-trace2`, `make ingress-idempotency`, `make ingress-dedupe-fallback`                                     |
| Merah (sesuai perkiraan) | `make ingress-trace-negative`, `make ingress-trace2-negative`, `make ingress-idempotency-negative`, `make ingress-dedupe-fallback-negative` |

### Perutean prioritas dmScope dan identityLinks

**Klaim:** prioritas `dmScope` dan tautan identitas berperilaku secara deterministik: cakupan default `main` berbagi satu sesi berjalan di seluruh DM milik satu pemilik (default agen pribadi), sedangkan setiap cakupan isolasi yang dikonfigurasi (`per-peer`, `per-channel-peer`, `per-account-channel-peer`) menjaga sesi DM tetap terpisah secara ketat. Penimpaan `dmScope` khusus kanal lebih diutamakan daripada default global; `identityLinks` menggabungkan sesi hanya dalam grup yang ditautkan secara eksplisit, bukan di antara rekan yang tidak terkait. Kotak masuk multi-pengguna diharapkan memilih cakupan isolasi (audit keamanan runtime merekomendasikan hal ini ketika mendeteksi lalu lintas DM multi-pengguna).

| Hasil          | Target                                                                    |
| -------------- | ------------------------------------------------------------------------- |
| Hijau          | `make routing-precedence`, `make routing-identitylinks`                   |
| Merah (sesuai perkiraan) | `make routing-precedence-negative`, `make routing-identitylinks-negative` |

## Terkait

- [Model ancaman](/id/security/THREAT-MODEL-ATLAS)
- [Berkontribusi pada model ancaman](/id/security/CONTRIBUTING-THREAT-MODEL)
- [Respons insiden](/id/security/incident-response)
