---
read_when:
    - Menanggapi laporan keamanan atau dugaan insiden keamanan
    - Mempersiapkan pengungkapan terkoordinasi atau rilis keamanan yang sudah memuat perbaikan
    - Meninjau ekspektasi tindak lanjut pascainsiden
summary: Bagaimana OpenClaw melakukan triase, merespons, dan menindaklanjuti insiden keamanan
title: Respons insiden
x-i18n:
    generated_at: "2026-05-03T21:36:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef39b037cf3574a61fd67b356654f1ea0b91d84f89345c22aae93c1db7694df8
    source_path: security/incident-response.md
    workflow: 16
---

# Respons Insiden

## 1. Deteksi dan triase

Kami memantau sinyal keamanan dari:

- GitHub Security Advisories (GHSA) dan laporan kerentanan privat.
- Isu/diskusi GitHub publik saat laporan tidak sensitif.
- Sinyal otomatis (misalnya Dependabot, CodeQL, advisori npm, dan pemindaian rahasia).

Triase awal:

1. Konfirmasi komponen, versi, dan dampak batas kepercayaan yang terdampak.
2. Klasifikasikan sebagai isu keamanan vs penguatan/tanpa tindakan menggunakan cakupan `SECURITY.md` repositori dan aturan di luar cakupan.
3. Pemilik insiden merespons sesuai kebutuhan.

## 2. Penilaian

Panduan tingkat keparahan:

- **Kritis:** Kompromi paket/rilis/repositori, eksploitasi aktif, atau bypass batas kepercayaan tanpa autentikasi dengan kontrol berdampak tinggi atau paparan data.
- **Tinggi:** Bypass batas kepercayaan terverifikasi yang memerlukan prasyarat terbatas (misalnya tindakan berdampak tinggi yang terautentikasi tetapi tidak diotorisasi), atau paparan kredensial sensitif milik OpenClaw.
- **Sedang:** Kelemahan keamanan signifikan dengan dampak praktis tetapi eksploitabilitas terbatas atau prasyarat substansial.
- **Rendah:** Temuan pertahanan berlapis, penolakan layanan dengan cakupan sempit, atau celah penguatan/paritas tanpa bypass batas kepercayaan yang ditunjukkan.

## 3. Respons

1. Akui penerimaan kepada pelapor (secara privat jika sensitif).
2. Reproduksi pada rilis yang didukung dan `main` terbaru, lalu implementasikan dan validasi patch dengan cakupan regresi.
3. Untuk insiden kritis/tinggi, siapkan rilis yang sudah dipatch secepat mungkin secara praktis.
4. Untuk insiden sedang/rendah, patch dalam alur rilis normal dan dokumentasikan panduan mitigasi.

## 4. Komunikasi

Kami berkomunikasi melalui:

- GitHub Security Advisories di repositori yang terdampak.
- Catatan rilis/entri changelog untuk versi yang diperbaiki.
- Tindak lanjut langsung kepada pelapor tentang status dan resolusi.

Kebijakan pengungkapan:

- Insiden kritis/tinggi harus menerima pengungkapan terkoordinasi, dengan penerbitan CVE jika sesuai.
- Temuan penguatan berisiko rendah dapat didokumentasikan dalam catatan rilis atau advisori tanpa CVE, tergantung dampak dan paparan pengguna.

## 5. Pemulihan dan tindak lanjut

Setelah perbaikan dikirimkan:

1. Verifikasi remediasi dalam CI dan artefak rilis.
2. Jalankan tinjauan singkat pascainsiden (linimasa, akar penyebab, celah deteksi, rencana pencegahan).
3. Tambahkan tugas tindak lanjut untuk penguatan/tes/dokumentasi dan lacak hingga selesai.
