---
read_when:
    - Mengklaim organisasi, merek, cakupan paket, handle pemilik, slug skill, atau namespace paket
    - Menyelesaikan namespace yang sudah diklaim atau dicadangkan
    - Menentukan apakah akan menggunakan laporan, banding, atau klaim namespace
sidebarTitle: Org and Namespace Claims
summary: Cara meminta review ClawHub untuk sengketa kepemilikan organisasi, merek, nama pengguna pemilik, cakupan paket, slug skill, atau namespace.
title: Klaim Organisasi dan Namespace
x-i18n:
    generated_at: "2026-07-19T05:00:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Klaim Organisasi dan Namespace

ClawHub menggunakan handle pemilik, handle organisasi, slug skill, nama paket plugin, dan
scope paket sebagai namespace publik. Jika sebuah namespace tampaknya milik
proyek, merek, ekosistem paket, atau organisasi di dunia nyata, tetapi sudah
diklaim, dicadangkan, menyesatkan, atau disengketakan di ClawHub, minta staf meninjaunya
melalui
[formulir isu Klaim Organisasi / Namespace](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Gunakan jalur ini untuk peninjauan kepemilikan publik yang tidak sensitif. Jangan gunakan laporan
dalam produk atau formulir banding akun untuk klaim namespace.

## Kapan Mengajukan Klaim

Ajukan klaim namespace jika Anda yakin staf ClawHub perlu meninjau apakah sebuah
namespace harus dicadangkan, dialihkan, diganti namanya, disembunyikan, dikarantina, diberi alias,
atau diubah dengan cara lain karena kepemilikan di dunia nyata.

Contohnya meliputi:

- handle organisasi yang cocok dengan organisasi GitHub, proyek, perusahaan, atau komunitas Anda
- scope paket seperti `@example-org/*` yang seharusnya hanya diterbitkan di bawah
  pemilik ClawHub yang sesuai
- slug skill atau nama paket plugin yang tampaknya menyamar sebagai suatu proyek
- sengketa merek, merek dagang, perubahan nama proyek, atau riwayat paket
- pemilik yang telah dihapus, tidak aktif, atau tidak dapat dihubungi yang menghalangi pemilik namespace
  yang sah

Jika listing tersebut tidak aman, berbahaya, atau menyesatkan di luar sengketa kepemilikan,
ikuti juga panduan moderasi atau keamanan yang relevan. Formulir klaim namespace
ditujukan untuk peninjauan kepemilikan, bukan pengungkapan kerentanan darurat.

## Sebelum Mengajukan

Pertama, pastikan Anda menerbitkan dengan pemilik yang sesuai dengan namespace.
Untuk paket plugin, nama dengan scope seperti `@example-org/example-plugin` harus
diterbitkan sebagai pemilik `example-org` yang sesuai.

Jika Anda dapat mengelola pemilik saat ini, perbaiki namespace secara langsung dengan menerbitkan,
mengganti nama, mengalihkan, menyembunyikan, atau menghapus sumber daya yang terdampak. Ajukan klaim
jika Anda tidak dapat mengelola pemilik saat ini atau jika staf perlu menyelesaikan
sengketa.

## Bukti yang Perlu Disertakan

Gunakan bukti publik yang tidak sensitif. Bukti yang bermanfaat meliputi:

- riwayat organisasi GitHub, repo, rilis, atau pengelola
- dokumentasi resmi proyek yang menyebutkan namespace tersebut
- bukti domain atau domain email resmi
- kendali scope npm, PyPI, crates.io, atau registri paket lainnya
- bukti kepemilikan merek dagang, merek, atau proyek yang aman untuk dibahas
  secara publik
- riwayat repositori sumber, riwayat paket, atau pemberitahuan perubahan nama publik
- tautan ke pemilik, skill, plugin, paket, atau isu ClawHub yang disengketakan

Jelaskan apa yang dibuktikan oleh setiap tautan. Staf harus dapat memahami
hubungannya tanpa memerlukan kredensial atau rahasia pribadi.

## Hal yang Tidak Boleh Disertakan

Jangan masukkan rahasia atau bukti pribadi ke dalam isu GitHub publik. Jangan sertakan:

- token API, kunci penandatanganan, atau kredensial
- token verifikasi DNS
- berkas hukum atau kontrak pribadi
- dokumen identitas pribadi
- email pribadi, laporan keamanan pribadi, atau data pelanggan rahasia

Formulir klaim menanyakan apakah bukti sensitif memerlukan kanal staf pribadi.
Gunakan opsi tersebut alih-alih memposting materi sensitif secara publik.

## Kemungkinan Hasil

Bergantung pada bukti dan risiko, staf ClawHub dapat mencadangkan namespace,
mengalihkan kepemilikan, mengganti nama sumber daya, menyembunyikan atau mengarantina listing yang ada,
menambahkan alias atau pengalihan, meminta bukti tambahan, atau menolak permintaan.

Peninjauan namespace tidak menjamin bahwa setiap nama yang cocok akan dialihkan.
Staf mempertimbangkan bukti publik, penggunaan yang ada, risiko keamanan, dan dampak terhadap pengguna.

## Dokumentasi Terkait

- [Penerbitan](/id/clawhub/publishing)
- [Pemecahan Masalah](/id/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderasi dan Keamanan Akun](/clawhub/moderation)
- [Keamanan](/clawhub/security)
