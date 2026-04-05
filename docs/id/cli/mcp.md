---
read_when:
    - Menghubungkan Codex, Claude Code, atau klien MCP lain ke saluran yang didukung OpenClaw
    - Menjalankan `openclaw mcp serve`
    - Mengelola definisi server MCP tersimpan milik OpenClaw
summary: Mengekspos percakapan saluran OpenClaw melalui MCP dan mengelola definisi server MCP tersimpan
title: mcp
x-i18n:
    generated_at: "2026-04-05T13:49:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: b35de9e14f96666eeca2f93c06cb214e691152f911d45ee778efe9cf5bf96cc2
    source_path: cli/mcp.md
    workflow: 15
---

# mcp

`openclaw mcp` memiliki dua tugas:

- menjalankan OpenClaw sebagai server MCP dengan `openclaw mcp serve`
- mengelola definisi server MCP keluar milik OpenClaw dengan `list`, `show`,
  `set`, dan `unset`

Dengan kata lain:

- `serve` adalah OpenClaw yang bertindak sebagai server MCP
- `list` / `show` / `set` / `unset` adalah OpenClaw yang bertindak sebagai
  registri sisi klien MCP untuk server MCP lain yang mungkin digunakan oleh
  runtime-nya nanti

Gunakan [`openclaw acp`](/cli/acp) saat OpenClaw harus meng-host sesi harness
pengodean itu sendiri dan merutekan runtime tersebut melalui ACP.

## OpenClaw sebagai server MCP

Ini adalah jalur `openclaw mcp serve`.

## Kapan menggunakan `serve`

Gunakan `openclaw mcp serve` saat:

- Codex, Claude Code, atau klien MCP lain harus berbicara langsung dengan
  percakapan saluran yang didukung OpenClaw
- Anda sudah memiliki Gateway OpenClaw lokal atau jarak jauh dengan sesi yang
  telah dirutekan
- Anda menginginkan satu server MCP yang berfungsi di seluruh backend saluran
  OpenClaw alih-alih menjalankan bridge terpisah per saluran

Gunakan [`openclaw acp`](/cli/acp) sebagai gantinya saat OpenClaw harus
meng-host runtime pengodean itu sendiri dan menjaga sesi agen tetap berada di
dalam OpenClaw.

## Cara kerjanya

`openclaw mcp serve` memulai server MCP stdio. Klien MCP memiliki proses
tersebut. Selama klien mempertahankan sesi stdio tetap terbuka, bridge akan
terhubung ke Gateway OpenClaw lokal atau jarak jauh melalui WebSocket dan
mengekspos percakapan saluran yang telah dirutekan melalui MCP.

Siklus hidup:

1. klien MCP memunculkan `openclaw mcp serve`
2. bridge terhubung ke Gateway
3. sesi yang telah dirutekan menjadi percakapan MCP serta alat transkrip/riwayat
4. peristiwa langsung diantrikan di memori selama bridge terhubung
5. jika mode saluran Claude diaktifkan, sesi yang sama juga dapat menerima
   notifikasi push khusus Claude

Perilaku penting:

- status antrean langsung dimulai saat bridge terhubung
- riwayat transkrip lama dibaca dengan `messages_read`
- notifikasi push Claude hanya ada selama sesi MCP masih aktif
- saat klien terputus, bridge berhenti dan antrean langsung hilang

## Pilih mode klien

Gunakan bridge yang sama dengan dua cara berbeda:

- Klien MCP generik: hanya alat MCP standar. Gunakan `conversations_list`,
  `messages_read`, `events_poll`, `events_wait`, `messages_send`, dan alat
  persetujuan.
- Claude Code: alat MCP standar ditambah adaptor saluran khusus Claude.
  Aktifkan `--claude-channel-mode on` atau biarkan default `auto`.

Saat ini, `auto` berperilaku sama dengan `on`. Belum ada deteksi kemampuan
klien.

## Yang diekspos oleh `serve`

Bridge menggunakan metadata rute sesi Gateway yang sudah ada untuk mengekspos
percakapan berbasis saluran. Sebuah percakapan muncul saat OpenClaw sudah
memiliki status sesi dengan rute yang diketahui seperti:

- `channel`
- metadata penerima atau tujuan
- `accountId` opsional
- `threadId` opsional

Ini memberi klien MCP satu tempat untuk:

- mencantumkan percakapan yang baru dirutekan
- membaca riwayat transkrip terbaru
- menunggu peristiwa masuk baru
- mengirim balasan kembali melalui rute yang sama
- melihat permintaan persetujuan yang tiba saat bridge terhubung

## Penggunaan

```bash
# Gateway lokal
openclaw mcp serve

# Gateway jarak jauh
openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Gateway jarak jauh dengan autentikasi kata sandi
openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password

# Aktifkan log bridge verbose
openclaw mcp serve --verbose

# Nonaktifkan notifikasi push khusus Claude
openclaw mcp serve --claude-channel-mode off
```

## Alat bridge

Bridge saat ini mengekspos alat MCP berikut:

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

Mencantumkan percakapan terbaru berbasis sesi yang sudah memiliki metadata rute
dalam status sesi Gateway.

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
tampilan metadata atas konten transkrip, bukan penyimpanan blob lampiran tahan
lama yang berdiri sendiri.

### `events_poll`

Membaca peristiwa langsung yang diantrikan sejak kursor numerik.

### `events_wait`

Melakukan long-polling hingga peristiwa antrean berikutnya yang cocok tiba atau
batas waktu habis.

Gunakan ini saat klien MCP generik membutuhkan pengiriman hampir real-time
tanpa protokol push khusus Claude.

### `messages_send`

Mengirim teks kembali melalui rute yang sama yang sudah tercatat pada sesi.

Perilaku saat ini:

- memerlukan rute percakapan yang sudah ada
- menggunakan channel, penerima, id akun, dan id thread milik sesi
- hanya mengirim teks

### `permissions_list_open`

Mencantumkan permintaan persetujuan exec/plugin tertunda yang telah diamati oleh
bridge sejak terhubung ke Gateway.

### `permissions_respond`

Menyelesaikan satu permintaan persetujuan exec/plugin tertunda dengan:

- `allow-once`
- `allow-always`
- `deny`

## Model peristiwa

Bridge menyimpan antrean peristiwa di memori selama terhubung.

Jenis peristiwa saat ini:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

Batasan penting:

- antrean bersifat live-only; antrean dimulai saat bridge MCP dimulai
- `events_poll` dan `events_wait` tidak memutar ulang riwayat Gateway yang
  lebih lama dengan sendirinya
- backlog tahan lama harus dibaca dengan `messages_read`

## Notifikasi saluran Claude

Bridge juga dapat mengekspos notifikasi saluran khusus Claude. Ini adalah
padanan OpenClaw untuk adaptor saluran Claude Code: alat MCP standar tetap
tersedia, tetapi pesan masuk langsung juga dapat tiba sebagai notifikasi MCP
khusus Claude.

Flag:

- `--claude-channel-mode off`: hanya alat MCP standar
- `--claude-channel-mode on`: aktifkan notifikasi saluran Claude
- `--claude-channel-mode auto`: default saat ini; perilaku bridge sama seperti `on`

Saat mode saluran Claude diaktifkan, server mengiklankan kemampuan eksperimental
Claude dan dapat memancarkan:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Perilaku bridge saat ini:

- pesan transkrip masuk `user` diteruskan sebagai
  `notifications/claude/channel`
- permintaan persetujuan Claude yang diterima melalui MCP dilacak di memori
- jika percakapan terkait kemudian mengirim `yes abcde` atau `no abcde`, bridge
  mengubahnya menjadi `notifications/claude/channel/permission`
- notifikasi ini hanya berlaku untuk sesi langsung; jika klien MCP terputus,
  tidak ada target push

Ini memang khusus klien. Klien MCP generik harus mengandalkan alat polling
standar.

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

Untuk sebagian besar klien MCP generik, mulai dengan permukaan alat standar dan
abaikan mode Claude. Aktifkan mode Claude hanya untuk klien yang benar-benar
memahami metode notifikasi khusus Claude.

## Opsi

`openclaw mcp serve` mendukung:

- `--url <url>`: URL WebSocket Gateway
- `--token <token>`: token Gateway
- `--token-file <path>`: baca token dari file
- `--password <password>`: kata sandi Gateway
- `--password-file <path>`: baca kata sandi dari file
- `--claude-channel-mode <auto|on|off>`: mode notifikasi Claude
- `-v`, `--verbose`: log verbose di stderr

Sebaiknya gunakan `--token-file` atau `--password-file` daripada secret inline
jika memungkinkan.

## Keamanan dan batas kepercayaan

Bridge tidak menciptakan perutean. Bridge hanya mengekspos percakapan yang
sudah diketahui Gateway cara merutekannya.

Artinya:

- daftar izin pengirim, pairing, dan trust tingkat saluran tetap menjadi bagian
  dari konfigurasi saluran OpenClaw yang mendasarinya
- `messages_send` hanya dapat membalas melalui rute tersimpan yang sudah ada
- status persetujuan hanya bersifat langsung/di memori untuk sesi bridge saat
  ini
- autentikasi bridge harus menggunakan kontrol token atau kata sandi Gateway
  yang sama seperti yang Anda percayai untuk klien Gateway jarak jauh lainnya

Jika sebuah percakapan hilang dari `conversations_list`, penyebab umumnya bukan
konfigurasi MCP. Penyebabnya adalah metadata rute yang hilang atau tidak lengkap
dalam sesi Gateway yang mendasarinya.

## Pengujian

OpenClaw menyediakan smoke Docker yang deterministik untuk bridge ini:

```bash
pnpm test:docker:mcp-channels
```

Smoke tersebut:

- memulai container Gateway yang telah di-seed
- memulai container kedua yang memunculkan `openclaw mcp serve`
- memverifikasi penemuan percakapan, pembacaan transkrip, pembacaan metadata
  lampiran, perilaku antrean peristiwa langsung, dan perutean pengiriman keluar
- memvalidasi notifikasi saluran dan persetujuan bergaya Claude melalui bridge
  stdio MCP yang nyata

Ini adalah cara tercepat untuk membuktikan bahwa bridge berfungsi tanpa harus
menghubungkan akun Telegram, Discord, atau iMessage nyata ke dalam proses uji.

Untuk konteks pengujian yang lebih luas, lihat [Testing](/help/testing).

## Pemecahan masalah

### Tidak ada percakapan yang dikembalikan

Biasanya berarti sesi Gateway belum dapat dirutekan. Pastikan bahwa sesi yang
mendasarinya memiliki metadata rute channel/provider, penerima, serta
account/thread opsional yang tersimpan.

### `events_poll` atau `events_wait` melewatkan pesan lama

Memang begitu. Antrean langsung dimulai saat bridge terhubung. Baca riwayat
transkrip yang lebih lama dengan `messages_read`.

### Notifikasi Claude tidak muncul

Periksa semua hal berikut:

- klien mempertahankan sesi stdio MCP tetap terbuka
- `--claude-channel-mode` bernilai `on` atau `auto`
- klien benar-benar memahami metode notifikasi khusus Claude
- pesan masuk terjadi setelah bridge terhubung

### Persetujuan hilang

`permissions_list_open` hanya menampilkan permintaan persetujuan yang diamati
saat bridge terhubung. Ini bukan API riwayat persetujuan yang tahan lama.

## OpenClaw sebagai registri klien MCP

Ini adalah jalur `openclaw mcp list`, `show`, `set`, dan `unset`.

Perintah-perintah ini tidak mengekspos OpenClaw melalui MCP. Perintah-perintah
ini mengelola definisi server MCP milik OpenClaw di bawah `mcp.servers` dalam
konfigurasi OpenClaw.

Definisi yang disimpan tersebut ditujukan untuk runtime yang nanti diluncurkan
atau dikonfigurasi oleh OpenClaw, seperti Pi tertanam dan adaptor runtime
lainnya. OpenClaw menyimpan definisi secara terpusat agar runtime tersebut tidak
perlu menyimpan daftar server MCP duplikat mereka sendiri.

Perilaku penting:

- perintah-perintah ini hanya membaca atau menulis konfigurasi OpenClaw
- perintah-perintah ini tidak terhubung ke server MCP target
- perintah-perintah ini tidak memvalidasi apakah perintah, URL, atau transport
  jarak jauh dapat dijangkau saat ini
- adaptor runtime memutuskan bentuk transport mana yang benar-benar didukung
  pada waktu eksekusi

## Definisi server MCP tersimpan

OpenClaw juga menyimpan registri server MCP ringan dalam konfigurasi untuk
permukaan yang menginginkan definisi MCP yang dikelola OpenClaw.

Perintah:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

Catatan:

- `list` mengurutkan nama server.
- `show` tanpa nama mencetak objek server MCP terkonfigurasi lengkap.
- `set` mengharapkan satu nilai objek JSON pada command line.
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

Meluncurkan proses child lokal dan berkomunikasi melalui stdin/stdout.

| Field                      | Deskripsi                           |
| -------------------------- | ----------------------------------- |
| `command`                  | Executable yang akan dimunculkan (wajib) |
| `args`                     | Array argumen command line          |
| `env`                      | Variabel lingkungan tambahan        |
| `cwd` / `workingDirectory` | Direktori kerja untuk proses        |

### Transport SSE / HTTP

Terhubung ke server MCP jarak jauh melalui HTTP Server-Sent Events.

| Field                 | Deskripsi                                                           |
| --------------------- | ------------------------------------------------------------------- |
| `url`                 | URL HTTP atau HTTPS server jarak jauh (wajib)                       |
| `headers`             | Peta key-value header HTTP opsional (misalnya token auth)           |
| `connectionTimeoutMs` | Batas waktu koneksi per server dalam ms (opsional)                  |

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

Nilai sensitif di `url` (userinfo) dan `headers` disamarkan dalam log dan
output status.

### Transport Streamable HTTP

`streamable-http` adalah opsi transport tambahan di samping `sse` dan `stdio`.
Transport ini menggunakan streaming HTTP untuk komunikasi dua arah dengan server
MCP jarak jauh.

| Field                 | Deskripsi                                                                             |
| --------------------- | ------------------------------------------------------------------------------------- |
| `url`                 | URL HTTP atau HTTPS server jarak jauh (wajib)                                         |
| `transport`           | Setel ke `"streamable-http"` untuk memilih transport ini; jika dihilangkan, OpenClaw menggunakan `sse` |
| `headers`             | Peta key-value header HTTP opsional (misalnya token auth)                             |
| `connectionTimeoutMs` | Batas waktu koneksi per server dalam ms (opsional)                                    |

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

Perintah-perintah ini hanya mengelola konfigurasi yang disimpan. Perintah-
perintah ini tidak memulai bridge saluran, membuka sesi klien MCP langsung, atau
membuktikan bahwa server target dapat dijangkau.

## Batasan saat ini

Halaman ini mendokumentasikan bridge sebagaimana dikirim saat ini.

Batasan saat ini:

- penemuan percakapan bergantung pada metadata rute sesi Gateway yang sudah ada
- belum ada protokol push generik selain adaptor khusus Claude
- belum ada alat edit pesan atau react
- transport HTTP/SSE/streamable-http terhubung ke satu server jarak jauh; belum
  ada upstream multipleks
- `permissions_list_open` hanya mencakup persetujuan yang diamati saat bridge
  terhubung
