---
read_when:
    - Seorang pengguna melaporkan agen terjebak mengulangi pemanggilan alat
    - Anda perlu menyesuaikan perlindungan panggilan berulang
    - Anda sedang mengedit kebijakan alat/lingkungan eksekusi agen
summary: Cara mengaktifkan dan menyesuaikan pagar pengaman yang mendeteksi perulangan panggilan alat yang repetitif
title: Deteksi loop alat
x-i18n:
    generated_at: "2026-04-30T10:16:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: ba601384e7d23ddfd316f9e5eef92b3daa4618d2287228a516c76fe141700a28
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

Override per-agen (opsional):

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
- `warningThreshold`: ambang sebelum mengklasifikasikan pola sebagai peringatan saja.
- `criticalThreshold`: ambang untuk memblokir pola loop yang berulang.
- `globalCircuitBreakerThreshold`: ambang pemutus global untuk kondisi tanpa kemajuan.
- `detectors.genericRepeat`: mendeteksi pola alat yang sama + parameter yang sama secara berulang.
- `detectors.knownPollNoProgress`: mendeteksi pola mirip polling yang dikenal tanpa perubahan status.
- `detectors.pingPong`: mendeteksi pola ping-pong bergantian.

Untuk `exec`, pemeriksaan tanpa kemajuan membandingkan hasil perintah yang stabil dan mengabaikan metadata runtime yang berubah-ubah seperti durasi, PID, ID sesi, dan direktori kerja.
Saat ID run tersedia, riwayat panggilan alat terbaru dievaluasi hanya dalam run tersebut sehingga siklus Heartbeat terjadwal dan run baru tidak mewarisi hitungan loop lama dari run sebelumnya.

## Penyiapan yang direkomendasikan

- Mulai dengan `enabled: true`, default tidak berubah.
- Jaga urutan ambang sebagai `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`.
- Jika terjadi positif palsu:
  - naikkan `warningThreshold` dan/atau `criticalThreshold`
  - (opsional) naikkan `globalCircuitBreakerThreshold`
  - nonaktifkan hanya detektor yang menyebabkan masalah
  - kurangi `historySize` untuk konteks historis yang tidak terlalu ketat

## Log dan perilaku yang diharapkan

Saat loop terdeteksi, OpenClaw melaporkan peristiwa loop dan memblokir atau meredam siklus alat berikutnya tergantung tingkat keparahan.
Ini melindungi pengguna dari pemborosan token yang tidak terkendali dan kebuntuan sekaligus mempertahankan akses alat normal.

- Utamakan peringatan dan supresi sementara terlebih dahulu.
- Eskalasikan hanya saat bukti berulang terkumpul.

## Catatan

- `tools.loopDetection` digabungkan dengan override tingkat agen.
- Konfigurasi per-agen sepenuhnya menggantikan atau memperluas nilai global.
- Jika tidak ada konfigurasi, guardrail tetap nonaktif.

## Terkait

- [Persetujuan exec](/id/tools/exec-approvals)
- [Tingkat berpikir](/id/tools/thinking)
- [Sub-agen](/id/tools/subagents)
