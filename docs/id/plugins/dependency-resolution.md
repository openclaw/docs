---
read_when:
    - Anda sedang men-debug instalasi paket plugin
    - Anda sedang mengubah perilaku startup Plugin, doctor, atau instalasi pengelola paket
    - Anda mengelola instalasi OpenClaw terpaket atau manifes plugin bawaan
sidebarTitle: Dependencies
summary: Cara OpenClaw menginstal paket plugin dan menyelesaikan dependensi plugin
title: Resolusi dependensi Plugin
x-i18n:
    generated_at: "2026-07-12T14:24:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ae24a82568e275399cb7b68729d2805956792852612f84d6918850305f0eb243
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw menangani dependensi plugin hanya pada saat instalasi/pembaruan. Pemuatan saat runtime tidak pernah menjalankan manajer paket, memperbaiki pohon dependensi, atau mengubah direktori paket OpenClaw.

## Pembagian tanggung jawab

Paket plugin memiliki grafik dependensinya sendiri:

- Dependensi runtime berada di `dependencies` atau `optionalDependencies` milik paket plugin.
- Impor SDK/inti adalah impor peer atau impor OpenClaw yang disediakan.
- Plugin pengembangan lokal membawa dependensinya sendiri yang sudah terinstal.
- Plugin npm dan git diinstal ke root paket milik OpenClaw.

OpenClaw hanya memiliki siklus hidup plugin:

- Menemukan sumber plugin.
- Menginstal atau memperbarui paket saat diminta secara eksplisit.
- Mencatat metadata instalasi.
- Memuat titik masuk plugin.
- Gagal dengan galat yang dapat ditindaklanjuti ketika dependensi tidak tersedia.

## Root instalasi

OpenClaw menggunakan root stabil untuk setiap sumber:

- Paket npm diinstal ke proyek per plugin di bawah `~/.openclaw/npm/projects/<encoded-package>`.
- Paket git dikloning di bawah `~/.openclaw/git`.
- Instalasi lokal/jalur/arsip disalin atau dirujuk tanpa perbaikan dependensi.

Instalasi npm dijalankan di root proyek per plugin tersebut dengan:

```bash
cd ~/.openclaw/npm/projects/<encoded-package>
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` menggunakan root proyek npm per plugin yang sama untuk tarball npm-pack lokal: OpenClaw membaca metadata npm tarball, menambahkannya ke proyek terkelola sebagai dependensi `file:` yang disalin, menjalankan instalasi npm normal di atas, lalu memverifikasi metadata lockfile yang terinstal sebelum memercayai plugin. Jalur ini tersedia untuk penerimaan paket dan pembuktian kandidat rilis, ketika artefak paket lokal harus berperilaku seperti artefak registri yang disimulasikannya.

Gunakan `npm-pack:` saat menguji paket plugin resmi atau eksternal sebelum dipublikasikan. Instalasi arsip mentah atau jalur berguna untuk penelusuran galat lokal, tetapi tidak membuktikan jalur dependensi yang sama dengan paket npm atau ClawHub yang terinstal. `npm-pack:` membuktikan bentuk instalasi paket terkelola; hal itu sendiri bukan bukti bahwa plugin merupakan konten resmi yang ditautkan ke katalog.

Ketika perilaku bergantung pada status plugin bawaan atau plugin resmi tepercaya, pasangkan bukti paket lokal dengan instalasi resmi berbasis katalog atau jalur paket yang dipublikasikan dan mencatat kepercayaan resmi. Akses pembantu berhak istimewa dan penanganan cakupan resmi tepercaya harus divalidasi pada jalur instalasi tepercaya tersebut, bukan disimpulkan dari instalasi tarball lokal.

Jika plugin gagal saat runtime karena impor yang tidak tersedia, perbaiki manifes paket alih-alih memperbaiki proyek terkelola secara manual. Impor runtime berada di `dependencies` atau `optionalDependencies` paket plugin; `devDependencies` tidak diinstal untuk proyek runtime terkelola. `npm install` lokal di dalam `~/.openclaw/npm/projects/<encoded-package>` dapat membantu diagnosis sementara, tetapi bukan bukti penerimaan paket karena instalasi atau pembaruan berikutnya membuat ulang proyek dari metadata paket.

npm dapat mengangkat dependensi transitif ke `node_modules` proyek per plugin di samping paket plugin. OpenClaw memindai root proyek terkelola sebelum memercayai instalasi dan menghapus proyek tersebut saat penghapusan instalasi, sehingga dependensi runtime yang diangkat tetap berada di dalam batas pembersihan plugin tersebut.

Paket plugin npm yang dipublikasikan dapat menyertakan `npm-shrinkwrap.json`; npm menggunakan lockfile yang dapat dipublikasikan tersebut selama instalasi, dan root proyek npm terkelola OpenClaw mendukungnya melalui jalur instalasi normal. Paket plugin milik OpenClaw yang dapat dipublikasikan harus menyertakan shrinkwrap lokal paket yang dihasilkan dari grafik dependensi paket yang dipublikasikan:

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

Generator menghapus `devDependencies` plugin, menerapkan kebijakan penimpaan ruang kerja, dan menulis `extensions/<id>/npm-shrinkwrap.json` untuk setiap plugin dengan `openclaw.release.publishToNpm: true`. Paket plugin pihak ketiga juga dapat menyertakan shrinkwrap; OpenClaw tidak mewajibkannya untuk paket komunitas, tetapi npm mematuhinya jika tersedia.

Sebelum memperlakukan paket lokal sebagai bukti kandidat rilis, periksa tarball yang akan diinstal:

```bash
npm pack --pack-destination /tmp
tar -xOf /tmp/<plugin-package>.tgz package/package.json
tar -tf /tmp/<plugin-package>.tgz | grep '^package/dist/'
```

Untuk perubahan dependensi, verifikasi juga bahwa instalasi produksi dapat menyelesaikan paket runtime tanpa dependensi pengembangan:

```bash
tmpdir=$(mktemp -d)
(
  cd "$tmpdir"
  npm init -y >/dev/null
  npm install --package-lock-only --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts /tmp/<plugin-package>.tgz
)
rm -rf "$tmpdir"
```

Paket plugin npm milik OpenClaw juga dapat dipublikasikan dengan `bundledDependencies` eksplisit. Jalur publikasi npm menimpa daftar nama dependensi runtime, menghapus metadata ruang kerja khusus pengembangan dari manifes yang dipublikasikan, menjalankan instalasi npm tanpa skrip untuk dependensi runtime lokal paket, lalu mengemas atau memublikasikan tarball plugin dengan menyertakan berkas dependensi tersebut. Paket yang banyak menggunakan komponen native (Codex, ACPX, Copilot, llama.cpp, memory-lancedb, Tlon) memilih untuk tidak menggunakannya dengan `openclaw.release.bundleRuntimeDependencies: false`; paket tersebut tetap menyertakan shrinkwrap, tetapi npm menyelesaikan dependensi runtime selama instalasi alih-alih menyematkan setiap biner platform ke dalam tarball plugin. Paket root `openclaw` tidak membundel seluruh pohon dependensinya.

Plugin yang mengimpor `openclaw/plugin-sdk/*` mendeklarasikan `openclaw` sebagai dependensi peer. OpenClaw tidak mengizinkan npm menginstal salinan terpisah paket host dari registri ke dalam proyek terkelola karena paket host yang usang dapat memengaruhi resolusi peer npm di dalam plugin tersebut. Instalasi npm terkelola melewati resolusi/materialisasi peer npm, dan OpenClaw menegaskan kembali tautan `node_modules/openclaw` lokal plugin untuk paket terinstal yang mendeklarasikan peer host, setelah instalasi atau pembaruan.

Instalasi git mengkloning atau menyegarkan repositori, lalu menjalankan:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Plugin yang terinstal kemudian dimuat dari direktori paket tersebut, sehingga resolusi `node_modules` lokal paket dan induk berfungsi dengan cara yang sama seperti pada paket Node normal.

## Plugin lokal

Plugin lokal adalah direktori yang dikendalikan pengembang. OpenClaw tidak pernah menjalankan `npm install`, `pnpm install`, atau perbaikan dependensi untuknya; jika plugin lokal memiliki dependensi, instal dependensi tersebut di plugin itu sebelum memuatnya.

Plugin lokal TypeScript pihak ketiga dimuat melalui Jiti sebagai jalur darurat. Plugin JavaScript terkemas dan plugin internal bawaan dimuat melalui import/require native.

## Permulaan dan pemuatan ulang

Permulaan Gateway dan pemuatan ulang konfigurasi tidak pernah menginstal dependensi plugin. Keduanya membaca catatan instalasi plugin, menghitung titik masuk, lalu memuatnya.

Dependensi yang tidak tersedia saat runtime menyebabkan pemuatan plugin gagal dengan galat yang mengarahkan operator ke perbaikan eksplisit:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` membersihkan status dependensi lama yang dihasilkan OpenClaw dan dapat memulihkan plugin yang dapat diunduh tetapi tidak tersedia dalam catatan instalasi lokal ketika konfigurasi masih merujuknya. Doctor tidak memperbaiki dependensi untuk plugin lokal yang sudah terinstal.

## Plugin bawaan

Plugin bawaan yang ringan dan penting bagi inti dikirimkan sebagai bagian dari OpenClaw. Plugin tersebut harus tidak memiliki pohon dependensi runtime yang berat atau dipindahkan menjadi paket yang dapat diunduh di ClawHub/npm.

Untuk daftar terkini yang dihasilkan mengenai plugin yang dikirimkan dalam paket inti, diinstal secara eksternal, atau tetap hanya berupa sumber, lihat [Inventaris plugin](/id/plugins/plugin-inventory).

Manifes plugin bawaan tidak boleh meminta penyiapan dependensi. Fungsionalitas plugin yang besar atau opsional harus dikemas sebagai plugin normal dan diinstal melalui jalur npm/git/ClawHub yang sama dengan plugin pihak ketiga.

Dalam checkout sumber, OpenClaw memperlakukan repositori sebagai monorepo pnpm. Setelah `pnpm install`, plugin bawaan dimuat dari `extensions/<id>` agar dependensi ruang kerja lokal paket tersedia dan perubahan langsung diterapkan. Pengembangan checkout sumber hanya menggunakan pnpm; `npm install` biasa di root repositori tidak menyiapkan dependensi plugin bawaan.

| Bentuk instalasi                   | Lokasi plugin bawaan                       | Pemilik dependensi                                                        |
| ---------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------- |
| `npm install -g openclaw`          | Pohon runtime hasil build di dalam paket   | Paket OpenClaw dan alur instalasi/pembaruan/doctor plugin yang eksplisit  |
| Checkout Git plus `pnpm install`   | Paket ruang kerja `extensions/<id>`        | Ruang kerja pnpm, termasuk dependensi milik setiap paket plugin           |
| `openclaw plugins install ...`     | Root npm terkelola/git/ClawHub             | Alur instalasi/pembaruan plugin                                           |

## Pembersihan warisan

Versi OpenClaw lama menghasilkan root dependensi plugin bawaan saat permulaan atau selama perbaikan oleh doctor. Pembersihan doctor saat ini menghapus direktori dan symlink usang tersebut dengan `--fix`, termasuk root `plugin-runtime-deps` lama, symlink paket awalan Node global yang menunjuk ke target `plugin-runtime-deps` yang telah dipangkas, manifes `.openclaw-runtime-deps*`, `node_modules` plugin yang dihasilkan, direktori tahap instalasi, dan penyimpanan pnpm lokal paket. Pascainstalasi paket juga menghapus symlink global tersebut sebelum memangkas root target lama, sehingga peningkatan versi tidak meninggalkan impor paket ESM yang terputus.

Instalasi npm lama juga menggunakan root bersama `~/.openclaw/npm/node_modules`. Alur instalasi, pembaruan, penghapusan instalasi, dan doctor saat ini masih mengenali root datar lama tersebut hanya untuk pemulihan dan pembersihan. Instalasi npm baru membuat root proyek per plugin sebagai gantinya.
