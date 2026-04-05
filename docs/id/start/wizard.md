---
read_when:
    - Menjalankan atau mengonfigurasi onboarding CLI
    - Menyiapkan mesin baru
sidebarTitle: 'Onboarding: CLI'
summary: 'Onboarding CLI: penyiapan terpandu untuk gateway, workspace, channel, dan Skills'
title: Onboarding (CLI)
x-i18n:
    generated_at: "2026-04-05T14:06:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 81e33fb4f8be30e7c2c6e0024bf9bdcf48583ca58eaf5fff5afd37a1cd628523
    source_path: start/wizard.md
    workflow: 15
---

# Onboarding (CLI)

Onboarding CLI adalah cara **yang direkomendasikan** untuk menyiapkan OpenClaw di macOS,
Linux, atau Windows (melalui WSL2; sangat direkomendasikan).
Ini mengonfigurasi Gateway lokal atau koneksi Gateway jarak jauh, beserta channel, Skills,
dan default workspace dalam satu alur terpandu.

```bash
openclaw onboard
```

<Info>
Chat pertama tercepat: buka UI Kontrol (tidak perlu penyiapan channel). Jalankan
`openclaw dashboard` dan chat di browser. Dokumentasi: [Dashboard](/web/dashboard).
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
Onboarding CLI mencakup langkah pencarian web tempat Anda dapat memilih penyedia
seperti Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search,
Ollama Web Search, Perplexity, SearXNG, atau Tavily. Beberapa penyedia memerlukan
kunci API, sementara yang lain tidak. Anda juga dapat mengonfigurasinya nanti dengan
`openclaw configure --section web`. Dokumentasi: [Tool web](/tools/web).
</Tip>

## QuickStart vs Advanced

Onboarding dimulai dengan **QuickStart** (default) vs **Advanced** (kontrol penuh).

<Tabs>
  <Tab title="QuickStart (default)">
    - Gateway lokal (loopback)
    - Default workspace (atau workspace yang ada)
    - Port Gateway **18789**
    - Autentikasi Gateway **Token** (dibuat otomatis, bahkan pada loopback)
    - Default kebijakan tool untuk penyiapan lokal baru: `tools.profile: "coding"` (profil eksplisit yang sudah ada dipertahankan)
    - Default isolasi DM: onboarding lokal menulis `session.dmScope: "per-channel-peer"` saat belum disetel. Detail: [Referensi Penyiapan CLI](/start/wizard-cli-reference#outputs-and-internals)
    - Eksposur Tailscale **Nonaktif**
    - DM Telegram + WhatsApp default ke **allowlist** (Anda akan diminta nomor telepon Anda)
  </Tab>
  <Tab title="Advanced (kontrol penuh)">
    - Mengekspos setiap langkah (mode, workspace, gateway, channel, daemon, Skills).
  </Tab>
</Tabs>

## Apa yang dikonfigurasi onboarding

**Mode lokal (default)** memandu Anda melalui langkah-langkah berikut:

1. **Model/Auth** — pilih penyedia/alur autentikasi yang didukung (kunci API, OAuth, atau autentikasi manual khusus penyedia), termasuk Penyedia Kustom
   (kompatibel dengan OpenAI, kompatibel dengan Anthropic, atau deteksi otomatis Unknown). Pilih model default.
   Catatan keamanan: jika agen ini akan menjalankan tool atau memproses konten webhook/hooks, pilih model generasi terbaru terkuat yang tersedia dan pertahankan kebijakan tool tetap ketat. Tingkat yang lebih lemah/lebih lama lebih mudah terkena prompt injection.
   Untuk proses non-interaktif, `--secret-input-mode ref` menyimpan referensi berbasis env di profil autentikasi alih-alih nilai kunci API plaintext.
   Dalam mode `ref` non-interaktif, env var penyedia harus disetel; meneruskan flag kunci inline tanpa env var tersebut akan langsung gagal.
   Dalam proses interaktif, memilih mode referensi rahasia memungkinkan Anda menunjuk ke env var atau ref penyedia yang dikonfigurasi (`file` atau `exec`), dengan validasi preflight cepat sebelum menyimpan.
   Untuk Anthropic, onboarding/configure interaktif menawarkan **Anthropic Claude CLI** sebagai fallback lokal dan **Anthropic API key** sebagai jalur produksi yang direkomendasikan. Token penyiapan Anthropic juga kembali tersedia sebagai jalur OpenClaw legacy/manual, dengan ekspektasi penagihan **Extra Usage** khusus OpenClaw dari Anthropic.
2. **Workspace** — Lokasi untuk file agen (default `~/.openclaw/workspace`). Mengisi file bootstrap.
3. **Gateway** — Port, alamat bind, mode autentikasi, eksposur Tailscale.
   Dalam mode token interaktif, pilih penyimpanan token plaintext default atau gunakan SecretRef.
   Jalur SecretRef token non-interaktif: `--gateway-token-ref-env <ENV_VAR>`.
4. **Channels** — built-in dan bundled chat channels seperti BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp, dan lainnya.
5. **Daemon** — Menginstal LaunchAgent (macOS), unit pengguna systemd (Linux/WSL2), atau Scheduled Task Windows native dengan fallback folder Startup per pengguna.
   Jika autentikasi token memerlukan token dan `gateway.auth.token` dikelola SecretRef, instalasi daemon memvalidasinya tetapi tidak menyimpan token hasil resolusi ke metadata environment layanan supervisor.
   Jika autentikasi token memerlukan token dan SecretRef token yang dikonfigurasi tidak dapat diresolusikan, instalasi daemon diblokir dengan panduan yang dapat ditindaklanjuti.
   Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi dan `gateway.auth.mode` belum disetel, instalasi daemon diblokir sampai mode disetel secara eksplisit.
6. **Pemeriksaan kesehatan** — Memulai Gateway dan memverifikasi bahwa layanan berjalan.
7. **Skills** — Menginstal Skills yang direkomendasikan dan dependensi opsional.

<Note>
Menjalankan ulang onboarding **tidak** menghapus apa pun kecuali Anda secara eksplisit memilih **Reset** (atau meneruskan `--reset`).
CLI `--reset` default ke config, kredensial, dan sesi; gunakan `--reset-scope full` untuk menyertakan workspace.
Jika config tidak valid atau berisi kunci legacy, onboarding akan meminta Anda menjalankan `openclaw doctor` terlebih dahulu.
</Note>

**Mode jarak jauh** hanya mengonfigurasi klien lokal agar terhubung ke Gateway di tempat lain.
Ini **tidak** menginstal atau mengubah apa pun di host jarak jauh.

## Tambahkan agen lain

Gunakan `openclaw agents add <name>` untuk membuat agen terpisah dengan workspace,
sesi, dan profil autentikasinya sendiri. Menjalankan tanpa `--workspace` akan meluncurkan onboarding.

Yang disetel:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Catatan:

- Workspace default mengikuti `~/.openclaw/workspace-<agentId>`.
- Tambahkan `bindings` untuk merutekan pesan masuk (onboarding dapat melakukannya).
- Flag non-interaktif: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Referensi lengkap

Untuk rincian langkah demi langkah dan output config yang detail, lihat
[Referensi Penyiapan CLI](/start/wizard-cli-reference).
Untuk contoh non-interaktif, lihat [Otomasi CLI](/start/wizard-cli-automation).
Untuk referensi teknis yang lebih mendalam, termasuk detail RPC, lihat
[Referensi Onboarding](/reference/wizard).

## Dokumentasi terkait

- Referensi perintah CLI: [`openclaw onboard`](/cli/onboard)
- Gambaran umum onboarding: [Ikhtisar Onboarding](/start/onboarding-overview)
- Onboarding aplikasi macOS: [Onboarding](/start/onboarding)
- Ritual pertama kali dijalankan agen: [Bootstrap Agen](/start/bootstrapping)
