---
read_when:
    - Anda sedang memvalidasi pembersihan performa dan ukuran paket Mei 2026
    - Anda memerlukan angka-angka yang mendasari artikel blog performa dan dependensi OpenClaw
    - Anda sedang mengubah gerbang rilis, shrinkwrap paket, atau batas dependensi plugin
summary: Ringkasan visual dan bukti teknis untuk pembersihan performa, ukuran paket, dependensi, dan shrinkwrap Mei 2026
title: Penyisiran kinerja rilis
x-i18n:
    generated_at: "2026-06-27T18:11:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 93438b8037a40ed9e5590854926badfe943d440e4c585e6290d29b54764e861b
    source_path: reference/release-performance-sweep.md
    workflow: 16
---

Halaman ini mencatat bukti di balik pembersihan performa, ukuran paket,
dependensi, dan shrinkwrap OpenClaw pada Mei 2026. Ini adalah pendamping teknis
untuk posting blog publik.

Dua audit digabungkan di sini:

- **Penyisiran performa rilis:** GitHub Releases dari `v2026.5.28` mundur hingga
  stable `v2026.4.23`, menggunakan workflow `OpenClaw Performance`,
  `profile=smoke`, jalur mock-provider. Sebagian besar baris tag adalah satu sampel; baris
  `v2026.5.27` dan `v2026.5.28` menggunakan artefak release-branch repeat-3
  terbaru.
- **Konteks April sebelumnya:** baseline mock-provider `clawgrit-reports` yang
  dipublikasikan dari `v2026.4.1` hingga `v2026.5.2`, digunakan hanya untuk menghindari
  memperlakukan rilis akhir April yang rusak sebagai baseline performa publik.
- **Penyisiran jejak instalasi:** instalasi `npm install --ignore-scripts` baru
  ke paket sementara, dengan `du -sk node_modules` untuk ukuran dan penelusuran
  `node_modules` untuk jumlah instance paket.
- **Penyisiran ukuran paket npm:** `npm pack openclaw@<version> --dry-run --json`
  untuk rilis yang dipublikasikan, mencatat ukuran tarball terkompresi, ukuran
  setelah diekstrak, dan jumlah file.

<Warning>
Penyisiran performa utama menggunakan satu sampel smoke per tag, kecuali baris
`v2026.5.27` dan `v2026.5.28`, yang menggunakan artefak release-branch repeat-3
terbaru. Konteks April sebelumnya menggunakan median repeat-3 yang dipublikasikan
dari `clawgrit-reports`. Perlakukan angka-angka ini sebagai bukti tren dan sinyal
pencarian regresi, bukan sebagai statistik gerbang rilis.
</Warning>

## Cuplikan

Cakupan performa: **77 rilis yang diminta**, **74 titik berbasis artefak**,
dan **3 run CI yang tidak tersedia**. Titik stable terbaru yang diukur: `v2026.5.28`.

<CardGroup cols={2}>
  <Card title="Stable agent turn" icon="gauge">
    **Turn cold 5,1x lebih cepat**

    - `v2026.4.14`: 9,8 dtk
    - `v2026.5.28`: 1,9 dtk

  </Card>
  <Card title="Published package" icon="package">
    **Tarball 17,9MB**

    Paket stable terbaru, turun dari puncak ukuran paket Maret sebesar 43,3MB.

  </Card>
  <Card title="Latest stable install" icon="hard-drive">
    **Instalasi baru 361,7MiB**

    `v2026.5.28` memangkas pohon dependensi OpenClaw bertingkat secara tajam, tetapi
    pohon bertingkat yang lebih kecil sebesar 259,7MiB masih tersisa dalam audit
    instalasi lokal.

  </Card>
  <Card title="Dependency graph" icon="boxes">
    **300 paket terinstal**

    Rilis stable terbaru, diukur sebagai root nama/versi paket unik dalam
    instalasi baru dengan skrip dinonaktifkan.

  </Card>
</CardGroup>

## Linimasa Jejak Instalasi

<CardGroup cols={2}>
  <Card title="Monthly high" icon="triangle-alert">
    **645 dependensi**

    `2026.2.26` adalah titik tertinggi jumlah dependensi bulanan dalam sampel ini.

  </Card>
  <Card title="Shrinkwrap introduced" icon="lock">
    **Instalasi 1.020,6MB**

    `2026.5.22` menambahkan shrinkwrap root dan mengekspos masalah bentuk paket:
    911,8MB masuk ke bawah `openclaw/node_modules` bertingkat.

  </Card>
  <Card title="Latest stable" icon="tag">
    **Instalasi 361,7MiB**

    `2026.5.28` memangkas ukuran instalasi baru sebesar 52,8% dari `2026.5.27`, tetapi masih
    menginstal pohon OpenClaw bertingkat sebesar 259,7MiB.

  </Card>
  <Card title="Dependency graph" icon="scissors">
    **300 root paket**

    `2026.5.28` menginstal 71 root nama/versi paket unik lebih sedikit daripada
    `2026.5.27`.

  </Card>
</CardGroup>

<Tip>
Shrinkwrap bukan masalahnya sendiri. Bentuk paket yang buruklah masalahnya.
`v2026.5.28` masih mengirimkan shrinkwrap, tetapi pohon dependensi bertingkat jauh
lebih kecil dan fanout canvas semua-platform hilang dalam audit lokal.
</Tip>

## Yang Berubah Di 5.28

Pembersihan antara `v2026.5.27` dan `v2026.5.28` mengurangi grafik instalasi default
alih-alih menghapus kemampuan itu sendiri.

<CardGroup cols={2}>
  <Card title="Root default graph" icon="git-branch">
    Root nama/versi paket unik turun dari **371** menjadi **300**. Instans
    paket turun dari **372** menjadi **301**.
  </Card>
  <Card title="Nested tree" icon="unplug">
    `openclaw/node_modules` bertingkat turun dari **656.1MiB** menjadi **259.7MiB** dalam
    audit instalasi lokal yang sama.
  </Card>
  <Card title="Native optional cones" icon="cpu">
    Cone paket native `@napi-rs/canvas` untuk semua platform tidak lagi masuk
    ke instalasi default.
  </Card>
  <Card title="Supply-chain surface" icon="shield">
    Paket default yang lebih sedikit berarti lebih sedikit tarball, maintainer, binary native,
    perilaku saat instalasi, dan jalur pembaruan transitif yang perlu dipercaya secara default.
  </Card>
</CardGroup>

## Angka Utama

Jangan gunakan baris rusak akhir April sebagai baseline performa publik.
`v2026.4.23` dan `v2026.4.29` berguna sebagai bukti regresi, tetapi delta besar
bergaya `14x` terutama menggambarkan pemulihan dari lini rilis yang buruk.

Untuk narasi blog, gunakan baseline terbitan awal April sebagai skala:

| Metrik          | Baseline awal April | `v2026.5.28` |                    Delta |
| --------------- | ------------------: | -----------: | -----------------------: |
| Giliran agen dingin |             9,819ms |      1,908ms | 80.6% lebih rendah, 5.1x lebih cepat |
| Giliran agen hangat |             7,458ms |      1,870ms | 74.9% lebih rendah, 4.0x lebih cepat |
| RSS puncak agen  |                686.2MB |      581.0MB |              15.3% lebih rendah |

Baseline awal April adalah `v2026.4.14` dari run mock-provider
`clawgrit-reports` yang diterbitkan. Run itu menggunakan repeat 3 dan gagal hanya
karena timeline diagnostik tidak dipancarkan; median dingin, hangat, dan RSS
masih berguna sebagai skala kasar. Perlakukan ini sebagai konteks naratif, bukan
statistik release-gate.

Dalam sweep Mei, baris cabang rilis terbaru bergerak secara material dari
`v2026.5.2`:

| Metrik          | `v2026.5.2` | `v2026.5.28` |       Delta |
| --------------- | ----------: | -----------: | ----------: |
| Giliran agen dingin |     3,897ms |      1,908ms | 51.0% lebih rendah |
| Giliran agen hangat |     3,610ms |      1,870ms | 48.2% lebih rendah |
| RSS puncak agen  |     613.7MB |      581.0MB |  5.3% lebih rendah |

Dibandingkan dengan rilis stabil sebelumnya:

| Metrik          | `v2026.5.27` | `v2026.5.28` |       Delta |
| --------------- | -----------: | -----------: | ----------: |
| Giliran agen dingin |      2,231ms |      1,908ms | 14.5% lebih rendah |
| Giliran agen hangat |      2,226ms |      1,870ms | 16.0% lebih rendah |
| RSS puncak agen  |      649.0MB |      581.0MB | 10.5% lebih rendah |

### Jejak instalasi

| Metrik                                          |  Baseline | `v2026.5.28` |       Delta |
| ----------------------------------------------- | --------: | -----------: | ----------: |
| Ukuran instalasi dari puncak `2026.5.22`              | 1,020.6MB |     361.7MiB | 64.6% lebih rendah |
| Ukuran instalasi dari rilis terbaru `2026.5.27`    |  767.1MiB |     361.7MiB | 52.8% lebih rendah |
| Dependensi dari titik tertinggi bulanan `2026.2.26`      |       645 |          300 | 53.5% lebih rendah |
| Dependensi dari rilis terbaru `2026.5.27`    |       371 |          300 | 19.1% lebih rendah |
| `openclaw/node_modules` bertingkat dari `2026.5.22` |   911.8MB |     259.7MiB | 71.5% lebih rendah |
| `openclaw/node_modules` bertingkat dari `2026.5.27` |  656.1MiB |     259.7MiB | 60.4% lebih rendah |

### Ukuran paket npm

| Versi     | Tarball terkompresi | Paket yang dibongkar |  Berkas | Catatan                             |
| ----------- | -----------------: | ---------------: | -----: | --------------------------------- |
| `2026.1.30` |             12.8MB |           33.5MB |  4,607 | paket rebrand awal           |
| `2026.2.26` |             23.6MB |           82.9MB | 10,125 | pertumbuhan fitur                    |
| `2026.3.31` |             43.3MB |          182.6MB | 21,037 | titik tertinggi ukuran paket           |
| `2026.4.29` |             22.9MB |           74.6MB |  9,309 | pemangkasan paket terlihat           |
| `2026.5.12` |             23.4MB |           80.1MB | 12,035 | pemisahan besar Plugin eksternal       |
| `2026.5.22` |             17.2MB |           76.9MB | 12,386 | docs/aset dikecualikan dari paket |
| `2026.5.27` |             17.8MB |           79.0MB | 12,509 | paket stabil sebelumnya           |
| `2026.5.28` |             17.9MB |           81.0MB |  9,082 | paket stabil terbaru             |

`2026.5.12` adalah tonggak ekstraksi Plugin yang terlihat dalam changelog:
Amazon Bedrock, Bedrock Mantle, Slack, sandbox OpenShell, Anthropic Vertex,
Matrix, dan WhatsApp dipindahkan keluar dari jalur dependensi inti sehingga cone
dependensinya terinstal bersama Plugin tersebut, bukan di setiap instalasi inti.

## Ringkasan giliran agen Kova

Lini stabil April berisi dua cerita berbeda. Awal April lambat tetapi masih
dapat dikenali. Akhir April menjadi jurang regresi. `v2026.5.2` adalah titik
ketika lane mock-provider pertama kali turun ke rentang 3-5d dan mulai lulus
secara konsisten dalam sweep yang disediakan.

Konteks terbitan sebelumnya:

| Rilis      | Kova | Giliran dingin | Giliran hangat | RSS puncak agen |
| ------------ | ---- | --------: | --------: | -------------: |
| `v2026.4.10` | FAIL |  11,031ms |   7,962ms |        679.0MB |
| `v2026.4.12` | FAIL |  11,965ms |   8,289ms |        713.5MB |
| `v2026.4.14` | FAIL |   9,819ms |   7,458ms |        686.2MB |
| `v2026.4.20` | FAIL |  22,314ms |  18,811ms |        810.8MB |
| `v2026.4.22` | FAIL |   9,630ms |   7,459ms |        743.0MB |

Sweep yang disediakan:

| Rilis             | Kova | Giliran dingin | Giliran hangat | RSS puncak agen |
| ------------------- | ---- | --------: | --------: | -------------: |
| `v2026.4.23`        | FAIL |  47,847ms |   8,010ms |      1,082.7MB |
| `v2026.4.24`        | FAIL |  48,264ms |  25,483ms |        996.0MB |
| `v2026.4.25`        | FAIL |  81,080ms |  59,172ms |      1,113.9MB |
| `v2026.4.26`        | FAIL |  76,771ms |  54,941ms |      1,140.8MB |
| `v2026.4.27`        | FAIL |  60,902ms |  33,699ms |      1,156.0MB |
| `v2026.4.29`        | FAIL |  94,031ms |  57,334ms |      3,613.7MB |
| `v2026.5.2`         | PASS |   3,897ms |   3,610ms |        613.7MB |
| `v2026.5.7`         | PASS |   3,923ms |   3,693ms |        654.1MB |
| `v2026.5.12`        | PASS |   7,248ms |   6,629ms |        834.8MB |
| `v2026.5.18`        | PASS |   3,301ms |   2,913ms |        630.3MB |
| `v2026.5.20`        | PASS |   3,413ms |   2,952ms |        643.2MB |
| `v2026.5.22`        | PASS |   4,494ms |   4,093ms |        654.3MB |
| `v2026.5.26`        | PASS |   2,626ms |   2,282ms |        660.4MB |
| `v2026.5.27-beta.1` | PASS |   2,575ms |   2,217ms |        635.3MB |
| `v2026.5.27`        | PASS |   2,231ms |   2,226ms |        649.0MB |
| `v2026.5.28`        | PASS |   1,908ms |   1,870ms |        581.0MB |

## Probe sumber

Probe sumber dilewati untuk 17 ref lama yang berhasil karena tree sumber
tersebut belum memiliki titik masuk probe yang diperlukan. Metrik giliran agen tetap
ada untuk ref tersebut.

Titik probe sumber yang representatif:

| Rilis             | `readyz` p50 default | `readyz` p50 50 Plugin | CLI health p50 | RSS maks Plugin |
| ------------------- | -------------------: | ----------------------: | -------------: | -------------: |
| `v2026.4.29`        |              2,819ms |                 2,618ms |        1,679ms |        389.0MB |
| `v2026.5.2`         |              2,324ms |                 2,013ms |        1,384ms |        377.2MB |
| `v2026.5.7`         |              1,649ms |                 1,540ms |        1,175ms |        387.6MB |
| `v2026.5.18`        |              1,942ms |                 1,927ms |          607ms |        426.5MB |
| `v2026.5.20`        |              1,966ms |                 1,987ms |          621ms |        455.0MB |
| `v2026.5.22`        |              2,081ms |                 1,884ms |        5,095ms |        444.2MB |
| `v2026.5.26`        |              1,546ms |                 1,634ms |          656ms |        400.4MB |
| `v2026.5.27-beta.1` |              1,462ms |                 1,548ms |          548ms |        394.0MB |
| `v2026.5.27`        |              1,491ms |                 1,571ms |          553ms |        401.5MB |
| `v2026.5.28`        |              1,457ms |                 1,474ms |          623ms |        386.1MB |

Lonjakan kesehatan CLI `v2026.5.22` terlihat di tabel ini meskipun lane
agent-turn tetap lulus. Pertahankan probe sumber saat menyelidiki regresi CLI
atau gateway yang ditargetkan.

## Audit jejak instalasi

Sampel dependensi menggunakan satu rilis stabil per bulan, ditambah peristiwa
pengenalan shrinkwrap `2026.5.22` dan rilis terbaru `2026.5.28`.

| Titik              | Dependensi terinstal | Instalasi baru | Paket OpenClaw | `openclaw/node_modules` bersarang | Shrinkwrap root | Perilaku instalasi Canvas                  |
| ------------------ | -------------------: | -------------: | -------------: | --------------------------------: | --------------- | ------------------------------------------ |
| Jan `2026.1.30`    |                  605 |        438.4MB |         45.8MB |                             2.4MB | tidak           | wrapper tingkat atas + `darwin-arm64`      |
| Feb `2026.2.26`    |                  645 |        575.7MB |        110.1MB |                             3.5MB | tidak           | wrapper tingkat atas + `darwin-arm64`      |
| Mar `2026.3.31`    |                  438 |        584.1MB |        234.8MB |                               0MB | tidak           | wrapper tingkat atas + `darwin-arm64`      |
| Apr `2026.4.29`    |                  392 |        335.0MB |         97.4MB |                               0MB | tidak           | tidak ada yang terinstal                   |
| `2026.5.22`        |                  401 |      1,020.6MB |      1,020.4MB |                           911.8MB | ya              | bersarang: semua 12 paket `@napi-rs/canvas` |
| May `2026.5.26`    |                  371 |        767.5MB |        767.4MB |                           656.4MB | ya              | bersarang: semua 12 paket `@napi-rs/canvas` |
| `2026.5.27`        |                  371 |       767.1MiB |       766.9MiB |                          656.1MiB | ya              | bersarang: semua 12 paket `@napi-rs/canvas` |
| Terbaru `2026.5.28` |                 300 |       361.7MiB |       361.6MiB |                          259.7MiB | ya              | tidak ada yang terinstal                   |

### Batas shrinkwrap

<CardGroup cols={2}>
  <Card title="Before shrinkwrap" icon="unlock">
    `2026.5.20` tidak memiliki shrinkwrap root dan tidak memiliki pohon
    dependensi OpenClaw bersarang yang besar.
  </Card>
  <Card title="Introduced" icon="lock">
    `2026.5.22` menambahkan shrinkwrap root dan menginstal 911.8MB di bawah
    `openclaw/node_modules` bersarang.
  </Card>
  <Card title="Latest stable" icon="tag">
    `2026.5.28` mempertahankan shrinkwrap dan masih menginstal 259.7MiB di bawah
    `openclaw/node_modules` bersarang.
  </Card>
  <Card title="Canvas fanout fixed" icon="check">
    `2026.5.28` tidak lagi menginstal paket `@napi-rs/canvas` apa pun dalam
    audit instalasi baru lokal.
  </Card>
</CardGroup>

Inspeksi tarball yang dipublikasikan memverifikasi batas tersebut:

| Versi       | Stabil dipublikasikan? | `npm-shrinkwrap.json` root | Catatan                                      |
| ----------- | ---------------------- | -------------------------- | -------------------------------------------- |
| `2026.5.20` | ya                     | tidak                      | rilis stabil terakhir sebelum shrinkwrap     |
| `2026.5.21` | tidak                  | t/a                        | tidak ada rilis npm stabil                   |
| `2026.5.22` | ya                     | ya                         | shrinkwrap diperkenalkan                     |
| `2026.5.23` | tidak                  | t/a                        | tidak ada rilis npm stabil                   |
| `2026.5.24` | tidak                  | t/a                        | tidak ada rilis npm stabil                   |
| `2026.5.25` | tidak                  | t/a                        | tidak ada rilis npm stabil                   |
| `2026.5.26` | ya                     | ya                         | pohon dependensi bersarang masih ada         |
| `2026.5.27` | ya                     | ya                         | pohon dependensi bersarang masih ada         |
| `2026.5.28` | ya                     | ya                         | pohon dependensi bersarang jauh lebih kecil  |

Perbedaan pentingnya: **shrinkwrap itu sendiri bukan masalahnya**.
`v2026.5.28` masih mengirimkan shrinkwrap root. Masalahnya adalah bentuk paket
yang membuat npm mewujudkan pohon dependensi OpenClaw bersarang yang besar dan
semua 12 paket platform `@napi-rs/canvas`. Pohon bersarang lebih kecil di
`v2026.5.28`, dan fanout platform canvas tidak lagi muncul dalam audit lokal.

Untuk penjelasan sederhana tentang shrinkwrap dan pemeriksaan paket tingkat
maintainer, lihat [npm shrinkwrap](/id/gateway/security/shrinkwrap).

## Interpretasi rantai pasok

Jumlah dependensi adalah metrik keamanan operasional, bukan hanya metrik ukuran
instalasi. Setiap paket memperluas kumpulan maintainer, tarball, pembaruan
transitif, biner native opsional, dan perilaku waktu instalasi yang harus
dipercayai operator.

Arah pembersihannya adalah:

- menjaga kapabilitas berat dan opsional tetap di luar instalasi core default
- membuat paket Plugin memiliki grafik dependensi runtime-nya sendiri
- menghindari perbaikan package manager runtime saat startup Gateway
- mempertahankan instalasi deterministik tanpa menyebabkan materialisasi paket
  native semua platform
- menjaga skrip instalasi tetap dinonaktifkan di jalur penerimaan dan pengukuran paket
- menangkap pohon dependensi bersarang dan ledakan dependensi opsional native sebelum
  publikasi

Dokumentasi terkait:

- [Resolusi dependensi Plugin](/id/plugins/dependency-resolution)
- [Inventaris Plugin](/id/plugins/plugin-inventory)
- [Validasi rilis penuh](/id/reference/full-release-validation)
