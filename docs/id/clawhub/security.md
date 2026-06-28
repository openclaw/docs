---
read_when:
    - Melaporkan masalah keamanan ClawHub
    - Memahami pengungkapan kerentanan ClawHub
    - Membedakan masalah platform ClawHub dari masalah keterampilan atau Plugin pihak ketiga
sidebarTitle: Security
summary: Cara melaporkan masalah keamanan ClawHub dan kapan kerentanan diungkapkan secara publik.
title: Keamanan
x-i18n:
    generated_at: "2026-06-28T05:08:04Z"
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
- penerbitan registry, unduhan, instalasi, atau integritas artefak
- autentikasi, otorisasi, atau token API
- pemindaian, moderasi, atau penanganan laporan

Jangan gunakan advisory ClawHub untuk kerentanan dalam kode sumber milik skill atau
Plugin pihak ketiga. Laporkan hal tersebut langsung ke penerbit atau repositori
sumber yang ditautkan dari listing ClawHub.

## Pengungkapan kerentanan

Karena ClawHub adalah aplikasi cloud yang dihosting, kerentanan layanan ClawHub
tidak diungkapkan secara publik secara default. Kerentanan tersebut diungkapkan
secara publik ketika ada bukti dampak nyata terhadap pengguna atau ketika pengguna
perlu mengambil tindakan.

Contoh dampak nyata terhadap pengguna mencakup eksploitasi yang terkonfirmasi,
paparan data pengguna atau rahasia, konten berbahaya yang menjangkau pengguna
karena kegagalan platform, atau masalah apa pun yang mengharuskan pengguna
merotasi kredensial, memperbarui perangkat lunak lokal, atau mengambil tindakan
perlindungan lainnya.

Kerentanan dalam perangkat lunak yang diinstal pengguna diungkapkan secara publik,
seperti paket CLI ClawHub, biner, pustaka, atau artefak rilis lain yang perlu
diperbarui pengguna secara lokal.

## Halaman terkait

Untuk label audit saat instalasi, tingkat risiko, temuan, dan interpretasi, lihat
[Audit Keamanan](/id/clawhub/security-audits).

Untuk laporan marketplace, penahanan moderasi, listing tersembunyi, pemblokiran, dan
status akun, lihat [Moderasi dan Keamanan Akun](/id/clawhub/moderation).
