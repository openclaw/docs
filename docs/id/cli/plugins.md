---
read_when:
    - Anda ingin memasang atau mengelola Plugin Gateway atau bundel yang kompatibel
    - Anda ingin membuat scaffold atau memvalidasi Plugin alat sederhana
    - Anda ingin men-debug kegagalan pemuatan plugin
sidebarTitle: Plugins
summary: Referensi CLI untuk `openclaw plugins` (init, build, validate, list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-06-28T20:42:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a703adb93af2490282f73b25cbbd95c7bc1d54c9c9c656fdb9b75465683f4ec8
    source_path: cli/plugins.md
    workflow: 16
---

Kelola Plugin Gateway, paket hook, dan bundel yang kompatibel.

<CardGroup cols={2}>
  <Card title="Sistem Plugin" href="/id/tools/plugin">
    Panduan pengguna akhir untuk menginstal, mengaktifkan, dan memecahkan masalah Plugin.
  </Card>
  <Card title="Kelola Plugin" href="/id/plugins/manage-plugins">
    Contoh cepat untuk instal, daftar, perbarui, hapus instalasi, dan publikasi.
  </Card>
  <Card title="Bundel Plugin" href="/id/plugins/bundles">
    Model kompatibilitas bundel.
  </Card>
  <Card title="Manifest Plugin" href="/id/plugins/manifest">
    Bidang manifest dan skema config.
  </Card>
  <Card title="Keamanan" href="/id/gateway/security">
    Penguatan keamanan untuk instalasi Plugin.
  </Card>
</CardGroup>

## Perintah

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search <query>
openclaw plugins search <query> --limit 20
openclaw plugins search <query> --json
openclaw plugins install <path-or-spec>
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
openclaw plugins info <id>
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
openclaw plugins marketplace refresh
openclaw plugins marketplace refresh --feed-profile clawhub-public --json
openclaw plugins marketplace refresh --feed-url https://clawhub.ai/v1/feeds/plugins --expected-sha256 <sha256>
openclaw plugins init my-tool --name "My Tool"
openclaw plugins init my-provider --name "My Provider" --type provider
openclaw plugins init my-provider --name "My Provider" --type provider --directory ./my-provider
openclaw plugins build --entry ./dist/index.js
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
```

Untuk investigasi instalasi, inspeksi, penghapusan instalasi, atau refresh registry yang lambat, jalankan
perintah dengan `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Trace menulis timing fase
ke stderr dan menjaga output JSON tetap dapat di-parse. Lihat [Debugging](/id/help/debugging#plugin-lifecycle-trace).

<Note>
Dalam mode Nix (`OPENCLAW_NIX_MODE=1`), mutator siklus hidup Plugin dinonaktifkan. Gunakan sumber Nix untuk instalasi ini alih-alih `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable`, atau `plugins disable`; untuk nix-openclaw, gunakan [Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) yang mengutamakan agen.
</Note>

<Note>
Plugin bawaan dikirim bersama OpenClaw. Sebagian diaktifkan secara default (misalnya penyedia model bawaan, penyedia speech bawaan, dan Plugin browser bawaan); yang lain memerlukan `plugins enable`.

Plugin OpenClaw native harus mengirim `openclaw.plugin.json` dengan JSON Schema inline (`configSchema`, meskipun kosong). Bundel yang kompatibel menggunakan manifest bundelnya sendiri.

`plugins list` menampilkan `Format: openclaw` atau `Format: bundle`. Output daftar/info verbose juga menampilkan subtipe bundel (`codex`, `claude`, atau `cursor`) beserta kapabilitas bundel yang terdeteksi.
</Note>

### Penulis

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` membuat Plugin alat TypeScript minimal secara default. Argumen pertama
adalah id Plugin; berikan `--name` untuk nama tampilan. OpenClaw menggunakan
id untuk direktori output default dan penamaan package. Scaffold alat menggunakan
`defineToolPlugin`.
`plugins build` mengimpor entry hasil build, membaca metadata alat statisnya, menulis
`openclaw.plugin.json`, dan menjaga `package.json` `openclaw.extensions` tetap selaras.
`plugins validate` memeriksa bahwa manifest yang dihasilkan, metadata package, dan
export entry saat ini masih sesuai. Lihat [Tool Plugins](/id/plugins/tool-plugins) untuk
alur kerja penulisan alat lengkap.

Scaffold menulis sumber TypeScript tetapi menghasilkan metadata dari entry hasil build
`./dist/index.js`, sehingga alur kerja juga berfungsi dengan CLI yang dipublikasikan. Gunakan
`--entry <path>` ketika entry bukan entry package default. Gunakan
`plugins build --check` di CI agar gagal ketika metadata yang dihasilkan sudah usang tanpa
menulis ulang file.

### Scaffold Penyedia

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

Scaffold penyedia membuat Plugin penyedia teks/model generik dengan plumbing kunci API
yang kompatibel dengan OpenAI, skrip `npm run validate` bawaan untuk `clawhub package
validate`, metadata package ClawHub, dan workflow GitHub yang dijalankan manual
untuk publikasi tepercaya di masa depan melalui GitHub Actions OIDC. Scaffold penyedia tidak
menghasilkan Skills dan tidak menggunakan `openclaw plugins build` atau
`openclaw plugins validate`; perintah tersebut ditujukan untuk jalur metadata yang dihasilkan
oleh scaffold alat.

Sebelum memublikasikan, ganti URL basis API placeholder, katalog model, rute docs,
teks kredensial, dan salinan README dengan detail penyedia nyata. Gunakan
README yang dihasilkan untuk publikasi ClawHub pertama kali dan penyiapan penerbit tepercaya.

### Instal

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # source auto-detection
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install npm-pack:<path.tgz>            # local npm pack through npm install semantics
openclaw plugins install git:github.com/<owner>/<repo>  # git repo
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install clawhub:<package> --acknowledge-clawhub-risk
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

Maintainer yang menguji instalasi saat penyiapan dapat mengganti sumber instalasi Plugin otomatis
dengan variabel lingkungan berpagar. Lihat
[Override instalasi Plugin](/id/plugins/install-overrides).

<Warning>
Nama package polos diinstal dari npm secara default selama transisi peluncuran, kecuali cocok dengan id Plugin resmi. Spec package `@openclaw/*` mentah yang cocok dengan Plugin bawaan menggunakan salinan bawaan yang dikirim bersama build OpenClaw saat ini. Gunakan `npm:<package>` ketika Anda sengaja menginginkan package npm eksternal sebagai gantinya. Gunakan `clawhub:<package>` untuk ClawHub. Perlakukan instalasi Plugin seperti menjalankan kode. Utamakan versi yang dipin.
</Warning>

`plugins search` menanyakan ClawHub untuk package Plugin yang dapat diinstal dan mencetak
nama package yang siap diinstal. Ini mencari package code-plugin dan bundle-plugin,
bukan Skills. Gunakan `openclaw skills search` untuk Skills ClawHub.

<Note>
ClawHub adalah permukaan distribusi dan penemuan utama untuk sebagian besar Plugin. Npm
tetap menjadi fallback yang didukung dan jalur instalasi langsung. Package Plugin
`@openclaw/*` milik OpenClaw dipublikasikan di npm lagi; lihat daftar saat ini
di [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) atau
[inventaris Plugin](/id/plugins/plugin-inventory). Instalasi stabil menggunakan `latest`.
Instalasi dan pembaruan kanal beta mengutamakan dist-tag npm `beta` ketika tag tersebut
tersedia, lalu fallback ke `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Config includes dan perbaikan config tidak valid">
    Jika bagian `plugins` Anda didukung oleh `$include` satu file, `plugins install/update/enable/disable/uninstall` menulis melalui file include tersebut dan membiarkan `openclaw.json` tidak tersentuh. Include root, array include, dan include dengan override saudara gagal tertutup alih-alih diratakan. Lihat [Config includes](/id/gateway/configuration) untuk bentuk yang didukung.

    Jika config tidak valid saat instalasi, `plugins install` biasanya gagal tertutup dan meminta Anda menjalankan `openclaw doctor --fix` terlebih dahulu. Saat startup Gateway dan hot reload, config Plugin yang tidak valid gagal tertutup seperti config tidak valid lainnya; `openclaw doctor --fix` dapat mengarantina entri Plugin yang tidak valid. Satu-satunya pengecualian terdokumentasi saat instalasi adalah jalur pemulihan Plugin bawaan yang sempit untuk Plugin yang secara eksplisit memilih ikut `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force dan instal ulang vs pembaruan">
    `--force` menggunakan ulang target instalasi yang ada dan menimpa Plugin atau paket hook yang sudah terinstal di tempat. Gunakan ini ketika Anda sengaja menginstal ulang id yang sama dari path lokal baru, arsip, package ClawHub, atau artefak npm. Untuk upgrade rutin Plugin npm yang sudah dilacak, utamakan `openclaw plugins update <id-or-npm-spec>`.

    Jika Anda menjalankan `plugins install` untuk id Plugin yang sudah terinstal, OpenClaw berhenti dan mengarahkan Anda ke `plugins update <id-or-npm-spec>` untuk upgrade normal, atau ke `plugins install <package> --force` ketika Anda benar-benar ingin menimpa instalasi saat ini dari sumber yang berbeda.

  </Accordion>
  <Accordion title="Cakupan --pin">
    `--pin` hanya berlaku untuk instalasi npm. Ini tidak didukung dengan instalasi `git:`; gunakan ref git eksplisit seperti `git:github.com/acme/plugin@v1.2.3` ketika Anda menginginkan sumber yang dipin. Ini tidak didukung dengan `--marketplace`, karena instalasi marketplace mempertahankan metadata sumber marketplace alih-alih spec npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` tidak digunakan lagi dan kini menjadi no-op. OpenClaw tidak lagi menjalankan pemblokiran kode berbahaya bawaan saat instalasi untuk instalasi Plugin.

    Gunakan permukaan `security.installPolicy` bersama yang dimiliki operator ketika kebijakan instalasi spesifik host diperlukan. Hook `before_install` Plugin adalah hook siklus hidup runtime Plugin dan bukan batas kebijakan utama untuk instalasi CLI.

    Jika Plugin yang Anda publikasikan di ClawHub disembunyikan atau diblokir oleh pemindaian registry, gunakan langkah penerbit di [Publikasi ClawHub](/id/clawhub/publishing). `--dangerously-force-unsafe-install` tidak meminta ClawHub memindai ulang Plugin atau membuat rilis yang diblokir menjadi publik.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    Instalasi ClawHub komunitas memeriksa catatan kepercayaan rilis yang dipilih sebelum mengunduh package. Jika ClawHub menonaktifkan unduhan untuk rilis, melaporkan temuan pemindaian berbahaya, atau menempatkan rilis dalam status moderasi yang memblokir seperti karantina, OpenClaw menolak rilis tersebut. Untuk status pemindaian berisiko yang tidak memblokir, status moderasi berisiko, atau alasan registry, OpenClaw menampilkan detail kepercayaan dan meminta konfirmasi sebelum melanjutkan.

    Gunakan `--acknowledge-clawhub-risk` hanya setelah meninjau peringatan ClawHub dan memutuskan untuk melanjutkan tanpa prompt interaktif. Catatan kepercayaan bersih yang tertunda atau usang memperingatkan tetapi tidak memerlukan pengakuan. Package ClawHub resmi dan sumber Plugin OpenClaw bawaan melewati prompt kepercayaan rilis ini.

  </Accordion>
  <Accordion title="Paket hook dan spec npm">
    `plugins install` juga merupakan permukaan instalasi untuk paket hook yang mengekspos `openclaw.hooks` di `package.json`. Gunakan `openclaw hooks` untuk visibilitas hook terfilter dan pengaktifan per hook, bukan instalasi package.

    Spesifikasi npm bersifat **hanya registry** (nama paket + **versi persis** opsional atau **dist-tag**). Spesifikasi Git/URL/file dan rentang semver ditolak. Instalasi dependensi berjalan dalam satu proyek npm terkelola per Plugin dengan `--ignore-scripts` demi keamanan, bahkan ketika shell Anda memiliki pengaturan instal npm global. Proyek npm Plugin terkelola mewarisi `overrides` npm tingkat paket milik OpenClaw, sehingga pin keamanan host juga berlaku untuk dependensi Plugin yang di-hoist.

    Gunakan `npm:<package>` ketika Anda ingin membuat resolusi npm eksplisit. Spesifikasi paket polos juga diinstal langsung dari npm selama cutover peluncuran kecuali cocok dengan id Plugin resmi.

    Spesifikasi paket mentah `@openclaw/*` yang cocok dengan Plugin bawaan akan diselesaikan ke salinan bawaan milik image sebelum fallback npm. Misalnya, `openclaw plugins install @openclaw/discord@2026.5.20 --pin` menggunakan Plugin Discord bawaan dari build OpenClaw saat ini, bukan membuat override npm terkelola. Untuk memaksa paket npm eksternal, gunakan `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`.

    Spesifikasi polos dan `@latest` tetap berada di jalur stabil. Versi koreksi OpenClaw bercap tanggal seperti `2026.5.3-1` adalah rilis stabil untuk pemeriksaan ini. Jika npm menyelesaikan salah satunya ke prerelease, OpenClaw berhenti dan meminta Anda ikut serta secara eksplisit dengan tag prerelease seperti `@beta`/`@rc` atau versi prerelease persis seperti `@1.2.3-beta.4`.

    Untuk instalasi npm tanpa versi persis (`npm:<package>` atau `npm:<package>@latest`), OpenClaw memeriksa metadata paket yang diselesaikan sebelum instalasi. Jika paket stabil terbaru memerlukan API Plugin OpenClaw yang lebih baru atau versi host minimum, OpenClaw memeriksa versi stabil yang lebih lama dan menginstal rilis kompatibel terbaru sebagai gantinya. Versi persis dan dist-tag eksplisit seperti `@beta` tetap ketat: jika paket yang dipilih tidak kompatibel, perintah gagal dan meminta Anda meningkatkan OpenClaw atau memilih versi yang kompatibel.

    Jika spesifikasi instal polos cocok dengan id Plugin resmi (misalnya `diffs`), OpenClaw menginstal entri katalog secara langsung. Untuk menginstal paket npm dengan nama yang sama, gunakan spesifikasi scoped eksplisit (misalnya `@scope/diffs`).

  </Accordion>
  <Accordion title="Git repositories">
    Gunakan `git:<repo>` untuk menginstal langsung dari repositori git. Bentuk yang didukung mencakup URL clone `git:github.com/owner/repo`, `git:owner/repo`, `https://` lengkap, `ssh://`, `git://`, `file://`, dan `git@host:owner/repo.git`. Tambahkan `@<ref>` atau `#<ref>` untuk melakukan checkout branch, tag, atau commit sebelum instalasi.

    Instalasi Git melakukan clone ke direktori sementara, melakukan checkout ref yang diminta jika ada, lalu menggunakan penginstal direktori Plugin normal. Itu berarti validasi manifest, kebijakan instal operator, pekerjaan instal package manager, dan catatan instal berperilaku seperti instalasi npm. Instalasi git yang dicatat menyertakan URL/ref sumber beserta commit yang diselesaikan agar `openclaw plugins update` dapat menyelesaikan ulang sumber tersebut nanti.

    Setelah menginstal dari git, gunakan `openclaw plugins inspect <id> --runtime --json` untuk memverifikasi registrasi runtime seperti metode gateway dan perintah CLI. Jika Plugin mendaftarkan root CLI dengan `api.registerCli`, jalankan perintah itu langsung melalui CLI root OpenClaw, misalnya `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archives">
    Arsip yang didukung: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Arsip Plugin OpenClaw native harus berisi `openclaw.plugin.json` yang valid di root Plugin hasil ekstraksi; arsip yang hanya berisi `package.json` ditolak sebelum OpenClaw menulis catatan instal.

    Gunakan `npm-pack:<path.tgz>` ketika file adalah tarball npm-pack dan Anda ingin
    menguji jalur proyek npm terkelola per Plugin yang sama dengan yang digunakan oleh instalasi
    registry, termasuk verifikasi `package-lock.json`, pemindaian dependensi yang di-hoist,
    dan catatan instal npm. Jalur arsip biasa tetap diinstal sebagai arsip lokal
    di bawah root ekstensi Plugin.

    Instalasi marketplace Claude juga didukung.

  </Accordion>
</AccordionGroup>

Instalasi ClawHub menggunakan locator eksplisit `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Spesifikasi Plugin yang aman untuk npm dan polos diinstal dari npm secara default selama cutover peluncuran kecuali cocok dengan id Plugin resmi:

```bash
openclaw plugins install openclaw-codex-app-server
```

Gunakan `npm:` untuk membuat resolusi khusus npm eksplisit:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw memeriksa API Plugin / kompatibilitas Gateway minimum yang diiklankan sebelum instalasi. Ketika versi ClawHub yang dipilih menerbitkan artefak ClawPack, OpenClaw mengunduh `.tgz` npm-pack berversi, memverifikasi header digest ClawHub dan digest artefak, lalu menginstalnya melalui jalur arsip normal. Versi ClawHub yang lebih lama tanpa metadata ClawPack tetap diinstal melalui jalur verifikasi arsip paket legacy. Instalasi yang dicatat menyimpan metadata sumber ClawHub, jenis artefak, integritas npm, shasum npm, nama tarball, dan fakta digest ClawPack untuk pembaruan nanti.
Instalasi ClawHub tanpa versi menyimpan spesifikasi tercatat tanpa versi agar `openclaw plugins update` dapat mengikuti rilis ClawHub yang lebih baru; pemilih versi atau tag eksplisit seperti `clawhub:pkg@1.2.3` dan `clawhub:pkg@beta` tetap dipin ke pemilih tersebut.

#### Singkatan marketplace

Gunakan singkatan `plugin@marketplace` ketika nama marketplace ada di cache registry lokal Claude di `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Gunakan `--marketplace` ketika Anda ingin meneruskan sumber marketplace secara eksplisit:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Marketplace sources">
    - nama known-marketplace Claude dari `~/.claude/plugins/known_marketplaces.json`
    - root marketplace lokal atau jalur `marketplace.json`
    - singkatan repo GitHub seperti `owner/repo`
    - URL repo GitHub seperti `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="Remote marketplace rules">
    Untuk marketplace jarak jauh yang dimuat dari GitHub atau git, entri Plugin harus tetap berada di dalam repo marketplace yang di-clone. OpenClaw menerima sumber jalur relatif dari repo tersebut dan menolak HTTP(S), jalur absolut, git, GitHub, serta sumber Plugin non-jalur lainnya dari manifest jarak jauh.
  </Tab>
</Tabs>

Untuk jalur dan arsip lokal, OpenClaw mendeteksi otomatis:

- Plugin OpenClaw native (`openclaw.plugin.json`)
- bundle yang kompatibel dengan Codex (`.codex-plugin/plugin.json`)
- bundle yang kompatibel dengan Claude (`.claude-plugin/plugin.json` atau tata letak komponen Claude default)
- bundle yang kompatibel dengan Cursor (`.cursor-plugin/plugin.json`)

Instalasi lokal terkelola harus berupa direktori atau arsip Plugin. File Plugin mandiri `.js`,
`.mjs`, `.cjs`, dan `.ts` tidak disalin ke root Plugin terkelola
oleh `plugins install`; cantumkan file tersebut secara eksplisit di `plugins.load.paths` sebagai gantinya.

<Note>
Bundle yang kompatibel diinstal ke root Plugin normal dan ikut serta dalam alur list/info/enable/disable yang sama. Saat ini, bundle skills, command-skills Claude, default `settings.json` Claude, default `.lsp.json` Claude / `lspServers` yang dideklarasikan manifest, command-skills Cursor, dan direktori hook Codex yang kompatibel didukung; kapabilitas bundle lain yang terdeteksi ditampilkan dalam diagnostics/info tetapi belum disambungkan ke eksekusi runtime.
</Note>

### Daftar

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search <query>
openclaw plugins search <query> --limit 20
openclaw plugins search <query> --json
```

<ParamField path="--enabled" type="boolean">
  Tampilkan hanya Plugin yang diaktifkan.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Beralih dari tampilan tabel ke baris detail per Plugin dengan metadata sumber/asal/versi/aktivasi.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventaris yang dapat dibaca mesin beserta diagnostics registry dan status instal dependensi paket.
</ParamField>

<Note>
`plugins list` membaca registry Plugin lokal yang dipersistensikan terlebih dahulu, dengan fallback turunan khusus manifest ketika registry hilang atau tidak valid. Ini berguna untuk memeriksa apakah Plugin terinstal, diaktifkan, dan terlihat oleh perencanaan cold startup, tetapi ini bukan probe runtime langsung untuk proses Gateway yang sudah berjalan. Setelah mengubah kode Plugin, enablement, kebijakan hook, atau `plugins.load.paths`, mulai ulang Gateway yang melayani channel sebelum mengharapkan kode atau hook `register(api)` baru berjalan. Untuk deployment jarak jauh/container, verifikasi bahwa Anda memulai ulang child `openclaw gateway run` yang sebenarnya, bukan hanya proses wrapper.

`plugins list --json` menyertakan `dependencyStatus` setiap Plugin dari `dependencies` dan `optionalDependencies` `package.json`. OpenClaw memeriksa apakah nama paket tersebut ada di sepanjang jalur lookup `node_modules` Node normal milik Plugin; OpenClaw tidak mengimpor kode runtime Plugin, menjalankan package manager, atau memperbaiki dependensi yang hilang.
</Note>

Jika log startup menampilkan `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`,
jalankan `openclaw plugins list --enabled --verbose` atau
`openclaw plugins inspect <id>` dengan id Plugin yang tercantum untuk mengonfirmasi id
Plugin dan menyalin id tepercaya ke `plugins.allow` dalam `openclaw.json`. Ketika
peringatan dapat mencantumkan setiap Plugin yang ditemukan, peringatan mencetak snippet
`plugins.allow` siap tempel yang sudah menyertakan id tersebut. Jika sebuah Plugin dimuat
tanpa provenance instal/load-path, inspeksi id Plugin tersebut, lalu pin
id tepercaya dalam `plugins.allow` atau instal ulang Plugin dari sumber tepercaya
agar OpenClaw mencatat provenance instal.

`plugins search` adalah lookup katalog ClawHub jarak jauh. Ini tidak memeriksa state lokal,
mengubah config, menginstal paket, atau memuat kode runtime Plugin. Hasil pencarian
menyertakan nama paket ClawHub, family, channel, versi, ringkasan, dan
petunjuk instal seperti `openclaw plugins install clawhub:<package>`.

Untuk pekerjaan Plugin bawaan di dalam image Docker terpaket, bind-mount direktori
sumber Plugin di atas jalur sumber terpaket yang cocok, seperti
`/app/extensions/synology-chat`. OpenClaw akan menemukan overlay sumber yang di-mount itu
sebelum `/app/dist/extensions/synology-chat`; direktori sumber yang hanya disalin
tetap inert sehingga instalasi terpaket normal tetap menggunakan dist terkompilasi.

Untuk debugging hook runtime:

- `openclaw plugins inspect <id> --runtime --json` menampilkan hook terdaftar dan diagnostics dari pass inspeksi yang memuat modul. Inspeksi runtime tidak pernah menginstal dependensi; gunakan `openclaw doctor --fix` untuk membersihkan state dependensi legacy atau memulihkan Plugin unduhan yang hilang yang dirujuk oleh config.
- `openclaw gateway status --deep --require-rpc` mengonfirmasi URL/profil Gateway yang dapat dijangkau, petunjuk layanan/proses, jalur config, dan kesehatan RPC.
- Hook percakapan non-bawaan (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) memerlukan `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Gunakan `--link` untuk menghindari penyalinan direktori Plugin lokal (menambahkan ke `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

File Plugin mandiri harus dicantumkan di `plugins.load.paths`, bukan
diinstal dengan `plugins install` atau ditempatkan langsung di `~/.openclaw/extensions`
atau `<workspace>/.openclaw/extensions`. Root yang ditemukan otomatis tersebut memuat direktori
paket atau bundle Plugin, sedangkan file skrip tingkat atas diperlakukan sebagai helper
lokal dan dilewati.

<Note>
Plugin asal-workspace yang ditemukan dari root ekstensi workspace tidak
diimpor atau dijalankan sampai diaktifkan secara eksplisit. Untuk pengembangan lokal,
jalankan `openclaw plugins enable <plugin-id>` atau atur
`plugins.entries.<plugin-id>.enabled: true`; jika konfigurasi Anda menggunakan
`plugins.allow`, sertakan id plugin yang sama di sana juga. Aturan gagal-tertutup ini
juga berlaku ketika penyiapan kanal secara eksplisit menargetkan plugin asal-workspace untuk
pemuatan khusus-penyiapan, sehingga kode penyiapan plugin kanal lokal tidak akan berjalan selama
plugin workspace tersebut tetap dinonaktifkan atau dikecualikan dari allowlist. Instalasi tertaut
dan entri `plugins.load.paths` eksplisit mengikuti kebijakan normal untuk
asal plugin yang diselesaikan. Lihat
[Konfigurasikan kebijakan plugin](/id/tools/plugin#configure-plugin-policy)
dan [Referensi konfigurasi](/id/gateway/configuration-reference#plugins).

`--force` tidak didukung dengan `--link` karena instalasi tertaut menggunakan ulang path sumber alih-alih menyalin ke target instalasi terkelola.

Gunakan `--pin` pada instalasi npm untuk menyimpan spesifikasi persis yang diselesaikan (`name@version`) di indeks plugin terkelola sambil mempertahankan perilaku default tanpa pin.
</Note>

### Indeks Plugin

Metadata instalasi plugin adalah status yang dikelola mesin, bukan konfigurasi pengguna. Instalasi dan pembaruan menuliskannya ke database status SQLite bersama di bawah direktori status OpenClaw aktif. Baris `installed_plugin_index` menyimpan metadata `installRecords` yang tahan lama, termasuk catatan untuk manifes plugin yang rusak atau hilang, ditambah cache registry dingin turunan manifes yang digunakan oleh `openclaw plugins update`, pencopotan instalasi, diagnostik, dan registry plugin dingin.

Ketika OpenClaw melihat catatan `plugins.installs` lama yang telah dikirim dalam konfigurasi, pembacaan runtime memperlakukannya sebagai input kompatibilitas tanpa menulis ulang `openclaw.json`. Penulisan plugin eksplisit dan `openclaw doctor --fix` memindahkan catatan tersebut ke indeks plugin dan menghapus kunci konfigurasi ketika penulisan konfigurasi diizinkan; jika salah satu penulisan gagal, catatan konfigurasi dipertahankan agar metadata instalasi tidak hilang.

### Copot instalasi

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` menghapus catatan plugin dari `plugins.entries`, indeks plugin persisten, entri daftar allow/deny plugin, dan entri `plugins.load.paths` tertaut bila berlaku. Kecuali `--keep-files` diatur, pencopotan instalasi juga menghapus direktori instalasi terkelola yang terlacak ketika berada di dalam root ekstensi plugin OpenClaw. Untuk plugin active memory, slot memori direset ke `memory-core`.

<Note>
`--keep-config` didukung sebagai alias usang untuk `--keep-files`.
</Note>

### Perbarui

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --acknowledge-clawhub-risk
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Pembaruan berlaku untuk instalasi plugin terlacak dalam indeks plugin terkelola dan instalasi hook-pack terlacak di `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Menyelesaikan id plugin vs spesifikasi npm">
    Ketika Anda meneruskan id plugin, OpenClaw menggunakan ulang spesifikasi instalasi yang tercatat untuk plugin tersebut. Artinya dist-tag yang sebelumnya tersimpan seperti `@beta` dan versi persis yang dipin akan terus digunakan pada eksekusi `update <id>` berikutnya.

    Selama `update <id> --dry-run`, instalasi npm persis yang dipin tetap dipin. Jika OpenClaw juga dapat menyelesaikan jalur default registry paket dan jalur default tersebut lebih baru daripada versi terinstal yang dipin, dry run melaporkan pin tersebut dan mencetak perintah pembaruan paket `@latest` eksplisit untuk mengikuti jalur default registry.

    Aturan pembaruan tertarget itu berbeda dari jalur pemeliharaan massal `openclaw plugins update --all`. Pembaruan massal tetap menghormati spesifikasi instalasi terlacak biasa, tetapi catatan plugin resmi OpenClaw tepercaya dapat disinkronkan ke target katalog resmi saat ini alih-alih tetap pada paket resmi persis yang usang. Gunakan `update <id>` tertarget ketika Anda sengaja ingin mempertahankan spesifikasi resmi persis atau bertag tanpa perubahan.

    Untuk instalasi npm, Anda juga dapat meneruskan spesifikasi paket npm eksplisit dengan dist-tag atau versi persis. OpenClaw menyelesaikan nama paket tersebut kembali ke catatan plugin terlacak, memperbarui plugin terinstal tersebut, dan mencatat spesifikasi npm baru untuk pembaruan berbasis id di masa depan.

    Meneruskan nama paket npm tanpa versi atau tag juga diselesaikan kembali ke catatan plugin terlacak. Gunakan ini ketika plugin dipin ke versi persis dan Anda ingin memindahkannya kembali ke jalur rilis default registry.

  </Accordion>
  <Accordion title="Pembaruan kanal beta">
    `openclaw plugins update <id-or-npm-spec>` tertarget menggunakan ulang spesifikasi plugin terlacak kecuali Anda meneruskan spesifikasi baru. `openclaw plugins update --all` massal menggunakan `update.channel` yang dikonfigurasi ketika menyinkronkan catatan plugin resmi tepercaya ke target katalog resmi, sehingga instalasi kanal beta dapat tetap berada di jalur rilis beta alih-alih dinormalisasi diam-diam ke stable/latest.

    `openclaw update` juga mengetahui kanal pembaruan OpenClaw aktif: pada kanal beta, catatan plugin npm jalur-default dan ClawHub mencoba `@beta` terlebih dahulu. Keduanya fallback ke spesifikasi default/latest yang tercatat jika tidak ada rilis beta plugin; plugin npm juga fallback ketika paket beta ada tetapi gagal validasi instalasi. Fallback tersebut dilaporkan sebagai peringatan dan tidak menggagalkan pembaruan inti. Versi persis dan tag eksplisit tetap dipin ke selektor tersebut untuk pembaruan tertarget.

  </Accordion>
  <Accordion title="Pemeriksaan versi dan drift integritas">
    Sebelum pembaruan npm langsung, OpenClaw memeriksa versi paket terinstal terhadap metadata registry npm. Jika versi terinstal dan identitas artefak yang tercatat sudah cocok dengan target yang diselesaikan, pembaruan dilewati tanpa mengunduh, menginstal ulang, atau menulis ulang `openclaw.json`.

    Ketika hash integritas tersimpan ada dan hash artefak yang diambil berubah, OpenClaw memperlakukan itu sebagai drift artefak npm. Perintah interaktif `openclaw plugins update` mencetak hash yang diharapkan dan aktual serta meminta konfirmasi sebelum melanjutkan. Helper pembaruan noninteraktif gagal tertutup kecuali pemanggil menyediakan kebijakan kelanjutan eksplisit.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install pada pembaruan">
    `--dangerously-force-unsafe-install` juga diterima pada `plugins update` untuk kompatibilitas, tetapi sudah usang dan tidak lagi mengubah perilaku pembaruan plugin. `security.installPolicy` operator masih dapat memblokir pembaruan; hook `before_install` plugin hanya berlaku dalam proses tempat hook plugin dimuat.
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk pada pembaruan">
    Pembaruan plugin yang didukung ClawHub komunitas menjalankan pemeriksaan kepercayaan rilis persis yang sama seperti instalasi sebelum mengunduh paket pengganti. Gunakan `--acknowledge-clawhub-risk` untuk otomasi yang telah ditinjau yang harus berlanjut ketika rilis ClawHub yang dipilih memiliki peringatan kepercayaan berisiko. Paket ClawHub resmi dan sumber plugin OpenClaw bundel melewati prompt kepercayaan-rilis ini.
  </Accordion>
</AccordionGroup>

### Inspeksi

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect menampilkan identitas, status muat, sumber, kapabilitas manifes, flag kebijakan, diagnostik, metadata instalasi, kapabilitas bundle, dan dukungan server MCP atau LSP yang terdeteksi tanpa mengimpor runtime plugin secara default. Output JSON menyertakan kontrak manifes plugin, seperti `contracts.agentToolResultMiddleware` dan `contracts.trustedToolPolicies`, sehingga operator dapat mengaudit deklarasi permukaan tepercaya sebelum mengaktifkan atau memulai ulang plugin. Tambahkan `--runtime` untuk memuat modul plugin dan menyertakan hook, tools, perintah, layanan, metode Gateway, dan route HTTP yang terdaftar. Inspeksi runtime melaporkan dependensi plugin yang hilang secara langsung; instalasi dan perbaikan tetap berada di `openclaw plugins install`, `openclaw plugins update`, dan `openclaw doctor --fix`.

Perintah CLI milik plugin biasanya diinstal sebagai grup perintah root `openclaw`, tetapi plugin juga dapat mendaftarkan perintah bertingkat di bawah induk inti seperti `openclaw nodes`. Setelah `inspect --runtime` menampilkan perintah di bawah `cliCommands`, jalankan perintah tersebut pada path yang tercantum; misalnya plugin yang mendaftarkan `demo-git` dapat diverifikasi dengan `openclaw demo-git ping`.

Setiap plugin diklasifikasikan berdasarkan apa yang benar-benar didaftarkannya saat runtime:

- **plain-capability** — satu jenis kapabilitas (misalnya plugin khusus provider)
- **hybrid-capability** — beberapa jenis kapabilitas (misalnya teks + ucapan + gambar)
- **hook-only** — hanya hook, tanpa kapabilitas atau permukaan
- **non-capability** — tools/perintah/layanan tetapi tanpa kapabilitas

Lihat [Bentuk Plugin](/id/plugins/architecture#plugin-shapes) untuk informasi lebih lanjut tentang model kapabilitas.

<Note>
Flag `--json` menghasilkan laporan yang dapat dibaca mesin yang cocok untuk scripting dan audit. `inspect --all` merender tabel seluruh armada dengan kolom bentuk, jenis kapabilitas, pemberitahuan kompatibilitas, kapabilitas bundle, dan ringkasan hook. `info` adalah alias untuk `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` melaporkan kesalahan muat plugin, diagnostik manifes/penemuan, pemberitahuan kompatibilitas, dan referensi konfigurasi plugin usang seperti slot plugin yang hilang. Ketika pohon instalasi dan konfigurasi plugin bersih, ia mencetak `No plugin issues detected.` Jika konfigurasi usang tetap ada tetapi pohon instalasi selain itu sehat, ringkasan menyatakan demikian alih-alih menyiratkan kesehatan plugin penuh.

Jika plugin yang dikonfigurasi ada di disk tetapi diblokir oleh pemeriksaan keamanan path milik loader, validasi konfigurasi mempertahankan entri plugin dan melaporkannya sebagai `present but blocked`. Perbaiki diagnostik plugin-terblokir sebelumnya, seperti kepemilikan path atau izin world-writable, alih-alih menghapus konfigurasi `plugins.entries.<id>` atau `plugins.allow`.

Untuk kegagalan bentuk modul seperti ekspor `register`/`activate` yang hilang, jalankan ulang dengan `OPENCLAW_PLUGIN_LOAD_DEBUG=1` untuk menyertakan ringkasan bentuk ekspor yang ringkas dalam output diagnostik.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Registry plugin lokal adalah model baca dingin persisten OpenClaw untuk identitas plugin terinstal, pengaktifan, metadata sumber, dan kepemilikan kontribusi. Startup normal, pencarian pemilik provider, klasifikasi penyiapan kanal, dan inventaris plugin dapat membacanya tanpa mengimpor modul runtime plugin.

Gunakan `plugins registry` untuk memeriksa apakah registry persisten ada, terkini, atau usang. Gunakan `--refresh` untuk membangunnya ulang dari indeks plugin persisten, kebijakan konfigurasi, dan metadata manifes/paket. Ini adalah jalur perbaikan, bukan jalur aktivasi runtime.

`openclaw doctor --fix` juga memperbaiki drift npm terkelola yang berdekatan dengan registry: jika paket `@openclaw/*` yatim atau dipulihkan di bawah proyek npm plugin terkelola atau root npm terkelola flat lama membayangi plugin bundel, doctor menghapus paket usang tersebut dan membangun ulang registry sehingga startup memvalidasi terhadap manifes bundel. Doctor juga menautkan ulang paket host `openclaw` ke plugin npm terkelola yang mendeklarasikan `peerDependencies.openclaw`, sehingga impor runtime lokal-paket seperti `openclaw/plugin-sdk/*` terselesaikan setelah pembaruan atau perbaikan npm.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` adalah switch kompatibilitas break-glass usang untuk kegagalan baca registry. Utamakan `plugins registry --refresh` atau `openclaw doctor --fix`; fallback env hanya untuk pemulihan startup darurat saat migrasi diluncurkan.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
openclaw plugins marketplace refresh
openclaw plugins marketplace refresh --feed-profile <name>
openclaw plugins marketplace refresh --feed-url <url>
openclaw plugins marketplace refresh --expected-sha256 <sha256> --json
```

Daftar marketplace menerima path marketplace lokal, path `marketplace.json`, shorthand GitHub seperti `owner/repo`, URL repo GitHub, atau URL git. `--json` mencetak label sumber yang diselesaikan beserta manifes marketplace dan entri plugin yang diurai.

Penyegaran marketplace memuat feed marketplace OpenClaw yang dihosting dan menyimpan
respons yang telah divalidasi sebagai snapshot hosted-feed lokal. Tanpa opsi, perintah ini menggunakan
profil feed default yang dikonfigurasi. Gunakan `--feed-profile <name>` untuk menyegarkan
profil tertentu yang dikonfigurasi, `--feed-url <url>` untuk menyegarkan URL feed
terhost eksplisit, `--expected-sha256 <sha256>` untuk mensyaratkan checksum payload yang cocok
(`sha256:<hex>` atau digest heksadesimal polos 64 karakter), dan `--json` untuk
output yang dapat dibaca mesin. URL feed terhost eksplisit tidak boleh menyertakan
kredensial, string kueri, atau fragmen. Penyegaran tanpa pin dapat melaporkan
snapshot terhost atau hasil fallback bawaan tanpa menggagalkan perintah. Penyegaran
dengan pin gagal kecuali menerima payload terhost yang baru, dan penyegaran terhost yang
berhasil gagal jika OpenClaw tidak dapat menyimpan snapshot yang telah divalidasi.

## Terkait

- [Membangun plugin](/id/plugins/building-plugins)
- [Referensi CLI](/id/cli)
- [ClawHub](/id/clawhub)
