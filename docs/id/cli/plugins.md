---
read_when:
    - Anda ingin menginstal atau mengelola Plugin Gateway atau paket yang kompatibel
    - Anda ingin mendiagnosis kegagalan pemuatan Plugin
sidebarTitle: Plugins
summary: Referensi CLI untuk `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, deps, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-04-30T09:41:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 381e3243eaefb5b5e31db8fd2ba459773649a6ef427080a12018ea92b25f707c
    source_path: cli/plugins.md
    workflow: 16
---

Kelola Plugin Gateway, paket hook, dan bundel yang kompatibel.

<CardGroup cols={2}>
  <Card title="Sistem Plugin" href="/id/tools/plugin">
    Panduan pengguna akhir untuk memasang, mengaktifkan, dan memecahkan masalah Plugin.
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
openclaw plugins install <path-or-spec>
openclaw plugins inspect <id>
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

Untuk investigasi pemasangan, pemeriksaan, penghapusan, atau penyegaran registri yang lambat, jalankan
perintah dengan `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Jejak menulis waktu fase
ke stderr dan menjaga keluaran JSON tetap dapat diurai. Lihat [Debugging](/id/help/debugging#plugin-lifecycle-trace).

<Note>
Plugin bawaan dikirim bersama OpenClaw. Beberapa diaktifkan secara default (misalnya penyedia model bawaan, penyedia ucapan bawaan, dan Plugin browser bawaan); yang lain memerlukan `plugins enable`.

Plugin OpenClaw native harus mengirim `openclaw.plugin.json` dengan JSON Schema inline (`configSchema`, meskipun kosong). Bundel yang kompatibel menggunakan manifest bundel mereka sendiri sebagai gantinya.

`plugins list` menampilkan `Format: openclaw` atau `Format: bundle`. Keluaran daftar/info verbose juga menampilkan subjenis bundel (`codex`, `claude`, atau `cursor`) plus kemampuan bundel yang terdeteksi.
</Note>

### Pasang

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
Nama paket polos diperiksa terhadap ClawHub terlebih dahulu, lalu npm. Perlakukan pemasangan Plugin seperti menjalankan kode. Lebih baik gunakan versi yang dipin.
</Warning>

<Note>
ClawHub adalah permukaan distribusi dan penemuan utama untuk sebagian besar Plugin. Npm
tetap menjadi fallback yang didukung dan jalur pemasangan langsung. Selama migrasi ke
ClawHub, OpenClaw masih mengirim beberapa paket Plugin milik OpenClaw `@openclaw/*`
di npm; versi paket tersebut dapat tertinggal dari sumber bawaan di antara rangkaian rilis Plugin.
Jika npm melaporkan paket Plugin milik OpenClaw sebagai deprecated, versi
yang dipublikasikan tersebut adalah artefak eksternal lama; gunakan Plugin yang dibundel dengan
OpenClaw saat ini atau checkout lokal sampai paket npm yang lebih baru dipublikasikan.
</Note>

<AccordionGroup>
  <Accordion title="Penyertaan konfigurasi dan pemulihan konfigurasi tidak valid">
    Jika bagian `plugins` Anda didukung oleh `$include` satu file, `plugins install/update/enable/disable/uninstall` menulis melalui file yang disertakan tersebut dan membiarkan `openclaw.json` tidak tersentuh. Penyertaan root, array penyertaan, dan penyertaan dengan override saudara gagal tertutup alih-alih diratakan. Lihat [Penyertaan konfigurasi](/id/gateway/configuration) untuk bentuk yang didukung.

    Jika konfigurasi tidak valid selama pemasangan, `plugins install` biasanya gagal tertutup dan memberi tahu Anda untuk menjalankan `openclaw doctor --fix` terlebih dahulu. Selama startup Gateway, konfigurasi tidak valid untuk satu Plugin diisolasi ke Plugin tersebut sehingga channel dan Plugin lain dapat tetap berjalan; `openclaw doctor --fix` dapat mengarantina entri Plugin yang tidak valid. Satu-satunya pengecualian waktu pemasangan yang terdokumentasi adalah jalur pemulihan Plugin bawaan yang sempit untuk Plugin yang secara eksplisit memilih masuk ke `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force dan pemasangan ulang vs pembaruan">
    `--force` menggunakan ulang target pemasangan yang ada dan menimpa Plugin atau paket hook yang sudah terpasang di tempat. Gunakan ini saat Anda sengaja memasang ulang id yang sama dari path lokal baru, arsip, paket ClawHub, atau artefak npm. Untuk upgrade rutin Plugin npm yang sudah dilacak, lebih baik gunakan `openclaw plugins update <id-or-npm-spec>`.

    Jika Anda menjalankan `plugins install` untuk id Plugin yang sudah terpasang, OpenClaw berhenti dan mengarahkan Anda ke `plugins update <id-or-npm-spec>` untuk upgrade normal, atau ke `plugins install <package> --force` saat Anda benar-benar ingin menimpa pemasangan saat ini dari sumber yang berbeda.

  </Accordion>
  <Accordion title="Cakupan --pin">
    `--pin` hanya berlaku untuk pemasangan npm. Ini tidak didukung dengan `--marketplace`, karena pemasangan marketplace mempertahankan metadata sumber marketplace alih-alih spec npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` adalah opsi darurat untuk positif palsu di pemindai kode berbahaya bawaan. Ini memungkinkan pemasangan dilanjutkan bahkan saat pemindai bawaan melaporkan temuan `critical`, tetapi ini **tidak** melewati blok kebijakan hook `before_install` Plugin dan **tidak** melewati kegagalan pemindaian.

    Flag CLI ini berlaku untuk alur pemasangan/pembaruan Plugin. Pemasangan dependensi skill yang didukung Gateway menggunakan override permintaan `dangerouslyForceUnsafeInstall` yang sesuai, sementara `openclaw skills install` tetap menjadi alur unduh/pasang skill ClawHub yang terpisah.

    Jika Plugin yang Anda publikasikan di ClawHub diblokir oleh pemindaian registri, gunakan langkah penerbit di [ClawHub](/id/tools/clawhub).

  </Accordion>
  <Accordion title="Paket hook dan spec npm">
    `plugins install` juga merupakan permukaan pemasangan untuk paket hook yang mengekspos `openclaw.hooks` di `package.json`. Gunakan `openclaw hooks` untuk visibilitas hook terfilter dan pengaktifan per hook, bukan pemasangan paket.

    Spec npm bersifat **hanya registri** (nama paket + **versi persis** opsional atau **dist-tag**). Spec Git/URL/file dan rentang semver ditolak. Pemasangan dependensi berjalan secara lokal proyek dengan `--ignore-scripts` untuk keamanan, bahkan saat shell Anda memiliki pengaturan pemasangan npm global.

    Gunakan `npm:<package>` saat Anda ingin melewati pencarian ClawHub dan memasang langsung dari npm. Spec paket polos tetap memprioritaskan ClawHub dan hanya fallback ke npm saat ClawHub tidak memiliki paket atau versi tersebut.

    Spec polos dan `@latest` tetap berada di jalur stabil. Jika npm me-resolve salah satunya ke prerelease, OpenClaw berhenti dan meminta Anda untuk ikut serta secara eksplisit dengan tag prerelease seperti `@beta`/`@rc` atau versi prerelease persis seperti `@1.2.3-beta.4`.

    Jika spec pemasangan polos cocok dengan id Plugin bawaan (misalnya `diffs`), OpenClaw memasang Plugin bawaan secara langsung. Untuk memasang paket npm dengan nama yang sama, gunakan spec scoped eksplisit (misalnya `@scope/diffs`).

  </Accordion>
  <Accordion title="Arsip">
    Arsip yang didukung: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Arsip Plugin OpenClaw native harus berisi `openclaw.plugin.json` yang valid di root Plugin yang diekstrak; arsip yang hanya berisi `package.json` ditolak sebelum OpenClaw menulis catatan pemasangan.

    Pemasangan marketplace Claude juga didukung.

  </Accordion>
</AccordionGroup>

Pemasangan ClawHub menggunakan locator eksplisit `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw kini juga memprioritaskan ClawHub untuk spec Plugin polos yang aman untuk npm. OpenClaw hanya fallback ke npm jika ClawHub tidak memiliki paket atau versi tersebut:

```bash
openclaw plugins install openclaw-codex-app-server
```

Gunakan `npm:` untuk memaksa resolusi hanya npm, misalnya saat ClawHub tidak dapat dijangkau atau Anda tahu paket hanya ada di npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw mengunduh arsip paket dari ClawHub, memeriksa kompatibilitas API Plugin / Gateway minimum yang diiklankan, lalu memasangnya melalui jalur arsip normal. Pemasangan yang tercatat mempertahankan metadata sumber ClawHub mereka untuk pembaruan berikutnya.
Pemasangan ClawHub tanpa versi mempertahankan spec tercatat tanpa versi sehingga `openclaw plugins update` dapat mengikuti rilis ClawHub yang lebih baru; pemilih versi atau tag eksplisit seperti `clawhub:pkg@1.2.3` dan `clawhub:pkg@beta` tetap dipin ke pemilih tersebut.

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
    - nama marketplace dikenal Claude dari `~/.claude/plugins/known_marketplaces.json`
    - root marketplace lokal atau path `marketplace.json`
    - shorthand repo GitHub seperti `owner/repo`
    - URL repo GitHub seperti `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="Aturan marketplace jarak jauh">
    Untuk marketplace jarak jauh yang dimuat dari GitHub atau git, entri Plugin harus tetap berada di dalam repo marketplace yang dikloning. OpenClaw menerima sumber path relatif dari repo tersebut dan menolak sumber Plugin HTTP(S), path absolut, git, GitHub, dan sumber non-path lainnya dari manifest jarak jauh.
  </Tab>
</Tabs>

Untuk path lokal dan arsip, OpenClaw mendeteksi otomatis:

- Plugin OpenClaw native (`openclaw.plugin.json`)
- bundel yang kompatibel dengan Codex (`.codex-plugin/plugin.json`)
- bundel yang kompatibel dengan Claude (`.claude-plugin/plugin.json` atau tata letak komponen Claude default)
- bundel yang kompatibel dengan Cursor (`.cursor-plugin/plugin.json`)

<Note>
Bundel yang kompatibel dipasang ke root Plugin normal dan berpartisipasi dalam alur daftar/info/aktifkan/nonaktifkan yang sama. Saat ini, Skills bundel, Skills perintah Claude, default `settings.json` Claude, default `.lsp.json` Claude / `lspServers` yang dideklarasikan manifest, Skills perintah Cursor, dan direktori hook Codex yang kompatibel didukung; kemampuan bundel terdeteksi lainnya ditampilkan dalam diagnostik/info tetapi belum dihubungkan ke eksekusi runtime.
</Note>

### Daftar

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  Tampilkan hanya Plugin yang diaktifkan.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Beralih dari tampilan tabel ke baris detail per Plugin dengan metadata sumber/asal/versi/aktivasi.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventaris yang dapat dibaca mesin plus diagnostik registri.
</ParamField>

<Note>
`plugins list` membaca registri plugin lokal yang dipersistenkan terlebih dahulu, dengan fallback turunan yang hanya berbasis manifest ketika registri hilang atau tidak valid. Ini berguna untuk memeriksa apakah sebuah plugin terpasang, diaktifkan, dan terlihat oleh perencanaan startup dingin, tetapi ini bukan probe runtime langsung terhadap proses Gateway yang sudah berjalan. Setelah mengubah kode plugin, pengaktifan, kebijakan hook, atau `plugins.load.paths`, mulai ulang Gateway yang melayani channel sebelum mengharapkan kode `register(api)` atau hook baru berjalan. Untuk deployment jarak jauh/container, pastikan Anda memulai ulang child `openclaw gateway run` yang sebenarnya, bukan hanya proses wrapper.
</Note>

Untuk pekerjaan plugin bawaan di dalam image Docker terpaket, bind-mount direktori
sumber plugin di atas path sumber terpaket yang sesuai, seperti
`/app/extensions/synology-chat`. OpenClaw akan menemukan overlay sumber yang di-mount itu
sebelum `/app/dist/extensions/synology-chat`; direktori sumber yang sekadar disalin
tetap inert sehingga instalasi terpaket normal tetap menggunakan dist terkompilasi.

Untuk debugging hook runtime:

- `openclaw plugins inspect <id> --json` menampilkan hook terdaftar dan diagnostik dari pass inspeksi yang memuat modul.
- `openclaw gateway status --deep --require-rpc` mengonfirmasi Gateway yang dapat dijangkau, petunjuk layanan/proses, path konfigurasi, dan kesehatan RPC.
- Hook percakapan non-bawaan (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) memerlukan `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Gunakan `--link` untuk menghindari penyalinan direktori lokal (menambahkan ke `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` tidak didukung dengan `--link` karena instalasi tertaut menggunakan kembali path sumber alih-alih menyalin ke target instalasi terkelola.

Gunakan `--pin` pada instalasi npm untuk menyimpan spec persis yang diselesaikan (`name@version`) di indeks plugin terkelola sambil mempertahankan perilaku default tanpa pin.
</Note>

### Indeks plugin

Metadata instalasi plugin adalah state yang dikelola mesin, bukan konfigurasi pengguna. Instalasi dan pembaruan menuliskannya ke `plugins/installs.json` di bawah direktori state OpenClaw yang aktif. Map `installRecords` tingkat atasnya adalah sumber metadata instalasi yang tahan lama, termasuk record untuk manifest plugin yang rusak atau hilang. Array `plugins` adalah cache registri dingin yang diturunkan dari manifest. File ini menyertakan peringatan jangan-diedit dan digunakan oleh `openclaw plugins update`, uninstall, diagnostik, dan registri plugin dingin.

Ketika OpenClaw melihat record `plugins.installs` lama yang dikirimkan dalam konfigurasi, OpenClaw memindahkannya ke indeks plugin dan menghapus kunci konfigurasi; jika salah satu penulisan gagal, record konfigurasi dipertahankan agar metadata instalasi tidak hilang.

### Dependensi runtime

```bash
openclaw plugins deps
openclaw plugins deps --repair
openclaw plugins deps --prune
openclaw plugins deps --json
```

`plugins deps` memeriksa tahap dependensi runtime terpaket untuk plugin bawaan milik OpenClaw yang dipilih oleh konfigurasi plugin, channel yang diaktifkan/dikonfigurasi, penyedia model yang dikonfigurasi, atau default manifest bawaan. Ini bukan jalur instalasi/pembaruan untuk plugin npm pihak ketiga atau ClawHub.

Gunakan `--repair` ketika instalasi terpaket melaporkan dependensi runtime bawaan yang hilang saat startup Gateway atau `plugins doctor`. Perbaikan hanya menginstal dependensi plugin bawaan aktif yang hilang dengan skrip lifecycle dinonaktifkan. Gunakan `--prune` untuk menghapus root dependensi runtime eksternal tak dikenal yang usang dan tertinggal oleh layout terpaket lama.

### Uninstall

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` menghapus record plugin dari `plugins.entries`, indeks plugin yang dipersistenkan, entri daftar allow/deny plugin, dan entri `plugins.load.paths` tertaut bila berlaku. Kecuali `--keep-files` ditetapkan, uninstall juga menghapus direktori instalasi terkelola yang dilacak ketika berada di dalam root extensions plugin OpenClaw. Untuk plugin active memory, slot memori direset ke `memory-core`.

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

Pembaruan berlaku untuk instalasi plugin terlacak di indeks plugin terkelola dan instalasi hook-pack terlacak di `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Menyelesaikan id plugin vs spec npm">
    Ketika Anda meneruskan id plugin, OpenClaw menggunakan kembali spec instalasi yang tercatat untuk plugin tersebut. Artinya dist-tag yang sebelumnya disimpan seperti `@beta` dan versi persis yang di-pin terus digunakan pada eksekusi `update <id>` berikutnya.

    Untuk instalasi npm, Anda juga dapat meneruskan spec paket npm eksplisit dengan dist-tag atau versi persis. OpenClaw menyelesaikan nama paket itu kembali ke record plugin yang dilacak, memperbarui plugin terpasang tersebut, dan mencatat spec npm baru untuk pembaruan berbasis id di masa mendatang.

    Meneruskan nama paket npm tanpa versi atau tag juga diselesaikan kembali ke record plugin yang dilacak. Gunakan ini ketika sebuah plugin di-pin ke versi persis dan Anda ingin memindahkannya kembali ke jalur rilis default registri.

  </Accordion>
  <Accordion title="Pemeriksaan versi dan drift integritas">
    Sebelum pembaruan npm langsung, OpenClaw memeriksa versi paket yang terpasang terhadap metadata registri npm. Jika versi terpasang dan identitas artefak yang tercatat sudah cocok dengan target yang diselesaikan, pembaruan dilewati tanpa mengunduh, menginstal ulang, atau menulis ulang `openclaw.json`.

    Ketika hash integritas tersimpan ada dan hash artefak yang diambil berubah, OpenClaw memperlakukannya sebagai drift artefak npm. Perintah interaktif `openclaw plugins update` mencetak hash yang diharapkan dan aktual lalu meminta konfirmasi sebelum melanjutkan. Helper pembaruan non-interaktif gagal tertutup kecuali pemanggil menyediakan kebijakan kelanjutan eksplisit.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install pada update">
    `--dangerously-force-unsafe-install` juga tersedia pada `plugins update` sebagai override break-glass untuk false positive pemindaian kode berbahaya bawaan selama pembaruan plugin. Ini tetap tidak melewati blok kebijakan `before_install` plugin atau pemblokiran kegagalan pemindaian, dan hanya berlaku untuk pembaruan plugin, bukan pembaruan hook-pack.
  </Accordion>
</AccordionGroup>

### Inspeksi

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Introspeksi mendalam untuk satu plugin. Menampilkan identitas, status pemuatan, sumber, kapabilitas terdaftar, hook, tool, perintah, layanan, metode gateway, rute HTTP, flag kebijakan, diagnostik, metadata instalasi, kapabilitas bundle, dan dukungan server MCP atau LSP yang terdeteksi.

Setiap plugin diklasifikasikan berdasarkan apa yang benar-benar didaftarkannya saat runtime:

- **plain-capability** — satu jenis kapabilitas (misalnya plugin khusus penyedia)
- **hybrid-capability** — beberapa jenis kapabilitas (misalnya teks + ucapan + gambar)
- **hook-only** — hanya hook, tanpa kapabilitas atau surface
- **non-capability** — tool/perintah/layanan tetapi tanpa kapabilitas

Lihat [Bentuk plugin](/id/plugins/architecture#plugin-shapes) untuk informasi lebih lanjut tentang model kapabilitas.

<Note>
Flag `--json` menghasilkan laporan yang dapat dibaca mesin dan cocok untuk scripting serta audit. `inspect --all` merender tabel seluruh fleet dengan kolom bentuk, jenis kapabilitas, pemberitahuan kompatibilitas, kapabilitas bundle, dan ringkasan hook. `info` adalah alias untuk `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` melaporkan error pemuatan plugin, diagnostik manifest/discovery, dan pemberitahuan kompatibilitas. Ketika semuanya bersih, ini mencetak `No plugin issues detected.`

Untuk kegagalan bentuk modul seperti ekspor `register`/`activate` yang hilang, jalankan ulang dengan `OPENCLAW_PLUGIN_LOAD_DEBUG=1` untuk menyertakan ringkasan bentuk ekspor ringkas dalam output diagnostik.

### Registri

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Registri plugin lokal adalah model baca dingin OpenClaw yang dipersistenkan untuk identitas plugin terpasang, pengaktifan, metadata sumber, dan kepemilikan kontribusi. Startup normal, pencarian pemilik penyedia, klasifikasi setup channel, dan inventaris plugin dapat membacanya tanpa mengimpor modul runtime plugin.

Gunakan `plugins registry` untuk memeriksa apakah registri yang dipersistenkan ada, mutakhir, atau usang. Gunakan `--refresh` untuk membangunnya ulang dari indeks plugin yang dipersistenkan, kebijakan konfigurasi, dan metadata manifest/paket. Ini adalah jalur perbaikan, bukan jalur aktivasi runtime.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` adalah switch kompatibilitas break-glass deprecated untuk kegagalan baca registri. Lebih baik gunakan `plugins registry --refresh` atau `openclaw doctor --fix`; fallback env hanya untuk pemulihan startup darurat saat migrasi diluncurkan.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Daftar marketplace menerima path marketplace lokal, path `marketplace.json`, shorthand GitHub seperti `owner/repo`, URL repo GitHub, atau URL git. `--json` mencetak label sumber yang diselesaikan plus manifest marketplace dan entri plugin yang di-parse.

## Terkait

- [Membangun plugin](/id/plugins/building-plugins)
- [Referensi CLI](/id/cli)
- [Plugin komunitas](/id/plugins/community)
