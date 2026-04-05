---
read_when:
    - Anda sedang mengubah pemformatan markdown atau chunking untuk kanal keluar
    - Anda sedang menambahkan formatter kanal baru atau pemetaan gaya
    - Anda sedang men-debug regresi pemformatan di seluruh kanal
summary: Pipeline pemformatan Markdown untuk kanal keluar
title: Pemformatan Markdown
x-i18n:
    generated_at: "2026-04-05T13:51:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: f3794674e30e265208d14a986ba9bdc4ba52e0cb69c446094f95ca6c674e4566
    source_path: concepts/markdown-formatting.md
    workflow: 15
---

# Pemformatan Markdown

OpenClaw memformat Markdown keluar dengan mengubahnya menjadi representasi
menengah bersama (IR) sebelum merender output khusus kanal. IR menjaga teks
sumber tetap utuh sambil membawa span gaya/tautan sehingga chunking dan rendering dapat
tetap konsisten di seluruh kanal.

## Tujuan

- **Konsistensi:** satu langkah parsing, banyak renderer.
- **Chunking aman:** membagi teks sebelum rendering agar pemformatan inline tidak
  pernah rusak di antara chunk.
- **Sesuai kanal:** memetakan IR yang sama ke Slack mrkdwn, HTML Telegram, dan
  rentang gaya Signal tanpa mem-parsing ulang Markdown.

## Pipeline

1. **Parse Markdown -> IR**
   - IR berupa teks biasa ditambah span gaya (bold/italic/strike/code/spoiler) dan span tautan.
   - Offset menggunakan unit kode UTF-16 agar rentang gaya Signal selaras dengan API-nya.
   - Tabel diparse hanya saat sebuah kanal memilih konversi tabel.
2. **Chunk IR (format-first)**
   - Chunking dilakukan pada teks IR sebelum rendering.
   - Pemformatan inline tidak dibagi di antara chunk; span diiris per chunk.
3. **Render per kanal**
   - **Slack:** token mrkdwn (bold/italic/strike/code), tautan sebagai `<url|label>`.
   - **Telegram:** tag HTML (`<b>`, `<i>`, `<s>`, `<code>`, `<pre><code>`, `<a href>`).
   - **Signal:** teks biasa + rentang `text-style`; tautan menjadi `label (url)` ketika label berbeda.

## Contoh IR

Input Markdown:

```markdown
Hello **world** — see [docs](https://docs.openclaw.ai).
```

IR (skematis):

```json
{
  "text": "Hello world — see docs.",
  "styles": [{ "start": 6, "end": 11, "style": "bold" }],
  "links": [{ "start": 19, "end": 23, "href": "https://docs.openclaw.ai" }]
}
```

## Tempat ini digunakan

- Adapter keluar Slack, Telegram, dan Signal merender dari IR.
- Kanal lain (WhatsApp, iMessage, Microsoft Teams, Discord) masih menggunakan teks biasa atau
  aturan pemformatannya sendiri, dengan konversi tabel Markdown diterapkan sebelum
  chunking saat diaktifkan.

## Penanganan tabel

Tabel Markdown tidak didukung secara konsisten di seluruh klien chat. Gunakan
`markdown.tables` untuk mengontrol konversi per kanal (dan per akun).

- `code`: render tabel sebagai code block (default untuk sebagian besar kanal).
- `bullets`: konversi setiap baris menjadi poin bullet (default untuk Signal + WhatsApp).
- `off`: nonaktifkan parsing dan konversi tabel; teks tabel mentah diteruskan.

Kunci config:

```yaml
channels:
  discord:
    markdown:
      tables: code
    accounts:
      work:
        markdown:
          tables: off
```

## Aturan chunking

- Batas chunk berasal dari adapter/config kanal dan diterapkan pada teks IR.
- Code fence dipertahankan sebagai satu blok dengan newline di akhir agar kanal
  merendernya dengan benar.
- Prefiks daftar dan prefiks blockquote adalah bagian dari teks IR, sehingga chunking
  tidak membelah di tengah prefiks.
- Gaya inline (bold/italic/strike/inline-code/spoiler) tidak pernah dibagi di antara
  chunk; renderer membuka ulang gaya di dalam setiap chunk.

Jika Anda memerlukan detail lebih lanjut tentang perilaku chunking di seluruh kanal, lihat
[Streaming + chunking](/concepts/streaming).

## Kebijakan tautan

- **Slack:** `[label](url)` -> `<url|label>`; URL polos tetap apa adanya. Autolink
  dinonaktifkan saat parsing untuk menghindari penautan ganda.
- **Telegram:** `[label](url)` -> `<a href="url">label</a>` (mode parse HTML).
- **Signal:** `[label](url)` -> `label (url)` kecuali label sama dengan URL.

## Spoiler

Penanda spoiler (`||spoiler||`) diparse hanya untuk Signal, yang memetakannya ke
rentang gaya SPOILER. Kanal lain memperlakukannya sebagai teks biasa.

## Cara menambahkan atau memperbarui formatter kanal

1. **Parse sekali:** gunakan helper bersama `markdownToIR(...)` dengan opsi
   yang sesuai untuk kanal (autolink, gaya heading, prefiks blockquote).
2. **Render:** implementasikan renderer dengan `renderMarkdownWithMarkers(...)` dan
   peta penanda gaya (atau rentang gaya Signal).
3. **Chunk:** panggil `chunkMarkdownIR(...)` sebelum rendering; render setiap chunk.
4. **Hubungkan adapter:** perbarui adapter keluar kanal agar menggunakan chunker
   dan renderer yang baru.
5. **Uji:** tambahkan atau perbarui pengujian format dan pengujian pengiriman keluar jika
   kanal menggunakan chunking.

## Hal umum yang perlu diwaspadai

- Token kurung sudut Slack (`<@U123>`, `<#C123>`, `<https://...>`) harus
  dipertahankan; escape HTML mentah dengan aman.
- HTML Telegram memerlukan escape teks di luar tag agar markup tidak rusak.
- Rentang gaya Signal bergantung pada offset UTF-16; jangan gunakan offset code point.
- Pertahankan newline di akhir untuk fenced code block agar penanda penutup berada
  pada barisnya sendiri.
