---
read_when:
    - Mengklaim organisasi, merek, cakupan paket, handle pemilik, slug skill, atau namespace paket
    - Menyelesaikan namespace yang sudah diklaim atau dicadangkan
    - Memutuskan apakah akan menggunakan laporan, banding, atau klaim namespace
sidebarTitle: Org and Namespace Claims
summary: Cara meminta tinjauan ClawHub untuk sengketa kepemilikan organisasi, merek, handle pemilik, cakupan paket, slug skill, atau namespace.
title: Klaim Organisasi dan Namespace
x-i18n:
    generated_at: "2026-07-03T09:58:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Klaim Organisasi dan Ruang Nama

ClawHub menggunakan handle pemilik, handle organisasi, slug keterampilan, nama
paket Plugin, dan cakupan paket sebagai ruang nama publik. Jika sebuah ruang nama
tampak milik proyek dunia nyata, merek, ekosistem paket, atau organisasi tetapi
sudah diklaim, dicadangkan, menyesatkan, atau diperselisihkan di ClawHub, minta
staf meninjaunya dengan
[formulir isu Klaim Organisasi / Ruang Nama](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Gunakan jalur ini untuk tinjauan kepemilikan publik yang tidak sensitif. Jangan
gunakan laporan dalam produk atau formulir banding akun untuk klaim ruang nama.

## Kapan Membuka Klaim

Buka klaim ruang nama ketika Anda yakin staf ClawHub harus meninjau apakah sebuah
ruang nama perlu dicadangkan, ditransfer, diganti namanya, disembunyikan,
dikarantina, diberi alias, atau diubah dengan cara lain karena kepemilikan dunia
nyata.

Contohnya mencakup:

- handle organisasi yang cocok dengan organisasi GitHub, proyek, perusahaan, atau
  komunitas Anda
- cakupan paket seperti `@example-org/*` yang seharusnya hanya dipublikasikan di
  bawah pemilik ClawHub yang cocok
- slug keterampilan atau nama paket Plugin yang tampak meniru sebuah proyek
- sengketa merek, merek dagang, perubahan nama proyek, atau riwayat paket
- pemilik yang dihapus, tidak aktif, atau tidak dapat dihubungi yang memblokir
  pemilik ruang nama yang sah

Jika cantuman tidak aman, berbahaya, atau menyesatkan di luar sengketa
kepemilikan, ikuti juga panduan moderasi atau keamanan yang relevan. Formulir
klaim ruang nama ditujukan untuk tinjauan kepemilikan, bukan pengungkapan
kerentanan darurat.

## Sebelum Anda Mengajukan

Pertama, pastikan bahwa Anda memublikasikan dengan pemilik yang cocok dengan ruang
nama. Untuk paket Plugin, nama bercakupan seperti `@example-org/example-plugin`
harus dipublikasikan sebagai pemilik `example-org` yang cocok.

Jika Anda dapat mengelola pemilik saat ini, perbaiki ruang nama secara langsung
dengan memublikasikan, mengganti nama, mentransfer, menyembunyikan, atau
menghapus sumber daya yang terdampak. Gunakan klaim ketika Anda tidak dapat
mengelola pemilik saat ini atau ketika staf perlu menyelesaikan sengketa.

## Bukti yang Perlu Disertakan

Gunakan bukti publik yang tidak sensitif. Bukti yang membantu mencakup:

- organisasi GitHub, repo, rilis, atau riwayat pengelola
- dokumentasi proyek resmi yang menyebutkan ruang nama
- bukti domain atau domain email resmi
- kontrol cakupan npm, PyPI, crates.io, atau registri paket lainnya
- bukti merek dagang, merek, atau kepemilikan proyek yang aman untuk dibahas
  secara publik
- riwayat repositori sumber, riwayat paket, atau pemberitahuan perubahan nama
  publik
- tautan ke pemilik, keterampilan, Plugin, paket, atau isu ClawHub yang
  diperselisihkan

Jelaskan apa yang dibuktikan oleh setiap tautan. Staf harus dapat memahami
hubungannya tanpa memerlukan kredensial pribadi atau rahasia.

## Yang Tidak Boleh Disertakan

Jangan menaruh rahasia atau bukti pribadi dalam isu GitHub publik. Jangan
sertakan:

- token API, kunci penandatanganan, atau kredensial
- token tantangan DNS
- berkas atau kontrak hukum pribadi
- dokumen identitas pribadi
- email pribadi, laporan keamanan pribadi, atau data pelanggan rahasia

Formulir klaim menanyakan apakah bukti sensitif memerlukan saluran staf pribadi.
Gunakan opsi tersebut alih-alih memposting materi sensitif secara publik.

## Kemungkinan Hasil

Bergantung pada bukti dan risiko, staf ClawHub dapat mencadangkan ruang nama,
mentransfer kepemilikan, mengganti nama sumber daya, menyembunyikan atau
mengarantina cantuman yang ada, menambahkan alias atau pengalihan, meminta bukti
tambahan, atau menolak permintaan.

Tinjauan ruang nama tidak menjamin bahwa setiap nama yang cocok akan ditransfer.
Staf mempertimbangkan bukti publik, penggunaan yang ada, risiko keamanan, dan
dampak pengguna.

## Dokumentasi Terkait

- [Publikasi](/id/clawhub/publishing)
- [Pemecahan Masalah](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderasi dan Keamanan Akun](/clawhub/moderation)
- [Keamanan](/clawhub/security)
