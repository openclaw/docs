---
read_when:
    - Mengklaim organisasi, merek, cakupan paket, handle pemilik, slug skill, atau namespace paket
    - Menyelesaikan namespace yang sudah diklaim atau dicadangkan
    - Menentukan apakah akan menggunakan laporan, banding, atau klaim namespace
sidebarTitle: Org and Namespace Claims
summary: Cara meminta peninjauan ClawHub untuk sengketa kepemilikan org, merek, owner-handle, package-scope, skill-slug, atau namespace.
title: Klaim Organisasi dan Namespace
x-i18n:
    generated_at: "2026-07-04T15:34:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Klaim Organisasi dan Ruang Nama

ClawHub menggunakan handle pemilik, handle organisasi, slug keterampilan, nama paket plugin, dan
cakupan paket sebagai ruang nama publik. Jika suatu ruang nama tampak milik
proyek dunia nyata, merek, ekosistem paket, atau organisasi tetapi sudah
diklaim, dicadangkan, menyesatkan, atau disengketakan di ClawHub, minta staf untuk meninjaunya
dengan
[formulir masalah Klaim Organisasi / Ruang Nama](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Gunakan jalur ini untuk peninjauan kepemilikan publik yang tidak sensitif. Jangan gunakan laporan
di dalam produk atau formulir banding akun untuk klaim ruang nama.

## Kapan Membuka Klaim

Buka klaim ruang nama ketika Anda yakin staf ClawHub harus meninjau apakah suatu
ruang nama harus dicadangkan, dialihkan, diganti namanya, disembunyikan, dikarantina, diberi alias,
atau diubah dengan cara lain karena kepemilikan dunia nyata.

Contohnya meliputi:

- handle organisasi yang cocok dengan organisasi GitHub, proyek, perusahaan, atau komunitas Anda
- cakupan paket seperti `@example-org/*` yang seharusnya hanya dipublikasikan di bawah
  pemilik ClawHub yang cocok
- slug keterampilan atau nama paket plugin yang tampak meniru suatu proyek
- sengketa merek, merek dagang, penggantian nama proyek, atau riwayat paket
- pemilik yang dihapus, tidak aktif, atau tidak dapat dihubungi yang memblokir pemilik ruang nama
  yang berhak

Jika listing tidak aman, berbahaya, atau menyesatkan di luar sengketa kepemilikan,
ikuti juga panduan moderasi atau keamanan yang relevan. Formulir klaim ruang nama
ditujukan untuk peninjauan kepemilikan, bukan pengungkapan kerentanan darurat.

## Sebelum Anda Mengajukan

Pertama pastikan bahwa Anda memublikasikan dengan pemilik yang cocok dengan ruang nama.
Untuk paket plugin, nama bercakupan seperti `@example-org/example-plugin` harus
dipublikasikan sebagai pemilik `example-org` yang cocok.

Jika Anda dapat mengelola pemilik saat ini, perbaiki ruang nama secara langsung dengan memublikasikan,
mengganti nama, mengalihkan, menyembunyikan, atau menghapus sumber daya yang terdampak. Gunakan klaim
ketika Anda tidak dapat mengelola pemilik saat ini atau ketika staf perlu menyelesaikan suatu
sengketa.

## Bukti yang Perlu Disertakan

Gunakan bukti publik yang tidak sensitif. Bukti yang membantu meliputi:

- organisasi GitHub, repo, rilis, atau riwayat maintainer
- dokumentasi proyek resmi yang menyebutkan ruang nama
- bukti domain atau domain email resmi
- kontrol cakupan npm, PyPI, crates.io, atau registri paket lainnya
- bukti kepemilikan merek dagang, merek, atau proyek yang aman untuk dibahas
  secara publik
- riwayat repositori sumber, riwayat paket, atau pemberitahuan penggantian nama publik
- tautan ke pemilik, keterampilan, plugin, paket, atau masalah ClawHub yang disengketakan

Jelaskan apa yang dibuktikan oleh setiap tautan. Staf harus dapat memahami
hubungannya tanpa memerlukan kredensial privat atau rahasia.

## Yang Tidak Perlu Disertakan

Jangan menaruh rahasia atau bukti privat dalam masalah GitHub publik. Jangan sertakan:

- token API, kunci penandatanganan, atau kredensial
- token tantangan DNS
- berkas atau kontrak hukum privat
- dokumen identitas pribadi
- email privat, laporan keamanan privat, atau data pelanggan rahasia

Formulir klaim menanyakan apakah bukti sensitif memerlukan saluran staf privat.
Gunakan opsi itu alih-alih memposting materi sensitif secara publik.

## Kemungkinan Hasil

Bergantung pada bukti dan risiko, staf ClawHub dapat mencadangkan suatu ruang nama,
mengalihkan kepemilikan, mengganti nama sumber daya, menyembunyikan atau mengarantina listing yang ada,
menambahkan alias atau pengalihan, meminta lebih banyak bukti, atau menolak permintaan.

Peninjauan ruang nama tidak menjamin bahwa setiap nama yang cocok akan dialihkan.
Staf mempertimbangkan bukti publik, penggunaan yang ada, risiko keamanan, dan dampak pengguna.

## Dokumentasi Terkait

- [Penerbitan](/id/clawhub/publishing)
- [Pemecahan Masalah](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderasi dan Keamanan Akun](/clawhub/moderation)
- [Keamanan](/clawhub/security)
