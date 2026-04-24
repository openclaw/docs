---
permalink: /security/formal-verification/
read_when:
    - Meninjau jaminan atau batas model keamanan formal
    - Mereproduksi atau memperbarui pemeriksaan model keamanan TLA+/TLC
summary: Model keamanan yang diperiksa mesin untuk jalur berisiko tertinggi OpenClaw.
title: Verifikasi formal (model keamanan)
x-i18n:
    generated_at: "2026-04-24T09:27:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f50fa9118a80054b8d556cd4f1901b2d5fcb37fb0866bd5357a1b0a46c74116
    source_path: security/formal-verification.md
    workflow: 15
---

Halaman ini melacak **model keamanan formal** OpenClaw (saat ini TLA+/TLC; lebih banyak bila diperlukan).

> Catatan: beberapa tautan lama mungkin merujuk ke nama proyek sebelumnya.

**Tujuan (arah utama):** menyediakan argumen yang diperiksa mesin bahwa OpenClaw menegakkan
kebijakan keamanan yang dimaksudkan (otorisasi, isolasi sesi, pembatasan tool, dan
keamanan salah konfigurasi), di bawah asumsi yang eksplisit.

**Apa ini (saat ini):** **suite regresi keamanan** yang dapat dijalankan dan digerakkan penyerang:

- Setiap klaim memiliki pemeriksaan model yang dapat dijalankan pada ruang state terbatas.
- Banyak klaim memiliki **model negatif** berpasangan yang menghasilkan jejak counterexample untuk kelas bug yang realistis.

**Apa ini bukan (belum):** bukti bahwa “OpenClaw aman dalam segala hal” atau bahwa implementasi TypeScript penuh sudah benar.

## Tempat model berada

Model dikelola di repo terpisah: [vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models).

## Peringatan penting

- Ini adalah **model**, bukan implementasi TypeScript penuh. Drift antara model dan kode mungkin terjadi.
- Hasil dibatasi oleh ruang state yang dieksplorasi oleh TLC; hasil “hijau” tidak menyiratkan keamanan di luar asumsi dan batas yang dimodelkan.
- Beberapa klaim bergantung pada asumsi lingkungan yang eksplisit (misalnya deployment yang benar, input konfigurasi yang benar).

## Mereproduksi hasil

Saat ini, hasil direproduksi dengan meng-clone repo model secara lokal dan menjalankan TLC (lihat di bawah). Iterasi mendatang dapat menawarkan:

- model yang dijalankan di CI dengan artefak publik (jejak counterexample, log run)
- alur kerja ter-host “jalankan model ini” untuk pemeriksaan kecil dan terbatas

Memulai:

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# Java 11+ diperlukan (TLC berjalan di JVM).
# Repo ini mem-vendor `tla2tools.jar` yang dipin (tool TLA+) dan menyediakan `bin/tlc` + target Make.

make <target>
```

### Eksposur gateway dan salah konfigurasi gateway terbuka

**Klaim:** bind di luar loopback tanpa auth dapat memungkinkan kompromi remote / meningkatkan eksposur; token/password memblokir penyerang tanpa auth (sesuai asumsi model).

- Run hijau:
  - `make gateway-exposure-v2`
  - `make gateway-exposure-v2-protected`
- Merah (diharapkan):
  - `make gateway-exposure-v2-negative`

Lihat juga: `docs/gateway-exposure-matrix.md` di repo model.

### Pipeline exec node (kapabilitas berisiko tertinggi)

**Klaim:** `exec host=node` memerlukan (a) allowlist perintah node plus perintah yang dideklarasikan dan (b) persetujuan live bila dikonfigurasi; persetujuan diberi token untuk mencegah replay (di model).

- Run hijau:
  - `make nodes-pipeline`
  - `make approvals-token`
- Merah (diharapkan):
  - `make nodes-pipeline-negative`
  - `make approvals-token-negative`

### Store pairing (gerbang DM)

**Klaim:** permintaan pairing mematuhi TTL dan batas permintaan tertunda.

- Run hijau:
  - `make pairing`
  - `make pairing-cap`
- Merah (diharapkan):
  - `make pairing-negative`
  - `make pairing-cap-negative`

### Pembatasan ingress (mention + bypass control-command)

**Klaim:** dalam konteks grup yang memerlukan mention, “control command” yang tidak berwenang tidak dapat melewati gerbang mention.

- Hijau:
  - `make ingress-gating`
- Merah (diharapkan):
  - `make ingress-gating-negative`

### Isolasi perutean/kunci sesi

**Klaim:** DM dari peer yang berbeda tidak runtuh ke sesi yang sama kecuali secara eksplisit ditautkan/dikonfigurasi.

- Hijau:
  - `make routing-isolation`
- Merah (diharapkan):
  - `make routing-isolation-negative`

## v1++: model terbatas tambahan (konkurensi, retry, kebenaran jejak)

Ini adalah model lanjutan yang memperketat fidelitas di sekitar mode kegagalan dunia nyata (pembaruan non-atomik, retry, dan fan-out pesan).

### Konkurensi / idempotensi store pairing

**Klaim:** store pairing harus menegakkan `MaxPending` dan idempotensi bahkan di bawah interleaving (yaitu, “check-then-write” harus atomik / terkunci; refresh tidak boleh membuat duplikat).

Artinya:

- Di bawah permintaan konkurensi, Anda tidak dapat melampaui `MaxPending` untuk sebuah channel.
- Permintaan/refresh berulang untuk `(channel, sender)` yang sama tidak boleh membuat baris pending live yang duplikat.

- Run hijau:
  - `make pairing-race` (pemeriksaan batas atomik/terkunci)
  - `make pairing-idempotency`
  - `make pairing-refresh`
  - `make pairing-refresh-race`
- Merah (diharapkan):
  - `make pairing-race-negative` (race batas begin/commit non-atomik)
  - `make pairing-idempotency-negative`
  - `make pairing-refresh-negative`
  - `make pairing-refresh-race-negative`

### Korelasi / idempotensi jejak ingress

**Klaim:** ingestion harus mempertahankan korelasi jejak di seluruh fan-out dan bersifat idempoten di bawah retry provider.

Artinya:

- Saat satu peristiwa eksternal menjadi beberapa pesan internal, setiap bagian mempertahankan identitas jejak/peristiwa yang sama.
- Retry tidak menghasilkan pemrosesan ganda.
- Jika id peristiwa provider hilang, deduplikasi fallback ke kunci aman (misalnya trace ID) untuk menghindari pembuangan peristiwa yang berbeda.

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

### Prioritas dmScope perutean + identityLinks

**Klaim:** perutean harus menjaga sesi DM tetap terisolasi secara default, dan hanya meruntuhkan sesi saat dikonfigurasi secara eksplisit (prioritas channel + tautan identitas).

Artinya:

- Override dmScope khusus channel harus menang atas default global.
- identityLinks hanya boleh meruntuhkan di dalam grup tertaut yang eksplisit, bukan di seluruh peer yang tidak terkait.

- Hijau:
  - `make routing-precedence`
  - `make routing-identitylinks`
- Merah (diharapkan):
  - `make routing-precedence-negative`
  - `make routing-identitylinks-negative`

## Terkait

- [Model ancaman](/id/security/THREAT-MODEL-ATLAS)
- [Berkontribusi pada model ancaman](/id/security/CONTRIBUTING-THREAT-MODEL)
