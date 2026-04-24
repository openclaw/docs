---
read_when:
    - Anda memerlukan perilaku terperinci untuk openclaw onboard
    - Anda sedang men-debug hasil onboarding atau mengintegrasikan klien onboarding
sidebarTitle: CLI reference
summary: Referensi lengkap untuk alur setup CLI, penyiapan auth/model, output, dan internal
title: Referensi setup CLI
x-i18n:
    generated_at: "2026-04-24T09:28:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: e4b9377e84a6f8063f20a80fe08b5ea2eccdd5b329ec8dfd9d16cbf425d01f66
    source_path: start/wizard-cli-reference.md
    workflow: 15
---

Halaman ini adalah referensi lengkap untuk `openclaw onboard`.
Untuk panduan singkat, lihat [Onboarding (CLI)](/id/start/wizard).

## Apa yang dilakukan wizard

Mode lokal (default) memandu Anda melalui:

- Setup model dan auth (OpenAI Code subscription OAuth, Anthropic Claude CLI atau API key, plus MiniMax, GLM, Ollama, Moonshot, StepFun, dan opsi AI Gateway)
- Lokasi workspace dan file bootstrap
- Pengaturan Gateway (port, bind, auth, tailscale)
- Kanal dan provider (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, BlueBubbles, dan Plugin kanal bawaan lainnya)
- Instalasi daemon (LaunchAgent, systemd user unit, atau Scheduled Task native Windows dengan fallback folder Startup)
- Pemeriksaan kesehatan
- Setup Skills

Mode remote mengonfigurasi mesin ini untuk terhubung ke gateway di tempat lain.
Mode ini tidak menginstal atau memodifikasi apa pun di host remote.

## Detail alur lokal

<Steps>
  <Step title="Deteksi konfigurasi yang ada">
    - Jika `~/.openclaw/openclaw.json` ada, pilih Keep, Modify, atau Reset.
    - Menjalankan wizard lagi tidak menghapus apa pun kecuali Anda secara eksplisit memilih Reset (atau meneruskan `--reset`).
    - `--reset` pada CLI default ke `config+creds+sessions`; gunakan `--reset-scope full` untuk juga menghapus workspace.
    - Jika konfigurasi tidak valid atau berisi key legacy, wizard berhenti dan meminta Anda menjalankan `openclaw doctor` sebelum melanjutkan.
    - Reset menggunakan `trash` dan menawarkan cakupan:
      - Hanya konfigurasi
      - Konfigurasi + kredensial + sesi
      - Reset penuh (juga menghapus workspace)
  </Step>
  <Step title="Model dan auth">
    - Matriks opsi lengkap ada di [Opsi auth dan model](#auth-and-model-options).
  </Step>
  <Step title="Workspace">
    - Default `~/.openclaw/workspace` (dapat dikonfigurasi).
    - Menanam file workspace yang diperlukan untuk ritual bootstrap pertama.
    - Tata letak workspace: [Workspace agen](/id/concepts/agent-workspace).
  </Step>
  <Step title="Gateway">
    - Meminta port, bind, mode auth, dan eksposur tailscale.
    - Rekomendasi: tetap aktifkan auth token bahkan untuk loopback agar klien WS lokal harus terautentikasi.
    - Dalam mode token, setup interaktif menawarkan:
      - **Generate/store plaintext token** (default)
      - **Use SecretRef** (opt-in)
    - Dalam mode password, setup interaktif juga mendukung penyimpanan plaintext atau SecretRef.
    - Jalur SecretRef token non-interaktif: `--gateway-token-ref-env <ENV_VAR>`.
      - Memerlukan env var yang tidak kosong di lingkungan proses onboarding.
      - Tidak dapat digabungkan dengan `--gateway-token`.
    - Nonaktifkan auth hanya jika Anda sepenuhnya mempercayai setiap proses lokal.
    - Bind non-loopback tetap memerlukan auth.
  </Step>
  <Step title="Kanal">
    - [WhatsApp](/id/channels/whatsapp): login QR opsional
    - [Telegram](/id/channels/telegram): token bot
    - [Discord](/id/channels/discord): token bot
    - [Google Chat](/id/channels/googlechat): service account JSON + webhook audience
    - [Mattermost](/id/channels/mattermost): token bot + base URL
    - [Signal](/id/channels/signal): instalasi `signal-cli` opsional + konfigurasi akun
    - [BlueBubbles](/id/channels/bluebubbles): direkomendasikan untuk iMessage; URL server + password + webhook
    - [iMessage](/id/channels/imessage): path CLI `imsg` legacy + akses DB
    - Keamanan DM: default adalah pairing. DM pertama mengirim kode; setujui melalui
      `openclaw pairing approve <channel> <code>` atau gunakan allowlist.
  </Step>
  <Step title="Instalasi daemon">
    - macOS: LaunchAgent
      - Memerlukan sesi pengguna yang login; untuk headless, gunakan LaunchDaemon kustom (tidak dikirimkan).
    - Linux dan Windows melalui WSL2: systemd user unit
      - Wizard mencoba `loginctl enable-linger <user>` agar gateway tetap aktif setelah logout.
      - Dapat meminta sudo (menulis ke `/var/lib/systemd/linger`); wizard mencoba tanpa sudo terlebih dahulu.
    - Native Windows: Scheduled Task terlebih dahulu
      - Jika pembuatan task ditolak, OpenClaw fallback ke item login folder Startup per pengguna dan memulai gateway segera.
      - Scheduled Task tetap diprioritaskan karena memberikan status supervisor yang lebih baik.
    - Pemilihan runtime: Node (direkomendasikan; diperlukan untuk WhatsApp dan Telegram). Bun tidak direkomendasikan.
  </Step>
  <Step title="Pemeriksaan kesehatan">
    - Memulai gateway (jika diperlukan) dan menjalankan `openclaw health`.
    - `openclaw status --deep` menambahkan probe kesehatan gateway live ke output status, termasuk probe kanal jika didukung.
  </Step>
  <Step title="Skills">
    - Membaca Skills yang tersedia dan memeriksa requirement.
    - Memungkinkan Anda memilih node manager: npm, pnpm, atau bun.
    - Menginstal dependensi opsional (beberapa menggunakan Homebrew di macOS).
  </Step>
  <Step title="Selesai">
    - Ringkasan dan langkah selanjutnya, termasuk opsi aplikasi iOS, Android, dan macOS.
  </Step>
</Steps>

<Note>
Jika tidak ada GUI yang terdeteksi, wizard mencetak instruksi SSH port-forward untuk Control UI alih-alih membuka browser.
Jika aset Control UI hilang, wizard mencoba membangunnya; fallback-nya adalah `pnpm ui:build` (menginstal dependensi UI secara otomatis).
</Note>

## Detail mode remote

Mode remote mengonfigurasi mesin ini untuk terhubung ke gateway di tempat lain.

<Info>
Mode remote tidak menginstal atau memodifikasi apa pun di host remote.
</Info>

Yang Anda atur:

- URL gateway remote (`ws://...`)
- Token jika auth gateway remote diperlukan (direkomendasikan)

<Note>
- Jika gateway hanya-loopback, gunakan tunneling SSH atau tailnet.
- Petunjuk discovery:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)
</Note>

## Opsi auth dan model

<AccordionGroup>
  <Accordion title="API key Anthropic">
    Menggunakan `ANTHROPIC_API_KEY` jika ada atau meminta key, lalu menyimpannya untuk penggunaan daemon.
  </Accordion>
  <Accordion title="OpenAI Code subscription (OAuth)">
    Alur browser; tempel `code#state`.

    Menyetel `agents.defaults.model` ke `openai-codex/gpt-5.5` ketika model belum diatur atau sudah termasuk keluarga OpenAI.

  </Accordion>
  <Accordion title="OpenAI Code subscription (device pairing)">
    Alur pairing browser dengan kode perangkat berumur pendek.

    Menyetel `agents.defaults.model` ke `openai-codex/gpt-5.5` ketika model belum diatur atau sudah termasuk keluarga OpenAI.

  </Accordion>
  <Accordion title="API key OpenAI">
    Menggunakan `OPENAI_API_KEY` jika ada atau meminta key, lalu menyimpan kredensial di profil auth.

    Menyetel `agents.defaults.model` ke `openai/gpt-5.4` ketika model belum diatur, `openai/*`, atau `openai-codex/*`.

  </Accordion>
  <Accordion title="API key xAI (Grok)">
    Meminta `XAI_API_KEY` dan mengonfigurasi xAI sebagai provider model.
  </Accordion>
  <Accordion title="OpenCode">
    Meminta `OPENCODE_API_KEY` (atau `OPENCODE_ZEN_API_KEY`) dan memungkinkan Anda memilih katalog Zen atau Go.
    URL setup: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="API key (generik)">
    Menyimpan key untuk Anda.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    Meminta `AI_GATEWAY_API_KEY`.
    Detail lebih lanjut: [Vercel AI Gateway](/id/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Meminta account ID, gateway ID, dan `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Detail lebih lanjut: [Cloudflare AI Gateway](/id/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    Konfigurasi ditulis otomatis. Default hosted adalah `MiniMax-M2.7`; setup API key menggunakan
    `minimax/...`, dan setup OAuth menggunakan `minimax-portal/...`.
    Detail lebih lanjut: [MiniMax](/id/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    Konfigurasi ditulis otomatis untuk StepFun standard atau Step Plan pada endpoint China atau global.
    Standar saat ini mencakup `step-3.5-flash`, dan Step Plan juga mencakup `step-3.5-flash-2603`.
    Detail lebih lanjut: [StepFun](/id/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (kompatibel dengan Anthropic)">
    Meminta `SYNTHETIC_API_KEY`.
    Detail lebih lanjut: [Synthetic](/id/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud dan model terbuka lokal)">
    Meminta `Cloud + Local`, `Cloud only`, atau `Local only` terlebih dahulu.
    `Cloud only` menggunakan `OLLAMA_API_KEY` dengan `https://ollama.com`.
    Mode berbasis host akan meminta base URL (default `http://127.0.0.1:11434`), menemukan model yang tersedia, dan menyarankan default.
    `Cloud + Local` juga memeriksa apakah host Ollama tersebut telah login untuk akses cloud.
    Detail lebih lanjut: [Ollama](/id/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot dan Kimi Coding">
    Konfigurasi Moonshot (Kimi K2) dan Kimi Coding ditulis otomatis.
    Detail lebih lanjut: [Moonshot AI (Kimi + Kimi Coding)](/id/providers/moonshot).
  </Accordion>
  <Accordion title="Provider kustom">
    Bekerja dengan endpoint yang kompatibel dengan OpenAI dan Anthropic.

    Onboarding interaktif mendukung pilihan penyimpanan API key yang sama seperti alur API key provider lainnya:
    - **Paste API key now** (plaintext)
    - **Use secret reference** (env ref atau provider ref yang dikonfigurasi, dengan validasi preflight)

    Flag non-interaktif:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (opsional; fallback ke `CUSTOM_API_KEY`)
    - `--custom-provider-id` (opsional)
    - `--custom-compatibility <openai|anthropic>` (opsional; default `openai`)

  </Accordion>
  <Accordion title="Lewati">
    Membiarkan auth tidak dikonfigurasi.
  </Accordion>
</AccordionGroup>

Perilaku model:

- Pilih model default dari opsi yang terdeteksi, atau masukkan provider dan model secara manual.
- Saat onboarding dimulai dari pilihan auth provider, pemilih model akan mengutamakan
  provider tersebut secara otomatis. Untuk Volcengine dan BytePlus, preferensi yang sama
  juga mencocokkan varian coding-plan mereka (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Jika filter preferred-provider itu kosong, pemilih akan fallback ke
  katalog penuh alih-alih menampilkan tidak ada model.
- Wizard menjalankan pemeriksaan model dan memperingatkan jika model yang dikonfigurasi tidak dikenal atau auth-nya hilang.

Path kredensial dan profil:

- Profil auth (API key + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Impor OAuth legacy: `~/.openclaw/credentials/oauth.json`

Mode penyimpanan kredensial:

- Perilaku onboarding default mempertahankan API key sebagai nilai plaintext dalam profil auth.
- `--secret-input-mode ref` mengaktifkan mode referensi alih-alih penyimpanan key plaintext.
  Dalam setup interaktif, Anda dapat memilih salah satu:
  - referensi environment variable (misalnya `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - referensi provider yang dikonfigurasi (`file` atau `exec`) dengan alias + id provider
- Mode referensi interaktif menjalankan validasi preflight cepat sebelum menyimpan.
  - Env ref: memvalidasi nama variabel + nilai tidak kosong di lingkungan onboarding saat ini.
  - Provider ref: memvalidasi konfigurasi provider dan menyelesaikan id yang diminta.
  - Jika preflight gagal, onboarding menampilkan error dan memungkinkan Anda mencoba lagi.
- Dalam mode non-interaktif, `--secret-input-mode ref` hanya berbasis env.
  - Setel env var provider di lingkungan proses onboarding.
  - Flag key inline (misalnya `--openai-api-key`) memerlukan env var tersebut diatur; jika tidak onboarding gagal cepat.
  - Untuk provider kustom, mode `ref` non-interaktif menyimpan `models.providers.<id>.apiKey` sebagai `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - Dalam kasus provider kustom tersebut, `--custom-api-key` memerlukan `CUSTOM_API_KEY` diatur; jika tidak onboarding gagal cepat.
- Kredensial auth gateway mendukung pilihan plaintext dan SecretRef dalam setup interaktif:
  - Mode token: **Generate/store plaintext token** (default) atau **Use SecretRef**.
  - Mode password: plaintext atau SecretRef.
- Jalur SecretRef token non-interaktif: `--gateway-token-ref-env <ENV_VAR>`.
- Setup plaintext yang sudah ada tetap berfungsi tanpa perubahan.

<Note>
Tip headless dan server: selesaikan OAuth di mesin dengan browser, lalu salin
`auth-profiles.json` milik agen tersebut (misalnya
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, atau path
`$OPENCLAW_STATE_DIR/...` yang sesuai) ke host gateway. `credentials/oauth.json`
hanya merupakan sumber impor legacy.
</Note>

## Output dan internal

Field umum dalam `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (jika MiniMax dipilih)
- `tools.profile` (onboarding lokal mengatur default ini ke `"coding"` ketika tidak diatur; nilai eksplisit yang sudah ada dipertahankan)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (onboarding lokal mengatur default ini ke `per-channel-peer` ketika tidak diatur; nilai eksplisit yang sudah ada dipertahankan)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Allowlist kanal (Slack, Discord, Matrix, Microsoft Teams) ketika Anda memilihnya selama prompt (nama diselesaikan ke ID bila memungkinkan)
- `skills.install.nodeManager`
  - Flag `setup --node-manager` menerima `npm`, `pnpm`, atau `bun`.
  - Konfigurasi manual tetap dapat mengatur `skills.install.nodeManager: "yarn"` nanti.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` menulis `agents.list[]` dan `bindings` opsional.

Kredensial WhatsApp berada di bawah `~/.openclaw/credentials/whatsapp/<accountId>/`.
Sesi disimpan di bawah `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
Beberapa kanal dikirim sebagai plugin. Ketika dipilih selama setup, wizard
akan meminta untuk menginstal plugin tersebut (npm atau path lokal) sebelum konfigurasi kanal.
</Note>

RPC wizard Gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Klien (aplikasi macOS dan Control UI) dapat merender langkah tanpa mengimplementasikan ulang logika onboarding.

Perilaku setup Signal:

- Mengunduh release asset yang sesuai
- Menyimpannya di bawah `~/.openclaw/tools/signal-cli/<version>/`
- Menulis `channels.signal.cliPath` dalam konfigurasi
- Build JVM memerlukan Java 21
- Build native digunakan saat tersedia
- Windows menggunakan WSL2 dan mengikuti alur signal-cli Linux di dalam WSL

## Dokumentasi terkait

- Hub onboarding: [Onboarding (CLI)](/id/start/wizard)
- Otomatisasi dan skrip: [CLI Automation](/id/start/wizard-cli-automation)
- Referensi perintah: [`openclaw onboard`](/id/cli/onboard)
