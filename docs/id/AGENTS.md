---
x-i18n:
    generated_at: "2026-07-12T13:57:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a8712b1aeb2e605055c22cf308049e5e74fdf33061870026be20bd55cb0c3d1d
    source_path: AGENTS.md
    workflow: 16
---

# Panduan Dokumentasi

Direktori ini mengelola penulisan dokumentasi, aturan tautan Mintlify, dan kebijakan internasionalisasi dokumentasi.

## Aturan Mintlify

- Dokumentasi dihosting di Mintlify (`https://docs.openclaw.ai`).
- Tautan dokumentasi internal dalam `docs/**/*.md` harus tetap relatif terhadap root tanpa akhiran `.md` atau `.mdx` (contoh: `[Konfigurasi](/gateway/configuration)`).
- Referensi silang antarbagian harus menggunakan anchor pada jalur relatif terhadap root (contoh: `[Hook](/gateway/configuration-reference#hooks)`).
- Judul dokumentasi sebaiknya menghindari tanda pisah em dan apostrof karena pembuatan anchor Mintlify tidak andal untuk karakter tersebut.
- README dan dokumentasi lain yang dirender GitHub harus mempertahankan URL dokumentasi absolut agar tautan berfungsi di luar Mintlify.
- Konten dokumentasi harus tetap generik: tanpa nama perangkat pribadi, nama host, atau jalur lokal; gunakan placeholder seperti `user@gateway-host`.

## Aturan Konten Dokumentasi

- Untuk dokumentasi, teks UI, dan daftar pemilih, urutkan layanan/penyedia secara alfabetis kecuali bagian tersebut secara eksplisit menjelaskan urutan runtime atau urutan deteksi otomatis.
- Pertahankan konsistensi penamaan Plugin bawaan dengan aturan terminologi Plugin di seluruh repositori dalam `AGENTS.md` root.
- Dokumentasi yang dihasilkan tidak boleh diedit secara manual: `docs/plugins/reference/**`, `docs/plugins/reference.md`, dan `docs/plugins/plugin-inventory.md` berasal dari `pnpm plugins:inventory:gen`; `docs/docs_map.md` dari `pnpm docs:map:gen`; `docs/maturity/**` dari `pnpm maturity:render`.

## Dokumentasi Internal

- Dokumentasi operator privat berjangka panjang ditempatkan di `~/Projects/manager/docs/`.
- Dokumentasi sementara/cerminan internal lokal repositori dapat ditempatkan di bawah `docs/internal/` yang diabaikan.
- Jangan pernah menambahkan halaman `docs/internal/**` ke navigasi `docs/docs.json` atau menautkannya dari dokumentasi publik.
- `scripts/docs-sync-publish.mjs` mengecualikan dan menghapus `docs/internal/**` dari repositori publikasi publik `openclaw/docs` jika suatu halaman kemudian ditambahkan secara paksa.
- Dokumentasi internal boleh menyebutkan jalur repositori, nama aplikasi privat, nama item 1Password, dan runbook, tetapi jangan pernah menyertakan nilai rahasia.

## Penyuntingan Kartu Skor Kematangan

`taxonomy.yaml` dan `qa/maturity-scores.yaml` adalah masukan sumber; dokumentasi kematangan yang dihasilkan di bawah `docs/maturity/` merupakan proyeksi dan tidak boleh diedit secara manual untuk skor, LTS, taksonomi, profil QA, atau tabel bukti.
`scripts/qa/render-maturity-docs.ts` mengelola pembuatan; gunakan `pnpm maturity:render` untuk memperbarui dokumentasi yang disimpan dalam commit dan `pnpm maturity:check` untuk memverifikasinya.
`.github/workflows/maturity-scorecard.yml` merender pratinjau artefak dan dapat membuka PR dokumentasi yang dihasilkan; `.github/workflows/openclaw-release-checks.yml` memicunya untuk QA rilis.
Simpan data deterministik `qa-evidence.json.scorecard` dalam artefak GitHub Actions kecuali pengelola secara eksplisit meminta proyeksi tersanitasi yang disimpan dalam commit.
Pengesampingan oleh manusia harus mengubah status sumber dalam PR serta menjelaskan alasan dan bukti publik atau yang telah disunting.

## Internasionalisasi Dokumentasi

- Dokumentasi berbahasa asing tidak dipelihara dalam repositori ini. Keluaran publikasi yang dihasilkan berada dalam repositori `openclaw/docs` terpisah (sering diklon secara lokal sebagai `../openclaw-docs`).
- Jangan menambahkan atau mengedit dokumentasi yang dilokalkan di bawah `docs/<locale>/**` di sini.
- Perlakukan dokumentasi berbahasa Inggris dalam repositori ini beserta berkas glosarium sebagai sumber kebenaran.
- Pipeline: perbarui dokumentasi berbahasa Inggris di sini, perbarui `docs/.i18n/glossary.<locale>.json` sesuai kebutuhan, lalu biarkan sinkronisasi repositori publikasi dan `scripts/docs-i18n` berjalan di `openclaw/docs`.
- Sebelum menjalankan ulang `scripts/docs-i18n`, tambahkan entri glosarium untuk istilah teknis, judul halaman, atau label navigasi pendek baru yang harus tetap dalam bahasa Inggris atau menggunakan terjemahan tetap.
- `pnpm docs:check-i18n-glossary` adalah pengaman untuk perubahan judul dokumentasi berbahasa Inggris dan label pendek dokumentasi internal.
- Memori terjemahan berada dalam berkas `docs/.i18n/*.tm.jsonl` yang dihasilkan di repositori publikasi.
- Lihat `docs/.i18n/README.md`.
