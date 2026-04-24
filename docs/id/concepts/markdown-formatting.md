---
read_when:
    - Anda sedang mengubah pemformatan Markdown atau chunking untuk channel keluar
    - Anda sedang menambahkan formatter channel baru atau pemetaan gaya
    - Anda sedang men-debug regresi pemformatan di berbagai channel
summary: Pipeline pemformatan Markdown untuk channel keluar
title: Pemformatan Markdown
x-i18n:
    generated_at: "2026-04-24T09:04:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: cf052e11fe9fd075a4337ffa555391c7003a346240b57bb65054c3f08401dfd9
    source_path: concepts/markdown-formatting.md
    workflow: 15
---

OpenClaw memformat Markdown keluar dengan mengonversinya ke representasi
menengah bersama (IR) sebelum merender output khusus channel. IR menjaga teks
sumber tetap utuh sambil membawa span gaya/tautan sehingga chunking dan rendering dapat
tetap konsisten di berbagai channel.

## Tujuan

- **Konsistensi:** satu langkah parsing, banyak renderer.
- **Chunking aman:** pisahkan teks sebelum rendering agar pemformatan inline tidak
  pernah rusak di antara potongan.
- **Sesuai channel:** petakan IR yang sama ke Slack mrkdwn, HTML Telegram, dan rentang gaya Signal
  tanpa mem-parsing ulang Markdown.

## Pipeline

1. **Parse Markdown -> IR**
   - IR adalah teks biasa ditambah span gaya (tebal/miring/coret/kode/spoiler) dan span tautan.
   - Offset menggunakan unit kode UTF-16 agar rentang gaya Signal selaras dengan API-nya.
   - Tabel diparse hanya saat sebuah channel memilih konversi tabel.
2. **Chunk IR (format-first)**
   - Chunking terjadi pada teks IR sebelum rendering.
   - Pemformatan inline tidak terpecah antar potongan; span diiris per potongan.
3. **Render per channel**
   - **Slack:** token mrkdwn (tebal/miring/coret/kode), tautan sebagai `<url|label>`.
   - **Telegram:** tag HTML (`<b>`, `<i>`, `<s>`, `<code>`, `<pre><code>`, `<a href>`).
   - **Signal:** teks biasa + rentang `text-style`; tautan menjadi `label (url)` saat label berbeda.

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

## Tempat digunakan

- Adapter keluar Slack, Telegram, dan Signal merender dari IR.
- Channel lain (WhatsApp, iMessage, Microsoft Teams, Discord) masih menggunakan teks biasa atau
  aturan pemformatan mereka sendiri, dengan konversi tabel Markdown diterapkan sebelum
  chunking saat diaktifkan.

## Penanganan tabel

Tabel Markdown tidak didukung secara konsisten di berbagai klien chat. Gunakan
`markdown.tables` untuk mengontrol konversi per channel (dan per akun).

- `code`: render tabel sebagai blok kode (default untuk sebagian besar channel).
- `bullets`: konversi setiap baris menjadi poin-poin (default untuk Signal + WhatsApp).
- `off`: nonaktifkan parsing dan konversi tabel; teks tabel mentah diteruskan.

Key konfigurasi:

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

- Batas potongan berasal dari adapter/konfigurasi channel dan diterapkan pada teks IR.
- Pagar kode dipertahankan sebagai satu blok dengan newline penutup agar channel
  merendernya dengan benar.
- Prefiks daftar dan prefiks blockquote adalah bagian dari teks IR, sehingga chunking
  tidak terpecah di tengah prefiks.
- Gaya inline (tebal/miring/coret/kode-inline/spoiler) tidak pernah dipecah di antara
  potongan; renderer membuka ulang gaya di dalam setiap potongan.

Jika Anda memerlukan detail lebih lanjut tentang perilaku chunking di berbagai channel, lihat
[Streaming + chunking](/id/concepts/streaming).

## Kebijakan tautan

- **Slack:** `[label](url)` -> `<url|label>`; URL polos tetap polos. Autolink
  dinonaktifkan saat parsing untuk menghindari tautan ganda.
- **Telegram:** `[label](url)` -> `<a href="url">label</a>` (mode parse HTML).
- **Signal:** `[label](url)` -> `label (url)` kecuali label cocok dengan URL.

## Spoiler

Penanda spoiler (`||spoiler||`) diparse hanya untuk Signal, tempat penanda itu dipetakan ke
rentang gaya SPOILER. Channel lain memperlakukannya sebagai teks biasa.

## Cara menambahkan atau memperbarui formatter channel

1. **Parse sekali:** gunakan helper bersama `markdownToIR(...)` dengan opsi
   yang sesuai untuk channel (autolink, gaya heading, prefiks blockquote).
2. **Render:** implementasikan renderer dengan `renderMarkdownWithMarkers(...)` dan
   peta penanda gaya (atau rentang gaya Signal).
3. **Chunk:** panggil `chunkMarkdownIR(...)` sebelum rendering; render tiap potongan.
4. **Hubungkan adapter:** perbarui adapter keluar channel agar menggunakan chunker
   dan renderer baru.
5. **Uji:** tambahkan atau perbarui uji format dan uji pengiriman keluar jika
   channel menggunakan chunking.

## Hal umum yang perlu diwaspadai

- Token tanda-kurung-sudut Slack (`<@U123>`, `<#C123>`, `<https://...>`) harus
  dipertahankan; escape HTML mentah dengan aman.
- HTML Telegram memerlukan escape teks di luar tag agar markup tidak rusak.
- Rentang gaya Signal bergantung pada offset UTF-16; jangan gunakan offset code point.
- Pertahankan newline penutup untuk blok kode berpagar agar penanda penutup berada
  di barisnya sendiri.

## Terkait

- [Streaming and chunking](/id/concepts/streaming)
- [System prompt](/id/concepts/system-prompt)
