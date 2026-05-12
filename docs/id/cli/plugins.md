---
read_when:
    - Anda ingin menginstal atau mengelola plugin Gateway atau bundel yang kompatibel
    - Anda ingin mendiagnosis kegagalan pemuatan Plugin
sidebarTitle: Plugins
summary: Referensi CLI untuk `openclaw plugins` (daftar, instal, marketplace, hapus instalasi, aktifkan/nonaktifkan, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-05-12T08:45:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4b51646a103e9e020f6e53cd08aa25e7291fb629741fd41bdab520d80b7416ff
    source_path: cli/plugins.md
    workflow: 16
---

Kelola Plugin Gateway, paket hook, dan bundel yang kompatibel.

<CardGroup cols={2}>
  <Card title="Sistem Plugin" href="/id/tools/plugin">
    Panduan pengguna akhir untuk menginstal, mengaktifkan, dan memecahkan masalah plugin.
  </Card>
  <Card title="Kelola plugin" href="/id/plugins/manage-plugins">
    Contoh cepat untuk instal, daftar, perbarui, hapus instalasi, dan publikasi.
  </Card>
  <Card title="Bundel Plugin" href="/id/plugins/bundles">
    Model kompatibilitas bundel.
  </Card>
  <Card title="Manifest Plugin" href="/id/plugins/manifest">
    Kolom manifest dan skema konfigurasi.
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

Untuk investigasi instal, inspeksi, hapus instalasi, atau penyegaran registri yang lambat, jalankan
perintah dengan `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Jejak menulis pengaturan waktu fase
ke stderr dan menjaga output JSON tetap dapat diurai. Lihat [Debugging](/id/help/debugging#plugin-lifecycle-trace).

<Note>
Dalam mode Nix (`OPENCLAW_NIX_MODE=1`), pengubah siklus hidup plugin dinonaktifkan. Gunakan sumber Nix untuk instalasi ini, bukan `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable`, atau `plugins disable`; untuk nix-openclaw, gunakan [Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) yang mengutamakan agen.
</Note>

<Note>
Plugin bawaan dikirim bersama OpenClaw. Beberapa diaktifkan secara default (misalnya penyedia model bawaan, penyedia ucapan bawaan, dan plugin browser bawaan); yang lain memerlukan `plugins enable`.

Plugin OpenClaw native harus mengirim `openclaw.plugin.json` dengan JSON Schema inline (`configSchema`, meskipun kosong). Bundel yang kompatibel menggunakan manifest bundel mereka sendiri sebagai gantinya.

`plugins list` menampilkan `Format: openclaw` atau `Format: bundle`. Output daftar/info verbose juga menampilkan subtipe bundel (`codex`, `claude`, atau `cursor`) beserta kapabilitas bundel yang terdeteksi.
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

Maintainer yang menguji instalasi saat penyiapan dapat mengganti sumber instalasi plugin otomatis
dengan variabel lingkungan yang dijaga. Lihat
[Penggantian instalasi Plugin](/id/plugins/install-overrides).

<Warning>
Nama paket tanpa penanda menginstal dari npm secara default selama perpindahan peluncuran. Gunakan `clawhub:<package>` untuk ClawHub. Perlakukan instalasi plugin seperti menjalankan kode. Utamakan versi yang dipasangi pin.
</Warning>

`plugins search` mengueri ClawHub untuk paket plugin yang dapat diinstal dan mencetak
nama paket yang siap diinstal. Perintah ini mencari paket code-plugin dan bundle-plugin,
bukan Skills. Gunakan `openclaw skills search` untuk Skills ClawHub.

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
    Jika bagian `plugins` Anda didukung oleh `$include` satu file, `plugins install/update/enable/disable/uninstall` menulis melalui file yang disertakan tersebut dan membiarkan `openclaw.json` tidak berubah. Penyertaan root, array penyertaan, dan penyertaan dengan override saudara gagal tertutup, bukan diratakan. Lihat [Penyertaan konfigurasi](/id/gateway/configuration) untuk bentuk yang didukung.

    Jika konfigurasi tidak valid selama instalasi, `plugins install` biasanya gagal tertutup dan meminta Anda menjalankan `openclaw doctor --fix` terlebih dahulu. Selama startup Gateway dan hot reload, konfigurasi plugin yang tidak valid gagal tertutup seperti konfigurasi tidak valid lainnya; `openclaw doctor --fix` dapat mengarantina entri plugin yang tidak valid. Satu-satunya pengecualian waktu instal yang terdokumentasi adalah jalur pemulihan plugin bawaan yang sempit untuk plugin yang secara eksplisit ikut serta dalam `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force dan instal ulang vs perbarui">
    `--force` menggunakan ulang target instalasi yang ada dan menimpa plugin atau paket hook yang sudah terinstal di tempat. Gunakan opsi ini saat Anda sengaja menginstal ulang id yang sama dari jalur lokal, arsip, paket ClawHub, atau artefak npm baru. Untuk peningkatan rutin plugin npm yang sudah dilacak, utamakan `openclaw plugins update <id-or-npm-spec>`.

    Jika Anda menjalankan `plugins install` untuk id plugin yang sudah terinstal, OpenClaw berhenti dan mengarahkan Anda ke `plugins update <id-or-npm-spec>` untuk peningkatan normal, atau ke `plugins install <package> --force` saat Anda benar-benar ingin menimpa instalasi saat ini dari sumber yang berbeda.

  </Accordion>
  <Accordion title="Cakupan --pin">
    `--pin` hanya berlaku untuk instalasi npm. Ini tidak didukung dengan instalasi `git:`; gunakan ref git eksplisit seperti `git:github.com/acme/plugin@v1.2.3` saat Anda menginginkan sumber yang dipasangi pin. Ini tidak didukung dengan `--marketplace`, karena instalasi marketplace mempertahankan metadata sumber marketplace, bukan spec npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` adalah opsi darurat untuk positif palsu di pemindai kode berbahaya bawaan. Opsi ini memungkinkan instalasi berlanjut meskipun pemindai bawaan melaporkan temuan `critical`, tetapi **tidak** melewati blok kebijakan hook `before_install` plugin dan **tidak** melewati kegagalan pemindaian.

    Flag CLI ini berlaku untuk alur instal/perbarui plugin. Instalasi dependensi Skills yang didukung Gateway menggunakan override permintaan `dangerouslyForceUnsafeInstall` yang sesuai, sedangkan `openclaw skills install` tetap menjadi alur unduh/instal Skills ClawHub yang terpisah.

    Jika plugin yang Anda publikasikan di ClawHub diblokir oleh pemindaian registri, gunakan langkah penerbit di [ClawHub](/id/clawhub/security).

  </Accordion>
  <Accordion title="Paket hook dan spec npm">
    `plugins install` juga merupakan permukaan instalasi untuk paket hook yang mengekspos `openclaw.hooks` di `package.json`. Gunakan `openclaw hooks` untuk visibilitas hook terfilter dan pengaktifan per hook, bukan instalasi paket.

    Spec npm bersifat **hanya registri** (nama paket + **versi persis** atau **dist-tag** opsional). Spec Git/URL/file dan rentang semver ditolak. Instalasi dependensi berjalan secara lokal proyek dengan `--ignore-scripts` demi keamanan, meskipun shell Anda memiliki pengaturan instal npm global. Root npm plugin terkelola mewarisi `overrides` npm tingkat paket milik OpenClaw, sehingga pin keamanan host juga berlaku untuk dependensi plugin yang di-hoist.

    Gunakan `npm:<package>` saat Anda ingin membuat resolusi npm eksplisit. Spec paket tanpa penanda juga menginstal langsung dari npm selama perpindahan peluncuran.

    Spec tanpa penanda dan `@latest` tetap berada di jalur stabil. Versi koreksi bertanggal OpenClaw seperti `2026.5.3-1` adalah rilis stabil untuk pemeriksaan ini. Jika npm menyelesaikan salah satu dari itu ke prerelease, OpenClaw berhenti dan meminta Anda ikut serta secara eksplisit dengan tag prerelease seperti `@beta`/`@rc` atau versi prerelease persis seperti `@1.2.3-beta.4`.

    Jika spec instal tanpa penanda cocok dengan id plugin resmi (misalnya `diffs`), OpenClaw menginstal entri katalog secara langsung. Untuk menginstal paket npm dengan nama yang sama, gunakan spec scoped eksplisit (misalnya `@scope/diffs`).

  </Accordion>
  <Accordion title="Repositori Git">
    Gunakan `git:<repo>` untuk menginstal langsung dari repositori git. Bentuk yang didukung mencakup `git:github.com/owner/repo`, `git:owner/repo`, URL klon lengkap `https://`, `ssh://`, `git://`, `file://`, dan `git@host:owner/repo.git`. Tambahkan `@<ref>` atau `#<ref>` untuk checkout branch, tag, atau commit sebelum instalasi.

    Instalasi Git mengklon ke direktori sementara, checkout ref yang diminta jika ada, lalu menggunakan penginstal direktori plugin normal. Itu berarti validasi manifest, pemindaian kode berbahaya, pekerjaan instalasi package-manager, dan catatan instalasi berperilaku seperti instalasi npm. Instalasi git yang direkam menyertakan URL/ref sumber beserta commit yang diselesaikan sehingga `openclaw plugins update` dapat menyelesaikan ulang sumbernya nanti.

    Setelah menginstal dari git, gunakan `openclaw plugins inspect <id> --runtime --json` untuk memverifikasi registrasi runtime seperti metode gateway dan perintah CLI. Jika plugin mendaftarkan root CLI dengan `api.registerCli`, jalankan perintah tersebut langsung melalui CLI root OpenClaw, misalnya `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Arsip">
    Arsip yang didukung: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Arsip plugin OpenClaw native harus berisi `openclaw.plugin.json` yang valid di root plugin yang diekstrak; arsip yang hanya berisi `package.json` ditolak sebelum OpenClaw menulis catatan instalasi.

    Gunakan `npm-pack:<path.tgz>` saat file tersebut adalah tarball npm-pack dan Anda ingin
    menguji jalur instal root npm terkelola yang sama dengan yang digunakan oleh instalasi registri,
    termasuk verifikasi `package-lock.json`, pemindaian dependensi yang di-hoist, dan
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

Spec plugin yang aman untuk npm tanpa penanda menginstal dari npm secara default selama perpindahan peluncuran:

```bash
openclaw plugins install openclaw-codex-app-server
```

Gunakan `npm:` untuk membuat resolusi hanya-npm eksplisit:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw memeriksa API plugin yang diiklankan / kompatibilitas Gateway minimum sebelum instalasi. Ketika versi ClawHub yang dipilih menerbitkan artefak ClawPack, OpenClaw mengunduh `.tgz` npm-pack berversi, memverifikasi header digest ClawHub dan digest artefak, lalu menginstalnya melalui jalur arsip normal. Versi ClawHub yang lebih lama tanpa metadata ClawPack tetap diinstal melalui jalur verifikasi arsip paket lama. Instalasi yang tercatat menyimpan metadata sumber ClawHub, jenis artefak, integritas npm, shasum npm, nama tarball, dan fakta digest ClawPack untuk pembaruan berikutnya.
Instalasi ClawHub tanpa versi mempertahankan spesifikasi tercatat tanpa versi sehingga `openclaw plugins update` dapat mengikuti rilis ClawHub yang lebih baru; pemilih versi atau tag eksplisit seperti `clawhub:pkg@1.2.3` dan `clawhub:pkg@beta` tetap dipinkan ke pemilih tersebut.

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
  <Tab title="Sumber marketplace">
    - nama marketplace yang dikenal Claude dari `~/.claude/plugins/known_marketplaces.json`
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
- bundel yang kompatibel dengan Codex (`.codex-plugin/plugin.json`)
- bundel yang kompatibel dengan Claude (`.claude-plugin/plugin.json` atau tata letak komponen Claude default)
- bundel yang kompatibel dengan Cursor (`.cursor-plugin/plugin.json`)

<Note>
Bundel yang kompatibel diinstal ke root plugin normal dan ikut serta dalam alur list/info/enable/disable yang sama. Saat ini, skill bundel, command-skill Claude, default Claude `settings.json`, default Claude `.lsp.json` / `lspServers` yang dideklarasikan manifes, command-skill Cursor, dan direktori hook Codex yang kompatibel didukung; kemampuan bundel lain yang terdeteksi ditampilkan di diagnostik/info tetapi belum dihubungkan ke eksekusi runtime.
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
  Inventaris yang dapat dibaca mesin beserta diagnostik registri dan status instalasi dependensi paket.
</ParamField>

<Note>
`plugins list` membaca registri plugin lokal yang dipersistenkan terlebih dahulu, dengan fallback turunan khusus manifes ketika registri hilang atau tidak valid. Ini berguna untuk memeriksa apakah suatu plugin sudah terinstal, diaktifkan, dan terlihat oleh perencanaan cold startup, tetapi ini bukan probe runtime langsung terhadap proses Gateway yang sudah berjalan. Setelah mengubah kode plugin, pengaktifan, kebijakan hook, atau `plugins.load.paths`, mulai ulang Gateway yang melayani channel sebelum mengharapkan kode `register(api)` atau hook baru berjalan. Untuk deployment jarak jauh/kontainer, pastikan Anda memulai ulang child `openclaw gateway run` yang sebenarnya, bukan hanya proses wrapper.

`plugins list --json` menyertakan `dependencyStatus` setiap plugin dari `package.json`
`dependencies` dan `optionalDependencies`. OpenClaw memeriksa apakah nama paket tersebut
ada di sepanjang jalur lookup `node_modules` Node normal milik plugin; OpenClaw
tidak mengimpor kode runtime plugin, menjalankan package manager, atau memperbaiki
dependensi yang hilang.
</Note>

`plugins search` adalah lookup katalog ClawHub jarak jauh. Ini tidak memeriksa status
lokal, mengubah config, menginstal paket, atau memuat kode runtime plugin. Hasil
pencarian menyertakan nama paket ClawHub, family, channel, versi, ringkasan, dan
petunjuk instalasi seperti `openclaw plugins install clawhub:<package>`.

Untuk pekerjaan plugin bawaan di dalam image Docker yang dipaketkan, bind-mount direktori
sumber plugin di atas jalur sumber paket yang cocok, seperti
`/app/extensions/synology-chat`. OpenClaw akan menemukan overlay sumber yang dipasang
tersebut sebelum `/app/dist/extensions/synology-chat`; direktori sumber yang sekadar
disalin tetap tidak aktif sehingga instalasi paket normal tetap menggunakan dist terkompilasi.

Untuk debugging hook runtime:

- `openclaw plugins inspect <id> --runtime --json` menampilkan hook terdaftar dan diagnostik dari pass inspeksi yang memuat modul. Inspeksi runtime tidak pernah menginstal dependensi; gunakan `openclaw doctor --fix` untuk membersihkan status dependensi lama atau memulihkan plugin unduhan yang hilang tetapi direferensikan oleh config.
- `openclaw gateway status --deep --require-rpc` mengonfirmasi Gateway yang dapat dijangkau, petunjuk layanan/proses, jalur config, dan kesehatan RPC.
- Hook percakapan non-bundled (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) memerlukan `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Gunakan `--link` untuk menghindari penyalinan direktori lokal (menambahkan ke `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` tidak didukung dengan `--link` karena instalasi tertaut menggunakan ulang jalur sumber alih-alih menyalin di atas target instalasi terkelola.

Gunakan `--pin` pada instalasi npm untuk menyimpan spesifikasi persis yang di-resolve (`name@version`) di indeks plugin terkelola sambil mempertahankan perilaku default tanpa pin.
</Note>

### Indeks plugin

Metadata instalasi plugin adalah status yang dikelola mesin, bukan config pengguna. Instalasi dan pembaruan menuliskannya ke `plugins/installs.json` di bawah direktori status OpenClaw aktif. Peta `installRecords` tingkat teratasnya adalah sumber metadata instalasi yang tahan lama, termasuk catatan untuk manifes plugin yang rusak atau hilang. Array `plugins` adalah cache registri cold turunan manifes. File ini menyertakan peringatan jangan diedit dan digunakan oleh `openclaw plugins update`, uninstall, diagnostik, dan registri plugin cold.

Ketika OpenClaw melihat catatan `plugins.installs` lama yang dikirimkan di config, pembacaan runtime memperlakukannya sebagai input kompatibilitas tanpa menulis ulang `openclaw.json`. Penulisan plugin eksplisit dan `openclaw doctor --fix` memindahkan catatan tersebut ke indeks plugin dan menghapus key config ketika penulisan config diizinkan; jika salah satu penulisan gagal, catatan config dipertahankan agar metadata instalasi tidak hilang.

### Uninstall

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` menghapus catatan plugin dari `plugins.entries`, indeks plugin yang dipersistenkan, entri daftar allow/deny plugin, dan entri `plugins.load.paths` tertaut jika berlaku. Kecuali `--keep-files` disetel, uninstall juga menghapus direktori instalasi terkelola yang dilacak ketika berada di dalam root ekstensi plugin OpenClaw. Untuk plugin active memory, slot memori direset ke `memory-core`.

<Note>
`--keep-config` didukung sebagai alias usang untuk `--keep-files`.
</Note>

### Update

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Pembaruan berlaku untuk instalasi plugin terlacak di indeks plugin terkelola dan instalasi hook-pack terlacak di `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Me-resolve id plugin vs spesifikasi npm">
    Ketika Anda meneruskan id plugin, OpenClaw menggunakan ulang spesifikasi instalasi tercatat untuk plugin tersebut. Artinya dist-tag yang sebelumnya disimpan seperti `@beta` dan versi persis yang dipinkan terus digunakan pada eksekusi `update <id>` berikutnya.

    Untuk instalasi npm, Anda juga dapat meneruskan spesifikasi paket npm eksplisit dengan dist-tag atau versi persis. OpenClaw me-resolve nama paket tersebut kembali ke catatan plugin terlacak, memperbarui plugin terinstal itu, dan mencatat spesifikasi npm baru untuk pembaruan berbasis id di masa mendatang.

    Meneruskan nama paket npm tanpa versi atau tag juga me-resolve kembali ke catatan plugin terlacak. Gunakan ini ketika suatu plugin dipinkan ke versi persis dan Anda ingin mengembalikannya ke lini rilis default registri.

  </Accordion>
  <Accordion title="Pembaruan channel beta">
    `openclaw plugins update` menggunakan ulang spesifikasi plugin terlacak kecuali Anda meneruskan spesifikasi baru. `openclaw update` juga mengetahui channel pembaruan OpenClaw yang aktif: pada channel beta, catatan plugin npm dan ClawHub lini default mencoba `@beta` terlebih dahulu, lalu fallback ke spesifikasi default/latest tercatat jika tidak ada rilis beta plugin. Fallback tersebut dilaporkan sebagai peringatan dan tidak menggagalkan pembaruan inti. Versi persis dan tag eksplisit tetap dipinkan ke pemilih tersebut.

  </Accordion>
  <Accordion title="Pemeriksaan versi dan drift integritas">
    Sebelum pembaruan npm langsung, OpenClaw memeriksa versi paket yang terinstal terhadap metadata registri npm. Jika versi terinstal dan identitas artefak tercatat sudah cocok dengan target yang di-resolve, pembaruan dilewati tanpa mengunduh, menginstal ulang, atau menulis ulang `openclaw.json`.

    Ketika hash integritas tersimpan ada dan hash artefak yang diambil berubah, OpenClaw memperlakukannya sebagai drift artefak npm. Perintah interaktif `openclaw plugins update` mencetak hash yang diharapkan dan aktual lalu meminta konfirmasi sebelum melanjutkan. Helper pembaruan non-interaktif gagal tertutup kecuali pemanggil menyediakan kebijakan kelanjutan eksplisit.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install saat update">
    `--dangerously-force-unsafe-install` juga tersedia pada `plugins update` sebagai override darurat untuk false positive pemindaian dangerous-code bawaan selama pembaruan plugin. Ini tetap tidak melewati blok kebijakan `before_install` plugin atau pemblokiran kegagalan pemindaian, dan hanya berlaku untuk pembaruan plugin, bukan pembaruan hook-pack.
  </Accordion>
</AccordionGroup>

### Inspect

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect menampilkan identitas, status muat, sumber, kemampuan manifes, flag kebijakan, diagnostik, metadata instalasi, kemampuan bundel, dan dukungan server MCP atau LSP yang terdeteksi tanpa mengimpor runtime plugin secara default. Tambahkan `--runtime` untuk memuat modul plugin dan menyertakan hook, tools, commands, services, metode gateway, dan rute HTTP yang terdaftar. Inspeksi runtime melaporkan dependensi plugin yang hilang secara langsung; instalasi dan perbaikan tetap berada di `openclaw plugins install`, `openclaw plugins update`, dan `openclaw doctor --fix`.

Perintah CLI milik plugin biasanya diinstal sebagai grup perintah root `openclaw`, tetapi plugin juga dapat mendaftarkan perintah bersarang di bawah induk inti seperti `openclaw nodes`. Setelah `inspect --runtime` menampilkan perintah di bawah `cliCommands`, jalankan di jalur yang tercantum; misalnya plugin yang mendaftarkan `demo-git` dapat diverifikasi dengan `openclaw demo-git ping`.

Setiap plugin diklasifikasikan berdasarkan apa yang benar-benar didaftarkannya saat runtime:

- **kapabilitas-biasa** — satu jenis kapabilitas (misalnya Plugin khusus penyedia)
- **kapabilitas-hibrida** — beberapa jenis kapabilitas (misalnya teks + ucapan + gambar)
- **hanya-hook** — hanya hook, tanpa kapabilitas atau permukaan
- **non-kapabilitas** — alat/perintah/layanan tetapi tanpa kapabilitas

Lihat [Bentuk Plugin](/id/plugins/architecture#plugin-shapes) untuk informasi selengkapnya tentang model kapabilitas.

<Note>
Flag `--json` menghasilkan laporan yang dapat dibaca mesin dan cocok untuk scripting serta audit. `inspect --all` merender tabel seluruh armada dengan kolom bentuk, jenis kapabilitas, pemberitahuan kompatibilitas, kapabilitas bundel, dan ringkasan hook. `info` adalah alias untuk `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` melaporkan kesalahan pemuatan Plugin, diagnostik manifest/discovery, dan pemberitahuan kompatibilitas. Jika semuanya bersih, perintah ini mencetak `No plugin issues detected.`

Jika Plugin yang dikonfigurasi ada di disk tetapi diblokir oleh pemeriksaan keamanan jalur loader, validasi config mempertahankan entri Plugin dan melaporkannya sebagai `present but blocked`. Perbaiki diagnostik Plugin yang diblokir sebelumnya, seperti kepemilikan jalur atau izin world-writable, alih-alih menghapus config `plugins.entries.<id>` atau `plugins.allow`.

Untuk kegagalan bentuk modul seperti ekspor `register`/`activate` yang hilang, jalankan ulang dengan `OPENCLAW_PLUGIN_LOAD_DEBUG=1` untuk menyertakan ringkasan bentuk ekspor yang ringkas dalam keluaran diagnostik.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Registry Plugin lokal adalah model baca dingin persisten OpenClaw untuk identitas Plugin terinstal, pengaktifan, metadata sumber, dan kepemilikan kontribusi. Startup normal, pencarian pemilik penyedia, klasifikasi penyiapan channel, dan inventaris Plugin dapat membacanya tanpa mengimpor modul runtime Plugin.

Gunakan `plugins registry` untuk memeriksa apakah registry persisten ada, terkini, atau basi. Gunakan `--refresh` untuk membangunnya ulang dari indeks Plugin persisten, kebijakan config, dan metadata manifest/package. Ini adalah jalur perbaikan, bukan jalur aktivasi runtime.

`openclaw doctor --fix` juga memperbaiki drift npm terkelola yang berdekatan dengan registry: jika package `@openclaw/*` yatim atau dipulihkan di bawah root npm Plugin terkelola membayangi Plugin bawaan, doctor menghapus package basi tersebut dan membangun ulang registry agar startup memvalidasi terhadap manifest bawaan. Doctor juga menautkan ulang package host `openclaw` ke Plugin npm terkelola yang mendeklarasikan `peerDependencies.openclaw`, sehingga impor runtime lokal package seperti `openclaw/plugin-sdk/*` terselesaikan setelah pembaruan atau perbaikan npm.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` adalah switch kompatibilitas darurat yang sudah tidak digunakan lagi untuk kegagalan baca registry. Utamakan `plugins registry --refresh` atau `openclaw doctor --fix`; fallback env hanya untuk pemulihan startup darurat saat migrasi diluncurkan.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Daftar marketplace menerima jalur marketplace lokal, jalur `marketplace.json`, shorthand GitHub seperti `owner/repo`, URL repo GitHub, atau URL git. `--json` mencetak label sumber yang diselesaikan beserta manifest marketplace dan entri Plugin yang diurai.

## Terkait

- [Membangun Plugin](/id/plugins/building-plugins)
- [Referensi CLI](/id/cli)
- [ClawHub](/id/clawhub)
