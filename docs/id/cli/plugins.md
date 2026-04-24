---
read_when:
    - Anda ingin memasang atau mengelola Plugin Gateway atau bundle yang kompatibel
    - Anda ingin men-debug kegagalan pemuatan Plugin
summary: Referensi CLI untuk `openclaw plugins` (daftar, instal, marketplace, uninstall, aktifkan/nonaktifkan, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-04-24T09:02:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35ef8f54c64ea52d7618a0ef8b90d3d75841a27ae4cd689b4ca8e0cfdcddc408
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

Kelola Plugin Gateway, paket hook, dan bundle yang kompatibel.

Terkait:

- Sistem Plugin: [Plugin](/id/tools/plugin)
- Kompatibilitas bundle: [Bundle Plugin](/id/plugins/bundles)
- Manifest + skema Plugin: [Manifest Plugin](/id/plugins/manifest)
- Hardening keamanan: [Keamanan](/id/gateway/security)

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

Plugin bawaan dikirim bersama OpenClaw. Beberapa diaktifkan secara default (misalnya
provider model bawaan, provider speech bawaan, dan Plugin browser
bawaan); yang lain memerlukan `plugins enable`.

Plugin native OpenClaw harus menyertakan `openclaw.plugin.json` dengan JSON
Schema inline (`configSchema`, meskipun kosong). Bundle yang kompatibel menggunakan
manifest bundle mereka sendiri.

`plugins list` menampilkan `Format: openclaw` atau `Format: bundle`. Output
verbose list/info juga menampilkan subtipe bundle (`codex`, `claude`, atau `cursor`) ditambah
kapabilitas bundle yang terdeteksi.

### Instal

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

Nama package polos diperiksa ke ClawHub terlebih dahulu, lalu npm. Catatan keamanan:
perlakukan pemasangan Plugin seperti menjalankan kode. Utamakan versi yang dipin.

Jika section `plugins` Anda didukung oleh `$include` file tunggal, `plugins install/update/enable/disable/uninstall` menulis ke file yang di-include tersebut dan membiarkan `openclaw.json` tidak tersentuh. Include root, array include, dan include dengan override saudara gagal tertutup alih-alih diratakan. Lihat [Include config](/id/gateway/configuration) untuk bentuk yang didukung.

Jika konfigurasi tidak valid, `plugins install` biasanya gagal tertutup dan menyuruh Anda
menjalankan `openclaw doctor --fix` terlebih dahulu. Satu-satunya pengecualian yang didokumentasikan adalah jalur pemulihan Plugin bawaan yang sempit
untuk Plugin yang secara eksplisit memilih
`openclaw.install.allowInvalidConfigRecovery`.

`--force` menggunakan kembali target instalasi yang ada dan menimpa Plugin
atau paket hook yang sudah terpasang di tempat. Gunakan saat Anda sengaja memasang ulang
id yang sama dari path lokal baru, arsip, package ClawHub, atau artefak npm.
Untuk upgrade rutin Plugin npm yang sudah dilacak, utamakan
`openclaw plugins update <id-or-npm-spec>`.

Jika Anda menjalankan `plugins install` untuk id Plugin yang sudah terpasang, OpenClaw
berhenti dan mengarahkan Anda ke `plugins update <id-or-npm-spec>` untuk upgrade normal,
atau ke `plugins install <package> --force` saat Anda benar-benar ingin menimpa
instalasi saat ini dari sumber berbeda.

`--pin` hanya berlaku untuk pemasangan npm. Ini tidak didukung dengan `--marketplace`,
karena pemasangan marketplace menyimpan metadata sumber marketplace, bukan
spec npm.

`--dangerously-force-unsafe-install` adalah opsi break-glass untuk false positive
dalam pemindai kode berbahaya bawaan. Opsi ini memungkinkan pemasangan tetap berlanjut bahkan
ketika pemindai bawaan melaporkan temuan `critical`, tetapi **tidak**
melewati blok kebijakan hook `before_install` Plugin dan **tidak** melewati kegagalan pemindaian.

Flag CLI ini berlaku untuk alur install/update Plugin. Pemasangan dependensi Skills
yang didukung gateway menggunakan override permintaan `dangerouslyForceUnsafeInstall` yang sesuai, sedangkan `openclaw skills install` tetap merupakan alur unduh/pasang Skills ClawHub
yang terpisah.

`plugins install` juga merupakan permukaan instalasi untuk paket hook yang mengekspos
`openclaw.hooks` di `package.json`. Gunakan `openclaw hooks` untuk visibilitas hook
yang difilter dan pengaktifan per-hook, bukan untuk pemasangan package.

Spec npm bersifat **hanya registry** (nama package + opsional **versi persis** atau
**dist-tag**). Spec git/URL/file dan rentang semver ditolak. Pemasangan dependensi
berjalan dengan `--ignore-scripts` demi keamanan.

Spec polos dan `@latest` tetap berada di jalur stabil. Jika npm menyelesaikan salah
satunya ke prerelease, OpenClaw berhenti dan meminta Anda untuk memilih secara eksplisit dengan
tag prerelease seperti `@beta`/`@rc` atau versi prerelease persis seperti
`@1.2.3-beta.4`.

Jika spec install polos cocok dengan id Plugin bawaan (misalnya `diffs`), OpenClaw
memasang Plugin bawaan secara langsung. Untuk memasang package npm dengan nama
yang sama, gunakan spec scoped eksplisit (misalnya `@scope/diffs`).

Arsip yang didukung: `.zip`, `.tgz`, `.tar.gz`, `.tar`.

Pemasangan marketplace Claude juga didukung.

Pemasangan ClawHub menggunakan locator eksplisit `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw sekarang juga memprioritaskan ClawHub untuk spec Plugin aman-npm polos. OpenClaw hanya
fallback ke npm jika ClawHub tidak memiliki package atau versi tersebut:

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw mengunduh arsip package dari ClawHub, memeriksa kompatibilitas
API Plugin / gateway minimum yang diiklankan, lalu memasangnya melalui jalur
arsip normal. Instalasi yang tercatat mempertahankan metadata sumber ClawHub untuk pembaruan berikutnya.

Gunakan singkatan `plugin@marketplace` ketika nama marketplace ada di
cache registry lokal Claude di `~/.claude/plugins/known_marketplaces.json`:

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

Untuk marketplace jarak jauh yang dimuat dari GitHub atau git, entri Plugin harus tetap
berada di dalam repo marketplace yang di-clone. OpenClaw menerima sumber path relatif dari
repo tersebut dan menolak HTTP(S), path absolut, git, GitHub, serta sumber Plugin non-path lain dari manifest jarak jauh.

Untuk path dan arsip lokal, OpenClaw mendeteksi otomatis:

- Plugin native OpenClaw (`openclaw.plugin.json`)
- bundle kompatibel Codex (`.codex-plugin/plugin.json`)
- bundle kompatibel Claude (`.claude-plugin/plugin.json` atau tata letak komponen Claude default)
- bundle kompatibel Cursor (`.cursor-plugin/plugin.json`)

Bundle yang kompatibel dipasang ke root Plugin normal dan ikut serta dalam
alur list/info/enable/disable yang sama. Saat ini, Skills bundle, command-Skills Claude, default `settings.json` Claude, default Claude `.lsp.json` /
`lspServers` yang dideklarasikan manifest, command-Skills Cursor, dan direktori hook Codex
yang kompatibel didukung; kapabilitas bundle terdeteksi lainnya
ditampilkan dalam diagnostik/info tetapi belum dihubungkan ke eksekusi runtime.

### Daftar

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Gunakan `--enabled` untuk menampilkan hanya Plugin yang dimuat. Gunakan `--verbose` untuk beralih dari
tampilan tabel ke baris detail per-Plugin dengan metadata sumber/asal/versi/aktivasi.
Gunakan `--json` untuk inventaris yang dapat dibaca mesin ditambah diagnostik
registry.

Gunakan `--link` agar tidak menyalin direktori lokal (menambahkannya ke `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

`--force` tidak didukung dengan `--link` karena instalasi tertaut menggunakan kembali
path sumber alih-alih menyalin ke target instalasi terkelola.

Gunakan `--pin` pada pemasangan npm untuk menyimpan spec persis yang diselesaikan (`name@version`) di
`plugins.installs` sambil mempertahankan perilaku default tanpa pin.

### Uninstall

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` menghapus catatan Plugin dari `plugins.entries`, `plugins.installs`,
allowlist Plugin, dan entri `plugins.load.paths` yang tertaut jika berlaku.
Untuk Plugin Active Memory, slot memori direset ke `memory-core`.

Secara default, uninstall juga menghapus direktori instalasi Plugin di bawah
root Plugin state-dir yang aktif. Gunakan
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

Pembaruan berlaku untuk instalasi terlacak di `plugins.installs` dan instalasi paket hook terlacak di `hooks.internal.installs`.

Saat Anda memberikan id Plugin, OpenClaw menggunakan kembali spec instalasi yang tercatat untuk
Plugin tersebut. Ini berarti dist-tag yang sebelumnya disimpan seperti `@beta` dan versi persis yang dipin
tetap digunakan pada eksekusi `update <id>` berikutnya.

Untuk pemasangan npm, Anda juga dapat memberikan spec package npm eksplisit dengan dist-tag
atau versi persis. OpenClaw menyelesaikan nama package tersebut kembali ke catatan Plugin yang dilacak,
memperbarui Plugin yang terpasang, dan mencatat spec npm baru untuk pembaruan berbasis id di masa depan.

Memberikan nama package npm tanpa versi atau tag juga akan diselesaikan kembali ke
catatan Plugin yang dilacak. Gunakan ini saat sebuah Plugin dipin ke versi persis dan
Anda ingin memindahkannya kembali ke jalur rilis default registry.

Sebelum pembaruan npm langsung, OpenClaw memeriksa versi package terpasang terhadap
metadata registry npm. Jika versi terpasang dan identitas artefak yang tercatat
sudah cocok dengan target yang diselesaikan, pembaruan dilewati tanpa
mengunduh, memasang ulang, atau menulis ulang `openclaw.json`.

Saat hash integritas yang disimpan ada dan hash artefak yang diambil berubah,
OpenClaw memperlakukannya sebagai drift artefak npm. Perintah interaktif
`openclaw plugins update` mencetak hash yang diharapkan dan aktual lalu meminta
konfirmasi sebelum melanjutkan. Pembantu pembaruan non-interaktif gagal tertutup
kecuali pemanggil memberikan kebijakan kelanjutan eksplisit.

`--dangerously-force-unsafe-install` juga tersedia pada `plugins update` sebagai
override break-glass untuk false positive pemindaian kode berbahaya bawaan selama
pembaruan Plugin. Ini tetap tidak melewati blok kebijakan `before_install` Plugin
atau pemblokiran kegagalan pemindaian, dan hanya berlaku untuk pembaruan Plugin, bukan pembaruan paket hook.

### Inspect

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Introspeksi mendalam untuk satu Plugin. Menampilkan identitas, status muat, sumber,
kapabilitas terdaftar, hook, alat, perintah, layanan, metode gateway,
rute HTTP, flag kebijakan, diagnostik, metadata instalasi, kapabilitas bundle,
dan dukungan MCP atau LSP server apa pun yang terdeteksi.

Setiap Plugin diklasifikasikan berdasarkan apa yang benar-benar didaftarkannya saat runtime:

- **plain-capability** — satu jenis kapabilitas (misalnya Plugin khusus provider)
- **hybrid-capability** — beberapa jenis kapabilitas (misalnya teks + speech + gambar)
- **hook-only** — hanya hook, tanpa kapabilitas atau permukaan
- **non-capability** — alat/perintah/layanan tetapi tanpa kapabilitas

Lihat [Bentuk Plugin](/id/plugins/architecture#plugin-shapes) untuk informasi lebih lanjut tentang model kapabilitas.

Flag `--json` mengeluarkan laporan yang dapat dibaca mesin dan cocok untuk scripting serta
audit.

`inspect --all` merender tabel seluruh armada dengan kolom bentuk, jenis kapabilitas,
pemberitahuan kompatibilitas, kapabilitas bundle, dan ringkasan hook.

`info` adalah alias untuk `inspect`.

### Doctor

```bash
openclaw plugins doctor
```

`doctor` melaporkan error pemuatan Plugin, diagnostik manifest/discovery, dan
pemberitahuan kompatibilitas. Ketika semuanya bersih, output-nya adalah `No plugin issues
detected.`

Untuk kegagalan bentuk modul seperti ekspor `register`/`activate` yang hilang, jalankan ulang
dengan `OPENCLAW_PLUGIN_LOAD_DEBUG=1` untuk menyertakan ringkasan bentuk ekspor ringkas di
output diagnostik.

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Daftar marketplace menerima path marketplace lokal, path `marketplace.json`, singkatan
GitHub seperti `owner/repo`, URL repo GitHub, atau URL git. `--json`
mencetak label sumber yang diselesaikan plus manifest marketplace yang di-parse dan
entri Plugin.

## Terkait

- [Referensi CLI](/id/cli)
- [Membangun Plugin](/id/plugins/building-plugins)
- [Plugin komunitas](/id/plugins/community)
