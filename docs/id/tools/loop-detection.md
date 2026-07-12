---
read_when:
    - Seorang pengguna melaporkan bahwa agen terus terjebak mengulangi pemanggilan alat
    - Anda perlu menyesuaikan perlindungan terhadap panggilan berulang
    - Anda sedang menyunting kebijakan alat/runtime agen
    - Anda mengalami penghentian `compaction_loop_persisted` setelah percobaan ulang akibat konteks meluap
summary: Cara mengaktifkan dan menyesuaikan pembatas yang mendeteksi perulangan pemanggilan alat secara repetitif
title: Deteksi perulangan alat
x-i18n:
    generated_at: "2026-07-12T14:47:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fccbb81281b6c6921e6dad50d15295c1be3f59c664f2caed900bf3dce14bc40a
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw memiliki dua pagar pengaman yang bekerja sama untuk mencegah pola pemanggilan alat yang berulang,
keduanya dikonfigurasi di bawah `tools.loopDetection`:

1. **Deteksi loop** (`enabled`) - dinonaktifkan secara default. Memantau riwayat
   pemanggilan alat berjalan untuk mendeteksi pola berulang dan percobaan ulang alat yang tidak dikenal.
2. **Pengaman pasca-compaction** (`postCompactionGuard`) - diaktifkan setiap kali
   `enabled` tidak secara eksplisit bernilai `false`. Diaktifkan setelah setiap percobaan ulang compaction dan
   membatalkan proses jika agen mengulangi tripel `(tool, args, result)` yang sama
   dalam jendela tersebut.

Atur `tools.loopDetection.enabled: false` untuk menonaktifkan kedua pagar pengaman.

## Alasan fitur ini tersedia

- Mendeteksi urutan berulang yang tidak menghasilkan kemajuan.
- Mendeteksi loop tanpa hasil berfrekuensi tinggi (alat yang sama, masukan yang sama, galat
  berulang).
- Mendeteksi pola pemanggilan berulang tertentu untuk alat polling yang dikenal.
- Memutus siklus luapan konteks -> compaction -> loop yang sama, alih-alih membiarkannya
  berjalan tanpa batas.

## Blok konfigurasi

Nilai default global, dengan semua bidang yang didokumentasikan ditampilkan:

```json5
{
  tools: {
    loopDetection: {
      enabled: false, // sakelar utama untuk detektor riwayat berjalan
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
        windowSize: 3, // diaktifkan setelah percobaan ulang compaction; berjalan kecuali enabled secara eksplisit bernilai false
      },
    },
  },
}
```

Penimpaan per agen (opsional, di `agents.list[].tools.loopDetection`):

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

Pengaturan per agen menimpa blok global bidang demi bidang (termasuk
`detectors` dan `postCompactionGuard` bertingkat), sehingga agen hanya perlu mengatur
bidang yang ingin diubah.

### Perilaku bidang

| Bidang                           | Default | Efek                                                                                                                                     |
| -------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                        | `false` | Sakelar utama untuk detektor riwayat berjalan. `false` juga menonaktifkan pengaman pasca-compaction.                                      |
| `historySize`                    | `30`    | Jumlah pemanggilan alat terbaru yang disimpan untuk analisis.                                                                             |
| `warningThreshold`               | `10`    | Jumlah pengulangan sebelum pola diklasifikasikan sebagai peringatan saja.                                                                 |
| `criticalThreshold`              | `20`    | Jumlah pengulangan untuk memblokir pola loop tanpa kemajuan. Runtime membatasinya agar berada di atas `warningThreshold` jika salah dikonfigurasi. |
| `unknownToolThreshold`           | `10`    | Memblokir pemanggilan berulang ke alat yang sama dan tidak tersedia setelah kegagalan sebanyak ini. Tidak dikendalikan oleh `detectors`. |
| `globalCircuitBreakerThreshold`  | `30`    | Pemutus tanpa kemajuan global di seluruh detektor. Runtime membatasinya agar berada di atas `criticalThreshold` jika salah dikonfigurasi. Tidak dikendalikan oleh `detectors`. |
| `detectors.genericRepeat`        | `true`  | Memperingatkan pemanggilan alat yang sama + argumen yang sama secara berulang; memblokir setelah pemanggilan tersebut juga menghasilkan keluaran identik. |
| `detectors.knownPollNoProgress`  | `true`  | Mendeteksi pola polling tanpa kemajuan yang dikenal (`process` dengan `action: "poll"`/`"log"`, `command_status`).                        |
| `detectors.pingPong`             | `true`  | Mendeteksi pola ping-pong tanpa kemajuan yang bergantian di antara dua pemanggilan.                                                       |
| `postCompactionGuard.windowSize` | `3`     | Jumlah percobaan pengaman tetap aktif setelah compaction, sekaligus jumlah tripel identik yang membatalkan proses.                        |

Untuk `exec`, hashing tanpa kemajuan membandingkan hasil perintah yang stabil (status,
kode keluar, penanda batas waktu terlampaui, keluaran) dan mengabaikan metadata runtime yang berubah-ubah seperti
durasi, PID, ID sesi, dan direktori kerja. Hasil pengiriman pesan keluar
di-hash dengan menghapus ID yang berubah-ubah pada setiap pemanggilan (ID pesan, ID berkas, stempel waktu),
sehingga hasil "terkirim" tidak tampak identik dengan hasil "terkirim" lainnya.
Saat ID proses tersedia, riwayat dievaluasi hanya dalam proses tersebut,
sehingga siklus Heartbeat terjadwal dan proses baru tidak mewarisi jumlah loop lama
dari proses sebelumnya.

## Penyiapan yang disarankan

- Untuk model yang lebih kecil, atur `enabled: true` dan biarkan ambang pada nilai
  defaultnya. Model unggulan jarang memerlukan deteksi riwayat berjalan dan dapat
  membiarkan sakelar utama bernilai `false` sambil tetap memperoleh manfaat dari
  pengaman pasca-compaction.
- Pertahankan urutan ambang `warningThreshold < criticalThreshold <
globalCircuitBreakerThreshold`; runtime menaikkan `criticalThreshold` dan
  `globalCircuitBreakerThreshold` jika Anda mengaturnya sama dengan atau di bawah
  ambang yang harus dilampauinya.
- Jika terjadi positif palsu:
  - Naikkan `warningThreshold` dan/atau `criticalThreshold`.
  - Secara opsional, naikkan `globalCircuitBreakerThreshold`.
  - Nonaktifkan hanya detektor tertentu yang menyebabkan masalah (`detectors.<name>: false`).
  - Kurangi `historySize` untuk jendela riwayat yang lebih pendek.
- Untuk menonaktifkan semuanya, termasuk pengaman pasca-compaction, atur
  `tools.loopDetection.enabled: false` secara eksplisit.

## Pengaman pasca-compaction

Setelah percobaan ulang compaction akibat luapan konteks, pelaksana mengaktifkan
pengaman berjendela pendek untuk beberapa pemanggilan alat berikutnya. Jika agen menghasilkan tripel
`(toolName, argsHash, resultHash)` yang sama sebanyak `postCompactionGuard.windowSize`
kali dalam jendela tersebut, pengaman menyimpulkan bahwa compaction tidak memutus
loop dan membatalkan proses dengan galat `compaction_loop_persisted`.

Pengaman dikendalikan oleh penanda utama `tools.loopDetection.enabled` dengan satu
pengecualian: pengaman tetap **aktif saat penanda tidak ditetapkan atau bernilai `true`**, dan hanya
dinonaktifkan ketika penanda secara eksplisit bernilai `false`. Hal ini disengaja - pengaman
tersedia untuk keluar dari loop compaction yang jika tidak ditangani akan menghabiskan token tanpa batas,
sehingga pengguna tanpa konfigurasi tetap mendapatkan perlindungan.

```json5
{
  tools: {
    loopDetection: {
      // sakelar utama; atur false untuk menonaktifkan pengaman beserta detektor berjalan
      enabled: true,
      postCompactionGuard: {
        windowSize: 3, // default
      },
    },
  },
}
```

- `windowSize` yang lebih rendah bersifat lebih ketat (lebih sedikit percobaan sebelum pembatalan).
- `windowSize` yang lebih tinggi memberi agen lebih banyak percobaan pemulihan.
- Pengaman tidak pernah membatalkan selama hasil terus berubah; hanya hasil yang identik
  per bita di seluruh jendela yang memicunya.
- Pengaman hanya diaktifkan segera setelah percobaan ulang compaction, bukan pada titik
  lain dalam suatu proses.

<Note>
  Pengaman pasca-compaction berjalan setiap kali penanda utama tidak secara eksplisit bernilai `false`, bahkan jika Anda tidak pernah menulis blok `tools.loopDetection`. Untuk memverifikasinya, cari `post-compaction guard armed for N attempts` dalam log Gateway segera setelah peristiwa compaction.
</Note>

## Log dan perilaku yang diharapkan

Saat loop terdeteksi, OpenClaw mencatat peristiwa loop dan memperingatkan atau memblokir
siklus alat berikutnya berdasarkan tingkat keparahan, sehingga melindungi dari pengeluaran token
tak terkendali dan kebuntuan sambil mempertahankan akses alat normal.

- Peringatan diberikan terlebih dahulu.
- Pemblokiran menyusul setelah pola bertahan melewati ambang peringatan.
- Ambang kritis memblokir siklus alat berikutnya dan menampilkan alasan
  deteksi loop yang jelas dalam catatan proses.
- Pengaman pasca-compaction menghasilkan galat `compaction_loop_persisted` yang menyebutkan
  alat penyebab dan jumlah pemanggilan identik.

## Terkait

<CardGroup cols={2}>
  <Card title="Persetujuan Exec" href="/id/tools/exec-approvals" icon="shield">
    Kebijakan izinkan/tolak untuk eksekusi shell.
  </Card>
  <Card title="Tingkat pemikiran" href="/id/tools/thinking" icon="brain">
    Tingkat upaya penalaran dan interaksi dengan kebijakan penyedia.
  </Card>
  <Card title="Subagen" href="/id/tools/subagents" icon="users">
    Membuat agen terisolasi untuk membatasi perilaku tak terkendali.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/config-tools#toolsloopdetection" icon="gear">
    Skema lengkap `tools.loopDetection` dan semantik penggabungannya.
  </Card>
</CardGroup>
