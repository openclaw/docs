---
read_when:
    - Anda menginginkan linimasa harian bergaya Dayflow di UI Kontrol
    - Anda sedang mengaktifkan atau mengonfigurasi plugin Logbook bawaan
    - Anda menginginkan ringkasan rapat harian atau kilas balik aktivitas sehari yang didasarkan pada aktivitas layar
summary: Jurnal kerja otomatis opsional yang dibuat dari cuplikan layar berkala
title: Plugin buku log
x-i18n:
    generated_at: "2026-07-12T14:25:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a3ea1d40d62041417d047fbaf6b02aeb86e76314b8f620f7b9939e2e0c3b9f7e
    source_path: plugins/logbook.md
    workflow: 16
---

Plugin Logbook mengubah aktivitas layar menjadi jurnal kerja otomatis. Plugin ini
mengambil cuplikan layar berkala dari node yang dipasangkan, merangkumnya menjadi
pengamatan berstempel waktu, dan membuat kartu linimasa di
[UI Kontrol](/id/web/control-ui). Plugin ini juga dapat menghasilkan catatan rapat harian
dan menjawab pertanyaan tentang hari yang dilacak.

Status yang dimiliki OpenClaw tetap berada di Gateway dalam `<state-dir>/logbook/`,
tetapi pemrosesan model tidak selalu dilakukan secara lokal. Tangkapan layar yang
dijadikan sampel dikirim ke rute visi yang dikonfigurasi; pengamatan dan teks linimasa
dikirim ke model agen default. Gunakan rute model lokal untuk kedua tahap jika konten
layar dan teks aktivitas turunannya harus tetap berada di mesin.

Logbook disertakan dan dinonaktifkan secara default. Mengaktifkan plugin berarti
mengizinkan Gateway melakukan perekaman layar karena `captureEnabled` secara default
bernilai `true`.

## Sebelum memulai

Anda memerlukan:

- Node terhubung yang menyediakan `screen.snapshot` atau `logbook.snapshot`. Node
  aplikasi macOS memerlukan izin Screen Recording. Host node macOS tanpa antarmuka
  (`openclaw node host run`) memperoleh perintah `logbook.snapshot` yang disediakan
  plugin dan didukung oleh alat sistem `screencapture`.
- Plugin Codex bawaan yang diaktifkan dan diautentikasi. Saat ini Codex menyediakan
  kontrak ekstraksi gambar terstruktur yang diperlukan Logbook. Masuk dengan
  `openclaw models auth login --provider openai`; lihat
  [harness Codex](/id/plugins/codex-harness) untuk jalur autentikasi lainnya.
- Model agen default yang berfungsi. Logbook menggunakannya untuk menyintesis kartu,
  catatan rapat harian, serta tanya jawab harian setelah tahap visi.

## Mulai cepat

Aktifkan Plugin Codex dan Logbook:

```bash
openclaw plugins enable codex
openclaw plugins enable logbook
```

Konfigurasikan model visi secara eksplisit agar proses mulai berjalan secara deterministik:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
      logbook: {
        enabled: true,
        config: {
          visionModel: "codex/gpt-5.6-sol",
        },
      },
    },
  },
}
```

Jika Anda menggunakan `plugins.allow`, sertakan `codex` dan `logbook`. Mulai ulang
Gateway setelah mengubah konfigurasi plugin, lalu periksa pendaftaran dan buka dasbor:

```bash
openclaw gateway restart
openclaw plugins inspect logbook --runtime --json
openclaw nodes status --connected
openclaw nodes describe --node <idOrNameOrIp>
openclaw dashboard
```

Deskripsi node harus menyertakan `screen.snapshot` atau `logbook.snapshot`.
Node tanpa antarmuka hanya mengumumkan `logbook.snapshot` setelah plugin aktif.
Lihat [Pemecahan masalah Node](/id/nodes/troubleshooting) jika perintah tersebut tidak ada.

Tab Logbook hanya muncul untuk plugin yang diaktifkan dan sesi UI Kontrol
`operator.write`. Baris status seharusnya menampilkan **Merekam** tanpa kesalahan.
Kartu linimasa muncul saat jendela analisis ditutup, atau Anda dapat memilih
**Analisis sekarang** setelah aktivitas direkam.

## Cara kerjanya

1. **Rekam**: setiap `captureIntervalSeconds` (default 30 detik), Logbook menjalankan
   perintah perekaman node yang dipilih dan menyimpan bingkai JPEG yang diskalakan.
   Bingkai identik yang berurutan ditandai sebagai tidak aktif dan tidak disertakan
   dalam analisis.
2. **Amati**: setelah jendela analisis (default 15 menit) berlalu, plugin mengambil
   sampel hingga 16 bingkai aktif dan mengirimkannya ke model visi, yang mengembalikan
   pengamatan aktivitas berstempel waktu ("VS Code: mengedit
   store.ts, memperbaiki kesalahan tipe"). Jeda perekaman yang lebih lama dari dua
   menit atau tengah malam setempat juga menutup jendela saat ini.
3. **Sintesis**: pengamatan beserta kartu yang sudah ada dari 45 menit terakhir
   direvisi menjadi kartu linimasa (masing-masing 10–60 menit) dengan judul, ringkasan,
   kategori, aplikasi utama, dan gangguan singkat jika ada.
4. **Pangkas**: bingkai yang lebih lama dari `retentionDays` (default 14) dihapus.
   Kartu, pengamatan, dan catatan rapat harian yang disimpan dalam cache tetap dipertahankan.

Batas hari dan jam linimasa menggunakan zona waktu lokal Gateway, bukan zona waktu
peramban. Bingkai dan basis data linimasa SQLite berada dalam
`<state-dir>/logbook/`.

## Alur model dan data

Logbook menggunakan dua rute model terpisah:

| Tahap                   | Data yang dikirim                                          | Rute model                                                         |
| ----------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------ |
| Amati                   | Hingga 16 bingkai JPEG sampel beserta waktu perekamannya   | `visionModel`, atau entri Codex `tools.media` kompatibel yang dipinjam |
| Sintesis kartu          | Pengamatan berstempel waktu dan kartu linimasa terbaru     | Model agen default melalui runtime LLM plugin                      |
| Buat catatan rapat      | Kartu untuk hari yang dipilih dan hari sebelumnya          | Model agen default melalui runtime LLM plugin                      |
| Tanyakan tentang hari Anda | Pertanyaan, kartu hari yang dipilih, dan pengamatan terbaru | Model agen default melalui runtime LLM plugin                    |

Basis data SQLite lengkap tidak dikirim ke model mana pun. Tangkapan layar mentah hanya
dikirim ke tahap pengamatan; sintesis kartu, catatan rapat harian, dan tanya jawab
menerima teks turunan.

## Konfigurasi

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
      logbook: {
        enabled: true,
        config: {
          captureEnabled: true,
          captureIntervalSeconds: 30,
          analysisIntervalMinutes: 15,
          nodeId: "my-mac",
          screenIndex: 0,
          maxWidth: 1440,
          visionModel: "codex/gpt-5.6-sol",
          retentionDays: 14,
        },
      },
    },
  },
}
```

Semua kunci konfigurasi Logbook bersifat opsional. Nilai numerik dibulatkan menjadi
bilangan bulat dan dibatasi ke rentang yang didukung.

| Kunci                     | Default | Rentang atau nilai       | Perilaku                                                                                     |
| ------------------------- | ------- | ------------------------ | -------------------------------------------------------------------------------------------- |
| `captureEnabled`          | `true`  | boolean                  | Sakelar utama persisten untuk cuplikan baru; linimasa tetap tersedia saat `false`             |
| `captureIntervalSeconds`  | `30`    | `5`-`600`                | Jeda antarupaya perekaman                                                                    |
| `analysisIntervalMinutes` | `15`    | `3`-`120`                | Jendela pengamatan target; jeda dan tengah malam dapat menutupnya lebih awal                  |
| `nodeId`                  | tidak ditetapkan | id node atau nama tampilan | Mengunci perekaman ke satu node terhubung; pencocokan tidak peka huruf besar-kecil      |
| `screenIndex`             | `0`     | `0`-`16`                 | Indeks layar berbasis nol                                                                    |
| `maxWidth`                | `1440`  | `480`-`3840`             | Batas ukuran perekaman yang diminta; macOS tanpa antarmuka menerapkannya pada dimensi terbesar |
| `visionModel`             | tidak ditetapkan | `provider/model` | Rute terstruktur eksplisit; referensi yang salah format menjeda analisis, penyedia yang tidak didukung menggagalkan batch |
| `retentionDays`           | `14`    | `1`-`365`                | Menghapus bingkai lama; kartu, pengamatan, dan catatan rapat harian tetap dipertahankan        |

Tanpa `nodeId`, Logbook mengutamakan node aplikasi terhubung yang menyediakan
`screen.snapshot`, lalu beralih ke node tanpa antarmuka yang menyediakan
`logbook.snapshot`. Dalam penyiapan tanpa penguncian, node yang gagal dipindahkan ke
belakang node lain yang memenuhi syarat. Tombol jeda dasbor hanya berlaku untuk sesi
dan diatur ulang saat Gateway dimulai ulang; gunakan `captureEnabled: false` untuk
menghentikannya secara persisten.

### Pemilihan model visi

Logbook menentukan model pengamatan dalam urutan berikut:

1. `plugins.entries.logbook.config.visionModel`
2. entri Codex pertama yang mendukung gambar di bawah `tools.media.image.models`
3. entri Codex pertama yang mendukung gambar di bawah `tools.media.models`

Penyedia media lain dilewati karena saat ini tidak menyediakan kontrak ekstraksi
terstruktur yang diperlukan Logbook. Menetapkan `tools.media.image.enabled: false`
menonaktifkan default media yang dipinjam, tetapi `visionModel` Logbook yang
ditetapkan secara eksplisit tetap berlaku.

## Tab dasbor

- **Linimasa**: kartu yang dapat diperluas untuk setiap aktivitas, dengan warna kategori,
  aplikasi utama, label gangguan, dan bingkai utama cuplikan.
- **Ringkasan hari**: rasio fokus, perincian kategori, dan aplikasi teratas.
- **Catatan rapat harian**: mengubah aktivitas kemarin dan hari ini menjadi pembaruan
  yang siap ditempel.
- **Tanyakan tentang hari Anda**: pertanyaan bahasa alami yang dijawab berdasarkan
  linimasa yang dilacak ("kapan saya meninjau PR gateway?").
- **Analisis sekarang**: langsung menutup jendela perekaman saat ini, alih-alih
  menunggu interval analisis.

## Metode Gateway

Logbook mendaftarkan metode RPC Gateway berikut:

| Metode                | Parameter                | Cakupan          | Hasil                                                                    |
| --------------------- | ------------------------ | ---------------- | ------------------------------------------------------------------------ |
| `logbook.status`      | tidak ada                | `operator.read`  | Status perekaman, analisis, model, node, hari Gateway, dan zona waktu Gateway |
| `logbook.days`        | tidak ada                | `operator.read`  | Hari beserta jumlah kartu linimasa dan batas waktu kartu                  |
| `logbook.timeline`    | `{ day?: "YYYY-MM-DD" }` | `operator.read`  | Kartu turunan dan statistik harian; default ke hari Gateway saat ini     |
| `logbook.frames`      | `{ startMs, endMs }`     | `operator.write` | Metadata bingkai dalam rentang milidetik epoch yang diminta              |
| `logbook.frame`       | `{ frameId }`            | `operator.write` | Satu bingkai JPEG mentah sebagai base64                                  |
| `logbook.standup`     | `{ day?, refresh? }`     | `operator.write` | Teks catatan rapat harian yang disimpan dalam cache atau dibuat ulang untuk suatu hari |
| `logbook.ask`         | `{ day?, question }`     | `operator.write` | Jawaban untuk suatu hari yang didasarkan pada linimasa                   |
| `logbook.capture.set` | `{ paused }`             | `operator.write` | Status jeda khusus sesi dan status yang diperbarui                       |
| `logbook.analyze.now` | tidak ada                | `operator.write` | Memulai analisis yang tertunda, atau mengembalikan alasan analisis tidak dapat dimulai |

Metode baca mengembalikan status operasional atau teks turunan. Piksel tangkapan layar
mentah, tindakan yang menimbulkan biaya model, dan mutasi runtime memerlukan
`operator.write`. Tab UI Kontrol juga memerlukan `operator.write` karena menyediakan
tindakan tersebut dan pratinjau bingkai mentah; klien hanya-baca masih dapat memanggil
metode teks turunan secara langsung.

## Catatan privasi

- Cuplikan dapat memuat apa pun yang ada di layar, termasuk rahasia. Bingkai tidak
  pernah meninggalkan mesin kecuali sebagai masukan sampel ke model pengamatan yang
  dikonfigurasi.
- Pengamatan, kartu terbaru, dan pertanyaan dapat meninggalkan mesin melalui model
  agen default selama sintesis kartu, pembuatan catatan rapat harian, atau tanya jawab.
  Terapkan kebijakan penanganan data penyedia pada kedua rute model.
- Gunakan rute lokal untuk model pengamatan terstruktur dan model agen default jika
  Anda memerlukan alur yang sepenuhnya lokal.
- Bingkai, basis data linimasa, dan rekaman sementara ditulis dengan izin berkas khusus
  pemilik.
- Menambahkan `screen.snapshot` ke `gateway.nodes.denyCommands` merupakan sakelar
  penghenti perekaman layar: tindakan ini memblokir perekaman node aplikasi dan
  perintah `logbook.snapshot` milik Logbook.
- Menetapkan `tools.media.image.enabled: false` juga menghentikan Logbook meminjam
  model gambar media untuk analisis; setelah itu hanya `visionModel` eksplisit dalam
  konfigurasi plugin yang digunakan.

## Pemecahan masalah

### Tab Logbook tidak ada

Periksa ketiga persyaratan berikut:

1. `openclaw plugins list --enabled` menyertakan `logbook`.
2. Gateway telah dimulai ulang setelah perubahan plugin atau daftar izin.
3. Koneksi UI Kontrol memiliki `operator.write`; sesi hanya-baca tidak
   menerima deskriptor tab interaktif.

Jika `plugins.allow` ditetapkan, konfigurasi yang direkomendasikan harus menyertakan `logbook` dan `codex`.

### Pengambilan melaporkan kesalahan

```bash
openclaw nodes status --connected
openclaw nodes describe --node <idOrNameOrIp>
openclaw logs --follow
```

- Pastikan node menyediakan `screen.snapshot` atau `logbook.snapshot`.
- Berikan izin Screen Recording pada Mac yang melakukan pengambilan.
- Jika `nodeId` dikonfigurasi, pastikan nilainya cocok dengan ID node atau nama tampilan.
- Pastikan `gateway.nodes.denyCommands` tidak memuat
  `screen.snapshot`.

Setelah tiga kegagalan berturut-turut, Logbook melakukan jeda mundur selama sepuluh siklus pengambilan, lalu mencoba kembali. Penyiapan yang tidak disematkan dapat beralih ke node lain yang memenuhi syarat.

### Pengambilan berhasil, tetapi tidak ada kartu yang muncul

- Status **Model tidak tersedia** berarti tidak ditemukan rute penglihatan terstruktur yang kompatibel. Aktifkan dan autentikasi Plugin Codex, atau tetapkan `visionModel` eksplisit yang valid. Bingkai yang diambil tetap tertunda selama model tidak tersedia dan dapat dianalisis setelah konfigurasi diperbaiki.
- Tunggu selama `analysisIntervalMinutes`, atau pilih **Analisis sekarang** setelah aktivitas
  diambil.
- Bingkai identik berturut-turut merupakan bukti keadaan diam dan tidak dimasukkan ke dalam batch analisis. Ubah layar yang terlihat sebelum menguji.
- Jika batch terbaru menampilkan kesalahan, perbaiki masalah model atau autentikasi, lalu pilih
  **Analisis sekarang**. Batch yang gagal hanya dicoba kembali melalui tindakan eksplisit tersebut untuk menghindari pengeluaran model berulang.

## Terkait

- [Kelola plugin](/id/plugins/manage-plugins)
- [Harness Codex](/id/plugins/codex-harness)
- [Pemahaman media](/id/nodes/media-understanding)
- [Node](/id/nodes)
- [Pemecahan masalah node](/id/nodes/troubleshooting)
- [UI Kontrol](/id/web/control-ui)
