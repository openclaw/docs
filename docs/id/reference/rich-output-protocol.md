---
read_when:
    - Mengubah cara keluaran asisten ditampilkan di UI Kontrol
    - Men-debug `[embed ...]`, `MEDIA:`, balasan, atau direktif presentasi audio
summary: Protokol kode pendek keluaran kaya untuk sematan, media, petunjuk audio, dan balasan
title: Protokol keluaran kaya
x-i18n:
    generated_at: "2026-04-30T10:10:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7c52a2f3a37e7a8d1237046edafc3e80c3199c01f890a1ef39662436590ef55d
    source_path: reference/rich-output-protocol.md
    workflow: 16
---

Output asisten dapat membawa sekumpulan kecil direktif pengiriman/perenderan:

- `MEDIA:` untuk pengiriman lampiran
- `[[audio_as_voice]]` untuk petunjuk presentasi audio
- `[[reply_to_current]]` / `[[reply_to:<id>]]` untuk metadata balasan
- `[embed ...]` untuk perenderan kaya Control UI

Lampiran `MEDIA:` jarak jauh harus berupa URL `https:` publik. `http:` biasa,
loopback, link-local, privat, dan hostname internal diabaikan sebagai direktif
lampiran; pengambil media sisi server tetap menerapkan pengaman jaringan mereka sendiri.

Sintaks gambar Markdown biasa tetap menjadi teks secara default. Channel yang secara sengaja
memetakan balasan gambar Markdown ke lampiran media ikut serta di adapter keluar
mereka; Telegram melakukan ini sehingga `![alt](url)` tetap dapat menjadi balasan media.

Direktif ini terpisah. `MEDIA:` dan tag balasan/suara tetap menjadi metadata pengiriman; `[embed ...]` adalah jalur perenderan kaya khusus web.
Media hasil alat tepercaya menggunakan parser `MEDIA:` / `[[audio_as_voice]]` yang sama sebelum pengiriman, sehingga output alat teks tetap dapat menandai lampiran audio sebagai catatan suara.

Saat streaming blok diaktifkan, `MEDIA:` tetap menjadi metadata pengiriman tunggal untuk satu
giliran. Jika URL media yang sama dikirim dalam blok yang di-streaming dan diulang dalam payload
asisten final, OpenClaw mengirim lampiran sekali dan menghapus duplikat
dari payload final.

## `[embed ...]`

`[embed ...]` adalah satu-satunya sintaks perenderan kaya yang menghadap agen untuk Control UI.

Contoh self-closing:

```text
[embed ref="cv_123" title="Status" /]
```

Aturan:

- `[view ...]` tidak lagi valid untuk output baru.
- Shortcode embed hanya dirender di permukaan pesan asisten.
- Hanya embed yang didukung URL yang dirender. Gunakan `ref="..."` atau `url="..."`.
- Shortcode embed HTML inline berbentuk blok tidak dirender.
- UI web menghapus shortcode dari teks yang terlihat dan merender embed secara inline.
- `MEDIA:` bukan alias embed dan tidak boleh digunakan untuk perenderan embed kaya.

## Bentuk perenderan tersimpan

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

Blok kaya yang disimpan/dirender menggunakan bentuk `canvas` ini secara langsung. `present_view` tidak dikenali.

## Terkait

- [Adapter RPC](/id/reference/rpc)
- [Typebox](/id/concepts/typebox)
