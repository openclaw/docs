---
read_when:
    - Menjalankan atau mengonfigurasi onboarding CLI
    - Menyiapkan mesin baru
sidebarTitle: 'Onboarding: CLI'
summary: 'Orientasi CLI: penyiapan terpandu untuk gateway, ruang kerja, channel, dan Skills'
title: Orientasi Awal (CLI)
x-i18n:
    generated_at: "2026-06-27T18:14:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77bbf3d1f953ea2fca148090377f9537b00b657b2d7201c21aea902800815fd2
    source_path: start/wizard.md
    workflow: 16
---

CLI onboarding adalah jalur penyiapan terminal yang **direkomendasikan** untuk OpenClaw di
macOS, Linux, atau Windows. Pengguna desktop Windows juga dapat memulai dengan
[Windows Hub](/id/platforms/windows).
Ini mengonfigurasi Gateway lokal atau koneksi Gateway jarak jauh, beserta channel, Skills,
dan default workspace dalam satu alur terpandu.

```bash
openclaw onboard
```

## Lokal

Wizard CLI melokalkan salinan onboarding tetap. Lokal ditentukan dari
`OPENCLAW_LOCALE`, lalu `LC_ALL`, lalu `LC_MESSAGES`, lalu `LANG`, dan kembali
ke bahasa Inggris sebagai fallback. Lokal wizard yang didukung adalah `en`, `zh-CN`, dan `zh-TW`.

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

Nama dan pengidentifikasi stabil tetap literal: `OpenClaw`, `Gateway`, `Tailscale`,
perintah, kunci config, URL, ID provider, ID model, dan label plugin/channel
tidak diterjemahkan.

<Info>
Chat pertama tercepat: buka Control UI (tidak perlu penyiapan channel). Jalankan
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
CLI onboarding menyertakan langkah pencarian web tempat Anda dapat memilih provider
seperti Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search,
Ollama Web Search, Perplexity, SearXNG, atau Tavily. Beberapa provider memerlukan
kunci API, sementara yang lain bebas kunci. Anda juga dapat mengonfigurasi ini nanti dengan
`openclaw configure --section web`. Dokumentasi: [Alat web](/id/tools/web).
</Tip>

## QuickStart vs Lanjutan

Onboarding dimulai dengan **QuickStart** (default) vs **Lanjutan** (kontrol penuh).

<Tabs>
  <Tab title="QuickStart (default)">
    - Gateway lokal (local loopback)
    - Default workspace (atau workspace yang sudah ada)
    - Port Gateway **18789**
    - Auth Gateway **Token** (dibuat otomatis, bahkan pada loopback)
    - Default kebijakan alat untuk penyiapan lokal baru: `tools.profile: "coding"` (profil eksplisit yang sudah ada dipertahankan)
    - Default isolasi DM: onboarding lokal menulis `session.dmScope: "per-channel-peer"` saat belum diatur. Detail: [Referensi Penyiapan CLI](/id/start/wizard-cli-reference#outputs-and-internals)
    - Eksposur Tailscale **Mati**
    - DM Telegram + WhatsApp menggunakan default **daftar izin** (Anda akan diminta memasukkan nomor telepon)

  </Tab>
  <Tab title="Lanjutan (kontrol penuh)">
    - Mengekspos setiap langkah (mode, workspace, gateway, channel, daemon, Skills).

  </Tab>
</Tabs>

## Yang dikonfigurasi onboarding

**Mode lokal (default)** memandu Anda melalui langkah-langkah ini:

1. **Model/Auth** — pilih provider/alur auth yang didukung (kunci API, OAuth, atau auth manual khusus provider), termasuk Custom Provider
   (kompatibel OpenAI, kompatibel Anthropic, atau deteksi otomatis Unknown). Pilih model default.
   Catatan keamanan: jika agen ini akan menjalankan alat atau memproses konten webhook/hook, pilih model generasi terbaru terkuat yang tersedia dan pertahankan kebijakan alat tetap ketat. Tingkat yang lebih lemah/lama lebih mudah terkena prompt injection.
   Untuk proses non-interaktif, `--secret-input-mode ref` menyimpan ref berbasis env dalam profil auth alih-alih nilai kunci API plaintext.
   Dalam mode `ref` non-interaktif, env var provider harus diatur; meneruskan flag kunci inline tanpa env var tersebut akan gagal cepat.
   Dalam proses interaktif, memilih mode referensi secret memungkinkan Anda menunjuk ke variabel lingkungan atau ref provider yang dikonfigurasi (`file` atau `exec`), dengan validasi preflight cepat sebelum menyimpan.
   Untuk Anthropic, onboarding/configure interaktif menawarkan **Anthropic Claude CLI** sebagai jalur lokal pilihan dan **kunci API Anthropic** sebagai jalur produksi yang direkomendasikan. Anthropic setup-token juga tetap tersedia sebagai jalur auth token yang didukung.
2. **Workspace** — Lokasi untuk file agen (default `~/.openclaw/workspace`). Mengisi file bootstrap awal.
3. **Gateway** — Port, alamat bind, mode auth, eksposur Tailscale.
   Dalam mode token interaktif, pilih penyimpanan token plaintext default atau ikut memakai SecretRef.
   Jalur SecretRef token non-interaktif: `--gateway-token-ref-env <ENV_VAR>`.
4. **Channel** — channel chat bawaan dan plugin resmi seperti iMessage, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp, dan lainnya.
5. **Daemon** — Menginstal LaunchAgent (macOS), unit pengguna systemd (Linux/WSL2), atau Windows Scheduled Task native dengan fallback folder Startup per pengguna.
   Jika auth token memerlukan token dan `gateway.auth.token` dikelola SecretRef, instalasi daemon memvalidasinya tetapi tidak mempertahankan token yang sudah di-resolve ke metadata lingkungan layanan supervisor.
   Jika auth token memerlukan token dan SecretRef token yang dikonfigurasi belum ter-resolve, instalasi daemon diblokir dengan panduan yang dapat ditindaklanjuti.
   Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi dan `gateway.auth.mode` belum diatur, instalasi daemon diblokir hingga mode diatur secara eksplisit.
6. **Health check** — Memulai Gateway dan memverifikasi bahwa Gateway berjalan.
7. **Skills** — Menginstal Skills yang direkomendasikan dan dependensi opsional.

<Note>
Menjalankan ulang onboarding **tidak** menghapus apa pun kecuali Anda secara eksplisit memilih **Reset** (atau meneruskan `--reset`).
CLI `--reset` default mencakup config, kredensial, dan sesi; gunakan `--reset-scope full` untuk menyertakan workspace.
Jika config tidak valid atau berisi kunci legacy, onboarding meminta Anda menjalankan `openclaw doctor` terlebih dahulu.
</Note>

**Mode jarak jauh** hanya mengonfigurasi klien lokal agar terhubung ke Gateway di tempat lain.
Mode ini **tidak** menginstal atau mengubah apa pun pada host jarak jauh.

## Tambahkan agen lain

Gunakan `openclaw agents add <name>` untuk membuat agen terpisah dengan workspace,
sesi, dan profil auth sendiri. Menjalankan tanpa `--workspace` meluncurkan onboarding.

Yang diaturnya:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Catatan:

- Workspace default mengikuti `~/.openclaw/workspace-<agentId>`.
- Tambahkan `bindings` untuk merutekan pesan masuk (onboarding dapat melakukan ini).
- Flag non-interaktif: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Referensi lengkap

Untuk uraian langkah demi langkah yang mendetail dan output config, lihat
[Referensi Penyiapan CLI](/id/start/wizard-cli-reference).
Untuk contoh non-interaktif, lihat [Otomasi CLI](/id/start/wizard-cli-automation).
Untuk referensi teknis yang lebih dalam, termasuk detail RPC, lihat
[Referensi Onboarding](/id/reference/wizard).

## Dokumentasi terkait

- Referensi perintah CLI: [`openclaw onboard`](/id/cli/onboard)
- Ikhtisar onboarding: [Ikhtisar Onboarding](/id/start/onboarding-overview)
- Onboarding aplikasi macOS: [Onboarding](/id/start/onboarding)
- Ritual pertama kali agen dijalankan: [Bootstrap Agen](/id/start/bootstrapping)
