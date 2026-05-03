---
read_when:
    - Seorang pengguna melaporkan bahwa agen terjebak mengulang panggilan alat
    - Anda perlu menyesuaikan perlindungan panggilan berulang
    - Anda sedang mengedit kebijakan alat/runtime agen
summary: Cara mengaktifkan dan menyesuaikan pembatas pengaman yang mendeteksi loop panggilan alat berulang
title: Deteksi perulangan alat
x-i18n:
    generated_at: "2026-05-03T21:38:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b3976948d5735cf08b7ce854bab048a77a778a07a9f3f66d17c15aed0d42a97
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw dapat mencegah agen terjebak dalam pola panggilan alat yang berulang.
Pengaman ini **dinonaktifkan secara default**.

Aktifkan hanya jika diperlukan, karena pengaturan yang ketat dapat memblokir panggilan berulang yang sah.

## Mengapa ini ada

- Mendeteksi urutan berulang yang tidak menghasilkan kemajuan.
- Mendeteksi loop tanpa hasil berfrekuensi tinggi (alat yang sama, input yang sama, kesalahan berulang).
- Mendeteksi pola panggilan berulang tertentu untuk alat polling yang dikenal.

## Blok konfigurasi

Default global:

```json5
{
  tools: {
    loopDetection: {
      enabled: false,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

Override per agen (opsional):

```json5
{
  agents: {
    list: [
      {
        id: "safe-runner",
        tools: {
          loopDetection: {
            enabled: true,
            warningThreshold: 8,
            criticalThreshold: 16,
          },
        },
      },
    ],
  },
}
```

### Perilaku field

- `enabled`: Sakelar utama. `false` berarti tidak ada deteksi loop yang dilakukan.
- `historySize`: jumlah panggilan alat terbaru yang disimpan untuk analisis.
- `warningThreshold`: ambang batas sebelum mengklasifikasikan pola sebagai hanya peringatan.
- `criticalThreshold`: ambang batas untuk memblokir pola loop berulang.
- `globalCircuitBreakerThreshold`: ambang pemutus global tanpa kemajuan.
- `detectors.genericRepeat`: mendeteksi pola alat-sama + parameter-sama yang berulang.
- `detectors.knownPollNoProgress`: mendeteksi pola yang mirip polling dan dikenal tanpa perubahan status.
- `detectors.pingPong`: mendeteksi pola ping-pong bergantian.

Untuk `exec`, pemeriksaan tanpa kemajuan membandingkan hasil perintah yang stabil dan mengabaikan metadata runtime yang mudah berubah seperti durasi, PID, ID sesi, dan direktori kerja.
Ketika ID run tersedia, riwayat panggilan alat terbaru dievaluasi hanya di dalam run tersebut sehingga siklus Heartbeat terjadwal dan run baru tidak mewarisi hitungan loop usang dari run sebelumnya.

## Penyiapan yang direkomendasikan

- Untuk model yang lebih kecil, mulai dengan `enabled: true`, tanpa mengubah default. Model unggulan jarang memerlukan deteksi loop dan dapat membiarkannya dinonaktifkan.
- Pertahankan urutan ambang batas sebagai `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`.
- Jika terjadi positif palsu:
  - naikkan `warningThreshold` dan/atau `criticalThreshold`
  - (opsional) naikkan `globalCircuitBreakerThreshold`
  - nonaktifkan hanya detektor yang menyebabkan masalah
  - kurangi `historySize` untuk konteks historis yang tidak terlalu ketat

## Log dan perilaku yang diharapkan

Ketika loop terdeteksi, OpenClaw melaporkan peristiwa loop dan memblokir atau meredam siklus alat berikutnya tergantung tingkat keparahan.
Ini melindungi pengguna dari pengeluaran token yang tak terkendali dan macet, sambil mempertahankan akses alat normal.

- Utamakan peringatan dan supresi sementara terlebih dahulu.
- Eskalasikan hanya ketika bukti berulang terkumpul.

## Catatan

- `tools.loopDetection` digabungkan dengan override tingkat agen.
- Konfigurasi per agen sepenuhnya menimpa atau memperluas nilai global.
- Jika tidak ada konfigurasi, guardrail tetap nonaktif.

## Terkait

- [Persetujuan exec](/id/tools/exec-approvals)
- [Tingkat berpikir](/id/tools/thinking)
- [Sub-agen](/id/tools/subagents)
