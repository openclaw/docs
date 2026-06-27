---
read_when:
    - Menjalankan atau menjalankan ulang Validasi Rilis Lengkap
    - Membandingkan profil validasi rilis stabil dan penuh
    - Men-debug kegagalan tahap validasi rilis
summary: Tahap Validasi Rilis Penuh, alur kerja turunan, profil rilis, pegangan menjalankan ulang, dan bukti
title: Validasi rilis penuh
x-i18n:
    generated_at: "2026-06-27T18:09:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 791930254e3cac7da101d809cfc9b56773225159574d3727189f67cf85bd3fce
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` adalah payung rilis. Ini adalah satu-satunya titik
masuk manual untuk bukti prarilis, tetapi sebagian besar pekerjaan terjadi di
workflow turunan sehingga kotak yang gagal dapat dijalankan ulang tanpa memulai
ulang seluruh rilis.

Jalankan dari ref workflow tepercaya, biasanya `main`, dan teruskan cabang rilis,
tag, atau SHA commit lengkap sebagai `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Workflow turunan menggunakan ref workflow tepercaya untuk perangkat pengujian
dan input `ref` untuk kandidat yang diuji. Ini membuat logika validasi baru
tetap tersedia saat memvalidasi cabang rilis atau tag yang lebih lama.

`release_profile=stable` dan `release_profile=full` selalu menjalankan uji tahan
lama live/Docker yang menyeluruh. Teruskan `run_release_soak=true` untuk
menyertakan jalur uji tahan lama yang sama dengan profil beta. Publikasi stabil
menolak manifes validasi tanpa uji tahan lama ini dan bukti performa produk
yang memblokir.

Penerimaan Paket biasanya membangun tarball kandidat dari `ref` yang telah
di-resolve, termasuk run SHA lengkap yang dikirim dengan `pnpm ci:full-release`.
Setelah publikasi beta, teruskan `release_package_spec=openclaw@YYYY.M.PATCH-beta.N`
untuk menggunakan kembali paket npm yang telah dikirim di seluruh pemeriksaan
rilis, Penerimaan Paket, lintas-OS, Docker jalur rilis, dan paket Telegram.
Gunakan `package_acceptance_package_spec` hanya ketika Penerimaan Paket memang
harus membuktikan paket yang berbeda. Jalur paket live Plugin Codex mengikuti
keadaan yang sama: nilai `release_package_spec` yang dipublikasikan menurunkan
`codex_plugin_spec=npm:@openclaw/codex@<version>`; run SHA/artifak mengemas
`extensions/codex` dari ref yang dipilih; dan operator dapat mengatur
`codex_plugin_spec` secara langsung untuk sumber Plugin `npm:`, `npm-pack:`,
atau `git:`. Jalur tersebut memberikan persetujuan pemasangan Codex CLI eksplisit
yang diwajibkan oleh Plugin itu, lalu menjalankan preflight Codex CLI dan giliran
agen OpenAI dalam sesi yang sama.

## Tahap tingkat atas

| Tahap                | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Resolusi target    | **Job:** `Resolve target ref`<br />**Workflow turunan:** tidak ada<br />**Membuktikan:** me-resolve cabang rilis, tag, atau SHA commit lengkap dan mencatat input yang dipilih.<br />**Jalankan ulang:** jalankan ulang payung jika ini gagal.                                                                                                                                                                                                                                             |
| Vitest dan CI normal | **Job:** `Run normal full CI`<br />**Workflow turunan:** `CI`<br />**Membuktikan:** grafik CI penuh manual terhadap ref target, termasuk jalur Linux Node, shard Plugin bawaan, shard kontrak Plugin dan channel, kompatibilitas Node 22, `check-*`, `check-additional-*`, pemeriksaan smoke artifak terbangun, pemeriksaan dokumen, Python Skills, Windows, macOS, i18n Control UI, dan Android melalui payung.<br />**Jalankan ulang:** `rerun_group=ci`.                           |
| Prarilis Plugin    | **Job:** `Run plugin prerelease validation`<br />**Workflow turunan:** `Plugin Prerelease`<br />**Membuktikan:** pemeriksaan statis Plugin khusus rilis, cakupan Plugin agentik, shard batch ekstensi penuh, jalur Docker prarilis Plugin, dan artifak `plugin-inspector-advisory` yang tidak memblokir untuk triase kompatibilitas.<br />**Jalankan ulang:** `rerun_group=plugin-prerelease`.                                                                                        |
| Pemeriksaan rilis       | **Job:** `Run release/live/Docker/QA validation`<br />**Workflow turunan:** `OpenClaw Release Checks`<br />**Membuktikan:** smoke pemasangan, pemeriksaan paket lintas-OS, Penerimaan Paket, paritas QA Lab, Matrix live, dan Telegram live. Profil stabil dan penuh juga menjalankan suite live/E2E menyeluruh dan potongan Docker jalur rilis; beta dapat ikut serta dengan `run_release_soak=true`.<br />**Jalankan ulang:** `rerun_group=release-checks` atau handle release-checks yang lebih sempit. |
| Paket Telegram     | **Job:** `Run package Telegram E2E`<br />**Workflow turunan:** `NPM Telegram Beta E2E`<br />**Membuktikan:** E2E Telegram paket terpublikasi yang terfokus saat `release_package_spec` atau `npm_telegram_package_spec` diatur. Validasi kandidat penuh menggunakan E2E Telegram Penerimaan Paket kanonis sebagai gantinya.<br />**Jalankan ulang:** `rerun_group=npm-telegram` dengan `release_package_spec` atau `npm_telegram_package_spec`.                                               |
| Verifikator payung    | **Job:** `Verify full validation`<br />**Workflow turunan:** tidak ada<br />**Membuktikan:** memeriksa ulang kesimpulan run turunan yang tercatat dan menambahkan tabel job paling lambat dari workflow turunan.<br />**Jalankan ulang:** jalankan ulang hanya job ini setelah menjalankan ulang turunan yang gagal hingga hijau.                                                                                                                                                                                                  |

Untuk `ref=main` dan `rerun_group=all`, payung yang lebih baru menggantikan
yang lebih lama. Ketika induk dibatalkan, monitornya membatalkan workflow turunan
apa pun yang sudah dikirimnya. Run validasi cabang rilis dan tag tidak saling
membatalkan secara default.

## Tahap pemeriksaan rilis

`OpenClaw Release Checks` adalah workflow turunan terbesar. Ini me-resolve target
sekali dan menyiapkan artifak bersama `release-package-under-test` ketika tahap
yang menghadap paket atau Docker membutuhkannya.

| Tahap               | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Target rilis        | **Job:** `Resolve target ref`<br />**Workflow pendukung:** tidak ada<br />**Pengujian:** ref yang dipilih, SHA yang diharapkan opsional, profil, grup jalankan ulang, dan filter suite live terfokus.<br />**Jalankan ulang:** `rerun_group=release-checks`.                                                                                                                                                                                                                                      |
| Artefak paket       | **Job:** `Prepare release package artifact`<br />**Workflow pendukung:** tidak ada<br />**Pengujian:** mengemas atau menyelesaikan satu tarball kandidat dan mengunggah `release-package-under-test` untuk pemeriksaan hilir yang berhadapan dengan paket.<br />**Jalankan ulang:** paket, lintas-OS, atau grup live/E2E yang terdampak.                                                                                                                                                         |
| Smoke instalasi     | **Job:** `Run install smoke`<br />**Workflow pendukung:** `Install Smoke`<br />**Pengujian:** jalur instalasi penuh dengan penggunaan ulang image smoke Dockerfile root, instalasi paket QR, smoke Docker root dan Gateway, pengujian Docker installer, smoke penyedia image instalasi global Bun, dan E2E instalasi/pencopotan Plugin bawaan cepat.<br />**Jalankan ulang:** `rerun_group=install-smoke`.                                                                                       |
| Lintas-OS           | **Job:** `cross_os_release_checks`<br />**Workflow pendukung:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Pengujian:** jalur fresh dan upgrade di Linux, Windows, dan macOS untuk penyedia dan mode yang dipilih, menggunakan tarball kandidat plus paket baseline.<br />**Jalankan ulang:** `rerun_group=cross-os`.                                                                                                                                                                    |
| Repo dan E2E live   | **Job:** `Run repo/live E2E validation`<br />**Workflow pendukung:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Pengujian:** E2E repositori, cache live, streaming websocket OpenAI, shard penyedia dan Plugin live native, serta harness model/backend/Gateway live berbasis Docker yang dipilih oleh `release_profile`.<br />**Berjalan:** `run_release_soak=true`, `release_profile=full`, atau `rerun_group=live-e2e` terfokus.<br />**Jalankan ulang:** `rerun_group=live-e2e`, opsional dengan `live_suite_filter`. |
| Jalur rilis Docker  | **Job:** `Run Docker release-path validation`<br />**Workflow pendukung:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Pengujian:** chunk Docker jalur rilis terhadap artefak paket bersama.<br />**Berjalan:** `run_release_soak=true`, `release_profile=full`, atau `rerun_group=live-e2e` terfokus.<br />**Jalankan ulang:** `rerun_group=live-e2e`.                                                                                                                                          |
| Penerimaan Paket    | **Job:** `Run package acceptance`<br />**Workflow pendukung:** `Package Acceptance`<br />**Pengujian:** fixture paket Plugin offline, pembaruan Plugin, E2E paket Telegram mock-OpenAI kanonis, dan pemeriksaan penyintas upgrade-terpublikasi terhadap tarball yang sama. Pemeriksaan rilis pemblokir menggunakan baseline terpublikasi terbaru default; pemeriksaan soak diperluas ke setiap rilis npm stabil pada atau setelah `2026.4.23` plus fixture isu yang dilaporkan.<br />**Jalankan ulang:** `rerun_group=package`. |
| Paritas QA          | **Job:** `Run QA Lab parity lane` dan `Run QA Lab parity report`<br />**Workflow pendukung:** job langsung<br />**Pengujian:** paket paritas agentic kandidat dan baseline, lalu laporan paritas.<br />**Jalankan ulang:** `rerun_group=qa-parity` atau `rerun_group=qa`.                                                                                                                                                                                                                             |
| Matrix live QA      | **Job:** `Run QA Lab live Matrix lane`<br />**Workflow pendukung:** job langsung<br />**Pengujian:** profil QA Matrix live cepat di lingkungan `qa-live-shared`.<br />**Jalankan ulang:** `rerun_group=qa-live` atau `rerun_group=qa`.                                                                                                                                                                                                                                                              |
| Telegram live QA    | **Job:** `Run QA Lab live Telegram lane`<br />**Workflow pendukung:** job langsung<br />**Pengujian:** QA Telegram live dengan sewa kredensial CI Convex.<br />**Jalankan ulang:** `rerun_group=qa-live` atau `rerun_group=qa`.                                                                                                                                                                                                                                                                     |
| Verifikator rilis   | **Job:** `Verify release checks`<br />**Workflow pendukung:** tidak ada<br />**Pengujian:** job pemeriksaan rilis yang diperlukan untuk grup jalankan ulang yang dipilih.<br />**Jalankan ulang:** jalankan ulang setelah job anak terfokus lulus.                                                                                                                                                                                                                                                |

## Chunk jalur rilis Docker

Tahap jalur rilis Docker menjalankan chunk ini saat `live_suite_filter`
kosong:

| Chunk                                                           | Cakupan                                                                                                                    |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `core`                                                          | Jalur smoke jalur rilis Docker inti.                                                                                       |
| `package-update-openai`                                         | Perilaku instalasi/pembaruan paket OpenAI, instalasi Codex sesuai permintaan, giliran live Plugin Codex, dan panggilan alat Chat Completions. |
| `package-update-anthropic`                                      | Perilaku instalasi dan pembaruan paket Anthropic.                                                                          |
| `package-update-core`                                           | Perilaku paket dan pembaruan yang netral penyedia.                                                                         |
| `plugins-runtime-plugins`                                       | Jalur runtime Plugin yang menjalankan perilaku Plugin.                                                                      |
| `plugins-runtime-services`                                      | Jalur runtime Plugin berbasis layanan dan live; menyertakan OpenWebUI saat diminta.                                        |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | Batch instalasi/runtime Plugin yang dibagi untuk validasi rilis paralel.                                                   |

Gunakan `docker_lanes=<lane[,lane]>` tertarget pada workflow live/E2E yang dapat digunakan ulang saat
hanya satu jalur Docker yang gagal. Artefak rilis menyertakan perintah jalankan ulang
per jalur dengan input artefak paket dan penggunaan ulang image saat tersedia.

## Profil rilis

`release_profile` sebagian besar mengontrol keluasan live/penyedia di dalam pemeriksaan rilis.
Ini tidak menghapus CI penuh normal, Prarilis Plugin, smoke instalasi, penerimaan paket,
atau QA Lab. Profil stabil dan penuh selalu menjalankan cakupan soak E2E repo/live
dan jalur rilis Docker yang menyeluruh. Profil beta dapat ikut serta dengan
`run_release_soak=true`. Penerimaan Paket menyediakan E2E Telegram paket
kanonis untuk setiap kandidat penuh, sehingga umbrella tidak menduplikasi poller
live tersebut.

| Profil    | Penggunaan yang dimaksudkan       | Cakupan live/penyedia yang disertakan                                                                                                                                                 |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Smoke kritis rilis tercepat.      | Jalur live OpenAI/core, model live Docker untuk OpenAI, inti Gateway native, profil Gateway OpenAI native, Plugin OpenAI native, dan Gateway live Docker OpenAI.                    |
| `stable`  | Profil persetujuan rilis default. | `minimum` plus smoke Anthropic, Google, MiniMax, backend, harness pengujian live native, backend CLI live Docker, bind ACP Docker, harness Codex Docker, dan shard smoke OpenCode Go. |
| `full`    | Sapuan penasihat luas.            | `stable` plus penyedia penasihat, shard live Plugin, dan shard live media.                                                                                                          |

## Tambahan khusus full

Suite ini dilewati oleh `stable` dan disertakan oleh `full`:

| Area                             | Cakupan khusus full                                                                                                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Model live Docker                | OpenCode Go, OpenRouter, xAI, Z.ai, dan Fireworks.                                                                          |
| Gateway live Docker              | Penyedia penasihat dibagi menjadi shard DeepSeek/Fireworks, OpenCode Go/OpenRouter, dan xAI/Z.ai.                          |
| Profil penyedia Gateway native   | Shard Anthropic Opus dan Sonnet/Haiku penuh, Fireworks, DeepSeek, shard model OpenCode Go penuh, OpenRouter, xAI, dan Z.ai. |
| Shard live Plugin native         | Plugin A-K, L-N, O-Z lainnya, Moonshot, dan xAI.                                                                            |
| Shard live media native          | Grup audio, musik Google, musik MiniMax, dan video A-D.                                                                     |

`stable` menyertakan `native-live-src-gateway-profiles-anthropic-smoke` dan
`native-live-src-gateway-profiles-opencode-go-smoke`; `full` menggunakan shard model
Anthropic dan OpenCode Go yang lebih luas sebagai gantinya. Jalankan ulang terfokus masih dapat menggunakan
handle agregat `native-live-src-gateway-profiles-anthropic` atau
`native-live-src-gateway-profiles-opencode-go`.

## Jalankan ulang terfokus

Gunakan `rerun_group` untuk menghindari pengulangan kotak rilis yang tidak terkait:

| Handle              | Cakupan                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| `all`               | Semua tahap Full Release Validation.                                                            |
| `ci`                | Hanya child CI penuh manual.                                                                    |
| `plugin-prerelease` | Hanya child Plugin Prerelease.                                                                  |
| `release-checks`    | Semua tahap OpenClaw Release Checks.                                                            |
| `install-smoke`     | Install Smoke melalui pemeriksaan rilis.                                                        |
| `cross-os`          | Pemeriksaan rilis lintas OS.                                                                    |
| `live-e2e`          | Validasi E2E repo/live dan jalur rilis Docker.                                                  |
| `package`           | Package Acceptance.                                                                             |
| `qa`                | Paritas QA plus lane QA live.                                                                   |
| `qa-parity`         | Hanya lane dan laporan paritas QA.                                                              |
| `qa-live`           | Matrix/Telegram live QA plus lane Discord, WhatsApp, dan Slack berpagar saat diaktifkan.        |
| `npm-telegram`      | E2E Telegram paket terpublikasi; memerlukan `release_package_spec` atau `npm_telegram_package_spec`. |

Gunakan `live_suite_filter` dengan `rerun_group=live-e2e` ketika satu suite live gagal.
ID filter valid didefinisikan dalam workflow live/E2E yang dapat digunakan kembali, termasuk
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker`, dan
`live-codex-harness-docker`.

Handle `live-gateway-advisory-docker` adalah handle pengulangan agregat untuk
tiga shard providernya, sehingga tetap menyebar ke semua job advisory Docker gateway.

Gunakan `cross_os_suite_filter` dengan `rerun_group=cross-os` ketika satu lane lintas OS
gagal. Filter menerima ID OS, ID suite, atau pasangan OS/suite, misalnya
`windows/packaged-upgrade`, `windows`, atau `packaged-fresh`. Ringkasan lintas OS
menyertakan waktu per fase untuk lane peningkatan paket, dan perintah yang berjalan lama
mencetak baris heartbeat sehingga pembaruan Windows yang macet terlihat sebelum
job timeout.

Kegagalan release-check QA memblokir validasi rilis normal. Drift alat dinamis OpenClaw
yang diwajibkan di tier standar juga memblokir pemverifikasi release-check.
Run alpha Tideclaw masih dapat memperlakukan lane release-check non-package-safety sebagai
advisory. Ketika `live_suite_filter` secara eksplisit meminta lane live QA berpagar seperti
Discord, WhatsApp, atau Slack, variabel repo
`OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` yang sesuai harus diaktifkan; jika tidak,
pengambilan input gagal alih-alih melewati lane secara diam-diam. Jalankan ulang `rerun_group=qa`,
`qa-parity`, atau `qa-live` ketika Anda memerlukan bukti QA baru.

## Bukti yang perlu disimpan

Simpan ringkasan `Full Release Validation` sebagai indeks tingkat rilis. Ringkasan itu menautkan
ID run child dan menyertakan tabel job paling lambat. Untuk kegagalan, periksa workflow child
terlebih dahulu, lalu jalankan ulang handle terkecil yang cocok di atas.

Artefak yang berguna:

- `release-package-under-test` dari `OpenClaw Release Checks`
- Artefak jalur rilis Docker di bawah `.artifacts/docker-tests/`
- `package-under-test` Package Acceptance dan artefak penerimaan Docker
- Artefak release-check lintas OS untuk setiap OS dan suite
- Artefak paritas QA, Matrix, dan Telegram

## File workflow

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
