---
read_when:
    - Anda ingin menginstal atau mengelola Plugin Gateway atau bundel yang kompatibel
    - Anda ingin membuat kerangka awal atau memvalidasi plugin alat sederhana
    - Anda ingin men-debug kegagalan pemuatan plugin
sidebarTitle: Plugins
summary: Referensi CLI untuk `openclaw plugins` (inisialisasi, bangun, validasi, daftar, instal, marketplace, hapus instalasi, aktifkan/nonaktifkan, diagnosis)
title: Plugin
x-i18n:
    generated_at: "2026-07-12T14:05:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 729e74103a302936dc45da3be31306803b16e9dae182e78b3742783b892a9027
    source_path: cli/plugins.md
    workflow: 16
---

Kelola Plugin Gateway, paket hook, dan bundel yang kompatibel.

<CardGroup cols={2}>
  <Card title="Plugin system" href="/id/tools/plugin">
    Panduan pengguna akhir untuk menginstal, mengaktifkan, dan memecahkan masalah Plugin.
  </Card>
  <Card title="Manage plugins" href="/id/plugins/manage-plugins">
    Contoh singkat untuk menginstal, mencantumkan, memperbarui, menghapus instalasi, dan menerbitkan.
  </Card>
  <Card title="Plugin bundles" href="/id/plugins/bundles">
    Model kompatibilitas bundel.
  </Card>
  <Card title="Plugin manifest" href="/id/plugins/manifest">
    Bidang manifes dan skema konfigurasi.
  </Card>
  <Card title="Security" href="/id/gateway/security">
    Penguatan keamanan untuk instalasi Plugin.
  </Card>
</CardGroup>

## Perintah

```bash
openclaw plugins list [--enabled] [--verbose] [--json]
openclaw plugins search <query> [--limit <n>] [--json]
openclaw plugins install <path-or-spec> [--link] [--force] [--pin] [--marketplace <source>]
openclaw plugins inspect <id> [--runtime] [--json]
openclaw plugins inspect --all [--runtime] [--json]
openclaw plugins info <id>                    # alias for inspect
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins uninstall <id> [--dry-run] [--keep-files] [--force]
openclaw plugins update <id-or-npm-spec> | --all [--dry-run]
openclaw plugins registry [--refresh] [--json]
openclaw plugins doctor
openclaw plugins init <id> [--name <name>] [--type tool|provider] [--directory <path>]
openclaw plugins build [--entry <path>] [--check]
openclaw plugins validate [--entry <path>]
openclaw plugins marketplace entries [--offline] [--feed-profile <name>] [--json]
openclaw plugins marketplace list <source> [--json]
openclaw plugins marketplace refresh [--feed-profile <name>] [--expected-sha256 <sha256>] [--json]
```

Untuk menyelidiki proses instalasi, inspeksi, penghapusan instalasi, atau penyegaran registri yang lambat, jalankan
perintah dengan `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Jejak tersebut menulis waktu setiap fase
ke stderr dan menjaga keluaran JSON tetap dapat diurai. Lihat [Debugging](/id/help/debugging#plugin-lifecycle-trace).

<Note>
Dalam mode Nix (`OPENCLAW_NIX_MODE=1`), `openclaw.json` tidak dapat diubah. `install`, `update`, `uninstall`, `enable`, dan `disable` semuanya menolak dijalankan. Sebagai gantinya, edit sumber Nix untuk instalasi ini (`programs.openclaw.config` atau `instances.<name>.config` untuk nix-openclaw), lalu bangun ulang. Lihat [Panduan Memulai Cepat](https://github.com/openclaw/nix-openclaw#quick-start) yang mengutamakan agen.
</Note>

<Note>
Plugin bawaan disertakan bersama OpenClaw. Beberapa diaktifkan secara default (misalnya penyedia model bawaan, penyedia suara bawaan, dan Plugin peramban bawaan); yang lainnya memerlukan `plugins enable`.

Plugin OpenClaw native menyertakan `openclaw.plugin.json` dengan Skema JSON sebaris (`configSchema`, meskipun kosong). Bundel yang kompatibel menggunakan manifes bundelnya sendiri.

`plugins list` menampilkan `Format: openclaw` atau `Format: bundle`. Keluaran daftar/informasi terperinci juga menampilkan subjenis bundel (`codex`, `claude`, atau `cursor`) beserta kapabilitas bundel yang terdeteksi.
</Note>

## Pembuatan

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

Secara default, `plugins init` membuat Plugin alat TypeScript minimal. Argumen pertama
adalah ID Plugin; `--name` menetapkan nama tampilan. OpenClaw menggunakan
ID tersebut untuk direktori keluaran default dan penamaan paket. Kerangka alat menggunakan
`defineToolPlugin` dan menghasilkan skrip `package.json` berupa `plugin:build` dan
`plugin:validate` yang melakukan pembangunan, lalu memanggil `openclaw plugins build`/`validate`.

`plugins build` mengimpor titik masuk yang telah dibangun, membaca metadata alat statisnya, menulis
`openclaw.plugin.json`, dan menjaga `openclaw.extensions` dalam `package.json` tetap selaras.
`plugins validate` memeriksa apakah manifes yang dihasilkan, metadata paket, dan
ekspor titik masuk saat ini masih konsisten. Lihat [Plugin Alat](/id/plugins/tool-plugins) untuk
alur kerja pembuatan selengkapnya.

Kerangka tersebut menulis sumber TypeScript, tetapi menghasilkan metadata dari titik masuk
`./dist/index.js` yang telah dibangun, sehingga alur kerja ini juga berfungsi dengan CLI yang telah diterbitkan. Gunakan
`--entry <path>` ketika titik masuk bukan titik masuk paket default. Gunakan
`plugins build --check` dalam CI agar gagal ketika metadata yang dihasilkan sudah usang tanpa
menulis ulang berkas.

### Kerangka penyedia

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

Kerangka penyedia membuat Plugin penyedia model generik yang kompatibel dengan OpenAI
dengan mekanisme autentikasi kunci API, skrip `npm run validate` yang menjalankan
`clawhub package validate`, metadata paket ClawHub, dan alur kerja GitHub Actions yang
dipicu secara manual untuk penerbitan tepercaya pada masa mendatang melalui GitHub
OIDC. Kerangka penyedia tidak menghasilkan Skills dan tidak menggunakan
`openclaw plugins build`/`validate`; perintah tersebut digunakan untuk jalur metadata
yang dihasilkan oleh kerangka alat.

Sebelum menerbitkan, ganti URL dasar API placeholder, katalog model, rute dokumentasi,
teks kredensial, dan salinan README dengan detail penyedia yang sebenarnya. Gunakan
README yang dihasilkan untuk penerbitan pertama kali ke ClawHub dan penyiapan penerbit tepercaya.

## Instalasi

```bash
openclaw plugins search "calendar"                      # search ClawHub plugins
openclaw plugins install <package>                       # source auto-detection
openclaw plugins install clawhub:<package>                # ClawHub only
openclaw plugins install npm:<package>                    # npm only
openclaw plugins install npm-pack:<path.tgz>               # local npm-pack tarball
openclaw plugins install git:github.com/<owner>/<repo>     # git repo
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <path>                            # local path or archive
openclaw plugins install -l <path>                         # link instead of copy
openclaw plugins install <plugin>@<marketplace>             # marketplace shorthand
openclaw plugins install <plugin> --marketplace <name>      # marketplace (explicit)
openclaw plugins install <package> --force                  # overwrite existing install
openclaw plugins install <package> --pin                    # pin resolved npm version
openclaw plugins install clawhub:<package> --acknowledge-clawhub-risk
openclaw plugins install <package> --dangerously-force-unsafe-install
```

Pengelola yang menguji instalasi pada waktu penyiapan dapat mengganti sumber instalasi Plugin
otomatis menggunakan variabel lingkungan yang dilindungi. Lihat
[Penggantian sumber instalasi Plugin](/id/plugins/install-overrides).

<Warning>
Nama paket tanpa awalan diinstal dari npm secara default selama peralihan peluncuran, kecuali jika cocok dengan ID Plugin bawaan atau resmi; dalam hal itu, OpenClaw menggunakan salinan lokal/resmi tersebut alih-alih mengakses registri npm. Gunakan `npm:<package>` ketika Anda secara sengaja menginginkan paket npm eksternal. Gunakan `clawhub:<package>` untuk ClawHub. Perlakukan instalasi Plugin seperti menjalankan kode; utamakan versi yang disematkan.
</Warning>

`plugins search` mencari paket `code-plugin` dan `bundle-plugin` yang dapat diinstal
di ClawHub (bukan Skills; gunakan `openclaw skills search` untuk mencarinya).
Nilai default `--limit` adalah 20, dengan batas maksimum 100. Perintah ini hanya membaca katalog jarak jauh: tanpa
inspeksi status lokal, mutasi konfigurasi, instalasi paket, atau pemuatan runtime
Plugin. Hasil mencakup nama paket ClawHub, keluarga, kanal, versi,
ringkasan, dan petunjuk instalasi seperti `openclaw plugins install clawhub:<package>`.

<Note>
ClawHub merupakan sarana distribusi dan penemuan utama bagi sebagian besar Plugin. Npm
tetap didukung sebagai jalur cadangan dan instalasi langsung. Paket Plugin
`@openclaw/*` milik OpenClaw kembali diterbitkan di npm; lihat daftar saat ini
di [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) atau
[inventaris Plugin](/id/plugins/plugin-inventory). Instalasi stabil menggunakan `latest`.
Instalasi dan pembaruan kanal beta mengutamakan dist-tag npm `beta` jika tersedia,
dan kembali menggunakan `latest` jika tidak tersedia. Pada kanal stabil diperpanjang, Plugin npm resmi
dengan maksud tanpa awalan/default atau `latest` ditetapkan ke versi inti
yang terinstal secara tepat. Sematan versi tepat dan tag eksplisit selain `latest`, paket pihak ketiga, serta
sumber selain npm tidak ditulis ulang.
</Note>

<AccordionGroup>
  <Accordion title="Config includes and invalid-config repair">
    Jika bagian `plugins` Anda didukung oleh `$include` berkas tunggal, `plugins install/update/enable/disable/uninstall` menulis langsung ke berkas yang disertakan tersebut dan tidak mengubah `openclaw.json`. Penyertaan akar, larik penyertaan, dan penyertaan dengan penggantian setingkat akan gagal secara tertutup, alih-alih diratakan. Lihat [Penyertaan konfigurasi](/id/gateway/configuration) untuk bentuk yang didukung.

    Jika konfigurasi tidak valid selama instalasi, `plugins install` biasanya gagal secara tertutup dan meminta Anda menjalankan `openclaw doctor --fix` terlebih dahulu. Selama Gateway dimulai dan pemuatan ulang langsung, konfigurasi Plugin yang tidak valid gagal secara tertutup seperti konfigurasi tidak valid lainnya; `openclaw doctor --fix` dapat mengarantina entri Plugin yang tidak valid. Satu-satunya pengecualian terdokumentasi pada waktu instalasi adalah jalur pemulihan sempit untuk Plugin bawaan yang secara eksplisit memilih menggunakan `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force and reinstall vs update">
    `--force` menggunakan kembali target instalasi yang ada dan menimpa Plugin atau paket hook yang telah diinstal di tempatnya. Gunakan opsi ini ketika secara sengaja menginstal ulang ID yang sama dari jalur lokal, arsip, paket ClawHub, atau artefak npm baru. Untuk pemutakhiran rutin Plugin npm yang telah dilacak, utamakan `openclaw plugins update <id-or-npm-spec>`.

    Jika Anda menjalankan `plugins install` untuk ID Plugin yang telah diinstal, OpenClaw berhenti dan mengarahkan Anda ke `plugins update <id-or-npm-spec>` untuk pemutakhiran biasa, atau ke `plugins install <package> --force` ketika Anda benar-benar ingin menimpa instalasi saat ini dari sumber berbeda. `--force` tidak didukung bersama `--link`.

  </Accordion>
  <Accordion title="--pin scope">
    `--pin` hanya berlaku untuk instalasi npm dan mencatat `<name>@<version>` tepat yang telah ditetapkan. Opsi ini tidak didukung bersama instalasi `git:` (sebagai gantinya, sematkan referensi dalam spesifikasi, misalnya `git:github.com/acme/plugin@v1.2.3`) atau bersama `--marketplace` (instalasi lokapasar menyimpan metadata sumber lokapasar, bukan spesifikasi npm).
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` telah dihentikan dan sekarang tidak melakukan apa pun. OpenClaw tidak lagi menjalankan pemblokiran kode berbahaya bawaan pada waktu instalasi untuk instalasi Plugin.

    Gunakan permukaan `security.installPolicy` yang dikelola operator ketika kebijakan instalasi khusus hos diperlukan. Hook `before_install` Plugin adalah hook siklus hidup runtime Plugin, bukan batas kebijakan utama untuk instalasi melalui CLI.

    Jika Plugin yang Anda terbitkan di ClawHub disembunyikan atau diblokir oleh pemindaian registri, ikuti langkah penerbit di [Penerbitan ClawHub](/id/clawhub/publishing). `--dangerously-force-unsafe-install` tidak meminta ClawHub memindai ulang Plugin atau menjadikan rilis yang diblokir tersedia bagi publik.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    Instalasi komunitas dari ClawHub memeriksa catatan kepercayaan rilis yang dipilih sebelum mengunduh. Jika ClawHub menonaktifkan unduhan untuk rilis tersebut, melaporkan temuan pemindaian berbahaya, atau menempatkan rilis dalam status moderasi yang memblokir (dikarantina, dicabut), OpenClaw menolaknya secara mutlak terlepas dari flag ini. Untuk status pemindaian berisiko atau status moderasi yang tidak memblokir, OpenClaw menampilkan detail kepercayaan dan meminta konfirmasi sebelum melanjutkan.

    Gunakan `--acknowledge-clawhub-risk` hanya setelah meninjau peringatan ClawHub dan memutuskan untuk melanjutkan tanpa prompt interaktif. Hasil pemindaian tertunda atau usang (belum dinyatakan bersih) menampilkan peringatan, tetapi tidak memerlukan pengakuan. Paket resmi ClawHub dan sumber Plugin bawaan OpenClaw sepenuhnya melewati pemeriksaan kepercayaan rilis ini.

  </Accordion>
  <Accordion title="Hook packs and npm specs">
    `plugins install` juga merupakan sarana instalasi untuk paket hook yang mengekspos `openclaw.hooks` dalam `package.json`. Gunakan `openclaw hooks` untuk visibilitas hook yang difilter dan pengaktifan per hook, bukan untuk instalasi paket.

    Spesifikasi npm bersifat **khusus registri** (nama paket ditambah **versi persis** atau **dist-tag** opsional). Spesifikasi Git/URL/file dan rentang semver ditolak. Instalasi dependensi dijalankan dalam satu proyek npm terkelola per plugin dengan `--ignore-scripts` demi keamanan, bahkan ketika shell Anda memiliki pengaturan instalasi npm global. Proyek npm plugin terkelola mewarisi `overrides` npm tingkat paket milik OpenClaw, sehingga pin keamanan host juga berlaku untuk dependensi plugin yang di-hoist.

    Gunakan `npm:<package>` untuk menyatakan resolusi npm secara eksplisit. Spesifikasi paket tanpa awalan juga diinstal langsung dari npm selama peralihan peluncuran, kecuali cocok dengan id plugin resmi.

    Spesifikasi mentah `@openclaw/*` yang cocok dengan plugin bawaan akan diresolusikan ke salinan bawaan milik image sebelum beralih ke npm. Misalnya, `openclaw plugins install @openclaw/discord@2026.5.20 --pin` menggunakan plugin Discord bawaan dari build OpenClaw saat ini, alih-alih membuat override npm terkelola. Untuk memaksa penggunaan paket npm eksternal, gunakan `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`.

    Spesifikasi tanpa awalan dan `@latest` tetap berada di jalur stabil. Versi koreksi OpenClaw bertanda tanggal seperti `2026.5.3-1` dianggap stabil untuk pemeriksaan ini. Jika npm meresolusikan salah satu bentuk tersebut ke prarilis, OpenClaw berhenti dan meminta Anda menyatakan persetujuan secara eksplisit dengan tag prarilis (`@beta`/`@rc`) atau versi prarilis persis (`@1.2.3-beta.4`).

    Untuk instalasi npm tanpa versi persis (`npm:<package>` atau `npm:<package>@latest`), OpenClaw memeriksa metadata paket yang diresolusikan sebelum instalasi. Jika paket stabil terbaru memerlukan API plugin OpenClaw yang lebih baru atau versi host minimum yang lebih tinggi, OpenClaw memeriksa versi stabil terdahulu dan menginstal rilis kompatibel terbaru. Versi persis dan dist-tag eksplisit tetap ketat: pilihan yang tidak kompatibel akan gagal dan meminta Anda meningkatkan OpenClaw atau memilih versi yang kompatibel.

    Jika spesifikasi instalasi tanpa awalan cocok dengan id plugin resmi (misalnya `diffs`), OpenClaw menginstal entri katalog tersebut secara langsung. Untuk menginstal paket npm dengan nama yang sama, gunakan spesifikasi berscope eksplisit (misalnya `@scope/diffs`).

  </Accordion>
  <Accordion title="Repositori Git">
    Gunakan `git:<repo>` untuk menginstal langsung dari repositori git. Bentuk yang didukung: `git:github.com/owner/repo`, `git:owner/repo`, URL klona lengkap `https://`, `ssh://`, `git://`, `file://`, dan `git@host:owner/repo.git`. Tambahkan `@<ref>` atau `#<ref>` untuk melakukan checkout cabang, tag, atau commit sebelum instalasi.

    Instalasi Git mengklona ke direktori sementara, melakukan checkout ref yang diminta jika tersedia, lalu menggunakan penginstal direktori plugin normal, sehingga validasi manifes, kebijakan instalasi operator, proses instalasi manajer paket, dan catatan instalasi berperilaku seperti instalasi npm. Instalasi git yang dicatat menyertakan URL/ref sumber beserta commit yang diresolusikan agar `openclaw plugins update` dapat meresolusikan ulang sumber tersebut nantinya.

    Setelah menginstal dari git, gunakan `openclaw plugins inspect <id> --runtime --json` untuk memverifikasi registrasi runtime seperti metode Gateway dan perintah CLI. Jika plugin mendaftarkan akar CLI dengan `api.registerCli`, jalankan perintah tersebut langsung melalui CLI akar OpenClaw, misalnya `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Arsip">
    Arsip yang didukung: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Arsip plugin OpenClaw native harus memuat `openclaw.plugin.json` yang valid pada akar plugin hasil ekstraksi; arsip yang hanya memuat `package.json` ditolak sebelum OpenClaw menulis catatan instalasi.

    Gunakan `npm-pack:<path.tgz>` ketika file tersebut merupakan tarball npm-pack dan Anda menginginkan
    jalur proyek npm terkelola per plugin yang sama dengan yang digunakan oleh instalasi registri,
    termasuk verifikasi `package-lock.json`, pemindaian dependensi yang di-hoist,
    dan catatan instalasi npm. Jalur arsip biasa tetap diinstal sebagai arsip
    lokal di bawah akar ekstensi plugin.

    Instalasi marketplace Claude juga didukung.

  </Accordion>
</AccordionGroup>

Instalasi ClawHub menggunakan pencari lokasi `clawhub:<package>` eksplisit:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Spesifikasi plugin tanpa awalan yang aman untuk npm diinstal dari npm secara default selama peralihan peluncuran, kecuali cocok dengan id plugin resmi:

```bash
openclaw plugins install openclaw-codex-app-server
```

Gunakan `npm:` untuk menyatakan resolusi khusus npm secara eksplisit:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw memeriksa kompatibilitas API plugin / Gateway minimum yang diumumkan sebelum instalasi. Ketika versi ClawHub yang dipilih menerbitkan artefak ClawPack, OpenClaw mengunduh `.tgz` npm-pack berversi, memverifikasi header digest ClawHub dan digest artefak, lalu menginstalnya melalui jalur arsip normal. Versi ClawHub lama tanpa metadata ClawPack tetap diinstal melalui jalur verifikasi arsip paket lama. Instalasi yang dicatat mempertahankan metadata sumber ClawHub, jenis artefak, integritas npm, shasum npm, nama tarball, dan fakta digest ClawPack untuk pembaruan mendatang.
Instalasi ClawHub tanpa versi mempertahankan spesifikasi tanpa versi yang tercatat agar `openclaw plugins update` dapat mengikuti rilis ClawHub yang lebih baru; pemilih versi atau tag eksplisit seperti `clawhub:pkg@1.2.3` dan `clawhub:pkg@beta` tetap dipin ke pemilih tersebut.

### Bentuk singkat marketplace

Gunakan bentuk singkat `plugin@marketplace` ketika nama marketplace tersedia dalam cache registri lokal Claude di `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Gunakan `--marketplace` untuk meneruskan sumber marketplace secara eksplisit:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Sumber marketplace">
    - nama marketplace Claude yang dikenal dari `~/.claude/plugins/known_marketplaces.json`
    - akar marketplace lokal atau jalur `marketplace.json`
    - bentuk singkat repositori GitHub seperti `owner/repo`
    - URL repositori GitHub seperti `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="Aturan marketplace jarak jauh">
    Untuk marketplace jarak jauh yang dimuat dari GitHub atau git, entri plugin harus tetap berada di dalam repositori marketplace yang diklona. OpenClaw menerima sumber jalur relatif dari repositori tersebut dan menolak HTTP(S), jalur absolut, git, GitHub, serta sumber plugin nonjalur lainnya dari manifes jarak jauh.
  </Tab>
</Tabs>

Untuk jalur dan arsip lokal, OpenClaw secara otomatis mendeteksi:

- plugin OpenClaw native (`openclaw.plugin.json`)
- bundel yang kompatibel dengan Codex (`.codex-plugin/plugin.json`)
- bundel yang kompatibel dengan Claude (`.claude-plugin/plugin.json`, atau tata letak komponen Claude default ketika file manifes tersebut tidak ada)
- bundel yang kompatibel dengan Cursor (`.cursor-plugin/plugin.json`)

Instalasi lokal terkelola harus berupa direktori plugin atau arsip. File plugin mandiri `.js`,
`.mjs`, `.cjs`, dan `.ts` tidak disalin ke akar plugin terkelola oleh
`plugins install`, maupun dimuat dengan menempatkannya secara langsung di
`~/.openclaw/extensions` atau `<workspace>/.openclaw/extensions`; akar yang
ditemukan otomatis tersebut memuat paket plugin atau direktori bundel, dan melewati
file skrip tingkat atas sebagai pembantu lokal. Cantumkan file mandiri secara eksplisit di
`plugins.load.paths` sebagai gantinya.

<Note>
Bundel yang kompatibel diinstal ke akar plugin normal dan mengikuti alur daftar/info/aktifkan/nonaktifkan yang sama. Saat ini, Skills bundel, command-skills Claude, nilai default `settings.json` Claude, nilai default `.lsp.json` Claude / `lspServers` yang dideklarasikan manifes, command-skills Cursor, dan direktori hook Codex yang kompatibel didukung; kapabilitas bundel lain yang terdeteksi ditampilkan dalam diagnostik/info, tetapi belum dihubungkan ke eksekusi runtime.
</Note>

Gunakan `-l`/`--link` untuk menunjuk ke direktori plugin lokal tanpa menyalinnya (menambahkan
ke `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

`--link` tidak didukung bersama `--force` (plugin tertaut menunjuk langsung ke jalur
sumber, sehingga tidak ada yang dapat ditimpa di tempat), `--marketplace`, atau
instalasi `git:`, dan opsi ini memerlukan jalur lokal yang sudah ada.

<Note>
Plugin yang berasal dari ruang kerja dan ditemukan dari akar ekstensi ruang kerja tidak
diimpor atau dieksekusi hingga diaktifkan secara eksplisit. Untuk pengembangan lokal,
jalankan `openclaw plugins enable <plugin-id>` atau tetapkan
`plugins.entries.<plugin-id>.enabled: true`; jika konfigurasi Anda menggunakan
`plugins.allow`, sertakan juga id plugin yang sama di sana. Aturan gagal-tertutup ini
juga berlaku ketika penyiapan saluran secara eksplisit menargetkan plugin asal ruang kerja untuk
pemuatan khusus penyiapan, sehingga kode penyiapan plugin saluran lokal tidak akan berjalan selama
plugin ruang kerja tersebut tetap dinonaktifkan atau dikecualikan dari daftar yang diizinkan. Instalasi tertaut
dan entri `plugins.load.paths` eksplisit mengikuti kebijakan normal untuk
asal plugin yang diresolusikan. Lihat
[Konfigurasikan kebijakan plugin](/id/tools/plugin#configure-plugin-policy)
dan [Referensi konfigurasi](/id/gateway/configuration-reference#plugins).

Gunakan `--pin` pada instalasi npm untuk menyimpan spesifikasi persis yang diresolusikan (`name@version`) dalam indeks plugin terkelola, sambil mempertahankan perilaku default tanpa pin.
</Note>

## Daftar

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  Tampilkan hanya plugin yang diaktifkan.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Beralih dari tampilan tabel ke baris detail per plugin dengan metadata format/sumber/asal/versi/aktivasi.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventaris yang dapat dibaca mesin beserta diagnostik registri dan status instalasi dependensi paket.
</ParamField>

<Note>
`plugins list` membaca registri plugin lokal yang dipersistenkan terlebih dahulu, dengan fallback turunan khusus manifes ketika registri tidak ada atau tidak valid. Perintah ini berguna untuk memeriksa apakah plugin telah diinstal, diaktifkan, dan terlihat oleh perencanaan startup dingin, tetapi bukan probe runtime langsung terhadap proses Gateway yang sudah berjalan. Setelah mengubah kode plugin, status pengaktifan, kebijakan hook, atau `plugins.load.paths`, mulai ulang Gateway yang melayani saluran sebelum mengharapkan kode `register(api)` atau hook baru berjalan. Untuk deployment jarak jauh/kontainer, pastikan Anda memulai ulang proses anak `openclaw gateway run` yang sebenarnya, bukan hanya proses pembungkus.

`plugins list --json` menyertakan `dependencyStatus` setiap plugin dari `dependencies`
dan `optionalDependencies` dalam `package.json`. OpenClaw memeriksa apakah nama paket
tersebut tersedia di sepanjang jalur pencarian `node_modules` Node normal milik plugin; OpenClaw
tidak mengimpor kode runtime plugin, menjalankan manajer paket, atau memperbaiki
dependensi yang hilang.
</Note>

Jika startup mencatat `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`,
jalankan `openclaw plugins list --enabled --verbose` atau
`openclaw plugins inspect <id>` dengan id plugin yang tercantum untuk mengonfirmasi id
plugin dan salin id tepercaya ke `plugins.allow` dalam `openclaw.json`. Ketika
peringatan dapat mencantumkan setiap plugin yang ditemukan, peringatan tersebut mencetak cuplikan
`plugins.allow` siap-tempel yang sudah menyertakan id-id tersebut. Jika plugin dimuat
tanpa asal-usul instalasi/jalur-pemuatan, periksa id plugin tersebut, lalu pin
id tepercaya dalam `plugins.allow` atau instal ulang plugin dari sumber tepercaya
agar OpenClaw mencatat asal-usul instalasi.

Untuk pekerjaan plugin bawaan di dalam image Docker terpaket, lakukan bind mount pada direktori
sumber plugin di atas jalur sumber terpaket yang sesuai, seperti
`/app/extensions/synology-chat`. OpenClaw menemukan overlay sumber yang di-mount tersebut
sebelum `/app/dist/extensions/synology-chat`; direktori sumber biasa yang disalin
tetap tidak aktif, sehingga instalasi terpaket normal tetap menggunakan dist hasil kompilasi.

Untuk debugging hook runtime:

- `openclaw plugins inspect <id> --runtime --json` menampilkan hook terdaftar dan diagnostik dari tahap inspeksi dengan modul yang dimuat. Inspeksi runtime tidak pernah memasang dependensi; gunakan `openclaw doctor --fix` untuk membersihkan status dependensi lama atau memulihkan plugin unduhan yang hilang tetapi dirujuk oleh konfigurasi.
- `openclaw gateway status --deep --require-rpc` mengonfirmasi URL/profil Gateway yang dapat dijangkau, petunjuk layanan/proses, jalur konfigurasi, dan kesehatan RPC.
- Hook percakapan yang tidak dibundel (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) memerlukan `plugins.entries.<id>.hooks.allowConversationAccess=true`.

### Indeks plugin

Metadata pemasangan plugin merupakan status yang dikelola mesin, bukan konfigurasi pengguna. Pemasangan dan pembaruan menuliskannya ke basis data status SQLite bersama di bawah direktori status OpenClaw yang aktif. Baris `installed_plugin_index` menyimpan metadata `installRecords` yang persisten, termasuk rekaman untuk manifes plugin yang rusak atau hilang, serta cache registri dingin yang diturunkan dari manifes dan digunakan oleh `openclaw plugins update`, penghapusan pemasangan, diagnostik, dan registri plugin dingin.

Saat OpenClaw melihat rekaman lama `plugins.installs` yang disertakan dalam konfigurasi rilis, pembacaan runtime memperlakukannya sebagai masukan kompatibilitas tanpa menulis ulang `openclaw.json`. Penulisan plugin secara eksplisit dan `openclaw doctor --fix` memindahkan rekaman tersebut ke indeks plugin dan menghapus kunci konfigurasi jika penulisan konfigurasi diizinkan; jika salah satu penulisan gagal, rekaman konfigurasi dipertahankan agar metadata pemasangan tidak hilang.

## Menghapus pemasangan

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
openclaw plugins uninstall <id> --force
```

`uninstall` menghapus rekaman plugin dari `plugins.entries`, indeks plugin persisten, entri daftar izin/tolak plugin, dan entri `plugins.load.paths` tertaut jika berlaku. Kecuali `--keep-files` ditetapkan, penghapusan pemasangan juga menghapus direktori pemasangan terkelola yang dilacak, tetapi hanya jika direktori tersebut ditetapkan berada di dalam akar ekstensi plugin OpenClaw. Jika plugin saat ini memiliki slot `memory` atau `contextEngine`, slot tersebut diatur ulang ke nilai bawaannya (`memory-core` untuk memori, `legacy` untuk mesin konteks).

`uninstall` mencetak pratinjau hal-hal yang akan dihapus, lalu menampilkan permintaan konfirmasi `Uninstall plugin "<id>"?` sebelum melakukan perubahan. Teruskan `--force` untuk melewati permintaan konfirmasi (berguna untuk skrip dan eksekusi noninteraktif); tanpa opsi tersebut, penghapusan pemasangan memerlukan TTY interaktif. `--dry-run` mencetak pratinjau yang sama dan keluar tanpa meminta konfirmasi atau mengubah apa pun.

<Note>
`--keep-config` didukung sebagai alias usang untuk `--keep-files`.
</Note>

## Memperbarui

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --acknowledge-clawhub-risk
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Pembaruan berlaku untuk pemasangan plugin yang dilacak dalam indeks plugin terkelola dan pemasangan paket hook yang dilacak dalam `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Menentukan id plugin atau spesifikasi npm">
    Saat Anda meneruskan id plugin, OpenClaw menggunakan kembali spesifikasi pemasangan yang tercatat untuk plugin tersebut. Artinya, dist-tag yang sebelumnya disimpan seperti `@beta` dan versi pasti yang disematkan akan terus digunakan pada eksekusi `update <id>` berikutnya.

    Selama `update <id> --dry-run`, pemasangan npm dengan versi pasti tetap disematkan. Jika OpenClaw juga dapat menentukan jalur bawaan registri paket dan jalur bawaan tersebut lebih baru daripada versi tersemat yang terpasang, eksekusi percobaan akan melaporkan penyematan tersebut dan mencetak perintah pembaruan paket `@latest` secara eksplisit untuk mengikuti jalur bawaan registri.

    Aturan pembaruan tertarget tersebut berbeda dari jalur pemeliharaan massal `openclaw plugins update --all`. Pembaruan massal tetap mematuhi spesifikasi pemasangan terlacak biasa, tetapi rekaman plugin resmi OpenClaw yang tepercaya dapat disinkronkan ke target katalog resmi saat ini alih-alih tetap menggunakan paket resmi pasti yang sudah usang. Gunakan `update <id>` tertarget jika Anda sengaja ingin mempertahankan spesifikasi resmi pasti atau bertag tanpa perubahan.

    Untuk pemasangan npm, Anda juga dapat meneruskan spesifikasi paket npm secara eksplisit dengan dist-tag atau versi pasti. OpenClaw menentukan kembali nama paket tersebut ke rekaman plugin yang dilacak, memperbarui plugin yang terpasang, dan mencatat spesifikasi npm baru untuk pembaruan berbasis id pada masa mendatang.

    Meneruskan nama paket npm tanpa versi atau tag juga akan menentukan kembali rekaman plugin yang dilacak. Gunakan ini jika plugin disematkan ke versi pasti dan Anda ingin memindahkannya kembali ke jalur rilis bawaan registri.

  </Accordion>
  <Accordion title="Pembaruan kanal beta">
    `openclaw plugins update <id-or-npm-spec>` tertarget menggunakan kembali spesifikasi plugin yang dilacak kecuali Anda meneruskan spesifikasi baru. `openclaw plugins update --all` massal menggunakan `update.channel` yang dikonfigurasi saat menyinkronkan rekaman plugin resmi tepercaya ke target katalog resmi, sehingga pemasangan kanal beta dapat tetap berada di jalur rilis beta alih-alih secara diam-diam dinormalkan ke stabil/terbaru.

    `openclaw update` juga mengetahui kanal pembaruan OpenClaw yang aktif: pada kanal beta, rekaman plugin npm jalur bawaan dan ClawHub akan mencoba `@beta` terlebih dahulu. Rekaman tersebut kembali menggunakan spesifikasi bawaan/terbaru yang tercatat jika tidak ada rilis beta plugin; plugin npm juga kembali menggunakannya jika paket beta tersedia tetapi gagal dalam validasi pemasangan. Penggunaan alternatif tersebut dilaporkan sebagai peringatan dan tidak menggagalkan pembaruan inti. Versi pasti dan tag eksplisit tetap disematkan ke pemilih tersebut untuk pembaruan tertarget.

  </Accordion>
  <Accordion title="Pemeriksaan versi dan penyimpangan integritas">
    Sebelum pembaruan npm langsung, OpenClaw memeriksa versi paket yang terpasang terhadap metadata registri npm. Jika versi yang terpasang dan identitas artefak yang tercatat sudah cocok dengan target yang ditentukan, pembaruan dilewati tanpa mengunduh, memasang ulang, atau menulis ulang `openclaw.json`.

    Jika hash integritas tersimpan tersedia dan hash artefak yang diambil berubah, OpenClaw memperlakukannya sebagai penyimpangan artefak npm. Perintah interaktif `openclaw plugins update` mencetak hash yang diharapkan dan aktual, lalu meminta konfirmasi sebelum melanjutkan. Pembantu pembaruan noninteraktif secara bawaan menolak untuk melanjutkan kecuali pemanggil menyediakan kebijakan kelanjutan secara eksplisit.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install saat pembaruan">
    `--dangerously-force-unsafe-install` juga diterima pada `plugins update` demi kompatibilitas, tetapi opsi ini sudah usang dan tidak lagi mengubah perilaku pembaruan plugin. `security.installPolicy` operator masih dapat memblokir pembaruan; hook `before_install` plugin hanya berlaku dalam proses tempat hook plugin dimuat.
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk saat pembaruan">
    Pembaruan plugin komunitas yang didukung ClawHub menjalankan pemeriksaan kepercayaan rilis pasti yang sama seperti pemasangan sebelum mengunduh paket pengganti. Gunakan `--acknowledge-clawhub-risk` untuk otomatisasi yang telah ditinjau dan harus tetap berlanjut ketika rilis ClawHub terpilih memiliki peringatan kepercayaan berisiko. Paket resmi ClawHub dan sumber plugin OpenClaw yang dibundel melewati permintaan konfirmasi kepercayaan rilis ini.
  </Accordion>
</AccordionGroup>

## Memeriksa

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
```

Pemeriksaan menampilkan identitas, status pemuatan, sumber, kapabilitas manifes, tanda kebijakan, diagnostik, metadata pemasangan, kapabilitas bundel, dan dukungan server MCP atau LSP yang terdeteksi tanpa mengimpor runtime plugin secara bawaan. Keluaran JSON mencakup kontrak manifes plugin, seperti `contracts.agentToolResultMiddleware` dan `contracts.trustedToolPolicies`, sehingga operator dapat mengaudit deklarasi permukaan tepercaya sebelum mengaktifkan atau memulai ulang plugin. Tambahkan `--runtime` untuk memuat modul plugin dan menyertakan hook, alat, perintah, layanan, metode Gateway, dan rute HTTP yang terdaftar. Inspeksi runtime melaporkan dependensi plugin yang hilang secara langsung; pemasangan dan perbaikan tetap dilakukan melalui `openclaw plugins install`, `openclaw plugins update`, dan `openclaw doctor --fix`.

Perintah CLI milik plugin biasanya dipasang sebagai grup perintah akar `openclaw`, tetapi plugin juga dapat mendaftarkan perintah bertingkat di bawah induk inti seperti `openclaw nodes`. Setelah `inspect --runtime` menampilkan perintah di bawah `cliCommands`, jalankan perintah tersebut pada jalur yang tercantum; misalnya, plugin yang mendaftarkan `demo-git` dapat diverifikasi dengan `openclaw demo-git ping`.

Setiap plugin diklasifikasikan berdasarkan apa yang benar-benar didaftarkannya saat runtime:

| Bentuk              | Arti                                                                       |
| ------------------- | -------------------------------------------------------------------------- |
| `plain-capability`  | tepat satu jenis kapabilitas (misalnya plugin khusus penyedia)             |
| `hybrid-capability` | lebih dari satu jenis kapabilitas (misalnya teks + ucapan + gambar)         |
| `hook-only`         | hanya hook, tanpa kapabilitas, alat, perintah, layanan, atau rute           |
| `non-capability`    | alat/perintah/layanan tetapi tanpa kapabilitas                              |

Lihat [Bentuk plugin](/id/plugins/architecture#plugin-shapes) untuk informasi lebih lanjut tentang model kapabilitas.

<Note>
Tanda `--json` menghasilkan laporan yang dapat dibaca mesin dan sesuai untuk pembuatan skrip serta audit. `inspect --all` merender tabel seluruh armada dengan kolom bentuk, jenis kapabilitas, pemberitahuan kompatibilitas, kapabilitas bundel, dan ringkasan hook. `info` merupakan alias untuk `inspect`.
</Note>

## Diagnosis

```bash
openclaw plugins doctor
```

`doctor` melaporkan kesalahan pemuatan plugin, diagnostik manifes/penemuan, pemberitahuan kompatibilitas, dan referensi konfigurasi plugin usang seperti slot plugin yang hilang. Jika pohon pemasangan dan konfigurasi plugin bersih, perintah ini mencetak `No plugin issues detected.` Jika konfigurasi usang masih tersisa tetapi pohon pemasangan lainnya sehat, ringkasan akan menyatakannya alih-alih menyiratkan bahwa plugin sepenuhnya sehat.

Jika plugin yang dikonfigurasi tersedia di disk tetapi diblokir oleh pemeriksaan keamanan jalur pemuat, validasi konfigurasi mempertahankan entri plugin dan melaporkannya sebagai `present but blocked`. Perbaiki diagnostik plugin terblokir sebelumnya, seperti kepemilikan jalur atau izin yang dapat ditulis semua pengguna, alih-alih menghapus konfigurasi `plugins.entries.<id>` atau `plugins.allow`.

Untuk kegagalan bentuk modul seperti ekspor `register`/`activate` yang hilang, jalankan ulang dengan `OPENCLAW_PLUGIN_LOAD_DEBUG=1` untuk menyertakan ringkasan ringkas bentuk ekspor dalam keluaran diagnostik.

## Registri

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Registri plugin lokal adalah model baca dingin persisten milik OpenClaw untuk identitas plugin yang terpasang, status pengaktifan, metadata sumber, dan kepemilikan kontribusi. Proses mulai normal, pencarian pemilik penyedia, klasifikasi penyiapan kanal, dan inventaris plugin dapat membacanya tanpa mengimpor modul runtime plugin.

Gunakan `plugins registry` untuk memeriksa apakah registri persisten tersedia, terkini, atau usang. Gunakan `--refresh` untuk membangunnya kembali dari indeks plugin persisten, kebijakan konfigurasi, dan metadata manifes/paket. Ini adalah jalur perbaikan, bukan jalur aktivasi runtime.

`openclaw doctor --fix` juga memperbaiki penyimpangan npm terkelola yang berdekatan dengan registri: jika paket `@openclaw/*` yatim atau dipulihkan di bawah proyek npm plugin terkelola atau akar npm terkelola datar lama menutupi plugin yang dibundel, doctor menghapus paket usang tersebut dan membangun ulang registri agar proses mulai melakukan validasi terhadap manifes yang dibundel. Doctor juga menautkan kembali paket `openclaw` hos ke plugin npm terkelola yang mendeklarasikan `peerDependencies.openclaw`, sehingga impor runtime lokal paket seperti `openclaw/plugin-sdk/*` dapat ditentukan setelah pembaruan atau perbaikan npm.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` adalah sakelar kompatibilitas darurat yang sudah usang untuk kegagalan pembacaan registri. Utamakan `plugins registry --refresh` atau `openclaw doctor --fix`; alternatif variabel lingkungan ini hanya untuk pemulihan proses mulai dalam keadaan darurat selama migrasi diluncurkan.
</Warning>

## Lokapasar

```bash
openclaw plugins marketplace entries
openclaw plugins marketplace entries --offline
openclaw plugins marketplace entries --json
openclaw plugins marketplace entries --feed-profile <name>
openclaw plugins marketplace entries --feed-url <url>
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
openclaw plugins marketplace refresh
openclaw plugins marketplace refresh --feed-profile <name>
openclaw plugins marketplace refresh --feed-url <url>
openclaw plugins marketplace refresh --expected-sha256 <sha256> --json
```

`plugins marketplace entries` mencantumkan entri dari umpan marketplace OpenClaw yang dikonfigurasi. Secara default, perintah ini mencoba menggunakan umpan yang dihosting dan beralih ke snapshot terbaru yang diterima atau data bawaan jika gagal. Gunakan `--feed-profile <name>` untuk membaca profil tertentu yang dikonfigurasi, `--feed-url <url>` untuk membaca URL umpan terhosting yang ditentukan secara eksplisit, dan `--offline` untuk membaca snapshot terbaru yang diterima tanpa mengambil umpan.

`plugins marketplace refresh` memperbarui snapshot umpan terhosting yang dikonfigurasi dan melaporkan apakah OpenClaw menerima data terhosting, snapshot terhosting, atau data cadangan bawaan. Gunakan `--expected-sha256` ketika pemanggil memerlukan perintah gagal kecuali payload terhosting terbaru cocok dengan checksum yang dipatok.

`list` marketplace menerima jalur marketplace lokal, jalur `marketplace.json`, singkatan GitHub seperti `owner/repo`, URL repositori GitHub, atau URL git. `--json` mencetak label sumber yang telah diselesaikan beserta manifes marketplace dan entri plugin yang telah diuraikan.

Pembaruan marketplace memuat umpan marketplace OpenClaw yang dihosting dan menyimpan respons yang telah divalidasi sebagai snapshot umpan terhosting lokal. Tanpa opsi, perintah ini menggunakan profil umpan default yang dikonfigurasi. Gunakan `--feed-profile <name>` untuk memperbarui profil tertentu yang dikonfigurasi, `--feed-url <url>` untuk memperbarui URL umpan terhosting yang ditentukan secara eksplisit, `--expected-sha256 <sha256>` untuk mewajibkan checksum payload yang cocok (`sha256:<hex>` atau digest heksadesimal polos sepanjang 64 karakter), dan `--json` untuk keluaran yang dapat dibaca mesin. URL umpan terhosting yang ditentukan secara eksplisit tidak boleh menyertakan kredensial, string kueri, atau fragmen. Pembaruan tanpa patokan dapat melaporkan hasil snapshot terhosting atau cadangan bawaan tanpa menggagalkan perintah. Pembaruan dengan patokan akan gagal kecuali menerima payload terhosting terbaru, dan pembaruan terhosting yang berhasil akan gagal jika OpenClaw tidak dapat menyimpan snapshot yang telah divalidasi.

## Terkait

- [Membangun plugin](/id/plugins/building-plugins)
- [Referensi CLI](/id/cli)
- [ClawHub](/clawhub)
