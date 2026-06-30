---
read_when:
    - Anda memerlukan perilaku terperinci untuk openclaw onboard
    - Anda sedang men-debug hasil onboarding atau mengintegrasikan klien onboarding
sidebarTitle: CLI reference
summary: Referensi lengkap untuk alur penyiapan CLI, penyiapan autentikasi/model, keluaran, dan internal
title: Referensi penyiapan CLI
x-i18n:
    generated_at: "2026-06-30T22:35:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9be3e95a300707eade19f5c7fdf6f3a330ffe7e1e83866b36fb9bd1f742256ef
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

Halaman ini adalah referensi lengkap untuk `openclaw onboard`.
Untuk panduan singkat, lihat [Onboarding (CLI)](/id/start/wizard).

## Yang dilakukan wizard

Mode lokal (default) memandu Anda melalui:

- Penyiapan model dan auth (OAuth langganan OpenAI Code, Anthropic Claude CLI atau kunci API, serta opsi MiniMax, GLM, Ollama, Moonshot, StepFun, dan AI Gateway)
- Lokasi workspace dan file bootstrap
- Pengaturan Gateway (port, bind, auth, Tailscale)
- Channel dan penyedia (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, iMessage, dan plugin channel bawaan lainnya)
- Instalasi daemon (LaunchAgent, unit pengguna systemd, atau native Windows Scheduled Task dengan fallback folder Startup)
- Pemeriksaan kesehatan
- Penyiapan Skills

Mode jarak jauh mengonfigurasi mesin ini untuk terhubung ke gateway di tempat lain.
Mode ini tidak menginstal atau mengubah apa pun pada host jarak jauh.

## Detail alur lokal

<Steps>
  <Step title="Deteksi config yang ada">
    - Jika `~/.openclaw/openclaw.json` ada, pilih Keep, Modify, atau Reset.
    - Menjalankan ulang wizard tidak menghapus apa pun kecuali Anda secara eksplisit memilih Reset (atau meneruskan `--reset`).
    - CLI `--reset` default ke `config+creds+sessions`; gunakan `--reset-scope full` untuk juga menghapus workspace.
    - Jika config tidak valid atau berisi key legacy, wizard berhenti dan meminta Anda menjalankan `openclaw doctor` sebelum melanjutkan.
    - Reset menggunakan `trash` dan menawarkan cakupan:
      - Config saja
      - Config + kredensial + sesi
      - Reset penuh (juga menghapus workspace)

  </Step>
  <Step title="Model dan auth">
    - Matriks opsi lengkap ada di [Opsi auth dan model](#auth-and-model-options).

  </Step>
  <Step title="Workspace">
    - Default `~/.openclaw/workspace` (dapat dikonfigurasi).
    - Mengisi file workspace yang diperlukan untuk ritual bootstrap pertama kali.
    - Tata letak workspace: [Workspace agen](/id/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - Meminta port, bind, mode auth, dan paparan Tailscale.
    - Direkomendasikan: tetap aktifkan auth token bahkan untuk loopback agar klien WS lokal harus diautentikasi.
    - Dalam mode token, penyiapan interaktif menawarkan:
      - **Buat/simpan token plaintext** (default)
      - **Gunakan SecretRef** (opt-in)
    - Dalam mode password, penyiapan interaktif juga mendukung penyimpanan plaintext atau SecretRef.
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
    - [Signal](/id/channels/signal): instalasi `signal-cli` opsional + config akun
    - [iMessage](/id/channels/imessage): path CLI `imsg` + akses DB Messages; gunakan wrapper SSH saat Gateway berjalan di luar Mac
    - Keamanan DM: default adalah pairing. DM pertama mengirim kode; setujui melalui
      `openclaw pairing approve <channel> <code>` atau gunakan allowlist.
  </Step>
  <Step title="Instalasi daemon">
    - macOS: LaunchAgent
      - Memerlukan sesi pengguna yang sudah login; untuk headless, gunakan LaunchDaemon kustom (tidak dikirimkan).
    - Linux dan Windows melalui WSL2: unit pengguna systemd
      - Wizard mencoba `loginctl enable-linger <user>` agar gateway tetap aktif setelah logout.
      - Dapat meminta sudo (menulis `/var/lib/systemd/linger`); wizard mencoba tanpa sudo terlebih dahulu.
    - Native Windows: Scheduled Task terlebih dahulu
      - Jika pembuatan task ditolak, OpenClaw fallback ke item login folder Startup per pengguna dan langsung memulai gateway.
      - Scheduled Tasks tetap lebih disarankan karena menyediakan status supervisor yang lebih baik.
    - Pemilihan runtime: Node (direkomendasikan; diperlukan untuk WhatsApp dan Telegram). Bun tidak direkomendasikan.

  </Step>
  <Step title="Pemeriksaan kesehatan">
    - Memulai gateway (jika diperlukan) dan menjalankan `openclaw health`.
    - `openclaw status --deep` menambahkan probe kesehatan gateway live ke output status, termasuk probe channel saat didukung.

  </Step>
  <Step title="Skills">
    - Membaca skill yang tersedia dan memeriksa persyaratan.
    - Memungkinkan Anda memilih pengelola node: npm, pnpm, atau bun.
    - Menginstal dependensi opsional (sebagian menggunakan Homebrew di macOS).

  </Step>
  <Step title="Selesai">
    - Ringkasan dan langkah berikutnya, termasuk opsi aplikasi iOS, Android, dan macOS.

  </Step>
</Steps>

<Note>
Jika tidak ada GUI yang terdeteksi, wizard mencetak instruksi port-forward SSH untuk Control UI, bukan membuka browser.
Jika aset Control UI tidak ada, wizard mencoba membangunnya; fallback adalah `pnpm ui:build` (menginstal otomatis dependensi UI).
</Note>

## Detail mode jarak jauh

Mode jarak jauh mengonfigurasi mesin ini untuk terhubung ke gateway di tempat lain.

<Info>
Mode jarak jauh tidak menginstal atau mengubah apa pun pada host jarak jauh.
</Info>

Yang Anda tetapkan:

- URL gateway jarak jauh (`ws://...`)
- Token jika auth gateway jarak jauh diperlukan (direkomendasikan)

<Note>
- Jika gateway hanya loopback, gunakan tunneling SSH atau tailnet.
- Petunjuk discovery:
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

    Mengatur `agents.defaults.model` ke `openai/gpt-5.5` melalui runtime Codex saat model belum diatur atau sudah termasuk keluarga OpenAI.

  </Accordion>
  <Accordion title="Langganan OpenAI Code (pairing perangkat)">
    Alur pairing browser dengan kode perangkat berumur pendek.

    Mengatur `agents.defaults.model` ke `openai/gpt-5.5` melalui runtime Codex saat model belum diatur atau sudah termasuk keluarga OpenAI.

  </Accordion>
  <Accordion title="Kunci API OpenAI">
    Menggunakan `OPENAI_API_KEY` jika ada atau meminta kunci, lalu menyimpan kredensial dalam profil auth.

    Mengatur `agents.defaults.model` ke `openai/gpt-5.5` saat model belum diatur, `openai/*`, atau referensi model Codex legacy.

  </Accordion>
  <Accordion title="xAI (Grok) OAuth">
    Login browser untuk akun SuperGrok atau X Premium yang memenuhi syarat. Ini adalah
    jalur xAI yang direkomendasikan untuk sebagian besar pengguna. OpenClaw menyimpan profil
    auth yang dihasilkan untuk model Grok, Grok `web_search`, `x_search`, dan `code_execution`.
  </Accordion>
  <Accordion title="Kode perangkat xAI (Grok)">
    Login browser yang ramah jarak jauh dengan kode singkat, bukan callback localhost.
    Gunakan ini dari host SSH, Docker, atau VPS.
  </Accordion>
  <Accordion title="Kunci API xAI (Grok)">
    Meminta `XAI_API_KEY` dan mengonfigurasi xAI sebagai penyedia model. Gunakan ini
    saat Anda menginginkan kunci API xAI Console, bukan OAuth langganan.
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
    Detail lebih lanjut: [Vercel AI Gateway](/id/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Meminta ID akun, ID gateway, dan `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Detail lebih lanjut: [Cloudflare AI Gateway](/id/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    Config ditulis otomatis. Default hosted adalah `MiniMax-M3`; penyiapan kunci API menggunakan
    `minimax/...`, dan penyiapan OAuth menggunakan `minimax-portal/...`.
    Detail lebih lanjut: [MiniMax](/id/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    Config ditulis otomatis untuk StepFun standard atau Step Plan pada endpoint China atau global.
    Standard saat ini mencakup `step-3.5-flash`, dan Step Plan juga mencakup `step-3.5-flash-2603`.
    Detail lebih lanjut: [StepFun](/id/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (kompatibel dengan Anthropic)">
    Meminta `SYNTHETIC_API_KEY`.
    Detail lebih lanjut: [Synthetic](/id/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud dan model terbuka lokal)">
    Meminta `Cloud + Local`, `Cloud only`, atau `Local only` terlebih dahulu.
    `Cloud only` menggunakan `OLLAMA_API_KEY` dengan `https://ollama.com`.
    Mode berbasis host meminta URL dasar (default `http://127.0.0.1:11434`), menemukan model yang tersedia, dan menyarankan default.
    `Cloud + Local` juga memeriksa apakah host Ollama tersebut sudah login untuk akses cloud.
    Detail lebih lanjut: [Ollama](/id/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot dan Kimi Coding">
    Config Moonshot (Kimi K2) dan Kimi Coding ditulis otomatis.
    Detail lebih lanjut: [Moonshot AI (Kimi + Kimi Coding)](/id/providers/moonshot).
  </Accordion>
  <Accordion title="Penyedia kustom">
    Berfungsi dengan endpoint yang kompatibel dengan OpenAI dan Anthropic.

    Onboarding interaktif mendukung pilihan penyimpanan kunci API yang sama seperti alur kunci API penyedia lain:
    - **Tempel kunci API sekarang** (plaintext)
    - **Gunakan referensi rahasia** (env ref atau ref penyedia yang dikonfigurasi, dengan validasi preflight)

    Flag non-interaktif:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (opsional; fallback ke `CUSTOM_API_KEY`)
    - `--custom-provider-id` (opsional)
    - `--custom-compatibility <openai|openai-responses|anthropic>` (opsional; default `openai`)
    - `--custom-image-input` / `--custom-text-input` (opsional; menimpa kapabilitas input model yang disimpulkan)

  </Accordion>
  <Accordion title="Lewati">
    Membiarkan auth tidak dikonfigurasi.
  </Accordion>
</AccordionGroup>

Perilaku model:

- Pilih model default dari opsi yang terdeteksi, atau masukkan penyedia dan model secara manual.
- Onboarding penyedia kustom menyimpulkan dukungan gambar untuk ID model umum dan hanya bertanya saat nama model tidak dikenal.
- Saat onboarding dimulai dari pilihan auth penyedia, pemilih model secara otomatis memprioritaskan
  penyedia tersebut. Untuk Volcengine dan BytePlus, preferensi yang sama
  juga cocok dengan varian coding-plan mereka (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Jika filter penyedia prioritas tersebut kosong, pemilih fallback ke
  katalog lengkap alih-alih tidak menampilkan model.
- Wizard menjalankan pemeriksaan model dan memperingatkan jika model yang dikonfigurasi tidak dikenal atau auth hilang.

Path kredensial dan profil:

- Profil auth (kunci API + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Impor OAuth legacy: `~/.openclaw/credentials/oauth.json`

Mode penyimpanan kredensial:

- Perilaku onboarding default menyimpan kunci API sebagai nilai teks biasa dalam profil auth.
- `--secret-input-mode ref` mengaktifkan mode referensi alih-alih penyimpanan kunci teks biasa.
  Dalam penyiapan interaktif, Anda dapat memilih salah satu:
  - ref variabel lingkungan (misalnya `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - ref penyedia yang dikonfigurasi (`file` atau `exec`) dengan alias penyedia + id
- Mode referensi interaktif menjalankan validasi preflight cepat sebelum menyimpan.
  - Ref env: memvalidasi nama variabel + nilai yang tidak kosong di lingkungan onboarding saat ini.
  - Ref penyedia: memvalidasi konfigurasi penyedia dan me-resolve id yang diminta.
  - Jika preflight gagal, onboarding menampilkan kesalahan dan memungkinkan Anda mencoba lagi.
- Dalam mode non-interaktif, `--secret-input-mode ref` hanya didukung env.
  - Atur env var penyedia di lingkungan proses onboarding.
  - Flag kunci inline (misalnya `--openai-api-key`) mengharuskan env var tersebut diatur; jika tidak, onboarding gagal cepat.
  - Untuk penyedia khusus, mode `ref` non-interaktif menyimpan `models.providers.<id>.apiKey` sebagai `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - Dalam kasus penyedia khusus tersebut, `--custom-api-key` mengharuskan `CUSTOM_API_KEY` diatur; jika tidak, onboarding gagal cepat.
- Kredensial auth Gateway mendukung pilihan teks biasa dan SecretRef dalam penyiapan interaktif:
  - Mode token: **Buat/simpan token teks biasa** (default) atau **Gunakan SecretRef**.
  - Mode kata sandi: teks biasa atau SecretRef.
- Jalur SecretRef token non-interaktif: `--gateway-token-ref-env <ENV_VAR>`.
- Penyiapan teks biasa yang sudah ada tetap berfungsi tanpa perubahan.

<Note>
Kiat headless dan server: selesaikan OAuth pada mesin dengan browser, lalu salin
`auth-profiles.json` milik agen tersebut (misalnya
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, atau jalur
`$OPENCLAW_STATE_DIR/...` yang sesuai) ke host gateway. `credentials/oauth.json`
hanya merupakan sumber impor legacy.
</Note>

## Output dan internal

Field umum dalam `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` ketika `--skip-bootstrap` diteruskan
- `agents.defaults.model` / `models.providers` (jika Minimax dipilih)
- `tools.profile` (onboarding lokal default ke `"coding"` ketika tidak diatur; nilai eksplisit yang sudah ada dipertahankan)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (onboarding lokal menetapkan default ini ke `per-channel-peer` ketika tidak diatur; nilai eksplisit yang sudah ada dipertahankan)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Allowlist channel (Slack, Discord, Matrix, Microsoft Teams) ketika Anda ikut serta selama prompt (nama di-resolve menjadi ID jika memungkinkan)
- `skills.install.nodeManager`
  - Flag `setup --node-manager` menerima `npm`, `pnpm`, atau `bun`.
  - Konfigurasi manual masih dapat menetapkan `skills.install.nodeManager: "yarn"` nanti.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

`openclaw agents add` menulis `agents.list[]` dan `bindings` opsional.

Kredensial WhatsApp masuk ke bawah `~/.openclaw/credentials/whatsapp/<accountId>/`.
Sesi disimpan di bawah `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
Sebagian channel dikirimkan sebagai plugin. Ketika dipilih selama penyiapan, wizard
meminta untuk menginstal plugin (npm atau jalur lokal) sebelum konfigurasi channel.
</Note>

RPC wizard Gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Klien (aplikasi macOS dan Control UI) dapat merender langkah tanpa mengimplementasikan ulang logika onboarding.

Perilaku penyiapan Signal:

- Mengunduh aset rilis yang sesuai
- Menyimpannya di bawah `~/.openclaw/tools/signal-cli/<version>/`
- Menulis `channels.signal.cliPath` dalam konfigurasi
- Build JVM memerlukan Java 21
- Build native digunakan ketika tersedia
- Windows menggunakan WSL2 dan mengikuti alur signal-cli Linux di dalam WSL

## Dokumen terkait

- Hub onboarding: [Onboarding (CLI)](/id/start/wizard)
- Otomasi dan skrip: [Otomasi CLI](/id/start/wizard-cli-automation)
- Referensi perintah: [`openclaw onboard`](/id/cli/onboard)
