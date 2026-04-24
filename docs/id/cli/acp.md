---
read_when:
    - Menyiapkan integrasi IDE berbasis ACP
    - Men-debug routing sesi ACP ke Gateway
summary: Jalankan bridge ACP untuk integrasi IDE
title: ACP
x-i18n:
    generated_at: "2026-04-24T09:00:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88b4d5de9e8e7464fd929ace0471af7d85afc94789c0c45a1f4a00d39b7871e1
    source_path: cli/acp.md
    workflow: 15
---

Jalankan bridge [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) yang berbicara dengan Gateway OpenClaw.

Perintah ini menggunakan ACP melalui stdio untuk IDE dan meneruskan prompt ke Gateway
melalui WebSocket. Ini menjaga agar sesi ACP tetap dipetakan ke session key Gateway.

`openclaw acp` adalah bridge ACP berbasis Gateway, bukan runtime editor native ACP
penuh. Fokusnya adalah routing sesi, pengiriman prompt, dan pembaruan streaming
dasar.

Jika Anda ingin klien MCP eksternal berbicara langsung dengan percakapan channel
OpenClaw alih-alih meng-host sesi harness ACP, gunakan
[`openclaw mcp serve`](/id/cli/mcp) sebagai gantinya.

## Ini bukan apa

Halaman ini sering disalahartikan sebagai sesi harness ACP.

`openclaw acp` berarti:

- OpenClaw bertindak sebagai server ACP
- IDE atau klien ACP terhubung ke OpenClaw
- OpenClaw meneruskan pekerjaan itu ke sesi Gateway

Ini berbeda dari [ACP Agents](/id/tools/acp-agents), di mana OpenClaw menjalankan
harness eksternal seperti Codex atau Claude Code melalui `acpx`.

Aturan cepat:

- editor/klien ingin berbicara ACP ke OpenClaw: gunakan `openclaw acp`
- OpenClaw harus meluncurkan Codex/Claude/Gemini sebagai harness ACP: gunakan `/acp spawn` dan [ACP Agents](/id/tools/acp-agents)

## Matriks kompatibilitas

| Area ACP                                                              | Status      | Catatan                                                                                                                                                                                                                                              |
| --------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `initialize`, `newSession`, `prompt`, `cancel`                        | Diimplementasikan | Alur bridge inti melalui stdio ke chat/send Gateway + abort.                                                                                                                                                                                         |
| `listSessions`, slash command                                         | Diimplementasikan | Daftar sesi bekerja terhadap status sesi Gateway; perintah diumumkan melalui `available_commands_update`.                                                                                                                                            |
| `loadSession`                                                         | Parsial     | Mengikat ulang sesi ACP ke session key Gateway dan memutar ulang riwayat teks pengguna/asisten yang tersimpan. Riwayat tool/sistem belum direkonstruksi.                                                                                           |
| Konten prompt (`text`, `resource` tersemat, gambar)                  | Parsial     | Teks/resource diratakan menjadi input chat; gambar menjadi lampiran Gateway.                                                                                                                                                                         |
| Mode sesi                                                             | Parsial     | `session/set_mode` didukung dan bridge menampilkan kontrol sesi awal berbasis Gateway untuk tingkat pemikiran, verbositas tool, reasoning, detail penggunaan, dan aksi yang ditingkatkan. Permukaan mode/konfigurasi ACP-native yang lebih luas masih di luar cakupan. |
| Informasi sesi dan pembaruan penggunaan                               | Parsial     | Bridge mengeluarkan notifikasi `session_info_update` dan `usage_update` best-effort dari snapshot sesi Gateway yang di-cache. Penggunaan bersifat perkiraan dan hanya dikirim saat total token Gateway ditandai fresh.                            |
| Streaming tool                                                        | Parsial     | Event `tool_call` / `tool_call_update` mencakup I/O mentah, konten teks, dan lokasi file best-effort ketika argumen/hasil tool Gateway mengeksposnya. Terminal tersemat dan output native diff yang lebih kaya masih belum diekspos.             |
| Server MCP per sesi (`mcpServers`)                                    | Tidak didukung | Mode bridge menolak permintaan server MCP per sesi. Konfigurasikan MCP di gateway atau agen OpenClaw sebagai gantinya.                                                                                                                             |
| Metode filesystem klien (`fs/read_text_file`, `fs/write_text_file`)   | Tidak didukung | Bridge tidak memanggil metode filesystem klien ACP.                                                                                                                                                                                                  |
| Metode terminal klien (`terminal/*`)                                  | Tidak didukung | Bridge tidak membuat terminal klien ACP atau mengalirkan id terminal melalui panggilan tool.                                                                                                                                                        |
| Rencana sesi / streaming thought                                      | Tidak didukung | Bridge saat ini mengeluarkan teks output dan status tool, bukan pembaruan rencana atau thought ACP.                                                                                                                                                 |

## Batasan yang diketahui

- `loadSession` memutar ulang riwayat teks pengguna dan asisten yang tersimpan, tetapi tidak
  merekonstruksi panggilan tool historis, pemberitahuan sistem, atau jenis event
  ACP-native yang lebih kaya.
- Jika beberapa klien ACP berbagi session key Gateway yang sama, routing event dan cancel
  bersifat best-effort, bukan terisolasi ketat per klien. Sebaiknya gunakan
  sesi `acp:<uuid>` terisolasi bawaan saat Anda memerlukan giliran lokal editor yang
  bersih.
- Status stop Gateway diterjemahkan menjadi alasan berhenti ACP, tetapi pemetaan itu
  kurang ekspresif dibanding runtime ACP-native penuh.
- Kontrol sesi awal saat ini hanya menampilkan subset terfokus dari knob Gateway:
  tingkat pemikiran, verbositas tool, reasoning, detail penggunaan, dan
  aksi yang ditingkatkan. Pemilihan model dan kontrol exec-host belum diekspos sebagai opsi
  konfigurasi ACP.
- `session_info_update` dan `usage_update` diturunkan dari snapshot sesi Gateway,
  bukan akuntansi runtime ACP-native langsung. Penggunaan bersifat perkiraan,
  tidak membawa data biaya, dan hanya dikeluarkan saat Gateway menandai data total token
  sebagai fresh.
- Data follow-along tool bersifat best-effort. Bridge dapat menampilkan path file yang
  muncul dalam argumen/hasil tool yang dikenal, tetapi belum mengeluarkan terminal ACP atau
  diff file terstruktur.

## Penggunaan

```bash
openclaw acp

# Gateway remote
openclaw acp --url wss://gateway-host:18789 --token <token>

# Gateway remote (token dari file)
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Lampirkan ke session key yang sudah ada
openclaw acp --session agent:main:main

# Lampirkan berdasarkan label (harus sudah ada)
openclaw acp --session-label "support inbox"

# Reset session key sebelum prompt pertama
openclaw acp --session agent:main:main --reset-session
```

## Klien ACP (debug)

Gunakan klien ACP bawaan untuk memeriksa bridge tanpa IDE.
Ini meluncurkan bridge ACP dan memungkinkan Anda mengetik prompt secara interaktif.

```bash
openclaw acp client

# Arahkan bridge yang diluncurkan ke Gateway remote
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override perintah server (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Model izin (mode debug klien):

- Persetujuan otomatis berbasis allowlist dan hanya berlaku untuk id tool inti tepercaya.
- Persetujuan otomatis `read` dicakup ke direktori kerja saat ini (`--cwd` jika disetel).
- ACP hanya menyetujui otomatis kelas readonly yang sempit: panggilan `read` yang dicakup di bawah cwd aktif plus tool pencarian readonly (`search`, `web_search`, `memory_search`). Tool yang tidak dikenal/bukan inti, pembacaan di luar cakupan, tool yang mampu exec, tool control-plane, tool mutatif, dan alur interaktif selalu memerlukan persetujuan prompt eksplisit.
- `toolCall.kind` yang disediakan server diperlakukan sebagai metadata yang tidak tepercaya (bukan sumber otorisasi).
- Kebijakan bridge ACP ini terpisah dari izin harness ACPX. Jika Anda menjalankan OpenClaw melalui backend `acpx`, `plugins.entries.acpx.config.permissionMode=approve-all` adalah sakelar darurat “yolo” untuk sesi harness tersebut.

## Cara menggunakan ini

Gunakan ACP saat IDE (atau klien lain) berbicara Agent Client Protocol dan Anda ingin
klien itu mengendalikan sesi Gateway OpenClaw.

1. Pastikan Gateway berjalan (lokal atau remote).
2. Konfigurasikan target Gateway (konfigurasi atau flag).
3. Arahkan IDE Anda untuk menjalankan `openclaw acp` melalui stdio.

Contoh konfigurasi (persisten):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

Contoh menjalankan langsung (tanpa menulis konfigurasi):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# disarankan untuk keamanan proses lokal
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## Memilih agen

ACP tidak memilih agen secara langsung. Ia melakukan routing berdasarkan session key Gateway.

Gunakan session key dengan cakupan agen untuk menargetkan agen tertentu:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Setiap sesi ACP dipetakan ke satu session key Gateway. Satu agen dapat memiliki banyak
sesi; ACP default-nya menggunakan sesi `acp:<uuid>` yang terisolasi kecuali Anda menimpa
key atau labelnya.

`mcpServers` per sesi tidak didukung dalam mode bridge. Jika klien ACP
mengirimkannya selama `newSession` atau `loadSession`, bridge mengembalikan
error yang jelas alih-alih mengabaikannya secara diam-diam.

Jika Anda ingin sesi berbasis ACPX melihat tool Plugin OpenClaw atau tool bawaan tertentu
seperti `cron`, aktifkan bridge MCP ACPX sisi Gateway sebagai gantinya
alih-alih mencoba meneruskan `mcpServers` per sesi. Lihat
[ACP Agents](/id/tools/acp-agents-setup#plugin-tools-mcp-bridge) dan
[bridge MCP tool OpenClaw](/id/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## Gunakan dari `acpx` (Codex, Claude, klien ACP lainnya)

Jika Anda ingin agen coding seperti Codex atau Claude Code berbicara dengan bot
OpenClaw Anda melalui ACP, gunakan `acpx` dengan target `openclaw` bawaannya.

Alur tipikal:

1. Jalankan Gateway dan pastikan bridge ACP dapat menjangkaunya.
2. Arahkan `acpx openclaw` ke `openclaw acp`.
3. Targetkan session key OpenClaw yang ingin digunakan agen coding.

Contoh:

```bash
# Permintaan sekali jalan ke sesi ACP OpenClaw default Anda
acpx openclaw exec "Summarize the active OpenClaw session state."

# Sesi bernama persisten untuk giliran lanjutan
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

Jika Anda ingin `acpx openclaw` selalu menargetkan Gateway dan session key tertentu,
override perintah agen `openclaw` di `~/.acpx/config.json`:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

Untuk checkout OpenClaw lokal berbasis repo, gunakan entrypoint CLI langsung alih-alih
dev runner agar stream ACP tetap bersih. Contohnya:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

Ini adalah cara termudah agar Codex, Claude Code, atau klien yang memahami ACP lainnya
dapat menarik informasi kontekstual dari agen OpenClaw tanpa mengikis terminal.

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

Di Zed, buka panel Agent dan pilih “OpenClaw ACP” untuk memulai thread.

## Pemetaan sesi

Secara default, sesi ACP mendapatkan session key Gateway yang terisolasi dengan prefiks `acp:`.
Untuk menggunakan kembali sesi yang sudah dikenal, berikan session key atau label:

- `--session <key>`: gunakan session key Gateway tertentu.
- `--session-label <label>`: resolve sesi yang ada berdasarkan label.
- `--reset-session`: buat session id baru untuk key tersebut (key sama, transkrip baru).

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

Pelajari lebih lanjut tentang session key di [/concepts/session](/id/concepts/session).

## Opsi

- `--url <url>`: URL WebSocket Gateway (default ke gateway.remote.url jika dikonfigurasi).
- `--token <token>`: token autentikasi Gateway.
- `--token-file <path>`: baca token autentikasi Gateway dari file.
- `--password <password>`: kata sandi autentikasi Gateway.
- `--password-file <path>`: baca kata sandi autentikasi Gateway dari file.
- `--session <key>`: session key default.
- `--session-label <label>`: label sesi default untuk di-resolve.
- `--require-existing`: gagal jika session key/label tidak ada.
- `--reset-session`: reset session key sebelum penggunaan pertama.
- `--no-prefix-cwd`: jangan tambahkan prefiks direktori kerja ke prompt.
- `--provenance <off|meta|meta+receipt>`: sertakan metadata atau receipt provenance ACP.
- `--verbose, -v`: logging verbose ke stderr.

Catatan keamanan:

- `--token` dan `--password` dapat terlihat di daftar proses lokal pada beberapa sistem.
- Sebaiknya gunakan `--token-file`/`--password-file` atau env var (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- Resolusi autentikasi Gateway mengikuti kontrak bersama yang digunakan klien Gateway lain:
  - mode lokal: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> fallback `gateway.remote.*` hanya saat `gateway.auth.*` tidak disetel (SecretRef lokal yang dikonfigurasi tetapi tidak dapat di-resolve akan gagal secara fail-closed)
  - mode remote: `gateway.remote.*` dengan fallback env/konfigurasi sesuai aturan prioritas remote
  - `--url` aman untuk override dan tidak menggunakan ulang kredensial konfigurasi/env implisit; berikan `--token`/`--password` eksplisit (atau varian file)
- Proses child backend runtime ACP menerima `OPENCLAW_SHELL=acp`, yang dapat digunakan untuk aturan shell/profile khusus konteks.
- `openclaw acp client` menyetel `OPENCLAW_SHELL=acp-client` pada proses bridge yang diluncurkan.

### Opsi `acp client`

- `--cwd <dir>`: direktori kerja untuk sesi ACP.
- `--server <command>`: perintah server ACP (default: `openclaw`).
- `--server-args <args...>`: argumen tambahan yang diteruskan ke server ACP.
- `--server-verbose`: aktifkan logging verbose pada server ACP.
- `--verbose, -v`: logging klien verbose.

## Terkait

- [Referensi CLI](/id/cli)
- [ACP agents](/id/tools/acp-agents)
