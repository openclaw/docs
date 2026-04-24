---
read_when:
    - Anda ingin mengurangi pertumbuhan konteks dari output tool
    - Anda ingin memahami optimasi prompt cache Anthropic
summary: Memangkas hasil tool lama agar konteks tetap ringkas dan caching efisien
title: Session pruning
x-i18n:
    generated_at: "2026-04-24T09:05:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: af47997b83cd478dac0e2ebb6d277a948713f28651751bec6cff4ef4b70a16c6
    source_path: concepts/session-pruning.md
    workflow: 15
---

Session pruning memangkas **hasil tool lama** dari konteks sebelum setiap pemanggilan LLM
. Ini mengurangi pembengkakan konteks dari akumulasi output tool (hasil exec, pembacaan file,
hasil pencarian) tanpa menulis ulang teks percakapan normal.

<Info>
Pruning hanya di memori -- tidak memodifikasi transkrip sesi di disk.
Riwayat lengkap Anda selalu dipertahankan.
</Info>

## Mengapa ini penting

Sesi panjang mengumpulkan output tool yang memperbesar jendela konteks. Ini
meningkatkan biaya dan dapat memaksa [Compaction](/id/concepts/compaction) lebih cepat dari
yang diperlukan.

Pruning sangat berharga untuk **Anthropic prompt caching**. Setelah cache
TTL berakhir, permintaan berikutnya akan menyimpan ulang seluruh prompt ke cache. Pruning mengurangi
ukuran penulisan cache, sehingga langsung menurunkan biaya.

## Cara kerjanya

1. Tunggu TTL cache berakhir (default 5 menit).
2. Temukan hasil tool lama untuk pruning normal (teks percakapan dibiarkan apa adanya).
3. **Soft-trim** hasil yang terlalu besar -- pertahankan bagian awal dan akhir, sisipkan `...`.
4. **Hard-clear** sisanya -- ganti dengan placeholder.
5. Reset TTL agar permintaan lanjutan menggunakan kembali cache baru.

## Pembersihan gambar lama

OpenClaw juga menjalankan pembersihan idempoten terpisah untuk sesi lama yang
menyimpan blok gambar mentah di riwayat.

- OpenClaw mempertahankan **3 giliran selesai terbaru** byte demi byte agar prefiks prompt
  cache untuk tindak lanjut terbaru tetap stabil.
- Blok gambar lama yang sudah diproses dalam riwayat `user` atau `toolResult` dapat
  diganti dengan `[image data removed - already processed by model]`.
- Ini terpisah dari pruning cache-TTL normal. Ini ada untuk menghentikan
  payload gambar berulang agar tidak merusak prompt cache pada giliran berikutnya.

## Default cerdas

OpenClaw mengaktifkan pruning secara otomatis untuk profil Anthropic:

| Jenis profil                                            | Pruning aktif | Heartbeat |
| ------------------------------------------------------- | ------------- | --------- |
| Auth OAuth/token Anthropic (termasuk reuse Claude CLI)  | Ya            | 1 jam     |
| API key                                                 | Ya            | 30 menit  |

Jika Anda menetapkan nilai eksplisit, OpenClaw tidak akan menimpanya.

## Aktifkan atau nonaktifkan

Pruning nonaktif secara default untuk provider non-Anthropic. Untuk mengaktifkan:

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

## Pruning vs Compaction

|            | Pruning              | Compaction               |
| ---------- | -------------------- | ------------------------ |
| **Apa**    | Memangkas hasil tool | Merangkum percakapan     |
| **Disimpan?** | Tidak (per permintaan) | Ya (dalam transkrip) |
| **Cakupan** | Hanya hasil tool    | Seluruh percakapan       |

Keduanya saling melengkapi -- pruning menjaga output tool tetap ringkas di antara
siklus Compaction.

## Bacaan lanjutan

- [Compaction](/id/concepts/compaction) -- pengurangan konteks berbasis peringkasan
- [Konfigurasi Gateway](/id/gateway/configuration) -- semua opsi konfigurasi pruning
  (`contextPruning.*`)

## Terkait

- [Pengelolaan sesi](/id/concepts/session)
- [Tool sesi](/id/concepts/session-tool)
- [Mesin konteks](/id/concepts/context-engine)
