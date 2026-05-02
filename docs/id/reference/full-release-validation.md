---
read_when:
    - Menjalankan atau menjalankan ulang Validasi Rilis Penuh
    - Membandingkan profil validasi rilis stabil dan lengkap
    - Pemecahan masalah kegagalan tahap validasi rilis
summary: Tahapan Validasi Rilis Penuh, alur kerja turunan, profil rilis, handle jalankan ulang, dan bukti
title: Validasi rilis lengkap
x-i18n:
    generated_at: "2026-05-02T09:31:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: feb4edec850fb97405575c869547b4851bc773507321690670553e6faafc8b0b
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` adalah payung rilis. Ini adalah titik masuk manual tunggal
untuk bukti pra-rilis, tetapi sebagian besar pekerjaan terjadi di alur kerja anak sehingga
box yang gagal dapat dijalankan ulang tanpa memulai ulang seluruh rilis.

Jalankan dari ref alur kerja tepercaya, biasanya `main`, dan berikan cabang rilis,
tag, atau SHA commit lengkap sebagai `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Alur kerja anak menggunakan ref alur kerja tepercaya untuk perangkat pengujian dan input
`ref` untuk kandidat yang diuji. Ini membuat logika validasi baru tetap tersedia
saat memvalidasi cabang rilis atau tag yang lebih lama.

## Tahap tingkat atas

| Tahap                | Detail                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Resolusi target    | **Job:** `Resolve target ref`<br />**Alur kerja anak:** tidak ada<br />**Membuktikan:** menyelesaikan cabang rilis, tag, atau SHA commit lengkap dan mencatat input yang dipilih.<br />**Jalankan ulang:** jalankan ulang payung jika ini gagal.                                                                                                                                                                              |
| Vitest dan CI normal | **Job:** `Run normal full CI`<br />**Alur kerja anak:** `CI`<br />**Membuktikan:** grafik CI penuh manual terhadap ref target, termasuk lane Linux Node, shard Plugin bawaan, kontrak saluran, kompatibilitas Node 22, `check`, `check-additional`, smoke build, pemeriksaan docs, Skills Python, Windows, macOS, i18n Control UI, dan Android melalui payung.<br />**Jalankan ulang:** `rerun_group=ci`. |
| Prarilis Plugin    | **Job:** `Run plugin prerelease validation`<br />**Alur kerja anak:** `Plugin Prerelease`<br />**Membuktikan:** pemeriksaan statis Plugin khusus rilis, cakupan Plugin agentik, shard batch ekstensi penuh, dan lane Docker prarilis Plugin.<br />**Jalankan ulang:** `rerun_group=plugin-prerelease`.                                                                                                       |
| Pemeriksaan rilis       | **Job:** `Run release/live/Docker/QA validation`<br />**Alur kerja anak:** `OpenClaw Release Checks`<br />**Membuktikan:** smoke instalasi, pemeriksaan paket lintas OS, rangkaian live/E2E, chunk jalur rilis Docker, Package Acceptance, paritas QA Lab, Matrix live, dan Telegram live.<br />**Jalankan ulang:** `rerun_group=release-checks` atau handle release-checks yang lebih sempit.                                |
| Paket Telegram     | **Job:** `Run package Telegram E2E`<br />**Alur kerja anak:** `NPM Telegram Beta E2E`<br />**Membuktikan:** bukti paket Telegram berbasis artefak untuk `rerun_group=all` dengan `release_profile=full`, atau bukti Telegram paket yang telah dipublikasikan saat `npm_telegram_package_spec` diatur.<br />**Jalankan ulang:** `rerun_group=npm-telegram` dengan `npm_telegram_package_spec`.                                     |
| Pemverifikasi payung    | **Job:** `Verify full validation`<br />**Alur kerja anak:** tidak ada<br />**Membuktikan:** memeriksa ulang kesimpulan run anak yang tercatat dan menambahkan tabel job paling lambat dari alur kerja anak.<br />**Jalankan ulang:** jalankan ulang hanya job ini setelah menjalankan ulang anak yang gagal hingga hijau.                                                                                                                                   |

Untuk `ref=main` dan `rerun_group=all`, payung yang lebih baru menggantikan yang lebih lama.
Saat induk dibatalkan, pemantaunya membatalkan alur kerja anak yang sudah
dikirim. Run validasi cabang rilis dan tag tidak saling membatalkan secara
default.

## Tahap pemeriksaan rilis

`OpenClaw Release Checks` adalah alur kerja anak terbesar. Ini menyelesaikan target
satu kali dan menyiapkan artefak bersama `release-package-under-test` saat tahap
yang menghadap paket atau Docker membutuhkannya.

| Tahap               | Detail                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Target rilis      | **Job:** `Resolve target ref`<br />**Alur kerja pendukung:** tidak ada<br />**Menguji:** ref yang dipilih, SHA yang diharapkan opsional, profil, grup jalankan ulang, dan filter rangkaian live terfokus.<br />**Jalankan ulang:** `rerun_group=release-checks`.                                                                                                                                                                           |
| Artefak paket    | **Job:** `Prepare release package artifact`<br />**Alur kerja pendukung:** tidak ada<br />**Menguji:** mengemas atau menyelesaikan satu tarball kandidat dan mengunggah `release-package-under-test` untuk pemeriksaan hilir yang menghadap paket.<br />**Jalankan ulang:** grup paket, lintas OS, atau live/E2E yang terdampak.                                                                                                           |
| Smoke instalasi       | **Job:** `Run install smoke`<br />**Alur kerja pendukung:** `Install Smoke`<br />**Menguji:** jalur instalasi penuh dengan penggunaan ulang image smoke Dockerfile root, instalasi paket QR, smoke Docker root dan Gateway, pengujian Docker installer, smoke penyedia image instalasi global Bun, dan E2E instalasi/pencopotan Plugin bawaan cepat.<br />**Jalankan ulang:** `rerun_group=install-smoke`.                              |
| Lintas OS            | **Job:** `cross_os_release_checks`<br />**Alur kerja pendukung:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Menguji:** lane fresh dan upgrade di Linux, Windows, dan macOS untuk penyedia dan mode yang dipilih, menggunakan tarball kandidat ditambah paket baseline.<br />**Jalankan ulang:** `rerun_group=cross-os`.                                                                               |
| Repo dan E2E live   | **Job:** `Run repo/live E2E validation`<br />**Alur kerja pendukung:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Menguji:** E2E repositori, cache live, streaming websocket OpenAI, shard penyedia dan Plugin live native, serta perangkat pengujian model/backend/Gateway live berbasis Docker yang dipilih oleh `release_profile`.<br />**Jalankan ulang:** `rerun_group=live-e2e`, opsional dengan `live_suite_filter`. |
| Jalur rilis Docker | **Job:** `Run Docker release-path validation`<br />**Alur kerja pendukung:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Menguji:** chunk Docker jalur rilis terhadap artefak paket bersama.<br />**Jalankan ulang:** `rerun_group=live-e2e`.                                                                                                                                                      |
| Package Acceptance  | **Job:** `Run package acceptance`<br />**Alur kerja pendukung:** `Package Acceptance`<br />**Menguji:** fixture paket Plugin offline, pembaruan Plugin, dan penerimaan paket Telegram mock-OpenAI terhadap tarball yang sama.<br />**Jalankan ulang:** `rerun_group=package`.                                                                                                                                  |
| Paritas QA           | **Job:** `Run QA Lab parity lane` dan `Run QA Lab parity report`<br />**Alur kerja pendukung:** job langsung<br />**Menguji:** paket paritas agentik kandidat dan baseline, lalu laporan paritas.<br />**Jalankan ulang:** `rerun_group=qa-parity` atau `rerun_group=qa`.                                                                                                                                       |
| Matrix live QA      | **Job:** `Run QA Lab live Matrix lane`<br />**Alur kerja pendukung:** job langsung<br />**Menguji:** profil QA Matrix live cepat di lingkungan `qa-live-shared`.<br />**Jalankan ulang:** `rerun_group=qa-live` atau `rerun_group=qa`.                                                                                                                                                                        |
| Telegram live QA    | **Job:** `Run QA Lab live Telegram lane`<br />**Alur kerja pendukung:** job langsung<br />**Menguji:** QA Telegram live dengan lease kredensial Convex CI.<br />**Jalankan ulang:** `rerun_group=qa-live` atau `rerun_group=qa`.                                                                                                                                                                                    |
| Pemverifikasi rilis    | **Job:** `Verify release checks`<br />**Alur kerja pendukung:** tidak ada<br />**Menguji:** job release-check wajib untuk grup jalankan ulang yang dipilih.<br />**Jalankan ulang:** jalankan ulang setelah job anak terfokus lolos.                                                                                                                                                                                                 |

## Chunk jalur rilis Docker

Tahap jalur rilis Docker menjalankan chunk ini saat `live_suite_filter`
kosong:

| Chunk                                                           | Cakupan                                                                |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                          | Lane smoke jalur rilis Docker inti.                                   |
| `package-update-openai`                                         | Perilaku instalasi dan pembaruan paket OpenAI.                             |
| `package-update-anthropic`                                      | Perilaku instalasi dan pembaruan paket Anthropic.                          |
| `package-update-core`                                           | Perilaku paket dan pembaruan yang netral penyedia.                           |
| `plugins-runtime-plugins`                                       | Lane runtime Plugin yang menjalankan perilaku Plugin.                     |
| `plugins-runtime-services`                                      | Lane runtime Plugin berbasis layanan; mencakup OpenWebUI saat diminta. |
| `plugins-runtime-install-a` hingga `plugins-runtime-install-h` | Batch instalasi/runtime Plugin yang dibagi untuk validasi rilis paralel.   |

Gunakan `docker_lanes=<lane[,lane]>` yang ditargetkan pada alur kerja live/E2E yang dapat digunakan ulang saat
hanya satu lane Docker yang gagal. Artefak rilis menyertakan perintah jalankan ulang
per lane dengan artefak paket dan input penggunaan ulang image saat tersedia.

## Profil rilis

`release_profile` terutama mengontrol luasnya live/penyedia di dalam pemeriksaan rilis.
Ini tidak menghapus CI penuh normal, Plugin Prerelease, smoke instalasi, penerimaan paket,
QA Lab, atau chunk jalur rilis Docker. `full` juga membuat
payung menjalankan E2E Telegram paket terhadap artefak paket rilis saat
`rerun_group=all`, sehingga kandidat pra-publikasi penuh tidak melewatkan lane
paket Telegram tersebut secara diam-diam.

| Profil    | Penggunaan yang dituju                  | Cakupan live/penyedia yang disertakan                                                                                                                                          |
| --------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Smoke paling cepat yang kritis untuk rilis. | Jalur live OpenAI/core, model live Docker untuk OpenAI, inti gateway native, profil Gateway OpenAI native, Plugin OpenAI native, dan Gateway live Docker OpenAI.              |
| `stable`  | Profil persetujuan rilis default.       | `minimum` plus Anthropic, Google, MiniMax, backend, harness pengujian live native, backend CLI live Docker, bind ACP Docker, harness Codex Docker, dan shard smoke OpenCode Go. |
| `full`    | Penyisiran advisory yang luas.          | `stable` plus penyedia advisory, shard live Plugin, dan shard live media.                                                                                                      |

## Tambahan khusus full

Suite ini dilewati oleh `stable` dan disertakan oleh `full`:

| Area                             | Cakupan khusus full                                                             |
| -------------------------------- | ------------------------------------------------------------------------------- |
| Model live Docker                | OpenCode Go, OpenRouter, xAI, Z.ai, dan Fireworks.                              |
| Gateway live Docker              | Shard advisory untuk DeepSeek, Fireworks, OpenCode Go, OpenRouter, xAI, dan Z.ai. |
| Profil penyedia Gateway native   | Fireworks, DeepSeek, shard model OpenCode Go lengkap, OpenRouter, xAI, dan Z.ai. |
| Shard live Plugin native         | Plugin A-K, L-N, O-Z lainnya, Moonshot, dan xAI.                                |
| Shard live media native          | Audio, Google music, MiniMax music, dan grup video A-D.                         |

`stable` menyertakan `native-live-src-gateway-profiles-opencode-go-smoke`; `full`
menggunakan shard model OpenCode Go yang lebih luas sebagai gantinya.

## Rerun terfokus

Gunakan `rerun_group` untuk menghindari pengulangan kotak rilis yang tidak terkait:

| Handle              | Cakupan                                                               |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | Semua tahap Full Release Validation.                                  |
| `ci`                | Hanya child CI lengkap manual.                                        |
| `plugin-prerelease` | Hanya child Plugin Prerelease.                                        |
| `release-checks`    | Semua tahap OpenClaw Release Checks.                                  |
| `install-smoke`     | Install Smoke hingga pemeriksaan rilis.                               |
| `cross-os`          | Pemeriksaan rilis Cross-OS.                                           |
| `live-e2e`          | Validasi repo/live E2E dan jalur rilis Docker.                        |
| `package`           | Package Acceptance.                                                   |
| `qa`                | Paritas QA plus lane live QA.                                         |
| `qa-parity`         | Hanya lane dan laporan paritas QA.                                    |
| `qa-live`           | Hanya Matrix dan Telegram live QA.                                    |
| `npm-telegram`      | E2E Telegram paket terpublikasi; memerlukan `npm_telegram_package_spec`. |

Gunakan `live_suite_filter` dengan `rerun_group=live-e2e` ketika satu suite live gagal.
ID filter yang valid didefinisikan dalam workflow live/E2E reusable, termasuk
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker`, dan
`live-codex-harness-docker`.

## Bukti yang perlu disimpan

Simpan ringkasan `Full Release Validation` sebagai indeks tingkat rilis. Ringkasan ini menautkan
ID run child dan menyertakan tabel job paling lambat. Untuk kegagalan, periksa workflow
child terlebih dahulu, lalu jalankan ulang handle terkecil yang sesuai di atas.

Artefak berguna:

- `release-package-under-test` dari `OpenClaw Release Checks`
- Artefak jalur rilis Docker di bawah `.artifacts/docker-tests/`
- `package-under-test` Package Acceptance dan artefak acceptance Docker
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
