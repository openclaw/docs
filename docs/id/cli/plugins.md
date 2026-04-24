---
read_when:
    - Anda ingin menginstal atau mengelola Plugin Gateway atau bundel yang kompatibel
    - Anda ingin men-debug kegagalan pemuatan Plugin
summary: Referensi CLI untuk `openclaw plugins` (list, install, marketplace, uninstall, enable/nonaktifkan, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-04-24T15:22:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc693d5e3bc49057e1a108ba65a4dcb3bb662c00229e6fa38a0335afba8240e5
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

Kelola Plugin Gateway, paket hook, dan bundel yang kompatibel.

Terkait:

- Sistem Plugin: [Plugin](/id/tools/plugin)
- Kompatibilitas bundel: [Bundel Plugin](/id/plugins/bundles)
- Manifes + skema Plugin: [Manifes Plugin](/id/plugins/manifest)
- Penguatan keamanan: [Keamanan](/id/gateway/security)

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
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

Plugin bawaan disertakan bersama OpenClaw. Sebagian diaktifkan secara default (misalnya penyedia model bawaan, penyedia ucapan bawaan, dan plugin browser bawaan); yang lain memerlukan `plugins enable`.

Plugin OpenClaw native harus menyertakan `openclaw.plugin.json` dengan JSON Schema inline (`configSchema`, meskipun kosong). Bundel yang kompatibel menggunakan manifes bundelnya sendiri.

`plugins list` menampilkan `Format: openclaw` atau `Format: bundle`. Keluaran list/info verbose juga menampilkan subtipe bundel (`codex`, `claude`, atau `cursor`) beserta kapabilitas bundel yang terdeteksi.

### Instal

```bash
openclaw plugins install <package>                      # ClawHub terlebih dahulu, lalu npm
openclaw plugins install clawhub:<package>              # hanya ClawHub
openclaw plugins install <package> --force              # timpa instalasi yang ada
openclaw plugins install <package> --pin                # sematkan versi
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # path lokal
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (eksplisit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

Nama paket polos diperiksa di ClawHub terlebih dahulu, lalu npm. Catatan keamanan: perlakukan instalasi plugin seperti menjalankan kode. Sebaiknya gunakan versi yang disematkan.

Jika bagian `plugins` Anda didukung oleh satu-file `$include`, `plugins install/update/enable/disable/uninstall` akan menulis ke file yang di-include tersebut dan membiarkan `openclaw.json` tetap tidak berubah. Include root, array include, dan include dengan override saudara akan gagal tertutup alih-alih diratakan. Lihat [Config includes](/id/gateway/configuration) untuk bentuk yang didukung.

Jika config tidak valid, `plugins install` biasanya gagal tertutup dan memberi tahu Anda untuk menjalankan `openclaw doctor --fix` terlebih dahulu. Satu-satunya pengecualian yang didokumentasikan adalah jalur pemulihan plugin bawaan yang sempit untuk plugin yang secara eksplisit ikut serta dalam `openclaw.install.allowInvalidConfigRecovery`.

`--force` menggunakan kembali target instalasi yang ada dan menimpa plugin atau paket hook yang sudah terinstal langsung di tempatnya. Gunakan saat Anda memang sengaja menginstal ulang id yang sama dari path lokal, arsip, paket ClawHub, atau artefak npm yang baru. Untuk peningkatan rutin plugin npm yang sudah dilacak, sebaiknya gunakan `openclaw plugins update <id-or-npm-spec>`.

Jika Anda menjalankan `plugins install` untuk id plugin yang sudah terinstal, OpenClaw akan berhenti dan mengarahkan Anda ke `plugins update <id-or-npm-spec>` untuk peningkatan normal, atau ke `plugins install <package> --force` bila Anda benar-benar ingin menimpa instalasi saat ini dari sumber yang berbeda.

`--pin` hanya berlaku untuk instalasi npm. Opsi ini tidak didukung bersama `--marketplace`, karena instalasi marketplace menyimpan metadata sumber marketplace, bukan spesifikasi npm.

`--dangerously-force-unsafe-install` adalah opsi darurat untuk false positive pada pemindai kode berbahaya bawaan. Opsi ini memungkinkan instalasi tetap berlanjut bahkan saat pemindai bawaan melaporkan temuan `critical`, tetapi **tidak** melewati blok kebijakan hook `before_install` plugin dan **tidak** melewati kegagalan pemindaian.

Flag CLI ini berlaku untuk alur install/update plugin. Instalasi dependensi skill yang didukung Gateway menggunakan override permintaan `dangerouslyForceUnsafeInstall` yang sesuai, sedangkan `openclaw skills install` tetap merupakan alur unduh/install skill ClawHub yang terpisah.

`plugins install` juga merupakan permukaan instalasi untuk paket hook yang mengekspos `openclaw.hooks` di `package.json`. Gunakan `openclaw hooks` untuk visibilitas hook yang difilter dan pengaktifan per hook, bukan untuk instalasi paket.

Spesifikasi npm bersifat **hanya registry** (nama paket + **versi exact** opsional atau **dist-tag**). Spesifikasi git/URL/file dan rentang semver akan ditolak. Instalasi dependensi dijalankan dengan `--ignore-scripts` demi keamanan.

Spesifikasi polos dan `@latest` tetap mengikuti jalur stabil. Jika npm menyelesaikan salah satunya ke prerelease, OpenClaw akan berhenti dan meminta Anda untuk secara eksplisit ikut serta dengan tag prerelease seperti `@beta`/`@rc` atau versi prerelease exact seperti `@1.2.3-beta.4`.

Jika spesifikasi instalasi polos cocok dengan id plugin bawaan (misalnya `diffs`), OpenClaw akan langsung menginstal plugin bawaan tersebut. Untuk menginstal paket npm dengan nama yang sama, gunakan spesifikasi scoped yang eksplisit (misalnya `@scope/diffs`).

Arsip yang didukung: `.zip`, `.tgz`, `.tar.gz`, `.tar`.

Instalasi marketplace Claude juga didukung.

Instalasi ClawHub menggunakan locator `clawhub:<package>` yang eksplisit:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw kini juga lebih mengutamakan ClawHub untuk spesifikasi plugin aman-npm yang polos. OpenClaw hanya kembali ke npm jika ClawHub tidak memiliki paket atau versi tersebut:

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw mengunduh arsip paket dari ClawHub, memeriksa kompatibilitas plugin API / gateway minimum yang diiklankan, lalu menginstalnya melalui jalur arsip normal. Instalasi yang tercatat menyimpan metadata sumber ClawHub untuk pembaruan berikutnya.

Gunakan singkatan `plugin@marketplace` saat nama marketplace ada di cache registry lokal Claude di `~/.claude/plugins/known_marketplaces.json`:

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

Sumber marketplace dapat berupa:

- nama known-marketplace Claude dari `~/.claude/plugins/known_marketplaces.json`
- root marketplace lokal atau path `marketplace.json`
- singkatan repo GitHub seperti `owner/repo`
- URL repo GitHub seperti `https://github.com/owner/repo`
- URL git

Untuk marketplace jarak jauh yang dimuat dari GitHub atau git, entri plugin harus tetap berada di dalam repo marketplace yang di-clone. OpenClaw menerima sumber path relatif dari repo tersebut dan menolak HTTP(S), absolute-path, git, GitHub, dan sumber plugin non-path lain dari manifes jarak jauh.

Untuk path lokal dan arsip, OpenClaw mendeteksi secara otomatis:

- plugin OpenClaw native (`openclaw.plugin.json`)
- bundel kompatibel Codex (`.codex-plugin/plugin.json`)
- bundel kompatibel Claude (`.claude-plugin/plugin.json` atau tata letak komponen Claude default)
- bundel kompatibel Cursor (`.cursor-plugin/plugin.json`)

Bundel yang kompatibel diinstal ke root plugin normal dan mengikuti alur list/info/enable/disable yang sama. Saat ini, Skills bundel, command-skills Claude, default Claude `settings.json`, default Claude `.lsp.json` / `lspServers` yang dideklarasikan di manifes, command-skills Cursor, dan direktori hook Codex yang kompatibel didukung; kapabilitas bundel lain yang terdeteksi ditampilkan dalam diagnostik/info tetapi belum terhubung ke eksekusi runtime.

### List

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Gunakan `--enabled` untuk hanya menampilkan plugin yang dimuat. Gunakan `--verbose` untuk beralih dari tampilan tabel ke baris detail per plugin dengan metadata source/origin/version/activation. Gunakan `--json` untuk inventaris yang dapat dibaca mesin beserta diagnostik registry.

`plugins list` menjalankan discovery dari environment CLI dan config saat ini. Ini berguna untuk memeriksa apakah suatu plugin diaktifkan/dapat dimuat, tetapi ini bukan probe runtime langsung dari proses Gateway yang sudah berjalan. Setelah mengubah kode plugin, pengaktifan, kebijakan hook, atau `plugins.load.paths`, mulai ulang Gateway yang melayani channel tersebut sebelum mengharapkan kode `register(api)` atau hook baru berjalan. Untuk deployment jarak jauh/container, pastikan Anda memulai ulang child `openclaw gateway run` yang sebenarnya, bukan hanya proses pembungkus.

Untuk debugging hook runtime:

- `openclaw plugins inspect <id> --json` menampilkan hook yang terdaftar dan diagnostik dari proses inspeksi dengan modul dimuat.
- `openclaw gateway status --deep --require-rpc` mengonfirmasi Gateway yang dapat dijangkau, petunjuk service/process, path config, dan kesehatan RPC.
- Hook percakapan non-bawaan (`llm_input`, `llm_output`, `agent_end`) memerlukan `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Gunakan `--link` agar direktori lokal tidak disalin (menambahkan ke `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

`--force` tidak didukung bersama `--link` karena instalasi tertaut menggunakan kembali path sumber alih-alih menyalin ke target instalasi terkelola.

Gunakan `--pin` pada instalasi npm untuk menyimpan spesifikasi exact yang telah diselesaikan (`name@version`) di `plugins.installs` sambil mempertahankan perilaku default tanpa penyematan.

### Copot instalasi

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` menghapus catatan plugin dari `plugins.entries`, `plugins.installs`, allowlist plugin, dan entri `plugins.load.paths` yang tertaut bila berlaku. Untuk plugin Active Memory, slot memori direset ke `memory-core`.

Secara default, uninstall juga menghapus direktori instalasi plugin di bawah root plugin state-dir yang aktif. Gunakan `--keep-files` untuk mempertahankan file di disk.

`--keep-config` didukung sebagai alias usang untuk `--keep-files`.

### Pembaruan

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Pembaruan diterapkan pada instalasi yang dilacak di `plugins.installs` dan instalasi hook-pack yang dilacak di `hooks.internal.installs`.

Saat Anda memberikan id plugin, OpenClaw menggunakan kembali spesifikasi instalasi yang tercatat untuk plugin tersebut. Artinya, dist-tag yang sebelumnya disimpan seperti `@beta` dan versi exact yang disematkan akan terus digunakan pada eksekusi `update <id>` berikutnya.

Untuk instalasi npm, Anda juga dapat memberikan spesifikasi paket npm yang eksplisit dengan dist-tag atau versi exact. OpenClaw menyelesaikan nama paket itu kembali ke catatan plugin yang dilacak, memperbarui plugin yang terinstal tersebut, dan mencatat spesifikasi npm baru untuk pembaruan berbasis id di masa mendatang.

Meneruskan nama paket npm tanpa versi atau tag juga akan diselesaikan kembali ke catatan plugin yang dilacak. Gunakan ini saat sebuah plugin disematkan ke versi exact dan Anda ingin memindahkannya kembali ke jalur rilis default registry.

Sebelum pembaruan npm langsung, OpenClaw memeriksa versi paket yang terinstal terhadap metadata registry npm. Jika versi yang terinstal dan identitas artefak yang tercatat sudah cocok dengan target yang diselesaikan, pembaruan akan dilewati tanpa mengunduh, menginstal ulang, atau menulis ulang `openclaw.json`.

Saat hash integritas yang tersimpan ada dan hash artefak yang diambil berubah, OpenClaw memperlakukan hal itu sebagai drift artefak npm. Perintah interaktif `openclaw plugins update` mencetak hash yang diharapkan dan yang sebenarnya lalu meminta konfirmasi sebelum melanjutkan. Helper pembaruan non-interaktif gagal tertutup kecuali pemanggil menyediakan kebijakan kelanjutan yang eksplisit.

`--dangerously-force-unsafe-install` juga tersedia pada `plugins update` sebagai override darurat untuk false positive pemindaian kode berbahaya bawaan selama pembaruan plugin. Opsi ini tetap tidak melewati blok kebijakan `before_install` plugin atau pemblokiran kegagalan pemindaian, dan hanya berlaku untuk pembaruan plugin, bukan pembaruan hook-pack.

### Inspect

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Introspeksi mendalam untuk satu plugin. Menampilkan identitas, status muat, sumber, kapabilitas yang terdaftar, hook, tool, perintah, layanan, metode gateway, rute HTTP, flag kebijakan, diagnostik, metadata instalasi, kapabilitas bundel, serta dukungan server MCP atau LSP yang terdeteksi.

Setiap plugin diklasifikasikan berdasarkan apa yang benar-benar didaftarkannya saat runtime:

- **plain-capability** — satu jenis kapabilitas (misalnya plugin khusus provider)
- **hybrid-capability** — beberapa jenis kapabilitas (misalnya teks + ucapan + gambar)
- **hook-only** — hanya hook, tanpa kapabilitas atau permukaan
- **non-capability** — tool/perintah/layanan tetapi tanpa kapabilitas

Lihat [Bentuk Plugin](/id/plugins/architecture#plugin-shapes) untuk informasi lebih lanjut tentang model kapabilitas.

Flag `--json` menghasilkan laporan yang dapat dibaca mesin dan cocok untuk scripting serta audit.

`inspect --all` merender tabel seluruh armada dengan bentuk, jenis kapabilitas, pemberitahuan kompatibilitas, kapabilitas bundel, dan kolom ringkasan hook.

`info` adalah alias untuk `inspect`.

### Doctor

```bash
openclaw plugins doctor
```

`doctor` melaporkan kesalahan pemuatan plugin, diagnostik manifes/discovery, dan pemberitahuan kompatibilitas. Saat semuanya bersih, perintah ini mencetak `Tidak ada masalah plugin yang terdeteksi.`

Untuk kegagalan bentuk modul seperti ekspor `register`/`activate` yang hilang, jalankan ulang dengan `OPENCLAW_PLUGIN_LOAD_DEBUG=1` untuk menyertakan ringkasan bentuk ekspor yang ringkas dalam keluaran diagnostik.

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Daftar marketplace menerima path marketplace lokal, path `marketplace.json`, singkatan GitHub seperti `owner/repo`, URL repo GitHub, atau URL git. `--json` mencetak label sumber yang diselesaikan beserta manifes marketplace yang diurai dan entri plugin.

## Terkait

- [Referensi CLI](/id/cli)
- [Membangun plugin](/id/plugins/building-plugins)
- [Plugin komunitas](/id/plugins/community)
