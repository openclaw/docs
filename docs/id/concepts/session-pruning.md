---
read_when:
    - Anda ingin mengurangi pertumbuhan context dari output tool
    - Anda ingin memahami optimasi prompt cache Anthropic
summary: Memangkas hasil tool lama untuk menjaga context tetap ringkas dan caching efisien
title: Session pruning
x-i18n:
    generated_at: "2026-04-26T11:27:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3ea07f0ae23076906e2ff0246ac75813572f98cffa50afddb6a6b0af8964c4a9
    source_path: concepts/session-pruning.md
    workflow: 15
---

Session pruning memangkas **hasil tool lama** dari context sebelum setiap
panggilan LLM. Ini mengurangi pembengkakan context dari akumulasi output tool (hasil exec, pembacaan file,
hasil pencarian) tanpa menulis ulang teks percakapan normal.

<Info>
Pruning hanya terjadi di memori -- ini tidak mengubah transkrip sesi di disk.
Riwayat lengkap Anda selalu dipertahankan.
</Info>

## Mengapa ini penting

Sesi yang panjang mengumpulkan output tool yang memperbesar window context. Hal ini
meningkatkan biaya dan dapat memaksa [Compaction](/id/concepts/compaction) lebih cepat
dari yang diperlukan.

Pruning sangat bernilai untuk **Anthropic prompt caching**. Setelah TTL cache
kedaluwarsa, permintaan berikutnya melakukan cache ulang untuk seluruh prompt. Pruning mengurangi ukuran
penulisan cache, sehingga langsung menurunkan biaya.

## Cara kerjanya

1. Tunggu hingga TTL cache kedaluwarsa (default 5 menit).
2. Temukan hasil tool lama untuk pruning normal (teks percakapan dibiarkan tetap).
3. **Soft-trim** hasil yang terlalu besar -- pertahankan bagian awal dan akhir, sisipkan `...`.
4. **Hard-clear** sisanya -- ganti dengan placeholder.
5. Reset TTL agar permintaan lanjutan menggunakan ulang cache baru.

## Pembersihan image legacy

OpenClaw juga membangun tampilan replay idempoten terpisah untuk sesi yang
menyimpan blok image mentah atau penanda media prompt-hydration dalam riwayat.

- Ini mempertahankan **3 giliran selesai terbaru** byte-for-byte agar prefiks prompt
  cache untuk tindak lanjut terbaru tetap stabil.
- Dalam tampilan replay, blok image lama yang sudah diproses dari riwayat `user` atau
  `toolResult` dapat diganti dengan
  `[image data removed - already processed by model]`.
- Referensi media tekstual lama seperti `[media attached: ...]`,
  `[Image: source: ...]`, dan `media://inbound/...` dapat diganti dengan
  `[media reference removed - already processed by model]`. Penanda lampiran giliran saat ini
  tetap utuh agar model vision masih dapat menghidrasi image baru.
- Transkrip sesi mentah tidak ditulis ulang, sehingga penampil riwayat tetap dapat
  merender entri pesan asli dan image-nya.
- Ini terpisah dari pruning TTL cache normal. Ini ada untuk menghentikan
  payload image berulang atau referensi media usang agar tidak merusak prompt cache pada giliran berikutnya.

## Default cerdas

OpenClaw secara otomatis mengaktifkan pruning untuk profil Anthropic:

| Tipe profil                                            | Pruning aktif | Heartbeat |
| ------------------------------------------------------ | ------------- | --------- |
| Auth OAuth/token Anthropic (termasuk penggunaan ulang Claude CLI) | Ya            | 1 jam     |
| API key                                                | Ya            | 30 menit  |

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

Untuk menonaktifkan: atur `mode: "off"`.

## Pruning vs Compaction

|            | Pruning            | Compaction              |
| ---------- | ------------------ | ----------------------- |
| **Apa**    | Memangkas hasil tool | Merangkum percakapan   |
| **Disimpan?** | Tidak (per-permintaan) | Ya (dalam transkrip) |
| **Cakupan** | Hanya hasil tool  | Seluruh percakapan      |

Keduanya saling melengkapi -- pruning menjaga output tool tetap ringkas di antara
siklus Compaction.

## Bacaan lebih lanjut

- [Compaction](/id/concepts/compaction) -- pengurangan context berbasis peringkasan
- [Gateway Configuration](/id/gateway/configuration) -- semua knob config pruning
  (`contextPruning.*`)

## Terkait

- [Manajemen sesi](/id/concepts/session)
- [Tool sesi](/id/concepts/session-tool)
- [Mesin context](/id/concepts/context-engine)
