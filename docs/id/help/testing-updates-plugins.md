---
read_when:
    - Mengubah perilaku pembaruan OpenClaw, doctor, package acceptance, atau pemasangan Plugin
    - Menyiapkan atau menyetujui kandidat rilis
    - Men-debug pembaruan paket, pembersihan dependensi Plugin, atau regresi instalasi Plugin
sidebarTitle: Update and plugin tests
summary: Cara OpenClaw memvalidasi jalur pembaruan, migrasi paket, dan perilaku pemasangan/pembaruan Plugin
title: 'Pengujian: pembaruan dan Plugin'
x-i18n:
    generated_at: "2026-05-02T20:46:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1a56e249f565cc23a439142b3332c0a57fd4afe9021b79f644d353946d6d2ffc
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Ini adalah daftar periksa khusus untuk validasi pembaruan dan Plugin. Tujuannya
sederhana: membuktikan bahwa paket yang dapat diinstal bisa memperbarui status
pengguna nyata, memperbaiki status lama yang usang melalui `doctor`, dan tetap
menginstal, memuat, memperbarui, serta menghapus instalasi Plugin dari sumber
yang didukung.

Untuk peta runner pengujian yang lebih luas, lihat [Pengujian](/id/help/testing). Untuk kunci penyedia live
dan rangkaian yang menyentuh jaringan, lihat [Pengujian live](/id/help/testing-live).

## Yang kami lindungi

Pengujian pembaruan dan Plugin melindungi kontrak berikut:

- Tarball paket lengkap, memiliki `dist/postinstall-inventory.json` yang valid,
  dan tidak bergantung pada file repo yang belum dibongkar.
- Pengguna dapat berpindah dari paket terbitan lama ke paket kandidat
  tanpa kehilangan konfigurasi, agen, sesi, workspace, allowlist Plugin, atau
  konfigurasi channel.
- `openclaw doctor --fix --non-interactive` memiliki jalur pembersihan dan perbaikan
  lama. Startup tidak boleh menambah migrasi kompatibilitas tersembunyi untuk status
  Plugin yang usang.
- Instalasi Plugin berfungsi dari direktori lokal, repo git, paket npm, dan jalur
  registri ClawHub.
- Dependensi npm Plugin diinstal di root npm terkelola, dipindai sebelum
  trust, dan dihapus melalui npm saat uninstall agar dependensi yang di-hoist tidak
  tersisa.
- Pembaruan Plugin stabil saat tidak ada yang berubah: catatan instalasi, sumber
  yang di-resolve, tata letak dependensi terinstal, dan status aktif tetap utuh.

## Bukti lokal selama pengembangan

Mulai dengan cakupan sempit:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Untuk perubahan instalasi, uninstall, dependensi, atau inventaris paket Plugin, jalankan juga
pengujian terfokus yang mencakup seam yang diedit:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Sebelum lane Docker paket memakai tarball, buktikan artefak paket:

```bash
pnpm release:check
```

`release:check` menjalankan pemeriksaan drift konfigurasi/dokumen/API, menulis inventaris dist
paket, menjalankan `npm pack --dry-run`, menolak file terpaket yang dilarang, menginstal
tarball ke prefix sementara, menjalankan postinstall, dan smoke test entrypoint channel
bundel.

## Lane Docker

Lane Docker adalah bukti tingkat produk. Lane ini menginstal atau memperbarui paket nyata
di dalam container Linux dan menegaskan perilaku melalui perintah CLI,
startup Gateway, probe HTTP, status RPC, dan status filesystem.

Gunakan lane terfokus saat iterasi:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-migration
```

Lane penting:

- `test:docker:plugins` memvalidasi smoke instalasi Plugin, instalasi folder lokal,
  perilaku skip pembaruan folder lokal, folder lokal dengan dependensi yang sudah
  terinstal, instalasi paket `file:`, instalasi git dengan eksekusi CLI, pembaruan
  moving-ref git, instalasi registri npm dengan dependensi transitif yang di-hoist,
  no-op pembaruan npm, instalasi fixture ClawHub lokal dan no-op pembaruan,
  perilaku pembaruan marketplace, serta enable/inspect bundle Claude. Setel
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` agar blok ClawHub tetap hermetik/offline.
- `test:docker:plugin-update` memvalidasi bahwa Plugin terinstal yang tidak berubah
  tidak diinstal ulang atau kehilangan metadata instalasi selama `openclaw plugins update`.
- `test:docker:upgrade-survivor` menginstal tarball kandidat di atas fixture pengguna lama
  yang kotor, menjalankan pembaruan paket plus doctor noninteraktif, lalu memulai
  Gateway loopback dan memeriksa preservasi status.
- `test:docker:published-upgrade-survivor` pertama-tama menginstal baseline terbitan,
  mengonfigurasinya melalui resep `openclaw config set` yang sudah dipanggang, memperbaruinya ke
  tarball kandidat, menjalankan doctor, memeriksa pembersihan legacy, memulai Gateway, dan
  mem-probe `/healthz`, `/readyz`, serta status RPC.
- `test:docker:update-migration` adalah lane pembaruan terbitan yang berat pembersihan. Lane ini
  dimulai dari status pengguna bergaya Discord/Telegram yang sudah dikonfigurasi, menjalankan doctor
  baseline agar dependensi Plugin terkonfigurasi punya kesempatan untuk muncul, menanam
  sisa dependensi Plugin legacy untuk Plugin paket yang terkonfigurasi, memperbarui ke
  tarball kandidat, dan mengharuskan doctor pascapembaruan menghapus root dependensi
  legacy.

Varian upgrade survivor terbitan yang berguna:

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

Skenario yang tersedia adalah `base`, `feishu-channel`, `bootstrap-persona`,
`plugin-deps-cleanup`, `configured-plugin-installs`, `tilde-log-path`, dan
`versioned-runtime-deps`. Dalam run agregat,
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` diperluas menjadi semua skenario
berbentuk issue yang dilaporkan, termasuk migrasi instalasi Plugin terkonfigurasi.

Migrasi pembaruan penuh sengaja dipisahkan dari Full Release CI. Gunakan workflow
manual `Update Migration` saat pertanyaan rilisnya adalah "bisakah setiap
rilis stabil terbitan dari 2026.4.23 dan seterusnya diperbarui ke kandidat ini dan
membersihkan sisa dependensi Plugin?":

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Package Acceptance

Package Acceptance adalah gate paket native GitHub. Ini me-resolve satu paket kandidat
menjadi tarball `package-under-test`, mencatat versi dan SHA-256, lalu
menjalankan lane Docker E2E yang dapat digunakan ulang terhadap tarball persis tersebut. Ref harness
workflow terpisah dari ref sumber paket, sehingga logika pengujian saat ini dapat memvalidasi
rilis tepercaya yang lebih lama.

Sumber kandidat:

- `source=npm`: validasi `openclaw@beta`, `openclaw@latest`, atau versi
  terbitan yang persis.
- `source=ref`: pack branch, tag, atau commit tepercaya dengan harness saat ini
  yang dipilih.
- `source=url`: validasi tarball HTTPS dengan `package_sha256` yang wajib.
- `source=artifact`: gunakan ulang tarball yang diunggah oleh run Actions lain.

Full Release Validation menggunakan `source=artifact` secara default, dibangun dari
SHA rilis yang di-resolve. Untuk bukti pascapublikasi, teruskan
`package_acceptance_package_spec=openclaw@YYYY.M.D` agar matriks upgrade yang sama
menargetkan paket npm yang sudah dikirim.

Pemeriksaan rilis memanggil Package Acceptance dengan set paket/pembaruan/Plugin:

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update
```

Pemeriksaan itu juga meneruskan:

```text
published_upgrade_survivor_baselines=all-since-2026.4.23
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Ini menjaga migrasi paket, peralihan channel pembaruan, pembersihan dependensi Plugin
usang, cakupan Plugin offline, perilaku pembaruan Plugin, dan QA paket Telegram
pada artefak resolved yang sama.

`all-since-2026.4.23` adalah sampel upgrade Full Release CI: setiap rilis stabil yang diterbitkan npm dari `2026.4.23` hingga `latest`. Untuk cakupan migrasi pembaruan
terbitan yang menyeluruh, gunakan `all-since-2026.4.23` dalam workflow Update
Migration terpisah, bukan Full Release CI. `release-history` tetap
tersedia untuk sampling manual yang lebih luas saat Anda juga menginginkan anchor legacy
pra-tanggal.

Jalankan profil paket secara manual saat memvalidasi kandidat sebelum rilis:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=package \
  -f published_upgrade_survivor_baselines=all-since-2026.4.23 \
  -f published_upgrade_survivor_scenarios=reported-issues \
  -f telegram_mode=mock-openai
```

Gunakan `suite_profile=product` saat pertanyaan rilis mencakup channel MCP,
pembersihan cron/subagen, pencarian web OpenAI, atau OpenWebUI. Gunakan `suite_profile=full`
hanya saat Anda memerlukan cakupan jalur rilis Docker penuh.

## Default rilis

Untuk kandidat rilis, stack bukti default adalah:

1. `pnpm check:changed` dan `pnpm test:changed` untuk regresi tingkat sumber.
2. `pnpm release:check` untuk integritas artefak paket.
3. Profil Package Acceptance `package` atau lane paket kustom release-check
   untuk kontrak instalasi/pembaruan/Plugin.
4. Pemeriksaan rilis lintas OS untuk installer, onboarding, dan perilaku platform
   khusus OS.
5. Rangkaian live hanya saat permukaan yang berubah menyentuh perilaku penyedia atau layanan
   hosted.

Di mesin maintainer, gate luas dan bukti produk Docker/paket harus berjalan
di Testbox kecuali secara eksplisit melakukan bukti lokal.

## Kompatibilitas legacy

Kelonggaran kompatibilitas sempit dan dibatasi waktu:

- Paket hingga `2026.4.25`, termasuk `2026.4.25-beta.*`, boleh menoleransi
  celah metadata paket yang sudah dikirim dalam Package Acceptance.
- Paket `2026.4.26` yang diterbitkan boleh memberi peringatan untuk file stamp metadata build lokal
  yang sudah dikirim.
- Paket setelahnya harus memenuhi kontrak modern. Celah yang sama gagal, bukan
  diperingatkan atau dilewati.

Jangan menambahkan migrasi startup baru untuk bentuk lama ini. Tambahkan atau perluas perbaikan
doctor, lalu buktikan dengan `upgrade-survivor` atau `published-upgrade-survivor`.

## Menambah cakupan

Saat mengubah perilaku pembaruan atau Plugin, tambahkan cakupan pada lapisan terendah yang
bisa gagal karena alasan yang tepat:

- Logika path atau metadata murni: pengujian unit di samping sumber.
- Inventaris paket atau perilaku file terpaket: pengujian `package-dist-inventory` atau checker
  tarball.
- Perilaku instalasi/pembaruan CLI: assertion atau fixture lane Docker.
- Perilaku migrasi rilis terbitan: skenario `published-upgrade-survivor`.
- Perilaku sumber registri/paket: fixture `test:docker:plugins` atau server fixture
  ClawHub.
- Perilaku tata letak atau pembersihan dependensi: tegaskan eksekusi runtime dan batas
  filesystem. Dependensi npm dapat di-hoist di bawah root npm terkelola, jadi pengujian harus membuktikan root tersebut dipindai/dibersihkan alih-alih mengasumsikan tree
  `node_modules` lokal paket.

Jaga fixture Docker baru tetap hermetik secara default. Gunakan registri fixture lokal dan
paket palsu kecuali tujuan pengujian adalah perilaku registri live.

## Triase kegagalan

Mulai dari identitas artefak:

- Ringkasan `resolve_package` Package Acceptance: sumber, versi, SHA-256, dan
  nama artefak.
- Artefak Docker: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, log lane, dan perintah rerun.
- Ringkasan upgrade survivor: `.artifacts/upgrade-survivor/summary.json`,
  termasuk versi baseline, versi kandidat, skenario, timing fase, dan
  langkah resep.

Utamakan menjalankan ulang lane persis yang gagal dengan artefak paket yang sama daripada
menjalankan ulang seluruh payung rilis.
