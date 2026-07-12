---
read_when:
    - Menanggapi laporan keamanan atau dugaan insiden keamanan
    - Menyiapkan pengungkapan terkoordinasi atau rilis keamanan yang telah ditambal
    - Meninjau ekspektasi tindak lanjut pascainsiden
summary: Cara OpenClaw melakukan triase, merespons, dan menindaklanjuti insiden keamanan
title: Respons insiden
x-i18n:
    generated_at: "2026-07-12T14:39:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 30f2d754408e95133ee86254ce193c0d8aab293040df55e0c1cec0c4d7644c56
    source_path: security/incident-response.md
    workflow: 16
---

## 1. Deteksi dan triase

Sinyal keamanan berasal dari:

- GitHub Security Advisories (GHSA) dan laporan kerentanan privat.
- Isu/diskusi GitHub publik jika laporan tidak bersifat sensitif.
- Sinyal otomatis: Dependabot, CodeQL, advisori npm, pemindaian rahasia.

Triase awal:

1. Konfirmasikan komponen dan versi yang terdampak, serta dampaknya terhadap batas kepercayaan.
2. Klasifikasikan sebagai masalah keamanan atau penguatan/tanpa tindakan, menggunakan aturan cakupan dan di luar cakupan dalam `SECURITY.md`.
3. Penanggung jawab insiden merespons sesuai klasifikasi tersebut.

## 2. Tingkat keparahan

| Tingkat keparahan | Definisi                                                                                                                                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Kritis            | Kompromi paket/rilis/repositori, eksploitasi aktif, atau penerobosan batas kepercayaan tanpa autentikasi yang memberikan kendali berdampak tinggi atau mengekspos data.                                        |
| Tinggi            | Penerobosan batas kepercayaan yang terverifikasi dan memerlukan prasyarat terbatas (misalnya, tindakan berdampak tinggi oleh pengguna terautentikasi tetapi tanpa otorisasi), atau tereksposnya kredensial sensitif milik OpenClaw. |
| Sedang            | Kelemahan keamanan signifikan dengan dampak praktis, tetapi memiliki keterbatasan untuk dieksploitasi atau memerlukan prasyarat yang substansial.                                                              |
| Rendah            | Temuan pertahanan berlapis, penolakan layanan dengan cakupan sempit, atau kesenjangan penguatan/paritas tanpa penerobosan batas kepercayaan yang telah dibuktikan.                                              |

## 3. Respons

1. Konfirmasikan penerimaan laporan kepada pelapor (secara privat jika sensitif).
2. Reproduksi pada rilis yang didukung dan `main` terbaru, lalu implementasikan dan validasi patch dengan cakupan pengujian regresi.
3. Kritis/tinggi: siapkan rilis yang telah ditambal secepat mungkin secara praktis.
4. Sedang/rendah: terapkan patch melalui alur rilis normal dan dokumentasikan panduan mitigasi.

## 4. Komunikasi dan pengungkapan

Lakukan komunikasi melalui GitHub Security Advisories di repositori yang terdampak, catatan rilis/entri log perubahan untuk versi yang telah diperbaiki, serta tindak lanjut langsung kepada pelapor mengenai status dan penyelesaian.

Insiden kritis/tinggi ditangani dengan pengungkapan terkoordinasi, termasuk penerbitan CVE jika sesuai. Temuan penguatan berisiko rendah dapat didokumentasikan dalam catatan rilis atau advisori tanpa CVE, bergantung pada dampak dan paparan pengguna.

## 5. Pemulihan dan tindak lanjut

Setelah perbaikan dirilis:

1. Verifikasi remediasi dalam CI dan artefak rilis.
2. Lakukan tinjauan singkat pascainsiden: linimasa, akar penyebab, kesenjangan deteksi, dan rencana pencegahan.
3. Tambahkan tugas tindak lanjut untuk penguatan/pengujian/dokumentasi dan pantau hingga selesai.

## Terkait

- [Kebijakan keamanan](https://github.com/openclaw/openclaw/blob/main/SECURITY.md) — cakupan laporan dan model kepercayaan.
- [Model ancaman](/id/security/THREAT-MODEL-ATLAS)
