---
read_when:
    - Anda ingin agen OpenClaw dalam mode Codex menggunakan Codex Computer Use
    - Anda sedang memilih antara Codex Computer Use, PeekabooBridge, dan MCP cua-driver langsung
    - Anda sedang mengonfigurasi computerUse untuk plugin Codex bawaan
    - Anda sedang memecahkan masalah status atau instalasi penggunaan komputer /codex
summary: Siapkan Codex Computer Use untuk agen OpenClaw mode Codex
title: Penggunaan Komputer Codex
x-i18n:
    generated_at: "2026-07-21T12:44:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 268fc5659f776eff4cfb9bec8a95cd7ab5c6cbdf13793914409444da72f9e98e
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use adalah plugin MCP native Codex untuk mengendalikan desktop lokal. OpenClaw
tidak menyertakan aplikasi desktop, menjalankan tindakan desktop sendiri, atau melewati
izin Codex. Plugin `codex` yang dibundel hanya menyiapkan app-server Codex:
plugin ini mengaktifkan dukungan plugin Codex, menemukan atau memasang plugin Computer Use
yang dikonfigurasi, memeriksa bahwa server MCP `computer-use` tersedia, lalu membiarkan
Codex menangani panggilan alat MCP native selama giliran mode Codex.

Gunakan halaman ini ketika OpenClaw sudah menggunakan harness Codex native. Untuk
penyiapan runtime itu sendiri, lihat [harness Codex](/id/plugins/codex-harness).

Ini berbeda dari [alat komputer berbasis node](/id/nodes/computer-use) bawaan OpenClaw. Gunakan alat bawaan ketika kontrak agen yang sama harus mengendalikan Mac yang dipasangkan, baik agen berjalan di Gateway maupun di node lain. Gunakan Codex Computer Use ketika app-server Codex harus menangani pemasangan MCP lokal, izin, dan panggilan alat native.

## OpenClaw.app dan Peekaboo

Integrasi Peekaboo milik OpenClaw.app terpisah dari Codex Computer Use. Aplikasi
macOS dapat menghosting soket PeekabooBridge agar CLI `peekaboo` dapat menggunakan kembali
izin Accessibility dan Screen Recording lokal aplikasi untuk alat otomatisasi
Peekaboo sendiri. Bridge tersebut tidak memasang atau memproksi Codex Computer Use, dan
Codex Computer Use tidak melakukan panggilan melalui soket PeekabooBridge.

Gunakan [bridge Peekaboo](/id/platforms/mac/peekaboo) ketika Anda ingin OpenClaw.app menjadi
host yang mempertimbangkan izin untuk otomatisasi CLI Peekaboo. Gunakan halaman ini ketika
agen OpenClaw mode Codex harus menyediakan plugin MCP native `computer-use` milik Codex
sebelum giliran dimulai.

## Aplikasi iOS

Aplikasi iOS terpisah dari Codex Computer Use. Aplikasi tersebut tidak memasang atau memproksi
server MCP `computer-use` milik Codex dan bukan backend pengendalian desktop.
Sebaliknya, aplikasi iOS terhubung sebagai node OpenClaw dan mengekspos kemampuan
seluler melalui perintah node seperti `canvas.*`, `camera.*`, `screen.*`,
`location.*`, dan `talk.*`.

Gunakan [iOS](/id/platforms/ios) ketika Anda ingin agen mengendalikan node iPhone
melalui Gateway. Gunakan halaman ini ketika agen mode Codex harus mengendalikan
desktop macOS lokal melalui plugin Computer Use native milik Codex.

## MCP cua-driver langsung

Codex Computer Use bukan satu-satunya cara untuk menyediakan pengendalian desktop. Jika Anda ingin
runtime yang dikelola OpenClaw memanggil driver TryCua secara langsung, gunakan server upstream
`cua-driver mcp` melalui registri MCP OpenClaw, bukan
alur marketplace khusus Codex.

Setelah memasang `cua-driver`, minta perintah OpenClaw darinya:

```bash
cua-driver mcp-config --client openclaw
```

atau daftarkan server stdio secara langsung:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Jalur tersebut mempertahankan permukaan alat MCP upstream secara utuh, termasuk skema
driver dan respons MCP terstruktur. Gunakan jalur tersebut ketika Anda ingin driver CUA
tersedia sebagai server MCP OpenClaw biasa. Gunakan penyiapan Codex Computer Use pada
halaman ini ketika app-server Codex harus menangani pemasangan plugin, pemuatan ulang MCP,
dan panggilan alat native dalam giliran mode Codex.

Driver CUA menyediakan build prarilis untuk macOS, Windows (x64 dan ARM64), serta
Linux (x64 dan ARM64, tingkat pratinjau). Driver tersebut tetap memerlukan izin OS lokal
yang diminta oleh aplikasinya, seperti Accessibility dan Screen Recording di
macOS. OpenClaw tidak memasang `cua-driver`, memberikan izin tersebut, atau
melewati model keamanan driver upstream.

## Penyiapan cepat

Tetapkan `plugins.entries.codex.config.computerUse` ketika giliran mode Codex harus menyediakan
Computer Use sebelum utas dimulai. `autoInstall: true` mengaktifkan
Computer Use dan memungkinkan OpenClaw memasang atau mengaktifkannya kembali sebelum giliran:

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

Dengan konfigurasi ini, OpenClaw memeriksa app-server Codex sebelum setiap
giliran mode Codex. Jika Computer Use tidak ada tetapi app-server Codex telah menemukan
marketplace yang dapat dipasang, OpenClaw meminta app-server Codex untuk memasang atau
mengaktifkan kembali plugin dan memuat ulang server MCP. Di macOS, ketika tidak ada
marketplace yang cocok yang terdaftar dan tersedia bundel aplikasi desktop standar, OpenClaw
juga mencoba mendaftarkan marketplace Codex yang dibundel dari
`/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled`, dengan
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` dipertahankan
sebagai fallback untuk pemasangan mandiri lama. Jika penyiapan tetap tidak dapat menyediakan
server MCP, giliran gagal sebelum utas dimulai.

Setelah mengubah konfigurasi Computer Use, gunakan `/new` atau `/reset` dalam
chat yang terdampak sebelum menguji jika utas Codex yang ada sudah dimulai.

Di macOS, proses awal terkelola untuk Computer Use mengutamakan biner aplikasi desktop di
`/Applications/ChatGPT.app/Contents/Resources/codex`, lalu menggunakan
`/Applications/Codex.app/Contents/Resources/codex` sebagai fallback untuk pemasangan
mandiri lama. Hal ini juga berlaku untuk perintah status dan pemasangan Computer Use
satu kali yang memulai kliennya sendiri. Mekanisme ini menjaga pengendalian desktop di bawah
bundel aplikasi yang memiliki izin macOS lokal. Jika aplikasi desktop tidak
terpasang, OpenClaw menggunakan biner Codex terkelola yang dipasang bersama
plugin sebagai fallback. Giliran Codex terkelola biasa dengan direktori home agen terisolasi bawaan mengutamakan
paket yang dipatok tersebut agar aplikasi desktop lama tidak menggantikan dukungan
model saat ini. Direktori home cakupan pengguna tetap mengutamakan desktop karena dapat memuat status
Computer Use native. Direktori home agen terisolasi yang konfigurasi efektif Codex-nya mengaktifkan
Computer Use juga tetap mengutamakan desktop. Konfigurasi eksplisit
`appServer.command` atau `OPENCLAW_CODEX_APP_SERVER_BIN` tetap mengesampingkan
pemilihan terkelola ini.

OpenClaw menserialkan pembacaan konfigurasi native Codex dan pemasangan Computer Use
dalam satu Gateway yang berjalan. Proses Codex terpisah atau Gateway lain tidak
termasuk dalam pembatas tersebut. Setelah mengubah konfigurasi plugin Codex native di luar
Gateway, mulai ulang Gateway dan mulai chat baru sebelum mengandalkan
pemilihan baru tersebut.

## Perintah

Gunakan perintah `/codex computer-use` dari permukaan chat mana pun tempat
permukaan perintah plugin `codex` tersedia. Ini adalah perintah chat/runtime
OpenClaw, bukan subperintah CLI `openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` adalah tindakan bawaan dan bersifat hanya-baca: tindakan ini tidak menambahkan sumber
marketplace, memasang plugin, atau mengaktifkan dukungan plugin Codex. Jika tidak ada konfigurasi yang mengaktifkan
Computer Use, `status` dapat melaporkan bahwa fitur dinonaktifkan bahkan setelah perintah pemasangan
satu kali.

`install` mengaktifkan dukungan plugin app-server Codex, secara opsional menambahkan
sumber marketplace yang dikonfigurasi, memasang atau mengaktifkan kembali plugin yang dikonfigurasi
melalui app-server Codex, memuat ulang server MCP, dan memverifikasi bahwa server MCP
mengekspos alat. Karena pemasangan mengubah sumber daya host tepercaya,
hanya pemilik atau klien Gateway `operator.admin` yang dapat menjalankan `install`. Pengirim
resmi lainnya tetap dapat menggunakan perintah hanya-baca `status`,
termasuk dengan pengesampingan.

Rilis lama menerima pengesampingan identitas satu kali `--plugin`, `--server`, dan `--mcp-server`.
Sebagai gantinya, konfigurasikan `computerUse.pluginName` dan
`computerUse.mcpServerName` secara persisten. Ketika tanda identitas lama
digunakan, perintah mengidentifikasi pengaturan persis yang harus dipertahankan dan mengulangi
tindakan yang diminta beserta tanda marketplace yang didukung dalam panduan migrasinya.

## Pilihan marketplace

OpenClaw menggunakan API app-server yang sama dengan yang diekspos oleh Codex.
Bidang marketplace menentukan tempat Codex harus menemukan `computer-use`.

| Bidang               | Gunakan ketika                                                    | Dukungan pemasangan                                      |
| -------------------- | ----------------------------------------------------------------- | -------------------------------------------------------- |
| Tanpa bidang marketplace | Anda ingin app-server Codex menggunakan marketplace yang sudah diketahuinya. | Ya, ketika app-server mengembalikan marketplace lokal.   |
| `marketplaceSource`  | Anda memiliki sumber marketplace Codex yang dapat ditambahkan app-server. | Ya, untuk `/codex computer-use install` eksplisit.       |
| `marketplacePath`    | Anda sudah mengetahui jalur file marketplace lokal pada host.     | Ya, untuk pemasangan eksplisit dan pemasangan otomatis saat giliran dimulai. |
| `marketplaceName`    | Anda ingin memilih salah satu marketplace yang sudah terdaftar berdasarkan nama. | Ya, hanya ketika marketplace yang dipilih memiliki jalur lokal. |

Direktori home Codex baru mungkin memerlukan waktu singkat untuk menginisialisasi
marketplace resminya. Selama pemasangan, OpenClaw melakukan polling `plugin/list` hingga
`marketplaceDiscoveryTimeoutMs` milidetik (bawaan 60 detik).

Jika beberapa marketplace yang diketahui memuat Computer Use, OpenClaw mengutamakan
`openai-bundled`, lalu `openai-curated`, kemudian `local`. Kecocokan ambigu yang
tidak dikenal akan gagal secara tertutup dan meminta Anda menetapkan `marketplaceName` atau
`marketplacePath`.

## Marketplace macOS yang dibundel

Build desktop ChatGPT saat ini membundel Computer Use di sini; build desktop Codex
mandiri lama menggunakan tata letak yang sama di bawah `Codex.app`:

```text
/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

Ketika `computerUse.autoInstall` bernilai true dan tidak ada marketplace yang memuat
`computer-use` yang terdaftar, OpenClaw mencoba menambahkan root marketplace
bundel standar pertama yang tersedia:

```text
/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Anda juga dapat mendaftarkannya secara eksplisit dari shell dengan Codex:

```bash
codex plugin marketplace add /Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
```

Jika Anda menggunakan jalur aplikasi Codex nonstandar, jalankan `/codex computer-use install
--source <marketplace-root>` satu kali, atau tetapkan `computerUse.marketplacePath` ke
jalur file marketplace lokal. Gunakan `--marketplace-path` hanya ketika Anda memiliki
jalur file JSON marketplace, bukan root marketplace yang dibundel.

### Cache plugin bersama

`pluginCacheMode: "independent"` bawaan membiarkan setiap direktori home Codex dan
cache pluginnya tidak dikelola. Tetapkan `pluginCacheMode: "shared"` untuk menyalin plugin
Computer Use yang dibundel ke cache plugin yang dapat ditemukan milik direktori home Codex aktif
sebelum app-server dimulai. Mode bersama mempertahankan versi cache lama karena
klien Codex yang berjalan mungkin masih merujuk direktori plugin berversi; kegagalan
penyalinan pengganti juga mempertahankan cache aktif. Konfigurasi eksplisit
`marketplaceName` atau `marketplacePath` menonaktifkan rekonsiliasi ini
agar OpenClaw tidak mengesampingkan pilihan tersebut.

## Batas katalog jarak jauh

App-server Codex dapat mencantumkan dan membaca entri katalog yang hanya tersedia secara jarak jauh, tetapi saat ini
tidak mendukung `plugin/install` jarak jauh. Artinya, `marketplaceName`
dapat memilih marketplace yang hanya tersedia secara jarak jauh untuk pemeriksaan status, tetapi pemasangan dan
pengaktifan kembali tetap memerlukan marketplace lokal melalui `marketplaceSource` atau
`marketplacePath`.

Jika status menyatakan plugin tersedia di marketplace Codex jarak jauh tetapi
pemasangan jarak jauh tidak didukung, jalankan pemasangan dengan sumber atau jalur lokal:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Referensi konfigurasi

| Bidang                          | Bawaan         | Arti                                                                           |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | disimpulkan     | Wajibkan Computer Use. Nilai bawaannya true ketika bidang Computer Use lain ditetapkan. |
| `autoInstall`                   | false          | Instal atau aktifkan kembali dari marketplace yang sudah ditemukan saat giliran dimulai. |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Durasi instalasi menunggu penemuan marketplace oleh app-server Codex.          |
| `liveTestTimeoutMs`             | 60000          | Batas waktu untuk thread kesiapan sementara dan permintaan pembersihannya.      |
| `toolCallTimeoutMs`             | 60000          | Batas waktu untuk pemanggilan alat kesiapan Computer Use `list_apps`.    |
| `healthCheckEnabled`            | false          | Jalankan pemeriksaan kesiapan berkala selama klien app-server pemilik aktif.    |
| `healthCheckIntervalMinutes`    | 60             | Interval pemeriksaan; nilai yang diterima adalah 30, 60, 120, atau 240 menit.  |
| `pluginCacheMode`               | `independent`  | Gunakan `shared` untuk menyegarkan cache beranda Codex dari plugin desktop bawaan. |
| `strictReadiness`               | false          | Hentikan proses awal saat pemeriksaan langsung gagal, alih-alih melanjutkan dengan peringatan. |
| `autoRepair`                    | false          | Hentikan proses anak MCP Computer Use tercakup yang usang dan coba ulang pemeriksaan yang gagal satu kali. |
| `marketplaceSource`             | tidak ditetapkan | String sumber yang diteruskan ke app-server Codex `marketplace/add`.           |
| `marketplacePath`               | tidak ditetapkan | Jalur file marketplace Codex lokal yang berisi plugin.                          |
| `marketplaceName`               | tidak ditetapkan | Nama marketplace Codex terdaftar yang akan dipilih.                             |
| `pluginName`                    | `computer-use` | Nama plugin marketplace Codex.                                                 |
| `mcpServerName`                 | `computer-use` | Nama server MCP yang diekspos oleh plugin terinstal.                            |

Instalasi otomatis saat giliran dimulai sengaja menolak nilai `marketplaceSource`
yang dikonfigurasi. Menambahkan sumber baru merupakan operasi penyiapan eksplisit, jadi gunakan
`/codex computer-use install --source <marketplace-source>` satu kali, lalu biarkan
`autoInstall` menangani pengaktifan kembali berikutnya dari marketplace lokal yang ditemukan.
Instalasi otomatis saat giliran dimulai dapat menggunakan `marketplacePath` yang dikonfigurasi karena
nilai tersebut sudah merupakan jalur lokal pada host.

Setiap bidang juga menerima penggantian melalui variabel lingkungan, yang diperiksa ketika
kunci konfigurasi terkait tidak ditetapkan:

| Bidang                          | Variabel lingkungan                                            |
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
status yang ditampilkan kepada pengguna untuk obrolan:

| Alasan                       | Arti                                                   | Langkah berikutnya                              |
| ---------------------------- | ------------------------------------------------------ | ----------------------------------------------- |
| `disabled`                   | `computerUse.enabled` menghasilkan false.              | Tetapkan `enabled` atau bidang Computer Use lain. |
| `marketplace_missing`        | Tidak ada marketplace yang cocok.                      | Konfigurasikan sumber, jalur, atau nama marketplace. |
| `plugin_not_installed`       | Marketplace tersedia, tetapi plugin belum terinstal.   | Jalankan instalasi atau aktifkan `autoInstall`. |
| `plugin_disabled`            | Plugin terinstal tetapi dinonaktifkan dalam konfigurasi Codex. | Jalankan instalasi untuk mengaktifkannya kembali. |
| `remote_install_unsupported` | Marketplace yang dipilih hanya tersedia secara jarak jauh. | Gunakan `marketplaceSource` atau `marketplacePath`. |
| `mcp_missing`                | Plugin aktif, tetapi server MCP tidak tersedia.        | Periksa Computer Use Codex dan izin OS.          |
| `ready`                      | Plugin dan alat MCP tersedia.                          | Mulai giliran mode Codex.                        |
| `check_failed`               | Permintaan app-server Codex gagal saat pemeriksaan status. | Periksa konektivitas dan log app-server.         |
| `auto_install_blocked`       | Penyiapan saat giliran dimulai perlu menambahkan sumber baru. | Jalankan instalasi eksplisit terlebih dahulu.    |

Keluaran obrolan mencakup status plugin, status server MCP, marketplace,
alat jika tersedia, dan pesan spesifik untuk langkah penyiapan yang gagal.

## Izin macOS

Computer Use khusus untuk macOS. Server MCP milik Codex mungkin memerlukan
izin OS lokal sebelum dapat memeriksa atau mengendalikan aplikasi. Jika OpenClaw menyatakan Computer
Use telah terinstal tetapi server MCP tidak tersedia, verifikasi terlebih dahulu
penyiapan Computer Use di sisi Codex:

- App-server Codex berjalan pada host yang sama tempat pengendalian desktop seharusnya
  dilakukan.
- Plugin Computer Use diaktifkan dalam konfigurasi Codex.
- Server MCP `computer-use` muncul dalam status MCP app-server Codex.
- macOS telah memberikan izin yang diperlukan kepada aplikasi pengendali desktop.
- Sesi host saat ini dapat mengakses desktop yang dikendalikan.

OpenClaw sengaja menghentikan proses dengan aman ketika `computerUse.enabled` bernilai true. Giliran
mode Codex tidak boleh melanjutkan secara diam-diam tanpa alat desktop native
yang diwajibkan oleh konfigurasi.

## Pemecahan masalah

**Status menyatakan belum terinstal.** Jalankan `/codex computer-use install`. Jika
marketplace tidak ditemukan, berikan `--source` atau `--marketplace-path`.

**Status menyatakan terinstal tetapi dinonaktifkan.** Jalankan kembali `/codex computer-use install`.
Instalasi app-server Codex menulis kembali konfigurasi plugin sebagai aktif.

**Status menyatakan instalasi jarak jauh tidak didukung.** Gunakan sumber
atau jalur marketplace lokal. Entri katalog yang hanya tersedia secara jarak jauh dapat diperiksa tetapi tidak
dapat diinstal melalui API app-server saat ini.

**Status menyatakan server MCP tidak tersedia.** Jalankan kembali instalasi satu kali agar server
MCP dimuat ulang. Jika tetap tidak tersedia, perbaiki aplikasi Computer Use Codex,
status MCP app-server Codex, atau izin macOS.

**Status atau pemeriksaan mengalami batas waktu pada `computer-use.list_apps`.** Plugin dan
server MCP tersedia, tetapi bridge Computer Use lokal tidak merespons.
Tutup atau mulai ulang Computer Use Codex, jalankan kembali Codex Desktop jika diperlukan, lalu
coba lagi dalam sesi OpenClaw baru. Jika host sebelumnya menjalankan Computer Use
melalui app-server Codex terkelola versi lama, segarkan plugin terinstal dari
marketplace bawaan desktop (gunakan jalur `Codex.app` untuk instalasi mandiri
desktop Codex):

```text
/codex computer-use install --source /Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
```

**Alat Computer Use menyatakan `Native hook relay unavailable`.** Hook alat
native Codex tidak dapat menjangkau relay OpenClaw aktif melalui
bridge lokal atau fallback Gateway. Mulai sesi OpenClaw baru dengan `/new`
atau `/reset`. Jika berhasil satu kali lalu gagal lagi pada pemanggilan alat berikutnya,
`/new` hanya menghapus percobaan saat ini; mulai ulang app-server Codex atau
Gateway OpenClaw agar thread dan pendaftaran hook lama dihapus, lalu
coba lagi dalam sesi baru.

**Instalasi otomatis saat giliran dimulai menolak sumber.** Hal ini disengaja. Tambahkan
sumber terlebih dahulu dengan `/codex computer-use install --source
<marketplace-source>` secara eksplisit, lalu instalasi otomatis saat giliran dimulai berikutnya dapat menggunakan
marketplace lokal yang ditemukan.

## Terkait

- [Harness Codex](/id/plugins/codex-harness)
- [Bridge Peekaboo](/id/platforms/mac/peekaboo)
- [Aplikasi iOS](/id/platforms/ios)
