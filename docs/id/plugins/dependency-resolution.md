---
read_when:
    - Anda sedang menelusuri kesalahan pada instalasi paket Plugin
    - Anda sedang mengubah perilaku startup Plugin, doctor, atau instalasi package-manager
    - Anda memelihara instalasi OpenClaw terpaket atau manifes Plugin yang dibundel
sidebarTitle: Dependencies
summary: Cara OpenClaw menginstal paket Plugin dan menyelesaikan dependensi Plugin
title: Resolusi dependensi Plugin
x-i18n:
    generated_at: "2026-05-06T17:58:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 15cdc75d92a675fd5474c49572639ab7510618e393fb7cf9f8b94506c859bee8
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw menjaga pekerjaan dependensi plugin tetap pada waktu instalasi/pembaruan. Pemuatan runtime
tidak menjalankan pengelola paket, memperbaiki pohon dependensi, atau mengubah direktori paket
OpenClaw.

## Pembagian tanggung jawab

Paket Plugin memiliki grafik dependensinya sendiri:

- dependensi runtime berada di `dependencies` atau
  `optionalDependencies` paket plugin
- impor SDK/core adalah peer atau impor OpenClaw yang disediakan
- plugin pengembangan lokal membawa dependensinya sendiri yang sudah terinstal
- plugin npm dan git diinstal ke root paket milik OpenClaw

OpenClaw hanya memiliki siklus hidup plugin:

- menemukan sumber plugin
- menginstal atau memperbarui paket ketika diminta secara eksplisit
- mencatat metadata instalasi
- memuat entrypoint plugin
- gagal dengan galat yang dapat ditindaklanjuti ketika dependensi hilang

## Root instalasi

OpenClaw menggunakan root stabil per sumber:

- paket npm diinstal di bawah `~/.openclaw/npm`
- paket git dikloning di bawah `~/.openclaw/git`
- instalasi lokal/path/archive disalin atau dirujuk tanpa perbaikan dependensi

Instalasi npm berjalan di root npm dengan:

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` menggunakan root npm terkelola yang sama
untuk tarball npm-pack lokal. OpenClaw membaca metadata npm tarball, menambahkannya
ke root terkelola sebagai dependensi `file:` yang disalin, menjalankan instalasi npm normal,
lalu memverifikasi metadata lockfile yang terinstal sebelum memercayai plugin.
Ini ditujukan untuk pembuktian package-acceptance dan release-candidate saat artefak pack
lokal harus berperilaku seperti artefak registry yang disimulasikannya.

npm dapat meng-hoist dependensi transitif ke `~/.openclaw/npm/node_modules` di samping
paket plugin. OpenClaw memindai root npm terkelola sebelum memercayai
instalasi dan menggunakan npm untuk menghapus paket yang dikelola npm selama uninstall, sehingga
dependensi runtime yang di-hoist tetap berada di dalam batas pembersihan terkelola.

Plugin yang mengimpor `openclaw/plugin-sdk/*` mendeklarasikan `openclaw` sebagai dependensi
peer. OpenClaw tidak membiarkan npm menginstal salinan registry terpisah dari paket
host ke root terkelola, karena paket host yang kedaluwarsa dapat memengaruhi resolusi peer
npm selama instalasi plugin berikutnya. Sebagai gantinya, setelah npm selesai
mengubah root bersama selama instalasi, pembaruan, atau uninstall, OpenClaw menegaskan kembali
tautan `node_modules/openclaw` lokal plugin untuk paket terinstal yang mendeklarasikan
peer host.

Instalasi git mengkloning atau menyegarkan repositori, lalu menjalankan:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Plugin yang terinstal lalu dimuat dari direktori paket tersebut, sehingga resolusi
`node_modules` lokal paket dan induk bekerja dengan cara yang sama seperti pada paket
Node normal.

## Plugin lokal

Plugin lokal diperlakukan sebagai direktori yang dikendalikan pengembang. OpenClaw tidak
menjalankan `npm install`, `pnpm install`, atau perbaikan dependensi untuknya. Jika plugin
lokal memiliki dependensi, instal dependensi tersebut di plugin itu sebelum memuatnya.

Plugin lokal TypeScript pihak ketiga dapat menggunakan jalur darurat Jiti. Plugin
JavaScript terpaket dan plugin internal bawaan dimuat melalui
import/require native, bukan Jiti.

## Startup dan pemuatan ulang

Startup Gateway dan pemuatan ulang konfigurasi tidak pernah menginstal dependensi plugin. Keduanya membaca
catatan instalasi plugin, menghitung entrypoint, dan memuatnya.

Jika dependensi hilang saat runtime, plugin gagal dimuat dan galatnya
harus mengarahkan operator ke perbaikan eksplisit:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` dapat membersihkan status dependensi lama yang dibuat OpenClaw dan memulihkan
plugin yang dapat diunduh yang hilang dari catatan instalasi lokal saat konfigurasi
merujuknya. Doctor tidak memperbaiki dependensi untuk plugin lokal yang sudah terinstal.

## Plugin bawaan

Plugin bawaan yang ringan dan penting untuk core dikirim sebagai bagian dari OpenClaw.
Plugin tersebut sebaiknya tidak memiliki pohon dependensi runtime yang berat atau dipindahkan
ke paket yang dapat diunduh di ClawHub/npm.

Untuk daftar Plugin yang dibuat saat ini yang dikirim dalam paket core, diinstal
secara eksternal, atau tetap source-only, lihat [Inventaris Plugin](/id/plugins/plugin-inventory).

Manifest plugin bawaan tidak boleh meminta staging dependensi. Fungsionalitas plugin
besar atau opsional harus dipaketkan sebagai plugin normal dan diinstal melalui
jalur npm/git/ClawHub yang sama seperti plugin pihak ketiga.

Dalam checkout sumber, OpenClaw memperlakukan repositori sebagai monorepo pnpm. Setelah
`pnpm install`, plugin bawaan dimuat dari `extensions/<id>` sehingga dependensi workspace
lokal paket tersedia dan edit langsung terambil. Pengembangan checkout sumber hanya pnpm;
`npm install` biasa di root repositori bukan cara yang didukung untuk menyiapkan
dependensi plugin bawaan.

| Bentuk instalasi                 | Lokasi plugin bawaan                  | Pemilik dependensi                                                   |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Pohon runtime bawaan di dalam paket   | Paket OpenClaw dan alur eksplisit install/update/doctor plugin       |
| Checkout Git plus `pnpm install` | Paket workspace `extensions/<id>`     | Workspace pnpm, termasuk dependensi milik tiap paket plugin          |
| `openclaw plugins install ...`   | Root plugin npm/git/ClawHub terkelola | Alur install/update plugin                                           |

## Pembersihan legacy

Versi OpenClaw yang lebih lama membuat root dependensi plugin bawaan saat startup atau
selama perbaikan doctor. Pembersihan doctor saat ini menghapus direktori dan
symlink usang tersebut saat `--fix` digunakan, termasuk root `plugin-runtime-deps` lama, symlink
paket global Node-prefix yang menunjuk ke target `plugin-runtime-deps` yang sudah dipangkas,
manifest `.openclaw-runtime-deps*`, `node_modules` plugin yang dibuat, direktori
stage instalasi, dan store pnpm lokal paket. Postinstall terpaket juga
menghapus symlink global tersebut sebelum memangkas root target legacy sehingga upgrade
tidak meninggalkan impor paket ESM yang menggantung.

Path ini hanyalah sisa legacy. Instalasi baru seharusnya tidak membuatnya.
