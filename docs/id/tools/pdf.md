---
read_when:
    - Anda ingin menganalisis PDF dari agen
    - Anda memerlukan parameter dan batas alat PDF yang tepat
    - Anda sedang men-debug mode PDF asli versus mekanisme cadangan ekstraksi
summary: Analisis satu atau beberapa dokumen PDF dengan dukungan penyedia native dan fallback ekstraksi
title: Alat PDF
x-i18n:
    generated_at: "2026-06-27T18:20:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6cce4328a7457f30b8c64abdcfa94b6a5d5649c2bcdfde3187288b11a0e154b1
    source_path: tools/pdf.md
    workflow: 16
---

`pdf` menganalisis satu atau beberapa dokumen PDF dan mengembalikan teks.

Perilaku cepat:

- Mode penyedia bawaan untuk penyedia model Anthropic dan Google.
- Mode cadangan ekstraksi untuk penyedia lain (ekstrak teks terlebih dahulu, lalu gambar halaman bila diperlukan).
- Mendukung input tunggal (`pdf`) atau multi (`pdfs`), maksimum 10 PDF per panggilan.

## Ketersediaan

Alat ini hanya didaftarkan ketika OpenClaw dapat menyelesaikan konfigurasi model berkemampuan PDF untuk agen:

1. `agents.defaults.pdfModel`
2. cadangan ke `agents.defaults.imageModel`
3. cadangan ke model sesi/default agen yang terselesaikan
4. jika penyedia PDF bawaan didukung autentikasi, prioritaskan mereka sebelum kandidat cadangan gambar generik

Jika tidak ada model yang dapat digunakan yang bisa diselesaikan, alat `pdf` tidak diekspos.

Catatan ketersediaan:

- Rantai cadangan sadar autentikasi. `provider/model` yang dikonfigurasi hanya dihitung jika
  OpenClaw benar-benar dapat mengautentikasi penyedia tersebut untuk agen.
- Penyedia PDF bawaan saat ini adalah **Anthropic** dan **Google**.
- Jika penyedia sesi/default yang terselesaikan sudah memiliki model visi/PDF
  yang dikonfigurasi, alat PDF menggunakan ulang model itu sebelum beralih ke penyedia lain
  yang didukung autentikasi.

## Referensi input

<ParamField path="pdf" type="string">
Satu jalur atau URL PDF.
</ParamField>

<ParamField path="pdfs" type="string[]">
Beberapa jalur atau URL PDF, hingga total 10.
</ParamField>

<ParamField path="prompt" type="string" default="Analyze this PDF document.">
Prompt analisis.
</ParamField>

<ParamField path="pages" type="string">
Filter halaman seperti `1-5` atau `1,3,7-9`.
</ParamField>

<ParamField path="password" type="string">
Kata sandi untuk PDF terenkripsi dalam mode cadangan ekstraksi.
</ParamField>

<ParamField path="model" type="string">
Override model opsional dalam bentuk `provider/model`.
</ParamField>

<ParamField path="maxBytesMb" type="number">
Batas ukuran per PDF dalam MB. Default ke `agents.defaults.pdfMaxBytesMb` atau `10`.
</ParamField>

Catatan input:

- `pdf` dan `pdfs` digabungkan dan dideduplikasi sebelum dimuat.
- Jika tidak ada input PDF yang diberikan, alat menghasilkan galat.
- `pages` diurai sebagai nomor halaman berbasis 1, dideduplikasi, diurutkan, dan dibatasi ke maksimum halaman yang dikonfigurasi.
- `password` berlaku untuk setiap PDF dalam permintaan dan hanya digunakan oleh mode cadangan ekstraksi.
- `maxBytesMb` default ke `agents.defaults.pdfMaxBytesMb` atau `10`.

## Referensi PDF yang didukung

- jalur file lokal (termasuk ekspansi `~`)
- URL `file://`
- URL `http://` dan `https://`
- referensi masuk yang dikelola OpenClaw seperti `media://inbound/<id>`

Catatan referensi:

- Skema URI lain (misalnya `ftp://`) ditolak dengan `unsupported_pdf_reference`.
- Dalam mode sandbox, URL `http(s)` jarak jauh ditolak.
- Dengan kebijakan file khusus ruang kerja diaktifkan, jalur file lokal di luar root yang diizinkan ditolak.
- Referensi masuk terkelola dan jalur yang diputar ulang di bawah penyimpanan media masuk OpenClaw diizinkan dengan kebijakan file khusus ruang kerja.

## Mode eksekusi

### Mode penyedia bawaan

Mode bawaan digunakan untuk penyedia `anthropic` dan `google`.
Alat mengirim byte PDF mentah langsung ke API penyedia.

Batas mode bawaan:

- `pages` tidak didukung. Jika diatur, alat mengembalikan galat.
- `password` tidak didukung. Gunakan model non-bawaan untuk menganalisis PDF terenkripsi.
- Input multi-PDF didukung; setiap PDF dikirim sebagai blok dokumen bawaan /
  bagian PDF inline sebelum prompt.

### Mode cadangan ekstraksi

Mode cadangan digunakan untuk penyedia non-bawaan.

Alur:

1. Ekstrak teks dari halaman yang dipilih (hingga `agents.defaults.pdfMaxPages`, default `20`).
2. Jika panjang teks yang diekstrak di bawah `200` karakter, render halaman yang dipilih menjadi gambar PNG dan sertakan gambar tersebut.
3. Kirim konten yang diekstrak beserta prompt ke model yang dipilih.

Detail cadangan:

- Ekstraksi gambar halaman menggunakan anggaran piksel `4,000,000`.
- PDF terenkripsi dapat dibuka dengan parameter tingkat atas `password`.
- Jika model target tidak mendukung input gambar dan tidak ada teks yang dapat diekstrak, alat menghasilkan galat.
- Jika ekstraksi teks berhasil tetapi ekstraksi gambar akan membutuhkan visi pada
  model khusus teks, OpenClaw membuang gambar yang dirender dan melanjutkan dengan
  teks yang diekstrak.
- Cadangan ekstraksi menggunakan Plugin `document-extract` bawaan. Plugin memiliki
  `clawpdf`, yang menyediakan ekstraksi teks dan rendering gambar melalui PDFium
  WebAssembly.

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

- `model`: referensi model yang terselesaikan (`provider/model`)
- `native`: `true` untuk mode penyedia bawaan, `false` untuk cadangan
- `attempts`: upaya cadangan yang gagal sebelum berhasil

Kolom jalur:

- input PDF tunggal: `details.pdf`
- input beberapa PDF: `details.pdfs[]` dengan entri `pdf`
- metadata penulisan ulang jalur sandbox (bila berlaku): `rewrittenFrom`

## Perilaku galat

- Input PDF hilang: melempar `pdf required: provide a path or URL to a PDF document`
- Terlalu banyak PDF: mengembalikan galat terstruktur di `details.error = "too_many_pdfs"`
- Skema referensi tidak didukung: mengembalikan `details.error = "unsupported_pdf_reference"`
- Mode bawaan dengan `pages`: melempar galat jelas `pages is not supported with native PDF providers`

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

Model cadangan dengan filter halaman:

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Extract only customer-impacting incidents"
}
```

PDF terenkripsi dengan cadangan ekstraksi:

```json
{
  "pdf": "/tmp/locked.pdf",
  "password": "example-password",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Summarize this contract"
}
```

## Terkait

- [Ikhtisar Alat](/id/tools) - semua alat agen yang tersedia
- [Referensi Konfigurasi](/id/gateway/config-agents#agent-defaults) - konfigurasi pdfMaxBytesMb dan pdfMaxPages
