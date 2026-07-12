---
read_when:
    - Anda ingin agen OpenClaw dalam mode Codex menggunakan Codex Computer Use
    - Anda sedang memilih antara Codex Computer Use, PeekabooBridge, dan MCP cua-driver langsung
    - Anda sedang mengonfigurasi computerUse untuk plugin Codex bawaan
    - Anda sedang memecahkan masalah status atau instalasi penggunaan komputer /codex
summary: Siapkan Codex Computer Use untuk agen OpenClaw dalam mode Codex
title: Penggunaan Komputer Codex
x-i18n:
    generated_at: "2026-07-12T14:22:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a55ee330c4952c8bcc97c3178a85a67ea3b7964e6880277bd41d2bfc750e3138
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use adalah Plugin MCP bawaan Codex untuk mengendalikan desktop lokal. OpenClaw
tidak membundel aplikasi desktop tersebut, menjalankan tindakan desktop sendiri, atau melewati
izin Codex. Plugin `codex` yang disertakan hanya menyiapkan Codex app-server:
plugin ini mengaktifkan dukungan Plugin Codex, menemukan atau menginstal Plugin Computer Use
yang dikonfigurasi, memeriksa bahwa server MCP `computer-use` tersedia, lalu membiarkan
Codex menangani pemanggilan alat MCP native selama giliran mode Codex.

Gunakan halaman ini jika OpenClaw sudah menggunakan harness Codex native. Untuk
penyiapan runtime itu sendiri, lihat [harness Codex](/id/plugins/codex-harness).

Ini berbeda dari [alat komputer berbasis node](/id/nodes/computer-use) bawaan OpenClaw. Gunakan alat bawaan ketika kontrak agen yang sama harus mengendalikan Mac yang dipasangkan, baik agen berjalan di Gateway maupun di node lain. Gunakan Codex Computer Use ketika Codex app-server harus menangani instalasi MCP lokal, izin, dan pemanggilan alat native.

## OpenClaw.app dan Peekaboo

Integrasi Peekaboo milik OpenClaw.app terpisah dari Codex Computer Use.
Aplikasi macOS dapat menghosting soket PeekabooBridge sehingga CLI `peekaboo` dapat menggunakan kembali
izin Accessibility dan Screen Recording lokal milik aplikasi untuk alat
otomasi Peekaboo sendiri. Bridge tersebut tidak menginstal atau mem-proxy Codex Computer Use, dan
Codex Computer Use tidak melakukan pemanggilan melalui soket PeekabooBridge.

Gunakan [bridge Peekaboo](/id/platforms/mac/peekaboo) ketika Anda ingin OpenClaw.app menjadi
host yang memperhitungkan izin untuk otomasi CLI Peekaboo. Gunakan halaman ini ketika
agen OpenClaw mode Codex harus memiliki Plugin MCP `computer-use` native milik Codex
yang tersedia sebelum giliran dimulai.

## Aplikasi iOS

Aplikasi iOS terpisah dari Codex Computer Use. Aplikasi ini tidak menginstal atau mem-proxy
server MCP `computer-use` Codex dan bukan backend pengendalian desktop.
Sebaliknya, aplikasi iOS terhubung sebagai node OpenClaw dan menyediakan kapabilitas
perangkat seluler melalui perintah node seperti `canvas.*`, `camera.*`, `screen.*`,
`location.*`, dan `talk.*`.

Gunakan [iOS](/id/platforms/ios) ketika Anda ingin agen mengendalikan node iPhone
melalui Gateway. Gunakan halaman ini ketika agen mode Codex harus mengendalikan
desktop macOS lokal melalui Plugin Computer Use native milik Codex.

## MCP cua-driver langsung

Codex Computer Use bukan satu-satunya cara untuk menyediakan pengendalian desktop. Jika Anda ingin
runtime yang dikelola OpenClaw memanggil driver TryCua secara langsung, gunakan server upstream
`cua-driver mcp` melalui registri MCP OpenClaw, bukan melalui
alur marketplace khusus Codex.

Setelah menginstal `cua-driver`, minta perintah OpenClaw darinya:

```bash
cua-driver mcp-config --client openclaw
```

atau daftarkan server stdio secara langsung:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Jalur tersebut mempertahankan seluruh permukaan alat MCP upstream, termasuk skema driver
dan respons MCP terstruktur. Gunakan jalur tersebut ketika Anda ingin driver CUA
tersedia sebagai server MCP OpenClaw biasa. Gunakan penyiapan Codex Computer Use di
halaman ini ketika Codex app-server harus menangani instalasi Plugin, pemuatan ulang MCP,
dan pemanggilan alat native di dalam giliran mode Codex.

Driver CUA khusus untuk macOS dan tetap memerlukan izin macOS lokal
yang diminta oleh aplikasinya, seperti Accessibility dan Screen Recording. OpenClaw tidak
menginstal `cua-driver`, memberikan izin tersebut, atau melewati
model keamanan driver upstream.

## Penyiapan cepat

Atur `plugins.entries.codex.config.computerUse` ketika giliran mode Codex harus menyediakan
Computer Use sebelum sebuah utas dimulai. `autoInstall: true` mengikutsertakan
Computer Use dan memungkinkan OpenClaw menginstal atau mengaktifkannya kembali sebelum giliran:

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
      model: "openai/gpt-5.6-sol",
    },
  },
}
```

Dengan konfigurasi ini, OpenClaw memeriksa Codex app-server sebelum setiap
giliran mode Codex. Jika Computer Use tidak tersedia tetapi Codex app-server telah menemukan
marketplace yang dapat diinstal, OpenClaw meminta Codex app-server untuk menginstal atau
mengaktifkan kembali Plugin tersebut dan memuat ulang server MCP. Di macOS, ketika tidak ada
marketplace yang cocok yang terdaftar dan terdapat bundel aplikasi desktop standar, OpenClaw
juga mencoba mendaftarkan marketplace Codex yang disertakan dari
`/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled`, dengan
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` tetap
digunakan sebagai fallback untuk instalasi mandiri lama. Jika penyiapan tetap tidak dapat membuat
server MCP tersedia, giliran akan gagal sebelum utas dimulai.

Setelah mengubah konfigurasi Computer Use, gunakan `/new` atau `/reset` di percakapan
yang terdampak sebelum melakukan pengujian jika utas Codex yang ada sudah dimulai.

Di macOS, proses mulai terkelola untuk Computer Use memprioritaskan biner aplikasi desktop di
`/Applications/ChatGPT.app/Contents/Resources/codex`, lalu menggunakan
`/Applications/Codex.app/Contents/Resources/codex` sebagai fallback untuk instalasi
mandiri lama. Hal ini juga berlaku untuk perintah status dan instalasi Computer Use
sekali jalan yang memulai kliennya sendiri. Dengan demikian, pengendalian desktop tetap berada di bawah
bundel aplikasi yang memiliki izin macOS lokal. Jika aplikasi desktop tidak
terinstal, OpenClaw menggunakan biner Codex terkelola yang diinstal bersama
Plugin sebagai fallback. Giliran Codex terkelola biasa dengan home agen terisolasi bawaan memprioritaskan
paket yang dipatok tersebut agar aplikasi desktop lama tidak membayangi dukungan model
terkini. Home dalam cakupan pengguna tetap memprioritaskan desktop karena dapat memuat status native
Computer Use. Home agen terisolasi yang konfigurasi efektif Codex-nya mengaktifkan
Computer Use juga tetap memprioritaskan desktop. Konfigurasi eksplisit
`appServer.command` atau `OPENCLAW_CODEX_APP_SERVER_BIN` tetap mengesampingkan
pemilihan terkelola ini.

OpenClaw menserialkan pembacaan konfigurasi native Codex dan instalasi Computer Use
di dalam satu Gateway yang berjalan. Proses Codex terpisah atau Gateway lain tidak
termasuk dalam pembatas tersebut. Setelah mengubah konfigurasi Plugin native Codex di luar
Gateway, mulai ulang Gateway dan mulai percakapan baru sebelum mengandalkan
pemilihan baru tersebut.

## Perintah

Gunakan perintah `/codex computer-use` dari permukaan percakapan mana pun yang
menyediakan permukaan perintah Plugin `codex`. Ini adalah perintah percakapan/runtime
OpenClaw, bukan subperintah CLI `openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` adalah tindakan bawaan dan hanya-baca: tindakan ini tidak menambahkan sumber marketplace,
menginstal Plugin, atau mengaktifkan dukungan Plugin Codex. Jika tidak ada konfigurasi yang
mengikutsertakan Computer Use, `status` dapat melaporkan status nonaktif bahkan setelah perintah
instalasi sekali jalan.

`install` mengaktifkan dukungan Plugin Codex app-server, secara opsional menambahkan
sumber marketplace yang dikonfigurasi, menginstal atau mengaktifkan kembali Plugin yang dikonfigurasi
melalui Codex app-server, memuat ulang server MCP, dan memverifikasi bahwa server MCP
menyediakan alat. Karena instalasi mengubah sumber daya host tepercaya,
hanya pemilik atau klien Gateway `operator.admin` yang dapat menjalankan `install`. Pengirim
resmi lainnya tetap dapat menggunakan perintah `status` yang hanya-baca,
termasuk dengan pengesampingan.

Rilis lama menerima pengesampingan identitas sekali jalan `--plugin`, `--server`, dan
`--mcp-server`. Sebagai gantinya, konfigurasikan `computerUse.pluginName` dan
`computerUse.mcpServerName` secara persisten. Ketika flag identitas lama
digunakan, perintah tersebut mengidentifikasi pengaturan yang tepat untuk dipersistenkan dan mengulangi
tindakan yang diminta beserta setiap flag marketplace yang didukung dalam panduan migrasinya.

## Pilihan marketplace

OpenClaw menggunakan API app-server yang sama dengan yang disediakan Codex. Kolom
marketplace menentukan tempat Codex harus menemukan `computer-use`.

| Kolom                | Gunakan ketika                                                        | Dukungan instalasi                                          |
| -------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------- |
| Tanpa kolom marketplace | Anda ingin Codex app-server menggunakan marketplace yang sudah dikenalnya. | Ya, ketika app-server mengembalikan marketplace lokal.      |
| `marketplaceSource`  | Anda memiliki sumber marketplace Codex yang dapat ditambahkan app-server. | Ya, untuk `/codex computer-use install` eksplisit.          |
| `marketplacePath`    | Anda sudah mengetahui jalur file marketplace lokal pada host.         | Ya, untuk instalasi eksplisit dan instalasi otomatis saat giliran dimulai. |
| `marketplaceName`    | Anda ingin memilih marketplace yang sudah terdaftar berdasarkan nama. | Ya, hanya jika marketplace yang dipilih memiliki jalur lokal. |

Home Codex baru mungkin memerlukan waktu singkat untuk menginisialisasi marketplace
resminya. Selama instalasi, OpenClaw melakukan polling `plugin/list` hingga
`marketplaceDiscoveryTimeoutMs` milidetik (bawaan 60 detik).

Jika beberapa marketplace yang diketahui berisi Computer Use, OpenClaw memprioritaskan
`openai-bundled`, lalu `openai-curated`, kemudian `local`. Kecocokan ambigu yang
tidak dikenal akan gagal secara tertutup dan meminta Anda mengatur `marketplaceName` atau
`marketplacePath`.

## Marketplace macOS yang disertakan

Build desktop ChatGPT saat ini menyertakan Computer Use di lokasi berikut; build desktop
Codex mandiri lama menggunakan tata letak yang sama di bawah `Codex.app`:

```text
/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

Ketika `computerUse.autoInstall` bernilai true dan tidak ada marketplace yang berisi
`computer-use` terdaftar, OpenClaw mencoba menambahkan root marketplace standar
yang disertakan dan ditemukan pertama kali:

```text
/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Anda juga dapat mendaftarkannya secara eksplisit dari shell dengan Codex:

```bash
codex plugin marketplace add /Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
```

Jika Anda menggunakan jalur aplikasi Codex nonstandar, jalankan `/codex computer-use install
--source <marketplace-root>` sekali, atau atur `computerUse.marketplacePath` ke
jalur file marketplace lokal. Gunakan `--marketplace-path` hanya jika Anda memiliki
jalur file JSON marketplace, bukan root marketplace yang disertakan.

### Cache Plugin bersama

`pluginCacheMode: "independent"` bawaan membiarkan setiap home Codex dan
cache Plugin-nya tidak dikelola. Atur `pluginCacheMode: "shared"` untuk menyalin
Plugin Computer Use yang disertakan ke cache Plugin yang dapat ditemukan oleh home Codex aktif
sebelum Codex app-server dimulai. Mode bersama mempertahankan versi cache yang lebih lama karena
klien Codex yang sedang berjalan mungkin masih merujuk direktori Plugin berversi tersebut; kegagalan
penyalinan pengganti juga mempertahankan cache aktif. Konfigurasi eksplisit
`marketplaceName` atau `marketplacePath` menonaktifkan rekonsiliasi ini
agar OpenClaw tidak mengesampingkan pemilihan tersebut.

## Batas katalog jarak jauh

Codex app-server dapat mencantumkan dan membaca entri katalog yang hanya tersedia dari jarak jauh, tetapi
saat ini tidak mendukung `plugin/install` jarak jauh. Artinya, `marketplaceName`
dapat memilih marketplace yang hanya tersedia dari jarak jauh untuk pemeriksaan status, tetapi instalasi dan
pengaktifan kembali tetap memerlukan marketplace lokal melalui `marketplaceSource` atau
`marketplacePath`.

Jika status menyatakan Plugin tersedia di marketplace Codex jarak jauh tetapi
instalasi jarak jauh tidak didukung, jalankan instalasi dengan sumber atau jalur lokal:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Referensi konfigurasi

| Bidang                          | Bawaan         | Arti                                                                                                  |
| ------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------- |
| `enabled`                       | disimpulkan    | Wajibkan Computer Use. Nilai bawaannya true saat bidang Computer Use lainnya ditetapkan.              |
| `autoInstall`                   | false          | Instal atau aktifkan kembali dari marketplace yang sudah ditemukan saat giliran dimulai.              |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Lama waktu instalasi menunggu penemuan marketplace oleh Codex app-server.                              |
| `liveTestTimeoutMs`             | 60000          | Batas waktu untuk utas kesiapan sementara dan permintaan pembersihannya.                               |
| `toolCallTimeoutMs`             | 60000          | Batas waktu untuk pemanggilan alat kesiapan Computer Use `list_apps`.                                  |
| `healthCheckEnabled`            | false          | Jalankan pemeriksaan kesiapan berkala selama klien app-server pemiliknya aktif.                        |
| `healthCheckIntervalMinutes`    | 60             | Interval pemeriksaan; nilai yang diterima adalah 30, 60, 120, atau 240 menit.                          |
| `pluginCacheMode`               | `independent`  | Gunakan `shared` untuk menyegarkan cache beranda Codex dari plugin desktop bawaan.                     |
| `strictReadiness`               | false          | Hentikan proses awal saat pemeriksaan langsung gagal, alih-alih melanjutkan dengan peringatan.         |
| `autoRepair`                    | false          | Hentikan proses turunan MCP Computer Use bercakupan yang usang dan coba ulang pemeriksaan sekali.      |
| `marketplaceSource`             | tidak disetel  | String sumber yang diteruskan ke `marketplace/add` Codex app-server.                                   |
| `marketplacePath`               | tidak disetel  | Jalur file marketplace Codex lokal yang berisi plugin.                                                 |
| `marketplaceName`               | tidak disetel  | Nama marketplace Codex terdaftar yang akan dipilih.                                                    |
| `pluginName`                    | `computer-use` | Nama plugin marketplace Codex.                                                                        |
| `mcpServerName`                 | `computer-use` | Nama server MCP yang diekspos oleh plugin terinstal.                                                   |

Instalasi otomatis saat giliran dimulai sengaja menolak nilai
`marketplaceSource` yang dikonfigurasi. Menambahkan sumber baru merupakan
operasi penyiapan eksplisit, jadi gunakan
`/codex computer-use install --source <marketplace-source>` sekali, lalu
biarkan `autoInstall` menangani pengaktifan kembali berikutnya dari marketplace
lokal yang ditemukan. Instalasi otomatis saat giliran dimulai dapat menggunakan
`marketplacePath` yang dikonfigurasi karena nilai tersebut sudah berupa jalur
lokal pada host.

Setiap bidang juga menerima penimpaan melalui variabel lingkungan, yang
diperiksa saat kunci konfigurasi terkait tidak disetel:

| Bidang                          | Variabel lingkungan                                             |
| ------------------------------- | -------------------------------------------------------------- |
| `enabled`                       | `OPENCLAW_CODEX_COMPUTER_USE`                                  |
| `autoInstall`                   | `OPENCLAW_CODEX_COMPUTER_USE_AUTO_INSTALL`                     |
| `marketplaceDiscoveryTimeoutMs` | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_DISCOVERY_TIMEOUT_MS` |
| `liveTestTimeoutMs`             | `OPENCLAW_CODEX_COMPUTER_USE_LIVE_TEST_TIMEOUT_MS`             |
| `toolCallTimeoutMs`             | `OPENCLAW_CODEX_COMPUTER_USE_TOOL_CALL_TIMEOUT_MS`             |
| `healthCheckEnabled`            | `OPENCLAW_CODEX_COMPUTER_USE_HEALTH_CHECK_ENABLED`             |
| `healthCheckIntervalMinutes`    | `OPENCLAW_CODEX_COMPUTER_USE_HEALTH_CHECK_INTERVAL_MINUTES`    |
| `pluginCacheMode`               | `OPENCLAW_CODEX_COMPUTER_USE_PLUGIN_CACHE_MODE`                |
| `strictReadiness`               | `OPENCLAW_CODEX_COMPUTER_USE_STRICT_READINESS`                 |
| `autoRepair`                    | `OPENCLAW_CODEX_COMPUTER_USE_AUTO_REPAIR`                      |
| `marketplaceSource`             | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_SOURCE`               |
| `marketplacePath`               | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_PATH`                 |
| `marketplaceName`               | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_NAME`                 |
| `pluginName`                    | `OPENCLAW_CODEX_COMPUTER_USE_PLUGIN_NAME`                      |
| `mcpServerName`                 | `OPENCLAW_CODEX_COMPUTER_USE_MCP_SERVER_NAME`                  |

## Yang diperiksa OpenClaw

OpenClaw melaporkan alasan penyiapan yang stabil secara internal dan memformat
status yang ditampilkan kepada pengguna untuk percakapan:

| Alasan                       | Arti                                                                 | Langkah berikutnya                                  |
| ---------------------------- | -------------------------------------------------------------------- | --------------------------------------------------- |
| `disabled`                   | `computerUse.enabled` menghasilkan nilai false.                      | Setel `enabled` atau bidang Computer Use lainnya.   |
| `marketplace_missing`        | Tidak tersedia marketplace yang cocok.                               | Konfigurasikan sumber, jalur, atau nama marketplace.|
| `plugin_not_installed`       | Marketplace tersedia, tetapi plugin belum terinstal.                 | Jalankan instalasi atau aktifkan `autoInstall`.     |
| `plugin_disabled`            | Plugin telah terinstal tetapi dinonaktifkan dalam konfigurasi Codex. | Jalankan instalasi untuk mengaktifkannya kembali.   |
| `remote_install_unsupported` | Marketplace yang dipilih hanya tersedia secara jarak jauh.           | Gunakan `marketplaceSource` atau `marketplacePath`. |
| `mcp_missing`                | Plugin aktif, tetapi server MCP tidak tersedia.                      | Periksa Computer Use Codex dan izin OS.             |
| `ready`                      | Plugin dan alat MCP tersedia.                                        | Mulai giliran mode Codex.                           |
| `check_failed`               | Permintaan Codex app-server gagal saat pemeriksaan status.           | Periksa konektivitas dan log app-server.            |
| `auto_install_blocked`       | Penyiapan saat giliran dimulai perlu menambahkan sumber baru.        | Jalankan instalasi eksplisit terlebih dahulu.       |

Keluaran percakapan menyertakan status plugin, status server MCP, marketplace,
alat jika tersedia, serta pesan khusus untuk langkah penyiapan yang gagal.

## Izin macOS

Computer Use khusus untuk macOS. Server MCP milik Codex mungkin memerlukan izin
OS lokal sebelum dapat memeriksa atau mengendalikan aplikasi. Jika OpenClaw
menyatakan Computer Use telah terinstal tetapi server MCP tidak tersedia,
verifikasi terlebih dahulu penyiapan Computer Use di sisi Codex:

- Codex app-server berjalan pada host yang sama dengan tempat pengendalian
  desktop akan dilakukan.
- Plugin Computer Use diaktifkan dalam konfigurasi Codex.
- Server MCP `computer-use` muncul dalam status MCP Codex app-server.
- macOS telah memberikan izin yang diperlukan kepada aplikasi pengendali
  desktop.
- Sesi host saat ini dapat mengakses desktop yang dikendalikan.

OpenClaw sengaja menghentikan proses saat `computerUse.enabled` bernilai true
dan persyaratan tidak terpenuhi. Giliran mode Codex tidak boleh melanjutkan
secara diam-diam tanpa alat desktop native yang diwajibkan oleh konfigurasi.

## Pemecahan masalah

**Status menyatakan belum terinstal.** Jalankan
`/codex computer-use install`. Jika marketplace tidak ditemukan, berikan
`--source` atau `--marketplace-path`.

**Status menyatakan terinstal tetapi dinonaktifkan.** Jalankan kembali
`/codex computer-use install`. Instalasi Codex app-server menulis ulang
konfigurasi plugin menjadi aktif.

**Status menyatakan instalasi jarak jauh tidak didukung.** Gunakan sumber atau
jalur marketplace lokal. Entri katalog yang hanya tersedia secara jarak jauh
dapat diperiksa, tetapi tidak dapat diinstal melalui API app-server saat ini.

**Status menyatakan server MCP tidak tersedia.** Jalankan kembali instalasi
sekali agar server MCP dimuat ulang. Jika tetap tidak tersedia, perbaiki
aplikasi Computer Use Codex, status MCP Codex app-server, atau izin macOS.

**Status atau pemeriksaan mencapai batas waktu pada
`computer-use.list_apps`.** Plugin dan server MCP tersedia, tetapi penghubung
Computer Use lokal tidak merespons. Tutup atau mulai ulang Computer Use Codex,
jalankan ulang Codex Desktop jika diperlukan, lalu coba lagi dalam sesi
OpenClaw baru. Jika host sebelumnya menjalankan Computer Use melalui Codex
app-server terkelola versi lama, segarkan plugin yang terinstal dari marketplace
bawaan desktop (gunakan jalur `Codex.app` untuk instalasi desktop Codex mandiri):

```text
/codex computer-use install --source /Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
```

**Alat Computer Use menampilkan `Native hook relay unavailable`.** Hook alat
native Codex tidak dapat menjangkau relai OpenClaw aktif melalui penghubung
lokal atau fallback Gateway. Mulai sesi OpenClaw baru dengan `/new` atau
`/reset`. Jika berhasil sekali lalu gagal lagi pada pemanggilan alat berikutnya,
`/new` hanya menghapus percobaan saat ini; mulai ulang Codex app-server atau
Gateway OpenClaw agar utas dan pendaftaran hook lama dihapus, lalu coba lagi
dalam sesi baru.

**Instalasi otomatis saat giliran dimulai menolak sumber.** Hal ini disengaja.
Tambahkan sumber terlebih dahulu dengan
`/codex computer-use install --source <marketplace-source>` secara eksplisit,
lalu instalasi otomatis pada awal giliran berikutnya dapat menggunakan
marketplace lokal yang ditemukan.

## Terkait

- [Harness Codex](/id/plugins/codex-harness)
- [Penghubung Peekaboo](/id/platforms/mac/peekaboo)
- [Aplikasi iOS](/id/platforms/ios)
