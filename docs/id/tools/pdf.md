---
read_when:
    - Anda ingin menganalisis PDF dari agen
    - Anda memerlukan parameter dan batas tool pdf yang tepat
    - Anda sedang men-debug mode PDF native vs fallback ekstraksi
summary: Menganalisis satu atau lebih dokumen PDF dengan dukungan provider native dan fallback ekstraksi
title: Tool PDF
x-i18n:
    generated_at: "2026-04-05T14:08:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: d7aaaa7107d7920e7c31f3e38ac19411706e646186acf520bc02f2c3e49c0517
    source_path: tools/pdf.md
    workflow: 15
---

# Tool PDF

`pdf` menganalisis satu atau lebih dokumen PDF dan mengembalikan teks.

Perilaku singkat:

- Mode provider native untuk provider model Anthropic dan Google.
- Mode fallback ekstraksi untuk provider lain (ekstrak teks terlebih dahulu, lalu gambar halaman bila diperlukan).
- Mendukung input tunggal (`pdf`) atau banyak (`pdfs`), maksimum 10 PDF per panggilan.

## Ketersediaan

Tool ini hanya didaftarkan ketika OpenClaw dapat meresolve config model yang mampu menangani PDF untuk agen:

1. `agents.defaults.pdfModel`
2. fallback ke `agents.defaults.imageModel`
3. fallback ke model sesi/default agen yang sudah ter-resolve
4. jika provider PDF-native berbasis auth, prioritaskan mereka di depan kandidat fallback gambar generik

Jika tidak ada model yang dapat digunakan yang bisa di-resolve, tool `pdf` tidak akan diekspos.

Catatan ketersediaan:

- Rantai fallback sadar-auth. `provider/model` yang dikonfigurasi hanya dihitung jika
  OpenClaw benar-benar dapat mengautentikasi provider tersebut untuk agen.
- Provider PDF native saat ini adalah **Anthropic** dan **Google**.
- Jika provider sesi/default yang sudah ter-resolve sudah memiliki model vision/PDF
  yang dikonfigurasi, tool PDF akan menggunakannya kembali sebelum fallback ke provider lain yang didukung auth.

## Referensi input

- `pdf` (`string`): satu path atau URL PDF
- `pdfs` (`string[]`): beberapa path atau URL PDF, hingga total 10
- `prompt` (`string`): prompt analisis, default `Analyze this PDF document.`
- `pages` (`string`): filter halaman seperti `1-5` atau `1,3,7-9`
- `model` (`string`): override model opsional (`provider/model`)
- `maxBytesMb` (`number`): batas ukuran per PDF dalam MB

Catatan input:

- `pdf` dan `pdfs` digabungkan dan di-deduplicate sebelum dimuat.
- Jika tidak ada input PDF yang diberikan, tool akan menghasilkan error.
- `pages` diparse sebagai nomor halaman berbasis 1, di-deduplicate, diurutkan, dan dibatasi ke jumlah halaman maksimum yang dikonfigurasi.
- `maxBytesMb` default ke `agents.defaults.pdfMaxBytesMb` atau `10`.

## Referensi PDF yang didukung

- path file lokal (termasuk ekspansi `~`)
- URL `file://`
- URL `http://` dan `https://`

Catatan referensi:

- Skema URI lain (misalnya `ftp://`) ditolak dengan `unsupported_pdf_reference`.
- Dalam mode sandbox, URL `http(s)` jarak jauh ditolak.
- Jika kebijakan file workspace-only diaktifkan, path file lokal di luar root yang diizinkan akan ditolak.

## Mode eksekusi

### Mode provider native

Mode native digunakan untuk provider `anthropic` dan `google`.
Tool mengirim byte PDF mentah langsung ke API provider.

Batas mode native:

- `pages` tidak didukung. Jika disetel, tool mengembalikan error.
- Input multi-PDF didukung; setiap PDF dikirim sebagai blok dokumen native /
  bagian PDF inline sebelum prompt.

### Mode fallback ekstraksi

Mode fallback digunakan untuk provider non-native.

Alur:

1. Ekstrak teks dari halaman yang dipilih (hingga `agents.defaults.pdfMaxPages`, default `20`).
2. Jika panjang teks yang diekstrak di bawah `200` karakter, render halaman yang dipilih ke gambar PNG dan sertakan.
3. Kirim konten yang diekstrak plus prompt ke model yang dipilih.

Detail fallback:

- Ekstraksi gambar halaman menggunakan anggaran piksel `4,000,000`.
- Jika model target tidak mendukung input gambar dan tidak ada teks yang dapat diekstrak, tool menghasilkan error.
- Jika ekstraksi teks berhasil tetapi ekstraksi gambar akan memerlukan vision pada
  model text-only, OpenClaw membuang gambar yang dirender dan melanjutkan dengan
  teks yang diekstrak.
- Fallback ekstraksi memerlukan `pdfjs-dist` (dan `@napi-rs/canvas` untuk rendering gambar).

## Config

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

Tool mengembalikan teks dalam `content[0].text` dan metadata terstruktur dalam `details`.

Field `details` umum:

- `model`: ref model yang ter-resolve (`provider/model`)
- `native`: `true` untuk mode provider native, `false` untuk fallback
- `attempts`: percobaan fallback yang gagal sebelum berhasil

Field path:

- input PDF tunggal: `details.pdf`
- input banyak PDF: `details.pdfs[]` dengan entri `pdf`
- metadata penulisan ulang path sandbox (jika berlaku): `rewrittenFrom`

## Perilaku error

- Input PDF hilang: melempar `pdf required: provide a path or URL to a PDF document`
- Terlalu banyak PDF: mengembalikan error terstruktur di `details.error = "too_many_pdfs"`
- Skema referensi tidak didukung: mengembalikan `details.error = "unsupported_pdf_reference"`
- Mode native dengan `pages`: melempar error yang jelas `pages is not supported with native PDF providers`

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

Model fallback dengan filter halaman:

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Extract only customer-impacting incidents"
}
```

## Terkait

- [Ikhtisar Tool](/tools) — semua tool agen yang tersedia
- [Referensi Konfigurasi](/id/gateway/configuration-reference#agent-defaults) — config pdfMaxBytesMb dan pdfMaxPages
