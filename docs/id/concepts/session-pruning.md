---
read_when:
    - Anda ingin mengurangi pertumbuhan konteks dari keluaran alat
    - Anda ingin memahami pengoptimalan cache prompt Anthropic
summary: Memangkas hasil alat lama agar konteks tetap ringkas dan penyimpanan cache efisien
title: Pemangkasan sesi
x-i18n:
    generated_at: "2026-07-12T14:09:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dd5cb4582cb8d9d7265213abe1f5b5893634882b9f8b3ce1deef746293dd07db
    source_path: concepts/session-pruning.md
    workflow: 16
---

Pemangkasan sesi memangkas **hasil alat lama** dari konteks sebelum setiap pemanggilan LLM. Tindakan ini mengurangi pembengkakan konteks akibat keluaran alat yang terakumulasi (hasil eksekusi, pembacaan berkas, hasil pencarian) tanpa menulis ulang teks percakapan biasa.

<Info>
Pemangkasan hanya dilakukan dalam memori -- tindakan ini tidak mengubah transkrip sesi di disk. Riwayat lengkap Anda selalu dipertahankan.
</Info>

## Mengapa ini penting

Sesi panjang mengakumulasi keluaran alat yang memperbesar jendela konteks. Hal ini meningkatkan biaya dan dapat memaksa [Compaction](/id/concepts/compaction) lebih cepat daripada yang diperlukan.

Pemangkasan sangat berguna untuk **cache prompt Anthropic**. Setelah TTL cache kedaluwarsa, permintaan berikutnya akan menyimpan ulang seluruh prompt ke cache. Pemangkasan mengurangi ukuran penulisan cache sehingga secara langsung menurunkan biaya.

## Cara kerjanya

Pemangkasan berjalan dalam mode `cache-ttl`, dengan pemeriksaan waktu dan pemeriksaan ukuran konteks sebagai syarat:

1. Tunggu hingga TTL cache kedaluwarsa (nilai bawaan 5 menit jika ditetapkan secara manual; lihat [Nilai bawaan cerdas](#smart-defaults) untuk nilai bawaan otomatis Anthropic). Sebelum TTL berlalu, pemangkasan dilewati sepenuhnya untuk mempertahankan penggunaan ulang cache prompt bagi giliran yang berdekatan.
2. Setelah TTL berlalu, perkirakan ukuran total konteks terhadap jendela konteks model. Jika rasionya di bawah `softTrimRatio` (nilai bawaan 0,3), lewati pemangkasan dan biarkan penghitung waktu TTL tetap berjalan.
3. **Pangkas ringan** hasil alat berukuran terlalu besar di atas rasio: pertahankan bagian awal dan akhir (nilai bawaan masing-masing 1.500 karakter, dibatasi hingga total gabungan 4.000 karakter), lalu sisipkan `...` di antaranya.
4. Jika rasio masih sama dengan atau di atas `hardClearRatio` (nilai bawaan 0,5) dan setidaknya `minPrunableToolChars` (nilai bawaan 50.000) karakter konten alat yang dapat dipangkas masih tersisa, **hapus sepenuhnya** hasil tersebut: ganti kontennya dengan teks pengganti (nilai bawaan `[Konten hasil alat lama dihapus]`).
5. Atur ulang penghitung waktu TTL hanya ketika pemangkasan benar-benar mengubah konteks agar permintaan lanjutan menggunakan ulang cache baru.

Dua aturan keamanan berlaku terlepas dari ambang batas: giliran asisten `keepLastAssistants` terbaru (nilai bawaan 3) tidak pernah dipangkas, dan tidak ada bagian sebelum pesan pengguna pertama dalam sesi yang pernah dipangkas (melindungi pembacaan awal seperti `SOUL.md`/`USER.md`).

Hanya pesan `toolResult` yang memenuhi syarat; teks percakapan biasa tidak diubah. Gunakan `agents.defaults.contextPruning.tools.{allow,deny}` untuk menentukan nama alat yang dapat dipangkas.

## Pembersihan gambar lama

OpenClaw juga membuat tampilan pemutaran ulang idempoten terpisah untuk sesi yang menyimpan blok gambar mentah atau penanda media hidrasi prompt dalam riwayat.

- Tampilan ini mempertahankan **3 giliran selesai terbaru** byte demi byte agar awalan cache prompt untuk tindak lanjut terbaru tetap stabil. Jumlah ini mencakup semua giliran yang selesai, bukan hanya giliran yang memuat gambar, sehingga giliran yang hanya berisi teks juga menggunakan jendela tersebut.
- Dalam tampilan pemutaran ulang, blok gambar lama yang sudah diproses dari riwayat `user` atau `toolResult` diganti dengan `[data gambar dihapus - sudah diproses oleh model]`.
- Referensi media tekstual lama seperti `[media attached: ...]`, `[Image: source: ...]`, dan `media://inbound/...` diganti dengan `[referensi media dihapus - sudah diproses oleh model]`. Penanda lampiran giliran saat ini tetap utuh agar model visi masih dapat menghidrasi gambar baru.
- Transkrip sesi mentah tidak ditulis ulang sehingga penampil riwayat tetap dapat merender entri pesan asli beserta gambarnya.
- Proses ini terpisah dari pemangkasan TTL cache normal di atas. Tujuannya adalah mencegah muatan gambar berulang atau referensi media usang merusak cache prompt pada giliran berikutnya.

## Nilai bawaan cerdas

Plugin Anthropic yang disertakan secara otomatis mengonfigurasi pemangkasan dan interval Heartbeat saat pertama kali menemukan profil autentikasi Anthropic (atau Claude CLI), tetapi hanya untuk kolom yang belum Anda tetapkan secara eksplisit:

| Mode autentikasi                               | `contextPruning.mode` | `contextPruning.ttl` | `heartbeat.every` |
| ---------------------------------------------- | --------------------- | -------------------- | ----------------- |
| OAuth/token (termasuk penggunaan ulang Claude CLI) | `cache-ttl`       | `1h`                 | `1h`              |
| Kunci API                                      | `cache-ttl`           | `1h`                 | `30m`             |

Jika Anda menetapkan sendiri `agents.defaults.contextPruning.mode` atau `agents.defaults.heartbeat.every`, OpenClaw tidak akan menimpanya. Nilai bawaan otomatis ini hanya diterapkan untuk autentikasi keluarga Anthropic; penyedia lain menggunakan pemangkasan `off` kecuali Anda mengonfigurasinya.

## Mengaktifkan atau menonaktifkan

Pemangkasan dinonaktifkan secara bawaan untuk penyedia non-Anthropic. Untuk mengaktifkannya:

```json5
{
  agents: {
    defaults: {
      contextPruning: { mode: "cache-ttl", ttl: "5m" },
    },
  },
}
```

Untuk menonaktifkan: tetapkan `mode: "off"`.

## Pemangkasan dibandingkan dengan Compaction

|                | Pemangkasan         | Compaction                   |
| -------------- | ------------------- | ---------------------------- |
| **Apa**        | Memangkas hasil alat | Merangkum percakapan        |
| **Disimpan?**  | Tidak (per permintaan) | Ya (dalam transkrip)      |
| **Cakupan**    | Hanya hasil alat    | Seluruh percakapan           |

Keduanya saling melengkapi -- pemangkasan menjaga keluaran alat tetap ringkas di antara siklus Compaction.

## Bacaan lebih lanjut

- [Compaction](/id/concepts/compaction): pengurangan konteks berbasis perangkuman
- [Konfigurasi Gateway](/id/gateway/configuration): semua opsi konfigurasi pemangkasan (`contextPruning.*`)

## Terkait

- [Pengelolaan sesi](/id/concepts/session)
- [Alat sesi](/id/concepts/session-tool)
- [Mesin konteks](/id/concepts/context-engine)
