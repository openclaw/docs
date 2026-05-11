---
read_when:
    - Seorang pengguna melaporkan agen terjebak mengulangi pemanggilan alat
    - Anda perlu menyesuaikan perlindungan panggilan berulang
    - Anda sedang mengedit kebijakan alat/waktu eksekusi agen
    - Anda mengalami `compaction_loop_persisted` pembatalan setelah percobaan ulang akibat luapan konteks
summary: Cara mengaktifkan dan menyesuaikan pembatas keamanan yang mendeteksi loop panggilan alat yang berulang
title: Deteksi perulangan alat
x-i18n:
    generated_at: "2026-05-11T20:37:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: cc261bebc0e3138a98ea8be166edbaf4e133c8f582429c5380fe2954196a6fc5
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw memiliki dua guardrail yang bekerja sama untuk pola pemanggilan alat yang berulang:

1. **Deteksi loop** (`tools.loopDetection.enabled`) — dinonaktifkan secara default. Memantau riwayat pemanggilan alat bergulir untuk pola berulang dan percobaan ulang alat yang tidak dikenal.
2. **Pelindung pasca-Compaction** (`tools.loopDetection.postCompactionGuard`) — diaktifkan secara default kecuali `tools.loopDetection.enabled` secara eksplisit bernilai `false`. Aktif setelah setiap percobaan ulang Compaction dan membatalkan run ketika agen mengeluarkan triple `(tool, args, result)` yang sama dalam jendela tersebut.

Keduanya dikonfigurasi di bawah blok `tools.loopDetection` yang sama, tetapi pelindung pasca-Compaction berjalan setiap kali sakelar utama tidak secara eksplisit dimatikan. Atur `tools.loopDetection.enabled: false` untuk menonaktifkan kedua permukaan tersebut.

## Mengapa ini ada

- Mendeteksi rangkaian berulang yang tidak membuat kemajuan.
- Mendeteksi loop tanpa hasil berfrekuensi tinggi (alat yang sama, input yang sama, error berulang).
- Mendeteksi pola panggilan berulang tertentu untuk alat polling yang dikenal.
- Mencegah siklus konteks meluap lalu Compaction lalu loop yang sama berjalan tanpa batas.

## Blok konfigurasi

Default global, dengan setiap field terdokumentasi ditampilkan:

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

### Perilaku field

| Field                            | Default | Efek                                                                                                                          |
| -------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                        | `false` | Sakelar utama untuk detektor riwayat bergulir. Mengatur `false` juga menonaktifkan pelindung pasca-Compaction.                       |
| `historySize`                    | `30`    | Jumlah pemanggilan alat terbaru yang disimpan untuk analisis.                                                                                  |
| `warningThreshold`               | `10`    | Ambang sebelum sebuah pola diklasifikasikan sebagai hanya peringatan.                                                                       |
| `criticalThreshold`              | `20`    | Ambang untuk memblokir pola loop berulang tanpa kemajuan.                                                                    |
| `unknownToolThreshold`           | `10`    | Blokir panggilan berulang ke alat yang sama yang tidak tersedia setelah kegagalan sebanyak ini.                                                       |
| `globalCircuitBreakerThreshold`  | `30`    | Ambang pemutus global tanpa kemajuan di semua detektor.                                                                      |
| `detectors.genericRepeat`        | `true`  | Memperingatkan pada pola alat yang sama + parameter yang sama secara berulang dan memblokir ketika panggilan yang sama juga mengembalikan hasil yang identik.               |
| `detectors.knownPollNoProgress`  | `true`  | Mendeteksi pola mirip polling yang dikenal tanpa perubahan status.                                                                       |
| `detectors.pingPong`             | `true`  | Mendeteksi pola ping-pong bergantian.                                                                                         |
| `postCompactionGuard.windowSize` | `3`     | Jumlah pemanggilan alat pasca-Compaction saat pelindung tetap aktif dan jumlah triple identik yang membatalkan run. |

Untuk `exec`, pemeriksaan tanpa kemajuan membandingkan hasil perintah yang stabil dan mengabaikan metadata runtime yang mudah berubah seperti durasi, PID, ID sesi, dan direktori kerja. Ketika ID run tersedia, riwayat pemanggilan alat terbaru dievaluasi hanya dalam run tersebut sehingga siklus Heartbeat terjadwal dan run baru tidak mewarisi hitungan loop basi dari run sebelumnya.

## Penyiapan yang direkomendasikan

- Untuk model yang lebih kecil, atur `enabled: true` dan biarkan ambang pada defaultnya. Model unggulan jarang memerlukan deteksi riwayat bergulir dan dapat membiarkan sakelar utama bernilai `false` sambil tetap mendapatkan manfaat dari pelindung pasca-Compaction.
- Jaga urutan ambang sebagai `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`.
- Jika positif palsu terjadi:
  - Naikkan `warningThreshold` dan/atau `criticalThreshold`.
  - Secara opsional naikkan `globalCircuitBreakerThreshold`.
  - Nonaktifkan hanya detektor tertentu yang menyebabkan masalah (`detectors.<name>: false`).
  - Kurangi `historySize` untuk konteks historis yang kurang ketat.
- Untuk menonaktifkan semuanya (termasuk pelindung pasca-Compaction), atur `tools.loopDetection.enabled: false` secara eksplisit.

## Pelindung pasca-Compaction

Ketika runner menyelesaikan percobaan ulang Compaction setelah konteks meluap, runner mengaktifkan pelindung berjendela pendek yang memantau beberapa pemanggilan alat berikutnya. Jika agen mengeluarkan triple `(toolName, argsHash, resultHash)` yang sama beberapa kali dalam jendela tersebut, pelindung menyimpulkan bahwa Compaction tidak memutus loop dan membatalkan run dengan error `compaction_loop_persisted`.

Pelindung dikendalikan oleh flag utama `tools.loopDetection.enabled` dengan satu pengecualian: pelindung tetap **aktif ketika flag tidak diatur atau bernilai `true`** dan hanya dinonaktifkan ketika flag secara eksplisit bernilai `false`. Ini disengaja. Pelindung ada untuk keluar dari loop Compaction yang jika tidak demikian akan menghabiskan token tanpa batas, sehingga pengguna tanpa konfigurasi tetap mendapatkan perlindungan.

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

- `windowSize` yang lebih rendah lebih ketat (lebih sedikit percobaan sebelum batal).
- `windowSize` yang lebih tinggi memberi agen lebih banyak percobaan pemulihan.
- Pelindung tidak pernah membatalkan ketika hasil berubah, hanya ketika hasil identik byte demi byte di seluruh jendela.
- Pelindung sengaja dibuat sempit: hanya terpicu segera setelah percobaan ulang Compaction.

<Note>
  Pelindung pasca-Compaction berjalan setiap kali flag utama tidak secara eksplisit bernilai `false`, bahkan jika Anda tidak pernah menulis blok `tools.loopDetection`. Untuk memverifikasi, cari `post-compaction guard armed for N attempts` di log Gateway segera setelah peristiwa Compaction.
</Note>

## Log dan perilaku yang diharapkan

Ketika loop terdeteksi, OpenClaw melaporkan peristiwa loop dan menahan atau memblokir siklus alat berikutnya tergantung tingkat keparahannya. Ini melindungi pengguna dari pemborosan token yang tidak terkendali dan macet sambil mempertahankan akses alat normal.

- Peringatan muncul terlebih dahulu.
- Supresi mengikuti ketika pola tetap berlanjut melewati ambang peringatan.
- Ambang kritis memblokir siklus alat berikutnya dan menampilkan alasan deteksi loop yang jelas dalam catatan run.
- Pelindung pasca-Compaction mengeluarkan error `compaction_loop_persisted` dengan nama alat yang bermasalah dan jumlah panggilan identik.

## Terkait

<CardGroup cols={2}>
  <Card title="Persetujuan exec" href="/id/tools/exec-approvals" icon="shield">
    Kebijakan izinkan/tolak untuk eksekusi shell.
  </Card>
  <Card title="Tingkat berpikir" href="/id/tools/thinking" icon="brain">
    Tingkat upaya penalaran dan interaksi kebijakan provider.
  </Card>
  <Card title="Sub-agen" href="/id/tools/subagents" icon="users">
    Menjalankan agen terisolasi untuk membatasi perilaku yang tidak terkendali.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/configuration-reference" icon="gear">
    Skema lengkap `tools.loopDetection` dan semantik penggabungan.
  </Card>
</CardGroup>
