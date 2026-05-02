---
read_when:
    - Menghubungkan Codex, Claude Code, atau klien MCP lain ke saluran yang didukung OpenClaw
    - Menjalankan `openclaw mcp serve`
    - Mengelola definisi server MCP yang disimpan OpenClaw
sidebarTitle: MCP
summary: Ekspos percakapan saluran OpenClaw melalui MCP dan kelola definisi server MCP yang tersimpan
title: MCP
x-i18n:
    generated_at: "2026-05-02T20:42:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: d1d3b5d7c3a9075c020a35bc9617d6e6902c96b40cc03e76119d01d0d94fd014
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` memiliki dua tugas:

- menjalankan OpenClaw sebagai server MCP dengan `openclaw mcp serve`
- mengelola definisi server MCP outbound milik OpenClaw dengan `list`, `show`, `set`, dan `unset`

Dengan kata lain:

- `serve` adalah OpenClaw yang bertindak sebagai server MCP
- `list` / `show` / `set` / `unset` adalah OpenClaw yang bertindak sebagai registri sisi klien MCP untuk server MCP lain yang mungkin digunakan runtime-nya nanti

Gunakan [`openclaw acp`](/id/cli/acp) saat OpenClaw harus menghosting sesi harness pengodean itu sendiri dan merutekan runtime tersebut melalui ACP.

## OpenClaw sebagai server MCP

Ini adalah jalur `openclaw mcp serve`.

### Kapan menggunakan `serve`

Gunakan `openclaw mcp serve` saat:

- Codex, Claude Code, atau klien MCP lain harus berbicara langsung ke percakapan channel yang didukung OpenClaw
- Anda sudah memiliki OpenClaw Gateway lokal atau remote dengan sesi yang dirutekan
- Anda menginginkan satu server MCP yang bekerja di seluruh backend channel OpenClaw, alih-alih menjalankan bridge terpisah per channel

Gunakan [`openclaw acp`](/id/cli/acp) sebagai gantinya saat OpenClaw harus menghosting runtime pengodean itu sendiri dan menjaga sesi agen tetap di dalam OpenClaw.

### Cara kerjanya

`openclaw mcp serve` memulai server MCP stdio. Klien MCP memiliki proses tersebut. Selama klien menjaga sesi stdio tetap terbuka, bridge tersambung ke OpenClaw Gateway lokal atau remote melalui WebSocket dan mengekspos percakapan channel yang dirutekan melalui MCP.

<Steps>
  <Step title="Klien memunculkan bridge">
    Klien MCP memunculkan `openclaw mcp serve`.
  </Step>
  <Step title="Bridge tersambung ke Gateway">
    Bridge tersambung ke OpenClaw Gateway melalui WebSocket.
  </Step>
  <Step title="Sesi menjadi percakapan MCP">
    Sesi yang dirutekan menjadi percakapan MCP dan alat transkrip/riwayat.
  </Step>
  <Step title="Antrean peristiwa live">
    Peristiwa live diantrekan di memori selama bridge tersambung.
  </Step>
  <Step title="Push Claude opsional">
    Jika mode channel Claude diaktifkan, sesi yang sama juga dapat menerima notifikasi push khusus Claude.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Perilaku penting">
    - status antrean live dimulai saat bridge tersambung
    - riwayat transkrip lama dibaca dengan `messages_read`
    - notifikasi push Claude hanya ada selama sesi MCP hidup
    - saat klien terputus, bridge keluar dan antrean live hilang
    - titik masuk agen sekali jalan seperti `openclaw agent` dan `openclaw infer model run` menghentikan runtime MCP bawaan apa pun yang dibukanya saat balasan selesai, sehingga run berskrip berulang tidak menumpuk proses anak MCP stdio
    - server MCP stdio yang diluncurkan oleh OpenClaw (bawaan atau dikonfigurasi pengguna) dimatikan sebagai pohon proses saat shutdown, sehingga subproses anak yang dimulai oleh server tidak bertahan setelah klien stdio induk keluar
    - menghapus atau mereset sesi akan membuang klien MCP sesi tersebut melalui jalur pembersihan runtime bersama, sehingga tidak ada koneksi stdio tersisa yang terikat ke sesi yang dihapus

  </Accordion>
</AccordionGroup>

### Pilih mode klien

Gunakan bridge yang sama dengan dua cara berbeda:

<Tabs>
  <Tab title="Klien MCP generik">
    Hanya alat MCP standar. Gunakan `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send`, dan alat persetujuan.
  </Tab>
  <Tab title="Claude Code">
    Alat MCP standar ditambah adapter channel khusus Claude. Aktifkan `--claude-channel-mode on` atau biarkan default `auto`.
  </Tab>
</Tabs>

<Note>
Saat ini, `auto` berperilaku sama seperti `on`. Deteksi kapabilitas klien belum ada.
</Note>

### Yang diekspos `serve`

Bridge menggunakan metadata rute sesi Gateway yang sudah ada untuk mengekspos percakapan yang didukung channel. Percakapan muncul saat OpenClaw sudah memiliki status sesi dengan rute yang diketahui seperti:

- `channel`
- metadata penerima atau tujuan
- `accountId` opsional
- `threadId` opsional

Ini memberi klien MCP satu tempat untuk:

- mencantumkan percakapan terbaru yang dirutekan
- membaca riwayat transkrip terbaru
- menunggu peristiwa inbound baru
- mengirim balasan kembali melalui rute yang sama
- melihat permintaan persetujuan yang masuk saat bridge tersambung

### Penggunaan

<Tabs>
  <Tab title="Gateway lokal">
    ```bash
    openclaw mcp serve
    ```
  </Tab>
  <Tab title="Gateway remote (token)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
    ```
  </Tab>
  <Tab title="Gateway remote (kata sandi)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password
    ```
  </Tab>
  <Tab title="Verbose / Claude nonaktif">
    ```bash
    openclaw mcp serve --verbose
    openclaw mcp serve --claude-channel-mode off
    ```
  </Tab>
</Tabs>

### Alat bridge

Bridge saat ini mengekspos alat MCP berikut:

<AccordionGroup>
  <Accordion title="conversations_list">
    Mencantumkan percakapan terbaru yang didukung sesi yang sudah memiliki metadata rute dalam status sesi Gateway.

    Filter yang berguna:

    - `limit`
    - `search`
    - `channel`
    - `includeDerivedTitles`
    - `includeLastMessage`

  </Accordion>
  <Accordion title="conversation_get">
    Mengembalikan satu percakapan berdasarkan `session_key` menggunakan lookup sesi Gateway langsung.
  </Accordion>
  <Accordion title="messages_read">
    Membaca pesan transkrip terbaru untuk satu percakapan yang didukung sesi.
  </Accordion>
  <Accordion title="attachments_fetch">
    Mengekstrak blok konten pesan non-teks dari satu pesan transkrip. Ini adalah tampilan metadata atas konten transkrip, bukan penyimpanan blob lampiran tahan lama yang berdiri sendiri.
  </Accordion>
  <Accordion title="events_poll">
    Membaca peristiwa live yang diantrekan sejak kursor numerik.
  </Accordion>
  <Accordion title="events_wait">
    Melakukan long-poll hingga peristiwa terantre berikutnya yang cocok tiba atau timeout berakhir.

    Gunakan ini saat klien MCP generik membutuhkan pengiriman nyaris real-time tanpa protokol push khusus Claude.

  </Accordion>
  <Accordion title="messages_send">
    Mengirim teks kembali melalui rute yang sama yang sudah tercatat pada sesi.

    Perilaku saat ini:

    - memerlukan rute percakapan yang sudah ada
    - menggunakan channel, penerima, id akun, dan id thread milik sesi
    - hanya mengirim teks

  </Accordion>
  <Accordion title="permissions_list_open">
    Mencantumkan permintaan persetujuan exec/plugin tertunda yang telah diamati bridge sejak tersambung ke Gateway.
  </Accordion>
  <Accordion title="permissions_respond">
    Menyelesaikan satu permintaan persetujuan exec/plugin tertunda dengan:

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### Model peristiwa

Bridge menyimpan antrean peristiwa dalam memori selama tersambung.

Jenis peristiwa saat ini:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- antrean hanya live; antrean dimulai saat bridge MCP dimulai
- `events_poll` dan `events_wait` tidak memutar ulang riwayat Gateway lama dengan sendirinya
- backlog tahan lama harus dibaca dengan `messages_read`

</Warning>

### Notifikasi channel Claude

Bridge juga dapat mengekspos notifikasi channel khusus Claude. Ini adalah padanan OpenClaw dari adapter channel Claude Code: alat MCP standar tetap tersedia, tetapi pesan inbound live juga dapat masuk sebagai notifikasi MCP khusus Claude.

<Tabs>
  <Tab title="off">
    `--claude-channel-mode off`: hanya alat MCP standar.
  </Tab>
  <Tab title="on">
    `--claude-channel-mode on`: aktifkan notifikasi channel Claude.
  </Tab>
  <Tab title="auto (default)">
    `--claude-channel-mode auto`: default saat ini; perilaku bridge sama seperti `on`.
  </Tab>
</Tabs>

Saat mode channel Claude diaktifkan, server mengiklankan kapabilitas eksperimental Claude dan dapat memancarkan:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Perilaku bridge saat ini:

- pesan transkrip `user` inbound diteruskan sebagai `notifications/claude/channel`
- permintaan izin Claude yang diterima melalui MCP dilacak dalam memori
- jika percakapan yang ditautkan kemudian mengirim `yes abcde` atau `no abcde`, bridge mengonversinya menjadi `notifications/claude/channel/permission`
- notifikasi ini hanya untuk sesi live; jika klien MCP terputus, tidak ada target push

Ini sengaja khusus klien. Klien MCP generik sebaiknya mengandalkan alat polling standar.

### Konfigurasi klien MCP

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

Untuk sebagian besar klien MCP generik, mulai dengan permukaan alat standar dan abaikan mode Claude. Aktifkan mode Claude hanya untuk klien yang benar-benar memahami metode notifikasi khusus Claude.

### Opsi

`openclaw mcp serve` mendukung:

<ParamField path="--url" type="string">
  URL WebSocket Gateway.
</ParamField>
<ParamField path="--token" type="string">
  Token Gateway.
</ParamField>
<ParamField path="--token-file" type="string">
  Baca token dari file.
</ParamField>
<ParamField path="--password" type="string">
  Kata sandi Gateway.
</ParamField>
<ParamField path="--password-file" type="string">
  Baca kata sandi dari file.
</ParamField>
<ParamField path="--claude-channel-mode" type='"auto" | "on" | "off"'>
  Mode notifikasi Claude.
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  Log verbose pada stderr.
</ParamField>

<Tip>
Lebih pilih `--token-file` atau `--password-file` daripada rahasia inline bila memungkinkan.
</Tip>

### Keamanan dan batas kepercayaan

Bridge tidak menciptakan perutean. Bridge hanya mengekspos percakapan yang sudah diketahui Gateway cara merutekannya.

Artinya:

- allowlist pengirim, pairing, dan kepercayaan tingkat channel tetap menjadi milik konfigurasi channel OpenClaw yang mendasarinya
- `messages_send` hanya dapat membalas melalui rute tersimpan yang sudah ada
- status persetujuan hanya live/dalam memori untuk sesi bridge saat ini
- auth bridge harus menggunakan kontrol token atau kata sandi Gateway yang sama dengan yang akan Anda percayai untuk klien Gateway remote lainnya

Jika suatu percakapan hilang dari `conversations_list`, penyebab biasanya bukan konfigurasi MCP. Penyebabnya adalah metadata rute yang hilang atau tidak lengkap dalam sesi Gateway yang mendasarinya.

### Pengujian

OpenClaw menyediakan smoke Docker deterministik untuk bridge ini:

```bash
pnpm test:docker:mcp-channels
```

Smoke tersebut:

- memulai kontainer Gateway dengan seed
- memulai kontainer kedua yang memunculkan `openclaw mcp serve`
- memverifikasi penemuan percakapan, pembacaan transkrip, pembacaan metadata lampiran, perilaku antrean peristiwa live, dan perutean pengiriman outbound
- memvalidasi notifikasi channel dan izin bergaya Claude melalui bridge MCP stdio nyata

Ini adalah cara tercepat untuk membuktikan bridge berfungsi tanpa menghubungkan akun Telegram, Discord, atau iMessage nyata ke dalam run pengujian.

Untuk konteks pengujian yang lebih luas, lihat [Pengujian](/id/help/testing).

### Pemecahan masalah

<AccordionGroup>
  <Accordion title="Tidak ada percakapan yang dikembalikan">
    Biasanya berarti sesi Gateway belum dapat dirutekan. Konfirmasikan bahwa sesi yang mendasarinya memiliki channel/provider, penerima, dan metadata rute akun/thread opsional yang tersimpan.
  </Accordion>
  <Accordion title="events_poll atau events_wait melewatkan pesan lama">
    Sesuai perkiraan. Antrean live dimulai saat bridge tersambung. Baca riwayat transkrip lama dengan `messages_read`.
  </Accordion>
  <Accordion title="Notifikasi Claude tidak muncul">
    Periksa semua ini:

    - klien menjaga sesi MCP stdio tetap terbuka
    - `--claude-channel-mode` adalah `on` atau `auto`
    - klien benar-benar memahami metode notifikasi khusus Claude
    - pesan inbound terjadi setelah bridge tersambung

  </Accordion>
  <Accordion title="Persetujuan hilang">
    `permissions_list_open` hanya menampilkan permintaan persetujuan yang diamati saat bridge tersambung. Ini bukan API riwayat persetujuan tahan lama.
  </Accordion>
</AccordionGroup>

## OpenClaw sebagai registri klien MCP

Ini adalah path `openclaw mcp list`, `show`, `set`, dan `unset`.

Perintah-perintah ini tidak mengekspos OpenClaw melalui MCP. Perintah ini mengelola definisi server MCP milik OpenClaw di bawah `mcp.servers` dalam konfigurasi OpenClaw.

Definisi yang disimpan tersebut ditujukan untuk runtime yang diluncurkan atau dikonfigurasi OpenClaw nanti, seperti Pi tertanam dan adaptor runtime lainnya. OpenClaw menyimpan definisi secara terpusat agar runtime tersebut tidak perlu menyimpan daftar server MCP duplikat miliknya sendiri.

<AccordionGroup>
  <Accordion title="Perilaku penting">
    - perintah-perintah ini hanya membaca atau menulis konfigurasi OpenClaw
    - perintah ini tidak terhubung ke server MCP target
    - perintah ini tidak memvalidasi apakah perintah, URL, atau transport jarak jauh dapat dijangkau saat ini
    - adaptor runtime menentukan bentuk transport mana yang benar-benar mereka dukung pada waktu eksekusi
    - Pi tertanam mengekspos alat MCP yang dikonfigurasi dalam profil alat `coding` dan `messaging` normal; `minimal` tetap menyembunyikannya, dan `tools.deny: ["bundle-mcp"]` menonaktifkannya secara eksplisit
    - runtime MCP terbundel dengan cakupan sesi dibersihkan setelah `mcp.sessionIdleTtlMs` milidetik waktu idle (default 10 menit; atur `0` untuk menonaktifkan) dan eksekusi tertanam sekali jalan membersihkannya pada akhir eksekusi

  </Accordion>
</AccordionGroup>

Adaptor runtime dapat menormalkan registri bersama ini ke bentuk yang diharapkan klien hilirnya. Misalnya, Pi tertanam menggunakan nilai `transport` OpenClaw secara langsung, sementara Claude Code dan Gemini menerima nilai `type` asli CLI seperti `http`, `sse`, atau `stdio`.

### Definisi server MCP tersimpan

OpenClaw juga menyimpan registri server MCP ringan dalam konfigurasi untuk permukaan yang menginginkan definisi MCP yang dikelola OpenClaw.

Perintah:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

Catatan:

- `list` mengurutkan nama server.
- `show` tanpa nama mencetak objek server MCP yang dikonfigurasi secara lengkap.
- `set` mengharapkan satu nilai objek JSON pada baris perintah.
- Gunakan `transport: "streamable-http"` untuk server MCP Streamable HTTP. `openclaw mcp set` juga menormalkan `type: "http"` asli CLI ke bentuk konfigurasi kanonis yang sama untuk kompatibilitas.
- `unset` gagal jika server bernama tersebut tidak ada.

Contoh:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp set docs '{"url":"https://mcp.example.com","transport":"streamable-http"}'
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
        "url": "https://mcp.example.com",
        "transport": "streamable-http"
      }
    }
  }
}
```

### Transport stdio

Meluncurkan proses turunan lokal dan berkomunikasi melalui stdin/stdout.

| Kolom                      | Deskripsi                         |
| -------------------------- | --------------------------------- |
| `command`                  | Eksekutabel untuk dijalankan (wajib) |
| `args`                     | Array argumen baris perintah      |
| `env`                      | Variabel lingkungan tambahan      |
| `cwd` / `workingDirectory` | Direktori kerja untuk proses      |

<Warning>
**Filter keamanan env stdio**

OpenClaw menolak kunci env startup interpreter yang dapat mengubah cara server MCP stdio dimulai sebelum RPC pertama, meskipun kunci tersebut muncul dalam blok `env` server. Kunci yang diblokir mencakup `NODE_OPTIONS`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4`, dan variabel kontrol runtime serupa. Startup menolak ini dengan kesalahan konfigurasi agar tidak dapat menyuntikkan prelude implisit, mengganti interpreter, atau mengaktifkan debugger terhadap proses stdio. Variabel env kredensial, proxy, dan spesifik server biasa (`GITHUB_TOKEN`, `HTTP_PROXY`, `*_API_KEY` khusus, dll.) tidak terpengaruh.

Jika server MCP Anda benar-benar membutuhkan salah satu variabel yang diblokir, atur variabel tersebut pada proses host Gateway alih-alih di bawah `env` server stdio.
</Warning>

### Transport SSE / HTTP

Terhubung ke server MCP jarak jauh melalui HTTP Server-Sent Events.

| Kolom                 | Deskripsi                                                       |
| --------------------- | ---------------------------------------------------------------- |
| `url`                 | URL HTTP atau HTTPS server jarak jauh (wajib)                    |
| `headers`             | Peta key-value opsional untuk header HTTP (misalnya token auth)  |
| `connectionTimeoutMs` | Timeout koneksi per server dalam ms (opsional)                   |

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

Nilai sensitif dalam `url` (userinfo) dan `headers` disunting dalam log dan output status.

### Transport Streamable HTTP

`streamable-http` adalah opsi transport tambahan bersama `sse` dan `stdio`. Ini menggunakan streaming HTTP untuk komunikasi dua arah dengan server MCP jarak jauh.

| Kolom                 | Deskripsi                                                                            |
| --------------------- | -------------------------------------------------------------------------------------- |
| `url`                 | URL HTTP atau HTTPS server jarak jauh (wajib)                                          |
| `transport`           | Atur ke `"streamable-http"` untuk memilih transport ini; jika dihilangkan, OpenClaw menggunakan `sse` |
| `headers`             | Peta key-value opsional untuk header HTTP (misalnya token auth)                        |
| `connectionTimeoutMs` | Timeout koneksi per server dalam ms (opsional)                                         |

Konfigurasi OpenClaw menggunakan `transport: "streamable-http"` sebagai ejaan kanonis. Nilai MCP asli CLI `type: "http"` diterima saat disimpan melalui `openclaw mcp set` dan diperbaiki oleh `openclaw doctor --fix` dalam konfigurasi yang sudah ada, tetapi `transport` adalah yang dikonsumsi langsung oleh Pi tertanam.

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

<Note>
Perintah-perintah ini hanya mengelola konfigurasi tersimpan. Perintah ini tidak memulai bridge kanal, membuka sesi klien MCP live, atau membuktikan bahwa server target dapat dijangkau.
</Note>

## Batasan saat ini

Halaman ini mendokumentasikan bridge sebagaimana dikirimkan saat ini.

Batasan saat ini:

- penemuan percakapan bergantung pada metadata rute sesi Gateway yang ada
- belum ada protokol push generik selain adaptor khusus Claude
- belum ada alat edit pesan atau reaksi
- transport HTTP/SSE/streamable-http terhubung ke satu server jarak jauh; belum ada upstream multipleks
- `permissions_list_open` hanya mencakup persetujuan yang diamati saat bridge terhubung

## Terkait

- [Referensi CLI](/id/cli)
- [Plugin](/id/cli/plugins)
