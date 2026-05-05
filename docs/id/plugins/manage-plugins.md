---
read_when:
    - Anda ingin contoh cepat untuk memasang, menampilkan daftar, memperbarui, atau menghapus Plugin
    - Anda ingin memilih antara distribusi Plugin melalui ClawHub dan npm
    - Anda sedang menerbitkan paket Plugin
sidebarTitle: Manage plugins
summary: Contoh cepat untuk menginstal, menampilkan daftar, menghapus instalasi, memperbarui, dan menerbitkan Plugin OpenClaw
title: Kelola Plugin
x-i18n:
    generated_at: "2026-05-05T01:48:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7fa7aa78c1ba9c83ba09bea073987ed5e037031f7c7f29307fe18934b0bd2a1c
    source_path: plugins/manage-plugins.md
    workflow: 16
---

Sebagian besar alur kerja Plugin hanya terdiri dari beberapa perintah: cari, instal, mulai ulang Gateway,
verifikasi, dan hapus instalasi saat Anda tidak lagi memerlukan Plugin tersebut.

## Daftar Plugin

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Gunakan `--json` untuk skrip. Ini menyertakan diagnostik registri dan
`dependencyStatus` statis setiap Plugin saat paket Plugin mendeklarasikan `dependencies` atau
`optionalDependencies`.

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` adalah pemeriksaan inventaris dingin. Ini menampilkan apa yang dapat ditemukan OpenClaw
dari konfigurasi, manifest, dan registri Plugin; ini tidak membuktikan bahwa
proses Gateway yang sudah berjalan telah mengimpor runtime Plugin.

## Instal Plugin

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

Setelah menginstal kode Plugin, mulai ulang Gateway yang melayani saluran Anda:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

Gunakan `inspect --runtime` saat Anda memerlukan bukti bahwa Plugin telah mendaftarkan permukaan
runtime seperti alat, hook, layanan, metode Gateway, atau perintah CLI
milik Plugin.

## Perbarui Plugin

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
```

Jika sebuah Plugin diinstal dari dist-tag npm seperti `@beta`, panggilan
`update <plugin-id>` berikutnya akan menggunakan kembali tag yang tercatat tersebut. Meneruskan spec npm eksplisit
mengalihkan instalasi yang dilacak ke spec tersebut untuk pembaruan mendatang.

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

Perintah kedua memindahkan Plugin kembali ke jalur rilis default registri
saat sebelumnya dipin ke versi atau tag tertentu.

Saat `openclaw update` berjalan di saluran beta, catatan Plugin npm dan ClawHub
jalur default akan mencoba rilis Plugin `@beta` yang sesuai terlebih dahulu. Jika rilis beta tersebut
tidak ada, OpenClaw kembali ke spec default/latest yang tercatat.
Untuk Plugin npm, OpenClaw juga kembali saat paket beta ada tetapi gagal
validasi instalasi. Versi tepat dan tag eksplisit seperti `@rc` atau `@beta`
dipertahankan.

## Hapus Instalasi Plugin

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
openclaw gateway restart
```

Hapus instalasi menghapus entri konfigurasi Plugin, catatan indeks Plugin, entri daftar
izinkan/tolak, dan jalur muat tertaut jika berlaku. Direktori instalasi terkelola akan
dihapus kecuali Anda meneruskan `--keep-files`.

## Publikasikan Plugin

Anda dapat memublikasikan Plugin eksternal ke [ClawHub](https://clawhub.ai), npmjs.com, atau
keduanya.

### Publikasikan ke ClawHub

ClawHub adalah permukaan penemuan publik utama untuk Plugin OpenClaw. Ini memberi
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

Bentuk tanpa awalan tetap memeriksa ClawHub terlebih dahulu.

### Publikasikan ke npmjs.com

Plugin npm native harus menyertakan manifest Plugin dan metadata entrypoint OpenClaw
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

Pengguna menginstal yang hanya npm dengan:

```bash
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

Jika paket yang sama juga tersedia di ClawHub, `npm:` melewati pencarian ClawHub dan
memaksa resolusi npm.

## Pilihan Sumber

- **ClawHub**: gunakan saat Anda menginginkan penemuan native OpenClaw, ringkasan pemindaian,
  versi, dan petunjuk instalasi.
- **npmjs.com**: gunakan saat Anda sudah mengirimkan paket JavaScript atau memerlukan alur kerja
  dist-tag npm/registri privat.
- **Git**: gunakan saat Anda ingin menginstal langsung dari branch, tag, atau commit.
- **Jalur lokal**: gunakan saat Anda sedang mengembangkan atau menguji Plugin di mesin yang sama.

## Terkait

- [Plugin](/id/tools/plugin) - gambaran umum dan pemecahan masalah
- [`openclaw plugins`](/id/cli/plugins) - referensi CLI lengkap
- [ClawHub](/id/tools/clawhub) - publikasi dan operasi registri
- [Membangun Plugin](/id/plugins/building-plugins) - buat paket Plugin
- [Manifest Plugin](/id/plugins/manifest) - manifest dan metadata paket
