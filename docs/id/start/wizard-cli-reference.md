---
read_when:
    - Anda memerlukan perilaku terperinci untuk `openclaw onboard`
    - Anda sedang men-debug hasil onboarding atau mengintegrasikan klien onboarding
sidebarTitle: CLI reference
summary: Referensi lengkap untuk alur penyiapan CLI, penyiapan auth/model, output, dan internal
title: Referensi penyiapan CLI
x-i18n:
    generated_at: "2026-04-26T11:39:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: a967fd6734d8facaa732b40567c33e48434208bf861d102adc8a4ee042f13041
    source_path: start/wizard-cli-reference.md
    workflow: 15
---

Halaman ini adalah referensi lengkap untuk `openclaw onboard`.
Untuk panduan singkat, lihat [Onboarding (CLI)](/id/start/wizard).

## Apa yang dilakukan wizard

Mode lokal (default) memandu Anda melalui:

- Penyiapan model dan autentikasi (langganan OpenAI Code OAuth, Anthropic Claude CLI atau kunci API, serta opsi MiniMax, GLM, Ollama, Moonshot, StepFun, dan AI Gateway)
- Lokasi workspace dan file bootstrap
- Pengaturan Gateway (port, bind, auth, Tailscale)
- Channel dan provider (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, BlueBubbles, dan plugin channel bawaan lainnya)
- Instalasi daemon (LaunchAgent, systemd user unit, atau Scheduled Task Windows native dengan fallback folder Startup)
- Pemeriksaan kesehatan
- Penyiapan Skills

Mode remote mengonfigurasi mesin ini untuk terhubung ke Gateway di tempat lain.
Mode ini tidak menginstal atau memodifikasi apa pun di host remote.

## Detail alur lokal

<Steps>
  <Step title="Deteksi konfigurasi yang ada">
    - Jika `~/.openclaw/openclaw.json` ada, pilih Keep, Modify, atau Reset.
    - Menjalankan ulang wizard tidak akan menghapus apa pun kecuali Anda secara eksplisit memilih Reset (atau memberikan `--reset`).
    - CLI `--reset` default ke `config+creds+sessions`; gunakan `--reset-scope full` untuk juga menghapus workspace.
    - Jika konfigurasi tidak valid atau berisi kunci lama, wizard berhenti dan meminta Anda menjalankan `openclaw doctor` sebelum melanjutkan.
    - Reset menggunakan `trash` dan menawarkan cakupan:
      - Hanya konfigurasi
      - Konfigurasi + kredensial + sesi
      - Reset penuh (juga menghapus workspace)
  </Step>
  <Step title="Model dan autentikasi">
    - Matriks opsi lengkap ada di [Opsi auth dan model](#auth-and-model-options).
  </Step>
  <Step title="Workspace">
    - Default `~/.openclaw/workspace` (dapat dikonfigurasi).
    - Menyiapkan file workspace yang diperlukan untuk ritual bootstrap saat pertama kali dijalankan.
    - Tata letak workspace: [Workspace agent](/id/concepts/agent-workspace).
  </Step>
  <Step title="Gateway">
    - Meminta port, bind, mode auth, dan eksposur Tailscale.
    - Rekomendasi: tetap aktifkan auth token bahkan untuk loopback agar klien WS lokal tetap harus diautentikasi.
    - Dalam mode token, penyiapan interaktif menawarkan:
      - **Buat/simpan token plaintext** (default)
      - **Gunakan SecretRef** (opsional)
    - Dalam mode kata sandi, penyiapan interaktif juga mendukung penyimpanan plaintext atau SecretRef.
    - Jalur SecretRef token non-interaktif: `--gateway-token-ref-env <ENV_VAR>`.
      - Memerlukan env var yang tidak kosong di lingkungan proses onboarding.
      - Tidak dapat digabungkan dengan `--gateway-token`.
    - Nonaktifkan auth hanya jika Anda sepenuhnya memercayai setiap proses lokal.
    - Bind non-loopback tetap memerlukan auth.
  </Step>
  <Step title="Channel">
    - [WhatsApp](/id/channels/whatsapp): login QR opsional
    - [Telegram](/id/channels/telegram): token bot
    - [Discord](/id/channels/discord): token bot
    - [Google Chat](/id/channels/googlechat): JSON service account + audiens webhook
    - [Mattermost](/id/channels/mattermost): token bot + URL dasar
    - [Signal](/id/channels/signal): instalasi `signal-cli` opsional + konfigurasi akun
    - [BlueBubbles](/id/channels/bluebubbles): direkomendasikan untuk iMessage; URL server + kata sandi + webhook
    - [iMessage](/id/channels/imessage): path CLI `imsg` lama + akses DB
    - Keamanan DM: default-nya adalah pairing. DM pertama mengirim kode; setujui melalui
      `openclaw pairing approve <channel> <code>` atau gunakan allowlist.
  </Step>
  <Step title="Instalasi daemon">
    - macOS: LaunchAgent
      - Memerlukan sesi pengguna yang sedang login; untuk headless, gunakan LaunchDaemon kustom (tidak disertakan).
    - Linux dan Windows melalui WSL2: systemd user unit
      - Wizard mencoba `loginctl enable-linger <user>` agar gateway tetap aktif setelah logout.
      - Mungkin meminta sudo (menulis `/var/lib/systemd/linger`); wizard mencoba tanpa sudo terlebih dahulu.
    - Windows native: Scheduled Task terlebih dahulu
      - Jika pembuatan task ditolak, OpenClaw akan menggunakan fallback item login folder Startup per pengguna dan langsung memulai gateway.
      - Scheduled Task tetap lebih disukai karena menyediakan status supervisor yang lebih baik.
    - Pemilihan runtime: Node (direkomendasikan; wajib untuk WhatsApp dan Telegram). Bun tidak direkomendasikan.
  </Step>
  <Step title="Pemeriksaan kesehatan">
    - Memulai gateway (jika perlu) dan menjalankan `openclaw health`.
    - `openclaw status --deep` menambahkan probe kesehatan gateway langsung ke output status, termasuk probe channel bila didukung.
  </Step>
  <Step title="Skills">
    - Membaca Skills yang tersedia dan memeriksa persyaratan.
    - Memungkinkan Anda memilih node manager: npm, pnpm, atau bun.
    - Menginstal dependensi opsional (beberapa menggunakan Homebrew di macOS).
  </Step>
  <Step title="Selesai">
    - Ringkasan dan langkah berikutnya, termasuk opsi aplikasi iOS, Android, dan macOS.
  </Step>
</Steps>

<Note>
Jika tidak ada GUI yang terdeteksi, wizard mencetak instruksi port-forward SSH untuk Control UI alih-alih membuka browser.
Jika aset Control UI tidak ada, wizard mencoba membangunnya; fallback-nya adalah `pnpm ui:build` (secara otomatis menginstal dependensi UI).
</Note>

## Detail mode remote

Mode remote mengonfigurasi mesin ini untuk terhubung ke Gateway di tempat lain.

<Info>
Mode remote tidak menginstal atau memodifikasi apa pun di host remote.
</Info>

Yang Anda atur:

- URL Gateway remote (`ws://...`)
- Token jika auth Gateway remote diperlukan (direkomendasikan)

<Note>
- Jika gateway hanya loopback, gunakan tunneling SSH atau tailnet.
- Petunjuk penemuan:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)
</Note>

## Opsi auth dan model

<AccordionGroup>
  <Accordion title="Kunci API Anthropic">
    Menggunakan `ANTHROPIC_API_KEY` jika ada atau meminta kunci, lalu menyimpannya untuk penggunaan daemon.
  </Accordion>
  <Accordion title="Langganan OpenAI Code (OAuth)">
    Alur browser; tempel `code#state`.

    Menetapkan `agents.defaults.model` ke `openai-codex/gpt-5.5` saat model belum disetel atau sudah termasuk keluarga OpenAI.

  </Accordion>
  <Accordion title="Langganan OpenAI Code (pairing perangkat)">
    Alur pairing browser dengan kode perangkat yang berlaku singkat.

    Menetapkan `agents.defaults.model` ke `openai-codex/gpt-5.5` saat model belum disetel atau sudah termasuk keluarga OpenAI.

  </Accordion>
  <Accordion title="Kunci API OpenAI">
    Menggunakan `OPENAI_API_KEY` jika ada atau meminta kunci, lalu menyimpan kredensial dalam profil auth.

    Menetapkan `agents.defaults.model` ke `openai/gpt-5.5` saat model belum disetel, `openai/*`, atau `openai-codex/*`.

  </Accordion>
  <Accordion title="Kunci API xAI (Grok)">
    Meminta `XAI_API_KEY` dan mengonfigurasi xAI sebagai provider model.
  </Accordion>
  <Accordion title="OpenCode">
    Meminta `OPENCODE_API_KEY` (atau `OPENCODE_ZEN_API_KEY`) dan memungkinkan Anda memilih katalog Zen atau Go.
    URL penyiapan: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="Kunci API (generik)">
    Menyimpan kunci untuk Anda.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    Meminta `AI_GATEWAY_API_KEY`.
    Detail selengkapnya: [Vercel AI Gateway](/id/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Meminta account ID, gateway ID, dan `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Detail selengkapnya: [Cloudflare AI Gateway](/id/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    Konfigurasi ditulis secara otomatis. Default hosted adalah `MiniMax-M2.7`; penyiapan kunci API menggunakan
    `minimax/...`, dan penyiapan OAuth menggunakan `minimax-portal/...`.
    Detail selengkapnya: [MiniMax](/id/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    Konfigurasi ditulis secara otomatis untuk StepFun standard atau Step Plan pada endpoint China atau global.
    Standard saat ini mencakup `step-3.5-flash`, dan Step Plan juga mencakup `step-3.5-flash-2603`.
    Detail selengkapnya: [StepFun](/id/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (kompatibel Anthropic)">
    Meminta `SYNTHETIC_API_KEY`.
    Detail selengkapnya: [Synthetic](/id/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud dan model terbuka lokal)">
    Meminta `Cloud + Local`, `Cloud only`, atau `Local only` terlebih dahulu.
    `Cloud only` menggunakan `OLLAMA_API_KEY` dengan `https://ollama.com`.
    Mode berbasis host meminta URL dasar (default `http://127.0.0.1:11434`), menemukan model yang tersedia, dan menyarankan default.
    `Cloud + Local` juga memeriksa apakah host Ollama tersebut sudah login untuk akses cloud.
    Detail selengkapnya: [Ollama](/id/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot dan Kimi Coding">
    Konfigurasi Moonshot (Kimi K2) dan Kimi Coding ditulis secara otomatis.
    Detail selengkapnya: [Moonshot AI (Kimi + Kimi Coding)](/id/providers/moonshot).
  </Accordion>
  <Accordion title="Provider kustom">
    Berfungsi dengan endpoint yang kompatibel dengan OpenAI dan Anthropic.

    Onboarding interaktif mendukung pilihan penyimpanan kunci API yang sama seperti alur kunci API provider lainnya:
    - **Tempel kunci API sekarang** (plaintext)
    - **Gunakan referensi secret** (referensi env atau referensi provider yang dikonfigurasi, dengan validasi preflight)

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
- Saat onboarding dimulai dari pilihan auth provider, pemilih model secara otomatis memprioritaskan
  provider tersebut. Untuk Volcengine dan BytePlus, preferensi yang sama
  juga mencocokkan varian coding-plan mereka (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Jika filter provider yang diprioritaskan itu kosong, pemilih akan kembali ke
  katalog lengkap alih-alih tidak menampilkan model sama sekali.
- Wizard menjalankan pemeriksaan model dan memperingatkan jika model yang dikonfigurasi tidak dikenal atau auth-nya tidak ada.

Path kredensial dan profil:

- Profil auth (kunci API + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Impor OAuth lama: `~/.openclaw/credentials/oauth.json`

Mode penyimpanan kredensial:

- Perilaku onboarding default menyimpan kunci API sebagai nilai plaintext dalam profil auth.
- `--secret-input-mode ref` mengaktifkan mode referensi alih-alih penyimpanan kunci plaintext.
  Dalam penyiapan interaktif, Anda dapat memilih salah satu:
  - referensi environment variable (misalnya `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - referensi provider yang dikonfigurasi (`file` atau `exec`) dengan alias provider + id
- Mode referensi interaktif menjalankan validasi preflight cepat sebelum menyimpan.
  - Referensi env: memvalidasi nama variabel + nilai yang tidak kosong di lingkungan onboarding saat ini.
  - Referensi provider: memvalidasi konfigurasi provider dan me-resolve id yang diminta.
  - Jika preflight gagal, onboarding menampilkan error dan memungkinkan Anda mencoba lagi.
- Dalam mode non-interaktif, `--secret-input-mode ref` hanya didukung berbasis env.
  - Setel env var provider di lingkungan proses onboarding.
  - Flag kunci inline (misalnya `--openai-api-key`) mengharuskan env var tersebut disetel; jika tidak, onboarding gagal dengan cepat.
  - Untuk provider kustom, mode `ref` non-interaktif menyimpan `models.providers.<id>.apiKey` sebagai `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - Dalam kasus provider kustom tersebut, `--custom-api-key` mengharuskan `CUSTOM_API_KEY` disetel; jika tidak, onboarding gagal dengan cepat.
- Kredensial auth Gateway mendukung pilihan plaintext dan SecretRef dalam penyiapan interaktif:
  - Mode token: **Buat/simpan token plaintext** (default) atau **Gunakan SecretRef**.
  - Mode kata sandi: plaintext atau SecretRef.
- Jalur SecretRef token non-interaktif: `--gateway-token-ref-env <ENV_VAR>`.
- Penyiapan plaintext yang sudah ada tetap berfungsi tanpa perubahan.

<Note>
Tips headless dan server: selesaikan OAuth di mesin dengan browser, lalu salin
`auth-profiles.json` milik agent tersebut (misalnya
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, atau path
`$OPENCLAW_STATE_DIR/...` yang sesuai) ke host gateway. `credentials/oauth.json`
hanyalah sumber impor lama.
</Note>

## Output dan internal

Field umum dalam `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` saat `--skip-bootstrap` diberikan
- `agents.defaults.model` / `models.providers` (jika MiniMax dipilih)
- `tools.profile` (onboarding lokal default ke `"coding"` saat belum disetel; nilai eksplisit yang sudah ada dipertahankan)
- `gateway.*` (mode, bind, auth, Tailscale)
- `session.dmScope` (onboarding lokal menetapkan default ini ke `per-channel-peer` saat belum disetel; nilai eksplisit yang sudah ada dipertahankan)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Allowlist channel (Slack, Discord, Matrix, Microsoft Teams) saat Anda ikut serta selama prompt (nama di-resolve ke ID jika memungkinkan)
- `skills.install.nodeManager`
  - Flag `setup --node-manager` menerima `npm`, `pnpm`, atau `bun`.
  - Konfigurasi manual tetap dapat menetapkan `skills.install.nodeManager: "yarn"` nanti.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` menulis `agents.list[]` dan `bindings` opsional.

Kredensial WhatsApp disimpan di `~/.openclaw/credentials/whatsapp/<accountId>/`.
Sesi disimpan di `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
Beberapa channel disediakan sebagai Plugin. Saat dipilih selama penyiapan, wizard
meminta Anda menginstal Plugin tersebut (npm atau path lokal) sebelum konfigurasi channel.
</Note>

RPC wizard Gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Klien (aplikasi macOS dan Control UI) dapat merender langkah-langkah tanpa mengimplementasikan ulang logika onboarding.

Perilaku penyiapan Signal:

- Mengunduh aset rilis yang sesuai
- Menyimpannya di `~/.openclaw/tools/signal-cli/<version>/`
- Menulis `channels.signal.cliPath` dalam konfigurasi
- Build JVM memerlukan Java 21
- Build native digunakan saat tersedia
- Windows menggunakan WSL2 dan mengikuti alur Linux signal-cli di dalam WSL

## Dokumen terkait

- Pusat onboarding: [Onboarding (CLI)](/id/start/wizard)
- Otomatisasi dan skrip: [CLI Automation](/id/start/wizard-cli-automation)
- Referensi perintah: [`openclaw onboard`](/id/cli/onboard)
