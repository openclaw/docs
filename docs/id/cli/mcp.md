---
read_when:
    - Menghubungkan Codex, Claude Code, atau klien MCP lain ke saluran yang didukung OpenClaw
    - Menjalankan `openclaw mcp serve`
    - Mengelola definisi server MCP yang disimpan oleh OpenClaw
sidebarTitle: MCP
summary: Ekspos percakapan saluran OpenClaw melalui MCP dan kelola definisi server MCP yang tersimpan
title: MCP
x-i18n:
    generated_at: "2026-04-30T09:40:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: d66ec20b81ab3894c7202ee1c1c6666bd9cdeffc8d48a280b1f298bb358887ef
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` memiliki dua tugas:

- menjalankan OpenClaw sebagai server MCP dengan `openclaw mcp serve`
- mengelola definisi server MCP keluar milik OpenClaw dengan `list`, `show`, `set`, dan `unset`

Dengan kata lain:

- `serve` adalah OpenClaw yang bertindak sebagai server MCP
- `list` / `show` / `set` / `unset` adalah OpenClaw yang bertindak sebagai registri sisi klien MCP untuk server MCP lain yang mungkin dikonsumsi runtime-nya nanti

Gunakan [`openclaw acp`](/id/cli/acp) ketika OpenClaw harus meng-host sesi harness pengodean itu sendiri dan merutekan runtime tersebut melalui ACP.

## OpenClaw sebagai server MCP

Ini adalah jalur `openclaw mcp serve`.

### Kapan menggunakan `serve`

Gunakan `openclaw mcp serve` ketika:

- Codex, Claude Code, atau klien MCP lain harus berbicara langsung dengan percakapan saluran yang didukung OpenClaw
- Anda sudah memiliki OpenClaw Gateway lokal atau jarak jauh dengan sesi yang dirutekan
- Anda menginginkan satu server MCP yang bekerja di seluruh backend saluran OpenClaw alih-alih menjalankan bridge terpisah per saluran

Gunakan [`openclaw acp`](/id/cli/acp) sebagai gantinya ketika OpenClaw harus meng-host runtime pengodean itu sendiri dan mempertahankan sesi agen di dalam OpenClaw.

### Cara kerjanya

`openclaw mcp serve` memulai server MCP stdio. Klien MCP memiliki proses tersebut. Selama klien menjaga sesi stdio tetap terbuka, bridge terhubung ke OpenClaw Gateway lokal atau jarak jauh melalui WebSocket dan mengekspos percakapan saluran yang dirutekan melalui MCP.

<Steps>
  <Step title="Client spawns the bridge">
    Klien MCP menjalankan `openclaw mcp serve`.
  </Step>
  <Step title="Bridge connects to Gateway">
    Bridge terhubung ke OpenClaw Gateway melalui WebSocket.
  </Step>
  <Step title="Sessions become MCP conversations">
    Sesi yang dirutekan menjadi percakapan MCP dan alat transkrip/riwayat.
  </Step>
  <Step title="Live events queue">
    Peristiwa langsung diantrekan di memori saat bridge terhubung.
  </Step>
  <Step title="Optional Claude push">
    Jika mode saluran Claude diaktifkan, sesi yang sama juga dapat menerima notifikasi push khusus Claude.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Important behavior">
    - status antrean langsung dimulai saat bridge terhubung
    - riwayat transkrip lama dibaca dengan `messages_read`
    - notifikasi push Claude hanya ada selama sesi MCP aktif
    - saat klien terputus, bridge keluar dan antrean langsung hilang
    - titik masuk agen sekali jalan seperti `openclaw agent` dan `openclaw infer model run` menghentikan runtime MCP bawaan apa pun yang dibukanya saat balasan selesai, sehingga eksekusi skrip berulang tidak menumpuk proses anak MCP stdio
    - server MCP stdio yang diluncurkan oleh OpenClaw (bawaan atau dikonfigurasi pengguna) dihentikan sebagai pohon proses saat shutdown, sehingga subproses anak yang dimulai oleh server tidak bertahan setelah klien stdio induk keluar
    - menghapus atau mereset sesi akan membuang klien MCP sesi tersebut melalui jalur pembersihan runtime bersama, sehingga tidak ada koneksi stdio yang tersisa terkait sesi yang dihapus

  </Accordion>
</AccordionGroup>

### Pilih mode klien

Gunakan bridge yang sama dengan dua cara berbeda:

<Tabs>
  <Tab title="Generic MCP clients">
    Hanya alat MCP standar. Gunakan `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send`, dan alat persetujuan.
  </Tab>
  <Tab title="Claude Code">
    Alat MCP standar ditambah adapter saluran khusus Claude. Aktifkan `--claude-channel-mode on` atau biarkan default `auto`.
  </Tab>
</Tabs>

<Note>
Saat ini, `auto` berperilaku sama seperti `on`. Deteksi kapabilitas klien belum tersedia.
</Note>

### Apa yang diekspos `serve`

Bridge menggunakan metadata rute sesi Gateway yang sudah ada untuk mengekspos percakapan yang didukung saluran. Percakapan muncul ketika OpenClaw sudah memiliki status sesi dengan rute yang diketahui seperti:

- `channel`
- metadata penerima atau tujuan
- `accountId` opsional
- `threadId` opsional

Ini memberi klien MCP satu tempat untuk:

- mencantumkan percakapan terbaru yang dirutekan
- membaca riwayat transkrip terbaru
- menunggu peristiwa masuk baru
- mengirim balasan kembali melalui rute yang sama
- melihat permintaan persetujuan yang masuk saat bridge terhubung

### Penggunaan

<Tabs>
  <Tab title="Local Gateway">
    ```bash
    openclaw mcp serve
    ```
  </Tab>
  <Tab title="Remote Gateway (token)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
    ```
  </Tab>
  <Tab title="Remote Gateway (password)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password
    ```
  </Tab>
  <Tab title="Verbose / Claude off">
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
    Mencantumkan percakapan terbaru yang didukung sesi dan sudah memiliki metadata rute dalam status sesi Gateway.

    Filter yang berguna:

    - `limit`
    - `search`
    - `channel`
    - `includeDerivedTitles`
    - `includeLastMessage`

  </Accordion>
  <Accordion title="conversation_get">
    Mengembalikan satu percakapan berdasarkan `session_key`.
  </Accordion>
  <Accordion title="messages_read">
    Membaca pesan transkrip terbaru untuk satu percakapan yang didukung sesi.
  </Accordion>
  <Accordion title="attachments_fetch">
    Mengekstrak blok konten pesan non-teks dari satu pesan transkrip. Ini adalah tampilan metadata atas konten transkrip, bukan penyimpanan blob lampiran tahan lama yang berdiri sendiri.
  </Accordion>
  <Accordion title="events_poll">
    Membaca peristiwa langsung yang diantrekan sejak kursor numerik.
  </Accordion>
  <Accordion title="events_wait">
    Melakukan long-poll hingga peristiwa terantre berikutnya yang cocok tiba atau batas waktu berakhir.

    Gunakan ini ketika klien MCP generik membutuhkan pengiriman hampir waktu nyata tanpa protokol push khusus Claude.

  </Accordion>
  <Accordion title="messages_send">
    Mengirim teks kembali melalui rute yang sama yang sudah direkam pada sesi.

    Perilaku saat ini:

    - memerlukan rute percakapan yang sudah ada
    - menggunakan saluran, penerima, id akun, dan id utas milik sesi
    - hanya mengirim teks

  </Accordion>
  <Accordion title="permissions_list_open">
    Mencantumkan permintaan persetujuan exec/Plugin tertunda yang telah diamati bridge sejak terhubung ke Gateway.
  </Accordion>
  <Accordion title="permissions_respond">
    Menyelesaikan satu permintaan persetujuan exec/Plugin tertunda dengan:

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### Model peristiwa

Bridge menyimpan antrean peristiwa dalam memori saat terhubung.

Jenis peristiwa saat ini:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- antrean hanya live; antrean dimulai saat bridge MCP dimulai
- `events_poll` dan `events_wait` tidak memutar ulang riwayat Gateway yang lebih lama dengan sendirinya
- backlog tahan lama harus dibaca dengan `messages_read`

</Warning>

### Notifikasi kanal Claude

Bridge juga dapat mengekspos notifikasi kanal khusus Claude. Ini adalah padanan OpenClaw dari adaptor kanal Claude Code: alat MCP standar tetap tersedia, tetapi pesan masuk live juga dapat tiba sebagai notifikasi MCP khusus Claude.

<Tabs>
  <Tab title="off">
    `--claude-channel-mode off`: hanya alat MCP standar.
  </Tab>
  <Tab title="on">
    `--claude-channel-mode on`: aktifkan notifikasi kanal Claude.
  </Tab>
  <Tab title="auto (default)">
    `--claude-channel-mode auto`: default saat ini; perilaku bridge sama seperti `on`.
  </Tab>
</Tabs>

Saat mode kanal Claude diaktifkan, server mengiklankan kapabilitas eksperimental Claude dan dapat memancarkan:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Perilaku bridge saat ini:

- pesan transkrip `user` yang masuk diteruskan sebagai `notifications/claude/channel`
- permintaan izin Claude yang diterima melalui MCP dilacak dalam memori
- jika percakapan tertaut kemudian mengirim `yes abcde` atau `no abcde`, bridge mengonversinya menjadi `notifications/claude/channel/permission`
- notifikasi ini hanya untuk sesi live; jika klien MCP terputus, tidak ada target push

Ini sengaja dibuat khusus klien. Klien MCP generik sebaiknya mengandalkan alat polling standar.

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
Pilih `--token-file` atau `--password-file` daripada secret inline bila memungkinkan.
</Tip>

### Keamanan dan batas kepercayaan

Bridge tidak menciptakan perutean. Bridge hanya mengekspos percakapan yang sudah diketahui Gateway cara merutekannya.

Artinya:

- daftar pengirim yang diizinkan, pairing, dan kepercayaan tingkat kanal tetap berada pada konfigurasi kanal OpenClaw yang mendasarinya
- `messages_send` hanya dapat membalas melalui rute tersimpan yang sudah ada
- status persetujuan hanya live/dalam memori untuk sesi bridge saat ini
- autentikasi bridge harus menggunakan kontrol token atau kata sandi Gateway yang sama dengan yang akan Anda percayai untuk klien Gateway jarak jauh lainnya

Jika sebuah percakapan tidak ada di `conversations_list`, penyebab biasanya bukan konfigurasi MCP. Penyebabnya adalah metadata rute yang hilang atau tidak lengkap dalam sesi Gateway yang mendasarinya.

### Pengujian

OpenClaw menyertakan smoke Docker deterministik untuk bridge ini:

```bash
pnpm test:docker:mcp-channels
```

Smoke tersebut:

- memulai container Gateway yang sudah diberi seed
- memulai container kedua yang menjalankan `openclaw mcp serve`
- memverifikasi penemuan percakapan, pembacaan transkrip, pembacaan metadata lampiran, perilaku antrean peristiwa live, dan perutean pengiriman keluar
- memvalidasi notifikasi kanal dan izin bergaya Claude melalui bridge MCP stdio nyata

Ini adalah cara tercepat untuk membuktikan bridge berfungsi tanpa menyambungkan akun Telegram, Discord, atau iMessage nyata ke dalam proses pengujian.

Untuk konteks pengujian yang lebih luas, lihat [Pengujian](/id/help/testing).

### Pemecahan masalah

<AccordionGroup>
  <Accordion title="No conversations returned">
    Biasanya berarti sesi Gateway belum dapat dirutekan. Pastikan sesi yang mendasarinya memiliki metadata rute kanal/penyedia, penerima, dan akun/thread opsional yang tersimpan.
  </Accordion>
  <Accordion title="events_poll or events_wait misses older messages">
    Sesuai harapan. Antrean live dimulai saat bridge terhubung. Baca riwayat transkrip yang lebih lama dengan `messages_read`.
  </Accordion>
  <Accordion title="Claude notifications do not show up">
    Periksa semua hal berikut:

    - klien mempertahankan sesi MCP stdio tetap terbuka
    - `--claude-channel-mode` adalah `on` atau `auto`
    - klien benar-benar memahami metode notifikasi khusus Claude
    - pesan masuk terjadi setelah bridge terhubung

  </Accordion>
  <Accordion title="Approvals are missing">
    `permissions_list_open` hanya menampilkan permintaan persetujuan yang diamati saat bridge terhubung. Ini bukan API riwayat persetujuan yang tahan lama.
  </Accordion>
</AccordionGroup>

## OpenClaw sebagai registri klien MCP

Ini adalah jalur `openclaw mcp list`, `show`, `set`, dan `unset`.

Perintah-perintah ini tidak mengekspos OpenClaw melalui MCP. Perintah ini mengelola definisi server MCP milik OpenClaw di bawah `mcp.servers` dalam konfigurasi OpenClaw.

Definisi yang tersimpan itu ditujukan untuk runtime yang diluncurkan atau dikonfigurasi OpenClaw nanti, seperti Pi tertanam dan adapter runtime lainnya. OpenClaw menyimpan definisi secara terpusat sehingga runtime tersebut tidak perlu menyimpan daftar server MCP duplikatnya sendiri.

<AccordionGroup>
  <Accordion title="Perilaku penting">
    - perintah-perintah ini hanya membaca atau menulis konfigurasi OpenClaw
    - perintah ini tidak terhubung ke server MCP target
    - perintah ini tidak memvalidasi apakah perintah, URL, atau transport jarak jauh dapat dijangkau saat ini
    - adapter runtime memutuskan bentuk transport mana yang benar-benar didukung pada waktu eksekusi
    - Pi tertanam mengekspos alat MCP yang dikonfigurasi dalam profil alat `coding` dan `messaging` normal; `minimal` tetap menyembunyikannya, dan `tools.deny: ["bundle-mcp"]` menonaktifkannya secara eksplisit
    - runtime MCP terbundel dengan cakupan sesi dipanen setelah `mcp.sessionIdleTtlMs` milidetik waktu diam (default 10 menit; atur `0` untuk menonaktifkan) dan eksekusi tertanam sekali jalan membersihkannya di akhir eksekusi

  </Accordion>
</AccordionGroup>

Adapter runtime dapat menormalkan registry bersama ini ke bentuk yang diharapkan klien hilirnya. Misalnya, Pi tertanam memakai nilai `transport` OpenClaw secara langsung, sementara Claude Code dan Gemini menerima nilai `type` asli CLI seperti `http`, `sse`, atau `stdio`.

### Definisi server MCP yang tersimpan

OpenClaw juga menyimpan registry server MCP ringan dalam konfigurasi untuk surface yang menginginkan definisi MCP yang dikelola OpenClaw.

Perintah:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

Catatan:

- `list` mengurutkan nama server.
- `show` tanpa nama mencetak objek server MCP yang dikonfigurasi secara lengkap.
- `set` mengharapkan satu nilai objek JSON di baris perintah.
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

### Transport Stdio

Meluncurkan proses turunan lokal dan berkomunikasi melalui stdin/stdout.

| Kolom                      | Deskripsi                         |
| -------------------------- | --------------------------------- |
| `command`                  | Executable untuk dijalankan (wajib) |
| `args`                     | Array argumen baris perintah      |
| `env`                      | Variabel lingkungan tambahan      |
| `cwd` / `workingDirectory` | Direktori kerja untuk proses      |

<Warning>
**Filter keamanan env Stdio**

OpenClaw menolak kunci env startup interpreter yang dapat mengubah cara server MCP stdio dimulai sebelum RPC pertama, bahkan jika kunci tersebut muncul dalam blok `env` server. Kunci yang diblokir mencakup `NODE_OPTIONS`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4`, dan variabel kontrol runtime serupa. Startup menolak ini dengan kesalahan konfigurasi sehingga kunci tersebut tidak dapat menyisipkan prelude implisit, menukar interpreter, atau mengaktifkan debugger terhadap proses stdio. Variabel env kredensial, proxy, dan khusus server biasa (`GITHUB_TOKEN`, `HTTP_PROXY`, `*_API_KEY` kustom, dll.) tidak terpengaruh.

Jika server MCP Anda benar-benar memerlukan salah satu variabel yang diblokir, atur variabel tersebut pada proses host Gateway, bukan di bawah `env` server stdio.
</Warning>

### Transport SSE / HTTP

Terhubung ke server MCP jarak jauh melalui HTTP Server-Sent Events.

| Kolom                 | Deskripsi                                                       |
| --------------------- | --------------------------------------------------------------- |
| `url`                 | URL HTTP atau HTTPS server jarak jauh (wajib)                   |
| `headers`             | Peta key-value opsional untuk header HTTP (misalnya token auth) |
| `connectionTimeoutMs` | Timeout koneksi per server dalam ms (opsional)                  |

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

Nilai sensitif dalam `url` (userinfo) dan `headers` disamarkan dalam log dan output status.

### Transport Streamable HTTP

`streamable-http` adalah opsi transport tambahan di samping `sse` dan `stdio`. Ini menggunakan streaming HTTP untuk komunikasi dua arah dengan server MCP jarak jauh.

| Kolom                 | Deskripsi                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------- |
| `url`                 | URL HTTP atau HTTPS server jarak jauh (wajib)                                                |
| `transport`           | Atur ke `"streamable-http"` untuk memilih transport ini; jika dihilangkan, OpenClaw memakai `sse` |
| `headers`             | Peta key-value opsional untuk header HTTP (misalnya token auth)                              |
| `connectionTimeoutMs` | Timeout koneksi per server dalam ms (opsional)                                               |

Konfigurasi OpenClaw menggunakan `transport: "streamable-http"` sebagai penulisan kanonis. Nilai MCP asli CLI `type: "http"` diterima saat disimpan melalui `openclaw mcp set` dan diperbaiki oleh `openclaw doctor --fix` dalam konfigurasi yang sudah ada, tetapi `transport` adalah yang dipakai langsung oleh Pi tertanam.

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
Perintah-perintah ini hanya mengelola konfigurasi yang tersimpan. Perintah ini tidak memulai bridge channel, membuka sesi klien MCP live, atau membuktikan bahwa server target dapat dijangkau.
</Note>

## Batas saat ini

Halaman ini mendokumentasikan bridge sebagaimana dikirimkan saat ini.

Batas saat ini:

- penemuan percakapan bergantung pada metadata rute sesi Gateway yang sudah ada
- belum ada protokol push generik di luar adapter khusus Claude
- belum ada alat edit pesan atau reaksi
- transport HTTP/SSE/streamable-http terhubung ke satu server jarak jauh; belum ada upstream termultipleks
- `permissions_list_open` hanya menyertakan persetujuan yang diamati saat bridge terhubung

## Terkait

- [Referensi CLI](/id/cli)
- [Plugin](/id/cli/plugins)
