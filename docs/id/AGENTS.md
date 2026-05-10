---
x-i18n:
    generated_at: "2026-05-10T19:20:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4fb1075777cead58155336aa27359c8c149748bec8a854ff1de1f75a992b8c8f
    source_path: AGENTS.md
    workflow: 16
---

# Panduan Dokumentasi

Direktori ini mengelola penulisan dokumentasi, aturan tautan Mintlify, dan kebijakan i18n dokumentasi.

## Aturan Mintlify

- Dokumentasi dihosting di Mintlify (`https://docs.openclaw.ai`).
- Tautan dokumentasi internal di `docs/**/*.md` harus tetap relatif akar tanpa akhiran `.md` atau `.mdx` (contoh: `[Konfigurasi](/gateway/configuration)`).
- Referensi silang bagian harus menggunakan anchor pada path relatif akar (contoh: `[Hook](/gateway/configuration-reference#hooks)`).
- Judul dokumentasi sebaiknya menghindari em dash dan apostrof karena pembuatan anchor Mintlify rapuh di sana.
- README dan dokumentasi lain yang dirender GitHub harus mempertahankan URL dokumentasi absolut agar tautan berfungsi di luar Mintlify.
- Konten dokumentasi harus tetap generik: tanpa nama perangkat pribadi, hostname, atau path lokal; gunakan placeholder seperti `user@gateway-host`.

## Aturan Konten Dokumentasi

- Untuk dokumentasi, salinan UI, dan daftar pemilih, urutkan layanan/penyedia secara alfabetis kecuali bagian tersebut secara eksplisit menjelaskan urutan runtime atau urutan deteksi otomatis.
- Jaga penamaan plugin bawaan tetap konsisten dengan aturan terminologi Plugin di seluruh repo dalam `AGENTS.md` akar.

## Dokumentasi Internal

- Dokumentasi operator privat berumur panjang berada di `~/Projects/manager/docs/`.
- Dokumentasi scratch/mirror internal lokal repo dapat berada di bawah `docs/internal/` yang diabaikan.
- Jangan pernah menambahkan halaman `docs/internal/**` ke navigasi `docs/docs.json` atau menautkannya dari dokumentasi publik.
- `scripts/docs-sync-publish.mjs` mengecualikan dan memangkas `docs/internal/**` dari repo publikasi publik `openclaw/docs` jika suatu halaman dipaksa ditambahkan nanti.
- Dokumentasi internal boleh menyebut path repo, nama aplikasi privat, nama item 1Password, dan runbook, tetapi jangan pernah menyertakan nilai rahasia.

## i18n Dokumentasi

- Dokumentasi berbahasa asing tidak dipelihara di repo ini. Output publikasi yang dihasilkan berada di repo `openclaw/docs` terpisah (sering dikloning secara lokal sebagai `../openclaw-docs`).
- Jangan menambahkan atau mengedit dokumentasi terlokalisasi di bawah `docs/<locale>/**` di sini.
- Perlakukan dokumentasi bahasa Inggris di repo ini beserta file glosarium sebagai sumber kebenaran.
- Pipeline: perbarui dokumentasi bahasa Inggris di sini, perbarui `docs/.i18n/glossary.<locale>.json` sesuai kebutuhan, lalu biarkan sinkronisasi repo publikasi dan `scripts/docs-i18n` berjalan di `openclaw/docs`.
- Sebelum menjalankan ulang `scripts/docs-i18n`, tambahkan entri glosarium untuk istilah teknis baru, judul halaman, atau label navigasi pendek apa pun yang harus tetap dalam bahasa Inggris atau menggunakan terjemahan tetap.
- `pnpm docs:check-i18n-glossary` adalah guard untuk perubahan judul dokumentasi bahasa Inggris dan label dokumentasi internal pendek.
- Translation memory berada dalam file `docs/.i18n/*.tm.jsonl` yang dihasilkan di repo publikasi.
- Lihat `docs/.i18n/README.md`.
