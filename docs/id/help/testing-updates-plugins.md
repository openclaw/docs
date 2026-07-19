---
read_when:
    - Mengubah perilaku pembaruan, doctor, penerimaan paket, atau instalasi plugin OpenClaw
    - Menyiapkan atau menyetujui kandidat rilis
    - Men-debug pembaruan paket, pembersihan dependensi plugin, atau regresi instalasi plugin
sidebarTitle: Update and plugin tests
summary: Cara OpenClaw memvalidasi jalur pembaruan, migrasi paket, serta perilaku instalasi/pembaruan plugin
title: 'Pengujian: pembaruan dan plugin'
x-i18n:
    generated_at: "2026-07-19T04:58:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 96a11fe42472f758d4fd1cc568486e301f7460982fdb547cab8b39de04a8dabe
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Daftar periksa untuk validasi pembaruan dan plugin: buktikan bahwa paket yang dapat diinstal dapat
memperbarui status pengguna nyata, memperbaiki status lama yang usang melalui `doctor`, dan tetap dapat
menginstal, memuat, memperbarui, serta menghapus instalasi plugin dari setiap sumber yang didukung.

Untuk peta runner pengujian yang lebih luas, lihat [Pengujian](/id/help/testing). Untuk kunci penyedia langsung
dan rangkaian pengujian yang mengakses jaringan, lihat [Pengujian langsung](/id/help/testing-live).

## Yang kami lindungi

- Tarball paket lengkap, memiliki `dist/postinstall-inventory.json` yang valid,
  dan tidak bergantung pada berkas repo yang belum dikemas.
- Pengguna dapat berpindah dari paket lama yang telah dipublikasikan ke paket kandidat
  tanpa kehilangan konfigurasi, agen, sesi, ruang kerja, daftar izin plugin, atau
  konfigurasi saluran.
- `openclaw doctor --fix --non-interactive` memiliki jalur pembersihan dan perbaikan
  lama. Startup tidak boleh menambah migrasi kompatibilitas tersembunyi untuk status
  plugin yang usang.
- Instalasi plugin berfungsi dari direktori lokal, repo git, paket npm, dan
  jalur registri ClawHub.
- Dependensi npm plugin diinstal dalam satu proyek npm terkelola per plugin,
  dipindai sebelum dipercaya, dan dihapus melalui `npm uninstall` selama
  penghapusan instalasi plugin agar dependensi yang di-hoist tidak tertinggal.
- Pembaruan plugin tidak melakukan apa pun ketika tidak ada perubahan: catatan instalasi, sumber yang
  diresolusi, tata letak dependensi yang diinstal, dan status aktif tetap utuh.

## Pembuktian lokal selama pengembangan

Mulai dengan cakupan sempit:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Untuk perubahan instalasi, penghapusan instalasi, dependensi, atau inventaris paket plugin, jalankan juga
pengujian terfokus yang mencakup antarmuka yang diedit:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Sebelum lane Docker paket menggunakan tarball, buktikan artefak paket:

```bash
pnpm release:check
```

`release:check` menjalankan pemeriksaan perbedaan konfigurasi/dokumentasi/API (skema konfigurasi, baseline dokumentasi
konfigurasi, manifes kontrak API dan ekspor SDK plugin, versi/inventaris plugin),
menulis inventaris dist paket, menjalankan `npm pack --dry-run`, menolak berkas
terkemas yang dilarang, menginstal tarball ke prefiks sementara, menjalankan postinstall, dan
melakukan smoke test pada titik masuk saluran bawaan.

## Lane Docker

Lane Docker merupakan pembuktian tingkat produk. Lane tersebut menginstal atau memperbarui
paket nyata di dalam kontainer Linux dan memverifikasi perilaku melalui perintah CLI,
startup Gateway, probe HTTP, status RPC, dan status sistem berkas.

Gunakan lane terfokus saat melakukan iterasi:

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

- `test:docker:plugins` mencakup smoke test instalasi plugin, instalasi folder lokal,
  perilaku melewati pembaruan folder lokal, folder lokal dengan dependensi yang telah
  diinstal sebelumnya, instalasi paket `file:`, instalasi git dengan eksekusi CLI, pembaruan
  referensi bergerak git, instalasi registri npm dengan dependensi transitif yang
  di-hoist, pembaruan npm tanpa operasi, penolakan metadata paket npm yang salah format,
  instalasi fixture ClawHub lokal dan pembaruan tanpa operasi, perilaku pembaruan marketplace,
  serta pengaktifan/pemeriksaan bundel Claude. Atur `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` untuk
  menjaga blok ClawHub tetap hermetis/luring.
- `test:docker:plugin-lifecycle-matrix` menginstal paket kandidat dalam kontainer
  kosong, menjalankan plugin npm melalui instalasi, pemeriksaan, penonaktifan, pengaktifan,
  peningkatan eksplisit, penurunan versi eksplisit, dan penghapusan instalasi setelah menghapus kode
  plugin. Lane ini mencatat metrik RSS dan CPU per fase.
- `test:docker:plugin-update` memvalidasi bahwa plugin terinstal yang tidak berubah
  tidak diinstal ulang atau kehilangan metadata instalasi selama `openclaw plugins update`.
- `test:docker:upgrade-survivor` menginstal tarball kandidat di atas fixture
  pengguna lama yang kotor, menjalankan pembaruan paket beserta doctor noninteraktif, lalu memulai
  Gateway loopback dan memeriksa pemertahanan status.
- `test:docker:published-upgrade-survivor` terlebih dahulu menginstal baseline yang dipublikasikan,
  mengonfigurasinya melalui resep `openclaw config set` bawaan, memperbaruinya ke
  tarball kandidat, menjalankan doctor, memeriksa pembersihan lama, memulai Gateway, dan
  melakukan probe pada `/healthz`, `/readyz`, serta status RPC.
- `test:docker:update-restart-auth` menginstal paket kandidat, memulai
  Gateway autentikasi token terkelola, menghapus variabel lingkungan autentikasi gateway pemanggil untuk
  `openclaw update --yes --json`, dan mengharuskan perintah pembaruan kandidat
  memulai ulang Gateway sebelum probe normal.
- `test:docker:update-migration` adalah lane pembaruan terpublikasi yang berfokus pada pembersihan. Lane ini
  dimulai dari status pengguna bergaya Discord/Telegram yang telah dikonfigurasi, menjalankan
  doctor baseline agar dependensi plugin yang dikonfigurasi memiliki kesempatan untuk terwujud, menyemai
  sisa dependensi plugin lama untuk plugin terkemas yang dikonfigurasi, memperbarui ke
  tarball kandidat, dan mengharuskan doctor pascapembaruan menghapus root dependensi
  lama.

Varian survivor peningkatan terpublikasi yang berguna:

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

Skenario yang tersedia: `base`, `acpx-openclaw-tools-bridge`, `feishu-channel`,
`bootstrap-persona`, `channel-post-core-restore`, `plugin-deps-cleanup`,
`configured-plugin-installs`, `stale-source-plugin-shadow`, `tilde-log-path`,
dan `versioned-runtime-deps`. Dalam proses agregat, `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`
(alias `far-reaching`) diperluas ke semua skenario, termasuk
migrasi instalasi plugin yang dikonfigurasi.

Migrasi pembaruan penuh sengaja dipisahkan dari CI Rilis Penuh. Gunakan
alur kerja manual `Update Migration` ketika pertanyaan rilisnya adalah "dapatkah setiap
rilis stabil yang dipublikasikan sejak 2026.4.23 dan seterusnya diperbarui ke kandidat ini serta
membersihkan sisa dependensi plugin?":

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Penerimaan Paket

Penerimaan Paket adalah gerbang paket native GitHub. Proses ini meresolusi satu paket
kandidat menjadi tarball `package-under-test`, mencatat versi dan SHA-256, lalu
menjalankan lane E2E Docker yang dapat digunakan kembali terhadap tarball yang persis sama. Referensi harness alur kerja
terpisah dari referensi sumber paket, sehingga logika pengujian saat ini dapat memvalidasi
rilis tepercaya yang lebih lama.

Sumber kandidat:

- `source=npm`: validasi `openclaw@extended-stable`, `openclaw@beta`,
  `openclaw@latest`, atau versi terpublikasi yang persis.
- `source=ref`: kemas cabang, tag, atau commit tepercaya dengan harness saat ini
  yang dipilih.
- `source=url`: validasi tarball HTTPS publik dengan `package_sha256` yang diwajibkan.
  Jalur ini menolak kredensial URL, port HTTPS nondefault, nama host privat/internal
  atau hasil DNS/IP, ruang IP penggunaan khusus, dan pengalihan yang tidak aman.
- `source=trusted-url`: validasi tarball HTTPS dengan
  `package_sha256` dan `trusted_source_id` yang diwajibkan terhadap kebijakan milik pengelola
  di `.github/package-trusted-sources.json`. Gunakan ini untuk mirror perusahaan/privat
  alih-alih melemahkan `source=url` dengan sakelar izinkan-privat tingkat input.
  Autentikasi bearer, ketika dikonfigurasi oleh kebijakan, menggunakan secret
  `OPENCLAW_TRUSTED_PACKAGE_TOKEN` tetap.
- `source=artifact`: gunakan kembali tarball yang diunggah oleh proses Actions lain.

Validasi Rilis Penuh menggunakan `source=artifact` secara default, yang dibuat dari
SHA rilis yang diresolusi. Untuk pembuktian pascapublikasi, berikan
`package_acceptance_package_spec=openclaw@YYYY.M.PATCH` agar matriks peningkatan yang sama
menargetkan paket npm yang telah dirilis.

Pemeriksaan rilis memanggil Penerimaan Paket dengan rangkaian paket/pembaruan/mulai ulang/plugin:

```text
doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape
```

Ketika soak rilis diaktifkan (dipaksakan aktif untuk `release_profile=stable` dan
`full`), pemeriksaan tersebut juga memberikan:

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Hal ini menjaga migrasi paket, peralihan saluran pembaruan, toleransi plugin terkelola
yang rusak, pembersihan dependensi plugin usang, cakupan plugin luring, perilaku
pembaruan plugin, dan QA paket Telegram pada artefak hasil resolusi yang sama tanpa
membuat gerbang paket rilis default menelusuri setiap rilis yang dipublikasikan.

`last-stable-4` diresolusi menjadi empat rilis OpenClaw stabil terbaru
yang dipublikasikan di npm. Penerimaan paket rilis menetapkan `2026.4.23` sebagai batas kompatibilitas
pembaruan plugin pertama, `2026.5.2` sebagai batas perubahan besar arsitektur plugin, dan
`2026.4.15` sebagai baseline pembaruan terpublikasi 2026.4.1x yang lebih lama; resolver
menghapus duplikasi pin yang sudah termasuk dalam empat versi terbaru. Untuk cakupan migrasi
pembaruan terpublikasi yang menyeluruh, gunakan `all-since-2026.4.23` dalam alur kerja Migrasi
Pembaruan yang terpisah, bukan CI Rilis Penuh. `release-history` tetap
tersedia untuk pengambilan sampel manual yang lebih luas ketika Anda juga menginginkan jangkar
lama sebelum tanggal tersebut.

Ketika beberapa baseline survivor peningkatan terpublikasi dipilih, alur kerja Docker yang dapat digunakan kembali
membagi setiap baseline ke dalam job runner tertargetnya sendiri. Setiap
shard baseline tetap menjalankan rangkaian skenario yang dipilih, tetapi log dan artefak tetap
terpisah per baseline dan waktu keseluruhan dibatasi oleh shard paling lambat, bukan satu job serial
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

Untuk canary extended-stable yang dipublikasikan, atur
`package_spec=openclaw@extended-stable`. Penerimaan Paket meresolusi
pemilih tersebut menjadi tarball yang persis sebelum lane Docker berjalan.

Gunakan `suite_profile=product` ketika pertanyaan rilis mencakup saluran MCP,
pembersihan cron/subagen, pencarian web OpenAI, atau OpenWebUI. Gunakan `suite_profile=full`
hanya ketika Anda memerlukan cakupan penuh jalur rilis Docker.

## Default rilis

Untuk kandidat rilis, tumpukan pembuktian default adalah:

1. `pnpm check:changed` dan `pnpm test:changed` untuk regresi tingkat sumber.
2. `pnpm release:check` untuk integritas artefak paket.
3. Profil `package` Penerimaan Paket atau lane paket khusus pemeriksaan rilis
   untuk kontrak instalasi/pembaruan/mulai ulang/plugin.
4. Pemeriksaan rilis lintas OS untuk perilaku penginstal, onboarding, dan platform
   yang spesifik OS.
5. Rangkaian pengujian langsung hanya ketika permukaan yang diubah menyentuh perilaku penyedia atau layanan
   yang di-host.

Pada mesin pengelola, gerbang luas dan pembuktian produk Docker/paket harus berjalan
di Testbox kecuali secara eksplisit melakukan pembuktian lokal.

## Kompatibilitas lama

Kelonggaran kompatibilitas bersifat sempit dan berbatas waktu:

- Paket hingga `2026.4.25`, termasuk `2026.4.25-beta.*`, dapat menoleransi
  celah metadata paket yang telah dirilis dalam Penerimaan Paket.
- Paket `2026.4.26` yang dipublikasikan dapat memberikan peringatan untuk berkas cap metadata
  build lokal yang telah dirilis.
- Paket yang lebih baru harus memenuhi kontrak modern. Celah yang sama akan gagal, bukan
  memberikan peringatan atau dilewati.

Jangan tambahkan migrasi startup baru untuk bentuk lama ini. Tambahkan atau perluas perbaikan
doctor, lalu buktikan dengan `upgrade-survivor`, `published-upgrade-survivor`, atau
`update-restart-auth` ketika perintah pembaruan memiliki tanggung jawab untuk memulai ulang.

## Menambahkan cakupan

Saat mengubah perilaku pembaruan atau plugin, tambahkan cakupan pada lapisan terendah yang
dapat gagal karena alasan yang tepat:

- Logika jalur atau metadata murni: pengujian unit di samping sumber.
- Inventaris paket atau perilaku berkas yang dikemas: `package-dist-inventory` atau pengujian
  pemeriksa tarball.
- Perilaku pemasangan/pembaruan CLI: pernyataan lane Docker atau fixture.
- Perilaku migrasi rilis yang dipublikasikan: skenario `published-upgrade-survivor`.
- Perilaku mulai ulang yang dikelola pembaruan: `update-restart-auth`.
- Perilaku sumber registri/paket: fixture `test:docker:plugins` atau server
  fixture ClawHub.
- Perilaku tata letak atau pembersihan dependensi: nyatakan eksekusi runtime dan
  batas sistem berkas. Dependensi npm dapat diangkat di dalam proyek npm
  terkelola milik plugin, sehingga pengujian harus membuktikan bahwa proyek tersebut dipindai/dibersihkan,
  alih-alih mengasumsikan hanya pohon `node_modules` lokal paket plugin.

Jaga agar fixture Docker baru tetap hermetis secara default. Gunakan registri fixture lokal dan
paket palsu kecuali tujuan pengujian adalah perilaku registri langsung.

## Triase kegagalan

Mulailah dengan identitas artefak:

- Ringkasan `resolve_package` Package Acceptance: sumber, versi, SHA-256, dan
  nama artefak.
- Artefak Docker: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, log lane, dan perintah untuk menjalankan ulang.
- Ringkasan keberhasilan peningkatan: `.artifacts/upgrade-survivor/summary.json`,
  termasuk versi dasar, versi kandidat, skenario, waktu setiap fase, dan
  cakupan resep konfigurasi.

Utamakan menjalankan ulang lane persis yang gagal dengan artefak paket yang sama daripada
menjalankan ulang seluruh rangkaian rilis.
