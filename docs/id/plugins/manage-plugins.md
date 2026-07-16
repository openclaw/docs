---
doc-schema-version: 1
read_when:
    - Anda ingin menelusuri, menginstal, mengaktifkan, atau menonaktifkan plugin di UI Kontrol
    - Anda menginginkan contoh singkat untuk melihat daftar plugin, menginstal, memperbarui, memeriksa, atau menghapus instalasi plugin
    - Anda ingin memilih sumber instalasi plugin
    - Anda menginginkan referensi yang tepat untuk menerbitkan paket plugin
sidebarTitle: Manage plugins
summary: Kelola plugin OpenClaw dari UI Kontrol atau CLI
title: Kelola plugin
x-i18n:
    generated_at: "2026-07-16T18:23:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2e22483a7bfb6da4f1eafef036ebc1e2151a725e21565e0634c615ff2f168c1d
    source_path: plugins/manage-plugins.md
    workflow: 16
---

Control UI mencakup alur kerja penemuan, penginstalan, pengaktifan, dan penonaktifan
yang umum. CLI menambahkan kontrol pembaruan, penghapusan instalasi, konfigurasi
lanjutan, dan sumber instalasi eksplisit. Untuk kontrak perintah, flag, aturan
pemilihan sumber, dan kasus khusus selengkapnya, lihat [`openclaw plugins`](/id/cli/plugins).

Alur kerja CLI umum: temukan paket, instal dari ClawHub, npm, git, atau jalur
lokal, biarkan Gateway terkelola dimulai ulang secara otomatis (atau mulai ulang
secara manual), lalu verifikasi pendaftaran runtime Plugin tersebut.

## Menggunakan Control UI

Buka **Plugin** di Control UI, atau gunakan `/settings/plugins` relatif terhadap
jalur dasar Control UI yang dikonfigurasi. Misalnya, jalur dasar `/openclaw` menggunakan
`/openclaw/settings/plugins`. Halaman ini memiliki dua tab:

- **Terinstal** menampilkan inventaris lokal lengkap yang dikelompokkan berdasarkan kategori (saluran,
  penyedia model, memori, alat). Setiap baris membuka tampilan detail; menu luapan
  (`…`) mengaktifkan atau menonaktifkan Plugin dan, untuk Plugin yang diinstal
  secara eksternal, menawarkan **Hapus**. Tab ini juga mencantumkan
  [server MCP](/id/cli/mcp) yang dikonfigurasi dengan tindakan pengaktifan, penonaktifan,
  dan penghapusan berbasis menu yang sama, dengan mengedit `mcp.servers` dalam
  konfigurasi Gateway.
- **Temukan** adalah toko: Plugin unggulan yang disertakan bersama OpenClaw, Plugin
  eksternal resmi, dan rak konektor pilihan. Kartu konektor dapat menambahkan
  server MCP yang dihosting dengan sekali klik (GitHub, Notion, Linear, Sentry,
  Home Assistant) atau membuka pencarian ClawHub yang telah diisi sebelumnya. Pengetikan di kotak
  pencarian akan membuat kueri ke [ClawHub](https://clawhub.ai/plugins) secara langsung dan menambahkan bagian **Dari
  ClawHub** dengan jumlah unduhan dan lencana verifikasi sumber.

Plugin yang disertakan tidak memerlukan penginstalan paket. Tindakan menunya adalah **Aktifkan**
atau **Nonaktifkan**. Workboard, misalnya, disertakan bersama OpenClaw dan dinonaktifkan
secara default, jadi pilih **Aktifkan** untuk mengaktifkannya. Plugin bawaan tidak dapat
dihapus, hanya dinonaktifkan.

Akses katalog dan pencarian memerlukan `operator.read`. Perubahan penginstalan, pengaktifan,
penonaktifan, penghapusan, dan server MCP memerlukan `operator.admin`. Penginstalan ClawHub
dilakukan oleh Gateway dan mempertahankan pemeriksaan kebijakan kepercayaan, integritas,
dan penginstalan Plugin. Mengaktifkan Plugin yang telah diinstal sebagai administrator juga
mencatat kepercayaan eksplisit tersebut dengan menambahkan Plugin yang dipilih ke daftar
`plugins.allow` restriktif yang sudah ada. Entri `plugins.deny` eksplisit tetap menjadi
otoritas dan harus dihapus sebelum mengaktifkan Plugin.

Menginstal atau menghapus kode Plugin memerlukan mulai ulang Gateway. Perubahan pengaktifan
dapat diterapkan tanpa mulai ulang jika Plugin yang diinstal dan runtime Gateway saat ini
mendukungnya; jika tidak, UI akan memberi tahu bahwa mulai ulang diperlukan.
Konektor MCP berbasis OAuth masih memerlukan `openclaw mcp login <name>` satu kali
dari CLI setelah ditambahkan.

Control UI tidak menginstal dari sumber npm, git, atau jalur lokal sembarang,
memperbarui Plugin, ataupun menyediakan konfigurasi Plugin yang lengkap. Gunakan alur kerja CLI
di bawah ini untuk operasi tersebut.

## Mencantumkan dan mencari Plugin

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search "calendar"
```

`--json` untuk skrip:

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` adalah pemeriksaan inventaris dingin: apa yang dapat ditemukan OpenClaw dari
konfigurasi, manifes, dan registri Plugin yang dipersistenkan. Pemeriksaan ini tidak membuktikan
bahwa Gateway yang sudah berjalan telah mengimpor runtime Plugin. Keluaran JSON mencakup
diagnostik registri dan `dependencyStatus` setiap Plugin (apakah
`dependencies`/`optionalDependencies` yang dideklarasikan dapat ditemukan di disk).

`plugins search` membuat kueri ke ClawHub untuk paket Plugin yang dapat diinstal dan mencetak
petunjuk penginstalan (`openclaw plugins install clawhub:<package>`) untuk setiap hasil.

## Mengaktifkan dan menonaktifkan Plugin

```bash
openclaw plugins enable <plugin-id>
openclaw plugins disable <plugin-id>
```

Mengalihkan entri konfigurasi Plugin tanpa menyentuh file yang diinstal. Beberapa
Plugin bawaan (penyedia model/ucapan bawaan dan Plugin peramban bawaan)
diaktifkan secara default; yang lain memerlukan `enable` setelah penginstalan.

## Menginstal Plugin

```bash
# Cari paket Plugin di ClawHub.
openclaw plugins search "calendar"

# Instal dari ClawHub.
openclaw plugins install clawhub:<package>
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta

# Instal dari npm.
openclaw plugins install npm:<package>
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex

# Instal dari artefak npm-pack lokal.
openclaw plugins install npm-pack:<path.tgz>

# Instal dari git atau checkout pengembangan lokal.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

Spesifikasi paket tanpa awalan diinstal dari npm selama peralihan peluncuran, kecuali
namanya cocok dengan id Plugin bawaan atau resmi; dalam hal ini OpenClaw menggunakan
salinan lokal/resmi tersebut. Gunakan `clawhub:`, `npm:`, `git:`, atau
`npm-pack:` untuk pemilihan sumber deterministik. Paket katalog bawaan dan resmi
OpenClaw dipercaya bersama paket ClawHub. Sumber npm sembarang yang baru,
git, jalur/arsip lokal, `npm-pack:`, atau lokapasar memerlukan
`--force` dalam penginstalan noninteraktif setelah Anda meninjau
dan memercayai sumbernya.

`--force` mengonfirmasi sumber non-ClawHub tanpa meminta konfirmasi dan menimpa
target penginstalan yang sudah ada bila diperlukan. Untuk peningkatan rutin penginstalan npm,
ClawHub, atau hook-pack yang dilacak, gunakan `openclaw plugins update`. Dengan
`--link`, `--force` hanya mengonfirmasi sumber; direktori tertaut tidak
disalin atau ditimpa.

## Memulai ulang dan memeriksa

Gateway terkelola yang sedang berjalan dengan pemuatan ulang konfigurasi diaktifkan akan dimulai ulang secara otomatis
setelah menginstal, memperbarui, atau menghapus instalasi kode Plugin. Jika Gateway
tidak terkelola atau pemuatan ulang dinonaktifkan, mulai ulang sendiri sebelum memeriksa
permukaan runtime langsung:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

`inspect --runtime` memuat modul Plugin dan membuktikan bahwa modul tersebut mendaftarkan permukaan
runtime (alat, hook, layanan, metode Gateway, rute HTTP, perintah CLI
milik Plugin). `inspect` dan `list` biasa hanyalah pemeriksaan dingin
terhadap manifes/konfigurasi/registri.

## Memperbarui Plugin

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
openclaw plugins update <plugin-id> --dry-run
```

Memberikan id Plugin akan menggunakan kembali spesifikasi penginstalan yang dilacak: dist-tag
(`@beta`) yang tersimpan dan versi tepat yang disematkan diteruskan ke proses
`update <plugin-id>` berikutnya.

`openclaw plugins update --all` adalah jalur pemeliharaan massal. Jalur ini tetap
mengikuti spesifikasi penginstalan terlacak biasa, tetapi catatan Plugin OpenClaw
resmi yang tepercaya disinkronkan ke target katalog resmi saat ini, alih-alih
tetap disematkan ke paket resmi tepat yang sudah usang; ketika `update.channel` adalah
`beta`, sinkronisasi tersebut memprioritaskan lini rilis beta. Gunakan
`update <plugin-id>` yang ditargetkan agar spesifikasi resmi tepat atau bertag tidak berubah.

Untuk penginstalan npm, berikan spesifikasi paket eksplisit untuk mengganti catatan
yang dilacak:

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

Perintah kedua mengembalikan Plugin ke lini rilis default registri
ketika sebelumnya disematkan ke versi atau tag tertentu.

Lihat [`openclaw plugins`](/id/cli/plugins#update) untuk aturan fallback dan
penyematan yang tepat.

## Menghapus instalasi Plugin

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
```

Penghapusan instalasi menghapus entri konfigurasi Plugin, catatan indeks Plugin yang dipersistenkan,
entri daftar izinkan/tolak, dan entri `plugins.load.paths` tertaut jika
berlaku. Direktori penginstalan terkelola dihapus kecuali Anda memberikan
`--keep-files`. Gateway terkelola yang sedang berjalan dimulai ulang secara otomatis ketika
penghapusan instalasi mengubah sumber Plugin.

Dalam mode Nix (`OPENCLAW_NIX_MODE=1`), penginstalan, pembaruan, penghapusan instalasi,
pengaktifan, dan penonaktifan Plugin semuanya dinonaktifkan; kelola pilihan tersebut dalam sumber Nix
untuk penginstalan.

## Memilih sumber

| Sumber      | Gunakan ketika                                                                 | Contoh                                                         |
| ----------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| ClawHub     | Anda menginginkan penemuan asli OpenClaw, ringkasan pemindaian, versi, dan petunjuk | `openclaw plugins install clawhub:<package>`                   |
| git         | Anda menginginkan cabang, tag, atau commit dari repositori                     | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| jalur lokal | Anda sedang mengembangkan atau menguji Plugin pada mesin yang sama             | `openclaw plugins install --link ./my-plugin`                  |
| lokapasar   | Anda menginstal Plugin lokapasar yang kompatibel dengan Claude                 | `openclaw plugins install <plugin> --marketplace <source>`     |
| npm pack    | Anda membuktikan artefak paket lokal melalui semantik penginstalan npm         | `openclaw plugins install npm-pack:<path.tgz>`                 |
| npmjs.com   | Anda sudah mendistribusikan paket JavaScript atau memerlukan dist-tag npm/registri privat | `openclaw plugins install npm:@acme/openclaw-plugin`           |

Penginstalan jalur lokal terkelola harus berupa direktori atau arsip Plugin. Tempatkan
file Plugin mandiri di `plugins.load.paths`, alih-alih menginstalnya
dengan `plugins install`.

## Menerbitkan Plugin

ClawHub adalah permukaan penemuan publik utama untuk Plugin OpenClaw. Terbitkan
di sana jika Anda ingin pengguna menemukan metadata Plugin, riwayat versi, hasil
pemindaian registri, dan petunjuk penginstalan sebelum mereka menginstalnya.

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

Plugin npm native harus menyertakan manifes Plugin (`openclaw.plugin.json`) serta
metadata `package.json` sebelum diterbitkan:

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

Gunakan halaman berikut untuk kontrak penerbitan lengkap, alih-alih memperlakukan halaman ini
sebagai referensi penerbitan:

- [Penerbitan ClawHub](/id/clawhub/publishing) menjelaskan pemilik, cakupan,
  rilis, peninjauan, validasi paket, dan transfer paket.
- [Membangun Plugin](/id/plugins/building-plugins) menunjukkan bentuk lengkap paket
  Plugin (termasuk `openclaw.plugin.json`) dan alur kerja
  penerbitan pertama.
- [Manifes Plugin](/id/plugins/manifest) mendefinisikan bidang manifes Plugin
  native.

Jika paket yang sama tersedia di ClawHub dan npm, gunakan awalan eksplisit
`clawhub:` atau `npm:` untuk memaksa penggunaan salah satu sumber.

## Terkait

- [Plugin](/id/tools/plugin) - instal, konfigurasikan, mulai ulang, dan pecahkan masalah
- [`openclaw plugins`](/id/cli/plugins) - referensi CLI lengkap
- [Plugin komunitas](/id/plugins/community) - penemuan publik dan penerbitan ClawHub
- [ClawHub](/id/clawhub/cli) - operasi CLI registri
- [Membangun Plugin](/id/plugins/building-plugins) - membuat paket Plugin
- [Manifes Plugin](/id/plugins/manifest) - manifes dan metadata paket
