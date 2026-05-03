---
read_when:
    - Anda ingin agen OpenClaw mode Codex menggunakan Codex Computer Use
    - Anda sedang memilih antara Codex Computer Use, PeekabooBridge, dan MCP cua-driver langsung
    - Anda sedang memilih antara Codex Computer Use dan penyiapan MCP cua-driver langsung
    - Anda sedang mengonfigurasi computerUse untuk Plugin Codex bawaan
    - Anda sedang memecahkan masalah status atau instalasi /codex computer-use
summary: Siapkan Codex Computer Use untuk agen OpenClaw mode Codex
title: Penggunaan Komputer Codex
x-i18n:
    generated_at: "2026-05-03T09:18:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 08383e88ca02dccc86c622c3295478e950fdd222ef16947465e0de1dacafa56c
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use adalah Plugin MCP native Codex untuk kontrol desktop lokal. OpenClaw
tidak menyertakan aplikasi desktop sebagai vendor, menjalankan aksi desktop itu
sendiri, atau melewati izin Codex. Plugin `codex` bawaan hanya menyiapkan
Codex app-server: mengaktifkan dukungan Plugin Codex, menemukan atau menginstal
Plugin Codex Computer Use yang dikonfigurasi, memeriksa bahwa server MCP
`computer-use` tersedia, lalu membiarkan Codex memiliki panggilan tool MCP
native selama giliran mode Codex.

Gunakan halaman ini ketika OpenClaw sudah menggunakan harness Codex native.
Untuk penyiapan runtime itu sendiri, lihat [harness Codex](/id/plugins/codex-harness).

## OpenClaw.app dan Peekaboo

Integrasi Peekaboo OpenClaw.app terpisah dari Codex Computer Use. Aplikasi
macOS dapat meng-host socket PeekabooBridge agar CLI `peekaboo` dapat
menggunakan kembali izin Accessibility dan Screen Recording lokal aplikasi
untuk tool otomasi milik Peekaboo. Bridge tersebut tidak menginstal atau
mem-proxy Codex Computer Use, dan Codex Computer Use tidak memanggil melalui
socket PeekabooBridge.

Gunakan [bridge Peekaboo](/id/platforms/mac/peekaboo) ketika Anda ingin
OpenClaw.app menjadi host yang sadar izin untuk otomasi CLI Peekaboo. Gunakan
halaman ini ketika agen OpenClaw mode Codex harus memiliki Plugin MCP
`computer-use` native Codex yang tersedia sebelum giliran dimulai.

## Aplikasi iOS

Aplikasi iOS terpisah dari Codex Computer Use. Aplikasi ini tidak menginstal
atau mem-proxy server MCP `computer-use` Codex dan bukan backend kontrol
desktop. Sebagai gantinya, aplikasi iOS terhubung sebagai node OpenClaw dan
mengekspos kapabilitas seluler melalui perintah node seperti `canvas.*`,
`camera.*`, `screen.*`, `location.*`, dan `talk.*`.

Gunakan [iOS](/id/platforms/ios) ketika Anda ingin agen mengendalikan node iPhone
melalui gateway. Gunakan halaman ini ketika agen mode Codex harus mengontrol
desktop macOS lokal melalui Plugin Computer Use native Codex.

## MCP cua-driver langsung

Codex Computer Use bukan satu-satunya cara untuk mengekspos kontrol desktop.
Jika Anda ingin runtime yang dikelola OpenClaw memanggil driver TryCua secara
langsung, gunakan server upstream `cua-driver mcp` melalui registry MCP OpenClaw,
bukan alur marketplace khusus Codex.

Setelah menginstal `cua-driver`, minta perintah OpenClaw darinya:

```bash
cua-driver mcp-config --client openclaw
```

atau daftarkan sendiri server stdio:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Jalur tersebut menjaga permukaan tool MCP upstream tetap utuh, termasuk skema
driver dan respons MCP terstruktur. Gunakan ketika Anda ingin driver CUA
tersedia sebagai server MCP OpenClaw normal. Gunakan penyiapan Codex Computer Use
di halaman ini ketika Codex app-server harus memiliki instalasi Plugin, pemuatan
ulang MCP, dan panggilan tool native di dalam giliran mode Codex.

Driver CUA khusus macOS dan tetap memerlukan izin macOS lokal yang diminta oleh
aplikasinya, seperti Accessibility dan Screen Recording. OpenClaw tidak
menginstal `cua-driver`, memberikan izin tersebut, atau melewati model keamanan
driver upstream.

## Penyiapan cepat

Atur `plugins.entries.codex.config.computerUse` ketika giliran mode Codex harus
memiliki Computer Use tersedia sebelum thread dimulai:

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

Dengan konfigurasi ini, OpenClaw memeriksa Codex app-server sebelum setiap
giliran mode Codex. Jika Computer Use tidak ada tetapi Codex app-server sudah
menemukan marketplace yang dapat diinstal, OpenClaw meminta Codex app-server
untuk menginstal atau mengaktifkan ulang Plugin dan memuat ulang server MCP. Di
macOS, ketika tidak ada marketplace yang cocok yang terdaftar dan bundel
aplikasi Codex standar ada, OpenClaw juga mencoba mendaftarkan marketplace Codex
bawaan dari
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` sebelum
gagal. Jika penyiapan masih tidak dapat membuat server MCP tersedia, giliran
gagal sebelum thread dimulai.

Sesi yang ada mempertahankan runtime dan pengikatan thread Codex-nya. Setelah
mengubah `agentRuntime` atau konfigurasi Computer Use, gunakan `/new` atau
`/reset` di chat yang terdampak sebelum menguji.

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

`status` bersifat baca-saja. Perintah ini tidak menambahkan sumber marketplace,
menginstal Plugin, atau mengaktifkan dukungan Plugin Codex.

`install` mengaktifkan dukungan Plugin Codex app-server, secara opsional
menambahkan sumber marketplace yang dikonfigurasi, menginstal atau mengaktifkan
ulang Plugin yang dikonfigurasi melalui Codex app-server, memuat ulang server
MCP, dan memverifikasi bahwa server MCP mengekspos tool.

## Pilihan marketplace

OpenClaw menggunakan API app-server yang sama yang diekspos oleh Codex sendiri.
Kolom marketplace memilih tempat Codex harus menemukan `computer-use`.

| Kolom                | Gunakan ketika                                                  | Dukungan instalasi                                      |
| -------------------- | --------------------------------------------------------------- | ------------------------------------------------------- |
| Tanpa kolom marketplace | Anda ingin Codex app-server menggunakan marketplace yang sudah dikenalnya. | Ya, ketika app-server mengembalikan marketplace lokal. |
| `marketplaceSource`  | Anda memiliki sumber marketplace Codex yang dapat ditambahkan app-server. | Ya, untuk `/codex computer-use install` eksplisit. |
| `marketplacePath`    | Anda sudah mengetahui path file marketplace lokal pada host.    | Ya, untuk instalasi eksplisit dan auto-install saat awal giliran. |
| `marketplaceName`    | Anda ingin memilih satu marketplace yang sudah terdaftar berdasarkan nama. | Ya hanya ketika marketplace yang dipilih memiliki path lokal. |

Home Codex baru mungkin memerlukan waktu singkat untuk menanam marketplace
resminya. Selama instalasi, OpenClaw melakukan polling `plugin/list` hingga
`marketplaceDiscoveryTimeoutMs` milidetik. Default-nya adalah 60 detik.

Jika beberapa marketplace yang diketahui berisi Computer Use, OpenClaw
memprioritaskan `openai-bundled`, lalu `openai-curated`, lalu `local`.
Kecocokan ambigu yang tidak dikenal gagal tertutup dan meminta Anda mengatur
`marketplaceName` atau `marketplacePath`.

## Marketplace macOS bawaan

Build desktop Codex terbaru menyertakan Computer Use di sini:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

Ketika `computerUse.autoInstall` bernilai true dan tidak ada marketplace berisi
`computer-use` yang terdaftar, OpenClaw mencoba menambahkan root marketplace
bawaan standar secara otomatis:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Anda juga dapat mendaftarkannya secara eksplisit dari shell dengan Codex:

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Jika Anda menggunakan path aplikasi Codex nonstandar, atur
`computerUse.marketplacePath` ke path file marketplace lokal atau jalankan
`/codex computer-use install --source <marketplace-source>` sekali.

## Batas katalog jarak jauh

Codex app-server dapat mencantumkan dan membaca entri katalog yang hanya jarak
jauh, tetapi saat ini tidak mendukung `plugin/install` jarak jauh. Artinya
`marketplaceName` dapat memilih marketplace yang hanya jarak jauh untuk
pemeriksaan status, tetapi instalasi dan pengaktifan ulang tetap memerlukan
marketplace lokal melalui `marketplaceSource` atau `marketplacePath`.

Jika status mengatakan Plugin tersedia di marketplace Codex jarak jauh tetapi
instalasi jarak jauh tidak didukung, jalankan instalasi dengan sumber atau path
lokal:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Referensi konfigurasi

| Kolom                           | Default        | Arti                                                                           |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | inferred       | Wajibkan Computer Use. Default ke true ketika kolom Computer Use lain diatur. |
| `autoInstall`                   | false          | Instal atau aktifkan ulang dari marketplace yang sudah ditemukan saat awal giliran. |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Lamanya instalasi menunggu penemuan marketplace Codex app-server.             |
| `marketplaceSource`             | unset          | String sumber yang diteruskan ke `marketplace/add` Codex app-server.          |
| `marketplacePath`               | unset          | Path file marketplace Codex lokal yang berisi Plugin.                         |
| `marketplaceName`               | unset          | Nama marketplace Codex terdaftar yang akan dipilih.                           |
| `pluginName`                    | `computer-use` | Nama Plugin marketplace Codex.                                                |
| `mcpServerName`                 | `computer-use` | Nama server MCP yang diekspos oleh Plugin yang terinstal.                     |

Auto-install saat awal giliran sengaja menolak nilai `marketplaceSource` yang
dikonfigurasi. Menambahkan sumber baru adalah operasi penyiapan eksplisit, jadi
gunakan `/codex computer-use install --source <marketplace-source>` sekali, lalu
biarkan `autoInstall` menangani pengaktifan ulang mendatang dari marketplace
lokal yang ditemukan. Auto-install saat awal giliran dapat menggunakan
`marketplacePath` yang dikonfigurasi, karena itu sudah merupakan path lokal pada
host.

## Yang diperiksa OpenClaw

OpenClaw melaporkan alasan penyiapan yang stabil secara internal dan memformat
status yang terlihat pengguna untuk chat:

| Alasan                       | Arti                                                   | Langkah berikutnya                             |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` diselesaikan ke false.           | Atur `enabled` atau kolom Computer Use lain.  |
| `marketplace_missing`        | Tidak ada marketplace yang cocok tersedia.             | Konfigurasikan sumber, path, atau nama marketplace. |
| `plugin_not_installed`       | Marketplace ada, tetapi Plugin tidak terinstal.        | Jalankan instalasi atau aktifkan `autoInstall`. |
| `plugin_disabled`            | Plugin terinstal tetapi dinonaktifkan di konfigurasi Codex. | Jalankan instalasi untuk mengaktifkannya kembali. |
| `remote_install_unsupported` | Marketplace yang dipilih hanya jarak jauh.             | Gunakan `marketplaceSource` atau `marketplacePath`. |
| `mcp_missing`                | Plugin diaktifkan, tetapi server MCP tidak tersedia.   | Periksa Codex Computer Use dan izin OS.       |
| `ready`                      | Plugin dan tool MCP tersedia.                          | Mulai giliran mode Codex.                     |
| `check_failed`               | Permintaan Codex app-server gagal selama pemeriksaan status. | Periksa konektivitas dan log app-server. |
| `auto_install_blocked`       | Penyiapan saat awal giliran perlu menambahkan sumber baru. | Jalankan instalasi eksplisit terlebih dahulu. |

Output chat menyertakan status Plugin, status server MCP, marketplace, tool
ketika tersedia, dan pesan spesifik untuk langkah penyiapan yang gagal.

## Izin macOS

Computer Use khusus macOS. Server MCP milik Codex mungkin memerlukan izin OS
lokal sebelum dapat memeriksa atau mengontrol aplikasi. Jika OpenClaw mengatakan
Computer Use terinstal tetapi server MCP tidak tersedia, verifikasi penyiapan
Computer Use sisi Codex terlebih dahulu:

- Codex app-server berjalan pada host yang sama tempat kontrol desktop harus
  berlangsung.
- Plugin Computer Use diaktifkan di konfigurasi Codex.
- Server MCP `computer-use` muncul di status MCP Codex app-server.
- macOS telah memberikan izin yang diperlukan untuk aplikasi desktop-control.
- Sesi host saat ini dapat mengakses desktop yang dikendalikan.

OpenClaw sengaja gagal tertutup ketika `computerUse.enabled` bernilai true.
Giliran mode Codex tidak boleh berjalan diam-diam tanpa alat desktop native
yang diwajibkan oleh konfigurasi.

## Pemecahan Masalah

**Status mengatakan belum terpasang.** Jalankan `/codex computer-use install`. Jika
marketplace tidak ditemukan, berikan `--source` atau `--marketplace-path`.

**Status mengatakan terpasang tetapi dinonaktifkan.** Jalankan `/codex computer-use install` lagi.
Pemasangan Codex app-server menulis kembali konfigurasi Plugin menjadi aktif.

**Status mengatakan pemasangan jarak jauh tidak didukung.** Gunakan sumber atau
path marketplace lokal. Entri katalog remote-only dapat diperiksa tetapi tidak dapat dipasang melalui
API app-server saat ini.

**Status mengatakan server MCP tidak tersedia.** Jalankan ulang pemasangan sekali agar server MCP
dimuat ulang. Jika tetap tidak tersedia, perbaiki aplikasi Codex Computer Use,
status MCP Codex app-server, atau izin macOS.

**Status atau probe kehabisan waktu pada `computer-use.list_apps`.** Plugin dan server MCP
sudah ada, tetapi bridge Computer Use lokal tidak menjawab. Keluar atau
mulai ulang Codex Computer Use, jalankan ulang Codex Desktop jika perlu, lalu coba lagi dalam
sesi OpenClaw baru.

**Alat Computer Use mengatakan `Native hook relay unavailable`.** Hook alat native Codex
tidak dapat menjangkau relay OpenClaw aktif melalui bridge lokal atau
fallback Gateway. Mulai sesi OpenClaw baru dengan `/new` atau `/reset`. Jika ini
terus terjadi, mulai ulang gateway agar thread app-server lama dan pendaftaran hook
dihapus, lalu coba lagi.

**Pemasangan otomatis saat awal giliran menolak sumber.** Ini disengaja. Tambahkan
sumber dengan `/codex computer-use install --source <marketplace-source>` eksplisit
terlebih dahulu, lalu pemasangan otomatis saat awal giliran berikutnya dapat menggunakan marketplace lokal
yang ditemukan.
