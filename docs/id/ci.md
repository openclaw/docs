---
read_when:
    - Anda perlu memahami mengapa suatu tugas CI berjalan atau tidak berjalan
    - Anda sedang men-debug pemeriksaan GitHub Actions yang gagal
    - Anda sedang mengoordinasikan proses atau pengulangan validasi rilis
    - Anda sedang mengubah pengiriman ClawSweeper atau penerusan aktivitas GitHub
summary: Graf tugas CI, gerbang cakupan, payung rilis, dan perintah lokal yang setara
title: Pipeline CI
x-i18n:
    generated_at: "2026-07-19T04:47:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5c633517ef09e7348033bb9fbf57f95376095967979f53d05921899c8b8cde3d
    source_path: ci.md
    workflow: 16
---

CI OpenClaw berjalan saat push ke `main` (jalur Markdown dan `docs/**` diabaikan
pada pemicu), pada setiap pull request non-draf, dan pada dispatch manual.
Push `main` kanonis dijalankan satu per satu: grup konkurensi `CI` memungkinkan satu
siklus integrasi lengkap berjalan sementara GitHub hanya mempertahankan push tertunda terbaru.
Merge baru menggantikan proses tertunda tersebut alih-alih membatalkan pekerjaan yang sudah
mendaftarkan matriks Blacksmith. Pull request tetap membatalkan head yang telah digantikan,
dan dispatch manual menggunakan grup terisolasi. `preflight` mengklasifikasikan diff dan
menonaktifkan lane berbiaya tinggi ketika hanya area yang tidak terkait yang berubah. Proses manual
`workflow_dispatch` sengaja melewati pembatasan cakupan cerdas dan menyebarkan
graf lengkap untuk kandidat rilis dan validasi luas. Lane Android tetap
bersifat opsional melalui `include_android` (atau input `release_gate`). Cakupan
plugin khusus rilis berada dalam alur kerja
[`Plugin Prerelease`](#plugin-prerelease) yang terpisah dan hanya berjalan dari
[`Full Release Validation`](#full-release-validation) atau dispatch manual
eksplisit.

## Ikhtisar pipeline

| Pekerjaan                          | Tujuan                                                                                                                                                                                                                | Waktu dijalankan                                      |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `preflight`                        | Mendeteksi cakupan yang berubah dan membangun manifes CI; pada `main` kanonis yang relevan dengan Node, menyegarkan dan memelihara snapshot dependensi sebelum penyebaran paralel                                  | Selalu pada push dan PR non-draf                      |
| `security-fast`                    | Deteksi kunci privat, audit alur kerja yang berubah melalui `zizmor`, dan audit lockfile produksi                                                                                                                  | Selalu pada push dan PR non-draf                      |
| `pnpm-store-warmup`                | Menghangatkan cache Actions yang disematkan oleh lockfile untuk pull request dan proses manual tanpa memblokir shard Node Linux                                                                                         | Lane Node atau pemeriksaan dokumentasi dipilih di luar main |
| `build-artifacts`                  | Membangun `dist/`, Control UI, pemeriksaan smoke CLI hasil build, memori startup, dan pemeriksaan artefak hasil build yang disematkan                                                                                | Perubahan yang relevan dengan Node                    |
| `control-ui-i18n`                  | Memverifikasi bundel locale Control UI yang dihasilkan, metadata, dan memori terjemahan; bersifat saran pada proses otomatis dan memblokir pada CI rilis manual                                                         | Perubahan terkait i18n Control UI dan CI manual       |
| `checks-fast-core`                 | Lane kebenaran Linux cepat: ratchet jumlah baris maksimum baseline supresi, bundled + protokol, peluncur Bun, dan tugas cepat perutean CI                                                                               | Perubahan yang relevan dengan Node                    |
| `qa-smoke-ci-profile`              | Dua bagian seimbang yang mandiri dari set perwakilan QA Smoke otomatis terbatas; cakupan taksonomi penuh tetap tersedia melalui profil QA eksplisit                                                                    | Perubahan yang relevan dengan Node                    |
| `checks-fast-contracts-plugins-*`  | Dua shard kontrak plugin berbobot                                                                                                                                                                                      | Perubahan yang relevan dengan Node                    |
| `checks-fast-contracts-channels-*` | Dua shard kontrak channel berbobot                                                                                                                                                                                     | Perubahan yang relevan dengan Node                    |
| `checks-node-*`                    | Pengujian Node bertarget perubahan pada pull request; shard core lengkap pada `main`, proses manual, rilis, dan fallback luas                                                                                       | Perubahan yang relevan dengan Node                    |
| `check-*`                          | Padanan gate lokal utama yang dibagi menjadi shard: guard, shrinkwrap, metadata konfigurasi bundled-channel, tipe produksi, lint, dependensi, tipe pengujian                                                           | Perubahan yang relevan dengan Node                    |
| `check-additional-*`               | Jalur pemeriksaan batas (termasuk penyimpangan snapshot prompt), batas pengakses sesi/pembaca transkrip/transaksi SQLite, grup lint ekstensi, kompilasi/canary batas paket, dan arsitektur topologi runtime              | Perubahan yang relevan dengan Node                    |
| `checks-node-compat-node22`        | Lane build dan smoke kompatibilitas Node 22                                                                                                                                                                            | Dispatch CI manual untuk rilis                        |
| `check-docs`                       | Pemeriksaan pemformatan dokumentasi, lint, dan tautan rusak                                                                                                                                                            | Dokumentasi berubah (PR dan dispatch manual)          |
| `native-i18n`                      | Pemeriksaan inventaris i18n aplikasi native, Android, dan Apple                                                                                                                                                        | Perubahan yang relevan dengan i18n native             |
| `skills-python`                    | Ruff + pytest untuk skills berbasis Python                                                                                                                                                                             | Perubahan yang relevan dengan skill Python            |
| `checks-windows`                   | Pengujian proses/jalur khusus Windows beserta regresi penspesifikasi impor runtime bersama                                                                                                                             | Perubahan yang relevan dengan Windows                 |
| `macos-node`                       | Pengujian TypeScript macOS terfokus: launchd, Homebrew, jalur runtime, skrip pengemasan, pembungkus grup proses                                                                                                        | Perubahan yang relevan dengan macOS                   |
| `macos-swift`                      | Lint dan build Swift untuk aplikasi macOS, beserta pengujian untuk aplikasi dan paket OpenClawKit bersama                                                                                                             | Perubahan yang relevan dengan macOS                   |
| `ios-build`                        | Pembuatan proyek Xcode beserta build simulator aplikasi iOS                                                                                                                                                           | Perubahan aplikasi iOS, kit aplikasi bersama, atau Swabble |
| `android`                          | Pengujian unit Android untuk kedua varian beserta satu build APK debug                                                                                                                                                 | Perubahan yang relevan dengan Android                 |
| `openclaw/ci-gate`                 | Agregat akhir: memerlukan preflight dan keamanan; hanya menerima skip untuk lane hilir yang dinonaktifkan oleh manifes                                                                                                 | Setiap proses CI non-draf                             |
| `test-performance-agent`           | Alur kerja terpisah: pengoptimalan pengujian lambat Codex harian setelah aktivitas tepercaya                                                                                                                           | Keberhasilan CI main atau dispatch manual             |
| `openclaw-performance`             | Alur kerja terpisah: laporan performa runtime Kova harian/sesuai permintaan dengan lane penyedia mock, profil mendalam, dan GPT 5.6 live                                                                               | Dispatch terjadwal dan manual                         |

Alur kerja Periphery mandiri memberlakukan nol temuan kode mati untuk aplikasi iOS dan macOS. Alur kerja OpenClawKit bersama memindai kedua konsumen secara paralel dan melaporkan deklarasi hanya ketika Periphery menghasilkan USR Swift yang sama dari kedua build. Kontrak skema `OpenClawProtocol/GatewayModels.swift` yang dihasilkannya dipertahankan sebagai kode milik generator, bukan diperlakukan sebagai kode mati lokal aplikasi.

## Urutan gagal-cepat

1. `preflight` menentukan lane mana yang tersedia. Logika `docs-scope` dan `changed-scope` merupakan langkah di dalam pekerjaan ini, bukan pekerjaan mandiri. `main` kanonis dimulai segera, tetapi grup konkurensinya hanya mengizinkan satu proses lengkap dan menggabungkan push berikutnya menjadi satu proses tertunda terbaru. Push main yang relevan dengan Node juga menserialkan satu-satunya penulis disk dependensi dan pemeliharaan ukurannya di sini sebelum pekerjaan hilir dapat memasang kunci tersebut; Blacksmith mungkin baru mengekspos commit baru kepada proses alur kerja berikutnya, sehingga konsumen dalam proses yang sama tetap menggunakan fallback lokal yang diperiksa melalui penanda.
2. `security-fast`, `check-*`, `check-additional-*`, `check-docs`, dan `skills-python` gagal dengan cepat tanpa menunggu pekerjaan matriks artefak dan platform yang lebih berat.
3. `build-artifacts` dan pemeriksaan `control-ui-i18n` yang bersifat saran berjalan bersamaan dengan lane Linux cepat. PR sumber mengecualikan snapshot locale yang dihasilkan; alur kerja penyegaran mandiri memperbaiki dan menggabungkan secara otomatis PR hasil generasi yang terisolasi di latar belakang. Cabang `release/YYYY.M.PATCH` kanonis dapat menyertakan perbaikan locale persiapan rilis bersama output rilis lain yang dihasilkan.
4. Lane platform dan runtime yang lebih berat kemudian menyebar secara paralel: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build`, dan `android`.
5. `openclaw/ci-gate` menunggu setiap lane yang dipilih. Preflight dan keamanan harus berhasil; pekerjaan hilir hanya boleh dilewati ketika manifes tidak memilihnya. Lane terpilih yang gagal atau dibatalkan menyebabkan agregat gagal.

Koordinator merge dapat menggunakan kembali `openclaw/ci-gate` terautentikasi yang berhasil
untuk head pull request yang sama hingga 24 jam. Hal ini menghindari penulisan ulang
cabang kontributor setelah perubahan `main` yang tidak terkait. Hasil yang dapat digunakan kembali tersebut tidak
menggantikan pemeriksaan test-merge ketat terpisah milik App terhadap `main` saat ini.
Proses ulang tertunda atau gagal berikutnya tidak menghapus hasil berhasil sebelumnya untuk
head yang tidak berubah tersebut selama jendela kesegaran.

Rangkaian aturan cabang default mewajibkan pemeriksaan `openclaw/ci-gate` yang dimiliki GitHub Actions. Pengelola dan admin repositori memiliki bypass darurat yang diaudit dan hanya ditujukan untuk pendaratan fast-forward langsung bertanda tangan; rangkaian aturan organisasi tetap memblokir penghapusan dan pembaruan non-fast-forward. Penggabungan pull request normal harus tetap menggunakan gate alih-alih melewati Pipeline CI yang gagal. Pemeriksaan penggabungan pengujian ketat terpisah yang dimiliki App tetap mengikat head ke `main` saat ini.

GitHub dapat menandai job pull request yang telah digantikan sebagai `cancelled` ketika head yang lebih baru mendarat. Perlakukan hal tersebut sebagai noise Pipeline CI kecuali proses terbaru untuk PR yang sama juga gagal. Proses `main` kanonis tidak dibatalkan setelah diterima; ketika trafik penggabungan tiba, GitHub hanya mengganti proses tertunda yang lebih lama dengan tip terbaru. Job matriks menggunakan `fail-fast: false`, dan `build-artifacts` melaporkan kegagalan saluran tertanam, batas dukungan inti, dan pemantauan gateway secara langsung alih-alih mengantrekan job pemverifikasi kecil. Kunci konkurensi Pipeline CI otomatis memiliki versi (`CI-v7-*`) agar zombie di sisi GitHub dalam grup antrean lama tidak dapat memblokir proses main yang lebih baru tanpa batas waktu. Proses suite lengkap manual menggunakan `CI-manual-v1-*` dan tidak membatalkan proses yang sedang berlangsung. Guard memori awal daftar plugin mempertahankan batas maksimum 350 MiB pada Blacksmith Linux yang di-host sendiri dan mengizinkan 425 MiB pada Linux yang di-host GitHub, yang baseline RSS-nya lebih tinggi untuk CLI hasil build yang sama.

Gunakan `pnpm ci:timings`, `pnpm ci:timings:recent`, atau `node scripts/ci-run-timings.mjs <run-id>` untuk merangkum waktu aktual, waktu antrean, job paling lambat, kegagalan, dan penghalang fanout `pnpm-store-warmup` dari GitHub Actions. Job `ci-timings-summary` dalam alur kerja tersedia di `ci.yml`, tetapi saat ini dinonaktifkan (`if: false`); sebagai gantinya, jalankan pembantu pengaturan waktu secara lokal. Untuk pengaturan waktu build, periksa langkah `Build dist` dari job `build-artifacts`: `pnpm build:ci-artifacts` mencetak `[build-all] phase timings:` dan menyertakan `ui:build`; job tersebut juga mengunggah artefak `startup-memory`.

## Konteks dan bukti PR

PR kontributor eksternal menjalankan gate konteks dan bukti PR dari
`.github/workflows/real-behavior-proof.yml`. Alur kerja melakukan checkout terhadap
revisi alur kerja tepercaya (`github.workflow_sha`) dan hanya mengevaluasi isi PR;
alur kerja tersebut tidak mengeksekusi kode dari cabang kontributor.

Gate berlaku bagi penulis PR yang bukan pemilik repositori, anggota,
kolaborator, atau bot. Gate lulus ketika isi PR memuat bagian
`What Problem This Solves` dan `Evidence` yang ditulis oleh penulis. Bukti dapat berupa pengujian
terfokus, hasil Pipeline CI, tangkapan layar, rekaman, keluaran terminal, pengamatan langsung,
log yang telah disunting, atau tautan artefak. Isi tersebut memberikan maksud dan validasi yang berguna;
reviewer memeriksa kode, pengujian, dan Pipeline CI untuk menilai kebenarannya.

Ketika pemeriksaan gagal, perbarui isi PR alih-alih mendorong commit kode lainnya.

## Cakupan dan perutean

Logika cakupan berada di `scripts/ci-changed-scope.mjs` dan dicakup oleh pengujian unit di `src/scripts/ci-changed-scope.test.ts`. Dispatch manual melewati deteksi cakupan yang berubah dan membuat manifes prapemeriksaan bertindak seolah-olah setiap area bercakupan telah berubah.

Alur kerja Periphery iOS dan macOS yang terpisah memberlakukan kebijakan kode mati tanpa temuan. Masing-masing hanya berjalan ketika pull request non-draf menyentuh cakupan pemindaian native-nya, atau ketika dijalankan secara manual.

- **Pengeditan alur kerja Pipeline CI** memvalidasi graf Pipeline CI Node, linting alur kerja, dan lane Windows (`ci.yml` mengeksekusinya), tetapi tidak dengan sendirinya memaksa build native iOS, Android, atau macOS; lane platform tersebut tetap dibatasi cakupannya pada perubahan sumber platform.
- **Kewarasan Alur Kerja** menjalankan `actionlint`, `zizmor` pada semua file YAML alur kerja, guard interpolasi composite action, dan guard penanda konflik. Job `security-fast` yang dicakup untuk PR juga menjalankan `zizmor` pada file alur kerja yang berubah agar temuan keamanan alur kerja gagal lebih awal dalam graf Pipeline CI utama.
- **Dokumentasi pada push `main`** diperiksa oleh alur kerja mandiri `Docs` dengan mirror dokumentasi ClawHub yang sama seperti yang digunakan oleh Pipeline CI, sehingga push campuran kode+dokumentasi tidak turut mengantrekan shard `check-docs` Pipeline CI. Pull request dan Pipeline CI manual tetap menjalankan `check-docs` dari Pipeline CI ketika dokumentasi berubah.
- **PTY TUI** berjalan di shard Node Linux `checks-node-core-runtime-tui-pty` untuk perubahan TUI. Shard tersebut menjalankan `test/vitest/vitest.tui-pty.config.ts` dengan `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`, sehingga mencakup lane fixture `TuiBackend` yang deterministik dan smoke `tui --local` yang lebih lambat serta hanya memalsukan endpoint model eksternal.
- **Pengeditan khusus perutean Pipeline CI, sekumpulan kecil fixture pengujian inti yang dijalankan langsung oleh tugas cepat, dan pengeditan sempit pembantu kontrak plugin** menggunakan jalur manifes cepat khusus Node: `preflight`, `security-fast`, dan hanya lane cepat yang disentuh perubahan tersebut — satu tugas perutean Pipeline CI `checks-fast-core`, dua shard kontrak plugin, atau keduanya. Jalur tersebut melewati artefak build, kompatibilitas Node 22, kontrak saluran, shard inti lengkap, shard plugin terpaket, dan matriks guard tambahan.
- **Pemeriksaan Node Windows** dibatasi cakupannya pada pembungkus proses/jalur khusus Windows, pembantu runner npm/pnpm/UI, konfigurasi pengelola paket, dan permukaan alur kerja Pipeline CI yang mengeksekusi lane tersebut; perubahan sumber, plugin, smoke instalasi, dan khusus pengujian yang tidak terkait tetap berada di lane Node Linux.

Keluarga pengujian Node yang paling lambat dipisahkan atau diseimbangkan agar setiap job tetap kecil tanpa mencadangkan runner secara berlebihan:

- Kontrak Plugin dan kontrak saluran masing-masing dijalankan sebagai dua shard berbobot yang didukung Blacksmith dengan fallback runner GitHub standar.
- Lane cepat/dukungan unit inti dijalankan secara terpisah; infrastruktur runtime inti dibagi menjadi shard proses, bersama, hook, rahasia, dan tiga domain cron.
- Balasan otomatis dijalankan sebagai worker yang seimbang, dengan subtree balasan dibagi menjadi shard agent-runner, perintah, dispatch, sesi, dan perutean status.
- Konfigurasi gateway/server agentik (control-plane) dibagi ke lane chat, autentikasi, model, HTTP/plugin, runtime, dan startup alih-alih menunggu artefak hasil build.
- CI normal hanya mengemas shard pola penyertaan infrastruktur terisolasi ke dalam bundel deterministik yang masing-masing berisi paling banyak 64 file pengujian, sehingga mengurangi matriks Node tanpa menggabungkan rangkaian perintah/cron yang tidak terisolasi, agents-core berstatus, atau gateway/server. Rangkaian berat yang tetap menggunakan 8 vCPU, sedangkan lane yang dibundel dan berbobot lebih rendah menggunakan 4 vCPU.
- Pull request pada repositori kanonis menggunakan kembali resolver pengujian yang berubah terhadap diff pohon gabungan sintetis. Perubahan yang presisi menjalankan satu job Node tertarget; setiap file pengujian yang dipilih mendapatkan prosesnya sendiri agar isolasi rangkaian berstatus tetap terjaga. Perencana menggabungkan pengujian sibling dengan dependen grafik impor dan kembali ke rencana rangkaian penuh ringkas 14 job yang sudah ada untuk perubahan paket workspace, paket/lockfile, harness bersama, konfigurasi terbagi, penggantian nama, atau penghapusan, perubahan kontrak ekstensi publik, pengujian dengan penyiapan shard khusus, target yang hanya terselesaikan sebagian atau kosong, rencana jalur atau target yang terlalu besar, dan kesalahan perencana. Rencana tertarget selalu mempertahankan gate batas artefak hasil build lengkap karena pemindai repositorinya tidak dapat diturunkan dari impor. Push `main` menjalankan rangkaian ringkas lengkap yang sama: event push perantara yang tertunda dapat digabungkan, sehingga proses terbaru yang tersisa harus memvalidasi pohon integrasi lengkap, bukan hanya diff satu push terakhirnya. Dispatch manual dan gate rilis mempertahankan matriks per shard lengkap yang bernama.
- Matriks Node lengkap menerima terlebih dahulu tooling serial yang secara konsisten lambat, shard perintah balasan otomatis, dan penulis cache core-fast yang luas. Hal ini mempertahankan batas 28 job sekaligus mencegah pekerjaan jalur kritis dan seed transformasi proses berikutnya tergeser ke gelombang selanjutnya.
- Pengujian browser, QA, media, dan Plugin lain-lain yang luas menggunakan konfigurasi Vitest khusus masing-masing, bukan penampung umum Plugin bersama. Shard pola penyertaan merekam entri waktu menggunakan nama shard CI, sehingga `.artifacts/vitest-shard-timings.json` dapat membedakan seluruh konfigurasi dari shard yang difilter.
- Job shard Linux Node mempertahankan cache modul sistem berkas eksperimental Vitest melalui API cache Actions upstream, yang dipercepat secara transparan oleh Blacksmith pada runner-nya. Setiap shard CI hanya melakukan pemulihan dan mengekstrak seed terlindungi ke root lokal runner-nya sendiri; wrapper shard kemudian memberikan subdirektori aktif yang terpisah kepada proses Vitest yang berjalan bersamaan. Hanya warmer harian yang tidak dibatalkan atau warmer yang di-dispatch secara eksplisit yang menyimpan arsip imutabel baru, sehingga pull request tidak dapat memublikasikan transformasi atau membuat keluarga cache per PR. Sidik jari input transformasi membersihkan generasi lockfile, paket, tsconfig, dan konfigurasi Vitest yang tidak kompatibel. Penulis terlindungi memindai dan memangkas cache yang dipulihkan menjadi 75% setelah ukurannya melampaui 2 GiB. Vitest melakukan hash terhadap id modul, konten sumber, lingkungan, dan konfigurasi transformasi yang telah di-resolve, sehingga perubahan parsial biasa pada sumber mempertahankan entri yang tidak berubah tetap hangat, sementara modul yang berubah mengalami cache miss secara aman. Prefiks pemulihan kasar menjembatani proses workflow; LRU cache Actions normal dan eviksi akibat tidak aktif membatasi arsip imutabel lama.
- Job Linux Node tepercaya juga mengikat penyimpanan pnpm dan `node_modules` dari satu disk dependensi terlindungi per lini Node yang didukung. Manifes paket, pengaturan instalasi, platform runner, dan patch Node yang tepat tidak disertakan dalam kunci disk; sidik jari runtime dan input instalasi yang tepat menentukan apakah suatu job menggunakan kembali pohon atau menginstal ulang dan memperbarui disk yang sama. Manifes dikanonisasi sebelum hashing. Hook root langsung yang diaudit hanya mempertahankan skrip siklus hidup instalasi pnpm, sehingga perubahan pemformatan dan skrip pengujian/build biasa mempertahankan pohon dependensi tetap hangat; pergeseran hook siklus hidup yang tidak diaudit gagal secara tertutup hingga input sumbernya disertakan dalam kontrak sidik jari. Perubahan dependensi, pengelola paket, sumber hook, dan lockfile selalu membatalkan snapshot. Pull request yang snapshot hanya-bacanya memiliki sidik jari berbeda melepaskan bind workspace dan melakukan instalasi ke penyimpanan lokal runner, sehingga menghindari penulisan lambat ke clone yang tidak dapat dipublikasikannya. Instalasi dingin sticky menonaktifkan percobaan ulang pengambilan internal pnpm dan melakukan hingga tiga percobaan instalasi penuh yang dibatasi dari penyimpanan yang semakin hangat; timeout tetap merupakan kegagalan. Setelah pemulihan yang tepat atau instalasi frozen-lockfile, penyiapan menonaktifkan pemeriksaan dependensi pra-proses pnpm yang redundan: repositori sengaja memangkas `node_modules` lokal Plugin, yang jika tidak dilakukan akan dianggap usang oleh pnpm dan diperbaiki melalui instalasi implisit serentak yang tidak aman selama fanout shard. Preflight main kanonis adalah satu-satunya penulis dan mengukur penyimpanan pada setiap pembaruan, menjalankan `pnpm store prune` hanya setelah versi paket yang dihentikan mendorong ukurannya melampaui 8 GiB. Publikasi snapshot Blacksmith berlangsung asinkron bahkan setelah job penulis selesai, sehingga proses pertama setelah kunci atau sidik jari baru dapat tetap dingin; pemulihan penanda tepat berikutnya menjadi bukti peluncuran. Job CI wajib dan pull request mendapatkan clone sekali pakai, sehingga perubahan dependensi tidak membuat disk baru, snapshot yang bersaing, atau penguncian cache yang dapat membatalkan build.
- Job shard Node dan artefak build juga memulihkan cache kompilasi portabel pada disk milik Node melalui cache Actions imutabel. Namespace `test` dan `build` yang independen mencegah penulisnya menggantikan arsip satu sama lain: warmer pengujian terjadwal memiliki seed pengujian terlindungi, sedangkan `build-artifacts` dapat memublikasikan paling banyak satu arsip build terlindungi per hari UTC dari push `main` tepercaya. PR dan job pengujian biasa hanya membaca snapshot terlindungi, sehingga bytecode cabang fitur tidak pernah masuk ke seed bersama dan lalu lintas PR tidak membuat arsip cache. Ini menggunakan kembali bytecode V8 untuk orkestrasi yang dimuat Node, tooling build, dan dependensi eksternal pada jalur checkout yang berbeda, termasuk ketika hanya sebagian grafik sumber yang berubah. Proses anak Vitest menonaktifkan cache kompilasi yang diwarisi karena cakupan dapat diaktifkan di dalam konfigurasi dinamis dan cakupan V8 dapat kehilangan presisi posisi sumber ketika skrip dideserialisasi dari bytecode.
- Job artefak build juga mempertahankan output langkah `build-all` yang diberi sidik jari konten. Deklarasi SDK Plugin yang dibangun sendiri oleh CI melakukan hash terhadap grafik sumber TypeScript/JSON lengkap milik repositori, mengecualikan direktori yang diinstal dan dihasilkan, serta memulihkan deklarasi datar dan bridge paket setelah `tsdown` membersihkan `dist`. Perubahan dokumentasi, workflow, Plugin, dan perubahan lain di luar grafik tersebut dapat menggunakan kembali snapshot deklarasi; perubahan sumber membangunnya ulang sebelum gate ekspor dijalankan.
- Build deklarasi lengkap membagi `tsdown` menjadi grup AI, paket workspace, dan terpadu. Setiap grup hanya menyimpan deklarasi dalam cache, lalu tetap membangun ulang JavaScript runtime sebelum memulihkan deklarasi tersebut. Karena itu, perubahan inti atau Plugin hanya membatalkan grafik terpadu yang besar, sedangkan perubahan paket workspace secara konservatif membatalkan setiap grup deklarasi dependen. Build publik lengkap umumnya menggunakan cache Actions imutabel; kunci pemulihan kasar menyemai perubahan parsial, sidik jari konten per grup menolak data usang, dan kuota cache GitHub mengeviksi generasi lama. Sebagai gantinya, lane mingguan Node 22 memublikasikan artefak 14 hari setelah proses `main` berhasil dan hanya memulihkan artefak yang identitas produsen imutabelnya di-resolve ke workflow tersebut pada `main`, sehingga menghindari pergantian kuota tanpa mengizinkan kode PR menulis cache bersama. Deklarasi QA privat tidak pernah dipertahankan dalam cache Actions karena namespace cache bukan batas kerahasiaan.
- `check-additional-*` membagi daftar penjaga batas tambahan (`scripts/run-additional-boundary-checks.mjs`) menjadi satu shard padat prompt (`check-additional-boundaries-a`, yang mencakup pemeriksaan pergeseran snapshot prompt Codex) dan satu shard gabungan untuk pembagian lainnya (`check-additional-boundaries-bcd`), masing-masing menjalankan penjaga independen secara bersamaan dan mencetak waktu per pemeriksaan. Pekerjaan kompilasi/canary batas paket tetap dikelompokkan, dan arsitektur topologi runtime dijalankan terpisah dari cakupan pemantauan gateway yang disematkan dalam `build-artifacts`.
- Pada runner build self-hosted 32-vCPU, pemantauan Gateway, pengujian saluran, dan shard batas dukungan inti dimulai bersama-sama di dalam `build-artifacts` setelah `dist/` dan `dist-runtime/` selesai dibangun. Proses fallback yang di-host GitHub mempertahankan pemantauan Gateway secara serial agar perebutan sumber daya inti yang rendah tidak menghabiskan tenggat kesiapan.

Setelah diterima, CI Linux kanonis mengizinkan hingga 28 job pengujian Node berjalan bersamaan dan
12 untuk lane cepat/pemeriksaan yang lebih kecil; Windows dan Android tetap dua karena
kumpulan runner tersebut lebih sempit. Batch seluruh konfigurasi yang ringkas berjalan dengan
timeout batch 120 menit, sedangkan grup pola penyertaan berbagi anggaran job terbatas
yang sama.

CI Android menjalankan `testPlayDebugUnitTest` dan `testThirdPartyDebugUnitTest`, lalu membangun APK debug Play. Flavor pihak ketiga tidak memiliki source set atau manifes terpisah; lane pengujian unitnya tetap mengompilasi flavor dengan flag BuildConfig SMS/log panggilan, sembari menghindari job pengemasan APK debug duplikat pada setiap push yang relevan dengan Android. Setiap tugas Gradle saat ini memiliki satu disk sticky terlindungi; job PR menggunakan clone sekali pakai, sedangkan proses terlindungi memperbarui entri Gradle beralamat konten secara langsung.

Kunci sticky-disk Blacksmith sengaja dibatasi berdasarkan dimensi runtime atau tugas yang didukung, tidak pernah berdasarkan nomor PR, commit, proses, cabang, atau hash dependensi. Cache transformasi dan kompilasi runtime menggunakan cache Actions, bukan sticky disk, karena arsip imutabel menyediakan hasil pemulihan/penyimpanan yang dapat diverifikasi dan menghindari kegagalan promosi snapshot yang dapat berubah. Setelah migrasi versi kunci sticky, tambahkan hanya identitas kunci, arsitektur, dan region usang yang tepat ke `.github/retired-sticky-disks.json`, dispatch `Sticky Disk Cleanup` dari `main` dengan dimensi dan konfirmasi yang sama, verifikasi penghapusan, lalu hapus entri tersebut. Workflow merutekan identitas ARM ke runner ARM, menolak ketidakcocokan region runner, menggunakan action penghapusan kunci tepat milik Blacksmith, dan tidak pernah menghapus cache builder Docker atau prefiks wildcard. Arsip cache Actions menggunakan LRU normal dan eviksi akibat tidak aktif.

Shard `check-dependencies` menjalankan pemeriksaan dependensi, file yang tidak digunakan, dan ekspor yang tidak digunakan pada kode produksi dengan Knip. Penjaga file yang tidak digunakan gagal ketika PR menambahkan file baru yang tidak digunakan dan belum ditinjau atau meninggalkan entri daftar izin yang usang, sekaligus mempertahankan permukaan Plugin dinamis, hasil generasi, build, pengujian langsung, dan bridge paket yang disengaja dan tidak dapat di-resolve Knip secara statis. Penjaga ekspor yang tidak digunakan mengecualikan file dukungan pengujian dan gagal pada setiap ekspor produksi yang tidak digunakan; konsumen dinamis yang disengaja harus dimodelkan dalam `config/knip.config.ts`. Target historis menjalankan penjaga ekspor jika menyediakannya dan mempertahankan fallback kode mati yang lebih lama jika tidak.

## Penerusan aktivitas ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` adalah bridge sisi target dari aktivitas repositori OpenClaw ke ClawSweeper. Workflow ini tidak melakukan checkout atau mengeksekusi kode pull request yang tidak tepercaya. Workflow membuat token GitHub App dari `CLAWSWEEPER_APP_PRIVATE_KEY`, lalu melakukan dispatch payload `repository_dispatch` yang ringkas ke `openclaw/clawsweeper`.

Workflow memiliki empat lane:

- `clawsweeper_item` untuk permintaan review issue dan pull request tertentu;
- `clawsweeper_comment` untuk perintah ClawSweeper eksplisit dalam komentar issue;
- `clawsweeper_commit_review` untuk permintaan review tingkat commit pada push `main`;
- `github_activity` untuk aktivitas GitHub umum yang dapat diperiksa oleh agen ClawSweeper.

Jalur `github_activity` hanya meneruskan metadata yang telah dinormalisasi: jenis peristiwa, tindakan, pelaku, repositori, nomor item, URL, judul, status, dan kutipan singkat untuk komentar atau review jika ada. Jalur ini sengaja menghindari penerusan seluruh isi webhook. Alur kerja penerima di `openclaw/clawsweeper` adalah `.github/workflows/github-activity.yml`, yang mengirimkan peristiwa yang telah dinormalisasi ke hook Gateway OpenClaw untuk agen ClawSweeper.

Aktivitas umum merupakan pengamatan, bukan pengiriman secara default. Agen ClawSweeper menerima target Discord dalam prompt-nya dan hanya boleh mengirim ke `#clawsweeper` ketika peristiwa tersebut mengejutkan, dapat ditindaklanjuti, berisiko, atau berguna secara operasional. Pembukaan rutin, pengeditan, aktivitas bot, derau webhook duplikat, dan lalu lintas review normal harus menghasilkan `NO_REPLY`.

Perlakukan judul, komentar, isi, teks review, nama cabang, dan pesan commit GitHub sebagai data yang tidak tepercaya di seluruh jalur ini. Semua itu merupakan masukan untuk peringkasan dan triase, bukan instruksi untuk alur kerja atau runtime agen.

## Pemicu manual

Pemicu Pipeline CI manual menjalankan grafik pekerjaan yang sama seperti Pipeline CI normal, tetapi mengaktifkan secara paksa setiap jalur tercakup non-Android: shard Node Linux, shard plugin bawaan, shard kontrak plugin dan kanal, kompatibilitas Node 22, `check-*`, `check-additional-*`, pemeriksaan smoke artefak hasil build, pemeriksaan dokumentasi, Skills Python, Windows, macOS, build iOS, dan i18n Control UI. Kesetaraan locale Control UI bersifat advisory pada PR otomatis dan proses `main` karena alur kerja penyegaran mandiri memperbaiki penyimpangan yang dihasilkan di latar belakang; pemeriksaan ini bersifat memblokir pada Pipeline CI manual dan karena itu juga pada Validasi Rilis Penuh. Persiapan rilis menjalankan sinkronisasi locale yang sama sebelum SHA Kode dibekukan, lalu memverifikasi status ketat tanpa fallback. Pemicu Pipeline CI manual mandiri menjalankan Android hanya dengan `include_android=true` (masukan `release_gate` juga memaksa Android); payung rilis penuh mengaktifkan Android dengan meneruskan `include_android=true`. Pemeriksaan statis prarilis plugin, shard khusus rilis `agentic-plugins`, penyisiran batch ekstensi penuh, dan jalur Docker prarilis plugin tidak disertakan dalam Pipeline CI. Rangkaian prarilis Docker hanya berjalan ketika `Full Release Validation` memicu alur kerja `Plugin Prerelease` yang terpisah dengan gerbang validasi rilis diaktifkan.

Pemeriksaan jumlah maksimum baris PR memperoleh baseline dari pohon merge sintetis yang telah di-checkout dan memverifikasi parent head-nya terhadap head peristiwa. Proses manual menggunakan grup konkurensi unik agar rangkaian lengkap kandidat rilis tidak dibatalkan oleh push atau proses PR lain pada ref yang sama. Masukan opsional `target_ref` memungkinkan pemanggil tepercaya menjalankan grafik tersebut terhadap cabang, tag, atau SHA commit lengkap sambil menggunakan berkas alur kerja dari ref pemicu yang dipilih; baseline jumlah maksimum baris dibandingkan dengan merge base target terhadap head cabang default yang ditentukan untuk proses tersebut. Masukan `release_gate` adalah fallback pengelola berbasis SHA persis untuk Pipeline CI PR yang terhambat kapasitas: masukan ini mengharuskan `target_ref` berupa SHA commit lengkap yang cocok dengan head cabang yang dipicu dan `pull_request_number` mengidentifikasi PR terbuka yang pohon merge-nya divalidasi.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

Jalur extended-stable bulanan khusus npm merupakan pengecualian: picu prapemeriksaan `OpenClaw NPM
Release` dan `Full Release Validation` dari cabang
`extended-stable/YYYY.M.33` yang persis, simpan ID proses keduanya, dan teruskan kedua ID tersebut ke
proses publikasi npm langsung. Lihat [Publikasi extended-stable bulanan khusus
npm](/id/reference/RELEASING#monthly-npm-only-extended-stable-publication) untuk
perintah, persyaratan identitas yang persis, pembacaan balik registri, dan prosedur
perbaikan pemilih. Jalur ini tidak memicu publikasi plugin, macOS, Windows, GitHub
Release, dist-tag privat, atau platform lainnya.

## Runner

| Runner                          | Pekerjaan                                                                                                                                                                                                                                                                              |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | `security-fast`, pemicu Pipeline CI manual dan fallback repositori nonkanonik, agregat QA Smoke, pemindaian keamanan dan kualitas CodeQL, pemeriksaan kewajaran alur kerja, pelabel, respons otomatis, alur kerja Dokumentasi mandiri, dan seluruh alur kerja Install Smoke                                |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `pnpm-store-warmup`, `native-i18n`, `checks-fast-core` kecuali Pipeline CI QA Smoke, shard kontrak plugin/kanal, sebagian besar shard Node Linux bawaan/berbobot lebih ringan, jalur `check-*` kecuali `check-lint`, shard `check-additional-*` tertentu, `check-docs`, dan `skills-python` |
| `blacksmith-8vcpu-ubuntu-2404`  | Rangkaian berat Node Linux yang dipertahankan, shard `check-additional-*` yang sarat batas/ekstensi, dan `android`                                                                                                                                                                             |
| `blacksmith-16vcpu-ubuntu-2404` | Shard Pipeline CI QA Smoke otomatis, `build-artifacts` dalam Pipeline CI dan Testbox, serta `check-lint` (cukup sensitif terhadap CPU sehingga 8 vCPU menimbulkan biaya lebih besar daripada penghematannya)                                                                                                                                  |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                  |
| `blacksmith-6vcpu-macos-15`     | `macos-node` pada `openclaw/openclaw`; fork menggunakan fallback ke `macos-15`                                                                                                                                                                                                                |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` dan `ios-build` pada `openclaw/openclaw`; fork menggunakan fallback ke `macos-26`                                                                                                                                                                                               |

## Anggaran pendaftaran runner

Bucket pendaftaran runner GitHub OpenClaw saat ini melaporkan 10.000 pendaftaran
runner yang dihosting sendiri per 5 menit dalam `ghx api rate_limit`. Periksa kembali
`actions_runner_registration` sebelum setiap tahap penyesuaian karena GitHub dapat mengubah
bucket ini. Batas tersebut digunakan bersama oleh semua pendaftaran runner Blacksmith dalam
organisasi `openclaw`, sehingga menambahkan instalasi Blacksmith lain tidak menambahkan
bucket baru.

Perlakukan label Blacksmith sebagai sumber daya langka untuk pengendalian lonjakan. Pekerjaan yang
hanya merutekan, memberi tahu, meringkas, memilih shard, atau menjalankan pemindaian CodeQL singkat harus
tetap menggunakan runner yang dihosting GitHub, kecuali memiliki kebutuhan khusus Blacksmith
yang terukur. Setiap matriks Blacksmith baru, `max-parallel` yang lebih besar, atau alur kerja
berfrekuensi tinggi harus menunjukkan jumlah pendaftaran terburuknya dan menjaga target tingkat organisasi
di bawah sekitar 60% dari bucket aktif. Dengan bucket 10.000 pendaftaran
saat ini, itu berarti target operasional 6.000 pendaftaran, dengan ruang cadangan untuk
repositori serentak, percobaan ulang, dan tumpang tindih lonjakan.

Rencana PR target-berubah mengurangi lonjakan umum pengujian Node dari 14 pendaftaran Blacksmith menjadi satu. PR berisiko luas mempertahankan fallback ringkas dengan 14 pendaftaran, sehingga kondisi terburuk tidak meningkat.

Pipeline CI repositori kanonik mempertahankan Blacksmith sebagai jalur runner default untuk proses push dan pull request normal. `workflow_dispatch` dan proses repositori nonkanonik menggunakan runner yang dihosting GitHub, tetapi proses kanonik normal saat ini tidak memeriksa kesehatan antrean Blacksmith atau secara otomatis menggunakan fallback ke label yang dihosting GitHub ketika Blacksmith tidak tersedia.

## Padanan lokal

```bash
pnpm changed:lanes                            # periksa pengklasifikasi jalur perubahan lokal untuk origin/main...HEAD
pnpm check:changed                            # gerbang pemeriksaan lokal cerdas: pemformatan/typecheck/lint/guard yang berubah berdasarkan jalur batas
pnpm check                                    # gerbang lokal cepat: tsgo produksi + lint terbagi dalam shard + guard cepat paralel
pnpm check:test-types
pnpm check:timed                              # gerbang yang sama dengan waktu per tahap
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1 node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts
pnpm test                                     # pengujian vitest
pnpm test:changed                             # target Vitest berubah yang cerdas dan ringan
pnpm test:ui                                  # rangkaian unit/browser Control UI
pnpm ui:i18n:check                            # kesetaraan locale Control UI yang dihasilkan (gerbang rilis)
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # format dokumentasi + lint + tautan rusak
pnpm build                                    # build dist saat pemeriksaan artefak/smoke Pipeline CI berpengaruh
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

`OpenClaw Performance` adalah alur kerja performa produk/runtime. Alur kerja ini berjalan setiap hari pada `main` dan dapat dipicu secara manual:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Pemicu manual biasanya melakukan tolok ukur pada ref alur kerja. Atur `target_ref` untuk melakukan tolok ukur pada tag rilis atau cabang lain dengan implementasi alur kerja saat ini. Jalur laporan yang dipublikasikan dan penunjuk terbaru ditentukan berdasarkan ref yang diuji, dan setiap `index.md` mencatat ref/SHA yang diuji, ref/SHA alur kerja, ref Kova, profil, mode autentikasi jalur, model, jumlah pengulangan, dan filter skenario.

Alur kerja menginstal OCM dari rilis yang dipasak dan Kova dari `openclaw/Kova` pada masukan `kova_ref` yang dipasak, lalu menjalankan tiga jalur:

- `mock-provider`: Skenario diagnostik Kova terhadap runtime hasil build lokal dengan autentikasi palsu deterministik yang kompatibel dengan OpenAI.
- `mock-deep-profile`: Pembuatan profil CPU/heap/trace untuk titik rawan startup, gateway, dan giliran agen. Berjalan sesuai jadwal, atau saat dikirim dengan `deep_profile=true`.
- `live-openai-candidate`: giliran agen `openai/gpt-5.6-luna` OpenAI yang nyata, dilewati saat `OPENAI_API_KEY` tidak tersedia. Berjalan sesuai jadwal, atau saat dikirim dengan `live_openai_candidate=true`.

Jalur penyedia tiruan juga menjalankan probe sumber native OpenClaw setelah proses Kova: waktu boot dan memori gateway pada kasus startup default, channel yang dilewati, hook internal, dan lima puluh plugin; RSS impor plugin bawaan, loop sapaan `channel-chat-baseline` OpenAI tiruan berulang, perintah startup CLI terhadap gateway yang telah di-boot, serta probe performa smoke status SQLite. Saat laporan sumber penyedia tiruan terpublikasi sebelumnya tersedia untuk ref yang diuji, ringkasan sumber membandingkan nilai RSS dan heap saat ini dengan baseline tersebut dan menandai peningkatan RSS yang besar sebagai `watch`. Ringkasan Markdown probe sumber berada di `source/index.md` dalam bundel laporan, dengan JSON mentah di sampingnya.

Setiap jalur mengunggah artefak GitHub lengkapnya, termasuk bundel CPU, heap, trace, dan diagnostik terkompresi. Pekerjaan penerbit terpisah mengunduh dan memvalidasi artefak tersebut, lalu membuat token GitHub App ClawSweeper berumur pendek yang cakupannya hanya pada konten `openclaw/clawgrit-reports` dan hanya meneruskannya ke langkah Git push. Pekerjaan ini melakukan commit terhadap `report.json`, `report.md`, `index.md`, artefak probe sumber, serta metadata/checksum bundel di bawah `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`; arsip diagnostik lengkap tetap berada di artefak Actions yang ditautkan. Penerbit menolak berkas laporan apa pun yang melebihi 50 MB sebelum mencoba melakukan push. Penunjuk ref teruji saat ini adalah `openclaw-performance/<tested-ref>/latest-<lane>.json`. Proses terjadwal dan pengiriman `profile=release` gagal jika pembuatan token aplikasi atau publikasi laporan gagal. Pengiriman manual nonrilis mempertahankan publikasi sebagai advisori dan menyimpan artefak GitHub saat autentikasi atau penerbitan gagal. Baseline sumber sebelumnya diambil secara anonim dari repositori laporan publik, sehingga pengambilan baseline yang berhasil tidak membuktikan autentikasi penerbit.

## Validasi Rilis Penuh

`Full Release Validation` adalah alur kerja payung manual untuk "menjalankan semuanya sebelum rilis." Alur ini menerima branch, tag, atau SHA commit lengkap, mengirim alur kerja manual `CI` dengan target tersebut (termasuk Android), mengirim `Plugin Prerelease` untuk pembuktian plugin/paket/statis/Docker khusus rilis, mengirim `OpenClaw Performance` terhadap SHA target, dan mengirim `OpenClaw Release Checks` untuk smoke instalasi, penerimaan paket, pemeriksaan paket lintas OS, paritas QA Lab, Matrix, Telegram, serta jalur Discord, WhatsApp, dan Slack berpagar (rendering scorecard kematangan advisori bersifat opsional melalui `run_maturity_scorecard`). Profil stabil dan penuh selalu mencakup cakupan soak jalur rilis Docker dan live/E2E menyeluruh; profil beta dapat menyertakannya dengan `run_release_soak=true`. E2E Telegram paket kanonis berjalan di dalam Penerimaan Paket, sehingga kandidat penuh tidak memulai poller live duplikat. Setelah penerbitan, teruskan `release_package_spec` untuk menggunakan kembali paket npm yang telah dirilis pada pemeriksaan rilis, Penerimaan Paket, Docker, lintas OS, dan Telegram tanpa melakukan build ulang. Gunakan `npm_telegram_package_spec` hanya untuk menjalankan ulang Telegram yang berfokus pada paket terpublikasi. Jalur paket live plugin Codex menggunakan status terpilih yang sama secara default: `release_package_spec=openclaw@<tag>` terpublikasi menghasilkan `codex_plugin_spec=npm:@openclaw/codex@<tag>`, sedangkan proses SHA/artefak mengemas `extensions/codex` dari ref terpilih. Tetapkan `codex_plugin_spec` secara eksplisit untuk sumber plugin khusus seperti spesifikasi `npm:`, `npm-pack:`, atau `git:`. Pembuktian agen live-nya mengirim progres yang terlihat, melanjutkan pembacaan workspace acak dan penulisan artefak yang persis, lalu mengirim penyelesaian.

Lihat [Validasi rilis penuh](/id/reference/full-release-validation) untuk
matriks tahap, nama pekerjaan alur kerja yang persis, perbedaan profil, artefak, dan
penanganan pengulangan terfokus.

`OpenClaw Release Publish` adalah alur kerja rilis manual yang melakukan mutasi. Kirim
penerbitan beta dan stabil reguler dari `main` tepercaya setelah tag rilis
tersedia dan setelah prapemeriksaan npm OpenClaw berhasil (prapemeriksaan menjalankan
`pnpm plugins:sync:check` di antara pemeriksaannya). Tag tetap memilih commit
rilis yang persis, termasuk commit pada `release/YYYY.M.PATCH`; penerbitan alfa
Tideclaw tetap menggunakan branch alfa yang sesuai. Alur ini memerlukan
`preflight_run_id` yang tersimpan serta
`full_release_validation_run_id` yang berhasil dan
`full_release_validation_run_attempt`-nya yang persis, mengirim `Plugin NPM Release` untuk semua
paket plugin yang dapat diterbitkan, mengirim `Plugin ClawHub Release` untuk
SHA rilis yang sama, dan baru setelah itu mengirim `OpenClaw NPM Release`. Penerbitan stabil juga
memerlukan `windows_node_tag` yang persis; alur kerja memverifikasi rilis sumber Windows
dan membandingkan penginstal x64/ARM64-nya dengan input
`windows_node_installer_digests` yang disetujui kandidat sebelum proses penerbitan turunan apa pun, lalu mempromosikan
dan memverifikasi digest penginstal tersemat yang sama beserta aset pendamping
dan kontrak checksum yang persis sebelum menerbitkan draf rilis GitHub.
Perbaikan khusus plugin yang terfokus menggunakan `plugin_publish_scope=selected` dengan
daftar paket yang tidak kosong. Proses `all-publishable` khusus plugin memerlukan prapemeriksaan npm
yang tidak dapat diubah dan bukti Validasi Rilis Penuh yang sama seperti penerbitan inti.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref main \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f full_release_validation_run_attempt=<successful-full-release-validation-run-attempt> \
  -f npm_dist_tag=beta
```

Untuk pembuktian commit tersemat pada branch yang bergerak cepat, gunakan pembantu alih-alih
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Ref pengiriman alur kerja GitHub harus berupa branch atau tag, bukan SHA commit mentah.
Pembantu mendorong branch sementara `release-ci/<sha>-...` pada SHA alur kerja
`main` tepercaya, meneruskan SHA target yang diminta melalui input alur kerja `ref`,
menggunakan kembali bukti target-persis yang ketat jika tersedia, memverifikasi `headSha` setiap
alur kerja turunan cocok dengan SHA alur kerja tepercaya, dan menghapus branch sementara
saat proses selesai. Teruskan `-f reuse_evidence=false` untuk memaksa
validasi baru. Pemverifikasi payung juga gagal jika ada alur kerja turunan yang berjalan
pada SHA alur kerja berbeda.

`release_profile` mengontrol cakupan live/penyedia yang diteruskan ke pemeriksaan rilis.
Alur kerja rilis manual secara default menggunakan `stable`; gunakan `full` hanya saat Anda
secara sengaja menginginkan matriks penyedia/media advisori yang luas. Pemeriksaan rilis
stabil dan penuh selalu menjalankan soak jalur rilis Docker serta live/E2E menyeluruh;
profil beta dapat menyertakannya dengan `run_release_soak=true`.

- `beta` mempertahankan jalur kritis rilis OpenAI/inti yang paling cepat.
- `stable` menambahkan kumpulan penyedia/backend stabil.
- `full` menjalankan matriks penyedia/media advisori yang luas.

Payung mencatat ID proses turunan yang dikirim, dan pekerjaan akhir `Verify full validation` memeriksa ulang kesimpulan proses turunan saat ini serta menambahkan tabel pekerjaan paling lambat untuk setiap proses turunan. Jika alur kerja turunan dijalankan ulang dan menjadi hijau, jalankan ulang hanya pekerjaan pemverifikasi induk untuk memperbarui hasil payung dan ringkasan waktu.

Untuk pemulihan, baik `Full Release Validation` maupun `OpenClaw Release Checks` menerima `rerun_group`. Gunakan `all` untuk kandidat rilis, `ci` hanya untuk turunan CI penuh normal, `plugin-prerelease` hanya untuk turunan prarilis plugin, `performance` hanya untuk turunan Performa OpenClaw, `release-checks` untuk setiap turunan rilis, atau grup yang lebih sempit: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, atau `npm-telegram` pada payung. Hal ini menjaga pengulangan kotak rilis yang gagal tetap terbatas setelah perbaikan terfokus. Untuk satu jalur lintas OS yang gagal, gabungkan `rerun_group=cross-os` dengan `cross_os_suite_filter`, misalnya `windows/packaged-upgrade`; perintah lintas OS yang lama mengeluarkan baris Heartbeat dan ringkasan upgrade terpaket menyertakan waktu per fase. Jalur QA Matrix dan Telegram terpilih memblokir validasi rilis normal, begitu pula gerbang cakupan alat runtime standar. Paritas QA, paritas runtime, serta jalur live Discord, WhatsApp, dan Slack berpagar bersifat advisori.

`OpenClaw Release Checks` menggunakan ref alur kerja tepercaya untuk menyelesaikan ref terpilih satu kali menjadi tarball `release-package-under-test`, lalu meneruskan artefak tersebut ke pemeriksaan lintas OS dan Penerimaan Paket, serta alur kerja Docker jalur rilis live/E2E saat cakupan soak berjalan. Hal ini menjaga byte paket tetap konsisten di seluruh kotak rilis dan menghindari pengemasan ulang kandidat yang sama dalam beberapa pekerjaan turunan. Untuk jalur live plugin npm Codex, pemeriksaan rilis meneruskan spesifikasi plugin terpublikasi yang cocok dan dihasilkan dari `release_package_spec`, meneruskan `codex_plugin_spec` yang disediakan operator, atau membiarkan input kosong agar skrip Docker mengemas plugin Codex dari checkout terpilih.

Proses `Full Release Validation` duplikat untuk `ref=main` dan `rerun_group=all`
menggantikan payung yang lebih lama. Monitor induk membatalkan setiap alur kerja turunan yang
telah dikirimnya saat induk dibatalkan, sehingga validasi main yang lebih baru
tidak tertahan di belakang proses pemeriksaan rilis dua jam yang usang. Validasi
branch/tag rilis dan grup pengulangan terfokus mempertahankan `cancel-in-progress: false`.

## Shard live dan E2E

Turunan live/E2E rilis mempertahankan cakupan native `pnpm test:live` yang luas, tetapi menjalankannya sebagai shard bernama melalui `scripts/test-live-shard.mjs`, bukan sebagai satu pekerjaan serial:

- `native-live-src-agents` dan `native-live-src-agents-zai-coding`
- `native-live-src-gateway-core`
- pekerjaan `native-live-src-gateway-profiles` yang difilter berdasarkan penyedia
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

Hal ini mempertahankan cakupan berkas yang sama sekaligus membuat kegagalan penyedia live yang lambat lebih mudah dijalankan ulang dan didiagnosis. Nama shard agregat `native-live-src-gateway`, `native-live-extensions-o-z`, `native-live-extensions-media`, dan `native-live-extensions-media-music` tetap valid untuk pengulangan manual satu kali.

Shard media live native berjalan di `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, yang dibangun oleh alur kerja `Live Media Runner Image`. Image tersebut telah memasang `ffmpeg` dan `ffprobe`; pekerjaan media hanya memverifikasi biner sebelum penyiapan. Pertahankan suite live berbasis Docker pada runner Blacksmith normal — pekerjaan container bukan tempat yang tepat untuk meluncurkan pengujian Docker bertingkat.

Shard model/backend live berbasis Docker menggunakan image bersama `ghcr.io/openclaw/openclaw-live-test:<sha>-<extensions>` yang terpisah untuk setiap commit terpilih. Alur kerja rilis live membangun dan mendorong image tersebut satu kali, lalu shard model live Docker, gateway yang di-shard berdasarkan penyedia, backend CLI, pengikatan ACP, dan harness Codex berjalan dengan `OPENCLAW_SKIP_DOCKER_BUILD=1`. Shard Docker Gateway membawa batas `timeout` tingkat skrip yang eksplisit di bawah batas waktu pekerjaan alur kerja agar container atau jalur pembersihan yang macet gagal dengan cepat alih-alih menghabiskan seluruh anggaran pemeriksaan rilis. Jika shard tersebut membangun ulang target Docker sumber lengkap secara terpisah, proses rilis salah konfigurasi dan akan membuang waktu nyata untuk build image duplikat.

## Penerimaan Paket

Gunakan `Package Acceptance` saat pertanyaannya adalah "apakah paket OpenClaw yang dapat diinstal ini berfungsi sebagai produk?" Ini berbeda dari CI normal: CI normal memvalidasi pohon sumber, sedangkan penerimaan paket memvalidasi satu tarball melalui harness E2E Docker yang sama dengan yang digunakan pengguna setelah instalasi atau pembaruan.

### Pekerjaan

1. `resolve_package` melakukan checkout `workflow_ref`, menyelesaikan satu kandidat paket, menulis `.artifacts/docker-e2e-package/openclaw-current.tgz`, menulis `.artifacts/docker-e2e-package/package-candidate.json`, mengunggah keduanya sebagai artefak `package-under-test`, serta mencetak sumber, ref alur kerja, ref paket, versi, SHA-256, dan profil dalam ringkasan langkah GitHub.
2. `package_integrity` mengunduh artefak `package-under-test` dan memberlakukan kontrak tarball paket publik dengan `scripts/check-openclaw-package-tarball.mjs`.
3. `docker_acceptance` memanggil `openclaw-live-and-e2e-checks-reusable.yml` dengan SHA sumber paket yang telah diselesaikan (menggunakan `workflow_ref` sebagai cadangan) dan `package_artifact_name=package-under-test`. Alur kerja yang dapat digunakan kembali tersebut mengunduh artefak itu, memvalidasi inventaris tarball, menyiapkan image Docker berdasarkan digest paket bila diperlukan, dan menjalankan lane Docker yang dipilih terhadap paket tersebut alih-alih mengemas checkout alur kerja. Ketika sebuah profil memilih beberapa `docker_lanes` yang ditargetkan, alur kerja yang dapat digunakan kembali menyiapkan paket dan image bersama satu kali, lalu menyebarkan lane tersebut sebagai tugas Docker bertarget paralel dengan artefak unik.
4. `package_telegram` secara opsional memanggil `NPM Telegram Beta E2E`. Ini berjalan ketika `telegram_mode` bukan `none` dan menginstal artefak `package-under-test` yang sama ketika Package Acceptance berhasil menyelesaikannya; pengiriman Telegram mandiri tetap dapat menginstal spesifikasi npm yang telah dipublikasikan.
5. `summary` menggagalkan alur kerja jika penyelesaian paket, integritas, penerimaan Docker, atau lane Telegram opsional gagal. Input `advisory` menurunkan kegagalan penerimaan menjadi peringatan bagi pemanggil yang bersifat advis.

### Sumber kandidat

- `source=npm` hanya menerima `openclaw@extended-stable`, `openclaw@beta`, `openclaw@latest`, atau versi rilis OpenClaw yang persis seperti `openclaw@2026.4.27-beta.2`. Gunakan ini untuk penerimaan extended-stable, prarilis, atau stabil yang telah dipublikasikan.
- `source=ref` mengemas cabang, tag, atau SHA commit lengkap `package_ref` yang tepercaya. Resolver mengambil cabang/tag OpenClaw, memverifikasi bahwa commit yang dipilih dapat dijangkau dari riwayat cabang repositori atau tag rilis, menginstal dependensi dalam worktree terpisah, dan mengemasnya dengan `scripts/package-openclaw-for-docker.mjs`.
- `source=url` mengunduh `.tgz` HTTPS publik; `package_sha256` wajib diisi. Jalur ini menolak kredensial URL, port HTTPS non-default, nama host atau IP hasil resolusi yang bersifat privat/internal/penggunaan khusus, serta pengalihan yang berada di luar kebijakan keamanan publik yang sama.
- `source=trusted-url` mengunduh `.tgz` HTTPS dari kebijakan sumber tepercaya bernama di `.github/package-trusted-sources.json`; `package_sha256` dan `trusted_source_id` wajib diisi. Gunakan ini hanya untuk mirror perusahaan milik pengelola atau repositori paket privat yang memerlukan host, port, prefiks jalur, host pengalihan, atau resolusi jaringan privat yang telah dikonfigurasi. Jika kebijakan menyatakan autentikasi bearer, alur kerja menggunakan secret tetap `OPENCLAW_TRUSTED_PACKAGE_TOKEN`; kredensial yang disematkan dalam URL tetap ditolak.
- `source=artifact` mengunduh satu `.tgz` dari `artifact_run_id` dan `artifact_name`; `package_sha256` bersifat opsional tetapi sebaiknya diberikan untuk artefak yang dibagikan secara eksternal.

Pisahkan `workflow_ref` dan `package_ref`. `workflow_ref` adalah kode alur kerja/harness tepercaya yang menjalankan pengujian. `package_ref` adalah commit sumber yang dikemas ketika `source=ref`. Dengan demikian, harness pengujian saat ini dapat memvalidasi commit sumber tepercaya yang lebih lama tanpa menjalankan logika alur kerja lama.

### Profil rangkaian pengujian

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `root-managed-vps-upgrade`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — kumpulan `package` dengan cakupan `plugins` langsung sebagai pengganti `plugins-offline`, ditambah `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — bagian jalur rilis Docker lengkap dengan OpenWebUI
- `custom` — `docker_lanes` yang persis; wajib ketika `suite_profile=custom`

Profil `package` menggunakan cakupan plugin luring agar validasi paket yang telah dipublikasikan tidak bergantung pada ketersediaan ClawHub langsung. Lane Telegram opsional menggunakan kembali artefak `package-under-test` dalam `NPM Telegram Beta E2E`, sedangkan jalur spesifikasi npm yang telah dipublikasikan dipertahankan untuk pengiriman mandiri.

Untuk kebijakan khusus pengujian pembaruan dan plugin, termasuk perintah lokal,
lane Docker, input Package Acceptance, default rilis, dan triase kegagalan,
lihat [Menguji pembaruan dan plugin](/id/help/testing-updates-plugins).

Pemeriksaan rilis memanggil Package Acceptance dengan `source=artifact`, artefak paket rilis yang telah disiapkan, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape'`, dan `telegram_mode=mock-openai`. Hal ini menjaga migrasi paket, pembaruan, instalasi skill ClawHub langsung, pembersihan dependensi plugin usang, perbaikan instalasi plugin yang dikonfigurasi, plugin luring, pembaruan plugin, dan bukti Telegram pada tarball paket terselesaikan yang sama. Tetapkan `release_package_spec` pada Full Release Validation atau OpenClaw Release Checks setelah memublikasikan beta untuk menjalankan matriks yang sama terhadap paket npm yang telah dirilis tanpa membangun ulang; tetapkan `package_acceptance_package_spec` hanya ketika Package Acceptance memerlukan paket yang berbeda dari validasi rilis lainnya. Pemeriksaan rilis lintas OS tetap mencakup onboarding, penginstal, dan perilaku platform khusus OS; validasi produk paket/pembaruan harus dimulai dengan Package Acceptance.

Lane Docker `published-upgrade-survivor` memvalidasi satu baseline paket yang telah dipublikasikan per proses pada jalur rilis yang memblokir. Dalam Package Acceptance, tarball `package-under-test` yang telah diselesaikan selalu menjadi kandidat dan `published_upgrade_survivor_baseline` memilih baseline publikasi cadangan, dengan default `openclaw@latest`; perintah untuk menjalankan ulang lane yang gagal mempertahankan baseline tersebut. Full Release Validation dengan `run_release_soak=true` atau `release_profile=full` menetapkan `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` dan `published_upgrade_survivor_scenarios=reported-issues` untuk memperluas cakupan ke empat rilis npm stabil terbaru beserta rilis batas kompatibilitas plugin yang disematkan dan fixture berbentuk isu untuk konfigurasi Feishu, file bootstrap/persona yang dipertahankan, instalasi plugin OpenClaw yang dikonfigurasi, jalur log tilde, dan root dependensi plugin lama yang usang. Pilihan penyintas peningkatan publikasi multi-baseline dibagi berdasarkan baseline ke dalam tugas runner Docker bertarget yang terpisah. Alur kerja `Update Migration` yang terpisah menggunakan lane Docker `update-migration` dengan baseline `all-since-2026.4.23` dan skenario `plugin-deps-cleanup` ketika kebutuhan utamanya adalah pembersihan pembaruan publikasi secara menyeluruh, bukan cakupan Full Release CI normal. Proses agregat lokal dapat meneruskan spesifikasi paket yang persis dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, mempertahankan satu lane dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` seperti `openclaw@2026.4.15`, atau menetapkan `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` untuk matriks skenario. Lane publikasi mengonfigurasi baseline dengan resep perintah `openclaw config set` yang telah ditanamkan, mencatat langkah-langkah resep dalam `summary.json`, serta memeriksa `/healthz`, `/readyz`, dan status RPC setelah Gateway dimulai. Lane baru untuk paket dan penginstal Windows juga memverifikasi bahwa paket yang terinstal dapat mengimpor penggantian kontrol browser dari jalur absolut Windows mentah. Smoke giliran agen OpenAI lintas OS secara default menggunakan `OPENCLAW_CROSS_OS_OPENAI_MODEL` jika ditetapkan, atau `openai/gpt-5.6-luna` jika tidak, sehingga bukti instalasi dan Gateway menggunakan tingkat pengujian GPT-5.6 yang lebih hemat biaya.

### Rentang kompatibilitas lama

Package Acceptance memiliki rentang kompatibilitas lama yang terbatas untuk paket yang telah dipublikasikan. Paket hingga `2026.4.25`, termasuk `2026.4.25-beta.*`, dapat menggunakan jalur kompatibilitas:

- entri QA privat yang diketahui dalam `dist/postinstall-inventory.json` dapat menunjuk ke file yang tidak disertakan dalam tarball;
- `doctor-switch` dapat melewati subkasus persistensi `gateway install --wrapper` ketika paket tidak mengekspos flag tersebut;
- `update-channel-switch` dapat memangkas `patchedDependencies` pnpm yang hilang dari fixture git palsu yang berasal dari tarball dan dapat mencatat `update.channel` persisten yang hilang;
- smoke plugin dapat membaca lokasi catatan instalasi lama atau menerima tidak adanya persistensi catatan instalasi marketplace;
- `plugin-update` dapat mengizinkan migrasi metadata konfigurasi sambil tetap mewajibkan catatan instalasi dan perilaku tanpa instalasi ulang tetap tidak berubah.

Paket `2026.4.26` yang telah dipublikasikan juga dapat memberikan peringatan untuk file stempel metadata build lokal yang sudah dirilis, dan paket hingga `2026.5.20` dapat memberikan peringatan alih-alih gagal ketika `npm-shrinkwrap.json` tidak ada. Paket yang lebih baru harus memenuhi kontrak modern; kondisi yang sama akan gagal, bukan memberikan peringatan atau dilewati.

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

# Validasi paket extended-stable yang telah dipublikasikan dengan cakupan paket.
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

Saat men-debug proses Package Acceptance yang gagal, mulailah dari ringkasan `resolve_package` untuk mengonfirmasi sumber paket, versi, dan SHA-256. Kemudian periksa proses turunan `docker_acceptance` dan artefak Dockernya: `.artifacts/docker-tests/**/summary.json`, `failures.json`, log lane, waktu fase, dan perintah untuk menjalankan ulang. Utamakan menjalankan ulang profil paket yang gagal atau lane Docker yang persis daripada menjalankan ulang validasi rilis lengkap.

## Smoke instalasi

Alur kerja `Install Smoke` tidak lagi berjalan pada pull request atau push `main`. Wrapper malam/manual dan validasi rilisnya sama-sama memanggil inti baca-saja `install-smoke-reusable.yml`, dan setiap proses menempuh jalur smoke instalasi lengkap pada runner yang dihosting GitHub:

- Image smoke Dockerfile root dibangun satu kali per SHA target, diikat ke revisi alur kerja dan percobaan produsen dalam artefak yang tidak dapat diubah, lalu dimuat oleh smoke CLI, smoke CLI penghapusan ruang kerja bersama agen, E2E jaringan Gateway kontainer, dan smoke argumen build plugin `matrix` yang dibundel. Smoke plugin memverifikasi pencerminan instalasi dependensi runtime dan bahwa plugin dimuat tanpa diagnostik pelolosan entri.
- Instalasi paket QR serta smoke Docker penginstal/pembaruan (termasuk lane penginstal Rocky Linux dan lane pembaruan terhadap baseline npm `update_baseline_version` yang dapat dikonfigurasi) berjalan sebagai tugas terpisah agar pekerjaan penginstal tidak menunggu di belakang smoke image root.

Smoke penyedia gambar untuk instalasi global Bun yang lambat dipagari secara terpisah oleh `run_bun_global_install_smoke`. Proses ini berjalan pada jadwal malam, aktif secara default untuk pemanggilan workflow dari pemeriksaan rilis, dan dispatch manual `Install Smoke` dapat memilih untuk menyertakannya. CI PR normal tetap menjalankan lane regresi peluncur Bun yang cepat untuk perubahan yang relevan dengan Node. Pengujian Docker QR dan penginstal tetap menggunakan Dockerfile masing-masing yang berfokus pada instalasi.

## E2E Docker Lokal

`pnpm test:docker:all` melakukan prapembuatan satu image pengujian langsung bersama, mengemas OpenClaw satu kali sebagai tarball npm, dan membangun dua image `scripts/e2e/Dockerfile` bersama:

- runner Node/Git dasar untuk lane penginstal/pembaruan/dependensi plugin;
- image fungsional yang menginstal tarball yang sama ke dalam `/app` untuk lane fungsionalitas normal.

Definisi lane Docker berada di `scripts/lib/docker-e2e-scenarios.mjs`, logika perencana berada di `scripts/lib/docker-e2e-plan.mjs`, dan runner hanya mengeksekusi rencana yang dipilih. Penjadwal memilih image per lane dengan `OPENCLAW_DOCKER_E2E_BARE_IMAGE` dan `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, lalu menjalankan lane dengan `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Parameter yang Dapat Disesuaikan

| Variabel                               | Default | Tujuan                                                                                       |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Jumlah slot pool utama untuk lane normal.                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Jumlah slot pool akhir yang sensitif terhadap penyedia.                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Batas lane langsung serentak agar penyedia tidak melakukan pembatasan.                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5       | Batas lane instalasi npm serentak.                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Batas lane multilayanan serentak.                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Jeda antarawal lane untuk menghindari lonjakan pembuatan oleh daemon Docker; atur `0` agar tanpa jeda.     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Batas waktu cadangan per lane (120 menit); lane langsung/akhir tertentu menggunakan batas yang lebih ketat.           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | tidak diatur   | `1` mencetak rencana penjadwal tanpa menjalankan lane.                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | tidak diatur   | Daftar lane persis yang dipisahkan koma; melewati smoke pembersihan agar agen dapat mereproduksi satu lane yang gagal. |

Lane yang lebih berat daripada batas efektifnya masih dapat dimulai dari pool kosong, lalu berjalan sendiri hingga melepaskan kapasitas. Agregat lokal melakukan prapemeriksaan Docker, menghapus container E2E OpenClaw yang kedaluwarsa, menampilkan status lane aktif, menyimpan pengaturan waktu lane untuk pengurutan dari yang terlama, dan secara default berhenti menjadwalkan lane pool baru setelah kegagalan pertama.

### Workflow langsung/E2E yang Dapat Digunakan Kembali

Workflow langsung/E2E yang dapat digunakan kembali menanyakan kepada `scripts/test-docker-all.mjs --plan-json` paket, jenis image, image langsung, lane, dan cakupan kredensial yang diperlukan. `scripts/docker-e2e.mjs` kemudian mengubah rencana tersebut menjadi output dan ringkasan GitHub. Workflow ini mengemas OpenClaw melalui `scripts/package-openclaw-for-docker.mjs`, mengunduh artefak paket dari proses saat ini, atau mengunduh artefak paket dari `package_artifact_run_id`, lalu memvalidasi inventaris tarball. Jalur default `no-push-artifact` membangun image dasar/fungsional bertag digest paket melalui cache lapisan Docker Blacksmith, mengemas byte image yang persis sama ke dalam artefak workflow yang tidak dapat diubah, dan meminta setiap konsumen memverifikasi serta memuat artefak tersebut. Sebagai gantinya, `existing-only` memerlukan referensi GHCR `docker_e2e_bare_image`/`docker_e2e_functional_image` yang eksplisit dan tidak pernah membangun atau mendorong image. Penarikan registry tersebut menggunakan batas waktu 180 detik per upaya agar stream yang macet segera dicoba ulang alih-alih menghabiskan sebagian besar jalur kritis CI. Setelah validasi terjadwal berhasil, `openclaw-scheduled-live-checks.yml` meneruskan manifes image teruji yang tidak dapat diubah kepada penerbit penulisan paket terpisah; pemanggil rilis dan prarilis hanya-baca tidak pernah melewati penulis tersebut.

### Potongan Jalur Rilis

Cakupan Docker rilis menjalankan job berpotongan yang lebih kecil dengan `OPENCLAW_SKIP_DOCKER_BUILD=1` sehingga setiap potongan hanya memverifikasi dan memuat jenis image berbasis artefak yang diperlukannya (atau menariknya melalui penggunaan kembali `existing-only` yang eksplisit) dan mengeksekusi beberapa lane melalui penjadwal berbobot yang sama:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | openwebui`

Potongan Docker rilis saat ini adalah `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a` hingga `plugins-runtime-install-h`, dan `openwebui`. `package-update-openai` mencakup lane paket plugin Codex langsung, yang menginstal paket kandidat OpenClaw, menginstal plugin Codex dari `codex_plugin_spec` atau tarball dengan referensi yang sama dengan persetujuan eksplisit untuk menginstal Codex CLI, menjalankan prapemeriksaan Codex CLI dan giliran agen dalam sesi yang sama, lalu menjalankan giliran pemikiran menengah tanpa percobaan ulang yang mengirimkan progres, membaca masukan ruang kerja yang diacak, menulis artefak persisnya, dan mengirimkan penyelesaian. `plugins-runtime-core`, `plugins-runtime`, dan `plugins-integrations` tetap menjadi alias agregat plugin/runtime. Alias lane `install-e2e` tetap menjadi alias pengulangan manual agregat untuk kedua lane penginstal penyedia.

OpenWebUI berjalan sebagai potongan mandiri `openwebui` pada runner Blacksmith khusus dengan disk besar setiap kali cakupan jalur rilis stabil atau penuh memintanya, bahkan ketika workflow yang dapat digunakan kembali mengarahkan job yang didukung ke runner yang dihosting GitHub. Memisahkan penarikan image eksternal mencegah image besar bersaing dengan image paket dan plugin bersama di `plugins-runtime-services`; potongan agregat plugin/runtime lama tetap menyertakan OpenWebUI untuk pengulangan manual yang kompatibel. Lane pembaruan kanal terpaket mencoba ulang satu kali untuk kegagalan jaringan npm sementara.

Setiap potongan mengunggah `.artifacts/docker-tests/` dengan log lane, pengaturan waktu, `summary.json`, `failures.json`, pengaturan waktu fase, JSON rencana penjadwal, tabel lane lambat, dan perintah pengulangan per lane. Input workflow `docker_lanes` menjalankan lane yang dipilih terhadap image yang disiapkan untuk proses tersebut, bukan melalui job potongan, sehingga proses debug lane yang gagal tetap dibatasi pada satu job Docker yang ditargetkan; jika lane yang dipilih adalah lane Docker langsung, job yang ditargetkan membangun image pengujian langsung secara lokal untuk pengulangan tersebut. Pembantu pengulangan memvalidasi SHA target terpilih yang persis dari artefak kegagalan dan dispatch manual mengemas ulang referensi tersebut karena tuple paket workflow internal yang dapat digunakan kembali bukan bagian dari skema `workflow_dispatch`. Perintah yang dihasilkan menyertakan input image yang disiapkan dan `shared_image_policy=existing-only` hanya jika input tersebut didukung GHCR; tag artefak lokal runner dihilangkan agar runner baru membangunnya kembali. Penggantian target yang eksplisit membuang referensi image GHCR yang dipulihkan kecuali artefak membuktikan bahwa referensi tersebut cocok dengan penggantian. Referensi definisi workflow yang dihasilkan artefak juga dihilangkan karena cabang sementara rilis penuh dihapus; dispatch menggunakan cabang default repositori kecuali operator menggantinya secara eksplisit.

```bash
pnpm test:docker:rerun <run-id>      # unduh artefak Docker dan cetak perintah pengulangan gabungan/per lane yang ditargetkan
pnpm test:docker:timings <summary>   # ringkasan jalur kritis lane lambat dan fase
```

Workflow langsung/E2E terjadwal menjalankan rangkaian Docker jalur rilis penuh setiap hari dan, setelah berhasil, memanggil penerbit eksplisit untuk artefak image persis yang telah diuji.

## Prarilis Plugin

`Plugin Prerelease` merupakan cakupan produk/paket yang lebih mahal, sehingga menjadi workflow terpisah yang didispatch oleh `Full Release Validation` atau operator eksplisit. Pull request normal, pendorongan `main`, dan dispatch CI manual mandiri menonaktifkan rangkaian tersebut. Workflow ini menyeimbangkan pengujian plugin terpaket di delapan worker ekstensi; job shard ekstensi tersebut menjalankan hingga dua grup konfigurasi plugin sekaligus dengan satu worker Vitest per grup dan heap Node yang lebih besar agar batch plugin dengan banyak impor tidak membuat job CI tambahan. Jalur prarilis Docker khusus rilis (diaktifkan oleh input `full_release_validation`) mengelompokkan lane Docker yang ditargetkan dalam grup berisi empat agar tidak mencadangkan puluhan runner untuk job berdurasi satu hingga tiga menit. Workflow tersebut juga mengunggah artefak informasional `plugin-inspector-advisory` dari `@openclaw/plugin-inspector`; temuan pemeriksa merupakan masukan triase dan tidak mengubah gerbang pemblokiran Prarilis Plugin.

## QA Lab

QA Lab memiliki lane CI khusus di luar workflow utama dengan cakupan cerdas. Paritas agentik berada di bawah harness QA dan rilis yang luas, bukan sebagai workflow PR mandiri. Gunakan `Full Release Validation` dengan `rerun_group=qa-parity` saat paritas harus disertakan dalam proses validasi yang luas.

- Workflow `QA-Lab - All Lanes` berjalan setiap malam pada `main` dan saat dispatch manual; workflow ini menyebar menjadi job paritas tiruan serta job langsung Matrix, Telegram, Discord, WhatsApp, dan Slack. Job langsung menggunakan lingkungan `qa-live-shared`; Telegram, Discord, WhatsApp, dan Slack menggunakan sewa Convex, sedangkan Matrix menyediakan kredensial lokal sekali pakai.

Pemeriksaan rilis menjalankan lane transport langsung Matrix dan Telegram dengan penyedia tiruan deterministik dan model yang memenuhi syarat tiruan (`mock-openai/gpt-5.6-luna` dan `mock-openai/gpt-5.6-luna-alt`) sehingga kontrak kanal terisolasi dari latensi model langsung dan startup plugin penyedia normal. Gateway transport langsung menonaktifkan pencarian memori karena paritas QA mencakup perilaku memori secara terpisah; konektivitas penyedia dicakup oleh rangkaian model langsung, penyedia native, dan penyedia Docker yang terpisah.

Gerbang Matrix terjadwal dan rilis menggunakan host rangkaian QA Lab bersama dan adaptor langsung dengan skenario rilis. Default CLI dan input workflow manual tetap `all`; dispatch manual `all` menyebar ke profil `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, dan `e2ee-cli` agar pembuktian 93 skenario tetap berada dalam batas waktu per job. Dispatch manual terfokus memilih `fast`, `release`, atau `transport` dalam satu job.

`OpenClaw Release Checks` juga menjalankan lane QA Lab yang kritis bagi rilis sebelum persetujuan rilis; gerbang paritas QA menjalankan paket kandidat dan baseline sebagai job lane paralel, lalu mengunduh kedua artefak ke dalam job laporan kecil untuk perbandingan paritas akhir.

Untuk PR normal, ikuti bukti CI/pemeriksaan yang tercakup alih-alih menganggap paritas sebagai status wajib.

## CodeQL

Workflow `CodeQL` sengaja dirancang sebagai pemindai keamanan tahap pertama yang sempit, bukan pemindaian repositori penuh. Proses harian, manual, pendorongan `main`, dan penjagaan pull request non-draf memindai kode workflow Actions serta permukaan JavaScript/TypeScript dengan risiko tertinggi menggunakan kueri keamanan berkeyakinan tinggi yang difilter ke `security-severity` tinggi/kritis.

Penjagaan pull request tetap ringan: proses ini hanya dimulai untuk perubahan di bawah `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, `scripts`, `src`, atau jalur runtime plugin terpaket yang memiliki proses, dan menjalankan matriks keamanan berkeyakinan tinggi yang sama seperti workflow terjadwal. CodeQL Android dan macOS tetap tidak disertakan dalam default PR.

### Kategori keamanan

| Kategori                                          | Permukaan                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Autentikasi, rahasia, sandbox, cron, dan garis dasar gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Kontrak implementasi kanal inti beserta runtime plugin kanal, gateway, SDK Plugin, rahasia, dan titik sentuh audit              |
| `/codeql-security-high/network-ssrf-boundary`     | Permukaan kebijakan SSRF inti, penguraian IP, pengaman jaringan, pengambilan web, dan SSRF SDK Plugin                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | Server MCP, pembantu eksekusi proses, pengiriman keluar, dan gerbang eksekusi alat agen                                           |
| `/codeql-security-high/process-exec-boundary`     | Shell lokal, pembantu pemunculan proses, runtime plugin bawaan yang memiliki subproses, dan perekat skrip alur kerja                             |
| `/codeql-security-high/plugin-trust-boundary`     | Permukaan kepercayaan kontrak paket SDK Plugin serta instalasi, pemuat, manifes, registri, instalasi pengelola paket, dan pemuatan sumber Plugin |

### Shard keamanan khusus platform

- `CodeQL Android Critical Security` — shard keamanan Android terjadwal. Membangun aplikasi Android secara manual untuk CodeQL pada runner Linux Blacksmith terkecil yang diterima oleh pemeriksaan kewajaran alur kerja. Mengunggah dengan nama `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard keamanan macOS mingguan/manual. Membangun aplikasi macOS secara manual untuk CodeQL pada Blacksmith macOS, menyaring hasil build dependensi dari SARIF yang diunggah, dan mengunggah dengan nama `/codeql-critical-security/macos`. Dipertahankan di luar default harian karena build macOS mendominasi waktu runtime bahkan ketika tidak ada masalah.

### Kategori Kualitas Kritis

`CodeQL Critical Quality` adalah shard non-keamanan yang sepadan. Shard ini hanya menjalankan kueri kualitas JavaScript/TypeScript non-keamanan dengan tingkat keparahan kesalahan pada permukaan sempit bernilai tinggi di runner Linux yang dihosting GitHub agar pemindaian kualitas tidak menghabiskan anggaran pendaftaran runner Blacksmith. Pengaman pull request-nya sengaja lebih kecil daripada profil terjadwal: PR non-draf hanya menjalankan shard yang sesuai untuk permukaan yang disentuhnya, dari tiga belas shard yang dapat dirutekan untuk PR — `agent-runtime-boundary`, `channel-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `gateway-runtime-boundary`, `mcp-process-runtime-boundary`, `memory-runtime-boundary`, `network-runtime-boundary`, `plugin-boundary`, `plugin-sdk-package-contract`, `plugin-sdk-reply-runtime`, `provider-runtime-boundary`, dan `session-diagnostics-boundary`. `ui-control-plane` dan `web-media-runtime-boundary` tetap tidak disertakan dalam eksekusi PR. Perubahan konfigurasi CodeQL dan alur kerja kualitas menjalankan seluruh set shard PR (shard runtime jaringan dipicu oleh file konfigurasi CodeQL-nya sendiri dan jalur sumber yang memiliki jaringan).

Pemicu manual menerima:

```text
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|network-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Profil sempit tersebut merupakan kait pengajaran/iterasi untuk menjalankan satu shard kualitas secara terisolasi.

| Kategori                                                | Permukaan                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Kode batas keamanan autentikasi, rahasia, sandbox, cron, dan gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Kontrak skema konfigurasi, migrasi, normalisasi, dan IO                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Skema protokol Gateway dan kontrak metode server                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Kontrak implementasi kanal inti dan plugin kanal bawaan                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Kontrak runtime eksekusi perintah, pengiriman model/penyedia, pengiriman serta antrean balasan otomatis, dan bidang kontrol ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Server dan jembatan alat MCP, pembantu supervisi proses, serta kontrak pengiriman keluar                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK host memori, fasad runtime memori, alias SDK Plugin memori, perekat aktivasi runtime memori, dan perintah doctor memori                                    |
| `/codeql-critical-quality/network-runtime-boundary`     | Paket kebijakan jaringan, runtime soket mentah dan penangkapan proksi, tunnel SSH, kunci gateway, soket JSONL, dan permukaan transportasi push                                 |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internal antrean balasan, antrean pengiriman sesi, pembantu pengikatan/pengiriman sesi keluar, permukaan bundel peristiwa/log diagnostik, dan kontrak CLI doctor sesi |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Pengiriman balasan masuk SDK Plugin, pembantu payload/pemotongan/runtime balasan, opsi balasan kanal, antrean pengiriman, dan pembantu pengikatan sesi/utas             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisasi katalog model, autentikasi dan penemuan penyedia, pendaftaran runtime penyedia, default/katalog penyedia, serta registri web/pencarian/pengambilan/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap UI kontrol, persistensi lokal, alur kontrol gateway, dan kontrak runtime bidang kontrol tugas                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Kontrak runtime pengambilan/pencarian web inti, IO media, pemahaman media, pembuatan gambar, dan pembuatan media                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Kontrak pemuat, registri, permukaan publik, dan titik masuk SDK Plugin                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Sumber SDK Plugin sisi paket yang dipublikasikan dan pembantu kontrak paket plugin                                                                                      |

Kualitas tetap dipisahkan dari keamanan agar temuan kualitas dapat dijadwalkan, diukur, dinonaktifkan, atau diperluas tanpa mengaburkan sinyal keamanan. Perluasan CodeQL Swift, Python, dan plugin bawaan sebaiknya ditambahkan kembali sebagai pekerjaan tindak lanjut yang tercakup atau ter-shard hanya setelah profil sempit memiliki runtime dan sinyal yang stabil.

## Alur kerja pemeliharaan

### Agen Dokumentasi

Alur kerja `Docs Agent` adalah jalur pemeliharaan Codex berbasis peristiwa untuk menjaga dokumentasi yang ada tetap selaras dengan perubahan yang baru saja digabungkan. Alur ini tidak memiliki jadwal murni: eksekusi CI push non-bot yang berhasil pada `main` dapat memicunya, dan pemicu manual dapat menjalankannya secara langsung. Pemanggilan melalui eksekusi alur kerja dilewati ketika `main` sudah bergerak maju atau ketika eksekusi Agen Dokumentasi lain yang tidak dilewati dibuat dalam satu jam terakhir. Saat dijalankan, alur ini meninjau rentang commit dari SHA sumber Agen Dokumentasi sebelumnya yang tidak dilewati hingga `main` saat ini, sehingga satu eksekusi per jam dapat mencakup semua perubahan main yang terkumpul sejak peninjauan dokumentasi terakhir.

### Agen Performa Pengujian

Alur kerja `Test Performance Agent` adalah jalur pemeliharaan Codex berbasis peristiwa untuk pengujian lambat. Alur ini tidak memiliki jadwal murni: eksekusi CI push non-bot yang berhasil pada `main` dapat memicunya, tetapi alur ini dilewati jika pemanggilan melalui eksekusi alur kerja lain sudah berjalan atau telah dijalankan pada hari UTC tersebut. Pemicu manual melewati gerbang aktivitas harian itu. Jalur ini membuat laporan performa Vitest lengkap yang dikelompokkan, mengizinkan Codex hanya melakukan perbaikan performa pengujian kecil yang mempertahankan cakupan alih-alih refaktor luas, lalu menjalankan ulang laporan lengkap dan menolak perubahan yang mengurangi jumlah pengujian dasar yang lulus. Laporan yang dikelompokkan mencatat waktu nyata per konfigurasi dan RSS maksimum di Linux dan macOS, sehingga perbandingan sebelum/sesudah menampilkan delta memori pengujian di samping delta durasi. Jika dasar memiliki pengujian yang gagal, Codex hanya boleh memperbaiki kegagalan yang jelas dan laporan lengkap setelah agen harus lulus sebelum apa pun di-commit. Ketika `main` bergerak maju sebelum push bot diterapkan, jalur ini melakukan rebase terhadap patch yang telah divalidasi, menjalankan ulang `pnpm check:changed`, dan mencoba kembali push; patch usang yang berkonflik dilewati. Jalur ini menggunakan Ubuntu yang dihosting GitHub agar tindakan Codex dapat mempertahankan postur keamanan drop-sudo yang sama dengan agen dokumentasi.

### PR Duplikat Setelah Penggabungan

Alur kerja `Duplicate PRs After Merge` adalah alur kerja maintainer manual untuk pembersihan duplikat setelah perubahan diterapkan. Default-nya adalah simulasi dan hanya menutup PR yang dicantumkan secara eksplisit ketika `apply=true`. Sebelum memutasi GitHub, alur ini memverifikasi bahwa PR yang diterapkan telah digabungkan dan bahwa setiap duplikat memiliki masalah rujukan yang sama atau hunk perubahan yang tumpang tindih.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gerbang pemeriksaan lokal dan perutean perubahan

Logika jalur perubahan lokal berada di `scripts/changed-lanes.mjs` dan dijalankan oleh `scripts/check-changed.mjs`. Gerbang pemeriksaan lokal itu lebih ketat terhadap batas arsitektur daripada cakupan platform CI yang luas:

- perubahan produksi inti menjalankan pemeriksaan tipe produksi inti dan pengujian inti serta lint/pengaman inti;
- perubahan khusus pengujian inti hanya menjalankan pemeriksaan tipe pengujian inti serta lint inti;
- perubahan produksi ekstensi menjalankan pemeriksaan tipe produksi ekstensi dan pengujian ekstensi serta lint ekstensi;
- perubahan khusus pengujian ekstensi menjalankan pemeriksaan tipe pengujian ekstensi serta lint ekstensi;
- perubahan SDK Plugin publik atau kontrak plugin diperluas ke pemeriksaan tipe ekstensi karena ekstensi bergantung pada kontrak inti tersebut (penyisiran ekstensi Vitest tetap menjadi pekerjaan pengujian eksplisit);
- peningkatan versi khusus metadata rilis menjalankan pemeriksaan versi/konfigurasi/dependensi root yang ditargetkan;
- perubahan root/konfigurasi yang tidak diketahui gagal secara aman ke semua jalur pemeriksaan.

Perutean pengujian perubahan lokal berada di `scripts/test-projects.test-support.mjs` dan sengaja lebih ringan daripada `check:changed`: pengeditan pengujian langsung menjalankan pengujian itu sendiri, pengeditan sumber mengutamakan pemetaan eksplisit, kemudian pengujian saudara dan dependen grafik impor. Konfigurasi pengiriman ruang grup bersama adalah salah satu pemetaan eksplisit: perubahan pada konfigurasi balasan terlihat grup, mode pengiriman balasan sumber, atau prompt sistem alat pesan dirutekan melalui pengujian balasan inti beserta regresi pengiriman Discord dan Slack agar perubahan default bersama gagal sebelum push PR pertama. Gunakan `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` hanya ketika perubahan cukup luas di seluruh harness sehingga set terpetakan yang ringan bukan proksi yang dapat dipercaya.

## Validasi Testbox

Crabbox adalah wrapper remote-box milik repo untuk pembuktian Linux oleh pengelola. Sesi
agen mempertahankan satu/beberapa pengujian terfokus dan pemeriksaan statis ringan secara lokal hanya untuk
sumber tepercaya ketika instalasi dependensi yang ada telah siap. Sesi tersebut menggunakan Crabbox untuk rangkaian yang lebih besar dan
pekerjaan intensif secara komputasi, termasuk build, pemeriksaan tipe, fan-out lint,
Docker, lane paket, E2E, pembuktian langsung, dan kesetaraan CI. Pembuktian berat oleh pengelola tepercaya
secara default menggunakan `blacksmith-testbox`, dan `.crabbox.yaml` kini secara default menggunakannya. Alur kerja yang dikonfigurasi
menghidrasi kredensial penyedia dan agen, sehingga kode kontributor atau
fork yang tidak tepercaya harus menggunakan CI fork tanpa secret atau Crabbox AWS langsung yang disanitasi.
Eksekusi AWS yang disanitasi menetapkan `CRABBOX_ENV_ALLOW=CI`, meneruskan
`--no-hydrate`, dan menggunakan `HOME` jarak jauh sementara yang baru; ini mencegah daftar izin
`OPENCLAW_*` repo dan profil autentikasi yang ada menjangkau kode yang tidak tepercaya.
Eksekusi tersebut menggunakan lease yang baru dipanaskan dan dikhususkan untuk sumber tidak tepercaya itu, bukan
lease tepercaya atau yang sebelumnya telah dihidrasi. Jalankan biner Crabbox tepercaya yang telah
diinstal dari checkout `main` tepercaya yang bersih dan ambil hanya PR jarak jauh dengan
`--fresh-pr`; jangan pernah menjalankan wrapper atau konfigurasi checkout yang tidak tepercaya secara lokal.
Hapus penetapan `CRABBOX_AWS_INSTANCE_PROFILE` dan lakukan fail-closed kecuali
`aws.instanceProfile` yang diresolusikan kosong. Sebelum instalasi/pengujian apa pun, gunakan alat
dengan jalur absolut tepercaya untuk mewajibkan token IMDSv2, membuktikan bahwa endpoint kredensial
IAM mengembalikan 404, dan membandingkan `git rev-parse HEAD` jarak jauh dengan SHA head PR lengkap
yang telah direview. Ikat lease ke SHA tersebut serta hentikan/panaskan ulang ketika head berubah.
Unggah `scripts/crabbox-untrusted-bootstrap.sh` tepercaya dari `main` yang bersih
bersama `--fresh-pr`; skrip tersebut menginstal Node/pnpm yang disematkan, memverifikasi SHA dan
sematan pengelola paket, mengisolasi `HOME`, menginstal dependensi, lalu menjalankan
pengujian yang diminta.
Hapus penetapan semua override `CRABBOX_TAILSCALE*`, paksa `--network public
--tailscale=false`, hapus flag exit-node/LAN, dan wajibkan `crabbox inspect` untuk
melaporkan jaringan publik tanpa status Tailscale sebelum mengunggah skrip apa pun.
Kapasitas AWS/Hetzner milik sendiri juga tetap menjadi fallback untuk gangguan Blacksmith,
masalah kuota, atau pengujian kapasitas milik sendiri yang diminta secara eksplisit.

Agen tidak melakukan pemanasan awal untuk pekerjaan yang diperkirakan. Dapatkan Testbox secara lazy ketika
perintah berat pertama siap, gunakan kembali id `tbx_...` yang dikembalikan untuk perintah berat
berikutnya, sinkronkan checkout saat ini pada setiap eksekusi, dan hentikan sebelum serah terima.

Eksekusi Blacksmith yang didukung Crabbox memanaskan, mengklaim, menyinkronkan, menjalankan, melaporkan, dan membersihkan
Testbox sekali pakai. Pemeriksaan kewajaran sinkronisasi bawaan gagal dengan cepat ketika
`git status --short` pada box yang disinkronkan menunjukkan sedikitnya 200 penghapusan terlacak,
yang mendeteksi hilangnya berkas root seperti `pnpm-lock.yaml`. Untuk PR dengan
penghapusan besar yang disengaja, tetapkan `CRABBOX_ALLOW_MASS_DELETIONS=1` untuk perintah jarak jauh.

Crabbox juga menghentikan pemanggilan CLI Blacksmith lokal yang tetap berada dalam
fase sinkronisasi selama lebih dari lima menit tanpa keluaran pascasinkronisasi. Tetapkan
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` untuk menonaktifkan pengaman tersebut, atau gunakan nilai
milidetik yang lebih besar untuk diff lokal yang luar biasa besar.

Sebelum eksekusi pertama, periksa wrapper dari root repo:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Wrapper repo menolak biner Crabbox usang yang tidak mengiklankan penyedia yang dipilih, dan eksekusi yang didukung Blacksmith memerlukan Crabbox 0.22.0 atau yang lebih baru agar wrapper memperoleh perilaku sinkronisasi, antrean, dan pembersihan Testbox saat ini. Dalam worktree Codex atau checkout tertaut/sparse, hindari skrip lokal `pnpm crabbox:run` karena pnpm dapat merekonsiliasi dependensi sebelum Crabbox dimulai; sebagai gantinya, panggil wrapper node secara langsung:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Saat menggunakan checkout saudara, build ulang biner lokal yang diabaikan sebelum pekerjaan pengukuran waktu atau pembuktian:

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

Blok `blacksmith:` dalam `.crabbox.yaml` telah menyematkan nilai default organisasi, alur kerja, job, dan ref, sehingga flag eksplisit di bawah bersifat opsional. Gate perubahan:

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

Jalankan ulang pengujian terfokus pada Testbox ketika dependensi lokal tidak tersedia atau
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

Baca ringkasan JSON akhir. Field yang berguna adalah `provider`, `leaseId`,
`syncDelegated`, `exitCode`, `commandMs`, dan `totalMs`. Untuk eksekusi
Blacksmith Testbox yang didelegasikan, kode keluar wrapper Crabbox dan ringkasan JSON merupakan
hasil perintah. Eksekusi GitHub Actions yang tertaut memiliki hidrasi dan keepalive; eksekusi tersebut
dapat selesai sebagai `cancelled` ketika Testbox dihentikan secara eksternal setelah perintah SSH
telah kembali. Perlakukan itu sebagai artefak pembersihan/status kecuali
`exitCode` wrapper bukan nol atau keluaran perintah menunjukkan pengujian yang gagal.
Eksekusi Crabbox sekali pakai yang didukung Blacksmith semestinya menghentikan Testbox secara otomatis;
jika suatu eksekusi terinterupsi atau pembersihannya tidak jelas, periksa box aktif dan hentikan hanya
box yang Anda buat:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Gunakan pemakaian ulang hanya ketika Anda sengaja memerlukan beberapa perintah pada box terhidrasi yang sama:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --id <tbx_id> --timing-json --shell -- "corepack pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Gunakan kembali lease, bukan sumber usang. Hilangkan `--no-sync` agar setiap eksekusi mengunggah
checkout saat ini; gunakan hanya untuk sengaja menjalankan ulang tree yang tidak berubah dan sudah disinkronkan.
Kode kontributor/fork yang tidak tepercaya harus menggunakan
`CRABBOX_ENV_ALLOW=CI`, `--provider aws --no-hydrate`, dan `HOME` jarak jauh
sementara yang baru untuk setiap perintah; instal dependensi di dalam perintah yang disanitasi tersebut
sebelum pengujian. Gunakan kembali hanya lease yang baru dipanaskan dan dikhususkan untuk
sumber tidak tepercaya yang sama; jangan pernah menggunakan lease tepercaya atau yang sebelumnya telah dihidrasi. Jangan pernah
menjalankan wrapper atau konfigurasi checkout yang tidak tepercaya secara lokal: jalankan biner Crabbox
tepercaya yang terinstal dari `main` tepercaya yang bersih dan teruskan `--fresh-pr` pada setiap
eksekusi. Biarkan `CRABBOX_AWS_INSTANCE_PROFILE` tidak ditetapkan, tolak profil instans hasil resolusi
yang tidak kosong, wajibkan pembuktian tanpa peran IMDS jarak jauh tepercaya, dan verifikasi
SHA head yang telah direview sebelum instalasi/pengujian. Ikat lease ke SHA tersebut; hentikan dan
panaskan ulang setelah setiap perubahan head. Jika tidak ada PR jarak jauh, gunakan CI fork tanpa secret.
Jangan pernah memilih `hydrate-github` atau alur kerja Blacksmith yang dihidrasi dengan kredensial
untuk sumber tidak tepercaya.

Jika Crabbox merupakan lapisan yang rusak tetapi Blacksmith sendiri berfungsi, gunakan Blacksmith
langsung hanya untuk diagnostik seperti `list`, `status`, dan pembersihan. Perbaiki
jalur Crabbox sebelum memperlakukan eksekusi Blacksmith langsung sebagai pembuktian pengelola.

Jika `blacksmith testbox list --all` dan `blacksmith testbox status` berfungsi tetapi pemanasan baru
tetap `queued` tanpa IP atau URL eksekusi Actions setelah beberapa menit,
perlakukan hal itu sebagai tekanan penyedia, antrean, penagihan, atau batas organisasi Blacksmith. Hentikan
id antrean yang Anda buat, hindari memulai Testbox tambahan, dan pindahkan pembuktian ke
jalur kapasitas Crabbox milik sendiri di bawah sementara seseorang memeriksa dasbor Blacksmith,
penagihan, dan batas organisasi.

Eskalasi ke kapasitas Crabbox milik sendiri hanya ketika Blacksmith tidak aktif, dibatasi kuota, tidak memiliki lingkungan yang diperlukan, atau kapasitas milik sendiri secara eksplisit menjadi tujuan:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --provider aws --id <cbx_id-or-slug>
pnpm crabbox:run -- --provider aws --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- --provider aws <cbx_id-or-slug>
```

Di bawah tekanan AWS, hindari `class=beast` kecuali tugas benar-benar memerlukan CPU kelas 48xlarge. Permintaan `beast` dimulai pada 192 vCPU dan merupakan cara termudah untuk melampaui kuota regional EC2 Spot atau On-Demand Standard. `.crabbox.yaml` milik repo secara default menggunakan `class: standard`, pasar on-demand, dan `capacity.hints: true` agar lease AWS yang diperantarai mencetak wilayah/pasar terpilih, tekanan kuota, fallback Spot, dan peringatan kelas bertekanan tinggi. Gunakan `fast` untuk pemeriksaan luas yang lebih berat, `large` hanya setelah standard/fast tidak memadai, dan `beast` hanya untuk lane terikat CPU yang luar biasa seperti rangkaian lengkap atau matriks Docker semua Plugin, validasi rilis/pemblokir eksplisit, atau pemrofilan performa berinti tinggi. Jangan gunakan `beast` untuk `pnpm check:changed`, pengujian terfokus, pekerjaan khusus dokumentasi, lint/pemeriksaan tipe biasa, reproduksi E2E kecil, atau triase gangguan Blacksmith. Gunakan `--market on-demand` untuk diagnosis kapasitas agar fluktuasi pasar Spot tidak tercampur ke dalam sinyal.

`.crabbox.yaml` memiliki nilai default penyedia, sinkronisasi, dan hidrasi GitHub Actions. Sinkronisasi Crabbox tidak pernah mentransfer `.git`, sehingga checkout Actions yang dihidrasi mempertahankan metadata Git jarak jauhnya sendiri alih-alih menyinkronkan remote dan object store lokal pengelola, dan konfigurasi repo juga mengecualikan artefak runtime/build lokal (seperti `.artifacts` dan laporan pengujian) yang tidak boleh ditransfer. `.github/workflows/crabbox-hydrate.yml` memiliki checkout, penyiapan Node/pnpm, pengambilan `origin/main`, dan serah terima lingkungan non-secret untuk perintah `crabbox run --id <cbx_id>` cloud milik sendiri.

## Terkait

- [Ringkasan instalasi](/id/install)
- [Kanal pengembangan](/id/install/development-channels)
