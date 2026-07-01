---
read_when:
    - Mengklaim organisasi, merek, cakupan paket, handle pemilik, slug skill, atau namespace paket
    - Menyelesaikan namespace yang sudah diklaim atau dicadangkan
    - Menentukan apakah akan menggunakan laporan, banding, atau klaim namespace
sidebarTitle: Org and Namespace Claims
summary: Cara meminta tinjauan ClawHub untuk sengketa kepemilikan organisasi, merek, handle pemilik, cakupan paket, slug skill, atau namespace.
title: Klaim Organisasi dan Namespace
x-i18n:
    generated_at: "2026-07-01T08:29:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Klaim Organisasi dan Namespace

ClawHub menggunakan handle pemilik, handle organisasi, slug skill, nama paket Plugin, dan
cakupan paket sebagai namespace publik. Jika sebuah namespace tampak milik
proyek dunia nyata, merek, ekosistem paket, atau organisasi tetapi sudah
diklaim, dicadangkan, menyesatkan, atau dipersengketakan di ClawHub, minta staf untuk meninjaunya
melalui
[formulir isu Klaim Organisasi / Namespace](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Gunakan jalur ini untuk peninjauan kepemilikan publik yang tidak sensitif. Jangan gunakan laporan
di dalam produk atau formulir banding akun untuk klaim namespace.

## Kapan Membuka Klaim

Buka klaim namespace ketika Anda yakin staf ClawHub perlu meninjau apakah sebuah
namespace harus dicadangkan, dialihkan, diganti nama, disembunyikan, dikarantina, diberi alias,
atau diubah dengan cara lain karena kepemilikan dunia nyata.

Contohnya mencakup:

- handle organisasi yang cocok dengan organisasi GitHub, proyek, perusahaan, atau komunitas Anda
- cakupan paket seperti `@example-org/*` yang seharusnya hanya diterbitkan di bawah
  pemilik ClawHub yang cocok
- slug skill atau nama paket Plugin yang tampak meniru suatu proyek
- sengketa merek, merek dagang, penggantian nama proyek, atau riwayat paket
- pemilik yang dihapus, tidak aktif, atau tidak dapat dihubungi yang memblokir pemilik
  namespace yang berhak

Jika listing tidak aman, berbahaya, atau menyesatkan di luar sengketa kepemilikan,
ikuti juga panduan moderasi atau keamanan yang relevan. Formulir klaim namespace
ditujukan untuk peninjauan kepemilikan, bukan pengungkapan kerentanan darurat.

## Sebelum Anda Mengajukan

Pertama, pastikan bahwa Anda menerbitkan dengan pemilik yang cocok dengan namespace tersebut.
Untuk paket Plugin, nama bercakupan seperti `@example-org/example-plugin` harus
diterbitkan sebagai pemilik `example-org` yang cocok.

Jika Anda dapat mengelola pemilik saat ini, perbaiki namespace secara langsung dengan menerbitkan,
mengganti nama, mengalihkan, menyembunyikan, atau menghapus sumber daya yang terdampak. Gunakan klaim
ketika Anda tidak dapat mengelola pemilik saat ini atau ketika staf perlu menyelesaikan
sengketa.

## Bukti yang Perlu Disertakan

Gunakan bukti publik yang tidak sensitif. Bukti yang membantu mencakup:

- riwayat organisasi, repo, rilis, atau pengelola GitHub
- dokumentasi proyek resmi yang menyebut namespace tersebut
- bukti domain atau domain email resmi
- kontrol cakupan registry paket npm, PyPI, crates.io, atau lainnya
- bukti kepemilikan merek dagang, merek, atau proyek yang aman untuk dibahas
  secara publik
- riwayat repositori sumber, riwayat paket, atau pemberitahuan penggantian nama publik
- tautan ke pemilik, skill, Plugin, paket, atau isu ClawHub yang disengketakan

Jelaskan apa yang dibuktikan oleh setiap tautan. Staf harus dapat memahami
hubungannya tanpa memerlukan kredensial pribadi atau rahasia.

## Yang Tidak Boleh Disertakan

Jangan masukkan rahasia atau bukti privat dalam isu GitHub publik. Jangan sertakan:

- token API, kunci penandatanganan, atau kredensial
- token tantangan DNS
- berkas atau kontrak hukum privat
- dokumen identitas pribadi
- email privat, laporan keamanan privat, atau data pelanggan rahasia

Formulir klaim menanyakan apakah bukti sensitif memerlukan kanal staf privat.
Gunakan opsi itu alih-alih memposting materi sensitif secara publik.

## Kemungkinan Hasil

Bergantung pada bukti dan risiko, staf ClawHub dapat mencadangkan namespace,
mengalihkan kepemilikan, mengganti nama sumber daya, menyembunyikan atau mengarantina listing yang ada,
menambahkan alias atau pengalihan, meminta bukti tambahan, atau menolak permintaan.

Peninjauan namespace tidak menjamin bahwa setiap nama yang cocok akan dialihkan.
Staf mempertimbangkan bukti publik, penggunaan yang ada, risiko keamanan, dan dampak pengguna.

## Dokumen Terkait

- [Penerbitan](/id/clawhub/publishing)
- [Pemecahan Masalah](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderasi dan Keamanan Akun](/clawhub/moderation)
- [Keamanan](/clawhub/security)
