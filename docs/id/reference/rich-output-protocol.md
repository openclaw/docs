---
read_when:
    - Mengubah perenderan keluaran asisten di UI Kontrol
    - Men-debug arahan penyajian `[embed ...]`, media terstruktur, balasan, atau audio
summary: Protokol keluaran kaya untuk media terstruktur, sematan, petunjuk audio, dan balasan
title: Protokol keluaran kaya
x-i18n:
    generated_at: "2026-07-12T14:38:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cbfe68f38c871f5f6d2811eb52b18d0143606f30283023ae96db64543eed95a1
    source_path: reference/rich-output-protocol.md
    workflow: 16
---

Keluaran asisten membawa direktif pengiriman/render melalui beberapa saluran khusus:

- Kolom terstruktur `mediaUrl` / `mediaUrls` untuk pengiriman lampiran.
- `[[audio_as_voice]]` untuk petunjuk penyajian audio.
- `[[reply_to_current]]` / `[[reply_to:<id>]]` untuk metadata balasan.
- `[embed ...]` untuk rendering kaya pada Antarmuka Kontrol.

Kolom media terstruktur dan tag `[[...]]` merupakan metadata pengiriman. `[embed ...]` adalah jalur rendering kaya terpisah yang hanya tersedia di web; ini bukan alias media.

## Lampiran media

Lampiran jarak jauh harus berupa URL `https:` publik. Nama host `http:`, loopback, link-local, privat, dan internal ditolak sebagai direktif lampiran; pengambil media sisi server menerapkan pengamanan jaringannya sendiri sebagai perlindungan tambahan.

Lampiran lokal menerima jalur absolut, jalur relatif terhadap ruang kerja, atau jalur `~/` yang relatif terhadap direktori beranda. Lampiran tersebut tetap harus melewati kebijakan pembacaan berkas agen dan pemeriksaan jenis media sebelum dikirim.

<Warning>
Jangan menghasilkan perintah teks untuk lampiran dari alat, plugin, blok streaming, keluaran peramban, atau tindakan pesan. Gunakan kolom media terstruktur sebagai gantinya:

```json
{ "message": "Berikut gambar Anda.", "mediaUrl": "/workspace/image.png" }
```

Teks balasan akhir lama mungkin masih dinormalisasi untuk kompatibilitas, tetapi ini bukan protokol umum untuk plugin/alat.
</Warning>

Sintaks gambar Markdown biasa (`![alt](url)`) secara default tetap menjadi teks. Saluran yang ingin memperlakukan gambar Markdown sebagai balasan media dapat mengaktifkannya pada adaptor keluar; Telegram melakukan ini sehingga `![alt](url)` menjadi lampiran media.

Saat streaming blok diaktifkan, media harus dikirim melalui kolom muatan terstruktur. Jika URL media yang sama muncul dalam blok yang dialirkan dan muncul lagi dalam muatan akhir asisten, OpenClaw mengirimkannya sekali dan menghapus duplikatnya dari muatan akhir.

## `[embed ...]`

`[embed ...]` adalah satu-satunya sintaks rendering kaya yang dapat digunakan agen untuk Antarmuka Kontrol. Contoh yang menutup sendiri:

```text
[embed ref="cv_123" title="Status" /]
```

Aturan:

- `[view ...]` tidak lagi valid untuk keluaran baru.
- Kode pendek sematan hanya dirender pada permukaan pesan asisten.
- Hanya sematan berbasis URL yang dirender; gunakan `ref="..."` atau `url="..."`.
- Kode pendek sematan HTML sebaris berbentuk blok tidak dirender.
- Antarmuka web menghapus kode pendek dari teks yang terlihat dan merender sematan secara sebaris.

## Bentuk rendering tersimpan

Blok konten asisten yang telah dinormalisasi/disimpan merupakan item `canvas` terstruktur:

```json
{
  "type": "canvas",
  "preview": {
    "kind": "canvas",
    "surface": "assistant_message",
    "render": "url",
    "viewId": "cv_123",
    "url": "/__openclaw__/canvas/documents/cv_123/index.html",
    "title": "Status",
    "preferredHeight": 320
  }
}
```

`present_view` tidak dikenali; blok kaya yang disimpan/dirender selalu menggunakan bentuk `canvas` ini.

## Terkait

- [Adaptor RPC](/id/reference/rpc)
- [Typebox](/id/concepts/typebox)
