---
read_when:
    - Menghubungkan Codex, Claude Code, atau klien MCP lain ke saluran yang didukung OpenClaw
    - Menjalankan `openclaw mcp serve`
    - Mengelola definisi server MCP yang disimpan OpenClaw
sidebarTitle: MCP
summary: Mengekspos percakapan saluran OpenClaw melalui MCP dan mengelola definisi server MCP tersimpan
title: MCP
x-i18n:
    generated_at: "2026-04-26T11:26:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1e003d974a7ae989f240d7608470ddcf2f37e20ca342cf4569c14677dc6fc1d8
    source_path: cli/mcp.md
    workflow: 15
---

`openclaw mcp` memiliki dua tugas:

- menjalankan OpenClaw sebagai server MCP dengan `openclaw mcp serve`
- mengelola definisi server MCP keluar milik OpenClaw dengan `list`, `show`, `set`, dan `unset`

Dengan kata lain:

- `serve` adalah OpenClaw yang bertindak sebagai server MCP
- `list` / `show` / `set` / `unset` adalah OpenClaw yang bertindak sebagai registri sisi klien MCP untuk server MCP lain yang mungkin digunakan runtime-nya nanti

Gunakan [`openclaw acp`](/id/cli/acp) saat OpenClaw harus meng-host sesi harness coding itu sendiri dan merutekan runtime tersebut melalui ACP.

## OpenClaw sebagai server MCP

Ini adalah jalur `openclaw mcp serve`.

### Kapan menggunakan `serve`

Gunakan `openclaw mcp serve` saat:

- Codex, Claude Code, atau klien MCP lain harus berbicara langsung dengan percakapan saluran yang didukung OpenClaw
- Anda sudah memiliki Gateway OpenClaw lokal atau jarak jauh dengan sesi yang sudah dirutekan
- Anda menginginkan satu server MCP yang bekerja di berbagai backend saluran OpenClaw alih-alih menjalankan bridge terpisah per saluran

Gunakan [`openclaw acp`](/id/cli/acp) sebagai gantinya saat OpenClaw harus meng-host runtime coding itu sendiri dan menjaga sesi agen tetap berada di dalam OpenClaw.

### Cara kerjanya

`openclaw mcp serve` memulai server MCP stdio. Klien MCP memiliki proses tersebut. Selama klien menjaga sesi stdio tetap terbuka, bridge terhubung ke Gateway OpenClaw lokal atau jarak jauh melalui WebSocket dan mengekspos percakapan saluran yang dirutekan melalui MCP.

<Steps>
  <Step title="Klien memunculkan bridge">
    Klien MCP memunculkan `openclaw mcp serve`.
  </Step>
  <Step title="Bridge terhubung ke Gateway">
    Bridge terhubung ke Gateway OpenClaw melalui WebSocket.
  </Step>
  <Step title="Sesi menjadi percakapan MCP">
    Sesi yang dirutekan menjadi percakapan MCP serta tool transkrip/riwayat.
  </Step>
  <Step title="Antrean event langsung">
    Event langsung diantrikan di memori saat bridge terhubung.
  </Step>
  <Step title="Push Claude opsional">
    Jika mode saluran Claude diaktifkan, sesi yang sama juga dapat menerima notifikasi push khusus Claude.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Perilaku penting">
    - status antrean langsung dimulai saat bridge terhubung
    - riwayat transkrip yang lebih lama dibaca dengan `messages_read`
    - notifikasi push Claude hanya ada selama sesi MCP masih aktif
    - saat klien terputus, bridge keluar dan antrean langsung hilang
    - titik masuk agen sekali jalan seperti `openclaw agent` dan `openclaw infer model run` memensiunkan runtime MCP bawaan apa pun yang mereka buka saat balasan selesai, sehingga eksekusi skrip berulang tidak menumpuk proses anak stdio MCP
    - server MCP stdio yang diluncurkan oleh OpenClaw (bawaan atau dikonfigurasi pengguna) dimatikan sebagai pohon proses saat shutdown, sehingga subproses anak yang dimulai oleh server tidak bertahan setelah klien stdio induk keluar
    - menghapus atau mereset sesi akan melepaskan klien MCP sesi tersebut melalui jalur cleanup runtime bersama, sehingga tidak ada koneksi stdio yang tertinggal yang terikat ke sesi yang dihapus

  </Accordion>
</AccordionGroup>

### Pilih mode klien

Gunakan bridge yang sama dengan dua cara berbeda:

<Tabs>
  <Tab title="Klien MCP generik">
    Hanya tool MCP standar. Gunakan `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send`, dan tool approval.
  </Tab>
  <Tab title="Claude Code">
    Tool MCP standar ditambah adapter saluran khusus Claude. Aktifkan `--claude-channel-mode on` atau biarkan default `auto`.
  </Tab>
</Tabs>

<Note>
Saat ini, `auto` berperilaku sama dengan `on`. Belum ada deteksi kemampuan klien.
</Note>

### Apa yang diekspos oleh `serve`

Bridge menggunakan metadata rute sesi Gateway yang sudah ada untuk mengekspos percakapan yang didukung saluran. Sebuah percakapan muncul saat OpenClaw sudah memiliki status sesi dengan rute yang diketahui seperti:

- `channel`
- metadata penerima atau tujuan
- `accountId` opsional
- `threadId` opsional

Ini memberi klien MCP satu tempat untuk:

- mencantumkan percakapan terarah terbaru
- membaca riwayat transkrip terbaru
- menunggu event masuk baru
- mengirim balasan kembali melalui rute yang sama
- melihat permintaan approval yang tiba saat bridge terhubung

### Penggunaan

<Tabs>
  <Tab title="Gateway lokal">
    ```bash
    openclaw mcp serve
    ```
  </Tab>
  <Tab title="Gateway jarak jauh (token)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
    ```
  </Tab>
  <Tab title="Gateway jarak jauh (password)">
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

### Tool bridge

Bridge saat ini mengekspos tool MCP berikut:

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
    Mengembalikan satu percakapan berdasarkan `session_key`.
  </Accordion>
  <Accordion title="messages_read">
    Membaca pesan transkrip terbaru untuk satu percakapan yang didukung sesi.
  </Accordion>
  <Accordion title="attachments_fetch">
    Mengekstrak blok konten pesan non-teks dari satu pesan transkrip. Ini adalah tampilan metadata atas konten transkrip, bukan penyimpanan blob lampiran tahan lama yang berdiri sendiri.
  </Accordion>
  <Accordion title="events_poll">
    Membaca event langsung yang diantrikan sejak cursor numerik.
  </Accordion>
  <Accordion title="events_wait">
    Long-poll hingga event berikutnya yang cocok dalam antrean tiba atau batas waktu habis.

    Gunakan ini ketika klien MCP generik membutuhkan pengiriman hampir real-time tanpa protokol push khusus Claude.

  </Accordion>
  <Accordion title="messages_send">
    Mengirim teks kembali melalui rute yang sama yang sudah tercatat pada sesi.

    Perilaku saat ini:

    - memerlukan rute percakapan yang sudah ada
    - menggunakan channel, penerima, id akun, dan id thread dari sesi
    - hanya mengirim teks

  </Accordion>
  <Accordion title="permissions_list_open">
    Mencantumkan permintaan approval exec/plugin yang tertunda yang diamati bridge sejak terhubung ke Gateway.
  </Accordion>
  <Accordion title="permissions_respond">
    Menyelesaikan satu permintaan approval exec/plugin yang tertunda dengan:

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### Model event

Bridge menyimpan antrean event di memori selama terhubung.

Tipe event saat ini:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- antrean hanya langsung; dimulai saat bridge MCP dimulai
- `events_poll` dan `events_wait` tidak memutar ulang riwayat Gateway yang lebih lama dengan sendirinya
- backlog tahan lama harus dibaca dengan `messages_read`

</Warning>

### Notifikasi saluran Claude

Bridge juga dapat mengekspos notifikasi saluran khusus Claude. Ini adalah padanan OpenClaw untuk adapter saluran Claude Code: tool MCP standar tetap tersedia, tetapi pesan masuk langsung juga dapat tiba sebagai notifikasi MCP khusus Claude.

<Tabs>
  <Tab title="off">
    `--claude-channel-mode off`: hanya tool MCP standar.
  </Tab>
  <Tab title="on">
    `--claude-channel-mode on`: aktifkan notifikasi saluran Claude.
  </Tab>
  <Tab title="auto (default)">
    `--claude-channel-mode auto`: default saat ini; perilaku bridge sama seperti `on`.
  </Tab>
</Tabs>

Saat mode saluran Claude diaktifkan, server mengiklankan kemampuan eksperimental Claude dan dapat memancarkan:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Perilaku bridge saat ini:

- pesan transkrip `user` yang masuk diteruskan sebagai `notifications/claude/channel`
- permintaan izin Claude yang diterima melalui MCP dilacak di memori
- jika percakapan yang terhubung kemudian mengirim `yes abcde` atau `no abcde`, bridge mengubahnya menjadi `notifications/claude/channel/permission`
- notifikasi ini hanya untuk sesi langsung; jika klien MCP terputus, tidak ada target push

Ini sengaja bersifat khusus klien. Klien MCP generik sebaiknya mengandalkan tool polling standar.

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

Untuk kebanyakan klien MCP generik, mulailah dengan surface tool standar dan abaikan mode Claude. Aktifkan mode Claude hanya untuk klien yang benar-benar memahami metode notifikasi khusus Claude.

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
  Password Gateway.
</ParamField>
<ParamField path="--password-file" type="string">
  Baca password dari file.
</ParamField>
<ParamField path="--claude-channel-mode" type='"auto" | "on" | "off"'>
  Mode notifikasi Claude.
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  Log verbose ke stderr.
</ParamField>

<Tip>
Jika memungkinkan, gunakan `--token-file` atau `--password-file` daripada secret inline.
</Tip>

### Keamanan dan batas kepercayaan

Bridge tidak menciptakan perutean. Bridge hanya mengekspos percakapan yang sudah diketahui cara peruteannya oleh Gateway.

Artinya:

- allowlist pengirim, pairing, dan trust tingkat saluran tetap menjadi milik konfigurasi saluran OpenClaw yang mendasarinya
- `messages_send` hanya dapat membalas melalui rute tersimpan yang sudah ada
- status approval hanya langsung/di memori untuk sesi bridge saat ini
- autentikasi bridge harus menggunakan kontrol token atau password Gateway yang sama seperti yang Anda percayai untuk klien Gateway jarak jauh lainnya

Jika percakapan hilang dari `conversations_list`, penyebab biasanya bukan konfigurasi MCP. Penyebabnya adalah metadata rute yang hilang atau tidak lengkap pada sesi Gateway yang mendasarinya.

### Pengujian

OpenClaw menyertakan smoke Docker deterministik untuk bridge ini:

```bash
pnpm test:docker:mcp-channels
```

Smoke tersebut:

- memulai kontainer Gateway yang sudah di-seed
- memulai kontainer kedua yang memunculkan `openclaw mcp serve`
- memverifikasi penemuan percakapan, pembacaan transkrip, pembacaan metadata lampiran, perilaku antrean event langsung, dan perutean pengiriman keluar
- memvalidasi notifikasi gaya saluran dan izin Claude melalui bridge MCP stdio yang nyata

Ini adalah cara tercepat untuk membuktikan bridge berfungsi tanpa menghubungkan akun Telegram, Discord, atau iMessage nyata ke eksekusi pengujian.

Untuk konteks pengujian yang lebih luas, lihat [Pengujian](/id/help/testing).

### Pemecahan masalah

<AccordionGroup>
  <Accordion title="Tidak ada percakapan yang dikembalikan">
    Biasanya berarti sesi Gateway belum dapat dirutekan. Pastikan sesi yang mendasarinya sudah menyimpan metadata rute saluran/provider, penerima, dan akun/thread opsional.
  </Accordion>
  <Accordion title="events_poll atau events_wait melewatkan pesan lama">
    Itu normal. Antrean langsung dimulai saat bridge terhubung. Baca riwayat transkrip lama dengan `messages_read`.
  </Accordion>
  <Accordion title="Notifikasi Claude tidak muncul">
    Periksa semua hal berikut:

    - klien menjaga sesi stdio MCP tetap terbuka
    - `--claude-channel-mode` bernilai `on` atau `auto`
    - klien benar-benar memahami metode notifikasi khusus Claude
    - pesan masuk terjadi setelah bridge terhubung

  </Accordion>
  <Accordion title="Approval tidak ada">
    `permissions_list_open` hanya menampilkan permintaan approval yang diamati saat bridge terhubung. Ini bukan API riwayat approval yang tahan lama.
  </Accordion>
</AccordionGroup>

## OpenClaw sebagai registri klien MCP

Ini adalah jalur `openclaw mcp list`, `show`, `set`, dan `unset`.

Perintah-perintah ini tidak mengekspos OpenClaw melalui MCP. Perintah-perintah ini mengelola definisi server MCP milik OpenClaw di bawah `mcp.servers` dalam konfigurasi OpenClaw.

Definisi yang disimpan tersebut ditujukan untuk runtime yang nanti diluncurkan atau dikonfigurasi OpenClaw, seperti Pi tersemat dan adapter runtime lainnya. OpenClaw menyimpan definisi-definisi itu secara terpusat agar runtime tersebut tidak perlu menyimpan daftar server MCP duplikat mereka sendiri.

<AccordionGroup>
  <Accordion title="Perilaku penting">
    - perintah-perintah ini hanya membaca atau menulis konfigurasi OpenClaw
    - perintah-perintah ini tidak terhubung ke server MCP target
    - perintah-perintah ini tidak memvalidasi apakah perintah, URL, atau transport jarak jauh dapat dijangkau saat ini
    - adapter runtime memutuskan bentuk transport mana yang benar-benar mereka dukung pada waktu eksekusi
    - Pi tersemat mengekspos tool MCP yang dikonfigurasi dalam profil tool `coding` dan `messaging` normal; `minimal` tetap menyembunyikannya, dan `tools.deny: ["bundle-mcp"]` menonaktifkannya secara eksplisit
    - runtime MCP bawaan dengan cakupan sesi dibersihkan setelah `mcp.sessionIdleTtlMs` milidetik waktu idle (default 10 menit; set `0` untuk menonaktifkan) dan eksekusi tersemat sekali jalan membersihkannya pada akhir eksekusi

  </Accordion>
</AccordionGroup>

Adapter runtime dapat menormalkan registri bersama ini ke dalam bentuk yang diharapkan klien downstream mereka. Misalnya, Pi tersemat menggunakan nilai `transport` OpenClaw secara langsung, sedangkan Claude Code dan Gemini menerima nilai `type` native CLI seperti `http`, `sse`, atau `stdio`.

### Definisi server MCP tersimpan

OpenClaw juga menyimpan registri server MCP ringan dalam konfigurasi untuk surface yang menginginkan definisi MCP yang dikelola OpenClaw.

Perintah:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

Catatan:

- `list` mengurutkan nama server.
- `show` tanpa nama mencetak objek server MCP yang dikonfigurasi secara lengkap.
- `set` mengharapkan satu nilai objek JSON di baris perintah.
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

Meluncurkan proses anak lokal dan berkomunikasi melalui stdin/stdout.

| Field                      | Deskripsi                          |
| -------------------------- | ---------------------------------- |
| `command`                  | Executable yang akan dijalankan (wajib) |
| `args`                     | Array argumen baris perintah       |
| `env`                      | Variabel lingkungan tambahan       |
| `cwd` / `workingDirectory` | Direktori kerja untuk proses       |

<Warning>
**Filter keamanan env stdio**

OpenClaw menolak key env startup interpreter yang dapat mengubah cara server MCP stdio dimulai sebelum RPC pertama, bahkan jika key tersebut muncul dalam blok `env` server. Key yang diblokir mencakup `NODE_OPTIONS`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4`, dan variabel kontrol runtime serupa. Startup menolak key-key ini dengan error konfigurasi agar key-key tersebut tidak dapat menyuntikkan prelude implisit, menukar interpreter, atau mengaktifkan debugger terhadap proses stdio. Variabel env biasa untuk kredensial, proxy, dan yang spesifik server (`GITHUB_TOKEN`, `HTTP_PROXY`, `*_API_KEY` kustom, dll.) tidak terpengaruh.

Jika server MCP Anda benar-benar membutuhkan salah satu variabel yang diblokir, set variabel itu pada proses host Gateway, bukan di bawah `env` server stdio.
</Warning>

### Transport SSE / HTTP

Terhubung ke server MCP jarak jauh melalui HTTP Server-Sent Events.

| Field                 | Deskripsi                                                            |
| --------------------- | -------------------------------------------------------------------- |
| `url`                 | URL HTTP atau HTTPS dari server jarak jauh (wajib)                   |
| `headers`             | Peta key-value opsional header HTTP (misalnya token auth)            |
| `connectionTimeoutMs` | Timeout koneksi per-server dalam md (opsional)                       |

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

Nilai sensitif dalam `url` (userinfo) dan `headers` disensor dalam log dan output status.

### Transport Streamable HTTP

`streamable-http` adalah opsi transport tambahan di samping `sse` dan `stdio`. Ini menggunakan streaming HTTP untuk komunikasi dua arah dengan server MCP jarak jauh.

| Field                 | Deskripsi                                                                                |
| --------------------- | ---------------------------------------------------------------------------------------- |
| `url`                 | URL HTTP atau HTTPS dari server jarak jauh (wajib)                                       |
| `transport`           | Set ke `"streamable-http"` untuk memilih transport ini; jika dihilangkan, OpenClaw menggunakan `sse` |
| `headers`             | Peta key-value opsional header HTTP (misalnya token auth)                                |
| `connectionTimeoutMs` | Timeout koneksi per-server dalam md (opsional)                                           |

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
Perintah-perintah ini hanya mengelola konfigurasi tersimpan. Perintah-perintah ini tidak memulai bridge saluran, membuka sesi klien MCP langsung, atau membuktikan bahwa server target dapat dijangkau.
</Note>

## Batas saat ini

Halaman ini mendokumentasikan bridge sebagaimana dikirim saat ini.

Batas saat ini:

- penemuan percakapan bergantung pada metadata rute sesi Gateway yang sudah ada
- belum ada protokol push generik selain adapter khusus Claude
- belum ada tool edit pesan atau react
- transport HTTP/SSE/streamable-http terhubung ke satu server jarak jauh; belum ada upstream multiplexed
- `permissions_list_open` hanya mencakup approval yang diamati saat bridge terhubung

## Terkait

- [Referensi CLI](/id/cli)
- [Plugin](/id/cli/plugins)
