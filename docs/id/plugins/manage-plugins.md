---
doc-schema-version: 1
read_when:
    - Anda menginginkan contoh cepat untuk daftar, pemasangan, pembaruan, pemeriksaan, atau penghapusan plugin
    - Anda ingin memilih sumber instalasi Plugin
    - Anda menginginkan referensi yang tepat untuk menerbitkan paket Plugin
sidebarTitle: Manage plugins
summary: Contoh cepat untuk mencantumkan, memasang, memperbarui, memeriksa, dan menghapus instalasi plugin OpenClaw
title: Kelola Plugin
x-i18n:
    generated_at: "2026-06-27T17:48:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dd0c1143c6312603311931cbbdc63069a44bc5ec487e2a46b0266b86a556da4e
    source_path: plugins/manage-plugins.md
    workflow: 16
---

Gunakan halaman ini untuk perintah umum pengelolaan plugin. Untuk kontrak perintah,
flag, aturan pemilihan sumber, dan kasus tepi yang lengkap, lihat
[`openclaw plugins`](/id/cli/plugins).

Sebagian besar alur kerja pemasangan adalah:

1. menemukan paket
2. memasangnya dari ClawHub, npm, git, atau jalur lokal
3. membiarkan Gateway terkelola melakukan mulai ulang otomatis, atau memulainya ulang secara manual saat tidak terkelola
4. memverifikasi pendaftaran runtime plugin

## Daftar dan cari plugin

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search "calendar"
```

Gunakan `--json` untuk skrip:

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` adalah pemeriksaan inventaris dingin. Ini menampilkan apa yang dapat ditemukan OpenClaw
dari konfigurasi, manifes, dan registri plugin; ini tidak membuktikan bahwa
Gateway yang sudah berjalan telah mengimpor runtime plugin. Keluaran JSON menyertakan
diagnostik registri dan `dependencyStatus` statis setiap plugin saat
paket plugin mendeklarasikan `dependencies` atau `optionalDependencies`.

`plugins search` mengueri ClawHub untuk paket plugin yang dapat dipasang dan mencetak
petunjuk pemasangan seperti `openclaw plugins install clawhub:<package>`.

## Pasang plugin

```bash
# Search ClawHub for plugin packages.
openclaw plugins search "calendar"

# Install from ClawHub.
openclaw plugins install clawhub:<package>
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta

# Install from npm.
openclaw plugins install npm:<package>
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex

# Install from a local npm pack artifact.
openclaw plugins install npm-pack:<path.tgz>

# Install from git or a local development checkout.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

Spesifikasi paket tanpa awalan dipasang dari npm selama cutover peluncuran. Gunakan `clawhub:`,
`npm:`, `git:`, atau `npm-pack:` saat Anda membutuhkan pemilihan sumber yang deterministik.
Jika nama tanpa awalan cocok dengan id plugin resmi, OpenClaw dapat memasang
entri katalog secara langsung.

Gunakan `--force` hanya saat Anda sengaja ingin menimpa target pemasangan yang sudah ada.
Untuk peningkatan rutin pemasangan npm, ClawHub, atau hook-pack yang terlacak, gunakan
`openclaw plugins update`.

## Mulai ulang dan inspeksi

Setelah memasang, memperbarui, atau mencopot kode plugin, Gateway terkelola yang sedang berjalan
dengan pemuatan ulang konfigurasi aktif akan dimulai ulang secara otomatis. Jika Gateway tidak
terkelola atau pemuatan ulang dinonaktifkan, mulai ulang sendiri sebelum memeriksa permukaan runtime
langsung:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

Gunakan `inspect --runtime` saat Anda membutuhkan bukti bahwa plugin telah mendaftarkan permukaan
runtime seperti alat, hook, layanan, metode Gateway, rute HTTP, atau
perintah CLI milik plugin. `inspect` dan `list` biasa adalah pemeriksaan dingin untuk manifes,
konfigurasi, dan registri.

## Perbarui plugin

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
openclaw plugins update <plugin-id> --dry-run
```

Saat Anda meneruskan id plugin, OpenClaw menggunakan kembali spesifikasi pemasangan yang terlacak. Dist-tag
tersimpan seperti `@beta` dan versi persis yang dipin akan terus digunakan pada
eksekusi `update <plugin-id>` berikutnya.

`openclaw plugins update --all` adalah jalur pemeliharaan massal. Ini tetap menghormati
spesifikasi pemasangan terlacak biasa, tetapi catatan plugin resmi OpenClaw tepercaya dapat
disinkronkan ke target katalog resmi saat ini, alih-alih tetap pada paket resmi persis
yang sudah usang. Jika `update.channel` diatur ke `beta`, sinkronisasi resmi massal itu
menggunakan konteks kanal beta. Gunakan `update <plugin-id>` yang ditargetkan saat Anda
sengaja ingin mempertahankan spesifikasi resmi persis atau bertag agar tidak tersentuh.

Untuk pemasangan npm, Anda dapat meneruskan spesifikasi paket eksplisit untuk mengganti catatan
terlacak:

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

Perintah kedua memindahkan plugin kembali ke lini rilis default registri
saat sebelumnya dipin ke versi persis atau tag.

Saat `openclaw update` berjalan di kanal beta, catatan plugin dapat lebih memilih
rilis `@beta` yang cocok. Untuk fallback persis dan aturan pinning, lihat
[`openclaw plugins`](/id/cli/plugins#update).

## Copot plugin

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
```

Pencopotan menghapus entri konfigurasi plugin, catatan indeks plugin yang dipersistenkan,
entri daftar izinkan/tolak, dan jalur muat tertaut jika berlaku. Direktori pemasangan
terkelola dihapus kecuali Anda meneruskan `--keep-files`. Gateway terkelola yang sedang berjalan
dimulai ulang secara otomatis saat pencopotan mengubah sumber plugin.

Dalam mode Nix (`OPENCLAW_NIX_MODE=1`), perintah pasang, perbarui, copot, aktifkan,
dan nonaktifkan plugin dinonaktifkan. Kelola pilihan tersebut di sumber Nix untuk
pemasangan sebagai gantinya.

## Pilih sumber

| Sumber      | Gunakan saat                                                                    | Contoh                                                        |
| ----------- | --------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ClawHub     | Anda menginginkan penemuan asli OpenClaw, ringkasan pemindaian, versi, dan petunjuk     | `openclaw plugins install clawhub:<package>`                   |
| npmjs.com   | Anda sudah mengirim paket JavaScript atau membutuhkan dist-tag npm/registri privat | `openclaw plugins install npm:@acme/openclaw-plugin`           |
| git         | Anda menginginkan branch, tag, atau commit dari repositori                         | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| jalur lokal  | Anda sedang mengembangkan atau menguji plugin di mesin yang sama                  | `openclaw plugins install --link ./my-plugin`                  |
| npm pack    | Anda sedang membuktikan artefak paket lokal melalui semantik pemasangan npm      | `openclaw plugins install npm-pack:<path.tgz>`                 |
| marketplace | Anda sedang memasang plugin marketplace yang kompatibel dengan Claude                   | `openclaw plugins install <plugin> --marketplace <source>`     |

Pemasangan jalur lokal terkelola harus berupa direktori atau arsip plugin. Masukkan
file plugin mandiri di `plugins.load.paths`, bukan memasangnya dengan
`plugins install`.

## Publikasikan plugin

ClawHub adalah permukaan penemuan publik utama untuk plugin OpenClaw. Publikasikan
di sana saat Anda ingin pengguna menemukan metadata plugin, riwayat versi, hasil
pemindaian registri, dan petunjuk pemasangan sebelum mereka memasang.

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

Plugin npm native harus menyertakan manifes plugin dan metadata paket sebelum
dipublikasikan:

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
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

Gunakan halaman ini untuk kontrak publikasi lengkap, alih-alih memperlakukan halaman ini
sebagai referensi publikasi:

- [Publikasi ClawHub](/id/clawhub/publishing) menjelaskan pemilik, cakupan, rilis,
  peninjauan, validasi paket, dan transfer paket.
- [Membangun plugin](/id/plugins/building-plugins) menunjukkan bentuk paket plugin
  dan alur kerja publikasi pertama.
- [Manifes plugin](/id/plugins/manifest) mendefinisikan field manifes plugin native.

Jika paket yang sama tersedia di ClawHub dan npm, gunakan awalan eksplisit
`clawhub:` atau `npm:` saat Anda perlu memaksa satu sumber.

## Terkait

- [Plugin](/id/tools/plugin) - pasang, konfigurasi, mulai ulang, dan pecahkan masalah
- [`openclaw plugins`](/id/cli/plugins) - referensi CLI lengkap
- [Plugin komunitas](/id/plugins/community) - penemuan publik dan publikasi ClawHub
- [ClawHub](/id/clawhub/cli) - operasi CLI registri
- [Membangun plugin](/id/plugins/building-plugins) - buat paket plugin
- [Manifes plugin](/id/plugins/manifest) - manifes dan metadata paket
