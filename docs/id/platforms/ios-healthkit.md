---
read_when:
    - Mengaktifkan ringkasan HealthKit pada node iPhone
    - Memanggil health.summary atau memecahkan masalah metrik kesehatan yang hilang
    - Meninjau data kesehatan apa saja yang dapat keluar dari iPhone
summary: Aktifkan dan panggil ringkasan HealthKit dengan akses yang dilindungi privasi dari node iPhone
title: Ringkasan HealthKit
x-i18n:
    generated_at: "2026-07-16T18:17:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2f074c715ee1ef805ec953c301c03940e664c161f7f14c4388c83c64e222b557
    source_path: platforms/ios-healthkit.md
    workflow: 16
---

# Ringkasan HealthKit

OpenClaw dapat meminta ringkasan hanya-baca untuk hari kalender saat ini dari
node iPhone yang terhubung. iPhone menghitung agregat di perangkat dan hanya
mengembalikan langkah, durasi tidur, rata-rata denyut jantung saat istirahat, serta
jumlah/durasi olahraga. Sampel HealthKit individual, sumber, metadata, catatan
klinis, penyerapan latar belakang, dan penulisan tidak didukung.

Fitur ini dinonaktifkan secara default. Fitur ini memerlukan persetujuan terpisah di iPhone dan
otorisasi di Gateway.

## Persyaratan

- iPhone yang menjalankan aplikasi OpenClaw iOS dan HealthKit melaporkan bahwa data kesehatan
  tersedia.
- Node iPhone yang terhubung dan disetujui. Lihat [penyiapan aplikasi iOS](/id/platforms/ios).
- Gateway terkini yang dapat menjangkau node iPhone.
- Data Health yang dapat dibaca untuk setiap metrik yang ingin Anda lihat. Apple Watch dapat
  menyumbangkan data ke penyimpanan Health di iPhone, tetapi aplikasi OpenClaw watchOS
  tidak diperlukan untuk ringkasan HealthKit.

## Aktifkan akses

### 1. Otorisasi perintah Gateway

Tambahkan `health.summary` ke larik `gateway.nodes.allowCommands` yang ada di
`openclaw.json`. Pertahankan semua perintah yang sudah ada:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["health.summary"],
    },
  },
}
```

`health.summary` diklasifikasikan sebagai sangat sensitif terhadap privasi dan tidak pernah diizinkan oleh
default platform iOS. Entri dalam `gateway.nodes.denyCommands` mengesampingkan
entri izin. Lihat [Kebijakan perintah Node](/id/nodes#command-policy).

### 2. Aktifkan berbagi di iPhone

Di aplikasi iOS:

1. Buka **Settings -> Permissions -> Privacy & Access -> Health Summaries**.
2. Ketuk **Enable & Share Summaries**.
3. Baca pengungkapan, lalu pilih kategori Health yang boleh dibaca OpenClaw
   pada lembar izin Apple.

Sakelar tersebut mencatat pilihan eksplisit Anda untuk berbagi dengan OpenClaw. Sakelar ini tidak menyatakan
bahwa Apple memberikan akses ke setiap kategori yang diminta.

Mengaktifkan ringkasan Health menambahkan `health.summary` ke permukaan perintah yang dideklarasikan
node. Setujui pembaruan pemasangan node yang dihasilkan:

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
```

Kemudian verifikasi bahwa iPhone yang terhubung mengekspos perintah efektif `health.summary`:

```bash
openclaw nodes describe --node "<iPhone name>"
```

## Minta ringkasan hari ini

Hanya `today` yang didukung. Rentangnya mencakup tengah malam waktu lokal hingga waktu permintaan,
menggunakan kalender dan zona waktu iPhone saat ini.

```bash
openclaw nodes invoke \
  --node "<iPhone name>" \
  --command health.summary \
  --params '{"period":"today"}' \
  --json
```

Agen dapat memanggil perintah yang sama dengan alat `nodes`:

```json
{
  "action": "invoke",
  "node": "<iPhone name>",
  "invokeCommand": "health.summary",
  "invokeParamsJson": "{\"period\":\"today\"}"
}
```

Payload ringkasan berisi:

| Bidang                   | Arti                                          |
| ------------------------ | --------------------------------------------- |
| `period`                 | Selalu `today`                               |
| `startISO`               | Awal hari waktu lokal, dikodekan sebagai instan ISO |
| `endISO`                 | Waktu permintaan, dikodekan sebagai instan ISO      |
| `timeZoneIdentifier`     | Pengidentifikasi zona waktu iPhone                 |
| `stepCount`              | Langkah kumulatif yang dibulatkan                   |
| `sleepDurationMinutes`   | Waktu tidur yang dideduplikasi, dibatasi hingga hari ini |
| `restingHeartRateBpm`    | Rata-rata denyut jantung saat istirahat             |
| `workoutCount`           | Olahraga yang dimulai hari ini                      |
| `workoutDurationMinutes` | Durasi total olahraga tersebut                      |

Bidang metrik bersifat opsional dan dihilangkan ketika HealthKit tidak mengembalikan
nilai yang dapat dibaca. Tahap tidur dan sumber yang tumpang tindih digabungkan sebelum durasi
dihitung, sehingga menit yang sama tidak dihitung dua kali.

## Perilaku privasi

- Agregasi berlangsung di iPhone. Sampel mentah tidak meninggalkan perangkat.
- Agregat yang diminta meninggalkan iPhone melalui Gateway Anda. Ketika agen
  memintanya, agregat tersebut mencapai penyedia AI yang dikonfigurasi dan dapat tetap tersimpan
  dalam riwayat obrolan. Pemanggilan CLI langsung mengembalikannya kepada operator CLI.
- OpenClaw hanya meminta akses baca. OpenClaw tidak dapat menambahkan atau mengubah data Health.
- OpenClaw hanya membaca HealthKit ketika `health.summary` dipanggil. Tidak ada
  penyerapan data kesehatan di latar belakang.
- HealthKit sengaja tidak mengungkapkan apakah akses baca ditolak. Metrik yang
  tidak ada dapat berarti akses ditolak, tidak ada sampel yang cocok, atau jenis data tidak
  tersedia. OpenClaw tidak dapat membedakan kasus-kasus tersebut.
- Ringkasan ini ditujukan untuk konteks kesehatan dan kebugaran pribadi, bukan diagnosis atau
  saran medis.

Untuk berhenti berbagi, kembali ke **Health Summaries** dan ketuk **Disable**. iPhone
kemudian menghapus kapabilitas Health dan perintah `health.summary` dari permukaan
node-nya. Anda juga dapat menghapus `health.summary` dari
`gateway.nodes.allowCommands` untuk menutup sisi Gateway dari gerbang tersebut.

## Pemecahan masalah

### Perintah tidak dideklarasikan oleh node

Pastikan ringkasan Health diaktifkan di aplikasi iOS dan iPhone terhubung.
Jalankan `openclaw nodes pending` dan setujui setiap pembaruan kapabilitas, lalu periksa kembali
`openclaw nodes describe --node "<iPhone name>"`.

### Perintah memerlukan persetujuan eksplisit

Tambahkan `health.summary` ke `gateway.nodes.allowCommands`. Periksa juga bahwa
`gateway.nodes.denyCommands` tidak memuatnya; daftar penolakan memiliki prioritas.

### `HEALTH_ACCESS_DISABLED`

Sakelar berbagi di sisi aplikasi dinonaktifkan. Aktifkan **Health Summaries** di bawah
**Privacy & Access** pada iPhone.

### Ringkasan berhasil tetapi metrik tidak ada

Buka aplikasi Health Apple dan pastikan data untuk hari ini tersedia. Tinjau
akses OpenClaw di pengaturan Health Apple, tetapi jangan menganggap hasil kosong
sebagai bukti bahwa akses ditolak: HealthKit sengaja menyembunyikan perbedaan tersebut.

### Rentang yang lebih lama gagal

Perintah ini hanya menerima `{"period":"today"}`. Ringkasan beberapa hari dan historis
tidak didukung.

## Terkait

- [Aplikasi iOS](/id/platforms/ios)
- [Node](/id/nodes)
- [Referensi konfigurasi Gateway](/id/gateway/configuration-reference#gateway)
- [Audit keamanan](/id/gateway/security)
