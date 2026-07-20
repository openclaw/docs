---
read_when:
    - Seorang pengguna melaporkan bahwa agen terjebak mengulangi pemanggilan alat
    - Anda perlu mengendalikan perlindungan terhadap panggilan berulang
    - Anda sedang mengedit kebijakan alat/runtime agen
    - Anda mengalami pembatalan `compaction_loop_persisted` setelah percobaan ulang akibat luapan konteks
summary: Cara mengaktifkan mekanisme pengaman yang mendeteksi perulangan pemanggilan alat secara repetitif
title: Deteksi perulangan alat
x-i18n:
    generated_at: "2026-07-20T04:02:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e03691eaa2148b2843003d8a6d04f21b6552a8d058b95df8cfa95938a3922c56
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw memiliki dua pagar pengaman yang bekerja sama untuk mencegah pola pemanggilan alat berulang,
keduanya dikonfigurasi di bawah `tools.loopDetection`:

1. **Deteksi loop** (`enabled`) - dinonaktifkan secara default. Memantau riwayat
   pemanggilan alat bergulir untuk mendeteksi pola berulang dan percobaan ulang alat yang tidak dikenal.
2. **Pengaman pasca-compaction** - diaktifkan setiap kali
   `enabled` tidak ditetapkan secara eksplisit ke `false`. Diaktifkan setelah setiap percobaan ulang compaction dan
   membatalkan proses jika agen mengulangi tiga serangkai `(tool, args, result)` yang sama
   dalam jendela tersebut.

Tetapkan `tools.loopDetection.enabled: false` untuk menonaktifkan kedua pagar pengaman.

## Alasan fitur ini tersedia

- Mendeteksi urutan berulang yang tidak menghasilkan kemajuan.
- Mendeteksi loop tanpa hasil berfrekuensi tinggi (alat yang sama, input yang sama, kesalahan
  berulang).
- Mendeteksi pola pemanggilan berulang tertentu untuk alat polling yang dikenal.
- Memutus siklus luapan konteks -> compaction -> loop yang sama, alih-alih membiarkannya
  berjalan tanpa batas.

## Blok konfigurasi

Pengaturan global:

```json5
{
  tools: {
    loopDetection: {
      enabled: false, // sakelar utama untuk detektor riwayat bergulir
    },
  },
}
```

Penggantian per agen (opsional, di `agents.list[].tools.loopDetection`):

```json5
{
  agents: {
    list: [
      {
        id: "safe-runner",
        tools: {
          loopDetection: {
            enabled: true,
          },
        },
      },
    ],
  },
}
```

Pengaturan per agen menggantikan pengaturan global.

### Perilaku bidang

| Bidang     | Default | Efek                                                                                            |
| --------- | ------- | ------------------------------------------------------------------------------------------------- |
| `enabled` | `false` | Sakelar utama untuk detektor riwayat bergulir. `false` juga menonaktifkan pengaman pasca-compaction. |

Untuk `exec`, hashing tanpa kemajuan membandingkan hasil perintah yang stabil (status,
kode keluar, tanda batas waktu terlampaui, output) dan mengabaikan metadata runtime yang berubah-ubah seperti
durasi, PID, ID sesi, dan direktori kerja. Hasil pengiriman pesan keluar
di-hash setelah ID per pemanggilan yang berubah-ubah (ID pesan, ID file, stempel waktu)
dihapus, sehingga hasil "terkirim" tidak terlihat identik dengan hasil "terkirim"
yang berbeda. Ketika ID proses tersedia, riwayat hanya dievaluasi dalam proses tersebut,
sehingga siklus Heartbeat terjadwal dan proses baru tidak mewarisi jumlah loop usang
dari proses sebelumnya.

## Penyiapan yang disarankan

- Untuk model yang lebih kecil, tetapkan `enabled: true`. Model unggulan jarang memerlukan deteksi riwayat bergulir dan dapat
  membiarkan sakelar utama `false` sambil tetap memperoleh manfaat dari
  pengaman pasca-compaction.
- Untuk menonaktifkan semuanya, termasuk pengaman pasca-compaction, tetapkan
  `tools.loopDetection.enabled: false` secara eksplisit.

## Pengaman pasca-compaction

Setelah percobaan ulang compaction yang mengikuti luapan konteks, runner mengaktifkan
pengaman berjendela pendek pada beberapa pemanggilan alat berikutnya. Jika agen menghasilkan
tiga serangkai `(toolName, argsHash, resultHash)` yang sama cukup banyak kali dalam jendela tersebut, pengaman menyimpulkan bahwa compaction tidak memutus
loop dan membatalkan proses dengan kesalahan `compaction_loop_persisted`.

Pengaman dikendalikan oleh tanda utama `tools.loopDetection.enabled` dengan satu
pengecualian: pengaman tetap **diaktifkan ketika tanda tidak ditetapkan atau `true`**, dan hanya
dinonaktifkan ketika tanda secara eksplisit bernilai `false`. Hal ini disengaja - pengaman
tersedia untuk keluar dari loop compaction yang jika tidak ditangani akan menghabiskan token tanpa batas,
sehingga pengguna tanpa konfigurasi tetap mendapatkan perlindungan.

```json5
{
  tools: {
    loopDetection: {
      // sakelar utama; tetapkan false untuk menonaktifkan pengaman beserta detektor bergulir
      enabled: true,
    },
  },
}
```

- Pengaman tidak pernah membatalkan proses selama hasil masih berubah; hanya hasil yang
  identik byte demi byte di seluruh jendela yang memicunya.
- Pengaman hanya diaktifkan segera setelah percobaan ulang compaction, bukan pada titik lain
  dalam suatu proses.

<Note>
  Pengaman pasca-compaction berjalan setiap kali tanda utama tidak ditetapkan secara eksplisit ke `false`, meskipun Anda tidak pernah menulis blok `tools.loopDetection`. Untuk memverifikasinya, cari `post-compaction guard armed for N attempts` dalam log Gateway segera setelah peristiwa compaction.
</Note>

## Log dan perilaku yang diharapkan

Ketika loop terdeteksi, OpenClaw mencatat peristiwa loop dan memberikan peringatan atau memblokir
siklus alat berikutnya bergantung pada tingkat keparahannya, sehingga melindungi dari penggunaan token
tak terkendali dan kebuntuan sekaligus mempertahankan akses alat normal.

- Peringatan diberikan terlebih dahulu.
- Pemblokiran dilakukan setelah pola berlanjut melewati ambang peringatan.
- Ambang kritis memblokir siklus alat berikutnya dan menampilkan alasan
  deteksi loop yang jelas dalam catatan proses.
- Pengaman pasca-compaction menghasilkan kesalahan `compaction_loop_persisted` yang menyebutkan
  alat penyebab dan jumlah pemanggilan identik.

## Terkait

<CardGroup cols={2}>
  <Card title="Persetujuan eksekusi" href="/id/tools/exec-approvals" icon="shield">
    Kebijakan izinkan/tolak untuk eksekusi shell.
  </Card>
  <Card title="Tingkat pemikiran" href="/id/tools/thinking" icon="brain">
    Tingkat upaya penalaran dan interaksi dengan kebijakan penyedia.
  </Card>
  <Card title="Subagen" href="/id/tools/subagents" icon="users">
    Membuat agen terisolasi untuk membatasi perilaku tak terkendali.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/config-tools#toolsloopdetection" icon="gear">
    Skema lengkap `tools.loopDetection` dan semantik penggabungan.
  </Card>
</CardGroup>
