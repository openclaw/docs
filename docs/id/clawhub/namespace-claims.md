---
read_when:
    - Mengklaim organisasi, merek, cakupan paket, handle pemilik, slug skill, atau namespace paket
    - Mengatasi namespace yang sudah diklaim atau dicadangkan
    - Menentukan apakah akan menggunakan laporan, banding, atau klaim namespace
sidebarTitle: Org and Namespace Claims
summary: Cara meminta peninjauan ClawHub untuk sengketa kepemilikan organisasi, merek, owner-handle, package-scope, skill-slug, atau namespace.
title: Klaim Org dan Namespace
x-i18n:
    generated_at: "2026-07-03T02:55:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Klaim Organisasi dan Ruang Nama

ClawHub menggunakan handle pemilik, handle organisasi, slug skill, nama paket Plugin, dan
cakupan paket sebagai ruang nama publik. Jika sebuah ruang nama tampak dimiliki oleh
proyek dunia nyata, merek, ekosistem paket, atau organisasi tetapi sudah
diklaim, dicadangkan, menyesatkan, atau dipersengketakan di ClawHub, minta staf meninjaunya
melalui
[formulir isu Klaim Organisasi / Ruang Nama](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Gunakan jalur ini untuk peninjauan kepemilikan publik yang tidak sensitif. Jangan gunakan laporan
di dalam produk atau formulir banding akun untuk klaim ruang nama.

## Kapan Membuka Klaim

Buka klaim ruang nama ketika Anda yakin staf ClawHub perlu meninjau apakah sebuah
ruang nama harus dicadangkan, dialihkan, diganti namanya, disembunyikan, dikarantina, diberi alias,
atau diubah dengan cara lain karena kepemilikan dunia nyata.

Contohnya meliputi:

- handle organisasi yang cocok dengan organisasi GitHub, proyek, perusahaan, atau komunitas Anda
- cakupan paket seperti `@example-org/*` yang seharusnya hanya menerbitkan di bawah
  pemilik ClawHub yang cocok
- slug skill atau nama paket Plugin yang tampak menyamar sebagai sebuah proyek
- sengketa merek, merek dagang, perubahan nama proyek, atau riwayat paket
- pemilik yang dihapus, tidak aktif, atau tidak dapat dihubungi yang memblokir pemilik
  ruang nama yang sah

Jika listing tidak aman, berbahaya, atau menyesatkan di luar sengketa kepemilikan,
ikuti juga panduan moderasi atau keamanan yang relevan. Formulir klaim ruang nama
ditujukan untuk peninjauan kepemilikan, bukan pengungkapan kerentanan darurat.

## Sebelum Anda Mengajukan

Pertama, pastikan bahwa Anda menerbitkan dengan pemilik yang cocok dengan ruang nama.
Untuk paket Plugin, nama bercakupan seperti `@example-org/example-plugin` harus
diterbitkan sebagai pemilik `example-org` yang cocok.

Jika Anda dapat mengelola pemilik saat ini, perbaiki ruang nama secara langsung dengan menerbitkan,
mengganti nama, mengalihkan, menyembunyikan, atau menghapus resource yang terdampak. Gunakan klaim
ketika Anda tidak dapat mengelola pemilik saat ini atau ketika staf perlu menyelesaikan
sengketa.

## Bukti yang Harus Disertakan

Gunakan bukti publik yang tidak sensitif. Bukti yang membantu meliputi:

- riwayat organisasi GitHub, repo, rilis, atau maintainer
- dokumentasi proyek resmi yang menyebutkan ruang nama tersebut
- bukti domain atau domain email resmi
- kontrol cakupan npm, PyPI, crates.io, atau registry paket lainnya
- bukti kepemilikan merek dagang, merek, atau proyek yang aman untuk dibahas
  secara publik
- riwayat repositori sumber, riwayat paket, atau pemberitahuan perubahan nama publik
- tautan ke pemilik, skill, Plugin, paket, atau isu ClawHub yang dipersengketakan

Jelaskan apa yang dibuktikan oleh setiap tautan. Staf harus dapat memahami
hubungannya tanpa memerlukan kredensial pribadi atau rahasia.

## Yang Tidak Boleh Disertakan

Jangan memasukkan rahasia atau bukti pribadi dalam isu GitHub publik. Jangan sertakan:

- token API, kunci penandatanganan, atau kredensial
- token tantangan DNS
- berkas hukum atau kontrak pribadi
- dokumen identitas pribadi
- email pribadi, laporan keamanan pribadi, atau data pelanggan rahasia

Formulir klaim menanyakan apakah bukti sensitif memerlukan kanal staf pribadi.
Gunakan opsi itu alih-alih memposting materi sensitif secara publik.

## Kemungkinan Hasil

Bergantung pada bukti dan risiko, staf ClawHub dapat mencadangkan ruang nama,
mengalihkan kepemilikan, mengganti nama resource, menyembunyikan atau mengarantina listing yang ada,
menambahkan alias atau pengalihan, meminta bukti tambahan, atau menolak permintaan.

Peninjauan ruang nama tidak menjamin bahwa setiap nama yang cocok akan dialihkan.
Staf mempertimbangkan bukti publik, penggunaan yang ada, risiko keamanan, dan dampak pengguna.

## Dokumentasi Terkait

- [Penerbitan](/id/clawhub/publishing)
- [Pemecahan Masalah](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderasi dan Keamanan Akun](/clawhub/moderation)
- [Keamanan](/clawhub/security)
