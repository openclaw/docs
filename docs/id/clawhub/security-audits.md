---
read_when:
    - Memahami hasil audit keamanan ClawHub
    - Memutuskan apakah akan memasang skill atau plugin
    - Menjelaskan status audit ClawHub, tingkat risiko, atau temuan
sidebarTitle: Security Audits
summary: Cara memahami hasil audit keamanan ClawHub sebelum memasang skill atau Plugin.
title: Audit Keamanan
x-i18n:
    generated_at: "2026-07-04T11:03:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# Audit Keamanan

Audit keamanan ClawHub membantu Anda memutuskan apakah suatu skill atau plugin cukup aman
untuk diinstal. Audit ini menunjukkan apa yang dilakukan sebuah rilis, otoritas apa yang dimintanya, dan
apakah ada hal yang perlu perhatian ekstra sebelum dapat mengakses file, akun,
kredensial, kode, atau layanan eksternal.

Audit adalah sinyal keamanan yang kuat, tetapi bukan jaminan bahwa sebuah rilis
bebas risiko. Selalu gunakan penilaian sebelum memberikan akses sensitif.

Lihat juga [Keamanan](/clawhub/security), [Penggunaan yang dapat diterima](/clawhub/acceptable-usage),
dan [Moderasi dan Keamanan Akun](/clawhub/moderation).

## Yang perlu diperiksa sebelum menginstal

Sebelum menginstal, tinjau:

- status audit keseluruhan
- tingkat risiko
- temuan yang tercantum
- kredensial, izin, atau variabel lingkungan yang diperlukan
- pemilik, sumber, versi, changelog, unduhan, bintang, dan sinyal kepercayaan lainnya

Instal hanya konten yang Anda pahami dan percayai.

## Status audit

Status audit memberi tahu Anda cara bereaksi terhadap hasil audit:

| Status      | Arti                                                                   |
| ----------- | ------------------------------------------------------------------------- |
| `Pass`      | Tidak ditemukan masalah yang terlihat di atas risiko rendah.                                |
| `Review`    | Baca temuan sebelum menginstal. Rilis ini mungkin tetap sah. |
| `Warn`      | Gunakan kehati-hatian ekstra. ClawHub menemukan kekhawatiran berdampak tinggi atau sinyal peringatan. |
| `Malicious` | Jangan instal.                                                           |
| `Pending`   | Audit belum selesai.                                             |
| `Error`     | Audit tidak dapat diselesaikan.                                         |

`Pass` menenangkan, tetapi tidak menggantikan penilaian Anda sendiri. Ini paling penting
untuk alat yang dapat menerbitkan konten, mengedit data, menjalankan perintah, membaca file, atau
mengakses sistem produksi.

## Tingkat risiko

Tingkat risiko menggambarkan radius dampak: seberapa besar kekuatan yang tampaknya dimiliki rilis jika
Anda menggunakannya sebagaimana dimaksud.

| Tingkat risiko | Arti                                                                       |
| ---------- | ----------------------------------------------------------------------------- |
| `Low`      | Sedikit otoritas sensitif atau dampak pengguna yang ditemukan.                          |
| `Medium`   | Rilis memiliki otoritas bermakna, seperti akses akun atau perubahan data. |
| `High`     | Rilis memiliki otoritas berdampak tinggi, temuan berat, atau sinyal berbahaya. |

Tingkat risiko dan status audit menjawab pertanyaan yang berbeda:

- Tingkat risiko bertanya: "Seberapa besar kekuatan yang ada di sini?"
- Status audit bertanya: "Apa yang harus saya lakukan dengan hasil ini?"

Misalnya, skill penerbitan dapat menampilkan `Review` dengan risiko `Medium`. Itu
tidak berarti skill tersebut berbahaya. Itu berarti skill tampaknya selaras dengan tujuannya, tetapi dapat
bertindak dengan otoritas akun yang bermakna.

## Temuan

Temuan menjelaskan mengapa suatu hasil audit ditampilkan. Setiap temuan biasanya mencakup:

- apa artinya
- mengapa ditandai
- konten skill atau plugin yang relevan
- rekomendasi

Temuan dapat diberi label `Info`, `Low`, `Medium`, `High`, atau `Critical`. Temuan dengan
tingkat keparahan lebih tinggi berkontribusi lebih kuat pada tingkat risiko dan status audit.

Temuan dengan keyakinan rendah disembunyikan dari ringkasan audit publik agar halaman
tetap berfokus pada bukti yang berguna.

## Yang diperiksa ClawHub

ClawHub mengaudit artefak rilis yang dikirimkan, termasuk:

- instruksi skill atau metadata plugin
- variabel lingkungan dan izin yang dideklarasikan
- instruksi instalasi dan metadata paket
- file yang disertakan dan manifes file
- metadata kompatibilitas dan kapabilitas

Pertanyaan utamanya adalah koherensi: apakah nama, ringkasan, metadata, otoritas yang diminta,
dan konten aktual selaras dengan apa yang secara wajar diharapkan pengguna?

Perilaku yang kuat tidak otomatis buruk. Banyak alat berguna memerlukan kredensial,
perintah lokal, API penyedia, atau instalasi paket. Audit memeriksa apakah kekuatan itu
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
memungkinkan ClawHub menambahkan intelijen keamanan yang lebih luas ke tinjauan skill dan plugin.

VirusTotal sangat berguna untuk artefak berbahaya yang sudah dikenal, hit mesin, dan
sinyal reputasi yang melengkapi tinjauan ClawHub yang sadar agen. Ketika jumlah mesin
vendor tersedia, audit merangkumnya dalam bahasa sederhana, seperti:

```text
62/62 vendors flagged this skill as clean.
```

atau:

```text
2/64 vendors flagged this skill as malicious, 1/64 flagged it as suspicious, and 61/64 flagged it as clean.
```

Ketika ClawHub tidak memiliki telemetri jumlah vendor untuk dirangkum, audit menyatakan:

```text
No VirusTotal findings
```

VirusTotal tetap merupakan telemetri. Itu tidak menggantikan analisis risiko ClawHub sendiri
yang sadar artefak.

## Analisis risiko

Analisis risiko didukung secara internal oleh ClawScan, sistem audit keamanan milik ClawHub
sendiri. Sistem ini meninjau setiap rilis sebagai artefak yang ditujukan untuk agen: instruksi,
metadata, izin yang dideklarasikan, file, sinyal kapabilitas, sinyal pemindaian statis,
temuan SkillSpector, telemetri VirusTotal, dan konteks yang diberikan penerbit.
Sinyal pemindaian statis adalah konteks internal untuk tinjauan ini; sinyal tersebut bukan
bagian audit publik mandiri atau putusan yang memblokir instalasi.

Analisis risiko menggunakan
[OWASP Agentic Skills Top 10](https://owasp.org/www-project-agentic-skills-top-10/)
sebagai lensa untuk risiko seperti prompt injection, penyalahgunaan alat, paparan kredensial,
eksekusi tidak aman, peracunan memori atau konteks, dan agensi berlebihan.

ClawScan tidak memperlakukan kapabilitas yang tampak menakutkan sebagai otomatis berbahaya.
ClawScan menanyakan apakah kapabilitas tersebut diungkapkan, selaras dengan tujuan, dan didukung oleh
kasus penggunaan yang dinyatakan rilis tersebut.
