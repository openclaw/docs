---
read_when:
    - Anda sedang men-debug instalasi paket Plugin
    - Anda sedang mengubah perilaku inisialisasi plugin, doctor, atau instalasi pengelola paket
    - Anda memelihara instalasi OpenClaw yang dipaketkan atau manifes Plugin terbundel
sidebarTitle: Dependencies
summary: Cara OpenClaw menginstal paket Plugin dan menyelesaikan dependensi Plugin
title: Resolusi dependensi Plugin
x-i18n:
    generated_at: "2026-05-02T20:47:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9476529ad1d44ed1b17caca628c58acfbb1d8c73393f58fa7d3d76944a71aea
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# Resolusi dependensi Plugin

OpenClaw mempertahankan pekerjaan dependensi Plugin pada waktu pemasangan/pembaruan. Pemuatan runtime
tidak menjalankan manajer paket, memperbaiki pohon dependensi, atau memutasi direktori
paket OpenClaw.

## Pembagian tanggung jawab

Paket Plugin memiliki grafik dependensinya sendiri:

- dependensi runtime berada di `dependencies` atau `optionalDependencies`
  paket Plugin
- impor SDK/core adalah peer atau impor yang disediakan OpenClaw
- Plugin pengembangan lokal membawa dependensi mereka sendiri yang sudah terpasang
- Plugin npm dan git dipasang ke dalam root paket milik OpenClaw

OpenClaw hanya memiliki siklus hidup Plugin:

- menemukan sumber Plugin
- memasang atau memperbarui paket saat diminta secara eksplisit
- mencatat metadata pemasangan
- memuat entrypoint Plugin
- gagal dengan error yang dapat ditindaklanjuti saat dependensi hilang

## Root pemasangan

OpenClaw menggunakan root per sumber yang stabil:

- paket npm dipasang di bawah `~/.openclaw/npm`
- paket git dikloning di bawah `~/.openclaw/git`
- pemasangan lokal/path/archive disalin atau direferensikan tanpa perbaikan dependensi

Pemasangan npm berjalan di root npm dengan:

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

npm dapat mengangkat dependensi transitif ke `~/.openclaw/npm/node_modules` di samping
paket Plugin. OpenClaw memindai root npm terkelola sebelum memercayai
pemasangan dan menggunakan npm untuk menghapus paket yang dikelola npm selama pencopotan, sehingga dependensi
runtime yang diangkat tetap berada di dalam batas pembersihan terkelola.

Pemasangan git mengkloning atau menyegarkan repositori, lalu menjalankan:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Plugin yang terpasang kemudian dimuat dari direktori paket tersebut, sehingga resolusi
`node_modules` lokal paket dan induk bekerja dengan cara yang sama seperti pada paket
Node normal.

## Plugin lokal

Plugin lokal diperlakukan sebagai direktori yang dikontrol pengembang. OpenClaw tidak
menjalankan `npm install`, `pnpm install`, atau perbaikan dependensi untuknya. Jika Plugin
lokal memiliki dependensi, pasang dependensi tersebut di Plugin itu sebelum memuatnya.

Plugin lokal TypeScript pihak ketiga dapat menggunakan jalur darurat Jiti. Plugin
JavaScript terpaketkan dan Plugin internal bawaan dimuat melalui
import/require native, bukan Jiti.

## Startup dan muat ulang

Startup Gateway dan muat ulang konfigurasi tidak pernah memasang dependensi Plugin. Keduanya membaca
catatan pemasangan Plugin, menghitung entrypoint, dan memuatnya.

Jika dependensi hilang saat runtime, Plugin gagal dimuat dan error
harus mengarahkan operator ke perbaikan eksplisit:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` dapat membersihkan state dependensi lama yang dihasilkan OpenClaw dan memasang
Plugin unduhan terkonfigurasi yang hilang dari catatan pemasangan lokal.
Itu tidak memperbaiki dependensi untuk Plugin lokal yang sudah terpasang.

## Plugin bawaan

Plugin bawaan yang ringan dan kritis untuk core dikirim sebagai bagian dari OpenClaw.
Plugin tersebut sebaiknya tidak memiliki pohon dependensi runtime yang berat atau dipindahkan
ke paket unduhan di ClawHub/npm.

Untuk daftar yang dihasilkan saat ini tentang Plugin yang dikirim dalam paket core, dipasang
secara eksternal, atau tetap hanya sebagai sumber, lihat [Inventaris Plugin](/id/plugins/plugin-inventory).

Manifes Plugin bawaan tidak boleh meminta staging dependensi. Fungsionalitas
Plugin besar atau opsional sebaiknya dipaketkan sebagai Plugin normal dan dipasang melalui
jalur npm/git/ClawHub yang sama seperti Plugin pihak ketiga.

Dalam checkout sumber, OpenClaw memperlakukan repositori sebagai monorepo pnpm. Setelah
`pnpm install`, Plugin bawaan dimuat dari `extensions/<id>` sehingga dependensi
workspace lokal paket tersedia dan editan langsung terambil. Pengembangan
checkout sumber hanya mendukung pnpm; `npm install` biasa di root repositori
bukan cara yang didukung untuk menyiapkan dependensi Plugin bawaan.

| Bentuk pemasangan                | Lokasi Plugin bawaan                  | Pemilik dependensi                                                   |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Pohon runtime bawaan di dalam paket   | Paket OpenClaw dan alur pemasangan/pembaruan/doctor Plugin eksplisit |
| Checkout git plus `pnpm install` | Paket workspace `extensions/<id>`     | Workspace pnpm, termasuk dependensi milik tiap paket Plugin sendiri  |
| `openclaw plugins install ...`   | Root Plugin npm/git/ClawHub terkelola | Alur pemasangan/pembaruan Plugin                                     |

## Pembersihan lama

Versi OpenClaw lama menghasilkan root dependensi Plugin bawaan saat startup atau
selama perbaikan doctor. Pembersihan doctor saat ini menghapus direktori dan
symlink usang tersebut saat `--fix` digunakan, termasuk root `plugin-runtime-deps` lama,
manifes `.openclaw-runtime-deps*`, `node_modules` Plugin yang dihasilkan, direktori
stage pemasangan, dan store pnpm lokal paket.

Path ini hanyalah sisa lama. Pemasangan baru tidak boleh membuatnya.
