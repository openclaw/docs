---
read_when:
    - Mengklaim organisasi, merek, cakupan paket, handle pemilik, slug keahlian, atau ruang nama paket
    - Mengatasi ruang nama yang sudah diklaim atau dicadangkan
    - Memutuskan apakah akan menggunakan laporan, banding, atau klaim namespace
sidebarTitle: Org and Namespace Claims
summary: Cara meminta peninjauan ClawHub untuk sengketa kepemilikan org, merek, handle pemilik, cakupan paket, slug skill, atau namespace.
title: Klaim Organisasi dan Ruang Nama
x-i18n:
    generated_at: "2026-07-04T18:22:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Klaim Organisasi dan Namespace

ClawHub menggunakan handle pemilik, handle organisasi, slug skill, nama paket plugin, dan cakupan paket sebagai namespace publik. Jika sebuah namespace tampak milik proyek dunia nyata, merek, ekosistem paket, atau organisasi tetapi sudah diklaim, dicadangkan, menyesatkan, atau diperselisihkan di ClawHub, minta staf meninjaunya dengan
[formulir isu Klaim Organisasi / Namespace](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Gunakan jalur ini untuk peninjauan kepemilikan publik yang tidak sensitif. Jangan gunakan laporan dalam produk atau formulir banding akun untuk klaim namespace.

## Kapan Membuka Klaim

Buka klaim namespace ketika Anda yakin staf ClawHub perlu meninjau apakah sebuah namespace harus dicadangkan, dialihkan, diganti nama, disembunyikan, dikarantina, diberi alias, atau diubah dengan cara lain karena kepemilikan dunia nyata.

Contohnya mencakup:

- handle organisasi yang cocok dengan organisasi GitHub, proyek, perusahaan, atau komunitas Anda
- cakupan paket seperti `@example-org/*` yang hanya boleh dipublikasikan di bawah pemilik ClawHub yang sesuai
- slug skill atau nama paket plugin yang tampak meniru sebuah proyek
- sengketa merek, merek dagang, perubahan nama proyek, atau riwayat paket
- pemilik yang dihapus, tidak aktif, atau tidak dapat dihubungi yang menghalangi pemilik namespace yang sah

Jika listing tersebut tidak aman, berbahaya, atau menyesatkan di luar sengketa kepemilikan, ikuti juga panduan moderasi atau keamanan yang relevan. Formulir klaim namespace ditujukan untuk peninjauan kepemilikan, bukan pengungkapan kerentanan darurat.

## Sebelum Anda Mengajukan

Pertama, pastikan bahwa Anda memublikasikan dengan pemilik yang cocok dengan namespace tersebut. Untuk paket plugin, nama bercakupan seperti `@example-org/example-plugin` harus dipublikasikan sebagai pemilik `example-org` yang sesuai.

Jika Anda dapat mengelola pemilik saat ini, perbaiki namespace secara langsung dengan memublikasikan, mengganti nama, mengalihkan, menyembunyikan, atau menghapus sumber daya yang terdampak. Gunakan klaim ketika Anda tidak dapat mengelola pemilik saat ini atau ketika staf perlu menyelesaikan sengketa.

## Bukti yang Perlu Disertakan

Gunakan bukti publik yang tidak sensitif. Bukti yang berguna mencakup:

- organisasi GitHub, repo, rilis, atau riwayat maintainer
- dokumentasi proyek resmi yang menyebut namespace tersebut
- bukti domain atau domain email resmi
- kontrol cakupan npm, PyPI, crates.io, atau registry paket lainnya
- bukti kepemilikan merek dagang, merek, atau proyek yang aman untuk dibahas secara publik
- riwayat repositori sumber, riwayat paket, atau pemberitahuan perubahan nama publik
- tautan ke pemilik, skill, plugin, paket, atau isu ClawHub yang diperselisihkan

Jelaskan apa yang dibuktikan setiap tautan. Staf harus dapat memahami hubungan tersebut tanpa memerlukan kredensial pribadi atau rahasia.

## Yang Tidak Boleh Disertakan

Jangan menaruh rahasia atau bukti pribadi dalam isu GitHub publik. Jangan sertakan:

- token API, kunci penandatanganan, atau kredensial
- token tantangan DNS
- berkas hukum atau kontrak pribadi
- dokumen identitas pribadi
- email pribadi, laporan keamanan pribadi, atau data pelanggan rahasia

Formulir klaim menanyakan apakah bukti sensitif memerlukan kanal staf privat. Gunakan opsi tersebut alih-alih memposting materi sensitif secara publik.

## Kemungkinan Hasil

Bergantung pada bukti dan risiko, staf ClawHub dapat mencadangkan namespace, mengalihkan kepemilikan, mengganti nama sumber daya, menyembunyikan atau mengarantina listing yang ada, menambahkan alias atau pengalihan, meminta lebih banyak bukti, atau menolak permintaan.

Peninjauan namespace tidak menjamin bahwa setiap nama yang cocok akan dialihkan. Staf mempertimbangkan bukti publik, penggunaan yang sudah ada, risiko keamanan, dan dampak pengguna.

## Dokumentasi Terkait

- [Publikasi](/id/clawhub/publishing)
- [Pemecahan Masalah](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderasi dan Keamanan Akun](/clawhub/moderation)
- [Keamanan](/clawhub/security)
