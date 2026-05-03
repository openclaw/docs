---
read_when:
    - Anda sedang melakukan debug instalasi paket Plugin
    - Anda mengubah perilaku inisialisasi Plugin, doctor, atau pemasangan pengelola paket
    - Anda memelihara instalasi OpenClaw terpaket atau manifest Plugin yang dibundel
sidebarTitle: Dependencies
summary: Cara OpenClaw menginstal paket Plugin dan menyelesaikan dependensi Plugin
title: Resolusi dependensi Plugin
x-i18n:
    generated_at: "2026-05-03T21:35:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 46af62ff866d50cb53bb2761d9928f0fd2a25bdb945040885ec6bfb85be35c6d
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# Resolusi dependensi Plugin

OpenClaw menangani pekerjaan dependensi Plugin pada waktu instalasi/pembaruan. Pemuatan waktu jalan
tidak menjalankan manajer paket, memperbaiki pohon dependensi, atau mengubah direktori paket
OpenClaw.

## Pembagian tanggung jawab

Paket Plugin memiliki grafik dependensinya sendiri:

- dependensi waktu jalan berada di `dependencies` atau `optionalDependencies`
  paket Plugin
- impor SDK/core adalah impor peer atau impor yang disediakan OpenClaw
- Plugin pengembangan lokal membawa dependensi yang sudah terinstal sendiri
- Plugin npm dan git diinstal ke root paket milik OpenClaw

OpenClaw hanya memiliki siklus hidup Plugin:

- menemukan sumber Plugin
- menginstal atau memperbarui paket saat diminta secara eksplisit
- mencatat metadata instalasi
- memuat titik masuk Plugin
- gagal dengan kesalahan yang dapat ditindaklanjuti saat dependensi hilang

## Root instalasi

OpenClaw menggunakan root stabil per sumber:

- paket npm diinstal di bawah `~/.openclaw/npm`
- paket git dikloning di bawah `~/.openclaw/git`
- instalasi lokal/path/arsip disalin atau direferensikan tanpa perbaikan dependensi

Instalasi npm dijalankan di root npm dengan:

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

npm dapat mengangkat dependensi transitif ke `~/.openclaw/npm/node_modules` di samping
paket Plugin. OpenClaw memindai root npm terkelola sebelum memercayai
instalasi dan menggunakan npm untuk menghapus paket yang dikelola npm saat penghapusan instalasi, sehingga dependensi
waktu jalan yang diangkat tetap berada di dalam batas pembersihan terkelola.

Instalasi git mengkloning atau menyegarkan repositori, lalu menjalankan:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Plugin yang terinstal lalu dimuat dari direktori paket tersebut, sehingga resolusi
`node_modules` lokal paket dan induk bekerja dengan cara yang sama seperti pada paket
Node normal.

## Plugin lokal

Plugin lokal diperlakukan sebagai direktori yang dikendalikan pengembang. OpenClaw tidak
menjalankan `npm install`, `pnpm install`, atau perbaikan dependensi untuknya. Jika Plugin
lokal memiliki dependensi, instal dependensi tersebut di Plugin itu sebelum memuatnya.

Plugin lokal TypeScript pihak ketiga dapat menggunakan jalur darurat Jiti. Plugin
JavaScript terpaket dan Plugin internal bawaan dimuat melalui
import/require native, bukan Jiti.

## Startup dan pemuatan ulang

Startup Gateway dan pemuatan ulang konfigurasi tidak pernah menginstal dependensi Plugin. Keduanya membaca
catatan instalasi Plugin, menghitung titik masuk, dan memuatnya.

Jika dependensi hilang pada waktu jalan, Plugin gagal dimuat dan kesalahan
harus mengarahkan operator ke perbaikan eksplisit:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` dapat membersihkan status dependensi lama yang dibuat OpenClaw dan menginstal
Plugin unduhan terkonfigurasi yang hilang dari catatan instalasi lokal.
Perintah ini tidak memperbaiki dependensi untuk Plugin lokal yang sudah terinstal.

## Plugin bawaan

Plugin bawaan yang ringan dan penting bagi core dikirim sebagai bagian dari OpenClaw.
Plugin tersebut sebaiknya tidak memiliki pohon dependensi waktu jalan yang berat atau dipindahkan ke
paket unduhan di ClawHub/npm.

Untuk daftar terbuat saat ini berisi Plugin yang dikirim dalam paket core, diinstal
secara eksternal, atau tetap hanya sebagai sumber, lihat [Inventaris Plugin](/id/plugins/plugin-inventory).

Manifes Plugin bawaan tidak boleh meminta staging dependensi. Fungsionalitas Plugin
besar atau opsional sebaiknya dikemas sebagai Plugin normal dan diinstal melalui
jalur npm/git/ClawHub yang sama seperti Plugin pihak ketiga.

Dalam checkout sumber, OpenClaw memperlakukan repositori sebagai monorepo pnpm. Setelah
`pnpm install`, Plugin bawaan dimuat dari `extensions/<id>` sehingga dependensi workspace
lokal paket tersedia dan perubahan langsung diambil. Pengembangan checkout
sumber hanya mendukung pnpm; `npm install` biasa di root repositori bukan
cara yang didukung untuk menyiapkan dependensi Plugin bawaan.

| Bentuk instalasi                 | Lokasi Plugin bawaan                  | Pemilik dependensi                                                    |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Pohon waktu jalan bawaan di dalam paket | Paket OpenClaw dan alur instalasi/pembaruan/doctor Plugin eksplisit  |
| Checkout Git plus `pnpm install` | Paket workspace `extensions/<id>`     | Workspace pnpm, termasuk dependensi milik tiap paket Plugin          |
| `openclaw plugins install ...`   | Root Plugin npm/git/ClawHub terkelola | Alur instalasi/pembaruan Plugin                                      |

## Pembersihan lama

Versi OpenClaw lama membuat root dependensi Plugin bawaan saat startup atau
selama perbaikan doctor. Pembersihan doctor saat ini menghapus direktori dan
symlink usang tersebut saat `--fix` digunakan, termasuk root `plugin-runtime-deps` lama, symlink
paket prefix Node global yang menunjuk ke target `plugin-runtime-deps` yang telah dipangkas,
manifes `.openclaw-runtime-deps*`, `node_modules` Plugin yang dibuat, direktori stage
instalasi, dan store pnpm lokal paket. Postinstall terpaket juga
menghapus symlink global tersebut sebelum memangkas root target lama agar peningkatan versi
tidak meninggalkan impor paket ESM yang menggantung.

Jalur ini hanyalah sisa lama. Instalasi baru tidak boleh membuatnya.
