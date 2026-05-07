---
read_when:
    - Anda ingin menginstal atau mengelola Plugin Gateway atau bundel yang kompatibel
    - Anda ingin men-debug kegagalan pemuatan Plugin
sidebarTitle: Plugins
summary: Referensi CLI untuk `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-05-07T01:51:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: c43d51a8ecc2d420991e7beb585cbf3046d44cd6dca755377f4c050c7a155064
    source_path: cli/plugins.md
    workflow: 16
---

Kelola Plugin Gateway, paket hook, dan bundel yang kompatibel.

<CardGroup cols={2}>
  <Card title="Sistem Plugin" href="/id/tools/plugin">
    Panduan pengguna akhir untuk menginstal, mengaktifkan, dan memecahkan masalah Plugin.
  </Card>
  <Card title="Kelola Plugin" href="/id/plugins/manage-plugins">
    Contoh cepat untuk install, list, update, uninstall, dan publishing.
  </Card>
  <Card title="Bundel Plugin" href="/id/plugins/bundles">
    Model kompatibilitas bundel.
  </Card>
  <Card title="Manifest Plugin" href="/id/plugins/manifest">
    Kolom manifest dan skema konfigurasi.
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
```

Untuk penyelidikan install, inspect, uninstall, atau registry-refresh yang lambat, jalankan
perintah dengan `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Trace menulis pengaturan waktu fase
ke stderr dan menjaga output JSON tetap dapat diurai. Lihat [Debugging](/id/help/debugging#plugin-lifecycle-trace).

<Note>
Dalam mode Nix (`OPENCLAW_NIX_MODE=1`), mutator siklus hidup Plugin dinonaktifkan. Gunakan sumber Nix untuk instalasi ini, bukan `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable`, atau `plugins disable`; untuk nix-openclaw, gunakan [Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) yang mengutamakan agen.
</Note>

<Note>
Plugin bawaan dikirim bersama OpenClaw. Sebagian diaktifkan secara default (misalnya penyedia model bawaan, penyedia ucapan bawaan, dan Plugin browser bawaan); yang lain memerlukan `plugins enable`.

Plugin OpenClaw native harus menyertakan `openclaw.plugin.json` dengan JSON Schema inline (`configSchema`, meskipun kosong). Bundel yang kompatibel menggunakan manifest bundel mereka sendiri.

`plugins list` menampilkan `Format: openclaw` atau `Format: bundle`. Output list/info verbose juga menampilkan subtipe bundel (`codex`, `claude`, atau `cursor`) beserta kemampuan bundel yang terdeteksi.
</Note>

### Install

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # npm by default
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install npm-pack:<path.tgz>            # local npm pack through npm install semantics
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
Nama paket polos diinstal dari npm secara default selama peralihan peluncuran. Gunakan `clawhub:<package>` untuk ClawHub. Perlakukan instalasi Plugin seperti menjalankan kode. Utamakan versi yang dipin.
</Warning>

`plugins search` menanyakan ClawHub untuk paket Plugin yang dapat diinstal dan mencetak
nama paket yang siap diinstal. Perintah ini mencari paket code-plugin dan bundle-plugin,
bukan Skills. Gunakan `openclaw skills search` untuk Skills ClawHub.

<Note>
ClawHub adalah permukaan distribusi dan penemuan utama untuk sebagian besar Plugin. Npm
tetap menjadi fallback yang didukung dan jalur instalasi langsung. Paket Plugin
`@openclaw/*` milik OpenClaw diterbitkan lagi di npm; lihat daftar saat ini
di [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) atau
[inventaris Plugin](/id/plugins/plugin-inventory). Instalasi stabil menggunakan `latest`.
Instalasi dan pembaruan kanal beta mengutamakan dist-tag npm `beta` ketika tag tersebut
tersedia, lalu fallback ke `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Penyertaan konfigurasi dan perbaikan konfigurasi tidak valid">
    Jika bagian `plugins` Anda didukung oleh `$include` satu file, `plugins install/update/enable/disable/uninstall` menulis melalui file yang disertakan tersebut dan membiarkan `openclaw.json` tidak berubah. Penyertaan root, array penyertaan, dan penyertaan dengan override saudara gagal tertutup alih-alih diratakan. Lihat [Penyertaan konfigurasi](/id/gateway/configuration) untuk bentuk yang didukung.

    Jika konfigurasi tidak valid selama instalasi, `plugins install` biasanya gagal tertutup dan meminta Anda menjalankan `openclaw doctor --fix` terlebih dahulu. Selama startup Gateway dan hot reload, konfigurasi Plugin yang tidak valid gagal tertutup seperti konfigurasi tidak valid lainnya; `openclaw doctor --fix` dapat mengarantina entri Plugin yang tidak valid. Satu-satunya pengecualian waktu instalasi yang terdokumentasi adalah jalur pemulihan sempit Plugin bawaan untuk Plugin yang secara eksplisit memilih ikut `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force dan instal ulang vs pembaruan">
    `--force` menggunakan kembali target instalasi yang ada dan menimpa Plugin atau paket hook yang sudah terinstal di tempatnya. Gunakan saat Anda sengaja menginstal ulang id yang sama dari jalur lokal, arsip, paket ClawHub, atau artefak npm baru. Untuk peningkatan rutin Plugin npm yang sudah dilacak, utamakan `openclaw plugins update <id-or-npm-spec>`.

    Jika Anda menjalankan `plugins install` untuk id Plugin yang sudah terinstal, OpenClaw berhenti dan mengarahkan Anda ke `plugins update <id-or-npm-spec>` untuk peningkatan normal, atau ke `plugins install <package> --force` ketika Anda benar-benar ingin menimpa instalasi saat ini dari sumber berbeda.

  </Accordion>
  <Accordion title="Cakupan --pin">
    `--pin` hanya berlaku untuk instalasi npm. Ini tidak didukung dengan instalasi `git:`; gunakan ref git eksplisit seperti `git:github.com/acme/plugin@v1.2.3` ketika Anda menginginkan sumber yang dipin. Ini tidak didukung dengan `--marketplace`, karena instalasi marketplace mempertahankan metadata sumber marketplace, bukan spec npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` adalah opsi darurat untuk positif palsu dalam pemindai kode berbahaya bawaan. Opsi ini memungkinkan instalasi berlanjut meskipun pemindai bawaan melaporkan temuan `critical`, tetapi **tidak** melewati blok kebijakan hook `before_install` Plugin dan **tidak** melewati kegagalan pemindaian.

    Flag CLI ini berlaku untuk alur install/update Plugin. Instalasi dependensi Skills yang didukung Gateway menggunakan override permintaan `dangerouslyForceUnsafeInstall` yang sesuai, sementara `openclaw skills install` tetap menjadi alur unduh/install Skills ClawHub yang terpisah.

    Jika Plugin yang Anda terbitkan di ClawHub diblokir oleh pemindaian registry, gunakan langkah penerbit di [ClawHub](/id/tools/clawhub).

  </Accordion>
  <Accordion title="Paket hook dan spec npm">
    `plugins install` juga merupakan permukaan instalasi untuk paket hook yang mengekspos `openclaw.hooks` di `package.json`. Gunakan `openclaw hooks` untuk visibilitas hook yang difilter dan pengaktifan per hook, bukan instalasi paket.

    Spec npm bersifat **hanya registry** (nama paket + **versi persis** opsional atau **dist-tag**). Spec Git/URL/file dan rentang semver ditolak. Instalasi dependensi berjalan secara lokal proyek dengan `--ignore-scripts` demi keamanan, meskipun shell Anda memiliki pengaturan instalasi npm global. Root npm Plugin terkelola mewarisi `overrides` npm tingkat paket OpenClaw, sehingga pin keamanan host juga berlaku untuk dependensi Plugin yang di-hoist.

    Gunakan `npm:<package>` ketika Anda ingin membuat resolusi npm eksplisit. Spec paket polos juga langsung diinstal dari npm selama peralihan peluncuran.

    Spec polos dan `@latest` tetap berada di jalur stabil. Versi koreksi OpenClaw lama seperti `2026.5.3-1` masih diperlakukan sebagai rilis stabil untuk pemeriksaan ini agar paket lama tetap diperbarui dengan aman. Pekerjaan support-line bulanan baru direncanakan menggunakan nomor patch SemVer normal, bukan sufiks koreksi tanda hubung. Jika npm menyelesaikan spec default-line ke prerelease, OpenClaw berhenti dan meminta Anda untuk ikut serta secara eksplisit dengan tag prerelease seperti `@beta`/`@rc` atau versi prerelease persis seperti `@1.2.3-beta.4`.

    Jika spec instalasi polos cocok dengan id Plugin resmi (misalnya `diffs`), OpenClaw menginstal entri katalog secara langsung. Untuk menginstal paket npm dengan nama yang sama, gunakan spec scoped eksplisit (misalnya `@scope/diffs`).

  </Accordion>
  <Accordion title="Repositori Git">
    Gunakan `git:<repo>` untuk menginstal langsung dari repositori git. Bentuk yang didukung mencakup URL clone `git:github.com/owner/repo`, `git:owner/repo`, `https://` penuh, `ssh://`, `git://`, `file://`, dan `git@host:owner/repo.git`. Tambahkan `@<ref>` atau `#<ref>` untuk checkout branch, tag, atau commit sebelum instalasi.

    Instalasi Git melakukan clone ke direktori sementara, checkout ref yang diminta jika ada, lalu menggunakan penginstal direktori Plugin normal. Artinya validasi manifest, pemindaian kode berbahaya, pekerjaan instalasi package-manager, dan catatan instalasi berperilaku seperti instalasi npm. Instalasi git yang tercatat menyertakan URL/ref sumber beserta commit yang diselesaikan sehingga `openclaw plugins update` dapat menyelesaikan ulang sumber tersebut nanti.

    Setelah menginstal dari git, gunakan `openclaw plugins inspect <id> --runtime --json` untuk memverifikasi registrasi runtime seperti metode gateway dan perintah CLI. Jika Plugin mendaftarkan root CLI dengan `api.registerCli`, jalankan perintah itu langsung melalui CLI root OpenClaw, misalnya `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Arsip">
    Arsip yang didukung: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Arsip Plugin OpenClaw native harus berisi `openclaw.plugin.json` yang valid di root Plugin yang diekstrak; arsip yang hanya berisi `package.json` ditolak sebelum OpenClaw menulis catatan instalasi.

    Gunakan `npm-pack:<path.tgz>` ketika file tersebut adalah tarball npm-pack dan Anda ingin
    menguji jalur instalasi npm-root terkelola yang sama dengan yang digunakan oleh instalasi registry,
    termasuk verifikasi `package-lock.json`, pemindaian dependensi yang di-hoist, dan
    catatan instalasi npm. Jalur arsip polos tetap diinstal sebagai arsip lokal
    di bawah root ekstensi Plugin.

    Instalasi marketplace Claude juga didukung.

  </Accordion>
</AccordionGroup>

Instalasi ClawHub menggunakan locator `clawhub:<package>` eksplisit:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Spec Plugin yang aman untuk npm dan polos diinstal dari npm secara default selama peralihan peluncuran:

```bash
openclaw plugins install openclaw-codex-app-server
```

Gunakan `npm:` untuk membuat resolusi hanya npm eksplisit:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw memeriksa API plugin yang diiklankan / kompatibilitas Gateway minimum sebelum pemasangan. Ketika versi ClawHub yang dipilih menerbitkan artefak ClawPack, OpenClaw mengunduh `.tgz` npm-pack berversi, memverifikasi header digest ClawHub dan digest artefak, lalu memasangnya melalui jalur arsip normal. Versi ClawHub lama tanpa metadata ClawPack tetap dipasang melalui jalur verifikasi arsip paket lama. Pemasangan yang terekam menyimpan metadata sumber ClawHub, jenis artefak, integritas npm, shasum npm, nama tarball, dan fakta digest ClawPack untuk pembaruan nanti.
Pemasangan ClawHub tanpa versi menyimpan spesifikasi terekam tanpa versi sehingga `openclaw plugins update` dapat mengikuti rilis ClawHub yang lebih baru; pemilih versi atau tag eksplisit seperti `clawhub:pkg@1.2.3` dan `clawhub:pkg@beta` tetap dipin ke pemilih tersebut.

#### Singkatan marketplace

Gunakan singkatan `plugin@marketplace` ketika nama marketplace ada di cache registri lokal Claude pada `~/.claude/plugins/known_marketplaces.json`:

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
    Untuk marketplace jarak jauh yang dimuat dari GitHub atau git, entri plugin harus tetap berada di dalam repo marketplace yang dikloning. OpenClaw menerima sumber jalur relatif dari repo tersebut dan menolak sumber plugin HTTP(S), jalur absolut, git, GitHub, dan sumber plugin non-jalur lainnya dari manifes jarak jauh.
  </Tab>
</Tabs>

Untuk jalur lokal dan arsip, OpenClaw mendeteksi otomatis:

- plugin OpenClaw native (`openclaw.plugin.json`)
- bundle yang kompatibel dengan Codex (`.codex-plugin/plugin.json`)
- bundle yang kompatibel dengan Claude (`.claude-plugin/plugin.json` atau tata letak komponen Claude default)
- bundle yang kompatibel dengan Cursor (`.cursor-plugin/plugin.json`)

<Note>
Bundle kompatibel dipasang ke root plugin normal dan berpartisipasi dalam alur list/info/enable/disable yang sama. Saat ini, Skills bundle, command-skills Claude, default Claude `settings.json`, default Claude `.lsp.json` / `lspServers` yang dideklarasikan manifes, command-skills Cursor, dan direktori hook Codex yang kompatibel didukung; kapabilitas bundle lain yang terdeteksi ditampilkan di diagnostics/info tetapi belum dihubungkan ke eksekusi runtime.
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
  Beralih dari tampilan tabel ke baris detail per plugin dengan metadata source/origin/version/activation.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventaris yang dapat dibaca mesin ditambah diagnostik registri dan status pemasangan dependensi paket.
</ParamField>

<Note>
`plugins list` membaca registri plugin lokal yang dipersistensikan terlebih dahulu, dengan fallback turunan hanya-manifes ketika registri hilang atau tidak valid. Ini berguna untuk memeriksa apakah sebuah plugin terpasang, diaktifkan, dan terlihat oleh perencanaan startup dingin, tetapi ini bukan probe runtime langsung dari proses Gateway yang sudah berjalan. Setelah mengubah kode plugin, pengaktifan, kebijakan hook, atau `plugins.load.paths`, mulai ulang Gateway yang melayani channel sebelum mengharapkan kode `register(api)` baru atau hook berjalan. Untuk deployment jarak jauh/container, pastikan Anda memulai ulang child `openclaw gateway run` yang sebenarnya, bukan hanya proses wrapper.

`plugins list --json` menyertakan `dependencyStatus` setiap plugin dari `package.json`
`dependencies` dan `optionalDependencies`. OpenClaw memeriksa apakah nama paket tersebut ada di sepanjang jalur lookup Node `node_modules` normal milik plugin; ini tidak mengimpor kode runtime plugin, menjalankan package manager, atau memperbaiki dependensi yang hilang.
</Note>

`plugins search` adalah lookup katalog ClawHub jarak jauh. Ini tidak memeriksa status lokal, mengubah config, memasang paket, atau memuat kode runtime plugin. Hasil pencarian menyertakan nama paket ClawHub, family, channel, versi, ringkasan, dan petunjuk pemasangan seperti `openclaw plugins install clawhub:<package>`.

Untuk pekerjaan plugin bawaan di dalam image Docker terpaket, bind-mount direktori sumber plugin di atas jalur sumber terpaket yang sesuai, seperti `/app/extensions/synology-chat`. OpenClaw akan menemukan overlay sumber yang di-mount tersebut sebelum `/app/dist/extensions/synology-chat`; direktori sumber yang hanya disalin tetap inert sehingga pemasangan terpaket normal tetap menggunakan dist yang dikompilasi.

Untuk debugging hook runtime:

- `openclaw plugins inspect <id> --runtime --json` menampilkan hook terdaftar dan diagnostik dari pass inspeksi yang memuat modul. Inspeksi runtime tidak pernah memasang dependensi; gunakan `openclaw doctor --fix` untuk membersihkan status dependensi lama atau memulihkan plugin yang dapat diunduh yang hilang tetapi dirujuk oleh config.
- `openclaw gateway status --deep --require-rpc` mengonfirmasi Gateway yang dapat dijangkau, petunjuk layanan/proses, jalur config, dan kesehatan RPC.
- Hook percakapan non-bawaan (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) memerlukan `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Gunakan `--link` untuk menghindari penyalinan direktori lokal (menambahkan ke `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` tidak didukung dengan `--link` karena pemasangan tertaut menggunakan ulang jalur sumber alih-alih menyalin ke target pemasangan terkelola.

Gunakan `--pin` pada pemasangan npm untuk menyimpan spesifikasi eksak yang di-resolve (`name@version`) di indeks plugin terkelola sambil mempertahankan perilaku default tanpa pin.
</Note>

### Indeks Plugin

Metadata pemasangan plugin adalah status yang dikelola mesin, bukan config pengguna. Pemasangan dan pembaruan menuliskannya ke `plugins/installs.json` di bawah direktori status OpenClaw aktif. Map `installRecords` tingkat atasnya adalah sumber tahan lama untuk metadata pemasangan, termasuk record untuk manifes plugin yang rusak atau hilang. Array `plugins` adalah cache registri dingin turunan manifes. File ini menyertakan peringatan jangan-edit dan digunakan oleh `openclaw plugins update`, uninstall, diagnostik, dan registri plugin dingin.

Ketika OpenClaw melihat record `plugins.installs` lama yang dikirimkan dalam config, pembacaan runtime memperlakukannya sebagai input kompatibilitas tanpa menulis ulang `openclaw.json`. Penulisan plugin eksplisit dan `openclaw doctor --fix` memindahkan record tersebut ke indeks plugin dan menghapus kunci config ketika penulisan config diizinkan; jika salah satu penulisan gagal, record config dipertahankan agar metadata pemasangan tidak hilang.

### Uninstall

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` menghapus record plugin dari `plugins.entries`, indeks plugin yang dipersistensikan, entri daftar allow/deny plugin, dan entri `plugins.load.paths` tertaut jika berlaku. Kecuali `--keep-files` disetel, uninstall juga menghapus direktori pemasangan terkelola yang dilacak ketika berada di dalam root ekstensi plugin OpenClaw. Untuk plugin Active Memory, slot memori direset ke `memory-core`.

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

Pembaruan berlaku untuk pemasangan plugin yang dilacak di indeks plugin terkelola dan pemasangan hook-pack yang dilacak di `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Menyelesaikan id plugin vs spesifikasi npm">
    Ketika Anda meneruskan id plugin, OpenClaw menggunakan ulang spesifikasi pemasangan yang terekam untuk plugin tersebut. Artinya dist-tag yang sebelumnya disimpan seperti `@beta` dan versi eksak yang dipin terus digunakan pada eksekusi `update <id>` berikutnya.

    Untuk pemasangan npm, Anda juga dapat meneruskan spesifikasi paket npm eksplisit dengan dist-tag atau versi eksak. OpenClaw menyelesaikan nama paket tersebut kembali ke record plugin yang dilacak, memperbarui plugin terpasang itu, dan mencatat spesifikasi npm baru untuk pembaruan berbasis id di masa mendatang.

    Meneruskan nama paket npm tanpa versi atau tag juga diselesaikan kembali ke record plugin yang dilacak. Gunakan ini ketika sebuah plugin dipin ke versi eksak dan Anda ingin memindahkannya kembali ke lini rilis default registri.

  </Accordion>
  <Accordion title="Pembaruan channel beta">
    `openclaw plugins update` menggunakan ulang spesifikasi plugin yang dilacak kecuali Anda meneruskan spesifikasi baru. `openclaw update` juga mengetahui channel pembaruan OpenClaw aktif: pada channel beta, record plugin npm dan ClawHub lini default mencoba `@beta` terlebih dahulu, lalu fallback ke spesifikasi default/latest yang terekam jika tidak ada rilis beta plugin. Versi eksak dan tag eksplisit tetap dipin ke pemilih tersebut.

    OpenClaw belum mengekspos channel plugin dukungan LTS atau bulanan. Pekerjaan lini dukungan yang direncanakan akan memerlukan tag paket plugin dan ClawHub untuk mengikuti lini dukungan yang sama dengan paket inti.

  </Accordion>
  <Accordion title="Pemeriksaan versi dan drift integritas">
    Sebelum pembaruan npm langsung, OpenClaw memeriksa versi paket terpasang terhadap metadata registri npm. Jika versi terpasang dan identitas artefak yang terekam sudah cocok dengan target yang di-resolve, pembaruan dilewati tanpa mengunduh, memasang ulang, atau menulis ulang `openclaw.json`.

    Ketika hash integritas tersimpan ada dan hash artefak yang diambil berubah, OpenClaw memperlakukannya sebagai drift artefak npm. Perintah interaktif `openclaw plugins update` mencetak hash yang diharapkan dan aktual serta meminta konfirmasi sebelum melanjutkan. Helper pembaruan non-interaktif gagal tertutup kecuali pemanggil menyediakan kebijakan kelanjutan eksplisit.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install pada pembaruan">
    `--dangerously-force-unsafe-install` juga tersedia pada `plugins update` sebagai override darurat untuk false positive pemindaian kode berbahaya bawaan selama pembaruan plugin. Ini tetap tidak melewati blok kebijakan `before_install` plugin atau pemblokiran kegagalan pemindaian, dan hanya berlaku untuk pembaruan plugin, bukan pembaruan hook-pack.
  </Accordion>
</AccordionGroup>

### Inspeksi

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect menampilkan identitas, status pemuatan, sumber, kapabilitas manifes, flag kebijakan, diagnostik, metadata pemasangan, kapabilitas bundle, dan dukungan server MCP atau LSP yang terdeteksi tanpa mengimpor runtime plugin secara default. Tambahkan `--runtime` untuk memuat modul plugin dan menyertakan hook, tools, commands, services, metode Gateway, dan route HTTP yang terdaftar. Inspeksi runtime melaporkan dependensi plugin yang hilang secara langsung; pemasangan dan perbaikan tetap berada di `openclaw plugins install`, `openclaw plugins update`, dan `openclaw doctor --fix`.

Perintah CLI milik plugin dipasang sebagai grup perintah root `openclaw`. Setelah `inspect --runtime` menampilkan perintah di bawah `cliCommands`, jalankan sebagai `openclaw <command> ...`; misalnya plugin yang mendaftarkan `demo-git` dapat diverifikasi dengan `openclaw demo-git ping`.

Setiap plugin diklasifikasikan berdasarkan apa yang benar-benar didaftarkannya pada runtime:

- **plain-capability** — satu jenis kapabilitas (mis. Plugin yang hanya berupa penyedia)
- **hybrid-capability** — beberapa jenis kapabilitas (mis. teks + ucapan + gambar)
- **hook-only** — hanya hook, tanpa kapabilitas atau permukaan
- **non-capability** — alat/perintah/layanan tetapi tanpa kapabilitas

Lihat [Bentuk Plugin](/id/plugins/architecture#plugin-shapes) untuk informasi lebih lanjut tentang model kapabilitas.

<Note>
Flag `--json` menghasilkan laporan yang dapat dibaca mesin dan cocok untuk skrip serta audit. `inspect --all` merender tabel seluruh armada dengan kolom bentuk, jenis kapabilitas, pemberitahuan kompatibilitas, kapabilitas bundel, dan ringkasan hook. `info` adalah alias untuk `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` melaporkan kesalahan pemuatan Plugin, diagnostik manifes/penemuan, dan pemberitahuan kompatibilitas. Ketika semuanya bersih, perintah ini mencetak `No plugin issues detected.`

Jika Plugin yang dikonfigurasi ada di disk tetapi diblokir oleh pemeriksaan keamanan jalur milik pemuat, validasi konfigurasi mempertahankan entri Plugin dan melaporkannya sebagai `present but blocked`. Perbaiki diagnostik Plugin yang diblokir sebelumnya, seperti kepemilikan jalur atau izin world-writable, alih-alih menghapus konfigurasi `plugins.entries.<id>` atau `plugins.allow`.

Untuk kegagalan bentuk modul seperti ekspor `register`/`activate` yang hilang, jalankan ulang dengan `OPENCLAW_PLUGIN_LOAD_DEBUG=1` untuk menyertakan ringkasan bentuk ekspor yang ringkas dalam output diagnostik.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Registry Plugin lokal adalah model baca dingin tersimpan OpenClaw untuk identitas Plugin yang terinstal, status pengaktifan, metadata sumber, dan kepemilikan kontribusi. Startup normal, pencarian pemilik penyedia, klasifikasi penyiapan kanal, dan inventaris Plugin dapat membacanya tanpa mengimpor modul runtime Plugin.

Gunakan `plugins registry` untuk memeriksa apakah registry tersimpan ada, mutakhir, atau usang. Gunakan `--refresh` untuk membangunnya ulang dari indeks Plugin tersimpan, kebijakan konfigurasi, dan metadata manifes/paket. Ini adalah jalur perbaikan, bukan jalur aktivasi runtime.

`openclaw doctor --fix` juga memperbaiki drift npm terkelola yang berdekatan dengan registry: jika paket `@openclaw/*` yatim atau dipulihkan di bawah root npm Plugin terkelola membayangi Plugin bawaan, doctor menghapus paket usang tersebut dan membangun ulang registry sehingga startup memvalidasi terhadap manifes bawaan.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` adalah sakelar kompatibilitas darurat yang sudah tidak digunakan lagi untuk kegagalan pembacaan registry. Utamakan `plugins registry --refresh` atau `openclaw doctor --fix`; fallback env hanya untuk pemulihan startup darurat selama migrasi diluncurkan.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Daftar Marketplace menerima jalur marketplace lokal, jalur `marketplace.json`, singkatan GitHub seperti `owner/repo`, URL repo GitHub, atau URL git. `--json` mencetak label sumber yang diselesaikan beserta manifes marketplace yang diurai dan entri Plugin.

## Terkait

- [Membangun Plugin](/id/plugins/building-plugins)
- [Referensi CLI](/id/cli)
- [Plugin komunitas](/id/plugins/community)
