---
read_when:
    - Mengubah perilaku pembaruan, doctor, penerimaan paket, atau instalasi Plugin OpenClaw
    - Menyiapkan atau menyetujui kandidat rilis
    - Pemecahan masalah regresi pembaruan paket, pembersihan dependensi Plugin, atau instalasi Plugin
sidebarTitle: Update and plugin tests
summary: Cara OpenClaw memvalidasi jalur pembaruan, migrasi paket, dan perilaku penginstalan/pembaruan Plugin
title: 'Pengujian: pembaruan dan Plugin'
x-i18n:
    generated_at: "2026-05-06T09:15:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: db3790bb8c6b952458342727f3e326f9610b4d8155889dfdadb143e3ef07aa46
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Ini adalah daftar periksa khusus untuk validasi pembaruan dan Plugin. Tujuannya
sederhana: membuktikan paket yang dapat dipasang dapat memperbarui state pengguna
nyata, memperbaiki state legacy yang usang melalui `doctor`, dan tetap dapat
memasang, memuat, memperbarui, serta menghapus Plugin dari sumber yang didukung.

Untuk peta runner pengujian yang lebih luas, lihat [Pengujian](/id/help/testing). Untuk kunci penyedia live
dan suite yang menyentuh jaringan, lihat [Pengujian live](/id/help/testing-live).

## Yang kami lindungi

Pengujian pembaruan dan Plugin melindungi kontrak berikut:

- Tarball paket lengkap, memiliki `dist/postinstall-inventory.json` yang valid,
  dan tidak bergantung pada file repo yang belum dipaketkan.
- Pengguna dapat berpindah dari paket terbitan lama ke paket kandidat
  tanpa kehilangan config, agent, session, workspace, allowlist Plugin, atau
  config channel.
- `openclaw doctor --fix --non-interactive` memiliki jalur pembersihan dan perbaikan
  legacy. Startup tidak boleh menumbuhkan migrasi kompatibilitas tersembunyi untuk state
  Plugin yang usang.
- Pemasangan Plugin berfungsi dari direktori lokal, repo git, paket npm, dan jalur
  registry ClawHub.
- Dependensi npm Plugin dipasang di root npm terkelola, dipindai sebelum
  dipercaya, dan dihapus melalui npm saat uninstall sehingga dependensi yang di-hoist tidak
  tertinggal.
- Pembaruan Plugin stabil ketika tidak ada yang berubah: catatan pemasangan, sumber
  yang diselesaikan, tata letak dependensi terpasang, dan state aktif tetap utuh.

## Bukti lokal selama pengembangan

Mulai dari yang sempit:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Untuk perubahan pemasangan, uninstall, dependensi, atau inventaris paket Plugin, jalankan juga
pengujian terfokus yang mencakup seam yang diedit:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Sebelum lane Docker paket apa pun memakai tarball, buktikan artefak paket:

```bash
pnpm release:check
```

`release:check` menjalankan pemeriksaan drift config/dokumen/API, menulis inventaris dist
paket, menjalankan `npm pack --dry-run`, menolak file terpaket yang dilarang, memasang
tarball ke prefix sementara, menjalankan postinstall, dan melakukan smoke pada entrypoint channel
bawaan.

## Lane Docker

Lane Docker adalah bukti tingkat produk. Lane ini memasang atau memperbarui paket nyata
di dalam container Linux dan menegaskan perilaku melalui perintah CLI,
startup Gateway, probe HTTP, status RPC, dan state filesystem.

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

- `test:docker:plugins` memvalidasi smoke pemasangan Plugin, pemasangan folder lokal,
  perilaku skip pembaruan folder lokal, folder lokal dengan dependensi yang sudah terpasang,
  pemasangan paket `file:`, pemasangan git dengan eksekusi CLI, pembaruan ref bergerak git,
  pemasangan registry npm dengan dependensi transitif yang di-hoist,
  no-op pembaruan npm, pemasangan fixture ClawHub lokal dan no-op pembaruan,
  perilaku pembaruan marketplace, serta enable/inspect bundle Claude. Setel
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` agar blok ClawHub tetap hermetik/offline.
- `test:docker:plugin-lifecycle-matrix` memasang paket kandidat di container kosong,
  menjalankan Plugin npm melalui install, inspect, disable, enable,
  upgrade eksplisit, downgrade eksplisit, dan uninstall setelah menghapus kode Plugin.
  Lane ini mencatat metrik RSS dan CPU untuk setiap fase.
- `test:docker:plugin-update` memvalidasi bahwa Plugin terpasang yang tidak berubah
  tidak dipasang ulang atau kehilangan metadata pemasangan selama `openclaw plugins update`.
- `test:docker:upgrade-survivor` memasang tarball kandidat di atas fixture pengguna lama
  yang kotor, menjalankan pembaruan paket plus doctor noninteraktif, lalu memulai
  Gateway loopback dan memeriksa preservasi state.
- `test:docker:published-upgrade-survivor` pertama memasang baseline yang sudah diterbitkan,
  mengonfigurasinya melalui resep `openclaw config set` yang sudah dipanggang, memperbaruinya ke
  tarball kandidat, menjalankan doctor, memeriksa pembersihan legacy, memulai Gateway, dan
  mem-probe `/healthz`, `/readyz`, dan status RPC.
- `test:docker:update-restart-auth` memasang paket kandidat, memulai Gateway token-auth
  terkelola, menghapus env auth Gateway pemanggil untuk
  `openclaw update --yes --json`, dan mengharuskan perintah pembaruan kandidat
  me-restart Gateway sebelum probe normal.
- `test:docker:update-migration` adalah lane pembaruan terbitan yang berat pada pembersihan. Lane ini
  dimulai dari state pengguna bergaya Discord/Telegram yang terkonfigurasi, menjalankan doctor
  baseline agar dependensi Plugin terkonfigurasi punya kesempatan terwujud, menanam
  sisa dependensi Plugin legacy untuk Plugin terpaket yang terkonfigurasi, memperbarui ke
  tarball kandidat, dan mengharuskan doctor pascapembaruan menghapus root dependensi
  legacy.

Varian survivor pembaruan terbitan yang berguna:

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
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` diperluas menjadi semua skenario
berbentuk issue yang dilaporkan, termasuk migrasi pemasangan Plugin terkonfigurasi.

Migrasi pembaruan penuh sengaja dipisahkan dari CI Rilis Penuh. Gunakan workflow
manual `Update Migration` ketika pertanyaan rilisnya adalah "bisakah setiap
rilis stabil yang diterbitkan dari 2026.4.23 dan seterusnya diperbarui ke kandidat ini dan
membersihkan sisa dependensi Plugin?":

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Penerimaan Paket

Penerimaan Paket adalah gate paket native GitHub. Gate ini menyelesaikan satu paket
kandidat menjadi tarball `package-under-test`, mencatat versi dan SHA-256, lalu
menjalankan lane Docker E2E reusable terhadap tarball tepat tersebut. Ref harness workflow
terpisah dari ref sumber paket, sehingga logika pengujian saat ini dapat memvalidasi
rilis tepercaya yang lebih lama.

Sumber kandidat:

- `source=npm`: validasi `openclaw@beta`, `openclaw@latest`, atau versi
  terbitan yang tepat.
- `source=ref`: kemas branch, tag, atau commit tepercaya dengan harness saat ini
  yang dipilih.
- `source=url`: validasi tarball HTTPS dengan `package_sha256` wajib.
- `source=artifact`: gunakan ulang tarball yang diunggah oleh run Actions lain.

Validasi Rilis Penuh menggunakan `source=artifact` secara default, dibuat dari SHA rilis
yang diselesaikan. Untuk bukti pascapenerbitan, teruskan
`package_acceptance_package_spec=openclaw@YYYY.M.D` agar matriks upgrade yang sama
menargetkan paket npm yang sudah dikirim sebagai gantinya.

Pemeriksaan rilis memanggil Penerimaan Paket dengan set package/update/restart/Plugin:

```text
doctor-switch update-channel-switch update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update
```

Ketika soak rilis diaktifkan, pemeriksaan juga meneruskan:

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Ini menjaga migrasi paket, pengalihan channel pembaruan, toleransi Plugin terkelola
yang korup, pembersihan dependensi Plugin usang, cakupan Plugin offline, perilaku
pembaruan Plugin, dan QA paket Telegram pada artefak terselesaikan yang sama tanpa
membuat gate paket rilis default menelusuri setiap rilis terbitan.

`last-stable-4` diselesaikan menjadi empat rilis stabil OpenClaw terbaru yang diterbitkan di npm.
Penerimaan paket rilis mem-pin `2026.4.23` sebagai batas kompatibilitas pembaruan Plugin
pertama, `2026.5.2` sebagai batas churn arsitektur Plugin, dan
`2026.4.15` sebagai baseline pembaruan terbitan 2026.4.1x yang lebih lama; resolver
menghapus duplikasi pin yang sudah ada dalam empat terbaru. Untuk cakupan migrasi pembaruan
terbitan yang menyeluruh, gunakan `all-since-2026.4.23` di workflow Migrasi Pembaruan
terpisah, bukan CI Rilis Penuh. `release-history` tetap
tersedia untuk sampling manual yang lebih luas ketika Anda juga menginginkan anchor pra-tanggal
legacy.

Ketika beberapa baseline survivor pembaruan terbitan dipilih, workflow Docker reusable
memecah setiap baseline ke job runner tertargetnya sendiri. Setiap shard
baseline tetap menjalankan set skenario yang dipilih, tetapi log dan artefak tetap
per baseline dan waktu dinding dibatasi oleh shard paling lambat, bukan satu job serial
besar.

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
pembersihan cron/subagent, pencarian web OpenAI, atau OpenWebUI. Gunakan `suite_profile=full`
hanya ketika Anda membutuhkan cakupan jalur rilis Docker penuh.

## Default rilis

Untuk kandidat rilis, stack bukti default adalah:

1. `pnpm check:changed` dan `pnpm test:changed` untuk regresi tingkat sumber.
2. `pnpm release:check` untuk integritas artefak paket.
3. Profil Penerimaan Paket `package` atau lane paket kustom release-check
   untuk kontrak install/update/restart/Plugin.
4. Pemeriksaan rilis lintas-OS untuk installer, onboarding, dan perilaku platform
   spesifik OS.
5. Suite live hanya ketika surface yang berubah menyentuh perilaku penyedia atau hosted-service.

Di mesin maintainer, gate luas dan bukti produk Docker/paket sebaiknya berjalan
di Testbox kecuali secara eksplisit melakukan bukti lokal.

## Kompatibilitas legacy

Kelonggaran kompatibilitas sempit dan berbatas waktu:

- Paket hingga `2026.4.25`, termasuk `2026.4.25-beta.*`, boleh menoleransi
  celah metadata paket yang sudah dikirim dalam Penerimaan Paket.
- Paket `2026.4.26` yang diterbitkan boleh memberi peringatan untuk file stamp metadata build lokal
  yang sudah dikirim.
- Paket yang lebih baru harus memenuhi kontrak modern. Celah yang sama gagal, bukan
  memberi peringatan atau dilewati.

Jangan tambahkan migrasi startup baru untuk bentuk lama ini. Tambahkan atau perluas perbaikan
doctor, lalu buktikan dengan `upgrade-survivor`, `published-upgrade-survivor`, atau
`update-restart-auth` ketika perintah pembaruan memiliki restart.

## Menambahkan cakupan

Saat mengubah perilaku pembaruan atau Plugin, tambahkan cakupan pada lapisan terendah yang
dapat gagal karena alasan yang tepat:

- Logika path atau metadata murni: unit test di sebelah sumber.
- Inventaris paket atau perilaku file terpaket: `package-dist-inventory` atau pengujian checker
  tarball.
- Perilaku install/update CLI: assertion atau fixture lane Docker.
- Perilaku migrasi rilis terbitan: skenario `published-upgrade-survivor`.
- Perilaku restart milik pembaruan: `update-restart-auth`.
- Perilaku registry/sumber paket: fixture `test:docker:plugins` atau server fixture ClawHub.
- Perilaku tata letak atau pembersihan dependensi: tegaskan baik eksekusi runtime maupun
  batas filesystem. Dependensi npm dapat di-hoist di bawah root npm terkelola,
  jadi pengujian harus membuktikan root dipindai/dibersihkan, bukan mengasumsikan tree
  `node_modules` lokal paket.

Jaga fixture Docker baru tetap hermetik secara default. Gunakan registry fixture lokal dan
paket palsu kecuali titik pengujiannya adalah perilaku registry live.

## Triage kegagalan

Mulai dengan identitas artefak:

- Ringkasan Penerimaan Paket `resolve_package`: sumber, versi, SHA-256, dan
  nama artefak.
- Artefak Docker: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, log jalur, dan perintah menjalankan ulang.
- Ringkasan penyintas peningkatan: `.artifacts/upgrade-survivor/summary.json`,
  termasuk versi dasar, versi kandidat, skenario, waktu fase, dan
  langkah resep.

Lebih baik jalankan ulang jalur persis yang gagal dengan artefak paket yang sama daripada
menjalankan ulang seluruh payung rilis.
