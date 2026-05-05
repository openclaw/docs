---
read_when:
    - Menjalankan atau menjalankan ulang Validasi Rilis Penuh
    - Membandingkan profil validasi rilis stabil dan lengkap
    - Men-debug kegagalan tahap validasi rilis
summary: Tahapan Validasi Rilis Lengkap, alur kerja turunan, profil rilis, rujukan untuk menjalankan ulang, dan bukti
title: Validasi rilis penuh
x-i18n:
    generated_at: "2026-05-05T01:49:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6cf696761f516fc7f8e9606a2a06fab61a644731330eb484a388f276767a9e0d
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` adalah payung rilis. Ini adalah satu titik masuk manual untuk bukti pra-rilis, tetapi sebagian besar pekerjaan terjadi di workflow anak agar kotak yang gagal dapat dijalankan ulang tanpa memulai ulang seluruh rilis.

Jalankan dari ref workflow tepercaya, biasanya `main`, dan teruskan branch rilis, tag, atau SHA commit lengkap sebagai `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Workflow anak menggunakan ref workflow tepercaya untuk harness dan input `ref` untuk kandidat yang diuji. Itu membuat logika validasi baru tetap tersedia saat memvalidasi branch atau tag rilis yang lebih lama.

Secara default, `release_profile=stable` menjalankan lane pemblokir rilis dan melewati soak live/Docker yang menyeluruh. Teruskan `run_release_soak=true` untuk menyertakan lane soak pada run stabil. `release_profile=full` selalu mengaktifkan lane soak sehingga profil advisory yang luas tidak pernah kehilangan cakupan secara diam-diam.

Package Acceptance biasanya membangun tarball kandidat dari `ref` yang telah di-resolve, termasuk run SHA lengkap yang dikirim dengan `pnpm ci:full-release`. Setelah publish, teruskan `package_acceptance_package_spec=openclaw@YYYY.M.D` (atau `openclaw@beta`/`openclaw@latest`) untuk menjalankan matriks package/update yang sama terhadap package npm yang telah dikirim sebagai gantinya.

## Tahap tingkat atas

| Tahap                | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Resolusi target    | **Tugas:** `Resolve target ref`<br />**Workflow anak:** tidak ada<br />**Membuktikan:** me-resolve branch rilis, tag, atau SHA commit lengkap dan mencatat input yang dipilih.<br />**Jalankan ulang:** jalankan ulang payung jika ini gagal.                                                                                                                                                                                                                               |
| Vitest dan CI normal | **Tugas:** `Run normal full CI`<br />**Workflow anak:** `CI`<br />**Membuktikan:** grafik CI penuh manual terhadap ref target, termasuk lane Linux Node, shard Plugin bawaan, kontrak channel, kompatibilitas Node 22, `check`, `check-additional`, smoke build, pemeriksaan docs, Skills Python, Windows, macOS, i18n Control UI, dan Android melalui payung.<br />**Jalankan ulang:** `rerun_group=ci`.                                                  |
| Prarilis Plugin    | **Tugas:** `Run plugin prerelease validation`<br />**Workflow anak:** `Plugin Prerelease`<br />**Membuktikan:** pemeriksaan statis Plugin khusus rilis, cakupan Plugin agentik, shard batch ekstensi penuh, dan lane Docker prarilis Plugin.<br />**Jalankan ulang:** `rerun_group=plugin-prerelease`.                                                                                                                                                        |
| Pemeriksaan rilis       | **Tugas:** `Run release/live/Docker/QA validation`<br />**Workflow anak:** `OpenClaw Release Checks`<br />**Membuktikan:** smoke install, pemeriksaan package lintas OS, Package Acceptance, paritas QA Lab, Matrix live, dan Telegram live. Dengan `run_release_soak=true` atau `release_profile=full`, juga menjalankan suite live/E2E menyeluruh dan chunk jalur rilis Docker.<br />**Jalankan ulang:** `rerun_group=release-checks` atau handle release-checks yang lebih sempit. |
| Artefak package     | **Tugas:** `Prepare release package artifact`<br />**Workflow anak:** tidak ada<br />**Membuktikan:** membuat tarball induk `release-package-under-test` cukup awal untuk pemeriksaan yang menghadap package yang tidak perlu menunggu `OpenClaw Release Checks`.<br />**Jalankan ulang:** jalankan ulang payung atau berikan `npm_telegram_package_spec` untuk `rerun_group=npm-telegram`.                                                                                    |
| Package Telegram     | **Tugas:** `Run package Telegram E2E`<br />**Workflow anak:** `NPM Telegram Beta E2E`<br />**Membuktikan:** bukti package Telegram berbasis artefak induk untuk `rerun_group=all` dengan `release_profile=full`, atau bukti Telegram package yang dipublikasikan saat `npm_telegram_package_spec` disetel.<br />**Jalankan ulang:** `rerun_group=npm-telegram` dengan `npm_telegram_package_spec`.                                                                               |
| Verifier payung    | **Tugas:** `Verify full validation`<br />**Workflow anak:** tidak ada<br />**Membuktikan:** memeriksa ulang kesimpulan run anak yang dicatat dan menambahkan tabel tugas terlambat dari workflow anak.<br />**Jalankan ulang:** jalankan ulang hanya tugas ini setelah menjalankan ulang anak yang gagal hingga hijau.                                                                                                                                                                                    |

Untuk `ref=main` dan `rerun_group=all`, payung yang lebih baru menggantikan yang lebih lama. Saat induk dibatalkan, monitornya membatalkan workflow anak apa pun yang sudah dikirim. Run validasi branch rilis dan tag tidak saling membatalkan secara default.

## Tahap pemeriksaan rilis

`OpenClaw Release Checks` adalah workflow anak terbesar. Ini me-resolve target sekali dan menyiapkan artefak bersama `release-package-under-test` saat tahap yang menghadap package atau Docker membutuhkannya.

| Tahap               | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Target rilis      | **Pekerjaan:** `Resolve target ref`<br />**Alur kerja pendukung:** tidak ada<br />**Pengujian:** ref yang dipilih, SHA yang diharapkan opsional, profil, grup rerun, dan filter suite live terfokus.<br />**Rerun:** `rerun_group=release-checks`.                                                                                                                                                                                                                                                                              |
| Artefak paket    | **Pekerjaan:** `Prepare release package artifact`<br />**Alur kerja pendukung:** tidak ada<br />**Pengujian:** mengemas atau menyelesaikan satu kandidat tarball dan mengunggah `release-package-under-test` untuk pemeriksaan hilir yang berhadapan dengan paket.<br />**Rerun:** paket yang terdampak, lintas-OS, atau grup live/E2E.                                                                                                                                                                                                              |
| Smoke instalasi       | **Pekerjaan:** `Run install smoke`<br />**Alur kerja pendukung:** `Install Smoke`<br />**Pengujian:** jalur instalasi penuh dengan penggunaan ulang image smoke Dockerfile root, instalasi paket QR, smoke Docker root dan Gateway, pengujian Docker installer, smoke penyedia image instalasi global Bun, dan E2E instalasi/pencopotan Plugin bundel yang cepat.<br />**Rerun:** `rerun_group=install-smoke`.                                                                                                                                 |
| Lintas-OS            | **Pekerjaan:** `cross_os_release_checks`<br />**Alur kerja pendukung:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Pengujian:** lane fresh dan upgrade di Linux, Windows, dan macOS untuk penyedia dan mode yang dipilih, menggunakan tarball kandidat plus paket baseline.<br />**Rerun:** `rerun_group=cross-os`.                                                                                                                                                                                  |
| Repo dan live E2E   | **Pekerjaan:** `Run repo/live E2E validation`<br />**Alur kerja pendukung:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Pengujian:** E2E repositori, cache live, streaming websocket OpenAI, shard penyedia dan Plugin live native, serta harness model/backend/Gateway live yang didukung Docker yang dipilih oleh `release_profile`.<br />**Berjalan:** `run_release_soak=true`, `release_profile=full`, atau `rerun_group=live-e2e` terfokus.<br />**Rerun:** `rerun_group=live-e2e`, opsional dengan `live_suite_filter`. |
| Jalur rilis Docker | **Pekerjaan:** `Run Docker release-path validation`<br />**Alur kerja pendukung:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Pengujian:** chunk Docker jalur rilis terhadap artefak paket bersama.<br />**Berjalan:** `run_release_soak=true`, `release_profile=full`, atau `rerun_group=live-e2e` terfokus.<br />**Rerun:** `rerun_group=live-e2e`.                                                                                                                                                      |
| Penerimaan Paket  | **Pekerjaan:** `Run package acceptance`<br />**Alur kerja pendukung:** `Package Acceptance`<br />**Pengujian:** fixture paket Plugin offline, pembaruan Plugin, penerimaan paket Telegram mock-OpenAI, dan pemeriksaan survivor upgrade-terpublikasi terhadap tarball yang sama. Pemeriksaan rilis pemblokir menggunakan baseline terpublikasi terbaru default; pemeriksaan soak diperluas ke setiap rilis npm stabil pada atau setelah `2026.4.23` plus fixture isu yang dilaporkan.<br />**Rerun:** `rerun_group=package`.                          |
| Paritas QA           | **Pekerjaan:** `Run QA Lab parity lane` dan `Run QA Lab parity report`<br />**Alur kerja pendukung:** pekerjaan langsung<br />**Pengujian:** paket paritas agentic kandidat dan baseline, lalu laporan paritas.<br />**Rerun:** `rerun_group=qa-parity` atau `rerun_group=qa`.                                                                                                                                                                                                                                          |
| Matrix live QA      | **Pekerjaan:** `Run QA Lab live Matrix lane`<br />**Alur kerja pendukung:** pekerjaan langsung<br />**Pengujian:** profil QA Matrix live cepat di lingkungan `qa-live-shared`.<br />**Rerun:** `rerun_group=qa-live` atau `rerun_group=qa`.                                                                                                                                                                                                                                                                           |
| Telegram live QA    | **Pekerjaan:** `Run QA Lab live Telegram lane`<br />**Alur kerja pendukung:** pekerjaan langsung<br />**Pengujian:** QA Telegram live dengan lease kredensial CI Convex.<br />**Rerun:** `rerun_group=qa-live` atau `rerun_group=qa`.                                                                                                                                                                                                                                                                                       |
| Verifikator rilis    | **Pekerjaan:** `Verify release checks`<br />**Alur kerja pendukung:** tidak ada<br />**Pengujian:** pekerjaan pemeriksaan rilis yang diwajibkan untuk grup rerun yang dipilih.<br />**Rerun:** rerun setelah pekerjaan anak terfokus lulus.                                                                                                                                                                                                                                                                                                    |

## Chunk jalur rilis Docker

Tahap jalur rilis Docker menjalankan chunk ini saat `live_suite_filter`
kosong:

| Chunk                                                           | Cakupan                                                                |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                          | Lane smoke jalur rilis Docker core.                                   |
| `package-update-openai`                                         | Perilaku instalasi dan pembaruan paket OpenAI.                             |
| `package-update-anthropic`                                      | Perilaku instalasi dan pembaruan paket Anthropic.                          |
| `package-update-core`                                           | Perilaku paket dan pembaruan yang netral penyedia.                           |
| `plugins-runtime-plugins`                                       | Lane runtime Plugin yang menjalankan perilaku Plugin.                     |
| `plugins-runtime-services`                                      | Lane runtime Plugin yang didukung layanan; mencakup OpenWebUI saat diminta. |
| `plugins-runtime-install-a` hingga `plugins-runtime-install-h` | Batch instalasi/runtime Plugin yang dipisah untuk validasi rilis paralel.   |

Gunakan `docker_lanes=<lane[,lane]>` terarah pada alur kerja live/E2E reusable saat
hanya satu lane Docker yang gagal. Artefak rilis menyertakan perintah rerun per-lane
dengan input artefak paket dan penggunaan ulang image saat tersedia.

## Profil rilis

`release_profile` terutama mengontrol keluasan live/penyedia di dalam pemeriksaan rilis.
Ini tidak menghapus CI penuh normal, Prarilis Plugin, smoke instalasi, penerimaan
paket, atau QA Lab. Untuk `stable`, E2E repo/live yang menyeluruh dan chunk
jalur rilis Docker adalah cakupan soak dan berjalan saat `run_release_soak=true`.
`full` memaksa cakupan soak aktif dan juga membuat run payung menjalankan E2E paket
Telegram terhadap artefak paket rilis induk saat `rerun_group=all`, sehingga kandidat
pra-publikasi penuh tidak diam-diam melewati lane paket Telegram tersebut.

| Profil   | Penggunaan yang dimaksudkan                      | Cakupan live/penyedia yang disertakan                                                                                                                                                     |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Smoke kritis-rilis tercepat.   | Jalur live OpenAI/core, model live Docker untuk OpenAI, core Gateway native, profil Gateway OpenAI native, Plugin OpenAI native, dan Gateway live Docker OpenAI.                     |
| `stable`  | Profil persetujuan rilis default. | `minimum` plus smoke Anthropic, Google, MiniMax, backend, harness pengujian live native, backend CLI live Docker, bind ACP Docker, harness Codex Docker, dan shard smoke OpenCode Go. |
| `full`    | Sweep advisori luas.             | `stable` plus penyedia advisori, shard live Plugin, dan shard live media.                                                                                                        |

## Tambahan khusus full

Suite ini dilewati oleh `stable` dan disertakan oleh `full`:

| Area                             | Cakupan khusus full                                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Model live Docker               | OpenCode Go, OpenRouter, xAI, Z.ai, dan Fireworks.                                                                          |
| Gateway live Docker              | Penyedia advisori dipisah menjadi shard DeepSeek/Fireworks, OpenCode Go/OpenRouter, dan xAI/Z.ai.                              |
| Profil penyedia Gateway native | Shard Anthropic Opus dan Sonnet/Haiku penuh, Fireworks, DeepSeek, shard model OpenCode Go penuh, OpenRouter, xAI, dan Z.ai. |
| Shard live Plugin native        | Plugin A-K, L-N, O-Z lainnya, Moonshot, dan xAI.                                                                             |
| Shard live media native         | Grup audio, Google music, MiniMax music, dan video A-D.                                                                   |

`stable` menyertakan `native-live-src-gateway-profiles-anthropic-smoke` dan
`native-live-src-gateway-profiles-opencode-go-smoke`; `full` menggunakan shard
model Anthropic dan OpenCode Go yang lebih luas sebagai gantinya. Rerun terfokus masih dapat menggunakan
handle agregat `native-live-src-gateway-profiles-anthropic` atau
`native-live-src-gateway-profiles-opencode-go`.

## Rerun terfokus

Gunakan `rerun_group` untuk menghindari pengulangan kotak rilis yang tidak terkait:

| Handle              | Cakupan                                                               |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | Semua tahap Validasi Rilis Penuh.                                     |
| `ci`                | Hanya turunan CI penuh manual.                                        |
| `plugin-prerelease` | Hanya turunan prarilis Plugin.                                        |
| `release-checks`    | Semua tahap Pemeriksaan Rilis OpenClaw.                               |
| `install-smoke`     | Install Smoke melalui pemeriksaan rilis.                              |
| `cross-os`          | Pemeriksaan rilis lintas OS.                                          |
| `live-e2e`          | Validasi E2E repo/live dan jalur rilis Docker.                        |
| `package`           | Penerimaan Paket.                                                     |
| `qa`                | Paritas QA plus jalur live QA.                                        |
| `qa-parity`         | Hanya jalur paritas QA dan laporan.                                   |
| `qa-live`           | Hanya Matrix dan Telegram live QA.                                    |
| `npm-telegram`      | E2E Telegram paket yang dipublikasikan; memerlukan `npm_telegram_package_spec`. |

Gunakan `live_suite_filter` dengan `rerun_group=live-e2e` saat satu suite live gagal.
ID filter yang valid didefinisikan dalam alur kerja live/E2E yang dapat digunakan ulang, termasuk
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker`, dan
`live-codex-harness-docker`.

Handle `live-gateway-advisory-docker` adalah handle rerun agregat untuk tiga
shard providernya, jadi handle ini tetap menyebar ke semua pekerjaan Gateway Docker advisory.

Gunakan `cross_os_suite_filter` dengan `rerun_group=cross-os` saat satu jalur lintas OS
gagal. Filter menerima ID OS, ID suite, atau pasangan OS/suite, misalnya
`windows/packaged-upgrade`, `windows`, atau `packaged-fresh`. Ringkasan lintas OS
mencakup waktu per fase untuk jalur peningkatan terpaket, dan perintah yang berjalan lama
mencetak baris Heartbeat sehingga pembaruan Windows yang macet terlihat sebelum
batas waktu pekerjaan.

Jalur pemeriksaan rilis QA bersifat advisory. Kegagalan yang hanya terjadi pada QA dilaporkan sebagai peringatan
dan tidak memblokir pemverifikasi pemeriksaan rilis; jalankan ulang `rerun_group=qa`,
`qa-parity`, atau `qa-live` saat Anda memerlukan bukti QA yang baru.

## Bukti yang perlu disimpan

Simpan ringkasan `Full Release Validation` sebagai indeks tingkat rilis. Ringkasan ini menautkan
ID run turunan dan menyertakan tabel pekerjaan paling lambat. Untuk kegagalan, periksa alur kerja
turunan terlebih dahulu, lalu jalankan ulang handle terkecil yang cocok di atas.

Artefak yang berguna:

- `release-package-under-test` dari induk Validasi Rilis Penuh dan `OpenClaw Release Checks`
- Artefak jalur rilis Docker di bawah `.artifacts/docker-tests/`
- Artefak Penerimaan Paket `package-under-test` dan penerimaan Docker
- Artefak pemeriksaan rilis lintas OS untuk setiap OS dan suite
- Artefak paritas QA, Matrix, dan Telegram

## File alur kerja

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
