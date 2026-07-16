---
read_when:
    - Melaporkan masalah keamanan ClawHub
    - Memahami pengungkapan kerentanan ClawHub
    - Membedakan masalah platform ClawHub dari masalah Skills atau Plugin pihak ketiga
sidebarTitle: Security
summary: Cara melaporkan masalah keamanan ClawHub dan kapan kerentanan diungkapkan kepada publik.
title: Keamanan
x-i18n:
    generated_at: "2026-07-16T17:52:42Z"
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

Gunakan GitHub Security Advisories untuk kerentanan pada ClawHub itu sendiri. Laporan
advisori ClawHub yang baik mencakup bug pada:

- situs web, API, atau CLI ClawHub
- penerbitan registri, unduhan, instalasi, atau integritas artefak
- autentikasi, otorisasi, atau token API
- pemindaian, moderasi, atau penanganan laporan

Jangan gunakan advisori ClawHub untuk kerentanan dalam kode sumber milik Skills atau
Plugin pihak ketiga. Laporkan kerentanan tersebut langsung kepada penerbit atau repositori
sumber yang ditautkan dari daftar ClawHub.

## Pengungkapan kerentanan

Karena ClawHub adalah aplikasi cloud yang dihosting, kerentanan layanan ClawHub
secara default tidak diungkapkan kepada publik. Kerentanan tersebut diungkapkan kepada
publik jika terdapat bukti dampak nyata terhadap pengguna atau jika pengguna perlu
mengambil tindakan.

Contoh dampak nyata terhadap pengguna mencakup eksploitasi yang telah dikonfirmasi, paparan
data atau rahasia pengguna, konten berbahaya yang menjangkau pengguna akibat kegagalan platform,
atau masalah apa pun yang mengharuskan pengguna merotasi kredensial, memperbarui perangkat lunak lokal, atau
mengambil tindakan perlindungan lainnya.

Kerentanan dalam perangkat lunak yang diinstal pengguna diungkapkan kepada publik, seperti
paket CLI ClawHub, berkas biner, pustaka, atau artefak rilis lain yang perlu
diperbarui pengguna secara lokal.

## Halaman terkait

Untuk label audit saat instalasi, tingkat risiko, temuan, dan interpretasi, lihat
[Audit Keamanan](/clawhub/security-audits).

Untuk laporan marketplace, penangguhan moderasi, daftar tersembunyi, pemblokiran, dan status
akun, lihat [Moderasi dan Keamanan Akun](/clawhub/moderation).
