---
read_when:
    - Anda ingin menganalisis PDF dari agen
    - Anda memerlukan parameter dan batasan alat PDF yang tepat
    - Anda sedang menelusuri masalah mode PDF native dibandingkan fallback ekstraksi
summary: Analisis satu atau beberapa dokumen PDF dengan dukungan penyedia bawaan dan mekanisme cadangan ekstraksi
title: Alat PDF
x-i18n:
    generated_at: "2026-05-06T09:31:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: ac1cbbc363975d5571fe5b46b39e2d897e1b80b5859a1f44ef81050f55554444
    source_path: tools/pdf.md
    workflow: 16
---

`pdf` menganalisis satu atau beberapa dokumen PDF dan mengembalikan teks.

Perilaku cepat:

- Mode penyedia native untuk penyedia model Anthropic dan Google.
- Mode fallback ekstraksi untuk penyedia lain (ekstrak teks terlebih dahulu, lalu gambar halaman bila diperlukan).
- Mendukung input tunggal (`pdf`) atau beberapa input (`pdfs`), maksimal 10 PDF per panggilan.

## Ketersediaan

Alat ini hanya didaftarkan ketika OpenClaw dapat menyelesaikan konfigurasi model yang mendukung PDF untuk agen:

1. `agents.defaults.pdfModel`
2. fallback ke `agents.defaults.imageModel`
3. fallback ke model sesi/default agen yang diselesaikan
4. jika penyedia PDF native didukung autentikasi, prioritaskan penyedia tersebut sebelum kandidat fallback gambar generik

Jika tidak ada model yang dapat digunakan yang bisa diselesaikan, alat `pdf` tidak diekspos.

Catatan ketersediaan:

- Rantai fallback peka autentikasi. `provider/model` yang dikonfigurasi hanya dihitung jika
  OpenClaw benar-benar dapat mengautentikasi penyedia tersebut untuk agen.
- Penyedia PDF native saat ini adalah **Anthropic** dan **Google**.
- Jika penyedia sesi/default yang diselesaikan sudah memiliki model vision/PDF
  yang dikonfigurasi, alat PDF akan menggunakannya kembali sebelum fallback ke penyedia
  lain yang didukung autentikasi.

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

- `pdf` dan `pdfs` digabungkan dan dideduplikasi sebelum dimuat.
- Jika tidak ada input PDF yang diberikan, alat akan menghasilkan error.
- `pages` diparse sebagai nomor halaman berbasis 1, dideduplikasi, diurutkan, dan dibatasi ke jumlah halaman maksimal yang dikonfigurasi.
- `maxBytesMb` default ke `agents.defaults.pdfMaxBytesMb` atau `10`.

## Referensi PDF yang didukung

- path file lokal (termasuk ekspansi `~`)
- URL `file://`
- URL `http://` dan `https://`
- referensi inbound yang dikelola OpenClaw seperti `media://inbound/<id>`

Catatan referensi:

- Skema URI lain (misalnya `ftp://`) ditolak dengan `unsupported_pdf_reference`.
- Dalam mode sandbox, URL `http(s)` jarak jauh ditolak.
- Dengan kebijakan file hanya-workspace diaktifkan, path file lokal di luar root yang diizinkan ditolak.
- Referensi inbound terkelola dan path yang diputar ulang di bawah penyimpanan media inbound OpenClaw diizinkan dengan kebijakan file hanya-workspace.

## Mode eksekusi

### Mode penyedia native

Mode native digunakan untuk penyedia `anthropic` dan `google`.
Alat mengirim byte PDF mentah langsung ke API penyedia.

Batasan mode native:

- `pages` tidak didukung. Jika diatur, alat mengembalikan error.
- Input multi-PDF didukung; setiap PDF dikirim sebagai blok dokumen native /
  bagian PDF inline sebelum prompt.

### Mode fallback ekstraksi

Mode fallback digunakan untuk penyedia non-native.

Alur:

1. Ekstrak teks dari halaman yang dipilih (hingga `agents.defaults.pdfMaxPages`, default `20`).
2. Jika panjang teks yang diekstrak di bawah `200` karakter, render halaman yang dipilih menjadi gambar PNG dan sertakan gambar tersebut.
3. Kirim konten yang diekstrak beserta prompt ke model yang dipilih.

Detail fallback:

- Ekstraksi gambar halaman menggunakan anggaran piksel `4,000,000`.
- Jika model target tidak mendukung input gambar dan tidak ada teks yang dapat diekstrak, alat menghasilkan error.
- Jika ekstraksi teks berhasil tetapi ekstraksi gambar memerlukan vision pada
  model hanya-teks, OpenClaw membuang gambar yang dirender dan melanjutkan dengan
  teks yang diekstrak.
- Fallback ekstraksi menggunakan Plugin `document-extract` bawaan. Plugin memiliki
  `pdfjs-dist`; `@napi-rs/canvas` hanya digunakan ketika fallback rendering gambar
  tersedia.

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

Lihat [Referensi Konfigurasi](/id/gateway/configuration-reference) untuk detail lengkap kolom.

## Detail output

Alat mengembalikan teks di `content[0].text` dan metadata terstruktur di `details`.

Kolom `details` umum:

- `model`: referensi model yang diselesaikan (`provider/model`)
- `native`: `true` untuk mode penyedia native, `false` untuk fallback
- `attempts`: percobaan fallback yang gagal sebelum berhasil

Kolom path:

- input PDF tunggal: `details.pdf`
- beberapa input PDF: `details.pdfs[]` dengan entri `pdf`
- metadata penulisan ulang path sandbox (bila berlaku): `rewrittenFrom`

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

- [Ringkasan Alat](/id/tools) - semua alat agen yang tersedia
- [Referensi Konfigurasi](/id/gateway/config-agents#agent-defaults) - konfigurasi pdfMaxBytesMb dan pdfMaxPages
