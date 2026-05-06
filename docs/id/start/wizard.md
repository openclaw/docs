---
read_when:
    - Menjalankan atau mengonfigurasi proses orientasi CLI
    - Menyiapkan mesin baru
sidebarTitle: 'Onboarding: CLI'
summary: 'Orientasi awal CLI: penyiapan terpandu untuk Gateway, ruang kerja, saluran, dan Skills'
title: Orientasi Awal (CLI)
x-i18n:
    generated_at: "2026-05-06T09:28:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: c4872c150950a811e5cdb8830fe635886f7c3ed0f1d62352b71be56feda64691
    source_path: start/wizard.md
    workflow: 16
---

CLI onboarding adalah cara yang **direkomendasikan** untuk menyiapkan OpenClaw di macOS,
Linux, atau Windows (melalui WSL2; sangat direkomendasikan).
Ini mengonfigurasi Gateway lokal atau koneksi Gateway jarak jauh, serta saluran, Skills,
dan default ruang kerja dalam satu alur terpandu.

```bash
openclaw onboard
```

<Info>
Chat pertama tercepat: buka UI Kontrol (tidak perlu penyiapan saluran). Jalankan
`openclaw dashboard` dan lakukan chat di browser. Dokumentasi: [Dashboard](/id/web/dashboard).
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
CLI onboarding mencakup langkah pencarian web tempat Anda dapat memilih penyedia
seperti Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search,
Ollama Web Search, Perplexity, SearXNG, atau Tavily. Sebagian penyedia memerlukan
kunci API, sementara yang lain bebas kunci. Anda juga dapat mengonfigurasi ini nanti dengan
`openclaw configure --section web`. Dokumentasi: [Alat web](/id/tools/web).
</Tip>

## Mulai Cepat vs Lanjutan

Onboarding dimulai dengan **Mulai Cepat** (default) vs **Lanjutan** (kontrol penuh).

<Tabs>
  <Tab title="Mulai Cepat (default)">
    - Gateway lokal (loopback)
    - Default ruang kerja (atau ruang kerja yang sudah ada)
    - Port Gateway **18789**
    - Autentikasi Gateway **Token** (dibuat otomatis, bahkan pada loopback)
    - Default kebijakan alat untuk penyiapan lokal baru: `tools.profile: "coding"` (profil eksplisit yang sudah ada dipertahankan)
    - Default isolasi DM: onboarding lokal menulis `session.dmScope: "per-channel-peer"` saat belum ditetapkan. Detail: [Referensi Penyiapan CLI](/id/start/wizard-cli-reference#outputs-and-internals)
    - Eksposur Tailscale **Mati**
    - DM Telegram + WhatsApp default ke **allowlist** (Anda akan diminta memasukkan nomor telepon)

  </Tab>
  <Tab title="Lanjutan (kontrol penuh)">
    - Menampilkan setiap langkah (mode, ruang kerja, Gateway, saluran, daemon, Skills).

  </Tab>
</Tabs>

## Yang dikonfigurasi onboarding

**Mode lokal (default)** memandu Anda melalui langkah-langkah ini:

1. **Model/Autentikasi** — pilih penyedia/alur autentikasi apa pun yang didukung (kunci API, OAuth, atau autentikasi manual khusus penyedia), termasuk Penyedia Kustom
   (kompatibel OpenAI, kompatibel Anthropic, atau deteksi otomatis Tidak Diketahui). Pilih model default.
   Catatan keamanan: jika agen ini akan menjalankan alat atau memproses konten webhook/hooks, pilih model generasi terbaru terkuat yang tersedia dan jaga kebijakan alat tetap ketat. Tingkat yang lebih lemah/lama lebih mudah terkena prompt injection.
   Untuk eksekusi non-interaktif, `--secret-input-mode ref` menyimpan ref berbasis env dalam profil autentikasi, bukan nilai kunci API plaintext.
   Dalam mode `ref` non-interaktif, variabel env penyedia harus ditetapkan; meneruskan flag kunci inline tanpa variabel env tersebut akan gagal cepat.
   Dalam eksekusi interaktif, memilih mode referensi rahasia memungkinkan Anda menunjuk ke variabel lingkungan atau ref penyedia yang dikonfigurasi (`file` atau `exec`), dengan validasi preflight cepat sebelum menyimpan.
   Untuk Anthropic, onboarding/configure interaktif menawarkan **Anthropic Claude CLI** sebagai jalur lokal yang disarankan dan **kunci API Anthropic** sebagai jalur produksi yang direkomendasikan. setup-token Anthropic juga tetap tersedia sebagai jalur autentikasi token yang didukung.
2. **Ruang kerja** — Lokasi untuk file agen (default `~/.openclaw/workspace`). Mengisi file bootstrap awal.
3. **Gateway** — Port, alamat bind, mode autentikasi, eksposur Tailscale.
   Dalam mode token interaktif, pilih penyimpanan token plaintext default atau ikut menggunakan SecretRef.
   Jalur SecretRef token non-interaktif: `--gateway-token-ref-env <ENV_VAR>`.
4. **Saluran** — saluran chat bawaan dan bundled seperti BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp, dan lainnya.
5. **Daemon** — Menginstal LaunchAgent (macOS), unit pengguna systemd (Linux/WSL2), atau Windows Scheduled Task native dengan fallback folder Startup per pengguna.
   Jika autentikasi token memerlukan token dan `gateway.auth.token` dikelola SecretRef, instalasi daemon memvalidasinya tetapi tidak mempertahankan token yang di-resolve ke dalam metadata lingkungan layanan supervisor.
   Jika autentikasi token memerlukan token dan SecretRef token yang dikonfigurasi belum ter-resolve, instalasi daemon diblokir dengan panduan yang dapat ditindaklanjuti.
   Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi dan `gateway.auth.mode` belum ditetapkan, instalasi daemon diblokir sampai mode ditetapkan secara eksplisit.
6. **Pemeriksaan kesehatan** — Memulai Gateway dan memverifikasi bahwa Gateway berjalan.
7. **Skills** — Menginstal Skills yang direkomendasikan dan dependensi opsional.

<Note>
Menjalankan ulang onboarding **tidak** menghapus apa pun kecuali Anda secara eksplisit memilih **Reset** (atau meneruskan `--reset`).
CLI `--reset` default ke konfigurasi, kredensial, dan sesi; gunakan `--reset-scope full` untuk menyertakan ruang kerja.
Jika konfigurasi tidak valid atau berisi kunci legacy, onboarding meminta Anda menjalankan `openclaw doctor` terlebih dahulu.
</Note>

**Mode jarak jauh** hanya mengonfigurasi klien lokal untuk terhubung ke Gateway di tempat lain.
Mode ini **tidak** menginstal atau mengubah apa pun pada host jarak jauh.

## Tambahkan agen lain

Gunakan `openclaw agents add <name>` untuk membuat agen terpisah dengan ruang kerja,
sesi, dan profil autentikasinya sendiri. Menjalankan tanpa `--workspace` meluncurkan onboarding.

Yang ditetapkan:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Catatan:

- Ruang kerja default mengikuti `~/.openclaw/workspace-<agentId>`.
- Tambahkan `bindings` untuk merutekan pesan masuk (onboarding dapat melakukan ini).
- Flag non-interaktif: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Referensi lengkap

Untuk uraian langkah demi langkah terperinci dan output konfigurasi, lihat
[Referensi Penyiapan CLI](/id/start/wizard-cli-reference).
Untuk contoh non-interaktif, lihat [Otomasi CLI](/id/start/wizard-cli-automation).
Untuk referensi teknis yang lebih mendalam, termasuk detail RPC, lihat
[Referensi Onboarding](/id/reference/wizard).

## Dokumentasi terkait

- Referensi perintah CLI: [`openclaw onboard`](/id/cli/onboard)
- Ringkasan onboarding: [Ringkasan Onboarding](/id/start/onboarding-overview)
- Onboarding aplikasi macOS: [Onboarding](/id/start/onboarding)
- Ritual pertama agen: [Bootstrap Agen](/id/start/bootstrapping)
