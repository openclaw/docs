---
read_when:
    - Anda ingin menginstal atau mengelola Plugin Gateway atau bundel yang kompatibel
    - Anda ingin menelusuri kegagalan saat memuat Plugin
sidebarTitle: Plugins
summary: Referensi CLI untuk `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-05-02T09:16:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 963a4292f86d651a23f06ee83fd82d7ad80cb99ff3397a665940d8247225252c
    source_path: cli/plugins.md
    workflow: 16
---

Kelola Plugin Gateway, paket hook, dan bundle yang kompatibel.

<CardGroup cols={2}>
  <Card title="Sistem Plugin" href="/id/tools/plugin">
    Panduan pengguna akhir untuk memasang, mengaktifkan, dan memecahkan masalah plugin.
  </Card>
  <Card title="Bundle Plugin" href="/id/plugins/bundles">
    Model kompatibilitas bundle.
  </Card>
  <Card title="Manifest Plugin" href="/id/plugins/manifest">
    Bidang manifest dan skema konfigurasi.
  </Card>
  <Card title="Keamanan" href="/id/gateway/security">
    Penguatan keamanan untuk pemasangan plugin.
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

Untuk investigasi pemasangan, inspeksi, pencopotan pemasangan, atau refresh registry yang lambat, jalankan
perintah dengan `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Trace menulis timing fase
ke stderr dan menjaga output JSON tetap dapat diurai. Lihat [Debugging](/id/help/debugging#plugin-lifecycle-trace).

<Note>
Plugin bawaan dikirim bersama OpenClaw. Beberapa diaktifkan secara default (misalnya penyedia model bawaan, penyedia speech bawaan, dan plugin browser bawaan); yang lain memerlukan `plugins enable`.

Plugin OpenClaw native harus mengirim `openclaw.plugin.json` dengan JSON Schema inline (`configSchema`, meskipun kosong). Bundle kompatibel menggunakan manifest bundle mereka sendiri.

`plugins list` menampilkan `Format: openclaw` atau `Format: bundle`. Output list/info verbose juga menampilkan subtipe bundle (`codex`, `claude`, atau `cursor`) beserta kemampuan bundle yang terdeteksi.
</Note>

### Pasang

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # ClawHub first, then npm
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
Nama paket polos diperiksa terhadap ClawHub terlebih dahulu, lalu npm. Perlakukan pemasangan plugin seperti menjalankan kode. Pilih versi yang dipin.
</Warning>

`plugins search` mengueri ClawHub untuk paket plugin yang dapat dipasang dan mencetak
nama paket siap pasang. Perintah ini mencari paket code-plugin dan bundle-plugin,
bukan Skills. Gunakan `openclaw skills search` untuk Skills ClawHub.

<Note>
ClawHub adalah permukaan distribusi dan penemuan utama untuk sebagian besar plugin. Npm
tetap menjadi fallback yang didukung dan jalur pemasangan langsung. Selama migrasi ke
ClawHub, OpenClaw masih mengirim beberapa paket plugin `@openclaw/*` milik OpenClaw
di npm; versi paket tersebut dapat tertinggal dari sumber bawaan di antara rangkaian rilis plugin.
Jika npm melaporkan paket plugin milik OpenClaw sebagai deprecated, versi
yang dipublikasikan itu adalah artefak eksternal lama; gunakan plugin yang dibundel dengan
OpenClaw saat ini atau checkout lokal hingga paket npm yang lebih baru dipublikasikan.
</Note>

<AccordionGroup>
  <Accordion title="Include konfigurasi dan pemulihan konfigurasi tidak valid">
    Jika bagian `plugins` Anda didukung oleh `$include` satu file, `plugins install/update/enable/disable/uninstall` menulis melalui file yang di-include tersebut dan membiarkan `openclaw.json` tidak tersentuh. Include root, array include, dan include dengan override sibling gagal tertutup alih-alih diratakan. Lihat [Include konfigurasi](/id/gateway/configuration) untuk bentuk yang didukung.

    Jika konfigurasi tidak valid selama pemasangan, `plugins install` biasanya gagal tertutup dan memberi tahu Anda untuk menjalankan `openclaw doctor --fix` terlebih dahulu. Selama startup Gateway, konfigurasi tidak valid untuk satu plugin diisolasi ke plugin tersebut sehingga channel dan plugin lain tetap dapat berjalan; `openclaw doctor --fix` dapat mengkarantina entri plugin yang tidak valid. Satu-satunya pengecualian waktu pemasangan yang terdokumentasi adalah jalur pemulihan plugin bawaan sempit untuk plugin yang secara eksplisit ikut serta dalam `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force dan pemasangan ulang vs pembaruan">
    `--force` menggunakan kembali target pemasangan yang ada dan menimpa plugin atau paket hook yang sudah terpasang di tempat. Gunakan ini saat Anda sengaja memasang ulang id yang sama dari path lokal, arsip, paket ClawHub, atau artefak npm baru. Untuk upgrade rutin plugin npm yang sudah dilacak, pilih `openclaw plugins update <id-or-npm-spec>`.

    Jika Anda menjalankan `plugins install` untuk id plugin yang sudah terpasang, OpenClaw berhenti dan mengarahkan Anda ke `plugins update <id-or-npm-spec>` untuk upgrade normal, atau ke `plugins install <package> --force` saat Anda benar-benar ingin menimpa pemasangan saat ini dari sumber lain.

  </Accordion>
  <Accordion title="Cakupan --pin">
    `--pin` hanya berlaku untuk pemasangan npm. Ini tidak didukung dengan pemasangan `git:`; gunakan ref git eksplisit seperti `git:github.com/acme/plugin@v1.2.3` saat Anda menginginkan sumber yang dipin. Ini tidak didukung dengan `--marketplace`, karena pemasangan marketplace menyimpan metadata sumber marketplace alih-alih spec npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` adalah opsi darurat untuk positif palsu dalam pemindai kode berbahaya bawaan. Opsi ini memungkinkan pemasangan berlanjut meskipun pemindai bawaan melaporkan temuan `critical`, tetapi **tidak** melewati blok kebijakan hook `before_install` plugin dan **tidak** melewati kegagalan pemindaian.

    Flag CLI ini berlaku untuk alur pemasangan/pembaruan plugin. Pemasangan dependensi skill yang didukung Gateway menggunakan override permintaan `dangerouslyForceUnsafeInstall` yang sesuai, sementara `openclaw skills install` tetap merupakan alur unduh/pasang skill ClawHub yang terpisah.

    Jika plugin yang Anda publikasikan di ClawHub diblokir oleh pemindaian registry, gunakan langkah penerbit di [ClawHub](/id/tools/clawhub).

  </Accordion>
  <Accordion title="Paket hook dan spec npm">
    `plugins install` juga merupakan permukaan pemasangan untuk paket hook yang mengekspos `openclaw.hooks` di `package.json`. Gunakan `openclaw hooks` untuk visibilitas hook terfilter dan pengaktifan per-hook, bukan pemasangan paket.

    Spec npm bersifat **khusus registry** (nama paket + **versi persis** opsional atau **dist-tag**). Spec Git/URL/file dan rentang semver ditolak. Pemasangan dependensi berjalan secara project-local dengan `--ignore-scripts` demi keamanan, bahkan saat shell Anda memiliki pengaturan pemasangan npm global.

    Gunakan `npm:<package>` saat Anda ingin melewati lookup ClawHub dan memasang langsung dari npm. Spec paket polos tetap memilih ClawHub dan hanya fallback ke npm saat ClawHub tidak memiliki paket atau versi tersebut.

    Spec polos dan `@latest` tetap berada di track stabil. Jika npm me-resolve salah satunya ke prerelease, OpenClaw berhenti dan meminta Anda untuk ikut serta secara eksplisit dengan tag prerelease seperti `@beta`/`@rc` atau versi prerelease persis seperti `@1.2.3-beta.4`.

    Jika spec pemasangan polos cocok dengan id plugin resmi (misalnya `diffs`), OpenClaw memasang entri katalog secara langsung. Untuk memasang paket npm dengan nama yang sama, gunakan spec scoped eksplisit (misalnya `@scope/diffs`).

  </Accordion>
  <Accordion title="Repository Git">
    Gunakan `git:<repo>` untuk memasang langsung dari repository git. Bentuk yang didukung mencakup `git:github.com/owner/repo`, `git:owner/repo`, URL clone penuh `https://`, `ssh://`, `git://`, `file://`, dan `git@host:owner/repo.git`. Tambahkan `@<ref>` atau `#<ref>` untuk melakukan checkout branch, tag, atau commit sebelum pemasangan.

    Pemasangan Git melakukan clone ke direktori sementara, melakukan checkout ref yang diminta jika ada, lalu menggunakan pemasang direktori plugin normal. Ini berarti validasi manifest, pemindaian kode berbahaya, pekerjaan pemasangan package-manager, dan catatan pemasangan berperilaku seperti pemasangan npm. Pemasangan git yang dicatat mencakup URL/ref sumber plus commit yang di-resolve sehingga `openclaw plugins update` dapat me-resolve ulang sumber tersebut nanti.

    Setelah memasang dari git, gunakan `openclaw plugins inspect <id> --runtime --json` untuk memverifikasi registrasi runtime seperti metode gateway dan perintah CLI. Jika plugin mendaftarkan root CLI dengan `api.registerCli`, jalankan perintah tersebut langsung melalui CLI root OpenClaw, misalnya `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Arsip">
    Arsip yang didukung: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Arsip plugin OpenClaw native harus berisi `openclaw.plugin.json` yang valid di root plugin hasil ekstraksi; arsip yang hanya berisi `package.json` ditolak sebelum OpenClaw menulis catatan pemasangan.

    Pemasangan marketplace Claude juga didukung.

  </Accordion>
</AccordionGroup>

Pemasangan ClawHub menggunakan locator eksplisit `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw kini juga memilih ClawHub untuk spec plugin polos yang aman untuk npm. Ini hanya fallback ke npm jika ClawHub tidak memiliki paket atau versi tersebut:

```bash
openclaw plugins install openclaw-codex-app-server
```

Gunakan `npm:` untuk memaksa resolusi khusus npm, misalnya saat ClawHub tidak dapat dijangkau atau Anda tahu paket hanya ada di npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw memeriksa API plugin yang diiklankan / kompatibilitas gateway minimum sebelum pemasangan. Saat versi ClawHub yang dipilih memublikasikan artefak ClawPack, OpenClaw mengunduh ClawPack berversi, memverifikasi header digest ClawHub dan digest artefak, lalu memasangnya melalui jalur arsip normal. Versi ClawHub lama tanpa metadata ClawPack tetap dipasang melalui jalur verifikasi arsip paket legacy. Pemasangan yang dicatat menyimpan metadata sumber ClawHub dan fakta digest ClawPack untuk pembaruan berikutnya.
Pemasangan ClawHub tanpa versi menyimpan spec tercatat tanpa versi sehingga `openclaw plugins update` dapat mengikuti rilis ClawHub yang lebih baru; pemilih versi atau tag eksplisit seperti `clawhub:pkg@1.2.3` dan `clawhub:pkg@beta` tetap dipin ke pemilih tersebut.

#### Singkatan marketplace

Gunakan singkatan `plugin@marketplace` saat nama marketplace ada di cache registry lokal Claude di `~/.claude/plugins/known_marketplaces.json`:

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
  <Tab title="Sumber marketplace">
    - nama marketplace Claude yang dikenal dari `~/.claude/plugins/known_marketplaces.json`
    - root marketplace lokal atau path `marketplace.json`
    - singkatan repo GitHub seperti `owner/repo`
    - URL repo GitHub seperti `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="Aturan marketplace jarak jauh">
    Untuk marketplace jarak jauh yang dimuat dari GitHub atau git, entri plugin harus tetap berada di dalam repo marketplace yang dikloning. OpenClaw menerima sumber path relatif dari repo tersebut dan menolak sumber plugin HTTP(S), path absolut, git, GitHub, dan sumber plugin non-path lainnya dari manifes jarak jauh.
  </Tab>
</Tabs>

Untuk path dan arsip lokal, OpenClaw mendeteksi otomatis:

- plugin OpenClaw native (`openclaw.plugin.json`)
- bundel yang kompatibel dengan Codex (`.codex-plugin/plugin.json`)
- bundel yang kompatibel dengan Claude (`.claude-plugin/plugin.json` atau tata letak komponen Claude default)
- bundel yang kompatibel dengan Cursor (`.cursor-plugin/plugin.json`)

<Note>
Bundel yang kompatibel diinstal ke root plugin normal dan ikut dalam alur list/info/enable/disable yang sama. Saat ini, skills bundel, command-skills Claude, default `settings.json` Claude, default `.lsp.json` Claude / `lspServers` yang dideklarasikan manifes, command-skills Cursor, dan direktori hook Codex yang kompatibel didukung; kemampuan bundel lain yang terdeteksi ditampilkan dalam diagnostics/info tetapi belum dihubungkan ke eksekusi runtime.
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
  Inventaris yang dapat dibaca mesin plus diagnostik registry.
</ParamField>

<Note>
`plugins list` membaca registry plugin lokal yang dipersistensikan terlebih dahulu, dengan fallback turunan hanya-manifes ketika registry hilang atau tidak valid. Ini berguna untuk memeriksa apakah plugin terinstal, diaktifkan, dan terlihat oleh perencanaan startup dingin, tetapi bukan probe runtime langsung untuk proses Gateway yang sudah berjalan. Setelah mengubah kode plugin, pengaktifan, kebijakan hook, atau `plugins.load.paths`, mulai ulang Gateway yang melayani channel sebelum mengharapkan kode `register(api)` atau hook baru berjalan. Untuk deployment jarak jauh/container, pastikan Anda memulai ulang child `openclaw gateway run` yang sebenarnya, bukan hanya proses wrapper.
</Note>

`plugins search` adalah lookup katalog ClawHub jarak jauh. Perintah ini tidak memeriksa status lokal, mengubah config, menginstal paket, atau memuat kode runtime plugin. Hasil pencarian mencakup nama paket ClawHub, family, channel, versi, ringkasan, dan petunjuk instal seperti `openclaw plugins install clawhub:<package>`.

Untuk pekerjaan plugin bawaan di dalam image Docker yang dipaketkan, bind-mount direktori sumber plugin di atas path sumber paket yang sesuai, seperti `/app/extensions/synology-chat`. OpenClaw akan menemukan overlay sumber yang di-mount tersebut sebelum `/app/dist/extensions/synology-chat`; direktori sumber yang sekadar disalin tetap tidak aktif sehingga instalasi paket normal tetap menggunakan dist yang dikompilasi.

Untuk debugging hook runtime:

- `openclaw plugins inspect <id> --runtime --json` menampilkan hook terdaftar dan diagnostik dari pass inspeksi yang memuat modul. Inspeksi runtime tidak pernah menginstal dependensi; gunakan `openclaw doctor --fix` untuk membersihkan status dependensi lama atau menginstal plugin downloadable terkonfigurasi yang hilang.
- `openclaw gateway status --deep --require-rpc` mengonfirmasi Gateway yang dapat dijangkau, petunjuk service/proses, path config, dan kesehatan RPC.
- Hook percakapan non-bawaan (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) memerlukan `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Gunakan `--link` untuk menghindari penyalinan direktori lokal (menambahkan ke `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` tidak didukung dengan `--link` karena instalasi tertaut menggunakan ulang path sumber alih-alih menyalin ke target instalasi terkelola.

Gunakan `--pin` pada instalasi npm untuk menyimpan spec tepat yang di-resolve (`name@version`) di indeks plugin terkelola sambil mempertahankan perilaku default tanpa pin.
</Note>

### Indeks plugin

Metadata instalasi plugin adalah status yang dikelola mesin, bukan config pengguna. Instalasi dan pembaruan menulisnya ke `plugins/installs.json` di bawah direktori status OpenClaw aktif. Map `installRecords` tingkat atasnya adalah sumber metadata instalasi yang tahan lama, termasuk record untuk manifes plugin yang rusak atau hilang. Array `plugins` adalah cache registry dingin yang diturunkan dari manifes. File ini menyertakan peringatan jangan-edit dan digunakan oleh `openclaw plugins update`, uninstall, diagnostik, dan registry plugin dingin.

Ketika OpenClaw melihat record `plugins.installs` lama bawaan dalam config, OpenClaw memindahkannya ke indeks plugin dan menghapus key config; jika salah satu penulisan gagal, record config dipertahankan agar metadata instalasi tidak hilang.

### Uninstall

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` menghapus record plugin dari `plugins.entries`, indeks plugin yang dipersistensikan, entri daftar allow/deny plugin, dan entri `plugins.load.paths` tertaut jika berlaku. Kecuali `--keep-files` ditetapkan, uninstall juga menghapus direktori instalasi terkelola yang dilacak ketika berada di dalam root ekstensi plugin OpenClaw. Untuk plugin active memory, slot memori direset ke `memory-core`.

<Note>
`--keep-config` didukung sebagai alias yang sudah deprecated untuk `--keep-files`.
</Note>

### Perbarui

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Pembaruan berlaku pada instalasi plugin yang dilacak di indeks plugin terkelola dan instalasi hook-pack yang dilacak di `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Me-resolve id plugin vs spec npm">
    Saat Anda meneruskan id plugin, OpenClaw menggunakan ulang spec instalasi yang tercatat untuk plugin tersebut. Artinya dist-tag yang disimpan sebelumnya seperti `@beta` dan versi pinned yang tepat tetap digunakan pada eksekusi `update <id>` berikutnya.

    Untuk instalasi npm, Anda juga dapat meneruskan spec paket npm eksplisit dengan dist-tag atau versi tepat. OpenClaw me-resolve nama paket tersebut kembali ke record plugin yang dilacak, memperbarui plugin terinstal tersebut, dan mencatat spec npm baru untuk pembaruan berbasis id di masa mendatang.

    Meneruskan nama paket npm tanpa versi atau tag juga me-resolve kembali ke record plugin yang dilacak. Gunakan ini ketika plugin dipin ke versi tepat dan Anda ingin memindahkannya kembali ke jalur rilis default registry.

  </Accordion>
  <Accordion title="Pemeriksaan versi dan drift integritas">
    Sebelum pembaruan npm langsung, OpenClaw memeriksa versi paket terinstal terhadap metadata registry npm. Jika versi terinstal dan identitas artefak tercatat sudah cocok dengan target yang di-resolve, pembaruan dilewati tanpa mengunduh, menginstal ulang, atau menulis ulang `openclaw.json`.

    Ketika hash integritas tersimpan ada dan hash artefak yang diambil berubah, OpenClaw memperlakukannya sebagai drift artefak npm. Perintah interaktif `openclaw plugins update` mencetak hash yang diharapkan dan aktual lalu meminta konfirmasi sebelum melanjutkan. Helper pembaruan non-interaktif gagal tertutup kecuali pemanggil menyediakan kebijakan kelanjutan eksplisit.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install saat update">
    `--dangerously-force-unsafe-install` juga tersedia pada `plugins update` sebagai override break-glass untuk false positive pemindaian kode berbahaya bawaan selama pembaruan plugin. Ini tetap tidak melewati blok kebijakan `before_install` plugin atau pemblokiran kegagalan pemindaian, dan hanya berlaku untuk pembaruan plugin, bukan pembaruan hook-pack.
  </Accordion>
</AccordionGroup>

### Inspeksi

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect menampilkan identitas, status muat, sumber, kemampuan manifes, flag kebijakan, diagnostik, metadata instalasi, kemampuan bundel, dan dukungan server MCP atau LSP apa pun yang terdeteksi tanpa mengimpor runtime plugin secara default. Tambahkan `--runtime` untuk memuat modul plugin dan menyertakan hook, tool, perintah, service, metode gateway, dan route HTTP yang terdaftar. Inspeksi runtime melaporkan dependensi plugin yang hilang secara langsung; instalasi dan perbaikan tetap berada di `openclaw plugins install`, `openclaw plugins update`, dan `openclaw doctor --fix`.

Perintah CLI milik plugin diinstal sebagai grup perintah root `openclaw`. Setelah `inspect --runtime` menampilkan perintah di bawah `cliCommands`, jalankan sebagai `openclaw <command> ...`; misalnya plugin yang mendaftarkan `demo-git` dapat diverifikasi dengan `openclaw demo-git ping`.

Setiap plugin diklasifikasikan berdasarkan apa yang benar-benar didaftarkannya saat runtime:

- **plain-capability** — satu jenis kemampuan (misalnya plugin khusus provider)
- **hybrid-capability** — beberapa jenis kemampuan (misalnya teks + ucapan + gambar)
- **hook-only** — hanya hook, tanpa kemampuan atau surface
- **non-capability** — tool/perintah/service tetapi tanpa kemampuan

Lihat [Bentuk plugin](/id/plugins/architecture#plugin-shapes) untuk informasi lebih lanjut tentang model kemampuan.

<Note>
Flag `--json` menghasilkan laporan yang dapat dibaca mesin dan cocok untuk scripting serta audit. `inspect --all` merender tabel seluruh fleet dengan kolom shape, jenis kemampuan, pemberitahuan kompatibilitas, kemampuan bundel, dan ringkasan hook. `info` adalah alias untuk `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` melaporkan error pemuatan plugin, diagnostik manifes/discovery, dan pemberitahuan kompatibilitas. Ketika semuanya bersih, perintah ini mencetak `No plugin issues detected.`

Untuk kegagalan bentuk modul seperti ekspor `register`/`activate` yang hilang, jalankan ulang dengan `OPENCLAW_PLUGIN_LOAD_DEBUG=1` untuk menyertakan ringkasan bentuk ekspor yang ringkas dalam output diagnostik.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Registry plugin lokal adalah model baca dingin OpenClaw yang dipersistensikan untuk identitas plugin terinstal, pengaktifan, metadata sumber, dan kepemilikan kontribusi. Startup normal, lookup pemilik provider, klasifikasi setup channel, dan inventaris plugin dapat membacanya tanpa mengimpor modul runtime plugin.

Gunakan `plugins registry` untuk memeriksa apakah registry yang dipersistensikan ada, mutakhir, atau stale. Gunakan `--refresh` untuk membangunnya ulang dari indeks plugin yang dipersistensikan, kebijakan config, dan metadata manifes/paket. Ini adalah path perbaikan, bukan path aktivasi runtime.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` adalah switch kompatibilitas break-glass yang sudah deprecated untuk kegagalan baca registry. Utamakan `plugins registry --refresh` atau `openclaw doctor --fix`; fallback env hanya untuk pemulihan startup darurat sementara migrasi diluncurkan.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Daftar marketplace menerima path marketplace lokal, path `marketplace.json`, singkatan GitHub seperti `owner/repo`, URL repo GitHub, atau URL git. `--json` mencetak label sumber yang di-resolve plus manifes marketplace yang di-parse dan entri plugin.

## Terkait

- [Membangun plugin](/id/plugins/building-plugins)
- [Referensi CLI](/id/cli)
- [Plugin komunitas](/id/plugins/community)
