---
read_when:
    - Menghubungkan Codex, Claude Code, atau klien MCP lain ke kanal yang didukung OpenClaw
    - Menjalankan `openclaw mcp serve`
    - Mengelola definisi server MCP tersimpan OpenClaw
summary: Tampilkan percakapan kanal OpenClaw melalui MCP dan kelola definisi server MCP yang disimpan
title: MCP
x-i18n:
    generated_at: "2026-04-24T09:02:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: b9df42ebc547f07698f84888d8cd6125340d0f0e02974a965670844589e1fbf8
    source_path: cli/mcp.md
    workflow: 15
---

`openclaw mcp` memiliki dua fungsi:

- menjalankan OpenClaw sebagai server MCP dengan `openclaw mcp serve`
- mengelola definisi server MCP keluar yang dimiliki OpenClaw dengan `list`, `show`,
  `set`, dan `unset`

Dengan kata lain:

- `serve` adalah OpenClaw yang bertindak sebagai server MCP
- `list` / `show` / `set` / `unset` adalah OpenClaw yang bertindak sebagai registry
  sisi klien MCP untuk server MCP lain yang runtime-nya mungkin digunakan nanti

Gunakan [`openclaw acp`](/id/cli/acp) ketika OpenClaw harus meng-host sesi coding harness
itu sendiri dan merutekan runtime tersebut melalui ACP.

## OpenClaw sebagai server MCP

Ini adalah jalur `openclaw mcp serve`.

## Kapan menggunakan `serve`

Gunakan `openclaw mcp serve` ketika:

- Codex, Claude Code, atau klien MCP lain harus berbicara langsung dengan
  percakapan kanal yang didukung OpenClaw
- Anda sudah memiliki Gateway OpenClaw lokal atau remote dengan sesi yang sudah dirutekan
- Anda menginginkan satu server MCP yang bekerja di seluruh backend kanal OpenClaw alih-alih
  menjalankan bridge terpisah per kanal

Gunakan [`openclaw acp`](/id/cli/acp) sebagai gantinya ketika OpenClaw harus meng-host runtime
coding itu sendiri dan mempertahankan sesi agen di dalam OpenClaw.

## Cara kerjanya

`openclaw mcp serve` memulai server MCP stdio. Klien MCP memiliki proses
tersebut. Selama klien mempertahankan sesi stdio tetap terbuka, bridge terhubung ke
Gateway OpenClaw lokal atau remote melalui WebSocket dan menampilkan percakapan kanal
yang sudah dirutekan melalui MCP.

Siklus hidup:

1. klien MCP menjalankan `openclaw mcp serve`
2. bridge terhubung ke Gateway
3. sesi yang sudah dirutekan menjadi percakapan MCP dan tool transkrip/riwayat
4. event live diantrikan di memori selama bridge terhubung
5. jika mode kanal Claude diaktifkan, sesi yang sama juga dapat menerima
   notifikasi push khusus Claude

Perilaku penting:

- status antrean live dimulai saat bridge terhubung
- riwayat transkrip yang lebih lama dibaca dengan `messages_read`
- notifikasi push Claude hanya ada selama sesi MCP masih hidup
- ketika klien terputus, bridge keluar dan antrean live hilang
- server MCP stdio yang dijalankan oleh OpenClaw (bawaan atau dikonfigurasi pengguna) akan
  dimatikan sebagai pohon proses saat shutdown, sehingga subproses turunan yang dimulai oleh
  server tidak bertahan setelah klien stdio induk keluar
- menghapus atau mereset sesi akan membuang klien MCP sesi tersebut melalui
  jalur cleanup runtime bersama, sehingga tidak ada koneksi stdio yang tertinggal
  terkait sesi yang dihapus

## Pilih mode klien

Gunakan bridge yang sama dengan dua cara berbeda:

- Klien MCP generik: hanya tool MCP standar. Gunakan `conversations_list`,
  `messages_read`, `events_poll`, `events_wait`, `messages_send`, dan
  tool persetujuan.
- Claude Code: tool MCP standar plus adaptor kanal khusus Claude.
  Aktifkan `--claude-channel-mode on` atau biarkan default `auto`.

Saat ini, `auto` berperilaku sama seperti `on`. Belum ada deteksi kapabilitas
klien.

## Apa yang ditampilkan `serve`

Bridge menggunakan metadata route sesi Gateway yang sudah ada untuk menampilkan
percakapan yang didukung kanal. Sebuah percakapan muncul ketika OpenClaw sudah memiliki status
sesi dengan route yang diketahui seperti:

- `channel`
- metadata penerima atau tujuan
- `accountId` opsional
- `threadId` opsional

Ini memberi klien MCP satu tempat untuk:

- mencantumkan percakapan yang baru saja dirutekan
- membaca riwayat transkrip terbaru
- menunggu event inbound baru
- mengirim balasan kembali melalui route yang sama
- melihat permintaan persetujuan yang tiba saat bridge terhubung

## Penggunaan

```bash
# Gateway Lokal
openclaw mcp serve

# Gateway Remote
openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Gateway remote dengan autentikasi password
openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password

# Aktifkan log bridge verbose
openclaw mcp serve --verbose

# Nonaktifkan notifikasi push khusus Claude
openclaw mcp serve --claude-channel-mode off
```

## Tool bridge

Bridge saat ini menampilkan tool MCP berikut:

- `conversations_list`
- `conversation_get`
- `messages_read`
- `attachments_fetch`
- `events_poll`
- `events_wait`
- `messages_send`
- `permissions_list_open`
- `permissions_respond`

### `conversations_list`

Mencantumkan percakapan berbasis sesi terbaru yang sudah memiliki metadata route di
status sesi Gateway.

Filter yang berguna:

- `limit`
- `search`
- `channel`
- `includeDerivedTitles`
- `includeLastMessage`

### `conversation_get`

Mengembalikan satu percakapan berdasarkan `session_key`.

### `messages_read`

Membaca pesan transkrip terbaru untuk satu percakapan berbasis sesi.

### `attachments_fetch`

Mengekstrak blok konten pesan non-teks dari satu pesan transkrip. Ini adalah
tampilan metadata atas konten transkrip, bukan penyimpanan blob lampiran tahan lama
yang berdiri sendiri.

### `events_poll`

Membaca event live yang diantrikan sejak kursor numerik.

### `events_wait`

Long-poll hingga event yang cocok berikutnya tiba atau timeout berakhir.

Gunakan ini ketika klien MCP generik memerlukan pengiriman mendekati real-time tanpa
protokol push khusus Claude.

### `messages_send`

Mengirim teks kembali melalui route yang sama yang sudah direkam pada sesi.

Perilaku saat ini:

- memerlukan route percakapan yang sudah ada
- menggunakan kanal sesi, penerima, account id, dan thread id sesi
- hanya mengirim teks

### `permissions_list_open`

Mencantumkan permintaan persetujuan exec/Plugin tertunda yang telah diamati bridge sejak
terhubung ke Gateway.

### `permissions_respond`

Menyelesaikan satu permintaan persetujuan exec/Plugin tertunda dengan:

- `allow-once`
- `allow-always`
- `deny`

## Model event

Bridge mempertahankan antrean event di memori selama bridge terhubung.

Jenis event saat ini:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

Batasan penting:

- antrean hanya live; dimulai saat bridge MCP dimulai
- `events_poll` dan `events_wait` tidak memutar ulang riwayat Gateway yang lebih lama
  dengan sendirinya
- backlog tahan lama sebaiknya dibaca dengan `messages_read`

## Notifikasi kanal Claude

Bridge juga dapat menampilkan notifikasi kanal khusus Claude. Ini adalah
padanan OpenClaw untuk adaptor kanal Claude Code: tool MCP standar tetap
tersedia, tetapi pesan inbound live juga dapat tiba sebagai notifikasi MCP khusus Claude.

Flag:

- `--claude-channel-mode off`: hanya tool MCP standar
- `--claude-channel-mode on`: aktifkan notifikasi kanal Claude
- `--claude-channel-mode auto`: default saat ini; perilaku bridge sama seperti `on`

Saat mode kanal Claude diaktifkan, server mengiklankan kapabilitas eksperimental Claude
dan dapat memancarkan:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Perilaku bridge saat ini:

- pesan transkrip inbound `user` diteruskan sebagai
  `notifications/claude/channel`
- permintaan izin Claude yang diterima melalui MCP dilacak di memori
- jika percakapan tertaut kemudian mengirim `yes abcde` atau `no abcde`, bridge
  mengonversinya menjadi `notifications/claude/channel/permission`
- notifikasi ini hanya berlaku untuk sesi live; jika klien MCP terputus,
  tidak ada target push

Ini sengaja bersifat khusus klien. Klien MCP generik harus mengandalkan
tool polling standar.

## Konfigurasi klien MCP

Contoh konfigurasi klien stdio:

```json
{
  "mcpServers": {
    "openclaw": {
      "command": "openclaw",
      "args": [
        "mcp",
        "serve",
        "--url",
        "wss://gateway-host:18789",
        "--token-file",
        "/path/to/gateway.token"
      ]
    }
  }
}
```

Untuk sebagian besar klien MCP generik, mulai dengan permukaan tool standar dan abaikan
mode Claude. Aktifkan mode Claude hanya untuk klien yang benar-benar memahami
metode notifikasi khusus Claude.

## Opsi

`openclaw mcp serve` mendukung:

- `--url <url>`: URL WebSocket Gateway
- `--token <token>`: token Gateway
- `--token-file <path>`: baca token dari file
- `--password <password>`: password Gateway
- `--password-file <path>`: baca password dari file
- `--claude-channel-mode <auto|on|off>`: mode notifikasi Claude
- `-v`, `--verbose`: log verbose ke stderr

Gunakan `--token-file` atau `--password-file` daripada secret inline jika memungkinkan.

## Keamanan dan batas kepercayaan

Bridge tidak menciptakan routing. Bridge hanya menampilkan percakapan yang
sudah diketahui Gateway cara merutekannya.

Artinya:

- allowlist pengirim, pairing, dan kepercayaan tingkat kanal tetap menjadi
  bagian dari konfigurasi kanal OpenClaw yang mendasarinya
- `messages_send` hanya dapat membalas melalui route tersimpan yang sudah ada
- status persetujuan hanya live/di memori untuk sesi bridge saat ini
- autentikasi bridge harus menggunakan kontrol token atau password Gateway yang sama seperti yang Anda
  percaya untuk klien Gateway remote lainnya

Jika suatu percakapan tidak ada di `conversations_list`, penyebab biasanya bukan
konfigurasi MCP. Penyebabnya adalah metadata route yang hilang atau tidak lengkap pada sesi
Gateway yang mendasarinya.

## Pengujian

OpenClaw menyediakan smoke Docker deterministik untuk bridge ini:

```bash
pnpm test:docker:mcp-channels
```

Smoke tersebut:

- memulai container Gateway yang sudah diseed
- memulai container kedua yang menjalankan `openclaw mcp serve`
- memverifikasi penemuan percakapan, pembacaan transkrip, pembacaan metadata lampiran,
  perilaku antrean event live, dan routing pengiriman keluar
- memvalidasi notifikasi kanal dan izin bergaya Claude melalui bridge MCP stdio
  yang nyata

Ini adalah cara tercepat untuk membuktikan bridge berfungsi tanpa menghubungkan akun
Telegram, Discord, atau iMessage nyata ke dalam test run.

Untuk konteks pengujian yang lebih luas, lihat [Testing](/id/help/testing).

## Pemecahan masalah

### Tidak ada percakapan yang dikembalikan

Biasanya berarti sesi Gateway belum dapat dirutekan. Pastikan bahwa sesi
yang mendasarinya memiliki metadata route channel/provider, penerima, dan
account/thread opsional yang tersimpan.

### `events_poll` atau `events_wait` melewatkan pesan lama

Ini memang diharapkan. Antrean live dimulai saat bridge terhubung. Baca riwayat transkrip
yang lebih lama dengan `messages_read`.

### Notifikasi Claude tidak muncul

Periksa semua hal berikut:

- klien mempertahankan sesi MCP stdio tetap terbuka
- `--claude-channel-mode` adalah `on` atau `auto`
- klien benar-benar memahami metode notifikasi khusus Claude
- pesan inbound terjadi setelah bridge terhubung

### Persetujuan tidak ada

`permissions_list_open` hanya menampilkan permintaan persetujuan yang diamati saat bridge
terhubung. Ini bukan API riwayat persetujuan yang tahan lama.

## OpenClaw sebagai registry klien MCP

Ini adalah jalur `openclaw mcp list`, `show`, `set`, dan `unset`.

Perintah-perintah ini tidak menampilkan OpenClaw melalui MCP. Perintah-perintah ini mengelola definisi server MCP
yang dimiliki OpenClaw di bawah `mcp.servers` dalam konfigurasi OpenClaw.

Definisi yang disimpan tersebut ditujukan untuk runtime yang dijalankan atau dikonfigurasi
OpenClaw nanti, seperti Pi tertanam dan adaptor runtime lainnya. OpenClaw menyimpan
definisi secara terpusat sehingga runtime tersebut tidak perlu menyimpan daftar server
MCP duplikat sendiri.

Perilaku penting:

- perintah-perintah ini hanya membaca atau menulis konfigurasi OpenClaw
- perintah-perintah ini tidak terhubung ke server MCP target
- perintah-perintah ini tidak memvalidasi apakah perintah, URL, atau transport remote
  dapat dijangkau saat ini
- adaptor runtime memutuskan bentuk transport mana yang benar-benar didukung pada
  waktu eksekusi
- Pi tertanam menampilkan tool MCP yang dikonfigurasi dalam profil tool `coding` dan `messaging`
  normal; `minimal` tetap menyembunyikannya, dan `tools.deny: ["bundle-mcp"]`
  menonaktifkannya secara eksplisit

## Definisi server MCP tersimpan

OpenClaw juga menyimpan registry server MCP ringan dalam konfigurasi untuk permukaan
yang menginginkan definisi MCP yang dikelola OpenClaw.

Perintah:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

Catatan:

- `list` mengurutkan nama server.
- `show` tanpa nama mencetak objek server MCP yang dikonfigurasi secara lengkap.
- `set` mengharapkan satu nilai objek JSON pada baris perintah.
- `unset` gagal jika server bernama tersebut tidak ada.

Contoh:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp set docs '{"url":"https://mcp.example.com"}'
openclaw mcp unset context7
```

Contoh bentuk konfigurasi:

```json
{
  "mcp": {
    "servers": {
      "context7": {
        "command": "uvx",
        "args": ["context7-mcp"]
      },
      "docs": {
        "url": "https://mcp.example.com"
      }
    }
  }
}
```

### Transport stdio

Menjalankan proses anak lokal dan berkomunikasi melalui stdin/stdout.

| Field                      | Deskripsi                            |
| -------------------------- | ------------------------------------ |
| `command`                  | Executable yang dijalankan (wajib)   |
| `args`                     | Array argumen command-line           |
| `env`                      | Variabel lingkungan tambahan         |
| `cwd` / `workingDirectory` | Direktori kerja untuk proses tersebut |

#### Filter keamanan env stdio

OpenClaw menolak key env startup interpreter yang dapat mengubah cara server MCP stdio dijalankan sebelum RPC pertama, meskipun key tersebut muncul dalam blok `env` server. Key yang diblokir mencakup `NODE_OPTIONS`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4`, dan variabel kontrol runtime serupa. Startup menolak key-key ini dengan error konfigurasi agar key tersebut tidak dapat menyuntikkan prelude implisit, menukar interpreter, atau mengaktifkan debugger terhadap proses stdio. Env var biasa untuk kredensial, proxy, dan spesifik server (`GITHUB_TOKEN`, `HTTP_PROXY`, `*_API_KEY` kustom, dll.) tidak terpengaruh.

Jika server MCP Anda benar-benar memerlukan salah satu variabel yang diblokir, setel variabel itu pada proses host gateway, bukan di bawah `env` server stdio.

### Transport SSE / HTTP

Terhubung ke server MCP remote melalui HTTP Server-Sent Events.

| Field                 | Deskripsi                                                            |
| --------------------- | -------------------------------------------------------------------- |
| `url`                 | URL HTTP atau HTTPS dari server remote (wajib)                       |
| `headers`             | Peta key-value opsional dari header HTTP (misalnya token autentikasi) |
| `connectionTimeoutMs` | Timeout koneksi per server dalam ms (opsional)                       |

Contoh:

```json
{
  "mcp": {
    "servers": {
      "remote-tools": {
        "url": "https://mcp.example.com",
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

Nilai sensitif dalam `url` (userinfo) dan `headers` disamarkan dalam log dan
output status.

### Transport HTTP streaming

`streamable-http` adalah opsi transport tambahan selain `sse` dan `stdio`. Transport ini menggunakan streaming HTTP untuk komunikasi dua arah dengan server MCP remote.

| Field                 | Deskripsi                                                                                |
| --------------------- | ---------------------------------------------------------------------------------------- |
| `url`                 | URL HTTP atau HTTPS dari server remote (wajib)                                           |
| `transport`           | Setel ke `"streamable-http"` untuk memilih transport ini; jika dihilangkan, OpenClaw menggunakan `sse` |
| `headers`             | Peta key-value opsional dari header HTTP (misalnya token autentikasi)                    |
| `connectionTimeoutMs` | Timeout koneksi per server dalam ms (opsional)                                           |

Contoh:

```json
{
  "mcp": {
    "servers": {
      "streaming-tools": {
        "url": "https://mcp.example.com/stream",
        "transport": "streamable-http",
        "connectionTimeoutMs": 10000,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

Perintah-perintah ini hanya mengelola konfigurasi yang disimpan. Perintah-perintah ini tidak memulai bridge kanal,
membuka sesi klien MCP live, atau membuktikan bahwa server target dapat dijangkau.

## Batasan saat ini

Halaman ini mendokumentasikan bridge sebagaimana dirilis saat ini.

Batasan saat ini:

- penemuan percakapan bergantung pada metadata route sesi Gateway yang sudah ada
- belum ada protokol push generik selain adaptor khusus Claude
- belum ada tool edit pesan atau reaksi
- transport HTTP/SSE/streamable-http terhubung ke satu server remote; belum ada upstream termultipleks
- `permissions_list_open` hanya mencakup persetujuan yang diamati saat bridge sedang
  terhubung

## Terkait

- [Referensi CLI](/id/cli)
- [Plugins](/id/cli/plugins)
