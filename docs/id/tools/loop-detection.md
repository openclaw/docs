---
read_when:
    - Seorang pengguna melaporkan agen tersangkut mengulangi panggilan alat
    - Anda perlu menyesuaikan perlindungan panggilan berulang
    - Anda sedang mengedit kebijakan alat/waktu jalan agen
summary: Cara mengaktifkan dan menyesuaikan pagar pengaman yang mendeteksi loop panggilan alat yang berulang
title: Deteksi loop alat
x-i18n:
    generated_at: "2026-05-05T01:49:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9221e1716d3f4c2814a4705b160253839510cd6d11fe4ccd598c67958851afb
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw dapat mencegah agen terjebak dalam pola panggilan alat yang berulang.
Guard ini **dinonaktifkan secara bawaan**.

Aktifkan hanya jika diperlukan, karena pengaturan yang ketat dapat memblokir panggilan berulang yang sah.

## Mengapa ini ada

- Mendeteksi urutan berulang yang tidak menghasilkan progres.
- Mendeteksi loop tanpa hasil berfrekuensi tinggi (alat yang sama, input yang sama, error berulang).
- Mendeteksi pola panggilan berulang tertentu untuk alat polling yang diketahui.

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

### Perilaku bidang

- `enabled`: Sakelar utama. `false` berarti tidak ada deteksi loop yang dijalankan.
- `historySize`: jumlah panggilan alat terbaru yang disimpan untuk analisis.
- `warningThreshold`: ambang sebelum mengklasifikasikan pola sebagai peringatan saja.
- `criticalThreshold`: ambang untuk memblokir pola loop berulang.
- `globalCircuitBreakerThreshold`: ambang pemutus global tanpa progres.
- `detectors.genericRepeat`: mendeteksi pola alat yang sama + parameter yang sama secara berulang.
- `detectors.knownPollNoProgress`: mendeteksi pola mirip polling yang diketahui tanpa perubahan status.
- `detectors.pingPong`: mendeteksi pola ping-pong bergantian.

Untuk `exec`, pemeriksaan tanpa progres membandingkan hasil perintah yang stabil dan mengabaikan metadata runtime yang berubah-ubah seperti durasi, PID, ID sesi, dan direktori kerja.
Saat id run tersedia, riwayat panggilan alat terbaru dievaluasi hanya dalam run tersebut sehingga siklus Heartbeat terjadwal dan run baru tidak mewarisi hitungan loop usang dari run sebelumnya.

## Penyiapan yang disarankan

- Untuk model yang lebih kecil, mulai dengan `enabled: true`, default tidak diubah. Model unggulan jarang memerlukan deteksi loop dan dapat membiarkannya dinonaktifkan.
- Pertahankan urutan ambang sebagai `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`.
- Jika terjadi positif palsu:
  - naikkan `warningThreshold` dan/atau `criticalThreshold`
  - (opsional) naikkan `globalCircuitBreakerThreshold`
  - nonaktifkan hanya detektor yang menyebabkan masalah
  - kurangi `historySize` untuk konteks historis yang tidak terlalu ketat

## Guard pasca-Compaction

Saat pelaksana menyelesaikan percobaan ulang Compaction otomatis (setelah context-overflow), guard jendela pendek diaktifkan untuk memantau beberapa panggilan alat berikutnya. Jika agen mengeluarkan triple `(toolName, args, result)` yang _sama_ beberapa kali dalam jendela tersebut, guard menyimpulkan bahwa Compaction tidak memutus loop dan membatalkan run dengan error `compaction_loop_persisted`.

Ini adalah jalur kode terpisah dari detektor `tools.loopDetection` global. Ini dapat dikonfigurasi secara independen:

```json5
{
  tools: {
    loopDetection: {
      enabled: true, // existing master switch; set false to disable loop guards
      postCompactionGuard: {
        windowSize: 3, // default: 3
      },
    },
  },
}
```

- `windowSize`: jumlah panggilan alat pasca-Compaction selama guard tetap aktif _dan_ jumlah triple (alat, argumen, hasil) identik yang memicu pembatalan.

Guard tidak pernah membatalkan saat hasil berubah, hanya saat hasil identik byte demi byte di seluruh jendela. Ini sengaja dibuat sempit: hanya terpicu segera setelah percobaan ulang Compaction.

## Log dan perilaku yang diharapkan

Saat loop terdeteksi, OpenClaw melaporkan peristiwa loop dan memblokir atau meredam siklus alat berikutnya bergantung pada tingkat keparahan.
Ini melindungi pengguna dari pemborosan token yang tidak terkendali dan kebuntuan sambil tetap mempertahankan akses alat normal.

- Utamakan peringatan dan penekanan sementara terlebih dahulu.
- Eskalasikan hanya ketika bukti berulang terkumpul.

## Catatan

- `tools.loopDetection` digabungkan dengan override tingkat agen.
- Konfigurasi per agen sepenuhnya menimpa atau memperluas nilai global.
- Jika tidak ada konfigurasi, guardrail tetap nonaktif.

## Terkait

- [Persetujuan exec](/id/tools/exec-approvals)
- [Tingkat berpikir](/id/tools/thinking)
- [Sub-agen](/id/tools/subagents)
