---
read_when:
    - Menjalankan atau menjalankan ulang Validasi Rilis Lengkap
    - Membandingkan profil validasi rilis stabil dan lengkap
    - Men-debug kegagalan tahap validasi rilis
summary: Tahap Validasi Rilis Penuh, alur kerja turunan, profil rilis, handle eksekusi ulang, dan bukti
title: Validasi rilis lengkap
x-i18n:
    generated_at: "2026-05-11T20:35:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3d83d15272e4f7cff82ef791c8dbeb6adc447626ada8ae221d074ee16b2cadd5
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` adalah payung rilis. Ini adalah satu-satunya
entrypoint manual untuk bukti prarilis, tetapi sebagian besar pekerjaan terjadi
di alur kerja anak sehingga kotak yang gagal dapat dijalankan ulang tanpa
memulai ulang seluruh rilis.

Jalankan dari ref alur kerja tepercaya, biasanya `main`, dan teruskan branch
rilis, tag, atau SHA commit lengkap sebagai `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Alur kerja anak menggunakan ref alur kerja tepercaya untuk harness dan input
`ref` untuk kandidat yang diuji. Ini menjaga logika validasi baru tetap tersedia
saat memvalidasi branch atau tag rilis yang lebih lama.

Secara default, `release_profile=stable` menjalankan lane yang memblokir rilis
dan melewati soak live/Docker yang menyeluruh. Teruskan `run_release_soak=true`
untuk menyertakan lane soak pada proses stable. `release_profile=full` selalu
mengaktifkan lane soak sehingga profil advisori yang luas tidak pernah
kehilangan cakupan secara diam-diam.

Package Acceptance biasanya membangun tarball kandidat dari `ref` yang
di-resolve, termasuk proses dengan SHA lengkap yang di-dispatch menggunakan
`pnpm ci:full-release`. Setelah publikasi beta, teruskan
`release_package_spec=openclaw@YYYY.M.D-beta.N` untuk menggunakan kembali paket
npm yang sudah dikirim di seluruh pemeriksaan rilis, Package Acceptance,
lintas-OS, Docker jalur rilis, dan paket Telegram. Gunakan
`package_acceptance_package_spec` hanya saat Package Acceptance memang sengaja
harus membuktikan paket yang berbeda.

## Tahap tingkat atas

| Tahap                | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Resolusi target    | **Pekerjaan:** `Resolve target ref`<br />**Alur kerja anak:** tidak ada<br />**Membuktikan:** me-resolve branch rilis, tag, atau SHA commit lengkap dan mencatat input yang dipilih.<br />**Jalankan ulang:** jalankan ulang payung jika ini gagal.                                                                                                                                                                                                                               |
| Vitest dan CI normal | **Pekerjaan:** `Run normal full CI`<br />**Alur kerja anak:** `CI`<br />**Membuktikan:** grafik CI penuh manual terhadap ref target, termasuk lane Linux Node, shard Plugin bawaan, kontrak channel, kompatibilitas Node 22, `check`, `check-additional`, smoke build, pemeriksaan docs, Skills Python, Windows, macOS, i18n UI Kontrol, dan Android melalui payung.<br />**Jalankan ulang:** `rerun_group=ci`.                                                  |
| Prarilis Plugin    | **Pekerjaan:** `Run plugin prerelease validation`<br />**Alur kerja anak:** `Plugin Prerelease`<br />**Membuktikan:** pemeriksaan statis Plugin khusus rilis, cakupan Plugin agentik, shard batch ekstensi penuh, lane Docker prarilis Plugin, dan artefak `plugin-inspector-advisory` non-blocking untuk triase kompatibilitas.<br />**Jalankan ulang:** `rerun_group=plugin-prerelease`.                                                                          |
| Pemeriksaan rilis       | **Pekerjaan:** `Run release/live/Docker/QA validation`<br />**Alur kerja anak:** `OpenClaw Release Checks`<br />**Membuktikan:** smoke install, pemeriksaan paket lintas-OS, Package Acceptance, paritas QA Lab, Matrix live, dan Telegram live. Dengan `run_release_soak=true` atau `release_profile=full`, juga menjalankan suite live/E2E menyeluruh dan chunk Docker jalur rilis.<br />**Jalankan ulang:** `rerun_group=release-checks` atau handle release-checks yang lebih sempit. |
| Artefak paket     | **Pekerjaan:** `Prepare release package artifact`<br />**Alur kerja anak:** tidak ada<br />**Membuktikan:** membuat tarball induk `release-package-under-test` cukup awal untuk pemeriksaan yang menghadap paket dan tidak perlu menunggu `OpenClaw Release Checks`.<br />**Jalankan ulang:** jalankan ulang payung atau berikan `release_package_spec` untuk menjalankan ulang paket yang sudah dipublikasikan.                                                                                           |
| Paket Telegram     | **Pekerjaan:** `Run package Telegram E2E`<br />**Alur kerja anak:** `NPM Telegram Beta E2E`<br />**Membuktikan:** bukti paket Telegram berbasis artefak induk untuk `rerun_group=all` dengan `release_profile=full`, atau bukti Telegram paket yang sudah dipublikasikan saat `release_package_spec` atau `npm_telegram_package_spec` ditetapkan.<br />**Jalankan ulang:** `rerun_group=npm-telegram` dengan `release_package_spec` atau `npm_telegram_package_spec`.                           |
| Pemverifikasi payung    | **Pekerjaan:** `Verify full validation`<br />**Alur kerja anak:** tidak ada<br />**Membuktikan:** memeriksa ulang kesimpulan proses anak yang tercatat dan menambahkan tabel pekerjaan paling lambat dari alur kerja anak.<br />**Jalankan ulang:** jalankan ulang hanya pekerjaan ini setelah menjalankan ulang anak yang gagal hingga hijau.                                                                                                                                                                                    |

Untuk `ref=main` dan `rerun_group=all`, payung yang lebih baru menggantikan
yang lebih lama. Saat induk dibatalkan, monitornya membatalkan alur kerja anak
apa pun yang sudah di-dispatch. Proses validasi branch dan tag rilis tidak
membatalkan satu sama lain secara default.

## Tahap pemeriksaan rilis

`OpenClaw Release Checks` adalah alur kerja anak terbesar. Ini me-resolve target
satu kali dan menyiapkan artefak bersama `release-package-under-test` saat tahap
yang menghadap paket atau Docker membutuhkannya.

| Tahap               | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Target rilis      | **Job:** `Resolve target ref`<br />**Workflow pendukung:** tidak ada<br />**Pengujian:** ref yang dipilih, SHA yang diharapkan opsional, profil, grup rerun, dan filter suite live terfokus.<br />**Rerun:** `rerun_group=release-checks`.                                                                                                                                                                                                                                                                              |
| Artefak paket    | **Job:** `Prepare release package artifact`<br />**Workflow pendukung:** tidak ada<br />**Pengujian:** mengemas atau menyelesaikan satu kandidat tarball dan mengunggah `release-package-under-test` untuk pemeriksaan hilir yang berhadapan dengan paket.<br />**Rerun:** paket, lintas-OS, atau grup live/E2E yang terdampak.                                                                                                                                                                                                              |
| Smoke instalasi       | **Job:** `Run install smoke`<br />**Workflow pendukung:** `Install Smoke`<br />**Pengujian:** jalur instalasi penuh dengan penggunaan ulang image smoke Dockerfile root, instalasi paket QR, smoke Docker root dan Gateway, pengujian Docker penginstal, smoke penyedia image instalasi global Bun, dan E2E instalasi/uninstalasi Plugin bawaan cepat.<br />**Rerun:** `rerun_group=install-smoke`.                                                                                                                                 |
| Lintas-OS            | **Job:** `cross_os_release_checks`<br />**Workflow pendukung:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Pengujian:** lane fresh dan upgrade pada Linux, Windows, dan macOS untuk penyedia dan mode yang dipilih, menggunakan kandidat tarball plus paket baseline.<br />**Rerun:** `rerun_group=cross-os`.                                                                                                                                                                                  |
| Repo dan E2E live   | **Job:** `Run repo/live E2E validation`<br />**Workflow pendukung:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Pengujian:** E2E repositori, cache live, streaming websocket OpenAI, shard penyedia live native dan Plugin, serta harness model/backend/Gateway live berbasis Docker yang dipilih oleh `release_profile`.<br />**Berjalan:** `run_release_soak=true`, `release_profile=full`, atau `rerun_group=live-e2e` terfokus.<br />**Rerun:** `rerun_group=live-e2e`, opsional dengan `live_suite_filter`. |
| Jalur rilis Docker | **Job:** `Run Docker release-path validation`<br />**Workflow pendukung:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Pengujian:** chunk Docker jalur rilis terhadap artefak paket bersama.<br />**Berjalan:** `run_release_soak=true`, `release_profile=full`, atau `rerun_group=live-e2e` terfokus.<br />**Rerun:** `rerun_group=live-e2e`.                                                                                                                                                      |
| Package Acceptance  | **Job:** `Run package acceptance`<br />**Workflow pendukung:** `Package Acceptance`<br />**Pengujian:** fixture paket Plugin offline, pembaruan Plugin, package acceptance Telegram mock-OpenAI, dan pemeriksaan survivor upgrade terpublikasi terhadap tarball yang sama. Pemeriksaan rilis pemblokir menggunakan baseline terpublikasi terbaru default; pemeriksaan soak diperluas ke setiap rilis npm stabil pada atau setelah `2026.4.23` plus fixture masalah yang dilaporkan.<br />**Rerun:** `rerun_group=package`.                          |
| Paritas QA           | **Job:** `Run QA Lab parity lane` dan `Run QA Lab parity report`<br />**Workflow pendukung:** job langsung<br />**Pengujian:** pack paritas agentic kandidat dan baseline, lalu laporan paritas.<br />**Rerun:** `rerun_group=qa-parity` atau `rerun_group=qa`.                                                                                                                                                                                                                                          |
| Matrix live QA      | **Job:** `Run QA Lab live Matrix lane`<br />**Workflow pendukung:** job langsung<br />**Pengujian:** profil QA Matrix live cepat di lingkungan `qa-live-shared`.<br />**Rerun:** `rerun_group=qa-live` atau `rerun_group=qa`.                                                                                                                                                                                                                                                                           |
| Telegram live QA    | **Job:** `Run QA Lab live Telegram lane`<br />**Workflow pendukung:** job langsung<br />**Pengujian:** QA Telegram live dengan lease kredensial CI Convex.<br />**Rerun:** `rerun_group=qa-live` atau `rerun_group=qa`.                                                                                                                                                                                                                                                                                       |
| Pemverifikasi rilis    | **Job:** `Verify release checks`<br />**Workflow pendukung:** tidak ada<br />**Pengujian:** job pemeriksaan rilis wajib untuk grup rerun yang dipilih.<br />**Rerun:** rerun setelah job anak terfokus lolos.                                                                                                                                                                                                                                                                                                    |

## Chunk jalur rilis Docker

Tahap jalur rilis Docker menjalankan chunk ini saat `live_suite_filter`
kosong:

| Chunk                                                           | Cakupan                                                                                          |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `core`                                                          | Lane smoke jalur rilis Docker inti.                                                             |
| `package-update-openai`                                         | Perilaku instalasi/pembaruan paket OpenAI, instalasi Codex sesuai permintaan, dan panggilan alat Chat Completions. |
| `package-update-anthropic`                                      | Perilaku instalasi dan pembaruan paket Anthropic.                                                    |
| `package-update-core`                                           | Perilaku paket dan pembaruan yang netral penyedia.                                                     |
| `plugins-runtime-plugins`                                       | Lane runtime Plugin yang menjalankan perilaku Plugin.                                               |
| `plugins-runtime-services`                                      | Lane runtime Plugin berbasis layanan dan live; mencakup OpenWebUI saat diminta.                  |
| `plugins-runtime-install-a` hingga `plugins-runtime-install-h` | Batch instalasi/runtime Plugin yang dipisah untuk validasi rilis paralel.                             |

Gunakan `docker_lanes=<lane[,lane]>` yang ditargetkan pada workflow live/E2E reusable saat
hanya satu lane Docker yang gagal. Artefak rilis menyertakan perintah rerun
per lane dengan input artefak paket dan penggunaan ulang image saat tersedia.

## Profil rilis

`release_profile` terutama mengontrol cakupan live/penyedia di dalam pemeriksaan rilis.
Ini tidak menghapus CI penuh normal, Plugin Prerelease, smoke instalasi, package
acceptance, atau QA Lab. Untuk `stable`, E2E repo/live yang menyeluruh dan chunk
jalur rilis Docker adalah cakupan soak dan berjalan saat `run_release_soak=true`.
`full` memaksa cakupan soak aktif dan juga membuat umbrella menjalankan E2E paket Telegram
terhadap artefak paket rilis induk saat `rerun_group=all`, sehingga kandidat
pra-publikasi penuh tidak diam-diam melewati lane paket Telegram tersebut.

| Profil   | Penggunaan yang dimaksudkan                      | Cakupan live/penyedia yang disertakan                                                                                                                                                     |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Smoke kritis rilis tercepat.   | Jalur live OpenAI/core, model live Docker untuk OpenAI, core Gateway native, profil Gateway OpenAI native, Plugin OpenAI native, dan Gateway live Docker OpenAI.                     |
| `stable`  | Profil persetujuan rilis default. | `minimum` plus smoke Anthropic, Google, MiniMax, backend, harness pengujian live native, backend CLI live Docker, bind ACP Docker, harness Codex Docker, dan shard smoke OpenCode Go. |
| `full`    | Sweep advisory luas.             | `stable` plus penyedia advisory, shard live Plugin, dan shard live media.                                                                                                        |

## Tambahan khusus full

Suite ini dilewati oleh `stable` dan disertakan oleh `full`:

| Area                             | Cakupan khusus full                                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Model live Docker               | OpenCode Go, OpenRouter, xAI, Z.ai, dan Fireworks.                                                                          |
| Gateway live Docker              | Penyedia advisory dipisah menjadi shard DeepSeek/Fireworks, OpenCode Go/OpenRouter, dan xAI/Z.ai.                              |
| Profil penyedia Gateway native | Shard lengkap Anthropic Opus dan Sonnet/Haiku, Fireworks, DeepSeek, shard model OpenCode Go lengkap, OpenRouter, xAI, dan Z.ai. |
| Shard live Plugin native        | Plugin A-K, L-N, O-Z lainnya, Moonshot, dan xAI.                                                                             |
| Shard live media native         | Grup audio, musik Google, musik MiniMax, dan video A-D.                                                                   |

`stable` menyertakan `native-live-src-gateway-profiles-anthropic-smoke` dan
`native-live-src-gateway-profiles-opencode-go-smoke`; `full` menggunakan shard
model Anthropic dan OpenCode Go yang lebih luas sebagai gantinya. Rerun terfokus tetap dapat menggunakan
handle agregat `native-live-src-gateway-profiles-anthropic` atau
`native-live-src-gateway-profiles-opencode-go`.

## Rerun terfokus

Gunakan `rerun_group` untuk menghindari pengulangan kotak rilis yang tidak terkait:

| Handle              | Cakupan                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| `all`               | Semua tahap Validasi Rilis Penuh.                                                              |
| `ci`                | Hanya turunan CI penuh manual.                                                                  |
| `plugin-prerelease` | Hanya turunan Prarilis Plugin.                                                                  |
| `release-checks`    | Semua tahap Pemeriksaan Rilis OpenClaw.                                                         |
| `install-smoke`     | Uji smoke instalasi melalui pemeriksaan rilis.                                                   |
| `cross-os`          | Pemeriksaan rilis lintas OS.                                                                    |
| `live-e2e`          | Validasi E2E repo/live dan jalur rilis Docker.                                                   |
| `package`           | Penerimaan Paket.                                                                               |
| `qa`                | Paritas QA ditambah jalur live QA.                                                              |
| `qa-parity`         | Hanya jalur dan laporan paritas QA.                                                             |
| `qa-live`           | Hanya Matrix dan Telegram live QA.                                                              |
| `npm-telegram`      | E2E Telegram paket terpublikasi; memerlukan `release_package_spec` atau `npm_telegram_package_spec`. |

Gunakan `live_suite_filter` dengan `rerun_group=live-e2e` ketika satu suite live gagal.
Id filter yang valid didefinisikan dalam workflow live/E2E yang dapat digunakan kembali, termasuk
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker`, dan
`live-codex-harness-docker`.

Handle `live-gateway-advisory-docker` adalah handle rerun agregat untuk
tiga shard providernya, sehingga tetap menyebar ke semua tugas Gateway Docker advisory.

Gunakan `cross_os_suite_filter` dengan `rerun_group=cross-os` ketika satu jalur lintas OS
gagal. Filter menerima id OS, id suite, atau pasangan OS/suite, misalnya
`windows/packaged-upgrade`, `windows`, atau `packaged-fresh`. Ringkasan lintas OS
menyertakan waktu per fase untuk jalur upgrade terpaket, dan perintah yang berjalan lama
mencetak baris Heartbeat sehingga pembaruan Windows yang macet terlihat sebelum
timeout tugas.

Jalur pemeriksaan rilis QA bersifat advisory. Kegagalan hanya QA dilaporkan sebagai peringatan
dan tidak memblokir verifier pemeriksaan rilis; jalankan ulang `rerun_group=qa`,
`qa-parity`, atau `qa-live` ketika Anda membutuhkan bukti QA baru.

## Bukti yang perlu disimpan

Simpan ringkasan `Full Release Validation` sebagai indeks tingkat rilis. Ringkasan ini menautkan
id run turunan dan menyertakan tabel tugas paling lambat. Untuk kegagalan, periksa workflow
turunan terlebih dahulu, lalu jalankan ulang handle terkecil yang sesuai di atas.

Artefak berguna:

- `release-package-under-test` dari induk Validasi Rilis Penuh dan `OpenClaw Release Checks`
- Artefak jalur rilis Docker di bawah `.artifacts/docker-tests/`
- Artefak Penerimaan Paket `package-under-test` dan penerimaan Docker
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
