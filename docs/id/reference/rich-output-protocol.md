---
read_when:
    - Mengubah perenderan keluaran asisten di UI Kontrol
    - Men-debug arahan presentasi `[embed ...]`, `MEDIA:`, balasan, atau audio
summary: Protokol kode singkat keluaran kaya untuk sematan, media, petunjuk audio, dan balasan
title: Protokol keluaran kaya
x-i18n:
    generated_at: "2026-05-02T22:22:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8e0c365029c26d198090e1f181703e3979394afb0dfa1742f9c088885650de8b
    source_path: reference/rich-output-protocol.md
    workflow: 16
---

Keluaran asisten dapat membawa sekumpulan kecil direktif pengiriman/rendering:

- `MEDIA:` untuk pengiriman lampiran
- `[[audio_as_voice]]` untuk petunjuk penyajian audio
- `[[reply_to_current]]` / `[[reply_to:<id>]]` untuk metadata balasan
- `[embed ...]` untuk rendering kaya Control UI

Lampiran `MEDIA:` jarak jauh harus berupa URL `https:` publik. `http:` biasa,
loopback, link-local, privat, dan nama host internal diabaikan sebagai direktif
lampiran; pengambil media sisi server tetap memberlakukan penjaga jaringan
mereka sendiri.

Lampiran `MEDIA:` lokal dapat menggunakan path absolut, path relatif terhadap
workspace, atau path relatif terhadap home `~/`. Lampiran tersebut tetap melewati
kebijakan baca file agen dan pemeriksaan jenis media sebelum pengiriman.

Sintaks gambar Markdown biasa tetap berupa teks secara default. Channel yang
secara sengaja memetakan balasan gambar Markdown ke lampiran media memilih ikut
di adaptor keluar mereka; Telegram melakukan ini agar `![alt](url)` tetap dapat
menjadi balasan media.

Direktif ini terpisah. `MEDIA:` dan tag balasan/suara tetap menjadi metadata pengiriman; `[embed ...]` adalah jalur rendering kaya khusus web.
Media hasil alat tepercaya menggunakan parser `MEDIA:` / `[[audio_as_voice]]` yang sama sebelum pengiriman, sehingga keluaran alat teks tetap dapat menandai lampiran audio sebagai catatan suara.

Saat streaming blok diaktifkan, `MEDIA:` tetap menjadi metadata pengiriman
tunggal untuk sebuah giliran. Jika URL media yang sama dikirim dalam blok yang
di-stream dan diulang dalam payload asisten final, OpenClaw mengirim lampiran
sekali dan menghapus duplikat dari payload final.

## `[embed ...]`

`[embed ...]` adalah satu-satunya sintaks rendering kaya yang berhadapan dengan agen untuk Control UI.

Contoh self-closing:

```text
[embed ref="cv_123" title="Status" /]
```

Aturan:

- `[view ...]` tidak lagi valid untuk keluaran baru.
- Shortcode embed dirender hanya di permukaan pesan asisten.
- Hanya embed yang didukung URL yang dirender. Gunakan `ref="..."` atau `url="..."`.
- Shortcode embed HTML inline berbentuk blok tidak dirender.
- UI web menghapus shortcode dari teks yang terlihat dan merender embed secara inline.
- `MEDIA:` bukan alias embed dan tidak boleh digunakan untuk rendering embed kaya.

## Bentuk rendering tersimpan

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

- [Adaptor RPC](/id/reference/rpc)
- [Typebox](/id/concepts/typebox)
