---
read_when:
    - Anda ingin menganalisis PDF dari agen
    - Anda memerlukan parameter dan batasan alat pdf yang tepat
    - Anda sedang men-debug mode PDF native dibandingkan dengan fallback ekstraksi
summary: Analisis satu atau beberapa dokumen PDF dengan dukungan penyedia native dan ekstraksi cadangan
title: Alat PDF
x-i18n:
    generated_at: "2026-07-12T14:45:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54bde94a2b70fd209c70c13a1e75dc81c6cbebca7f6d56776bf37fa62cd78254
    source_path: tools/pdf.md
    workflow: 16
---

`pdf` menganalisis satu atau beberapa dokumen PDF dan mengembalikan teks. Alat ini menggunakan masukan dokumen native pada model Anthropic dan Google, serta beralih ke ekstraksi teks/gambar untuk setiap penyedia lainnya.

## Ketersediaan

Alat ini hanya didaftarkan ketika OpenClaw dapat menentukan model berkemampuan PDF untuk agen. Urutan penentuan:

1. `agents.defaults.pdfModel` (model utama/cadangan eksplisit)
2. `agents.defaults.imageModel` (model utama/cadangan eksplisit)
3. Model sesi/default agen yang telah ditentukan, jika penyedianya mendukung masukan PDF native (Anthropic, Google) atau telah memiliki model visi yang dikonfigurasi
4. Penyedia berkemampuan gambar/visi yang terdeteksi otomatis dengan autentikasi yang dapat digunakan, dengan memprioritaskan penyedia PDF native

Autentikasi setiap kandidat cadangan diperiksa sebelum digunakan, sehingga `provider/model` yang dikonfigurasi hanya dianggap valid jika OpenClaw dapat mengautentikasi penyedia tersebut untuk agen. Jika tidak ada model yang dapat digunakan, alat `pdf` tidak tersedia.

## Referensi masukan

<ParamField path="pdf" type="string">
Satu jalur atau URL PDF.
</ParamField>

<ParamField path="pdfs" type="string[]">
Beberapa jalur atau URL PDF, maksimal 10 secara keseluruhan.
</ParamField>

<ParamField path="prompt" type="string" default="Analyze this PDF document.">
Prompt analisis.
</ParamField>

<ParamField path="pages" type="string">
Filter halaman seperti `1-5` atau `1,3,7-9`. Tidak didukung dalam mode penyedia native.
</ParamField>

<ParamField path="password" type="string">
Kata sandi untuk PDF terenkripsi. Berlaku untuk setiap PDF dalam permintaan; hanya digunakan oleh mode cadangan ekstraksi.
</ParamField>

<ParamField path="model" type="string">
Pengesampingan model opsional dalam format `provider/model`.
</ParamField>

<ParamField path="maxBytesMb" type="number">
Batas ukuran per PDF dalam MB. Default-nya adalah `agents.defaults.pdfMaxBytesMb`, atau `10` jika tidak ditetapkan.
</ParamField>

Catatan:

- `pdf` dan `pdfs` digabungkan dan dideduplikasi sebelum dimuat; setidaknya salah satunya wajib disediakan.
- `pages` diuraikan sebagai nomor halaman berbasis 1, dideduplikasi, diurutkan, dan dibatasi hingga `agents.defaults.pdfMaxPages` (default `20`). Rentang yang tidak cocok dengan halaman mana pun dalam batas akan menghasilkan galat sebelum pemanggilan model.

## Referensi PDF yang didukung

- Jalur berkas lokal (termasuk perluasan `~`)
- URL `file://`
- URL `http://` dan `https://`
- Referensi masuk yang dikelola OpenClaw seperti `media://inbound/<id>`

Skema URI lainnya (misalnya `ftp://`) mengembalikan `details.error = "unsupported_pdf_reference"`. URL `http(s)` jarak jauh ditolak saat alat berjalan dalam sandbox. Jika kebijakan berkas khusus ruang kerja diaktifkan, jalur lokal di luar root yang diizinkan akan ditolak; referensi masuk terkelola dan jalur yang diputar ulang di bawah penyimpanan media masuk OpenClaw tetap diizinkan.

## Mode eksekusi

### Mode penyedia native

Digunakan untuk penyedia `anthropic` dan `google` (satu-satunya penyedia yang saat ini menyatakan dukungan dokumen PDF native). Byte PDF mentah dikirim langsung ke API penyedia sebagai bagian dokumen native/PDF inline untuk setiap berkas.

Batasan:

- `pages` tidak didukung; jika ditetapkan, alat melempar `pages is not supported with native PDF providers`.
- `password` tidak didukung; jika ditetapkan, alat melempar `password is not supported with native PDF providers`. Gunakan model non-native untuk PDF terenkripsi.

### Mode cadangan ekstraksi

Digunakan untuk setiap penyedia lainnya.

1. Ekstrak teks dari halaman yang dipilih (hingga `agents.defaults.pdfMaxPages`, default `20`) melalui plugin `document-extract` bawaan, yang menggunakan paket `clawpdf` (PDFium WebAssembly) untuk ekstraksi teks dan gambar.
2. Jika teks yang diekstrak lebih pendek dari `200` karakter, render halaman yang sama menjadi gambar PNG. Anggaran render adalah total `4,000,000` piksel, yang dibagi di antara semua halaman yang memerlukan gambar (dialokasikan secara proporsional per halaman tersisa, bukan per halaman), sehingga halaman teks yang sudah memiliki cukup teks sepenuhnya melewati proses render.
3. Kirim teks yang diekstrak (dan gambar apa pun yang dirender) beserta prompt ke model yang dipilih.

Detail:

- PDF terenkripsi dibuka dengan parameter tingkat teratas `password`.
- Jika model tidak memiliki masukan gambar dan tidak ada teks yang dapat diekstrak, alat menghasilkan galat.
- Jika render gambar gagal, OpenClaw menghapus gambar dan melanjutkan dengan teks yang diekstrak.
- Jika model target hanya mendukung teks dan ekstraksi menghasilkan gambar, OpenClaw menghapus gambar dan hanya mengirim teks.

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

| Kunci                           | Default              | Arti                                                                                               |
| ------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------- |
| `agents.defaults.pdfModel`      | tidak ditetapkan     | Model PDF utama/cadangan eksplisit; beralih ke `imageModel`, kemudian model sesi.                  |
| `agents.defaults.pdfMaxBytesMb` | `10`                 | Batas ukuran per PDF dalam MB.                                                                     |
| `agents.defaults.pdfMaxPages`   | `20`                 | Jumlah maksimum halaman yang diproses per PDF.                                                     |

Lihat [Referensi Konfigurasi](/id/gateway/config-agents#agent-defaults) untuk detail lengkap setiap bidang.

## Detail keluaran

Alat mengembalikan teks dalam `content[0].text` dan metadata terstruktur dalam `details`.

Bidang `details` yang umum:

- `model`: referensi model yang ditentukan (`provider/model`)
- `native`: `true` untuk mode penyedia native, `false` untuk mode cadangan
- `attempts`: percobaan cadangan yang gagal sebelum berhasil

Bidang jalur:

- Masukan satu PDF: `details.pdf`
- Masukan beberapa PDF: `details.pdfs[]` dengan entri `pdf`
- Metadata penulisan ulang jalur sandbox (jika berlaku): `rewrittenFrom`

## Perilaku galat

| Kondisi                           | Hasil                                                          |
| --------------------------------- | -------------------------------------------------------------- |
| Tidak ada masukan PDF             | Melempar `pdf required: provide a path or URL to a PDF document` |
| Lebih dari 10 PDF                 | `details.error = "too_many_pdfs"`                              |
| Skema referensi tidak didukung    | `details.error = "unsupported_pdf_reference"`                  |
| `pages` dengan penyedia native    | Melempar `pages is not supported with native PDF providers`    |
| `password` dengan penyedia native | Melempar `password is not supported with native PDF providers` |

## Contoh

Satu PDF:

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
