---
read_when:
    - Menjalankan atau menjalankan ulang Validasi Rilis Lengkap
    - Membandingkan profil validasi rilis stabil dan lengkap
    - Men-debug kegagalan tahap validasi rilis
summary: Tahapan Validasi Rilis Penuh, alur kerja turunan, profil rilis, penanganan eksekusi ulang, dan bukti
title: Validasi rilis penuh
x-i18n:
    generated_at: "2026-07-12T14:36:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0c152128a27b173f131bcf2754c7f06d7bf3e9f7d2d1d0f745ab999f53c78c9
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` adalah payung rilis: satu-satunya titik masuk manual
untuk pembuktian prarilis. Sebagian besar pekerjaan berlangsung dalam alur kerja turunan sehingga lingkungan yang gagal dapat
dijalankan ulang tanpa memulai ulang seluruh rilis.

Jalankan dari referensi alur kerja tepercaya, biasanya `main`, dan berikan cabang rilis,
tag, atau SHA commit lengkap sebagai `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

`provider` juga menerima `anthropic` atau `minimax` untuk onboarding lintas OS dan
putaran agen menyeluruh. Pekerjaan turunan yang dapat digunakan kembali menentukan harness alur kerja yang dipanggil
dari `job.workflow_repository` dan `job.workflow_sha`, sedangkan input `ref`
memilih kandidat yang diuji. Dengan demikian, logika validasi tepercaya terkini tetap
tersedia saat memvalidasi cabang atau tag rilis yang lebih lama.

Setiap turunan yang dikirim harus melaporkan SHA alur kerja yang sama dengan proses induk
`Full Release Validation`. Jika `main` berubah di antara pengiriman induk dan turunan,
payung akan gagal secara tertutup meskipun turunan itu sendiri berhasil. Untuk
pembuktian commit persis yang tidak dapat diubah, gunakan
`pnpm ci:full-release --sha <target-sha>`. Pembantu tersebut membuat referensi
`release-ci/*` sementara yang disematkan ke `origin/main` tepercaya saat ini, hanya meneruskan SHA target
sebagai kandidat `ref`, menggunakan kembali bukti target persis yang ketat jika
tersedia, dan menghapus referensi setelah validasi. Berikan
`-f reuse_evidence=false` untuk memaksa proses baru atau
`--workflow-sha <trusted-main-sha>` untuk memilih commit alur kerja lama yang masih
dapat dijangkau dari `origin/main` saat ini. Alur kerja tidak pernah membuat atau memperbarui
referensi repositori itu sendiri.

`release_profile=stable` dan `release_profile=full` selalu menjalankan uji ketahanan
langsung/Docker yang menyeluruh. Berikan `run_release_soak=true` untuk menyertakan jalur uji ketahanan yang sama
dengan profil `beta`. Publikasi stabil menolak manifes validasi
tanpa uji ketahanan ini dan bukti performa produk yang bersifat memblokir.

Package Acceptance biasanya membangun tarball kandidat dari `ref` yang telah ditentukan,
termasuk proses SHA lengkap yang dikirim dengan `pnpm ci:full-release`. Setelah
publikasi beta, berikan `release_package_spec=openclaw@YYYY.M.PATCH-beta.N` untuk menggunakan kembali
paket npm yang telah dirilis dalam pemeriksaan rilis, Package Acceptance, lintas OS,
Docker jalur rilis, dan Telegram paket. Gunakan `package_acceptance_package_spec`
hanya ketika Package Acceptance memang dimaksudkan untuk membuktikan paket yang berbeda.
Jalur paket langsung Plugin Codex mengikuti keadaan yang sama: nilai
`release_package_spec` yang telah dipublikasikan menghasilkan `codex_plugin_spec=npm:@openclaw/codex@<version>`;
proses SHA/artefak mengemas `extensions/codex` dari referensi yang dipilih; dan operator
dapat menetapkan `codex_plugin_spec` secara langsung untuk sumber Plugin
`npm:`, `npm-pack:`, atau `git:`. Jalur tersebut memberikan persetujuan instalasi CLI Codex secara eksplisit yang diwajibkan oleh
Plugin tersebut, lalu menjalankan prapemeriksaan CLI Codex dan putaran agen OpenAI dalam sesi yang sama.

## Tahapan tingkat atas

Untuk `rerun_group=all`, pekerjaan `Check for reusable validation evidence` berjalan
lebih dahulu: pekerjaan ini mencari validasi penuh berhasil sebelumnya yang terbaru untuk SHA target,
profil rilis, pengaturan uji ketahanan efektif, dan input validasi yang persis sama.
Jika bukti tersebut tersedia, setiap jalur dilewati dan verifikator payung
memeriksa ulang artefak induk yang tidak dapat diubah, proses turunan, dan log pengiriman. Ini
hanya untuk pemulihan proses ulang kandidat yang sama; hal ini tidak mengizinkan penggunaan kembali lintas SHA. Untuk
kandidat yang berubah, jalankan ulang setiap gerbang paket, artefak, instalasi, Docker, atau penyedia
yang terpengaruh oleh perubahan tersebut. Berikan `reuse_evidence=false` untuk memaksa proses penuh
yang baru. Penggunaan kembali bukti hanya berjalan dari `main` atau referensi kanonis
`release-ci/*` yang disematkan ke SHA dan commit alur kerjanya tetap berada dalam garis keturunan `main` tepercaya;
referensi alur kerja lainnya menjalankan jalur yang dipilih secara baru.

Juga untuk `rerun_group=all`, pekerjaan `Verify Docker runtime image assets` membangun
target Docker `runtime-assets` dengan
`OPENCLAW_EXTENSIONS=diagnostics-otel,codex`. Pekerjaan ini berjalan paralel dengan
tahapan lain dan diberlakukan oleh verifikator payung; jalur tidak lagi menunggunya
sebelum dikirim. `rerun_group` yang lebih sempit melewati prapemeriksaan ini.

| Tahap                   | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Penentuan target        | **Pekerjaan:** `Resolve target ref`<br />**Alur kerja turunan:** tidak ada<br />**Membuktikan:** menentukan cabang rilis, tag, atau SHA commit lengkap dan mencatat input yang dipilih.<br />**Jalankan ulang:** jalankan ulang payung jika ini gagal.                                                                                                                                                                                                                                                                                                            |
| Prapemeriksaan aset Docker | **Pekerjaan:** `Verify Docker runtime image assets`<br />**Alur kerja turunan:** tidak ada<br />**Membuktikan:** target build Docker `runtime-assets` tetap berhasil sebelum tahap lain dikirim. Hanya berjalan untuk `rerun_group=all`.<br />**Jalankan ulang:** jalankan ulang payung dengan `rerun_group=all`.                                                                                                                                                                                                                                         |
| Vitest dan CI normal    | **Pekerjaan:** `Run normal full CI`<br />**Alur kerja turunan:** `CI`<br />**Membuktikan:** grafik CI penuh manual terhadap referensi target, termasuk jalur Linux Node, shard Plugin bawaan, shard kontrak Plugin dan saluran, kompatibilitas Node 22, `check-*`, `check-additional-*`, pemeriksaan cepat artefak hasil build, pemeriksaan dokumentasi, Skills Python, Windows, macOS, i18n Control UI, dan Android melalui payung.<br />**Jalankan ulang:** `rerun_group=ci`.                                                                                          |
| Prarilis Plugin         | **Pekerjaan:** `Run plugin prerelease validation`<br />**Alur kerja turunan:** `Plugin Prerelease`<br />**Membuktikan:** pemeriksaan statis Plugin khusus rilis, cakupan Plugin berbasis agen, shard batch Plugin penuh, jalur Docker prarilis Plugin, dan artefak `plugin-inspector-advisory` yang tidak memblokir untuk triase kompatibilitas.<br />**Jalankan ulang:** `rerun_group=plugin-prerelease`.                                                                                                                                                          |
| Pemeriksaan rilis       | **Pekerjaan:** `Run release/live/Docker/QA validation`<br />**Alur kerja turunan:** `OpenClaw Release Checks`<br />**Membuktikan:** pemeriksaan cepat instalasi, pemeriksaan paket lintas OS, Package Acceptance, kesetaraan QA Lab, Matrix langsung, dan Telegram langsung. Profil stabil dan penuh juga menjalankan rangkaian pengujian langsung/E2E yang menyeluruh serta bagian jalur rilis Docker; beta dapat menyertakannya dengan `run_release_soak=true`.<br />**Jalankan ulang:** `rerun_group=release-checks` atau penangan pemeriksaan rilis yang lebih sempit.                                                                |
| Telegram paket          | **Pekerjaan:** `Run package Telegram E2E`<br />**Alur kerja turunan:** `NPM Telegram Beta E2E`<br />**Membuktikan:** E2E Telegram terfokus untuk paket yang telah dipublikasikan ketika `release_package_spec` atau `npm_telegram_package_spec` ditetapkan. Validasi kandidat penuh menggunakan E2E Telegram Package Acceptance kanonis sebagai gantinya.<br />**Jalankan ulang:** `rerun_group=npm-telegram` dengan `release_package_spec` atau `npm_telegram_package_spec`.                                                                                                              |
| Performa produk         | **Pekerjaan:** `Run product performance evidence`<br />**Alur kerja turunan:** `OpenClaw Performance`<br />**Membuktikan:** proses performa profil rilis (`profile=release`, `repeat=3`, `fail_on_regression=true`, `publish_reports=false`) terhadap SHA target. Keluaran Kova tetap berada dalam artefak alur kerja dan turunan harus membuktikan bahwa penerbit laporannya dilewati. Wajib (memblokir) hanya untuk `rerun_group=all` atau `rerun_group=performance`; tidak diwajibkan untuk grup proses ulang yang lebih sempit.<br />**Jalankan ulang:** `rerun_group=performance`. |
| Verifikator payung      | **Pekerjaan:** `Verify full validation`<br />**Alur kerja turunan:** tidak ada<br />**Membuktikan:** memeriksa ulang kesimpulan proses turunan yang dicatat dan menambahkan tabel pekerjaan paling lambat dari alur kerja turunan.<br />**Jalankan ulang:** jalankan ulang hanya pekerjaan ini setelah menjalankan ulang turunan yang gagal hingga berhasil.                                                                                                                                                                                                                                                                 |

Payung selalu mengirim performa produk dalam mode khusus artefak.
`OpenClaw Performance` mengizinkan publikasi laporan hanya untuk proses terjadwal atau
pengiriman manual yang secara eksplisit menetapkan `publish_reports=true`. Pelindung khusus artefak
harus diselesaikan dengan berhasil, yang membuktikan pekerjaan penerbit tetap dilewati.
Bukti baru dan yang digunakan kembali mencatat
`controls.performanceReportPublication=artifact-only`; verifikator dan pemilih penggunaan kembali
menolak bukti tanpa pembuktian turunan performa ternormalisasi yang sesuai.

Verifikator mengunggah manifes kanonis sebagai
`full-release-validation-<run-id>-<run-attempt>`. Peralatan bukti memvalidasi
ID artefak, digest, proses penghasil, dan percobaannya sebelum mengunduh ID artefak
yang persis tersebut. Peralatan ini membatasi ukuran ZIP yang diunduh, memverifikasi byte-nya terhadap digest REST
`sha256:`, dan mengalirkan satu-satunya entri manifes terbatas yang diizinkan tanpa
mengekstrak arsip. Alias bernama stabil tetap tersedia sementara untuk konsumen
publikasi lama. Verifikator selalu mengutamakan artefak yang memenuhi syarat percobaan;
sebagai transisi, verifikator menerima nama stabil hanya untuk penghasil manifes v2 pada percobaan pertama.
Verifikator menolak nama lama tersebut untuk percobaan selanjutnya dan manifes v3.

Untuk `ref=main` dengan `rerun_group=all`, untuk referensi `release/*`, dan untuk referensi alfa Tideclaw,
proses payung yang lebih baru menggantikan proses lama dengan referensi dan
grup proses ulang yang sama. Ketika induk dibatalkan, pemantaunya membatalkan setiap
alur kerja turunan yang telah dikirim. Proses validasi tag dan SHA yang disematkan tidak
saling membatalkan.

## Tahapan pemeriksaan rilis

`OpenClaw Release Checks` adalah alur kerja turunan terbesar. Alur kerja ini menentukan target
satu kali dan menyiapkan artefak `release-package-under-test` bersama ketika tahapan
yang berkaitan dengan paket atau Docker membutuhkannya.

| Tahap                    | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Target rilis             | **Pekerjaan:** `Resolve target ref`<br />**Alur kerja pendukung:** tidak ada<br />**Pengujian:** ref yang dipilih, SHA yang diharapkan secara opsional, profil, grup pengulangan, dan filter rangkaian pengujian langsung terfokus.<br />**Pengulangan:** `rerun_group=release-checks`.                                                                                                                                                                                                                                                                                                                                                             |
| Artefak paket            | **Pekerjaan:** `Prepare release package artifact`<br />**Alur kerja pendukung:** tidak ada<br />**Pengujian:** mengemas atau menentukan satu tarball kandidat dan mengunggah `release-package-under-test` untuk pemeriksaan terkait paket di tahap berikutnya.<br />**Pengulangan:** grup paket, lintas OS, atau langsung/E2E yang terdampak.                                                                                                                                                                                                                                                                                             |
| Uji singkat instalasi    | **Pekerjaan:** `Run install smoke`<br />**Alur kerja pendukung:** `Install Smoke`<br />**Pengujian:** jalur instalasi lengkap dengan penggunaan ulang citra uji singkat Dockerfile root, instalasi paket QR, uji singkat Docker root dan Gateway, pengujian Docker penginstal, serta uji singkat penyedia citra untuk instalasi global Bun.<br />**Pengulangan:** `rerun_group=install-smoke`.                                                                                                                                                                                                                                                           |
| Lintas OS                | **Pekerjaan:** `cross_os_release_checks`<br />**Alur kerja pendukung:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Pengujian:** jalur instalasi baru dan peningkatan pada Linux, Windows, dan macOS untuk penyedia dan mode yang dipilih, menggunakan tarball kandidat beserta paket dasar.<br />**Pengulangan:** `rerun_group=cross-os`.                                                                                                                                                                                                                                                                 |
| E2E repositori dan langsung | **Pekerjaan:** `Run repo/live E2E validation`<br />**Alur kerja pendukung:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Pengujian:** E2E repositori, cache langsung, streaming websocket OpenAI, shard penyedia langsung native dan Plugin, serta harness model langsung/backend/Gateway berbasis Docker yang dipilih oleh `release_profile`.<br />**Berjalan saat:** `run_release_soak=true`, `release_profile=full`, atau `rerun_group=live-e2e` terfokus.<br />**Pengulangan:** `rerun_group=live-e2e`, secara opsional dengan `live_suite_filter`.                                                                                |
| Jalur rilis Docker       | **Pekerjaan:** `Run Docker release-path validation`<br />**Alur kerja pendukung:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Pengujian:** bagian Docker jalur rilis terhadap artefak paket bersama.<br />**Berjalan saat:** `run_release_soak=true`, `release_profile=full`, atau `rerun_group=live-e2e` terfokus.<br />**Pengulangan:** `rerun_group=live-e2e`.                                                                                                                                                                                                                                     |
| Penerimaan Paket         | **Pekerjaan:** `Run package acceptance`<br />**Alur kerja pendukung:** `Package Acceptance`<br />**Pengujian:** fixture paket Plugin luring, pembaruan Plugin, E2E paket Telegram mock-OpenAI kanonis, serta pemeriksaan ketahanan terhadap peningkatan versi yang telah diterbitkan menggunakan tarball yang sama. Pemeriksaan rilis yang memblokir menggunakan versi dasar terbaru yang diterbitkan secara default; pemeriksaan ketahanan (`run_release_soak=true`) diperluas ke 4 rilis stabil npm terakhir ditambah 3 versi historis yang disematkan (`2026.4.23`, `2026.5.2`, `2026.4.15`), yang dijalankan terhadap fixture peningkatan untuk masalah yang dilaporkan.<br />**Pengulangan:** `rerun_group=package`. |
| Kartu skor kematangan    | **Pekerjaan:** `Render maturity scorecard release docs`<br />**Alur kerja pendukung:** `maturity-scorecard.yml`<br />**Pengujian:** merender dokumentasi kartu skor kematangan yang bersifat anjuran terhadap ref target. Hanya berjalan ketika `run_maturity_scorecard=true` diteruskan.<br />**Pengulangan:** `rerun_group=qa` dengan `run_maturity_scorecard=true`.                                                                                                                                                                                                                                                           |
| Kesetaraan QA            | **Pekerjaan:** `Run QA Lab parity lane` dan `Run QA Lab parity report`<br />**Alur kerja pendukung:** pekerjaan langsung<br />**Pengujian:** paket kesetaraan agentik kandidat dan dasar, lalu laporan kesetaraan.<br />**Pengulangan:** `rerun_group=qa-parity` atau `rerun_group=qa`.                                                                                                                                                                                                                                                                                                                         |
| Kesetaraan runtime QA    | **Pekerjaan:** `Run QA Lab runtime parity lane`<br />**Alur kerja pendukung:** pekerjaan langsung<br />**Pengujian:** jalur kesetaraan agentik pasangan runtime `openclaw`/`codex` (`pnpm openclaw qa suite --runtime-pair openclaw,codex`), termasuk tingkat standar dan, dengan `run_release_soak=true`, tingkat ketahanan. Bersifat anjuran: kegagalan individual tidak memblokir pemverifikasi pemeriksaan rilis.<br />**Pengulangan:** `rerun_group=qa-parity` atau `rerun_group=qa`.                                                                                                                                                    |
| Cakupan alat runtime QA  | **Pekerjaan:** `Enforce QA Lab runtime tool coverage`<br />**Alur kerja pendukung:** pekerjaan langsung<br />**Pengujian:** pergeseran alat dinamis antara `openclaw` dan `codex` pada tingkat kesetaraan runtime standar (`pnpm openclaw qa coverage --tools`), menggunakan keluaran jalur kesetaraan runtime QA. Memblokir: pekerjaan ini tidak dapat dikesampingkan sebagai anjuran.<br />**Pengulangan:** `rerun_group=qa-parity` atau `rerun_group=qa`.                                                                                                                                                                                        |
| Matrix langsung QA       | **Pekerjaan:** `Run QA Lab live Matrix lane`<br />**Alur kerja pendukung:** pekerjaan langsung<br />**Pengujian:** profil QA Matrix langsung cepat dalam lingkungan `qa-live-shared`.<br />**Pengulangan:** `rerun_group=qa-live` atau `rerun_group=qa`.                                                                                                                                                                                                                                                                                                                                                          |
| Telegram langsung QA     | **Pekerjaan:** `Run QA Lab live Telegram lane`<br />**Alur kerja pendukung:** pekerjaan langsung<br />**Pengujian:** QA Telegram langsung dengan penyewaan kredensial CI Convex.<br />**Pengulangan:** `rerun_group=qa-live` atau `rerun_group=qa`.                                                                                                                                                                                                                                                                                                                                                                      |
| Pemverifikasi rilis      | **Pekerjaan:** `Verify release checks`<br />**Alur kerja pendukung:** tidak ada<br />**Pengujian:** pekerjaan pemeriksaan rilis yang diperlukan untuk grup pengulangan yang dipilih.<br />**Pengulangan:** ulangi setelah pekerjaan turunan terfokus berhasil.                                                                                                                                                                                                                                                                                                                                                                                   |

## Bagian jalur rilis Docker

Tahap jalur rilis Docker menjalankan bagian-bagian ini ketika `live_suite_filter`
kosong:

| Bagian                                                          | Cakupan                                                                                                                   |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `core`                                                          | Jalur uji singkat jalur rilis Docker inti.                                                                                      |
| `package-update-openai`                                         | Perilaku instalasi/pembaruan paket OpenAI, instalasi Codex sesuai permintaan, giliran langsung Plugin Codex, dan pemanggilan alat Chat Completions. |
| `package-update-anthropic`                                      | Perilaku instalasi dan pembaruan paket Anthropic.                                                                             |
| `package-update-core`                                           | Perilaku paket dan pembaruan yang netral terhadap penyedia.                                                                              |
| `plugins-runtime-plugins`                                       | Jalur runtime Plugin yang menguji perilaku Plugin.                                                                        |
| `plugins-runtime-services`                                      | Jalur runtime Plugin berbasis layanan dan langsung.                                                                              |
| `plugins-runtime-install-a` hingga `plugins-runtime-install-h`  | Batch instalasi/runtime Plugin yang dibagi untuk validasi rilis paralel.                                                      |
| `openwebui`                                                     | Uji singkat kompatibilitas OpenWebUI yang diisolasi pada runner khusus berkapasitas disk besar ketika diminta.                                    |

Gunakan `docker_lanes=<lane[,lane]>` yang ditargetkan pada alur kerja langsung/E2E yang dapat digunakan kembali ketika
hanya satu jalur Docker yang gagal. Artefak rilis menyertakan perintah pengulangan
per jalur dengan input penggunaan ulang artefak paket dan citra jika tersedia.

## Profil rilis

`release_profile` terutama mengontrol cakupan live/penyedia di dalam pemeriksaan rilis.
Ini tidak menghapus CI penuh normal, Prarilis Plugin, smoke instalasi, penerimaan
paket, atau QA Lab. Profil stable dan full selalu menjalankan cakupan menyeluruh
E2E repo/live dan soak jalur rilis Docker. Profil beta dapat mengaktifkannya dengan
`run_release_soak=true`. Penerimaan Paket menyediakan E2E Telegram paket kanonis
untuk setiap kandidat penuh, sehingga alur payung tidak menduplikasi poller live
tersebut.

| Profil   | Tujuan penggunaan                    | Cakupan live/penyedia yang disertakan                                                                                                                                                                            |
| -------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `beta`   | Smoke kritis rilis tercepat.          | Jalur live OpenAI/inti, model live Docker untuk OpenAI, inti gateway native, profil gateway OpenAI native, Plugin OpenAI native, dan gateway live Docker OpenAI.                                                   |
| `stable` | Profil persetujuan rilis default.     | `beta` ditambah smoke Anthropic, Google, MiniMax, backend, harness pengujian live native, backend CLI live Docker, pengikatan ACP Docker, harness Codex Docker, pengumuman subagen Docker, dan shard smoke OpenCode Go. |
| `full`   | Penyisiran advisori yang luas.        | `stable` ditambah penyedia advisori, shard live Plugin, dan shard live media.                                                                                                                                     |

## Penambahan khusus full

Suite berikut dilewati oleh `stable` dan disertakan oleh `full`:

| Area                             | Cakupan khusus full                                                                                                         |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Model live Docker                | OpenCode Go, OpenRouter, xAI, Z.ai, dan Fireworks.                                                                          |
| Gateway live Docker              | Penyedia advisori dibagi menjadi shard DeepSeek/Fireworks, OpenCode Go/OpenRouter, dan xAI/Z.ai.                            |
| Profil penyedia gateway native   | Shard lengkap Anthropic Opus dan Sonnet/Haiku, Fireworks, DeepSeek, shard model OpenCode Go lengkap, OpenRouter, xAI, dan Z.ai. |
| Shard live Plugin native         | Plugin A-K, L-N, O-Z lainnya, Moonshot, dan xAI.                                                                            |
| Shard live media native          | Audio, musik Google, musik MiniMax, dan grup video A-D.                                                                     |

`stable` menyertakan `native-live-src-gateway-profiles-anthropic-smoke` dan
`native-live-src-gateway-profiles-opencode-go-smoke`; `full` sebagai gantinya
menggunakan shard model Anthropic dan OpenCode Go yang lebih luas. Pengulangan
terfokus tetap dapat menggunakan handle agregat
`native-live-src-gateway-profiles-anthropic` atau
`native-live-src-gateway-profiles-opencode-go`.

## Pengulangan terfokus

Gunakan `rerun_group` untuk menghindari pengulangan kotak rilis yang tidak terkait:

| Handle              | Cakupan                                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------ |
| `all`               | Semua tahap Validasi Rilis Penuh.                                                                |
| `ci`                | Hanya alur anak CI penuh manual.                                                                 |
| `plugin-prerelease` | Hanya alur anak Prarilis Plugin.                                                                 |
| `release-checks`    | Semua tahap Pemeriksaan Rilis OpenClaw.                                                          |
| `install-smoke`     | Smoke Instalasi hingga pemeriksaan rilis.                                                        |
| `cross-os`          | Pemeriksaan rilis lintas OS.                                                                     |
| `live-e2e`          | Validasi E2E repo/live dan jalur rilis Docker.                                                   |
| `package`           | Penerimaan Paket.                                                                                |
| `qa`                | Paritas QA ditambah jalur live QA.                                                               |
| `qa-parity`         | Hanya jalur dan laporan paritas QA.                                                              |
| `qa-live`           | Matrix/Telegram live QA ditambah jalur Discord, WhatsApp, dan Slack berpagar saat diaktifkan.    |
| `npm-telegram`      | E2E Telegram paket yang diterbitkan; memerlukan `release_package_spec` atau `npm_telegram_package_spec`. |
| `performance`       | Hanya bukti performa produk.                                                                     |

Gunakan `live_suite_filter` dengan `rerun_group=live-e2e` ketika satu suite live
gagal. ID filter yang valid ditentukan dalam alur kerja live/E2E yang dapat
digunakan kembali, termasuk `docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker`, dan
`live-codex-harness-docker`.

Handle `live-gateway-advisory-docker` adalah handle pengulangan agregat untuk
ketiga shard penyedianya, sehingga tetap menyebar ke semua tugas gateway Docker
advisori.

Gunakan `cross_os_suite_filter` dengan `rerun_group=cross-os` ketika satu jalur
lintas OS gagal. Filter menerima ID OS, ID suite, atau pasangan OS/suite,
misalnya `windows/packaged-upgrade`, `windows`, atau `packaged-fresh`. Ringkasan
lintas OS menyertakan waktu per fase untuk jalur peningkatan paket, dan perintah
yang berjalan lama mencetak baris Heartbeat agar pembaruan yang macet terlihat
sebelum batas waktu tugas.

Kegagalan pemeriksaan rilis QA memblokir validasi rilis normal. Pemeriksaan
cakupan alat runtime QA (pergeseran alat dinamis antara `openclaw` dan `codex`
pada tingkat standar) juga memblokir pemverifikasi pemeriksaan rilis meskipun
jalur paritas runtime QA yang mendasarinya bersifat advisori. Proses alpha
Tideclaw tetap dapat memperlakukan jalur pemeriksaan rilis yang bukan terkait
keamanan paket sebagai advisori. Dengan `release_profile=beta`, suite penyedia
live `Run repo/live E2E validation` bersifat advisori: deployment model pihak
ketiga berubah di bawah sebuah rilis, sehingga beta menampilkan kegagalannya
sebagai peringatan, sementara profil stable dan full tetap menjadikannya
pemblokir. Ketika `live_suite_filter` secara eksplisit meminta jalur live QA
berpagar seperti Discord, WhatsApp, atau Slack, variabel repo
`OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` yang sesuai harus diaktifkan; jika tidak,
pengambilan input akan gagal alih-alih melewati jalur secara diam-diam.
Ulangi `rerun_group=qa`, `qa-parity`, atau `qa-live` ketika Anda memerlukan
bukti QA terbaru.

## Bukti yang perlu disimpan

Simpan ringkasan `Full Release Validation` sebagai indeks tingkat rilis. Ringkasan
ini menautkan ID proses anak dan menyertakan tabel tugas paling lambat. Untuk
kegagalan, periksa alur kerja anak terlebih dahulu, lalu ulangi handle terkecil
yang sesuai di atas.

Artefak yang berguna:

- `release-package-under-test` dari `OpenClaw Release Checks`
- Artefak jalur rilis Docker di bawah `.artifacts/docker-tests/`
- `package-under-test` Penerimaan Paket dan artefak penerimaan Docker
- Artefak pemeriksaan rilis lintas OS untuk setiap OS dan suite
- Artefak paritas QA, paritas runtime, Matrix, dan Telegram

## Berkas alur kerja

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/install-smoke-reusable.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
- `.github/workflows/openclaw-performance.yml`
- `.github/workflows/npm-telegram-beta-e2e.yml`
