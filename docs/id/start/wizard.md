---
read_when:
    - Menjalankan atau mengonfigurasi onboarding CLI
    - Menyiapkan mesin baru
sidebarTitle: 'Onboarding: CLI'
summary: 'Onboarding CLI: penyiapan terpandu untuk Gateway, ruang kerja, saluran, dan Skills'
title: Orientasi (CLI)
x-i18n:
    generated_at: "2026-06-28T20:44:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8abf6ac4644e0a49668cbfa1277f6eb3ac5b4fd822cd7805bb647c94ae76895f
    source_path: start/wizard.md
    workflow: 16
---

Onboarding CLI adalah jalur penyiapan terminal yang **direkomendasikan** untuk OpenClaw di macOS, Linux, atau Windows. Pengguna desktop Windows juga dapat memulai dengan [Windows Hub](/id/platforms/windows).
Ini mengonfigurasi Gateway lokal atau koneksi Gateway jarak jauh, ditambah saluran, Skills,
dan default ruang kerja dalam satu alur terpandu.

```bash
openclaw onboard
```

QuickStart biasanya hanya membutuhkan beberapa menit, tetapi onboarding penuh dapat memakan waktu lebih lama
ketika login penyedia, pemasangan saluran, pemasangan daemon, unduhan jaringan,
Skills, atau Plugin opsional memerlukan penyiapan tambahan. Wizard menampilkan perkiraan waktu ini di awal,
dan langkah opsional dapat dilewati lalu dikunjungi kembali nanti dengan
`openclaw configure`.

## Lokal

Wizard CLI melokalkan teks onboarding tetap. Lokal ditentukan dari
`OPENCLAW_LOCALE`, lalu `LC_ALL`, lalu `LC_MESSAGES`, lalu `LANG`, dan jika tidak ada
akan kembali ke bahasa Inggris. Lokal wizard yang didukung adalah `en`, `zh-CN`, dan `zh-TW`.

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

Nama dan pengenal stabil tetap literal: `OpenClaw`, `Gateway`, `Tailscale`,
perintah, kunci konfigurasi, URL, ID penyedia, ID model, serta label Plugin/saluran
tidak diterjemahkan.

<Info>
Obrolan pertama tercepat: buka Control UI (penyiapan saluran tidak diperlukan). Jalankan
`openclaw dashboard` dan mengobrol di browser. Dokumen: [Dashboard](/id/web/dashboard).
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
kunci API, sedangkan yang lain tidak memerlukan kunci. Anda juga dapat mengonfigurasinya nanti dengan
`openclaw configure --section web`. Dokumen: [Alat web](/id/tools/web).
</Tip>

## QuickStart vs Lanjutan

Onboarding dimulai dengan **QuickStart** (default) vs **Lanjutan** (kontrol penuh).

<Tabs>
  <Tab title="QuickStart (default)">
    - Gateway lokal (local loopback)
    - Default ruang kerja (atau ruang kerja yang sudah ada)
    - Port Gateway **18789**
    - Autentikasi Gateway **Token** (dibuat otomatis, bahkan pada loopback)
    - Default kebijakan alat untuk penyiapan lokal baru: `tools.profile: "coding"` (profil eksplisit yang sudah ada dipertahankan)
    - Default isolasi DM: onboarding lokal menulis `session.dmScope: "per-channel-peer"` saat belum diatur. Detail: [Referensi Penyiapan CLI](/id/start/wizard-cli-reference#outputs-and-internals)
    - Eksposur Tailscale **Mati**
    - DM Telegram + WhatsApp default ke **allowlist** (Anda akan diminta memasukkan nomor telepon)

  </Tab>
  <Tab title="Lanjutan (kontrol penuh)">
    - Mengekspos setiap langkah (mode, ruang kerja, Gateway, saluran, daemon, Skills).

  </Tab>
</Tabs>

## Apa yang dikonfigurasi onboarding

**Mode lokal (default)** memandu Anda melalui langkah-langkah ini:

1. **Model/Auth** — pilih penyedia/alur autentikasi apa pun yang didukung (kunci API, OAuth, atau autentikasi manual khusus penyedia), termasuk Custom Provider
   (kompatibel dengan OpenAI, kompatibel dengan Anthropic, atau deteksi otomatis Unknown). Pilih model default.
   Catatan keamanan: jika agen ini akan menjalankan alat atau memproses konten Webhook/hook, pilih model generasi terbaru terkuat yang tersedia dan pertahankan kebijakan alat tetap ketat. Tingkat yang lebih lemah/lama lebih mudah terkena prompt injection.
   Untuk eksekusi non-interaktif, `--secret-input-mode ref` menyimpan ref berbasis env di profil auth alih-alih nilai kunci API teks biasa.
   Dalam mode non-interaktif `ref`, env var penyedia harus diatur; meneruskan flag kunci inline tanpa env var tersebut akan gagal cepat.
   Dalam eksekusi interaktif, memilih mode referensi rahasia memungkinkan Anda menunjuk ke variabel lingkungan atau ref penyedia yang dikonfigurasi (`file` atau `exec`), dengan validasi preflight cepat sebelum menyimpan.
   Untuk Anthropic, onboarding/konfigurasi interaktif menawarkan **Anthropic Claude CLI** sebagai jalur lokal yang disukai dan **Anthropic API key** sebagai jalur produksi yang direkomendasikan. Anthropic setup-token juga tetap tersedia sebagai jalur token-auth yang didukung.
2. **Ruang kerja** — Lokasi untuk file agen (default `~/.openclaw/workspace`). Mengisi file bootstrap awal.
3. **Gateway** — Port, alamat bind, mode autentikasi, eksposur Tailscale.
   Dalam mode token interaktif, pilih penyimpanan token teks biasa default atau ikut menggunakan SecretRef.
   Jalur SecretRef token non-interaktif: `--gateway-token-ref-env <ENV_VAR>`.
4. **Saluran** — saluran obrolan bawaan dan Plugin resmi seperti iMessage, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp, dan lainnya.
5. **Daemon** — Memasang LaunchAgent (macOS), unit pengguna systemd (Linux/WSL2), atau Windows Scheduled Task native dengan fallback folder Startup per pengguna.
   Jika autentikasi token memerlukan token dan `gateway.auth.token` dikelola SecretRef, pemasangan daemon memvalidasinya tetapi tidak menyimpan token yang di-resolve ke metadata lingkungan layanan supervisor.
   Jika autentikasi token memerlukan token dan SecretRef token yang dikonfigurasi belum ter-resolve, pemasangan daemon diblokir dengan panduan yang dapat ditindaklanjuti.
   Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi dan `gateway.auth.mode` belum diatur, pemasangan daemon diblokir sampai mode diatur secara eksplisit.
6. **Pemeriksaan kesehatan** — Memulai Gateway dan memverifikasi bahwa Gateway berjalan.
7. **Skills** — Memasang Skills yang direkomendasikan dan dependensi opsional.

<Note>
Menjalankan ulang onboarding **tidak** menghapus apa pun kecuali Anda secara eksplisit memilih **Reset** (atau meneruskan `--reset`).
CLI `--reset` default ke konfigurasi, kredensial, dan sesi; gunakan `--reset-scope full` untuk menyertakan ruang kerja.
Jika konfigurasi tidak valid atau berisi kunci lama, onboarding meminta Anda menjalankan `openclaw doctor` terlebih dahulu.
</Note>

**Mode jarak jauh** hanya mengonfigurasi klien lokal untuk terhubung ke Gateway di tempat lain.
Mode ini **tidak** memasang atau mengubah apa pun di host jarak jauh.

## Tambahkan agen lain

Gunakan `openclaw agents add <name>` untuk membuat agen terpisah dengan ruang kerja,
sesi, dan profil auth miliknya sendiri. Menjalankan tanpa `--workspace` akan membuka onboarding.

Yang diaturnya:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Catatan:

- Ruang kerja default mengikuti `~/.openclaw/workspace-<agentId>`.
- Tambahkan `bindings` untuk merutekan pesan masuk (onboarding dapat melakukannya).
- Flag non-interaktif: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Referensi lengkap

Untuk uraian langkah demi langkah terperinci dan output konfigurasi, lihat
[Referensi Penyiapan CLI](/id/start/wizard-cli-reference).
Untuk contoh non-interaktif, lihat [Otomasi CLI](/id/start/wizard-cli-automation).
Untuk referensi teknis yang lebih mendalam, termasuk detail RPC, lihat
[Referensi Onboarding](/id/reference/wizard).

## Dokumen terkait

- Referensi perintah CLI: [`openclaw onboard`](/id/cli/onboard)
- Ikhtisar onboarding: [Ikhtisar Onboarding](/id/start/onboarding-overview)
- Onboarding aplikasi macOS: [Onboarding](/id/start/onboarding)
- Ritual pertama kali agen berjalan: [Bootstrap Agen](/id/start/bootstrapping)
