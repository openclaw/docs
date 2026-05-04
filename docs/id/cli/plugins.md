---
read_when:
    - Anda ingin memasang atau mengelola Plugin Gateway atau bundel yang kompatibel
    - Anda ingin men-debug kegagalan pemuatan Plugin
sidebarTitle: Plugins
summary: Referensi CLI untuk `openclaw plugins` (daftar, instal, marketplace, hapus instalasi, aktifkan/nonaktifkan, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-05-04T09:33:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: f561ce098181b07f25db3520b1726162863469ac05fb4a3e786915257d97c9a4
    source_path: cli/plugins.md
    workflow: 16
---

Kelola Plugin Gateway, paket hook, dan bundle yang kompatibel.

<CardGroup cols={2}>
  <Card title="Sistem Plugin" href="/id/tools/plugin">
    Panduan pengguna akhir untuk menginstal, mengaktifkan, dan memecahkan masalah Plugin.
  </Card>
  <Card title="Kelola Plugin" href="/id/plugins/manage-plugins">
    Contoh cepat untuk install, list, update, uninstall, dan penerbitan.
  </Card>
  <Card title="Bundle Plugin" href="/id/plugins/bundles">
    Model kompatibilitas bundle.
  </Card>
  <Card title="Manifest Plugin" href="/id/plugins/manifest">
    Bidang manifest dan skema konfigurasi.
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

Untuk investigasi instalasi, inspeksi, uninstall, atau penyegaran registri yang lambat, jalankan
perintah dengan `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Trace menulis waktu fase
ke stderr dan menjaga keluaran JSON tetap dapat diurai. Lihat [Debugging](/id/help/debugging#plugin-lifecycle-trace).

<Note>
Plugin bawaan dikirim bersama OpenClaw. Beberapa diaktifkan secara default (misalnya penyedia model bawaan, penyedia ucapan bawaan, dan Plugin browser bawaan); yang lain memerlukan `plugins enable`.

Plugin OpenClaw native harus mengirim `openclaw.plugin.json` dengan JSON Schema inline (`configSchema`, meskipun kosong). Bundle kompatibel menggunakan manifest bundle mereka sendiri sebagai gantinya.

`plugins list` menampilkan `Format: openclaw` atau `Format: bundle`. Keluaran list/info verbose juga menampilkan subtipe bundle (`codex`, `claude`, atau `cursor`) beserta kemampuan bundle yang terdeteksi.
</Note>

### Install

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
Nama paket polos diinstal dari npm secara default selama peralihan peluncuran. Gunakan `clawhub:<package>` untuk ClawHub. Perlakukan instalasi Plugin seperti menjalankan kode. Utamakan versi yang dipin.
</Warning>

`plugins search` mengueri ClawHub untuk paket Plugin yang dapat diinstal dan mencetak
nama paket yang siap diinstal. Ini mencari paket code-plugin dan bundle-plugin,
bukan Skills. Gunakan `openclaw skills search` untuk Skills ClawHub.

<Note>
ClawHub adalah permukaan distribusi dan penemuan utama untuk sebagian besar Plugin. Npm
tetap menjadi fallback dan jalur instalasi langsung yang didukung. Paket Plugin milik OpenClaw
`@openclaw/*` diterbitkan kembali di npm; lihat daftar saat ini
di [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) atau
[inventaris Plugin](/id/plugins/plugin-inventory). Instalasi stabil menggunakan `latest`.
Instalasi dan pembaruan kanal beta mengutamakan dist-tag npm `beta` ketika tag tersebut
tersedia, lalu fallback ke `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Config includes and invalid-config repair">
    Jika bagian `plugins` Anda didukung oleh `$include` satu file, `plugins install/update/enable/disable/uninstall` menulis melalui file yang disertakan tersebut dan membiarkan `openclaw.json` tidak berubah. Include root, array include, dan include dengan override saudara gagal secara tertutup alih-alih diratakan. Lihat [Include konfigurasi](/id/gateway/configuration) untuk bentuk yang didukung.

    Jika konfigurasi tidak valid saat instalasi, `plugins install` biasanya gagal secara tertutup dan meminta Anda menjalankan `openclaw doctor --fix` terlebih dahulu. Selama startup Gateway dan hot reload, konfigurasi Plugin yang tidak valid gagal secara tertutup seperti konfigurasi tidak valid lainnya; `openclaw doctor --fix` dapat mengarantina entri Plugin yang tidak valid. Satu-satunya pengecualian waktu instalasi yang terdokumentasi adalah jalur pemulihan sempit untuk Plugin bawaan bagi Plugin yang secara eksplisit memilih ikut ke `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force and reinstall vs update">
    `--force` menggunakan kembali target instalasi yang ada dan menimpa Plugin atau paket hook yang sudah terinstal di tempat. Gunakan ketika Anda sengaja menginstal ulang id yang sama dari jalur lokal, arsip, paket ClawHub, atau artefak npm baru. Untuk peningkatan rutin Plugin npm yang sudah dilacak, utamakan `openclaw plugins update <id-or-npm-spec>`.

    Jika Anda menjalankan `plugins install` untuk id Plugin yang sudah terinstal, OpenClaw berhenti dan mengarahkan Anda ke `plugins update <id-or-npm-spec>` untuk peningkatan normal, atau ke `plugins install <package> --force` ketika Anda benar-benar ingin menimpa instalasi saat ini dari sumber lain.

  </Accordion>
  <Accordion title="--pin scope">
    `--pin` hanya berlaku untuk instalasi npm. Ini tidak didukung dengan instalasi `git:`; gunakan ref git eksplisit seperti `git:github.com/acme/plugin@v1.2.3` ketika Anda menginginkan sumber yang dipin. Ini tidak didukung dengan `--marketplace`, karena instalasi marketplace mempertahankan metadata sumber marketplace alih-alih spesifikasi npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` adalah opsi darurat untuk false positive dalam pemindai kode berbahaya bawaan. Ini memungkinkan instalasi berlanjut bahkan ketika pemindai bawaan melaporkan temuan `critical`, tetapi **tidak** melewati blok kebijakan hook `before_install` Plugin dan **tidak** melewati kegagalan pemindaian.

    Flag CLI ini berlaku untuk alur install/update Plugin. Instalasi dependensi skill yang didukung Gateway menggunakan override permintaan `dangerouslyForceUnsafeInstall` yang sesuai, sementara `openclaw skills install` tetap merupakan alur unduh/install skill ClawHub yang terpisah.

    Jika Plugin yang Anda terbitkan di ClawHub diblokir oleh pemindaian registri, gunakan langkah penerbit di [ClawHub](/id/tools/clawhub).

  </Accordion>
  <Accordion title="Hook packs and npm specs">
    `plugins install` juga merupakan permukaan instalasi untuk paket hook yang mengekspos `openclaw.hooks` di `package.json`. Gunakan `openclaw hooks` untuk visibilitas hook terfilter dan pengaktifan per hook, bukan instalasi paket.

    Spesifikasi npm **hanya registri** (nama paket + **versi persis** opsional atau **dist-tag**). Spesifikasi Git/URL/file dan rentang semver ditolak. Instalasi dependensi berjalan secara lokal proyek dengan `--ignore-scripts` demi keamanan, meskipun shell Anda memiliki pengaturan install npm global.

    Gunakan `npm:<package>` ketika Anda ingin membuat resolusi npm eksplisit. Spesifikasi paket polos juga diinstal langsung dari npm selama peralihan peluncuran.

    Spesifikasi polos dan `@latest` tetap berada di jalur stabil. Versi koreksi bertanggal OpenClaw seperti `2026.5.3-1` adalah rilis stabil untuk pemeriksaan ini. Jika npm menyelesaikan salah satunya ke prerelease, OpenClaw berhenti dan meminta Anda memilih ikut secara eksplisit dengan tag prerelease seperti `@beta`/`@rc` atau versi prerelease persis seperti `@1.2.3-beta.4`.

    Jika spesifikasi install polos cocok dengan id Plugin resmi (misalnya `diffs`), OpenClaw menginstal entri katalog secara langsung. Untuk menginstal paket npm dengan nama yang sama, gunakan spesifikasi scoped eksplisit (misalnya `@scope/diffs`).

  </Accordion>
  <Accordion title="Git repositories">
    Gunakan `git:<repo>` untuk menginstal langsung dari repositori git. Bentuk yang didukung mencakup `git:github.com/owner/repo`, `git:owner/repo`, URL clone penuh `https://`, `ssh://`, `git://`, `file://`, dan `git@host:owner/repo.git`. Tambahkan `@<ref>` atau `#<ref>` untuk check out branch, tag, atau commit sebelum instalasi.

    Instalasi Git meng-clone ke direktori sementara, check out ref yang diminta jika ada, lalu menggunakan installer direktori Plugin normal. Itu berarti validasi manifest, pemindaian kode berbahaya, pekerjaan install package-manager, dan catatan instalasi berperilaku seperti instalasi npm. Instalasi git yang tercatat mencakup URL/ref sumber plus commit yang di-resolve sehingga `openclaw plugins update` dapat me-resolve ulang sumber nanti.

    Setelah menginstal dari git, gunakan `openclaw plugins inspect <id> --runtime --json` untuk memverifikasi registrasi runtime seperti metode Gateway dan perintah CLI. Jika Plugin mendaftarkan root CLI dengan `api.registerCli`, jalankan perintah itu langsung melalui CLI root OpenClaw, misalnya `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archives">
    Arsip yang didukung: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Arsip Plugin OpenClaw native harus berisi `openclaw.plugin.json` yang valid di root Plugin yang diekstrak; arsip yang hanya berisi `package.json` ditolak sebelum OpenClaw menulis catatan instalasi.

    Instalasi marketplace Claude juga didukung.

  </Accordion>
</AccordionGroup>

Instalasi ClawHub menggunakan locator eksplisit `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Spesifikasi Plugin aman npm polos diinstal dari npm secara default selama peralihan peluncuran:

```bash
openclaw plugins install openclaw-codex-app-server
```

Gunakan `npm:` untuk membuat resolusi khusus npm eksplisit:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw memeriksa API Plugin yang diiklankan / kompatibilitas Gateway minimum sebelum instalasi. Ketika versi ClawHub yang dipilih menerbitkan artefak ClawPack, OpenClaw mengunduh `.tgz` npm-pack berversi, memverifikasi header digest ClawHub dan digest artefak, lalu menginstalnya melalui jalur arsip normal. Versi ClawHub lama tanpa metadata ClawPack tetap diinstal melalui jalur verifikasi arsip paket legacy. Instalasi yang tercatat mempertahankan metadata sumber ClawHub, jenis artefak, integritas npm, shasum npm, nama tarball, dan fakta digest ClawPack untuk pembaruan berikutnya.
Instalasi ClawHub tanpa versi mempertahankan spesifikasi tercatat tanpa versi sehingga `openclaw plugins update` dapat mengikuti rilis ClawHub yang lebih baru; pemilih versi atau tag eksplisit seperti `clawhub:pkg@1.2.3` dan `clawhub:pkg@beta` tetap dipin ke pemilih tersebut.

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
    - nama marketplace Claude yang diketahui dari `~/.claude/plugins/known_marketplaces.json`
    - root marketplace lokal atau jalur `marketplace.json`
    - singkatan repo GitHub seperti `owner/repo`
    - URL repo GitHub seperti `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="Remote marketplace rules">
    Untuk marketplace jarak jauh yang dimuat dari GitHub atau git, entri plugin harus tetap berada di dalam repo marketplace hasil kloning. OpenClaw menerima sumber jalur relatif dari repo tersebut dan menolak sumber plugin HTTP(S), jalur absolut, git, GitHub, dan sumber plugin non-jalur lainnya dari manifes jarak jauh.
  </Tab>
</Tabs>

Untuk jalur lokal dan arsip, OpenClaw mendeteksi otomatis:

- Plugin OpenClaw native (`openclaw.plugin.json`)
- bundel yang kompatibel dengan Codex (`.codex-plugin/plugin.json`)
- bundel yang kompatibel dengan Claude (`.claude-plugin/plugin.json` atau tata letak komponen Claude default)
- bundel yang kompatibel dengan Cursor (`.cursor-plugin/plugin.json`)

<Note>
Bundel yang kompatibel dipasang ke root plugin normal dan ikut serta dalam alur daftar/info/aktifkan/nonaktifkan yang sama. Saat ini, Skills bundel, command-skills Claude, default `settings.json` Claude, default `.lsp.json` Claude / `lspServers` yang dideklarasikan manifes, command-skills Cursor, dan direktori hook Codex yang kompatibel didukung; kapabilitas bundel terdeteksi lainnya ditampilkan dalam diagnostik/info tetapi belum dihubungkan ke eksekusi runtime.
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
  Inventaris yang dapat dibaca mesin plus diagnostik registri dan status pemasangan dependensi paket.
</ParamField>

<Note>
`plugins list` membaca registri plugin lokal yang tersimpan terlebih dahulu, dengan fallback turunan berbasis manifes saja saat registri hilang atau tidak valid. Ini berguna untuk memeriksa apakah plugin terpasang, diaktifkan, dan terlihat oleh perencanaan startup dingin, tetapi ini bukan probe runtime langsung terhadap proses Gateway yang sudah berjalan. Setelah mengubah kode plugin, status aktif, kebijakan hook, atau `plugins.load.paths`, mulai ulang Gateway yang melayani channel sebelum mengharapkan kode `register(api)` atau hook baru berjalan. Untuk deployment jarak jauh/container, pastikan Anda memulai ulang child `openclaw gateway run` yang sebenarnya, bukan hanya proses wrapper.

`plugins list --json` menyertakan `dependencyStatus` setiap plugin dari `package.json`
`dependencies` dan `optionalDependencies`. OpenClaw memeriksa apakah nama paket tersebut
ada di sepanjang jalur pencarian Node `node_modules` normal milik plugin; ini
tidak mengimpor kode runtime plugin, menjalankan package manager, atau memperbaiki
dependensi yang hilang.
</Note>

`plugins search` adalah pencarian katalog ClawHub jarak jauh. Ini tidak memeriksa state lokal, mengubah config, memasang paket, atau memuat kode runtime plugin. Hasil pencarian menyertakan nama paket ClawHub, family, channel, versi, ringkasan, dan petunjuk pemasangan seperti `openclaw plugins install clawhub:<package>`.

Untuk pekerjaan plugin bawaan di dalam image Docker terpaket, bind-mount direktori sumber plugin di atas jalur sumber terpaket yang cocok, seperti `/app/extensions/synology-chat`. OpenClaw akan menemukan overlay sumber ter-mount tersebut sebelum `/app/dist/extensions/synology-chat`; direktori sumber yang sekadar disalin tetap inert sehingga pemasangan terpaket normal masih menggunakan dist terkompilasi.

Untuk debugging hook runtime:

- `openclaw plugins inspect <id> --runtime --json` menampilkan hook terdaftar dan diagnostik dari pass inspeksi yang memuat modul. Inspeksi runtime tidak pernah memasang dependensi; gunakan `openclaw doctor --fix` untuk membersihkan state dependensi legacy atau memasang plugin unduhan terkonfigurasi yang hilang.
- `openclaw gateway status --deep --require-rpc` mengonfirmasi Gateway yang dapat dijangkau, petunjuk service/proses, jalur config, dan kesehatan RPC.
- Hook percakapan non-bawaan (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) memerlukan `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Gunakan `--link` untuk menghindari penyalinan direktori lokal (menambahkan ke `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` tidak didukung dengan `--link` karena pemasangan tertaut menggunakan ulang jalur sumber alih-alih menyalin ke atas target pemasangan terkelola.

Gunakan `--pin` pada pemasangan npm untuk menyimpan spec persis yang diselesaikan (`name@version`) di indeks plugin terkelola sambil mempertahankan perilaku default tidak dipin.
</Note>

### Indeks Plugin

Metadata pemasangan plugin adalah state yang dikelola mesin, bukan config pengguna. Pemasangan dan pembaruan menuliskannya ke `plugins/installs.json` di bawah direktori state OpenClaw aktif. Map `installRecords` tingkat atasnya adalah sumber tahan lama untuk metadata pemasangan, termasuk record untuk manifes plugin yang rusak atau hilang. Array `plugins` adalah cache registri dingin yang diturunkan dari manifes. File ini menyertakan peringatan jangan diedit dan digunakan oleh `openclaw plugins update`, uninstall, diagnostik, dan registri plugin dingin.

Saat OpenClaw melihat record `plugins.installs` legacy terkirim dalam config, OpenClaw memindahkannya ke indeks plugin dan menghapus key config; jika salah satu penulisan gagal, record config dipertahankan agar metadata pemasangan tidak hilang.

### Uninstall

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` menghapus record plugin dari `plugins.entries`, indeks plugin tersimpan, entri daftar allow/deny plugin, dan entri `plugins.load.paths` tertaut saat berlaku. Kecuali `--keep-files` ditetapkan, uninstall juga menghapus direktori pemasangan terkelola terlacak saat berada di dalam root ekstensi plugin OpenClaw. Untuk plugin memori aktif, slot memori direset ke `memory-core`.

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

Pembaruan berlaku untuk pemasangan plugin terlacak di indeks plugin terkelola dan pemasangan hook-pack terlacak di `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Resolving plugin id vs npm spec">
    Saat Anda meneruskan id plugin, OpenClaw menggunakan ulang spec pemasangan yang tercatat untuk plugin tersebut. Itu berarti dist-tag yang sebelumnya tersimpan seperti `@beta` dan versi persis yang dipin terus digunakan pada proses `update <id>` berikutnya.

    Untuk pemasangan npm, Anda juga dapat meneruskan spec paket npm eksplisit dengan dist-tag atau versi persis. OpenClaw menyelesaikan nama paket tersebut kembali ke record plugin terlacak, memperbarui plugin terpasang tersebut, dan mencatat spec npm baru untuk pembaruan berbasis id di masa mendatang.

    Meneruskan nama paket npm tanpa versi atau tag juga diselesaikan kembali ke record plugin terlacak. Gunakan ini saat plugin dipin ke versi persis dan Anda ingin memindahkannya kembali ke jalur rilis default registri.

  </Accordion>
  <Accordion title="Beta channel updates">
    `openclaw plugins update` menggunakan ulang spec plugin terlacak kecuali Anda meneruskan spec baru. `openclaw update` juga mengetahui channel pembaruan OpenClaw aktif: pada channel beta, record plugin npm dan ClawHub jalur default mencoba `@beta` terlebih dahulu, lalu fallback ke spec default/latest yang tercatat jika tidak ada rilis beta plugin. Versi persis dan tag eksplisit tetap dipin ke selector tersebut.

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    Sebelum pembaruan npm live, OpenClaw memeriksa versi paket terpasang terhadap metadata registry npm. Jika versi terpasang dan identitas artefak tercatat sudah cocok dengan target yang diselesaikan, pembaruan dilewati tanpa mengunduh, memasang ulang, atau menulis ulang `openclaw.json`.

    Saat hash integritas tersimpan ada dan hash artefak yang diambil berubah, OpenClaw memperlakukannya sebagai drift artefak npm. Perintah interaktif `openclaw plugins update` mencetak hash yang diharapkan dan aktual serta meminta konfirmasi sebelum melanjutkan. Helper pembaruan non-interaktif gagal tertutup kecuali pemanggil menyediakan kebijakan kelanjutan eksplisit.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install` juga tersedia pada `plugins update` sebagai override darurat untuk false positive pemindaian kode berbahaya bawaan selama pembaruan plugin. Ini tetap tidak melewati blok kebijakan `before_install` plugin atau pemblokiran kegagalan pemindaian, dan hanya berlaku untuk pembaruan plugin, bukan pembaruan hook-pack.
  </Accordion>
</AccordionGroup>

### Inspeksi

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect menampilkan identitas, status muat, sumber, kapabilitas manifes, flag kebijakan, diagnostik, metadata pemasangan, kapabilitas bundel, dan dukungan server MCP atau LSP apa pun yang terdeteksi tanpa mengimpor runtime plugin secara default. Tambahkan `--runtime` untuk memuat modul plugin dan menyertakan hook, tools, commands, services, metode gateway, dan rute HTTP terdaftar. Inspeksi runtime melaporkan dependensi plugin yang hilang secara langsung; pemasangan dan perbaikan tetap berada di `openclaw plugins install`, `openclaw plugins update`, dan `openclaw doctor --fix`.

Perintah CLI milik plugin dipasang sebagai grup perintah root `openclaw`. Setelah `inspect --runtime` menampilkan perintah di bawah `cliCommands`, jalankan sebagai `openclaw <command> ...`; misalnya plugin yang mendaftarkan `demo-git` dapat diverifikasi dengan `openclaw demo-git ping`.

Setiap plugin diklasifikasikan berdasarkan apa yang benar-benar didaftarkannya saat runtime:

- **plain-capability** — satu jenis kapabilitas (misalnya plugin khusus provider)
- **hybrid-capability** — beberapa jenis kapabilitas (misalnya teks + ucapan + gambar)
- **hook-only** — hanya hook, tanpa kapabilitas atau surface
- **non-capability** — tools/commands/services tetapi tanpa kapabilitas

Lihat [Bentuk Plugin](/id/plugins/architecture#plugin-shapes) untuk informasi lebih lanjut tentang model kapabilitas.

<Note>
Flag `--json` mengeluarkan laporan yang dapat dibaca mesin dan cocok untuk scripting serta audit. `inspect --all` merender tabel seluruh armada dengan kolom bentuk, jenis kapabilitas, pemberitahuan kompatibilitas, kapabilitas bundel, dan ringkasan hook. `info` adalah alias untuk `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` melaporkan error pemuatan plugin, diagnostik manifes/discovery, dan pemberitahuan kompatibilitas. Saat semuanya bersih, ia mencetak `No plugin issues detected.`

Jika plugin terkonfigurasi ada di disk tetapi diblokir oleh pemeriksaan keamanan jalur loader, validasi config mempertahankan entri plugin dan melaporkannya sebagai `present but blocked`. Perbaiki diagnostik plugin terblokir sebelumnya, seperti kepemilikan jalur atau izin world-writable, alih-alih menghapus config `plugins.entries.<id>` atau `plugins.allow`.

Untuk kegagalan bentuk modul seperti ekspor `register`/`activate` yang hilang, jalankan ulang dengan `OPENCLAW_PLUGIN_LOAD_DEBUG=1` untuk menyertakan ringkasan bentuk ekspor ringkas dalam output diagnostik.

### Registri

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Registri plugin lokal adalah model baca dingin tersimpan OpenClaw untuk identitas plugin terpasang, status aktif, metadata sumber, dan kepemilikan kontribusi. Startup normal, pencarian pemilik provider, klasifikasi penyiapan channel, dan inventaris plugin dapat membacanya tanpa mengimpor modul runtime plugin.

Gunakan `plugins registry` untuk memeriksa apakah registri yang dipersisten ada, mutakhir, atau kedaluwarsa. Gunakan `--refresh` untuk membangunnya ulang dari indeks Plugin yang dipersisten, kebijakan konfigurasi, dan metadata manifest/paket. Ini adalah jalur perbaikan, bukan jalur aktivasi runtime.

`openclaw doctor --fix` juga memperbaiki penyimpangan npm terkelola yang berdekatan dengan registri: jika paket `@openclaw/*` yang yatim atau dipulihkan di bawah root npm Plugin terkelola membayangi Plugin bawaan, doctor menghapus paket kedaluwarsa tersebut dan membangun ulang registri sehingga startup memvalidasi terhadap manifest bawaan.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` adalah sakelar kompatibilitas darurat yang tidak digunakan lagi untuk kegagalan baca registri. Utamakan `plugins registry --refresh` atau `openclaw doctor --fix`; fallback env hanya untuk pemulihan startup darurat selama migrasi diluncurkan.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Daftar marketplace menerima jalur marketplace lokal, jalur `marketplace.json`, singkatan GitHub seperti `owner/repo`, URL repo GitHub, atau URL git. `--json` mencetak label sumber yang diselesaikan beserta manifest marketplace dan entri Plugin yang diurai.

## Terkait

- [Membangun Plugin](/id/plugins/building-plugins)
- [Referensi CLI](/id/cli)
- [Plugin komunitas](/id/plugins/community)
