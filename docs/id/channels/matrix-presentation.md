---
read_when:
    - Membangun klien Matrix yang merender respons kaya OpenClaw
    - Men-debug konten peristiwa com.openclaw.presentation
summary: Metadata MessagePresentation Matrix untuk klien yang mendukung OpenClaw
title: Metadata presentasi Matrix
x-i18n:
    generated_at: "2026-07-12T13:59:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c0de4d13c6cefc6f91dcc7a4b0edeea6bf001f3bd71f52c9f0498ad422783d8a
    source_path: channels/matrix-presentation.md
    workflow: 16
---

OpenClaw melampirkan metadata `MessagePresentation` yang dinormalisasi ke peristiwa Matrix `m.room.message` keluar di bawah kunci konten `com.openclaw.presentation`.

Klien Matrix standar tetap merender `body` teks biasa. Klien yang mendukung OpenClaw dapat membaca metadata terstruktur dan merender UI native seperti tombol, pilihan, baris konteks, dan pemisah.

## Konten peristiwa

```json
{
  "msgtype": "m.text",
  "body": "Select model\n\nChoose model:\n- DeepSeek",
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

- `version` adalah versi skema metadata; versi saat ini adalah `1`. `type` adalah pembeda stabil yang selalu bernilai `"message.presentation"`. Adaptor Matrix hanya menghasilkan payload dengan versi dan tipe yang sama persis; klien juga harus mengabaikan versi tidak dikenal yang tidak dapat ditafsirkan dengan aman, nilai `type` yang tidak dikenal, dan tipe blok yang tidak dikenal.
- `title` dan `tone` (`info`, `success`, `warning`, `danger`, `neutral`) adalah petunjuk opsional.
- Tombol dan opsi pilihan dapat menyertakan `action` bertipe (`{ "type": "command", "command": "/..." }` atau `{ "type": "callback", "value": "..." }`) bersama string `value` lama. Utamakan `action` jika keduanya tersedia.

## Perilaku fallback

OpenClaw selalu merender fallback teks biasa yang mudah dibaca ke dalam `body`. Metadata terstruktur bersifat tambahan dan tidak boleh diwajibkan untuk interoperabilitas dasar Matrix.

Aturan perenderan fallback:

- Konten `title`, `text`, dan `context` dirender sebagai baris teks biasa.
- Tombol dengan tindakan `command` dirender sebagai ``label: `/command` `` agar perintah tetap dapat disalin. Tombol dengan tindakan `callback` atau hanya `value` lama dirender hanya sebagai label agar nilai callback yang tidak transparan tetap privat; tombol yang dinonaktifkan selalu hanya berupa label. Tombol URL dan aplikasi web dirender sebagai `label: URL`.
- Blok pilihan merender placeholder (atau `Options:`) sebagai judul yang diikuti baris opsi yang hanya memuat label.
- Jika tidak ada yang dirender, misalnya presentasi yang hanya berisi pemisah, isi pesan menggunakan fallback `---`.

Klien yang tidak didukung tetap menampilkan teks fallback. Klien yang mendukung OpenClaw dapat mengutamakan metadata terstruktur untuk tampilan sambil mempertahankan fallback untuk penyalinan, pencarian, notifikasi, dan aksesibilitas.

## Blok yang didukung

Adaptor keluar Matrix menyatakan dukungan native untuk:

- `buttons`
- `select`
- `context`
- `divider`

Blok `text` selalu didukung melalui isi fallback. Perlakukan semua blok sebagai petunjuk presentasi yang diupayakan sebaik mungkin; abaikan bidang dan tipe blok yang tidak dikenal alih-alih menggagalkan seluruh pesan.

## Interaksi

Metadata ini tidak menambahkan semantik callback Matrix. Nilai tombol dan pilihan adalah payload interaksi fallback, biasanya perintah garis miring atau perintah teks. Klien Matrix yang ingin mendukung interaksi harus menentukan nilai kontrol (`action.command`, lalu `action.value`, lalu `value`) dan mengirimkannya kembali ke ruang sebagai pesan biasa.

Misalnya, tombol dengan nilai `/model deepseek/deepseek-chat` dapat ditangani dengan mengirimkan nilai tersebut sebagai pesan teks Matrix terenkripsi di ruang yang sama.

## Hubungan dengan metadata persetujuan

`com.openclaw.presentation` digunakan untuk presentasi pesan kaya secara umum.

Prompt persetujuan menggunakan metadata khusus `com.openclaw.approval` karena persetujuan membawa status, keputusan, serta detail eksekusi/Plugin yang sensitif terhadap keamanan. Jika kedua kunci metadata tersedia pada peristiwa yang sama, klien harus mengutamakan perender persetujuan khusus.

## Pesan media

Jika balasan berisi beberapa URL media, OpenClaw mengirimkan satu peristiwa Matrix untuk setiap URL media. Teks keterangan dan metadata presentasi hanya dilampirkan ke peristiwa pertama agar klien memperoleh satu payload terstruktur yang stabil tanpa perender duplikat. Aturan yang sama berlaku ketika teks panjang dibagi menjadi beberapa peristiwa: metadata hanya disertakan pada peristiwa pertama.

Jaga agar metadata presentasi tetap ringkas. Teks berukuran besar yang terlihat oleh pengguna harus tetap berada di `body` dan menggunakan jalur pembagian teks Matrix yang normal.
