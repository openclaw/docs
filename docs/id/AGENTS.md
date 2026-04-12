---
x-i18n:
    generated_at: "2026-04-12T09:06:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6805814012caac6ff64f17f44f393975510c5af3421fae9651ed9033e5861784
    source_path: AGENTS.md
    workflow: 15
---

# Panduan Docs

Direktori ini memiliki aturan penulisan docs, aturan tautan Mintlify, dan kebijakan i18n docs.

## Aturan Mintlify

- Docs dihosting di Mintlify (`https://docs.openclaw.ai`).
- Tautan docs internal di `docs/**/*.md` harus tetap root-relative tanpa sufiks `.md` atau `.mdx` (contoh: `[Config](/configuration)`).
- Referensi silang bagian harus menggunakan anchor pada path root-relative (contoh: `[Hooks](/configuration#hooks)`).
- Judul docs harus menghindari tanda pisah em dan apostrof karena pembuatan anchor Mintlify rapuh terhadap hal tersebut.
- README dan docs lain yang dirender di GitHub harus tetap menggunakan URL docs absolut agar tautan berfungsi di luar Mintlify.
- Konten docs harus tetap generik: jangan gunakan nama perangkat pribadi, hostname, atau path lokal; gunakan placeholder seperti `user@gateway-host`.

## Aturan Konten Docs

- Untuk docs, salinan UI, dan daftar pemilih, urutkan layanan/penyedia secara alfabetis kecuali bagian tersebut secara eksplisit menjelaskan urutan runtime atau urutan deteksi otomatis.
- Jaga agar penamaan plugin bawaan tetap konsisten dengan aturan terminologi plugin di seluruh repo dalam `AGENTS.md` root.

## i18n Docs

- Docs berbahasa asing tidak dipelihara di repo ini. Output publikasi yang dihasilkan berada di repo `openclaw/docs` yang terpisah (sering diklon secara lokal sebagai `../openclaw-docs`).
- Jangan menambahkan atau mengedit docs terlokalisasi di bawah `docs/<locale>/**` di sini.
- Perlakukan docs bahasa Inggris di repo ini beserta file glosarium sebagai sumber kebenaran.
- Pipeline: perbarui docs bahasa Inggris di sini, perbarui `docs/.i18n/glossary.<locale>.json` sesuai kebutuhan, lalu biarkan sinkronisasi repo publikasi dan `scripts/docs-i18n` berjalan di `openclaw/docs`.
- Sebelum menjalankan ulang `scripts/docs-i18n`, tambahkan entri glosarium untuk istilah teknis, judul halaman, atau label navigasi singkat baru yang harus tetap dalam bahasa Inggris atau menggunakan terjemahan tetap.
- `pnpm docs:check-i18n-glossary` adalah pemeriksaan untuk perubahan judul docs bahasa Inggris dan label docs internal singkat.
- Translation memory berada dalam file `docs/.i18n/*.tm.jsonl` yang dihasilkan di repo publikasi.
- Lihat `docs/.i18n/README.md`.
