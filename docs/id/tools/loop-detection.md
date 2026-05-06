---
read_when:
    - Seorang pengguna melaporkan agen terjebak mengulang panggilan alat
    - Anda perlu menyetel perlindungan panggilan berulang
    - Anda sedang mengedit kebijakan alat/runtime agen
    - Anda mengalami pembatalan `compaction_loop_persisted` setelah percobaan ulang akibat kelebihan konteks
summary: Cara mengaktifkan dan menyesuaikan pengaman yang mendeteksi perulangan pemanggilan alat yang repetitif
title: Deteksi loop alat
x-i18n:
    generated_at: "2026-05-06T09:31:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 48773b2af3ba38db48f14c65e9f359c80b2503bd29c8e3edfaca2e4ced7e1713
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw memiliki dua guardrail yang bekerja sama untuk pola panggilan alat yang berulang:

1. **Deteksi loop** (`tools.loopDetection.enabled`) — dinonaktifkan secara default. Memantau riwayat panggilan alat berjalan untuk pola berulang dan percobaan ulang alat yang tidak dikenal.
2. **Pengaman pasca-Compaction** (`tools.loopDetection.postCompactionGuard`) — diaktifkan secara default kecuali `tools.loopDetection.enabled` secara eksplisit bernilai `false`. Aktif setelah setiap percobaan ulang Compaction dan membatalkan run ketika agen mengeluarkan triple `(tool, args, result)` yang sama dalam jendela tersebut.

Keduanya dikonfigurasi di bawah blok `tools.loopDetection` yang sama, tetapi pengaman pasca-Compaction berjalan setiap kali sakelar utama tidak dimatikan secara eksplisit. Tetapkan `tools.loopDetection.enabled: false` untuk menonaktifkan kedua permukaan.

## Mengapa ini ada

- Mendeteksi urutan berulang yang tidak membuat kemajuan.
- Mendeteksi loop tanpa hasil berfrekuensi tinggi (alat yang sama, input yang sama, error berulang).
- Mendeteksi pola panggilan berulang tertentu untuk alat polling yang dikenal.
- Mencegah siklus context-overflow lalu Compaction lalu loop yang sama berjalan tanpa batas.

## Blok konfigurasi

Default global, dengan setiap bidang terdokumentasi ditampilkan:

```json5
{
  tools: {
    loopDetection: {
      enabled: false, // master switch for the rolling-history detectors
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      unknownToolThreshold: 10,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
      postCompactionGuard: {
        windowSize: 3, // armed after compaction-retry; runs unless enabled is explicitly false
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

| Bidang                           | Default | Efek                                                                                                                           |
| -------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `enabled`                        | `false` | Sakelar utama untuk detektor riwayat berjalan. Menetapkan `false` juga menonaktifkan pengaman pasca-Compaction.               |
| `historySize`                    | `30`    | Jumlah panggilan alat terbaru yang disimpan untuk analisis.                                                                    |
| `warningThreshold`               | `10`    | Ambang sebelum pola diklasifikasikan sebagai hanya peringatan.                                                                 |
| `criticalThreshold`              | `20`    | Ambang untuk memblokir pola loop berulang.                                                                                     |
| `unknownToolThreshold`           | `10`    | Blokir panggilan berulang ke alat yang sama yang tidak tersedia setelah jumlah kegagalan ini.                                  |
| `globalCircuitBreakerThreshold`  | `30`    | Ambang pemutus tanpa kemajuan global di semua detektor.                                                                        |
| `detectors.genericRepeat`        | `true`  | Mendeteksi pola alat yang sama + parameter yang sama secara berulang.                                                          |
| `detectors.knownPollNoProgress`  | `true`  | Mendeteksi pola mirip polling yang dikenal tanpa perubahan status.                                                             |
| `detectors.pingPong`             | `true`  | Mendeteksi pola ping-pong bergantian.                                                                                          |
| `postCompactionGuard.windowSize` | `3`     | Jumlah panggilan alat pasca-Compaction saat pengaman tetap aktif dan jumlah triple identik yang membatalkan run.               |

Untuk `exec`, pemeriksaan tanpa kemajuan membandingkan hasil perintah yang stabil dan mengabaikan metadata runtime yang volatil seperti durasi, PID, ID sesi, dan direktori kerja. Ketika ID run tersedia, riwayat panggilan alat terbaru dievaluasi hanya dalam run tersebut sehingga siklus Heartbeat terjadwal dan run baru tidak mewarisi hitungan loop usang dari run sebelumnya.

## Penyiapan yang direkomendasikan

- Untuk model yang lebih kecil, tetapkan `enabled: true` dan biarkan ambang pada defaultnya. Model unggulan jarang membutuhkan deteksi riwayat berjalan dan dapat membiarkan sakelar utama pada `false` sambil tetap mendapat manfaat dari pengaman pasca-Compaction.
- Pertahankan urutan ambang sebagai `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`.
- Jika positif palsu terjadi:
  - Naikkan `warningThreshold` dan/atau `criticalThreshold`.
  - Opsional, naikkan `globalCircuitBreakerThreshold`.
  - Nonaktifkan hanya detektor spesifik yang menyebabkan masalah (`detectors.<name>: false`).
  - Kurangi `historySize` untuk konteks historis yang tidak terlalu ketat.
- Untuk menonaktifkan semuanya (termasuk pengaman pasca-Compaction), tetapkan `tools.loopDetection.enabled: false` secara eksplisit.

## Pengaman pasca-Compaction

Ketika runner menyelesaikan percobaan ulang Compaction setelah context-overflow, runner mengaktifkan pengaman berjendela pendek yang memantau beberapa panggilan alat berikutnya. Jika agen mengeluarkan triple `(toolName, argsHash, resultHash)` yang sama beberapa kali dalam jendela tersebut, pengaman menyimpulkan bahwa Compaction tidak memutus loop dan membatalkan run dengan error `compaction_loop_persisted`.

Pengaman dikendalikan oleh flag utama `tools.loopDetection.enabled` dengan satu perbedaan: pengaman tetap **aktif ketika flag tidak ditetapkan atau bernilai `true`** dan hanya nonaktif ketika flag secara eksplisit bernilai `false`. Ini disengaja. Pengaman ada untuk keluar dari loop Compaction yang jika tidak akan menghabiskan token tanpa batas, sehingga pengguna tanpa konfigurasi tetap mendapatkan perlindungan.

```json5
{
  tools: {
    loopDetection: {
      // master switch; set false to disable the guard along with the rolling detectors
      enabled: true,
      postCompactionGuard: {
        windowSize: 3, // default
      },
    },
  },
}
```

- `windowSize` yang lebih rendah lebih ketat (lebih sedikit upaya sebelum batal).
- `windowSize` yang lebih tinggi memberi agen lebih banyak upaya pemulihan.
- Pengaman tidak pernah membatalkan ketika hasil berubah, hanya ketika hasil identik byte di seluruh jendela.
- Pengaman sengaja dibuat sempit: hanya aktif segera setelah percobaan ulang Compaction.

<Note>
  Pengaman pasca-Compaction berjalan setiap kali flag utama tidak secara eksplisit bernilai `false`, bahkan jika Anda tidak pernah menulis blok `tools.loopDetection`. Untuk memverifikasi, cari `post-compaction guard armed for N attempts` di log Gateway segera setelah peristiwa Compaction.
</Note>

## Log dan perilaku yang diharapkan

Ketika loop terdeteksi, OpenClaw melaporkan peristiwa loop dan menahan atau memblokir siklus alat berikutnya bergantung pada tingkat keparahan. Ini melindungi pengguna dari pengeluaran token yang tidak terkendali dan kebuntuan sambil mempertahankan akses alat normal.

- Peringatan muncul terlebih dahulu.
- Supresi mengikuti ketika pola tetap berlanjut melewati ambang peringatan.
- Ambang kritis memblokir siklus alat berikutnya dan menampilkan alasan deteksi loop yang jelas dalam catatan run.
- Pengaman pasca-Compaction mengeluarkan error `compaction_loop_persisted` dengan nama alat yang melanggar dan jumlah panggilan identik.

## Terkait

<CardGroup cols={2}>
  <Card title="Exec approvals" href="/id/tools/exec-approvals" icon="shield">
    Kebijakan izinkan/tolak untuk eksekusi shell.
  </Card>
  <Card title="Thinking levels" href="/id/tools/thinking" icon="brain">
    Tingkat upaya penalaran dan interaksi kebijakan provider.
  </Card>
  <Card title="Sub-agents" href="/id/tools/subagents" icon="users">
    Menjalankan agen terisolasi untuk membatasi perilaku yang tidak terkendali.
  </Card>
  <Card title="Configuration reference" href="/id/gateway/configuration-reference" icon="gear">
    Skema `tools.loopDetection` lengkap dan semantik penggabungan.
  </Card>
</CardGroup>
