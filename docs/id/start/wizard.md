---
read_when:
    - Menjalankan atau mengonfigurasi orientasi awal CLI
    - Menyiapkan mesin baru
sidebarTitle: 'Onboarding: CLI'
summary: 'Orientasi CLI: penyiapan terpandu untuk Gateway, ruang kerja, saluran, dan Skills'
title: Orientasi (CLI)
x-i18n:
    generated_at: "2026-04-30T10:13:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9e9ee3af82ab9f4a1af5d20e3680eb932a9428cb914bbc08c9a2bf83c94ec158
    source_path: start/wizard.md
    workflow: 16
---

Onboarding CLI adalah cara yang **direkomendasikan** untuk menyiapkan OpenClaw di macOS,
Linux, atau Windows (melalui WSL2; sangat direkomendasikan).
Ini mengonfigurasi Gateway lokal atau koneksi Gateway jarak jauh, plus kanal, skills,
dan default workspace dalam satu alur terpandu.

```bash
openclaw onboard
```

<Info>
Chat pertama tercepat: buka Control UI (tidak perlu penyiapan kanal). Jalankan
`openclaw dashboard` dan chat di browser. Dokumentasi: [Dashboard](/id/web/dashboard).
</Info>

Untuk mengonfigurasi ulang nanti:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` tidak berarti mode non-interaktif. Untuk skrip, gunakan `--non-interactive`.
</Note>

<Tip>
Onboarding CLI mencakup langkah pencarian web tempat Anda dapat memilih penyedia
seperti Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search,
Ollama Web Search, Perplexity, SearXNG, atau Tavily. Beberapa penyedia memerlukan
kunci API, sementara yang lain tidak memerlukan kunci. Anda juga dapat mengonfigurasi ini nanti dengan
`openclaw configure --section web`. Dokumentasi: [Alat web](/id/tools/web).
</Tip>

## QuickStart vs Lanjutan

Onboarding dimulai dengan **QuickStart** (default) vs **Lanjutan** (kontrol penuh).

<Tabs>
  <Tab title="QuickStart (defaults)">
    - Gateway lokal (loopback)
    - Default workspace (atau workspace yang ada)
    - Port Gateway **18789**
    - Auth Gateway **Token** (dibuat otomatis, bahkan pada loopback)
    - Default kebijakan alat untuk penyiapan lokal baru: `tools.profile: "coding"` (profil eksplisit yang sudah ada dipertahankan)
    - Default isolasi DM: onboarding lokal menulis `session.dmScope: "per-channel-peer"` saat belum ditetapkan. Detail: [Referensi Penyiapan CLI](/id/start/wizard-cli-reference#outputs-and-internals)
    - Eksposur Tailscale **Nonaktif**
    - DM Telegram + WhatsApp default ke **allowlist** (Anda akan diminta memasukkan nomor telepon)

  </Tab>
  <Tab title="Advanced (full control)">
    - Mengekspos setiap langkah (mode, workspace, Gateway, kanal, daemon, skills).

  </Tab>
</Tabs>

## Yang dikonfigurasi oleh onboarding

**Mode lokal (default)** memandu Anda melalui langkah-langkah berikut:

1. **Model/Auth** — pilih penyedia/alur auth apa pun yang didukung (kunci API, OAuth, atau auth manual khusus penyedia), termasuk Custom Provider
   (kompatibel OpenAI, kompatibel Anthropic, atau deteksi otomatis Unknown). Pilih model default.
   Catatan keamanan: jika agen ini akan menjalankan alat atau memproses konten webhook/hooks, pilih model generasi terbaru terkuat yang tersedia dan jaga kebijakan alat tetap ketat. Tingkatan yang lebih lemah/lama lebih mudah terkena prompt injection.
   Untuk eksekusi non-interaktif, `--secret-input-mode ref` menyimpan ref berbasis env dalam profil auth alih-alih nilai kunci API teks polos.
   Dalam mode non-interaktif `ref`, env var penyedia harus ditetapkan; meneruskan flag kunci inline tanpa env var tersebut akan gagal cepat.
   Dalam eksekusi interaktif, memilih mode referensi rahasia memungkinkan Anda menunjuk ke variabel lingkungan atau ref penyedia yang dikonfigurasi (`file` atau `exec`), dengan validasi preflight cepat sebelum menyimpan.
   Untuk Anthropic, onboarding/configure interaktif menawarkan **Anthropic Claude CLI** sebagai jalur lokal yang disukai dan **Anthropic API key** sebagai jalur produksi yang direkomendasikan. setup-token Anthropic juga tetap tersedia sebagai jalur auth token yang didukung.
2. **Workspace** — Lokasi untuk file agen (default `~/.openclaw/workspace`). Menyemai file bootstrap.
3. **Gateway** — Port, alamat bind, mode auth, eksposur Tailscale.
   Dalam mode token interaktif, pilih penyimpanan token teks polos default atau pilih SecretRef.
   Jalur SecretRef token non-interaktif: `--gateway-token-ref-env <ENV_VAR>`.
4. **Kanal** — kanal chat bawaan dan bundled seperti BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp, dan lainnya.
5. **Daemon** — Menginstal LaunchAgent (macOS), unit pengguna systemd (Linux/WSL2), atau Windows Scheduled Task native dengan fallback folder Startup per pengguna.
   Jika auth token memerlukan token dan `gateway.auth.token` dikelola SecretRef, instalasi daemon memvalidasinya tetapi tidak menyimpan token yang terselesaikan ke metadata lingkungan layanan supervisor.
   Jika auth token memerlukan token dan SecretRef token yang dikonfigurasi belum terselesaikan, instalasi daemon diblokir dengan panduan yang dapat ditindaklanjuti.
   Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi dan `gateway.auth.mode` belum ditetapkan, instalasi daemon diblokir sampai mode ditetapkan secara eksplisit.
6. **Pemeriksaan kesehatan** — Memulai Gateway dan memverifikasi bahwa Gateway berjalan.
7. **Skills** — Menginstal skills yang direkomendasikan dan dependensi opsional.

<Note>
Menjalankan ulang onboarding **tidak** menghapus apa pun kecuali Anda secara eksplisit memilih **Reset** (atau meneruskan `--reset`).
CLI `--reset` default ke konfigurasi, kredensial, dan sesi; gunakan `--reset-scope full` untuk menyertakan workspace.
Jika konfigurasi tidak valid atau berisi kunci lama, onboarding meminta Anda menjalankan `openclaw doctor` terlebih dahulu.
</Note>

**Mode jarak jauh** hanya mengonfigurasi klien lokal untuk terhubung ke Gateway di tempat lain.
Mode ini **tidak** menginstal atau mengubah apa pun pada host jarak jauh.

## Tambahkan agen lain

Gunakan `openclaw agents add <name>` untuk membuat agen terpisah dengan workspace,
sesi, dan profil auth miliknya sendiri. Menjalankan tanpa `--workspace` meluncurkan onboarding.

Yang ditetapkan:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Catatan:

- Workspace default mengikuti `~/.openclaw/workspace-<agentId>`.
- Tambahkan `bindings` untuk merutekan pesan masuk (onboarding dapat melakukan ini).
- Flag non-interaktif: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Referensi lengkap

Untuk uraian langkah demi langkah dan output konfigurasi yang detail, lihat
[Referensi Penyiapan CLI](/id/start/wizard-cli-reference).
Untuk contoh non-interaktif, lihat [Otomasi CLI](/id/start/wizard-cli-automation).
Untuk referensi teknis yang lebih mendalam, termasuk detail RPC, lihat
[Referensi Onboarding](/id/reference/wizard).

## Dokumentasi terkait

- Referensi perintah CLI: [`openclaw onboard`](/id/cli/onboard)
- Ikhtisar onboarding: [Ikhtisar Onboarding](/id/start/onboarding-overview)
- Onboarding aplikasi macOS: [Onboarding](/id/start/onboarding)
- Ritual pertama kali agen berjalan: [Bootstrap Agen](/id/start/bootstrapping)
