---
read_when:
    - Mencari langkah atau flag onboarding tertentu
    - Mengotomatiskan onboarding dengan mode non-interaktif
    - Men-debug perilaku onboarding
sidebarTitle: Onboarding Reference
summary: 'Referensi lengkap untuk onboarding CLI: setiap langkah, flag, dan bidang konfigurasi'
title: Referensi Onboarding
x-i18n:
    generated_at: "2026-04-05T14:06:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae6c76a31885c0678af2ac71254c5baf08f6de5481f85f6cfdf44d473946fdb8
    source_path: reference/wizard.md
    workflow: 15
---

# Referensi Onboarding

Ini adalah referensi lengkap untuk `openclaw onboard`.
Untuk gambaran umum tingkat tinggi, lihat [Onboarding (CLI)](/start/wizard).

## Detail alur (mode lokal)

<Steps>
  <Step title="Deteksi konfigurasi yang ada">
    - Jika `~/.openclaw/openclaw.json` ada, pilih **Keep / Modify / Reset**.
    - Menjalankan ulang onboarding **tidak** akan menghapus apa pun kecuali Anda secara eksplisit memilih **Reset**
      (atau meneruskan `--reset`).
    - CLI `--reset` secara default menggunakan `config+creds+sessions`; gunakan `--reset-scope full`
      untuk juga menghapus workspace.
    - Jika konfigurasi tidak valid atau berisi kunci lama, wizard berhenti dan meminta
      Anda menjalankan `openclaw doctor` sebelum melanjutkan.
    - Reset menggunakan `trash` (bukan `rm`) dan menawarkan cakupan:
      - Hanya konfigurasi
      - Konfigurasi + kredensial + sesi
      - Reset penuh (juga menghapus workspace)
  </Step>
  <Step title="Model/Auth">
    - **Anthropic API key**: menggunakan `ANTHROPIC_API_KEY` jika ada atau meminta kunci, lalu menyimpannya untuk penggunaan daemon.
    - **Anthropic Claude CLI**: pilihan asisten Anthropic yang disukai dalam onboarding/configure. Di macOS onboarding memeriksa item Keychain "Claude Code-credentials" (pilih "Always Allow" agar peluncuran dari launchd tidak terblokir); di Linux/Windows ini menggunakan kembali `~/.claude/.credentials.json` jika ada dan mengalihkan pemilihan model ke ref `claude-cli/claude-*` kanonis.
    - **Anthropic setup-token (legacy/manual)**: tersedia lagi dalam onboarding/configure, tetapi Anthropic memberi tahu pengguna OpenClaw bahwa jalur login Claude OpenClaw dihitung sebagai penggunaan harness pihak ketiga dan memerlukan **Extra Usage** pada akun Claude.
    - **OpenAI Code (Codex) subscription (Codex CLI)**: jika `~/.codex/auth.json` ada, onboarding dapat menggunakannya kembali. Kredensial Codex CLI yang digunakan ulang tetap dikelola oleh Codex CLI; saat kedaluwarsa, OpenClaw membaca ulang sumber tersebut terlebih dahulu dan, ketika penyedia dapat me-refresh-nya, menulis kembali kredensial yang diperbarui ke penyimpanan Codex alih-alih mengambil alih pengelolaannya.
    - **OpenAI Code (Codex) subscription (OAuth)**: alur browser; tempelkan `code#state`.
      - Menyetel `agents.defaults.model` ke `openai-codex/gpt-5.4` ketika model belum disetel atau `openai/*`.
    - **OpenAI API key**: menggunakan `OPENAI_API_KEY` jika ada atau meminta kunci, lalu menyimpannya dalam profil auth.
      - Menyetel `agents.defaults.model` ke `openai/gpt-5.4` ketika model belum disetel, `openai/*`, atau `openai-codex/*`.
    - **xAI (Grok) API key**: meminta `XAI_API_KEY` dan mengonfigurasi xAI sebagai penyedia model.
    - **OpenCode**: meminta `OPENCODE_API_KEY` (atau `OPENCODE_ZEN_API_KEY`, dapatkan di https://opencode.ai/auth) dan memungkinkan Anda memilih katalog Zen atau Go.
    - **Ollama**: meminta URL dasar Ollama, menawarkan mode **Cloud + Local** atau **Local**, menemukan model yang tersedia, dan otomatis menarik model lokal yang dipilih saat diperlukan.
    - Detail lebih lanjut: [Ollama](/id/providers/ollama)
    - **API key**: menyimpan kunci untuk Anda.
    - **Vercel AI Gateway (proxy multi-model)**: meminta `AI_GATEWAY_API_KEY`.
    - Detail lebih lanjut: [Vercel AI Gateway](/id/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: meminta Account ID, Gateway ID, dan `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Detail lebih lanjut: [Cloudflare AI Gateway](/id/providers/cloudflare-ai-gateway)
    - **MiniMax**: konfigurasi ditulis otomatis; default terhosting adalah `MiniMax-M2.7`.
      Penyiapan API key menggunakan `minimax/...`, dan penyiapan OAuth menggunakan
      `minimax-portal/...`.
    - Detail lebih lanjut: [MiniMax](/id/providers/minimax)
    - **StepFun**: konfigurasi ditulis otomatis untuk StepFun standard atau Step Plan pada endpoint China atau global.
    - Standard saat ini mencakup `step-3.5-flash`, dan Step Plan juga mencakup `step-3.5-flash-2603`.
    - Detail lebih lanjut: [StepFun](/id/providers/stepfun)
    - **Synthetic (kompatibel Anthropic)**: meminta `SYNTHETIC_API_KEY`.
    - Detail lebih lanjut: [Synthetic](/id/providers/synthetic)
    - **Moonshot (Kimi K2)**: konfigurasi ditulis otomatis.
    - **Kimi Coding**: konfigurasi ditulis otomatis.
    - Detail lebih lanjut: [Moonshot AI (Kimi + Kimi Coding)](/id/providers/moonshot)
    - **Skip**: auth belum dikonfigurasi.
    - Pilih model default dari opsi yang terdeteksi (atau masukkan penyedia/model secara manual). Untuk kualitas terbaik dan risiko prompt injection yang lebih rendah, pilih model generasi terbaru terkuat yang tersedia di stack penyedia Anda.
    - Onboarding menjalankan pemeriksaan model dan memperingatkan jika model yang dikonfigurasi tidak dikenal atau auth tidak ada.
    - Mode penyimpanan API key secara default menggunakan nilai profil auth plaintext. Gunakan `--secret-input-mode ref` untuk menyimpan ref berbasis env sebagai gantinya (misalnya `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Profil auth berada di `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (API key + OAuth). `~/.openclaw/credentials/oauth.json` adalah sumber impor lama saja.
    - Detail lebih lanjut: [/concepts/oauth](/id/concepts/oauth)
    <Note>
    Tips headless/server: selesaikan OAuth di mesin yang memiliki browser, lalu salin
    `auth-profiles.json` agen tersebut (misalnya
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, atau path
    `$OPENCLAW_STATE_DIR/...` yang sesuai) ke host gateway. `credentials/oauth.json`
    hanya merupakan sumber impor lama.
    </Note>
  </Step>
  <Step title="Workspace">
    - Default `~/.openclaw/workspace` (dapat dikonfigurasi).
    - Mengisi file workspace yang diperlukan untuk ritual bootstrap agen.
    - Tata letak workspace lengkap + panduan cadangan: [Workspace agen](/id/concepts/agent-workspace)
  </Step>
  <Step title="Gateway">
    - Port, bind, mode auth, eksposur tailscale.
    - Rekomendasi auth: tetap gunakan **Token** bahkan untuk loopback agar klien WS lokal harus melakukan autentikasi.
    - Dalam mode token, penyiapan interaktif menawarkan:
      - **Generate/store plaintext token** (default)
      - **Use SecretRef** (opsional)
      - Quickstart menggunakan kembali SecretRef `gateway.auth.token` yang ada di seluruh penyedia `env`, `file`, dan `exec` untuk bootstrap probe/dashboard onboarding.
      - Jika SecretRef tersebut dikonfigurasi tetapi tidak dapat diresolusikan, onboarding gagal lebih awal dengan pesan perbaikan yang jelas alih-alih menurunkan auth runtime secara diam-diam.
    - Dalam mode password, penyiapan interaktif juga mendukung penyimpanan plaintext atau SecretRef.
    - Jalur SecretRef token non-interaktif: `--gateway-token-ref-env <ENV_VAR>`.
      - Memerlukan variabel env yang tidak kosong di lingkungan proses onboarding.
      - Tidak dapat digabungkan dengan `--gateway-token`.
    - Nonaktifkan auth hanya jika Anda sepenuhnya memercayai setiap proses lokal.
    - Bind non-loopback tetap memerlukan auth.
  </Step>
  <Step title="Channels">
    - [WhatsApp](/id/channels/whatsapp): login QR opsional.
    - [Telegram](/id/channels/telegram): token bot.
    - [Discord](/id/channels/discord): token bot.
    - [Google Chat](/id/channels/googlechat): JSON akun layanan + audiens webhook.
    - [Mattermost](/id/channels/mattermost) (plugin): token bot + URL dasar.
    - [Signal](/id/channels/signal): instalasi `signal-cli` opsional + konfigurasi akun.
    - [BlueBubbles](/id/channels/bluebubbles): **direkomendasikan untuk iMessage**; URL server + password + webhook.
    - [iMessage](/id/channels/imessage): jalur CLI `imsg` lama + akses DB.
    - Keamanan DM: default-nya adalah pairing. DM pertama mengirim kode; setujui melalui `openclaw pairing approve <channel> <code>` atau gunakan allowlist.
  </Step>
  <Step title="Pencarian web">
    - Pilih penyedia yang didukung seperti Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, atau Tavily (atau lewati).
    - Penyedia berbasis API dapat menggunakan variabel env atau konfigurasi yang ada untuk penyiapan cepat; penyedia tanpa kunci menggunakan prasyarat khusus penyedianya.
    - Lewati dengan `--skip-search`.
    - Konfigurasi nanti: `openclaw configure --section web`.
  </Step>
  <Step title="Instalasi daemon">
    - macOS: LaunchAgent
      - Memerlukan sesi pengguna yang login; untuk headless, gunakan LaunchDaemon kustom (tidak disertakan).
    - Linux (dan Windows melalui WSL2): unit pengguna systemd
      - Onboarding mencoba mengaktifkan lingering melalui `loginctl enable-linger <user>` agar Gateway tetap berjalan setelah logout.
      - Mungkin meminta sudo (menulis ke `/var/lib/systemd/linger`); pertama-tama mencoba tanpa sudo.
    - **Pemilihan runtime:** Node (direkomendasikan; diperlukan untuk WhatsApp/Telegram). Bun **tidak direkomendasikan**.
    - Jika auth token memerlukan token dan `gateway.auth.token` dikelola oleh SecretRef, instalasi daemon memvalidasinya tetapi tidak menyimpan nilai token plaintext yang telah diresolusikan ke dalam metadata lingkungan layanan supervisor.
    - Jika auth token memerlukan token dan token SecretRef yang dikonfigurasi belum teresolusikan, instalasi daemon diblokir dengan panduan yang dapat ditindaklanjuti.
    - Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi dan `gateway.auth.mode` belum disetel, instalasi daemon diblokir sampai mode disetel secara eksplisit.
  </Step>
  <Step title="Pemeriksaan kesehatan">
    - Memulai Gateway (jika perlu) dan menjalankan `openclaw health`.
    - Tip: `openclaw status --deep` menambahkan probe kesehatan gateway live ke output status, termasuk probe channel jika didukung (memerlukan gateway yang dapat dijangkau).
  </Step>
  <Step title="Skills (direkomendasikan)">
    - Membaca Skills yang tersedia dan memeriksa persyaratan.
    - Memungkinkan Anda memilih pengelola node: **npm / pnpm** (bun tidak direkomendasikan).
    - Menginstal dependensi opsional (beberapa menggunakan Homebrew di macOS).
  </Step>
  <Step title="Selesai">
    - Ringkasan + langkah berikutnya, termasuk aplikasi iOS/Android/macOS untuk fitur tambahan.
  </Step>
</Steps>

<Note>
Jika tidak ada GUI yang terdeteksi, onboarding mencetak instruksi port-forward SSH untuk UI Kontrol alih-alih membuka browser.
Jika aset UI Kontrol tidak ada, onboarding mencoba membangunnya; fallback-nya adalah `pnpm ui:build` (secara otomatis menginstal dependensi UI).
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

Gateway token SecretRef dalam mode non-interaktif:

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

Contoh perintah khusus penyedia tersedia di [Otomatisasi CLI](/start/wizard-cli-automation#provider-specific-examples).
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
Klien (aplikasi macOS, UI Kontrol) dapat merender langkah tanpa mengimplementasikan ulang logika onboarding.

## Penyiapan Signal (signal-cli)

Onboarding dapat menginstal `signal-cli` dari rilis GitHub:

- Mengunduh aset rilis yang sesuai.
- Menyimpannya di `~/.openclaw/tools/signal-cli/<version>/`.
- Menulis `channels.signal.cliPath` ke konfigurasi Anda.

Catatan:

- Build JVM memerlukan **Java 21**.
- Build native digunakan jika tersedia.
- Windows menggunakan WSL2; instalasi signal-cli mengikuti alur Linux di dalam WSL.

## Yang ditulis oleh wizard

Bidang umum di `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (jika Minimax dipilih)
- `tools.profile` (onboarding lokal secara default menggunakan `"coding"` saat belum disetel; nilai eksplisit yang sudah ada dipertahankan)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (detail perilaku: [Referensi Penyiapan CLI](/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Allowlist channel (Slack/Discord/Matrix/Microsoft Teams) saat Anda memilihnya selama prompt (nama diresolusikan menjadi ID jika memungkinkan).
- `skills.install.nodeManager`
  - `setup --node-manager` menerima `npm`, `pnpm`, atau `bun`.
  - Konfigurasi manual masih dapat menggunakan `yarn` dengan menyetel `skills.install.nodeManager` secara langsung.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` menulis `agents.list[]` dan `bindings` opsional.

Kredensial WhatsApp berada di `~/.openclaw/credentials/whatsapp/<accountId>/`.
Sesi disimpan di `~/.openclaw/agents/<agentId>/sessions/`.

Beberapa channel dikirim sebagai plugin. Saat Anda memilih salah satunya selama penyiapan, onboarding
akan meminta untuk menginstalnya (npm atau jalur lokal) sebelum dapat dikonfigurasi.

## Dokumen terkait

- Gambaran umum onboarding: [Onboarding (CLI)](/start/wizard)
- Onboarding aplikasi macOS: [Onboarding](/start/onboarding)
- Referensi konfigurasi: [Konfigurasi Gateway](/id/gateway/configuration)
- Penyedia: [WhatsApp](/id/channels/whatsapp), [Telegram](/id/channels/telegram), [Discord](/id/channels/discord), [Google Chat](/id/channels/googlechat), [Signal](/id/channels/signal), [BlueBubbles](/id/channels/bluebubbles) (iMessage), [iMessage](/id/channels/imessage) (lama)
- Skills: [Skills](/tools/skills), [Konfigurasi Skills](/tools/skills-config)
