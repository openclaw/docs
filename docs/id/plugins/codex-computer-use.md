---
read_when:
    - Anda ingin agen OpenClaw mode Codex menggunakan Codex Computer Use
    - Anda sedang memilih antara Codex Computer Use, PeekabooBridge, dan cua-driver MCP langsung
    - Anda sedang memilih antara Codex Computer Use dan penyiapan MCP cua-driver secara langsung
    - Anda sedang mengonfigurasi computerUse untuk Plugin Codex bawaan
    - Anda sedang memecahkan masalah status atau instalasi /codex computer-use
summary: Menyiapkan Codex Computer Use untuk agen OpenClaw mode Codex
title: Penggunaan Komputer Codex
x-i18n:
    generated_at: "2026-05-06T09:21:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0d23cd0646336e61c77357f769bc1d7ab47a401bcc484f4d16130b942db9f1f4
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use adalah Plugin MCP native Codex untuk kontrol desktop lokal. OpenClaw
tidak mem-vendor aplikasi desktop, menjalankan tindakan desktop sendiri, atau melewati
izin Codex. Plugin `codex` bawaan hanya menyiapkan app-server Codex:
Plugin ini mengaktifkan dukungan Plugin Codex, menemukan atau menginstal Plugin
Codex Computer Use yang dikonfigurasi, memeriksa bahwa server MCP `computer-use`
tersedia, lalu membiarkan Codex memiliki panggilan alat MCP native selama giliran
mode Codex.

Gunakan halaman ini saat OpenClaw sudah menggunakan harness Codex native. Untuk
penyiapan runtime itu sendiri, lihat [harness Codex](/id/plugins/codex-harness).

## OpenClaw.app dan Peekaboo

Integrasi Peekaboo OpenClaw.app terpisah dari Codex Computer Use. Aplikasi
macOS dapat meng-host socket PeekabooBridge agar CLI `peekaboo` dapat menggunakan
kembali izin Accessibility dan Screen Recording lokal aplikasi untuk alat
otomasi Peekaboo sendiri. Bridge tersebut tidak menginstal atau mem-proxy Codex
Computer Use, dan Codex Computer Use tidak memanggil melalui socket PeekabooBridge.

Gunakan [bridge Peekaboo](/id/platforms/mac/peekaboo) saat Anda ingin OpenClaw.app
menjadi host sadar-izin untuk otomasi CLI Peekaboo. Gunakan halaman ini saat
agen OpenClaw mode Codex harus memiliki Plugin MCP `computer-use` native Codex
yang tersedia sebelum giliran dimulai.

## Aplikasi iOS

Aplikasi iOS terpisah dari Codex Computer Use. Aplikasi ini tidak menginstal
atau mem-proxy server MCP `computer-use` Codex dan bukan backend kontrol desktop.
Sebaliknya, aplikasi iOS terhubung sebagai node OpenClaw dan mengekspos
kapabilitas seluler melalui perintah node seperti `canvas.*`, `camera.*`, `screen.*`,
`location.*`, dan `talk.*`.

Gunakan [iOS](/id/platforms/ios) saat Anda ingin agen mengendalikan node iPhone
melalui gateway. Gunakan halaman ini saat agen mode Codex harus mengontrol
desktop macOS lokal melalui Plugin Computer Use native Codex.

## MCP cua-driver langsung

Codex Computer Use bukan satu-satunya cara untuk mengekspos kontrol desktop.
Jika Anda ingin runtime yang dikelola OpenClaw memanggil driver TryCua secara
langsung, gunakan server upstream `cua-driver mcp` melalui registri MCP OpenClaw,
bukan alur marketplace khusus Codex.

Setelah menginstal `cua-driver`, minta perintah OpenClaw darinya:

```bash
cua-driver mcp-config --client openclaw
```

atau daftarkan server stdio sendiri:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Jalur tersebut menjaga permukaan alat MCP upstream tetap utuh, termasuk skema
driver dan respons MCP terstruktur. Gunakan saat Anda ingin driver CUA tersedia
sebagai server MCP OpenClaw normal. Gunakan penyiapan Codex Computer Use di
halaman ini saat app-server Codex harus memiliki instalasi Plugin, pemuatan ulang
MCP, dan panggilan alat native di dalam giliran mode Codex.

Driver CUA khusus macOS dan tetap memerlukan izin macOS lokal yang diminta oleh
aplikasinya, seperti Accessibility dan Screen Recording. OpenClaw tidak
menginstal `cua-driver`, memberikan izin tersebut, atau melewati model keamanan
driver upstream.

## Penyiapan cepat

Setel `plugins.entries.codex.config.computerUse` saat giliran mode Codex harus
memiliki Computer Use yang tersedia sebelum thread dimulai:

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
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

Dengan konfigurasi ini, OpenClaw memeriksa app-server Codex sebelum setiap
giliran mode Codex. Jika Computer Use tidak ada tetapi app-server Codex sudah
menemukan marketplace yang dapat diinstal, OpenClaw meminta app-server Codex
untuk menginstal atau mengaktifkan ulang Plugin dan memuat ulang server MCP.
Di macOS, saat tidak ada marketplace cocok yang terdaftar dan bundle aplikasi
Codex standar ada, OpenClaw juga mencoba mendaftarkan marketplace Codex bawaan
dari `/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` sebelum
gagal. Jika penyiapan masih tidak dapat membuat server MCP tersedia, giliran
gagal sebelum thread dimulai.

Sesi yang sudah ada mempertahankan runtime dan binding thread Codex-nya. Setelah
mengubah konfigurasi `agentRuntime` atau Computer Use, gunakan `/new` atau `/reset`
di chat yang terpengaruh sebelum menguji.

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

`status` bersifat hanya-baca. Perintah ini tidak menambahkan sumber marketplace,
menginstal Plugin, atau mengaktifkan dukungan Plugin Codex.

`install` mengaktifkan dukungan Plugin app-server Codex, secara opsional
menambahkan sumber marketplace yang dikonfigurasi, menginstal atau mengaktifkan
ulang Plugin yang dikonfigurasi melalui app-server Codex, memuat ulang server
MCP, dan memverifikasi bahwa server MCP mengekspos alat.

## Pilihan marketplace

OpenClaw menggunakan API app-server yang sama dengan yang diekspos Codex sendiri.
Kolom marketplace memilih tempat Codex harus menemukan `computer-use`.

| Kolom                | Gunakan saat                                                    | Dukungan instalasi                                      |
| -------------------- | --------------------------------------------------------------- | ------------------------------------------------------- |
| Tanpa kolom marketplace | Anda ingin app-server Codex menggunakan marketplace yang sudah diketahuinya. | Ya, saat app-server mengembalikan marketplace lokal. |
| `marketplaceSource`  | Anda memiliki sumber marketplace Codex yang dapat ditambahkan app-server. | Ya, untuk `/codex computer-use install` eksplisit. |
| `marketplacePath`    | Anda sudah mengetahui jalur file marketplace lokal di host.     | Ya, untuk instalasi eksplisit dan auto-install saat awal giliran. |
| `marketplaceName`    | Anda ingin memilih satu marketplace yang sudah terdaftar berdasarkan nama. | Ya hanya saat marketplace terpilih memiliki jalur lokal. |

Home Codex baru mungkin memerlukan waktu singkat untuk menyemai marketplace
resminya. Selama instalasi, OpenClaw melakukan polling `plugin/list` hingga
`marketplaceDiscoveryTimeoutMs` milidetik. Default-nya adalah 60 detik.

Jika beberapa marketplace yang diketahui berisi Computer Use, OpenClaw lebih
memilih `openai-bundled`, lalu `openai-curated`, lalu `local`. Kecocokan ambigu
yang tidak dikenal gagal secara tertutup dan meminta Anda menyetel `marketplaceName`
atau `marketplacePath`.

## Marketplace macOS bawaan

Build desktop Codex terbaru membundel Computer Use di sini:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

Saat `computerUse.autoInstall` bernilai true dan tidak ada marketplace yang
berisi `computer-use` terdaftar, OpenClaw mencoba menambahkan root marketplace
bawaan standar secara otomatis:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Anda juga dapat mendaftarkannya secara eksplisit dari shell dengan Codex:

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Jika Anda menggunakan jalur aplikasi Codex nonstandar, setel `computerUse.marketplacePath`
ke jalur file marketplace lokal atau jalankan `/codex computer-use install --source
<marketplace-source>` sekali.

## Batas katalog jarak jauh

App-server Codex dapat mencantumkan dan membaca entri katalog khusus jarak jauh,
tetapi saat ini tidak mendukung `plugin/install` jarak jauh. Artinya,
`marketplaceName` dapat memilih marketplace khusus jarak jauh untuk pemeriksaan
status, tetapi instalasi dan pengaktifan ulang tetap memerlukan marketplace
lokal melalui `marketplaceSource` atau `marketplacePath`.

Jika status mengatakan Plugin tersedia di marketplace Codex jarak jauh tetapi
instalasi jarak jauh tidak didukung, jalankan instalasi dengan sumber atau jalur
lokal:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Referensi konfigurasi

| Kolom                           | Default        | Makna                                                                          |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | inferred       | Wajibkan Computer Use. Default ke true saat kolom Computer Use lain disetel.   |
| `autoInstall`                   | false          | Instal atau aktifkan ulang dari marketplace yang sudah ditemukan saat awal giliran. |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Berapa lama instalasi menunggu penemuan marketplace app-server Codex.          |
| `marketplaceSource`             | unset          | String sumber yang diteruskan ke `marketplace/add` app-server Codex.           |
| `marketplacePath`               | unset          | Jalur file marketplace Codex lokal yang berisi Plugin.                         |
| `marketplaceName`               | unset          | Nama marketplace Codex terdaftar yang akan dipilih.                            |
| `pluginName`                    | `computer-use` | Nama Plugin marketplace Codex.                                                 |
| `mcpServerName`                 | `computer-use` | Nama server MCP yang diekspos oleh Plugin yang diinstal.                       |

Auto-install saat awal giliran sengaja menolak nilai `marketplaceSource` yang
dikonfigurasi. Menambahkan sumber baru adalah operasi penyiapan eksplisit, jadi
gunakan `/codex computer-use install --source <marketplace-source>` sekali, lalu
biarkan `autoInstall` menangani pengaktifan ulang berikutnya dari marketplace
lokal yang ditemukan. Auto-install saat awal giliran dapat menggunakan
`marketplacePath` yang dikonfigurasi, karena itu sudah merupakan jalur lokal di
host.

## Yang diperiksa OpenClaw

OpenClaw melaporkan alasan penyiapan stabil secara internal dan memformat status
yang terlihat pengguna untuk chat:

| Alasan                       | Makna                                                  | Langkah berikutnya                             |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` terselesaikan ke false.          | Setel `enabled` atau kolom Computer Use lain. |
| `marketplace_missing`        | Tidak ada marketplace cocok yang tersedia.             | Konfigurasikan sumber, jalur, atau nama marketplace. |
| `plugin_not_installed`       | Marketplace ada, tetapi Plugin tidak terinstal.        | Jalankan instalasi atau aktifkan `autoInstall`. |
| `plugin_disabled`            | Plugin terinstal tetapi dinonaktifkan di konfigurasi Codex. | Jalankan instalasi untuk mengaktifkannya ulang. |
| `remote_install_unsupported` | Marketplace yang dipilih hanya jarak jauh.             | Gunakan `marketplaceSource` atau `marketplacePath`. |
| `mcp_missing`                | Plugin aktif, tetapi server MCP tidak tersedia.        | Periksa Codex Computer Use dan izin OS.       |
| `ready`                      | Plugin dan alat MCP tersedia.                          | Mulai giliran mode Codex.                     |
| `check_failed`               | Permintaan app-server Codex gagal selama pemeriksaan status. | Periksa konektivitas dan log app-server.  |
| `auto_install_blocked`       | Penyiapan awal giliran perlu menambahkan sumber baru.  | Jalankan instalasi eksplisit terlebih dahulu. |

Output chat menyertakan status Plugin, status server MCP, marketplace, alat saat
tersedia, dan pesan spesifik untuk langkah penyiapan yang gagal.

## Izin macOS

Computer Use khusus macOS. Server MCP milik Codex mungkin memerlukan izin OS
lokal sebelum dapat memeriksa atau mengontrol aplikasi. Jika OpenClaw mengatakan
Computer Use terinstal tetapi server MCP tidak tersedia, verifikasi penyiapan
Computer Use sisi Codex terlebih dahulu:

- Codex app-server berjalan pada host yang sama tempat kontrol desktop seharusnya
  terjadi.
- Plugin Computer Use diaktifkan dalam konfigurasi Codex.
- Server MCP `computer-use` muncul dalam status MCP Codex app-server.
- macOS telah memberikan izin yang diperlukan untuk aplikasi kontrol desktop.
- Sesi host saat ini dapat mengakses desktop yang dikontrol.

OpenClaw sengaja gagal secara tertutup ketika `computerUse.enabled` bernilai true. Sebuah
giliran mode Codex tidak boleh diam-diam berlanjut tanpa alat desktop native
yang diwajibkan oleh konfigurasi.

## Pemecahan masalah

**Status mengatakan belum terpasang.** Jalankan `/codex computer-use install`. Jika
marketplace tidak ditemukan, berikan `--source` atau `--marketplace-path`.

**Status mengatakan terpasang tetapi dinonaktifkan.** Jalankan `/codex computer-use install` lagi.
Instalasi Codex app-server menulis konfigurasi Plugin kembali menjadi aktif.

**Status mengatakan instalasi jarak jauh tidak didukung.** Gunakan sumber atau
path marketplace lokal. Entri katalog yang hanya jarak jauh dapat diperiksa tetapi tidak dapat dipasang melalui
API app-server saat ini.

**Status mengatakan server MCP tidak tersedia.** Jalankan ulang instalasi sekali agar server
MCP dimuat ulang. Jika tetap tidak tersedia, perbaiki aplikasi Codex Computer Use,
status MCP Codex app-server, atau izin macOS.

**Status atau probe habis waktu pada `computer-use.list_apps`.** Plugin dan server MCP
tersedia, tetapi bridge Computer Use lokal tidak menjawab. Tutup atau
mulai ulang Codex Computer Use, luncurkan ulang Codex Desktop jika perlu, lalu coba lagi dalam
sesi OpenClaw baru.

**Alat Computer Use mengatakan `Native hook relay unavailable`.** Hook alat native Codex
tidak dapat menjangkau relay OpenClaw aktif melalui bridge lokal atau
fallback Gateway. Mulai sesi OpenClaw baru dengan `/new` atau `/reset`. Jika ini
terus terjadi, mulai ulang gateway agar thread app-server lama dan
registrasi hook dihapus, lalu coba lagi.

**Auto-install saat awal giliran menolak sumber.** Ini disengaja. Tambahkan
sumber dengan `/codex computer-use install --source <marketplace-source>` secara eksplisit
terlebih dahulu, lalu auto-install awal giliran berikutnya dapat menggunakan
marketplace lokal yang ditemukan.

## Terkait

- [Harness Codex](/id/plugins/codex-harness)
- [Bridge Peekaboo](/id/platforms/mac/peekaboo)
- [Aplikasi iOS](/id/platforms/ios)
