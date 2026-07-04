---
read_when:
    - Melaporkan masalah keamanan ClawHub
    - Memahami pengungkapan kerentanan ClawHub
    - Membedakan masalah platform ClawHub dari masalah skill atau plugin pihak ketiga
sidebarTitle: Security
summary: Cara melaporkan masalah keamanan ClawHub dan kapan kerentanan diungkapkan secara publik.
title: Keamanan
x-i18n:
    generated_at: "2026-07-04T11:03:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64dcc75ad4210082c79326e617bac38908e927fd8d260fd029aa87e0a11cd324
    source_path: clawhub/security.md
    workflow: 16
---

# Keamanan

Masalah keamanan ClawHub dapat dilaporkan melalui GitHub Security Advisories untuk
`openclaw/clawhub`.

Gunakan GitHub Security Advisories untuk kerentanan di ClawHub itu sendiri. Laporan
advisory ClawHub yang baik mencakup bug dalam:

- situs web, API, atau CLI ClawHub
- publikasi registry, unduhan, instalasi, atau integritas artefak
- autentikasi, otorisasi, atau token API
- pemindaian, moderasi, atau penanganan laporan

Jangan gunakan advisory ClawHub untuk kerentanan dalam kode sumber milik skill atau
plugin pihak ketiga. Laporkan langsung kepada penerbit atau repositori sumber
yang ditautkan dari listing ClawHub.

## Pengungkapan kerentanan

Karena ClawHub adalah aplikasi cloud yang dihosting, kerentanan layanan ClawHub
tidak diungkapkan secara publik secara default. Kerentanan tersebut diungkapkan
secara publik ketika ada bukti dampak nyata terhadap pengguna atau ketika pengguna
perlu mengambil tindakan.

Contoh dampak nyata terhadap pengguna mencakup eksploitasi yang terkonfirmasi,
paparan data atau rahasia pengguna, konten berbahaya yang mencapai pengguna karena
kegagalan platform, atau masalah apa pun yang mengharuskan pengguna memutar
kredensial, memperbarui perangkat lunak lokal, atau mengambil tindakan perlindungan
lainnya.

Kerentanan dalam perangkat lunak yang diinstal pengguna diungkapkan secara publik,
seperti paket CLI ClawHub, biner, pustaka, atau artefak rilis lain yang perlu
diperbarui pengguna secara lokal.

## Halaman terkait

Untuk label audit saat instalasi, tingkat risiko, temuan, dan interpretasi, lihat
[Audit Keamanan](/clawhub/security-audits).

Untuk laporan marketplace, penahanan moderasi, listing tersembunyi, pemblokiran,
dan status akun, lihat [Moderasi dan Keamanan Akun](/clawhub/moderation).
