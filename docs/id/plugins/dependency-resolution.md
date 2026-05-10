---
read_when:
    - Anda sedang memecahkan masalah instalasi paket Plugin
    - Anda mengubah perilaku startup Plugin, doctor, atau instalasi manajer paket
    - Anda mengelola instalasi OpenClaw terpaket atau manifes Plugin yang dibundel
sidebarTitle: Dependencies
summary: Bagaimana OpenClaw menginstal paket plugin dan menyelesaikan dependensi plugin
title: Resolusi dependensi Plugin
x-i18n:
    generated_at: "2026-05-10T19:43:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: eb9637f46f273de976ff9203d23558d8bb51922b347871bc71917ef61d3c04a3
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw menjaga pekerjaan dependensi Plugin pada waktu instalasi/pembaruan. Pemuatan runtime
tidak menjalankan pengelola paket, memperbaiki pohon dependensi, atau mengubah direktori
paket OpenClaw.

## Pembagian tanggung jawab

Paket Plugin memiliki grafik dependensinya sendiri:

- dependensi runtime berada di `dependencies` atau
  `optionalDependencies` paket Plugin
- impor SDK/core adalah impor peer atau impor yang disediakan OpenClaw
- Plugin pengembangan lokal membawa dependensinya sendiri yang sudah terinstal
- Plugin npm dan git diinstal ke root paket milik OpenClaw

OpenClaw hanya memiliki siklus hidup Plugin:

- menemukan sumber Plugin
- menginstal atau memperbarui paket saat diminta secara eksplisit
- mencatat metadata instalasi
- memuat titik masuk Plugin
- gagal dengan galat yang dapat ditindaklanjuti saat dependensi hilang

## Root instalasi

OpenClaw menggunakan root per sumber yang stabil:

- paket npm diinstal di bawah `~/.openclaw/npm`
- paket git dikloning di bawah `~/.openclaw/git`
- instalasi lokal/path/arsip disalin atau dirujuk tanpa perbaikan dependensi

Instalasi npm berjalan di root npm dengan:

```bash
cd ~/.openclaw/npm
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` menggunakan root npm terkelola yang sama
untuk tarball npm-pack lokal. OpenClaw membaca metadata npm tarball, menambahkannya
ke root terkelola sebagai dependensi `file:` yang disalin, menjalankan instalasi npm normal,
lalu memverifikasi metadata lockfile yang terinstal sebelum memercayai Plugin.
Ini dimaksudkan untuk bukti penerimaan paket dan kandidat rilis ketika artefak
pack lokal harus berperilaku seperti artefak registry yang disimulasikannya.

npm dapat mengangkat dependensi transitif ke `~/.openclaw/npm/node_modules` di samping
paket Plugin. OpenClaw memindai root npm terkelola sebelum memercayai
instalasi dan menggunakan npm untuk menghapus paket yang dikelola npm selama penghapusan instalasi, sehingga dependensi
runtime yang diangkat tetap berada di dalam batas pembersihan terkelola.

Plugin yang mengimpor `openclaw/plugin-sdk/*` mendeklarasikan `openclaw` sebagai dependensi peer.
OpenClaw tidak mengizinkan npm menginstal salinan registry terpisah dari
paket host ke root terkelola, karena paket host yang usang dapat memengaruhi
resolusi peer npm selama instalasi Plugin berikutnya. Instalasi npm terkelola melewati
resolusi/materialisasi peer npm untuk root bersama dan OpenClaw menegaskan kembali
tautan `node_modules/openclaw` lokal Plugin untuk paket terinstal yang mendeklarasikan
peer host setelah instalasi, pembaruan, atau penghapusan instalasi.

Instalasi git mengkloning atau menyegarkan repositori, lalu menjalankan:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Plugin yang terinstal kemudian dimuat dari direktori paket tersebut, sehingga resolusi
`node_modules` lokal paket dan induk bekerja dengan cara yang sama seperti paket
Node normal.

## Plugin lokal

Plugin lokal diperlakukan sebagai direktori yang dikendalikan pengembang. OpenClaw tidak
menjalankan `npm install`, `pnpm install`, atau perbaikan dependensi untuknya. Jika Plugin
lokal memiliki dependensi, instal dependensi tersebut di Plugin itu sebelum memuatnya.

Plugin lokal TypeScript pihak ketiga dapat menggunakan jalur darurat Jiti. Plugin
JavaScript berpakej dan Plugin internal bawaan dimuat melalui
import/require native, bukan Jiti.

## Startup dan pemuatan ulang

Startup Gateway dan pemuatan ulang konfigurasi tidak pernah menginstal dependensi Plugin. Keduanya membaca
catatan instalasi Plugin, menghitung titik masuk, dan memuatnya.

Jika dependensi hilang saat runtime, Plugin gagal dimuat dan galat
harus mengarahkan operator ke perbaikan eksplisit:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` dapat membersihkan status dependensi lama yang dibuat OpenClaw dan memulihkan
Plugin yang dapat diunduh yang hilang dari catatan instalasi lokal saat konfigurasi
merujuknya. Doctor tidak memperbaiki dependensi untuk Plugin lokal yang sudah terinstal.

## Plugin bawaan

Plugin bawaan yang ringan dan penting untuk core dikirim sebagai bagian dari OpenClaw.
Plugin tersebut sebaiknya tidak memiliki pohon dependensi runtime yang berat atau dipindahkan
ke paket yang dapat diunduh di ClawHub/npm.

Untuk daftar terbuat saat ini dari Plugin yang dikirim dalam paket core, diinstal
secara eksternal, atau tetap hanya sumber, lihat [Inventaris Plugin](/id/plugins/plugin-inventory).

Manifes Plugin bawaan tidak boleh meminta staging dependensi. Fungsionalitas
Plugin yang besar atau opsional sebaiknya dikemas sebagai Plugin normal dan diinstal melalui
jalur npm/git/ClawHub yang sama seperti Plugin pihak ketiga.

Dalam checkout sumber, OpenClaw memperlakukan repositori sebagai monorepo pnpm. Setelah
`pnpm install`, Plugin bawaan dimuat dari `extensions/<id>` sehingga dependensi workspace
lokal paket tersedia dan perubahan langsung diterapkan. Pengembangan
checkout sumber hanya pnpm; `npm install` biasa di root repositori bukan
cara yang didukung untuk menyiapkan dependensi Plugin bawaan.

| Bentuk instalasi                 | Lokasi Plugin bawaan                 | Pemilik dependensi                                                   |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Pohon runtime terbangun di dalam paket | Paket OpenClaw dan alur instalasi/pembaruan/doctor Plugin eksplisit  |
| Checkout Git plus `pnpm install` | Paket workspace `extensions/<id>`     | Workspace pnpm, termasuk dependensi milik tiap paket Plugin          |
| `openclaw plugins install ...`   | Root Plugin npm/git/ClawHub terkelola | Alur instalasi/pembaruan Plugin                                      |

## Pembersihan legacy

Versi OpenClaw yang lebih lama membuat root dependensi Plugin bawaan saat startup atau
selama perbaikan doctor. Pembersihan doctor saat ini menghapus direktori dan
symlink usang tersebut saat `--fix` digunakan, termasuk root `plugin-runtime-deps` lama, symlink
paket prefix Node global yang menunjuk ke target `plugin-runtime-deps` yang telah dipangkas,
manifes `.openclaw-runtime-deps*`, `node_modules` Plugin yang dibuat, direktori
tahap instalasi, dan store pnpm lokal paket. Postinstall berpakej juga
menghapus symlink global tersebut sebelum memangkas root target legacy sehingga pemutakhiran
tidak meninggalkan impor paket ESM yang menggantung.

Path ini hanya sisa legacy. Instalasi baru tidak boleh membuatnya.
