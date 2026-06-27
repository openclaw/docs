---
read_when:
    - Mengubah perilaku pembaruan, doctor, penerimaan paket, atau pemasangan plugin OpenClaw
    - Menyiapkan atau menyetujui kandidat rilis
    - Pemecahan masalah pembaruan paket, pembersihan dependensi Plugin, atau regresi instalasi Plugin
sidebarTitle: Update and plugin tests
summary: Bagaimana OpenClaw memvalidasi jalur pembaruan, migrasi paket, dan perilaku instalasi/pembaruan plugin
title: 'Pengujian: pembaruan dan Plugin'
x-i18n:
    generated_at: "2026-06-27T17:36:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9be94eab4be97c53022bdac3110da74a61cfa23db989964c803497305e5415db
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Ini adalah checklist khusus untuk validasi pembaruan dan plugin. Tujuannya
sederhana: membuktikan bahwa paket yang dapat diinstal bisa memperbarui status
pengguna nyata, memperbaiki status legacy yang usang melalui `doctor`, dan tetap
dapat menginstal, memuat, memperbarui, serta menghapus plugin dari sumber yang
didukung.

Untuk peta test runner yang lebih luas, lihat [Pengujian](/id/help/testing). Untuk
kunci penyedia live dan suite yang menyentuh jaringan, lihat [Pengujian live](/id/help/testing-live).

## Yang kita lindungi

Pengujian pembaruan dan plugin melindungi kontrak berikut:

- Tarball paket lengkap, memiliki `dist/postinstall-inventory.json` yang valid,
  dan tidak bergantung pada file repo yang belum dipaketkan.
- Pengguna dapat berpindah dari paket terbitan lama ke paket kandidat tanpa
  kehilangan konfigurasi, agen, sesi, workspace, allowlist plugin, atau
  konfigurasi channel.
- `openclaw doctor --fix --non-interactive` memiliki jalur pembersihan dan
  perbaikan legacy. Startup tidak boleh menambah migrasi kompatibilitas
  tersembunyi untuk status plugin yang usang.
- Instalasi plugin berfungsi dari direktori lokal, repo git, paket npm, dan
  jalur registri ClawHub.
- Dependensi npm plugin diinstal dalam satu proyek npm terkelola per plugin,
  dipindai sebelum dipercaya, dan dihapus melalui npm saat uninstall agar
  dependensi yang di-hoist tidak tertinggal.
- Pembaruan plugin stabil ketika tidak ada yang berubah: catatan instalasi,
  sumber yang diselesaikan, tata letak dependensi terinstal, dan status aktif
  tetap utuh.

## Pembuktian lokal selama pengembangan

Mulai dari cakupan sempit:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Untuk perubahan instalasi plugin, uninstall, dependensi, atau inventaris paket,
jalankan juga pengujian terfokus yang mencakup seam yang diedit:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Sebelum lane Docker paket mana pun menggunakan tarball, buktikan artefak paket:

```bash
pnpm release:check
```

`release:check` menjalankan pemeriksaan drift konfigurasi/dokumentasi/API,
menulis inventaris dist paket, menjalankan `npm pack --dry-run`, menolak file
terlarang yang ikut dipaketkan, menginstal tarball ke prefix sementara,
menjalankan postinstall, dan melakukan smoke test pada entrypoint channel
bawaan.

## Lane Docker

Lane Docker adalah pembuktian tingkat produk. Lane ini menginstal atau
memperbarui paket nyata di dalam container Linux dan memverifikasi perilaku
melalui perintah CLI, startup Gateway, probe HTTP, status RPC, dan status
filesystem.

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

- `test:docker:plugins` memvalidasi smoke test instalasi plugin, instalasi
  folder lokal, perilaku skip pembaruan folder lokal, folder lokal dengan
  dependensi yang sudah terinstal, instalasi paket `file:`, instalasi git dengan
  eksekusi CLI, pembaruan moving-ref git, instalasi registri npm dengan
  dependensi transitif yang di-hoist, no-op pembaruan npm, penolakan metadata
  paket npm yang malformed, instalasi fixture ClawHub lokal dan no-op pembaruan,
  perilaku pembaruan marketplace, serta enable/inspect bundle Claude. Atur
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` untuk menjaga blok ClawHub hermetik/offline.
- `test:docker:plugin-lifecycle-matrix` menginstal paket kandidat dalam
  container kosong, menjalankan plugin npm melalui install, inspect, disable,
  enable, upgrade eksplisit, downgrade eksplisit, dan uninstall setelah menghapus
  kode plugin. Lane ini mencatat metrik RSS dan CPU untuk setiap fase.
- `test:docker:plugin-update` memvalidasi bahwa plugin terinstal yang tidak
  berubah tidak diinstal ulang atau kehilangan metadata instalasi selama
  `openclaw plugins update`.
- `test:docker:upgrade-survivor` menginstal tarball kandidat di atas fixture
  pengguna lama yang kotor, menjalankan pembaruan paket plus doctor
  non-interaktif, lalu memulai Gateway loopback dan memeriksa pelestarian status.
- `test:docker:published-upgrade-survivor` pertama menginstal baseline yang
  sudah diterbitkan, mengonfigurasinya melalui resep `openclaw config set` yang
  sudah dipanggang, memperbaruinya ke tarball kandidat, menjalankan doctor,
  memeriksa pembersihan legacy, memulai Gateway, dan mem-probe `/healthz`,
  `/readyz`, serta status RPC.
- `test:docker:update-restart-auth` menginstal paket kandidat, memulai Gateway
  token-auth terkelola, menghapus env auth gateway pemanggil untuk
  `openclaw update --yes --json`, dan mewajibkan perintah pembaruan kandidat
  me-restart Gateway sebelum probe normal.
- `test:docker:update-migration` adalah lane pembaruan-terbitan yang berat pada
  pembersihan. Lane ini dimulai dari status pengguna bergaya Discord/Telegram
  yang sudah dikonfigurasi, menjalankan doctor baseline agar dependensi plugin
  yang dikonfigurasi punya kesempatan untuk terwujud, menanam sisa dependensi
  plugin legacy untuk plugin paket yang dikonfigurasi, memperbarui ke tarball
  kandidat, dan mewajibkan doctor pasca-pembaruan menghapus root dependensi
  legacy.

Varian survivor pembaruan-terbitan yang berguna:

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
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` diekspansi ke semua
skenario berbentuk isu yang dilaporkan, termasuk migrasi instalasi plugin yang
dikonfigurasi.

Migrasi pembaruan penuh sengaja dipisahkan dari CI Rilis Penuh. Gunakan workflow
manual `Update Migration` ketika pertanyaan rilisnya adalah "bisakah setiap
rilis stabil yang diterbitkan sejak 2026.4.23 memperbarui ke kandidat ini dan
membersihkan sisa dependensi plugin?":

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Package Acceptance

Package Acceptance adalah gate paket native GitHub. Gate ini menyelesaikan satu
paket kandidat menjadi tarball `package-under-test`, mencatat versi dan SHA-256,
lalu menjalankan lane E2E Docker reusable terhadap tarball persis tersebut. Ref
harness workflow terpisah dari ref sumber paket, sehingga logika pengujian
terkini dapat memvalidasi rilis tepercaya yang lebih lama.

Sumber kandidat:

- `source=npm`: validasi `openclaw@beta`, `openclaw@latest`, atau versi terbitan
  yang persis.
- `source=ref`: kemas branch, tag, atau commit tepercaya dengan harness terkini
  yang dipilih.
- `source=url`: validasi tarball HTTPS publik dengan `package_sha256` wajib.
  Jalur ini menolak kredensial URL, port HTTPS non-default, hostname atau hasil
  DNS/IP privat/internal, ruang IP penggunaan khusus, dan redirect yang tidak
  aman.
- `source=trusted-url`: validasi tarball HTTPS dengan `package_sha256` dan
  `trusted_source_id` wajib terhadap kebijakan milik maintainer di
  `.github/package-trusted-sources.json`. Gunakan ini untuk mirror
  enterprise/privat alih-alih melemahkan `source=url` dengan switch
  allow-private tingkat input. Auth Bearer, ketika dikonfigurasi oleh kebijakan,
  menggunakan secret tetap `OPENCLAW_TRUSTED_PACKAGE_TOKEN`.
- `source=artifact`: gunakan kembali tarball yang diunggah oleh run Actions lain.

Validasi Rilis Penuh menggunakan `source=artifact` secara default, yang dibangun
dari SHA rilis yang diselesaikan. Untuk pembuktian pasca-terbit, teruskan
`package_acceptance_package_spec=openclaw@YYYY.M.PATCH` agar matriks upgrade yang
sama menargetkan paket npm yang sudah dikirim sebagai gantinya.

Pemeriksaan rilis memanggil Package Acceptance dengan set paket/pembaruan/restart/plugin:

```text
doctor-switch update-channel-switch update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update
```

Ketika soak rilis diaktifkan, pemeriksaan itu juga meneruskan:

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Ini menjaga migrasi paket, perpindahan channel pembaruan, toleransi plugin
terkelola yang rusak, pembersihan dependensi plugin usang, cakupan plugin
offline, perilaku pembaruan plugin, dan QA paket Telegram pada artefak yang sama
yang sudah diselesaikan tanpa membuat gate paket rilis default menelusuri setiap
rilis yang telah diterbitkan.

`last-stable-4` diselesaikan ke empat rilis stabil OpenClaw terbaru yang
diterbitkan di npm. Package acceptance rilis mem-pin `2026.4.23` sebagai batas
kompatibilitas pembaruan plugin pertama, `2026.5.2` sebagai batas churn
arsitektur plugin, dan `2026.4.15` sebagai baseline pembaruan-terbitan 2026.4.1x
yang lebih lama; resolver menghapus duplikat pin yang sudah ada dalam empat
terbaru. Untuk cakupan migrasi pembaruan-terbitan yang menyeluruh, gunakan
`all-since-2026.4.23` dalam workflow Update Migration terpisah alih-alih CI
Rilis Penuh. `release-history` tetap tersedia untuk sampling manual yang lebih
luas ketika Anda juga menginginkan anchor legacy pra-tanggal.

Ketika beberapa baseline survivor pembaruan-terbitan dipilih, workflow Docker
reusable memecah setiap baseline menjadi job runner tertargetnya sendiri. Setiap
shard baseline tetap menjalankan set skenario yang dipilih, tetapi log dan
artefak tetap per-baseline dan waktu dinding dibatasi oleh shard paling lambat
alih-alih satu job serial besar.

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
`suite_profile=full` hanya ketika Anda memerlukan cakupan jalur rilis Docker
penuh.

## Default rilis

Untuk kandidat rilis, tumpukan pembuktian default adalah:

1. `pnpm check:changed` dan `pnpm test:changed` untuk regresi tingkat sumber.
2. `pnpm release:check` untuk integritas artefak paket.
3. Profil Package Acceptance `package` atau lane paket kustom release-check
   untuk kontrak instalasi/pembaruan/restart/plugin.
4. Pemeriksaan rilis lintas-OS untuk perilaku installer, onboarding, dan platform
   yang spesifik OS.
5. Suite live hanya ketika surface yang berubah menyentuh perilaku penyedia atau
   layanan hosted.

Pada mesin maintainer, gate luas dan pembuktian produk Docker/paket harus
berjalan di Testbox kecuali secara eksplisit melakukan pembuktian lokal.

## Kompatibilitas legacy

Kelonggaran kompatibilitas sempit dan dibatasi waktu:

- Paket hingga `2026.4.25`, termasuk `2026.4.25-beta.*`, dapat menoleransi
  celah metadata paket yang sudah dikirim di Package Acceptance.
- Paket `2026.4.26` yang diterbitkan dapat memperingatkan untuk file stamp
  metadata build lokal yang sudah dikirim.
- Paket yang lebih baru harus memenuhi kontrak modern. Celah yang sama akan
  gagal alih-alih memperingatkan atau melewati.

Jangan tambahkan migrasi startup baru untuk bentuk lama ini. Tambahkan atau
perluas perbaikan doctor, lalu buktikan dengan `upgrade-survivor`,
`published-upgrade-survivor`, atau `update-restart-auth` ketika perintah
pembaruan memiliki tanggung jawab restart.

## Menambahkan cakupan

Saat mengubah perilaku pembaruan atau plugin, tambahkan cakupan pada lapisan
terendah yang dapat gagal karena alasan yang tepat:

- Logika jalur atau metadata murni: pengujian unit di samping sumber.
- Inventaris paket atau perilaku file yang dipaketkan: pengujian `package-dist-inventory` atau pemeriksa tarball.
- Perilaku instalasi/pembaruan CLI: asersi lane Docker atau fixture.
- Perilaku migrasi rilis yang dipublikasikan: skenario `published-upgrade-survivor`.
- Perilaku mulai ulang milik pembaruan: `update-restart-auth`.
- Perilaku sumber registri/paket: fixture `test:docker:plugins` atau server fixture ClawHub.
- Perilaku tata letak dependensi atau pembersihan: asersikan eksekusi runtime dan batas sistem berkas. Dependensi npm mungkin di-hoist di dalam proyek npm terkelola milik Plugin, jadi pengujian harus membuktikan bahwa proyek tersebut dipindai/dibersihkan alih-alih mengasumsikan hanya pohon `node_modules` lokal paket Plugin.

Jaga fixture Docker baru tetap hermetik secara default. Gunakan registri fixture lokal dan paket palsu kecuali tujuan pengujian adalah perilaku registri live.

## Triage kegagalan

Mulailah dengan identitas artefak:

- Ringkasan Package Acceptance `resolve_package`: sumber, versi, SHA-256, dan nama artefak.
- Artefak Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, log lane, dan perintah rerun.
- Ringkasan upgrade survivor: `.artifacts/upgrade-survivor/summary.json`, termasuk versi baseline, versi kandidat, skenario, timing fase, dan langkah resep.

Utamakan menjalankan ulang lane persis yang gagal dengan artefak paket yang sama daripada menjalankan ulang seluruh payung rilis.
