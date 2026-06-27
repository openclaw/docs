---
read_when:
    - Menyiapkan integrasi IDE berbasis ACP
    - Men-debug routing sesi ACP ke Gateway
summary: Jalankan bridge ACP untuk integrasi IDE
title: ACP
x-i18n:
    generated_at: "2026-06-27T17:17:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 79fa816811f78c3fa59577342e568868ef63e88f5262fd954e346ed46b02afc3
    source_path: cli/acp.md
    workflow: 16
---

Jalankan jembatan [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) yang berbicara dengan OpenClaw Gateway.

Perintah ini berbicara ACP melalui stdio untuk IDE dan meneruskan prompt ke Gateway
melalui WebSocket. Perintah ini menjaga sesi ACP tetap dipetakan ke kunci sesi Gateway.

`openclaw acp` adalah jembatan ACP yang didukung Gateway, bukan runtime editor
ACP-native penuh. Perintah ini berfokus pada perutean sesi, pengiriman prompt, dan pembaruan
streaming dasar.

Jika Anda ingin klien MCP eksternal berbicara langsung dengan percakapan channel
OpenClaw alih-alih menghosting sesi harness ACP, gunakan
[`openclaw mcp serve`](/id/cli/mcp) sebagai gantinya.

## Ini bukan apa

Halaman ini sering tertukar dengan sesi harness ACP.

`openclaw acp` berarti:

- OpenClaw bertindak sebagai server ACP
- IDE atau klien ACP terhubung ke OpenClaw
- OpenClaw meneruskan pekerjaan itu ke dalam sesi Gateway

Ini berbeda dari [ACP Agents](/id/tools/acp-agents), tempat OpenClaw menjalankan
harness eksternal seperti Codex atau Claude Code melalui `acpx`.

Aturan cepat:

- editor/klien ingin berbicara ACP ke OpenClaw: gunakan `openclaw acp`
- OpenClaw harus meluncurkan Codex/Claude/Gemini sebagai harness ACP: gunakan `/acp spawn` dan [ACP Agents](/id/tools/acp-agents)

## Matriks Kompatibilitas

| Area ACP                                                              | Status      | Catatan                                                                                                                                                                                                                                          |
| --------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`, `newSession`, `prompt`, `cancel`                        | Diimplementasikan | Alur jembatan inti melalui stdio ke chat/send + abort Gateway.                                                                                                                                                                                   |
| `listSessions`, perintah slash                                        | Diimplementasikan | Daftar sesi bekerja terhadap status sesi Gateway dengan paginasi kursor terbatas dan pemfilteran `cwd` saat baris sesi Gateway membawa metadata workspace; perintah diiklankan melalui `available_commands_update`.                            |
| Metadata garis keturunan sesi                                         | Diimplementasikan | Listing sesi dan snapshot info sesi menyertakan garis keturunan induk dan anak OpenClaw di `_meta` sehingga klien ACP dapat merender grafik subagen tanpa side channel Gateway privat.                                                          |
| `resumeSession`, `closeSession`                                       | Diimplementasikan | Resume mengikat ulang sesi ACP ke sesi Gateway yang sudah ada tanpa memutar ulang riwayat. Close membatalkan pekerjaan jembatan aktif, menyelesaikan prompt tertunda sebagai dibatalkan, dan merilis status sesi jembatan.                     |
| `loadSession`                                                         | Parsial     | Mengikat ulang sesi ACP ke kunci sesi Gateway dan memutar ulang riwayat ledger peristiwa ACP untuk sesi yang dibuat jembatan. Sesi lama/tanpa ledger kembali ke teks pengguna/asisten yang tersimpan.                                           |
| Konten prompt (`text`, `resource` tertanam, gambar)                   | Parsial     | Teks/resource diratakan menjadi input chat; gambar menjadi lampiran Gateway.                                                                                                                                                                      |
| Mode sesi                                                            | Parsial     | `session/set_mode` didukung dan jembatan mengekspos kontrol sesi awal yang didukung Gateway untuk tingkat pemikiran, verbositas tool, reasoning, detail penggunaan, dan tindakan elevated. Permukaan mode/konfigurasi ACP-native yang lebih luas masih di luar cakupan. |
| Info sesi dan pembaruan penggunaan                                    | Parsial     | Jembatan memancarkan notifikasi `session_info_update` dan `usage_update` upaya terbaik dari snapshot sesi Gateway yang di-cache. Penggunaan bersifat perkiraan dan hanya dikirim saat total token Gateway ditandai segar.                       |
| Streaming tool                                                       | Parsial     | Peristiwa `tool_call` / `tool_call_update` menyertakan I/O mentah, konten teks, dan lokasi file upaya terbaik saat argumen/hasil tool Gateway mengeksposnya. Terminal tertanam dan output diff-native yang lebih kaya masih belum diekspos.      |
| Persetujuan exec                                                     | Parsial     | Prompt persetujuan exec Gateway selama putaran prompt ACP aktif diteruskan ke klien ACP dengan `session/request_permission`.                                                                                                                     |
| Server MCP per sesi (`mcpServers`)                                    | Tidak didukung | Mode jembatan menolak permintaan server MCP per sesi. Konfigurasikan MCP pada Gateway atau agen OpenClaw sebagai gantinya.                                                                                                                       |
| Metode filesystem klien (`fs/read_text_file`, `fs/write_text_file`)   | Tidak didukung | Jembatan tidak memanggil metode filesystem klien ACP.                                                                                                                                                                                            |
| Metode terminal klien (`terminal/*`)                                  | Tidak didukung | Jembatan tidak membuat terminal klien ACP atau mengalirkan id terminal melalui panggilan tool.                                                                                                                                                   |
| Rencana sesi / streaming pemikiran                                    | Tidak didukung | Jembatan saat ini memancarkan teks output dan status tool, bukan pembaruan rencana atau pemikiran ACP.                                                                                                                                           |

## Batasan yang Diketahui

- `loadSession` dapat memutar ulang riwayat ledger peristiwa ACP lengkap hanya untuk
  sesi yang dibuat jembatan. Sesi lama/tanpa ledger masih menggunakan fallback
  transkrip dan tidak merekonstruksi panggilan tool historis atau pemberitahuan sistem.
- Jika beberapa klien ACP berbagi kunci sesi Gateway yang sama, perutean peristiwa dan pembatalan
  bersifat upaya terbaik, bukan terisolasi ketat per klien. Pilih sesi
  default terisolasi `acp-bridge:<uuid>` saat Anda membutuhkan putaran editor-lokal
  yang bersih.
- Status berhenti Gateway diterjemahkan menjadi alasan berhenti ACP, tetapi pemetaan itu
  kurang ekspresif dibanding runtime ACP-native penuh.
- Kontrol sesi awal saat ini menampilkan subset knob Gateway yang terfokus:
  tingkat pemikiran, verbositas tool, reasoning, detail penggunaan, dan tindakan
  elevated. Pemilihan model dan kontrol exec-host belum diekspos sebagai opsi
  konfigurasi ACP.
- `session_info_update` dan `usage_update` diturunkan dari snapshot sesi Gateway,
  bukan akuntansi runtime ACP-native langsung. Penggunaan bersifat perkiraan,
  tidak membawa data biaya, dan hanya dipancarkan saat Gateway menandai data
  total token sebagai segar.
- Data mengikuti tool bersifat upaya terbaik. Jembatan dapat menampilkan path file yang
  muncul dalam argumen/hasil tool yang dikenal, tetapi belum memancarkan terminal ACP atau
  diff file terstruktur.
- Relay persetujuan exec dibatasi pada putaran prompt ACP aktif; persetujuan dari
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

Gunakan klien ACP bawaan untuk memeriksa kewarasan jembatan tanpa IDE.
Klien ini menjalankan jembatan ACP dan memungkinkan Anda mengetik prompt secara interaktif.

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Model izin (mode debug klien):

- Persetujuan otomatis berbasis allowlist dan hanya berlaku untuk ID tool inti tepercaya.
- Persetujuan otomatis `read` dibatasi ke direktori kerja saat ini (`--cwd` saat disetel).
- ACP hanya menyetujui otomatis kelas readonly yang sempit: panggilan `read` tercakup di bawah cwd aktif ditambah tool pencarian readonly (`search`, `web_search`, `memory_search`). Tool yang tidak dikenal/non-inti, pembacaan di luar cakupan, tool berkemampuan exec, tool control-plane, tool yang memutasi, dan alur interaktif selalu memerlukan persetujuan prompt eksplisit.
- `toolCall.kind` yang disediakan server diperlakukan sebagai metadata tidak tepercaya (bukan sumber otorisasi).
- Kebijakan jembatan ACP ini terpisah dari izin harness ACPX. Jika Anda menjalankan OpenClaw melalui backend `acpx`, `plugins.entries.acpx.config.permissionMode=approve-all` adalah sakelar "yolo" darurat untuk sesi harness tersebut.

## Pengujian smoke protokol

Untuk debugging tingkat protokol, mulai Gateway dengan status terisolasi dan kendalikan
`openclaw acp` melalui stdio dengan klien JSON-RPC ACP. Cakup `initialize`,
`session/new`, `session/list` dengan `cwd` absolut, `session/resume`,
`session/close`, close duplikat, dan resume yang hilang.

Bukti harus menyertakan kemampuan siklus hidup yang diiklankan, baris sesi yang didukung
Gateway, notifikasi pembaruan, dan log `sessions.list` Gateway:

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
CLI itu dapat meminta peningkatan cakupan operator fresh-token; kebenaran jembatan ACP
dibuktikan oleh frame stdio ACP ditambah log `sessions.list` Gateway.

## Cara menggunakan ini

Gunakan ACP saat IDE (atau klien lain) berbicara Agent Client Protocol dan Anda ingin
klien tersebut mengendalikan sesi OpenClaw Gateway.

1. Pastikan Gateway berjalan (lokal atau jarak jauh).
2. Konfigurasikan target Gateway (konfigurasi atau flag).
3. Arahkan IDE Anda untuk menjalankan `openclaw acp` melalui stdio.

Contoh konfigurasi (dipersistenkan):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

Contoh jalankan langsung (tanpa penulisan konfigurasi):

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
sesi; ACP secara default menggunakan sesi `acp-bridge:<uuid>` yang terisolasi kecuali Anda menimpa
kunci atau labelnya.

`mcpServers` per sesi tidak didukung dalam mode bridge. Jika klien ACP
mengirimkannya selama `newSession` atau `loadSession`, bridge mengembalikan
kesalahan yang jelas alih-alih mengabaikannya secara diam-diam.

Jika Anda ingin sesi yang didukung ACPX melihat alat Plugin OpenClaw atau alat
bawaan tertentu seperti `cron`, aktifkan bridge ACPX MCP di sisi Gateway alih-alih
mencoba meneruskan `mcpServers` per sesi. Lihat
[ACP Agents](/id/tools/acp-agents-setup#plugin-tools-mcp-bridge) dan
[bridge MCP alat OpenClaw](/id/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## Gunakan dari `acpx` (Codex, Claude, klien ACP lainnya)

Jika Anda ingin agen pengodean seperti Codex atau Claude Code berbicara dengan
bot OpenClaw Anda melalui ACP, gunakan `acpx` dengan target `openclaw` bawaannya.

Alur umum:

1. Jalankan Gateway dan pastikan bridge ACP dapat menjangkaunya.
2. Arahkan `acpx openclaw` ke `openclaw acp`.
3. Targetkan kunci sesi OpenClaw yang Anda ingin digunakan oleh agen pengodean.

Contoh:

```bash
# Permintaan sekali jalan ke sesi ACP OpenClaw default Anda
acpx openclaw exec "Summarize the active OpenClaw session state."

# Sesi bernama persisten untuk giliran lanjutan
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

Jika Anda ingin `acpx openclaw` menargetkan Gateway dan kunci sesi tertentu setiap
saat, timpa perintah agen `openclaw` di `~/.acpx/config.json`:

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
runner dev agar stream ACP tetap bersih. Misalnya:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

Ini adalah cara termudah untuk memungkinkan Codex, Claude Code, atau klien lain yang paham ACP
menarik informasi kontekstual dari agen OpenClaw tanpa melakukan scraping terminal.

## Penyiapan editor Zed

Tambahkan agen ACP kustom di `~/.config/zed/settings.json` (atau gunakan UI Settings Zed):

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

Di Zed, buka panel Agent dan pilih "OpenClaw ACP" untuk memulai thread.

## Pemetaan sesi

Secara default, sesi bridge ACP mendapatkan kunci sesi Gateway terisolasi dengan
prefiks `acp-bridge:`. Sesi bridge model normal ini bersifat sintetis dan
tunduk pada pemangkasan entri usang serta batas jumlah entri. Untuk menggunakan kembali sesi yang diketahui,
teruskan kunci atau label sesi:

- `--session <key>`: gunakan kunci sesi Gateway tertentu.
- `--session-label <label>`: selesaikan sesi yang sudah ada berdasarkan label.
- `--reset-session`: buat id sesi baru untuk kunci tersebut (kunci yang sama, transkrip baru).

Jika klien ACP Anda mendukung metadata, Anda dapat menimpa per sesi:

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

Pelajari selengkapnya tentang kunci sesi di [/concepts/session](/id/concepts/session).

## Opsi

- `--url <url>`: URL WebSocket Gateway (default ke gateway.remote.url saat dikonfigurasi).
- `--token <token>`: token autentikasi Gateway.
- `--token-file <path>`: baca token autentikasi Gateway dari file.
- `--password <password>`: kata sandi autentikasi Gateway.
- `--password-file <path>`: baca kata sandi autentikasi Gateway dari file.
- `--session <key>`: kunci sesi default.
- `--session-label <label>`: label sesi default untuk diselesaikan.
- `--require-existing`: gagal jika kunci/label sesi tidak ada.
- `--reset-session`: reset kunci sesi sebelum penggunaan pertama.
- `--no-prefix-cwd`: jangan awali prompt dengan direktori kerja.
- `--provenance <off|meta|meta+receipt>`: sertakan metadata atau tanda terima provenance ACP.
- `--verbose, -v`: logging verbose ke stderr.

Catatan keamanan:

- `--token` dan `--password` dapat terlihat dalam daftar proses lokal pada beberapa sistem.
- Utamakan `--token-file`/`--password-file` atau variabel lingkungan (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- Resolusi autentikasi Gateway mengikuti kontrak bersama yang digunakan oleh klien Gateway lainnya:
  - mode lokal: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> fallback `gateway.remote.*` hanya saat `gateway.auth.*` tidak disetel (SecretRefs lokal yang dikonfigurasi tetapi tidak terselesaikan gagal tertutup)
  - mode remote: `gateway.remote.*` dengan fallback env/config sesuai aturan prioritas remote
  - `--url` aman sebagai override dan tidak menggunakan ulang kredensial config/env implisit; teruskan `--token`/`--password` eksplisit (atau varian file)
- Proses anak backend runtime ACP menerima `OPENCLAW_SHELL=acp`, yang dapat digunakan untuk aturan shell/profil khusus konteks.
- `openclaw acp client` menyetel `OPENCLAW_SHELL=acp-client` pada proses bridge yang di-spawn.

### Opsi `acp client`

- `--cwd <dir>`: direktori kerja untuk sesi ACP.
- `--server <command>`: perintah server ACP (default: `openclaw`).
- `--server-args <args...>`: argumen tambahan yang diteruskan ke server ACP.
- `--server-verbose`: aktifkan logging verbose pada server ACP.
- `--verbose, -v`: logging klien verbose.

## Terkait

- [referensi CLI](/id/cli)
- [agen ACP](/id/tools/acp-agents)
