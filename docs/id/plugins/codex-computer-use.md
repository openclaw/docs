---
read_when:
    - Anda ingin agen OpenClaw mode Codex menggunakan Codex Computer Use
    - Anda sedang memilih antara Codex Computer Use, PeekabooBridge, dan cua-driver MCP langsung
    - Anda sedang memutuskan antara Codex Computer Use dan penyiapan MCP cua-driver langsung
    - Anda sedang mengonfigurasi computerUse untuk Plugin Codex bawaan
    - Anda sedang memecahkan masalah status atau pemasangan /codex computer-use
summary: Siapkan Codex Computer Use untuk agen OpenClaw mode Codex
title: Penggunaan Komputer Codex
x-i18n:
    generated_at: "2026-04-30T10:00:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e3551b9005cdc8084d159c107f9b5039a4b4624847b8cc6e5bcb620510fd54f
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use adalah plugin MCP asli Codex untuk kontrol desktop lokal. OpenClaw
tidak menyematkan aplikasi desktop, menjalankan tindakan desktop sendiri, atau melewati
izin Codex. Plugin `codex` bawaan hanya menyiapkan Codex app-server:
plugin ini mengaktifkan dukungan plugin Codex, menemukan atau memasang plugin Codex
Computer Use yang dikonfigurasi, memeriksa bahwa server MCP `computer-use` tersedia, lalu
membiarkan Codex memiliki pemanggilan tool MCP native selama giliran mode Codex.

Gunakan halaman ini ketika OpenClaw sudah menggunakan harness Codex native. Untuk
penyiapan runtime itu sendiri, lihat [Codex harness](/id/plugins/codex-harness).

## OpenClaw.app dan Peekaboo

Integrasi Peekaboo milik OpenClaw.app terpisah dari Codex Computer Use. Aplikasi
macOS dapat meng-host socket PeekabooBridge agar CLI `peekaboo` dapat menggunakan ulang
izin Accessibility dan Screen Recording lokal aplikasi untuk tool otomasi milik
Peekaboo. Bridge tersebut tidak memasang atau mem-proxy Codex Computer Use, dan
Codex Computer Use tidak memanggil melalui socket PeekabooBridge.

Gunakan [Peekaboo bridge](/id/platforms/mac/peekaboo) ketika Anda ingin OpenClaw.app menjadi
host yang sadar izin untuk otomasi CLI Peekaboo. Gunakan halaman ini ketika agen
OpenClaw mode Codex harus memiliki plugin MCP `computer-use` native milik Codex
yang tersedia sebelum giliran dimulai.

## Aplikasi iOS

Aplikasi iOS terpisah dari Codex Computer Use. Aplikasi ini tidak memasang atau mem-proxy
server MCP `computer-use` Codex dan bukan backend kontrol desktop.
Sebaliknya, aplikasi iOS terhubung sebagai node OpenClaw dan mengekspos kapabilitas
seluler melalui perintah node seperti `canvas.*`, `camera.*`, `screen.*`,
`location.*`, dan `talk.*`.

Gunakan [iOS](/id/platforms/ios) ketika Anda ingin agen mengendalikan node iPhone melalui
gateway. Gunakan halaman ini ketika agen mode Codex harus mengontrol desktop
macOS lokal melalui plugin Computer Use native milik Codex.

## MCP cua-driver langsung

Codex Computer Use bukan satu-satunya cara untuk mengekspos kontrol desktop. Jika Anda ingin
runtime yang dikelola OpenClaw memanggil driver TryCua secara langsung, gunakan server
`cua-driver mcp` upstream melalui registry MCP OpenClaw, bukan alur marketplace
khusus Codex.

Setelah memasang `cua-driver`, mintalah perintah OpenClaw darinya:

```bash
cua-driver mcp-config --client openclaw
```

atau daftarkan sendiri server stdio:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Jalur itu mempertahankan permukaan tool MCP upstream tetap utuh, termasuk skema driver
dan respons MCP terstruktur. Gunakan jalur ini ketika Anda ingin driver CUA
tersedia sebagai server MCP OpenClaw biasa. Gunakan penyiapan Codex Computer Use di
halaman ini ketika Codex app-server harus memiliki pemasangan plugin, pemuatan ulang MCP,
dan pemanggilan tool native di dalam giliran mode Codex.

Driver CUA khusus macOS dan tetap memerlukan izin macOS lokal yang diminta
aplikasinya, seperti Accessibility dan Screen Recording. OpenClaw tidak
memasang `cua-driver`, memberikan izin tersebut, atau melewati model keamanan
driver upstream.

## Penyiapan cepat

Atur `plugins.entries.codex.config.computerUse` ketika giliran mode Codex harus memiliki
Computer Use yang tersedia sebelum thread dimulai:

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
        fallback: "none",
      },
    },
  },
}
```

Dengan konfigurasi ini, OpenClaw memeriksa Codex app-server sebelum setiap giliran mode Codex.
Jika Computer Use hilang tetapi Codex app-server sudah menemukan marketplace yang
dapat dipasang, OpenClaw meminta Codex app-server untuk memasang atau mengaktifkan ulang
plugin dan memuat ulang server MCP. Di macOS, ketika tidak ada marketplace yang cocok
terdaftar dan bundle aplikasi Codex standar ada, OpenClaw juga mencoba
mendaftarkan marketplace Codex bawaan dari
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` sebelum gagal.
Jika penyiapan tetap tidak dapat membuat server MCP tersedia, giliran gagal
sebelum thread dimulai.

Sesi yang sudah ada mempertahankan runtime dan binding thread Codex-nya. Setelah mengubah
`agentRuntime` atau konfigurasi Computer Use, gunakan `/new` atau `/reset` di chat yang
terdampak sebelum menguji.

## Perintah

Gunakan perintah `/codex computer-use` dari permukaan chat mana pun tempat permukaan
perintah plugin `codex` tersedia. Ini adalah perintah chat/runtime OpenClaw,
bukan subperintah CLI `openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` bersifat hanya baca. Perintah ini tidak menambahkan sumber marketplace, memasang plugin, atau
mengaktifkan dukungan plugin Codex.

`install` mengaktifkan dukungan plugin Codex app-server, secara opsional menambahkan sumber
marketplace yang dikonfigurasi, memasang atau mengaktifkan ulang plugin yang dikonfigurasi melalui Codex
app-server, memuat ulang server MCP, dan memverifikasi bahwa server MCP mengekspos tool.

## Pilihan marketplace

OpenClaw menggunakan API app-server yang sama dengan yang diekspos Codex sendiri. Field
marketplace memilih di mana Codex harus menemukan `computer-use`.

| Field                | Gunakan ketika                                                   | Dukungan pemasangan                                      |
| -------------------- | ---------------------------------------------------------------- | -------------------------------------------------------- |
| Tanpa field marketplace | Anda ingin Codex app-server menggunakan marketplace yang sudah diketahuinya. | Ya, ketika app-server mengembalikan marketplace lokal. |
| `marketplaceSource`  | Anda memiliki sumber marketplace Codex yang dapat ditambahkan app-server. | Ya, untuk `/codex computer-use install` eksplisit. |
| `marketplacePath`    | Anda sudah mengetahui path file marketplace lokal di host.       | Ya, untuk pemasangan eksplisit dan auto-install saat awal giliran. |
| `marketplaceName`    | Anda ingin memilih satu marketplace yang sudah terdaftar berdasarkan nama. | Ya hanya ketika marketplace yang dipilih memiliki path lokal. |

Home Codex baru mungkin memerlukan waktu singkat untuk mengisi marketplace resmi mereka.
Selama pemasangan, OpenClaw melakukan polling `plugin/list` hingga
`marketplaceDiscoveryTimeoutMs` milidetik. Default-nya adalah 60 detik.

Jika beberapa marketplace yang diketahui berisi Computer Use, OpenClaw memprioritaskan
`openai-bundled`, lalu `openai-curated`, lalu `local`. Kecocokan ambigu yang tidak dikenal
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

Jika Anda menggunakan path aplikasi Codex nonstandar, atur `computerUse.marketplacePath` ke
path file marketplace lokal atau jalankan `/codex computer-use install --source
<marketplace-source>` sekali.

## Batas katalog jarak jauh

Codex app-server dapat mencantumkan dan membaca entri katalog yang hanya jarak jauh, tetapi saat ini tidak
mendukung `plugin/install` jarak jauh. Artinya, `marketplaceName` dapat
memilih marketplace yang hanya jarak jauh untuk pemeriksaan status, tetapi pemasangan dan pengaktifan ulang
tetap memerlukan marketplace lokal melalui `marketplaceSource` atau `marketplacePath`.

Jika status mengatakan plugin tersedia di marketplace Codex jarak jauh tetapi pemasangan
jarak jauh tidak didukung, jalankan pemasangan dengan sumber atau path lokal:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Referensi konfigurasi

| Field                           | Default        | Arti                                                                           |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | inferred       | Wajibkan Computer Use. Default ke true ketika field Computer Use lain diatur. |
| `autoInstall`                   | false          | Pasang atau aktifkan ulang dari marketplace yang sudah ditemukan saat awal giliran. |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Berapa lama pemasangan menunggu penemuan marketplace Codex app-server.         |
| `marketplaceSource`             | unset          | String sumber yang diteruskan ke `marketplace/add` Codex app-server.           |
| `marketplacePath`               | unset          | Path file marketplace Codex lokal yang berisi plugin.                          |
| `marketplaceName`               | unset          | Nama marketplace Codex terdaftar yang akan dipilih.                            |
| `pluginName`                    | `computer-use` | Nama plugin marketplace Codex.                                                 |
| `mcpServerName`                 | `computer-use` | Nama server MCP yang diekspos oleh plugin terpasang.                           |

Auto-install saat awal giliran sengaja menolak nilai `marketplaceSource`
yang dikonfigurasi. Menambahkan sumber baru adalah operasi penyiapan eksplisit, jadi gunakan
`/codex computer-use install --source <marketplace-source>` sekali, lalu biarkan
`autoInstall` menangani pengaktifan ulang mendatang dari marketplace lokal yang ditemukan.
Auto-install saat awal giliran dapat menggunakan `marketplacePath` yang dikonfigurasi, karena itu
sudah merupakan path lokal di host.

## Yang diperiksa OpenClaw

OpenClaw melaporkan alasan penyiapan yang stabil secara internal dan memformat status
yang ditampilkan kepada pengguna untuk chat:

| Alasan                       | Arti                                                   | Langkah berikutnya                            |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` diselesaikan menjadi false.      | Atur `enabled` atau field Computer Use lain.  |
| `marketplace_missing`        | Tidak ada marketplace yang cocok tersedia.             | Konfigurasikan sumber, path, atau nama marketplace. |
| `plugin_not_installed`       | Marketplace ada, tetapi plugin tidak terpasang.        | Jalankan install atau aktifkan `autoInstall`. |
| `plugin_disabled`            | Plugin terpasang tetapi dinonaktifkan di konfigurasi Codex. | Jalankan install untuk mengaktifkannya ulang. |
| `remote_install_unsupported` | Marketplace yang dipilih hanya jarak jauh.             | Gunakan `marketplaceSource` atau `marketplacePath`. |
| `mcp_missing`                | Plugin diaktifkan, tetapi server MCP tidak tersedia.   | Periksa Codex Computer Use dan izin OS.       |
| `ready`                      | Plugin dan tool MCP tersedia.                          | Mulai giliran mode Codex.                     |
| `check_failed`               | Permintaan Codex app-server gagal selama pemeriksaan status. | Periksa konektivitas app-server dan log.      |
| `auto_install_blocked`       | Penyiapan saat awal giliran perlu menambahkan sumber baru. | Jalankan install eksplisit terlebih dahulu.   |

Output chat menyertakan status plugin, status server MCP, marketplace, tool
ketika tersedia, dan pesan spesifik untuk langkah penyiapan yang gagal.

## Izin macOS

Computer Use khusus macOS. Server MCP yang dimiliki Codex mungkin memerlukan izin OS
lokal sebelum dapat memeriksa atau mengontrol aplikasi. Jika OpenClaw mengatakan Computer Use
terpasang tetapi server MCP tidak tersedia, verifikasi penyiapan Computer Use sisi Codex
terlebih dahulu:

- Codex app-server berjalan pada host yang sama tempat kontrol desktop harus
  terjadi.
- Plugin Computer Use diaktifkan dalam konfigurasi Codex.
- Server MCP `computer-use` muncul dalam status MCP Codex app-server.
- macOS telah memberikan izin yang diperlukan untuk aplikasi kontrol desktop.
- Sesi host saat ini dapat mengakses desktop yang dikontrol.

OpenClaw sengaja gagal tertutup ketika `computerUse.enabled` bernilai true.
Giliran mode Codex tidak boleh berlanjut secara diam-diam tanpa alat desktop
native yang diwajibkan oleh konfigurasi.

## Pemecahan Masalah

**Status menyatakan tidak terpasang.** Jalankan `/codex computer-use install`. Jika
marketplace tidak ditemukan, berikan `--source` atau `--marketplace-path`.

**Status menyatakan terpasang tetapi dinonaktifkan.** Jalankan `/codex computer-use install` lagi.
Instalasi Codex app-server menulis kembali konfigurasi plugin menjadi aktif.

**Status menyatakan pemasangan jarak jauh tidak didukung.** Gunakan sumber atau
path marketplace lokal. Entri katalog yang hanya remote dapat diperiksa tetapi
tidak dapat dipasang melalui API app-server saat ini.

**Status menyatakan server MCP tidak tersedia.** Jalankan ulang pemasangan sekali agar server
MCP dimuat ulang. Jika tetap tidak tersedia, perbaiki aplikasi Codex Computer Use,
status MCP Codex app-server, atau izin macOS.

**Status atau probe habis waktu pada `computer-use.list_apps`.** Plugin dan server MCP
ada, tetapi bridge Computer Use lokal tidak menjawab. Keluar atau mulai ulang
Codex Computer Use, luncurkan ulang Codex Desktop jika perlu, lalu coba lagi dalam
sesi OpenClaw baru.

**Alat Computer Use menyatakan `Native hook relay unavailable`.** Hook alat native Codex
tidak dapat menjangkau relay OpenClaw yang aktif melalui bridge lokal atau
fallback Gateway. Mulai sesi OpenClaw baru dengan `/new` atau `/reset`. Jika ini
terus terjadi, mulai ulang gateway agar thread app-server lama dan pendaftaran hook
dihapus, lalu coba lagi.

**Pemasangan otomatis saat awal giliran menolak sumber.** Ini disengaja. Tambahkan
sumber dengan `/codex computer-use install --source <marketplace-source>` eksplisit
terlebih dahulu, lalu pemasangan otomatis saat awal giliran berikutnya dapat menggunakan marketplace
lokal yang ditemukan.
