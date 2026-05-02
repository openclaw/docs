---
read_when:
    - Anda ingin memasang atau mengelola Plugin Gateway atau bundel yang kompatibel
    - Anda ingin menelusuri kegagalan pemuatan Plugin
sidebarTitle: Plugins
summary: Referensi CLI untuk `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-05-02T20:42:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fc046a04175c1b22f787920bf5ec28c24d0bb7d62eda4d9517da8f5dbac4c50
    source_path: cli/plugins.md
    workflow: 16
---

Kelola Plugin Gateway, paket hook, dan bundel yang kompatibel.

<CardGroup cols={2}>
  <Card title="Sistem Plugin" href="/id/tools/plugin">
    Panduan pengguna akhir untuk memasang, mengaktifkan, dan memecahkan masalah Plugin.
  </Card>
  <Card title="Kelola Plugin" href="/id/plugins/manage-plugins">
    Contoh cepat untuk memasang, mencantumkan, memperbarui, mencopot pemasangan, dan menerbitkan.
  </Card>
  <Card title="Bundel Plugin" href="/id/plugins/bundles">
    Model kompatibilitas bundel.
  </Card>
  <Card title="Manifest Plugin" href="/id/plugins/manifest">
    Kolom manifest dan skema konfigurasi.
  </Card>
  <Card title="Keamanan" href="/id/gateway/security">
    Penguatan keamanan untuk pemasangan Plugin.
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

Untuk investigasi pemasangan, inspeksi, pencopotan pemasangan, atau penyegaran registri yang lambat, jalankan
perintah dengan `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Trace menulis pengaturan waktu fase
ke stderr dan menjaga keluaran JSON tetap dapat diurai. Lihat [Debugging](/id/help/debugging#plugin-lifecycle-trace).

<Note>
Plugin bawaan dikirim bersama OpenClaw. Sebagian diaktifkan secara default (misalnya penyedia model bawaan, penyedia ucapan bawaan, dan Plugin browser bawaan); yang lain memerlukan `plugins enable`.

Plugin OpenClaw native harus mengirimkan `openclaw.plugin.json` dengan JSON Schema inline (`configSchema`, meskipun kosong). Bundel yang kompatibel menggunakan manifest bundelnya sendiri sebagai gantinya.

`plugins list` menampilkan `Format: openclaw` atau `Format: bundle`. Keluaran daftar/info verbose juga menampilkan subtipe bundel (`codex`, `claude`, atau `cursor`) beserta kemampuan bundel yang terdeteksi.
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
Nama paket polos dipasang dari npm secara default selama peralihan peluncuran. Gunakan `clawhub:<package>` untuk ClawHub. Perlakukan pemasangan Plugin seperti menjalankan kode. Utamakan versi yang dipin.
</Warning>

`plugins search` mengkueri ClawHub untuk paket Plugin yang dapat dipasang dan mencetak
nama paket siap pasang. Perintah ini mencari paket Plugin kode dan Plugin bundel,
bukan Skills. Gunakan `openclaw skills search` untuk Skills ClawHub.

<Note>
ClawHub adalah permukaan distribusi dan penemuan utama untuk sebagian besar Plugin. Npm
tetap menjadi fallback yang didukung dan jalur pemasangan langsung. Selama migrasi ke
ClawHub, OpenClaw masih mengirimkan beberapa paket Plugin `@openclaw/*` milik OpenClaw
di npm; versi paket tersebut dapat tertinggal dari sumber bawaan di antara rangkaian rilis Plugin.
Jika npm melaporkan paket Plugin milik OpenClaw sebagai deprecated, versi
yang diterbitkan itu adalah artefak eksternal lama; gunakan Plugin yang dibundel dengan
OpenClaw saat ini atau checkout lokal sampai paket npm yang lebih baru diterbitkan.
</Note>

<AccordionGroup>
  <Accordion title="Include konfigurasi dan pemulihan konfigurasi tidak valid">
    Jika bagian `plugins` Anda didukung oleh `$include` satu file, `plugins install/update/enable/disable/uninstall` menulis langsung ke file yang di-include tersebut dan membiarkan `openclaw.json` tidak tersentuh. Include root, array include, dan include dengan override sibling gagal tertutup alih-alih diratakan. Lihat [Include konfigurasi](/id/gateway/configuration) untuk bentuk yang didukung.

    Jika konfigurasi tidak valid saat pemasangan, `plugins install` biasanya gagal tertutup dan meminta Anda menjalankan `openclaw doctor --fix` terlebih dahulu. Saat Gateway startup, konfigurasi tidak valid untuk satu Plugin diisolasi ke Plugin tersebut sehingga kanal dan Plugin lain dapat tetap berjalan; `openclaw doctor --fix` dapat mengarantina entri Plugin yang tidak valid. Satu-satunya pengecualian waktu pemasangan yang terdokumentasi adalah jalur pemulihan Plugin bawaan yang sempit untuk Plugin yang secara eksplisit ikut serta dalam `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force dan pemasangan ulang vs pembaruan">
    `--force` menggunakan ulang target pemasangan yang ada dan menimpa Plugin atau paket hook yang sudah terpasang di tempatnya. Gunakan ini saat Anda sengaja memasang ulang id yang sama dari path lokal, arsip, paket ClawHub, atau artefak npm baru. Untuk upgrade rutin Plugin npm yang sudah dilacak, utamakan `openclaw plugins update <id-or-npm-spec>`.

    Jika Anda menjalankan `plugins install` untuk id Plugin yang sudah terpasang, OpenClaw berhenti dan mengarahkan Anda ke `plugins update <id-or-npm-spec>` untuk upgrade normal, atau ke `plugins install <package> --force` saat Anda benar-benar ingin menimpa pemasangan saat ini dari sumber berbeda.

  </Accordion>
  <Accordion title="Cakupan --pin">
    `--pin` hanya berlaku untuk pemasangan npm. Ini tidak didukung dengan pemasangan `git:`; gunakan ref git eksplisit seperti `git:github.com/acme/plugin@v1.2.3` saat Anda menginginkan sumber yang dipin. Ini tidak didukung dengan `--marketplace`, karena pemasangan marketplace mempertahankan metadata sumber marketplace, bukan spec npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` adalah opsi darurat untuk positif palsu di pemindai kode berbahaya bawaan. Opsi ini memungkinkan pemasangan berlanjut bahkan saat pemindai bawaan melaporkan temuan `critical`, tetapi **tidak** melewati blok kebijakan hook `before_install` Plugin dan **tidak** melewati kegagalan pemindaian.

    Flag CLI ini berlaku untuk alur pemasangan/pembaruan Plugin. Pemasangan dependensi Skills yang didukung Gateway menggunakan override permintaan `dangerouslyForceUnsafeInstall` yang sesuai, sementara `openclaw skills install` tetap menjadi alur unduhan/pemasangan Skills ClawHub yang terpisah.

    Jika Plugin yang Anda terbitkan di ClawHub diblokir oleh pemindaian registri, gunakan langkah penerbit di [ClawHub](/id/tools/clawhub).

  </Accordion>
  <Accordion title="Paket hook dan spec npm">
    `plugins install` juga merupakan permukaan pemasangan untuk paket hook yang mengekspos `openclaw.hooks` di `package.json`. Gunakan `openclaw hooks` untuk visibilitas hook terfilter dan pengaktifan per hook, bukan pemasangan paket.

    Spec npm adalah **hanya registri** (nama paket + **versi persis** opsional atau **dist-tag**). Spec Git/URL/file dan rentang semver ditolak. Pemasangan dependensi berjalan secara lokal proyek dengan `--ignore-scripts` demi keamanan, bahkan saat shell Anda memiliki pengaturan pemasangan npm global.

    Gunakan `npm:<package>` saat Anda ingin membuat resolusi npm eksplisit. Spec paket polos juga dipasang langsung dari npm selama peralihan peluncuran.

    Spec polos dan `@latest` tetap berada di jalur stabil. Jika npm menyelesaikan salah satunya ke prerelease, OpenClaw berhenti dan meminta Anda ikut serta secara eksplisit dengan tag prerelease seperti `@beta`/`@rc` atau versi prerelease persis seperti `@1.2.3-beta.4`.

    Jika spec pemasangan polos cocok dengan id Plugin resmi (misalnya `diffs`), OpenClaw memasang entri katalog secara langsung. Untuk memasang paket npm dengan nama yang sama, gunakan spec scoped eksplisit (misalnya `@scope/diffs`).

  </Accordion>
  <Accordion title="Repositori Git">
    Gunakan `git:<repo>` untuk memasang langsung dari repositori git. Bentuk yang didukung mencakup URL clone `git:github.com/owner/repo`, `git:owner/repo`, `https://` lengkap, `ssh://`, `git://`, `file://`, dan `git@host:owner/repo.git`. Tambahkan `@<ref>` atau `#<ref>` untuk checkout branch, tag, atau commit sebelum pemasangan.

    Pemasangan Git meng-clone ke direktori sementara, checkout ref yang diminta jika ada, lalu menggunakan penginstal direktori Plugin normal. Itu berarti validasi manifest, pemindaian kode berbahaya, pekerjaan pemasangan package-manager, dan catatan pemasangan berperilaku seperti pemasangan npm. Pemasangan git yang direkam menyertakan URL/ref sumber beserta commit yang diselesaikan sehingga `openclaw plugins update` dapat menyelesaikan ulang sumber nanti.

    Setelah memasang dari git, gunakan `openclaw plugins inspect <id> --runtime --json` untuk memverifikasi registrasi runtime seperti metode Gateway dan perintah CLI. Jika Plugin mendaftarkan root CLI dengan `api.registerCli`, jalankan perintah itu langsung melalui CLI root OpenClaw, misalnya `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Arsip">
    Arsip yang didukung: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Arsip Plugin OpenClaw native harus berisi `openclaw.plugin.json` yang valid di root Plugin yang diekstrak; arsip yang hanya berisi `package.json` ditolak sebelum OpenClaw menulis catatan pemasangan.

    Pemasangan marketplace Claude juga didukung.

  </Accordion>
</AccordionGroup>

Pemasangan ClawHub menggunakan locator `clawhub:<package>` eksplisit:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Spec Plugin aman npm polos dipasang dari npm secara default selama peralihan peluncuran:

```bash
openclaw plugins install openclaw-codex-app-server
```

Gunakan `npm:` untuk membuat resolusi khusus npm eksplisit:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw memeriksa API Plugin yang diiklankan / kompatibilitas minimum Gateway sebelum pemasangan. Saat versi ClawHub yang dipilih menerbitkan artefak ClawPack, OpenClaw mengunduh `.tgz` npm-pack berversi, memverifikasi header digest ClawHub dan digest artefak, lalu memasangnya melalui jalur arsip normal. Versi ClawHub lama tanpa metadata ClawPack tetap dipasang melalui jalur verifikasi arsip paket lama. Pemasangan yang direkam menyimpan metadata sumber ClawHub, jenis artefak, integritas npm, shasum npm, nama tarball, dan fakta digest ClawPack untuk pembaruan berikutnya.
Pemasangan ClawHub tanpa versi menyimpan spec terekam tanpa versi sehingga `openclaw plugins update` dapat mengikuti rilis ClawHub yang lebih baru; selector versi atau tag eksplisit seperti `clawhub:pkg@1.2.3` dan `clawhub:pkg@beta` tetap dipin ke selector tersebut.

#### Shorthand marketplace

Gunakan shorthand `plugin@marketplace` saat nama marketplace ada di cache registri lokal Claude di `~/.claude/plugins/known_marketplaces.json`:

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
    - nama marketplace yang dikenal Claude dari `~/.claude/plugins/known_marketplaces.json`
    - root marketplace lokal atau path `marketplace.json`
    - singkatan repo GitHub seperti `owner/repo`
    - URL repo GitHub seperti `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="Aturan marketplace jarak jauh">
    Untuk marketplace jarak jauh yang dimuat dari GitHub atau git, entri Plugin harus tetap berada di dalam repo marketplace hasil kloning. OpenClaw menerima sumber path relatif dari repo tersebut dan menolak sumber Plugin HTTP(S), path absolut, git, GitHub, dan sumber Plugin non-path lainnya dari manifes jarak jauh.
  </Tab>
</Tabs>

Untuk path dan arsip lokal, OpenClaw mendeteksi otomatis:

- Plugin OpenClaw native (`openclaw.plugin.json`)
- bundel yang kompatibel dengan Codex (`.codex-plugin/plugin.json`)
- bundel yang kompatibel dengan Claude (`.claude-plugin/plugin.json` atau tata letak komponen Claude default)
- bundel yang kompatibel dengan Cursor (`.cursor-plugin/plugin.json`)

<Note>
Bundel yang kompatibel diinstal ke root Plugin normal dan ikut serta dalam alur list/info/enable/disable yang sama. Saat ini, Skills bundel, command-skills Claude, default `settings.json` Claude, default `.lsp.json` Claude / `lspServers` yang dideklarasikan manifes, command-skills Cursor, dan direktori hook Codex yang kompatibel didukung; kemampuan bundel lain yang terdeteksi ditampilkan dalam diagnostik/info tetapi belum dihubungkan ke eksekusi runtime.
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
  Inventaris yang dapat dibaca mesin plus diagnostik registry dan status instal dependensi package.
</ParamField>

<Note>
`plugins list` membaca registry Plugin lokal yang dipersistensikan terlebih dahulu, dengan fallback turunan hanya-manifes saat registry hilang atau tidak valid. Ini berguna untuk memeriksa apakah sebuah Plugin terinstal, diaktifkan, dan terlihat oleh perencanaan cold startup, tetapi ini bukan probe runtime langsung terhadap proses Gateway yang sudah berjalan. Setelah mengubah kode Plugin, enablement, kebijakan hook, atau `plugins.load.paths`, mulai ulang Gateway yang melayani channel sebelum mengharapkan kode `register(api)` atau hook baru berjalan. Untuk deployment jarak jauh/container, verifikasi bahwa Anda memulai ulang child `openclaw gateway run` yang sebenarnya, bukan hanya proses wrapper.

`plugins list --json` menyertakan `dependencyStatus` setiap Plugin dari `package.json`
`dependencies` dan `optionalDependencies`. OpenClaw memeriksa apakah nama package tersebut
ada di sepanjang path lookup Node `node_modules` normal milik Plugin; OpenClaw
tidak mengimpor kode runtime Plugin, menjalankan package manager, atau memperbaiki
dependensi yang hilang.
</Note>

`plugins search` adalah lookup katalog ClawHub jarak jauh. Ini tidak memeriksa
status lokal, mengubah config, menginstal package, atau memuat kode runtime Plugin. Hasil
pencarian menyertakan nama package ClawHub, family, channel, versi, ringkasan, dan
petunjuk instal seperti `openclaw plugins install clawhub:<package>`.

Untuk pekerjaan Plugin bawaan di dalam image Docker terpaket, bind-mount direktori
sumber Plugin di atas path sumber terpaket yang cocok, seperti
`/app/extensions/synology-chat`. OpenClaw akan menemukan overlay sumber yang di-mount
tersebut sebelum `/app/dist/extensions/synology-chat`; direktori sumber yang disalin biasa
tetap inert sehingga instal terpaket normal tetap menggunakan dist terkompilasi.

Untuk debugging hook runtime:

- `openclaw plugins inspect <id> --runtime --json` menampilkan hook terdaftar dan diagnostik dari pass inspeksi dengan modul dimuat. Inspeksi runtime tidak pernah menginstal dependensi; gunakan `openclaw doctor --fix` untuk membersihkan status dependensi legacy atau menginstal Plugin unduhan yang dikonfigurasi tetapi hilang.
- `openclaw gateway status --deep --require-rpc` mengonfirmasi Gateway yang dapat dijangkau, petunjuk service/proses, path config, dan kesehatan RPC.
- Hook percakapan non-bawaan (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) memerlukan `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Gunakan `--link` untuk menghindari penyalinan direktori lokal (menambahkan ke `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` tidak didukung dengan `--link` karena instal tertaut menggunakan ulang path sumber alih-alih menyalin ke atas target instal terkelola.

Gunakan `--pin` pada instal npm untuk menyimpan spec persis yang diselesaikan (`name@version`) dalam indeks Plugin terkelola sambil mempertahankan perilaku default tanpa pin.
</Note>

### Indeks Plugin

Metadata instal Plugin adalah status yang dikelola mesin, bukan config pengguna. Instal dan pembaruan menuliskannya ke `plugins/installs.json` di bawah direktori status OpenClaw aktif. Map `installRecords` tingkat teratasnya adalah sumber metadata instal yang tahan lama, termasuk record untuk manifes Plugin yang rusak atau hilang. Array `plugins` adalah cache registry cold turunan-manifes. File tersebut menyertakan peringatan jangan-edit dan digunakan oleh `openclaw plugins update`, uninstall, diagnostik, dan registry Plugin cold.

Saat OpenClaw melihat record legacy `plugins.installs` bawaan dalam config, OpenClaw memindahkannya ke indeks Plugin dan menghapus key config; jika salah satu penulisan gagal, record config dipertahankan agar metadata instal tidak hilang.

### Uninstall

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` menghapus record Plugin dari `plugins.entries`, indeks Plugin yang dipersistensikan, entri allow/deny list Plugin, dan entri `plugins.load.paths` tertaut jika berlaku. Kecuali `--keep-files` disetel, uninstall juga menghapus direktori instal terkelola yang dilacak saat berada di dalam root ekstensi Plugin OpenClaw. Untuk Plugin active memory, slot memori direset ke `memory-core`.

<Note>
`--keep-config` didukung sebagai alias deprecated untuk `--keep-files`.
</Note>

### Pembaruan

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Pembaruan diterapkan pada instal Plugin yang dilacak dalam indeks Plugin terkelola dan instal hook-pack yang dilacak di `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Menyelesaikan id Plugin vs spec npm">
    Saat Anda meneruskan id Plugin, OpenClaw menggunakan ulang spec instal yang tercatat untuk Plugin tersebut. Ini berarti dist-tag yang sebelumnya tersimpan seperti `@beta` dan versi pinned persis terus digunakan pada eksekusi `update <id>` berikutnya.

    Untuk instal npm, Anda juga dapat meneruskan spec package npm eksplisit dengan dist-tag atau versi persis. OpenClaw menyelesaikan nama package tersebut kembali ke record Plugin yang dilacak, memperbarui Plugin terinstal tersebut, dan mencatat spec npm baru untuk pembaruan berbasis id di masa mendatang.

    Meneruskan nama package npm tanpa versi atau tag juga diselesaikan kembali ke record Plugin yang dilacak. Gunakan ini saat sebuah Plugin dipin ke versi persis dan Anda ingin memindahkannya kembali ke lini rilis default registry.

  </Accordion>
  <Accordion title="Pembaruan channel beta">
    `openclaw plugins update` menggunakan ulang spec Plugin yang dilacak kecuali Anda meneruskan spec baru. `openclaw update` juga mengetahui channel pembaruan OpenClaw aktif: pada channel beta, record Plugin npm dan ClawHub lini-default mencoba `@beta` terlebih dahulu, lalu fallback ke spec default/latest yang tercatat jika tidak ada rilis beta Plugin. Versi persis dan tag eksplisit tetap dipin ke selector tersebut.

  </Accordion>
  <Accordion title="Pemeriksaan versi dan drift integritas">
    Sebelum pembaruan npm langsung, OpenClaw memeriksa versi package terinstal terhadap metadata registry npm. Jika versi terinstal dan identitas artefak tercatat sudah cocok dengan target yang diselesaikan, pembaruan dilewati tanpa mengunduh, menginstal ulang, atau menulis ulang `openclaw.json`.

    Saat hash integritas tersimpan ada dan hash artefak yang diambil berubah, OpenClaw memperlakukannya sebagai drift artefak npm. Perintah interaktif `openclaw plugins update` mencetak hash yang diharapkan dan aktual lalu meminta konfirmasi sebelum melanjutkan. Helper pembaruan non-interaktif gagal tertutup kecuali pemanggil menyediakan kebijakan kelanjutan eksplisit.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install pada pembaruan">
    `--dangerously-force-unsafe-install` juga tersedia pada `plugins update` sebagai override break-glass untuk false positive pemindaian kode berbahaya bawaan selama pembaruan Plugin. Ini tetap tidak melewati blok kebijakan `before_install` Plugin atau pemblokiran kegagalan pemindaian, dan hanya berlaku untuk pembaruan Plugin, bukan pembaruan hook-pack.
  </Accordion>
</AccordionGroup>

### Inspeksi

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect menampilkan identitas, status pemuatan, sumber, kemampuan manifes, flag kebijakan, diagnostik, metadata instal, kemampuan bundel, dan dukungan server MCP atau LSP yang terdeteksi tanpa mengimpor runtime Plugin secara default. Tambahkan `--runtime` untuk memuat modul Plugin dan menyertakan hook, tools, commands, services, gateway methods, dan route HTTP terdaftar. Inspeksi runtime melaporkan dependensi Plugin yang hilang secara langsung; instal dan perbaikan tetap berada di `openclaw plugins install`, `openclaw plugins update`, dan `openclaw doctor --fix`.

Command CLI milik Plugin diinstal sebagai grup command root `openclaw`. Setelah `inspect --runtime` menampilkan command di bawah `cliCommands`, jalankan sebagai `openclaw <command> ...`; misalnya Plugin yang mendaftarkan `demo-git` dapat diverifikasi dengan `openclaw demo-git ping`.

Setiap Plugin diklasifikasikan berdasarkan apa yang benar-benar didaftarkannya saat runtime:

- **plain-capability** — satu jenis kemampuan (misalnya Plugin khusus provider)
- **hybrid-capability** — beberapa jenis kemampuan (misalnya teks + ucapan + gambar)
- **hook-only** — hanya hook, tanpa kemampuan atau surface
- **non-capability** — tools/commands/services tetapi tanpa kemampuan

Lihat [Bentuk Plugin](/id/plugins/architecture#plugin-shapes) untuk informasi lebih lanjut tentang model kemampuan.

<Note>
Flag `--json` menghasilkan laporan yang dapat dibaca mesin dan cocok untuk scripting serta audit. `inspect --all` merender tabel seluruh fleet dengan kolom bentuk, jenis kemampuan, pemberitahuan kompatibilitas, kemampuan bundel, dan ringkasan hook. `info` adalah alias untuk `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` melaporkan error pemuatan Plugin, diagnostik manifes/discovery, dan pemberitahuan kompatibilitas. Saat semuanya bersih, perintah mencetak `No plugin issues detected.`

Untuk kegagalan bentuk modul seperti ekspor `register`/`activate` yang hilang, jalankan ulang dengan `OPENCLAW_PLUGIN_LOAD_DEBUG=1` untuk menyertakan ringkasan bentuk ekspor yang ringkas dalam output diagnostik.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Registry Plugin lokal adalah model baca cold yang dipersistensikan OpenClaw untuk identitas Plugin terinstal, enablement, metadata sumber, dan kepemilikan kontribusi. Startup normal, lookup owner provider, klasifikasi setup channel, dan inventaris Plugin dapat membacanya tanpa mengimpor modul runtime Plugin.

Gunakan `plugins registry` untuk memeriksa apakah registry yang dipersistensikan ada, terkini, atau stale. Gunakan `--refresh` untuk membangunnya ulang dari indeks Plugin yang dipersistensikan, kebijakan config, dan metadata manifes/package. Ini adalah path perbaikan, bukan path aktivasi runtime.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` adalah switch kompatibilitas darurat yang sudah tidak digunakan lagi untuk kegagalan pembacaan registry. Utamakan `plugins registry --refresh` atau `openclaw doctor --fix`; fallback env hanya untuk pemulihan startup darurat selama migrasi diluncurkan.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Daftar marketplace menerima path marketplace lokal, path `marketplace.json`, singkatan GitHub seperti `owner/repo`, URL repo GitHub, atau URL git. `--json` mencetak label sumber yang di-resolve beserta manifes marketplace yang diurai dan entri Plugin.

## Terkait

- [Membangun Plugin](/id/plugins/building-plugins)
- [Referensi CLI](/id/cli)
- [Plugin komunitas](/id/plugins/community)
