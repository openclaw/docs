---
read_when:
    - Anda memerlukan perilaku terperinci untuk langkah `openclaw onboard` tertentu
    - Anda sedang men-debug hasil onboarding atau mengintegrasikan klien onboarding
sidebarTitle: CLI reference
summary: 'Perilaku langkah demi langkah untuk openclaw onboard: fungsi setiap langkah, konfigurasi yang ditulis, dan cara kerja internalnya'
title: Referensi penyiapan CLI
x-i18n:
    generated_at: "2026-07-16T18:46:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 96c1469c6b64f08fd9105c8b737df164d39d27d051bbb9bb4f76b9e1e057785d
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

Halaman ini membahas perilaku, keluaran, dan bagian internal onboarding langkah demi langkah.
Untuk panduan, lihat [Onboarding (CLI)](/id/start/wizard). Untuk referensi lengkap flag CLI
(setiap `--flag`, contoh noninteraktif, perintah khusus
penyedia), lihat [`openclaw onboard`](/id/cli/onboard).

## Yang dilakukan wizard

Mode lokal (default) memandu Anda melalui:

- Penyiapan model dan autentikasi (Anthropic, OAuth langganan OpenAI Code, xAI, OpenCode, endpoint kustom, dan alur autentikasi milik penyedia lainnya)
- Lokasi ruang kerja dan file bootstrap
- Pengaturan Gateway (port, bind, autentikasi, Tailscale)
- Channel dan penyedia (Discord, Feishu, Google Chat, iMessage, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp, serta channel bawaan atau Plugin lainnya)
- Penyedia pencarian web (opsional)
- Instalasi daemon (LaunchAgent, unit pengguna systemd, atau Windows Scheduled Task native dengan fallback folder Startup)
- Pemeriksaan kesehatan
- Penyiapan Skills

Mode jarak jauh mengonfigurasi mesin ini agar terhubung ke Gateway di tempat lain. Mode ini
tidak menginstal atau mengubah apa pun pada host jarak jauh.

## Detail alur lokal

<Steps>
  <Step title="Deteksi konfigurasi yang ada">
    - Jika `~/.openclaw/openclaw.json` ada, pilih **Pertahankan nilai saat ini**, **Tinjau dan perbarui**, atau **Reset sebelum penyiapan**.
    - Menjalankan ulang wizard tidak menghapus apa pun kecuali Anda secara eksplisit memilih Reset (atau meneruskan `--reset`).
    - CLI `--reset` secara default menggunakan `config+creds+sessions`; gunakan `--reset-scope full` untuk juga menghapus ruang kerja.
    - Jika konfigurasi tidak valid atau berisi kunci lama, wizard berhenti dan meminta Anda menjalankan `openclaw doctor` sebelum melanjutkan.
    - Reset memindahkan status ke Trash (tidak pernah menghapus secara langsung) dan menawarkan cakupan:
      - Hanya konfigurasi
      - Konfigurasi + kredensial + sesi
      - Reset penuh (juga menghapus ruang kerja)

  </Step>
  <Step title="Model dan autentikasi">
    - Matriks opsi lengkap tersedia di [Opsi autentikasi dan model](#auth-and-model-options).

  </Step>
  <Step title="Ruang kerja">
    - Default `~/.openclaw/workspace` (dapat dikonfigurasi).
    - Menyediakan file ruang kerja yang diperlukan untuk bootstrap saat pertama kali dijalankan.
    - Tata letak ruang kerja: [Ruang kerja agen](/id/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - Meminta port, bind, mode autentikasi, dan eksposur Tailscale.
    - Disarankan: tetap aktifkan autentikasi token bahkan untuk loopback agar klien WS lokal harus melakukan autentikasi.
    - Dalam mode token, penyiapan interaktif menawarkan:
      - **Buat/simpan token dalam teks biasa** (default)
      - **Gunakan SecretRef** (opsional)
    - Dalam mode kata sandi, penyiapan interaktif juga mendukung penyimpanan dalam teks biasa atau SecretRef.
    - Jalur SecretRef token noninteraktif: `--gateway-token-ref-env <ENV_VAR>`.
      - Memerlukan variabel lingkungan yang tidak kosong di lingkungan proses onboarding.
      - Tidak dapat digabungkan dengan `--gateway-token`.
    - Nonaktifkan autentikasi hanya jika Anda sepenuhnya memercayai setiap proses lokal.
    - Bind non-loopback tetap memerlukan autentikasi.

  </Step>
  <Step title="Channel">
    - [WhatsApp](/id/channels/whatsapp): login QR opsional
    - [Telegram](/id/channels/telegram): token bot
    - [Discord](/id/channels/discord): token bot
    - [Google Chat](/id/channels/googlechat): JSON akun layanan + audiens Webhook
    - [Mattermost](/id/channels/mattermost): token bot + URL dasar
    - [Signal](/id/channels/signal): instalasi `signal-cli` opsional + konfigurasi akun
    - [iMessage](/id/channels/imessage): jalur CLI `imsg` + akses DB Messages; gunakan pembungkus SSH saat Gateway berjalan di luar Mac
    - Keamanan DM: default-nya adalah pemasangan. DM pertama mengirim kode; setujui melalui
      `openclaw pairing approve <channel> <code>` atau gunakan daftar izin.
  </Step>
  <Step title="Pencarian web">
    - Pilih penyedia (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily) atau lewati.
    - Lewati langkah ini dengan `--skip-search`; konfigurasi ulang nanti dengan `openclaw configure --section web`.

  </Step>
  <Step title="Instalasi daemon">
    - macOS: LaunchAgent
      - Memerlukan sesi pengguna yang sedang login; untuk sistem headless, gunakan LaunchDaemon kustom (tidak disertakan).
    - Linux dan Windows melalui WSL2: unit pengguna systemd
      - Wizard mencoba `loginctl enable-linger <user>` agar gateway tetap berjalan setelah logout.
      - Mungkin meminta sudo (menulis `/var/lib/systemd/linger`); wizard mencobanya tanpa sudo terlebih dahulu.
    - Windows native: Scheduled Task terlebih dahulu
      - Jika pembuatan tugas ditolak, OpenClaw beralih ke item login folder Startup per pengguna dan segera memulai gateway.
      - Scheduled Tasks tetap diutamakan karena menyediakan status supervisor yang lebih baik.
    - Pemilihan runtime: Node diperlukan karena penyimpanan status runtime kanonis OpenClaw menggunakan `node:sqlite`.

  </Step>
  <Step title="Pemeriksaan kesehatan">
    - Memulai gateway (jika diperlukan) dan menjalankan `openclaw health`.
    - `openclaw status --deep` menambahkan pemeriksaan kesehatan gateway langsung ke keluaran status, termasuk pemeriksaan channel jika didukung.

  </Step>
  <Step title="Skills">
    - Membaca skill yang tersedia dan memeriksa persyaratan.
    - Memungkinkan Anda memilih pengelola node: npm, pnpm, atau bun.
    - Menginstal dependensi opsional untuk skill bawaan tepercaya saat penginstal yang diperlukan
      tersedia.
    - Melewati penginstal Homebrew, uv, dan Go yang tidak tersedia, lalu mengelompokkan skill yang terdampak
      beserta panduan penyiapan manual. Jalankan `openclaw doctor` setelah menginstal
      prasyarat yang belum tersedia.

  </Step>
  <Step title="Selesai">
    - Ringkasan dan langkah berikutnya, termasuk opsi aplikasi iOS, Android, dan macOS.

  </Step>
</Steps>

<Note>
Jika tidak ada GUI yang terdeteksi, wizard mencetak petunjuk penerusan port SSH untuk UI Kontrol alih-alih membuka browser.
Jika aset UI Kontrol tidak tersedia, wizard mencoba membangunnya; fallback-nya adalah `pnpm ui:build` (menginstal dependensi UI secara otomatis).
</Note>

## Detail mode jarak jauh

Mode jarak jauh mengonfigurasi mesin ini agar terhubung ke Gateway di tempat lain. Mode ini
tidak menginstal atau mengubah apa pun pada host jarak jauh.

Yang Anda tetapkan:

- URL gateway jarak jauh (`ws://...` atau `wss://...`)
- Token, kata sandi, atau tanpa autentikasi, sesuai dengan konfigurasi Gateway jarak jauh

<Steps>
  <Step title="Penemuan (opsional)">
    Jika `dns-sd` (macOS) atau `avahi-browse` (Linux) tersedia, onboarding
    menawarkan pencarian beacon gateway Bonjour/mDNS sebelum beralih ke
    entri URL manual. Penemuan DNS-SD area luas juga dicoba jika
    dikonfigurasi. Dokumentasi: [Penemuan Gateway](/id/gateway/discovery), [Bonjour](/id/gateway/bonjour).
  </Step>
  <Step title="Metode koneksi">
    Saat beacon dipilih, pilih WebSocket langsung atau tunnel SSH:
    - **Langsung**: terhubung melalui `wss://` dan meminta Anda memercayai
      sidik jari TLS yang ditemukan (penyematan berdasarkan kepercayaan pada penggunaan pertama; hanya disematkan jika Anda menyetujuinya).
    - **Tunnel SSH**: mencetak perintah `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
      untuk dijalankan terlebih dahulu, lalu terhubung ke endpoint tunnel lokal.
  </Step>
  <Step title="Autentikasi">
    Pilih token (disarankan), kata sandi, atau tanpa autentikasi, lalu secara opsional simpan
    sebagai SecretRef, bukan teks biasa.
  </Step>
</Steps>

<Note>
Jika gateway hanya menggunakan loopback dan tidak dapat ditemukan, gunakan tunnel SSH atau tailnet secara manual.
`ws://` teks biasa diterima untuk loopback, literal IP privat, `.local`, dan URL Tailnet `*.ts.net`; nama DNS privat lainnya memerlukan `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`.
</Note>

## Opsi autentikasi dan model

Jika langkah penyiapan penyedia gagal dalam onboarding interaktif (misalnya opsi penggunaan kembali CLI
tanpa login lokal), wizard menampilkan kesalahan dan kembali ke pemilih penyedia
alih-alih keluar. Proses `--auth-choice` eksplisit tetap langsung gagal untuk otomatisasi.

<AccordionGroup>
  <Accordion title="Kunci API Anthropic">
    Menggunakan `ANTHROPIC_API_KEY` jika tersedia atau meminta kunci, lalu menyimpannya untuk digunakan daemon.
  </Accordion>
  <Accordion title="CLI Anthropic Claude">
    Jalur lokal yang diutamakan dalam onboarding/konfigurasi interaktif; menggunakan kembali login Claude CLI yang ada jika tersedia.
  </Accordion>
  <Accordion title="Langganan OpenAI Code (OAuth)">
    Alur browser; tempel `code#state`.

    Pada penyiapan baru tanpa model utama, menetapkan `agents.defaults.model` ke
    `openai/gpt-5.6-sol` melalui runtime Codex.

  </Accordion>
  <Accordion title="Langganan OpenAI Code (pemasangan perangkat)">
    Alur pemasangan browser dengan kode perangkat berumur pendek.

    Pada penyiapan baru tanpa model utama, menetapkan `agents.defaults.model` ke
    `openai/gpt-5.6-sol` melalui runtime Codex.

  </Accordion>
  <Accordion title="Kunci API OpenAI">
    Menggunakan `OPENAI_API_KEY` jika tersedia atau meminta kunci, lalu menyimpan kredensial dalam profil autentikasi.

    Pada penyiapan baru tanpa model utama, menetapkan `agents.defaults.model` ke
    `openai/gpt-5.6`; ID model direct-API tanpa awalan diresolusikan ke tingkat Sol.

    Menambahkan atau mengautentikasi ulang OpenAI mempertahankan model utama eksplisit yang sudah ada,
    termasuk `openai/gpt-5.5`. Jika akun tidak menyediakan GPT-5.6,
    pilih `openai/gpt-5.5` secara eksplisit; OpenClaw tidak menurunkan versinya secara diam-diam.

  </Accordion>
  <Accordion title="OAuth xAI (Grok)">
    Login melalui browser untuk akun SuperGrok atau X Premium yang memenuhi syarat. Ini adalah
    jalur xAI yang direkomendasikan bagi sebagian besar pengguna. OpenClaw menyimpan profil
    autentikasi yang dihasilkan untuk model Grok, Grok `web_search`, `x_search`, dan `code_execution`.
  </Accordion>
  <Accordion title="Kode perangkat xAI (Grok)">
    Login melalui browser yang ramah akses jarak jauh dengan kode singkat, bukan callback
    localhost. Gunakan ini dari host SSH, Docker, atau VPS.
  </Accordion>
  <Accordion title="Kunci API xAI (Grok)">
    Meminta `XAI_API_KEY` dan mengonfigurasi xAI sebagai penyedia model. Gunakan ini
    jika Anda menginginkan kunci API xAI Console, bukan OAuth langganan.
  </Accordion>
  <Accordion title="OpenCode">
    Meminta `OPENCODE_API_KEY` (atau `OPENCODE_ZEN_API_KEY`) dan memungkinkan Anda memilih katalog Zen atau Go (satu kunci API mencakup keduanya).
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
    Meminta ID akun, ID gateway, dan `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Detail selengkapnya: [Cloudflare AI Gateway](/id/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    Konfigurasi ditulis secara otomatis. Default layanan terkelola adalah `MiniMax-M3`; penyiapan kunci API menggunakan
    `minimax/...`, dan penyiapan OAuth menggunakan `minimax-portal/...`.
    Detail selengkapnya: [MiniMax](/id/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    Konfigurasi ditulis secara otomatis untuk StepFun standar atau Step Plan pada endpoint Tiongkok atau global.
    Versi standar saat ini menyertakan `step-3.5-flash`, dan Step Plan juga menyertakan `step-3.5-flash-2603`.
    Detail selengkapnya: [StepFun](/id/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (kompatibel dengan Anthropic)">
    Meminta `SYNTHETIC_API_KEY`.
    Detail selengkapnya: [Synthetic](/id/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (model terbuka cloud dan lokal)">
    Meminta `Cloud + Local`, `Cloud only`, atau `Local only` terlebih dahulu.
    `Cloud only` menggunakan `OLLAMA_API_KEY` dengan `https://ollama.com`.
    Mode berbasis host meminta URL dasar (default `http://127.0.0.1:11434`), menemukan model yang tersedia, dan menyarankan default.
    `Cloud + Local` juga memeriksa apakah host Ollama tersebut telah login untuk akses cloud.
    Detail selengkapnya: [Ollama](/id/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot dan Kimi Coding">
    Konfigurasi Moonshot (Kimi K2) dan Kimi Coding ditulis secara otomatis.
    Detail selengkapnya: [Moonshot AI (Kimi + Kimi Coding)](/id/providers/moonshot).
  </Accordion>
  <Accordion title="Penyedia khusus">
    Berfungsi dengan endpoint yang kompatibel dengan OpenAI, OpenAI Responses, dan Anthropic.

    Orientasi interaktif mendukung pilihan penyimpanan kunci API yang sama seperti alur kunci API penyedia lainnya:
    - **Tempel kunci API sekarang** (teks biasa)
    - **Gunakan referensi rahasia** (referensi env atau referensi penyedia yang dikonfigurasi, dengan validasi pra-pemeriksaan)

    Orientasi menyimpulkan dukungan gambar untuk ID model visi umum (GPT-4o/4.1/5.x, Claude 3/4, Gemini, Qwen-VL, LLaVA, Pixtral, dan sejenisnya) dan hanya menanyakannya jika nama model tidak dikenal.

    Flag non-interaktif:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (opsional; kembali ke `CUSTOM_API_KEY`)
    - `--custom-provider-id` (opsional)
    - `--custom-compatibility <openai|openai-responses|anthropic>` (opsional; default `openai`)
    - `--custom-image-input` / `--custom-text-input` (opsional; menimpa kapabilitas input model yang disimpulkan)

  </Accordion>
  <Accordion title="Lewati">
    Membiarkan autentikasi tidak dikonfigurasi.
  </Accordion>
</AccordionGroup>

Perilaku model:

- Pilih model default dari opsi yang terdeteksi, atau masukkan penyedia dan model secara manual.
- Saat orientasi dimulai dari pilihan autentikasi penyedia, pemilih model secara otomatis memprioritaskan
  penyedia tersebut. Untuk Volcengine dan BytePlus, preferensi yang sama
  juga mencocokkan varian paket coding mereka (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Jika filter penyedia pilihan tersebut tidak menghasilkan apa pun, pemilih akan kembali ke
  katalog lengkap alih-alih tidak menampilkan model.
- Wizard menjalankan pemeriksaan model dan memperingatkan jika model yang dikonfigurasi tidak dikenal atau autentikasinya tidak tersedia.

Jalur kredensial dan profil:

- Profil autentikasi (kunci API + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Impor OAuth lama: `~/.openclaw/credentials/oauth.json`

Mode penyimpanan kredensial:

- Perilaku orientasi default menyimpan kunci API sebagai nilai teks biasa dalam profil autentikasi.
- `--secret-input-mode ref` mengaktifkan mode referensi sebagai pengganti penyimpanan kunci dalam teks biasa.
  Dalam penyiapan interaktif, Anda dapat memilih salah satu:
  - referensi variabel lingkungan (misalnya `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - referensi penyedia yang dikonfigurasi (`file` atau `exec`) dengan alias penyedia + id
- Mode referensi interaktif menjalankan validasi pra-pemeriksaan cepat sebelum menyimpan.
  - Referensi env: memvalidasi nama variabel + nilai yang tidak kosong dalam lingkungan orientasi saat ini.
  - Referensi penyedia: memvalidasi konfigurasi penyedia dan menemukan id yang diminta.
  - Jika pra-pemeriksaan gagal, orientasi menampilkan kesalahan dan memungkinkan Anda mencoba lagi.
- Dalam mode non-interaktif, `--secret-input-mode ref` hanya didukung oleh env.
  - Tetapkan variabel env penyedia dalam lingkungan proses orientasi.
  - Flag kunci sebaris (misalnya `--openai-api-key`) mengharuskan variabel env tersebut ditetapkan; jika tidak, orientasi langsung gagal.
  - Untuk penyedia khusus, mode non-interaktif `ref` menyimpan `models.providers.<id>.apiKey` sebagai `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - Dalam kasus penyedia khusus tersebut, `--custom-api-key` mengharuskan `CUSTOM_API_KEY` ditetapkan; jika tidak, orientasi langsung gagal.
- Kredensial autentikasi Gateway mendukung pilihan teks biasa dan SecretRef dalam penyiapan interaktif:
  - Mode token: **Buat/simpan token teks biasa** (default) atau **Gunakan SecretRef**.
  - Mode kata sandi: teks biasa atau SecretRef.
- Jalur SecretRef token non-interaktif: `--gateway-token-ref-env <ENV_VAR>`.
- Penyiapan teks biasa yang sudah ada tetap berfungsi tanpa perubahan.

<Note>
Kiat untuk sistem tanpa antarmuka grafis dan server: selesaikan OAuth pada mesin yang memiliki browser, lalu salin
`auth-profiles.json` milik agen tersebut (misalnya
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, atau jalur
`$OPENCLAW_STATE_DIR/...` yang sesuai) ke host gateway. `credentials/oauth.json`
hanya merupakan sumber impor lama.
</Note>

## Keluaran dan internal

Kolom umum dalam `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` ketika `--skip-bootstrap` diteruskan
- `agents.defaults.model` / `models.providers` (jika Minimax dipilih)
- `tools.profile` (orientasi lokal menggunakan default `"coding"` jika belum ditetapkan; nilai eksplisit yang sudah ada dipertahankan)
- `gateway.*` (mode, pengikatan, autentikasi, tailscale)
- `session.dmScope` (orientasi lokal menetapkannya secara default ke `per-channel-peer` jika belum ditetapkan; nilai eksplisit yang sudah ada dipertahankan)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Daftar izin channel (Discord, iMessage, Signal, Slack, Telegram, WhatsApp) ketika Anda memilih ikut serta selama permintaan; Discord dan Slack juga mengubah nama yang dimasukkan menjadi ID
- `skills.install.nodeManager`
  - Flag `setup --node-manager` menerima `npm`, `pnpm`, atau `bun`.
  - Konfigurasi manual tetap dapat menetapkan `skills.install.nodeManager: "yarn"` nanti.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

`openclaw agents add` menulis `agents.list[]` dan `bindings` opsional.

Kredensial WhatsApp disimpan di bawah `~/.openclaw/credentials/whatsapp/<accountId>/`.
Sesi aktif dan transkrip disimpan di
`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`. Direktori
`~/.openclaw/agents/<agentId>/sessions/` digunakan untuk masukan migrasi lama
serta artefak arsip/dukungan.

<Note>
Beberapa channel disediakan sebagai plugin. Saat dipilih selama penyiapan, wizard
meminta pemasangan plugin (npm atau jalur lokal) sebelum konfigurasi channel.
</Note>

## Penyiapan non-interaktif

`--non-interactive` memerlukan `--accept-risk` (menyatakan pemahaman bahwa agen
sangat berdaya dan akses penuh ke sistem berisiko):

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY"
```

Referensi flag lengkap dan contoh khusus penyedia: [`openclaw onboard`](/id/cli/onboard), [Otomatisasi CLI](/id/start/wizard-cli-automation).

## RPC wizard Gateway

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Klien (aplikasi macOS dan UI Kontrol) dapat merender langkah tanpa mengimplementasikan ulang logika orientasi.

## Perilaku penyiapan Signal

- Mengunduh aset rilis yang sesuai dari rilis GitHub resmi `signal-cli` (build native, hanya Linux x86-64)
- Pada platform lain (macOS, Linux non-x64), memasang melalui Homebrew sebagai gantinya
- Menyimpan pemasangan aset rilis di bawah `~/.openclaw/tools/signal-cli/<version>/`
- Menulis `channels.signal.cliPath` dalam konfigurasi
- Windows native belum didukung; jalankan orientasi di dalam WSL2 untuk mendapatkan jalur pemasangan Linux

## Dokumen terkait

- Pusat orientasi: [Orientasi (CLI)](/id/start/wizard)
- Otomatisasi dan skrip: [Otomatisasi CLI](/id/start/wizard-cli-automation)
- Referensi perintah: [`openclaw onboard`](/id/cli/onboard)
