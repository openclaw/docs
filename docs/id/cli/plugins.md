---
read_when:
    - Anda ingin menginstal atau mengelola plugin Gateway atau bundel yang kompatibel
    - Anda ingin men-debug kegagalan pemuatan Plugin
sidebarTitle: Plugins
summary: Referensi CLI untuk `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, deps, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-05-01T09:23:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: cc4b2b753b541dd143e9c2f7e8a2153711a18e15773c65f91756d2729ca3d6fb
    source_path: cli/plugins.md
    workflow: 16
---

Kelola plugin Gateway, paket hook, dan bundle yang kompatibel.

<CardGroup cols={2}>
  <Card title="Sistem Plugin" href="/id/tools/plugin">
    Panduan pengguna akhir untuk menginstal, mengaktifkan, dan memecahkan masalah plugin.
  </Card>
  <Card title="Bundle Plugin" href="/id/plugins/bundles">
    Model kompatibilitas bundle.
  </Card>
  <Card title="Manifest Plugin" href="/id/plugins/manifest">
    Bidang manifest dan skema konfigurasi.
  </Card>
  <Card title="Keamanan" href="/id/gateway/security">
    Penguatan keamanan untuk instalasi plugin.
  </Card>
</CardGroup>

## Perintah

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
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
openclaw plugins deps
openclaw plugins deps --repair
openclaw plugins deps --prune
openclaw plugins deps --json
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

Untuk investigasi instalasi, inspeksi, penghapusan instalasi, atau penyegaran registry yang lambat, jalankan
perintah dengan `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Trace menulis waktu tiap fase
ke stderr dan menjaga output JSON tetap dapat diurai. Lihat [Debugging](/id/help/debugging#plugin-lifecycle-trace).

<Note>
Plugin bawaan dikirim bersama OpenClaw. Beberapa diaktifkan secara default (misalnya provider model bawaan, provider speech bawaan, dan plugin browser bawaan); yang lain memerlukan `plugins enable`.

Plugin OpenClaw native harus mengirim `openclaw.plugin.json` dengan JSON Schema inline (`configSchema`, meskipun kosong). Bundle kompatibel menggunakan manifest bundle mereka sendiri.

`plugins list` menampilkan `Format: openclaw` atau `Format: bundle`. Output daftar/info verbose juga menampilkan subtipe bundle (`codex`, `claude`, atau `cursor`) serta kapabilitas bundle yang terdeteksi.
</Note>

### Instal

```bash
openclaw plugins install <package>                      # ClawHub first, then npm
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
Nama package polos diperiksa terhadap ClawHub terlebih dahulu, lalu npm. Perlakukan instalasi plugin seperti menjalankan kode. Utamakan versi yang dipin.
</Warning>

<Note>
ClawHub adalah permukaan distribusi dan penemuan utama untuk sebagian besar plugin. Npm
tetap didukung sebagai fallback dan jalur instalasi langsung. Selama migrasi ke
ClawHub, OpenClaw masih mengirim beberapa package plugin milik OpenClaw `@openclaw/*`
di npm; versi package tersebut dapat tertinggal dari source bawaan di antara rangkaian rilis
plugin. Jika npm melaporkan package plugin milik OpenClaw sebagai deprecated, maka
versi yang dipublikasikan itu adalah artefak eksternal lama; gunakan plugin yang dibundel dengan
OpenClaw saat ini atau checkout lokal sampai package npm yang lebih baru dipublikasikan.
</Note>

<AccordionGroup>
  <Accordion title="Include konfigurasi dan pemulihan konfigurasi tidak valid">
    Jika bagian `plugins` Anda didukung oleh `$include` satu file, `plugins install/update/enable/disable/uninstall` menulis melalui file include tersebut dan membiarkan `openclaw.json` tidak berubah. Include root, array include, dan include dengan override saudara gagal tertutup alih-alih diratakan. Lihat [Include konfigurasi](/id/gateway/configuration) untuk bentuk yang didukung.

    Jika konfigurasi tidak valid saat instalasi, `plugins install` biasanya gagal tertutup dan meminta Anda menjalankan `openclaw doctor --fix` terlebih dahulu. Selama startup Gateway, konfigurasi yang tidak valid untuk satu plugin diisolasi ke plugin tersebut agar channel dan plugin lain tetap berjalan; `openclaw doctor --fix` dapat mengarantina entri plugin yang tidak valid. Satu-satunya pengecualian saat instalasi yang terdokumentasi adalah jalur pemulihan plugin bawaan yang sempit untuk plugin yang secara eksplisit ikut serta dalam `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force dan instal ulang vs pembaruan">
    `--force` menggunakan kembali target instalasi yang ada dan menimpa plugin atau paket hook yang sudah terinstal di tempatnya. Gunakan ini saat Anda sengaja menginstal ulang id yang sama dari path lokal baru, arsip, package ClawHub, atau artefak npm. Untuk upgrade rutin plugin npm yang sudah dilacak, utamakan `openclaw plugins update <id-or-npm-spec>`.

    Jika Anda menjalankan `plugins install` untuk id plugin yang sudah terinstal, OpenClaw berhenti dan mengarahkan Anda ke `plugins update <id-or-npm-spec>` untuk upgrade normal, atau ke `plugins install <package> --force` ketika Anda benar-benar ingin menimpa instalasi saat ini dari sumber yang berbeda.

  </Accordion>
  <Accordion title="Cakupan --pin">
    `--pin` hanya berlaku untuk instalasi npm. Ini tidak didukung dengan `--marketplace`, karena instalasi marketplace menyimpan metadata sumber marketplace, bukan spec npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` adalah opsi darurat untuk false positive dalam pemindai kode berbahaya bawaan. Opsi ini memungkinkan instalasi berlanjut bahkan ketika pemindai bawaan melaporkan temuan `critical`, tetapi **tidak** melewati blok kebijakan hook plugin `before_install` dan **tidak** melewati kegagalan pemindaian.

    Flag CLI ini berlaku untuk alur instalasi/pembaruan plugin. Instalasi dependensi skill yang didukung Gateway menggunakan override permintaan `dangerouslyForceUnsafeInstall` yang sesuai, sementara `openclaw skills install` tetap menjadi alur unduh/instal skill ClawHub yang terpisah.

    Jika plugin yang Anda publikasikan di ClawHub diblokir oleh pemindaian registry, gunakan langkah publisher di [ClawHub](/id/tools/clawhub).

  </Accordion>
  <Accordion title="Paket hook dan spec npm">
    `plugins install` juga merupakan permukaan instalasi untuk paket hook yang mengekspos `openclaw.hooks` di `package.json`. Gunakan `openclaw hooks` untuk visibilitas hook terfilter dan pengaktifan per hook, bukan instalasi package.

    Spec npm bersifat **hanya registry** (nama package + **versi persis** opsional atau **dist-tag**). Spec Git/URL/file dan rentang semver ditolak. Instalasi dependensi berjalan lokal proyek dengan `--ignore-scripts` demi keamanan, bahkan ketika shell Anda memiliki pengaturan instalasi npm global.

    Gunakan `npm:<package>` saat Anda ingin melewati lookup ClawHub dan menginstal langsung dari npm. Spec package polos tetap mengutamakan ClawHub dan hanya fallback ke npm ketika ClawHub tidak memiliki package atau versi tersebut.

    Spec polos dan `@latest` tetap berada di track stabil. Jika npm menyelesaikan salah satunya ke prerelease, OpenClaw berhenti dan meminta Anda untuk ikut serta secara eksplisit dengan tag prerelease seperti `@beta`/`@rc` atau versi prerelease persis seperti `@1.2.3-beta.4`.

    Jika spec instalasi polos cocok dengan id plugin bawaan (misalnya `diffs`), OpenClaw menginstal plugin bawaan secara langsung. Untuk menginstal package npm dengan nama yang sama, gunakan spec scoped eksplisit (misalnya `@scope/diffs`).

  </Accordion>
  <Accordion title="Arsip">
    Arsip yang didukung: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Arsip plugin OpenClaw native harus berisi `openclaw.plugin.json` yang valid di root plugin yang diekstrak; arsip yang hanya berisi `package.json` ditolak sebelum OpenClaw menulis catatan instalasi.

    Instalasi marketplace Claude juga didukung.

  </Accordion>
</AccordionGroup>

Instalasi ClawHub menggunakan locator `clawhub:<package>` eksplisit:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw kini juga mengutamakan ClawHub untuk spec plugin yang aman untuk npm dan polos. Ini hanya fallback ke npm jika ClawHub tidak memiliki package atau versi tersebut:

```bash
openclaw plugins install openclaw-codex-app-server
```

Gunakan `npm:` untuk memaksa resolusi hanya npm, misalnya ketika ClawHub tidak dapat dijangkau atau Anda tahu package tersebut hanya ada di npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw mengunduh arsip package dari ClawHub, memeriksa API plugin / kompatibilitas gateway minimum yang diiklankan, lalu menginstalnya melalui jalur arsip normal. Instalasi yang dicatat mempertahankan metadata sumber ClawHub untuk pembaruan nanti.
Instalasi ClawHub tanpa versi mempertahankan spec tercatat tanpa versi agar `openclaw plugins update` dapat mengikuti rilis ClawHub yang lebih baru; pemilih versi atau tag eksplisit seperti `clawhub:pkg@1.2.3` dan `clawhub:pkg@beta` tetap dipin ke pemilih tersebut.

#### Shorthand marketplace

Gunakan shorthand `plugin@marketplace` ketika nama marketplace ada di cache registry lokal Claude di `~/.claude/plugins/known_marketplaces.json`:

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
    - root marketplace lokal atau path `marketplace.json`
    - shorthand repo GitHub seperti `owner/repo`
    - URL repo GitHub seperti `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="Aturan marketplace jarak jauh">
    Untuk marketplace jarak jauh yang dimuat dari GitHub atau git, entri plugin harus tetap berada di dalam repo marketplace yang dikloning. OpenClaw menerima sumber path relatif dari repo tersebut dan menolak HTTP(S), path absolut, git, GitHub, serta sumber plugin non-path lain dari manifest jarak jauh.
  </Tab>
</Tabs>

Untuk path lokal dan arsip, OpenClaw mendeteksi otomatis:

- plugin OpenClaw native (`openclaw.plugin.json`)
- bundle kompatibel Codex (`.codex-plugin/plugin.json`)
- bundle kompatibel Claude (`.claude-plugin/plugin.json` atau layout komponen Claude default)
- bundle kompatibel Cursor (`.cursor-plugin/plugin.json`)

<Note>
Bundle kompatibel diinstal ke root plugin normal dan berpartisipasi dalam alur daftar/info/aktifkan/nonaktifkan yang sama. Saat ini, Skills bundle, command-skills Claude, default `settings.json` Claude, default `.lsp.json` / `lspServers` yang dideklarasikan manifest Claude, command-skills Cursor, dan direktori hook Codex yang kompatibel didukung; kapabilitas bundle terdeteksi lainnya ditampilkan dalam diagnostik/info tetapi belum dihubungkan ke eksekusi runtime.
</Note>

### Daftar

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
  Beralih dari tampilan tabel ke baris detail per plugin dengan metadata sumber/origin/versi/aktivasi.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventaris yang dapat dibaca mesin ditambah diagnostik registry.
</ParamField>

<Note>
`plugins list` membaca registry plugin lokal yang dipertahankan terlebih dahulu, dengan fallback turunan yang hanya berbasis manifes ketika registry hilang atau tidak valid. Ini berguna untuk memeriksa apakah plugin terinstal, diaktifkan, dan terlihat oleh perencanaan startup dingin, tetapi ini bukan probe runtime langsung terhadap proses Gateway yang sudah berjalan. Setelah mengubah kode plugin, pengaktifan, kebijakan hook, atau `plugins.load.paths`, mulai ulang Gateway yang melayani channel sebelum mengharapkan kode `register(api)` atau hook baru berjalan. Untuk deployment jarak jauh/container, pastikan Anda memulai ulang child `openclaw gateway run` yang sebenarnya, bukan hanya proses wrapper.
</Note>

Untuk pekerjaan plugin bawaan di dalam image Docker berpaket, bind-mount direktori
sumber plugin di atas path sumber berpaket yang sesuai, seperti
`/app/extensions/synology-chat`. OpenClaw akan menemukan overlay sumber yang di-mount
itu sebelum `/app/dist/extensions/synology-chat`; direktori sumber yang hanya disalin
tetap inert sehingga instalasi berpaket normal tetap menggunakan dist yang dikompilasi.

Untuk debugging hook runtime:

- `openclaw plugins inspect <id> --runtime --json` menampilkan hook terdaftar dan diagnostik dari pass inspeksi dengan modul dimuat. Inspeksi runtime tidak pernah mengunduh dependensi runtime bawaan yang hilang; gunakan `openclaw plugins deps --repair` ketika perbaikan diperlukan.
- `openclaw gateway status --deep --require-rpc` mengonfirmasi Gateway yang dapat dijangkau, petunjuk layanan/proses, path config, dan kesehatan RPC.
- Hook percakapan non-bawaan (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) memerlukan `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Gunakan `--link` untuk menghindari penyalinan direktori lokal (menambahkan ke `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` tidak didukung dengan `--link` karena instalasi tertaut menggunakan ulang path sumber alih-alih menyalin di atas target instalasi terkelola.

Gunakan `--pin` pada instalasi npm untuk menyimpan spec persis yang diselesaikan (`name@version`) di indeks plugin terkelola sambil mempertahankan perilaku default yang tidak dipin.
</Note>

### Indeks Plugin

Metadata instalasi Plugin adalah state yang dikelola mesin, bukan config pengguna. Instalasi dan update menuliskannya ke `plugins/installs.json` di bawah direktori state OpenClaw aktif. Map `installRecords` tingkat teratasnya adalah sumber tahan lama untuk metadata instalasi, termasuk catatan untuk manifes plugin yang rusak atau hilang. Array `plugins` adalah cache registry dingin turunan manifes. File ini menyertakan peringatan jangan-edit dan digunakan oleh `openclaw plugins update`, uninstall, diagnostik, dan registry plugin dingin.

Ketika OpenClaw melihat catatan lama terkirim `plugins.installs` dalam config, OpenClaw memindahkannya ke indeks plugin dan menghapus key config; jika salah satu penulisan gagal, catatan config dipertahankan agar metadata instalasi tidak hilang.

### Dependensi runtime

```bash
openclaw plugins deps
openclaw plugins deps --repair
openclaw plugins deps --prune
openclaw plugins deps --json
```

`plugins deps` memeriksa stage dependensi runtime berpaket untuk plugin bawaan milik OpenClaw yang dipilih oleh config plugin, channel yang diaktifkan/dikonfigurasi, provider model yang dikonfigurasi, atau default manifes bawaan. Ini bukan path instal/update untuk plugin npm pihak ketiga atau ClawHub.

Gunakan `--repair` ketika instalasi berpaket melaporkan dependensi runtime bawaan yang hilang saat startup Gateway atau `plugins doctor`. Perbaikan hanya menginstal deps plugin bawaan aktif yang hilang dengan skrip lifecycle dinonaktifkan. Gunakan `--prune` untuk menghapus root dependensi runtime eksternal tidak dikenal yang basi dan tertinggal oleh layout berpaket lama.

Untuk lifecycle rencana, staging, dan perbaikan lengkap, lihat [Resolusi dependensi Plugin](/id/plugins/dependency-resolution).

### Uninstall

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` menghapus catatan plugin dari `plugins.entries`, indeks plugin yang dipertahankan, entri daftar allow/deny plugin, dan entri `plugins.load.paths` tertaut jika berlaku. Kecuali `--keep-files` disetel, uninstall juga menghapus direktori instalasi terkelola terlacak ketika berada di dalam root ekstensi plugin OpenClaw. Untuk plugin active memory, slot memori direset ke `memory-core`.

<Note>
`--keep-config` didukung sebagai alias deprecated untuk `--keep-files`.
</Note>

### Update

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Update diterapkan pada instalasi plugin terlacak di indeks plugin terkelola dan instalasi hook-pack terlacak di `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Menyelesaikan id plugin vs spec npm">
    Ketika Anda meneruskan id plugin, OpenClaw menggunakan ulang spec instalasi yang tercatat untuk plugin tersebut. Artinya dist-tag yang sebelumnya tersimpan seperti `@beta` dan versi persis yang dipin terus digunakan pada eksekusi `update <id>` berikutnya.

    Untuk instalasi npm, Anda juga dapat meneruskan spec paket npm eksplisit dengan dist-tag atau versi persis. OpenClaw menyelesaikan nama paket itu kembali ke catatan plugin terlacak, memperbarui plugin yang terinstal itu, dan mencatat spec npm baru untuk update berbasis id di masa mendatang.

    Meneruskan nama paket npm tanpa versi atau tag juga diselesaikan kembali ke catatan plugin terlacak. Gunakan ini ketika plugin dipin ke versi persis dan Anda ingin memindahkannya kembali ke jalur rilis default registry.

  </Accordion>
  <Accordion title="Pemeriksaan versi dan drift integritas">
    Sebelum update npm langsung, OpenClaw memeriksa versi paket terinstal terhadap metadata registry npm. Jika versi terinstal dan identitas artefak yang tercatat sudah cocok dengan target yang diselesaikan, update dilewati tanpa mengunduh, menginstal ulang, atau menulis ulang `openclaw.json`.

    Ketika hash integritas tersimpan ada dan hash artefak yang diambil berubah, OpenClaw memperlakukannya sebagai drift artefak npm. Perintah interaktif `openclaw plugins update` mencetak hash yang diharapkan dan aktual serta meminta konfirmasi sebelum melanjutkan. Helper update non-interaktif gagal tertutup kecuali pemanggil menyediakan kebijakan kelanjutan eksplisit.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install pada update">
    `--dangerously-force-unsafe-install` juga tersedia pada `plugins update` sebagai override darurat untuk false positive pemindaian kode berbahaya bawaan selama update plugin. Ini tetap tidak melewati blok kebijakan `before_install` plugin atau pemblokiran kegagalan pemindaian, dan hanya berlaku untuk update plugin, bukan update hook-pack.
  </Accordion>
</AccordionGroup>

### Inspect

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect menampilkan identitas, status muat, sumber, kapabilitas manifes, flag kebijakan, diagnostik, metadata instalasi, kapabilitas bundle, dan dukungan server MCP atau LSP yang terdeteksi tanpa mengimpor runtime plugin secara default. Tambahkan `--runtime` untuk memuat modul plugin dan menyertakan hook, tools, perintah, layanan, metode gateway, dan route HTTP terdaftar. Inspeksi runtime gagal dengan petunjuk perbaikan ketika dependensi runtime bawaan hilang; gunakan `openclaw plugins deps --repair` untuk memperbaikinya secara eksplisit.

Setiap plugin diklasifikasikan berdasarkan apa yang benar-benar didaftarkannya saat runtime:

- **plain-capability** — satu jenis kapabilitas (mis. plugin khusus provider)
- **hybrid-capability** — beberapa jenis kapabilitas (mis. teks + ucapan + gambar)
- **hook-only** — hanya hook, tanpa kapabilitas atau surface
- **non-capability** — tools/perintah/layanan tetapi tanpa kapabilitas

Lihat [Bentuk Plugin](/id/plugins/architecture#plugin-shapes) untuk informasi lebih lanjut tentang model kapabilitas.

<Note>
Flag `--json` menghasilkan laporan yang dapat dibaca mesin yang cocok untuk scripting dan audit. `inspect --all` merender tabel seluruh fleet dengan kolom bentuk, jenis kapabilitas, pemberitahuan kompatibilitas, kapabilitas bundle, dan ringkasan hook. `info` adalah alias untuk `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` melaporkan error pemuatan plugin, diagnostik manifes/discovery, dan pemberitahuan kompatibilitas. Ketika semuanya bersih, perintah ini mencetak `No plugin issues detected.`

Untuk kegagalan bentuk modul seperti export `register`/`activate` yang hilang, jalankan ulang dengan `OPENCLAW_PLUGIN_LOAD_DEBUG=1` untuk menyertakan ringkasan bentuk export ringkas dalam output diagnostik.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Registry plugin lokal adalah model baca dingin OpenClaw yang dipertahankan untuk identitas plugin terinstal, pengaktifan, metadata sumber, dan kepemilikan kontribusi. Startup normal, lookup pemilik provider, klasifikasi setup channel, dan inventaris plugin dapat membacanya tanpa mengimpor modul runtime plugin.

Gunakan `plugins registry` untuk memeriksa apakah registry yang dipertahankan ada, terkini, atau basi. Gunakan `--refresh` untuk membangunnya ulang dari indeks plugin yang dipertahankan, kebijakan config, dan metadata manifes/paket. Ini adalah path perbaikan, bukan path aktivasi runtime.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` adalah switch kompatibilitas darurat deprecated untuk kegagalan baca registry. Lebih baik gunakan `plugins registry --refresh` atau `openclaw doctor --fix`; fallback env hanya untuk pemulihan startup darurat saat migrasi diluncurkan.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Daftar Marketplace menerima path marketplace lokal, path `marketplace.json`, singkatan GitHub seperti `owner/repo`, URL repo GitHub, atau URL git. `--json` mencetak label sumber yang diselesaikan beserta manifes marketplace dan entri plugin yang diurai.

## Terkait

- [Membangun plugin](/id/plugins/building-plugins)
- [Referensi CLI](/id/cli)
- [Plugin komunitas](/id/plugins/community)
