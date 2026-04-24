---
read_when:
    - Seorang pengguna melaporkan agen terjebak mengulang tool call
    - Anda perlu menyetel perlindungan panggilan berulang
    - Anda sedang mengedit kebijakan alat/runtime agen
summary: Cara mengaktifkan dan menyetel guardrail yang mendeteksi loop tool-call berulang
title: Deteksi loop alat
x-i18n:
    generated_at: "2026-04-24T09:31:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0f5824d511ec33eb1f46c77250cb779b5e3bd5b3e5f16fab9e6c0b67297f87df
    source_path: tools/loop-detection.md
    workflow: 15
---

OpenClaw dapat mencegah agen terjebak dalam pola tool-call yang berulang.
Guard ini **nonaktif secara default**.

Aktifkan hanya jika diperlukan, karena dengan pengaturan ketat guard ini dapat memblokir panggilan berulang yang sah.

## Mengapa ini ada

- Mendeteksi urutan berulang yang tidak membuat kemajuan.
- Mendeteksi loop frekuensi tinggi tanpa hasil (alat yang sama, input yang sama, error berulang).
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
- `historySize`: jumlah tool call terbaru yang disimpan untuk analisis.
- `warningThreshold`: ambang sebelum sebuah pola diklasifikasikan sebagai hanya peringatan.
- `criticalThreshold`: ambang untuk memblokir pola loop berulang.
- `globalCircuitBreakerThreshold`: ambang breaker global untuk kondisi tanpa kemajuan.
- `detectors.genericRepeat`: mendeteksi pola alat yang sama + parameter yang sama berulang.
- `detectors.knownPollNoProgress`: mendeteksi pola mirip polling yang dikenal tanpa perubahan state.
- `detectors.pingPong`: mendeteksi pola bolak-balik ping-pong.

## Penyiapan yang disarankan

- Mulai dengan `enabled: true`, default lainnya tidak berubah.
- Jaga urutan ambang sebagai `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`.
- Jika terjadi false positive:
  - naikkan `warningThreshold` dan/atau `criticalThreshold`
  - (opsional) naikkan `globalCircuitBreakerThreshold`
  - nonaktifkan hanya detector yang menyebabkan masalah
  - kurangi `historySize` untuk konteks historis yang kurang ketat

## Log dan perilaku yang diharapkan

Saat loop terdeteksi, OpenClaw melaporkan event loop dan memblokir atau meredam siklus alat berikutnya tergantung tingkat keparahannya.
Ini melindungi pengguna dari pemborosan token yang tak terkendali dan lockup sambil tetap mempertahankan akses alat normal.

- Utamakan peringatan dan penekanan sementara terlebih dahulu.
- Eskalasi hanya saat bukti berulang terus bertambah.

## Catatan

- `tools.loopDetection` digabungkan dengan override tingkat agen.
- Konfigurasi per agen sepenuhnya meng-override atau memperluas nilai global.
- Jika tidak ada konfigurasi, guardrail tetap nonaktif.

## Terkait

- [Persetujuan exec](/id/tools/exec-approvals)
- [Tingkat thinking](/id/tools/thinking)
- [Sub-agen](/id/tools/subagents)
