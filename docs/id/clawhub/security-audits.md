---
read_when:
    - Memahami hasil audit keamanan ClawHub
    - Memutuskan apakah akan memasang skill atau plugin
    - Menjelaskan status audit ClawHub, tingkat risiko, atau temuan
sidebarTitle: Security Audits
summary: Cara memahami hasil audit keamanan ClawHub sebelum memasang skill atau plugin.
title: Audit Keamanan
x-i18n:
    generated_at: "2026-06-28T10:03:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# Audit Keamanan

Audit keamanan ClawHub membantu Anda memutuskan apakah suatu keterampilan atau Plugin cukup aman
untuk dipasang. Audit menunjukkan apa yang dilakukan sebuah rilis, otoritas apa yang dimintanya, dan
apakah ada hal yang memerlukan perhatian ekstra sebelum dapat mengakses file, akun,
kredensial, kode, atau layanan eksternal.

Audit adalah sinyal keamanan yang kuat, tetapi bukan jaminan bahwa sebuah rilis
bebas risiko. Selalu gunakan penilaian Anda sebelum memberikan akses sensitif.

Lihat juga [Keamanan](/id/clawhub/security), [Penggunaan yang dapat diterima](/id/clawhub/acceptable-usage),
dan [Moderasi dan Keamanan Akun](/id/clawhub/moderation).

## Yang perlu diperiksa sebelum memasang

Sebelum memasang, tinjau:

- status audit keseluruhan
- tingkat risiko
- setiap temuan yang tercantum
- kredensial, izin, atau variabel lingkungan yang diperlukan
- pemilik, sumber, versi, changelog, unduhan, bintang, dan sinyal kepercayaan lainnya

Pasang hanya konten yang Anda pahami dan percayai.

## Status audit

Status audit memberi tahu Anda cara merespons hasil audit:

| Status      | Arti                                                                   |
| ----------- | ------------------------------------------------------------------------- |
| `Pass`      | Tidak ditemukan masalah yang terlihat di atas risiko rendah.                                |
| `Review`    | Baca temuan sebelum memasang. Rilis tersebut mungkin tetap sah. |
| `Warn`      | Gunakan kehati-hatian ekstra. ClawHub menemukan masalah berdampak tinggi atau sinyal peringatan. |
| `Malicious` | Jangan pasang.                                                           |
| `Pending`   | Audit belum selesai.                                             |
| `Error`     | Audit tidak dapat diselesaikan.                                         |

`Pass` meyakinkan, tetapi tidak menggantikan penilaian Anda sendiri. Ini paling penting
untuk alat yang dapat menerbitkan konten, mengedit data, menjalankan perintah, membaca file, atau
mengakses sistem produksi.

## Tingkat risiko

Tingkat risiko menggambarkan radius dampak: seberapa besar kuasa yang tampaknya dimiliki rilis jika
Anda menggunakannya sesuai tujuan.

| Tingkat risiko | Arti                                                                       |
| ---------- | ----------------------------------------------------------------------------- |
| `Low`      | Sedikit otoritas sensitif atau dampak pengguna yang ditemukan.                          |
| `Medium`   | Rilis memiliki otoritas yang berarti, seperti akses akun atau perubahan data. |
| `High`     | Rilis memiliki otoritas berdampak tinggi, temuan parah, atau sinyal berbahaya. |

Tingkat risiko dan status audit menjawab pertanyaan yang berbeda:

- Tingkat risiko bertanya: "Seberapa besar kuasa yang ada di sini?"
- Status audit bertanya: "Apa yang harus saya lakukan dengan hasil ini?"

Misalnya, keterampilan penerbitan dapat menampilkan `Review` dengan risiko `Medium`. Itu
tidak berarti keterampilan tersebut berbahaya. Itu berarti keterampilan tersebut tampak selaras dengan tujuan, tetapi dapat
bertindak dengan otoritas akun yang berarti.

## Temuan

Temuan menjelaskan mengapa hasil audit ditampilkan. Setiap temuan biasanya mencakup:

- artinya
- mengapa hal itu ditandai
- konten keterampilan atau Plugin yang relevan
- rekomendasi

Temuan dapat diberi label `Info`, `Low`, `Medium`, `High`, atau `Critical`. Temuan dengan
tingkat keparahan lebih tinggi berkontribusi lebih kuat pada tingkat risiko dan status audit.

Temuan dengan tingkat keyakinan rendah disembunyikan dari ringkasan audit publik agar halaman
tetap berfokus pada bukti yang berguna.

## Yang diperiksa ClawHub

ClawHub mengaudit artefak rilis yang dikirimkan, termasuk:

- instruksi keterampilan atau metadata Plugin
- variabel lingkungan dan izin yang dideklarasikan
- instruksi pemasangan dan metadata paket
- file yang disertakan dan manifes file
- metadata kompatibilitas dan kapabilitas

Pertanyaan utamanya adalah koherensi: apakah nama, ringkasan, metadata, otoritas yang diminta,
dan konten aktual selaras dengan apa yang secara wajar diharapkan pengguna?

Perilaku yang kuat tidak otomatis buruk. Banyak alat yang berguna memerlukan kredensial,
perintah lokal, API penyedia, atau pemasangan paket. Audit memeriksa apakah kuasa tersebut
diharapkan, diungkapkan, dan proporsional.

Halaman artefak menautkan ke audit lengkap di:

```text
/<owner>/skills/<slug>/security-audit
```

Halaman audit menggabungkan:

1. SkillSpector
2. VirusTotal
3. Analisis risiko

## VirusTotal

ClawHub menggunakan VirusTotal sebagai telemetri malware dalam tumpukan audit. VirusTotal adalah
standar industri tepercaya untuk reputasi file dan pemindaian malware, dan kemitraan kami
memungkinkan ClawHub menambahkan intelijen keamanan yang lebih luas ke peninjauan keterampilan dan Plugin.

VirusTotal sangat berguna untuk artefak berbahaya yang sudah dikenal, deteksi mesin, dan
sinyal reputasi yang melengkapi peninjauan ClawHub yang sadar agen. Saat jumlah mesin vendor
tersedia, audit merangkumnya dalam bahasa sederhana, seperti:

```text
62/62 vendors flagged this skill as clean.
```

atau:

```text
2/64 vendors flagged this skill as malicious, 1/64 flagged it as suspicious, and 61/64 flagged it as clean.
```

Saat ClawHub tidak memiliki telemetri jumlah vendor untuk dirangkum, audit menyatakan:

```text
No VirusTotal findings
```

VirusTotal tetap merupakan telemetri. Ia tidak menggantikan analisis risiko ClawHub sendiri
yang sadar artefak.

## Analisis risiko

Analisis risiko didukung secara internal oleh ClawScan, sistem audit keamanan milik ClawHub
sendiri. Sistem ini meninjau setiap rilis sebagai artefak yang berhadapan dengan agen: instruksi,
metadata, izin yang dideklarasikan, file, sinyal kapabilitas, sinyal pemindaian statis,
temuan SkillSpector, telemetri VirusTotal, dan konteks yang diberikan penerbit.
Sinyal pemindaian statis adalah konteks internal untuk peninjauan ini; sinyal tersebut bukan
bagian audit publik mandiri atau putusan yang memblokir pemasangan.

Analisis risiko menggunakan
[OWASP Agentic Skills Top 10](https://owasp.org/www-project-agentic-skills-top-10/)
sebagai lensa untuk risiko seperti injeksi prompt, penyalahgunaan alat, paparan kredensial,
eksekusi tidak aman, peracunan memori atau konteks, dan agensi berlebihan.

ClawScan tidak memperlakukan kapabilitas yang tampak menakutkan sebagai otomatis berbahaya.
Ia menanyakan apakah kapabilitas tersebut diungkapkan, selaras dengan tujuan, dan didukung oleh
kasus penggunaan yang dinyatakan rilis tersebut.
