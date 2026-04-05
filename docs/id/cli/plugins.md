---
read_when:
    - Anda ingin menginstal atau mengelola plugin Gateway atau bundle yang kompatibel
    - Anda ingin men-debug kegagalan pemuatan plugin
summary: Referensi CLI untuk `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: plugins
x-i18n:
    generated_at: "2026-04-05T13:49:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8c35ccf68cd7be1af5fee175bd1ce7de88b81c625a05a23887e5780e790df925
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

Kelola plugin/ekstensi Gateway, hook pack, dan bundle yang kompatibel.

Terkait:

- Sistem plugin: [Plugins](/tools/plugin)
- Kompatibilitas bundle: [Plugin bundles](/plugins/bundles)
- Manifest plugin + schema: [Plugin manifest](/plugins/manifest)
- Penguatan keamanan: [Security](/gateway/security)

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
openclaw plugins update <id>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

Plugin bawaan dikirim bersama OpenClaw. Beberapa diaktifkan secara default (misalnya
provider model bawaan, provider speech bawaan, dan plugin browser
bawaan); yang lain memerlukan `plugins enable`.

Plugin OpenClaw native harus menyertakan `openclaw.plugin.json` dengan JSON
Schema inline (`configSchema`, meskipun kosong). Bundle yang kompatibel menggunakan
manifest bundle mereka sendiri.

`plugins list` menampilkan `Format: openclaw` atau `Format: bundle`. Output
verbose list/info juga menampilkan subtipe bundle (`codex`, `claude`, atau `cursor`) serta kemampuan bundle
yang terdeteksi.

### Instal

```bash
openclaw plugins install <package>                      # ClawHub terlebih dahulu, lalu npm
openclaw plugins install clawhub:<package>              # hanya ClawHub
openclaw plugins install <package> --force              # timpa instalasi yang ada
openclaw plugins install <package> --pin                # pin versi
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # path lokal
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (eksplisit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

Nama package polos diperiksa ke ClawHub terlebih dahulu, lalu npm. Catatan keamanan:
anggap instalasi plugin seperti menjalankan kode. Sebaiknya gunakan versi yang dipin.

Jika config tidak valid, `plugins install` biasanya gagal secara tertutup dan memberi tahu Anda untuk
menjalankan `openclaw doctor --fix` terlebih dahulu. Satu-satunya pengecualian yang terdokumentasi adalah jalur pemulihan plugin bawaan yang sempit
untuk plugin yang secara eksplisit memilih
`openclaw.install.allowInvalidConfigRecovery`.

`--force` menggunakan ulang target instalasi yang ada dan menimpa plugin atau hook pack
yang sudah terinstal di tempat. Gunakan saat Anda sengaja menginstal ulang
id yang sama dari path lokal baru, arsip, package ClawHub, atau artefak npm.

`--pin` hanya berlaku untuk instalasi npm. Ini tidak didukung dengan `--marketplace`,
karena instalasi marketplace menyimpan metadata sumber marketplace, bukan
spec npm.

`--dangerously-force-unsafe-install` adalah opsi darurat untuk false positive
dalam pemindai kode berbahaya bawaan. Ini memungkinkan instalasi tetap berlanjut bahkan
saat pemindai bawaan melaporkan temuan `critical`, tetapi **tidak**
melewati blok kebijakan hook plugin `before_install` dan **tidak** melewati
kegagalan pemindaian.

Flag CLI ini berlaku untuk alur instal/update plugin. Instalasi dependensi skill
berbasis Gateway menggunakan override permintaan `dangerouslyForceUnsafeInstall` yang sesuai, sedangkan `openclaw skills install` tetap merupakan alur
unduh/instal skill ClawHub yang terpisah.

`plugins install` juga merupakan permukaan instalasi untuk hook pack yang mengekspos
`openclaw.hooks` di `package.json`. Gunakan `openclaw hooks` untuk visibilitas hook
yang difilter dan pengaktifan per hook, bukan instalasi package.

Spec npm hanya **khusus registry** (nama package + **versi exact** opsional atau
**dist-tag**). Spec git/URL/file dan rentang semver ditolak. Instalasi dependensi
berjalan dengan `--ignore-scripts` demi keamanan.

Spec polos dan `@latest` tetap berada di jalur stabil. Jika npm menyelesaikan salah satu
dari itu ke prerelease, OpenClaw akan berhenti dan meminta Anda memilihnya secara eksplisit dengan
tag prerelease seperti `@beta`/`@rc` atau versi prerelease exact seperti
`@1.2.3-beta.4`.

Jika spec instalasi polos cocok dengan id plugin bawaan (misalnya `diffs`), OpenClaw
menginstal plugin bawaan secara langsung. Untuk menginstal package npm dengan nama yang sama,
gunakan spec berscope yang eksplisit (misalnya `@scope/diffs`).

Arsip yang didukung: `.zip`, `.tgz`, `.tar.gz`, `.tar`.

Instalasi marketplace Claude juga didukung.

Instalasi ClawHub menggunakan locator `clawhub:<package>` yang eksplisit:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw kini juga memprioritaskan ClawHub untuk spec plugin polos yang aman untuk npm. OpenClaw hanya
fallback ke npm jika ClawHub tidak memiliki package atau versi tersebut:

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw mengunduh arsip package dari ClawHub, memeriksa kompatibilitas
API plugin / gateway minimum yang diiklankan, lalu menginstalnya melalui jalur
arsip normal. Instalasi yang dicatat mempertahankan metadata sumber ClawHub untuk update berikutnya.

Gunakan singkatan `plugin@marketplace` saat nama marketplace ada di cache registry
lokal Claude di `~/.claude/plugins/known_marketplaces.json`:

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

Sumber marketplace dapat berupa:

- nama known-marketplace Claude dari `~/.claude/plugins/known_marketplaces.json`
- root marketplace lokal atau path `marketplace.json`
- singkatan repo GitHub seperti `owner/repo`
- URL repo GitHub seperti `https://github.com/owner/repo`
- URL git

Untuk marketplace remote yang dimuat dari GitHub atau git, entri plugin harus tetap
berada di dalam repo marketplace yang di-clone. OpenClaw menerima sumber path relatif dari
repo itu dan menolak sumber plugin HTTP(S), absolute-path, git, GitHub, dan sumber non-path lain dari manifest remote.

Untuk path lokal dan arsip, OpenClaw mendeteksi otomatis:

- plugin OpenClaw native (`openclaw.plugin.json`)
- bundle yang kompatibel dengan Codex (`.codex-plugin/plugin.json`)
- bundle yang kompatibel dengan Claude (`.claude-plugin/plugin.json` atau tata letak komponen Claude default)
- bundle yang kompatibel dengan Cursor (`.cursor-plugin/plugin.json`)

Bundle yang kompatibel diinstal ke root ekstensi normal dan berpartisipasi dalam alur yang sama untuk list/info/enable/disable. Saat ini, skill bundle, Claude
command-skills, default Claude `settings.json`, default Claude `.lsp.json` /
`lspServers` default yang dideklarasikan manifest, Cursor command-skills, dan direktori hook Codex yang kompatibel didukung; kemampuan bundle lain yang terdeteksi
ditampilkan dalam diagnostik/info tetapi belum terhubung ke eksekusi runtime.

### Daftar

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Gunakan `--enabled` untuk hanya menampilkan plugin yang dimuat. Gunakan `--verbose` untuk beralih dari
tampilan tabel ke baris detail per plugin dengan metadata sumber/asal/versi/aktivasi.
Gunakan `--json` untuk inventaris yang dapat dibaca mesin plus
diagnostik registry.

Gunakan `--link` untuk menghindari penyalinan direktori lokal (menambahkan ke `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

`--force` tidak didukung dengan `--link` karena instalasi tertaut menggunakan ulang
path sumber alih-alih menyalin ke target instalasi terkelola.

Gunakan `--pin` pada instalasi npm untuk menyimpan spec exact yang diselesaikan (`name@version`) di
`plugins.installs` sambil mempertahankan perilaku default tanpa pin.

### Uninstal

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` menghapus catatan plugin dari `plugins.entries`, `plugins.installs`,
allowlist plugin, dan entri `plugins.load.paths` yang tertaut jika berlaku.
Untuk plugin memori aktif, slot memory di-reset ke `memory-core`.

Secara default, uninstall juga menghapus direktori instalasi plugin di bawah
root plugin state-dir yang aktif. Gunakan
`--keep-files` untuk mempertahankan file di disk.

`--keep-config` didukung sebagai alias usang untuk `--keep-files`.

### Update

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Update berlaku untuk instalasi terlacak di `plugins.installs` dan instalasi
hook-pack terlacak di `hooks.internal.installs`.

Saat Anda memberikan id plugin, OpenClaw menggunakan ulang spec instalasi yang tercatat untuk
plugin tersebut. Artinya dist-tag yang sebelumnya disimpan seperti `@beta` dan versi exact yang dipin
tetap digunakan pada eksekusi `update <id>` berikutnya.

Untuk instalasi npm, Anda juga dapat memberikan spec package npm yang eksplisit dengan dist-tag
atau versi exact. OpenClaw menyelesaikan nama package itu kembali ke catatan plugin yang terlacak,
meng-update plugin yang terinstal tersebut, dan mencatat spec npm baru untuk update berbasis id di masa mendatang.

Saat hash integritas yang tersimpan ada dan hash artefak yang diambil berubah,
OpenClaw mencetak peringatan dan meminta konfirmasi sebelum melanjutkan. Gunakan
global `--yes` untuk melewati prompt dalam eksekusi CI/non-interaktif.

`--dangerously-force-unsafe-install` juga tersedia pada `plugins update` sebagai
override darurat untuk false positive pemindaian kode berbahaya bawaan selama
update plugin. Ini tetap tidak melewati blok kebijakan plugin `before_install`
atau pemblokiran kegagalan pemindaian, dan hanya berlaku untuk update plugin, bukan update hook-pack.

### Inspect

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Introspeksi mendalam untuk satu plugin. Menampilkan identitas, status muat, sumber,
kemampuan yang terdaftar, hook, tool, perintah, layanan, metode gateway,
rute HTTP, flag kebijakan, diagnostik, metadata instalasi, kemampuan bundle,
serta dukungan MCP atau server LSP yang terdeteksi.

Setiap plugin diklasifikasikan berdasarkan apa yang benar-benar didaftarkannya saat runtime:

- **plain-capability** — satu jenis kemampuan (misalnya plugin khusus provider)
- **hybrid-capability** — beberapa jenis kemampuan (misalnya teks + speech + gambar)
- **hook-only** — hanya hook, tanpa kemampuan atau permukaan
- **non-capability** — tools/perintah/layanan tetapi tanpa kemampuan

Lihat [Plugin shapes](/plugins/architecture#plugin-shapes) untuk informasi lebih lanjut tentang model kemampuan.

Flag `--json` menghasilkan laporan yang dapat dibaca mesin dan cocok untuk scripting serta
audit.

`inspect --all` merender tabel seluruh armada dengan kolom shape, jenis kemampuan,
pemberitahuan kompatibilitas, kemampuan bundle, dan ringkasan hook.

`info` adalah alias untuk `inspect`.

### Doctor

```bash
openclaw plugins doctor
```

`doctor` melaporkan error pemuatan plugin, diagnostik manifest/discovery, dan
pemberitahuan kompatibilitas. Jika semuanya bersih, perintah ini mencetak `No plugin issues
detected.`

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Daftar marketplace menerima path marketplace lokal, path `marketplace.json`, singkatan
GitHub seperti `owner/repo`, URL repo GitHub, atau URL git. `--json`
mencetak label sumber yang diselesaikan beserta manifest marketplace yang diurai dan
entri plugin.
