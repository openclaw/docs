---
read_when:
    - Menghubungkan Codex, Claude Code, atau klien MCP lain ke saluran yang didukung OpenClaw
    - Menjalankan `openclaw mcp serve`
    - Mengelola definisi server MCP yang disimpan OpenClaw
sidebarTitle: MCP
summary: Ekspos percakapan kanal OpenClaw melalui MCP dan kelola definisi server MCP yang tersimpan
title: MCP
x-i18n:
    generated_at: "2026-07-21T12:31:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ee6146bbc0181d10997336094d1bd693d0afb0985f1febef8e8c6b0d6e656cf9
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` memiliki dua tugas:

- menjalankan OpenClaw sebagai server MCP dengan `openclaw mcp serve`
- mengelola definisi server MCP keluar yang dikelola OpenClaw dengan `list`, `show`, `status`, `doctor`, `probe`, `add`, `set`, `configure`, `tools`, `login`, `logout`, `reload`, dan `unset`

`serve` adalah OpenClaw yang bertindak sebagai server MCP. Subperintah lainnya adalah OpenClaw yang bertindak sebagai registri sisi klien MCP untuk server yang nantinya dapat digunakan oleh runtime-nya sendiri.

<Note>
  `list`, `show`, `set`, dan `unset` hanya membaca dan menulis entri `mcp.servers` yang dikelola OpenClaw dalam konfigurasi OpenClaw. Perintah tersebut tidak menyertakan server mcporter dari `config/mcporter.json`; gunakan `mcporter list` untuk registri tersebut.
</Note>

Gunakan [`openclaw acp`](/id/cli/acp) ketika OpenClaw harus menghosting sendiri sesi harness pengodean dan merutekan runtime tersebut melalui ACP.

## Pilih jalur MCP yang tepat

| Tujuan                                                                | Gunakan                                                                  | Alasan                                                                                                             |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Memungkinkan klien MCP eksternal membaca/mengirim percakapan saluran OpenClaw | `openclaw mcp serve`                                                 | OpenClaw adalah server MCP dan mengekspos percakapan yang didukung Gateway melalui stdio.                                 |
| Menyimpan server MCP pihak ketiga untuk proses agen yang dikelola OpenClaw        | `openclaw mcp add`, `set`, `configure`, `tools`, `login`             | OpenClaw adalah registri sisi klien MCP dan nantinya memproyeksikan server tersebut ke runtime yang memenuhi syarat.               |
| Memeriksa server tersimpan tanpa menjalankan giliran agen                  | `openclaw mcp status`, `doctor`, `probe`                             | `status` dan `doctor` memeriksa konfigurasi; `probe` membuka koneksi MCP langsung dan mencantumkan kapabilitas.               |
| Mengedit konfigurasi MCP dari browser                                      | UI Kontrol `/settings/mcp` (alias `/mcp`)                            | Halaman tersebut menampilkan inventaris, status pengaktifan, ringkasan OAuth/filter, petunjuk perintah, dan editor `mcp` dengan cakupan tertentu.         |
| Memberikan server MCP native dengan cakupan tertentu kepada app-server Codex                    | `mcp.servers.<name>.codex`                                           | Blok `codex` hanya memengaruhi proyeksi utas app-server Codex dan dihapus sebelum penyerahan konfigurasi native. |
| Menjalankan sesi harness yang dihosting ACP                                     | [`openclaw acp`](/id/cli/acp) dan [Agen ACP](/id/tools/acp-agents-setup) | Mode jembatan ACP tidak menerima injeksi server MCP per sesi; konfigurasikan jembatan gateway/plugin sebagai gantinya.     |

<Tip>
Jika tidak yakin jalur mana yang diperlukan, mulai dengan `openclaw mcp status --verbose`. Perintah ini menunjukkan apa yang telah disimpan OpenClaw tanpa memulai server MCP apa pun.
</Tip>

## OpenClaw sebagai server MCP

Ini adalah jalur `openclaw mcp serve`.

### Kapan menggunakan serve

Gunakan `openclaw mcp serve` ketika:

- Codex, Claude Code, atau klien MCP lain harus berkomunikasi langsung dengan percakapan saluran yang didukung OpenClaw
- Anda sudah memiliki Gateway OpenClaw lokal atau jarak jauh dengan sesi yang dirutekan
- Anda menginginkan satu server MCP yang berfungsi di seluruh backend saluran OpenClaw, alih-alih menjalankan jembatan terpisah untuk setiap saluran

Gunakan [`openclaw acp`](/id/cli/acp) sebagai gantinya ketika OpenClaw harus menghosting sendiri runtime pengodean dan mempertahankan sesi agen di dalam OpenClaw.

### Cara kerjanya

`openclaw mcp serve` memulai server MCP stdio. Klien MCP memiliki proses tersebut. Selama klien mempertahankan sesi stdio tetap terbuka, jembatan terhubung ke Gateway OpenClaw lokal atau jarak jauh melalui WebSocket dan mengekspos percakapan saluran yang dirutekan melalui MCP.

<Steps>
  <Step title="Klien memulai jembatan">
    Klien MCP memulai `openclaw mcp serve`.
  </Step>
  <Step title="Jembatan terhubung ke Gateway">
    Jembatan terhubung ke Gateway OpenClaw melalui WebSocket.
  </Step>
  <Step title="Sesi menjadi percakapan MCP">
    Sesi yang dirutekan menjadi percakapan MCP serta alat transkrip/riwayat.
  </Step>
  <Step title="Peristiwa langsung masuk antrean">
    Peristiwa langsung dimasukkan ke antrean dalam memori selama jembatan terhubung.
  </Step>
  <Step title="Push Claude opsional">
    Jika mode saluran Claude diaktifkan, sesi yang sama juga dapat menerima notifikasi push khusus Claude.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Perilaku penting">
    - status antrean langsung dimulai ketika jembatan terhubung
    - riwayat transkrip lama dibaca dengan `messages_read`
    - notifikasi push Claude hanya tersedia selama sesi MCP aktif
    - ketika klien terputus, jembatan keluar dan antrean langsung hilang
    - titik masuk agen sekali jalan seperti `openclaw agent` dan `openclaw infer model run` menghentikan runtime MCP bawaan yang dibukanya saat balasan selesai, sehingga proses skrip berulang tidak mengakumulasi proses anak MCP stdio
    - server MCP stdio yang dijalankan oleh OpenClaw (bawaan atau dikonfigurasi pengguna) dihentikan sebagai pohon proses saat penonaktifan, sehingga subproses anak yang dimulai oleh server tidak tetap berjalan setelah klien stdio induk keluar
    - menghapus atau mengatur ulang sesi akan membuang klien MCP sesi tersebut melalui jalur pembersihan runtime bersama, sehingga tidak ada koneksi stdio tersisa yang terkait dengan sesi yang telah dihapus

  </Accordion>
</AccordionGroup>

### Pilih mode klien

<Tabs>
  <Tab title="Klien MCP generik">
    Hanya alat MCP standar. Gunakan `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send`, dan alat persetujuan.
  </Tab>
  <Tab title="Claude Code">
    Alat MCP standar ditambah adaptor saluran khusus Claude. Aktifkan `--claude-channel-mode on` atau biarkan nilai default `auto`.
  </Tab>
</Tabs>

<Note>
Saat ini, `auto` berperilaku sama seperti `on`. Deteksi kapabilitas klien belum tersedia.
</Note>

### Yang diekspos serve

Jembatan menggunakan metadata rute sesi Gateway yang sudah ada untuk mengekspos percakapan yang didukung saluran. Percakapan muncul ketika OpenClaw sudah memiliki status sesi dengan rute yang diketahui, seperti:

- `channel`
- metadata penerima atau tujuan
- `accountId` opsional
- `threadId` opsional

Ini memberi klien MCP satu tempat untuk:

- mencantumkan percakapan terbaru yang dirutekan
- membaca riwayat transkrip terbaru
- menunggu peristiwa masuk baru
- mengirim balasan kembali melalui rute yang sama
- melihat permintaan persetujuan yang masuk selama jembatan terhubung

### Penggunaan

<Tabs>
  <Tab title="Gateway Lokal">
    ```bash
    openclaw mcp serve
    ```
  </Tab>
  <Tab title="Gateway Jarak Jauh (token)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
    ```
  </Tab>
  <Tab title="Gateway Jarak Jauh (kata sandi)">
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

### Alat jembatan

<AccordionGroup>
  <Accordion title="conversations_list">
    Mencantumkan percakapan berbasis sesi terbaru yang sudah memiliki metadata rute dalam status sesi Gateway.

    Filter: `limit` (maks. 500), `search`, `channel`, `includeDerivedTitles`, `includeLastMessage`.

  </Accordion>
  <Accordion title="conversation_get">
    Mengembalikan satu percakapan berdasarkan `session_key` menggunakan pencarian sesi Gateway langsung.
  </Accordion>
  <Accordion title="messages_read">
    Membaca pesan transkrip terbaru untuk satu percakapan berbasis sesi. Nilai default `limit` adalah 20, maks. 200.
  </Accordion>
  <Accordion title="attachments_fetch">
    Mengekstrak blok konten pesan nonteks dari satu pesan transkrip. Ini adalah tampilan metadata atas konten transkrip, bukan penyimpanan blob lampiran mandiri yang persisten.
  </Accordion>
  <Accordion title="events_poll">
    Membaca peristiwa langsung yang masuk antrean sejak kursor numerik. `limit` maks. 200.
  </Accordion>
  <Accordion title="events_wait">
    Melakukan long-poll hingga peristiwa berikutnya yang cocok dalam antrean tiba atau batas waktu berakhir (default 30 dtk., maks. 300 dtk.).

    Gunakan ini ketika klien MCP generik memerlukan pengiriman hampir waktu nyata tanpa protokol push khusus Claude.

  </Accordion>
  <Accordion title="messages_send">
    Mengirim teks kembali melalui rute yang sama yang sudah tercatat pada sesi.

    Perilaku saat ini:

    - memerlukan rute percakapan yang sudah ada
    - menggunakan saluran, penerima, ID akun, dan ID utas sesi
    - hanya mengirim teks

  </Accordion>
  <Accordion title="permissions_list_open">
    Mencantumkan permintaan persetujuan eksekusi/plugin tertunda yang telah diamati jembatan sejak terhubung ke Gateway.
  </Accordion>
  <Accordion title="permissions_respond">
    Menyelesaikan satu permintaan persetujuan eksekusi/plugin tertunda dengan:

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### Model peristiwa

Jembatan menyimpan antrean peristiwa dalam memori selama terhubung.

Jenis peristiwa saat ini:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- antrean hanya bersifat langsung; antrean dimulai saat jembatan MCP dimulai
- `events_poll` dan `events_wait` tidak memutar ulang riwayat Gateway lama dengan sendirinya
- backlog persisten harus dibaca dengan `messages_read`

</Warning>

### Notifikasi saluran Claude

Jembatan juga dapat mengekspos notifikasi saluran khusus Claude. Ini adalah padanan adaptor saluran Claude Code di OpenClaw: alat MCP standar tetap tersedia, tetapi pesan masuk langsung juga dapat tiba sebagai notifikasi MCP khusus Claude.

<Tabs>
  <Tab title="off">
    `--claude-channel-mode off`: hanya alat MCP standar.
  </Tab>
  <Tab title="on">
    `--claude-channel-mode on`: aktifkan notifikasi saluran Claude.
  </Tab>
  <Tab title="auto (default)">
    `--claude-channel-mode auto`: default saat ini; perilaku jembatan sama seperti `on`.
  </Tab>
</Tabs>

Ketika mode saluran Claude diaktifkan, server mengumumkan kapabilitas eksperimental Claude dan dapat memancarkan:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Perilaku jembatan saat ini:

- pesan transkrip masuk `user` diteruskan sebagai `notifications/claude/channel`
- permintaan izin Claude yang diterima melalui MCP dilacak dalam memori
- jika pemilik perintah dalam percakapan tertaut kemudian mengirim `yes <id>` atau `no <id>` (`<id>` adalah ID permintaan 5 huruf, tidak termasuk `l`), jembatan mengonversinya menjadi `notifications/claude/channel/permission`
- notifikasi ini hanya tersedia untuk sesi langsung; jika klien MCP terputus, tidak ada target push

Ini sengaja dibuat khusus untuk klien. Klien MCP generik sebaiknya mengandalkan alat polling standar.

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
  URL WebSocket Gateway. Secara default menggunakan `gateway.remote.url` jika dikonfigurasi.
</ParamField>
<ParamField path="--token" type="string">
  Token Gateway.
</ParamField>
<ParamField path="--token-file" type="string">
  Baca token dari berkas.
</ParamField>
<ParamField path="--password" type="string">
  Kata sandi Gateway.
</ParamField>
<ParamField path="--password-file" type="string">
  Baca kata sandi dari berkas.
</ParamField>
<ParamField path="--claude-channel-mode" type='"auto" | "on" | "off"'>
  Mode notifikasi Claude. Default `auto`.
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  Log terperinci di stderr.
</ParamField>

<Tip>
Jika memungkinkan, utamakan `--token-file` atau `--password-file` daripada rahasia sebaris.
</Tip>

### Batas keamanan dan kepercayaan

Bridge tidak menciptakan perutean. Bridge hanya mengekspos percakapan yang sudah diketahui cara dirutekannya oleh Gateway.

Artinya:

- daftar pengirim yang diizinkan, pemasangan, dan kepercayaan tingkat kanal tetap menjadi bagian dari konfigurasi kanal OpenClaw yang mendasarinya
- `messages_send` hanya dapat membalas melalui rute tersimpan yang sudah ada
- status persetujuan hanya aktif/tersimpan dalam memori untuk sesi bridge saat ini
- autentikasi bridge harus menggunakan kontrol token atau kata sandi Gateway yang sama dengan yang Anda percayai untuk klien Gateway jarak jauh lainnya

Jika suatu percakapan tidak ada di `conversations_list`, penyebab umumnya bukan konfigurasi MCP. Penyebabnya adalah metadata rute yang hilang atau tidak lengkap dalam sesi Gateway yang mendasarinya.

### Pengujian

OpenClaw menyediakan pengujian smoke Docker deterministik untuk bridge ini:

```bash
pnpm test:docker:mcp-channels
```

Pengujian smoke tersebut menjalankan satu kontainer: mengisi status percakapan, memulai Gateway, lalu menjalankan `openclaw mcp serve` sebagai proses anak stdio dan mengendalikannya sebagai klien MCP. Pengujian ini memverifikasi penemuan percakapan, pembacaan transkrip, pembacaan metadata lampiran, perilaku antrean peristiwa langsung, serta notifikasi kanal dan izin bergaya Claude melalui bridge MCP stdio yang sebenarnya. Perutean pengiriman keluar (`messages_send` yang menggunakan kembali rute percakapan tersimpan) diuji secara terpisah oleh pengujian unit di `src/mcp/channel-server.test.ts`.

Ini adalah cara tercepat untuk membuktikan bahwa bridge berfungsi tanpa menghubungkan akun Telegram, Discord, atau iMessage yang sebenarnya ke dalam proses pengujian.

Untuk konteks pengujian yang lebih luas, lihat [Pengujian](/id/help/testing).

### Pemecahan masalah

<AccordionGroup>
  <Accordion title="Tidak ada percakapan yang dikembalikan">
    Biasanya berarti sesi Gateway belum dapat dirutekan. Pastikan sesi yang mendasarinya telah menyimpan metadata rute kanal/penyedia, penerima, serta akun/utas opsional.
  </Accordion>
  <Accordion title="events_poll atau events_wait melewatkan pesan lama">
    Sesuai perkiraan. Antrean langsung dimulai saat bridge terhubung. Baca riwayat transkrip lama dengan `messages_read`.
  </Accordion>
  <Accordion title="Notifikasi Claude tidak muncul">
    Periksa semua hal berikut:

    - klien mempertahankan sesi MCP stdio tetap terbuka
    - `--claude-channel-mode` adalah `on` atau `auto`
    - klien benar-benar memahami metode notifikasi khusus Claude
    - pesan masuk terjadi setelah bridge terhubung

  </Accordion>
  <Accordion title="Persetujuan tidak ada">
    `permissions_list_open` hanya menampilkan permintaan persetujuan yang diamati saat bridge terhubung. Ini bukan API riwayat persetujuan yang persisten.
  </Accordion>
</AccordionGroup>

## OpenClaw sebagai registri klien MCP

Ini adalah jalur `openclaw mcp list`, `show`, `status`, `doctor`, `probe`, `add`, `set`,
`configure`, `tools`, `login`, `logout`, `reload`, dan `unset`.

Perintah-perintah ini tidak mengekspos OpenClaw melalui MCP. Perintah tersebut mengelola definisi server MCP yang dikelola OpenClaw di bawah `mcp.servers` dalam konfigurasi OpenClaw. Perintah tersebut tidak membaca server mcporter dari `config/mcporter.json`.

Definisi tersimpan tersebut ditujukan untuk runtime yang nantinya diluncurkan atau dikonfigurasi oleh OpenClaw, seperti OpenClaw tertanam dan adaptor runtime lainnya. OpenClaw menyimpan definisi tersebut secara terpusat agar runtime itu tidak perlu menyimpan daftar server MCP duplikatnya sendiri.

<AccordionGroup>
  <Accordion title="Perilaku penting">
    - perintah-perintah ini hanya membaca atau menulis konfigurasi OpenClaw
    - `status`, `list`, `show`, `doctor` tanpa `--probe`, `set`, `configure`, `tools`, `logout`, `reload`, dan `unset` tidak terhubung ke server MCP tujuan
    - `login` menjalankan alur jaringan OAuth MCP untuk server HTTP yang dikonfigurasi dan menyimpan kredensial lokal yang dihasilkan
    - `status --verbose` mencetak petunjuk transportasi, autentikasi, batas waktu, filter, dan pemanggilan alat paralel yang telah diuraikan tanpa terhubung
    - `doctor` memeriksa definisi tersimpan untuk masalah penyiapan lokal seperti perintah stdio yang tidak ada, direktori kerja yang tidak valid, berkas TLS yang tidak ada, server yang dinonaktifkan, nilai header/env sensitif literal, dan otorisasi OAuth yang belum lengkap
    - `doctor --probe` menambahkan bukti koneksi langsung yang sama seperti `probe` setelah pemeriksaan statis berhasil
    - `probe` terhubung ke server yang dipilih atau semua server yang dikonfigurasi, mencantumkan alat, dan melaporkan kapabilitas/diagnostik
    - `add` membuat definisi dari flag dan melakukan pemeriksaan sebelum menyimpan, kecuali `--no-probe` ditetapkan atau otorisasi OAuth perlu dilakukan terlebih dahulu
    - adaptor runtime menentukan bentuk transportasi mana yang benar-benar didukung pada waktu eksekusi
    - `enabled: false` mempertahankan server tetap tersimpan tetapi mengecualikannya dari penemuan runtime tertanam
    - `requestTimeoutMs` dan `connectionTimeoutMs` menetapkan batas waktu permintaan dan koneksi per server dalam milidetik
    - `supportsParallelToolCalls: true` menandai server yang dapat dipanggil secara bersamaan oleh adaptor
    - server HTTP dapat menggunakan header statis, login OAuth, kontrol verifikasi TLS, serta jalur sertifikat/kunci mTLS
    - OpenClaw tertanam mengekspos alat MCP yang dikonfigurasi dalam profil alat `coding` dan `messaging` normal; `minimal` tetap menyembunyikannya, dan `tools.deny: ["bundle-mcp"]` menonaktifkannya secara eksplisit
    - `toolFilter.include` dan `toolFilter.exclude` per server memfilter alat MCP yang ditemukan sebelum menjadi alat OpenClaw
    - server yang mengiklankan sumber daya atau prompt juga mengekspos alat utilitas untuk mencantumkan/membaca sumber daya dan mencantumkan/mengambil prompt; nama utilitas yang dihasilkan tersebut (`resources_list`, `resources_read`, `prompts_list`, `prompts_get`) menggunakan filter penyertaan/pengecualian yang sama
    - perubahan dinamis pada daftar alat MCP membatalkan katalog yang tersimpan dalam cache untuk sesi tersebut; penemuan/penggunaan berikutnya menyegarkan data dari server
    - kegagalan permintaan/protokol alat MCP yang berulang menjeda server tersebut untuk sementara agar satu server yang rusak tidak menghabiskan seluruh giliran
    - runtime MCP bawaan dengan cakupan sesi dihentikan setelah tidak aktif selama 10 menit dan proses tertanam sekali jalan membersihkannya pada akhir proses

  </Accordion>
</AccordionGroup>

Adaptor runtime dapat menormalisasi registri bersama ini ke dalam bentuk yang diharapkan oleh klien hilirnya. Misalnya, OpenClaw tertanam menggunakan nilai `transport` OpenClaw secara langsung, sedangkan Claude Code dan Gemini menerima nilai `type` native CLI seperti `http`, `sse`, atau `stdio`.

Codex app-server juga mematuhi blok `codex` opsional pada setiap server. Ini adalah
metadata proyeksi OpenClaw khusus untuk utas Codex app-server; metadata ini tidak
mengubah sesi ACP, konfigurasi harness Codex generik, atau adaptor runtime lainnya.
Gunakan `codex.agents` yang tidak kosong untuk memproyeksikan server hanya ke id agen
OpenClaw tertentu. Daftar agen yang kosong, hanya berisi spasi, atau tidak valid ditolak oleh
validasi konfigurasi dan dihilangkan oleh jalur proyeksi runtime, alih-alih menjadi
global. Gunakan `codex.defaultToolsApprovalMode` (`auto`, `prompt`, atau `approve`)
untuk menghasilkan `default_tools_approval_mode` native Codex bagi server tepercaya.
OpenClaw menghapus metadata `codex` sebelum menyerahkan konfigurasi native `mcp_servers`
ke Codex.

### Definisi server MCP tersimpan

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
- `show` tanpa nama mencetak objek server MCP terkonfigurasi secara lengkap.
- `status` mengklasifikasikan transportasi yang dikonfigurasi tanpa terhubung. `--verbose` mencakup detail peluncuran, batas waktu, OAuth, filter, dan pemanggilan paralel yang telah diuraikan, termasuk saat token OAuth tersimpan memerlukan otorisasi tambahan. Argumen stdio yang memuat kredensial disamarkan dalam keluaran teks dan JSON.
- `doctor` menjalankan pemeriksaan statis tanpa terhubung. Tambahkan `--probe` saat perintah juga harus memverifikasi bahwa server yang diaktifkan dapat terhubung.
- `probe` terhubung dan melaporkan jumlah alat, dukungan sumber daya/prompt, dukungan perubahan daftar, dan diagnostik.
- `add` menerima flag stdio seperti `--command`, `--arg`, `--env`, dan `--cwd`, atau flag HTTP seperti `--url`, `--transport`, `--header`, `--auth oauth`, TLS, batas waktu, dan flag pemilihan alat.
- `set` mengharapkan satu nilai objek JSON pada baris perintah.
- `configure` memperbarui status pengaktifan, filter alat, batas waktu, OAuth, TLS, dan petunjuk pemanggilan alat paralel tanpa mengganti seluruh definisi server. Tambahkan `--probe` untuk memverifikasi server yang diperbarui sebelum menyimpan.
- `tools` memperbarui filter alat per server. Entri penyertaan/pengecualian adalah nama alat MCP dan glob `*` sederhana.
- `login` menjalankan alur OAuth untuk server HTTP yang dikonfigurasi dengan `auth: "oauth"`. Proses pertama mencetak URL otorisasi; jalankan kembali dengan `--code` setelah disetujui.
- `logout` menghapus kredensial OAuth tersimpan untuk server bernama tanpa menghapus definisi server tersimpan.
- `reload` membuang runtime MCP dalam proses yang tersimpan dalam cache hanya untuk proses CLI saat ini. Proses Gateway atau agen dalam proses lain tetap memerlukan jalur pemuatan ulang atau mulai ulangnya sendiri.
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

Contoh-contoh ini hanya menyimpan definisi server. Jalankan `openclaw mcp doctor --probe` setelahnya untuk membuktikan bahwa server dapat dimulai dan menyediakan alat.

<Tabs>
  <Tab title="Sistem berkas">
    ```bash
    openclaw mcp add files \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-filesystem \
      --arg "$HOME/Documents" \
      --include 'read_file,list_directory,search_files'
    openclaw mcp doctor files --probe
    ```

    Batasi cakupan server sistem berkas ke pohon direktori terkecil yang perlu dibaca atau diedit oleh agen.

  </Tab>
  <Tab title="Memori">
    ```bash
    openclaw mcp add memory \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-memory
    openclaw mcp probe memory --json
    ```

    Gunakan filter alat jika server menyediakan alat tulis yang tidak seharusnya tersedia bagi agen biasa.

  </Tab>
  <Tab title="Skrip lokal">
    ```bash
    openclaw mcp add local-tools \
      --command node \
      --arg ./dist/mcp-server.js \
      --cwd /srv/openclaw-tools \
      --env API_BASE=https://internal.example
    openclaw mcp status --verbose
    ```

    `doctor` memeriksa bahwa `cwd` ada dan perintah dapat ditemukan dari lingkungan yang dikonfigurasi.

  </Tab>
  <Tab title="HTTP jarak jauh">
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

    Gunakan OAuth jika server jarak jauh mendukungnya. Jika server memerlukan header statis, hindari melakukan commit terhadap token bearer literal.

  </Tab>
  <Tab title="Desktop/CUA">
    ```bash
    openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
    openclaw mcp tools cua-driver --include 'list_apps,get_window_state,click,type_text'
    openclaw mcp doctor cua-driver --probe
    ```

    Server kontrol desktop langsung mewarisi izin proses yang diluncurkannya. Gunakan filter alat yang ketat dan permintaan izin tingkat OS.

  </Tab>
</Tabs>

### Bentuk keluaran JSON

Gunakan `--json` untuk skrip dan dasbor. Kumpulan bidang dapat bertambah seiring waktu, sehingga konsumen sebaiknya mengabaikan kunci yang tidak dikenal.

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
            "requiresAuthorization": false,
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
      "ok": true,
      "path": "/home/user/.openclaw/openclaw.json",
      "servers": [
        {
          "name": "docs",
          "ok": true,
          "issues": [
            {
              "level": "warning",
              "message": "Kredensial OAuth belum diotorisasi; jalankan openclaw mcp login docs"
            }
          ]
        }
      ]
    }
    ```

    `doctor --json` keluar dengan kode bukan nol ketika server aktif yang diperiksa memiliki masalah tingkat `error`. Masalah `warning` dan `info` dilaporkan, tetapi tidak dengan sendirinya menyebabkan perintah gagal.

  </Accordion>
  <Accordion title="probe --json">
    ```json
    {
      "generatedAt": "2026-05-31T09:00:00.000Z",
      "servers": {
        "docs": {
          "launch": "streamable-http https://mcp.example.com/mcp",
          "tools": 2,
          "resources": true,
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

    `probe --json` membuka sesi klien MCP langsung dan mencetak hasilnya secara langsung; tidak seperti `status`/`doctor`, keluarannya tidak memiliki bidang `path` tingkat teratas. Kunci `resources` dan `prompts` hanya ada ketika server benar-benar mengiklankan kemampuan tersebut (server tanpa perintah menghilangkan kunci `prompts`, bukan melaporkan `false`). Gunakan `probe` untuk membuktikan keterjangkauan dan kemampuan, bukan untuk audit konfigurasi statis.

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
        "requestTimeoutMs": 20000,
        "connectionTimeoutMs": 5000,
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

### Transportasi Stdio

Meluncurkan proses turunan lokal dan berkomunikasi melalui stdin/stdout.

| Bidang                     | Deskripsi                                  |
| -------------------------- | ------------------------------------------ |
| `command`         | Berkas yang dapat dieksekusi (wajib)       |
| `args`         | Larik argumen baris perintah               |
| `env`         | Variabel lingkungan tambahan               |
| `cwd` / `workingDirectory` | Direktori kerja untuk proses |

<Warning>
**Filter keamanan lingkungan Stdio**

OpenClaw menolak kunci lingkungan untuk pengaktifan interpreter, pembajakan pemuat, dan inisialisasi shell sebelum membuat server MCP stdio, meskipun kunci tersebut muncul dalam blok `env` server. Ini menggunakan kebijakan keamanan lingkungan host yang sama seperti proses lain yang dibuat oleh OpenClaw: kebijakan ini memblokir kait pengaktifan interpreter yang dikenal (misalnya `NODE_OPTIONS`, `PYTHONSTARTUP`, `PERL5OPT`, `RUBYOPT`, `BASHOPTS`, `KSH_ENV`), prefiks pustaka bersama dan injeksi fungsi (`DYLD_*`, `LD_*`, `BASH_FUNC_*`), serta variabel kontrol runtime serupa. Saat pengaktifan, variabel ini dihapus secara diam-diam dan peringatan dicatat agar variabel tersebut tidak dapat menyuntikkan pendahuluan implisit, mengganti interpreter, mengaktifkan debugger, atau membajak penaut dinamis terhadap proses stdio. Daftar yang diizinkan secara eksplisit mempertahankan variabel lingkungan kredensial MCP biasa agar tetap dapat digunakan (`GITHUB_TOKEN`, `GH_TOKEN`, `GITLAB_TOKEN`, `NPM_TOKEN`, `NODE_AUTH_TOKEN`, `DATABASE_URL`, `MONGODB_URI`, `REDIS_URL`, `AMQP_URL`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`), bersama dengan variabel lingkungan proksi dan khusus server biasa (`HTTP_PROXY`, `*_API_KEY` khusus, dan sebagainya). Kunci `AWS_*` lain seperti `AWS_CONFIG_FILE` dan `AWS_SHARED_CREDENTIALS_FILE` tetap diblokir karena menunjuk ke berkas kredensial, bukan membawa nilai kredensial secara langsung.

Jika server MCP benar-benar memerlukan salah satu variabel yang diblokir, tetapkan variabel tersebut pada proses host gateway, bukan di bawah `env` server stdio.
</Warning>

### Transportasi SSE / HTTP

Terhubung ke server MCP jarak jauh melalui HTTP Server-Sent Events.

| Bidang                      | Deskripsi                                                               |
| --------------------------- | ----------------------------------------------------------------------- |
| `url`          | URL HTTP atau HTTPS server jarak jauh (wajib)                            |
| `headers`          | Peta pasangan kunci-nilai opsional untuk header HTTP (misalnya token autentikasi) |
| `connectionTimeoutMs`          | Batas waktu koneksi per server dalam ms (opsional)                       |
| `requestTimeoutMs`          | Batas waktu permintaan MCP per server dalam milidetik                    |
| `auth: "oauth"`          | Gunakan kredensial OAuth MCP yang disimpan oleh `openclaw mcp login`      |
| `sslVerify`          | Tetapkan false hanya untuk titik akhir HTTPS privat yang dipercaya secara eksplisit |
| `clientCert` / `clientKey` | Jalur sertifikat dan kunci klien mTLS                         |
| `supportsParallelToolCalls`          | Petunjuk bahwa pemanggilan serentak aman untuk server ini                |

Contoh:

```json
{
  "mcp": {
    "servers": {
      "remote-tools": {
        "url": "https://mcp.example.com",
        "auth": "oauth",
        "requestTimeoutMs": 20000,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

Nilai sensitif dalam `url` (info pengguna) dan `headers` disamarkan dalam log dan keluaran status. `openclaw mcp doctor` memperingatkan ketika entri `headers` atau `env` yang tampak sensitif berisi nilai literal, sehingga operator dapat memindahkan nilai tersebut keluar dari konfigurasi yang di-commit.

### Alur kerja OAuth

OAuth ditujukan untuk server MCP HTTP yang mengiklankan alur OAuth MCP. Header `Authorization` statis diabaikan untuk server ketika `auth: "oauth"` diaktifkan. Kredensial yang disimpan oleh `openclaw mcp login` berfungsi dengan MCP tertanam, pelaksana CLI, dan server aplikasi Codex lokal.

Sesi OAuth MCP native berada dalam basis data SQLite bersama yang hanya dapat diakses pemilik di `<state-dir>/state/openclaw.sqlite` (`mcp_oauth_stores`). Baris tersebut dapat memuat token akses dan penyegaran, rahasia pendaftaran klien dinamis, metadata penemuan, dan pemverifikasi PKCE sementara. Penyegaran, login, dan logout menggunakan lease SQLite yang sama, sehingga proses OpenClaw paralel tidak dapat menggunakan satu token penyegaran atau menghidupkan kembali sesi yang telah logout.

Peningkatan dari penyimpanan `<state-dir>/mcp-oauth/*.json` yang telah dihentikan hanya ditangani oleh `openclaw doctor --fix`. Kode runtime tidak pernah membaca, menulis, atau beralih ke berkas tersebut sebagai cadangan.

Hingga kredensial tersedia, OpenClaw hanya menghilangkan server MCP tersebut dari runtime agen, bukan menggagalkan giliran agen. Operator, atau agen dengan akses shell, kemudian dapat menjalankan `openclaw mcp login <name>` dan menggunakan server pada giliran berikutnya.

Jika server menolak token dengan `insufficient_scope`, OpenClaw mempertahankan cakupan yang diminta dan meminta `openclaw mcp login <name>`, alih-alih mengulangi penyegaran yang tidak dapat memberikan cakupan baru. Login tersebut memulai permintaan otorisasi baru sambil mempertahankan token sebelumnya hingga kredensial pengganti disimpan.

Ketika layanan MCP jarak jauh sudah didukung oleh profil autentikasi OpenClaw terpisah yang mampu melakukan penyegaran, Anda dapat menetapkan `oauth.authProfileId` secara opsional. OpenClaw menyegarkan salah satu sumber kredensial sebelum proyeksi runtime dan hanya meneruskan token akses saat ini ke klien MCP hilir.

<Steps>
  <Step title="Simpan server">
    Tambahkan atau perbarui server dengan `auth: "oauth"` dan metadata OAuth opsional apa pun.

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"scope":"docs.read"}}'
    ```

    Untuk bearer yang didukung profil autentikasi, simpan pengikatan profil:

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"authProfileId":"docs:mcp"}}'
    ```

  </Step>
  <Step title="Mulai proses masuk">
    Jalankan proses masuk untuk membuat permintaan otorisasi.

    ```bash
    openclaw mcp login docs
    ```

    OpenClaw mencetak URL otorisasi dan menyimpan status verifier OAuth sementara di SQLite bersama.

  </Step>
  <Step title="Selesaikan dengan kode">
    Setelah menyetujui di browser, teruskan kode yang dikembalikan ke OpenClaw.

    ```bash
    openclaw mcp login docs --code abc123
    ```

  </Step>
  <Step title="Periksa otorisasi">
    Gunakan status atau doctor untuk mengonfirmasi bahwa token tersedia dan tidak memerlukan otorisasi tambahan. Jika status melaporkan `authorization-required` atau doctor meminta otorisasi tambahan, jalankan kembali `openclaw mcp login <name>`.

    ```bash
    openclaw mcp status --verbose
    openclaw mcp doctor docs --probe
    ```

  </Step>
  <Step title="Hapus kredensial">
    Logout menghapus kredensial OAuth yang tersimpan, tetapi mempertahankan definisi server yang disimpan.

    ```bash
    openclaw mcp logout docs
    ```

  </Step>
</Steps>

Jika penyedia merotasi token atau status otorisasi macet, jalankan `openclaw mcp logout <name>`, lalu ulangi `login`. `logout` dapat menghapus kredensial untuk server HTTP yang disimpan bahkan setelah `auth: "oauth"` dihapus dari konfigurasi, selama nama dan URL server masih mengidentifikasi entri penyimpanan kredensial.

### Transport HTTP yang dapat dialirkan

`streamable-http` adalah opsi transport tambahan di samping `sse` dan `stdio`. Opsi ini menggunakan streaming HTTP untuk komunikasi dua arah dengan server MCP jarak jauh.

| Bidang                      | Deskripsi                                                                              |
| --------------------------- | -------------------------------------------------------------------------------------- |
| `url`                       | URL HTTP atau HTTPS server jarak jauh (wajib)                                          |
| `transport`                 | Atur ke `"streamable-http"` untuk memilih transport ini; jika dihilangkan, OpenClaw menggunakan `sse` |
| `headers`                   | Peta pasangan kunci-nilai opsional untuk header HTTP (misalnya token autentikasi)      |
| `connectionTimeoutMs`       | Batas waktu koneksi per server dalam ms (opsional)                                     |
| `requestTimeoutMs`          | Batas waktu permintaan MCP per server dalam milidetik                                  |
| `auth: "oauth"`             | Gunakan kredensial OAuth MCP yang disimpan oleh `openclaw mcp login`                   |
| `sslVerify`                 | Atur ke false hanya untuk endpoint HTTPS privat yang secara eksplisit dipercaya        |
| `clientCert` / `clientKey`  | Jalur sertifikat dan kunci klien mTLS                                                  |
| `supportsParallelToolCalls` | Petunjuk bahwa panggilan bersamaan aman untuk server ini                                |

Konfigurasi OpenClaw menggunakan `transport: "streamable-http"` sebagai ejaan kanonis. Nilai MCP bawaan CLI `type: "http"` diterima saat disimpan melalui `openclaw mcp set` dan diperbaiki oleh `openclaw doctor --fix` dalam konfigurasi yang ada, tetapi `transport` adalah yang digunakan langsung oleh OpenClaw tersemat.

Contoh:

```json
{
  "mcp": {
    "servers": {
      "streaming-tools": {
        "url": "https://mcp.example.com/stream",
        "transport": "streamable-http",
        "connectionTimeoutMs": 10000,
        "requestTimeoutMs": 30000,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

<Note>
Perintah registri tidak memulai jembatan kanal. Hanya `probe` dan `doctor --probe` yang membuka sesi klien MCP aktif untuk membuktikan bahwa server tujuan dapat dijangkau.
</Note>

## UI Kontrol

UI Kontrol browser menyertakan halaman pengaturan MCP khusus di `/settings/mcp`; jalur `/mcp` sebelumnya tetap menjadi alias. Halaman tersebut menampilkan jumlah server yang dikonfigurasi, ringkasan server yang diaktifkan/OAuth/filter, baris transport per server, kontrol aktifkan/nonaktifkan, perintah CLI umum, dan editor tercakup untuk bagian konfigurasi `mcp`.

Gunakan halaman tersebut untuk pengeditan oleh operator dan inventaris cepat. Gunakan `openclaw mcp doctor --probe` atau `openclaw mcp probe` ketika Anda memerlukan bukti server aktif.

Alur kerja operator:

1. Buka UI Kontrol dan pilih **MCP**.
2. Tinjau kartu ringkasan untuk total server, server yang diaktifkan, server OAuth, dan server yang difilter.
3. Gunakan setiap baris server untuk melihat petunjuk transport, autentikasi, filter, batas waktu, dan perintah.
4. Alihkan pengaktifan ketika Anda ingin mempertahankan definisi, tetapi mengecualikannya dari penemuan runtime.
5. Edit bagian konfigurasi tercakup `mcp` untuk perubahan struktural seperti server baru, header, TLS, metadata OAuth, atau filter alat.
6. Pilih **Save** untuk hanya menyimpan konfigurasi, atau **Save & Publish** untuk menerapkannya melalui jalur konfigurasi Gateway.
7. Jalankan `openclaw mcp doctor --probe` ketika Anda memerlukan bukti langsung bahwa server yang diedit dapat dimulai dan mencantumkan alat.

Catatan:

- cuplikan perintah mengapit nama server dengan tanda kutip agar nama yang tidak biasa tetap dapat disalin ke shell
- nilai seperti URL yang ditampilkan disamarkan sebelum dirender jika berisi kredensial tersemat
- halaman tersebut tidak memulai transport MCP dengan sendirinya
- runtime aktif mungkin memerlukan `openclaw mcp reload`, penerbitan konfigurasi Gateway, atau mulai ulang proses, bergantung pada proses yang memiliki klien MCP

## Aplikasi MCP

OpenClaw dapat merender alat yang mengimplementasikan [ekstensi Aplikasi MCP](https://modelcontextprotocol.io/extensions/apps) stabil. Aplikasi bersifat opsional karena HTML-nya berasal dari server MCP yang dikonfigurasi dan dapat meminta alat atau sumber daya yang terlihat oleh aplikasi dari server yang sama.

Aktifkan jembatan host:

```bash
openclaw config set mcp.apps.enabled true --strict-json
```

Mulai ulang Gateway setelah mengubah pengaturan ini. Saat diaktifkan, OpenClaw memulai listener HTTP(S) khusus sandbox pada port Gateway ditambah satu (untuk Gateway default, `18790`). UI Kontrol memuat Aplikasi dari origin terpisah tersebut; listener tidak pernah menyajikan UI Kontrol, rute Gateway terautentikasi, atau data pengguna.

Koneksi Gateway langsung memerlukan akses ke kedua port. Jika proksi balik atau terminator TLS mengekspos UI Kontrol, berikan origin publik khusus untuk Aplikasi dan proksikan hanya origin tersebut ke listener sandbox:

```json5
{
  mcp: {
    apps: {
      enabled: true,
      sandboxOrigin: "https://mcp-apps.example.com",
      sandboxPort: 18790,
    },
  },
}
```

Origin sandbox harus berbeda dari origin UI Kontrol. Jangan meng-host konten terautentikasi atau sensitif lainnya di sana.

Sebagai contoh, demo React dasar resmi dapat dikonfigurasi sebagai berikut:

```json5
{
  mcp: {
    apps: { enabled: true },
    servers: {
      "basic-react": {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-basic-react", "--stdio"],
      },
    },
  },
}
```

Perilaku dan batas keamanan:

- OpenClaw mengumumkan ekstensi `io.modelcontextprotocol/ui` hanya saat Aplikasi diaktifkan.
- Hanya sumber daya `ui://` dengan jenis MIME `text/html;profile=mcp-app` yang persis sama yang dirender.
- Sumber daya UI dibatasi hingga 2 MiB, ditempatkan di belakang proksi iframe ganda pada origin luar khusus, dimuat ke dalam origin Aplikasi dalam yang opak, dan dibatasi oleh CSP yang diturunkan dari metadata sumber daya.
- Alat khusus Aplikasi (`_meta.ui.visibility: ["app"]`) tidak disertakan dalam daftar alat model. Aplikasi hanya dapat memanggil alat yang terlihat oleh aplikasi pada server pemiliknya dan juga lolos kebijakan alat OpenClaw efektif untuk proses yang membuat tampilan tersebut.
- Izin Aplikasi yang terikat pada origin, seperti kamera, mikrofon, dan geolokasi, tidak diberikan selama dokumen Aplikasi dalam menggunakan origin opak untuk isolasi lintas Aplikasi.
- HTML Aplikasi, argumen alat lengkap, dan hasil mentah berada dalam sewa tampilan dalam memori terbatas selama sepuluh menit serta tidak ditulis ke disk atau disalin ke metadata pratinjau transkrip. Transkrip hanya menyimpan deskriptor server/alat/sumber daya terbatas yang terkait dengan ID panggilan alat asli. Setelah Gateway dimulai ulang, UI Kontrol dapat memverifikasi deskriptor tersebut terhadap transkrip sesi terautentikasi dan mengambil ulang sumber daya `ui://`; tampilan yang direkonstruksi bersifat hanya-baca hingga proses baru menetapkan izin alat terkini.
- Dalam percakapan kanal, tampilan Aplikasi terbaru yang berhasil dalam satu giliran menambahkan satu tindakan bergaya **Buka Aplikasi** ke balasan akhir asisten. DM Telegram menggunakan tombol Mini App bawaan; Slack dan Discord merender tindakan portabel yang sama sebagai tautan. Kanal lain mempertahankan teks balasan asli dan menambahkan tautan HTTPS yang mudah dipahami.
- Tautan peluncuran kanal hanya tersedia ketika eksposur Tailscale Gateway telah menyiapkan origin HTTPS yang dipublikasikan. `gateway.tailscale.mode: "serve"` hanya dapat dijangkau dari tailnet; `"funnel"` dapat dijangkau dari internet publik. Funnel yang dikelola secara eksternal dan dipertahankan oleh `gateway.tailscale.preserveFunnel` juga dianggap dapat dijangkau dari internet. Lihat [Tailscale](/id/gateway/tailscale).
- Tiket peluncuran bersifat opak, dibuat hanya saat mematerialisasikan balasan kanal akhir, dan kedaluwarsa setelah paling lama dua menit atau ketika sewa tampilan yang mendasarinya kedaluwarsa, mana saja yang terjadi lebih dahulu. URL tidak berisi kredensial bearer Gateway, kunci sesi, metadata tampilan, HTML Aplikasi, masukan alat, atau hasil alat.
- Jika tidak ada origin yang dipublikasikan atau kapasitas tiket yang tersedia, tampilan atau tiket telah kedaluwarsa, atau transport tidak dapat merender kontrol bawaan, teks asisten asli tetap tersedia. UI Kontrol mempertahankan kanvas Aplikasi sebaris yang ada dan tidak menerima tindakan peluncuran duplikat.
- `openclaw security audit` memberikan peringatan selama jembatan diaktifkan. Nonaktifkan dengan `openclaw config set mcp.apps.enabled false --strict-json` ketika tidak diperlukan.

## Batas saat ini

Halaman ini mendokumentasikan jembatan sebagaimana dirilis saat ini.

Batas saat ini:

- penemuan percakapan bergantung pada metadata rute sesi Gateway yang ada
- tidak ada protokol push generik selain adaptor khusus Claude
- belum ada alat untuk mengedit pesan atau memberikan reaksi
- transport HTTP/SSE/streamable-http terhubung ke satu server jarak jauh; belum ada upstream termultipleks
- `permissions_list_open` hanya menyertakan persetujuan yang diamati saat jembatan terhubung

## Terkait

- [Referensi CLI](/id/cli)
- [Plugin](/id/cli/plugins)
