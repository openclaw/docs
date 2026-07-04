---
read_when:
    - Anda sedang men-debug instalasi paket plugin
    - Anda mengubah perilaku startup plugin, doctor, atau instalasi manajer paket
    - Anda sedang memelihara instalasi OpenClaw terpaket atau manifes Plugin bawaan
sidebarTitle: Dependencies
summary: Cara OpenClaw menginstal paket Plugin dan menyelesaikan dependensi Plugin
title: Resolusi dependensi Plugin
x-i18n:
    generated_at: "2026-07-04T15:36:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: adc6cc80bfe4e4c06ca0e99877c0d4148861ff88366ae233c254aac56c7cdf6d
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw menjaga pekerjaan dependensi Plugin pada waktu install/update. Pemuatan runtime
tidak menjalankan package manager, memperbaiki pohon dependensi, atau mengubah direktori
paket OpenClaw.

## Pembagian tanggung jawab

Paket Plugin memiliki graph dependensinya sendiri:

- dependensi runtime berada di `dependencies` atau `optionalDependencies`
  paket Plugin
- impor SDK/core adalah peer atau impor OpenClaw yang disediakan
- Plugin pengembangan lokal membawa dependensinya sendiri yang sudah terinstal
- Plugin npm dan git diinstal ke root paket milik OpenClaw

OpenClaw hanya memiliki lifecycle Plugin:

- menemukan sumber Plugin
- menginstal atau memperbarui paket saat diminta secara eksplisit
- mencatat metadata install
- memuat entrypoint Plugin
- gagal dengan error yang dapat ditindaklanjuti saat dependensi hilang

## Root install

OpenClaw menggunakan root per sumber yang stabil:

- paket npm diinstal ke proyek per Plugin di bawah
  `~/.openclaw/npm/projects/<encoded-package>`
- paket git di-clone di bawah `~/.openclaw/git`
- install lokal/path/archive disalin atau direferensikan tanpa perbaikan dependensi

Install npm berjalan di root proyek per Plugin tersebut dengan:

```bash
cd ~/.openclaw/npm/projects/<encoded-package>
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` menggunakan root proyek npm per Plugin
yang sama untuk tarball npm-pack lokal. OpenClaw membaca metadata npm tarball,
menambahkannya ke proyek terkelola sebagai dependensi `file:` yang disalin, menjalankan
install npm normal, lalu memverifikasi metadata lockfile yang terinstal sebelum
memercayai Plugin.
Ini ditujukan untuk bukti package-acceptance dan release-candidate saat artefak pack
lokal harus berperilaku seperti artefak registry yang disimulasikannya.

Gunakan `npm-pack:` saat menguji paket Plugin resmi atau eksternal sebelum
publish. Install archive atau path mentah berguna untuk debugging lokal, tetapi
tidak membuktikan jalur dependensi yang sama seperti paket npm atau ClawHub yang terinstal.
`npm-pack:` membuktikan bentuk install paket terkelola; itu sendiri bukan
bukti bahwa Plugin adalah konten resmi yang terhubung katalog.

Saat perilaku bergantung pada status Plugin bundled atau Plugin resmi tepercaya, sandingkan
bukti paket lokal dengan install resmi berbasis katalog atau jalur paket yang dipublikasikan
yang mencatat kepercayaan resmi. Akses helper istimewa dan penanganan scope
trusted-official harus divalidasi pada jalur install tepercaya tersebut,
bukan disimpulkan dari install tarball lokal.

Jika Plugin gagal saat runtime karena impor hilang, perbaiki manifest paket
alih-alih memperbaiki proyek terkelola secara manual. Impor runtime termasuk dalam
`dependencies` atau `optionalDependencies` paket Plugin; `devDependencies` tidak
diinstal untuk proyek runtime terkelola. `npm install` lokal di dalam
`~/.openclaw/npm/projects/<encoded-package>` dapat membuka blokir diagnostik sementara,
tetapi itu bukan bukti package-acceptance karena install atau update berikutnya akan
membuat ulang proyek dari metadata paket.

npm dapat meng-hoist dependensi transitif ke `node_modules` proyek per Plugin
di samping paket Plugin. OpenClaw memindai root proyek terkelola sebelum
memercayai install dan menghapus proyek tersebut saat uninstall, sehingga
dependensi runtime yang di-hoist tetap berada dalam batas cleanup Plugin itu.

Paket Plugin npm yang dipublikasikan dapat menyertakan `npm-shrinkwrap.json`. npm menggunakan
lockfile yang dapat dipublikasikan tersebut saat install, dan root proyek npm terkelola
OpenClaw mendukungnya melalui jalur install npm normal. Paket Plugin yang dapat
dipublikasikan milik OpenClaw harus menyertakan shrinkwrap lokal paket yang dihasilkan dari
graph dependensi yang dipublikasikan milik paket Plugin tersebut:

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

Generator menghapus `devDependencies` Plugin, menerapkan kebijakan override workspace,
dan menulis `extensions/<id>/npm-shrinkwrap.json` untuk setiap Plugin
`publishToNpm`. Paket Plugin pihak ketiga juga dapat menyertakan shrinkwrap;
OpenClaw tidak mewajibkannya untuk paket komunitas, tetapi npm akan menghormatinya
saat ada.

Sebelum memperlakukan paket lokal sebagai bukti release-candidate, inspeksi tarball
yang akan diinstal:

```bash
npm pack --pack-destination /tmp
tar -xOf /tmp/<plugin-package>.tgz package/package.json
tar -tf /tmp/<plugin-package>.tgz | grep '^package/dist/'
```

Untuk perubahan dependensi, verifikasi juga bahwa install produksi dapat me-resolve
paket runtime tanpa dependensi dev:

```bash
tmpdir=$(mktemp -d)
(
  cd "$tmpdir"
  npm init -y >/dev/null
  npm install --package-lock-only --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts /tmp/<plugin-package>.tgz
)
rm -rf "$tmpdir"
```

Paket Plugin npm milik OpenClaw juga dapat dipublikasikan dengan
`bundledDependencies` eksplisit. Jalur publish npm menimpa daftar nama dependensi
runtime, menghapus metadata workspace khusus dev dari manifest paket yang dipublikasikan,
menjalankan install npm tanpa script untuk dependensi runtime lokal paket,
lalu mengemas atau memublikasikan tarball Plugin dengan file dependensi tersebut
disertakan. Paket yang berat native, termasuk runtime Codex dan ACP, opt out
dengan `openclaw.release.bundleRuntimeDependencies: false`; paket tersebut tetap
mengirim shrinkwrap-nya, tetapi npm me-resolve dependensi runtime saat install
alih-alih menyematkan setiap binary platform di tarball Plugin. Paket root
`openclaw` tidak membundel seluruh pohon dependensinya.

Plugin yang mengimpor `openclaw/plugin-sdk/*` mendeklarasikan `openclaw` sebagai dependensi
peer. OpenClaw tidak membiarkan npm menginstal salinan registry terpisah dari
paket host ke proyek terkelola, karena paket host yang usang dapat memengaruhi resolusi
peer npm di dalam Plugin tersebut. Install npm terkelola melewati resolusi/materialisasi
peer npm dan OpenClaw menegaskan ulang tautan `node_modules/openclaw` lokal Plugin
untuk paket terinstal yang mendeklarasikan peer host setelah install atau update.

Install git meng-clone atau me-refresh repository, lalu menjalankan:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Plugin yang terinstal kemudian dimuat dari direktori paket tersebut, sehingga resolusi
`node_modules` lokal paket dan parent bekerja sama seperti pada paket Node normal.

## Plugin lokal

Plugin lokal diperlakukan sebagai direktori yang dikendalikan developer. OpenClaw tidak
menjalankan `npm install`, `pnpm install`, atau perbaikan dependensi untuknya. Jika Plugin
lokal memiliki dependensi, instal dependensi tersebut di Plugin itu sebelum memuatnya.

Plugin lokal TypeScript pihak ketiga dapat menggunakan jalur darurat Jiti. Plugin
JavaScript terpaket dan Plugin internal bundled dimuat melalui native
import/require alih-alih Jiti.

## Startup dan reload

Startup Gateway dan reload config tidak pernah menginstal dependensi Plugin. Keduanya membaca
record install Plugin, menghitung entrypoint, dan memuatnya.

Jika dependensi hilang saat runtime, Plugin gagal dimuat dan error
harus mengarahkan operator ke perbaikan eksplisit:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` dapat membersihkan state dependensi lama yang dihasilkan OpenClaw dan memulihkan
Plugin yang dapat diunduh yang hilang dari record install lokal saat config
mereferensikannya. Doctor tidak memperbaiki dependensi untuk Plugin lokal yang sudah terinstal.

## Plugin bundled

Plugin bundled yang ringan dan kritis untuk core dikirim sebagai bagian dari OpenClaw.
Plugin tersebut sebaiknya tidak memiliki pohon dependensi runtime yang berat atau dipindahkan
ke paket yang dapat diunduh di ClawHub/npm.

Untuk daftar terbaru yang dihasilkan dari Plugin yang dikirim di paket core, diinstal
secara eksternal, atau tetap source-only, lihat [Inventaris Plugin](/id/plugins/plugin-inventory).

Manifest Plugin bundled tidak boleh meminta staging dependensi. Fungsionalitas Plugin
yang besar atau opsional sebaiknya dikemas sebagai Plugin normal dan diinstal melalui
jalur npm/git/ClawHub yang sama seperti Plugin pihak ketiga.

Dalam checkout sumber, OpenClaw memperlakukan repository sebagai monorepo pnpm. Setelah
`pnpm install`, Plugin bundled dimuat dari `extensions/<id>` sehingga dependensi workspace
lokal paket tersedia dan edit diambil secara langsung. Pengembangan checkout sumber
hanya pnpm; `npm install` biasa di root repository bukan cara yang didukung untuk
menyiapkan dependensi Plugin bundled.

| Bentuk install                  | Lokasi Plugin bundled                 | Pemilik dependensi                                                   |
| ------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`       | Pohon runtime hasil build di paket    | Paket OpenClaw dan flow install/update/doctor Plugin eksplisit       |
| Checkout git plus `pnpm install` | Paket workspace `extensions/<id>`     | Workspace pnpm, termasuk dependensi milik setiap paket Plugin        |
| `openclaw plugins install ...`  | Root proyek npm/git/ClawHub terkelola | Flow install/update Plugin                                           |

## Cleanup legacy

Versi OpenClaw lama menghasilkan root dependensi Plugin bundled saat startup atau
selama perbaikan doctor. Cleanup doctor saat ini menghapus direktori dan symlink usang
tersebut saat `--fix` digunakan, termasuk root `plugin-runtime-deps` lama, symlink paket
global Node-prefix yang mengarah ke target `plugin-runtime-deps` yang sudah dipangkas,
manifest `.openclaw-runtime-deps*`, `node_modules` Plugin yang dihasilkan, direktori
stage install, dan store pnpm lokal paket. Postinstall terpaket juga
menghapus symlink global tersebut sebelum memangkas root target legacy sehingga upgrade
tidak meninggalkan impor paket ESM yang menggantung.

Install npm lama juga menggunakan root bersama `~/.openclaw/npm/node_modules`.
Flow install, update, uninstall, dan doctor saat ini masih mengenali root flat legacy tersebut
hanya untuk pemulihan dan cleanup. Install npm baru sebaiknya membuat
root proyek per Plugin sebagai gantinya.
