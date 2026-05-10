---
read_when:
    - Anda menginginkan contoh cepat untuk menginstal, menampilkan daftar, memperbarui, atau menghapus instalan plugin
    - Anda ingin memilih antara distribusi Plugin melalui ClawHub dan npm
    - Anda sedang menerbitkan paket Plugin
sidebarTitle: Manage plugins
summary: Contoh singkat untuk memasang, menampilkan daftar, mencopot pemasangan, memperbarui, dan memublikasikan Plugin OpenClaw
title: Kelola Plugin
x-i18n:
    generated_at: "2026-05-10T19:44:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5f666a8196c802190dfd69e8b6a679a47db22f97c4c14d2f9fed73e8fb1ffe5a
    source_path: plugins/manage-plugins.md
    workflow: 16
---

Sebagian besar alur kerja plugin hanya terdiri dari beberapa perintah: cari, instal, mulai ulang Gateway,
verifikasi, dan hapus instalasi saat Anda tidak lagi memerlukan plugin tersebut.

## Cantumkan plugin

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Gunakan `--json` untuk skrip. Ini menyertakan diagnostik registri dan
`dependencyStatus` statis setiap plugin saat paket plugin mendeklarasikan
`dependencies` atau `optionalDependencies`.

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` adalah pemeriksaan inventaris dingin. Ini menampilkan apa yang dapat ditemukan OpenClaw
dari konfigurasi, manifes, dan registri plugin; ini tidak membuktikan bahwa
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

Gunakan `inspect --runtime` saat Anda memerlukan bukti bahwa plugin mendaftarkan
permukaan runtime seperti alat, hook, layanan, metode Gateway, atau perintah CLI
milik plugin.

## Perbarui plugin

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
```

Jika sebuah plugin diinstal dari dist-tag npm seperti `@beta`, pemanggilan
`update <plugin-id>` berikutnya menggunakan kembali tag yang tercatat tersebut. Meneruskan spec npm eksplisit
mengalihkan instalasi yang dilacak ke spec tersebut untuk pembaruan mendatang.

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

Perintah kedua memindahkan plugin kembali ke jalur rilis default registri
saat sebelumnya dipin ke versi atau tag yang tepat.

Saat `openclaw update` berjalan pada saluran beta, catatan plugin npm dan ClawHub
jalur default mencoba rilis plugin `@beta` yang cocok terlebih dahulu. Jika rilis beta
tersebut tidak ada, OpenClaw beralih ke spec default/latest yang tercatat.
Untuk plugin npm, OpenClaw juga beralih saat paket beta ada tetapi gagal
validasi instalasi. Versi tepat dan tag eksplisit seperti `@rc` atau `@beta`
dipertahankan.

## Hapus instalasi plugin

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
openclaw gateway restart
```

Penghapusan instalasi menghapus entri konfigurasi plugin, catatan indeks plugin, entri daftar
izinkan/tolak, dan jalur pemuatan tertaut bila berlaku. Direktori instalasi terkelola
dihapus kecuali Anda meneruskan `--keep-files`.

Dalam mode Nix (`OPENCLAW_NIX_MODE=1`), perintah instal, perbarui, hapus instalasi, aktifkan,
dan nonaktifkan plugin dinonaktifkan. Kelola pilihan tersebut di sumber Nix untuk
instalasi sebagai gantinya; untuk nix-openclaw, gunakan
[Mulai Cepat](https://github.com/openclaw/nix-openclaw#quick-start) yang mengutamakan agen.

## Publikasikan plugin

Anda dapat memublikasikan plugin eksternal ke [ClawHub](https://clawhub.ai), npmjs.com, atau
keduanya.

### Publikasikan ke ClawHub

ClawHub adalah permukaan penemuan publik utama untuk plugin OpenClaw. Ini memberi
pengguna metadata yang dapat dicari, riwayat versi, dan hasil pemindaian registri sebelum
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

Plugin npm native harus menyertakan manifes plugin dan metadata entrypoint OpenClaw
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

Pengguna menginstal hanya-npm dengan:

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
- **npmjs.com**: gunakan saat Anda sudah mengirimkan paket JavaScript atau memerlukan
  alur kerja dist-tag npm/registri privat.
- **Git**: gunakan saat Anda ingin menginstal langsung dari branch, tag, atau commit.
- **Jalur lokal**: gunakan saat Anda mengembangkan atau menguji plugin di mesin yang sama.

## Terkait

- [Plugin](/id/tools/plugin) - ikhtisar dan pemecahan masalah
- [`openclaw plugins`](/id/cli/plugins) - referensi CLI lengkap
- [ClawHub](/id/clawhub/cli) - publikasi dan operasi registri
- [Membangun plugin](/id/plugins/building-plugins) - buat paket plugin
- [Manifes plugin](/id/plugins/manifest) - metadata manifes dan paket
