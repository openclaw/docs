---
read_when:
    - Anda sedang memvalidasi pembersihan performa dan ukuran paket Mei 2026
    - Anda memerlukan data angka yang mendasari postingan blog tentang kinerja dan dependensi OpenClaw
    - Anda mengubah gerbang rilis, shrinkwrap paket, atau batas dependensi plugin
summary: Ringkasan visual dan bukti teknis untuk pembersihan performa, ukuran paket, dependensi, dan shrinkwrap pada Mei 2026
title: Penyisiran kinerja rilis
x-i18n:
    generated_at: "2026-07-12T14:39:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e98ffc9d63e14e078a19368917eb4278695e1426048dc21942f928af145d5e1
    source_path: reference/release-performance-sweep.md
    workflow: 16
---

Halaman ini merangkum bukti di balik pembersihan kinerja, ukuran paket,
dependensi, dan shrinkwrap OpenClaw pada Mei 2026. Ini merupakan pendamping teknis
untuk artikel blog publik.

Dua audit digabungkan di sini:

- **Penyisiran kinerja rilis:** GitHub Releases dari `v2026.5.28` mundur hingga
  versi stabil `v2026.4.23`, menggunakan alur kerja `OpenClaw Performance`,
  `profile=smoke`, jalur penyedia tiruan. Sebagian besar baris tag menggunakan satu sampel;
  baris `v2026.5.27` dan `v2026.5.28` menggunakan artefak cabang rilis
  pengulangan-3 terbaru.
- **Konteks April sebelumnya:** baseline penyedia tiruan `clawgrit-reports`
  yang dipublikasikan dari `v2026.4.1` hingga `v2026.5.2`, hanya digunakan agar
  rilis rusak pada akhir April tidak dianggap sebagai baseline kinerja publik.
- **Penyisiran jejak instalasi:** instalasi baru `npm install --ignore-scripts`
  ke dalam paket sementara, dengan `du -sk node_modules` untuk ukuran dan
  penelusuran `node_modules` untuk jumlah instans paket.
- **Penyisiran ukuran paket npm:** `npm pack openclaw@<version> --dry-run --json`
  untuk rilis yang dipublikasikan, dengan mencatat ukuran tarball terkompresi, ukuran
  setelah diekstrak, dan jumlah berkas.

<Warning>
Penyisiran kinerja utama menggunakan satu sampel smoke per tag, kecuali baris
`v2026.5.27` dan `v2026.5.28`, yang menggunakan artefak cabang rilis
pengulangan-3 terbaru. Konteks April sebelumnya menggunakan median pengulangan-3
yang dipublikasikan dari `clawgrit-reports`. Perlakukan angka-angka tersebut sebagai bukti tren dan
sinyal pencarian regresi, bukan sebagai statistik gerbang rilis.
</Warning>

## Ringkasan

Cakupan kinerja: **77 rilis yang diminta**, **74 titik berbasis artefak**,
dan **3 proses CI yang tidak tersedia**. Titik stabil terbaru yang diukur: `v2026.5.28`.

<CardGroup cols={2}>
  <Card title="Putaran agen stabil" icon="gauge">
    **Putaran dingin 5,1x lebih cepat**

    - `v2026.4.14`: 9,8 dtk
    - `v2026.5.28`: 1,9 dtk

  </Card>
  <Card title="Paket yang dipublikasikan" icon="package">
    **Tarball 17,9MB**

    Paket stabil terbaru, turun dari puncak ukuran paket bulan Maret sebesar 43,3MB.

  </Card>
  <Card title="Instalasi stabil terbaru" icon="hard-drive">
    **Instalasi baru 361,7MiB**

    Memangkas tajam pohon dependensi OpenClaw bertingkat dari puncak pengenalan
    shrinkwrap `2026.5.22`, meskipun pohon bertingkat yang lebih kecil sebesar 259,7MiB masih
    tersisa dalam audit instalasi lokal.

  </Card>
  <Card title="Graf dependensi" icon="boxes">
    **300 paket terinstal**

    Diukur sebagai akar unik nama/versi paket dalam instalasi baru dengan
    skrip dinonaktifkan; 71 akar lebih sedikit daripada rilis stabil sebelumnya.

  </Card>
</CardGroup>

## Perubahan Dalam 5.28

Pembersihan antara `v2026.5.27` dan `v2026.5.28` mengurangi graf
instalasi bawaan alih-alih menghapus kemampuan itu sendiri.

<CardGroup cols={2}>
  <Card title="Graf bawaan akar" icon="git-branch">
    Akar unik nama/versi paket turun dari **371** menjadi **300**. Instans paket
    turun dari **372** menjadi **301**.
  </Card>
  <Card title="Pohon bertingkat" icon="unplug">
    `openclaw/node_modules` bertingkat turun dari **656,1MiB** menjadi **259,7MiB** dalam
    audit instalasi lokal yang sama.
  </Card>
  <Card title="Kerucut opsional native" icon="cpu">
    Kerucut paket native semua platform `@napi-rs/canvas` tidak lagi disertakan dalam
    instalasi bawaan.
  </Card>
  <Card title="Permukaan rantai pasok" icon="shield">
    Lebih sedikit paket bawaan berarti lebih sedikit tarball, pengelola, biner native,
    perilaku saat instalasi, dan jalur pembaruan transitif yang harus dipercaya secara bawaan.
  </Card>
</CardGroup>

<Tip>
Shrinkwrap sendiri bukan masalahnya. Bentuk paket yang buruklah masalahnya.
`v2026.5.28` masih menyertakan shrinkwrap, tetapi pohon dependensi bertingkat jauh
lebih kecil dan penyebaran canvas semua platform telah hilang dalam audit lokal.
</Tip>

## Angka Utama

Jangan gunakan baris rusak pada akhir April sebagai baseline kinerja publik.
`v2026.4.23` dan `v2026.4.29` berguna sebagai bukti regresi, tetapi delta besar
bergaya `14x` sebagian besar menggambarkan pemulihan dari lini rilis yang buruk.

Untuk narasi blog, gunakan baseline April sebelumnya yang dipublikasikan sebagai skala.
Baseline tersebut adalah `v2026.4.14` dari proses penyedia tiruan `clawgrit-reports`
yang dipublikasikan (pengulangan 3; proses tersebut gagal hanya karena linimasa diagnostik
tidak dihasilkan, sehingga median dingin, hangat, dan RSS masih berguna
sebagai skala kasar). Perlakukan ini sebagai konteks naratif, bukan statistik
gerbang rilis.

| Metrik           | Baseline April sebelumnya | `v2026.5.28` |                         Delta |
| ---------------- | -------------------------: | -----------: | ----------------------------: |
| Putaran agen dingin |                    9.819ms |      1.908ms | 80,6% lebih rendah, 5,1x lebih cepat |
| Putaran agen hangat |                    7.458ms |      1.870ms | 74,9% lebih rendah, 4,0x lebih cepat |
| RSS puncak agen     |                    686,2MB |      581,0MB |                  15,3% lebih rendah |

Dalam penyisiran bulan Mei, baris cabang rilis terbaru berubah secara signifikan dari
`v2026.5.2`:

| Metrik           | `v2026.5.2` | `v2026.5.28` |              Delta |
| ---------------- | ----------: | -----------: | -----------------: |
| Putaran agen dingin |     3.897ms |      1.908ms | 51,0% lebih rendah |
| Putaran agen hangat |     3.610ms |      1.870ms | 48,2% lebih rendah |
| RSS puncak agen     |     613,7MB |      581,0MB |  5,3% lebih rendah |

Dibandingkan dengan rilis stabil sebelumnya:

| Metrik           | `v2026.5.27` | `v2026.5.28` |              Delta |
| ---------------- | -----------: | -----------: | -----------------: |
| Putaran agen dingin |      2.231ms |      1.908ms | 14,5% lebih rendah |
| Putaran agen hangat |      2.226ms |      1.870ms | 16,0% lebih rendah |
| RSS puncak agen     |      649,0MB |      581,0MB | 10,5% lebih rendah |

### Jejak instalasi

| Metrik                                          |  Baseline | `v2026.5.28` |              Delta |
| ----------------------------------------------- | --------: | -----------: | -----------------: |
| Ukuran instalasi dari puncak `2026.5.22`        | 1.020,6MB |     361,7MiB | 64,6% lebih rendah |
| Ukuran instalasi dari rilis terbaru `2026.5.27` |  767,1MiB |     361,7MiB | 52,8% lebih rendah |
| Dependensi dari titik tertinggi bulanan `2026.2.26` |       645 |          300 | 53,5% lebih rendah |
| Dependensi dari rilis terbaru `2026.5.27`       |       371 |          300 | 19,1% lebih rendah |
| `openclaw/node_modules` bertingkat dari `2026.5.22` |   911,8MB |     259,7MiB | 71,5% lebih rendah |
| `openclaw/node_modules` bertingkat dari `2026.5.27` |  656,1MiB |     259,7MiB | 60,4% lebih rendah |

### Ukuran paket npm

| Versi       | Tarball terkompresi | Paket setelah diekstrak | Berkas | Catatan                               |
| ----------- | ------------------: | ----------------------: | -----: | ------------------------------------- |
| `2026.1.30` |              12,8MB |                  33,5MB |  4.607 | paket awal setelah penggantian merek  |
| `2026.2.26` |              23,6MB |                  82,9MB | 10.125 | pertumbuhan fitur                     |
| `2026.3.31` |              43,3MB |                 182,6MB | 21.037 | titik tertinggi ukuran paket          |
| `2026.4.29` |              22,9MB |                  74,6MB |  9.309 | pemangkasan paket terlihat            |
| `2026.5.12` |              23,4MB |                  80,1MB | 12.035 | pemisahan besar Plugin eksternal      |
| `2026.5.22` |              17,2MB |                  76,9MB | 12.386 | dokumentasi/aset dikecualikan dari paket |
| `2026.5.27` |              17,8MB |                  79,0MB | 12.509 | paket stabil sebelumnya               |
| `2026.5.28` |              17,9MB |                  81,0MB |  9.082 | paket stabil terbaru                  |

`2026.5.12` adalah tonggak ekstraksi Plugin yang terlihat dalam catatan perubahan:
Amazon Bedrock, Bedrock Mantle, Slack, sandbox OpenShell, Anthropic Vertex,
Matrix, dan WhatsApp dipindahkan keluar dari jalur dependensi inti sehingga kerucut dependensinya
diinstal bersama Plugin tersebut, bukan pada setiap instalasi inti.

## Ringkasan putaran agen Kova

Lini stabil April memuat dua cerita berbeda. Awal April lambat
tetapi masih dapat dikenali. Akhir April berubah menjadi jurang regresi. `v2026.5.2` adalah titik
ketika jalur penyedia tiruan pertama kali turun ke kisaran 3-5 dtk dan mulai lulus
secara konsisten dalam penyisiran yang disediakan.

Konteks yang dipublikasikan sebelumnya:

| Rilis        | Kova  | Putaran dingin | Putaran hangat | RSS puncak agen |
| ------------ | ----- | -------------: | --------------: | ---------------: |
| `v2026.4.10` | GAGAL |       11.031ms |         7.962ms |          679,0MB |
| `v2026.4.12` | GAGAL |       11.965ms |         8.289ms |          713,5MB |
| `v2026.4.14` | GAGAL |        9.819ms |         7.458ms |          686,2MB |
| `v2026.4.20` | GAGAL |       22.314ms |        18.811ms |          810,8MB |
| `v2026.4.22` | GAGAL |        9.630ms |         7.459ms |          743,0MB |

Penyisiran yang disediakan:

| Rilis               | Kova  | Putaran dingin | Putaran hangat | RSS puncak agen |
| ------------------- | ----- | -------------: | --------------: | ---------------: |
| `v2026.4.23`        | GAGAL |       47.847ms |         8.010ms |        1.082,7MB |
| `v2026.4.24`        | GAGAL |       48.264ms |        25.483ms |          996,0MB |
| `v2026.4.25`        | GAGAL |       81.080ms |        59.172ms |        1.113,9MB |
| `v2026.4.26`        | GAGAL |       76.771ms |        54.941ms |        1.140,8MB |
| `v2026.4.27`        | GAGAL |       60.902ms |        33.699ms |        1.156,0MB |
| `v2026.4.29`        | GAGAL |       94.031ms |        57.334ms |        3.613,7MB |
| `v2026.5.2`         | LULUS |        3.897ms |         3.610ms |          613,7MB |
| `v2026.5.7`         | LULUS |        3.923ms |         3.693ms |          654,1MB |
| `v2026.5.12`        | LULUS |        7.248ms |         6.629ms |          834,8MB |
| `v2026.5.18`        | LULUS |        3.301ms |         2.913ms |          630,3MB |
| `v2026.5.20`        | LULUS |        3.413ms |         2.952ms |          643,2MB |
| `v2026.5.22`        | LULUS |        4.494ms |         4.093ms |          654,3MB |
| `v2026.5.26`        | LULUS |        2.626ms |         2.282ms |          660,4MB |
| `v2026.5.27-beta.1` | LULUS |        2.575ms |         2.217ms |          635,3MB |
| `v2026.5.27`        | LULUS |        2.231ms |         2.226ms |          649,0MB |
| `v2026.5.28`        | LULUS |        1.908ms |         1.870ms |          581,0MB |

## Probe sumber

Probe sumber dilewati untuk 17 referensi lama yang berhasil karena pohon sumber
tersebut belum memiliki titik masuk probe yang diperlukan. Metrik putaran agen tetap
tersedia untuk referensi tersebut.

Titik probe sumber yang representatif:

| Rilis               | p50 `readyz` bawaan | p50 `readyz` 50 Plugin | p50 kesehatan CLI | RSS maks Plugin |
| ------------------- | -------------------: | ----------------------: | -----------------: | --------------: |
| `v2026.4.29`        |              2.819ms |                 2.618ms |            1.679ms |         389,0MB |
| `v2026.5.2`         |              2.324ms |                 2.013ms |            1.384ms |         377,2MB |
| `v2026.5.7`         |              1.649ms |                 1.540ms |            1.175ms |         387,6MB |
| `v2026.5.18`        |              1.942ms |                 1.927ms |              607ms |         426,5MB |
| `v2026.5.20`        |              1.966ms |                 1.987ms |              621ms |         455,0MB |
| `v2026.5.22`        |              2.081ms |                 1.884ms |            5.095ms |         444,2MB |
| `v2026.5.26`        |              1.546ms |                 1.634ms |              656ms |         400,4MB |
| `v2026.5.27-beta.1` |              1.462ms |                 1.548ms |              548ms |         394,0MB |
| `v2026.5.27`        |              1.491ms |                 1.571ms |              553ms |         401,5MB |
| `v2026.5.28`        |              1.457ms |                 1.474ms |              623ms |         386,1MB |

Lonjakan kesehatan CLI `v2026.5.22` terlihat dalam tabel ini meskipun
jalur putaran agen tetap lulus. Pertahankan probe sumber saat menyelidiki
regresi CLI atau Gateway yang ditargetkan.

## Audit jejak instalasi

Sampel dependensi menggunakan satu rilis stabil per bulan, ditambah peristiwa
pengenalan shrinkwrap `2026.5.22` dan rilis terbaru `2026.5.28`.

| Titik              | Dependensi terinstal | Instalasi baru | Paket OpenClaw | `openclaw/node_modules` bertingkat | Shrinkwrap root | Perilaku instalasi Canvas                         |
| ------------------ | --------------------: | --------------: | -------------: | ---------------------------------: | --------------- | ------------------------------------------------- |
| Jan `2026.1.30`    |                   605 |         438.4MB |         45.8MB |                              2.4MB | tidak           | pembungkus tingkat atas + `darwin-arm64`          |
| Feb `2026.2.26`    |                   645 |         575.7MB |        110.1MB |                              3.5MB | tidak           | pembungkus tingkat atas + `darwin-arm64`          |
| Mar `2026.3.31`    |                   438 |         584.1MB |        234.8MB |                                0MB | tidak           | pembungkus tingkat atas + `darwin-arm64`          |
| Apr `2026.4.29`    |                   392 |         335.0MB |         97.4MB |                                0MB | tidak           | tidak ada yang terinstal                          |
| `2026.5.22`        |                   401 |       1,020.6MB |      1,020.4MB |                            911.8MB | ya              | bertingkat: semua 12 paket `@napi-rs/canvas`      |
| Mei `2026.5.26`    |                   371 |         767.5MB |        767.4MB |                            656.4MB | ya              | bertingkat: semua 12 paket `@napi-rs/canvas`      |
| `2026.5.27`        |                   371 |        767.1MiB |       766.9MiB |                           656.1MiB | ya              | bertingkat: semua 12 paket `@napi-rs/canvas`      |
| Terbaru `2026.5.28` |                  300 |        361.7MiB |       361.6MiB |                           259.7MiB | ya              | tidak ada yang terinstal                          |

### Batas shrinkwrap

`2026.5.20` dirilis tanpa shrinkwrap root dan tanpa pohon dependensi OpenClaw
bertingkat yang besar. `2026.5.22` memperkenalkan shrinkwrap root dan menginstal
911.8MB di bawah `openclaw/node_modules` bertingkat. `2026.5.28` mempertahankan
shrinkwrap dan masih menginstal 259.7MiB di bawah `openclaw/node_modules`
bertingkat, tetapi tidak lagi menginstal paket `@napi-rs/canvas` apa pun dalam
audit instalasi baru lokal.

Pemeriksaan tarball yang dipublikasikan memverifikasi batas tersebut:

| Versi       | Stabil dipublikasikan? | `npm-shrinkwrap.json` root | Catatan                                      |
| ----------- | ---------------------- | -------------------------- | -------------------------------------------- |
| `2026.5.20` | ya                     | tidak                      | rilis stabil terakhir sebelum shrinkwrap     |
| `2026.5.21` | tidak                  | tidak berlaku              | tidak ada rilis npm stabil                    |
| `2026.5.22` | ya                     | ya                         | shrinkwrap diperkenalkan                      |
| `2026.5.23` | tidak                  | tidak berlaku              | tidak ada rilis npm stabil                    |
| `2026.5.24` | tidak                  | tidak berlaku              | tidak ada rilis npm stabil                    |
| `2026.5.25` | tidak                  | tidak berlaku              | tidak ada rilis npm stabil                    |
| `2026.5.26` | ya                     | ya                         | pohon dependensi bertingkat masih ada         |
| `2026.5.27` | ya                     | ya                         | pohon dependensi bertingkat masih ada         |
| `2026.5.28` | ya                     | ya                         | pohon dependensi bertingkat jauh lebih kecil  |

Perbedaan pentingnya: **shrinkwrap itu sendiri bukan masalahnya**.
`v2026.5.28` masih menyertakan shrinkwrap root. Masalahnya adalah bentuk paket
yang menyebabkan npm mewujudkan pohon dependensi OpenClaw bertingkat yang besar
dan semua 12 paket platform `@napi-rs/canvas`. Pohon bertingkat lebih kecil di
`v2026.5.28`, dan penyebaran platform canvas tidak lagi muncul dalam audit lokal.

Untuk penjelasan sederhana mengenai shrinkwrap dan pemeriksaan paket tingkat
pengelola, lihat [shrinkwrap npm](/id/gateway/security/shrinkwrap).

## Interpretasi rantai pasok

Jumlah dependensi merupakan metrik keamanan operasional, bukan hanya metrik
ukuran instalasi. Setiap paket memperluas kumpulan pengelola, tarball, pembaruan
transitif, biner native opsional, dan perilaku saat instalasi yang harus
dipercayai oleh operator.

Arah pembersihannya adalah:

- mempertahankan kemampuan berat dan opsional di luar instalasi inti bawaan
- memastikan paket Plugin memiliki grafik dependensi runtime-nya sendiri
- menghindari perbaikan pengelola paket saat runtime selama proses mulai Gateway
- mempertahankan instalasi deterministik tanpa menyebabkan perwujudan paket
  native untuk semua platform
- mempertahankan skrip instalasi dalam keadaan dinonaktifkan pada jalur
  penerimaan dan pengukuran paket
- mendeteksi pohon dependensi bertingkat dan ledakan dependensi native opsional
  sebelum publikasi

Dokumentasi terkait:

- [Resolusi dependensi Plugin](/id/plugins/dependency-resolution)
- [Inventaris Plugin](/id/plugins/plugin-inventory)
- [Validasi rilis lengkap](/id/reference/full-release-validation)
