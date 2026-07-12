---
read_when:
    - Mengklaim organisasi, merek, cakupan paket, nama pengguna pemilik, slug skill, atau namespace paket
    - Menyelesaikan namespace yang sudah diklaim atau dicadangkan
    - Menentukan apakah akan menggunakan laporan, banding, atau klaim namespace
sidebarTitle: Org and Namespace Claims
summary: Cara meminta peninjauan ClawHub untuk sengketa kepemilikan organisasi, merek, nama pengguna pemilik, cakupan paket, slug skill, atau namespace.
title: Klaim Organisasi dan Namespace
x-i18n:
    generated_at: "2026-07-12T13:59:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Klaim Organisasi dan Namespace

ClawHub menggunakan handle pemilik, handle organisasi, slug skill, nama paket plugin, dan cakupan paket sebagai namespace publik. Jika suatu namespace tampaknya merupakan milik proyek, merek, ekosistem paket, atau organisasi nyata, tetapi sudah diklaim, dicadangkan, menyesatkan, atau disengketakan di ClawHub, mintalah staf untuk meninjaunya melalui
[formulir isu Klaim Organisasi / Namespace](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Gunakan jalur ini untuk peninjauan kepemilikan yang bersifat publik dan tidak sensitif. Jangan gunakan laporan dalam produk atau formulir banding akun untuk klaim namespace.

## Kapan Harus Mengajukan Klaim

Ajukan klaim namespace jika Anda meyakini staf ClawHub perlu meninjau apakah suatu namespace harus dicadangkan, dialihkan, diganti namanya, disembunyikan, dikarantina, diberi alias, atau diubah dengan cara lain karena kepemilikan di dunia nyata.

Contohnya meliputi:

- handle organisasi yang sama dengan organisasi GitHub, proyek, perusahaan, atau komunitas Anda
- cakupan paket seperti `@example-org/*` yang seharusnya hanya diterbitkan di bawah pemilik ClawHub yang sesuai
- slug skill atau nama paket plugin yang tampaknya menyamar sebagai suatu proyek
- sengketa terkait merek, merek dagang, perubahan nama proyek, atau riwayat paket
- pemilik yang telah dihapus, tidak aktif, atau tidak dapat dihubungi sehingga menghalangi pemilik namespace yang sah

Jika cantuman tersebut tidak aman, berbahaya, atau menyesatkan di luar sengketa kepemilikan, ikuti juga panduan moderasi atau keamanan yang relevan. Formulir klaim namespace ditujukan untuk peninjauan kepemilikan, bukan pengungkapan kerentanan darurat.

## Sebelum Mengajukan

Pertama, pastikan Anda menerbitkan dengan pemilik yang sesuai dengan namespace tersebut. Untuk paket plugin, nama bercakupan seperti `@example-org/example-plugin` harus diterbitkan sebagai pemilik `example-org` yang sesuai.

Jika Anda dapat mengelola pemilik saat ini, perbaiki namespace secara langsung dengan menerbitkan, mengganti nama, mengalihkan, menyembunyikan, atau menghapus sumber daya yang terdampak. Gunakan klaim jika Anda tidak dapat mengelola pemilik saat ini atau jika staf perlu menyelesaikan sengketa.

## Bukti yang Perlu Disertakan

Gunakan bukti yang bersifat publik dan tidak sensitif. Bukti yang membantu meliputi:

- riwayat organisasi GitHub, repositori, rilis, atau pengelola
- dokumentasi resmi proyek yang menyebutkan namespace tersebut
- bukti domain atau domain email resmi
- kendali atas cakupan di npm, PyPI, crates.io, atau registri paket lainnya
- bukti kepemilikan merek dagang, merek, atau proyek yang aman untuk dibahas secara publik
- riwayat repositori sumber, riwayat paket, atau pemberitahuan publik tentang perubahan nama
- tautan ke pemilik, skill, plugin, paket, atau isu ClawHub yang disengketakan

Jelaskan hal yang dibuktikan oleh setiap tautan. Staf harus dapat memahami hubungan tersebut tanpa memerlukan kredensial atau rahasia pribadi.

## Hal yang Tidak Boleh Disertakan

Jangan mencantumkan rahasia atau bukti pribadi dalam isu GitHub publik. Jangan sertakan:

- token API, kunci penandatanganan, atau kredensial
- token verifikasi DNS
- berkas hukum atau kontrak pribadi
- dokumen identitas pribadi
- email pribadi, laporan keamanan pribadi, atau data pelanggan rahasia

Formulir klaim menanyakan apakah bukti sensitif memerlukan saluran staf privat. Gunakan opsi tersebut alih-alih memublikasikan materi sensitif.

## Kemungkinan Hasil

Bergantung pada bukti dan risikonya, staf ClawHub dapat mencadangkan namespace, mengalihkan kepemilikan, mengganti nama sumber daya, menyembunyikan atau mengarantina cantuman yang ada, menambahkan alias atau pengalihan, meminta bukti tambahan, atau menolak permintaan.

Peninjauan namespace tidak menjamin bahwa setiap nama yang cocok akan dialihkan. Staf mempertimbangkan bukti publik, penggunaan yang ada, risiko keamanan, dan dampak terhadap pengguna.

## Dokumentasi Terkait

- [Penerbitan](/id/clawhub/publishing)
- [Pemecahan Masalah](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderasi dan Keamanan Akun](/clawhub/moderation)
- [Keamanan](/clawhub/security)
