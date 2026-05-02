---
read_when:
    - Anda membutuhkan contoh cepat untuk menginstal, menampilkan daftar, memperbarui, atau menghapus instalasi Plugin
    - Anda ingin memilih antara ClawHub dan distribusi Plugin npm
    - Anda sedang menerbitkan paket Plugin
sidebarTitle: Manage plugins
summary: Contoh cepat untuk menginstal, menampilkan daftar, menghapus instalasi, memperbarui, dan menerbitkan Plugin OpenClaw
title: Kelola Plugin
x-i18n:
    generated_at: "2026-05-02T22:19:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: ec25a811b942f155f5d5e4cac475dbef74f0616bc85ff182c74598184e910320
    source_path: plugins/manage-plugins.md
    workflow: 16
---

Sebagian besar alur kerja plugin terdiri dari beberapa perintah: cari, instal, mulai ulang Gateway,
verifikasi, dan hapus instalasi saat Anda tidak lagi membutuhkan plugin tersebut.

## Daftar plugin

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Gunakan `--json` untuk skrip. Ini mencakup diagnostik registry dan
`dependencyStatus` statis setiap plugin saat paket plugin mendeklarasikan
`dependencies` atau `optionalDependencies`.

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` adalah pemeriksaan inventaris dingin. Ini menunjukkan apa yang dapat ditemukan OpenClaw
dari konfigurasi, manifes, dan registry plugin; ini tidak membuktikan bahwa
proses Gateway yang sudah berjalan telah mengimpor runtime plugin.

## Instal plugin

```bash
# Search ClawHub for plugin packages.
openclaw plugins search "calendar"

# Bare package specs try ClawHub first, then npm fallback.
openclaw plugins install <package>

# Force one source.
openclaw plugins install clawhub:<package>
openclaw plugins install npm:<package>

# Install a specific version or dist-tag.
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex

# Install from git or a local development checkout.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

Setelah menginstal kode plugin, mulai ulang Gateway yang melayani saluran Anda:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

Gunakan `inspect --runtime` saat Anda membutuhkan bukti bahwa plugin mendaftarkan permukaan
runtime seperti alat, hook, layanan, metode Gateway, atau perintah CLI
milik plugin.

## Perbarui plugin

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
```

Jika plugin diinstal dari dist-tag npm seperti `@beta`, pemanggilan
`update <plugin-id>` berikutnya menggunakan kembali tag yang tercatat tersebut. Meneruskan spesifikasi npm eksplisit
mengalihkan instalasi yang dilacak ke spesifikasi tersebut untuk pembaruan mendatang.

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

Perintah kedua memindahkan plugin kembali ke jalur rilis default registry
saat sebelumnya dipasangkan ke versi atau tag yang tepat.

Saat `openclaw update` berjalan pada saluran beta, catatan plugin npm jalur default dan ClawHub
mencoba rilis plugin `@beta` yang cocok terlebih dahulu. Jika rilis beta tersebut
tidak ada, OpenClaw kembali ke spesifikasi default/latest yang tercatat.
Versi tepat dan tag eksplisit seperti `@rc` atau `@beta` dipertahankan.

## Hapus instalasi plugin

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
openclaw gateway restart
```

Penghapusan instalasi menghapus entri konfigurasi plugin, catatan indeks plugin, entri daftar izinkan/tolak,
dan jalur muat tertaut saat berlaku. Direktori instalasi terkelola
dihapus kecuali Anda meneruskan `--keep-files`.

## Publikasikan plugin

Anda dapat memublikasikan plugin eksternal ke [ClawHub](https://clawhub.ai), npmjs.com, atau
keduanya.

### Publikasikan ke ClawHub

ClawHub adalah permukaan penemuan publik utama untuk plugin OpenClaw. Ini memberi
pengguna metadata yang dapat dicari, riwayat versi, dan hasil pemindaian registry sebelum
instalasi.

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

Plugin npm native harus menyertakan manifes plugin dan metadata titik masuk OpenClaw
`package.json`.

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

Jika paket yang sama juga tersedia di ClawHub, `npm:` melewati pencarian ClawHub dan
memaksa resolusi npm.

## Pilihan sumber

- **ClawHub**: gunakan saat Anda menginginkan penemuan native OpenClaw, ringkasan pemindaian,
  versi, dan petunjuk instalasi.
- **npmjs.com**: gunakan saat Anda sudah mengirimkan paket JavaScript atau membutuhkan alur kerja
  dist-tag/registry privat npm.
- **Git**: gunakan saat Anda ingin menginstal langsung dari branch, tag, atau commit.
- **Jalur lokal**: gunakan saat Anda sedang mengembangkan atau menguji plugin pada mesin yang sama.

## Terkait

- [Plugin](/id/tools/plugin) - ikhtisar dan pemecahan masalah
- [`openclaw plugins`](/id/cli/plugins) - referensi CLI lengkap
- [ClawHub](/id/tools/clawhub) - publikasi dan operasi registry
- [Membangun plugin](/id/plugins/building-plugins) - buat paket plugin
- [Manifes plugin](/id/plugins/manifest) - manifes dan metadata paket
