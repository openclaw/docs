---
read_when:
    - Mengubah rendering output asisten di Control UI
    - Men-debug direktif presentasi `[embed ...]`, `MEDIA:`, reply, atau audio
summary: Protokol shortcode rich output untuk embed, media, petunjuk audio, dan balasan
title: Protokol rich output
x-i18n:
    generated_at: "2026-04-26T11:38:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3c62e41073196c2ff4867230af55469786fcfb29414f5cc5b7d38f6b1ffc3718
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

Output asisten dapat membawa sekumpulan kecil direktif pengiriman/rendering:

- `MEDIA:` untuk pengiriman lampiran
- `[[audio_as_voice]]` untuk petunjuk presentasi audio
- `[[reply_to_current]]` / `[[reply_to:<id>]]` untuk metadata balasan
- `[embed ...]` untuk rich rendering di Control UI

Lampiran `MEDIA:` remote harus berupa URL `https:` publik. `http:` biasa,
loopback, link-local, privat, dan hostname internal diabaikan sebagai direktif
lampiran; fetcher media sisi server tetap menerapkan guard jaringan mereka sendiri.

Direktif ini terpisah. `MEDIA:` dan tag balasan/suara tetap menjadi metadata pengiriman; `[embed ...]` adalah jalur rich render khusus web.
Media hasil tool tepercaya menggunakan parser `MEDIA:` / `[[audio_as_voice]]` yang sama sebelum pengiriman, sehingga output tool teks tetap dapat menandai lampiran audio sebagai voice note.

Saat block streaming diaktifkan, `MEDIA:` tetap menjadi metadata pengiriman tunggal untuk satu
giliran. Jika URL media yang sama dikirim dalam blok streaming dan diulang dalam payload
asisten final, OpenClaw mengirimkan lampiran sekali dan menghapus duplikat
dari payload final.

## `[embed ...]`

`[embed ...]` adalah satu-satunya sintaks rich render yang menghadap agen untuk Control UI.

Contoh self-closing:

```text
[embed ref="cv_123" title="Status" /]
```

Aturan:

- `[view ...]` tidak lagi valid untuk output baru.
- Shortcode embed dirender hanya di permukaan pesan asisten.
- Hanya embed yang didukung URL yang dirender. Gunakan `ref="..."` atau `url="..."`.
- Shortcode embed HTML inline berbentuk blok tidak dirender.
- UI web menghapus shortcode dari teks yang terlihat dan merender embed secara inline.
- `MEDIA:` bukan alias embed dan tidak boleh digunakan untuk rich embed rendering.

## Bentuk rendering yang disimpan

Blok konten asisten yang dinormalisasi/disimpan adalah item `canvas` terstruktur:

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

Blok rich yang disimpan/dirender menggunakan bentuk `canvas` ini secara langsung. `present_view` tidak dikenali.

## Terkait

- [RPC adapters](/id/reference/rpc)
- [Typebox](/id/concepts/typebox)
