---
read_when:
    - Mencari langkah onboarding atau flag tertentu
    - Mengotomatiskan onboarding dengan mode non-interaktif
    - Men-debug perilaku onboarding
sidebarTitle: Onboarding Reference
summary: 'Referensi lengkap untuk onboarding CLI: setiap langkah, flag, dan bidang konfigurasi'
title: Referensi onboarding
x-i18n:
    generated_at: "2026-06-27T18:13:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 739048d53983febc32adaeab10225a288ae66752bee70cfea500d1664fd8546b
    source_path: reference/wizard.md
    workflow: 16
---

Ini adalah referensi lengkap untuk `openclaw onboard`.
Untuk gambaran tingkat tinggi, lihat [Onboarding (CLI)](/id/start/wizard).

## Detail alur (mode lokal)

<Steps>
  <Step title="Deteksi konfigurasi yang ada">
    - Jika `~/.openclaw/openclaw.json` ada, pilih **Pertahankan nilai saat ini**, **Tinjau dan perbarui**, atau **Reset sebelum penyiapan**.
    - Menjalankan ulang onboarding **tidak** menghapus apa pun kecuali Anda secara eksplisit memilih **Reset**
      (atau meneruskan `--reset`).
    - CLI `--reset` default ke `config+creds+sessions`; gunakan `--reset-scope full`
      untuk juga menghapus ruang kerja.
    - Jika konfigurasi tidak valid atau berisi kunci lama, wizard berhenti dan meminta
      Anda menjalankan `openclaw doctor` sebelum melanjutkan.
    - Reset menggunakan `trash` (tidak pernah `rm`) dan menawarkan cakupan:
      - Konfigurasi saja
      - Konfigurasi + kredensial + sesi
      - Reset penuh (juga menghapus ruang kerja)

  </Step>
  <Step title="Model/Auth">
    - **Kunci API Anthropic**: menggunakan `ANTHROPIC_API_KEY` jika ada atau meminta kunci, lalu menyimpannya untuk penggunaan daemon.
    - **Kunci API Anthropic**: pilihan asisten Anthropic yang direkomendasikan dalam onboarding/configure.
    - **setup-token Anthropic**: masih tersedia dalam onboarding/configure, meskipun OpenClaw kini lebih memilih penggunaan ulang Claude CLI saat tersedia.
    - **Langganan OpenAI Code (Codex) (OAuth)**: alur browser; tempel `code#state`.
      - Mengatur `agents.defaults.model` ke `openai/gpt-5.5` melalui runtime Codex saat model belum diatur atau sudah merupakan keluarga OpenAI.
    - **Langganan OpenAI Code (Codex) (pemasangan perangkat)**: alur pemasangan browser dengan kode perangkat berumur pendek.
      - Mengatur `agents.defaults.model` ke `openai/gpt-5.5` melalui runtime Codex saat model belum diatur atau sudah merupakan keluarga OpenAI.
    - **Kunci API OpenAI**: menggunakan `OPENAI_API_KEY` jika ada atau meminta kunci, lalu menyimpannya dalam profil auth.
      - Mengatur `agents.defaults.model` ke `openai/gpt-5.5` saat model belum diatur, `openai/*`, atau referensi model Codex lama.
    - **xAI (Grok) OAuth / kunci API**: masuk dengan xAI OAuth saat dipilih, atau meminta `XAI_API_KEY` pada jalur kunci API, dan mengonfigurasi xAI sebagai penyedia model.
    - **OpenCode**: meminta `OPENCODE_API_KEY` (atau `OPENCODE_ZEN_API_KEY`, dapatkan di https://opencode.ai/auth) dan memungkinkan Anda memilih katalog Zen atau Go.
    - **Ollama**: menawarkan **Cloud + Lokal**, **Hanya cloud**, atau **Hanya lokal** terlebih dahulu. `Cloud only` meminta `OLLAMA_API_KEY` dan menggunakan `https://ollama.com`; mode berbasis host meminta URL dasar Ollama, menemukan model yang tersedia, dan otomatis menarik model lokal yang dipilih saat diperlukan; `Cloud + Local` juga memeriksa apakah host Ollama tersebut sudah masuk untuk akses cloud.
    - Detail selengkapnya: [Ollama](/id/providers/ollama)
    - **Kunci API**: menyimpan kunci untuk Anda.
    - **Vercel AI Gateway (proksi multi-model)**: meminta `AI_GATEWAY_API_KEY`.
    - Detail selengkapnya: [Vercel AI Gateway](/id/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: meminta ID Akun, ID Gateway, dan `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Detail selengkapnya: [Cloudflare AI Gateway](/id/providers/cloudflare-ai-gateway)
    - **MiniMax**: konfigurasi ditulis otomatis; default hosted adalah `MiniMax-M3`.
      Penyiapan kunci API menggunakan `minimax/...`, dan penyiapan OAuth menggunakan
      `minimax-portal/...`.
    - Detail selengkapnya: [MiniMax](/id/providers/minimax)
    - **StepFun**: konfigurasi ditulis otomatis untuk StepFun standar atau Step Plan pada endpoint Tiongkok atau global.
    - Standar saat ini menyertakan `step-3.5-flash`, dan Step Plan juga menyertakan `step-3.5-flash-2603`.
    - Detail selengkapnya: [StepFun](/id/providers/stepfun)
    - **Synthetic (kompatibel dengan Anthropic)**: meminta `SYNTHETIC_API_KEY`.
    - Detail selengkapnya: [Synthetic](/id/providers/synthetic)
    - **Moonshot (Kimi K2)**: konfigurasi ditulis otomatis.
    - **Kimi Coding**: konfigurasi ditulis otomatis.
    - Detail selengkapnya: [Moonshot AI (Kimi + Kimi Coding)](/id/providers/moonshot)
    - **Lewati**: belum ada auth yang dikonfigurasi.
    - Pilih model default dari opsi yang terdeteksi (atau masukkan penyedia/model secara manual). Untuk kualitas terbaik dan risiko prompt-injection yang lebih rendah, pilih model generasi terbaru terkuat yang tersedia dalam stack penyedia Anda.
    - Onboarding menjalankan pemeriksaan model dan memperingatkan jika model yang dikonfigurasi tidak dikenal atau auth tidak ada.
    - Mode penyimpanan kunci API default ke nilai profil auth teks polos. Gunakan `--secret-input-mode ref` untuk menyimpan referensi berbasis env sebagai gantinya (misalnya `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Profil auth berada di `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (kunci API + OAuth). `~/.openclaw/credentials/oauth.json` hanya untuk impor lama.
    - Detail selengkapnya: [/concepts/oauth](/id/concepts/oauth)
    <Note>
    Kiat headless/server: selesaikan OAuth pada mesin dengan browser, lalu salin
    `auth-profiles.json` agen tersebut (misalnya
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, atau jalur
    `$OPENCLAW_STATE_DIR/...` yang sesuai) ke host gateway. `credentials/oauth.json`
    hanya merupakan sumber impor lama.
    </Note>
  </Step>
  <Step title="Ruang kerja">
    - Default `~/.openclaw/workspace` (dapat dikonfigurasi).
    - Mengisi file ruang kerja yang diperlukan untuk ritual bootstrap agen.
    - Tata letak ruang kerja lengkap + panduan pencadangan: [Ruang kerja agen](/id/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - Port, bind, mode auth, eksposur Tailscale.
    - Rekomendasi auth: pertahankan **Token** bahkan untuk loopback agar klien WS lokal harus melakukan autentikasi.
    - Dalam mode token, penyiapan interaktif menawarkan:
      - **Buat/simpan token teks polos** (default)
      - **Gunakan SecretRef** (opt-in)
      - Panduan mulai cepat menggunakan ulang SecretRef `gateway.auth.token` yang ada di seluruh penyedia `env`, `file`, dan `exec` untuk bootstrap probe/dashboard onboarding.
      - Jika SecretRef tersebut dikonfigurasi tetapi tidak dapat di-resolve, onboarding gagal lebih awal dengan pesan perbaikan yang jelas alih-alih diam-diam menurunkan auth runtime.
    - Dalam mode kata sandi, penyiapan interaktif juga mendukung penyimpanan teks polos atau SecretRef.
    - Jalur SecretRef token non-interaktif: `--gateway-token-ref-env <ENV_VAR>`.
      - Memerlukan env var yang tidak kosong dalam lingkungan proses onboarding.
      - Tidak dapat digabungkan dengan `--gateway-token`.
    - Nonaktifkan auth hanya jika Anda sepenuhnya memercayai setiap proses lokal.
    - Bind non-loopback tetap memerlukan auth.

  </Step>
  <Step title="Channel">
    - [WhatsApp](/id/channels/whatsapp): login QR opsional.
    - [Telegram](/id/channels/telegram): token bot.
    - [Discord](/id/channels/discord): token bot.
    - [Google Chat](/id/channels/googlechat): JSON akun layanan + audiens webhook.
    - [Mattermost](/id/channels/mattermost) (plugin): token bot + URL dasar.
    - [Signal](/id/channels/signal): instalasi `signal-cli` opsional + konfigurasi akun.
    - [iMessage](/id/channels/imessage): jalur CLI `imsg` + akses DB Messages; gunakan pembungkus SSH saat Gateway berjalan di luar Mac.
    - Keamanan DM: default adalah pemasangan. DM pertama mengirim kode; setujui melalui `openclaw pairing approve <channel> <code>` atau gunakan allowlist.

  </Step>
  <Step title="Pencarian web">
    - Pilih penyedia yang didukung seperti Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, atau Tavily (atau lewati).
    - Penyedia berbasis API dapat menggunakan env var atau konfigurasi yang ada untuk penyiapan cepat; penyedia tanpa kunci menggunakan prasyarat khusus penyedianya.
    - Lewati dengan `--skip-search`.
    - Konfigurasikan nanti: `openclaw configure --section web`.

  </Step>
  <Step title="Instal daemon">
    - macOS: LaunchAgent
      - Memerlukan sesi pengguna yang sudah masuk; untuk headless, gunakan LaunchDaemon kustom (tidak disertakan).
    - Linux (dan Windows melalui WSL2): unit pengguna systemd
      - Onboarding mencoba mengaktifkan lingering melalui `loginctl enable-linger <user>` agar Gateway tetap berjalan setelah logout.
      - Dapat meminta sudo (menulis `/var/lib/systemd/linger`); ini mencoba tanpa sudo terlebih dahulu.
    - **Pemilihan runtime:** Node (direkomendasikan; diperlukan untuk WhatsApp/Telegram). Bun **tidak direkomendasikan**.
    - Jika auth token memerlukan token dan `gateway.auth.token` dikelola SecretRef, instal daemon memvalidasinya tetapi tidak mempertahankan nilai token teks polos yang di-resolve ke dalam metadata lingkungan layanan supervisor.
    - Jika auth token memerlukan token dan SecretRef token yang dikonfigurasi tidak ter-resolve, instal daemon diblokir dengan panduan yang dapat ditindaklanjuti.
    - Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi dan `gateway.auth.mode` belum diatur, instal daemon diblokir hingga mode diatur secara eksplisit.

  </Step>
  <Step title="Pemeriksaan kesehatan">
    - Memulai Gateway (jika diperlukan) dan menjalankan `openclaw health`.
    - Kiat: `openclaw status --deep` menambahkan probe kesehatan gateway live ke keluaran status, termasuk probe channel saat didukung (memerlukan gateway yang dapat dijangkau).

  </Step>
  <Step title="Skills (direkomendasikan)">
    - Membaca skills yang tersedia dan memeriksa persyaratan.
    - Memungkinkan Anda memilih pengelola node: **npm / pnpm** (bun tidak direkomendasikan).
    - Menginstal dependensi opsional (sebagian menggunakan Homebrew di macOS).

  </Step>
  <Step title="Selesai">
    - Ringkasan + langkah berikutnya, termasuk prompt **Bagaimana Anda ingin menetaskan agen Anda?** untuk Terminal, Browser, atau nanti.

  </Step>
</Steps>

<Note>
Jika tidak ada GUI yang terdeteksi, onboarding mencetak instruksi penerusan port SSH untuk Control UI alih-alih membuka browser.
Jika aset Control UI tidak ada, onboarding mencoba membangunnya; fallback adalah `pnpm ui:build` (otomatis menginstal dependensi UI).
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

Contoh perintah khusus penyedia berada di [Otomatisasi CLI](/id/start/wizard-cli-automation#provider-specific-examples).
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
Klien (aplikasi macOS, Control UI) dapat merender langkah tanpa mengimplementasikan ulang logika onboarding.

## Penyiapan Signal (signal-cli)

Onboarding dapat menginstal `signal-cli` dari rilis GitHub:

- Mengunduh aset rilis yang sesuai.
- Menyimpannya di bawah `~/.openclaw/tools/signal-cli/<version>/`.
- Menulis `channels.signal.cliPath` ke konfigurasi Anda.

Catatan:

- Build JVM memerlukan **Java 21**.
- Build native digunakan saat tersedia.
- Windows menggunakan WSL2; instal signal-cli mengikuti alur Linux di dalam WSL.

## Yang ditulis wizard

Field umum di `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (jika Minimax dipilih)
- `tools.profile` (onboarding lokal default ke `"coding"` saat belum diatur; nilai eksplisit yang sudah ada dipertahankan)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (detail perilaku: [Referensi Penyiapan CLI](/id/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Daftar izin channel (Slack/Discord/Matrix/Microsoft Teams) saat Anda ikut serta selama prompt (nama diselesaikan menjadi ID bila memungkinkan).
- `skills.install.nodeManager`
  - `setup --node-manager` menerima `npm`, `pnpm`, atau `bun`.
  - Konfigurasi manual masih dapat menggunakan `yarn` dengan mengatur `skills.install.nodeManager` secara langsung.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` menulis `agents.list[]` dan `bindings` opsional.

Kredensial WhatsApp ditempatkan di bawah `~/.openclaw/credentials/whatsapp/<accountId>/`.
Sesi disimpan di bawah `~/.openclaw/agents/<agentId>/sessions/`.

Beberapa channel dikirimkan sebagai plugin. Saat Anda memilih salah satunya selama penyiapan, onboarding
akan meminta Anda untuk menginstalnya (npm atau jalur lokal) sebelum dapat dikonfigurasi.

## Dokumen terkait

- Ringkasan onboarding: [Onboarding (CLI)](/id/start/wizard)
- Onboarding aplikasi macOS: [Onboarding](/id/start/onboarding)
- Referensi konfigurasi: [Konfigurasi Gateway](/id/gateway/configuration)
- Penyedia: [WhatsApp](/id/channels/whatsapp), [Telegram](/id/channels/telegram), [Discord](/id/channels/discord), [Google Chat](/id/channels/googlechat), [Signal](/id/channels/signal), [iMessage](/id/channels/imessage)
- Skills: [Skills](/id/tools/skills), [Konfigurasi Skills](/id/tools/skills-config)
