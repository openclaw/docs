---
read_when:
    - Mengubah perenderan output asisten di Control UI
    - Men-debug `[embed ...]`, media terstruktur, balasan, atau direktif presentasi audio
summary: Protokol keluaran kaya untuk media terstruktur, sematan, petunjuk audio, dan balasan
title: Protokol output kaya
x-i18n:
    generated_at: "2026-06-27T18:11:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f5915f0ba29e6b0d27c99b1c7fdc632f1b58a4d96eae26bf6670205bd4fb88b1
    source_path: reference/rich-output-protocol.md
    workflow: 16
---

Output asisten dapat membawa sekumpulan kecil direktif pengiriman/perenderan:

- field terstruktur `mediaUrl` / `mediaUrls` untuk pengiriman lampiran
- `[[audio_as_voice]]` untuk petunjuk presentasi audio
- `[[reply_to_current]]` / `[[reply_to:<id>]]` untuk metadata balasan
- `[embed ...]` untuk rendering kaya Control UI

Lampiran media jarak jauh harus berupa URL `https:` publik. `http:` biasa,
loopback, link-local, privat, dan hostname internal diabaikan sebagai direktif
lampiran; pengambil media sisi server tetap menerapkan penjaga jaringannya sendiri.

Lampiran media lokal dapat menggunakan path absolut, path relatif terhadap workspace, atau
path `~/` relatif terhadap home. Lampiran tersebut tetap melewati kebijakan baca-file agen dan
pemeriksaan jenis media sebelum pengiriman.

<Warning>
Jangan mengeluarkan perintah teks untuk lampiran dari alat, plugin, blok streaming,
output browser, atau aksi pesan. Gunakan field media terstruktur sebagai gantinya.

Payload message-tool yang valid:

```json
{ "message": "Here is your image.", "mediaUrl": "/workspace/image.png" }
```

Teks balasan akhir asisten lama mungkin masih dinormalisasi untuk kompatibilitas, tetapi
itu bukan protokol plugin/alat umum.
</Warning>

Sintaks gambar Markdown biasa tetap berupa teks secara default. Saluran yang secara sengaja
memetakan balasan gambar Markdown ke lampiran media ikut serta di adaptor keluar
mereka; Telegram melakukan ini sehingga `![alt](url)` tetap dapat menjadi balasan media.

Direktif ini terpisah. Field media terstruktur dan tag balasan/suara adalah
metadata pengiriman; `[embed ...]` adalah jalur render kaya khusus web.

Saat streaming blok diaktifkan, media harus dibawa pada field payload terstruktur.
Jika URL media yang sama dikirim dalam blok yang di-streaming dan diulang dalam
payload akhir asisten, OpenClaw mengirim lampiran sekali dan menghapus duplikat
dari payload akhir.

## `[embed ...]`

`[embed ...]` adalah satu-satunya sintaks render kaya yang menghadap agen untuk Control UI.

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
- Media terstruktur bukan alias embed dan tidak boleh digunakan untuk rendering embed kaya.

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
