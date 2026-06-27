---
x-i18n:
    generated_at: "2026-06-27T17:08:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0c67d049eb1d0f1d4e675a71e69b2d34d3ce5c733ca9582bf08ac717c233644
    source_path: AGENTS.md
    workflow: 16
---

# Panduan Dokumentasi

Direktori ini memiliki penulisan dokumentasi, aturan tautan Mintlify, dan kebijakan i18n dokumentasi.

## Aturan Mintlify

- Dokumentasi dihosting di Mintlify (`https://docs.openclaw.ai`).
- Tautan dokumentasi internal di `docs/**/*.md` harus tetap relatif terhadap root tanpa akhiran `.md` atau `.mdx` (contoh: `[Config](/gateway/configuration)`).
- Rujukan silang bagian sebaiknya menggunakan anchor pada path yang relatif terhadap root (contoh: `[Hooks](/gateway/configuration-reference#hooks)`).
- Heading dokumentasi sebaiknya menghindari tanda pisah em dan apostrof karena pembuatan anchor Mintlify rapuh di sana.
- README dan dokumentasi lain yang dirender GitHub sebaiknya mempertahankan URL dokumentasi absolut agar tautan berfungsi di luar Mintlify.
- Konten dokumentasi harus tetap generik: tidak ada nama perangkat pribadi, hostname, atau path lokal; gunakan placeholder seperti `user@gateway-host`.

## Aturan Konten Dokumentasi

- Untuk dokumentasi, salinan UI, dan daftar pemilih, urutkan layanan/penyedia secara alfabetis kecuali bagian tersebut secara eksplisit menjelaskan urutan runtime atau urutan deteksi otomatis.
- Jaga penamaan Plugin bawaan tetap konsisten dengan aturan terminologi Plugin di seluruh repo dalam root `AGENTS.md`.

## Dokumentasi Internal

- Dokumentasi operator privat yang berumur panjang berada di `~/Projects/manager/docs/`.
- Dokumentasi scratch/mirror internal lokal repo boleh berada di bawah `docs/internal/` yang diabaikan.
- Jangan pernah menambahkan halaman `docs/internal/**` ke navigasi `docs/docs.json` atau menautkannya dari dokumentasi publik.
- `scripts/docs-sync-publish.mjs` mengecualikan dan memangkas `docs/internal/**` dari repo publikasi publik `openclaw/docs` jika sebuah halaman ditambahkan secara paksa nanti.
- Dokumentasi internal boleh menyebutkan path repo, nama aplikasi privat, nama item 1Password, dan runbook, tetapi jangan pernah menyertakan nilai rahasia.

## Penyuntingan Kartu Skor Kematangan

`taxonomy.yaml` dan `qa/maturity-scores.yaml` adalah input sumber; dokumentasi kematangan yang dihasilkan di bawah `docs/maturity/` adalah proyeksi dan tidak boleh diedit manual untuk skor, LTS, taksonomi, profil QA, atau tabel bukti.
`scripts/qa/render-maturity-docs.ts` memiliki pembuatan; gunakan `pnpm maturity:render` untuk menyegarkan dokumentasi yang dikomit dan `pnpm maturity:check` untuk memverifikasinya.
`.github/workflows/maturity-scorecard.yml` merender pratinjau artefak dan dapat membuka PR dokumentasi yang dihasilkan; `.github/workflows/openclaw-release-checks.yml` menjalankannya untuk QA rilis.
Simpan data deterministik `qa-evidence.json.scorecard` dalam artefak GitHub Actions kecuali pemelihara secara eksplisit meminta proyeksi terkomit yang telah disanitasi.
Override manusia harus mengubah status sumber dalam PR dan menjelaskan alasannya beserta bukti publik atau yang telah disunting.

## i18n Dokumentasi

- Dokumentasi berbahasa asing tidak dipelihara dalam repo ini. Output publikasi yang dihasilkan berada di repo `openclaw/docs` terpisah (sering dikloning secara lokal sebagai `../openclaw-docs`).
- Jangan menambahkan atau mengedit dokumentasi terlokalisasi di bawah `docs/<locale>/**` di sini.
- Perlakukan dokumentasi bahasa Inggris dalam repo ini beserta file glosarium sebagai sumber kebenaran.
- Pipeline: perbarui dokumentasi bahasa Inggris di sini, perbarui `docs/.i18n/glossary.<locale>.json` sesuai kebutuhan, lalu biarkan sinkronisasi repo publikasi dan `scripts/docs-i18n` berjalan di `openclaw/docs`.
- Sebelum menjalankan ulang `scripts/docs-i18n`, tambahkan entri glosarium untuk istilah teknis baru, judul halaman, atau label navigasi pendek apa pun yang harus tetap dalam bahasa Inggris atau menggunakan terjemahan tetap.
- `pnpm docs:check-i18n-glossary` adalah penjaga untuk judul dokumentasi bahasa Inggris yang berubah dan label dokumentasi internal pendek.
- Memori terjemahan berada dalam file `docs/.i18n/*.tm.jsonl` yang dihasilkan di repo publikasi.
- Lihat `docs/.i18n/README.md`.
