---
read_when:
    - Anda sedang memecahkan masalah instalasi paket Plugin
    - Anda sedang mengubah perilaku startup Plugin, doctor, atau instalasi pengelola paket
    - Anda memelihara instalasi OpenClaw terpaket atau manifest Plugin bawaan
sidebarTitle: Dependencies
summary: Cara OpenClaw menginstal paket Plugin dan menyelesaikan dependensi Plugin
title: Resolusi dependensi Plugin
x-i18n:
    generated_at: "2026-05-05T01:48:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1a832f705e51bba8ac77e2a8715a7213fd2caf10bfa42059d53db4a6d5ad8c20
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# Resolusi dependensi Plugin

OpenClaw menjalankan pekerjaan dependensi Plugin pada waktu instalasi/pembaruan. Pemuatan runtime
tidak menjalankan pengelola paket, memperbaiki pohon dependensi, atau memutasi direktori paket
OpenClaw.

## Pembagian tanggung jawab

Paket Plugin memiliki grafik dependensinya sendiri:

- dependensi runtime berada di `dependencies` atau `optionalDependencies` paket Plugin
- import SDK/core adalah peer atau import OpenClaw yang disediakan
- Plugin pengembangan lokal membawa dependensinya sendiri yang sudah terpasang
- Plugin npm dan git dipasang ke root paket milik OpenClaw

OpenClaw hanya memiliki siklus hidup Plugin:

- menemukan sumber Plugin
- memasang atau memperbarui paket saat diminta secara eksplisit
- mencatat metadata instalasi
- memuat entrypoint Plugin
- gagal dengan galat yang dapat ditindaklanjuti saat dependensi hilang

## Root instalasi

OpenClaw menggunakan root stabil per sumber:

- paket npm dipasang di bawah `~/.openclaw/npm`
- paket git dikloning di bawah `~/.openclaw/git`
- instalasi lokal/path/archive disalin atau direferensikan tanpa perbaikan dependensi

Instalasi npm berjalan di root npm dengan:

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

npm dapat meng-hoist dependensi transitif ke `~/.openclaw/npm/node_modules` di samping
paket Plugin. OpenClaw memindai root npm terkelola sebelum memercayai
instalasi dan menggunakan npm untuk menghapus paket yang dikelola npm saat uninstall, sehingga dependensi
runtime yang di-hoist tetap berada di dalam batas pembersihan terkelola.

Instalasi git mengkloning atau menyegarkan repositori, lalu menjalankan:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Plugin yang terpasang kemudian dimuat dari direktori paket tersebut, sehingga resolusi
`node_modules` lokal paket dan induk bekerja dengan cara yang sama seperti pada paket
Node biasa.

## Plugin lokal

Plugin lokal diperlakukan sebagai direktori yang dikendalikan developer. OpenClaw tidak
menjalankan `npm install`, `pnpm install`, atau perbaikan dependensi untuknya. Jika Plugin
lokal memiliki dependensi, pasang dependensi tersebut di Plugin itu sebelum memuatnya.

Plugin lokal TypeScript pihak ketiga dapat menggunakan jalur darurat Jiti. Plugin
JavaScript terpaket dan Plugin internal bawaan dimuat melalui
import/require native, bukan Jiti.

## Startup dan muat ulang

Startup Gateway dan muat ulang konfigurasi tidak pernah memasang dependensi Plugin. Keduanya membaca
catatan instalasi Plugin, menghitung entrypoint, dan memuatnya.

Jika dependensi hilang saat runtime, Plugin gagal dimuat dan galatnya
harus mengarahkan operator ke perbaikan eksplisit:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` dapat membersihkan status dependensi lama yang dibuat OpenClaw dan memulihkan
Plugin yang dapat diunduh yang hilang dari catatan instalasi lokal saat konfigurasi
mereferensikannya. Doctor tidak memperbaiki dependensi untuk Plugin lokal
yang sudah terpasang.

## Plugin bawaan

Plugin bawaan yang ringan dan kritis untuk core dikirim sebagai bagian dari OpenClaw.
Plugin tersebut sebaiknya tidak memiliki pohon dependensi runtime yang berat atau dipindahkan ke
paket yang dapat diunduh di ClawHub/npm.

Untuk daftar terbuat saat ini tentang Plugin yang dikirim dalam paket core, dipasang
secara eksternal, atau tetap hanya sebagai sumber, lihat [Inventaris Plugin](/id/plugins/plugin-inventory).

Manifes Plugin bawaan tidak boleh meminta staging dependensi. Fungsionalitas
Plugin yang besar atau opsional sebaiknya dikemas sebagai Plugin normal dan dipasang melalui
jalur npm/git/ClawHub yang sama seperti Plugin pihak ketiga.

Dalam checkout sumber, OpenClaw memperlakukan repositori sebagai monorepo pnpm. Setelah
`pnpm install`, Plugin bawaan dimuat dari `extensions/<id>` sehingga dependensi
workspace lokal paket tersedia dan perubahan langsung ikut terbaca. Pengembangan
checkout sumber hanya mendukung pnpm; `npm install` biasa di root repositori
bukan cara yang didukung untuk menyiapkan dependensi Plugin bawaan.

| Bentuk instalasi                 | Lokasi Plugin bawaan                 | Pemilik dependensi                                                   |
| -------------------------------- | ------------------------------------ | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Pohon runtime terbangun di dalam paket | Paket OpenClaw dan alur instalasi/pembaruan/doctor Plugin eksplisit  |
| Checkout Git plus `pnpm install` | Paket workspace `extensions/<id>`    | Workspace pnpm, termasuk dependensi masing-masing paket Plugin       |
| `openclaw plugins install ...`   | Root Plugin npm/git/ClawHub terkelola | Alur instalasi/pembaruan Plugin                                      |

## Pembersihan lama

Versi OpenClaw lama membuat root dependensi Plugin bawaan saat startup atau
selama perbaikan doctor. Pembersihan doctor saat ini menghapus direktori dan
symlink usang tersebut saat `--fix` digunakan, termasuk root `plugin-runtime-deps` lama, symlink
paket prefix Node global yang menunjuk ke target `plugin-runtime-deps` yang telah dipangkas,
manifes `.openclaw-runtime-deps*`, `node_modules` Plugin yang dihasilkan, direktori
stage instalasi, dan store pnpm lokal paket. Postinstall terpaket juga
menghapus symlink global tersebut sebelum memangkas root target lama agar upgrade
tidak meninggalkan import paket ESM yang menggantung.

Path ini hanya sisa lama. Instalasi baru tidak boleh membuatnya.
