---
read_when:
    - Anda ingin menginstal atau mengelola plugin Gateway atau bundel yang kompatibel
    - Anda ingin membuat kerangka atau memvalidasi Plugin alat sederhana
    - Anda ingin men-debug kegagalan pemuatan plugin
sidebarTitle: Plugins
summary: Referensi CLI untuk `openclaw plugins` (inisialisasi, build, validasi, daftar, instalasi, marketplace, penghapusan instalasi, aktifkan/nonaktifkan, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-07-20T03:44:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8db98bf732151009ca09a38c0f56d6e9feb185812196fdfa946bc0949aa09d1f
    source_path: cli/plugins.md
    workflow: 16
---

Kelola Plugin Gateway, paket hook, dan bundel yang kompatibel.

<CardGroup cols={2}>
  <Card title="Sistem Plugin" href="/id/tools/plugin">
    Panduan pengguna akhir untuk menginstal, mengaktifkan, dan memecahkan masalah Plugin.
  </Card>
  <Card title="Kelola Plugin" href="/id/plugins/manage-plugins">
    Contoh singkat untuk menginstal, mencantumkan, memperbarui, menghapus instalasi, dan menerbitkan.
  </Card>
  <Card title="Bundel Plugin" href="/id/plugins/bundles">
    Model kompatibilitas bundel.
  </Card>
  <Card title="Manifes Plugin" href="/id/plugins/manifest">
    Bidang manifes dan skema konfigurasi.
  </Card>
  <Card title="Keamanan" href="/id/gateway/security">
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
openclaw plugins info <id>                    # alias untuk inspect
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
ke stderr dan menjaga agar keluaran JSON tetap dapat diurai. Lihat [Debugging](/id/help/debugging#plugin-lifecycle-trace).

<Note>
Dalam mode Nix (`OPENCLAW_NIX_MODE=1`), `openclaw.json` tidak dapat diubah. `install`, `update`, `uninstall`, `enable`, dan `disable` semuanya menolak untuk dijalankan. Sebagai gantinya, edit sumber Nix untuk instalasi ini (`programs.openclaw.config` atau `instances.<name>.config` untuk nix-openclaw), lalu bangun ulang. Lihat [Mulai Cepat](https://github.com/openclaw/nix-openclaw#quick-start) yang mengutamakan agen.
</Note>

<Note>
Plugin bawaan disertakan bersama OpenClaw. Beberapa diaktifkan secara default (misalnya penyedia model bawaan, penyedia suara bawaan, dan Plugin peramban bawaan); yang lain memerlukan `plugins enable`.

Plugin OpenClaw native menyertakan `openclaw.plugin.json` dengan Skema JSON sebaris (`configSchema`, meskipun kosong). Bundel yang kompatibel menggunakan manifes bundelnya sendiri.

`plugins list` menampilkan `Format: openclaw` atau `Format: bundle`. Keluaran daftar/info yang terperinci juga menampilkan subjenis bundel (`codex`, `claude`, atau `cursor`) beserta kemampuan bundel yang terdeteksi.
</Note>

## Membuat

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` membuat Plugin alat TypeScript minimal secara default. Argumen
pertama adalah id Plugin; `--name` menetapkan nama tampilan. OpenClaw menggunakan
id tersebut untuk direktori keluaran default dan penamaan paket. Kerangka alat menggunakan
`defineToolPlugin` dan menghasilkan skrip `package.json` `plugin:build` serta
`plugin:validate` yang melakukan pembangunan lalu memanggil `openclaw plugins build`/`validate`.

`plugins build` mengimpor titik masuk yang telah dibangun, membaca metadata alat statisnya, menulis
`openclaw.plugin.json`, dan menjaga `openclaw.extensions` milik `package.json` tetap selaras.
`plugins validate` memeriksa bahwa manifes yang dihasilkan, metadata paket, dan
ekspor titik masuk saat ini masih konsisten. Lihat [Plugin Alat](/id/plugins/tool-plugins) untuk
alur kerja penulisan lengkap.

Kerangka tersebut menulis sumber TypeScript, tetapi menghasilkan metadata dari titik masuk
`./dist/index.js` yang telah dibangun, sehingga alur kerja ini juga berfungsi dengan CLI yang diterbitkan. Gunakan
`--entry <path>` jika titik masuk bukan titik masuk paket default. Gunakan
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

Kerangka penyedia membuat Plugin penyedia model generik yang kompatibel dengan OpenAI,
dengan mekanisme autentikasi kunci API, skrip `npm run validate` yang menjalankan
`clawhub package validate`, metadata paket ClawHub, dan alur kerja GitHub Actions yang
dipicu secara manual untuk penerbitan tepercaya melalui GitHub
OIDC pada masa mendatang. Kerangka penyedia tidak menghasilkan Skills dan tidak menggunakan
`openclaw plugins build`/`validate`; perintah tersebut ditujukan untuk jalur metadata
yang dihasilkan milik kerangka alat.

Sebelum menerbitkan, ganti URL dasar API sementara, katalog model, rute dokumentasi,
teks kredensial, dan isi README dengan detail penyedia yang sebenarnya. Gunakan README
yang dihasilkan untuk penerbitan pertama kali di ClawHub dan penyiapan penerbit tepercaya.

## Instalasi

```bash
openclaw plugins search "calendar"                      # cari Plugin ClawHub
openclaw plugins install @openclaw/<package>            # katalog resmi tepercaya
openclaw plugins install <package>                       # paket npm apa pun
openclaw plugins install clawhub:<package>                # hanya ClawHub
openclaw plugins install npm:<package>                    # hanya npm
openclaw plugins install npm-pack:<path.tgz>               # tarball npm-pack lokal
openclaw plugins install git:github.com/<owner>/<repo>     # repositori git
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <path>                            # jalur atau arsip lokal
openclaw plugins install -l <path>                         # tautkan alih-alih menyalin
openclaw plugins install <plugin>@<marketplace>             # singkatan marketplace
openclaw plugins install <plugin> --marketplace <name>      # marketplace (eksplisit)
openclaw plugins install <package> --force                  # konfirmasi sumber / timpa yang ada
openclaw plugins install <package> --pin                    # sematkan versi npm yang dihasilkan
openclaw plugins install clawhub:<package> --acknowledge-clawhub-risk
openclaw plugins install <package> --dangerously-force-unsafe-install
```

Pengelola yang menguji instalasi pada waktu penyiapan dapat mengganti sumber instalasi
Plugin otomatis menggunakan variabel lingkungan yang dilindungi. Lihat
[Penggantian sumber instalasi Plugin](/id/plugins/install-overrides).

<Warning>
Nama paket tanpa awalan diinstal dari npm secara default selama peralihan peluncuran, kecuali jika cocok dengan id Plugin bawaan atau resmi; dalam hal tersebut, OpenClaw menggunakan salinan lokal/resmi itu alih-alih mengakses registri npm. Gunakan `npm:<package>` jika Anda sengaja menginginkan paket npm eksternal. Gunakan `clawhub:<package>` untuk ClawHub. Perlakukan instalasi Plugin seperti menjalankan kode; utamakan versi yang disematkan.
</Warning>

<Warning>
Paket ClawHub serta katalog bawaan/resmi OpenClaw merupakan sumber instalasi
tepercaya. Sumber baru berupa npm apa pun, `npm-pack:`, git, jalur/arsip lokal, atau
marketplace akan menampilkan peringatan dan meminta konfirmasi sebelum melanjutkan. Instalasi sumber apa pun
secara noninteraktif harus menyertakan `--force` setelah Anda meninjau dan memercayai sumbernya. Flag yang sama
menimpa target instalasi yang sudah ada bila diperlukan. Pembaruan biasa untuk instalasi
yang sudah dilacak tidak memerlukannya. Konfirmasi ini terpisah dari
`--acknowledge-clawhub-risk`, yang hanya berlaku untuk peringatan kepercayaan rilis ClawHub
yang berisiko. `--force` tidak melewati `security.installPolicy` atau pemeriksaan
keamanan instalasi lainnya.
</Warning>

`plugins search` meminta daftar paket `code-plugin` dan
`bundle-plugin` yang dapat diinstal dari ClawHub (bukan Skills; gunakan `openclaw skills search` untuk itu).
Nilai default `--limit` adalah 20, dengan batas maksimum 100. Perintah ini hanya membaca katalog jarak jauh: tanpa
inspeksi status lokal, mutasi konfigurasi, instalasi paket, atau pemuatan runtime
Plugin. Hasil mencakup nama paket ClawHub, keluarga, kanal, versi,
ringkasan, dan petunjuk instalasi seperti `openclaw plugins install clawhub:<package>`.

<Note>
ClawHub adalah sarana distribusi dan penemuan utama untuk sebagian besar Plugin. Npm
tetap didukung sebagai jalur cadangan dan instalasi langsung. Paket Plugin
`@openclaw/*` milik OpenClaw kembali diterbitkan di npm; lihat daftar terkini
di [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) atau
[inventaris Plugin](/id/plugins/plugin-inventory). Instalasi stabil menggunakan `latest`.
Instalasi dan pembaruan kanal beta mengutamakan dist-tag npm `beta` jika tersedia,
dengan `latest` sebagai cadangan. Pada kanal stabil-diperpanjang, Plugin npm resmi
dengan maksud tanpa awalan/default atau `latest` dihasilkan menjadi versi inti
terinstal yang persis sama. Penyematan eksak dan tag eksplisit selain `latest`, paket pihak ketiga, serta
sumber non-npm tidak ditulis ulang.
</Note>

<AccordionGroup>
  <Accordion title="Penyertaan konfigurasi dan perbaikan konfigurasi tidak valid">
    Jika bagian `plugins` Anda didukung oleh `$include` satu berkas, `plugins install/update/enable/disable/uninstall` menulis langsung ke berkas yang disertakan tersebut dan membiarkan `openclaw.json` tetap tidak tersentuh. Penyertaan akar, larik penyertaan, dan penyertaan dengan penggantian saudara akan gagal secara tertutup alih-alih diratakan. Lihat [Penyertaan konfigurasi](/id/gateway/configuration) untuk bentuk yang didukung.

    Jika konfigurasi tidak valid selama instalasi, `plugins install` biasanya gagal secara tertutup dan meminta Anda menjalankan `openclaw doctor --fix` terlebih dahulu. Saat Gateway dimulai dan dimuat ulang secara langsung, konfigurasi Plugin yang tidak valid gagal secara tertutup seperti konfigurasi tidak valid lainnya; `openclaw doctor --fix` dapat mengarantina entri Plugin yang tidak valid. Satu-satunya pengecualian waktu instalasi yang didokumentasikan adalah jalur pemulihan Plugin bawaan terbatas untuk Plugin yang secara eksplisit memilih `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="Konfirmasi --force serta instalasi ulang vs pembaruan">
    `--force` mengonfirmasi sumber non-ClawHub tanpa menampilkan permintaan konfirmasi. Ini tidak melewati `security.installPolicy` atau pemeriksaan keamanan instalasi lainnya. Jika Plugin atau paket hook sudah diinstal, perintah ini juga menggunakan kembali target yang ada dan menimpanya di tempat. Gunakan setelah meninjau sumber npm apa pun, lokal, arsip, git, atau marketplace, atau saat sengaja menginstal ulang id yang sama. Untuk peningkatan rutin Plugin npm yang sudah dilacak, utamakan `openclaw plugins update <id-or-npm-spec>`.

    Jika Anda menjalankan `plugins install` untuk id Plugin yang sudah diinstal, OpenClaw berhenti dan mengarahkan Anda ke `plugins update <id-or-npm-spec>` untuk peningkatan biasa, atau ke `plugins install <package> --force` jika Anda benar-benar ingin menimpa instalasi saat ini dari sumber lain. Sumber apa pun tetap menampilkan peringatan asal-usul interaktif; instalasi noninteraktif harus menyertakan `--force` setelah ditinjau. Sumber ClawHub tepercaya dan katalog OpenClaw tidak memerlukannya. Dengan `--link`, `--force` mengonfirmasi sumber tetapi tidak mengubah mode instalasi jalur tertaut.

  </Accordion>
  <Accordion title="Cakupan --pin">
    `--pin` hanya berlaku untuk instalasi npm dan mencatat `<name>@<version>` eksak yang dihasilkan. Opsi ini tidak didukung dengan instalasi `git:` (sebagai gantinya, sematkan ref dalam spesifikasi, misalnya `git:github.com/acme/plugin@v1.2.3`) atau dengan `--marketplace` (instalasi marketplace menyimpan metadata sumber marketplace alih-alih spesifikasi npm).
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` telah dihentikan dan kini tidak melakukan apa pun. OpenClaw tidak lagi menjalankan pemblokiran kode berbahaya bawaan pada waktu instalasi untuk instalasi Plugin.

    Gunakan permukaan `security.installPolicy` milik operator ketika kebijakan instalasi khusus host diperlukan. Hook `before_install` Plugin adalah hook siklus hidup runtime plugin, bukan batas kebijakan utama untuk instalasi CLI.

    Jika plugin yang Anda terbitkan di ClawHub disembunyikan atau diblokir oleh pemindaian registri, gunakan langkah penerbit dalam [Penerbitan ClawHub](/id/clawhub/publishing). `--dangerously-force-unsafe-install` tidak meminta ClawHub memindai ulang plugin atau menjadikan rilis yang diblokir tersedia untuk publik.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    Instalasi ClawHub komunitas memeriksa catatan kepercayaan rilis yang dipilih sebelum mengunduh. Jika ClawHub menonaktifkan pengunduhan untuk rilis tersebut, melaporkan temuan pemindaian berbahaya, atau menempatkan rilis dalam status moderasi yang memblokir (dikarantina, dicabut), OpenClaw menolaknya sepenuhnya terlepas dari flag ini. Untuk status pemindaian berisiko atau status moderasi yang tidak memblokir, OpenClaw menampilkan detail kepercayaan dan meminta konfirmasi sebelum melanjutkan.

    Gunakan `--acknowledge-clawhub-risk` hanya setelah meninjau peringatan ClawHub dan memutuskan untuk melanjutkan tanpa prompt interaktif. Hasil pemindaian yang tertunda atau kedaluwarsa (belum dinyatakan bersih) akan memunculkan peringatan, tetapi tidak memerlukan persetujuan. Paket resmi ClawHub dan sumber plugin bawaan OpenClaw sepenuhnya melewati pemeriksaan kepercayaan rilis ini.

  </Accordion>
  <Accordion title="Paket hook dan spesifikasi npm">
    `plugins install` juga merupakan permukaan instalasi untuk paket hook yang mengekspos `openclaw.hooks` di `package.json`. Gunakan `openclaw hooks` untuk visibilitas hook yang difilter dan pengaktifan per hook, bukan untuk instalasi paket.

    Spesifikasi npm **hanya untuk registri** (nama paket ditambah **versi persis** atau **dist-tag** opsional). Spesifikasi Git/URL/file dan rentang semver ditolak. Instalasi dependensi dijalankan dalam satu proyek npm terkelola per plugin dengan `--ignore-scripts` demi keamanan, bahkan ketika shell Anda memiliki pengaturan instalasi npm global. Proyek npm plugin terkelola mewarisi `overrides` npm tingkat paket milik OpenClaw, sehingga pin keamanan host juga berlaku untuk dependensi plugin yang diangkat.

    Gunakan `npm:<package>` agar resolusi npm bersifat eksplisit. Spesifikasi paket polos juga diinstal langsung dari npm selama peralihan peluncuran, kecuali cocok dengan id plugin resmi.

    Spesifikasi `@openclaw/*` mentah yang cocok dengan plugin bawaan akan diresolusikan ke salinan bawaan milik image sebelum fallback npm. Misalnya, `openclaw plugins install @openclaw/discord@2026.5.20 --pin` menggunakan plugin Discord bawaan dari build OpenClaw saat ini alih-alih membuat override npm terkelola. Untuk memaksa penggunaan paket npm eksternal, gunakan `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`.

    Spesifikasi polos dan `@latest` tetap berada di jalur stabil. Versi koreksi OpenClaw berstempel tanggal seperti `2026.5.3-1` dianggap stabil untuk pemeriksaan ini. Jika npm meresolusikan salah satu bentuk tersebut ke prarilis, OpenClaw berhenti dan meminta Anda menyetujuinya secara eksplisit dengan tag prarilis (`@beta`/`@rc`) atau versi prarilis persis (`@1.2.3-beta.4`).

    Untuk instalasi npm tanpa versi persis (`npm:<package>` atau `npm:<package>@latest`), OpenClaw memeriksa metadata paket yang diresolusikan sebelum instalasi. Jika paket stabil terbaru memerlukan API plugin OpenClaw atau versi host minimum yang lebih baru, OpenClaw memeriksa versi stabil yang lebih lama dan menginstal rilis kompatibel terbaru. Versi persis dan dist-tag eksplisit tetap ketat: pilihan yang tidak kompatibel akan gagal dan meminta Anda meningkatkan OpenClaw atau memilih versi yang kompatibel.

    Jika spesifikasi instalasi polos cocok dengan id plugin resmi (misalnya `diffs`), OpenClaw langsung menginstal entri katalog tersebut. Untuk menginstal paket npm dengan nama yang sama, gunakan spesifikasi scoped eksplisit (misalnya `@scope/diffs`).

  </Accordion>
  <Accordion title="Repositori Git">
    Gunakan `git:<repo>` untuk menginstal langsung dari repositori git. Bentuk yang didukung: `git:github.com/owner/repo`, `git:owner/repo`, `https://` lengkap, `ssh://`, `git://`, `file://`, dan URL clone `git@host:owner/repo.git`. Tambahkan `@<ref>` atau `#<ref>` untuk melakukan checkout branch, tag, atau commit sebelum instalasi.

    Instalasi Git melakukan clone ke direktori sementara, melakukan checkout ref yang diminta jika tersedia, lalu menggunakan penginstal direktori plugin normal, sehingga validasi manifes, kebijakan instalasi operator, pekerjaan instalasi pengelola paket, dan catatan instalasi berperilaku seperti instalasi npm. Instalasi git yang dicatat menyertakan URL/ref sumber beserta commit yang diresolusikan agar `openclaw plugins update` dapat meresolusikan ulang sumber tersebut nanti.

    Setelah menginstal dari git, gunakan `openclaw plugins inspect <id> --runtime --json` untuk memverifikasi pendaftaran runtime seperti metode Gateway dan perintah CLI. Jika plugin mendaftarkan root CLI dengan `api.registerCli`, jalankan perintah tersebut langsung melalui CLI root OpenClaw, misalnya `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Arsip">
    Arsip yang didukung: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Arsip plugin OpenClaw native harus berisi `openclaw.plugin.json` yang valid pada root plugin yang diekstrak; arsip yang hanya berisi `package.json` ditolak sebelum OpenClaw menulis catatan instalasi.

    Gunakan `npm-pack:<path.tgz>` ketika file tersebut merupakan tarball npm-pack dan Anda menginginkan
    jalur proyek npm terkelola per plugin yang sama seperti yang digunakan oleh instalasi registri,
    termasuk verifikasi `package-lock.json`, pemindaian dependensi yang diangkat,
    dan catatan instalasi npm. Jalur arsip biasa tetap diinstal sebagai arsip
    lokal di bawah root ekstensi plugin.

    Instalasi marketplace Claude juga didukung.

  </Accordion>
</AccordionGroup>

Instalasi ClawHub menggunakan pencari `clawhub:<package>` eksplisit:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Spesifikasi plugin polos yang aman untuk npm diinstal dari npm secara default selama peralihan peluncuran, kecuali cocok dengan id plugin resmi:

```bash
openclaw plugins install openclaw-codex-app-server
```

Gunakan `npm:` agar resolusi khusus npm bersifat eksplisit:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw memeriksa kompatibilitas API plugin / Gateway minimum yang diiklankan sebelum instalasi. Ketika versi ClawHub yang dipilih menerbitkan artefak ClawPack, OpenClaw mengunduh npm-pack `.tgz` berversi, memverifikasi header digest ClawHub dan digest artefak, lalu menginstalnya melalui jalur arsip normal. Versi ClawHub lama tanpa metadata ClawPack tetap diinstal melalui jalur verifikasi arsip paket lama. Instalasi yang dicatat mempertahankan metadata sumber ClawHub, jenis artefak, integritas npm, shasum npm, nama tarball, dan fakta digest ClawPack untuk pembaruan berikutnya.
Instalasi ClawHub tanpa versi mempertahankan spesifikasi tanpa versi yang dicatat agar `openclaw plugins update` dapat mengikuti rilis ClawHub yang lebih baru; pemilih versi atau tag eksplisit seperti `clawhub:pkg@1.2.3` dan `clawhub:pkg@beta` tetap dipasangkan ke pemilih tersebut.

### Singkatan marketplace

Gunakan singkatan `plugin@marketplace` ketika nama marketplace tersedia di cache registri lokal Claude pada `~/.claude/plugins/known_marketplaces.json`:

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
    - root marketplace lokal atau jalur `marketplace.json`
    - singkatan repositori GitHub seperti `owner/repo`
    - URL repositori GitHub seperti `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="Aturan marketplace jarak jauh">
    Untuk marketplace jarak jauh yang dimuat dari GitHub atau git, entri plugin harus tetap berada di dalam repositori marketplace yang di-clone. OpenClaw menerima sumber jalur relatif dari repositori tersebut dan menolak HTTP(S), jalur absolut, git, GitHub, serta sumber plugin nonjalur lainnya dari manifes jarak jauh.
  </Tab>
</Tabs>

Untuk jalur dan arsip lokal, OpenClaw mendeteksi secara otomatis:

- plugin OpenClaw native (`openclaw.plugin.json`)
- bundel yang kompatibel dengan Codex (`.codex-plugin/plugin.json`)
- bundel yang kompatibel dengan Claude (`.claude-plugin/plugin.json`, atau tata letak komponen Claude default ketika file manifes tersebut tidak ada)
- bundel yang kompatibel dengan Cursor (`.cursor-plugin/plugin.json`)

Instalasi lokal terkelola harus berupa direktori atau arsip plugin. File plugin mandiri `.js`,
`.mjs`, `.cjs`, dan `.ts` tidak disalin ke root plugin
terkelola oleh `plugins install`, maupun dimuat dengan menempatkannya langsung di
`~/.openclaw/extensions` atau `<workspace>/.openclaw/extensions`; root yang
ditemukan secara otomatis tersebut memuat direktori paket atau bundel plugin, dan melewati
file skrip tingkat atas sebagai pembantu lokal. Cantumkan file mandiri secara eksplisit di
`plugins.load.paths` sebagai gantinya.

<Note>
Bundel yang kompatibel diinstal ke root plugin normal dan mengikuti alur daftar/info/aktifkan/nonaktifkan yang sama. Saat ini, Skills bundel, Skills perintah Claude, default `settings.json` Claude, default `.lsp.json` Claude / `lspServers` yang dideklarasikan manifes, Skills perintah Cursor, serta direktori hook yang kompatibel dengan Codex didukung; kemampuan bundel lain yang terdeteksi ditampilkan dalam diagnostik/info, tetapi belum dihubungkan ke eksekusi runtime.
</Note>

Gunakan `-l`/`--link` untuk menunjuk ke direktori plugin lokal tanpa menyalinnya (menambahkan
ke `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

`--link` tidak didukung dengan instalasi `--marketplace` atau `git:`, dan
memerlukan jalur lokal yang sudah ada. Untuk tautan lokal noninteraktif,
teruskan `--force` setelah meninjau sumber; opsi ini mengonfirmasi asal-usul, tetapi tidak
menyalin atau menimpa direktori yang ditautkan.

<Note>
Plugin yang berasal dari workspace dan ditemukan dari root ekstensi workspace tidak
diimpor atau dieksekusi hingga diaktifkan secara eksplisit. Untuk pengembangan lokal,
jalankan `openclaw plugins enable <plugin-id>` atau atur
`plugins.entries.<plugin-id>.enabled: true`; jika konfigurasi Anda menggunakan
`plugins.allow`, sertakan juga id plugin yang sama di sana. Aturan gagal-tertutup ini
juga berlaku ketika penyiapan channel secara eksplisit menargetkan plugin yang berasal dari workspace untuk
pemuatan khusus penyiapan, sehingga kode penyiapan plugin channel lokal tidak akan berjalan selama
plugin workspace tersebut tetap dinonaktifkan atau dikecualikan dari daftar yang diizinkan. Instalasi tertaut
dan entri `plugins.load.paths` eksplisit mengikuti kebijakan normal untuk
asal plugin yang telah diresolusikan. Lihat
[Konfigurasikan kebijakan plugin](/id/tools/plugin#configure-plugin-policy)
dan [Referensi konfigurasi](/id/gateway/configuration-reference#plugins).

Gunakan `--pin` pada instalasi npm untuk menyimpan spesifikasi persis yang diresolusikan (`name@version`) dalam indeks plugin terkelola sambil mempertahankan perilaku default tanpa pin.
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
`plugins list` membaca registri plugin lokal yang dipersistenkan terlebih dahulu, dengan fallback turunan khusus manifes saat registri tidak ada atau tidak valid. Ini berguna untuk memeriksa apakah sebuah plugin terinstal, diaktifkan, dan terlihat oleh perencanaan startup dingin, tetapi bukan probe runtime langsung terhadap proses Gateway yang sudah berjalan. Setelah mengubah kode plugin, pengaktifan, kebijakan hook, atau `plugins.load.paths`, mulai ulang Gateway yang melayani kanal sebelum mengharapkan kode atau hook `register(api)` baru berjalan. Untuk deployment jarak jauh/kontainer, pastikan Anda memulai ulang proses anak `openclaw gateway run` yang sebenarnya, bukan hanya proses pembungkus.

`plugins list --json` menyertakan `dependencyStatus` setiap plugin dari `package.json`
`dependencies` dan `optionalDependencies`. OpenClaw memeriksa apakah nama paket tersebut
tersedia di sepanjang jalur pencarian `node_modules` Node normal milik plugin; OpenClaw
tidak mengimpor kode runtime plugin, menjalankan pengelola paket, atau memperbaiki
dependensi yang hilang.
</Note>

Jika startup mencatat `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`,
jalankan `openclaw plugins list --enabled --verbose` atau
`openclaw plugins inspect <id>` dengan id plugin yang tercantum untuk mengonfirmasi id
plugin dan salin id tepercaya ke `plugins.allow` dalam `openclaw.json`. Ketika
peringatan dapat mencantumkan setiap plugin yang ditemukan, peringatan tersebut mencetak cuplikan
`plugins.allow` siap-tempel yang sudah menyertakan id tersebut. Jika sebuah plugin dimuat
tanpa asal instalasi/jalur pemuatan, periksa id plugin tersebut, lalu sematkan
id tepercaya dalam `plugins.allow` atau instal ulang plugin dari sumber tepercaya
agar OpenClaw mencatat asal instalasi.

Untuk pekerjaan pada plugin bawaan di dalam image Docker terpaket, bind-mount direktori
sumber plugin di atas jalur sumber terpaket yang sesuai, seperti
`/app/extensions/synology-chat`. OpenClaw menemukan overlay sumber yang dipasang tersebut
sebelum `/app/dist/extensions/synology-chat`; direktori sumber yang hanya disalin
tetap tidak aktif, sehingga instalasi terpaket normal tetap menggunakan dist yang dikompilasi.

Untuk men-debug hook runtime:

- `openclaw plugins inspect <id> --runtime --json` menampilkan hook terdaftar dan diagnostik dari pemeriksaan dengan modul yang dimuat. Pemeriksaan runtime tidak pernah menginstal dependensi; gunakan `openclaw doctor --fix` untuk membersihkan status dependensi lama atau memulihkan plugin unduhan yang hilang dan dirujuk oleh konfigurasi.
- `openclaw gateway status --deep --require-rpc` mengonfirmasi URL/profil Gateway yang dapat dijangkau, petunjuk layanan/proses, jalur konfigurasi, dan kesehatan RPC.
- Hook percakapan nonbawaan (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) memerlukan `plugins.entries.<id>.hooks.allowConversationAccess=true`.

### Indeks plugin

Metadata instalasi plugin adalah status yang dikelola mesin, bukan konfigurasi pengguna. Instalasi dan pembaruan menuliskannya ke basis data status SQLite bersama di bawah direktori status OpenClaw yang aktif. Baris `installed_plugin_index` menyimpan metadata `installRecords` yang persisten, termasuk catatan untuk manifes plugin yang rusak atau hilang, serta cache registri dingin turunan manifes yang digunakan oleh `openclaw plugins update`, penghapusan instalasi, diagnostik, dan registri plugin dingin.

`plugins.installs` adalah permukaan konfigurasi buatan yang telah dihentikan. Runtime dan perintah pembaruan hanya membaca indeks plugin terinstal SQLite. Jalankan `openclaw doctor --fix` untuk mengimpor catatan konfigurasi lama ke indeks dan menghapus kunci yang telah dihentikan sebelum penggunaan runtime normal.

## Hapus instalasi

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
openclaw plugins uninstall <id> --force
```

`uninstall` menghapus catatan plugin dari `plugins.entries`, indeks plugin yang dipersistenkan, entri daftar izinkan/tolak plugin, dan entri `plugins.load.paths` tertaut jika berlaku. Kecuali `--keep-files` ditetapkan, penghapusan instalasi juga menghapus direktori instalasi terkelola yang dilacak, tetapi hanya jika jalurnya berada di dalam root ekstensi plugin OpenClaw. Jika plugin saat ini memiliki slot `memory` atau `contextEngine`, slot tersebut direset ke nilai defaultnya (`memory-core` untuk memori, `legacy` untuk mesin konteks).

`uninstall` mencetak pratinjau hal yang akan dihapus, lalu meminta `Uninstall plugin "<id>"?` sebelum melakukan perubahan. Teruskan `--force` untuk melewati permintaan konfirmasi (berguna untuk skrip dan eksekusi noninteraktif); tanpanya, penghapusan instalasi memerlukan TTY interaktif. `--dry-run` mencetak pratinjau yang sama dan keluar tanpa meminta konfirmasi atau mengubah apa pun.

<Note>
`--keep-config` didukung sebagai alias usang untuk `--keep-files`.
</Note>

## Perbarui

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update @acme/demo
openclaw plugins update openclaw-codex-app-server --acknowledge-clawhub-risk
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Pembaruan berlaku untuk instalasi plugin yang dilacak dalam indeks plugin terkelola dan instalasi paket hook yang dilacak dalam `hooks.internal.installs`. Pembaruan menggunakan kembali sumber yang telah dipilih pengguna saat menginstal plugin, sehingga tidak memerlukan konfirmasi sumber kedua.

<AccordionGroup>
  <Accordion title="Menyelesaikan id plugin vs spesifikasi npm">
    Saat Anda meneruskan id plugin, OpenClaw menggunakan kembali spesifikasi instalasi yang tercatat untuk plugin tersebut. Artinya, dist-tag yang disimpan sebelumnya seperti `@beta` dan versi persis yang disematkan tetap digunakan pada eksekusi `update <id>` berikutnya.

    Selama `update <id> --dry-run`, instalasi npm dengan versi persis yang disematkan tetap tersemat. Jika OpenClaw juga dapat menyelesaikan jalur default registri paket dan jalur default tersebut lebih baru daripada versi tersemat yang terinstal, uji coba melaporkan penyematan tersebut dan mencetak perintah pembaruan paket `@latest` secara eksplisit untuk mengikuti jalur default registri.

    Aturan pembaruan tertarget tersebut berbeda dari jalur pemeliharaan massal `openclaw plugins update --all`. Pembaruan massal tetap mematuhi spesifikasi instalasi terlacak biasa, tetapi catatan plugin OpenClaw resmi yang tepercaya dapat disinkronkan ke target katalog resmi saat ini alih-alih tetap menggunakan paket resmi persis yang usang. Gunakan `update <id>` tertarget saat Anda sengaja ingin mempertahankan spesifikasi resmi persis atau bertag tanpa perubahan.

    Untuk instalasi npm, Anda juga dapat meneruskan spesifikasi paket npm eksplisit dengan dist-tag atau versi persis. OpenClaw menyelesaikan nama paket tersebut kembali ke catatan plugin yang dilacak, memperbarui plugin yang terinstal, dan mencatat spesifikasi npm baru untuk pembaruan berbasis id mendatang.

    Meneruskan nama paket npm tanpa versi atau tag juga menyelesaikannya kembali ke catatan plugin yang dilacak. Gunakan ini saat plugin disematkan ke versi persis dan Anda ingin memindahkannya kembali ke jalur rilis default registri.

  </Accordion>
  <Accordion title="Pembaruan kanal beta">
    `openclaw plugins update <id-or-npm-spec>` tertarget menggunakan kembali spesifikasi plugin yang dilacak kecuali Anda meneruskan spesifikasi baru. `openclaw plugins update --all` massal menggunakan `update.channel` yang dikonfigurasi saat menyinkronkan catatan plugin resmi tepercaya ke target katalog resmi, sehingga instalasi kanal beta dapat tetap berada di jalur rilis beta alih-alih dinormalisasi secara diam-diam ke stabil/terbaru.

    `openclaw update` juga mengetahui kanal pembaruan OpenClaw yang aktif: pada kanal beta, catatan plugin npm jalur default dan ClawHub mencoba `@beta` terlebih dahulu. Catatan tersebut kembali ke spesifikasi default/terbaru yang tercatat jika tidak ada rilis beta plugin; plugin npm juga kembali jika paket beta tersedia tetapi gagal dalam validasi instalasi. Fallback tersebut dilaporkan sebagai peringatan dan tidak menggagalkan pembaruan inti. Versi persis dan tag eksplisit tetap tersemat ke pemilih tersebut untuk pembaruan tertarget.

  </Accordion>
  <Accordion title="Pemeriksaan versi dan penyimpangan integritas">
    Sebelum pembaruan npm langsung, OpenClaw memeriksa versi paket yang terinstal terhadap metadata registri npm. Jika versi terinstal dan identitas artefak yang tercatat sudah cocok dengan target yang diselesaikan, pembaruan dilewati tanpa mengunduh, menginstal ulang, atau menulis ulang `openclaw.json`.

    Jika hash integritas tersimpan tersedia dan hash artefak yang diambil berubah, OpenClaw memperlakukannya sebagai penyimpangan artefak npm. Perintah interaktif `openclaw plugins update` mencetak hash yang diharapkan dan hash aktual, lalu meminta konfirmasi sebelum melanjutkan. Pembantu pembaruan noninteraktif gagal secara tertutup kecuali pemanggil menyediakan kebijakan kelanjutan eksplisit.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install pada pembaruan">
    `--dangerously-force-unsafe-install` juga diterima pada `plugins update` untuk kompatibilitas, tetapi sudah usang dan tidak lagi mengubah perilaku pembaruan plugin. `security.installPolicy` operator tetap dapat memblokir pembaruan; hook `before_install` plugin hanya berlaku dalam proses tempat hook plugin dimuat.
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk pada pembaruan">
    Pembaruan plugin komunitas berbasis ClawHub menjalankan pemeriksaan kepercayaan rilis persis yang sama seperti instalasi sebelum mengunduh paket pengganti. Gunakan `--acknowledge-clawhub-risk` untuk otomatisasi yang telah ditinjau dan harus dilanjutkan saat rilis ClawHub terpilih memiliki peringatan kepercayaan berisiko. Paket ClawHub resmi dan sumber plugin OpenClaw bawaan melewati permintaan kepercayaan rilis ini.
  </Accordion>
</AccordionGroup>

## Periksa

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
```

Pemeriksaan menampilkan identitas, status pemuatan, sumber, kapabilitas manifes, flag kebijakan, diagnostik, metadata instalasi, kapabilitas bundel, dan dukungan server MCP atau LSP yang terdeteksi tanpa mengimpor runtime plugin secara default. Keluaran JSON menyertakan kontrak manifes plugin, seperti `contracts.agentToolResultMiddleware` dan `contracts.trustedToolPolicies`, sehingga operator dapat mengaudit deklarasi permukaan tepercaya sebelum mengaktifkan atau memulai ulang plugin. Tambahkan `--runtime` untuk memuat modul plugin dan menyertakan hook, alat, perintah, layanan, metode gateway, dan rute HTTP yang terdaftar. Pemeriksaan runtime melaporkan dependensi plugin yang hilang secara langsung; instalasi dan perbaikan tetap dilakukan dalam `openclaw plugins install`, `openclaw plugins update`, dan `openclaw doctor --fix`.

Perintah CLI milik plugin biasanya diinstal sebagai grup perintah `openclaw` root, tetapi plugin juga dapat mendaftarkan perintah bertingkat di bawah induk inti seperti `openclaw nodes`. Setelah `inspect --runtime` menampilkan perintah di bawah `cliCommands`, jalankan pada jalur yang tercantum; misalnya, plugin yang mendaftarkan `demo-git` dapat diverifikasi dengan `openclaw demo-git ping`.

Setiap plugin diklasifikasikan berdasarkan hal yang sebenarnya didaftarkan saat runtime:

| Bentuk               | Arti                                                           |
| ------------------- | ----------------------------------------------------------------- |
| `plain-capability`  | tepat satu jenis kapabilitas (mis. plugin khusus penyedia)         |
| `hybrid-capability` | lebih dari satu jenis kapabilitas (mis. teks + ucapan + gambar)       |
| `hook-only`         | hanya hook, tanpa kapabilitas, alat, perintah, layanan, atau rute |
| `non-capability`    | alat/perintah/layanan tetapi tanpa kapabilitas                       |

Lihat [Bentuk plugin](/id/plugins/architecture#plugin-shapes) untuk informasi selengkapnya tentang model kapabilitas.

<Note>
Flag `--json` menghasilkan laporan yang dapat dibaca mesin dan cocok untuk skrip serta audit. `inspect --all` merender tabel seluruh armada dengan kolom bentuk, jenis kapabilitas, pemberitahuan kompatibilitas, kapabilitas bundel, dan ringkasan hook. `info` adalah alias untuk `inspect`.
</Note>

## Doctor

```bash
openclaw plugins doctor
```

`doctor` melaporkan kesalahan pemuatan plugin, diagnostik manifes/penemuan, pemberitahuan kompatibilitas, dan referensi konfigurasi plugin usang seperti slot plugin yang hilang. Jika pohon instalasi dan konfigurasi plugin bersih, perintah tersebut mencetak `No plugin issues detected.` Jika konfigurasi usang masih ada tetapi pohon instalasi sehat, ringkasan menyatakannya alih-alih menyiratkan kesehatan plugin sepenuhnya.

Jika plugin yang dikonfigurasi tersedia di disk tetapi diblokir oleh pemeriksaan keamanan jalur milik pemuat, validasi konfigurasi mempertahankan entri plugin tersebut dan melaporkannya sebagai `present but blocked`. Perbaiki diagnostik plugin yang diblokir sebelumnya, seperti kepemilikan jalur atau izin yang dapat ditulis oleh semua pengguna, alih-alih menghapus konfigurasi `plugins.entries.<id>` atau `plugins.allow`.

Untuk kegagalan bentuk modul seperti ekspor `register`/`activate` yang tidak ada, jalankan kembali dengan `OPENCLAW_PLUGIN_LOAD_DEBUG=1` untuk menyertakan ringkasan ringkas bentuk ekspor dalam keluaran diagnostik.

## Registri

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Registri plugin lokal adalah model pembacaan dingin persisten milik OpenClaw untuk identitas plugin yang terinstal, status pengaktifan, metadata sumber, dan kepemilikan kontribusi. Proses mulai normal, pencarian pemilik penyedia, klasifikasi penyiapan saluran, dan inventaris plugin dapat membacanya tanpa mengimpor modul runtime plugin.

Gunakan `plugins registry` untuk memeriksa apakah registri persisten tersedia, terkini, atau kedaluwarsa. Gunakan `--refresh` untuk membangunnya kembali dari indeks plugin persisten, kebijakan konfigurasi, dan metadata manifes/paket. Ini adalah jalur perbaikan, bukan jalur aktivasi runtime.

`openclaw doctor --fix` juga memperbaiki penyimpangan npm terkelola yang berdekatan dengan registri. Jika paket `@openclaw/*` yang terlantar atau dipulihkan di bawah proyek npm plugin terkelola atau root npm terkelola datar warisan membayangi plugin bawaan, doctor menghapus paket usang tersebut dan membangun kembali registri agar proses mulai melakukan validasi terhadap manifes bawaan. Ketika catatan instalasi otoritatif memilih satu generasi terkelola tetapi direktori datar atau generasi yang lebih lama tetap ada, doctor menonaktifkan pohon usang tersebut agar dipangkas setelah Gateway dimulai ulang. Doctor juga menautkan kembali paket host `openclaw` ke dalam plugin npm terkelola yang mendeklarasikan `peerDependencies.openclaw`, sehingga impor runtime lokal paket seperti `openclaw/plugin-sdk/*` dapat diselesaikan setelah pembaruan atau perbaikan npm.

## Marketplace

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

`plugins marketplace entries` mencantumkan entri dari umpan marketplace OpenClaw yang dikonfigurasi. Secara default, perintah ini mencoba umpan yang di-host dan beralih ke snapshot terbaru yang diterima atau data bawaan jika gagal. Gunakan `--feed-profile <name>` untuk membaca profil tertentu yang dikonfigurasi, `--feed-url <url>` untuk membaca URL umpan yang di-host secara eksplisit, dan `--offline` untuk membaca snapshot terbaru yang diterima tanpa mengambil umpan.

`plugins marketplace refresh` menyegarkan snapshot umpan yang di-host dan dikonfigurasi serta melaporkan apakah OpenClaw menerima data yang di-host, snapshot yang di-host, atau data fallback bawaan. Gunakan `--expected-sha256` ketika pemanggil mengharuskan perintah gagal kecuali payload baru yang di-host cocok dengan checksum yang ditetapkan.

`list` marketplace menerima jalur marketplace lokal, jalur `marketplace.json`, bentuk singkat GitHub seperti `owner/repo`, URL repositori GitHub, atau URL git. `--json` mencetak label sumber yang telah diuraikan beserta manifes marketplace dan entri plugin yang telah diurai.

Penyegaran marketplace memuat umpan marketplace OpenClaw yang di-host dan menyimpan
respons tervalidasi sebagai snapshot umpan yang di-host lokal. Tanpa opsi, perintah ini menggunakan
profil umpan default yang dikonfigurasi. Gunakan `--feed-profile <name>` untuk menyegarkan
profil tertentu yang dikonfigurasi, `--feed-url <url>` untuk menyegarkan URL
umpan yang di-host secara eksplisit, `--expected-sha256 <sha256>` untuk mewajibkan checksum payload yang cocok
(`sha256:<hex>` atau digest heksadesimal polos sepanjang 64 karakter), dan `--json` untuk
keluaran yang dapat dibaca mesin. URL umpan yang di-host secara eksplisit tidak boleh menyertakan
kredensial, string kueri, atau fragmen. Penyegaran tanpa penetapan checksum dapat melaporkan hasil
snapshot yang di-host atau fallback bawaan tanpa menggagalkan perintah. Penyegaran
dengan penetapan checksum gagal kecuali menerima payload baru yang di-host, dan penyegaran
yang di-host dan berhasil akan gagal jika OpenClaw tidak dapat menyimpan snapshot tervalidasi.

## Terkait

- [Membangun plugin](/id/plugins/building-plugins)
- [Referensi CLI](/id/cli)
- [ClawHub](/id/clawhub)
