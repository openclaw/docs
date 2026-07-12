---
read_when:
    - Menyiapkan integrasi IDE berbasis ACP
    - Men-debug perutean sesi ACP ke Gateway
summary: Jalankan jembatan ACP untuk integrasi IDE
title: ACP
x-i18n:
    generated_at: "2026-07-12T14:00:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: becdcfdd1cc62b206cc92e9b8248c79a2ff63cfc3779d8a124b9713e779ad33c
    source_path: cli/acp.md
    workflow: 16
---

Jalankan jembatan [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) yang berkomunikasi dengan Gateway OpenClaw.

`openclaw acp` menggunakan ACP melalui stdio untuk IDE dan meneruskan prompt ke Gateway melalui WebSocket, sambil mempertahankan pemetaan sesi ACP ke kunci sesi Gateway. Ini adalah jembatan ACP yang didukung Gateway, bukan runtime editor native ACP lengkap: fokusnya adalah perutean sesi, pengiriman prompt, dan pembaruan streaming.

Jika Anda ingin klien MCP eksternal berkomunikasi langsung dengan percakapan kanal OpenClaw alih-alih menghosting sesi harness ACP, gunakan [`openclaw mcp serve`](/id/cli/mcp).

## Yang bukan merupakan fungsi ini

`openclaw acp` berarti OpenClaw bertindak sebagai server ACP: IDE atau klien ACP terhubung ke OpenClaw, lalu OpenClaw meneruskan pekerjaan tersebut ke sesi Gateway.

Ini berbeda dari [Agen ACP](/id/tools/acp-agents), tempat OpenClaw menjalankan harness eksternal seperti Codex atau Claude Code melalui `acpx`.

Aturan singkat:

- editor/klien ingin berkomunikasi dengan OpenClaw melalui ACP: gunakan `openclaw acp`
- OpenClaw harus menjalankan Codex/Claude/Gemini sebagai harness ACP: gunakan `/acp spawn` dan [Agen ACP](/id/tools/acp-agents)

## Matriks kompatibilitas

| Area ACP                                                              | Status                | Catatan                                                                                                                                                                                                                                             |
| --------------------------------------------------------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `initialize`, `newSession`, `prompt`, `cancel`                        | Diimplementasikan     | Alur jembatan inti melalui stdio ke obrolan/pengiriman + pembatalan Gateway.                                                                                                                                                                        |
| `listSessions`, perintah garis miring                                 | Diimplementasikan     | Daftar sesi bekerja terhadap status sesi Gateway dengan paginasi kursor terbatas dan pemfilteran `cwd` ketika baris sesi Gateway memuat metadata ruang kerja; perintah diumumkan melalui `available_commands_update`.                                |
| Metadata silsilah sesi                                                | Diimplementasikan     | Daftar sesi dan snapshot informasi sesi menyertakan silsilah induk dan anak OpenClaw dalam `_meta` agar klien ACP dapat merender grafik subagen tanpa kanal samping Gateway privat.                                                                  |
| `resumeSession`, `closeSession`                                       | Diimplementasikan     | Pelanjutan mengikat ulang sesi ACP ke sesi Gateway yang ada tanpa memutar ulang riwayat. Penutupan membatalkan pekerjaan jembatan aktif, menyelesaikan prompt tertunda sebagai dibatalkan, dan melepaskan status sesi jembatan.                       |
| `loadSession`                                                         | Sebagian              | Mengikat ulang sesi ACP ke kunci sesi Gateway dan memutar ulang riwayat buku besar peristiwa ACP untuk sesi yang dibuat oleh jembatan. Sesi lama/tanpa buku besar beralih ke teks pengguna/asisten yang tersimpan.                                  |
| Konten prompt (`text`, `resource` tersemat, gambar)                   | Sebagian              | Teks/sumber daya diratakan menjadi masukan obrolan; gambar menjadi lampiran Gateway.                                                                                                                                                                |
| Mode sesi                                                             | Sebagian              | `session/set_mode` didukung; jembatan menyediakan kontrol sesi yang didukung Gateway untuk tingkat pemikiran, verbositas alat, penalaran, detail penggunaan, dan tindakan dengan hak lebih tinggi. Permukaan mode/konfigurasi native ACP yang lebih luas masih di luar cakupan. |
| Streaming pemikiran                                                   | Diimplementasikan     | Konten pemikiran model dialirkan sebagai pembaruan sesi `agent_thought_chunk`. Rencana sesi native ACP tidak dipancarkan.                                                                                                                           |
| Pembaruan informasi dan penggunaan sesi                               | Sebagian              | Jembatan memancarkan notifikasi `session_info_update` dan `usage_update` secara upaya terbaik dari snapshot sesi Gateway yang disimpan dalam cache. Penggunaan bersifat perkiraan dan hanya dikirim ketika total token Gateway ditandai mutakhir. |
| Streaming alat                                                        | Sebagian              | Peristiwa `tool_call`/`tool_call_update` menyertakan I/O mentah, konten teks, dan lokasi berkas secara upaya terbaik ketika argumen/hasil alat Gateway menyediakannya. Terminal tersemat dan keluaran native diff yang lebih kaya tidak disediakan. |
| Persetujuan eksekusi                                                  | Sebagian              | Prompt persetujuan eksekusi Gateway selama giliran prompt ACP aktif diteruskan ke klien ACP melalui `session/request_permission`.                                                                                                                   |
| Server MCP per sesi (`mcpServers`)                                    | Tidak didukung        | Mode jembatan menolak permintaan server MCP per sesi. Konfigurasikan MCP pada Gateway atau agen OpenClaw sebagai gantinya.                                                                                                                          |
| Metode sistem berkas klien (`fs/read_text_file`, `fs/write_text_file`) | Tidak didukung       | Jembatan tidak memanggil metode sistem berkas klien ACP.                                                                                                                                                                                            |
| Metode terminal klien (`terminal/*`)                                  | Tidak didukung        | Jembatan tidak membuat terminal klien ACP atau mengalirkan ID terminal melalui panggilan alat.                                                                                                                                                      |

## Keterbatasan yang diketahui

- `loadSession` memutar ulang riwayat lengkap buku besar peristiwa ACP hanya untuk sesi yang dibuat oleh jembatan. Sesi lama/tanpa buku besar menggunakan fallback transkrip dan tidak merekonstruksi panggilan alat historis atau pemberitahuan sistem.
- Jika beberapa klien ACP berbagi kunci sesi Gateway yang sama, perutean peristiwa dan pembatalan dilakukan secara upaya terbaik, bukan diisolasi secara ketat per klien. Gunakan sesi `acp-bridge:<uuid>` terisolasi bawaan ketika Anda memerlukan giliran lokal editor yang bersih.
- Status penghentian Gateway diterjemahkan menjadi alasan penghentian ACP, tetapi pemetaan tersebut tidak sekomprehensif runtime native ACP sepenuhnya.
- Kontrol sesi menampilkan subset terfokus dari pengaturan Gateway: tingkat pemikiran, verbositas alat, penalaran, detail penggunaan, dan tindakan dengan hak lebih tinggi. Pemilihan model dan kontrol host eksekusi tidak disediakan sebagai opsi konfigurasi ACP.
- `session_info_update` dan `usage_update` berasal dari snapshot sesi Gateway, bukan penghitungan runtime native ACP langsung. Penggunaan bersifat perkiraan, tidak memuat data biaya, dan hanya dipancarkan ketika Gateway menandai data total token sebagai mutakhir.
- Data pemantauan alat bersifat upaya terbaik: jembatan menampilkan jalur berkas yang muncul dalam argumen/hasil alat yang dikenal, tetapi tidak memancarkan terminal ACP atau diff berkas terstruktur.
- Penerusan persetujuan eksekusi dibatasi pada giliran prompt ACP aktif; persetujuan dari sesi Gateway lain diabaikan.

## Penggunaan

```bash
openclaw acp

# Gateway jarak jauh
openclaw acp --url wss://gateway-host:18789 --token <token>

# Gateway jarak jauh (token dari berkas)
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Lampirkan ke kunci sesi yang ada
openclaw acp --session agent:main:main

# Lampirkan berdasarkan label (harus sudah ada)
openclaw acp --session-label "support inbox"

# Atur ulang kunci sesi sebelum prompt pertama
openclaw acp --session agent:main:main --reset-session
```

## Klien ACP (debug)

Gunakan klien ACP bawaan untuk memeriksa kelayakan jembatan tanpa IDE. Klien ini menjalankan jembatan ACP dan memungkinkan Anda mengetik prompt secara interaktif.

```bash
openclaw acp client

# Arahkan jembatan yang dijalankan ke Gateway jarak jauh
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Timpa perintah server (bawaan: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Model izin (mode debug klien):

- Persetujuan otomatis didasarkan pada daftar izin dan hanya berlaku untuk ID alat inti tepercaya.
- Persetujuan otomatis `read` dibatasi pada direktori kerja saat ini (`--cwd` jika ditetapkan).
- ACP hanya menyetujui otomatis kelas baca-saja yang terbatas: panggilan `read` dengan cakupan di bawah cwd aktif, serta alat pencarian baca-saja (`search`, `web_search`, `memory_search`). Alat yang tidak dikenal/bukan inti, pembacaan di luar cakupan, alat yang dapat mengeksekusi, alat bidang kontrol, alat yang mengubah data, dan alur interaktif selalu memerlukan persetujuan prompt eksplisit.
- `toolCall.kind` yang disediakan server diperlakukan sebagai metadata tidak tepercaya, bukan sumber otorisasi.
- Kebijakan jembatan ACP ini terpisah dari izin harness ACPX. Jika Anda menjalankan OpenClaw melalui backend `acpx`, `plugins.entries.acpx.config.permissionMode=approve-all` adalah sakelar darurat "yolo" untuk sesi harness tersebut.

## Pengujian cepat protokol

Untuk debug tingkat protokol, jalankan Gateway dengan status terisolasi dan kendalikan `openclaw acp` melalui stdio menggunakan klien JSON-RPC ACP. Cakup `initialize`, `session/new`, `session/list` dengan `cwd` absolut, `session/resume`, `session/close`, penutupan duplikat, dan pelanjutan yang tidak ditemukan.

Bukti harus mencakup kapabilitas siklus hidup yang diumumkan, baris sesi yang didukung Gateway, notifikasi pembaruan, dan log `sessions.list` Gateway:

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

Hindari menggunakan `openclaw gateway call sessions.list` sebagai satu-satunya bukti ACP. Jalur CLI tersebut dapat meminta peningkatan cakupan operator dengan token baru; kebenaran jembatan ACP dibuktikan oleh bingkai stdio ACP beserta log `sessions.list` Gateway.

## Cara menggunakan ini

Gunakan ACP ketika IDE (atau klien lain) menggunakan Agent Client Protocol dan Anda ingin IDE tersebut mengendalikan sesi Gateway OpenClaw.

1. Pastikan Gateway sedang berjalan (lokal atau jarak jauh).
2. Konfigurasikan target Gateway (konfigurasi atau flag).
3. Arahkan IDE Anda untuk menjalankan `openclaw acp` melalui stdio.

Contoh konfigurasi (dipertahankan):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

Contoh eksekusi langsung (tanpa menulis konfigurasi):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# lebih disarankan demi keamanan proses lokal
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## Memilih agen

ACP tidak memilih agen secara langsung. ACP merutekan berdasarkan kunci sesi Gateway. Gunakan kunci sesi dengan cakupan agen untuk menargetkan agen tertentu:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Setiap sesi ACP dipetakan ke satu kunci sesi Gateway. Satu agen dapat memiliki banyak sesi; ACP menggunakan sesi `acp-bridge:<uuid>` terisolasi secara bawaan, kecuali Anda menimpa kunci atau labelnya.

`mcpServers` per sesi tidak didukung dalam mode jembatan. Jika klien ACP mengirimkannya selama `newSession` atau `loadSession`, jembatan akan mengembalikan galat yang jelas alih-alih mengabaikannya secara diam-diam.

Jika Anda ingin sesi yang didukung ACPX dapat melihat alat Plugin OpenClaw atau alat bawaan tertentu seperti `cron`, aktifkan jembatan MCP ACPX di sisi Gateway alih-alih mencoba meneruskan `mcpServers` per sesi. Lihat [Agen ACP](/id/tools/acp-agents-setup#plugin-tools-mcp-bridge) dan [Jembatan MCP alat OpenClaw](/id/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## Penggunaan dari `acpx` (Codex, Claude, dan klien ACP lainnya)

Jika Anda ingin agen pemrograman seperti Codex atau Claude Code berkomunikasi dengan bot OpenClaw Anda melalui ACP, gunakan `acpx` dengan target bawaan `openclaw`.

Alur umum:

1. Jalankan Gateway dan pastikan jembatan ACP dapat menjangkaunya.
2. Arahkan `acpx openclaw` ke `openclaw acp`.
3. Tentukan kunci sesi OpenClaw yang ingin digunakan oleh agen pemrograman.

Contoh:

```bash
# One-shot request into your default OpenClaw ACP session
acpx openclaw exec "Summarize the active OpenClaw session state."

# Persistent named session for follow-up turns
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
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

Untuk salinan kerja OpenClaw lokal di repositori, gunakan titik masuk CLI langsung alih-alih peluncur pengembangan agar aliran ACP tetap bersih:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

Ini adalah cara termudah agar Codex, Claude Code, atau klien lain yang mendukung ACP dapat mengambil informasi kontekstual dari agen OpenClaw tanpa mengorek terminal.

## Penyiapan editor Zed

Tambahkan agen ACP khusus di `~/.config/zed/settings.json` (atau gunakan antarmuka Settings milik Zed):

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

Di Zed, buka panel Agent dan pilih "OpenClaw ACP" untuk memulai utas.

## Pemetaan sesi

Secara default, sesi jembatan ACP mendapatkan kunci sesi Gateway terisolasi dengan awalan `acp-bridge:`. Sesi jembatan model normal ini bersifat sintetis dan sekali pakai: sesi tersebut dapat dipangkas jika entrinya kedaluwarsa dan tidak diperlakukan sebagai media percakapan manusia yang dilindungi. Untuk menggunakan kembali sesi yang telah diketahui, teruskan kunci atau label sesi:

- `--session <key>`: gunakan kunci sesi Gateway tertentu.
- `--session-label <label>`: temukan sesi yang ada berdasarkan label.
- `--reset-session`: buat ID sesi baru untuk kunci tersebut (kunci sama, transkrip baru).

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

- `--url <url>`: URL WebSocket Gateway (nilai default-nya adalah `gateway.remote.url` jika dikonfigurasi).
- `--token <token>`: token autentikasi Gateway.
- `--token-file <path>`: baca token autentikasi Gateway dari berkas.
- `--password <password>`: kata sandi autentikasi Gateway.
- `--password-file <path>`: baca kata sandi autentikasi Gateway dari berkas.
- `--session <key>`: kunci sesi default.
- `--session-label <label>`: label sesi default yang akan ditemukan.
- `--require-existing`: gagal jika kunci/label sesi tidak ada.
- `--reset-session`: atur ulang kunci sesi sebelum penggunaan pertama.
- `--no-prefix-cwd`: jangan tambahkan direktori kerja sebagai awalan pada perintah.
- `--provenance <off|meta|meta+receipt>`: sertakan metadata atau tanda terima asal-usul ACP.
- `--verbose, -v`: pencatatan log terperinci ke stderr.

Catatan keamanan:

- `--token` dan `--password` dapat terlihat dalam daftar proses lokal pada beberapa sistem. Utamakan `--token-file`/`--password-file` atau variabel lingkungan (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- Resolusi autentikasi Gateway mengikuti kontrak bersama yang digunakan oleh klien Gateway lainnya:
  - mode lokal: env (`OPENCLAW_GATEWAY_*`), kemudian `gateway.auth.*`, dengan beralih ke `gateway.remote.*` hanya jika `gateway.auth.*` belum ditetapkan (`SecretRef` lokal yang telah dikonfigurasi tetapi tidak dapat diresolusi akan gagal secara tertutup alih-alih beralih secara diam-diam)
  - mode jarak jauh: `gateway.remote.*` dengan fallback env/konfigurasi sesuai aturan prioritas jarak jauh
  - `--url` aman untuk penimpaan dan tidak menggunakan kembali kredensial konfigurasi/env implisit; teruskan `--token`/`--password` secara eksplisit (atau varian berkasnya)

### Opsi `acp client`

- `--cwd <dir>`: direktori kerja untuk sesi ACP.
- `--server <command>`: perintah server ACP (default: `openclaw`).
- `--server-args <args...>`: argumen tambahan yang diteruskan ke server ACP.
- `--server-verbose`: aktifkan pencatatan log terperinci pada server ACP.
- `--verbose, -v`: pencatatan log klien secara terperinci.
- `openclaw acp client` menetapkan `OPENCLAW_SHELL=acp-client` pada proses jembatan yang dijalankan, yang dapat digunakan untuk aturan shell/profil khusus konteks.

## Terkait

- [Referensi CLI](/id/cli)
- [Agen ACP](/id/tools/acp-agents)
