---
doc-schema-version: 1
read_when:
    - Anda ingin menelusuri, menginstal, mengaktifkan, atau menonaktifkan plugin di UI Kontrol
    - Anda menginginkan contoh cepat untuk melihat daftar plugin, menginstal, memperbarui, memeriksa, atau menghapus instalasi plugin
    - Anda ingin memilih sumber instalasi plugin
    - Anda memerlukan referensi yang tepat untuk menerbitkan paket Plugin
sidebarTitle: Manage plugins
summary: Kelola plugin OpenClaw dari UI Kontrol atau CLI
title: Kelola plugin
x-i18n:
    generated_at: "2026-07-12T14:24:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0b235dfca7ef815cc8b0f82db6a9ba8cb344b00612ffd77ca67c8bbd379bdf2a
    source_path: plugins/manage-plugins.md
    workflow: 16
---

Control UI mencakup alur kerja umum untuk menemukan, menginstal, mengaktifkan, dan menonaktifkan. CLI menambahkan kontrol untuk pembaruan, penghapusan instalasi, konfigurasi lanjutan, dan sumber instalasi eksplisit. Untuk kontrak perintah lengkap, flag, aturan pemilihan sumber, dan kasus khususnya, lihat [`openclaw plugins`](/id/cli/plugins).

Alur kerja CLI yang umum: temukan paket, instal dari ClawHub, npm, git, atau jalur lokal, biarkan Gateway terkelola dimulai ulang secara otomatis (atau mulai ulang secara manual), lalu verifikasi pendaftaran runtime Plugin tersebut.

## Menggunakan Control UI

Buka **Plugins** di Control UI, atau gunakan `/settings/plugins` relatif terhadap jalur dasar Control UI yang dikonfigurasi. Misalnya, jalur dasar `/openclaw` menggunakan `/openclaw/settings/plugins`. Halaman ini memiliki dua tab:

- **Installed** menampilkan inventaris lokal lengkap yang dikelompokkan berdasarkan kategori (kanal, penyedia model, memori, alat). Setiap baris membuka tampilan detail; menu luapannya (`…`) mengaktifkan atau menonaktifkan Plugin dan, untuk Plugin yang diinstal secara eksternal, menawarkan **Remove**. Tab ini juga mencantumkan [server MCP](/id/cli/mcp) yang dikonfigurasi dengan tindakan mengaktifkan, menonaktifkan, dan menghapus berbasis menu yang sama, dengan mengedit `mcp.servers` dalam konfigurasi Gateway.
- **Discover** adalah toko: Plugin unggulan yang disertakan bersama OpenClaw, Plugin eksternal resmi, dan rak konektor yang dikurasi. Kartu konektor dapat menambahkan server MCP terhost dengan sekali klik (GitHub, Notion, Linear, Sentry, Home Assistant) atau membuka pencarian ClawHub yang telah diisi sebelumnya. Mengetik di kotak pencarian akan mengajukan kueri ke [ClawHub](https://clawhub.ai/plugins) secara langsung dan menambahkan bagian **From ClawHub** dengan jumlah unduhan serta lencana verifikasi sumber.

Plugin yang disertakan tidak memerlukan instalasi paket. Tindakan menunya adalah **Enable** atau **Disable**. Sebagai contoh, Workboard disertakan bersama OpenClaw dan dinonaktifkan secara default, jadi pilih **Enable** untuk mengaktifkannya. Plugin bawaan tidak dapat dihapus, hanya dinonaktifkan.

Akses katalog dan pencarian memerlukan `operator.read`. Instalasi, pengaktifan, penonaktifan, penghapusan, dan perubahan server MCP memerlukan `operator.admin`. Instalasi ClawHub dilakukan oleh Gateway dan mempertahankan pemeriksaan kebijakan kepercayaan, integritas, dan instalasi Plugin.

Menginstal atau menghapus kode Plugin memerlukan mulai ulang Gateway. Perubahan pengaktifan dapat diterapkan tanpa mulai ulang jika Plugin yang terinstal dan runtime Gateway saat ini mendukungnya; jika tidak, UI akan memberi tahu bahwa mulai ulang diperlukan. Konektor MCP berbasis OAuth tetap memerlukan satu kali `openclaw mcp login <name>` dari CLI setelah ditambahkan.

Control UI tidak menginstal dari sumber npm, git, atau jalur lokal arbitrer, memperbarui Plugin, ataupun menyediakan konfigurasi Plugin yang lengkap. Gunakan alur kerja CLI di bawah untuk operasi tersebut.

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

`plugins list` adalah pemeriksaan inventaris dingin: apa yang dapat ditemukan OpenClaw dari konfigurasi, manifes, dan registri Plugin persisten. Perintah ini tidak membuktikan bahwa Gateway yang sudah berjalan telah mengimpor runtime Plugin. Keluaran JSON menyertakan diagnostik registri dan `dependencyStatus` setiap Plugin (apakah `dependencies`/`optionalDependencies` yang dideklarasikan dapat ditemukan pada disk).

`plugins search` mengajukan kueri ke ClawHub untuk mencari paket Plugin yang dapat diinstal dan mencetak petunjuk instalasi (`openclaw plugins install clawhub:<package>`) untuk setiap hasil.

## Mengaktifkan dan menonaktifkan Plugin

```bash
openclaw plugins enable <plugin-id>
openclaw plugins disable <plugin-id>
```

Mengalihkan entri konfigurasi Plugin tanpa menyentuh berkas yang terinstal. Beberapa Plugin bawaan (penyedia model/ucapan bawaan dan Plugin peramban bawaan) diaktifkan secara default; yang lain memerlukan `enable` setelah instalasi.

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

Spesifikasi paket tanpa awalan diinstal dari npm selama peralihan peluncuran, kecuali namanya cocok dengan ID Plugin bawaan atau resmi; dalam hal ini OpenClaw menggunakan salinan lokal/resmi tersebut. Gunakan `clawhub:`, `npm:`, `git:`, atau `npm-pack:` untuk pemilihan sumber yang deterministik.

Gunakan `--force` hanya untuk menimpa target instalasi yang sudah ada dari sumber berbeda. Untuk peningkatan rutin instalasi npm, ClawHub, atau paket hook yang dilacak, gunakan `openclaw plugins update`; `--force` tidak didukung bersama `--link`.

## Memulai ulang dan memeriksa

Gateway terkelola yang sedang berjalan dengan pemuatan ulang konfigurasi diaktifkan akan dimulai ulang secara otomatis setelah menginstal, memperbarui, atau menghapus instalasi kode Plugin. Jika Gateway tidak dikelola atau pemuatan ulang dinonaktifkan, mulai ulang sendiri sebelum memeriksa permukaan runtime aktif:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

`inspect --runtime` memuat modul Plugin dan membuktikan bahwa modul tersebut mendaftarkan permukaan runtime (alat, hook, layanan, metode Gateway, rute HTTP, perintah CLI milik Plugin). `inspect` biasa dan `list` hanya merupakan pemeriksaan dingin terhadap manifes/konfigurasi/registri.

## Memperbarui Plugin

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
openclaw plugins update <plugin-id> --dry-run
```

Memberikan ID Plugin akan menggunakan kembali spesifikasi instalasi yang dilacak: dist-tag yang tersimpan (`@beta`) dan versi tersemat yang tepat tetap digunakan dalam eksekusi `update <plugin-id>` berikutnya.

`openclaw plugins update --all` adalah jalur pemeliharaan massal. Perintah ini tetap mematuhi spesifikasi instalasi terlacak biasa, tetapi catatan Plugin OpenClaw resmi tepercaya disinkronkan dengan target katalog resmi saat ini, bukan tetap tersemat pada paket resmi lama dengan versi tepat; ketika `update.channel` adalah `beta`, sinkronisasi tersebut mengutamakan jalur rilis beta. Gunakan `update <plugin-id>` yang ditargetkan agar spesifikasi resmi dengan versi tepat atau tag tidak berubah.

Untuk instalasi npm, berikan spesifikasi paket eksplisit guna mengganti catatan yang dilacak:

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

Perintah kedua memindahkan Plugin kembali ke jalur rilis default registri jika sebelumnya disematkan ke versi atau tag tertentu.

Lihat [`openclaw plugins`](/id/cli/plugins#update) untuk aturan fallback dan penyematan yang tepat.

## Menghapus instalasi Plugin

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
```

Penghapusan instalasi menghapus entri konfigurasi Plugin, catatan indeks Plugin persisten, entri daftar izin/penolakan, dan entri `plugins.load.paths` tertaut jika berlaku. Direktori instalasi terkelola dihapus kecuali Anda memberikan `--keep-files`. Gateway terkelola yang sedang berjalan dimulai ulang secara otomatis ketika penghapusan instalasi mengubah sumber Plugin.

Dalam mode Nix (`OPENCLAW_NIX_MODE=1`), instalasi, pembaruan, penghapusan instalasi, pengaktifan, dan penonaktifan Plugin semuanya dinonaktifkan; kelola pilihan tersebut di sumber Nix untuk instalasi.

## Memilih sumber

| Sumber      | Gunakan ketika                                                                 | Contoh                                                         |
| ----------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| ClawHub     | Anda menginginkan penemuan asli OpenClaw, ringkasan pemindaian, versi, dan petunjuk | `openclaw plugins install clawhub:<package>`                   |
| git         | Anda menginginkan branch, tag, atau commit dari repositori                      | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| jalur lokal | Anda sedang mengembangkan atau menguji Plugin di mesin yang sama                | `openclaw plugins install --link ./my-plugin`                  |
| marketplace | Anda menginstal Plugin marketplace yang kompatibel dengan Claude                | `openclaw plugins install <plugin> --marketplace <source>`     |
| paket npm   | Anda membuktikan artefak paket lokal melalui semantik instalasi npm             | `openclaw plugins install npm-pack:<path.tgz>`                 |
| npmjs.com   | Anda sudah mendistribusikan paket JavaScript atau memerlukan dist-tag npm/registri privat | `openclaw plugins install npm:@acme/openclaw-plugin`           |

Instalasi jalur lokal terkelola harus berupa direktori atau arsip Plugin. Tempatkan berkas Plugin mandiri di `plugins.load.paths`, alih-alih menginstalnya dengan `plugins install`.

## Menerbitkan Plugin

ClawHub adalah permukaan penemuan publik utama untuk Plugin OpenClaw. Terbitkan di sana jika Anda ingin pengguna menemukan metadata Plugin, riwayat versi, hasil pemindaian registri, dan petunjuk instalasi sebelum mereka menginstalnya.

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

Plugin npm native harus menyertakan manifes Plugin (`openclaw.plugin.json`) beserta metadata `package.json` sebelum diterbitkan:

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

Gunakan halaman berikut untuk kontrak penerbitan lengkap, alih-alih menganggap halaman ini sebagai referensi penerbitan:

- [Penerbitan ClawHub](/id/clawhub/publishing) menjelaskan pemilik, cakupan, rilis, peninjauan, validasi paket, dan pemindahan paket.
- [Membangun Plugin](/id/plugins/building-plugins) menunjukkan bentuk paket Plugin lengkap (termasuk `openclaw.plugin.json`) dan alur kerja penerbitan pertama.
- [Manifes Plugin](/id/plugins/manifest) mendefinisikan bidang manifes Plugin native.

Jika paket yang sama tersedia di ClawHub dan npm, gunakan awalan eksplisit `clawhub:` atau `npm:` untuk memaksakan satu sumber.

## Terkait

- [Plugin](/id/tools/plugin) - instal, konfigurasikan, mulai ulang, dan pecahkan masalah
- [`openclaw plugins`](/id/cli/plugins) - referensi CLI lengkap
- [Plugin komunitas](/id/plugins/community) - penemuan publik dan penerbitan ClawHub
- [ClawHub](/id/clawhub/cli) - operasi CLI registri
- [Membangun Plugin](/id/plugins/building-plugins) - membuat paket Plugin
- [Manifes Plugin](/id/plugins/manifest) - manifes dan metadata paket
