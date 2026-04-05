---
read_when:
    - Seorang pengguna melaporkan agent terjebak mengulangi panggilan tool
    - Anda perlu menyesuaikan perlindungan panggilan berulang
    - Anda sedang mengedit kebijakan tool/runtime agent
summary: Cara mengaktifkan dan menyesuaikan guardrail yang mendeteksi loop panggilan tool berulang
title: Deteksi loop tool
x-i18n:
    generated_at: "2026-04-05T14:08:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc3c92579b24cfbedd02a286b735d99a259b720f6d9719a9b93902c9fc66137d
    source_path: tools/loop-detection.md
    workflow: 15
---

# Deteksi loop tool

OpenClaw dapat mencegah agent terjebak dalam pola panggilan tool yang berulang.
Guard ini **dinonaktifkan secara default**.

Aktifkan hanya bila diperlukan, karena dengan pengaturan ketat guard ini dapat memblokir panggilan berulang yang sah.

## Mengapa ini ada

- Mendeteksi urutan berulang yang tidak menunjukkan kemajuan.
- Mendeteksi loop frekuensi tinggi tanpa hasil (tool yang sama, input yang sama, error berulang).
- Mendeteksi pola panggilan berulang tertentu untuk tool polling yang sudah dikenal.

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

Override per-agent (opsional):

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
- `historySize`: jumlah panggilan tool terbaru yang disimpan untuk analisis.
- `warningThreshold`: ambang sebelum pola diklasifikasikan sebagai hanya peringatan.
- `criticalThreshold`: ambang untuk memblokir pola loop berulang.
- `globalCircuitBreakerThreshold`: ambang pemutus sirkuit global untuk kondisi tanpa kemajuan.
- `detectors.genericRepeat`: mendeteksi pola tool yang sama + parameter yang sama yang berulang.
- `detectors.knownPollNoProgress`: mendeteksi pola mirip polling yang sudah dikenal tanpa perubahan status.
- `detectors.pingPong`: mendeteksi pola ping-pong bergantian.

## Pengaturan yang direkomendasikan

- Mulai dengan `enabled: true`, default lainnya tidak diubah.
- Pertahankan urutan ambang sebagai `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`.
- Jika terjadi false positive:
  - naikkan `warningThreshold` dan/atau `criticalThreshold`
  - (opsional) naikkan `globalCircuitBreakerThreshold`
  - nonaktifkan hanya detector yang menyebabkan masalah
  - kurangi `historySize` untuk konteks historis yang tidak terlalu ketat

## Log dan perilaku yang diharapkan

Saat loop terdeteksi, OpenClaw melaporkan peristiwa loop dan memblokir atau meredam siklus tool berikutnya tergantung tingkat keparahannya.
Ini melindungi pengguna dari pengeluaran token yang tidak terkendali dan hang sambil tetap mempertahankan akses tool normal.

- Utamakan peringatan dan penekanan sementara terlebih dahulu.
- Eskalasi hanya ketika bukti berulang terus bertambah.

## Catatan

- `tools.loopDetection` digabungkan dengan override tingkat agent.
- Config per-agent sepenuhnya menimpa atau memperluas nilai global.
- Jika tidak ada config, guardrail tetap nonaktif.
