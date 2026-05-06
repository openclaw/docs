---
read_when:
    - Menanggapi laporan keamanan atau dugaan insiden keamanan
    - Mempersiapkan pengungkapan terkoordinasi atau rilis keamanan yang berisi tambalan
    - Meninjau ekspektasi tindak lanjut pascainsiden
summary: Bagaimana OpenClaw melakukan triase, menanggapi, dan menindaklanjuti insiden keamanan
title: Respons insiden
x-i18n:
    generated_at: "2026-05-06T09:27:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 546b69242fc4674e3d27e79e4c7b5cfecb83bcb17e8edb2a4b62f1a7498fb84f
    source_path: security/incident-response.md
    workflow: 16
---

## 1. Deteksi dan triase

Kami memantau sinyal keamanan dari:

- GitHub Security Advisories (GHSA) dan laporan kerentanan privat.
- Isu/diskusi GitHub publik ketika laporan tidak sensitif.
- Sinyal otomatis (misalnya Dependabot, CodeQL, advisori npm, dan pemindaian rahasia).

Triase awal:

1. Konfirmasi komponen yang terdampak, versi, dan dampak batas kepercayaan.
2. Klasifikasikan sebagai isu keamanan vs pengerasan/tanpa tindakan menggunakan cakupan `SECURITY.md` repositori dan aturan di luar cakupan.
3. Pemilik insiden merespons sesuai kebutuhan.

## 2. Penilaian

Panduan tingkat keparahan:

- **Kritis:** Penyusupan paket/rilis/repositori, eksploitasi aktif, atau bypass batas kepercayaan tanpa autentikasi dengan kontrol berdampak tinggi atau paparan data.
- **Tinggi:** Bypass batas kepercayaan yang terverifikasi dan memerlukan prasyarat terbatas (misalnya tindakan berdampak tinggi yang terautentikasi tetapi tidak terotorisasi), atau paparan kredensial sensitif milik OpenClaw.
- **Sedang:** Kelemahan keamanan signifikan dengan dampak praktis tetapi eksploitabilitas terbatas atau prasyarat substansial.
- **Rendah:** Temuan pertahanan berlapis, denial-of-service bercakupan sempit, atau celah pengerasan/paritas tanpa bypass batas kepercayaan yang terbukti.

## 3. Respons

1. Akui penerimaan kepada pelapor (secara privat ketika sensitif).
2. Reproduksi pada rilis yang didukung dan `main` terbaru, lalu implementasikan dan validasi patch dengan cakupan regresi.
3. Untuk insiden kritis/tinggi, siapkan rilis yang telah dipatch secepat yang praktis.
4. Untuk insiden sedang/rendah, patch dalam alur rilis normal dan dokumentasikan panduan mitigasi.

## 4. Komunikasi

Kami berkomunikasi melalui:

- GitHub Security Advisories di repositori yang terdampak.
- Entri catatan rilis/catatan perubahan untuk versi yang diperbaiki.
- Tindak lanjut langsung kepada pelapor mengenai status dan penyelesaian.

Kebijakan pengungkapan:

- Insiden kritis/tinggi harus menerima pengungkapan terkoordinasi, dengan penerbitan CVE bila sesuai.
- Temuan pengerasan berisiko rendah dapat didokumentasikan dalam catatan rilis atau advisori tanpa CVE, bergantung pada dampak dan paparan pengguna.

## 5. Pemulihan dan tindak lanjut

Setelah mengirimkan perbaikan:

1. Verifikasi remediasi di CI dan artefak rilis.
2. Jalankan tinjauan singkat pascainsiden (linimasa, akar penyebab, celah deteksi, rencana pencegahan).
3. Tambahkan tugas tindak lanjut untuk pengerasan/pengujian/dokumentasi dan lacak hingga selesai.
