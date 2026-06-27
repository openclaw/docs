---
read_when:
    - Anda ingin agen OpenClaw mode Codex menggunakan Codex Computer Use
    - Anda sedang memilih antara Codex Computer Use, PeekabooBridge, dan MCP cua-driver langsung
    - Anda sedang memilih antara Codex Computer Use dan penyiapan MCP cua-driver langsung
    - Anda sedang mengonfigurasi computerUse untuk plugin Codex bawaan
    - Anda sedang memecahkan masalah status atau pemasangan /codex computer-use
summary: Siapkan Codex Computer Use untuk agen OpenClaw mode Codex
title: Penggunaan Komputer Codex
x-i18n:
    generated_at: "2026-06-27T17:44:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6a595b8ae261c1cc9a1469217a31279cd3a116b0f11c16813ea018aab76b8c0d
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use adalah Plugin MCP native Codex untuk kontrol desktop lokal. OpenClaw
tidak mem-vendor aplikasi desktop, mengeksekusi tindakan desktop sendiri, atau melewati
izin Codex. Plugin `codex` bawaan hanya menyiapkan Codex app-server:
Plugin ini mengaktifkan dukungan Plugin Codex, menemukan atau menginstal Plugin
Codex Computer Use yang dikonfigurasi, memeriksa bahwa server MCP `computer-use` tersedia, dan
kemudian membiarkan Codex memiliki panggilan alat MCP native selama giliran mode Codex.

Gunakan halaman ini ketika OpenClaw sudah menggunakan harness Codex native. Untuk
penyiapan runtime itu sendiri, lihat [harness Codex](/id/plugins/codex-harness).

## OpenClaw.app dan Peekaboo

Integrasi Peekaboo milik OpenClaw.app terpisah dari Codex Computer Use. Aplikasi
macOS dapat menghosting soket PeekabooBridge sehingga CLI `peekaboo` dapat menggunakan kembali
izin Accessibility dan Screen Recording lokal aplikasi untuk alat otomasi
Peekaboo sendiri. Bridge itu tidak menginstal atau mem-proxy Codex Computer Use, dan
Codex Computer Use tidak memanggil melalui soket PeekabooBridge.

Gunakan [bridge Peekaboo](/id/platforms/mac/peekaboo) ketika Anda ingin OpenClaw.app menjadi
host yang sadar izin untuk otomasi CLI Peekaboo. Gunakan halaman ini ketika agen
OpenClaw mode Codex harus memiliki Plugin MCP `computer-use` native Codex
tersedia sebelum giliran dimulai.

## Aplikasi iOS

Aplikasi iOS terpisah dari Codex Computer Use. Aplikasi ini tidak menginstal atau mem-proxy
server MCP `computer-use` Codex dan bukan backend kontrol desktop.
Sebaliknya, aplikasi iOS terhubung sebagai node OpenClaw dan mengekspos kapabilitas
seluler melalui perintah node seperti `canvas.*`, `camera.*`, `screen.*`,
`location.*`, dan `talk.*`.

Gunakan [iOS](/id/platforms/ios) ketika Anda ingin agen mengendalikan node iPhone melalui
Gateway. Gunakan halaman ini ketika agen mode Codex harus mengontrol desktop
macOS lokal melalui Plugin Computer Use native Codex.

## MCP cua-driver langsung

Codex Computer Use bukan satu-satunya cara untuk mengekspos kontrol desktop. Jika Anda ingin
runtime yang dikelola OpenClaw memanggil driver TryCua secara langsung, gunakan server
`cua-driver mcp` upstream melalui registri MCP OpenClaw alih-alih alur marketplace
khusus Codex.

Setelah menginstal `cua-driver`, minta perintah OpenClaw darinya:

```bash
cua-driver mcp-config --client openclaw
```

atau daftarkan sendiri server stdio:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Jalur itu menjaga permukaan alat MCP upstream tetap utuh, termasuk skema driver
dan respons MCP terstruktur. Gunakan ketika Anda ingin driver CUA
tersedia sebagai server MCP OpenClaw normal. Gunakan penyiapan Codex Computer Use di
halaman ini ketika Codex app-server harus memiliki instalasi Plugin, pemuatan ulang MCP,
dan panggilan alat native di dalam giliran mode Codex.

Driver CUA khusus macOS dan tetap memerlukan izin macOS lokal
yang diminta aplikasinya, seperti Accessibility dan Screen Recording. OpenClaw
tidak menginstal `cua-driver`, memberikan izin tersebut, atau melewati model keselamatan
driver upstream.

## Penyiapan cepat

Atur `plugins.entries.codex.config.computerUse` ketika giliran mode Codex harus memiliki
Computer Use tersedia sebelum thread dimulai. `autoInstall: true` mengikutsertakan
Computer Use dan membiarkan OpenClaw menginstal atau mengaktifkannya kembali sebelum giliran:

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

Dengan konfigurasi ini, OpenClaw memeriksa Codex app-server sebelum setiap giliran mode Codex.
Jika Computer Use tidak ada tetapi Codex app-server sudah menemukan marketplace yang
dapat diinstal, OpenClaw meminta Codex app-server untuk menginstal atau mengaktifkan kembali
Plugin dan memuat ulang server MCP. Di macOS, ketika tidak ada marketplace yang cocok
terdaftar dan bundle aplikasi Codex standar ada, OpenClaw juga mencoba
mendaftarkan marketplace Codex bawaan dari
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` sebelum
gagal. Jika penyiapan masih tidak dapat membuat server MCP tersedia, giliran gagal
sebelum thread dimulai.

Setelah mengubah konfigurasi Computer Use, gunakan `/new` atau `/reset` di chat yang terdampak
sebelum menguji jika thread Codex yang ada sudah dimulai.

Pada startup stdio terkelola di macOS, OpenClaw lebih memilih bundle aplikasi Codex desktop
bertanda tangan di `/Applications/Codex.app/Contents/Resources/codex` ketika ada.
Itu menjaga Computer Use berada di bawah bundle aplikasi yang memiliki izin kontrol desktop
lokal. Jika aplikasi desktop tidak terinstal, OpenClaw beralih ke binary Codex
terkelola yang diinstal di samping Plugin. Jika aplikasi desktop yang terinstal
diinisialisasi dengan versi app-server yang tidak didukung, OpenClaw menutup child tersebut
dan mencoba ulang kandidat binary terkelola berikutnya alih-alih membiarkan aplikasi
desktop usang membayangi fallback lokal Plugin. Konfigurasi `appServer.command`
eksplisit atau `OPENCLAW_CODEX_APP_SERVER_BIN` tetap mengesampingkan pemilihan terkelola ini.

## Perintah

Gunakan perintah `/codex computer-use` dari permukaan chat mana pun tempat permukaan perintah Plugin
`codex` tersedia. Ini adalah perintah chat/runtime OpenClaw,
bukan subperintah CLI `openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` bersifat hanya baca. Itu tidak menambahkan sumber marketplace, menginstal Plugin, atau
mengaktifkan dukungan Plugin Codex. Jika tidak ada konfigurasi yang mengikutsertakan Computer Use, `status` dapat
melaporkan nonaktif bahkan setelah perintah instalasi sekali pakai.

`install` mengaktifkan dukungan Plugin Codex app-server, secara opsional menambahkan sumber
marketplace yang dikonfigurasi, menginstal atau mengaktifkan kembali Plugin yang dikonfigurasi melalui Codex
app-server, memuat ulang server MCP, dan memverifikasi bahwa server MCP mengekspos alat.

## Pilihan marketplace

OpenClaw menggunakan API app-server yang sama yang diekspos Codex sendiri. Bidang
marketplace memilih tempat Codex harus menemukan `computer-use`.

| Bidang               | Gunakan ketika                                                   | Dukungan instalasi                                      |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| Tidak ada bidang marketplace | Anda ingin Codex app-server menggunakan marketplace yang sudah diketahuinya. | Ya, ketika app-server mengembalikan marketplace lokal. |
| `marketplaceSource`  | Anda memiliki sumber marketplace Codex yang dapat ditambahkan app-server. | Ya, untuk `/codex computer-use install` eksplisit. |
| `marketplacePath`    | Anda sudah mengetahui path file marketplace lokal pada host.    | Ya, untuk instalasi eksplisit dan instalasi otomatis saat awal giliran. |
| `marketplaceName`    | Anda ingin memilih satu marketplace yang sudah terdaftar berdasarkan nama. | Ya hanya ketika marketplace yang dipilih memiliki path lokal. |

Home Codex baru mungkin memerlukan waktu singkat untuk menyemai marketplace resmi mereka.
Selama instalasi, OpenClaw melakukan polling `plugin/list` hingga
`marketplaceDiscoveryTimeoutMs` milidetik. Defaultnya adalah 60 detik.

Jika beberapa marketplace yang diketahui berisi Computer Use, OpenClaw lebih memilih
`openai-bundled`, lalu `openai-curated`, lalu `local`. Kecocokan ambigu yang tidak diketahui
gagal tertutup dan meminta Anda mengatur `marketplaceName` atau `marketplacePath`.

## Marketplace macOS bawaan

Build desktop Codex terbaru membundel Computer Use di sini:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

Ketika `computerUse.autoInstall` bernilai true dan tidak ada marketplace berisi
`computer-use` yang terdaftar, OpenClaw mencoba menambahkan root marketplace bawaan
standar secara otomatis:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Anda juga dapat mendaftarkannya secara eksplisit dari shell dengan Codex:

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Jika Anda menggunakan path aplikasi Codex nonstandar, jalankan `/codex computer-use install
--source <marketplace-root>` sekali atau atur `computerUse.marketplacePath` ke
path file marketplace lokal. Gunakan `--marketplace-path` hanya ketika Anda memiliki
path file JSON marketplace, bukan root marketplace bawaan.

## Batas katalog jarak jauh

Codex app-server dapat mencantumkan dan membaca entri katalog khusus jarak jauh, tetapi saat ini tidak
mendukung `plugin/install` jarak jauh. Itu berarti `marketplaceName` dapat
memilih marketplace khusus jarak jauh untuk pemeriksaan status, tetapi instalasi dan pengaktifan ulang
tetap memerlukan marketplace lokal melalui `marketplaceSource` atau `marketplacePath`.

Jika status mengatakan Plugin tersedia di marketplace Codex jarak jauh tetapi instalasi
jarak jauh tidak didukung, jalankan instalasi dengan sumber atau path lokal:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Referensi konfigurasi

| Bidang                          | Default        | Arti                                                                           |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | disimpulkan    | Wajibkan Computer Use. Defaultnya true ketika bidang Computer Use lain diatur. |
| `autoInstall`                   | false          | Instal atau aktifkan kembali dari marketplace yang sudah ditemukan saat awal giliran. |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Berapa lama instalasi menunggu penemuan marketplace Codex app-server.          |
| `marketplaceSource`             | tidak diatur   | String sumber yang diteruskan ke `marketplace/add` Codex app-server.           |
| `marketplacePath`               | tidak diatur   | Path file marketplace Codex lokal yang berisi Plugin.                          |
| `marketplaceName`               | tidak diatur   | Nama marketplace Codex terdaftar yang akan dipilih.                            |
| `pluginName`                    | `computer-use` | Nama Plugin marketplace Codex.                                                 |
| `mcpServerName`                 | `computer-use` | Nama server MCP yang diekspos oleh Plugin yang terinstal.                      |

Instalasi otomatis saat awal giliran sengaja menolak nilai `marketplaceSource`
yang dikonfigurasi. Menambahkan sumber baru adalah operasi penyiapan eksplisit, jadi gunakan
`/codex computer-use install --source <marketplace-source>` sekali, lalu biarkan
`autoInstall` menangani pengaktifan ulang di masa mendatang dari marketplace lokal yang ditemukan.
Instalasi otomatis saat awal giliran dapat menggunakan `marketplacePath` yang dikonfigurasi, karena itu
sudah merupakan path lokal pada host.

## Yang diperiksa OpenClaw

OpenClaw melaporkan alasan penyiapan yang stabil secara internal dan memformat status yang terlihat pengguna
untuk chat:

| Alasan                       | Arti                                                   | Langkah berikutnya                            |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` terselesaikan menjadi false.     | Atur `enabled` atau kolom Computer Use lain.  |
| `marketplace_missing`        | Tidak ada marketplace yang cocok tersedia.             | Konfigurasikan sumber, jalur, atau nama marketplace. |
| `plugin_not_installed`       | Marketplace ada, tetapi plugin belum terpasang.        | Jalankan instalasi atau aktifkan `autoInstall`. |
| `plugin_disabled`            | Plugin terpasang tetapi dinonaktifkan di konfigurasi Codex. | Jalankan instalasi untuk mengaktifkannya kembali. |
| `remote_install_unsupported` | Marketplace yang dipilih hanya jarak jauh.             | Gunakan `marketplaceSource` atau `marketplacePath`. |
| `mcp_missing`                | Plugin diaktifkan, tetapi server MCP tidak tersedia.   | Periksa Computer Use Codex dan izin OS.       |
| `ready`                      | Plugin dan alat MCP tersedia.                          | Mulai giliran mode Codex.                     |
| `check_failed`               | Permintaan app-server Codex gagal saat pemeriksaan status. | Periksa konektivitas dan log app-server.      |
| `auto_install_blocked`       | Penyiapan awal giliran perlu menambahkan sumber baru.  | Jalankan instalasi eksplisit terlebih dahulu. |

Output chat menyertakan status plugin, status server MCP, marketplace, alat
jika tersedia, dan pesan spesifik untuk langkah penyiapan yang gagal.

## Izin macOS

Computer Use khusus untuk macOS. Server MCP milik Codex mungkin memerlukan izin
OS lokal sebelum dapat memeriksa atau mengontrol aplikasi. Jika OpenClaw mengatakan Computer Use
terpasang tetapi server MCP tidak tersedia, verifikasi penyiapan Computer Use
di sisi Codex terlebih dahulu:

- App-server Codex berjalan pada host yang sama tempat kontrol desktop seharusnya
  terjadi.
- Plugin Computer Use diaktifkan di konfigurasi Codex.
- Server MCP `computer-use` muncul dalam status MCP app-server Codex.
- macOS telah memberikan izin yang diperlukan untuk aplikasi kontrol desktop.
- Sesi host saat ini dapat mengakses desktop yang dikontrol.

OpenClaw sengaja gagal tertutup ketika `computerUse.enabled` bernilai true. Sebuah
giliran mode Codex tidak boleh diam-diam berlanjut tanpa alat desktop native
yang diwajibkan oleh konfigurasi.

## Pemecahan masalah

**Status mengatakan belum terpasang.** Jalankan `/codex computer-use install`. Jika
marketplace tidak ditemukan, teruskan `--source` atau `--marketplace-path`.

**Status mengatakan terpasang tetapi dinonaktifkan.** Jalankan `/codex computer-use install` lagi.
Instalasi app-server Codex menulis konfigurasi plugin kembali menjadi aktif.

**Status mengatakan instalasi jarak jauh tidak didukung.** Gunakan sumber atau
jalur marketplace lokal. Entri katalog yang hanya jarak jauh dapat diperiksa tetapi tidak dipasang melalui
API app-server saat ini.

**Status mengatakan server MCP tidak tersedia.** Jalankan ulang instalasi sekali agar server
MCP dimuat ulang. Jika tetap tidak tersedia, perbaiki aplikasi Computer Use Codex,
status MCP app-server Codex, atau izin macOS.

**Status atau probe mengalami timeout pada `computer-use.list_apps`.** Plugin dan server MCP
ada, tetapi bridge Computer Use lokal tidak menjawab. Keluar atau
mulai ulang Codex Computer Use, luncurkan ulang Codex Desktop jika diperlukan, lalu coba lagi dalam
sesi OpenClaw baru. Jika host sebelumnya menjalankan Computer Use melalui app-server Codex
terkelola yang lebih lama, segarkan plugin yang terpasang dari marketplace bundel desktop:

```text
/codex computer-use install --source /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

**Alat Computer Use mengatakan `Native hook relay unavailable`.** Hook alat native Codex
tidak dapat menjangkau relay OpenClaw aktif melalui bridge lokal atau fallback
Gateway. Mulai sesi OpenClaw baru dengan `/new` atau `/reset`. Jika berhasil
sekali lalu gagal lagi pada pemanggilan alat berikutnya, `/new` hanya membersihkan
percobaan saat ini; mulai ulang app-server Codex atau Gateway OpenClaw agar thread lama
dan pendaftaran hook dibuang, lalu coba lagi dalam sesi baru.

**Instalasi otomatis awal giliran menolak sumber.** Ini disengaja. Tambahkan
sumber dengan `/codex computer-use install --source <marketplace-source>` eksplisit
terlebih dahulu, lalu instalasi otomatis awal giliran berikutnya dapat menggunakan marketplace lokal
yang ditemukan.

## Terkait

- [Harness Codex](/id/plugins/codex-harness)
- [Bridge Peekaboo](/id/platforms/mac/peekaboo)
- [Aplikasi iOS](/id/platforms/ios)
