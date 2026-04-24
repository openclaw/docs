---
read_when:
    - Mengubah rendering output asisten di UI Control
    - Men-debug direktif presentasi `[embed ...]`, `MEDIA:`, balasan, atau audio
summary: Protokol shortcode output kaya untuk embed, media, petunjuk audio, dan balasan
title: Protokol output kaya
x-i18n:
    generated_at: "2026-04-24T09:26:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 688d60c97180b4ba250e731d765e8469a01c68588c149b760c32eab77955f69b
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

Output asisten dapat membawa sekumpulan kecil direktif pengiriman/rendering:

- `MEDIA:` untuk pengiriman lampiran
- `[[audio_as_voice]]` untuk petunjuk presentasi audio
- `[[reply_to_current]]` / `[[reply_to:<id>]]` untuk metadata balasan
- `[embed ...]` untuk rendering kaya UI Control

Direktif ini terpisah. `MEDIA:` dan tag balasan/suara tetap merupakan metadata pengiriman; `[embed ...]` adalah jalur render kaya yang hanya untuk web.

## `[embed ...]`

`[embed ...]` adalah satu-satunya sintaks render kaya yang berhadapan langsung dengan agen untuk UI Control.

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
- `MEDIA:` bukan alias embed dan tidak boleh digunakan untuk rendering embed kaya.

## Bentuk rendering yang disimpan

Blok konten asisten yang dinormalkan/disimpan adalah item `canvas` terstruktur:

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

Blok kaya yang disimpan/dirender menggunakan bentuk `canvas` ini secara langsung. `present_view` tidak dikenali.

## Terkait

- [Adaptor RPC](/id/reference/rpc)
- [Typebox](/id/concepts/typebox)
