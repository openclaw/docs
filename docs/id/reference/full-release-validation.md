---
read_when:
    - Menjalankan atau menjalankan ulang Validasi Rilis Lengkap
    - Membandingkan profil validasi rilis stabil dan penuh
    - Men-debug kegagalan tahap validasi rilis
summary: Tahapan Validasi Rilis Penuh, alur kerja turunan, profil rilis, pegangan pengulangan proses, dan bukti
title: Validasi rilis lengkap
x-i18n:
    generated_at: "2026-07-19T05:35:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ec027e633efb118c7fbad8b2cd2a17408c2ba46e0c0742a180b1019e21731174
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` adalah payung validasi produk rilis. Sebagian besar pekerjaan
berlangsung dalam alur kerja turunan sehingga box yang gagal dapat dijalankan ulang tanpa memulai ulang
seluruh rilis. Jalankan persiapan rilis sebelum membekukan Code SHA; langkah ini
memperbarui keluaran locale Control UI ketika bot latar belakang belum menerapkannya,
lalu memberlakukan pemeriksaan ketat tanpa fallback yang sama seperti yang digunakan oleh CI rilis.

Bekukan commit lengkap-produk sebelum changelog sebagai **Code SHA**, lalu jalankan:

```bash
pnpm ci:full-release \
  --sha <code-sha> \
  --target-ref release/YYYY.M.PATCH
```

`provider` juga menerima `anthropic` atau `minimax` untuk onboarding lintas OS dan
giliran agen menyeluruh. Pembantu menyimpulkan profil `beta` dari versi paket
alpha/beta dan `stable` untuk kasus lainnya. Teruskan input alur kerja alternatif dengan
`-f key=value`; gunakan `-f release_profile=full` hanya untuk penyisiran advisori yang luas.

Pembantu membuat ref `release-ci/*` sementara yang disematkan ke satu SHA alur kerja
`origin/main` tepercaya, meneruskan SHA target hanya sebagai kandidat `ref`,
dan menghapus ref sementara setelah validasi. Setiap alur kerja turunan yang dipicu harus
melaporkan SHA alur kerja yang sama. Teruskan
`-f reuse_evidence=false` untuk memaksa proses baru atau
`--workflow-sha <trusted-main-sha>` untuk memilih commit alur kerja lama yang masih
dapat dijangkau dari `origin/main` saat ini. Alur kerja tidak pernah membuat atau memperbarui
ref repositori itu sendiri.

Ketika Code SHA berstatus hijau, buat dan commit hanya `CHANGELOG.md`. Commit baru ini
adalah **Release SHA**. Jalankan pembantu yang sama untuk Release SHA. Bukti produk
digunakan kembali hanya ketika GitHub membuktikan bahwa Release SHA merupakan turunan dari
Code SHA dan kumpulan lengkap jalur yang berubah tepat `CHANGELOG.md`; prapemeriksaan npm
serta penerimaan paket/instalasi tetap berjalan pada Release SHA.

`release_profile=stable` dan `release_profile=full` selalu menjalankan soak
live/Docker yang menyeluruh. Teruskan `run_release_soak=true` untuk menyertakan lane soak yang sama
dengan profil `beta`. Publikasi stabil menolak manifes validasi
tanpa soak ini dan bukti performa produk yang bersifat memblokir.

Package Acceptance biasanya membangun tarball kandidat dari
`ref` yang telah diuraikan, termasuk proses SHA lengkap yang dipicu dengan `pnpm ci:full-release`. Setelah
publikasi beta, teruskan `release_package_spec=openclaw@YYYY.M.PATCH-beta.N` untuk menggunakan kembali
paket npm yang telah dirilis pada pemeriksaan rilis, Package Acceptance, lintas OS,
Docker jalur-rilis, dan Telegram paket. Gunakan `package_acceptance_package_spec`
hanya ketika Package Acceptance memang dimaksudkan untuk membuktikan paket yang berbeda.
Lane paket live Plugin Codex mengikuti keadaan yang sama: nilai
`release_package_spec` yang telah dipublikasikan menghasilkan `codex_plugin_spec=npm:@openclaw/codex@<version>`;
proses SHA/artefak mengemas `extensions/codex` dari ref yang dipilih; dan operator
dapat menetapkan `codex_plugin_spec` secara langsung untuk sumber Plugin `npm:`, `npm-pack:`, atau `git:`.
Lane tersebut memberikan persetujuan instalasi Codex CLI eksplisit yang diwajibkan oleh
Plugin itu, lalu menjalankan prapemeriksaan Codex CLI dan giliran agen OpenAI dalam sesi yang sama.
Giliran terakhirnya yang tanpa percobaan ulang dan dengan pemikiran sedang mengirimkan progres yang terlihat dengan
Codex `final` yang dihilangkan, membaca input ruang kerja yang diacak, menulis artefaknya
secara persis, dan mengirimkan penyelesaian eksplisit. Hal ini mendeteksi regresi v2026.7.1 ketika
pengiriman progres biasa menghentikan giliran.

## Tahap tingkat atas

Untuk `rerun_group=all`, job `Check for reusable validation evidence` berjalan
terlebih dahulu. Job ini mencari validasi penuh berstatus hijau sebelumnya yang paling baru dengan profil rilis,
pengaturan soak efektif, dan input validasi yang sama. Proses ulang target persis menggunakan
`exact-target-full-validation-v1`. Turunan yang delta lengkapnya tepat
`CHANGELOG.md` menggunakan `changelog-only-release-v1`; setiap lane produk dilewati
dan pemverifikasi secara independen memeriksa ulang perbandingan commit GitHub, artefak induk
yang tidak dapat diubah, proses turunan, dan log pemicuan. Perubahan target lainnya mengharuskan
validasi Code SHA baru. Teruskan `reuse_evidence=false` untuk memaksa proses penuh
yang baru. Penggunaan kembali bukti hanya berjalan dari `main` atau ref
`release-ci/*` kanonis yang disematkan ke SHA dan commit alur kerjanya tetap berada pada garis keturunan
`main` tepercaya; ref alur kerja lainnya menjalankan lane yang dipilih dari awal.

Validasi baru yang berhadapan dengan paket menyiapkan satu tarball yang tidak dapat diubah beserta satu artefak
image Docker sebelum memicu Plugin Prerelease dan OpenClaw Release Checks.
Kedua alur kerja turunan memverifikasi SHA paket, ID artefak, digest layanan,
percobaan proses produsen, dan digest arsip Docker yang sama sebelum digunakan. Lapisan bare Docker
yang tidak bergantung pada paket menggunakan cache GHCR berbasis alamat konten; image khusus kandidat
tetap menjadi artefak GitHub yang tidak dapat diubah. Proses terfokus dengan spesifikasi paket
terpublikasi yang eksplisit tetap mempertahankan jalur paket yang ada.

Selain itu, untuk `rerun_group=all`, job `Verify Docker runtime image assets` membangun
target Docker `runtime-assets` dengan
`OPENCLAW_EXTENSIONS=diagnostics-otel,codex`. Job ini berjalan paralel dengan
tahap lainnya dan diberlakukan oleh pemverifikasi payung; lane tidak lagi menunggunya
sebelum dipicu. `rerun_group` yang lebih sempit melewati prapemeriksaan ini.

| Tahap                   | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Resolusi target         | **Job:** `Resolve target ref`<br />**Alur kerja turunan:** tidak ada<br />**Membuktikan:** menguraikan cabang rilis, tag, atau SHA commit lengkap dan mencatat input yang dipilih.<br />**Jalankan ulang:** jalankan ulang payung jika tahap ini gagal.                                                                                                                                                                                                                                                                                                            |
| Kandidat bersama        | **Job:** `Prepare shared release candidate`<br />**Alur kerja turunan:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Membuktikan:** mengemas dan memvalidasi satu paket dengan SHA persis, membangun satu image Docker yang berfungsi, serta mencatat tuple artefak paket dan image yang tidak dapat diubah untuk kedua alur kerja turunan yang berhadapan dengan paket.<br />**Jalankan ulang:** jalankan ulang grup paket, prarilis Plugin, lintas OS, atau live/E2E yang terdampak.                                                                                                                 |
| Prapemeriksaan aset Docker | **Job:** `Verify Docker runtime image assets`<br />**Alur kerja turunan:** tidak ada<br />**Membuktikan:** target build Docker `runtime-assets` tetap berhasil sebelum tahap lain dipicu. Hanya berjalan untuk `rerun_group=all`.<br />**Jalankan ulang:** jalankan ulang payung dengan `rerun_group=all`.                                                                                                                                                                                                                                         |
| Vitest dan CI normal    | **Job:** `Run normal full CI`<br />**Alur kerja turunan:** `CI`<br />**Membuktikan:** grafik CI penuh manual terhadap ref target, termasuk lane Linux Node, shard Plugin yang dibundel, shard kontrak Plugin dan channel, kompatibilitas Node 22, `check-*`, `check-additional-*`, pemeriksaan smoke artefak hasil build, pemeriksaan dokumentasi, Skills Python, Windows, macOS, i18n Control UI, dan Android melalui payung.<br />**Jalankan ulang:** `rerun_group=ci`.                                                                                          |
| Prarilis Plugin         | **Job:** `Run plugin prerelease validation`<br />**Alur kerja turunan:** `Plugin Prerelease`<br />**Membuktikan:** pemeriksaan statis Plugin khusus rilis, cakupan Plugin agentik, shard batch Plugin penuh, lane Docker prarilis Plugin, dan artefak `plugin-inspector-advisory` yang tidak memblokir untuk triase kompatibilitas.<br />**Jalankan ulang:** `rerun_group=plugin-prerelease`.                                                                                                                                                          |
| Pemeriksaan rilis       | **Job:** `Run release/live/Docker/QA validation`<br />**Alur kerja turunan:** `OpenClaw Release Checks`<br />**Membuktikan:** smoke instalasi, pemeriksaan paket lintas OS, Package Acceptance, paritas QA Lab, Matrix dan Telegram live, serta lane advisori Discord, WhatsApp, dan Slack yang bergated. Profil stabil dan penuh juga menjalankan rangkaian live/E2E menyeluruh dan potongan Docker jalur-rilis; beta dapat menyertakannya dengan `run_release_soak=true`.<br />**Jalankan ulang:** `rerun_group=release-checks` atau handle pemeriksaan rilis yang lebih sempit.              |
| Telegram paket          | **Job:** `Run package Telegram E2E`<br />**Alur kerja turunan:** `NPM Telegram Beta E2E`<br />**Membuktikan:** E2E Telegram paket terpublikasi yang terfokus ketika `release_package_spec` atau `npm_telegram_package_spec` ditetapkan. Validasi kandidat penuh menggunakan E2E Telegram Package Acceptance kanonis sebagai gantinya.<br />**Jalankan ulang:** `rerun_group=npm-telegram` dengan `release_package_spec` atau `npm_telegram_package_spec`.                                                                                                              |
| Performa produk         | **Job:** `Run product performance evidence`<br />**Alur kerja turunan:** `OpenClaw Performance`<br />**Membuktikan:** proses performa profil-rilis (`profile=release`, `repeat=3`, `fail_on_regression=true`, `publish_reports=false`) terhadap SHA target. Keluaran Kova tetap berada dalam artefak alur kerja dan alur kerja turunan harus membuktikan bahwa penerbit laporannya dilewati. Diwajibkan (memblokir) hanya untuk `rerun_group=all` atau `rerun_group=performance`; tidak diwajibkan untuk grup proses ulang yang lebih sempit.<br />**Jalankan ulang:** `rerun_group=performance`. |
| Pemverifikasi payung    | **Job:** `Verify full validation`<br />**Alur kerja turunan:** tidak ada<br />**Membuktikan:** memeriksa ulang kesimpulan proses turunan yang tercatat dan menambahkan tabel job paling lambat dari alur kerja turunan.<br />**Jalankan ulang:** jalankan ulang hanya job ini setelah menjalankan ulang alur kerja turunan yang gagal hingga berstatus hijau.                                                                                                                                                                                                                                                                 |

Payung selalu memicu performa produk dalam mode khusus artefak.
`OpenClaw Performance` mengizinkan publikasi laporan hanya untuk proses terjadwal atau
pemicuan manual yang secara eksplisit menetapkan `publish_reports=true`. Pengaman khusus artefak
harus selesai dengan sukses, yang membuktikan bahwa job penerbit tetap dilewati.
Bukti baru dan yang digunakan kembali mencatat
`controls.performanceReportPublication=artifact-only`; pemverifikasi dan pemilih penggunaan kembali
menolak bukti tanpa pembuktian turunan performa ternormalisasi yang sesuai.

Pemverifikasi mengunggah manifes kanonis sebagai
`full-release-validation-<run-id>-<run-attempt>`. Peralatan bukti memvalidasi
ID artefak, digest, proses produsen, dan percobaannya sebelum mengunduh ID artefak tersebut secara persis.
Peralatan ini membatasi ZIP yang diunduh, memverifikasi byte-nya terhadap digest REST
`sha256:`, dan mengalirkan satu-satunya entri manifes berbatas yang diizinkan tanpa
mengekstrak arsip. Alias nama stabil tetap tersedia sementara untuk konsumen publikasi
lama. Pemverifikasi selalu mengutamakan artefak yang dikualifikasi berdasarkan percobaan;
sebagai transisi, artefak ini menerima nama stabil hanya untuk produsen manifes v2 percobaan-1.
Artefak ini menolak nama lama tersebut untuk percobaan berikutnya dan manifes v3.

Untuk `ref=main` dengan `rerun_group=all`, untuk ref `release/*`, dan untuk ref alfa Tideclaw, proses payung yang lebih baru menggantikan proses yang lebih lama dengan ref dan grup pengulangan yang sama. Saat induk dibatalkan, pemantaunya membatalkan setiap alur kerja anak yang telah dimulainya. Proses validasi tag dan SHA tersemat tidak saling membatalkan.

## Tahapan pemeriksaan rilis

`OpenClaw Release Checks` adalah alur kerja anak terbesar. Alur kerja ini menetapkan target satu kali dan memvalidasi artefak paket bersama milik proses payung jika tersedia. Pemanggilan langsung atau terfokus menyiapkan artefak `release-package-under-test` sendiri ketika tahapan yang berkaitan dengan paket atau Docker memerlukannya.

| Tahap                    | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Target rilis             | **Pekerjaan:** `Resolve target ref`<br />**Alur kerja pendukung:** tidak ada<br />**Pengujian:** ref yang dipilih, SHA yang diharapkan secara opsional, profil, grup pengulangan, dan filter rangkaian pengujian langsung terfokus.<br />**Pengulangan:** `rerun_group=release-checks`.                                                                                                                                                                                                                                                                                                                                                             |
| Artefak paket            | **Pekerjaan:** `Prepare release package artifact`<br />**Alur kerja pendukung:** tidak ada<br />**Pengujian:** memvalidasi tuple paket tetap milik proses payung, atau mengemas satu tarball kandidat untuk pemanggilan Pemeriksaan Rilis langsung/terfokus, lalu menyediakannya untuk pemeriksaan hilir yang berkaitan dengan paket.<br />**Pengulangan:** grup paket, lintas-OS, atau langsung/E2E yang terpengaruh.                                                                                                                                                                                                                                |
| Smoke penginstalan       | **Pekerjaan:** `Run install smoke`<br />**Alur kerja pendukung:** `Install Smoke`<br />**Pengujian:** jalur penginstalan lengkap dengan penggunaan kembali image smoke Dockerfile root, penginstalan paket QR, smoke Docker root dan Gateway, pengujian Docker penginstal, serta smoke penyedia image penginstalan global Bun.<br />**Pengulangan:** `rerun_group=install-smoke`.                                                                                                                                                                                                                                                           |
| Lintas-OS                | **Pekerjaan:** `cross_os_release_checks`<br />**Alur kerja pendukung:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Pengujian:** lajur penginstalan baru dan peningkatan pada Linux, Windows, dan macOS untuk penyedia serta mode yang dipilih, menggunakan tarball kandidat beserta paket acuan.<br />**Pengulangan:** `rerun_group=cross-os`.                                                                                                                                                                                                                                                                 |
| E2E repositori dan langsung | **Pekerjaan:** `Run repo/live E2E validation`<br />**Alur kerja pendukung:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Pengujian:** E2E repositori, cache langsung, streaming websocket OpenAI, shard penyedia langsung native dan Plugin, serta harness model/backend/Gateway langsung berbasis Docker yang dipilih oleh `release_profile`.<br />**Proses:** `run_release_soak=true`, `release_profile=full`, atau `rerun_group=live-e2e` terfokus.<br />**Pengulangan:** `rerun_group=live-e2e`, secara opsional dengan `live_suite_filter`.                                                                                |
| Jalur rilis Docker       | **Pekerjaan:** `Run Docker release-path validation`<br />**Alur kerja pendukung:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Pengujian:** potongan Docker jalur rilis terhadap artefak paket bersama.<br />**Proses:** `run_release_soak=true`, `release_profile=full`, atau `rerun_group=live-e2e` terfokus.<br />**Pengulangan:** `rerun_group=live-e2e`.                                                                                                                                                                                                                                     |
| Penerimaan Paket         | **Pekerjaan:** `Run package acceptance`<br />**Alur kerja pendukung:** `Package Acceptance`<br />**Pengujian:** fixture paket Plugin luring, pembaruan Plugin, E2E paket Telegram mock-OpenAI kanonis, dan pemeriksaan ketahanan setelah peningkatan dari versi terpublikasi terhadap tarball yang sama. Pemeriksaan rilis yang memblokir menggunakan acuan terpublikasi terbaru secara default; pemeriksaan soak (`run_release_soak=true`) memperluas cakupan ke 4 rilis npm stabil terakhir ditambah 3 versi historis tersemat (`2026.4.23`, `2026.5.2`, `2026.4.15`), yang dijalankan terhadap fixture peningkatan untuk masalah yang dilaporkan.<br />**Pengulangan:** `rerun_group=package`. |
| Kartu skor kematangan    | **Pekerjaan:** `Render maturity scorecard release docs`<br />**Alur kerja pendukung:** `maturity-scorecard.yml`<br />**Pengujian:** merender dokumentasi kartu skor kematangan yang bersifat saran terhadap ref target. Hanya dijalankan ketika `run_maturity_scorecard=true` diteruskan.<br />**Pengulangan:** `rerun_group=qa` dengan `run_maturity_scorecard=true`.                                                                                                                                                                                                                                                           |
| Paritas QA               | **Pekerjaan:** `Run QA Lab parity lane` dan `Run QA Lab parity report`<br />**Alur kerja pendukung:** pekerjaan langsung<br />**Pengujian:** paket paritas agentik kandidat dan acuan, lalu laporan paritas.<br />**Pengulangan:** `rerun_group=qa-parity` atau `rerun_group=qa`.                                                                                                                                                                                                                                                                                                                         |
| Paritas runtime QA       | **Pekerjaan:** `Run QA Lab runtime parity lane`<br />**Alur kerja pendukung:** pekerjaan langsung<br />**Pengujian:** lajur paritas agentik pasangan runtime `openclaw`/`codex` (`pnpm openclaw qa suite --runtime-pair openclaw,codex`), termasuk tingkat standar dan, dengan `run_release_soak=true`, tingkat soak. Bersifat saran: kegagalan individual tidak memblokir pemverifikasi pemeriksaan rilis.<br />**Pengulangan:** `rerun_group=qa-parity` atau `rerun_group=qa`.                                                                                                                                                    |
| Cakupan alat runtime QA  | **Pekerjaan:** `Enforce QA Lab runtime tool coverage`<br />**Alur kerja pendukung:** pekerjaan langsung<br />**Pengujian:** pergeseran alat dinamis antara `openclaw` dan `codex` dalam tingkat paritas runtime standar (`pnpm openclaw qa coverage --tools`), menggunakan keluaran lajur paritas runtime QA. Memblokir: pekerjaan ini tidak dapat dikesampingkan sebagai saran.<br />**Pengulangan:** `rerun_group=qa-parity` atau `rerun_group=qa`.                                                                                                                                                                                        |
| Matrix langsung QA       | **Pekerjaan:** `Run QA Live Matrix profile`<br />**Alur kerja pendukung:** alur kerja dapat digunakan kembali `QA-Lab - All Lanes`<br />**Pengujian:** skenario YAML yang telah dibuktikan paritasnya melalui adaptor langsung Matrix bersama di lingkungan `qa-live-shared`.<br />**Pengulangan:** `rerun_group=qa-live` atau `rerun_group=qa`; gunakan `live_suite_filter=qa-live-matrix` untuk pengulangan Matrix terfokus.                                                                                                                                                                                                                    |
| Telegram langsung QA     | **Pekerjaan:** `Run QA Lab live Telegram lane`<br />**Alur kerja pendukung:** pemanggilan `OpenClaw Release Telegram QA` tepercaya<br />**Pengujian:** QA Telegram langsung dengan sewa kredensial CI Convex.<br />**Pengulangan:** `rerun_group=qa-live` atau `rerun_group=qa`.                                                                                                                                                                                                                                                                                                                                 |
| Discord langsung QA      | **Pekerjaan:** `Run QA Lab live Discord lane`<br />**Alur kerja pendukung:** pekerjaan langsung yang bersifat saran<br />**Pengujian:** QA Discord langsung dengan sewa kredensial CI Convex ketika `OPENCLAW_RELEASE_QA_DISCORD_LIVE_CI_ENABLED` diaktifkan.<br />**Pengulangan:** `rerun_group=qa-live` dengan `live_suite_filter=qa-live-discord`.                                                                                                                                                                                                                                                                            |
| WhatsApp langsung QA     | **Pekerjaan:** `Run QA Lab live WhatsApp lane`<br />**Alur kerja pendukung:** pekerjaan langsung yang bersifat saran<br />**Pengujian:** QA WhatsApp langsung dengan sewa kredensial CI Convex ketika `OPENCLAW_RELEASE_QA_WHATSAPP_LIVE_CI_ENABLED` diaktifkan.<br />**Pengulangan:** `rerun_group=qa-live` dengan `live_suite_filter=qa-live-whatsapp`.                                                                                                                                                                                                                                                                        |
| Slack langsung QA        | **Pekerjaan:** `Run QA Lab live Slack lane`<br />**Alur kerja pendukung:** pekerjaan langsung yang bersifat saran<br />**Pengujian:** QA Slack langsung dengan sewa kredensial CI Convex ketika `OPENCLAW_RELEASE_QA_SLACK_LIVE_CI_ENABLED` diaktifkan.<br />**Pengulangan:** `rerun_group=qa-live` dengan `live_suite_filter=qa-live-slack`.                                                                                                                                                                                                                                                                                    |
| Pemverifikasi rilis      | **Pekerjaan:** `Verify release checks`<br />**Alur kerja pendukung:** tidak ada<br />**Pengujian:** pekerjaan pemeriksaan rilis yang diwajibkan untuk grup pengulangan yang dipilih.<br />**Pengulangan:** ulangi setelah pekerjaan anak terfokus berhasil.                                                                                                                                                                                                                                                                                                                                                                                   |

## Potongan jalur rilis Docker

Tahap jalur rilis Docker menjalankan potongan berikut ketika `live_suite_filter` kosong:

| Bagian                                                           | Cakupan                                                                                                                                     |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `core`                                                          | Jalur smoke jalur-rilis Docker inti.                                                                                                        |
| `package-update-openai`                                         | Perilaku pemasangan/pembaruan paket OpenAI, pemasangan Codex sesuai permintaan, tindak lanjut progres langsung plugin Codex, dan pemanggilan alat Chat Completions. |
| `package-update-anthropic`                                      | Perilaku pemasangan dan pembaruan paket Anthropic.                                                                                               |
| `package-update-core`                                           | Perilaku paket dan pembaruan yang netral terhadap penyedia.                                                                                                |
| `plugins-runtime-plugins`                                       | Jalur runtime Plugin yang menguji perilaku plugin.                                                                                          |
| `plugins-runtime-services`                                      | Jalur runtime plugin yang didukung layanan dan langsung.                                                                                                |
| `plugins-runtime-install-a` hingga `plugins-runtime-install-h` | Batch pemasangan/runtime Plugin yang dipisahkan untuk validasi rilis paralel.                                                                        |
| `openwebui`                                                     | Smoke kompatibilitas OpenWebUI yang diisolasi pada runner khusus berkapasitas disk besar saat diminta.                                                      |

Gunakan `docker_lanes=<lane[,lane]>` yang ditargetkan pada alur kerja langsung/E2E yang dapat digunakan kembali ketika
hanya satu jalur Docker yang gagal. Artefak rilis menyertakan perintah pengulangan
per jalur dengan input penggunaan kembali artefak paket dan image jika tersedia.

## Profil rilis

`release_profile` terutama mengontrol keluasan langsung/penyedia dalam pemeriksaan rilis.
Ini tidak menghapus CI penuh normal, Prarilis Plugin, smoke pemasangan, penerimaan
paket, atau QA Lab. Profil stabil dan penuh selalu menjalankan cakupan menyeluruh E2E
repo/langsung dan soak jalur-rilis Docker. Profil beta dapat mengaktifkannya dengan
`run_release_soak=true`. Penerimaan Paket menyediakan E2E Telegram paket kanonis
untuk setiap kandidat penuh, sehingga alur payung tidak menduplikasi poller langsung tersebut.

| Profil  | Tujuan penggunaan                      | Cakupan langsung/penyedia yang disertakan                                                                                                                                                                            |
| -------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `beta`   | Smoke kritis-rilis tercepat.   | Jalur langsung OpenAI/inti, model langsung Docker untuk OpenAI, inti gateway native, profil gateway OpenAI native, plugin OpenAI native, dan gateway langsung Docker OpenAI.                                            |
| `stable` | Profil persetujuan rilis default. | `beta` ditambah smoke Anthropic, Google, MiniMax, backend, harness pengujian langsung native, backend CLI langsung Docker, pengikatan ACP Docker, harness Codex Docker, pengumuman subagen Docker, dan shard smoke OpenCode Go. |
| `full`   | Penyisiran advisori luas.             | `stable` ditambah penyedia advisori, shard langsung plugin, dan shard langsung media.                                                                                                                               |

## Tambahan khusus penuh

Suite ini dilewati oleh `stable` dan disertakan oleh `full`:

| Area                             | Cakupan khusus penuh                                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Model langsung Docker               | OpenCode Go, OpenRouter, xAI, Z.ai, dan Fireworks.                                                                          |
| Gateway langsung Docker              | Penyedia advisori yang dibagi menjadi shard DeepSeek/Fireworks, OpenCode Go/OpenRouter, dan xAI/Z.ai.                              |
| Profil penyedia gateway native | Shard penuh Anthropic Opus dan Sonnet/Haiku, Fireworks, DeepSeek, shard model OpenCode Go penuh, OpenRouter, xAI, dan Z.ai. |
| Shard langsung plugin native        | Plugin A-K, L-N, O-Z lainnya, Moonshot, dan xAI.                                                                             |
| Shard langsung media native         | Grup audio, musik Google, musik MiniMax, dan video A-D.                                                                   |

`stable` mencakup `native-live-src-gateway-profiles-anthropic-smoke` dan
`native-live-src-gateway-profiles-opencode-go-smoke`; `full` menggunakan shard model
Anthropic dan OpenCode Go yang lebih luas. Pengulangan terfokus tetap dapat menggunakan
handle agregat `native-live-src-gateway-profiles-anthropic` atau
`native-live-src-gateway-profiles-opencode-go`.

## Pengulangan terfokus

Gunakan `rerun_group` untuk menghindari pengulangan kotak rilis yang tidak terkait:

| Handle              | Cakupan                                                                                           |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| `all`               | Semua tahap Validasi Rilis Penuh.                                                             |
| `ci`                | Hanya alur turunan CI penuh manual.                                                                      |
| `plugin-prerelease` | Hanya alur turunan Prarilis Plugin.                                                                   |
| `release-checks`    | Semua tahap Pemeriksaan Rilis OpenClaw.                                                             |
| `install-smoke`     | Smoke Pemasangan hingga pemeriksaan rilis.                                                           |
| `cross-os`          | Pemeriksaan rilis lintas-OS.                                                                        |
| `live-e2e`          | E2E repo/langsung dan validasi jalur-rilis Docker.                                               |
| `package`           | Penerimaan Paket.                                                                             |
| `qa`                | Paritas QA ditambah jalur langsung QA.                                                                   |
| `qa-parity`         | Hanya jalur dan laporan paritas QA.                                                                |
| `qa-live`           | Matrix/Telegram langsung QA ditambah jalur Discord, WhatsApp, dan Slack yang diberi gerbang saat diaktifkan.             |
| `npm-telegram`      | E2E Telegram paket yang dipublikasikan; memerlukan `release_package_spec` atau `npm_telegram_package_spec`. |
| `performance`       | Hanya bukti performa produk.                                                              |

Gunakan `live_suite_filter` dengan `rerun_group=live-e2e` ketika satu suite langsung gagal.
ID filter yang valid ditentukan dalam alur kerja langsung/E2E yang dapat digunakan kembali, termasuk
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker`, dan
`live-codex-harness-docker`.

Untuk pengulangan transportasi QA terfokus, tetapkan `rerun_group=qa-live` dan gunakan
pemilih kanonis `qa-live-matrix`, `qa-live-telegram`, `qa-live-discord`,
`qa-live-whatsapp`, atau `qa-live-slack`.

Handle `live-gateway-advisory-docker` adalah handle pengulangan agregat untuk
tiga shard penyedianya, sehingga tetap menyebar ke semua tugas gateway Docker advisori.

Gunakan `cross_os_suite_filter` dengan `rerun_group=cross-os` ketika satu jalur lintas-OS
gagal. Filter menerima ID OS, ID suite, atau pasangan OS/suite, misalnya
`windows/packaged-upgrade`, `windows`, atau `packaged-fresh`. Ringkasan lintas-OS
menyertakan pengaturan waktu per fase untuk jalur peningkatan versi terpaket, dan perintah
yang berjalan lama mencetak baris Heartbeat agar pembaruan yang macet terlihat sebelum batas
waktu tugas.

Kegagalan pemeriksaan rilis QA memblokir validasi rilis normal hanya untuk jalur
cakupan alat runtime Matrix, Telegram, dan QA yang dipilih. Paritas QA, paritas
runtime, dan jalur langsung Discord, WhatsApp, serta Slack yang diberi gerbang bersifat advisori dan
mempublikasikan artefak status tanpa memblokir pemverifikasi rilis. Proses alfa Tideclaw
masih dapat memperlakukan jalur pemeriksaan rilis yang bukan untuk keamanan paket sebagai advisori. Dengan
`release_profile=beta`, suite penyedia-langsung `Run repo/live E2E validation`
bersifat advisori: deployment model pihak ketiga berubah saat rilis berlangsung, sehingga
beta menampilkan kegagalannya sebagai peringatan, sementara profil stabil dan penuh tetap
menjadikannya pemblokir. Ketika
`live_suite_filter` secara eksplisit meminta jalur langsung QA yang diberi gerbang seperti Discord,
WhatsApp, atau Slack, variabel repo `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` yang sesuai
harus diaktifkan; jika tidak, pengambilan input gagal alih-alih melewati jalur secara diam-diam.
Jalankan ulang `rerun_group=qa`, `qa-parity`, atau `qa-live` saat Anda
memerlukan bukti QA baru.

## Bukti yang perlu disimpan

Simpan ringkasan `Full Release Validation` sebagai indeks tingkat rilis. Ringkasan tersebut menautkan
ID proses turunan dan menyertakan tabel tugas paling lambat. Untuk kegagalan, periksa alur kerja
turunan terlebih dahulu, lalu jalankan ulang handle terkecil yang sesuai di atas.

Catat Code SHA dan Release SHA, kebijakan penggunaan kembali dan kumpulan jalur yang berubah,
proses induk Code SHA hijau, serta proses induk Release SHA ringan.

Artefak yang berguna:

- `release-package-under-test` dari `OpenClaw Release Checks`
- Artefak jalur-rilis Docker di bawah `.artifacts/docker-tests/`
- Penerimaan Paket `package-under-test` dan artefak penerimaan Docker
- Artefak pemeriksaan rilis lintas-OS untuk setiap OS dan suite
- Artefak paritas QA, paritas runtime, serta Matrix, Telegram, Discord, WhatsApp,
  atau Slack yang dipilih

## File alur kerja

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
