---
read_when:
    - Anda sedang mengubah pemformatan atau pemenggalan Markdown untuk saluran keluar
    - Anda sedang menambahkan pemformat channel atau pemetaan gaya baru
    - Anda sedang men-debug regresi pemformatan di berbagai kanal
summary: Pipeline pemformatan Markdown untuk kanal keluar
title: Pemformatan Markdown
x-i18n:
    generated_at: "2026-07-12T14:09:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f9a35fd9a6386068e1e3bec73ec6e692f49239b468f42dd737f919b1c6a88e41
    source_path: concepts/markdown-formatting.md
    workflow: 16
---

OpenClaw mengonversi Markdown keluar menjadi representasi perantara bersama
(IR) sebelum merender keluaran khusus kanal. IR menyimpan teks biasa beserta
rentang gaya/tautan, sehingga satu langkah penguraian digunakan oleh setiap kanal dan pemotongan
tidak pernah membagi pemformatan di tengah rentang.

## Alur pemrosesan

1. **Uraikan Markdown menjadi IR** (`markdownToIR`) - teks biasa beserta rentang gaya
   (tebal, miring, coret, kode, blok kode, spoiler, kutipan blok,
   judul 1-6) dan rentang tautan. Offset menggunakan unit kode UTF-16 agar rentang gaya
   Signal selaras langsung dengan API-nya. Tabel hanya diuraikan jika kanal
   mengaktifkan mode tabel.
2. **Potong IR** (`chunkMarkdownIR` / `renderMarkdownIRChunksWithinLimit`)
   - pemisahan dilakukan pada teks IR sebelum perenderan, sehingga gaya sebaris dan
     tautan dipotong per potongan alih-alih terputus pada batas.
3. **Render per kanal** (`renderMarkdownWithMarkers`) - peta penanda gaya
   mengubah rentang menjadi markup asli kanal.

| Kanal                                                            | Perender                                                                             | Catatan                                                                                  |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Slack                                                            | token mrkdwn (`*bold*`, `_italic_`, `` `code` ``, pagar kode)                         | Tautan menjadi `<url\|label>`; tautan otomatis dinonaktifkan saat penguraian untuk menghindari tautan ganda |
| Telegram                                                         | tag HTML (`<b>`, `<i>`, `<s>`, `<code>`, `<pre><code>`, `<a href>`, `<tg-spoiler>`) | Juga mendukung tabel dan judul pesan kaya (`<h1>`-`<h6>`) saat `richMessages` aktif |
| Signal                                                           | teks biasa + rentang `text-style`                                                     | Tautan dirender sebagai `label (url)` jika label berbeda dari URL                        |
| Discord, WhatsApp, iMessage, Microsoft Teams, dan kanal lainnya  | teks biasa                                                                           | Tanpa penataan berbasis IR; konversi tabel Markdown tetap dijalankan melalui `convertMarkdownTables` |

## Contoh IR

Markdown masukan:
__OC_I18N_900000__
IR (skematis):
__OC_I18N_900001__
## Penanganan tabel

`markdown.tables` mengontrol cara kanal mengonversi tabel Markdown, per
kanal dan secara opsional per akun:

| Mode      | Perilaku                                                                             |
| --------- | ------------------------------------------------------------------------------------ |
| `code`    | Render sebagai tabel ASCII yang disejajarkan di dalam blok kode (nilai bawaan cadangan) |
| `bullets` | Konversi setiap baris menjadi poin butir `label: value`                              |
| `block`   | Pertahankan tabel asli jika transportasi mendukungnya; jika tidak, gunakan `code` sebagai cadangan |
| `off`     | Nonaktifkan penguraian tabel; teks tabel mentah diteruskan tanpa perubahan            |

Nilai bawaan Plugin per kanal: Signal, WhatsApp, dan Matrix menggunakan
`bullets` secara bawaan; Mattermost menggunakan `off` secara bawaan; Telegram menggunakan `block` secara bawaan (yang
ditetapkan menjadi `code` kecuali akun mengaktifkan `richMessages`). Setiap
kanal tanpa nilai bawaan Plugin eksplisit menggunakan `code` sebagai cadangan.
__OC_I18N_900002__
## Aturan pemotongan

- Batas potongan berasal dari adaptor/konfigurasi kanal dan berlaku untuk teks IR, bukan
  keluaran yang telah dirender.
- Blok kode berpagar dipertahankan sebagai satu blok dengan baris baru di akhir agar
  kanal merender pagar penutup dengan benar.
- Awalan daftar dan kutipan blok merupakan bagian dari teks IR, sehingga pemotongan tidak pernah
  membagi di tengah awalan.
- Gaya sebaris tidak pernah terbagi di antara potongan; perender membuka kembali gaya yang masih aktif
  di awal potongan berikutnya.

Lihat [Streaming dan pemotongan](/concepts/streaming) untuk perilaku batas potongan dan
pengiriman di berbagai kanal.

## Kebijakan tautan

- **Slack:** `[label](url)` -> `<url|label>`; URL polos tetap polos.
- **Telegram:** `[label](url)` -> `<a href="url">label</a>` (mode penguraian HTML).
- **Signal:** `[label](url)` -> `label (url)` kecuali label sudah
  cocok dengan URL.

## Spoiler

Penanda spoiler (`||spoiler||`) diuraikan untuk Signal (dipetakan ke rentang gaya `SPOILER`)
dan Telegram (dipetakan ke `<tg-spoiler>`). Kanal lain memperlakukan
`||...||` sebagai teks biasa.

## Menambahkan atau memperbarui pemformat kanal

1. **Uraikan sekali** dengan `markdownToIR(...)`, dengan meneruskan opsi yang sesuai untuk kanal
   (`autolink`, `headingStyle`, `blockquotePrefix`, `tableMode`).
2. **Render** dengan `renderMarkdownWithMarkers(...)` dan peta penanda gaya (atau
   logika rentang gaya khusus untuk transportasi seperti Signal).
3. **Potong** dengan `chunkMarkdownIR(...)` atau
   `renderMarkdownIRChunksWithinLimit(...)` sebelum merender setiap potongan.
4. **Hubungkan adaptor** agar memanggil pemotong dan perender baru dari
   jalur pengiriman keluar.
5. **Uji** dengan pengujian format serta pengujian pengiriman keluar jika kanal
   melakukan pemotongan.

## Kendala umum

- Token kurung sudut Slack (`<@U123>`, `<#C123>`, `<https://...>`) harus
  tetap utuh saat pengodean; HTML mentah tetap harus dikodekan dengan aman.
- HTML Telegram memerlukan pengodean teks di luar tag untuk menghindari markup yang rusak.
- Rentang gaya Signal menggunakan offset UTF-16, bukan offset titik kode.
- Pertahankan baris baru di akhir blok kode berpagar agar penanda penutup
  berada pada baris tersendiri.

## Terkait

<CardGroup cols={2}>
  <Card title="Streaming dan pemotongan" href="/id/concepts/streaming" icon="bars-staggered">
    Perilaku streaming keluar, batas potongan, dan pengiriman khusus kanal.
  </Card>
  <Card title="Prompt sistem" href="/id/concepts/system-prompt" icon="message-lines">
    Hal yang dilihat model sebelum percakapan, termasuk berkas ruang kerja yang disuntikkan.
  </Card>
</CardGroup>
