---
read_when:
    - Anda ingin menginstal atau mengelola Plugin Gateway atau bundel yang kompatibel
    - Anda ingin mendiagnosis kegagalan pemuatan Plugin
sidebarTitle: Plugins
summary: Referensi CLI untuk `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-05-07T13:14:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 73023d11309c5dc4fe9fab9cffc0f7d96de1e1c22ce1ec4d2cd22d2aa4808f1a
    source_path: cli/plugins.md
    workflow: 16
---

Kelola Plugin Gateway, paket hook, dan bundle yang kompatibel.

<CardGroup cols={2}>
  <Card title="Sistem Plugin" href="/id/tools/plugin">
    Panduan pengguna akhir untuk memasang, mengaktifkan, dan memecahkan masalah plugin.
  </Card>
  <Card title="Kelola plugin" href="/id/plugins/manage-plugins">
    Contoh cepat untuk memasang, mencantumkan, memperbarui, menghapus pemasangan, dan memublikasikan.
  </Card>
  <Card title="Bundle Plugin" href="/id/plugins/bundles">
    Model kompatibilitas bundle.
  </Card>
  <Card title="Manifest Plugin" href="/id/plugins/manifest">
    Bidang manifest dan skema konfigurasi.
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

Untuk investigasi pemasangan, inspeksi, penghapusan pemasangan, atau penyegaran registri yang lambat, jalankan
perintah dengan `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Trace menulis waktu fase
ke stderr dan menjaga output JSON tetap dapat diurai. Lihat [Debugging](/id/help/debugging#plugin-lifecycle-trace).

<Note>
Dalam mode Nix (`OPENCLAW_NIX_MODE=1`), mutator siklus hidup plugin dinonaktifkan. Gunakan sumber Nix untuk pemasangan ini, bukan `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable`, atau `plugins disable`; untuk nix-openclaw, gunakan [Mulai Cepat](https://github.com/openclaw/nix-openclaw#quick-start) yang mengutamakan agen.
</Note>

<Note>
Plugin bawaan dikirim bersama OpenClaw. Sebagian diaktifkan secara default (misalnya penyedia model bawaan, penyedia ucapan bawaan, dan plugin peramban bawaan); yang lain memerlukan `plugins enable`.

Plugin OpenClaw native harus menyertakan `openclaw.plugin.json` dengan JSON Schema inline (`configSchema`, meskipun kosong). Bundle yang kompatibel menggunakan manifest bundle mereka sendiri.

`plugins list` menampilkan `Format: openclaw` atau `Format: bundle`. Output daftar/info verbose juga menampilkan subtipe bundle (`codex`, `claude`, atau `cursor`) beserta kapabilitas bundle yang terdeteksi.
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

<Warning>
Nama paket polos dipasang dari npm secara default selama peralihan peluncuran. Gunakan `clawhub:<package>` untuk ClawHub. Perlakukan pemasangan plugin seperti menjalankan kode. Utamakan versi yang dipin.
</Warning>

`plugins search` mengueri ClawHub untuk paket plugin yang dapat dipasang dan mencetak
nama paket siap pasang. Perintah ini mencari paket plugin-kode dan plugin-bundle,
bukan skills. Gunakan `openclaw skills search` untuk Skills ClawHub.

<Note>
ClawHub adalah permukaan distribusi dan penemuan utama untuk sebagian besar plugin. Npm
tetap menjadi fallback yang didukung dan jalur pemasangan langsung. Paket plugin
`@openclaw/*` milik OpenClaw kembali dipublikasikan di npm; lihat daftar saat ini
di [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) atau
[inventaris plugin](/id/plugins/plugin-inventory). Pemasangan stabil menggunakan `latest`.
Pemasangan dan pembaruan kanal beta mengutamakan dist-tag npm `beta` ketika tag itu
tersedia, lalu fallback ke `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Include konfigurasi dan perbaikan konfigurasi tidak valid">
    Jika bagian `plugins` Anda didukung oleh `$include` satu file, `plugins install/update/enable/disable/uninstall` menulis langsung ke file include tersebut dan membiarkan `openclaw.json` tidak tersentuh. Include root, array include, dan include dengan override saudara gagal secara tertutup alih-alih diratakan. Lihat [Include konfigurasi](/id/gateway/configuration) untuk bentuk yang didukung.

    Jika konfigurasi tidak valid selama pemasangan, `plugins install` biasanya gagal secara tertutup dan meminta Anda menjalankan `openclaw doctor --fix` terlebih dahulu. Selama startup Gateway dan hot reload, konfigurasi plugin yang tidak valid gagal secara tertutup seperti konfigurasi tidak valid lainnya; `openclaw doctor --fix` dapat mengarantina entri plugin yang tidak valid. Satu-satunya pengecualian waktu pemasangan yang terdokumentasi adalah jalur pemulihan plugin bawaan yang sempit untuk plugin yang secara eksplisit ikut serta dalam `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force dan pemasangan ulang vs pembaruan">
    `--force` menggunakan ulang target pemasangan yang ada dan menimpa plugin atau paket hook yang sudah terpasang di tempat. Gunakan ini ketika Anda sengaja memasang ulang id yang sama dari path lokal, arsip, paket ClawHub, atau artefak npm baru. Untuk upgrade rutin plugin npm yang sudah dilacak, utamakan `openclaw plugins update <id-or-npm-spec>`.

    Jika Anda menjalankan `plugins install` untuk id plugin yang sudah terpasang, OpenClaw berhenti dan mengarahkan Anda ke `plugins update <id-or-npm-spec>` untuk upgrade normal, atau ke `plugins install <package> --force` ketika Anda benar-benar ingin menimpa pemasangan saat ini dari sumber berbeda.

  </Accordion>
  <Accordion title="Cakupan --pin">
    `--pin` hanya berlaku untuk pemasangan npm. Ini tidak didukung dengan pemasangan `git:`; gunakan ref git eksplisit seperti `git:github.com/acme/plugin@v1.2.3` ketika Anda menginginkan sumber yang dipin. Ini tidak didukung dengan `--marketplace`, karena pemasangan marketplace mempertahankan metadata sumber marketplace, bukan spec npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` adalah opsi darurat untuk positif palsu di pemindai kode berbahaya bawaan. Opsi ini memungkinkan pemasangan berlanjut meskipun pemindai bawaan melaporkan temuan `critical`, tetapi **tidak** melewati blok kebijakan hook `before_install` plugin dan **tidak** melewati kegagalan pemindaian.

    Flag CLI ini berlaku untuk alur pemasangan/pembaruan plugin. Pemasangan dependensi skill yang didukung Gateway menggunakan override permintaan `dangerouslyForceUnsafeInstall` yang sesuai, sedangkan `openclaw skills install` tetap menjadi alur unduh/pasang skill ClawHub yang terpisah.

    Jika plugin yang Anda publikasikan di ClawHub diblokir oleh pemindaian registri, gunakan langkah penerbit di [ClawHub](/id/tools/clawhub).

  </Accordion>
  <Accordion title="Paket hook dan spec npm">
    `plugins install` juga merupakan permukaan pemasangan untuk paket hook yang mengekspos `openclaw.hooks` di `package.json`. Gunakan `openclaw hooks` untuk visibilitas hook terfilter dan pengaktifan per hook, bukan pemasangan paket.

    Spec npm bersifat **hanya registri** (nama paket + **versi tepat** atau **dist-tag** opsional). Spec Git/URL/file dan rentang semver ditolak. Pemasangan dependensi berjalan lokal proyek dengan `--ignore-scripts` demi keamanan, bahkan ketika shell Anda memiliki pengaturan pemasangan npm global. Root npm plugin terkelola mewarisi `overrides` npm tingkat paket OpenClaw, sehingga pin keamanan host juga berlaku pada dependensi plugin yang di-hoist.

    Gunakan `npm:<package>` ketika Anda ingin membuat resolusi npm eksplisit. Spec paket polos juga dipasang langsung dari npm selama peralihan peluncuran.

    Spec polos dan `@latest` tetap berada di jalur stabil. Versi koreksi bertanggal OpenClaw seperti `2026.5.3-1` adalah rilis stabil untuk pemeriksaan ini. Jika npm me-resolve salah satu dari itu ke prerelease, OpenClaw berhenti dan meminta Anda ikut serta secara eksplisit dengan tag prerelease seperti `@beta`/`@rc` atau versi prerelease tepat seperti `@1.2.3-beta.4`.

    Jika spec pemasangan polos cocok dengan id plugin resmi (misalnya `diffs`), OpenClaw memasang entri katalog secara langsung. Untuk memasang paket npm dengan nama yang sama, gunakan spec scoped eksplisit (misalnya `@scope/diffs`).

  </Accordion>
  <Accordion title="Repositori Git">
    Gunakan `git:<repo>` untuk memasang langsung dari repositori git. Bentuk yang didukung mencakup `git:github.com/owner/repo`, `git:owner/repo`, URL klon lengkap `https://`, `ssh://`, `git://`, `file://`, dan `git@host:owner/repo.git`. Tambahkan `@<ref>` atau `#<ref>` untuk checkout branch, tag, atau commit sebelum pemasangan.

    Pemasangan Git mengklon ke direktori sementara, checkout ref yang diminta jika ada, lalu menggunakan pemasang direktori plugin normal. Artinya validasi manifest, pemindaian kode berbahaya, pekerjaan pemasangan package-manager, dan catatan pemasangan berperilaku seperti pemasangan npm. Pemasangan git yang tercatat menyertakan URL/ref sumber beserta commit yang di-resolve sehingga `openclaw plugins update` dapat me-resolve ulang sumber tersebut nanti.

    Setelah memasang dari git, gunakan `openclaw plugins inspect <id> --runtime --json` untuk memverifikasi registrasi runtime seperti metode gateway dan perintah CLI. Jika plugin mendaftarkan root CLI dengan `api.registerCli`, jalankan perintah tersebut langsung melalui CLI root OpenClaw, misalnya `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Arsip">
    Arsip yang didukung: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Arsip plugin OpenClaw native harus berisi `openclaw.plugin.json` yang valid di root plugin hasil ekstraksi; arsip yang hanya berisi `package.json` ditolak sebelum OpenClaw menulis catatan pemasangan.

    Gunakan `npm-pack:<path.tgz>` ketika file adalah tarball npm-pack dan Anda ingin
    menguji jalur pemasangan npm-root terkelola yang sama dengan yang digunakan pemasangan registri,
    termasuk verifikasi `package-lock.json`, pemindaian dependensi yang di-hoist, dan
    catatan pemasangan npm. Path arsip biasa tetap dipasang sebagai arsip lokal
    di bawah root ekstensi plugin.

    Pemasangan marketplace Claude juga didukung.

  </Accordion>
</AccordionGroup>

Pemasangan ClawHub menggunakan locator `clawhub:<package>` yang eksplisit:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Spec plugin yang aman untuk npm dan polos dipasang dari npm secara default selama peralihan peluncuran:

```bash
openclaw plugins install openclaw-codex-app-server
```

Gunakan `npm:` untuk membuat resolusi khusus npm eksplisit:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw memeriksa API Plugin yang diiklankan / kompatibilitas Gateway minimum sebelum pemasangan. Ketika versi ClawHub yang dipilih menerbitkan artefak ClawPack, OpenClaw mengunduh `.tgz` npm-pack berversi, memverifikasi header digest ClawHub dan digest artefak, lalu memasangnya melalui jalur arsip normal. Versi ClawHub lama tanpa metadata ClawPack tetap dipasang melalui jalur verifikasi arsip paket lama. Pemasangan yang direkam menyimpan metadata sumber ClawHub, jenis artefak, integritas npm, shasum npm, nama tarball, dan fakta digest ClawPack untuk pembaruan berikutnya.
Pemasangan ClawHub tanpa versi menyimpan spesifikasi rekaman tanpa versi sehingga `openclaw plugins update` dapat mengikuti rilis ClawHub yang lebih baru; pemilih versi atau tag eksplisit seperti `clawhub:pkg@1.2.3` dan `clawhub:pkg@beta` tetap dipatok ke pemilih tersebut.

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
    - nama Claude known-marketplace dari `~/.claude/plugins/known_marketplaces.json`
    - root marketplace lokal atau path `marketplace.json`
    - singkatan repo GitHub seperti `owner/repo`
    - URL repo GitHub seperti `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="Aturan marketplace jarak jauh">
    Untuk marketplace jarak jauh yang dimuat dari GitHub atau git, entri Plugin harus tetap berada di dalam repo marketplace yang dikloning. OpenClaw menerima sumber path relatif dari repo tersebut dan menolak sumber Plugin HTTP(S), path absolut, git, GitHub, dan sumber Plugin non-path lainnya dari manifest jarak jauh.
  </Tab>
</Tabs>

Untuk path dan arsip lokal, OpenClaw mendeteksi otomatis:

- Plugin OpenClaw native (`openclaw.plugin.json`)
- bundel yang kompatibel dengan Codex (`.codex-plugin/plugin.json`)
- bundel yang kompatibel dengan Claude (`.claude-plugin/plugin.json` atau tata letak komponen Claude default)
- bundel yang kompatibel dengan Cursor (`.cursor-plugin/plugin.json`)

<Note>
Bundel yang kompatibel dipasang ke root Plugin normal dan ikut dalam alur list/info/enable/disable yang sama. Saat ini, Skills bundel, Skills perintah Claude, default Claude `settings.json`, default Claude `.lsp.json` / `lspServers` yang dideklarasikan manifest, Skills perintah Cursor, dan direktori hook Codex yang kompatibel didukung; kemampuan bundel lain yang terdeteksi ditampilkan dalam diagnostik/info tetapi belum dihubungkan ke eksekusi runtime.
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
  Inventaris yang dapat dibaca mesin beserta diagnostik registri dan status pemasangan dependensi paket.
</ParamField>

<Note>
`plugins list` membaca registri Plugin lokal yang dipersist terlebih dahulu, dengan fallback turunan hanya manifest ketika registri hilang atau tidak valid. Ini berguna untuk memeriksa apakah suatu Plugin terpasang, diaktifkan, dan terlihat oleh perencanaan startup dingin, tetapi bukan probe runtime langsung terhadap proses Gateway yang sudah berjalan. Setelah mengubah kode Plugin, pengaktifan, kebijakan hook, atau `plugins.load.paths`, mulai ulang Gateway yang melayani channel sebelum mengharapkan kode atau hook `register(api)` baru berjalan. Untuk deployment jarak jauh/container, pastikan Anda memulai ulang child `openclaw gateway run` yang sebenarnya, bukan hanya proses wrapper.

`plugins list --json` menyertakan `dependencyStatus` setiap Plugin dari `package.json`
`dependencies` dan `optionalDependencies`. OpenClaw memeriksa apakah nama paket tersebut ada di sepanjang path lookup Node `node_modules` normal milik Plugin; OpenClaw tidak mengimpor kode runtime Plugin, menjalankan package manager, atau memperbaiki dependensi yang hilang.
</Note>

`plugins search` adalah lookup katalog ClawHub jarak jauh. Perintah ini tidak memeriksa status lokal, mengubah konfigurasi, memasang paket, atau memuat kode runtime Plugin. Hasil pencarian menyertakan nama paket ClawHub, family, channel, versi, ringkasan, dan petunjuk pemasangan seperti `openclaw plugins install clawhub:<package>`.

Untuk pekerjaan Plugin bawaan di dalam image Docker yang dipaketkan, bind-mount direktori sumber Plugin di atas path sumber terpaket yang cocok, seperti `/app/extensions/synology-chat`. OpenClaw akan menemukan overlay sumber yang di-mount tersebut sebelum `/app/dist/extensions/synology-chat`; direktori sumber yang hanya disalin tetap inert sehingga pemasangan terpaket normal tetap menggunakan dist yang dikompilasi.

Untuk debugging hook runtime:

- `openclaw plugins inspect <id> --runtime --json` menampilkan hook terdaftar dan diagnostik dari pass inspeksi yang memuat modul. Inspeksi runtime tidak pernah memasang dependensi; gunakan `openclaw doctor --fix` untuk membersihkan status dependensi lama atau memulihkan Plugin unduhan yang hilang yang direferensikan oleh konfigurasi.
- `openclaw gateway status --deep --require-rpc` mengonfirmasi Gateway yang dapat dijangkau, petunjuk layanan/proses, path konfigurasi, dan kesehatan RPC.
- Hook percakapan non-bawaan (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) memerlukan `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Gunakan `--link` untuk menghindari penyalinan direktori lokal (menambahkan ke `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` tidak didukung bersama `--link` karena pemasangan tertaut menggunakan ulang path sumber alih-alih menyalin ke target pemasangan terkelola.

Gunakan `--pin` pada pemasangan npm untuk menyimpan spesifikasi eksak yang diselesaikan (`name@version`) dalam indeks Plugin terkelola sambil mempertahankan perilaku default tanpa pin.
</Note>

### Indeks Plugin

Metadata pemasangan Plugin adalah status yang dikelola mesin, bukan konfigurasi pengguna. Pemasangan dan pembaruan menuliskannya ke `plugins/installs.json` di bawah direktori status OpenClaw aktif. Map tingkat atas `installRecords` adalah sumber metadata pemasangan yang durable, termasuk rekaman untuk manifest Plugin yang rusak atau hilang. Array `plugins` adalah cache registri dingin turunan manifest. File ini menyertakan peringatan jangan diedit dan digunakan oleh `openclaw plugins update`, uninstall, diagnostik, dan registri Plugin dingin.

Ketika OpenClaw melihat rekaman lama bawaan `plugins.installs` dalam konfigurasi, pembacaan runtime memperlakukannya sebagai input kompatibilitas tanpa menulis ulang `openclaw.json`. Penulisan Plugin eksplisit dan `openclaw doctor --fix` memindahkan rekaman tersebut ke indeks Plugin dan menghapus key konfigurasi ketika penulisan konfigurasi diizinkan; jika salah satu penulisan gagal, rekaman konfigurasi dipertahankan agar metadata pemasangan tidak hilang.

### Copot pemasangan

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` menghapus rekaman Plugin dari `plugins.entries`, indeks Plugin yang dipersist, entri daftar allow/deny Plugin, dan entri `plugins.load.paths` tertaut bila berlaku. Kecuali `--keep-files` disetel, uninstall juga menghapus direktori pemasangan terkelola yang dilacak ketika berada di dalam root ekstensi Plugin OpenClaw. Untuk Plugin Active Memory, slot memori direset ke `memory-core`.

<Note>
`--keep-config` didukung sebagai alias usang untuk `--keep-files`.
</Note>

### Perbarui

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Pembaruan berlaku untuk pemasangan Plugin yang dilacak dalam indeks Plugin terkelola dan pemasangan hook-pack yang dilacak di `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Menyelesaikan id Plugin vs spesifikasi npm">
    Ketika Anda meneruskan id Plugin, OpenClaw menggunakan ulang spesifikasi pemasangan yang direkam untuk Plugin tersebut. Artinya, dist-tag yang sebelumnya disimpan seperti `@beta` dan versi pin eksak tetap digunakan pada eksekusi `update <id>` berikutnya.

    Untuk pemasangan npm, Anda juga dapat meneruskan spesifikasi paket npm eksplisit dengan dist-tag atau versi eksak. OpenClaw menyelesaikan nama paket tersebut kembali ke rekaman Plugin yang dilacak, memperbarui Plugin terpasang itu, dan merekam spesifikasi npm baru untuk pembaruan berbasis id di masa mendatang.

    Meneruskan nama paket npm tanpa versi atau tag juga diselesaikan kembali ke rekaman Plugin yang dilacak. Gunakan ini ketika sebuah Plugin dipin ke versi eksak dan Anda ingin memindahkannya kembali ke lini rilis default registri.

  </Accordion>
  <Accordion title="Pembaruan channel beta">
    `openclaw plugins update` menggunakan ulang spesifikasi Plugin yang dilacak kecuali Anda meneruskan spesifikasi baru. `openclaw update` juga mengetahui channel pembaruan OpenClaw aktif: pada channel beta, rekaman Plugin npm dan ClawHub lini default mencoba `@beta` terlebih dahulu, lalu fallback ke spesifikasi default/latest yang direkam jika tidak ada rilis beta Plugin. Versi eksak dan tag eksplisit tetap dipatok ke pemilih tersebut.

  </Accordion>
  <Accordion title="Pemeriksaan versi dan drift integritas">
    Sebelum pembaruan npm langsung, OpenClaw memeriksa versi paket terpasang terhadap metadata registri npm. Jika versi terpasang dan identitas artefak yang direkam sudah cocok dengan target yang diselesaikan, pembaruan dilewati tanpa mengunduh, memasang ulang, atau menulis ulang `openclaw.json`.

    Ketika hash integritas tersimpan ada dan hash artefak yang diambil berubah, OpenClaw memperlakukannya sebagai drift artefak npm. Perintah interaktif `openclaw plugins update` mencetak hash yang diharapkan dan aktual lalu meminta konfirmasi sebelum melanjutkan. Helper pembaruan non-interaktif gagal tertutup kecuali caller menyediakan kebijakan kelanjutan eksplisit.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install pada pembaruan">
    `--dangerously-force-unsafe-install` juga tersedia pada `plugins update` sebagai override darurat untuk false positive pemindaian kode berbahaya bawaan selama pembaruan Plugin. Ini tetap tidak melewati blok kebijakan `before_install` Plugin atau pemblokiran kegagalan pemindaian, dan hanya berlaku untuk pembaruan Plugin, bukan pembaruan hook-pack.
  </Accordion>
</AccordionGroup>

### Periksa

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect menampilkan identitas, status pemuatan, sumber, kemampuan manifest, flag kebijakan, diagnostik, metadata pemasangan, kemampuan bundel, dan dukungan server MCP atau LSP apa pun yang terdeteksi tanpa mengimpor runtime Plugin secara default. Tambahkan `--runtime` untuk memuat modul Plugin dan menyertakan hook, tool, perintah, layanan, metode gateway, dan route HTTP terdaftar. Inspeksi runtime melaporkan dependensi Plugin yang hilang secara langsung; pemasangan dan perbaikan tetap berada di `openclaw plugins install`, `openclaw plugins update`, dan `openclaw doctor --fix`.

Perintah CLI milik Plugin biasanya dipasang sebagai grup perintah root `openclaw`, tetapi Plugin juga dapat mendaftarkan perintah bersarang di bawah induk inti seperti `openclaw nodes`. Setelah `inspect --runtime` menampilkan perintah di bawah `cliCommands`, jalankan perintah tersebut pada path yang tercantum; misalnya Plugin yang mendaftarkan `demo-git` dapat diverifikasi dengan `openclaw demo-git ping`.

Setiap Plugin diklasifikasikan berdasarkan apa yang benar-benar didaftarkannya saat runtime:

- **plain-capability** — satu jenis kapabilitas (mis. Plugin khusus penyedia)
- **hybrid-capability** — beberapa jenis kapabilitas (mis. teks + ucapan + gambar)
- **hook-only** — hanya hook, tanpa kapabilitas atau surface
- **non-capability** — alat/perintah/layanan tetapi tanpa kapabilitas

Lihat [Bentuk Plugin](/id/plugins/architecture#plugin-shapes) untuk informasi lebih lanjut tentang model kapabilitas.

<Note>
Flag `--json` menghasilkan laporan yang dapat dibaca mesin dan cocok untuk skrip serta audit. `inspect --all` merender tabel seluruh fleet dengan kolom bentuk, jenis kapabilitas, pemberitahuan kompatibilitas, kapabilitas bundle, dan ringkasan hook. `info` adalah alias untuk `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` melaporkan galat pemuatan Plugin, diagnostik manifest/discovery, dan pemberitahuan kompatibilitas. Ketika semuanya bersih, perintah ini mencetak `No plugin issues detected.`

Jika Plugin yang dikonfigurasi ada di disk tetapi diblokir oleh pemeriksaan keamanan path milik loader, validasi konfigurasi mempertahankan entri Plugin dan melaporkannya sebagai `present but blocked`. Perbaiki diagnostik Plugin yang diblokir sebelumnya, seperti kepemilikan path atau izin world-writable, alih-alih menghapus konfigurasi `plugins.entries.<id>` atau `plugins.allow`.

Untuk kegagalan bentuk modul seperti ekspor `register`/`activate` yang hilang, jalankan ulang dengan `OPENCLAW_PLUGIN_LOAD_DEBUG=1` untuk menyertakan ringkasan bentuk ekspor yang ringkas dalam keluaran diagnostik.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Registry Plugin lokal adalah model baca dingin persisten OpenClaw untuk identitas Plugin terpasang, pengaktifan, metadata sumber, dan kepemilikan kontribusi. Startup normal, pencarian pemilik penyedia, klasifikasi penyiapan channel, dan inventaris Plugin dapat membacanya tanpa mengimpor modul runtime Plugin.

Gunakan `plugins registry` untuk memeriksa apakah registry persisten ada, terkini, atau kedaluwarsa. Gunakan `--refresh` untuk membangunnya ulang dari indeks Plugin persisten, kebijakan konfigurasi, dan metadata manifest/package. Ini adalah jalur perbaikan, bukan jalur aktivasi runtime.

`openclaw doctor --fix` juga memperbaiki drift npm terkelola yang berdekatan dengan registry: jika package `@openclaw/*` yang yatim atau dipulihkan di bawah root npm Plugin terkelola menutupi Plugin bundle, doctor menghapus package usang tersebut dan membangun ulang registry agar startup memvalidasi terhadap manifest bundle.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` adalah switch kompatibilitas break-glass yang sudah deprecated untuk kegagalan baca registry. Utamakan `plugins registry --refresh` atau `openclaw doctor --fix`; fallback env hanya untuk pemulihan startup darurat saat migrasi diluncurkan.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Daftar Marketplace menerima path marketplace lokal, path `marketplace.json`, singkatan GitHub seperti `owner/repo`, URL repo GitHub, atau URL git. `--json` mencetak label sumber yang diselesaikan beserta manifest marketplace yang di-parse dan entri Plugin.

## Terkait

- [Membangun Plugin](/id/plugins/building-plugins)
- [Referensi CLI](/id/cli)
- [Plugin komunitas](/id/plugins/community)
