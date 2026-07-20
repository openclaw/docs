---
read_when:
    - Anda perlu memahami mengapa suatu tugas CI berjalan atau tidak berjalan
    - Anda sedang men-debug pemeriksaan GitHub Actions yang gagal
    - Anda sedang mengoordinasikan pelaksanaan atau pelaksanaan ulang validasi rilis
    - Anda sedang mengubah pengiriman ClawSweeper atau penerusan aktivitas GitHub
summary: Graf job CI, gerbang cakupan, payung rilis, dan perintah lokal yang setara
title: Pipeline CI
x-i18n:
    generated_at: "2026-07-20T03:46:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8d2b185ae6261201072242a3873bd154cbf695e16bae3e41f7e05f6a5ac1a173
    source_path: ci.md
    workflow: 16
---

CI OpenClaw berjalan saat push ke `main` (jalur Markdown dan `docs/**` diabaikan
pada pemicu), pada setiap pull request yang bukan draf, dan pada pemicuan manual.
Push `main` kanonis berjalan satu per satu: grup konkurensi `CI` memungkinkan satu
siklus integrasi lengkap berjalan sementara GitHub hanya menyimpan push tertunda terbaru.
Penggabungan baru menggantikan proses tertunda tersebut alih-alih membatalkan pekerjaan yang sudah
mendaftarkan matriks Blacksmith. Pull request tetap membatalkan head yang telah digantikan,
dan pemicuan manual menggunakan grup terisolasi. `preflight` mengklasifikasikan diff dan
menonaktifkan lane berbiaya tinggi ketika hanya area yang tidak terkait yang berubah. Proses
`workflow_dispatch` manual sengaja melewati pelingkupan cerdas dan menyebarkan
graf lengkap untuk kandidat rilis dan validasi luas. Lane Android tetap
bersifat opsional melalui `include_android` (atau input `release_gate`). Cakupan
plugin khusus rilis berada dalam alur kerja
[`Plugin Prerelease`](#plugin-prerelease) terpisah dan hanya berjalan dari
[`Full Release Validation`](#full-release-validation) atau pemicuan manual
eksplisit.

## Ikhtisar pipeline

| Pekerjaan                          | Tujuan                                                                                                                                                                                                                | Waktu dijalankan                                     |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `preflight`                        | Mendeteksi cakupan yang berubah dan membangun manifes CI; pada `main` kanonis yang relevan dengan Node, menyegarkan dan memelihara snapshot dependensi sebelum penyebaran                                       | Selalu pada push dan PR yang bukan draf              |
| `security-fast`                    | Deteksi kunci privat, audit alur kerja yang berubah melalui `zizmor`, dan audit lockfile produksi                                                                                                               | Selalu pada push dan PR yang bukan draf              |
| `pnpm-store-warmup`                | Menyiapkan cache Actions yang dikunci oleh lockfile untuk pull request dan proses manual tanpa memblokir shard Node Linux                                                                                              | Lane Node atau pemeriksaan dokumentasi dipilih di luar main |
| `build-artifacts`                  | Membangun `dist/`, Control UI, pemeriksaan cepat CLI hasil build, memori startup, dan pemeriksaan artefak hasil build yang disematkan                                                                            | Perubahan yang relevan dengan Node                   |
| `control-ui-i18n`                  | Memverifikasi bundel locale Control UI yang dihasilkan, metadata, dan memori terjemahan; bersifat saran pada proses otomatis, memblokir pada CI rilis manual                                                           | Perubahan yang relevan dengan i18n Control UI dan CI manual |
| `checks-fast-core`                 | Lane kebenaran Linux cepat: ratchet baris maksimum baseline supresi, paket bawaan + protokol, peluncur Bun, dan tugas cepat perutean CI                                                                                | Perubahan yang relevan dengan Node                   |
| `qa-smoke-ci-profile`              | Dua bagian seimbang mandiri dari kumpulan representatif QA Smoke otomatis terbatas; cakupan taksonomi penuh tetap tersedia melalui profil QA eksplisit                                                                | Perubahan yang relevan dengan Node                   |
| `checks-fast-contracts-plugins-*`  | Dua shard kontrak plugin berbobot                                                                                                                                                                                     | Perubahan yang relevan dengan Node                   |
| `checks-fast-contracts-channels-*` | Dua shard kontrak kanal berbobot                                                                                                                                                                                       | Perubahan yang relevan dengan Node                   |
| `checks-node-*`                    | Pengujian Node untuk target yang berubah pada pull request; shard inti lengkap pada `main`, proses manual, rilis, dan proses fallback luas                                                                        | Perubahan yang relevan dengan Node                   |
| `check-*`                          | Padanan gate lokal utama yang di-shard: guard, shrinkwrap, metadata konfigurasi kanal bawaan, tipe produksi, lint, dependensi, tipe pengujian                                                                          | Perubahan yang relevan dengan Node                   |
| `check-additional-*`               | Jalur pemeriksaan batas (termasuk pergeseran snapshot prompt), batas pengakses sesi/pembaca transkrip/transaksi SQLite, grup lint ekstensi, kompilasi/canary batas paket, dan arsitektur topologi runtime                 | Perubahan yang relevan dengan Node                   |
| `checks-node-compat-node22`        | Build kompatibilitas Node 22 dan lane pemeriksaan cepat                                                                                                                                                               | Pemicuan CI manual untuk rilis                       |
| `check-docs`                       | Pemformatan dokumentasi, lint, dan pemeriksaan tautan rusak                                                                                                                                                           | Dokumentasi berubah (PR dan pemicuan manual)         |
| `native-i18n`                      | Memverifikasi ekstraksi sumber native dan keamanan pelokalan pada PR sumber; memberlakukan kesetaraan penuh hasil terjemahan/pembuatan platform pada PR yang dihasilkan dan CI manual                                    | Perubahan yang relevan dengan i18n native            |
| `skills-python`                    | Ruff + pytest untuk skill yang didukung Python                                                                                                                                                                        | Perubahan yang relevan dengan skill Python           |
| `checks-windows`                   | Pengujian proses/jalur khusus Windows beserta regresi penentu impor runtime bersama                                                                                                                                   | Perubahan yang relevan dengan Windows                |
| `macos-node`                       | Pengujian TypeScript macOS terfokus: launchd, Homebrew, jalur runtime, skrip pemaketan, pembungkus grup proses                                                                                                        | Perubahan yang relevan dengan macOS                  |
| `macos-swift`                      | Lint dan build Swift untuk aplikasi macOS, beserta pengujian untuk aplikasi dan paket OpenClawKit bersama                                                                                                             | Perubahan yang relevan dengan macOS                  |
| `ios-build`                        | Pembuatan proyek Xcode beserta build simulator aplikasi iOS                                                                                                                                                           | Perubahan aplikasi iOS, kit aplikasi bersama, atau Swabble |
| `android`                          | Pengujian unit Android untuk kedua varian beserta satu build APK debug                                                                                                                                                | Perubahan yang relevan dengan Android                |
| `openclaw/ci-gate`                 | Agregat akhir: memerlukan preflight dan keamanan; hanya menerima pengabaian untuk lane hilir yang dinonaktifkan manifes                                                                                                | Setiap proses CI yang bukan draf                     |
| `test-performance-agent`           | Alur kerja terpisah: pengoptimalan pengujian lambat Codex harian setelah aktivitas tepercaya                                                                                                                          | Keberhasilan CI utama atau pemicuan manual           |
| `openclaw-performance`             | Alur kerja terpisah: laporan performa runtime Kova harian/sesuai permintaan dengan lane penyedia tiruan, profil mendalam, dan GPT 5.6 langsung                                                                         | Pemicuan terjadwal dan manual                        |

Alur kerja Periphery mandiri memberlakukan nol temuan kode mati untuk aplikasi iOS dan macOS. Alur kerja OpenClawKit bersama memindai kedua konsumen secara paralel dan melaporkan deklarasi hanya ketika Periphery menghasilkan USR Swift yang sama dari kedua build. Kontrak skema `OpenClawProtocol/GatewayModels.swift` yang dihasilkannya dipertahankan sebagai kode milik generator, bukan diperlakukan sebagai kode mati lokal aplikasi.

## Urutan gagal cepat

1. `preflight` menentukan lane mana yang tersedia. Logika `docs-scope` dan `changed-scope` merupakan langkah di dalam pekerjaan ini, bukan pekerjaan mandiri. `main` kanonis dimulai segera, tetapi grup konkurensinya hanya mengizinkan satu proses lengkap dan menggabungkan push berikutnya menjadi satu proses tertunda terbaru. Push main yang relevan dengan Node juga menserialkan satu-satunya penulis disk dependensi dan pemeliharaan ukurannya di sini sebelum pekerjaan hilir dapat memasang kunci tersebut; Blacksmith mungkin baru mengekspos commit baru ke proses alur kerja berikutnya, sehingga konsumen dalam proses yang sama mempertahankan fallback lokal yang diperiksa dengan penanda.
2. `security-fast`, `check-*`, `check-additional-*`, `check-docs`, dan `skills-python` gagal dengan cepat tanpa menunggu pekerjaan matriks artefak dan platform yang lebih berat.
3. `build-artifacts` dan pemeriksaan locale berjalan bersamaan dengan lane Linux cepat. PR sumber Control UI dan aplikasi native mengecualikan snapshot/sumber daya locale yang dihasilkan; alur kerja penyegaran terserialisasi memperbaiki dan menggabungkan otomatis PR hasil pembuatan yang terisolasi di latar belakang. CI sumber tetap memblokir inventaris sumber yang usang dan pemanggilan pelokalan yang tidak aman. PR hasil pembuatan, CI manual, dan persiapan rilis memberlakukan kesetaraan penuh hasil terjemahan/pembuatan platform. Cabang `release/YYYY.M.PATCH` kanonis dapat menyertakan perbaikan locale persiapan rilis bersama keluaran rilis lain yang dihasilkan.
4. Lane platform dan runtime yang lebih berat kemudian disebarkan: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build`, dan `android`.
5. `openclaw/ci-gate` menunggu setiap lane yang dipilih. Preflight dan keamanan harus berhasil; pekerjaan hilir hanya boleh dilewati ketika manifes tidak memilihnya. Lane terpilih yang gagal atau dibatalkan menggagalkan agregat.

Koordinator penggabungan dapat menggunakan kembali `openclaw/ci-gate` terautentikasi yang berhasil
untuk head pull request yang sama hingga 24 jam. Hal ini menghindari penulisan ulang
cabang kontributor setelah perubahan `main` yang tidak terkait. Hasil yang dapat digunakan kembali tidak
menggantikan pemeriksaan penggabungan pengujian ketat terpisah milik App terhadap `main` saat ini.
Proses ulang tertunda atau gagal berikutnya tidak menghapus hasil berhasil sebelumnya untuk
head yang tidak berubah tersebut selama jendela kesegaran.

Aturan cabang default mewajibkan pemeriksaan `openclaw/ci-gate` yang dimiliki GitHub Actions. Pemelihara dan admin repositori memiliki bypass darurat yang diaudit dan hanya ditujukan untuk pendaratan fast-forward langsung yang ditandatangani; aturan organisasi tetap memblokir penghapusan dan pembaruan non-fast-forward. Penggabungan pull request normal harus tetap menggunakan gerbang tersebut, bukan melewati Pipeline CI yang gagal. Pemeriksaan test-merge ketat terpisah yang dimiliki App tetap mengikat head ke `main` saat ini.

GitHub dapat menandai pekerjaan pull request yang telah digantikan sebagai `cancelled` ketika head yang lebih baru mendarat. Anggap hal itu sebagai derau Pipeline CI kecuali proses terbaru untuk PR yang sama juga gagal. Proses `main` kanonis tidak dibatalkan setelah diterima; ketika lalu lintas penggabungan masuk, GitHub hanya mengganti proses tertunda yang lebih lama dengan tip terbaru. Pekerjaan matriks menggunakan `fail-fast: false`, dan `build-artifacts` melaporkan kegagalan saluran tertanam, batas dukungan inti, dan pemantauan Gateway secara langsung, alih-alih mengantrekan pekerjaan verifikator kecil. Kunci konkurensi Pipeline CI otomatis memiliki versi (`CI-v7-*`) sehingga proses zombie di sisi GitHub dalam grup antrean lama tidak dapat memblokir proses main yang lebih baru tanpa batas waktu. Proses rangkaian lengkap manual menggunakan `CI-manual-v1-*` dan tidak membatalkan proses yang sedang berlangsung. Pengaman memori awal daftar plugin mempertahankan batas maksimum 350 MiB pada Blacksmith Linux yang dihosting sendiri dan mengizinkan 425 MiB pada Linux yang dihosting GitHub, yang memiliki baseline RSS lebih tinggi untuk CLI hasil build yang sama.

Gunakan `pnpm ci:timings`, `pnpm ci:timings:recent`, atau `node scripts/ci-run-timings.mjs <run-id>` untuk merangkum waktu keseluruhan, waktu antrean, pekerjaan paling lambat, kegagalan, dan penghalang fanout `pnpm-store-warmup` dari GitHub Actions. Pekerjaan `ci-timings-summary` dalam alur kerja tersedia di `ci.yml`, tetapi saat ini dinonaktifkan (`if: false`); sebagai gantinya, jalankan pembantu pengukuran waktu secara lokal. Untuk pengukuran waktu build, periksa langkah `Build dist` pada pekerjaan `build-artifacts`: `pnpm build:ci-artifacts` mencetak `[build-all] phase timings:` dan menyertakan `ui:build`; pekerjaan tersebut juga mengunggah artefak `startup-memory`.

## Konteks dan bukti PR

PR kontributor eksternal menjalankan gerbang konteks dan bukti PR dari
`.github/workflows/real-behavior-proof.yml`. Alur kerja melakukan checkout terhadap
revisi alur kerja tepercaya (`github.workflow_sha`) dan hanya mengevaluasi isi PR;
alur kerja tersebut tidak mengeksekusi kode dari cabang kontributor.

Gerbang ini berlaku bagi penulis PR yang bukan pemilik repositori, anggota,
kolaborator, atau bot. Gerbang lolos ketika isi PR memuat bagian
`What Problem This Solves` dan `Evidence` yang ditulis oleh penulis. Bukti dapat berupa
pengujian terfokus, hasil Pipeline CI, tangkapan layar, rekaman, keluaran terminal,
pengamatan langsung, log yang telah disunting, atau tautan artefak. Isi tersebut memberikan maksud dan validasi yang berguna;
peninjau memeriksa kode, pengujian, dan Pipeline CI untuk menilai kebenaran.

Ketika pemeriksaan gagal, perbarui isi PR, bukan mendorong commit kode lainnya.

## Cakupan dan perutean

Logika cakupan berada di `scripts/ci-changed-scope.mjs` dan dicakup oleh pengujian unit di `src/scripts/ci-changed-scope.test.ts`. Pemicu manual melewati deteksi perubahan cakupan dan membuat manifes pra-pemeriksaan bertindak seolah-olah setiap area dalam cakupan telah berubah.

Alur kerja Periphery iOS dan macOS yang terpisah memberlakukan kebijakan tanpa temuan untuk kode mati. Masing-masing hanya berjalan ketika pull request non-draf menyentuh cakupan pemindaian natifnya, atau ketika dipicu secara manual.

- **Pengeditan alur kerja Pipeline CI** memvalidasi grafik Pipeline CI Node, linting alur kerja, dan lane Windows (`ci.yml` mengeksekusinya), tetapi tidak memaksa build natif iOS, Android, atau macOS dengan sendirinya; lane platform tersebut tetap dibatasi pada perubahan sumber platform.
- **Pemeriksaan Kelayakan Alur Kerja** menjalankan `actionlint`, `zizmor` pada semua file YAML alur kerja, pengaman interpolasi composite action, dan pengaman penanda konflik. Pekerjaan `security-fast` yang dibatasi untuk PR juga menjalankan `zizmor` pada file alur kerja yang berubah agar temuan keamanan alur kerja gagal lebih awal dalam grafik Pipeline CI utama.
- **Dokumentasi pada push `main`** diperiksa oleh alur kerja mandiri `Docs` dengan mirror dokumentasi ClawHub yang sama dengan yang digunakan Pipeline CI, sehingga push campuran kode+dokumentasi tidak turut mengantrekan shard `check-docs` Pipeline CI. Pull request dan Pipeline CI manual tetap menjalankan `check-docs` dari Pipeline CI ketika dokumentasi berubah.
- **PTY TUI** berjalan dalam shard Node Linux `checks-node-core-runtime-tui-pty` untuk perubahan TUI. Shard tersebut menjalankan `test/vitest/vitest.tui-pty.config.ts` dengan `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`, sehingga mencakup lane fixture deterministik `TuiBackend` dan smoke `tui --local` yang lebih lambat serta hanya memalsukan endpoint model eksternal.
- **Pengeditan khusus perutean Pipeline CI, sekumpulan kecil fixture pengujian inti yang dijalankan langsung oleh tugas cepat, dan pengeditan sempit pada pembantu kontrak plugin** menggunakan jalur manifes cepat khusus Node: `preflight`, `security-fast`, dan hanya lane cepat yang disentuh oleh perubahan — satu tugas perutean Pipeline CI `checks-fast-core`, dua shard kontrak plugin, atau keduanya. Jalur tersebut melewati artefak build, kompatibilitas Node 22, kontrak saluran, shard inti lengkap, shard plugin terpaket, dan matriks pengaman tambahan.
- **Pemeriksaan Node Windows** dibatasi pada pembungkus proses/jalur khusus Windows, pembantu runner npm/pnpm/UI, konfigurasi pengelola paket, dan permukaan alur kerja Pipeline CI yang mengeksekusi lane tersebut; perubahan sumber, plugin, smoke instalasi, dan khusus pengujian yang tidak terkait tetap berada di lane Node Linux.

Kelompok pengujian Node yang paling lambat dibagi atau diseimbangkan agar setiap pekerjaan tetap kecil tanpa mencadangkan runner secara berlebihan:

- Kontrak Plugin dan kontrak channel masing-masing dijalankan sebagai dua shard berbobot yang didukung Blacksmith dengan fallback runner GitHub standar.
- Lane cepat/dukungan unit inti dijalankan secara terpisah; infrastruktur runtime inti dibagi menjadi shard proses, bersama, hook, secret, dan tiga domain cron.
- Balasan otomatis dijalankan sebagai worker yang seimbang, dengan subtree balasan dibagi menjadi shard agent-runner, perintah, dispatch, sesi, dan perutean status.
- Konfigurasi Gateway/server agentik (control-plane) dibagi ke dalam lane chat, autentikasi, model, HTTP/Plugin, runtime, dan startup alih-alih menunggu artefak hasil build.
- Pipeline CI normal hanya mengemas shard pola penyertaan infrastruktur yang terisolasi ke dalam bundel deterministik berisi paling banyak 64 file pengujian, sehingga mengurangi matriks Node tanpa menggabungkan suite perintah/cron yang tidak terisolasi, agents-core berstatus, atau Gateway/server. Suite tetap yang berat tetap menggunakan 8 vCPU, sedangkan lane yang dibundel dan berbobot lebih rendah menggunakan 4 vCPU.
- Pull request pada repositori kanonis menggunakan kembali resolver pengujian yang berubah terhadap diff pohon gabungan sintetis. Perubahan yang presisi menjalankan satu tugas Node tertarget; setiap file pengujian yang dipilih mendapatkan prosesnya sendiri agar isolasi suite berstatus tetap utuh. Perencana menggabungkan pengujian saudara dengan dependen grafik impor dan kembali ke rencana suite lengkap ringkas 14 tugas yang sudah ada untuk perubahan paket workspace, paket/lockfile, harness bersama, konfigurasi terbagi, perubahan nama, atau penghapusan, perubahan kontrak ekstensi publik, pengujian dengan penyiapan shard khusus, target yang terselesaikan sebagian atau kosong, rencana jalur atau target yang terlalu besar, serta kesalahan perencana. Rencana tertarget selalu mempertahankan gate batas artefak hasil build lengkap karena pemindai repositorinya tidak dapat diturunkan dari impor. Push `main` menjalankan suite ringkas lengkap yang sama: peristiwa push perantara yang tertunda dapat digabungkan, sehingga proses terbaru yang bertahan harus memvalidasi pohon integrasi lengkap, bukan hanya diff satu push terakhirnya. Dispatch manual dan gate rilis mempertahankan matriks per shard lengkap yang bernama.
- Matriks Node lengkap menerima lebih dahulu tooling serial yang konsisten lambat, shard perintah balasan otomatis, dan penulis cache core-fast yang luas. Hal ini mempertahankan batas 28 tugas sekaligus mencegah pekerjaan jalur kritis dan seed transformasi proses berikutnya bergeser ke gelombang berikutnya.
- Pengujian browser, QA, media, dan Plugin lain-lain yang luas menggunakan konfigurasi Vitest khusus masing-masing, bukan penampung umum Plugin bersama. Shard pola penyertaan mencatat entri waktu menggunakan nama shard CI, sehingga `.artifacts/vitest-shard-timings.json` dapat membedakan seluruh konfigurasi dari shard yang difilter.
- Tugas shard Linux Node mempertahankan cache modul sistem berkas eksperimental Vitest melalui API cache Actions hulu, yang dipercepat secara transparan oleh Blacksmith pada runner-nya. Setiap shard CI hanya melakukan pemulihan dan mengekstrak seed terlindungi ke root lokal runner-nya sendiri; wrapper shard kemudian memberikan subdirektori aktif yang terpisah kepada proses Vitest yang berjalan bersamaan. Hanya warmer harian yang tidak dibatalkan atau warmer yang di-dispatch secara eksplisit yang menyimpan arsip immutable baru, sehingga pull request tidak dapat memublikasikan transformasi atau membuat keluarga cache per-PR. Sidik jari input transformasi menghapus generasi lockfile, paket, tsconfig, dan konfigurasi Vitest yang tidak kompatibel. Penulis terlindungi memindai dan memangkas cache yang dipulihkan menjadi 75% setelah ukurannya melampaui 2 GiB. Vitest membuat hash dari id modul, konten sumber, lingkungan, dan konfigurasi transformasi yang di-resolve, sehingga perubahan sebagian sumber biasa mempertahankan entri yang tidak berubah tetap hangat, sedangkan modul yang berubah mengalami cache miss dengan aman. Prefiks pemulihan kasar menjembatani proses workflow; LRU cache Actions normal dan pengusiran karena tidak aktif membatasi arsip immutable lama.
- Tugas Linux Node tepercaya juga mengikat store pnpm dan `node_modules` dari satu disk dependensi terlindungi untuk setiap lini Node yang didukung. Manifes paket, pengaturan instalasi, platform runner, dan patch Node yang persis tidak disertakan dalam kunci disk; sidik jari runtime dan input instalasi yang persis menentukan apakah tugas menggunakan kembali pohon tersebut atau menginstal ulang dan menyegarkan disk yang sama. Manifes dikanonisasi sebelum dibuat hash. Hook root langsung yang diaudit hanya mempertahankan skrip siklus hidup instalasi pnpm, sehingga perubahan pemformatan dan skrip pengujian/build biasa mempertahankan pohon dependensi tetap hangat; pergeseran hook siklus hidup yang belum diaudit gagal secara tertutup sampai input sumbernya bergabung dengan kontrak sidik jari. Perubahan dependensi, pengelola paket, sumber hook, dan lockfile selalu membatalkan snapshot. Sidik jari yang cocok diperlukan tetapi tidak cukup: penyiapan juga memeriksa arsip importer dan checksum manifes, lalu memverifikasi bahwa dependensi lockfile berbasis registry yang dipertahankan oleh postinstall cocok dengan manifes paket yang di-resolve Node dari importer-nya. Konten importer yang hilang atau usang kembali ke instalasi baru alih-alih menyajikan hoist root. Pull request yang snapshot baca-sajanya tidak dapat digunakan akan melepaskan ikatan workspace dan menginstal ke penyimpanan lokal runner, sehingga menghindari penulisan lambat ke klona yang tidak dapat dipublikasikannya. Instalasi dingin sticky menonaktifkan percobaan ulang pengambilan internal pnpm dan melakukan hingga tiga upaya instalasi penuh terbatas dari store yang secara bertahap menghangat; timeout tetap dianggap sebagai kegagalan. Setelah pemulihan yang kontennya tervalidasi atau instalasi frozen-lockfile, penyiapan menonaktifkan pemeriksaan dependensi pra-proses pnpm yang redundan: repositori sengaja memangkas `node_modules` lokal Plugin, yang jika tidak dipangkas akan dianggap usang oleh pnpm dan diperbaiki melalui instalasi implisit serentak yang tidak aman selama fanout shard. Preflight main kanonis adalah satu-satunya penulis dan mengukur store pada setiap penyegaran, menjalankan `pnpm store prune` hanya setelah versi paket yang dipensiunkan mendorong ukurannya melampaui 8 GiB. Publikasi snapshot Blacksmith bersifat asinkron bahkan setelah tugas penulis selesai, sehingga proses pertama setelah kunci atau sidik jari baru dapat tetap dingin; pemulihan penanda persis yang kontennya tervalidasi pada proses berikutnya menjadi bukti peluncuran. Tugas CI wajib dan pull request mendapatkan klona sekali pakai, sehingga perubahan dependensi tidak membuat disk baru, snapshot yang bersaing, atau penguncian cache yang dapat membatalkan build.
- Tugas shard Node dan artefak hasil build juga memulihkan cache kompilasi portabel pada disk milik Node melalui cache Actions immutable. Namespace `test` dan `build` yang independen mencegah penulisnya mengganti arsip satu sama lain: warmer pengujian terjadwal memiliki seed pengujian terlindungi, sedangkan `build-artifacts` dapat memublikasikan paling banyak satu arsip build terlindungi per hari UTC dari push `main` tepercaya. PR dan tugas pengujian biasa hanya membaca snapshot terlindungi, sehingga bytecode branch fitur tidak pernah memasuki seed bersama dan lalu lintas PR tidak membuat arsip cache. Ini menggunakan kembali bytecode V8 untuk orkestrasi yang dimuat Node, tooling build, dan dependensi eksternal di berbagai jalur checkout, termasuk ketika hanya sebagian grafik sumber yang berubah. Proses anak Vitest menonaktifkan cache kompilasi warisan karena cakupan dapat diaktifkan di dalam konfigurasi dinamis dan cakupan V8 dapat kehilangan presisi posisi sumber saat skrip dideserialisasi dari bytecode.
- Tugas artefak hasil build juga mempertahankan output langkah `build-all` dengan sidik jari konten. Deklarasi SDK Plugin yang dibangun sendiri oleh CI membuat hash atas grafik sumber TypeScript/JSON lengkap milik repositori, mengecualikan direktori terinstal dan yang dihasilkan, serta memulihkan deklarasi datar dan jembatan paket setelah `tsdown` menghapus `dist`. Perubahan dokumentasi, workflow, Plugin, dan perubahan lain di luar grafik tersebut dapat menggunakan kembali snapshot deklarasi; perubahan sumber membangunnya ulang sebelum gate ekspor berjalan.
- Build deklarasi lengkap membagi `tsdown` menjadi grup AI, paket workspace, dan terpadu. Setiap grup hanya menyimpan deklarasi dalam cache, lalu tetap membangun ulang JavaScript runtime sebelum memulihkan deklarasi tersebut. Karena itu, perubahan inti atau Plugin hanya membatalkan grafik terpadu yang besar, sedangkan perubahan paket workspace secara konservatif membatalkan setiap grup deklarasi dependen. Build lengkap publik umumnya menggunakan cache Actions immutable; kunci pemulihan kasar menjadi seed untuk perubahan sebagian, sidik jari konten per grup menolak data usang, dan kuota cache GitHub menggusur generasi lama. Sebagai gantinya, lane Node 22 mingguan memublikasikan artefak 14 hari setelah proses `main` berhasil dan hanya memulihkan artefak yang identitas produsen immutable-nya di-resolve ke workflow tersebut pada `main`, sehingga menghindari pergantian kuota tanpa memungkinkan kode PR menulis cache bersama. Deklarasi QA privat tidak pernah dipertahankan dalam cache Actions karena namespace cache bukan batas kerahasiaan.
- `check-additional-*` membagi daftar pelindung batas tambahan (`scripts/run-additional-boundary-checks.mjs`) menjadi satu shard berat-prompt (`check-additional-boundaries-a`, yang mencakup pemeriksaan pergeseran snapshot prompt Codex) dan satu shard gabungan untuk bagian yang tersisa (`check-additional-boundaries-bcd`), masing-masing menjalankan pelindung independen secara bersamaan dan mencetak waktu per pemeriksaan. Pekerjaan kompilasi/canary batas paket tetap dikelompokkan, dan arsitektur topologi runtime dijalankan terpisah dari cakupan pemantauan Gateway yang disematkan dalam `build-artifacts`.
- Pada runner build self-hosted 32-vCPU, pemantauan Gateway, pengujian channel, dan shard batas dukungan inti dimulai bersama-sama di dalam `build-artifacts` setelah `dist/` dan `dist-runtime/` selesai dibangun. Proses fallback yang di-host GitHub mempertahankan pemantauan Gateway secara serial agar perebutan sumber daya inti yang rendah tidak menghabiskan tenggat kesiapan.

Setelah diterima, Pipeline CI Linux kanonis mengizinkan hingga 28 tugas pengujian Node berjalan bersamaan dan
12 untuk lane cepat/pemeriksaan yang lebih kecil; Windows dan Android tetap pada dua karena
kumpulan runner tersebut lebih terbatas. Batch seluruh konfigurasi yang ringkas dijalankan dengan
timeout batch 120 menit, sedangkan grup pola penyertaan berbagi anggaran tugas terbatas yang sama.

Pipeline CI Android menjalankan `testPlayDebugUnitTest` dan `testThirdPartyDebugUnitTest`, lalu membangun APK debug Play. Flavor pihak ketiga tidak memiliki source set atau manifes terpisah; lane pengujian unitnya tetap mengompilasi flavor dengan flag BuildConfig SMS/log panggilan, sekaligus menghindari tugas pengemasan APK debug duplikat pada setiap push yang relevan dengan Android. Setiap tugas Gradle saat ini memiliki satu disk sticky terlindungi; tugas PR menggunakan klona sekali pakai, sedangkan proses terlindungi menyegarkan entri Gradle beralamat konten di tempat.

Kunci sticky-disk Blacksmith sengaja dibatasi berdasarkan dimensi runtime atau tugas yang didukung, tidak pernah berdasarkan nomor PR, commit, proses, branch, atau hash dependensi. Cache transformasi dan kompilasi runtime menggunakan cache Actions alih-alih disk sticky karena arsip immutable memberikan hasil pemulihan/penyimpanan yang dapat diverifikasi dan menghindari kegagalan promosi snapshot yang dapat berubah. Setelah migrasi versi kunci sticky, tambahkan hanya identitas kunci, arsitektur, dan region usang yang persis ke `.github/retired-sticky-disks.json`, dispatch `Sticky Disk Cleanup` dari `main` dengan dimensi dan konfirmasi yang sama, verifikasi penghapusan, lalu hapus entri tersebut. Workflow merutekan identitas ARM ke runner ARM, menolak ketidakcocokan region runner, menggunakan tindakan penghapusan kunci persis milik Blacksmith, dan tidak pernah menghapus cache builder Docker atau prefiks wildcard. Arsip cache Actions menggunakan LRU normal dan pengusiran karena tidak aktif.

Shard `check-dependencies` menjalankan pemeriksaan dependensi, file tidak terpakai, dan ekspor tidak terpakai Knip produksi. Pelindung file tidak terpakai gagal ketika PR menambahkan file tidak terpakai baru yang belum direview atau menyisakan entri daftar izin yang usang, sekaligus mempertahankan permukaan Plugin dinamis, hasil generasi, build, pengujian live, dan jembatan paket yang disengaja yang tidak dapat di-resolve Knip secara statis. Pelindung ekspor tidak terpakai mengecualikan file dukungan pengujian dan gagal pada setiap ekspor produksi yang tidak terpakai; konsumen dinamis yang disengaja harus dimodelkan dalam `config/knip.config.ts`. Target historis menjalankan pelindung ekspor ketika menyediakannya dan tetap menggunakan fallback kode mati lamanya jika tidak.

## Penerusan aktivitas ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` adalah jembatan sisi target dari aktivitas repositori OpenClaw ke ClawSweeper. Alur ini tidak melakukan checkout atau mengeksekusi kode pull request yang tidak tepercaya. Alur kerja membuat token GitHub App dari `CLAWSWEEPER_APP_PRIVATE_KEY`, lalu mengirim payload ringkas `repository_dispatch` ke `openclaw/clawsweeper`.

Alur kerja memiliki empat jalur:

- `clawsweeper_item` untuk permintaan review issue dan pull request yang spesifik;
- `clawsweeper_comment` untuk perintah ClawSweeper eksplisit dalam komentar issue;
- `clawsweeper_commit_review` untuk permintaan review tingkat commit pada push `main`;
- `github_activity` untuk aktivitas GitHub umum yang dapat diperiksa oleh agen ClawSweeper.

Jalur `github_activity` hanya meneruskan metadata yang dinormalisasi: jenis peristiwa, tindakan, pelaku, repositori, nomor item, URL, judul, status, dan kutipan singkat untuk komentar atau review jika tersedia. Jalur ini sengaja menghindari penerusan seluruh isi webhook. Alur kerja penerima di `openclaw/clawsweeper` adalah `.github/workflows/github-activity.yml`, yang memposting peristiwa yang dinormalisasi ke hook OpenClaw Gateway untuk agen ClawSweeper.

Aktivitas umum merupakan pengamatan, bukan pengiriman secara default. Agen ClawSweeper menerima target Discord dalam prompt-nya dan hanya boleh memposting ke `#clawsweeper` ketika peristiwa tersebut mengejutkan, dapat ditindaklanjuti, berisiko, atau berguna secara operasional. Pembukaan rutin, pengeditan, aktivitas bot yang tidak perlu, derau webhook duplikat, dan lalu lintas review normal harus menghasilkan `NO_REPLY`.

Perlakukan judul, komentar, isi, teks review, nama branch, dan pesan commit GitHub sebagai data yang tidak tepercaya di sepanjang jalur ini. Semua itu merupakan masukan untuk peringkasan dan triase, bukan instruksi bagi alur kerja atau runtime agen.

## Pengiriman manual

Pengiriman Pipeline CI manual menjalankan grafik pekerjaan yang sama seperti Pipeline CI normal, tetapi mengaktifkan secara paksa setiap jalur tercakup non-Android: shard Node Linux, shard plugin bawaan, shard kontrak plugin dan channel, kompatibilitas Node 22, `check-*`, `check-additional-*`, pemeriksaan smoke artefak hasil build, pemeriksaan dokumentasi, Skills Python, Windows, macOS, build iOS, serta i18n Control UI/aplikasi native. PR sumber otomatis memverifikasi inventaris ekstraksi native dan keamanan lokalisasi Android/Apple tanpa mengharuskan keluaran terjemahan atau keluaran yang dihasilkan platform tersedia dalam PR yang sama. Alur kerja Native App Locale Refresh yang diserialkan membangun ulang artefak tersebut dalam satu PR terisolasi dan mengaktifkan penggabungan otomatis exact-head setelah pemeriksaan wajib lulus. Paritas native penuh tetap menjadi persyaratan pemblokir bagi PR artefak yang dihasilkan, Pipeline CI manual, Full Release Validation, dan persiapan rilis. Paritas locale Control UI tetap bersifat saran pada PR otomatis dan proses `main`, serta menjadi persyaratan pemblokir pada Pipeline CI manual/rilis. Pengiriman Pipeline CI manual mandiri hanya menjalankan Android dengan `include_android=true` (masukan `release_gate` juga mengaktifkan Android secara paksa); payung rilis penuh mengaktifkan Android dengan meneruskan `include_android=true`. Pemeriksaan statis prarilis plugin, shard khusus rilis `agentic-plugins`, sapuan batch ekstensi penuh, dan jalur Docker prarilis plugin dikecualikan dari Pipeline CI. Rangkaian prarilis Docker hanya berjalan ketika `Full Release Validation` mengirim alur kerja `Plugin Prerelease` yang terpisah dengan gerbang validasi rilis diaktifkan.

Pemeriksaan baris maksimum PR memperoleh baseline dari pohon penggabungan sintetis yang telah di-checkout dan memverifikasi parent head-nya terhadap head peristiwa. Proses manual menggunakan grup konkurensi unik agar rangkaian lengkap kandidat rilis tidak dibatalkan oleh proses push atau PR lain pada ref yang sama. Masukan opsional `target_ref` memungkinkan pemanggil tepercaya menjalankan grafik tersebut terhadap branch, tag, atau SHA commit lengkap, sembari menggunakan berkas alur kerja dari ref pengiriman yang dipilih; baseline baris maksimum dibandingkan dengan merge base target terhadap head branch default yang ditetapkan untuk proses tersebut. Masukan `release_gate` merupakan fallback pengelola exact-SHA untuk Pipeline CI PR yang terhambat kapasitas: masukan ini mengharuskan `target_ref` berupa SHA commit lengkap yang cocok dengan head branch yang dikirim dan `pull_request_number` mengidentifikasi PR terbuka yang pohon penggabungannya divalidasi.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

Jalur extended-stable bulanan khusus npm merupakan pengecualian: kirim prapemeriksaan `OpenClaw NPM
Release` dan `Full Release Validation` dari branch
`extended-stable/YYYY.M.33` yang tepat, pertahankan ID proses keduanya, dan teruskan kedua ID tersebut ke
proses publikasi npm langsung. Lihat [Publikasi extended-stable bulanan khusus
npm](/id/reference/RELEASING#monthly-npm-only-extended-stable-publication) untuk
perintah, persyaratan identitas yang tepat, pembacaan balik registry, dan prosedur
perbaikan pemilih. Jalur ini tidak mengirim publikasi plugin, macOS, Windows, GitHub
Release, dist-tag privat, atau platform lainnya.

## Runner

| Runner                          | Pekerjaan                                                                                                                                                                                                                                                                              |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | `security-fast`, pengiriman Pipeline CI manual dan fallback repositori nonkanonis, agregat QA Smoke, pemindaian keamanan dan kualitas CodeQL, pemeriksaan kewajaran alur kerja, pelabel, respons otomatis, alur kerja Docs mandiri, dan seluruh alur kerja Install Smoke                                |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `pnpm-store-warmup`, `native-i18n`, `checks-fast-core` kecuali Pipeline CI QA Smoke, shard kontrak plugin/channel, sebagian besar shard Node Linux bawaan/berbeban ringan, jalur `check-*` kecuali `check-lint`, shard `check-additional-*` terpilih, `check-docs`, dan `skills-python` |
| `blacksmith-8vcpu-ubuntu-2404`  | Rangkaian Node Linux berat yang dipertahankan, shard `check-additional-*` yang banyak melibatkan batas/ekstensi, dan `android`                                                                                                                                                                             |
| `blacksmith-16vcpu-ubuntu-2404` | Shard Pipeline CI QA Smoke otomatis, `build-artifacts` dalam Pipeline CI dan Testbox, serta `check-lint` (cukup sensitif terhadap CPU sehingga 8 vCPU memerlukan biaya lebih besar daripada penghematannya)                                                                                                                                  |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                  |
| `blacksmith-6vcpu-macos-15`     | `macos-node` pada `openclaw/openclaw`; fork menggunakan fallback `macos-15`                                                                                                                                                                                                                |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` dan `ios-build` pada `openclaw/openclaw`; fork menggunakan fallback `macos-26`                                                                                                                                                                                               |

## Anggaran pendaftaran runner

Bucket pendaftaran runner GitHub OpenClaw saat ini melaporkan 10.000 pendaftaran
runner yang dihosting sendiri per 5 menit dalam `ghx api rate_limit`. Periksa kembali
`actions_runner_registration` sebelum setiap tahap penyetelan karena GitHub dapat mengubah
bucket ini. Batas tersebut digunakan bersama oleh semua pendaftaran runner Blacksmith dalam
organisasi `openclaw`, sehingga menambahkan instalasi Blacksmith lain tidak menambahkan
bucket baru.

Perlakukan label Blacksmith sebagai sumber daya langka untuk pengendalian lonjakan. Pekerjaan yang
hanya melakukan perutean, pemberitahuan, peringkasan, pemilihan shard, atau pemindaian singkat CodeQL harus
tetap menggunakan runner yang dihosting GitHub, kecuali pekerjaan tersebut memiliki kebutuhan khusus
Blacksmith yang telah diukur. Setiap matriks Blacksmith baru, `max-parallel` yang lebih besar, atau alur kerja
berfrekuensi tinggi harus menunjukkan jumlah pendaftaran terburuknya dan menjaga target tingkat
organisasi di bawah sekitar 60% dari bucket aktif. Dengan bucket 10.000 pendaftaran
saat ini, itu berarti target operasi 6.000 pendaftaran, yang menyisakan ruang untuk
repositori serentak, percobaan ulang, dan tumpang tindih lonjakan.

Rencana PR changed-target mengurangi lonjakan pengujian Node yang umum dari 14 pendaftaran Blacksmith menjadi satu. PR berisiko luas mempertahankan fallback ringkas dengan 14 pendaftaran, sehingga kasus terburuk tidak meningkat.

Pipeline CI repositori kanonis mempertahankan Blacksmith sebagai jalur runner default untuk proses push dan pull request normal. `workflow_dispatch` dan proses repositori nonkanonis menggunakan runner yang dihosting GitHub, tetapi proses kanonis normal saat ini tidak memeriksa kesehatan antrean Blacksmith atau secara otomatis beralih ke label yang dihosting GitHub ketika Blacksmith tidak tersedia.

## Padanan lokal

```bash
pnpm changed:lanes                            # periksa pengklasifikasi jalur perubahan lokal untuk origin/main...HEAD
pnpm check:changed                            # gerbang pemeriksaan lokal cerdas: pemformatan/typecheck/lint/penjaga yang berubah berdasarkan jalur batas
pnpm check                                    # gerbang lokal cepat: tsgo produksi + lint terbagi dalam shard + penjaga cepat paralel
pnpm check:test-types
pnpm check:timed                              # gerbang yang sama dengan pengaturan waktu per tahap
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1 node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts
pnpm test                                     # pengujian vitest
pnpm test:changed                             # target Vitest perubahan cerdas yang ringan
pnpm test:ui                                  # rangkaian unit/browser Control UI
pnpm ui:i18n:check                            # paritas locale Control UI yang dihasilkan (gerbang rilis)
pnpm native:i18n:baseline                     # perbarui inventaris ekstraksi native yang dimiliki sumber
pnpm native:i18n:verify                       # inventaris sumber + keamanan lokalisasi Android/Apple
pnpm native:i18n:check                        # paritas terjemahan/hasil platform yang ketat (gerbang rilis)
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # format dokumentasi + lint + tautan rusak
pnpm build                                    # build dist ketika pemeriksaan artefak/smoke Pipeline CI penting
pnpm ios:build                                # hasilkan dan build proyek aplikasi iOS
pnpm ci:timings                               # rangkum proses Pipeline CI push origin/main terbaru
pnpm ci:timings:recent                        # bandingkan proses Pipeline CI main terbaru yang berhasil
node scripts/ci-run-timings.mjs <run-id>      # rangkum waktu keseluruhan, waktu antrean, dan pekerjaan paling lambat
node scripts/ci-run-timings.mjs --latest-main # abaikan derau issue/komentar dan pilih Pipeline CI push origin/main
node scripts/ci-run-timings.mjs --recent 10   # bandingkan proses Pipeline CI main terbaru yang berhasil
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
pnpm test:startup:memory
pnpm test:extensions:memory -- --json .artifacts/openclaw-performance/source/mock-provider/extension-memory.json
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## Performa OpenClaw

`OpenClaw Performance` adalah alur kerja performa produk/runtime. Alur ini berjalan setiap hari pada `main` dan dapat dikirim secara manual:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Dispatch manual biasanya melakukan benchmark terhadap ref alur kerja. Atur `target_ref` untuk melakukan benchmark terhadap tag rilis atau cabang lain dengan implementasi alur kerja saat ini. Jalur laporan yang dipublikasikan dan penunjuk terbaru dikunci berdasarkan ref yang diuji, dan setiap `index.md` mencatat ref/SHA yang diuji, ref/SHA alur kerja, ref Kova, profil, mode autentikasi lane, model, jumlah pengulangan, dan filter skenario.

Alur kerja menginstal OCM dari rilis yang disematkan dan Kova dari `openclaw/Kova` pada input `kova_ref` yang disematkan, lalu menjalankan tiga lane:

- `mock-provider`: skenario diagnostik Kova terhadap runtime build lokal dengan autentikasi kompatibel OpenAI palsu yang deterministik.
- `mock-deep-profile`: pembuatan profil CPU/heap/trace untuk titik panas saat startup, Gateway, dan giliran agen. Berjalan sesuai jadwal, atau saat dispatch dengan `deep_profile=true`.
- `live-openai-candidate`: giliran agen `openai/gpt-5.6-luna` OpenAI yang nyata, dilewati saat `OPENAI_API_KEY` tidak tersedia. Berjalan sesuai jadwal, atau saat dispatch dengan `live_openai_candidate=true`.

Lane penyedia tiruan juga menjalankan probe sumber native OpenClaw setelah tahapan Kova: waktu boot dan memori Gateway pada kasus startup default, channel yang dilewati, hook internal, dan lima puluh Plugin; RSS impor Plugin bawaan, loop sapaan `channel-chat-baseline` OpenAI tiruan berulang, perintah startup CLI terhadap Gateway yang telah di-boot, serta probe performa smoke status SQLite. Saat laporan sumber penyedia tiruan yang dipublikasikan sebelumnya tersedia untuk ref yang diuji, ringkasan sumber membandingkan nilai RSS dan heap saat ini terhadap baseline tersebut serta menandai peningkatan RSS yang besar sebagai `watch`. Ringkasan Markdown probe sumber berada di `source/index.md` dalam bundel laporan, dengan JSON mentah di sampingnya.

Setiap lane mengunggah artefak GitHub lengkapnya, termasuk bundel CPU, heap, trace, dan diagnostik terkompresi. Job penerbit terpisah mengunduh dan memvalidasi artefak tersebut, lalu membuat token GitHub App ClawSweeper berumur pendek yang cakupannya hanya untuk konten `openclaw/clawgrit-reports` dan meneruskannya hanya ke langkah Git push. Job ini melakukan commit terhadap `report.json`, `report.md`, `index.md`, artefak probe sumber, serta metadata/checksum bundel di bawah `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`; arsip diagnostik lengkap tetap berada di artefak Actions yang ditautkan. Penerbit menolak berkas laporan apa pun yang melebihi 50 MB sebelum mencoba melakukan push. Penunjuk ref yang saat ini diuji adalah `openclaw-performance/<tested-ref>/latest-<lane>.json`. Eksekusi terjadwal dan dispatch `profile=release` gagal jika pembuatan token aplikasi atau publikasi laporan gagal. Dispatch nonrilis manual mempertahankan publikasi sebagai advisori dan menyimpan artefak GitHub saat autentikasi atau publikasi gagal. Baseline sumber sebelumnya diambil secara anonim dari repositori laporan publik, sehingga pengambilan baseline yang berhasil tidak membuktikan autentikasi penerbit.

## Validasi Rilis Lengkap

`Full Release Validation` adalah alur kerja payung manual untuk "menjalankan semuanya sebelum rilis". Alur kerja ini menerima cabang, tag, atau SHA commit lengkap, melakukan dispatch alur kerja `CI` manual dengan target tersebut (termasuk Android), melakukan dispatch `Plugin Prerelease` untuk pembuktian Plugin/paket/statis/Docker khusus rilis, melakukan dispatch `OpenClaw Performance` terhadap SHA target, dan melakukan dispatch `OpenClaw Release Checks` untuk smoke instalasi, penerimaan paket, pemeriksaan paket lintas OS, paritas QA Lab, Matrix, Telegram, serta lane Discord, WhatsApp, dan Slack yang dibatasi (rendering kartu skor kematangan advisori bersifat opt-in melalui `run_maturity_scorecard`). Profil stabil dan lengkap selalu menyertakan cakupan soak jalur rilis live/E2E dan Docker yang menyeluruh; profil beta dapat mengaktifkannya dengan `run_release_soak=true`. E2E Telegram paket kanonis berjalan di dalam Penerimaan Paket, sehingga kandidat lengkap tidak memulai poller live duplikat. Setelah publikasi, teruskan `release_package_spec` untuk menggunakan kembali paket npm yang telah dirilis pada pemeriksaan rilis, Penerimaan Paket, Docker, lintas OS, dan Telegram tanpa melakukan build ulang. Gunakan `npm_telegram_package_spec` hanya untuk menjalankan ulang Telegram paket yang telah dipublikasikan secara terfokus. Lane paket live Plugin Codex menggunakan status terpilih yang sama secara default: `release_package_spec=openclaw@<tag>` yang dipublikasikan menghasilkan `codex_plugin_spec=npm:@openclaw/codex@<tag>`, sedangkan eksekusi SHA/artefak mengemas `extensions/codex` dari ref terpilih. Atur `codex_plugin_spec` secara eksplisit untuk sumber Plugin khusus seperti spesifikasi `npm:`, `npm-pack:`, atau `git:`. Pembuktian agen live-nya mengirimkan progres yang terlihat, melanjutkan melalui pembacaan ruang kerja acak dan penulisan artefak yang tepat, lalu mengirimkan penyelesaian.

Lihat [Validasi rilis lengkap](/id/reference/full-release-validation) untuk
matriks tahap, nama job alur kerja yang tepat, perbedaan profil, artefak, dan
handle eksekusi ulang terfokus.

`OpenClaw Release Publish` adalah alur kerja rilis manual yang melakukan mutasi. Lakukan dispatch
publikasi beta dan stabil reguler dari `main` tepercaya setelah tag rilis
tersedia dan setelah preflight npm OpenClaw berhasil (preflight menjalankan
`pnpm plugins:sync:check` di antara pemeriksaannya). Tag tetap memilih commit
rilis yang tepat, termasuk commit pada `release/YYYY.M.PATCH`; publikasi alfa Tideclaw
tetap menggunakan cabang alfa yang sesuai. Alur kerja ini memerlukan
`preflight_run_id` yang tersimpan dan
`full_release_validation_run_id` yang berhasil beserta
`full_release_validation_run_attempt` yang tepat, melakukan dispatch `Plugin NPM Release` untuk semua
paket Plugin yang dapat dipublikasikan, melakukan dispatch `Plugin ClawHub Release` untuk
SHA rilis yang sama, dan baru setelah itu melakukan dispatch `OpenClaw NPM Release`. Publikasi stabil juga
memerlukan `windows_node_tag` yang tepat; alur kerja memverifikasi rilis sumber Windows
dan membandingkan penginstal x64/ARM64-nya dengan input
`windows_node_installer_digests` yang disetujui kandidat sebelum child publikasi apa pun, lalu mempromosikan
dan memverifikasi digest penginstal tersemat yang sama beserta kontrak aset pendamping
dan checksum yang tepat sebelum memublikasikan draf rilis GitHub.
Perbaikan terfokus khusus Plugin menggunakan `plugin_publish_scope=selected` dengan
daftar paket yang tidak kosong. Eksekusi `all-publishable` khusus Plugin memerlukan preflight npm
yang tidak dapat diubah dan bukti Validasi Rilis Lengkap yang sama seperti publikasi inti.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref main \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f full_release_validation_run_attempt=<successful-full-release-validation-run-attempt> \
  -f npm_dist_tag=beta
```

Untuk pembuktian commit tersemat pada cabang yang bergerak cepat, gunakan helper alih-alih
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Ref dispatch alur kerja GitHub harus berupa cabang atau tag, bukan SHA commit mentah. Helper
mendorong cabang `release-ci/<sha>-...` sementara pada SHA alur kerja `main`
tepercaya, meneruskan SHA target yang diminta melalui input `ref` alur kerja,
menggunakan kembali bukti target tepat yang ketat saat tersedia, memverifikasi setiap
`headSha` alur kerja child cocok dengan SHA alur kerja tepercaya, dan menghapus cabang
sementara saat eksekusi selesai. Teruskan `-f reuse_evidence=false` untuk memaksa
validasi baru. Verifikator payung juga gagal jika ada alur kerja child yang berjalan pada
SHA alur kerja berbeda.

`release_profile` mengontrol keluasan live/penyedia yang diteruskan ke pemeriksaan rilis.
Alur kerja rilis manual menggunakan `stable` secara default; gunakan `full` hanya saat Anda
sengaja menginginkan matriks penyedia/media advisori yang luas. Pemeriksaan rilis stabil dan lengkap
selalu menjalankan soak jalur rilis live/E2E dan Docker yang menyeluruh;
profil beta dapat mengaktifkannya dengan `run_release_soak=true`.

- `beta` mempertahankan lane OpenAI/inti kritis-rilis yang paling cepat.
- `stable` menambahkan kumpulan penyedia/backend stabil.
- `full` menjalankan matriks penyedia/media advisori yang luas.

Payung mencatat id eksekusi child yang didispatch, dan job akhir `Verify full validation` memeriksa ulang kesimpulan eksekusi child saat ini serta menambahkan tabel job paling lambat untuk setiap eksekusi child. Jika alur kerja child dijalankan ulang dan menjadi hijau, jalankan ulang hanya job verifikator induk untuk memperbarui hasil payung dan ringkasan waktu.

Untuk pemulihan, `Full Release Validation` dan `OpenClaw Release Checks` menerima `rerun_group`. Gunakan `all` untuk kandidat rilis, `ci` hanya untuk child CI lengkap normal, `plugin-prerelease` hanya untuk child prarilis Plugin, `performance` hanya untuk child Performa OpenClaw, `release-checks` untuk setiap child rilis, atau grup yang lebih sempit: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, atau `npm-telegram` pada payung. Ini menjaga agar eksekusi ulang kotak rilis yang gagal tetap terbatas setelah perbaikan terfokus. Untuk satu lane lintas OS yang gagal, gabungkan `rerun_group=cross-os` dengan `cross_os_suite_filter`, misalnya `windows/packaged-upgrade`; perintah lintas OS yang panjang memancarkan baris Heartbeat dan ringkasan peningkatan paket menyertakan waktu per fase. Lane QA Matrix dan Telegram terpilih memblokir validasi rilis normal, demikian pula gerbang cakupan alat runtime standar. Paritas QA, paritas runtime, serta lane live Discord, WhatsApp, dan Slack yang dibatasi bersifat advisori.

`OpenClaw Release Checks` menggunakan ref alur kerja tepercaya untuk menyelesaikan ref terpilih satu kali menjadi tarball `release-package-under-test`, lalu meneruskan artefak tersebut ke pemeriksaan lintas OS dan Penerimaan Paket, serta alur kerja Docker jalur rilis live/E2E saat cakupan soak berjalan. Ini menjaga konsistensi byte paket di seluruh kotak rilis dan menghindari pengemasan ulang kandidat yang sama di beberapa job child. Untuk lane live Plugin npm Codex, pemeriksaan rilis meneruskan spesifikasi Plugin terpublikasi yang cocok dan diturunkan dari `release_package_spec`, meneruskan `codex_plugin_spec` yang diberikan operator, atau membiarkan input kosong agar skrip Docker mengemas Plugin Codex dari checkout terpilih.

Eksekusi `Full Release Validation` duplikat untuk `ref=main` dan `rerun_group=all`
menggantikan payung yang lebih lama. Monitor induk membatalkan setiap alur kerja child yang
telah didispatch saat induk dibatalkan, sehingga validasi main yang lebih baru
tidak tertahan di belakang eksekusi pemeriksaan rilis dua jam yang usang. Validasi cabang/tag
rilis dan grup eksekusi ulang terfokus mempertahankan `cancel-in-progress: false`.

## Shard Live dan E2E

Child live/E2E rilis mempertahankan cakupan native `pnpm test:live` yang luas, tetapi menjalankannya sebagai shard bernama melalui `scripts/test-live-shard.mjs`, bukan satu job serial:

- `native-live-src-agents` dan `native-live-src-agents-zai-coding`
- `native-live-src-gateway-core`
- job `native-live-src-gateway-profiles` yang difilter berdasarkan penyedia
- `native-live-src-gateway-backends`
- `native-live-src-infra`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-moonshot`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- shard audio/video media terpisah dan shard musik yang difilter berdasarkan penyedia

Ini mempertahankan cakupan berkas yang sama sekaligus membuat kegagalan penyedia live yang lambat lebih mudah dijalankan ulang dan didiagnosis. Nama shard agregat `native-live-src-gateway`, `native-live-extensions-o-z`, `native-live-extensions-media`, dan `native-live-extensions-media-music` tetap valid untuk eksekusi ulang manual sekali jalan.

Shard media live native berjalan dalam `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, yang dibuat oleh alur kerja `Live Media Runner Image`. Image tersebut telah menginstal `ffmpeg` dan `ffprobe` sebelumnya; job media hanya memverifikasi biner sebelum penyiapan. Pertahankan suite live berbasis Docker pada runner Blacksmith normal — job container bukan tempat yang tepat untuk menjalankan pengujian Docker bertingkat.

Shard model/backend langsung berbasis Docker menggunakan image bersama `ghcr.io/openclaw/openclaw-live-test:<sha>-<extensions>` yang terpisah untuk setiap commit yang dipilih. Alur kerja rilis langsung membangun dan mendorong image tersebut satu kali, lalu shard model langsung Docker, Gateway yang dibagi berdasarkan penyedia, backend CLI, pengikatan ACP, dan harness Codex berjalan dengan `OPENCLAW_SKIP_DOCKER_BUILD=1`. Shard Gateway Docker membawa batas `timeout` eksplisit pada tingkat skrip yang berada di bawah batas waktu tugas alur kerja agar kontainer yang macet atau jalur pembersihan cepat gagal alih-alih menghabiskan seluruh anggaran pemeriksaan rilis. Jika shard tersebut membangun ulang target Docker sumber lengkap secara terpisah, proses rilis salah dikonfigurasi dan akan membuang waktu aktual untuk pembangunan image duplikat.

## Penerimaan Paket

Gunakan `Package Acceptance` ketika pertanyaannya adalah "apakah paket OpenClaw yang dapat diinstal ini berfungsi sebagai produk?" Ini berbeda dari CI normal: CI normal memvalidasi pohon sumber, sedangkan penerimaan paket memvalidasi satu tarball melalui harness E2E Docker yang sama dengan yang digunakan pengguna setelah menginstal atau memperbarui.

### Tugas

1. `resolve_package` melakukan checkout `workflow_ref`, menentukan satu kandidat paket, menulis `.artifacts/docker-e2e-package/openclaw-current.tgz`, menulis `.artifacts/docker-e2e-package/package-candidate.json`, mengunggah keduanya sebagai artefak `package-under-test`, serta mencetak sumber, referensi alur kerja, referensi paket, versi, SHA-256, dan profil dalam ringkasan langkah GitHub.
2. `package_integrity` mengunduh artefak `package-under-test` dan memberlakukan kontrak tarball paket publik dengan `scripts/check-openclaw-package-tarball.mjs`.
3. `docker_acceptance` memanggil `openclaw-live-and-e2e-checks-reusable.yml` dengan SHA sumber paket yang telah ditentukan (beralih ke `workflow_ref` jika tidak tersedia) dan `package_artifact_name=package-under-test`. Alur kerja yang dapat digunakan kembali mengunduh artefak tersebut, memvalidasi inventaris tarball, menyiapkan image Docker berbasis digest paket bila diperlukan, dan menjalankan jalur Docker yang dipilih terhadap paket tersebut alih-alih mengemas hasil checkout alur kerja. Ketika sebuah profil memilih beberapa `docker_lanes` yang ditargetkan, alur kerja yang dapat digunakan kembali menyiapkan paket dan image bersama satu kali, lalu menjalankan jalur-jalur tersebut secara paralel sebagai tugas Docker tertarget dengan artefak unik.
4. `package_telegram` secara opsional memanggil `NPM Telegram Beta E2E`. Ini berjalan ketika `telegram_mode` bukan `none` dan menginstal artefak `package-under-test` yang sama ketika Penerimaan Paket telah menentukannya; pemicu Telegram mandiri tetap dapat menginstal spesifikasi npm yang telah dipublikasikan.
5. `summary` menggagalkan alur kerja jika penentuan paket, integritas, penerimaan Docker, atau jalur Telegram opsional gagal. Input `advisory` menurunkan kegagalan penerimaan menjadi peringatan bagi pemanggil yang bersifat advisori.

### Sumber kandidat

- `source=npm` hanya menerima `openclaw@extended-stable`, `openclaw@beta`, `openclaw@latest`, atau versi rilis OpenClaw yang persis seperti `openclaw@2026.4.27-beta.2`. Gunakan ini untuk penerimaan extended-stable, prarilis, atau stabil yang telah dipublikasikan.
- `source=ref` mengemas cabang, tag, atau SHA commit lengkap `package_ref` yang tepercaya. Resolver mengambil cabang/tag OpenClaw, memverifikasi bahwa commit yang dipilih dapat dijangkau dari riwayat cabang repositori atau tag rilis, menginstal dependensi dalam worktree terpisah, dan mengemasnya dengan `scripts/package-openclaw-for-docker.mjs`.
- `source=url` mengunduh `.tgz` HTTPS publik; `package_sha256` wajib disediakan. Jalur ini menolak kredensial URL, port HTTPS nondefault, nama host atau IP hasil resolusi yang bersifat privat/internal/penggunaan khusus, serta pengalihan yang berada di luar kebijakan keamanan publik yang sama.
- `source=trusted-url` mengunduh `.tgz` HTTPS dari kebijakan sumber tepercaya bernama dalam `.github/package-trusted-sources.json`; `package_sha256` dan `trusted_source_id` wajib disediakan. Gunakan ini hanya untuk mirror perusahaan milik pengelola atau repositori paket privat yang memerlukan host, port, prefiks jalur, host pengalihan, atau resolusi jaringan privat yang dikonfigurasi. Jika kebijakan mendeklarasikan autentikasi bearer, alur kerja menggunakan rahasia tetap `OPENCLAW_TRUSTED_PACKAGE_TOKEN`; kredensial yang disematkan dalam URL tetap ditolak.
- `source=artifact` mengunduh satu `.tgz` dari `artifact_run_id` dan `artifact_name`; `package_sha256` bersifat opsional tetapi sebaiknya diberikan untuk artefak yang dibagikan secara eksternal.

Pisahkan `workflow_ref` dan `package_ref`. `workflow_ref` adalah kode alur kerja/harness tepercaya yang menjalankan pengujian. `package_ref` adalah commit sumber yang dikemas ketika `source=ref`. Ini memungkinkan harness pengujian saat ini memvalidasi commit sumber tepercaya yang lebih lama tanpa menjalankan logika alur kerja lama.

### Profil rangkaian pengujian

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `root-managed-vps-upgrade`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — kumpulan `package` dengan cakupan `plugins` langsung sebagai pengganti `plugins-offline`, ditambah `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — bagian-bagian lengkap jalur rilis Docker dengan OpenWebUI
- `custom` — `docker_lanes` persis; wajib ketika `suite_profile=custom`

Profil `package` menggunakan cakupan Plugin luring agar validasi paket yang dipublikasikan tidak bergantung pada ketersediaan langsung ClawHub. Jalur Telegram opsional menggunakan kembali artefak `package-under-test` dalam `NPM Telegram Beta E2E`, dengan jalur spesifikasi npm yang dipublikasikan tetap tersedia untuk pemicu mandiri.

Untuk kebijakan khusus pengujian pembaruan dan Plugin, termasuk perintah lokal,
jalur Docker, input Penerimaan Paket, nilai default rilis, dan triase kegagalan,
lihat [Menguji pembaruan dan Plugin](/id/help/testing-updates-plugins).

Pemeriksaan rilis memanggil Penerimaan Paket dengan `source=artifact`, artefak paket rilis yang telah disiapkan, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape'`, dan `telegram_mode=mock-openai`. Ini menjaga migrasi paket, pembaruan, instalasi Skills langsung dari ClawHub, pembersihan dependensi Plugin usang, perbaikan instalasi Plugin yang dikonfigurasi, Plugin luring, pembaruan Plugin, dan bukti Telegram pada tarball paket yang sama. Tetapkan `release_package_spec` pada Validasi Rilis Lengkap atau Pemeriksaan Rilis OpenClaw setelah memublikasikan beta untuk menjalankan matriks yang sama terhadap paket npm yang telah dirilis tanpa membangun ulang; tetapkan `package_acceptance_package_spec` hanya ketika Penerimaan Paket memerlukan paket yang berbeda dari bagian validasi rilis lainnya. Pemeriksaan rilis lintas OS tetap mencakup orientasi awal, penginstal, dan perilaku khusus platform; validasi produk paket/pembaruan sebaiknya dimulai dengan Penerimaan Paket.

Jalur Docker `published-upgrade-survivor` memvalidasi satu garis dasar paket yang dipublikasikan per proses dalam jalur rilis pemblokir. Dalam Penerimaan Paket, tarball `package-under-test` yang telah ditentukan selalu menjadi kandidat dan `published_upgrade_survivor_baseline` memilih garis dasar terpublikasi cadangan, dengan nilai default `openclaw@latest`; perintah untuk menjalankan ulang jalur yang gagal mempertahankan garis dasar tersebut. Validasi Rilis Lengkap dengan `run_release_soak=true` atau `release_profile=full` menetapkan `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` dan `published_upgrade_survivor_scenarios=reported-issues` untuk memperluas cakupan ke empat rilis npm stabil terbaru beserta rilis batas kompatibilitas Plugin yang dipatok dan fixture berbentuk isu untuk konfigurasi Feishu, file bootstrap/persona yang dipertahankan, instalasi Plugin OpenClaw yang dikonfigurasi, jalur log tilde, dan akar dependensi Plugin lama yang usang. Pilihan penyintas peningkatan terpublikasi dengan beberapa garis dasar dibagi berdasarkan garis dasar menjadi tugas runner Docker tertarget yang terpisah. Alur kerja `Update Migration` yang terpisah menggunakan jalur Docker `update-migration` dengan garis dasar `all-since-2026.4.23` dan skenario `plugin-deps-cleanup` ketika yang dipertanyakan adalah pembersihan pembaruan terpublikasi secara menyeluruh, bukan keluasan CI Rilis Lengkap normal. Proses agregat lokal dapat meneruskan spesifikasi paket persis dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, mempertahankan satu jalur dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` seperti `openclaw@2026.4.15`, atau menetapkan `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` untuk matriks skenario. Jalur terpublikasi mengonfigurasi garis dasar dengan resep perintah `openclaw config set` yang tertanam, mencatat langkah-langkah resep dalam `summary.json`, dan memeriksa `/healthz`, `/readyz`, serta status RPC setelah Gateway dimulai. Jalur baru paket dan penginstal Windows juga memverifikasi bahwa paket yang telah diinstal dapat mengimpor penggantian kontrol peramban dari jalur absolut Windows mentah. Smoke giliran agen OpenAI lintas OS menggunakan `OPENCLAW_CROSS_OS_OPENAI_MODEL` secara default ketika ditetapkan, atau `openai/gpt-5.6-luna` jika tidak, sehingga bukti instalasi dan Gateway menggunakan tingkat pengujian GPT-5.6 yang lebih murah.

### Jendela kompatibilitas lama

Penerimaan Paket memiliki jendela kompatibilitas lama yang terbatas untuk paket yang telah dipublikasikan. Paket hingga `2026.4.25`, termasuk `2026.4.25-beta.*`, dapat menggunakan jalur kompatibilitas:

- entri QA privat yang diketahui dalam `dist/postinstall-inventory.json` dapat menunjuk ke file yang tidak disertakan dalam tarball;
- `doctor-switch` dapat melewati subkasus persistensi `gateway install --wrapper` ketika paket tidak mengekspos flag tersebut;
- `update-channel-switch` dapat memangkas `patchedDependencies` pnpm yang hilang dari fixture git palsu yang diturunkan dari tarball dan dapat mencatat `update.channel` tersimpan yang hilang;
- smoke Plugin dapat membaca lokasi catatan instalasi lama atau menerima persistensi catatan instalasi marketplace yang hilang;
- `plugin-update` dapat mengizinkan migrasi metadata konfigurasi sambil tetap mewajibkan catatan instalasi dan perilaku tanpa instalasi ulang untuk tetap tidak berubah.

Paket `2026.4.26` yang dipublikasikan juga dapat memperingatkan tentang file stempel metadata build lokal yang sudah dirilis, dan paket hingga `2026.5.20` dapat memperingatkan alih-alih gagal ketika `npm-shrinkwrap.json` hilang. Paket berikutnya wajib memenuhi kontrak modern; kondisi yang sama akan gagal alih-alih memperingatkan atau dilewati.

### Contoh

```bash
# Validasi paket beta saat ini dengan cakupan tingkat produk.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai

# Validasi paket extended-stable yang dipublikasikan dengan cakupan paket.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@extended-stable \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# Kemas dan validasi cabang rilis dengan harness saat ini.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=ref \
  -f package_ref=release/YYYY.M.PATCH \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# Validasi URL tarball. SHA-256 wajib untuk source=url.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=url \
  -f package_url=https://example.com/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# Validasi tarball dari kebijakan mirror privat tepercaya bernama.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# Gunakan kembali tarball yang diunggah oleh proses Actions lain.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=package-under-test \
  -f suite_profile=custom \
  -f docker_lanes='install-e2e plugin-update'
```

Saat men-debug proses penerimaan paket yang gagal, mulai dari ringkasan `resolve_package` untuk mengonfirmasi sumber paket, versi, dan SHA-256. Kemudian periksa proses turunan `docker_acceptance` beserta artefak Docker-nya: `.artifacts/docker-tests/**/summary.json`, `failures.json`, log jalur, waktu setiap fase, dan perintah untuk menjalankan ulang. Utamakan menjalankan ulang profil paket yang gagal atau jalur Docker yang persis daripada menjalankan ulang validasi rilis lengkap.

## Smoke instalasi

Alur kerja `Install Smoke` tidak lagi berjalan pada pull request atau push `main`. Wrapper malam/manual dan validasi rilisnya sama-sama memanggil inti hanya-baca `install-smoke-reusable.yml`, dan setiap proses menjalankan jalur smoke instalasi lengkap pada runner yang dihosting GitHub:

- Image smoke Dockerfile root dibangun satu kali per SHA target, diikat ke revisi alur kerja dan percobaan produsen dalam artefak yang tidak dapat diubah, lalu dimuat oleh smoke CLI, smoke CLI penghapusan ruang kerja bersama agen, E2E jaringan Gateway kontainer, dan smoke build-arg plugin `matrix` yang dibundel. Smoke plugin memverifikasi pencerminan instalasi dependensi runtime dan bahwa plugin dimuat tanpa diagnostik keluarnya titik masuk.
- Instalasi paket QR dan smoke Docker penginstal/pembaruan (termasuk lane penginstal Rocky Linux dan lane pembaruan terhadap baseline npm `update_baseline_version` yang dapat dikonfigurasi) berjalan sebagai job terpisah agar pekerjaan penginstal tidak menunggu di belakang smoke image root.

Smoke penyedia image instalasi global Bun yang lambat dibatasi secara terpisah oleh `run_bun_global_install_smoke`. Smoke ini berjalan sesuai jadwal malam, aktif secara default untuk pemanggilan alur kerja dari pemeriksaan rilis, dan dispatch manual `Install Smoke` dapat memilih untuk menyertakannya. CI PR normal tetap menjalankan lane regresi peluncur Bun yang cepat untuk perubahan yang relevan dengan Node. Pengujian Docker QR dan penginstal tetap menggunakan Dockerfile masing-masing yang berfokus pada instalasi.

## E2E Docker lokal

`pnpm test:docker:all` melakukan prabangun terhadap satu image pengujian langsung bersama, mengemas OpenClaw satu kali sebagai tarball npm, dan membangun dua image `scripts/e2e/Dockerfile` bersama:

- runner Node/Git dasar untuk lane penginstal/pembaruan/dependensi plugin;
- image fungsional yang menginstal tarball yang sama ke dalam `/app` untuk lane fungsionalitas normal.

Definisi lane Docker berada di `scripts/lib/docker-e2e-scenarios.mjs`, logika perencana berada di `scripts/lib/docker-e2e-plan.mjs`, dan runner hanya menjalankan rencana yang dipilih. Penjadwal memilih image per lane dengan `OPENCLAW_DOCKER_E2E_BARE_IMAGE` dan `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, lalu menjalankan lane dengan `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Parameter yang dapat disetel

| Variabel                               | Default | Tujuan                                                                                       |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Jumlah slot pool utama untuk lane normal.                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Jumlah slot pool ekor yang sensitif terhadap penyedia.                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Batas lane langsung serentak agar penyedia tidak melakukan pembatasan.                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5       | Batas lane instalasi npm serentak.                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Batas lane multilayanan serentak.                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Jeda bertahap antarawal lane untuk menghindari lonjakan pembuatan pada daemon Docker; tetapkan `0` agar tanpa jeda.     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Batas waktu fallback per lane (120 menit); lane langsung/ekor tertentu menggunakan batas yang lebih ketat.           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | tidak disetel   | `1` mencetak rencana penjadwal tanpa menjalankan lane.                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | tidak disetel   | Daftar persis lane yang dipisahkan koma; melewati smoke pembersihan agar agen dapat mereproduksi satu lane yang gagal. |

Lane yang lebih berat daripada batas efektifnya tetap dapat dimulai dari pool kosong, lalu berjalan sendiri hingga melepaskan kapasitas. Agregat lokal melakukan prapemeriksaan Docker, menghapus kontainer E2E OpenClaw yang usang, memancarkan status lane aktif, menyimpan waktu lane untuk pengurutan dari yang terlama, dan secara default berhenti menjadwalkan lane baru dalam pool setelah kegagalan pertama.

### Alur kerja langsung/E2E yang dapat digunakan kembali

Alur kerja langsung/E2E yang dapat digunakan kembali menanyakan kepada `scripts/test-docker-all.mjs --plan-json` paket, jenis image, image langsung, lane, dan cakupan kredensial yang diperlukan. `scripts/docker-e2e.mjs` kemudian mengubah rencana tersebut menjadi output dan ringkasan GitHub. Alur kerja ini mengemas OpenClaw melalui `scripts/package-openclaw-for-docker.mjs`, mengunduh artefak paket dari proses saat ini, atau mengunduh artefak paket dari `package_artifact_run_id`, lalu memvalidasi inventaris tarball. Jalur default `no-push-artifact` membangun image dasar/fungsional yang ditandai digest paket melalui cache lapisan Docker Blacksmith, mengemas byte image yang persis ke dalam artefak alur kerja yang tidak dapat diubah, dan meminta setiap konsumen memverifikasi serta memuat artefak tersebut. Sebagai gantinya, `existing-only` mewajibkan referensi GHCR `docker_e2e_bare_image`/`docker_e2e_functional_image` secara eksplisit dan tidak pernah membangun atau melakukan push. Penarikan registry tersebut menggunakan batas waktu 180 detik per percobaan agar stream yang macet cepat dicoba ulang alih-alih menghabiskan sebagian besar jalur kritis CI. Setelah validasi terjadwal berhasil, `openclaw-scheduled-live-checks.yml` meneruskan manifes image teruji yang tidak dapat diubah kepada penerbit penulisan paket terpisah; pemanggil rilis dan prarilis hanya-baca tidak pernah melewati penulis tersebut.

### Bagian jalur rilis

Cakupan Docker rilis menjalankan job lebih kecil yang dibagi menjadi beberapa bagian dengan `OPENCLAW_SKIP_DOCKER_BUILD=1` sehingga setiap bagian hanya memverifikasi dan memuat jenis image berbasis artefak yang diperlukannya (atau menariknya dengan penggunaan kembali `existing-only` secara eksplisit) serta menjalankan beberapa lane melalui penjadwal berbobot yang sama:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | openwebui`

Bagian Docker rilis saat ini adalah `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a` hingga `plugins-runtime-install-h`, dan `openwebui`. `package-update-openai` mencakup lane paket plugin Codex langsung, yang menginstal paket kandidat OpenClaw, menginstal plugin Codex dari `codex_plugin_spec` atau tarball dengan referensi yang sama disertai persetujuan instalasi CLI Codex secara eksplisit, menjalankan prapemeriksaan CLI Codex dan giliran agen dalam sesi yang sama, lalu menjalankan giliran pemikiran sedang tanpa percobaan ulang yang mengirimkan progres, membaca input ruang kerja yang diacak, menulis artefaknya secara persis, dan mengirimkan penyelesaian. `plugins-runtime-core`, `plugins-runtime`, dan `plugins-integrations` tetap menjadi alias agregat plugin/runtime. Alias lane `install-e2e` tetap menjadi alias pengulangan manual agregat untuk kedua lane penginstal penyedia.

OpenWebUI berjalan sebagai bagian `openwebui` mandiri pada runner Blacksmith khusus dengan disk besar setiap kali cakupan jalur rilis stabil atau lengkap memintanya, bahkan ketika alur kerja yang dapat digunakan kembali mengarahkan job yang didukung ke runner yang dihosting GitHub. Memisahkan penarikan image eksternal mencegah image besar bersaing dengan image paket dan plugin bersama di `plugins-runtime-services`; bagian agregat plugin/runtime lama tetap menyertakan OpenWebUI untuk pengulangan manual yang kompatibel. Lane pembaruan kanal yang dibundel mencoba ulang satu kali untuk kegagalan jaringan npm sementara.

Setiap bagian mengunggah `.artifacts/docker-tests/` dengan log lane, waktu, `summary.json`, `failures.json`, waktu fase, JSON rencana penjadwal, tabel lane lambat, dan perintah pengulangan per lane. Input alur kerja `docker_lanes` menjalankan lane terpilih terhadap image yang disiapkan untuk proses tersebut alih-alih melalui job bagian, sehingga proses debug lane yang gagal tetap terbatas pada satu job Docker yang ditargetkan; jika lane terpilih merupakan lane Docker langsung, job yang ditargetkan membangun image pengujian langsung secara lokal untuk pengulangan tersebut. Pembantu pengulangan memvalidasi SHA target terpilih yang persis dari artefak kegagalan dan dispatch manual mengemas ulang referensi tersebut, karena tuple paket alur kerja internal yang dapat digunakan kembali bukan bagian dari skema `workflow_dispatch`. Perintah yang dihasilkan menyertakan input image yang telah disiapkan dan `shared_image_policy=existing-only` hanya ketika input tersebut didukung GHCR; tag artefak lokal runner dihilangkan agar runner baru membangunnya kembali. Penggantian target secara eksplisit menghapus referensi image GHCR yang dipulihkan kecuali artefak membuktikan bahwa referensi tersebut cocok dengan penggantian. Referensi definisi alur kerja yang dihasilkan artefak juga dihilangkan karena cabang sementara rilis lengkap dihapus; dispatch menggunakan cabang default repositori kecuali operator menggantinya secara eksplisit.

```bash
pnpm test:docker:rerun <run-id>      # unduh artefak Docker dan cetak perintah pengulangan tertarget gabungan/per lane
pnpm test:docker:timings <summary>   # ringkasan jalur kritis lane lambat dan fase
```

Alur kerja langsung/E2E terjadwal menjalankan rangkaian Docker jalur rilis lengkap setiap hari dan, setelah berhasil, memanggil penerbit eksplisit untuk artefak image teruji yang persis.

## Prarilis Plugin

`Plugin Prerelease` merupakan cakupan produk/paket yang lebih mahal, sehingga menjadi alur kerja terpisah yang didispatch oleh `Full Release Validation` atau operator secara eksplisit. Pull request normal, push `main`, dan dispatch CI manual mandiri tidak menjalankan rangkaian tersebut. Alur kerja ini menyeimbangkan pengujian plugin yang dibundel pada delapan worker ekstensi; job shard ekstensi tersebut menjalankan hingga dua grup konfigurasi plugin sekaligus dengan satu worker Vitest per grup dan heap Node yang lebih besar agar batch plugin dengan banyak impor tidak membuat job CI tambahan. Jalur prarilis Docker khusus rilis (diaktifkan oleh input `full_release_validation`) mengelompokkan lane Docker yang ditargetkan dalam grup berisi empat untuk menghindari reservasi puluhan runner bagi job berdurasi satu hingga tiga menit. Alur kerja ini juga mengunggah artefak informasional `plugin-inspector-advisory` dari `@openclaw/plugin-inspector`; temuan pemeriksa merupakan input triase dan tidak mengubah gerbang Prarilis Plugin yang bersifat memblokir.

## QA Lab

QA Lab memiliki lane CI khusus di luar alur kerja utama yang bercakupan cerdas. Paritas agentik disarangkan di bawah harness QA dan rilis yang luas, bukan alur kerja PR mandiri. Gunakan `Full Release Validation` dengan `rerun_group=qa-parity` ketika paritas harus disertakan dalam proses validasi yang luas.

- Alur kerja `QA-Lab - All Lanes` berjalan setiap malam pada `main` dan saat dispatch manual; alur kerja ini menyebarkan job paritas tiruan serta job langsung Matrix, Telegram, Discord, WhatsApp, dan Slack. Job langsung menggunakan lingkungan `qa-live-shared`; Telegram, Discord, WhatsApp, dan Slack menggunakan lease Convex, sedangkan Matrix menyediakan kredensial lokal sekali pakai.

Pemeriksaan rilis menjalankan lane transport langsung Matrix dan Telegram dengan penyedia tiruan deterministik dan model yang memenuhi syarat tiruan (`mock-openai/gpt-5.6-luna` dan `mock-openai/gpt-5.6-luna-alt`) sehingga kontrak kanal terisolasi dari latensi model langsung dan startup plugin penyedia normal. Gateway transport langsung menonaktifkan pencarian memori karena paritas QA mencakup perilaku memori secara terpisah; konektivitas penyedia dicakup oleh rangkaian model langsung, penyedia native, dan penyedia Docker yang terpisah.

Gerbang Matrix terjadwal dan rilis menggunakan host rangkaian QA Lab bersama serta adaptor langsung dengan skenario rilis. Default CLI dan input alur kerja manual tetap `all`; dispatch manual `all` menyebarkan profil `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, dan `e2ee-cli` agar pembuktian 93 skenario tetap berada dalam batas waktu per job. Dispatch manual terfokus memilih `fast`, `release`, atau `transport` dalam satu job.

`OpenClaw Release Checks` juga menjalankan lane QA Lab yang kritis bagi rilis sebelum persetujuan rilis; gerbang paritas QA-nya menjalankan paket kandidat dan baseline sebagai job lane paralel, lalu mengunduh kedua artefak ke dalam job laporan kecil untuk perbandingan paritas akhir.

Untuk PR normal, ikuti bukti CI/pemeriksaan yang tercakup alih-alih menganggap paritas sebagai status wajib.

## CodeQL

Alur kerja `CodeQL` sengaja merupakan pemindai keamanan tahap pertama yang sempit, bukan pemindaian repositori lengkap. Proses harian, manual, push `main`, dan penjagaan pull request non-draf memindai kode alur kerja Actions beserta permukaan JavaScript/TypeScript berisiko tertinggi menggunakan kueri keamanan berkeyakinan tinggi yang difilter ke `security-severity` tinggi/kritis.

Pengaman pull request tetap ringan: pengaman ini hanya dimulai untuk perubahan di bawah `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, `scripts`, `src`, atau jalur runtime plugin bawaan yang memiliki proses, dan menjalankan matriks keamanan berkeyakinan tinggi yang sama seperti alur kerja terjadwal. CodeQL Android dan macOS tetap tidak disertakan dalam default PR.

### Kategori keamanan

| Kategori                                          | Permukaan                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Dasar autentikasi, rahasia, sandbox, cron, dan gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Kontrak implementasi kanal inti beserta runtime plugin kanal, gateway, Plugin SDK, rahasia, dan titik sentuh audit              |
| `/codeql-security-high/network-ssrf-boundary`     | Permukaan kebijakan SSRF inti, penguraian IP, pengaman jaringan, pengambilan web, dan SSRF Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | Server MCP, pembantu eksekusi proses, pengiriman keluar, dan gerbang eksekusi alat agen                                           |
| `/codeql-security-high/process-exec-boundary`     | Shell lokal, pembantu pembuatan proses, runtime plugin bawaan yang memiliki subproses, dan perekat skrip alur kerja                             |
| `/codeql-security-high/plugin-trust-boundary`     | Permukaan kepercayaan kontrak paket untuk instalasi Plugin, pemuat, manifes, registri, instalasi pengelola paket, pemuatan sumber, dan Plugin SDK |

### Shard keamanan khusus platform

- `CodeQL Android Critical Security` — shard keamanan Android terjadwal. Membangun aplikasi Android secara manual untuk CodeQL pada runner Linux Blacksmith terkecil yang diterima oleh pemeriksaan kewajaran alur kerja. Mengunggah di bawah `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard keamanan macOS mingguan/manual. Membangun aplikasi macOS secara manual untuk CodeQL di Blacksmith macOS, menyaring hasil pembangunan dependensi dari SARIF yang diunggah, dan mengunggah di bawah `/codeql-critical-security/macos`. Dibiarkan di luar default harian karena pembangunan macOS mendominasi waktu runtime bahkan saat bersih.

### Kategori Kualitas Kritis

`CodeQL Critical Quality` adalah shard nonkeamanan yang sesuai. Shard ini hanya menjalankan kueri kualitas JavaScript/TypeScript nonkeamanan dengan tingkat keparahan kesalahan pada permukaan sempit bernilai tinggi di runner Linux yang di-host GitHub agar pemindaian kualitas tidak menghabiskan anggaran pendaftaran runner Blacksmith. Pengaman pull request-nya sengaja lebih kecil daripada profil terjadwal: PR non-draf hanya menjalankan shard yang sesuai untuk permukaan yang disentuhnya, dari tiga belas shard yang dapat dirutekan oleh PR — `agent-runtime-boundary`, `channel-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `gateway-runtime-boundary`, `mcp-process-runtime-boundary`, `memory-runtime-boundary`, `network-runtime-boundary`, `plugin-boundary`, `plugin-sdk-package-contract`, `plugin-sdk-reply-runtime`, `provider-runtime-boundary`, dan `session-diagnostics-boundary`. `ui-control-plane` dan `web-media-runtime-boundary` tetap tidak disertakan dalam proses PR. Perubahan konfigurasi CodeQL dan alur kerja kualitas menjalankan set shard PR lengkap (shard runtime jaringan dipicu berdasarkan file konfigurasi CodeQL-nya sendiri dan jalur sumber yang memiliki jaringan).

Dispatch manual menerima:

```text
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|network-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Profil sempit tersebut merupakan kait pengajaran/iterasi untuk menjalankan satu shard kualitas secara terpisah.

| Kategori                                                | Permukaan                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Kode batas keamanan autentikasi, rahasia, sandbox, cron, dan gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Kontrak skema konfigurasi, migrasi, normalisasi, dan IO                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Skema protokol Gateway dan kontrak metode server                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Kontrak implementasi kanal inti dan plugin kanal bawaan                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Kontrak runtime eksekusi perintah, dispatch model/penyedia, dispatch dan antrean balasan otomatis, serta bidang kontrol ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Server MCP dan jembatan alat, pembantu pengawasan proses, serta kontrak pengiriman keluar                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK host memori, fasad runtime memori, alias Plugin SDK memori, perekat aktivasi runtime memori, dan perintah doctor memori                                    |
| `/codeql-critical-quality/network-runtime-boundary`     | Paket kebijakan jaringan, runtime soket mentah dan penangkapan proksi, terowongan SSH, kunci gateway, soket JSONL, serta permukaan transportasi push                                 |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internal antrean balasan, antrean pengiriman sesi, pembantu pengikatan/pengiriman sesi keluar, permukaan bundel peristiwa/log diagnostik, dan kontrak CLI doctor sesi |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Dispatch balasan masuk Plugin SDK, muatan balasan/pembagian potongan/pembantu runtime, opsi balasan kanal, antrean pengiriman, serta pembantu pengikatan sesi/utas             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisasi katalog model, autentikasi dan penemuan penyedia, pendaftaran runtime penyedia, default/katalog penyedia, serta registri web/pencarian/pengambilan/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap UI Kontrol, persistensi lokal, alur kontrol gateway, dan kontrak runtime bidang kontrol tugas                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Pengambilan/pencarian web inti, IO media, pemahaman media, pembuatan gambar, dan kontrak runtime pembuatan media                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Kontrak titik masuk pemuat, registri, permukaan publik, dan Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Sumber Plugin SDK sisi paket yang dipublikasikan dan pembantu kontrak paket plugin                                                                                      |

Kualitas tetap dipisahkan dari keamanan agar temuan kualitas dapat dijadwalkan, diukur, dinonaktifkan, atau diperluas tanpa mengaburkan sinyal keamanan. Perluasan CodeQL untuk Swift, Python, dan plugin bawaan hanya boleh ditambahkan kembali sebagai pekerjaan lanjutan yang dibatasi cakupannya atau dibagi menjadi shard setelah profil sempit memiliki runtime dan sinyal yang stabil.

## Alur kerja pemeliharaan

### Agen Dokumentasi

Alur kerja `Docs Agent` adalah jalur pemeliharaan Codex berbasis peristiwa untuk menjaga dokumentasi yang ada tetap selaras dengan perubahan yang baru saja digabungkan. Alur ini tidak memiliki jadwal murni: proses CI push non-bot yang berhasil pada `main` dapat memicunya, dan dispatch manual dapat menjalankannya secara langsung. Pemanggilan melalui proses alur kerja dilewati ketika `main` telah berlanjut atau ketika proses Agen Dokumentasi lain yang tidak dilewati dibuat dalam satu jam terakhir. Saat berjalan, alur ini meninjau rentang commit dari SHA sumber Agen Dokumentasi sebelumnya yang tidak dilewati hingga `main` saat ini, sehingga satu proses per jam dapat mencakup semua perubahan main yang terkumpul sejak pemeriksaan dokumentasi terakhir.

### Agen Performa Pengujian

Alur kerja `Test Performance Agent` adalah jalur pemeliharaan Codex berbasis peristiwa untuk pengujian yang lambat. Alur ini tidak memiliki jadwal murni: proses CI push non-bot yang berhasil pada `main` dapat memicunya, tetapi akan dilewati jika pemanggilan proses alur kerja lain sudah berjalan atau telah berjalan pada hari UTC tersebut. Dispatch manual melewati gerbang aktivitas harian itu. Jalur ini membangun laporan performa Vitest seluruh rangkaian yang dikelompokkan, mengizinkan Codex hanya membuat perbaikan kecil performa pengujian yang mempertahankan cakupan alih-alih refaktor luas, lalu menjalankan ulang laporan seluruh rangkaian dan menolak perubahan yang mengurangi jumlah dasar pengujian yang lulus. Laporan yang dikelompokkan mencatat waktu nyata per konfigurasi dan RSS maksimum di Linux dan macOS, sehingga perbandingan sebelum/sesudah menampilkan delta memori pengujian di samping delta durasi. Jika dasar memiliki pengujian yang gagal, Codex hanya boleh memperbaiki kegagalan yang jelas dan laporan seluruh rangkaian setelah agen harus lulus sebelum apa pun di-commit. Ketika `main` bergerak maju sebelum push bot mendarat, jalur tersebut melakukan rebase terhadap patch yang telah divalidasi, menjalankan ulang `pnpm check:changed`, dan mencoba kembali push; patch basi yang berkonflik dilewati. Jalur ini menggunakan Ubuntu yang di-host GitHub agar tindakan Codex dapat mempertahankan postur keamanan drop-sudo yang sama seperti agen dokumentasi.

### PR Duplikat Setelah Penggabungan

Alur kerja `Duplicate PRs After Merge` adalah alur kerja pengelola manual untuk pembersihan duplikat setelah perubahan mendarat. Secara default alur ini melakukan dry-run dan hanya menutup PR yang dicantumkan secara eksplisit ketika `apply=true`. Sebelum memutasi GitHub, alur ini memverifikasi bahwa PR yang mendarat telah digabungkan dan bahwa setiap duplikat memiliki masalah rujukan yang sama atau hunk perubahan yang tumpang tindih.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gerbang pemeriksaan lokal dan perutean perubahan

Logika jalur perubahan lokal berada di `scripts/changed-lanes.mjs` dan dijalankan oleh `scripts/check-changed.mjs`. Gerbang pemeriksaan lokal tersebut lebih ketat terhadap batas arsitektur daripada cakupan platform CI yang luas:

- perubahan produksi inti menjalankan pemeriksaan tipe produksi inti dan pengujian inti beserta lint/pengaman inti;
- perubahan khusus pengujian inti hanya menjalankan pemeriksaan tipe pengujian inti beserta lint inti;
- perubahan produksi ekstensi menjalankan pemeriksaan tipe produksi ekstensi dan pengujian ekstensi beserta lint ekstensi;
- perubahan khusus pengujian ekstensi menjalankan pemeriksaan tipe pengujian ekstensi beserta lint ekstensi;
- perubahan Plugin SDK publik atau kontrak plugin diperluas ke pemeriksaan tipe ekstensi karena ekstensi bergantung pada kontrak inti tersebut (penyapuan ekstensi Vitest tetap merupakan pekerjaan pengujian eksplisit);
- peningkatan versi yang hanya mengubah metadata rilis menjalankan pemeriksaan versi/konfigurasi/dependensi root yang ditargetkan;
- perubahan root/konfigurasi yang tidak diketahui gagal secara aman ke semua jalur pemeriksaan.

Perutean pengujian perubahan lokal berada di `scripts/test-projects.test-support.mjs` dan sengaja lebih murah daripada `check:changed`: pengeditan pengujian langsung menjalankan pengujian itu sendiri, pengeditan sumber mengutamakan pemetaan eksplisit, lalu pengujian saudara dan dependensi grafik impor. Konfigurasi pengiriman ruang grup bersama adalah salah satu pemetaan eksplisit: perubahan pada konfigurasi balasan terlihat grup, mode pengiriman balasan sumber, atau prompt sistem alat pesan dirutekan melalui pengujian balasan inti beserta regresi pengiriman Discord dan Slack sehingga perubahan default bersama gagal sebelum push PR pertama. Gunakan `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` hanya ketika perubahan mencakup harness secara cukup luas sehingga set pemetaan murah bukan proksi yang dapat dipercaya.

## Validasi Testbox

Crabbox adalah pembungkus remote-box milik repo untuk pembuktian Linux oleh pengelola. Sesi
agen mempertahankan satu/beberapa pengujian terfokus dan pemeriksaan statis ringan secara lokal hanya untuk
sumber tepercaya saat instalasi dependensi yang ada telah siap. Sesi tersebut menggunakan Crabbox untuk rangkaian yang lebih besar dan
pekerjaan intensif komputasi, termasuk build, pemeriksaan tipe, fan-out lint,
Docker, jalur paket, E2E, pembuktian langsung, dan kesetaraan CI. Pembuktian berat oleh pengelola tepercaya
secara default menggunakan `blacksmith-testbox`, dan `.crabbox.yaml` kini secara default menggunakannya. Alur kerja yang dikonfigurasi
menghidrasi kredensial penyedia dan agen, sehingga kode kontributor tidak tepercaya atau
fork harus menggunakan CI fork tanpa rahasia atau Crabbox AWS langsung yang disanitasi sebagai gantinya.
Proses AWS yang disanitasi menetapkan `CRABBOX_ENV_ALLOW=CI`, meneruskan
`--no-hydrate`, dan menggunakan `HOME` jarak jauh sementara yang baru; hal ini mencegah daftar izin
`OPENCLAW_*` repo dan profil autentikasi yang ada menjangkau kode tidak tepercaya.
Proses tersebut menggunakan lease yang baru dipanaskan dan dikhususkan untuk sumber tidak tepercaya itu, bukan
lease tepercaya atau yang sebelumnya telah dihidrasi. Luncurkan biner Crabbox tepercaya yang telah diinstal
dari checkout `main` tepercaya yang bersih dan ambil hanya PR jarak jauh dengan
`--fresh-pr`; jangan pernah menjalankan pembungkus atau konfigurasi checkout tidak tepercaya secara lokal.
Hapus penetapan `CRABBOX_AWS_INSTANCE_PROFILE` dan gagal secara tertutup kecuali
`aws.instanceProfile` yang diresolusikan kosong. Sebelum instalasi/pengujian apa pun, gunakan alat
jalur absolut tepercaya untuk mewajibkan token IMDSv2, membuktikan endpoint
kredensial IAM mengembalikan 404, dan membandingkan `git rev-parse HEAD` jarak jauh dengan SHA head PR
lengkap yang telah direview. Ikat lease ke SHA tersebut dan hentikan/panaskan ulang saat head berubah.
Unggah `scripts/crabbox-untrusted-bootstrap.sh` tepercaya dari `main` yang bersih
bersama `--fresh-pr`; skrip ini menginstal Node/pnpm yang dipatok, memverifikasi SHA dan
patokan pengelola paket, mengisolasi `HOME`, menginstal dependensi, lalu menjalankan
pengujian yang diminta.
Hapus penetapan semua override `CRABBOX_TAILSCALE*`, paksa `--network public
--tailscale=false`, hapus flag exit-node/LAN, dan wajibkan `crabbox inspect` untuk
melaporkan jaringan publik tanpa status Tailscale sebelum mengunggah skrip apa pun.
Kapasitas AWS/Hetzner milik sendiri juga tetap menjadi fallback untuk gangguan Blacksmith,
masalah kuota, atau pengujian kapasitas milik sendiri yang eksplisit.

Agen tidak melakukan pemanasan awal untuk pekerjaan yang diperkirakan. Dapatkan Testbox secara malas saat
perintah berat pertama siap, gunakan kembali id `tbx_...` yang dikembalikan untuk perintah berat
berikutnya, sinkronkan checkout saat ini pada setiap proses, dan hentikan sebelum serah terima.

Proses Blacksmith yang didukung Crabbox memanaskan, mengklaim, menyinkronkan, menjalankan, melaporkan, dan membersihkan
Testbox sekali pakai. Pemeriksaan kewajaran sinkronisasi bawaan gagal dengan cepat ketika
`git status --short` pada box yang disinkronkan menunjukkan sedikitnya 200 penghapusan terlacak,
yang mendeteksi hilangnya berkas root seperti `pnpm-lock.yaml`. Untuk PR dengan
penghapusan besar yang disengaja, tetapkan `CRABBOX_ALLOW_MASS_DELETIONS=1` untuk perintah jarak jauh.

Crabbox juga menghentikan pemanggilan CLI Blacksmith lokal yang tetap berada dalam
fase sinkronisasi selama lebih dari lima menit tanpa keluaran pascasinkronisasi. Tetapkan
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` untuk menonaktifkan pengaman tersebut, atau gunakan nilai
milidetik yang lebih besar untuk diff lokal yang luar biasa besar.

Sebelum proses pertama, periksa pembungkus dari root repo:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Pembungkus repo menolak biner Crabbox kedaluwarsa yang tidak mengiklankan penyedia terpilih, dan proses yang didukung Blacksmith memerlukan Crabbox 0.22.0 atau yang lebih baru agar pembungkus memperoleh perilaku sinkronisasi, antrean, dan pembersihan Testbox terkini. Dalam worktree Codex atau checkout tertaut/sparse, hindari skrip `pnpm crabbox:run` lokal karena pnpm dapat merekonsiliasi dependensi sebelum Crabbox dimulai; panggil pembungkus node secara langsung sebagai gantinya:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Saat menggunakan checkout saudara, build ulang biner lokal yang diabaikan sebelum pekerjaan pengukuran waktu atau pembuktian:

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

Blok `blacksmith:` dalam `.crabbox.yaml` telah mematok default organisasi, alur kerja, pekerjaan, dan ref, sehingga flag eksplisit di bawah bersifat opsional. Gate perubahan:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm check:changed"
```

Jalankan ulang pengujian terfokus pada Testbox saat dependensi lokal tidak tersedia atau
target melakukan fan-out:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm test <path-or-filter>"
```

Rangkaian lengkap:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm test"
```

Baca ringkasan JSON terakhir. Bidang yang berguna adalah `provider`, `leaseId`,
`syncDelegated`, `exitCode`, `commandMs`, dan `totalMs`. Untuk proses
Blacksmith Testbox yang didelegasikan, kode keluar pembungkus Crabbox dan ringkasan JSON merupakan
hasil perintah. Proses GitHub Actions tertaut memiliki hidrasi dan keepalive; proses tersebut
dapat berakhir sebagai `cancelled` ketika Testbox dihentikan secara eksternal setelah perintah SSH
telah selesai. Perlakukan hal tersebut sebagai artefak pembersihan/status kecuali
`exitCode` pembungkus bukan nol atau keluaran perintah menunjukkan pengujian gagal.
Proses Crabbox sekali pakai yang didukung Blacksmith seharusnya menghentikan Testbox secara otomatis;
jika proses terinterupsi atau pembersihannya tidak jelas, periksa box aktif dan hentikan hanya
box yang Anda buat:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Gunakan pemakaian ulang hanya saat Anda sengaja memerlukan beberapa perintah pada box terhidrasi yang sama:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --id <tbx_id> --timing-json --shell -- "corepack pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Gunakan kembali lease, bukan sumber kedaluwarsa. Hilangkan `--no-sync` agar setiap proses mengunggah
checkout saat ini; gunakan hanya untuk menjalankan ulang tree yang tidak berubah dan telah disinkronkan
secara sengaja. Kode kontributor/fork yang tidak tepercaya harus menggunakan
`CRABBOX_ENV_ALLOW=CI`, `--provider aws --no-hydrate`, dan `HOME`
jarak jauh sementara yang baru untuk setiap perintah; instal dependensi di dalam perintah
yang disanitasi tersebut sebelum pengujian. Gunakan kembali hanya lease yang baru dipanaskan dan dikhususkan untuk
sumber tidak tepercaya yang sama; jangan pernah menggunakan lease tepercaya atau yang sebelumnya telah dihidrasi. Jangan pernah
menjalankan pembungkus atau konfigurasi checkout tidak tepercaya secara lokal: luncurkan biner
Crabbox tepercaya yang telah diinstal dari `main` tepercaya yang bersih dan teruskan `--fresh-pr` pada setiap
proses. Biarkan `CRABBOX_AWS_INSTANCE_PROFILE` tidak ditetapkan, tolak profil instans
yang diresolusikan dan tidak kosong, wajibkan pembuktian IMDS tanpa peran jarak jauh yang tepercaya, serta verifikasi
SHA head yang telah direview sebelum instalasi/pengujian. Ikat lease ke SHA tersebut; hentikan dan
panaskan ulang setelah perubahan head apa pun. Jika tidak ada PR jarak jauh, gunakan CI fork tanpa rahasia.
Jangan pernah memilih `hydrate-github` atau alur kerja Blacksmith yang menghidrasi kredensial
untuk sumber tidak tepercaya.

Jika Crabbox merupakan lapisan yang rusak tetapi Blacksmith sendiri berfungsi, gunakan
Blacksmith langsung hanya untuk diagnostik seperti `list`, `status`, dan pembersihan. Perbaiki
jalur Crabbox sebelum memperlakukan proses Blacksmith langsung sebagai pembuktian pengelola.

Jika `blacksmith testbox list --all` dan `blacksmith testbox status` berfungsi tetapi
pemanasan baru tetap `queued` tanpa IP atau URL proses Actions setelah beberapa menit,
perlakukan hal tersebut sebagai tekanan penyedia, antrean, penagihan, atau batas organisasi Blacksmith. Hentikan
id antrean yang Anda buat, hindari memulai Testbox lain, dan pindahkan pembuktian ke
jalur kapasitas Crabbox milik sendiri di bawah sementara seseorang memeriksa dasbor Blacksmith,
penagihan, dan batas organisasi.

Eskalasi ke kapasitas Crabbox milik sendiri hanya ketika Blacksmith tidak aktif, dibatasi kuota, tidak memiliki lingkungan yang diperlukan, atau kapasitas milik sendiri memang menjadi tujuan eksplisit:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --provider aws --id <cbx_id-or-slug>
pnpm crabbox:run -- --provider aws --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- --provider aws <cbx_id-or-slug>
```

Saat AWS mengalami tekanan, hindari `class=beast` kecuali tugas benar-benar memerlukan CPU kelas 48xlarge. Permintaan `beast` dimulai pada 192 vCPU dan merupakan cara termudah untuk melampaui kuota regional EC2 Spot atau On-Demand Standard. `.crabbox.yaml` milik repo secara default menggunakan `class: standard`, pasar on-demand, dan `capacity.hints: true` sehingga lease AWS yang diperantarai mencetak wilayah/pasar terpilih, tekanan kuota, fallback Spot, dan peringatan kelas bertekanan tinggi. Gunakan `fast` untuk pemeriksaan luas yang lebih berat, `large` hanya setelah standard/fast tidak mencukupi, dan `beast` hanya untuk jalur luar biasa yang dibatasi CPU seperti rangkaian lengkap atau matriks Docker semua plugin, validasi rilis/pemblokir eksplisit, atau pembuatan profil performa berinti tinggi. Jangan gunakan `beast` untuk `pnpm check:changed`, pengujian terfokus, pekerjaan khusus dokumentasi, lint/pemeriksaan tipe biasa, reproduksi E2E kecil, atau triase gangguan Blacksmith. Gunakan `--market on-demand` untuk diagnosis kapasitas agar gejolak pasar Spot tidak tercampur ke dalam sinyal.

`.crabbox.yaml` memiliki default penyedia, sinkronisasi, dan hidrasi GitHub Actions. Sinkronisasi Crabbox tidak pernah mentransfer `.git`, sehingga checkout Actions terhidrasi mempertahankan metadata Git jarak jauhnya sendiri alih-alih menyinkronkan remote dan penyimpanan objek lokal pengelola, dan konfigurasi repo juga mengecualikan artefak runtime/build lokal (seperti `.artifacts` dan laporan pengujian) yang tidak boleh ditransfer. `.github/workflows/crabbox-hydrate.yml` memiliki checkout, penyiapan Node/pnpm, pengambilan `origin/main`, dan serah terima lingkungan nonrahasia untuk perintah `crabbox run --id <cbx_id>` cloud milik sendiri.

## Terkait

- [Ikhtisar instalasi](/id/install)
- [Saluran pengembangan](/id/install/development-channels)
