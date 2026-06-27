---
read_when:
    - Menghubungkan Codex, Claude Code, atau klien MCP lain ke saluran yang didukung OpenClaw
    - Menjalankan `openclaw mcp serve`
    - Mengelola definisi server MCP yang disimpan OpenClaw
sidebarTitle: MCP
summary: Ekspos percakapan kanal OpenClaw melalui MCP dan kelola definisi server MCP yang tersimpan
title: MCP
x-i18n:
    generated_at: "2026-06-27T17:19:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f2bf7050a3a712f761e3008c978f14a7576c9c6fa69d139894acbdcc0f20894b
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` memiliki dua tugas:

- menjalankan OpenClaw sebagai server MCP dengan `openclaw mcp serve`
- mengelola definisi server MCP keluar yang dikelola OpenClaw dengan `list`, `show`, `status`, `doctor`, `probe`, `add`, `set`, `configure`, `tools`, `login`, `logout`, `reload`, dan `unset`

Dengan kata lain:

- `serve` adalah OpenClaw yang bertindak sebagai server MCP
- subperintah lainnya adalah OpenClaw yang bertindak sebagai registry sisi klien MCP untuk server MCP yang mungkin digunakan runtime-nya nanti

<Note>
  `list`, `show`, `set`, dan `unset` hanya membaca dan menulis entri `mcp.servers` yang dikelola OpenClaw dalam konfigurasi OpenClaw. Perintah tersebut tidak menyertakan server mcporter dari `config/mcporter.json`; gunakan `mcporter list` untuk registry tersebut.
</Note>

Gunakan [`openclaw acp`](/id/cli/acp) ketika OpenClaw harus menghosting sesi harness pengodean sendiri dan merutekan runtime tersebut melalui ACP.

## Pilih jalur MCP yang tepat

OpenClaw memiliki beberapa permukaan MCP. Pilih yang sesuai dengan siapa yang memiliki runtime agen dan siapa yang memiliki alat.

| Tujuan                                                                | Gunakan                                                              | Alasan                                                                                                          |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Memungkinkan klien MCP eksternal membaca/mengirim percakapan kanal OpenClaw | `openclaw mcp serve`                                                 | OpenClaw adalah server MCP dan mengekspos percakapan yang didukung Gateway melalui stdio.                       |
| Menyimpan server MCP pihak ketiga untuk proses agen yang dikelola OpenClaw | `openclaw mcp add`, `set`, `configure`, `tools`, `login`             | OpenClaw adalah registry sisi klien MCP dan nanti memproyeksikan server tersebut ke runtime yang memenuhi syarat. |
| Memeriksa server tersimpan tanpa menjalankan giliran agen            | `openclaw mcp status`, `doctor`, `probe`                             | `status` dan `doctor` memeriksa konfigurasi; `probe` membuka koneksi MCP langsung dan mencantumkan kapabilitas. |
| Mengedit konfigurasi MCP dari browser                                | Control UI `/mcp`                                                    | Halaman menampilkan inventaris, pengaktifan, ringkasan OAuth/filter, petunjuk perintah, dan editor `mcp` terbatas cakupan. |
| Memberi Codex app-server server MCP native yang terbatas cakupan     | `mcp.servers.<name>.codex`                                           | Blok `codex` hanya memengaruhi proyeksi thread Codex app-server dan dihapus sebelum penyerahan konfigurasi native. |
| Menjalankan sesi harness yang dihosting ACP                          | [`openclaw acp`](/id/cli/acp) dan [Agen ACP](/id/tools/acp-agents-setup) | Mode bridge ACP tidak menerima injeksi server MCP per sesi; konfigurasikan bridge gateway/plugin sebagai gantinya. |

<Tip>
Jika Anda tidak yakin jalur mana yang dibutuhkan, mulai dengan `openclaw mcp status --verbose`. Perintah ini menunjukkan apa yang telah disimpan OpenClaw tanpa memulai server MCP apa pun.
</Tip>

## OpenClaw sebagai server MCP

Ini adalah jalur `openclaw mcp serve`.

### Kapan menggunakan `serve`

Gunakan `openclaw mcp serve` ketika:

- Codex, Claude Code, atau klien MCP lain harus berbicara langsung dengan percakapan kanal yang didukung OpenClaw
- Anda sudah memiliki Gateway OpenClaw lokal atau jarak jauh dengan sesi yang dirutekan
- Anda menginginkan satu server MCP yang bekerja lintas backend kanal OpenClaw alih-alih menjalankan bridge terpisah per kanal

Gunakan [`openclaw acp`](/id/cli/acp) sebagai gantinya ketika OpenClaw harus menghosting runtime pengodean sendiri dan menjaga sesi agen di dalam OpenClaw.

### Cara kerjanya

`openclaw mcp serve` memulai server MCP stdio. Klien MCP memiliki proses tersebut. Selama klien menjaga sesi stdio tetap terbuka, bridge terhubung ke Gateway OpenClaw lokal atau jarak jauh melalui WebSocket dan mengekspos percakapan kanal yang dirutekan melalui MCP.

<Steps>
  <Step title="Klien memunculkan bridge">
    Klien MCP memunculkan `openclaw mcp serve`.
  </Step>
  <Step title="Bridge terhubung ke Gateway">
    Bridge terhubung ke Gateway OpenClaw melalui WebSocket.
  </Step>
  <Step title="Sesi menjadi percakapan MCP">
    Sesi yang dirutekan menjadi percakapan MCP dan alat transkrip/riwayat.
  </Step>
  <Step title="Antrean peristiwa langsung">
    Peristiwa langsung diantrekan dalam memori selama bridge terhubung.
  </Step>
  <Step title="Push Claude opsional">
    Jika mode kanal Claude diaktifkan, sesi yang sama juga dapat menerima notifikasi push khusus Claude.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Perilaku penting">
    - status antrean langsung dimulai saat bridge terhubung
    - riwayat transkrip lama dibaca dengan `messages_read`
    - notifikasi push Claude hanya ada selama sesi MCP aktif
    - ketika klien terputus, bridge keluar dan antrean langsung hilang
    - titik masuk agen sekali jalan seperti `openclaw agent` dan `openclaw infer model run` menghentikan runtime MCP bawaan apa pun yang dibukanya ketika balasan selesai, sehingga proses skrip berulang tidak mengakumulasi proses anak MCP stdio
    - server MCP stdio yang diluncurkan oleh OpenClaw (bawaan atau dikonfigurasi pengguna) dihentikan sebagai pohon proses saat shutdown, sehingga subproses anak yang dimulai oleh server tidak bertahan setelah klien stdio induk keluar
    - menghapus atau mereset sesi membuang klien MCP sesi tersebut melalui jalur pembersihan runtime bersama, sehingga tidak ada koneksi stdio tertinggal yang terikat ke sesi yang dihapus

  </Accordion>
</AccordionGroup>

### Pilih mode klien

Gunakan bridge yang sama dengan dua cara berbeda:

<Tabs>
  <Tab title="Klien MCP generik">
    Hanya alat MCP standar. Gunakan `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send`, dan alat persetujuan.
  </Tab>
  <Tab title="Claude Code">
    Alat MCP standar ditambah adapter kanal khusus Claude. Aktifkan `--claude-channel-mode on` atau biarkan default `auto`.
  </Tab>
</Tabs>

<Note>
Saat ini, `auto` berperilaku sama seperti `on`. Belum ada deteksi kapabilitas klien.
</Note>

### Apa yang diekspos `serve`

Bridge menggunakan metadata rute sesi Gateway yang ada untuk mengekspos percakapan yang didukung kanal. Percakapan muncul ketika OpenClaw sudah memiliki status sesi dengan rute yang dikenal seperti:

- `channel`
- metadata penerima atau tujuan
- `accountId` opsional
- `threadId` opsional

Ini memberi klien MCP satu tempat untuk:

- mencantumkan percakapan yang baru dirutekan
- membaca riwayat transkrip terbaru
- menunggu peristiwa masuk baru
- mengirim balasan kembali melalui rute yang sama
- melihat permintaan persetujuan yang masuk saat bridge terhubung

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
  <Tab title="Gateway jarak jauh (kata sandi)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password
    ```
  </Tab>
  <Tab title="Verbose / Claude mati">
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
    Mengembalikan satu percakapan berdasarkan `session_key` menggunakan pencarian sesi Gateway langsung.
  </Accordion>
  <Accordion title="messages_read">
    Membaca pesan transkrip terbaru untuk satu percakapan yang didukung sesi.
  </Accordion>
  <Accordion title="attachments_fetch">
    Mengekstrak blok konten pesan non-teks dari satu pesan transkrip. Ini adalah tampilan metadata atas konten transkrip, bukan penyimpanan blob lampiran yang tahan lama dan berdiri sendiri.
  </Accordion>
  <Accordion title="events_poll">
    Membaca peristiwa langsung yang diantrekan sejak kursor numerik.
  </Accordion>
  <Accordion title="events_wait">
    Melakukan long-poll hingga peristiwa antrean berikutnya yang cocok tiba atau waktu tunggu habis.

    Gunakan ini ketika klien MCP generik membutuhkan pengiriman hampir waktu nyata tanpa protokol push khusus Claude.

  </Accordion>
  <Accordion title="messages_send">
    Mengirim teks kembali melalui rute yang sama yang sudah tercatat pada sesi.

    Perilaku saat ini:

    - memerlukan rute percakapan yang sudah ada
    - menggunakan kanal, penerima, id akun, dan id thread sesi
    - hanya mengirim teks

  </Accordion>
  <Accordion title="permissions_list_open">
    Mencantumkan permintaan persetujuan exec/plugin tertunda yang telah diamati bridge sejak terhubung ke Gateway.
  </Accordion>
  <Accordion title="permissions_respond">
    Menyelesaikan satu permintaan persetujuan exec/plugin tertunda dengan:

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### Model peristiwa

Bridge menyimpan antrean peristiwa dalam memori selama terhubung.

Jenis peristiwa saat ini:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- antrean hanya langsung; antrean dimulai saat bridge MCP dimulai
- `events_poll` dan `events_wait` tidak memutar ulang riwayat Gateway yang lebih lama dengan sendirinya
- backlog tahan lama harus dibaca dengan `messages_read`

</Warning>

### Notifikasi kanal Claude

Bridge juga dapat mengekspos notifikasi kanal khusus Claude. Ini adalah padanan OpenClaw untuk adapter kanal Claude Code: alat MCP standar tetap tersedia, tetapi pesan masuk langsung juga dapat hadir sebagai notifikasi MCP khusus Claude.

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

Ketika mode kanal Claude diaktifkan, server mengiklankan kapabilitas eksperimental Claude dan dapat memancarkan:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Perilaku bridge saat ini:

- pesan transkrip `user` masuk diteruskan sebagai `notifications/claude/channel`
- permintaan izin Claude yang diterima melalui MCP dilacak dalam memori
- jika percakapan tertaut kemudian mengirim `yes abcde` atau `no abcde`, bridge mengonversinya menjadi `notifications/claude/channel/permission`
- notifikasi ini hanya untuk sesi langsung; jika klien MCP terputus, tidak ada target push

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
  Log verbose di stderr.
</ParamField>

<Tip>
Lebih pilih `--token-file` atau `--password-file` daripada rahasia inline jika memungkinkan.
</Tip>

### Keamanan dan batas kepercayaan

Bridge tidak membuat routing sendiri. Bridge hanya mengekspos percakapan yang sudah diketahui Gateway cara merutekannya.

Artinya:

- daftar izin pengirim, pairing, dan kepercayaan tingkat channel tetap berada pada konfigurasi channel OpenClaw yang mendasarinya
- `messages_send` hanya dapat membalas melalui rute tersimpan yang sudah ada
- status persetujuan hanya live/di memori untuk sesi bridge saat ini
- autentikasi bridge sebaiknya memakai kontrol token atau kata sandi Gateway yang sama seperti yang akan Anda percayai untuk klien Gateway jarak jauh lainnya

Jika sebuah percakapan tidak ada di `conversations_list`, penyebab biasanya bukan konfigurasi MCP. Penyebabnya adalah metadata rute yang hilang atau tidak lengkap dalam sesi Gateway yang mendasarinya.

### Pengujian

OpenClaw menyertakan smoke Docker deterministik untuk bridge ini:

```bash
pnpm test:docker:mcp-channels
```

Smoke tersebut:

- memulai container Gateway yang telah diberi seed
- memulai container kedua yang menjalankan `openclaw mcp serve`
- memverifikasi penemuan percakapan, pembacaan transkrip, pembacaan metadata lampiran, perilaku antrean event live, dan routing pengiriman keluar
- memvalidasi notifikasi channel dan izin gaya Claude melalui bridge MCP stdio nyata

Ini adalah cara tercepat untuk membuktikan bridge berfungsi tanpa menghubungkan akun Telegram, Discord, atau iMessage nyata ke dalam run pengujian.

Untuk konteks pengujian yang lebih luas, lihat [Pengujian](/id/help/testing).

### Pemecahan masalah

<AccordionGroup>
  <Accordion title="No conversations returned">
    Biasanya berarti sesi Gateway belum dapat dirutekan. Pastikan sesi yang mendasarinya memiliki metadata rute channel/provider, penerima, dan akun/thread opsional yang tersimpan.
  </Accordion>
  <Accordion title="events_poll or events_wait misses older messages">
    Sesuai ekspektasi. Antrean live dimulai saat bridge terhubung. Baca riwayat transkrip lama dengan `messages_read`.
  </Accordion>
  <Accordion title="Claude notifications do not show up">
    Periksa semua hal ini:

    - klien mempertahankan sesi MCP stdio tetap terbuka
    - `--claude-channel-mode` bernilai `on` atau `auto`
    - klien benar-benar memahami metode notifikasi khusus Claude
    - pesan masuk terjadi setelah bridge terhubung

  </Accordion>
  <Accordion title="Approvals are missing">
    `permissions_list_open` hanya menampilkan permintaan persetujuan yang diamati saat bridge terhubung. Ini bukan API riwayat persetujuan yang tahan lama.
  </Accordion>
</AccordionGroup>

## OpenClaw sebagai registry klien MCP

Ini adalah jalur `openclaw mcp list`, `show`, `status`, `doctor`, `probe`, `add`, `set`,
`configure`, `tools`, `login`, `logout`, `reload`, dan `unset`.

Perintah-perintah ini tidak mengekspos OpenClaw melalui MCP. Perintah ini mengelola definisi server MCP yang dikelola OpenClaw di bawah `mcp.servers` dalam konfigurasi OpenClaw. Perintah ini tidak membaca server mcporter dari `config/mcporter.json`.

Definisi yang disimpan tersebut ditujukan untuk runtime yang diluncurkan atau dikonfigurasi OpenClaw nanti, seperti OpenClaw tertanam dan adapter runtime lainnya. OpenClaw menyimpan definisi secara terpusat sehingga runtime tersebut tidak perlu menyimpan daftar server MCP duplikat miliknya sendiri.

<AccordionGroup>
  <Accordion title="Important behavior">
    - perintah ini hanya membaca atau menulis konfigurasi OpenClaw
    - `status`, `list`, `show`, `doctor` tanpa `--probe`, `set`, `configure`, `tools`, `logout`, `reload`, dan `unset` tidak terhubung ke server MCP target
    - `login` menjalankan alur jaringan OAuth MCP untuk server HTTP yang dikonfigurasi dan menyimpan kredensial lokal yang dihasilkan
    - `status --verbose` mencetak petunjuk transport, autentikasi, timeout, filter, dan parallel-tool-call yang sudah di-resolve tanpa terhubung
    - `doctor` memeriksa definisi tersimpan untuk masalah penyiapan lokal seperti perintah stdio yang hilang, direktori kerja tidak valid, file TLS yang hilang, server nonaktif, nilai header/env sensitif literal, dan otorisasi OAuth yang tidak lengkap
    - `doctor --probe` menambahkan bukti koneksi live yang sama seperti `probe` setelah pemeriksaan statis lulus
    - `probe` terhubung ke server yang dipilih atau semua server yang dikonfigurasi, mencantumkan tool, dan melaporkan kapabilitas/diagnostik
    - `add` membangun definisi dari flag dan melakukan probe sebelum menyimpan kecuali `--no-probe` disetel atau otorisasi OAuth diperlukan lebih dulu
    - adapter runtime menentukan bentuk transport mana yang benar-benar didukung saat waktu eksekusi
    - `enabled: false` membuat server tetap tersimpan tetapi mengecualikannya dari penemuan runtime tertanam
    - `timeout` dan `connectTimeout` menetapkan timeout permintaan dan koneksi per server dalam detik
    - `supportsParallelToolCalls: true` menandai server yang dapat dipanggil adapter secara bersamaan
    - server HTTP dapat memakai header statis, login OAuth, kontrol verifikasi TLS, dan path sertifikat/kunci mTLS
    - OpenClaw tertanam mengekspos tool MCP yang dikonfigurasi dalam profil tool normal `coding` dan `messaging`; `minimal` tetap menyembunyikannya, dan `tools.deny: ["bundle-mcp"]` menonaktifkannya secara eksplisit
    - `toolFilter.include` dan `toolFilter.exclude` per server memfilter tool MCP yang ditemukan sebelum menjadi tool OpenClaw
    - server yang mengiklankan resource atau prompt juga mengekspos tool utilitas untuk mencantumkan/membaca resource dan mencantumkan/mengambil prompt; nama utilitas yang dihasilkan (`resources_list`, `resources_read`, `prompts_list`, `prompts_get`) memakai filter include/exclude yang sama
    - perubahan daftar tool MCP dinamis membuat katalog cache untuk sesi tersebut tidak valid; penemuan/penggunaan berikutnya menyegarkan dari server
    - kegagalan permintaan/protokol tool MCP berulang menjeda server tersebut sebentar sehingga satu server yang rusak tidak menghabiskan seluruh turn
    - runtime MCP bundled yang dicakup sesi dibersihkan setelah `mcp.sessionIdleTtlMs` milidetik waktu idle (default 10 menit; setel `0` untuk menonaktifkan) dan run tertanam sekali jalan membersihkannya pada akhir run

  </Accordion>
</AccordionGroup>

Adapter runtime dapat menormalisasi registry bersama ini ke bentuk yang diharapkan klien downstream mereka. Misalnya, OpenClaw tertanam memakai nilai `transport` OpenClaw secara langsung, sementara Claude Code dan Gemini menerima nilai `type` native CLI seperti `http`, `sse`, atau `stdio`.

Codex app-server juga menghormati blok `codex` opsional pada setiap server. Ini adalah
metadata proyeksi OpenClaw hanya untuk thread Codex app-server; ini tidak
mengubah sesi ACP, konfigurasi harness Codex generik, atau adapter runtime lainnya.
Gunakan `codex.agents` yang tidak kosong untuk memproyeksikan server hanya ke id
agen OpenClaw tertentu. Daftar agen kosong, blank, atau tidak valid ditolak oleh
validasi konfigurasi dan dihilangkan oleh jalur proyeksi runtime alih-alih menjadi
global. Gunakan `codex.defaultToolsApprovalMode` (`auto`, `prompt`, atau `approve`)
untuk memancarkan `default_tools_approval_mode` native Codex untuk server tepercaya.
OpenClaw menghapus metadata `codex` sebelum menyerahkan konfigurasi native `mcp_servers`
ke Codex.

### Definisi server MCP tersimpan

OpenClaw juga menyimpan registry server MCP ringan dalam konfigurasi untuk surface yang menginginkan definisi MCP yang dikelola OpenClaw.

Perintah:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp status [--verbose]`
- `openclaw mcp doctor [name] [--probe]`
- `openclaw mcp probe [name]`
- `openclaw mcp add <name> [flags]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp configure <name> [flags]`
- `openclaw mcp tools <name> [--include csv] [--exclude csv] [--clear]`
- `openclaw mcp login <name> [--code code]`
- `openclaw mcp logout <name>`
- `openclaw mcp reload`
- `openclaw mcp unset <name>`

Catatan:

- `list` mengurutkan nama server.
- `show` tanpa nama mencetak objek server MCP lengkap yang dikonfigurasi.
- `status` mengklasifikasikan transport yang dikonfigurasi tanpa terhubung. `--verbose` menyertakan detail launch, timeout, OAuth, filter, dan panggilan paralel yang sudah di-resolve.
- `doctor` melakukan pemeriksaan statis tanpa terhubung. Tambahkan `--probe` saat perintah juga harus memverifikasi bahwa server aktif dapat terhubung.
- `probe` terhubung dan melaporkan jumlah tool, dukungan resources/prompts, dukungan perubahan daftar, dan diagnostik.
- `add` menerima flag stdio seperti `--command`, `--arg`, `--env`, dan `--cwd`, atau flag HTTP seperti `--url`, `--transport`, `--header`, `--auth oauth`, TLS, timeout, dan flag pemilihan tool.
- `set` mengharapkan satu nilai objek JSON pada baris perintah.
- `configure` memperbarui pengaktifan, filter tool, timeout, OAuth, TLS, dan petunjuk parallel-tool-call tanpa mengganti seluruh definisi server.
- `tools` memperbarui filter tool per server. Entri include/exclude adalah nama tool MCP dan glob `*` sederhana.
- `login` menjalankan alur OAuth untuk server HTTP yang dikonfigurasi dengan `auth: "oauth"`. Run pertama mencetak URL otorisasi; jalankan ulang dengan `--code` setelah persetujuan.
- `logout` menghapus kredensial OAuth tersimpan untuk server bernama tanpa menghapus definisi server tersimpan.
- `reload` membuang runtime MCP dalam proses yang di-cache. Proses Gateway atau agen di proses lain tetap memerlukan jalur reload atau restart sendiri.
- Gunakan `transport: "streamable-http"` untuk server MCP Streamable HTTP. `openclaw mcp set` juga menormalisasi `type: "http"` native CLI ke bentuk konfigurasi kanonis yang sama untuk kompatibilitas.
- `unset` gagal jika server bernama tidak ada.

Contoh:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp status --verbose
openclaw mcp doctor --probe
openclaw mcp probe context7 --json
openclaw mcp add memory --command npx --arg -y --arg @modelcontextprotocol/server-memory
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp tools context7 --include 'resolve-library-id,get-library-docs'
openclaw mcp set docs '{"url":"https://mcp.example.com","transport":"streamable-http"}'
openclaw mcp configure docs --timeout 20 --connect-timeout 5 --include 'search,read_*'
openclaw mcp configure docs --auth oauth --oauth-scope 'docs.read'
openclaw mcp login docs
openclaw mcp logout docs
openclaw mcp unset context7
```

### Resep server umum

Contoh-contoh ini hanya menyimpan definisi server. Jalankan `openclaw mcp doctor --probe` setelahnya untuk membuktikan bahwa server dimulai dan mengekspos tool.

<Tabs>
  <Tab title="Filesystem">
    ```bash
    openclaw mcp add files \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-filesystem \
      --arg "$HOME/Documents" \
      --include 'read_file,list_directory,search_files'
    openclaw mcp doctor files --probe
    ```

    Batasi cakupan server filesystem ke pohon direktori terkecil yang harus dibaca atau diedit agen.

  </Tab>
  <Tab title="Memory">
    ```bash
    openclaw mcp add memory \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-memory
    openclaw mcp probe memory --json
    ```

    Gunakan filter tool jika server mengekspos tool tulis yang seharusnya tidak tersedia untuk agen normal.

  </Tab>
  <Tab title="Local script">
    ```bash
    openclaw mcp add local-tools \
      --command node \
      --arg ./dist/mcp-server.js \
      --cwd /srv/openclaw-tools \
      --env API_BASE=https://internal.example
    openclaw mcp status --verbose
    ```

    `doctor` memeriksa bahwa `cwd` ada dan bahwa perintah dapat di-resolve dari lingkungan yang dikonfigurasi.

  </Tab>
  <Tab title="Remote HTTP">
    ```bash
    openclaw mcp add docs \
      --url https://mcp.example.com/mcp \
      --transport streamable-http \
      --auth oauth \
      --oauth-scope docs.read \
      --timeout 20 \
      --connect-timeout 5 \
      --include 'search,read_*'
    openclaw mcp doctor docs --probe
    ```

    Gunakan OAuth saat server jarak jauh mendukungnya. Jika server memerlukan header statis, hindari melakukan commit token bearer literal.

  </Tab>
  <Tab title="Desktop/CUA">
    ```bash
    openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
    openclaw mcp tools cua-driver --include 'list_apps,observe,click,type'
    openclaw mcp doctor cua-driver --probe
    ```

    Server kontrol desktop langsung mewarisi izin dari proses yang diluncurkannya. Gunakan filter alat yang sempit dan prompt izin tingkat OS.

  </Tab>
</Tabs>

### Bentuk output JSON

Gunakan `--json` untuk skrip dan dasbor. Kumpulan field dapat bertambah seiring waktu, jadi konsumen harus mengabaikan kunci yang tidak dikenal.

<AccordionGroup>
  <Accordion title="status --json">
    ```json
    {
      "path": "/home/user/.openclaw/openclaw.json",
      "servers": [
        {
          "name": "docs",
          "configured": true,
          "enabled": true,
          "ok": true,
          "transport": "streamable-http",
          "launch": "streamable-http https://mcp.example.com/mcp",
          "auth": "oauth",
          "authStatus": {
            "hasTokens": true,
            "hasClientInformation": true,
            "hasCodeVerifier": false,
            "hasDiscoveryState": true,
            "hasLastAuthorizationUrl": false
          },
          "requestTimeoutMs": 20000,
          "connectionTimeoutMs": 5000,
          "toolFilter": {
            "include": ["search", "read_*"],
            "exclude": []
          },
          "supportsParallelToolCalls": true
        }
      ]
    }
    ```
  </Accordion>
  <Accordion title="doctor --json">
    ```json
    {
      "ok": false,
      "path": "/home/user/.openclaw/openclaw.json",
      "servers": [
        {
          "name": "docs",
          "ok": false,
          "issues": [
            {
              "level": "error",
              "message": "OAuth credentials are not authorized; run openclaw mcp login docs"
            }
          ]
        }
      ]
    }
    ```

    `doctor --json` keluar dengan status bukan nol saat server aktif mana pun yang diperiksa memiliki error. Peringatan dilaporkan tetapi tidak membuat perintah gagal dengan sendirinya.

  </Accordion>
  <Accordion title="probe --json">
    ```json
    {
      "path": "/home/user/.openclaw/openclaw.json",
      "generatedAt": "2026-05-31T09:00:00.000Z",
      "servers": {
        "docs": {
          "launch": "streamable-http https://mcp.example.com/mcp",
          "tools": 2,
          "resources": true,
          "prompts": false,
          "listChanged": {
            "tools": true,
            "resources": false,
            "prompts": false
          }
        }
      },
      "tools": ["docs__read_page", "docs__search"],
      "diagnostics": []
    }
    ```

    `probe` membuka sesi klien MCP live. Gunakan untuk bukti keterjangkauan dan kapabilitas, bukan untuk audit konfigurasi statis.

  </Accordion>
</AccordionGroup>

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
        "transport": "streamable-http",
        "timeout": 20,
        "connectTimeout": 5,
        "supportsParallelToolCalls": true,
        "auth": "oauth",
        "oauth": {
          "scope": "docs.read"
        },
        "sslVerify": true,
        "clientCert": "/path/to/client.crt",
        "clientKey": "/path/to/client.key",
        "toolFilter": {
          "include": ["search_*"],
          "exclude": ["admin_*"]
        }
      }
    }
  }
}
```

### Transport stdio

Meluncurkan proses anak lokal dan berkomunikasi melalui stdin/stdout.

| Field                      | Deskripsi                          |
| -------------------------- | ---------------------------------- |
| `command`                  | Eksekutabel untuk dijalankan (wajib) |
| `args`                     | Array argumen baris perintah       |
| `env`                      | Variabel lingkungan tambahan       |
| `cwd` / `workingDirectory` | Direktori kerja untuk proses       |

<Warning>
**Filter keamanan env stdio**

OpenClaw menolak kunci env startup interpreter yang dapat mengubah cara server MCP stdio dimulai sebelum RPC pertama, meskipun kunci tersebut muncul di blok `env` server. Kunci yang diblokir mencakup `BASHOPTS`, `FPATH`, `KSH_ENV`, `NODE_OPTIONS`, `NODE_REDIRECT_WARNINGS`, `NODE_REPL_EXTERNAL_MODULE`, `NODE_REPL_HISTORY`, `NODE_V8_COVERAGE`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4`, `TCLLIBPATH`, dan variabel kontrol runtime serupa. Startup menolak ini dengan error konfigurasi agar variabel tersebut tidak dapat menyuntikkan prelude implisit, menukar interpreter, mengaktifkan debugger, atau mengalihkan output runtime terhadap proses stdio. Variabel env kredensial, proxy, dan khusus server yang biasa (`GITHUB_TOKEN`, `HTTP_PROXY`, `*_API_KEY` khusus, dll.) tidak terpengaruh.

Jika server MCP Anda benar-benar memerlukan salah satu variabel yang diblokir, tetapkan variabel tersebut pada proses host gateway, bukan di bawah `env` server stdio.
</Warning>

### Transport SSE / HTTP

Menghubungkan ke server MCP jarak jauh melalui HTTP Server-Sent Events.

| Field                          | Deskripsi                                                        |
| ------------------------------ | ---------------------------------------------------------------- |
| `url`                          | URL HTTP atau HTTPS server jarak jauh (wajib)                    |
| `headers`                      | Peta kunci-nilai opsional untuk header HTTP (misalnya token auth) |
| `connectionTimeoutMs`          | Timeout koneksi per server dalam ms (opsional)                   |
| `connectTimeout`               | Timeout koneksi per server dalam detik (opsional)                |
| `timeout` / `requestTimeoutMs` | Timeout permintaan MCP per server dalam detik atau ms            |
| `auth: "oauth"`                | Gunakan penyimpanan token OAuth MCP dan `openclaw mcp login`     |
| `sslVerify`                    | Tetapkan false hanya untuk endpoint HTTPS privat yang dipercaya secara eksplisit |
| `clientCert` / `clientKey`     | Jalur sertifikat dan kunci klien mTLS                            |
| `supportsParallelToolCalls`    | Petunjuk bahwa panggilan konkuren aman untuk server ini          |

Contoh:

```json
{
  "mcp": {
    "servers": {
      "remote-tools": {
        "url": "https://mcp.example.com",
        "auth": "oauth",
        "timeout": 20,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

Nilai sensitif dalam `url` (userinfo) dan `headers` disensor dalam log dan output status. `openclaw mcp doctor` memperingatkan saat entri `headers` atau `env` yang tampak sensitif berisi nilai literal, sehingga operator dapat memindahkan nilai tersebut keluar dari konfigurasi yang di-commit.

### Alur kerja OAuth

OAuth ditujukan untuk server MCP HTTP yang mengiklankan alur OAuth MCP. Header `Authorization` statis diabaikan untuk server saat `auth: "oauth"` diaktifkan.

<Steps>
  <Step title="Save the server">
    Tambahkan atau perbarui server dengan `auth: "oauth"` dan metadata OAuth opsional apa pun.

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"scope":"docs.read"}}'
    ```

  </Step>
  <Step title="Start login">
    Jalankan login untuk membuat permintaan otorisasi.

    ```bash
    openclaw mcp login docs
    ```

    OpenClaw mencetak URL otorisasi dan menyimpan status verifier OAuth sementara di bawah direktori status OpenClaw.

  </Step>
  <Step title="Finish with the code">
    Setelah menyetujui di browser, berikan kode yang dikembalikan kembali ke OpenClaw.

    ```bash
    openclaw mcp login docs --code abc123
    ```

  </Step>
  <Step title="Check authorization">
    Gunakan status atau doctor untuk mengonfirmasi bahwa token tersedia.

    ```bash
    openclaw mcp status --verbose
    openclaw mcp doctor docs --probe
    ```

  </Step>
  <Step title="Clear credentials">
    Logout menghapus kredensial OAuth tersimpan tetapi mempertahankan definisi server yang disimpan.

    ```bash
    openclaw mcp logout docs
    ```

  </Step>
</Steps>

Jika penyedia merotasi token atau status otorisasi macet, jalankan `openclaw mcp logout <name>`, lalu ulangi `login`. `logout` dapat menghapus kredensial untuk server HTTP tersimpan bahkan setelah `auth: "oauth"` dihapus dari konfigurasi, selama nama server dan URL masih mengidentifikasi entri penyimpanan kredensial.

### Transport HTTP streamable

`streamable-http` adalah opsi transport tambahan bersama `sse` dan `stdio`. Ini menggunakan streaming HTTP untuk komunikasi dua arah dengan server MCP jarak jauh.

| Field                          | Deskripsi                                                                            |
| ------------------------------ | ------------------------------------------------------------------------------------ |
| `url`                          | URL HTTP atau HTTPS server jarak jauh (wajib)                                        |
| `transport`                    | Tetapkan ke `"streamable-http"` untuk memilih transport ini; saat dihilangkan, OpenClaw menggunakan `sse` |
| `headers`                      | Peta kunci-nilai opsional untuk header HTTP (misalnya token auth)                    |
| `connectionTimeoutMs`          | Timeout koneksi per server dalam ms (opsional)                                       |
| `connectTimeout`               | Timeout koneksi per server dalam detik (opsional)                                    |
| `timeout` / `requestTimeoutMs` | Timeout permintaan MCP per server dalam detik atau ms                                |
| `auth: "oauth"`                | Gunakan penyimpanan token OAuth MCP dan `openclaw mcp login`                         |
| `sslVerify`                    | Tetapkan false hanya untuk endpoint HTTPS privat yang dipercaya secara eksplisit      |
| `clientCert` / `clientKey`     | Jalur sertifikat dan kunci klien mTLS                                                |
| `supportsParallelToolCalls`    | Petunjuk bahwa panggilan konkuren aman untuk server ini                              |

Konfigurasi OpenClaw menggunakan `transport: "streamable-http"` sebagai ejaan kanonis. Nilai MCP native CLI `type: "http"` diterima saat disimpan melalui `openclaw mcp set` dan diperbaiki oleh `openclaw doctor --fix` dalam konfigurasi yang sudah ada, tetapi `transport` adalah yang langsung dikonsumsi oleh OpenClaw tertanam.

Contoh:

```json
{
  "mcp": {
    "servers": {
      "streaming-tools": {
        "url": "https://mcp.example.com/stream",
        "transport": "streamable-http",
        "connectTimeout": 10,
        "timeout": 30,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

<Note>
Perintah registri tidak memulai bridge channel. Hanya `probe` dan `doctor --probe` yang membuka sesi klien MCP live untuk membuktikan bahwa server target dapat dijangkau.
</Note>

## UI Kontrol

UI Kontrol browser mencakup halaman pengaturan MCP khusus di `/mcp`. Halaman ini menampilkan jumlah server yang dikonfigurasi, ringkasan aktif/OAuth/filter, baris transport per server, kontrol aktif/nonaktif, perintah CLI umum, dan editor terskop untuk bagian konfigurasi `mcp`.

Gunakan halaman ini untuk edit operator dan inventaris cepat. Gunakan `openclaw mcp doctor --probe` atau `openclaw mcp probe` saat Anda memerlukan bukti server live.

Alur kerja operator:

1. Buka UI Kontrol dan pilih **MCP**.
2. Tinjau kartu ringkasan untuk total, diaktifkan, OAuth, dan server terfilter.
3. Gunakan setiap baris server untuk petunjuk transport, autentikasi, filter, batas waktu, dan perintah.
4. Alihkan pengaktifan saat Anda ingin mempertahankan definisi tetapi mengecualikannya dari penemuan runtime.
5. Edit bagian konfigurasi `mcp` yang tercakup untuk perubahan struktural seperti server baru, header, TLS, metadata OAuth, atau filter alat.
6. Pilih **Simpan** untuk menyimpan konfigurasi saja, atau **Simpan & Publikasikan** untuk menerapkannya melalui jalur konfigurasi Gateway.
7. Jalankan `openclaw mcp doctor --probe` saat Anda memerlukan bukti langsung bahwa server yang diedit dapat berjalan dan mencantumkan alat.

Catatan:

- cuplikan perintah mengapit nama server dengan tanda kutip agar nama yang tidak biasa tetap dapat disalin di shell
- nilai yang ditampilkan seperti URL disunting sebelum dirender saat berisi kredensial tertanam
- halaman ini tidak memulai transport MCP dengan sendirinya
- runtime aktif mungkin memerlukan `openclaw mcp reload`, publikasi konfigurasi Gateway, atau mulai ulang proses, bergantung pada proses mana yang memiliki klien MCP

## Batasan saat ini

Halaman ini mendokumentasikan jembatan sebagaimana dirilis saat ini.

Batasan saat ini:

- penemuan percakapan bergantung pada metadata rute sesi Gateway yang sudah ada
- belum ada protokol push generik selain adapter khusus Claude
- belum ada alat edit pesan atau reaksi
- transport HTTP/SSE/streamable-http terhubung ke satu server jarak jauh; belum ada upstream multipleks
- `permissions_list_open` hanya menyertakan persetujuan yang diamati saat jembatan terhubung

## Terkait

- [Referensi CLI](/id/cli)
- [Plugin](/id/cli/plugins)
