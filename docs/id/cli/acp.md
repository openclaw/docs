---
read_when:
    - Menyiapkan integrasi IDE berbasis ACP
    - Men-debug perutean sesi ACP ke Gateway
summary: Jalankan bridge ACP untuk integrasi IDE
title: acp
x-i18n:
    generated_at: "2026-04-05T13:45:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2461b181e4a97dd84580581e9436ca1947a224decce8044132dbcf7fb2b7502c
    source_path: cli/acp.md
    workflow: 15
---

# acp

Jalankan bridge [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) yang berbicara dengan OpenClaw Gateway.

Perintah ini berbicara ACP melalui stdio untuk IDE dan meneruskan prompt ke Gateway melalui WebSocket. Perintah ini menjaga sesi ACP tetap dipetakan ke kunci sesi Gateway.

`openclaw acp` adalah bridge ACP yang didukung Gateway, bukan runtime editor native ACP penuh. Fokusnya adalah perutean sesi, pengiriman prompt, dan pembaruan streaming dasar.

Jika Anda ingin klien MCP eksternal berbicara langsung dengan percakapan channel OpenClaw alih-alih meng-host sesi harness ACP, gunakan
[`openclaw mcp serve`](/cli/mcp).

## Ini bukan apa

Halaman ini sering disalahartikan sebagai sesi harness ACP.

`openclaw acp` berarti:

- OpenClaw bertindak sebagai server ACP
- IDE atau klien ACP terhubung ke OpenClaw
- OpenClaw meneruskan pekerjaan itu ke sesi Gateway

Ini berbeda dari [ACP Agents](/tools/acp-agents), di mana OpenClaw menjalankan harness eksternal seperti Codex atau Claude Code melalui `acpx`.

Aturan cepat:

- editor/klien ingin berbicara ACP ke OpenClaw: gunakan `openclaw acp`
- OpenClaw harus meluncurkan Codex/Claude/Gemini sebagai harness ACP: gunakan `/acp spawn` dan [ACP Agents](/tools/acp-agents)

## Matriks Kompatibilitas

| Area ACP                                                              | Status      | Catatan                                                                                                                                                                                                                                            |
| --------------------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `initialize`, `newSession`, `prompt`, `cancel`                        | Diimplementasikan | Alur bridge inti melalui stdio ke chat/send Gateway + abort.                                                                                                                                                                                 |
| `listSessions`, slash commands                                        | Diimplementasikan | Daftar sesi bekerja terhadap status sesi Gateway; perintah diiklankan melalui `available_commands_update`.                                                                                                                                    |
| `loadSession`                                                         | Parsial     | Mengikat ulang sesi ACP ke kunci sesi Gateway dan memutar ulang riwayat teks pengguna/asisten yang tersimpan. Riwayat tool/sistem belum direkonstruksi.                                                                                         |
| Konten prompt (`text`, `resource` tersemat, gambar)                   | Parsial     | Teks/resource diratakan ke input chat; gambar menjadi lampiran Gateway.                                                                                                                                                                      |
| Mode sesi                                                             | Parsial     | `session/set_mode` didukung dan bridge mengekspos kontrol sesi awal yang didukung Gateway untuk tingkat pemikiran, verbositas tool, penalaran, detail penggunaan, dan elevated actions. Surface mode/config native ACP yang lebih luas masih di luar cakupan. |
| Info sesi dan pembaruan penggunaan                                    | Parsial     | Bridge memancarkan notifikasi `session_info_update` dan `usage_update` best-effort dari snapshot sesi Gateway yang di-cache. Penggunaan bersifat perkiraan dan hanya dikirim saat total token Gateway ditandai fresh.                       |
| Streaming tool                                                        | Parsial     | Event `tool_call` / `tool_call_update` mencakup I/O mentah, konten teks, dan lokasi file best-effort saat argumen/hasil tool Gateway mengeksposnya. Terminal tersemat dan output native diff yang lebih kaya masih belum diekspos.          |
| Server MCP per sesi (`mcpServers`)                                    | Tidak didukung | Mode bridge menolak permintaan server MCP per sesi. Konfigurasikan MCP di gateway atau agen OpenClaw.                                                                                                                                      |
| Metode filesystem klien (`fs/read_text_file`, `fs/write_text_file`)   | Tidak didukung | Bridge tidak memanggil metode filesystem klien ACP.                                                                                                                                                                                          |
| Metode terminal klien (`terminal/*`)                                  | Tidak didukung | Bridge tidak membuat terminal klien ACP atau men-stream id terminal melalui pemanggilan tool.                                                                                                                                                |
| Rencana sesi / streaming pemikiran                                    | Tidak didukung | Bridge saat ini memancarkan teks output dan status tool, bukan pembaruan rencana atau pemikiran ACP.                                                                                                                                       |

## Keterbatasan yang Diketahui

- `loadSession` memutar ulang riwayat teks pengguna dan asisten yang tersimpan, tetapi tidak merekonstruksi pemanggilan tool historis, pemberitahuan sistem, atau jenis event native ACP yang lebih kaya.
- Jika beberapa klien ACP berbagi kunci sesi Gateway yang sama, perutean event dan cancel bersifat best-effort, bukan benar-benar terisolasi per klien. Gunakan sesi `acp:<uuid>` terisolasi default saat Anda memerlukan giliran lokal editor yang bersih.
- Status berhenti Gateway diterjemahkan ke alasan berhenti ACP, tetapi pemetaan itu kurang ekspresif dibanding runtime native ACP penuh.
- Kontrol sesi awal saat ini hanya mengekspos subset terfokus dari knob Gateway: tingkat pemikiran, verbositas tool, penalaran, detail penggunaan, dan elevated actions. Pemilihan model serta kontrol exec-host belum diekspos sebagai opsi config ACP.
- `session_info_update` dan `usage_update` diturunkan dari snapshot sesi Gateway, bukan akuntansi runtime native ACP langsung. Penggunaan bersifat perkiraan, tidak membawa data biaya, dan hanya dipancarkan saat Gateway menandai data total token sebagai fresh.
- Data follow-along tool bersifat best-effort. Bridge dapat menampilkan jalur file yang muncul dalam argumen/hasil tool yang dikenal, tetapi belum memancarkan terminal ACP atau diff file terstruktur.

## Penggunaan

```bash
openclaw acp

# Gateway jarak jauh
openclaw acp --url wss://gateway-host:18789 --token <token>

# Gateway jarak jauh (token dari file)
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Lampirkan ke kunci sesi yang sudah ada
openclaw acp --session agent:main:main

# Lampirkan berdasarkan label (harus sudah ada)
openclaw acp --session-label "support inbox"

# Reset kunci sesi sebelum prompt pertama
openclaw acp --session agent:main:main --reset-session
```

## Klien ACP (debug)

Gunakan klien ACP bawaan untuk sanity-check bridge tanpa IDE.
Perintah ini menjalankan bridge ACP dan memungkinkan Anda mengetik prompt secara interaktif.

```bash
openclaw acp client

# Arahkan bridge yang dijalankan ke Gateway jarak jauh
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override perintah server (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Model izin (mode debug klien):

- Persetujuan otomatis berbasis allowlist dan hanya berlaku untuk ID tool inti tepercaya.
- Persetujuan otomatis `read` dibatasi ke direktori kerja saat ini (`--cwd` jika disetel).
- ACP hanya menyetujui otomatis kelas readonly yang sempit: pemanggilan `read` yang dibatasi di bawah cwd aktif plus tool pencarian readonly (`search`, `web_search`, `memory_search`). Tool yang tidak dikenal/non-inti, pembacaan di luar cakupan, tool yang mampu exec, tool control-plane, tool yang memodifikasi, dan alur interaktif selalu memerlukan persetujuan prompt eksplisit.
- `toolCall.kind` yang disediakan server diperlakukan sebagai metadata yang tidak tepercaya (bukan sumber otorisasi).
- Kebijakan bridge ACP ini terpisah dari izin harness ACPX. Jika Anda menjalankan OpenClaw melalui backend `acpx`, `plugins.entries.acpx.config.permissionMode=approve-all` adalah sakelar break-glass “yolo” untuk sesi harness tersebut.

## Cara menggunakan ini

Gunakan ACP saat IDE (atau klien lain) berbicara Agent Client Protocol dan Anda ingin IDE itu mengendalikan sesi OpenClaw Gateway.

1. Pastikan Gateway sedang berjalan (lokal atau jarak jauh).
2. Konfigurasikan target Gateway (config atau flag).
3. Arahkan IDE Anda untuk menjalankan `openclaw acp` melalui stdio.

Contoh config (persisten):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

Contoh menjalankan langsung (tanpa menulis config):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# disarankan untuk keamanan proses lokal
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## Memilih agen

ACP tidak memilih agen secara langsung. ACP merutekan berdasarkan kunci sesi Gateway.

Gunakan kunci sesi yang dicakup agen untuk menargetkan agen tertentu:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Setiap sesi ACP dipetakan ke satu kunci sesi Gateway. Satu agen dapat memiliki banyak sesi; ACP default ke sesi `acp:<uuid>` terisolasi kecuali Anda menimpa kunci atau labelnya.

`mcpServers` per sesi tidak didukung dalam mode bridge. Jika klien ACP mengirimkannya selama `newSession` atau `loadSession`, bridge akan mengembalikan error yang jelas alih-alih mengabaikannya secara diam-diam.

Jika Anda ingin sesi yang didukung ACPX melihat plugin tools OpenClaw, aktifkan bridge plugin ACPX di sisi gateway alih-alih mencoba meneruskan `mcpServers` per sesi. Lihat [ACP Agents](/tools/acp-agents#plugin-tools-mcp-bridge).

## Gunakan dari `acpx` (Codex, Claude, klien ACP lainnya)

Jika Anda ingin agen coding seperti Codex atau Claude Code berbicara dengan bot OpenClaw Anda melalui ACP, gunakan `acpx` dengan target `openclaw` bawaannya.

Alur umum:

1. Jalankan Gateway dan pastikan bridge ACP dapat menjangkaunya.
2. Arahkan `acpx openclaw` ke `openclaw acp`.
3. Targetkan kunci sesi OpenClaw yang ingin digunakan agen coding tersebut.

Contoh:

```bash
# Permintaan sekali jalan ke sesi ACP OpenClaw default Anda
acpx openclaw exec "Ringkas status sesi OpenClaw aktif."

# Sesi bernama persisten untuk giliran lanjutan
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Tanyakan ke agen kerja OpenClaw saya konteks terbaru yang relevan untuk repo ini."
```

Jika Anda ingin `acpx openclaw` selalu menargetkan Gateway dan kunci sesi tertentu, timpa perintah agen `openclaw` di `~/.acpx/config.json`:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

Untuk checkout OpenClaw lokal berbasis repo, gunakan entrypoint CLI langsung alih-alih dev runner agar stream ACP tetap bersih. Contohnya:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

Ini adalah cara termudah untuk membiarkan Codex, Claude Code, atau klien lain yang mendukung ACP menarik informasi kontekstual dari agen OpenClaw tanpa mengikis terminal.

## Setup editor Zed

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

Di Zed, buka panel Agent dan pilih “OpenClaw ACP” untuk memulai thread.

## Pemetaan sesi

Secara default, sesi ACP mendapatkan kunci sesi Gateway terisolasi dengan prefiks `acp:`.
Untuk menggunakan ulang sesi yang diketahui, berikan kunci sesi atau label:

- `--session <key>`: gunakan kunci sesi Gateway tertentu.
- `--session-label <label>`: resolve sesi yang sudah ada berdasarkan label.
- `--reset-session`: buat id sesi baru untuk kunci itu (kunci sama, transkrip baru).

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

Pelajari lebih lanjut tentang kunci sesi di [/concepts/session](/concepts/session).

## Opsi

- `--url <url>`: URL WebSocket Gateway (default ke `gateway.remote.url` jika dikonfigurasi).
- `--token <token>`: token autentikasi Gateway.
- `--token-file <path>`: baca token autentikasi Gateway dari file.
- `--password <password>`: kata sandi autentikasi Gateway.
- `--password-file <path>`: baca kata sandi autentikasi Gateway dari file.
- `--session <key>`: kunci sesi default.
- `--session-label <label>`: label sesi default untuk di-resolve.
- `--require-existing`: gagal jika kunci/label sesi tidak ada.
- `--reset-session`: reset kunci sesi sebelum penggunaan pertama.
- `--no-prefix-cwd`: jangan awali prompt dengan direktori kerja.
- `--provenance <off|meta|meta+receipt>`: sertakan metadata atau receipt provenance ACP.
- `--verbose, -v`: logging verbose ke stderr.

Catatan keamanan:

- `--token` dan `--password` dapat terlihat di daftar proses lokal pada beberapa sistem.
- Gunakan `--token-file`/`--password-file` atau variabel lingkungan (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- Resolusi autentikasi Gateway mengikuti kontrak bersama yang digunakan oleh klien Gateway lain:
  - mode lokal: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> fallback `gateway.remote.*` hanya saat `gateway.auth.*` tidak disetel (SecretRef lokal yang dikonfigurasi tetapi tidak dapat di-resolve gagal tertutup)
  - mode jarak jauh: `gateway.remote.*` dengan fallback env/config sesuai aturan prioritas remote
  - `--url` aman untuk override dan tidak menggunakan ulang kredensial env/config implisit; berikan `--token`/`--password` eksplisit (atau varian file)
- Proses child backend runtime ACP menerima `OPENCLAW_SHELL=acp`, yang dapat digunakan untuk aturan shell/profile spesifik konteks.
- `openclaw acp client` menyetel `OPENCLAW_SHELL=acp-client` pada proses bridge yang dijalankan.

### Opsi `acp client`

- `--cwd <dir>`: direktori kerja untuk sesi ACP.
- `--server <command>`: perintah server ACP (default: `openclaw`).
- `--server-args <args...>`: argumen tambahan yang diteruskan ke server ACP.
- `--server-verbose`: aktifkan logging verbose pada server ACP.
- `--verbose, -v`: logging verbose klien.
