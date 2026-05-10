---
read_when:
    - Menjalankan atau mengonfigurasi penyiapan awal CLI
    - Menyiapkan mesin baru
sidebarTitle: 'Onboarding: CLI'
summary: 'Penyiapan awal CLI: penyiapan terpandu untuk Gateway, ruang kerja, saluran, dan Skills'
title: Orientasi (CLI)
x-i18n:
    generated_at: "2026-05-10T19:53:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6d8093f2375240f7a784b22c97c824a49b4d39b9217c0d1c0a1490bb15160700
    source_path: start/wizard.md
    workflow: 16
---

CLI onboarding adalah cara yang **direkomendasikan** untuk menyiapkan OpenClaw di macOS,
Linux, atau Windows (melalui WSL2; sangat direkomendasikan).
Ini mengonfigurasi Gateway lokal atau koneksi Gateway jarak jauh, plus channel, skills,
dan default workspace dalam satu alur terpandu.

```bash
openclaw onboard
```

<Info>
Chat pertama tercepat: buka Control UI (tidak perlu penyiapan channel). Jalankan
`openclaw dashboard` dan chat di browser. Docs: [Dashboard](/id/web/dashboard).
</Info>

Untuk mengonfigurasi ulang nanti:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` tidak menyiratkan mode non-interaktif. Untuk skrip, gunakan `--non-interactive`.
</Note>

<Tip>
CLI onboarding menyertakan langkah pencarian web tempat Anda dapat memilih penyedia
seperti Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search,
Ollama Web Search, Perplexity, SearXNG, atau Tavily. Beberapa penyedia memerlukan
API key, sementara yang lain bebas key. Anda juga dapat mengonfigurasi ini nanti dengan
`openclaw configure --section web`. Docs: [Web tools](/id/tools/web).
</Tip>

## Mulai Cepat vs Lanjutan

Onboarding dimulai dengan **Mulai Cepat** (default) vs **Lanjutan** (kontrol penuh).

<Tabs>
  <Tab title="Mulai Cepat (default)">
    - Gateway lokal (loopback)
    - Default workspace (atau workspace yang sudah ada)
    - Port Gateway **18789**
    - Auth Gateway **Token** (dibuat otomatis, bahkan pada loopback)
    - Default kebijakan tool untuk penyiapan lokal baru: `tools.profile: "coding"` (profil eksplisit yang sudah ada dipertahankan)
    - Default isolasi DM: onboarding lokal menulis `session.dmScope: "per-channel-peer"` saat belum diatur. Detail: [Referensi Penyiapan CLI](/id/start/wizard-cli-reference#outputs-and-internals)
    - Eksposur Tailscale **Mati**
    - DM Telegram + WhatsApp secara default menggunakan **daftar izin** (Anda akan diminta memasukkan nomor telepon Anda)

  </Tab>
  <Tab title="Lanjutan (kontrol penuh)">
    - Menampilkan setiap langkah (mode, workspace, gateway, channel, daemon, skills).

  </Tab>
</Tabs>

## Apa yang dikonfigurasi onboarding

**Mode lokal (default)** memandu Anda melalui langkah-langkah ini:

1. **Model/Auth** — pilih penyedia/alur auth apa pun yang didukung (API key, OAuth, atau auth manual khusus penyedia), termasuk Penyedia Kustom
   (kompatibel OpenAI, kompatibel Anthropic, atau deteksi otomatis Tidak Diketahui). Pilih model default.
   Catatan keamanan: jika agent ini akan menjalankan tool atau memproses konten webhook/hook, pilih model generasi terbaru terkuat yang tersedia dan jaga kebijakan tool tetap ketat. Tingkatan yang lebih lemah/lama lebih mudah terkena prompt injection.
   Untuk eksekusi non-interaktif, `--secret-input-mode ref` menyimpan ref berbasis env dalam profil auth alih-alih nilai API key plaintext.
   Dalam mode `ref` non-interaktif, env var penyedia harus diatur; meneruskan flag key inline tanpa env var tersebut akan gagal cepat.
   Dalam eksekusi interaktif, memilih mode referensi secret memungkinkan Anda menunjuk ke variabel lingkungan atau ref penyedia yang dikonfigurasi (`file` atau `exec`), dengan validasi preflight cepat sebelum menyimpan.
   Untuk Anthropic, onboarding/configure interaktif menawarkan **Anthropic Claude CLI** sebagai jalur lokal yang disukai dan **API key Anthropic** sebagai jalur produksi yang direkomendasikan. setup-token Anthropic juga tetap tersedia sebagai jalur auth token yang didukung.
2. **Workspace** — Lokasi untuk file agent (default `~/.openclaw/workspace`). Menyemai file bootstrap.
3. **Gateway** — Port, alamat bind, mode auth, eksposur Tailscale.
   Dalam mode token interaktif, pilih penyimpanan token plaintext default atau ikut menggunakan SecretRef.
   Jalur SecretRef token non-interaktif: `--gateway-token-ref-env <ENV_VAR>`.
4. **Channel** — channel chat bawaan dan bundled seperti iMessage, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp, dan lainnya.
5. **Daemon** — Menginstal LaunchAgent (macOS), unit pengguna systemd (Linux/WSL2), atau Windows Scheduled Task native dengan fallback folder Startup per pengguna.
   Jika auth token memerlukan token dan `gateway.auth.token` dikelola SecretRef, instalasi daemon memvalidasinya tetapi tidak mempertahankan token yang di-resolve ke dalam metadata lingkungan layanan supervisor.
   Jika auth token memerlukan token dan SecretRef token yang dikonfigurasi tidak ter-resolve, instalasi daemon diblokir dengan panduan yang dapat ditindaklanjuti.
   Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi dan `gateway.auth.mode` belum diatur, instalasi daemon diblokir hingga mode diatur secara eksplisit.
6. **Pemeriksaan kesehatan** — Memulai Gateway dan memverifikasi bahwa itu berjalan.
7. **Skills** — Menginstal skills yang direkomendasikan dan dependensi opsional.

<Note>
Menjalankan ulang onboarding **tidak** menghapus apa pun kecuali Anda secara eksplisit memilih **Reset** (atau meneruskan `--reset`).
CLI `--reset` secara default mencakup konfigurasi, kredensial, dan sesi; gunakan `--reset-scope full` untuk menyertakan workspace.
Jika konfigurasi tidak valid atau berisi key lama, onboarding meminta Anda menjalankan `openclaw doctor` terlebih dahulu.
</Note>

**Mode jarak jauh** hanya mengonfigurasi klien lokal untuk terhubung ke Gateway di tempat lain.
Mode ini **tidak** menginstal atau mengubah apa pun pada host jarak jauh.

## Tambahkan agent lain

Gunakan `openclaw agents add <name>` untuk membuat agent terpisah dengan workspace,
sesi, dan profil auth miliknya sendiri. Menjalankan tanpa `--workspace` meluncurkan onboarding.

Yang diaturnya:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Catatan:

- Workspace default mengikuti `~/.openclaw/workspace-<agentId>`.
- Tambahkan `bindings` untuk merutekan pesan masuk (onboarding dapat melakukan ini).
- Flag non-interaktif: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Referensi lengkap

Untuk rincian langkah demi langkah dan output konfigurasi yang mendetail, lihat
[Referensi Penyiapan CLI](/id/start/wizard-cli-reference).
Untuk contoh non-interaktif, lihat [Automasi CLI](/id/start/wizard-cli-automation).
Untuk referensi teknis yang lebih mendalam, termasuk detail RPC, lihat
[Referensi Onboarding](/id/reference/wizard).

## Docs terkait

- Referensi perintah CLI: [`openclaw onboard`](/id/cli/onboard)
- Ikhtisar onboarding: [Ikhtisar Onboarding](/id/start/onboarding-overview)
- Onboarding aplikasi macOS: [Onboarding](/id/start/onboarding)
- Ritual pertama kali agent dijalankan: [Bootstrap Agent](/id/start/bootstrapping)
