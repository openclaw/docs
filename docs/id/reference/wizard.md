---
read_when:
    - Mencari langkah atau flag onboarding tertentu
    - Mengotomatiskan onboarding dengan mode non-interaktif
    - Debugging perilaku onboarding
sidebarTitle: Onboarding Reference
summary: 'Referensi lengkap untuk onboarding CLI: setiap langkah, flag, dan field konfigurasi'
title: Referensi onboarding
x-i18n:
    generated_at: "2026-04-24T09:27:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3f191b7d8a6d47638d9d0c9acf47a286225174c580aa0db89cf0c208d47ffee5
    source_path: reference/wizard.md
    workflow: 15
---

Ini adalah referensi lengkap untuk `openclaw onboard`.
Untuk gambaran umum tingkat tinggi, lihat [Onboarding (CLI)](/id/start/wizard).

## Detail alur (mode lokal)

<Steps>
  <Step title="Deteksi konfigurasi yang ada">
    - Jika `~/.openclaw/openclaw.json` ada, pilih **Keep / Modify / Reset**.
    - Menjalankan ulang onboarding **tidak** akan menghapus apa pun kecuali Anda secara eksplisit memilih **Reset**
      (atau memberikan `--reset`).
    - CLI `--reset` default ke `config+creds+sessions`; gunakan `--reset-scope full`
      untuk juga menghapus workspace.
    - Jika konfigurasi tidak valid atau berisi key legacy, wizard berhenti dan meminta
      Anda menjalankan `openclaw doctor` sebelum melanjutkan.
    - Reset menggunakan `trash` (bukan `rm`) dan menawarkan cakupan:
      - Hanya konfigurasi
      - Konfigurasi + kredensial + sesi
      - Reset penuh (juga menghapus workspace)
  </Step>
  <Step title="Model/Auth">
    - **API key Anthropic**: menggunakan `ANTHROPIC_API_KEY` jika ada atau meminta key, lalu menyimpannya untuk penggunaan daemon.
    - **API key Anthropic**: pilihan asisten Anthropic yang diprioritaskan dalam onboarding/configure.
    - **Setup-token Anthropic**: tetap tersedia dalam onboarding/configure, meskipun OpenClaw sekarang lebih memilih penggunaan ulang Claude CLI jika tersedia.
    - **Langganan OpenAI Code (Codex) (OAuth)**: alur browser; tempel `code#state`.
      - Menetapkan `agents.defaults.model` ke `openai-codex/gpt-5.5` saat model belum ditetapkan atau sudah termasuk keluarga OpenAI.
    - **Langganan OpenAI Code (Codex) (pairing perangkat)**: alur pairing browser dengan kode perangkat berumur pendek.
      - Menetapkan `agents.defaults.model` ke `openai-codex/gpt-5.5` saat model belum ditetapkan atau sudah termasuk keluarga OpenAI.
    - **API key OpenAI**: menggunakan `OPENAI_API_KEY` jika ada atau meminta key, lalu menyimpannya dalam auth profile.
      - Menetapkan `agents.defaults.model` ke `openai/gpt-5.4` saat model belum ditetapkan, `openai/*`, atau `openai-codex/*`.
    - **API key xAI (Grok)**: meminta `XAI_API_KEY` dan mengonfigurasi xAI sebagai provider model.
    - **OpenCode**: meminta `OPENCODE_API_KEY` (atau `OPENCODE_ZEN_API_KEY`, dapatkan di https://opencode.ai/auth) dan memungkinkan Anda memilih katalog Zen atau Go.
    - **Ollama**: terlebih dahulu menawarkan **Cloud + Local**, **Cloud only**, atau **Local only**. `Cloud only` meminta `OLLAMA_API_KEY` dan menggunakan `https://ollama.com`; mode yang didukung host meminta base URL Ollama, menemukan model yang tersedia, dan otomatis menarik model lokal yang dipilih saat diperlukan; `Cloud + Local` juga memeriksa apakah host Ollama tersebut sudah sign in untuk akses cloud.
    - Detail selengkapnya: [Ollama](/id/providers/ollama)
    - **API key**: menyimpan key untuk Anda.
    - **Vercel AI Gateway (proxy multi-model)**: meminta `AI_GATEWAY_API_KEY`.
    - Detail selengkapnya: [Vercel AI Gateway](/id/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: meminta Account ID, Gateway ID, dan `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Detail selengkapnya: [Cloudflare AI Gateway](/id/providers/cloudflare-ai-gateway)
    - **MiniMax**: konfigurasi ditulis otomatis; default hosted adalah `MiniMax-M2.7`.
      Penyiapan API key menggunakan `minimax/...`, dan penyiapan OAuth menggunakan
      `minimax-portal/...`.
    - Detail selengkapnya: [MiniMax](/id/providers/minimax)
    - **StepFun**: konfigurasi ditulis otomatis untuk endpoint standar StepFun atau Step Plan di Tiongkok atau global.
    - Standar saat ini mencakup `step-3.5-flash`, dan Step Plan juga mencakup `step-3.5-flash-2603`.
    - Detail selengkapnya: [StepFun](/id/providers/stepfun)
    - **Synthetic (kompatibel dengan Anthropic)**: meminta `SYNTHETIC_API_KEY`.
    - Detail selengkapnya: [Synthetic](/id/providers/synthetic)
    - **Moonshot (Kimi K2)**: konfigurasi ditulis otomatis.
    - **Kimi Coding**: konfigurasi ditulis otomatis.
    - Detail selengkapnya: [Moonshot AI (Kimi + Kimi Coding)](/id/providers/moonshot)
    - **Lewati**: belum ada auth yang dikonfigurasi.
    - Pilih model default dari opsi yang terdeteksi (atau masukkan provider/model secara manual). Untuk kualitas terbaik dan risiko injeksi prompt yang lebih rendah, pilih model generasi terbaru terkuat yang tersedia di stack provider Anda.
    - Onboarding menjalankan pemeriksaan model dan memperingatkan jika model yang dikonfigurasi tidak dikenal atau auth tidak ada.
    - Mode penyimpanan API key default ke nilai auth-profile plaintext. Gunakan `--secret-input-mode ref` untuk menyimpan referensi berbasis env sebagai gantinya (misalnya `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Auth profile berada di `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (API key + OAuth). `~/.openclaw/credentials/oauth.json` adalah legacy dan hanya untuk impor.
    - Detail selengkapnya: [/concepts/oauth](/id/concepts/oauth)
    <Note>
    Tip headless/server: selesaikan OAuth di mesin dengan browser, lalu salin
    `auth-profiles.json` agen tersebut (misalnya
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, atau path
    `$OPENCLAW_STATE_DIR/...` yang sesuai) ke host gateway. `credentials/oauth.json`
    hanya merupakan sumber impor legacy.
    </Note>
  </Step>
  <Step title="Workspace">
    - Default `~/.openclaw/workspace` (dapat dikonfigurasi).
    - Menginisialisasi file workspace yang diperlukan untuk ritual bootstrap agen.
    - Panduan tata letak workspace lengkap + cadangan: [Workspace agen](/id/concepts/agent-workspace)
  </Step>
  <Step title="Gateway">
    - Port, bind, mode auth, eksposur Tailscale.
    - Rekomendasi auth: tetap gunakan **Token** bahkan untuk loopback agar klien WS lokal tetap harus diautentikasi.
    - Dalam mode token, penyiapan interaktif menawarkan:
      - **Hasilkan/simpan token plaintext** (default)
      - **Gunakan SecretRef** (opsional)
      - Quickstart menggunakan kembali SecretRef `gateway.auth.token` yang ada di provider `env`, `file`, dan `exec` untuk probe onboarding/bootstrap dasbor.
      - Jika SecretRef tersebut dikonfigurasi tetapi tidak dapat di-resolve, onboarding gagal lebih awal dengan pesan perbaikan yang jelas alih-alih menurunkan auth runtime secara diam-diam.
    - Dalam mode kata sandi, penyiapan interaktif juga mendukung penyimpanan plaintext atau SecretRef.
    - Path SecretRef token non-interaktif: `--gateway-token-ref-env <ENV_VAR>`.
      - Memerlukan variabel env yang tidak kosong di lingkungan proses onboarding.
      - Tidak dapat digabungkan dengan `--gateway-token`.
    - Nonaktifkan auth hanya jika Anda sepenuhnya memercayai setiap proses lokal.
    - Bind non-loopback tetap memerlukan auth.
  </Step>
  <Step title="Channels">
    - [WhatsApp](/id/channels/whatsapp): login QR opsional.
    - [Telegram](/id/channels/telegram): token bot.
    - [Discord](/id/channels/discord): token bot.
    - [Google Chat](/id/channels/googlechat): JSON service account + audiens webhook.
    - [Mattermost](/id/channels/mattermost) (Plugin): token bot + base URL.
    - [Signal](/id/channels/signal): instalasi `signal-cli` opsional + konfigurasi akun.
    - [BlueBubbles](/id/channels/bluebubbles): **direkomendasikan untuk iMessage**; URL server + kata sandi + webhook.
    - [iMessage](/id/channels/imessage): path CLI `imsg` legacy + akses DB.
    - Keamanan DM: default adalah pairing. DM pertama mengirim kode; setujui melalui `openclaw pairing approve <channel> <code>` atau gunakan allowlist.
  </Step>
  <Step title="Pencarian web">
    - Pilih provider yang didukung seperti Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, atau Tavily (atau lewati).
    - Provider berbasis API dapat menggunakan variabel env atau konfigurasi yang ada untuk penyiapan cepat; provider tanpa key menggunakan prasyarat khusus provider masing-masing.
    - Lewati dengan `--skip-search`.
    - Konfigurasikan nanti: `openclaw configure --section web`.
  </Step>
  <Step title="Instalasi daemon">
    - macOS: LaunchAgent
      - Memerlukan sesi pengguna yang sedang login; untuk headless, gunakan LaunchDaemon kustom (tidak disertakan).
    - Linux (dan Windows melalui WSL2): systemd user unit
      - Onboarding mencoba mengaktifkan lingering melalui `loginctl enable-linger <user>` agar Gateway tetap aktif setelah logout.
      - Mungkin meminta sudo (menulis ke `/var/lib/systemd/linger`); pertama kali mencoba tanpa sudo.
    - **Pemilihan runtime:** Node (direkomendasikan; diperlukan untuk WhatsApp/Telegram). Bun **tidak direkomendasikan**.
    - Jika auth token memerlukan token dan `gateway.auth.token` dikelola SecretRef, instalasi daemon akan memvalidasinya tetapi tidak menyimpan nilai token plaintext yang telah di-resolve ke metadata lingkungan layanan supervisor.
    - Jika auth token memerlukan token dan SecretRef token yang dikonfigurasi belum ter-resolve, instalasi daemon diblokir dengan panduan yang dapat ditindaklanjuti.
    - Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi dan `gateway.auth.mode` belum ditetapkan, instalasi daemon diblokir sampai mode ditetapkan secara eksplisit.
  </Step>
  <Step title="Pemeriksaan kesehatan">
    - Memulai Gateway (jika perlu) dan menjalankan `openclaw health`.
    - Tip: `openclaw status --deep` menambahkan probe kesehatan gateway live ke output status, termasuk probe channel saat didukung (memerlukan gateway yang dapat dijangkau).
  </Step>
  <Step title="Skills (direkomendasikan)">
    - Membaca Skills yang tersedia dan memeriksa persyaratan.
    - Memungkinkan Anda memilih pengelola node: **npm / pnpm** (bun tidak direkomendasikan).
    - Menginstal dependensi opsional (sebagian menggunakan Homebrew di macOS).
  </Step>
  <Step title="Selesai">
    - Ringkasan + langkah berikutnya, termasuk aplikasi iOS/Android/macOS untuk fitur tambahan.
  </Step>
</Steps>

<Note>
Jika tidak ada GUI yang terdeteksi, onboarding mencetak instruksi port-forward SSH untuk Control UI alih-alih membuka browser.
Jika aset Control UI tidak ada, onboarding mencoba membangunnya; fallback adalah `pnpm ui:build` (secara otomatis menginstal dependensi UI).
</Note>

## Mode non-interaktif

Gunakan `--non-interactive` untuk mengotomatiskan atau membuat skrip onboarding:

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

SecretRef token Gateway dalam mode non-interaktif:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token` dan `--gateway-token-ref-env` saling eksklusif.

<Note>
`--json` **tidak** menyiratkan mode non-interaktif. Gunakan `--non-interactive` (dan `--workspace`) untuk skrip.
</Note>

Contoh perintah khusus provider tersedia di [Otomatisasi CLI](/id/start/wizard-cli-automation#provider-specific-examples).
Gunakan halaman referensi ini untuk semantik flag dan urutan langkah.

### Tambah agen (non-interaktif)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.4 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## RPC wizard Gateway

Gateway mengekspos alur onboarding melalui RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
Klien (aplikasi macOS, Control UI) dapat merender langkah tanpa harus mengimplementasikan ulang logika onboarding.

## Penyiapan Signal (`signal-cli`)

Onboarding dapat menginstal `signal-cli` dari rilis GitHub:

- Mengunduh aset rilis yang sesuai.
- Menyimpannya di `~/.openclaw/tools/signal-cli/<version>/`.
- Menulis `channels.signal.cliPath` ke konfigurasi Anda.

Catatan:

- Build JVM memerlukan **Java 21**.
- Build native digunakan saat tersedia.
- Windows menggunakan WSL2; instalasi signal-cli mengikuti alur Linux di dalam WSL.

## Yang ditulis oleh wizard

Field umum di `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (jika MiniMax dipilih)
- `tools.profile` (onboarding lokal default ke `"coding"` saat belum ditetapkan; nilai eksplisit yang sudah ada dipertahankan)
- `gateway.*` (mode, bind, auth, Tailscale)
- `session.dmScope` (detail perilaku: [Referensi Penyiapan CLI](/id/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Allowlist channel (Slack/Discord/Matrix/Microsoft Teams) saat Anda memilih ikut serta selama prompt (nama di-resolve ke ID jika memungkinkan).
- `skills.install.nodeManager`
  - `setup --node-manager` menerima `npm`, `pnpm`, atau `bun`.
  - Konfigurasi manual tetap dapat menggunakan `yarn` dengan menetapkan `skills.install.nodeManager` secara langsung.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` menulis `agents.list[]` dan `bindings` opsional.

Kredensial WhatsApp berada di bawah `~/.openclaw/credentials/whatsapp/<accountId>/`.
Sesi disimpan di bawah `~/.openclaw/agents/<agentId>/sessions/`.

Beberapa channel dikirim sebagai Plugin. Saat Anda memilih salah satunya selama penyiapan, onboarding
akan meminta Anda menginstalnya (npm atau path lokal) sebelum dapat dikonfigurasi.

## Dokumentasi terkait

- Gambaran umum onboarding: [Onboarding (CLI)](/id/start/wizard)
- Onboarding aplikasi macOS: [Onboarding](/id/start/onboarding)
- Referensi konfigurasi: [Konfigurasi Gateway](/id/gateway/configuration)
- Provider: [WhatsApp](/id/channels/whatsapp), [Telegram](/id/channels/telegram), [Discord](/id/channels/discord), [Google Chat](/id/channels/googlechat), [Signal](/id/channels/signal), [BlueBubbles](/id/channels/bluebubbles) (iMessage), [iMessage](/id/channels/imessage) (legacy)
- Skills: [Skills](/id/tools/skills), [Konfigurasi Skills](/id/tools/skills-config)
