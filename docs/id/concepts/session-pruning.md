---
read_when:
    - Anda ingin mengurangi pertumbuhan konteks dari output tool
    - Anda ingin memahami optimasi prompt cache Anthropic
summary: Memangkas hasil tool lama agar konteks tetap ringkas dan caching efisien
title: Pruning Sesi
x-i18n:
    generated_at: "2026-04-05T13:52:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1569a50e0018cca3e3ceefbdddaf093843df50cdf2f7bf62fe925299875cb487
    source_path: concepts/session-pruning.md
    workflow: 15
---

# Pruning Sesi

Pruning sesi memangkas **hasil tool lama** dari konteks sebelum setiap panggilan LLM
dilakukan. Ini mengurangi pembengkakan konteks dari output tool yang terakumulasi (hasil exec, pembacaan file,
hasil pencarian) tanpa menulis ulang teks percakapan normal.

<Info>
Pruning hanya dilakukan di memori -- ini tidak mengubah transkrip sesi di disk.
Riwayat lengkap Anda selalu dipertahankan.
</Info>

## Mengapa ini penting

Sesi yang panjang mengakumulasi output tool yang memperbesar jendela konteks. Hal ini
meningkatkan biaya dan dapat memaksa [compaction](/concepts/compaction) lebih cepat dari yang
diperlukan.

Pruning sangat bernilai untuk **prompt caching Anthropic**. Setelah TTL cache
kedaluwarsa, permintaan berikutnya menyimpan ulang seluruh prompt ke cache. Pruning mengurangi ukuran
penulisan cache, yang secara langsung menurunkan biaya.

## Cara kerjanya

1. Tunggu hingga TTL cache kedaluwarsa (default 5 menit).
2. Temukan hasil tool lama untuk pruning normal (teks percakapan dibiarkan apa adanya).
3. **Soft-trim** hasil yang terlalu besar -- pertahankan bagian awal dan akhir, sisipkan `...`.
4. **Hard-clear** sisanya -- ganti dengan placeholder.
5. Reset TTL agar permintaan tindak lanjut menggunakan kembali cache baru.

## Pembersihan gambar lama

OpenClaw juga menjalankan pembersihan idempoten terpisah untuk sesi lama yang
menyimpan blok gambar mentah di riwayat.

- Ini mempertahankan **3 giliran selesai terbaru** byte demi byte sehingga prefiks prompt
  cache untuk tindak lanjut terbaru tetap stabil.
- Blok gambar lama yang sudah diproses dalam riwayat `user` atau `toolResult` dapat
  diganti dengan `[image data removed - already processed by model]`.
- Ini terpisah dari pruning TTL cache normal. Ini ada untuk menghentikan payload
  gambar berulang agar tidak merusak prompt cache pada giliran berikutnya.

## Default cerdas

OpenClaw secara otomatis mengaktifkan pruning untuk profil Anthropic:

| Tipe profil                                             | Pruning diaktifkan | Heartbeat |
| ------------------------------------------------------- | ------------------ | --------- |
| Auth OAuth/token Anthropic (termasuk penggunaan ulang Claude CLI) | Ya                 | 1 jam     |
| API key                                                 | Ya                 | 30 min    |

Jika Anda menetapkan nilai eksplisit, OpenClaw tidak akan menimpanya.

## Aktifkan atau nonaktifkan

Pruning dinonaktifkan secara default untuk provider non-Anthropic. Untuk mengaktifkan:

```json5
{
  agents: {
    defaults: {
      contextPruning: { mode: "cache-ttl", ttl: "5m" },
    },
  },
}
```

Untuk menonaktifkan: setel `mode: "off"`.

## Pruning vs compaction

|            | Pruning              | Compaction              |
| ---------- | -------------------- | ----------------------- |
| **Apa**    | Memangkas hasil tool | Meringkas percakapan    |
| **Disimpan?** | Tidak (per permintaan) | Ya (dalam transkrip) |
| **Cakupan** | Hanya hasil tool     | Seluruh percakapan      |

Keduanya saling melengkapi -- pruning menjaga output tool tetap ringkas di antara
siklus compaction.

## Bacaan lanjutan

- [Compaction](/concepts/compaction) -- pengurangan konteks berbasis peringkasan
- [Konfigurasi Gateway](/gateway/configuration) -- semua pengaturan config pruning
  (`contextPruning.*`)
