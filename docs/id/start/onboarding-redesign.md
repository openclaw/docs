---
read_when:
    - Anda sedang mengimplementasikan atau meninjau suatu fase desain ulang onboarding
summary: Rencana implementasi untuk desain ulang orientasi kustodian (dokumen yang terus diperbarui)
title: Desain ulang orientasi awal
x-i18n:
    generated_at: "2026-07-19T05:19:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: dc1f049d59cfa2638e7332ab4127905141625de5471144c856c91bfe50c9fa11
    source_path: start/onboarding-redesign.md
    workflow: 16
---

# Rencana implementasi desain ulang orientasi

> **Dokumen yang terus diperbarui.** Halaman ini melacak desain ulang orientasi pengelola pada
> tingkat implementasi dan diperbarui saat setiap fase diterapkan. Ketika fase terakhir
> digabungkan, halaman ini ditulis ulang sebagai panduan orientasi untuk pengguna dan dimasukkan ke
> navigasi dokumentasi. Halaman ini sengaja belum disertakan dalam `docs.json` hingga saat itu.

## Tujuan utama

Pengguna nonteknis mengetik `openclaw onboard` (atau membuka aplikasi) dan disambut
oleh satu kehadiran percakapan — OpenClaw, pengelola sistem ("custodian" hanyalah
nama internal; pengguna selalu melihat "OpenClaw") — yang menemukan AI mereka,
menyiapkan semuanya dengan mengumumkan pilihan default alih-alih mengajukan pertanyaan, menetaskan
agen mereka sebagai momen identitas yang terlihat, dan setelahnya tetap dapat dihubungi selamanya sebagai
pengurus sistem. Ajaib secara default, satu batas persetujuan, tanpa jalan buntu.

Prinsip desain (telah diputuskan, jangan diperdebatkan kembali dengan mudah):

- **Pilihan default yang diumumkan dan mudah dibatalkan** menggantikan pertanyaan yang menghambat. Satu-satunya
  persyaratan mutlak adalah inferensi yang berfungsi; yang lainnya hanyalah tawaran.
- **Pertanyaan nol adalah batas persetujuan**: "Akses penuh" (direkomendasikan) berarti
  penemuan berlangsung secara diam-diam dan otomatis; "Tanya dahulu" menempatkan setiap penemuan — pemindaian
  AI, pemindaian aplikasi, dan pemindaian sumber memori — di balik satu persetujuan
  eksplisit, dengan jalur manual sepenuhnya yang tidak pernah melakukan pemindaian.
- **Percakapan sebagai UI dengan kecerdasan progresif**: permukaan pengelola
  tersedia sebelum AI berfungsi (dialog berskrip), menjadi didukung model
  begitu sebuah rute terverifikasi, dan menyatakannya secara jelas. Permukaan ini tidak pernah memalsukan kecerdasan:
  masukan teks bebas sebelum rute terverifikasi mendapat tanggapan ramah "biarkan saya
  mengaktifkan otak saya terlebih dahulu".
- **Penetasan adalah sebuah seremoni**: utas yang sama, avatar berganti, agen menamai dirinya
  sendiri dan memilih wajahnya sendiri. Pengelola mengajarkan hierarki satu kali: "tanyakan kepada saya
  tentang sistem, atau cukup tanyakan kepada agen Anda — agen akan meneruskannya."
- **Kepercayaan bertingkat berdasarkan sumber**: entri katalog resmi dapat dipilih sebelumnya;
  skill ClawHub pihak ketiga tidak pernah dipilih sebelumnya terlepas dari
  peringkat model, dan labelnya menyatakan bahwa skill tersebut menginstal kode penerbit.
- **Instalasi yang telah dikonfigurasi bersifat sakral**: menjalankan ulang orientasi merupakan proses
  verifikasi. Proses ini tidak pernah menerapkan ulang penyiapan dan tidak pernah memulai ulang layanan Gateway.
- **Terminal adalah opsi cadangan, bukan pertanyaan**: utamakan dasbor
  peramban ketika gateway dapat dijangkau; jangan pernah bertanya "terminal atau peramban?".
- **Model yang lemah mendapat permukaan yang disederhanakan** (otomatis `localModelLean`), dijelaskan dengan
  kata-kata sederhana — tidak pernah menggunakan istilah alat, mode kode, atau jendela konteks.

## Alur yang saat ini dirilis (setelah fase 1-3)

`openclaw onboard` pada instalasi baru macOS, jalur lancar — total empat kali menekan Enter:

1. Catatan keamanan → satu kali menekan Enter untuk menyetujui (disimpan; tidak pernah ditanyakan lagi).
2. **Pertanyaan nol**: "Bagaimana saya harus menyiapkan semuanya?" — Akses penuh (direkomendasikan)
   atau Tanya dahulu. Disimpan sebagai `wizard.accessMode`; saat dijalankan ulang, pilihan yang tersimpan menjadi
   default. Mode terjaga + "konfigurasikan secara manual" membuka pemilih penyedia tanpa
   pemindaian apa pun dan juga melewati pemindaian sumber memori.
3. **Pertunjukan penemuan**: mendeteksi CLI pengodean, kunci lingkungan, dan runtime lokal;
   memberikan komentar ringan ketika agen pengodean ditemukan; menguji kandidat secara langsung sesuai urutan dan
   secara diam-diam mengumpulkan kegagalan menjadi satu baris ringkasan (detail di balik "Lihat opsi
   lainnya"). Rute pertama yang berfungsi diumumkan sebagai default dengan
   jalur satu penekanan tombol menuju pemilih lengkap; menjelajahi dan melewati tetap mempertahankan
   rute yang berfungsi.
4. Tawaran impor memori (Claude Code / Codex / Hermes), dilewati ketika penemuan
   ditolak.
5. Khusus instalasi baru: rencana penyiapan standar diterapkan secara otomatis
   (ruang kerja, layanan Gateway, sesi — rencana yang sama dengan yang dijalankan oleh "ya"
   dalam percakapan). Instalasi yang telah dikonfigurasi menampilkan "sudah disiapkan" dan tidak pernah mengubah
   layanan.
6. **Rekomendasi aplikasi**: aplikasi terinstal yang dicocokkan oleh model terverifikasi
   dengan katalog resmi + ClawHub; plugin saluran resmi
   sudah dicentang sebelumnya, sementara skill pihak ketiga bersifat opsional dengan label peringatan. Dapat dilewati;
   sakelar pemutus `wizard.appRecommendations`.
7. **Penetasan**: ketika gateway dapat dijangkau, pengalihan ke peramban membuka (GUI) atau
   menampilkan (headless/SSH) URL dasbor dan menunggu Control UI
   terhubung — "Dasbor terhubung — melanjutkan di peramban Anda." Jika tidak, atau
   dengan `--tui`, TUI terminal terbuka dengan pesan penetasan bootstrap
   yang telah dimuat dan agen memperkenalkan dirinya.

Orientasi gateway jarak jauh mempertahankan pengalihan percakapan lamanya
(`handoffMode: "chat"`); penyiapan harus diterapkan pada gateway jarak jauh.

## Fase

| #   | Fase                                                                                                                                                     | Permukaan              | Status                                                                                                                            |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Rekomendasi plugin aplikasi terinstal (pemindaian, kandidat, pencocok AI, langkah wizard, perintah node `device.apps`)                                              | CLI klasik + terpandu | digabungkan ([#109668](https://github.com/openclaw/openclaw/pull/109668))                                                              |
| 2   | Tulang punggung pengelola CLI (pertanyaan nol, pertunjukan penemuan, penerapan otomatis + penetasan)                                                                                | CLI terpandu           | digabungkan ([`a83ed13204f1`](https://github.com/openclaw/openclaw/commit/a83ed13204f118adf1009e5ac88d5afe1905b86c))                   |
| 3   | Pengalihan yang mengutamakan peramban (deteksi sesi GUI, menunggu koneksi dasbor, TUI sebagai opsi cadangan)                                                                | CLI → web            | digabungkan ([#110054](https://github.com/openclaw/openclaw/pull/110054))                                                              |
| 4   | Permukaan pengelola web (kartu opsi, bidang `question` bertipe pada `openclaw.chat`, pencerminan langkah wizard, pengalihan saat pertama dijalankan)                                 | Control UI           | digabungkan ([#110141](https://github.com/openclaw/openclaw/pull/110141), [#110242](https://github.com/openclaw/openclaw/pull/110242)) |
| 5   | Penetasan dan bootstrap (penyimpanan rekomendasi dengan semantik satu kali, urutan kelahiran dengan penamaan diri, pengalihan penetasan otomatis setelah penyiapan baru; jenjang avatar ditunda) | bootstrap agen      | digabungkan ([#110173](https://github.com/openclaw/openclaw/pull/110173), [#110331](https://github.com/openclaw/openclaw/pull/110331)) |
| 6   | Kehadiran pengelola PR1 (entri bilah sisi yang disematkan, Tanya OpenClaw di Pengaturan, sapaan pengurus dengan tampilan normal; komentar peristiwa dan pemanggilan saluran termasuk PR2)    | web + saluran       | digabungkan ([#110269](https://github.com/openclaw/openclaw/pull/110269))                                                              |
| 7   | Ketahanan (pengelola dapat dijangkau saat konfigurasi rusak, penyelamatan sebagian permukaan, doctor otomatis)                                                                   | gateway              | tindak lanjut                                                                                                                         |

## Catatan implementasi per fase

### Fase 1 — rekomendasi aplikasi (PR #109668)

- Pemindai: `src/infra/installed-apps.ts` (enumerasi macOS tanpa TCC; mengikuti
  bundel `.app` yang ditautkan secara simbolis).
- Kandidat: katalog resmi + pencarian ClawHub, anggaran keseluruhan 20 dtk, degradasi
  luring yang baik menjadi kandidat khusus katalog. Entri katalog adalah manifes paket
  tanpa `id` tingkat teratas — kandidat diberi kunci berdasarkan id
  plugin yang telah diresolusikan (diuji terhadap regresi menggunakan katalog bundel yang sebenarnya; pemberian kunci berdasarkan
  `entry.id` pernah menyatukan seluruh katalog dan menghilangkan setiap rekomendasi
  resmi).
- Pencocok AI: satu penyelesaian pada rute terverifikasi
  (`src/system-agent/setup-app-recommendations.ts`); tanpa peta id bundel yang dikurasi —
  model menolak kemiripan nama yang kebetulan. Keluaran dibatasi oleh anggaran
  `maxTokens` milik model yang diresolusikan (lapisan aliran menerapkannya ketika tidak ada
  batas eksplisit yang diberikan).
- **Pengaman rantai pasok**: teks daftar ClawHub dikendalikan oleh penerbit dan
  masuk ke prompt pencocok, sehingga sebuah daftar dapat mempromosikan dirinya menjadi
  "direkomendasikan". Hanya entri katalog resmi yang boleh dipilih sebelumnya; skill ClawHub
  selalu memerlukan centang eksplisit dan diberi label "skill ClawHub pihak ketiga;
  menginstal kode penerbitnya".
- Perintah Node `device.apps` (host node TS, kesetaraan amplop Android), berbagi
  dinonaktifkan secara default; sakelar pemutus gateway `wizard.appRecommendations`.
- Penyampaian berada dalam wizard klasik dan alur pengelola terpandu
  (`src/wizard/setup.app-recommendations.ts`); penargetan ulang ke bagian akhir bootstrap
  tetap menjadi fase 5 (layanan tersebut sudah menerima sumber inventaris yang dapat diinjeksi).
  Semantik satu kali (hanya menawarkan sampai diterima, pemindaian tersimpan) juga diterapkan
  bersama penyimpanan fase 5; saat ini, proses yang dijalankan ulang akan menawarkan kembali.
- Juga diperbaiki: prompt `completeSetupInference` khusus tidak lagi mewarisi
  batas keluaran probe verifikasi 32 token (`SETUP_INFERENCE_TEST_MAX_TOKENS`
  hanya berlaku untuk probe "balas OK").

### Fase 2 — tulang punggung pengelola CLI (PR #109841)

- Pengerjaan ulang alur di `src/commands/onboard-guided.ts`; orientasi gateway jarak jauh
  mempertahankan pengalihan obrolan lamanya melalui `handoffMode: "chat"`.
- Pertanyaan nol menyimpan `wizard.accessMode` ("full" | "guarded"); saat dijalankan ulang,
  pilihan tersimpan menjadi default (menerima default tidak pernah dapat secara diam-diam
  menurunkan mode terjaga menjadi penuh). Mode terjaga + manual menggunakan
  `listManualSetupInferenceOptions` (hanya konfigurasi/manifes, tanpa pengujian) dan
  melewati pemindaian sumber memori.
- Penemuan: pengumpulan kegagalan secara diam-diam (satu baris ringkasan; detail di balik
  "Lihat opsi lainnya"), komentar ringan tentang agen pengodean, default rute yang diumumkan. Jumlah sesi
  dalam komentar ditunda (hanya kualitatif) hingga tersedia
  seam penghitungan sesi yang murah.
- Instalasi baru: `applySystemAgentSetup` ("ya" percakapan yang deterministik),
  lalu penetasan melalui `launchTuiCli` yang dimuat dengan pesan bootstrap.
  Instalasi yang telah dikonfigurasi (konfigurasi model atau gateway yang sudah ada — stempel waktu
  wizard tidak membuktikan apa pun karena digunakan bersama configure/doctor):
  hanya verifikasi — tanpa penerapan, tanpa memulai ulang layanan Gateway. Kegagalan penerapan
  kembali ke obrolan percakapan.

### Fase 3 — pengalihan yang mengutamakan peramban (PR #110054, digabungkan)

- `src/commands/onboard-browser-handoff.ts` menangani deteksi sesi grafis murni
  (`SSH_CONNECTION`/`SSH_TTY`; `DISPLAY`/`WAYLAND_DISPLAY` di Linux)
  dan waktu tunggu GUI 60 detik / SSH 300 detik. Orientasi terpandu saat ini
  mengaktifkan serah terima hanya di macOS; `--tui` dan platform lain tetap
  menyediakan jalur keluar terminal. Pengaktifan Linux/Windows merupakan tindak lanjut.
- Tautan dasbor menggunakan pembantu `resolveAdvertisedControlUiLinks`,
  `resolveLocalControlUiProbeLinks`, dan `buildOnboardingControlUiUrl` yang sama
  seperti finalisasi klasik. Peluncuran peramban menggunakan pembantu bersama `openUrl`.
- Kesiapan melakukan polling terhadap RPC `system-presence` yang ada sebagai **klien loopback
  mode CLI yang menyajikan rahasia bersama yang dikonfigurasi** — jalur tepercaya yang digunakan setiap
  perintah `openclaw`. Klien Control UI autentikasi-bersama mentah ditolak
  dengan "identitas perangkat diperlukan" pada Gateway SecretRef. Pra-pemeriksaan
  keterjangkauan menyelesaikan target (dan rahasia) yang sama seperti loop tunggu, sehingga
  gerbang dan penantian tidak akan pernah berbeda dalam autentikasi. Serah terima selesai hanya
  ketika baris kehadiran `openclaw-control-ui`/`webchat` yang terhubung adalah baru
  dibandingkan dengan tolok dasar sebelum peluncuran (dasbor yang sudah terbuka tidak dapat
  menyelesaikannya).
- `gateway.controlUi.enabled: false` melakukan korsleting sebelum URL apa pun ditampilkan.
- Terbukti menyeluruh terhadap Gateway terisolasi dengan konfigurasi yang sama: pencetakan URL → koneksi
  peramban nyata → "Dasbor terhubung — melanjutkan di peramban Anda" → tanpa
  jalur keluar terminal. Penahanan "token tidak cocok" sebelumnya merupakan artefak
  kerangka pengujian — lihat panduan pengujian di bawah.

### Fase 4 — permukaan kustodian web (digabungkan: #110141, #110242)

- Halaman `/custodian` melalui `openclaw.chat` dengan komponen kartu opsi
  (2-4 kartu, maksimum satu yang direkomendasikan, selalu dapat dilewati); bingkai orientasi melalui
  `?onboarding=1`; penyelesaian penyiapan model pada proses pertama menyerahkan kendali ke halaman ini.
- Pertanyaan terstruktur merupakan bidang `question` aditif bertipe pada
  `SystemAgentChatResult` (teks `reply` per opsi; prosa selalu berdiri sendiri
  untuk aplikasi macOS/TUI). Produsen: kedua varian sambutan orientasi dan
  langkah pilih/konfirmasi wisaya terhos dengan 2-4 opsi tertutup — wisaya kanal
  nyata dirender sebagai kartu. Solusi sementara penanda string PR1 telah dihapus.
- Kepemilikan sesi dibatasi pada URL Gateway + setiap kredensial yang disajikan
  (token, kata sandi, token bootstrap, token perangkat tersimpan — tetap melekat saat
  koneksi hello terputus sementara); giliran pengguna yang gagal tidak pernah dapat diputar ulang; masukan
  sensitif dikirim apa adanya dan disamarkan dalam transkrip.

### Fase 5 — penetasan dan bootstrap (digabungkan: #110173, #110331)

- Kustodian membuat agen tanpa nama (pemanggilan alat); bootstrap agen dibuka
  dengan pemberian nama oleh dirinya sendiri. PR1 mengirimkan seremoni yang dibatasi hingga tiga tahap (nama → baris
  jiwa → pertanyaan Skills) dan menangguhkan jenjang avatar buatan sendiri/pembuatan gambar
  (kandidat yang dihasilkan model → tanda prasetel → pertahankan logo) ke tindak lanjut. Utas yang sama,
  pergantian avatar; tanda cakar tetap dikhususkan untuk kustodian. Identitas yang
  disepakati disimpan dua kali: ke `IDENTITY.md`/`SOUL.md` (yang dibaca agen)
  dan melalui `openclaw agents set-identity` (yang ditampilkan kanal dan UI).
- Rekomendasi (layanan fase 1, pemindaian tersimpan dengan semantik sekali) muncul sebagai
  langkah bootstrap terakhir sebelum berkas bootstrap dihapus: "set minimal
  atau kenyamanan maksimum?" Bootstrap membaca penawaran tersimpan melalui
  `openclaw onboard recommendations --json` (hanya ID pemasangan buram) dan
  mengakuinya setelah pilihan ditangani agar tidak pernah menanyakannya lagi. Tombol
  sambungkan kanal membawa panduan penyiapan per kanal; agen mengumpulkan
  kredensial secara percakapan dan meneruskan penulisan konfigurasi kepada kustodian
  ("meminta OpenClaw…" adalah ungkapan baku).
- Pembelajaran mandiri ditanyakan, bukan diumumkan, dan sekaligus menjadi persetujuan
  lokakarya keterampilan; jelaskan pemeriksaan kepercayaan rilis, pemindaian, verifikasi, dan integritas
  ClawHub beserta peringatan kode penerbit — jangan pernah menyiratkan bahwa setiap rilis ditandatangani.
- Penetasan otomatis telah dikirimkan: penerapan penyiapan instalasi baru mengumumkan penetasan dan
  menyerahkan kendali (TUI terminal / `open-agent` untuk klien Gateway); halaman web
  membuka obrolan agen dengan draf "Bangunlah, temanku!" yang telah terisi. Serah
  terima hanya dipicu setelah verifikasi pascapenulisan yang bersih. Penawaran saat tidak ada
  agen setelah penghapusan (alih-alih otomatis) tetap menjadi penyempurnaan tindak lanjut.

### Fase 6 — kehadiran kustodian (PR1 digabungkan: #110269; komentar/pemanggilan ada di PR2)

- Dikirimkan dalam PR1: entri bilah samping "OpenClaw" yang disematkan secara default (profil baru;
  pengguna lama mempertahankan sematan tersimpan dan mengaksesnya melalui sesuaikan/More), "Tanya
  OpenClaw" sebagai entri Settings pertama, serta kunjungan `/custodian` dengan bingkai normal
  yang meminta salam pengurus (tanpa varian sambutan orientasi), dengan
  Keluar dari penyiapan dirender hanya dalam mode orientasi. Panel Settings sebaris yang
  ditambatkan memerlukan ekstraksi tampilan percakapan bersama (tindak lanjut).
- Komentar reaktif-peristiwa dengan pagar pengaman anti-Clippy: hanya perubahan yang
  berdampak atau gagal, paling banyak sekali per kunjungan Settings kecuali diminta. Celah
  peristiwa yang sama kelak menjadikan kustodian sebagai suara untuk autentikasi yang terdegradasi atau
  kanal yang rusak.
- Kanal: tidak terlihat dalam penggunaan sehari-hari (agen meneruskan); dapat dijangkau melalui
  pemanggilan eksplisit dan saat agen tidak aktif dalam utas yang sama, dengan nama dan
  avatar cakar sendiri jika platform mengizinkan.
- Model lemah terdeteksi saat penyiapan: atur otomatis `localModelLean`, dan kustodian
  menyampaikannya dengan kata-kata sederhana disertai tawaran peningkatan.
- Kustodian mengetahui julukan internalnya ("sebagian orang menyebut saya
  kustodian — OpenClaw juga boleh") dan selalu menyebut agen berdasarkan namanya.

### Fase 7 — ketahanan (memerlukan keputusan pemilik sebelum dibangun)

Sketsa awal — "kustodian harus dapat dijangkau tidak peduli seberapa rusak
konfigurasinya" — berbenturan dengan kebijakan keamanan repo: panduan root
menyatakan Gateway **menolak dimulai** ketika konfigurasi secara struktural tidak valid,
dan hanya kegagalan pemilik SecretRef yang terdegradasi menjadi kapabilitas
tidak tersedia yang dikonfigurasi. Menyajikan permukaan apa pun dari konfigurasi yang tidak valid adalah perubahan
kebijakan, bukan detail implementasi. Dua cakupan, pilih satu:

- **Opsi A (direkomendasikan, sesuai kebijakan): auto-doctor sisi CLI.** Ketika
  Gateway atau CLI gagal dimulai karena konfigurasi tidak valid dengan bentuk yang dikenal, CLI menawarkan
  (atau dengan persetujuan menjalankan) `openclaw doctor --fix`, lalu mencoba kembali sekali dan
  melaporkan secara lugas. Tidak ada perubahan perilaku Gateway; kustodian tetap dapat dijangkau
  melalui jalur SecretRef terdegradasi yang ada dan terminal.
- **Opsi B (memerlukan persetujuan pemilik secara eksplisit + review keamanan): mode
  permukaan minimal Gateway.** Pada konfigurasi yang secara struktural tidak valid, mulai permukaan terkunci
  yang hanya menyajikan percakapan kustodian dan tindakan doctor. Ini
  menulis ulang kontrak permulaan gagal-tertutup dan harus menetapkan skema perlindungan
  masuknya sendiri sebelum kode apa pun dibuat.

Tindak lanjut tersisa dari fase 4-6 (dilacak, belum dijadwalkan): jenjang avatar/pembuatan gambar
untuk penetasan; rendering bidang `question` bertipe oleh aplikasi macOS; panel
Settings sebaris yang ditambatkan untuk kustodian (memerlukan ekstraksi tampilan percakapan
bersama); komentar reaktif-peristiwa dan pemanggilan kanal/pemulihan saat agen tidak aktif
(fase 6 PR2); `localModelLean` otomatis untuk model lemah; apakah sematan
bilah samping tersimpan milik pengguna lama harus mengadopsi entri OpenClaw.

## Panduan pengujian dan pendaratan (diperoleh dengan susah payah; baca sebelum fase 4-6)

- **`OPENCLAW_STATE_DIR` tidak mengisolasi layanan Gateway.** Label
  LaunchAgent (`ai.openclaw.gateway`) bersifat global di mesin: pengujian orientasi
  instalasi baru dengan direktori status terisolasi akan MENULIS ULANG dan MEMULAI ULANG layanan nyata
  mesin (skrip pembungkus ditempatkan di dalam direktori terisolasi; permulaan
  layanan berikutnya rusak ketika direktori tersebut dibersihkan). Setelah pengujian instalasi baru apa pun,
  pulihkan dengan `openclaw gateway install --force && openclaw gateway
restart` dari lingkungan nyata dan verifikasi plist. Tindak lanjut produk:
  label layanan yang dibatasi pada direktori status, atau orientasi yang mendeteksi layanan asing.
- **Kerangka menyeluruh yang aman**: isi terlebih dahulu konfigurasi terisolasi dengan bagian `gateway`
  (agar orientasi mengambil jalur instalasi terkonfigurasi dan tidak pernah menyentuh
  layanan) lalu jalankan `openclaw gateway run` sebagai proses latar depan biasa pada
  port cadangan dengan token biasa. Kerangka tersebut membuktikan loop fase 3,
  termasuk koneksi peramban nyata.
- **Jalur autentikasi berbeda berdasarkan identitas klien, bukan hanya kredensial.** Pembacaan kehadiran dan
  operator lainnya menggunakan klien loopback mode CLI dengan kredensial dari
  konfigurasi yang sama. Gateway dengan autentikasi token memerlukan rahasia bersama; Gateway
  SecretRef/tanpa autentikasi dapat kembali ke autentikasi loopback tepercaya tanpa token. Klien
  peramban yang diidentifikasi sebagai Control UI memerlukan identitas perangkat atau pemberian loopback
  konteks aman. Probe yang mengautentikasi terhadap Gateway yang menyajikan konfigurasi
  BERBEDA (lihat jebakan LaunchAgent) gagal dengan "token tidak cocok" — artefak tersebut
  sempat menahan fase 3.
- **Probe penyelesaian**: `runSetupInferenceTest` membatasi probe verifikasi hingga
  32 token keluaran; prompt khusus melewati batas tersebut dan dibatasi oleh
  `maxTokens` milik model sendiri. Model penalaran menggunakan anggaran itu untuk penalaran
  tersembunyi terlebih dahulu — giliran dengan teks kosong biasanya berarti anggarannya habis di sana.
- **Pendaratan agen memerlukan CI terhos pada head yang tepat.** Alur kerja berat `CI` mungkin
  tidak masuk antrean saat organisasi sibuk; alternatif bagi pengelola adalah
  pengiriman gerbang rilis pada cabang PR:

  ```bash
  gh workflow run ci.yml --ref <branch> -f target_ref=<head-sha> -f release_gate=true -f pull_request_number=<pr>
  ```

  Proses harus berada pada
  ref cabang agar `head_sha` cocok, dan judulnya menjadi
  `CI release gate <sha>`, yang diterima oleh `scripts/verify-pr-hosted-gates.mjs`.
  Kemudian persiapkan/gabungkan `scripts/pr` seperti biasa.

- **Gerbang yang diberlakukan CI di luar pengujian terfokus**: peta dokumentasi
  (`pnpm docs:map:gen` setelah menambahkan halaman dokumentasi apa pun), oxlint (`no-map-spread`,
  `max-lines` — pisahkan berkas, jangan pernah menonaktifkan), `check:test-types`, kode mati
  knip (ekspor hanya yang digunakan produksi; arahkan pengujian melalui API publik),
  dan pengklasifikasi shard pengujian langsung
  (`test/scripts/test-live-shard.test.ts` harus mencantumkan setiap `*.live.test.ts` baru).

## Log keputusan

- Pemindaian ajaib dengan tombol penghentian, bukan persetujuan terlebih dahulu (fase 1; pengungkapan terdapat
  di baris kemajuan pemindaian dan catatan hasil).
- Vertikal lengkap termasuk perintah Node `device.apps` (fase 1).
- Skills ClawHub pihak ketiga tidak pernah dipilih sebelumnya dan diberi label sebagai
  pemasangan kode penerbit; entri resmi dapat dicentang sebelumnya
  (fase 1, postur keamanan yang telah dikirimkan).
- Dua kartu akses, bukan tiga; persetujuan ditempatkan di awal dalam pilihan (fase 2).
- Penetasan otomatis dengan pengumuman, bukan tombol yang memblokir (fase 2/5).
- Peramban terlebih dahulu: jalur keluar terminal adalah pilihan cadangan, bukan pertanyaan "terminal atau
  peramban?" (fase 3).
- Kustodian mendapatkan kehadiran kanal (pemanggilan + pemulihan), bukan hanya web/CLI
  (fase 6).
- Penetasan berlangsung dalam utas yang sama dengan pergantian avatar; setelah selesai,
  aplikasi beralih ke UI biasa (fase 5).
- Permukaan pengaturan mempertahankan nama "Settings"; kustodian berada di sana
  (dan di bilah samping), bukan menggantikannya (fase 6).
- Kartu opsi dibatasi: 2-4 opsi, tepat satu direkomendasikan, selalu
  dapat dilewati; komponen yang sama melayani orientasi dan alat pertanyaan agen
  (fase 4).
- "Meminta OpenClaw…" adalah ungkapan delegasi baku; jiwa dapat menambahkan nuansa,
  narasi alat tetap lugas (fase 5).
- Teks yang dilihat pengguna tidak pernah menyebut "mode kode", "alat", atau "jendela konteks" saat
  menjelaskan pemangkasan model lemah (fase 6).

## Kesenjangan yang diketahui dan tindak lanjut

- Label LaunchAgent tidak dibatasi menurut direktori status (kendala pengujian di atas; juga merupakan
  kesenjangan produk multi-instans yang nyata).
- Rekomendasi memerlukan semantik sekali saja dan pemindaian tersimpan (fase 5); eksekusi ulang
  saat ini menawarkannya kembali.
- Serah terima browser hanya tersedia di macOS; pengaktifan di Linux/Windows masih tertunda.
- Komentar jenaka tentang jumlah sesi bersifat kualitatif; penghitungan memerlukan antarmuka jumlah sesi yang ringan.
- Serah terima browser mengarah ke dasbor normal; tautan dalam pengelola mode orientasi
  akan hadir pada fase 4.
