---
read_when:
    - Anda ingin agen OpenClaw mode Codex menggunakan Codex Computer Use
    - Anda sedang memilih antara Codex Computer Use, PeekabooBridge, dan MCP cua-driver langsung
    - Anda sedang memilih antara Codex Computer Use dan penyiapan MCP cua-driver langsung
    - Anda sedang mengonfigurasi computerUse untuk plugin Codex yang dibundel
    - Anda sedang memecahkan masalah status atau pemasangan penggunaan komputer /codex
summary: Siapkan Codex Computer Use untuk agen OpenClaw mode Codex
title: Penggunaan Komputer Codex
x-i18n:
    generated_at: "2026-06-30T14:26:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4cb785e2fda0d89a7e7770df0c2a4b3aa23f97cb1c8515a7d555a8409acfd3b2
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use adalah Plugin MCP native Codex untuk kontrol desktop lokal. OpenClaw
tidak mem-vendor aplikasi desktop, menjalankan aksi desktop sendiri, atau
melewati izin Codex. Plugin `codex` bawaan hanya menyiapkan app-server Codex:
mengaktifkan dukungan Plugin Codex, menemukan atau menginstal Plugin Codex
Computer Use yang dikonfigurasi, memeriksa bahwa server MCP `computer-use`
tersedia, lalu membiarkan Codex memiliki panggilan tool MCP native selama giliran
mode Codex.

Gunakan halaman ini ketika OpenClaw sudah menggunakan harness Codex native. Untuk
penyiapan runtime itu sendiri, lihat [harness Codex](/id/plugins/codex-harness).

## OpenClaw.app dan Peekaboo

Integrasi Peekaboo OpenClaw.app terpisah dari Codex Computer Use. Aplikasi macOS
dapat meng-host soket PeekabooBridge agar CLI `peekaboo` dapat menggunakan ulang
izin lokal Accessibility dan Screen Recording milik aplikasi untuk tool otomasi
Peekaboo sendiri. Bridge itu tidak menginstal atau mem-proxy Codex Computer Use,
dan Codex Computer Use tidak memanggil melalui soket PeekabooBridge.

Gunakan [bridge Peekaboo](/id/platforms/mac/peekaboo) ketika Anda ingin
OpenClaw.app menjadi host yang sadar izin untuk otomasi CLI Peekaboo. Gunakan
halaman ini ketika agen OpenClaw mode Codex harus memiliki Plugin MCP
`computer-use` native Codex yang tersedia sebelum giliran dimulai.

## Aplikasi iOS

Aplikasi iOS terpisah dari Codex Computer Use. Aplikasi ini tidak menginstal
atau mem-proxy server MCP `computer-use` Codex dan bukan backend kontrol
desktop. Sebagai gantinya, aplikasi iOS terhubung sebagai node OpenClaw dan
mengekspos kemampuan seluler melalui perintah node seperti `canvas.*`,
`camera.*`, `screen.*`, `location.*`, dan `talk.*`.

Gunakan [iOS](/id/platforms/ios) ketika Anda ingin agen mengendalikan node iPhone
melalui gateway. Gunakan halaman ini ketika agen mode Codex harus mengontrol
desktop macOS lokal melalui Plugin Computer Use native Codex.

## MCP cua-driver langsung

Codex Computer Use bukan satu-satunya cara untuk mengekspos kontrol desktop.
Jika Anda ingin runtime yang dikelola OpenClaw memanggil driver TryCua secara
langsung, gunakan server upstream `cua-driver mcp` melalui registry MCP
OpenClaw, bukan alur marketplace khusus Codex.

Setelah menginstal `cua-driver`, minta perintah OpenClaw darinya:

```bash
cua-driver mcp-config --client openclaw
```

atau daftarkan sendiri server stdio:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Jalur itu menjaga permukaan tool MCP upstream tetap utuh, termasuk skema driver
dan respons MCP terstruktur. Gunakan ketika Anda ingin driver CUA tersedia
sebagai server MCP OpenClaw normal. Gunakan penyiapan Codex Computer Use di
halaman ini ketika app-server Codex harus memiliki instalasi Plugin, pemuatan
ulang MCP, dan panggilan tool native di dalam giliran mode Codex.

Driver CUA bersifat khusus macOS dan tetap memerlukan izin macOS lokal yang
diminta aplikasinya, seperti Accessibility dan Screen Recording. OpenClaw tidak
menginstal `cua-driver`, memberikan izin tersebut, atau melewati model keamanan
driver upstream.

## Penyiapan cepat

Atur `plugins.entries.codex.config.computerUse` ketika giliran mode Codex harus
memiliki Computer Use yang tersedia sebelum thread dimulai. `autoInstall: true`
memilih ikut menggunakan Computer Use dan membiarkan OpenClaw menginstal atau
mengaktifkannya kembali sebelum giliran:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          computerUse: {
            autoInstall: true,
          },
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

Dengan konfigurasi ini, OpenClaw memeriksa app-server Codex sebelum setiap
giliran mode Codex. Jika Computer Use tidak ada tetapi app-server Codex sudah
menemukan marketplace yang dapat diinstal, OpenClaw meminta app-server Codex
untuk menginstal atau mengaktifkan kembali Plugin dan memuat ulang server MCP.
Di macOS, ketika tidak ada marketplace cocok yang terdaftar dan bundle aplikasi
Codex standar ada, OpenClaw juga mencoba mendaftarkan marketplace Codex bawaan
dari `/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` sebelum
gagal. Jika penyiapan masih tidak dapat membuat server MCP tersedia, giliran
gagal sebelum thread dimulai.

Setelah mengubah konfigurasi Computer Use, gunakan `/new` atau `/reset` di chat
yang terdampak sebelum menguji jika thread Codex yang ada sudah dimulai.

Pada startup stdio terkelola di macOS, OpenClaw lebih memilih bundle aplikasi
desktop Codex bertanda tangan di `/Applications/Codex.app/Contents/Resources/codex`
ketika ada. Ini menjaga Computer Use tetap berada di bawah bundle aplikasi yang
memiliki izin kontrol desktop lokal. Jika aplikasi desktop tidak terinstal,
OpenClaw fallback ke biner Codex terkelola yang diinstal di sebelah Plugin. Jika
aplikasi desktop terinstal melakukan inisialisasi dengan versi app-server yang
tidak didukung, OpenClaw menutup child tersebut dan mencoba kandidat biner
terkelola berikutnya, alih-alih membiarkan aplikasi desktop usang menutupi
fallback lokal Plugin. Konfigurasi eksplisit `appServer.command` atau
`OPENCLAW_CODEX_APP_SERVER_BIN` tetap menimpa pemilihan terkelola ini.

## Perintah

Gunakan perintah `/codex computer-use` dari permukaan chat mana pun tempat
permukaan perintah Plugin `codex` tersedia. Ini adalah perintah chat/runtime
OpenClaw, bukan subperintah CLI `openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` bersifat hanya baca. Perintah ini tidak menambahkan sumber marketplace,
menginstal Plugin, atau mengaktifkan dukungan Plugin Codex. Jika tidak ada
konfigurasi yang memilih ikut menggunakan Computer Use, `status` dapat melaporkan
nonaktif bahkan setelah perintah instalasi sekali jalan.

`install` mengaktifkan dukungan Plugin app-server Codex, secara opsional
menambahkan sumber marketplace yang dikonfigurasi, menginstal atau mengaktifkan
kembali Plugin yang dikonfigurasi melalui app-server Codex, memuat ulang server
MCP, dan memverifikasi bahwa server MCP mengekspos tool. Karena instalasi
mengubah resource host tepercaya, hanya pemilik atau klien Gateway
`operator.admin` yang dapat menjalankan `install`. Pengirim lain yang
terotorisasi dapat terus menggunakan perintah `status` yang hanya baca, termasuk
dengan override.

## Pilihan marketplace

OpenClaw menggunakan API app-server yang sama dengan yang diekspos Codex.
Bidang marketplace memilih di mana Codex harus menemukan `computer-use`.

| Bidang               | Gunakan ketika                                                  | Dukungan instalasi                                      |
| -------------------- | --------------------------------------------------------------- | ------------------------------------------------------- |
| Tanpa bidang marketplace | Anda ingin app-server Codex menggunakan marketplace yang sudah diketahuinya. | Ya, ketika app-server mengembalikan marketplace lokal. |
| `marketplaceSource`  | Anda memiliki sumber marketplace Codex yang dapat ditambahkan app-server. | Ya, untuk `/codex computer-use install` eksplisit. |
| `marketplacePath`    | Anda sudah mengetahui jalur file marketplace lokal pada host.   | Ya, untuk instalasi eksplisit dan instalasi otomatis saat giliran dimulai. |
| `marketplaceName`    | Anda ingin memilih satu marketplace yang sudah terdaftar berdasarkan nama. | Ya hanya ketika marketplace yang dipilih memiliki jalur lokal. |

Home Codex baru mungkin perlu sesaat untuk menyemai marketplace resminya. Selama
instalasi, OpenClaw melakukan polling `plugin/list` hingga
`marketplaceDiscoveryTimeoutMs` milidetik. Default-nya adalah 60 detik.

Jika beberapa marketplace yang diketahui berisi Computer Use, OpenClaw memilih
`openai-bundled`, lalu `openai-curated`, lalu `local`. Kecocokan ambigu yang
tidak dikenal gagal tertutup dan meminta Anda mengatur `marketplaceName` atau
`marketplacePath`.

## Marketplace macOS bawaan

Build desktop Codex terbaru membundel Computer Use di sini:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

Ketika `computerUse.autoInstall` bernilai true dan tidak ada marketplace yang
berisi `computer-use` terdaftar, OpenClaw mencoba menambahkan root marketplace
bawaan standar secara otomatis:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Anda juga dapat mendaftarkannya secara eksplisit dari shell dengan Codex:

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Jika Anda menggunakan jalur aplikasi Codex nonstandar, jalankan `/codex
computer-use install --source <marketplace-root>` sekali atau atur
`computerUse.marketplacePath` ke jalur file marketplace lokal. Gunakan
`--marketplace-path` hanya ketika Anda memiliki jalur file JSON marketplace,
bukan root marketplace bawaan.

## Batas katalog jarak jauh

App-server Codex dapat mencantumkan dan membaca entri katalog yang hanya jarak
jauh, tetapi saat ini tidak mendukung `plugin/install` jarak jauh. Itu berarti
`marketplaceName` dapat memilih marketplace yang hanya jarak jauh untuk
pemeriksaan status, tetapi instalasi dan pengaktifan ulang tetap memerlukan
marketplace lokal melalui `marketplaceSource` atau `marketplacePath`.

Jika status mengatakan Plugin tersedia di marketplace Codex jarak jauh tetapi
instalasi jarak jauh tidak didukung, jalankan instalasi dengan sumber atau jalur
lokal:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Referensi konfigurasi

| Bidang                          | Default        | Arti                                                                           |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | inferred       | Wajibkan Computer Use. Default ke true ketika bidang Computer Use lain diatur. |
| `autoInstall`                   | false          | Instal atau aktifkan kembali dari marketplace yang sudah ditemukan saat giliran dimulai. |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Berapa lama instalasi menunggu penemuan marketplace app-server Codex.          |
| `marketplaceSource`             | unset          | String sumber yang diteruskan ke `marketplace/add` app-server Codex.           |
| `marketplacePath`               | unset          | Jalur file marketplace Codex lokal yang berisi Plugin.                         |
| `marketplaceName`               | unset          | Nama marketplace Codex terdaftar yang akan dipilih.                            |
| `pluginName`                    | `computer-use` | Nama Plugin marketplace Codex.                                                 |
| `mcpServerName`                 | `computer-use` | Nama server MCP yang diekspos oleh Plugin terinstal.                           |

Instalasi otomatis saat giliran dimulai sengaja menolak nilai
`marketplaceSource` yang dikonfigurasi. Menambahkan sumber baru adalah operasi
penyiapan eksplisit, jadi gunakan `/codex computer-use install --source
<marketplace-source>` sekali, lalu biarkan `autoInstall` menangani pengaktifan
ulang berikutnya dari marketplace lokal yang ditemukan. Instalasi otomatis saat
giliran dimulai dapat menggunakan `marketplacePath` yang dikonfigurasi, karena
itu sudah merupakan jalur lokal pada host.

## Yang diperiksa OpenClaw

OpenClaw melaporkan alasan penyiapan yang stabil secara internal dan memformat
status yang terlihat pengguna untuk chat:

| Alasan                       | Makna                                                  | Langkah berikutnya                            |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` diselesaikan menjadi false.      | Atur `enabled` atau kolom Computer Use lain.  |
| `marketplace_missing`        | Tidak ada marketplace yang cocok tersedia.             | Konfigurasi sumber, path, atau nama marketplace. |
| `plugin_not_installed`       | Marketplace ada, tetapi plugin belum terinstal.        | Jalankan install atau aktifkan `autoInstall`. |
| `plugin_disabled`            | Plugin terinstal tetapi dinonaktifkan di konfigurasi Codex. | Jalankan install untuk mengaktifkannya kembali. |
| `remote_install_unsupported` | Marketplace yang dipilih hanya remote.                 | Gunakan `marketplaceSource` atau `marketplacePath`. |
| `mcp_missing`                | Plugin aktif, tetapi server MCP tidak tersedia.        | Periksa Computer Use Codex dan izin OS.       |
| `ready`                      | Plugin dan alat MCP tersedia.                          | Mulai giliran mode Codex.                     |
| `check_failed`               | Permintaan app-server Codex gagal saat pemeriksaan status. | Periksa konektivitas dan log app-server.      |
| `auto_install_blocked`       | Penyiapan awal giliran perlu menambahkan sumber baru.  | Jalankan install eksplisit terlebih dahulu.   |

Output chat menyertakan status plugin, status server MCP, marketplace, alat
jika tersedia, dan pesan spesifik untuk langkah penyiapan yang gagal.

## Izin macOS

Computer Use bersifat khusus macOS. Server MCP milik Codex mungkin memerlukan
izin OS lokal sebelum dapat memeriksa atau mengontrol aplikasi. Jika OpenClaw
menyatakan Computer Use terinstal tetapi server MCP tidak tersedia, verifikasi
penyiapan Computer Use di sisi Codex terlebih dahulu:

- app-server Codex berjalan pada host yang sama tempat kontrol desktop seharusnya
  terjadi.
- Plugin Computer Use diaktifkan di konfigurasi Codex.
- Server MCP `computer-use` muncul di status MCP app-server Codex.
- macOS telah memberikan izin yang diperlukan untuk aplikasi kontrol desktop.
- Sesi host saat ini dapat mengakses desktop yang dikontrol.

OpenClaw sengaja gagal tertutup ketika `computerUse.enabled` bernilai true.
Giliran mode Codex tidak boleh lanjut diam-diam tanpa alat desktop native
yang diwajibkan konfigurasi.

## Pemecahan masalah

**Status menyatakan belum terinstal.** Jalankan `/codex computer-use install`. Jika
marketplace tidak ditemukan, berikan `--source` atau `--marketplace-path`.

**Status menyatakan terinstal tetapi dinonaktifkan.** Jalankan `/codex computer-use install` lagi.
Install app-server Codex menulis konfigurasi plugin kembali menjadi aktif.

**Status menyatakan install remote tidak didukung.** Gunakan sumber atau
path marketplace lokal. Entri katalog yang hanya remote dapat diperiksa tetapi tidak
diinstal melalui API app-server saat ini.

**Status menyatakan server MCP tidak tersedia.** Jalankan ulang install sekali agar server
MCP dimuat ulang. Jika tetap tidak tersedia, perbaiki aplikasi Computer Use Codex,
status MCP app-server Codex, atau izin macOS.

**Status atau probe kehabisan waktu pada `computer-use.list_apps`.** Plugin dan server MCP
ada, tetapi bridge Computer Use lokal tidak menjawab. Tutup atau mulai ulang
Computer Use Codex, luncurkan ulang Codex Desktop jika perlu, lalu coba lagi dalam
sesi OpenClaw baru. Jika host sebelumnya menjalankan Computer Use melalui app-server
Codex terkelola yang lebih lama, segarkan plugin yang terinstal dari marketplace
bundled desktop:

```text
/codex computer-use install --source /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

**Alat Computer Use menyatakan `Native hook relay unavailable`.** Hook alat native Codex
tidak dapat menjangkau relay OpenClaw aktif melalui bridge lokal atau fallback
Gateway. Mulai sesi OpenClaw baru dengan `/new` atau `/reset`. Jika berhasil
sekali lalu gagal lagi pada panggilan alat berikutnya, `/new` hanya membersihkan
percobaan saat ini; mulai ulang app-server Codex atau Gateway OpenClaw agar thread
lama dan pendaftaran hook dibuang, lalu coba lagi dalam sesi baru.

**Auto-install awal giliran menolak sumber.** Ini disengaja. Tambahkan
sumber dengan `/codex computer-use install --source <marketplace-source>` eksplisit
terlebih dahulu, lalu auto-install awal giliran berikutnya dapat menggunakan
marketplace lokal yang ditemukan.

## Terkait

- [Harness Codex](/id/plugins/codex-harness)
- [Bridge Peekaboo](/id/platforms/mac/peekaboo)
- [Aplikasi iOS](/id/platforms/ios)
