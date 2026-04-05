---
permalink: /security/formal-verification/
read_when:
    - Meninjau jaminan atau batas model keamanan formal
    - Mereproduksi atau memperbarui pemeriksaan model keamanan TLA+/TLC
summary: Model keamanan yang diperiksa mesin untuk jalur OpenClaw dengan risiko tertinggi.
title: Verifikasi Formal (Model Keamanan)
x-i18n:
    generated_at: "2026-04-05T14:06:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0f7cd2461dcc00d320a5210e50279d76a7fa84e0830c440398323d75e262a38a
    source_path: security/formal-verification.md
    workflow: 15
---

# Verifikasi Formal (Model Keamanan)

Halaman ini melacak **model keamanan formal** OpenClaw (TLA+/TLC saat ini; lebih banyak lagi sesuai kebutuhan).

> Catatan: beberapa tautan lama mungkin merujuk ke nama proyek sebelumnya.

**Tujuan (north star):** menyediakan argumen yang diperiksa mesin bahwa OpenClaw menegakkan
kebijakan keamanan yang dimaksudkan (otorisasi, isolasi sesi, pembatasan tool, dan
keamanan dari salah konfigurasi), dengan asumsi yang dinyatakan secara eksplisit.

**Apa ini (saat ini):** **suite regresi keamanan** yang dapat dijalankan dan digerakkan oleh penyerang:

- Setiap klaim memiliki pemeriksaan model yang dapat dijalankan pada ruang keadaan yang terbatas.
- Banyak klaim memiliki **model negatif** berpasangan yang menghasilkan jejak counterexample untuk kelas bug yang realistis.

**Apa yang belum ini (saat ini):** bukti bahwa “OpenClaw aman dalam semua aspek” atau bahwa seluruh implementasi TypeScript benar.

## Lokasi model

Model dipelihara di repo terpisah: [vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models).

## Peringatan penting

- Ini adalah **model**, bukan implementasi TypeScript penuh. Perbedaan antara model dan kode mungkin terjadi.
- Hasil dibatasi oleh ruang keadaan yang dijelajahi TLC; hasil “hijau” tidak menyiratkan keamanan di luar asumsi dan batas yang dimodelkan.
- Beberapa klaim bergantung pada asumsi lingkungan yang dinyatakan secara eksplisit (misalnya, deployment yang benar, input konfigurasi yang benar).

## Mereproduksi hasil

Saat ini, hasil direproduksi dengan meng-clone repo model secara lokal dan menjalankan TLC (lihat di bawah). Iterasi mendatang dapat menawarkan:

- model yang dijalankan CI dengan artefak publik (jejak counterexample, log run)
- workflow “jalankan model ini” yang di-host untuk pemeriksaan kecil yang terbatas

Memulai:

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# Java 11+ required (TLC runs on the JVM).
# The repo vendors a pinned `tla2tools.jar` (TLA+ tools) and provides `bin/tlc` + Make targets.

make <target>
```

### Eksposur gateway dan salah konfigurasi gateway terbuka

**Klaim:** binding di luar loopback tanpa auth dapat memungkinkan kompromi jarak jauh / meningkatkan eksposur; token/password memblokir penyerang tanpa autentikasi (sesuai asumsi model).

- Run hijau:
  - `make gateway-exposure-v2`
  - `make gateway-exposure-v2-protected`
- Merah (sesuai harapan):
  - `make gateway-exposure-v2-negative`

Lihat juga: `docs/gateway-exposure-matrix.md` di repo model.

### Pipeline exec node (kapabilitas dengan risiko tertinggi)

**Klaim:** `exec host=node` memerlukan (a) allowlist perintah node ditambah perintah yang dideklarasikan dan (b) persetujuan langsung saat dikonfigurasi; persetujuan ditokenisasi untuk mencegah replay (di dalam model).

- Run hijau:
  - `make nodes-pipeline`
  - `make approvals-token`
- Merah (sesuai harapan):
  - `make nodes-pipeline-negative`
  - `make approvals-token-negative`

### Pairing store (pembatasan DM)

**Klaim:** permintaan pairing mematuhi TTL dan batas permintaan tertunda.

- Run hijau:
  - `make pairing`
  - `make pairing-cap`
- Merah (sesuai harapan):
  - `make pairing-negative`
  - `make pairing-cap-negative`

### Pembatasan ingress (mention + bypass control-command)

**Klaim:** dalam konteks grup yang mewajibkan mention, “control command” yang tidak berwenang tidak dapat melewati pembatasan mention.

- Hijau:
  - `make ingress-gating`
- Merah (sesuai harapan):
  - `make ingress-gating-negative`

### Isolasi routing/session-key

**Klaim:** DM dari peer yang berbeda tidak digabungkan ke sesi yang sama kecuali secara eksplisit ditautkan/dikonfigurasi.

- Hijau:
  - `make routing-isolation`
- Merah (sesuai harapan):
  - `make routing-isolation-negative`

## v1++: model terbatas tambahan (konkurensi, retry, ketepatan jejak)

Ini adalah model lanjutan yang memperketat fidelitas terhadap mode kegagalan dunia nyata (pembaruan non-atomik, retry, dan fan-out pesan).

### Konkurensi / idempotensi pairing store

**Klaim:** pairing store harus menegakkan `MaxPending` dan idempotensi bahkan di bawah interleaving (yaitu, “check-then-write” harus atomik / terkunci; refresh tidak boleh membuat duplikat).

Artinya:

- Dalam permintaan serentak, Anda tidak dapat melebihi `MaxPending` untuk sebuah channel.
- Permintaan/refresh berulang untuk `(channel, sender)` yang sama tidak boleh membuat baris pending aktif yang duplikat.

- Run hijau:
  - `make pairing-race` (pemeriksaan batas atomik/terkunci)
  - `make pairing-idempotency`
  - `make pairing-refresh`
  - `make pairing-refresh-race`
- Merah (sesuai harapan):
  - `make pairing-race-negative` (race batas begin/commit non-atomik)
  - `make pairing-idempotency-negative`
  - `make pairing-refresh-negative`
  - `make pairing-refresh-race-negative`

### Korelasi jejak ingress / idempotensi

**Klaim:** ingest harus mempertahankan korelasi jejak di seluruh fan-out dan bersifat idempoten saat provider melakukan retry.

Artinya:

- Saat satu event eksternal menjadi beberapa pesan internal, setiap bagian mempertahankan identitas trace/event yang sama.
- Retry tidak menyebabkan pemrosesan ganda.
- Jika ID event provider tidak ada, dedupe menggunakan safe key cadangan (misalnya, trace ID) agar tidak menjatuhkan event yang berbeda.

- Hijau:
  - `make ingress-trace`
  - `make ingress-trace2`
  - `make ingress-idempotency`
  - `make ingress-dedupe-fallback`
- Merah (sesuai harapan):
  - `make ingress-trace-negative`
  - `make ingress-trace2-negative`
  - `make ingress-idempotency-negative`
  - `make ingress-dedupe-fallback-negative`

### Routing dmScope precedence + identityLinks

**Klaim:** routing harus menjaga sesi DM tetap terisolasi secara default, dan hanya menggabungkan sesi ketika dikonfigurasi secara eksplisit (prioritas channel + identity links).

Artinya:

- Override dmScope khusus channel harus menang atas default global.
- identityLinks hanya boleh menggabungkan dalam grup tertaut yang eksplisit, bukan melintasi peer yang tidak terkait.

- Hijau:
  - `make routing-precedence`
  - `make routing-identitylinks`
- Merah (sesuai harapan):
  - `make routing-precedence-negative`
  - `make routing-identitylinks-negative`
