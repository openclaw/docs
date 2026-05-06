---
read_when:
    - Anda menginginkan contoh singkat untuk menginstal, mencantumkan, memperbarui, atau menghapus Plugin
    - Anda ingin memilih antara ClawHub dan distribusi Plugin npm
    - Anda sedang menerbitkan paket Plugin
sidebarTitle: Manage plugins
summary: Contoh cepat untuk memasang, menampilkan daftar, menghapus pemasangan, memperbarui, dan memublikasikan Plugin OpenClaw
title: Kelola Plugin
x-i18n:
    generated_at: "2026-05-06T17:58:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 265777b03434dd07caee6191765c34e17fda4c8347e0327c2f37d47f9dd7a054
    source_path: plugins/manage-plugins.md
    workflow: 16
---

Sebagian besar alur kerja Plugin hanya terdiri dari beberapa perintah: mencari, memasang, memulai ulang Gateway,
memverifikasi, dan mencopot pemasangan saat Anda tidak lagi membutuhkan Plugin tersebut.

## Daftar Plugin

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Gunakan `--json` untuk skrip. Ini menyertakan diagnostik registri dan
`dependencyStatus` statis setiap Plugin saat paket Plugin mendeklarasikan
`dependencies` atau `optionalDependencies`.

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` adalah pemeriksaan inventaris dingin. Ini menampilkan apa yang
dapat ditemukan OpenClaw dari konfigurasi, manifes, dan registri Plugin; ini
tidak membuktikan bahwa proses Gateway yang sudah berjalan telah mengimpor
runtime Plugin.

## Pasang Plugin

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

Setelah memasang kode Plugin, mulai ulang Gateway yang melayani channel Anda:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

Gunakan `inspect --runtime` saat Anda membutuhkan bukti bahwa Plugin telah
mendaftarkan permukaan runtime seperti alat, hook, layanan, metode Gateway, atau
perintah CLI milik Plugin.

## Perbarui Plugin

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
```

Jika sebuah Plugin dipasang dari npm dist-tag seperti `@beta`, panggilan
`update <plugin-id>` berikutnya akan menggunakan ulang tag yang tercatat itu.
Meneruskan spec npm eksplisit akan mengalihkan pemasangan yang dilacak ke spec
tersebut untuk pembaruan mendatang.

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

Perintah kedua memindahkan Plugin kembali ke jalur rilis default registri saat
sebelumnya dipin ke versi atau tag yang tepat.

Saat `openclaw update` berjalan di channel beta, catatan Plugin npm dan ClawHub
jalur default akan mencoba rilis Plugin `@beta` yang cocok terlebih dahulu. Jika
rilis beta tersebut tidak ada, OpenClaw kembali ke spec default/latest yang
tercatat. Untuk Plugin npm, OpenClaw juga melakukan fallback saat paket beta ada
tetapi gagal validasi pemasangan. Versi tepat dan tag eksplisit seperti `@rc`
atau `@beta` dipertahankan.

## Copot Plugin

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
openclaw gateway restart
```

Pencopotan menghapus entri konfigurasi Plugin, catatan indeks Plugin, entri
daftar izin/tolak, dan jalur muat tertaut saat berlaku. Direktori pemasangan
terkelola dihapus kecuali Anda meneruskan `--keep-files`.

Dalam mode Nix (`OPENCLAW_NIX_MODE=1`), perintah pemasangan, pembaruan,
pencopotan, pengaktifan, dan penonaktifan Plugin dinonaktifkan. Kelola pilihan
tersebut di sumber Nix untuk pemasangannya; untuk nix-openclaw, gunakan
[Mulai Cepat](https://github.com/openclaw/nix-openclaw#quick-start) yang
mengutamakan agen.

## Publikasikan Plugin

Anda dapat memublikasikan Plugin eksternal ke [ClawHub](https://clawhub.ai),
npmjs.com, atau keduanya.

### Publikasikan ke ClawHub

ClawHub adalah permukaan penemuan publik utama untuk Plugin OpenClaw. Ini
memberikan metadata yang dapat dicari, riwayat versi, dan hasil pemindaian
registri kepada pengguna sebelum pemasangan.

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

Pengguna memasang dari ClawHub dengan:

```bash
openclaw plugins install clawhub:<package>
openclaw plugins install <package>
```

Bentuk polos tetap memeriksa ClawHub terlebih dahulu.

### Publikasikan ke npmjs.com

Plugin npm native harus menyertakan manifes Plugin dan metadata entrypoint
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

Pengguna memasang yang hanya npm dengan:

```bash
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

Jika paket yang sama juga tersedia di ClawHub, `npm:` melewati pencarian ClawHub
dan memaksa resolusi npm.

## Pilihan Sumber

- **ClawHub**: gunakan saat Anda menginginkan penemuan native OpenClaw,
  ringkasan pemindaian, versi, dan petunjuk pemasangan.
- **npmjs.com**: gunakan saat Anda sudah mengirimkan paket JavaScript atau
  membutuhkan alur kerja dist-tag/registri privat npm.
- **Git**: gunakan saat Anda ingin memasang langsung dari branch, tag, atau commit.
- **Jalur lokal**: gunakan saat Anda sedang mengembangkan atau menguji Plugin di
  mesin yang sama.

## Terkait

- [Plugin](/id/tools/plugin) - ikhtisar dan pemecahan masalah
- [`openclaw plugins`](/id/cli/plugins) - referensi CLI lengkap
- [ClawHub](/id/tools/clawhub) - operasi publikasi dan registri
- [Membangun Plugin](/id/plugins/building-plugins) - buat paket Plugin
- [Manifes Plugin](/id/plugins/manifest) - manifes dan metadata paket
