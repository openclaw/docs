---
read_when:
    - Mengubah perilaku pembaruan, doctor, penerimaan paket, atau instalasi Plugin OpenClaw
    - Menyiapkan atau menyetujui kandidat rilis
    - Pemecahan masalah pembaruan paket, pembersihan dependensi Plugin, atau regresi instalasi Plugin
sidebarTitle: Update and plugin tests
summary: Cara OpenClaw memvalidasi jalur pembaruan, migrasi paket, dan perilaku instalasi/pembaruan Plugin
title: 'Pengujian: pembaruan dan Plugin'
x-i18n:
    generated_at: "2026-05-05T06:17:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19ae526d3daa8a1b67cb2f74225138b3e1fa192c9f956c9dd6d0e407581b9ed9
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Ini adalah checklist khusus untuk validasi pembaruan dan Plugin. Tujuannya
sederhana: membuktikan bahwa paket yang dapat diinstal dapat memperbarui status
pengguna nyata, memperbaiki status legacy yang usang melalui `doctor`, dan tetap
dapat menginstal, memuat, memperbarui, serta menghapus Plugin dari sumber yang
didukung.

Untuk peta test runner yang lebih luas, lihat [Pengujian](/id/help/testing). Untuk
kunci provider live dan suite yang menyentuh jaringan, lihat [Pengujian live](/id/help/testing-live).

## Yang kami lindungi

Pengujian pembaruan dan Plugin melindungi kontrak berikut:

- Tarball paket lengkap, memiliki `dist/postinstall-inventory.json` yang valid,
  dan tidak bergantung pada file repo yang belum dipaketkan.
- Pengguna dapat berpindah dari paket terbitan lama ke paket kandidat tanpa
  kehilangan config, agent, session, workspace, allowlist Plugin, atau config
  channel.
- `openclaw doctor --fix --non-interactive` memiliki jalur pembersihan dan
  perbaikan legacy. Startup tidak boleh menambah migrasi kompatibilitas
  tersembunyi untuk status Plugin yang usang.
- Instalasi Plugin berfungsi dari direktori lokal, repo git, paket npm, dan
  jalur registry ClawHub.
- Dependensi npm Plugin diinstal di root npm terkelola, dipindai sebelum
  dipercaya, dan dihapus melalui npm saat uninstall agar dependensi yang
  di-hoist tidak tertinggal.
- Pembaruan Plugin stabil ketika tidak ada yang berubah: record instalasi,
  sumber terselesaikan, tata letak dependensi terinstal, dan status enabled
  tetap utuh.

## Bukti lokal selama pengembangan

Mulai secara sempit:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Untuk perubahan instalasi, uninstall, dependensi, atau package-inventory Plugin,
jalankan juga pengujian terfokus yang mencakup seam yang diedit:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Sebelum lane Docker paket apa pun menggunakan tarball, buktikan artefak paket:

```bash
pnpm release:check
```

`release:check` menjalankan pemeriksaan drift config/docs/API, menulis inventory
dist paket, menjalankan `npm pack --dry-run`, menolak file terpaket yang
dilarang, menginstal tarball ke prefix sementara, menjalankan postinstall, dan
melakukan smoke pada entrypoint channel bawaan.

## Lane Docker

Lane Docker adalah bukti tingkat produk. Lane ini menginstal atau memperbarui
paket nyata di dalam container Linux dan menegaskan perilaku melalui perintah
CLI, startup Gateway, probe HTTP, status RPC, dan status filesystem.

Gunakan lane terfokus saat iterasi:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-restart-auth
pnpm test:docker:update-migration
```

Lane penting:

- `test:docker:plugins` memvalidasi smoke instalasi Plugin, instalasi folder
  lokal, perilaku skip pembaruan folder lokal, folder lokal dengan dependensi
  pra-instal, instalasi paket `file:`, instalasi git dengan eksekusi CLI,
  pembaruan moving-ref git, instalasi registry npm dengan dependensi transitif
  yang di-hoist, no-op pembaruan npm, instalasi fixture ClawHub lokal dan no-op
  pembaruan, perilaku pembaruan marketplace, serta enable/inspect Claude-bundle. Set
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` agar blok ClawHub tetap hermetic/offline.
- `test:docker:plugin-lifecycle-matrix` menginstal paket kandidat di container
  kosong, menjalankan Plugin npm melalui install, inspect, disable, enable,
  upgrade eksplisit, downgrade eksplisit, dan uninstall setelah menghapus kode
  Plugin. Lane ini mencatat metrik RSS dan CPU untuk setiap fase.
- `test:docker:plugin-update` memvalidasi bahwa Plugin terinstal yang tidak
  berubah tidak diinstal ulang atau kehilangan metadata instalasi selama
  `openclaw plugins update`.
- `test:docker:upgrade-survivor` menginstal tarball kandidat di atas fixture
  pengguna lama yang kotor, menjalankan pembaruan paket plus doctor
  non-interactive, lalu memulai Gateway loopback dan memeriksa pelestarian
  status.
- `test:docker:published-upgrade-survivor` terlebih dahulu menginstal baseline
  terbitan, mengonfigurasinya melalui resep `openclaw config set` bawaan,
  memperbaruinya ke tarball kandidat, menjalankan doctor, memeriksa pembersihan
  legacy, memulai Gateway, dan melakukan probe `/healthz`, `/readyz`, serta
  status RPC.
- `test:docker:update-restart-auth` menginstal paket kandidat, memulai Gateway
  auth token terkelola, menghapus env auth gateway pemanggil untuk
  `openclaw update --yes --json`, dan mewajibkan perintah pembaruan kandidat
  memulai ulang Gateway sebelum probe normal.
- `test:docker:update-migration` adalah lane published-update yang berat pada
  pembersihan. Lane ini dimulai dari status pengguna bergaya Discord/Telegram
  yang telah dikonfigurasi, menjalankan doctor baseline agar dependensi Plugin
  yang dikonfigurasi punya kesempatan untuk muncul, menanam debris dependensi
  Plugin legacy untuk Plugin terpaket yang dikonfigurasi, memperbarui ke tarball
  kandidat, dan mewajibkan doctor pasca-pembaruan menghapus root dependensi
  legacy.

Varian published-upgrade survivor yang berguna:

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

Skenario yang tersedia adalah `base`, `feishu-channel`, `bootstrap-persona`,
`plugin-deps-cleanup`, `configured-plugin-installs`,
`stale-source-plugin-shadow`, `tilde-log-path`, dan `versioned-runtime-deps`. Dalam run agregat,
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` diperluas menjadi semua
skenario berbentuk isu yang dilaporkan, termasuk migrasi instalasi Plugin yang
dikonfigurasi.

Migrasi pembaruan penuh sengaja dipisahkan dari Full Release CI. Gunakan
workflow manual `Update Migration` ketika pertanyaan rilisnya adalah "apakah
setiap rilis stable terbitan dari 2026.4.23 dan seterusnya dapat memperbarui ke
kandidat ini dan membersihkan debris dependensi Plugin?":

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Package Acceptance

Package Acceptance adalah gate paket native GitHub. Workflow ini menyelesaikan
satu paket kandidat menjadi tarball `package-under-test`, mencatat versi dan
SHA-256, lalu menjalankan lane Docker E2E reusable terhadap tarball persis itu.
Ref harness workflow terpisah dari ref sumber paket, sehingga logika pengujian
saat ini dapat memvalidasi rilis tepercaya yang lebih lama.

Sumber kandidat:

- `source=npm`: validasi `openclaw@beta`, `openclaw@latest`, atau versi
  terbitan yang persis.
- `source=ref`: paketkan branch, tag, atau commit tepercaya dengan harness saat
  ini yang dipilih.
- `source=url`: validasi tarball HTTPS dengan `package_sha256` wajib.
- `source=artifact`: gunakan ulang tarball yang diunggah oleh run Actions lain.

Full Release Validation menggunakan `source=artifact` secara default, dibangun
dari SHA rilis terselesaikan. Untuk bukti pasca-publikasi, berikan
`package_acceptance_package_spec=openclaw@YYYY.M.D` agar matrix upgrade yang
sama menargetkan paket npm yang sudah dikirim.

Pemeriksaan rilis memanggil Package Acceptance dengan set package/update/restart/plugin:

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update
```

Ketika release soak diaktifkan, pemeriksaan juga meneruskan:

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Ini menjaga migrasi paket, perpindahan channel pembaruan, pembersihan dependensi
Plugin usang, cakupan Plugin offline, perilaku pembaruan Plugin, dan QA paket
Telegram pada artefak terselesaikan yang sama tanpa membuat gate paket rilis
default menyusuri setiap rilis terbitan.

`last-stable-4` diselesaikan menjadi empat rilis OpenClaw stable terbaru yang
diterbitkan di npm. Release package acceptance mem-pin `2026.4.23` sebagai batas
kompatibilitas pembaruan Plugin pertama, `2026.5.2` sebagai batas churn
arsitektur Plugin, dan `2026.4.15` sebagai baseline published-update 2026.4.1x
yang lebih lama; resolver melakukan dedupe pin yang sudah ada dalam empat
terbaru. Untuk cakupan migrasi published update yang menyeluruh, gunakan
`all-since-2026.4.23` di workflow Update Migration terpisah, bukan Full Release
CI. `release-history` tetap tersedia untuk sampling manual yang lebih luas
ketika Anda juga menginginkan anchor legacy sebelum tanggal tersebut.

Ketika beberapa baseline published-upgrade survivor dipilih, workflow Docker
reusable memecah setiap baseline menjadi job runner tertargetnya sendiri. Setiap
shard baseline tetap menjalankan set skenario yang dipilih, tetapi log dan
artefak tetap per-baseline dan wall time dibatasi oleh shard paling lambat,
bukan satu job serial besar.

Jalankan profil paket secara manual saat memvalidasi kandidat sebelum rilis:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=package \
  -f published_upgrade_survivor_baselines="last-stable-4 2026.4.23 2026.5.2 2026.4.15" \
  -f published_upgrade_survivor_scenarios=reported-issues \
  -f telegram_mode=mock-openai
```

Gunakan `suite_profile=product` ketika pertanyaan rilis mencakup channel MCP,
pembersihan cron/subagent, pencarian web OpenAI, atau OpenWebUI. Gunakan
`suite_profile=full` hanya ketika Anda membutuhkan cakupan jalur rilis Docker
penuh.

## Default rilis

Untuk kandidat rilis, stack bukti default adalah:

1. `pnpm check:changed` dan `pnpm test:changed` untuk regresi tingkat sumber.
2. `pnpm release:check` untuk integritas artefak paket.
3. Profil Package Acceptance `package` atau lane paket kustom release-check
   untuk kontrak install/update/restart/plugin.
4. Pemeriksaan rilis lintas OS untuk perilaku installer, onboarding, dan
   platform yang spesifik OS.
5. Suite live hanya ketika permukaan yang berubah menyentuh perilaku provider
   atau hosted-service.

Pada mesin maintainer, gate luas dan bukti produk Docker/paket sebaiknya
berjalan di Testbox kecuali secara eksplisit melakukan bukti lokal.

## Kompatibilitas legacy

Kelonggaran kompatibilitas sempit dan dibatasi waktu:

- Paket hingga `2026.4.25`, termasuk `2026.4.25-beta.*`, dapat menoleransi
  celah metadata paket yang sudah dikirim di Package Acceptance.
- Paket terbitan `2026.4.26` dapat memperingatkan untuk file stamp metadata
  build lokal yang sudah dikirim.
- Paket berikutnya harus memenuhi kontrak modern. Celah yang sama akan gagal,
  bukan memberi peringatan atau dilewati.

Jangan tambahkan migrasi startup baru untuk bentuk lama ini. Tambahkan atau
perluas perbaikan doctor, lalu buktikan dengan `upgrade-survivor`,
`published-upgrade-survivor`, atau `update-restart-auth` ketika perintah
pembaruan memiliki restart.

## Menambahkan cakupan

Saat mengubah perilaku pembaruan atau Plugin, tambahkan cakupan pada lapisan
terendah yang dapat gagal karena alasan yang tepat:

- Logika path atau metadata murni: unit test di samping sumber.
- Perilaku package inventory atau packed-file: pengujian
  `package-dist-inventory` atau pemeriksa tarball.
- Perilaku install/update CLI: assertion atau fixture lane Docker.
- Perilaku migrasi published-release: skenario `published-upgrade-survivor`.
- Perilaku restart milik update: `update-restart-auth`.
- Perilaku sumber registry/paket: fixture `test:docker:plugins` atau server
  fixture ClawHub.
- Perilaku tata letak atau pembersihan dependensi: assert eksekusi runtime dan
  batas filesystem. Dependensi npm dapat di-hoist di bawah root npm terkelola,
  jadi pengujian harus membuktikan bahwa root dipindai/dibersihkan, bukan
  mengasumsikan tree `node_modules` lokal paket.

Jaga fixture Docker baru tetap hermetic secara default. Gunakan registry fixture
lokal dan paket palsu kecuali inti pengujiannya adalah perilaku registry live.

## Triage kegagalan

Mulai dengan identitas artefak:

- Ringkasan Package Acceptance `resolve_package`: sumber, versi, SHA-256, dan
  nama artefak.
- Artefak Docker: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, log lane, dan perintah rerun.
- Ringkasan penyintas pemutakhiran: `.artifacts/upgrade-survivor/summary.json`,
  termasuk versi baseline, versi kandidat, skenario, waktu fase, dan
  langkah-langkah resep.

Lebih baik jalankan ulang lane persis yang gagal dengan artefak paket yang sama daripada
menjalankan ulang seluruh payung rilis.
