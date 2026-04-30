---
read_when:
    - Anda memerlukan perilaku terperinci untuk openclaw onboard
    - Anda sedang mendiagnosis hasil orientasi atau mengintegrasikan klien orientasi
sidebarTitle: CLI reference
summary: Referensi lengkap untuk alur penyiapan CLI, penyiapan autentikasi/model, keluaran, dan internal
title: Referensi penyiapan CLI
x-i18n:
    generated_at: "2026-04-30T10:12:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d40a63ff27d6aaf4cda167ad0cdf3ad7c4f61ecf92d1cf51b5a0237b24917a7
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

Halaman ini adalah referensi lengkap untuk `openclaw onboard`.
Untuk panduan singkat, lihat [Onboarding (CLI)](/id/start/wizard).

## Yang dilakukan wizard

Mode lokal (default) memandu Anda melalui:

- Penyiapan model dan auth (OAuth langganan OpenAI Code, Anthropic Claude CLI atau API key, plus opsi MiniMax, GLM, Ollama, Moonshot, StepFun, dan AI Gateway)
- Lokasi workspace dan file bootstrap
- Pengaturan Gateway (port, bind, auth, tailscale)
- Channel dan penyedia (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, BlueBubbles, dan Plugin channel bawaan lainnya)
- Instalasi daemon (LaunchAgent, unit pengguna systemd, atau Windows Scheduled Task native dengan fallback folder Startup)
- Health check
- Penyiapan Skills

Mode remote mengonfigurasi mesin ini untuk terhubung ke Gateway di tempat lain.
Mode ini tidak menginstal atau mengubah apa pun di host remote.

## Detail alur lokal

<Steps>
  <Step title="Deteksi konfigurasi yang sudah ada">
    - Jika `~/.openclaw/openclaw.json` ada, pilih Keep, Modify, atau Reset.
    - Menjalankan ulang wizard tidak menghapus apa pun kecuali Anda secara eksplisit memilih Reset (atau meneruskan `--reset`).
    - CLI `--reset` default ke `config+creds+sessions`; gunakan `--reset-scope full` untuk juga menghapus workspace.
    - Jika konfigurasi tidak valid atau berisi kunci legacy, wizard berhenti dan meminta Anda menjalankan `openclaw doctor` sebelum melanjutkan.
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
    - Menanam file workspace yang diperlukan untuk ritual bootstrap saat pertama kali dijalankan.
    - Tata letak workspace: [Workspace agen](/id/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - Meminta port, bind, mode auth, dan eksposur tailscale.
    - Direkomendasikan: tetap aktifkan auth token bahkan untuk loopback agar klien WS lokal harus melakukan autentikasi.
    - Dalam mode token, penyiapan interaktif menawarkan:
      - **Buat/simpan token plaintext** (default)
      - **Gunakan SecretRef** (opt-in)
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
    - [Google Chat](/id/channels/googlechat): JSON akun layanan + audiens webhook
    - [Mattermost](/id/channels/mattermost): token bot + URL dasar
    - [Signal](/id/channels/signal): instalasi `signal-cli` opsional + konfigurasi akun
    - [BlueBubbles](/id/channels/bluebubbles): direkomendasikan untuk iMessage; URL server + kata sandi + webhook
    - [iMessage](/id/channels/imessage): jalur CLI `imsg` legacy + akses DB
    - Keamanan DM: default adalah pairing. DM pertama mengirim kode; setujui melalui
      `openclaw pairing approve <channel> <code>` atau gunakan allowlist.
  </Step>
  <Step title="Instalasi daemon">
    - macOS: LaunchAgent
      - Memerlukan sesi pengguna yang sedang login; untuk headless, gunakan LaunchDaemon kustom (tidak dikirimkan).
    - Linux dan Windows melalui WSL2: unit pengguna systemd
      - Wizard mencoba `loginctl enable-linger <user>` agar Gateway tetap aktif setelah logout.
      - Dapat meminta sudo (menulis `/var/lib/systemd/linger`); wizard mencoba tanpa sudo terlebih dahulu.
    - Windows native: Scheduled Task terlebih dahulu
      - Jika pembuatan task ditolak, OpenClaw beralih ke item login folder Startup per pengguna dan langsung memulai Gateway.
      - Scheduled Tasks tetap lebih disukai karena memberikan status supervisor yang lebih baik.
    - Pilihan runtime: Node (direkomendasikan; diperlukan untuk WhatsApp dan Telegram). Bun tidak direkomendasikan.

  </Step>
  <Step title="Health check">
    - Memulai Gateway (jika diperlukan) dan menjalankan `openclaw health`.
    - `openclaw status --deep` menambahkan probe kesehatan Gateway live ke output status, termasuk probe channel saat didukung.

  </Step>
  <Step title="Skills">
    - Membaca Skills yang tersedia dan memeriksa persyaratan.
    - Memungkinkan Anda memilih manajer node: npm, pnpm, atau bun.
    - Menginstal dependensi opsional (beberapa menggunakan Homebrew di macOS).

  </Step>
  <Step title="Selesai">
    - Ringkasan dan langkah berikutnya, termasuk opsi aplikasi iOS, Android, dan macOS.

  </Step>
</Steps>

<Note>
Jika tidak ada GUI yang terdeteksi, wizard mencetak instruksi SSH port-forward untuk Control UI alih-alih membuka browser.
Jika aset Control UI hilang, wizard mencoba membangunnya; fallback adalah `pnpm ui:build` (menginstal dependensi UI secara otomatis).
</Note>

## Detail mode remote

Mode remote mengonfigurasi mesin ini untuk terhubung ke Gateway di tempat lain.

<Info>
Mode remote tidak menginstal atau mengubah apa pun di host remote.
</Info>

Yang Anda atur:

- URL Gateway remote (`ws://...`)
- Token jika auth Gateway remote diperlukan (direkomendasikan)

<Note>
- Jika Gateway hanya loopback, gunakan SSH tunneling atau tailnet.
- Petunjuk discovery:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)

</Note>

## Opsi auth dan model

<AccordionGroup>
  <Accordion title="API key Anthropic">
    Menggunakan `ANTHROPIC_API_KEY` jika ada atau meminta kunci, lalu menyimpannya untuk penggunaan daemon.
  </Accordion>
  <Accordion title="Langganan OpenAI Code (OAuth)">
    Alur browser; tempel `code#state`.

    Mengatur `agents.defaults.model` ke `openai-codex/gpt-5.5` saat model belum diatur atau sudah keluarga OpenAI.

  </Accordion>
  <Accordion title="Langganan OpenAI Code (pairing perangkat)">
    Alur pairing browser dengan kode perangkat berumur pendek.

    Mengatur `agents.defaults.model` ke `openai-codex/gpt-5.5` saat model belum diatur atau sudah keluarga OpenAI.

  </Accordion>
  <Accordion title="API key OpenAI">
    Menggunakan `OPENAI_API_KEY` jika ada atau meminta kunci, lalu menyimpan kredensial di profil auth.

    Mengatur `agents.defaults.model` ke `openai/gpt-5.5` saat model belum diatur, `openai/*`, atau `openai-codex/*`.

  </Accordion>
  <Accordion title="API key xAI (Grok)">
    Meminta `XAI_API_KEY` dan mengonfigurasi xAI sebagai penyedia model.
  </Accordion>
  <Accordion title="OpenCode">
    Meminta `OPENCODE_API_KEY` (atau `OPENCODE_ZEN_API_KEY`) dan memungkinkan Anda memilih katalog Zen atau Go.
    URL penyiapan: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="API key (generik)">
    Menyimpan kunci untuk Anda.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    Meminta `AI_GATEWAY_API_KEY`.
    Detail selengkapnya: [Vercel AI Gateway](/id/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Meminta ID akun, ID Gateway, dan `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Detail selengkapnya: [Cloudflare AI Gateway](/id/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    Konfigurasi ditulis otomatis. Default hosted adalah `MiniMax-M2.7`; penyiapan API-key menggunakan
    `minimax/...`, dan penyiapan OAuth menggunakan `minimax-portal/...`.
    Detail selengkapnya: [MiniMax](/id/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    Konfigurasi ditulis otomatis untuk StepFun standard atau Step Plan pada endpoint Tiongkok atau global.
    Standard saat ini mencakup `step-3.5-flash`, dan Step Plan juga mencakup `step-3.5-flash-2603`.
    Detail selengkapnya: [StepFun](/id/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (kompatibel Anthropic)">
    Meminta `SYNTHETIC_API_KEY`.
    Detail selengkapnya: [Synthetic](/id/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud dan model open lokal)">
    Meminta `Cloud + Local`, `Cloud only`, atau `Local only` terlebih dahulu.
    `Cloud only` menggunakan `OLLAMA_API_KEY` dengan `https://ollama.com`.
    Mode berbasis host meminta URL dasar (default `http://127.0.0.1:11434`), menemukan model yang tersedia, dan menyarankan default.
    `Cloud + Local` juga memeriksa apakah host Ollama tersebut sudah masuk untuk akses cloud.
    Detail selengkapnya: [Ollama](/id/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot dan Kimi Coding">
    Konfigurasi Moonshot (Kimi K2) dan Kimi Coding ditulis otomatis.
    Detail selengkapnya: [Moonshot AI (Kimi + Kimi Coding)](/id/providers/moonshot).
  </Accordion>
  <Accordion title="Penyedia kustom">
    Berfungsi dengan endpoint yang kompatibel OpenAI dan kompatibel Anthropic.

    Onboarding interaktif mendukung pilihan penyimpanan API key yang sama seperti alur API key penyedia lainnya:
    - **Tempel API key sekarang** (plaintext)
    - **Gunakan referensi rahasia** (env ref atau ref penyedia yang dikonfigurasi, dengan validasi preflight)

    Flag non-interaktif:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (opsional; fallback ke `CUSTOM_API_KEY`)
    - `--custom-provider-id` (opsional)
    - `--custom-compatibility <openai|anthropic>` (opsional; default `openai`)
    - `--custom-image-input` / `--custom-text-input` (opsional; mengganti kemampuan input model yang disimpulkan)

  </Accordion>
  <Accordion title="Lewati">
    Membiarkan auth tidak dikonfigurasi.
  </Accordion>
</AccordionGroup>

Perilaku model:

- Pilih model default dari opsi yang terdeteksi, atau masukkan penyedia dan model secara manual.
- Onboarding penyedia kustom menyimpulkan dukungan gambar untuk ID model umum dan hanya bertanya saat nama model tidak diketahui.
- Saat onboarding dimulai dari pilihan auth penyedia, pemilih model otomatis memprioritaskan
  penyedia tersebut. Untuk Volcengine dan BytePlus, preferensi yang sama
  juga cocok dengan varian coding-plan mereka (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Jika filter penyedia pilihan tersebut akan kosong, pemilih kembali ke
  katalog lengkap alih-alih tidak menampilkan model apa pun.
- Wizard menjalankan pemeriksaan model dan memperingatkan jika model yang dikonfigurasi tidak diketahui atau auth hilang.

Jalur kredensial dan profil:

- Profil auth (API key + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Impor OAuth legacy: `~/.openclaw/credentials/oauth.json`

Mode penyimpanan kredensial:

- Perilaku onboarding default menyimpan API key sebagai nilai plaintext di profil auth.
- `--secret-input-mode ref` mengaktifkan mode referensi alih-alih penyimpanan kunci plaintext.
  Dalam penyiapan interaktif, Anda dapat memilih salah satu:
  - ref environment variable (misalnya `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - ref penyedia yang dikonfigurasi (`file` atau `exec`) dengan alias penyedia + id
- Mode referensi interaktif menjalankan validasi preflight cepat sebelum menyimpan.
  - Env refs: memvalidasi nama variabel + nilai tidak kosong di lingkungan onboarding saat ini.
  - Provider refs: memvalidasi konfigurasi penyedia dan menyelesaikan id yang diminta.
  - Jika preflight gagal, onboarding menampilkan error dan memungkinkan Anda mencoba lagi.
- Dalam mode non-interaktif, `--secret-input-mode ref` hanya berbasis env.
  - Atur env var penyedia di lingkungan proses onboarding.
  - Flag kunci inline (misalnya `--openai-api-key`) mengharuskan env var tersebut diatur; jika tidak, onboarding gagal cepat.
  - Untuk penyedia kustom, mode `ref` non-interaktif menyimpan `models.providers.<id>.apiKey` sebagai `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - Dalam kasus penyedia kustom tersebut, `--custom-api-key` mengharuskan `CUSTOM_API_KEY` diatur; jika tidak, onboarding gagal cepat.
- Kredensial auth Gateway mendukung pilihan plaintext dan SecretRef dalam penyiapan interaktif:
  - Mode token: **Buat/simpan token plaintext** (default) atau **Gunakan SecretRef**.
  - Mode kata sandi: plaintext atau SecretRef.
- Jalur SecretRef token non-interaktif: `--gateway-token-ref-env <ENV_VAR>`.
- Penyiapan plaintext yang sudah ada tetap berfungsi tanpa perubahan.

<Note>
Kiat headless dan server: selesaikan OAuth di mesin yang memiliki peramban, lalu salin
`auth-profiles.json` milik agen tersebut (misalnya
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, atau jalur
`$OPENCLAW_STATE_DIR/...` yang sesuai) ke host gateway. `credentials/oauth.json`
hanya merupakan sumber impor lama.
</Note>

## Keluaran dan internal

Bidang umum di `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` saat `--skip-bootstrap` diteruskan
- `agents.defaults.model` / `models.providers` (jika Minimax dipilih)
- `tools.profile` (penyiapan awal lokal menggunakan default `"coding"` saat belum diatur; nilai eksplisit yang sudah ada dipertahankan)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (penyiapan awal lokal menggunakan default `per-channel-peer` saat belum diatur; nilai eksplisit yang sudah ada dipertahankan)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Daftar izin channel (Slack, Discord, Matrix, Microsoft Teams) saat Anda ikut serta selama prompt (nama diselesaikan menjadi ID jika memungkinkan)
- `skills.install.nodeManager`
  - Flag `setup --node-manager` menerima `npm`, `pnpm`, atau `bun`.
  - Konfigurasi manual tetap dapat mengatur `skills.install.nodeManager: "yarn"` nanti.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` menulis `agents.list[]` dan `bindings` opsional.

Kredensial WhatsApp ditempatkan di bawah `~/.openclaw/credentials/whatsapp/<accountId>/`.
Sesi disimpan di bawah `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
Beberapa channel dikirim sebagai plugin. Saat dipilih selama penyiapan, wizard
meminta untuk memasang plugin (npm atau jalur lokal) sebelum konfigurasi channel.
</Note>

RPC wizard Gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Klien (aplikasi macOS dan UI Kontrol) dapat merender langkah-langkah tanpa mengimplementasikan ulang logika penyiapan awal.

Perilaku penyiapan Signal:

- Mengunduh aset rilis yang sesuai
- Menyimpannya di bawah `~/.openclaw/tools/signal-cli/<version>/`
- Menulis `channels.signal.cliPath` dalam konfigurasi
- Build JVM memerlukan Java 21
- Build native digunakan saat tersedia
- Windows menggunakan WSL2 dan mengikuti alur signal-cli Linux di dalam WSL

## Dokumentasi terkait

- Pusat penyiapan awal: [Penyiapan Awal (CLI)](/id/start/wizard)
- Otomatisasi dan skrip: [Otomatisasi CLI](/id/start/wizard-cli-automation)
- Referensi perintah: [`openclaw onboard`](/id/cli/onboard)
