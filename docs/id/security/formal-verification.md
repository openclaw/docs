---
permalink: /security/formal-verification/
read_when:
    - Meninjau jaminan atau batasan model keamanan formal
    - Mereproduksi atau memperbarui pemeriksaan model keamanan TLA+/TLC
summary: Model keamanan yang diperiksa mesin untuk jalur berisiko tertinggi di OpenClaw.
title: Verifikasi formal (model keamanan)
x-i18n:
    generated_at: "2026-05-06T09:27:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 298b92f27abb8321be807fe4d95c7cd568a0fb8f543d168863b2adb9b3ddcde4
    source_path: security/formal-verification.md
    workflow: 16
---

Halaman ini melacak **model keamanan formal** OpenClaw (TLA+/TLC saat ini; lainnya sesuai kebutuhan).

> Catatan: beberapa tautan lama mungkin merujuk ke nama proyek sebelumnya.

**Tujuan (arah utama):** menyediakan argumen yang diperiksa mesin bahwa OpenClaw menegakkan kebijakan keamanan yang dimaksudkan (otorisasi, isolasi sesi, pembatasan tool, dan keamanan terhadap salah konfigurasi), dengan asumsi yang eksplisit.

**Apa ini (saat ini):** **rangkaian regresi keamanan** yang dapat dieksekusi dan digerakkan oleh penyerang:

- Setiap klaim memiliki pemeriksaan model yang dapat dijalankan pada ruang status terbatas.
- Banyak klaim memiliki pasangan **model negatif** yang menghasilkan trace contoh tandingan untuk kelas bug yang realistis.

**Apa ini bukan (belum):** bukti bahwa "OpenClaw aman dalam segala aspek" atau bahwa implementasi TypeScript penuh sudah benar.

## Tempat model berada

Model dikelola di repo terpisah: [vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models).

## Catatan penting

- Ini adalah **model**, bukan implementasi TypeScript penuh. Drift antara model dan kode dapat terjadi.
- Hasil dibatasi oleh ruang status yang dieksplorasi oleh TLC; status "hijau" tidak menyiratkan keamanan di luar asumsi dan batas yang dimodelkan.
- Beberapa klaim bergantung pada asumsi lingkungan yang eksplisit (misalnya, deployment yang benar, input konfigurasi yang benar).

## Mereproduksi hasil

Saat ini, hasil direproduksi dengan meng-clone repo model secara lokal dan menjalankan TLC (lihat di bawah). Iterasi mendatang dapat menawarkan:

- model yang dijalankan CI dengan artefak publik (trace contoh tandingan, log eksekusi)
- workflow "jalankan model ini" yang di-host untuk pemeriksaan kecil dan terbatas

Memulai:

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# Java 11+ required (TLC runs on the JVM).
# The repo vendors a pinned `tla2tools.jar` (TLA+ tools) and provides `bin/tlc` + Make targets.

make <target>
```

### Eksposur Gateway dan salah konfigurasi Gateway terbuka

**Klaim:** binding di luar loopback tanpa auth dapat membuat kompromi jarak jauh menjadi mungkin / meningkatkan eksposur; token/password memblokir penyerang tanpa auth (sesuai asumsi model).

- Eksekusi hijau:
  - `make gateway-exposure-v2`
  - `make gateway-exposure-v2-protected`
- Merah (diharapkan):
  - `make gateway-exposure-v2-negative`

Lihat juga: `docs/gateway-exposure-matrix.md` di repo model.

### Pipeline exec Node (kapabilitas berisiko tertinggi)

**Klaim:** `exec host=node` memerlukan (a) allowlist perintah Node plus perintah yang dideklarasikan dan (b) persetujuan live saat dikonfigurasi; persetujuan diberi token untuk mencegah replay (dalam model).

- Eksekusi hijau:
  - `make nodes-pipeline`
  - `make approvals-token`
- Merah (diharapkan):
  - `make nodes-pipeline-negative`
  - `make approvals-token-negative`

### Penyimpanan pairing (pembatasan DM)

**Klaim:** permintaan pairing mematuhi TTL dan batas permintaan tertunda.

- Eksekusi hijau:
  - `make pairing`
  - `make pairing-cap`
- Merah (diharapkan):
  - `make pairing-negative`
  - `make pairing-cap-negative`

### Pembatasan ingress (mention + bypass perintah kontrol)

**Klaim:** dalam konteks grup yang memerlukan mention, "perintah kontrol" tanpa otorisasi tidak dapat melewati pembatasan mention.

- Hijau:
  - `make ingress-gating`
- Merah (diharapkan):
  - `make ingress-gating-negative`

### Isolasi routing/kunci sesi

**Klaim:** DM dari peer berbeda tidak digabungkan ke sesi yang sama kecuali ditautkan/dikonfigurasi secara eksplisit.

- Hijau:
  - `make routing-isolation`
- Merah (diharapkan):
  - `make routing-isolation-negative`

## v1++: model terbatas tambahan (konkurensi, retry, kebenaran trace)

Ini adalah model lanjutan yang memperketat fidelitas seputar mode kegagalan dunia nyata (pembaruan non-atomik, retry, dan fan-out pesan).

### Konkurensi / idempotensi penyimpanan pairing

**Klaim:** penyimpanan pairing harus menegakkan `MaxPending` dan idempotensi bahkan dalam interleaving (yaitu, "check-then-write" harus atomik / terkunci; refresh tidak boleh membuat duplikat).

Artinya:

- Dalam permintaan konkuren, Anda tidak bisa melampaui `MaxPending` untuk sebuah channel.
- Permintaan/refresh berulang untuk `(channel, sender)` yang sama tidak boleh membuat baris pending live duplikat.

- Eksekusi hijau:
  - `make pairing-race` (pemeriksaan batas atomik/terkunci)
  - `make pairing-idempotency`
  - `make pairing-refresh`
  - `make pairing-refresh-race`
- Merah (diharapkan):
  - `make pairing-race-negative` (race batas begin/commit non-atomik)
  - `make pairing-idempotency-negative`
  - `make pairing-refresh-negative`
  - `make pairing-refresh-race-negative`

### Korelasi trace / idempotensi ingress

**Klaim:** ingestion harus mempertahankan korelasi trace di seluruh fan-out dan bersifat idempoten saat terjadi retry provider.

Artinya:

- Saat satu event eksternal menjadi beberapa pesan internal, setiap bagian mempertahankan identitas trace/event yang sama.
- Retry tidak mengakibatkan pemrosesan ganda.
- Jika ID event provider tidak ada, dedupe menggunakan kunci aman sebagai fallback (misalnya, ID trace) untuk menghindari penghapusan event yang berbeda.

- Hijau:
  - `make ingress-trace`
  - `make ingress-trace2`
  - `make ingress-idempotency`
  - `make ingress-dedupe-fallback`
- Merah (diharapkan):
  - `make ingress-trace-negative`
  - `make ingress-trace2-negative`
  - `make ingress-idempotency-negative`
  - `make ingress-dedupe-fallback-negative`

### Presedensi dmScope routing + identityLinks

**Klaim:** routing harus menjaga sesi DM tetap terisolasi secara default, dan hanya menggabungkan sesi saat dikonfigurasi secara eksplisit (presedensi channel + tautan identitas).

Artinya:

- Override dmScope khusus channel harus mengalahkan default global.
- identityLinks hanya boleh menggabungkan dalam grup yang ditautkan secara eksplisit, bukan lintas peer yang tidak terkait.

- Hijau:
  - `make routing-precedence`
  - `make routing-identitylinks`
- Merah (diharapkan):
  - `make routing-precedence-negative`
  - `make routing-identitylinks-negative`

## Terkait

- [Model ancaman](/id/security/THREAT-MODEL-ATLAS)
- [Berkontribusi pada model ancaman](/id/security/CONTRIBUTING-THREAT-MODEL)
