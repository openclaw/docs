---
read_when:
    - Anda ingin menginstal atau mengelola plugin Gateway atau bundel yang kompatibel
    - Anda ingin mendiagnosis kegagalan pemuatan Plugin
sidebarTitle: Plugins
summary: Referensi CLI untuk `openclaw plugins` (daftar, instal, marketplace, hapus instalasi, aktifkan/nonaktifkan, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-05-04T07:02:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 36ae7edb12986ead7e126f25e0761bf312b2644b35017181b674082105886776
    source_path: cli/plugins.md
    workflow: 16
---

Kelola Plugin Gateway, paket hook, dan bundel yang kompatibel.

<CardGroup cols={2}>
  <Card title="Sistem Plugin" href="/id/tools/plugin">
    Panduan pengguna akhir untuk menginstal, mengaktifkan, dan memecahkan masalah Plugin.
  </Card>
  <Card title="Kelola Plugin" href="/id/plugins/manage-plugins">
    Contoh cepat untuk instal, daftar, perbarui, hapus instalasi, dan publikasi.
  </Card>
  <Card title="Bundel Plugin" href="/id/plugins/bundles">
    Model kompatibilitas bundel.
  </Card>
  <Card title="Manifest Plugin" href="/id/plugins/manifest">
    Kolom manifest dan skema konfigurasi.
  </Card>
  <Card title="Keamanan" href="/id/gateway/security">
    Pengerasan keamanan untuk instalasi Plugin.
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
perintah dengan `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Jejak tersebut menulis waktu fase
ke stderr dan menjaga keluaran JSON tetap dapat diurai. Lihat [Debugging](/id/help/debugging#plugin-lifecycle-trace).

<Note>
Plugin bawaan dikirimkan bersama OpenClaw. Beberapa diaktifkan secara default (misalnya penyedia model bawaan, penyedia ucapan bawaan, dan Plugin peramban bawaan); yang lain memerlukan `plugins enable`.

Plugin OpenClaw native harus menyertakan `openclaw.plugin.json` dengan JSON Schema inline (`configSchema`, meskipun kosong). Bundel yang kompatibel menggunakan manifest bundelnya sendiri.

`plugins list` menampilkan `Format: openclaw` atau `Format: bundle`. Keluaran daftar/info verbose juga menampilkan subtipe bundel (`codex`, `claude`, atau `cursor`) beserta kapabilitas bundel yang terdeteksi.
</Note>

### Instal

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
Nama paket polos diinstal dari npm secara default selama cutover peluncuran. Gunakan `clawhub:<package>` untuk ClawHub. Perlakukan instalasi Plugin seperti menjalankan kode. Utamakan versi yang dipin.
</Warning>

`plugins search` membuat kueri ke ClawHub untuk paket Plugin yang dapat diinstal dan mencetak
nama paket yang siap diinstal. Perintah ini mencari paket Plugin kode dan paket Plugin bundel,
bukan Skills. Gunakan `openclaw skills search` untuk Skills ClawHub.

<Note>
ClawHub adalah permukaan distribusi dan penemuan utama untuk sebagian besar Plugin. Npm
tetap menjadi fallback yang didukung dan jalur instalasi langsung. Paket Plugin milik OpenClaw
`@openclaw/*` diterbitkan lagi di npm; lihat daftar saat ini
di [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) atau
[inventaris Plugin](/id/plugins/plugin-inventory). Instalasi stabil menggunakan `latest`.
Instalasi dan pembaruan kanal beta mengutamakan npm `beta` dist-tag ketika tag tersebut
tersedia, lalu kembali ke `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Include konfigurasi dan perbaikan konfigurasi tidak valid">
    Jika bagian `plugins` Anda didukung oleh `$include` berkas tunggal, `plugins install/update/enable/disable/uninstall` menulis ke berkas yang disertakan tersebut dan membiarkan `openclaw.json` tidak tersentuh. Include root, array include, dan include dengan override saudara gagal tertutup alih-alih diratakan. Lihat [Include konfigurasi](/id/gateway/configuration) untuk bentuk yang didukung.

    Jika konfigurasi tidak valid selama instalasi, `plugins install` biasanya gagal tertutup dan meminta Anda menjalankan `openclaw doctor --fix` terlebih dahulu. Selama startup Gateway dan hot reload, konfigurasi Plugin yang tidak valid gagal tertutup seperti konfigurasi tidak valid lainnya; `openclaw doctor --fix` dapat mengarantina entri Plugin yang tidak valid. Satu-satunya pengecualian waktu instalasi yang terdokumentasi adalah jalur pemulihan sempit Plugin bawaan untuk Plugin yang secara eksplisit ikut serta dalam `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force dan instal ulang vs perbarui">
    `--force` menggunakan kembali target instalasi yang ada dan menimpa Plugin atau paket hook yang sudah terinstal di tempat. Gunakan saat Anda memang sengaja menginstal ulang id yang sama dari path lokal, arsip, paket ClawHub, atau artefak npm baru. Untuk upgrade rutin Plugin npm yang sudah dilacak, utamakan `openclaw plugins update <id-or-npm-spec>`.

    Jika Anda menjalankan `plugins install` untuk id Plugin yang sudah terinstal, OpenClaw berhenti dan mengarahkan Anda ke `plugins update <id-or-npm-spec>` untuk upgrade normal, atau ke `plugins install <package> --force` ketika Anda benar-benar ingin menimpa instalasi saat ini dari sumber yang berbeda.

  </Accordion>
  <Accordion title="Cakupan --pin">
    `--pin` hanya berlaku untuk instalasi npm. Ini tidak didukung dengan instalasi `git:`; gunakan ref git eksplisit seperti `git:github.com/acme/plugin@v1.2.3` saat Anda menginginkan sumber yang dipin. Ini tidak didukung dengan `--marketplace`, karena instalasi marketplace menyimpan metadata sumber marketplace alih-alih spesifikasi npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` adalah opsi darurat untuk positif palsu dalam pemindai kode berbahaya bawaan. Opsi ini memungkinkan instalasi berlanjut meskipun pemindai bawaan melaporkan temuan `critical`, tetapi **tidak** melewati blok kebijakan hook `before_install` Plugin dan **tidak** melewati kegagalan pemindaian.

    Flag CLI ini berlaku untuk alur instalasi/pembaruan Plugin. Instalasi dependensi Skills yang didukung Gateway menggunakan override permintaan `dangerouslyForceUnsafeInstall` yang sesuai, sementara `openclaw skills install` tetap menjadi alur unduh/instal Skills ClawHub yang terpisah.

    Jika Plugin yang Anda publikasikan di ClawHub diblokir oleh pemindaian registri, gunakan langkah penerbit di [ClawHub](/id/tools/clawhub).

  </Accordion>
  <Accordion title="Paket hook dan spesifikasi npm">
    `plugins install` juga merupakan permukaan instalasi untuk paket hook yang mengekspos `openclaw.hooks` di `package.json`. Gunakan `openclaw hooks` untuk visibilitas hook yang difilter dan pengaktifan per hook, bukan instalasi paket.

    Spesifikasi npm bersifat **hanya registri** (nama paket + **versi tepat** opsional atau **dist-tag**). Spesifikasi Git/URL/berkas dan rentang semver ditolak. Instalasi dependensi berjalan secara lokal proyek dengan `--ignore-scripts` demi keamanan, bahkan ketika shell Anda memiliki pengaturan instalasi npm global.

    Gunakan `npm:<package>` saat Anda ingin membuat resolusi npm eksplisit. Spesifikasi paket polos juga diinstal langsung dari npm selama cutover peluncuran.

    Spesifikasi polos dan `@latest` tetap berada di jalur stabil. Versi koreksi bertanggal OpenClaw seperti `2026.5.3-1` adalah rilis stabil untuk pemeriksaan ini. Jika npm menyelesaikan salah satu dari keduanya ke prarilis, OpenClaw berhenti dan meminta Anda ikut serta secara eksplisit dengan tag prarilis seperti `@beta`/`@rc` atau versi prarilis tepat seperti `@1.2.3-beta.4`.

    Jika spesifikasi instalasi polos cocok dengan id Plugin resmi (misalnya `diffs`), OpenClaw menginstal entri katalog secara langsung. Untuk menginstal paket npm dengan nama yang sama, gunakan spesifikasi scoped eksplisit (misalnya `@scope/diffs`).

  </Accordion>
  <Accordion title="Repositori Git">
    Gunakan `git:<repo>` untuk menginstal langsung dari repositori git. Bentuk yang didukung mencakup URL clone `git:github.com/owner/repo`, `git:owner/repo`, `https://` lengkap, `ssh://`, `git://`, `file://`, dan `git@host:owner/repo.git`. Tambahkan `@<ref>` atau `#<ref>` untuk checkout branch, tag, atau commit sebelum instalasi.

    Instalasi Git meng-clone ke direktori sementara, checkout ref yang diminta jika ada, lalu menggunakan penginstal direktori Plugin normal. Artinya validasi manifest, pemindaian kode berbahaya, pekerjaan instal package-manager, dan catatan instalasi berperilaku seperti instalasi npm. Instalasi git yang tercatat mencakup URL/ref sumber beserta commit yang diselesaikan sehingga `openclaw plugins update` dapat menyelesaikan ulang sumber tersebut nanti.

    Setelah menginstal dari git, gunakan `openclaw plugins inspect <id> --runtime --json` untuk memverifikasi registrasi runtime seperti metode Gateway dan perintah CLI. Jika Plugin mendaftarkan root CLI dengan `api.registerCli`, jalankan perintah tersebut langsung melalui CLI root OpenClaw, misalnya `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Arsip">
    Arsip yang didukung: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Arsip Plugin OpenClaw native harus berisi `openclaw.plugin.json` yang valid di root Plugin hasil ekstraksi; arsip yang hanya berisi `package.json` ditolak sebelum OpenClaw menulis catatan instalasi.

    Instalasi marketplace Claude juga didukung.

  </Accordion>
</AccordionGroup>

Instalasi ClawHub menggunakan locator `clawhub:<package>` eksplisit:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Spesifikasi Plugin polos yang aman untuk npm diinstal dari npm secara default selama cutover peluncuran:

```bash
openclaw plugins install openclaw-codex-app-server
```

Gunakan `npm:` untuk membuat resolusi khusus npm eksplisit:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw memeriksa kompatibilitas API Plugin / Gateway minimum yang diiklankan sebelum instalasi. Ketika versi ClawHub yang dipilih menerbitkan artefak ClawPack, OpenClaw mengunduh `.tgz` npm-pack berversi, memverifikasi header digest ClawHub dan digest artefak, lalu menginstalnya melalui jalur arsip normal. Versi ClawHub yang lebih lama tanpa metadata ClawPack tetap diinstal melalui jalur verifikasi arsip paket lama. Instalasi yang tercatat menyimpan metadata sumber ClawHub, jenis artefak, integritas npm, shasum npm, nama tarball, dan fakta digest ClawPack untuk pembaruan nanti.
Instalasi ClawHub tanpa versi menyimpan spesifikasi tercatat tanpa versi sehingga `openclaw plugins update` dapat mengikuti rilis ClawHub yang lebih baru; pemilih versi atau tag eksplisit seperti `clawhub:pkg@1.2.3` dan `clawhub:pkg@beta` tetap dipin ke pemilih tersebut.

#### Shorthand marketplace

Gunakan shorthand `plugin@marketplace` ketika nama marketplace ada di cache registri lokal Claude di `~/.claude/plugins/known_marketplaces.json`:

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
  <Tab title="Marketplace sources">
    - nama marketplace yang dikenal Claude dari `~/.claude/plugins/known_marketplaces.json`
    - root marketplace lokal atau path `marketplace.json`
    - singkatan repo GitHub seperti `owner/repo`
    - URL repo GitHub seperti `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="Remote marketplace rules">
    Untuk marketplace jarak jauh yang dimuat dari GitHub atau git, entri plugin harus tetap berada di dalam repo marketplace hasil clone. OpenClaw menerima sumber path relatif dari repo tersebut dan menolak HTTP(S), path absolut, git, GitHub, dan sumber plugin non-path lainnya dari manifest jarak jauh.
  </Tab>
</Tabs>

Untuk path lokal dan arsip, OpenClaw mendeteksi otomatis:

- plugin OpenClaw native (`openclaw.plugin.json`)
- bundel yang kompatibel dengan Codex (`.codex-plugin/plugin.json`)
- bundel yang kompatibel dengan Claude (`.claude-plugin/plugin.json` atau tata letak komponen Claude default)
- bundel yang kompatibel dengan Cursor (`.cursor-plugin/plugin.json`)

<Note>
Bundel yang kompatibel diinstal ke root plugin normal dan ikut dalam alur list/info/enable/disable yang sama. Saat ini, Skills bundel, command-skills Claude, default `settings.json` Claude, default `.lsp.json` Claude / `lspServers` yang dideklarasikan manifest, command-skills Cursor, dan direktori hook Codex yang kompatibel didukung; kemampuan bundel lain yang terdeteksi ditampilkan dalam diagnostics/info tetapi belum dihubungkan ke eksekusi runtime.
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
  Inventaris yang dapat dibaca mesin beserta diagnostik registry dan status instalasi dependensi paket.
</ParamField>

<Note>
`plugins list` membaca registry plugin lokal yang dipersistenkan terlebih dahulu, dengan fallback turunan khusus manifest saat registry hilang atau tidak valid. Ini berguna untuk memeriksa apakah plugin terinstal, diaktifkan, dan terlihat oleh perencanaan startup dingin, tetapi bukan probe runtime langsung untuk proses Gateway yang sudah berjalan. Setelah mengubah kode plugin, enablement, kebijakan hook, atau `plugins.load.paths`, mulai ulang Gateway yang melayani channel sebelum mengharapkan kode `register(api)` atau hook baru berjalan. Untuk deployment jarak jauh/container, pastikan Anda memulai ulang child `openclaw gateway run` yang sebenarnya, bukan hanya proses wrapper.

`plugins list --json` menyertakan `dependencyStatus` setiap plugin dari `package.json`
`dependencies` dan `optionalDependencies`. OpenClaw memeriksa apakah nama paket tersebut
ada di sepanjang path lookup `node_modules` Node normal milik plugin; OpenClaw
tidak mengimpor kode runtime plugin, menjalankan manajer paket, atau memperbaiki
dependensi yang hilang.
</Note>

`plugins search` adalah lookup katalog ClawHub jarak jauh. Perintah ini tidak memeriksa state lokal, mengubah config, menginstal paket, atau memuat kode runtime plugin. Hasil pencarian menyertakan nama paket ClawHub, family, channel, versi, ringkasan, dan petunjuk instalasi seperti `openclaw plugins install clawhub:<package>`.

Untuk pekerjaan plugin bawaan di dalam image Docker terpaket, bind-mount direktori sumber plugin di atas path sumber terpaket yang sesuai, seperti `/app/extensions/synology-chat`. OpenClaw akan menemukan overlay sumber yang di-mount tersebut sebelum `/app/dist/extensions/synology-chat`; direktori sumber yang hanya disalin tetap tidak aktif sehingga instalasi terpaket normal tetap memakai dist terkompilasi.

Untuk debugging hook runtime:

- `openclaw plugins inspect <id> --runtime --json` menampilkan hook terdaftar dan diagnostik dari pass inspeksi yang memuat modul. Inspeksi runtime tidak pernah menginstal dependensi; gunakan `openclaw doctor --fix` untuk membersihkan state dependensi legacy atau menginstal plugin unduhan terkonfigurasi yang hilang.
- `openclaw gateway status --deep --require-rpc` mengonfirmasi Gateway yang dapat dijangkau, petunjuk layanan/proses, path config, dan kesehatan RPC.
- Hook percakapan non-bundel (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) memerlukan `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Gunakan `--link` untuk menghindari penyalinan direktori lokal (menambahkan ke `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` tidak didukung dengan `--link` karena instalasi tertaut menggunakan ulang path sumber, bukan menyalin di atas target instalasi terkelola.

Gunakan `--pin` pada instalasi npm untuk menyimpan spec eksak hasil resolusi (`name@version`) dalam indeks plugin terkelola sambil mempertahankan perilaku default tanpa pin.
</Note>

### Indeks Plugin

Metadata instalasi plugin adalah state yang dikelola mesin, bukan config pengguna. Instalasi dan pembaruan menuliskannya ke `plugins/installs.json` di bawah direktori state OpenClaw aktif. Map `installRecords` tingkat atasnya adalah sumber tahan lama untuk metadata instalasi, termasuk record untuk manifest plugin yang rusak atau hilang. Array `plugins` adalah cache registry dingin turunan manifest. File ini menyertakan peringatan jangan diedit dan digunakan oleh `openclaw plugins update`, uninstall, diagnostik, dan registry plugin dingin.

Saat OpenClaw melihat record `plugins.installs` legacy terkirim dalam config, OpenClaw memindahkannya ke indeks plugin dan menghapus key config; jika salah satu penulisan gagal, record config dipertahankan agar metadata instalasi tidak hilang.

### Uninstall

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` menghapus record plugin dari `plugins.entries`, indeks plugin yang dipersistenkan, entri daftar allow/deny plugin, dan entri `plugins.load.paths` tertaut jika berlaku. Kecuali `--keep-files` ditetapkan, uninstall juga menghapus direktori instalasi terkelola yang dilacak saat direktori tersebut berada di dalam root extensions plugin OpenClaw. Untuk plugin active memory, slot memory direset ke `memory-core`.

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

Pembaruan berlaku untuk instalasi plugin yang dilacak di indeks plugin terkelola dan instalasi hook-pack yang dilacak di `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Resolving plugin id vs npm spec">
    Saat Anda meneruskan id plugin, OpenClaw menggunakan ulang spec instalasi yang tercatat untuk plugin tersebut. Artinya dist-tag yang sebelumnya disimpan seperti `@beta` dan versi pinned yang eksak terus digunakan pada eksekusi `update <id>` berikutnya.

    Untuk instalasi npm, Anda juga dapat meneruskan spec paket npm eksplisit dengan dist-tag atau versi eksak. OpenClaw meresolusikan nama paket tersebut kembali ke record plugin yang dilacak, memperbarui plugin terinstal tersebut, dan mencatat spec npm baru untuk pembaruan berbasis id di masa mendatang.

    Meneruskan nama paket npm tanpa versi atau tag juga meresolusikan kembali ke record plugin yang dilacak. Gunakan ini saat plugin di-pin ke versi eksak dan Anda ingin memindahkannya kembali ke jalur rilis default registry.

  </Accordion>
  <Accordion title="Beta channel updates">
    `openclaw plugins update` menggunakan ulang spec plugin yang dilacak kecuali Anda meneruskan spec baru. `openclaw update` juga mengetahui channel pembaruan OpenClaw aktif: pada channel beta, record plugin npm dan ClawHub jalur default mencoba `@beta` terlebih dahulu, lalu fallback ke spec default/latest yang tercatat jika tidak ada rilis beta plugin. Versi eksak dan tag eksplisit tetap di-pin ke selector tersebut.

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    Sebelum pembaruan npm live, OpenClaw memeriksa versi paket yang terinstal terhadap metadata registry npm. Jika versi terinstal dan identitas artefak yang tercatat sudah cocok dengan target hasil resolusi, pembaruan dilewati tanpa mengunduh, menginstal ulang, atau menulis ulang `openclaw.json`.

    Saat hash integritas tersimpan ada dan hash artefak yang diambil berubah, OpenClaw memperlakukannya sebagai drift artefak npm. Perintah interaktif `openclaw plugins update` mencetak hash yang diharapkan dan aktual lalu meminta konfirmasi sebelum melanjutkan. Helper pembaruan non-interaktif gagal tertutup kecuali pemanggil menyediakan kebijakan kelanjutan eksplisit.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install` juga tersedia pada `plugins update` sebagai override darurat untuk false positive pemindaian dangerous-code bawaan selama pembaruan plugin. Ini tetap tidak mem-bypass blok kebijakan `before_install` plugin atau pemblokiran kegagalan pemindaian, dan hanya berlaku untuk pembaruan plugin, bukan pembaruan hook-pack.
  </Accordion>
</AccordionGroup>

### Inspeksi

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect menampilkan identitas, status muat, sumber, kemampuan manifest, flag kebijakan, diagnostik, metadata instalasi, kemampuan bundel, dan dukungan server MCP atau LSP yang terdeteksi tanpa mengimpor runtime plugin secara default. Tambahkan `--runtime` untuk memuat modul plugin dan menyertakan hook, tool, command, service, metode gateway, dan rute HTTP yang terdaftar. Inspeksi runtime melaporkan dependensi plugin yang hilang secara langsung; instalasi dan perbaikan tetap berada di `openclaw plugins install`, `openclaw plugins update`, dan `openclaw doctor --fix`.

Command CLI milik plugin diinstal sebagai grup command root `openclaw`. Setelah `inspect --runtime` menampilkan command di bawah `cliCommands`, jalankan sebagai `openclaw <command> ...`; misalnya plugin yang mendaftarkan `demo-git` dapat diverifikasi dengan `openclaw demo-git ping`.

Setiap plugin diklasifikasikan berdasarkan apa yang benar-benar didaftarkannya saat runtime:

- **plain-capability** — satu jenis kemampuan (misalnya plugin khusus provider)
- **hybrid-capability** — beberapa jenis kemampuan (misalnya teks + ucapan + gambar)
- **hook-only** — hanya hook, tanpa kemampuan atau surface
- **non-capability** — tool/command/service tetapi tanpa kemampuan

Lihat [Bentuk plugin](/id/plugins/architecture#plugin-shapes) untuk informasi lebih lanjut tentang model kemampuan.

<Note>
Flag `--json` menghasilkan laporan yang dapat dibaca mesin dan cocok untuk scripting serta audit. `inspect --all` merender tabel seluruh fleet dengan kolom shape, jenis kemampuan, pemberitahuan kompatibilitas, kemampuan bundel, dan ringkasan hook. `info` adalah alias untuk `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` melaporkan error pemuatan plugin, diagnostik manifest/discovery, dan pemberitahuan kompatibilitas. Saat semuanya bersih, perintah ini mencetak `No plugin issues detected.`

Jika plugin yang dikonfigurasi ada di disk tetapi diblokir oleh pemeriksaan keamanan path milik loader, validasi config mempertahankan entri plugin dan melaporkannya sebagai `present but blocked`. Perbaiki diagnostik plugin terblokir sebelumnya, seperti kepemilikan path atau izin world-writable, alih-alih menghapus config `plugins.entries.<id>` atau `plugins.allow`.

Untuk kegagalan bentuk modul seperti export `register`/`activate` yang hilang, jalankan ulang dengan `OPENCLAW_PLUGIN_LOAD_DEBUG=1` untuk menyertakan ringkasan bentuk export yang ringkas dalam output diagnostik.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Registry plugin lokal adalah model baca dingin yang dipersistenkan OpenClaw untuk identitas plugin terinstal, enablement, metadata sumber, dan kepemilikan kontribusi. Startup normal, lookup owner provider, klasifikasi setup channel, dan inventaris plugin dapat membacanya tanpa mengimpor modul runtime plugin.

Gunakan `plugins registry` untuk memeriksa apakah registry yang dipersistensikan ada, terkini, atau usang. Gunakan `--refresh` untuk membangunnya ulang dari indeks Plugin yang dipersistensikan, kebijakan konfigurasi, serta metadata manifest/paket. Ini adalah jalur perbaikan, bukan jalur aktivasi runtime.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` adalah sakelar kompatibilitas darurat yang sudah tidak digunakan lagi untuk kegagalan pembacaan registry. Utamakan `plugins registry --refresh` atau `openclaw doctor --fix`; fallback env hanya untuk pemulihan startup darurat saat migrasi diluncurkan.
</Warning>

### Pasar

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Daftar pasar menerima path pasar lokal, path `marketplace.json`, singkatan GitHub seperti `owner/repo`, URL repo GitHub, atau URL git. `--json` mencetak label sumber yang di-resolve beserta manifest pasar yang diurai dan entri Plugin.

## Terkait

- [Membangun Plugin](/id/plugins/building-plugins)
- [Referensi CLI](/id/cli)
- [Plugin komunitas](/id/plugins/community)
