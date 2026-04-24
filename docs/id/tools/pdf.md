---
read_when:
    - Anda ingin menganalisis PDF dari agen
    - Anda memerlukan parameter dan batas tool PDF yang tepat
    - Anda sedang men-debug mode PDF native vs fallback ekstraksi
summary: Analisis satu atau lebih dokumen PDF dengan dukungan provider native dan fallback ekstraksi
title: Tool PDF
x-i18n:
    generated_at: "2026-04-24T09:32:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 945838d1e1164a15720ca76eb156f9f299bf7f603f4591c8fa557b43e4cc93a8
    source_path: tools/pdf.md
    workflow: 15
---

`pdf` menganalisis satu atau lebih dokumen PDF dan mengembalikan teks.

Perilaku cepat:

- Mode provider native untuk provider model Anthropic dan Google.
- Mode fallback ekstraksi untuk provider lain (ekstrak teks terlebih dahulu, lalu gambar halaman saat diperlukan).
- Mendukung input tunggal (`pdf`) atau multi (`pdfs`), maksimal 10 PDF per panggilan.

## Ketersediaan

Tool ini hanya didaftarkan ketika OpenClaw dapat me-resolve konfigurasi model yang mampu PDF untuk agen:

1. `agents.defaults.pdfModel`
2. fallback ke `agents.defaults.imageModel`
3. fallback ke model sesi/default hasil resolve agen
4. jika provider PDF native didukung auth, prioritaskan mereka di atas kandidat fallback gambar generik

Jika tidak ada model yang dapat digunakan dan dapat di-resolve, tool `pdf` tidak diekspos.

Catatan ketersediaan:

- Rantai fallback sadar auth. `provider/model` yang dikonfigurasi hanya dihitung jika
  OpenClaw benar-benar dapat mengautentikasi provider tersebut untuk agen.
- Provider PDF native saat ini adalah **Anthropic** dan **Google**.
- Jika provider sesi/default hasil resolve sudah memiliki model vision/PDF
  yang dikonfigurasi, tool PDF menggunakan ulang model tersebut sebelum kembali ke provider lain yang didukung auth.

## Referensi input

<ParamField path="pdf" type="string">
Satu path atau URL PDF.
</ParamField>

<ParamField path="pdfs" type="string[]">
Beberapa path atau URL PDF, hingga total 10.
</ParamField>

<ParamField path="prompt" type="string" default="Analyze this PDF document.">
Prompt analisis.
</ParamField>

<ParamField path="pages" type="string">
Filter halaman seperti `1-5` atau `1,3,7-9`.
</ParamField>

<ParamField path="model" type="string">
Override model opsional dalam bentuk `provider/model`.
</ParamField>

<ParamField path="maxBytesMb" type="number">
Batas ukuran per PDF dalam MB. Default ke `agents.defaults.pdfMaxBytesMb` atau `10`.
</ParamField>

Catatan input:

- `pdf` dan `pdfs` digabungkan dan di-dedup sebelum dimuat.
- Jika tidak ada input PDF yang diberikan, tool akan error.
- `pages` diparse sebagai nomor halaman berbasis 1, di-dedup, diurutkan, dan dijepit ke halaman maksimum yang dikonfigurasi.
- `maxBytesMb` default ke `agents.defaults.pdfMaxBytesMb` atau `10`.

## Referensi PDF yang didukung

- path file lokal (termasuk ekspansi `~`)
- URL `file://`
- URL `http://` dan `https://`

Catatan referensi:

- Skema URI lain (misalnya `ftp://`) ditolak dengan `unsupported_pdf_reference`.
- Dalam mode sandbox, URL `http(s)` remote ditolak.
- Dengan kebijakan file workspace-only diaktifkan, path file lokal di luar root yang diizinkan ditolak.

## Mode eksekusi

### Mode provider native

Mode native digunakan untuk provider `anthropic` dan `google`.
Tool ini mengirim byte PDF mentah langsung ke API provider.

Batas mode native:

- `pages` tidak didukung. Jika disetel, tool akan mengembalikan error.
- Input multi-PDF didukung; setiap PDF dikirim sebagai blok dokumen native /
  bagian PDF inline sebelum prompt.

### Mode fallback ekstraksi

Mode fallback digunakan untuk provider non-native.

Alur:

1. Ekstrak teks dari halaman yang dipilih (hingga `agents.defaults.pdfMaxPages`, default `20`).
2. Jika panjang teks yang diekstrak kurang dari `200` karakter, render halaman yang dipilih menjadi gambar PNG dan sertakan.
3. Kirim konten yang diekstrak beserta prompt ke model yang dipilih.

Detail fallback:

- Ekstraksi gambar halaman menggunakan anggaran piksel `4,000,000`.
- Jika model target tidak mendukung input gambar dan tidak ada teks yang dapat diekstrak, tool akan error.
- Jika ekstraksi teks berhasil tetapi ekstraksi gambar memerlukan vision pada
  model yang hanya teks, OpenClaw menghapus gambar yang dirender dan melanjutkan
  dengan teks yang diekstrak.
- Fallback ekstraksi memerlukan `pdfjs-dist` (dan `@napi-rs/canvas` untuk rendering gambar).

## Konfigurasi

```json5
{
  agents: {
    defaults: {
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
    },
  },
}
```

Lihat [Referensi Konfigurasi](/id/gateway/configuration-reference) untuk detail field lengkap.

## Detail output

Tool mengembalikan teks di `content[0].text` dan metadata terstruktur di `details`.

Field `details` yang umum:

- `model`: ref model hasil resolve (`provider/model`)
- `native`: `true` untuk mode provider native, `false` untuk fallback
- `attempts`: upaya fallback yang gagal sebelum berhasil

Field path:

- input PDF tunggal: `details.pdf`
- input PDF ganda: `details.pdfs[]` dengan entri `pdf`
- metadata penulisan ulang path sandbox (jika berlaku): `rewrittenFrom`

## Perilaku error

- Input PDF hilang: melempar `pdf required: provide a path or URL to a PDF document`
- Terlalu banyak PDF: mengembalikan error terstruktur di `details.error = "too_many_pdfs"`
- Skema referensi tidak didukung: mengembalikan `details.error = "unsupported_pdf_reference"`
- Mode native dengan `pages`: melempar error jelas `pages is not supported with native PDF providers`

## Contoh

PDF tunggal:

```json
{
  "pdf": "/tmp/report.pdf",
  "prompt": "Summarize this report in 5 bullets"
}
```

Beberapa PDF:

```json
{
  "pdfs": ["/tmp/q1.pdf", "/tmp/q2.pdf"],
  "prompt": "Compare risks and timeline changes across both documents"
}
```

Model fallback yang difilter halaman:

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Extract only customer-impacting incidents"
}
```

## Terkait

- [Ikhtisar Tools](/id/tools) — semua tool agen yang tersedia
- [Referensi Konfigurasi](/id/gateway/config-agents#agent-defaults) — konfigurasi pdfMaxBytesMb dan pdfMaxPages
