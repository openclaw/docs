---
read_when:
    - Anda ingin menginstal atau mengelola Plugin Gateway atau bundel yang kompatibel
    - Anda ingin men-debug kegagalan pemuatan Plugin
sidebarTitle: Plugins
summary: Referensi CLI untuk `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-05-10T19:29:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: c6afa3ff12b3672d321d16c831672340ccde70b153671f2c328f578b5c66348b
    source_path: cli/plugins.md
    workflow: 16
---

Kelola Plugin Gateway, paket hook, dan bundel yang kompatibel.

<CardGroup cols={2}>
  <Card title="Plugin system" href="/id/tools/plugin">
    Panduan pengguna akhir untuk memasang, mengaktifkan, dan memecahkan masalah plugin.
  </Card>
  <Card title="Manage plugins" href="/id/plugins/manage-plugins">
    Contoh cepat untuk memasang, mencantumkan, memperbarui, menghapus pemasangan, dan menerbitkan.
  </Card>
  <Card title="Plugin bundles" href="/id/plugins/bundles">
    Model kompatibilitas bundel.
  </Card>
  <Card title="Plugin manifest" href="/id/plugins/manifest">
    Kolom manifes dan skema konfigurasi.
  </Card>
  <Card title="Security" href="/id/gateway/security">
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

Untuk investigasi pemasangan, pemeriksaan, penghapusan pemasangan, atau penyegaran registri yang lambat, jalankan
perintah dengan `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Trace menulis waktu fase
ke stderr dan menjaga output JSON tetap dapat diurai. Lihat [Debugging](/id/help/debugging#plugin-lifecycle-trace).

<Note>
Dalam mode Nix (`OPENCLAW_NIX_MODE=1`), mutator siklus hidup plugin dinonaktifkan. Gunakan sumber Nix untuk pemasangan ini, bukan `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable`, atau `plugins disable`; untuk nix-openclaw, gunakan [Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) yang mengutamakan agen.
</Note>

<Note>
Plugin bawaan dikirim bersama OpenClaw. Beberapa diaktifkan secara default (misalnya penyedia model bawaan, penyedia ucapan bawaan, dan plugin browser bawaan); yang lain memerlukan `plugins enable`.

Plugin OpenClaw native harus mengirimkan `openclaw.plugin.json` dengan JSON Schema inline (`configSchema`, meskipun kosong). Bundel yang kompatibel menggunakan manifes bundelnya sendiri.

`plugins list` menampilkan `Format: openclaw` atau `Format: bundle`. Output daftar/info verbose juga menampilkan subtipe bundel (`codex`, `claude`, atau `cursor`) beserta kemampuan bundel yang terdeteksi.
</Note>

### Pasang

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

Maintainer yang menguji pemasangan pada waktu penyiapan dapat menimpa sumber pemasangan plugin otomatis
dengan variabel lingkungan yang dijaga. Lihat
[Penimpaan pemasangan plugin](/id/plugins/install-overrides).

<Warning>
Nama paket polos dipasang dari npm secara default selama transisi peluncuran. Gunakan `clawhub:<package>` untuk ClawHub. Perlakukan pemasangan plugin seperti menjalankan kode. Utamakan versi yang dipin.
</Warning>

`plugins search` mengueri ClawHub untuk paket plugin yang dapat dipasang dan mencetak
nama paket siap pasang. Ini mencari paket code-plugin dan bundle-plugin,
bukan skills. Gunakan `openclaw skills search` untuk Skills ClawHub.

<Note>
ClawHub adalah permukaan distribusi dan penemuan utama untuk sebagian besar plugin. Npm
tetap menjadi fallback yang didukung dan jalur pemasangan langsung. Paket plugin
`@openclaw/*` milik OpenClaw diterbitkan di npm lagi; lihat daftar saat ini
di [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) atau
[inventaris plugin](/id/plugins/plugin-inventory). Pemasangan stabil menggunakan `latest`.
Pemasangan dan pembaruan kanal beta mengutamakan dist-tag npm `beta` jika tag tersebut
tersedia, lalu fallback ke `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Config includes and invalid-config repair">
    Jika bagian `plugins` Anda didukung oleh `$include` satu file, `plugins install/update/enable/disable/uninstall` menulis langsung ke file yang diikutsertakan tersebut dan membiarkan `openclaw.json` tidak tersentuh. Include root, array include, dan include dengan override saudara gagal secara tertutup alih-alih diratakan. Lihat [Include konfigurasi](/id/gateway/configuration) untuk bentuk yang didukung.

    Jika konfigurasi tidak valid saat pemasangan, `plugins install` biasanya gagal secara tertutup dan meminta Anda menjalankan `openclaw doctor --fix` terlebih dahulu. Selama startup Gateway dan hot reload, konfigurasi plugin yang tidak valid gagal secara tertutup seperti konfigurasi tidak valid lainnya; `openclaw doctor --fix` dapat mengarantina entri plugin yang tidak valid. Satu-satunya pengecualian waktu pemasangan yang terdokumentasi adalah jalur pemulihan plugin bawaan yang sempit untuk plugin yang secara eksplisit memilih ikut `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force and reinstall vs update">
    `--force` menggunakan kembali target pemasangan yang ada dan menimpa plugin atau paket hook yang sudah terpasang di tempatnya. Gunakan ini ketika Anda sengaja memasang ulang id yang sama dari jalur lokal, arsip, paket ClawHub, atau artefak npm baru. Untuk upgrade rutin plugin npm yang sudah dilacak, utamakan `openclaw plugins update <id-or-npm-spec>`.

    Jika Anda menjalankan `plugins install` untuk id plugin yang sudah terpasang, OpenClaw berhenti dan mengarahkan Anda ke `plugins update <id-or-npm-spec>` untuk upgrade normal, atau ke `plugins install <package> --force` ketika Anda benar-benar ingin menimpa pemasangan saat ini dari sumber berbeda.

  </Accordion>
  <Accordion title="--pin scope">
    `--pin` hanya berlaku untuk pemasangan npm. Ini tidak didukung dengan pemasangan `git:`; gunakan ref git eksplisit seperti `git:github.com/acme/plugin@v1.2.3` ketika Anda menginginkan sumber yang dipin. Ini tidak didukung dengan `--marketplace`, karena pemasangan marketplace mempertahankan metadata sumber marketplace, bukan spec npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` adalah opsi darurat untuk false positive di pemindai kode berbahaya bawaan. Ini memungkinkan pemasangan berlanjut bahkan ketika pemindai bawaan melaporkan temuan `critical`, tetapi ini **tidak** melewati blok kebijakan hook `before_install` plugin dan **tidak** melewati kegagalan pemindaian.

    Flag CLI ini berlaku untuk alur pemasangan/pembaruan plugin. Pemasangan dependensi skill yang didukung Gateway menggunakan override permintaan `dangerouslyForceUnsafeInstall` yang sesuai, sementara `openclaw skills install` tetap menjadi alur unduh/pasang skill ClawHub yang terpisah.

    Jika plugin yang Anda terbitkan di ClawHub diblokir oleh pemindaian registri, gunakan langkah penerbit di [ClawHub](/id/clawhub/security).

  </Accordion>
  <Accordion title="Hook packs and npm specs">
    `plugins install` juga merupakan permukaan pemasangan untuk paket hook yang mengekspos `openclaw.hooks` di `package.json`. Gunakan `openclaw hooks` untuk visibilitas hook terfilter dan pengaktifan per hook, bukan pemasangan paket.

    Spec npm bersifat **hanya registri** (nama paket + **versi persis** opsional atau **dist-tag**). Spec Git/URL/file dan rentang semver ditolak. Pemasangan dependensi berjalan lokal proyek dengan `--ignore-scripts` demi keamanan, bahkan ketika shell Anda memiliki pengaturan pemasangan npm global. Root npm plugin terkelola mewarisi `overrides` npm tingkat paket OpenClaw, sehingga pin keamanan host juga berlaku untuk dependensi plugin yang dihoist.

    Gunakan `npm:<package>` ketika Anda ingin membuat resolusi npm eksplisit. Spec paket polos juga dipasang langsung dari npm selama transisi peluncuran.

    Spec polos dan `@latest` tetap berada di jalur stabil. Versi koreksi bertanggal OpenClaw seperti `2026.5.3-1` adalah rilis stabil untuk pemeriksaan ini. Jika npm menyelesaikan salah satunya menjadi prarilis, OpenClaw berhenti dan meminta Anda memilih ikut secara eksplisit dengan tag prarilis seperti `@beta`/`@rc` atau versi prarilis persis seperti `@1.2.3-beta.4`.

    Jika spec pemasangan polos cocok dengan id plugin resmi (misalnya `diffs`), OpenClaw memasang entri katalog secara langsung. Untuk memasang paket npm dengan nama yang sama, gunakan spec scoped eksplisit (misalnya `@scope/diffs`).

  </Accordion>
  <Accordion title="Git repositories">
    Gunakan `git:<repo>` untuk memasang langsung dari repositori git. Bentuk yang didukung mencakup URL clone `git:github.com/owner/repo`, `git:owner/repo`, `https://` penuh, `ssh://`, `git://`, `file://`, dan `git@host:owner/repo.git`. Tambahkan `@<ref>` atau `#<ref>` untuk checkout branch, tag, atau commit sebelum pemasangan.

    Pemasangan Git melakukan clone ke direktori sementara, checkout ref yang diminta jika ada, lalu menggunakan installer direktori plugin normal. Artinya validasi manifes, pemindaian kode berbahaya, pekerjaan pemasangan package-manager, dan catatan pemasangan berperilaku seperti pemasangan npm. Pemasangan git yang direkam mencakup URL/ref sumber plus commit yang terselesaikan sehingga `openclaw plugins update` dapat menyelesaikan ulang sumbernya nanti.

    Setelah memasang dari git, gunakan `openclaw plugins inspect <id> --runtime --json` untuk memverifikasi registrasi runtime seperti metode Gateway dan perintah CLI. Jika plugin mendaftarkan root CLI dengan `api.registerCli`, jalankan perintah tersebut langsung melalui CLI root OpenClaw, misalnya `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archives">
    Arsip yang didukung: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Arsip plugin OpenClaw native harus berisi `openclaw.plugin.json` yang valid di root plugin hasil ekstraksi; arsip yang hanya berisi `package.json` ditolak sebelum OpenClaw menulis catatan pemasangan.

    Gunakan `npm-pack:<path.tgz>` ketika file tersebut adalah tarball npm-pack dan Anda ingin
    menguji jalur pemasangan root npm terkelola yang sama dengan yang digunakan pemasangan registri,
    termasuk verifikasi `package-lock.json`, pemindaian dependensi yang dihoist, dan
    catatan pemasangan npm. Jalur arsip biasa tetap dipasang sebagai arsip lokal
    di bawah root ekstensi plugin.

    Pemasangan marketplace Claude juga didukung.

  </Accordion>
</AccordionGroup>

Pemasangan ClawHub menggunakan locator `clawhub:<package>` eksplisit:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Spec plugin yang aman untuk npm dan polos dipasang dari npm secara default selama transisi peluncuran:

```bash
openclaw plugins install openclaw-codex-app-server
```

Gunakan `npm:` untuk membuat resolusi khusus npm eksplisit:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw memeriksa API Plugin yang diiklankan / kompatibilitas Gateway minimum sebelum instalasi. Ketika versi ClawHub yang dipilih menerbitkan artefak ClawPack, OpenClaw mengunduh `.tgz` npm-pack berversi, memverifikasi header digest ClawHub dan digest artefak, lalu menginstalnya melalui jalur arsip normal. Versi ClawHub yang lebih lama tanpa metadata ClawPack tetap diinstal melalui jalur verifikasi arsip paket lama. Instalasi yang tercatat menyimpan metadata sumber ClawHub, jenis artefak, integritas npm, shasum npm, nama tarball, dan fakta digest ClawPack untuk pembaruan nanti.
Instalasi ClawHub tanpa versi menyimpan spesifikasi tercatat tanpa versi sehingga `openclaw plugins update` dapat mengikuti rilis ClawHub yang lebih baru; pemilih versi atau tag eksplisit seperti `clawhub:pkg@1.2.3` dan `clawhub:pkg@beta` tetap dipin ke pemilih tersebut.

#### Singkatan marketplace

Gunakan singkatan `plugin@marketplace` ketika nama marketplace ada di cache registri lokal Claude di `~/.claude/plugins/known_marketplaces.json`:

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
    - nama marketplace yang dikenal Claude dari `~/.claude/plugins/known_marketplaces.json`
    - root marketplace lokal atau path `marketplace.json`
    - singkatan repo GitHub seperti `owner/repo`
    - URL repo GitHub seperti `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="Remote marketplace rules">
    Untuk marketplace jarak jauh yang dimuat dari GitHub atau git, entri Plugin harus tetap berada di dalam repo marketplace hasil kloning. OpenClaw menerima sumber path relatif dari repo tersebut dan menolak sumber Plugin HTTP(S), path absolut, git, GitHub, dan sumber Plugin non-path lainnya dari manifes jarak jauh.
  </Tab>
</Tabs>

Untuk path lokal dan arsip, OpenClaw mendeteksi otomatis:

- Plugin OpenClaw native (`openclaw.plugin.json`)
- bundle yang kompatibel dengan Codex (`.codex-plugin/plugin.json`)
- bundle yang kompatibel dengan Claude (`.claude-plugin/plugin.json` atau tata letak komponen Claude default)
- bundle yang kompatibel dengan Cursor (`.cursor-plugin/plugin.json`)

<Note>
Bundle yang kompatibel diinstal ke root Plugin normal dan ikut serta dalam alur list/info/enable/disable yang sama. Saat ini, bundle skills, command-skills Claude, default `settings.json` Claude, default `.lsp.json` Claude / `lspServers` yang dideklarasikan manifes, command-skills Cursor, dan direktori hook Codex yang kompatibel didukung; kemampuan bundle lain yang terdeteksi ditampilkan dalam diagnostik/info tetapi belum dihubungkan ke eksekusi runtime.
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
  Inventaris yang dapat dibaca mesin plus diagnostik registri dan status instalasi dependensi paket.
</ParamField>

<Note>
`plugins list` membaca registri Plugin lokal yang dipertahankan terlebih dahulu, dengan fallback turunan hanya-manifes ketika registri hilang atau tidak valid. Ini berguna untuk memeriksa apakah sebuah Plugin terinstal, aktif, dan terlihat oleh perencanaan startup dingin, tetapi ini bukan probe runtime langsung terhadap proses Gateway yang sudah berjalan. Setelah mengubah kode Plugin, enablement, kebijakan hook, atau `plugins.load.paths`, mulai ulang Gateway yang melayani channel sebelum mengharapkan kode `register(api)` atau hook baru berjalan. Untuk deployment jarak jauh/container, verifikasi bahwa Anda memulai ulang child `openclaw gateway run` yang sebenarnya, bukan hanya proses wrapper.

`plugins list --json` menyertakan `dependencyStatus` tiap Plugin dari `package.json`
`dependencies` dan `optionalDependencies`. OpenClaw memeriksa apakah nama paket tersebut ada di sepanjang path lookup `node_modules` Node normal milik Plugin; OpenClaw tidak mengimpor kode runtime Plugin, menjalankan package manager, atau memperbaiki dependensi yang hilang.
</Note>

`plugins search` adalah lookup katalog ClawHub jarak jauh. Perintah ini tidak memeriksa state lokal, mengubah konfigurasi, menginstal paket, atau memuat kode runtime Plugin. Hasil pencarian mencakup nama paket ClawHub, family, channel, versi, ringkasan, dan petunjuk instalasi seperti `openclaw plugins install clawhub:<package>`.

Untuk pekerjaan Plugin bawaan di dalam image Docker terpaket, bind-mount direktori sumber Plugin di atas path sumber terpaket yang sesuai, seperti `/app/extensions/synology-chat`. OpenClaw akan menemukan overlay sumber yang di-mount tersebut sebelum `/app/dist/extensions/synology-chat`; direktori sumber yang hanya disalin tetap tidak aktif sehingga instalasi terpaket normal tetap memakai dist yang sudah dikompilasi.

Untuk debugging hook runtime:

- `openclaw plugins inspect <id> --runtime --json` menampilkan hook terdaftar dan diagnostik dari pass inspeksi yang memuat modul. Inspeksi runtime tidak pernah menginstal dependensi; gunakan `openclaw doctor --fix` untuk membersihkan state dependensi lama atau memulihkan Plugin unduhan yang hilang yang dirujuk oleh konfigurasi.
- `openclaw gateway status --deep --require-rpc` mengonfirmasi Gateway yang dapat dijangkau, petunjuk service/proses, path konfigurasi, dan kesehatan RPC.
- Hook percakapan non-bawaan (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) memerlukan `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Gunakan `--link` untuk menghindari penyalinan direktori lokal (menambahkan ke `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` tidak didukung bersama `--link` karena instalasi tertaut menggunakan ulang path sumber alih-alih menyalin ke target instalasi terkelola.

Gunakan `--pin` pada instalasi npm untuk menyimpan spesifikasi persis yang di-resolve (`name@version`) dalam indeks Plugin terkelola sambil mempertahankan perilaku default tanpa pin.
</Note>

### Indeks Plugin

Metadata instalasi Plugin adalah state yang dikelola mesin, bukan konfigurasi pengguna. Instalasi dan pembaruan menuliskannya ke `plugins/installs.json` di bawah direktori state OpenClaw yang aktif. Map `installRecords` tingkat atasnya adalah sumber metadata instalasi yang tahan lama, termasuk record untuk manifes Plugin yang rusak atau hilang. Array `plugins` adalah cache registri dingin turunan manifes. File ini menyertakan peringatan jangan-diedit dan digunakan oleh `openclaw plugins update`, uninstall, diagnostik, dan registri Plugin dingin.

Ketika OpenClaw melihat record `plugins.installs` lama yang dikirim dalam konfigurasi, pembacaan runtime memperlakukannya sebagai input kompatibilitas tanpa menulis ulang `openclaw.json`. Penulisan Plugin eksplisit dan `openclaw doctor --fix` memindahkan record tersebut ke indeks Plugin dan menghapus key konfigurasi ketika penulisan konfigurasi diizinkan; jika salah satu penulisan gagal, record konfigurasi dipertahankan agar metadata instalasi tidak hilang.

### Uninstall

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` menghapus record Plugin dari `plugins.entries`, indeks Plugin yang dipertahankan, entri daftar allow/deny Plugin, dan entri `plugins.load.paths` tertaut jika berlaku. Kecuali `--keep-files` ditetapkan, uninstall juga menghapus direktori instalasi terkelola yang dilacak ketika berada di dalam root ekstensi Plugin OpenClaw. Untuk Plugin active memory, slot memori direset ke `memory-core`.

<Note>
`--keep-config` didukung sebagai alias deprecated untuk `--keep-files`.
</Note>

### Perbarui

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Pembaruan berlaku untuk instalasi Plugin yang dilacak dalam indeks Plugin terkelola dan instalasi hook-pack yang dilacak di `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Resolving plugin id vs npm spec">
    Ketika Anda meneruskan id Plugin, OpenClaw menggunakan ulang spesifikasi instalasi yang tercatat untuk Plugin tersebut. Artinya dist-tag yang sebelumnya disimpan seperti `@beta` dan versi terpin persis terus digunakan pada eksekusi `update <id>` berikutnya.

    Untuk instalasi npm, Anda juga dapat meneruskan spesifikasi paket npm eksplisit dengan dist-tag atau versi persis. OpenClaw me-resolve nama paket tersebut kembali ke record Plugin yang dilacak, memperbarui Plugin terinstal itu, dan mencatat spesifikasi npm baru untuk pembaruan berbasis id di masa mendatang.

    Meneruskan nama paket npm tanpa versi atau tag juga me-resolve kembali ke record Plugin yang dilacak. Gunakan ini ketika sebuah Plugin dipin ke versi persis dan Anda ingin memindahkannya kembali ke lini rilis default registri.

  </Accordion>
  <Accordion title="Beta channel updates">
    `openclaw plugins update` menggunakan ulang spesifikasi Plugin yang dilacak kecuali Anda meneruskan spesifikasi baru. `openclaw update` juga mengetahui channel pembaruan OpenClaw yang aktif: pada channel beta, record Plugin npm dan ClawHub lini default mencoba `@beta` terlebih dahulu, lalu fallback ke spesifikasi default/latest yang tercatat jika tidak ada rilis beta Plugin. Versi persis dan tag eksplisit tetap dipin ke pemilih tersebut.

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    Sebelum pembaruan npm langsung, OpenClaw memeriksa versi paket yang terinstal terhadap metadata registri npm. Jika versi terinstal dan identitas artefak tercatat sudah cocok dengan target yang di-resolve, pembaruan dilewati tanpa mengunduh, menginstal ulang, atau menulis ulang `openclaw.json`.

    Ketika hash integritas yang tersimpan ada dan hash artefak yang diambil berubah, OpenClaw memperlakukannya sebagai drift artefak npm. Perintah interaktif `openclaw plugins update` mencetak hash yang diharapkan dan aktual serta meminta konfirmasi sebelum melanjutkan. Helper pembaruan noninteraktif gagal tertutup kecuali pemanggil menyediakan kebijakan kelanjutan eksplisit.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install` juga tersedia pada `plugins update` sebagai override darurat untuk false positive pemindaian dangerous-code bawaan selama pembaruan Plugin. Ini tetap tidak melewati blok kebijakan `before_install` Plugin atau pemblokiran kegagalan pemindaian, dan hanya berlaku untuk pembaruan Plugin, bukan pembaruan hook-pack.
  </Accordion>
</AccordionGroup>

### Inspeksi

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect menampilkan identitas, status pemuatan, sumber, kemampuan manifes, flag kebijakan, diagnostik, metadata instalasi, kemampuan bundle, dan dukungan server MCP atau LSP yang terdeteksi tanpa mengimpor runtime Plugin secara default. Tambahkan `--runtime` untuk memuat modul Plugin dan menyertakan hook, tools, commands, services, method Gateway, dan route HTTP yang terdaftar. Inspeksi runtime melaporkan dependensi Plugin yang hilang secara langsung; instalasi dan perbaikan tetap berada di `openclaw plugins install`, `openclaw plugins update`, dan `openclaw doctor --fix`.

Command CLI milik Plugin biasanya diinstal sebagai grup command root `openclaw`, tetapi Plugin juga dapat mendaftarkan command bertingkat di bawah parent core seperti `openclaw nodes`. Setelah `inspect --runtime` menampilkan command di bawah `cliCommands`, jalankan pada path yang tercantum; misalnya Plugin yang mendaftarkan `demo-git` dapat diverifikasi dengan `openclaw demo-git ping`.

Setiap Plugin diklasifikasikan berdasarkan apa yang benar-benar didaftarkannya saat runtime:

- **plain-capability** — satu jenis kemampuan (misalnya Plugin khusus penyedia)
- **hybrid-capability** — beberapa jenis kemampuan (misalnya teks + ucapan + gambar)
- **hook-only** — hanya hook, tanpa kemampuan atau permukaan
- **non-capability** — alat/perintah/layanan tetapi tanpa kemampuan

Lihat [Bentuk Plugin](/id/plugins/architecture#plugin-shapes) untuk informasi lebih lanjut tentang model kemampuan.

<Note>
Flag `--json` menghasilkan laporan yang dapat dibaca mesin dan cocok untuk skrip serta audit. `inspect --all` merender tabel seluruh armada dengan kolom bentuk, jenis kemampuan, pemberitahuan kompatibilitas, kemampuan bundel, dan ringkasan hook. `info` adalah alias untuk `inspect`.
</Note>

### Diagnostik

```bash
openclaw plugins doctor
```

`doctor` melaporkan kesalahan pemuatan Plugin, diagnostik manifes/penemuan, dan pemberitahuan kompatibilitas. Ketika semuanya bersih, perintah ini mencetak `No plugin issues detected.`

Jika Plugin yang dikonfigurasi ada di disk tetapi diblokir oleh pemeriksaan keamanan path milik loader, validasi konfigurasi mempertahankan entri Plugin dan melaporkannya sebagai `present but blocked`. Perbaiki diagnostik Plugin yang diblokir sebelumnya, seperti kepemilikan path atau izin world-writable, alih-alih menghapus konfigurasi `plugins.entries.<id>` atau `plugins.allow`.

Untuk kegagalan bentuk modul seperti ekspor `register`/`activate` yang hilang, jalankan ulang dengan `OPENCLAW_PLUGIN_LOAD_DEBUG=1` untuk menyertakan ringkasan bentuk ekspor yang ringkas dalam output diagnostik.

### Registri

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Registri Plugin lokal adalah model baca dingin persisten OpenClaw untuk identitas Plugin yang terinstal, pengaktifan, metadata sumber, dan kepemilikan kontribusi. Startup normal, pencarian pemilik penyedia, klasifikasi penyiapan kanal, dan inventaris Plugin dapat membacanya tanpa mengimpor modul runtime Plugin.

Gunakan `plugins registry` untuk memeriksa apakah registri persisten tersedia, terkini, atau usang. Gunakan `--refresh` untuk membangunnya ulang dari indeks Plugin persisten, kebijakan konfigurasi, dan metadata manifes/paket. Ini adalah jalur perbaikan, bukan jalur aktivasi runtime.

`openclaw doctor --fix` juga memperbaiki drift npm terkelola yang berdekatan dengan registri: jika paket `@openclaw/*` yatim atau dipulihkan di bawah root npm Plugin terkelola membayangi Plugin bundel, doctor menghapus paket usang tersebut dan membangun ulang registri sehingga startup memvalidasi terhadap manifes bundel.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` adalah sakelar kompatibilitas darurat yang sudah deprecated untuk kegagalan baca registri. Utamakan `plugins registry --refresh` atau `openclaw doctor --fix`; fallback env hanya untuk pemulihan startup darurat sementara migrasi diluncurkan.
</Warning>

### Lokapasar

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Daftar lokapasar menerima path lokapasar lokal, path `marketplace.json`, singkatan GitHub seperti `owner/repo`, URL repo GitHub, atau URL git. `--json` mencetak label sumber yang diselesaikan beserta manifes lokapasar yang diurai dan entri Plugin.

## Terkait

- [Membangun Plugin](/id/plugins/building-plugins)
- [Referensi CLI](/id/cli)
- [ClawHub](/id/clawhub)
