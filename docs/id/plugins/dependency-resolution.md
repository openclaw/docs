---
read_when:
    - Anda sedang men-debug instalasi paket Plugin
    - Anda mengubah perilaku startup Plugin, doctor, atau instalasi manajer paket
    - Anda memelihara instalasi OpenClaw terpaket atau manifes Plugin yang dibundel
sidebarTitle: Dependencies
summary: Cara OpenClaw menginstal paket Plugin dan menyelesaikan dependensi Plugin
title: Resolusi dependensi Plugin
x-i18n:
    generated_at: "2026-05-06T09:21:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: e06f1fdc34c8392cbf0e399484fd59af11b9b7d73c5c7e68b3617a7cfd433a36
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# Resolusi dependensi Plugin

OpenClaw menjaga pekerjaan dependensi plugin pada waktu instalasi/pembaruan. Pemuatan runtime
tidak menjalankan manajer paket, memperbaiki pohon dependensi, atau mengubah direktori paket
OpenClaw.

## Pembagian tanggung jawab

Paket plugin memiliki grafik dependensinya sendiri:

- dependensi runtime berada di `dependencies` atau `optionalDependencies` paket plugin
- impor SDK/core adalah peer atau impor OpenClaw yang disediakan
- plugin pengembangan lokal membawa dependensinya sendiri yang sudah terinstal
- plugin npm dan git diinstal ke root paket yang dimiliki OpenClaw

OpenClaw hanya memiliki siklus hidup plugin:

- menemukan sumber plugin
- menginstal atau memperbarui paket saat diminta secara eksplisit
- mencatat metadata instalasi
- memuat entrypoint plugin
- gagal dengan galat yang dapat ditindaklanjuti saat dependensi hilang

## Root instalasi

OpenClaw menggunakan root per sumber yang stabil:

- paket npm diinstal di bawah `~/.openclaw/npm`
- paket git dikloning di bawah `~/.openclaw/git`
- instalasi local/path/archive disalin atau direferensikan tanpa perbaikan dependensi

Instalasi npm berjalan di root npm dengan:

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` menggunakan root npm terkelola yang sama
untuk tarball npm-pack lokal. OpenClaw membaca metadata npm tarball, menambahkannya
ke root terkelola sebagai dependensi `file:` yang disalin, menjalankan instalasi npm normal,
lalu memverifikasi metadata lockfile yang terinstal sebelum memercayai plugin.
Ini ditujukan untuk bukti package-acceptance dan release-candidate ketika artefak
pack lokal harus berperilaku seperti artefak registry yang disimulasikannya.

npm dapat mengangkat dependensi transitif ke `~/.openclaw/npm/node_modules` di samping
paket plugin. OpenClaw memindai root npm terkelola sebelum memercayai instalasi
dan menggunakan npm untuk menghapus paket yang dikelola npm saat uninstall, sehingga dependensi
runtime yang diangkat tetap berada di dalam batas pembersihan terkelola.

Plugin yang mengimpor `openclaw/plugin-sdk/*` mendeklarasikan `openclaw` sebagai dependensi
peer. OpenClaw tidak membiarkan npm menginstal salinan registry terpisah dari paket
host ke root terkelola, karena paket host yang kedaluwarsa dapat memengaruhi resolusi
peer npm selama instalasi plugin berikutnya. Sebaliknya, setelah npm selesai
mengubah root bersama selama install, update, atau uninstall, OpenClaw menegaskan kembali
tautan `node_modules/openclaw` lokal plugin untuk paket terinstal yang mendeklarasikan
peer host.

Instalasi git mengkloning atau menyegarkan repositori, lalu menjalankan:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Plugin yang terinstal kemudian dimuat dari direktori paket tersebut, sehingga resolusi
`node_modules` lokal paket dan induk bekerja dengan cara yang sama seperti paket
Node normal.

## Plugin lokal

Plugin lokal diperlakukan sebagai direktori yang dikendalikan pengembang. OpenClaw tidak
menjalankan `npm install`, `pnpm install`, atau perbaikan dependensi untuknya. Jika plugin
lokal memiliki dependensi, instal dependensi tersebut di plugin itu sebelum memuatnya.

Plugin lokal TypeScript pihak ketiga dapat menggunakan jalur darurat Jiti. Plugin
JavaScript terpaket dan plugin internal bawaan dimuat melalui
import/require native, bukan Jiti.

## Startup dan muat ulang

Startup Gateway dan muat ulang konfigurasi tidak pernah menginstal dependensi plugin. Keduanya membaca
catatan instalasi plugin, menghitung entrypoint, dan memuatnya.

Jika dependensi hilang saat runtime, plugin gagal dimuat dan galat
harus mengarahkan operator ke perbaikan eksplisit:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` dapat membersihkan status dependensi lama yang dihasilkan OpenClaw dan memulihkan
plugin yang dapat diunduh yang hilang dari catatan instalasi lokal saat konfigurasi
mereferensikannya. Doctor tidak memperbaiki dependensi untuk plugin lokal yang sudah terinstal.

## Plugin bawaan

Plugin bawaan yang ringan dan kritis untuk core dikirim sebagai bagian dari OpenClaw.
Plugin tersebut sebaiknya tidak memiliki pohon dependensi runtime yang berat atau dipindahkan
ke paket yang dapat diunduh di ClawHub/npm.

Untuk daftar terhasil saat ini dari plugin yang dikirim dalam paket core, diinstal
secara eksternal, atau tetap hanya sebagai sumber, lihat [Inventaris Plugin](/id/plugins/plugin-inventory).

Manifes plugin bawaan tidak boleh meminta staging dependensi. Fungsionalitas plugin
besar atau opsional sebaiknya dikemas sebagai plugin normal dan diinstal melalui
jalur npm/git/ClawHub yang sama seperti plugin pihak ketiga.

Dalam checkout sumber, OpenClaw memperlakukan repositori sebagai monorepo pnpm. Setelah
`pnpm install`, plugin bawaan dimuat dari `extensions/<id>` sehingga dependensi
workspace lokal paket tersedia dan perubahan langsung terambil. Pengembangan checkout
sumber hanya mendukung pnpm; `npm install` biasa di root repositori bukan cara yang
didukung untuk menyiapkan dependensi plugin bawaan.

| Bentuk instalasi                 | Lokasi plugin bawaan                  | Pemilik dependensi                                                   |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Pohon runtime bawaan di dalam paket   | Paket OpenClaw dan alur install/update/doctor plugin eksplisit       |
| Checkout Git plus `pnpm install` | Paket workspace `extensions/<id>`     | Workspace pnpm, termasuk dependensi milik masing-masing paket plugin |
| `openclaw plugins install ...`   | Root plugin npm/git/ClawHub terkelola | Alur install/update plugin                                           |

## Pembersihan lama

Versi OpenClaw yang lebih lama menghasilkan root dependensi plugin bawaan saat startup atau
selama perbaikan doctor. Pembersihan doctor saat ini menghapus direktori dan symlink usang tersebut
saat `--fix` digunakan, termasuk root `plugin-runtime-deps` lama, symlink paket
Node-prefix global yang mengarah ke target `plugin-runtime-deps` yang dipangkas,
manifes `.openclaw-runtime-deps*`, `node_modules` plugin yang dihasilkan, direktori
stage instalasi, dan store pnpm lokal paket. Postinstall terpaket juga
menghapus symlink global tersebut sebelum memangkas root target lama sehingga peningkatan versi
tidak meninggalkan impor paket ESM yang menggantung.

Jalur-jalur ini hanyalah sisa lama. Instalasi baru tidak boleh membuatnya.
