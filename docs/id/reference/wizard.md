---
read_when:
    - Mencari langkah orientasi atau tanda tertentu
    - Mengotomatiskan orientasi dengan mode non-interaktif
    - Menelusuri kesalahan perilaku orientasi awal
sidebarTitle: Onboarding Reference
summary: 'Referensi lengkap untuk penyiapan awal CLI: setiap langkah, flag, dan bidang konfigurasi'
title: Referensi orientasi awal
x-i18n:
    generated_at: "2026-04-30T10:12:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 412008af223cd14f744a0b553ab82f233eb482ca9991bd418f29b09b33d93de4
    source_path: reference/wizard.md
    workflow: 16
---

Ini adalah referensi lengkap untuk `openclaw onboard`.
Untuk gambaran tingkat tinggi, lihat [Onboarding (CLI)](/id/start/wizard).

## Detail alur (mode lokal)

<Steps>
  <Step title="Deteksi konfigurasi yang ada">
    - Jika `~/.openclaw/openclaw.json` ada, pilih **Pertahankan / Ubah / Reset**.
    - Menjalankan ulang onboarding **tidak** menghapus apa pun kecuali Anda secara eksplisit memilih **Reset**
      (atau meneruskan `--reset`).
    - CLI `--reset` default ke `config+creds+sessions`; gunakan `--reset-scope full`
      untuk juga menghapus workspace.
    - Jika konfigurasi tidak valid atau berisi kunci lama, wizard berhenti dan meminta
      Anda menjalankan `openclaw doctor` sebelum melanjutkan.
    - Reset menggunakan `trash` (tidak pernah `rm`) dan menawarkan cakupan:
      - Hanya konfigurasi
      - Konfigurasi + kredensial + sesi
      - Reset penuh (juga menghapus workspace)

  </Step>
  <Step title="Model/Auth">
    - **Kunci API Anthropic**: menggunakan `ANTHROPIC_API_KEY` jika ada atau meminta kunci, lalu menyimpannya untuk penggunaan daemon.
    - **Kunci API Anthropic**: pilihan asisten Anthropic yang disarankan dalam onboarding/configure.
    - **setup-token Anthropic**: masih tersedia dalam onboarding/configure, meskipun OpenClaw kini lebih memilih penggunaan ulang Claude CLI jika tersedia.
    - **Langganan OpenAI Code (Codex) (OAuth)**: alur browser; tempel `code#state`.
      - Menyetel `agents.defaults.model` ke `openai-codex/gpt-5.5` ketika model belum disetel atau sudah termasuk keluarga OpenAI.
    - **Langganan OpenAI Code (Codex) (pemasangan perangkat)**: alur pemasangan browser dengan kode perangkat berumur pendek.
      - Menyetel `agents.defaults.model` ke `openai-codex/gpt-5.5` ketika model belum disetel atau sudah termasuk keluarga OpenAI.
    - **Kunci API OpenAI**: menggunakan `OPENAI_API_KEY` jika ada atau meminta kunci, lalu menyimpannya di profil auth.
      - Menyetel `agents.defaults.model` ke `openai/gpt-5.5` ketika model belum disetel, `openai/*`, atau `openai-codex/*`.
    - **Kunci API xAI (Grok)**: meminta `XAI_API_KEY` dan mengonfigurasi xAI sebagai penyedia model.
    - **OpenCode**: meminta `OPENCODE_API_KEY` (atau `OPENCODE_ZEN_API_KEY`, dapatkan di https://opencode.ai/auth) dan memungkinkan Anda memilih katalog Zen atau Go.
    - **Ollama**: menawarkan **Cloud + Local**, **Cloud only**, atau **Local only** terlebih dahulu. `Cloud only` meminta `OLLAMA_API_KEY` dan menggunakan `https://ollama.com`; mode berbasis host meminta URL dasar Ollama, menemukan model yang tersedia, dan menarik otomatis model lokal yang dipilih saat diperlukan; `Cloud + Local` juga memeriksa apakah host Ollama tersebut sudah masuk untuk akses cloud.
    - Detail selengkapnya: [Ollama](/id/providers/ollama)
    - **Kunci API**: menyimpan kunci untuk Anda.
    - **Vercel AI Gateway (proxy multi-model)**: meminta `AI_GATEWAY_API_KEY`.
    - Detail selengkapnya: [Vercel AI Gateway](/id/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: meminta Account ID, Gateway ID, dan `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Detail selengkapnya: [Cloudflare AI Gateway](/id/providers/cloudflare-ai-gateway)
    - **MiniMax**: konfigurasi ditulis otomatis; default terhosting adalah `MiniMax-M2.7`.
      Penyiapan kunci API menggunakan `minimax/...`, dan penyiapan OAuth menggunakan
      `minimax-portal/...`.
    - Detail selengkapnya: [MiniMax](/id/providers/minimax)
    - **StepFun**: konfigurasi ditulis otomatis untuk StepFun standar atau Step Plan di endpoint China atau global.
    - Standar saat ini mencakup `step-3.5-flash`, dan Step Plan juga mencakup `step-3.5-flash-2603`.
    - Detail selengkapnya: [StepFun](/id/providers/stepfun)
    - **Synthetic (kompatibel dengan Anthropic)**: meminta `SYNTHETIC_API_KEY`.
    - Detail selengkapnya: [Synthetic](/id/providers/synthetic)
    - **Moonshot (Kimi K2)**: konfigurasi ditulis otomatis.
    - **Kimi Coding**: konfigurasi ditulis otomatis.
    - Detail selengkapnya: [Moonshot AI (Kimi + Kimi Coding)](/id/providers/moonshot)
    - **Lewati**: belum ada auth yang dikonfigurasi.
    - Pilih model default dari opsi yang terdeteksi (atau masukkan provider/model secara manual). Untuk kualitas terbaik dan risiko prompt-injection yang lebih rendah, pilih model generasi terbaru terkuat yang tersedia di stack penyedia Anda.
    - Onboarding menjalankan pemeriksaan model dan memperingatkan jika model yang dikonfigurasi tidak dikenal atau auth hilang.
    - Mode penyimpanan kunci API default ke nilai profil auth teks biasa. Gunakan `--secret-input-mode ref` untuk menyimpan referensi berbasis env sebagai gantinya (misalnya `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Profil auth berada di `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (kunci API + OAuth). `~/.openclaw/credentials/oauth.json` hanya impor lama.
    - Detail selengkapnya: [/concepts/oauth](/id/concepts/oauth)
    <Note>
    Kiat headless/server: selesaikan OAuth di mesin dengan browser, lalu salin
    `auth-profiles.json` milik agent tersebut (misalnya
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, atau jalur
    `$OPENCLAW_STATE_DIR/...` yang sesuai) ke host gateway. `credentials/oauth.json`
    hanya sumber impor lama.
    </Note>
  </Step>
  <Step title="Workspace">
    - Default `~/.openclaw/workspace` (dapat dikonfigurasi).
    - Menyiapkan file workspace yang diperlukan untuk ritual bootstrap agent.
    - Tata letak workspace lengkap + panduan pencadangan: [Workspace agent](/id/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - Port, bind, mode auth, paparan tailscale.
    - Rekomendasi auth: pertahankan **Token** bahkan untuk loopback agar klien WS lokal harus melakukan autentikasi.
    - Dalam mode token, penyiapan interaktif menawarkan:
      - **Buat/simpan token teks biasa** (default)
      - **Gunakan SecretRef** (ikut serta)
      - Quickstart menggunakan ulang SecretRef `gateway.auth.token` yang ada di penyedia `env`, `file`, dan `exec` untuk probe onboarding/bootstrap dashboard.
      - Jika SecretRef tersebut dikonfigurasi tetapi tidak dapat diselesaikan, onboarding gagal lebih awal dengan pesan perbaikan yang jelas alih-alih menurunkan auth runtime secara diam-diam.
    - Dalam mode kata sandi, penyiapan interaktif juga mendukung penyimpanan teks biasa atau SecretRef.
    - Jalur SecretRef token non-interaktif: `--gateway-token-ref-env <ENV_VAR>`.
      - Memerlukan env var tidak kosong di lingkungan proses onboarding.
      - Tidak dapat digabungkan dengan `--gateway-token`.
    - Nonaktifkan auth hanya jika Anda sepenuhnya memercayai setiap proses lokal.
    - Bind non-loopback tetap memerlukan auth.

  </Step>
  <Step title="Channel">
    - [WhatsApp](/id/channels/whatsapp): login QR opsional.
    - [Telegram](/id/channels/telegram): token bot.
    - [Discord](/id/channels/discord): token bot.
    - [Google Chat](/id/channels/googlechat): JSON akun layanan + audiens webhook.
    - [Mattermost](/id/channels/mattermost) (Plugin): token bot + URL dasar.
    - [Signal](/id/channels/signal): instalasi `signal-cli` opsional + konfigurasi akun.
    - [BlueBubbles](/id/channels/bluebubbles): **direkomendasikan untuk iMessage**; URL server + kata sandi + Webhook.
    - [iMessage](/id/channels/imessage): jalur CLI `imsg` lama + akses DB.
    - Keamanan DM: default adalah pemasangan. DM pertama mengirim kode; setujui melalui `openclaw pairing approve <channel> <code>` atau gunakan allowlist.

  </Step>
  <Step title="Pencarian web">
    - Pilih penyedia yang didukung seperti Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, atau Tavily (atau lewati).
    - Penyedia berbasis API dapat menggunakan env var atau konfigurasi yang ada untuk penyiapan cepat; penyedia tanpa kunci menggunakan prasyarat khusus penyedia masing-masing.
    - Lewati dengan `--skip-search`.
    - Konfigurasikan nanti: `openclaw configure --section web`.

  </Step>
  <Step title="Instalasi daemon">
    - macOS: LaunchAgent
      - Memerlukan sesi pengguna yang sudah masuk; untuk headless, gunakan LaunchDaemon kustom (tidak disertakan).
    - Linux (dan Windows melalui WSL2): unit pengguna systemd
      - Onboarding mencoba mengaktifkan lingering melalui `loginctl enable-linger <user>` agar Gateway tetap berjalan setelah logout.
      - Dapat meminta sudo (menulis `/var/lib/systemd/linger`); mencoba tanpa sudo terlebih dahulu.
    - **Pemilihan runtime:** Node (direkomendasikan; diperlukan untuk WhatsApp/Telegram). Bun **tidak direkomendasikan**.
    - Jika auth token memerlukan token dan `gateway.auth.token` dikelola SecretRef, instalasi daemon memvalidasinya tetapi tidak mempertahankan nilai token teks biasa yang diselesaikan ke metadata lingkungan layanan supervisor.
    - Jika auth token memerlukan token dan SecretRef token yang dikonfigurasi tidak terselesaikan, instalasi daemon diblokir dengan panduan yang dapat ditindaklanjuti.
    - Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi dan `gateway.auth.mode` belum disetel, instalasi daemon diblokir sampai mode disetel secara eksplisit.

  </Step>
  <Step title="Pemeriksaan kesehatan">
    - Memulai Gateway (jika diperlukan) dan menjalankan `openclaw health`.
    - Kiat: `openclaw status --deep` menambahkan probe kesehatan gateway langsung ke output status, termasuk probe channel jika didukung (memerlukan gateway yang dapat dijangkau).

  </Step>
  <Step title="Skills (direkomendasikan)">
    - Membaca skills yang tersedia dan memeriksa persyaratan.
    - Memungkinkan Anda memilih manajer node: **npm / pnpm** (bun tidak direkomendasikan).
    - Menginstal dependensi opsional (sebagian menggunakan Homebrew di macOS).

  </Step>
  <Step title="Selesai">
    - Ringkasan + langkah berikutnya, termasuk aplikasi iOS/Android/macOS untuk fitur tambahan.

  </Step>
</Steps>

<Note>
Jika tidak ada GUI yang terdeteksi, onboarding mencetak instruksi SSH port-forward untuk Control UI alih-alih membuka browser.
Jika aset Control UI hilang, onboarding mencoba membangunnya; fallback adalah `pnpm ui:build` (menginstal otomatis dependensi UI).
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

Contoh perintah khusus penyedia tersedia di [Otomatisasi CLI](/id/start/wizard-cli-automation#provider-specific-examples).
Gunakan halaman referensi ini untuk semantik flag dan urutan langkah.

### Tambah agent (non-interaktif)

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
Klien (aplikasi macOS, Control UI) dapat merender langkah tanpa mengimplementasikan ulang logika onboarding.

## Penyiapan Signal (signal-cli)

Onboarding dapat menginstal `signal-cli` dari rilis GitHub:

- Mengunduh aset rilis yang sesuai.
- Menyimpannya di bawah `~/.openclaw/tools/signal-cli/<version>/`.
- Menulis `channels.signal.cliPath` ke konfigurasi Anda.

Catatan:

- Build JVM memerlukan **Java 21**.
- Build native digunakan jika tersedia.
- Windows menggunakan WSL2; instalasi signal-cli mengikuti alur Linux di dalam WSL.

## Yang ditulis wizard

Field umum di `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (jika Minimax dipilih)
- `tools.profile` (onboarding lokal default ke `"coding"` saat belum diatur; nilai eksplisit yang sudah ada dipertahankan)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (detail perilaku: [Referensi Penyiapan CLI](/id/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Daftar izin channel (Slack/Discord/Matrix/Microsoft Teams) saat Anda ikut serta selama prompt (nama akan di-resolve menjadi ID jika memungkinkan).
- `skills.install.nodeManager`
  - `setup --node-manager` menerima `npm`, `pnpm`, atau `bun`.
  - Konfigurasi manual tetap dapat menggunakan `yarn` dengan mengatur `skills.install.nodeManager` secara langsung.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` menulis `agents.list[]` dan `bindings` opsional.

Kredensial WhatsApp berada di bawah `~/.openclaw/credentials/whatsapp/<accountId>/`.
Sesi disimpan di bawah `~/.openclaw/agents/<agentId>/sessions/`.

Beberapa channel dikirimkan sebagai plugins. Saat Anda memilih salah satunya selama penyiapan, onboarding
akan meminta untuk menginstalnya (npm atau path lokal) sebelum dapat dikonfigurasi.

## Dokumen terkait

- Ikhtisar onboarding: [Onboarding (CLI)](/id/start/wizard)
- Onboarding aplikasi macOS: [Onboarding](/id/start/onboarding)
- Referensi konfigurasi: [Konfigurasi Gateway](/id/gateway/configuration)
- Penyedia: [WhatsApp](/id/channels/whatsapp), [Telegram](/id/channels/telegram), [Discord](/id/channels/discord), [Google Chat](/id/channels/googlechat), [Signal](/id/channels/signal), [BlueBubbles](/id/channels/bluebubbles) (iMessage), [iMessage](/id/channels/imessage) (lama)
- Skills: [Skills](/id/tools/skills), [Konfigurasi Skills](/id/tools/skills-config)
