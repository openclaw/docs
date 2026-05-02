---
read_when:
    - Anda menginginkan contoh cepat untuk menginstal, melihat daftar, memperbarui, atau menghapus instalasi Plugin
    - Anda ingin memilih antara ClawHub dan distribusi Plugin npm
    - Anda sedang menerbitkan paket Plugin
sidebarTitle: Manage plugins
summary: Contoh cepat untuk menginstal, menampilkan daftar, menghapus instalasi, memperbarui, dan menerbitkan Plugin OpenClaw
title: Kelola plugin
x-i18n:
    generated_at: "2026-05-02T20:47:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: c5a1c58da41b243cebe1c163048918a94c492b77fdae1613bd008cb267670041
    source_path: plugins/manage-plugins.md
    workflow: 16
---

Sebagian besar alur kerja Plugin hanya terdiri dari beberapa perintah: cari, instal, mulai ulang Gateway,
verifikasi, dan hapus instalasi saat Anda tidak lagi membutuhkan Plugin.

## Daftar Plugin

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Gunakan `--json` untuk skrip. Ini mencakup diagnostik registry dan
`dependencyStatus` statis setiap Plugin saat paket Plugin mendeklarasikan
`dependencies` atau `optionalDependencies`.

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` adalah pemeriksaan inventaris dingin. Ini menampilkan apa yang
dapat ditemukan OpenClaw dari konfigurasi, manifest, dan registry Plugin; ini
tidak membuktikan bahwa proses Gateway yang sudah berjalan telah mengimpor runtime
Plugin.

## Instal Plugin

```bash
# Cari paket Plugin di ClawHub.
openclaw plugins search "calendar"

# Spesifikasi paket polos mencoba ClawHub terlebih dahulu, lalu fallback npm.
openclaw plugins install <package>

# Paksa satu sumber.
openclaw plugins install clawhub:<package>
openclaw plugins install npm:<package>

# Instal versi atau dist-tag tertentu.
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex@beta

# Instal dari git atau checkout pengembangan lokal.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

Setelah menginstal kode Plugin, mulai ulang Gateway yang melayani channel Anda:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

Gunakan `inspect --runtime` saat Anda memerlukan bukti bahwa Plugin telah
mendaftarkan permukaan runtime seperti alat, hook, layanan, metode Gateway, atau
perintah CLI milik Plugin.

## Perbarui Plugin

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
```

Jika Plugin diinstal dari dist-tag npm seperti `@beta`, panggilan
`update <plugin-id>` berikutnya menggunakan kembali tag yang tercatat tersebut.
Meneruskan spesifikasi npm eksplisit mengalihkan instalasi yang dilacak ke
spesifikasi tersebut untuk pembaruan berikutnya.

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

Perintah kedua memindahkan Plugin kembali ke jalur rilis default registry saat
sebelumnya dipatok ke versi atau tag persis.

Saat `openclaw update` berjalan di channel beta, catatan Plugin npm jalur default
dan ClawHub mencoba rilis Plugin `@beta` yang cocok terlebih dahulu. Jika rilis
beta tersebut tidak ada, OpenClaw fallback ke spesifikasi default/terbaru yang
tercatat. Versi persis dan tag eksplisit seperti `@rc` atau `@beta` dipertahankan.

## Hapus Instalasi Plugin

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
openclaw gateway restart
```

Penghapusan instalasi menghapus entri konfigurasi Plugin, catatan indeks Plugin,
entri daftar izinkan/tolak, dan jalur muat tertaut jika berlaku. Direktori
instalasi terkelola dihapus kecuali Anda meneruskan `--keep-files`.

## Publikasikan Plugin

Anda dapat memublikasikan Plugin eksternal ke [ClawHub](https://clawhub.ai),
npmjs.com, atau keduanya.

### Publikasikan ke ClawHub

ClawHub adalah permukaan penemuan publik utama untuk Plugin OpenClaw. Ini memberi
pengguna metadata yang dapat dicari, riwayat versi, dan hasil pemindaian registry
sebelum instalasi.

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

Pengguna menginstal dari ClawHub dengan:

```bash
openclaw plugins install clawhub:<package>
openclaw plugins install <package>
```

Bentuk polos tetap memeriksa ClawHub terlebih dahulu.

### Publikasikan ke npmjs.com

Plugin npm native harus menyertakan manifest Plugin dan metadata entrypoint
OpenClaw `package.json`.

```json package.json
{
  "name": "@acme/openclaw-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./dist/index.js"]
  }
}
```

```bash
npm publish --access public
```

Pengguna menginstal khusus npm dengan:

```bash
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

Jika paket yang sama juga tersedia di ClawHub, `npm:` melewati pencarian ClawHub
dan memaksa resolusi npm.

## Pilihan Sumber

- **ClawHub**: gunakan saat Anda menginginkan penemuan native OpenClaw, ringkasan
  pemindaian, versi, dan petunjuk instalasi.
- **npmjs.com**: gunakan saat Anda sudah mengirim paket JavaScript atau membutuhkan
  alur kerja dist-tag/registry privat npm.
- **Git**: gunakan saat Anda ingin menginstal langsung dari branch, tag, atau commit.
- **Jalur lokal**: gunakan saat Anda mengembangkan atau menguji Plugin di mesin
  yang sama.

## Terkait

- [Plugin](/id/tools/plugin) - ikhtisar dan pemecahan masalah
- [`openclaw plugins`](/id/cli/plugins) - referensi CLI lengkap
- [ClawHub](/id/tools/clawhub) - operasi publikasi dan registry
- [Membangun Plugin](/id/plugins/building-plugins) - membuat paket Plugin
- [Manifest Plugin](/id/plugins/manifest) - metadata manifest dan paket
