---
read_when:
    - Anda ingin menginstal atau mengelola Plugin Gateway atau bundel yang kompatibel
    - Anda ingin men-debug kegagalan pemuatan Plugin
sidebarTitle: Plugins
summary: Referensi CLI untuk `openclaw plugins` (`list`, `install`, `marketplace`, `uninstall`, `enable`/`disable`, `doctor`)
title: Plugins
x-i18n:
    generated_at: "2026-04-26T11:26:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 52b02c96859e1da1d7028bce375045ef9472d1f2e01086f1318e4f38e8d5bb7d
    source_path: cli/plugins.md
    workflow: 15
---

Kelola Plugin Gateway, hook pack, dan bundel yang kompatibel.

<CardGroup cols={2}>
  <Card title="Sistem Plugin" href="/id/tools/plugin">
    Panduan pengguna akhir untuk memasang, mengaktifkan, dan memecahkan masalah Plugin.
  </Card>
  <Card title="Bundel Plugin" href="/id/plugins/bundles">
    Model kompatibilitas bundel.
  </Card>
  <Card title="Manifest Plugin" href="/id/plugins/manifest">
    Field manifest dan schema config.
  </Card>
  <Card title="Keamanan" href="/id/gateway/security">
    Hardening keamanan untuk instalasi Plugin.
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
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

<Note>
Plugin bawaan dikirim bersama OpenClaw. Beberapa diaktifkan secara default (misalnya provider model bawaan, provider speech bawaan, dan Plugin browser bawaan); yang lain memerlukan `plugins enable`.

Plugin OpenClaw native harus menyertakan `openclaw.plugin.json` dengan JSON Schema inline (`configSchema`, meskipun kosong). Bundel yang kompatibel menggunakan manifest bundelnya sendiri.

`plugins list` menampilkan `Format: openclaw` atau `Format: bundle`. Output list/info verbose juga menampilkan subtipe bundel (`codex`, `claude`, atau `cursor`) beserta kapabilitas bundel yang terdeteksi.
</Note>

### Install

```bash
openclaw plugins install <package>                      # ClawHub dulu, lalu npm
openclaw plugins install clawhub:<package>              # hanya ClawHub
openclaw plugins install <package> --force              # timpa instalasi yang ada
openclaw plugins install <package> --pin                # pin versi
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # path lokal
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (eksplisit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
Nama package tanpa kualifikasi diperiksa ke ClawHub terlebih dahulu, lalu npm. Perlakukan instalasi Plugin seperti menjalankan kode. Utamakan versi yang di-pin.
</Warning>

<AccordionGroup>
  <Accordion title="Config includes dan pemulihan config tidak valid">
    Jika bagian `plugins` Anda didukung oleh `$include` satu file, `plugins install/update/enable/disable/uninstall` akan menulis ke file include tersebut dan membiarkan `openclaw.json` tetap tidak tersentuh. Include root, array include, dan include dengan override saudara gagal secara tertutup alih-alih diratakan. Lihat [Config includes](/id/gateway/configuration) untuk bentuk yang didukung.

    Jika config tidak valid, `plugins install` biasanya gagal secara tertutup dan memberi tahu Anda untuk menjalankan `openclaw doctor --fix` terlebih dahulu. Satu-satunya pengecualian yang didokumentasikan adalah jalur pemulihan Plugin bawaan yang sempit untuk Plugin yang secara eksplisit ikut menggunakan `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force dan reinstall vs update">
    `--force` menggunakan ulang target instalasi yang ada dan menimpa Plugin atau hook pack yang sudah terpasang di tempat yang sama. Gunakan saat Anda memang sengaja memasang ulang id yang sama dari path lokal baru, arsip, package ClawHub, atau artefak npm. Untuk upgrade rutin Plugin npm yang sudah dilacak, gunakan `openclaw plugins update <id-or-npm-spec>`.

    Jika Anda menjalankan `plugins install` untuk id Plugin yang sudah terpasang, OpenClaw akan berhenti dan mengarahkan Anda ke `plugins update <id-or-npm-spec>` untuk upgrade normal, atau ke `plugins install <package> --force` jika Anda benar-benar ingin menimpa instalasi saat ini dari sumber yang berbeda.

  </Accordion>
  <Accordion title="Cakupan --pin">
    `--pin` hanya berlaku untuk instalasi npm. Ini tidak didukung dengan `--marketplace`, karena instalasi marketplace menyimpan metadata sumber marketplace alih-alih spesifikasi npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` adalah opsi darurat untuk false positive pada pemindai kode berbahaya bawaan. Opsi ini memungkinkan instalasi tetap berlanjut bahkan saat pemindai bawaan melaporkan temuan `critical`, tetapi **tidak** melewati blok kebijakan hook `before_install` milik Plugin dan **tidak** melewati kegagalan pemindaian.

    Flag CLI ini berlaku untuk alur install/update Plugin. Instalasi dependensi Skills yang didukung Gateway menggunakan override permintaan `dangerouslyForceUnsafeInstall` yang sesuai, sedangkan `openclaw skills install` tetap menjadi alur unduh/install Skills ClawHub yang terpisah.

  </Accordion>
  <Accordion title="Hook pack dan spesifikasi npm">
    `plugins install` juga merupakan surface instalasi untuk hook pack yang mengekspos `openclaw.hooks` di `package.json`. Gunakan `openclaw hooks` untuk visibilitas hook yang difilter dan pengaktifan per hook, bukan untuk instalasi package.

    Spesifikasi npm bersifat **khusus registry** (nama package + **versi persis** opsional atau **dist-tag**). Spesifikasi git/URL/file dan rentang semver ditolak. Instalasi dependensi berjalan secara lokal di project dengan `--ignore-scripts` demi keamanan, bahkan saat shell Anda memiliki pengaturan instalasi npm global.

    Spesifikasi tanpa kualifikasi dan `@latest` tetap pada jalur stabil. Jika npm me-resolve salah satunya ke prerelease, OpenClaw akan berhenti dan meminta Anda ikut menggunakan prerelease tersebut secara eksplisit dengan tag prerelease seperti `@beta`/`@rc` atau versi prerelease persis seperti `@1.2.3-beta.4`.

    Jika spesifikasi instalasi tanpa kualifikasi cocok dengan id Plugin bawaan (misalnya `diffs`), OpenClaw akan memasang Plugin bawaan tersebut secara langsung. Untuk memasang package npm dengan nama yang sama, gunakan spesifikasi scoped yang eksplisit (misalnya `@scope/diffs`).

  </Accordion>
  <Accordion title="Arsip">
    Arsip yang didukung: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Arsip Plugin OpenClaw native harus berisi `openclaw.plugin.json` yang valid pada root Plugin hasil ekstraksi; arsip yang hanya berisi `package.json` ditolak sebelum OpenClaw menulis catatan instalasi.

    Instalasi marketplace Claude juga didukung.

  </Accordion>
</AccordionGroup>

Instalasi ClawHub menggunakan locator `clawhub:<package>` yang eksplisit:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw kini juga mengutamakan ClawHub untuk spesifikasi Plugin bare yang aman untuk npm. OpenClaw hanya melakukan fallback ke npm jika ClawHub tidak memiliki package atau versi tersebut:

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw mengunduh arsip package dari ClawHub, memeriksa kompatibilitas API Plugin / gateway minimum yang diiklankan, lalu memasangnya melalui jalur arsip normal. Instalasi yang tercatat menyimpan metadata sumber ClawHub untuk pembaruan berikutnya.

#### Singkatan marketplace

Gunakan singkatan `plugin@marketplace` saat nama marketplace ada di cache registry lokal Claude di `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Gunakan `--marketplace` saat Anda ingin memberikan sumber marketplace secara eksplisit:

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
  <Tab title="Aturan marketplace remote">
    Untuk marketplace remote yang dimuat dari GitHub atau git, entri Plugin harus tetap berada di dalam repo marketplace yang di-clone. OpenClaw menerima sumber path relatif dari repo tersebut dan menolak sumber Plugin HTTP(S), absolute-path, git, GitHub, dan sumber non-path lainnya dari manifest remote.
  </Tab>
</Tabs>

Untuk path lokal dan arsip, OpenClaw mendeteksi secara otomatis:

- Plugin OpenClaw native (`openclaw.plugin.json`)
- bundel yang kompatibel dengan Codex (`.codex-plugin/plugin.json`)
- bundel yang kompatibel dengan Claude (`.claude-plugin/plugin.json` atau tata letak komponen Claude default)
- bundel yang kompatibel dengan Cursor (`.cursor-plugin/plugin.json`)

<Note>
Bundel yang kompatibel dipasang ke root Plugin normal dan mengikuti alur list/info/enable/disable yang sama. Saat ini, Skills bundel, command-skills Claude, default Claude `settings.json`, default Claude `.lsp.json` / `lspServers` yang dideklarasikan manifest, command-skills Cursor, dan direktori hook Codex yang kompatibel didukung; kapabilitas bundel lain yang terdeteksi ditampilkan dalam diagnostik/info tetapi belum dihubungkan ke eksekusi runtime.
</Note>

### List

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  Tampilkan hanya Plugin yang aktif.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Beralih dari tampilan tabel ke baris detail per Plugin dengan metadata sumber/origin/versi/aktivasi.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventaris yang dapat dibaca mesin beserta diagnostik registry.
</ParamField>

<Note>
`plugins list` membaca registry Plugin lokal yang disimpan terlebih dahulu, dengan fallback turunan berbasis manifest saat registry hilang atau tidak valid. Ini berguna untuk memeriksa apakah Plugin terpasang, aktif, dan terlihat oleh perencanaan cold startup, tetapi bukan probe runtime live untuk proses Gateway yang sudah berjalan. Setelah mengubah kode Plugin, status aktif, kebijakan hook, atau `plugins.load.paths`, restart Gateway yang melayani channel tersebut sebelum mengharapkan kode atau hook `register(api)` yang baru berjalan. Untuk deployment remote/container, pastikan Anda me-restart child `openclaw gateway run` yang sebenarnya, bukan hanya proses wrapper.
</Note>

Untuk pekerjaan Plugin bawaan di dalam image Docker terkemas, bind-mount direktori
sumber Plugin di atas path sumber terkemas yang sesuai, seperti
`/app/extensions/synology-chat`. OpenClaw akan menemukan source overlay yang di-mount
tersebut sebelum `/app/dist/extensions/synology-chat`; direktori sumber yang hanya disalin biasa
tetap inert sehingga instalasi terkemas normal tetap menggunakan dist yang sudah dikompilasi.

Untuk debugging hook runtime:

- `openclaw plugins inspect <id> --json` menampilkan hook yang terdaftar dan diagnostik dari proses inspeksi dengan modul dimuat.
- `openclaw gateway status --deep --require-rpc` mengonfirmasi Gateway yang dapat dijangkau, petunjuk service/proses, path config, dan kesehatan RPC.
- Hook percakapan non-bawaan (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) memerlukan `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Gunakan `--link` untuk menghindari penyalinan direktori lokal (menambahkan ke `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` tidak didukung dengan `--link` karena instalasi tertaut menggunakan ulang path sumber alih-alih menyalin ke target instalasi yang dikelola.

Gunakan `--pin` pada instalasi npm untuk menyimpan spesifikasi persis yang telah di-resolve (`name@version`) dalam indeks Plugin terkelola sambil mempertahankan perilaku default tanpa pin.
</Note>

### Indeks Plugin

Metadata instalasi Plugin adalah status yang dikelola mesin, bukan config pengguna. Instalasi dan pembaruan menuliskannya ke `plugins/installs.json` di bawah direktori status OpenClaw aktif. Map `installRecords` tingkat atasnya adalah sumber kebenaran tahan lama untuk metadata instalasi, termasuk catatan untuk manifest Plugin yang rusak atau hilang. Array `plugins` adalah cache registry cold yang diturunkan dari manifest. File ini menyertakan peringatan jangan diedit dan digunakan oleh `openclaw plugins update`, uninstall, diagnostik, dan registry Plugin cold.

Saat OpenClaw melihat catatan `plugins.installs` lama yang dikirim di config, OpenClaw memindahkannya ke indeks Plugin dan menghapus key config tersebut; jika salah satu penulisan gagal, catatan config dipertahankan agar metadata instalasi tidak hilang.

### Uninstall

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` menghapus catatan Plugin dari `plugins.entries`, indeks Plugin yang disimpan, entri allow/deny list Plugin, dan entri `plugins.load.paths` yang tertaut jika berlaku. Kecuali `--keep-files` diatur, uninstall juga menghapus direktori instalasi terkelola yang dilacak saat berada di dalam root ekstensi Plugin OpenClaw. Untuk Plugin memori aktif, slot memori direset ke `memory-core`.

<Note>
`--keep-config` didukung sebagai alias usang untuk `--keep-files`.
</Note>

### Update

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Pembaruan berlaku untuk instalasi Plugin yang dilacak dalam indeks Plugin terkelola dan instalasi hook-pack yang dilacak dalam `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Menyelesaikan id Plugin vs spesifikasi npm">
    Saat Anda memberikan id Plugin, OpenClaw menggunakan ulang spesifikasi instalasi yang tercatat untuk Plugin tersebut. Artinya, dist-tag yang sebelumnya disimpan seperti `@beta` dan versi yang di-pin secara persis akan terus digunakan pada eksekusi `update <id>` berikutnya.

    Untuk instalasi npm, Anda juga dapat memberikan spesifikasi package npm eksplisit dengan dist-tag atau versi persis. OpenClaw menyelesaikan nama package itu kembali ke catatan Plugin yang dilacak, memperbarui Plugin yang terpasang, dan mencatat spesifikasi npm baru untuk pembaruan berbasis id di masa mendatang.

    Memberikan nama package npm tanpa versi atau tag juga diselesaikan kembali ke catatan Plugin yang dilacak. Gunakan ini saat sebuah Plugin di-pin ke versi persis dan Anda ingin memindahkannya kembali ke jalur rilis default registry.

  </Accordion>
  <Accordion title="Pemeriksaan versi dan drift integritas">
    Sebelum pembaruan npm live, OpenClaw memeriksa versi package yang terpasang terhadap metadata registry npm. Jika versi terpasang dan identitas artefak yang tercatat sudah cocok dengan target yang di-resolve, pembaruan dilewati tanpa mengunduh, memasang ulang, atau menulis ulang `openclaw.json`.

    Saat hash integritas yang disimpan ada dan hash artefak yang diambil berubah, OpenClaw memperlakukan itu sebagai drift artefak npm. Perintah interaktif `openclaw plugins update` mencetak hash yang diharapkan dan aktual lalu meminta konfirmasi sebelum melanjutkan. Helper pembaruan non-interaktif gagal secara tertutup kecuali pemanggil memberikan kebijakan pelanjutan yang eksplisit.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install pada update">
    `--dangerously-force-unsafe-install` juga tersedia pada `plugins update` sebagai override darurat untuk false positive pemindaian kode berbahaya bawaan selama pembaruan Plugin. Opsi ini tetap tidak melewati blok kebijakan `before_install` milik Plugin atau pemblokiran akibat kegagalan pemindaian, dan hanya berlaku untuk pembaruan Plugin, bukan pembaruan hook-pack.
  </Accordion>
</AccordionGroup>

### Inspect

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Introspeksi mendalam untuk satu Plugin. Menampilkan identitas, status pemuatan, sumber, kapabilitas terdaftar, hook, tools, perintah, service, metode gateway, rute HTTP, flag kebijakan, diagnostik, metadata instalasi, kapabilitas bundel, dan dukungan server MCP atau LSP yang terdeteksi.

Setiap Plugin diklasifikasikan berdasarkan apa yang benar-benar didaftarkannya saat runtime:

- **plain-capability** — satu jenis kapabilitas (misalnya Plugin khusus provider)
- **hybrid-capability** — beberapa jenis kapabilitas (misalnya teks + speech + gambar)
- **hook-only** — hanya hook, tanpa kapabilitas atau surface
- **non-capability** — tools/perintah/service tetapi tanpa kapabilitas

Lihat [Bentuk Plugin](/id/plugins/architecture#plugin-shapes) untuk informasi lebih lanjut tentang model kapabilitas.

<Note>
Flag `--json` menghasilkan laporan yang dapat dibaca mesin dan cocok untuk scripting serta audit. `inspect --all` merender tabel seluruh armada dengan kolom bentuk, jenis kapabilitas, pemberitahuan kompatibilitas, kapabilitas bundel, dan ringkasan hook. `info` adalah alias untuk `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` melaporkan error pemuatan Plugin, diagnostik manifest/discovery, dan pemberitahuan kompatibilitas. Jika semuanya bersih, akan dicetak `No plugin issues detected.`

Untuk kegagalan bentuk modul seperti ekspor `register`/`activate` yang hilang, jalankan ulang dengan `OPENCLAW_PLUGIN_LOAD_DEBUG=1` agar ringkasan bentuk ekspor yang ringkas disertakan dalam output diagnostik.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Registry Plugin lokal adalah model baca cold yang disimpan oleh OpenClaw untuk identitas Plugin yang terpasang, status aktif, metadata sumber, dan kepemilikan kontribusi. Startup normal, pencarian owner provider, klasifikasi penyiapan channel, dan inventaris Plugin dapat membacanya tanpa mengimpor modul runtime Plugin.

Gunakan `plugins registry` untuk memeriksa apakah registry yang disimpan ada, terkini, atau basi. Gunakan `--refresh` untuk membangunnya ulang dari indeks Plugin yang disimpan, kebijakan config, dan metadata manifest/package. Ini adalah jalur perbaikan, bukan jalur aktivasi runtime.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` adalah switch kompatibilitas darurat usang untuk kegagalan pembacaan registry. Utamakan `plugins registry --refresh` atau `openclaw doctor --fix`; fallback env hanya untuk pemulihan startup darurat selama migrasi diluncurkan.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Daftar marketplace menerima path marketplace lokal, path `marketplace.json`, singkatan GitHub seperti `owner/repo`, URL repo GitHub, atau URL git. `--json` mencetak label sumber yang telah di-resolve beserta manifest marketplace yang di-parse dan entri Plugin.

## Terkait

- [Membangun Plugin](/id/plugins/building-plugins)
- [Referensi CLI](/id/cli)
- [Plugin komunitas](/id/plugins/community)
