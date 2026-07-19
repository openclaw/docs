---
read_when:
    - Melaporkan masalah keamanan ClawHub
    - Memahami pengungkapan kerentanan ClawHub
    - Membedakan masalah platform ClawHub dari masalah skill atau plugin pihak ketiga
sidebarTitle: Security
summary: Cara melaporkan masalah keamanan ClawHub dan kapan kerentanan diungkapkan kepada publik.
title: Keamanan
x-i18n:
    generated_at: "2026-07-19T04:58:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 64dcc75ad4210082c79326e617bac38908e927fd8d260fd029aa87e0a11cd324
    source_path: clawhub/security.md
    workflow: 16
---

# Keamanan

Masalah keamanan ClawHub dapat dilaporkan melalui GitHub Security Advisories untuk
`openclaw/clawhub`.

Gunakan GitHub Security Advisories untuk kerentanan di ClawHub itu sendiri. Laporan
advisori ClawHub yang baik mencakup bug dalam:

- situs web, API, atau CLI ClawHub
- penerbitan registri, pengunduhan, penginstalan, atau integritas artefak
- autentikasi, otorisasi, atau token API
- pemindaian, moderasi, atau penanganan laporan

Jangan gunakan advisori ClawHub untuk kerentanan dalam kode sumber milik Skills
atau Plugin pihak ketiga. Laporkan langsung kepada penerbit atau repositori
sumber yang ditautkan dari daftar ClawHub.

## Pengungkapan kerentanan

Karena ClawHub merupakan aplikasi cloud yang dihosting, kerentanan layanan ClawHub
secara default tidak diungkapkan kepada publik. Kerentanan tersebut diungkapkan
kepada publik ketika terdapat bukti dampak nyata terhadap pengguna atau ketika
pengguna perlu mengambil tindakan.

Contoh dampak nyata terhadap pengguna mencakup eksploitasi yang terkonfirmasi,
tereksposnya data atau rahasia pengguna, konten berbahaya yang menjangkau pengguna
akibat kegagalan platform, atau masalah apa pun yang mengharuskan pengguna merotasi
kredensial, memperbarui perangkat lunak lokal, atau mengambil tindakan perlindungan
lainnya.

Kerentanan dalam perangkat lunak yang diinstal pengguna diungkapkan kepada publik,
seperti paket CLI ClawHub, berkas biner, pustaka, atau artefak rilis lainnya yang
perlu diperbarui pengguna secara lokal.

## Halaman terkait

Untuk label audit saat penginstalan, tingkat risiko, temuan, dan interpretasi, lihat
[Audit Keamanan](/clawhub/security-audits).

Untuk laporan marketplace, penangguhan moderasi, daftar tersembunyi, pemblokiran,
dan status akun, lihat [Moderasi dan Keamanan Akun](/clawhub/moderation).
