---
read_when:
    - Anda memerlukan perilaku terperinci untuk `openclaw onboard`
    - Anda sedang men-debug hasil onboarding atau mengintegrasikan klien onboarding
sidebarTitle: CLI reference
summary: Referensi lengkap untuk alur penyiapan CLI, penyiapan auth/model, output, dan internal
title: Referensi Penyiapan CLI
x-i18n:
    generated_at: "2026-04-05T14:07:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ec4e685e3237e450d11c45826c2bb34b82c0bba1162335f8fbb07f51ba00a70
    source_path: start/wizard-cli-reference.md
    workflow: 15
---

# Referensi Penyiapan CLI

Halaman ini adalah referensi lengkap untuk `openclaw onboard`.
Untuk panduan singkat, lihat [Onboarding (CLI)](/start/wizard).

## Apa yang dilakukan wizard

Mode lokal (default) memandu Anda melalui:

- Penyiapan model dan auth (OAuth langganan OpenAI Code, Anthropic Claude CLI atau API key, ditambah opsi MiniMax, GLM, Ollama, Moonshot, StepFun, dan AI Gateway)
- Lokasi workspace dan file bootstrap
- Pengaturan Gateway (port, bind, auth, tailscale)
- Channel dan provider (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, BlueBubbles, dan plugin channel bawaan lainnya)
- Instalasi daemon (LaunchAgent, unit user systemd, atau Scheduled Task Windows native dengan fallback folder Startup)
- Pemeriksaan kesehatan
- Penyiapan Skills

Mode remote mengonfigurasi mesin ini untuk terhubung ke gateway di tempat lain.
Mode ini tidak menginstal atau memodifikasi apa pun di host remote.

## Detail alur lokal

<Steps>
  <Step title="Deteksi konfigurasi yang ada">
    - Jika `~/.openclaw/openclaw.json` ada, pilih Keep, Modify, atau Reset.
    - Menjalankan ulang wizard tidak menghapus apa pun kecuali Anda secara eksplisit memilih Reset (atau memberikan `--reset`).
    - CLI `--reset` secara default menggunakan `config+creds+sessions`; gunakan `--reset-scope full` untuk juga menghapus workspace.
    - Jika konfigurasi tidak valid atau berisi key lama, wizard berhenti dan meminta Anda menjalankan `openclaw doctor` sebelum melanjutkan.
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
    - Mengisi file workspace yang diperlukan untuk ritual bootstrap pertama kali.
    - Tata letak workspace: [Workspace agen](/id/concepts/agent-workspace).
  </Step>
  <Step title="Gateway">
    - Menanyakan port, bind, mode auth, dan eksposur tailscale.
    - Disarankan: tetap aktifkan auth token bahkan untuk loopback agar klien WS lokal harus diautentikasi.
    - Dalam mode token, penyiapan interaktif menawarkan:
      - **Buat/simpan token plaintext** (default)
      - **Gunakan SecretRef** (opsional)
    - Dalam mode password, penyiapan interaktif juga mendukung penyimpanan plaintext atau SecretRef.
    - Jalur SecretRef token non-interaktif: `--gateway-token-ref-env <ENV_VAR>`.
      - Memerlukan env var yang tidak kosong di environment proses onboarding.
      - Tidak dapat digabungkan dengan `--gateway-token`.
    - Nonaktifkan auth hanya jika Anda sepenuhnya memercayai setiap proses lokal.
    - Bind non-loopback tetap memerlukan auth.
  </Step>
  <Step title="Channel">
    - [WhatsApp](/id/channels/whatsapp): login QR opsional
    - [Telegram](/id/channels/telegram): bot token
    - [Discord](/id/channels/discord): bot token
    - [Google Chat](/id/channels/googlechat): JSON service account + webhook audience
    - [Mattermost](/id/channels/mattermost): bot token + URL dasar
    - [Signal](/id/channels/signal): instalasi `signal-cli` opsional + konfigurasi akun
    - [BlueBubbles](/id/channels/bluebubbles): direkomendasikan untuk iMessage; URL server + password + webhook
    - [iMessage](/id/channels/imessage): jalur CLI `imsg` lama + akses DB
    - Keamanan DM: default-nya adalah pairing. DM pertama mengirim kode; setujui melalui
      `openclaw pairing approve <channel> <code>` atau gunakan allowlist.
  </Step>
  <Step title="Instalasi daemon">
    - macOS: LaunchAgent
      - Memerlukan sesi pengguna yang sedang login; untuk headless, gunakan LaunchDaemon kustom (tidak disertakan).
    - Linux dan Windows melalui WSL2: unit user systemd
      - Wizard mencoba `loginctl enable-linger <user>` agar gateway tetap aktif setelah logout.
      - Mungkin meminta sudo (menulis ke `/var/lib/systemd/linger`); pertama-tama mencoba tanpa sudo.
    - Windows native: Scheduled Task terlebih dahulu
      - Jika pembuatan task ditolak, OpenClaw beralih ke item login folder Startup per pengguna dan segera memulai gateway.
      - Scheduled Task tetap lebih disukai karena memberikan status supervisor yang lebih baik.
    - Pemilihan runtime: Node (disarankan; diperlukan untuk WhatsApp dan Telegram). Bun tidak disarankan.
  </Step>
  <Step title="Pemeriksaan kesehatan">
    - Memulai gateway (jika diperlukan) dan menjalankan `openclaw health`.
    - `openclaw status --deep` menambahkan probe kesehatan gateway langsung ke output status, termasuk probe channel jika didukung.
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

Mode remote mengonfigurasi mesin ini untuk terhubung ke gateway di tempat lain.

<Info>
Mode remote tidak menginstal atau memodifikasi apa pun di host remote.
</Info>

Yang Anda atur:

- URL gateway remote (`ws://...`)
- Token jika auth gateway remote diperlukan (disarankan)

<Note>
- Jika gateway hanya loopback, gunakan tunneling SSH atau tailnet.
- Petunjuk discovery:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)
</Note>

## Opsi auth dan model

<AccordionGroup>
  <Accordion title="Anthropic API key">
    Menggunakan `ANTHROPIC_API_KEY` jika ada atau meminta key, lalu menyimpannya untuk penggunaan daemon.
  </Accordion>
  <Accordion title="Anthropic Claude CLI">
    Menggunakan kembali login Claude CLI lokal di host gateway dan mengalihkan pemilihan model
    ke ref kanonis `claude-cli/claude-*`.

    Ini adalah jalur fallback lokal yang tersedia di `openclaw onboard` dan
    `openclaw configure`. Untuk produksi, lebih baik gunakan Anthropic API key.

    - macOS: memeriksa item Keychain "Claude Code-credentials"
    - Linux dan Windows: menggunakan kembali `~/.claude/.credentials.json` jika ada

    Di macOS, pilih "Always Allow" agar start dari launchd tidak terblokir.

  </Accordion>
  <Accordion title="Langganan OpenAI Code (penggunaan ulang Codex CLI)">
    Jika `~/.codex/auth.json` ada, wizard dapat menggunakannya kembali.
    Kredensial Codex CLI yang digunakan kembali tetap dikelola oleh Codex CLI; saat kedaluwarsa OpenClaw
    akan membaca ulang sumber itu terlebih dahulu dan, saat provider dapat merefreshnya, menulis
    kredensial yang telah direfresh kembali ke penyimpanan Codex alih-alih mengambil alih pengelolaannya
    sendiri.
  </Accordion>
  <Accordion title="Langganan OpenAI Code (OAuth)">
    Alur browser; tempel `code#state`.

    Mengatur `agents.defaults.model` ke `openai-codex/gpt-5.4` saat model belum disetel atau `openai/*`.

  </Accordion>
  <Accordion title="OpenAI API key">
    Menggunakan `OPENAI_API_KEY` jika ada atau meminta key, lalu menyimpan kredensial di auth profile.

    Mengatur `agents.defaults.model` ke `openai/gpt-5.4` saat model belum disetel, `openai/*`, atau `openai-codex/*`.

  </Accordion>
  <Accordion title="xAI (Grok) API key">
    Meminta `XAI_API_KEY` dan mengonfigurasi xAI sebagai provider model.
  </Accordion>
  <Accordion title="OpenCode">
    Meminta `OPENCODE_API_KEY` (atau `OPENCODE_ZEN_API_KEY`) dan memungkinkan Anda memilih katalog Zen atau Go.
    URL penyiapan: [opencode.ai/auth](https://opencode.ai/auth).
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
    Konfigurasi ditulis otomatis. Default hosted adalah `MiniMax-M2.7`; penyiapan API-key menggunakan
    `minimax/...`, dan penyiapan OAuth menggunakan `minimax-portal/...`.
    Detail lebih lanjut: [MiniMax](/id/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    Konfigurasi ditulis otomatis untuk StepFun standard atau Step Plan pada endpoint China atau global.
    Saat ini Standard mencakup `step-3.5-flash`, dan Step Plan juga mencakup `step-3.5-flash-2603`.
    Detail lebih lanjut: [StepFun](/id/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (kompatibel Anthropic)">
    Meminta `SYNTHETIC_API_KEY`.
    Detail lebih lanjut: [Synthetic](/id/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud dan model terbuka lokal)">
    Meminta base URL (default `http://127.0.0.1:11434`), lalu menawarkan mode Cloud + Local atau Local.
    Menemukan model yang tersedia dan menyarankan default.
    Detail lebih lanjut: [Ollama](/id/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot dan Kimi Coding">
    Konfigurasi Moonshot (Kimi K2) dan Kimi Coding ditulis otomatis.
    Detail lebih lanjut: [Moonshot AI (Kimi + Kimi Coding)](/id/providers/moonshot).
  </Accordion>
  <Accordion title="Provider kustom">
    Berfungsi dengan endpoint yang kompatibel dengan OpenAI dan Anthropic.

    Onboarding interaktif mendukung pilihan penyimpanan API key yang sama seperti alur API key provider lainnya:
    - **Tempel API key sekarang** (plaintext)
    - **Gunakan secret reference** (referensi env atau referensi provider yang dikonfigurasi, dengan validasi preflight)

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
- Saat onboarding dimulai dari pilihan auth provider, pemilih model secara otomatis
  memprioritaskan provider tersebut. Untuk Volcengine dan BytePlus, preferensi yang sama
  juga mencocokkan varian coding-plan mereka (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Jika filter provider yang diprioritaskan itu kosong, pemilih akan fallback ke
  katalog penuh alih-alih tidak menampilkan model apa pun.
- Wizard menjalankan pemeriksaan model dan memperingatkan jika model yang dikonfigurasi tidak dikenal atau auth tidak ada.

Jalur kredensial dan profile:

- Auth profile (API key + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Impor OAuth lama: `~/.openclaw/credentials/oauth.json`

Mode penyimpanan kredensial:

- Perilaku onboarding default menyimpan API key sebagai nilai plaintext di auth profile.
- `--secret-input-mode ref` mengaktifkan mode referensi alih-alih penyimpanan key plaintext.
  Dalam penyiapan interaktif, Anda dapat memilih salah satu:
  - referensi env var (misalnya `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - referensi provider yang dikonfigurasi (`file` atau `exec`) dengan alias provider + id
- Mode referensi interaktif menjalankan validasi preflight cepat sebelum menyimpan.
  - Referensi env: memvalidasi nama variabel + nilai tidak kosong di environment onboarding saat ini.
  - Referensi provider: memvalidasi konfigurasi provider dan me-resolve id yang diminta.
  - Jika preflight gagal, onboarding menampilkan error dan memungkinkan Anda mencoba lagi.
- Dalam mode non-interaktif, `--secret-input-mode ref` hanya didukung dengan env.
  - Set env var provider di environment proses onboarding.
  - Flag key inline (misalnya `--openai-api-key`) mengharuskan env var itu disetel; jika tidak, onboarding gagal cepat.
  - Untuk provider kustom, mode `ref` non-interaktif menyimpan `models.providers.<id>.apiKey` sebagai `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - Dalam kasus provider kustom itu, `--custom-api-key` mengharuskan `CUSTOM_API_KEY` disetel; jika tidak, onboarding gagal cepat.
- Kredensial auth gateway mendukung pilihan plaintext dan SecretRef dalam penyiapan interaktif:
  - Mode token: **Buat/simpan token plaintext** (default) atau **Gunakan SecretRef**.
  - Mode password: plaintext atau SecretRef.
- Jalur SecretRef token non-interaktif: `--gateway-token-ref-env <ENV_VAR>`.
- Penyiapan plaintext yang sudah ada tetap berfungsi tanpa perubahan.

<Note>
Tip headless dan server: selesaikan OAuth di mesin yang memiliki browser, lalu salin
`auth-profiles.json` milik agen tersebut (misalnya
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, atau jalur
`$OPENCLAW_STATE_DIR/...` yang sesuai) ke host gateway. `credentials/oauth.json`
hanyalah sumber impor lama.
</Note>

## Output dan internal

Bidang umum dalam `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (jika Minimax dipilih)
- `tools.profile` (onboarding lokal secara default mengatur ini ke `"coding"` saat belum disetel; nilai eksplisit yang sudah ada tetap dipertahankan)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (onboarding lokal secara default mengatur ini ke `per-channel-peer` saat belum disetel; nilai eksplisit yang sudah ada tetap dipertahankan)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Allowlist channel (Slack, Discord, Matrix, Microsoft Teams) saat Anda memilih ikut serta selama prompt (nama di-resolve ke ID jika memungkinkan)
- `skills.install.nodeManager`
  - Flag `setup --node-manager` menerima `npm`, `pnpm`, atau `bun`.
  - Konfigurasi manual masih dapat mengatur `skills.install.nodeManager: "yarn"` nanti.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` menulis `agents.list[]` dan `bindings` opsional.

Kredensial WhatsApp berada di `~/.openclaw/credentials/whatsapp/<accountId>/`.
Sesi disimpan di `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
Beberapa channel dikirimkan sebagai plugin. Saat dipilih selama penyiapan, wizard
meminta untuk menginstal plugin (npm atau jalur lokal) sebelum konfigurasi channel.
</Note>

RPC wizard gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Klien (aplikasi macOS dan Control UI) dapat merender langkah tanpa mengimplementasikan ulang logika onboarding.

Perilaku penyiapan Signal:

- Mengunduh aset rilis yang sesuai
- Menyimpannya di `~/.openclaw/tools/signal-cli/<version>/`
- Menulis `channels.signal.cliPath` di konfigurasi
- Build JVM memerlukan Java 21
- Build native digunakan saat tersedia
- Windows menggunakan WSL2 dan mengikuti alur Linux signal-cli di dalam WSL

## Dokumen terkait

- Pusat onboarding: [Onboarding (CLI)](/start/wizard)
- Otomatisasi dan skrip: [Otomatisasi CLI](/start/wizard-cli-automation)
- Referensi perintah: [`openclaw onboard`](/cli/onboard)
