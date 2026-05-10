---
read_when:
    - Menjalankan atau menjalankan ulang Validasi Rilis Penuh
    - Membandingkan profil validasi rilis stabil dan lengkap
    - Men-debug kegagalan tahap validasi rilis
summary: Tahap Validasi Rilis Lengkap, alur kerja turunan, profil rilis, referensi jalankan ulang, dan bukti
title: Validasi rilis lengkap
x-i18n:
    generated_at: "2026-05-10T19:51:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a479b2d79ae2710c501d583ad14f913a32382bba8dfd7ec9d25124357743e20
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` adalah payung rilis. Ini adalah satu-satunya titik masuk manual
untuk bukti pra-rilis, tetapi sebagian besar pekerjaan terjadi di alur kerja turunan sehingga
box yang gagal dapat dijalankan ulang tanpa memulai ulang seluruh rilis.

Jalankan dari ref alur kerja tepercaya, biasanya `main`, dan teruskan cabang rilis,
tag, atau SHA commit lengkap sebagai `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Alur kerja turunan menggunakan ref alur kerja tepercaya untuk harness dan input
`ref` untuk kandidat yang diuji. Ini membuat logika validasi baru tetap tersedia
saat memvalidasi cabang atau tag rilis yang lebih lama.

Secara default, `release_profile=stable` menjalankan lane pemblokir rilis dan melewati
soak live/Docker yang menyeluruh. Teruskan `run_release_soak=true` untuk menyertakan
lane soak pada run stabil. `release_profile=full` selalu mengaktifkan lane soak sehingga
profil advisory yang luas tidak pernah mengurangi cakupan secara diam-diam.

Package Acceptance biasanya membangun tarball kandidat dari `ref` yang di-resolve,
termasuk run SHA lengkap yang dikirim dengan `pnpm ci:full-release`. Setelah publish,
teruskan `package_acceptance_package_spec=openclaw@YYYY.M.D` (atau
`openclaw@beta`/`openclaw@latest`) untuk menjalankan matriks paket/pembaruan yang sama terhadap
paket npm yang telah dikirim sebagai gantinya.

## Tahap tingkat atas

| Tahap                | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Resolusi target    | **Job:** `Resolve target ref`<br />**Alur kerja turunan:** tidak ada<br />**Membuktikan:** me-resolve cabang rilis, tag, atau SHA commit lengkap dan mencatat input yang dipilih.<br />**Jalankan ulang:** jalankan ulang payung jika ini gagal.                                                                                                                                                                                                                               |
| Vitest dan CI normal | **Job:** `Run normal full CI`<br />**Alur kerja turunan:** `CI`<br />**Membuktikan:** grafik CI lengkap manual terhadap ref target, termasuk lane Linux Node, shard Plugin bundel, kontrak channel, kompatibilitas Node 22, `check`, `check-additional`, build smoke, pemeriksaan docs, Skills Python, Windows, macOS, i18n Control UI, dan Android melalui payung.<br />**Jalankan ulang:** `rerun_group=ci`.                                                  |
| Pra-rilis Plugin    | **Job:** `Run plugin prerelease validation`<br />**Alur kerja turunan:** `Plugin Prerelease`<br />**Membuktikan:** pemeriksaan statis Plugin khusus rilis, cakupan Plugin agentic, shard batch ekstensi penuh, dan lane Docker pra-rilis Plugin.<br />**Jalankan ulang:** `rerun_group=plugin-prerelease`.                                                                                                                                                        |
| Pemeriksaan rilis       | **Job:** `Run release/live/Docker/QA validation`<br />**Alur kerja turunan:** `OpenClaw Release Checks`<br />**Membuktikan:** install smoke, pemeriksaan paket lintas-OS, Package Acceptance, paritas QA Lab, Matrix live, dan Telegram live. Dengan `run_release_soak=true` atau `release_profile=full`, juga menjalankan suite live/E2E menyeluruh dan chunk jalur rilis Docker.<br />**Jalankan ulang:** `rerun_group=release-checks` atau handle release-checks yang lebih sempit. |
| Artefak paket     | **Job:** `Prepare release package artifact`<br />**Alur kerja turunan:** tidak ada<br />**Membuktikan:** membuat tarball induk `release-package-under-test` cukup awal untuk pemeriksaan yang menghadap paket yang tidak perlu menunggu `OpenClaw Release Checks`.<br />**Jalankan ulang:** jalankan ulang payung atau berikan `npm_telegram_package_spec` untuk `rerun_group=npm-telegram`.                                                                                    |
| Paket Telegram     | **Job:** `Run package Telegram E2E`<br />**Alur kerja turunan:** `NPM Telegram Beta E2E`<br />**Membuktikan:** bukti paket Telegram berbasis artefak induk untuk `rerun_group=all` dengan `release_profile=full`, atau bukti Telegram paket yang dipublish saat `npm_telegram_package_spec` diatur.<br />**Jalankan ulang:** `rerun_group=npm-telegram` dengan `npm_telegram_package_spec`.                                                                               |
| Verifikator payung    | **Job:** `Verify full validation`<br />**Alur kerja turunan:** tidak ada<br />**Membuktikan:** memeriksa ulang kesimpulan run turunan yang tercatat dan menambahkan tabel job paling lambat dari alur kerja turunan.<br />**Jalankan ulang:** jalankan ulang hanya job ini setelah menjalankan ulang turunan yang gagal hingga hijau.                                                                                                                                                                                    |

Untuk `ref=main` dan `rerun_group=all`, payung yang lebih baru menggantikan yang lebih lama.
Saat induk dibatalkan, monitornya membatalkan alur kerja turunan apa pun yang sudah
dikirim. Run validasi cabang dan tag rilis tidak saling membatalkan secara
default.

## Tahap pemeriksaan rilis

`OpenClaw Release Checks` adalah alur kerja turunan terbesar. Ini me-resolve target
sekali dan menyiapkan artefak bersama `release-package-under-test` saat tahap yang
menghadap paket atau Docker membutuhkannya.

| Tahap               | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Target rilis        | **Pekerjaan:** `Resolve target ref`<br />**Alur kerja pendukung:** tidak ada<br />**Pengujian:** ref yang dipilih, SHA perkiraan opsional, profil, grup jalankan ulang, dan filter suite live terfokus.<br />**Jalankan ulang:** `rerun_group=release-checks`.                                                                                                                                                                                                                                      |
| Artefak paket       | **Pekerjaan:** `Prepare release package artifact`<br />**Alur kerja pendukung:** tidak ada<br />**Pengujian:** mengemas atau menyelesaikan satu tarball kandidat dan mengunggah `release-package-under-test` untuk pemeriksaan hilir yang menghadap paket.<br />**Jalankan ulang:** paket, lintas-OS, atau grup live/E2E yang terpengaruh.                                                                                                                                                       |
| Smoke instalasi     | **Pekerjaan:** `Run install smoke`<br />**Alur kerja pendukung:** `Install Smoke`<br />**Pengujian:** jalur instalasi penuh dengan penggunaan ulang image smoke Dockerfile root, instalasi paket QR, smoke Docker root dan Gateway, pengujian Docker installer, smoke penyedia image instalasi global Bun, dan E2E instalasi/pencopotan Plugin bawaan cepat.<br />**Jalankan ulang:** `rerun_group=install-smoke`.                                                                                 |
| Lintas-OS           | **Pekerjaan:** `cross_os_release_checks`<br />**Alur kerja pendukung:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Pengujian:** jalur baru dan peningkatan di Linux, Windows, dan macOS untuk penyedia dan mode yang dipilih, menggunakan tarball kandidat serta paket baseline.<br />**Jalankan ulang:** `rerun_group=cross-os`.                                                                                                                                                      |
| Repo dan E2E live   | **Pekerjaan:** `Run repo/live E2E validation`<br />**Alur kerja pendukung:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Pengujian:** E2E repositori, cache live, streaming websocket OpenAI, shard penyedia dan Plugin live native, serta harness model/backend/Gateway live berbasis Docker yang dipilih oleh `release_profile`.<br />**Dijalankan:** `run_release_soak=true`, `release_profile=full`, atau `rerun_group=live-e2e` terfokus.<br />**Jalankan ulang:** `rerun_group=live-e2e`, secara opsional dengan `live_suite_filter`. |
| Jalur rilis Docker  | **Pekerjaan:** `Run Docker release-path validation`<br />**Alur kerja pendukung:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Pengujian:** chunk Docker jalur rilis terhadap artefak paket bersama.<br />**Dijalankan:** `run_release_soak=true`, `release_profile=full`, atau `rerun_group=live-e2e` terfokus.<br />**Jalankan ulang:** `rerun_group=live-e2e`.                                                                                                                                 |
| Penerimaan Paket    | **Pekerjaan:** `Run package acceptance`<br />**Alur kerja pendukung:** `Package Acceptance`<br />**Pengujian:** fixture paket Plugin offline, pembaruan Plugin, penerimaan paket Telegram OpenAI tiruan, dan pemeriksaan penyintas peningkatan-terpublikasi terhadap tarball yang sama. Pemeriksaan rilis yang memblokir menggunakan baseline terbaru terpublikasi bawaan; pemeriksaan soak diperluas ke setiap rilis npm stabil pada atau setelah `2026.4.23` plus fixture isu yang dilaporkan.<br />**Jalankan ulang:** `rerun_group=package`. |
| Paritas QA          | **Pekerjaan:** `Run QA Lab parity lane` dan `Run QA Lab parity report`<br />**Alur kerja pendukung:** pekerjaan langsung<br />**Pengujian:** paket paritas agentic kandidat dan baseline, lalu laporan paritas.<br />**Jalankan ulang:** `rerun_group=qa-parity` atau `rerun_group=qa`.                                                                                                                                                                                                          |
| Matrix live QA      | **Pekerjaan:** `Run QA Lab live Matrix lane`<br />**Alur kerja pendukung:** pekerjaan langsung<br />**Pengujian:** profil QA Matrix live cepat di lingkungan `qa-live-shared`.<br />**Jalankan ulang:** `rerun_group=qa-live` atau `rerun_group=qa`.                                                                                                                                                                                                                                               |
| Telegram live QA    | **Pekerjaan:** `Run QA Lab live Telegram lane`<br />**Alur kerja pendukung:** pekerjaan langsung<br />**Pengujian:** QA Telegram live dengan sewa kredensial Convex CI.<br />**Jalankan ulang:** `rerun_group=qa-live` atau `rerun_group=qa`.                                                                                                                                                                                                                                                       |
| Pemverifikasi rilis | **Pekerjaan:** `Verify release checks`<br />**Alur kerja pendukung:** tidak ada<br />**Pengujian:** pekerjaan pemeriksaan rilis wajib untuk grup jalankan ulang yang dipilih.<br />**Jalankan ulang:** jalankan ulang setelah pekerjaan anak terfokus lulus.                                                                                                                                                                                                                                      |

## Bagian jalur rilis Docker

Tahap jalur rilis Docker menjalankan bagian-bagian ini ketika `live_suite_filter`
kosong:

| Bagian                                                          | Cakupan                                                                          |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `core`                                                          | Jalur smoke jalur rilis Docker inti.                                             |
| `package-update-openai`                                         | Perilaku instalasi/pembaruan paket OpenAI, termasuk instalasi sesuai permintaan Codex. |
| `package-update-anthropic`                                      | Perilaku instalasi dan pembaruan paket Anthropic.                                |
| `package-update-core`                                           | Perilaku paket dan pembaruan yang netral penyedia.                               |
| `plugins-runtime-plugins`                                       | Jalur runtime Plugin yang menjalankan perilaku Plugin.                           |
| `plugins-runtime-services`                                      | Jalur runtime Plugin live dan berbasis layanan; mencakup OpenWebUI ketika diminta. |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | Batch instalasi/runtime Plugin yang dibagi untuk validasi rilis paralel.         |

Gunakan `docker_lanes=<lane[,lane]>` yang ditargetkan pada alur kerja live/E2E yang dapat digunakan ulang ketika
hanya satu jalur Docker yang gagal. Artefak rilis mencakup perintah jalankan ulang
per jalur dengan artefak paket dan input penggunaan ulang image ketika tersedia.

## Profil rilis

`release_profile` terutama mengontrol keluasan live/penyedia di dalam pemeriksaan rilis.
Ini tidak menghapus CI penuh normal, Prarilis Plugin, smoke instalasi, penerimaan paket,
atau QA Lab. Untuk `stable`, E2E repo/live yang menyeluruh dan bagian
jalur rilis Docker adalah cakupan soak dan berjalan ketika `run_release_soak=true`.
`full` memaksa cakupan soak aktif dan juga membuat run payung menjalankan E2E Telegram
paket terhadap artefak paket rilis induk ketika `rerun_group=all`, sehingga kandidat
pra-publikasi penuh tidak diam-diam melewati jalur paket Telegram tersebut.

| Profil    | Penggunaan yang dimaksudkan      | Cakupan live/penyedia yang disertakan                                                                                                                                               |
| --------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Smoke kritis rilis tercepat.     | Jalur live OpenAI/inti, model live Docker untuk OpenAI, inti Gateway native, profil Gateway OpenAI native, Plugin OpenAI native, dan Gateway live Docker OpenAI.                   |
| `stable`  | Profil persetujuan rilis bawaan. | `minimum` plus smoke Anthropic, Google, MiniMax, backend, harness pengujian live native, backend CLI live Docker, bind ACP Docker, harness Codex Docker, dan shard smoke OpenCode Go. |
| `full`    | Sweep advisory luas.             | `stable` plus penyedia advisory, shard live Plugin, dan shard live media.                                                                                                           |

## Tambahan khusus full

Suite ini dilewati oleh `stable` dan disertakan oleh `full`:

| Area                             | Cakupan khusus full                                                                                                        |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Model live Docker                | OpenCode Go, OpenRouter, xAI, Z.ai, dan Fireworks.                                                                          |
| Gateway live Docker              | Penyedia advisory yang dibagi menjadi shard DeepSeek/Fireworks, OpenCode Go/OpenRouter, dan xAI/Z.ai.                       |
| Profil penyedia Gateway native   | Shard Anthropic Opus dan Sonnet/Haiku penuh, Fireworks, DeepSeek, shard model OpenCode Go penuh, OpenRouter, xAI, dan Z.ai. |
| Shard live Plugin native         | Plugin A-K, L-N, O-Z lainnya, Moonshot, dan xAI.                                                                            |
| Shard live media native          | Audio, musik Google, musik MiniMax, dan grup video A-D.                                                                     |

`stable` mencakup `native-live-src-gateway-profiles-anthropic-smoke` dan
`native-live-src-gateway-profiles-opencode-go-smoke`; `full` menggunakan shard
model Anthropic dan OpenCode Go yang lebih luas sebagai gantinya. Jalankan ulang terfokus tetap dapat menggunakan
handle agregat `native-live-src-gateway-profiles-anthropic` atau
`native-live-src-gateway-profiles-opencode-go`.

## Jalankan ulang terfokus

Gunakan `rerun_group` untuk menghindari pengulangan kotak rilis yang tidak terkait:

| Penanda             | Cakupan                                                               |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | Semua tahap Validasi Rilis Lengkap.                                   |
| `ci`                | Hanya anak CI lengkap manual.                                         |
| `plugin-prerelease` | Hanya anak Prarilis Plugin.                                           |
| `release-checks`    | Semua tahap Pemeriksaan Rilis OpenClaw.                               |
| `install-smoke`     | Install Smoke melalui pemeriksaan rilis.                              |
| `cross-os`          | Pemeriksaan rilis lintas-OS.                                          |
| `live-e2e`          | Validasi E2E repo/live dan jalur rilis Docker.                        |
| `package`           | Penerimaan Paket.                                                     |
| `qa`                | Paritas QA ditambah jalur QA live.                                    |
| `qa-parity`         | Hanya jalur paritas QA dan laporan.                                   |
| `qa-live`           | Hanya Matrix dan Telegram QA live.                                    |
| `npm-telegram`      | E2E Telegram paket yang dipublikasikan; memerlukan `npm_telegram_package_spec`. |

Gunakan `live_suite_filter` dengan `rerun_group=live-e2e` saat satu suite live gagal.
ID filter yang valid didefinisikan dalam alur kerja live/E2E yang dapat digunakan ulang, termasuk
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker`, dan
`live-codex-harness-docker`.

Penanda `live-gateway-advisory-docker` adalah penanda jalankan ulang agregat untuk
tiga shard penyedianya, sehingga tetap menyebar ke semua tugas Gateway Docker advisory.

Gunakan `cross_os_suite_filter` dengan `rerun_group=cross-os` saat satu jalur lintas-OS
gagal. Filter menerima ID OS, ID suite, atau pasangan OS/suite, misalnya
`windows/packaged-upgrade`, `windows`, atau `packaged-fresh`. Ringkasan lintas-OS
menyertakan waktu per fase untuk jalur peningkatan paket, dan perintah yang berjalan lama
mencetak baris Heartbeat sehingga pembaruan Windows yang macet terlihat sebelum
batas waktu tugas.

Jalur pemeriksaan rilis QA bersifat advisory. Kegagalan khusus QA dilaporkan sebagai peringatan
dan tidak memblokir pemverifikasi pemeriksaan rilis; jalankan ulang `rerun_group=qa`,
`qa-parity`, atau `qa-live` saat Anda memerlukan bukti QA baru.

## Bukti yang perlu disimpan

Simpan ringkasan `Full Release Validation` sebagai indeks tingkat rilis. Ringkasan itu menautkan
ID eksekusi anak dan menyertakan tabel tugas terlambat. Untuk kegagalan, periksa alur kerja
anak terlebih dahulu, lalu jalankan ulang penanda terkecil yang sesuai di atas.

Artefak yang berguna:

- `release-package-under-test` dari induk Full Release Validation dan `OpenClaw Release Checks`
- Artefak jalur rilis Docker di bawah `.artifacts/docker-tests/`
- `package-under-test` Penerimaan Paket dan artefak penerimaan Docker
- Artefak pemeriksaan rilis lintas-OS untuk setiap OS dan suite
- Artefak paritas QA, Matrix, dan Telegram

## File alur kerja

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
