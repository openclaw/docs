---
read_when:
    - Anda ingin memasang atau mengelola Plugin Gateway atau bundel yang kompatibel
    - Anda ingin membuat kerangka atau memvalidasi Plugin alat sederhana
    - Anda ingin men-debug kegagalan pemuatan plugin
sidebarTitle: Plugins
summary: Referensi CLI untuk `openclaw plugins` (init, build, validate, list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-06-27T17:20:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b4366a862f6a8996b38b624760eef407969f35a7451e3b2a1d5e82746d73b678
    source_path: cli/plugins.md
    workflow: 16
---

Kelola Plugin Gateway, paket hook, dan bundle yang kompatibel.

<CardGroup cols={2}>
  <Card title="Sistem Plugin" href="/id/tools/plugin">
    Panduan pengguna akhir untuk memasang, mengaktifkan, dan memecahkan masalah Plugin.
  </Card>
  <Card title="Kelola Plugin" href="/id/plugins/manage-plugins">
    Contoh cepat untuk memasang, mencantumkan, memperbarui, menghapus instalasi, dan menerbitkan.
  </Card>
  <Card title="Bundle Plugin" href="/id/plugins/bundles">
    Model kompatibilitas bundle.
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
openclaw plugins init my-tool --name "My Tool"
openclaw plugins init my-provider --name "My Provider" --type provider
openclaw plugins init my-provider --name "My Provider" --type provider --directory ./my-provider
openclaw plugins build --entry ./dist/index.js
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
```

Untuk investigasi instalasi, pemeriksaan, penghapusan instalasi, atau penyegaran registry yang lambat, jalankan
perintah dengan `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Trace menulis waktu fase
ke stderr dan menjaga keluaran JSON tetap dapat diurai. Lihat [Debugging](/id/help/debugging#plugin-lifecycle-trace).

<Note>
Dalam mode Nix (`OPENCLAW_NIX_MODE=1`), mutator siklus hidup Plugin dinonaktifkan. Gunakan sumber Nix untuk instalasi ini alih-alih `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable`, atau `plugins disable`; untuk nix-openclaw, gunakan [Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) yang mendahulukan agen.
</Note>

<Note>
Plugin bawaan dikirim bersama OpenClaw. Sebagian diaktifkan secara default (misalnya provider model bawaan, provider suara bawaan, dan Plugin browser bawaan); yang lain memerlukan `plugins enable`.

Plugin OpenClaw native harus mengirim `openclaw.plugin.json` dengan JSON Schema inline (`configSchema`, meskipun kosong). Bundle yang kompatibel menggunakan manifes bundle mereka sendiri sebagai gantinya.

`plugins list` menampilkan `Format: openclaw` atau `Format: bundle`. Keluaran daftar/info verbose juga menampilkan subtipe bundle (`codex`, `claude`, atau `cursor`) beserta kapabilitas bundle yang terdeteksi.
</Note>

### Pembuat

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` membuat Plugin alat TypeScript minimal secara default. Argumen pertama
adalah id Plugin; berikan `--name` untuk nama tampilan. OpenClaw menggunakan
id untuk direktori keluaran default dan penamaan paket. Scaffold alat menggunakan
`defineToolPlugin`.
`plugins build` mengimpor entri yang sudah dibangun, membaca metadata alat statisnya, menulis
`openclaw.plugin.json`, dan menjaga `package.json` `openclaw.extensions` tetap selaras.
`plugins validate` memeriksa bahwa manifes yang dihasilkan, metadata paket, dan
ekspor entri saat ini masih sesuai. Lihat [Plugin Alat](/id/plugins/tool-plugins) untuk
alur kerja lengkap pembuatan alat.

Scaffold menulis sumber TypeScript tetapi menghasilkan metadata dari entri
`./dist/index.js` yang sudah dibangun sehingga alur kerja juga berfungsi dengan CLI yang diterbitkan. Gunakan
`--entry <path>` ketika entri bukan entri paket default. Gunakan
`plugins build --check` di CI untuk gagal ketika metadata yang dihasilkan sudah usang tanpa
menulis ulang file.

### Scaffold Provider

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

Scaffold provider membuat Plugin provider teks/model generik dengan plumbing
kunci API yang kompatibel dengan OpenAI, skrip `npm run validate` bawaan untuk `clawhub package
validate`, metadata paket ClawHub, dan workflow GitHub yang dipicu secara manual
untuk penerbitan tepercaya di masa mendatang melalui GitHub Actions OIDC. Scaffold provider
tidak menghasilkan skills dan tidak menggunakan `openclaw plugins build` atau
`openclaw plugins validate`; perintah tersebut adalah untuk jalur metadata yang dihasilkan
milik scaffold alat.

Sebelum menerbitkan, ganti placeholder URL dasar API, katalog model, rute dokumen,
teks kredensial, dan salinan README dengan detail provider yang nyata. Gunakan
README yang dihasilkan untuk penerbitan ClawHub pertama kali dan penyiapan penerbit tepercaya.

### Instalasi

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
dengan variabel lingkungan yang dijaga. Lihat
[Penggantian instalasi Plugin](/id/plugins/install-overrides).

<Warning>
Nama paket polos diinstal dari npm secara default selama cutover peluncuran, kecuali cocok dengan id Plugin resmi. Spesifikasi paket mentah `@openclaw/*` yang cocok dengan Plugin bawaan menggunakan salinan bawaan yang dikirim bersama build OpenClaw saat ini. Gunakan `npm:<package>` ketika Anda sengaja menginginkan paket npm eksternal sebagai gantinya. Gunakan `clawhub:<package>` untuk ClawHub. Perlakukan instalasi Plugin seperti menjalankan kode. Lebih baik gunakan versi yang dipin.
</Warning>

`plugins search` menanyakan ClawHub untuk paket Plugin yang dapat diinstal dan mencetak
nama paket yang siap diinstal. Ini mencari paket code-plugin dan bundle-plugin,
bukan Skills. Gunakan `openclaw skills search` untuk Skills ClawHub.

<Note>
ClawHub adalah permukaan distribusi dan penemuan utama untuk sebagian besar Plugin. Npm
tetap menjadi fallback yang didukung dan jalur instalasi langsung. Paket Plugin
`@openclaw/*` milik OpenClaw diterbitkan di npm lagi; lihat daftar saat ini
di [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) atau
[inventaris Plugin](/id/plugins/plugin-inventory). Instalasi stabil menggunakan `latest`.
Instalasi dan pembaruan kanal beta lebih memilih dist-tag npm `beta` ketika tag tersebut
tersedia, lalu fallback ke `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Include konfigurasi dan perbaikan konfigurasi tidak valid">
    Jika bagian `plugins` Anda didukung oleh `$include` satu file, `plugins install/update/enable/disable/uninstall` menulis melalui file include tersebut dan membiarkan `openclaw.json` tidak tersentuh. Include root, array include, dan include dengan override saudara gagal tertutup alih-alih diratakan. Lihat [Include konfigurasi](/id/gateway/configuration) untuk bentuk yang didukung.

    Jika konfigurasi tidak valid selama instalasi, `plugins install` biasanya gagal tertutup dan meminta Anda menjalankan `openclaw doctor --fix` terlebih dahulu. Selama startup Gateway dan hot reload, konfigurasi Plugin yang tidak valid gagal tertutup seperti konfigurasi tidak valid lainnya; `openclaw doctor --fix` dapat mengarantina entri Plugin yang tidak valid. Satu-satunya pengecualian waktu instalasi yang terdokumentasi adalah jalur pemulihan Plugin bawaan yang sempit untuk Plugin yang secara eksplisit ikut serta dalam `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force dan instal ulang vs pembaruan">
    `--force` menggunakan kembali target instalasi yang ada dan menimpa Plugin atau paket hook yang sudah terinstal di tempat. Gunakan ketika Anda sengaja menginstal ulang id yang sama dari jalur lokal, arsip, paket ClawHub, atau artefak npm baru. Untuk peningkatan rutin Plugin npm yang sudah dilacak, lebih baik gunakan `openclaw plugins update <id-or-npm-spec>`.

    Jika Anda menjalankan `plugins install` untuk id Plugin yang sudah terinstal, OpenClaw berhenti dan mengarahkan Anda ke `plugins update <id-or-npm-spec>` untuk peningkatan normal, atau ke `plugins install <package> --force` ketika Anda benar-benar ingin menimpa instalasi saat ini dari sumber berbeda.

  </Accordion>
  <Accordion title="Cakupan --pin">
    `--pin` hanya berlaku untuk instalasi npm. Ini tidak didukung dengan instalasi `git:`; gunakan ref git eksplisit seperti `git:github.com/acme/plugin@v1.2.3` ketika Anda menginginkan sumber yang dipin. Ini tidak didukung dengan `--marketplace`, karena instalasi marketplace mempertahankan metadata sumber marketplace alih-alih spesifikasi npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` sudah deprecated dan sekarang menjadi no-op. OpenClaw tidak lagi menjalankan pemblokiran kode berbahaya bawaan pada waktu instalasi untuk instalasi Plugin.

    Gunakan permukaan `security.installPolicy` bersama yang dimiliki operator ketika kebijakan instalasi khusus host diperlukan. Hook `before_install` Plugin adalah hook siklus hidup runtime Plugin dan bukan batas kebijakan utama untuk instalasi CLI.

    Jika Plugin yang Anda terbitkan di ClawHub disembunyikan atau diblokir oleh pemindaian registry, gunakan langkah penerbit di [Penerbitan ClawHub](/id/clawhub/publishing). `--dangerously-force-unsafe-install` tidak meminta ClawHub memindai ulang Plugin atau membuat rilis yang diblokir menjadi publik.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    Instalasi ClawHub komunitas memeriksa catatan kepercayaan rilis yang dipilih sebelum mengunduh paket. Jika ClawHub menonaktifkan unduhan untuk rilis tersebut, melaporkan temuan pemindaian berbahaya, atau menempatkan rilis dalam status moderasi pemblokir seperti karantina, OpenClaw menolak rilis tersebut. Untuk status pemindaian berisiko yang tidak memblokir, status moderasi berisiko, atau alasan registry, OpenClaw menampilkan detail kepercayaan dan meminta konfirmasi sebelum melanjutkan.

    Gunakan `--acknowledge-clawhub-risk` hanya setelah meninjau peringatan ClawHub dan memutuskan untuk melanjutkan tanpa prompt interaktif. Catatan kepercayaan bersih yang tertunda atau usang memberi peringatan tetapi tidak memerlukan pengakuan. Paket ClawHub resmi dan sumber Plugin OpenClaw bawaan melewati prompt kepercayaan rilis ini.

  </Accordion>
  <Accordion title="Paket hook dan spesifikasi npm">
    `plugins install` juga merupakan permukaan instalasi untuk paket hook yang mengekspos `openclaw.hooks` di `package.json`. Gunakan `openclaw hooks` untuk visibilitas hook yang difilter dan pengaktifan per hook, bukan instalasi paket.

    Spesifikasi npm bersifat **hanya registry** (nama paket + **versi persis** atau **dist-tag** opsional). Spesifikasi Git/URL/file dan rentang semver ditolak. Instalasi dependensi berjalan dalam satu proyek npm terkelola per Plugin dengan `--ignore-scripts` demi keamanan, bahkan ketika shell Anda memiliki pengaturan instalasi npm global. Proyek npm Plugin terkelola mewarisi `overrides` npm tingkat paket milik OpenClaw, sehingga pin keamanan host juga berlaku untuk dependensi Plugin yang di-hoist.

    Gunakan `npm:<package>` ketika Anda ingin membuat resolusi npm eksplisit. Spesifikasi paket polos juga menginstal langsung dari npm selama cutover peluncuran kecuali cocok dengan id Plugin resmi.

    Spesifikasi paket mentah `@openclaw/*` yang cocok dengan Plugin bawaan diselesaikan ke salinan bawaan milik image sebelum fallback npm. Misalnya, `openclaw plugins install @openclaw/discord@2026.5.20 --pin` menggunakan Plugin Discord bawaan dari build OpenClaw saat ini alih-alih membuat override npm terkelola. Untuk memaksa paket npm eksternal, gunakan `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`.

    Spesifikasi bare dan `@latest` tetap berada di jalur stabil. Versi koreksi OpenClaw bertanggal seperti `2026.5.3-1` adalah rilis stabil untuk pemeriksaan ini. Jika npm menyelesaikan salah satunya ke prarilis, OpenClaw berhenti dan meminta Anda ikut serta secara eksplisit dengan tag prarilis seperti `@beta`/`@rc` atau versi prarilis persis seperti `@1.2.3-beta.4`.

    Untuk pemasangan npm tanpa versi persis (`npm:<package>` atau `npm:<package>@latest`), OpenClaw memeriksa metadata paket yang diselesaikan sebelum pemasangan. Jika paket stabil terbaru memerlukan API Plugin OpenClaw yang lebih baru atau versi host minimum yang lebih tinggi, OpenClaw memeriksa versi stabil lama dan memasang rilis kompatibel terbaru sebagai gantinya. Versi persis dan dist-tag eksplisit seperti `@beta` tetap ketat: jika paket yang dipilih tidak kompatibel, perintah gagal dan meminta Anda meningkatkan OpenClaw atau memilih versi yang kompatibel.

    Jika spesifikasi pemasangan bare cocok dengan id Plugin resmi (misalnya `diffs`), OpenClaw memasang entri katalog secara langsung. Untuk memasang paket npm dengan nama yang sama, gunakan spesifikasi scoped eksplisit (misalnya `@scope/diffs`).

  </Accordion>
  <Accordion title="Git repositories">
    Gunakan `git:<repo>` untuk memasang langsung dari repositori git. Bentuk yang didukung mencakup URL clone `git:github.com/owner/repo`, `git:owner/repo`, `https://` lengkap, `ssh://`, `git://`, `file://`, dan `git@host:owner/repo.git`. Tambahkan `@<ref>` atau `#<ref>` untuk checkout branch, tag, atau commit sebelum pemasangan.

    Pemasangan git meng-clone ke direktori sementara, melakukan checkout ref yang diminta saat ada, lalu menggunakan pemasang direktori Plugin normal. Artinya validasi manifes, kebijakan pemasangan operator, pekerjaan pemasangan package manager, dan catatan pemasangan berperilaku seperti pemasangan npm. Pemasangan git yang tercatat menyertakan URL/ref sumber plus commit yang diselesaikan sehingga `openclaw plugins update` dapat menyelesaikan ulang sumbernya nanti.

    Setelah memasang dari git, gunakan `openclaw plugins inspect <id> --runtime --json` untuk memverifikasi registrasi runtime seperti metode Gateway dan perintah CLI. Jika Plugin mendaftarkan root CLI dengan `api.registerCli`, jalankan perintah itu langsung melalui CLI root OpenClaw, misalnya `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archives">
    Arsip yang didukung: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Arsip Plugin OpenClaw native harus berisi `openclaw.plugin.json` yang valid di root Plugin yang diekstrak; arsip yang hanya berisi `package.json` ditolak sebelum OpenClaw menulis catatan pemasangan.

    Gunakan `npm-pack:<path.tgz>` saat file adalah tarball npm-pack dan Anda ingin
    menguji jalur proyek npm terkelola per-Plugin yang sama seperti yang digunakan oleh pemasangan
    registri, termasuk verifikasi `package-lock.json`, pemindaian dependensi
    hoisted, dan catatan pemasangan npm. Jalur arsip biasa tetap dipasang sebagai arsip lokal
    di bawah root ekstensi Plugin.

    Pemasangan marketplace Claude juga didukung.

  </Accordion>
</AccordionGroup>

Pemasangan ClawHub menggunakan locator eksplisit `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Spesifikasi Plugin bare yang aman untuk npm dipasang dari npm secara default selama cutover peluncuran kecuali cocok dengan id Plugin resmi:

```bash
openclaw plugins install openclaw-codex-app-server
```

Gunakan `npm:` untuk membuat resolusi khusus npm menjadi eksplisit:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw memeriksa API Plugin / kompatibilitas Gateway minimum yang diiklankan sebelum pemasangan. Ketika versi ClawHub yang dipilih menerbitkan artefak ClawPack, OpenClaw mengunduh `.tgz` npm-pack berversi, memverifikasi header digest ClawHub dan digest artefak, lalu memasangnya melalui jalur arsip normal. Versi ClawHub lama tanpa metadata ClawPack tetap dipasang melalui jalur verifikasi arsip paket lama. Pemasangan yang tercatat menyimpan metadata sumber ClawHub, jenis artefak, integritas npm, shasum npm, nama tarball, dan fakta digest ClawPack untuk pembaruan nanti.
Pemasangan ClawHub tanpa versi mempertahankan spesifikasi tercatat tanpa versi sehingga `openclaw plugins update` dapat mengikuti rilis ClawHub yang lebih baru; pemilih versi atau tag eksplisit seperti `clawhub:pkg@1.2.3` dan `clawhub:pkg@beta` tetap dipin ke pemilih tersebut.

#### Singkatan marketplace

Gunakan singkatan `plugin@marketplace` saat nama marketplace ada di cache registri lokal Claude di `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Gunakan `--marketplace` saat Anda ingin meneruskan sumber marketplace secara eksplisit:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Marketplace sources">
    - nama marketplace yang dikenal Claude dari `~/.claude/plugins/known_marketplaces.json`
    - root marketplace lokal atau jalur `marketplace.json`
    - singkatan repo GitHub seperti `owner/repo`
    - URL repo GitHub seperti `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="Remote marketplace rules">
    Untuk marketplace jarak jauh yang dimuat dari GitHub atau git, entri Plugin harus tetap berada di dalam repo marketplace yang di-clone. OpenClaw menerima sumber jalur relatif dari repo tersebut dan menolak HTTP(S), jalur absolut, git, GitHub, dan sumber Plugin non-jalur lainnya dari manifes jarak jauh.
  </Tab>
</Tabs>

Untuk jalur lokal dan arsip, OpenClaw mendeteksi otomatis:

- Plugin OpenClaw native (`openclaw.plugin.json`)
- bundle yang kompatibel dengan Codex (`.codex-plugin/plugin.json`)
- bundle yang kompatibel dengan Claude (`.claude-plugin/plugin.json` atau tata letak komponen default Claude)
- bundle yang kompatibel dengan Cursor (`.cursor-plugin/plugin.json`)

Pemasangan lokal terkelola harus berupa direktori atau arsip Plugin. File Plugin mandiri `.js`,
`.mjs`, `.cjs`, dan `.ts` tidak disalin ke root Plugin terkelola oleh
`plugins install`; cantumkan file tersebut secara eksplisit di `plugins.load.paths` sebagai gantinya.

<Note>
Bundle yang kompatibel dipasang ke root Plugin normal dan ikut dalam alur list/info/enable/disable yang sama. Saat ini, bundle skills, command-skills Claude, default `settings.json` Claude, default `.lsp.json` Claude / `lspServers` yang dideklarasikan manifes, command-skills Cursor, dan direktori hook Codex yang kompatibel didukung; kemampuan bundle lain yang terdeteksi ditampilkan dalam diagnostik/info tetapi belum terhubung ke eksekusi runtime.
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
  Beralih dari tampilan tabel ke baris detail per-Plugin dengan metadata sumber/asal/versi/aktivasi.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventaris yang dapat dibaca mesin plus diagnostik registri dan status pemasangan dependensi paket.
</ParamField>

<Note>
`plugins list` membaca registri Plugin lokal yang dipersistenkan terlebih dahulu, dengan fallback turunan khusus manifes saat registri hilang atau tidak valid. Ini berguna untuk memeriksa apakah Plugin terpasang, diaktifkan, dan terlihat oleh perencanaan cold startup, tetapi ini bukan probe runtime langsung dari proses Gateway yang sudah berjalan. Setelah mengubah kode Plugin, status aktif, kebijakan hook, atau `plugins.load.paths`, mulai ulang Gateway yang melayani channel sebelum mengharapkan kode atau hook `register(api)` baru berjalan. Untuk deployment jarak jauh/kontainer, pastikan Anda memulai ulang child `openclaw gateway run` yang sebenarnya, bukan hanya proses wrapper.

`plugins list --json` menyertakan `dependencyStatus` tiap Plugin dari `package.json`
`dependencies` dan `optionalDependencies`. OpenClaw memeriksa apakah nama paket tersebut
ada di sepanjang jalur lookup Node `node_modules` normal milik Plugin; OpenClaw
tidak mengimpor kode runtime Plugin, menjalankan package manager, atau memperbaiki
dependensi yang hilang.
</Note>

Jika log startup menampilkan `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`,
jalankan `openclaw plugins list --enabled --verbose` atau
`openclaw plugins inspect <id>` dengan id Plugin yang tercantum untuk mengonfirmasi id
Plugin dan menyalin id tepercaya ke `plugins.allow` di `openclaw.json`. Saat
peringatan dapat mencantumkan setiap Plugin yang ditemukan, peringatan tersebut mencetak snippet
`plugins.allow` yang siap ditempel dan sudah menyertakan id tersebut. Jika Plugin dimuat
tanpa provenance pemasangan/load-path, periksa id Plugin tersebut, lalu pin
id tepercaya di `plugins.allow` atau pasang ulang Plugin dari sumber tepercaya
agar OpenClaw mencatat provenance pemasangan.

`plugins search` adalah lookup katalog ClawHub jarak jauh. Perintah ini tidak memeriksa state lokal,
mengubah config, memasang paket, atau memuat kode runtime Plugin. Hasil pencarian
menyertakan nama paket ClawHub, family, channel, versi, ringkasan, dan
petunjuk pemasangan seperti `openclaw plugins install clawhub:<package>`.

Untuk pekerjaan Plugin bawaan di dalam image Docker terpaket, bind-mount direktori
sumber Plugin di atas jalur sumber terpaket yang cocok, seperti
`/app/extensions/synology-chat`. OpenClaw akan menemukan overlay sumber yang di-mount
itu sebelum `/app/dist/extensions/synology-chat`; direktori sumber yang sekadar disalin
tetap inert sehingga pemasangan terpaket normal tetap menggunakan dist terkompilasi.

Untuk debugging hook runtime:

- `openclaw plugins inspect <id> --runtime --json` menampilkan hook terdaftar dan diagnostik dari pass inspeksi yang memuat modul. Inspeksi runtime tidak pernah memasang dependensi; gunakan `openclaw doctor --fix` untuk membersihkan state dependensi lama atau memulihkan Plugin unduhan yang hilang yang dirujuk oleh config.
- `openclaw gateway status --deep --require-rpc` mengonfirmasi URL/profil Gateway yang dapat dijangkau, petunjuk layanan/proses, jalur config, dan kesehatan RPC.
- Hook percakapan non-bawaan (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) memerlukan `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Gunakan `--link` untuk menghindari penyalinan direktori Plugin lokal (menambahkan ke `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

File Plugin mandiri harus dicantumkan di `plugins.load.paths` alih-alih
dipasang dengan `plugins install` atau ditempatkan langsung di `~/.openclaw/extensions`
atau `<workspace>/.openclaw/extensions`. Root yang ditemukan otomatis tersebut memuat direktori
paket atau bundle Plugin, sementara file skrip tingkat atas diperlakukan sebagai helper
lokal dan dilewati.

<Note>
Plugin asal workspace yang ditemukan dari root extensions workspace tidak
diimpor atau dijalankan sampai diaktifkan secara eksplisit. Untuk pengembangan lokal,
jalankan `openclaw plugins enable <plugin-id>` atau atur
`plugins.entries.<plugin-id>.enabled: true`; jika konfigurasi Anda menggunakan
`plugins.allow`, sertakan juga id plugin yang sama di sana. Aturan fail-closed ini
juga berlaku ketika penyiapan channel secara eksplisit menargetkan plugin asal workspace untuk
pemuatan khusus penyiapan, sehingga kode penyiapan plugin channel lokal tidak akan berjalan selama
plugin workspace tersebut tetap dinonaktifkan atau dikecualikan dari allowlist. Instalasi tertaut
dan entri `plugins.load.paths` eksplisit mengikuti kebijakan normal untuk
asal plugin yang diselesaikan. Lihat
[Konfigurasikan kebijakan plugin](/id/tools/plugin#configure-plugin-policy)
dan [Referensi konfigurasi](/id/gateway/configuration-reference#plugins).

`--force` tidak didukung dengan `--link` karena instalasi tertaut menggunakan ulang path sumber alih-alih menyalin ke target instalasi terkelola.

Gunakan `--pin` pada instalasi npm untuk menyimpan spesifikasi persis yang diselesaikan (`name@version`) di indeks plugin terkelola sambil mempertahankan perilaku default tanpa pin.
</Note>

### Indeks Plugin

Metadata instalasi Plugin adalah state yang dikelola mesin, bukan konfigurasi pengguna. Instalasi dan pembaruan menuliskannya ke database state SQLite bersama di bawah direktori state OpenClaw aktif. Baris `installed_plugin_index` menyimpan metadata `installRecords` yang tahan lama, termasuk catatan untuk manifes plugin yang rusak atau hilang, ditambah cache registry dingin turunan manifes yang digunakan oleh `openclaw plugins update`, uninstall, diagnostik, dan registry plugin dingin.

Ketika OpenClaw melihat catatan legacy terkirim `plugins.installs` dalam konfigurasi, pembacaan runtime memperlakukannya sebagai input kompatibilitas tanpa menulis ulang `openclaw.json`. Penulisan plugin eksplisit dan `openclaw doctor --fix` memindahkan catatan tersebut ke indeks plugin dan menghapus kunci konfigurasi ketika penulisan konfigurasi diizinkan; jika salah satu penulisan gagal, catatan konfigurasi dipertahankan agar metadata instalasi tidak hilang.

### Uninstall

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` menghapus catatan plugin dari `plugins.entries`, indeks plugin persisten, entri daftar allow/deny plugin, dan entri `plugins.load.paths` tertaut bila berlaku. Kecuali `--keep-files` diatur, uninstall juga menghapus direktori instalasi terkelola yang dilacak ketika berada di dalam root plugin OpenClaw. Untuk plugin Active Memory, slot memori direset ke `memory-core`.

<Note>
`--keep-config` didukung sebagai alias usang untuk `--keep-files`.
</Note>

### Pembaruan

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --acknowledge-clawhub-risk
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Pembaruan berlaku untuk instalasi plugin terlacak di indeks plugin terkelola dan instalasi hook-pack terlacak di `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Resolving plugin id vs npm spec">
    Ketika Anda meneruskan id plugin, OpenClaw menggunakan ulang spesifikasi instalasi yang tercatat untuk plugin tersebut. Artinya dist-tag yang sebelumnya disimpan seperti `@beta` dan versi persis yang dipin tetap digunakan pada eksekusi `update <id>` berikutnya.

    Aturan pembaruan tertarget itu berbeda dari path pemeliharaan massal `openclaw plugins update --all`. Pembaruan massal tetap menghormati spesifikasi instalasi terlacak biasa, tetapi catatan plugin resmi OpenClaw tepercaya dapat disinkronkan ke target katalog resmi saat ini alih-alih tetap berada pada paket resmi persis yang usang. Gunakan `update <id>` tertarget ketika Anda sengaja ingin mempertahankan spesifikasi resmi persis atau bertag tanpa perubahan.

    Untuk instalasi npm, Anda juga dapat meneruskan spesifikasi paket npm eksplisit dengan dist-tag atau versi persis. OpenClaw menyelesaikan nama paket tersebut kembali ke catatan plugin terlacak, memperbarui plugin terinstal tersebut, dan mencatat spesifikasi npm baru untuk pembaruan berbasis id di masa mendatang.

    Meneruskan nama paket npm tanpa versi atau tag juga diselesaikan kembali ke catatan plugin terlacak. Gunakan ini ketika plugin dipin ke versi persis dan Anda ingin memindahkannya kembali ke lini rilis default registry.

  </Accordion>
  <Accordion title="Beta channel updates">
    `openclaw plugins update <id-or-npm-spec>` tertarget menggunakan ulang spesifikasi plugin terlacak kecuali Anda meneruskan spesifikasi baru. `openclaw plugins update --all` massal menggunakan `update.channel` yang dikonfigurasi ketika menyinkronkan catatan plugin resmi tepercaya ke target katalog resmi, sehingga instalasi channel beta dapat tetap berada pada lini rilis beta alih-alih dinormalisasi diam-diam ke stable/latest.

    `openclaw update` juga mengetahui channel pembaruan OpenClaw aktif: pada channel beta, catatan plugin npm lini default dan ClawHub mencoba `@beta` terlebih dahulu. Mereka fallback ke spesifikasi default/latest yang tercatat jika tidak ada rilis beta plugin; plugin npm juga fallback ketika paket beta ada tetapi gagal validasi instalasi. Fallback tersebut dilaporkan sebagai peringatan dan tidak menggagalkan pembaruan inti. Versi persis dan tag eksplisit tetap dipin ke selector tersebut untuk pembaruan tertarget.

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    Sebelum pembaruan npm live, OpenClaw memeriksa versi paket terinstal terhadap metadata registry npm. Jika versi terinstal dan identitas artefak yang tercatat sudah cocok dengan target yang diselesaikan, pembaruan dilewati tanpa mengunduh, menginstal ulang, atau menulis ulang `openclaw.json`.

    Ketika hash integritas tersimpan ada dan hash artefak yang diambil berubah, OpenClaw memperlakukannya sebagai drift artefak npm. Perintah interaktif `openclaw plugins update` mencetak hash yang diharapkan dan aktual serta meminta konfirmasi sebelum melanjutkan. Helper pembaruan non-interaktif fail closed kecuali pemanggil menyediakan kebijakan kelanjutan eksplisit.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install` juga diterima pada `plugins update` untuk kompatibilitas, tetapi sudah usang dan tidak lagi mengubah perilaku pembaruan plugin. Operator `security.installPolicy` masih dapat memblokir pembaruan; hook plugin `before_install` hanya berlaku dalam proses tempat hook plugin dimuat.
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk on update">
    Pembaruan plugin komunitas berbasis ClawHub menjalankan pemeriksaan kepercayaan rilis persis yang sama seperti instalasi sebelum mengunduh paket pengganti. Gunakan `--acknowledge-clawhub-risk` untuk otomasi yang telah ditinjau dan harus berlanjut ketika rilis ClawHub yang dipilih memiliki peringatan kepercayaan berisiko. Paket ClawHub resmi dan sumber plugin OpenClaw bawaan melewati prompt kepercayaan rilis ini.
  </Accordion>
</AccordionGroup>

### Inspeksi

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect menampilkan identitas, status pemuatan, sumber, kapabilitas manifes, flag kebijakan, diagnostik, metadata instalasi, kapabilitas bundle, dan dukungan server MCP atau LSP yang terdeteksi tanpa mengimpor runtime plugin secara default. Output JSON mencakup kontrak manifes plugin, seperti `contracts.agentToolResultMiddleware` dan `contracts.trustedToolPolicies`, sehingga operator dapat mengaudit deklarasi surface tepercaya sebelum mengaktifkan atau memulai ulang plugin. Tambahkan `--runtime` untuk memuat modul plugin dan menyertakan hook, alat, perintah, layanan, metode Gateway, dan route HTTP terdaftar. Inspeksi runtime melaporkan dependensi plugin yang hilang secara langsung; instalasi dan perbaikan tetap berada di `openclaw plugins install`, `openclaw plugins update`, dan `openclaw doctor --fix`.

Perintah CLI milik plugin biasanya diinstal sebagai grup perintah root `openclaw`, tetapi plugin juga dapat mendaftarkan perintah bertingkat di bawah induk inti seperti `openclaw nodes`. Setelah `inspect --runtime` menampilkan perintah di bawah `cliCommands`, jalankan di path yang tercantum; misalnya plugin yang mendaftarkan `demo-git` dapat diverifikasi dengan `openclaw demo-git ping`.

Setiap plugin diklasifikasikan berdasarkan apa yang benar-benar didaftarkannya saat runtime:

- **plain-capability** — satu tipe kapabilitas (mis. plugin khusus provider)
- **hybrid-capability** — beberapa tipe kapabilitas (mis. teks + ucapan + gambar)
- **hook-only** — hanya hook, tanpa kapabilitas atau surface
- **non-capability** — alat/perintah/layanan tetapi tanpa kapabilitas

Lihat [Bentuk Plugin](/id/plugins/architecture#plugin-shapes) untuk informasi lebih lanjut tentang model kapabilitas.

<Note>
Flag `--json` menghasilkan laporan yang dapat dibaca mesin dan cocok untuk scripting serta audit. `inspect --all` merender tabel seluruh fleet dengan kolom bentuk, jenis kapabilitas, pemberitahuan kompatibilitas, kapabilitas bundle, dan ringkasan hook. `info` adalah alias untuk `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` melaporkan error pemuatan plugin, diagnostik manifes/discovery, pemberitahuan kompatibilitas, dan referensi konfigurasi plugin usang seperti slot plugin yang hilang. Ketika tree instalasi dan konfigurasi plugin bersih, perintah ini mencetak `No plugin issues detected.` Jika konfigurasi usang masih ada tetapi tree instalasi selain itu sehat, ringkasan menyatakannya demikian alih-alih menyiratkan kesehatan plugin penuh.

Jika plugin yang dikonfigurasi ada di disk tetapi diblokir oleh pemeriksaan keamanan path loader, validasi konfigurasi mempertahankan entri plugin dan melaporkannya sebagai `present but blocked`. Perbaiki diagnostik plugin terblokir sebelumnya, seperti kepemilikan path atau izin world-writable, alih-alih menghapus konfigurasi `plugins.entries.<id>` atau `plugins.allow`.

Untuk kegagalan bentuk modul seperti ekspor `register`/`activate` yang hilang, jalankan ulang dengan `OPENCLAW_PLUGIN_LOAD_DEBUG=1` untuk menyertakan ringkasan bentuk ekspor yang ringkas dalam output diagnostik.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Registry plugin lokal adalah model baca dingin persisten OpenClaw untuk identitas plugin terinstal, pengaktifan, metadata sumber, dan kepemilikan kontribusi. Startup normal, lookup pemilik provider, klasifikasi penyiapan channel, dan inventaris plugin dapat membacanya tanpa mengimpor modul runtime plugin.

Gunakan `plugins registry` untuk memeriksa apakah registry persisten ada, mutakhir, atau usang. Gunakan `--refresh` untuk membangunnya ulang dari indeks plugin persisten, kebijakan konfigurasi, dan metadata manifes/paket. Ini adalah path perbaikan, bukan path aktivasi runtime.

`openclaw doctor --fix` juga memperbaiki drift npm terkelola yang bersebelahan dengan registry: jika paket `@openclaw/*` yatim atau dipulihkan di bawah proyek npm plugin terkelola atau root npm terkelola datar legacy membayangi plugin bawaan, doctor menghapus paket usang tersebut dan membangun ulang registry sehingga startup memvalidasi terhadap manifes bawaan. Doctor juga menautkan ulang paket host `openclaw` ke plugin npm terkelola yang mendeklarasikan `peerDependencies.openclaw`, sehingga import runtime lokal paket seperti `openclaw/plugin-sdk/*` dapat diselesaikan setelah pembaruan atau perbaikan npm.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` adalah switch kompatibilitas break-glass yang sudah usang untuk kegagalan baca registry. Lebih baik gunakan `plugins registry --refresh` atau `openclaw doctor --fix`; fallback env hanya untuk pemulihan startup darurat selama migrasi diluncurkan.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Daftar marketplace menerima path marketplace lokal, path `marketplace.json`, shorthand GitHub seperti `owner/repo`, URL repo GitHub, atau URL git. `--json` mencetak label sumber yang diselesaikan beserta manifes marketplace yang diparse dan entri plugin.

## Terkait

- [Membangun plugin](/id/plugins/building-plugins)
- [Referensi CLI](/id/cli)
- [ClawHub](/id/clawhub)
