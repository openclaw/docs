---
read_when:
    - Anda mengubah pemformatan Markdown atau pembagian chunk untuk saluran keluar
    - Anda sedang menambahkan pemformat kanal baru atau pemetaan gaya
    - Anda sedang menelusuri regresi pemformatan di seluruh saluran
summary: Pipeline pemformatan Markdown untuk saluran keluar
title: Pemformatan Markdown
x-i18n:
    generated_at: "2026-05-06T09:07:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9dcc75cec0462d610f2b5bbd258a2686b15eeb4b9d369ee4d7727571da7edcc
    source_path: concepts/markdown-formatting.md
    workflow: 16
---

OpenClaw memformat Markdown keluar dengan mengonversinya menjadi representasi perantara bersama (IR) sebelum merender keluaran khusus channel. IR menjaga teks sumber tetap utuh sambil membawa rentang gaya/tautan sehingga pemotongan dan rendering dapat tetap konsisten di seluruh channel.

## Tujuan

- **Konsistensi:** satu langkah parse, beberapa renderer.
- **Pemotongan aman:** pisahkan teks sebelum rendering sehingga format inline tidak pernah
  terputus di antara potongan.
- **Kesesuaian channel:** petakan IR yang sama ke Slack mrkdwn, HTML Telegram, dan rentang
  gaya Signal tanpa mem-parse ulang Markdown.

## Pipeline

1. **Parse Markdown -> IR**
   - IR adalah teks biasa ditambah rentang gaya (bold/italic/strike/code/spoiler) dan rentang tautan.
   - Offset berupa unit kode UTF-16 sehingga rentang gaya Signal selaras dengan API-nya.
   - Tabel hanya di-parse ketika sebuah channel memilih konversi tabel.
2. **Potong IR (format-first)**
   - Pemotongan terjadi pada teks IR sebelum rendering.
   - Format inline tidak terpecah di antara potongan; rentang dipotong per potongan.
3. **Render per channel**
   - **Slack:** token mrkdwn (bold/italic/strike/code), tautan sebagai `<url|label>`.
   - **Telegram:** tag HTML (`<b>`, `<i>`, `<s>`, `<code>`, `<pre><code>`, `<a href>`).
   - **Signal:** teks biasa + rentang `text-style`; tautan menjadi `label (url)` ketika label berbeda.

## Contoh IR

Input Markdown:

```markdown
Hello **world** - see [docs](https://docs.openclaw.ai).
```

IR (skematis):

```json
{
  "text": "Hello world - see docs.",
  "styles": [{ "start": 6, "end": 11, "style": "bold" }],
  "links": [{ "start": 19, "end": 23, "href": "https://docs.openclaw.ai" }]
}
```

## Tempat Ini Digunakan

- Adapter keluar Slack, Telegram, dan Signal merender dari IR.
- Channel lain (WhatsApp, iMessage, Microsoft Teams, Discord) masih menggunakan teks biasa atau
  aturan pemformatannya sendiri, dengan konversi tabel Markdown diterapkan sebelum
  pemotongan saat diaktifkan.

## Penanganan Tabel

Tabel Markdown tidak didukung secara konsisten di berbagai klien chat. Gunakan
`markdown.tables` untuk mengontrol konversi per channel (dan per akun).

- `code`: render tabel sebagai blok kode (default untuk sebagian besar channel).
- `bullets`: konversi setiap baris menjadi poin bullet (default untuk Signal + WhatsApp).
- `off`: nonaktifkan parsing dan konversi tabel; teks tabel mentah diteruskan apa adanya.

Kunci konfigurasi:

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

## Aturan Pemotongan

- Batas potongan berasal dari adapter/konfigurasi channel dan diterapkan ke teks IR.
- Code fence dipertahankan sebagai satu blok dengan newline di akhir sehingga channel
  merendernya dengan benar.
- Prefiks daftar dan prefiks blockquote adalah bagian dari teks IR, sehingga pemotongan
  tidak membelah di tengah prefiks.
- Gaya inline (bold/italic/strike/inline-code/spoiler) tidak pernah dipisah di antara
  potongan; renderer membuka kembali gaya di dalam setiap potongan.

Jika Anda membutuhkan informasi lebih lanjut tentang perilaku pemotongan di berbagai channel, lihat
[Streaming + pemotongan](/id/concepts/streaming).

## Kebijakan Tautan

- **Slack:** `[label](url)` -> `<url|label>`; URL polos tetap polos. Autolink
  dinonaktifkan saat parse untuk menghindari penautan ganda.
- **Telegram:** `[label](url)` -> `<a href="url">label</a>` (mode parse HTML).
- **Signal:** `[label](url)` -> `label (url)` kecuali label cocok dengan URL.

## Spoiler

Penanda spoiler (`||spoiler||`) hanya di-parse untuk Signal, tempat penanda itu dipetakan ke
rentang gaya SPOILER. Channel lain memperlakukannya sebagai teks biasa.

## Cara menambahkan atau memperbarui formatter channel

1. **Parse sekali:** gunakan helper bersama `markdownToIR(...)` dengan opsi yang sesuai untuk channel
   (autolink, gaya heading, prefiks blockquote).
2. **Render:** implementasikan renderer dengan `renderMarkdownWithMarkers(...)` dan
   peta penanda gaya (atau rentang gaya Signal).
3. **Potong:** panggil `chunkMarkdownIR(...)` sebelum rendering; render setiap potongan.
4. **Hubungkan adapter:** perbarui adapter keluar channel agar menggunakan chunker
   dan renderer baru.
5. **Uji:** tambahkan atau perbarui pengujian format dan pengujian pengiriman keluar jika
   channel menggunakan pemotongan.

## Hal yang Sering Menjebak

- Token kurung sudut Slack (`<@U123>`, `<#C123>`, `<https://...>`) harus
  dipertahankan; escape HTML mentah dengan aman.
- HTML Telegram memerlukan escaping teks di luar tag untuk menghindari markup rusak.
- Rentang gaya Signal bergantung pada offset UTF-16; jangan gunakan offset titik kode.
- Pertahankan newline di akhir untuk blok kode berpagar agar penanda penutup berada di
  barisnya sendiri.

## Terkait

<CardGroup cols={2}>
  <Card title="Streaming and chunking" href="/id/concepts/streaming" icon="bars-staggered">
    Perilaku streaming keluar, batas potongan, dan pengiriman khusus channel.
  </Card>
  <Card title="System prompt" href="/id/concepts/system-prompt" icon="message-lines">
    Apa yang dilihat model sebelum percakapan, termasuk file ruang kerja yang diinjeksi.
  </Card>
</CardGroup>
