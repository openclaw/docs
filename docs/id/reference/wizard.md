---
read_when:
    - Mencari langkah atau flag onboarding tertentu
    - Mengotomatisasi onboarding dengan mode non-interaktif
    - Men-debug perilaku onboarding
sidebarTitle: Onboarding Reference
summary: 'Referensi lengkap untuk onboarding CLI: setiap langkah, flag, dan field config'
title: Referensi onboarding
x-i18n:
    generated_at: "2026-04-26T11:39:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 729a12bac6b67b32ba4b2b2068a30240d2118f5afe3812c701ee65d7b7e13018
    source_path: reference/wizard.md
    workflow: 15
---

Ini adalah referensi lengkap untuk `openclaw onboard`.
Untuk ringkasan tingkat tinggi, lihat [Onboarding (CLI)](/id/start/wizard).

## Detail alur (mode lokal)

<Steps>
  <Step title="Deteksi config yang sudah ada">
    - Jika `~/.openclaw/openclaw.json` ada, pilih **Keep / Modify / Reset**.
    - Menjalankan onboarding ulang **tidak** menghapus apa pun kecuali Anda secara eksplisit memilih **Reset**
      (atau memberikan `--reset`).
    - CLI `--reset` default ke `config+creds+sessions`; gunakan `--reset-scope full`
      untuk juga menghapus workspace.
    - Jika config tidak valid atau berisi kunci lama, wizard berhenti dan meminta
      Anda menjalankan `openclaw doctor` sebelum melanjutkan.
    - Reset menggunakan `trash` (tidak pernah `rm`) dan menawarkan cakupan:
      - Hanya config
      - Config + kredensial + sesi
      - Reset penuh (juga menghapus workspace)
  </Step>
  <Step title="Model/Auth">
    - **Anthropic API key**: menggunakan `ANTHROPIC_API_KEY` jika ada atau meminta key, lalu menyimpannya untuk penggunaan daemon.
    - **Anthropic API key**: pilihan asisten Anthropic yang disukai dalam onboarding/configure.
    - **Anthropic setup-token**: masih tersedia dalam onboarding/configure, meskipun OpenClaw kini lebih memilih reuse Claude CLI bila tersedia.
    - **OpenAI Code (Codex) subscription (OAuth)**: alur browser; tempelkan `code#state`.
      - Menyetel `agents.defaults.model` ke `openai-codex/gpt-5.5` saat model belum disetel atau sudah termasuk keluarga OpenAI.
    - **OpenAI Code (Codex) subscription (device pairing)**: alur pairing browser dengan kode perangkat yang berumur pendek.
      - Menyetel `agents.defaults.model` ke `openai-codex/gpt-5.5` saat model belum disetel atau sudah termasuk keluarga OpenAI.
    - **OpenAI API key**: menggunakan `OPENAI_API_KEY` jika ada atau meminta key, lalu menyimpannya di auth profiles.
      - Menyetel `agents.defaults.model` ke `openai/gpt-5.5` saat model belum disetel, `openai/*`, atau `openai-codex/*`.
    - **xAI (Grok) API key**: meminta `XAI_API_KEY` dan mengonfigurasi xAI sebagai provider model.
    - **OpenCode**: meminta `OPENCODE_API_KEY` (atau `OPENCODE_ZEN_API_KEY`, dapatkan di https://opencode.ai/auth) dan memungkinkan Anda memilih katalog Zen atau Go.
    - **Ollama**: pertama-tama menawarkan **Cloud + Local**, **Cloud only**, atau **Local only**. `Cloud only` meminta `OLLAMA_API_KEY` dan menggunakan `https://ollama.com`; mode yang didukung host meminta base URL Ollama, menemukan model yang tersedia, dan otomatis menarik model lokal yang dipilih bila diperlukan; `Cloud + Local` juga memeriksa apakah host Ollama tersebut sudah login untuk akses cloud.
    - Detail lebih lanjut: [Ollama](/id/providers/ollama)
    - **API key**: menyimpan key untuk Anda.
    - **Vercel AI Gateway (multi-model proxy)**: meminta `AI_GATEWAY_API_KEY`.
    - Detail lebih lanjut: [Vercel AI Gateway](/id/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: meminta Account ID, Gateway ID, dan `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Detail lebih lanjut: [Cloudflare AI Gateway](/id/providers/cloudflare-ai-gateway)
    - **MiniMax**: config ditulis otomatis; default hosted adalah `MiniMax-M2.7`.
      Penyiapan API key menggunakan `minimax/...`, dan penyiapan OAuth menggunakan
      `minimax-portal/...`.
    - Detail lebih lanjut: [MiniMax](/id/providers/minimax)
    - **StepFun**: config ditulis otomatis untuk StepFun standard atau Step Plan pada endpoint China atau global.
    - Standard saat ini mencakup `step-3.5-flash`, dan Step Plan juga mencakup `step-3.5-flash-2603`.
    - Detail lebih lanjut: [StepFun](/id/providers/stepfun)
    - **Synthetic (kompatibel Anthropic)**: meminta `SYNTHETIC_API_KEY`.
    - Detail lebih lanjut: [Synthetic](/id/providers/synthetic)
    - **Moonshot (Kimi K2)**: config ditulis otomatis.
    - **Kimi Coding**: config ditulis otomatis.
    - Detail lebih lanjut: [Moonshot AI (Kimi + Kimi Coding)](/id/providers/moonshot)
    - **Skip**: belum ada auth yang dikonfigurasi.
    - Pilih model default dari opsi yang terdeteksi (atau masukkan provider/model secara manual). Untuk kualitas terbaik dan risiko prompt-injection yang lebih rendah, pilih model generasi terbaru terkuat yang tersedia dalam stack provider Anda.
    - Onboarding menjalankan pemeriksaan model dan memperingatkan jika model yang dikonfigurasi tidak dikenal atau auth tidak ada.
    - Mode penyimpanan API key default ke nilai auth-profile plaintext. Gunakan `--secret-input-mode ref` untuk menyimpan ref yang didukung env sebagai gantinya (misalnya `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Auth profiles berada di `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (API key + OAuth). `~/.openclaw/credentials/oauth.json` hanya untuk impor lama.
    - Detail lebih lanjut: [/concepts/oauth](/id/concepts/oauth)
    <Note>
    Tip headless/server: selesaikan OAuth pada mesin dengan browser, lalu salin
    `auth-profiles.json` milik agen tersebut (misalnya
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, atau path
    `$OPENCLAW_STATE_DIR/...` yang sesuai) ke host gateway. `credentials/oauth.json`
    hanya merupakan sumber impor lama.
    </Note>
  </Step>
  <Step title="Workspace">
    - Default `~/.openclaw/workspace` (dapat dikonfigurasi).
    - Menyiapkan file workspace yang dibutuhkan untuk ritual bootstrap agen.
    - Tata letak workspace penuh + panduan cadangan: [Agent workspace](/id/concepts/agent-workspace)
  </Step>
  <Step title="Gateway">
    - Port, bind, mode auth, eksposur tailscale.
    - Rekomendasi auth: pertahankan **Token** bahkan untuk loopback agar klien WS lokal harus diautentikasi.
    - Dalam mode token, penyiapan interaktif menawarkan:
      - **Generate/store plaintext token** (default)
      - **Use SecretRef** (opt-in)
      - Quickstart menggunakan kembali SecretRef `gateway.auth.token` yang ada di seluruh provider `env`, `file`, dan `exec` untuk probe onboarding/bootstrap dashboard.
      - Jika SecretRef itu dikonfigurasi tetapi tidak dapat di-resolve, onboarding gagal lebih awal dengan pesan perbaikan yang jelas alih-alih diam-diam menurunkan auth runtime.
    - Dalam mode password, penyiapan interaktif juga mendukung penyimpanan plaintext atau SecretRef.
    - Path SecretRef token non-interaktif: `--gateway-token-ref-env <ENV_VAR>`.
      - Memerlukan variabel env yang tidak kosong di lingkungan proses onboarding.
      - Tidak dapat digabungkan dengan `--gateway-token`.
    - Nonaktifkan auth hanya jika Anda sepenuhnya memercayai setiap proses lokal.
    - Bind non‑loopback tetap memerlukan auth.
  </Step>
  <Step title="Channels">
    - [WhatsApp](/id/channels/whatsapp): login QR opsional.
    - [Telegram](/id/channels/telegram): token bot.
    - [Discord](/id/channels/discord): token bot.
    - [Google Chat](/id/channels/googlechat): JSON service account + audiens webhook.
    - [Mattermost](/id/channels/mattermost) (Plugin): token bot + base URL.
    - [Signal](/id/channels/signal): instalasi `signal-cli` opsional + config akun.
    - [BlueBubbles](/id/channels/bluebubbles): **direkomendasikan untuk iMessage**; URL server + password + webhook.
    - [iMessage](/id/channels/imessage): path `imsg` CLI lama + akses DB.
    - Keamanan DM: default adalah pairing. DM pertama mengirim kode; setujui melalui `openclaw pairing approve <channel> <code>` atau gunakan allowlist.
  </Step>
  <Step title="Pencarian web">
    - Pilih provider yang didukung seperti Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, atau Tavily (atau lewati).
    - Provider berbasis API dapat menggunakan variabel env atau config yang sudah ada untuk penyiapan cepat; provider tanpa key menggunakan prasyarat khusus providernya.
    - Lewati dengan `--skip-search`.
    - Konfigurasikan nanti: `openclaw configure --section web`.
  </Step>
  <Step title="Instal daemon">
    - macOS: LaunchAgent
      - Memerlukan sesi pengguna yang login; untuk headless, gunakan LaunchDaemon kustom (tidak disertakan).
    - Linux (dan Windows via WSL2): systemd user unit
      - Onboarding mencoba mengaktifkan lingering melalui `loginctl enable-linger <user>` agar Gateway tetap aktif setelah logout.
      - Mungkin meminta sudo (menulis ke `/var/lib/systemd/linger`); pertama-tama mencoba tanpa sudo.
    - **Pemilihan runtime:** Node (direkomendasikan; wajib untuk WhatsApp/Telegram). Bun **tidak direkomendasikan**.
    - Jika auth token memerlukan token dan `gateway.auth.token` dikelola SecretRef, instalasi daemon memvalidasinya tetapi tidak menyimpan nilai token plaintext yang telah di-resolve ke metadata lingkungan layanan supervisor.
    - Jika auth token memerlukan token dan token SecretRef yang dikonfigurasi tidak dapat di-resolve, instalasi daemon diblokir dengan panduan yang dapat ditindaklanjuti.
    - Jika `gateway.auth.token` dan `gateway.auth.password` keduanya dikonfigurasi dan `gateway.auth.mode` tidak disetel, instalasi daemon diblokir sampai mode disetel secara eksplisit.
  </Step>
  <Step title="Pemeriksaan kesehatan">
    - Memulai Gateway (jika perlu) dan menjalankan `openclaw health`.
    - Tip: `openclaw status --deep` menambahkan probe kesehatan gateway live ke output status, termasuk probe kanal saat didukung (memerlukan gateway yang dapat dijangkau).
  </Step>
  <Step title="Skills (direkomendasikan)">
    - Membaca Skills yang tersedia dan memeriksa persyaratan.
    - Memungkinkan Anda memilih manajer Node: **npm / pnpm** (bun tidak direkomendasikan).
    - Menginstal dependensi opsional (sebagian menggunakan Homebrew di macOS).
  </Step>
  <Step title="Selesai">
    - Ringkasan + langkah berikutnya, termasuk aplikasi iOS/Android/macOS untuk fitur tambahan.
  </Step>
</Steps>

<Note>
Jika tidak ada GUI yang terdeteksi, onboarding mencetak instruksi port-forward SSH untuk UI Control alih-alih membuka browser.
Jika aset UI Control hilang, onboarding mencoba membangunnya; fallback-nya adalah `pnpm ui:build` (otomatis menginstal dependensi UI).
</Note>

## Mode non-interaktif

Gunakan `--non-interactive` untuk mengotomatisasi atau membuat skrip onboarding:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills
```

Tambahkan `--json` untuk ringkasan yang dapat dibaca mesin.

Gateway token SecretRef dalam mode non-interaktif:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token` dan `--gateway-token-ref-env` bersifat mutually exclusive.

<Note>
`--json` **tidak** menyiratkan mode non-interaktif. Gunakan `--non-interactive` (dan `--workspace`) untuk skrip.
</Note>

Contoh perintah khusus provider ada di [CLI Automation](/id/start/wizard-cli-automation#provider-specific-examples).
Gunakan halaman referensi ini untuk semantik flag dan urutan langkah.

### Tambahkan agen (non-interaktif)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.5 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## RPC wizard Gateway

Gateway mengekspos alur onboarding melalui RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
Klien (aplikasi macOS, UI Control) dapat merender langkah tanpa mengimplementasikan ulang logika onboarding.

## Penyiapan Signal (`signal-cli`)

Onboarding dapat menginstal `signal-cli` dari rilis GitHub:

- Mengunduh aset rilis yang sesuai.
- Menyimpannya di `~/.openclaw/tools/signal-cli/<version>/`.
- Menulis `channels.signal.cliPath` ke config Anda.

Catatan:

- Build JVM memerlukan **Java 21**.
- Build native digunakan saat tersedia.
- Windows menggunakan WSL2; instalasi signal-cli mengikuti alur Linux di dalam WSL.

## Apa yang ditulis wizard

Field umum di `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (jika Minimax dipilih)
- `tools.profile` (onboarding lokal default ke `"coding"` saat tidak disetel; nilai eksplisit yang sudah ada tetap dipertahankan)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (detail perilaku: [CLI Setup Reference](/id/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- allowlist kanal (Slack/Discord/Matrix/Microsoft Teams) saat Anda ikut serta selama prompt (nama di-resolve ke ID bila memungkinkan).
- `skills.install.nodeManager`
  - `setup --node-manager` menerima `npm`, `pnpm`, atau `bun`.
  - Config manual tetap dapat menggunakan `yarn` dengan menyetel `skills.install.nodeManager` secara langsung.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` menulis `agents.list[]` dan `bindings` opsional.

Kredensial WhatsApp berada di bawah `~/.openclaw/credentials/whatsapp/<accountId>/`.
Sesi disimpan di bawah `~/.openclaw/agents/<agentId>/sessions/`.

Beberapa kanal dikirim sebagai Plugin. Saat Anda memilih salah satunya selama setup, onboarding
akan meminta instalasinya (npm atau path lokal) sebelum dapat dikonfigurasi.

## Dokumen terkait

- Ringkasan onboarding: [Onboarding (CLI)](/id/start/wizard)
- Onboarding aplikasi macOS: [Onboarding](/id/start/onboarding)
- Referensi config: [Gateway configuration](/id/gateway/configuration)
- Provider: [WhatsApp](/id/channels/whatsapp), [Telegram](/id/channels/telegram), [Discord](/id/channels/discord), [Google Chat](/id/channels/googlechat), [Signal](/id/channels/signal), [BlueBubbles](/id/channels/bluebubbles) (iMessage), [iMessage](/id/channels/imessage) (lama)
- Skills: [Skills](/id/tools/skills), [Skills config](/id/tools/skills-config)
