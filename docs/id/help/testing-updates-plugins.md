---
read_when:
    - Mengubah perilaku pembaruan OpenClaw, doctor, penerimaan paket, atau pemasangan plugin
    - Menyiapkan atau menyetujui kandidat rilis
    - Men-debug regresi pembaruan paket, pembersihan dependensi Plugin, atau instalasi Plugin
sidebarTitle: Update and plugin tests
summary: Cara OpenClaw memvalidasi jalur pembaruan, migrasi paket, dan perilaku instalasi/pembaruan Plugin
title: 'Pengujian: pembaruan dan Plugin'
x-i18n:
    generated_at: "2026-05-03T09:17:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 309ac7785a8d49db241989d28580887d3f6739982108af7148b624082c5f23dd
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Ini adalah daftar periksa khusus untuk validasi pembaruan dan Plugin. Tujuannya
sederhana: membuktikan bahwa paket yang dapat diinstal dapat memperbarui status
pengguna nyata, memperbaiki status warisan yang usang melalui `doctor`, dan tetap
dapat menginstal, memuat, memperbarui, serta menghapus Plugin dari sumber yang
didukung.

Untuk peta runner pengujian yang lebih luas, lihat [Pengujian](/id/help/testing). Untuk kunci penyedia langsung
dan suite yang menyentuh jaringan, lihat [Pengujian langsung](/id/help/testing-live).

## Yang kami lindungi

Pengujian pembaruan dan Plugin melindungi kontrak berikut:

- Tarball paket lengkap, memiliki `dist/postinstall-inventory.json` yang valid,
  dan tidak bergantung pada file repo yang belum dikemas.
- Pengguna dapat berpindah dari paket terbitan lama ke paket kandidat
  tanpa kehilangan konfigurasi, agen, sesi, workspace, daftar izin Plugin, atau
  konfigurasi channel.
- `openclaw doctor --fix --non-interactive` memiliki jalur pembersihan dan perbaikan
  warisan. Startup tidak boleh menambahkan migrasi kompatibilitas tersembunyi untuk status
  Plugin yang usang.
- Instalasi Plugin berfungsi dari direktori lokal, repo git, paket npm, dan jalur
  registri ClawHub.
- Dependensi npm Plugin diinstal di root npm terkelola, dipindai sebelum
  dipercaya, dan dihapus melalui npm saat uninstall agar dependensi hoisted tidak
  tertinggal.
- Pembaruan Plugin stabil ketika tidak ada yang berubah: catatan instalasi, sumber
  yang di-resolve, tata letak dependensi terinstal, dan status aktif tetap utuh.

## Pembuktian lokal selama pengembangan

Mulai secara sempit:

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

Sebelum lane Docker paket mana pun menggunakan tarball, buktikan artefak paket:

```bash
pnpm release:check
```

`release:check` menjalankan pemeriksaan drift konfigurasi/dokumen/API, menulis inventaris dist
paket, menjalankan `npm pack --dry-run`, menolak file terlarang yang terkema, menginstal
tarball ke prefix sementara, menjalankan postinstall, dan melakukan smoke pada entrypoint channel
bawaan.

## Lane Docker

Lane Docker adalah pembuktian tingkat produk. Lane ini menginstal atau memperbarui paket nyata
di dalam container Linux dan menegaskan perilaku melalui perintah CLI,
startup Gateway, probe HTTP, status RPC, dan status filesystem.

Gunakan lane terfokus saat iterasi:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-migration
```

Lane penting:

- `test:docker:plugins` memvalidasi smoke instalasi Plugin, instalasi folder lokal,
  perilaku lewati pembaruan folder lokal, folder lokal dengan dependensi yang sudah
  terinstal, instalasi paket `file:`, instalasi git dengan eksekusi CLI, pembaruan
  moving-ref git, instalasi registri npm dengan dependensi transitif hoisted,
  no-op pembaruan npm, instalasi fixture ClawHub lokal dan no-op pembaruan,
  perilaku pembaruan marketplace, serta enable/inspect bundle Claude. Setel
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` agar blok ClawHub tetap hermetik/offline.
- `test:docker:plugin-lifecycle-matrix` menginstal paket kandidat di container
  kosong, menjalankan Plugin npm melalui instalasi, inspect, disable, enable,
  upgrade eksplisit, downgrade eksplisit, dan uninstall setelah menghapus kode
  Plugin. Lane ini mencatat metrik RSS dan CPU untuk setiap fase.
- `test:docker:plugin-update` memvalidasi bahwa Plugin terinstal yang tidak berubah
  tidak diinstal ulang atau kehilangan metadata instalasi selama `openclaw plugins update`.
- `test:docker:upgrade-survivor` menginstal tarball kandidat di atas fixture
  pengguna lama yang kotor, menjalankan pembaruan paket plus doctor non-interaktif, lalu memulai
  Gateway loopback dan memeriksa pelestarian status.
- `test:docker:published-upgrade-survivor` terlebih dahulu menginstal baseline terbitan,
  mengonfigurasinya melalui resep `openclaw config set` yang sudah dipanggang, memperbaruinya ke
  tarball kandidat, menjalankan doctor, memeriksa pembersihan warisan, memulai Gateway, dan
  melakukan probe `/healthz`, `/readyz`, serta status RPC.
- `test:docker:update-migration` adalah lane pembaruan terbitan yang berat pembersihan. Lane ini
  dimulai dari status pengguna bergaya Discord/Telegram yang sudah dikonfigurasi, menjalankan
  doctor baseline agar dependensi Plugin terkonfigurasi punya kesempatan untuk terwujud, menanam
  sisa dependensi Plugin warisan untuk Plugin paket yang dikonfigurasi, memperbarui ke
  tarball kandidat, dan mewajibkan doctor pascapembaruan untuk menghapus root dependensi
  warisan.

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
`plugin-deps-cleanup`, `configured-plugin-installs`, `tilde-log-path`, dan
`versioned-runtime-deps`. Dalam run agregat,
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` diperluas menjadi semua skenario
berbentuk issue yang dilaporkan, termasuk migrasi instalasi Plugin terkonfigurasi.

Migrasi pembaruan penuh sengaja dipisahkan dari Full Release CI. Gunakan
workflow manual `Update Migration` ketika pertanyaan rilisnya adalah "bisakah setiap
rilis stabil terbitan dari 2026.4.23 dan seterusnya memperbarui ke kandidat ini dan
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

Package Acceptance adalah gate paket native GitHub. Gate ini me-resolve satu paket kandidat
menjadi tarball `package-under-test`, mencatat versi dan SHA-256, lalu
menjalankan lane Docker E2E reusable terhadap tarball persis tersebut. Ref harness workflow
terpisah dari ref sumber paket, sehingga logika pengujian saat ini dapat memvalidasi
rilis tepercaya yang lebih lama.

Sumber kandidat:

- `source=npm`: validasi `openclaw@beta`, `openclaw@latest`, atau versi
  terbitan persis.
- `source=ref`: kemas branch, tag, atau commit tepercaya dengan harness saat ini
  yang dipilih.
- `source=url`: validasi tarball HTTPS dengan `package_sha256` wajib.
- `source=artifact`: gunakan kembali tarball yang diunggah oleh run Actions lain.

Full Release Validation menggunakan `source=artifact` secara default, dibuat dari
SHA rilis yang di-resolve. Untuk pembuktian pascapublikasi, teruskan
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

Ini menjaga migrasi paket, perpindahan channel pembaruan, pembersihan dependensi
Plugin usang, cakupan Plugin offline, perilaku pembaruan Plugin, dan QA paket Telegram
pada artefak yang sama yang sudah di-resolve.

`all-since-2026.4.23` adalah sampel upgrade Full Release CI: setiap rilis stabil yang dipublikasikan ke npm dari `2026.4.23` hingga `latest`. Untuk cakupan migrasi pembaruan terbitan
yang menyeluruh, gunakan `all-since-2026.4.23` di workflow Update
Migration terpisah, bukan Full Release CI. `release-history` tetap
tersedia untuk sampling manual yang lebih luas ketika Anda juga menginginkan anchor warisan
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

Gunakan `suite_profile=product` ketika pertanyaan rilis mencakup channel MCP,
pembersihan cron/subagent, pencarian web OpenAI, atau OpenWebUI. Gunakan `suite_profile=full`
hanya ketika Anda memerlukan cakupan jalur rilis Docker penuh.

## Default rilis

Untuk kandidat rilis, stack pembuktian default adalah:

1. `pnpm check:changed` dan `pnpm test:changed` untuk regresi tingkat sumber.
2. `pnpm release:check` untuk integritas artefak paket.
3. Profil Package Acceptance `package` atau lane paket kustom release-check
   untuk kontrak instalasi/pembaruan/Plugin.
4. Pemeriksaan rilis lintas-OS untuk installer, onboarding, dan perilaku platform
   yang spesifik OS.
5. Suite langsung hanya ketika permukaan yang berubah menyentuh perilaku penyedia atau layanan
   terhosting.

Pada mesin maintainer, gate luas dan pembuktian produk Docker/paket harus berjalan
di Testbox kecuali secara eksplisit melakukan pembuktian lokal.

## Kompatibilitas warisan

Kelonggaran kompatibilitas bersifat sempit dan dibatasi waktu:

- Paket hingga `2026.4.25`, termasuk `2026.4.25-beta.*`, dapat menoleransi
  celah metadata paket yang sudah dikirim dalam Package Acceptance.
- Paket `2026.4.26` yang diterbitkan dapat memperingatkan untuk file stempel metadata build lokal
  yang sudah dikirim.
- Paket berikutnya harus memenuhi kontrak modern. Celah yang sama akan gagal, bukan
  memperingatkan atau dilewati.

Jangan menambahkan migrasi startup baru untuk bentuk lama ini. Tambahkan atau perluas perbaikan
doctor, lalu buktikan dengan `upgrade-survivor` atau `published-upgrade-survivor`.

## Menambahkan cakupan

Saat mengubah perilaku pembaruan atau Plugin, tambahkan cakupan pada lapisan terendah yang
dapat gagal karena alasan yang tepat:

- Logika path atau metadata murni: pengujian unit di samping sumber.
- Perilaku inventaris paket atau file yang dikemas: pengujian `package-dist-inventory` atau pemeriksa
  tarball.
- Perilaku instalasi/pembaruan CLI: assertion atau fixture lane Docker.
- Perilaku migrasi rilis terbitan: skenario `published-upgrade-survivor`.
- Perilaku sumber registri/paket: fixture `test:docker:plugins` atau server fixture
  ClawHub.
- Perilaku tata letak atau pembersihan dependensi: tegaskan eksekusi runtime dan batas
  filesystem. Dependensi npm dapat di-hoist di bawah root npm terkelola, jadi pengujian
  harus membuktikan bahwa root dipindai/dibersihkan, bukan mengasumsikan pohon `node_modules`
  lokal paket.

Jaga fixture Docker baru tetap hermetik secara default. Gunakan registri fixture lokal dan
paket palsu kecuali tujuan pengujian adalah perilaku registri langsung.

## Triage kegagalan

Mulai dengan identitas artefak:

- Ringkasan Package Acceptance `resolve_package`: sumber, versi, SHA-256, dan
  nama artefak.
- Artefak Docker: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, log lane, dan perintah rerun.
- Ringkasan upgrade survivor: `.artifacts/upgrade-survivor/summary.json`,
  termasuk versi baseline, versi kandidat, skenario, timing fase, dan
  langkah resep.

Lebih baik menjalankan ulang lane persis yang gagal dengan artefak paket yang sama daripada
menjalankan ulang seluruh payung rilis.
