---
read_when:
    - Menjalankan atau mengonfigurasi onboarding CLI
    - Menyiapkan mesin baru
sidebarTitle: 'Onboarding: CLI'
summary: 'Onboarding CLI: penyiapan terpandu untuk Gateway, workspace, channel, dan Skills'
title: Onboarding (CLI)
x-i18n:
    generated_at: "2026-04-24T09:28:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 919a4ab57f42f663e98e77c967e08e7ad7afbb193bd048ca1dedc884002d3801
    source_path: start/wizard.md
    workflow: 15
---

Onboarding CLI adalah cara **yang direkomendasikan** untuk menyiapkan OpenClaw di macOS,
Linux, atau Windows (melalui WSL2; sangat direkomendasikan).
Onboarding ini mengonfigurasi Gateway lokal atau koneksi Gateway remote, plus channel, Skills,
dan default workspace dalam satu alur terpandu.

```bash
openclaw onboard
```

<Info>
Chat pertama tercepat: buka UI Control (tanpa perlu setup channel). Jalankan
`openclaw dashboard` dan chat di browser. Dokumen: [Dashboard](/id/web/dashboard).
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
Onboarding CLI mencakup langkah pencarian web tempat Anda dapat memilih provider
seperti Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search,
Ollama Web Search, Perplexity, SearXNG, atau Tavily. Beberapa provider memerlukan
kunci API, sementara yang lain tidak. Anda juga dapat mengonfigurasikannya nanti dengan
`openclaw configure --section web`. Dokumen: [Web tools](/id/tools/web).
</Tip>

## QuickStart vs Advanced

Onboarding dimulai dengan **QuickStart** (default) vs **Advanced** (kontrol penuh).

<Tabs>
  <Tab title="QuickStart (default)">
    - Gateway lokal (loopback)
    - Workspace default (atau workspace yang sudah ada)
    - Port Gateway **18789**
    - Auth Gateway **Token** (dibuat otomatis, bahkan di loopback)
    - Kebijakan alat default untuk penyiapan lokal baru: `tools.profile: "coding"` (profil eksplisit yang sudah ada dipertahankan)
    - Default isolasi DM: onboarding lokal menulis `session.dmScope: "per-channel-peer"` saat belum disetel. Detail: [CLI Setup Reference](/id/start/wizard-cli-reference#outputs-and-internals)
    - Eksposur Tailscale **Off**
    - DM Telegram + WhatsApp default ke **allowlist** (Anda akan diminta memasukkan nomor telepon)

  </Tab>
  <Tab title="Advanced (kontrol penuh)">
    - Mengekspos setiap langkah (mode, workspace, gateway, channels, daemon, skills).

  </Tab>
</Tabs>

## Apa yang dikonfigurasi onboarding

**Mode lokal (default)** memandu Anda melalui langkah-langkah berikut:

1. **Model/Auth** — pilih alur provider/auth apa pun yang didukung (kunci API, OAuth, atau auth manual khusus provider), termasuk Custom Provider
   (kompatibel OpenAI, kompatibel Anthropic, atau Unknown auto-detect). Pilih model default.
   Catatan keamanan: jika agen ini akan menjalankan alat atau memproses konten webhook/hooks, pilih model generasi terbaru terkuat yang tersedia dan pertahankan kebijakan alat tetap ketat. Tier yang lebih lemah/lebih lama lebih mudah terkena prompt injection.
   Untuk run non-interaktif, `--secret-input-mode ref` menyimpan ref berbasis env dalam profil auth alih-alih nilai kunci API plaintext.
   Dalam mode `ref` non-interaktif, var env provider harus disetel; memberikan flag kunci inline tanpa var env tersebut akan gagal cepat.
   Dalam run interaktif, memilih mode referensi secret memungkinkan Anda menunjuk ke variabel environment atau provider ref yang dikonfigurasi (`file` atau `exec`), dengan validasi preflight cepat sebelum menyimpan.
   Untuk Anthropic, onboarding/configure interaktif menawarkan **Anthropic Claude CLI** sebagai jalur lokal yang disukai dan **Anthropic API key** sebagai jalur produksi yang direkomendasikan. Token setup Anthropic juga tetap tersedia sebagai jalur auth token yang didukung.
2. **Workspace** — lokasi untuk file agen (default `~/.openclaw/workspace`). Melakukan seed file bootstrap.
3. **Gateway** — port, alamat bind, mode auth, eksposur Tailscale.
   Dalam mode token interaktif, pilih penyimpanan token plaintext default atau pilih SecretRef.
   Jalur SecretRef token non-interaktif: `--gateway-token-ref-env <ENV_VAR>`.
4. **Channels** — channel chat bawaan dan bundled seperti BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp, dan lainnya.
5. **Daemon** — memasang LaunchAgent (macOS), unit systemd user (Linux/WSL2), atau Windows Scheduled Task native dengan fallback folder Startup per-pengguna.
   Jika auth token memerlukan token dan `gateway.auth.token` dikelola SecretRef, instalasi daemon memvalidasinya tetapi tidak mempersistenkan token yang diresolusikan ke metadata environment layanan supervisor.
   Jika auth token memerlukan token dan SecretRef token yang dikonfigurasi tidak teresolusikan, instalasi daemon diblokir dengan panduan yang dapat ditindaklanjuti.
   Jika `gateway.auth.token` dan `gateway.auth.password` keduanya dikonfigurasi dan `gateway.auth.mode` belum disetel, instalasi daemon diblokir sampai mode disetel secara eksplisit.
6. **Pemeriksaan kesehatan** — memulai Gateway dan memverifikasi Gateway berjalan.
7. **Skills** — memasang Skills yang direkomendasikan dan dependensi opsional.

<Note>
Menjalankan ulang onboarding **tidak** menghapus apa pun kecuali Anda secara eksplisit memilih **Reset** (atau memberikan `--reset`).
CLI `--reset` default ke config, kredensial, dan sesi; gunakan `--reset-scope full` untuk menyertakan workspace.
Jika config tidak valid atau berisi kunci legacy, onboarding meminta Anda menjalankan `openclaw doctor` terlebih dahulu.
</Note>

**Mode remote** hanya mengonfigurasi klien lokal agar terhubung ke Gateway di tempat lain.
Mode ini **tidak** memasang atau mengubah apa pun di host remote.

## Tambah agen lain

Gunakan `openclaw agents add <name>` untuk membuat agen terpisah dengan workspace,
sesi, dan profil auth sendiri. Menjalankan tanpa `--workspace` akan meluncurkan onboarding.

Yang disetel:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Catatan:

- Workspace default mengikuti `~/.openclaw/workspace-<agentId>`.
- Tambahkan `bindings` untuk merutekan pesan masuk (onboarding dapat melakukannya).
- Flag non-interaktif: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Referensi lengkap

Untuk uraian langkah demi langkah terperinci dan output config, lihat
[CLI Setup Reference](/id/start/wizard-cli-reference).
Untuk contoh non-interaktif, lihat [CLI Automation](/id/start/wizard-cli-automation).
Untuk referensi teknis yang lebih dalam, termasuk detail RPC, lihat
[Onboarding Reference](/id/reference/wizard).

## Dokumentasi terkait

- Referensi perintah CLI: [`openclaw onboard`](/id/cli/onboard)
- Ikhtisar onboarding: [Onboarding Overview](/id/start/onboarding-overview)
- Onboarding aplikasi macOS: [Onboarding](/id/start/onboarding)
- Ritual run pertama agen: [Agent Bootstrapping](/id/start/bootstrapping)
