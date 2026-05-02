---
read_when:
    - Menjalankan atau menjalankan ulang Validasi Rilis Penuh
    - Membandingkan profil validasi rilis stabil dan penuh
    - Men-debug kegagalan tahap validasi rilis
summary: Tahap Validasi Rilis Lengkap, alur kerja turunan, profil rilis, handle jalankan ulang, dan bukti
title: Validasi rilis lengkap
x-i18n:
    generated_at: "2026-05-02T20:59:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3ce1e5a72227ca202335fe68b537491a0b68a0bb2af431aa56c41cf20989e88c
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` adalah payung rilis. Ini adalah satu-satunya titik masuk manual untuk bukti pra-rilis, tetapi sebagian besar pekerjaan terjadi di alur kerja turunan sehingga box yang gagal dapat dijalankan ulang tanpa memulai ulang seluruh rilis.

Jalankan dari ref alur kerja tepercaya, biasanya `main`, dan berikan branch rilis, tag, atau SHA commit lengkap sebagai `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Alur kerja turunan menggunakan ref alur kerja tepercaya untuk harness dan input `ref` untuk kandidat yang diuji. Ini membuat logika validasi baru tetap tersedia saat memvalidasi branch atau tag rilis yang lebih lama.

Package Acceptance biasanya membangun tarball kandidat dari `ref` yang sudah di-resolve, termasuk run SHA lengkap yang dikirim dengan `pnpm ci:full-release`. Setelah publikasi, berikan `package_acceptance_package_spec=openclaw@YYYY.M.D` (atau `openclaw@beta`/`openclaw@latest`) untuk menjalankan matriks paket/pembaruan yang sama terhadap paket npm yang sudah dikirim.

## Tahap tingkat atas

| Tahap                | Detail                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Resolusi target    | **Job:** `Resolve target ref`<br />**Alur kerja turunan:** tidak ada<br />**Membuktikan:** me-resolve branch rilis, tag, atau SHA commit lengkap dan mencatat input yang dipilih.<br />**Jalankan ulang:** jalankan ulang payung jika ini gagal.                                                                                                                                                                              |
| Vitest dan CI normal | **Job:** `Run normal full CI`<br />**Alur kerja turunan:** `CI`<br />**Membuktikan:** grafik CI lengkap manual terhadap ref target, termasuk lane Linux Node, shard Plugin bawaan, kontrak channel, kompatibilitas Node 22, `check`, `check-additional`, smoke build, pemeriksaan docs, Skills Python, Windows, macOS, i18n Control UI, dan Android melalui payung.<br />**Jalankan ulang:** `rerun_group=ci`. |
| Prarilis Plugin    | **Job:** `Run plugin prerelease validation`<br />**Alur kerja turunan:** `Plugin Prerelease`<br />**Membuktikan:** pemeriksaan statis Plugin khusus rilis, cakupan Plugin agentik, shard batch ekstensi penuh, dan lane Docker prarilis Plugin.<br />**Jalankan ulang:** `rerun_group=plugin-prerelease`.                                                                                                       |
| Pemeriksaan rilis       | **Job:** `Run release/live/Docker/QA validation`<br />**Alur kerja turunan:** `OpenClaw Release Checks`<br />**Membuktikan:** smoke instalasi, pemeriksaan paket lintas OS, suite live/E2E, chunk jalur rilis Docker, Package Acceptance, paritas QA Lab, Matrix live, dan Telegram live.<br />**Jalankan ulang:** `rerun_group=release-checks` atau handle release-checks yang lebih sempit.                                |
| Telegram paket     | **Job:** `Run package Telegram E2E`<br />**Alur kerja turunan:** `NPM Telegram Beta E2E`<br />**Membuktikan:** bukti paket Telegram berbasis artefak untuk `rerun_group=all` dengan `release_profile=full`, atau bukti Telegram paket yang dipublikasikan saat `npm_telegram_package_spec` disetel.<br />**Jalankan ulang:** `rerun_group=npm-telegram` dengan `npm_telegram_package_spec`.                                     |
| Verifikator payung    | **Job:** `Verify full validation`<br />**Alur kerja turunan:** tidak ada<br />**Membuktikan:** memeriksa ulang kesimpulan run turunan yang tercatat dan menambahkan tabel job paling lambat dari alur kerja turunan.<br />**Jalankan ulang:** jalankan ulang hanya job ini setelah menjalankan ulang turunan yang gagal hingga hijau.                                                                                                                                   |

Untuk `ref=main` dan `rerun_group=all`, payung yang lebih baru menggantikan payung yang lebih lama. Saat induk dibatalkan, monitornya membatalkan alur kerja turunan apa pun yang sudah dikirim. Run validasi branch dan tag rilis tidak saling membatalkan secara default.

## Tahap pemeriksaan rilis

`OpenClaw Release Checks` adalah alur kerja turunan terbesar. Ini me-resolve target sekali dan menyiapkan artefak `release-package-under-test` bersama saat tahap yang menghadap paket atau Docker membutuhkannya.

| Tahap               | Detail                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Target rilis      | **Job:** `Resolve target ref`<br />**Alur kerja pendukung:** tidak ada<br />**Menguji:** ref yang dipilih, SHA opsional yang diharapkan, profil, grup jalankan ulang, dan filter suite live terfokus.<br />**Jalankan ulang:** `rerun_group=release-checks`.                                                                                                                                                                           |
| Artefak paket    | **Job:** `Prepare release package artifact`<br />**Alur kerja pendukung:** tidak ada<br />**Menguji:** mengemas atau me-resolve satu tarball kandidat dan mengunggah `release-package-under-test` untuk pemeriksaan hilir yang menghadap paket.<br />**Jalankan ulang:** grup paket, lintas OS, atau live/E2E yang terdampak.                                                                                                           |
| Smoke instalasi       | **Job:** `Run install smoke`<br />**Alur kerja pendukung:** `Install Smoke`<br />**Menguji:** jalur instalasi penuh dengan penggunaan ulang image smoke Dockerfile root, instalasi paket QR, smoke Docker root dan Gateway, pengujian Docker penginstal, smoke penyedia image instalasi global Bun, dan E2E instalasi/uninstal Plugin bawaan cepat.<br />**Jalankan ulang:** `rerun_group=install-smoke`.                              |
| Lintas OS            | **Job:** `cross_os_release_checks`<br />**Alur kerja pendukung:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Menguji:** lane baru dan upgrade di Linux, Windows, dan macOS untuk penyedia dan mode yang dipilih, menggunakan tarball kandidat plus paket baseline.<br />**Jalankan ulang:** `rerun_group=cross-os`.                                                                               |
| Repo dan E2E live   | **Job:** `Run repo/live E2E validation`<br />**Alur kerja pendukung:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Menguji:** E2E repositori, cache live, streaming websocket OpenAI, shard penyedia dan Plugin live native, serta harness model/backend/Gateway live berbasis Docker yang dipilih oleh `release_profile`.<br />**Jalankan ulang:** `rerun_group=live-e2e`, secara opsional dengan `live_suite_filter`. |
| Jalur rilis Docker | **Job:** `Run Docker release-path validation`<br />**Alur kerja pendukung:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Menguji:** chunk Docker jalur rilis terhadap artefak paket bersama.<br />**Jalankan ulang:** `rerun_group=live-e2e`.                                                                                                                                                      |
| Package Acceptance  | **Job:** `Run package acceptance`<br />**Alur kerja pendukung:** `Package Acceptance`<br />**Menguji:** fixture paket Plugin offline, pembaruan Plugin, penerimaan paket Telegram mock-OpenAI, dan pemeriksaan penyintas upgrade terpublikasi dari setiap rilis npm stabil pada atau setelah `2026.4.23` terhadap tarball yang sama.<br />**Jalankan ulang:** `rerun_group=package`.                                         |
| Paritas QA           | **Job:** `Run QA Lab parity lane` dan `Run QA Lab parity report`<br />**Alur kerja pendukung:** job langsung<br />**Menguji:** paket paritas agentik kandidat dan baseline, lalu laporan paritas.<br />**Jalankan ulang:** `rerun_group=qa-parity` atau `rerun_group=qa`.                                                                                                                                       |
| Matrix live QA      | **Job:** `Run QA Lab live Matrix lane`<br />**Alur kerja pendukung:** job langsung<br />**Menguji:** profil QA Matrix live cepat di environment `qa-live-shared`.<br />**Jalankan ulang:** `rerun_group=qa-live` atau `rerun_group=qa`.                                                                                                                                                                        |
| Telegram live QA    | **Job:** `Run QA Lab live Telegram lane`<br />**Alur kerja pendukung:** job langsung<br />**Menguji:** QA Telegram live dengan lease kredensial Convex CI.<br />**Jalankan ulang:** `rerun_group=qa-live` atau `rerun_group=qa`.                                                                                                                                                                                    |
| Verifikator rilis    | **Job:** `Verify release checks`<br />**Alur kerja pendukung:** tidak ada<br />**Menguji:** job release-check yang diperlukan untuk grup jalankan ulang yang dipilih.<br />**Jalankan ulang:** jalankan ulang setelah job turunan terfokus lulus.                                                                                                                                                                                                 |

## Chunk jalur rilis Docker

Tahap jalur rilis Docker menjalankan chunk ini saat `live_suite_filter` kosong:

| Chunk                                                           | Cakupan                                                                |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                          | Lane smoke jalur rilis Docker inti.                                   |
| `package-update-openai`                                         | Perilaku instalasi dan pembaruan paket OpenAI.                             |
| `package-update-anthropic`                                      | Perilaku instalasi dan pembaruan paket Anthropic.                          |
| `package-update-core`                                           | Perilaku paket dan pembaruan netral penyedia.                           |
| `plugins-runtime-plugins`                                       | Lane runtime Plugin yang menjalankan perilaku Plugin.                     |
| `plugins-runtime-services`                                      | Lane runtime Plugin berbasis layanan; mencakup OpenWebUI saat diminta. |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | Batch instalasi/runtime Plugin yang dibagi untuk validasi rilis paralel.   |

Gunakan `docker_lanes=<lane[,lane]>` yang ditargetkan pada alur kerja live/E2E yang dapat digunakan ulang saat hanya satu lane Docker gagal. Artefak rilis menyertakan perintah jalankan ulang per lane dengan input artefak paket dan penggunaan ulang image jika tersedia.

## Profil rilis

`release_profile` terutama mengontrol cakupan live/provider di dalam pemeriksaan rilis.
Ini tidak menghapus CI penuh normal, Plugin Prerelease, install smoke, package
acceptance, QA Lab, atau bagian jalur rilis Docker. `full` juga membuat
umbrella menjalankan paket Telegram E2E terhadap artefak paket rilis saat
`rerun_group=all`, sehingga kandidat pra-publikasi penuh tidak diam-diam melewati
lane paket Telegram tersebut.

| Profil    | Penggunaan yang dimaksud           | Cakupan live/provider yang disertakan                                                                                                                                        |
| --------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Smoke paling cepat untuk rilis kritis. | Jalur live OpenAI/core, model live Docker untuk OpenAI, core Gateway native, profil Gateway OpenAI native, Plugin OpenAI native, dan Gateway live Docker OpenAI.             |
| `stable`  | Profil persetujuan rilis default.  | `minimum` ditambah Anthropic, Google, MiniMax, backend, harness pengujian live native, backend CLI live Docker, bind ACP Docker, harness Codex Docker, dan shard smoke OpenCode Go. |
| `full`    | Sapu advisory yang luas.           | `stable` ditambah provider advisory, shard live Plugin, dan shard live media.                                                                                                |

## Tambahan khusus full

Suite ini dilewati oleh `stable` dan disertakan oleh `full`:

| Area                             | Cakupan khusus full                                                            |
| -------------------------------- | ------------------------------------------------------------------------------ |
| Model live Docker                | OpenCode Go, OpenRouter, xAI, Z.ai, dan Fireworks.                             |
| Gateway live Docker              | Shard advisory untuk DeepSeek, Fireworks, OpenCode Go, OpenRouter, xAI, dan Z.ai. |
| Profil provider Gateway native   | Fireworks, DeepSeek, shard model OpenCode Go penuh, OpenRouter, xAI, dan Z.ai. |
| Shard live Plugin native         | Plugin A-K, L-N, O-Z lainnya, Moonshot, dan xAI.                               |
| Shard live media native          | Audio, musik Google, musik MiniMax, dan grup video A-D.                        |

`stable` menyertakan `native-live-src-gateway-profiles-opencode-go-smoke`; `full`
menggunakan shard model OpenCode Go yang lebih luas sebagai gantinya.

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
| `live-e2e`          | Validasi repo/live E2E dan jalur rilis Docker.                        |
| `package`           | Package Acceptance.                                                   |
| `qa`                | Paritas QA ditambah lane live QA.                                     |
| `qa-parity`         | Hanya lane dan laporan paritas QA.                                    |
| `qa-live`           | Hanya Matrix live QA dan Telegram.                                    |
| `npm-telegram`      | E2E Telegram paket terpublikasi; memerlukan `npm_telegram_package_spec`. |

Gunakan `live_suite_filter` dengan `rerun_group=live-e2e` saat satu suite live gagal.
ID filter yang valid didefinisikan dalam workflow live/E2E reusable, termasuk
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker`, dan
`live-codex-harness-docker`.

## Bukti yang harus disimpan

Simpan ringkasan `Full Release Validation` sebagai indeks tingkat rilis. Ringkasan ini menautkan
ID run child dan mencakup tabel job paling lambat. Untuk kegagalan, periksa workflow
child terlebih dahulu, lalu jalankan ulang handle terkecil yang cocok di atas.

Artefak berguna:

- `release-package-under-test` dari `OpenClaw Release Checks`
- Artefak jalur rilis Docker di bawah `.artifacts/docker-tests/`
- Artefak Package Acceptance `package-under-test` dan acceptance Docker
- Artefak pemeriksaan rilis Cross-OS untuk setiap OS dan suite
- Artefak paritas QA, Matrix, dan Telegram

## File workflow

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
