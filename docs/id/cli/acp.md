---
read_when:
    - Menyiapkan integrasi IDE berbasis ACP
    - Melakukan debug perutean sesi ACP ke Gateway
summary: Jalankan jembatan ACP untuk integrasi IDE
title: ACP
x-i18n:
    generated_at: "2026-05-10T19:27:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0614b40723ef8374c5bc26d92516ac5725ae2d8ef5e8f4db360b2259879fe320
    source_path: cli/acp.md
    workflow: 16
---

Jalankan bridge [Protokol Klien Agen (ACP)](https://agentclientprotocol.com/) yang berbicara dengan OpenClaw Gateway.

Perintah ini berbicara ACP melalui stdio untuk IDE dan meneruskan prompt ke Gateway
melalui WebSocket. Ini menjaga sesi ACP tetap dipetakan ke kunci sesi Gateway.

`openclaw acp` adalah bridge ACP yang didukung Gateway, bukan runtime editor
ACP-native penuh. Ini berfokus pada perutean sesi, pengiriman prompt, dan
pembaruan streaming dasar.

Jika Anda ingin klien MCP eksternal berbicara langsung dengan percakapan channel
OpenClaw alih-alih menghosting sesi harness ACP, gunakan
[`openclaw mcp serve`](/id/cli/mcp) sebagai gantinya.

## Yang bukan ini

Halaman ini sering tertukar dengan sesi harness ACP.

`openclaw acp` berarti:

- OpenClaw bertindak sebagai server ACP
- IDE atau klien ACP terhubung ke OpenClaw
- OpenClaw meneruskan pekerjaan itu ke sesi Gateway

Ini berbeda dari [Agen ACP](/id/tools/acp-agents), ketika OpenClaw menjalankan
harness eksternal seperti Codex atau Claude Code melalui `acpx`.

Aturan cepat:

- editor/klien ingin berbicara ACP ke OpenClaw: gunakan `openclaw acp`
- OpenClaw harus meluncurkan Codex/Claude/Gemini sebagai harness ACP: gunakan `/acp spawn` dan [Agen ACP](/id/tools/acp-agents)

## Matriks Kompatibilitas

| Area ACP                                                              | Status      | Catatan                                                                                                                                                                                                                                            |
| --------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`, `newSession`, `prompt`, `cancel`                        | Diimplementasikan | Alur bridge inti melalui stdio ke chat/send + abort Gateway.                                                                                                                                                                                        |
| `listSessions`, perintah slash                                        | Diimplementasikan | Daftar sesi bekerja terhadap status sesi Gateway dengan paginasi kursor terbatas dan pemfilteran `cwd` saat baris sesi Gateway membawa metadata ruang kerja; perintah diumumkan melalui `available_commands_update`.                                |
| `resumeSession`, `closeSession`                                       | Diimplementasikan | Resume mengikat ulang sesi ACP ke sesi Gateway yang ada tanpa memutar ulang riwayat. Close membatalkan pekerjaan bridge aktif, menyelesaikan prompt tertunda sebagai dibatalkan, dan melepas status sesi bridge.                                              |
| `loadSession`                                                         | Sebagian     | Mengikat ulang sesi ACP ke kunci sesi Gateway dan memutar ulang riwayat event-ledger ACP untuk sesi yang dibuat bridge. Sesi lama/tanpa ledger kembali ke teks pengguna/asisten yang tersimpan.                                                             |
| Konten prompt (`text`, `resource` tertanam, gambar)                  | Sebagian     | Teks/resource diratakan ke input chat; gambar menjadi lampiran Gateway.                                                                                                                                                                 |
| Mode sesi                                                         | Sebagian     | `session/set_mode` didukung dan bridge mengekspos kontrol sesi awal yang didukung Gateway untuk tingkat pemikiran, verbositas alat, penalaran, detail penggunaan, dan tindakan dengan elevasi. Permukaan mode/konfigurasi ACP-native yang lebih luas masih di luar cakupan. |
| Info sesi dan pembaruan penggunaan                                        | Sebagian     | Bridge memancarkan notifikasi `session_info_update` dan `usage_update` upaya terbaik dari snapshot sesi Gateway yang di-cache. Penggunaan bersifat perkiraan dan hanya dikirim ketika total token Gateway ditandai segar.                                        |
| Streaming alat                                                        | Sebagian     | Event `tool_call` / `tool_call_update` menyertakan I/O mentah, konten teks, dan lokasi file upaya terbaik saat argumen/hasil alat Gateway mengeksposnya. Terminal tertanam dan output diff-native yang lebih kaya masih belum diekspos.                        |
| Persetujuan exec                                                        | Sebagian     | Prompt persetujuan exec Gateway selama giliran prompt ACP aktif diteruskan ke klien ACP dengan `session/request_permission`.                                                                                                                    |
| Server MCP per sesi (`mcpServers`)                                | Tidak didukung | Mode bridge menolak permintaan server MCP per sesi. Konfigurasikan MCP di gateway atau agen OpenClaw sebagai gantinya.                                                                                                                                     |
| Metode filesystem klien (`fs/read_text_file`, `fs/write_text_file`) | Tidak didukung | Bridge tidak memanggil metode filesystem klien ACP.                                                                                                                                                                                          |
| Metode terminal klien (`terminal/*`)                                | Tidak didukung | Bridge tidak membuat terminal klien ACP atau melakukan streaming id terminal melalui panggilan alat.                                                                                                                                                       |
| Rencana sesi / streaming pemikiran                                     | Tidak didukung | Bridge saat ini memancarkan teks output dan status alat, bukan pembaruan rencana atau pemikiran ACP.                                                                                                                                                         |

## Batasan yang Diketahui

- `loadSession` dapat memutar ulang riwayat event-ledger ACP lengkap hanya untuk
  sesi yang dibuat bridge. Sesi lama/tanpa ledger masih menggunakan fallback
  transkrip dan tidak merekonstruksi panggilan alat historis atau pemberitahuan
  sistem.
- Jika beberapa klien ACP berbagi kunci sesi Gateway yang sama, perutean event
  dan pembatalan bersifat upaya terbaik, bukan terisolasi ketat per klien. Pilih
  sesi `acp:<uuid>` terisolasi default saat Anda membutuhkan giliran
  lokal-editor yang bersih.
- Status berhenti Gateway diterjemahkan menjadi alasan berhenti ACP, tetapi
  pemetaan itu kurang ekspresif dibandingkan runtime ACP-native penuh.
- Kontrol sesi awal saat ini menampilkan subset kenop Gateway yang terfokus:
  tingkat pemikiran, verbositas alat, penalaran, detail penggunaan, dan tindakan
  dengan elevasi. Pemilihan model dan kontrol host exec belum diekspos sebagai
  opsi konfigurasi ACP.
- `session_info_update` dan `usage_update` berasal dari snapshot sesi Gateway,
  bukan akuntansi runtime ACP-native langsung. Penggunaan bersifat perkiraan,
  tidak membawa data biaya, dan hanya dipancarkan saat Gateway menandai data
  total token sebagai segar.
- Data pendamping alat bersifat upaya terbaik. Bridge dapat menampilkan path
  file yang muncul dalam argumen/hasil alat yang dikenal, tetapi belum
  memancarkan terminal ACP atau diff file terstruktur.
- Relay persetujuan exec dicakup ke giliran prompt ACP aktif; persetujuan dari
  sesi Gateway lain diabaikan.

## Penggunaan

```bash
openclaw acp

# Remote Gateway
openclaw acp --url wss://gateway-host:18789 --token <token>

# Remote Gateway (token from file)
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Attach to an existing session key
openclaw acp --session agent:main:main

# Attach by label (must already exist)
openclaw acp --session-label "support inbox"

# Reset the session key before the first prompt
openclaw acp --session agent:main:main --reset-session
```

## Klien ACP (debug)

Gunakan klien ACP bawaan untuk memeriksa kewarasan bridge tanpa IDE.
Ini menelurkan bridge ACP dan memungkinkan Anda mengetik prompt secara interaktif.

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Model izin (mode debug klien):

- Persetujuan otomatis berbasis allowlist dan hanya berlaku untuk ID alat inti tepercaya.
- Persetujuan otomatis `read` dicakup ke direktori kerja saat ini (`--cwd` saat diatur).
- ACP hanya menyetujui otomatis kelas readonly yang sempit: panggilan `read` tercakup di bawah cwd aktif plus alat pencarian readonly (`search`, `web_search`, `memory_search`). Alat yang tidak dikenal/non-inti, pembacaan di luar cakupan, alat yang mampu exec, alat control-plane, alat yang memutasi, dan alur interaktif selalu memerlukan persetujuan prompt eksplisit.
- `toolCall.kind` yang disediakan server diperlakukan sebagai metadata tidak tepercaya (bukan sumber otorisasi).
- Kebijakan bridge ACP ini terpisah dari izin harness ACPX. Jika Anda menjalankan OpenClaw melalui backend `acpx`, `plugins.entries.acpx.config.permissionMode=approve-all` adalah sakelar "yolo" pemecah-kaca untuk sesi harness tersebut.

## Smoke testing protokol

Untuk debugging tingkat protokol, mulai Gateway dengan status terisolasi dan jalankan
`openclaw acp` melalui stdio dengan klien JSON-RPC ACP. Cakup `initialize`,
`session/new`, `session/list` dengan `cwd` absolut, `session/resume`,
`session/close`, close duplikat, dan resume yang hilang.

Bukti harus mencakup kapabilitas siklus hidup yang diiklankan, baris sesi yang
didukung Gateway, notifikasi pembaruan, dan log `sessions.list` Gateway:

```json
{
  "initialize": {
    "protocolVersion": 1,
    "agentCapabilities": {
      "sessionCapabilities": {
        "list": {},
        "resume": {},
        "close": {}
      }
    }
  },
  "listSessions": {
    "sessions": [
      {
        "sessionId": "agent:main:acp-smoke",
        "cwd": "/path/to/workspace",
        "_meta": {
          "sessionKey": "agent:main:acp-smoke",
          "kind": "direct"
        }
      }
    ],
    "nextCursor": null
  },
  "notifications": ["session_info_update", "available_commands_update", "usage_update"],
  "gatewayLogTail": ["[gateway] ready", "[ws] ⇄ res ✓ sessions.list 305ms"]
}
```

Hindari menggunakan `openclaw gateway call sessions.list` sebagai satu-satunya bukti ACP. Path
CLI itu dapat meminta peningkatan cakupan operator fresh-token; kebenaran bridge ACP
dibuktikan oleh frame stdio ACP plus log `sessions.list` Gateway.

## Cara menggunakan ini

Gunakan ACP saat IDE (atau klien lain) berbicara Agent Client Protocol dan Anda ingin
itu mengendalikan sesi OpenClaw Gateway.

1. Pastikan Gateway berjalan (lokal atau remote).
2. Konfigurasikan target Gateway (konfigurasi atau flag).
3. Arahkan IDE Anda untuk menjalankan `openclaw acp` melalui stdio.

Contoh konfigurasi (dipersistenkan):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

Contoh menjalankan langsung (tanpa menulis konfigurasi):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# preferred for local process safety
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## Memilih agen

ACP tidak memilih agen secara langsung. ACP merutekan berdasarkan kunci sesi Gateway.

Gunakan kunci sesi bercakupan agen untuk menargetkan agen tertentu:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Setiap sesi ACP dipetakan ke satu kunci sesi Gateway. Satu agen dapat memiliki banyak
sesi; ACP default ke sesi `acp:<uuid>` terisolasi kecuali Anda mengganti
kunci atau label.

`mcpServers` per sesi tidak didukung dalam mode bridge. Jika klien ACP
mengirimkannya selama `newSession` atau `loadSession`, bridge mengembalikan
galat yang jelas alih-alih mengabaikannya secara diam-diam.

Jika Anda ingin sesi yang didukung ACPX melihat alat Plugin OpenClaw atau alat
bawaan tertentu seperti `cron`, aktifkan bridge MCP ACPX di sisi Gateway
alih-alih mencoba meneruskan `mcpServers` per sesi. Lihat
[Agen ACP](/id/tools/acp-agents-setup#plugin-tools-mcp-bridge) dan
[Bridge MCP alat OpenClaw](/id/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## Penggunaan dari `acpx` (Codex, Claude, klien ACP lain)

Jika Anda ingin agen coding seperti Codex atau Claude Code berbicara dengan bot
OpenClaw Anda melalui ACP, gunakan `acpx` dengan target bawaan `openclaw`.

Alur umum:

1. Jalankan Gateway dan pastikan bridge ACP dapat mencapainya.
2. Arahkan `acpx openclaw` ke `openclaw acp`.
3. Targetkan kunci sesi OpenClaw yang ingin digunakan agen coding.

Contoh:

```bash
# One-shot request into your default OpenClaw ACP session
acpx openclaw exec "Summarize the active OpenClaw session state."

# Persistent named session for follow-up turns
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

Jika Anda ingin `acpx openclaw` menargetkan Gateway dan kunci sesi tertentu
setiap saat, timpa perintah agen `openclaw` di `~/.acpx/config.json`:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

Untuk checkout OpenClaw lokal repo, gunakan entrypoint CLI langsung alih-alih
runner dev agar stream ACP tetap bersih. Contohnya:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

Ini adalah cara termudah agar Codex, Claude Code, atau klien lain yang memahami
ACP dapat mengambil informasi kontekstual dari agen OpenClaw tanpa melakukan
scraping terminal.

## Penyiapan editor Zed

Tambahkan agen ACP kustom di `~/.config/zed/settings.json` (atau gunakan UI Pengaturan Zed):

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": ["acp"],
      "env": {}
    }
  }
}
```

Untuk menargetkan Gateway atau agen tertentu:

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": [
        "acp",
        "--url",
        "wss://gateway-host:18789",
        "--token",
        "<token>",
        "--session",
        "agent:design:main"
      ],
      "env": {}
    }
  }
}
```

Di Zed, buka panel Agen dan pilih "OpenClaw ACP" untuk memulai thread.

## Pemetaan sesi

Secara default, sesi ACP mendapatkan kunci sesi Gateway terisolasi dengan prefiks `acp:`.
Untuk menggunakan ulang sesi yang diketahui, berikan kunci atau label sesi:

- `--session <key>`: gunakan kunci sesi Gateway tertentu.
- `--session-label <label>`: resolve sesi yang sudah ada berdasarkan label.
- `--reset-session`: buat id sesi baru untuk kunci tersebut (kunci yang sama, transkrip baru).

Jika klien ACP Anda mendukung metadata, Anda dapat menimpanya per sesi:

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

Pelajari lebih lanjut tentang kunci sesi di [/concepts/session](/id/concepts/session).

## Opsi

- `--url <url>`: URL WebSocket Gateway (default ke gateway.remote.url saat dikonfigurasi).
- `--token <token>`: token autentikasi Gateway.
- `--token-file <path>`: baca token autentikasi Gateway dari file.
- `--password <password>`: kata sandi autentikasi Gateway.
- `--password-file <path>`: baca kata sandi autentikasi Gateway dari file.
- `--session <key>`: kunci sesi default.
- `--session-label <label>`: label sesi default yang akan di-resolve.
- `--require-existing`: gagal jika kunci/label sesi tidak ada.
- `--reset-session`: reset kunci sesi sebelum penggunaan pertama.
- `--no-prefix-cwd`: jangan tambahkan prefiks direktori kerja ke prompt.
- `--provenance <off|meta|meta+receipt>`: sertakan metadata atau tanda terima provenance ACP.
- `--verbose, -v`: logging verbose ke stderr.

Catatan keamanan:

- `--token` dan `--password` dapat terlihat dalam daftar proses lokal pada beberapa sistem.
- Utamakan `--token-file`/`--password-file` atau variabel lingkungan (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- Resolusi autentikasi Gateway mengikuti kontrak bersama yang digunakan oleh klien Gateway lain:
  - mode lokal: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> fallback `gateway.remote.*` hanya saat `gateway.auth.*` tidak disetel (SecretRefs lokal yang dikonfigurasi tetapi tidak ter-resolve gagal tertutup)
  - mode remote: `gateway.remote.*` dengan fallback env/config sesuai aturan prioritas remote
  - `--url` aman sebagai override dan tidak menggunakan ulang kredensial config/env implisit; berikan `--token`/`--password` eksplisit (atau varian file)
- Proses anak backend runtime ACP menerima `OPENCLAW_SHELL=acp`, yang dapat digunakan untuk aturan shell/profile khusus konteks.
- `openclaw acp client` menyetel `OPENCLAW_SHELL=acp-client` pada proses bridge yang di-spawn.

### Opsi `acp client`

- `--cwd <dir>`: direktori kerja untuk sesi ACP.
- `--server <command>`: perintah server ACP (default: `openclaw`).
- `--server-args <args...>`: argumen tambahan yang diteruskan ke server ACP.
- `--server-verbose`: aktifkan logging verbose pada server ACP.
- `--verbose, -v`: logging klien verbose.

## Terkait

- [Referensi CLI](/id/cli)
- [Agen ACP](/id/tools/acp-agents)
