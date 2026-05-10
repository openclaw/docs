---
read_when:
    - Anda ingin agen OpenClaw mode Codex menggunakan Codex Computer Use
    - Anda sedang menentukan pilihan antara Codex Computer Use, PeekabooBridge, dan MCP cua-driver langsung
    - Anda sedang memutuskan antara Codex Computer Use dan penyiapan MCP cua-driver langsung
    - Anda sedang mengonfigurasi computerUse untuk Plugin Codex bawaan
    - Anda sedang memecahkan masalah status atau instalasi /codex computer-use
summary: Siapkan Codex Computer Use untuk agen OpenClaw mode Codex
title: Penggunaan Komputer Codex
x-i18n:
    generated_at: "2026-05-10T19:42:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e1637ad13a96324aebbf97fb179b8c846b27541e917fd56e586c75e79eea7bb
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use adalah plugin MCP bawaan Codex untuk kontrol desktop lokal. OpenClaw
tidak menyertakan aplikasi desktop sebagai vendor, menjalankan tindakan desktop sendiri, atau melewati
izin Codex. Plugin `codex` bawaan hanya menyiapkan server aplikasi Codex:
mengaktifkan dukungan plugin Codex, menemukan atau memasang plugin Codex
Computer Use yang dikonfigurasi, memeriksa bahwa server MCP `computer-use` tersedia, lalu
membiarkan Codex memiliki panggilan alat MCP native selama giliran mode Codex.

Gunakan halaman ini ketika OpenClaw sudah menggunakan harness Codex native. Untuk
penyiapan runtime itu sendiri, lihat [Harness Codex](/id/plugins/codex-harness).

## OpenClaw.app dan Peekaboo

Integrasi Peekaboo OpenClaw.app terpisah dari Codex Computer Use. Aplikasi
macOS dapat meng-host soket PeekabooBridge sehingga CLI `peekaboo` dapat menggunakan kembali
izin Accessibility dan Screen Recording lokal aplikasi untuk alat otomasi
Peekaboo sendiri. Bridge itu tidak memasang atau memproksi Codex Computer Use, dan
Codex Computer Use tidak memanggil melalui soket PeekabooBridge.

Gunakan [Bridge Peekaboo](/id/platforms/mac/peekaboo) ketika Anda ingin OpenClaw.app menjadi
host yang sadar izin untuk otomasi CLI Peekaboo. Gunakan halaman ini ketika
agen OpenClaw mode Codex harus memiliki plugin MCP `computer-use` native Codex
yang tersedia sebelum giliran dimulai.

## Aplikasi iOS

Aplikasi iOS terpisah dari Codex Computer Use. Aplikasi ini tidak memasang atau memproksi
server MCP `computer-use` Codex dan bukan backend kontrol desktop.
Sebaliknya, aplikasi iOS terhubung sebagai node OpenClaw dan mengekspos
kapabilitas seluler melalui perintah node seperti `canvas.*`, `camera.*`, `screen.*`,
`location.*`, dan `talk.*`.

Gunakan [iOS](/id/platforms/ios) ketika Anda ingin agen mengendalikan node iPhone melalui
gateway. Gunakan halaman ini ketika agen mode Codex harus mengontrol desktop
macOS lokal melalui plugin Computer Use native Codex.

## MCP cua-driver langsung

Codex Computer Use bukan satu-satunya cara untuk mengekspos kontrol desktop. Jika Anda ingin
runtime yang dikelola OpenClaw memanggil driver TryCua secara langsung, gunakan server upstream
`cua-driver mcp` melalui registry MCP OpenClaw alih-alih alur marketplace
khusus Codex.

Setelah memasang `cua-driver`, minta perintah OpenClaw darinya:

```bash
cua-driver mcp-config --client openclaw
```

atau daftarkan server stdio sendiri:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Jalur itu mempertahankan permukaan alat MCP upstream tetap utuh, termasuk skema
driver dan respons MCP terstruktur. Gunakan ketika Anda ingin driver CUA
tersedia sebagai server MCP OpenClaw biasa. Gunakan penyiapan Codex Computer Use di
halaman ini ketika server aplikasi Codex harus memiliki instalasi plugin, pemuatan ulang MCP,
dan panggilan alat native di dalam giliran mode Codex.

Driver CUA khusus macOS dan tetap memerlukan izin macOS lokal
yang diminta aplikasinya, seperti Accessibility dan Screen Recording. OpenClaw
tidak memasang `cua-driver`, memberikan izin tersebut, atau melewati model keselamatan
driver upstream.

## Penyiapan cepat

Atur `plugins.entries.codex.config.computerUse` ketika giliran mode Codex harus menyediakan
Computer Use sebelum thread dimulai:

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

Dengan konfigurasi ini, OpenClaw memeriksa server aplikasi Codex sebelum setiap giliran mode Codex.
Jika Computer Use tidak ada tetapi server aplikasi Codex sudah menemukan
marketplace yang dapat dipasang, OpenClaw meminta server aplikasi Codex memasang atau mengaktifkan ulang
plugin dan memuat ulang server MCP. Di macOS, ketika tidak ada marketplace yang cocok
terdaftar dan bundle aplikasi Codex standar ada, OpenClaw juga mencoba
mendaftarkan marketplace Codex bawaan dari
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` sebelum
gagal. Jika penyiapan tetap tidak dapat membuat server MCP tersedia, giliran gagal
sebelum thread dimulai.

Setelah mengubah konfigurasi Computer Use, gunakan `/new` atau `/reset` di chat yang terdampak
sebelum menguji jika thread Codex yang ada sudah dimulai.

## Perintah

Gunakan perintah `/codex computer-use` dari permukaan chat mana pun tempat permukaan perintah
plugin `codex` tersedia. Ini adalah perintah chat/runtime OpenClaw,
bukan subperintah CLI `openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` hanya baca. Perintah ini tidak menambahkan sumber marketplace, memasang plugin, atau
mengaktifkan dukungan plugin Codex.

`install` mengaktifkan dukungan plugin server aplikasi Codex, secara opsional menambahkan sumber
marketplace yang dikonfigurasi, memasang atau mengaktifkan ulang plugin yang dikonfigurasi melalui server aplikasi Codex,
memuat ulang server MCP, dan memverifikasi bahwa server MCP mengekspos alat.

## Pilihan marketplace

OpenClaw menggunakan API server aplikasi yang sama dengan yang diekspos Codex sendiri. Kolom
marketplace memilih tempat Codex harus menemukan `computer-use`.

| Kolom                | Gunakan ketika                                                   | Dukungan pemasangan                                      |
| -------------------- | ---------------------------------------------------------------- | -------------------------------------------------------- |
| Tidak ada kolom marketplace | Anda ingin server aplikasi Codex menggunakan marketplace yang sudah dikenalnya. | Ya, ketika server aplikasi mengembalikan marketplace lokal. |
| `marketplaceSource`  | Anda memiliki sumber marketplace Codex yang dapat ditambahkan server aplikasi. | Ya, untuk `/codex computer-use install` eksplisit.       |
| `marketplacePath`    | Anda sudah mengetahui jalur file marketplace lokal di host.      | Ya, untuk pemasangan eksplisit dan pemasangan otomatis saat giliran dimulai. |
| `marketplaceName`    | Anda ingin memilih satu marketplace yang sudah terdaftar berdasarkan nama. | Ya hanya ketika marketplace yang dipilih memiliki jalur lokal. |

Home Codex baru mungkin memerlukan waktu singkat untuk menyemai marketplace resminya.
Selama pemasangan, OpenClaw melakukan polling `plugin/list` hingga
`marketplaceDiscoveryTimeoutMs` milidetik. Nilai defaultnya adalah 60 detik.

Jika beberapa marketplace yang dikenal berisi Computer Use, OpenClaw memprioritaskan
`openai-bundled`, lalu `openai-curated`, lalu `local`. Kecocokan ambigu yang tidak dikenal
gagal tertutup dan meminta Anda mengatur `marketplaceName` atau `marketplacePath`.

## Marketplace macOS bawaan

Build desktop Codex terbaru menyertakan Computer Use di sini:

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

Jika Anda menggunakan jalur aplikasi Codex nonstandar, atur `computerUse.marketplacePath` ke
jalur file marketplace lokal atau jalankan `/codex computer-use install --source
<marketplace-source>` satu kali.

## Batas katalog jarak jauh

Server aplikasi Codex dapat mencantumkan dan membaca entri katalog yang hanya jarak jauh, tetapi saat ini tidak
mendukung `plugin/install` jarak jauh. Artinya, `marketplaceName` dapat
memilih marketplace yang hanya jarak jauh untuk pemeriksaan status, tetapi pemasangan dan pengaktifan ulang
tetap memerlukan marketplace lokal melalui `marketplaceSource` atau `marketplacePath`.

Jika status mengatakan plugin tersedia di marketplace Codex jarak jauh tetapi pemasangan
jarak jauh tidak didukung, jalankan pemasangan dengan sumber atau jalur lokal:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Referensi konfigurasi

| Kolom                           | Default        | Arti                                                                           |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | inferred       | Mewajibkan Computer Use. Default menjadi true ketika kolom Computer Use lain diatur. |
| `autoInstall`                   | false          | Memasang atau mengaktifkan ulang dari marketplace yang sudah ditemukan saat giliran dimulai. |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Lama waktu pemasangan menunggu penemuan marketplace server aplikasi Codex.     |
| `marketplaceSource`             | unset          | String sumber yang diteruskan ke `marketplace/add` server aplikasi Codex.      |
| `marketplacePath`               | unset          | Jalur file marketplace Codex lokal yang berisi plugin.                         |
| `marketplaceName`               | unset          | Nama marketplace Codex terdaftar yang akan dipilih.                            |
| `pluginName`                    | `computer-use` | Nama plugin marketplace Codex.                                                 |
| `mcpServerName`                 | `computer-use` | Nama server MCP yang diekspos oleh plugin terpasang.                           |

Pemasangan otomatis saat giliran dimulai sengaja menolak nilai `marketplaceSource`
yang dikonfigurasi. Menambahkan sumber baru adalah operasi penyiapan eksplisit, jadi gunakan
`/codex computer-use install --source <marketplace-source>` satu kali, lalu biarkan
`autoInstall` menangani pengaktifan ulang berikutnya dari marketplace lokal yang ditemukan.
Pemasangan otomatis saat giliran dimulai dapat menggunakan `marketplacePath` yang dikonfigurasi, karena itu
sudah merupakan jalur lokal di host.

## Yang diperiksa OpenClaw

OpenClaw melaporkan alasan penyiapan yang stabil secara internal dan memformat status
yang terlihat pengguna untuk chat:

| Alasan                       | Arti                                                   | Langkah berikutnya                              |
| ---------------------------- | ------------------------------------------------------ | ---------------------------------------------- |
| `disabled`                   | `computerUse.enabled` diselesaikan menjadi false.      | Atur `enabled` atau kolom Computer Use lain.   |
| `marketplace_missing`        | Tidak ada marketplace yang cocok tersedia.             | Konfigurasikan sumber, jalur, atau nama marketplace. |
| `plugin_not_installed`       | Marketplace ada, tetapi plugin belum terpasang.        | Jalankan pemasangan atau aktifkan `autoInstall`. |
| `plugin_disabled`            | Plugin terpasang tetapi dinonaktifkan di konfigurasi Codex. | Jalankan pemasangan untuk mengaktifkannya kembali. |
| `remote_install_unsupported` | Marketplace yang dipilih hanya jarak jauh.             | Gunakan `marketplaceSource` atau `marketplacePath`. |
| `mcp_missing`                | Plugin aktif, tetapi server MCP tidak tersedia.        | Periksa Codex Computer Use dan izin OS.        |
| `ready`                      | Plugin dan alat MCP tersedia.                          | Mulai giliran mode Codex.                      |
| `check_failed`               | Permintaan server aplikasi Codex gagal selama pemeriksaan status. | Periksa konektivitas dan log server aplikasi.  |
| `auto_install_blocked`       | Penyiapan saat giliran dimulai perlu menambahkan sumber baru. | Jalankan pemasangan eksplisit terlebih dahulu. |

Output chat menyertakan status plugin, status server MCP, marketplace, alat
ketika tersedia, dan pesan spesifik untuk langkah penyiapan yang gagal.

## Izin macOS

Computer Use khusus macOS. Server MCP milik Codex mungkin memerlukan izin OS
lokal sebelum dapat memeriksa atau mengontrol aplikasi. Jika OpenClaw mengatakan Computer Use
sudah terpasang tetapi server MCP tidak tersedia, verifikasi penyiapan Computer Use sisi Codex
terlebih dahulu:

- Codex app-server berjalan di host yang sama tempat kontrol desktop seharusnya
  terjadi.
- Plugin Computer Use diaktifkan dalam konfigurasi Codex.
- Server MCP `computer-use` muncul dalam status MCP Codex app-server.
- macOS telah memberikan izin yang diperlukan untuk aplikasi desktop-control.
- Sesi host saat ini dapat mengakses desktop yang sedang dikontrol.

OpenClaw sengaja gagal secara tertutup saat `computerUse.enabled` bernilai true. Sebuah
giliran mode Codex tidak boleh berjalan diam-diam tanpa alat desktop native
yang diwajibkan oleh konfigurasi.

## Pemecahan Masalah

**Status mengatakan belum terinstal.** Jalankan `/codex computer-use install`. Jika
marketplace tidak ditemukan, berikan `--source` atau `--marketplace-path`.

**Status mengatakan terinstal tetapi dinonaktifkan.** Jalankan `/codex computer-use install` lagi.
Instalasi Codex app-server menulis kembali konfigurasi Plugin menjadi aktif.

**Status mengatakan instalasi jarak jauh tidak didukung.** Gunakan sumber atau
path marketplace lokal. Entri katalog yang hanya jarak jauh dapat diperiksa tetapi tidak dapat diinstal melalui
API app-server saat ini.

**Status mengatakan server MCP tidak tersedia.** Jalankan ulang instalasi sekali agar server MCP
dimuat ulang. Jika tetap tidak tersedia, perbaiki aplikasi Codex Computer Use,
status MCP Codex app-server, atau izin macOS.

**Status atau probe kehabisan waktu pada `computer-use.list_apps`.** Plugin dan server MCP
ada, tetapi bridge Computer Use lokal tidak menjawab. Keluar atau
mulai ulang Codex Computer Use, luncurkan ulang Codex Desktop jika diperlukan, lalu coba lagi dalam
sesi OpenClaw baru.

**Alat Computer Use mengatakan `Native hook relay unavailable`.** Hook alat native Codex
tidak dapat menjangkau relay OpenClaw aktif melalui bridge lokal atau
fallback Gateway. Mulai sesi OpenClaw baru dengan `/new` atau `/reset`. Jika
terus terjadi, mulai ulang gateway agar thread app-server lama dan registrasi hook
dihapus, lalu coba lagi.

**Instalasi otomatis saat awal giliran menolak sebuah sumber.** Ini disengaja. Tambahkan
sumber dengan `/codex computer-use install --source <marketplace-source>` yang eksplisit
terlebih dahulu, lalu instalasi otomatis saat awal giliran berikutnya dapat menggunakan
marketplace lokal yang ditemukan.

## Terkait

- [Harness Codex](/id/plugins/codex-harness)
- [Bridge Peekaboo](/id/platforms/mac/peekaboo)
- [Aplikasi iOS](/id/platforms/ios)
