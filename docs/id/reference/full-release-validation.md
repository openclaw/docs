---
read_when:
    - Menjalankan atau menjalankan ulang validasi rilis lengkap
    - Membandingkan profil validasi rilis stabil dan lengkap
    - Mendiagnosis kegagalan tahap validasi rilis
summary: Tahapan Validasi Rilis Penuh, alur kerja turunan, profil rilis, rujukan eksekusi ulang, dan bukti
title: Validasi rilis lengkap
x-i18n:
    generated_at: "2026-05-01T09:27:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: dcbfafd744437c160c09a9c508a639781549193669b300e5249023f9f5dd4afe
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` adalah payung rilis. Ini adalah satu-satunya
titik masuk manual untuk pembuktian prarilis, tetapi sebagian besar pekerjaan
terjadi di workflow turunan sehingga box yang gagal dapat dijalankan ulang tanpa
memulai ulang seluruh rilis.

Jalankan dari ref workflow tepercaya, biasanya `main`, dan berikan branch rilis,
tag, atau SHA commit lengkap sebagai `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Workflow turunan menggunakan ref workflow tepercaya untuk harness dan input
`ref` untuk kandidat yang diuji. Ini membuat logika validasi baru tetap tersedia
saat memvalidasi branch atau tag rilis yang lebih lama.

## Tahap tingkat atas

| Tahap                 | Detail                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Resolusi target       | **Job:** `Resolve target ref`<br />**Workflow turunan:** tidak ada<br />**Membuktikan:** menyelesaikan branch rilis, tag, atau SHA commit lengkap dan mencatat input yang dipilih.<br />**Jalankan ulang:** jalankan ulang payung jika ini gagal.                                                                                                                                              |
| Vitest dan CI normal  | **Job:** `Run normal full CI`<br />**Workflow turunan:** `CI`<br />**Membuktikan:** grafik CI penuh manual terhadap ref target, termasuk lane Linux Node, shard Plugin bawaan, kontrak channel, kompatibilitas Node 22, `check`, `check-additional`, smoke build, pemeriksaan docs, Skills Python, Windows, macOS, i18n Control UI, dan Android melalui payung.<br />**Jalankan ulang:** `rerun_group=ci`. |
| Prarilis Plugin       | **Job:** `Run plugin prerelease validation`<br />**Workflow turunan:** `Plugin Prerelease`<br />**Membuktikan:** pemeriksaan statis Plugin khusus rilis, cakupan Plugin agentic, shard batch ekstensi penuh, dan lane Docker prarilis Plugin.<br />**Jalankan ulang:** `rerun_group=plugin-prerelease`.                                                                                       |
| Pemeriksaan rilis     | **Job:** `Run release/live/Docker/QA validation`<br />**Workflow turunan:** `OpenClaw Release Checks`<br />**Membuktikan:** smoke install, pemeriksaan paket lintas OS, suite live/E2E, chunk jalur rilis Docker, Package Acceptance, paritas QA Lab, Matrix live, dan Telegram live.<br />**Jalankan ulang:** `rerun_group=release-checks` atau handle release-checks yang lebih sempit.         |
| Telegram pascapublikasi | **Job:** `Run post-publish Telegram E2E`<br />**Workflow turunan:** `NPM Telegram Beta E2E`<br />**Membuktikan:** pembuktian Telegram paket terpublikasi opsional saat `npm_telegram_package_spec` diatur.<br />**Jalankan ulang:** `rerun_group=npm-telegram`.                                                                                                                               |
| Verifikator payung    | **Job:** `Verify full validation`<br />**Workflow turunan:** tidak ada<br />**Membuktikan:** memeriksa ulang kesimpulan run turunan yang tercatat dan menambahkan tabel job paling lambat dari workflow turunan.<br />**Jalankan ulang:** jalankan ulang hanya job ini setelah menjalankan ulang turunan yang gagal hingga hijau.                                                              |

Untuk `ref=main` dan `rerun_group=all`, payung yang lebih baru menggantikan yang
lebih lama. Saat induk dibatalkan, monitornya membatalkan setiap workflow turunan
yang sudah dikirimkan. Run validasi branch dan tag rilis tidak saling membatalkan
secara default.

## Tahap pemeriksaan rilis

`OpenClaw Release Checks` adalah workflow turunan terbesar. Ini menyelesaikan
target satu kali dan menyiapkan artefak bersama `release-package-under-test` saat
tahap yang menghadap paket atau Docker membutuhkannya.

| Tahap               | Detail                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Target rilis        | **Job:** `Resolve target ref`<br />**Workflow pendukung:** tidak ada<br />**Menguji:** ref yang dipilih, SHA opsional yang diharapkan, profil, grup jalankan ulang, dan filter suite live terfokus.<br />**Jalankan ulang:** `rerun_group=release-checks`.                                                                                                                                     |
| Artefak paket       | **Job:** `Prepare release package artifact`<br />**Workflow pendukung:** tidak ada<br />**Menguji:** mengemas atau menyelesaikan satu tarball kandidat dan mengunggah `release-package-under-test` untuk pemeriksaan hilir yang menghadap paket.<br />**Jalankan ulang:** grup paket, lintas OS, atau live/E2E yang terdampak.                                                                 |
| Smoke install       | **Job:** `Run install smoke`<br />**Workflow pendukung:** `Install Smoke`<br />**Menguji:** jalur install penuh dengan reuse image smoke Dockerfile root, install paket QR, smoke Docker root dan Gateway, pengujian Docker installer, smoke image-provider install global Bun, dan E2E Docker Plugin bawaan cepat.<br />**Jalankan ulang:** `rerun_group=install-smoke`.                     |
| Lintas OS           | **Job:** `cross_os_release_checks`<br />**Workflow pendukung:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Menguji:** lane fresh dan upgrade di Linux, Windows, dan macOS untuk provider dan mode yang dipilih, menggunakan tarball kandidat plus paket baseline.<br />**Jalankan ulang:** `rerun_group=cross-os`.                                                                  |
| Repo dan E2E live   | **Job:** `Run repo/live E2E validation`<br />**Workflow pendukung:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Menguji:** E2E repositori, cache live, streaming websocket OpenAI, provider live native dan shard Plugin, serta harness model/backend/Gateway live berbasis Docker yang dipilih oleh `release_profile`.<br />**Jalankan ulang:** `rerun_group=live-e2e`, opsional dengan `live_suite_filter`. |
| Jalur rilis Docker  | **Job:** `Run Docker release-path validation`<br />**Workflow pendukung:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Menguji:** chunk Docker jalur rilis terhadap artefak paket bersama.<br />**Jalankan ulang:** `rerun_group=live-e2e`.                                                                                                                                               |
| Package Acceptance  | **Job:** `Run package acceptance`<br />**Workflow pendukung:** `Package Acceptance`<br />**Menguji:** kompatibilitas dependensi channel bawaan native artefak, fixture paket Plugin offline, dan package acceptance Telegram mock-OpenAI terhadap tarball yang sama.<br />**Jalankan ulang:** `rerun_group=package`.                                                                           |
| Paritas QA          | **Job:** `Run QA Lab parity lane` dan `Run QA Lab parity report`<br />**Workflow pendukung:** job langsung<br />**Menguji:** paket paritas agentic kandidat dan baseline, lalu laporan paritas.<br />**Jalankan ulang:** `rerun_group=qa-parity` atau `rerun_group=qa`.                                                                                                                       |
| Matrix live QA      | **Job:** `Run QA Lab live Matrix lane`<br />**Workflow pendukung:** job langsung<br />**Menguji:** profil QA Matrix live cepat di lingkungan `qa-live-shared`.<br />**Jalankan ulang:** `rerun_group=qa-live` atau `rerun_group=qa`.                                                                                                                                                          |
| Telegram live QA    | **Job:** `Run QA Lab live Telegram lane`<br />**Workflow pendukung:** job langsung<br />**Menguji:** QA Telegram live dengan lease kredensial Convex CI.<br />**Jalankan ulang:** `rerun_group=qa-live` atau `rerun_group=qa`.                                                                                                                                                                 |
| Verifikator rilis   | **Job:** `Verify release checks`<br />**Workflow pendukung:** tidak ada<br />**Menguji:** job release-check wajib untuk grup jalankan ulang yang dipilih.<br />**Jalankan ulang:** jalankan ulang setelah job turunan terfokus lulus.                                                                                                                                                         |

## Chunk jalur rilis Docker

Tahap jalur rilis Docker menjalankan chunk ini saat `live_suite_filter` kosong:

| Chunk                                                                                       | Cakupan                                                                 |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                                                      | Lane smoke jalur rilis Docker inti.                                     |
| `package-update-openai`                                                                     | Perilaku install dan update paket OpenAI.                               |
| `package-update-anthropic`                                                                  | Perilaku install dan update paket Anthropic.                            |
| `package-update-core`                                                                       | Perilaku paket dan update netral provider.                              |
| `plugins-runtime-plugins`                                                                   | Lane runtime Plugin yang menjalankan perilaku Plugin.                   |
| `plugins-runtime-services`                                                                  | Lane runtime Plugin berbasis layanan; mencakup OpenWebUI saat diminta.  |
| `plugins-runtime-install-a` through `plugins-runtime-install-h`                             | Batch install/runtime Plugin yang dipisah untuk validasi rilis paralel. |
| `bundled-channels-core`                                                                     | Perilaku Docker channel bawaan.                                         |
| `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` | Perilaku update channel bawaan.                                         |
| `bundled-channels-contracts`                                                                | Pemeriksaan kontrak channel bawaan di jalur rilis Docker.               |

Gunakan `docker_lanes=<lane[,lane]>` yang ditargetkan pada alur kerja live/E2E yang dapat digunakan ulang ketika
hanya satu lane Docker yang gagal. Artefak rilis menyertakan perintah rerun
per-lane dengan input artefak paket dan penggunaan ulang image jika tersedia.

## Profil rilis

`release_profile` hanya mengontrol cakupan live/provider di dalam pemeriksaan rilis. Ini
tidak menghapus CI penuh normal, Plugin Prerelease, install smoke, package
acceptance, QA Lab, atau bagian jalur rilis Docker.

| Profil    | Penggunaan yang dimaksudkan      | Cakupan live/provider yang disertakan                                                                                                                                         |
| --------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Smoke tercepat yang kritis untuk rilis. | Jalur live OpenAI/core, model live Docker untuk OpenAI, native gateway core, profil native OpenAI gateway, native OpenAI plugin, dan Docker live gateway OpenAI.              |
| `stable`  | Profil persetujuan rilis default. | `minimum` ditambah Anthropic, Google, MiniMax, backend, native live test harness, Docker live CLI backend, Docker ACP bind, Docker Codex harness, dan satu shard smoke OpenCode Go. |
| `full`    | Sweep advisory yang luas.        | `stable` ditambah provider advisory, shard live plugin, dan shard live media.                                                                                                  |

## Tambahan khusus full

Suite ini dilewati oleh `stable` dan disertakan oleh `full`:

| Area                             | Cakupan khusus full                                                           |
| -------------------------------- | ------------------------------------------------------------------------------- |
| Model live Docker                | OpenCode Go, OpenRouter, xAI, Z.ai, dan Fireworks.                              |
| Docker live gateway              | Shard advisory untuk DeepSeek, Fireworks, OpenCode Go, OpenRouter, xAI, dan Z.ai. |
| Profil provider native gateway   | Fireworks, DeepSeek, shard model OpenCode Go penuh, OpenRouter, xAI, dan Z.ai.  |
| Shard live native plugin         | Plugins A-K, L-N, O-Z lainnya, Moonshot, dan xAI.                               |
| Shard live native media          | Audio, musik Google, musik MiniMax, dan grup video A-D.                         |

`stable` menyertakan `native-live-src-gateway-profiles-opencode-go-smoke`; `full`
menggunakan shard model OpenCode Go yang lebih luas sebagai gantinya.

## Rerun terfokus

Gunakan `rerun_group` untuk menghindari pengulangan kotak rilis yang tidak terkait:

| Handle              | Cakupan                                           |
| ------------------- | ------------------------------------------------- |
| `all`               | Semua tahap Full Release Validation.             |
| `ci`                | Hanya turunan manual full CI.                     |
| `plugin-prerelease` | Hanya turunan Plugin Prerelease.                 |
| `release-checks`    | Semua tahap OpenClaw Release Checks.             |
| `install-smoke`     | Install Smoke melalui pemeriksaan rilis.         |
| `cross-os`          | Pemeriksaan rilis lintas OS.                     |
| `live-e2e`          | Validasi repo/live E2E dan jalur rilis Docker.   |
| `package`           | Package Acceptance.                              |
| `qa`                | Paritas QA ditambah lane live QA.                |
| `qa-parity`         | Lane paritas QA dan laporan saja.                |
| `qa-live`           | Matrix live QA dan Telegram saja.                |
| `npm-telegram`      | Hanya Telegram E2E opsional pasca-publikasi.     |

Gunakan `live_suite_filter` dengan `rerun_group=live-e2e` ketika satu suite live gagal.
ID filter yang valid didefinisikan dalam alur kerja live/E2E yang dapat digunakan ulang, termasuk
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker`, dan
`live-codex-harness-docker`.

## Bukti untuk disimpan

Simpan ringkasan `Full Release Validation` sebagai indeks tingkat rilis. Ini menautkan
ID run turunan dan menyertakan tabel job paling lambat. Untuk kegagalan, periksa alur kerja
turunan terlebih dahulu, lalu rerun handle terkecil yang cocok di atas.

Artefak berguna:

- `release-package-under-test` dari `OpenClaw Release Checks`
- Artefak jalur rilis Docker di bawah `.artifacts/docker-tests/`
- `package-under-test` Package Acceptance dan artefak acceptance Docker
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
