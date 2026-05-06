---
read_when:
    - Anda ingin memasang atau mengelola Plugin Gateway atau bundle yang kompatibel
    - Anda ingin men-debug kegagalan pemuatan Plugin
sidebarTitle: Plugins
summary: Referensi CLI untuk `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-05-06T17:54:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 734366b6bbee5f036fdc2cfac5197ae86d2e8fbc7c977ccc4e22add2f4206951
    source_path: cli/plugins.md
    workflow: 16
---

Kelola Plugin Gateway, paket hook, dan bundel yang kompatibel.

<CardGroup cols={2}>
  <Card title="Sistem Plugin" href="/id/tools/plugin">
    Panduan pengguna akhir untuk menginstal, mengaktifkan, dan memecahkan masalah plugin.
  </Card>
  <Card title="Kelola plugin" href="/id/plugins/manage-plugins">
    Contoh cepat untuk instal, daftar, pembaruan, hapus instalasi, dan publikasi.
  </Card>
  <Card title="Bundel Plugin" href="/id/plugins/bundles">
    Model kompatibilitas bundel.
  </Card>
  <Card title="Manifest Plugin" href="/id/plugins/manifest">
    Kolom manifest dan skema konfigurasi.
  </Card>
  <Card title="Keamanan" href="/id/gateway/security">
    Pengerasan keamanan untuk instalasi plugin.
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

Untuk investigasi instalasi, inspeksi, hapus instalasi, atau penyegaran registri yang lambat, jalankan
perintah dengan `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Jejak menulis pengaturan waktu fase
ke stderr dan menjaga keluaran JSON tetap dapat diurai. Lihat [Debugging](/id/help/debugging#plugin-lifecycle-trace).

<Note>
Dalam mode Nix (`OPENCLAW_NIX_MODE=1`), pengubah siklus hidup plugin dinonaktifkan. Gunakan sumber Nix untuk instalasi ini sebagai pengganti `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable`, atau `plugins disable`; untuk nix-openclaw, gunakan [Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) yang mengutamakan agen.
</Note>

<Note>
Plugin bawaan dikirim bersama OpenClaw. Beberapa diaktifkan secara default (misalnya penyedia model bawaan, penyedia ucapan bawaan, dan plugin browser bawaan); yang lain memerlukan `plugins enable`.

Plugin OpenClaw native harus mengirimkan `openclaw.plugin.json` dengan JSON Schema inline (`configSchema`, sekalipun kosong). Bundel yang kompatibel menggunakan manifest bundelnya sendiri sebagai gantinya.

`plugins list` menampilkan `Format: openclaw` atau `Format: bundle`. Keluaran daftar/info verbose juga menampilkan subtipe bundel (`codex`, `claude`, atau `cursor`) beserta kapabilitas bundel yang terdeteksi.
</Note>

### Instal

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
Nama paket polos menginstal dari npm secara default selama peralihan peluncuran. Gunakan `clawhub:<package>` untuk ClawHub. Perlakukan instalasi plugin seperti menjalankan kode. Utamakan versi yang dipin.
</Warning>

`plugins search` meminta ClawHub untuk paket plugin yang dapat diinstal dan mencetak
nama paket siap-instal. Ini mencari paket code-plugin dan bundle-plugin,
bukan skills. Gunakan `openclaw skills search` untuk Skills ClawHub.

<Note>
ClawHub adalah permukaan distribusi dan penemuan utama untuk sebagian besar plugin. Npm
tetap menjadi fallback dan jalur instal langsung yang didukung. Paket plugin
`@openclaw/*` milik OpenClaw kembali dipublikasikan di npm; lihat daftar saat ini
di [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) atau
[inventaris plugin](/id/plugins/plugin-inventory). Instalasi stabil menggunakan `latest`.
Instalasi dan pembaruan kanal beta mengutamakan dist-tag npm `beta` saat tag tersebut
tersedia, lalu fallback ke `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Penyertaan konfigurasi dan perbaikan konfigurasi tidak valid">
    Jika bagian `plugins` Anda didukung oleh `$include` berkas tunggal, `plugins install/update/enable/disable/uninstall` menulis melalui berkas yang disertakan tersebut dan membiarkan `openclaw.json` tidak tersentuh. Penyertaan root, array penyertaan, dan penyertaan dengan override saudara gagal tertutup alih-alih diratakan. Lihat [Penyertaan konfigurasi](/id/gateway/configuration) untuk bentuk yang didukung.

    Jika konfigurasi tidak valid saat instalasi, `plugins install` biasanya gagal tertutup dan memberi tahu Anda untuk menjalankan `openclaw doctor --fix` terlebih dahulu. Selama startup Gateway dan hot reload, konfigurasi plugin yang tidak valid gagal tertutup seperti konfigurasi tidak valid lainnya; `openclaw doctor --fix` dapat mengarantina entri plugin yang tidak valid. Satu-satunya pengecualian waktu instalasi yang terdokumentasi adalah jalur pemulihan plugin bawaan yang sempit untuk plugin yang secara eksplisit ikut serta dalam `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force dan instal ulang vs pembaruan">
    `--force` menggunakan ulang target instalasi yang ada dan menimpa plugin atau paket hook yang sudah terinstal di tempat. Gunakan ini saat Anda sengaja menginstal ulang id yang sama dari jalur lokal, arsip, paket ClawHub, atau artefak npm baru. Untuk peningkatan rutin atas plugin npm yang sudah dilacak, utamakan `openclaw plugins update <id-or-npm-spec>`.

    Jika Anda menjalankan `plugins install` untuk id plugin yang sudah terinstal, OpenClaw berhenti dan mengarahkan Anda ke `plugins update <id-or-npm-spec>` untuk peningkatan normal, atau ke `plugins install <package> --force` saat Anda benar-benar ingin menimpa instalasi saat ini dari sumber berbeda.

  </Accordion>
  <Accordion title="Cakupan --pin">
    `--pin` hanya berlaku untuk instalasi npm. Ini tidak didukung dengan instalasi `git:`; gunakan ref git eksplisit seperti `git:github.com/acme/plugin@v1.2.3` saat Anda menginginkan sumber yang dipin. Ini tidak didukung dengan `--marketplace`, karena instalasi marketplace mempertahankan metadata sumber marketplace alih-alih spec npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` adalah opsi darurat untuk positif palsu dalam pemindai kode berbahaya bawaan. Ini memungkinkan instalasi berlanjut sekalipun pemindai bawaan melaporkan temuan `critical`, tetapi **tidak** melewati blok kebijakan hook `before_install` plugin dan **tidak** melewati kegagalan pemindaian.

    Flag CLI ini berlaku untuk alur instalasi/pembaruan plugin. Instalasi dependensi skill yang didukung Gateway menggunakan override permintaan `dangerouslyForceUnsafeInstall` yang sesuai, sementara `openclaw skills install` tetap menjadi alur unduh/instal skill ClawHub yang terpisah.

    Jika plugin yang Anda publikasikan di ClawHub diblokir oleh pemindaian registri, gunakan langkah penerbit di [ClawHub](/id/tools/clawhub).

  </Accordion>
  <Accordion title="Paket hook dan spec npm">
    `plugins install` juga merupakan permukaan instalasi untuk paket hook yang mengekspos `openclaw.hooks` di `package.json`. Gunakan `openclaw hooks` untuk visibilitas hook yang difilter dan pengaktifan per hook, bukan instalasi paket.

    Spec npm **hanya registri** (nama paket + **versi persis** atau **dist-tag** opsional). Spec Git/URL/file dan rentang semver ditolak. Instalasi dependensi berjalan lokal-proyek dengan `--ignore-scripts` untuk keamanan, bahkan saat shell Anda memiliki pengaturan instal npm global. Root npm plugin terkelola mewarisi `overrides` npm tingkat paket milik OpenClaw, sehingga pin keamanan host juga berlaku untuk dependensi plugin yang dihoist.

    Gunakan `npm:<package>` saat Anda ingin membuat resolusi npm eksplisit. Spec paket polos juga menginstal langsung dari npm selama peralihan peluncuran.

    Spec polos dan `@latest` tetap berada di jalur stabil. Versi koreksi bertanggal OpenClaw seperti `2026.5.3-1` adalah rilis stabil untuk pemeriksaan ini. Jika npm meresolusikan salah satunya ke prarilis, OpenClaw berhenti dan meminta Anda ikut serta secara eksplisit dengan tag prarilis seperti `@beta`/`@rc` atau versi prarilis persis seperti `@1.2.3-beta.4`.

    Jika spec instal polos cocok dengan id plugin resmi (misalnya `diffs`), OpenClaw menginstal entri katalog secara langsung. Untuk menginstal paket npm dengan nama yang sama, gunakan spec bercakupan eksplisit (misalnya `@scope/diffs`).

  </Accordion>
  <Accordion title="Repositori Git">
    Gunakan `git:<repo>` untuk menginstal langsung dari repositori git. Bentuk yang didukung mencakup `git:github.com/owner/repo`, `git:owner/repo`, URL clone lengkap `https://`, `ssh://`, `git://`, `file://`, dan `git@host:owner/repo.git`. Tambahkan `@<ref>` atau `#<ref>` untuk checkout branch, tag, atau commit sebelum instalasi.

    Instalasi Git meng-clone ke direktori sementara, checkout ref yang diminta saat ada, lalu menggunakan penginstal direktori plugin normal. Itu berarti validasi manifest, pemindaian kode berbahaya, pekerjaan instal manajer paket, dan catatan instalasi berperilaku seperti instalasi npm. Instalasi git yang direkam menyertakan URL/ref sumber plus commit yang diresolusikan sehingga `openclaw plugins update` dapat meresolusikan ulang sumber nanti.

    Setelah menginstal dari git, gunakan `openclaw plugins inspect <id> --runtime --json` untuk memverifikasi registrasi runtime seperti metode gateway dan perintah CLI. Jika plugin mendaftarkan root CLI dengan `api.registerCli`, jalankan perintah itu langsung melalui CLI root OpenClaw, misalnya `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Arsip">
    Arsip yang didukung: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Arsip plugin OpenClaw native harus berisi `openclaw.plugin.json` yang valid di root plugin hasil ekstraksi; arsip yang hanya berisi `package.json` ditolak sebelum OpenClaw menulis catatan instalasi.

    Gunakan `npm-pack:<path.tgz>` saat berkas adalah tarball npm-pack dan Anda ingin
    menguji jalur instal root npm terkelola yang sama seperti yang digunakan instalasi registri,
    termasuk verifikasi `package-lock.json`, pemindaian dependensi yang dihoist, dan
    catatan instal npm. Jalur arsip biasa tetap diinstal sebagai arsip lokal
    di bawah root ekstensi plugin.

    Instalasi marketplace Claude juga didukung.

  </Accordion>
</AccordionGroup>

Instalasi ClawHub menggunakan locator `clawhub:<package>` eksplisit:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Spec plugin aman-npm polos menginstal dari npm secara default selama peralihan peluncuran:

```bash
openclaw plugins install openclaw-codex-app-server
```

Gunakan `npm:` untuk membuat resolusi khusus npm eksplisit:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw memeriksa kompatibilitas API plugin / Gateway minimum yang diiklankan sebelum pemasangan. Ketika versi ClawHub yang dipilih menerbitkan artefak ClawPack, OpenClaw mengunduh `.tgz` npm-pack berversi, memverifikasi header digest ClawHub dan digest artefak, lalu memasangnya melalui jalur arsip normal. Versi ClawHub lama tanpa metadata ClawPack tetap dipasang melalui jalur verifikasi arsip paket legacy. Pemasangan yang tercatat mempertahankan metadata sumber ClawHub, jenis artefak, integritas npm, shasum npm, nama tarball, dan fakta digest ClawPack untuk pembaruan berikutnya.
Pemasangan ClawHub tanpa versi mempertahankan spesifikasi tercatat tanpa versi sehingga `openclaw plugins update` dapat mengikuti rilis ClawHub yang lebih baru; pemilih versi atau tag eksplisit seperti `clawhub:pkg@1.2.3` dan `clawhub:pkg@beta` tetap dipatok ke pemilih tersebut.

#### Singkatan marketplace

Gunakan singkatan `plugin@marketplace` ketika nama marketplace ada dalam cache registry lokal Claude di `~/.claude/plugins/known_marketplaces.json`:

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
    - singkatan repo GitHub seperti `owner/repo`
    - URL repo GitHub seperti `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="Aturan marketplace jarak jauh">
    Untuk marketplace jarak jauh yang dimuat dari GitHub atau git, entri plugin harus tetap berada di dalam repo marketplace yang dikloning. OpenClaw menerima sumber path relatif dari repo tersebut dan menolak HTTP(S), path absolut, git, GitHub, serta sumber plugin non-path lain dari manifes jarak jauh.
  </Tab>
</Tabs>

Untuk path lokal dan arsip, OpenClaw mendeteksi otomatis:

- plugin OpenClaw native (`openclaw.plugin.json`)
- bundel yang kompatibel dengan Codex (`.codex-plugin/plugin.json`)
- bundel yang kompatibel dengan Claude (`.claude-plugin/plugin.json` atau tata letak komponen default Claude)
- bundel yang kompatibel dengan Cursor (`.cursor-plugin/plugin.json`)

<Note>
Bundel yang kompatibel dipasang ke root plugin normal dan berpartisipasi dalam alur list/info/enable/disable yang sama. Saat ini, Skills bundel, command-skills Claude, default `settings.json` Claude, default `.lsp.json` / `lspServers` yang dideklarasikan manifes Claude, command-skills Cursor, dan direktori hook Codex yang kompatibel didukung; kapabilitas bundel lain yang terdeteksi ditampilkan dalam diagnostics/info tetapi belum dihubungkan ke eksekusi runtime.
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
  Inventaris yang dapat dibaca mesin beserta diagnostics registry dan status pemasangan dependensi paket.
</ParamField>

<Note>
`plugins list` membaca registry plugin lokal yang dipersistenkan terlebih dahulu, dengan fallback turunan khusus manifes ketika registry hilang atau tidak valid. Ini berguna untuk memeriksa apakah plugin terpasang, diaktifkan, dan terlihat oleh perencanaan cold startup, tetapi bukan probe runtime langsung atas proses Gateway yang sudah berjalan. Setelah mengubah kode plugin, status aktif, kebijakan hook, atau `plugins.load.paths`, mulai ulang Gateway yang melayani channel sebelum mengharapkan kode `register(api)` baru atau hook berjalan. Untuk deployment jarak jauh/container, verifikasi bahwa Anda memulai ulang child `openclaw gateway run` yang sebenarnya, bukan hanya proses wrapper.

`plugins list --json` menyertakan `dependencyStatus` setiap plugin dari `package.json`
`dependencies` dan `optionalDependencies`. OpenClaw memeriksa apakah nama paket tersebut ada di sepanjang path lookup `node_modules` Node normal milik plugin; OpenClaw
tidak mengimpor kode runtime plugin, menjalankan package manager, atau memperbaiki
dependensi yang hilang.
</Note>

`plugins search` adalah lookup katalog ClawHub jarak jauh. Ini tidak memeriksa status lokal, mengubah config, memasang paket, atau memuat kode runtime plugin. Hasil pencarian menyertakan nama paket ClawHub, family, channel, versi, ringkasan, dan petunjuk pemasangan seperti `openclaw plugins install clawhub:<package>`.

Untuk pekerjaan plugin bawaan di dalam image Docker terpaket, bind-mount direktori sumber plugin di atas path sumber terpaket yang sesuai, seperti `/app/extensions/synology-chat`. OpenClaw akan menemukan overlay sumber yang di-mount tersebut sebelum `/app/dist/extensions/synology-chat`; direktori sumber yang hanya disalin tetap inert sehingga pemasangan terpaket normal tetap menggunakan dist terkompilasi.

Untuk debugging hook runtime:

- `openclaw plugins inspect <id> --runtime --json` menampilkan hook terdaftar dan diagnostics dari pass inspeksi yang memuat modul. Inspeksi runtime tidak pernah memasang dependensi; gunakan `openclaw doctor --fix` untuk membersihkan status dependensi legacy atau memulihkan plugin unduhan yang hilang yang dirujuk oleh config.
- `openclaw gateway status --deep --require-rpc` mengonfirmasi Gateway yang dapat dijangkau, petunjuk service/proses, path config, dan kesehatan RPC.
- Hook percakapan non-bundled (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) memerlukan `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Gunakan `--link` untuk menghindari penyalinan direktori lokal (menambahkan ke `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` tidak didukung dengan `--link` karena pemasangan tertaut menggunakan ulang path sumber alih-alih menyalin ke target pemasangan terkelola.

Gunakan `--pin` pada pemasangan npm untuk menyimpan spesifikasi tepat yang di-resolve (`name@version`) dalam indeks plugin terkelola sambil mempertahankan perilaku default tidak dipatok.
</Note>

### Indeks plugin

Metadata pemasangan plugin adalah status yang dikelola mesin, bukan config pengguna. Pemasangan dan pembaruan menuliskannya ke `plugins/installs.json` di bawah direktori status OpenClaw aktif. Map `installRecords` level teratasnya adalah sumber metadata pemasangan yang tahan lama, termasuk record untuk manifes plugin yang rusak atau hilang. Array `plugins` adalah cache registry cold turunan manifes. File tersebut menyertakan peringatan jangan diedit dan digunakan oleh `openclaw plugins update`, uninstall, diagnostics, dan registry plugin cold.

Ketika OpenClaw melihat record `plugins.installs` legacy bawaan dalam config, pembacaan runtime memperlakukannya sebagai input kompatibilitas tanpa menulis ulang `openclaw.json`. Penulisan plugin eksplisit dan `openclaw doctor --fix` memindahkan record tersebut ke indeks plugin dan menghapus kunci config ketika penulisan config diizinkan; jika salah satu penulisan gagal, record config dipertahankan agar metadata pemasangan tidak hilang.

### Copot pemasangan

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` menghapus record plugin dari `plugins.entries`, indeks plugin yang dipersistenkan, entri daftar allow/deny plugin, dan entri `plugins.load.paths` tertaut bila berlaku. Kecuali `--keep-files` disetel, uninstall juga menghapus direktori pemasangan terkelola yang dilacak ketika berada di dalam root extensions plugin OpenClaw. Untuk plugin active memory, slot memory direset ke `memory-core`.

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

Pembaruan diterapkan ke pemasangan plugin yang dilacak dalam indeks plugin terkelola dan pemasangan hook-pack yang dilacak dalam `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Me-resolve id plugin vs spesifikasi npm">
    Ketika Anda meneruskan id plugin, OpenClaw menggunakan ulang spesifikasi pemasangan yang tercatat untuk plugin tersebut. Artinya dist-tag yang sebelumnya disimpan seperti `@beta` dan versi tepat yang dipatok terus digunakan pada eksekusi `update <id>` berikutnya.

    Untuk pemasangan npm, Anda juga dapat meneruskan spesifikasi paket npm eksplisit dengan dist-tag atau versi tepat. OpenClaw me-resolve nama paket tersebut kembali ke record plugin yang dilacak, memperbarui plugin terpasang itu, dan mencatat spesifikasi npm baru untuk pembaruan berbasis id di masa mendatang.

    Meneruskan nama paket npm tanpa versi atau tag juga me-resolve kembali ke record plugin yang dilacak. Gunakan ini ketika plugin dipatok ke versi tepat dan Anda ingin memindahkannya kembali ke lini rilis default registry.

  </Accordion>
  <Accordion title="Pembaruan channel beta">
    `openclaw plugins update` menggunakan ulang spesifikasi plugin yang dilacak kecuali Anda meneruskan spesifikasi baru. `openclaw update` juga mengetahui channel pembaruan OpenClaw yang aktif: pada channel beta, record plugin npm dan ClawHub lini default mencoba `@beta` terlebih dahulu, lalu fallback ke spesifikasi default/latest yang tercatat jika tidak ada rilis beta plugin. Versi tepat dan tag eksplisit tetap dipatok ke pemilih tersebut.

  </Accordion>
  <Accordion title="Pemeriksaan versi dan drift integritas">
    Sebelum pembaruan npm live, OpenClaw memeriksa versi paket yang terpasang terhadap metadata registry npm. Jika versi yang terpasang dan identitas artefak yang tercatat sudah cocok dengan target yang di-resolve, pembaruan dilewati tanpa mengunduh, memasang ulang, atau menulis ulang `openclaw.json`.

    Ketika hash integritas tersimpan ada dan hash artefak yang diambil berubah, OpenClaw memperlakukannya sebagai drift artefak npm. Perintah interaktif `openclaw plugins update` mencetak hash yang diharapkan dan aktual serta meminta konfirmasi sebelum melanjutkan. Helper pembaruan non-interaktif gagal tertutup kecuali pemanggil menyediakan kebijakan kelanjutan eksplisit.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install pada pembaruan">
    `--dangerously-force-unsafe-install` juga tersedia pada `plugins update` sebagai override darurat untuk false positive pemindaian dangerous-code bawaan selama pembaruan plugin. Ini tetap tidak melewati blok kebijakan `before_install` plugin atau pemblokiran kegagalan pemindaian, dan hanya berlaku untuk pembaruan plugin, bukan pembaruan hook-pack.
  </Accordion>
</AccordionGroup>

### Inspeksi

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect menampilkan identitas, status pemuatan, sumber, kapabilitas manifes, flag kebijakan, diagnostics, metadata pemasangan, kapabilitas bundel, dan dukungan server MCP atau LSP apa pun yang terdeteksi tanpa mengimpor runtime plugin secara default. Tambahkan `--runtime` untuk memuat modul plugin dan menyertakan hook, tools, commands, services, metode Gateway, dan route HTTP yang terdaftar. Inspeksi runtime melaporkan dependensi plugin yang hilang secara langsung; pemasangan dan perbaikan tetap berada di `openclaw plugins install`, `openclaw plugins update`, dan `openclaw doctor --fix`.

Perintah CLI milik plugin dipasang sebagai grup perintah root `openclaw`. Setelah `inspect --runtime` menampilkan perintah di bawah `cliCommands`, jalankan sebagai `openclaw <command> ...`; misalnya plugin yang mendaftarkan `demo-git` dapat diverifikasi dengan `openclaw demo-git ping`.

Setiap plugin diklasifikasikan berdasarkan apa yang benar-benar didaftarkannya pada runtime:

- **kemampuan-biasa** — satu jenis kemampuan (misalnya Plugin khusus penyedia)
- **kemampuan-hibrida** — beberapa jenis kemampuan (misalnya teks + ucapan + gambar)
- **khusus-hook** — hanya hook, tanpa kemampuan atau surface
- **non-kemampuan** — alat/perintah/layanan tetapi tanpa kemampuan

Lihat [Bentuk Plugin](/id/plugins/architecture#plugin-shapes) untuk informasi selengkapnya tentang model kemampuan.

<Note>
Flag `--json` menghasilkan laporan yang dapat dibaca mesin dan cocok untuk scripting serta audit. `inspect --all` merender tabel seluruh fleet dengan kolom bentuk, jenis kemampuan, pemberitahuan kompatibilitas, kemampuan bundle, dan ringkasan hook. `info` adalah alias untuk `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` melaporkan kesalahan pemuatan Plugin, diagnostik manifes/penemuan, dan pemberitahuan kompatibilitas. Ketika semuanya bersih, perintah ini mencetak `No plugin issues detected.`

Jika Plugin yang dikonfigurasi ada di disk tetapi diblokir oleh pemeriksaan keamanan jalur milik loader, validasi konfigurasi mempertahankan entri Plugin dan melaporkannya sebagai `present but blocked`. Perbaiki diagnostik Plugin terblokir sebelumnya, seperti kepemilikan jalur atau izin world-writable, alih-alih menghapus konfigurasi `plugins.entries.<id>` atau `plugins.allow`.

Untuk kegagalan bentuk modul seperti ekspor `register`/`activate` yang hilang, jalankan ulang dengan `OPENCLAW_PLUGIN_LOAD_DEBUG=1` untuk menyertakan ringkasan bentuk ekspor yang ringkas dalam output diagnostik.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Registry Plugin lokal adalah model baca dingin persisten OpenClaw untuk identitas Plugin yang terinstal, status aktif, metadata sumber, dan kepemilikan kontribusi. Startup normal, pencarian pemilik penyedia, klasifikasi penyiapan channel, dan inventaris Plugin dapat membacanya tanpa mengimpor modul runtime Plugin.

Gunakan `plugins registry` untuk memeriksa apakah registry persisten ada, terbaru, atau kedaluwarsa. Gunakan `--refresh` untuk membangunnya ulang dari indeks Plugin persisten, kebijakan konfigurasi, dan metadata manifes/paket. Ini adalah jalur perbaikan, bukan jalur aktivasi runtime.

`openclaw doctor --fix` juga memperbaiki drift npm terkelola yang berdekatan dengan registry: jika paket `@openclaw/*` yatim atau dipulihkan di bawah root npm Plugin terkelola membayangi Plugin bawaan, doctor menghapus paket kedaluwarsa tersebut dan membangun ulang registry sehingga startup memvalidasi terhadap manifes bawaan.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` adalah sakelar kompatibilitas break-glass yang sudah tidak digunakan untuk kegagalan pembacaan registry. Utamakan `plugins registry --refresh` atau `openclaw doctor --fix`; fallback env hanya untuk pemulihan startup darurat sementara migrasi diluncurkan.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Daftar marketplace menerima jalur marketplace lokal, jalur `marketplace.json`, shorthand GitHub seperti `owner/repo`, URL repo GitHub, atau URL git. `--json` mencetak label sumber yang diselesaikan beserta manifes marketplace dan entri Plugin yang telah diurai.

## Terkait

- [Membangun Plugin](/id/plugins/building-plugins)
- [Referensi CLI](/id/cli)
- [Plugin komunitas](/id/plugins/community)
