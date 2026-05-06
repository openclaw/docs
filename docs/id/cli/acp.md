---
read_when:
    - Menyiapkan integrasi IDE berbasis ACP
    - Pemecahan masalah perutean sesi ACP ke Gateway
summary: Jalankan jembatan ACP untuk integrasi IDE
title: ACP
x-i18n:
    generated_at: "2026-05-06T09:04:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: c91de534078b4d49b2776d7a85264d2ba8d7bdd7a3cd715ce615b4b4b26c6528
    source_path: cli/acp.md
    workflow: 16
---

Jalankan bridge [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) yang berkomunikasi dengan OpenClaw Gateway.

Perintah ini menggunakan ACP melalui stdio untuk IDE dan meneruskan prompt ke Gateway
melalui WebSocket. Perintah ini menjaga sesi ACP tetap dipetakan ke kunci sesi Gateway.

`openclaw acp` adalah bridge ACP berbasis Gateway, bukan runtime editor
ACP-native penuh. Fokusnya adalah routing sesi, pengiriman prompt, dan pembaruan
streaming dasar.

Jika Anda ingin klien MCP eksternal berbicara langsung dengan percakapan channel
OpenClaw alih-alih meng-host sesi harness ACP, gunakan
[`openclaw mcp serve`](/id/cli/mcp) sebagai gantinya.

## Yang bukan ini

Halaman ini sering tertukar dengan sesi harness ACP.

`openclaw acp` berarti:

- OpenClaw bertindak sebagai server ACP
- IDE atau klien ACP terhubung ke OpenClaw
- OpenClaw meneruskan pekerjaan itu ke dalam sesi Gateway

Ini berbeda dari [Agen ACP](/id/tools/acp-agents), ketika OpenClaw menjalankan
harness eksternal seperti Codex atau Claude Code melalui `acpx`.

Aturan singkat:

- editor/klien ingin berbicara ACP ke OpenClaw: gunakan `openclaw acp`
- OpenClaw harus meluncurkan Codex/Claude/Gemini sebagai harness ACP: gunakan `/acp spawn` dan [Agen ACP](/id/tools/acp-agents)

## Matriks Kompatibilitas

| Area ACP                                                              | Status      | Catatan                                                                                                                                                                                                                                          |
| --------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`, `newSession`, `prompt`, `cancel`                        | Diimplementasikan | Alur bridge inti melalui stdio ke chat/send + abort Gateway.                                                                                                                                                                                     |
| `listSessions`, perintah slash                                        | Diimplementasikan | Daftar sesi bekerja terhadap status sesi Gateway; perintah diumumkan melalui `available_commands_update`.                                                                                                                                        |
| `loadSession`                                                         | Parsial     | Mengikat ulang sesi ACP ke kunci sesi Gateway dan memutar ulang riwayat teks pengguna/asisten yang tersimpan. Riwayat tool/sistem belum direkonstruksi.                                                                                          |
| Konten prompt (`text`, `resource` tersemat, gambar)                   | Parsial     | Teks/resource diratakan menjadi input chat; gambar menjadi lampiran Gateway.                                                                                                                                                                      |
| Mode sesi                                                             | Parsial     | `session/set_mode` didukung dan bridge mengekspos kontrol sesi awal berbasis Gateway untuk tingkat pemikiran, verbosity tool, penalaran, detail penggunaan, dan tindakan tinggi. Permukaan mode/konfigurasi ACP-native yang lebih luas masih di luar cakupan. |
| Info sesi dan pembaruan penggunaan                                    | Parsial     | Bridge memancarkan notifikasi `session_info_update` dan `usage_update` berbasis upaya terbaik dari snapshot sesi Gateway yang di-cache. Penggunaan bersifat perkiraan dan hanya dikirim ketika total token Gateway ditandai baru.                |
| Streaming tool                                                        | Parsial     | Event `tool_call` / `tool_call_update` menyertakan I/O mentah, konten teks, dan lokasi file berbasis upaya terbaik ketika argumen/hasil tool Gateway mengeksposnya. Terminal tersemat dan output yang lebih kaya berbasis diff-native masih belum diekspos. |
| Server MCP per sesi (`mcpServers`)                                    | Tidak didukung | Mode bridge menolak permintaan server MCP per sesi. Konfigurasikan MCP pada gateway atau agen OpenClaw sebagai gantinya.                                                                                                                         |
| Metode filesystem klien (`fs/read_text_file`, `fs/write_text_file`)   | Tidak didukung | Bridge tidak memanggil metode filesystem klien ACP.                                                                                                                                                                                              |
| Metode terminal klien (`terminal/*`)                                  | Tidak didukung | Bridge tidak membuat terminal klien ACP atau melakukan streaming id terminal melalui panggilan tool.                                                                                                                                             |
| Rencana sesi / streaming pemikiran                                    | Tidak didukung | Bridge saat ini memancarkan teks output dan status tool, bukan pembaruan rencana atau pemikiran ACP.                                                                                                                                             |

## Batasan yang Diketahui

- `loadSession` memutar ulang riwayat teks pengguna dan asisten yang tersimpan, tetapi tidak
  merekonstruksi panggilan tool historis, pemberitahuan sistem, atau tipe event
  ACP-native yang lebih kaya.
- Jika beberapa klien ACP berbagi kunci sesi Gateway yang sama, routing event dan pembatalan
  bersifat upaya terbaik, bukan benar-benar terisolasi per klien. Pilih sesi
  default terisolasi `acp:<uuid>` ketika Anda membutuhkan giliran editor-local
  yang bersih.
- Status berhenti Gateway diterjemahkan menjadi alasan berhenti ACP, tetapi pemetaan itu
  kurang ekspresif dibanding runtime ACP-native penuh.
- Kontrol sesi awal saat ini menampilkan subset kenop Gateway yang terfokus:
  tingkat pemikiran, verbosity tool, penalaran, detail penggunaan, dan tindakan
  tinggi. Pemilihan model dan kontrol exec-host belum diekspos sebagai opsi
  konfigurasi ACP.
- `session_info_update` dan `usage_update` diturunkan dari snapshot sesi Gateway,
  bukan akuntansi runtime ACP-native langsung. Penggunaan bersifat perkiraan,
  tidak memuat data biaya, dan hanya dipancarkan ketika Gateway menandai data total token
  sebagai baru.
- Data follow-along tool bersifat upaya terbaik. Bridge dapat menampilkan path file yang
  muncul dalam argumen/hasil tool yang dikenal, tetapi belum memancarkan terminal ACP atau
  diff file terstruktur.

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

Gunakan klien ACP bawaan untuk memeriksa kewajaran bridge tanpa IDE.
Klien ini men-spawn bridge ACP dan memungkinkan Anda mengetik prompt secara interaktif.

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Model izin (mode debug klien):

- Persetujuan otomatis berbasis allowlist dan hanya berlaku untuk ID tool inti tepercaya.
- Persetujuan otomatis `read` dibatasi ke direktori kerja saat ini (`--cwd` ketika disetel).
- ACP hanya menyetujui otomatis kelas readonly yang sempit: panggilan `read` tercakup di bawah cwd aktif ditambah tool pencarian readonly (`search`, `web_search`, `memory_search`). Tool tidak dikenal/non-inti, pembacaan di luar cakupan, tool yang mampu exec, tool control-plane, tool yang memutasi, dan alur interaktif selalu memerlukan persetujuan prompt eksplisit.
- `toolCall.kind` yang disediakan server diperlakukan sebagai metadata tidak tepercaya (bukan sumber otorisasi).
- Kebijakan bridge ACP ini terpisah dari izin harness ACPX. Jika Anda menjalankan OpenClaw melalui backend `acpx`, `plugins.entries.acpx.config.permissionMode=approve-all` adalah switch "yolo" break-glass untuk sesi harness tersebut.

## Cara menggunakan ini

Gunakan ACP ketika IDE (atau klien lain) berbicara Agent Client Protocol dan Anda ingin
ia mengendalikan sesi OpenClaw Gateway.

1. Pastikan Gateway berjalan (lokal atau jarak jauh).
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

ACP tidak memilih agen secara langsung. ACP melakukan routing berdasarkan kunci sesi Gateway.

Gunakan kunci sesi bercakupan agen untuk menargetkan agen tertentu:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Setiap sesi ACP dipetakan ke satu kunci sesi Gateway. Satu agen dapat memiliki banyak
sesi; ACP secara default menggunakan sesi `acp:<uuid>` terisolasi kecuali Anda menimpa
kunci atau label.

`mcpServers` per sesi tidak didukung dalam mode bridge. Jika klien ACP
mengirimkannya saat `newSession` atau `loadSession`, bridge mengembalikan error yang jelas
alih-alih mengabaikannya secara diam-diam.

Jika Anda ingin sesi berbasis ACPX melihat tool plugin OpenClaw atau tool bawaan
tertentu seperti `cron`, aktifkan bridge MCP ACPX sisi gateway sebagai gantinya
daripada mencoba meneruskan `mcpServers` per sesi. Lihat
[Agen ACP](/id/tools/acp-agents-setup#plugin-tools-mcp-bridge) dan
[bridge MCP tool OpenClaw](/id/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## Gunakan dari `acpx` (Codex, Claude, klien ACP lain)

Jika Anda ingin agen coding seperti Codex atau Claude Code berbicara dengan bot
OpenClaw Anda melalui ACP, gunakan `acpx` dengan target `openclaw` bawaannya.

Alur umum:

1. Jalankan Gateway dan pastikan bridge ACP dapat menjangkaunya.
2. Arahkan `acpx openclaw` ke `openclaw acp`.
3. Targetkan kunci sesi OpenClaw yang Anda ingin agen coding gunakan.

Contoh:

```bash
# One-shot request into your default OpenClaw ACP session
acpx openclaw exec "Summarize the active OpenClaw session state."

# Persistent named session for follow-up turns
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

Jika Anda ingin `acpx openclaw` menargetkan Gateway dan kunci sesi tertentu setiap
kali, timpa perintah agen `openclaw` di `~/.acpx/config.json`:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

Untuk checkout OpenClaw repo-local, gunakan entrypoint CLI langsung alih-alih
dev runner agar stream ACP tetap bersih. Contoh:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

Ini adalah cara termudah untuk memungkinkan Codex, Claude Code, atau klien lain yang memahami ACP
mengambil informasi kontekstual dari agen OpenClaw tanpa men-scrape terminal.

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

Secara default, sesi ACP mendapatkan kunci sesi Gateway terisolasi dengan prefiks `acp:`.
Untuk menggunakan kembali sesi yang dikenal, teruskan kunci atau label sesi:

- `--session <key>`: gunakan kunci sesi Gateway tertentu.
- `--session-label <label>`: cocokkan sesi yang ada berdasarkan label.
- `--reset-session`: buat id sesi baru untuk kunci tersebut (kunci yang sama, transkrip baru).

Jika klien ACP Anda mendukung metadata, Anda dapat menggantinya per sesi:

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
- `--session-label <label>`: label sesi default yang akan dicocokkan.
- `--require-existing`: gagal jika kunci/label sesi tidak ada.
- `--reset-session`: reset kunci sesi sebelum penggunaan pertama.
- `--no-prefix-cwd`: jangan beri prefiks prompt dengan direktori kerja.
- `--provenance <off|meta|meta+receipt>`: sertakan metadata provenance ACP atau tanda terima.
- `--verbose, -v`: pencatatan verbose ke stderr.

Catatan keamanan:

- `--token` dan `--password` dapat terlihat dalam daftar proses lokal pada beberapa sistem.
- Lebih baik gunakan `--token-file`/`--password-file` atau variabel lingkungan (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- Resolusi autentikasi Gateway mengikuti kontrak bersama yang digunakan oleh klien Gateway lainnya:
  - mode lokal: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> fallback `gateway.remote.*` hanya saat `gateway.auth.*` belum diatur (SecretRefs lokal yang dikonfigurasi tetapi tidak terselesaikan akan gagal tertutup)
  - mode jarak jauh: `gateway.remote.*` dengan fallback env/config sesuai aturan prioritas jarak jauh
  - `--url` aman sebagai override dan tidak menggunakan kembali kredensial config/env implisit; teruskan `--token`/`--password` secara eksplisit (atau varian file)
- Proses anak backend runtime ACP menerima `OPENCLAW_SHELL=acp`, yang dapat digunakan untuk aturan shell/profil khusus konteks.
- `openclaw acp client` menetapkan `OPENCLAW_SHELL=acp-client` pada proses bridge yang dijalankan.

### Opsi `acp client`

- `--cwd <dir>`: direktori kerja untuk sesi ACP.
- `--server <command>`: perintah server ACP (default: `openclaw`).
- `--server-args <args...>`: argumen tambahan yang diteruskan ke server ACP.
- `--server-verbose`: aktifkan pencatatan verbose pada server ACP.
- `--verbose, -v`: pencatatan klien verbose.

## Terkait

- [Referensi CLI](/id/cli)
- [Agen ACP](/id/tools/acp-agents)
