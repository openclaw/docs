---
read_when:
    - Mengubah perilaku pembaruan OpenClaw, doctor, penerimaan paket, atau pemasangan Plugin
    - Menyiapkan atau menyetujui kandidat rilis
    - Men-debug pembaruan paket, pembersihan dependensi Plugin, atau regresi pemasangan Plugin
sidebarTitle: Update and plugin tests
summary: Cara OpenClaw memvalidasi jalur pembaruan, migrasi paket, dan perilaku pemasangan/pembaruan Plugin
title: 'Pengujian: pembaruan dan Plugin'
x-i18n:
    generated_at: "2026-05-02T09:24:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: b1999106b52d2539a6ee0fd7cd88ebb3515c8726e080d4031d7bf421fb99de36
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Ini adalah daftar periksa khusus untuk validasi pembaruan dan Plugin. Tujuannya
sederhana: membuktikan bahwa paket yang dapat diinstal dapat memperbarui status
pengguna nyata, memperbaiki status lama yang usang melalui `doctor`, dan tetap
dapat menginstal, memuat, memperbarui, serta menghapus instalasi Plugin dari
sumber yang didukung.

Untuk peta runner pengujian yang lebih luas, lihat [Pengujian](/id/help/testing). Untuk kunci penyedia langsung
dan suite yang menyentuh jaringan, lihat [Pengujian langsung](/id/help/testing-live).

## Yang kita lindungi

Pengujian pembaruan dan Plugin melindungi kontrak berikut:

- Tarball paket lengkap, memiliki `dist/postinstall-inventory.json` yang valid,
  dan tidak bergantung pada file repo yang belum dikemas.
- Pengguna dapat berpindah dari paket terbitan lama ke paket kandidat
  tanpa kehilangan konfigurasi, agen, sesi, ruang kerja, daftar izin Plugin, atau
  konfigurasi kanal.
- `openclaw doctor --fix --non-interactive` memiliki jalur pembersihan dan perbaikan
  lama. Startup tidak boleh menambah migrasi kompatibilitas tersembunyi untuk status
  Plugin yang usang.
- Instalasi Plugin berfungsi dari direktori lokal, repo git, paket npm, dan jalur
  registri ClawHub.
- Dependensi npm Plugin diinstal di root npm terkelola, dipindai sebelum
  dipercaya, dan dihapus melalui npm saat penghapusan instalasi sehingga dependensi yang diangkat tidak
  tertinggal.
- Pembaruan Plugin stabil ketika tidak ada yang berubah: catatan instalasi, sumber
  yang diresolusikan, tata letak dependensi terinstal, dan status aktif tetap utuh.

## Bukti lokal selama pengembangan

Mulai dari yang sempit:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Untuk perubahan instalasi, penghapusan instalasi, dependensi, atau inventaris paket Plugin, jalankan juga
pengujian terfokus yang mencakup seam yang diedit:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Sebelum lane Docker paket apa pun menggunakan tarball, buktikan artefak paket:

```bash
pnpm release:check
```

`release:check` menjalankan pemeriksaan drift konfigurasi/dokumen/API, menulis inventaris dist paket,
menjalankan `npm pack --dry-run`, menolak file terkemas yang dilarang, menginstal
tarball ke prefix sementara, menjalankan postinstall, dan melakukan smoke test pada entrypoint kanal
terbundel.

## Lane Docker

Lane Docker adalah bukti tingkat produk. Lane ini menginstal atau memperbarui paket nyata
di dalam kontainer Linux dan menegaskan perilaku melalui perintah CLI,
startup Gateway, probe HTTP, status RPC, dan status sistem file.

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
  perilaku lewati pembaruan folder lokal, folder lokal dengan dependensi yang sudah terinstal,
  instalasi paket `file:`, instalasi git dengan eksekusi CLI, pembaruan ref bergerak git, instalasi registri npm dengan dependensi transitif
  yang diangkat, no-op pembaruan npm, instalasi fixture ClawHub lokal dan no-op pembaruan, perilaku pembaruan marketplace, serta aktivasi/inspeksi bundle Claude. Setel
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` agar blok ClawHub tetap hermetik/offline.
- `test:docker:plugin-update` memvalidasi bahwa Plugin terinstal yang tidak berubah
  tidak diinstal ulang atau kehilangan metadata instalasi selama `openclaw plugins update`.
- `test:docker:upgrade-survivor` menginstal tarball kandidat di atas fixture pengguna lama yang kotor,
  menjalankan pembaruan paket plus doctor non-interaktif, lalu memulai
  Gateway loopback dan memeriksa pelestarian status.
- `test:docker:published-upgrade-survivor` pertama-tama menginstal baseline terbitan,
  mengonfigurasinya melalui resep `openclaw config set` yang sudah dipanggang, memperbaruinya ke
  tarball kandidat, menjalankan doctor, memeriksa pembersihan lama, memulai Gateway, dan
  mem-probe `/healthz`, `/readyz`, serta status RPC.
- `test:docker:update-migration` adalah lane pembaruan terbitan yang berat pembersihan. Lane ini
  dimulai dari status pengguna bergaya Discord/Telegram yang sudah dikonfigurasi, menjalankan doctor baseline
  agar dependensi Plugin yang dikonfigurasi memiliki kesempatan untuk terwujud, menanam
  sisa dependensi Plugin lama untuk Plugin paket yang dikonfigurasi, memperbarui ke
  tarball kandidat, dan mewajibkan doctor pascapembaruan menghapus root dependensi
  lama.

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
`plugin-deps-cleanup`, `tilde-log-path`, dan `versioned-runtime-deps`. Dalam run agregat,
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` diperluas menjadi semua skenario
berbentuk isu yang dilaporkan.

Migrasi pembaruan penuh sengaja dipisahkan dari CI Rilis Penuh. Gunakan
workflow manual `Update Migration` saat pertanyaan rilisnya adalah "apakah setiap
rilis stabil terbitan sejak 2026.4.23 dan seterusnya dapat memperbarui ke kandidat ini dan
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

Penerimaan Paket adalah gate paket native GitHub. Ini meresolusikan satu paket
kandidat menjadi tarball `package-under-test`, mencatat versi dan SHA-256, lalu
menjalankan lane Docker E2E yang dapat digunakan ulang terhadap tarball persis tersebut. Ref harness workflow
terpisah dari ref sumber paket, sehingga logika pengujian saat ini dapat memvalidasi
rilis tepercaya yang lebih lama.

Sumber kandidat:

- `source=npm`: validasi `openclaw@beta`, `openclaw@latest`, atau versi terbitan
  yang persis.
- `source=ref`: kemas branch, tag, atau commit tepercaya dengan harness saat ini
  yang dipilih.
- `source=url`: validasi tarball HTTPS dengan `package_sha256` yang wajib.
- `source=artifact`: gunakan ulang tarball yang diunggah oleh run Actions lain.

Pemeriksaan rilis memanggil Penerimaan Paket dengan set paket/pembaruan/Plugin:

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update
```

Pemeriksaan itu juga meneruskan:

```text
published_upgrade_survivor_baselines=release-history
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Ini menjaga migrasi paket, peralihan kanal pembaruan, pembersihan dependensi Plugin
usang, cakupan Plugin offline, perilaku pembaruan Plugin, dan QA paket Telegram
pada artefak yang diresolusikan yang sama.

`release-history` adalah sampel pemeriksaan rilis terbatas: enam rilis stabil terbaru,
`2026.4.23`, dan satu anchor lama sebelum tanggal tersebut. Untuk cakupan migrasi pembaruan
terbitan yang menyeluruh, gunakan `all-since-2026.4.23` di workflow Update Migration
terpisah, bukan CI Rilis Penuh.

Jalankan profil paket secara manual saat memvalidasi kandidat sebelum rilis:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=package \
  -f published_upgrade_survivor_baselines=release-history \
  -f published_upgrade_survivor_scenarios=reported-issues \
  -f telegram_mode=mock-openai
```

Gunakan `suite_profile=product` saat pertanyaan rilis mencakup kanal MCP,
pembersihan cron/subagen, pencarian web OpenAI, atau OpenWebUI. Gunakan `suite_profile=full`
hanya saat Anda membutuhkan cakupan jalur rilis Docker penuh.

## Default rilis

Untuk kandidat rilis, stack bukti default adalah:

1. `pnpm check:changed` dan `pnpm test:changed` untuk regresi tingkat sumber.
2. `pnpm release:check` untuk integritas artefak paket.
3. Profil Penerimaan Paket `package` atau lane paket kustom pemeriksaan rilis
   untuk kontrak instalasi/pembaruan/Plugin.
4. Pemeriksaan rilis lintas OS untuk penginstal, onboarding, dan perilaku platform
   khusus OS.
5. Suite langsung hanya ketika surface yang berubah menyentuh perilaku penyedia atau layanan terhosting.

Pada mesin maintainer, gate luas dan bukti produk Docker/paket harus berjalan
di Testbox kecuali secara eksplisit melakukan bukti lokal.

## Kompatibilitas lama

Kelonggaran kompatibilitas sempit dan dibatasi waktu:

- Paket hingga `2026.4.25`, termasuk `2026.4.25-beta.*`, dapat menoleransi
  celah metadata paket yang sudah terkirim di Penerimaan Paket.
- Paket terbitan `2026.4.26` dapat memperingatkan untuk file stempel metadata build lokal
  yang sudah terkirim.
- Paket setelahnya harus memenuhi kontrak modern. Celah yang sama gagal, bukan
  memperingatkan atau dilewati.

Jangan menambahkan migrasi startup baru untuk bentuk lama ini. Tambahkan atau perluas perbaikan doctor,
lalu buktikan dengan `upgrade-survivor` atau `published-upgrade-survivor`.

## Menambah cakupan

Saat mengubah perilaku pembaruan atau Plugin, tambahkan cakupan pada lapisan terendah yang
dapat gagal karena alasan yang tepat:

- Logika path atau metadata murni: pengujian unit di samping sumber.
- Inventaris paket atau perilaku file terkemas: pengujian pemeriksa `package-dist-inventory` atau tarball.
- Perilaku instalasi/pembaruan CLI: asersi atau fixture lane Docker.
- Perilaku migrasi rilis terbitan: skenario `published-upgrade-survivor`.
- Perilaku sumber registri/paket: fixture `test:docker:plugins` atau server fixture ClawHub.
- Perilaku tata letak atau pembersihan dependensi: tegaskan eksekusi runtime dan batas
  sistem file. Dependensi npm dapat diangkat di bawah root npm terkelola, sehingga pengujian harus membuktikan bahwa root dipindai/dibersihkan, bukan mengasumsikan pohon
  `node_modules` lokal paket.

Jaga fixture Docker baru tetap hermetik secara default. Gunakan registri fixture lokal dan
paket palsu kecuali tujuan pengujiannya adalah perilaku registri langsung.

## Triage kegagalan

Mulai dengan identitas artefak:

- Ringkasan `resolve_package` Penerimaan Paket: sumber, versi, SHA-256, dan
  nama artefak.
- Artefak Docker: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, log lane, dan perintah rerun.
- Ringkasan upgrade survivor: `.artifacts/upgrade-survivor/summary.json`,
  termasuk versi baseline, versi kandidat, skenario, timing fase, dan
  langkah resep.

Lebih baik jalankan ulang lane persis yang gagal dengan artefak paket yang sama daripada
menjalankan ulang seluruh payung rilis.
