---
read_when:
    - Anda ingin menginstal atau mengelola Plugin Gateway atau bundel yang kompatibel
    - Anda ingin men-debug kegagalan pemuatan Plugin
sidebarTitle: Plugins
summary: Referensi CLI untuk `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-05-05T01:44:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 24d274f33213231eaed48ac848a9266802a2179ba0311ab18462ad783219095a
    source_path: cli/plugins.md
    workflow: 16
---

Kelola Plugin Gateway, paket hook, dan bundel yang kompatibel.

<CardGroup cols={2}>
  <Card title="Sistem Plugin" href="/id/tools/plugin">
    Panduan pengguna akhir untuk memasang, mengaktifkan, dan memecahkan masalah plugin.
  </Card>
  <Card title="Kelola plugin" href="/id/plugins/manage-plugins">
    Contoh cepat untuk memasang, mencantumkan, memperbarui, menghapus pemasangan, dan menerbitkan.
  </Card>
  <Card title="Bundel Plugin" href="/id/plugins/bundles">
    Model kompatibilitas bundel.
  </Card>
  <Card title="Manifest Plugin" href="/id/plugins/manifest">
    Bidang manifest dan skema config.
  </Card>
  <Card title="Keamanan" href="/id/gateway/security">
    Pengerasan keamanan untuk pemasangan plugin.
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
```

Untuk investigasi pemasangan, inspeksi, penghapusan pemasangan, atau penyegaran registry yang lambat, jalankan
perintah dengan `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Trace menulis timing fase
ke stderr dan menjaga output JSON tetap dapat di-parse. Lihat [Debugging](/id/help/debugging#plugin-lifecycle-trace).

<Note>
Plugin bawaan dikirim bersama OpenClaw. Sebagian diaktifkan secara default (misalnya penyedia model bawaan, penyedia speech bawaan, dan plugin browser bawaan); yang lain memerlukan `plugins enable`.

Plugin OpenClaw native harus menyertakan `openclaw.plugin.json` dengan JSON Schema inline (`configSchema`, meskipun kosong). Bundel yang kompatibel menggunakan manifest bundelnya sendiri.

`plugins list` menampilkan `Format: openclaw` atau `Format: bundle`. Output list/info verbose juga menampilkan subtipe bundel (`codex`, `claude`, atau `cursor`) plus kapabilitas bundel yang terdeteksi.
</Note>

### Pasang

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # npm by default
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install git:github.com/<owner>/<repo>  # git repo
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
Nama paket bare dipasang dari npm secara default selama cutover peluncuran. Gunakan `clawhub:<package>` untuk ClawHub. Perlakukan pemasangan plugin seperti menjalankan kode. Utamakan versi yang di-pin.
</Warning>

`plugins search` mengkueri ClawHub untuk paket plugin yang dapat dipasang dan mencetak
nama paket yang siap dipasang. Perintah ini mencari paket code-plugin dan bundle-plugin,
bukan Skills. Gunakan `openclaw skills search` untuk Skills ClawHub.

<Note>
ClawHub adalah permukaan distribusi dan discovery utama untuk sebagian besar plugin. Npm
tetap menjadi fallback dan jalur pemasangan langsung yang didukung. Paket plugin
`@openclaw/*` milik OpenClaw diterbitkan di npm lagi; lihat daftar saat ini
di [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) atau
[inventaris plugin](/id/plugins/plugin-inventory). Pemasangan stabil menggunakan `latest`.
Pemasangan dan pembaruan kanal beta mengutamakan dist-tag npm `beta` saat tag tersebut
tersedia, lalu fallback ke `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Config includes dan perbaikan config tidak valid">
    Jika bagian `plugins` Anda didukung oleh `$include` satu file, `plugins install/update/enable/disable/uninstall` menulis melalui file yang disertakan itu dan membiarkan `openclaw.json` tidak tersentuh. Include root, array include, dan include dengan override sibling gagal tertutup alih-alih diratakan. Lihat [Config includes](/id/gateway/configuration) untuk bentuk yang didukung.

    Jika config tidak valid selama pemasangan, `plugins install` biasanya gagal tertutup dan meminta Anda menjalankan `openclaw doctor --fix` terlebih dahulu. Selama startup Gateway dan hot reload, config plugin yang tidak valid gagal tertutup seperti config tidak valid lainnya; `openclaw doctor --fix` dapat mengkarantina entri plugin yang tidak valid. Satu-satunya pengecualian waktu pemasangan yang terdokumentasi adalah jalur pemulihan plugin bawaan yang sempit untuk plugin yang secara eksplisit ikut serta dalam `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force dan pemasangan ulang vs pembaruan">
    `--force` menggunakan kembali target pemasangan yang ada dan menimpa plugin atau paket hook yang sudah terpasang di tempatnya. Gunakan ini saat Anda sengaja memasang ulang id yang sama dari jalur lokal, arsip, paket ClawHub, atau artefak npm baru. Untuk upgrade rutin plugin npm yang sudah dilacak, utamakan `openclaw plugins update <id-or-npm-spec>`.

    Jika Anda menjalankan `plugins install` untuk id plugin yang sudah terpasang, OpenClaw berhenti dan mengarahkan Anda ke `plugins update <id-or-npm-spec>` untuk upgrade normal, atau ke `plugins install <package> --force` saat Anda benar-benar ingin menimpa pemasangan saat ini dari sumber lain.

  </Accordion>
  <Accordion title="Cakupan --pin">
    `--pin` hanya berlaku untuk pemasangan npm. Ini tidak didukung dengan pemasangan `git:`; gunakan ref git eksplisit seperti `git:github.com/acme/plugin@v1.2.3` saat Anda menginginkan sumber yang di-pin. Ini tidak didukung dengan `--marketplace`, karena pemasangan marketplace mempertahankan metadata sumber marketplace alih-alih spec npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` adalah opsi darurat untuk false positive di pemindai kode berbahaya bawaan. Opsi ini mengizinkan pemasangan berlanjut bahkan saat pemindai bawaan melaporkan temuan `critical`, tetapi **tidak** melewati blok kebijakan hook `before_install` plugin dan **tidak** melewati kegagalan pemindaian.

    Flag CLI ini berlaku untuk alur pemasangan/pembaruan plugin. Pemasangan dependensi skill yang didukung Gateway menggunakan override request `dangerouslyForceUnsafeInstall` yang sepadan, sedangkan `openclaw skills install` tetap menjadi alur unduh/pasang skill ClawHub yang terpisah.

    Jika plugin yang Anda terbitkan di ClawHub diblokir oleh pemindaian registry, gunakan langkah penerbit di [ClawHub](/id/tools/clawhub).

  </Accordion>
  <Accordion title="Paket hook dan spec npm">
    `plugins install` juga merupakan permukaan pemasangan untuk paket hook yang mengekspos `openclaw.hooks` di `package.json`. Gunakan `openclaw hooks` untuk visibilitas hook terfilter dan pengaktifan per hook, bukan pemasangan paket.

    Spec npm bersifat **hanya registry** (nama paket + **versi persis** opsional atau **dist-tag**). Spec Git/URL/file dan rentang semver ditolak. Pemasangan dependensi berjalan project-local dengan `--ignore-scripts` demi keamanan, bahkan saat shell Anda memiliki pengaturan pemasangan npm global.

    Gunakan `npm:<package>` saat Anda ingin membuat resolusi npm eksplisit. Spec paket bare juga dipasang langsung dari npm selama cutover peluncuran.

    Spec bare dan `@latest` tetap berada di track stabil. Versi koreksi bertanggal OpenClaw seperti `2026.5.3-1` adalah rilis stabil untuk pemeriksaan ini. Jika npm me-resolve salah satunya ke prerelease, OpenClaw berhenti dan meminta Anda ikut serta secara eksplisit dengan tag prerelease seperti `@beta`/`@rc` atau versi prerelease persis seperti `@1.2.3-beta.4`.

    Jika spec pemasangan bare cocok dengan id plugin resmi (misalnya `diffs`), OpenClaw memasang entri katalog secara langsung. Untuk memasang paket npm dengan nama yang sama, gunakan spec scoped eksplisit (misalnya `@scope/diffs`).

  </Accordion>
  <Accordion title="Repositori Git">
    Gunakan `git:<repo>` untuk memasang langsung dari repositori git. Bentuk yang didukung mencakup `git:github.com/owner/repo`, `git:owner/repo`, URL clone lengkap `https://`, `ssh://`, `git://`, `file://`, dan `git@host:owner/repo.git`. Tambahkan `@<ref>` atau `#<ref>` untuk melakukan checkout branch, tag, atau commit sebelum pemasangan.

    Pemasangan git melakukan clone ke direktori sementara, melakukan checkout ref yang diminta jika ada, lalu menggunakan installer direktori plugin normal. Itu berarti validasi manifest, pemindaian kode berbahaya, pekerjaan pemasangan package-manager, dan record pemasangan berperilaku seperti pemasangan npm. Pemasangan git yang direkam mencakup URL/ref sumber plus commit yang di-resolve agar `openclaw plugins update` dapat me-resolve ulang sumber nanti.

    Setelah memasang dari git, gunakan `openclaw plugins inspect <id> --runtime --json` untuk memverifikasi registrasi runtime seperti metode gateway dan perintah CLI. Jika plugin mendaftarkan root CLI dengan `api.registerCli`, jalankan perintah itu langsung melalui root CLI OpenClaw, misalnya `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Arsip">
    Arsip yang didukung: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Arsip plugin OpenClaw native harus berisi `openclaw.plugin.json` yang valid di root plugin yang diekstrak; arsip yang hanya berisi `package.json` ditolak sebelum OpenClaw menulis record pemasangan.

    Pemasangan marketplace Claude juga didukung.

  </Accordion>
</AccordionGroup>

Pemasangan ClawHub menggunakan locator `clawhub:<package>` eksplisit:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Spec plugin yang aman untuk npm secara bare dipasang dari npm secara default selama cutover peluncuran:

```bash
openclaw plugins install openclaw-codex-app-server
```

Gunakan `npm:` untuk membuat resolusi khusus npm eksplisit:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw memeriksa kompatibilitas plugin API / minimum gateway yang diiklankan sebelum pemasangan. Saat versi ClawHub yang dipilih menerbitkan artefak ClawPack, OpenClaw mengunduh `.tgz` npm-pack berversi, memverifikasi header digest ClawHub dan digest artefak, lalu memasangnya melalui jalur arsip normal. Versi ClawHub lama tanpa metadata ClawPack tetap dipasang melalui jalur verifikasi arsip paket legacy. Pemasangan yang direkam menyimpan metadata sumber ClawHub, jenis artefak, integritas npm, shasum npm, nama tarball, dan fakta digest ClawPack untuk pembaruan nanti.
Pemasangan ClawHub tanpa versi menyimpan spec terekam tanpa versi agar `openclaw plugins update` dapat mengikuti rilis ClawHub yang lebih baru; selector versi atau tag eksplisit seperti `clawhub:pkg@1.2.3` dan `clawhub:pkg@beta` tetap di-pin ke selector tersebut.

#### Shorthand marketplace

Gunakan shorthand `plugin@marketplace` saat nama marketplace ada di cache registry lokal Claude di `~/.claude/plugins/known_marketplaces.json`:

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
    - nama marketplace Claude yang dikenal dari `~/.claude/plugins/known_marketplaces.json`
    - root marketplace lokal atau path `marketplace.json`
    - singkatan repo GitHub seperti `owner/repo`
    - URL repo GitHub seperti `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="Remote marketplace rules">
    Untuk marketplace jarak jauh yang dimuat dari GitHub atau git, entri plugin harus tetap berada di dalam repo marketplace yang dikloning. OpenClaw menerima sumber path relatif dari repo tersebut dan menolak sumber plugin HTTP(S), path absolut, git, GitHub, dan sumber plugin non-path lain dari manifes jarak jauh.
  </Tab>
</Tabs>

Untuk path dan arsip lokal, OpenClaw mendeteksi otomatis:

- plugin OpenClaw native (`openclaw.plugin.json`)
- bundle yang kompatibel dengan Codex (`.codex-plugin/plugin.json`)
- bundle yang kompatibel dengan Claude (`.claude-plugin/plugin.json` atau tata letak komponen Claude default)
- bundle yang kompatibel dengan Cursor (`.cursor-plugin/plugin.json`)

<Note>
Bundle yang kompatibel diinstal ke root plugin normal dan ikut dalam alur list/info/enable/disable yang sama. Saat ini, bundle skills, command-skills Claude, default `settings.json` Claude, default `.lsp.json` Claude / `lspServers` yang dideklarasikan manifes, command-skills Cursor, dan direktori hook Codex yang kompatibel didukung; kapabilitas bundle lain yang terdeteksi ditampilkan dalam diagnostik/info tetapi belum tersambung ke eksekusi runtime.
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
`plugins list` membaca registry plugin lokal yang dipersist terlebih dahulu, dengan fallback turunan khusus manifes ketika registry hilang atau tidak valid. Ini berguna untuk memeriksa apakah plugin terinstal, diaktifkan, dan terlihat oleh perencanaan startup dingin, tetapi ini bukan probe runtime langsung dari proses Gateway yang sudah berjalan. Setelah mengubah kode plugin, enablement, kebijakan hook, atau `plugins.load.paths`, mulai ulang Gateway yang melayani channel sebelum mengharapkan kode `register(api)` atau hook baru berjalan. Untuk deployment jarak jauh/container, pastikan Anda memulai ulang child `openclaw gateway run` yang sebenarnya, bukan hanya proses wrapper.

`plugins list --json` menyertakan `dependencyStatus` setiap plugin dari `package.json`
`dependencies` dan `optionalDependencies`. OpenClaw memeriksa apakah nama paket tersebut
ada di sepanjang path lookup `node_modules` Node normal milik plugin; ia
tidak mengimpor kode runtime plugin, menjalankan package manager, atau memperbaiki
dependensi yang hilang.
</Note>

`plugins search` adalah lookup katalog ClawHub jarak jauh. Ini tidak memeriksa status
lokal, mengubah konfigurasi, menginstal paket, atau memuat kode runtime plugin. Hasil
pencarian menyertakan nama paket ClawHub, family, channel, versi, ringkasan, dan
petunjuk instalasi seperti `openclaw plugins install clawhub:<package>`.

Untuk pekerjaan plugin bawaan di dalam image Docker terpaket, bind-mount direktori
sumber plugin di atas path sumber terpaket yang cocok, seperti
`/app/extensions/synology-chat`. OpenClaw akan menemukan overlay sumber yang di-mount
tersebut sebelum `/app/dist/extensions/synology-chat`; direktori sumber yang hanya disalin
tetap inert sehingga instalasi terpaket normal tetap memakai dist yang sudah dikompilasi.

Untuk debugging hook runtime:

- `openclaw plugins inspect <id> --runtime --json` menampilkan hook terdaftar dan diagnostik dari pass inspeksi yang memuat modul. Inspeksi runtime tidak pernah menginstal dependensi; gunakan `openclaw doctor --fix` untuk membersihkan status dependensi lama atau memulihkan plugin unduhan yang hilang dan dirujuk oleh konfigurasi.
- `openclaw gateway status --deep --require-rpc` mengonfirmasi Gateway yang dapat dijangkau, petunjuk layanan/proses, path konfigurasi, dan kesehatan RPC.
- Hook percakapan non-bawaan (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) memerlukan `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Gunakan `--link` untuk menghindari penyalinan direktori lokal (menambahkan ke `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` tidak didukung dengan `--link` karena instalasi tertaut menggunakan ulang path sumber alih-alih menyalin ke target instalasi terkelola.

Gunakan `--pin` pada instalasi npm untuk menyimpan spec tepat yang diselesaikan (`name@version`) di indeks plugin terkelola sambil mempertahankan perilaku default tanpa pin.
</Note>

### Indeks plugin

Metadata instalasi plugin adalah status yang dikelola mesin, bukan konfigurasi pengguna. Instalasi dan pembaruan menulisnya ke `plugins/installs.json` di bawah direktori status OpenClaw aktif. Map `installRecords` tingkat atasnya adalah sumber metadata instalasi yang tahan lama, termasuk record untuk manifes plugin yang rusak atau hilang. Array `plugins` adalah cache registry dingin turunan manifes. File ini menyertakan peringatan jangan diedit dan digunakan oleh `openclaw plugins update`, uninstall, diagnostik, dan registry plugin dingin.

Ketika OpenClaw melihat record `plugins.installs` lama yang dikirim dalam konfigurasi, ia memindahkannya ke indeks plugin dan menghapus key konfigurasi; jika salah satu penulisan gagal, record konfigurasi dipertahankan agar metadata instalasi tidak hilang.

### Uninstall

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` menghapus record plugin dari `plugins.entries`, indeks plugin yang dipersist, entri daftar allow/deny plugin, dan entri `plugins.load.paths` tertaut jika berlaku. Kecuali `--keep-files` diatur, uninstall juga menghapus direktori instalasi terkelola yang dilacak ketika berada di dalam root ekstensi plugin OpenClaw. Untuk plugin active memory, slot memori direset ke `memory-core`.

<Note>
`--keep-config` didukung sebagai alias usang untuk `--keep-files`.
</Note>

### Pembaruan

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Pembaruan diterapkan pada instalasi plugin yang dilacak di indeks plugin terkelola dan instalasi hook-pack yang dilacak di `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Resolving plugin id vs npm spec">
    Ketika Anda meneruskan id plugin, OpenClaw menggunakan ulang spec instalasi yang direkam untuk plugin tersebut. Artinya dist-tag yang disimpan sebelumnya seperti `@beta` dan versi tepat yang dipin tetap digunakan pada eksekusi `update <id>` berikutnya.

    Untuk instalasi npm, Anda juga dapat meneruskan spec paket npm eksplisit dengan dist-tag atau versi tepat. OpenClaw menyelesaikan nama paket tersebut kembali ke record plugin yang dilacak, memperbarui plugin terinstal tersebut, dan merekam spec npm baru untuk pembaruan berbasis id di masa mendatang.

    Meneruskan nama paket npm tanpa versi atau tag juga diselesaikan kembali ke record plugin yang dilacak. Gunakan ini ketika plugin dipin ke versi tepat dan Anda ingin memindahkannya kembali ke jalur rilis default registry.

  </Accordion>
  <Accordion title="Beta channel updates">
    `openclaw plugins update` menggunakan ulang spec plugin yang dilacak kecuali Anda meneruskan spec baru. `openclaw update` juga mengetahui channel pembaruan OpenClaw aktif: pada channel beta, record plugin npm dan ClawHub jalur default mencoba `@beta` terlebih dahulu, lalu fallback ke spec default/latest yang direkam jika tidak ada rilis beta plugin. Versi tepat dan tag eksplisit tetap dipin ke selector tersebut.

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    Sebelum pembaruan npm langsung, OpenClaw memeriksa versi paket yang terinstal terhadap metadata registry npm. Jika versi terinstal dan identitas artefak yang direkam sudah cocok dengan target yang diselesaikan, pembaruan dilewati tanpa mengunduh, menginstal ulang, atau menulis ulang `openclaw.json`.

    Ketika hash integritas tersimpan ada dan hash artefak yang diambil berubah, OpenClaw memperlakukan itu sebagai drift artefak npm. Perintah interaktif `openclaw plugins update` mencetak hash yang diharapkan dan aktual lalu meminta konfirmasi sebelum melanjutkan. Helper pembaruan non-interaktif gagal tertutup kecuali pemanggil menyediakan kebijakan kelanjutan eksplisit.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install` juga tersedia pada `plugins update` sebagai override darurat untuk positif palsu pemindaian kode berbahaya bawaan selama pembaruan plugin. Ini tetap tidak melewati blok kebijakan `before_install` plugin atau pemblokiran kegagalan pemindaian, dan hanya berlaku untuk pembaruan plugin, bukan pembaruan hook-pack.
  </Accordion>
</AccordionGroup>

### Inspeksi

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect menampilkan identitas, status pemuatan, sumber, kapabilitas manifes, flag kebijakan, diagnostik, metadata instalasi, kapabilitas bundle, dan dukungan server MCP atau LSP yang terdeteksi tanpa mengimpor runtime plugin secara default. Tambahkan `--runtime` untuk memuat modul plugin dan menyertakan hook, tool, command, service, metode gateway, dan route HTTP yang terdaftar. Inspeksi runtime melaporkan dependensi plugin yang hilang secara langsung; instalasi dan perbaikan tetap berada di `openclaw plugins install`, `openclaw plugins update`, dan `openclaw doctor --fix`.

Command CLI milik plugin diinstal sebagai grup command root `openclaw`. Setelah `inspect --runtime` menampilkan command di bawah `cliCommands`, jalankan sebagai `openclaw <command> ...`; misalnya plugin yang mendaftarkan `demo-git` dapat diverifikasi dengan `openclaw demo-git ping`.

Setiap plugin diklasifikasikan berdasarkan apa yang benar-benar didaftarkannya saat runtime:

- **plain-capability** — satu jenis kapabilitas (mis. plugin khusus provider)
- **hybrid-capability** — beberapa jenis kapabilitas (mis. teks + ucapan + gambar)
- **hook-only** — hanya hook, tanpa kapabilitas atau surface
- **non-capability** — tool/command/service tetapi tanpa kapabilitas

Lihat [Bentuk plugin](/id/plugins/architecture#plugin-shapes) untuk informasi lebih lanjut tentang model kapabilitas.

<Note>
Flag `--json` menghasilkan laporan yang dapat dibaca mesin dan cocok untuk scripting serta audit. `inspect --all` merender tabel seluruh fleet dengan kolom bentuk, jenis kapabilitas, pemberitahuan kompatibilitas, kapabilitas bundle, dan ringkasan hook. `info` adalah alias untuk `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` melaporkan error pemuatan plugin, diagnostik manifes/discovery, dan pemberitahuan kompatibilitas. Ketika semuanya bersih, ia mencetak `No plugin issues detected.`

Jika plugin yang dikonfigurasi ada di disk tetapi diblokir oleh pemeriksaan keamanan path milik loader, validasi konfigurasi mempertahankan entri plugin dan melaporkannya sebagai `present but blocked`. Perbaiki diagnostik plugin terblokir sebelumnya, seperti kepemilikan path atau izin world-writable, alih-alih menghapus konfigurasi `plugins.entries.<id>` atau `plugins.allow`.

Untuk kegagalan bentuk modul seperti ekspor `register`/`activate` yang hilang, jalankan ulang dengan `OPENCLAW_PLUGIN_LOAD_DEBUG=1` untuk menyertakan ringkasan bentuk ekspor yang ringkas dalam output diagnostik.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Registry plugin lokal adalah model baca dingin terpersist milik OpenClaw untuk identitas plugin terinstal, enablement, metadata sumber, dan kepemilikan kontribusi. Startup normal, lookup owner provider, klasifikasi setup channel, dan inventaris plugin dapat membacanya tanpa mengimpor modul runtime plugin.

Gunakan `plugins registry` untuk memeriksa apakah registry yang dipertahankan ada, terkini, atau usang. Gunakan `--refresh` untuk membangunnya ulang dari indeks Plugin yang dipertahankan, kebijakan konfigurasi, serta metadata manifest/paket. Ini adalah jalur perbaikan, bukan jalur aktivasi runtime.

`openclaw doctor --fix` juga memperbaiki drift npm terkelola yang berdekatan dengan registry: jika paket `@openclaw/*` yang yatim atau dipulihkan di bawah root npm Plugin terkelola menutupi Plugin bawaan, doctor menghapus paket usang tersebut dan membangun ulang registry agar startup memvalidasi terhadap manifest bawaan.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` adalah sakelar kompatibilitas darurat yang sudah tidak digunakan lagi untuk kegagalan baca registry. Utamakan `plugins registry --refresh` atau `openclaw doctor --fix`; fallback env hanya untuk pemulihan startup darurat saat migrasi diluncurkan.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Daftar marketplace menerima jalur marketplace lokal, jalur `marketplace.json`, singkatan GitHub seperti `owner/repo`, URL repo GitHub, atau URL git. `--json` mencetak label sumber yang diselesaikan beserta manifest marketplace yang diurai dan entri Plugin.

## Terkait

- [Membangun Plugin](/id/plugins/building-plugins)
- [Referensi CLI](/id/cli)
- [Plugin Komunitas](/id/plugins/community)
