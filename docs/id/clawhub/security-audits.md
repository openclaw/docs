---
read_when:
    - Memahami hasil audit keamanan ClawHub
    - Menentukan apakah akan memasang Skills atau Plugin
    - Menjelaskan status audit ClawHub, tingkat risiko, atau temuan
sidebarTitle: Security Audits
summary: Cara memahami hasil audit keamanan ClawHub sebelum memasang skill atau plugin.
title: Audit Keamanan
x-i18n:
    generated_at: "2026-07-03T01:04:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# Audit Keamanan

Audit keamanan ClawHub membantu Anda memutuskan apakah suatu keterampilan atau Plugin cukup aman
untuk dipasang. Audit ini menunjukkan apa yang dilakukan sebuah rilis, otoritas apa yang dimintanya, dan
apakah ada hal yang perlu perhatian ekstra sebelum dapat mengakses berkas, akun,
kredensial, kode, atau layanan eksternal.

Audit adalah sinyal keamanan yang kuat, tetapi bukan jaminan bahwa sebuah rilis
bebas risiko. Selalu gunakan pertimbangan sebelum memberikan akses sensitif.

Lihat juga [Keamanan](/clawhub/security), [Penggunaan yang dapat diterima](/clawhub/acceptable-usage),
dan [Moderasi dan Keamanan Akun](/clawhub/moderation).

## Yang perlu diperiksa sebelum memasang

Sebelum memasang, tinjau:

- status audit keseluruhan
- tingkat risiko
- temuan apa pun yang tercantum
- kredensial, izin, atau variabel lingkungan yang diperlukan
- pemilik, sumber, versi, changelog, unduhan, bintang, dan sinyal kepercayaan lainnya

Pasang hanya konten yang Anda pahami dan percayai.

## Status audit

Status audit memberi tahu Anda cara menanggapi hasil audit:

| Status      | Arti                                                                      |
| ----------- | ------------------------------------------------------------------------- |
| `Pass`      | Tidak ditemukan masalah terlihat di atas risiko rendah.                   |
| `Review`    | Baca temuan sebelum memasang. Rilis ini mungkin tetap sah.                |
| `Warn`      | Gunakan kehati-hatian ekstra. ClawHub menemukan kekhawatiran berdampak tinggi atau sinyal peringatan. |
| `Malicious` | Jangan pasang.                                                            |
| `Pending`   | Audit belum selesai.                                                      |
| `Error`     | Audit tidak dapat diselesaikan.                                           |

`Pass` meyakinkan, tetapi tidak menggantikan pertimbangan Anda sendiri. Ini paling penting
untuk alat yang dapat menerbitkan konten, mengedit data, menjalankan perintah, membaca berkas, atau
mengakses sistem produksi.

## Tingkat risiko

Tingkat risiko menjelaskan radius dampak: seberapa besar kuasa yang tampaknya dimiliki rilis tersebut jika
Anda menggunakannya sebagaimana dimaksud.

| Tingkat risiko | Arti                                                                        |
| ---------- | ----------------------------------------------------------------------------- |
| `Low`      | Ditemukan sedikit otoritas sensitif atau dampak pengguna.                     |
| `Medium`   | Rilis memiliki otoritas bermakna, seperti akses akun atau perubahan data.     |
| `High`     | Rilis memiliki otoritas berdampak tinggi, temuan berat, atau sinyal berbahaya. |

Tingkat risiko dan status audit menjawab pertanyaan yang berbeda:

- Tingkat risiko bertanya: "Seberapa besar kuasa yang ada di sini?"
- Status audit bertanya: "Apa yang harus saya lakukan dengan hasil ini?"

Misalnya, sebuah keterampilan penerbitan mungkin menampilkan `Review` dengan risiko `Medium`. Itu
tidak berarti keterampilan tersebut berbahaya. Itu berarti keterampilan tersebut tampak selaras dengan tujuan, tetapi dapat
bertindak dengan otoritas akun yang bermakna.

## Temuan

Temuan menjelaskan mengapa hasil audit ditampilkan. Setiap temuan biasanya mencakup:

- apa artinya
- mengapa ditandai
- konten keterampilan atau Plugin yang relevan
- rekomendasi

Temuan dapat diberi label `Info`, `Low`, `Medium`, `High`, atau `Critical`. Temuan dengan
tingkat keparahan lebih tinggi berkontribusi lebih kuat terhadap tingkat risiko dan status audit.

Temuan dengan kepercayaan rendah disembunyikan dari ringkasan audit publik agar halaman
tetap berfokus pada bukti yang berguna.

## Yang diperiksa ClawHub

ClawHub mengaudit artefak rilis yang dikirimkan, termasuk:

- instruksi keterampilan atau metadata Plugin
- variabel lingkungan dan izin yang dideklarasikan
- instruksi pemasangan dan metadata paket
- berkas yang disertakan dan manifes berkas
- metadata kompatibilitas dan kapabilitas

Pertanyaan utamanya adalah koherensi: apakah nama, ringkasan, metadata, otoritas yang diminta,
dan konten aktual selaras dengan apa yang secara wajar diharapkan pengguna?

Perilaku yang kuat tidak otomatis buruk. Banyak alat berguna membutuhkan kredensial,
perintah lokal, API penyedia, atau pemasangan paket. Audit memeriksa apakah
kuasa tersebut diharapkan, diungkapkan, dan proporsional.

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
standar industri tepercaya untuk reputasi berkas dan pemindaian malware, dan
kemitraan kami memungkinkan ClawHub menambahkan intelijen keamanan yang lebih luas ke peninjauan keterampilan dan Plugin.

VirusTotal sangat berguna untuk artefak berbahaya yang diketahui, deteksi mesin, dan
sinyal reputasi yang melengkapi peninjauan sadar-agen ClawHub. Ketika jumlah
mesin vendor tersedia, audit merangkumnya dalam bahasa sederhana, seperti:

```text
62/62 vendors flagged this skill as clean.
```

atau:

```text
2/64 vendors flagged this skill as malicious, 1/64 flagged it as suspicious, and 61/64 flagged it as clean.
```

Ketika ClawHub tidak memiliki telemetri jumlah vendor untuk diringkas, audit menyatakan:

```text
No VirusTotal findings
```

VirusTotal tetap merupakan telemetri. Itu tidak menggantikan analisis risiko
sadar-artefak milik ClawHub sendiri.

## Analisis risiko

Analisis risiko ditenagai secara internal oleh ClawScan, sistem audit keamanan milik
ClawHub sendiri. Sistem ini meninjau setiap rilis sebagai artefak yang ditujukan untuk agen: instruksi,
metadata, izin yang dideklarasikan, berkas, sinyal kapabilitas, sinyal pemindaian statis,
temuan SkillSpector, telemetri VirusTotal, dan konteks yang diberikan penerbit.
Sinyal pemindaian statis adalah konteks internal untuk peninjauan ini; sinyal tersebut bukan
bagian audit publik mandiri atau vonis pemblokiran pemasangan.

Analisis risiko menggunakan
[OWASP Agentic Skills Top 10](https://owasp.org/www-project-agentic-skills-top-10/)
sebagai lensa untuk risiko seperti injeksi prompt, penyalahgunaan alat, paparan kredensial,
eksekusi tidak aman, peracunan memori atau konteks, dan agensi berlebihan.

ClawScan tidak memperlakukan kapabilitas yang tampak menakutkan sebagai otomatis berbahaya.
ClawScan menanyakan apakah kapabilitas tersebut diungkapkan, selaras dengan tujuan, dan didukung oleh
kasus penggunaan yang dinyatakan rilis tersebut.
