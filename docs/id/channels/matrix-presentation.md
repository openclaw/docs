---
read_when:
    - Membangun klien Matrix yang merender respons kaya OpenClaw
    - Men-debug konten peristiwa com.openclaw.presentation
summary: Metadata MessagePresentation Matrix untuk klien yang mengenali OpenClaw
title: Metadata presentasi Matrix
x-i18n:
    generated_at: "2026-05-10T19:22:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: c89979b6007faaa6af44c7f2511f354b96f163bcd3d5e7f99c405b51c4950537
    source_path: channels/matrix-presentation.md
    workflow: 16
---

OpenClaw dapat melampirkan metadata `MessagePresentation` yang dinormalisasi ke event Matrix `m.room.message` keluar di bawah `com.openclaw.presentation`.

Klien Matrix standar tetap merender `body` teks biasa. Klien yang memahami OpenClaw dapat membaca metadata terstruktur dan merender UI native seperti tombol, pilihan, baris konteks, dan pemisah.

## Konten event

Metadata disimpan dalam konten event Matrix:

```json
{
  "msgtype": "m.text",
  "body": "Select model\n\n- DeepSeek: /model deepseek/deepseek-chat",
  "com.openclaw.presentation": {
    "version": 1,
    "type": "message.presentation",
    "title": "Select model",
    "tone": "info",
    "blocks": [
      {
        "type": "select",
        "placeholder": "Choose model",
        "options": [
          {
            "label": "DeepSeek",
            "value": "/model deepseek/deepseek-chat"
          }
        ]
      }
    ]
  }
}
```

`version` adalah versi skema metadata presentasi Matrix. `type` adalah diskriminator stabil untuk klien yang memahami OpenClaw. Klien harus mengabaikan nilai `type` yang tidak dikenal, versi tidak dikenal yang tidak dapat mereka tafsirkan dengan aman, dan jenis blok yang tidak dikenal.

## Perilaku cadangan

OpenClaw selalu merender cadangan teks biasa yang dapat dibaca ke dalam `body`. Metadata terstruktur bersifat tambahan dan tidak boleh diwajibkan untuk interoperabilitas dasar Matrix.

Klien yang tidak didukung harus tetap menampilkan teks cadangan. Klien yang memahami OpenClaw dapat memilih metadata terstruktur untuk tampilan sambil mempertahankan teks cadangan untuk penyalinan, pencarian, notifikasi, dan aksesibilitas.

## Blok yang didukung

Adapter keluar Matrix mengiklankan dukungan untuk:

- `buttons`
- `select`
- `context`
- `divider`

Klien harus memperlakukan blok ini sebagai petunjuk presentasi upaya terbaik. Bidang yang tidak dikenal dan jenis blok yang tidak dikenal harus diabaikan alih-alih menyebabkan seluruh pesan gagal dirender.

## Interaksi

Metadata ini tidak menambahkan semantik panggilan balik Matrix. Nilai opsi tombol dan pilihan adalah muatan interaksi cadangan, biasanya perintah slash atau perintah teks. Klien Matrix yang ingin mendukung interaksi dapat mengirim nilai yang dipilih kembali ke ruang sebagai pesan normal.

Misalnya, tombol dengan nilai `/model deepseek/deepseek-chat` dapat ditangani dengan mengirim nilai tersebut sebagai pesan teks Matrix terenkripsi di ruang yang sama.

## Hubungan dengan metadata persetujuan

`com.openclaw.presentation` ditujukan untuk presentasi pesan kaya secara umum.

Prompt persetujuan menggunakan metadata khusus `com.openclaw.approval` karena persetujuan membawa status, keputusan, dan detail exec/Plugin yang sensitif terhadap keselamatan. Jika kedua kunci metadata ada pada event yang sama, klien harus memilih perender persetujuan khusus.

## Pesan media

Ketika balasan berisi beberapa URL media, OpenClaw mengirim satu event Matrix per URL media. Metadata presentasi dilampirkan hanya ke event media pertama agar klien memiliki satu muatan terstruktur yang stabil dan perender duplikat dapat dihindari.

Jaga metadata presentasi tetap ringkas. Teks besar yang terlihat oleh pengguna harus tetap berada di `body` dan menggunakan jalur pemecahan teks Matrix normal.
