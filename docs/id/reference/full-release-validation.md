---
read_when:
    - Menjalankan atau menjalankan ulang Validasi Rilis Penuh
    - Membandingkan profil validasi rilis stabil dan lengkap
    - Memecahkan masalah kegagalan tahap validasi rilis
summary: Tahapan Validasi Rilis Penuh, alur kerja turunan, profil rilis, pegangan jalankan ulang, dan bukti
title: Validasi rilis penuh
x-i18n:
    generated_at: "2026-05-03T21:36:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 038901ad751c00b35f69d7ec5caf74e577dcf2350d7658037c3ecc9ff5fab6d7
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` adalah payung rilis. Ini adalah titik masuk manual tunggal
untuk bukti pra-rilis, tetapi sebagian besar pekerjaan terjadi di workflow anak sehingga
kotak yang gagal dapat dijalankan ulang tanpa memulai ulang seluruh rilis.

Jalankan dari ref workflow tepercaya, biasanya `main`, dan teruskan cabang rilis,
tag, atau SHA commit lengkap sebagai `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Workflow anak menggunakan ref workflow tepercaya untuk harness dan input
`ref` untuk kandidat yang sedang diuji. Ini membuat logika validasi baru tetap tersedia
saat memvalidasi cabang atau tag rilis yang lebih lama.

Package Acceptance biasanya membangun tarball kandidat dari
`ref` yang telah di-resolve, termasuk run SHA lengkap yang dikirim dengan `pnpm ci:full-release`. Setelah
publish, teruskan `package_acceptance_package_spec=openclaw@YYYY.M.D` (atau
`openclaw@beta`/`openclaw@latest`) untuk menjalankan matriks package/update yang sama terhadap
package npm yang sudah dikirim sebagai gantinya.

## Tahap tingkat atas

| Tahap                | Detail                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Resolusi target    | **Job:** `Resolve target ref`<br />**Workflow anak:** tidak ada<br />**Membuktikan:** me-resolve cabang rilis, tag, atau SHA commit lengkap dan mencatat input yang dipilih.<br />**Jalankan ulang:** jalankan ulang payung jika ini gagal.                                                                                                                                                                              |
| Vitest dan CI normal | **Job:** `Run normal full CI`<br />**Workflow anak:** `CI`<br />**Membuktikan:** grafik CI penuh manual terhadap ref target, termasuk lane Node Linux, shard Plugin terbundel, kontrak channel, kompatibilitas Node 22, `check`, `check-additional`, smoke build, pemeriksaan docs, Skills Python, Windows, macOS, i18n Control UI, dan Android melalui payung.<br />**Jalankan ulang:** `rerun_group=ci`. |
| Pra-rilis Plugin    | **Job:** `Run plugin prerelease validation`<br />**Workflow anak:** `Plugin Prerelease`<br />**Membuktikan:** pemeriksaan statis Plugin khusus rilis, cakupan Plugin agentik, shard batch ekstensi penuh, dan lane Docker pra-rilis Plugin.<br />**Jalankan ulang:** `rerun_group=plugin-prerelease`.                                                                                                       |
| Pemeriksaan rilis       | **Job:** `Run release/live/Docker/QA validation`<br />**Workflow anak:** `OpenClaw Release Checks`<br />**Membuktikan:** smoke instalasi, pemeriksaan package lintas OS, suite live/E2E, potongan jalur rilis Docker, Package Acceptance, paritas QA Lab, Matrix live, dan Telegram live.<br />**Jalankan ulang:** `rerun_group=release-checks` atau handle release-checks yang lebih sempit.                                |
| Artefak package     | **Job:** `Prepare release package artifact`<br />**Workflow anak:** tidak ada<br />**Membuktikan:** membuat tarball induk `release-package-under-test` cukup awal untuk pemeriksaan yang menghadap package yang tidak perlu menunggu `OpenClaw Release Checks`.<br />**Jalankan ulang:** jalankan ulang payung atau berikan `npm_telegram_package_spec` untuk `rerun_group=npm-telegram`.                                   |
| Package Telegram     | **Job:** `Run package Telegram E2E`<br />**Workflow anak:** `NPM Telegram Beta E2E`<br />**Membuktikan:** bukti package Telegram yang didukung artefak induk untuk `rerun_group=all` dengan `release_profile=full`, atau bukti Telegram package yang dipublikasikan saat `npm_telegram_package_spec` disetel.<br />**Jalankan ulang:** `rerun_group=npm-telegram` dengan `npm_telegram_package_spec`.                              |
| Verifikator payung    | **Job:** `Verify full validation`<br />**Workflow anak:** tidak ada<br />**Membuktikan:** memeriksa ulang kesimpulan run anak yang tercatat dan menambahkan tabel job paling lambat dari workflow anak.<br />**Jalankan ulang:** jalankan ulang hanya job ini setelah menjalankan ulang anak yang gagal hingga hijau.                                                                                                                                   |

Untuk `ref=main` dan `rerun_group=all`, payung yang lebih baru menggantikan yang lebih lama.
Saat induk dibatalkan, monitornya membatalkan workflow anak apa pun yang sudah
dikirim. Run validasi cabang dan tag rilis tidak saling membatalkan secara
default.

## Tahap pemeriksaan rilis

`OpenClaw Release Checks` adalah workflow anak terbesar. Ini me-resolve target
sekali dan menyiapkan artefak `release-package-under-test` bersama saat tahap yang menghadap package
atau Docker membutuhkannya.

| Tahap               | Detail                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Target rilis      | **Job:** `Resolve target ref`<br />**Workflow pendukung:** tidak ada<br />**Menguji:** ref yang dipilih, SHA yang diharapkan opsional, profil, grup run ulang, dan filter suite live terfokus.<br />**Jalankan ulang:** `rerun_group=release-checks`.                                                                                                                                                                           |
| Artefak package    | **Job:** `Prepare release package artifact`<br />**Workflow pendukung:** tidak ada<br />**Menguji:** mengemas atau me-resolve satu tarball kandidat dan mengunggah `release-package-under-test` untuk pemeriksaan downstream yang menghadap package.<br />**Jalankan ulang:** grup package, lintas OS, atau live/E2E yang terdampak.                                                                                                           |
| Smoke instalasi       | **Job:** `Run install smoke`<br />**Workflow pendukung:** `Install Smoke`<br />**Menguji:** jalur instalasi penuh dengan penggunaan ulang image smoke Dockerfile root, instalasi package QR, smoke Docker root dan Gateway, pengujian Docker installer, smoke penyedia image instalasi global Bun, dan E2E instalasi/uninstal Plugin terbundel cepat.<br />**Jalankan ulang:** `rerun_group=install-smoke`.                              |
| Lintas OS            | **Job:** `cross_os_release_checks`<br />**Workflow pendukung:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Menguji:** lane fresh dan upgrade di Linux, Windows, dan macOS untuk penyedia dan mode yang dipilih, menggunakan tarball kandidat ditambah package baseline.<br />**Jalankan ulang:** `rerun_group=cross-os`.                                                                               |
| Repo dan live E2E   | **Job:** `Run repo/live E2E validation`<br />**Workflow pendukung:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Menguji:** E2E repositori, cache live, streaming websocket OpenAI, penyedia live native dan shard Plugin, serta harness model/backend/Gateway live yang didukung Docker dan dipilih oleh `release_profile`.<br />**Jalankan ulang:** `rerun_group=live-e2e`, opsional dengan `live_suite_filter`. |
| Jalur rilis Docker | **Job:** `Run Docker release-path validation`<br />**Workflow pendukung:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Menguji:** potongan Docker jalur rilis terhadap artefak package bersama.<br />**Jalankan ulang:** `rerun_group=live-e2e`.                                                                                                                                                      |
| Package Acceptance  | **Job:** `Run package acceptance`<br />**Workflow pendukung:** `Package Acceptance`<br />**Menguji:** fixture package Plugin offline, update Plugin, penerimaan package Telegram mock-OpenAI, dan pemeriksaan penyintas upgrade-terpublikasi dari setiap rilis npm stabil pada atau setelah `2026.4.23` terhadap tarball yang sama.<br />**Jalankan ulang:** `rerun_group=package`.                                         |
| Paritas QA           | **Job:** `Run QA Lab parity lane` dan `Run QA Lab parity report`<br />**Workflow pendukung:** job langsung<br />**Menguji:** pack paritas agentik kandidat dan baseline, lalu laporan paritas.<br />**Jalankan ulang:** `rerun_group=qa-parity` atau `rerun_group=qa`.                                                                                                                                       |
| Matrix live QA      | **Job:** `Run QA Lab live Matrix lane`<br />**Workflow pendukung:** job langsung<br />**Menguji:** profil QA Matrix live cepat di environment `qa-live-shared`.<br />**Jalankan ulang:** `rerun_group=qa-live` atau `rerun_group=qa`.                                                                                                                                                                        |
| Telegram live QA    | **Job:** `Run QA Lab live Telegram lane`<br />**Workflow pendukung:** job langsung<br />**Menguji:** QA Telegram live dengan sewa kredensial Convex CI.<br />**Jalankan ulang:** `rerun_group=qa-live` atau `rerun_group=qa`.                                                                                                                                                                                    |
| Verifikator rilis    | **Job:** `Verify release checks`<br />**Workflow pendukung:** tidak ada<br />**Menguji:** job release-check yang diperlukan untuk grup run ulang yang dipilih.<br />**Jalankan ulang:** jalankan ulang setelah job anak terfokus lulus.                                                                                                                                                                                                 |

## Potongan jalur rilis Docker

Tahap jalur rilis Docker menjalankan potongan ini saat `live_suite_filter` kosong:

| Potongan                                                           | Cakupan                                                                |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                          | Lane smoke jalur rilis Docker inti.                                   |
| `package-update-openai`                                         | Perilaku instalasi dan update package OpenAI.                             |
| `package-update-anthropic`                                      | Perilaku instalasi dan update package Anthropic.                          |
| `package-update-core`                                           | Perilaku package dan update yang netral penyedia.                           |
| `plugins-runtime-plugins`                                       | Lane runtime Plugin yang melatih perilaku Plugin.                     |
| `plugins-runtime-services`                                      | Lane runtime Plugin yang didukung layanan; mencakup OpenWebUI saat diminta. |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | Batch instalasi/runtime Plugin yang dibagi untuk validasi rilis paralel.   |

Gunakan `docker_lanes=<lane[,lane]>` yang ditargetkan pada workflow live/E2E yang dapat digunakan ulang ketika
hanya satu lane Docker yang gagal. Artefak rilis menyertakan perintah rerun
per lane dengan input penggunaan ulang artefak paket dan image jika tersedia.

## Profil rilis

`release_profile` sebagian besar mengontrol cakupan live/provider di dalam pemeriksaan rilis.
Ini tidak menghapus CI penuh normal, Plugin Prerelease, install smoke, package
acceptance, QA Lab, atau bagian jalur rilis Docker. `full` juga membuat
umbrella menjalankan paket Telegram E2E terhadap artefak paket rilis induk ketika
`rerun_group=all`, sehingga kandidat penuh pra-publikasi tidak diam-diam melewati
lane paket Telegram tersebut.

| Profil    | Penggunaan yang dituju          | Cakupan live/provider yang disertakan                                                                                                                                                  |
| --------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Smoke paling cepat yang kritis untuk rilis. | Jalur live OpenAI/core, model live Docker untuk OpenAI, inti Gateway native, profil Gateway OpenAI native, Plugin OpenAI native, dan Gateway OpenAI live Docker.                      |
| `stable`  | Profil persetujuan rilis default. | `minimum` ditambah smoke Anthropic, Google, MiniMax, backend, harness pengujian live native, backend CLI live Docker, bind ACP Docker, harness Codex Docker, dan shard smoke OpenCode Go. |
| `full`    | Sweep advisory luas.             | `stable` ditambah provider advisory, shard live Plugin, dan shard live media.                                                                                                           |

## Tambahan khusus full

Suite ini dilewati oleh `stable` dan disertakan oleh `full`:

| Area                             | Cakupan khusus full                                                                                                     |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Model live Docker                | OpenCode Go, OpenRouter, xAI, Z.ai, dan Fireworks.                                                                      |
| Gateway live Docker              | Provider advisory dibagi menjadi shard DeepSeek/Fireworks, OpenCode Go/OpenRouter, dan xAI/Z.ai.                       |
| Profil provider Gateway native   | Shard Anthropic Opus penuh dan Sonnet/Haiku, Fireworks, DeepSeek, shard model OpenCode Go penuh, OpenRouter, xAI, dan Z.ai. |
| Shard live Plugin native         | Plugin A-K, L-N, O-Z lainnya, Moonshot, dan xAI.                                                                        |
| Shard live media native          | Audio, musik Google, musik MiniMax, dan grup video A-D.                                                                 |

`stable` menyertakan `native-live-src-gateway-profiles-anthropic-smoke` dan
`native-live-src-gateway-profiles-opencode-go-smoke`; `full` menggunakan shard
model Anthropic dan OpenCode Go yang lebih luas sebagai gantinya. Rerun terfokus masih dapat menggunakan
handle agregat `native-live-src-gateway-profiles-anthropic` atau
`native-live-src-gateway-profiles-opencode-go`.

## Rerun terfokus

Gunakan `rerun_group` untuk menghindari pengulangan box rilis yang tidak terkait:

| Handle              | Cakupan                                                               |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | Semua tahap Full Release Validation.                                  |
| `ci`                | Hanya child CI penuh manual.                                          |
| `plugin-prerelease` | Hanya child Plugin Prerelease.                                        |
| `release-checks`    | Semua tahap OpenClaw Release Checks.                                  |
| `install-smoke`     | Install Smoke melalui pemeriksaan rilis.                              |
| `cross-os`          | Pemeriksaan rilis lintas OS.                                          |
| `live-e2e`          | Validasi E2E repo/live dan jalur rilis Docker.                        |
| `package`           | Package Acceptance.                                                   |
| `qa`                | Paritas QA ditambah lane live QA.                                     |
| `qa-parity`         | Hanya lane dan laporan paritas QA.                                    |
| `qa-live`           | Hanya Matrix dan Telegram live QA.                                    |
| `npm-telegram`      | E2E Telegram paket yang dipublikasikan; memerlukan `npm_telegram_package_spec`. |

Gunakan `live_suite_filter` dengan `rerun_group=live-e2e` ketika satu suite live gagal.
ID filter yang valid didefinisikan dalam workflow live/E2E yang dapat digunakan ulang, termasuk
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker`, dan
`live-codex-harness-docker`.

Handle `live-gateway-advisory-docker` adalah handle rerun agregat untuk
tiga shard providernya, sehingga masih menyebar ke semua job Gateway Docker advisory.

## Bukti yang perlu disimpan

Simpan ringkasan `Full Release Validation` sebagai indeks tingkat rilis. Ringkasan itu menautkan
ID run child dan menyertakan tabel job paling lambat. Untuk kegagalan, periksa workflow child
terlebih dahulu, lalu rerun handle terkecil yang cocok di atas.

Artefak berguna:

- `release-package-under-test` dari parent Full Release Validation dan `OpenClaw Release Checks`
- Artefak jalur rilis Docker di bawah `.artifacts/docker-tests/`
- Package Acceptance `package-under-test` dan artefak acceptance Docker
- Artefak pemeriksaan rilis lintas OS untuk setiap OS dan suite
- Artefak paritas QA, Matrix, dan Telegram

## File workflow

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
