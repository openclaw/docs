---
read_when:
    - Anda sedang men-debug pemasangan paket plugin
    - Anda mengubah perilaku startup plugin, doctor, atau instalasi manajer paket
    - Anda memelihara instalasi OpenClaw terpaket atau manifes Plugin yang dibundel
sidebarTitle: Dependencies
summary: Bagaimana OpenClaw menginstal paket Plugin dan menyelesaikan dependensi Plugin
title: Resolusi dependensi Plugin
x-i18n:
    generated_at: "2026-06-27T17:47:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d5d2f3efe40c50433bd44961f6f5b8d03f3c69d3f5112163613b8efbd0f17c65
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw menjaga pekerjaan dependensi Plugin pada waktu instalasi/pembaruan. Pemuatan runtime
tidak menjalankan manajer paket, memperbaiki pohon dependensi, atau mengubah direktori
paket OpenClaw.

## Pembagian tanggung jawab

Paket Plugin memiliki grafik dependensinya sendiri:

- dependensi runtime berada di `dependencies` atau `optionalDependencies`
  paket Plugin
- impor SDK/core adalah peer atau impor yang disediakan OpenClaw
- Plugin pengembangan lokal membawa dependensinya sendiri yang sudah terinstal
- Plugin npm dan git diinstal ke root paket milik OpenClaw

OpenClaw hanya memiliki siklus hidup Plugin:

- menemukan sumber Plugin
- menginstal atau memperbarui paket saat diminta secara eksplisit
- mencatat metadata instalasi
- memuat entrypoint Plugin
- gagal dengan galat yang dapat ditindaklanjuti saat dependensi hilang

## Root instalasi

OpenClaw menggunakan root stabil per sumber:

- paket npm diinstal ke proyek per Plugin di bawah
  `~/.openclaw/npm/projects/<encoded-package>`
- paket git dikloning di bawah `~/.openclaw/git`
- instalasi lokal/path/arsip disalin atau direferensikan tanpa perbaikan dependensi

Instalasi npm berjalan di root proyek per Plugin tersebut dengan:

```bash
cd ~/.openclaw/npm/projects/<encoded-package>
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` menggunakan root proyek npm
per Plugin yang sama untuk tarball npm-pack lokal. OpenClaw membaca metadata npm
tarball tersebut, menambahkannya ke proyek terkelola sebagai dependensi `file:`
yang disalin, menjalankan instalasi npm normal, lalu memverifikasi metadata lockfile
yang terinstal sebelum memercayai Plugin.
Ini ditujukan untuk bukti penerimaan paket dan kandidat rilis ketika artefak pack
lokal harus berperilaku seperti artefak registry yang disimulasikannya.

npm dapat mengangkat dependensi transitif ke `node_modules` proyek per Plugin
di samping paket Plugin. OpenClaw memindai root proyek terkelola sebelum
memercayai instalasi dan menghapus proyek itu saat uninstall, sehingga dependensi
runtime yang diangkat tetap berada di dalam batas pembersihan Plugin tersebut.

Paket Plugin npm yang dipublikasikan dapat mengirimkan `npm-shrinkwrap.json`. npm
menggunakan lockfile yang dapat dipublikasikan itu saat instalasi, dan root proyek
npm terkelola OpenClaw mendukungnya melalui jalur instalasi npm normal. Paket
Plugin milik OpenClaw yang dapat dipublikasikan harus menyertakan shrinkwrap lokal
paket yang dibuat dari grafik dependensi terpublikasi paket Plugin tersebut:

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

Generator menghapus `devDependencies` Plugin, menerapkan kebijakan override workspace,
dan menulis `extensions/<id>/npm-shrinkwrap.json` untuk setiap Plugin
`publishToNpm`. Paket Plugin pihak ketiga juga dapat mengirimkan shrinkwrap;
OpenClaw tidak mewajibkannya untuk paket komunitas, tetapi npm akan menghormatinya
jika ada.

Paket Plugin npm milik OpenClaw juga dapat dipublikasikan dengan
`bundledDependencies` eksplisit. Jalur publish npm menimpa daftar nama dependensi
runtime, menghapus metadata workspace khusus dev dari manifest paket yang
dipublikasikan, menjalankan instalasi npm tanpa skrip untuk dependensi runtime
lokal paket, lalu mengemas atau memublikasikan tarball Plugin dengan menyertakan
berkas dependensi tersebut. Paket yang berat pada native, termasuk runtime Codex
dan ACP, memilih keluar dengan `openclaw.release.bundleRuntimeDependencies: false`;
paket-paket tersebut tetap mengirimkan shrinkwrap, tetapi npm menyelesaikan
dependensi runtime saat instalasi alih-alih menyematkan setiap biner platform
di tarball Plugin. Paket root `openclaw` tidak membundel seluruh pohon
dependensinya.

Plugin yang mengimpor `openclaw/plugin-sdk/*` mendeklarasikan `openclaw` sebagai
dependensi peer. OpenClaw tidak membiarkan npm menginstal salinan registry terpisah
dari paket host ke dalam proyek terkelola, karena paket host yang usang dapat
memengaruhi resolusi peer npm di dalam Plugin tersebut. Instalasi npm terkelola
melewati resolusi/materialisasi peer npm dan OpenClaw menegaskan ulang tautan
`node_modules/openclaw` lokal Plugin untuk paket terinstal yang mendeklarasikan
peer host setelah instalasi atau pembaruan.

Instalasi git mengkloning atau menyegarkan repositori, lalu menjalankan:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Plugin yang terinstal lalu dimuat dari direktori paket tersebut, sehingga resolusi
`node_modules` lokal paket dan induk bekerja dengan cara yang sama seperti pada
paket Node normal.

## Plugin lokal

Plugin lokal diperlakukan sebagai direktori yang dikendalikan pengembang. OpenClaw
tidak menjalankan `npm install`, `pnpm install`, atau perbaikan dependensi untuknya.
Jika Plugin lokal memiliki dependensi, instal dependensi tersebut di Plugin itu
sebelum memuatnya.

Plugin lokal TypeScript pihak ketiga dapat menggunakan jalur darurat Jiti. Plugin
JavaScript yang dipaketkan dan Plugin internal yang dibundel dimuat melalui
import/require native alih-alih Jiti.

## Startup dan muat ulang

Startup Gateway dan muat ulang konfigurasi tidak pernah menginstal dependensi Plugin.
Keduanya membaca catatan instalasi Plugin, menghitung entrypoint, dan memuatnya.

Jika dependensi hilang saat runtime, Plugin gagal dimuat dan galat harus
mengarahkan operator ke perbaikan eksplisit:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` dapat membersihkan status dependensi lama yang dibuat OpenClaw dan
memulihkan Plugin yang dapat diunduh yang hilang dari catatan instalasi lokal saat
konfigurasi merujuknya. Doctor tidak memperbaiki dependensi untuk Plugin lokal
yang sudah terinstal.

## Plugin yang dibundel

Plugin ringan dan kritis untuk core dikirim sebagai bagian dari OpenClaw.
Plugin tersebut sebaiknya tidak memiliki pohon dependensi runtime yang berat atau
dipindahkan ke paket yang dapat diunduh di ClawHub/npm.

Untuk daftar yang saat ini dibuat tentang Plugin yang dikirim dalam paket core,
diinstal secara eksternal, atau tetap hanya sebagai sumber, lihat [Inventaris Plugin](/id/plugins/plugin-inventory).

Manifest Plugin yang dibundel tidak boleh meminta staging dependensi. Fungsionalitas
Plugin yang besar atau opsional sebaiknya dipaketkan sebagai Plugin normal dan
diinstal melalui jalur npm/git/ClawHub yang sama seperti Plugin pihak ketiga.

Dalam checkout sumber, OpenClaw memperlakukan repositori sebagai monorepo pnpm.
Setelah `pnpm install`, Plugin yang dibundel dimuat dari `extensions/<id>` sehingga
dependensi workspace lokal paket tersedia dan perubahan diambil secara langsung.
Pengembangan checkout sumber hanya mendukung pnpm; `npm install` biasa di root
repositori bukan cara yang didukung untuk menyiapkan dependensi Plugin yang dibundel.

| Bentuk instalasi                 | Lokasi Plugin yang dibundel           | Pemilik dependensi                                                   |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Pohon runtime bawaan di dalam paket   | Paket OpenClaw dan alur instalasi/pembaruan/doctor Plugin eksplisit  |
| Checkout Git plus `pnpm install` | Paket workspace `extensions/<id>`     | Workspace pnpm, termasuk dependensi milik tiap paket Plugin          |
| `openclaw plugins install ...`   | Root proyek npm terkelola/git/ClawHub | Alur instalasi/pembaruan Plugin                                      |

## Pembersihan legacy

Versi OpenClaw yang lebih lama membuat root dependensi Plugin yang dibundel saat
startup atau selama perbaikan doctor. Pembersihan doctor saat ini menghapus
direktori dan symlink usang tersebut saat `--fix` digunakan, termasuk root
`plugin-runtime-deps` lama, symlink paket prefix Node global yang menunjuk ke
target `plugin-runtime-deps` yang dipangkas, manifest `.openclaw-runtime-deps*`,
`node_modules` Plugin yang dibuat, direktori tahap instalasi, dan store pnpm
lokal paket. Postinstall paket juga menghapus symlink global tersebut sebelum
memangkas root target legacy agar upgrade tidak meninggalkan impor paket ESM
yang menggantung.

Instalasi npm yang lebih lama juga menggunakan root bersama
`~/.openclaw/npm/node_modules`. Alur instalasi, pembaruan, uninstall, dan doctor
saat ini masih mengenali root datar legacy tersebut hanya untuk pemulihan dan
pembersihan. Instalasi npm baru sebaiknya membuat root proyek per Plugin sebagai
gantinya.
