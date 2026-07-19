---
read_when:
    - Memahami hasil audit keamanan ClawHub
    - Menentukan apakah akan menginstal skill atau plugin
    - Menjelaskan status audit, tingkat risiko, atau temuan ClawHub
sidebarTitle: Security Audits
summary: Cara memahami hasil audit keamanan ClawHub sebelum menginstal skill atau plugin.
title: Audit Keamanan
x-i18n:
    generated_at: "2026-07-19T05:00:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# Audit Keamanan

Audit keamanan ClawHub membantu Anda memutuskan apakah suatu skill atau plugin cukup aman
untuk diinstal. Audit ini menunjukkan tindakan suatu rilis, wewenang yang dimintanya, dan
apakah ada sesuatu yang memerlukan perhatian tambahan sebelum dapat mengakses file, akun,
kredensial, kode, atau layanan eksternal.

Audit merupakan sinyal keamanan yang kuat, tetapi bukan jaminan bahwa suatu rilis
bebas risiko. Selalu gunakan pertimbangan sebelum memberikan akses sensitif.

Lihat juga [Keamanan](/clawhub/security), [Penggunaan yang dapat diterima](/clawhub/acceptable-usage),
dan [Moderasi dan Keamanan Akun](/clawhub/moderation).

## Hal yang perlu diperiksa sebelum menginstal

Sebelum menginstal, tinjau:

- status audit secara keseluruhan
- tingkat risiko
- setiap temuan yang tercantum
- kredensial, izin, atau variabel lingkungan yang diperlukan
- pemilik, sumber, versi, catatan perubahan, unduhan, bintang, dan sinyal kepercayaan lainnya

Instal hanya konten yang Anda pahami dan percayai.

## Status audit

Status audit memberi tahu Anda cara menanggapi hasil audit:

| Status      | Arti                                                                      |
| ----------- | ------------------------------------------------------------------------- |
| `Pass`      | Tidak ditemukan masalah yang terlihat di atas risiko rendah.              |
| `Review`    | Baca temuan sebelum menginstal. Rilis tersebut mungkin tetap sah.         |
| `Warn`      | Berhati-hatilah secara ekstra. ClawHub menemukan masalah berdampak tinggi atau sinyal peringatan. |
| `Malicious` | Jangan instal.                                                             |
| `Pending`   | Audit belum selesai.                                                       |
| `Error`     | Audit tidak dapat diselesaikan.                                            |

`Pass` memberikan keyakinan, tetapi tidak menggantikan pertimbangan Anda sendiri. Hal ini paling
penting untuk alat yang dapat menerbitkan konten, mengedit data, menjalankan perintah, membaca file, atau
mengakses sistem produksi.

## Tingkat risiko

Tingkat risiko menggambarkan cakupan dampak: seberapa besar kuasa yang tampaknya dimiliki rilis jika
Anda menggunakannya sebagaimana dimaksud.

| Tingkat risiko | Arti                                                                          |
| -------------- | ----------------------------------------------------------------------------- |
| `Low`      | Ditemukan sedikit wewenang sensitif atau dampak terhadap pengguna.            |
| `Medium`   | Rilis memiliki wewenang yang berarti, seperti akses akun atau perubahan data. |
| `High`     | Rilis memiliki wewenang berdampak tinggi, temuan berat, atau sinyal berbahaya. |

Tingkat risiko dan status audit menjawab pertanyaan yang berbeda:

- Tingkat risiko menanyakan: "Seberapa besar kuasa yang ada di sini?"
- Status audit menanyakan: "Apa yang harus saya lakukan dengan hasil ini?"

Sebagai contoh, skill penerbitan mungkin menampilkan `Review` dengan risiko `Medium`. Hal itu
tidak berarti skill tersebut berbahaya. Artinya, skill tersebut tampak selaras dengan tujuannya, tetapi dapat
bertindak dengan wewenang akun yang berarti.

## Temuan

Temuan menjelaskan alasan suatu hasil audit ditampilkan. Setiap temuan biasanya mencakup:

- artinya
- alasan hal tersebut ditandai
- konten skill atau plugin yang relevan
- rekomendasi

Temuan dapat diberi label `Info`, `Low`, `Medium`, `High`, atau `Critical`. Temuan dengan
tingkat keparahan lebih tinggi memberikan kontribusi lebih besar terhadap tingkat risiko dan status audit.

Temuan dengan tingkat keyakinan rendah disembunyikan dari ringkasan audit publik agar halaman
tetap berfokus pada bukti yang berguna.

## Hal yang diperiksa ClawHub

ClawHub mengaudit artefak rilis yang dikirimkan, termasuk:

- instruksi skill atau metadata plugin
- variabel lingkungan dan izin yang dinyatakan
- instruksi instalasi dan metadata paket
- file yang disertakan dan manifes file
- metadata kompatibilitas dan kapabilitas

Pertanyaan utamanya adalah koherensi: apakah nama, ringkasan, metadata, wewenang yang diminta,
dan konten sebenarnya selaras dengan hal yang secara wajar diharapkan pengguna?

Perilaku yang berkuasa tidak otomatis buruk. Banyak alat yang berguna memerlukan kredensial,
perintah lokal, API penyedia, atau instalasi paket. Audit memeriksa apakah kuasa tersebut
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

ClawHub menggunakan VirusTotal sebagai telemetri malware dalam rangkaian audit. VirusTotal adalah
standar industri tepercaya untuk reputasi file dan pemindaian malware, dan kemitraan kami
memungkinkan ClawHub menambahkan intelijen keamanan yang lebih luas pada review skill dan plugin.

VirusTotal sangat berguna untuk artefak berbahaya yang telah dikenal, deteksi mesin, dan
sinyal reputasi yang melengkapi review ClawHub yang memahami agen. Jika jumlah mesin vendor
tersedia, audit merangkumnya dalam bahasa sederhana, seperti:

```text
62/62 vendor menandai skill ini sebagai bersih.
```

atau:

```text
2/64 vendor menandai skill ini sebagai berbahaya, 1/64 menandainya sebagai mencurigakan, dan 61/64 menandainya sebagai bersih.
```

Jika ClawHub tidak memiliki telemetri jumlah vendor untuk dirangkum, audit menyatakan:

```text
Tidak ada temuan VirusTotal
```

VirusTotal tetap merupakan telemetri. VirusTotal tidak menggantikan analisis risiko ClawHub sendiri
yang mempertimbangkan artefak.

## Analisis risiko

Analisis risiko secara internal didukung oleh ClawScan, sistem audit keamanan milik
ClawHub sendiri. Sistem ini meninjau setiap rilis sebagai artefak yang ditujukan kepada agen: instruksi,
metadata, izin yang dinyatakan, file, sinyal kapabilitas, sinyal pemindaian statis,
temuan SkillSpector, telemetri VirusTotal, dan konteks yang diberikan penerbit.
Sinyal pemindaian statis merupakan konteks internal untuk review ini; sinyal tersebut bukan
bagian audit publik mandiri atau keputusan yang memblokir instalasi.

Analisis risiko menggunakan
[OWASP Agentic Skills Top 10](https://owasp.org/www-project-agentic-skills-top-10/)
sebagai kerangka untuk risiko seperti injeksi prompt, penyalahgunaan alat, paparan kredensial,
eksekusi yang tidak aman, peracunan memori atau konteks, dan otonomi berlebihan.

ClawScan tidak menganggap kapabilitas yang tampak mengkhawatirkan sebagai sesuatu yang otomatis berbahaya.
ClawScan menilai apakah kapabilitas tersebut diungkapkan, selaras dengan tujuan, dan didukung oleh
kasus penggunaan yang dinyatakan oleh rilis tersebut.
