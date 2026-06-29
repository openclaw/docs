---
read_when:
    - Anda ingin menginstal atau mengelola Plugin Gateway atau bundel yang kompatibel
    - Anda ingin membuat kerangka atau memvalidasi Plugin alat sederhana
    - Anda ingin melakukan debug pada kegagalan pemuatan plugin
sidebarTitle: Plugins
summary: Referensi CLI untuk `openclaw plugins` (init, build, validate, list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-06-28T22:33:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 528a7ead224eab330bc0a83314d205a68c7f814ad336441aee7b19170c105e43
    source_path: cli/plugins.md
    workflow: 16
---

Kelola plugin Gateway, paket hook, dan bundel yang kompatibel.

<CardGroup cols={2}>
  <Card title="Plugin system" href="/id/tools/plugin">
    Panduan pengguna akhir untuk menginstal, mengaktifkan, dan memecahkan masalah plugin.
  </Card>
  <Card title="Manage plugins" href="/id/plugins/manage-plugins">
    Contoh cepat untuk instalasi, daftar, pembaruan, penghapusan instalasi, dan penerbitan.
  </Card>
  <Card title="Plugin bundles" href="/id/plugins/bundles">
    Model kompatibilitas bundel.
  </Card>
  <Card title="Plugin manifest" href="/id/plugins/manifest">
    Bidang manifes dan skema konfigurasi.
  </Card>
  <Card title="Security" href="/id/gateway/security">
    Penguatan keamanan untuk instalasi plugin.
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
openclaw plugins marketplace entries
openclaw plugins marketplace entries --offline
openclaw plugins marketplace entries --json
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

Untuk investigasi instalasi, inspeksi, penghapusan instalasi, atau penyegaran registry yang lambat, jalankan
perintah dengan `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Trace menulis pengaturan waktu fase
ke stderr dan menjaga output JSON tetap dapat di-parse. Lihat [Debugging](/id/help/debugging#plugin-lifecycle-trace).

<Note>
Dalam mode Nix (`OPENCLAW_NIX_MODE=1`), mutator siklus hidup plugin dinonaktifkan. Gunakan sumber Nix untuk instalasi ini alih-alih `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable`, atau `plugins disable`; untuk nix-openclaw, gunakan [Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) yang mengutamakan agen.
</Note>

<Note>
Plugin bawaan dikirim bersama OpenClaw. Sebagian diaktifkan secara default (misalnya penyedia model bawaan, penyedia ucapan bawaan, dan plugin browser bawaan); yang lain memerlukan `plugins enable`.

Plugin OpenClaw native harus mengirim `openclaw.plugin.json` dengan JSON Schema inline (`configSchema`, bahkan jika kosong). Bundel yang kompatibel menggunakan manifes bundelnya sendiri.

`plugins list` menampilkan `Format: openclaw` atau `Format: bundle`. Output daftar/info verbose juga menampilkan subtipe bundel (`codex`, `claude`, atau `cursor`) serta kapabilitas bundel yang terdeteksi.
</Note>

### Penulis

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` membuat plugin alat TypeScript minimal secara default. Argumen pertama
adalah id plugin; teruskan `--name` untuk nama tampilan. OpenClaw menggunakan
id untuk direktori output default dan penamaan paket. Scaffold alat menggunakan
`defineToolPlugin`.
`plugins build` mengimpor entri yang sudah dibangun, membaca metadata alat statisnya, menulis
`openclaw.plugin.json`, dan menjaga `package.json` `openclaw.extensions` tetap selaras.
`plugins validate` memeriksa bahwa manifes yang dihasilkan, metadata paket, dan
ekspor entri saat ini masih sesuai. Lihat [Plugin Alat](/id/plugins/tool-plugins) untuk
alur kerja lengkap penulisan alat.

Scaffold menulis sumber TypeScript tetapi menghasilkan metadata dari entri
`./dist/index.js` yang sudah dibangun sehingga alur kerja juga berfungsi dengan CLI yang diterbitkan. Gunakan
`--entry <path>` saat entri bukan entri paket default. Gunakan
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

Scaffold penyedia membuat plugin penyedia teks/model generik dengan plumbing
kunci API yang kompatibel dengan OpenAI, skrip bawaan `npm run validate` untuk `clawhub package
validate`, metadata paket ClawHub, dan workflow GitHub yang dipicu secara manual
untuk penerbitan tepercaya di masa mendatang melalui GitHub Actions OIDC. Scaffold penyedia
tidak menghasilkan skills dan tidak menggunakan `openclaw plugins build` atau
`openclaw plugins validate`; perintah tersebut ditujukan untuk jalur metadata yang dihasilkan
oleh scaffold alat.

Sebelum menerbitkan, ganti URL dasar API placeholder, katalog model, rute docs,
teks kredensial, dan salinan README dengan detail penyedia nyata. Gunakan
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

Maintainer yang menguji instalasi saat penyiapan dapat menimpa sumber instalasi plugin otomatis
dengan variabel lingkungan yang dijaga. Lihat
[penimpaan instalasi Plugin](/id/plugins/install-overrides).

<Warning>
Nama paket tanpa awalan diinstal dari npm secara default selama cutover peluncuran, kecuali cocok dengan id plugin resmi. Spesifikasi paket mentah `@openclaw/*` yang cocok dengan plugin bawaan menggunakan salinan bawaan yang dikirim bersama build OpenClaw saat ini. Gunakan `npm:<package>` saat Anda memang menginginkan paket npm eksternal. Gunakan `clawhub:<package>` untuk ClawHub. Perlakukan instalasi plugin seperti menjalankan kode. Utamakan versi yang dipin.
</Warning>

`plugins search` menanyakan ClawHub untuk paket plugin yang dapat diinstal dan mencetak
nama paket siap instal. Perintah ini mencari paket code-plugin dan bundle-plugin,
bukan skills. Gunakan `openclaw skills search` untuk skills ClawHub.

<Note>
ClawHub adalah permukaan distribusi dan penemuan utama untuk sebagian besar plugin. Npm
tetap menjadi fallback yang didukung dan jalur instalasi langsung. Paket plugin
`@openclaw/*` milik OpenClaw diterbitkan lagi di npm; lihat daftar saat ini
di [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) atau
[inventaris plugin](/id/plugins/plugin-inventory). Instalasi stabil menggunakan `latest`.
Instalasi dan pembaruan kanal beta mengutamakan dist-tag npm `beta` saat tag tersebut
tersedia, lalu fallback ke `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Config includes and invalid-config repair">
    Jika bagian `plugins` Anda didukung oleh `$include` satu file, `plugins install/update/enable/disable/uninstall` menulis ke file yang di-include tersebut dan membiarkan `openclaw.json` tidak berubah. Include root, array include, dan include dengan override saudara gagal tertutup alih-alih diratakan. Lihat [include konfigurasi](/id/gateway/configuration) untuk bentuk yang didukung.

    Jika konfigurasi tidak valid selama instalasi, `plugins install` biasanya gagal tertutup dan meminta Anda menjalankan `openclaw doctor --fix` terlebih dahulu. Selama startup Gateway dan hot reload, konfigurasi plugin yang tidak valid gagal tertutup seperti konfigurasi tidak valid lainnya; `openclaw doctor --fix` dapat mengarantina entri plugin yang tidak valid. Satu-satunya pengecualian terdokumentasi pada waktu instalasi adalah jalur pemulihan sempit untuk plugin bawaan yang secara eksplisit ikut serta dalam `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force and reinstall vs update">
    `--force` menggunakan ulang target instalasi yang ada dan menimpa plugin atau paket hook yang sudah terinstal di tempat. Gunakan saat Anda sengaja menginstal ulang id yang sama dari path lokal, arsip, paket ClawHub, atau artefak npm baru. Untuk peningkatan rutin plugin npm yang sudah dilacak, utamakan `openclaw plugins update <id-or-npm-spec>`.

    Jika Anda menjalankan `plugins install` untuk id plugin yang sudah terinstal, OpenClaw berhenti dan mengarahkan Anda ke `plugins update <id-or-npm-spec>` untuk peningkatan normal, atau ke `plugins install <package> --force` saat Anda benar-benar ingin menimpa instalasi saat ini dari sumber berbeda.

  </Accordion>
  <Accordion title="--pin scope">
    `--pin` hanya berlaku untuk instalasi npm. Ini tidak didukung dengan instalasi `git:`; gunakan ref git eksplisit seperti `git:github.com/acme/plugin@v1.2.3` saat Anda menginginkan sumber yang dipin. Ini tidak didukung dengan `--marketplace`, karena instalasi marketplace mempertahankan metadata sumber marketplace, bukan spesifikasi npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` sudah usang dan kini tidak melakukan apa pun. OpenClaw tidak lagi menjalankan pemblokiran kode berbahaya bawaan pada waktu instalasi untuk instalasi plugin.

    Gunakan permukaan bersama milik operator `security.installPolicy` saat kebijakan instalasi khusus host diperlukan. Hook `before_install` plugin adalah hook siklus hidup runtime plugin dan bukan batas kebijakan utama untuk instalasi CLI.

    Jika plugin yang Anda terbitkan di ClawHub disembunyikan atau diblokir oleh pemindaian registry, gunakan langkah penerbit di [penerbitan ClawHub](/id/clawhub/publishing). `--dangerously-force-unsafe-install` tidak meminta ClawHub memindai ulang plugin atau membuat rilis yang diblokir menjadi publik.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    Instalasi ClawHub komunitas memeriksa catatan kepercayaan rilis yang dipilih sebelum mengunduh paket. Jika ClawHub menonaktifkan unduhan untuk rilis tersebut, melaporkan temuan pemindaian berbahaya, atau menempatkan rilis dalam status moderasi yang memblokir seperti karantina, OpenClaw menolak rilis tersebut. Untuk status pemindaian berisiko yang tidak memblokir, status moderasi berisiko, atau alasan registry, OpenClaw menampilkan detail kepercayaan dan meminta konfirmasi sebelum melanjutkan.

    Gunakan `--acknowledge-clawhub-risk` hanya setelah meninjau peringatan ClawHub dan memutuskan untuk melanjutkan tanpa prompt interaktif. Catatan kepercayaan bersih yang tertunda atau usang memperingatkan tetapi tidak memerlukan pengakuan. Paket ClawHub resmi dan sumber plugin OpenClaw bawaan melewati prompt kepercayaan rilis ini.

  </Accordion>
  <Accordion title="Hook packs and npm specs">
    `plugins install` juga merupakan permukaan instalasi untuk paket hook yang mengekspos `openclaw.hooks` di `package.json`. Gunakan `openclaw hooks` untuk visibilitas hook terfilter dan pengaktifan per hook, bukan instalasi paket.

    Spesifikasi npm bersifat **hanya registry** (nama paket + **versi persis** atau **dist-tag** opsional). Spesifikasi Git/URL/file dan rentang semver ditolak. Instalasi dependensi berjalan dalam satu proyek npm terkelola per plugin dengan `--ignore-scripts` demi keamanan, bahkan ketika shell Anda memiliki pengaturan instalasi npm global. Proyek npm plugin terkelola mewarisi `overrides` npm tingkat paket milik OpenClaw, sehingga pin keamanan host juga berlaku untuk dependensi plugin yang di-hoist.

    Gunakan `npm:<package>` saat Anda ingin membuat resolusi npm eksplisit. Spesifikasi paket polos juga diinstal langsung dari npm selama cutover peluncuran kecuali cocok dengan id plugin resmi.

    Spesifikasi paket mentah `@openclaw/*` yang cocok dengan plugin bawaan diselesaikan ke salinan bawaan milik image sebelum fallback npm. Misalnya, `openclaw plugins install @openclaw/discord@2026.5.20 --pin` menggunakan plugin Discord bawaan dari build OpenClaw saat ini alih-alih membuat override npm terkelola. Untuk memaksa paket npm eksternal, gunakan `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`.

    Spesifikasi polos dan `@latest` tetap berada di jalur stabil. Versi koreksi bertanggal OpenClaw seperti `2026.5.3-1` adalah rilis stabil untuk pemeriksaan ini. Jika npm menyelesaikan salah satunya ke prarilis, OpenClaw berhenti dan meminta Anda ikut serta secara eksplisit dengan tag prarilis seperti `@beta`/`@rc` atau versi prarilis persis seperti `@1.2.3-beta.4`.

    Untuk instalasi npm tanpa versi persis (`npm:<package>` atau `npm:<package>@latest`), OpenClaw memeriksa metadata paket yang diselesaikan sebelum instalasi. Jika paket stabil terbaru memerlukan API plugin OpenClaw yang lebih baru atau versi host minimum, OpenClaw memeriksa versi stabil yang lebih lama dan menginstal rilis kompatibel terbaru sebagai gantinya. Versi persis dan dist-tag eksplisit seperti `@beta` tetap ketat: jika paket yang dipilih tidak kompatibel, perintah gagal dan meminta Anda meningkatkan OpenClaw atau memilih versi yang kompatibel.

    Jika spesifikasi instalasi polos cocok dengan id plugin resmi (misalnya `diffs`), OpenClaw langsung menginstal entri katalog. Untuk menginstal paket npm dengan nama yang sama, gunakan spesifikasi scoped eksplisit (misalnya `@scope/diffs`).

  </Accordion>
  <Accordion title="Repositori Git">
    Gunakan `git:<repo>` untuk menginstal langsung dari repositori git. Bentuk yang didukung mencakup URL clone `git:github.com/owner/repo`, `git:owner/repo`, `https://` penuh, `ssh://`, `git://`, `file://`, dan `git@host:owner/repo.git`. Tambahkan `@<ref>` atau `#<ref>` untuk check out branch, tag, atau commit sebelum instalasi.

    Instalasi Git meng-clone ke direktori sementara, check out ref yang diminta jika ada, lalu menggunakan installer direktori plugin normal. Itu berarti validasi manifes, kebijakan instal operator, pekerjaan instal package-manager, dan catatan instalasi berperilaku seperti instalasi npm. Instalasi git yang dicatat menyertakan URL/ref sumber plus commit yang diselesaikan sehingga `openclaw plugins update` dapat menyelesaikan ulang sumber tersebut nanti.

    Setelah menginstal dari git, gunakan `openclaw plugins inspect <id> --runtime --json` untuk memverifikasi registrasi runtime seperti metode Gateway dan perintah CLI. Jika plugin mendaftarkan root CLI dengan `api.registerCli`, jalankan perintah itu langsung melalui CLI root OpenClaw, misalnya `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Arsip">
    Arsip yang didukung: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Arsip plugin OpenClaw native harus berisi `openclaw.plugin.json` yang valid di root plugin hasil ekstraksi; arsip yang hanya berisi `package.json` ditolak sebelum OpenClaw menulis catatan instalasi.

    Gunakan `npm-pack:<path.tgz>` ketika file adalah tarball npm-pack dan Anda ingin
    menguji jalur proyek npm terkelola per plugin yang sama dengan yang digunakan
    oleh instalasi registry, termasuk verifikasi `package-lock.json`, pemindaian
    dependensi yang di-hoist, dan catatan instalasi npm. Jalur arsip biasa tetap
    diinstal sebagai arsip lokal di bawah root ekstensi plugin.

    Instalasi marketplace Claude juga didukung.

  </Accordion>
</AccordionGroup>

Instalasi ClawHub menggunakan locator `clawhub:<package>` eksplisit:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Spesifikasi plugin polos yang aman untuk npm diinstal dari npm secara default selama cutover peluncuran kecuali cocok dengan id plugin resmi:

```bash
openclaw plugins install openclaw-codex-app-server
```

Gunakan `npm:` untuk membuat resolusi khusus npm eksplisit:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw memeriksa kompatibilitas API plugin / Gateway minimum yang diiklankan sebelum instalasi. Ketika versi ClawHub yang dipilih menerbitkan artefak ClawPack, OpenClaw mengunduh `.tgz` npm-pack berversi, memverifikasi header digest ClawHub dan digest artefak, lalu menginstalnya melalui jalur arsip normal. Versi ClawHub yang lebih lama tanpa metadata ClawPack tetap diinstal melalui jalur verifikasi arsip paket lama. Instalasi yang dicatat menyimpan metadata sumber ClawHub, jenis artefak, integritas npm, shasum npm, nama tarball, dan fakta digest ClawPack untuk pembaruan berikutnya.
Instalasi ClawHub tanpa versi menyimpan spesifikasi tercatat tanpa versi sehingga `openclaw plugins update` dapat mengikuti rilis ClawHub yang lebih baru; selector versi atau tag eksplisit seperti `clawhub:pkg@1.2.3` dan `clawhub:pkg@beta` tetap dipin ke selector tersebut.

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
  <Tab title="Sumber marketplace">
    - nama known-marketplace Claude dari `~/.claude/plugins/known_marketplaces.json`
    - root marketplace lokal atau jalur `marketplace.json`
    - singkatan repo GitHub seperti `owner/repo`
    - URL repo GitHub seperti `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="Aturan marketplace jarak jauh">
    Untuk marketplace jarak jauh yang dimuat dari GitHub atau git, entri plugin harus tetap berada di dalam repo marketplace yang di-clone. OpenClaw menerima sumber jalur relatif dari repo tersebut dan menolak HTTP(S), absolute-path, git, GitHub, dan sumber plugin non-path lainnya dari manifes jarak jauh.
  </Tab>
</Tabs>

Untuk jalur lokal dan arsip, OpenClaw mendeteksi otomatis:

- plugin OpenClaw native (`openclaw.plugin.json`)
- bundle yang kompatibel dengan Codex (`.codex-plugin/plugin.json`)
- bundle yang kompatibel dengan Claude (`.claude-plugin/plugin.json` atau tata letak komponen default Claude)
- bundle yang kompatibel dengan Cursor (`.cursor-plugin/plugin.json`)

Instalasi lokal terkelola harus berupa direktori plugin atau arsip. File plugin mandiri `.js`,
`.mjs`, `.cjs`, dan `.ts` tidak disalin ke root plugin terkelola
oleh `plugins install`; cantumkan file tersebut secara eksplisit di `plugins.load.paths` sebagai gantinya.

<Note>
Bundle kompatibel diinstal ke root plugin normal dan ikut serta dalam alur list/info/enable/disable yang sama. Saat ini, Skills bundle, command-skills Claude, default `settings.json` Claude, default `.lsp.json` / `lspServers` yang dideklarasikan manifes Claude, command-skills Cursor, dan direktori hook Codex yang kompatibel didukung; kapabilitas bundle lain yang terdeteksi ditampilkan dalam diagnostik/info tetapi belum dihubungkan ke eksekusi runtime.
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
  Tampilkan hanya plugin yang diaktifkan.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Beralih dari tampilan tabel ke baris detail per plugin dengan metadata sumber/asal/versi/aktivasi.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventaris yang dapat dibaca mesin plus diagnostik registry dan status instalasi dependensi paket.
</ParamField>

<Note>
`plugins list` membaca registry plugin lokal yang dipersist terlebih dahulu, dengan fallback turunan hanya manifes ketika registry hilang atau tidak valid. Ini berguna untuk memeriksa apakah plugin terinstal, diaktifkan, dan terlihat oleh perencanaan cold startup, tetapi bukan probe runtime langsung terhadap proses Gateway yang sudah berjalan. Setelah mengubah kode plugin, enablement, kebijakan hook, atau `plugins.load.paths`, mulai ulang Gateway yang melayani channel sebelum mengharapkan kode `register(api)` atau hook baru berjalan. Untuk deployment jarak jauh/container, verifikasi bahwa Anda memulai ulang child `openclaw gateway run` yang sebenarnya, bukan hanya proses wrapper.

`plugins list --json` menyertakan `dependencyStatus` setiap plugin dari `package.json`
`dependencies` dan `optionalDependencies`. OpenClaw memeriksa apakah nama paket
tersebut ada di sepanjang jalur lookup `node_modules` Node normal milik plugin;
OpenClaw tidak mengimpor kode runtime plugin, menjalankan package manager, atau memperbaiki
dependensi yang hilang.
</Note>

Jika log startup menampilkan `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`,
jalankan `openclaw plugins list --enabled --verbose` atau
`openclaw plugins inspect <id>` dengan id plugin yang tercantum untuk mengonfirmasi id
plugin dan menyalin id tepercaya ke `plugins.allow` di `openclaw.json`. Ketika
peringatan dapat mencantumkan setiap plugin yang ditemukan, peringatan itu mencetak snippet
`plugins.allow` siap tempel yang sudah menyertakan id tersebut. Jika plugin dimuat
tanpa provenance install/load-path, periksa id plugin tersebut, lalu pin
id tepercaya di `plugins.allow` atau instal ulang plugin dari sumber tepercaya
agar OpenClaw mencatat provenance instalasi.

`plugins search` adalah lookup katalog ClawHub jarak jauh. Ini tidak memeriksa state
lokal, mengubah config, menginstal paket, atau memuat kode runtime plugin. Hasil
pencarian menyertakan nama paket ClawHub, family, channel, versi, ringkasan, dan
petunjuk instalasi seperti `openclaw plugins install clawhub:<package>`.

Untuk pekerjaan plugin bawaan di dalam image Docker terpaket, bind-mount direktori
sumber plugin di atas jalur sumber terpaket yang cocok, seperti
`/app/extensions/synology-chat`. OpenClaw akan menemukan overlay sumber yang di-mount
itu sebelum `/app/dist/extensions/synology-chat`; direktori sumber yang hanya disalin
tetap inert sehingga instalasi terpaket normal tetap menggunakan dist terkompilasi.

Untuk debugging hook runtime:

- `openclaw plugins inspect <id> --runtime --json` menampilkan hook dan diagnostik terdaftar dari pass inspeksi yang memuat modul. Inspeksi runtime tidak pernah menginstal dependensi; gunakan `openclaw doctor --fix` untuk membersihkan state dependensi lama atau memulihkan plugin downloadable yang hilang yang dirujuk oleh config.
- `openclaw gateway status --deep --require-rpc` mengonfirmasi URL/profil Gateway yang dapat dijangkau, petunjuk service/proses, jalur config, dan kesehatan RPC.
- Hook percakapan non-bawaan (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) memerlukan `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Gunakan `--link` untuk menghindari penyalinan direktori plugin lokal (menambahkan ke `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

File plugin mandiri harus dicantumkan di `plugins.load.paths` alih-alih
diinstal dengan `plugins install` atau ditempatkan langsung di `~/.openclaw/extensions`
atau `<workspace>/.openclaw/extensions`. Root yang ditemukan otomatis tersebut memuat
direktori paket plugin atau bundle, sementara file skrip tingkat atas diperlakukan sebagai
helper lokal dan dilewati.

<Note>
Plugin asal-workspace yang ditemukan dari root ekstensi workspace tidak
diimpor atau dieksekusi sampai diaktifkan secara eksplisit. Untuk pengembangan lokal,
jalankan `openclaw plugins enable <plugin-id>` atau atur
`plugins.entries.<plugin-id>.enabled: true`; jika konfigurasi Anda menggunakan
`plugins.allow`, sertakan id plugin yang sama di sana juga. Aturan fail-closed ini
juga berlaku saat penyiapan channel secara eksplisit menargetkan plugin asal-workspace untuk
pemuatan khusus-penyiapan, sehingga kode penyiapan plugin channel lokal tidak akan berjalan selama
plugin workspace tersebut tetap dinonaktifkan atau dikecualikan dari allowlist. Instalasi tertaut
dan entri `plugins.load.paths` eksplisit mengikuti kebijakan normal untuk
asal plugin yang di-resolve. Lihat
[Konfigurasikan kebijakan plugin](/id/tools/plugin#configure-plugin-policy)
dan [Referensi konfigurasi](/id/gateway/configuration-reference#plugins).

`--force` tidak didukung dengan `--link` karena instalasi tertaut menggunakan ulang jalur sumber alih-alih menyalin ke target instalasi terkelola.

Gunakan `--pin` pada instalasi npm untuk menyimpan spec persis yang di-resolve (`name@version`) dalam indeks plugin terkelola sambil mempertahankan perilaku default tanpa pin.
</Note>

### Indeks plugin

Metadata instalasi plugin adalah state yang dikelola mesin, bukan konfigurasi pengguna. Instalasi dan pembaruan menulisnya ke database state SQLite bersama di bawah direktori state OpenClaw yang aktif. Baris `installed_plugin_index` menyimpan metadata `installRecords` yang tahan lama, termasuk record untuk manifes plugin yang rusak atau hilang, plus cache registry dingin turunan manifes yang digunakan oleh `openclaw plugins update`, uninstall, diagnostik, dan registry plugin dingin.

Saat OpenClaw melihat record `plugins.installs` legacy yang telah dikirim dalam konfigurasi, pembacaan runtime memperlakukannya sebagai input kompatibilitas tanpa menulis ulang `openclaw.json`. Penulisan plugin eksplisit dan `openclaw doctor --fix` memindahkan record tersebut ke indeks plugin dan menghapus kunci konfigurasi saat penulisan konfigurasi diizinkan; jika salah satu penulisan gagal, record konfigurasi dipertahankan agar metadata instalasi tidak hilang.

### Uninstall

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` menghapus record plugin dari `plugins.entries`, indeks plugin yang dipersistenkan, entri daftar allow/deny plugin, dan entri `plugins.load.paths` tertaut jika berlaku. Kecuali `--keep-files` diatur, uninstall juga menghapus direktori instalasi terkelola yang dilacak saat berada di dalam root ekstensi plugin OpenClaw. Untuk plugin active memory, slot memori direset ke `memory-core`.

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

Pembaruan berlaku untuk instalasi plugin yang dilacak dalam indeks plugin terkelola dan instalasi hook-pack yang dilacak di `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Me-resolve id plugin vs spec npm">
    Saat Anda meneruskan id plugin, OpenClaw menggunakan ulang spec instalasi yang direkam untuk plugin tersebut. Itu berarti dist-tag yang sebelumnya disimpan seperti `@beta` dan versi persis yang dipin terus digunakan pada eksekusi `update <id>` berikutnya.

    Selama `update <id> --dry-run`, instalasi npm dengan pin persis tetap dipin. Jika OpenClaw juga dapat me-resolve baris default registry paket dan baris default tersebut lebih baru daripada versi terpasang yang dipin, dry run melaporkan pin tersebut dan mencetak perintah pembaruan paket `@latest` eksplisit untuk mengikuti baris default registry.

    Aturan pembaruan tertarget itu berbeda dari jalur pemeliharaan massal `openclaw plugins update --all`. Pembaruan massal tetap menghormati spec instalasi terlacak biasa, tetapi record plugin resmi OpenClaw tepercaya dapat disinkronkan ke target katalog resmi saat ini alih-alih tetap berada pada paket resmi persis yang sudah usang. Gunakan `update <id>` tertarget saat Anda sengaja ingin mempertahankan spec resmi persis atau bertag tanpa disentuh.

    Untuk instalasi npm, Anda juga dapat meneruskan spec paket npm eksplisit dengan dist-tag atau versi persis. OpenClaw me-resolve nama paket tersebut kembali ke record plugin terlacak, memperbarui plugin terpasang tersebut, dan merekam spec npm baru untuk pembaruan berbasis id di masa mendatang.

    Meneruskan nama paket npm tanpa versi atau tag juga me-resolve kembali ke record plugin terlacak. Gunakan ini saat plugin dipin ke versi persis dan Anda ingin memindahkannya kembali ke baris rilis default registry.

  </Accordion>
  <Accordion title="Pembaruan channel beta">
    `openclaw plugins update <id-or-npm-spec>` tertarget menggunakan ulang spec plugin terlacak kecuali Anda meneruskan spec baru. `openclaw plugins update --all` massal menggunakan `update.channel` yang dikonfigurasi saat menyinkronkan record plugin resmi tepercaya ke target katalog resmi, sehingga instalasi channel beta dapat tetap berada pada baris rilis beta alih-alih diam-diam dinormalisasi ke stable/latest.

    `openclaw update` juga mengetahui channel pembaruan OpenClaw yang aktif: pada channel beta, record plugin npm baris-default dan ClawHub mencoba `@beta` terlebih dahulu. Mereka fallback ke spec default/latest yang direkam jika tidak ada rilis beta plugin; plugin npm juga fallback saat paket beta ada tetapi gagal validasi instalasi. Fallback tersebut dilaporkan sebagai peringatan dan tidak menggagalkan pembaruan core. Versi persis dan tag eksplisit tetap dipin ke pemilih tersebut untuk pembaruan tertarget.

  </Accordion>
  <Accordion title="Pemeriksaan versi dan drift integritas">
    Sebelum pembaruan npm live, OpenClaw memeriksa versi paket terpasang terhadap metadata registry npm. Jika versi terpasang dan identitas artefak yang direkam sudah cocok dengan target yang di-resolve, pembaruan dilewati tanpa mengunduh, menginstal ulang, atau menulis ulang `openclaw.json`.

    Saat hash integritas tersimpan ada dan hash artefak yang diambil berubah, OpenClaw memperlakukan itu sebagai drift artefak npm. Perintah interaktif `openclaw plugins update` mencetak hash yang diharapkan dan aktual serta meminta konfirmasi sebelum melanjutkan. Helper pembaruan non-interaktif fail closed kecuali pemanggil menyediakan kebijakan kelanjutan eksplisit.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install pada pembaruan">
    `--dangerously-force-unsafe-install` juga diterima pada `plugins update` untuk kompatibilitas, tetapi sudah usang dan tidak lagi mengubah perilaku pembaruan plugin. Operator `security.installPolicy` masih dapat memblokir pembaruan; hook plugin `before_install` hanya berlaku dalam proses tempat hook plugin dimuat.
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk pada pembaruan">
    Pembaruan plugin komunitas berbasis ClawHub menjalankan pemeriksaan kepercayaan rilis-persis yang sama seperti instalasi sebelum mengunduh paket pengganti. Gunakan `--acknowledge-clawhub-risk` untuk otomatisasi yang telah ditinjau yang harus berlanjut saat rilis ClawHub terpilih memiliki peringatan kepercayaan berisiko. Paket ClawHub resmi dan sumber plugin OpenClaw yang dibundel melewati prompt kepercayaan rilis ini.
  </Accordion>
</AccordionGroup>

### Inspeksi

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect menampilkan identitas, status muat, sumber, kapabilitas manifes, flag kebijakan, diagnostik, metadata instalasi, kapabilitas bundel, dan dukungan server MCP atau LSP yang terdeteksi tanpa mengimpor runtime plugin secara default. Output JSON mencakup kontrak manifes plugin, seperti `contracts.agentToolResultMiddleware` dan `contracts.trustedToolPolicies`, sehingga operator dapat mengaudit deklarasi permukaan tepercaya sebelum mengaktifkan atau memulai ulang plugin. Tambahkan `--runtime` untuk memuat modul plugin dan menyertakan hook, alat, perintah, layanan, metode gateway, dan rute HTTP yang terdaftar. Inspeksi runtime melaporkan dependensi plugin yang hilang secara langsung; instalasi dan perbaikan tetap berada di `openclaw plugins install`, `openclaw plugins update`, dan `openclaw doctor --fix`.

Perintah CLI milik plugin biasanya diinstal sebagai grup perintah root `openclaw`, tetapi plugin juga dapat mendaftarkan perintah bersarang di bawah induk core seperti `openclaw nodes`. Setelah `inspect --runtime` menampilkan perintah di bawah `cliCommands`, jalankan pada jalur yang tercantum; misalnya plugin yang mendaftarkan `demo-git` dapat diverifikasi dengan `openclaw demo-git ping`.

Setiap plugin diklasifikasikan berdasarkan apa yang benar-benar didaftarkannya saat runtime:

- **plain-capability** — satu tipe kapabilitas (mis. plugin khusus provider)
- **hybrid-capability** — beberapa tipe kapabilitas (mis. teks + ucapan + gambar)
- **hook-only** — hanya hook, tanpa kapabilitas atau permukaan
- **non-capability** — alat/perintah/layanan tetapi tanpa kapabilitas

Lihat [Bentuk plugin](/id/plugins/architecture#plugin-shapes) untuk informasi selengkapnya tentang model kapabilitas.

<Note>
Flag `--json` menghasilkan laporan yang dapat dibaca mesin dan cocok untuk scripting serta audit. `inspect --all` merender tabel seluruh fleet dengan kolom bentuk, jenis kapabilitas, pemberitahuan kompatibilitas, kapabilitas bundel, dan ringkasan hook. `info` adalah alias untuk `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` melaporkan error pemuatan plugin, diagnostik manifes/discovery, pemberitahuan kompatibilitas, dan referensi konfigurasi plugin usang seperti slot plugin yang hilang. Saat pohon instalasi dan konfigurasi plugin bersih, perintah ini mencetak `No plugin issues detected.` Jika konfigurasi usang masih tersisa tetapi pohon instalasi selain itu sehat, ringkasan menyatakan demikian alih-alih menyiratkan kesehatan plugin penuh.

Jika plugin yang dikonfigurasi ada di disk tetapi diblokir oleh pemeriksaan keamanan jalur loader, validasi konfigurasi mempertahankan entri plugin dan melaporkannya sebagai `present but blocked`. Perbaiki diagnostik plugin-terblokir sebelumnya, seperti kepemilikan jalur atau izin world-writable, alih-alih menghapus konfigurasi `plugins.entries.<id>` atau `plugins.allow`.

Untuk kegagalan bentuk-modul seperti ekspor `register`/`activate` yang hilang, jalankan ulang dengan `OPENCLAW_PLUGIN_LOAD_DEBUG=1` untuk menyertakan ringkasan bentuk ekspor yang ringkas dalam output diagnostik.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Registry plugin lokal adalah model baca dingin yang dipersistenkan OpenClaw untuk identitas plugin terpasang, pengaktifan, metadata sumber, dan kepemilikan kontribusi. Startup normal, pencarian owner provider, klasifikasi penyiapan channel, dan inventaris plugin dapat membacanya tanpa mengimpor modul runtime plugin.

Gunakan `plugins registry` untuk memeriksa apakah registry yang dipersistenkan ada, mutakhir, atau usang. Gunakan `--refresh` untuk membangunnya ulang dari indeks plugin yang dipersistenkan, kebijakan konfigurasi, dan metadata manifes/paket. Ini adalah jalur perbaikan, bukan jalur aktivasi runtime.

`openclaw doctor --fix` juga memperbaiki drift npm terkelola yang berdekatan dengan registry: jika paket `@openclaw/*` yatim atau dipulihkan di bawah proyek npm plugin terkelola atau root npm terkelola datar legacy membayangi plugin yang dibundel, doctor menghapus paket usang tersebut dan membangun ulang registry sehingga startup memvalidasi terhadap manifes yang dibundel. Doctor juga menautkan ulang paket host `openclaw` ke plugin npm terkelola yang mendeklarasikan `peerDependencies.openclaw`, sehingga impor runtime lokal-paket seperti `openclaw/plugin-sdk/*` di-resolve setelah pembaruan atau perbaikan npm.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` adalah switch kompatibilitas break-glass usang untuk kegagalan baca registry. Pilih `plugins registry --refresh` atau `openclaw doctor --fix`; fallback env hanya untuk pemulihan startup darurat selama migrasi diluncurkan.
</Warning>

### Marketplace

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

`plugins marketplace entries` mencantumkan entri dari umpan marketplace OpenClaw yang dikonfigurasi. Secara default, perintah ini mencoba umpan yang di-host dan kembali ke snapshot terbaru yang diterima atau data yang dibundel. Gunakan `--feed-profile <name>` untuk membaca profil tertentu yang dikonfigurasi, `--feed-url <url>` untuk membaca URL umpan yang di-host secara eksplisit, dan `--offline` untuk membaca snapshot terbaru yang diterima tanpa mengambil umpan.

`plugins marketplace refresh` menyegarkan snapshot umpan yang di-host dan dikonfigurasi, lalu melaporkan apakah OpenClaw menerima data yang di-host, snapshot yang di-host, atau data fallback yang dibundel. Gunakan `--expected-sha256` saat pemanggil membutuhkan perintah agar gagal kecuali payload baru yang di-host cocok dengan checksum yang dipasangkan.

`list` marketplace menerima jalur marketplace lokal, jalur `marketplace.json`, singkatan GitHub seperti `owner/repo`, URL repo GitHub, atau URL git. `--json` mencetak label sumber yang diselesaikan beserta manifes marketplace dan entri Plugin yang diuraikan.

Penyegaran marketplace memuat umpan marketplace OpenClaw yang di-host dan mempertahankan
respons tervalidasi sebagai snapshot umpan yang di-host lokal. Tanpa opsi, perintah ini menggunakan
profil umpan default yang dikonfigurasi. Gunakan `--feed-profile <name>` untuk menyegarkan
profil tertentu yang dikonfigurasi, `--feed-url <url>` untuk menyegarkan URL umpan
yang di-host secara eksplisit, `--expected-sha256 <sha256>` untuk mewajibkan checksum payload
yang cocok (`sha256:<hex>` atau digest hex 64 karakter polos), dan `--json` untuk
keluaran yang dapat dibaca mesin. URL umpan yang di-host secara eksplisit tidak boleh menyertakan
kredensial, string kueri, atau fragmen. Penyegaran tanpa pin dapat melaporkan hasil
snapshot yang di-host atau fallback yang dibundel tanpa menggagalkan perintah. Penyegaran
dengan pin gagal kecuali menerima payload baru yang di-host, dan penyegaran yang di-host
yang berhasil akan gagal jika OpenClaw tidak dapat mempertahankan snapshot tervalidasi.

## Terkait

- [Membangun Plugin](/id/plugins/building-plugins)
- [Referensi CLI](/id/cli)
- [ClawHub](/id/clawhub)
